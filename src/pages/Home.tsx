import { CASE_STUDIES, LATEST_ADDITIONS } from "../constants";
import CaseStudyCard from "../components/CaseStudyCard";
import MiniCard from "../components/MiniCard";
import { motion } from "motion/react";

export default function Home() {
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
            Discover great design, rebuild it in SwiftUI, study code and prompts. A curated engineering journal for the modern Apple ecosystem.
          </motion.p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="mb-16 border-t border-b border-outline-variant/15 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mr-4">Categories</span>
            <button className="bg-primary text-white px-4 py-1.5 font-mono text-xs uppercase tracking-widest">All</button>
            {["Onboarding", "Cards", "Paywalls", "Dashboards", "Settings", "Charts"].map(cat => (
              <button key={cat} className="bg-surface-container-low text-primary px-4 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-surface-dim transition-colors">
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {["Platform", "Animation", "Complexity", "Interaction"].map(filter => (
              <div key={filter} className="flex items-center gap-2 group cursor-pointer">
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">{filter}</span>
                <svg className="w-3 h-3 text-primary/40 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {CASE_STUDIES.map(cs => (
            <CaseStudyCard key={cs.id} caseStudy={cs} />
          ))}
        </div>
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
            <p>Every case study includes the original design reference, a full technical breakdown of the implementation, and the exact prompts used to bridge the gap between creative vision and technical execution.</p>
          </div>
        </div>
      </section>

      {/* Latest Additions */}
      <section className="mb-32">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Latest Additions</h2>
            <p className="text-primary/40">Recent entries to the digital technical archive.</p>
          </div>
          <a href="#" className="font-mono text-xs font-bold uppercase tracking-widest border-b border-primary pb-1">View Archive</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {LATEST_ADDITIONS.map(cs => (
            <MiniCard key={cs.id} caseStudy={cs} />
          ))}
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="bg-primary text-white p-12 md:p-24 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Join the Digital Archive</h2>
        <p className="text-white/60 max-w-lg mb-10 leading-relaxed">Weekly case studies, exclusive prompts, and complete project files delivered to your inbox. No noise, just engineering.</p>
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
