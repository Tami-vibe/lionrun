import type {IconName, MenuItem, MenuPage, MenuPlacementConfig, NamedMenu, Site} from './contracts';
import {projectMenuLinkHref, projectMenuLinkPageId} from './link-projection';

export type {MenuItem, MenuPlacementConfig, NamedMenu} from './contracts';

export function createDefaultMenus(site?: Partial<Site>, pages: MenuPage[] = []): NamedMenu[] {
  if (site?.menus?.length) return site.menus;
  const nav = site?.nav || ['Home', 'Services', 'Contact'];
  const targets = site?.navTargets || ['#top', '#services', '#contact'];
  const pageIds = site?.navPageIds || [];
  const children = site?.navChildren || [];
  const mainItems: MenuItem[] = nav.map((name, i) => {
    const target = targets[i] || '#services', isSec = target.startsWith('#'), isUrl = /^https?:\/\//i.test(target);
    const linkTo = isUrl ? 'url' : isSec ? 'section' : 'page';
    return {
      id: `main-${i + 1}`, text: name, linkTo, destination: target,
      pageId: projectMenuLinkPageId({linkTo, destination: target, pageId: pageIds[i]}, pages) || undefined, parentId: null,
      icon: (name.toLowerCase() === 'home' ? 'none' : name.toLowerCase().includes('service') ? 'gear' : 'mail') as IconName,
    };
  });
  nav.forEach((_, i) => (children[i] || []).forEach((c, j) => mainItems.push({
    id: `main-sub-${i + 1}-${j + 1}`, text: c.label, linkTo: c.href?.startsWith('#') ? 'section' : 'page',
    destination: c.href || '#', pageId: c.pageId, parentId: `main-${i + 1}`, icon: 'wrench' as IconName,
  })));
  const footerLinks = site?.footerColumns?.find(c => c.title.toLowerCase() === 'explore')?.links || [];
  const footerItems: MenuItem[] = footerLinks.length ? footerLinks.map((l, i) => ({
    id: `footer-${i + 1}`, text: l.label, linkTo: l.href.startsWith('#') ? 'section' : 'page',
    destination: l.href, pageId: l.pageId, parentId: null,
  })) : [
    { id: 'footer-1', text: 'About', linkTo: 'section', destination: '#about', parentId: null },
    { id: 'footer-2', text: 'Contact', linkTo: 'section', destination: '#contact', parentId: null },
  ];
  return [
    { id: 'main', name: 'Main menu', items: mainItems },
    { id: 'footer', name: 'Footer links', items: footerItems },
  ];
}

export function defaultPlacement(menus: NamedMenu[]): MenuPlacementConfig {
  return { header: menus[0]?.id, footer: menus[1]?.id || menus[0]?.id };
}

export function syncMenusToSite(site: Site, menus: NamedMenu[], placement: MenuPlacementConfig, pages: MenuPage[] = []): Partial<Site> {
  const headerMenu = menus.find(m => m.id === placement.header);
  const footerMenu = menus.find(m => m.id === placement.footer);
  const patch: Partial<Site> = { menus, menuPlacement: placement };
  if (headerMenu) {
    const top = headerMenu.items.filter(i => !i.parentId).slice(0, 5);
    patch.nav = top.map(i => i.text);
    const href = (item: MenuItem) => projectMenuLinkHref(item);
    patch.navTargets = top.map(href);
    patch.navPageIds = top.map(i => projectMenuLinkPageId(i, pages) || null);
    patch.navChildren = top.map(p => headerMenu.items.filter(c => c.parentId === p.id).map(c => ({ label: c.text, href: href(c), pageId: c.pageId })));
  }
  if (footerMenu && site.footerColumns?.length) {
    const topFooter = footerMenu.items.filter(item => !item.parentId);
    const idx = Math.max(0, site.footerColumns.findIndex(column =>
      column.title.toLowerCase() === 'explore'));
    patch.footerColumns = site.footerColumns.map((column, i) => {
      if (i !== idx) return column;
      const custom = column.links.filter(item => item.customLabel);
      const projected = topFooter.map(item => {
        const href = projectMenuLinkHref(item);
        return custom.find(link => item.pageId ? link.pageId === item.pageId
          : link.href === href) || {label: item.text, href, pageId: item.pageId};
      });
      return {...column, links: [...projected, ...custom.filter(link =>
        !projected.includes(link))]};
    });
  }
  return patch;
}

/** Display each parent with its children without changing saved identities. */
export function orderedMenuItems(items: MenuItem[]): MenuItem[] {
  const roots = items.filter(item => !item.parentId);
  const ordered = roots.flatMap(root => [root, ...items.filter(item => item.parentId === root.id)]);
  const seen = new Set(ordered.map(item => item.id));
  return [...ordered, ...items.filter(item => !seen.has(item.id))];
}
export type MenuDrop = 'before' | 'after' | 'inside';
export function moveMenuItem(items: MenuItem[], id: string, targetId: string, drop: MenuDrop, rootLimit = Infinity, allowChildren = true): {items: MenuItem[]; error?: string} {
  const source = items.find(item => item.id === id), target = items.find(item => item.id === targetId);
  if (!source || !target || source.id === target.id) return {items};
  const children = items.filter(item => item.parentId === source.id);
  if (children.some(item => item.id === targetId)) return {items, error: 'A link cannot move inside its own group.'};
  const parentId = drop === 'inside' ? target.id : target.parentId || null;
  if (parentId && (!allowChildren || (drop === 'inside' && target.parentId))) return {items, error: allowChildren ? 'Menus support one level of sublinks.' : 'Footer menus use main-level links.'};
  if (parentId && children.length) return {items, error: 'Move this link’s sublinks out before nesting it.'};
  const rootCount = items.filter(item => !item.parentId).length;
  const nextCount = rootCount + (source.parentId ? 0 : -1) + (parentId ? 0 : 1);
  if (nextCount > rootLimit && nextCount > rootCount) return {items, error: `This header supports ${rootLimit} main links. Move one inside another first.`};
  const moving = new Set([id, ...children.map(item => item.id)]);
  const next = orderedMenuItems(items).filter(item => !moving.has(item.id));
  let index = next.findIndex(item => item.id === targetId);
  if (drop === 'inside' || drop === 'after') {
    index++;
    if (!target.parentId) while (index < next.length && next[index].parentId === targetId) index++;
  }
  next.splice(index, 0, {...source, parentId}, ...children);
  return {items: next};
}
export function duplicateMenu(menu: NamedMenu, makeId: () => string): NamedMenu {
  const ids = new Map(menu.items.map(item => [item.id, makeId()]));
  return {id: makeId(), name: `${menu.name} copy`, items: menu.items.map(item => ({...item, id: ids.get(item.id)!, parentId: item.parentId ? ids.get(item.parentId) || item.parentId : null}))};
}
