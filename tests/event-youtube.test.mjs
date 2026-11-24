import test from 'node:test';
import assert from 'node:assert/strict';
import {eventYoutubeId,eventYoutubeEmbed} from '../dist/scripts/event-youtube.js';
test('accept video links and reject malformed or non-YouTube destinations',()=>{
 for(const url of ['https://youtu.be/M7lc1UVf-VE','https://www.youtube.com/watch?v=M7lc1UVf-VE&list=anything','https://m.youtube.com/shorts/M7lc1UVf-VE','https://www.youtube.com/live/M7lc1UVf-VE','https://www.youtube.com/embed/M7lc1UVf-VE'])assert.equal(eventYoutubeId(url),'M7lc1UVf-VE');
 for(const url of ['javascript:alert(1)','https://youtube.com.evil.org/watch?v=M7lc1UVf-VE','https://youtube.com/playlist?list=x','https://youtu.be/short','https://youtube.com/@channel'])assert.equal(eventYoutubeId(url),null);
});
test('loop repeats same video from beginning and autoplays muted',()=>{
 const u=new URL(eventYoutubeEmbed('M7lc1UVf-VE','https://example.com'));assert.equal(u.searchParams.get('playlist'),'M7lc1UVf-VE');for(const key of ['autoplay','mute','loop','playsinline'])assert.equal(u.searchParams.get(key),'1');assert.equal(u.searchParams.has('start'),false);assert.throws(()=>eventYoutubeEmbed('bad',''));
});
