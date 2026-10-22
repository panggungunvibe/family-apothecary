const ASSETS=__ASSET_MAP__;

function decodeBase64(value){
 const raw=atob(value),bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return bytes;
}
function serveAsset(path,method){
 const key=path==='/'?'/index.html':path;
 const asset=ASSETS[key];
 if(!asset)return new Response('Not found',{status:404});
 const headers={
  'content-type':asset.type,
  'x-content-type-options':'nosniff',
  'cache-control':key==='/index.html'?'no-cache':'public, max-age=86400'
 };
 return new Response(method==='HEAD'?null:decodeBase64(asset.body),{headers});
}

export default{
 async fetch(request){
  const url=new URL(request.url);
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  return serveAsset(url.pathname,request.method);
 }
};
