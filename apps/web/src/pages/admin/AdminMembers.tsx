import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminMembersContent from "../../components/admin/AdminMembersContent";
import StatCard from "../../components/admin/StatCard";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { getMessages } from "../../lib/messages";
import { localizeAdminPath, useAppLocale } from "../../lib/locale";
import { isUnauthorizedError } from "../../services/api";
import { getAdminMembers } from "../../services/admin-members";
import type { AdminMember } from "../../types";

export default function AdminMembers() {
  const { locale } = useAppLocale();
  const navigate = useNavigate();
  const copy = getMessages(locale).admin;
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const headerConfig = useMemo(
    () => ({
      center: (
        <div className="admin-nav-inline-context min-w-0">
          <h1 className="admin-header-title truncate">{copy.members}</h1>
        </div>
      ),
    }),
    [copy.members],
  );

  useAdminHeader(headerConfig);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getAdminMembers()
      .then((items) => {
        if (!active) return;
        setMembers(items ?? []);
        setError("");
      })
      .catch((err: Error) => {
        if (!active) return;
        if (isUnauthorizedError(err)) {
          navigate(localizeAdminPath(locale, "/admin/login"), { replace: true });
          return;
        }
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale, navigate]);

  const paidCount = members.filter((member) => member.isPaid).length;
  const freeCount = members.length - paidCount;

  return (
    <div className="px-6 py-8 md:px-8 md:py-10 xl:px-10">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={copy.totalMembers} value={members.length} />
        <StatCard label={copy.paidMembers} value={paidCount} />
        <StatCard label={copy.freeMembers} value={freeCount} />
      </section>

      <AdminMembersContent members={members} isLoading={isLoading} error={error} />
    </div>
  );
}
