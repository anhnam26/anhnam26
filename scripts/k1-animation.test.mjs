import test from 'node:test';
import assert from 'node:assert/strict';
import { DURATION, SEAM_START, SHOTS, stateAt, wrapTime } from '../src/animation/timeline.js';

test('K1 keeps the full 7,338-frame source duration and a continuous authored timeline',()=>{
  assert.equal(DURATION,7338/30);
  assert.equal(SHOTS[0].start,0);
  assert.equal(SHOTS.at(-1).end,DURATION);
  for(const [i,s] of SHOTS.entries()) {
    assert.ok(s.end>s.start);
    if(i)assert.equal(s.start,SHOTS[i-1].end);
    assert.equal(stateAt(s.start).shot,s);
    assert.equal(stateAt(s.end-1e-6).shot,s);
    assert.ok(!['football','basketball','volleyball'].includes(s.set));
  }
});

test('the original black interval retains its duration as a visible hangar beat',()=>{
  for(const t of [213.233,214,216.899])assert.equal(stateAt(t).shot.set,'hangar');
  assert.equal(stateAt(216.9).shot.action,'diagram');
});

test('two complete cycles repeat exactly, including negative time and seam rounding',()=>{
  for(let frame=0;frame<7338;frame++) {
    const t=frame/30;
    assert.deepEqual(stateAt(t),stateAt(t+DURATION));
    assert.deepEqual(stateAt(t),stateAt(t+DURATION*2));
  }
  assert.deepEqual(stateAt(0),stateAt(DURATION));
  assert.equal(wrapTime(-1),DURATION-1);
  assert.equal(wrapTime(DURATION-1e-10),0);
  assert.equal(stateAt(SEAM_START).loopBlend,0);
  assert.ok(stateAt(DURATION-.001).loopBlend>.99);
  assert.throws(()=>stateAt(Infinity),/finite/);
});
