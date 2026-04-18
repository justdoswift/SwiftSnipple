import { motion } from "motion/react";
import { Card, Chip } from "../lib/heroui";
import { Link } from "react-router-dom";
import { Snippet } from "../types";
import { getMessages } from "../lib/messages";
import { getLocalizedSnippetFields, useAppLocale } from "../lib/locale";

interface SnippetCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetCard({ snippet }: SnippetCardProps) {
  const { locale } = useAppLocale();
  const fields = getLocalizedSnippetFields(snippet, locale);
  const copy = getMessages(locale);

  return (
    <Link to={`/${locale}/snippets/${fields.slug}`} className="public-snippet-card group block">
      <motion.div 
        whileHover={{ scale: 1.01, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="public-surface overflow-hidden rounded-[24px]">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={snippet.coverImage}
              alt={fields.title}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
              referrerPolicy="no-referrer"
            />
            <div className="public-snippet-card-overlay absolute inset-0 opacity-60" />
            <div className="absolute top-4 right-4 flex gap-2">
              <Chip
                size="sm"
                radius="full"
                variant={snippet.status === "Published" ? "solid" : "flat"}
                color={snippet.status === "Published" ? "primary" : "default"}
                className={snippet.status === "Published" ? "public-chip-strong type-action" : "public-chip type-action"}
              >
                {copy.common.statuses[snippet.status]}
              </Chip>
            </div>
          </div>
          <Card.Content className="space-y-4 px-6 py-7">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" radius="full" variant="flat" className="public-chip type-action">
                {fields.category}
              </Chip>
            </div>
            <div className="space-y-2">
              <h3 className="public-snippet-card-title type-card-title font-bold">{fields.title}</h3>
              <p className="public-snippet-card-copy type-body-sm line-clamp-2">{fields.excerpt}</p>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </Link>
  );
}
