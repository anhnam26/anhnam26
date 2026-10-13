// One immutable, repeatable script. Every scoring play is worth one point.
export const MATCH_DURATION = 60;
export const SPORTS_DURATION = MATCH_DURATION * 3;
export const POINT_TIMES = Object.freeze([10, 21, 32, 43, 58]);
export const TEAMS = Object.freeze({
  red: Object.freeze({ side: 'left', color: '#e85b62', name: 'RED' }),
  blue: Object.freeze({ side: 'right', color: '#559ded', name: 'BLUE' }),
});

const opponent = (team) => team === 'red' ? 'blue' : 'red';

function makeMatch(sport, initialPossession, scorers) {
  const rounds = scorers.map((scorer, index) => Object.freeze({
    index,
    start: index === 0 ? 0 : POINT_TIMES[index - 1] + 2,
    scoreAt: POINT_TIMES[index],
    scorer,
    possession: index === 0 ? initialPossession
      : sport === 'volleyball' ? scorers[index - 1] : opponent(scorers[index - 1]),
  }));
  return Object.freeze({ sport, rounds: Object.freeze(rounds), winner: scorers.at(-1) });
}

export const MATCHES = Object.freeze([
  makeMatch('football', 'red', ['red', 'blue', 'red', 'blue', 'red']),
  makeMatch('basketball', 'blue', ['blue', 'red', 'blue', 'red', 'blue']),
  makeMatch('volleyball', 'red', ['red', 'blue', 'blue', 'red', 'red']),
]);

export function matchStateAt(seconds) {
  if (!Number.isFinite(seconds)) throw new Error('Animation time must be finite.');
  const time = ((seconds % SPORTS_DURATION) + SPORTS_DURATION) % SPORTS_DURATION;
  const matchIndex = Math.floor(time / MATCH_DURATION);
  const match = MATCHES[matchIndex];
  const matchTime = time - matchIndex * MATCH_DURATION;
  const score = { red: 0, blue: 0 };
  for (const round of match.rounds) if (matchTime >= round.scoreAt) score[round.scorer]++;
  const round = match.rounds.find((entry, index) => (
    index === 4 || matchTime < match.rounds[index + 1].start
  ));
  const winner = score.red === 3 ? 'red' : score.blue === 3 ? 'blue' : null;
  const phase = winner ? matchTime >= 59 ? 'transition' : 'victory'
    : matchTime >= round.scoreAt ? 'restart' : 'play';
  const nextPossession = winner ? null : matchTime >= round.scoreAt
    ? match.sport === 'volleyball' ? round.scorer : opponent(round.scorer)
    : round.possession;
  return {
    time, matchIndex, sport: match.sport, matchTime, score, winner, phase,
    possession: nextPossession, round,
    roundTime: Math.min(matchTime - round.start, round.scoreAt - round.start),
    roundDuration: round.scoreAt - round.start,
    nextSport: MATCHES[(matchIndex + 1) % MATCHES.length].sport,
  };
}
