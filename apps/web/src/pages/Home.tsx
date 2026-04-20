import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Button, Card, Chip } from "../lib/heroui";
import LeadSnippetCard from "../components/LeadSnippetCard";
import SnippetGridCard from "../components/SnippetGridCard";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import { getSnippets } from "../services/snippets";
import type { Snippet } from "../types";

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
    () =>
      snippets
        .filter((snippet) => snippet.status === "Published")
        .sort((left, right) => {
          const leftTime = new Date(left.publishedAt ?? left.updatedAt).getTime();
          const rightTime = new Date(right.publishedAt ?? right.updatedAt).getTime();
          return rightTime - leftTime;
        }),
    [snippets],
  );
  const leadSnippet = publishedSnippets[0] ?? null;
  const gridSnippets = leadSnippet ? publishedSnippets.slice(1) : [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="public-page public-home pb-24"
    >
      <section
        data-testid="home-hero"
        className="flex min-h-screen items-center px-8 pb-16 pt-32 md:px-12 md:pb-20 md:pt-36 lg:px-16 lg:pb-24 lg:pt-40"
      >
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mx-auto w-full max-w-[1240px] text-center">
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
        </div>
      </section>

      <section id="library-index" className="mx-auto mb-24 max-w-[1400px] px-8 md:px-12 lg:mb-28 lg:px-16">
        {isLoading ? <p className="type-mono-micro mt-12 text-center animate-pulse">{copy.accessingDataStores}</p> : null}
        {!isLoading && !error && !leadSnippet ? (
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

        {leadSnippet ? (
          <>
            <motion.div variants={itemVariants} className="mb-14 md:mb-16">
              <div className="mb-5 space-y-2 md:mb-6">
                <h4 className="type-mono-micro">{copy.latestFeatureLabel}</h4>
                <h2 className="type-section-title">{copy.latestFeatureTitle}</h2>
              </div>
              <LeadSnippetCard snippet={leadSnippet} />
            </motion.div>

            {gridSnippets.length ? (
              <motion.div variants={itemVariants} className="public-divider-top pt-14 md:pt-16">
                <div className="mb-10 space-y-2 md:mb-12">
                  <h4 className="type-mono-micro">{copy.libraryLabel}</h4>
                  <h2 className="type-section-title">{copy.libraryTitle}</h2>
                </div>
                <div data-testid="home-grid" className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
                  {gridSnippets.map((snippet) => (
                    <motion.div key={snippet.id} variants={itemVariants}>
                      <SnippetGridCard snippet={snippet} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </>
        ) : null}
      </section>

      <motion.div variants={itemVariants}>
        <div className="public-surface mx-auto max-w-[1080px] px-0">
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
