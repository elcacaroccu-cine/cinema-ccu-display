// Long text scrolls inside its own frame; it never resizes the lobby layout.
const state=new WeakMap();
setInterval(()=>{
 if(!document.body.classList.contains('tv')||document.querySelector('#panel')?.open||document.querySelector('#pause')?.textContent.includes('Reanudar'))return;
 const now=Date.now();
 document.querySelectorAll('.synopsis,.awards,.description,.cardTitle,.filmTop>div').forEach(el=>{
  const max=el.scrollHeight-el.clientHeight;if(max<=2)return;
  let s=state.get(el);if(!s){s={wait:now+6000,dir:1};state.set(el,s)}
  if(now<s.wait||el.matches(':hover'))return;
  el.scrollTop+=s.dir;
  if(el.scrollTop>=max-1){s.dir=-1;s.wait=now+6000}
  else if(el.scrollTop<=0){s.dir=1;s.wait=now+6000}
 });
},80);
