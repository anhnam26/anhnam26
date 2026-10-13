import * as T from '../../public/vendor/three.module.js';
import { makeActor } from '../characters/models.js';
import { poseActor } from '../characters/motion.js';
import { PALETTES,makeEnvironments } from '../scenes/environments.js';
import { material,geometry,box } from '../scenes/primitives.js';
import { drawInterface } from '../scenes/interface.js';
import { loadPortraits } from '../assets/textures.js';
import { stateAt } from './timeline.js';
import { LoopBlend } from '../transitions/loop.js';

export async function makeRenderer(canvas,overlay) {
  const gpu=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  gpu.outputColorSpace=T.SRGBColorSpace;gpu.toneMapping=T.NoToneMapping;
  gpu.shadowMap.enabled=true;gpu.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,16/9,.05,150);
  const ambient=new T.HemisphereLight('#cee0dc','#242b27',2.3);scene.add(ambient);
  const sun=new T.DirectionalLight('#e5e8dc',2.6);sun.position.set(-5,9,6);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:40});sun.shadow.bias=-.001;
  scene.add(sun);scene.add(sun.target);
  const rim=new T.DirectionalLight('#7eafbb',1.6);rim.position.set(4,5,-4);scene.add(rim);
  const portraits=await loadPortraits();
  const sets=makeEnvironments(portraits['group-photo.jpg']);Object.values(sets).forEach(g=>scene.add(g));
  const ids=['jacket','skull','goggles','dog','operator','rookie','gamer','commander','bald'];
  const actors=Object.fromEntries(ids.map(id=>[id,makeActor(id,portraits[`${id==='rookie'?'operator':id}-face.png`])]));
  Object.values(actors).forEach(a=>scene.add(a.group));
  const particles=new T.InstancedMesh(geometry('sphere'),material('#d9b66c',.1,.45,'#915820'),180);
  particles.instanceMatrix.setUsage(T.DynamicDrawUsage);particles.frustumCulled=false;scene.add(particles);
  const flame=new T.PointLight('#ffa63f',0,8);scene.add(flame);
  const phone=new T.Group();box(phone,[.15,.26,.025],[0,0,0],material('#121d21'));
  box(phone,[.13,.23,.008],[0,0,.018],material('#4ebc9b',.1,.4,'#18593a'));scene.add(phone);
  const transform=new T.Object3D(),loop=new LoopBlend(gpu),look=new T.Vector3();
  const views={wide:[[2.8,1.95,4.7],[0,1.25,0],49],low:[[2.7,.65,4.1],[0,1.35,0],54],
    medium:[[1.15,2.05,4.6],[0,1.48,0],45],close:[[.55,2.07,2.45],[0,1.93,.04],43],
    face:[[.03,2.12,1.07],[0,2.03,.09],43],rear:[[0,1.04,3.1],[0,1.5,-.5],58],
    counter:[[0,1.92,5.2],[0,1.44,0],43],weapon:[[1.36,1.48,1.8],[.1,1.22,.42],40],
    screen:[[0,2,5],[0,1.8,-2],50]};
  function draw(state) {
    const {shot,local,progress}=state,palette=PALETTES[shot.set];
    scene.background=new T.Color(palette.bg);scene.fog=new T.Fog(palette.fog,11,45);
    sun.color.set(palette.light);sun.intensity=palette.sun;
    ambient.color.set(shot.set==='hangar'?'#d3b484':shot.set==='red'?'#9b1d2f':'#bccdc7');
    ambient.intensity=shot.set==='red'?1.2:2.15;
    Object.entries(sets).forEach(([name,set])=>{set.visible=name===shot.set;});
    Object.values(actors).forEach(a=>{a.group.visible=false;});
    shot.cast.forEach((id,i)=>poseActor(actors[id],state,i));
    const [position,target,fov]=views[shot.camera];
    camera.position.set(...position);look.set(...target);camera.fov=fov;
    if(shot.set==='void') {camera.position.set(6,4.2,8);look.set(0,2,0);}
    if(shot.action==='roster')shot.cast.forEach((id,i)=>actors[id].group.position.set((i-(shot.cast.length-1)/2)*1.6,0,0));
    if(shot.action==='fuel') {
      const fuel=sets.lab.userData.fuel;fuel.visible=true;
      if(shot.camera==='low'){camera.position.set(1.8,.67,3.3);look.set(1.4,.65,.9);}
    } else sets.lab.userData.fuel.visible=shot.set==='lab'&&shot.camera==='wide';
    if(shot.action==='group')shot.cast.forEach((id,i)=>actors[id].group.position.set((i-2)*1.1,0,0));
    if(shot.action==='montage') {
      camera.position.set(0,1.7,7.5);look.set(0,1.7,0);
      sets.gallery.userData.cards.forEach((card,i)=>{
        card.position.set(Math.sin(i*2.6)*3,1.7+Math.cos(i*3)*1.7,-i*.38);
        card.rotation.set(Math.sin(local+i)*.03,Math.sin(local*.5+i)*.18,Math.sin(i*5)*.17);
      });
    } else if(shot.action!=='phone'&&shot.cast.length) {
      const primary=actors[shot.cast[0]].group.position;
      if(shot.camera!=='wide'&&shot.camera!=='counter'&&shot.camera!=='screen') {
        camera.position.x+=primary.x;camera.position.z+=primary.z;look.x+=primary.x;look.z+=primary.z;
      }
    }
    if(shot.action==='arrows'&&shot.start===0) {camera.position.set(0,.94,2.23);look.set(0,1.59,-.4);actors.jacket.group.scale.setScalar(1.35);}
    if(shot.camera==='counter') {
      camera.position.set(0,1.96,4.5);look.set(0,1.66,0);camera.fov=38;
      if(shot.set==='lab') {sets.lab.userData.fuel.visible=false;}
    }
    if(shot.action==='photo') {
      sets.gallery.visible=true;
      sets.gallery.userData.cards.forEach((card,i)=>{card.visible=i===0;if(i===0){card.position.set(.4,1.45,1.3);card.rotation.set(0,-.1,-.07);card.scale.setScalar(.5);}});
    } else sets.gallery.userData.cards.forEach(card=>{card.visible=true;card.scale.setScalar(1);});
    if(!['screen','face','weapon','counter'].includes(shot.camera)) {
      camera.position.x+=Math.sin(local*.13)*.13;camera.position.y+=Math.sin(local*.23)*.025;
    }
    camera.lookAt(look);camera.updateProjectionMatrix();
    phone.visible=shot.action==='phone';phone.position.set(.15,1.4,.45);phone.rotation.set(-.1,.2,0);
    const firing=['fire','smoke','sparks','leap'].includes(shot.action);
    for(let i=0;i<particles.count;i++) {
      const age=(local*1.6+i*.037)%1,theta=i*2.39996;
      const size=firing?(1-age)*(.018+i%4*.006):0;
      const origin=shot.cast[0]?actors[shot.cast[0]].group.position:new T.Vector3();
      transform.position.set(origin.x+Math.cos(theta)*age*2,1.3+Math.sin(theta)*age*1.5-age*age,origin.z+.8+age*3);
      transform.scale.setScalar(size);transform.updateMatrix();particles.setMatrixAt(i,transform.matrix);
    }
    particles.instanceMatrix.needsUpdate=true;particles.visible=firing;
    flame.intensity=shot.action==='fire'?Math.max(0,Math.sin(local*17))**12*10:0;
    flame.position.set(.25,1.25,1.5);
    gpu.render(scene,camera);
  }
  function render(seconds) {
    const state=stateAt(seconds);
    if(state.loopBlend>0)loop.render(()=>draw(state),()=>draw(stateAt(0)),state.loopBlend);
    else {gpu.setRenderTarget(null);draw(state);}
    drawInterface(overlay,state);
    return state;
  }
  function resize(width,height) {
    // A bounded pixel count keeps mobile GPUs from drawing unnecessary 4K frames.
    const factor=Math.min(1,1280/width),w=Math.round(width*factor),h=Math.round(height*factor);
    gpu.setPixelRatio(1);gpu.setSize(w,h,false);overlay.width=w;overlay.height=h;
    camera.aspect=w/h;camera.updateProjectionMatrix();loop.resize(w,h);
  }
  function inspect() {
    const gl=gpu.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    return {drawCalls:gpu.info.render.calls,triangles:gpu.info.render.triangles,
      gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'WebGL2',
      geometries:gpu.info.memory.geometries,textures:gpu.info.memory.textures,
      visibleActors:Object.values(actors).filter(a=>a.group.visible).map(a=>a.id),
      poses:Object.values(actors).filter(a=>a.group.visible).map(a=>({id:a.id,position:a.group.position.toArray()})),
      joints:Object.values(actors).filter(a=>a.group.visible).flatMap(a=>a.arms.map(l=>{
        scene.updateMatrixWorld(true);const shoulder=l.upper.getWorldPosition(new T.Vector3());
        const elbow=l.lower.getWorldPosition(new T.Vector3());
        // Measure in rig space: the reference intentionally stretches a whole
        // animal during its short meme insert, without separating its joints.
        a.root.worldToLocal(shoulder);a.root.worldToLocal(elbow);
        return {actor:a.id,length:shoulder.distanceTo(elbow),expected:l.a*l.upper.scale.y};
      }))};
  }
  return {render,resize,inspect};
}
