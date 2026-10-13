import * as T from '../../public/vendor/three.module.js';
import { material,part,box,orb } from '../scenes/primitives.js';
import { canvasTexture } from '../assets/textures.js';

const dark=material('#242b2b',.25,.6),cloth=material('#495649'),skin=material('#be936c');
const gold=material('#cfa950',.72,.32),black=material('#10161a',.3),steel=material('#82928d',.7,.35);
const green=material('#216346',.65,.32),glow=material('#3ec477',.3,.3,'#08723b');

export function rifle(ornate=false) {
  const g=new T.Group(),shell=ornate?gold:green;
  box(g,[.16,.18,.55],[0,0,0],shell);
  box(g,[.18,.12,.34],[0,-.015,-.34],dark);
  box(g,[.08,.25,.12],[0,-.16,-.08],black,[.12,0,0]);
  box(g,[.08,.22,.16],[0,-.16,.13],shell,[.2,0,0]);
  part(g,'cylinder',[.034,.74,.034],[0,.035,.51],steel,[Math.PI/2,0,0]);
  part(g,'cylinder',[.052,.18,.052],[0,.035,.93],black,[Math.PI/2,0,0]);
  part(g,'cylinder',[.055,.25,.055],[0,.15,-.02],black,[Math.PI/2,0,0]);
  box(g,[.08,.04,.58],[0,.065,.23],ornate?gold:glow);
  for(let i=0;i<6;i++)box(g,[.185,.035,.025],[0,.05,.05+i*.055],steel);
  g.userData.tip=new T.Vector3(0,.035,1.02);return g;
}

function limb(parent,side,isLeg=false) {
  const upper=new T.Group(),lower=new T.Group();
  const a=isLeg?.48:.43,b=isLeg?.46:.39;
  upper.position.set(side*(isLeg?.19:.47),isLeg?.91:1.7,0);
  const mat=isLeg?dark:cloth;
  part(upper,'capsule',[isLeg?.26:.24,a/2,.27],[0,-a/2,0],mat);
  orb(upper,[.14,.14,.14],[0,0,0],mat);
  lower.position.y=-a;
  part(lower,'capsule',[.21,b/2,.22],[0,-b/2,0],mat);
  orb(lower,[.12,.12,.12],[0,0,0],dark);
  box(lower,isLeg?[.26,.14,.4]:[.15,.18,.15],[0,-b,isLeg?.09:0],isLeg?black:skin);
  upper.add(lower);parent.add(upper);return {upper,lower,a,b,side,isLeg};
}

export function makeActor(id,faceTexture=null) {
  const group=new T.Group(),root=new T.Group(),head=new T.Group();group.add(root);
  const animal=['jacket','goggles','dog'].includes(id),small=id==='jacket';
  const bodyColor=id==='gamer'?material('#332b5b'):id==='commander'?material('#9bc7d1')
    :id==='bald'?material('#9eaebc'):id==='rookie'?material('#737968'):cloth;
  const jacketMaterial=new T.MeshStandardMaterial({color:'#596572',roughness:.98,map:canvasTexture((c,w,h)=>{
    c.fillStyle='#7b838e';c.fillRect(0,0,w,h);c.strokeStyle='#3e4752';c.lineWidth=8;
    for(let y=65;y<h;y+=105){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(160,y+40,350,y-40,512,y);c.stroke();}
    c.strokeStyle='#ffffff18';c.lineWidth=2;for(let i=0;i<1800;i++){const x=i*97%w,y=i*41%h;c.strokeRect(x,y,2,1);}
  })});
  const torso=part(root,'capsule',[small?1.03:.74,small?.38:.46,.65],[0,small?.73:1.34,0],small?jacketMaterial:bodyColor);
  const civilian=['gamer','commander','bald'].includes(id);
  if(!small&&!civilian) {
    box(root,[.73,.45,.38],[0,1.37,.25],dark);
    for(const x of [-.25,0,.25])box(root,[.18,.23,.09],[x,1.27,.49],cloth);
    box(root,[.72,.12,.54],[0,1,0],dark);
  } else if(small) {
    orb(root,[.58,.11,.37],[0,1.075,0],jacketMaterial);
    box(root,[.035,.6,.025],[0,.71,-.336],dark);
  }
  const arms=[limb(root,-1),limb(root,1)],legs=[limb(root,-1,true),limb(root,1,true)];
  head.position.y=small?1.29:2.04;root.add(head);
  if(animal) {
    const fur=material(id==='dog'?'#bb8245':'#ddbd77',0,.95);
    orb(head,[small?.55:.32,small?.43:.42,small?.4:.31],[0,0,0],fur);
    orb(head,[.22,.15,.17],[0,-.13,.27],material('#e1c59a'));
    orb(head,[.075,.047,.049],[0,-.08,.418],black);
    for(const s of [-1,1]) {
      if(id!=='goggles')part(head,'cone',[.22,.4,.2],[s*(small?.34:.25),.34,0],fur,[0,0,-s*.16]);
      orb(head,[.032,.05,.023],[s*.135,.04,.294],black);
    }
    if(!small) {
      const helmet=orb(head,[.37,.25,.34],[0,.24,-.015],dark);
      box(head,[.72,.065,.21],[0,.18,.23],dark);
      if(id==='goggles')for(const s of [-1,1]) {
        box(head,[.25,.15,.055],[s*.16,.07,.3],steel);
        box(head,[.21,.11,.06],[s*.16,.07,.334],material('#536b75',.65,.22));
      }
      helmet.userData.helmet=true;
    }
  } else if(id==='skull') {
    orb(head,[.32,.36,.27],[0,0,0],gold);
    orb(head,[.25,.22,.22],[0,-.21,.065],gold);
    for(const s of [-1,1]) {
      orb(head,[.084,.043,.026],[s*.139,.014,.253],black,[0,0,s*.15]);
      orb(head,[.033,.024,.012],[s*.139,.014,.277],material('#b7b89a'));
      orb(head,[.008,.016,.009],[s*.13,.017,.29],black);
      orb(head,[.092,.09,.065],[s*.255,-.1,.2],gold);
      box(head,[.074,.38,.07],[s*.34,-.03,0],black);
    }
    part(head,'cone',[.065,.14,.06],[0,-.115,.292],black,[Math.PI,0,0]);
    for(let i=0;i<7;i++)box(head,[.036,.16,.036],[(i-3)*.044,-.286,.248],gold,[.1,0,0]);
    for(let i=0;i<6;i++)orb(head,[.07,.085,.24],[(i-2.5)*.098,.313,-.07],material('#89897c'),[.25,0,-.2]);
    box(head,[.055,.05,.27],[.32,-.18,.18],black,[0,-.4,0]);
  } else {
    orb(head,[.285,.34,.26],[0,0,0],skin);
    orb(head,[.17,.17,.1],[0,-.1,.2],skin);
    for(const s of [-1,1]) {
      orb(head,[.035,.029,.018],[s*.115,.035,.25],black);
      box(head,[.075,.027,.021],[s*.118,.087,.253],dark,[0,0,s*.09]);
    }
    orb(head,[.045,.09,.054],[0,-.043,.28],skin);
    box(head,[.12,.017,.022],[0,-.2,.27],dark);
    if(id!=='bald'&&id!=='gamer') {
      orb(head,[.33,.23,.29],[0,.25,-.014],cloth);
      box(head,[.53,.06,.22],[0,.17,.17],dark);
      box(head,[.42,.16,.05],[0,.03,.28],material('#60706c',.5,.26));
      for(let i=-1;i<=1;i++)orb(head,[.054,.055,.04],[i*.13,.2,.281],steel);
      box(head,[.06,.09,.28],[.29,-.1,.16],black);
    } else if(id==='gamer')orb(head,[.31,.19,.26],[0,.24,0],material('#c4b27a'));
  }
  if(faceTexture) {
    const portrait=new T.Mesh(new T.PlaneGeometry(id==='skull'?.62:.65,id==='goggles'?.65:.83),new T.MeshBasicMaterial({map:faceTexture,transparent:true,depthWrite:false}));
    portrait.position.set(0,id==='goggles'?.06:.03,id==='skull'?.34:.36);head.add(portrait);
  }
  if(civilian) {
    root.children.filter(mesh=>mesh.material===cloth).forEach(mesh=>{mesh.material=bodyColor;});
    arms.forEach(l=>l.upper.traverse(mesh=>{if(mesh.material===cloth)mesh.material=bodyColor;}));
  }
  if(!['bald','gamer','commander','jacket'].includes(id)) {
    box(root,[.68,.76,.37],[0,1.4,-.34],cloth);
    for(const s of [-1,1])box(root,[.15,.51,.12],[s*.39,1.6,.19],dark);
  }
  const weapon=rifle(id==='goggles');weapon.position.set(.29,1.18,.38);root.add(weapon);
  if(small) {for(const l of [...arms,...legs])l.upper.scale.setScalar(.62);arms.forEach(l=>l.upper.position.y=.99);legs.forEach(l=>l.upper.position.y=.4);}
  const actor={id,group,root,head,torso,arms,legs,weapon,small};
  group.userData.actor=id;return actor;
}

const down=new T.Vector3(0,-1,0);
export function reach(limb,target) {
  const start=limb.upper.position,end=new T.Vector3(...target),axis=end.clone().sub(start);
  const distance=Math.min(axis.length(),limb.a+limb.b-.001);axis.normalize();
  end.copy(start).addScaledVector(axis,distance);
  const along=(limb.a**2-limb.b**2+distance**2)/(2*Math.max(.001,distance));
  const height=Math.sqrt(Math.max(0,limb.a**2-along**2));
  const bend=new T.Vector3(limb.side*.8,-.3,-.35).addScaledVector(axis,-new T.Vector3(limb.side*.8,-.3,-.35).dot(axis)).normalize();
  const elbow=start.clone().addScaledVector(axis,along).addScaledVector(bend,height);
  const q=new T.Quaternion().setFromUnitVectors(down,elbow.clone().sub(start).normalize());
  limb.upper.quaternion.copy(q);
  limb.lower.quaternion.copy(q.clone().invert().multiply(new T.Quaternion().setFromUnitVectors(down,end.sub(elbow).normalize())));
}
