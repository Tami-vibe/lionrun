export type MediaSettings = {
  src: string; kind: 'image' | 'video' | 'social'; alt: string; title: string; description: string;
  poster: string; captions: string; captionLanguage: string; uploadDate: string;
  zoom: number; x: number; y: number; ratio: string; fit: 'cover' | 'contain';
  autoplay: boolean; muted: boolean; loop: boolean; controls: boolean;
  mobile: 'same' | 'poster' | 'hide'; consent: boolean;
};
export const mediaDefaults: MediaSettings = {
  src: '', kind: 'image', alt: '', title: '', description: '', poster: '', captions: '', captionLanguage: 'en', uploadDate: '',
  zoom: 1, x: 50, y: 50, ratio: '16/9', fit: 'cover', autoplay: false, muted: true, loop: true, controls: true, mobile: 'same', consent: true,
};
export function https(value: string): string {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function mediaURL(value: string): string {
  return /^media:[\w-]+$/.test(value) || (/^\/media\/[\w ./-]+$/.test(value) && !value.includes('..')) || /^data:image\/(png|jpeg|webp|gif);base64,[\w+/=]+$/.test(value) ? value : https(value);
}
export function normalizeMedia(value: Partial<MediaSettings>): MediaSettings {
  const n = (v: unknown, base: number, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : base;
  const s = { ...mediaDefaults, ...value };
  return { ...s, src: typeof s.src==='string'?s.src.slice(0,10000):'', poster:typeof s.poster==='string'?s.poster.slice(0,10000):'', captions:typeof s.captions==='string'?s.captions.slice(0,10000):'',
    kind: ['image','video','social'].includes(s.kind) ? s.kind : 'image', zoom: n(s.zoom,1,0.25,4), x:n(s.x,50,0,100), y:n(s.y,50,0,100),
    ratio: ['16/9','4/3','1/1','9/16','21/9'].includes(s.ratio) ? s.ratio : '16/9', fit:s.fit === 'contain' ? 'contain':'cover',
    mobile:['same','poster','hide'].includes(s.mobile) ? s.mobile:'same', autoplay:s.autoplay === true, muted:s.muted !== false,
    loop:s.loop === true, controls:s.controls !== false, consent:s.consent !== false,
  };
}
export function socialEmbed(value: string, settings = mediaDefaults): { provider: string; src: string; url: string } {
  const url = https(value); if (!url) return {provider:'Invalid link',src:'',url:''};
  const u = new URL(url), host = u.hostname.replace(/^www\./,''), path = u.pathname;
  let id = '', src = '', provider = 'External provider';
  if (['youtube.com','m.youtube.com','youtu.be','youtube-nocookie.com'].includes(host)) {
    provider='YouTube'; id=host==='youtu.be'?path.slice(1):path.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1] || u.searchParams.get('v') || '';
    if (/^[\w-]{11}$/.test(id)) src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=${+settings.autoplay}&mute=${+settings.muted}&controls=${+settings.controls}&loop=${+settings.loop}&playlist=${id}`;
  } else if (['vimeo.com','player.vimeo.com'].includes(host)) {
    provider='Vimeo'; id=path.match(/\/(\d+)\/?$/)?.[1] || ''; if(id) src=`https://player.vimeo.com/video/${id}?dnt=1&autoplay=${+settings.autoplay}&muted=${+settings.muted}&loop=${+settings.loop}`;
  } else if(host==='tiktok.com') {
    provider='TikTok'; id=path.match(/\/video\/(\d+)/)?.[1] || ''; if(id) src=`https://www.tiktok.com/player/v1/${id}?autoplay=0`;
  } else if(host==='instagram.com') {
    provider='Instagram'; const match=path.match(/^\/(p|reel)\/([\w-]+)\/?$/); if(match) src=`https://www.instagram.com/${match[1]}/${match[2]}/embed/`;
  } else if(['facebook.com','m.facebook.com','fb.watch'].includes(host)) {
    provider='Facebook'; if(host!=='fb.watch' && (/\/videos\/\d+/.test(path) || path==='/watch/')) src=`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  } else if(['x.com','twitter.com'].includes(host)) { provider='X';
  } else if(host==='dailymotion.com') { provider='Dailymotion'; id=path.match(/^\/video\/([a-zA-Z0-9]+)/)?.[1]||''; if(id)src=`https://www.dailymotion.com/embed/video/${id}`; }
  return {provider,src,url};
}
