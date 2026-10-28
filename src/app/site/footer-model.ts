import type {CSSProperties} from 'react';
import type {TextStyle} from '../editor/settings';
import type {MediaSettings} from '../media/model';

export type FooterLayout = 'standard' | 'hours' | 'social' | 'stack' | 'bottom';
export type FooterTarget = 'heading' | 'body' | 'motto' | 'bottom' | 'hours';
export type FooterText = TextStyle & {
  transform?: 'none' | 'uppercase' | 'capitalize';
  rowGap?: number;
};
export type FooterLink = {
  id: string;
  label: string;
  href: string;
  pageId?: string;
  customLabel?: boolean;
};
export type SocialLink = {id: string; label: string; href: string};
export type OfficeDay = {day: string; open: string; close: string; closed: boolean};
export type FooterConfig = {
  layout: FooterLayout;
  logoMode: 'header' | 'custom' | 'none';
  logo?: MediaSettings;
  motto: string;
  showMotto: boolean;
  showSocials: boolean;
  align: 'left' | 'center' | 'right';
  bottomAlign: 'left' | 'center' | 'right';
  order: 'motto' | 'social';
  itemGap: number;
  socials: SocialLink[];
  bottomLinks: FooterLink[];
  hours: OfficeDay[];
  hoursReady: boolean;
  online: boolean;
  hoursTitle: string;
  text: Partial<Record<FooterTarget, FooterText>>;
  hover: 'match' | 'text';
  hoverShape: 'header' | 'square' | 'rounded' | 'pill';
  hoverPadding: number;
};

export const footerLayouts: {id: FooterLayout; label: string; columns: number}[] = [
  {id: 'standard', label: 'Standard', columns: 3},
  {id: 'hours', label: 'Business hours', columns: 4},
  {id: 'social', label: 'Logo & social links', columns: 1},
  {id: 'stack', label: 'Centered brand', columns: 1},
  {id: 'bottom', label: 'Bottom row only', columns: 1},
];
export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function footerDefaults(motto = ''): FooterConfig {
  return {
    layout: 'standard', logoMode: 'header', motto, showMotto: true,
    showSocials: true, align: 'left', bottomAlign: 'left', order: 'motto',
    itemGap: 12, socials: [], bottomLinks: [], hoursReady: false, online: false,
    hoursTitle: 'Opening hours', hover: 'match', hoverShape: 'header', hoverPadding: 12,
    hours: weekdays.map(day => ({day, open: '09:00', close: '17:00', closed: true})),
    text: {},
  };
}
export function safeSocialUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
export function validOfficeDay(day: OfficeDay): boolean {
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  return typeof day.closed === 'boolean' && time.test(day.open) && time.test(day.close)
    && (day.closed || day.open < day.close);
}
export function socialMark(label: string): string {
  const marks: Record<string, string> = {
    instagram: 'IG', facebook: 'f', linkedin: 'in', youtube: '▶',
    tiktok: '♪', x: 'X', twitter: 'X', whatsapp: 'WA', pinterest: 'P',
  };
  return marks[label.trim().toLowerCase()] || label.trim().slice(0, 2).toUpperCase();
}
export function footerTextStyle(text: FooterText = {}, size = 14): CSSProperties {
  const families: Record<string, string> = {
    text: 'var(--font-text)', display: 'var(--font-display)', system: 'system-ui',
  };
  return {
    fontFamily: families[text.family || ''], fontSize: text.size ?? size,
    fontWeight: text.weight, textAlign: text.align as CSSProperties['textAlign'],
    letterSpacing: text.tracking, lineHeight: text.lineHeight ?? 1.5,
    textTransform: text.transform, color: text.color,
  };
}
export function footerRadius(shape: FooterConfig['hoverShape'], header: string): number {
  const key = shape === 'header' ? header : shape;
  return key === 'pill' ? 999 : key === 'rounded' ? 6 : 0;
}
export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/../g)!.map(part => {
      const value = parseInt(part, 16) / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    });
    return channels.reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export function footerHoverText(foreground: string, background: string): string {
  if (![foreground, background].every(color => /^#[\da-f]{6}$/i.test(color))) {
    return 'currentColor';
  }
  const end = contrastRatio('#000000', background) >= contrastRatio('#ffffff', background)
    ? '#000000' : '#ffffff';
  const rgb = (hex: string) => hex.slice(1).match(/../g)!.map(n => parseInt(n, 16));
  const start = rgb(foreground), finish = rgb(end);
  for (let amount = .18; amount <= 1.01; amount += .02) {
    const color = '#' + start.map((n, i) => Math.round(n + (finish[i] - n) * amount)
      .toString(16).padStart(2, '0')).join('');
    if (contrastRatio(color, background) >= 4.5) return color;
  }
  return end;
}
export function validFooter(value: unknown): value is FooterConfig {
  if (!value || typeof value !== 'object') return false;
  const v = value as FooterConfig;
  const finite = (n: unknown, min: number, max: number) =>
    typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  const strings = [v.motto, v.hoursTitle];
  if (!strings.every(s => typeof s === 'string')) return false;
  if (!footerLayouts.some(layout => layout.id === v.layout)) return false;
  if (!['header', 'custom', 'none'].includes(v.logoMode)) return false;
  if (![v.align, v.bottomAlign].every(a => ['left', 'center', 'right'].includes(a))) {
    return false;
  }
  if (![v.showMotto, v.showSocials, v.hoursReady, v.online]
    .every(flag => typeof flag === 'boolean')) return false;
  if (!['motto', 'social'].includes(v.order) || !['match', 'text'].includes(v.hover)) {
    return false;
  }
  if (!['header', 'square', 'rounded', 'pill'].includes(v.hoverShape)) return false;
  if (!finite(v.itemGap, 0, 48) || !finite(v.hoverPadding, 8, 24)) return false;
  if (!Array.isArray(v.hours) || v.hours.length !== 7 || !v.hours.every((d, i) =>
    d && d.day === weekdays[i] && validOfficeDay(d))) return false;
  if (!Array.isArray(v.socials) || v.socials.length > 60 || !v.socials.every(s =>
    s && typeof s.id === 'string' && typeof s.label === 'string'
    && !!s.label.trim() && typeof s.href === 'string' && !!safeSocialUrl(s.href))) return false;
  if (!Array.isArray(v.bottomLinks) || v.bottomLinks.length > 60
    || !v.bottomLinks.every(l => l && typeof l.id === 'string'
      && typeof l.label === 'string' && typeof l.href === 'string'
      && (l.pageId === undefined || typeof l.pageId === 'string'))) return false;
  if (v.logo && (typeof v.logo.src !== 'string' || v.logo.kind !== 'image')) return false;
  if (!v.text || typeof v.text !== 'object') return false;
  return Object.entries(v.text).every(([target, t]) => {
    if (!['heading', 'body', 'motto', 'bottom', 'hours'].includes(target) || !t) return false;
    return (t.size === undefined || finite(t.size, 10, 96))
      && (t.weight === undefined || finite(t.weight, 300, 900))
      && (t.lineHeight === undefined || finite(t.lineHeight, 1, 2.5))
      && (t.tracking === undefined || finite(t.tracking, -3, 10))
      && (t.rowGap === undefined || finite(t.rowGap, 0, 24))
      && (t.align === undefined || ['left', 'center', 'right'].includes(t.align))
      && (t.transform === undefined || ['none', 'uppercase', 'capitalize'].includes(t.transform))
      && (t.family === undefined || ['text', 'display', 'system'].includes(t.family))
      && (t.color === undefined || /^#[\da-f]{6}$/i.test(t.color));
  });
}
