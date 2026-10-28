import { CheckCircle2, Clock, LogOut } from 'lucide-react';

export default function StatusBadge({ status }) {
  if (status === 'Served')  return <span className="badge-served"><CheckCircle2 size={10} />Served</span>;
  if (status === 'Waiting') return <span className="badge-waiting"><Clock size={10} />Waiting</span>;
  if (status === 'Left')    return <span className="badge-left"><LogOut size={10} />Left</span>;
  return <span className="badge-inactive">{status}</span>;
}
