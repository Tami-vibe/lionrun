import {catalog, sectionName, type SectionId} from "../site/catalog";

export type DestinationKind = "link" | "phone" | "email";
export type LinkMode = "section" | "website";

const sectionIds = new Set<string>(catalog.map(section => section.id));

export function destinationKind(value: string): DestinationKind {
  const text = value.trim().toLowerCase();
  if (text.startsWith("tel:")) return "phone";
  if (text.startsWith("mailto:")) return "email";
  return "link";
}

export function withDestinationKind(value: string, kind: DestinationKind) {
  if (destinationKind(value) === kind) return value;
  if (kind === "phone") return "tel:";
  if (kind === "email") return "mailto:";
  return "";
}

export function destinationBody(value: string): string {
  if (destinationKind(value) === "phone") return value.replace(/^tel:/i, "");
  if (destinationKind(value) === "email") return value.replace(/^mailto:/i, "");
  return value;
}

export function storedDestination(kind: DestinationKind, body: string): string {
  if (kind === "phone") return `tel:${body}`;
  if (kind === "email") return `mailto:${body}`;
  return body;
}

export function linkMode(value: string): LinkMode {
  return destinationKind(value) === "link" && sectionAnchorName(value) ? "section" : "website";
}

export function withLinkMode(value: string, mode: LinkMode): string {
  if (destinationKind(value) !== "link" || linkMode(value) === mode) return value;
  return "";
}

export function sectionTargets(blocks: {id: string; type: string}[]): {anchor: string; label: string}[] {
  return blocks.filter(block => block.type !== "header" && block.type !== "footer").map(block => {
    const first = blocks.find(item => item.type === block.type);
    const anchorId = block.type === "hero" && first?.id === block.id ? "top" : first?.id === block.id ? block.type : block.id;
    const label = sectionIds.has(block.type) ? sectionName(block.type as SectionId) : block.type;
    return {anchor: `#${anchorId}`, label};
  });
}

export function sectionAnchorName(value: string): string | null {
  const hash = value.trim().toLowerCase();
  if (hash === "#top") return sectionName("hero");
  if (!hash.startsWith("#")) return null;
  const id = hash.slice(1);
  if (!sectionIds.has(id)) return null;
  return sectionName(id as SectionId);
}

export function destinationGuidance(value: string, mode?: LinkMode): string {
  const kind = destinationKind(value);
  if (kind === "phone") return "Opens the visitor's calling app.";
  if (kind === "email") return "Opens the visitor's email app.";
  const section = sectionAnchorName(value);
  if (section && mode !== "website") return `Opens ${section} on this page.`;
  if ((mode ?? linkMode(value)) === "section") return "Choose a section on this page.";
  return "Enter a website address.";
}

export function destinationWarning(value: string): string {
  const text = value.trim();
  if (!text) return "";
  const kind = destinationKind(text);
  if (kind === "phone") {
    const body = text.replace(/^tel:/i, "");
    const digits = body.replace(/\D/g, "");
    if (digits.length < 7 || /[a-z]/i.test(body)) return "Enter a phone number.";
    return "";
  }
  if (kind === "email") {
    const body = text.replace(/^mailto:/i, "");
    if (sectionAnchorName(body)) return "This is a section link, not an email address. Choose Link, or enter an email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body)) return "Enter an email address.";
    return "";
  }
  if (sectionAnchorName(text)) return "";
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      if (!url.username && !url.password && (url.protocol === "http:" || url.protocol === "https:")) return "";
    } catch { /* unfinished or malformed addresses stay editable */ }
  } else if (/^\/(?!\/)/.test(text)) return "";
  return "Enter a website address.";
}
