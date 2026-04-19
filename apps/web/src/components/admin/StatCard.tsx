interface StatCardProps {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="admin-section-card">
      <div className="p-6 md:p-8">
        <p className="admin-empty-kicker type-mono-micro">{label}</p>
        <p className="admin-stat-value mt-5">{value}</p>
      </div>
    </div>
  );
}
