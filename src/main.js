import { makeRenderer } from './animation/renderer.js';
import { DURATION,stateAt } from './animation/timeline.js';

const canvas=document.querySelector('#scene'),overlay=document.querySelector('#interface');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const stage=document.querySelector('#stage');
let stopped=false;
function fallback() {
  stopped=true;const image=document.createElement('img');
  image.src=new URL(motion.matches?'../public/k1-poster.png':'../assets/sports-preview.gif',import.meta.url).href;
  image.alt='Animated K1 preview';image.style.cssText='width:100%;height:100%;display:block';
  stage.replaceChildren(image);document.documentElement.dataset.ready='fallback';
}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
async function start() {
const engine=await makeRenderer(canvas,overlay);
new ResizeObserver(()=>{const r=stage.getBoundingClientRect();engine.resize(r.width,r.height);}).observe(stage);
const bounds=stage.getBoundingClientRect();engine.resize(bounds.width,bounds.height);
let started=performance.now(),offset=0,playing=!motion.matches;
const timings=[];let previous=performance.now();
function frame(now) {
  if(stopped)return;
  const seconds=playing?offset+(now-started)/1000:offset;
  if(playing)engine.render(seconds);
  if(playing){timings.push(now-previous);if(timings.length>180)timings.shift();}
  previous=now;requestAnimationFrame(frame);
}
motion.addEventListener('change',()=>{offset=0;started=performance.now();playing=!motion.matches;engine.render(0);});
engine.render(0);
requestAnimationFrame(frame);
// Explicit inspection mode is used by comparison/export tools; it adds no UI.
if(new URLSearchParams(location.search).has('inspect'))window.K1={
  duration:DURATION,stateAt,
  seek(seconds){playing=false;offset=seconds;return engine.render(seconds);},
  play(){started=performance.now();previous=started;timings.length=0;playing=true;},
  pause(){offset+=playing?(performance.now()-started)/1000:0;playing=false;},
  inspect(){return {...engine.inspect(),playing,frameMs:timings.length?timings.reduce((a,b)=>a+b)/timings.length:0};},
};
document.documentElement.dataset.ready='true';
}
start().catch(fallback);
