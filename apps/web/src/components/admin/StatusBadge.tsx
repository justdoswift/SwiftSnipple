import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import { SnippetStatus } from "../../types";

const STATUS_CLASSNAMES: Record<SnippetStatus, string> = {
  Draft: "admin-status-badge-draft",
  Published: "admin-status-badge-published",
};

export default function StatusBadge({ status }: { status: SnippetStatus }) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).common;

  return (
    <span className={`admin-status-badge type-mono-micro ${STATUS_CLASSNAMES[status]}`}>
      {copy.statuses[status]}
    </span>
  );
}
