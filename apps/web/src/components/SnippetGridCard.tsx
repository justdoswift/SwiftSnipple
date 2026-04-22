import { motion } from "motion/react";
import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../lib/heroui";
import { resolveAssetUrl } from "../lib/asset-url";
import { getLocalizedSnippetFields, localizePublicPath, useAppLocale } from "../lib/locale";
import { resolveSnippetCoverImage } from "../lib/snippet-cover";
import { isSnippetLocaleAvailable } from "../lib/snippet-localization";
import { usePublicTheme } from "../lib/public-theme";
import { getMessages } from "../lib/messages";
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
  const theme = usePublicTheme();
  const common = getMessages(locale).common;
  const fields = getLocalizedSnippetFields(snippet, locale);
  const isLocaleAvailable = isSnippetLocaleAvailable(snippet, locale);
  const publishedDate = formatPublishedDate(snippet.publishedAt, locale);
  const coverImageUrl = resolveAssetUrl(resolveSnippetCoverImage(snippet, theme));

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
          <div className="snippet-cover-frame public-home-grid-card-media overflow-hidden">
            <img
              src={coverImageUrl}
              alt={fields.title}
              className="snippet-cover-image transition-all duration-500 group-hover:scale-[1.02] group-hover:brightness-105"
              referrerPolicy="no-referrer"
            />
          </div>
          <Card.Content className="space-y-4 px-1 py-5 md:py-6">
            <div className="space-y-3">
              <span className="type-mono-micro">{isLocaleAvailable ? fields.category : common.languageUnavailable}</span>

              <h3 className="public-home-grid-card-title text-[1.35rem] font-semibold leading-[1.16] tracking-[-0.025em]">
                {isLocaleAvailable ? fields.title : common.languageUnavailable}
              </h3>

              <p
                className="public-home-grid-card-copy public-home-grid-card-copy-slot type-body line-clamp-2"
                aria-hidden={!isLocaleAvailable && !fields.excerpt}
              >
                {isLocaleAvailable ? fields.excerpt || "\u00A0" : common.languageUnavailableLong}
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
