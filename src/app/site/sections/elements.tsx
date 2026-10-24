import {AppWindow,ArrowRight,Battery,Calendar,Car,Check,CircleDot,Mail,MapPin,MessageCircle,Paintbrush,Phone,ScanSearch,Settings,Shield,Star,Truck,Wrench,type LucideIcon} from "lucide-react";
import type {IconName} from "../blocks";
export const icons: IconName[] = ["none", "arrow", "phone", "calendar", "mail", "check", "message", "car", "wrench", "shield", "star", "pin", "paint", "gear", "tow", "battery", "wheel", "scan", "glass"];
const glyphs: Record<Exclude<IconName, "none">, LucideIcon> = {arrow:ArrowRight,phone:Phone,calendar:Calendar,mail:Mail,check:Check,message:MessageCircle,car:Car,wrench:Wrench,shield:Shield,star:Star,pin:MapPin,paint:Paintbrush,gear:Settings,tow:Truck,battery:Battery,wheel:CircleDot,scan:ScanSearch,glass:AppWindow};
export function Icon({ name, size = 28 }: { name: IconName; size?: number }) {
    if (name === "none") return null;
    const Glyph = glyphs[name];
    return <Glyph size={size} strokeWidth={1.5} aria-hidden="true"/>;
}
export function safeHref(value: string) {
    const v = value.trim();
    return /^(https?:\/\/|mailto:|tel:|#|\/)(?!\/)/i.test(v) ? v : "#contact";
}
export function SectionHeading({content}:{content:import('../blocks').BlockContent}) {
  return <div className="section-heading-copy">{content.smallLabel&&<span className="section-kicker">{content.smallLabel}</span>}<h2>{content.title}</h2>{content.description&&<p>{content.description}</p>}</div>;
}
export function SectionButtons({content,link}:{content:import('../blocks').BlockContent;link:(href:string,id?:string|null)=>React.AnchorHTMLAttributes<HTMLAnchorElement>}) {
  return <div className="hero-buttons">{content.buttons.filter((button,i)=>button.label&&(i===0||content.showSecondary!==false)).map((button,i)=><a key={i} className={`site-btn ${i?'site-btn-outline':'site-btn-primary'}`} {...link(button.href)}><span>{button.label}</span><Icon name={button.icon}/></a>)}</div>;
}
