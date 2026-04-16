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
          className="type-code-inline rounded-[8px] bg-white/6 px-1.5 py-0.5 text-white"
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
      <ul key={`list-${nodes.length}`} className="list-disc space-y-2 pl-5 text-white/62">
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
        className="type-code-block overflow-x-auto rounded-[16px] border border-white/8 bg-white/4 p-5 text-white/88"
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
        <h1 key={`h1-${nodes.length}`} className="text-4xl font-semibold tracking-[-0.04em] text-white">
          {renderInline(line.slice(2))}
        </h1>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="pt-4 text-2xl font-semibold tracking-[-0.03em] text-white">
          {renderInline(line.slice(3))}
        </h2>,
      );
      return;
    }

    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-8 text-white/62">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();
  flushCode();

  return <div className="space-y-5">{nodes}</div>;
}
