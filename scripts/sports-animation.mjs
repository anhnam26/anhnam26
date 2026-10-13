// A fixed 24-second story rendered as CSS inside an SVG image. No runtime JS.
export const SPORTS_DURATION = 24;
const FLOOR = 236;
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n) => { const x = clamp(n); return x * x * (3 - 2 * x); };
const mix = (a, b, weight) => a + (b - a) * weight;
const pointMix = (a, b, weight) => a.map((value, i) => mix(value, b[i], weight));
const number = (n) => Number(n.toFixed(2));

function track(points, time) {
  for (let i = 1; i < points.length; i++) {
    if (time <= points[i][0]) {
      const a = points[i - 1], b = points[i];
      return pointMix(a.slice(1), b.slice(1), smooth((time - a[0]) / (b[0] - a[0])));
    }
  }
  return points.at(-1).slice(1);
}

function bezier(points, progress) {
  let values = points;
  while (values.length > 1) values = values.slice(1).map((p, i) => pointMix(values[i], p, progress));
  return values[0];
}

// Flight endpoints line up with the feet, hands, goal, hoop and spike contact.
const FLIGHTS = [
  [0, .5, [[303, 223], [303, 223]]],
  [.5, 1.25, [[303, 223], [450, 199], [606, 223]]],
  [1.25, 1.55, [[606, 223], [606, 223]]],
  [1.55, 2.3, [[606, 223], [450, 199], [303, 223]]],
  [2.3, 2.65, [[303, 223], [303, 223]]],
  [2.65, 3.35, [[303, 223], [450, 199], [606, 223]]],
  [3.35, 3.95, [[606, 223], [676, 223]]],
  [3.95, 4.8, [[676, 223], [880, 96], [1060, 188]]],
  [4.8, 5.35, [[1060, 188], [1080, 199], [1080, 223]]],
  [5.35, 6, [[1080, 223], [1080, 223]]],
  [6, 8, [[1080, 223], [1098, 24], [452, 12], [342, 177]]],
  [8, 8.4, [[342, 177], [350, 223]]],
  [8.4, 8.8, [[350, 223], [356, 177]]],
  [8.8, 9.2, [[356, 177], [378, 223]]],
  [9.2, 9.6, [[378, 223], [390, 177]]],
  [9.6, 10.2, [[390, 177], [402, 178]]],
  [10.2, 10.85, [[402, 178], [402, 124], [410, 85]]],
  [10.85, 12.2, [[410, 85], [714, -10], [996, 130]]],
  [12.2, 12.5, [[996, 130], [998, 170]]],
  [12.5, 13, [[998, 170], [998, 223]]],
  [13, 13.5, [[998, 223], [1020, 143], [1040, 223]]],
  [13.5, 14, [[1040, 223], [1070, 223]]],
  [14, 16, [[1070, 223], [1068, 15], [490, 0], [338, 111]]],
  [16, 18.1, [[338, 111], [524, -42], [700, 78]]],
  [18.1, 18.75, [[700, 78], [868, 60], [1040, 223]]],
  [18.75, 19.6, [[1040, 223], [1060, 146], [1092, 223]]],
  [19.6, 22, [[1092, 223], [1092, 223]]],
  [22, 24, [[1092, 223], [1108, 28], [480, 6], [303, 223]]],
];

function ballPosition(time) {
  const [from, to, points] = FLIGHTS.find((segment) => time <= segment[1]) ?? FLIGHTS.at(-1);
  return bezier(points, clamp((time - from) / (to - from)));
}

function windowWeight(time, a, b, c, d) {
  if (time < a || time > d) return 0;
  if (time < b) return smooth((time - a) / (b - a));
  return time <= c ? 1 : 1 - smooth((time - c) / (d - c));
}

const A_POSITIONS = [[0,280,236],[6,280,236],[8,318,236],[8.8,332,236],[9.6,366,236],[10.2,378,236],[10.85,378,200],[11.4,378,236],[14,378,236],[16,318,236],[22,318,236],[24,280,236]];
const B_POSITIONS = [[0,620,236],[3.35,620,236],[3.95,650,236],[6,650,236],[8,408,236],[9.6,440,236],[10.2,446,236],[10.9,446,213],[11.5,446,236],[14,446,236],[16,640,236],[17.6,674,236],[18.1,674,190],[18.8,674,236],[22,674,236],[24,620,236]];

function playerPose(actor, time, ball) {
  const positions = actor === 'a' ? A_POSITIONS : B_POSITIONS;
  const [x, y] = track(positions, time);
  const speed = Math.abs(track(positions, Math.min(24, time + .05))[0] - track(positions, Math.max(0, time - .05))[0]) / .1;
  const walk = clamp(speed / 80) * Math.sin(time * Math.PI * 4);
  const pose = { x, y, face:ball[0]>=x?1:-1, leftHand: [-19 - walk * 5,-48], rightHand: [21 + walk * 5,-48], leftFoot: [-14 - walk * 11,-Math.max(0,-walk)*9], rightFoot: [16 + walk * 11,-Math.max(0,walk)*9] };
  const apply = (key, target, amount) => { pose[key] = pointMix(pose[key], target, amount); };
  const kickTimes = actor === 'a' ? [.5,2.65] : [1.55,3.95];
  for (const kick of kickTimes) {
    const weight = windowWeight(time, kick-.3, kick, kick+.08, kick+.4);
    if (actor === 'b' && kick === 1.55) apply('leftFoot', [-24,-14], weight);
    else apply('rightFoot', [34,-18], weight);
    apply('leftHand', [-31,-83], weight);
  }
  if (actor === 'a') {
    const dribble = windowWeight(time, 7.8,8,10.2,10.4);
    apply('rightHand', [clamp(ball[0]-x,18,34), Math.min(-51,ball[1]-y)], dribble);
    const shot = windowWeight(time, 10.2,10.85,11.2,11.7);
    apply('rightHand', [28,-118], shot); apply('leftHand', [9,-109], shot);
    const set = windowWeight(time, 15.3,16,16.6,17.3);
    apply('leftHand', [-16,-122], set); apply('rightHand', [17,-122], set);
  } else {
    const defend = windowWeight(time, 7.6,8.1,11.1,11.8);
    apply('leftHand', [-30,-110], defend); apply('rightHand', [29,-97], defend);
    const spike = windowWeight(time, 17.1,17.7,18.5,19);
    apply('leftHand', [-29,-90], spike);
    apply('rightHand', track([[0,4,-113],[17.7,4,-113],[18.1,26,-114],[18.5,35,-64],[24,35,-64]],time), spike);
  }
  const celebration = actor === 'a'
    ? Math.max(windowWeight(time, 5,5.2,5.4,5.8)*.5,windowWeight(time,12.5,12.8,13.2,13.6),windowWeight(time,19.1,19.5,20,20.5))
    : Math.max(windowWeight(time,4.9,5.1,5.5,5.9),windowWeight(time,19.3,19.6,20.1,20.6));
  apply('leftHand', [-24,-120], celebration); apply('rightHand', [25,-120], celebration);
  pose.y -= celebration * 6;
  return pose;
}

// Analytic inverse kinematics keeps each hand/foot attached to its limb.
export function limbSegments(origin, target, length1, length2, bend) {
  const dx = target[0]-origin[0], dy = target[1]-origin[1];
  const rawDistance = Math.hypot(dx,dy);
  const distance = clamp(rawDistance, Math.abs(length1-length2)+.01,length1+length2-.01);
  const direction = [dx/(rawDistance || 1),dy/(rawDistance || 1)];
  const end = [origin[0]+direction[0]*distance,origin[1]+direction[1]*distance];
  const along = (length1*length1-length2*length2+distance*distance)/(2*distance);
  const height = Math.sqrt(Math.max(0,length1*length1-along*along));
  const elbow = [origin[0]+direction[0]*along-direction[1]*height*bend,origin[1]+direction[1]*along+direction[0]*height*bend];
  const segment = (from,to) => ({ x:from[0],y:from[1],angle:Math.atan2(-(to[0]-from[0]),to[1]-from[1])*180/Math.PI });
  return { upper:segment(origin,elbow),lower:segment(elbow,end),end };
}

export function sportsStateAt(seconds) {
  if (!Number.isFinite(seconds)) throw new Error('Animation time must be finite.');
  const time = ((seconds % SPORTS_DURATION)+SPORTS_DURATION)%SPORTS_DURATION;
  const ball = ballPosition(time);
  let football = 0, basketball = 0, volleyball = 0;
  if (time < 6) football = 1;
  else if (time < 8) { basketball = smooth((time-6)/2); football = 1-basketball; }
  else if (time < 14) basketball = 1;
  else if (time < 16) { volleyball = smooth((time-14)/2); basketball = 1-volleyball; }
  else if (time < 22) volleyball = 1;
  else { football = smooth((time-22)/2); volleyball = 1-football; }
  return {
    time,ball:{x:ball[0],y:ball[1],rotation:time*360},
    scenes:{football,basketball,volleyball},
    a:playerPose('a',time,ball),b:playerPose('b',time,ball),
    scores:{goal:windowWeight(time,4.8,5,5.7,6),basket:windowWeight(time,12.2,12.4,13.3,14),spike:windowWeight(time,18.75,19,20.5,21)},
  };
}

function playerTransforms(pose) {
  const result = { body:`translate(${number(pose.x)}px,${number(pose.y)}px)`,face:`scaleX(${pose.face})` };
  for (const [name,origin,target,l1,l2,bend] of [
    ['arm-l',[-9,-78],pose.leftHand,23,23,1],['arm-r',[9,-78],pose.rightHand,23,23,-1],
    ['leg-l',[-8,-41],pose.leftFoot,21,23,-1],['leg-r',[8,-41],pose.rightFoot,21,23,-1],
  ]) {
    const parts = limbSegments(origin,target,l1,l2,bend);
    for (const part of ['upper','lower']) {
      const s = parts[part]; result[`${name}-${part}`] = `translate(${number(s.x)}px,${number(s.y)}px) rotate(${number(s.angle)}deg)`;
    }
    if (name.startsWith('leg')) result[`${name}-shoe`] = `translate(${number(parts.end[0])}px,${number(parts.end[1])}px)`;
  }
  return result;
}

function frameValues(state) {
  const values = {
    'ball-position': ['transform',`translate(${number(state.ball.x)}px,${number(state.ball.y)}px)`],
    'ball-rotation': ['transform',`rotate(${number(state.ball.rotation)}deg)`],
    'football-scene': ['opacity',state.scenes.football.toFixed(4)],
    'basketball-scene': ['opacity',state.scenes.basketball.toFixed(4)],
    'volleyball-scene': ['opacity',state.scenes.volleyball.toFixed(4)],
    'football-skin': ['opacity',state.scenes.football.toFixed(4)],
    'basketball-skin': ['opacity',state.scenes.basketball.toFixed(4)],
    'volleyball-skin': ['opacity',state.scenes.volleyball.toFixed(4)],
  };
  for (const actor of ['a','b']) {
    for (const [part,transform] of Object.entries(playerTransforms(state[actor]))) values[`${actor}-${part}`] = ['transform',transform];
  }
  for (const [name,opacity] of Object.entries(state.scores)) values[`score-${name}`] = ['opacity',opacity.toFixed(4)];
  return values;
}

function animationCSS() {
  const frames = Array.from({length:193},(_,i) => {
    const state = sportsStateAt(i/8);
    // Rotation completes a whole number of turns at the loop boundary.
    if (i === 192) state.ball.rotation = 24*360;
    return frameValues(state);
  });
  return Object.keys(frames[0]).map((name) => {
    const property = frames[0][name][0];
    let previousAngle;
    const rules = frames.map((frame,i) => {
      let value = frame[name][1];
      if (property === 'transform' && name !== 'ball-rotation') {
        const angle = value.match(/rotate\(([-\d.]+)deg\)/)?.[1];
        if (angle !== undefined) {
          let adjusted = Number(angle);
          if (previousAngle !== undefined) {
            while (adjusted-previousAngle>180) adjusted-=360;
            while (adjusted-previousAngle<-180) adjusted+=360;
          }
          value = value.replace(/rotate\([^)]+\)/,`rotate(${number(adjusted)}deg)`); previousAngle=adjusted;
        }
      }
      return `${number(i/192*100)}%{${property}:${value}}`;
    }).join('');
    return `.sports-${name}{animation:sports-${name} ${SPORTS_DURATION}s linear infinite}@keyframes sports-${name}{${rules}}`;
  }).join('\n');
}

function playerSVG(actor, color, p) {
  const transforms = playerTransforms(sportsStateAt(0)[actor]);
  const animated = (part,content) => `<g class="sports-animated sports-${actor}-${part}" style="transform:${transforms[part]}">${content}</g>`;
  const limb = (part,length,stroke,width) => animated(part,`<path d="M0 0V${length}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`);
  return animated('body',`
    ${limb('arm-l-upper',23,color,9)}${limb('arm-l-lower',23,'#e5b391',8)}
    ${limb('arm-r-upper',23,color,9)}${limb('arm-r-lower',23,'#e5b391',8)}
    ${limb('leg-l-upper',21,'#e5b391',10)}${limb('leg-l-lower',23,'#e5b391',8)}
    ${limb('leg-r-upper',21,'#e5b391',10)}${limb('leg-r-lower',23,'#e5b391',8)}
    ${animated('leg-l-shoe',`<rect x="-4" y="-3" width="17" height="6" rx="3" fill="${p.text}"/>`)}
    ${animated('leg-r-shoe',`<rect x="-4" y="-3" width="17" height="6" rx="3" fill="${p.text}"/>`)}
    <path d="M-14-53H14L13-36H1L0-44L-1-36H-13Z" fill="#344451"/>
    <path d="M-13-85Q0-91 13-85L12-52H-12Z" fill="${color}"/>
    <path d="M-3-93V-87H3V-93" fill="#e5b391"/>
    <circle cy="-103" r="11" fill="#e5b391"/>
    ${animated('face',`<path d="M-11-104Q-11-119 2-115Q12-114 11-106L6-109L-3-108Z" fill="#293640"/>
    <circle cx="4" cy="-103" r="1.2" fill="#293640"/>
    <path d="M4-97Q7-95 9-98" stroke="#8a5744" stroke-width="1.2" stroke-linecap="round"/>`)}
    <text x="0" y="-66" text-anchor="middle" fill="#172f29" font-family="'Segoe UI',Arial,sans-serif" font-size="13" font-weight="700">${actor==='a'?'1':'2'}</text>
  `);
}

export function renderSportsAnimation(p) {
  return `<svg id="sports-arena" x="48" y="410" width="1184" height="292" viewBox="0 0 1184 292" role="img" aria-labelledby="sports-title sports-description">
    <title id="sports-title">Two players, three sports, one continuous ball</title>
    <desc id="sports-description">A fixed 24-second loop: two players exchange football passes and score a goal; one guards the other during a basketball jump shot into the hoop; one sets a volleyball and the other spikes over the net. Courts crossfade and the same moving ball changes its skin between sports.</desc>
    <defs><clipPath id="sports-stage-clip"><rect width="1184" height="292" rx="10"/></clipPath><clipPath id="sports-ball-clip"><circle r="13"/></clipPath>
      <style>${animationCSS()}
      @media(prefers-reduced-motion:reduce){.sports-animated{animation:none!important}}
      </style>
    </defs>
    <g clip-path="url(#sports-stage-clip)">
      <rect width="1184" height="292" rx="10" fill="${p.bg}"/>
      <path d="M24 ${FLOOR+4}H1160" stroke="${p.line}" stroke-width="2"/>
      <g class="sports-animated sports-football-scene" opacity="1">
        <text x="24" y="30" fill="${p.accent}" font-family="Consolas,monospace" font-size="14" letter-spacing="2">FOOTBALL</text>
        <path d="M100 240L160 210H1120M520 210V240M808 210L870 240" stroke="${p.line}" fill="none"/>
        <ellipse cx="540" cy="226" rx="48" ry="13" stroke="${p.line}" fill="none"/>
        <path d="M992 236V142H1126V236M992 142L1012 152H1140V236H1126M1126 142L1140 152" stroke="${p.text}" stroke-width="3" fill="none" stroke-linejoin="round"/>
        <path d="M1012 152V236M1038 152V236M1064 152V236M1090 152V236M1116 152V236M1012 172H1140M1012 192H1140M1012 212H1140" stroke="${p.muted}" stroke-width="1" opacity=".45"/>
      </g>
      <g class="sports-animated sports-basketball-scene" opacity="0">
        <text x="176" y="30" fill="#e6a267" font-family="Consolas,monospace" font-size="14" letter-spacing="2">BASKETBALL</text>
        <path d="M840 240Q840 174 924 174H1112M948 192V240" stroke="${p.line}" fill="none"/>
        <path d="M1114 236V72H1090" stroke="${p.muted}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <rect x="982" y="58" width="110" height="74" rx="3" fill="${p.bg}" stroke="${p.text}" stroke-width="3"/>
        <rect x="1002" y="91" width="42" height="32" fill="none" stroke="${p.muted}" stroke-width="2"/>
        <path d="M974 130L984 163H1008L1020 130M980 130L1004 163M990 130L1012 152M1004 130L988 163M1014 130L981 151M981 147H1014M983 155H1011" stroke="${p.text}" stroke-width="1.2" fill="none"/>
        <path d="M972 130H1022" stroke="#e6a267" stroke-width="4" stroke-linecap="round"/>
      </g>
      <g class="sports-animated sports-volleyball-scene" opacity="0">
        <text x="356" y="30" fill="#e7cf69" font-family="Consolas,monospace" font-size="14" letter-spacing="2">VOLLEYBALL</text>
        <path d="M96 240L156 211H1120M830 211V240M422 211L410 240" stroke="${p.line}" fill="none"/>
        <path d="M802 118V236M862 118V236" stroke="${p.muted}" stroke-width="4"/>
        <path d="M802 132H862V210H802Z" fill="none" stroke="${p.text}" stroke-width="2"/>
        <path d="M814 132V210M826 132V210M838 132V210M850 132V210M802 147H862M802 162H862M802 177H862M802 192H862" stroke="${p.muted}" stroke-width="1" opacity=".65"/>
      </g>
      ${playerSVG('a','#9ee6c1',p)}${playerSVG('b','#efb18a',p)}
      <g class="sports-animated sports-ball-position" style="transform:translate(303px,223px)">
        <g class="sports-animated sports-ball-rotation">
          <circle r="13" fill="#f5f5ef"/>
          <g clip-path="url(#sports-ball-clip)">
            <g class="sports-animated sports-football-skin" opacity="1">
              <circle r="13" fill="#f5f5ef"/>
              <path d="M0-5L4.76-1.55L2.94 4.05H-2.94L-4.76-1.55Z" fill="#293640"/>
              <path d="M0-5V-11M4.76-1.55L10.46-3.4M2.94 4.05L6.47 8.9M-2.94 4.05L-6.47 8.9M-4.76-1.55L-10.46-3.4" stroke="#536269" stroke-width=".8" fill="none"/>
              <path d="M-3-13H3L2-9H-2ZM11-7L14-1L10 0L8-3ZM10 8L4 14L3 10L6 7ZM-10 8L-4 14L-3 10L-6 7ZM-11-7L-14-1L-10 0L-8-3Z" fill="#293640"/>
            </g>
            <g class="sports-animated sports-basketball-skin" opacity="0">
              <circle r="13" fill="#eb8c3c"/>
              <path d="M-13 0H13M0-13V13M-9-10Q4 0-9 10M9-10Q-4 0 9 10" stroke="#75401f" stroke-width="1.2" fill="none"/>
            </g>
            <g class="sports-animated sports-volleyball-skin" opacity="0">
              <circle r="13" fill="#fbf0c7"/>
              <path d="M-13-3Q0-11 9-9L14-2Q1-6-9 7Z" fill="#e2bf41"/>
              <path d="M9-9Q2 3 6 13L-2 14Q-6 2 0-10Z" fill="#3f72aa"/>
              <path d="M-10 9Q-1 2 13 5L14 11Q0 7-4 14Z" fill="#e2bf41"/>
              <path d="M-13-3Q0-11 9-9M9-9Q2 3 6 13M-10 9Q-1 2 13 5" stroke="#637478" stroke-width=".7" fill="none"/>
            </g>
          </g>
          <circle r="13" fill="none" stroke="#536269" stroke-width="1"/>
        </g>
      </g>
      <g fill="${p.accent}" font-family="'Segoe UI',Arial,sans-serif" font-size="18" font-weight="700" text-anchor="end">
        <text class="sports-animated sports-score-goal" opacity="0" x="1158" y="30">GOAL!</text>
        <text class="sports-animated sports-score-basket" opacity="0" x="1158" y="30">SWISH!</text>
        <text class="sports-animated sports-score-spike" opacity="0" x="1158" y="30">POINT!</text>
      </g>
      <text x="24" y="275" fill="${p.muted}" font-family="Consolas,monospace" font-size="11" letter-spacing="1">TWO PLAYERS / THREE SPORTS / ONE BALL</text>
    </g>
    <rect x=".5" y=".5" width="1183" height="291" rx="10" fill="none" stroke="${p.line}"/>
  </svg>`;
}
