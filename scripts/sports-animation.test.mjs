import assert from 'node:assert/strict';
import test from 'node:test';
import { sportsStateAt, SPORTS_DURATION } from './sports-animation.mjs';
import { contactEvents, actionTimeAt } from './sports-timeline.mjs';
import { PLAYER_LOOKS } from './sports-art.mjs';
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

test('the four pixel identities retain distinct numbers, hair and skin across sports', () => {
  assert.equal(Object.keys(PLAYER_LOOKS).length,4);
  assert.equal(new Set(Object.values(PLAYER_LOOKS).map(look=>look.number)).size,4);
  assert.equal(new Set(Object.values(PLAYER_LOOKS).map(look=>look.style)).size,4);
  assert.equal(new Set(Object.values(PLAYER_LOOKS).map(look=>look.skin)).size,4);
  for(const time of [8,68,128]) {
    const players=Object.values(sportsStateAt(time).players);
    assert.deepEqual(players.map(player=>player.id),Object.keys(PLAYER_LOOKS));
    assert.equal(players.filter(player=>player.team==='red').length,2);
    assert.equal(players.filter(player=>player.team==='blue').length,2);
  }
});

test('each ending holds the final score while a glowing ball lifts and both courts blend', () => {
  for(let index=0;index<3;index++) {
    const ending=sportsStateAt(index*60+56);
    const middle=sportsStateAt(index*60+59);
    assert.deepEqual(middle.score,ending.score);
    assert.equal(middle.phase,'transition');
    close(middle.morph,1);
    close(middle.scenes[ending.sport],.5);
    close(middle.scenes[ending.nextSport],.5);
    assert.ok(middle.ball.y<ending.ball.y-60);
    const before=sportsStateAt((index+1)*60-1e-7),after=sportsStateAt((index+1)*60);
    close(before.ball.x,after.ball.x);close(before.ball.y,after.ball.y);
    close(Math.cos(before.ball.rotation*Math.PI/180),Math.cos(after.ball.rotation*Math.PI/180));
    if(index<2) close(before.ball.rotation,after.ball.rotation);
    for(const id of Object.keys(after.players)) {
      close(before.players[id].x,after.players[id].x);
      close(before.players[id].y,after.players[id].y);
      close(before.players[id].floor,after.players[id].floor);
    }
  }
});

test('the third basketball play starts blue and contains the decisive red steal', () => {
  const steal=contactEvents(1,2).find(event=>event.action==='steal');
  assert.equal(steal.player,'red-1');
  assert.equal(sportsStateAt(90).possession,'blue');
  assert.equal(sportsStateAt(steal.time+.05).possession,'red');
  assert.deepEqual(sportsStateAt(98).score,{red:2,blue:1});
});

test('one ball stays visible and continuous over rallies, resets and court changes', () => {
  let previous=sportsStateAt(0);
  for (let time=.005;time<180;time+=.005) {
    const state=sportsStateAt(time);
    close(Object.values(state.scenes).reduce((sum,n)=>sum+n,0),1);
    assert.ok(state.ball.x-13>24 && state.ball.x+13<1160);
    assert.ok(state.ball.y-13>40 && state.ball.y+13<314);
    assert.ok(distance([state.ball.x,state.ball.y],[previous.ball.x,previous.ball.y])<12,`Ball jumps at ${time}`);
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
    const at=q=>actionTimeAt(matchIndex,round.index,q);
    const attack=round.scorer,defence=attack==='red'?'blue':'red';
    const duel=sportsStateAt(at(matchIndex===0?1.35:1.8));
    assert.ok(Math.abs(duel.players[`${attack}-1`].x-duel.players[`${defence}-1`].x)<68);
    assert.equal(sportsStateAt(at(2)).possession,defence,'The opponent must actually control the ball');
    assert.equal(sportsStateAt(at(2.7)).possession,attack,'The scorer must visibly recover or steal it');
    const late=sportsStateAt(at(6));
    assert.ok(attack==='red'?late.players[`${attack}-1`].x>592:late.players[`${attack}-1`].x<592);
  }
});

test('a thief runs past the attacker and the attacker later beats the defender', () => {
  for(const matchIndex of [0,1]) for(const round of MATCHES[matchIndex].rounds) {
    const at=q=>actionTimeAt(matchIndex,round.index,q),attack=round.scorer;
    const defence=attack==='red'?'blue':'red',sign=attack==='red'?1:-1;
    const relative=q=>{
      const players=sportsStateAt(at(q)).players;
      return sign*(players[`${attack}-1`].x-players[`${defence}-1`].x);
    };
    assert.ok(relative(1.6)<0,'Defender starts in front');
    assert.ok(relative(matchIndex===0?2.05:2.1)>0,'Thief must run past the opponent');
    assert.ok(relative(7)>25,'Attacker must get past the defender before shooting');
  }
});

test('player paths never collide in the court plane, including restarts and transitions', () => {
  for(let time=0;time<180;time+=.01) {
    const players=Object.values(sportsStateAt(time).players);
    for(let i=0;i<players.length;i++) for(let j=i+1;j<players.length;j++) {
      const a=players[i],b=players[j];
      assert.ok(Math.hypot(a.x-b.x,a.floor-b.floor)>=30,`${a.id} runs into ${b.id} at ${time.toFixed(2)}`);
    }
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
    const at=q=>actionTimeAt(0,round.index,q),defence=round.scorer==='red'?'blue':'red';
    const events=[[2.4,`${round.scorer}-1`],[3.85,`${round.scorer}-2`],[7.2,`${round.scorer}-1`]];
    if(round.possession===round.scorer) events.push([1.35,`${defence}-1`]);
    for(const [q,id] of events) {
      const state=sportsStateAt(at(q)),player=state.players[id],foot=worldFoot(player);
      const toe=[foot[0]+player.scale*player.facing*10,foot[1]];
      assert.ok(distance(toe,[state.ball.x,state.ball.y])<15,`${id} misses football at ${at(q)}`);
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
    const expectedX=scorer==='red'?(match===2?990:1110):(match===2?194:74);
    close(state.ball.x,expectedX);
    close(state.ball.y,match===0?276:match===1?158:296);
  }
});
