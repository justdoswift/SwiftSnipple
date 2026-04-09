import { ReactNode } from "react";

interface EditorSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function EditorSection({
  eyebrow,
  title,
  description,
  children,
}: EditorSectionProps) {
  return (
    <section className="border border-outline-variant/15 bg-surface-container-lowest">
      <div className="border-b border-outline-variant/10 px-6 py-5 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{description}</p>
      </div>
      <div className="px-6 py-6 md:px-8">{children}</div>
    </section>
  );
}
