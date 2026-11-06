import {uuid} from './id.js';
// Dates are civil dates in Puebla. UTC arithmetic avoids browser/time-zone drift.
export function pueblaDate(offset = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const part = type => Number(parts.find(item => item.type === type).value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + offset)).toISOString().slice(0, 10);
}

const films = {
  roma: ['Roma', 2018, 'B15', 'En el patio de una casa de la colonia Roma, Cleo lava el piso mientras el cielo se refleja en el agua. Afuera, la ciudad cambia. Dentro, los afectos y las obligaciones de una familia ponen a prueba los vínculos que la sostienen.', 'León de Oro de Venecia · Premios Óscar a dirección, fotografía y película extranjera.'],
  nubes: ['La memoria de las nubes', 2025, 'A', 'Una joven vuelve al pueblo de su abuela con una cámara prestada. Entre rollos sin revelar y tardes de lluvia, aprende a reconocer las voces de quienes se fueron.', 'Muestra universitaria · Selección de demostración.'],
  pinocho: ['Pinocho de Guillermo del Toro', 2022, 'A', 'Un tallador de madera da forma a una marioneta. Cuando el niño abre los ojos, comienza para ambos el difícil aprendizaje de quererse en un mundo que exige obediencia.', 'Óscar a mejor película de animación.'],
  ecos: ['Los ecos del maíz', 2024, 'A', 'En la sierra poblana, tres generaciones guardan las semillas de una milpa y el sonido de un idioma que amenaza con desaparecer.', 'Panorama de creación regional · Selección de demostración.'],
  bosque: ['Cuando el bosque recuerda todos los nombres que alguna vez tuvimos', 2026, 'B', 'Una sonidista regresa al bosque en el que creció. Busca el origen de una grabación sin fecha. Al recorrer los senderos con su padre, descubre que cada uno recuerda un paisaje distinto, aunque ambos hayan vivido en el mismo sitio.', 'Encuentro universitario de cine y memoria · Selección de largometrajes · Reconocimiento del público en la muestra de narrativas regionales (datos de demostración).'],
  frankenstein: ['Frankenstein', 2025, 'B15', 'Una criatura abre los ojos en el laboratorio de un científico. El encuentro entre creador y creación se convierte en una disputa por el nombre, el cuerpo y el derecho a contar la propia historia.', ''],
  irlandes: ['El irlandés', 2019, 'B15', 'Desde la vejez, Frank Sheeran reconstruye las lealtades y traiciones que marcaron su vida junto al dirigente sindical Jimmy Hoffa.', '']
};
const trailers = {
  roma: 'https://www.youtube.com/watch?v=6BS27ngZtxg',
  pinocho: 'https://youtu.be/Od2NW1sfRdA?t=1s',
  frankenstein: 'https://www.youtube.com/watch?v=K71UeZ9lHh4',
  irlandes: 'https://www.youtube.com/watch?v=WHXxVmeGQUc'
};
const products = [
  ['Palomitas clásicas', 'Palomitas', 45, 'Maíz recién hecho, con un toque de sal y mantequilla.', 'palomitas'],
  ['Café de olla', 'Bebidas calientes', 30, 'Café con canela y un toque de piloncillo.', 'cafe'],
  ['Refresco', 'Bebidas frías', 35, 'Refresco frío para acompañar la función.', 'refresco'],
  ['Helado doble', 'Heladería', 40, 'Dos bolas de helado en cono crujiente.', 'helado'],
  ['Chocolate en barra', 'Dulces', 25, 'Chocolate semiamargo para compartir.', 'chocolate'],
  ['Agua natural', 'Bebidas frías', 20, 'Botella individual de agua purificada.', 'agua']
];
export function seed() {
  const poster = key => './assets/' + key + '.svg';
  const screenings = [
    ['roma',0,'14:00',1],['nubes',0,'16:00',2],['pinocho',0,'17:00',1],['bosque',0,'19:30',2],
    ['ecos',1,'14:30',2],['pinocho',1,'17:00',1],['roma',1,'19:30',1],
    ['bosque',2,'15:00',2],['ecos',2,'17:00',2],['nubes',2,'19:00',1]
  ];
  const movies = screenings.map(([key,day,time,sala], index) => {
    const [title,year,rating,synopsis,awards] = films[key];
    return {id:uuid(),date:pueblaDate(day),time,room:'Sala '+sala,title,year,rating,
      price:sala === 1 ? 60 : 0,free:sala === 2,synopsis,awards,tmdb:'',poster:poster(key),
      trailer: index === 0 || index === 2 ? trailers[key] : ''};
  });
  const candy = products.map(([title,category,price,description,image]) =>
    ({id:uuid(),title,category,price,description,poster:poster(image),active:true}));
  const upcoming = [['frankenstein',5,'PRÓXIMAMENTE'],['irlandes',8,'ESTRENO'],['bosque',12,'PREESTRENO']].map(([key,day,label]) =>
    ({id:uuid(),title:films[key][0],year:films[key][1],date:pueblaDate(day),label,tmdb:'',
      poster:poster(key),trailer:trailers[key] || '',active:true}));
  return {movies,candy,upcoming};
}
