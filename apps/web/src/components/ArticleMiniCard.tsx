import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Article } from "../types";

interface ArticleMiniCardProps {
  article: Article;
  key?: string;
}

export default function ArticleMiniCard({ article }: ArticleMiniCardProps) {
  return (
    <Link to={`/articles/${article.slug}`} className="group block cursor-pointer">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="aspect-square bg-surface-container-low overflow-hidden mb-4 border border-outline-variant/10"
      >
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-primary/60">{article.category}</span>
      <h4 className="font-bold mt-1 text-sm">{article.title}</h4>
    </Link>
  );
}
