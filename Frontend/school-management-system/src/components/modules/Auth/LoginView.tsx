import React, { useState } from 'react';
import { School, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { UserRole } from '../../../types';

export const LoginView: React.FC = () => {
  const { login, sendOtp, verifyOtp, resetPasswordWithOtp } = useAuth();
  const { addToast } = useToast();

  const [identifier, setIdentifier] = useState('javvadivenkat999@gmail.com');
  const [password, setPassword] = useState('venkat');
  const [role] = useState<UserRole>('Admin');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modes: 'login' | 'forgot' | 'verify-otp' | 'reset-password'
  const [mode, setMode] = useState<'login' | 'forgot' | 'verify-otp' | 'reset-password'>('login');
  
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLoginSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in both fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(identifier, password, role);
      addToast('success', 'Authentication Successful', `Welcome to Pirnav Educational Institution!`);
    } catch {
      setError('Invalid credentials.');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!forgotIdentifier) return;
    setLoading(true);
    try {
      await sendOtp(forgotIdentifier);
      addToast('info', 'OTP Sent', `We sent a verification code to ${forgotIdentifier}.`);
      setMode('verify-otp');
    } catch (err) {
      setError('Failed to send OTP. Please check your contact info.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      await verifyOtp(forgotIdentifier, otp);
      addToast('success', 'OTP Verified', 'Please enter your new password.');
      setMode('reset-password');
    } catch (err) {
      setError('Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordWithOtp(forgotIdentifier, otp, newPassword);
      addToast('success', 'Password Reset Successful', 'You can now login with your new password.');
      setMode('login');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotIdentifier('');
    } catch (err) {
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0f1c] flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 dark:bg-indigo-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 dark:bg-violet-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[420px] perspective-1000 transition-all duration-500">
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-8 shadow-2xl shadow-indigo-900/5 dark:shadow-indigo-900/20 transition-all duration-500 transform hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20">
          
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <School className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                Pirnav Educational Institution
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Secure Access Portal</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium animate-in slide-in-from-top-2 fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-4">
                {/* Identifier */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email or Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter your email or phone"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors hover:underline decoration-indigo-400/50 underline-offset-4"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                

              </div>
            </form>
          )}



          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your email or phone number to receive recovery instructions.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={e => setForgotIdentifier(e.target.value)}
                    placeholder="Email or Phone Number"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send OTP Code'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-3.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-all"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* VERIFY OTP FORM */}
          {mode === 'verify-otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verify OTP</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter the code we sent to <span className="font-semibold text-slate-800 dark:text-slate-200">{forgotIdentifier}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="w-full px-4 py-4 text-center tracking-[0.5em] text-2xl font-black rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-3.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Set New Password</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Choose a new strong password for your account.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmNewPassword}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Password & Login'}
                </button>
              </div>
            </form>
          )}

        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            &copy; {new Date().getFullYear()} Pirnav Educational Institution. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
