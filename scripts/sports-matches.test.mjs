import assert from 'node:assert/strict';
import test from 'node:test';
import { MATCHES, SPORTS_DURATION, TEAMS, CELEBRATION_DURATION, matchStateAt } from './sports-matches.mjs';
import { choreographyDuration, elapsedAtQ } from './sports-paths.mjs';

test('match lengths follow normal-paced plays, restarts and celebrations', () => {
  assert.equal(SPORTS_DURATION,MATCHES.reduce((sum,m)=>sum+m.duration,0));
  assert.deepEqual(matchStateAt(0),matchStateAt(SPORTS_DURATION));
  for(const [index,match] of MATCHES.entries()) {
    assert.notEqual(match.duration,60);
    assert.equal(matchStateAt(match.startAt).sport,match.sport);
    assert.equal(matchStateAt(match.startAt+match.duration-.001).sport,match.sport);
    assert.equal(matchStateAt(match.startAt+match.duration).sport,MATCHES[(index+1)%3].sport);
    assert.ok(Math.abs(match.transitionStart-match.winAt-CELEBRATION_DURATION)<1e-6);
    assert.ok(match.rounds.every(round=>round.duration>=choreographyDuration(match.sport,round)));
    for(const round of match.rounds) {
      for(let q=.1;q<choreographyDuration(match.sport,round);q+=.1) {
        assert.ok(elapsedAtQ(match.sport,round,q)-elapsedAtQ(match.sport,round,q-.1)>=.1-1e-9);
      }
    }
  }
  assert.equal(TEAMS.red.side,'left');assert.equal(TEAMS.blue.side,'right');
});

test('first to three ends each game at the fixed 3-2 result', () => {
  for(const [index,expected] of ['blue','red','blue'].entries()) {
    const match=MATCHES[index];
    for(const round of match.rounds.slice(0,-1)) {
      const state=matchStateAt(match.startAt+round.scoreAt);
      assert.equal(state.winner,null);
      assert.ok(state.score.red<3&&state.score.blue<3);
    }
    const final=matchStateAt(match.startAt+match.winAt);
    assert.equal(final.winner,expected);
    assert.deepEqual(final.score,expected==='red'?{red:3,blue:2}:{red:2,blue:3});
    assert.equal(final.possession,null);
    assert.equal(final.phase,'victory');
    assert.equal(matchStateAt(match.startAt+match.transitionStart).phase,'transition');
    assert.deepEqual(matchStateAt(match.startAt+match.duration).score,{red:0,blue:0});
  }
});

test('football and basketball restart with the conceding team', () => {
  for(const index of [0,1]) {
    const match=MATCHES[index];
    for(let round=0;round<4;round++) {
      const conceding=match.rounds[round].scorer==='red'?'blue':'red';
      assert.equal(matchStateAt(match.startAt+match.rounds[round].scoreAt).possession,conceding);
      assert.equal(match.rounds[round+1].possession,conceding);
      assert.equal(matchStateAt(match.startAt+match.rounds[round+1].start).possession,conceding);
    }
    assert.equal(match.rounds[0].duration,match.rounds[4].duration,'The winning attack must keep the opening attack pace');
  }
});

test('volleyball awards the next serve to the point winner', () => {
  const match=MATCHES[2];
  assert.deepEqual(match.rounds.map(round=>round.possession),['red','red','blue','red','blue']);
  for(let round=0;round<4;round++) {
    assert.equal(matchStateAt(match.startAt+match.rounds[round].scoreAt).possession,match.rounds[round].scorer);
    assert.equal(match.rounds[round+1].possession,match.rounds[round].scorer);
  }
});

test('the fixed scoring order and required turnovers survive the relaxed timing', () => {
  assert.deepEqual(MATCHES.map(match=>match.rounds.map(round=>round.scorer)),[
    ['red','blue','red','blue','blue'],['blue','red','red','blue','red'],['red','blue','red','blue','blue'],
  ]);
  for(const match of MATCHES) {
    assert.equal(matchStateAt(match.startAt+match.introDuration-.001).phase,'intro');
    assert.equal(matchStateAt(match.startAt+match.introDuration).phase,'play');
    assert.equal(matchStateAt(match.startAt+match.winAt-.001).winner,null);
  }
  assert.equal(MATCHES[0].rounds[4].possession,'red');assert.equal(MATCHES[0].rounds[4].scorer,'blue');
  assert.equal(MATCHES[1].rounds[2].possession,'blue');assert.equal(MATCHES[1].rounds[2].scorer,'red');
});

test('every sampled time is repeatable and scores stop after a winner', () => {
  for(let time=0;time<SPORTS_DURATION;time+=.25) {
    const state=matchStateAt(time);
    assert.deepEqual(state,matchStateAt(time+SPORTS_DURATION));
    assert.ok(state.score.red<=3&&state.score.blue<=3&&state.score.red+state.score.blue<=5);
  }
  assert.throws(()=>matchStateAt(NaN),/finite/);
});
