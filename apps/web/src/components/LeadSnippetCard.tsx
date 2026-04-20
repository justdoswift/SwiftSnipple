import { motion } from "motion/react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../lib/heroui";
import { resolveAssetUrl } from "../lib/asset-url";
import { getMessages } from "../lib/messages";
import { getLocalizedSnippetFields, localizePublicPath, useAppLocale } from "../lib/locale";
import { isSnippetLocaleAvailable } from "../lib/snippet-localization";
import type { Snippet } from "../types";

interface LeadSnippetCardProps {
  snippet: Snippet;
}

function formatPublishedDate(value: string | null, locale: "en" | "zh") {
  if (!value) return null;

  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LeadSnippetCard({ snippet }: LeadSnippetCardProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).home;
  const common = getMessages(locale).common;
  const fields = getLocalizedSnippetFields(snippet, locale);
  const isLocaleAvailable = isSnippetLocaleAvailable(snippet, locale);
  const publishedDate = formatPublishedDate(snippet.publishedAt, locale);

  return (
    <Link
      to={localizePublicPath(`/snippets/${fields.slug}`)}
      className="public-home-lead-card group block"
      data-testid="home-lead-card"
    >
      <motion.div
        whileHover={{ scale: 1.003, y: -2 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      >
        <Card className="public-home-lead-card-shell public-surface overflow-hidden">
          <div className="public-home-lead-card-grid grid min-h-[420px] gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,42%)]">
            <Card.Content className="public-home-lead-card-copy relative flex flex-col justify-end gap-7 px-7 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className="type-mono-micro">{isLocaleAvailable ? fields.category : common.languageUnavailable}</span>
                {publishedDate ? <span className="type-mono-micro">{publishedDate}</span> : null}
                {snippet.requiresSubscription ? (
                  <span className="type-mono-micro inline-flex items-center gap-1.5">
                    <LockKeyhole size={12} />
                    {getMessages(locale).common.membersOnly}
                  </span>
                ) : null}
              </div>

              <div className="space-y-4">
                <h2 className="public-home-lead-card-title max-w-[12ch] text-[2rem] font-semibold leading-[1.04] tracking-[-0.04em] md:text-[2.75rem] lg:text-[3.2rem]">
                  {isLocaleAvailable ? fields.title : common.languageUnavailable}
                </h2>
                <p
                  className="public-home-lead-card-excerpt type-body max-w-[58ch] text-[1rem] leading-[1.65] md:text-[1.125rem]"
                  aria-hidden={!isLocaleAvailable && !fields.excerpt}
                >
                  {isLocaleAvailable ? fields.excerpt || "\u00A0" : common.languageUnavailableLong}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <span className="public-home-lead-card-cta inline-flex items-center gap-3">
                  <span className="public-home-lead-card-cta-icon inline-flex h-12 w-12 items-center justify-center rounded-full">
                    <ArrowRight size={22} strokeWidth={2.1} />
                  </span>
                  <span className="type-mono-label text-[0.875rem]">{copy.readLatest}</span>
                </span>
              </div>
            </Card.Content>

            <div className="public-home-lead-card-media relative min-h-[280px] overflow-hidden lg:min-h-full">
              <img
                src={resolveAssetUrl(snippet.coverImage)}
                alt={fields.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                referrerPolicy="no-referrer"
              />
              <div className="public-home-lead-card-image-overlay absolute inset-0" />
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
