export type Asset = { id: string; name: string; kind: 'image' | 'video' | 'captions'; mime: string; size: number; created: string; blob: Blob };
export const LIMITS = { image:10_000_000, video:100_000_000, captions:1_000_000, total:250_000_000 };
export const ACCEPT = '.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.avif,.svg';
async function database() {
  return new Promise<IDBDatabase>((resolve,reject)=>{
    const r=indexedDB.open('business-builder-media',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('assets',{keyPath:'id'});
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(new Error('Media storage unavailable. Check browser storage permissions.'));
  });
}
export async function assetStore(action:'list'|'put'|'delete', value?: Asset | string): Promise<Asset[]> {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('assets',action==='list'?'readonly':'readwrite'), store=tx.objectStore('assets');
    let result: Asset[]=[];
    if(action==='list'){const r=store.getAll();r.onsuccess=()=>{result=r.result;};}
    if(action==='put')store.put(value);
    if(action==='delete')store.delete(value as string);
    tx.oncomplete=()=>{db.close();resolve(result);};
    tx.onabort=tx.onerror=()=>{db.close();reject(new Error('Media could not be saved. Browser storage may be full.'));};
  });
}
export function validateSVG(text:string): string {
  if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('SVG entities and document types are not allowed.');
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');
  const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','defs','linearGradient','radialGradient','stop','clipPath','title','desc']);
  const attrs=new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','opacity','fill-opacity','stroke-opacity','transform','id','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','clip-path','fill-rule','clip-rule','preserveAspectRatio']);
  if(doc.querySelector('parsererror') || doc.documentElement.localName!=='svg' || /<!DOCTYPE|<!ENTITY/i.test(text))throw Error('Invalid SVG document.');
  for(const el of Array.from(doc.querySelectorAll('*'))){
    if(!tags.has(el.localName))throw Error(`SVG element ${el.localName} is not supported. Export a simple SVG or use PNG.`);
    for(const a of Array.from(el.attributes)){
      if(!attrs.has(a.name) || /[<>]|javascript:|data:|https?:|\/\//i.test(a.value.replace('http://www.w3.org/2000/svg','')) || (/url\(/i.test(a.value) && !/^url\(#[\w-]+\)$/.test(a.value)))throw Error(`Unsafe or unsupported SVG attribute: ${a.name}`);
    }
  }
  return new XMLSerializer().serializeToString(doc);
}
export async function validateUpload(file:File):Promise<{blob:Blob;kind:Asset['kind'];mime:string}> {
  const ext=file.name.split('.').pop()?.toLowerCase(), bytes=new Uint8Array(await file.slice(0,64).arrayBuffer());
  const ascii=new TextDecoder().decode(bytes); let mime='',kind:Asset['kind']='image';
  if(['jpg','jpeg'].includes(ext||'') && bytes[0]===255 && bytes[1]===216 && bytes[2]===255)mime='image/jpeg';
  if(ext==='png' && bytes.slice(0,8).join() === '137,80,78,71,13,10,26,10')mime='image/png';
  if(ext==='webp' && ascii.startsWith('RIFF') && ascii.slice(8,12)==='WEBP')mime='image/webp';
  if(ext==='avif' && ascii.slice(4,8)==='ftyp' && /avif|avis/.test(ascii.slice(8)))mime='image/avif';
  if(['mp4','mov'].includes(ext||'') && ascii.slice(4,8)==='ftyp' && /isom|iso[2-9]|mp4[12]|avc1|M4V |qt  /.test(ascii.slice(8))){mime=ext==='mov'?'video/quicktime':'video/mp4';kind='video';}
  if(ext==='webm' && bytes.slice(0,4).join()==='26,69,223,163' && ascii.includes('webm')){mime='video/webm';kind='video';}
  if(ext==='svg')mime='image/svg+xml';
  if(ext==='vtt' && (await file.slice(0,20).text()).replace(/^\uFEFF/,'').startsWith('WEBVTT')){mime='text/vtt';kind='captions';}
  if(!mime)throw Error('File contents do not match a supported format.');
  if(file.size===0 || file.size>LIMITS[kind])throw Error(`${kind} upload limit: ${LIMITS[kind]/1_000_000} MB.`);
  if(file.type && file.type!=='application/octet-stream' && file.type!==mime && !(ext==='mov'&&file.type==='video/mp4') && !(ext==='vtt'&&file.type==='text/plain'))throw Error('File MIME type does not match its contents.');
  let blob:Blob=file;
  if(ext==='svg')blob=new Blob([validateSVG(await file.text())],{type:mime});
  else blob=new Blob([await file.arrayBuffer()],{type:mime});
  return {blob,kind,mime};
}
