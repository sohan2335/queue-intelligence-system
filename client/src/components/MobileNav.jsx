import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, MapPin, ListOrdered,
  Brain, Users, PlusCircle, Activity, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const { isAdmin, logout } = useAuth();

  const adminLinks = [
    { to: '/',               label: 'Home',      icon: LayoutDashboard },
    { to: '/tokens',         label: 'Tokens',    icon: Ticket          },
    { to: '/locations',      label: 'Locations', icon: MapPin           },
    { to: '/live-queue',     label: 'Queue',     icon: ListOrdered      },
    { to: '/predictions',    label: 'Predict',   icon: Brain            },
    { to: '/visitors',       label: 'Visitors',  icon: Users            },
    { to: '/join-queue',     label: 'Issue',     icon: PlusCircle       },
  ];

  const userLinks = [
    { to: '/',               label: 'My Tickets', icon: Ticket         },
    { to: '/tokens',         label: 'Board',      icon: Activity       },
    { to: '/locations',      label: 'Locations',  icon: MapPin         },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 safe-area-pb">
      <div className="flex overflow-x-auto scrollbar-thin">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 flex-1 min-w-[64px] py-2 px-1 text-xs font-medium transition-colors
               ${isActive
                 ? 'text-primary-600 dark:text-primary-400'
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}>
                  <Icon size={18} />
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button onClick={logout} aria-label="Sign Out" className="flex flex-col items-center gap-1 min-w-[64px] py-3 text-xs text-slate-500"><LogOut size={18} />Sign Out</button>
      </div>
    </nav>
  );
}
