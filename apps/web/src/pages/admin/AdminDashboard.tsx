import { Button, Card } from "../../lib/heroui";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
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
  const headerConfig = useMemo(
    () => ({
      start: (
        <div className="admin-nav-inline-context min-w-0">
          <span className="admin-eyebrow type-mono-micro">Workspace</span>
          <h1 className="admin-header-title truncate text-sm font-semibold">Overview</h1>
        </div>
      ),
      end: (
        <Link
          to="/admin/snippets/new"
          aria-label="Create new snippet"
          title="Create new snippet"
          className="admin-button-primary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <Plus size={18} />
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

  const draftCount = snippets.filter((snippet) => snippet.status === "Draft").length;
  const publishedCount = snippets.filter((snippet) => snippet.status === "Published").length;
  const reviewCount = snippets.filter((snippet) => snippet.status === "In Review").length;
  const scheduledCount = snippets.filter((snippet) => snippet.status === "Scheduled").length;
  const recentSnippets = snippets.slice(0, 3);

  return (
    <div className="px-6 py-10 md:px-8 md:py-12 xl:px-10">
      {isLoading ? <p className="admin-copy-muted type-body-sm">Loading snippet metrics...</p> : null}
      {error ? <p className="admin-inline-alert rounded-[20px] px-4 py-3 text-sm leading-relaxed">{error}</p> : null}

      <section className={`${!isLoading && !error ? "" : "mt-8"} grid gap-4 md:grid-cols-2 xl:grid-cols-4`}>
        <StatCard label="Entries" value={snippets.length} note="Total snippets currently managed inside the publishing workspace." />
        <StatCard label="Drafts" value={draftCount} note="Snippets still being shaped before they go live." />
        <StatCard label="Published" value={publishedCount} note="Entries that are live and visible in the public library." />
        <StatCard label="Pipeline" value={reviewCount + scheduledCount} note="Snippets queued in review or already staged for release." />
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card className="admin-section-card rounded-[28px]">
          <Card.Header className="admin-card-header flex items-end justify-between px-6 py-5 md:px-8">
            <div>
              <p className="admin-eyebrow type-mono-micro">Recent Activity</p>
              <h2 className="type-section-title mt-3 text-[1.9rem]">Latest edits and launches</h2>
            </div>
            <Link
              to="/admin/snippets"
              className="admin-link-inline type-action transition-colors"
            >
              Open list
            </Link>
          </Card.Header>
          <Card.Content className="admin-list-divider divide-y p-0">
            {!isLoading && !recentSnippets.length ? (
              <div className="px-6 py-10 text-center">
                <p className="admin-empty-kicker type-mono-micro">No activity yet</p>
                <p className="type-body-sm mt-3">
                  Create the first snippet to start the publishing timeline.
                </p>
              </div>
            ) : null}
            {recentSnippets.map((snippet) => (
              <Link
                key={snippet.id}
                to={`/admin/snippets/${snippet.id}`}
                className="admin-card-row grid gap-5 px-6 py-6 transition-colors md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="admin-copy-faint type-mono-micro">{snippet.category}</p>
                  <h3 className="type-card-title mt-2 text-[1.35rem]">{snippet.title}</h3>
                  <p className="type-body-sm mt-3 max-w-2xl">{snippet.excerpt}</p>
                </div>
                <div className="flex flex-col items-start gap-4 md:items-end">
                  <StatusBadge status={snippet.status} />
                  <span className="admin-copy-faint type-mono-micro">
                    Updated {formatDate(snippet.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </Card.Content>
        </Card>

        <div className="space-y-6">
          <Card className="admin-section-card rounded-[26px]">
            <Card.Content className="p-6">
            <p className="admin-eyebrow type-mono-micro">Status Mix</p>
            <div className="mt-6 space-y-4">
              {[
                ["Draft", draftCount],
                ["In Review", reviewCount],
                ["Scheduled", scheduledCount],
                ["Published", publishedCount],
              ].map(([label, count]) => (
                <div key={label} className="grid grid-cols-[110px_1fr_auto] items-center gap-4">
                  <span className="admin-copy-muted type-mono-micro">{label}</span>
                  <div
                    aria-label={`${label} ratio`}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={snippets.length ? Math.round((Number(count) / snippets.length) * 100) : 0}
                    className="admin-progress-track w-full"
                  >
                    <span
                      className="admin-progress-indicator"
                      style={{ width: `${snippets.length ? (Number(count) / snippets.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
            </Card.Content>
          </Card>

          <Card className="admin-section-card admin-callout-card rounded-[28px]">
            <Card.Content className="p-6">
            <p className="admin-eyebrow type-mono-micro">Next Up</p>
            <h2 className="admin-callout-title type-section-title mt-3 text-[1.9rem]">Ship the next entry faster</h2>
            <p className="admin-callout-copy type-body-sm mt-3">
              Shape the snippet metadata first, then refine the notes and preview until the public card feels right.
            </p>
            <Button
              className="admin-button-primary type-action mt-6"
              radius="full"
              onPress={() => {
                window.location.href = "/admin/snippets/new";
              }}
            >
              Start new snippet
            </Button>
            </Card.Content>
          </Card>

          <Card className="admin-section-card rounded-[26px]">
            <Card.Content className="p-6">
            <p className="admin-eyebrow type-mono-micro">Scheduled Release</p>
            <h2 className="type-card-title mt-3 text-[1.35rem]">
              {snippets.find((snippet) => snippet.status === "Scheduled")?.title ?? "No scheduled snippet"}
            </h2>
            <p className="type-body-sm mt-3">
              {snippets.find((snippet) => snippet.status === "Scheduled")?.publishedAt
                ? `Queued for ${formatDate(snippets.find((snippet) => snippet.status === "Scheduled")?.publishedAt ?? null)}`
                : "Nothing is queued for release right now."}
            </p>
            </Card.Content>
          </Card>
        </div>
      </section>
    </div>
  );
}
