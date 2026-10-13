import { reach } from './models.js';

export function poseActor(actor,state,slot) {
  const {shot,local,progress}=state,{root,group,head,arms,legs,weapon}=actor;
  const action=shot.action,duel=['duel','struggle','handshake','bow'].includes(action);
  group.visible=true;group.position.set(slot===0?0:slot%2?-1.9:1.9,0,-Math.floor(slot/2)*1.7);
  group.scale.setScalar(1);group.rotation.set(0,0,0);root.position.set(0,0,0);root.rotation.set(0,0,0);
  head.rotation.set(0,0,0);head.scale.setScalar(1);weapon.rotation.set(0,-.16,0);
  weapon.visible=!['jacket','bald','gamer','commander'].includes(actor.id)
    &&!['chat','duel','bow','handshake','reach','photo','iris'].includes(action);
  const walking=['walk','run'].includes(action),phase=local*(action==='run'?7:4);
  for(const [i,leg] of legs.entries()) {
    const wave=Math.sin(phase+i*Math.PI);
    leg.upper.rotation.set(walking?wave*.55:.02,0,(i?1:-1)*.035);
    leg.lower.rotation.set(walking?Math.max(0,-wave)*.78:.09,0,0);
  }
  const breath=Math.sin(local*2.1+slot)*.012;
  root.position.y=breath+(walking?Math.abs(Math.sin(phase))*.047:0);
  head.rotation.y=Math.sin(local*.65+slot)*.035;
  for(const arm of arms)reach(arm,[arm.side*.53,1.03+breath,.13]);
  if(shot.camera==='rear'&&slot===0)group.rotation.y=Math.PI;
  if(walking) {
    group.position.z=-progress*(action==='run'?5:2.3);
    root.rotation.x=.08;
    for(const arm of arms)reach(arm,[arm.side*.56,1.04,Math.sin(phase+arm.side*Math.PI/2)*.3]);
  }
  if(['aim','weapon','fire','scope','threat','inspect','fuel','roster'].includes(action)) {
    group.rotation.y=shot.camera==='weapon'?-.9:slot%2?.46:-.3;
    const recoil=action==='fire'?Math.max(0,Math.sin(local*17))**12*.065:0;
    weapon.position.set(.29,1.18,.38-recoil);
    reach(arms[1],[.3,1.18,.37-recoil]);reach(arms[0],[.14,1.23,.64-recoil]);
    root.rotation.x=-recoil*.5;
  } else weapon.position.set(.29,1.18,.38);
  if(action==='phone') {
    reach(arms[1],[.2,1.39,.5]);reach(arms[0],[-.07,1.35,.46]);head.rotation.x=.3;
    group.rotation.y=Math.PI*.78;
  }
  if(action==='chat'||action==='failure') {
    group.position.x=slot===0?-1.08:slot===1?1.08:0;
    if(slot===2) {group.position.z=2.55;group.rotation.y=Math.PI;}
    head.rotation.y=(slot===0?1:-1)*(.25+Math.sin(local*.8)*.1);
    reach(arms[1],[.47,1.35+Math.sin(local*1.2)*.1,.55]);
    if(action==='failure'&&slot===0) {root.rotation.z=-.23*Math.sin(Math.PI*progress);root.position.y=-.12;}
  }
  if(action==='reach'||action==='interact')reach(arms[1],[.42,1.74,.88]);
  if(action==='cower') {
    root.position.y=-.2;root.rotation.x=.38;
    for(const arm of arms)reach(arm,[arm.side*.4,1.98,.32]);
  }
  if(action==='sit') {root.position.y=-.56;legs.forEach(l=>{l.upper.rotation.x=-1.22;l.lower.rotation.x=1.5;});}
  if(action==='stretch')group.scale.y=1+1.6*Math.sin(progress*Math.PI)**2;
  if(action==='leap'||action==='float') {
    const arc=action==='float'?.7+Math.sin(local*.9+slot)*.3:Math.sin(progress*Math.PI);
    group.position.y=arc*(action==='float'?2.9:1.8);
    group.position.x+=(progress-.5)*(action==='float'?2:3);
    root.rotation.z=action==='float'?local*.19+slot*.9:-.38;
    root.rotation.x=action==='float'?.5:.15;
    legs.forEach((l,i)=>{l.upper.rotation.x=i?-.8:.65;l.lower.rotation.x=.85;});
    arms.forEach(a=>reach(a,[a.side*.65,1.48,.39]));
  }
  if(duel) {
    const wave=Math.sin(local*2.6),side=slot===0?-1:1;
    group.position.set(side*.91,0,0);group.rotation.y=-side*Math.PI/2;
    root.rotation.z=side*wave*.08;
    const punch=slot===0?Math.max(0,wave):Math.max(0,-wave);
    reach(arms[1],[.34,1.55,.3+punch*.62]);reach(arms[0],[-.37,1.52,.4]);
    head.rotation.x=punch*.1;
    if(action==='handshake'){reach(arms[1],[.26,1.19,.8]);reach(arms[0],[-.4,1.02,.14]);}
    if(action==='bow'){root.rotation.x=.3*Math.sin(progress*Math.PI);root.position.y=-.13;}
  }
  if(action==='reaction')head.rotation.y=.14*Math.sin(local*2);
  if(action==='iris')head.scale.setScalar(1.35);
  if(actor.small) {arms.forEach(a=>{a.upper.rotation.set(.04,0,a.side*.13);a.lower.rotation.set(.16,0,0);});}
}
