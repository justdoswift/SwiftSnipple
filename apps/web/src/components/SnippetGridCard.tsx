import { motion } from "motion/react";
import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../lib/heroui";
import { resolveAssetUrl } from "../lib/asset-url";
import { getLocalizedSnippetFields, localizePublicPath, useAppLocale } from "../lib/locale";
import type { Snippet } from "../types";

interface SnippetGridCardProps {
  snippet: Snippet;
}

function formatPublishedDate(value: string | null, locale: "en" | "zh") {
  if (!value) return null;

  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SnippetGridCard({ snippet }: SnippetGridCardProps) {
  const { locale } = useAppLocale();
  const fields = getLocalizedSnippetFields(snippet, locale);
  const publishedDate = formatPublishedDate(snippet.publishedAt, locale);

  return (
    <Link
      to={localizePublicPath(`/snippets/${fields.slug}`)}
      className="public-home-grid-card group block"
    >
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        <Card className="public-home-grid-card-shell public-surface-subtle overflow-hidden">
          <div className="public-home-grid-card-media aspect-[1.18/1] overflow-hidden">
            <img
              src={resolveAssetUrl(snippet.coverImage)}
              alt={fields.title}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] group-hover:brightness-105"
              referrerPolicy="no-referrer"
            />
          </div>
          <Card.Content className="space-y-4 px-1 py-5 md:py-6">
            <div className="space-y-3">
              <span className="type-mono-micro">{fields.category}</span>

              <h3 className="public-home-grid-card-title text-[1.35rem] font-semibold leading-[1.16] tracking-[-0.025em]">
                {fields.title}
              </h3>

              <p
                className="public-home-grid-card-copy public-home-grid-card-copy-slot type-body line-clamp-2"
                aria-hidden={!fields.excerpt}
              >
                {fields.excerpt || "\u00A0"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {publishedDate ? <span className="type-mono-micro">{publishedDate}</span> : null}
              {snippet.requiresSubscription ? (
                <span className="type-mono-micro inline-flex items-center gap-1.5">
                  <LockKeyhole size={12} />
                </span>
              ) : null}
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </Link>
  );
}
