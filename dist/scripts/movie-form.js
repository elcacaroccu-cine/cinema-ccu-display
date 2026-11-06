import { esc, safeImage } from './util.js';
import { screeningsFor } from './screenings.js';

export function scheduleFields(record) {
  const screenings = screeningsFor(record);
  return '<fieldset class="schedule"><legend>Funciones de la película</legend>' +
    '<label>¿Cuántas funciones tendrá?<select name="screeningCount">' +
    [1, 2, 3, 4, 5].map(n => '<option value="' + n + '"' +
      (n === screenings.length ? ' selected' : '') + '>' + n + '</option>').join('') +
    '</select></label><div id="screeningRows">' +
    screenings.map(screeningRow).join('') + '</div></fieldset>';
}

function screeningRow(screening, index) {
  return '<fieldset class="screening"><legend>Función ' + (index + 1) + '</legend><div class="fields">' +
    ['date', 'time', 'room'].map((key, i) => '<label>' + ['Fecha', 'Hora', 'Sala'][i] +
      '<input required name="screening_' + index + '_' + key + '" type="' +
      ['date', 'time', 'text'][i] + '" value="' + esc(screening[key] || '') + '"></label>').join('') +
    '</div></fieldset>';
}

export function resizeSchedule(form) {
  const holder = form.querySelector('#screeningRows');
  const count = Number(form.elements.screeningCount.value);
  const previous = readSchedule(form);
  while (holder.children.length > count) holder.lastElementChild.remove();
  while (holder.children.length < count) {
    const index = holder.children.length;
    const first = previous[0] || {};
    holder.insertAdjacentHTML('beforeend', screeningRow({
      date: first.date, time: '', room: first.room
    }, index));
  }
}

export function readSchedule(form) {
  return Array.from(form.querySelectorAll('.screening'), (_, index) =>
    Object.fromEntries(['date', 'time', 'room'].map(key =>
      [key, form.elements['screening_' + index + '_' + key].value.trim()]
    ))
  );
}

export function posterFields(value = '') {
  const uploaded = value.startsWith('data:image/');
  return '<fieldset class="posterUpload"><legend>Póster</legend>' +
    '<label>URL del póster<input name="poster" type="text" value="' + esc(uploaded ? '' : value) + '"></label>' +
    '<label>Subir póster desde mi computadora<input name="posterFile" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
    '<small>JPG, PNG o WebP · hasta 10 MB. La imagen se optimiza al guardar.</small>' +
    '<input type="hidden" name="savedPoster" value="' + esc(uploaded ? value : '') + '">' +
    '<img class="posterPreview" alt="Vista previa del póster" src="' +
    (safeImage(value) || 'assets/placeholder.svg') + '">' +
    '<label><input name="removePoster" type="checkbox"> Quitar póster actual</label></fieldset>';
}
