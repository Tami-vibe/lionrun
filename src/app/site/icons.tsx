import {AppWindow,ArrowRight,Ban,Battery,Calendar,Car,Check,CircleDot,Mail,MapPin,MessageCircle,Paintbrush,Phone,ScanSearch,Settings,Shield,Star,Truck,Wrench,type LucideIcon} from "lucide-react";
import type {IconName} from "./blocks";

export const iconChoices: {id: IconName; label: string; icon: LucideIcon}[] = [
  {id:"none", label:"No icon", icon:Ban},
  {id:"arrow", label:"Arrow", icon:ArrowRight},
  {id:"phone", label:"Phone", icon:Phone},
  {id:"mail", label:"Email", icon:Mail},
  {id:"calendar", label:"Calendar", icon:Calendar},
  {id:"message", label:"Message", icon:MessageCircle},
  {id:"car", label:"Car", icon:Car},
  {id:"wrench", label:"Wrench", icon:Wrench},
  {id:"shield", label:"Shield", icon:Shield},
  {id:"check", label:"Check", icon:Check},
  {id:"star", label:"Star", icon:Star},
  {id:"pin", label:"Location", icon:MapPin},
  {id:"paint", label:"Paint", icon:Paintbrush},
  {id:"gear", label:"Settings", icon:Settings},
  {id:"tow", label:"Towing", icon:Truck},
  {id:"battery", label:"Battery", icon:Battery},
  {id:"wheel", label:"Wheel", icon:CircleDot},
  {id:"scan", label:"Scan", icon:ScanSearch},
  {id:"glass", label:"Glass", icon:AppWindow},
];

type Covered = (typeof iconChoices)[number]["id"];
const iconRegistryCoversNames: Exclude<IconName, Covered> extends never ? true : never = true;
void iconRegistryCoversNames;

export function Icon({name, size = 28, strokeWidth = 1.5}: {name: IconName; size?: number; strokeWidth?: number}) {
  if (name === "none") return null;
  const Glyph = iconChoices.find(choice => choice.id === name)?.icon;
  if (!Glyph) return null;
  return <Glyph size={size} strokeWidth={strokeWidth} aria-hidden="true"/>;
}

export function IconGlyph({name, size = 18}: {name: IconName; size?: number}) {
  const Glyph = iconChoices.find(choice => choice.id === name)?.icon ?? Ban;
  return <Glyph size={size} strokeWidth={1.75} aria-hidden="true"/>;
}
