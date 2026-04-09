import { Link } from "react-router-dom";
import { CaseStudy } from "../types";
import { motion } from "motion/react";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  key?: string;
}

export default function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  if (caseStudy.featured) {
    return (
      <Link to={`/case-study/${caseStudy.id}`} className="md:col-span-2 group block">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="aspect-[21/9] overflow-hidden bg-surface-dim mb-6"
        >
          <img 
            src={caseStudy.image} 
            alt={caseStudy.title}
            className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <span className="font-mono text-xs uppercase tracking-widest text-primary/60 font-bold">Featured / 01</span>
          </div>
          <div className="md:col-span-9">
            <h2 className="text-4xl font-bold tracking-tight mb-2">{caseStudy.title}</h2>
            <div className="flex gap-4 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest bg-surface-container-low px-2 py-0.5">{caseStudy.difficulty} Difficulty</span>
              {caseStudy.techniques.slice(0, 1).map(t => (
                <span key={t} className="font-mono text-[10px] uppercase tracking-widest bg-surface-container-low px-2 py-0.5">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/case-study/${caseStudy.id}`} className="group block">
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="aspect-video overflow-hidden bg-surface-dim mb-6"
      >
        <img 
          src={caseStudy.image} 
          alt={caseStudy.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <div className="space-y-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60">{caseStudy.category} / {caseStudy.fidelity} Fidelity</span>
        <h3 className="text-2xl font-bold tracking-tight">{caseStudy.title}</h3>
        <p className="text-on-surface-variant line-clamp-2 leading-relaxed">{caseStudy.description}</p>
      </div>
    </Link>
  );
}
