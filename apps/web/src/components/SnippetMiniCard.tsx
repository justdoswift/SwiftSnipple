import { motion } from "motion/react";
import { Card, Chip } from "../lib/heroui";
import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../lib/asset-url";
import { Snippet } from "../types";
import { getMessages } from "../lib/messages";
import { getLocalizedSnippetFields, localizePublicPath, useAppLocale } from "../lib/locale";
import { LockKeyhole } from "lucide-react";
import { resolveSnippetCoverImage } from "../lib/snippet-cover";
import { usePublicTheme } from "../lib/public-theme";

interface SnippetMiniCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetMiniCard({ snippet }: SnippetMiniCardProps) {
  const { locale } = useAppLocale();
  const theme = usePublicTheme();
  const common = getMessages(locale).common;
  const fields = getLocalizedSnippetFields(snippet, locale);
  const coverImageUrl = resolveAssetUrl(resolveSnippetCoverImage(snippet, theme));

  return (
    <Link to={localizePublicPath(`/snippets/${fields.slug}`)} className="public-snippet-mini-card group block cursor-pointer">
      <motion.div 
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
          <Card className="public-snippet-mini-card-shell vibe-glass overflow-hidden transition-colors">
          <div className="snippet-cover-frame public-snippet-mini-card-media overflow-hidden">
            <img
              src={coverImageUrl}
              alt={fields.title}
              className="snippet-cover-image opacity-80 transition-all duration-500 group-hover:scale-[1.02] group-hover:opacity-100 group-hover:brightness-110"
              referrerPolicy="no-referrer"
            />
          </div>
            <Card.Content className="space-y-3 px-4 py-4 md:px-5 md:py-5">
              <div className="flex flex-wrap gap-2">
                <Chip size="sm" variant="flat" className="public-chip type-action w-fit">
                  {fields.category}
                </Chip>
                {snippet.requiresSubscription ? (
                  <Chip size="sm" variant="flat" className="public-chip type-action w-fit">
                    <LockKeyhole size={12} className="mr-1" />
                    {common.membersOnly}
                  </Chip>
                ) : null}
              </div>
            <h4 className="public-snippet-mini-card-title type-card-title">{fields.title}</h4>
            </Card.Content>
          </Card>
      </motion.div>
    </Link>
  );
}
