import { TableSkeleton } from '../components/LoadingSkeleton';
import { useState, useMemo } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchQueueEntries, fetchCounters, fetchLocations } from '../api';
import StatusBadge from '../components/StatusBadge';
import WaitChip from '../components/WaitChip';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import TokenTicket from '../components/TokenTicket';
import { Search, RefreshCw, Filter, ListOrdered, Ticket, X } from 'lucide-react';
import { formatDate, initials } from '../utils';

export default function LiveQueue() {
  const [filters, setFilters] = useState({ status: '', counter_id: '', date: '', location_id: '', search: '' });
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data, loading, error, refetch } = useAsync(
    () => fetchQueueEntries(Object.fromEntries(Object.entries(filters).filter(([,v]) => v))),
    [filters], 10000
  );
  const { data: counters } = useAsync(fetchCounters, [], 10000);
  const { data: locations } = useAsync(fetchLocations);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const statusCounts = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, e) => { acc[e.STATUS] = (acc[e.STATUS] || 0) + 1; return acc; }, {});
  }, [data]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Live Queue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">All queue entries with real-time status</p>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Status summary pills */}
      {!loading && data && (
        <div className="flex gap-2 flex-wrap">
          {['Served','Waiting','Calling','Left'].map(s => (
            <button
              key={s}
              onClick={() => set('status', filters.status === s ? '' : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${filters.status === s
                  ? s === 'Served'  ? 'bg-emerald-500 text-white border-emerald-500'
                  : s === 'Waiting' ? 'bg-amber-500 text-white border-amber-500'
                  :                   'bg-red-500 text-white border-red-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
            >
              {s} {statusCounts[s] != null ? `(${statusCounts[s]})` : ''}
            </button>
          ))}
          <button
            onClick={() => setFilters({ status: '', counter_id: '', date: '', location_id: '', search: '' })}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="select" value={filters.status} onChange={e => set('status', e.target.value)}>
              <option value="">All statuses</option>
              <option>Served</option>
              <option>Waiting</option>
              <option>Calling</option>
              <option>Left</option>
            </select>
          </div>
          <div>
            <label className="label">Counter</label>
            <select className="select" value={filters.counter_id} onChange={e => set('counter_id', e.target.value)}>
              <option value="">All counters</option>
              {counters?.map(c => <option key={c.COUNTER_ID} value={c.COUNTER_ID}>{c.COUNTER_NAME}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="select" value={filters.location_id} onChange={e => set('location_id', e.target.value)}>
              <option value="">All locations</option>
              {locations?.map(l => <option key={l.LOCATION_ID} value={l.LOCATION_ID}>{l.LOCATION_NAME}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={filters.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by visitor name or ID number…"
            value={filters.search}
            onChange={e => set('search', e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : loading ? (
        <div className="card p-4"><TableSkeleton rows={8} /></div>
      ) : data?.length === 0 ? (
        <EmptyState title="No entries found" description="Adjust your filters or search term." icon={ListOrdered} />
      ) : (
        <div className="table-wrapper">
          <table className="table" aria-label="Queue entries">
            <thead>
              <tr>
                <th>Token #</th>
                <th>Visitor</th>
                <th>Counter</th>
                <th>Location</th>
                <th>Date</th>
                <th>Arrival</th>
                <th>Status</th>
                <th>Wait</th>
                <th>Best Slot</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map(e => (
                <tr key={e.ENTRY_ID}>
                  <td>
                    <button
                      onClick={() => setSelectedTicket(e)}
                      className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md hover:underline"
                    >
                      {e.TOKEN_NUMBER || `#${e.ENTRY_ID}`}
                    </button>
                    {e.STATUS === 'Waiting' && e.QUEUE_POSITION != null && (
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Pos #{e.QUEUE_POSITION}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">
                        {initials(e.visitor?.FIRST_NAME, e.visitor?.LAST_NAME)}
                      </div>
                      <div>
                        <p className="font-medium text-xs">{e.visitor?.FIRST_NAME} {e.visitor?.LAST_NAME}</p>
                        <p className="text-[10px] text-slate-400">{e.visitor?.ID_NUMBER}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs">{e.counter?.COUNTER_NAME}</td>
                  <td className="text-xs">{e.location?.LOCATION_NAME}</td>
                  <td className="text-xs text-slate-500">{formatDate(e.ENTRY_DATE)}</td>
                  <td className="font-mono text-xs">{e.ARRIVAL_TIME}</td>
                  <td><StatusBadge status={e.STATUS} /></td>
                  <td><WaitChip minutes={e.WAIT_MINUTES} /></td>
                  <td>
                    {e.prediction?.BEST_SLOT
                      ? <span className="text-xs font-mono bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-lg">{e.prediction.BEST_SLOT}</span>
                      : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedTicket(e)}
                      className="btn-ghost py-1 px-2 text-xs flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium"
                      title="View Digital Ticket"
                    >
                      <Ticket size={13} /> Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && data && (
        <p className="text-xs text-slate-400 text-right">{data.length} entr{data.length === 1 ? 'y' : 'ies'}</p>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md animate-slide-up">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-xs font-semibold"
            >
              <X size={18} /> Close
            </button>
            <TokenTicket entry={selectedTicket} />
          </div>
        </div>
      )}
    </div>
  );
}
