import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedData} from '../dist/scripts/published.js';
import {readFile} from 'node:fs/promises';
test('lobby fetches the published catalog without using browser drafts',async()=>{
 let options;
 const db=JSON.parse(await readFile(new URL('../dist/data/cartelera.json',import.meta.url)));
 const result=await publishedData(async(url,opts)=>{options=opts;assert.match(url.pathname,/data\/cartelera.json$/);return {ok:true,json:async()=>db}});
 assert.equal(options.cache,'no-store');assert.equal(result.movies.length,17);
 assert.equal(result.movies.reduce((n,m)=>n+m.screenings.length,0),32);
});
test('failed publication fetch rejects instead of displaying unrelated local data',async()=>{
 await assert.rejects(publishedData(async()=>({ok:false})),/descargar/);
 await assert.rejects(publishedData(async()=>({ok:true,json:async()=>({})})),/inválida/);
});
