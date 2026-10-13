// Joint angles are authored poses, not unconstrained inverse-kinematics bends.
export const FLOOR = 308;
export const ARM_LENGTHS = [24, 23];
export const LEG_LENGTHS = [21, 22];
export const POSES = Object.freeze({
  idle: { front: [-8, -6], back: [8, 12] },
  carry: { front: [-20, -135], back: [-34, -124] },
  dribble: { front: [-25, -82], back: [12, 35] },
  guard: { front: [-140, -105], back: [-112, -94] },
  shoot: { front: [-166, -153], back: [-152, -168] },
  set: { front: [-155, -169], back: [-166, -147] },
  bump: { front: [-58, -58], back: [-58, -58] },
  cock: { front: [-150, -230], back: [-64, -120] },
  strike: { front: [-135, -125], back: [-45, -72] },
  follow: { front: [-52, -22], back: [-12, -35] },
  save: { front: [-50, -70], back: [-55, -72] },
  celebrate: { front: [-166, -154], back: [-170, -162] },
});

export const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const smooth = (n) => { const x = clamp(n); return x*x*(3-2*x); };
export const mix = (a, b, w) => a+(b-a)*w;
export const blendPose = (a, b, w) => ({
  front: a.front.map((n,i)=>mix(n,b.front[i],w)),
  back: a.back.map((n,i)=>mix(n,b.back[i],w)),
});
export const windowWeight = (t, a, b, c, d) => t<a || t>d ? 0
  : t<b ? smooth((t-a)/(b-a)) : t<=c ? 1 : 1-smooth((t-c)/(d-c));

export function boneChain(origin, angles, lengths) {
  const ends = [origin];
  for (const [i, angle] of angles.entries()) {
    const radians = angle*Math.PI/180;
    const last = ends.at(-1);
    ends.push([last[0]-Math.sin(radians)*lengths[i],last[1]+Math.cos(radians)*lengths[i]]);
  }
  return {
    upper: [origin[0],origin[1],angles[0]],
    lower: [ends[1][0],ends[1][1],angles[1]],
    end: ends[2],
  };
}

// A single anatomical knee branch: the knee points forward and the shin folds
// back for BOTH legs. Mirroring the athlete mirrors the whole joint chain.
export function legAngles(hip, foot) {
  const [thigh,shin]=LEG_LENGTHS;
  const dx=foot[0]-hip[0],dy=foot[1]-hip[1];
  const reach=clamp(Math.hypot(dx,dy),12,thigh+shin-.001);
  const aim=Math.atan2(-dx,dy);
  const hipOffset=Math.acos(clamp((thigh*thigh+reach*reach-shin*shin)/(2*thigh*reach),-1,1));
  const bend=Math.acos(clamp((reach*reach-thigh*thigh-shin*shin)/(2*thigh*shin),-1,1));
  const upper=(aim-hipOffset)*180/Math.PI;
  return [upper,upper+bend*180/Math.PI];
}

// The stance phase offsets body travel exactly, so its shoe stays in place.
// The other foot lifts, swings forward, then lands for the next stride.
export function strideFeet(x, travelled, direction, floor=FLOOR) {
  const stride=48,stance=.6;
  return Object.fromEntries(['front','back'].map((leg,index)=>{
    const phase=((travelled/stride+index*.5)%1+1)%1;
    const swing=clamp((phase-stance)/(1-stance));
    const offset=phase<stance?12-stride*phase:mix(12-stride*stance,12,smooth(swing));
    return [leg,{x:x+direction*offset,y:floor-18*Math.sin(Math.PI*swing),planted:phase<stance}];
  }));
}

export function handPoint(pose, hand='front') {
  return boneChain(hand==='front'?[4,-84]:[-2,-85],pose[hand],ARM_LENGTHS).end;
}

export function makePlayer(id, team, x, y=FLOOR) {
  return { id,team,x,y,lean:0,arms:blendPose(POSES.idle,POSES.idle,0),
    legs:{front:[-8,7],back:[10,-7]},facing:team==='red'?1:-1,headAngle:0,action:'idle' };
}

export function playerBones(player) {
  return {
    'arm-front':boneChain([4,-84],player.arms.front,ARM_LENGTHS),
    'arm-back':boneChain([-2,-85],player.arms.back,ARM_LENGTHS),
    'leg-front':boneChain([5,-41],player.legs.front,LEG_LENGTHS),
    'leg-back':boneChain([-5,-41],player.legs.back,LEG_LENGTHS),
  };
}

export function worldHand(player, hand='front') {
  const local=handPoint(player.arms,hand);
  const radians=player.lean*Math.PI/180;
  return [player.x+player.facing*(local[0]*Math.cos(radians)-local[1]*Math.sin(radians)),
    player.y+local[0]*Math.sin(radians)+local[1]*Math.cos(radians)];
}
