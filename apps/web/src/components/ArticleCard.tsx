import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Article } from "../types";

interface ArticleCardProps {
  article: Article;
  key?: string;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.slug}`} className="group block">
      <motion.div whileHover={{ scale: 1.02 }} className="aspect-[16/10] overflow-hidden bg-surface-dim mb-6">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60">
          {article.category} / {article.status}
        </span>
        <h3 className="text-2xl font-bold tracking-tight">{article.title}</h3>
        <p className="text-on-surface-variant line-clamp-3 leading-relaxed">{article.excerpt}</p>
      </div>
    </Link>
  );
}
