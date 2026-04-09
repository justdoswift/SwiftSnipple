import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Snippet } from "../types";

interface SnippetCardProps {
  snippet: Snippet;
  key?: string;
}

export default function SnippetCard({ snippet }: SnippetCardProps) {
  return (
    <Link to={`/snippets/${snippet.slug}`} className="group block">
      <motion.div whileHover={{ scale: 1.02 }} className="aspect-[16/10] overflow-hidden bg-surface-dim mb-6">
        <img
          src={snippet.coverImage}
          alt={snippet.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60">
          {snippet.category} / {snippet.status}
        </span>
        <h3 className="text-2xl font-bold tracking-tight">{snippet.title}</h3>
        <p className="text-on-surface-variant line-clamp-3 leading-relaxed">{snippet.excerpt}</p>
      </div>
    </Link>
  );
}
