import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchPredictions, fetchCounters, fetchLocations } from '../api';
import WaitChip from '../components/WaitChip';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Brain, Clock, Lightbulb, AlertTriangle
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { parsePeakHours, toMinutes, formatDate } from '../utils';

function PeakTimeline({ peak_hours, name }) {
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
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>
        <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">{peak_hours}</span>
      </div>
      <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-80"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>08:00</span><span>13:00</span><span>18:00</span>
      </div>
    </div>
  );
}

export default function Predictions() {
  const [selectedCounter, setSelectedCounter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const { data: counters } = useAsync(fetchCounters);
  const { data: locations } = useAsync(fetchLocations);
  const { data, loading, error, refetch } = useAsync(
    () => fetchPredictions({
      counter_id: selectedCounter || undefined,
      location_id: selectedLocation || undefined,
    }),
    [selectedCounter, selectedLocation]
  );

  const longWaiters = data?.filter(p => p.entry?.WAIT_MINUTES > 15) || [];

  // Best slot for selected counter/location
  const bestSlot = data?.[0]?.BEST_SLOT;
  const predictedWait = data?.[0]?.PREDICTED_WAIT;

  // Scatter data: actual vs predicted
  const scatterData = data?.map(p => ({
    actual: p.entry?.WAIT_MINUTES,
    predicted: p.PREDICTED_WAIT,
    diff: Math.abs((p.entry?.WAIT_MINUTES || 0) - p.PREDICTED_WAIT),
    name: `${p.visitor?.FIRST_NAME} ${p.visitor?.LAST_NAME}`,
  })) || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Predictions &amp; Best Times</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">AI-predicted wait times and optimal visit slots</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Filter by Counter</label>
            <select className="select" value={selectedCounter} onChange={e => { setSelectedCounter(e.target.value); setSelectedLocation(''); }}>
              <option value="">All counters</option>
              {counters?.map(c => <option key={c.COUNTER_ID} value={c.COUNTER_ID}>{c.COUNTER_NAME}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Filter by Location</label>
            <select className="select" value={selectedLocation} onChange={e => { setSelectedLocation(e.target.value); setSelectedCounter(''); }}>
              <option value="">All locations</option>
              {locations?.map(l => <option key={l.LOCATION_ID} value={l.LOCATION_ID}>{l.LOCATION_NAME}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Best slot callout */}
      {bestSlot && (
        <div className="card p-5 border-l-4 border-emerald-500 flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Lightbulb size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Recommended Best Slot</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{bestSlot}</p>
            <p className="text-sm text-slate-500">Predicted wait: <strong>{predictedWait} min</strong></p>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {/* Accuracy table */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <Brain size={15} /> Actual vs Predicted Wait
        </h2>
        {loading ? <TableSkeleton rows={6} /> : data?.length === 0 ? (
          <EmptyState title="No predictions" description="Select a counter or location above." icon={Brain} />
        ) : (
          <div className="table-wrapper">
            <table className="table" aria-label="Prediction accuracy">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Counter</th>
                  <th>Date</th>
                  <th>Actual Wait</th>
                  <th>Predicted</th>
                  <th>Diff</th>
                  <th>Best Slot</th>
                </tr>
              </thead>
              <tbody>
                {data.map(p => {
                  const diff = Math.abs((p.entry?.WAIT_MINUTES || 0) - p.PREDICTED_WAIT);
                  return (
                    <tr key={p.PREDICTION_ID}>
                      <td className="font-medium text-sm">{p.visitor?.FIRST_NAME} {p.visitor?.LAST_NAME}</td>
                      <td className="text-xs">{p.counter?.COUNTER_NAME}</td>
                      <td className="text-xs text-slate-500">{formatDate(p.PREDICTION_DATE)}</td>
                      <td><WaitChip minutes={p.entry?.WAIT_MINUTES} /></td>
                      <td><WaitChip minutes={p.PREDICTED_WAIT} /></td>
                      <td>
                        <span className={`text-xs font-semibold ${diff <= 2 ? 'text-emerald-600 dark:text-emerald-400' : diff <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                          ±{diff} min
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-mono bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-lg">
                          {p.BEST_SLOT}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scatter chart */}
      {!loading && scatterData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Actual vs Predicted (Scatter)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <XAxis dataKey="actual" name="Actual" unit=" min" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis dataKey="predicted" name="Predicted" unit=" min" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow text-xs">
                    <p className="font-semibold mb-1">{d.name}</p>
                    <p>Actual: <strong>{d.actual} min</strong></p>
                    <p>Predicted: <strong>{d.predicted} min</strong></p>
                    <p>Diff: <strong>±{d.diff} min</strong></p>
                  </div>
                );
              }} />
              <Scatter data={scatterData} fill="#0891b2" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Long waiters */}
      {!loading && longWaiters.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" /> Long Waiters (&gt;15 min)
          </h2>
          <div className="space-y-2">
            {longWaiters.map(p => (
              <div key={p.PREDICTION_ID} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                <div>
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                    {p.visitor?.FIRST_NAME} {p.visitor?.LAST_NAME}
                  </p>
                  <p className="text-xs text-slate-500">{p.counter?.COUNTER_NAME}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <WaitChip minutes={p.entry?.WAIT_MINUTES} />
                  <span className="flex items-center gap-1 text-xs font-mono text-primary-600 dark:text-primary-400">
                    <Lightbulb size={11} /> {p.BEST_SLOT}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak hours timelines */}
      {!loading && locations && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Clock size={15} /> Peak Hours by Location
          </h2>
          <div className="space-y-3">
            {locations.filter(l => l.PEAK_HOURS).map(l => (
              <PeakTimeline key={l.LOCATION_ID} peak_hours={l.PEAK_HOURS} name={l.LOCATION_NAME} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
