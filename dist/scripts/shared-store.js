export const cloud=false,shared=true,tables=['movies','candy','upcoming'];
export const base='https://cinema-ccu-display.diosdelcine.chatgpt.site';
let user=null,members=[],revision=0;
const localOrigin=()=>location.origin===base;
async function api(path,body){
 const response=await fetch(base+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo conectar con la cartelera.');return result;
}
export const me=()=>user;
export const accounts=()=>members;
export function logout(){}
export async function data(){
 const state=await api('/api/state');revision=state.revision;
 if(localOrigin()){const identity=await api('/api/me');user=identity.user;members=identity.members;}
 return state.data;
}
export async function write(table,row,remove=false){const r=await api('/api/record',{table,row,remove,revision});revision=r.revision;}
export async function userWrite(rows,remove=false){if(rows.length!==1)throw Error('Agrega un correo a la vez.');await api('/api/members',{...rows[0],remove});await data();}
export function init(){throw Error('Usa Iniciar sesión con ChatGPT.')}
export function login(){location.href='/signin-with-chatgpt?return_to=%2F%3Fadmin%3D1'}
export function pinChange(){throw Error('Tu acceso se administra en tu cuenta de ChatGPT.')}
export function restore(){throw Error('La importación masiva no está habilitada. Tus 17 películas ya están cargadas.')}
