import { Card, Chip, Input } from "../../lib/heroui";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getSnippets } from "../../services/snippets";
import { Snippet, SnippetStatus } from "../../types";

const STATUS_OPTIONS: Array<SnippetStatus | "All"> = ["All", "Draft", "In Review", "Scheduled", "Published"];

function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const categories = Array.from(new Set(snippets.map((snippet) => snippet.category)));
  const [statusFilter, setStatusFilter] = useState<SnippetStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const headerConfig = useMemo(
    () => ({
      start: (
        <div className="min-w-0">
          <p className="admin-eyebrow type-mono-micro">Snippet Workspace</p>
          <h1 className="admin-header-title mt-2 truncate text-sm font-semibold">Snippet Library</h1>
        </div>
      ),
      end: (
        <Link
          to="/admin/snippets/new"
          className="admin-button-primary type-action inline-flex h-10 shrink-0 items-center px-4"
        >
          New Snippet
        </Link>
      ),
    }),
    [],
  );

  useAdminHeader(headerConfig);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getSnippets()
      .then((items) => {
        if (!active) return;
        setSnippets(items);
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
  }, []);

  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return snippets.filter((snippet) => {
      const matchesStatus = statusFilter === "All" || snippet.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || snippet.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        snippet.title.toLowerCase().includes(normalizedQuery) ||
        snippet.slug.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [snippets, categoryFilter, query, statusFilter]);

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <section className="space-y-3">
        {isLoading ? <p className="admin-copy-muted type-body-sm">Loading snippet library...</p> : null}
        {error ? <p className="type-body-sm text-red-600">{error}</p> : null}
        {!isLoading && !error ? (
          <p className="admin-copy-muted type-body-sm">
            Filter by publishing stage, search by title, and jump straight into editing without leaving the library workflow.
          </p>
        ) : null}
      </section>

      <Card className="mt-8 rounded-[28px]">
        <Card.Content className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <Input
          aria-label="Search title or slug"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or slug"
          className="admin-input"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as SnippetStatus | "All")}
          className="admin-select"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              Status: {status}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="admin-select"
        >
          <option value="All">Category: All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              Category: {category}
            </option>
          ))}
        </select>
        </Card.Content>
      </Card>

      <section className="mt-8 grid gap-6">
        {!isLoading && !error && !snippets.length ? (
          <Card className="rounded-[28px] border border-dashed border-outline-variant/20">
            <Card.Content className="px-6 py-12 text-center">
              <p className="type-mono-micro text-primary/35">No snippets yet</p>
              <h2 className="type-section-title mt-4 text-[2rem]">Start the first showcase entry</h2>
              <p className="type-body-sm mt-3">
                The library will populate as soon as the first snippet is created.
              </p>
            </Card.Content>
          </Card>
        ) : null}
        {filteredSnippets.map((snippet) => (
          <Link
            key={snippet.id}
            to={`/admin/snippets/${snippet.id}`}
            className="admin-list-link block"
          >
            <Card className="rounded-[28px] transition-all hover:-translate-y-0.5">
              <Card.Content className="grid gap-6 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:p-6">
                <div className="aspect-[4/3] overflow-hidden rounded-[22px] bg-surface-container-low">
                  <img
                    src={snippet.coverImage}
                    alt={snippet.title}
                    className="h-full w-full object-cover grayscale transition-all duration-500 hover:scale-[1.03] hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_180px]">
                  <div>
                    <p className="admin-copy-faint type-mono-micro">{snippet.category}</p>
                    <h2 className="type-card-title mt-3">{snippet.title}</h2>
                    <p className="type-body-sm mt-3 max-w-3xl">{snippet.excerpt}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {snippet.tags.map((tag) => (
                        <Chip
                          key={tag}
                          size="sm"
                          radius="full"
                          variant="flat"
                          className="type-mono-micro"
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between gap-5 xl:items-end">
                    <StatusBadge status={snippet.status} />
                    <div className="admin-copy-muted space-y-2 type-body-sm xl:text-right">
                      <p>Updated {formatDate(snippet.updatedAt)}</p>
                      <p>{snippet.status === "Published" ? `Live ${formatDate(snippet.publishedAt)}` : snippet.slug}</p>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </Link>
        ))}

        {!filteredSnippets.length && (
          <Card className="rounded-[28px] border border-dashed border-outline-variant/20">
            <Card.Content className="px-6 py-12 text-center">
              <p className="type-mono-micro text-primary/35">No matches</p>
              <h2 className="type-section-title mt-4 text-[2rem]">Try another filter set</h2>
              <p className="type-body-sm mt-3">
                No snippet matches the current query, status, and category combination.
              </p>
            </Card.Content>
          </Card>
        )}
      </section>
    </div>
  );
}
