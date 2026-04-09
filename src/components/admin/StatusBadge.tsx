import { ArticleStatus } from "../../types";

const STATUS_STYLES: Record<ArticleStatus, string> = {
  Draft: "bg-surface-container-low text-primary/70",
  "In Review": "bg-primary-container text-white",
  Scheduled: "bg-surface-dim text-primary",
  Published: "bg-primary text-white",
};

export default function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
