export type MarkdownEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

function selectedText(value: string, start: number, end: number) {
  return value.slice(start, end);
}

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): MarkdownEditResult {
  const selection = selectedText(value, start, end) || placeholder;
  const nextValue = `${value.slice(0, start)}${prefix}${selection}${suffix}${value.slice(end)}`;
  const selectionStart = start + prefix.length;
  const selectionEnd = selectionStart + selection.length;

  return { value: nextValue, selectionStart, selectionEnd };
}

export function replaceLinePrefix(
  value: string,
  start: number,
  end: number,
  prefix: string,
): MarkdownEditResult {
  const before = value.slice(0, start);
  const selection = selectedText(value, start, end);
  const lineStart = before.lastIndexOf("\n") + 1;
  const blockEnd = end + value.slice(end).search(/\n|$/);
  const block = value.slice(lineStart, blockEnd);
  const lines = block.split("\n").map((line) => {
    if (!line.trim()) return line;
    return `${prefix}${line.replace(/^([>\-\d\.\s]+)/, "")}`;
  });
  const nextBlock = lines.join("\n");
  const nextValue = `${value.slice(0, lineStart)}${nextBlock}${value.slice(blockEnd)}`;

  return {
    value: nextValue,
    selectionStart: lineStart,
    selectionEnd: lineStart + nextBlock.length,
  };
}

export function applyHeading(
  value: string,
  start: number,
  end: number,
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): MarkdownEditResult {
  const before = value.slice(0, start);
  const lineStart = before.lastIndexOf("\n") + 1;
  const lineEndOffset = value.slice(end).search(/\n|$/);
  const lineEnd = lineEndOffset === -1 ? value.length : end + lineEndOffset;
  const line = value.slice(lineStart, lineEnd).replace(/^#{1,6}\s+/, "");
  const prefix = level === 0 ? "" : `${"#".repeat(level)} `;
  const nextLine = `${prefix}${line || "Heading"}`;
  const nextValue = `${value.slice(0, lineStart)}${nextLine}${value.slice(lineEnd)}`;

  return {
    value: nextValue,
    selectionStart: lineStart + prefix.length,
    selectionEnd: lineStart + nextLine.length,
  };
}

export function insertBlock(
  value: string,
  start: number,
  end: number,
  block: string,
  cursorOffset = 0,
): MarkdownEditResult {
  const leadingNewline = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const trailingNewline = end < value.length && value[end] !== "\n" ? "\n" : "";
  const insertion = `${leadingNewline}${block}${trailingNewline}`;
  const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
  const selectionStart = start + leadingNewline.length + cursorOffset;

  return {
    value: nextValue,
    selectionStart,
    selectionEnd: selectionStart,
  };
}

export function insertLink(
  value: string,
  start: number,
  end: number,
  label = "link text",
  url = "https://",
): MarkdownEditResult {
  const selection = selectedText(value, start, end) || label;
  const insertion = `[${selection}](${url})`;
  const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
  const selectionStart = start + selection.length + 3;

  return {
    value: nextValue,
    selectionStart,
    selectionEnd: selectionStart + url.length,
  };
}
