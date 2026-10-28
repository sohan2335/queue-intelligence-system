import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import {
  Printer, Check, Copy, Clock, MapPin, User,
  Sparkles
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import WaitChip from './WaitChip';
import { formatDate } from '../utils';

// Helper to generate a realistic barcode pattern
function BarcodePattern({ value }) {
  const bars = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 1, 3, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1];
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end h-10 gap-0.5 px-2">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className={`bg-slate-900 dark:bg-slate-100 rounded-xs ${
              idx % 2 === 0 ? 'opacity-100' : 'opacity-85'
            }`}
            style={{ width: `${w * 1.5}px`, height: idx % 5 === 0 ? '100%' : '80%' }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] tracking-widest text-slate-500 dark:text-slate-400 mt-1 uppercase">
        *{value || 'QIS-PASS'}*
      </p>
    </div>
  );
}

function QRCodeSim({ value }) {
  return <QRCodeSVG value={value} size={64} marginSize={2} bgColor="#ffffff" fgColor="#0f172a" aria-label="Scannable ticket QR code" />;
}

export default function TokenTicket({
  entry,
  prediction: explicitPrediction,
  showPrint = true,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const visitor = entry.visitor || {};
  const counter = entry.counter || {};
  const location = entry.location || counter.location || {};
  const prediction = explicitPrediction || entry.prediction || {};

  const tokenNumber =
    entry.TOKEN_NUMBER ||
    `T-${entry.ENTRY_ID}`;

  const queuePosition = entry.QUEUE_POSITION ?? null;
  const isWaiting = entry.STATUS === 'Waiting';
  const isCalling = entry.STATUS === 'Calling';

  const handleCopy = () => {
    navigator.clipboard.writeText(tokenNumber).catch(() => setCopied(false));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`ticket-print relative overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl max-w-md w-full mx-auto print:border-none print:shadow-none print:p-0 ${className}`}
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-cyan-600 to-teal-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-85">
              Campus Queue Pass
            </span>
            <h3 className="text-base font-extrabold tracking-tight">
              Queue Intelligence System
            </h3>
          </div>
          <StatusBadge status={entry.STATUS} />
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 space-y-5">
        {/* Token Number & Queue Position */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 rounded-2xl">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Token Number
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-3xl font-extrabold font-mono text-primary-600 dark:text-primary-400">
                {tokenNumber}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                title="Copy Token Number"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            {isCalling ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                🔔 NOW CALLING
              </span>
            ) : isWaiting && queuePosition != null ? (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Queue Position
                </span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                  #{queuePosition} <span className="text-xs font-normal text-slate-400">in line</span>
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Entry ID
                </span >
                <p className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
                  #{entry.ENTRY_ID}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Counter & Location Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Counter
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
              {counter.COUNTER_NAME || 'Counter'}
            </span>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              {counter.SERVICE_TYPE || 'General Service'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Location
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              {location.LOCATION_NAME || 'Campus Counter'}
            </span>
            <span className="text-xs text-slate-500">
              Hours: {counter.OPEN_TIME || '08:00'}–{counter.CLOSE_TIME || '17:00'}
            </span>
          </div>
        </div>

        {/* Visitor Info */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
              <User size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {visitor.FIRST_NAME ? `${visitor.FIRST_NAME} ${visitor.LAST_NAME}` : 'Visitor'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {visitor.ID_NUMBER || 'ID Number'} · {visitor.DEPARTMENT || 'Dept'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {visitor.VISITOR_TYPE || 'Visitor'}
          </span>
        </div>

        {/* Time & AI Wait Prediction */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium block">Arrival Time</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              {entry.ARRIVAL_TIME || '--:--'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {formatDate(entry.ENTRY_DATE)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium block">Wait Time</span>
            <div className="mt-1">
              <WaitChip minutes={isWaiting || isCalling ? entry.ESTIMATED_WAIT : entry.WAIT_MINUTES} />
            </div>
            {prediction.PREDICTED_WAIT != null && (
              <span className="text-[10px] text-slate-400 block mt-1">
                Pred: ~{prediction.PREDICTED_WAIT} min
              </span>
            )}
          </div>
        </div>

        {/* AI Best Slot Recommendation */}
        {prediction.BEST_SLOT && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Optimal Visiting Window
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Recommended slot: <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{prediction.BEST_SLOT}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Perforated Divider */}
        <div className="relative py-2">
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700" />
          <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#0c1a2e]" />
          <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#0c1a2e]" />
        </div>

        {/* Barcode & QR Code Section */}
        <div className="flex items-center justify-between pt-1">
          <BarcodePattern value={`${tokenNumber}-${visitor.ID_NUMBER || 'ID'}`} />
          <QRCodeSim value={`TOKEN:${tokenNumber};COUNTER:${counter.COUNTER_ID}`} />
        </div>

        {/* Print / Action Buttons */}
        {showPrint && (
          <div className="pt-2 flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="btn-primary flex-1 justify-center py-2.5 text-xs font-semibold"
            >
              <Printer size={15} /> Print Ticket Slip
            </button>
            <button
              onClick={handleCopy}
              className="btn-secondary px-3 py-2.5 text-xs"
              title="Copy Token"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
