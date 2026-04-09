import { useParams, Link } from "react-router-dom";
import { CASE_STUDIES } from "../constants";
import { CheckCircle, Code, Terminal, Download, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function CaseStudyDetail() {
  const { id } = useParams();
  const caseStudy = CASE_STUDIES.find(cs => cs.id === id);
  const [activeTab, setActiveTab] = useState<"code" | "prompt">("code");
  const [copySuccess, setCopySuccess] = useState(false);

  if (!caseStudy) {
    return (
      <div className="pt-32 pb-20 px-8 max-w-[1440px] mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Case Study Not Found</h1>
        <Link to="/" className="text-primary underline">Go back home</Link>
      </div>
    );
  }

  const handleCopy = () => {
    const textToCopy = activeTab === "code" ? caseStudy.codeSnippet : caseStudy.prompt;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([caseStudy.codeSnippet], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${caseStudy.id}.swift`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="pt-32 pb-20 px-8 max-w-[1440px] mx-auto">
      {/* Header Section */}
      <header className="grid grid-cols-12 mb-16">
        <div className="col-span-12 md:col-start-4 md:col-span-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-primary leading-none"
          >
            {caseStudy.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-on-surface-variant max-w-2xl leading-relaxed"
          >
            {caseStudy.description}
          </motion.p>
        </div>
      </header>

      {/* Metadata Row */}
      <div className="grid grid-cols-12 mb-20 gap-8">
        <div className="col-span-12 md:col-start-4 md:col-span-9 border-t border-outline-variant/15 pt-8 grid grid-cols-2 md:grid-cols-5 gap-y-8">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Category</span>
            <span className="text-sm font-semibold">{caseStudy.category}</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Difficulty</span>
            <span className="text-sm font-semibold">{caseStudy.difficulty}</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Fidelity</span>
            <span className="text-sm font-semibold">{caseStudy.fidelity}</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Build Time</span>
            <span className="text-sm font-semibold">{caseStudy.buildTime}</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-2">Source</span>
            <a className="text-sm font-semibold underline decoration-outline-variant/50 hover:decoration-primary transition-colors" href={caseStudy.source.url}>
              {caseStudy.source.name}
            </a>
          </div>
        </div>
      </div>

      {/* Hero Comparison Area */}
      <section className="mb-32">
        <div className="flex justify-center mb-8">
          <div className="bg-surface-container-low p-1 rounded-lg flex gap-1">
            <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest bg-white shadow-sm rounded-md text-primary">Original</button>
            <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">SwiftUI</button>
            <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Diff</button>
            <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Motion</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/15 rounded-sm overflow-hidden">
          <div className="bg-surface-container-lowest p-12 aspect-[4/3] flex flex-col items-center justify-center relative group">
            <span className="absolute top-6 left-6 font-mono text-[10px] uppercase tracking-widest text-primary/20">Source: Reference Image</span>
            <img 
              className="w-full h-full object-cover rounded-xl shadow-2xl scale-[0.85] group-hover:scale-90 transition-transform duration-700" 
              src={caseStudy.image} 
              alt="Original Design"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-6 font-mono text-xs uppercase tracking-widest text-primary">Original Design</span>
          </div>
          <div className="bg-surface-container-lowest p-12 aspect-[4/3] flex flex-col items-center justify-center relative group">
            <span className="absolute top-6 right-6 font-mono text-[10px] uppercase tracking-widest text-primary/20">Build: SwiftUI v5.0</span>
            <img 
              className="w-full h-full object-cover rounded-xl shadow-2xl scale-[0.85] group-hover:scale-90 transition-transform duration-700" 
              src={caseStudy.recreationImage || caseStudy.image} 
              alt="SwiftUI Recreation"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-6 font-mono text-xs uppercase tracking-widest text-primary">SwiftUI Recreation</span>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-12 gap-16 relative">
        {/* Left Column: Implementation Notes */}
        <div className="col-span-12 md:col-start-4 md:col-span-5 flex flex-col gap-16">
          <section>
            <h2 className="text-3xl font-bold tracking-tight mb-8">Preserved Visual Details</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p>{caseStudy.processNotes}</p>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <CheckCircle className="text-primary w-5 h-5 flex-shrink-0" />
                  <span>Layer order strictly follows a Z-stack with explicit depth indices.</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle className="text-primary w-5 h-5 flex-shrink-0" />
                  <span>Multi-step Gaussian blur for realistic light scattering.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold tracking-tight mb-8">SwiftUI Simplifications</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p>{caseStudy.simplificationNotes}</p>
              <div className="bg-surface-container-low p-6 rounded-sm border-l-2 border-primary">
                <p className="font-mono text-sm italic">"By using .drawingGroup(), we managed to keep the card interactions at a stable 120FPS on iPhone 15 Pro."</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold tracking-tight mb-8">Key Decisions</h2>
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p>{caseStudy.keyDecisions}</p>
            </div>
          </section>

          {/* Techniques Pills */}
          <section className="pt-8 border-t border-outline-variant/15">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 mb-6">SwiftUI Techniques Used</h3>
            <div className="flex flex-wrap gap-2">
              {caseStudy.techniques.map(t => (
                <span key={t} className="px-4 py-2 bg-surface-container-low text-primary font-mono text-xs tracking-wider rounded-sm">
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* Reusable Pattern Notes */}
          <section className="bg-surface-container-lowest p-8 rounded-sm shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-bold mb-4">Reusable Pattern Notes</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">To implement this effect in your own project, ensure you wrap the glass container in a ViewModifier that handles the light intensity based on the system color scheme.</p>
            <code className="block font-mono text-xs p-4 bg-surface-container-low text-primary leading-5 whitespace-pre-wrap">
              {caseStudy.reusablePattern}
            </code>
          </section>
        </div>

        {/* Right Column: Sticky Side Panel */}
        <aside className="hidden lg:block col-span-3">
          <div className="sticky top-24 h-[calc(100vh-6rem)] w-80 bg-surface-container-low p-6 flex flex-col gap-4 rounded-sm">
            <div className="mb-2">
              <h4 className="font-bold text-lg">Reference</h4>
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary/40">Technical Specifications</p>
            </div>
            <div className="bg-outline-variant/10 p-1 rounded-md flex gap-1 mb-4">
              <button 
                onClick={() => setActiveTab("code")}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 rounded-md ${activeTab === "code" ? "bg-white shadow-sm text-primary" : "text-primary/40 hover:text-primary"}`}
              >
                <Code className="w-3 h-3" /> Code
              </button>
              <button 
                onClick={() => setActiveTab("prompt")}
                className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 rounded-md ${activeTab === "prompt" ? "bg-white shadow-sm text-primary" : "text-primary/40 hover:text-primary"}`}
              >
                <Terminal className="w-3 h-3" /> Prompt
              </button>
            </div>
            <div className="flex-1 bg-white p-4 rounded-sm overflow-y-auto no-scrollbar border border-outline-variant/10 relative group/code">
              <AnimatePresence mode="wait">
                <motion.pre 
                  key={activeTab}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="text-[10px] leading-relaxed font-mono text-on-surface-variant whitespace-pre-wrap"
                >
                  {activeTab === "code" ? caseStudy.codeSnippet : caseStudy.prompt}
                </motion.pre>
              </AnimatePresence>
              
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-surface-container-low hover:bg-surface-dim rounded-md transition-colors opacity-0 group-hover/code:opacity-100"
                title="Copy to clipboard"
              >
                {copySuccess ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-primary/60" />}
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleCopy}
                className="w-full py-4 bg-primary text-white font-mono text-xs uppercase tracking-widest hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copySuccess ? "Copied!" : `Copy ${activeTab === "code" ? "Code" : "Prompt"}`}
              </button>
              <button 
                onClick={handleDownload}
                className="w-full py-4 bg-surface-container-lowest border border-outline-variant/20 text-primary font-mono text-xs uppercase tracking-widest hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download .swift
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Related Case Studies */}
      <section className="mt-40">
        <h2 className="text-3xl font-bold tracking-tight mb-12">Related Case Studies</h2>
        <div className="flex gap-8 overflow-x-auto no-scrollbar pb-8">
          {CASE_STUDIES.filter(cs => cs.id !== id).map(cs => (
            <Link key={cs.id} to={`/case-study/${cs.id}`} className="min-w-[340px] bg-surface-container-lowest group cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden mb-6">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={cs.image} 
                  alt={cs.title}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="px-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40">{cs.category}</span>
                <h3 className="text-lg font-bold mt-1">{cs.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Next/Prev Navigation */}
      <nav className="mt-32 pt-12 border-t border-outline-variant/15 flex justify-between">
        <Link to="/" className="group flex flex-col items-start">
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40 mb-2">Previous Case Study</span>
          <span className="text-lg font-bold group-hover:underline">Micro-Interaction Physics</span>
        </Link>
        <Link to="/" className="group flex flex-col items-end">
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40 mb-2">Next Case Study</span>
          <span className="text-lg font-bold group-hover:underline">3D Depth Navigation</span>
        </Link>
      </nav>
    </div>
  );
}
