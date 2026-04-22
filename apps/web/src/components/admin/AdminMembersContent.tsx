import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Dropdown, Input } from "../../lib/heroui";
import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import type { AdminMember } from "../../types";

type MemberTypeFilter = "All" | "Paid" | "Free";

type FilterOption = {
  id: MemberTypeFilter;
  label: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getSubscriptionLabel(
  status: AdminMember["subscriptionStatus"],
  labels: Record<AdminMember["subscriptionStatus"], string>,
) {
  return labels[status] ?? status;
}

interface AdminMembersContentProps {
  members: AdminMember[] | null | undefined;
  isLoading: boolean;
  error: string;
}

export default function AdminMembersContent({ members, isLoading, error }: AdminMembersContentProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).admin;
  const safeMembers = members ?? [];
  const [query, setQuery] = useState("");
  const [memberType, setMemberType] = useState<MemberTypeFilter>("All");

  const filterOptions = useMemo<FilterOption[]>(
    () => [
      { id: "All", label: copy.memberTypeAll },
      { id: "Paid", label: copy.memberTypePaid },
      { id: "Free", label: copy.memberTypeFree },
    ],
    [copy.memberTypeAll, copy.memberTypeFree, copy.memberTypePaid],
  );

  const selectedFilterLabel = filterOptions.find((option) => option.id === memberType)?.label ?? copy.memberTypeAll;

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return safeMembers.filter((member) => {
      const matchesQuery = !normalizedQuery || member.email.toLowerCase().includes(normalizedQuery);
      const matchesType =
        memberType === "All" ||
        (memberType === "Paid" && member.isPaid) ||
        (memberType === "Free" && !member.isPaid);

      return matchesQuery && matchesType;
    });
  }, [memberType, query, safeMembers]);

  return (
    <>
      <div className="admin-section-card mt-8">
        <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            aria-label={copy.searchMembers}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchMembers}
            className="admin-input admin-filter-input"
          />

          <Dropdown>
            <Dropdown.Trigger
              aria-label={copy.memberTypeAll}
              className="admin-filter-select-trigger"
            >
              <span className="admin-filter-select-value">{selectedFilterLabel}</span>
              <ChevronDown className="admin-filter-select-indicator" />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                items={filterOptions}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[memberType]}
                onAction={(key) => setMemberType(String(key) as MemberTypeFilter)}
              >
                {(option: FilterOption) => (
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
        {isLoading ? <p className="admin-copy-muted type-body-sm">{copy.loadingMembers}</p> : null}
        {error ? <p className="admin-inline-alert px-4 py-3">{error}</p> : null}

        {!isLoading && !error && !safeMembers.length ? (
          <div className="admin-section-card admin-list-divider border border-dashed">
            <div className="px-6 py-12 text-center">
              <p className="admin-empty-kicker type-mono-micro">{copy.noMembers}</p>
              <h2 className="admin-section-title admin-section-title-lg mt-4">{copy.membersEmptyTitle}</h2>
              <p className="type-body-sm mt-3">
                {copy.noMembersCopy}
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && filteredMembers.map((member) => (
          <article key={member.id} className="admin-section-card">
            <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em] ${
                      member.isPaid
                        ? "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)]"
                        : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    {member.isPaid ? copy.paidMember : copy.freeMember}
                  </span>
                  <span className="type-mono-micro admin-copy-faint">
                    {copy.memberSince} {formatDate(member.createdAt)}
                  </span>
                </div>

                <h2 className="type-card-title mt-4 break-all">{member.email}</h2>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="type-mono-micro admin-copy-faint">{copy.memberType}</p>
                  <p className="mt-2">{member.isPaid ? copy.paidMember : copy.freeMember}</p>
                </div>
                <div>
                  <p className="type-mono-micro admin-copy-faint">{copy.subscriptionStatusLabel}</p>
                  <p className="mt-2">{getSubscriptionLabel(member.subscriptionStatus, copy.subscriptionStatuses)}</p>
                </div>
                <div>
                  <p className="type-mono-micro admin-copy-faint">{copy.accessUntil}</p>
                  <p className="mt-2">{formatDate(member.currentPeriodEnd)}</p>
                </div>
              </div>
            </div>
          </article>
        ))}

        {!isLoading && !error && !filteredMembers.length && safeMembers.length ? (
          <div className="admin-section-card admin-list-divider border border-dashed">
            <div className="px-6 py-12 text-center">
              <p className="admin-empty-kicker type-mono-micro">{copy.noMatchingMembers}</p>
              <h2 className="admin-section-title admin-section-title-lg mt-4">{copy.tryAnotherMemberFilter}</h2>
              <p className="type-body-sm mt-3">
                {copy.noMatchingMembersCopy}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
