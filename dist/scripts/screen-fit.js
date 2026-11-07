// Keep the lobby display within the actual browser viewport, including TV toolbars.
const surface = document.querySelector('#displaySurface');
const fullscreen = document.querySelector('#fullscreen');
let queued = false;
function fit() {
  queued = false;
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const television = width >= 700 && width > height;
  document.body.classList.toggle('tv', television);
  if (!television) { surface.style.removeProperty('--display-scale'); return; }
  const scale = Math.min(width / 1280, height / Math.max(surface.scrollHeight, surface.offsetHeight));
  surface.style.setProperty('--display-scale', String(scale));
}
function scheduleFit() {
  if (!queued) { queued = true; requestAnimationFrame(fit); }
}
new MutationObserver(scheduleFit).observe(surface, { childList: true, subtree: true, characterData: true });
if ('ResizeObserver' in window) new ResizeObserver(scheduleFit).observe(surface);
window.addEventListener('resize', scheduleFit);
window.addEventListener('orientationchange', scheduleFit);
surface.addEventListener('load', scheduleFit, true);
document.addEventListener('fullscreenchange', scheduleFit);
if (document.documentElement.requestFullscreen) {
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { fullscreen.textContent = 'Usa pantalla completa del navegador'; }
    scheduleFit();
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
  });
} else fullscreen.hidden = true;
fit();
