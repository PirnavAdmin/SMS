import React, { useState } from 'react';
import { School, Lock, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { UserRole } from '../../../types';

export const LoginView: React.FC = () => {
  const { login, forgotPassword } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('admin@stxaviers.edu');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState<UserRole>('Admin');
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, role);
      addToast('success', 'Welcome back!', `Logged in as ${role}`);
    } catch {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    await forgotPassword(forgotEmail);
    addToast('info', 'Password Reset Sent', `Check ${forgotEmail} for recovery link.`);
    setLoading(false);
    setIsForgotMode(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30 mb-2">
            <School className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">EduPulse Academy</h2>
          <p className="text-xs text-slate-400">School Management System & Admin Portal</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isForgotMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Switcher Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Login Role</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700">
                {(['Admin', 'Teacher', 'Accountant'] as UserRole[]).map(r => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      role === r ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@stxaviers.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotMode(true)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>

            {/* Demo Quick Fill */}
            <div className="pt-2">
              <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider mb-2 font-bold">Quick Demo Login</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@stxaviers.edu'); setRole('Admin'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-brand-400" /> Admin Demo
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('j.miller@stxaviers.edu'); setRole('Teacher'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-300 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Teacher Demo
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-white">Reset Password</h3>
            <p className="text-xs text-slate-400">Enter your registered email to receive a password reset link.</p>
            <div>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="email@stxaviers.edu"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsForgotMode(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
