import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/admin/StatusBadge";
import { getArticles } from "../../services/articles";
import { Article, ArticleStatus } from "../../types";

const STATUS_OPTIONS: Array<ArticleStatus | "All"> = ["All", "Draft", "In Review", "Scheduled", "Published"];

function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const categories = Array.from(new Set(articles.map((article) => article.category)));
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getArticles()
      .then((items) => {
        if (!active) return;
        setArticles(items);
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

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesStatus = statusFilter === "All" || article.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || article.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.slug.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [articles, categoryFilter, query, statusFilter]);

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <section className="flex flex-col gap-5 border-b border-outline-variant/10 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Articles</p>
          <h1 className="mt-4 text-[2.75rem] font-black tracking-tighter leading-[0.94] md:text-[4rem]">Publishing index</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant">
            Filter by workflow stage, search by title, and jump straight into editing without leaving the archive context.
          </p>
          {isLoading ? <p className="mt-4 text-sm text-primary/50">Loading article index...</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
        <Link
          to="/admin/articles/new"
          className="inline-flex items-center justify-center bg-primary px-5 py-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white"
        >
          New article
        </Link>
      </section>

      <section className="mt-8 grid gap-4 border border-outline-variant/15 bg-surface-container-lowest p-5 md:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="flex items-center gap-3 border border-outline-variant/10 bg-surface px-4 py-3">
          <Search className="h-4 w-4 text-primary/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or slug"
            className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-primary/30"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ArticleStatus | "All")}
          className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm text-primary outline-none"
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
          className="border border-outline-variant/10 bg-surface px-4 py-3 text-sm text-primary outline-none"
        >
          <option value="All">Category: All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              Category: {category}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-8 grid gap-6">
        {!isLoading && !error && !articles.length ? (
          <div className="border border-dashed border-outline-variant/20 bg-surface-container-lowest px-6 py-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/35">No articles yet</p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">Start the first archive entry</h2>
            <p className="mt-3 text-sm text-on-surface-variant">
              The publishing index will populate as soon as the first article is created.
            </p>
          </div>
        ) : null}
        {filteredArticles.map((article) => (
          <Link
            key={article.id}
            to={`/admin/articles/${article.id}`}
            className="grid gap-6 border border-outline-variant/15 bg-surface-container-lowest p-5 transition-colors hover:bg-surface-container-low/35 md:grid-cols-[220px_minmax(0,1fr)] md:p-6"
          >
            <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover grayscale transition-all duration-500 hover:scale-[1.03] hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">{article.category}</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">{article.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{article.excerpt}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-container-low px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-5 xl:items-end">
                <StatusBadge status={article.status} />
                <div className="space-y-2 text-sm text-on-surface-variant xl:text-right">
                  <p>Updated {formatDate(article.updatedAt)}</p>
                  <p>{article.status === "Published" ? `Live ${formatDate(article.publishedAt)}` : article.slug}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {!filteredArticles.length && (
          <div className="border border-dashed border-outline-variant/20 bg-surface-container-lowest px-6 py-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/35">No matches</p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">Try another filter set</h2>
            <p className="mt-3 text-sm text-on-surface-variant">
              No article matches the current query, status, and category combination.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
