import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminDashboard() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const draftCount = snippets.filter((snippet) => snippet.status === "Draft").length;
  const publishedCount = snippets.filter((snippet) => snippet.status === "Published").length;
  const reviewCount = snippets.filter((snippet) => snippet.status === "In Review").length;
  const scheduledCount = snippets.filter((snippet) => snippet.status === "Scheduled").length;
  const recentSnippets = snippets.slice(0, 3);

  return (
    <div className="px-6 py-10 md:px-10 md:py-12">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-primary/40">Snippet Overview</p>
          <h1 className="mt-4 text-[3rem] font-black tracking-tighter leading-[0.92] text-primary md:text-[4.75rem]">
            Ship SwiftUI snippets with the same care you use to build them.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            This console keeps snippet metadata, publishing state, and implementation notes in one place so new entries
            can move from draft to release without losing clarity.
          </p>
          {isLoading ? <p className="mt-4 text-sm text-primary/50">Loading snippet metrics...</p> : null}
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      </motion.section>

      <section className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entries" value={snippets.length} note="Total snippets currently managed inside the publishing workspace." />
        <StatCard label="Drafts" value={draftCount} note="Snippets still being shaped before they go live." />
        <StatCard label="Published" value={publishedCount} note="Entries that are live and visible in the public library." />
        <StatCard label="Pipeline" value={reviewCount + scheduledCount} note="Snippets queued in review or already staged for release." />
      </section>

      <section className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="border border-outline-variant/15 bg-surface-container-lowest">
          <div className="flex items-end justify-between border-b border-outline-variant/10 px-6 py-5 md:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Recent Activity</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">Latest edits and launches</h2>
            </div>
            <Link
              to="/admin/snippets"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60 transition-colors hover:text-primary"
            >
              Open list
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {!isLoading && !recentSnippets.length ? (
              <div className="px-6 py-10 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/35">No activity yet</p>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Create the first snippet to start the publishing timeline.
                </p>
              </div>
            ) : null}
            {recentSnippets.map((snippet) => (
              <Link
                key={snippet.id}
                to={`/admin/snippets/${snippet.id}`}
                className="grid gap-5 px-6 py-6 transition-colors hover:bg-surface-container-low/40 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/35">{snippet.category}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight">{snippet.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{snippet.excerpt}</p>
                </div>
                <div className="flex flex-col items-start gap-4 md:items-end">
                  <StatusBadge status={snippet.status} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40">
                    Updated {formatDate(snippet.updatedAt)}
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
                      style={{ width: `${snippets.length ? (Number(count) / snippets.length) * 100 : 0}%` }}
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
              Shape the snippet metadata first, then refine the notes and preview until the public card feels right.
            </p>
            <Link
              to="/admin/snippets/new"
              className="mt-6 inline-flex bg-white px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"
            >
              Start new snippet
            </Link>
          </div>

          <div className="border border-outline-variant/15 bg-surface-container-lowest p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">Scheduled Release</p>
            <h2 className="mt-3 text-xl font-bold tracking-tight">
              {snippets.find((snippet) => snippet.status === "Scheduled")?.title ?? "No scheduled snippet"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              {snippets.find((snippet) => snippet.status === "Scheduled")?.publishedAt
                ? `Queued for ${formatDate(snippets.find((snippet) => snippet.status === "Scheduled")?.publishedAt ?? null)}`
                : "Nothing is queued for release right now."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
