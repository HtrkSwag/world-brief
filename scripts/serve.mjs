import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname.startsWith('/nested/'))pathname=pathname.slice('/nested'.length);
 if(pathname.endsWith('/'))pathname+='index.html';
 const target=path.resolve(root,'.'+pathname),relative=path.relative(root,target);
 if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403).end();return;}
 const data=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
 }catch{res.writeHead(404).end('Not found');}});
server.listen(8080,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8080 (Ctrl+C to stop)'));
