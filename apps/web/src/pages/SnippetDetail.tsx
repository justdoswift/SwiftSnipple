import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import HighlightedCodeBlock from "../components/HighlightedCodeBlock";
import MarkdownRenderer from "../components/MarkdownRenderer";
import PublicCenteredLoading from "../components/PublicCenteredLoading";
import { resolveAssetUrl } from "../lib/asset-url";
import { getMessages } from "../lib/messages";
import { extractMarkdownOutline, type MarkdownOutlineItem } from "../lib/markdown-outline";
import { getLocalizedSnippetFields, getLocalizedSnippetPath, localizePublicPath, useAppLocale } from "../lib/locale";
import { isSnippetLocaleAvailable } from "../lib/snippet-localization";
import { getMemberSession } from "../services/member-auth";
import { getSnippetBySlug } from "../services/snippets";
import { MemberSession, Snippet } from "../types";

type SnippetSectionId = "notes" | "code" | "prompts";

type SnippetSection = {
  id: SnippetSectionId;
  number: string;
  label: string;
  content: ReactNode;
};

const DESKTOP_SECTION_SCROLL_OFFSET = 104;

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat(undefined, {
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
  const { locale } = useAppLocale();
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const previewLocale = useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("preview") !== "admin") {
      return null;
    }

    const requestedLocale = params.get("locale");
    return requestedLocale === "zh" || requestedLocale === "en" ? requestedLocale : null;
  }, [location.search]);
  const effectiveLocale = previewLocale ?? locale;
  const copy = getMessages(effectiveLocale).snippetDetail;
  const common = getMessages(effectiveLocale).common;
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(getInitialDesktopState);
  const [activeSectionId, setActiveSectionId] = useState<SnippetSectionId>("notes");
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const [isNotesContentsHovered, setIsNotesContentsHovered] = useState(false);
  const [hasEnteredDesktopReadingZone, setHasEnteredDesktopReadingZone] = useState(false);
  const [hasReachedDesktopReadingZoneEnd, setHasReachedDesktopReadingZoneEnd] = useState(false);
  const [isCoverImageBroken, setIsCoverImageBroken] = useState(false);
  const desktopReadingStartRef = useRef<HTMLDivElement | null>(null);
  const desktopReadingEndRef = useRef<HTMLDivElement | null>(null);
  const activeSectionRef = useRef<HTMLElement | null>(null);
  const pendingDesktopSectionScrollRef = useRef<SnippetSectionId | null>(null);

  useEffect(() => {
    let active = true;

    getMemberSession()
      .then((session) => {
        if (!active) return;
        setMemberSession(session);
      })
      .catch(() => {
        if (!active) return;
        setMemberSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setIsLoading(true);
    setIsCoverImageBroken(false);
    Promise.resolve(getSnippetBySlug(slug, location.search))
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
  }, [location.search, slug]);

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

  const localizedFields = useMemo(
    () => (snippet ? getLocalizedSnippetFields(snippet, effectiveLocale) : null),
    [effectiveLocale, snippet],
  );
  const isLocaleAvailable = useMemo(
    () => (snippet ? isSnippetLocaleAvailable(snippet, effectiveLocale) : false),
    [effectiveLocale, snippet],
  );
  const isAdminPreview = useMemo(() => {
    if (!location.search) {
      return false;
    }

    return new URLSearchParams(location.search).get("preview") === "admin";
  }, [location.search]);
  const hasCode = snippet?.code.trim().length ? true : false;
  const hasPrompts = isLocaleAvailable && localizedFields?.prompts.trim().length ? true : false;
  const isLocked = Boolean(snippet?.locked);
  const notesOutline = useMemo<MarkdownOutlineItem[]>(
    () => (localizedFields && !isLocked && isLocaleAvailable ? extractMarkdownOutline(localizedFields.content) : []),
    [isLocaleAvailable, isLocked, localizedFields],
  );
  const paywallCTAPath = memberSession ? localizePublicPath("/account") : localizePublicPath("/login");
  const paywallCTALabel = memberSession ? copy.unlockNow : copy.loginToUnlock;
  const sections = useMemo<SnippetSection[]>(() => {
    if (!snippet) {
      return [];
    }

    if (!isLocaleAvailable) {
      return [
        {
          id: "notes",
          number: "01",
          label: copy.implementationNotes,
          content: (
            <div className="public-content-panel mx-auto max-w-[800px] px-6 py-6 md:px-8 md:py-8">
              <div className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-8 text-center md:px-10 md:py-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1 text-[var(--public-micro)]">
                  <span className="type-mono-micro">{common.languageUnavailable}</span>
                </div>
                <h3 className="type-section-title mb-3">{common.languageUnavailable}</h3>
                <p className="type-body mx-auto max-w-[56ch]">{common.languageUnavailableLong}</p>
              </div>
            </div>
          ),
        },
      ];
    }

    if (snippet.locked) {
      const lockedContent = (
        <div className="public-content-panel mx-auto max-w-[800px] px-6 py-6 md:px-8 md:py-8">
          <div className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-8 text-center md:px-10 md:py-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1 text-[var(--public-micro)]">
              <LockKeyhole size={14} />
              <span className="type-mono-micro">{copy.membersOnly}</span>
            </div>
            <h3 className="type-section-title mb-3">{copy.paywallTitle}</h3>
            <p className="type-body mx-auto mb-6 max-w-[56ch]">{copy.paywallCopy}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to={paywallCTAPath} className="public-primary-button public-button-lg type-action inline-flex items-center justify-center">
                {paywallCTALabel}
              </Link>
              <Link to={localizePublicPath("/account")} className="public-secondary-button public-button-lg type-action inline-flex items-center justify-center">
                {copy.manageSubscription}
              </Link>
            </div>
          </div>
        </div>
      );

      return [
        {
          id: "notes",
          number: "01",
          label: copy.implementationNotes,
          content: lockedContent,
        },
        {
          id: "code",
          number: "02",
          label: copy.swiftuiSource,
          content: lockedContent,
        },
        {
          id: "prompts",
          number: "03",
          label: copy.promptLogic,
          content: lockedContent,
        },
      ];
    }

    const availableSections: SnippetSection[] = [
      {
        id: "notes",
        number: "01",
        label: copy.implementationNotes,
        content: (
          <div className="public-snippet-notes-panel px-6 py-6 md:px-8 md:py-8">
            <MarkdownRenderer content={localizedFields?.content ?? ""} />
          </div>
        ),
      },
    ];

    if (hasCode) {
      availableSections.push({
        id: "code",
        number: "02",
        label: copy.swiftuiSource,
        content: (
          <HighlightedCodeBlock
            code={snippet.code}
            language="swift"
            copyable
            copyLabel={copy.copySwiftCode}
            className="markdown-code-block public-code-block snippet-highlight type-code-block overflow-x-auto"
            fallbackClassName="markdown-code-block public-code-block type-code-block overflow-x-auto"
          />
        ),
      });
    }

    if (hasPrompts) {
      availableSections.push({
        id: "prompts",
        number: "03",
        label: copy.promptLogic,
        content: (
          <HighlightedCodeBlock
            code={localizedFields?.prompts ?? ""}
            copyable
            copyLabel={copy.copyPromptLogic}
            fallbackClassName="markdown-code-block public-code-block type-code-block whitespace-pre-wrap"
          />
        ),
      });
    }

    return availableSections;
  }, [copy.copyPromptLogic, copy.copySwiftCode, copy.implementationNotes, copy.loginToUnlock, copy.manageSubscription, copy.membersOnly, copy.paywallCopy, copy.paywallTitle, copy.promptLogic, copy.swiftuiSource, effectiveLocale, hasCode, hasPrompts, isLocaleAvailable, localizedFields?.content, localizedFields?.prompts, memberSession, paywallCTALabel, paywallCTAPath, snippet]);

  useEffect(() => {
    if (!snippet || !localizedFields || !slug) return;
    if (isLocaleAvailable && localizedFields.slug !== slug) {
      navigate(getLocalizedSnippetPath(effectiveLocale, snippet), { replace: true });
    }
  }, [effectiveLocale, isLocaleAvailable, localizedFields, navigate, slug, snippet]);

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

  useEffect(() => {
    if (!isDesktop) {
      pendingDesktopSectionScrollRef.current = null;
      return;
    }

    const pendingSectionId = pendingDesktopSectionScrollRef.current;
    if (!pendingSectionId || pendingSectionId !== activeSectionId || typeof window === "undefined") {
      return;
    }

    const target = activeSectionRef.current;
    if (!target) {
      return;
    }

    pendingDesktopSectionScrollRef.current = null;

    window.requestAnimationFrame(() => {
      const top = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - DESKTOP_SECTION_SCROLL_OFFSET,
      );

      window.scrollTo({
        top,
        behavior: "smooth",
      });
    });
  }, [activeSectionId, isDesktop]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const isDesktopRailVisible =
    isDesktop && (isAdminPreview || hasEnteredDesktopReadingZone) && !hasReachedDesktopReadingZoneEnd;
  const canShowContentsPanel =
    isDesktop && isDesktopRailVisible && activeSection?.id === "notes" && notesOutline.length > 0;
  const showContentsPanel = canShowContentsPanel && isNotesContentsHovered;
  const desktopContentWrapperClass = activeSection?.id === "notes" ? "mx-auto max-w-[800px]" : "mx-auto max-w-[800px]";
  const detailShellClass = "public-page public-snippet-detail mx-auto max-w-[1400px] px-8 pt-32 md:px-12 md:pt-36 lg:px-16 lg:pt-40";

  if (isLoading) {
    return <PublicCenteredLoading label={copy.loadingSnippet} testId="snippet-detail-loading" />;
  }

  if (!snippet || error) {
    return (
      <div data-testid="snippet-detail-shell" className={`${detailShellClass} pb-20 text-center`}>
        <h1 className="type-section-title mb-4">{copy.snippetNotFound}</h1>
        <p className="type-body mb-6 public-status-copy">{error || copy.snippetNotFoundCopy}</p>
        <a href={`${localizePublicPath("/")}#library-index`} className="public-inline-link">{copy.backToLibrary}</a>
      </div>
    );
  }

  return (
    <div data-testid="snippet-detail-shell" className={`${detailShellClass} pb-24`}>
      <header className="mb-16 md:mb-20">
        <div className="mx-auto max-w-[800px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="public-pill type-mono-label px-3 py-1">
                {(isLocaleAvailable ? localizedFields?.category : common.languageUnavailable)} / {formatDate(snippet.publishedAt)}
              </span>
              {snippet.requiresSubscription ? (
                <span className="public-pill type-mono-label inline-flex items-center gap-2 px-3 py-1">
                  <LockKeyhole size={14} />
                  {copy.membersOnly}
                </span>
              ) : null}
            </div>
            <h1 className="type-display">
              {isLocaleAvailable ? localizedFields?.title : common.languageUnavailable}
            </h1>
            <p className="type-body-lg mx-auto max-w-[620px]">
              {isLocaleAvailable ? localizedFields?.excerpt : common.languageUnavailableLong}
            </p>
          </motion.div>
        </div>
      </header>

      <section className="mb-20 px-4 md:mb-24 md:px-0">
        <div className="public-content-frame vibe-glass mx-auto max-w-[1120px] p-2">
          <div className="snippet-cover-frame public-media-shell overflow-hidden">
            {isCoverImageBroken ? (
              <div className="flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.02)] text-center">
                <div className="max-w-[32ch] px-6 py-8">
                  <div className="mb-3 inline-flex items-center rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                    <span className="type-mono-micro text-[rgba(255,255,255,0.58)]">{copy.loadingSnippet}</span>
                  </div>
                  <p className="type-body text-[rgba(255,255,255,0.64)]">
                    {copy.coverUnavailable}
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={resolveAssetUrl(snippet.coverImage)}
                alt={localizedFields?.title}
                className="snippet-cover-image"
                referrerPolicy="no-referrer"
                onError={() => setIsCoverImageBroken(true)}
              />
            )}
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
                        className="public-section-rail-button group flex items-center gap-4 text-left"
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
                          pendingDesktopSectionScrollRef.current = section.id;
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
                          className="public-section-rail-line block h-14 w-[3px] rounded-full transition-colors"
                          data-active={isActive ? "true" : "false"}
                          aria-hidden="true"
                        />
                        <span
                          className="public-section-rail-number type-mono-micro tracking-[0.22em] transition-colors"
                          data-active={isActive ? "true" : "false"}
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
                      className="public-contents-panel hidden w-[250px] px-5 py-6 md:block"
                    >
                      <p className="type-mono-label mb-6">Contents</p>
                      <div className="space-y-3">
                        {notesOutline.map((item) => {
                          const isActive = item.id === activeOutlineId;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`public-contents-link type-body-sm block w-full truncate text-left transition-colors ${
                                item.level === 3 ? "pl-4" : ""
                              }`}
                              data-active={isActive ? "true" : "false"}
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
              ref={activeSectionRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="public-section-content space-y-8 pb-12"
            >
              <div className="flex items-center gap-4">
                <span className="type-mono-label">{activeSection.number}</span>
                <h3 className="type-section-title">{activeSection.label}</h3>
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
                className={`public-section-content space-y-8 ${index === sections.length - 1 ? "pb-12" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="type-mono-label">{section.number}</span>
                  <h3 className="type-section-title">{section.label}</h3>
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
