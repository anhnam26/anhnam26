import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {connectActivity} from './connect-activity.mjs';

const profile='<source srcset="assets/activity-dark.svg?v=old"><source srcset="assets/activity-light.svg?v=old"><img src="assets/activity-dark.svg?v=old" alt="Sports">\n## Delta Force\nOriginal video\nCredit: neongi_yt on TikTok\n';
const checkedAt=new Date('2026-10-17T00:00:00Z');
const snapshot={username:'anhnam26',fetchedAt:checkedAt.toISOString(),calendar:{total:1196}};
function endpoint({cache=true,html=false,stale=false}={}) {
  return async url=>{
    const headers={'X-Activity-Service':'anhnam26-live-v1','Cache-Control':cache?'no-cache, no-store, max-age=0':'public, max-age=3600'};
    if(String(url).includes('format=json')) return Response.json({...snapshot,...(stale?{fetchedAt:'2026-10-16T00:00:00Z'}:{})},{headers});
    return new Response(html?'<html>Login required</html>':'<svg xmlns="http://www.w3.org/2000/svg"><g id="sports-arena"/></svg>',{
      headers:{...headers,'Content-Type':html?'text/html':'image/svg+xml'},
    });
  };
}
async function fixture(t) {
  const dir=await mkdtemp(join(tmpdir(),'profile-live-connect-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const readme=pathToFileURL(join(dir,'README.md'));
  await writeFile(readme,profile);
  return readme;
}

test('activate only a verified service and preserve all unrelated profile content',async t=>{
  const readme=await fixture(t);
  const options={readme,fetchImpl:endpoint(),now:()=>checkedAt};
  const result=await connectActivity('https://profile-live.example/',options);
  const actual=await readFile(readme,'utf8');
  assert.equal(result.contributions,1196);
  assert.equal(result.changed,true);
  assert.equal(actual,profile.replace(/assets\/activity-(dark|light)\.svg\?v=old/g,'https://profile-live.example/api/activity?theme=$1'));
  assert.equal((await connectActivity('https://profile-live.example',options)).changed,false,'Activation must be idempotent');
});

test('cached, stale or login-protected services cannot replace working profile images',async t=>{
  const readme=await fixture(t);
  for(const overrides of [{cache:false},{html:true},{stale:true}]) {
    await assert.rejects(connectActivity('https://profile-live.example',{readme,fetchImpl:endpoint(overrides),now:()=>checkedAt}));
    assert.equal(await readFile(readme,'utf8'),profile);
  }
});

test('a failed preflight leaves the profile untouched',async t=>{
  const readme=await fixture(t);
  await assert.rejects(connectActivity('https://profile-live.example',{readme,fetchImpl:async()=>new Response('Down',{status:503})}));
  assert.equal(await readFile(readme,'utf8'),profile);
});

test('credentials, extra paths and non-HTTPS URLs are rejected before requests',async t=>{
  const readme=await fixture(t);
  for(const origin of ['http://profile-live.example','https://name:secret@profile-live.example','https://profile-live.example/another/path','https://profile-live.example?token=secret']) {
    await assert.rejects(connectActivity(origin,{readme,fetchImpl:()=>assert.fail('Invalid URLs must not be requested')}));
  }
  assert.equal(await readFile(readme,'utf8'),profile);
});
