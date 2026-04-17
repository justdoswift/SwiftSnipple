export type MarkdownOutlineLevel = 2 | 3;

export interface MarkdownOutlineItem {
  id: string;
  text: string;
  level: MarkdownOutlineLevel;
}

function stripMarkdownFormatting(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyHeading(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "section";
}

export function createHeadingIdFactory() {
  const counts = new Map<string, number>();

  return (text: string) => {
    const base = slugifyHeading(stripMarkdownFormatting(text));
    const nextCount = (counts.get(base) ?? 0) + 1;
    counts.set(base, nextCount);
    return nextCount === 1 ? base : `${base}-${nextCount}`;
  };
}

export function extractMarkdownOutline(
  content: string,
  levels: MarkdownOutlineLevel[] = [2, 3],
): MarkdownOutlineItem[] {
  const getId = createHeadingIdFactory();
  const allowedLevels = new Set(levels);
  const outline: MarkdownOutlineItem[] = [];
  let inCodeFence = false;

  for (const rawLine of content.split("\n")) {
    const trimmedLine = rawLine.trim();

    if (/^(```|~~~)/.test(trimmedLine)) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(trimmedLine);
    if (!match) continue;

    const level = match[1].length as MarkdownOutlineLevel;
    if (!allowedLevels.has(level)) continue;

    const text = stripMarkdownFormatting(match[2].replace(/\s+#+\s*$/, ""));
    if (!text) continue;

    outline.push({
      id: getId(text),
      text,
      level,
    });
  }

  return outline;
}
