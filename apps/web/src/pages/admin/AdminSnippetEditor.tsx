import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Modal, TextArea, useOverlayState } from "../../lib/heroui";
import { useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
import HighlightedCodeEditor from "../../components/admin/HighlightedCodeEditor";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getMessages } from "../../lib/messages";
import { getLocalizedSnippetFields, localizePath, useAppLocale } from "../../lib/locale";
import { createEmptyLocalizedFields, getFormLocale, getSnippetLocale } from "../../lib/snippet-localization";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, unpublishSnippet, updateSnippet } from "../../services/snippets";
import { AppLocale, Snippet, SnippetFormState, SnippetPayload, SnippetStatus } from "../../types";
import { Code2, Layout, Monitor, MessageSquareQuote, Smartphone, Settings2, Trash2, X } from "lucide-react";

const EDITABLE_STATUS_OPTIONS: SnippetStatus[] = ["Draft", "In Review", "Scheduled"];
const EDITOR_TABS = [
  { key: "content", label: "Narrative", icon: Layout },
  { key: "code", label: "Code", icon: Code2 },
  { key: "prompt", label: "Prompt", icon: MessageSquareQuote },
  { key: "meta", label: "Surface", icon: Settings2 },
] as const;
type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];
type PreviewDevice = "desktop" | "mobile";
type AutosaveState = "idle" | "saving" | "saved";
type PrimaryActionState = "idle" | "publishing" | "updating";

function EditorSectionRail({
  activeTab,
  onSelect,
}: {
  activeTab: EditorTabKey;
  onSelect: (tab: EditorTabKey) => void;
}) {
  return (
    <div className="relative z-20 -mx-1 overflow-x-auto md:fixed md:left-5 md:top-1/2 md:z-30 md:mx-0 md:overflow-visible md:-translate-y-1/2 xl:left-8">
      <div role="tablist" aria-label="Editor modes" className="flex min-w-full flex-col gap-3 px-1 py-1 md:min-w-0 md:gap-5 md:px-0 md:py-0">
        {EDITOR_TABS.map(({ key, label, icon: Icon }) => {
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
    form.status === "Published" || form.status === "Scheduled"
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
  const copy = getMessages(locale).admin;
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === undefined;
  const [baseSnippet, setBaseSnippet] = useState<Snippet>(createEmptySnippet());
  const [form, setForm] = useState<SnippetFormState>(() => toFormState(createEmptySnippet()));
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editorLocale, setEditorLocale] = useState<AppLocale>("en");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [primaryActionState, setPrimaryActionState] = useState<PrimaryActionState>("idle");
  const hydratedSnippetRef = useRef<Snippet | null>(null);
  const formRef = useRef(form);
  const deleteConfirmState = useOverlayState({
    isOpen: isDeleteConfirmOpen,
    onOpenChange: setIsDeleteConfirmOpen,
  });

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    setEditorLocale(locale);
  }, [locale]);

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
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isNew]);

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

  const previewSnippet = useMemo(() => fromFormState(baseSnippet, form), [baseSnippet, form]);
  const localizedForm = useMemo(() => getFormLocale(form, editorLocale), [editorLocale, form]);
  const localizedPreview = useMemo(() => getLocalizedSnippetFields(previewSnippet, editorLocale), [editorLocale, previewSnippet]);
  const localizedBase = useMemo(() => getLocalizedSnippetFields(baseSnippet, editorLocale), [baseSnippet, editorLocale]);
  const previewPath = baseSnippet.id && localizedBase.slug ? localizePath(locale, `/snippets/${localizedBase.slug}`) : "";
  const hasSavedPreview = Boolean(baseSnippet.id && localizedBase.slug);
  const previewPayloadSignature = useMemo(() => JSON.stringify(toSnippetPayload(previewSnippet)), [previewSnippet]);
  const basePayloadSignature = useMemo(() => JSON.stringify(toSnippetPayload(baseSnippet)), [baseSnippet]);
  const hasUnsavedChanges = previewPayloadSignature !== basePayloadSignature;
  const isPublishedEntry = baseSnippet.status === "Published";
  const statusOptions = isPublishedEntry ? (["Published"] as const) : EDITABLE_STATUS_OPTIONS;
  const primaryActionLabel =
    primaryActionState === "publishing"
      ? "Publishing..."
      : primaryActionState === "updating"
        ? "Updating..."
        : isPublishedEntry
          ? hasUnsavedChanges
            ? "Update"
            : "Published"
          : "Publish";
  const isPrimaryActionDisabled =
    isLoading ||
    isDeleting ||
    autosaveState === "saving" ||
    primaryActionState !== "idle" ||
    (isPublishedEntry && !hasUnsavedChanges);
  const publishDialogTitle = isPublishedEntry
    ? "Update this snippet in the public library?"
    : "Publish this snippet to the public library?";
  const publishDialogButtonLabel =
    primaryActionState === "publishing"
      ? "Publishing..."
      : primaryActionState === "updating"
        ? "Updating..."
        : isPublishedEntry
          ? "Confirm Update"
          : "Confirm Publish";
  const autosaveFeedbackLabel =
    autosaveState === "saving" ? "Saving..." : autosaveState === "saved" ? "Saved" : "";

  const updateField = <K extends keyof SnippetFormState>(field: K, value: SnippetFormState[K]) => {
    setForm((current) => {
      return { ...current, [field]: value };
    });
  };

  const updateLocalizedField = (field: keyof SnippetFormState["locales"]["en"], value: string) => {
    setForm((current) => {
      const currentLocaleForm = current.locales[editorLocale];
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
          [editorLocale]: nextLocaleForm,
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
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [autosaveState]);

  useEffect(() => {
    if (isLoading || isDeleting || primaryActionState !== "idle" || isPublishedEntry || !hasUnsavedChanges) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setAutosaveState("saving");

      try {
        setError("");
        const currentForm = formRef.current;
        const savedSnippet = await persistSnippet(currentForm);

        setBaseSnippet(savedSnippet);
        setFeedback(
          savedSnippet.status === "Scheduled"
            ? "Snippet saved in the schedule. It will stay off the public homepage until published."
            : "Draft changes saved automatically.",
        );
        setAutosaveState("saved");

        if (isNew) {
          hydratedSnippetRef.current = savedSnippet;
          navigate(localizePath(locale, `/admin/snippets/${savedSnippet.id}`), { replace: true });
        }
      } catch (err) {
        setAutosaveState("idle");
        setError(err instanceof Error ? err.message : "Failed to save snippet");
      }
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [hasUnsavedChanges, isDeleting, isLoading, isNew, isPublishedEntry, navigate, persistSnippet, primaryActionState]);

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
          ? "Snippet updated in the public library."
          : "Snippet published and now eligible for the public homepage.",
      );

      if (isNew) {
        hydratedSnippetRef.current = finalSnippet;
        navigate(localizePath(locale, `/admin/snippets/${finalSnippet.id}`), { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish snippet");
    } finally {
      setPrimaryActionState("idle");
    }
  }, [isNew, isPublishedEntry, navigate, persistSnippet]);

  const handleUnpublish = async () => {
    if (!baseSnippet.id) return;

    try {
      setPrimaryActionState("idle");
      setError("");
      setFeedback("");
      const snippet = await unpublishSnippet(baseSnippet.id);
      setBaseSnippet(snippet);
      setForm(toFormState(snippet));
      setFeedback("Snippet moved back to draft and removed from the public library.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish snippet");
    }
  };

  const handleDelete = async () => {
    if (!baseSnippet.id) return;

    try {
      setIsDeleting(true);
      setError("");
      setIsDeleteConfirmOpen(false);
      await deleteSnippet(baseSnippet.id);
      navigate(localizePath(locale, "/admin/snippets"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snippet");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = useCallback(() => {
    if (!hasSavedPreview || !previewPath) {
      setError("");
      setFeedback(
        `Save this draft first to open the public preview at ${localizePath(locale, `/snippets/${localizedForm.slug || "untitled"}`)}.`,
      );
      return;
    }

    setPreviewDevice("desktop");
    setIsPreviewOpen(true);
  }, [hasSavedPreview, localizedForm.slug, previewPath]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  const headerConfig = useMemo(
    () => ({
      end: (
        <>
          {isLoading ? (
            <div className="flex shrink-0 items-center gap-3 xl:mr-1">
              <div className="admin-spinner h-4 w-4 animate-spin rounded-full border-2" />
              <span className="admin-copy-muted type-mono-micro">Syncing...</span>
            </div>
          ) : (
            <div className="hidden shrink-0 2xl:block xl:mr-1">
              <StatusBadge status={previewSnippet.status} />
            </div>
          )}
          {feedback ? (
            <span className="admin-feedback-success type-mono-micro hidden animate-in fade-in duration-500 2xl:block">{feedback}</span>
          ) : null}
          {autosaveFeedbackLabel ? (
            <span className="admin-copy-muted type-mono-micro hidden animate-in fade-in duration-500 xl:block">
              {autosaveFeedbackLabel}
            </span>
          ) : null}
          <Button
            aria-label="Preview"
            className="admin-button-secondary admin-button-icon shrink-0 justify-center"
            onPress={handlePreview}
          >
            <Monitor size={16} />
          </Button>
          <Button
            isDisabled={isPrimaryActionDisabled}
            className="admin-button-primary admin-button-lg shrink-0 px-3 min-[1500px]:px-3 2xl:px-4"
            onPress={() => {
              setError("");
              setFeedback("");
              setIsPublishConfirmOpen(true);
            }}
          >
            {primaryActionLabel}
          </Button>
        </>
      ),
    }),
    [
      autosaveFeedbackLabel,
      feedback,
      handlePreview,
      isDeleting,
      isLoading,
      isPrimaryActionDisabled,
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
          <EditorSectionRail activeTab={activeTab} onSelect={setActiveTab} />

          <div className="space-y-12">
            <div className="relative flex flex-col gap-2">
                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    className={`admin-button-md ${editorLocale === "en" ? "admin-button-primary" : "admin-button-secondary"}`}
                    onClick={() => setEditorLocale("en")}
                  >
                    {copy.localeEditorEnglish}
                  </button>
                  <button
                    type="button"
                    className={`admin-button-md ${editorLocale === "zh" ? "admin-button-primary" : "admin-button-secondary"}`}
                    onClick={() => setEditorLocale("zh")}
                  >
                    {copy.localeEditorChinese}
                  </button>
                </div>
              <textarea
                aria-label="Snippet Title"
                placeholder="Snippet Title"
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
                  <div className="admin-editor-panel admin-editor-panel-frame group relative rounded-[28px] border px-6 py-6">
                    <textarea
                      aria-label="Implementation notes"
                      placeholder="Shape the narrative around the technique and tradeoffs. You can use Markdown."
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
                  <div className="admin-editor-panel admin-editor-panel-frame group relative rounded-[28px] border px-6 py-6">
                    <HighlightedCodeEditor
                      ariaLabel="SwiftUI code"
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
                  <div className="group relative rounded-[28px] border px-6 py-6 admin-editor-panel admin-editor-panel-frame">
                    <textarea
                      aria-label="Prompt notes"
                      placeholder="Capture the AI direction notes that helped shape this specific implementation."
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
                    eyebrow="Identity"
                    title="Snippet frame"
                    description="Core metadata that determines indexing and discovery."
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">Category</span>
                        <Input
                          aria-label="Category"
                          value={localizedForm.category}
                          onChange={(event) => updateLocalizedField("category", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">Tags</span>
                        <Input
                          aria-label="Tags"
                          value={localizedForm.tags}
                          onChange={(event) => updateLocalizedField("tags", event.target.value)}
                          placeholder="SwiftUI, Motion"
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                         <span className="admin-eyebrow type-mono-micro">Route Slug</span>
                         <Input
                           aria-label="Slug"
                           value={localizedForm.slug}
                           onChange={(event) => updateLocalizedField("slug", event.target.value)}
                           className="admin-input w-full"
                         />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="admin-eyebrow type-mono-micro">Cover Image URL</span>
                        <Input
                          aria-label="Cover Image URL"
                          value={form.coverImage}
                          onChange={(event) => updateField("coverImage", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                    </div>
                  </EditorSection>

                  <EditorSection
                    eyebrow="Registry"
                    title="Release controls"
                    description="Manage the publishing state and visibility orbit of this entry."
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                       <label className="grid gap-2">
                         <span className="admin-eyebrow type-mono-micro">Status</span>
                         <select
                           value={form.status}
                           onChange={(event) => updateField("status", event.target.value as SnippetStatus)}
                           className="admin-select w-full"
                           disabled={isPublishedEntry}
                         >
                           {statusOptions.map((status) => (
                             <option key={status} value={status} disabled={status === "Published"}>
                               {status}
                             </option>
                           ))}
                         </select>
                       </label>
                       <label className="grid gap-2">
                         <span className="admin-eyebrow type-mono-micro">Published At</span>
                         <input
                           type="datetime-local"
                           value={form.publishedAt}
                           onChange={(event) => updateField("publishedAt", event.target.value)}
                           className="admin-native-input w-full"
                         />
                       </label>
                    </div>
                  </EditorSection>

                  <EditorSection
                    eyebrow="Search"
                    title="Surface optimization"
                    description="Detailed SEO control for search results and previews."
                  >
                    <div className="grid gap-6">
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">SEO Title</span>
                        <Input
                          aria-label="SEO Title"
                          value={localizedForm.seoTitle}
                          onChange={(event) => updateLocalizedField("seoTitle", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">SEO Description</span>
                        <TextArea
                          aria-label="SEO Description"
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
                      <div className="admin-danger-shell flex items-center justify-between p-6 rounded-[32px]">
                      <div>
                          <h3 className="admin-danger-title font-semibold">Danger Zone</h3>
                          <p className="admin-copy-muted mt-1">Permanently remove this entry from the registry.</p>
                        </div>
                        <Button
                          variant="outline"
                          radius="full"
                          className="admin-danger-button h-10 border-dashed transition-all"
                          isDisabled={isDeleting || primaryActionState !== "idle"}
                          onPress={() => setIsDeleteConfirmOpen(true)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete Snippet
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
              className="admin-inline-alert rounded-[24px] p-5"
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
            <div className="admin-header admin-preview-shell flex h-full w-full flex-col overflow-hidden rounded-[28px]">
              <div className="admin-preview-toolbar flex flex-col gap-4 px-5 py-4 md:px-8 md:py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    isIconOnly
                    aria-label="Close preview"
                    className="admin-button-secondary h-10 w-10"
                    onPress={closePreview}
                  >
                    <X size={16} />
                  </Button>
                  <div>
                    <p className="admin-copy-faint type-mono-micro">Preview Mode</p>
                    <h2 className="admin-section-title mt-1">
                      {localizedForm.title || "Untitled Snippet"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewPath}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-button-secondary flex h-10 items-center"
                  >
                    Open in tab
                  </a>
                  <Button className="admin-button-primary h-10" onPress={closePreview}>
                    Done
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="admin-preview-device-tabs inline-flex items-center rounded-[18px] border p-1"
                  role="tablist"
                  aria-label="Preview devices"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewDevice === "mobile"}
                    className={`admin-preview-device-button inline-flex h-10 items-center gap-2 rounded-[14px] px-4 transition-colors ${
                      previewDevice === "mobile" ? "admin-preview-device-button-active" : "admin-preview-device-button-inactive"
                    }`}
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone size={15} />
                    <span>Mobile</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewDevice === "desktop"}
                    className={`admin-preview-device-button inline-flex h-10 items-center gap-2 rounded-[14px] px-4 transition-colors ${
                      previewDevice === "desktop" ? "admin-preview-device-button-active" : "admin-preview-device-button-inactive"
                    }`}
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Monitor size={15} />
                    <span>Desktop</span>
                  </button>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  <span className="admin-copy-faint type-mono-micro">Public route</span>
                  <span className="admin-preview-route-chip rounded-full border px-3 py-1.5">
                    {previewPath}
                  </span>
                </div>
              </div>
              </div>
              <div className="admin-preview-canvas flex flex-1 min-h-0 px-3 py-3 md:px-6 md:py-6">
                <div className="admin-preview-stage flex h-full min-h-0 w-full items-center justify-center overflow-auto rounded-[24px] border p-4 md:p-7">
                <div
                  className={`admin-preview-frame w-full rounded-[24px] border transition-all duration-300 ${
                    previewDevice === "desktop"
                      ? "max-w-[min(1440px,92vw)]"
                      : "max-w-[430px]"
                  }`}
                  data-preview-device={previewDevice}
                >
                  <div className="admin-preview-browser-chrome flex items-center gap-2 px-4 py-4 md:px-6">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                    <div className="admin-preview-address ml-4 flex-1 rounded-full border px-4 py-2 text-center">
                      {previewPath}
                    </div>
                  </div>
                  <div
                    className={`admin-preview-iframe-shell overflow-hidden rounded-b-[24px] ${
                      previewDevice === "mobile" ? "mx-auto aspect-[390/844]" : "aspect-[16/10]"
                    }`}
                  >
                    <iframe
                      title="Snippet public preview"
                      src={previewPath}
                      className="admin-preview-iframe h-full w-full border-0"
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
                <span className="admin-eyebrow type-mono-micro">Delete Confirmation</span>
                <Modal.Heading className="admin-section-title admin-section-title-lg mt-3">
                  Delete this snippet permanently?
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="admin-delete-modal-body">
                <p className="admin-copy-muted">
                  This will permanently remove{" "}
                  <strong className="admin-title-strong">{localizedPreview.title || "Untitled Snippet"}</strong> from
                  the registry. This action cannot be undone.
                </p>
              </Modal.Body>
              <Modal.Footer className="admin-delete-modal-footer">
                <Button
                  isDisabled={isDeleting}
                  className="admin-button-secondary admin-button-lg px-5"
                  onPress={() => setIsDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={isDeleting}
                  className="admin-button-danger admin-button-lg px-5"
                  onPress={handleDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete Snippet"}
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
            <div className="admin-publish-dialog w-full max-w-xl rounded-[30px] border px-6 py-6 md:px-8 md:py-8">
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <span className="admin-eyebrow type-mono-micro">Publish Confirmation</span>
                  <h2 className="admin-section-title admin-section-title-lg">
                    {publishDialogTitle}
                  </h2>
                  <p className="admin-copy-muted">
                    {isPublishedEntry ? "Confirming will save the current editor state and replace the live public version of " : "Confirming will save the current editor state and make "}
                    <strong className="admin-title-strong">{localizedPreview.title || "Untitled Snippet"}</strong>
                    {isPublishedEntry ? "." : " live in the public snippet library."}
                  </p>
                </div>
                <div className="admin-publish-dialog-callout rounded-[22px] border px-4 py-4">
                  {hasUnsavedChanges
                    ? isPublishedEntry
                      ? "This published snippet has local edits. We will save those changes before updating the live public version."
                      : "This entry has unsaved changes. We will save those edits before publishing."
                    : isPublishedEntry
                      ? "No local edits detected. Updating now will re-publish the current saved version."
                      : "No unsaved changes detected. Publishing will make the current saved version live."}
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <Button
                    isDisabled={primaryActionState !== "idle"}
                    className="admin-button-secondary admin-button-lg px-5"
                    onPress={() => setIsPublishConfirmOpen(false)}
                  >
                    Cancel
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
