import { FLOOR, clamp, mix, smooth, windowWeight } from './sports-rig.mjs';

export const RUN_SPEED = 105;
export const RETURN_LANES = { 'red-1':308, 'red-2':218, 'blue-1':278, 'blue-2':248 };
export const ENTRANCE_COURT = Object.fromEntries(Object.entries({
  'red-1':80, 'red-2':160, 'blue-1':1104, 'blue-2':1024,
}).map(([id,x])=>[id,{x,floor:RETURN_LANES[id]}]));
const other = team => team==='red'?'blue':'red';
const sideX = (team,x) => team==='red'?x:1184-x;

const football = {
  lead:[[0,500],[.75,558],[1.35,588],[1.6,604],[1.95,603],[2.2,542],[2.4,523],[3.15,635],[3.7,624],[4.15,656],[5.1,735],[6.35,864],[7.2,910],[8.8,910]],
  guard:[[0,660],[.75,632],[1.35,640],[1.6,650],[2.05,576],[2.2,564],[2.4,565],[3.15,690],[3.7,673],[4.15,710],[5.1,781],[6.35,902],[6.65,872],[7.2,868],[8.8,868]],
  mate:[[0,220],[.75,328],[1.5,458],[2.5,527],[3.15,559],[3.7,560],[3.85,560],[4.15,594],[5.1,658],[6.35,810],[8.8,840]],
  keeper:[[0,1008],[6.35,1008],[7.65,1028],[8.8,1038]],
};
const basketball = {
  lead:[[0,470],[.8,530],[1.6,578],[1.8,578],[2.1,553],[2.2,496],[2.5,493],[3.3,672],[3.8,698],[4.5,764],[5.4,855],[6.2,888],[6.55,868],[7.2,910],[8.8,910]],
  guard:[[0,615],[.8,580],[1.6,625],[1.8,618],[2.1,540],[2.2,527],[2.5,552],[3.3,718],[3.8,760],[4.5,825],[5.4,870],[6.2,825],[6.55,832],[7.2,860],[8.8,878]],
  mate:[[0,310],[1.6,515],[2.5,680],[3.3,765],[3.8,790],[4.5,790],[5.4,804],[7.2,850],[8.8,850]],
  keeper:[[0,952],[3.3,990],[6.2,962],[7.2,962],[8.8,994]],
};

const tail=(points,start,replacement)=>[...points.filter(([q])=>q<start),...replacement];
export function courtTracks(sport,round={index:0,possession:'red',scorer:'red'}) {
  if(sport==='football'||sport==='basketball') {
    const tracks={...(sport==='football'?football:basketball)},index=round.index??0;
    if(sport==='football') {
      tracks.lead=[[0,592-(1-(FLOOR-244)*.002)*32],...football.lead.slice(1)];
      tracks.guard=[[0,688],...football.guard.slice(1)];
      if(round.possession!==round.scorer) {
        tracks.lead[0]=[0,496];
        tracks.guard[0]=[0,592+(1-(FLOOR-244)*.002)*32];
      }
      if(index===1) {
        tracks.lead=tail(tracks.lead,4.15,[[4.15,656],[5.1,735],[5.8,850],[6.35,878],[7.2,906],[8.8,906]]);
        tracks.guard=tail(tracks.guard,4.15,[[4.15,710],[5.1,781],[5.8,810],[6.35,836],[7.2,866],[8.8,868]]);
        tracks.mate=tail(tracks.mate,3.85,[[3.85,560],[4.15,650],[5.2,820],[5.8,865],[7.2,850],[8.8,850]]);
      } else if(index===2) {
        tracks.lead=tail(tracks.lead,4.15,[[4.15,656],[5.1,735],[5.9,780],[8.8,780]]);
        tracks.guard=tail(tracks.guard,4.15,[[4.15,710],[5.1,781],[5.9,825],[8.8,825]]);
      } else if(index===3) {
        tracks.lead=tail(tracks.lead,4.15,[[4.15,656],[5.1,735],[6.35,840],[7.2,854],[8.8,854]]);
        tracks.guard=tail(tracks.guard,4.15,[[4.15,710],[5.1,781],[6.35,902],[6.65,894],[7.2,905],[8.8,905]]);
        tracks.mate=tail(tracks.mate,3.85,[[3.85,560],[4.15,640],[5.1,760],[6.35,900],[7.2,960],[8.8,960]]);
      }
    } else if(index===0) {
      tracks.lead=tail(tracks.lead,4.5,[[4.5,764],[5.4,810],[6.2,845],[6.55,852],[7.2,852],[8.8,852]]);
      tracks.guard=tail(tracks.guard,4.5,[[4.5,825],[5.4,856],[6.2,895],[7.2,902],[8.8,902]]);
    } else if(index===2) {
      tracks.lead=tail(tracks.lead,4.5,[[4.5,764],[5.4,855],[6.2,932],[6.55,975],[7.2,1002],[8.8,1002]]);
      tracks.guard=tail(tracks.guard,4.5,[[4.5,825],[5.4,895],[6.2,884],[7.2,930],[8.8,930]]);
    } else if(index===3) {
      tracks.mate=tail(tracks.mate,4.5,[[4.5,790],[5.4,830],[6.2,914],[7.2,944],[8.8,944]]);
    } else if(index===4) {
      tracks.lead=tail(tracks.lead,4.5,[[4.5,764],[5.4,880],[6.2,884],[6.55,870],[7.2,886],[8.8,886]]);
      tracks.guard=tail(tracks.guard,4.5,[[4.5,825],[5.4,918],[6.2,932],[7.2,932],[8.8,932]]);
    }
    return tracks;
  }
  const returns=round.possession===round.scorer;
  const firstHit=returns?4.5:5.1;
  return {
    lead:[[0,96],[1.1,96],[3.8,222],[5.2,286],[6.5,286],[7.5,520],[8.8,520]],
    guard:[[0,286],[3.1,286],[firstHit-.5,520],[firstHit+.5,520],[7.5,550],[8.8,550]],
    mate:[[0,430],[8.8,430]], keeper:[[0,430],[8.8,430]],
  };
}

export function track(points,time) {
  for(let i=1;i<points.length;i++) if(time<=points[i][0]) {
    const a=points[i-1],b=points[i];
    return mix(a[1],b[1],smooth((time-a[0])/(b[0]-a[0])));
  }
  return points.at(-1)[1];
}

export function trackVelocity(points,time) {
  for(let i=1;i<points.length;i++) if(time<=points[i][0]) {
    const a=points[i-1],b=points[i],u=clamp((time-a[0])/(b[0]-a[0]));
    return (b[1]-a[1])*6*u*(1-u)/(b[0]-a[0]);
  }
  return 0;
}

export function roleFloor(sport,role,q,round={index:0}) {
  if(sport==='football'&&q<.75) return mix(role==='mate'||role==='keeper'?232:244,
    role==='mate'?FLOOR-86:FLOOR,smooth(q/.75));
  if(sport==='basketball'&&round.index===2&&role==='keeper') return FLOOR-86*smooth((q-4.8)/1.2);
  if(role==='mate' || sport==='volleyball'&&role==='keeper') return FLOOR-86;
  if(role!=='lead' || sport==='volleyball') return FLOOR;
  return FLOOR-56*Math.max(windowWeight(q,1.55,1.85,2.1,2.4),
    sport==='football'?windowWeight(q,6,6.35,6.85,7.2):windowWeight(q,4.9,5.1,5.95,6.2),
    sport==='football'&&round.index===1?windowWeight(q,4.9,5.1,5.95,6.2):0);
}

export const choreographyDuration = (sport,round) => sport==='volleyball'&&round.possession!==round.scorer?6.4:8.8;

export function courtAt(sport,round,q) {
  const team=sport==='volleyball'?round.possession:round.scorer,opp=other(team);
  const tracks=courtTracks(sport,round);
  return Object.fromEntries(Object.entries({lead:`${team}-1`,mate:`${team}-2`,guard:`${opp}-1`,keeper:`${opp}-2`}).map(([role,id])=>[
    id,{x:sideX(sport==='volleyball'&&(role==='guard'||role==='keeper')?opp:team,track(tracks[role],q)),floor:roleFloor(sport,role,q,round)},
  ]));
}

export const entranceCourt=sport=>sport==='football'
  ?courtAt('football',{index:0,possession:'red',scorer:'red'},0):ENTRANCE_COURT;

// Build a baseline clock that smooths fast passages and direction changes.
// The match's uniform time scale retimes this clock for 80-second playback.
const clocks = new Map();
const Q_STEP = 1/120;
function playClock(sport,round) {
  const returns=round.possession===round.scorer,key=`${sport}-${round.index??0}-${returns}`;
  if(clocks.has(key)) return clocks.get(key);
  const end=choreographyDuration(sport,round),tracks=courtTracks(sport,round);
  const qs=Array.from({length:Math.ceil(end/Q_STEP)+1},(_,i)=>Math.min(end,i*Q_STEP));
  const rates=qs.map(q=>{
    const speed=Math.max(...Object.entries(tracks).map(([role,points])=>{
      const depth=(roleFloor(sport,role,q+.0001,round)-roleFloor(sport,role,q-.0001,round))/.0002;
      return Math.hypot(trackVelocity(points,q),depth);
    }));
    return Math.hypot(1,speed/RUN_SPEED);
  });
  // Anticipate sharp direction changes before they happen, and release the
  // throttle gradually afterward, rather than making the runners dash.
  const envelope=rates.map((_,i)=>Math.max(...rates.slice(Math.max(0,i-12),i+13)));
  const times=[0];
  for(let i=1;i<qs.length;i++) times.push(times[i-1]+(qs[i]-qs[i-1])*(envelope[i]+envelope[i-1])/2);
  const result={qs,times,duration:times.at(-1)};
  clocks.set(key,result);
  return result;
}

export function playDuration(sport,round) { return playClock(sport,round).duration; }
export function elapsedAtQ(sport,round,q) {
  const clock=playClock(sport,round),i=Math.min(clock.qs.length-2,Math.floor(clamp(q,0,clock.qs.at(-1))/Q_STEP));
  return mix(clock.times[i],clock.times[i+1],clamp((q-clock.qs[i])/(clock.qs[i+1]-clock.qs[i])));
}
export function qAtElapsed(sport,round,elapsed) {
  const clock=playClock(sport,round);
  if(elapsed>=clock.duration-1e-6) return clock.qs.at(-1);
  let low=0,high=clock.times.length-1;
  while(high-low>1) {const mid=Math.floor((low+high)/2);if(clock.times[mid]>elapsed) high=mid;else low=mid;}
  return mix(clock.qs[low],clock.qs[high],clamp((elapsed-clock.times[low])/(clock.times[high]-clock.times[low])));
}
export function paceAtQ(sport,round,q) {
  const clock=playClock(sport,round),i=Math.min(clock.qs.length-2,Math.floor(clamp(q,0,clock.qs.at(-1))/Q_STEP));
  return (clock.qs[i+1]-clock.qs[i])/(clock.times[i+1]-clock.times[i]);
}

// Change depth first, cross in separate lanes, then settle into formation.
// Match timing scales all three legs together with the authored plays.
export function returnPlan(from,to) {
  const ids=Object.keys(from);
  const enter=Math.max(.65,...ids.map(id=>1.5*Math.abs(from[id].floor-RETURN_LANES[id])/RUN_SPEED));
  const cross=Math.max(1,...ids.map(id=>1.5*Math.abs(to[id].x-from[id].x)/RUN_SPEED));
  const settle=Math.max(.65,...ids.map(id=>1.5*Math.abs(to[id].floor-RETURN_LANES[id])/RUN_SPEED));
  return {enter,cross,settle,duration:enter+cross+settle};
}

export function returnPosition(id,from,to,elapsed,plan) {
  const t=clamp(elapsed,0,plan.duration),lane=RETURN_LANES[id];
  const entry=smooth(t/plan.enter),cross=smooth((t-plan.enter)/plan.cross),settle=smooth((t-plan.enter-plan.cross)/plan.settle);
  const floor=mix(mix(from.floor,lane,entry),to.floor,settle),x=mix(from.x,to.x,cross);
  const travelled=Math.abs(lane-from.floor)*entry+Math.abs(to.x-from.x)*cross+Math.abs(to.floor-lane)*settle;
  const derivative=(u,duration)=>{const p=clamp(u/duration);return 6*p*(1-p)/duration;};
  const vx=(to.x-from.x)*derivative(t-plan.enter,plan.cross);
  const vy=t<plan.enter?(lane-from.floor)*derivative(t,plan.enter)
    :t>plan.enter+plan.cross?(to.floor-lane)*derivative(t-plan.enter-plan.cross,plan.settle):0;
  return {x,floor,travelled,speed:Math.hypot(vx,vy),direction:to.x>=from.x?1:-1};
}
