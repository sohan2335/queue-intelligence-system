import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Ticket, ShieldCheck, User, Lock, ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState('user'); // 'user' | 'admin'

  // User form
  const [idNumber, setIdNumber] = useState('');
  const [lastName, setLastName] = useState('');

  // Admin form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (role === 'user') {
        await login({ role: 'user', idNumber, lastName });
      } else {
        await login({ role: 'admin', username, password });
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo helpers
  const fillDemoVisitor = (id, last) => {
    setRole('user');
    setIdNumber(id);
    setLastName(last);
    setError(null);
  };

  const fillDemoAdmin = () => {
    setRole('admin');
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0c1a2e] transition-colors">
      <div className="max-w-md w-full space-y-6 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-500 text-white shadow-glow mb-1">
            <Ticket size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Queue Intelligence System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Campus Queue &amp; Digital Token Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-6 shadow-xl border border-slate-200/80 dark:border-slate-700/80">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl mb-6 border border-slate-200/50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setRole('user'); setError(null); }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                role === 'user'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User size={14} /> Visitor / Student
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(null); }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                role === 'admin'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={14} /> Admin / Staff
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-shake">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'user' ? (
              <>
                <div>
                  <label className="label">Campus ID Number *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. ID1001"
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      className="input pl-10 font-mono uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">From student/faculty campus ID card</p>
                </div>

                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kumar"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="input"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Admin Username *</label>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. admin"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span> Signing In…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In as {role === 'admin' ? 'Admin' : 'Visitor'} <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              Quick Demo Fill
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoVisitor('ID1001', 'Kumar')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <span className="font-semibold block text-slate-800 dark:text-slate-200">Ravi Kumar</span>
                <span className="text-[10px] text-slate-400 font-mono">ID1001 (Student)</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoVisitor('ID1003', 'Sharma')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <span className="font-semibold block text-slate-800 dark:text-slate-200">Amit Sharma</span>
                <span className="text-[10px] text-slate-400 font-mono">ID1003 (Faculty)</span>
              </button>
            </div>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full py-1.5 px-3 rounded-lg bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck size={13} /> Fill Demo Admin (admin / admin123)
            </button>
          </div>
        </div>

        {/* Feature summary */}
        <div className="grid grid-cols-2 gap-3 text-center text-[11px] text-slate-500">
          <div className="card p-3">
            <p className="font-bold text-slate-700 dark:text-slate-300">Visitor Account</p>
            <p className="text-[10px] text-slate-400">Take tokens, see live position &amp; AI wait</p>
          </div>
          <div className="card p-3">
            <p className="font-bold text-slate-700 dark:text-slate-300">Admin Account</p>
            <p className="text-[10px] text-slate-400">Dispense tickets, call queue, stats &amp; SQL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
