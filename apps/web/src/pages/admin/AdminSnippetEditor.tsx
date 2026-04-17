import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, TextArea } from "../../lib/heroui";
import { useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, unpublishSnippet, updateSnippet } from "../../services/snippets";
import { Snippet, SnippetFormState, SnippetPayload, SnippetStatus } from "../../types";
import { ChevronLeft, Columns2, Layout, Monitor, Smartphone, Settings2, Trash2, X } from "lucide-react";

const STATUS_OPTIONS: SnippetStatus[] = ["Draft", "In Review", "Scheduled", "Published"];
const EDITOR_TABS = [
  { key: "content", label: "Narrative", icon: Layout },
  { key: "builder", label: "Builder", icon: Columns2 },
  { key: "meta", label: "Surface", icon: Settings2 },
] as const;
type PreviewDevice = "desktop" | "mobile";

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
  const [saveLabel, setSaveLabel] = useState("Save draft");
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("content");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");

  useEffect(() => {
    if (isNew || !id) {
      const emptySnippet = createEmptySnippet();
      setBaseSnippet(emptySnippet);
      setForm(toFormState(emptySnippet));
      setIsLoading(false);
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
    if (!isPreviewOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen]);

  const previewSnippet = useMemo(() => fromFormState(baseSnippet, form), [baseSnippet, form]);
  const previewPath = baseSnippet.slug ? `/snippets/${baseSnippet.slug}` : "";
  const hasSavedPreview = Boolean(baseSnippet.id && baseSnippet.slug);
  const hasUnsavedChanges =
    JSON.stringify(toSnippetPayload(previewSnippet)) !== JSON.stringify(toSnippetPayload(baseSnippet));

  const updateField = <K extends keyof SnippetFormState>(field: K, value: SnippetFormState[K]) => {
    setForm((current) => {
      if (field === "title" && (!current.slug || current.slug === slugify(current.title))) {
        return { ...current, title: String(value), slug: slugify(String(value)) };
      }
      return { ...current, [field]: value };
    });
  };

  const handleSave = useCallback(async (statusOverride?: SnippetStatus) => {
    try {
      setIsSubmitting(true);
      setError("");
      setFeedback("");
      const nextForm = statusOverride ? { ...form, status: statusOverride } : form;
      const payload = toSnippetPayload(fromFormState(baseSnippet, nextForm));

      const savedSnippet = isNew ? await createSnippet(payload) : await updateSnippet(baseSnippet.id, payload);
      const finalSnippet =
        statusOverride === "Published" ? await publishSnippet(savedSnippet.id) : savedSnippet;

      setBaseSnippet(finalSnippet);
      setForm(toFormState(finalSnippet));
      setSaveLabel(statusOverride === "Published" ? "Published" : "Saved");
      setFeedback(
        statusOverride === "Published"
          ? "Snippet published and now eligible for the public homepage."
          : finalSnippet.status === "Scheduled"
            ? "Snippet saved in the schedule. It will stay off the public homepage until published."
            : "Changes saved successfully.",
      );
      window.setTimeout(() => setSaveLabel("Save draft"), 1800);

      if (isNew) {
        navigate(`/admin/snippets/${finalSnippet.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save snippet");
    } finally {
      setIsSubmitting(false);
    }
  }, [baseSnippet, form, isNew, navigate]);

  const handleUnpublish = async () => {
    if (!baseSnippet.id) return;

    try {
      setIsSubmitting(true);
      setError("");
      setFeedback("");
      const snippet = await unpublishSnippet(baseSnippet.id);
      setBaseSnippet(snippet);
      setForm(toFormState(snippet));
      setSaveLabel("Unpublished");
      setFeedback("Snippet moved back to draft and removed from the public library.");
      window.setTimeout(() => setSaveLabel("Save draft"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish snippet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!baseSnippet.id) return;
    if (!window.confirm("Delete this snippet permanently?")) return;

    try {
      setIsSubmitting(true);
      setError("");
      await deleteSnippet(baseSnippet.id);
      navigate("/admin/snippets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snippet");
    } finally {
      setIsSubmitting(false);
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
      start: (
        <div className="flex min-w-0 items-center gap-4">
          <Button
            isIconOnly
            aria-label="Back to snippets"
            variant="outline"
            className="h-10 w-10 shrink-0 admin-button-secondary border-white/10"
            onPress={() => navigate("/admin/snippets")}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="h-5 w-[1px] shrink-0 bg-white/10" />
          <div className="flex min-w-0 flex-col">
            <p className="type-mono-micro text-white/20 -mb-0.5">
              {isNew ? "Drafting" : "Editing"}
            </p>
            <p className="truncate text-sm font-semibold text-white/90 md:max-w-[220px] lg:max-w-md">
              {isNew ? "New entry" : form.title}
            </p>
          </div>
        </div>
      ),
      center: (
        <div
          role="tablist"
          aria-label="Editor modes"
          className="flex min-w-0 gap-6 overflow-x-auto px-1 xl:justify-start"
        >
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
                className={`relative inline-flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap border-b-2 px-1 text-sm font-medium transition-all duration-300 ${
                  isSelected
                    ? "border-white text-white"
                    : "border-transparent text-white/20 hover:text-white/50"
                }`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} className={isSelected ? "text-white" : "text-white/20"} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ),
      end: (
        <>
          {isLoading ? (
            <div className="flex shrink-0 items-center gap-3 xl:mr-1">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              <span className="type-mono-micro text-white/30">Syncing...</span>
            </div>
          ) : (
            <div className="hidden shrink-0 2xl:block xl:mr-1">
              <StatusBadge status={previewSnippet.status} />
            </div>
          )}
          {feedback ? (
            <span className="hidden text-xs font-mono text-emerald-400 animate-in fade-in duration-500 2xl:block">
              {feedback}
            </span>
          ) : null}
          <Button
            className="h-9 shrink-0 px-2.5 text-sm admin-button-secondary min-[1500px]:px-3 2xl:px-4"
            onPress={handlePreview}
          >
            Preview
          </Button>
          <Button
            isDisabled={isSubmitting}
            className="h-9 shrink-0 px-2.5 text-sm admin-button-secondary min-[1500px]:px-3 2xl:px-4"
            onPress={() => handleSave()}
          >
            {isSubmitting ? "..." : (
              <>
                <span className="hidden min-[1500px]:inline">{saveLabel}</span>
                <span className="min-[1500px]:hidden">{saveLabel === "Save draft" ? "Save" : saveLabel}</span>
              </>
            )}
          </Button>
          <Button
            isDisabled={isSubmitting}
            className="h-9 shrink-0 px-2.5 text-sm admin-button-primary min-[1500px]:px-3 2xl:px-4"
            onPress={() => handleSave("Published")}
          >
            Publish
          </Button>
        </>
      ),
    }),
    [
      activeTab,
      closePreview,
      feedback,
      form.title,
      handlePreview,
      handleSave,
      isLoading,
      isNew,
      isSubmitting,
      navigate,
      previewSnippet.status,
      saveLabel,
    ],
  );

  useAdminHeader(headerConfig);

  return (
    <div className="admin-page">
      <main className="mx-auto max-w-[900px] px-6 pb-12 pt-10 md:px-10 md:pb-16 md:pt-10 lg:pb-24 lg:pt-12">
        <div className="flex flex-col gap-12">

          <div className="space-y-12">
            <div className="relative flex flex-col gap-2">
              <textarea
                aria-label="Snippet Title"
                placeholder="Snippet Title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-5xl md:text-7xl font-bold tracking-tighter text-white placeholder:text-white/5 resize-none outline-none overflow-hidden transition-all duration-500"
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
                  className="space-y-12 py-4"
                >
                  <div className="group relative rounded-[28px] border border-white/8 bg-white/[0.02] px-6 py-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="type-mono-micro text-white/30">Implementation narrative</p>
                      <span className="type-mono-micro text-white/15">Markdown source</span>
                    </div>
                    <textarea
                      aria-label="Implementation notes"
                      placeholder="Shape the narrative around the technique and tradeoffs. You can use Markdown."
                      value={form.content}
                      onChange={(event) => updateField("content", event.target.value)}
                      className="mt-5 min-h-[520px] w-full resize-y border-0 bg-transparent px-0 text-lg leading-relaxed text-white/90 shadow-none outline-none focus:ring-0 placeholder:text-white/20"
                    />
                    <p className="mt-4 text-sm leading-relaxed text-white/35">
                      Supports headings, lists, tables, quotes, inline code, and fenced code blocks like <span className="font-mono text-white/55">```swift</span> or <span className="font-mono text-white/55">```ts</span>. Use the preview button in the top bar to inspect the public reading view.
                    </p>
                  </div>

                  <div className="group relative border-t border-white/5 pt-8">
                    <p className="type-mono-micro absolute top-2 left-0 text-white/30 transition-opacity duration-300 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-events-none">
                      Short excerpt
                    </p>
                    <textarea
                      aria-label="Excerpt"
                      placeholder="The hook that appears on card previews. Keep it under two sentences."
                      value={form.excerpt}
                      onChange={(event) => updateField("excerpt", event.target.value)}
                      rows={4}
                      className="w-full bg-transparent border-0 px-0 mt-8 shadow-none outline-none focus:ring-0 text-white/70 placeholder:text-white/20 resize-y"
                    />
                  </div>
                </div>
              )}

              {activeTab === "builder" && (
                <div
                  id="editor-panel-builder"
                  role="tabpanel"
                  aria-labelledby="editor-tab-builder"
                  className="space-y-12 py-4"
                >
                  <div className="group relative">
                    <p className="type-mono-micro absolute -top-8 left-0 text-amber-500/50 transition-opacity duration-300 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-events-none">
                      SwiftUI Logic
                    </p>
                    <textarea
                      aria-label="SwiftUI code"
                      placeholder="import SwiftUI..."
                      value={form.code}
                      onChange={(event) => updateField("code", event.target.value)}
                      className="w-full bg-transparent border-0 px-0 shadow-none outline-none focus:ring-0 font-mono text-sm leading-relaxed text-amber-50/90 placeholder:text-white/20 min-h-[400px] resize-y"
                      spellCheck={false}
                    />
                  </div>

                  <div className="group relative border-t border-white/5 pt-8">
                    <p className="type-mono-micro absolute top-2 left-0 text-white/30 transition-opacity duration-300 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-events-none">
                      AI Prompt fragments
                    </p>
                    <textarea
                      aria-label="Prompt notes"
                      placeholder="Capture the AI direction notes that helped shape this specific implementation."
                      value={form.prompts}
                      onChange={(event) => updateField("prompts", event.target.value)}
                      rows={8}
                      className="w-full bg-transparent border-0 px-0 mt-8 shadow-none outline-none focus:ring-0 text-white/70 placeholder:text-white/20 resize-y"
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
                        <span className="type-mono-micro text-white/30">Category</span>
                        <Input
                          aria-label="Category"
                          value={form.category}
                          onChange={(event) => updateField("category", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="type-mono-micro text-white/30">Tags</span>
                        <Input
                          aria-label="Tags"
                          value={form.tags}
                          onChange={(event) => updateField("tags", event.target.value)}
                          placeholder="SwiftUI, Motion"
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                         <span className="type-mono-micro text-white/30">Route Slug</span>
                         <Input
                           aria-label="Slug"
                           value={form.slug}
                           onChange={(event) => updateField("slug", event.target.value)}
                           className="admin-input w-full"
                         />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="type-mono-micro text-white/30">Cover Image URL</span>
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
                         <span className="type-mono-micro text-white/30">Status</span>
                         <select
                           value={form.status}
                           onChange={(event) => updateField("status", event.target.value as SnippetStatus)}
                           className="admin-select w-full text-sm"
                         >
                           {STATUS_OPTIONS.map((status) => (
                             <option key={status} value={status}>
                               {status}
                             </option>
                           ))}
                         </select>
                       </label>
                       <label className="grid gap-2">
                         <span className="type-mono-micro text-white/30">Published At</span>
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
                        <span className="type-mono-micro text-white/30">SEO Title</span>
                        <Input
                          aria-label="SEO Title"
                          value={form.seoTitle}
                          onChange={(event) => updateField("seoTitle", event.target.value)}
                          className="admin-input w-full"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="type-mono-micro text-white/30">SEO Description</span>
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
                    <section className="pt-10 border-t border-white/5">
                      <div className="flex items-center justify-between vibe-glass p-6 rounded-[32px] border-red-900/10">
                        <div>
                          <h3 className="text-red-400 font-semibold">Danger Zone</h3>
                          <p className="text-sm mt-1 text-white/30">Permanently remove this entry from the registry.</p>
                        </div>
                        <Button
                          variant="outline"
                          radius="full"
                          className="h-10 border-red-900/20 text-red-700/60 hover:bg-red-900/10 hover:text-red-600 transition-all border-dashed"
                          onPress={handleDelete}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[24px] bg-red-500/10 p-5 border border-red-500/20 text-red-400 text-sm leading-relaxed">
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
            className="absolute inset-0 bg-black/88 backdrop-blur-xl"
            onClick={closePreview}
          />
          <div className="relative z-10 flex h-full w-full flex-col p-4 md:p-6">
            <div className="admin-header flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
              <div className="flex flex-col gap-4 border-b border-white/6 px-5 py-4 md:px-8 md:py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    isIconOnly
                    aria-label="Close preview"
                    className="admin-button-secondary h-10 w-10 border-white/10"
                    onPress={closePreview}
                  >
                    <X size={16} />
                  </Button>
                  <div>
                    <p className="type-mono-micro text-white/28">Preview Mode</p>
                    <h2 className="mt-1 text-lg font-semibold text-white md:text-xl">
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
                  className="inline-flex items-center rounded-[18px] border border-white/8 bg-white/[0.03] p-1"
                  role="tablist"
                  aria-label="Preview devices"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewDevice === "mobile"}
                    className={`inline-flex h-10 items-center gap-2 rounded-[14px] px-4 text-sm transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-white text-black"
                        : "text-white/48 hover:text-white/72"
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
                    className={`inline-flex h-10 items-center gap-2 rounded-[14px] px-4 text-sm transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-white text-black"
                        : "text-white/48 hover:text-white/72"
                    }`}
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Monitor size={15} />
                    <span>Desktop</span>
                  </button>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  <span className="type-mono-micro text-white/22">Public route</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white/45">
                    {previewPath}
                  </span>
                </div>
              </div>
              </div>
              <div className="flex flex-1 min-h-0 bg-[#050505] px-3 py-3 md:px-6 md:py-6">
                <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto rounded-[24px] border border-white/6 bg-[#0b0b0b] p-4 md:p-7">
                <div
                  className={`w-full rounded-[24px] border border-white/8 bg-[#0e0e0e] shadow-[0_20px_60px_rgba(0,0,0,0.38)] transition-all duration-300 ${
                    previewDevice === "desktop"
                      ? "max-w-[min(1440px,92vw)]"
                      : "max-w-[430px]"
                  }`}
                  data-preview-device={previewDevice}
                >
                  <div className="flex items-center gap-2 border-b border-white/6 px-4 py-4 md:px-6">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                    <div className="ml-4 flex-1 rounded-full border border-white/7 bg-white/[0.04] px-4 py-2 text-center font-mono text-xs text-white/35">
                      {previewPath}
                    </div>
                  </div>
                  <div
                    className={`overflow-hidden rounded-b-[24px] bg-black ${
                      previewDevice === "mobile" ? "mx-auto aspect-[390/844]" : "aspect-[16/10]"
                    }`}
                  >
                    <iframe
                      title="Snippet public preview"
                      src={previewPath}
                      className="h-full w-full border-0 bg-black"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
