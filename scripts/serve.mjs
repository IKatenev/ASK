import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain'};
const port = Number(process.env.PORT || 18745);
createServer(async(req,res)=>{
 try {
  const url = new URL(req.url,'http://localhost');
  if (!url.pathname.startsWith('/ASK/')) {res.writeHead(404).end();return;}
  const name = decodeURIComponent(url.pathname.slice(5)) || 'index.html';
  const path = resolve(root,name);
  if (path!==root && !path.startsWith(root+sep)) {res.writeHead(403).end();return;}
  const info=await stat(path);
  if(!info.isFile())throw Error('not file');
  const body=await readFile(path);
  res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');
  res.setHeader('Accept-Ranges','bytes');
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]);const end=range[2]?Math.min(Number(range[2]),body.length-1):body.length-1;if(start>end){res.writeHead(416).end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});res.end(body.subarray(start,end+1));}
  else{res.writeHead(200,{'Content-Length':body.length});res.end(body);}
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Static preview: http://127.0.0.1:${port}/ASK/`));
