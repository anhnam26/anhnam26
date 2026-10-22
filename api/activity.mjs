import { fetchActivitySnapshot, renderActivity } from '../scripts/update-activity.mjs';
import { readFile } from 'node:fs/promises';
import { loadPublishedSnapshot, validateActivitySnapshot } from '../scripts/activity-fallback.mjs';

let sportsTemplate;
const loadSportsTemplate=()=>sportsTemplate??=readFile(new URL('../.generated/sports.svg',import.meta.url),'utf8');

const HEADERS = Object.freeze({
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Activity-Service': 'anhnam26-live-v1',
});

const errorResponse=(status,code,message,extraHeaders={})=>Response.json(
  {error:{code,message}}, {status,headers:{...HEADERS,...extraHeaders}});

export function createActivityHandler({
  fetchImpl=fetch,token,now=()=>new Date(),timeoutMs=3000,
  loadFallback=()=>loadPublishedSnapshot({fetchImpl}),onError=()=>{},
}={}) {
  let lastSuccessful;
  return async request=>{
    if(!['GET','HEAD'].includes(request.method)) {
      return errorResponse(405,'METHOD_NOT_ALLOWED','Use GET or HEAD.',{Allow:'GET, HEAD'});
    }
    const url=new URL(request.url);
    if(url.pathname!=='/api/activity') return errorResponse(404,'NOT_FOUND','Activity endpoint not found.');
    const params=url.searchParams;
    if([...params.keys()].some(key=>!['theme','format'].includes(key)||params.getAll(key).length!==1)
      ||!['dark','light'].includes(params.get('theme')??'dark')
      ||!['svg','json'].includes(params.get('format')??'svg')) {
      return errorResponse(400,'INVALID_QUERY','Use theme=dark|light and format=svg|json.');
    }
    try {
      const json=params.get('format')==='json';
      let snapshot,stale=false;
      try {
        // Every reload first attempts fresh data. A previous result is used
        // only to keep the image visible during an upstream outage.
        snapshot=await fetchActivitySnapshot({fetchImpl,token,now,signal:AbortSignal.timeout(timeoutMs)});
        lastSuccessful=snapshot;
      } catch(error) {
        onError(error);
        if(json) throw error;
        snapshot=lastSuccessful??validateActivitySnapshot(await loadFallback());
        stale=true;
      }
      const body=json?JSON.stringify(snapshot):renderActivity(snapshot,params.get('theme')??'dark',{
        sportsMarkup:await loadSportsTemplate(),stale,
      });
      return new Response(request.method==='HEAD'?null:body,{headers:{
        ...HEADERS,
        'Content-Type':json?'application/json; charset=utf-8':'image/svg+xml; charset=utf-8',
        'X-Activity-Fetched-At':snapshot.fetchedAt,
        'X-Activity-Stale':String(stale),
      }});
    } catch {
      // Health checks stay strict; an unavailable or invalid fallback must
      // never masquerade as a current count of zero.
      return errorResponse(503,'GITHUB_UNAVAILABLE','GitHub activity is temporarily unavailable.');
    }
  };
}

const handler=createActivityHandler({
  token:process.env.PROFILE_GITHUB_TOKEN,
  onError:error=>console.warn('Activity upstream unavailable',JSON.stringify({
    reason:error.name,status:error.message?.match(/HTTP (\d{3})/)?.[1],
  })),
});
export default { fetch: handler };
