const roles=['Administrador','Programación','Dulcería','Consulta'];
const tables=['movies','candy','upcoming'];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function validate(db){
 if(!db||!tables.every(t=>Array.isArray(db[t])))throw Error('Contenido inválido.');
 for(const t of tables)for(const r of db[t]){
  if(!r.id||!r.title||typeof r.title!=='string')throw Error('Cada ficha necesita título e identificador.');
  if(t==='movies'){
   const fs=r.screenings||[{date:r.date,time:r.time,room:r.room}];
   if(fs.length<1||fs.length>5||fs.some(f=>!/^\d{4}-\d{2}-\d{2}$/.test(f.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)||!String(f.room||'').trim()))throw Error('Revisa las funciones (1 a 5), fecha, horario y sala.');
  }
 }
}
export function can(role,table){return role==='Administrador'||role==='Programación'&&['movies','upcoming'].includes(table)||role==='Dulcería'&&table==='candy'}
export async function identity(req,env){
 const email=(req.headers.get('oai-authenticated-user-email')||'').trim().toLowerCase();
 if(!req.headers.get('oai-authenticated-user-id')||!email)return null;
 if(email===env.OWNER_EMAIL?.toLowerCase())return {id:email,name:email,role:'Administrador',active:true,owner:true};
 const m=await env.DB.prepare('SELECT email,role,active FROM members WHERE email=?').bind(email).first();
 return m?.active?{id:email,name:email,role:m.role,active:true}:null;
}
export async function api(req,env,seed){
 const path=new URL(req.url).pathname;
 try{
  if(path==='/api/state'&&req.method==='GET'){
   const row=await env.DB.prepare('SELECT payload,revision FROM catalog WHERE id=1').first();
   return json({data:row?JSON.parse(row.payload):seed,revision:row?.revision||0});
  }
  const user=await identity(req,env);
  if(path==='/api/me'&&req.method==='GET'){
   const members=user?.role==='Administrador'?(await env.DB.prepare('SELECT email,role,active FROM members').all()).results.map(m=>({id:m.email,name:m.email,role:m.role,active:!!m.active})):[];
   return json({user,members});
  }
  if(!user)return json({error:'Inicia sesión con una cuenta autorizada.'},403);
  if(req.method!=='POST')return json({error:'Método no permitido.'},405);
  if(req.headers.get('Origin')!==new URL(req.url).origin)return json({error:'Origen no autorizado.'},403);
  if(!req.headers.get('Content-Type')?.includes('application/json'))return json({error:'Formato no permitido.'},415);
  const text=await req.text();if(text.length>12000000)return json({error:'El contenido excede 12 MB.'},413);
  const b=JSON.parse(text);
  if(path==='/api/members'){
   if(user.role!=='Administrador')return json({error:'Solo administradores.'},403);
   const email=String(b.name||b.id||'').trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email===env.OWNER_EMAIL?.toLowerCase())throw Error('Indica un correo válido distinto de la cuenta propietaria.');
   if(b.id&&b.name&&b.id.toLowerCase()!==email)throw Error('Para cambiar un correo, elimina el acceso anterior y agrega el nuevo.');
   if(!b.remove&&!roles.includes(b.role))throw Error('Rol inválido.');
   if(b.remove)await env.DB.prepare('DELETE FROM members WHERE email=?').bind(email).run();
   else await env.DB.prepare('INSERT INTO members(email,role,active) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role,active=excluded.active').bind(email,b.role,b.active?1:0).run();
   return json({ok:true});
  }
  if(path!=='/api/record')return json({error:'Ruta no encontrada.'},404);
  if(!tables.includes(b.table)||!can(user.role,b.table))return json({error:'No tienes permiso para esta sección.'},403);
  const old=await env.DB.prepare('SELECT payload,revision FROM catalog WHERE id=1').first();
  const revision=old?.revision||0;
  if(b.revision!==revision)return json({error:'Otra persona actualizó la cartelera. Cierra y vuelve a abrir Administrar antes de guardar.'},409);
  const db=old?JSON.parse(old.payload):structuredClone(seed),list=db[b.table];
  const row=b.row;
  if(!row||typeof row!=='object')throw Error('Ficha inválida.');
  const i=list.findIndex(r=>r.id===row.id);
  if(row.id&&i<0)throw Error('La ficha ya no existe.');
  if(b.remove){if(i<0)throw Error('Ficha inexistente.');list.splice(i,1)}
  else if(i>=0)list[i]=row;else list.push({...row,id:crypto.randomUUID()});
  validate(db);
  const result=old?await env.DB.prepare('UPDATE catalog SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(db),revision).run():await env.DB.prepare('INSERT OR IGNORE INTO catalog(id,payload,revision) VALUES(1,?,1)').bind(JSON.stringify(db)).run();
  if(result.meta.changes!==1)return json({error:'Otra persona guardó primero. Actualiza antes de volver a guardar.'},409);
  return json({ok:true,revision:revision+1});
 }catch(e){return json({error:e.message||'No se pudo guardar.'},400)}
}
