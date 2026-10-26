import {normalizeSettings, type SectionSettings} from './settings';

export function logoScale(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 70;
  return Math.max(40, Math.min(90, Math.round(value)));
}

export function logoGap(settings?: SectionSettings) {
  return normalizeSettings(settings).gap ?? 24;
}

const deliveryBox = {width: 400, height: 120};

export function deliverySize(width: number, height: number) {
  if (!(width > 0) || !(height > 0) || (width <= deliveryBox.width && height <= deliveryBox.height)) return null;
  const scale = Math.min(deliveryBox.width / width, deliveryBox.height / height);
  return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
}
