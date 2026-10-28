export default function KpiCard({ label, value, icon: Icon, color = 'primary', delta, subtitle }) {
  const colors = {
    primary:  { bg: 'bg-primary-50 dark:bg-primary-900/20',  icon: 'text-primary-600 dark:text-primary-400',  ring: 'bg-primary-100 dark:bg-primary-900/40' },
    green:    { bg: 'bg-emerald-50 dark:bg-emerald-900/20',  icon: 'text-emerald-600 dark:text-emerald-400',  ring: 'bg-emerald-100 dark:bg-emerald-900/40' },
    amber:    { bg: 'bg-amber-50 dark:bg-amber-900/20',      icon: 'text-amber-600 dark:text-amber-400',      ring: 'bg-amber-100 dark:bg-amber-900/40' },
    red:      { bg: 'bg-red-50 dark:bg-red-900/20',          icon: 'text-red-600 dark:text-red-400',          ring: 'bg-red-100 dark:bg-red-900/40' },
    purple:   { bg: 'bg-purple-50 dark:bg-purple-900/20',    icon: 'text-purple-600 dark:text-purple-400',    ring: 'bg-purple-100 dark:bg-purple-900/40' },
  };
  const c = colors[color] || colors.primary;

  return (
    <div className="card-hover p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          {delta != null && (
            <p className={`text-xs font-medium mt-1 ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl ${c.ring} flex items-center justify-center flex-shrink-0`}>
            <Icon size={22} className={c.icon} />
          </div>
        )}
      </div>
      <div className={`mt-4 h-1 rounded-full ${c.bg}`}>
        <div className={`h-1 rounded-full ${c.icon.replace('text-', 'bg-').split(' ')[0]} w-3/4 opacity-60`} />
      </div>
    </div>
  );
}
