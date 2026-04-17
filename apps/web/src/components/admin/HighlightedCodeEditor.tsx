import { useEffect, useMemo, useRef, useState } from "react";
import { highlightMarkdownCode } from "../../lib/markdown-highlighter";
import { usePublicTheme } from "../../lib/public-theme";

interface HighlightedCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  shellClassName?: string;
}

export default function HighlightedCodeEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  shellClassName = "h-full",
}: HighlightedCodeEditorProps) {
  const theme = usePublicTheme();
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasContent = value.length > 0;
  const hasHighlight = hasContent && Boolean(highlightedHtml);
  const editorClassName = useMemo(
    () => `admin-code-editor-shell ${shellClassName}`.trim(),
    [shellClassName],
  );

  useEffect(() => {
    let active = true;

    if (!hasContent) {
      setHighlightedHtml(null);
      return () => {
        active = false;
      };
    }

    highlightMarkdownCode(value, "swift", theme)
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
  }, [hasContent, theme, value]);

  function syncScroll() {
    if (!textareaRef.current || !highlightRef.current) return;
    highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }

  return (
    <div className={editorClassName}>
      <div
        ref={highlightRef}
        aria-hidden="true"
        className="admin-code-editor-highlight no-scrollbar"
      >
        {highlightedHtml ? (
          <div
            className="admin-code-editor-highlight-inner snippet-highlight"
            data-theme={theme}
            data-language="swift"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="admin-code-editor-fallback">
            <code>{value}</code>
          </pre>
        )}
      </div>

      <textarea
        ref={textareaRef}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        data-highlighted={hasHighlight ? "true" : "false"}
        className="admin-editor-code admin-code-editor-input admin-editor-scrollbar"
      />
    </div>
  );
}
