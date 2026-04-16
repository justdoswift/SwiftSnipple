import { Chip } from "../../lib/heroui";
import { SnippetStatus } from "../../types";

const STATUS_PROPS: Record<SnippetStatus, { color: "default" | "primary"; variant: "flat" | "solid" }> = {
  Draft: { color: "default", variant: "flat" },
  "In Review": { color: "primary", variant: "flat" },
  Scheduled: { color: "default", variant: "flat" },
  Published: { color: "primary", variant: "solid" },
};

export default function StatusBadge({ status }: { status: SnippetStatus }) {
  return (
    <Chip
      size="sm"
      radius="full"
      className="type-mono-micro"
      color={STATUS_PROPS[status].color}
      variant={STATUS_PROPS[status].variant}
    >
      {status}
    </Chip>
  );
}
