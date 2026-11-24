import {eventYoutubeEmbed} from './event-youtube.js';
let current='',active=false;
export const eventActive=()=>active;
export function renderSpecialEvent(event={}){
 active=event.active===true&&(event.source==='youtube'?/^[\w-]{11}$/.test(event.youtubeId||''):!!event.key);
 let layer=document.getElementById('specialEventDisplay');
 if(!active){layer?.remove();current='';return}
 const signature=JSON.stringify(event);if(layer&&current===signature)return;
 layer?.remove();current=signature;layer=document.createElement('section');layer.id='specialEventDisplay';layer.setAttribute('aria-label',event.title||'Evento especial');
 if(event.source==='youtube'){const frame=document.createElement('iframe');frame.title=event.title||'Evento especial de YouTube';frame.src=eventYoutubeEmbed(event.youtubeId,location.origin);frame.allow='autoplay; encrypted-media; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';const button=document.createElement('button');button.textContent='Administrar';button.className='eventAdmin';button.onclick=()=>document.querySelector('#admin').click();layer.append(frame,button);document.body.append(layer);return}
 const video=event.type?.startsWith('video/'),media=document.createElement(video?'video':'img');
 media.src='https://cinema-ccu-display.diosdelcine.chatgpt.site/api/event-media/'+encodeURIComponent(event.key);
 if(video){media.muted=true;media.autoplay=true;media.loop=true;media.playsInline=true;media.preload='auto'}else media.alt=event.title||'Evento especial';
 const status=document.createElement('p');status.setAttribute('role','status');
 media.onerror=()=>{status.textContent='No se pudo cargar el evento. Reintentando…';setTimeout(()=>{if(media.isConnected){if(video)media.load();else media.src=media.src}},15000)};
 const ready=()=>{status.textContent='';if(video)media.play().catch(()=>{status.textContent='Pulsa la pantalla para iniciar el video.';layer.onclick=()=>media.play()})};media.addEventListener(video?'canplay':'load',ready);
 const button=document.createElement('button');button.textContent='Administrar';button.className='eventAdmin';button.onclick=()=>document.querySelector('#admin').click();
 layer.append(media,status,button);document.body.append(layer);
}
