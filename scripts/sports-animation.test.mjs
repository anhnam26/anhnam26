import assert from 'node:assert/strict';
import test from 'node:test';
import { sportsStateAt, limbSegments, SPORTS_DURATION } from './sports-animation.mjs';

const close = (actual, expected, tolerance=.001) => assert.ok(Math.abs(actual-expected)<tolerance, `${actual} != ${expected}`);

test('sports story repeats deterministically with a continuous loop seam', () => {
  assert.deepEqual(sportsStateAt(0), sportsStateAt(SPORTS_DURATION));
  for (const time of [0,.5,4.8,7,8,12.2,15,18.1,19.5,23]) {
    assert.deepEqual(sportsStateAt(time), sportsStateAt(time+SPORTS_DURATION));
  }
  const last = sportsStateAt(24-1e-7), first = sportsStateAt(0);
  close(last.ball.x,first.ball.x); close(last.ball.y,first.ball.y);
  close(last.a.x,first.a.x); close(last.b.x,first.b.x);
  assert.throws(() => sportsStateAt(NaN), /finite/);
});

test('ball remains visible, in bounds and continuous during all three scene changes', () => {
  let previous = sportsStateAt(0);
  for (let time=.01; time<24; time+=.01) {
    const state = sportsStateAt(time);
    const weights = Object.values(state.scenes);
    close(weights.reduce((sum,n)=>sum+n,0),1);
    assert.ok(weights.every(n=>n>=0 && n<=1));
    assert.ok(state.ball.x-13>24 && state.ball.x+13<1160);
    assert.ok(state.ball.y-13>0 && state.ball.y+13<=236.01);
    assert.ok(Math.hypot(state.ball.x-previous.ball.x,state.ball.y-previous.ball.y)<12);
    previous=state;
  }
  for (const time of [7,15,23]) assert.equal(Object.values(sportsStateAt(time).scenes).filter(n=>n>0).length,2);
});

test('football lands in the goal, basketball passes the rim, and the spike clears the net', () => {
  const goal = sportsStateAt(4.8);
  assert.equal(goal.scenes.football,1);
  assert.ok(goal.ball.x>992 && goal.ball.x<1126 && goal.ball.y>142 && goal.ball.y<236);
  const basket = sportsStateAt(12.2);
  assert.equal(basket.scenes.basketball,1);
  close(basket.ball.x,996); close(basket.ball.y,130);
  const spike = sportsStateAt(18.1);
  close(spike.ball.x,700); close(spike.ball.y,78);
  assert.ok(Math.hypot(spike.b.x+spike.b.rightHand[0]-spike.ball.x,spike.b.y+spike.b.rightHand[1]-spike.ball.y)<13);
  for (let time=18.1;time<18.75;time+=.002) {
    const {ball} = sportsStateAt(time);
    if (ball.x>=802 && ball.x<=862) assert.ok(ball.y+13<132, 'Spike hits the net');
  }
  const landing = sportsStateAt(18.75);
  close(landing.ball.y,223); assert.ok(landing.ball.x>862);
});

test('two-joint limbs preserve segment lengths throughout the animation', () => {
  for (let time=0;time<24;time+=.125) {
    const state = sportsStateAt(time);
    for (const actor of [state.a,state.b]) {
      for (const [origin,target,l1,l2,bend] of [
        [[-9,-78],actor.leftHand,23,23,1],[[9,-78],actor.rightHand,23,23,-1],
        [[-8,-41],actor.leftFoot,21,23,-1],[[8,-41],actor.rightFoot,21,23,-1],
      ]) {
        const limb = limbSegments(origin,target,l1,l2,bend);
        close(Math.hypot(limb.lower.x-origin[0],limb.lower.y-origin[1]),l1);
        close(Math.hypot(limb.end[0]-limb.lower.x,limb.end[1]-limb.lower.y),l2);
        assert.ok(Number.isFinite(limb.upper.angle) && Number.isFinite(limb.lower.angle));
      }
    }
  }
});
