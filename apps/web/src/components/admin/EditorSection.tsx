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
    <Card className="admin-section-card border overflow-hidden">
      <Card.Header className="px-6 pt-6 pb-4 md:px-8">
        <div>
          <p className="admin-label">{eyebrow}</p>
          <h2 className="admin-section-title mt-2">{title}</h2>
          <p className="admin-section-description max-w-2xl">{description}</p>
        </div>
      </Card.Header>
      <Card.Content className="px-6 py-6 md:px-8">{children}</Card.Content>
    </Card>
  );
}
