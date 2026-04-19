import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Button, Card, Chip } from "../lib/heroui";
import SnippetCard from "../components/SnippetCard";
import SnippetMiniCard from "../components/SnippetMiniCard";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import { getSnippets } from "../services/snippets";
import { Snippet } from "../types";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100, 
      damping: 20 
    }
  },
};

export default function Home() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).home;
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getSnippets()
      .then((items) => {
        if (!active) return;
        setSnippets(items);
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
  }, []);

  const publishedSnippets = useMemo(
    () => snippets.filter((snippet) => snippet.status === "Published"),
    [snippets],
  );
  const featuredSnippets = publishedSnippets.slice(0, 4);
  const latestSnippets = publishedSnippets.slice(0, 4);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="public-page public-home mx-auto max-w-[1400px] px-8 pb-24 pt-36 md:px-12 md:pt-40 lg:px-16 lg:pt-48"
    >
      {/* Hero Section */}
      <section className="mb-24 lg:mb-28">
        <div className="mx-auto max-w-[1240px] text-center">
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-5 md:gap-6">
            <h1 className="type-display max-w-[20ch]">
              {copy.heroTitle}
            </h1>
            <p className="type-body-lg mx-auto max-w-[760px] lg:max-w-[1200px] lg:whitespace-nowrap">
              {copy.heroBody}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                className="public-primary-button public-button-lg type-action"
                onPress={() => {
                  const el = document.getElementById("library-index");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {copy.exploreLab}
              </Button>
              <Chip variant="flat" className="public-chip public-chip-metric type-action">
                {publishedSnippets.length} {copy.liveObjects}
              </Chip>
            </div>
          </motion.div>
          {error ? <p className="type-body-sm mt-8 text-red-500 font-mono italic">{error}</p> : null}
        </div>
      </section>

      {/* Library Grid */}
      <section id="library-index" className="mb-24 lg:mb-28">
        <motion.div variants={itemVariants} className="mb-10 flex items-end justify-between md:mb-12">
          <div>
            <h4 className="type-mono-micro mb-2">{copy.featuredCollection}</h4>
            <h2 className="type-section-title">{copy.essentials}</h2>
          </div>
          <p className="type-mono-micro hidden md:block">001 — 004 / 0{publishedSnippets.length}</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {featuredSnippets.map((snippet) => (
            <motion.div key={snippet.id} variants={itemVariants}>
              <SnippetCard snippet={snippet} />
            </motion.div>
          ))}
        </div>
        {isLoading ? <p className="type-mono-micro mt-12 text-center animate-pulse">{copy.accessingDataStores}</p> : null}
        {!isLoading && !error && !featuredSnippets.length ? (
          <motion.div variants={itemVariants}>
            <Card className="public-surface mt-12 border-dashed">
              <Card.Content className="px-8 py-14 text-center md:px-10 md:py-16">
                <span className="type-mono-micro">{copy.systemStatus}</span>
                <h2 className="type-section-title mt-5">{copy.noLiveObjects}</h2>
                <p className="type-body-sm mt-3 mx-auto max-w-md">
                  {copy.noLiveObjectsCopy}
                </p>
              </Card.Content>
            </Card>
          </motion.div>
        ) : null}
      </section>

      {/* Latest Additions */}
      <section id="latest-additions" className="public-divider-top mb-24 pt-16 md:pt-20 lg:mb-28 lg:pt-24">
        <motion.div variants={itemVariants} className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6 md:mb-12">
          <div>
            <h4 className="type-mono-micro mb-2">{copy.technicalIndex}</h4>
            <h2 className="type-section-title">{copy.latestLabRecords}</h2>
          </div>
          <Button
            className="public-secondary-button public-button-md type-action"
            variant="bordered"
            onPress={() => {
              window.location.hash = "library-index";
            }}
          >
            {copy.fullCatalog}
          </Button>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latestSnippets.map((snippet) => (
            <motion.div key={snippet.id} variants={itemVariants}>
              <SnippetMiniCard snippet={snippet} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subscribe Section */}
      <motion.div variants={itemVariants}>
        <div className="public-surface mx-auto max-w-[1080px]">
          <div className="flex flex-col items-center px-8 py-14 text-center md:px-16 md:py-20 lg:px-20 lg:py-24">
            <span className="type-mono-label mb-6">{copy.updatesShell}</span>
            <h2 className="type-page-title mb-6">{copy.syncLatestBuilds}</h2>
            <p className="type-body mb-10 max-w-lg md:mb-12">
              {copy.updatesCopy}
            </p>
            <div className="flex w-full max-w-md flex-col gap-4 md:flex-row">
              <Button
                className="public-primary-button public-button-lg type-action w-full"
                variant="solid"
                onPress={() => {
                  window.location.href = localizePublicPath("/login");
                }}
              >
                {copy.join}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
