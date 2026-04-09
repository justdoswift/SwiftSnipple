import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Snippet } from "../types";

interface SnippetMiniCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetMiniCard({ snippet }: SnippetMiniCardProps) {
  return (
    <Link to={`/snippets/${snippet.slug}`} className="group block cursor-pointer">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="aspect-square bg-surface-container-low overflow-hidden mb-4 border border-outline-variant/10"
      >
        <img
          src={snippet.coverImage}
          alt={snippet.title}
          className="w-full h-full object-cover transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-primary/60">{snippet.category}</span>
      <h4 className="font-bold mt-1 text-sm">{snippet.title}</h4>
    </Link>
  );
}
