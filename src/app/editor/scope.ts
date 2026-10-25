export type EditorRegion = "header" | "page" | "footer";
export type EditorScope = EditorRegion | "live";
export const previewZooms = [0.5, 0.75, 1, 1.1, 1.25, 1.5] as const;
export type PreviewDevice = "desktop" | "tablet" | "mobile";
const shell = {
  desktop: {x: 1, top: 41, bottom: 1, viewport: 900},
  tablet: {x: 1, top: 41, bottom: 1, viewport: 1024},
  mobile: {x: 13, top: 29, bottom: 17, viewport: 844},
} as const;

type Piece = {id: string; type: string; hidden?: boolean};

export function frameSize(device: PreviewDevice, contentWidth: number) {
  const box = shell[device];
  return {width: contentWidth + box.x * 2, height: box.viewport + box.top + box.bottom, viewportHeight: box.viewport};
}

export function fitZoom(available: number, frameWidth: number) {
  if (!(available > 0) || !(frameWidth > 0)) return 1;
  return Math.max(0.1, available / frameWidth);
}

export function displayZoom(mode: "fit" | number, available: number, frameWidth: number) {
  return mode === "fit" ? fitZoom(available, frameWidth) : mode;
}

export function framePieces<T extends Piece>(blocks: readonly T[], scope: EditorScope) {
  const shown = blocks.filter(block => !block.hidden);
  const page = shown.filter(block => block.type !== "header" && block.type !== "footer");
  if (scope === "live") return shown.map(block => ({block, context: false}));
  if (scope === "page") return page.map(block => ({block, context: false}));
  if (scope === "header") {
    const header = shown.find(block => block.type === "header");
    const sample = page[0];
    return [header && {block: header, context: false}, sample && {block: sample, context: true}].filter((item): item is {block: T; context: boolean} => !!item);
  }
  const footer = shown.find(block => block.type === "footer");
  const sample = page.at(-1);
  return [sample && {block: sample, context: true}, footer && {block: footer, context: false}].filter((item): item is {block: T; context: boolean} => !!item);
}

export function regionForBlock(type: string): EditorRegion {
  return type === "header" ? "header" : type === "footer" ? "footer" : "page";
}

export function selectionForRegion<T extends Piece>(region: EditorRegion, blocks: readonly T[], current: string) {
  if (region === "header") return blocks.find(block => block.type === "header")?.id || current;
  if (region === "footer") return blocks.find(block => block.type === "footer")?.id || current;
  if (blocks.some(block => block.id === current && block.type !== "header" && block.type !== "footer")) return current;
  return blocks.find(block => !block.hidden && block.type !== "header" && block.type !== "footer")?.id || current;
}

export function editorSticky(scope: EditorScope, saved: boolean) {
  return scope === "header" ? false : saved;
}

export function geometryKey(box: {top: number; left: number; width: number; height: number}) {
  return [box.top, box.left, box.width, box.height].map(value => Math.round(value)).join(",");
}
