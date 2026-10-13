import { sportsStateAt, PLAYER_IDS, SPORTS_DURATION, actionDuration, contactEvents } from './sports-timeline.mjs';
import { FLOOR, ARM_LENGTHS, LEG_LENGTHS, playerBones } from './sports-rig.mjs';
import { MATCHES, MATCH_DURATION, TEAMS } from './sports-matches.mjs';
export { sportsStateAt, SPORTS_DURATION };

const n = value => Number(value.toFixed(3));
const transform = (kind, values) => kind==='translate' ? `translate(${n(values[0])}px,${n(values[1])}px)`
  : kind==='bone' ? `translate(${n(values[0])}px,${n(values[1])}px) rotate(${n(values[2])}deg)`
  : kind==='rotate' ? `rotate(${n(values[0])}deg)` : `scaleX(${n(values[0])})`;

function valuesAt(state) {
  const values={};
  const add=(name,kind,values_,discrete=false) => {values[name]={kind,values:values_,discrete};};
  add('ball-position','translate',[state.ball.x,state.ball.y]);
  add('ball-rotation','rotate',[state.ball.rotation]);
  for (const sport of ['football','basketball','volleyball']) {
    add(`${sport}-scene`,'opacity',[state.scenes[sport]]);
    add(`${sport}-skin`,'opacity',[state.scenes[sport]]);
    add(`${sport}-title`,'opacity',[Number(state.sport===sport)],true);
  }
  for (const id of PLAYER_IDS) {
    const player=state.players[id];
    add(`${id}-position`,'translate',[player.x,player.y]);
    add(`${id}-facing`,'scale',[player.facing],true);
    add(`${id}-number`,'scale',[player.facing],true);
    add(`${id}-lean`,'rotate',[player.lean]);
    add(`${id}-head`,'rotate',[player.headAngle]);
    for (const [limb,bones] of Object.entries(playerBones(player))) {
      const lengths=limb.startsWith('arm')?ARM_LENGTHS:LEG_LENGTHS;
      add(`${id}-${limb}-upper`,'bone',bones.upper);
      // Nest the forearm/shin inside its parent bone. CSS interpolation can
      // change angles without ever pulling an elbow or knee apart.
      add(`${id}-${limb}-lower`,'bone',[0,lengths[0],bones.lower[2]-bones.upper[2]]);
      if (limb.startsWith('leg')) add(`${id}-${limb}-shoe`,'bone',[0,lengths[1],-bones.lower[2]]);
    }
  }
  for (const team of ['red','blue']) {
    for (let digit=0;digit<=3;digit++) add(`score-${team}-${digit}`,'opacity',[Number(state.score[team]===digit)],true);
    add(`winner-${team}`,'opacity',[Number(state.winner===team)],true);
    add(`possession-${team}`,'opacity',[Number(state.possession===team && state.sport!=='volleyball')],true);
    add(`serve-${team}`,'opacity',[Number(state.possession===team && state.sport==='volleyball')],true);
  }
  add('match-progress','scale',[state.matchTime/60]);
  return values;
}

// Remove redundant samples while bounding screen-space and joint-angle errors.
// This keeps the three-minute SVG much smaller than a frame-by-frame export.
function simplify(samples, kind) {
  const tolerances=kind==='opacity'?[.002]:kind==='rotate'?[.5]:kind==='bone'?[.2,.2,.5]:kind==='translate'?[.2,.2]:[.002];
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

function animationCSS() {
  const times=new Set(Array.from({length:SPORTS_DURATION*8+1},(_,index)=>index/8));
  for (const [index,match] of MATCHES.entries()) {
    const offset=index*MATCH_DURATION;
    for (const round of match.rounds) {
      const start=offset+round.scoreAt-actionDuration(match.sport,round);
      for (const time of [round.start,round.scoreAt]) times.add(offset+time);
      times.add(start);
      for (const event of contactEvents(index,round.index)) times.add(event.time);
      if (match.sport==='football') for (const q of [.5,1.8,2.5,4,5.8,6.6,8]) times.add(start+q);
    }
  }
  // Facing changes are discrete. Locate the actual crossing instead of waiting
  // for the next 8 Hz sample, which would leave a player looking away briefly.
  const sampled=[...times].sort((a,b)=>a-b).map(time=>({time,state:sportsStateAt(time)}));
  for (let i=1;i<sampled.length;i++) {
    const from=sampled[i-1],to=sampled[i];
    for (const id of PLAYER_IDS) {
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
  const frames=[...times].sort((a,b)=>a-b).map(time=>{
    const state=sportsStateAt(time);
    if (time===SPORTS_DURATION) state.ball.rotation=SPORTS_DURATION*180;
    return {time,values:valuesAt(state)};
  });
  return Object.keys(frames[0].values).map(name=>{
    const {kind,discrete}=frames[0].values[name];
    let samples=frames.map(frame=>({time:frame.time,values:frame.values[name].values}));
    if (discrete) samples=samples.filter((sample,index,array)=>index===0 || index===array.length-1 || sample.values[0]!==array[index-1].values[0]);
    else samples=simplify(samples,kind);
    const property=kind==='opacity'?'opacity':'transform';
    const rules=samples.map(sample=>`${Number((sample.time/SPORTS_DURATION*100).toFixed(7))}%{${property}:${kind==='opacity'?n(sample.values[0]):transform(kind,sample.values)}}`).join('');
    return `.sports-${name}{animation:sports-${name} ${SPORTS_DURATION}s ${discrete?'steps(1,end)':'linear'} infinite}@keyframes sports-${name}{${rules}}`;
  }).join('\n');
}

function playerSVG(id,p) {
  const state=sportsStateAt(0),player=state.players[id],initial=valuesAt(state);
  const color=TEAMS[player.team].color;
  const group=(part,content) => {
    const value=initial[`${id}-${part}`];
    return `<g class="sports-animated sports-${id}-${part}" style="transform:${transform(value.kind,value.values)}">${content}</g>`;
  };
  const shoe=name=>group(`${name}-shoe`,`<path d="M-3-2H7L13 1V4H-3Z" fill="${p.text}" stroke="#596675" stroke-width=".5"/>`);
  const segment=(length,width,fill)=>`<path d="M0 0V${length}" stroke="${fill}" stroke-width="${width}" stroke-linecap="round"/>`;
  const bone=name=>{
    const arm=name.startsWith('arm'),lengths=arm?ARM_LENGTHS:LEG_LENGTHS;
    return group(`${name}-upper`,segment(lengths[0],arm?8:10,arm?color:'#ddb08d')+
      group(`${name}-lower`,segment(lengths[1],7,'#e5b391')+(arm?'':shoe(name))));
  };
  return `<g data-player="${id}" data-team="${player.team}">${group('position',group('facing',group('lean',`
    ${bone('arm-back')}${bone('leg-back')}
    ${bone('leg-front')}
    <path d="M-12-53H13L11-36H1L0-44L-2-36H-12Z" fill="#344451"/>
    <path d="M-12-88Q0-94 12-87L11-52H-12Z" fill="${color}"/>
    <path d="M-12-87L-5-89V-52H-12Z" fill="#172f29" opacity=".12"/>
    <path d="M-3-100V-91H4V-100" fill="#ddb08d"/>
    <g transform="translate(0 -110)">${group('head',`
      <circle r="11" fill="#e5b391"/>
      <path d="M8-4L14 1L9 3Z" fill="#e5b391"/>
      <path d="M-11-1Q-12-16 2-12Q12-12 11-5L5-8L-3-5Z" fill="#293640"/>
      <circle cx="-8" cy="1" r="2.5" fill="#ddb08d"/>
      <circle cx="5" cy="-2" r="1.3" fill="#293640"/>
      <path d="M3-5H7M5 6Q8 8 10 5" stroke="#8a5744" stroke-width="1.2" stroke-linecap="round"/>
    `)}</g>
    ${group('number',`<text x="0" y="-66" text-anchor="middle" fill="#ffffff" font-family="'Segoe UI',Arial,sans-serif" font-size="13" font-weight="700">${id.endsWith('1')?'1':'2'}</text>`)}
    ${bone('arm-front')}
  `)))}</g>`;
}

function goal(p) {
  return `<path d="M34 308V214H126V308M34 214L48 224H126M48 224V308" stroke="${p.text}" stroke-width="3" fill="none"/>
    <path d="M64 224V308M80 224V308M96 224V308M112 224V308M48 241H126M48 258H126M48 275H126M48 292H126" stroke="${p.muted}" opacity=".45" fill="none"/>`;
}

function hoop(p) {
  return `<path d="M38 308V99H53" stroke="${p.muted}" stroke-width="6" fill="none"/>
    <rect x="25" y="94" width="46" height="64" rx="2" fill="${p.bg}" stroke="${p.text}" stroke-width="2"/>
    <rect x="48" y="130" width="17" height="23" fill="none" stroke="${p.muted}"/>
    <path d="M56 158L64 188H84L94 158M60 158L81 188M68 158L89 177M84 158L66 188M92 158L62 174M61 174H89M63 181H86" stroke="${p.text}" stroke-width="1.2" fill="none"/>
    <path d="M54 158H95" stroke="#e6a267" stroke-width="4" stroke-linecap="round"/>`;
}

function ballSVG() {
  return `<g class="sports-animated sports-ball-position" style="transform:translate(592px,296px)"><g class="sports-animated sports-ball-rotation">
    <circle r="13" fill="#f5f5ef"/>
    <g clip-path="url(#sports-ball-clip)">
      <g class="sports-animated sports-football-skin" opacity="1"><circle r="13" fill="#f5f5ef"/>
        <path d="M0-5L4.76-1.55L2.94 4.05H-2.94L-4.76-1.55Z" fill="#293640"/>
        <path d="M0-5V-11M4.76-1.55L10.46-3.4M2.94 4.05L6.47 8.9M-2.94 4.05L-6.47 8.9M-4.76-1.55L-10.46-3.4" stroke="#536269" stroke-width=".8" fill="none"/>
        <path d="M-3-13H3L2-9H-2ZM11-7L14-1L10 0L8-3ZM10 8L4 14L3 10L6 7ZM-10 8L-4 14L-3 10L-6 7ZM-11-7L-14-1L-10 0L-8-3Z" fill="#293640"/>
      </g>
      <g class="sports-animated sports-basketball-skin" opacity="0"><circle r="13" fill="#eb8c3c"/>
        <path d="M-13 0H13M0-13V13M-9-10Q4 0-9 10M9-10Q-4 0 9 10" stroke="#75401f" stroke-width="1.2" fill="none"/>
      </g>
      <g class="sports-animated sports-volleyball-skin" opacity="0"><circle r="13" fill="#fbf0c7"/>
        <path d="M-13-3Q0-11 9-9L14-2Q1-6-9 7Z" fill="#e2bf41"/>
        <path d="M9-9Q2 3 6 13L-2 14Q-6 2 0-10Z" fill="#3f72aa"/>
        <path d="M-10 9Q-1 2 13 5L14 11Q0 7-4 14Z" fill="#e2bf41"/>
        <path d="M-13-3Q0-11 9-9M9-9Q2 3 6 13M-10 9Q-1 2 13 5" stroke="#637478" stroke-width=".7" fill="none"/>
      </g>
    </g><circle r="13" fill="none" stroke="#536269" stroke-width="1"/>
  </g></g>`;
}

export function renderSportsAnimation(p) {
  const digits=['red','blue'].map(team=>Array.from({length:4},(_,digit)=>`<text class="sports-animated sports-score-${team}-${digit}" opacity="${digit===0?1:0}" x="${team==='red'?552:632}" y="63" text-anchor="middle" fill="${TEAMS[team].color}" font-size="30" font-weight="700">${digit}</text>`).join('')).join('');
  const labels=['red','blue'].map(team=>`<text class="sports-animated sports-possession-${team}" opacity="${team==='red'?1:0}" x="1160" y="30" text-anchor="end" fill="${TEAMS[team].color}">${TEAMS[team].name} BALL</text>
    <text class="sports-animated sports-serve-${team}" opacity="0" x="1160" y="30" text-anchor="end" fill="${TEAMS[team].color}">${TEAMS[team].name} SERVE</text>
    <text class="sports-animated sports-winner-${team}" opacity="0" x="592" y="124" text-anchor="middle" fill="${TEAMS[team].color}" font-size="17" font-weight="700">${TEAMS[team].name} WINS 3–2</text>`).join('');
  return `<svg id="sports-arena" x="48" y="410" width="1184" height="380" viewBox="0 0 1184 380" role="img" aria-labelledby="sports-title sports-description">
    <title id="sports-title">Red versus blue — three one-minute matches</title>
    <desc id="sports-description">A fixed three-minute loop. Red wins football 3–2, blue wins basketball 3–2, and red wins volleyball 3–2. Two players per side face the ball. Football and basketball restart with the conceding team; volleyball serves go to the point winner. Every scoring play counts as one point.</desc>
    <defs><clipPath id="sports-stage-clip"><rect width="1184" height="380" rx="10"/></clipPath><clipPath id="sports-ball-clip"><circle r="13"/></clipPath>
      <style>${animationCSS()}
      @media(prefers-reduced-motion:reduce){.sports-animated{animation:none!important}}
      </style>
    </defs>
    <g clip-path="url(#sports-stage-clip)">
      <rect width="1184" height="380" rx="10" fill="${p.bg}"/>
      <path d="M24 ${FLOOR+2}H1160" stroke="${p.line}" stroke-width="2"/>
      <g class="sports-animated sports-football-scene" opacity="1">
        <path d="M126 310L176 285H1008L1058 310M592 285V310M204 285V310M980 285V310" fill="none" stroke="${p.line}"/>
        <ellipse cx="592" cy="298" rx="44" ry="12" fill="none" stroke="${p.line}"/>
        ${goal(p)}<g transform="translate(1184 0) scale(-1 1)">${goal(p)}</g>
      </g>
      <g class="sports-animated sports-basketball-scene" opacity="0">
        <path d="M182 310Q182 248 85 248M1002 310Q1002 248 1099 248M592 280V310" fill="none" stroke="${p.line}"/>
        ${hoop(p)}<g transform="translate(1184 0) scale(-1 1)">${hoop(p)}</g>
      </g>
      <g class="sports-animated sports-volleyball-scene" opacity="0">
        <path d="M126 310L176 285H1008L1058 310M382 285V310M802 285V310" fill="none" stroke="${p.line}"/>
        <path d="M578 160V310M606 160V310" stroke="${p.muted}" stroke-width="3"/>
        <path d="M578 176H606V274H578Z" fill="none" stroke="${p.text}" stroke-width="2"/>
        <path d="M585 176V274M592 176V274M599 176V274M578 192H606M578 208H606M578 224H606M578 240H606M578 256H606" fill="none" stroke="${p.muted}"/>
      </g>
      <g font-family="Consolas,monospace" font-size="13" letter-spacing="1">${labels}</g>
      <g id="sports-scoreboard" font-family="'Segoe UI',Arial,sans-serif">
        <rect x="468" y="12" width="248" height="86" rx="8" fill="${p.bg}" stroke="${p.line}"/>
        <text x="510" y="34" fill="${TEAMS.red.color}" font-size="12" font-weight="700">RED</text>
        <text x="674" y="34" text-anchor="end" fill="${TEAMS.blue.color}" font-size="12" font-weight="700">BLUE</text>
        ${digits}<text x="592" y="61" text-anchor="middle" fill="${p.muted}" font-size="24">:</text>
        ${['football','basketball','volleyball'].map(sport=>`<text class="sports-animated sports-${sport}-title" opacity="${sport==='football'?1:0}" x="592" y="84" text-anchor="middle" fill="${p.muted}" font-size="12" letter-spacing="1">${sport.toUpperCase()}</text>`).join('')}
        <g transform="translate(478 95)"><path class="sports-animated sports-match-progress" d="M0 0H228" stroke="${p.accent}" stroke-width="2" style="transform:scaleX(0)"/></g>
      </g>
      ${PLAYER_IDS.map(id=>playerSVG(id,p)).join('')}
      ${ballSVG()}
      <text x="24" y="358" fill="${p.muted}" font-family="Consolas,monospace" font-size="11" letter-spacing="1">60s PER SPORT / FIRST TO 3 / RED LEFT · BLUE RIGHT</text>
    </g>
    <rect x=".5" y=".5" width="1183" height="379" rx="10" fill="none" stroke="${p.line}"/>
  </svg>`;
}
