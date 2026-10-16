import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import activity from '../api/activity.mjs';

export function createActivityServer(handler=activity.fetch) {
  return createServer(async (req,res)=>{
    try {
      const request=new Request(new URL(req.url,'http://127.0.0.1'),{method:req.method,headers:req.headers});
      const response=await handler(request);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500,{'Content-Type':'text/plain','Cache-Control':'no-store'});
      res.end('Activity service unavailable.');
    }
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const portIndex=process.argv.indexOf('--port');
  const port=portIndex<0?5175:Number(process.argv[portIndex+1]);
  if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Use --port followed by a valid port number.');
  const server=createActivityServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Live activity: http://127.0.0.1:${port}/api/activity?theme=dark`));
  for(const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close());
}
