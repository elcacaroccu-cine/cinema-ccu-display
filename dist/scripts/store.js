import { validateScreenings } from './screenings.js';
import {uuid} from './id.js';
import {seed} from './seed.js';
import {config} from '../config/settings.js';
import {allowed,roles} from './util.js';
export const cloud=config.mode==='cloud', tables=['movies','candy','upcoming'];
const key='cinema-ccu-v1', usersKey=key+'-users';
let session=null,token='',cloudProfile=null;
const load=(k,fallback)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback));
const save=(k,v)=>{
  try { localStorage.setItem(k,JSON.stringify(v)); }
  catch(error) {
    if (error.name === 'QuotaExceededError') throw Error('El almacenamiento de este navegador está lleno. No se guardaron los cambios. Reduce el tamaño de los pósters o exporta un respaldo y retira registros antiguos.');
    throw error;
  }
};
function local(){let db=load(key,null);if(!db){db=seed();save(key,db)}return db}
export const accounts=()=>load(usersKey,[]);
export const me=()=>cloud?cloudProfile:accounts().find(u=>u.id===session&&u.active);
export function logout(){session=null;token='';cloudProfile=null}
const required=k=>{if(!allowed(me()?.role,k))throw Error('Se requiere un rol autorizado.')};
async function api(path,method='GET',body){const r=await fetch(config.url.replace(/\/$/,'')+path,{method,headers:{apikey:config.key,Authorization:'Bearer '+(token||config.key),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok){if(r.status===401)logout();throw Error('Supabase rechazó la operación ('+r.status+'). Revisa la sesión y los permisos.')}const s=await r.text();return s?JSON.parse(s):null}
export async function data(){if(!cloud)return local();const rows=await Promise.all(tables.map(t=>api('/rest/v1/'+t+'?select=id,payload')));return Object.fromEntries(tables.map((t,i)=>[t,rows[i].map(r=>({...r.payload,id:r.id}))]))}
export async function write(t,row,remove=false){required(t);if(!tables.includes(t))throw Error('Sección incorrecta');if(t==='movies'&&!remove&&row.screenings)validateScreenings(row.screenings);if(cloud){const id=row.id||uuid();return api('/rest/v1/'+t+(row.id?'?id=eq.'+id:''),remove?'DELETE':row.id?'PATCH':'POST',remove?undefined:{id,payload:{...row,id}})}const db=local(),i=db[t].findIndex(x=>x.id===row.id);if(row.id&&i<0)throw Error('El registro ya no existe.');if(remove)db[t].splice(i,1);else if(i>=0)db[t][i]=row;else db[t].push({...row,id:uuid()});save(key,db)}
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
async function hash(pin,salt){if(!crypto.subtle)throw Error("Para administrar abre el sitio por HTTPS o localhost.");const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:120000,hash:'SHA-256'},k,256))}
async function secret(pin){if(!/^\d{6,12}$/.test(pin))throw Error('Usa un PIN de 6 a 12 dígitos.');const salt=uuid();return {salt,hash:await hash(pin,salt)}}
export async function init(name,pin){if(cloud||accounts().length)throw Error('La cuenta inicial ya existe.');name=name.trim();if(!name)throw Error('Indica un usuario.');const u={id:uuid(),name,active:true,role:roles[0],...await secret(pin)};if(accounts().length)throw Error('Ya existe un administrador.');save(usersKey,[u]);session=u.id}
export async function login(name,pin){logout();if(cloud){const auth=await api('/auth/v1/token?grant_type=password','POST',{email:name,password:pin});token=auth.access_token;const [p]=await api('/rest/v1/profiles?id=eq.'+auth.user.id+'&select=*');if(!p?.active){logout();throw Error('Perfil sin acceso.')}cloudProfile={...p,name};return}const u=accounts().find(x=>x.active&&x.name.toLowerCase()===name.trim().toLowerCase());if(!u||await hash(pin,u.salt)!==u.hash)throw Error('Usuario o PIN incorrecto.');session=u.id}
export async function pinChange(old,next){const u=me();if(!u)throw Error('Inicia sesión.');if(cloud){await login(u.name,old);return api('/auth/v1/user','PUT',{password:next})}if(await hash(old,u.salt)!==u.hash)throw Error('PIN actual incorrecto.');const s=await secret(next);save(usersKey,accounts().map(x=>x.id===u.id?{...x,...s}:x))}
export async function userWrite(rows,remove=false){required('users');if(cloud)throw Error('Gestiona las identidades en Supabase Auth.');const list=accounts();for(const r of rows){const i=list.findIndex(u=>u.id===r.id),old=list[i];if(remove){if(!old)throw Error('Usuario inexistente');list.splice(i,1);continue}const name=r.name.trim();if(!name||!roles.includes(r.role)||list.some(u=>u.id!==r.id&&u.name.toLowerCase()===name.toLowerCase()))throw Error('Nombre duplicado, vacío o rol inválido.');list[i<0?list.length:i]={...old,id:r.id||uuid(),name,role:r.role,active:r.active,...(r.pin||!old?await secret(r.pin):{})}}if(!list.some(u=>u.active&&u.role===roles[0]))throw Error('Conserva un administrador activo.');save(usersKey,list)}
export function restore(db){required('backup');if(cloud)throw Error('Restaura en Supabase.');for(const t of tables){if(!Array.isArray(db[t])||db[t].some(x=>!x||typeof x.title!=='string'||!x.title||typeof x.id!=='string'||(t!=='candy'&&!/^\d{4}-\d{2}-\d{2}$/.test(x.date))||(t==='movies'&&typeof x.time!=='string'))||new Set(db[t].map(x=>x.id)).size!==db[t].length)throw Error('Respaldo inválido: '+t)}for(const movie of db.movies)if(movie.screenings)validateScreenings(movie.screenings);save(key,Object.fromEntries(tables.map(t=>[t,db[t]])))}
