import * as T from '../../public/vendor/three.module.js';

export function canvasTexture(draw,width=512,height=512) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  draw(canvas.getContext('2d'),width,height);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}
export function paintedSurface(base,grid=64) {
  const texture=canvasTexture((c,w,h)=>{
    c.fillStyle=base;c.fillRect(0,0,w,h);
    let seed=4231;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
    for(let i=0;i<5000;i++) {
      c.fillStyle=rand()>.5?'#ffffff0c':'#00000012';c.fillRect(rand()*w,rand()*h,rand()*7+1,rand()*3+1);
    }
    c.strokeStyle='#151a1a40';c.lineWidth=2;
    for(let x=0;x<w;x+=grid){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
    for(let y=0;y<h;y+=grid){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  });
  texture.wrapS=texture.wrapT=T.RepeatWrapping;return texture;
}
export function signTexture(label,color='#ccd3ce',background='#29332f') {
  return canvasTexture((c,w,h)=>{
    c.fillStyle=background;c.fillRect(0,0,w,h);c.strokeStyle='#a1c0b966';c.lineWidth=8;c.strokeRect(6,6,w-12,h-12);
    c.font='bold 60px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(label,w/2,h/2,w-34);
  },1024,192);
}
export async function loadPortraits() {
  const loader=new T.TextureLoader();
  const entries=await Promise.all(['gamer-face.png','commander-face.png','bald-face.png','skull-face.png','operator-face.png','goggles-face.png','group-photo.jpg'].map(async name=>{
    const texture=await loader.loadAsync(new URL(`../../public/portraits/${name}`,import.meta.url).href);
    texture.colorSpace=T.SRGBColorSpace;return [name,texture];
  }));
  return Object.fromEntries(entries);
}
