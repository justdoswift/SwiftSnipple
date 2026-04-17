import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HighlightedCodeBlock from "../components/HighlightedCodeBlock";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { extractMarkdownOutline, type MarkdownOutlineItem } from "../lib/markdown-outline";
import { getSnippetBySlug } from "../services/snippets";
import { Snippet } from "../types";

type SnippetSectionId = "notes" | "code" | "prompts";

type SnippetSection = {
  id: SnippetSectionId;
  number: string;
  label: string;
  content: ReactNode;
};

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getInitialDesktopState() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(min-width: 768px)").matches;
}

function normalizeSectionHash(hash: string): SnippetSectionId | null {
  const value = hash.replace(/^#/, "");
  if (value === "notes" || value === "code" || value === "prompts") {
    return value;
  }

  return null;
}

export default function SnippetDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(getInitialDesktopState);
  const [activeSectionId, setActiveSectionId] = useState<SnippetSectionId>("notes");
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const [isNotesContentsHovered, setIsNotesContentsHovered] = useState(false);
  const [hasEnteredDesktopReadingZone, setHasEnteredDesktopReadingZone] = useState(false);
  const [hasReachedDesktopReadingZoneEnd, setHasReachedDesktopReadingZoneEnd] = useState(false);
  const desktopReadingStartRef = useRef<HTMLDivElement | null>(null);
  const desktopReadingEndRef = useRef<HTMLDivElement | null>(null);

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
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const hasCode = snippet?.code.trim().length ? true : false;
  const hasPrompts = snippet?.prompts.trim().length ? true : false;
  const notesOutline = useMemo<MarkdownOutlineItem[]>(
    () => (snippet ? extractMarkdownOutline(snippet.content) : []),
    [snippet],
  );
  const sections = useMemo<SnippetSection[]>(() => {
    if (!snippet) {
      return [];
    }

    const availableSections: SnippetSection[] = [
      {
        id: "notes",
        number: "01",
        label: "Implementation Notes",
        content: (
          <div className="rounded-[32px] border border-white/8 bg-white/[0.02] px-6 py-7 md:px-8 md:py-9">
            <MarkdownRenderer content={snippet.content} />
          </div>
        ),
      },
    ];

    if (hasCode) {
      availableSections.push({
        id: "code",
        number: "02",
        label: "SwiftUI Source",
        content: (
          <HighlightedCodeBlock
            code={snippet.code}
            language="swift"
            copyable
            copyLabel="Swift code"
            className="markdown-code-block snippet-highlight type-code-block overflow-x-auto selection:bg-white/20"
            fallbackClassName="markdown-code-block type-code-block overflow-x-auto text-white/80"
          />
        ),
      });
    }

    if (hasPrompts) {
      availableSections.push({
        id: "prompts",
        number: "03",
        label: "Prompt Logic",
        content: (
          <HighlightedCodeBlock
            code={snippet.prompts}
            copyable
            copyLabel="prompt logic"
            fallbackClassName="markdown-code-block type-code-block whitespace-pre-wrap text-white/50 selection:bg-white/20"
          />
        ),
      });
    }

    return availableSections;
  }, [hasCode, hasPrompts, snippet?.code, snippet?.content, snippet?.prompts]);

  useEffect(() => {
    if (!sections.length) return;

    const requestedSection = normalizeSectionHash(location.hash);
    const hasRequestedSection = requestedSection
      ? sections.some((section) => section.id === requestedSection)
      : false;

    setActiveSectionId(hasRequestedSection && requestedSection ? requestedSection : sections[0].id);
  }, [location.hash, sections]);

  useEffect(() => {
    setActiveOutlineId(notesOutline[0]?.id ?? null);
  }, [notesOutline, activeSectionId]);

  useEffect(() => {
    if (activeSectionId !== "notes" || !notesOutline.length) {
      setIsNotesContentsHovered(false);
    }
  }, [activeSectionId, notesOutline]);

  useEffect(() => {
    if (!isDesktop) {
      setHasEnteredDesktopReadingZone(false);
      setHasReachedDesktopReadingZoneEnd(false);
      return;
    }

    const startTarget = desktopReadingStartRef.current;
    const endTarget = desktopReadingEndRef.current;
    if (!startTarget || !endTarget) {
      return;
    }

    if (typeof IntersectionObserver !== "function") {
      setHasEnteredDesktopReadingZone(true);
      setHasReachedDesktopReadingZoneEnd(false);
      return;
    }

    const startObserver = new IntersectionObserver(
      ([entry]) => {
        const hasEntered = Boolean(entry && (entry.isIntersecting || entry.boundingClientRect.top < 0));
        setHasEnteredDesktopReadingZone(hasEntered);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -70% 0px",
      },
    );

    const endObserver = new IntersectionObserver(
      ([entry]) => {
        const hasReachedEnd = Boolean(entry && (entry.isIntersecting || entry.boundingClientRect.top < 0));
        setHasReachedDesktopReadingZoneEnd(hasReachedEnd);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -70% 0px",
      },
    );

    startObserver.observe(startTarget);
    endObserver.observe(endTarget);

    return () => {
      startObserver.disconnect();
      endObserver.disconnect();
    };
  }, [activeSectionId, isDesktop, isLoading]);

  useEffect(() => {
    const isDesktopRailVisible = isDesktop && hasEnteredDesktopReadingZone && !hasReachedDesktopReadingZoneEnd;
    if (!isDesktopRailVisible) {
      setIsNotesContentsHovered(false);
    }
  }, [hasEnteredDesktopReadingZone, hasReachedDesktopReadingZoneEnd, isDesktop]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const isDesktopRailVisible = isDesktop && hasEnteredDesktopReadingZone && !hasReachedDesktopReadingZoneEnd;
  const canShowContentsPanel =
    isDesktop && isDesktopRailVisible && activeSection?.id === "notes" && notesOutline.length > 0;
  const showContentsPanel = canShowContentsPanel && isNotesContentsHovered;
  const desktopContentWrapperClass = activeSection?.id === "notes" ? "mx-auto max-w-[800px]" : "mx-auto max-w-[800px]";

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

      {isDesktop ? (
        <div className="relative">
          <AnimatePresence>
            {isDesktopRailVisible ? (
              <motion.div
                key="desktop-section-rail"
                initial={{ opacity: 0, x: -12, y: "-50%" }}
                animate={{ opacity: 1, x: 0, y: "-50%" }}
                exit={{ opacity: 0, x: -12, y: "-50%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed left-5 top-1/2 z-30 flex items-center gap-[10px] md:left-8 xl:left-12"
                onMouseLeave={() => setIsNotesContentsHovered(false)}
              >
                <nav aria-label="Snippet sections" className="flex flex-col gap-5">
                  {sections.map((section) => {
                    const isActive = section.id === activeSection.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        className="group flex items-center gap-4 text-left"
                        aria-label={`${section.number} ${section.label}`}
                        aria-pressed={isActive}
                        onMouseEnter={() => {
                          if (section.id === "notes" && canShowContentsPanel) {
                            setIsNotesContentsHovered(true);
                          }
                        }}
                        onFocus={() => {
                          if (section.id === "notes" && canShowContentsPanel) {
                            setIsNotesContentsHovered(true);
                          }
                        }}
                        onClick={() => {
                          setActiveSectionId(section.id);
                          navigate(
                            {
                              pathname: location.pathname,
                              hash: `#${section.id}`,
                            },
                            { replace: true },
                          );
                        }}
                      >
                        <span
                          className={`block h-14 w-[3px] rounded-full transition-colors ${
                            isActive ? "bg-white" : "bg-white/16 group-hover:bg-white/35"
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`font-mono text-[11px] font-medium tracking-[0.22em] transition-colors ${
                            isActive ? "text-white" : "text-white/34 group-hover:text-white/62"
                          }`}
                        >
                          {section.number}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                <AnimatePresence>
                  {showContentsPanel ? (
                    <motion.aside
                      key="notes-contents-panel"
                      initial={{ opacity: 0, x: -8, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="hidden w-[250px] rounded-[24px] border border-white/8 bg-[#111111] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:block"
                    >
                      <p className="type-mono-label mb-6 text-white/78">Contents</p>
                      <div className="space-y-3">
                        {notesOutline.map((item) => {
                          const isActive = item.id === activeOutlineId;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`block w-full truncate text-left text-[0.95rem] leading-tight transition-colors ${
                                item.level === 3 ? "pl-4" : ""
                              } ${isActive ? "text-white" : "text-white/54 hover:text-white/74"}`}
                              aria-current={isActive ? "true" : undefined}
                              onClick={() => {
                                setActiveOutlineId(item.id);
                                document.getElementById(item.id)?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              }}
                            >
                              {item.text}
                            </button>
                          );
                        })}
                      </div>
                    </motion.aside>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className={`${desktopContentWrapperClass} px-4 md:px-0`}>
            <div ref={desktopReadingStartRef} data-testid="desktop-reading-start" aria-hidden="true" className="h-px w-full" />
            <motion.section
              key={activeSection.id}
              id={activeSection.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-12 text-white"
            >
              <div className="flex items-center gap-4">
                <span className="type-mono-label text-white/20">{activeSection.number}</span>
                <h3 className="type-section-title text-white">{activeSection.label}</h3>
              </div>
              {activeSection.content}
            </motion.section>
            <div ref={desktopReadingEndRef} data-testid="desktop-reading-end" aria-hidden="true" className="h-px w-full" />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-[900px]">
          <article className="space-y-16">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`space-y-8 text-white ${index === sections.length - 1 ? "pb-12" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="type-mono-label text-white/20">{section.number}</span>
                  <h3 className="type-section-title text-white">{section.label}</h3>
                </div>
                {section.content}
              </section>
            ))}
          </article>
        </div>
      )}
    </div>
  );
}
