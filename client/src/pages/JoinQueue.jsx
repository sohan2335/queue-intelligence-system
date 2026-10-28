import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchVisitors, fetchCounters, createQueueEntry } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import TokenTicket from '../components/TokenTicket';
import { PlusCircle, CheckCircle2, Clock, Users, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function ProgressStep({ step, current, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
        ${step < current ? 'bg-emerald-500 text-white'
        : step === current ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40'
        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
      >
        {step < current ? <CheckCircle2 size={14} /> : step}
      </div>
      <span className={`text-xs font-medium ${step === current ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

export default function JoinQueue() {
  const [form, setForm] = useState({ visitor_id: '', counter_id: '', arrival_time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const { data: visitors } = useAsync(fetchVisitors);
  const { data: counters } = useAsync(fetchCounters);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedCounter = counters?.find(c => String(c.COUNTER_ID) === String(form.counter_id));
  const waitingNow      = selectedCounter?.currentWaiting ?? 0;
  const limitReached    = selectedCounter && waitingNow >= selectedCounter.QUEUE_LIMIT;
  const locationActive  = selectedCounter?.location?.STATUS === 'Active';
  const timeValid       = form.arrival_time && selectedCounter
    ? form.arrival_time >= selectedCounter.OPEN_TIME && form.arrival_time <= selectedCounter.CLOSE_TIME
    : true;

  const step = !form.visitor_id ? 1 : !form.counter_id ? 2 : 3;

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await createQueueEntry(form);
      setResult(res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to join queue');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-md mx-auto space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setResult(null); setForm({ visitor_id: '', counter_id: '', arrival_time: '' }); }}
            className="btn-ghost text-xs flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Join Another Counter
          </button>
          <Link to="/tokens" className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Go to Counter Board →
          </Link>
        </div>

        {/* Digital Ticket Pass */}
        <TokenTicket
          entry={result.entry}
          prediction={result.prediction}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join Queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Reserve your spot at a campus service counter</p>
      </div>

      {/* Progress */}
      <div className="card p-4 flex items-center justify-between">
        <ProgressStep step={1} current={step} label="Select Visitor" />
        <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />
        <ProgressStep step={2} current={step} label="Pick Counter" />
        <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />
        <ProgressStep step={3} current={step} label="Set Time" />
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Visitor */}
        <div>
          <label className="label" htmlFor="visitor-select">Visitor *</label>
          <select
            id="visitor-select"
            className="select"
            required
            value={form.visitor_id}
            onChange={e => set('visitor_id', e.target.value)}
          >
            <option value="">— Select visitor —</option>
            {visitors?.map(v => (
              <option key={v.VISITOR_ID} value={v.VISITOR_ID}>
                {v.FIRST_NAME} {v.LAST_NAME} ({v.ID_NUMBER}) · {v.DEPARTMENT} · {v.VISITOR_TYPE}
              </option>
            ))}
          </select>
        </div>

        {/* Counter */}
        <div>
          <label className="label" htmlFor="counter-select">Counter *</label>
          <select
            id="counter-select"
            className="select"
            required
            value={form.counter_id}
            onChange={e => set('counter_id', e.target.value)}
          >
            <option value="">— Select counter —</option>
            {counters?.map(c => {
              const waiting = c.currentWaiting ?? 0;
              const full    = waiting >= c.QUEUE_LIMIT;
              const inactive = c.location?.STATUS !== 'Active';
              return (
                <option key={c.COUNTER_ID} value={c.COUNTER_ID} disabled={full || inactive}>
                  {c.COUNTER_NAME} — {c.location?.LOCATION_NAME}
                  {full ? ' [FULL]' : inactive ? ' [INACTIVE]' : ` (${waiting}/${c.QUEUE_LIMIT} waiting)`}
                </option>
              );
            })}
          </select>

          {selectedCounter && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Clock size={11} /> {selectedCounter.OPEN_TIME}–{selectedCounter.CLOSE_TIME}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {waitingNow}/{selectedCounter.QUEUE_LIMIT} waiting</span>
              </div>
              {/* Queue fill bar */}
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${limitReached ? 'bg-red-500' : waitingNow / selectedCounter.QUEUE_LIMIT > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (waitingNow / selectedCounter.QUEUE_LIMIT) * 100)}%` }}
                />
              </div>
              {limitReached && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle size={11} /> Queue is full. Choose another counter.
                </p>
              )}
              {!locationActive && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle size={11} /> This location is currently inactive.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Arrival time */}
        <div>
          <label className="label" htmlFor="arrival-time">Arrival Time *</label>
          <input
            id="arrival-time"
            type="time"
            className="input"
            required
            value={form.arrival_time}
            onChange={e => set('arrival_time', e.target.value)}
          />
          {selectedCounter && form.arrival_time && !timeValid && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <AlertTriangle size={11} /> Counter is only open {selectedCounter.OPEN_TIME}–{selectedCounter.CLOSE_TIME}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary w-full justify-center py-3"
          disabled={submitting || limitReached || !locationActive || !timeValid}
        >
          {submitting
            ? <><span className="animate-spin">⟳</span> Joining…</>
            : <><PlusCircle size={16} /> Join Queue</>
          }
        </button>
      </form>
    </div>
  );
}
