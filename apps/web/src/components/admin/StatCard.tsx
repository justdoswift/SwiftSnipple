interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
}

export default function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="admin-section-card rounded-[26px]">
      <div className="p-6 md:p-8">
        <p className="admin-empty-kicker type-mono-micro">{label}</p>
        <p className="mt-5 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">{value}</p>
        <p className="type-body-sm mt-4">{note}</p>
      </div>
    </div>
  );
}
