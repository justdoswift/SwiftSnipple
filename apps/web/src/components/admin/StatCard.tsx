import { Card } from "../../lib/heroui";

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
}

export default function StatCard({ label, value, note }: StatCardProps) {
  return (
    <Card className="rounded-[26px]">
      <Card.Content className="p-6 md:p-8">
        <p className="type-mono-micro text-primary/40">{label}</p>
        <p className="mt-5 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">{value}</p>
        <p className="type-body-sm mt-4">{note}</p>
      </Card.Content>
    </Card>
  );
}
