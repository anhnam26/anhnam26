import { MATCHES, SPORTS_DURATION, INTRO_DURATION, TRANSITION_START, matchStateAt } from './sports-matches.mjs';
import { FLOOR, POSES, makePlayer, worldHand, legAngles, strideFeet, blendPose, smooth, mix, clamp, windowWeight } from './sports-rig.mjs';
export { SPORTS_DURATION };

export const PLAYER_IDS = ['red-1', 'red-2', 'blue-1', 'blue-2'];
export const VOLLEYBALL_BASELINES = { left:162, right:1022 };
const other = team => team==='red'?'blue':'red';
const direction = team => team==='red'?1:-1;
const sideX = (team,x) => team==='red'?x:1184-x;
const pair = (a,b,w) => a.map((value,i)=>mix(value,b[i],w));

function track(points,time) {
  for (let i=1;i<points.length;i++) if (time<=points[i][0]) {
    const a=points[i-1],b=points[i];
    return mix(a[1],b[1],smooth((time-a[0])/(b[0]-a[0])));
  }
  return points.at(-1)[1];
}

function curve(points,progress) {
  let values=points;
  while (values.length>1) values=values.slice(1).map((point,i)=>pair(values[i],point,progress));
  return values[0];
}

function flight(time,segments) {
  const [from,to,points]=segments.find(segment=>time<=segment[1])??segments.at(-1);
  return curve(points,clamp((time-from)/(to-from)));
}

export function actionDuration(sport,round) {
  return Math.min(round.scoreAt-round.start, choreographyDuration(sport,round));
}

export const choreographyDuration = (sport,round) => sport==='volleyball'?(round.possession===round.scorer?8.8:6.4):8.8;
export const actionTimeAt = (matchIndex,roundIndex,q) => {
  const match=MATCHES[matchIndex],round=match.rounds[roundIndex];
  return matchIndex*60+round.scoreAt-actionDuration(match.sport,round)
    +q*actionDuration(match.sport,round)/choreographyDuration(match.sport,round);
};

function basePlayers(sport) {
  const xs=sport==='football'?[500,220]:sport==='basketball'?[470,310]:[96,430];
  return Object.fromEntries(PLAYER_IDS.map(id=>{
    const [team,index]=id.split('-');
    return [id,makePlayer(id,team,sideX(team,xs[Number(index)-1]),FLOOR-(index==='2'?8:0))];
  }));
}

function move(player,team,points,q) {
  const position=track(points,q);
  player.x=sideX(team,position);
  const speed=(track(points,q+.015)-track(points,Math.max(0,q-.015)))/.03;
  let travelled=0;
  for (let i=1;i<points.length;i++) {
    if(q>=points[i][0]) travelled+=Math.abs(points[i][1]-points[i-1][1]);
    else {travelled+=Math.abs(position-points[i-1][1]);break;}
  }
  const amount=clamp(Math.abs(speed)/55),wave=Math.sin(travelled/(48*player.scale)*Math.PI*2);
  player.motion={travelled,direction:direction(team)*(speed>=0?1:-1),amount};
  player.y+=player.scale*amount*(6.5+1.5*Math.cos(travelled/(48*player.scale)*Math.PI*4));
  player.lean=amount*8;
  player.arms=blendPose(POSES.idle,{front:[-10-wave*28,-46-wave*28],back:[-10+wave*28,-46+wave*28]},amount);
  if(amount>.1) player.action='run';
}

function arms(player,pose,amount=1) {
  player.arms=blendPose(player.arms,POSES[pose],amount);
  if(amount>.5) player.action=pose;
}

function crouch(player,weight,depth=8) {
  player.y+=player.scale*depth*weight;
  player.lean+=12*weight;
}

function jump(player,q,contact,height=48) {
  const takeoff=contact-.4,land=contact+.55;
  crouch(player,windowWeight(q,takeoff-.3,takeoff-.16,takeoff-.09,takeoff),7);
  const progress=clamp((q-takeoff)/(land-takeoff));
  const airborne=4*progress*(1-progress);
  player.y-=player.scale*height*airborne;
  player.airborne=Math.max(player.airborne??0,airborne);
  crouch(player,windowWeight(q,land,land+.12,land+.18,land+.4),8);
}

function kick(player,q,when) {
  const weight=windowWeight(q,when-.3,when,when+.04,when+.32);
  player.kickWeight=Math.max(player.kickWeight??0,weight);
  if(weight>.5) player.kickReach=32;
  arms(player,'shield',weight*.7);
  player.lean+=8*weight;
  if(weight>.5) player.action='kick';
}

function challenge(player,q,when,sport,reach=10) {
  const weight=windowWeight(q,when-.28,when,when+.1,when+.45);
  crouch(player,weight);
  arms(player,sport==='football'?'shield':'reach',weight);
  if(sport==='football') {
    if(weight>(player.kickWeight??0)) player.kickReach=reach;
    player.kickWeight=Math.max(player.kickWeight??0,weight);
  }
  if(weight>.5) player.action=sport==='football'?'tackle':'steal';
}

function bump(player,q,when) {
  const weight=windowWeight(q,when-.35,when,when+.1,when+.5);
  arms(player,'bump',weight);
  crouch(player,weight,9);
}

function spike(player,q,when) {
  arms(player,'cock',windowWeight(q,when-.9,when-.5,when-.27,when));
  arms(player,'strike',windowWeight(q,when-.27,when,when+.04,when+.27));
  arms(player,'follow',windowWeight(q,when+.04,when+.25,when+.45,when+.85));
  jump(player,q,when,63);
}

function poseLegs(player) {
  const motion=player.motion??{travelled:0,direction:player.facing,amount:0};
  const stride=strideFeet(player.x,motion.travelled,motion.direction,player.floor,player.scale);
  for(const [index,leg] of ['front','back'].entries()) {
    const neutral=player.x+player.scale*player.facing*(index===0?9:-9);
    let target=[mix(neutral,stride[leg].x,motion.amount),mix(player.floor,stride[leg].y,motion.amount)];
    if(player.kickWeight) target=pair(target,leg==='front'
      ?[player.x+player.scale*player.facing*(player.kickReach??32),player.floor-player.scale*8]
      :[player.x-player.scale*player.facing*14,player.floor],player.kickWeight);
    const local=[player.facing*(target[0]-player.x)/player.scale,(target[1]-player.y)/player.scale];
    const grounded=legAngles([index===0?5:-5,-41],local);
    const tuck=leg==='front'?[-24,58]:[5,88];
    player.legs[leg]=pair(grounded,tuck,player.airborne??0);
  }
}

function playersDuring(sport,round,q) {
  const players=basePlayers(sport),team=sport==='volleyball'?round.possession:round.scorer,opponent=other(team);
  const lead=players[`${team}-1`],mate=players[`${team}-2`];
  const guard=players[`${opponent}-1`],keeper=players[`${opponent}-2`];
  const place=(player,points)=>move(player,team,points,q);
  const lane=(player,depth)=>{player.floor=FLOOR-depth;player.y=player.floor;player.scale=1-depth*.002;};
  if(sport!=='volleyball') {
    lane(mate,86);lane(keeper,0);
    // The attacker sidesteps into the back of the court before either crossing.
    // The thief keeps the front lane while the opponent turns back to recover.
    lane(lead,56*Math.max(windowWeight(q,1.55,1.85,2.1,2.4),
      sport==='football'?windowWeight(q,6.0,6.35,6.85,7.2):windowWeight(q,4.9,5.1,5.95,6.2)));
    lane(guard,0);
  }
  if(sport==='football') {
    place(lead,[[0,500],[.75,558],[1.35,588],[1.6,604],[1.95,603],[2.2,542],[2.4,523],[3.15,635],[3.7,624],[4.15,656],[5.1,735],[6.35,864],[7.2,910],[8.8,910]]);
    place(guard,[[0,660],[.75,632],[1.35,640],[1.6,650],[2.05,576],[2.2,564],[2.4,565],[3.15,690],[3.7,673],[4.15,710],[5.1,781],[6.35,902],[6.65,872],[7.2,868],[8.8,868]]);
    place(mate,[[0,220],[.75,328],[1.5,458],[2.5,527],[3.15,559],[3.7,560],[3.85,560],[4.15,594],[5.1,658],[6.35,810],[8.8,840]]);
    place(keeper,[[0,1008],[6.35,1008],[7.65,1028],[8.8,1038]]);
    if(round.possession===round.scorer) challenge(guard,q,1.35,sport);
    challenge(lead,q,2.4,sport,28);
    challenge(guard,q,3.15,sport);challenge(guard,q,6.65,sport);
    kick(mate,q,3.85);kick(lead,q,7.2);
    arms(lead,'shield',windowWeight(q,.9,1.25,1.5,1.9));
    const save=windowWeight(q,7.25,7.9,8.55,8.8);
    arms(keeper,'save',save);crouch(keeper,save,10);
  } else if(sport==='basketball') {
    place(lead,[[0,470],[.8,530],[1.6,578],[1.8,578],[2.1,553],[2.2,496],[2.5,493],[3.3,672],[3.8,698],[4.5,764],[5.4,855],[6.2,888],[6.55,868],[7.2,910],[8.8,910]]);
    place(guard,[[0,615],[.8,580],[1.6,625],[1.8,618],[2.1,540],[2.2,527],[2.5,552],[3.3,718],[3.8,760],[4.5,825],[5.4,870],[6.2,825],[6.55,832],[7.2,860],[8.8,878]]);
    place(mate,[[0,310],[1.6,515],[2.5,680],[3.3,765],[3.8,790],[4.5,790],[5.4,804],[7.2,850],[8.8,850]]);
    place(keeper,[[0,952],[3.3,990],[6.2,962],[7.2,962],[8.8,994]]);
    const balanceArm=lead.arms.back;
    arms(lead,'dribble');lead.arms.back=balanceArm;
    const dribbling=q<1.4 || q>=5.15 && q<6.55;
    const push=dribbling?Math.sin(Math.PI*(q<1.4?q:q-5.15)/.6)**2:0;
    lead.arms.front=[-25+10*push,-78+22*push];
    arms(guard,'shield',.5);
    crouch(lead,windowWeight(q,.55,.8,1.05,1.35),7);
    if(round.possession===round.scorer) challenge(guard,q,1.65,sport);
    challenge(lead,q,2.3,sport);
    arms(guard,'carry',windowWeight(q,1.65,1.8,2.2,2.4));
    arms(lead,'carry',windowWeight(q,2.25,2.5,2.85,3.2));
    arms(lead,'reach',windowWeight(q,2.9,3.2,3.25,3.6));
    arms(mate,'carry',windowWeight(q,3.4,3.85,4.05,4.25));
    arms(mate,'reach',windowWeight(q,4.05,4.25,4.3,4.65));
    arms(lead,'carry',windowWeight(q,4.85,5.15,5.3,5.5));
    challenge(guard,q,5.9,sport);
    crouch(lead,windowWeight(q,6.1,6.25,6.45,6.65),8);
    arms(lead,'carry',windowWeight(q,6.2,6.55,6.7,6.9));
    arms(lead,'shoot',windowWeight(q,6.7,7.2,7.3,7.65));
    arms(lead,'follow',windowWeight(q,7.3,7.55,7.7,8.2));
    arms(lead,'idle',windowWeight(q,8.0,8.2,8.8,8.9));
    arms(guard,'guard',windowWeight(q,6.5,7.0,7.45,7.85));
    arms(keeper,'guard',windowWeight(q,6.75,7.2,7.5,7.9));
    jump(lead,q,7.2,44);jump(guard,q,7.24,38);jump(keeper,q,7.4,22);
  } else {
    lane(mate,86);lane(keeper,86);
    const returns=team===round.scorer,firstHit=returns?4.5:5.1;
    place(lead,[[0,96],[1.1,96],[3.8,222],[5.2,286],[6.5,286],[7.5,520],[8.8,520]]);
    move(guard,opponent,[[0,286],[3.1,286],[firstHit-.5,520],[firstHit+.5,520],[7.5,550],[8.8,550]],q);
    arms(lead,'carry',windowWeight(q,0,0,.2,.5));
    arms(lead,'strike',windowWeight(q,.25,.8,.9,1.2));
    arms(lead,'follow',windowWeight(q,.9,1.15,1.4,1.75));
    lead.lean+=8*windowWeight(q,.3,.8,.9,1.3);
    bump(guard,q,2.2);
    keeper.facing=-direction(opponent);
    arms(keeper,'set',windowWeight(q,2.6,3.1,3.2,3.65));
    crouch(keeper,windowWeight(q,2.6,2.85,2.9,3.1),5);
    spike(guard,q,firstHit);
    if(returns) {
      bump(lead,q,5.6);
      mate.facing=-direction(team);
      arms(mate,'set',windowWeight(q,6.05,6.5,6.6,6.9));
      crouch(mate,windowWeight(q,6.05,6.25,6.3,6.5),5);
      spike(lead,q,7.5);
      arms(guard,'guard',windowWeight(q,6.9,7.5,7.65,8.0));
      jump(guard,q,7.5,53);
    } else {
      // A losing defender lunges low for the last spike; the ball lands just
      // beyond the outstretched hands, rather than everybody watching it fall.
      const dive=windowWeight(q,firstHit+.12,firstHit+.7,firstHit+.9,6.4);
      arms(lead,'bump',dive);
      crouch(lead,dive,18);lead.lean+=36*dive;
    }
  }
  for(const player of Object.values(players)) poseLegs(player);
  return players;
}

const midHands=player=>pair(worldHand(player,'front'),worldHand(player,'back'),.5);
function handAt(sport,round,q,id,hand='front') {
  const player=playersDuring(sport,round,q)[id];
  return hand==='both'?midHands(player):worldHand(player,hand);
}

function ballDuring(sport,round,q) {
  const team=sport==='volleyball'?round.possession:round.scorer,opponent=other(team);
  const leadId=`${team}-1`,mateId=`${team}-2`,guardId=`${opponent}-1`;
  const transform=point=>[sideX(team,point[0]),point[1]];
  if(sport==='football') {
    const players=playersDuring(sport,round,q),lead=players[leadId],guard=players[guardId];
    const footBall=(player,time=q)=>[player.x+player.scale*direction(player.team)*32,player.floor-12-2*Math.sin(time*Math.PI*4)**2];
    if(round.possession!==round.scorer && q<2.2) return footBall(guard);
    if(q<1.35 || q>=2.4 && q<3.15 || q>=4.15 && q<7.2) return footBall(lead);
    if(q>=1.6 && q<2.2) return footBall(guard);
    const at=(id,time)=>footBall(playersDuring(sport,round,time)[id],time);
    const looseFrom=at(guardId,2.2),looseTo=at(leadId,2.4);
    return flight(q,[
      [1.35,1.6,[at(leadId,1.35),transform([612,284]),at(guardId,1.6)]],
      [2.2,2.4,[looseFrom,[(looseFrom[0]+looseTo[0])/2,286],looseTo]],
      [3.15,3.7,[at(leadId,3.15),transform([624,283]),at(mateId,3.7)]],
      [3.7,3.85,[at(mateId,3.7),at(mateId,3.7)]],
      [3.85,4.15,[at(mateId,3.7),transform([642,282]),at(leadId,4.15)]],
      [7.2,8.8,[at(leadId,7.2),transform([1040,226]),transform([1110,276])]],
    ]);
  }
  if(sport==='basketball') {
    const hand=(id,time)=>handAt(sport,round,time,id);
    const looseFrom=hand(guardId,2.2),looseTo=hand(leadId,2.5);
    if(round.possession!==round.scorer && q<2.2) {
      const point=hand(guardId,q),bounce=Math.sin(Math.PI*q/.6)**2*windowWeight(q,0,.1,1.5,1.8);
      return [point[0],mix(point[1],playersDuring(sport,round,q)[guardId].floor-12,bounce)];
    }
    if(q<1.4 || q>=5.15 && q<6.55) {
      const point=hand(leadId,q),bounce=Math.sin(Math.PI*(q<1.4?q:q-5.15)/.6)**2
        * (q<1.4?windowWeight(q,0,.1,1.2,1.4):windowWeight(q,5.15,5.25,6.35,6.55));
      return [point[0],mix(point[1],playersDuring(sport,round,q)[leadId].floor-12,bounce)];
    }
    if(q>=1.8 && q<2.2) return hand(guardId,q);
    if(q>=2.5 && q<3.2 || q>=6.55 && q<=7.2) return hand(leadId,q);
    if(q>=3.85 && q<4.25) return hand(mateId,q);
    return flight(q,[
      [1.4,1.8,[hand(leadId,1.4),transform([608,292]),hand(guardId,1.8)]],
      [2.2,2.5,[looseFrom,[(looseFrom[0]+looseTo[0])/2,280],looseTo]],
      [3.2,3.85,[hand(leadId,3.2),transform([750,196]),hand(mateId,3.85)]],
      [4.25,5.15,[hand(mateId,4.25),transform([840,196]),hand(leadId,5.15)]],
      [7.2,8.8,[hand(leadId,7.2),transform([1040,100]),transform([1110,158])]],
    ]);
  }
  const returns=team===round.scorer,firstHit=returns?4.5:5.1;
  const serve=handAt(sport,round,.8,leadId),receive=handAt(sport,round,2.2,guardId,'both');
  const setter=handAt(sport,round,3.1,`${opponent}-2`,'both');
  const hitter=handAt(sport,round,firstHit,guardId);
  const scoreFloor=[round.scorer==='red'?990:194,296];
  const shots=[
    [0,.8,[handAt(sport,round,0,leadId),[sideX(team,125),132],serve]],
    [.8,2.2,[serve,[592,64],receive]],
    [2.2,3.1,[receive,[(receive[0]+setter[0])/2,182],setter]],
    [3.1,firstHit,[setter,[(setter[0]+hitter[0])/2,108],hitter]],
  ];
  if(returns) {
    const dig=handAt(sport,round,5.6,leadId,'both');
    const ownSet=handAt(sport,round,6.5,mateId,'both'),ownHit=handAt(sport,round,7.5,leadId);
    shots.push([firstHit,5.6,[hitter,[592,112],dig]],
      [5.6,6.5,[dig,[(dig[0]+ownSet[0])/2,184],ownSet]],
      [6.5,7.5,[ownSet,[(ownSet[0]+ownHit[0])/2,108],ownHit]],
      [7.5,8.8,[ownHit,[592,112],scoreFloor]]);
  } else shots.push([firstHit,6.4,[hitter,[592,112],scoreFloor]]);
  return flight(q,shots);
}

function initialState(sport,round) {
  return {players:playersDuring(sport,round,0),ball:ballDuring(sport,round,0)};
}

function entranceState(sport,round) {
  const initial=initialState(sport,round);
  const floors={'red-1':308,'red-2':218,'blue-1':278,'blue-2':248};
  const xs={'red-1':80,'red-2':160,'blue-1':1104,'blue-2':1024};
  return {players:Object.fromEntries(PLAYER_IDS.map(id=>[id,makePlayer(id,initial.players[id].team,xs[id],floors[id])])),ball:[592,296]};
}

function interpolatePlayers(a,b,weight,progress,duration) {
  return Object.fromEntries(PLAYER_IDS.map(id=>{
    const player={...a[id],x:mix(a[id].x,b[id].x,weight),y:mix(a[id].y,b[id].y,weight),floor:mix(a[id].floor,b[id].floor,weight),lean:mix(a[id].lean,b[id].lean,weight)};
    // Four distinct return paths let teammates and opponents pass without
    // pushing their bodies through one another during a restart or court change.
    const corridor={ 'red-1':308,'red-2':218,'blue-1':278,'blue-2':248 }[id];
    const floor=mix(player.floor,corridor,windowWeight(progress,0,.06,.94,1));
    player.y+=floor-player.floor;player.floor=floor;
    player.scale=1-(FLOOR-player.floor)*.002;
    player.arms=blendPose(a[id].arms,b[id].arms,weight);
    player.legs={front:pair(a[id].legs.front,b[id].legs.front,weight),back:pair(a[id].legs.back,b[id].legs.back,weight)};
    const distance=b[id].x-a[id].x;
    const amount=clamp(Math.abs(distance)*6*progress*(1-progress)/duration/55);
    const travelled=Math.abs(player.x-a[id].x);
    player.motion={travelled,direction:distance>=0?1:-1,amount};
    player.airborne=0;player.kickWeight=0;
    const wave=Math.sin(travelled/(48*player.scale)*Math.PI*2);
    player.arms=blendPose(player.arms,{front:[-10-wave*28,-46-wave*28],back:[-10+wave*28,-46+wave*28]},amount*.9);
    player.y+=player.scale*amount*(6.5+1.5*Math.cos(travelled/(48*player.scale)*Math.PI*4));
    return [id,player];
  }));
}

export function sportsStateAt(seconds) {
  const match=matchStateAt(seconds),duration=actionDuration(match.sport,match.round);
  const q=clamp(match.roundTime-(match.roundDuration-duration),0,duration)
    *choreographyDuration(match.sport,match.round)/duration;
  let players=playersDuring(match.sport,match.round,q),ball=ballDuring(match.sport,match.round,q);
  let possession=match.possession;
  const scenes={football:0,basketball:0,volleyball:0};scenes[match.sport]=1;
  let morph=0;
  if(match.phase==='intro') {
    const entrance=entranceState(match.sport,match.round),initial=initialState(match.sport,match.round);
    const progress=clamp(match.matchTime/5);
    players=interpolatePlayers(entrance.players,initial.players,smooth(progress),progress,5);
    ball=pair(entrance.ball,initial.ball,smooth((match.matchTime-5)/(INTRO_DURATION-5)));
  }
  if(match.phase==='play' && match.sport!=='volleyball') {
    const stolen=match.sport==='football'?q>=1.6&&q<2.4:q>=1.8&&q<2.5;
    if(match.round.possession!==match.round.scorer) possession=q<(match.sport==='football'?2.4:2.5)?match.round.possession:match.round.scorer;
    else if(stolen) possession=other(match.round.possession);
  }
  if(match.phase==='restart') {
    const nextRound=MATCHES[match.matchIndex].rounds[match.round.index+1];
    const next=initialState(match.sport,nextRound),elapsed=match.matchTime-match.round.scoreAt;
    const weight=smooth(elapsed/2);
    players=interpolatePlayers(players,next.players,weight,clamp(elapsed/2),2);
    const controls=match.sport==='football'?[ball,[ball[0],296],next.ball]
      :match.sport==='basketball'?[ball,[ball[0],232],[next.ball[0],296],next.ball]
      :[ball,[ball[0],112],[next.ball[0],112],next.ball];
    ball=curve(controls,clamp(elapsed/2));
  } else if(match.winner) {
    for(const player of Object.values(players)) if(player.team===match.winner) {
      arms(player,'celebrate',windowWeight(match.matchTime,56,56.3,58,59.8));
      jump(player,match.matchTime,57+(player.id.endsWith('2')?.15:0),32);
    }
    if(match.phase==='transition') {
      const nextIndex=(match.matchIndex+1)%3,nextMatch=MATCHES[nextIndex];
      const next=entranceState(nextMatch.sport,nextMatch.rounds[0]),progress=(match.matchTime-TRANSITION_START)/(60-TRANSITION_START),weight=smooth(progress);
      players=interpolatePlayers(players,next.players,weight,progress,2);
      ball=curve([ball,[ball[0],25],[next.ball[0],25],next.ball],smooth(progress));
      morph=Math.sin(Math.PI*progress);
      scenes[match.sport]=1-weight;scenes[match.nextSport]=weight;
    }
  }
  for(const player of Object.values(players)) {
    player.facing=ball[0]>=player.x?1:-1;
    poseLegs(player);
    const lean=player.lean*Math.PI/180;
    const headX=player.x+player.scale*player.facing*69*Math.sin(lean);
    const headY=player.y-player.scale*(41+69*Math.cos(lean));
    player.headAngle=clamp(Math.atan2(ball[1]-headY,Math.abs(ball[0]-headX))*180/Math.PI-player.lean,-55,55);
    player.layer=player.floor<233?0:player.floor<263?1:player.floor<293?2:3;
  }
  const extraTurns=match.matchIndex*720+(match.phase==='transition'?720*smooth((match.matchTime-TRANSITION_START)/(60-TRANSITION_START)):0);
  return {...match,possession,players,scenes,morph,ball:{x:ball[0],y:ball[1],rotation:match.time*180+extraTurns},actionTime:q};
}

export function contactEvents(matchIndex,roundIndex) {
  const match=MATCHES[matchIndex],round=match.rounds[roundIndex];
  const at=q=>actionTimeAt(matchIndex,roundIndex,q);
  const team=match.sport==='volleyball'?round.possession:round.scorer;
  const player=`${team}-1`,mate=`${team}-2`,opp=other(team);
  if(match.sport==='football') return [];
  if(match.sport==='basketball') return [
    {time:at(1.8),player:`${opp}-1`,hand:'front',action:round.possession===round.scorer?'steal':'carry'},
    {time:at(2.5),player,hand:'front',action:round.possession===round.scorer?'recover':'steal'},
    {time:at(3.2),player,hand:'front',action:'pass'},
    {time:at(3.85),player:mate,hand:'front',action:'catch'},
    {time:at(4.25),player:mate,hand:'front',action:'pass'},
    {time:at(5.15),player,hand:'front',action:'catch'},
    {time:at(7.2),player,hand:'front',action:'shoot'},
  ];
  const events=[{time:at(.8),player,hand:'front',action:'serve'},
    {time:at(2.2),player:`${opp}-1`,hand:'both',action:'bump'},
    {time:at(3.1),player:`${opp}-2`,hand:'both',action:'set'},
    {time:at(round.scorer===round.possession?4.5:5.1),player:`${opp}-1`,hand:'front',action:'spike'}];
  if(round.scorer===round.possession) events.push({time:at(5.6),player,hand:'both',action:'bump'},
    {time:at(6.5),player:mate,hand:'both',action:'set'},{time:at(7.5),player,hand:'front',action:'spike'});
  return events;
}
