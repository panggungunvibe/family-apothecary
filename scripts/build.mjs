import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const siteRoot=join(root,'site');
const outputRoot=join(root,'dist');
const assets={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};

async function collect(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const full=join(directory,entry.name);
  if(entry.isDirectory())await collect(full);
  else{
   const path='/'+relative(siteRoot,full).split(sep).join('/');
   assets[path]={body:(await readFile(full)).toString('base64'),type:types[extname(full)]||'application/octet-stream'};
  }
 }
}

await rm(outputRoot,{recursive:true,force:true});
await Promise.all([mkdir(join(outputRoot,'server'),{recursive:true}),mkdir(join(outputRoot,'.openai'),{recursive:true})]);
await collect(siteRoot);
const runtime=await readFile(join(root,'worker/runtime.js'),'utf8');
const bundled=runtime.replace('__ASSET_MAP__',JSON.stringify(assets));
await Promise.all([
 writeFile(join(outputRoot,'server/index.js'),bundled),
 writeFile(join(outputRoot,'.openai/hosting.json'),await readFile(join(root,'.openai/hosting.json')))
]);
console.log(`Built Worker with ${Object.keys(assets).length} assets (${(Buffer.byteLength(bundled)/1024/1024).toFixed(2)} MiB)`);
