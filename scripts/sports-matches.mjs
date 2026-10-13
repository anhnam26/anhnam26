// One immutable, repeatable script. Every scoring play is worth one point.
export const MATCH_DURATION = 60;
export const SPORTS_DURATION = MATCH_DURATION * 3;
export const INTRO_DURATION = 8;
export const TRANSITION_START = 58;
export const POINT_TIMES = Object.freeze([18, 28, 38, 48, 56]);
export const TEAMS = Object.freeze({
  red: Object.freeze({ side: 'left', color: '#ff4b60', name: 'RED' }),
  blue: Object.freeze({ side: 'right', color: '#3189ff', name: 'BLUE' }),
});

const opponent = (team) => team === 'red' ? 'blue' : 'red';

function makeMatch(sport, initialPossession, scorers) {
  const rounds = scorers.map((scorer, index) => Object.freeze({
    index,
    start: index === 0 ? INTRO_DURATION : POINT_TIMES[index - 1] + 2,
    scoreAt: POINT_TIMES[index],
    scorer,
    possession: index === 0 ? initialPossession
      : sport === 'volleyball' ? scorers[index - 1] : opponent(scorers[index - 1]),
  }));
  return Object.freeze({ sport, rounds: Object.freeze(rounds), winner: scorers.at(-1) });
}

export const MATCHES = Object.freeze([
  makeMatch('football', 'red', ['red', 'blue', 'red', 'blue', 'blue']),
  makeMatch('basketball', 'blue', ['blue', 'red', 'red', 'blue', 'red']),
  makeMatch('volleyball', 'red', ['red', 'blue', 'red', 'blue', 'blue']),
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
  const phase = winner ? matchTime >= TRANSITION_START ? 'transition' : 'victory'
    : matchTime < INTRO_DURATION ? 'intro' : matchTime >= round.scoreAt ? 'restart' : 'play';
  const nextPossession = winner ? null : matchTime >= round.scoreAt
    ? match.sport === 'volleyball' ? round.scorer : opponent(round.scorer)
    : round.possession;
  return {
    time, matchIndex, sport: match.sport, matchTime, score, winner, phase,
    possession: nextPossession, round,
    roundTime: Math.max(0, Math.min(matchTime - round.start, round.scoreAt - round.start)),
    roundDuration: round.scoreAt - round.start,
    nextSport: MATCHES[(matchIndex + 1) % MATCHES.length].sport,
  };
}
