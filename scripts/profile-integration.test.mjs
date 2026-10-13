import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the looping GIF is a separate section below Activity and before repositories',async()=>{
  const readme=await readFile(new URL('../README.md',import.meta.url),'utf8');
  const activity=readme.match(/## GitHub Activity([\s\S]*?)(?=\n## )/)?.[1];
  assert.ok(activity);
  assert.doesNotMatch(activity,/sports-preview|K1|Pixel Sports/);
  const activityAt=readme.indexOf('assets/activity-dark.svg'),previewAt=readme.indexOf('assets/sports-preview.gif');
  assert.ok(activityAt<previewAt&&previewAt<readme.indexOf('## Selected repositories'));
  assert.match(readme,/<a href="https:\/\/anhnam26\.github\.io\/anhnam26\/">\s*<img src="assets\/sports-preview\.gif"/);
});

test('the README preview is a looping native GIF with documented shortened excerpts',async()=>{
  const gif=await readFile(new URL('../assets/sports-preview.gif',import.meta.url));
  const meta=JSON.parse(await readFile(new URL('../assets/sports-preview.json',import.meta.url),'utf8'));
  assert.match(gif.toString('ascii',0,6),/^GIF8[79]a$/);
  assert.equal(gif.readUInt16LE(6),480);assert.equal(gif.readUInt16LE(8),270);
  const loop=gif.indexOf('NETSCAPE2.0');assert.ok(loop>0);assert.equal(gif.readUInt16LE(loop+13),0);
  assert.equal(gif.length,meta.bytes);assert.ok(gif.length<4_200_000);
  assert.ok(meta.frames>250);assert.equal(meta.full_animation_seconds,244.6);
  assert.ok(meta.decoded_duration_seconds<30&&meta.decoded_duration_seconds>20);
  assert.ok(meta.selected_source_intervals.every(([start,end])=>start>=0&&end>start&&end<=244.6));
});
