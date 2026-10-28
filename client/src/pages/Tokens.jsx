import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  fetchTokenBoard, lookupToken, dispenseToken, updateTokenStatus,
  fetchCounters, fetchVisitors
} from '../api';
import TokenTicket from '../components/TokenTicket';
import ErrorMessage from '../components/ErrorMessage';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Ticket, Tv, Search, PlusCircle, CheckCircle2,
  Volume2, RefreshCw, X
} from 'lucide-react';

export default function Tokens() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'dispense' | 'lookup'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedTicket, setSearchedTicket] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);

  // Dispenser state
  const [dispenseForm, setDispenseForm] = useState({ visitor_id: '', counter_id: '' });
  const [dispensedResult, setDispensedResult] = useState(null);
  const [dispensing, setDispensing] = useState(false);
  const [dispenseError, setDispenseError] = useState(null);

  // Board Data
  const { data: boardData, loading: boardLoading, error: boardError, refetch: refetchBoard } = useAsync(fetchTokenBoard, [], 10000);
  const { data: counters } = useAsync(fetchCounters, [], 10000);
  const { data: visitors } = useAsync(
    () => (isAdmin ? fetchVisitors() : Promise.resolve([])),
    [isAdmin]
  );

  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setLookupError(null);
    try {
      const res = await lookupToken(searchQuery.trim());
      setSearchedTicket(res);
    } catch (err) {
      setSearchedTicket(null);
      setLookupError(err?.response?.data?.error || 'Token or ticket not found');
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    setDispenseError(null);
    setDispensing(true);
    try {
      const res = await dispenseToken(dispenseForm);
      setDispensedResult(res);
      refetchBoard();
    } catch (err) {
      setDispenseError(err?.response?.data?.error || err?.message || 'Failed to dispense token');
    } finally {
      setDispensing(false);
    }
  };

  const handleStatusChange = async (entryId, newStatus) => {
    try {
      await updateTokenStatus(entryId, newStatus);
      refetchBoard();
      if (searchedTicket?.ENTRY_ID === entryId) {
        setSearchedTicket(prev => ({ ...prev, STATUS: newStatus }));
      }
    } catch (err) {
      alert('Failed to update token: ' + (err?.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="text-primary-600 dark:text-primary-400" size={26} />
            Tokens &amp; Counter Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time digital counter tickets, live calling board, and self-service token kiosk
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'board'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tv size={14} /> Live Display Board
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('dispense')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dispense'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PlusCircle size={14} /> Issue Token
            </button>
          )}
          <button
            onClick={() => setActiveTab('lookup')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'lookup'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Search size={14} /> Track My Ticket
          </button>
        </div>
      </div>

      {/* ─── TAB 1: LIVE COUNTER DISPLAY BOARD ───────────────────────────── */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Now Serving Board
              </span>
            </div>
            <button
              onClick={refetchBoard}
              className="btn-ghost text-xs flex items-center gap-1.5 py-1"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {boardError && <ErrorMessage message={boardError} onRetry={refetchBoard} />}

          {boardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-5 h-64"><TableSkeleton rows={4} /></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {boardData?.map(({ counter, nowServing, nextInLine, waitingCount, waitingTokens, isCalling }) => (
                <div
                  key={counter.COUNTER_ID}
                  className="card overflow-hidden border-2 border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  {/* Counter Top Bar */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                          {counter.code}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {counter.COUNTER_NAME}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {counter.SERVICE_TYPE} · {counter.location?.LOCATION_NAME}
                      </p>
                    </div>

                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {waitingCount} waiting
                    </span>
                  </div>

                  {/* Electronic Display Screen */}
                  <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                        ● Now Serving
                      </span>
                      {nowServing ? (
                        <div className="space-y-1">
                          <p className="text-4xl font-extrabold font-mono text-emerald-400 tracking-wider">
                            {nowServing.TOKEN_NUMBER}
                          </p>
                          <p className="text-xs text-slate-300 font-medium">
                            {nowServing.visitor?.FIRST_NAME} {nowServing.visitor?.LAST_NAME}
                          </p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold font-mono text-slate-600 py-2">
                          IDLE
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Next in line:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {nextInLine ? nextInLine.TOKEN_NUMBER : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Operator Controls & Actions */}
                  <div className="p-4 bg-white dark:bg-slate-800 space-y-2.5">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => nextInLine && handleStatusChange(nextInLine.ENTRY_ID, 'Calling')}
                          disabled={!nextInLine}
                          className="btn-primary flex-1 justify-center text-xs py-2 disabled:opacity-40"
                          title="Call Next Token"
                        >
                          <Volume2 size={14} /> Call Next
                        </button>

                        {nowServing && isCalling && (
                          <button
                            onClick={() => handleStatusChange(nowServing.ENTRY_ID, 'Served')}
                            className="btn-secondary text-xs py-2 px-3 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700"
                            title="Mark Current Served"
                          >
                            <CheckCircle2 size={14} /> Done
                          </button>
                        )}
                      </div>
                    )}

                    {/* View Ticket Link */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      {nowServing ? (
                        <button
                          onClick={() => setSelectedTicketModal(nowServing)}
                          className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                        >
                          View Current Ticket →
                        </button>
                      ) : <span className="text-slate-400">No active ticket</span>}

                      {waitingTokens?.length > 0 && (
                        <button
                          onClick={() => setSelectedTicketModal(waitingTokens[0])}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          View Next Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: QUICK TOKEN DISPENSER (KIOSK) ───────────────────────── */}
      {activeTab === 'dispense' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Campus Self-Service Token Kiosk
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your visitor profile and counter to print an instant digital queue pass
            </p>
          </div>

          {dispensedResult ? (
            <div className="space-y-4 animate-slide-up">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Token Issued Successfully!
                </p>
              </div>

              {/* Render the Generated Digital Ticket */}
              <TokenTicket
                entry={dispensedResult.entry}
                prediction={dispensedResult.prediction}
              />

              <div className="text-center">
                <button
                  onClick={() => {
                    setDispensedResult(null);
                    setDispenseForm({ visitor_id: '', counter_id: '' });
                  }}
                  className="btn-secondary text-xs"
                >
                  Issue Another Token
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleDispense} className="card p-6 space-y-4">
              {dispenseError && <ErrorMessage message={dispenseError} />}

              <div>
                <label className="label">Select Visitor *</label>
                <select
                  className="select"
                  required
                  value={dispenseForm.visitor_id}
                  onChange={e => setDispenseForm(f => ({ ...f, visitor_id: e.target.value }))}
                >
                  <option value="">— Select Visitor —</option>
                  {visitors?.map(v => (
                    <option key={v.VISITOR_ID} value={v.VISITOR_ID}>
                      {v.FIRST_NAME} {v.LAST_NAME} ({v.ID_NUMBER}) · {v.DEPARTMENT} ({v.VISITOR_TYPE})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Select Counter *</label>
                <select
                  className="select"
                  required
                  value={dispenseForm.counter_id}
                  onChange={e => setDispenseForm(f => ({ ...f, counter_id: e.target.value }))}
                >
                  <option value="">— Select Counter —</option>
                  {counters?.map(c => {
                    const inactive = c.location?.STATUS !== 'Active';
                    const full = (c.currentWaiting || 0) >= c.QUEUE_LIMIT;
                    return (
                      <option key={c.COUNTER_ID} value={c.COUNTER_ID} disabled={inactive || full || !c.isOpenNow}>
                        {c.COUNTER_NAME} ({c.SERVICE_TYPE}) — {c.location?.LOCATION_NAME}
                        {inactive ? ' [INACTIVE]' : !c.isOpenNow ? ' [CLOSED]' : full ? ' [FULL]' : ` (${c.currentWaiting || 0}/${c.QUEUE_LIMIT} waiting)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                disabled={dispensing}
                className="btn-primary w-full justify-center py-3 text-sm font-semibold mt-2"
              >
                {dispensing ? 'Generating Token…' : '🎟️ Dispense Token & Pass'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─── TAB 3: TRACK MY TICKET & SEARCH ────────────────────────────── */}
      {activeTab === 'lookup' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="card p-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Ticket Status Tracker
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter your Token Number (e.g. <span className="font-mono font-semibold">BIL-2015</span>), ID Number (e.g. <span className="font-mono font-semibold">ID1015</span>), or Entry ID
            </p>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                className="input flex-1 font-mono uppercase"
                placeholder="e.g. BIL-015 or ID1001"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary px-5">
                <Search size={15} /> Track
              </button>
            </form>
          </div>

          {lookupError && <ErrorMessage message={lookupError} />}

          {searchedTicket && (
            <div className="space-y-4 animate-slide-up">
              <TokenTicket entry={searchedTicket} />
            </div>
          )}
        </div>
      )}

      {/* Modal for viewing any ticket */}
      {selectedTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md animate-slide-up">
            <button
              onClick={() => setSelectedTicketModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-1 text-xs font-semibold"
            >
              <X size={18} /> Close
            </button>
            <TokenTicket entry={selectedTicketModal} />
          </div>
        </div>
      )}
    </div>
  );
}
