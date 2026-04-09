import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarkdownPreview from "../components/admin/MarkdownPreview";
import { getArticleBySlug } from "../services/articles";
import { Article } from "../types";

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setIsLoading(true);
    getArticleBySlug(slug)
      .then((value) => {
        if (!active) return;
        setArticle(value);
        setError("");
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return <div className="pt-32 pb-20 px-8 max-w-[1440px] mx-auto">Loading article...</div>;
  }

  if (!article || error) {
    return (
      <div className="pt-32 pb-20 px-8 max-w-[1440px] mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
        <p className="text-primary/60 mb-6">{error || "The requested article could not be loaded."}</p>
        <a href="/#archive-index" className="text-primary underline">Back to homepage archive</a>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-8 max-w-[1440px] mx-auto">
      <header className="grid grid-cols-12 mb-16">
        <div className="col-span-12 md:col-start-4 md:col-span-8">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40 mb-4">
            {article.category} / Published {formatDate(article.publishedAt)}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-primary leading-none"
          >
            {article.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-on-surface-variant max-w-2xl leading-relaxed"
          >
            {article.excerpt}
          </motion.p>
        </div>
      </header>

      <section className="mb-20">
        <div className="aspect-[21/9] overflow-hidden bg-surface-dim">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-12">
        <aside className="col-span-12 md:col-span-3">
          <div className="space-y-8 border-t border-outline-variant/15 pt-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Category</p>
              <p className="font-semibold">{article.category}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Status</p>
              <p className="font-semibold">{article.status}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Updated</p>
              <p className="font-semibold">{formatDate(article.updatedAt)}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="bg-surface-container-low px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/60">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <article className="col-span-12 md:col-span-8 md:col-start-5">
          <div className="prose prose-neutral max-w-none">
            <MarkdownPreview content={article.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
