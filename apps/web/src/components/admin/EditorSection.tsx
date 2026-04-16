import { ReactNode } from "react";
import { Card } from "../../lib/heroui";

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
    <Card className="rounded-[28px]">
      <Card.Header className="border-b border-white/55 px-6 py-5 md:px-8">
        <div>
          <p className="type-mono-micro text-primary/40">{eyebrow}</p>
          <h2 className="type-section-title mt-3 text-[1.75rem] md:text-[2.125rem]">{title}</h2>
          <p className="type-body-sm mt-2 max-w-2xl">{description}</p>
        </div>
      </Card.Header>
      <Card.Content className="px-6 py-6 md:px-8">{children}</Card.Content>
    </Card>
  );
}
