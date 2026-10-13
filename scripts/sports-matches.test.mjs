import assert from 'node:assert/strict';
import test from 'node:test';
import { MATCHES, MATCH_DURATION, SPORTS_DURATION, POINT_TIMES, TEAMS, matchStateAt } from './sports-matches.mjs';

test('each sport lasts exactly one minute with a fixed three-minute loop', () => {
  assert.equal(MATCH_DURATION, 60);
  assert.equal(SPORTS_DURATION, 180);
  assert.equal(matchStateAt(59.99).sport, 'football');
  assert.equal(matchStateAt(60).sport, 'basketball');
  assert.equal(matchStateAt(119.99).sport, 'basketball');
  assert.equal(matchStateAt(120).sport, 'volleyball');
  assert.equal(matchStateAt(179.99).sport, 'volleyball');
  assert.deepEqual(matchStateAt(0), matchStateAt(180));
  assert.equal(TEAMS.red.side, 'left');
  assert.equal(TEAMS.blue.side, 'right');
});

test('first to three wins at 3-2, with the requested winner for each sport', () => {
  for (const [index, expected] of ['blue', 'red', 'blue'].entries()) {
    for (const time of POINT_TIMES.slice(0, -1)) {
      const state = matchStateAt(index * 60 + time);
      assert.equal(state.winner, null);
      assert.ok(state.score.red < 3 && state.score.blue < 3);
    }
    const final = matchStateAt(index * 60 + 56);
    assert.equal(final.winner, expected);
    assert.deepEqual(final.score, expected === 'red' ? { red: 3, blue: 2 } : { red: 2, blue: 3 });
    assert.equal(final.possession, null);
    assert.equal(final.phase, 'victory');
    assert.equal(matchStateAt(index * 60 + 58).phase, 'transition');
    assert.deepEqual(matchStateAt((index + 1) * 60).score, { red: 0, blue: 0 });
  }
});

test('football and basketball restart with the conceding team', () => {
  for (const index of [0, 1]) {
    const match = MATCHES[index];
    for (let round = 0; round < 4; round++) {
      const conceding = match.rounds[round].scorer === 'red' ? 'blue' : 'red';
      assert.equal(matchStateAt(index * 60 + POINT_TIMES[round]).possession, conceding);
      assert.equal(match.rounds[round + 1].possession, conceding);
      assert.equal(matchStateAt(index * 60 + match.rounds[round + 1].start).possession, conceding);
    }
  }
});

test('volleyball awards the next serve to the point winner', () => {
  assert.deepEqual(MATCHES[2].rounds.map(round => round.possession), ['red', 'red', 'blue', 'red', 'blue']);
  for (let round = 0; round < 4; round++) {
    assert.equal(matchStateAt(120 + POINT_TIMES[round]).possession, MATCHES[2].rounds[round].scorer);
    assert.equal(MATCHES[2].rounds[round + 1].possession, MATCHES[2].rounds[round].scorer);
  }
});

test('the supplied arcade script keeps its intro, exact scores and required turnovers', () => {
  assert.deepEqual(POINT_TIMES, [18, 28, 38, 48, 56]);
  assert.deepEqual(MATCHES.map(match => match.rounds.map(round => round.scorer)), [
    ['red', 'blue', 'red', 'blue', 'blue'],
    ['blue', 'red', 'red', 'blue', 'red'],
    ['red', 'blue', 'red', 'blue', 'blue'],
  ]);
  for (let index=0; index<3; index++) {
    assert.equal(matchStateAt(index*60+7.99).phase, 'intro');
    assert.deepEqual(matchStateAt(index*60+7.99).score, {red:0, blue:0});
    assert.equal(matchStateAt(index*60+8).phase, 'play');
    assert.equal(matchStateAt(index*60+55.99).winner, null);
  }
  assert.equal(MATCHES[0].rounds[4].possession, 'red');
  assert.equal(MATCHES[0].rounds[4].scorer, 'blue');
  assert.equal(MATCHES[1].rounds[2].possession, 'blue');
  assert.equal(MATCHES[1].rounds[2].scorer, 'red');
});

test('every sampled time is repeatable and scores stop after a winner', () => {
  for (let time = 0; time < 180; time += .25) {
    const state = matchStateAt(time);
    assert.deepEqual(state, matchStateAt(time + 180));
    assert.ok(state.score.red <= 3 && state.score.blue <= 3);
    assert.ok(state.score.red + state.score.blue <= 5);
  }
  assert.throws(() => matchStateAt(NaN), /finite/);
});
