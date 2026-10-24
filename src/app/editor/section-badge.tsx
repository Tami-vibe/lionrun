import {sectionName,SectionId} from '../site/catalog';
export function SectionBadge({id,type,index,selected,choose}:{id:string;type:SectionId;index:number;selected:boolean;choose:(id:string)=>void}) {
  return <button type="button" data-editor-only="true" className="section-badge" aria-pressed={selected} aria-label={`Edit ${sectionName(type)}, section ${index+1}`} onClick={e=>{e.stopPropagation();choose(id);}}><span>{String(index+1).padStart(2,'0')}</span>{sectionName(type)}</button>;
}
