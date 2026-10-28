import type {BlockItem} from './contracts';

export type ServiceMediaKind = 'icon' | 'media';

export function newServiceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureServiceIds(items: readonly BlockItem[]): BlockItem[] {
  const seen = new Set<string>();
  let changed = false;
  const next = items.map((item) => {
    let id = item.id?.trim() || '';
    if (!id || seen.has(id)) {
      id = newServiceId();
      changed = true;
    }
    seen.add(id);
    return item.id === id ? item : {...item, id};
  });
  return changed ? next : (items as BlockItem[]);
}

export function serviceId(item: BlockItem, index: number) {
  return item.id?.trim() || `svc-fallback-${index}`;
}

export function serviceMediaKind(item: BlockItem): ServiceMediaKind {
  return item.media?.src ? 'media' : 'icon';
}

export function servicePreviewCap(total: number, open: boolean, limit = 4) {
  if (open || total <= limit) return total;
  return limit;
}

import type {IconName} from './blocks';
import type {MediaSettings} from '../media/model';
import {still, clip} from './section-media';
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
export function serviceStory(item:BlockItem) {
  const known=serviceStories[item.title],name=item.title;
  return {intro:item.description,heading:known?.heading||`${name} at this workshop.`,overview:known?.overview||item.description,included:known?.included||['A written estimate','Work done in our workshop','A final inspection'] as [string,string,string],process:known?.process||`How ${name.toLowerCase()} works`,steps:known?.steps||[['Tell us what happened','We inspect the vehicle first.'],['Approve the estimate','Work waits for your yes.'],['We do the work','It stays in this workshop.'],['Collect the vehicle','You check it before you leave.']],faqs:[[`How do I start ${name.toLowerCase()}?`,'Call the shop or request an estimate. We look at the vehicle before we promise a time.'],[`How long does ${name.toLowerCase()} take?`,'The inspection sets the timeline. We tell you if parts will change it.'],['Do I approve the cost first?','Yes. Work starts after you approve the written estimate.'],['Who do I talk to?','One person at the shop follows it from the estimate to pickup.']] as [string,string][]};
}
