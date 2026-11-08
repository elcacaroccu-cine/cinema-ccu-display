import {esc,safeImage} from './util.js';
import {validatePosterFile} from './poster.js';
export function renderPresentation(p={}){
 const banner=document.querySelector('#cycleBanner'),qr=document.querySelector('#socialQr');
 banner.hidden=p.bannerEnabled===false||!p.bannerImage;
 banner.innerHTML=banner.hidden?'':'<img src="'+safeImage(p.bannerImage)+'" alt="'+esc(p.bannerAlt||'Información del ciclo')+'">';
 qr.hidden=p.qrEnabled===false||!p.qrImage;
 let href='';try{const url=new URL(p.qrUrl);if(url.protocol==='https:')href=url.href}catch{}
 qr.innerHTML=qr.hidden?'':(href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">':'<div>')+'<img src="'+safeImage(p.qrImage)+'" alt="Código QR"><span>'+esc(p.qrLabel||'Síguenos en Facebook')+'</span>'+(href?'</a>':'</div>');
}
export function presentationForm(p={}){
 const item=(id,title,image,enabled)=>'<fieldset class="presentationField"><legend>'+title+'</legend><label><input type="checkbox" name="'+id+'Enabled" '+(enabled!==false?'checked':'')+'> Mostrar en el lobby</label><img class="presentationPreview '+id+'Preview" src="'+safeImage(image||'')+'" alt="Vista previa"><label>Subir imagen JPG, PNG o WebP<input type="file" name="'+id+'File" accept="image/jpeg,image/png,image/webp"></label></fieldset>';
 return '<h3>Cabecera y código QR</h3><p>Estas imágenes se comparten con todas las pantallas. La cabecera se muestra completa, sin recortarla.</p><form id="presentation">'+item('banner','Cuadro 2 · Cabecera',p.bannerImage,p.bannerEnabled)+'<label>Descripción de la cabecera<input name="bannerAlt" maxlength="200" value="'+esc(p.bannerAlt||'')+'"></label>'+item('qr','Cuadro 1 · Código QR',p.qrImage,p.qrEnabled)+'<label>Texto junto al QR<input name="qrLabel" maxlength="100" value="'+esc(p.qrLabel||'')+'"></label><label>Enlace al hacer clic<input name="qrUrl" type="url" value="'+esc(p.qrUrl||'')+'"></label><p>El destino al escanear está dentro de la imagen QR. Cambiar el enlace no modifica el código: sube otro QR si cambia su destino.</p><button>Publicar cabecera y QR</button></form>';
}
export async function preparePresentationImage(file,kind){
 validatePosterFile(file);
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;await img.decode();
  const scale=Math.min(1,(kind==='qr'?900:1600)/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=kind!=='qr';ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let result=canvas.toDataURL(kind==='qr'?'image/png':'image/jpeg',.86);
  if(result.length>550000&&kind!=='qr')result=canvas.toDataURL('image/jpeg',.65);
  if(result.length>650000)throw Error('La imagen es demasiado pesada. Usa una versión más pequeña.');
  return result;
 }finally{URL.revokeObjectURL(url)}
}
