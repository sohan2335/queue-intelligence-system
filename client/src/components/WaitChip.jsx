import { waitBg } from '../utils';
import { Timer } from 'lucide-react';

export default function WaitChip({ minutes }) {
  if (minutes == null) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${waitBg(minutes)}`}>
      <Timer size={11} />
      {minutes} min
    </span>
  );
}
