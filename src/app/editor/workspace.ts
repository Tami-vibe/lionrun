import type {PageEntry} from "./navigation";
import {bindMenu, headerLook, pageAddresses} from "./settings";
import {migrateSite, validBlocks, validButton, type ButtonData, type Site} from "../site/blocks";

export const workspaceKey = "business-builder-workspace-v2";
export const unreadableWorkspaceKey = "business-builder-workspace-v2-unreadable";
export const loadFailureMessage = "Saved website could not be opened. It is still stored in this browser and was not replaced.";

type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const preRecoveryKey = "business-builder-workspace-v2-pre-recovery";

export function keepPreRecoveryCopy(storage: KeyValueStore) {
  if (storage.getItem(preRecoveryKey)) return;
  const saved = storage.getItem(workspaceKey);
  if (saved) storage.setItem(preRecoveryKey, saved);
}

export function retainFailedWorkspace(storage: KeyValueStore): {dirty: boolean; error: string} {
  const saved = storage.getItem(workspaceKey);
  if (!saved) return {dirty: true, error: ""};
  if (!storage.getItem(unreadableWorkspaceKey)) storage.setItem(unreadableWorkspaceKey, saved);
  return {dirty: false, error: loadFailureMessage};
}

export const schemaBackupKey = "business-builder-workspace-v2-backup";
export const legacyWorkspaceKey = "business-builder-demo-v1";

const menuKeys = ["brand","nav","navTargets","navPageIds","navChildren","headerStyle","headerSticky","headerOverlay","headerBackground","headerButtonCount","headerButtonPlace","headerButtons","footerStyle","footerColumns","phone","email","address","ownerName","accent","theme","eyebrowStyle","brandKit"] as const;
export function menuButtons(site:Site):ButtonData[] {
    return [site.headerButtons?.[0]||{label:"Let's talk",href:`tel:${site.phone.replace(/[^+0-9]/g,'')}`,icon:"arrow"},site.headerButtons?.[1]||{...site.primary}];
}
export function sharedMenu(target:Site,home:Site):Site {
    const next={...target,...Object.fromEntries(menuKeys.map(key=>[key,home[key]]))} as Site;
    next.headerButtons=menuButtons(home);
    next.headerStyle=headerLook(home.headerStyle);
    next.sectionSettings={...target.sectionSettings,header:home.sectionSettings?.header,footer:home.sectionSettings?.footer};
    next.sectionStyle={...target.sectionStyle,header:home.sectionStyle?.header,footer:home.sectionStyle?.footer};
    next.sectionMedia={...target.sectionMedia,header:home.sectionMedia?.header,footer:home.sectionMedia?.footer};
    const shared=home.blocks.filter(b=>b.type==="header"||b.type==="footer");next.blocks=target.blocks.flatMap(b=>b.type==="header"||b.type==="footer"?shared.filter(v=>v.type===b.type):[b]);for(const block of shared)if(!next.blocks.some(b=>b.type===block.type)){if(block.type==="header")next.blocks.unshift(block);else next.blocks.push(block);}
    next.hidden=[...target.hidden.filter(id=>id!=="header"&&id!=="footer"),...home.hidden.filter(id=>id==="header"||id==="footer")];
    return next;
}
export function pageSnapshot(pages:PageEntry<Site>[],activeId:string,site:Site) {
    const homeId=pages.find(p=>p.id==="home")?.id||pages[0].id;
    return pages.map(p=>({...p,site:p.id===homeId?sharedMenu(p.id===activeId?site:p.site,site):p.id===activeId?site:p.site})).map(p=>({...p,site:bindMenu(p.site,pages)}));
}
export function validSite(value: unknown): value is Site {
    if (!value || typeof value !== "object")
        return false;
    const v = value as Partial<Site>;
    if(v.blocks!==undefined&&!validBlocks(v.blocks))return false;
    if(!Array.isArray(v.nav)||v.nav.length>5||!v.nav.every(n=>typeof n==="string")||(v.navTargets&&(!Array.isArray(v.navTargets)||!v.navTargets.every(n=>typeof n==="string"))))return false;
    if([v.headerSticky,v.headerOverlay,v.headerBackground].some(x=>x!==undefined&&typeof x!=="boolean"))return false;
    if(v.ownerName!==undefined&&typeof v.ownerName!=="string")return false;
    if(v.headerButtonCount!==undefined&&![0,1,2].includes(v.headerButtonCount))return false;
    if(v.headerButtons&&(!Array.isArray(v.headerButtons)||v.headerButtons.length>2||!v.headerButtons.every(validButton)))return false;
    if(v.navPageIds&&(!Array.isArray(v.navPageIds)||v.navPageIds.length>5||!v.navPageIds.every(id=>id===null||typeof id==="string")))return false;
    if(v.navChildren&&(!Array.isArray(v.navChildren)||v.navChildren.length>5||!v.navChildren.every(rows=>Array.isArray(rows)&&rows.length<=24&&rows.every(l=>l&&typeof l.label==="string"&&typeof l.href==="string"&&(l.pageId===undefined||typeof l.pageId==="string")))))return false;
    if(v.sectionSettings&&(!Object.values(v.sectionSettings).every(s=>s&&typeof s==="object")))return false;
    if(v.footerColumns&&(!Array.isArray(v.footerColumns)||v.footerColumns.length>5||!v.footerColumns.every(c=>typeof c.title==="string"&&typeof c.text==="string"&&Array.isArray(c.links)&&c.links.every(l=>typeof l.label==="string"&&typeof l.href==="string"&&(l.pageId===undefined||typeof l.pageId==="string")))))return false;
    if(v.eyebrowStyle!==undefined&&v.eyebrowStyle!=='pill'&&v.eyebrowStyle!=='line')return false;
    return typeof v.brand === "string" && typeof v.headline === "string" && typeof v.description === "string" &&
        Array.isArray(v.services) && Array.isArray(v.hidden) && typeof v.primary?.label === "string" && typeof v.secondary?.href === "string" &&
        typeof v.contactTitle === "string" && typeof v.accent === "string";
}

export type SavedWorkspace = {schemaVersion: 2 | 3; activeId?: string; pages: PageEntry<Site>[]};

export function loadableWorkspace(value: unknown): value is SavedWorkspace {
    if (!value || typeof value !== "object") return false;
    const workspace = value as SavedWorkspace;
    const version = (value as {schemaVersion?: unknown}).schemaVersion;
    return (version === 2 || version === 3) && Array.isArray(workspace.pages) && workspace.pages.length > 0 && workspace.pages.length <= 30 && workspace.pages.every(page => typeof page.id === "string" && typeof page.name === "string" && validSite(page.site));
}
export function syncableWorkspace(value: unknown): value is SavedWorkspace {
    if (!value || typeof value !== "object") return false;
    const saved = value as SavedWorkspace;
    const version = (value as {schemaVersion?: unknown}).schemaVersion;
    return (version === 2 || version === 3) && Array.isArray(saved.pages) && saved.pages.every(page => validSite(page.site));
}
export function storedPages(pages: PageEntry<Site>[]) {
    return pageAddresses(pages.map(page => ({...page, site: migrateSite(page.site)})));
}
export function activePage<T extends {id: string}>(list: T[], requested?: string) {
    return list.find(page => page.id === requested) || list[0];
}
function workspaceDocument(activeId: string, pages: PageEntry<Site>[]) {
    return JSON.stringify({schemaVersion: 3, activeId, pages});
}
export function upgradeSchema2(storage: KeyValueStore, raw: string, activeId: string, pages: PageEntry<Site>[]) {
    if (!storage.getItem(schemaBackupKey)) storage.setItem(schemaBackupKey, raw);
    keepPreRecoveryCopy(storage);
    storage.setItem(workspaceKey, workspaceDocument(activeId, pages));
}
export function writeWorkspace(storage: KeyValueStore, activeId: string, pages: PageEntry<Site>[]) {
    keepPreRecoveryCopy(storage);
    storage.setItem(workspaceKey, workspaceDocument(activeId, pages));
}
export function mergedPages(raw: string | null, current: PageEntry<Site>[]) {
    const saved = raw ? JSON.parse(raw) : null;
    const records: PageEntry<Site>[] = [2, 3].includes(saved?.schemaVersion) && Array.isArray(saved.pages) ? saved.pages : [];
    const map = new Map(records.map(page => [page.id, {...page, site: migrateSite(page.site)}]));
    for (const page of current) map.set(page.id, page);
    return pageAddresses(Array.from(map.values()));
}
export function autosavedPages(raw: string | null, current: PageEntry<Site>[]) {
    const saved = raw ? JSON.parse(raw) : null;
    const map = new Map<string, PageEntry<Site>>((saved?.pages || []).map((page: PageEntry<Site>) => [page.id, page]));
    for (const page of current) map.set(page.id, page);
    return pageAddresses(Array.from(map.values()));
}
export function legacySite(parsed: unknown, starter: Site): Site | null {
    if (!validSite(parsed)) return null;
    return migrateSite({...starter, ...parsed, blocks: undefined, extras: {...starter.extras, ...parsed.extras}, contactSecondary: parsed.contactSecondary ?? starter.contactSecondary});
}
