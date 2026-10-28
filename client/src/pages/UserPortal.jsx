import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  fetchMyTickets, takeTicket, cancelTicket,
  fetchCounters, fetchTokenBoard
} from '../api';
import TokenTicket from '../components/TokenTicket';
import StatusBadge from '../components/StatusBadge';
import WaitChip from '../components/WaitChip';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Ticket, Clock, MapPin, PlusCircle,
  XCircle, AlertTriangle, Sparkles,
  RefreshCw, LogOut, Printer, X
} from 'lucide-react';
import { formatDate } from '../utils';

export default function UserPortal() {
  const { user, logout } = useAuth();

  const [counterId, setCounterId] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [activeTicketModal, setActiveTicketModal] = useState(null);

  const { data: myTickets, loading, error, refetch } = useAsync(fetchMyTickets, [], 10000);
  const { data: counters } = useAsync(fetchCounters, [], 10000);
  const { refetch: refetchBoard } = useAsync(fetchTokenBoard, [], 10000);

  const handleTakeTicket = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await takeTicket({
        counter_id: counterId,
        arrival_time: arrivalTime || undefined,
      });
      setCounterId('');
      setArrivalTime('');
      refetch();
      refetchBoard();
      setActiveTicketModal(res.entry);
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err?.message || 'Failed to take ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket and leave the queue?')) return;
    try {
      await cancelTicket(ticketId);
      refetch();
      refetchBoard();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Failed to cancel ticket');
    }
  };

  const activeTickets = myTickets?.filter(t => t.IS_ACTIVE) || [];
  const pastTickets = myTickets?.filter(t => !t.IS_ACTIVE) || [];

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">
      {/* Visitor Profile Banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 via-cyan-600 to-teal-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 uppercase tracking-wider backdrop-blur-xs">
              {user?.visitorType || 'Visitor'} Portal
            </span>
            <span className="font-mono text-xs opacity-85">#{user?.idNumber}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-xs text-cyan-100 flex items-center gap-2">
            <span>Department: <strong>{user?.department}</strong></span>
            <span>•</span>
            <span>Active Tickets: <strong>{activeTickets.length}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetch(); refetchBoard(); }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 flex items-center gap-1.5 transition"
            title="Refresh queue status"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-black/20 hover:bg-black/30 flex items-center gap-1.5 transition"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {/* Grid: Take a Ticket + Active Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Take a Ticket Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 border-2 border-primary-100 dark:border-primary-950/50">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <PlusCircle className="text-primary-600 dark:text-primary-400" size={18} />
              Get a Token / Ticket
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Reserve your spot at any campus counter with instant wait prediction
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleTakeTicket} className="space-y-4">
              <div>
                <label className="label">Select Counter *</label>
                <select
                  className="select"
                  required
                  value={counterId}
                  onChange={e => setCounterId(e.target.value)}
                >
                  <option value="">— Choose a Counter —</option>
                  {counters?.map(c => {
                    const full = (c.currentWaiting || 0) >= c.QUEUE_LIMIT;
                    return (
                      <option key={c.COUNTER_ID} value={c.COUNTER_ID} disabled={full || c.location?.STATUS !== 'Active' || (!arrivalTime && !c.isOpenNow)}>
                        {c.COUNTER_NAME} ({c.SERVICE_TYPE})
                        {!c.isOpenNow ? ' [CLOSED]' : full ? ' [FULL]' : ` (~${c.estimatedWait}m wait)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="label">Arrival Time (Optional)</label>
                <input
                  type="time"
                  className="input"
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave empty to use current time</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !counterId}
                className="btn-primary w-full justify-center py-2.5 text-sm font-semibold"
              >
                {submitting ? 'Generating Pass…' : '🎟️ Get My Digital Pass'}
              </button>
            </form>
          </div>

          {/* Quick Counter Wait Times Glance */}
          <div className="card p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Counter Status</span>
              <span className="text-[10px] text-primary-600 dark:text-primary-400 font-normal">Live</span>
            </h3>
            <div className="space-y-2">
              {counters?.map(c => (
                <div key={c.COUNTER_ID} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">{c.COUNTER_NAME}</span>
                    <span className="text-[10px] text-slate-400">{c.location?.LOCATION_NAME}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-primary-600 dark:text-primary-400 block">
                      ~{c.estimatedWait} min
                    </span>
                    <span className="text-[10px] text-slate-400">{c.currentWaiting} waiting</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active Tokens & Waiting Time Tracker */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="text-primary-600 dark:text-primary-400" size={18} />
              My Active Tickets
            </h2>
            <p className="text-xs text-slate-500">Live queue position, estimated wait, and actions</p>
          </div>

          {loading ? (
            <div className="card p-5"><TableSkeleton rows={3} /></div>
          ) : activeTickets.length === 0 ? (
            <div className="card p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Ticket size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active tickets right now</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a counter on the left to get a token and view your real-time waiting time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTickets.map(ticket => {
                const isCalling = ticket.STATUS === 'Calling';
                return (
                  <div
                    key={ticket.ENTRY_ID}
                    className={`card p-5 border-2 transition-all ${
                      isCalling
                        ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/30 dark:bg-amber-950/10'
                        : 'border-primary-200 dark:border-primary-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-extrabold font-mono text-primary-600 dark:text-primary-400">
                            {ticket.TOKEN_NUMBER}
                          </span>
                          <StatusBadge status={ticket.STATUS} />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {ticket.counter?.COUNTER_NAME}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={11} /> {ticket.location?.LOCATION_NAME} · {ticket.counter?.SERVICE_TYPE}
                        </p>
                      </div>

                      <div className="text-right">
                        {isCalling ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse">
                            🔔 PLEASE PROCEED TO COUNTER!
                          </span>
                        ) : (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Position in line
                            </span>
                            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                              #{ticket.QUEUE_POSITION}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {ticket.PEOPLE_AHEAD === 0 ? 'You are next!' : `${ticket.PEOPLE_AHEAD} ahead of you`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wait Time & Best Slot Highlight */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs mb-4">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Estimated Wait Time</span>
                        <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <Clock size={13} className="text-primary-600" />
                          {ticket.ESTIMATED_WAIT != null ? `~${ticket.ESTIMATED_WAIT} min` : 'Calculating…'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">AI Recommended Slot</span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Sparkles size={12} />
                          {ticket.prediction?.BEST_SLOT || '15:30-16:30'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => setActiveTicketModal(ticket)}
                        className="btn-ghost py-1.5 px-3 flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold"
                      >
                        <Printer size={13} /> View &amp; Print Pass
                      </button>

                      {ticket.STATUS === 'Waiting' && (
                        <button
                          onClick={() => handleCancel(ticket.ENTRY_ID)}
                          className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <XCircle size={13} /> Cancel Ticket
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past History */}
          {pastTickets.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Past Queue History
              </h3>
              <div className="table-wrapper">
                <table className="table text-xs">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Counter</th>
                      <th>Date</th>
                      <th>Arrival</th>
                      <th>Status</th>
                      <th>Wait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastTickets.map(t => (
                      <tr key={t.ENTRY_ID}>
                        <td className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {t.TOKEN_NUMBER}
                        </td>
                        <td>{t.counter?.COUNTER_NAME}</td>
                        <td className="text-slate-400">{formatDate(t.ENTRY_DATE)}</td>
                        <td className="font-mono">{t.ARRIVAL_TIME}</td>
                        <td><StatusBadge status={t.STATUS} /></td>
                        <td><WaitChip minutes={t.WAIT_MINUTES} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Pass Modal */}
      {activeTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md animate-slide-up">
            <button
              onClick={() => setActiveTicketModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-xs font-semibold"
            >
              <X size={18} /> Close
            </button>
            <TokenTicket entry={activeTicketModal} />
          </div>
        </div>
      )}
    </div>
  );
}
