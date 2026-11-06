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
