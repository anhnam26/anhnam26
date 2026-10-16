import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const README=new URL('../README.md',import.meta.url);
const SERVICE='anhnam26-live-v1';

function publicOrigin(value) {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/') {
    throw new Error('Use an HTTPS origin without credentials, query parameters or a path.');
  }
  return url.origin;
}

async function verifyResponse(url,fetchImpl) {
  const response=await fetchImpl(url,{
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30_000),
    headers:{'Cache-Control':'no-cache'},
  });
  if(response.status!==200||response.headers.get('X-Activity-Service')!==SERVICE) {
    throw new Error('The endpoint must expose this activity service publicly without a login.');
  }
  const cache=response.headers.get('Cache-Control')??'';
  if(!/(?:^|,)\s*no-cache\s*(?:,|$)/i.test(cache)||!/(?:^|,)\s*no-store\s*(?:,|$)/i.test(cache)) {
    throw new Error('The endpoint must disable image caching before it can be activated.');
  }
  return response;
}

export async function connectActivity(origin,{readme=README,fetchImpl=fetch,now=()=>new Date()}={}) {
  const base=publicOrigin(origin);
  const response=await verifyResponse(`${base}/api/activity?format=json`,fetchImpl);
  const snapshot=await response.json();
  if(snapshot.username!=='anhnam26'||!Number.isSafeInteger(snapshot.calendar?.total)||snapshot.calendar.total<0
    ||!Number.isFinite(Date.parse(snapshot.fetchedAt))
    ||Math.abs(now().getTime()-Date.parse(snapshot.fetchedAt))>120_000) {
    throw new Error('The endpoint did not return a fresh snapshot for anhnam26.');
  }
  for(const theme of ['dark','light']) {
    const image=await verifyResponse(`${base}/api/activity?theme=${theme}`,fetchImpl);
    const svg=await image.text();
    if(!image.headers.get('Content-Type')?.startsWith('image/svg+xml')
      ||!svg.startsWith('<svg ')||!svg.includes('id="sports-arena"')) {
      throw new Error(`The ${theme} image must be a public SVG with the sports animation.`);
    }
  }
  const before=await readFile(readme,'utf8');
  let count=0;
  const after=before.replace(
    /((?:src|srcset)=")(?:assets\/activity-(dark|light)\.svg(?:\?[^"]*)?|https:\/\/[^"\s]+\/api\/activity\?theme=(dark|light))(?=")/g,
    (_,prefix,localTheme,liveTheme)=>{count++;return `${prefix}${base}/api/activity?theme=${localTheme??liveTheme}`;},
  );
  if(count!==3) throw new Error('Expected exactly three activity image references; README was not changed.');
  if(after!==before) await writeFile(readme,after,'utf8');
  return {origin:base,contributions:snapshot.calendar.total,changed:after!==before};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  if(process.argv.length!==3) {
    console.error('Usage: node scripts/connect-activity.mjs https://your-activity-project.vercel.app');
    process.exitCode=1;
  } else connectActivity(process.argv[2]).then(result=>{
    console.log(`Verified live activity: ${result.contributions} contributions.`);
    console.log(result.changed?'README now uses the verified image service.':'README already uses this image service.');
    console.log('Review and commit README.md. No Git push was performed.');
  }).catch(error=>{console.error(error.message);process.exitCode=1;});
}
