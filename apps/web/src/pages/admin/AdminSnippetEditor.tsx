import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
import MarkdownPreview from "../../components/admin/MarkdownPreview";
import StatusBadge from "../../components/admin/StatusBadge";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, unpublishSnippet, updateSnippet } from "../../services/snippets";
import { Snippet, SnippetFormState, SnippetPayload, SnippetStatus } from "../../types";

const STATUS_OPTIONS: SnippetStatus[] = ["Draft", "In Review", "Scheduled", "Published"];

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

  const previewSnippet = useMemo(() => fromFormState(baseSnippet, form), [baseSnippet, form]);

  const updateField = <K extends keyof SnippetFormState>(field: K, value: SnippetFormState[K]) => {
    setForm((current) => {
      if (field === "title" && (!current.slug || current.slug === slugify(current.title))) {
        return { ...current, title: String(value), slug: slugify(String(value)) };
      }
      return { ...current, [field]: value };
    });
  };

  const handleSave = async (statusOverride?: SnippetStatus) => {
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
  };

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

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <section className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">
            {isNew ? "New Snippet" : "Snippet Editor"}
          </p>
          <h1 className="mt-4 text-[2.75rem] font-black tracking-tighter leading-[0.94] md:text-[4rem]">
            {isNew ? "Compose a fresh showcase entry." : previewSnippet.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Shape the snippet metadata, refine the Markdown notes, and keep the preview visible so the final card stays intentional.
          </p>
          {isLoading ? <p className="mt-4 text-sm text-primary/50">Loading snippet...</p> : null}
          {feedback ? <p className="mt-4 text-sm text-emerald-700">{feedback}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/snippets"
            className="border border-outline-variant/15 bg-surface-container-lowest px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"
          >
            Back to list
          </Link>
          <button
            disabled={isSubmitting}
            onClick={() => handleSave()}
            className="bg-primary px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : saveLabel}
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => handleSave("Published")}
            className="border border-primary bg-surface-container-lowest px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Publish now
          </button>
          {!isNew ? (
            <button
              disabled={isSubmitting}
              onClick={handleUnpublish}
              className="border border-outline-variant/15 bg-surface-container-lowest px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Unpublish
            </button>
          ) : null}
          {!isNew ? (
            <button
              disabled={isSubmitting}
              onClick={handleDelete}
              className="border border-red-200 bg-surface-container-lowest px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <EditorSection
            eyebrow="Identity"
            title="Snippet frame"
            description="Set the foundational metadata that determines how the snippet is indexed, previewed, and discovered."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Title</span>
                <input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Category</span>
                <input
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Excerpt</span>
                <textarea
                  value={form.excerpt}
                  onChange={(event) => updateField("excerpt", event.target.value)}
                  rows={4}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm leading-7 outline-none"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Tags</span>
                <input
                  value={form.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  placeholder="SwiftUI, Motion, Editorial"
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Cover Image URL</span>
                <input
                  value={form.coverImage}
                  onChange={(event) => updateField("coverImage", event.target.value)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
          </EditorSection>

          <EditorSection
            eyebrow="Body"
            title="Markdown notes"
            description="Write in plain Markdown and keep the preview honest while you shape the implementation notes."
          >
            <textarea
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={20}
              className="min-h-[520px] w-full border border-outline-variant/10 bg-surface px-4 py-4 font-mono text-sm leading-7 outline-none"
            />
          </EditorSection>

          <EditorSection
            eyebrow="SEO"
            title="Search surface"
            description="Shape how the snippet will read in search results and social previews."
          >
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">SEO Title</span>
                <input
                  value={form.seoTitle}
                  onChange={(event) => updateField("seoTitle", event.target.value)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">SEO Description</span>
                <textarea
                  value={form.seoDescription}
                  onChange={(event) => updateField("seoDescription", event.target.value)}
                  rows={4}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm leading-7 outline-none"
                />
              </label>
            </div>
          </EditorSection>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="border border-outline-variant/15 bg-surface-container-lowest">
            <div className="border-b border-outline-variant/10 px-6 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Publishing State</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Release controls</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Current status</span>
                <StatusBadge status={previewSnippet.status} />
              </div>

              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as SnippetStatus)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/45">Publish At</span>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => updateField("publishedAt", event.target.value)}
                  className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>

              <div className="grid gap-3 bg-surface p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40">Slug Preview</p>
                <p className="text-sm text-on-surface-variant">/snippets/{previewSnippet.slug || "untitled-snippet"}</p>
              </div>

              <p className="text-sm leading-relaxed text-on-surface-variant">
                Scheduled entries stay inside the publishing workspace. Only snippets with <span className="font-semibold text-primary">Published</span> status appear on the public homepage in this phase.
              </p>
            </div>
          </section>

          <section className="border border-outline-variant/15 bg-surface-container-lowest">
            <div className="border-b border-outline-variant/10 px-6 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Live Preview</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Snippet preview</h2>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="aspect-[16/10] overflow-hidden bg-surface-container-low">
                <img
                  src={previewSnippet.coverImage}
                  alt={previewSnippet.title || "Snippet cover preview"}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">{previewSnippet.category}</p>
                <h3 className="mt-3 text-3xl font-black tracking-tighter leading-tight">
                  {previewSnippet.title || "Untitled Snippet"}
                </h3>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  {previewSnippet.excerpt || "Your excerpt will appear here once written."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {previewSnippet.tags.length ? (
                  previewSnippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-container-low px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/35">No tags yet</span>
                )}
              </div>

              <div className="border-t border-outline-variant/10 pt-6">
                <MarkdownPreview content={previewSnippet.content} />
              </div>
            </div>
          </section>
        </motion.aside>
      </div>
    </div>
  );
}
