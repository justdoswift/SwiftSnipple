import { isValidElement, useMemo, type ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveAssetUrl } from "../lib/asset-url";
import { createHeadingIdFactory } from "../lib/markdown-outline";
import HighlightedCodeBlock from "./HighlightedCodeBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }

  return "";
}

function hasImageDescendant(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === "boolean") {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some(hasImageDescendant);
  }

  if (!isValidElement<{ children?: ReactNode; node?: { tagName?: string } }>(node)) {
    return false;
  }

  if (node.type === "img" || node.props.node?.tagName === "img") {
    return true;
  }

  return hasImageDescendant(node.props.children);
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const segments = useMemo(() => splitMarkdownMediaSegments(content), [content]);
  const markdownComponents = useMemo<Components>(() => {
    const getHeadingId = createHeadingIdFactory();

    return {
      h1: ({ children }) => <h1 id={getHeadingId(getNodeText(children))}>{children}</h1>,
      h2: ({ children }) => <h2 id={getHeadingId(getNodeText(children))}>{children}</h2>,
      h3: ({ children }) => <h3 id={getHeadingId(getNodeText(children))}>{children}</h3>,
      h4: ({ children }) => <h4 id={getHeadingId(getNodeText(children))}>{children}</h4>,
      p: ({ children }) => <p>{children}</p>,
      ul: ({ children }) => <ul>{children}</ul>,
      ol: ({ children }) => <ol>{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
      hr: () => <hr />,
      a: ({ children, href }) => {
        if (hasImageDescendant(children)) {
          return (
            <a href={href} target="_blank" rel="noreferrer" className="markdown-media-shell markdown-media-linked-image">
              {children}
            </a>
          );
        }

        return (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      },
      img: ({ src, alt }) => <img src={resolveAssetUrl(src ?? "")} alt={alt ?? ""} className="markdown-media-image" loading="lazy" />,
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
            className="markdown-code-block public-code-block type-code-block overflow-x-auto"
            fallbackClassName="markdown-code-block public-code-block type-code-block overflow-x-auto"
          />
        );
      },
    };
  }, [content]);

  return (
    <div className={`markdown-renderer ${className}`.trim()}>
      {segments.map((segment, index) => {
        if (segment.type === "video") {
          return <MarkdownVideoBlock key={`video-${index}`} src={segment.src} title={segment.title} />;
        }

        return (
          <ReactMarkdown key={`markdown-${index}`} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {segment.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}

type MarkdownSegment =
  | { type: "markdown"; content: string }
  | { type: "video"; src: string; title: string };

function splitMarkdownMediaSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const lines = content.split("\n");
  let markdownBuffer: string[] = [];

  const flushMarkdownBuffer = () => {
    if (!markdownBuffer.join("").trim()) {
      markdownBuffer = [];
      return;
    }
    segments.push({ type: "markdown", content: markdownBuffer.join("\n") });
    markdownBuffer = [];
  };

  for (const line of lines) {
    const parsedVideo = parseVideoDirective(line);
    if (parsedVideo) {
      flushMarkdownBuffer();
      segments.push({ type: "video", ...parsedVideo });
      continue;
    }

    markdownBuffer.push(line);
  }

  flushMarkdownBuffer();

  return segments;
}

function parseVideoDirective(line: string): { src: string; title: string } | null {
  const trimmed = line.trim();
  const match = /^::video\{(.+)\}$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const attributes = match[1];
  const src = /src="([^"]+)"/.exec(attributes)?.[1]?.trim();
  if (!src) {
    return null;
  }

  return {
    src,
    title: /title="([^"]*)"/.exec(attributes)?.[1]?.trim() ?? "",
  };
}

function MarkdownVideoBlock({ src, title }: { src: string; title: string }) {
  const resolvedSrc = resolveAssetUrl(src);
  const embedURL = getEmbeddableVideoURL(resolvedSrc);

  if (embedURL) {
    return (
      <figure className="markdown-media-shell">
        <div className="markdown-media-embed-shell">
          <iframe
            src={embedURL}
            title={title || "Embedded video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="markdown-media-embed"
          />
        </div>
        {title ? <figcaption className="markdown-media-caption">{title}</figcaption> : null}
      </figure>
    );
  }

  if (isDirectVideoAsset(resolvedSrc)) {
    return (
      <figure className="markdown-media-shell">
        <video className="markdown-media-video" controls preload="metadata">
          <source src={resolvedSrc} />
        </video>
        {title ? <figcaption className="markdown-media-caption">{title}</figcaption> : null}
      </figure>
    );
  }

  return (
    <p>
      <a href={resolvedSrc} target="_blank" rel="noreferrer">
        {title || resolvedSrc}
      </a>
    </p>
  );
}

function isDirectVideoAsset(src: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(src) || src.includes("/api/uploads/content-videos/");
}

function getEmbeddableVideoURL(src: string) {
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
    if (url.hostname.includes("loom.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (url.hostname.includes("bilibili.com")) {
      return src;
    }
  } catch {
    return null;
  }

  return null;
}
