import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../worker/api.js';
const origin='https://cinema-ccu-display.diosdelcine.chatgpt.site';
const seed=JSON.parse(readFileSync(new URL('../dist/data/cartelera.json',import.meta.url)));
function environment(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_shared.sql',import.meta.url),'utf8'));return {OWNER_EMAIL:'owner@example.com',DB:{prepare(query){let values=[];return {bind(...args){values=args;return this},async first(){return sql.prepare(query).get(...values)||null},async all(){return {results:sql.prepare(query).all(...values)}},async run(){return {meta:{changes:Number(sql.prepare(query).run(...values).changes)}}}}}}}
}
function request(path,body,email,site=origin){return new Request(origin+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:site}:{}),...(email?{'oai-authenticated-user-id':'identity-'+email,'oai-authenticated-user-email':email}:{})},body:body?JSON.stringify(body):undefined})}
test('shared catalog: edit from authorized computer is visible to another anonymous screen; stale writes rejected',async()=>{
 const env=environment();
 const before=await (await api(request('/api/state'),env,seed)).json();
 assert.equal(before.data.movies.length,17);
 const changed={...before.data.movies[0],title:'Prueba compartida'};
 assert.equal((await api(request('/api/record',{table:'movies',row:changed,revision:0},'owner@example.com'),env,seed)).status,200);
 const screen=await (await api(request('/api/state'),env,seed)).json();assert.equal(screen.data.movies[0].title,'Prueba compartida');assert.equal(screen.revision,1);
 assert.equal((await api(request('/api/record',{table:'movies',row:changed,revision:0},'owner@example.com'),env,seed)).status,409);
 assert.equal((await api(request('/api/state'),env,seed)).status,200);
});
test('server protects writes, roles, origin, members and revocation',async()=>{
 const env=environment(),body={table:'movies',row:seed.movies[0],revision:0};
 assert.equal((await api(request('/api/record',body),env,seed)).status,403);
 assert.equal((await api(request('/api/record',body,'stranger@example.com'),env,seed)).status,403);
 assert.equal((await api(request('/api/record',body,'owner@example.com','https://evil.example'),env,seed)).status,403);
 assert.equal((await api(request('/api/members',{name:'support@example.com',role:'Programación',active:true},'owner@example.com'),env,seed)).status,200);
 assert.equal((await api(request('/api/record',{...body,table:'candy',row:seed.candy[0]},'support@example.com'),env,seed)).status,403);
 assert.equal((await api(request('/api/members',{name:'other@example.com',role:'Administrador',active:true},'support@example.com'),env,seed)).status,403);
 assert.equal((await api(request('/api/record',body,'support@example.com'),env,seed)).status,200);
 await api(request('/api/members',{id:'support@example.com',remove:true},'owner@example.com'),env,seed);
 assert.equal((await api(request('/api/record',{...body,revision:1},'support@example.com'),env,seed)).status,403);
 assert.equal((await api(request('/api/members',{id:'owner@example.com',remove:true},'owner@example.com'),env,seed)).status,400);
 const publicState=await (await api(request('/api/state'),env,seed)).json();assert.equal(JSON.stringify(publicState).includes('owner@example.com'),false);
});
