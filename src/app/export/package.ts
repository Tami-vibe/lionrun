import type {PageEntry} from "../editor/navigation";
import {pageAddresses} from "../editor/settings";
import {prepareMediaExport, exportRuntime, slideshowRuntime} from "../media/export";
import type {Site} from "../site/blocks";
import {safeHref} from "../site/safe-href";
import {zipFiles} from "./zip";
export function downloadFile(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export const htmlEscape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const menuRuntime = `document.querySelectorAll('.menu-dropdown a').forEach(function(a){a.addEventListener('click',function(){a.closest('details').removeAttribute('open');});});var menuBox=document.querySelector('.menu-frame');if(menuBox)new ResizeObserver(function(){document.querySelector('.site-preview').style.setProperty('--actual-menu-space',menuBox.offsetHeight+'px');}).observe(menuBox);var menuTick=false;function markMenu(){menuTick=false;var sections=Array.from(document.querySelectorAll('.site-preview section[id]')),header=document.querySelector('.menu-frame'),edge=(header?header.getBoundingClientRect().height:0)+40,current='#top';sections.forEach(function(s){if(s.getBoundingClientRect().top<=edge)current='#'+s.id;});document.querySelectorAll('.site-menu nav a[href^="#"]:not([data-current-page])').forEach(function(a){if(a.getAttribute('href')===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.querySelectorAll('.menu-dropdown').forEach(function(d){var summary=d.querySelector('summary');if(d.querySelector('[aria-current="page"]:not(summary)'))summary.setAttribute('aria-current','page');else summary.removeAttribute('aria-current');});}window.addEventListener('scroll',function(){if(!menuTick){menuTick=true;requestAnimationFrame(markMenu);}},{passive:true});markMenu();`;
export async function packageWebsite(incoming:PageEntry<Site>[],format:'html'|'wordpress') {
    const pages=pageAddresses(incoming);
    const home=pages.find(p=>p.id==='home')||pages[0],encoder=new TextEncoder();
    const files=new Map<string,Uint8Array>(),references=new Set<string>();
    const write=(name:string,content:string)=>files.set(name,encoder.encode(content));
    let css='';
    for(const sheet of Array.from(document.styleSheets))try{css+='\n'+Array.from(sheet.cssRules).map(rule=>rule.cssText).join('\n');}catch{}
    const fontUrls=Array.from(new Set(Array.from(css.matchAll(/url\(["']?([^"')]+\.woff2?)["']?\)/g),match=>match[1])));
    for(const source of fontUrls){const url=new URL(source,window.location.origin);if(url.origin!==window.location.origin||!url.pathname.startsWith('/_next/static/media/'))continue;
      const name=`assets/fonts/${url.pathname.split('/').at(-1)}`,response=await fetch(url);if(!response.ok)throw Error('A website font could not be packaged. Try exporting again.');files.set(name,new Uint8Array(await response.arrayBuffer()));css=css.replaceAll(source,format==='html'?name.slice(7):name);
    }
    const textFont=getComputedStyle(document.body).getPropertyValue('--font-text'),displayFont=getComputedStyle(document.body).getPropertyValue('--font-display');
    css+=`\n:root{--font-text:${textFont};--font-display:${displayFont}}body{margin:0}.site-preview{width:100%;min-height:100vh}`;
    const reviewRuntime=`document.querySelectorAll('[data-review-more]').forEach(function(button){button.addEventListener('click',function(){var card=button.closest('.review-card');if(!card)return;var open=card.classList.toggle('is-open');button.textContent=open?'Show less':'Read more';button.setAttribute('aria-expanded',String(open));});});document.querySelectorAll('[data-review-step]').forEach(function(button){button.addEventListener('click',function(){var board=button.closest('.review-wrap').querySelector('.review-board'),card=board&&board.querySelector('.review-card');if(!board||!card)return;var gap=parseFloat(getComputedStyle(board).columnGap||getComputedStyle(board).gap)||0;board.scrollBy({left:Number(button.dataset.reviewStep)*(card.offsetWidth+gap),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});});`;
    const script=exportRuntime+slideshowRuntime+menuRuntime+reviewRuntime+`document.querySelectorAll('[data-demo-submit]').forEach(function(button){button.addEventListener('click',function(){var root=button.closest('[role=form]'),fields=Array.from(root.querySelectorAll('input,textarea'));if(fields.every(function(field){return field.reportValidity();})){var output=root.querySelector('output');if(output)output.setAttribute('role','status');}});});document.querySelectorAll('[data-scroll-next]').forEach(function(button){button.addEventListener('click',function(){var next=button.closest('section');next=next&&next.nextElementSibling;if(next)next.scrollIntoView({behavior:'smooth',block:'start'});});});document.querySelectorAll('[data-logo-step]').forEach(function(button){button.addEventListener('click',function(){var band=button.closest('.logo-band'),nudge=band&&band.querySelector('.logo-nudge'),row=nudge&&nudge.querySelector('.logo-set'),item=row&&row.querySelector('.logo-item');if(!nudge||!item)return;var next=(Number(nudge.dataset.nudge)||0)+Number(button.dataset.logoStep)*(item.offsetWidth+(parseFloat(getComputedStyle(row).columnGap)||0));nudge.dataset.nudge=String(next);nudge.style.transform='translateX('+next+'px)';});});document.querySelectorAll('[data-slideshow]').forEach(function(root){var slides=Array.from(root.querySelectorAll('[data-slide]'));root.querySelectorAll('[data-slide-step]').forEach(function(button){button.addEventListener('click',function(){var current=slides.findIndex(function(slide){return !slide.hidden;}),next=(current+Number(button.dataset.slideStep)+slides.length)%slides.length;slides.forEach(function(slide,index){slide.hidden=index!==next;});var label=root.querySelector('[aria-live]');if(label)label.textContent=(next+1)+' / '+slides.length;});});});document.querySelectorAll('[data-gallery]').forEach(function(root){root.querySelectorAll('[data-gallery-filter]').forEach(function(button){button.addEventListener('click',function(){var group=button.dataset.galleryFilter;root.querySelectorAll('[data-gallery-group]').forEach(function(photo){photo.hidden=!!group&&photo.dataset.galleryGroup!==group;});root.querySelectorAll('[data-gallery-filter]').forEach(function(option){option.setAttribute('aria-pressed',String(option===button));});});});});`;
    for(const page of pages){
      const source=document.querySelector<HTMLElement>(`[data-export-page="${CSS.escape(page.id)}"] .site-preview`);if(!source)throw Error(`Could not prepare ${page.name} for export.`);
      const cloned=source.cloneNode(true) as HTMLElement,base=page.id===home.id?'':'../';
      const row=source.querySelector<HTMLElement>('.menu-frame');if(row)cloned.style.setProperty('--actual-menu-space',`${row.offsetHeight}px`);
      cloned.querySelectorAll('[data-editor-only]').forEach(element=>element.remove());
      cloned.querySelectorAll('[data-section]').forEach(element=>element.classList.remove('editable-section','selected-section'));
      cloned.querySelectorAll('details[open]').forEach(element=>element.removeAttribute('open'));
      cloned.querySelectorAll('input,textarea,button[type=submit]').forEach(element=>{(element as HTMLInputElement).disabled=false;});
      cloned.querySelectorAll<HTMLAnchorElement>('[data-site-href]').forEach(anchor=>{
        const target=pages.find(p=>p.id===anchor.dataset.linkPage),hash=anchor.dataset.linkHash||'',stored=anchor.dataset.siteHref||'';
        let href=safeHref(stored);
        if(target){href=target.id===page.id?(hash||'#top'):format==='wordpress'?`__BB_PAGE_${target.slug}__${hash}`:`${base}${target.id===home.id?'index.html':`${target.slug}/index.html`}${hash}`;}
        anchor.setAttribute('href',href);for(const key of ['data-site-href','data-link-page','data-link-hash'])anchor.removeAttribute(key);
      });
      const muted=Array.from(source.querySelectorAll('video')).map(video=>video.muted);
      const media=await prepareMediaExport(cloned,format);for(const asset of media.assets)files.set(asset.name,asset.data);for(const reference of media.references)references.add(reference);
      cloned.querySelectorAll('video').forEach((video,index)=>{if(muted[index])video.setAttribute('muted','');else video.removeAttribute('muted');});
      let content=cloned.outerHTML;
      if(format==='html'&&base)for(const asset of media.assets)content=content.replaceAll(asset.name,base+asset.name);
      if(format==='wordpress'){
        content=content.replaceAll('__BB_THEME_URI__',"<?php echo esc_url(get_template_directory_uri()); ?>");
        for(const target of pages)content=content.replaceAll(`__BB_PAGE_${target.slug}__`,`<?php echo esc_url(home_url('${target.id===home.id?'/':`/${target.slug}/`}')); ?>`);
      }
      const title=htmlEscape(page.site.seoTitle||page.name),description=htmlEscape(page.site.seoDescription||'');
      const styleHref=format==='wordpress'?"<?php echo esc_url(get_stylesheet_uri()); ?>":base+'assets/style.css',scriptHref=format==='wordpress'?"<?php echo esc_url(get_template_directory_uri()); ?>/assets/media.js":base+'assets/media.js';
      const html=`${format==='wordpress'?"<?php if (!defined('ABSPATH')) exit; ?>":''}<!doctype html><html ${format==='wordpress'?"<?php language_attributes(); ?>":'lang="en"'}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="stylesheet" href="${styleHref}">${format==='wordpress'?'<?php wp_head(); ?>':''}</head><body>${content}<script src="${scriptHref}"></script>${format==='wordpress'?'<?php wp_footer(); ?>':''}</body></html>`;
      write(format==='wordpress'?`pages/${page.slug}.php`:page.id===home.id?'index.html':`${page.slug}/index.html`,html);
    }
    write(format==='wordpress'?'style.css':'assets/style.css',(format==='wordpress'?'/*\nTheme Name: Business Builder\nVersion: 1.0.0\nRequires at least: 6.0\nText Domain: business-builder\n*/\n':'')+css);
    write('assets/media.js',script);write('media-references.json',JSON.stringify([...references],null,2));
    if(format==='wordpress'){
      const pageData=encoder.encode(JSON.stringify(pages.map(p=>({name:p.name,slug:p.slug,home:p.id===home.id}))));
      const payload=btoa(Array.from(pageData,byte=>String.fromCharCode(byte)).join(''));
      write('index.php',`<?php\nif (!defined('ABSPATH')) exit;\n$bb_slug = get_post_meta(get_queried_object_id(), '_bb_page', true);\n$bb_allowed = array(${pages.map(p=>`'${p.slug}'`).join(',')});\nif (!in_array($bb_slug, $bb_allowed, true)) $bb_slug = '${home.slug}';\ninclude __DIR__ . '/pages/' . $bb_slug . '.php';\n`);
      write('functions.php',`<?php\nif (!defined('ABSPATH')) exit;\nadd_action('after_setup_theme', function(){ add_theme_support('post-thumbnails'); });\nadd_action('after_switch_theme', function(){\n  $pages = json_decode(base64_decode('${payload}'), true);\n  foreach ($pages as $page) {\n    $existing = get_page_by_path($page['slug']);\n    $id = $existing ? $existing->ID : wp_insert_post(wp_slash(array('post_type'=>'page','post_status'=>'publish','post_title'=>$page['name'],'post_name'=>$page['slug'])));\n    if (is_wp_error($id) || !$id) continue;\n    update_post_meta($id, '_bb_page', $page['slug']);\n    if ($page['home']) { update_option('show_on_front', 'page'); update_option('page_on_front', $id); }\n  }\n});\n`);
    }
    write('README.txt',format==='wordpress'?'Install this ZIP from Appearance > Themes. Activation creates the included pages and sets Home as the front page. Existing page content is retained in WordPress. Test on staging before activation. Forms are demonstrations and do not submit or store data. Uploaded media and fonts are bundled; remote media remains linked.':'Upload the complete folder. Home is index.html; each page has its own folder and index.html. Keep assets/ beside the home file. Forms are demonstrations and do not submit or store data. Uploaded media and fonts are bundled; remote media remains linked.');
    return zipFiles(Array.from(files,([name,data])=>({name:format==='wordpress'?`business-builder/${name}`:name,data})));
}
