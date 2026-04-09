import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import { getArticles } from "../../services/articles";
import { Article } from "../../types";

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getArticles()
      .then((items) => {
        if (!active) return;
        setArticles(items);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const draftCount = articles.filter((article) => article.status === "Draft").length;
  const publishedCount = articles.filter((article) => article.status === "Published").length;
  const reviewCount = articles.filter((article) => article.status === "In Review").length;
  const scheduledCount = articles.filter((article) => article.status === "Scheduled").length;
  const recentArticles = articles.slice(0, 3);

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-primary/40">Editorial Overview</p>
          <h1 className="mt-4 text-[3rem] font-black tracking-tighter leading-[0.92] text-primary md:text-[4.75rem]">
            Publish with the same discipline the archive uses to design.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            This console keeps article metadata, scheduling, and long-form writing in one place so new entries can move
            from draft to release without losing the tone of the publication.
          </p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      </motion.section>

      <section className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entries" value={articles.length} note="Total articles currently managed inside the archive workspace." />
        <StatCard label="Drafts" value={draftCount} note="Pieces still being shaped before editorial review begins." />
        <StatCard label="Published" value={publishedCount} note="Entries that are live and ready for the public archive." />
        <StatCard label="Pipeline" value={reviewCount + scheduledCount} note="Articles queued in review or already staged for release." />
      </section>

      <section className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="border border-outline-variant/15 bg-surface-container-lowest">
          <div className="flex items-end justify-between border-b border-outline-variant/10 px-6 py-5 md:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Recent Activity</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Latest edits and releases</h2>
            </div>
            <Link
              to="/admin/articles"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 transition-colors hover:text-primary"
            >
              Open list
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                to={`/admin/articles/${article.id}`}
                className="grid gap-5 px-6 py-6 transition-colors hover:bg-surface-container-low/40 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/35">{article.category}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight">{article.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{article.excerpt}</p>
                </div>
                <div className="flex flex-col items-start gap-4 md:items-end">
                  <StatusBadge status={article.status} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40">
                    Updated {formatDate(article.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-outline-variant/15 bg-surface-container-lowest p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Status Mix</p>
            <div className="mt-6 space-y-4">
              {[
                ["Draft", draftCount],
                ["In Review", reviewCount],
                ["Scheduled", scheduledCount],
                ["Published", publishedCount],
              ].map(([label, count]) => (
                <div key={label} className="grid grid-cols-[110px_1fr_auto] items-center gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/50">{label}</span>
                  <div className="h-2 overflow-hidden bg-surface-container-low">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${articles.length ? (Number(count) / articles.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-outline-variant/15 bg-primary p-6 text-white">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">Next Up</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Ship the next entry faster</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Use the editor to shape metadata first, then refine the Markdown body while the live preview keeps the page honest.
            </p>
            <Link
              to="/admin/articles/new"
              className="mt-6 inline-flex bg-white px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"
            >
              Start new article
            </Link>
          </div>

          <div className="border border-outline-variant/15 bg-surface-container-lowest p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Scheduled Release</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight">
              {articles.find((article) => article.status === "Scheduled")?.title ?? "No scheduled article"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {articles.find((article) => article.status === "Scheduled")?.publishedAt
                ? `Queued for ${formatDate(articles.find((article) => article.status === "Scheduled")?.publishedAt ?? null)}`
                : "Nothing is queued for release right now."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
