import { motion } from "motion/react";
import { Card, Chip } from "../lib/heroui";
import { Link } from "react-router-dom";
import { Snippet } from "../types";

interface SnippetMiniCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetMiniCard({ snippet }: SnippetMiniCardProps) {
  return (
    <Link to={`/snippets/${snippet.slug}`} className="public-snippet-mini-card group block cursor-pointer">
      <motion.div 
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        <Card className="public-snippet-mini-card-shell vibe-glass overflow-hidden rounded-[20px] transition-colors">
          <div className="public-snippet-mini-card-media aspect-square overflow-hidden">
            <img
              src={snippet.coverImage}
              alt={snippet.title}
              className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-[1.05] group-hover:opacity-100 group-hover:brightness-110"
              referrerPolicy="no-referrer"
            />
          </div>
          <Card.Content className="space-y-3 px-4 py-5">
            <Chip size="sm" radius="full" variant="flat" className="public-chip type-action w-fit">
              {snippet.category}
            </Chip>
            <h4 className="public-snippet-mini-card-title type-card-title text-[0.95rem] font-bold">{snippet.title}</h4>
          </Card.Content>
        </Card>
      </motion.div>
    </Link>
  );
}
