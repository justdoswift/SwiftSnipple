import { ReactNode } from "react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="bg-surface-container-low px-1.5 py-0.5 font-mono text-[0.9em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

export default function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc space-y-2 pl-5 text-on-surface-variant">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  const flushCode = () => {
    if (!codeLines.length) return;
    nodes.push(
      <pre
        key={`code-${nodes.length}`}
        className="overflow-x-auto bg-primary p-5 font-mono text-xs leading-6 text-white"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        flushCode();
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (!line.trim()) {
      flushList();
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }

    flushList();

    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={`h1-${nodes.length}`} className="text-4xl font-black tracking-tighter text-primary">
          {renderInline(line.slice(2))}
        </h1>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="pt-4 text-2xl font-bold tracking-tight text-primary">
          {renderInline(line.slice(3))}
        </h2>,
      );
      return;
    }

    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-8 text-on-surface-variant">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();
  flushCode();

  return <div className="space-y-5">{nodes}</div>;
}
