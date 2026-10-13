import { choreographyDuration, courtAt, playDuration, returnPlan, entranceCourt } from './sports-paths.mjs';

// One repeatable first-to-three script, retimed evenly within each sport.
export const MATCH_DURATION = 80;
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
  const introPlan=sport==='football'?{enter:0,cross:0,settle:0,duration:0}
    :returnPlan(entranceCourt(sport),courtAt(sport,rounds[0],0));
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
  const nextSport={football:'basketball',basketball:'volleyball',volleyball:'football'}[sport];
  const transitionPlan=returnPlan(courtAt(sport,last,choreographyDuration(sport,last)),entranceCourt(nextSport));
  // Keep the celebration readable; speed up every movement by the same factor.
  // The opening and winning attacks share a clock, with no final-play rush.
  const timeScale=(MATCH_DURATION-CELEBRATION_DURATION)/(winAt+transitionPlan.duration);
  const scalePlan=plan=>Object.fromEntries(Object.entries(plan).map(([key,value])=>[key,value*timeScale]));
  const timedRounds=rounds.map(round=>Object.freeze({
    ...round,timeScale,start:rounded(round.start*timeScale),duration:round.duration*timeScale,
    scoreAt:rounded(round.scoreAt*timeScale),
    ...(round.returnPlan?{returnPlan:scalePlan(round.returnPlan)}:{}),
  }));
  const timedWinAt=timedRounds.at(-1).scoreAt;
  return {sport,rounds:Object.freeze(timedRounds),winner:scorers.at(-1),timeScale,
    introPlan:scalePlan(introPlan),introBallDuration:3*timeScale,introDuration:rounded(introDuration*timeScale),
    winAt:timedWinAt,transitionStart:rounded(timedWinAt+CELEBRATION_DURATION),
    transitionPlan:scalePlan(transitionPlan),duration:MATCH_DURATION};
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
  // Rounding a time just below the seam can reach the full duration; wrap it again.
  const time=(Math.round(((seconds%SPORTS_DURATION+SPORTS_DURATION)%SPORTS_DURATION)*1e9)/1e9)%SPORTS_DURATION;
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
