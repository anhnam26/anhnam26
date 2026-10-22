import {mkdir,writeFile} from 'node:fs/promises';
import {renderSportsAnimation} from './sports-animation.mjs';

// Sports choreography never depends on contribution data or the image theme.
// Compile it once during the build, outside the image proxy's request deadline.
const output=new URL('../.generated/',import.meta.url);
await mkdir(output,{recursive:true});
const sports=renderSportsAnimation();
await writeFile(new URL('sports.svg',output),sports,'utf8');
console.log(`Prepared sports scene: ${Buffer.byteLength(sports)} bytes. No activity counts are cached.`);
