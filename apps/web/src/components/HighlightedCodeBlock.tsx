import { useEffect, useMemo, useState } from "react";
import { highlightMarkdownCode, resolveMarkdownLanguage } from "../lib/markdown-highlighter";

interface HighlightedCodeBlockProps {
  code: string;
  language?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export default function HighlightedCodeBlock({
  code,
  language,
  className = "",
  fallbackClassName = "",
}: HighlightedCodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const resolvedLanguage = useMemo(() => resolveMarkdownLanguage(language), [language]);

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

  if (highlightedHtml) {
    return (
      <div
        className={className}
        data-language={resolvedLanguage ?? language ?? ""}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  return (
    <pre className={fallbackClassName} data-language={resolvedLanguage ?? language ?? ""}>
      <code>{code}</code>
    </pre>
  );
}
