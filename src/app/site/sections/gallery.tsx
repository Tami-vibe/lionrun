import {useState} from 'react';
import {Columns} from '../../editor/columns';
import {MediaView} from '../../media/library';
import {SectionHeading} from './elements';
import type {SectionProps} from './index';
export function AboutSection({block,editable,selected,change}:SectionProps) {
 const c=block.content,[group,setGroup]=useState(''),groups=Array.from(new Set(c.items.map(item=>item.group).filter((name):name is string=>!!name))),activeGroup=groups.includes(group)?group:'';
 return <div data-gallery>{block.layout==='Story and photos'&&<SectionHeading content={c}/>}
  {groups.length>0&&<div className="gallery-filters" role="group" aria-label="Photo groups">{['',...groups].map(name=><button key={name} type="button" aria-pressed={activeGroup===name} data-gallery-filter={name} onClick={e=>{e.stopPropagation();setGroup(name);}}>{name||c.allPhotosLabel||'All photos'}</button>)}</div>}
  <Columns className="block-grid photo-gallery" value={block.settings} editable={editable&&selected} onChange={change}>{c.items.map((item,i)=><figure key={i} data-gallery-group={item.group||''} hidden={!!activeGroup&&item.group!==activeGroup}>{item.media?.src&&<MediaView value={item.media} editable={editable}/>}<figcaption>{item.caption}</figcaption>{block.layout==='Story and photos'&&<><h3>{item.title}</h3><p>{item.description}</p></>}</figure>)}</Columns>
 </div>;
}
