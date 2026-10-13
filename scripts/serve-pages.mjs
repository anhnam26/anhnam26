import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve,sep,extname } from 'node:path';

if(process.argv.includes('--help')){console.log('node scripts/serve-pages.mjs [--port 5173] [--root directory]');process.exit(0);}
const arg=name=>process.argv[process.argv.indexOf(name)+1];
const root=resolve(process.argv.includes('--root')?arg('--root'):fileURLToPath(new URL('../',import.meta.url)));
const port=Number(process.argv.includes('--port')?arg('--port'):5173);
if(!Number.isSafeInteger(port)||port<1||port>65535)throw new Error('Invalid port');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const relative=pathname==='/'?'index.html':pathname.slice(1);
    if(!/^(?:index\.html|src\/|public\/|assets\/)/.test(relative)||relative.split(/[\\/]/).some(p=>p==='..'||p.startsWith('.'))){res.writeHead(404).end();return;}
    const file=resolve(root,relative);
    if(!file.startsWith(root+sep)||(await stat(file)).isDirectory()){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`K1 preview: http://127.0.0.1:${port}`));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
