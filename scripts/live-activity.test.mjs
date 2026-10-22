import assert from 'node:assert/strict';
import test from 'node:test';
import { createActivityHandler } from '../api/activity.mjs';
import { renderActivity } from './update-activity.mjs';

test('the live renderer uses a prebuilt sports scene without regenerating its keyframes',async()=>{
  const upstream=source();
  const response=await createActivityHandler({fetchImpl:upstream.fetchImpl})(new Request('https://profile.example/api/activity?format=json'));
  const snapshot=await response.json();
  const sportsMarkup='<svg id="sports-arena" data-build="precomputed"><g/></svg>';
  const image=renderActivity(snapshot,'dark',{sportsMarkup});
  assert.ok(image.includes(sportsMarkup),'Serve the scene prepared during the build');
  assert.ok(!image.includes('@keyframes'),'The supplied scene must not invoke runtime animation generation');
  assert.match(image,/>1,196<\/text>/,'Activity numbers remain dynamic');
});

function calendarHtml(total) {
  const cells=Array.from({length:365},(_,i)=>{
    const date=new Date(Date.UTC(2025,0,i+1)).toISOString().slice(0,10);
    return `<td data-date="${date}" data-level="${i===0?4:0}" id="d${i}"></td><tool-tip for="d${i}">${i===0?total:'No'} contributions on a date.</tool-tip>`;
  }).join('');
  return `<h2 id="js-contribution-activity-description">${total} contributions in the last year</h2>${cells}`;
}

function source() {
  const state={total:1196,calls:[],failed:false};
  state.fetchImpl=async (url,options)=>{
    state.calls.push({url,options});
    if(state.failed) return new Response('Unavailable',{status:503});
    return url.startsWith('https://api.github.com/')
      ?Response.json([{owner:{login:'anhnam26'},private:false,fork:false,stargazers_count:9}])
      :new Response(calendarHtml(state.total));
  };
  return state;
}

test('each image request fetches new contribution data without reusing a snapshot or conditional response', async()=>{
  const upstream=source();
  const handler=createActivityHandler({fetchImpl:upstream.fetchImpl,token:'test-only-token'});
  const first=await handler(new Request('https://profile.example/api/activity?theme=dark'));
  assert.equal(first.status,200);
  assert.match(await first.text(),/>1,196<\/text>/);
  upstream.total++;
  const second=await handler(new Request('https://profile.example/api/activity?theme=dark',{
    headers:{'If-None-Match':'old-image','If-Modified-Since':'Wed, 14 Oct 2026 00:00:00 GMT'},
  }));
  assert.equal(second.status,200);
  assert.match(await second.text(),/>1,197<\/text>/);
  assert.equal(upstream.calls.length,4,'Both requests must query both live sources');
  for(const response of [first,second]) {
    assert.match(response.headers.get('content-type'),/image\/svg\+xml/);
    for(const header of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control']) {
      assert.match(response.headers.get(header),/no-store/);
    }
    assert.match(response.headers.get('Cache-Control'),/no-cache/);
    assert.equal(response.headers.get('etag'),null);
  }
  for(const call of upstream.calls) {
    assert.equal(call.options.cache,'no-store');
    assert.equal(call.options.headers.Authorization,call.url.startsWith('https://api.github.com/')?'Bearer test-only-token':undefined);
  }
});

test('both themes preserve the sports animation and stay below the hosted response size limit', async()=>{
  const upstream=source(),handler=createActivityHandler({fetchImpl:upstream.fetchImpl});
  for(const theme of ['dark','light']) {
    const response=await handler(new Request(`https://profile.example/api/activity?theme=${theme}`));
    const svg=await response.text();
    assert.equal(response.status,200);
    assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg,/id="sports-arena"/);
    assert.match(svg,/sports-winner-blue-visible/);
    assert.ok(Buffer.byteLength(svg)<4_500_000,'Vercel response limit is 4.5 MB');
    assert.ok(!svg.includes('test-only-token'));
  }
});

test('an upstream failure returns an uncached error instead of an old or invented count', async()=>{
  const upstream=source(),handler=createActivityHandler({fetchImpl:upstream.fetchImpl});
  await handler(new Request('https://profile.example/api/activity'));
  upstream.failed=true;
  const response=await handler(new Request('https://profile.example/api/activity?format=json'));
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:{code:'GITHUB_UNAVAILABLE',message:'GitHub activity is temporarily unavailable.'}});
  assert.match(response.headers.get('Cache-Control'),/no-store/);
});

test('a transient GitHub failure keeps the profile image visible and the next reload recovers live data',async()=>{
  const upstream=source(),handler=createActivityHandler({fetchImpl:upstream.fetchImpl});
  const url='https://profile.example/api/activity?theme=dark';
  assert.equal((await handler(new Request(url))).status,200);
  upstream.failed=true;
  const fallback=await handler(new Request(url));
  assert.equal(fallback.status,200,'A GitHub outage must not turn the profile image into a broken link');
  assert.match(fallback.headers.get('Content-Type'),/image\/svg\+xml/);
  assert.equal(fallback.headers.get('X-Activity-Stale'),'true');
  const saved=await fallback.text();
  assert.match(saved,/>1,196<\/text>/);
  assert.match(saved,/Saved data/,'Visitors must know that this is the last successful snapshot');
  upstream.failed=false;upstream.total=1197;
  const recovered=await handler(new Request(url));
  assert.equal(recovered.headers.get('X-Activity-Stale'),'false');
  const fresh=await recovered.text();
  assert.match(fresh,/>1,197<\/text>/);
  assert.ok(!fresh.includes('Saved data'),'Normal reloads must immediately use live data again');
});

test('a cold instance can serve a validated published snapshot when GitHub is unavailable',async()=>{
  const upstream=source();
  const snapshot=await (await createActivityHandler({fetchImpl:upstream.fetchImpl})(new Request('https://profile.example/api/activity?format=json'))).json();
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,options});
    return url.startsWith('https://raw.githubusercontent.com/')?Response.json(snapshot):new Response('Rate limited',{status:403});
  };
  const handler=createActivityHandler({fetchImpl,token:'test-only-token'});
  const response=await handler(new Request('https://profile.example/api/activity?theme=light'));
  assert.equal(response.status,200,'The first visit must still receive an image during an outage');
  assert.equal(response.headers.get('X-Activity-Stale'),'true');
  const svg=await response.text();
  assert.match(svg,/>1,196<\/text>/);
  assert.match(svg,/Saved data/);
  assert.match(svg,/id="sports-arena"/);
  assert.equal(calls.find(c=>c.url.startsWith('https://raw.githubusercontent.com/')).options.headers.Authorization,undefined,'Public snapshots never receive the API token');
});

test('invalid saved data cannot turn a failed refresh into an invented contribution count',async()=>{
  const upstream=source();
  const snapshot=await (await createActivityHandler({fetchImpl:upstream.fetchImpl})(new Request('https://profile.example/api/activity?format=json'))).json();
  upstream.failed=true;
  for(const patch of [
    {username:'someone-else'}, {fetchedAt:'invalid'},
    {calendar:{...snapshot.calendar,total:1197}},
    {calendar:{...snapshot.calendar,days:snapshot.calendar.days.slice(1)}},
  ]) {
    const handler=createActivityHandler({fetchImpl:upstream.fetchImpl,loadFallback:async()=>({...snapshot,...patch})});
    const response=await handler(new Request('https://profile.example/api/activity?theme=dark'));
    assert.equal(response.status,503,'Invalid data must fail instead of being presented as a real snapshot');
  }
});

test('slow upstream requests are aborted before the proxy deadline so a saved image can load',async()=>{
  const upstream=source();
  const snapshot=await (await createActivityHandler({fetchImpl:upstream.fetchImpl})(new Request('https://profile.example/api/activity?format=json'))).json();
  let aborted=0;
  const slow=async(url,{signal})=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Upstream stalled')),1000);
    signal.addEventListener('abort',()=>{aborted++;clearTimeout(timer);reject(signal.reason);},{once:true});
  });
  const handler=createActivityHandler({fetchImpl:slow,timeoutMs:30,loadFallback:async()=>snapshot});
  const start=performance.now();
  const response=await handler(new Request('https://profile.example/api/activity?theme=dark'));
  assert.ok(performance.now()-start<500,'Do not make the image proxy wait for a stalled GitHub request');
  assert.equal(response.status,200);
  assert.equal(response.headers.get('X-Activity-Stale'),'true');
  assert.equal(aborted,2,'Cancel both calendar and repository fetches when their shared deadline expires');
});

test('invalid themes, query parameters and methods do not call GitHub', async()=>{
  const upstream=source(),handler=createActivityHandler({fetchImpl:upstream.fetchImpl});
  for(const query of ['theme=unknown','username=someone-else','format=xml','theme=dark&theme=light']) {
    const response=await handler(new Request('https://profile.example/api/activity?'+query));
    assert.equal(response.status,400);
  }
  assert.equal((await handler(new Request('https://profile.example/api/activity',{method:'POST'}))).status,405);
  assert.equal((await handler(new Request('https://profile.example/unknown'))).status,404);
  assert.equal(upstream.calls.length,0);
});

test('the health response identifies the account and reports the freshly fetched snapshot', async()=>{
  const upstream=source(),handler=createActivityHandler({fetchImpl:upstream.fetchImpl});
  const response=await handler(new Request('https://profile.example/api/activity?format=json'));
  const snapshot=await response.json();
  assert.equal(response.headers.get('X-Activity-Service'),'anhnam26-live-v1');
  assert.equal(snapshot.username,'anhnam26');
  assert.equal(snapshot.calendar.total,1196);
  assert.equal(snapshot.stars,9);
});
