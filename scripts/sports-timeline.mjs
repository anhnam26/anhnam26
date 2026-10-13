import { MATCHES, SPORTS_DURATION, matchStateAt } from './sports-matches.mjs';
import { POSES, makePlayer, worldHand, blendPose, smooth, mix, clamp, windowWeight } from './sports-rig.mjs';
export { SPORTS_DURATION };

export const PLAYER_IDS = ['red-1', 'red-2', 'blue-1', 'blue-2'];
const other = team => team === 'red' ? 'blue' : 'red';
const direction = team => team === 'red' ? 1 : -1;
const sideX = (team, x) => team === 'red' ? x : 1184-x;
const pair = (a,b,w) => a.map((value,i)=>mix(value,b[i],w));

function track(points, time) {
  for (let i=1;i<points.length;i++) if (time<=points[i][0]) {
    const a=points[i-1],b=points[i];
    return mix(a[1],b[1],smooth((time-a[0])/(b[0]-a[0])));
  }
  return points.at(-1)[1];
}

function curve(points, progress) {
  let values=points;
  while (values.length>1) values=values.slice(1).map((point,i)=>pair(values[i],point,progress));
  return values[0];
}

function flight(time, segments) {
  const [from,to,points]=segments.find(segment=>time<=segment[1])??segments.at(-1);
  return curve(points,clamp((time-from)/(to-from)));
}

export function actionDuration(sport, round) {
  return sport === 'volleyball' ? round.possession===round.scorer ? 8.8 : 6.4 : 8;
}

function basePlayers(sport) {
  const xs=sport==='football'?[544,176]:sport==='basketball'?[470,330]:[222,430];
  return Object.fromEntries(PLAYER_IDS.map(id=>{
    const [team,index]=id.split('-');
    return [id,makePlayer(id,team,sideX(team,xs[Number(index)-1]))];
  }));
}

function walk(player, q, speed=0) {
  const amount=clamp(Math.abs(speed)/80), wave=Math.sin(q*Math.PI*3.6)*amount;
  player.legs.front=[-8-wave*24,7+Math.max(0,-wave)*50];
  player.legs.back=[10+wave*24,-7+Math.max(0,wave)*50];
  if (amount>.1) player.arms={front:[-8+wave*22,-8+wave*18],back:[8-wave*22,12-wave*18]};
}

function move(player, team, points, q) {
  player.x=sideX(team,track(points,q));
  const speed=(track(points,q+.04)-track(points,Math.max(0,q-.04)))/.08;
  walk(player,q,speed);
}

function arms(player, pose, amount=1) {
  player.arms=blendPose(player.arms,POSES[pose],amount);
  if (amount>.5) player.action=pose;
}

function kick(player,q,when) {
  const w=windowWeight(q,when-.35,when,when+.06,when+.5);
  player.legs.front=pair(player.legs.front,[-38,-60],w);
  player.arms=blendPose(player.arms,{front:[-28,-34],back:[15,48]},w);
  if (w>.5) player.action='kick';
}

function bump(player,q,when) {
  const w=windowWeight(q,when-.4,when,when+.15,when+.7);
  arms(player,'bump',w);
  player.y+=6*w;
  player.legs.front=pair(player.legs.front,[-35,35],w);
  player.legs.back=pair(player.legs.back,[35,-35],w);
}

function spike(player,q,when) {
  arms(player,'cock',windowWeight(q,when-1,when-.55,when-.3,when));
  arms(player,'strike',windowWeight(q,when-.35,when,when+.05,when+.4));
  arms(player,'follow',windowWeight(q,when+.05,when+.4,when+.6,when+1));
  player.y-=70*windowWeight(q,when-.65,when,when+.06,when+.75);
}

function playersDuring(sport,round,q) {
  const players=basePlayers(sport), team=round.possession, opponent=other(team);
  const lead=players[`${team}-1`],mate=players[`${team}-2`];
  const guard=players[`${opponent}-1`],keeper=players[`${opponent}-2`];
  if (sport==='football') {
    move(lead,team,[[0,544],[.5,544],[1.8,490],[4,490],[5.8,536],[8,536]],q);
    move(guard,opponent,[[0,544],[4,544],[6.2,554],[8,554]],q);
    kick(lead,q,.5);kick(mate,q,2.5);kick(lead,q,6.6);
    const save=windowWeight(q,6.8,7.5,7.85,8.4);
    arms(keeper,'save',save);keeper.lean=18*save;
    keeper.y+=4*save;
    keeper.legs.front=pair(keeper.legs.front,[-35,35],save);
    keeper.legs.back=pair(keeper.legs.back,[35,-35],save);
  } else if (sport==='basketball') {
    move(lead,team,[[0,470],[1,470],[5.6,542],[8,542]],q);
    move(guard,opponent,[[0,470],[1,490],[5.8,544],[8,544]],q);
    arms(lead,'carry');
    arms(lead,'dribble',windowWeight(q,0,.4,5.6,5.9));
    arms(lead,'carry',windowWeight(q,5.6,5.9,5.9,6.15));
    arms(lead,'shoot',windowWeight(q,5.9,6.5,6.65,7.15));
    arms(guard,'guard',windowWeight(q,1.5,2.2,6.7,7.4));
    lead.y-=40*windowWeight(q,6,6.5,6.6,7.2);
    guard.y-=24*windowWeight(q,6.1,6.55,6.65,7.25);
    arms(mate,'guard',.25);arms(keeper,'guard',.25);
  } else {
    const returns=team===round.scorer;
    const firstHit=returns?4.5:5.1;
    move(guard,opponent,[[0,286],[3.1,286],[firstHit-.5,345],[firstHit+.5,345],[8.8,286]],q);
    arms(lead,'carry');
    arms(lead,'shoot',windowWeight(q,0,.8,.9,1.4));
    arms(lead,'follow',windowWeight(q,.9,1.4,1.6,2));
    bump(guard,q,2.2);
    keeper.facing=-direction(opponent);
    arms(keeper,'set',windowWeight(q,2.6,3.1,3.3,3.9));
    spike(guard,q,firstHit);
    if (returns) {
      move(lead,team,[[0,222],[3.8,222],[5.2,286],[6.5,286],[7,345],[8.8,345]],q);
      bump(lead,q,5.6);
      mate.facing=-direction(team);
      arms(mate,'set',windowWeight(q,6,6.5,6.7,7.1));
      spike(lead,q,7.5);
    }
  }
  return players;
}

const midHands = player => pair(worldHand(player,'front'),worldHand(player,'back'),.5);

function ballDuring(sport,round,q) {
  const team=round.possession,opponent=other(team), d=direction(team);
  const transform=point=>[sideX(team,point[0]),point[1]];
  if (sport==='football') {
    const dribbleStart=transform([541,296]), shotStart=transform([587,296]),goal=transform([1110,276]);
    if (q>=4&&q<5.8) return [sideX(team,track([[4,541],[5.8,587]],q)),296-3*Math.sin((q-4)*Math.PI*4)**2];
    return flight(q,[
      [0,.5,[[592,296],[592,296]]],
      [.5,1.8,[[592,296],transform([410,279]),transform([222,296])]],
      [1.8,2.5,[transform([222,296]),transform([222,296])]],
      [2.5,4,[transform([222,296]),transform([375,275]),dribbleStart]],
      [4,5.8,[dribbleStart,shotStart]],
      [5.8,6.6,[shotStart,shotStart]],
      [6.6,8,[shotStart,transform([850,210]),goal]],
    ]);
  }
  if (sport==='basketball') {
    if (q<=6.5) {
      const player=playersDuring(sport,round,q)[`${team}-1`];
      const hand=worldHand(player);
      const bounce=q<5.6?Math.sin(Math.PI*q/.8)**2:0;
      return [hand[0],mix(hand[1],296,bounce)];
    }
    const shooter=playersDuring(sport,round,6.5)[`${team}-1`];
    return curve([worldHand(shooter),transform([840,80]),transform([1110,158])],clamp((q-6.5)/1.5));
  }
  const returns=team===round.scorer, firstHit=returns?4.5:5.1;
  const servePlayer=playersDuring(sport,round,.8)[`${team}-1`];
  const receive=midHands(playersDuring(sport,round,2.2)[`${opponent}-1`]);
  const setter=midHands(playersDuring(sport,round,3.1)[`${opponent}-2`]);
  const hitter=worldHand(playersDuring(sport,round,firstHit)[`${opponent}-1`]);
  const scoreFloor=[round.scorer==='red'?1034:150,296];
  const shots=[
    [0,.8,[worldHand(playersDuring(sport,round,0)[`${team}-1`]),[servePlayer.x+d*38,144],worldHand(servePlayer)]],
    [.8,2.2,[worldHand(servePlayer),[592,78],receive]],
    [2.2,3.1,[receive,[(receive[0]+setter[0])/2,182],setter]],
    [3.1,firstHit,[setter,[(setter[0]+hitter[0])/2,102],hitter]],
  ];
  if (returns) {
    const dig=midHands(playersDuring(sport,round,5.6)[`${team}-1`]);
    const ownSet=midHands(playersDuring(sport,round,6.5)[`${team}-2`]);
    const ownHit=worldHand(playersDuring(sport,round,7.5)[`${team}-1`]);
    shots.push([firstHit,5.6,[hitter,[592,112],dig]],
      [5.6,6.5,[dig,[(dig[0]+ownSet[0])/2,184],ownSet]],
      [6.5,7.5,[ownSet,[(ownSet[0]+ownHit[0])/2,102],ownHit]],
      [7.5,8.8,[ownHit,[592,112],scoreFloor]]);
  } else shots.push([firstHit,6.4,[hitter,[592,112],scoreFloor]]);
  return flight(q,shots);
}

function initialState(sport,round) {
  return {players:playersDuring(sport,round,0),ball:ballDuring(sport,round,0)};
}

function interpolatePlayers(a,b,weight) {
  return Object.fromEntries(PLAYER_IDS.map(id=>{
    const player={...a[id],x:mix(a[id].x,b[id].x,weight),y:mix(a[id].y,b[id].y,weight),lean:mix(a[id].lean,b[id].lean,weight)};
    player.arms=blendPose(a[id].arms,b[id].arms,weight);
    player.legs={front:pair(a[id].legs.front,b[id].legs.front,weight),back:pair(a[id].legs.back,b[id].legs.back,weight)};
    return [id,player];
  }));
}

export function sportsStateAt(seconds) {
  const match=matchStateAt(seconds),duration=actionDuration(match.sport,match.round);
  const preparation=match.roundDuration-duration;
  const q=clamp(match.roundTime-preparation,0,duration);
  let players=playersDuring(match.sport,match.round,q),ball=ballDuring(match.sport,match.round,q);
  const scenes={football:0,basketball:0,volleyball:0};scenes[match.sport]=1;
  if (match.phase==='restart') {
    const nextRound=MATCHES[match.matchIndex].rounds[match.round.index+1];
    const next=initialState(match.sport,nextRound),elapsed=match.matchTime-match.round.scoreAt;
    const weight=smooth(elapsed/2);
    players=interpolatePlayers(players,next.players,weight);
    const controls=match.sport==='football'?[ball,[ball[0],296],next.ball]
      : match.sport==='basketball'?[ball,[ball[0],232],[next.ball[0],296],next.ball]
      :[ball,[ball[0],112],[next.ball[0],112],next.ball];
    ball=curve(controls,clamp(elapsed/2));
  } else if (match.winner) {
    for (const player of Object.values(players)) {
      if (player.team===match.winner) arms(player,'celebrate',windowWeight(match.matchTime,58,58.4,59,59.8));
    }
    if (match.phase==='transition') {
      const nextIndex=(match.matchIndex+1)%3,nextMatch=MATCHES[nextIndex];
      const next=initialState(nextMatch.sport,nextMatch.rounds[0]);
      const weight=smooth(match.matchTime-59);
      players=interpolatePlayers(players,next.players,weight);
      // The cubic already eases horizontal travel at both ends. A second easing
      // would accelerate the ball excessively halfway through the crossfade.
      ball=curve([ball,[ball[0],138],[next.ball[0],138],next.ball],match.matchTime-59);
      scenes[match.sport]=1-weight;scenes[match.nextSport]=weight;
    }
  }
  for (const player of Object.values(players)) {
    player.facing=ball[0]>=player.x?1:-1;
    player.headAngle=clamp(Math.atan2(ball[1]-(player.y-110),Math.abs(ball[0]-player.x))*180/Math.PI-player.lean,-55,55);
  }
  return {...match,players,scenes,ball:{x:ball[0],y:ball[1],rotation:match.time*180},actionTime:q};
}

export function contactEvents(matchIndex,roundIndex) {
  const match=MATCHES[matchIndex],round=match.rounds[roundIndex],duration=actionDuration(match.sport,round);
  const start=matchIndex*60+round.start+(round.scoreAt-round.start-duration);
  const player=`${round.possession}-1`,mate=`${round.possession}-2`,opp=other(round.possession);
  if (match.sport==='basketball') return [{time:start+6.5,player,hand:'front',action:'shoot'}];
  if (match.sport==='football') return [];
  const events=[{time:start+.8,player,hand:'front',action:'serve'},
    {time:start+2.2,player:`${opp}-1`,hand:'both',action:'bump'},
    {time:start+3.1,player:`${opp}-2`,hand:'both',action:'set'},
    {time:start+(round.scorer===round.possession?4.5:5.1),player:`${opp}-1`,hand:'front',action:'spike'}];
  if (round.scorer===round.possession) events.push({time:start+5.6,player,hand:'both',action:'bump'},
    {time:start+6.5,player:mate,hand:'both',action:'set'},{time:start+7.5,player,hand:'front',action:'spike'});
  return events;
}
