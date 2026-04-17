import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Button, Card, Chip, Input } from "../lib/heroui";
import SnippetCard from "../components/SnippetCard";
import SnippetMiniCard from "../components/SnippetMiniCard";
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
      className="mx-auto max-w-[1380px] px-6 pb-24 pt-44 md:px-10 md:pt-56"
    >
      {/* Hero Section */}
      <section className="mb-32">
        <div className="mx-auto max-w-[900px] text-center">
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
            <span className="type-mono-label px-3 py-1 border border-white/10 rounded-full bg-white/5">
              Just Do Swift v1.0
            </span>
            <h1 className="type-display max-w-[14ch] text-white">
              Exceptional Builds. Native SwiftUI.
            </h1>
            <p className="type-body-lg mx-auto max-w-[620px] text-white/50">
              Discover a curated library of premium SwiftUI implementations, deconstructed for clarity and rebuilt for high-performance Apple ecosystem workflows.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <Button
                className="type-action h-12 px-8 bg-white text-black hover:bg-white/90"
                radius="full"
                onPress={() => {
                  const el = document.getElementById("library-index");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore Lab
              </Button>
              <Chip radius="full" variant="flat" className="public-chip h-12 px-6 type-action">
                {publishedSnippets.length} LIVE OBJECTS
              </Chip>
            </div>
          </motion.div>
          {error ? <p className="type-body-sm mt-8 text-red-500 font-mono italic">{error}</p> : null}
        </div>
      </section>

      {/* Library Grid */}
      <section id="library-index" className="mb-32">
        <motion.div variants={itemVariants} className="mb-12 flex items-end justify-between">
          <div>
            <h4 className="type-mono-micro text-white/20 mb-2">Featured Collection</h4>
            <h2 className="type-section-title text-white">The Essentials</h2>
          </div>
          <p className="type-mono-micro text-white/20 hidden md:block">001 — 004 / 0{publishedSnippets.length}</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {featuredSnippets.map((snippet) => (
            <motion.div key={snippet.id} variants={itemVariants}>
              <SnippetCard snippet={snippet} />
            </motion.div>
          ))}
        </div>
        {isLoading ? <p className="type-mono-micro mt-12 text-white/30 text-center animate-pulse">Accessing Data Stores...</p> : null}
        {!isLoading && !error && !featuredSnippets.length ? (
          <motion.div variants={itemVariants}>
            <Card className="vibe-glass mt-12 rounded-[32px] border-dashed border-white/10">
              <Card.Content className="px-10 py-20 text-center">
                <span className="type-mono-micro text-white/20">System Status</span>
                <h2 className="type-section-title mt-6 text-white/90">No live objects detected</h2>
                <p className="type-body-sm mt-4 text-white/40 max-w-md mx-auto">
                  The lab is currently empty. Connect the publishing engine to sync native SwiftUI snippet records.
                </p>
              </Card.Content>
            </Card>
          </motion.div>
        ) : null}
      </section>

      {/* Methodology Section */}
      <section className="mb-32 pt-24 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={itemVariants}>
            <span className="type-mono-label text-white/20 block mb-6">Execution Log</span>
            <h2 className="type-section-title mb-8 text-white leading-tight">
              Deconstructing Design <br/>Into Native Code.
            </h2>
            <div className="type-body space-y-8 text-white/40">
              <p>We don't believe in abstractions. Just Do Swift focuses on the raw, native SwiftUI primitives that drive modern interactive experiences. Every pixel has a purpose, and every component has a prompt.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="type-mono-micro text-white/60">01. ANALYSIS</span>
                  <p className="type-body-sm">Deconstructing high-end motion and layout intent.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="type-mono-micro text-white/60">02. TRANSLATION</span>
                  <p className="type-body-sm">Mapping creative vision to performant Swift code.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="vibe-glass p-2 rounded-[32px] border-white/10 group">
            <div className="aspect-[4/3] rounded-[26px] overflow-hidden relative">
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="type-mono-micro text-white/20 group-hover:text-white/40 transition-colors">Visual Analysis Preview</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Additions */}
      <section id="latest-additions" className="mb-32 border-t border-white/5 pt-24">
        <motion.div variants={itemVariants} className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h4 className="type-mono-micro text-white/20 mb-2">Technical Index</h4>
            <h2 className="type-section-title text-white">Latest Lab Records</h2>
          </div>
          <Button
            className="type-action h-10 border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            radius="full"
            variant="bordered"
            onPress={() => {
              window.location.hash = "library-index";
            }}
          >
            Full Catalog
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
        <div className="vibe-glass mx-auto max-w-[1080px] rounded-[40px] border-white/10">
          <div className="flex flex-col items-center px-8 py-16 text-center md:px-20 md:py-24">
            <span className="type-mono-label mb-8 text-white/20">Updates Shell</span>
            <h2 className="type-page-title mb-8 text-white tracking-tight">Sync the latest builds.</h2>
            <p className="type-body mb-12 max-w-lg text-white/40">
              Get raw SwiftUI snippets, prompt logic, and implementation logs delivered directly to your inbox. No noise, just native craft.
            </p>
            <div className="flex w-full max-w-md flex-col gap-4 md:flex-row">
              <Input
                aria-label="Email"
                className="public-input-inverse flex-grow"
                placeholder="ADDRESS@DOMAIN.COM" 
                type="email"
              />
              <Button className="type-action h-12 px-10 bg-white text-black font-bold" radius="full" variant="solid">
                JOIN
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
