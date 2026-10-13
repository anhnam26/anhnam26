import { stateAt } from '../animation/timeline.js';

let outgoing,incoming;
let technicalDiagram;
export async function loadInterfaceAssets() {
  technicalDiagram=new Image();
  technicalDiagram.src=new URL('../../public/ui/technical-diagram.png',import.meta.url).href;
  await technicalDiagram.decode();
}
// Only graphics present in the reference appear over the rendered scene.
export function drawInterface(canvas,state) {
  if(state.loopBlend>0) {
    outgoing??=document.createElement('canvas');incoming??=document.createElement('canvas');
    for(const layer of [outgoing,incoming]) {layer.width=canvas.width;layer.height=canvas.height;}
    drawInterface(outgoing,{...state,loopBlend:0});drawInterface(incoming,stateAt(0));
    const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);
    context.globalAlpha=1-state.loopBlend;context.drawImage(outgoing,0,0);
    context.globalAlpha=state.loopBlend;context.drawImage(incoming,0,0);context.globalAlpha=1;return;
  }
  const {shot,local,progress}=state,c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.save();c.scale(w/1280,h/720);
  const label=(text,x,y,color='#8fd7b6',size=30)=>{
    c.fillStyle=color;c.font=`bold ${size}px Arial`;c.textAlign='center';c.fillText(text,x,y);
  };
  const panel=(x,y,width,height,color='#122025e8')=>{c.fillStyle=color;c.fillRect(x,y,width,height);c.strokeStyle='#8aa7a580';c.strokeRect(x,y,width,height);};
  const letterbox=['yard','hangar','red','void'].includes(shot.set)||['weapon','face','scope'].includes(shot.camera);
  if(letterbox){c.fillStyle='#000';c.fillRect(0,0,1280,43);c.fillRect(0,677,1280,43);}
  if(shot.action==='arrows')for(const [i,x] of [450,640,795].entries()) {
    c.globalAlpha=Math.min(1,local/.3);
    const y=130+Math.sin(local*3+i)*14;
    c.shadowColor='#ff3030';c.shadowBlur=28;c.fillStyle='#ff5855';
    c.beginPath();c.moveTo(x,y-22);c.lineTo(x-20,y+10);c.lineTo(x-6,y+6);c.lineTo(x-6,y+30);c.lineTo(x+6,y+30);c.lineTo(x+6,y+6);c.lineTo(x+20,y+10);c.fill();
  }
  c.shadowBlur=0;c.globalAlpha=1;
  if(shot.action==='interact') {panel(595,360,170,48);label('F  Interact',680,393,'#fff',24);}
  if(shot.action==='invite') {
    panel(100,100,1080,530,'#18292ef5');label('SQUAD',290,190,'#90b7b5',34);
    c.fillStyle='#f2f1e5';c.beginPath();c.arc(300,330,44,0,Math.PI*2);c.fill();c.fillRect(242,365,116,90);
    label('0',450,400,'#f2f1e5',60);c.setLineDash([18,12]);c.lineWidth=4;c.strokeRect(610,263,185,185);c.setLineDash([]);
    label('+',703,393,'#f2f1e5',94);label('INVITE',700,507,'#9cacad',25);
  }
  if(shot.action==='messages') {
    panel(780,70,330,585,'#0c242c');label('MESSAGES',945,127,'#e3e8e7',26);
    for(let i=0;i<6;i++) {panel(i%2?800:857,175+i*65,i%2?170:228,44,i%2?'#263840':'#4fae9a');label(i%2?'Squad ready':'Join team',i%2?885:970,204+i*65,'#e4f5f0',19);}
  }
  if(shot.action==='inventory') {
    panel(38,30,1204,660,'#152126f5');label('LOADOUT',220,86,'#d3dcd6',34);
    const entries=['TACTICAL VEST','BACKPACK','RIFLE','PISTOL','AMMUNITION'];
    entries.forEach((text,i)=>{
      panel(74,120+i*99,510,79);label(text,256,163+i*99,'#abbab1',24);label(i<2?'x2':i===3?'0 / 7':'READY',505,163+i*99,'#74b990',21);
      panel(665,120+i*99,510,79,'#243434');label(i<2?'EQUIPMENT':'ATTACHMENTS',900,164+i*99,'#a2b7aa',23);
    });
  }
  if(shot.action==='failure') {panel(450,240,380,96,'#142a2aeb');label('EXTRACTION FAILED',640,300,'#ed4b4e',28);}
  if(shot.action==='extraction') {panel(565,210,500,80,'#11272aab');label('HELICOPTER EXTRACTION OPEN',815,261,'#edf0eb',22);}
  if(shot.action==='scope') {
    c.strokeStyle='#101c22';c.lineWidth=5;c.beginPath();c.moveTo(400,360);c.lineTo(870,360);c.moveTo(640,160);c.lineTo(640,560);c.stroke();
    c.lineWidth=2;c.beginPath();c.arc(640,360,230,0,Math.PI*2);c.stroke();label('0001',1030,153,'#d4c878',34);
  }
  if(shot.action==='roster') {
    for(let i=0;i<shot.cast.length;i++)label(i%2?'PASS':'PERFECT',245+i*255,140+(i%2)*50,'#9ad6ee',25);
  }
  if(shot.action==='diagram') {
    c.fillStyle='#000';c.fillRect(0,0,1280,720);
    const zoom=1+(state.time-218)*.006,width=1280*zoom,height=582*zoom;
    c.drawImage(technicalDiagram,(1280-width)/2,69+(582-height)/2,width,height);
    c.restore();return;
  }
  if(shot.action==='iris') {
    const g=c.createRadialGradient(640,360,28,640,360,500);g.addColorStop(0,'#130f08');g.addColorStop(.18,'#20160a');g.addColorStop(.2,'#b78642');g.addColorStop(.7,'#d2ad69');g.addColorStop(1,'#ddd0a7');
    c.fillStyle=g;c.fillRect(0,43,1280,634);c.strokeStyle='#6c48162f';c.lineWidth=2;
    for(let i=0;i<130;i++){const a=i*Math.PI/65;c.beginPath();c.moveTo(640+Math.cos(a)*90,360+Math.sin(a)*90);c.lineTo(640+Math.cos(a)*(430+Math.sin(i*4)*50),360+Math.sin(a)*(430+Math.sin(i*4)*50));c.stroke();}
  }
  // A gentle vignette follows the reference's cinematic grading.
  const vignette=c.createRadialGradient(640,340,220,640,340,760);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#07101b3b');c.fillStyle=vignette;c.fillRect(0,0,1280,720);
  c.restore();
}
