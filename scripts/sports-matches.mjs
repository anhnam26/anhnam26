import { choreographyDuration, courtAt, playDuration, returnPlan, ENTRANCE_COURT } from './sports-paths.mjs';

// One repeatable first-to-three script. Timing follows normal-paced movement.
export const CELEBRATION_DURATION = 5.5;
export const TEAMS = Object.freeze({
  red: Object.freeze({ side:'left', color:'#ff4b60', name:'RED' }),
  blue: Object.freeze({ side:'right', color:'#3189ff', name:'BLUE' }),
});
const opponent = team => team==='red'?'blue':'red';
const rounded = value => Math.round(value*1e6)/1e6;

function makeMatch(sport,initialPossession,scorers) {
  const rounds=scorers.map((scorer,index)=>({
    index,scorer,possession:index===0?initialPossession
      :sport==='volleyball'?scorers[index-1]:opponent(scorers[index-1]),
  }));
  const introPlan=returnPlan(ENTRANCE_COURT,courtAt(sport,rounds[0],0));
  const introDuration=rounded(introPlan.duration+3);
  let cursor=introDuration;
  for(const round of rounds) {
    round.start=cursor;
    round.duration=playDuration(sport,round);
    round.scoreAt=rounded(cursor+round.duration);
    const next=rounds[round.index+1];
    if(next) {
      round.returnPlan=returnPlan(courtAt(sport,round,choreographyDuration(sport,round)),courtAt(sport,next,0));
      cursor=rounded(round.scoreAt+round.returnPlan.duration);
    }
  }
  const last=rounds.at(-1),winAt=last.scoreAt;
  const transitionPlan=returnPlan(courtAt(sport,last,choreographyDuration(sport,last)),ENTRANCE_COURT);
  const transitionStart=rounded(winAt+CELEBRATION_DURATION);
  return {sport,rounds:Object.freeze(rounds.map(Object.freeze)),winner:scorers.at(-1),introPlan,introDuration,winAt,
    transitionStart,transitionPlan,duration:rounded(transitionStart+transitionPlan.duration)};
}

let cursor=0;
export const MATCHES = Object.freeze([
  makeMatch('football','red',['red','blue','red','blue','blue']),
  makeMatch('basketball','blue',['blue','red','red','blue','red']),
  makeMatch('volleyball','red',['red','blue','red','blue','blue']),
].map(match=>{
  const result=Object.freeze({...match,startAt:cursor});
  cursor=rounded(cursor+match.duration);
  return result;
}));
export const SPORTS_DURATION = cursor;

export function matchStateAt(seconds) {
  if(!Number.isFinite(seconds)) throw new Error('Animation time must be finite.');
  const time=Math.round(((seconds%SPORTS_DURATION+SPORTS_DURATION)%SPORTS_DURATION)*1e9)/1e9;
  const matchIndex=MATCHES.findIndex(match=>time<match.startAt+match.duration-1e-10);
  const match=MATCHES[matchIndex],matchTime=Math.round((time-match.startAt)*1e9)/1e9;
  const score={red:0,blue:0};
  for(const round of match.rounds) if(matchTime>=round.scoreAt) score[round.scorer]++;
  const round=match.rounds.find((entry,index)=>index===4||matchTime<match.rounds[index+1].start);
  const winner=score.red===3?'red':score.blue===3?'blue':null;
  const phase=winner?matchTime>=match.transitionStart?'transition':'victory'
    :matchTime<match.introDuration?'intro':matchTime>=round.scoreAt?'restart':'play';
  const possession=winner?null:matchTime>=round.scoreAt
    ?match.sport==='volleyball'?round.scorer:opponent(round.scorer):round.possession;
  return {
    time,matchIndex,sport:match.sport,matchTime,score,winner,phase,possession,round,
    roundTime:Math.max(0,Math.min(matchTime-round.start,round.duration)),roundDuration:round.duration,
    introDuration:match.introDuration,winAt:match.winAt,transitionStart:match.transitionStart,matchDuration:match.duration,
    nextSport:MATCHES[(matchIndex+1)%MATCHES.length].sport,
  };
}
