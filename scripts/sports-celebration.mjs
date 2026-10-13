import { CELEBRATION_DURATION } from './sports-matches.mjs';
import { clamp, mix, windowWeight } from './sports-rig.mjs';

export const FIREWORK_COUNT = 6;
export const CONFETTI_COUNT = 8;

export function celebrationAt(state) {
  const active=state.phase==='victory'&&state.winner!==null;
  const t=active?state.matchTime-state.winAt:0;
  const opacity=active?windowWeight(t,0,.12,CELEBRATION_DURATION-.7,CELEBRATION_DURATION-.05):0;
  const fireworks=Array.from({length:FIREWORK_COUNT},(_,i)=>{
    const side=i%2,wave=Math.floor(i/2),start=.1+wave*.9+side*.18;
    const age=t-start,flight=clamp(age/.55),burst=clamp((age-.55)/1.35);
    const x=(side?976:208)+(wave-1)*24,y=130+wave*13;
    return {
      rocket:[x,mix(320,y,1-(1-flight)**2)],
      rocketOpacity:active&&age>=0&&age<.55?Math.min(1,age*12):0,
      burstOpacity:active&&age>=.55&&age<1.9?(1-burst)**1.5:0,
      scale:.08+1.25*(1-(1-burst)**3),rotation:burst*38+wave*17,
    };
  });
  const confetti=Array.from({length:CONFETTI_COUNT},(_,i)=>{
    const side=i%2,bank=Math.floor(i/2),start=.15+bank*.26;
    const age=t-start,u=clamp(age,0,3.7),sign=side?-1:1;
    return {
      position:[(side?1114:70)+sign*(140+bank*28)*u,580-(285+bank*18)*u+130*u*u],
      scale:Math.min(1.15,.03+u*.9),rotation:sign*(bank*19+u*(27+bank*8)),
      opacity:active&&age>=0&&age<3.7?Math.min(1,age*10)*clamp((3.7-age)/.65):0,
    };
  });
  return {opacity,fireworks,confetti};
}

export function drawCelebration() {
  const fireworks=Array.from({length:FIREWORK_COUNT},(_,i)=>{
    const rays=Array.from({length:14},(_,j)=>{
      const angle=j*360/14,fill=j%3===0?'#fff7bf':j%3===1?'currentColor':'#ffcc58';
      return `<g transform="rotate(${angle})"><path d="M0-18V-43" stroke="${fill}" stroke-width="2.5"/><rect x="-3" y="-57" width="6" height="6" fill="${fill}"/><rect x="-1.5" y="-68" width="3" height="3" fill="#fffdf0"/></g>`;
    }).join('');
    const side=i%2,wave=Math.floor(i/2),x=(side?976:208)+(wave-1)*24,y=130+wave*13;
    return `<g class="sports-animated sports-firework-${i}-rocket-position"><g class="sports-animated sports-firework-${i}-rocket-opacity" opacity="0">
      <path d="M0 3V24" stroke="#fff3a7" stroke-width="2"/><rect x="-3" y="-3" width="6" height="7" fill="#fffdf0"/>
    </g></g>
    <g transform="translate(${x} ${y})"><g class="sports-animated sports-firework-${i}-burst-opacity" opacity="0"><g class="sports-animated sports-firework-${i}-burst-scale"><g class="sports-animated sports-firework-${i}-burst-rotation">
      ${rays}<rect x="-4" y="-4" width="8" height="8" fill="#fffdf0"/>
    </g></g></g></g>`;
  }).join('');
  const confetti=Array.from({length:CONFETTI_COUNT},(_,i)=>{
    const papers=Array.from({length:10},(_,j)=>{
      const angle=j*2.39996+i,x=Math.cos(angle)*(18+j*6),y=(j*37+i*11)%91-45;
      const fill=['currentColor','#ffd659','#fff9da','#ff879a','#74efd1'][j%5];
      return `<g transform="translate(${x.toFixed(2)} ${y}) rotate(${j*31+i*17})">${j%3===0
        ?`<path d="M-4-3L5 0L-2 5Z" fill="${fill}"/>`
        :`<rect x="-4" y="-2" width="8" height="4" fill="${fill}"/>`}</g>`;
    }).join('');
    return `<g class="sports-animated sports-confetti-${i}-position"><g class="sports-animated sports-confetti-${i}-opacity" opacity="0"><g class="sports-animated sports-confetti-${i}-rotation"><g class="sports-animated sports-confetti-${i}-scale">${papers}</g></g></g></g>`;
  }).join('');
  return `<g id="sports-celebration" class="sports-animated sports-celebration-opacity" opacity="0" aria-label="Fireworks and confetti celebrate the winning team">
    <g class="sports-animated sports-celebration-color" color="#3189ff">
      ${fireworks}${confetti}
      <g transform="translate(70 582) rotate(-35)"><rect x="-9" y="-22" width="18" height="29" fill="currentColor" stroke="#193c50" stroke-width="2"/><rect x="-11" y="-23" width="22" height="5" fill="#ffd659"/></g>
      <g transform="translate(1114 582) rotate(35)"><rect x="-9" y="-22" width="18" height="29" fill="currentColor" stroke="#193c50" stroke-width="2"/><rect x="-11" y="-23" width="22" height="5" fill="#ffd659"/></g>
    </g>
  </g>`;
}
