import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar   from './components/Sidebar';
import MobileNav from './components/MobileNav';

const Login = lazy(() => import('./pages/Login'));
const UserPortal = lazy(() => import('./pages/UserPortal'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Locations = lazy(() => import('./pages/Locations'));
const LiveQueue = lazy(() => import('./pages/LiveQueue'));
const Predictions = lazy(() => import('./pages/Predictions'));
const Visitors = lazy(() => import('./pages/Visitors'));
const JoinQueue = lazy(() => import('./pages/JoinQueue'));
const Tokens = lazy(() => import('./pages/Tokens'));

function ProtectedLayout({ children }) {
  const { user, checking } = useAuth();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0c1a2e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1a2e] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* Home: Admin lands on Dashboard, Visitor lands on UserPortal */}
      <Route path="/" element={isAdmin ? <Dashboard /> : <UserPortal />} />

      {/* Shared routes */}
      <Route path="/tokens"    element={<Tokens />} />
      <Route path="/locations" element={<Locations />} />

      {/* Admin-only routes */}
      <Route path="/live-queue" element={<AdminRoute><LiveQueue /></AdminRoute>} />
      <Route path="/predictions" element={<AdminRoute><Predictions /></AdminRoute>} />
      <Route path="/visitors" element={<AdminRoute><Visitors /></AdminRoute>} />
      <Route path="/join-queue" element={<AdminRoute><JoinQueue /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<p className="p-6 text-slate-500">Loading…</p>}><ProtectedLayout>
            <AppRoutes />
          </ProtectedLayout></Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
