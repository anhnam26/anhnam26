import assert from 'node:assert/strict';
import test from 'node:test';
import { legAngles, strideFeet, boneChain, LEG_LENGTHS } from './sports-rig.mjs';

test('both knees bend towards the same anatomical side for every reachable foot target', () => {
  for (const hip of [[5,-41],[-5,-41]]) {
    for (let x=-24;x<=24;x+=3) for (let y=-24;y<=0;y+=3) {
      const angles=legAngles(hip,[x,y]);
      const knee=angles[1]-angles[0];
      assert.ok(knee>=0 && knee<=150,`Reversed knee: ${angles}`);
      const bone=boneChain(hip,angles,LEG_LENGTHS);
      const reach=Math.hypot(x-hip[0],y-hip[1]);
      if (reach<=42.99 && reach>=12) assert.ok(Math.hypot(bone.end[0]-x,bone.end[1]-y)<.001);
    }
  }
});

test('a stance foot stays planted while the body travels, in either running direction', () => {
  for (const direction of [-1,1]) for (const leg of ['front','back']) {
    const offset=leg==='front'?0:24;
    const points=[0,4,8].map(distance=>strideFeet(400+direction*distance,distance+offset,direction)[leg]);
    assert.ok(points.every(point=>point.planted));
    assert.ok(points.every(point=>Math.abs(point.x-points[0].x)<.001));
    assert.ok(points.every(point=>point.y===308));
  }
});

test('the swing foot clears the floor and returns continuously to the next stance', () => {
  const before=strideFeet(400,47.999,1).front;
  const after=strideFeet(400,48,1).front;
  assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.01);
  assert.ok(strideFeet(400,38.4,1).front.y<296);
});
