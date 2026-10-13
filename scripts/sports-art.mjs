import { TEAMS } from './sports-matches.mjs';
import { ARM_LENGTHS, LEG_LENGTHS, playerBones } from './sports-rig.mjs';

// Hand-authored pixel silhouettes; the same identity is used in all three games.
export const PLAYER_LOOKS = Object.freeze({
  'red-1': { number:'07', skin:'#ffd2a4', shade:'#e3a577', hair:'#203d51', accent:'#fff8e7', style:'spiky' },
  'red-2': { number:'11', skin:'#bb8057', shade:'#945937', hair:'#332d38', accent:'#ffe36c', style:'curly' },
  'blue-1': { number:'04', skin:'#ffe0b5', shade:'#e8b284', hair:'#dc743a', accent:'#fff8e7', style:'ponytail' },
  'blue-2': { number:'09', skin:'#a96e4e', shade:'#85503c', hair:'#233649', accent:'#75f1d1', style:'crop' },
});
const ink='#193c50';
const pixel=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

export function drawHead(look) {
  const hair={
    spiky:'M-18-5V-17H-12V-23H-5V-19H2V-25H9V-19H16V-10H7V-13H-2V-8H-11V-2Z',
    curly:'M-21-3V-17H-16V-23H-9V-27H5V-24H15V-19H20V-8H12V-11H3V-8H-10V-1Z',
    ponytail:'M-18-3V-18H-12V-23H10V-19H18V-10H6V-13H-3V-5H-12V3H-22V12H-29V-3Z',
    crop:'M-18-3V-17H-13V-22H10V-18H17V-10H4V-12H-10V-2Z',
  }[look.style];
  return `<g shape-rendering="crispEdges">
    <path d="M-16-13H12V-9H17V0H21V6H16V15H9V18H-10V14H-16Z" fill="${look.skin}" stroke="${ink}" stroke-width="3"/>
    ${pixel(-16,1,5,10,look.shade)}${pixel(-18,-1,6,7,look.skin)}
    <path d="${hair}" fill="${look.hair}"/>
    ${pixel(-17,-6,30,4,look.accent)}
    ${pixel(4,-1,7,6,'#fffaf0')}${pixel(8,0,3,5,ink)}${pixel(7,-5,7,2,look.hair)}
    ${pixel(8,10,7,2,ink)}${pixel(10,12,4,2,'#fffaf0')}
  </g>`;
}

export function drawAthlete(id,player,group) {
  const look=PLAYER_LOOKS[id],color=TEAMS[player.team].color;
  const shoe=name=>`<g transform="translate(0 ${LEG_LENGTHS[1]})">${group(`${name}-shoe`,
    `<path d="M-4-4H6V-1H13V3H15V7H-5V0Z" fill="#fff8e7" stroke="${ink}" stroke-width="2"/>
    ${pixel(-4,4,19,3,look.accent)}${pixel(3,-1,4,2,ink)}`)}</g>`;
  const segment=(length,width,fill)=>`<path d="M0 0V${length}" stroke="${ink}" stroke-width="${width+4}" stroke-linecap="square"/>
    <path d="M0 0V${length}" stroke="${fill}" stroke-width="${width}" stroke-linecap="square"/>`;
  const bone=name=>{
    const arm=name.startsWith('arm'),lengths=arm?ARM_LENGTHS:LEG_LENGTHS;
    const origin=playerBones(player)[name].upper;
    return `<g transform="translate(${origin[0]} ${origin[1]})">${group(`${name}-upper`,segment(lengths[0],arm?8:9,look.skin)
      +(arm?segment(9,10,color):'')+`<g transform="translate(0 ${lengths[0]})">${group(`${name}-lower`,segment(lengths[1],7,look.skin)
      +(arm?pixel(-4,lengths[1]-2,8,7,look.skin):shoe(name)))}</g>`)}</g>`;
  };
  return group('facing',`${bone('leg-back')}${bone('leg-front')}
    <path d="M-14-55H14V-37H3V-43H-3V-37H-14Z" fill="${player.team==='red'?'#813b51':'#214e8c'}" stroke="${ink}" stroke-width="2"/>
    ${group('lean',`${bone('arm-back')}
      <path d="M-10-91H9V-87H16V-53H-15V-87H-10Z" fill="${color}" stroke="${ink}" stroke-width="3"/>
      ${pixel(-12,-82,5,27,player.team==='red'?'#cf354d':'#2265bd')}
      ${pixel(-6,-92,12,5,look.accent)}${pixel(-4,-101,8,10,look.skin)}
      <g transform="translate(0 -112)">${group('head',drawHead(look))}</g>
      ${group('number',`<text y="-65" text-anchor="middle" fill="#fffdf0" font-family="Consolas,monospace" font-size="14" font-weight="bold">${look.number}</text>`)}
      ${bone('arm-front')}
    `)}`);
}

function goal() {
  return `<path d="M34 308V214H126V308L48 302V225L34 214" fill="#d8f9ee" fill-opacity=".4" stroke="${ink}" stroke-width="6"/>
    <path d="M48 225H126M64 225V302M80 225V302M96 225V302M112 225V302M48 241H126M48 257H126M48 273H126M48 289H126" stroke="#fffbed" stroke-width="2" fill="none"/>
    <path d="M34 308V214H126V308" stroke="#fffbed" stroke-width="5" fill="none"/>`;
}

function hoop() {
  return `<path d="M38 308V103H50" stroke="${ink}" stroke-width="10" fill="none"/>
    <rect x="23" y="94" width="50" height="64" fill="#ecfcff" stroke="${ink}" stroke-width="4"/>
    <rect x="48" y="129" width="18" height="22" fill="none" stroke="#ff6b43" stroke-width="3"/>
    <path d="M56 158L64 190H84L94 158M60 158L81 190M68 158L89 179M84 158L66 190M92 158L62 176M61 176H89M63 183H86" stroke="#ffffff" stroke-width="2" fill="none"/>
    <path d="M54 158H95" stroke="#f25836" stroke-width="6" fill="none"/>
    <rect x="26" y="302" width="30" height="10" fill="${ink}"/>`;
}

export function drawStadium() {
  const clouds=[[38,146],[195,74],[932,180]].map(([x,y])=>`<g transform="translate(${x} ${y})" fill="#f1fcff" opacity=".9"><path d="M0 16H16V0H48V-8H80V8H104V32H0Z"/></g>`).join('');
  const bleachers=Array.from({length:54},(_,i)=>pixel(34+i*21,280+(i%3)*9,13,6,['#ff7278','#eefaff','#4e9fee','#ffe89b'][i%4])).join('');
  return `<rect width="1184" height="666" fill="#93daeb"/>
    <path d="M0 210H55V180H115V216H176V187H235V218H294V198H356V235H824V207H887V179H946V218H1006V194H1074V221H1140V187H1184V320H0Z" fill="#5eb7ba"/>
    ${clouds}<g fill="#ffe37d"><path d="M1060 54H1092V46H1124V54H1140V86H1132V110H1100V118H1076V110H1060Z"/>${pixel(1040,78,10,8,'#ffe37d')}${pixel(1110,126,8,10,'#ffe37d')}</g>
    <path d="M0 267H1184V316H0Z" fill="#368b9f"/>
    <path d="M0 267H1184M0 284H1184M0 303H1184" stroke="#b7eddf" stroke-width="5"/>
    ${bleachers}<rect y="317" width="1184" height="349" fill="#69b9a3"/>
    <path d="M38 570H1146V590H38Z" fill="#318875"/>
    <path d="M38 574H1146" stroke="#dffbed" stroke-width="4"/>`;
}

const pitch='M126 124H1058V340H126Z';
const line='fill="none" stroke="#fff9de" stroke-width="3"';
export function drawCourts() {
  const stripes=Array.from({length:8},(_,i)=>pixel(126+i*116.5,124,116.5,216,i%2?'#76cf58':'#66bf4d')).join('');
  const planks=Array.from({length:17},(_,i)=>`<path d="M${126+i*58} 124V340" stroke="#de864e" stroke-width="1" opacity=".35"/>`).join('');
  return `<g class="sports-animated sports-football-scene" opacity="1">
      <path d="${pitch}" fill="#66bf4d" stroke="${ink}" stroke-width="6"/>${stripes}
      <path d="M142 138H1042V326H142ZM592 138V326M142 170H248V298H142M1042 170H936V298H1042M142 207H197V264H142M1042 207H987V264H1042" ${line}/>
      <ellipse cx="592" cy="232" rx="60" ry="45" ${line}/><circle cx="592" cy="232" r="4" fill="#fff9de"/>
      ${goal()}<g transform="translate(1184 0) scale(-1 1)">${goal()}</g>
    </g>
    <g class="sports-animated sports-basketball-scene" opacity="0">
      <path d="${pitch}" fill="#ffbf78" stroke="${ink}" stroke-width="6"/>${planks}
      <path d="M142 184H310V282H142ZM1042 184H874V282H1042Z" fill="#fb826c"/>
      <path d="M142 138H1042V326H142ZM592 138V326M142 184H310V282H142M1042 184H874V282H1042M310 184Q383 233 310 282M874 184Q801 233 874 282M196 138Q466 233 196 326M988 138Q718 233 988 326" ${line}/>
      <ellipse cx="592" cy="232" rx="50" ry="43" ${line}/>
      ${hoop()}<g transform="translate(1184 0) scale(-1 1)">${hoop()}</g>
    </g>
    <g class="sports-animated sports-volleyball-scene" opacity="0">
      <path d="${pitch}" fill="#58b7db" stroke="${ink}" stroke-width="6"/>
      <path d="M162 138H1022V326H162Z" fill="#ffe09a"/>
      <path d="M162 138H1022V326H162ZM382 138V326M802 138V326M592 138V326M162 132V335M1022 132V335" ${line}/>
      <g fill="#fff7d3" font-family="Consolas,monospace" font-size="10" text-anchor="middle"><text x="87" y="354">SERVE ZONE</text><text x="1097" y="354">SERVE ZONE</text></g>
      <path d="M578 160V310M606 160V310" stroke="${ink}" stroke-width="7"/>
      <path d="M578 176H606V274H578Z" fill="#ffffff" fill-opacity=".15" stroke="#fffdf1" stroke-width="4"/>
      <path d="M585 176V274M592 176V274M599 176V274M578 192H606M578 208H606M578 224H606M578 240H606M578 256H606" fill="none" stroke="#fffdf1" stroke-width="1.5"/>
    </g>`;
}

export function drawBall() {
  return `<g id="sports-ball" class="sports-animated sports-ball-position" style="transform:translate(592px,296px)">
    <g class="sports-animated sports-ball-glow" opacity="0"><g class="sports-animated sports-ball-halo">
      <circle r="26" fill="#fffbd0" opacity=".28"/><circle r="19" fill="#fffbe9" opacity=".65"/>
      <path d="M-36 0H-28M28 0H36M0-36V-28M0 28V36M-27-27L-22-22M22 22L27 27M-27 27L-22 22M22-22L27-27" stroke="#fffbd0" stroke-width="3"/>
    </g></g>
    <g class="sports-animated sports-ball-rotation">
      <circle r="13" fill="#fafff7"/><g clip-path="url(#sports-ball-clip)">
      <g class="sports-animated sports-football-skin" opacity="1"><circle r="13" fill="#fafff7"/>
        <path d="M0-5L5-1.5L3 4H-3L-5-1.5Z" fill="${ink}"/>
        <path d="M0-5V-11M5-1.5L11-4M3 4L7 10M-3 4L-7 10M-5-1.5L-11-4" stroke="#839da6" stroke-width="1" fill="none"/>
        <path d="M-4-13H4L2-9H-2ZM11-7L14-1L10 0L8-3ZM10 8L4 14L3 10L6 7ZM-10 8L-4 14L-3 10L-6 7ZM-11-7L-14-1L-10 0L-8-3Z" fill="${ink}"/>
      </g>
      <g class="sports-animated sports-basketball-skin" opacity="0"><circle r="13" fill="#ff963c"/>
        <path d="M-13 0H13M0-13V13M-9-10Q4 0-9 10M9-10Q-4 0 9 10" stroke="#6f3c29" stroke-width="1.6" fill="none"/>
      </g>
      <g class="sports-animated sports-volleyball-skin" opacity="0"><circle r="13" fill="#fff6c7"/>
        <path d="M-13-3Q0-11 9-9L14-2Q1-6-9 7Z" fill="#ffcc40"/><path d="M9-9Q2 3 6 13L-2 14Q-6 2 0-10Z" fill="#3189ff"/>
        <path d="M-10 9Q-1 2 13 5L14 11Q0 7-4 14Z" fill="#ffcc40"/>
        <path d="M-13-3Q0-11 9-9M9-9Q2 3 6 13M-10 9Q-1 2 13 5" stroke="#768f95" stroke-width="1" fill="none"/>
      </g></g><circle r="13" fill="none" stroke="${ink}" stroke-width="2"/>
      <path d="M-7-6L-3-9" stroke="#fffdf0" stroke-width="2" opacity=".8"/>
    </g>
  </g>`;
}

export function drawRoster() {
  return Object.entries(PLAYER_LOOKS).map(([id,look],i)=>`<g transform="translate(${280+i*185} 622)">
    <g transform="scale(.55)">${drawHead(look)}</g><text x="23" y="5" fill="#e6fff6" font-family="Consolas,monospace" font-size="15" font-weight="bold">${id.startsWith('red')?'RED':'BLUE'} ${look.number}</text>
    <rect x="22" y="12" width="65" height="3" fill="${TEAMS[id.split('-')[0]].color}"/>
  </g>`).join('');
}
