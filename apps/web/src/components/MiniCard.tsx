import { MiniCaseStudy } from "../types";
import { motion } from "motion/react";

interface MiniCardProps {
  caseStudy: MiniCaseStudy;
  key?: string;
}

export default function MiniCard({ caseStudy }: MiniCardProps) {
  return (
    <div className="group cursor-pointer">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="aspect-square bg-surface-container-low overflow-hidden mb-4 border border-outline-variant/10"
      >
        <img 
          src={caseStudy.image} 
          alt={caseStudy.title}
          className="w-full h-full object-cover transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-primary/60">{caseStudy.category}</span>
      <h4 className="font-bold mt-1 text-sm">{caseStudy.title}</h4>
    </div>
  );
}
