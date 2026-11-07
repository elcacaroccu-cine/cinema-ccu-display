import test from 'node:test';
import assert from 'node:assert/strict';
import { screeningsFor, expandScreenings, validateScreenings } from '../dist/scripts/screenings.js';
import { validatePosterFile } from '../dist/scripts/poster.js';
import { safeImage } from '../dist/scripts/util.js';
import * as S from '../dist/scripts/store.js';
import { randomInt } from 'node:crypto';
const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key),
  setItem: (key, value) => memory.set(key, value)
};

test('Legacy function and five dated functions retain independent schedules', () => {
  const legacy = { date: '2026-11-05', time: '17:00', room: 'Sala 1', title: 'Clásica' };
  const screenings = Array.from({ length: 5 }, (_, i) => ({
    date: '2026-11-0' + (5 + i), time: '19:00', room: 'Sala 2'
  }));
  validateScreenings(screenings);
  assert.equal(screeningsFor(legacy).length, 1);
  const expanded = expandScreenings([legacy, { title: 'Nueva', screenings }]);
  assert.equal(expanded.length, 6);
  assert.equal(expanded[5].date, '2026-11-09');
  assert.equal(expanded[5].title, 'Nueva');
  assert.throws(() => validateScreenings([...screenings, screenings[0]]));
  assert.throws(() => validateScreenings([screenings[0], screenings[0]]));
  assert.throws(() => validateScreenings([{ ...screenings[0], date: '2026-02-30' }]));
  assert.throws(() => validateScreenings([{ ...screenings[0], time: '25:00' }]));
});

test('Multiple screenings and uploaded poster survive edit and JSON restore', async () => {
  await S.init('Prueba funciones', String(randomInt(100000, 999999)));
  const screenings = Array.from({ length: 5 }, (_, i) => ({
    date: '2026-11-05', time: (12 + i) + ':00', room: 'Sala 1'
  }));
  const poster = 'data:image/jpeg;base64,/9j/2Q==';
  await S.write('movies', { title: 'Cinco funciones', ...screenings[0], screenings, poster });
  let movie = (await S.data()).movies.find(m => m.title === 'Cinco funciones');
  assert.equal(movie.screenings.length, 5);
  await S.write('movies', { ...movie, screenings: screenings.slice(0, 2) });
  const backup = JSON.parse(JSON.stringify(await S.data()));
  S.restore(backup);
  movie = (await S.data()).movies.find(m => m.id === movie.id);
  assert.equal(movie.screenings.length, 2);
  assert.equal(movie.poster, poster);
  assert.equal(safeImage(movie.poster), poster);
  await assert.rejects(S.write('movies', { ...movie, screenings: [] }));
  assert.equal((await S.data()).movies.find(m => m.id === movie.id).screenings.length, 2);
});

test('Reject invalid and oversized poster uploads and non-raster data URLs', () => {
  validatePosterFile({ type: 'image/png', size: 1024 });
  assert.throws(() => validatePosterFile({ type: 'image/svg+xml', size: 100 }));
  assert.throws(() => validatePosterFile({ type: 'image/jpeg', size: 11 * 1024 * 1024 }));
  assert.equal(safeImage('data:text/html;base64,PGgxPg=='), '');
  assert.equal(safeImage('data:image/svg+xml;base64,PHN2Zz4='), '');
});

test('Storage exhaustion preserves previous catalog', async () => {
  const previous = await S.data();
  const setter = localStorage.setItem;
  localStorage.setItem = () => { throw Object.assign(new Error(), { name: 'QuotaExceededError' }); };
  await assert.rejects(S.write('movies', { title: 'Sin espacio' }), /No se guardaron/);
  localStorage.setItem = setter;
  assert.deepEqual(await S.data(), previous);
});

test('One card holds all five daily times, while different rooms and days stay separate', async () => {
  const { groupScreenings, roomLabel } = await import('../dist/scripts/screenings.js');
  const date = '2026-11-07';
  const movie = { id: 'one', title: 'Los colonos', poster: 'poster.jpg', synopsis: 'Sinopsis', screenings:
    ['20:00', '12:00', '18:00', '14:00', '16:00'].map((time, i) => ({ date, time, room: i % 2 ? 'Sala 1' : '1' })) };
  let cards = groupScreenings([movie], date);
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].times, ['12:00', '14:00', '16:00', '18:00', '20:00']);
  assert.equal(cards[0].room, 'Sala 1');
  assert.equal(cards[0].poster, movie.poster);
  assert.equal(cards[0].synopsis, movie.synopsis);
  const split = { ...movie, screenings: [
    { date, time: '17:00', room: '1' }, { date, time: '19:00', room: 'Sala 1' },
    { date, time: '18:00', room: '2' }, { date: '2026-11-08', time: '21:00', room: '1' }
  ] };
  cards = groupScreenings([split], date);
  assert.deepEqual(cards.map(c => [c.room, c.times]), [['Sala 1', ['17:00', '19:00']], ['Sala 2', ['18:00']]]);
  assert.deepEqual(groupScreenings([split], '2026-11-08')[0].times, ['21:00']);
  assert.equal(groupScreenings([{ date, time: '15:00', room: '2' }], date)[0].room, 'Sala 2');
  assert.equal(roomLabel(' sala  1 '), 'Sala 1');
  assert.equal(roomLabel('Auditorio'), 'Auditorio');
  assert.equal(groupScreenings([movie, { ...movie, id: 'other' }], date).length, 2);
});
