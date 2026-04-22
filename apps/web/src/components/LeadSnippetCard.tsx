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
  const coverImageUrl = resolveAssetUrl(snippet.coverImage);

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
        <Card className="public-home-lead-card-shell public-surface overflow-hidden" data-testid="home-lead-card-shell">
          <div className="public-home-lead-card-grid relative min-h-[420px] overflow-hidden md:min-h-[500px]">
            <div className="public-home-lead-card-media absolute inset-0" data-testid="home-lead-card-media">
              <img
                src={coverImageUrl}
                alt={fields.title}
                className="public-home-lead-card-media-image h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="public-home-lead-card-image-overlay absolute inset-0" />
            <div className="public-home-lead-card-image-vignette absolute inset-0" />

            <Card.Content className="public-home-lead-card-copy relative z-[1] flex min-h-[420px] flex-col justify-end px-7 py-8 md:min-h-[500px] md:px-10 md:py-10 lg:px-12 lg:py-12">
              <div className="public-home-lead-card-copy-inner max-w-[680px] space-y-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
                  <h2 className="public-home-lead-card-title max-w-[11ch] text-[2.4rem] font-semibold leading-[0.98] tracking-[-0.05em] md:text-[3.2rem] lg:text-[4rem]">
                    {isLocaleAvailable ? fields.title : common.languageUnavailable}
                  </h2>
                  <p
                    className="public-home-lead-card-excerpt type-body max-w-[56ch] text-[0.98rem] leading-[1.7] md:text-[1.08rem]"
                    aria-hidden={!isLocaleAvailable && !fields.excerpt}
                  >
                    {isLocaleAvailable ? fields.excerpt || "\u00A0" : common.languageUnavailableLong}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <span className="public-home-lead-card-cta inline-flex items-center gap-3">
                    <span className="public-home-lead-card-cta-icon inline-flex h-11 w-11 items-center justify-center rounded-full">
                      <ArrowRight size={20} strokeWidth={2.1} />
                    </span>
                    <span className="type-mono-label text-[0.85rem]">{copy.readLatest}</span>
                  </span>
                </div>
              </div>
            </Card.Content>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
