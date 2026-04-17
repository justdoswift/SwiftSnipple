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
    <section className="admin-section-card overflow-hidden border">
      <div className="px-6 pt-6 pb-4 md:px-8">
        <div>
          <p className="admin-label">{eyebrow}</p>
          <h2 className="admin-section-title mt-2">{title}</h2>
          <p className="admin-section-description max-w-2xl">{description}</p>
        </div>
      </div>
      <div className="px-6 py-6 md:px-8">{children}</div>
    </section>
  );
}
