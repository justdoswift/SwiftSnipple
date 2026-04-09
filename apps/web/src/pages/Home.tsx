import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import SnippetCard from "../components/SnippetCard";
import SnippetMiniCard from "../components/SnippetMiniCard";
import { getSnippets } from "../services/snippets";
import { Snippet } from "../types";

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
    <div className="pt-32 pb-20 max-w-[1440px] mx-auto px-8">
      {/* Hero Section */}
      <section className="mb-24 md:grid md:grid-cols-12">
        <div className="md:col-start-4 md:col-span-9">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[3.5rem] md:text-[5.5rem] font-black tracking-tighter leading-[0.9] text-primary mb-6"
          >
            Rebuilt in SwiftUI.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl text-on-surface-variant font-medium tracking-tight mb-4"
          >
            Exceptional UI, rebuilt for real SwiftUI workflows.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-primary/60 leading-relaxed max-w-xl"
          >
            Discover fun and useful SwiftUI builds, grab implementation ideas quickly, and reuse the prompts behind the craft. A curated snippet library for the modern Apple ecosystem.
          </motion.p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      </section>

      {/* Library Intro */}
      <section className="mb-16 border-t border-b border-outline-variant/15 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mr-4">Published Snippets</span>
            <span className="bg-primary text-white px-4 py-1.5 font-mono text-xs uppercase tracking-widest">
              {publishedSnippets.length} Live
            </span>
            {Array.from(new Set(publishedSnippets.map((snippet) => snippet.category))).slice(0, 5).map((category) => (
              <span key={category} className="bg-surface-container-low text-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest">
                {category}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40">
              Public content is driven by the same snippet records managed in the publishing console.
            </span>
          </div>
        </div>
      </section>

      {/* Library Grid */}
      <section id="library-index" className="mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {featuredSnippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
        {isLoading ? <p className="mt-8 text-sm text-primary/50">Loading published snippets...</p> : null}
        {!isLoading && !error && !featuredSnippets.length ? (
          <div className="mt-8 border border-dashed border-outline-variant/20 bg-surface-container-lowest px-6 py-12 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/35">No published snippets</p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">The public library is still warming up</h2>
            <p className="mt-3 text-sm text-on-surface-variant">
              Publish the first snippet from the admin console and it will appear here automatically.
            </p>
          </div>
        ) : null}
      </section>

      {/* Methodology Section */}
      <section className="mb-32 bg-surface-container-low p-12 md:p-24 md:grid md:grid-cols-12 gap-8">
        <div className="md:col-start-2 md:col-span-3">
          <h4 className="font-mono text-sm uppercase tracking-[0.3em] text-primary/40 mb-6">Process</h4>
        </div>
        <div className="md:col-span-7">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">The Lab Methodology</h2>
          <div className="space-y-6 text-lg text-on-surface-variant leading-relaxed">
            <p>We don't just copy UI. We deconstruct the physics of high-end design to understand the intent behind every pixel, then translate that intent into performant, native SwiftUI code.</p>
            <p>Every featured snippet can include the original design reference, a short technical breakdown, and the prompts used to bridge the gap between creative vision and technical execution.</p>
          </div>
        </div>
      </section>

      {/* Latest Additions */}
      <section id="latest-additions" className="mb-32">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Latest Additions</h2>
            <p className="text-primary/40">Recent additions to the SwiftUI snippet library.</p>
          </div>
          <a href="/#library-index" className="font-mono text-xs font-bold uppercase tracking-widest border-b border-primary pb-1">Jump to Library</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {latestSnippets.map((snippet) => (
            <SnippetMiniCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
        {!isLoading && !error && !latestSnippets.length ? (
          <p className="mt-8 text-sm text-on-surface-variant">Freshly published snippets will show up here as the library grows.</p>
        ) : null}
      </section>

      {/* Subscribe Section */}
      <section className="bg-primary text-white p-12 md:p-24 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Follow New Snippets</h2>
        <p className="text-white/60 max-w-lg mb-10 leading-relaxed">Get fresh SwiftUI snippets, prompt ideas, and implementation notes as the library grows. No noise, just useful builds.</p>
        <div className="w-full max-w-md flex flex-col md:flex-row gap-4">
          <input 
            className="bg-primary-container border-b-2 border-white/20 text-white px-4 py-3 flex-grow focus:outline-none focus:border-white transition-colors" 
            placeholder="email@example.com" 
            type="email"
          />
          <button className="bg-white text-primary px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-surface transition-colors">Join</button>
        </div>
      </section>
    </div>
  );
}
