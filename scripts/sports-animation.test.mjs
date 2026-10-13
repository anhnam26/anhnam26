import assert from 'node:assert/strict';
import test from 'node:test';
import { sportsStateAt, SPORTS_DURATION } from './sports-animation.mjs';
import { contactEvents } from './sports-timeline.mjs';
import { playerBones, worldHand, worldFoot, ARM_LENGTHS, LEG_LENGTHS } from './sports-rig.mjs';
import { MATCHES, POINT_TIMES } from './sports-matches.mjs';

const close=(a,b,tolerance=.001)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('the three-minute animation closes without a ball or player jump', () => {
  assert.equal(SPORTS_DURATION,180);
  assert.deepEqual(sportsStateAt(0),sportsStateAt(180));
  const before=sportsStateAt(180-1e-7),after=sportsStateAt(0);
  close(before.ball.x,after.ball.x);close(before.ball.y,after.ball.y);
  for (const id of Object.keys(after.players)) {
    close(before.players[id].x,after.players[id].x);
    close(before.players[id].y,after.players[id].y);
  }
});

test('one ball stays visible and continuous over rallies, resets and court changes', () => {
  let previous=sportsStateAt(0);
  for (let time=.02;time<180;time+=.02) {
    const state=sportsStateAt(time);
    close(Object.values(state.scenes).reduce((sum,n)=>sum+n,0),1);
    assert.ok(state.ball.x-13>24 && state.ball.x+13<1160);
    assert.ok(state.ball.y-13>98 && state.ball.y+13<314);
    assert.ok(distance([state.ball.x,state.ball.y],[previous.ball.x,previous.ball.y])<16,`Ball jumps at ${time}`);
    previous=state;
  }
  for (const time of [59.5,119.5,179.5]) assert.equal(Object.values(sportsStateAt(time).scenes).filter(n=>n>0).length,2);
});

test('four players face the ball, remain in the arena and respect volleyball halves', () => {
  for (let time=0;time<180;time+=.125) {
    const state=sportsStateAt(time);
    assert.equal(Object.keys(state.players).length,4);
    for (const player of Object.values(state.players)) {
      assert.ok(player.x>60 && player.x<1124,player.id);
      if (state.sport==='volleyball' && state.phase!=='transition') assert.ok(player.team==='red'?player.x<592:player.x>592,player.id);
      assert.equal(player.facing,state.ball.x>=player.x?1:-1,`Facing error: ${player.id} at ${time}`);
      assert.ok(Number.isFinite(player.headAngle));
    }
  }
});

test('arm joints remain anatomically bounded and all bone lengths stay fixed', () => {
  for (let time=0;time<180;time+=.2) {
    for (const player of Object.values(sportsStateAt(time).players)) {
      for (const arm of Object.values(player.arms)) {
        assert.ok(Math.abs(arm[1]-arm[0])<=120,`Hyperextended elbow: ${player.id}`);
        assert.ok(arm[1]<=arm[0],`Reversed elbow: ${player.id} at ${time}`);
        assert.ok(arm.every(angle=>angle>=-240 && angle<=60));
      }
      for (const leg of Object.values(player.legs)) {
        assert.ok(leg[1]-leg[0]>=0 && leg[1]-leg[0]<=150,`Reversed knee: ${player.id} at ${time}: ${leg}`);
      }
      for (const [name,bone] of Object.entries(playerBones(player))) {
        const lengths=name.startsWith('arm')?ARM_LENGTHS:LEG_LENGTHS;
        close(distance(bone.upper,bone.lower),lengths[0]);
        close(distance(bone.lower,bone.end),lengths[1]);
      }
    }
  }
});

test('football and basketball include close challenges and an actual steal followed by recovery', () => {
  for (const matchIndex of [0,1]) for (const round of MATCHES[matchIndex].rounds) {
    const start=matchIndex*60+round.scoreAt-8.8;
    const attack=round.possession,defence=attack==='red'?'blue':'red';
    const duel=sportsStateAt(start+(matchIndex===0?1.35:1.8));
    assert.ok(Math.abs(duel.players[`${attack}-1`].x-duel.players[`${defence}-1`].x)<68);
    assert.equal(sportsStateAt(start+2).possession,defence,'Defender must actually gain the ball');
    assert.equal(sportsStateAt(start+2.7).possession,attack,'Attacker must visibly recover it');
    const late=sportsStateAt(start+6);
    assert.ok(attack==='red'?late.players[`${attack}-1`].x>592:late.players[`${attack}-1`].x<592);
  }
});

test('every volleyball serve is hit from behind the end line, with both feet outside the court', () => {
  for (let round=0;round<5;round++) {
    const event=contactEvents(2,round).find(event=>event.action==='serve');
    const state=sportsStateAt(event.time),player=state.players[event.player];
    for (const leg of ['front','back']) {
      const foot=worldFoot(player,leg);
      assert.ok(player.team==='red'?foot[0]+14<162:foot[0]-14>1022,`${player.id}: foot fault at ${event.time}`);
    }
  }
});

test('football tackles, recoveries and shots put the shoe against the ball', () => {
  for (const round of MATCHES[0].rounds) {
    const start=round.scoreAt-8.8,defence=round.possession==='red'?'blue':'red';
    for(const [q,id] of [[1.35,`${defence}-1`],[2.4,`${round.possession}-1`],[3.85,`${round.possession}-2`],[7.2,`${round.possession}-1`]]) {
      const state=sportsStateAt(start+q),player=state.players[id],foot=worldFoot(player);
      const toe=[foot[0]+player.facing*10,foot[1]];
      assert.ok(distance(toe,[state.ball.x,state.ball.y])<15,`${id} misses football at ${start+q}`);
      close(worldFoot(player,'back')[1],player.floor);
    }
  }
});

test('grounded players always have a support foot on the court while they run or crouch', () => {
  for(let time=0;time<180;time+=.08) for(const player of Object.values(sportsStateAt(time).players)) {
    if(player.airborne>0 || player.kickWeight>0) continue;
    const feet=['front','back'].map(leg=>worldFoot(player,leg));
    assert.ok(feet.every(foot=>foot[1]<=player.floor+.001),`${player.id} sinks into the court at ${time}`);
    assert.ok(feet.some(foot=>Math.abs(foot[1]-player.floor)<.01),`${player.id} floats at ${time}`);
  }
});

test('basketball releases, volleyball serves, sets, digs and spikes meet the actual hands', () => {
  for (const match of [1,2]) for (let round=0;round<5;round++) {
    for (const event of contactEvents(match,round)) {
      const state=sportsStateAt(event.time),player=state.players[event.player];
      const point=event.hand==='both'
        ? worldHand(player).map((n,i)=>(n+worldHand(player,'back')[i])/2)
        : worldHand(player,event.hand);
      assert.ok(distance(point,[state.ball.x,state.ball.y])<.02,`${event.action} misses hands at ${event.time}`);
    }
  }
});

test('every scored point has the ball at the correct opposing goal, rim or court', () => {
  for (let match=0;match<3;match++) for (const point of POINT_TIMES) {
    const state=sportsStateAt(match*60+point);
    const scorer=state.round.scorer;
    const expectedX=scorer==='red'?(match===2?1034:1110):(match===2?150:74);
    close(state.ball.x,expectedX);
    close(state.ball.y,match===0?276:match===1?158:296);
  }
});
