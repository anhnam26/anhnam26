import { MATCHES, SPORTS_DURATION, CELEBRATION_DURATION, matchStateAt } from './sports-matches.mjs';
import { FLOOR, POSES, makePlayer, worldHand, legAngles, strideFeet, blendPose, smooth, mix, clamp, windowWeight } from './sports-rig.mjs';
import { track, trackVelocity, courtTracks, roleFloor, choreographyDuration, elapsedAtQ, qAtElapsed, paceAtQ, playDuration, returnPosition, entranceCourt } from './sports-paths.mjs';
import { playFor, VOLLEYBALL_LANDINGS } from './sports-plays.mjs';
export { SPORTS_DURATION, choreographyDuration };
export const BALL_SPIN_SPEED=360*Math.ceil(SPORTS_DURATION/2)/SPORTS_DURATION;

export const PLAYER_IDS = ['red-1', 'red-2', 'blue-1', 'blue-2'];
export const VOLLEYBALL_BASELINES = { left:162, right:1022 };
const other = team => team==='red'?'blue':'red';
const direction = team => team==='red'?1:-1;
const sideX = (team,x) => team==='red'?x:1184-x;
const pair = (a,b,w) => a.map((value,i)=>mix(value,b[i],w));

function curve(points,progress) {
  let values=points;
  while (values.length>1) values=values.slice(1).map((point,i)=>pair(values[i],point,progress));
  return values[0];
}

function flight(time,segments) {
  const [from,to,points]=segments.find(segment=>time<=segment[1])??segments.at(-1);
  return curve(points,clamp((time-from)/(to-from)));
}

export const actionDuration = (sport,round) => playDuration(sport,round)*round.timeScale;
export const actionTimeAt = (matchIndex,roundIndex,q) => {
  const match=MATCHES[matchIndex],round=match.rounds[roundIndex];
  return match.startAt+round.start+elapsedAtQ(match.sport,round,q)*round.timeScale;
};

function basePlayers(sport) {
  const xs=sport==='football'?[500,220]:sport==='basketball'?[470,310]:[96,430];
  return Object.fromEntries(PLAYER_IDS.map(id=>{
    const [team,index]=id.split('-');
    return [id,makePlayer(id,team,sideX(team,xs[Number(index)-1]),FLOOR-(index==='2'?8:0))];
  }));
}

function move(player,team,points,q,pace=1) {
  const position=track(points,q);
  player.x=sideX(team,position);
  const speed=trackVelocity(points,q)*pace;
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
  jump(player,q,when,72);
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
  const tracks=courtTracks(sport,round),pace=paceAtQ(sport,round,q)/round.timeScale;
  const place=(player,points)=>move(player,team,points,q,pace);
  const lane=(player,depth)=>{player.floor=FLOOR-depth;player.y=player.floor;player.scale=1-depth*.002;};
  for(const [role,player] of Object.entries({lead,mate,guard,keeper})) lane(player,FLOOR-roleFloor(sport,role,q,round));
  if(sport==='football') {
    place(lead,tracks.lead);
    place(guard,tracks.guard);
    place(mate,tracks.mate);
    place(keeper,tracks.keeper);
    const play=playFor(sport,round),roles={lead,mate,guard,keeper};
    challenge(guard,q,1.35,sport);
    if(play.turnover) challenge(lead,q,2.4,sport,28);
    if(play.turnover&&round.possession===round.scorer) kick(guard,q,1.6);
    challenge(guard,q,3.15,sport);challenge(guard,q,6.65,sport);
    const starter=round.possession===round.scorer?lead:guard;
    kick(starter,q,0);
    for(const pass of play.passes) {kick(roles[pass.from],q,pass.release);kick(roles[pass.to],q,pass.catchAt);}
    kick(roles[play.shot.role],q,play.shot.release);
    arms(lead,'shield',windowWeight(q,.9,1.25,1.5,1.9));
    const save=windowWeight(q,play.shot.release+.05,play.shot.release+.7,8.55,8.8);
    arms(keeper,'save',save);crouch(keeper,save,10);
  } else if(sport==='basketball') {
    place(lead,tracks.lead);
    place(guard,tracks.guard);
    place(mate,tracks.mate);
    place(keeper,tracks.keeper);
    const balanceArm=lead.arms.back;
    arms(lead,'dribble');lead.arms.back=balanceArm;
    const dribbling=q<1.4 || q>=5.15 && q<6.55;
    const push=dribbling?Math.sin(Math.PI*(q<1.4?q:q-5.15)/.6)**2:0;
    lead.arms.front=[-25+10*push,-78+22*push];
    arms(guard,'shield',.5);
    crouch(lead,windowWeight(q,.55,.8,1.05,1.35),7);
    const play=playFor(sport,round),roles={lead,mate,guard,keeper};
    challenge(guard,q,1.65,sport);
    if(play.turnover) {
      challenge(lead,q,2.3,sport);
      arms(guard,'carry',windowWeight(q,round.possession===round.scorer?1.65:0,1.8,2.2,2.4));
    }
    for(const pass of play.passes) {
      arms(roles[pass.from],'reach',windowWeight(q,pass.release-.3,pass.release,pass.release+.05,pass.release+.4));
      arms(roles[pass.to],'carry',windowWeight(q,pass.catchAt-.35,pass.catchAt,pass.catchAt+.15,pass.catchAt+.4));
    }
    challenge(guard,q,5.9,sport);
    const shooter=roles[play.shot.role];
    if(play.shot.style==='post') {
      arms(lead,'shield',windowWeight(q,5.3,5.6,6.15,6.45));
      lead.lean+=14*Math.sin((q-5.3)*Math.PI)*windowWeight(q,5.3,5.5,6.2,6.5);
    }
    crouch(shooter,windowWeight(q,6.1,6.25,6.45,6.65),8);
    arms(shooter,'carry',windowWeight(q,6.2,6.55,6.7,6.9));
    arms(shooter,play.shot.style==='layup'?'strike':'shoot',windowWeight(q,6.7,7.2,7.3,7.65));
    arms(shooter,'follow',windowWeight(q,7.3,7.55,7.7,8.2));
    arms(shooter,'idle',windowWeight(q,8.0,8.2,8.8,8.9));
    arms(guard,'guard',windowWeight(q,6.5,7.0,7.45,7.85));
    arms(keeper,'guard',windowWeight(q,6.75,7.2,7.5,7.9));
    jump(shooter,q,7.2,play.shot.style==='layup'?24:44);jump(guard,q,7.24,38);jump(keeper,q,7.4,22);
  } else {
    const returns=team===round.scorer,firstHit=returns?4.5:5.1;
    place(lead,tracks.lead);
    move(guard,opponent,tracks.guard,q,pace);
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
  if(sport!=='volleyball') {
    const play=playFor(sport,round),football=sport==='football';
    const ids={lead:leadId,mate:mateId,guard:guardId};
    const at=(role,time)=>{
      const player=playersDuring(sport,round,time)[ids[role]];
      return football?[player.x+player.scale*direction(player.team)*32,player.floor-12]:worldHand(player);
    };
    const held=(role,start,end)=>{
      const point=at(role,q);
      if(football) return point;
      const weight=windowWeight(q,start,start+.15,end-.2,end)*Math.sin(Math.PI*(q-start)/.6)**2;
      const floor=playersDuring(sport,round,q)[ids[role]].floor;
      return [point[0],mix(point[1],floor-12,weight)];
    };
    const fly=(from,to,start,end,crest)=>curve([at(from,start),
      [(at(from,start)[0]+at(to,end)[0])/2,crest],at(to,end)],clamp((q-start)/(end-start)));
    const lost=football?1.35:1.4,taken=football?1.6:1.8,recovered=football?2.4:2.5;
    if(play.turnover) {
      if(round.possession!==round.scorer&&q<2.2) return held('guard',0,2.2);
      if(q<lost) return held('lead',0,lost);
      if(q<taken) return fly('lead','guard',lost,taken,football?284:292);
      if(q<2.2) return held('guard',taken,2.2);
      if(q<recovered) return fly('guard','lead',2.2,recovered,football?286:280);
    }
    let carrier='lead',since=play.turnover?recovered:0;
    for(const pass of play.passes) {
      if(q<pass.release) return held(carrier,since,pass.release);
      if(q<pass.catchAt) return fly(pass.from,pass.to,pass.release,pass.catchAt,football?238:172);
      carrier=pass.to;since=pass.catchAt;
    }
    const shot=play.shot;
    if(q<shot.release) return held(carrier,since,shot.release);
    return curve([at(shot.role,shot.release),transform([1040,shot.crest]),transform([1110,football?276:158])],
      clamp((q-shot.release)/(8.8-shot.release)));
  }
  const returns=team===round.scorer,firstHit=returns?4.5:5.1;
  const serve=handAt(sport,round,.8,leadId),receive=handAt(sport,round,2.2,guardId,'both');
  const setter=handAt(sport,round,3.1,`${opponent}-2`,'both');
  const hitter=handAt(sport,round,firstHit,guardId);
  const scoreFloor=VOLLEYBALL_LANDINGS[round.index];
  const overNet=(from,to)=>[from,[mix(from[0],to[0],.33),68],[mix(from[0],to[0],.67),68],to];
  const spikeFlight=(from,to)=>[from,
    [mix(from[0],to[0],.33),mix(from[1],to[1],.1)],
    [mix(from[0],to[0],.67),mix(from[1],to[1],.55)],to];
  const shots=[
    [0,.8,[handAt(sport,round,0,leadId),[sideX(team,125),132],serve]],
    [.8,2.2,overNet(serve,receive)],
    [2.2,3.1,[receive,[(receive[0]+setter[0])/2,182],setter]],
    [3.1,firstHit,[setter,[(setter[0]+hitter[0])/2,108],hitter]],
  ];
  if(returns) {
    const dig=handAt(sport,round,5.6,leadId,'both');
    const ownSet=handAt(sport,round,6.5,mateId,'both'),ownHit=handAt(sport,round,7.5,leadId);
    shots.push([firstHit,5.6,spikeFlight(hitter,dig)],
      [5.6,6.5,[dig,[(dig[0]+ownSet[0])/2,184],ownSet]],
      [6.5,7.5,[ownSet,[(ownSet[0]+ownHit[0])/2,108],ownHit]],
      [7.5,8.8,spikeFlight(ownHit,scoreFloor)]);
  } else shots.push([firstHit,6.4,spikeFlight(hitter,scoreFloor)]);
  return flight(q,shots);
}

function initialState(sport,round) {
  return {players:playersDuring(sport,round,0),ball:ballDuring(sport,round,0)};
}

function entranceState(sport,round) {
  if(sport==='football') return initialState(sport,round);
  const court=entranceCourt(sport);
  return {players:Object.fromEntries(PLAYER_IDS.map(id=>[id,makePlayer(id,id.split('-')[0],court[id].x,court[id].floor)])),ball:[592,296]};
}

function interpolatePlayers(a,b,elapsed,plan) {
  if(plan.duration===0) return b;
  const weight=smooth(elapsed/plan.duration);
  return Object.fromEntries(PLAYER_IDS.map(id=>{
    const route=returnPosition(id,a[id],b[id],elapsed,plan);
    const player={...a[id],x:route.x,floor:route.floor,scale:1-(FLOOR-route.floor)*.002,
      y:route.floor+mix(a[id].y-a[id].floor,b[id].y-b[id].floor,weight),lean:mix(a[id].lean,b[id].lean,weight),
      arms:blendPose(a[id].arms,b[id].arms,weight),airborne:0,kickWeight:0};
    const amount=clamp(route.speed/55),wave=Math.sin(route.travelled/(48*player.scale)*Math.PI*2);
    player.motion={travelled:route.travelled,direction:route.direction,amount,speed:route.speed};
    player.arms=blendPose(player.arms,{front:[-10-wave*28,-46-wave*28],back:[-10+wave*28,-46+wave*28]},amount*.9);
    player.y+=player.scale*amount*(6.5+1.5*Math.cos(route.travelled/(48*player.scale)*Math.PI*4));
    return [id,player];
  }));
}

export function sportsStateAt(seconds) {
  const match=matchStateAt(seconds),script=MATCHES[match.matchIndex];
  const q=qAtElapsed(match.sport,match.round,match.roundTime/match.round.timeScale);
  let players=playersDuring(match.sport,match.round,q),ball=ballDuring(match.sport,match.round,q);
  let possession=match.possession;
  const scenes={football:0,basketball:0,volleyball:0};scenes[match.sport]=1;
  let morph=0;
  if(match.phase==='intro') {
    const entrance=entranceState(match.sport,match.round),initial=initialState(match.sport,match.round);
    players=interpolatePlayers(entrance.players,initial.players,match.matchTime,script.introPlan);
    ball=pair(entrance.ball,initial.ball,smooth((match.matchTime-script.introPlan.duration)/script.introBallDuration));
  }
  if(match.phase==='play' && match.sport!=='volleyball') {
    const stolen=match.sport==='football'?q>=1.6&&q<2.4:q>=1.8&&q<2.5;
    if(match.round.possession!==match.round.scorer) possession=q<(match.sport==='football'?2.4:2.5)?match.round.possession:match.round.scorer;
    else if(stolen&&playFor(match.sport,match.round).turnover) possession=other(match.round.possession);
  }
  if(match.phase==='restart') {
    const nextRound=MATCHES[match.matchIndex].rounds[match.round.index+1];
    const next=initialState(match.sport,nextRound),elapsed=match.matchTime-match.round.scoreAt;
    const plan=match.round.returnPlan;
    players=interpolatePlayers(players,next.players,elapsed,plan);
    const controls=match.sport==='football'?[ball,[ball[0],296],next.ball]
      :match.sport==='basketball'?[ball,[ball[0],232],[next.ball[0],296],next.ball]
      :[ball,[ball[0],112],[next.ball[0],112],next.ball];
    ball=curve(controls,clamp(elapsed/plan.duration));
  } else if(match.winner) {
    for(const player of Object.values(players)) if(player.team===match.winner) {
      const victoryTime=match.matchTime-script.winAt;
      arms(player,'celebrate',windowWeight(victoryTime,0,.3,CELEBRATION_DURATION,CELEBRATION_DURATION+.3));
      jump(player,victoryTime,1+(player.id.endsWith('2')?.25:0),32);
    }
    if(match.phase==='transition') {
      const nextIndex=(match.matchIndex+1)%3,nextMatch=MATCHES[nextIndex];
      const next=entranceState(nextMatch.sport,nextMatch.rounds[0]),elapsed=match.matchTime-script.transitionStart;
      const progress=clamp(elapsed/script.transitionPlan.duration),weight=smooth(progress);
      players=interpolatePlayers(players,next.players,elapsed,script.transitionPlan);
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
  const extraTurns=match.matchIndex*720+(match.phase==='transition'?720*smooth((match.matchTime-script.transitionStart)/script.transitionPlan.duration):0);
  return {...match,possession,players,scenes,morph,ball:{x:ball[0],y:ball[1],rotation:match.time*BALL_SPIN_SPEED+extraTurns},actionTime:q};
}

export function contactEvents(matchIndex,roundIndex) {
  const match=MATCHES[matchIndex],round=match.rounds[roundIndex];
  const at=q=>actionTimeAt(matchIndex,roundIndex,q);
  const team=match.sport==='volleyball'?round.possession:round.scorer;
  const player=`${team}-1`,mate=`${team}-2`,opp=other(team);
  if(match.sport!=='volleyball') {
    const play=playFor(match.sport,round),football=match.sport==='football';
    const ids={lead:player,mate,guard:`${opp}-1`},hand=football?'foot':'front',events=[];
    if(football) events.push({time:at(0),player:round.possession===round.scorer?player:ids.guard,hand,action:'kickoff'});
    if(play.turnover) {
      if(round.possession===round.scorer) events.push({time:at(football?1.6:1.8),player:ids.guard,hand,action:'steal'});
      events.push({time:at(football?2.4:2.5),player,hand,action:round.possession===round.scorer?'recover':'steal'});
    }
    for(const pass of play.passes) events.push(
      {time:at(pass.release),player:ids[pass.from],hand,action:'pass'},
      {time:at(pass.catchAt),player:ids[pass.to],hand,action:'catch'});
    events.push({time:at(play.shot.release),player:ids[play.shot.role],hand,action:play.shot.style});
    return events;
  }
  const events=[{time:at(.8),player,hand:'front',action:'serve'},
    {time:at(2.2),player:`${opp}-1`,hand:'both',action:'bump'},
    {time:at(3.1),player:`${opp}-2`,hand:'both',action:'set'},
    {time:at(round.scorer===round.possession?4.5:5.1),player:`${opp}-1`,hand:'front',action:'spike'}];
  if(round.scorer===round.possession) events.push({time:at(5.6),player,hand:'both',action:'bump'},
    {time:at(6.5),player:mate,hand:'both',action:'set'},{time:at(7.5),player,hand:'front',action:'spike'});
  return events;
}
