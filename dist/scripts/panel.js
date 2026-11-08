import * as S from './store.js';
import { scheduleFields, resizeSchedule, readSchedule, posterFields } from './movie-form.js';
import { screeningsFor, validateScreenings } from './screenings.js';
import { preparePoster, validatePosterFile } from './poster.js';
import {esc as e,allowed,roles} from './util.js';
const sections={movies:'Cartelera',candy:'Dulcería',upcoming:'Próximos estrenos',users:'Usuarios',settings:'Configuración / TMDB',backup:'Respaldos'};
const labels={date:'Fecha',time:'Hora',room:'Sala',title:'Título / nombre',year:'Año',rating:'Clasificación',price:'Precio MXN',free:'Entrada libre',synopsis:'Sinopsis',awards:'Premios y festivales',tmdb:'TMDB ID',poster:'Imagen / URL de póster',trailer:'URL de trailer',category:'Categoría',description:'Descripción',active:'Activo',label:'Etiqueta',name:'Usuario',pin:'PIN',role:'Rol',old:'PIN actual',next:'PIN nuevo',token:'API Read Access Token',query:'Título de búsqueda'};
const schema={movies:'title year rating price free synopsis awards tmdb trailer',candy:'title category price description poster active',upcoming:'title year date label tmdb trailer active'};
const options={role:roles,label:['PRÓXIMAMENTE','ESTRENO','PREESTRENO']};
function field(k,v='',required=false){const type={date:'date',time:'time',price:'number',year:'number',pin:'password',old:'password',next:'password',token:'password',active:'checkbox',free:'checkbox'}[k]||'text';let el=options[k]?'<select name="'+k+'">'+options[k].map(s=>'<option '+(v===s?'selected':'')+'>'+s+'</option>').join('')+'</select>':['synopsis','awards','description'].includes(k)?'<textarea name="'+k+'">'+e(v)+'</textarea>':'<input name="'+k+'" type="'+type+'" '+(type==='checkbox'?(v?'checked':''):'value="'+e(v)+'"')+' '+(required?'required':'')+' '+(k==='price'?'min="0" step=".01"':'')+'>';return '<label>'+e(labels[k])+el+'</label>'}
export function admin(refresh){const panel=document.querySelector('#panel'),out=document.querySelector('#private'),notice=document.querySelector('#notice');let tab='movies',action='',edit='',db,revision=0;
const message=s=>notice.textContent=s,button=(id,title)=>'<button type="button" data-act="'+id+'">'+title+'</button>', vals=f=>Object.fromEntries(new FormData(f)),show=async(fn)=>{try{message('');await fn()}catch(err){message(err.message)}};
function logout(){S.logout();edit='';action='';tab='movies'}
panel.addEventListener('cancel',event=>{if(panel.inert)event.preventDefault()});
panel.addEventListener('close',()=>{logout();out.replaceChildren();message('')});
function open(){if(!panel.open)panel.showModal();show(render)}
document.querySelector('#admin').onclick=open;document.querySelector('#close').onclick=()=>panel.close();document.addEventListener('keydown',ev=>{if(ev.key==='F2'){ev.preventDefault();open()}});
function loginView(){const first=!S.cloud&&!S.accounts().length;out.innerHTML=(S.cloud?'':'<p><strong>Edición local: los cambios de este panel no se publican en el lobby.</strong> Descarga tu respaldo para publicarlo. La pantalla muestra la última cartelera publicada.</p>')+'<h3>'+(first?'Configurar este navegador':action==='users'?'Acceso de Administrador':action==='pin'?'Identifícate para cambiar tu acceso':'Acceso a la cabina')+'</h3><p>'+(first?'Crea tu usuario administrador y un PIN de 6 a 12 dígitos.':S.cloud?'Usa tu correo y contraseña de Supabase.':'Ingresa tu usuario y PIN local.')+'</p><form id="login"><div class="fields">'+field('name','',true)+field('pin','',true)+'</div><div class="actions"><button>'+(first?'Crear administrador':'Entrar')+'</button></div></form>'+button('usersLogin','+ Gestionar usuarios')+' '+button('pinLogin','Cambiar mi PIN')}
async function render(){const rev=++revision;const u=S.me();if(!u){loginView();return}db=await S.data();if(rev!==revision||!panel.open)return;const available=Object.keys(sections).filter(k=>allowed(u.role,k)||u.role==='Consulta'&&S.tables.includes(k));if(!available.includes(tab))tab=available[0];const tabs=available.map(k=>'<button type="button" data-tab="'+k+'" aria-pressed="'+(tab===k)+'">'+sections[k]+'</button>').join('');out.innerHTML='<div class="actions"><strong>'+e(u.name)+' · '+e(u.role)+'</strong>'+button('pin','Cambiar mi '+(S.cloud?'contraseña':'PIN'))+button('logout','Salir')+'</div><nav class="tabs">'+tabs+'</nav><div id="body"></div>';const body=out.querySelector('#body');if(action==='pin'){body.innerHTML='<form id="change">'+field('old','',true)+field('next','',true)+'<button>Guardar cambio</button></form>';return}
if(S.tables.includes(tab)){const record=db[tab].find(x=>x.id===edit)||{active:true},can=allowed(u.role,tab);body.innerHTML='<h3>'+sections[tab]+'</h3>'+(can?'<form id="entry"><div class="fields">'+schema[tab].split(' ').map(k=>field(k,record[k],['date','time','room','title'].includes(k))).join('')+'</div>'+(tab==='movies'?scheduleFields(record):'')+(tab!=='candy'?posterFields(record.poster):'')+'<div class="actions"><button>'+(edit?'Guardar cambios':'Agregar')+'</button>'+button('cancel','Cancelar edición')+'</div></form>'+(tab!=='candy'?'<details><summary>Buscar película en TMDB</summary><form id="lookup"><div class="fields">'+field('query','',true)+field('year')+'</div><button>Buscar</button></form><div id="results"></div></details>':''):'')+db[tab].map(x=>row(x,tab==='movies'?screeningsFor(x).map(f=>[f.date,f.time,f.room].join(' · ')).join(' / '):[x.date,x.active===false?'Inactivo':''].filter(Boolean).join(' · '),can)).join('');return}
if(tab==='users'){if(S.cloud){body.innerHTML='<p>Administra las altas, bajas y contraseñas en Supabase Authentication. Asigna roles y activa perfiles en la tabla profiles.</p>';return}const x=S.accounts().find(y=>y.id===edit)||{active:true,role:'Consulta'};body.innerHTML='<form id="user"><div class="fields">'+['name','role','pin','active'].map(k=>field(k,x[k],k==='name'||k==='pin'&&!edit)).join('')+'</div><div class="actions"><button>'+(edit?'Guardar usuario':'Agregar usuario')+'</button>'+button('cancel','Cancelar edición')+'</div></form><details><summary>Alta múltiple</summary><form id="bulk"><label>Una línea por persona: usuario | rol | PIN<textarea name="rows" required></textarea></label><p>Roles: '+roles.join(', ')+'</p><button>Crear usuarios</button></form></details>'+S.accounts().map(x=>row(x,x.role+(x.active?'':' · Inactivo'),true)).join('')}
if(tab==='settings')body.innerHTML='<h3>Configuración de TMDB</h3><p>El token se conserva únicamente en esta pestaña. Deja el campo vacío para retirarlo.</p><form id="settings">'+field('token')+'<button>Guardar token</button></form><p>Modo '+(S.cloud?'nube':'local')+'</p>';
if(tab==='backup')body.innerHTML='<h3>Respaldos de contenido</h3><p>Incluye funciones, dulcería y próximos estrenos. Los usuarios y sus accesos se administran por separado.</p>'+button('export','Descargar JSON')+(S.cloud?'':'<form id="import"><label>Restaurar archivo JSON<input type="file" name="file" accept=".json" required></label><button>Restaurar respaldo</button></form>')}
function row(x,meta,can){return '<div class="row"><span><b>'+e(x.title||x.name)+'</b> '+e(meta)+'</span>'+(can?'<button data-edit="'+e(x.id)+'">Editar</button><button data-delete="'+e(x.id)+'">Eliminar</button>':'')+'</div>'}
out.addEventListener('click',ev=>show(async()=>{const b=ev.target.closest('button');if(!b)return;const a=b.dataset.act;if(b.dataset.tab){tab=b.dataset.tab;edit=action='';await render()}if(b.dataset.edit){edit=b.dataset.edit;await render();out.querySelector('form input')?.focus()}if(b.dataset.delete&&confirm('¿Eliminar este registro?')){const id=b.dataset.delete;if(tab==='users')await S.userWrite([{id}],true);else await S.write(tab,{id},true);edit='';await refresh();await render()}if(a==='cancel'){edit='';await render()}if(a==='logout'){logout();await render()}if(a==='usersLogin'||a==='pinLogin'||a==='pin'){action=a==='usersLogin'?'users':'pin';await render()}if(a==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='cinema-ccu-respaldo.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}));
out.addEventListener('change', ev => {
  if (ev.target.name === 'screeningCount') resizeSchedule(ev.target.form);
  if (ev.target.name === 'posterFile') {
    const input = ev.target;
    const file = input.files[0];
    if (!file) return;
    try {
      validatePosterFile(file);
      const preview = input.form.querySelector('.posterPreview');
      const url = URL.createObjectURL(file);
      preview.onload = preview.onerror = () => URL.revokeObjectURL(url);
      preview.src = url;
      message('Póster seleccionado. Guarda la ficha para conservarlo.');
    } catch (error) {
      input.value = '';
      message(error.message);
    }
  }
});
let matches=[];
out.addEventListener('submit',ev=>{ev.preventDefault();const submitted=ev.target;if(submitted.dataset.saving)return;submitted.dataset.saving='true';show(async()=>{const f=submitted,v=vals(f);panel.inert=true;if(f.id==='login'){if(!S.cloud&&!S.accounts().length)await S.init(v.name,v.pin);else await S.login(v.name,v.pin);if(action==='users'){if(S.me().role!=='Administrador'){logout();throw Error('Se requiere un Administrador.')}tab='users';action=''}await render();return}
if(f.id==='entry'){for(const k of ['active','free'])if(f.elements[k])v[k]=f.elements[k].checked;if('price'in v){if(!v.free&&v.price==='')throw Error('Indica el precio.');v.price=v.free?0:Number(v.price)}if (tab === 'movies') {
  v.screenings = readSchedule(f);
  validateScreenings(v.screenings);
  Object.assign(v, v.screenings[0]);
  for (const key of Object.keys(v)) {
    if (key === 'screeningCount' || key.startsWith('screening_')) delete v[key];
  }
}
if (tab !== 'candy') {
  const file = f.elements.posterFile.files[0];
  if (file) v.poster = await preparePoster(file);
  else if (f.elements.removePoster.checked) v.poster = '';
  else v.poster = v.poster.trim() || v.savedPoster;
  delete v.posterFile;
  delete v.savedPoster;
  delete v.removePoster;
}
if(edit)v.id=edit;await S.write(tab,v);edit=''}
else if(f.id==='user'){await S.userWrite([{...v,id:edit||undefined,active:f.elements.active.checked}]);edit=''}
else if(f.id==='bulk'){const rows=v.rows.trim().split(/\r?\n/).map(l=>{const a=l.split('|').map(s=>s.trim());if(a.length!==3)throw Error('Revisa el formato de cada línea.');return {name:a[0],role:a[1],pin:a[2],active:true}});await S.userWrite(rows)}
else if(f.id==='change'){await S.pinChange(v.old,v.next);action=''}
else if(f.id==='settings'){if(v.token)sessionStorage.setItem('ccu-tmdb',v.token.trim());else sessionStorage.removeItem('ccu-tmdb')}
else if(f.id==='import'){if(!confirm('¿Reemplazar todo el contenido local por este respaldo?'))return;S.restore(JSON.parse(await f.elements.file.files[0].text()))}
else if(f.id==='lookup'){const params=new URLSearchParams({query:v.query,language:'es-MX'});if(v.year)params.set('year',v.year);matches=(await tmdb('/search/movie?'+params)).results;const box=out.querySelector('#results');box.replaceChildren();if(!matches.length)box.textContent='Sin coincidencias.';for(const m of matches.slice(0,12)){const b=document.createElement('button');b.type='button';b.textContent=m.title+' · '+(m.release_date||'');b.onclick=()=>show(async()=>{const entry=out.querySelector('#entry');let videos=(await tmdb('/movie/'+m.id+'/videos?language=es-MX')).results;if(!videos.length)videos=(await tmdb('/movie/'+m.id+'/videos?language=en-US')).results;const clip=videos.filter(x=>x.site==='YouTube').sort((a,b)=>Number(b.type==='Trailer')-Number(a.type==='Trailer'))[0];for(const [k,w] of Object.entries({title:m.title,year:m.release_date?.slice(0,4),tmdb:m.id,poster:m.poster_path?'https://image.tmdb.org/t/p/w780'+m.poster_path:'',synopsis:m.overview,trailer:clip?'https://youtu.be/'+clip.key:''}))if(entry.elements[k])entry.elements[k].value=w||'';message('Ficha cargada. Revisa y guarda los cambios.')});box.append(b)}return}
await refresh();await render();message(S.cloud?'Cambios publicados.':'Borrador guardado solo en esta computadora. No se ha publicado en el lobby.')} ).finally(()=>{panel.inert=false;delete submitted.dataset.saving});});
async function tmdb(path){const t=sessionStorage.getItem('ccu-tmdb');if(!t)throw Error('Configura el token TMDB en esta pestaña.');const r=await fetch('https://api.themoviedb.org/3'+path,{headers:{Authorization:'Bearer '+t}});if(!r.ok)throw Error('Consulta TMDB rechazada ('+r.status+').');return r.json()}}
