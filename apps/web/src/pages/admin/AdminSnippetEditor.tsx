import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Dropdown, Input, Modal, TextArea, Tooltip, useOverlayState } from "../../lib/heroui";
import { useNavigate, useParams } from "react-router-dom";
import EditorSection from "../../components/admin/EditorSection";
import HighlightedCodeEditor from "../../components/admin/HighlightedCodeEditor";
import MarkdownMediaModal from "../../components/admin/MarkdownMediaModal";
import MarkdownToolbar from "../../components/admin/MarkdownToolbar";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { resolveAssetUrl } from "../../lib/asset-url";
import { applyHeading, insertBlock, insertLink, replaceLinePrefix, wrapSelection } from "../../lib/markdown-editor";
import { getMessages } from "../../lib/messages";
import { getLocalizedSnippetFields, localizeAdminPath, localizePublicPath, useAppLocale } from "../../lib/locale";
import type { PublicTheme } from "../../lib/public-theme";
import { createEmptyLocalizedFields, getFormLocale, getSnippetLocale } from "../../lib/snippet-localization";
import { isUnauthorizedError } from "../../services/api";
import { createSnippet, deleteSnippet, getSnippetById, publishSnippet, unpublishSnippet, updateSnippet, uploadContentImage, uploadContentImageFromURL, uploadContentVideo, uploadCoverImage } from "../../services/snippets";
import { AppLocale, Snippet, SnippetFormState, SnippetPayload, SnippetStatus } from "../../types";
import { ChevronDown, ChevronLeft, Code2, Eye, ImageUp, Layout, Monitor, MessageSquareQuote, RefreshCw, Send, Smartphone, Settings2, Trash2, X } from "lucide-react";

const EDITABLE_STATUS_OPTIONS: SnippetStatus[] = ["Draft"];
type EditorTabKey = "content" | "code" | "prompt" | "meta";
type PreviewDevice = "desktop" | "mobile";
type AutosaveState = "idle" | "saving" | "saved";
type PrimaryActionState = "idle" | "publishing" | "updating";
type EditorStatusOption = {
  id: SnippetStatus;
  label: string;
};
type EditorVisibilityOption = {
  id: "free" | "subscribers";
  label: string;
};
type SegmentedControlOption<T extends string> = {
  id: T;
  label: string;
};
type EditorMediaModalKind = "image" | "video" | null;
type CoverImageField = "coverImageDark" | "coverImageLight";
type ContentHistoryEntry = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};
type ContentSelectionRestoreMode = "preserveSelectionOnly" | "restoreEditorSelection";
type PendingContentSelection = {
  start: number;
  end: number;
  mode: ContentSelectionRestoreMode;
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

function SegmentedSwitcher<T extends string>({
  activeValue,
  ariaLabel,
  onSelect,
  options,
  testId,
}: {
  activeValue: T;
  ariaLabel?: string;
  onSelect: (value: T) => void;
  options: SegmentedControlOption<T>[];
  testId?: string;
}) {
  return (
    <div
      className="admin-editor-locale-switcher inline-flex w-fit max-w-full flex-wrap rounded-full border p-1"
      data-testid={testId}
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.id === activeValue;

        return (
          <button
            key={option.id}
            type="button"
            className={`admin-editor-locale-button ${isActive ? "admin-editor-locale-button-active" : "admin-editor-locale-button-inactive"}`}
            aria-pressed={isActive}
            onClick={() => onSelect(option.id)}
          >
            <span>{option.label}</span>
          </button>
        );
      })}
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
    coverImage: "",
    coverImageDark: "",
    coverImageLight: "",
    locales: {
      en: {
        ...createEmptyLocalizedFields(),
        title: "",
        slug: "",
      },
      zh: {
        ...createEmptyLocalizedFields(),
        title: "",
        slug: "",
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
    requiresSubscription: false,
    viewerCanAccess: true,
    locked: false,
    accessLevel: "full",
  };
}

function toFormState(snippet: Snippet): SnippetFormState {
  const english = getSnippetLocale(snippet, "en");
  const chinese = getSnippetLocale(snippet, "zh");

  return {
    coverImageDark: snippet.coverImageDark ?? "",
    coverImageLight: snippet.coverImageLight ?? "",
    code: snippet.code,
    status: snippet.status,
    publishedAt: toDateTimeInputValue(snippet.publishedAt),
    requiresSubscription: snippet.requiresSubscription,
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

function buildLocalizedPayload(fields: SnippetFormState["locales"]["en"]) {
  return {
    title: fields.title.trim(),
    slug: fields.slug.trim(),
    excerpt: fields.excerpt.trim(),
    category: fields.category.trim() || "Workflow",
    tags: fields.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    content: fields.content,
    prompts: fields.prompts,
    seoTitle: fields.seoTitle.trim(),
    seoDescription: fields.seoDescription.trim(),
  };
}

function buildSnippetPayload(baseSnippet: Snippet, form: SnippetFormState): SnippetPayload {
  return {
    coverImageDark: form.coverImageDark.trim(),
    coverImageLight: form.coverImageLight.trim(),
    code: form.code,
    status: form.status,
    publishedAt: baseSnippet.id ? baseSnippet.publishedAt : null,
    requiresSubscription: form.requiresSubscription,
    locales: {
      en: buildLocalizedPayload(form.locales.en),
      zh: buildLocalizedPayload(form.locales.zh),
    },
  };
}

function toSnippetPayload(snippet: Snippet): SnippetPayload {
  const english = getSnippetLocale(snippet, "en");
  const chinese = getSnippetLocale(snippet, "zh");

  return {
    coverImageDark: snippet.coverImageDark ?? "",
    coverImageLight: snippet.coverImageLight ?? "",
    code: snippet.code,
    status: snippet.status,
    publishedAt: snippet.publishedAt,
    requiresSubscription: snippet.requiresSubscription,
    locales: {
      en: { ...english },
      zh: { ...chinese },
    },
  };
}

function fromFormState(baseSnippet: Snippet, form: SnippetFormState): Snippet {
  const payload = buildSnippetPayload(baseSnippet, form);

  return {
    ...baseSnippet,
    ...payload,
    coverImage: payload.coverImageDark || payload.coverImageLight || baseSnippet.coverImage,
    updatedAt: new Date().toISOString(),
  };
}

type RichPasteImageReference = {
  token: string;
  src: string;
  alt: string;
};

type RichPasteMarkdownDraft = {
  markdown: string;
  images: RichPasteImageReference[];
  hasStructuredCode: boolean;
};

const BLOCK_ELEMENT_TAGS = new Set([
  "article",
  "aside",
  "blockquote",
  "div",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

function normalizeInlineText(value: string) {
  return value.replace(/\s+/g, " ");
}

function normalizeCodeBlockText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
}

function joinInlineParts(parts: string[]) {
  return parts
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function createRichPasteImageToken(index: number) {
  return `@@SWIFTSNIPPLE_IMAGE_${index}@@`;
}

function hasBlockChildren(element: Element) {
  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.ELEMENT_NODE && BLOCK_ELEMENT_TAGS.has((node as Element).tagName.toLowerCase()),
  );
}

function sanitizeCodeLanguage(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9#+-]/g, "");
}

function extractCodeLanguage(element: Element | null) {
  if (!element) {
    return "";
  }

  const dataLanguage = sanitizeCodeLanguage(
    element.getAttribute("data-language")?.trim() ??
      element.getAttribute("data-lang")?.trim() ??
      "",
  );
  if (dataLanguage) {
    return dataLanguage;
  }

  for (const token of Array.from(element.classList)) {
    const languageMatch = /^(?:language|lang)-([\w#+-]+)$/i.exec(token);
    if (languageMatch) {
      return sanitizeCodeLanguage(languageMatch[1]);
    }
  }

  return "";
}

function renderCodeFence(code: string, language: string) {
  const normalizedCode = normalizeCodeBlockText(code);
  if (!normalizedCode) {
    return "";
  }

  return language ? `\`\`\`${language}\n${normalizedCode}\n\`\`\`` : `\`\`\`\n${normalizedCode}\n\`\`\``;
}

function isCodeBlockContainer(element: Element) {
  if (element.tagName.toLowerCase() === "pre") {
    return true;
  }

  const classTokens = Array.from(element.classList);
  if (
    classTokens.some((token) =>
      /(?:^|[-_])(highlight|codeblock|code-block|syntax|source|source-code|hljs)(?:$|[-_])/i.test(token),
    )
  ) {
    return true;
  }

  return Boolean(
    element.getAttribute("data-language") ||
      element.getAttribute("data-lang"),
  );
}

function getOnlyMeaningfulElementChild(element: Element) {
  const meaningfulChildren = Array.from(element.childNodes).filter((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      return Boolean(child.textContent?.trim());
    }

    return child.nodeType === Node.ELEMENT_NODE;
  });

  if (
    meaningfulChildren.length === 1 &&
    meaningfulChildren[0]?.nodeType === Node.ELEMENT_NODE
  ) {
    return meaningfulChildren[0] as Element;
  }

  return null;
}

function getStructuredCodeBlock(node: Node): { code: string; language: string } | null {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (tag === "pre") {
    const nestedCode = element.querySelector(":scope > code");
    const code = nestedCode?.textContent ?? element.textContent ?? "";
    const language = extractCodeLanguage(nestedCode) || extractCodeLanguage(element);
    return code.trim() ? { code, language } : null;
  }

  if (tag === "code" && element.parentElement?.tagName.toLowerCase() !== "pre") {
    const language = extractCodeLanguage(element);
    const code = element.textContent ?? "";
    const parentTag = element.parentElement?.tagName.toLowerCase() ?? "";
    const codeLooksBlockLevel = Boolean(language) || code.includes("\n");

    if (
      codeLooksBlockLevel &&
      (!parentTag || BLOCK_ELEMENT_TAGS.has(parentTag) || parentTag === "body")
    ) {
      return { code, language };
    }
    return null;
  }

  const onlyMeaningfulChild = getOnlyMeaningfulElementChild(element);
  if (onlyMeaningfulChild?.tagName.toLowerCase() === "code") {
    const codeElement = onlyMeaningfulChild;
    const language = extractCodeLanguage(codeElement) || extractCodeLanguage(element);
    const code = codeElement.textContent ?? "";
    if (language || code.includes("\n")) {
      return { code, language };
    }
  }

  if (!isCodeBlockContainer(element)) {
    return null;
  }

  const nestedCode = element.querySelector(":scope > code") ?? element.querySelector("code");
  const code = nestedCode?.textContent ?? element.textContent ?? "";
  const language = extractCodeLanguage(nestedCode) || extractCodeLanguage(element);
  if (!language && !code.includes("\n")) {
    return null;
  }

  return code.trim() ? { code, language } : null;
}

function renderInlineMarkdown(node: Node, images: RichPasteImageReference[], fallbackAlt: string): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeInlineText(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const children = () => joinInlineParts(Array.from(element.childNodes).map((child) => renderInlineMarkdown(child, images, fallbackAlt)));

  switch (tag) {
    case "br":
      return "\n";
    case "img": {
      const src = element.getAttribute("src")?.trim() ?? "";
      if (!src) {
        return "";
      }
      const alt = element.getAttribute("alt")?.trim() || fallbackAlt;
      const token = createRichPasteImageToken(images.length);
      images.push({ token, src, alt });
      return token;
    }
    case "strong":
    case "b": {
      const content = children();
      return content ? `**${content}**` : "";
    }
    case "em":
    case "i": {
      const content = children();
      return content ? `*${content}*` : "";
    }
    case "del":
    case "s":
    case "strike": {
      const content = children();
      return content ? `~~${content}~~` : "";
    }
    case "code": {
      const content = children() || "code";
      return `\`${content}\``;
    }
    case "a": {
      const href = element.getAttribute("href")?.trim() ?? "";
      const content = children() || href;
      return href ? `[${content}](${href})` : content;
    }
    default:
      return children();
  }
}

function renderBlockMarkdown(node: Node, images: RichPasteImageReference[], fallbackAlt: string): string[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeInlineText(node.textContent ?? "").trim();
    return text ? [text] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const inline = () => joinInlineParts(Array.from(element.childNodes).map((child) => renderInlineMarkdown(child, images, fallbackAlt)));
  const childBlocks = () => Array.from(element.childNodes).flatMap((child) => renderBlockMarkdown(child, images, fallbackAlt));
  const structuredCodeBlock = getStructuredCodeBlock(element);

  if (structuredCodeBlock) {
    const fencedCode = renderCodeFence(structuredCodeBlock.code, structuredCodeBlock.language);
    return fencedCode ? [fencedCode] : [];
  }

  switch (tag) {
    case "img": {
      const token = renderInlineMarkdown(node, images, fallbackAlt);
      return token ? [token] : [];
    }
    case "p":
    case "figcaption": {
      const content = inline();
      return content ? [content] : [];
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const content = inline();
      if (!content) {
        return [];
      }
      const level = Number.parseInt(tag.slice(1), 10);
      return [`${"#".repeat(level)} ${content}`];
    }
    case "blockquote": {
      const blocks = childBlocks();
      const content = blocks.length > 0 ? blocks.join("\n\n") : inline();
      if (!content) {
        return [];
      }
      return [
        content
          .split("\n")
          .map((line) => (line.trim() ? `> ${line}` : ">"))
          .join("\n"),
      ];
    }
    case "pre": {
      const code = element.textContent?.replace(/\s+$/, "") ?? "";
      return code ? [`\`\`\`\n${code}\n\`\`\``] : [];
    }
    case "ul":
    case "ol": {
      const ordered = tag === "ol";
      const items = Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map((child, index) => {
          const content = joinInlineParts(Array.from(child.childNodes).map((childNode) => renderInlineMarkdown(childNode, images, fallbackAlt)));
          if (!content) {
            return "";
          }
          return ordered ? `${index + 1}. ${content}` : `- ${content}`;
        })
        .filter(Boolean);
      return items.length > 0 ? [items.join("\n")] : [];
    }
    case "hr":
      return ["---"];
    default: {
      if (hasBlockChildren(element)) {
        return childBlocks();
      }
      const content = inline();
      return content ? [content] : [];
    }
  }
}

function parseRichPasteToMarkdown(html: string, plainText: string, fallbackAlt: string): RichPasteMarkdownDraft {
  const document = new DOMParser().parseFromString(html, "text/html");
  const images: RichPasteImageReference[] = [];
  const blocks = Array.from(document.body.childNodes).flatMap((node) => renderBlockMarkdown(node, images, fallbackAlt));
  const markdown = blocks.join("\n\n").trim() || plainText.trim();
  const hasStructuredCode = Array.from(document.body.querySelectorAll("*")).some((element) => Boolean(getStructuredCodeBlock(element)));

  return {
    markdown,
    images,
    hasStructuredCode,
  };
}

function replaceRichPasteImagePlaceholders(
  markdown: string,
  images: RichPasteImageReference[],
  replacements: Map<string, string>,
) {
  return images.reduce((current, image) => current.split(image.token).join(replacements.get(image.token) ?? image.token), markdown);
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
  const [uploadingCoverField, setUploadingCoverField] = useState<CoverImageField | null>(null);
  const [activeCoverTheme, setActiveCoverTheme] = useState<PublicTheme>("dark");
  const [isUploadingContentMedia, setIsUploadingContentMedia] = useState(false);
  const [localCoverPreviewUrls, setLocalCoverPreviewUrls] = useState<Record<CoverImageField, string>>({
    coverImageDark: "",
    coverImageLight: "",
  });
  const [error, setError] = useState("");
  const [contentMediaError, setContentMediaError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<EditorTabKey>("content");
  const [editorLocale, setEditorLocale] = useState<AppLocale>(locale);
  const [contentMediaModal, setContentMediaModal] = useState<EditorMediaModalKind>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewRevision, setPreviewRevision] = useState(0);
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("idle");
  const [primaryActionState, setPrimaryActionState] = useState<PrimaryActionState>("idle");
  const [contentHistoryState, setContentHistoryState] = useState({ canUndo: false, canRedo: false });
  const hydratedSnippetRef = useRef<Snippet | null>(null);
  const formRef = useRef(form);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const contentSelectionRef = useRef<PendingContentSelection | null>(null);
  const contentHistoryRef = useRef<{
    undoStack: ContentHistoryEntry[];
    redoStack: ContentHistoryEntry[];
  }>({
    undoStack: [],
    redoStack: [],
  });
  const contentValueRef = useRef(form.locales[editorLocale].content);
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

  const bumpPreviewRevision = useCallback(() => {
    setPreviewRevision((current) => current + 1);
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
  const localizedForm = useMemo(() => getFormLocale(form, editorLocale), [editorLocale, form]);
  const coverThemeOptions = useMemo<SegmentedControlOption<PublicTheme>[]>(
    () => [
      { id: "dark", label: copy.darkTheme },
      { id: "light", label: copy.lightTheme },
    ],
    [copy.darkTheme, copy.lightTheme],
  );
  const activeCoverField: CoverImageField = activeCoverTheme === "dark" ? "coverImageDark" : "coverImageLight";
  const inactiveCoverField: CoverImageField = activeCoverTheme === "dark" ? "coverImageLight" : "coverImageDark";
  const ownCoverPreviewUrl = localCoverPreviewUrls[activeCoverField] || resolveAssetUrl(form[activeCoverField]);
  const fallbackCoverPreviewUrl = localCoverPreviewUrls[inactiveCoverField] || resolveAssetUrl(form[inactiveCoverField]);
  const activeCoverPreviewUrl = ownCoverPreviewUrl || fallbackCoverPreviewUrl || resolveAssetUrl(baseSnippet.coverImage);
  const activeCoverLabel = activeCoverField === "coverImageDark" ? copy.coverImageDark : copy.coverImageLight;
  const activeCoverStatus = ownCoverPreviewUrl
    ? null
    : fallbackCoverPreviewUrl
      ? activeCoverTheme === "dark"
        ? copy.themeCoverImageUsingLight
        : copy.themeCoverImageUsingDark
      : baseSnippet.coverImage
        ? copy.themeCoverImageLegacy
        : copy.themeCoverImageEmpty;
  const localizedPreview = useMemo(() => getLocalizedSnippetFields(previewSnippet, editorLocale), [editorLocale, previewSnippet]);
  const editorLocaleOptions = useMemo<SegmentedControlOption<AppLocale>[]>(
    () => [
      { id: "en", label: copy.localeEditorEnglish },
      { id: "zh", label: copy.localeEditorChinese },
    ],
    [copy.localeEditorChinese, copy.localeEditorEnglish],
  );
  const otherEditorLocale: AppLocale = editorLocale === "en" ? "zh" : "en";
  const otherEditorLocaleLabel =
    editorLocaleOptions.find((option) => option.id === otherEditorLocale)?.label ?? otherEditorLocale.toUpperCase();
  const untitledSnippetLabel = copy.untitledSnippet;
  const draftPreviewPath = baseSnippet.id && localizedPreview.slug ? localizePublicPath(`/snippets/${localizedPreview.slug}`) : "";
  const previewPath = draftPreviewPath;
  const previewIframePath = useMemo(() => {
    if (!previewPath || !baseSnippet.id) {
      return "";
    }

    const params = new URLSearchParams({
      preview: "admin",
      id: baseSnippet.id,
      locale: editorLocale,
      rev: String(previewRevision),
    });

    return `${previewPath}?${params.toString()}`;
  }, [baseSnippet.id, editorLocale, previewPath, previewRevision]);
  const hasSavedPreview = Boolean(baseSnippet.id && localizedPreview.slug);
  const previewPayloadSignature = useMemo(
    () => JSON.stringify(buildSnippetPayload(baseSnippet, form)),
    [baseSnippet, form],
  );
  const basePayloadSignature = useMemo(() => JSON.stringify(toSnippetPayload(baseSnippet)), [baseSnippet]);
  const hasUnsavedChanges = previewPayloadSignature !== basePayloadSignature;
  const isPublishedEntry = baseSnippet.status === "Published";
  const hasDraftChanges = Boolean(baseSnippet.hasUnpublishedChanges);
  const hasPendingPublishedChanges = isPublishedEntry && (hasUnsavedChanges || hasDraftChanges);
  const statusOptions = isPublishedEntry ? (["Published"] as const) : EDITABLE_STATUS_OPTIONS;
  const statusSelectOptions = useMemo<EditorStatusOption[]>(
    () => statusOptions.map((status) => ({ id: status, label: common.statuses[status] })),
    [common.statuses, statusOptions],
  );
  const visibilitySelectOptions = useMemo<EditorVisibilityOption[]>(
    () => [
      { id: "free", label: copy.visibilityFree },
      { id: "subscribers", label: copy.visibilitySubscribersOnly },
    ],
    [copy.visibilityFree, copy.visibilitySubscribersOnly],
  );
  const selectedStatusLabel = statusSelectOptions.find((option) => option.id === form.status)?.label ?? form.status;
  const selectedVisibilityKey = form.requiresSubscription ? "subscribers" : "free";
  const selectedVisibilityLabel =
    visibilitySelectOptions.find((option) => option.id === selectedVisibilityKey)?.label ?? copy.visibilityFree;
  const currentHeadingLevel = useMemo<0 | 1 | 2 | 3 | 4 | 5 | 6>(() => {
    const currentLine = localizedForm.content.slice(0, contentTextareaRef.current?.selectionStart ?? 0).split("\n").pop() ?? "";
    const match = /^(#{1,6})\s/.exec(currentLine);
    return match ? (match[1].length as 1 | 2 | 3 | 4 | 5 | 6) : 0;
  }, [localizedForm.content]);
  const toolbarLabels = useMemo(
    () => ({
      text: copy.markdownToolbar,
      undo: copy.markdownUndo,
      redo: copy.markdownRedo,
      heading: copy.markdownHeading,
      bold: copy.markdownBold,
      italic: copy.markdownItalic,
      strikethrough: copy.markdownStrikethrough,
      inlineCode: copy.markdownInlineCode,
      codeBlock: copy.markdownCodeBlock,
      blockquote: copy.markdownBlockquote,
      bulletedList: copy.markdownBulletedList,
      numberedList: copy.markdownNumberedList,
      link: copy.markdownLink,
      image: copy.markdownImage,
      video: copy.markdownVideo,
      horizontalRule: copy.markdownHorizontalRule,
      normalText: copy.markdownNormalText,
      headings: [
        copy.markdownHeading1,
        copy.markdownHeading2,
        copy.markdownHeading3,
        copy.markdownHeading4,
        copy.markdownHeading5,
        copy.markdownHeading6,
      ],
    }),
    [copy],
  );
  const primaryActionLabel =
    primaryActionState === "publishing"
      ? copy.publishing
      : primaryActionState === "updating"
        ? copy.updating
        : isPublishedEntry
          ? hasPendingPublishedChanges
            ? copy.update
            : copy.publishedStable
          : copy.publish;
  const isPrimaryActionDisabled =
    isLoading ||
    isDeleting ||
    autosaveState === "saving" ||
    primaryActionState !== "idle" ||
    (isPublishedEntry && !hasPendingPublishedChanges);
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
  const saveStateLabel =
    saveState === "syncing"
      ? copy.syncing
      : saveState === "saving"
        ? copy.saving
        : isPublishedEntry && hasDraftChanges
          ? copy.autoSavedDraftUpdate
          : copy.saved;
  const autosaveFeedbackLabel =
    autosaveState === "saving"
      ? copy.saving
      : autosaveState === "saved"
        ? isPublishedEntry
          ? copy.autoSavedDraftUpdate
          : copy.saved
        : "";

  const openContentMediaModal = useCallback((kind: Exclude<EditorMediaModalKind, null>) => {
    setContentMediaError("");
    setContentMediaModal(kind);
  }, []);

  const syncContentHistoryState = useCallback(() => {
    setContentHistoryState({
      canUndo: contentHistoryRef.current.undoStack.length > 0,
      canRedo: contentHistoryRef.current.redoStack.length > 0,
    });
  }, []);

  const resetContentHistory = useCallback(() => {
    contentHistoryRef.current = {
      undoStack: [],
      redoStack: [],
    };
    syncContentHistoryState();
  }, [syncContentHistoryState]);

  const currentContentSelection = useCallback((): ContentHistoryEntry => {
    const textarea = contentTextareaRef.current;
    const value = formRef.current.locales[editorLocale].content;

    return {
      value,
      selectionStart: textarea?.selectionStart ?? value.length,
      selectionEnd: textarea?.selectionEnd ?? value.length,
    };
  }, [editorLocale]);
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

  const updateLocalizedField = useCallback((field: keyof SnippetFormState["locales"]["en"], value: string) => {
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
  }, [editorLocale]);

  const handleGenerateSlug = useCallback(() => {
    setForm((current) => {
      const currentLocaleForm = current.locales[editorLocale];

      return {
        ...current,
        locales: {
          ...current.locales,
          [editorLocale]: {
            ...currentLocaleForm,
            slug: slugify(currentLocaleForm.title),
          },
        },
      };
    });
  }, [editorLocale]);

  const syncContentTextareaSelection = useCallback(() => {
    const textarea = contentTextareaRef.current;
    const pendingSelection = contentSelectionRef.current;

    if (!textarea || !pendingSelection) {
      return;
    }

    const shouldRestoreSelection =
      document.activeElement === textarea || pendingSelection.mode === "restoreEditorSelection";

    if (!shouldRestoreSelection) {
      return;
    }

    if (pendingSelection.mode === "restoreEditorSelection" && document.activeElement !== textarea) {
      textarea.focus({ preventScroll: true });
    }

    textarea.setSelectionRange(pendingSelection.start, pendingSelection.end);
    contentSelectionRef.current = null;
  }, []);

  useEffect(() => {
    contentValueRef.current = localizedForm.content;
  }, [localizedForm.content]);

  useEffect(() => {
    resetContentHistory();
    contentValueRef.current = form.locales[editorLocale].content;
  }, [baseSnippet.id, editorLocale, resetContentHistory]);

  const resizeContentTextarea = useCallback(() => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 420)}px`;
  }, []);

  useEffect(() => {
    resizeContentTextarea();
    syncContentTextareaSelection();
  }, [localizedForm.content, resizeContentTextarea, syncContentTextareaSelection]);

  const applyContentSnapshot = useCallback((
    nextState: ContentHistoryEntry,
    historyMode: "push" | "undo" | "redo" = "push",
    selectionMode: ContentSelectionRestoreMode = "preserveSelectionOnly",
  ) => {
    const textarea = contentTextareaRef.current;
    const currentState = currentContentSelection();

    if (historyMode === "push" && nextState.value !== currentState.value) {
      contentHistoryRef.current.undoStack.push(currentState);
      contentHistoryRef.current.redoStack = [];
      syncContentHistoryState();
    }

    if (historyMode === "undo") {
      contentHistoryRef.current.redoStack.push(currentState);
      syncContentHistoryState();
    }

    if (historyMode === "redo") {
      contentHistoryRef.current.undoStack.push(currentState);
      syncContentHistoryState();
    }

    contentSelectionRef.current = {
      start: nextState.selectionStart,
      end: nextState.selectionEnd,
      mode:
        selectionMode === "restoreEditorSelection" || document.activeElement === textarea
          ? "restoreEditorSelection"
          : "preserveSelectionOnly",
    };
    updateLocalizedField("content", nextState.value);
  }, [currentContentSelection, syncContentHistoryState, updateLocalizedField]);

  const applyContentEdit = useCallback((
    transform: (value: string, start: number, end: number) => { value: string; selectionStart: number; selectionEnd: number },
    selectionMode: ContentSelectionRestoreMode = "preserveSelectionOnly",
  ) => {
    const textarea = contentTextareaRef.current;
    const currentValue = localizedForm.content;
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const nextState = transform(currentValue, start, end);
    applyContentSnapshot(nextState, "push", selectionMode);
  }, [applyContentSnapshot, localizedForm.content]);

  const undoContentEdit = useCallback((selectionMode: ContentSelectionRestoreMode = "preserveSelectionOnly") => {
    const previousState = contentHistoryRef.current.undoStack.pop();
    if (!previousState) {
      syncContentHistoryState();
      return;
    }

    applyContentSnapshot(previousState, "undo", selectionMode);
  }, [applyContentSnapshot, syncContentHistoryState]);

  const redoContentEdit = useCallback((selectionMode: ContentSelectionRestoreMode = "preserveSelectionOnly") => {
    const nextState = contentHistoryRef.current.redoStack.pop();
    if (!nextState) {
      syncContentHistoryState();
      return;
    }

    applyContentSnapshot(nextState, "redo", selectionMode);
  }, [applyContentSnapshot, syncContentHistoryState]);

  const persistSnippet = useCallback(
    async (nextForm: SnippetFormState) => {
      const payload = buildSnippetPayload(baseSnippet, nextForm);
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
    if (isLoading || isDeleting || primaryActionState !== "idle" || !hasUnsavedChanges) {
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
        setFeedback(isPublishedEntry ? copy.autoSavedDraftUpdate : copy.autoSavedDraft);
        setAutosaveState("saved");
        bumpPreviewRevision();

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
  }, [
    copy.autoSavedDraft,
    copy.autoSavedDraftUpdate,
    copy.failedSave,
    hasUnsavedChanges,
    isDeleting,
    isLoading,
    isNew,
    isPublishedEntry,
    navigate,
    persistSnippet,
    primaryActionState,
    redirectToAdminLogin,
  ]);

  const handleConfirmPublish = useCallback(async () => {
    const nextActionState: PrimaryActionState = isPublishedEntry ? "updating" : "publishing";
    setIsPublishConfirmOpen(false);
    setPrimaryActionState(nextActionState);

    try {
      setError("");
      setFeedback("");
      setAutosaveState("idle");
      const savedSnippet = isNew || hasUnsavedChanges ? await persistSnippet(formRef.current) : baseSnippet;
      const finalSnippet = await publishSnippet(savedSnippet.id);

      setBaseSnippet(finalSnippet);
      setForm(toFormState(finalSnippet));
      bumpPreviewRevision();
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
  }, [baseSnippet, copy.failedPublish, copy.publishSuccess, copy.updateSuccess, hasUnsavedChanges, isNew, isPublishedEntry, navigate, persistSnippet, redirectToAdminLogin]);

  const handleUnpublish = async () => {
    if (!baseSnippet.id) return;

    try {
      setPrimaryActionState("idle");
      setError("");
      setFeedback("");
      const snippet = await unpublishSnippet(baseSnippet.id);
      setBaseSnippet(snippet);
      setForm(toFormState(snippet));
      bumpPreviewRevision();
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
      navigate(localizeAdminPath(locale, "/admin"));
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

  const handleCoverImageUpload = useCallback(async (field: CoverImageField, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) {
      setError(copy.invalidCoverImage);
      return;
    }

    const nextPreviewUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(file)
      : "";

    try {
      setError("");
      setFeedback("");
      setUploadingCoverField(field);
      const result = await uploadCoverImage(file);
      setLocalCoverPreviewUrls((currentPreviewUrls) => {
        const currentPreviewUrl = currentPreviewUrls[field];
        if (currentPreviewUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        return {
          ...currentPreviewUrls,
          [field]: nextPreviewUrl,
        };
      });
      updateField(field, result.url);
    } catch (err) {
      if (nextPreviewUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(nextPreviewUrl);
      }
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }

      const nextError = err instanceof Error ? err.message : copy.failedCoverImageUpload;
      setError(nextError);
    } finally {
      setUploadingCoverField(null);
    }
  }, [copy.failedCoverImageUpload, copy.invalidCoverImage, redirectToAdminLogin]);

  const clearThemeCoverImage = useCallback((field: CoverImageField) => {
    setLocalCoverPreviewUrls((currentPreviewUrls) => {
      const currentPreviewUrl = currentPreviewUrls[field];
      if (currentPreviewUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return {
        ...currentPreviewUrls,
        [field]: "",
      };
    });

    updateField(field, "");
  }, []);

  const handleContentTextareaChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const previousValue = contentValueRef.current;
    const nextValue = event.target.value;
    if (nextValue !== previousValue) {
      contentHistoryRef.current.undoStack.push({
        value: previousValue,
        selectionStart: event.target.selectionStart ?? previousValue.length,
        selectionEnd: event.target.selectionEnd ?? previousValue.length,
      });
      contentHistoryRef.current.redoStack = [];
      syncContentHistoryState();
    }

    contentValueRef.current = nextValue;
    updateLocalizedField("content", nextValue);
  }, [syncContentHistoryState, updateLocalizedField]);

  const handleContentTextareaKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = event.metaKey || event.ctrlKey;
    if (!isMod || event.altKey) {
      return;
    }

    if (event.key.toLowerCase() !== "z") {
      return;
    }

    event.preventDefault();
    if (event.shiftKey) {
      redoContentEdit("restoreEditorSelection");
      return;
    }

    undoContentEdit("restoreEditorSelection");
  }, [redoContentEdit, undoContentEdit]);

  const insertUploadedContentImage = useCallback((assetURL: string, altText?: string) => {
    applyContentEdit((value, start, end) => {
      const snippet = `![${altText?.trim() || copy.mediaAltPlaceholder}](${assetURL})`;
      return insertBlock(value, start, end, snippet, snippet.length);
    });
  }, [applyContentEdit, copy.mediaAltPlaceholder]);

  const insertUploadedContentImages = useCallback((images: Array<{ url: string; alt?: string }>) => {
    if (images.length === 0) {
      return;
    }

    applyContentEdit((value, start, end) => {
      const block = images
        .map(({ url, alt }) => `![${alt?.trim() || copy.mediaAltPlaceholder}](${url})`)
        .join("\n\n");
      return insertBlock(value, start, end, block, block.length);
    });
  }, [applyContentEdit, copy.mediaAltPlaceholder]);

  const applyRichPasteMarkdown = useCallback((start: number, end: number, markdown: string) => {
    const nextState = insertBlock(contentValueRef.current, start, end, markdown, markdown.length);
    applyContentSnapshot(nextState, "push", "preserveSelectionOnly");
  }, [applyContentSnapshot]);

  const handleContentTextareaPaste = useCallback(async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardFiles = Array.from(event.clipboardData?.files ?? []);
    const fileFromFiles = clipboardFiles.find((candidate) => candidate.type.startsWith("image/"));
    const clipboardItems = Array.from(event.clipboardData?.items ?? []);
    const fileFromItems = clipboardItems
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .find((candidate): candidate is File => Boolean(candidate));

    const file = fileFromFiles ?? fileFromItems;
    if (!file) {
      const html = typeof event.clipboardData?.getData === "function"
        ? event.clipboardData.getData("text/html")?.trim()
        : "";
      if (!html) {
        return;
      }

      const plainText = typeof event.clipboardData?.getData === "function"
        ? event.clipboardData.getData("text/plain")
        : "";
      const richPasteDraft = parseRichPasteToMarkdown(html, plainText, copy.mediaAltPlaceholder);

      if (richPasteDraft.images.length === 0 && !richPasteDraft.hasStructuredCode) {
        return;
      }

      event.preventDefault();
      const pasteStart = event.currentTarget.selectionStart ?? contentValueRef.current.length;
      const pasteEnd = event.currentTarget.selectionEnd ?? contentValueRef.current.length;

      if (richPasteDraft.images.length === 0) {
        applyRichPasteMarkdown(pasteStart, pasteEnd, richPasteDraft.markdown);
        return;
      }

      try {
        setContentMediaError("");
        setIsUploadingContentMedia(true);

        const replacements = new Map<string, string>();
        let hadImageFailures = false;

        for (const image of richPasteDraft.images) {
          try {
            const result = await uploadContentImageFromURL(image.src);
            replacements.set(image.token, `![${image.alt.trim() || copy.mediaAltPlaceholder}](${result.url})`);
          } catch (err) {
            if (isUnauthorizedError(err)) {
              redirectToAdminLogin();
              return;
            }

            hadImageFailures = true;
            const fallbackLabel = image.alt.trim() || copy.mediaAltPlaceholder;
            replacements.set(image.token, `[${fallbackLabel}](${image.src})`);
          }
        }

        const finalMarkdown = replaceRichPasteImagePlaceholders(richPasteDraft.markdown, richPasteDraft.images, replacements);
        applyRichPasteMarkdown(pasteStart, pasteEnd, finalMarkdown);

        if (hadImageFailures) {
          setContentMediaError(copy.failedContentMediaUpload);
        }
      } catch (err) {
        if (isUnauthorizedError(err)) {
          redirectToAdminLogin();
          return;
        }
        setContentMediaError(err instanceof Error ? err.message : copy.failedContentMediaUpload);
      } finally {
        setIsUploadingContentMedia(false);
      }
      return;
    }

    event.preventDefault();

    try {
      setContentMediaError("");
      setIsUploadingContentMedia(true);
      const result = await uploadContentImage(file);
      insertUploadedContentImage(result.url);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }
      setContentMediaError(err instanceof Error ? err.message : copy.failedContentMediaUpload);
    } finally {
      setIsUploadingContentMedia(false);
    }
  }, [applyRichPasteMarkdown, copy.failedContentMediaUpload, copy.mediaAltPlaceholder, insertUploadedContentImage, redirectToAdminLogin]);

  const handleContentMediaInsert = useCallback(async (payload: { file?: File; url?: string; alt?: string; title?: string }) => {
    if (!contentMediaModal) {
      return;
    }

    try {
      setContentMediaError("");
      setIsUploadingContentMedia(true);
      let assetURL = payload.url?.trim() ?? "";

      if (payload.file) {
        if (contentMediaModal === "image") {
          const result = await uploadContentImage(payload.file);
          assetURL = result.url;
        } else {
          const result = await uploadContentVideo(payload.file);
          assetURL = result.url;
        }
      }

      if (!assetURL) {
        setContentMediaError(contentMediaModal === "image" ? copy.invalidContentImage : copy.invalidContentVideo);
        return;
      }

      applyContentEdit((value, start, end) => {
        if (contentMediaModal === "image") {
          const snippet = `![${payload.alt?.trim() || copy.mediaAltPlaceholder}](${assetURL})`;
          return insertBlock(value, start, end, snippet, snippet.length);
        }

        const title = payload.title?.trim() || copy.mediaTitlePlaceholder;
        const snippet = `::video{src="${assetURL}" title="${title}"}`;
        return insertBlock(value, start, end, snippet, snippet.length);
      });

      setContentMediaModal(null);
    } catch (err) {
      if (isUnauthorizedError(err)) {
        redirectToAdminLogin();
        return;
      }
      setContentMediaError(err instanceof Error ? err.message : copy.failedContentMediaUpload);
    } finally {
      setIsUploadingContentMedia(false);
    }
  }, [applyContentEdit, contentMediaModal, copy.failedContentMediaUpload, copy.invalidContentImage, copy.invalidContentVideo, copy.mediaAltPlaceholder, copy.mediaTitlePlaceholder, redirectToAdminLogin]);

  useEffect(() => {
    return () => {
      if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") {
        return;
      }

      Object.values(localCoverPreviewUrls).forEach((previewUrl) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [localCoverPreviewUrls]);

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
            onClick={() => navigate(localizeAdminPath(locale, "/admin"))}
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
            {isPublishedEntry && hasDraftChanges ? (
              <span className="admin-status-badge type-mono-micro admin-status-badge-published">{copy.publishedDraftChanges}</span>
            ) : (
              <StatusBadge status={previewSnippet.status} />
            )}
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
      hasDraftChanges,
      hasUnsavedChanges,
      handlePreview,
      isDeleting,
      isLoading,
      isPrimaryActionDisabled,
      isPublishedEntry,
      locale,
      navigate,
      primaryActionLabel,
      primaryActionState,
      previewSnippet.status,
      copy.publishedDraftChanges,
    ],
  );

  useAdminHeader(headerConfig);

  return (
    <div className="admin-page">
      <main className="px-6 pb-12 pt-10 md:px-8 md:pb-16 md:pt-10 lg:pb-24 lg:pt-12 xl:px-10">
        <div className="flex flex-col gap-12">
          <EditorSectionRail activeTab={activeTab} onSelect={setActiveTab} tabs={editorTabs} />

          <div className="space-y-12">
            <div
              className="admin-editor-title-row flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6"
              data-testid="admin-editor-title-row"
            >
              <div className="relative min-w-0 flex-1">
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

              <SegmentedSwitcher<AppLocale>
                activeValue={editorLocale}
                onSelect={(value) => setEditorLocale(value)}
                options={editorLocaleOptions}
                testId="admin-editor-locale-switcher"
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
                    <MarkdownToolbar
                      headingLevel={currentHeadingLevel}
                      labels={toolbarLabels}
                      onUndo={undoContentEdit}
                      onRedo={redoContentEdit}
                      canUndo={contentHistoryState.canUndo}
                      canRedo={contentHistoryState.canRedo}
                      onHeadingChange={(level) => applyContentEdit((value, start, end) => applyHeading(value, start, end, level))}
                      onBold={() => applyContentEdit((value, start, end) => wrapSelection(value, start, end, "**", "**", copy.markdownBoldPlaceholder))}
                      onItalic={() => applyContentEdit((value, start, end) => wrapSelection(value, start, end, "*", "*", copy.markdownItalicPlaceholder))}
                      onStrikethrough={() => applyContentEdit((value, start, end) => wrapSelection(value, start, end, "~~", "~~", copy.markdownStrikePlaceholder))}
                      onInlineCode={() => applyContentEdit((value, start, end) => wrapSelection(value, start, end, "`", "`", copy.markdownCodePlaceholder))}
                      onCodeBlock={() =>
                        applyContentEdit((value, start, end) =>
                          insertBlock(value, start, end, `\`\`\`markdown\n${value.slice(start, end) || copy.markdownCodeBlockPlaceholder}\n\`\`\``, 12),
                        )
                      }
                      onBlockquote={() => applyContentEdit((value, start, end) => replaceLinePrefix(value, start, end, "> "))}
                      onBulletedList={() => applyContentEdit((value, start, end) => replaceLinePrefix(value, start, end, "- "))}
                      onNumberedList={() => applyContentEdit((value, start, end) => replaceLinePrefix(value, start, end, "1. "))}
                      onLink={() => applyContentEdit((value, start, end) => insertLink(value, start, end))}
                      onImage={() => openContentMediaModal("image")}
                      onVideo={() => openContentMediaModal("video")}
                      onHorizontalRule={() => applyContentEdit((value, start, end) => insertBlock(value, start, end, "---", 3))}
                    />
                    <textarea
                      ref={contentTextareaRef}
                      aria-label={copy.implementationNotes}
                      placeholder={copy.implementationPlaceholder}
                      value={localizedForm.content}
                      onChange={handleContentTextareaChange}
                      onPaste={handleContentTextareaPaste}
                      onKeyDown={handleContentTextareaKeyDown}
                      className="admin-editor-textarea admin-editor-narrative-body admin-editor-panel-body admin-editor-scrollbar w-full resize-none border-0 bg-transparent px-0 shadow-none outline-none focus:ring-0"
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
                    <div className="grid gap-6">
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
                         <div className="flex items-stretch gap-3">
                           <Input
                             aria-label={copy.routeSlug}
                             value={localizedForm.slug}
                             onChange={(event) => updateLocalizedField("slug", event.target.value)}
                             className="admin-input w-full"
                           />
                           <Button
                             type="button"
                             aria-label={copy.generateSlugFromTitle}
                             className="admin-button-secondary admin-button-icon shrink-0"
                             onPress={handleGenerateSlug}
                           >
                             <RefreshCw size={16} aria-hidden="true" />
                           </Button>
                         </div>
                      </label>
                      <div className="grid gap-4 md:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="grid gap-1">
                            <span className="admin-eyebrow type-mono-micro">{copy.coverThemes}</span>
                            <span className="admin-copy-muted">{activeCoverLabel}</span>
                          </div>
                          <SegmentedSwitcher<PublicTheme>
                            activeValue={activeCoverTheme}
                            ariaLabel={copy.coverThemes}
                            onSelect={(value) => setActiveCoverTheme(value)}
                            options={coverThemeOptions}
                            testId="admin-cover-theme-switcher"
                          />
                        </div>
                        <div className="admin-cover-panel grid gap-4">
                          {activeCoverPreviewUrl ? (
                            <div className="snippet-cover-frame admin-cover-upload-preview overflow-hidden">
                              <img
                                src={activeCoverPreviewUrl}
                                alt={localizedForm.title || copy.untitledSnippet}
                                className="snippet-cover-image"
                              />
                            </div>
                          ) : (
                            <div className="admin-cover-empty flex items-center justify-center rounded-[22px] border border-dashed px-5 py-8">
                              <p className="admin-copy-faint type-mono-micro">{copy.themeCoverImageEmpty}</p>
                            </div>
                          )}
                          <div className="admin-cover-toolbar flex flex-wrap items-center gap-3">
                            <input
                              ref={coverImageInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="sr-only"
                              onChange={(event) => handleCoverImageUpload(activeCoverField, event)}
                            />
                            <Button
                              type="button"
                              className="admin-button-secondary admin-button-md"
                              isDisabled={Boolean(uploadingCoverField)}
                              onPress={() => coverImageInputRef.current?.click()}
                            >
                              <ImageUp size={16} className="mr-2" />
                              {uploadingCoverField === activeCoverField
                                ? copy.uploadingCoverImage
                                : form[activeCoverField]
                                  ? copy.replaceCoverImage
                                  : copy.uploadCoverImage}
                            </Button>
                            {form[activeCoverField] ? (
                              <Button
                                type="button"
                                className="admin-button-secondary admin-button-md"
                                isDisabled={Boolean(uploadingCoverField)}
                                onPress={() => clearThemeCoverImage(activeCoverField)}
                              >
                                <X size={16} className="mr-2" />
                                {copy.clearThemeCoverImage}
                              </Button>
                            ) : null}
                            {activeCoverStatus ? (
                              <span className="admin-cover-status-badge type-mono-micro">{activeCoverStatus}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
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
                      <label className="grid gap-2">
                        <span className="admin-eyebrow type-mono-micro">{copy.visibility}</span>
                        <Dropdown>
                          <Dropdown.Trigger
                            aria-label={copy.visibility}
                            className="admin-form-select-trigger"
                          >
                            <span className="admin-form-select-value">{selectedVisibilityLabel}</span>
                            <ChevronDown className="admin-form-select-indicator" />
                          </Dropdown.Trigger>
                          <Dropdown.Popover>
                            <Dropdown.Menu
                              items={visibilitySelectOptions}
                              selectionMode="single"
                              disallowEmptySelection
                              selectedKeys={[selectedVisibilityKey]}
                              onAction={(key) => updateField("requiresSubscription", String(key) === "subscribers")}
                            >
                              {(option: EditorVisibilityOption) => (
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
                        <p className="admin-copy-muted mt-1">{copy.visibilityCopy}</p>
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
                  <SegmentedSwitcher<AppLocale>
                    activeValue={editorLocale}
                    ariaLabel={copy.previewLanguage}
                    onSelect={(value) => setEditorLocale(value)}
                    options={editorLocaleOptions}
                    testId="admin-preview-locale-switcher"
                  />
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
                      key={previewIframePath}
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

      <MarkdownMediaModal
        kind={contentMediaModal === "video" ? "video" : "image"}
        isOpen={contentMediaModal !== null}
        isUploading={isUploadingContentMedia}
        error={contentMediaError}
        copy={{
          insertImage: copy.markdownImage,
          insertVideo: copy.markdownVideo,
          uploadFile: copy.mediaUploadFile,
          useExternalUrl: copy.mediaUseExternalUrl,
          altText: copy.mediaAltText,
          mediaTitle: copy.mediaVideoTitle,
          mediaUrl: copy.mediaUrl,
          chooseImage: copy.mediaChooseImage,
          chooseVideo: copy.mediaChooseVideo,
          insertIntoContent: copy.mediaInsert,
          uploadingMedia: copy.mediaUploading,
          cancel: common.cancel,
          invalidImage: copy.invalidContentImage,
          invalidVideo: copy.invalidContentVideo,
        }}
        onClose={() => setContentMediaModal(null)}
        onSubmit={handleContentMediaInsert}
      />

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
