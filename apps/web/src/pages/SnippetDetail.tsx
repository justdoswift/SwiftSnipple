import { motion } from "motion/react";
import { Button, Card, Chip } from "../lib/heroui";
import { Check, Copy, CopyCheck } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MarkdownPreview from "../components/admin/MarkdownPreview";
import { getSnippetBySlug } from "../services/snippets";
import { Snippet } from "../types";

let swiftHighlighterPromise:
  | Promise<{
      codeToHtml: (code: string, options: { lang: "swift"; theme: "github-dark" }) => string;
    }>
  | null = null;

async function getSwiftHighlighter() {
  if (!swiftHighlighterPromise) {
    swiftHighlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/dist/langs/swift.mjs"),
      import("shiki/dist/themes/github-dark.mjs"),
      import("shiki/engine/javascript"),
    ]).then(([core, swift, githubDark, engine]) =>
      core.createHighlighterCore({
        langs: [swift.default],
        themes: [githubDark.default],
        engine: engine.createJavaScriptRegexEngine(),
      }),
    );
  }

  return swiftHighlighterPromise;
}

function stripShikiBackground(html: string) {
  return html.replace(/background-color:[^;"']+;?/g, "").replace(/style=";?"/g, "");
}

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function SnippetDetail() {
  const { slug } = useParams();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copyState, setCopyState] = useState<{ code: "idle" | "copied" | "failed"; prompts: "idle" | "copied" | "failed" }>({
    code: "idle",
    prompts: "idle",
  });
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const resetTimers = useRef<{ code?: number; prompts?: number }>({});

  useEffect(() => {
    return () => {
      (["code", "prompts"] as const).forEach((key) => {
        const timer = resetTimers.current[key];
        if (timer) {
          window.clearTimeout(timer);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setIsLoading(true);
    getSnippetBySlug(slug)
      .then((value) => {
        if (!active) return;
        setSnippet(value);
        setError("");
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!snippet?.code.trim()) {
      setHighlightedCode(null);
      return;
    }

    let active = true;
    setHighlightedCode(null);

    getSwiftHighlighter()
      .then((highlighter) =>
        stripShikiBackground(
          highlighter.codeToHtml(snippet.code, {
            lang: "swift",
            theme: "github-dark",
          }),
        ),
      )
      .then((html) => {
        if (!active) return;
        setHighlightedCode(html);
      })
      .catch(() => {
        if (!active) return;
        setHighlightedCode(null);
      });

    return () => {
      active = false;
    };
  }, [snippet?.code]);

  if (isLoading) {
    return <div className="mx-auto max-w-[1380px] px-8 pb-20 pt-32 text-white/58">Loading snippet...</div>;
  }

  if (!snippet || error) {
    return (
      <div className="mx-auto max-w-[1380px] px-8 pb-20 pt-32 text-center">
        <h1 className="type-section-title mb-4 text-white">Snippet Not Found</h1>
        <p className="type-body mb-6 text-white/56">{error || "The requested snippet could not be loaded."}</p>
        <a href="/#library-index" className="text-white underline underline-offset-4">Back to homepage library</a>
      </div>
    );
  }

  const hasCode = snippet.code.trim().length > 0;
  const hasPrompts = snippet.prompts.trim().length > 0;

  async function handleCopy(target: "code" | "prompts", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState((current) => ({ ...current, [target]: "copied" }));
    } catch {
      setCopyState((current) => ({ ...current, [target]: "failed" }));
    }

    if (resetTimers.current[target]) {
      window.clearTimeout(resetTimers.current[target]);
    }

    resetTimers.current[target] = window.setTimeout(() => {
      setCopyState((current) => ({ ...current, [target]: "idle" }));
    }, 1800);
  }

  function renderCopyButton(target: "code" | "prompts", value: string) {
    const state = copyState[target];
    const isCopied = state === "copied";
    const isFailed = state === "failed";
    const label = isCopied ? "Copied" : isFailed ? "Failed" : "Copy";
    const Icon = isCopied ? Check : isFailed ? CopyCheck : Copy;

    return (
      <Button
        size="sm"
        radius="full"
        className="public-copy-button min-w-0 px-3 !text-white/70 hover:!text-white"
        style={
          {
            "--button-bg": "rgba(255, 255, 255, 0.03)",
            "--button-bg-hover": "rgba(255, 255, 255, 0.10)",
            "--button-bg-pressed": "rgba(255, 255, 255, 0.10)",
            "--button-fg": isCopied ? "#ffffff" : isFailed ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.7)",
          } as CSSProperties
        }
        onPress={() => void handleCopy(target, value)}
      >
        <Icon size={14} />
        <span className="type-action">{label}</span>
      </Button>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px] px-6 pb-24 pt-44 md:px-10 md:pt-56">
      <header className="mb-20">
        <div className="mx-auto max-w-[800px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <span className="type-mono-label px-3 py-1 border border-white/10 rounded-full bg-white/5">
              {snippet.category} / {formatDate(snippet.publishedAt)}
            </span>
            <h1 className="type-display text-white">
              {snippet.title}
            </h1>
            <p className="type-body-lg mx-auto max-w-[620px] text-white/50">
              {snippet.excerpt}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-12 flex flex-wrap justify-center gap-4 border-t border-white/5 pt-10"
          >
            <div className="flex flex-col items-center gap-1 min-w-[120px]">
              <span className="type-mono-micro text-white/20">Status</span>
              <span className="type-action text-white">{snippet.status}</span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[120px]">
              <span className="type-mono-micro text-white/20">Object ID</span>
              <span className="type-action text-white">#0{snippet.id.toString().padStart(3, '0')}</span>
            </div>
            {snippet.tags.map((tag) => (
              <div key={tag} className="flex flex-col items-center gap-1 min-w-[120px]">
                <span className="type-mono-micro text-white/20">Tag</span>
                <span className="type-action text-white">{tag.toUpperCase()}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      <section className="mb-24 px-4 md:px-0">
        <div className="vibe-glass mx-auto max-w-[1120px] p-2 rounded-[40px] border-white/10">
          <div className="aspect-[16/9] overflow-hidden rounded-[32px] bg-white/[0.02]">
            <img
              src={snippet.coverImage}
              alt={snippet.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[900px]">
        <article className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="type-mono-label text-white/20">01</span>
              <h3 className="type-section-title text-white">Implementation Notes</h3>
            </div>
            <div className="prose prose-invert max-w-none text-white/60 prose-headings:text-white prose-strong:text-white prose-code:text-white/90 prose-pre:bg-white/[0.02] prose-pre:border prose-pre:border-white/10">
              <MarkdownPreview content={snippet.content} />
            </div>
          </section>

          {hasCode ? (
            <section className="space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="type-mono-label text-white/20">02</span>
                  <h3 className="type-section-title text-white">SwiftUI Source</h3>
                </div>
                {renderCopyButton("code", snippet.code)}
              </div>
              <div className="vibe-glass rounded-[32px] border-white/5 overflow-hidden">
                <div className="p-6 md:p-10">
                  {highlightedCode ? (
                    <div
                      className="snippet-highlight type-code-block overflow-x-auto selection:bg-white/20"
                      dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    />
                  ) : (
                    <pre className="type-code-block overflow-x-auto text-white/80">
                      <code>{snippet.code}</code>
                    </pre>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {hasPrompts ? (
            <section className="space-y-8 pb-12 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="type-mono-label text-white/20">03</span>
                  <h3 className="type-section-title text-white">Prompt Logic</h3>
                </div>
                {renderCopyButton("prompts", snippet.prompts)}
              </div>
              <Card className="vibe-glass rounded-[32px] border-white/5">
                <Card.Content className="px-8 py-10 md:px-12 md:py-14">
                  <pre className="type-code-block whitespace-pre-wrap text-white/50 selection:bg-white/20">
                    <code>{snippet.prompts}</code>
                  </pre>
                </Card.Content>
              </Card>
            </section>
          ) : null}
        </article>
      </div>
    </div>
  );
}
