import { INITIAL_ARTICLES } from "../data/articles";
import { Article } from "../types";

const STORAGE_KEY = "rebuilt-in-swiftui.admin.articles";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneArticles(articles: Article[]) {
  return articles.map((article) => ({ ...article, tags: [...article.tags] }));
}

function readArticles() {
  if (!canUseStorage()) {
    return cloneArticles(INITIAL_ARTICLES);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = cloneArticles(INITIAL_ARTICLES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(stored) as Article[];
    return parsed.length ? parsed : cloneArticles(INITIAL_ARTICLES);
  } catch {
    return cloneArticles(INITIAL_ARTICLES);
  }
}

function writeArticles(articles: Article[]) {
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  }
}

export function getArticles() {
  return readArticles().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getArticleById(id: string) {
  return getArticles().find((article) => article.id === id) ?? null;
}

export function saveArticle(article: Article) {
  const articles = getArticles();
  const nextArticles = articles.some((entry) => entry.id === article.id)
    ? articles.map((entry) => (entry.id === article.id ? article : entry))
    : [article, ...articles];

  writeArticles(nextArticles);
  return article;
}

export function publishArticle(id: string) {
  const article = getArticleById(id);
  if (!article) {
    return null;
  }

  const publishedArticle: Article = {
    ...article,
    status: "Published",
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  saveArticle(publishedArticle);
  return publishedArticle;
}
