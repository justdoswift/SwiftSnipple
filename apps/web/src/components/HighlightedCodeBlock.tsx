import { AlertCircle, Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { highlightMarkdownCode, resolveMarkdownLanguage } from "../lib/markdown-highlighter";

interface HighlightedCodeBlockProps {
  code: string;
  language?: string | null;
  className?: string;
  fallbackClassName?: string;
  copyable?: boolean;
  copyValue?: string;
  copyLabel?: string;
}

export default function HighlightedCodeBlock({
  code,
  language,
  className = "",
  fallbackClassName = "",
  copyable = false,
  copyValue,
  copyLabel = "code block",
}: HighlightedCodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const resolvedLanguage = useMemo(() => resolveMarkdownLanguage(language), [language]);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    setHighlightedHtml(null);

    if (!code.trim() || !resolvedLanguage) {
      return () => {
        active = false;
      };
    }

    highlightMarkdownCode(code, resolvedLanguage)
      .then((html) => {
        if (!active) return;
        setHighlightedHtml(html);
      })
      .catch(() => {
        if (!active) return;
        setHighlightedHtml(null);
      });

    return () => {
      active = false;
    };
  }, [code, resolvedLanguage]);

  async function handleCopy() {
    if (!copyable) return;

    try {
      await navigator.clipboard.writeText(copyValue ?? code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }

    resetTimer.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);
  }

  const buttonLabel =
    copyState === "copied"
      ? `Copied ${copyLabel}`
      : copyState === "failed"
        ? `Failed to copy ${copyLabel}`
        : `Copy ${copyLabel}`;
  const CopyIcon = copyState === "copied" ? Check : copyState === "failed" ? AlertCircle : Copy;
  const blockClassName = copyable ? `${className} pr-16 md:pr-20`.trim() : className;
  const fallbackBlockClassName = copyable ? `${fallbackClassName} pr-16 md:pr-20`.trim() : fallbackClassName;

  if (highlightedHtml) {
    if (!copyable) {
      return (
        <div
          className={blockClassName}
          data-language={resolvedLanguage ?? language ?? ""}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      );
    }

    return (
      <div className="code-copy-shell">
        <button
          type="button"
          aria-label={buttonLabel}
          className="code-copy-button"
          data-copy-state={copyState}
          onClick={() => void handleCopy()}
        >
          <CopyIcon size={14} />
        </button>
        <div
          className={blockClassName}
          data-language={resolvedLanguage ?? language ?? ""}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
    );
  }

  if (!copyable) {
    return (
      <pre className={fallbackBlockClassName} data-language={resolvedLanguage ?? language ?? ""}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div className="code-copy-shell">
      <button
        type="button"
        aria-label={buttonLabel}
        className="code-copy-button"
        data-copy-state={copyState}
        onClick={() => void handleCopy()}
      >
        <CopyIcon size={14} />
      </button>
      <pre className={fallbackBlockClassName} data-language={resolvedLanguage ?? language ?? ""}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
