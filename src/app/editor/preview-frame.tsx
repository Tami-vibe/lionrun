"use client";
import {useCallback, useEffect, useLayoutEffect, useState, type ReactNode, type RefObject, type SyntheticEvent} from "react";
import {createPortal} from "react-dom";
import {frameSize, type EditorRegion, type PreviewDevice} from "./scope";

const frameDocument = '<!DOCTYPE html><html><head></head><body style="margin:0"><div id="site-root"></div></body></html>';

function syncFrame(doc: Document) {
  let base = doc.querySelector("base");
  if (!base) {
    base = doc.createElement("base");
    doc.head.prepend(base);
  }
  base.href = document.baseURI;
  doc.body.className = document.body.className;
  const source = getComputedStyle(document.body);
  for (const name of ["--font-display", "--font-text"]) {
    const value = source.getPropertyValue(name).trim();
    if (value) doc.documentElement.style.setProperty(name, value);
  }
  doc.head.querySelectorAll("[data-preview-style]").forEach(node => node.remove());
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
    const copy = node.cloneNode(true) as HTMLElement;
    copy.setAttribute("data-preview-style", "true");
    doc.head.appendChild(copy);
  });
}

export function PreviewFrame({areaRef, frameRef, device, width, scale, zoomLabel, address, selectedId, sectionName, region, onRegion, children}:{
  areaRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLIFrameElement | null> & {current: HTMLIFrameElement | null};
  device: PreviewDevice;
  width: number;
  scale: number;
  zoomLabel: string;
  address: string;
  selectedId: string;
  sectionName: string;
  region: EditorRegion;
  onRegion: (region: EditorRegion) => void;
  children: ReactNode;
}) {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const box = frameSize(device, width);
  const mountFrame = useCallback((frame: HTMLIFrameElement) => {
    const doc = frame.contentDocument;
    const root = doc?.getElementById("site-root");
    if (!doc || !root) return;
    syncFrame(doc);
    setMount(current => current === root ? current : root);
  }, []);
  const bindFrame = useCallback((node: HTMLIFrameElement | null) => {
    frameRef.current = node;
    if (!node) return;
    mountFrame(node);
    node.addEventListener("load", () => mountFrame(node), {once: true});
  }, [frameRef, mountFrame]);
  const onLoad = (event: SyntheticEvent<HTMLIFrameElement>) => mountFrame(event.currentTarget);
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !mount) return;
    const run = () => syncFrame(doc);
    const observer = new MutationObserver(run);
    observer.observe(document.head, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [frameRef, mount]);
  useLayoutEffect(() => {
    const ring = areaRef.current?.querySelector(".selection-ring");
    if (!ring) return;
    ring.classList.add("is-appearing");
    const appear = window.setTimeout(() => ring.classList.remove("is-appearing"), 180);
    return () => window.clearTimeout(appear);
  }, [areaRef, selectedId]);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const area = areaRef.current;
    const layer = area?.querySelector<HTMLElement>(".selection-layer");
    const ring = area?.querySelector<HTMLElement>(".selection-ring");
    const doc = frame?.contentDocument;
    if (!frame || !area || !layer || !ring || !doc) return;
    let frameId = 0;
    let previous = "";
    const place = () => {
      frameId = 0;
      const section = doc.querySelector(`[data-section="${CSS.escape(selectedId)}"]:not(.editor-context)`) as HTMLElement | null;
      const tabs = area.querySelector(".region-switch") as HTMLElement | null;
      const caption = area.querySelector(".canvas-caption") as HTMLElement | null;
      const frameBox = frame.getBoundingClientRect();
      if (!section || !tabs || !caption) {
        if (previous !== "hidden") { previous = "hidden"; layer.hidden = true; }
        return;
      }
      const zoom = frameBox.width / (frame.clientWidth || width) || safeScale;
      const sectionBox = section.getBoundingClientRect();
      const clipTop = Math.max(Math.ceil(tabs.getBoundingClientRect().bottom), Math.ceil(frameBox.top));
      const clipBottom = Math.min(Math.floor(caption.getBoundingClientRect().top), Math.floor(frameBox.bottom));
      const clipLeft = Math.max(Math.round(area.getBoundingClientRect().left), Math.round(frameBox.left));
      const clipRight = Math.min(Math.round(area.getBoundingClientRect().right), Math.round(frameBox.right));
      const clipWidth = Math.max(0, clipRight - clipLeft);
      const clipHeight = Math.max(0, clipBottom - clipTop);
      const ringTop = frameBox.top + sectionBox.top * zoom;
      const ringLeft = frameBox.left + sectionBox.left * zoom;
      const ringWidth = sectionBox.width * zoom;
      const ringHeight = sectionBox.height * zoom;
      const next = [clipTop, clipLeft, clipWidth, clipHeight, ringTop, ringLeft, ringWidth, ringHeight].map(value => Math.round(value)).join(",");
      if (next === previous) return;
      previous = next;
      layer.hidden = clipHeight < 2 || ringTop + ringHeight < clipTop || ringTop > clipTop + clipHeight;
      layer.style.top = `${clipTop}px`;
      layer.style.left = `${clipLeft}px`;
      layer.style.width = `${clipWidth}px`;
      layer.style.height = `${clipHeight}px`;
      ring.style.top = `${ringTop - clipTop}px`;
      ring.style.left = `${ringLeft - clipLeft}px`;
      ring.style.width = `${ringWidth}px`;
      ring.style.height = `${ringHeight}px`;
    };
    const schedule = () => { if (!frameId) frameId = requestAnimationFrame(place); };
    schedule();
    doc.addEventListener("scroll", schedule, {passive: true});
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    observer.observe(area);
    const section = doc.querySelector(`[data-section="${CSS.escape(selectedId)}"]:not(.editor-context)`);
    if (section) observer.observe(section);
    return () => {
      cancelAnimationFrame(frameId);
      doc.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [areaRef, device, frameRef, mount, region, safeScale, selectedId, width]);
  return <div ref={areaRef} className="canvas-area is-scaled">
    <div className="region-switch" role="group" aria-label="Editing view">
      {(["header", "page", "footer"] as const).map(item => <button type="button" key={item} aria-pressed={region === item} onClick={() => onRegion(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
    </div>
    <div className="canvas-stage" style={{width: Math.round(box.width * safeScale), height: Math.round(box.height * safeScale)}}>
      <div className={`device-frame is-${device === "mobile" ? "phone" : "browser"}`} style={{width: box.width, height: box.height, transform: `scale(${safeScale})`, transformOrigin: "top left"}}>
        {device === "mobile" ? <span className="device-camera" aria-hidden="true"/> : <div className="device-toolbar" aria-hidden="true"><span className="device-address">{address}</span></div>}
        <iframe ref={bindFrame} title="Page preview" srcDoc={frameDocument} onLoad={onLoad} style={{width, height: box.viewportHeight}}/>
      </div>
    </div>
    <p className="canvas-caption">{width} px wide · {zoomLabel}</p>
    <div className="selection-layer" hidden>
      <div className="selection-ring">
        <span className="selection-badge">{sectionName}</span>
      </div>
    </div>
    {mount && createPortal(children, mount)}
  </div>;
}
