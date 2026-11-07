import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/scripts/store.js';
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
const pin='483725';
test.beforeEach(async()=>{memory.clear();S.logout();await S.init('Cabina',pin)});
const add=(name='Operador',role='Programación')=>S.userWrite([{name,role,pin,active:true}]);
test('Reject blank names, invalid roles and invalid PINs without partial users',async()=>{
 for(const row of [{name:' ',role:'Consulta',pin},{name:'X',role:'Inventado',pin},...['12','abcdef','1234567890123',''].map(pin=>({name:'X',role:'Consulta',pin}))]){
  await assert.rejects(S.userWrite([{...row,active:true}]));assert.equal(S.accounts().length,1);
 }
});
test('Duplicate names ignore case and surrounding spaces, batch failure is atomic',async()=>{
 await add();await assert.rejects(S.userWrite([{name:'Nuevo',role:'Consulta',pin,active:true},{name:' operador ',role:'Consulta',pin,active:true}]));
 assert.equal(S.accounts().length,2);
});
test('Stored credentials are salted hashes; editing without PIN retains access',async()=>{
 await add();const [admin,user]=S.accounts();assert.notEqual(admin.salt,user.salt);assert.notEqual(admin.hash,user.hash);
 assert.equal(JSON.stringify(S.accounts()).includes(pin),false);
 await S.userWrite([{...user,name:'Renombrado',pin:''}]);await S.login(' renombrado ',pin);assert.equal(S.me().name,'Renombrado');
});
test('Wrong PIN, unknown user, inactive and deleted users cannot log in',async()=>{
 await add();await assert.rejects(S.login('Operador','111111'));assert.equal(S.me(),undefined);
 await assert.rejects(S.login('Nadie',pin));await S.login('Cabina',pin);const user=S.accounts()[1];
 await S.userWrite([{...user,active:false}]);await assert.rejects(S.login('Operador',pin));
 await S.login('Cabina',pin);await S.userWrite([{id:user.id}],true);await assert.rejects(S.login('Operador',pin));
});
test('Last active administrator cannot be removed, disabled or demoted',async()=>{
 const admin=S.me();for(const row of [{...admin,active:false},{...admin,role:'Consulta'}])await assert.rejects(S.userWrite([row]));
 await assert.rejects(S.userWrite([{id:admin.id}],true));assert.equal(S.accounts().length,1);
});
test('Second administrator permits removing the first; self-removal ends privileges',async()=>{
 const first=S.me();await add('Segundo','Administrador');await S.userWrite([{id:first.id}],true);
 assert.equal(S.me(),undefined);await assert.rejects(add());await S.login('Segundo',pin);assert.equal(S.me().role,'Administrador');
});
test('Logout and reload retain users but not an authenticated session',async()=>{
 await add();S.logout();assert.equal(S.accounts().length,2);await assert.rejects(add('Otro'));
 const reloaded=await import('../dist/scripts/store.js?reload='+Date.now());assert.equal(reloaded.me(),undefined);await reloaded.login('Cabina',pin);assert.equal(reloaded.me().name,'Cabina');
});
test('Invalid PIN change preserves original credential',async()=>{
 await assert.rejects(S.pinChange('111111','987654'));await assert.rejects(S.pinChange(pin,'abc'));await S.login('Cabina',pin);
 await S.pinChange(pin,'987654');await assert.rejects(S.login('Cabina',pin));await S.login('Cabina','987654');
});
test('Unknown edit IDs never create users',async()=>{await assert.rejects(S.userWrite([{id:'missing',name:'Intruso',role:'Consulta',pin,active:true}]));assert.equal(S.accounts().length,1)});
test('Concurrent account additions never silently overwrite another addition',async()=>{
 const results=await Promise.allSettled([add('Uno'),add('Dos')]);
 assert.equal(S.accounts().length,1+results.filter(r=>r.status==='fulfilled').length);
});
test('Storage failure preserves all prior users',async()=>{
 const before=S.accounts(),save=localStorage.setItem;localStorage.setItem=()=>{throw Object.assign(new Error(),{name:'QuotaExceededError'})};
 await assert.rejects(add());localStorage.setItem=save;assert.deepEqual(S.accounts(),before);
});
test('Every non-admin role and anonymous session is denied user management and restore',async()=>{
 const db=await S.data();for(const role of ['Programación','Dulcería','Consulta']){
  await S.login('Cabina',pin);await add(role,role);await S.login(role,pin);await assert.rejects(add('Prohibido'));assert.throws(()=>S.restore(db));
 }
 S.logout();await assert.rejects(S.write('movies',{title:'No'}));assert.throws(()=>S.restore(db));
});
