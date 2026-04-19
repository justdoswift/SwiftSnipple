import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSnippetLibraryContent from "../../components/admin/AdminSnippetLibraryContent";
import { useAdminHeader } from "../../components/admin/useAdminHeader";
import { Tooltip } from "../../lib/heroui";
import { getMessages } from "../../lib/messages";
import { localizeAdminPath, useAppLocale } from "../../lib/locale";
import { isUnauthorizedError } from "../../services/api";
import { getSnippets } from "../../services/snippets";
import { Snippet } from "../../types";

export default function AdminSnippets() {
  const { locale } = useAppLocale();
  const navigate = useNavigate();
  const copy = getMessages(locale).admin;
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerConfig = useMemo(
    () => ({
      center: (
        <div className="admin-nav-inline-context min-w-0">
          <h1 className="admin-header-title truncate">{copy.snippetLibrary}</h1>
        </div>
      ),
      end: (
        <Tooltip delay={0} closeDelay={0}>
          <Tooltip.Trigger>
            <Link
              to={localizeAdminPath(locale, "/admin/snippets/new")}
              aria-label={copy.newSnippet}
              className="admin-nav-action-icon type-action"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </Tooltip.Trigger>
          <Tooltip.Content>
            {copy.newSnippet}
          </Tooltip.Content>
        </Tooltip>
      ),
    }),
    [copy.newSnippet, copy.snippetLibrary, locale],
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

  return (
    <div className="px-6 py-8 md:px-8 md:py-10 xl:px-10">
      <AdminSnippetLibraryContent snippets={snippets} isLoading={isLoading} error={error} />
    </div>
  );
}
