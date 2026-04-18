import { motion } from "motion/react";
import { Card, Chip } from "../lib/heroui";
import { Link } from "react-router-dom";
import { Snippet } from "../types";
import { getLocalizedSnippetFields, useAppLocale } from "../lib/locale";

interface SnippetCardProps {
  snippet: Snippet;
  key?: string;
}

function formatPublishedDate(value: string | null, locale: "en" | "zh") {
  if (!value) return null;

  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SnippetCard({ snippet }: SnippetCardProps) {
  const { locale } = useAppLocale();
  const fields = getLocalizedSnippetFields(snippet, locale);
  const publishedDate = formatPublishedDate(snippet.publishedAt, locale);

  return (
    <Link to={`/${locale}/snippets/${fields.slug}`} className="public-snippet-card group block">
      <motion.div 
        whileHover={{ scale: 1.01, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="public-surface overflow-hidden">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={snippet.coverImage}
              alt={fields.title}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
              referrerPolicy="no-referrer"
            />
            <div className="public-snippet-card-overlay absolute inset-0 opacity-60" />
          </div>
          <Card.Content className="space-y-4 px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="flat" className="public-chip type-action">
                {fields.category}
              </Chip>
            </div>
            <div className="space-y-2">
              <h3 className="public-snippet-card-title type-card-title">{fields.title}</h3>
              {publishedDate ? (
                <p className="type-mono-micro text-[var(--public-micro)]">{publishedDate}</p>
              ) : null}
              <p
                className="public-snippet-card-copy public-snippet-card-copy-slot type-body-sm line-clamp-2"
                aria-hidden={!fields.excerpt}
              >
                {fields.excerpt || "\u00A0"}
              </p>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </Link>
  );
}
