import { LockKeyhole, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { resolveAssetUrl } from "../lib/asset-url";
import { SearchField, Modal, Spinner } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { getLocalizedSnippetFields, getLocalizedSnippetPath, useAppLocale } from "../lib/locale";
import { searchPublicSnippets } from "../lib/public-search";
import { getSnippets } from "../services/snippets";
import type { Snippet } from "../types";

interface PublicSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loadSnippets?: typeof getSnippets;
}

function formatUpdatedDate(value: string, locale: "en" | "zh") {
  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PublicSearch({ isOpen, onOpenChange, loadSnippets = getSnippets }: PublicSearchProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).search;
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const previousLocationRef = useRef(`${location.pathname}${location.search}`);

  useEffect(() => {
    if (!isOpen || snippets) {
      return;
    }

    let active = true;
    setIsLoading(true);
    setError("");

    loadSnippets()
      .then((items) => {
        if (!active) return;
        setSnippets(items.filter((snippet) => snippet.status === "Published"));
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
  }, [isOpen, loadSnippets, snippets]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const nextLocationKey = `${location.pathname}${location.search}`;
    if (isOpen && previousLocationRef.current !== nextLocationKey) {
      setQuery("");
      onOpenChange(false);
    }

    previousLocationRef.current = nextLocationKey;
  }, [isOpen, location.pathname, location.search, onOpenChange]);

  const results = useMemo(
    () => searchPublicSnippets(snippets ?? [], query, locale),
    [locale, query, snippets],
  );

  function handleClose() {
    setQuery("");
    onOpenChange(false);
  }

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(nextOpen: boolean) => {
          if (!nextOpen) {
            handleClose();
            return;
          }

          onOpenChange(true);
        }}
        variant="blur"
        className="public-search-backdrop"
      >
        <Modal.Container className="public-search-container">
          <Modal.Dialog className="public-search-dialog">
            <div className="public-search-header">
              <SearchField
                variant="secondary"
                fullWidth
                aria-label={copy.fieldLabel}
                value={query}
                onChange={setQuery}
                autoFocus
                className="public-search-field"
              >
                <SearchField.Group className="public-search-field-group">
                  <SearchField.SearchIcon className="public-search-field-icon" />
                  <SearchField.Input className="public-search-field-input" placeholder={copy.placeholder} />
                </SearchField.Group>
              </SearchField>
            </div>

            <div className="public-search-body">
              {isLoading ? (
                <div className="public-search-state" data-testid="public-search-loading">
                  <Spinner size="sm" />
                  <p>{copy.loading}</p>
                </div>
              ) : null}

              {!isLoading && error ? (
                <div className="public-search-state" data-testid="public-search-error">
                  <p>{copy.error}</p>
                </div>
              ) : null}

              {!isLoading && !error && !query.trim() ? (
                <div className="public-search-state" data-testid="public-search-idle">
                  <Search size={18} strokeWidth={2} />
                  <div className="text-center">
                    <p className="type-body-sm">{copy.idleCopy}</p>
                  </div>
                </div>
              ) : null}

              {!isLoading && !error && query.trim() && !results.length ? (
                <div className="public-search-state" data-testid="public-search-empty">
                  <p className="type-action">{copy.noResultsTitle}</p>
                  <p className="type-body-sm">{copy.noResultsCopy}</p>
                </div>
              ) : null}

              {!isLoading && !error && results.length ? (
                <div className="public-search-results" role="list" aria-label={copy.resultsLabel}>
                  {results.map(({ snippet, preview }) => {
                    const fields = getLocalizedSnippetFields(snippet, locale);
                    return (
                      <Link
                        key={snippet.id}
                        to={getLocalizedSnippetPath(locale, snippet)}
                        className="public-search-result"
                        onClick={handleClose}
                      >
                        <div className="public-search-result-media">
                          <img
                            src={resolveAssetUrl(snippet.coverImage)}
                            alt={fields.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="public-search-result-copy">
                          <div className="public-search-result-meta">
                            <span className="public-search-result-category type-mono-micro">{fields.category}</span>
                            {snippet.requiresSubscription ? (
                              <span className="type-mono-micro inline-flex items-center gap-1">
                                <LockKeyhole size={12} />
                                {copy.membersOnly}
                              </span>
                            ) : null}
                            <span className="type-mono-micro">{formatUpdatedDate(snippet.updatedAt, locale)}</span>
                          </div>
                          <h3 className="public-search-result-title">{fields.title}</h3>
                          <p className="public-search-result-preview type-body-sm">{preview}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
