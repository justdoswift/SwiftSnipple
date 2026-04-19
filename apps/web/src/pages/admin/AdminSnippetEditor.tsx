import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Dropdown, Input, Modal, TextArea, Tooltip, useOverlayState } from "../../lib/heroui";
import { useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
import HighlightedCodeEditor from "../../components/admin/HighlightedCodeEditor";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { resolveAssetUrl } from "../../lib/asset-url";
import { getMessages } from "../../lib/messages";
import { getLocalizedSnippetFields, localizeAdminPath, localizePublicPath, useAppLocale } from "../../lib/locale";
import { createEmptyLocalizedFields, getFormLocale, getSnippetLocale } from "../../lib/snippet-localization";
import { isUnauthorizedError } from "../../services/api";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, unpublishSnippet, updateSnippet, uploadCoverImage } from "../../services/snippets";
import { Snippet, SnippetFormState, SnippetPayload, SnippetStatus } from "../../types";
import { ChevronDown, ChevronLeft, Code2, Eye, ImageUp, Layout, Monitor, MessageSquareQuote, Send, Smartphone, Settings2, Trash2, X } from "lucide-react";

const EDITABLE_STATUS_OPTIONS: SnippetStatus[] = ["Draft"];
type EditorTabKey = "content" | "code" | "prompt" | "meta";
type PreviewDevice = "desktop" | "mobile";
type AutosaveState = "idle" | "saving" | "saved";
type PrimaryActionState = "idle" | "publishing" | "updating";
type EditorStatusOption = {
  id: SnippetStatus;
  label: string;
};
type EditorTabOption = {
  key: EditorTabKey;
  label: string;
  icon: typeof Layout;
};

const AUTOSAVE_DEBOUNCE_MS = 900;
const AUTOSAVE_MIN_SAVING_MS = 650;
const AUTOSAVE_SAVED_VISIBLE_MS = 2400;

function EditorSectionRail({
  activeTab,
  onSelect,
  tabs,
}: {
  activeTab: EditorTabKey;
  onSelect: (tab: EditorTabKey) => void;
  tabs: EditorTabOption[];
}) {
  return (
    <div className="relative z-20 -mx-1 overflow-x-auto md:fixed md:left-5 md:top-1/2 md:z-30 md:mx-0 md:overflow-visible md:-translate-y-1/2 xl:left-8">
      <div role="tablist" aria-label="Editor modes" className="flex min-w-full flex-col gap-3 px-1 py-1 md:min-w-0 md:gap-5 md:px-0 md:py-0">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isSelected = activeTab === key;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`editor-panel-${key}`}
              id={`editor-tab-${key}`}
              className={`admin-editor-section-link group flex items-center gap-3 text-left ${
                isSelected ? "admin-editor-section-link-active" : "admin-editor-section-link-inactive"
              }`}
              onClick={() => onSelect(key)}
            >
              <span className="admin-editor-rail-line" data-active={isSelected} aria-hidden="true" />
              <span className="admin-editor-rail-icon" data-active={isSelected} aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span className="admin-editor-section-label type-mono-micro">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(date).replace(" ", "T");
}

function createEmptySnippet(): Snippet {
  return {
    id: "",
    coverImage:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    locales: {
      en: {
        ...createEmptyLocalizedFields(),
        title: "",
        slug: "",
        content: `# New Snippet

Show the implementation here.

## Key points

- add your first point
- add supporting evidence
- explain what makes it useful`,
        prompts: `Build a polished SwiftUI snippet with:
- clear visual hierarchy
- native-feeling motion
- reusable layout structure

Explain the tradeoffs briefly after the code.`,
      },
      zh: {
        ...createEmptyLocalizedFields(),
        title: "",
        slug: "",
        content: `# 新 Snippet

在这里记录实现说明。

## 关键点

- 先写出第一条重点
- 补充支持证据
- 解释它为什么值得复用`,
        prompts: `构建一个高完成度的 SwiftUI snippet：
- 有清晰的信息层级
- 有原生感的动效
- 具备可复用的布局结构

在代码后简要说明关键取舍。`,
      },
    },
    code: `import SwiftUI

struct ExampleSnippetView: View {
  var body: some View {
    Text("Build something delightful")
      .padding()
  }
}`,
    status: "Draft",
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  };
}

function toFormState(snippet: Snippet): SnippetFormState {
  const english = getSnippetLocale(snippet, "en");
  const chinese = getSnippetLocale(snippet, "zh");

  return {
    coverImage: snippet.coverImage,
    code: snippet.code,
    status: snippet.status,
    publishedAt: toDateTimeInputValue(snippet.publishedAt),
    locales: {
      en: {
        title: english.title,
        slug: english.slug,
        excerpt: english.excerpt,
        category: english.category,
        tags: english.tags.join(", "),
        content: english.content,
        prompts: english.prompts,
        seoTitle: english.seoTitle,
        seoDescription: english.seoDescription,
      },
      zh: {
        title: chinese.title,
        slug: chinese.slug,
        excerpt: chinese.excerpt,
        category: chinese.category,
        tags: chinese.tags.join(", "),
        content: chinese.content,
        prompts: chinese.prompts,
        seoTitle: chinese.seoTitle,
        seoDescription: chinese.seoDescription,
      },
    },
  };
}

function fromFormState(baseSnippet: Snippet, form: SnippetFormState): Snippet {
  const publishedAt =
    form.status === "Published"
      ? form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : new Date().toISOString()
      : null;

  return {
    ...baseSnippet,
    locales: {
      en: {
        title: form.locales.en.title.trim() || "Untitled Snippet",
        slug: form.locales.en.slug.trim() || slugify(form.locales.en.title || "untitled-snippet"),
        excerpt: form.locales.en.excerpt.trim(),
        category: form.locales.en.category.trim() || "Workflow",
        tags: form.locales.en.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        content: form.locales.en.content,
        prompts: form.locales.en.prompts,
        seoTitle: form.locales.en.seoTitle.trim(),
        seoDescription: form.locales.en.seoDescription.trim(),
      },
      zh: {
        title: form.locales.zh.title.trim() || "未命名 Snippet",
        slug: form.locales.zh.slug.trim() || slugify(form.locales.zh.title || "untitled-snippet"),
        excerpt: form.locales.zh.excerpt.trim(),
        category: form.locales.zh.category.trim() || "Workflow",
        tags: form.locales.zh.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        content: form.locales.zh.content,
        prompts: form.locales.zh.prompts,
        seoTitle: form.locales.zh.seoTitle.trim(),
        seoDescription: form.locales.zh.seoDescription.trim(),
      },
    },
    coverImage: form.coverImage.trim(),
    code: form.code,
    status: form.status,
    publishedAt,
    updatedAt: new Date().toISOString(),
  };
}

function toSnippetPayload(snippet: Snippet): SnippetPayload {
  const english = getSnippetLocale(snippet, "en");
  const chinese = getSnippetLocale(snippet, "zh");

  return {
    coverImage: snippet.coverImage,
    code: snippet.code,
    status: snippet.status,
    publishedAt: snippet.publishedAt,
    locales: {
      en: { ...english },
      zh: { ...chinese },
    },
  };
}

export default function AdminSnippetEditor() {
  const { locale } = useAppLocale();
  const messages = getMessages(locale);
  const copy = messages.admin;
  const common = messages.common;
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === undefined;
  const [baseSnippet, setBaseSnippet] = useState<Snippet>(createEmptySnippet());
  const [form, setForm] = useState<SnippetFormState>(() => toFormState(createEmptySnippet()));
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [primaryActionState, setPrimaryActionState] = useState<PrimaryActionState>("idle");
  const hydratedSnippetRef = useRef<Snippet | null>(null);
  const formRef = useRef(form);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewScrollResetTimeoutRef = useRef<number | null>(null);
  const deleteConfirmState = useOverlayState({
    isOpen: isDeleteConfirmOpen,
    onOpenChange: setIsDeleteConfirmOpen,
  });

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const redirectToAdminLogin = useCallback(() => {
    navigate(localizeAdminPath(locale, "/admin/login"), { replace: true });
  }, [locale, navigate]);

  useEffect(() => {
    if (isNew || !id) {
      const emptySnippet = createEmptySnippet();
      setBaseSnippet(emptySnippet);
      setForm(toFormState(emptySnippet));
      setIsLoading(false);
      setAutosaveState("idle");
      setPrimaryActionState("idle");
      return;
    }

    if (hydratedSnippetRef.current?.id === id) {
      const hydratedSnippet = hydratedSnippetRef.current;
      hydratedSnippetRef.current = null;
      setBaseSnippet(hydratedSnippet);
      setForm(toFormState(hydratedSnippet));
      setIsLoading(false);
      setAutosaveState("idle");
      setPrimaryActionState("idle");
      return;
    }

    let active = true;
    setIsLoading(true);
    getSnippetById(id)
      .then((snippet) => {
        if (!active) return;
        setBaseSnippet(snippet);
        setForm(toFormState(snippet));
        setError("");
        setFeedback("");
        setAutosaveState("idle");
        setPrimaryActionState("idle");
      })
      .catch((err: Error) => {
        if (!active) return;
        if (isUnauthorizedError(err)) {
          redirectToAdminLogin();
          return;
        }
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isNew, redirectToAdminLogin]);

  useEffect(() => {
    if (!isPreviewOpen && !isPublishConfirmOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
          return;
        }

        setIsPublishConfirmOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen, isPublishConfirmOpen]);

  const resetPreviewIframeScroll = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (!iframe) {
      return;
    }

    const syncScrollToTop = () => {
      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframeWindow?.document;
      const isJsdomWindow = iframeWindow?.navigator.userAgent.includes("jsdom");

      if (!isJsdomWindow) {
        try {
          iframeWindow?.scrollTo?.(0, 0);
        } catch {
          // Some embedded contexts may reject programmatic scrolling.
        }
      }

      if (iframeDocument) {
        if (iframeDocument.documentElement) {
          iframeDocument.documentElement.scrollTop = 0;
        }
        if (iframeDocument.body) {
          iframeDocument.body.scrollTop = 0;
        }
      }
    };

    syncScrollToTop();

    if (previewScrollResetTimeoutRef.current !== null) {
      window.clearTimeout(previewScrollResetTimeoutRef.current);
    }

    previewScrollResetTimeoutRef.current = window.setTimeout(() => {
      syncScrollToTop();
      previewScrollResetTimeoutRef.current = null;
    }, 90);
  }, []);

  const previewSnippet = useMemo(() => fromFormState(baseSnippet, form), [baseSnippet, form]);
  const editorTabs = useMemo<EditorTabOption[]>(
    () => [
      { key: "content", label: copy.narrative, icon: Layout },
      { key: "code", label: copy.code, icon: Code2 },
      { key: "prompt", label: copy.prompt, icon: MessageSquareQuote },
      { key: "meta", label: copy.surface, icon: Settings2 },
    ],
    [copy.code, copy.narrative, copy.prompt, copy.surface],
  );
  const localizedForm = useMemo(() => getFormLocale(form, locale), [form, locale]);
  const localizedPreview = useMemo(() => getLocalizedSnippetFields(previewSnippet, locale), [locale, previewSnippet]);
  const localizedBase = useMemo(() => getLocalizedSnippetFields(baseSnippet, locale), [baseSnippet, locale]);
  const untitledSnippetLabel = copy.untitledSnippet;
  const previewPath = baseSnippet.id && localizedBase.slug ? localizePublicPath(`/snippets/${localizedBase.slug}`) : "";
  const previewIframePath = previewPath ? `${previewPath}?preview=admin` : "";
  const hasSavedPreview = Boolean(baseSnippet.id && localizedBase.slug);
  const previewPayloadSignature = useMemo(() => JSON.stringify(toSnippetPayload(previewSnippet)), [previewSnippet]);
  const basePayloadSignature = useMemo(() => JSON.stringify(toSnippetPayload(baseSnippet)), [baseSnippet]);
  const hasUnsavedChanges = previewPayloadSignature !== basePayloadSignature;
  const isPublishedEntry = baseSnippet.status === "Published";
  const statusOptions = isPublishedEntry ? (["Published"] as const) : EDITABLE_STATUS_OPTIONS;
  const statusSelectOptions = useMemo<EditorStatusOption[]>(
    () => statusOptions.map((status) => ({ id: status, label: common.statuses[status] })),
    [common.statuses, statusOptions],
  );
  const selectedStatusLabel = statusSelectOptions.find((option) => option.id === form.status)?.label ?? form.status;
  const primaryActionLabel =
    primaryActionState === "publishing"
      ? copy.publishing
      : primaryActionState === "updating"
        ? copy.updating
        : isPublishedEntry
          ? hasUnsavedChanges
            ? copy.update
            : copy.publishedStable
          : copy.publish;
  const isPrimaryActionDisabled =
    isLoading ||
    isDeleting ||
    autosaveState === "saving" ||
    primaryActionState !== "idle" ||
    (isPublishedEntry && !hasUnsavedChanges);
  const publishDialogTitle = isPublishedEntry
    ? copy.updateDialogTitle
    : copy.publishDialogTitle;
  const publishDialogButtonLabel =
    primaryActionState === "publishing"
      ? copy.publishing
      : primaryActionState === "updating"
        ? copy.updating
        : isPublishedEntry
          ? copy.confirmUpdate
          : copy.confirmPublish;
  const saveState = isLoading ? "syncing" : autosaveState === "saving" ? "saving" : "saved";
  const saveStateLabel = saveState === "syncing" ? copy.syncing : saveState === "saving" ? copy.saving : copy.saved;
  const autosaveFeedbackLabel =
    autosaveState === "saving" ? copy.saving : autosaveState === "saved" ? copy.saved : "";
  useEffect(() => {
    if (!isPreviewOpen) {
      if (previewScrollResetTimeoutRef.current !== null) {
        window.clearTimeout(previewScrollResetTimeoutRef.current);
        previewScrollResetTimeoutRef.current = null;
      }
      return;
    }

    resetPreviewIframeScroll();
  }, [isPreviewOpen, previewDevice, previewIframePath, resetPreviewIframeScroll]);

  const updateField = <K extends keyof SnippetFormState>(field: K, value: SnippetFormState[K]) => {
    setForm((current) => {
      return { ...current, [field]: value };
    });
  };

  const updateLocalizedField = (field: keyof SnippetFormState["locales"]["en"], value: string) => {
    setForm((current) => {
      const currentLocaleForm = current.locales[locale];
      const nextLocaleForm = {
        ...currentLocaleForm,
        [field]: value,
      };

      if (field === "title" && (!currentLocaleForm.slug || currentLocaleForm.slug === slugify(currentLocaleForm.title))) {
        nextLocaleForm.slug = slugify(value);
      }

      return {
        ...current,
        locales: {
          ...current.locales,
          [locale]: nextLocaleForm,
        },
      };
    });
  };

  const persistSnippet = useCallback(
    async (nextForm: SnippetFormState) => {
      const payload = toSnippetPayload(fromFormState(baseSnippet, nextForm));
      return isNew ? createSnippet(payload) : updateSnippet(baseSnippet.id, payload);
    },
    [baseSnippet, isNew],
  );

  useEffect(() => {
    if (autosaveState !== "saved") return undefined;

    const timeoutId = window.setTimeout(() => {
      setAutosaveState("idle");
    }, AUTOSAVE_SAVED_VISIBLE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [autosaveState]);

  useEffect(() => {
    if (isLoading || isDeleting || primaryActionState !== "idle" || isPublishedEntry || !hasUnsavedChanges) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const savingStartedAt = Date.now();
      setAutosaveState("saving");

      try {
        setError("");
        const currentForm = formRef.current;
        const savedSnippet = await persistSnippet(currentForm);
        const savingElapsedMs = Date.now() - savingStartedAt;

        if (savingElapsedMs < AUTOSAVE_MIN_SAVING_MS) {
          await new Promise((resolve) => window.setTimeout(resolve, AUTOSAVE_MIN_SAVING_MS - savingElapsedMs));
        }

        setBaseSnippet(savedSnippet);
        setFeedback(copy.autoSavedDraft);
        setAutosaveState("saved");

        if (isNew) {
          hydratedSnippetRef.current = savedSnippet;
          navigate(localizeAdminPath(locale, `/admin/snippets/${savedSnippet.id}`), { replace: true });
        }
      } catch (err) {
        if (isUnauthorizedError(err)) {
          redirectToAdminLogin();
          return;
        }
        setAutosaveState("idle");
        setError(err instanceof Error ? err.message : copy.failedSave);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [copy.failedSave, hasUnsavedChanges, isDeleting, isLoading, isNew, isPublishedEntry, navigate, persistSnippet, primaryActionState, redirectToAdminLogin]);

  const handleConfirmPublish = useCallback(async () => {
    const nextActionState: PrimaryActionState = isPublishedEntry ? "updating" : "publishing";
    setIsPublishConfirmOpen(false);
    setPrimaryActionState(nextActionState);

    try {
      setError("");
      setFeedback("");
      setAutosaveState("idle");
      const savedSnippet = await persistSnippet(formRef.current);
      const finalSnippet = await publishSnippet(savedSnippet.id);

      setBaseSnippet(finalSnippet);
      setForm(toFormState(finalSnippet));
      setFeedback(
        nextActionState === "updating"
          ? copy.updateSuccess
          : copy.publishSuccess,
      );

      if (isNew) {
        hydratedSnippetRef.current = finalSnippet;
        navigate(localizeAdminPath(locale, `/admin/snippets/${finalSnippet.id}`), { replace: true });
      }
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }
      setError(err instanceof Error ? err.message : copy.failedPublish);
    } finally {
      setPrimaryActionState("idle");
    }
  }, [copy.failedPublish, copy.publishSuccess, copy.updateSuccess, isNew, isPublishedEntry, navigate, persistSnippet, redirectToAdminLogin]);

  const handleUnpublish = async () => {
    if (!baseSnippet.id) return;

    try {
      setPrimaryActionState("idle");
      setError("");
      setFeedback("");
      const snippet = await unpublishSnippet(baseSnippet.id);
      setBaseSnippet(snippet);
      setForm(toFormState(snippet));
      setFeedback(copy.unpublishSuccess);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }
      setError(err instanceof Error ? err.message : copy.failedPublish);
    }
  };

  const handleDelete = async () => {
    if (!baseSnippet.id) return;

    try {
      setIsDeleting(true);
      setError("");
      setIsDeleteConfirmOpen(false);
      await deleteSnippet(baseSnippet.id);
      navigate(localizeAdminPath(locale, "/admin/snippets"));
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }
      setError(err instanceof Error ? err.message : copy.failedDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCoverImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) {
      setError(copy.invalidCoverImage);
      return;
    }

    try {
      setError("");
      setFeedback("");
      setIsUploadingCoverImage(true);
      const result = await uploadCoverImage(file);
      updateField("coverImage", result.url);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }
      setError(err instanceof Error ? err.message : copy.failedCoverImageUpload);
    } finally {
      setIsUploadingCoverImage(false);
    }
  }, [copy.failedCoverImageUpload, copy.invalidCoverImage, redirectToAdminLogin]);

  const handlePreview = useCallback(() => {
    if (!hasSavedPreview || !previewPath) {
      setError("");
      setFeedback(`${copy.saveDraftFirst} ${localizePublicPath(`/snippets/${localizedForm.slug || "untitled"}`)}.`);
      return;
    }

    setPreviewDevice("desktop");
    setIsPreviewOpen(true);
  }, [copy.saveDraftFirst, hasSavedPreview, localizedForm.slug, previewPath]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  const headerConfig = useMemo(
    () => ({
      start: (
        <div className="admin-editor-header-start flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={copy.backToSnippetLibrary}
            className="admin-editor-back-button"
            onClick={() => navigate(localizeAdminPath(locale, "/admin/snippets"))}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <motion.div
            className="admin-editor-save-chip type-action"
            data-state={saveState}
            animate={
              saveState === "saving"
                ? { y: -1, scale: 1.012 }
                : saveState === "syncing"
                  ? { y: -0.5, scale: 1.006 }
                  : { y: 0, scale: 1 }
            }
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="admin-editor-save-indicator"
              aria-hidden="true"
              animate={
                saveState === "saving"
                  ? { scale: [1, 1.18, 1], opacity: [0.72, 1, 0.72] }
                  : saveState === "syncing"
                    ? { scale: [1, 1.12, 1], opacity: [0.66, 0.94, 0.66] }
                    : { scale: 1, opacity: 1 }
              }
              transition={
                saveState === "saved"
                  ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 1.05, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }
              }
            />
            <span className="admin-editor-save-label-wrap">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={saveState}
                  className="admin-editor-save-label"
                  initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -5, filter: "blur(2px)" }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {saveStateLabel}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>
        </div>
      ),
      end: (
        <>
          {feedback ? (
            <span className="admin-feedback-success type-mono-micro hidden animate-in fade-in duration-500 2xl:block">{feedback}</span>
          ) : null}
          <div className="hidden shrink-0 2xl:block xl:mr-1">
            <StatusBadge status={previewSnippet.status} />
          </div>
          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button
                type="button"
                aria-label={copy.preview}
                className="admin-nav-action-icon type-action"
                onClick={handlePreview}
              >
                <Eye className="h-5 w-5" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {copy.preview}
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <button
                type="button"
                aria-label={primaryActionLabel}
                className="admin-nav-action-icon type-action"
                disabled={isPrimaryActionDisabled}
                onClick={() => {
                  setError("");
                  setFeedback("");
                  setIsPublishConfirmOpen(true);
                }}
              >
                <Send className="h-5 w-5" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {primaryActionLabel}
            </Tooltip.Content>
          </Tooltip>
        </>
      ),
    }),
    [
      autosaveState,
      copy.preview,
      copy.backToSnippetLibrary,
      copy.syncing,
      copy.saving,
      copy.saved,
      feedback,
      handlePreview,
      isDeleting,
      isLoading,
      isPrimaryActionDisabled,
      locale,
      navigate,
      primaryActionLabel,
      primaryActionState,
      previewSnippet.status,
    ],
  );

  useAdminHeader(headerConfig);

  return (
    <div className="admin-page">
      <main className="px-6 pb-12 pt-10 md:px-8 md:pb-16 md:pt-10 lg:pb-24 lg:pt-12 xl:px-10">
        <div className="flex flex-col gap-12">
          <EditorSectionRail activeTab={activeTab} onSelect={setActiveTab} tabs={editorTabs} />

          <div className="space-y-12">
            <div className="relative flex flex-col gap-2">
              <textarea
                aria-label={copy.snippetTitle}
                placeholder={copy.snippetTitle}
                value={localizedForm.title}
                onChange={(e) => updateLocalizedField("title", e.target.value)}
                className="admin-editor-title-input w-full resize-none overflow-hidden border-none bg-transparent p-0 outline-none transition-all duration-500 focus:ring-0"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>

            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            >
              {activeTab === "content" && (
                <div
                  id="editor-panel-content"
                  role="tabpanel"
                  aria-labelledby="editor-tab-content"
                  className="py-4"
                >
                  <div className="admin-editor-panel admin-editor-panel-frame group relative border px-6 py-6">
                    <textarea
                      aria-label={copy.implementationNotes}
                      placeholder={copy.implementationPlaceholder}
                      value={localizedForm.content}
                      onChange={(event) => updateLocalizedField("content", event.target.value)}
                      className="admin-editor-textarea admin-editor-panel-body admin-editor-scrollbar w-full resize-none border-0 bg-transparent px-0 shadow-none outline-none focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {activeTab === "code" && (
                <div
                  id="editor-panel-code"
                  role="tabpanel"
                  aria-labelledby="editor-tab-code"
                  className="py-4"
                >
                  <div className="admin-editor-panel admin-editor-panel-frame group relative border px-6 py-6">
                    <HighlightedCodeEditor
                      ariaLabel={copy.codeAria}
                      placeholder="import SwiftUI..."
                      value={form.code}
                      onChange={(value) => updateField("code", value)}
                      shellClassName="admin-editor-panel-body"
                    />
                  </div>
                </div>
              )}

              {activeTab === "prompt" && (
                <div
                  id="editor-panel-prompt"
                  role="tabpanel"
                  aria-labelledby="editor-tab-prompt"
                  className="py-4"
                >
                  <div className="group relative border px-6 py-6 admin-editor-panel admin-editor-panel-frame">
                    <textarea
                      aria-label={copy.promptAria}
                      placeholder={copy.promptPlaceholder}
                      value={localizedForm.prompts}
                      onChange={(event) => updateLocalizedField("prompts", event.target.value)}
                      className="admin-editor-textarea admin-editor-panel-body admin-editor-scrollbar w-full resize-none border-0 bg-transparent px-0 shadow-none outline-none focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {activeTab === "meta" && (
                <div
                  id="editor-panel-meta"
                  role="tabpanel"
                  aria-labelledby="editor-tab-meta"
                  className="space-y-8"
                >
                  <EditorSection
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">{copy.category}</span>
                        <Input
                          aria-label={copy.category}
                          value={localizedForm.category}
                          onChange={(event) => updateLocalizedField("category", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                         <span className="admin-eyebrow type-mono-micro">{copy.routeSlug}</span>
                         <Input
                           aria-label={copy.routeSlug}
                           value={localizedForm.slug}
                           onChange={(event) => updateLocalizedField("slug", event.target.value)}
                           className="admin-input w-full"
                         />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="admin-eyebrow type-mono-micro">{copy.coverImage}</span>
                        <div className="admin-cover-upload-shell grid gap-4">
                          {form.coverImage ? (
                            <div className="admin-cover-upload-preview aspect-[16/10] overflow-hidden">
                              <img
                                src={resolveAssetUrl(form.coverImage)}
                                alt={localizedForm.title || copy.untitledSnippet}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              ref={coverImageInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="sr-only"
                              onChange={handleCoverImageUpload}
                            />
                            <Button
                              type="button"
                              className="admin-button-secondary admin-button-md"
                              isDisabled={isUploadingCoverImage}
                              onPress={() => coverImageInputRef.current?.click()}
                            >
                              <ImageUp size={16} className="mr-2" />
                              {isUploadingCoverImage
                                ? copy.uploadingCoverImage
                                : form.coverImage
                                  ? copy.replaceCoverImage
                                  : copy.uploadCoverImage}
                            </Button>
                            {!form.coverImage ? (
                              <span className="admin-copy-faint type-mono-micro min-w-0 truncate">
                                {copy.coverImageUploadHint}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    </div>
                  </EditorSection>

                  <EditorSection
                    eyebrow={copy.registry}
                    title={copy.releaseControls}
                    description={copy.releaseControlsCopy}
                  >
                    <div className="grid gap-6">
                       <label className="grid gap-2">
                         <span className="admin-eyebrow type-mono-micro">{copy.status}</span>
                         <Dropdown>
                           <Dropdown.Trigger
                             aria-label={copy.status}
                             className="admin-form-select-trigger"
                             isDisabled={isPublishedEntry}
                           >
                             <span className="admin-form-select-value">{selectedStatusLabel}</span>
                             <ChevronDown className="admin-form-select-indicator" />
                           </Dropdown.Trigger>
                           <Dropdown.Popover>
                             <Dropdown.Menu
                               items={statusSelectOptions}
                               selectionMode="single"
                               disallowEmptySelection
                               selectedKeys={[form.status]}
                               onAction={(key) => updateField("status", String(key) as SnippetStatus)}
                             >
                               {(option: EditorStatusOption) => (
                                 <Dropdown.Item
                                   id={option.id}
                                   textValue={option.label}
                                 >
                                   {option.label}
                                   <Dropdown.ItemIndicator />
                                 </Dropdown.Item>
                               )}
                             </Dropdown.Menu>
                           </Dropdown.Popover>
                         </Dropdown>
                       </label>
                    </div>
                  </EditorSection>

                  <EditorSection
                    eyebrow={copy.search}
                    title={copy.surfaceOptimization}
                    description={copy.surfaceOptimizationCopy}
                  >
                    <div className="grid gap-6">
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">{copy.seoTitle}</span>
                        <Input
                          aria-label={copy.seoTitle}
                          value={localizedForm.seoTitle}
                          onChange={(event) => updateLocalizedField("seoTitle", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">{copy.seoDescription}</span>
                        <TextArea
                          aria-label={copy.seoDescription}
                          value={localizedForm.seoDescription}
                          onChange={(event) => updateLocalizedField("seoDescription", event.target.value)}
                          rows={3}
                          className="admin-textarea w-full"
                        />
                      </label>
                    </div>
                  </EditorSection>

                  {!isNew && (
                    <section className="admin-divider-soft pt-10 border-t">
                      <div className="admin-danger-shell flex items-center justify-between p-6">
                      <div>
                          <h3 className="admin-danger-title font-semibold">{copy.dangerZone}</h3>
                          <p className="admin-copy-muted mt-1">{copy.dangerZoneCopy}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="admin-danger-button h-10 border-dashed transition-all"
                          isDisabled={isDeleting || primaryActionState !== "idle"}
                          onPress={() => setIsDeleteConfirmOpen(true)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          {copy.deleteSnippet}
                        </Button>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-inline-alert p-5"
            >
              {error}
            </motion.div>
          ) : null}
        </div>
      </main>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Dismiss preview backdrop"
            className="admin-preview-backdrop absolute inset-0"
            onClick={closePreview}
          />
          <div className="relative z-10 flex h-full w-full flex-col p-4 md:p-6">
            <div className="admin-header admin-preview-shell flex h-full w-full flex-col overflow-hidden">
              <div className="admin-preview-toolbar flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8 md:py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    isIconOnly
                    aria-label={common.cancel}
                    className="admin-button-secondary h-10 w-10"
                    onPress={closePreview}
                  >
                    <X size={16} />
                  </Button>
                  <div
                  className="admin-preview-device-tabs inline-flex items-center border p-1"
                  role="tablist"
                  aria-label={copy.previewDevices}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewDevice === "mobile"}
                      className={`admin-preview-toolbar-button admin-preview-device-button inline-flex h-10 items-center gap-2 px-4 transition-colors ${
                        previewDevice === "mobile" ? "admin-preview-device-button-active" : "admin-preview-device-button-inactive"
                      }`}
                      onClick={() => setPreviewDevice("mobile")}
                    >
                      <Smartphone size={15} />
                      <span>{common.mobile}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewDevice === "desktop"}
                      className={`admin-preview-toolbar-button admin-preview-device-button inline-flex h-10 items-center gap-2 px-4 transition-colors ${
                        previewDevice === "desktop" ? "admin-preview-device-button-active" : "admin-preview-device-button-inactive"
                      }`}
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      <Monitor size={15} />
                      <span>{common.desktop}</span>
                    </button>
                  </div>
                </div>
                <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 md:flex">
                  <span className="admin-copy-faint type-mono-micro">{copy.publicRoute}</span>
                  <span className="admin-preview-route-chip max-w-full truncate border px-3 py-1.5">
                    {previewPath}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="admin-button-primary admin-preview-toolbar-button h-10" onPress={closePreview}>
                    {common.done}
                  </Button>
                </div>
              </div>
              <div className="admin-preview-canvas flex flex-1 min-h-0 px-3 py-3 md:px-6 md:py-6">
                <div
                  className={`admin-preview-stage flex h-full min-h-0 w-full justify-center overflow-auto border p-4 md:p-7 ${
                    previewDevice === "mobile" ? "items-start" : "items-center"
                  }`}
                >
                <div
                  className={`admin-preview-frame w-full border transition-all duration-300 ${
                    previewDevice === "desktop"
                      ? "max-w-[min(1440px,92vw)]"
                      : "max-w-[460px]"
                  }`}
                  data-preview-device={previewDevice}
                >
                  <div className="admin-preview-browser-chrome flex items-center gap-2 px-4 py-4 md:px-6">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div
                    className={`admin-preview-iframe-shell overflow-hidden ${
                      previewDevice === "mobile" ? "mx-auto aspect-[390/844]" : "aspect-[16/10]"
                    }`}
                  >
                    <iframe
                      ref={previewIframeRef}
                      title="Snippet public preview"
                      src={previewIframePath}
                      className="admin-preview-iframe h-full w-full border-0"
                      onLoad={resetPreviewIframeScroll}
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal state={deleteConfirmState}>
        <Modal.Trigger className="sr-only">
          <button type="button" tabIndex={-1} aria-hidden="true">
            Open delete confirmation
          </button>
        </Modal.Trigger>
        <Modal.Backdrop className="admin-delete-modal-backdrop" isDismissable={!isDeleting}>
          <Modal.Container placement="center">
              <Modal.Dialog className="admin-delete-modal w-full max-w-xl">
              <Modal.Header className="admin-delete-modal-header">
                <span className="admin-eyebrow type-mono-micro">{copy.deleteConfirmation}</span>
                <Modal.Heading className="admin-section-title admin-section-title-lg mt-3">
                  {copy.deletePermanently}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="admin-delete-modal-body">
                <p className="admin-copy-muted">{copy.deletePermanentCopy}</p>
              </Modal.Body>
              <Modal.Footer className="admin-delete-modal-footer">
                <Button
                  isDisabled={isDeleting}
                  className="admin-button-secondary admin-button-lg px-5"
                  onPress={() => setIsDeleteConfirmOpen(false)}
                >
                  {common.cancel}
                </Button>
                <Button
                  isDisabled={isDeleting}
                  className="admin-button-danger admin-button-lg px-5"
                  onPress={handleDelete}
                >
                  {isDeleting ? copy.deleting : copy.deleteSnippet}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {isPublishConfirmOpen ? (
        <div className="fixed inset-0 z-[85]">
          <button
            type="button"
            aria-label="Dismiss publish confirmation backdrop"
            className="admin-preview-backdrop absolute inset-0"
            onClick={() => setIsPublishConfirmOpen(false)}
          />
          <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-6 md:px-6">
            <div className="admin-publish-dialog w-full max-w-xl border px-6 py-6 md:px-8 md:py-8">
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <span className="admin-eyebrow type-mono-micro">{copy.publishConfirmation}</span>
                  <h2 className="admin-section-title admin-section-title-lg">
                    {publishDialogTitle}
                  </h2>
                  <p className="admin-copy-muted">
                    {isPublishedEntry ? copy.updateLivePrefix : copy.publishLivePrefix}{" "}
                    <strong className="admin-title-strong">{localizedPreview.title || untitledSnippetLabel}</strong>
                    {isPublishedEntry ? copy.updateLiveSuffix : ` ${copy.publishLiveSuffix}`}
                  </p>
                </div>
                <div className="admin-publish-dialog-callout border px-4 py-4">
                  {hasUnsavedChanges
                    ? isPublishedEntry
                      ? copy.updateUnsaved
                      : copy.publishUnsaved
                    : isPublishedEntry
                      ? copy.updateSaved
                      : copy.publishSaved}
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <Button
                    isDisabled={primaryActionState !== "idle"}
                    className="admin-button-secondary admin-button-lg px-5"
                    onPress={() => setIsPublishConfirmOpen(false)}
                  >
                    {common.cancel}
                  </Button>
                  <Button
                    isDisabled={primaryActionState !== "idle"}
                    className="admin-button-primary admin-button-lg px-5"
                    onPress={handleConfirmPublish}
                  >
                    {publishDialogButtonLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
