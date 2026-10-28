export function CardSkeleton({ className = '' }) {
  return <div className={`skeleton h-32 ${className}`} />;
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 rounded-lg" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex justify-between">
        <TextSkeleton lines={2} className="flex-1" />
        <div className="skeleton w-12 h-12 rounded-2xl ml-4" />
      </div>
      <div className="skeleton h-1 rounded-full" />
    </div>
  );
}
