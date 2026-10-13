import { sportsStateAt, PLAYER_IDS, SPORTS_DURATION, BALL_SPIN_SPEED, actionTimeAt, contactEvents } from './sports-timeline.mjs';
import { playerBones } from './sports-rig.mjs';
import { MATCHES, TEAMS, CELEBRATION_DURATION } from './sports-matches.mjs';
import { courtTracks } from './sports-paths.mjs';
import { drawAthlete, drawStadium, drawCourts, drawBall, drawRoster } from './sports-art.mjs';
import { celebrationAt, drawCelebration } from './sports-celebration.mjs';
export { sportsStateAt, SPORTS_DURATION };

const n = value => Number(value.toFixed(3));
const transform = (kind, values) => kind==='translate' ? `translate(${n(values[0])}px,${n(values[1])}px)`
  : kind==='rotate' ? `rotate(${n(values[0])}deg)` : kind==='size'?`scale(${n(values[0])})`:`scaleX(${n(values[0])})`;

function valuesAt(state) {
  const values={};
  const add=(name,kind,values_,discrete=false) => {values[name]={kind,values:values_,discrete};};
  add('ball-position','translate',[state.ball.x,state.ball.y]);
  add('ball-rotation','rotate',[state.ball.rotation]);
  add('ball-glow','opacity',[state.morph*.9]);
  add('ball-halo','size',[1+state.morph*.65]);
  add('court-shimmer','opacity',[state.morph*.24]);
  const whistle=state.introDuration-1.5;
  add('intro-label','opacity',[state.phase==='intro'?windowIntro(state.matchTime,state.introDuration):0]);
  add('start-label','opacity',[state.phase==='intro'&&state.matchTime>=whistle?Math.min(1,(state.matchTime-whistle)*4,(state.introDuration-state.matchTime)*4):0]);
  add('point-label','opacity',[state.phase==='restart'?Math.max(0,1-(state.matchTime-state.round.scoreAt)/1.4):0]);
  const celebration=celebrationAt(state);
  add('celebration-opacity','opacity',[celebration.opacity]);
  add('celebration-color','color',[TEAMS[state.winner??'blue'].color],true);
  celebration.fireworks.forEach((firework,i)=>{
    add(`firework-${i}-rocket-position`,'translate',firework.rocket);
    add(`firework-${i}-rocket-opacity`,'opacity',[firework.rocketOpacity]);
    add(`firework-${i}-burst-opacity`,'opacity',[firework.burstOpacity]);
    add(`firework-${i}-burst-scale`,'size',[firework.scale]);
    add(`firework-${i}-burst-rotation`,'rotate',[firework.rotation]);
  });
  celebration.confetti.forEach((confetti,i)=>{
    add(`confetti-${i}-position`,'translate',confetti.position);
    add(`confetti-${i}-opacity`,'opacity',[confetti.opacity]);
    add(`confetti-${i}-rotation`,'rotate',[confetti.rotation]);
    add(`confetti-${i}-scale`,'size',[confetti.scale]);
  });
  for (const sport of ['football','basketball','volleyball']) {
    add(`${sport}-scene`,'opacity',[state.scenes[sport]]);
    add(`${sport}-skin`,'opacity',[state.scenes[sport]]);
    add(`${sport}-title`,'opacity',[Number(state.sport===sport)],true);
  }
  for (const id of PLAYER_IDS) {
    const player=state.players[id];
    for(let layer=0;layer<4;layer++) add(`${id}-layer-${layer}`,'opacity',[Number(player.layer===layer)],true);
    add(`${id}-position`,'translate',[player.x,player.y]);
    add(`${id}-size`,'size',[player.scale]);
    add(`${id}-shadow`,'translate',[player.x,player.floor+2]);
    add(`${id}-facing`,'scale',[player.facing],true);
    add(`${id}-number`,'scale',[player.facing],true);
    add(`${id}-lean`,'rotate',[player.lean]);
    add(`${id}-head`,'rotate',[player.headAngle]);
    for (const [limb,bones] of Object.entries(playerBones(player))) {
      add(`${id}-${limb}-upper`,'rotate',[bones.upper[2]]);
      // Nest the forearm/shin inside its parent bone. CSS interpolation can
      // change angles without ever pulling an elbow or knee apart.
      add(`${id}-${limb}-lower`,'rotate',[bones.lower[2]-bones.upper[2]]);
      if (limb.startsWith('leg')) add(`${id}-${limb}-shoe`,'rotate',[-bones.lower[2]]);
    }
  }
  for (const team of ['red','blue']) {
    for (let digit=0;digit<=3;digit++) add(`score-${team}-${digit}`,'opacity',[Number(state.score[team]===digit)],true);
    add(`winner-${team}`,'opacity',[Number(state.winner===team)],true);
    add(`possession-${team}`,'opacity',[Number(state.possession===team && state.sport!=='volleyball')],true);
    add(`serve-${team}`,'opacity',[Number(state.possession===team && state.sport==='volleyball')],true);
  }
  add('match-progress','scale',[Math.max(state.score.red,state.score.blue)/3]);
  return values;
}

// Remove redundant samples while bounding screen-space and joint-angle errors.
// This keeps the complete SVG much smaller than a frame-by-frame export.
function simplify(samples, kind) {
  const tolerances=kind==='opacity'?[.004]:kind==='rotate'?[1.2]:kind==='translate'?[.4,.4]:[.004];
  const retained=new Set([0,samples.length-1]);
  const visit=(first,last) => {
    let worst=1,index=-1;
    for (let i=first+1;i<last;i++) {
      const ratio=(samples[i].time-samples[first].time)/(samples[last].time-samples[first].time);
      const error=Math.max(...samples[i].values.map((value,axis)=>Math.abs(value-(samples[first].values[axis]+(samples[last].values[axis]-samples[first].values[axis])*ratio))/tolerances[axis]));
      if (error>worst) {worst=error;index=i;}
    }
    if (index!==-1) {retained.add(index);visit(first,index);visit(index,last);}
  };
  visit(0,samples.length-1);
  return [...retained].sort((a,b)=>a-b).map(index=>samples[index]);
}

const windowIntro = (time,duration) => time<duration-2?1:Math.max(0,(duration-1.5-time)*2);
let cachedCSS;
function animationCSS() {
  if(cachedCSS) return cachedCSS;
  const times=new Set(Array.from({length:Math.ceil(SPORTS_DURATION*12)+1},(_,index)=>Math.min(SPORTS_DURATION,index/12)));
  for (const [index,match] of MATCHES.entries()) {
    const offset=match.startAt;
    const addReturn=(start,plan)=>{
      for(const time of [0,plan.enter,plan.enter+plan.cross,plan.duration]) times.add(offset+start+time);
    };
    addReturn(0,match.introPlan);
    times.add(offset+match.introDuration);
    for (const round of match.rounds.slice(0,-1)) {
      addReturn(round.scoreAt,round.returnPlan);
    }
    addReturn(match.transitionStart,match.transitionPlan);
    for(let t=0;t<=CELEBRATION_DURATION;t+=1/24)times.add(offset+match.winAt+t);
    times.add(offset+match.winAt+CELEBRATION_DURATION);
    for(let i=0;i<6;i++){
      const start=.1+Math.floor(i/2)*.9+(i%2)*.18;
      for(const event of [start,start+.55,start+1.9])times.add(offset+match.winAt+event);
    }
    for (const round of match.rounds) {
      for (const time of [round.start,round.scoreAt]) times.add(offset+time);
      times.add(actionTimeAt(index,round.index,0));
      for (const event of contactEvents(index,round.index)) times.add(event.time);
      const actions=match.sport==='football'?[.75,1.35,1.55,1.6,1.85,1.95,2.05,2.1,2.2,2.4,3.15,3.7,3.85,4.15,5.1,6,6.35,6.65,6.85,7.2,8.8]
        :match.sport==='basketball'?[.8,1.4,1.55,1.6,1.8,1.85,2.1,2.2,2.4,2.5,3.2,3.85,4.25,4.9,5.1,5.15,5.95,6.2,6.55,6.8,7.2,7.24,7.4,7.75,8.8]:[1.1];
      for(const q of actions) times.add(actionTimeAt(index,round.index,q));
      for(const points of Object.values(courtTracks(match.sport,round))) {
        for(const [q] of points) if(q<= (match.sport==='volleyball'&&round.scorer!==round.possession?6.4:8.8)) times.add(actionTimeAt(index,round.index,q));
      }
    }
  }
  // Facing changes are discrete. Locate the actual crossing instead of waiting
  // for the next regular sample, which would leave a player looking away briefly.
  const sortedTimes=()=>[...new Set([...times].map(time=>Math.min(SPORTS_DURATION,Math.max(0,time))))].sort((a,b)=>a-b);
  const sampled=sortedTimes().map(time=>({time,state:sportsStateAt(time)}));
  for (let i=1;i<sampled.length;i++) {
    const from=sampled[i-1],to=sampled[i];
    for (const id of PLAYER_IDS) {
      for(const boundary of [233,263,293]) {
        const side=from.state.players[id].floor>=boundary;
        if(side===(to.state.players[id].floor>=boundary)) continue;
        let low=from.time,high=to.time;
        for(let step=0;step<32;step++) {
          const mid=(low+high)/2;
          if((sportsStateAt(mid).players[id].floor>=boundary)===side) low=mid;
          else high=mid;
        }
        times.add(Math.min(SPORTS_DURATION,high+.000001));
      }
      const facing=from.state.players[id].facing;
      if (facing===to.state.players[id].facing) continue;
      let low=from.time,high=to.time;
      for (let step=0;step<32;step++) {
        const mid=(low+high)/2;
        if (sportsStateAt(mid).players[id].facing===facing) low=mid;
        else high=mid;
      }
      times.add(Math.min(SPORTS_DURATION,high+.000001));
    }
  }
  const frames=sortedTimes().map(time=>{
    const state=sportsStateAt(time);
    if (time===SPORTS_DURATION) state.ball.rotation=SPORTS_DURATION*BALL_SPIN_SPEED+MATCHES.length*720;
    return {time,values:valuesAt(state)};
  });
  cachedCSS=Object.keys(frames[0].values).map(name=>{
    const {kind,discrete}=frames[0].values[name];
    let samples=frames.map(frame=>({time:frame.time,values:frame.values[name].values}));
    if (discrete) samples=samples.filter((sample,index,array)=>index===0 || index===array.length-1 || sample.values[0]!==array[index-1].values[0]);
    else samples=simplify(samples,kind);
    const property=kind==='opacity'?'opacity':kind==='color'?'color':'transform';
    const rules=samples.map(sample=>`${Number((sample.time/SPORTS_DURATION*100).toFixed(7))}%{${property}:${kind==='opacity'?n(sample.values[0]):kind==='color'?sample.values[0]:transform(kind,sample.values)}}`).join('');
    return `.sports-${name}{animation:sports-${name} ${SPORTS_DURATION}s ${discrete?'steps(1,end)':'linear'} infinite}@keyframes sports-${name}{${rules}}`;
  }).join('\n');
  return cachedCSS;
}

function playerSVG(id,layer) {
  const state=sportsStateAt(MATCHES[0].introDuration),player=state.players[id],initial=valuesAt(state);
  const group=(part,content) => {
    const value=initial[`${id}-${part}`];
    return `<g class="sports-animated sports-${id}-${part}" style="transform:${transform(value.kind,value.values)}${part==='lean'?';transform-origin:0px -41px':''}">${content}</g>`;
  };
  // One visible instance per athlete selects the correct court depth band.
  return `<g ${layer===3?'data-player':'data-player-copy'}="${id}" data-team="${player.team}" data-layer="${layer}" class="sports-animated sports-${id}-layer-${layer}" opacity="${player.layer===layer?1:0}">
    ${group('shadow','<ellipse rx="21" ry="5" fill="#173e44" opacity=".22"/>')}
    ${group('position',group('size',drawAthlete(id,player,group)))}
  </g>`;
}

export function renderSportsAnimation() {
  const digits=['red','blue'].map(team=>Array.from({length:4},(_,digit)=>`<text class="sports-animated sports-score-${team}-${digit}" opacity="${digit===0?1:0}" x="${team==='red'?488:696}" y="142" text-anchor="middle" fill="${TEAMS[team].color}" font-size="58" font-weight="bold">${digit}</text>`).join('')).join('');
  const labels=['red','blue'].map(team=>`<text class="sports-animated sports-possession-${team}" opacity="${team==='red'?1:0}" x="${team==='red'?47:1137}" y="255" text-anchor="${team==='red'?'start':'end'}" fill="#193c50">${TEAMS[team].name} BALL</text>
    <text class="sports-animated sports-serve-${team}" opacity="0" x="${team==='red'?47:1137}" y="255" text-anchor="${team==='red'?'start':'end'}" fill="#193c50">${TEAMS[team].name} SERVE</text>
    <text class="sports-animated sports-winner-${team}" opacity="0" x="592" y="240" text-anchor="middle" fill="#193c50" font-size="24" font-weight="bold">FULL TIME / ${TEAMS[team].name} WINS</text>`).join('');
  return `<svg id="sports-arena" x="48" y="410" width="1184" height="666" viewBox="0 0 1184 666" role="img" aria-labelledby="sports-title sports-description">
    <title id="sports-title">Pixel Sports Club - red versus blue</title>
    <desc id="sports-description">Four distinct pixel cartoon athletes play a faster, repeatable four-minute football, basketball and volleyball loop. Each sport lasts 80 seconds including its first-to-three match, fireworks, confetti and court transition. Blue wins football 3-2, red wins basketball 3-2, blue wins volleyball 3-2. Red steals and scores in the third basketball play. The ball rises, spins, glows and morphs as each court transforms. Football and basketball restart with the conceding team; the volleyball point winner serves behind the end line.</desc>
    <defs><clipPath id="sports-stage-clip"><path d="M12 0H1172V12H1184V654H1172V666H12V654H0V12H12Z"/></clipPath><clipPath id="sports-ball-clip"><circle r="13"/></clipPath>
      <style>${animationCSS()}
      @media(prefers-reduced-motion:reduce){.sports-animated{animation:none!important}.sports-intro-label{opacity:0}}
      </style>
    </defs>
    <g clip-path="url(#sports-stage-clip)">
      ${drawStadium()}
      <g font-family="Consolas,'Courier New',monospace" font-weight="bold" fill="#193c50">
        <text x="32" y="35" font-size="20" letter-spacing="2">PIXEL SPORTS CLUB</text>
      </g>
      <g transform="translate(0 216)">
        ${drawCourts()}
        <rect class="sports-animated sports-court-shimmer" x="24" y="90" width="1136" height="280" fill="#fffbd0" opacity="0"/>
        ${Array.from({length:4},(_,layer)=>PLAYER_IDS.map(id=>playerSVG(id,layer)).join('')).join('')}
        ${drawBall()}
      </g>
      <g font-family="Consolas,monospace" font-size="15" letter-spacing="1">${labels}
        <text class="sports-animated sports-intro-label" opacity="0" x="592" y="240" text-anchor="middle" fill="#193c50" font-size="20" font-weight="bold">GET READY / FIRST TO 3</text>
        <g class="sports-animated sports-start-label" opacity="0" fill="#193c50">
          <path d="M512 225H528V231H538V237H520V243H512V237H506V231H512ZM544 225H552V228H544ZM544 236H556V239H544Z"/>
          <text x="596" y="240" text-anchor="middle" font-size="24" font-weight="bold">PLAY!</text>
        </g>
        <g class="sports-animated sports-point-label" opacity="0">
          ${['football','basketball','volleyball'].map((sport,i)=>`<text class="sports-animated sports-${sport}-title" opacity="${i===0?1:0}" x="592" y="240" text-anchor="middle" fill="#193c50" font-size="24" font-weight="bold">${['GOAL!','BASKET!','POINT!'][i]}</text>`).join('')}
        </g>
      </g>
      <g id="sports-scoreboard" font-family="Consolas,'Courier New',monospace">
        <path d="M380 50H804V60H814V196H804V206H380V196H370V60H380Z" fill="#397e91"/>
        <path d="M380 44H804V54H814V188H804V198H380V188H370V54H380Z" fill="#193c50"/>
        <rect x="380" y="55" width="208" height="94" fill="#342e45"/><rect x="596" y="55" width="208" height="94" fill="#183958"/>
        <rect x="380" y="55" width="208" height="5" fill="${TEAMS.red.color}"/><rect x="596" y="55" width="208" height="5" fill="${TEAMS.blue.color}"/>
        <text x="488" y="84" text-anchor="middle" fill="#ff8791" font-size="20" font-weight="bold">TEAM RED</text>
        <text x="696" y="84" text-anchor="middle" fill="#8fc6ff" font-size="20" font-weight="bold">TEAM BLUE</text>
        ${digits}<text x="592" y="134" text-anchor="middle" fill="#d6f4f2" font-size="36">:</text>
        ${['football','basketball','volleyball'].map(sport=>`<text class="sports-animated sports-${sport}-title" opacity="${sport==='football'?1:0}" x="592" y="178" text-anchor="middle" fill="#fff3bc" font-size="20" font-weight="bold" letter-spacing="2">${sport.toUpperCase()}</text>`).join('')}
        <g transform="translate(380 194)"><path class="sports-animated sports-match-progress" d="M0 0H424" stroke="#80efc5" stroke-width="4" style="transform:scaleX(0)"/></g>
      </g>
      ${drawRoster()}
      ${drawCelebration()}
    </g>
  </svg>`;
}
