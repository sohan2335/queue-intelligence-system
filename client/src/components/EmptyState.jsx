import { SearchX } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description = 'Try adjusting your filters.', icon: Icon = SearchX }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>
    </div>
  );
}
