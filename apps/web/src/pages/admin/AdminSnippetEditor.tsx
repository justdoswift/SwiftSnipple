import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, TextArea, useOverlayState } from "../../lib/heroui";
import { Link, useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewState = useOverlayState({
    isOpen: isPreviewOpen,
    onOpenChange: setIsPreviewOpen,
  });

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
  const previewPath = baseSnippet.slug ? `/snippets/${baseSnippet.slug}` : "";
  const hasSavedPreview = Boolean(baseSnippet.id && baseSnippet.slug);
  const hasUnsavedChanges =
    JSON.stringify(toSnippetPayload(previewSnippet)) !== JSON.stringify(toSnippetPayload(baseSnippet));

  useEffect(() => {
    if (!isPreviewOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen]);

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
    <div className="px-6 py-10 md:px-10 md:py-12 xl:px-14 2xl:px-16">
      <section className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="type-mono-micro text-primary/40">
            {isNew ? "New Snippet" : "Snippet Editor"}
          </p>
          <h1 className="type-page-title mt-4">
            {isNew ? "Compose a fresh showcase entry." : previewSnippet.title}
          </h1>
          <p className="type-body mt-4">
            Shape the snippet metadata, refine the Markdown notes, and keep the preview visible so the final card stays intentional.
          </p>
          {isLoading ? <p className="type-body-sm mt-4 text-primary/50">Loading snippet...</p> : null}
          {feedback ? <p className="type-body-sm mt-4 text-emerald-700">{feedback}</p> : null}
          {error ? <p className="type-body-sm mt-4 text-red-600">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="type-action" radius="full" variant="outline" onPress={() => navigate("/admin/snippets")}>
            Back to list
          </Button>
          <Button className="type-action" radius="full" variant="outline" onPress={() => setIsPreviewOpen(true)}>
            Preview
          </Button>
          <Button
            isDisabled={isSubmitting}
            className="type-action"
            variant="primary"
            onPress={() => handleSave()}
          >
            {isSubmitting ? "Saving..." : saveLabel}
          </Button>
          <Button
            isDisabled={isSubmitting}
            className="type-action"
            variant="outline"
            onPress={() => handleSave("Published")}
          >
            Publish now
          </Button>
          {!isNew ? (
            <Button
              isDisabled={isSubmitting}
              className="type-action"
              variant="outline"
              onPress={handleUnpublish}
            >
              Unpublish
            </Button>
          ) : null}
          {!isNew ? (
            <Button
              isDisabled={isSubmitting}
              className="type-action text-red-700"
              variant="outline"
              onPress={handleDelete}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px] 2xl:grid-cols-[minmax(0,1.95fr)_340px]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <EditorSection
            eyebrow="Identity"
            title="Snippet frame"
            description="Set the foundational metadata that determines how the snippet is indexed, previewed, and discovered."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 md:col-span-2">
                <span className="type-mono-micro text-primary/45">Title</span>
                <Input
                  aria-label="Title"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="admin-input w-full"
                />
              </label>
              <label className="grid gap-2">
                <span className="type-mono-micro text-primary/45">Slug</span>
                <Input
                  aria-label="Slug"
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  className="admin-input w-full"
                />
              </label>
              <label className="grid gap-2">
                <span className="type-mono-micro text-primary/45">Category</span>
                <Input
                  aria-label="Category"
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className="admin-input w-full"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="type-mono-micro text-primary/45">Excerpt</span>
                <TextArea
                  aria-label="Excerpt"
                  value={form.excerpt}
                  onChange={(event) => updateField("excerpt", event.target.value)}
                  rows={4}
                  className="admin-textarea w-full"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="type-mono-micro text-primary/45">Tags</span>
                <Input
                  aria-label="Tags"
                  value={form.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  placeholder="SwiftUI, Motion, Editorial"
                  className="admin-input w-full"
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="type-mono-micro text-primary/45">Cover Image URL</span>
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
            eyebrow="Body"
            title="Implementation notes"
            description="Write in plain Markdown and keep the preview honest while you shape the implementation notes."
          >
            <TextArea
              aria-label="Implementation notes"
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={20}
              className="admin-textarea w-full"
            />
          </EditorSection>

          <EditorSection
            eyebrow="Code"
            title="SwiftUI code"
            description="Store the actual implementation separately so the public snippet can present code as a first-class asset."
          >
            <TextArea
              aria-label="SwiftUI code"
              value={form.code}
              onChange={(event) => updateField("code", event.target.value)}
              rows={18}
              className="admin-textarea w-full"
              spellCheck={false}
            />
          </EditorSection>

          <EditorSection
            eyebrow="Prompts"
            title="Prompt notes"
            description="Capture the AI prompts, prompt fragments, or direction notes that helped shape the snippet."
          >
            <TextArea
              aria-label="Prompt notes"
              value={form.prompts}
              onChange={(event) => updateField("prompts", event.target.value)}
              rows={12}
              className="admin-textarea w-full"
            />
          </EditorSection>

          <EditorSection
            eyebrow="SEO"
            title="Search surface"
            description="Shape how the snippet will read in search results and social previews."
          >
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="type-mono-micro text-primary/45">SEO Title</span>
                <Input
                  aria-label="SEO Title"
                  value={form.seoTitle}
                  onChange={(event) => updateField("seoTitle", event.target.value)}
                  className="admin-input w-full"
                />
              </label>
              <label className="grid gap-2">
                <span className="type-mono-micro text-primary/45">SEO Description</span>
                <TextArea
                  aria-label="SEO Description"
                  value={form.seoDescription}
                  onChange={(event) => updateField("seoDescription", event.target.value)}
                  rows={4}
                  className="admin-textarea w-full"
                />
              </label>
            </div>
          </EditorSection>
        </motion.div>

        <motion.aside initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="surface-card rounded-[28px]">
            <div className="border-b border-white/55 px-6 py-5">
              <p className="type-mono-micro text-primary/40">Publishing State</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Release controls</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Current status</span>
                <StatusBadge status={previewSnippet.status} />
              </div>

              <label className="grid gap-2">
                <span className="type-mono-micro text-primary/45">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as SnippetStatus)}
                  className="admin-select text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="type-mono-micro text-primary/45">Publish At</span>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => updateField("publishedAt", event.target.value)}
                  className="admin-native-input"
                />
              </label>

              <div className="surface-card-subtle grid gap-3 rounded-[22px] px-5 py-4">
                <p className="type-mono-micro text-primary/40">Slug Preview</p>
                <p className="text-sm text-on-surface-variant">/snippets/{previewSnippet.slug || "untitled-snippet"}</p>
              </div>

              <p className="text-sm leading-relaxed text-on-surface-variant">
                Preview opens the real public snippet page. Save changes first if you want the iframe to reflect your latest edits.
              </p>
            </div>
          </section>
        </motion.aside>
      </div>

      <Modal state={previewState}>
        <Modal.Backdrop className="bg-primary/42 backdrop-blur-xl" />
        <Modal.Container className="max-w-[min(1500px,96vw)]">
          <Modal.Dialog className="surface-shell flex h-[92vh] w-full flex-col overflow-hidden rounded-[34px]">
            <Modal.Header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/55 px-6 py-5 md:px-8">
              <div className="max-w-3xl">
                <p className="type-mono-micro text-primary/40">Public Preview</p>
                <Modal.Heading className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-primary">
                  {hasSavedPreview ? "Real snippet page" : "Save once to preview"}
                </Modal.Heading>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {hasSavedPreview
                    ? hasUnsavedChanges
                      ? "This iframe shows the last saved public version. Save again to preview your latest edits."
                      : "This is the actual public snippet page rendered inside the admin workspace."
                    : "New snippets need one successful save before they can be previewed on their public route."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasSavedPreview ? (
                  <a
                    href={previewPath}
                    target="_blank"
                    rel="noreferrer"
                    className="type-action rounded-full border border-white/55 bg-white/72 px-4 py-3 text-primary shadow-[0_10px_24px_rgba(17,24,39,0.06)] transition-all hover:border-white/75 hover:bg-white/88"
                  >
                    Open tab
                  </a>
                ) : null}
                <Button className="type-action" variant="primary" onPress={() => previewState.close()}>
                  Close
                </Button>
              </div>
            </Modal.Header>
            <Modal.Body className="flex-1 bg-surface p-0">
              {hasSavedPreview ? (
                <iframe
                  title="Snippet public preview"
                  src={previewPath}
                  className="h-full w-full border-0 bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6">
                  <div className="max-w-xl text-center">
                    <p className="type-mono-micro text-primary/35">Preview unavailable</p>
                    <h3 className="mt-4 text-3xl font-bold tracking-tight text-primary">Create the first saved version</h3>
                    <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                      Once this snippet has been saved, the modal will load the real public page at{" "}
                      <span className="font-mono text-primary">/snippets/{previewSnippet.slug || "untitled-snippet"}</span>.
                    </p>
                  </div>
                </div>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </div>
  );
}
