import fs from 'node:fs';
import path from 'node:path';
const assets={};
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['server','.openai'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else assets['/'+p.slice(5)]={b:fs.readFileSync(p).toString('base64'),type:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(p)]||'application/octet-stream'}}}
walk('dist');
const seed=fs.readFileSync('dist/data/cartelera.json','utf8');
const api=fs.readFileSync('worker/api.js','utf8').replaceAll('export ','');
const code=api+'\nconst assets='+JSON.stringify(assets)+';\nconst seed='+seed+';\n'+`
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(url.pathname.startsWith('/api/')){
  if(req.method==='OPTIONS')return new Response(null,{headers:{'Access-Control-Allow-Origin':'https://elcacaroccu-cine.github.io','Access-Control-Allow-Methods':'GET, OPTIONS'}});
  const response=await api(req,env,seed);
  if(req.method==='GET'&&url.pathname==='/api/state')response.headers.set('Access-Control-Allow-Origin','*');
  return response;
 }
 const item=assets[url.pathname==='/'?'/index.html':url.pathname];
 if(!item)return new Response('No encontrado',{status:404});
 return new Response(Uint8Array.from(atob(item.b),c=>c.charCodeAt(0)),{headers:{'Content-Type':item.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
}};
`;
fs.mkdirSync('dist/server',{recursive:true});fs.writeFileSync('dist/server/index.js',code);
