import { useAsync } from '../hooks/useAsync';
import { fetchDashboard } from '../api';
import KpiCard from '../components/KpiCard';
import { KpiSkeleton } from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Clock, CheckCircle2, LogOut, ListOrdered,
  TrendingUp, AlertTriangle, Zap
} from 'lucide-react';

const PIE_COLORS   = ['#10b981', '#f59e0b', '#ef4444'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, refetch } = useAsync(fetchDashboard, [], 10000);

  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const longWaitIds = new Set((data?.long_wait_counters || []).map(c => c.COUNTER_ID));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Real-time campus queue intelligence</p>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs gap-1.5">
          <TrendingUp size={13} /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="Total Entries"   value={data.total_entries}  icon={ListOrdered}  color="primary" />
            <KpiCard label="Avg Wait"        value={`${data.avg_wait}m`} icon={Clock}        color="amber"   subtitle="per entry" />
            <KpiCard label="Waiting Now"     value={data.waiting_count}  icon={Users}        color="amber"   />
            <KpiCard label="Served Today"    value={data.served_count}   icon={CheckCircle2} color="green"   />
            <KpiCard label="Abandoned"       value={data.left_count}     icon={LogOut}       color="red"     />
          </>
        )}
      </div>

      {/* Busiest Counter callout */}
      {!loading && data?.busiest_counter && (
        <div className="card p-4 flex items-center gap-4 border-l-4 border-primary-500 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Zap size={18} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">Busiest Counter (All Records)</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {data.busiest_counter.COUNTER_NAME} &mdash; <span className="font-normal text-slate-600 dark:text-slate-400">{data.busiest_counter.location?.LOCATION_NAME}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.busiest_counter.TOTAL_VISITORS} visitors queued</p>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors per counter */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Visitors per Counter</h2>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.visitors_per_counter} barSize={28}>
                <XAxis dataKey="COUNTER_NAME" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="TOTAL_VISITORS" name="Visitors" fill="#0891b2" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status donut */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Entries by Status</h2>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.status_breakdown}
                  dataKey="COUNT"
                  nameKey="STATUS"
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                >
                  {data.status_breakdown.map((entry, i) => (
                    <Cell key={entry.STATUS} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ borderRadius: '12px', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={10} formatter={v => <span style={{ fontSize: 12, color: '#94a3b8' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Total wait per counter */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Wait Time per Counter</h2>
          <span className="badge-left text-[10px]">
            <AlertTriangle size={9} /> &gt;30 min highlighted
          </span>
        </div>
        {loading ? (
          <div className="skeleton h-52 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.total_wait_per_counter} barSize={32}>
              <XAxis dataKey="COUNTER_NAME" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit=" m" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="TOTAL_WAIT" name="Total Wait (min)" radius={[6,6,0,0]}>
                {data.total_wait_per_counter.map(entry => (
                  <Cell
                    key={entry.COUNTER_ID}
                    fill={longWaitIds.has(entry.COUNTER_ID) ? '#ef4444' : '#0891b2'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {!loading && data?.long_wait_counters?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.long_wait_counters.map(c => (
              <span key={c.COUNTER_ID} className="badge-left text-xs">
                <AlertTriangle size={10} /> {c.COUNTER_NAME} — {c.TOTAL_WAIT} min
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
