import * as T from '../../public/vendor/three.module.js';
import { Blocks,material,part,box,orb } from './primitives.js';
import { paintedSurface,signTexture } from '../assets/textures.js';

export const PALETTES={
  street:{bg:'#93adb8',fog:'#a4b7b9',light:'#e2eee5',sun:2.6},
  yard:{bg:'#9c8c6a',fog:'#9c947d',light:'#ffdc99',sun:3.3},
  wall:{bg:'#a9b8ba',fog:'#aabbb9',light:'#dfebdf',sun:2.8},
  lab:{bg:'#273d3c',fog:'#2a3f3d',light:'#a2c5af',sun:1.4},
  office:{bg:'#524936',fog:'#70614a',light:'#ebcc99',sun:1.7},
  hangar:{bg:'#aa8657',fog:'#b59971',light:'#ffd592',sun:3.5},
  'blue-room':{bg:'#143747',fog:'#144356',light:'#7badc9',sun:1.2},
  red:{bg:'#a72b37',fog:'#982d3a',light:'#c64547',sun:1.6},
  void:{bg:'#035a79',fog:'#035a79',light:'#78c2dc',sun:1.7},
  gallery:{bg:'#253337',fog:'#253337',light:'#d3c1a2',sun:2},
};

function label(parent,text,size,pos,color,bg) {
  const plane=new T.Mesh(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({map:signTexture(text,color,bg)}));
  plane.position.set(...pos);parent.add(plane);return plane;
}
function surface(color) {return new T.MeshStandardMaterial({map:paintedSurface(color),roughness:.9});}

export function makeEnvironments(photo) {
  const sets={};
  for(const name of Object.keys(PALETTES)) {
    const group=new T.Group(),b=new Blocks(group);
    const wall=surface(name==='hangar'?'#af9d7a':name==='office'?'#55483a':'#687472');
    const metal=material('#374542',.55,.55),trim=material('#b3bbb3',.4,.65),floor=surface(name==='hangar'?'#89744e':name==='yard'?'#b6a076':'#5b6461');
    const glow=material('#3aaa7d',.25,.25,'#04764c');
    if(!['void','red','gallery'].includes(name))b.add([80,.16,90],[0,-.17,-20],floor);
    if(['street','yard','wall'].includes(name)) {
      for(const side of [-1,1])for(let i=0;i<6;i++) {
        const x=side*(5.5+(i%2)*.4),z=-5-i*5;
        b.add([4.6,5+i%3*.7,5],[x,2.4,z],wall);
        b.add([4.9,.16,5.3],[x,5+i%3*.7,z],metal);
        for(let rib=0;rib<17;rib++)b.add([.07,1.2,.08],[x-2.2+rib*.27,4.5,z+2.53],trim);
        b.add([1.6,2.7,.1],[x,1.3,z+2.56],metal);
        for(let y=3.1;y<4.2;y+=.65)for(let win=-1;win<=1;win++)b.add([.7,.42,.06],[x+win*1.18,y,z+2.6],material('#455e62',.6,.2));
        b.add([4.8,.08,.08],[x,5.75,z+2.6],trim);
        for(let rail=0;rail<5;rail++)b.add([.04,.7,.04],[x-2.2+rail*1.1,5.4,z+2.6],trim);
      }
      b.add([9.5,1.1,.4],[0,.5,-9.5],wall);
      if(name==='yard')for(let i=0;i<10;i++) {
        const x=(i%5-2)*2.1,z=-3.8-Math.floor(i/5)*1.9;
        b.add([1.8,1.8,1.8],[x,.9,z],material('#b4a57c',.1,.95));
        for(const offset of [-.78,.78])b.add([.08,1.8,1.82],[x+offset,.9,z],metal);
      }
      if(name==='wall')b.add([17,3,.4],[0,1.5,-3],wall);
      for(let i=0;i<5;i++) {
        const x=(i-2)*5.8,z=-18-(i%2)*8;
        part(group,'cylinder',[.18,5.6,.18],[x,2.8,z],material('#675b40'),[0,0,.07]);
        for(let leaf=0;leaf<8;leaf++) {
          const theta=leaf*Math.PI/4;
          box(group,[.15,.1,3.2],[x+Math.sin(theta),5.5,z+Math.cos(theta)],material('#526843'),[.28,theta,0]);
        }
      }
      label(group,'STORAGE',[2.8,.5],[-5.4,3.2,-2.4]);
      if(name==='street') {
        const car=new T.Group(),white=material('#ced6d3',.25,.4);
        box(car,[1.65,.48,3.2],[0,.6,0],white);box(car,[1.5,.63,1.8],[0,1.1,-.26],white);
        box(car,[1.45,.45,.055],[0,1.14,.66],material('#4e646c',.45,.25));
        for(const s of [-1,1])for(const z of [-1.04,1.03])part(car,'cylinder',[.29,.19,.29],[s*.83,.34,z],material('#192223'),[0,0,Math.PI/2]);
        car.position.set(3.05,0,-2.9);group.add(car);
      }
    } else if(['lab','blue-room'].includes(name)) {
      b.add([20,9,.45],[0,3.5,-6.5],wall);
      for(const x of [-7.2,7.2]) {
        b.add([.6,8,16],[x,3.7,-3],metal);
        for(let y=.3;y<6;y+=1.2)b.add([.75,.14,16],[x,y,-3],trim);
      }
      for(let i=-3;i<=3;i++) {
        b.add([2,.08,.12],[i*2.2,1,-6.2],trim);
        b.add([.08,5.7,.13],[i*2.2,2.4,-6.2],metal);
        b.add([1.75,.08,.1],[i*2.2,4.25,-6.15],glow);
      }
      b.add([4.6,1.1,1.7],[0,.5,-3.2],metal);
      b.add([4.8,.12,1.8],[0,1.15,-3.2],trim);
      label(group,'COMMANDER',[3.6,.75],[0,2.9,-5.99],'#59c48b','#183a32');
      for(let i=-1;i<=1;i++) {
        const screen=new T.Mesh(new T.PlaneGeometry(1.25,.7),new T.MeshBasicMaterial({map:signTexture(i?'EQUIPMENT':'SYSTEM ONLINE','#55b48a','#18352d')}));
        screen.position.set(i*1.4,2.02,-3.4);group.add(screen);
      }
      for(const x of [-5,5])part(group,'cylinder',[.24,7,.24],[x,3.5,-5],metal);
      if(name==='lab') {
        const glass=new T.MeshPhysicalMaterial({color:'#2b9a74',transparent:true,opacity:.16,roughness:.17,metalness:.1,depthWrite:false});
        part(group,'cylinder',[.72,3.8,.72],[0,3.1,-5.5],glass);
        for(const y of [1.1,1.35,4.92,5.14])part(group,'cylinder',[1,.14,1],[0,y,-5.5],metal);
        for(let i=0;i<10;i++)b.add([.055,3.5,.055],[Math.sin(i*Math.PI/5)*.82,3.1,-5.5+Math.cos(i*Math.PI/5)*.82],trim);
        b.add([7,.15,1.75],[0,1.03,1.1],metal);
      }
    } else if(name==='office') {
      b.add([15,8,.4],[0,3,-4],wall);
      for(let x=-6;x<=6;x+=2)b.add([.09,7,.1],[x,3,-3.76],metal);
      b.add([7,.17,2.2],[0,1.08,.6],material('#6c5438'));
      b.add([7,.8,.25],[0,.55,1.7],material('#5a4630'));
      label(group,'SAFE HOUSE',[2.5,.65],[1.8,3.2,-3.7],'#aeab94','#423d33');
    } else if(name==='hangar') {
      b.add([35,12,.3],[0,5.5,-7],wall);
      for(let x=-15;x<=15;x+=3.5) {
        b.add([.14,12,.16],[x,5.5,-6.75],metal);
        b.add([2.9,4.8,.1],[x+1.65,4.8,-6.78],material('#d6bd87',.05,.8,'#4d3c1d'));
        for(let y=3;y<=7;y+=2)b.add([3.4,.1,.17],[x+1.65,y,-6.67],metal);
      }
      label(group,'TRAINING',[6,1.2],[0,3.2,-6.55],'#6d614d','#bca57e');
      for(let x=-10;x<=10;x+=2)b.add([.02,.008,22],[x,-.06,0],material('#695c41'));
    }
    if(name==='lab') {
      const fuel=new T.Group();box(fuel,[.65,1.02,.32],[0,.55,0],material('#899391',.4));
      box(fuel,[.4,.16,.12],[0,1.13,0],metal);
      for(const sign of [-1,1])box(fuel,[.055,.55,.06],[0,.55,.19],metal,[0,0,sign*.66]);
      fuel.position.set(2.2,0,1.7);group.add(fuel);group.userData.fuel=fuel;
    }
    if(name==='gallery') {
      const cards=[];
      for(let i=0;i<10;i++) {
        const card=new T.Group();box(card,[3.5,2.1,.04],[0,0,0],material('#e9e2cc'));
        const plane=new T.Mesh(new T.PlaneGeometry(3.3,1.85),new T.MeshBasicMaterial({map:photo}));
        plane.position.z=.024;card.add(plane);group.add(card);cards.push(card);
      }
      group.userData.cards=cards;
    }
    b.finish();group.visible=false;sets[name]=group;
  }
  return sets;
}
