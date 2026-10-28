import {Children,Fragment,isValidElement,ReactNode,useRef} from 'react';
import {moveDivider,normalizeSettings,SectionSettings} from './settings';

type Props = {
  value:SectionSettings;
  children:ReactNode;
  editable?:boolean;
  onChange?:(settings:SectionSettings)=>void;
  className?:string;
};
type Drag = {x:number;width:number;values:number[];next:number[]};
const template = (values:number[]) => values.map(n=>`minmax(0,${n}fr)`).join(' ');

export function Columns({value,children,editable=false,onChange,className=''}:Props) {
  const root=useRef<HTMLDivElement>(null),drag=useRef<Drag|null>(null);
  const settings=normalizeSettings(value),widths=settings.widths!,count=settings.columns!,gap=settings.gap!;
  const items=Children.toArray(children).flatMap(child=>
    isValidElement<{children?:ReactNode}>(child)&&child.type===Fragment
      ? Children.toArray(child.props.children) : [child]);
  const style={
    '--column-count':count,
    '--column-template':template(widths),
    '--column-gap':`${gap}px`,
  } as React.CSSProperties;
  return <div ref={root} className={`configured-grid ${className}`} style={style}>
    {items}
    {editable&&items.length>1&&count>1&&<div className="column-handles" data-editor-only="true">
      {widths.slice(0,-1).map((_,index)=>{
        const boundary=widths.slice(0,index+1).reduce((a,b)=>a+b,0);
        return <button key={index} type="button" role="separator" aria-orientation="vertical"
          aria-label={`Resize columns ${index+1} and ${index+2}`}
          aria-valuemin={10} aria-valuemax={Math.floor(widths[index]+widths[index+1]-10)}
          aria-valuenow={Math.round(widths[index])}
          title="Drag to resize. Use arrow keys for small changes."
          style={{left:`calc(${boundary}% + ${(index+.5-(count-1)*boundary/100)*gap}px)`}}
          onClick={event=>event.stopPropagation()}
          onKeyDown={event=>{
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
            event.preventDefault();event.stopPropagation();
            const delta=event.key==='Home'?-100:event.key==='End'?100:
              (event.key==='ArrowLeft'?-1:1)*(event.shiftKey?5:1);
            onChange?.({...settings,widths:moveDivider(widths,index,delta)});
          }}
          onPointerDown={event=>{
            event.preventDefault();event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            // Pointer coordinates use visual pixels, including the canvas zoom.
            const width=root.current!.getBoundingClientRect().width*(1-gap*(count-1)/root.current!.clientWidth);
            drag.current={x:event.clientX,width,values:widths,next:widths};
          }}
          onPointerMove={event=>{
            const current=drag.current;if(!current)return;
            current.next=moveDivider(current.values,index,(event.clientX-current.x)/current.width*100);
            root.current?.style.setProperty('--column-template',template(current.next));
            const moved=current.next.slice(0,index+1).reduce((a,b)=>a+b,0);
            event.currentTarget.style.left=`calc(${moved}% + ${(index+.5-(count-1)*moved/100)*gap}px)`;
          }}
          onPointerUp={event=>{
            const current=drag.current;if(!current)return;
            drag.current=null;event.currentTarget.releasePointerCapture(event.pointerId);
            // Commit only once, so a complete drag is one undo step.
            if(current.next.some((n,i)=>n!==widths[i]))onChange?.({...settings,widths:current.next});
          }}
          onPointerCancel={event=>{
            drag.current=null;root.current?.style.setProperty('--column-template',template(widths));
            event.currentTarget.style.left=`calc(${boundary}% + ${(index+.5-(count-1)*boundary/100)*gap}px)`;
          }}
        ><span>↔</span></button>;
      })}
    </div>}
  </div>;
}
