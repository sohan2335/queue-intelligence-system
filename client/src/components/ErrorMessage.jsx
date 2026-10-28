import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Something went wrong</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4 gap-2">
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
