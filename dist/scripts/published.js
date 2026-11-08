// The lobby reads the same published catalog on every device, never local drafts.
export async function publishedData(fetcher=fetch){
  const response=await fetcher(new URL('../data/cartelera.json',import.meta.url),{cache:'no-store'});
  if(!response.ok)throw Error('No se pudo descargar la cartelera publicada. Se conserva la última visible.');
  const db=await response.json();
  if(!db||!['movies','candy','upcoming'].every(k=>Array.isArray(db[k])))throw Error('Cartelera publicada inválida.');
  return db;
}
