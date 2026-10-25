'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft, Check, ChevronRight, ChevronsUpDown, Eye, EyeOff,
  FileText, House, Pencil, Plus, Redo2, Settings2, SlidersHorizontal, Undo2,
} from 'lucide-react';

/** UI-facing projections, not replacement persistence models. */
export interface PageRef {
  id: string;
  name: string;
  placement: string;
}
export interface SectionRef {
  id: string;
  name: string;
  hidden: boolean;
  shared: boolean;
  stage: 0 | 1 | 2 | 3;
  icon: ReactNode;
}
export type InspectorTab = 'Content' | 'Appearance';
export type SaveStatus = 'saving' | 'saved' | 'error';

/**
 * Implement this adapter against the EXISTING workspace store.
 * Mutation callbacks must use its undoable actions; this component owns no draft.
 * Section IDs returned by getSections must be stable and identify shared blocks.
 */
export interface EditorAdapter {
  pages: readonly PageRef[];
  pageId: string;
  sectionId: string | null;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  getSections(pageId: string): readonly SectionRef[];
  selectPage(id: string): void;
  selectSection(id: string | null): void;
  setSectionHidden(id: string, hidden: boolean): void;
  undo(): void;
  redo(): void;
  /** Return complete existing controls, including layout-specific items. */
  renderInspector(section: SectionRef, tab: InspectorTab): ReactNode;
  renderPageSettings(page: PageRef): ReactNode;
  renderBusinessProfile(): ReactNode;
  renderCreatePage(onComplete: () => void): ReactNode;
  renderAddSection(onComplete: () => void): ReactNode;
  /** Canvas selection should call selectSection with the same stable ID. */
  renderCanvas(): ReactNode;
  /** Existing menu owns duplicate/delete restrictions and confirmations. */
  renderSectionMenu(section: SectionRef): ReactNode;
}

type Location = 'pages' | 'sections' | 'inspector' | 'page-settings'
  | 'business' | 'create-page' | 'add-section';
const STAGES = ['MAKE A FIRST IMPRESSION', 'EXPLAIN YOUR VALUE',
  'BUILD CONFIDENCE', 'HELP PEOPLE TAKE ACTION'] as const;

export function EditorShell({ adapter: a }: { adapter: EditorAdapter }) {
  const [location, setLocation] = useState<Location>('sections');
  const [tab, setTab] = useState<InspectorTab>('Content');
  const page = a.pages.find(p => p.id === a.pageId);
  const sections = page ? a.getSections(page.id) : [];
  const selected = sections.find(s => s.id === a.sectionId);

  // Supports direct canvas selection; never creates another draft or selected ID.
  useEffect(() => {
    if (a.sectionId) setLocation('inspector');
  }, [a.sectionId]);
  useEffect(() => {
    if (location === 'inspector' && !selected) setLocation('sections');
  }, [location, selected]);

  if (!page) return <p role="alert">Select a valid page to continue.</p>;

  function chooseSection(section: SectionRef) {
    a.selectSection(section.id);
    setTab('Content');
    setLocation('inspector');
  }
  const savedText = { saving: 'Saving…', saved: 'Saved in this browser',
    error: 'Could not save. Keep this tab open.' }[a.saveStatus];

  return (
    <div id="premium-studio">
      <header className="topbar">
        <div className="wordmark"><span className="brand">b</span>builder</div>
        <div className="grow" />
        <button type="button" className="quiet" aria-label="Undo"
          disabled={!a.canUndo} onClick={a.undo}><Undo2 aria-hidden /></button>
        <button type="button" className="quiet" aria-label="Redo"
          disabled={!a.canRedo} onClick={a.redo}><Redo2 aria-hidden /></button>
      </header>
      <div className="workspace">
        <aside className="panel" aria-label="Website editor">
          <div className="paneltop">
            <div className="eyebrow">YOUR WEBSITE</div>
            <button type="button" className="page-picker"
              onClick={() => setLocation('pages')}>
              <FileText aria-hidden /><span>{page.name}</span>
              <span className="grow" /><ChevronsUpDown aria-hidden />
            </button>
            <div className="breadcrumb">
              <button type="button" onClick={() => setLocation('sections')}>
                <ArrowLeft aria-hidden />All sections
              </button>
              {selected && location === 'inspector' && <span>/ {selected.name}</span>}
            </div>
            <div className="paneltitle">
              <h2>{location === 'inspector' && selected ? selected.name
                : location === 'pages' ? 'Pages'
                : location === 'page-settings' ? 'Page settings'
                : location === 'business' ? 'Business profile'
                : location === 'create-page' ? 'Create page'
                : location === 'add-section' ? 'Add section' : page.name}</h2>
              <div className="grow" />
              {location === 'sections' && (
                <button type="button" className="quiet" aria-label="Page settings"
                  onClick={() => setLocation('page-settings')}><Settings2 aria-hidden /></button>
              )}
              {location === 'inspector' && selected && <>
                <button type="button" className="quiet"
                  aria-label={`${selected.hidden ? 'Show' : 'Hide'} ${selected.name}`}
                  onClick={() => a.setSectionHidden(selected.id, !selected.hidden)}>
                  {selected.hidden ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </button>
                {a.renderSectionMenu(selected)}
              </>}
            </div>
            {selected?.shared && location === 'inspector' &&
              <p className="hint">Shared across every page</p>}
            {location === 'inspector' && selected && (
              <div className="tabs" aria-label="Inspector view">
                {(['Content', 'Appearance'] as const).map(t => (
                  <button key={t} type="button" aria-pressed={tab === t}
                    aria-controls="editor-inspector" onClick={() => setTab(t)}>
                    {t === 'Content' ? <Pencil aria-hidden /> : <SlidersHorizontal aria-hidden />}{t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="panelbody" id="editor-inspector">
            {location === 'pages' && <>
              {a.pages.map(p => (
                <button type="button" className="pagenav" key={p.id} onClick={() => {
                  a.selectPage(p.id); setLocation('sections');
                }}>
                  {p.id === a.pages[0]?.id ? <House aria-hidden /> : <FileText aria-hidden />}
                  <span className="grow"><b>{p.name}</b><small>{p.placement}</small></span>
                  {p.id === page.id ? <Check aria-hidden /> : <ChevronRight aria-hidden />}
                </button>
              ))}
              <button type="button" className="wide" disabled={a.pages.length >= 30}
                onClick={() => setLocation('create-page')}><Plus aria-hidden />Create page</button>
            </>}
            {location === 'sections' && <>
              {STAGES.map((stage, index) => (
                <section key={stage} aria-label={stage}>
                  <h3 className="section-label">{stage}</h3>
                  {sections.filter(s => s.stage === index).map(s => (
                    <div key={s.id} className={`navrow ${s.hidden ? 'hidden-section' : ''}`}>
                      <button type="button" className="choose" onClick={() => chooseSection(s)}>
                        {s.icon}<span className="grow">{s.name}</span>
                        {s.shared && <span className="pill">Shared</span>}
                      </button>
                      <button type="button" className="quiet"
                        aria-label={`${s.hidden ? 'Show' : 'Hide'} ${s.name}`}
                        onClick={() => a.setSectionHidden(s.id, !s.hidden)}>
                        {s.hidden ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                      </button>
                    </div>
                  ))}
                </section>
              ))}
              <button type="button" className="wide"
                onClick={() => setLocation('add-section')}><Plus aria-hidden />Add section</button>
            </>}
            {location === 'inspector' && selected && a.renderInspector(selected, tab)}
            {location === 'page-settings' && a.renderPageSettings(page)}
            {location === 'business' && a.renderBusinessProfile()}
            {location === 'create-page' && a.renderCreatePage(() => setLocation('sections'))}
            {location === 'add-section' && a.renderAddSection(() => setLocation('sections'))}
          </div>
          <footer className="panelbottom">
            <span role={a.saveStatus === 'error' ? 'alert' : 'status'}>{savedText}</span>
            <div className="grow" />
            <button type="button" className="quiet"
              onClick={() => setLocation('business')}>Business</button>
          </footer>
        </aside>
        <main className="canvas" aria-label="Website preview">{a.renderCanvas()}</main>
      </div>
    </div>
  );
}
