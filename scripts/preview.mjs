import http from 'node:http';
import worker from '../dist/server/index.js';

const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const url=`http://127.0.0.1:${port}${req.url||'/'}`;
 const init={method:req.method,headers:req.headers};
 if(!['GET','HEAD'].includes(req.method||'GET'))init.body=Buffer.concat(chunks);
 try{
  const response=await worker.fetch(new Request(url,init),process.env,{});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500,{'content-type':'text/plain'});res.end(String(error?.stack||error))}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
