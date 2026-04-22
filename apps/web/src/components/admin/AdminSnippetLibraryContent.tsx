import { ChevronDown } from "lucide-react";
import { Dropdown, Input } from "../../lib/heroui";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import type { Snippet, SnippetStatus } from "../../types";
import { resolveAssetUrl } from "../../lib/asset-url";
import { getMessages } from "../../lib/messages";
import { getLocalizedSnippetFields, localizeAdminPath, useAppLocale } from "../../lib/locale";
import StatusBadge from "./StatusBadge";

const STATUS_OPTIONS: Array<SnippetStatus | "All"> = ["All", "Draft", "Published"];
type LibrarySelectOption = {
  id: string;
  label: string;
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

interface AdminSnippetLibraryContentProps {
  snippets: Snippet[] | null | undefined;
  isLoading: boolean;
  error: string;
}

export default function AdminSnippetLibraryContent({
  snippets,
  isLoading,
  error,
}: AdminSnippetLibraryContentProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).admin;
  const common = getMessages(locale).common;
  const safeSnippets = snippets ?? [];
  const categories = useMemo(
    () => Array.from(new Set(safeSnippets.map((snippet) => getLocalizedSnippetFields(snippet, locale).category))),
    [locale, safeSnippets],
  );
  const statusFilterOptions = useMemo<LibrarySelectOption[]>(
    () =>
      STATUS_OPTIONS.map((status) => ({
        id: status,
        label: status === "All" ? copy.statusAll : `${copy.status}: ${common.statuses[status]}`,
      })),
    [common.statuses, copy.status, copy.statusAll],
  );
  const categoryFilterOptions = useMemo<LibrarySelectOption[]>(
    () => [
      { id: "All", label: copy.categoryAll },
      ...categories.map((category) => ({
        id: category,
        label: `Category: ${category}`,
      })),
    ],
    [categories, copy.categoryAll],
  );
  const [statusFilter, setStatusFilter] = useState<SnippetStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const statusFilterLabel = statusFilterOptions.find((option) => option.id === statusFilter)?.label ?? copy.statusAll;
  const categoryFilterLabel = categoryFilterOptions.find((option) => option.id === categoryFilter)?.label ?? copy.categoryAll;
  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return safeSnippets.filter((snippet) => {
      const fields = getLocalizedSnippetFields(snippet, locale);
      const matchesStatus = statusFilter === "All" || snippet.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || fields.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        fields.title.toLowerCase().includes(normalizedQuery) ||
        fields.slug.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [categoryFilter, locale, query, safeSnippets, statusFilter]);

  return (
    <>
      <div className="admin-section-card mt-8">
        <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            aria-label={copy.searchTitleOrSlug}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchTitleOrSlug}
            className="admin-input admin-filter-input"
          />

          <Dropdown>
            <Dropdown.Trigger
              aria-label={copy.statusAll}
              className="admin-filter-select-trigger"
            >
              <span className="admin-filter-select-value">{statusFilterLabel}</span>
              <ChevronDown className="admin-filter-select-indicator" />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                items={statusFilterOptions}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[statusFilter]}
                onAction={(key) => setStatusFilter(String(key) as SnippetStatus | "All")}
              >
                {(option: LibrarySelectOption) => (
                  <Dropdown.Item id={option.id} textValue={option.label}>
                    {option.label}
                    <Dropdown.ItemIndicator />
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Dropdown>
            <Dropdown.Trigger
              aria-label={copy.categoryAll}
              className="admin-filter-select-trigger"
            >
              <span className="admin-filter-select-value">{categoryFilterLabel}</span>
              <ChevronDown className="admin-filter-select-indicator" />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                items={categoryFilterOptions}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[categoryFilter]}
                onAction={(key) => setCategoryFilter(String(key))}
              >
                {(option: LibrarySelectOption) => (
                  <Dropdown.Item id={option.id} textValue={option.label}>
                    {option.label}
                    <Dropdown.ItemIndicator />
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <section className="mt-8 grid gap-6">
        {isLoading ? <p className="admin-copy-muted type-body-sm">{copy.loadingSnippetLibrary}</p> : null}
        {error ? <p className="admin-inline-alert px-4 py-3">{error}</p> : null}

        {!isLoading && !error && !safeSnippets.length ? (
          <div className="admin-section-card admin-list-divider border border-dashed">
            <div className="px-6 py-12 text-center">
              <p className="admin-empty-kicker type-mono-micro">{copy.noSnippets}</p>
              <h2 className="admin-section-title admin-section-title-lg mt-4">{copy.startFirstEntry}</h2>
              <p className="type-body-sm mt-3">
                {copy.noSnippetsCopy}
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && !error
          ? filteredSnippets.map((snippet) => {
              const fields = getLocalizedSnippetFields(snippet, locale);

              return <Link
                key={snippet.id}
                to={localizeAdminPath(locale, `/admin/snippets/${snippet.id}`)}
                className="admin-list-link block"
              >
                <div className="admin-section-card transition-all hover:-translate-y-0.5">
                  <div className="grid gap-6 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:p-6">
                    <div className="snippet-cover-frame admin-image-stage overflow-hidden">
                      <img
                        src={resolveAssetUrl(snippet.coverImage)}
                        alt={fields.title}
                        className="snippet-cover-image grayscale transition-all duration-500 hover:scale-[1.02] hover:grayscale-0"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_180px]">
                      <div>
                        <p className="admin-copy-faint type-mono-micro">{fields.category}</p>
                        <h2 className="type-card-title mt-3">{fields.title}</h2>
                        <p className="type-body-sm mt-3 max-w-3xl">{fields.excerpt}</p>
                      </div>
                      <div className="flex flex-col justify-between gap-5 xl:items-end">
                        <StatusBadge status={snippet.status} />
                        <div className="admin-snippet-meta space-y-2 xl:text-right">
                          <p>{copy.updated} {formatDate(snippet.updatedAt)}</p>
                          <p>{snippet.status === "Published" ? `${copy.live} ${formatDate(snippet.publishedAt)}` : fields.slug}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>;
            })
          : null}

        {!isLoading && !error && !filteredSnippets.length && safeSnippets.length ? (
          <div className="admin-section-card admin-list-divider border border-dashed">
            <div className="px-6 py-12 text-center">
              <p className="admin-empty-kicker type-mono-micro">{copy.noMatches}</p>
              <h2 className="admin-section-title admin-section-title-lg mt-4">{copy.tryAnotherFilter}</h2>
              <p className="type-body-sm mt-3">
                {copy.noMatchesCopy}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
