import {buttonAppearance} from './elements';
import {Columns} from '../../editor/columns';
import {MediaView,MediaSequence} from '../../media/library';
import {SectionHeading,SectionButtons,Icon} from './elements';
import type {SectionProps} from './index';
function initials(name:string){const parts=name.trim().split(/\s+/).filter(Boolean);if(!parts.length)return '';return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();}
function faceTone(name:string){let n=5381;for(const ch of name)n=(n*33+ch.charCodeAt(0))>>>0;return String(n%8);}
export function ProofSection({block,editable,selected,change,link}:SectionProps) {
  const c=block.content,media=<MediaSequence content={c} editable={editable} index={c.slideIndex??0}/>,promises=<ul className="promise-list">{c.facts.filter(Boolean).map((fact,i)=><li key={i}><Icon name="check"/><span>{fact}</span></li>)}</ul>;
  if(block.layout==='Promise band')return <div className="promise-band"><SectionHeading content={c}/>{promises}{c.note&&<p>{c.note}</p>}<SectionButtons content={c} link={link}/></div>;
  if(block.layout!=='Photo and reasons')return <Columns className="block-grid proof-layout" value={block.settings} editable={editable&&selected} onChange={change}><div><SectionHeading content={c}/>{promises}<SectionButtons content={c} link={link}/></div><figure className="proof-photo">{media}{c.note&&<figcaption>{c.note}</figcaption>}</figure></Columns>;
  const reasons=c.items.filter(item=>item.group!=='stat'&&item.group!=='avatar'&&item.group!=='more').slice(0,6),stats=c.items.filter(item=>item.group==='stat'&&(item.value?.trim()||item.title.trim())).slice(0,2),faces=c.items.filter(item=>item.group==='avatar').slice(0,3).map(item=>({item,letters:initials(item.title),photo:item.media?.src?item.media:undefined})).filter(face=>face.letters||face.photo),extra=Math.max(0,Number(c.items.find(item=>item.group==='more')?.value)||0),lines=c.title.split('\n'),shown=c.buttonCount===0?0:c.buttonCount===1?1:2;
  return <Columns className={`block-grid proof-reasons${c.photoSide==='right'?' photo-right':''} intro-${c.headAlign||'center'}`} value={block.settings} editable={editable&&selected} onChange={change}>
    <figure className="proof-stage">{media}{(faces.length>0||stats.length>0)&&<div className="proof-stage-bar">{(faces.length>0||extra>0)&&<div className="proof-faces">{faces.map((face,i)=><span key={i} className="proof-face" data-tone={faceTone(face.item.title)} aria-label={face.item.title||'Customer'}>{face.photo?<MediaView value={face.photo}/>:face.letters}</span>)}{extra>0&&<span className="proof-face proof-more" aria-label={`${extra} more`}>+{extra}</span>}</div>}{stats.length>0&&<div className="proof-stats">{stats.map((stat,i)=><p key={i}><strong>{stat.value}</strong><span>{stat.title}</span></p>)}</div>}</div>}</figure>
    <div className="proof-copy"><div className="proof-head"><div>{c.smallLabel&&<span className="proof-kicker">{c.smallLabel}</span>}<h2>{lines[0]}{lines.length>1&&<span className="proof-quiet">{lines.slice(1).join(' ')}</span>}</h2></div>{c.description&&<p>{c.description}</p>}</div>
      <ul className="reason-grid">{reasons.map((item,i)=><li key={i}><span className="reason-mark"><Icon name={item.icon} size={20}/></span><div><h3>{item.title}</h3>{item.description&&<p>{item.description}</p>}</div></li>)}</ul>
      <div className="proof-actions">{c.buttons.slice(0,shown).map((button,i)=>button.label?i===0?<a key={i} className="site-btn site-btn-primary" style={buttonAppearance(button)} {...link(button.href)}><span>{button.label}</span><Icon name={button.icon} size={16}/></a>:<a key={i} className="proof-text-link" style={buttonAppearance(button)} {...link(button.href)}>{button.label}<Icon name="arrow" size={16}/></a>:null)}</div>
    </div>
  </Columns>;
}
