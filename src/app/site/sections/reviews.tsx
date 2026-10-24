import type {CSSProperties} from 'react';
import {MediaView} from '../../media/library';
import {Icon,SectionHeading} from './elements';
import {reviewInitials,reviewLayout,reviewsFromItems,type ReviewRecord} from '../reviews';
import type {SectionProps} from './index';
import type {BlockContent} from '../blocks';

function nudgeReviews(board: HTMLElement, step: number) {
  const card = board.querySelector<HTMLElement>('.review-card');
  if (!card) return;
  const gap = parseFloat(getComputedStyle(board).columnGap || getComputedStyle(board).gap) || 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  board.scrollBy({left: step * (card.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth'});
}
function toggleQuote(button: HTMLButtonElement) {
  const card = button.closest('.review-card');
  if (!card) return;
  const open = card.classList.toggle('is-open');
  button.textContent = open ? 'Show less' : 'Read more';
  button.setAttribute('aria-expanded', String(open));
}
function ReviewCard({review, content, lines}: {review: ReviewRecord; content: BlockContent; lines: number}) {
  const privacy = content.namePrivacy===true;
  const name = review.name || 'Customer';
  const shown = privacy ? reviewInitials(name) : name;
  const excerpt = content.reviewText!=='full' && review.quote.length>140;
  const meta = [
    content.showDate!==false ? review.date : '',
    content.showService!==false ? review.service : '',
    content.showSource!==false ? review.source : '',
  ].filter(Boolean);
  return <article className={`review-card${excerpt?' is-clamped':''}${content.cardFace==='plain'?' is-plain':''}`}>
    {review.origin==='demo'&&<p className="review-demo" data-editor-only="true">Example only. This is not a published review.</p>}
    {content.showRating!==false&&!!review.stars&&<p className="review-stars" aria-label={`${review.stars} out of 5 stars`}>{Array.from({length:review.stars},(_,i)=><Icon key={i} name="star" size={14}/>)}</p>}
    {review.quote&&<blockquote className="review-quote" style={{'--review-lines':lines} as CSSProperties}>{review.quote}</blockquote>}
    {excerpt&&<button type="button" className="review-more" aria-expanded="false" data-review-more onClick={event=>{event.stopPropagation();toggleQuote(event.currentTarget);}}>Read more</button>}
    <footer className="review-person">
      {content.avatar!=='off'&&(review.avatar?<span className={`review-avatar is-${content.avatar||'circle'}`}><MediaView value={review.avatar} fill/></span>:<span className={`review-avatar is-${content.avatar||'circle'}`} aria-hidden="true">{reviewInitials(name)}</span>)}
      <span><strong>{shown}</strong>{meta.length>0&&<span className="review-meta">{meta.join(' · ')}</span>}{review.details&&<span className="review-meta">{review.details}</span>}</span>
    </footer>
  </article>;
}
export function ReviewsSection({block}: SectionProps) {
  const c = block.content;
  const mode = reviewLayout(block.layout);
  const columns = mode==='featured' ? 1 : Math.min(5, Math.max(1, block.settings.columns||3));
  const scroll = mode==='carousel' || columns===5;
  const density = scroll ? 'preview' : columns===1 ? 'featured' : columns===2 ? 'pair' : columns===4 ? 'compact' : 'grid';
  const reviews = reviewsFromItems(c.items);
  const lines = density==='preview' ? 3 : density==='compact' ? 4 : 6;
  const widths = block.settings.widths?.length===columns ? block.settings.widths : Array.from({length:columns},()=>100/columns);
  const template = reviews.length>=columns ? widths.map(n=>`minmax(0,${n}fr)`).join(' ') : `repeat(${Math.max(reviews.length,1)},minmax(0,1fr))`;
  const board = <div className="review-board" data-layout={mode} data-columns={columns} data-density={density} data-scroll={scroll||undefined} data-pad={c.cardPad||'comfortable'} data-face={c.cardFace||'filled'} style={{'--review-gap':`${block.settings.gap??24}px`,'--review-cols':columns,'--review-count':reviews.length,'--review-visible':Math.min(columns, reviews.length),'--review-template':template} as CSSProperties} tabIndex={scroll?0:-1} aria-label={scroll?'Customer reviews':undefined} onKeyDown={event=>{if(!scroll||event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;event.preventDefault();nudgeReviews(event.currentTarget,event.key==='ArrowRight'?1:-1);}}>{reviews.map(review=><ReviewCard key={review.id} review={review} content={c} lines={lines}/>)}</div>;
  return <><SectionHeading content={c}/>{reviews.length>0&&<div className="review-wrap">{scroll&&reviews.length>1&&<div className="review-nav"><button type="button" data-review-step="-1" aria-label="Previous reviews" onClick={event=>{event.stopPropagation();const track=event.currentTarget.closest('.review-wrap')?.querySelector<HTMLElement>('.review-board');if(track)nudgeReviews(track,-1);}}>‹</button><button type="button" data-review-step="1" aria-label="Next reviews" onClick={event=>{event.stopPropagation();const track=event.currentTarget.closest('.review-wrap')?.querySelector<HTMLElement>('.review-board');if(track)nudgeReviews(track,1);}}>›</button></div>}{board}</div>}</>;
}
