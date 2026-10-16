import { fetchActivitySnapshot, renderActivity } from '../scripts/update-activity.mjs';

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

export function createActivityHandler({fetchImpl=fetch,token,now=()=>new Date()}={}) {
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
      // Fetch on every request. Only the immutable sports CSS is memoized by
      // the renderer; contribution counts and calendar data are never cached.
      const snapshot=await fetchActivitySnapshot({fetchImpl,token,now});
      const json=params.get('format')==='json';
      const body=json?JSON.stringify(snapshot):renderActivity(snapshot,params.get('theme')??'dark');
      return new Response(request.method==='HEAD'?null:body,{headers:{
        ...HEADERS,
        'Content-Type':json?'application/json; charset=utf-8':'image/svg+xml; charset=utf-8',
        'X-Activity-Fetched-At':snapshot.fetchedAt,
      }});
    } catch {
      // A failed fetch must never masquerade as a current count of zero or
      // silently display the repository's old activity.json snapshot.
      return errorResponse(503,'GITHUB_UNAVAILABLE','GitHub activity is temporarily unavailable.');
    }
  };
}

const handler=createActivityHandler({token:process.env.PROFILE_GITHUB_TOKEN});
export default { fetch: handler };
