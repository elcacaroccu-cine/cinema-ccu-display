export function eventYoutubeId(value){
 try{const u=new URL(value),host=u.hostname.toLowerCase();if(!['https:','http:'].includes(u.protocol))return null;
 const id=host==='youtu.be'?u.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)?(u.pathname==='/watch'?u.searchParams.get('v'):/^\/(?:shorts|live|embed)\/([\w-]{11})\/?$/.exec(u.pathname)?.[1]):null;
 return /^[\w-]{11}$/.test(id||'')?id:null}catch{return null}
}
export function eventYoutubeEmbed(id,origin){
 if(!/^[\w-]{11}$/.test(id||''))throw Error('Video de YouTube inválido.');
 const q=new URLSearchParams({autoplay:'1',mute:'1',loop:'1',playlist:id,playsinline:'1',controls:'1',rel:'0',origin});
 return 'https://www.youtube-nocookie.com/embed/'+id+'?'+q;
}
