import { motion } from "motion/react";
import { Card, Chip } from "../lib/heroui";
import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../lib/asset-url";
import { Snippet } from "../types";
import { getLocalizedSnippetFields, localizePublicPath, useAppLocale } from "../lib/locale";

interface SnippetMiniCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetMiniCard({ snippet }: SnippetMiniCardProps) {
  const { locale } = useAppLocale();
  const fields = getLocalizedSnippetFields(snippet, locale);

  return (
    <Link to={localizePublicPath(`/snippets/${fields.slug}`)} className="public-snippet-mini-card group block cursor-pointer">
      <motion.div 
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
          <Card className="public-snippet-mini-card-shell vibe-glass overflow-hidden transition-colors">
          <div className="public-snippet-mini-card-media aspect-square overflow-hidden">
            <img
              src={resolveAssetUrl(snippet.coverImage)}
              alt={fields.title}
              className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-[1.05] group-hover:opacity-100 group-hover:brightness-110"
              referrerPolicy="no-referrer"
            />
          </div>
            <Card.Content className="space-y-3 px-4 py-4 md:px-5 md:py-5">
              <Chip size="sm" variant="flat" className="public-chip type-action w-fit">
                {fields.category}
              </Chip>
            <h4 className="public-snippet-mini-card-title type-card-title">{fields.title}</h4>
            </Card.Content>
          </Card>
      </motion.div>
    </Link>
  );
}
