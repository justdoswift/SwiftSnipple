import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Modal, TextArea, useOverlayState } from "../../lib/heroui";
import { useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
import HighlightedCodeEditor from "../../components/admin/HighlightedCodeEditor";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, unpublishSnippet, updateSnippet } from "../../services/snippets";
import { Snippet, SnippetFormState, SnippetPayload, SnippetStatus } from "../../types";
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
    title: "",
    slug: "",
    excerpt: "",
    category: "Workflow",
    tags: [],
    coverImage:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    content: `# New Snippet

Show the implementation here.

## Key points

- add your first point
- add supporting evidence
- explain what makes it useful`,
    code: `import SwiftUI

struct ExampleSnippetView: View {
  var body: some View {
    Text("Build something delightful")
      .padding()
  }
}`,
    prompts: `Build a polished SwiftUI snippet with:
- clear visual hierarchy
- native-feeling motion
- reusable layout structure

Explain the tradeoffs briefly after the code.`,
    seoTitle: "",
    seoDescription: "",
    status: "Draft",
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  };
}

function toFormState(snippet: Snippet): SnippetFormState {
  return {
    title: snippet.title,
    slug: snippet.slug,
    excerpt: snippet.excerpt,
    category: snippet.category,
    tags: snippet.tags.join(", "),
    coverImage: snippet.coverImage,
    content: snippet.content,
    code: snippet.code,
    prompts: snippet.prompts,
    seoTitle: snippet.seoTitle,
    seoDescription: snippet.seoDescription,
    status: snippet.status,
    publishedAt: toDateTimeInputValue(snippet.publishedAt),
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
    title: form.title.trim() || "Untitled Snippet",
    slug: form.slug.trim() || slugify(form.title || "untitled-snippet"),
    excerpt: form.excerpt.trim(),
    category: form.category.trim() || "Workflow",
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    coverImage: form.coverImage.trim(),
    content: form.content,
    code: form.code,
    prompts: form.prompts,
    seoTitle: form.seoTitle.trim(),
    seoDescription: form.seoDescription.trim(),
    status: form.status,
    publishedAt,
    updatedAt: new Date().toISOString(),
  };
}

function toSnippetPayload(snippet: Snippet): SnippetPayload {
  return {
    title: snippet.title,
    slug: snippet.slug,
    excerpt: snippet.excerpt,
    category: snippet.category,
    tags: snippet.tags,
    coverImage: snippet.coverImage,
    content: snippet.content,
    code: snippet.code,
    prompts: snippet.prompts,
    seoTitle: snippet.seoTitle,
    seoDescription: snippet.seoDescription,
    status: snippet.status,
    publishedAt: snippet.publishedAt,
  };
}

export default function AdminSnippetEditor() {
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
  const previewPath = baseSnippet.slug ? `/snippets/${baseSnippet.slug}` : "";
  const hasSavedPreview = Boolean(baseSnippet.id && baseSnippet.slug);
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
      if (field === "title" && (!current.slug || current.slug === slugify(current.title))) {
        return { ...current, title: String(value), slug: slugify(String(value)) };
      }
      return { ...current, [field]: value };
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
          navigate(`/admin/snippets/${savedSnippet.id}`, { replace: true });
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
        navigate(`/admin/snippets/${finalSnippet.id}`, { replace: true });
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
      navigate("/admin/snippets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snippet");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = useCallback(() => {
    if (!hasSavedPreview || !previewPath) {
      setError("");
      setFeedback(`Save this draft first to open the public preview at /snippets/${form.slug || "untitled"}.`);
      return;
    }

    setPreviewDevice("desktop");
    setIsPreviewOpen(true);
  }, [form.slug, hasSavedPreview, previewPath]);

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
            <span className="admin-feedback-success hidden text-xs font-mono animate-in fade-in duration-500 2xl:block">{feedback}</span>
          ) : null}
          {autosaveFeedbackLabel ? (
            <span className="admin-copy-muted hidden text-xs font-mono animate-in fade-in duration-500 xl:block">
              {autosaveFeedbackLabel}
            </span>
          ) : null}
          <Button
            aria-label="Preview"
            className="h-11 w-11 shrink-0 justify-center px-0 text-sm admin-button-secondary"
            onPress={handlePreview}
          >
            <Monitor size={16} />
          </Button>
          <Button
            isDisabled={isPrimaryActionDisabled}
            className="h-11 shrink-0 px-2.5 text-sm admin-button-primary min-[1500px]:px-3 2xl:px-4"
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
              <textarea
                aria-label="Snippet Title"
                placeholder="Snippet Title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="admin-editor-title-input w-full border-none bg-transparent p-0 text-5xl font-bold tracking-tighter transition-all duration-500 resize-none outline-none overflow-hidden focus:ring-0 md:text-7xl"
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
                      value={form.content}
                      onChange={(event) => updateField("content", event.target.value)}
                      className="admin-editor-textarea admin-editor-panel-body admin-editor-scrollbar w-full resize-none border-0 bg-transparent px-0 text-lg leading-relaxed shadow-none outline-none focus:ring-0"
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
                      value={form.prompts}
                      onChange={(event) => updateField("prompts", event.target.value)}
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
                          value={form.category}
                          onChange={(event) => updateField("category", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">Tags</span>
                        <Input
                          aria-label="Tags"
                          value={form.tags}
                          onChange={(event) => updateField("tags", event.target.value)}
                          placeholder="SwiftUI, Motion"
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                         <span className="admin-eyebrow type-mono-micro">Route Slug</span>
                         <Input
                           aria-label="Slug"
                           value={form.slug}
                           onChange={(event) => updateField("slug", event.target.value)}
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
                           className="admin-select w-full text-sm"
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
                          value={form.seoTitle}
                          onChange={(event) => updateField("seoTitle", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">SEO Description</span>
                        <TextArea
                          aria-label="SEO Description"
                          value={form.seoDescription}
                          onChange={(event) => updateField("seoDescription", event.target.value)}
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
                          <p className="admin-copy-muted text-sm mt-1">Permanently remove this entry from the registry.</p>
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
              className="admin-inline-alert rounded-[24px] p-5 text-sm leading-relaxed"
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
                    <h2 className="admin-header-title mt-1 text-lg font-semibold md:text-xl">
                      {form.title || "Untitled Snippet"}
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
                    className={`admin-preview-device-button inline-flex h-10 items-center gap-2 rounded-[14px] px-4 text-sm transition-colors ${
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
                    className={`admin-preview-device-button inline-flex h-10 items-center gap-2 rounded-[14px] px-4 text-sm transition-colors ${
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
                  <span className="admin-preview-route-chip rounded-full border px-3 py-1.5 font-mono text-xs">
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
                    <div className="admin-preview-address ml-4 flex-1 rounded-full border px-4 py-2 text-center font-mono text-xs">
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
                <Modal.Heading className="admin-section-title mt-3 text-[1.55rem] md:text-[1.8rem]">
                  Delete this snippet permanently?
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="admin-delete-modal-body">
                <p className="admin-copy-muted text-sm leading-relaxed md:text-base">
                  This will permanently remove{" "}
                  <strong className="admin-title-strong">{previewSnippet.title || "Untitled Snippet"}</strong> from
                  the registry. This action cannot be undone.
                </p>
              </Modal.Body>
              <Modal.Footer className="admin-delete-modal-footer">
                <Button
                  isDisabled={isDeleting}
                  className="admin-button-secondary h-11 px-5"
                  onPress={() => setIsDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={isDeleting}
                  className="admin-button-danger h-11 px-5"
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
                  <h2 className="admin-section-title text-[1.6rem] md:text-[1.9rem]">
                    {publishDialogTitle}
                  </h2>
                  <p className="admin-copy-muted text-sm leading-relaxed md:text-base">
                    {isPublishedEntry ? "Confirming will save the current editor state and replace the live public version of " : "Confirming will save the current editor state and make "}
                    <strong className="admin-title-strong">{previewSnippet.title || "Untitled Snippet"}</strong>
                    {isPublishedEntry ? "." : " live in the public snippet library."}
                  </p>
                </div>
                <div className="admin-publish-dialog-callout rounded-[22px] border px-4 py-4 text-sm leading-relaxed">
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
                    className="admin-button-secondary h-11 px-5"
                    onPress={() => setIsPublishConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    isDisabled={primaryActionState !== "idle"}
                    className="admin-button-primary h-11 px-5"
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
