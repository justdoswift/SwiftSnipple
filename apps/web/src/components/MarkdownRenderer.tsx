import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import HighlightedCodeBlock from "./HighlightedCodeBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1>{children}</h1>,
  h2: ({ children }) => <h2>{children}</h2>,
  h3: ({ children }) => <h3>{children}</h3>,
  h4: ({ children }) => <h4>{children}</h4>,
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => <ul>{children}</ul>,
  ol: ({ children }) => <ol>{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  hr: () => <hr />,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="markdown-table-wrap">
      <table>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td>{children}</td>,
  pre: ({ children }) => <>{children}</>,
  code: ({ children, className }) => {
    const rawCode = String(children).replace(/\n$/, "");
    const languageMatch = /language-([\w-]+)/.exec(className ?? "");

    if (!languageMatch) {
      return <code className="type-code-inline">{children}</code>;
    }

    return (
      <HighlightedCodeBlock
        code={rawCode}
        language={languageMatch[1]}
        copyable
        copyLabel="code block"
        className="markdown-code-block type-code-block overflow-x-auto selection:bg-white/20"
        fallbackClassName="markdown-code-block type-code-block overflow-x-auto text-white/80"
      />
    );
  },
};

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-renderer ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
