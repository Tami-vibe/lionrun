import {catalog} from './catalog';
import type {SectionId} from './catalog';
import {contactHours} from './contact-hours';
import {defaultColumns,equalWidths,normalizeSettings,headerLook,pageSlug} from '../editor/settings';
import type {SectionSettings,FooterColumn} from '../editor/settings';
import {heroSlides, slideIndexAllowed} from '../editor/hero-collection';
import {mediaDefaults,socialEmbed} from '../media/model';
import type {MediaSettings} from '../media/model';
export type BlockItem = {title:string;description:string;icon:IconName;media?:MediaSettings;price?:string;pageId?:string;caption?:string;group?:string;tag?:string;value?:string;note?:string;when?:string;source?:string;stars?:number};
export type BlockContent = {smallLabel:string;title:string;description:string;items:BlockItem[];media:MediaSettings;buttons:ButtonData[];facts:string[];note:string;formButton:string;consent:string;fields:{label:string;type:'text'|'email'|'tel'|'textarea';required:boolean}[];rating?:{score:string;count:string;href:string};slides?:MediaSettings[];factIcons?:IconName[];story?:MediaSettings;showSecondary?:boolean;showHeading?:boolean;showMedia?:boolean;showBusiness?:boolean;arrowCircle?:boolean;buttonCount?:0|1|2;headAlign?:'top'|'center'|'bottom';photoSide?:'left'|'right';height?:'standard'|'full';align?:'left'|'center';darkness?:number;fade?:boolean;fadeDirection?:'ltr'|'rtl';fadeWidth?:number;fadeStrength?:number;background?:string;reviewText?:'full'|'excerpt';avatar?:'off'|'circle'|'square';namePrivacy?:boolean;showRating?:boolean;showDate?:boolean;showService?:boolean;showSource?:boolean;cardFace?:'filled'|'plain';cardPad?:'comfortable'|'compact';promise?:string;price?:string;oldPrice?:string;endDate?:string;badge?:string;address?:string;phone?:string;email?:string;hours?:string;indexLabel?:string;actionLabel?:string;allPhotosLabel?:string;catalogPageId?:string;before?:MediaSettings;after?:MediaSettings;beforeLabel?:string;afterLabel?:string;slideSeconds?:number;slideAdvance?:'time'|'end';slideFade?:number;slideAutoplay?:boolean;slideIndex?:number;mediaMode?:'image'|'video'|'slideshow';slideLoop?:boolean};
export type Block = {id:string;type:SectionId;layout:string;content:BlockContent;settings:SectionSettings;hidden?:boolean};
export const blockLayouts:Record<SectionId,readonly string[]> = {
 header:['standard','pill','rounded'],hero:['split','center','image','short','story'],logos:['Scrolling row','Still row','Heading and slider'],services:['Icon cards','Photo cards','Price list'],proof:['Text and photo','Promise band','Photo and reasons'],about:['Story and photos','Photos only'],pains:['Photo cards','One message'],solutions:['Numbered steps','Before and after'],trust:['Big numbers','Numbers and certifications','Signals'],reviews:['Review cards','One large quote','Carousel','Auto'],quote:['Photo beside the form'],faq:['Accordion','Two columns'],promo:['Offer band'],contact:['Details and map'],closing:['Quiet','Full color'],footer:['columns','minimal'],
};
export type IconName = "none" | "arrow" | "phone" | "calendar" | "mail" | "check" | "message" | "car" | "wrench" | "shield" | "star" | "pin" | "paint" | "gear" | "tow" | "battery" | "wheel" | "scan" | "glass";
export const icons: IconName[] = ["none", "arrow", "phone", "calendar", "mail", "check", "message", "car", "wrench", "shield", "star", "pin", "paint", "gear", "tow", "battery", "wheel", "scan", "glass"];
export type ButtonData = {
    label: string;
    href: string;
    icon: IconName;
    iconPosition?: "left" | "right";
};
export function buttonIconSide(button: Pick<ButtonData, "iconPosition">): "left" | "right" {
    return button.iconPosition === "left" ? "left" : "right";
}
export function validButton(button: unknown): button is ButtonData {
    if (!button || typeof button !== "object") return false;
    const value = button as Record<string, unknown>;
    return typeof value.label === "string" && typeof value.href === "string" && typeof value.icon === "string" && icons.includes(value.icon as IconName) && (value.iconPosition === undefined || value.iconPosition === "left" || value.iconPosition === "right");
}
export type Item = {
    title: string;
    description: string;
    icon: IconName;
    image?: string;
    tag?: string;
};
export type Extra = {
    title: string;
    description: string;
    items: Item[];
    image?: string;
};
export type Site = {
    blocks:Block[];
    sectionSettings?: Partial<Record<SectionId,SectionSettings>>;
    footerColumns?: FooterColumn[];
    sectionStyle?: Partial<Record<SectionId,{spacing:"compact"|"comfortable"|"spacious";align:"left"|"center"}>>;
    heroMedia?: MediaSettings;
    sectionMedia?: Partial<Record<SectionId, MediaSettings>>;
    brand: string;
    nav: string[];
    navTargets?: string[];
    navPageIds?:(string|null)[];
    headerStyle: "standard" | "pill" | "rounded";
    headerSticky?:boolean;
    headerOverlay?:boolean;
    headerBackground?:boolean;
    headerButtonCount?:0|1|2;
    headerButtonPlace?:"inside"|"beside";
    headerButtons?:ButtonData[];
    navChildren?:{label:string;href:string;pageId?:string}[][];
    footerStyle: "columns" | "minimal";
    eyebrow: string;
    headline: string;
    description: string;
    image: string;
    overlay: number;
    layout: "split" | "center" | "image";
    align: "left" | "center";
    primary: ButtonData;
    secondary: ButtonData;
    servicesTitle: string;
    services: {
        title: string;
        description: string;
        icon: IconName;
    }[];
    proofImage?: string;
    proofTitle: string;
    proofText: string;
    contactTitle: string;
    contactText: string;
    phone: string;
    email: string;
    address: string;
    ownerName?: string;
    mediaAlt: string;
    mediaKind: "image" | "video";
    seoTitle: string;
    seoDescription: string;
    accent: string;
    theme?: "midnight" | "paper";
    hidden: SectionId[];
    extras: Record<string, Extra>;
    contactSecondary: ButtonData;
};
const legacyInitial: Omit<Site,'blocks'> = {
    brand: "NORTHLINE", nav: ["Services", "Why us", "Contact"], headerStyle: "standard", footerStyle: "columns",
    eyebrow: "CHICAGO'S TRUSTED AUTO BODY SHOP", headline: "Your car deserves a better comeback.",
    description: "Collision repair, flawless paint, and honest answers. We make the entire process feel easy—from your first estimate to the final handoff.",
    image: "/media/showcase/highway-suv.jpg", overlay: 36,
    theme: "paper", layout: "image", align: "left", primary: { label: "Get a free estimate", href: "#contact", icon: "arrow" },
    secondary: { label: "Call the shop", href: "tel:+13125550184", icon: "phone" },
    servicesTitle: "Expert care. Every detail.", services: [
        { title: "Collision repair", description: "Precision structural and cosmetic repairs to get you safely back on the road.", icon: "car" },
        { title: "Paint & refinishing", description: "Color-matched finishes that look as good as the day you drove it home.", icon: "paint" },
        { title: "Dent removal", description: "Thoughtful, efficient solutions for everyday dents and dings.", icon: "wrench" },
    ], proofTitle: "Built on trust, not shortcuts.", proofText: "Clear estimates. Experienced technicians. Careful work. You’ll know what happens next at every step.",
    contactTitle: "Let's get your car back to its best.", contactText: "Tell us what happened. We'll help you find the right next step.",
    mediaAlt: "Vehicle at the body shop", mediaKind: "image", seoTitle: "Northline | Collision Repair", seoDescription: "Collision repair, paint and estimates from Northline.", phone: "+1 (312) 555-0184", email: "hello@example.com", address: "Chicago, Illinois", accent: "#7963ff", hidden: [], contactSecondary: { label: "Call the shop", href: "tel:+13125550184", icon: "phone" },
    extras: {
        logos: { title: "Trusted by our community", description: "Brands and partners we work with", items: ["Audi", "BMW", "Mercedes-Benz", "Porsche", "Tesla", "Volvo", "Land Rover"].map(title => ({ title, description: "", icon: "none" as const })) },
        about: { title: "Meet the people behind the work", description: "Real technicians, a real shop, and a commitment to doing things right.", items: [{ title: "Our team", description: "Experienced specialists who care about every detail.", icon: "check" }, { title: "Our workshop", description: "Modern equipment and a transparent process.", icon: "check" }] },
        pains: { title: "What gets in the way.", description: "Unexpected delays, hidden supplements, and insurer red tape shouldn't define your collision repair.", items: [{ title: "Moving deadlines", description: "Parts delays and a lack of communication leave rental clocks ticking down while your vehicle sits disassembled.", icon: "calendar", tag: "The hassle", image: "/media/ai-images/rental-delay.jpg" }, { title: "Estimate creep", description: "Initial quotes that balloon unexpectedly at vehicle pickup due to undocumented labor rates and unapproved parts supplements.", icon: "check", tag: "Surprise costs", image: "/media/ai-images/estimate-stress.jpg" }, { title: "Flawed finishes", description: "Noticeable color mismatches, clear-coat peeling, and rough texture from non-certified spray environments.", icon: "paint", tag: "Poor quality", image: "/media/ai-images/paint-flaw.jpg" }] },
        solutions: { title: "A clear path back to the road", description: "From your first call to the final inspection.", items: ["Tell us what happened", "Receive your estimate", "Approve the plan", "We complete the repair", "Drive away confidently"].map(title => ({ title, description: "", icon: "check" })) },
        trust: { title: "Confidence comes from evidence", description: "Show real credentials, warranty terms, and documented results.", items: [{ title: "Experienced team", description: "Meet our specialists", icon: "check" }, { title: "Clear estimates", description: "Know before we begin", icon: "check" }, { title: "Quality checks", description: "Every detail matters", icon: "check" }] },
        reviews: { title: "What customers say", description: "Replace these examples with authentic, attributed reviews before publishing.", items: [{ title: "Customer review", description: "Add a real customer's review and permission to display it.", icon: "message" }] },
        quote: { title: "Request your estimate", description: "Tell us about your vehicle and how to reach you.", items: [] },
        faq: { title: "Frequently asked questions", description: "Answers before you visit.", items: [{ title: "How do I get started?", description: "Contact us and describe the repair you need.", icon: "message" }, { title: "How long will repairs take?", description: "We will discuss a timeline after inspecting your vehicle.", icon: "calendar" }, { title: "Do you provide written estimates?", description: "Ask our team about the estimate process.", icon: "check" }] },
        promo: { title: "Seasonal service offer", description: "Add a real offer, price, expiry date, and terms before publishing.", items: [{ title: "Ask about current offers", description: "Contact us for availability and details.", icon: "arrow" }] },
        closing: { title: "Ready to get started?", description: "Get in touch today and take the next step.", items: [] },
    },
};

export const workshop='/media/showcase/workshop-bay.jpg';
export const detailPhoto='/media/showcase/diagnostic-scanner.jpg';
const still = (src:string, alt:string): MediaSettings => ({...mediaDefaults, src, alt, kind:'image'});
const clip = (src:string, poster:string, alt:string): MediaSettings => {
  const {playback, clickToPlay, ...stored} = {...mediaDefaults, src, poster, alt, kind:'video' as const, autoplay:true, muted:true, loop:true, controls:false};
  void playback; void clickToPlay;
  return stored as MediaSettings;
};
export const shopServices: {title:string;description:string;icon:IconName;media:MediaSettings}[] = [
  {title:'Collision repair', description:'Frame and body restored to factory specs after any accident.', icon:'car', media:clip('/media/ai-images/alfa-romeo-bumper.mp4','/media/showcase/bodywork-door-repair.jpg','Collision repair')},
  {title:'Paint & refinishing', description:'Computer colour matching and a showroom finish.', icon:'paint', media:still('/media/ai-images/promo-bg.jpg','Paint and refinishing')},
  {title:'Dent removal', description:'Paintless repair for hail damage and parking dents.', icon:'wrench', media:still('/media/showcase/workshop-bay.jpg','Dent removal')},
  {title:'Insurance claims', description:'We handle the paperwork directly with your insurer.', icon:'shield', media:still('/media/showcase/service-authorization.jpg','Insurance claims')},
  {title:'24/7 towing', description:'Roadside pickup and transport to our workshop.', icon:'tow', media:still('/media/showcase/highway-suv.jpg','24/7 towing')},
  {title:'Windshield & glass', description:'Chip repair and full windshield replacement.', icon:'glass', media:clip('/media/ai-images/mirror-camera.mp4','/media/showcase/driver-cockpit.jpg','Windshield and glass')},
  {title:'Frame & suspension', description:'Alignment checks after impacts and potholes.', icon:'wrench', media:still('/media/showcase/diagnostic-scanner.jpg','Frame and suspension')},
  {title:'Courtesy car', description:'Keep moving while we repair your vehicle.', icon:'car', media:still('/media/showcase/mountain-road.jpg','Courtesy car')},
  {title:'Battery & electrics', description:'Testing, replacement and electrical repairs.', icon:'battery', media:still('/media/showcase/ac-service.jpg','Battery and electrics')},
  {title:'Wheels & tyres', description:'Rim repair, tyre fitting and balancing.', icon:'wheel', media:still('/media/ai-images/tyres.jpg','Wheels and tyres')},
  {title:'ADAS calibration', description:'Digital camera and radar sensor recalibration.', icon:'scan', media:still('/media/ai-images/hero-2.jpg','ADAS calibration')},
];
export function servicePreviewCount(columns = 3) { return columns >= 4 ? 4 : 6; }
const serviceStories:Record<string,{heading:string;overview:string;included:[string,string,string];process:string;steps:[string,string][]}> = {
  'Collision repair':{heading:'Get back on the road with confidence.',overview:'We measure the frame, repair the structure, and refinish the panels here. You approve the written estimate before work starts.',included:['Frame measurement','Parts matched to the vehicle','Final safety check'],process:'How collision repair works',steps:[['Inspect the damage','We record what the collision changed.'],['Agree the estimate','Work starts after you approve the cost.'],['Repair the structure','Frame and panels are brought back to spec.'],['Refinish and fit','Paint, parts, and gaps are checked together.'],['Final inspection','You see the finished vehicle before pickup.']]},
  'Paint & refinishing':{heading:'A finish that matches the rest of the car.',overview:'Colour is read from your vehicle, then sprayed and cleared in a controlled booth.',included:['Computer colour match','Clear coat','Blend into nearby panels'],process:'How refinishing works',steps:[['Read the colour','We match the existing paint, not a generic code.'],['Prepare the panels','Edges are feathered so the repair does not show.'],['Spray and bake','Base and clear go on in the booth.'],['Check in daylight','You see the match before the car leaves.']]},
  'Dent removal':{heading:'Dents out, paint left in place.',overview:'Paintless repair lifts hail dings and parking dents when the paint is still intact.',included:['Paintless dent repair','Hail assessment','Panel access from behind'],process:'How dent removal works',steps:[['Check the paint','If it is cracked, we say so before we start.'],['Access the panel','Tools work from behind the metal.'],['Lift the dent','The panel is worked back to shape.'],['Review the finish','You inspect it in the light.']]},
  'Insurance claims':{heading:'The paperwork stays with the shop.',overview:'We document the damage and talk to your insurer. You still approve what gets repaired.',included:['Photo record of the damage','Direct insurer contact','A written repair list'],process:'How a claim moves',steps:[['Open the claim','Bring the insurer details with the vehicle.'],['Document the damage','Photos and notes go to the insurer.'],['Agree the repair','You see the list before work starts.'],['Close the file','We confirm what was completed.']]},
  '24/7 towing':{heading:'From the roadside to this workshop.',overview:'We collect the vehicle and bring it here. The repair estimate happens at the shop, not on the road.',included:['Roadside pickup','Transport to the workshop','Handoff to the repair team'],process:'How towing works',steps:[['Call with your location','Tell us where the vehicle is and whether it rolls.'],['We dispatch a truck','Pickup is arranged around the clock.'],['Delivered to the shop','The car is checked in on arrival.'],['Estimate next','Repair work waits for your approval.']]},
  'Windshield & glass':{heading:'Chip repair or a new windshield.',overview:'Small chips are filled. A cracked screen is replaced, then the fit is checked.',included:['Chip fill','Windshield replacement','Leak and fit check'],process:'How glass repair works',steps:[['Look at the damage','A chip and a crack need different work.'],['Choose the repair','We tell you which one will hold.'],['Repair or replace','The glass is filled or fitted.'],['Check the seal','Water and wind noise are the test.']]},
  'Frame & suspension':{heading:'Straight, then aligned.',overview:'After an impact or a hard pothole, we measure the frame and check the suspension before aligning the wheels.',included:['Frame measurement','Suspension check','Wheel alignment'],process:'How the check works',steps:[['Measure the frame','The numbers show what moved.'],['Inspect the suspension','Arms, mounts, and dampers are checked.'],['Align the wheels','Alignment follows the structural work.'],['Road check','We confirm it tracks straight.']]},
  'Courtesy car':{heading:'Keep moving while yours is here.',overview:'A courtesy car is offered when we have one free and the repair will keep yours overnight.',included:['Availability check','Handover at the shop','Return when you collect'],process:'How a courtesy car works',steps:[['Ask when you book','We confirm if a car is free.'],['Agree the terms','You see the conditions before you take it.'],['Collect the keys','Handover is at the workshop.'],['Return at pickup','The courtesy car comes back with yours.']]},
  'Battery & electrics':{heading:'Test first, then replace.',overview:'We test the battery and the charging circuit before recommending a replacement.',included:['Battery test','Charging check','Replacement when it fails'],process:'How electrical checks work',steps:[['Test the battery','A weak cell is not always the fault.'],['Check the alternator','The charging circuit is measured.'],['Replace only if needed','You approve the part first.'],['Confirm the start','The car is started before handover.']]},
  'Wheels & tyres':{heading:'Round wheels, balanced tyres.',overview:'We repair rims when the damage allows it, and fit and balance tyres to the vehicle.',included:['Rim inspection','Tyre fitting','Balance'],process:'How wheel work happens',steps:[['Inspect the rim','A crack is not the same as a scuff.'],['Repair or replace','We say which one is safe.'],['Fit the tyre','Size and load rating match the car.'],['Balance the wheel','It is checked before it goes back on.']]},
  'ADAS calibration':{heading:'Cameras and radar aimed again.',overview:'After glass or bumper work, the camera and radar are calibrated to the vehicle maker’s target.',included:['Camera calibration','Radar calibration','A printed result'],process:'How calibration works',steps:[['Identify the sensors','Glass and bumper jobs disturb different ones.'],['Set the targets','The bay is set to the vehicle spec.'],['Run the calibration','The sensor is aimed and saved.'],['Give you the result','You leave with the completed reading.']]},
};
function serviceStory(item:BlockItem) {
  const known=serviceStories[item.title],name=item.title;
  return {intro:item.description,heading:known?.heading||`${name} at this workshop.`,overview:known?.overview||item.description,included:known?.included||['A written estimate','Work done in our workshop','A final inspection'] as [string,string,string],process:known?.process||`How ${name.toLowerCase()} works`,steps:known?.steps||[['Tell us what happened','We inspect the vehicle first.'],['Approve the estimate','Work waits for your yes.'],['We do the work','It stays in this workshop.'],['Collect the vehicle','You check it before you leave.']],faqs:[[`How do I start ${name.toLowerCase()}?`,'Call the shop or request an estimate. We look at the vehicle before we promise a time.'],[`How long does ${name.toLowerCase()} take?`,'The inspection sets the timeline. We tell you if parts will change it.'],['Do I approve the cost first?','Yes. Work starts after you approve the written estimate.'],['Who do I talk to?','One person at the shop follows it from the estimate to pickup.']] as [string,string][]};
}
export function legacyHero(site:Omit<Site,'blocks'>):MediaSettings {return {...mediaDefaults,src:site.image,kind:site.mediaKind==='video'?(socialEmbed(site.image).src?'social':'video'):'image',alt:site.mediaAlt};}
export function blockFromLegacy(site:Omit<Site,'blocks'>,type:SectionId):Block {
 const extra=site.extras[type],content:BlockContent={smallLabel:'',title:extra?.title||'',description:extra?.description||'',items:extra?.items.map(item=>({...item,media:item.image?{...mediaDefaults,src:item.image,alt:item.title}:undefined}))||[],media:site.sectionMedia?.[type]||{...mediaDefaults,src:extra?.image||'',alt:extra?.title||''},buttons:[],facts:[],note:'',formButton:'',consent:'',fields:[]};
 if(type==='hero')Object.assign(content,{smallLabel:site.eyebrow,title:site.headline,description:site.description,media:site.heroMedia||legacyHero(site),buttons:[site.primary,site.secondary],facts:['Clear estimates','Local experts','Quality first'],indexLabel:'01 / BUILT WITH CARE',align:site.align,darkness:site.overlay,showSecondary:true,height:'standard'});
 if(type==='services')Object.assign(content,{smallLabel:'Our services',title:'Everything your car needs after an accident.',description:'From the first call to the final polish, one workshop takes care of it all.',items:shopServices.map(item=>({title:item.title,description:item.description,icon:item.icon,media:item.media})),actionLabel:'Learn more'});
 if(type==='proof')Object.assign(content,{smallLabel:'The Northline difference',title:site.proofTitle,description:site.proofText,facts:['Transparent process','Quality craftsmanship','People-first service'],media:site.sectionMedia?.proof||{...mediaDefaults,src:site.proofImage||workshop,alt:site.proofTitle},note:'CRAFT / CARE / CONFIDENCE'});
 if(type==='about'){content.smallLabel='About';content.items=content.items.map((item,i)=>({...item,caption:i?'Care in every detail':'Inside the workshop',media:item.media||{...mediaDefaults,src:i?detailPhoto:extra?.image||workshop,alt:item.title}}));}
 if(type==='quote')Object.assign(content,{media:site.sectionMedia?.quote||{...mediaDefaults,src:extra?.image||workshop,alt:extra?.title||''},note:'Demo form — submissions are not sent or stored.',formButton:'Request estimate',consent:'I agree to be contacted about this request.',fields:[{label:'Name',type:'text',required:true},{label:'Phone or email',type:'text',required:true},{label:'What do you need?',type:'textarea',required:false}]});
 if(type==='contact')Object.assign(content,{smallLabel:'Your next step',title:site.contactTitle,description:site.contactText,buttons:[site.primary,site.contactSecondary],address:site.address,phone:site.phone,email:site.email,hours:''});
 if(['pains','faq','closing'].includes(type))content.buttons=[site.primary];
 if(type==='pains'){content.smallLabel=content.smallLabel||'Common industry pitfalls';content.items=content.items.map((item,i)=>({...item,tag:item.tag||['The hassle','Surprise costs','Poor quality'][i]||'',media:item.media?.src&&!item.media.src.includes('unsplash.com')?item.media:{...mediaDefaults,src:['/media/ai-images/rental-delay.jpg','/media/ai-images/estimate-stress.jpg','/media/ai-images/paint-flaw.jpg'][i]||workshop,alt:item.title,kind:'image'}}));}
 if(type==='faq')content.smallLabel='Good to know';
 if(type==='trust')content.items=content.items.map(item=>({...item,note:item.description}));
 if(type==='footer')content.note=`Copyright 2026 ${site.brand}. All rights reserved. Privacy - Terms`;
 if(type==='promo'){content.buttons=[site.primary,site.secondary];content.note=content.items.map(item=>[item.title,item.description].filter(Boolean).join('\n')).join('\n');}
 return {id:type,type,layout:type==='hero'?site.layout:type==='header'?headerLook(site.headerStyle):type==='footer'?site.footerStyle:blockLayouts[type][0],content,settings:site.sectionSettings?.[type]||{padding:site.sectionStyle?.[type]?.spacing==='compact'?48:site.sectionStyle?.[type]?.spacing==='spacious'?112:undefined,heading:{align:site.sectionStyle?.[type]?.align},body:{align:site.sectionStyle?.[type]?.align},columns:['proof','contact','quote','closing'].includes(type)?2:defaultColumns(type)},hidden:site.hidden.includes(type)};
}
export function fixedBlockOrder(blocks:Block[]):Block[] {return [...blocks].sort((a,b)=>catalog.findIndex(s=>s.id===a.type)-catalog.findIndex(s=>s.id===b.type));}
function legacyMedia(src?:string) { return src==='https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1800&q=85'; }
const legacyPainItems=[
  {title:'Unclear timelines',description:'Know what happens next.',nextTitle:'Moving deadlines',nextDescription:'Parts delays and a lack of communication leave rental clocks ticking down while your vehicle sits disassembled.'},
  {title:'Surprise costs',description:'Understand your estimate.',nextTitle:'Estimate creep',nextDescription:'Initial quotes that balloon unexpectedly at vehicle pickup due to undocumented labor rates and unapproved parts supplements.'},
  {title:'Uncertain quality',description:'See our standards and workmanship.',nextTitle:'Flawed finishes',nextDescription:'Noticeable color mismatches, clear-coat peeling, and rough texture from non-certified spray environments.'},
] as const;
const painShots=['/media/ai-images/rental-delay.jpg','/media/ai-images/estimate-stress.jpg','/media/ai-images/paint-flaw.jpg'];
function migratePainItem(item:BlockItem,index:number):BlockItem {
  const pair=legacyPainItems.find(row=>row.title===item.title&&row.description===item.description);
  const next=pair?{...item,title:pair.nextTitle,description:pair.nextDescription,tag:item.tag||['The hassle','Surprise costs','Poor quality'][index]||''}:item;
  const shot=painShots[index];
  return shot&&legacyMedia(next.media?.src)?{...next,media:{...mediaDefaults,...next.media,src:shot,alt:next.title,kind:'image' as const}}:next;
}
const storyReel=['/media/ai-images/mountain-sports-car.mp4','/media/ai-images/mirror-camera.mp4','/media/ai-images/alfa-romeo-bumper.mp4'];
export function storyHeroMedia(content:BlockContent):Pick<BlockContent,'media'|'slides'> {
  const road='/media/ai-images/driving_in_winding_mountain_road.mp4',known=legacyMedia(content.media.src)||['/media/showcase/highway-suv.jpg','/media/ai-images/mountain-sports-car.mp4'].includes(content.media.src);
  const slides=(content.slides||[]).filter(slide=>slide.src);
  return {media:known?clip(road,'/media/showcase/mountain-road.jpg','Driving a winding mountain road'):content.media,slides:slides.length?content.slides:storyReel.map((src,i)=>clip(src,['/media/showcase/mountain-road.jpg','/media/showcase/driver-cockpit.jpg','/media/showcase/bodywork-door-repair.jpg'][i],['Sports car on a mountain road','Mirror camera','Bumper repair'][i]))};
}
const reasonCopy:Record<string,string>={'Transparent process':'You see the estimate, the photos, and each update before any work starts.','Quality craftsmanship':'Panels, paint, and fit are checked before the car comes back to you.','People-first service':'One shop explains the repair in plain language and stays easy to reach.','Written estimates':'The price is written down, and extra work waits for your yes.','Paint matched to your car':'The colour is compared with your car before the panels go back on.','A day to collect it':'After the inspection you get a pickup day, and we call if parts change it.'};
const starterReasons=['Transparent process','Quality craftsmanship','People-first service'];
const moreReasons:BlockItem[]=[{title:'Written estimates',description:'',icon:'check'},{title:'Paint matched to your car',description:'',icon:'paint'},{title:'A day to collect it',description:'',icon:'calendar'}];
export function proofReasonContent(content:BlockContent):BlockContent {
  const reasons=content.items.filter(item=>item.group!=='stat'&&item.group!=='avatar'&&item.group!=='more'),stats=content.items.filter(item=>item.group==='stat');
  const seeded=reasons.length?reasons:content.facts.filter(Boolean).slice(0,3).map((title,i)=>({title,description:'',icon:(['message','wrench','star'] as const)[i]||'check'}));
  const withMore=seeded.length<=3&&seeded.every(item=>starterReasons.includes(item.title))?[...seeded,...moreReasons.filter(item=>!seeded.some(have=>have.title===item.title))].slice(0,6):seeded;
  const mock=[{title:'Vehicles restored',description:'',icon:'none' as const,group:'stat',value:'5,000+'},{title:'Customer rating',description:'',icon:'none' as const,group:'stat',value:'4.9/5'}];
  const savedFaces=content.items.filter(item=>item.group==='avatar'),savedMore=content.items.find(item=>item.group==='more');
  const faces=(savedFaces.length?savedFaces:[{title:'Casey Nguyen',description:'',icon:'none' as const,group:'avatar'},{title:'Luis Romero',description:'',icon:'none' as const,group:'avatar'},{title:'Elena Rossi',description:'',icon:'none' as const,group:'avatar'}]).slice(0,3).map((item,i)=>({...item,media:item.media?.src?item.media:(content.slides||[])[i]?.src?(content.slides||[])[i]:item.media}));
  return {...content,items:[...withMore.map(item=>item.description.trim()||!reasonCopy[item.title]?item:{...item,description:reasonCopy[item.title]}),...(stats.length?stats:mock),...faces,savedMore||{title:'',description:'',icon:'none',group:'more',value:'4'}],buttons:content.buttons.length?content.buttons:[{label:'See why clients choose us',href:'#reviews',icon:'arrow'},{label:'Our process',href:'#solutions',icon:'arrow'}],buttonCount:content.buttonCount??2};
}
const signalStarter:BlockItem[]=[
  {title:'Experienced team',description:'A team that cares about every detail.',icon:'wrench',note:'A team that cares about every detail.'},
  {title:'Clear estimates',description:'Know what to expect before we begin.',icon:'check',note:'Know what to expect before we begin.'},
  {title:'Quality checks',description:'Every repair is inspected before the car goes back.',icon:'shield',note:'Every repair is inspected before the car goes back.'},
];
export function trustSignalContent(content:BlockContent):BlockContent {
  if(content.smallLabel.trim()||content.title.trim()||content.description.trim()||content.items.length||content.media?.src)return content;
  return {...content,smallLabel:'Trust signals',title:'Confidence comes\nfrom evidence.',description:'Real qualifications, transparent processes, and documented results. No guesswork, no surprises.',items:signalStarter.map(item=>({...item}))};
}
export function sectionIsBlank(content:BlockContent):boolean {
  const text=(value?:string)=>!value?.trim();
  return text(content.smallLabel)&&text(content.title)&&text(content.description)&&!content.items?.length&&!content.media?.src&&!(content.slides||[]).some(slide=>slide.src)&&!(content.buttons||[]).some(button=>button.label?.trim()||button.href?.trim())&&!(content.facts||[]).some(fact=>fact?.trim());
}
export function contentForLayout(block:Block,layout:string):BlockContent {
  const content=block.content;
  if(!sectionIsBlank(content))return content;
  if(block.type==='hero'&&layout==='story'&&block.id==='hero')return {...content,...storyHeroMedia(content),showSecondary:true,factIcons:content.factIcons?.length?content.factIcons:['shield','gear','star']};
  if(block.type==='hero'&&!['short','center'].includes(layout))return {...content,showSecondary:true};
  if(block.type==='proof'&&layout==='Photo and reasons')return proofReasonContent(content);
  if(block.type==='logos'&&layout==='Heading and slider')return logoBandContent(content);
  if(block.type==='trust'&&layout==='Signals')return trustSignalContent(content);
  return content;
}
const singleColumnLayouts=['Price list','Promise band','One message','One large quote','Accordion','Scrolling row','Heading and slider','Signals'];
export function settingsForLayout(type:string,layout:string,settings:SectionSettings):SectionSettings {
  const count=singleColumnLayouts.includes(layout)?1:layout==='Two columns'?2:defaultColumns(type);
  if(settings.columns===count&&settings.widths?.length===count)return settings;
  return {...settings,columns:count,widths:equalWidths(count)};
}
export function logoBandContent(content:BlockContent):BlockContent {
  return {...content,smallLabel:content.smallLabel.trim()?content.smallLabel:'Trust',title:content.title==='Trusted by our community'?'Trusted by\nour community':content.title,description:content.description==='Brands and partners we work with'?"We're proud to work with individuals, families, and local businesses across Chicago and the surrounding areas.":content.description};
}
export function applyIndustryMedia(block:Block):Block {
  const content={...block.content,items:block.content.items.map(item=>({...item}))};
  if(block.type==='services'){
    const legacyTitles=['Collision repair','Paint & refinishing','Dent removal'];
    const legacyDescriptions=['Precision structural and cosmetic repairs to get you safely back on the road.','Color-matched finishes that look as good as the day you drove it home.','Thoughtful, efficient solutions for everyday dents and dings.'];
    const legacyTitlesMatch=content.items.length===3&&content.items.every((item,i)=>item.title===legacyTitles[i]);
    const legacyCopyMatch=legacyTitlesMatch&&content.items.every((item,i)=>item.description===legacyDescriptions[i]);
    if(legacyTitlesMatch){
      if(content.title==='Expert care. Every detail.')content.title='Everything your car needs after an accident.';
      if(!content.description||content.description==='Every vehicle has a story. We help you get back to yours.')content.description='From the first call to the final polish, one workshop takes care of it all.';
      if(!content.smallLabel||content.smallLabel==='What we do')content.smallLabel='Our services';
      if(legacyCopyMatch)content.items=shopServices.map(item=>({title:item.title,description:item.description,icon:item.icon,pageId:content.items.find(saved=>saved.title===item.title)?.pageId,media:item.media}));
    }
    if(!content.actionLabel||content.actionLabel==='Explore service')content.actionLabel='Learn more';
    content.items=content.items.map(item=>{const known=shopServices.find(service=>service.title===item.title);return known&&legacyMedia(item.media?.src)?{...item,media:known.media}:item;});
  }
  if(block.type==='hero'&&block.id==='hero'&&block.layout==='story'){const film=storyHeroMedia(content);content.media=film.media;content.slides=film.slides;}
  else if(block.type==='hero'&&block.id==='hero'&&(legacyMedia(content.media.src)||content.media.src==='/media/showcase/highway-suv.jpg'))content.media=clip('/media/ai-images/mountain-sports-car.mp4','/media/showcase/mountain-road.jpg',content.title||'Sports car on a mountain road');
  if(block.type==='proof'&&legacyMedia(content.media.src))content.media=still(workshop,'Workshop bay');
  if(block.type==='proof'&&block.layout==='Photo and reasons'&&sectionIsBlank(content))Object.assign(content,proofReasonContent(content));
  if(block.type==='logos'&&content.items.length===3&&content.items.every((item,i)=>item.title===['Certified repair','Insurance partners','Local business'][i]&&!item.media?.src))content.items=['Audi','BMW','Mercedes-Benz','Porsche','Tesla','Volvo','Land Rover'].map(title=>({title,description:'',icon:'none' as const}));
  if(block.type==='quote'&&legacyMedia(content.media.src))content.media=still('/media/ai-images/repair-bench.jpg','Repair bench');
  if(block.type==='promo'&&legacyMedia(content.media.src))content.media=still('/media/ai-images/promo-bg.jpg','Seasonal workshop offer');
  if(block.type==='contact'&&legacyMedia(content.media.src))content.media=still('/media/showcase/mountain-road.jpg','Open road');
  if(block.type==='contact'&&block.id==='contact')content.hours=contactHours(content.hours);
  if(block.type==='about')content.items=content.items.map((item,i)=>legacyMedia(item.media?.src)?{...item,media:still(i?'/media/showcase/diagnostic-scanner.jpg':'/media/showcase/bodywork-door-repair.jpg',item.title)}:item);
  if(block.type==='solutions'){if(legacyMedia(content.before?.src))content.before=still('/media/ai-images/before-repair.jpeg','Before the repair');if(legacyMedia(content.after?.src))content.after=still('/media/ai-images/after-repair.jpeg','After the repair');if(block.id==='solutions'&&block.layout==='Numbered steps')content.items=content.items.map((item,i)=>{const file=['Documenting Damage on a Luxury Sedan.png','Inspecting Automotive Damage in the Workshop.png','Digital Car Repair Consultation.png','Precision Auto Body Repair in a Modern Garage.png','Luxury Sedan in a Sunset Garage.png'][i];const src=file?`/media/ai-images/${file}`:'';return src&&legacyMedia(item.media?.src)?{...item,media:{...still(src,item.title),ratio:'4/3'}}:item;});}
  if(block.type==='pains')content.items=content.items.map((item,i)=>{const shot=['/media/ai-images/rental-delay.jpg','/media/ai-images/estimate-stress.jpg','/media/ai-images/paint-flaw.jpg'][i];return shot&&legacyMedia(item.media?.src)?{...item,media:still(shot,item.title)}:item;});
  return {...block,content};
}
export function migrateSite(site:Omit<Site,'blocks'>&{blocks?:Block[]}):Site {return {...site,footerColumns:site.footerColumns||[{title:site.brand,text:'Good work. Good people. A better way forward.',links:[]},{title:'Explore',text:'',links:catalog.filter(s=>!site.hidden.includes(s.id)&&['services','proof','about','contact'].includes(s.id)).map(s=>({label:s.label,href:`#${s.id}`}))},{title:'Get in touch',text:[site.address,site.phone,site.email].join('\n'),links:[]}],blocks:fixedBlockOrder((site.blocks?site.blocks.map(block=>({...block,layout:block.type==='header'?headerLook(site.headerStyle):block.type==='footer'?site.footerStyle:block.layout,content:{...block.content,title:block.type==='pains'&&block.content.title==="Repairs shouldn't add more stress"?'What gets in the way.':block.content.title,description:block.type==='pains'&&block.content.description==="We understand what matters when your vehicle is off the road."?"Unexpected delays, hidden supplements, and insurer red tape shouldn't define your collision repair.":block.content.description,smallLabel:block.type==='pains'&&!block.content.smallLabel?'Common industry pitfalls':block.content.smallLabel,media:legacyMedia(block.content.media?.src)?{...block.content.media,src:block.type==='hero'?'/media/showcase/highway-suv.jpg':block.type==='quote'?'/media/ai-images/repair-bench.jpg':workshop,kind:'image'}:block.content.media,items:block.type==='pains'?block.content.items.map((item,i)=>migratePainItem(item,i)):block.content.items,buttons:['hero','pains','faq','promo','contact','closing','proof'].includes(block.type)?block.content.buttons:[]},settings:normalizeSettings(block.settings)})):catalog.map(section=>blockFromLegacy(site,section.id))).map(block=>applyIndustryMedia(block as Block)))};}
export const initial:Site=migrateSite(legacyInitial);
export function makeBlock(type:SectionId):Block {const block=blockFromLegacy(legacyInitial,type);return {...structuredClone(block),id:crypto.randomUUID(),hidden:false};}
export const pageStarters={service:['hero','services','faq','quote','contact'],offer:['hero','promo','quote','contact'],story:['hero','about','reviews','contact'],empty:['hero']} satisfies Record<string,SectionId[]>;
export function starterBlocks(kind:keyof typeof pageStarters,name:string,home:Site):Block[] {return fixedBlockOrder([home.blocks.find(b=>b.type==='header'),...pageStarters[kind].map(type=>{const block=makeBlock(type);if(type==='hero'){block.layout='short';block.content.title=name;block.content.showSecondary=false;}return block;}),home.blocks.find(b=>b.type==='footer')].filter((b):b is Block=>!!b).map(b=>structuredClone(b)));}
function servicePageSite(home:Site,item:BlockItem):Site {
  const story=serviceStory(item),photo=still(item.media?.poster||(item.media?.kind==='image'?item.media.src:'')||workshop,item.title),blocks=starterBlocks('empty',item.title,home),hero=blocks.find(b=>b.type==='hero')!;
  const buttons:ButtonData[]=[{label:'Request an estimate',href:'#closing',icon:'arrow'},{label:'Call the shop',href:home.secondary.href||`tel:${home.phone.replaceAll(' ','')}`,icon:'phone'}];
  Object.assign(hero.content,{smallLabel:'Our services',title:item.title,description:story.intro,facts:[],indexLabel:'',showSecondary:true,buttons,media:photo,darkness:48,height:'standard'});
  hero.layout='short';
  const section=(type:SectionId,padding:number,columns:number)=>{const block=makeBlock(type);block.settings={...block.settings,padding,columns};return block;};
  const proof=section('proof',40,2);proof.layout='Text and photo';Object.assign(proof.content,{smallLabel:item.title,title:story.heading,description:story.overview,facts:[...story.included],note:'',media:photo,buttons:[]});
  const steps=section('solutions',32,Math.min(5,story.steps.length));steps.layout='Numbered steps';Object.assign(steps.content,{smallLabel:'Our process',title:story.process,description:'',items:story.steps.map(([title,description])=>({title,description,icon:'check' as const})),buttons:[]});
  const results=section('solutions',32,2);results.layout='Before and after';Object.assign(results.content,{smallLabel:'Before and after',title:'See the results',description:'',facts:[],items:[],before:still('/media/ai-images/before-repair.jpeg','Before the repair'),after:still(item.title==='Collision repair'?'/media/ai-images/after-repair.jpeg':photo.src,'After the repair'),beforeLabel:'Before',afterLabel:'After',buttons:[]});
  const faq=section('faq',36,1);faq.layout='Accordion';Object.assign(faq.content,{smallLabel:'Good to know',title:'Frequently asked questions',description:'',items:story.faqs.map(([title,description])=>({title,description,icon:'message' as const})),buttons:[]});
  const closing=section('closing',24,1);closing.layout='Quiet';Object.assign(closing.content,{smallLabel:'',title:'Request an estimate',description:`Call ${home.phone} or request an estimate. We inspect the vehicle before any work starts.`,buttons,showSecondary:true});
  blocks.splice(-1,0,proof,steps,results,faq,closing);
  return {...structuredClone(home),blocks:fixedBlockOrder(blocks),headline:item.title,seoTitle:`${item.title} | ${home.brand}`,seoDescription:story.intro};
}
function catalogPageSite(home:Site,items:BlockItem[]):Site {
  const blocks=starterBlocks('service','All services',home);
  const hero=blocks.find(b=>b.type==='hero');
  if(hero){hero.layout='image';hero.content.smallLabel='Our services';hero.content.title='All services';hero.content.description='Every repair we take on, from the first call to the final polish.';hero.content.showSecondary=false;hero.content.media=still(workshop,'Workshop bay');}
  const services=blocks.find(b=>b.type==='services');
  if(services){services.hidden=false;services.layout='Icon cards';services.content={...services.content,smallLabel:'Our services',title:'Everything your car needs after an accident.',description:'Choose a service to see how the workshop handles it.',items:items.map(item=>({...item})),actionLabel:'Learn more'};services.settings={...services.settings,columns:3};}
  return {...structuredClone(home),blocks,headline:'All services',seoTitle:`All services | ${home.brand}`,seoDescription:'Every repair we take on, from the first call to the final polish.'};
}
export function syncServicePages<T extends {id:string;name:string;slug?:string;site:Site}>(pages:T[],homeId:string):T[]|null {
  const home=pages.find(p=>p.id===homeId);if(!home)return null;
  const block=home.site.blocks.find(b=>b.type==='services');if(!block)return null;
  const titled=block.content.items.filter(item=>item.title.trim());if(!titled.length)return null;
  const cap=servicePreviewCount(block.settings.columns);
  const catalog=pages.find(p=>p.id===block.content.catalogPageId);
  const missing=titled.some(item=>!item.pageId||!pages.some(p=>p.id===item.pageId));
  const needCatalog=titled.length>cap&&!catalog;
  const catalogGrid=catalog?.site.blocks.find(b=>b.type==='services');
  const signature=(items:BlockItem[])=>JSON.stringify(items.map(item=>({title:item.title,description:item.description,icon:item.icon,pageId:item.pageId,src:item.media?.src})));
  const catalogStale=!!catalog&&(!catalogGrid||catalogGrid.hidden===true||signature(catalogGrid.content.items)!==signature(titled));
  const shot=(item:BlockItem)=>item.media?.kind==='video'?item.media.poster||'':item.media?.src||'';
  const oldService=(page?:T)=>!!page&&page.site.blocks.find(b=>b.type==='hero')?.layout==='image'&&!page.site.blocks.some(b=>b.type==='proof');
  const mediaStale=titled.some(item=>{const hero=pages.find(p=>p.id===item.pageId)?.site.blocks.find(b=>b.type==='hero');const src=shot(item);return !!src&&!!hero&&hero.layout==='short'&&hero.content.media.src.startsWith('/media/')&&hero.content.media.src!==src;});
  const templateStale=titled.some(item=>oldService(pages.find(p=>p.id===item.pageId)));
  if(!missing&&!needCatalog&&!catalogStale&&!mediaStale&&!templateStale)return null;
  let next=pages.map(p=>({...p,site:structuredClone(p.site)})) as T[];
  const used=new Set(next.map(p=>p.slug||pageSlug(p.name)));
  const homeNext=next.find(p=>p.id===homeId)!;
  const services=homeNext.site.blocks.find(b=>b.type==='services')!;
  const add=(name:string,build:(source:Site)=>Site)=>{if(next.length>=30)return;const id=crypto.randomUUID(),slug=pageSlug(name,[...used]);used.add(slug);const page={id,name,slug,site:build(homeNext.site)} as T;next=[...next,page];return page;};
  services.content.items=services.content.items.map(item=>{
    if(!item.title.trim())return item;
    const found=item.pageId?next.find(p=>p.id===item.pageId):undefined;
    const page=found||add(item.title,source=>servicePageSite(source,item));
    if(!page)return item;
    if(oldService(page)){page.site=servicePageSite(homeNext.site,item);const hero=page.site.blocks.find(b=>b.type==='hero');if(hero&&page.name!==item.title)hero.content.title=page.name;}
    const hero=page.site.blocks.find(b=>b.type==='hero'),src=shot(item);
    if(hero?.layout==='short'&&src&&hero.content.media.src.startsWith('/media/')&&hero.content.media.src!==src)hero.content.media=still(src,item.title);
    else if(hero&&hero.layout!=='short'&&item.media?.src&&(!hero.content.media.src||hero.content.media.src.startsWith('/media/')))hero.content.media={...item.media};
    return {...item,pageId:page.id};
  });
  const linked=services.content.items.filter(item=>item.title.trim());
  if(linked.length>cap){
    let index=services.content.catalogPageId?next.find(p=>p.id===services.content.catalogPageId):undefined;
    if(!index)index=add('All services',source=>catalogPageSite(source,linked));
    if(index){services.content.catalogPageId=index.id;const grid=index.site.blocks.find(b=>b.type==='services');if(grid){grid.hidden=false;grid.layout='Icon cards';grid.content={...grid.content,smallLabel:'Our services',title:grid.content.title||'All services',description:grid.content.description||'Choose a service to see how the workshop handles it.',items:linked.map(item=>({...item})),actionLabel:'Learn more'};}}
  }
  return next;
}
function slideTiming(c:BlockContent){return (c.mediaMode===undefined||['image','video','slideshow'].includes(c.mediaMode))&&(c.slideLoop===undefined||typeof c.slideLoop==='boolean')&&(c.slideSeconds===undefined||typeof c.slideSeconds==='number'&&c.slideSeconds>=1&&c.slideSeconds<=30)&&(c.slideFade===undefined||typeof c.slideFade==='number'&&c.slideFade>=0&&c.slideFade<=2000)&&(c.slideAdvance===undefined||c.slideAdvance==='time'||c.slideAdvance==='end')&&(c.slideAutoplay===undefined||typeof c.slideAutoplay==='boolean')&&slideIndexAllowed(c.slideIndex,heroSlides(c).length);}
export function validBlocks(value:unknown):value is Block[] {
  if(!Array.isArray(value)||value.length>80)return false;
  const ids=new Set<string>(),shared=new Set<string>();
  const icon=(name:unknown)=>typeof name==='string'&&icons.includes(name as IconName);
  const media=(m:unknown)=>{if(!m||typeof m!=='object')return false;const input=m as Record<string,unknown>;return Object.entries(mediaDefaults).every(([key,base])=>input[key]===undefined||typeof input[key]===typeof base)&&typeof input.src==='string';};
  const optionalStrings=(input:Record<string,unknown>,keys:string[])=>keys.every(key=>input[key]===undefined||typeof input[key]==='string');
  return value.every(block=>{
    if(!block||typeof block.id!=='string'||!block.id||block.id.length>100||ids.has(block.id)||!catalog.some(s=>s.id===block.type)||!blockLayouts[block.type as SectionId].includes(block.layout)||!block.content||!block.settings||typeof block.settings!=='object'||(block.hidden!==undefined&&typeof block.hidden!=='boolean'))return false;
    ids.add(block.id);if(['header','footer'].includes(block.type)){if(shared.has(block.type))return false;shared.add(block.type);}
    const c=block.content;
    if(!['smallLabel','title','description','note','formButton','consent'].every(key=>typeof c[key]==='string')||!optionalStrings(c,['price','oldPrice','endDate','badge','promise','address','phone','email','hours','indexLabel','actionLabel','allPhotosLabel','catalogPageId','beforeLabel','afterLabel']))return false;
    if(!Array.isArray(c.items)||c.items.length>60||!c.items.every((i:BlockItem)=>i&&typeof i.title==='string'&&typeof i.description==='string'&&icon(i.icon)&&optionalStrings(i,['price','pageId','caption','group','tag','value','note','when','source'])&&(!i.media||media(i.media))&&(i.stars===undefined||Number.isInteger(i.stars)&&i.stars>=1&&i.stars<=5)))return false;
    if(!Array.isArray(c.buttons)||c.buttons.length>2||!c.buttons.every(validButton))return false;
    if(!Array.isArray(c.facts)||c.facts.length>3||!c.facts.every((fact:unknown)=>typeof fact==='string')||!Array.isArray(c.fields)||c.fields.length>12||!c.fields.every((f:{label:string;type:string;required:boolean})=>f&&typeof f.label==='string'&&['text','email','tel','textarea'].includes(f.type)&&typeof f.required==='boolean'))return false;
    if(!media(c.media)||(c.before&&!media(c.before))||(c.after&&!media(c.after))||(c.story&&!media(c.story))||(c.slides&&(!Array.isArray(c.slides)||c.slides.length>4||!c.slides.every(media)))||(c.factIcons!==undefined&&(!Array.isArray(c.factIcons)||c.factIcons.length>3||!c.factIcons.every(icon))))return false;
    return (!c.rating||['score','count','href'].every(key=>typeof c.rating[key]==='string'))&&(c.height===undefined||['standard','full'].includes(c.height))&&(c.align===undefined||['left','center'].includes(c.align))&&(c.showSecondary===undefined||typeof c.showSecondary==='boolean')&&(c.showHeading===undefined||typeof c.showHeading==='boolean')&&(c.showMedia===undefined||typeof c.showMedia==='boolean')&&(c.showBusiness===undefined||typeof c.showBusiness==='boolean')&&(c.arrowCircle===undefined||typeof c.arrowCircle==='boolean')&&(c.buttonCount===undefined||[0,1,2].includes(c.buttonCount))&&(c.headAlign===undefined||['top','center','bottom'].includes(c.headAlign))&&(c.photoSide===undefined||['left','right'].includes(c.photoSide))&&(c.darkness===undefined||typeof c.darkness==='number'&&c.darkness>=0&&c.darkness<=80)&&(c.fade===undefined||typeof c.fade==='boolean')&&(c.fadeDirection===undefined||['ltr','rtl'].includes(c.fadeDirection))&&(c.fadeWidth===undefined||typeof c.fadeWidth==='number'&&c.fadeWidth>=0&&c.fadeWidth<=100)&&(c.fadeStrength===undefined||typeof c.fadeStrength==='number'&&c.fadeStrength>=0&&c.fadeStrength<=100)&&(c.background===undefined||typeof c.background==='string'&&/^#[0-9a-f]{6}$/i.test(c.background))&&(c.reviewText===undefined||['full','excerpt'].includes(c.reviewText))&&(c.avatar===undefined||['off','circle','square'].includes(c.avatar))&&(c.namePrivacy===undefined||typeof c.namePrivacy==='boolean')&&(c.showRating===undefined||typeof c.showRating==='boolean')&&(c.showDate===undefined||typeof c.showDate==='boolean')&&(c.showService===undefined||typeof c.showService==='boolean')&&(c.showSource===undefined||typeof c.showSource==='boolean')&&(c.cardFace===undefined||['filled','plain'].includes(c.cardFace))&&(c.cardPad===undefined||['comfortable','compact'].includes(c.cardPad))&&slideTiming(c);
  });
}
export function duplicateBlock(block:Block):Block {const copy=structuredClone(block);copy.id=crypto.randomUUID();copy.content.title=`${copy.content.title} (copy)`;return copy;}
export function moveBlock(blocks:Block[],from:string,to:string):Block[] {const next=[...blocks],index=next.findIndex(b=>b.id===from),target=next.findIndex(b=>b.id===to);if(index<0||target<0)return blocks;next.splice(target,0,next.splice(index,1)[0]);return next;}
