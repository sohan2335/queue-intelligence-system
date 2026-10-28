import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, MapPin, ListOrdered, Brain,
  Users, PlusCircle, Moon, Sun, Activity,
  LogOut, User, ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { dark, toggle } = useTheme();
  const { user, isAdmin, logout } = useAuth();

  const adminLinks = [
    { to: '/',              label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/tokens',        label: 'Tokens & Calling', icon: Ticket      },
    { to: '/locations',     label: 'Locations',   icon: MapPin           },
    { to: '/live-queue',    label: 'Live Queue',  icon: ListOrdered      },
    { to: '/predictions',   label: 'Predictions', icon: Brain            },
    { to: '/visitors',      label: 'Visitors',    icon: Users            },
    { to: '/join-queue',    label: 'Issue Ticket',icon: PlusCircle       },
  ];

  const userLinks = [
    { to: '/',              label: 'My Tickets',  icon: Ticket           },
    { to: '/tokens',        label: 'Counter Board', icon: Activity       },
    { to: '/locations',     label: 'Locations',   icon: MapPin           },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
          <Activity size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Queue IQ</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Campus Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {isAdmin ? 'Admin Menu' : 'Student / Visitor'}
          </p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isAdmin
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
          }`}>
            {isAdmin ? 'ADMIN' : 'USER'}
          </span>
        </div>

        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
        {/* User Card */}
        {user && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  {user.idNumber || user.role}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="btn-ghost w-full justify-between py-1.5 text-xs"
          aria-label="Toggle dark mode"
        >
          <span className="flex items-center gap-2">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </span>
          <span className={`w-8 h-4 rounded-full transition-colors duration-200 relative ${dark ? 'bg-primary-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${dark ? 'left-4' : 'left-0.5'}`} />
          </span>
        </button>
      </div>
    </aside>
  );
}
