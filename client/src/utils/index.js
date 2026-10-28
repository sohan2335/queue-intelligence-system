// Wait time colour logic
export function waitColor(minutes) {
  if (minutes == null) return 'text-slate-400';
  if (minutes < 10)  return 'text-emerald-600 dark:text-emerald-400';
  if (minutes <= 15) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function waitBg(minutes) {
  if (minutes == null) return 'bg-slate-100 text-slate-500';
  if (minutes < 10)  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
  if (minutes <= 15) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
}

// Parse "HH:MM-HH:MM" peak hours string
export function parsePeakHours(str) {
  if (!str) return null;
  const [start, end] = str.split('-');
  return { start, end };
}

// Convert "HH:MM" to minutes since midnight
export function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Format date string nicely
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Get initials from first/last name
export function initials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

// Department colour
const deptColors = {
  IT:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  CSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  ECE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  EEE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  ME:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  CE:  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
};
export function deptColor(dept) {
  return deptColors[dept] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

// Visitor type colour
export function visitorTypeColor(type) {
  if (type === 'Faculty') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400';
  if (type === 'Staff')   return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}
