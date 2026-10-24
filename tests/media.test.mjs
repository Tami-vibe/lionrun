import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaDefaults, normalizeMedia, https, socialEmbed} from '../src/app/media/model.ts';
import {validateUpload} from '../src/app/media/store.ts';
test('reject script, credentials and insecure URLs',()=>{
  for(const value of ['javascript:alert(1)','http://example.com/a.mp4','https://user:password@example.com/'])assert.equal(https(value),'');
  assert.equal(https('https://example.com/a.mp4'),'https://example.com/a.mp4');
});
test('social hosts and IDs are exact allowlists',()=>{
  assert.match(socialEmbed('https://youtu.be/dQw4w9WgXcQ').src,/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(socialEmbed('https://vimeo.com/123456').src,/player.vimeo.com\/video\/123456/);
  assert.match(socialEmbed('https://www.tiktok.com/@person/video/123456').src,/tiktok.com\/player\/v1\/123456/);
  assert.match(socialEmbed('https://www.instagram.com/reel/ABC_123/').src,/instagram.com\/reel\/ABC_123\/embed/);
  assert.match(socialEmbed('https://www.facebook.com/page/videos/123456').src,/facebook.com\/plugins\/video.php/);
  assert.equal(socialEmbed('https://x.com/person/status/123').src,'');
  for(const url of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://vimeo.com/123/evil','https://example.com/embed','javascript:alert(1)'])assert.equal(socialEmbed(url).src,'');
});
test('framing is bounded and privacy defaults are opt-in',()=>{
  const m=normalizeMedia({...mediaDefaults,zoom:99,x:-8,y:NaN,ratio:'broken'});
  assert.equal(m.zoom,4);assert.equal(m.x,0);assert.equal(m.y,50);assert.equal(m.ratio,'16/9');assert.equal(m.consent,true);
});
test('upload checks content signatures, MIME and limits',async()=>{
  await assert.rejects(validateUpload(new File(['<script>alert(1)</script>'],'fake.png',{type:'image/png'})),/contents/);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  assert.equal((await validateUpload(new File([png],'ok.png',{type:'image/png'}))).mime,'image/png');
  await assert.rejects(validateUpload(new File([png],'bad.png',{type:'video/mp4'})),/MIME/);
  await assert.rejects(validateUpload(new File([png,new Uint8Array(10_000_000)],'large.png',{type:'image/png'})),/limit/);
  const mp4=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypisom0000mp42')]);
  assert.equal((await validateUpload(new File([mp4],'clip.mp4',{type:'video/mp4'}))).kind,'video');
  assert.equal((await validateUpload(new File(['WEBVTT\n\n00:00.000 --> 00:01.000\nHello'],'captions.vtt',{type:'text/vtt'}))).kind,'captions');
});
test('recognize the remaining advertised format signatures',async()=>{
  const samples=[
    ['image.jpg','image/jpeg',Buffer.from([255,216,255,224])],
    ['image.webp','image/webp',Buffer.from('RIFF0000WEBP')],
    ['image.avif','image/avif',Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypavif0000avif')])],
    ['video.mov','video/quicktime',Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypqt  0000qt  ')])],
    ['video.webm','video/webm',Buffer.concat([Buffer.from([26,69,223,163]),Buffer.from('webm')])],
  ];
  for(const [name,mime,data] of samples)assert.equal((await validateUpload(new File([data],name,{type:mime}))).mime,mime);
});

// Page addresses stay stable while legacy drafts gain collision-free slugs.
import {pageSlug,pageAddresses,headerLook,menuPlacement} from '../src/app/editor/settings.ts';
test('page addresses are safe, unique and stable after a rename',()=>{
  assert.equal(pageSlug('Àbout / Us'), 'about-us');
  const pages=pageAddresses([{name:'About us'},{name:'About us'},{name:'New name',slug:'original-name'}]);
  assert.deepEqual(pages.map(p=>p.slug),['about-us','about-us-2','original-name']);
  assert.equal(pageSlug('!!!'),'page');
});
test('legacy header looks map to Standard without changing new looks',()=>{
  for(const legacy of ['classic','centered',undefined,'invalid'])assert.equal(headerLook(legacy),'standard');
  assert.equal(headerLook('pill'),'pill');assert.equal(headerLook('rounded'),'rounded');
});
test('menu placement keeps pages reachable when top links are unavailable',()=>{
  assert.equal(menuPlacement('under',0),'top');assert.equal(menuPlacement('top',5),'bottom');
  assert.equal(menuPlacement('under',4),'under');assert.equal(menuPlacement('bottom',0),'bottom');
});
