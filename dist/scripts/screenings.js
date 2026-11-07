// Existing records without a screenings array remain valid.
export function screeningsFor(movie) {
  return movie.screenings ?? [{ date: movie.date, time: movie.time, room: movie.room }];
}

export function validateScreenings(screenings) {
  if (!Array.isArray(screenings) || screenings.length < 1 || screenings.length > 5) {
    throw Error('Selecciona de 1 a 5 funciones.');
  }
  const seen = new Set();
  for (const screening of screenings) {
    const { date, time, room } = screening || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') ||
        !Number.isFinite(Date.parse(date + 'T12:00:00Z')) ||
        new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '') ||
        typeof room !== 'string' || !room.trim()) {
      throw Error('Completa la fecha, hora y sala de cada función.');
    }
    const key = [date, time, room.trim().toLowerCase()].join('|');
    if (seen.has(key)) throw Error('Hay funciones repetidas. Revisa la fecha, hora y sala.');
    seen.add(key);
  }
}

export function expandScreenings(movies) {
  return movies.flatMap(movie =>
    screeningsFor(movie).map(screening => ({ ...movie, ...screening }))
  );
}

// Numeric room entries from older records must still show the full label.
export function roomLabel(room) {
  const label = String(room ?? '').trim().replace(/\s+/g, ' ');
  const numbered = label.match(/^(?:sala\s*)?(\d+)$/i);
  return numbered ? 'Sala ' + Number(numbered[1]) : label;
}

// One poster per movie and room on the selected day, with every showtime.
export function groupScreenings(movies, date) {
  return movies.flatMap(movie => {
    const rooms = new Map();
    for (const screening of screeningsFor(movie)) {
      if (screening.date !== date) continue;
      const room = roomLabel(screening.room);
      const key = room.toLocaleLowerCase('es');
      if (!rooms.has(key)) rooms.set(key, { ...movie, date, room, times: [] });
      const card = rooms.get(key);
      if (!card.times.includes(screening.time)) card.times.push(screening.time);
    }
    return [...rooms.values()].map(card => ({ ...card, times: card.times.sort() }));
  }).sort((a, b) => a.times[0].localeCompare(b.times[0]));
}
