import { motion } from "motion/react";
import { Card, Chip } from "../lib/heroui";
import { Link } from "react-router-dom";
import { Snippet } from "../types";

interface SnippetCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetCard({ snippet }: SnippetCardProps) {
  return (
    <Link to={`/snippets/${snippet.slug}`} className="group block">
      <motion.div 
        whileHover={{ scale: 1.01, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className="public-surface overflow-hidden rounded-[24px]">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={snippet.coverImage}
              alt={snippet.title}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
            <div className="absolute top-4 right-4 flex gap-2">
              <Chip
                size="sm"
                radius="full"
                variant={snippet.status === "Published" ? "solid" : "flat"}
                color={snippet.status === "Published" ? "primary" : "default"}
                className={snippet.status === "Published" ? "public-chip-strong type-action" : "public-chip type-action"}
              >
                {snippet.status}
              </Chip>
            </div>
          </div>
          <Card.Content className="space-y-4 px-6 py-7">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" radius="full" variant="flat" className="public-chip type-action border-white/10">
                {snippet.category}
              </Chip>
            </div>
            <div className="space-y-2">
              <h3 className="type-card-title font-bold text-white group-hover:text-white/90">{snippet.title}</h3>
              <p className="type-body-sm line-clamp-2 text-white/40 group-hover:text-white/50">{snippet.excerpt}</p>
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </Link>
  );
}
