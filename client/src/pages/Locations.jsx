import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchLocations } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { MapPin, Users, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { parsePeakHours, toMinutes } from '../utils';

const locationTypeIcon = {
  'Canteen':       '🍽️',
  'Photocopy Shop':'📠',
  'Lab':           '🔬',
  'Office':        '🏢',
};

function PeakBar({ peak_hours }) {
  const ph = parsePeakHours(peak_hours);
  if (!ph) return null;
  const startMin = toMinutes(ph.start);
  const endMin   = toMinutes(ph.end);
  const dayStart = toMinutes('08:00');
  const dayEnd   = toMinutes('18:00');
  const total    = dayEnd - dayStart;
  const left     = ((startMin - dayStart) / total) * 100;
  const width    = ((endMin - startMin) / total) * 100;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>08:00</span>
        <span className="font-medium text-amber-600 dark:text-amber-400">Peak: {peak_hours}</span>
        <span>18:00</span>
      </div>
      <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function CounterRow({ counter }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-sm">
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">{counter.COUNTER_NAME}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{counter.SERVICE_TYPE}</p>
      </div>
      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
        <p>{counter.OPEN_TIME} – {counter.CLOSE_TIME}</p>
        <p className="flex items-center justify-end gap-1 mt-0.5">
          <Users size={10} /> Limit {counter.QUEUE_LIMIT}
        </p>
      </div>
    </div>
  );
}

function LocationCard({ loc }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = loc.STATUS === 'Active';

  return (
    <div className={`card-hover p-5 ${!isActive ? 'opacity-60' : ''} animate-fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl">
            {locationTypeIcon[loc.LOCATION_TYPE] || '📍'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{loc.LOCATION_NAME}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{loc.LOCATION_TYPE}</p>
          </div>
        </div>
        <span className={isActive ? 'badge-active' : 'badge-inactive'}>
          {isActive ? '● Active' : '○ Inactive'}
        </span>
      </div>

      {loc.PEAK_HOURS && <PeakBar peak_hours={loc.PEAK_HOURS} />}

      {loc.counters?.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {loc.counters.length} counter{loc.counters.length !== 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5 animate-slide-up">
              {loc.counters.map(c => <CounterRow key={c.COUNTER_ID} counter={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Locations() {
  const [activeOnly, setActiveOnly] = useState(false);
  const { data, loading, error, refetch } = useAsync(
    () => fetchLocations({ activeOnly }),
    [activeOnly]
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Locations &amp; Counters</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Campus service locations and their counters</p>
        </div>
        <button
          onClick={() => setActiveOnly(a => !a)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${activeOnly
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          aria-pressed={activeOnly}
        >
          {activeOnly ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          Active only
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <>
          {data?.length === 0 ? (
            <EmptyState title="No locations found" description="Try turning off the active-only filter." icon={MapPin} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.map(loc => <LocationCard key={loc.LOCATION_ID} loc={loc} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
