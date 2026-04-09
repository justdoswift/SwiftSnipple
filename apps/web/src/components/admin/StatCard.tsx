interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
}

export default function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className="border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/40">{label}</p>
      <p className="mt-5 text-4xl md:text-5xl font-black tracking-tighter">{value}</p>
      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{note}</p>
    </div>
  );
}
