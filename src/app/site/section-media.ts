import {mediaDefaults, type MediaSettings} from '../media/model';
export const still = (src:string, alt:string): MediaSettings => ({...mediaDefaults, src, alt, kind:'image'});
export const clip = (src:string, poster:string, alt:string): MediaSettings => {
  const {playback, clickToPlay, ...stored} = {...mediaDefaults, src, poster, alt, kind:'video' as const, autoplay:true, muted:true, loop:true, controls:false};
  void playback; void clickToPlay;
  return stored as MediaSettings;
};
