import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchVisitors } from '../api';
import StatusBadge from '../components/StatusBadge';
import WaitChip from '../components/WaitChip';
import TokenTicket from '../components/TokenTicket';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { Search, Users, X, ChevronRight, MapPin, Ticket } from 'lucide-react';
import { deptColor, visitorTypeColor, initials, formatDate } from '../utils';

const DEPARTMENTS = ['IT','CSE','ECE','EEE','ME','CE'];
const TYPES       = ['Student','Faculty','Staff'];

function VisitorDrawer({ visitor, onClose }) {
  const [activeTicket, setActiveTicket] = useState(null);
  if (!visitor) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal aria-label="Visitor details">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-bold text-lg flex items-center justify-center">
              {initials(visitor.FIRST_NAME, visitor.LAST_NAME)}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">{visitor.FIRST_NAME} {visitor.LAST_NAME}</h2>
              <p className="text-xs text-slate-500">{visitor.ID_NUMBER}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Meta */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${deptColor(visitor.DEPARTMENT)}`}>{visitor.DEPARTMENT}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${visitorTypeColor(visitor.VISITOR_TYPE)}`}>{visitor.VISITOR_TYPE}</span>
        </div>

        {/* Queue history */}
        <div className="px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Queue History</h3>
          {visitor.entries?.length === 0 ? (
            <p className="text-sm text-slate-400">No entries recorded.</p>
          ) : (
            <div className="space-y-3">
              {visitor.entries?.map(e => (
                <div key={e.ENTRY_ID} className="card p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{e.counter?.COUNTER_NAME}</span>
                    <StatusBadge status={e.STATUS} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={10} /> {e.location?.LOCATION_NAME}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">{formatDate(e.ENTRY_DATE)} · {e.ARRIVAL_TIME}</span>
                    <WaitChip minutes={e.WAIT_MINUTES} />
                  </div>
                  {e.prediction?.BEST_SLOT && (
                    <div className="mt-2 text-xs font-mono bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-lg">
                      Best slot: {e.prediction.BEST_SLOT}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => setActiveTicket({ ...e, visitor })}
                      className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold"
                    >
                      <Ticket size={12} /> View Pass / Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal if activeTicket is set */}
        {activeTicket && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md animate-slide-up">
              <button
                onClick={() => setActiveTicket(null)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-xs font-semibold"
              >
                <X size={18} /> Close
              </button>
              <TokenTicket entry={activeTicket} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Visitors() {
  const [search, setSearch] = useState('');
  const [dept, setDept]     = useState('');
  const [type, setType]     = useState('');
  const [location, setLocation] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, loading, error, refetch } = useAsync(
    () => fetchVisitors({ department: dept || undefined, type: type || undefined, location: location || undefined }),
    [dept, type, location]
  );

  const filtered = data?.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.FIRST_NAME?.toLowerCase().includes(q) ||
      v.LAST_NAME?.toLowerCase().includes(q)  ||
      v.ID_NUMBER?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visitors</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">All registered campus visitors with queue history</p>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" className="input pl-9"
            placeholder="Search by name or ID number…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="select flex-1 min-w-[140px]" value={dept} onChange={e => setDept(e.target.value)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="select flex-1 min-w-[140px]" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button
            onClick={() => setLocation(location === 'Main Canteen' ? '' : 'Main Canteen')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border
              ${location === 'Main Canteen'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
          >
            🍽️ Main Canteen only
          </button>
          {(dept || type || location || search) && (
            <button onClick={() => { setDept(''); setType(''); setLocation(''); setSearch(''); }} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {loading ? (
        <div className="card p-4"><TableSkeleton rows={8} /></div>
      ) : filtered?.length === 0 ? (
        <EmptyState title="No visitors found" description="Try a different search or filter." icon={Users} />
      ) : (
        <div className="table-wrapper">
          <table className="table" aria-label="Visitors list">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>ID Number</th>
                <th>Department</th>
                <th>Type</th>
                <th>Visits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.VISITOR_ID} className="cursor-pointer" onClick={() => setSelected(v)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs font-bold flex items-center justify-center">
                        {initials(v.FIRST_NAME, v.LAST_NAME)}
                      </div>
                      <span className="font-medium">{v.FIRST_NAME} {v.LAST_NAME}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{v.ID_NUMBER}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${deptColor(v.DEPARTMENT)}`}>{v.DEPARTMENT}</span></td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${visitorTypeColor(v.VISITOR_TYPE)}`}>{v.VISITOR_TYPE}</span></td>
                  <td className="text-slate-600 dark:text-slate-400 text-sm">{v.entries?.length || 0}</td>
                  <td>
                    <ChevronRight size={15} className="text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered && (
        <p className="text-xs text-slate-400 text-right">{filtered.length} visitor{filtered.length !== 1 ? 's' : ''}</p>
      )}

      <VisitorDrawer visitor={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
