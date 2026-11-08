export async function publishedData(fetcher=fetch){
 const response=await fetcher('https://cinema-ccu-display.diosdelcine.chatgpt.site/api/state',{cache:'no-store'});
 if(!response.ok)throw Error('No se pudo descargar la cartelera compartida. Se conserva la última visible.');
 const {data:db}=await response.json();
 if(!db||!['movies','candy','upcoming'].every(k=>Array.isArray(db[k])))throw Error('Cartelera publicada inválida.');
 return db;
}
