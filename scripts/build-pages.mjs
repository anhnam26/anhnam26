import { cp,mkdir,writeFile,readFile } from 'node:fs/promises';
import { resolve,relative,sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const destination=resolve(root,'.pages-build');
if(relative(root,destination).startsWith('..'+sep)||destination===resolve(root))throw new Error('Invalid build destination');
await mkdir(destination,{recursive:true});
// The generated folder ignores itself; the owner's existing .gitignore is untouched.
await writeFile(resolve(destination,'.gitignore'),'*\n');
for(const file of ['index.html','src','public'])await cp(resolve(root,file),resolve(destination,file),{recursive:true});
const html=await readFile(resolve(destination,'index.html'),'utf8');
if(!html.includes('src/main.js'))throw new Error('Missing application entry point');
await writeFile(resolve(destination,'.nojekyll'),'');
console.log(`Built GitHub Pages app: ${destination}`);
