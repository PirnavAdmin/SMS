import React, { useState, useEffect } from 'react';
import { School, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, Shield, GraduationCap, UserCircle2, ChevronDown, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { UserRole } from '../../../types';
import { fetchSchoolSettingsApi } from '../../../api/settings';

interface LoginViewProps {
  onBack?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack }) => {
  const { login, loginOffline, sendOtp, verifyOtp, resetPasswordWithOtp } = useAuth();
  const { addToast } = useToast();

  const [dynamicLogo, setDynamicLogo] = useState<string>(() => {
    return localStorage.getItem('school_logo') || localStorage.getItem('logoUrl') || '/pirnav-school-logo.png';
  });

  useEffect(() => {
    fetchSchoolSettingsApi()
      .then((res: any) => {
        const data = res?.data || res;
        if (data?.logoUrl) {
          setDynamicLogo(data.logoUrl);
          localStorage.setItem('school_logo', data.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('remember_me') === 'true';
  });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Admin');

  // Helper to load remembered credentials when user clicks/focuses input box or checks remember me
  const loadRememberedDetails = () => {
    const savedId = localStorage.getItem('remember_me_identifier');
    const savedPw = localStorage.getItem('remember_me_password');
    if (savedId && savedPw) {
      setIdentifier(savedId);
      setPassword(savedPw);
      setRememberMe(true);
    }
  };

  const handleInputFocus = () => {
    if (!identifier && !password) {
      loadRememberedDetails();
    }
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    if (isChecked && !identifier && !password) {
      loadRememberedDetails();
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modes: 'login' | 'forgot' | 'verify-otp' | 'reset-password'
  const [mode, setMode] = useState<'login' | 'forgot' | 'verify-otp' | 'reset-password'>('login');
  
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // High quality school campus image
  const bgImageUrl = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000&auto=format&fit=crop';
  
  const handleLoginSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in both fields.');
      return;
    }
    if (rememberMe) {
      localStorage.setItem('remember_me', 'true');
      localStorage.setItem('remember_me_identifier', identifier);
      localStorage.setItem('remember_me_password', password);
    } else {
      localStorage.removeItem('remember_me');
      localStorage.removeItem('remember_me_identifier');
      localStorage.removeItem('remember_me_password');
    }
    setError('');
    setLoading(true);
    try {
      await login(identifier, password, role);
      addToast('success', 'Authentication Successful', `Welcome to Pirnav Educational Institution!`);
    } catch (err: any) {
      const errorMessage = err?.message || '';
      if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('Failed to fetch')) {
        setError('The server is currently unreachable. Please try again later.');
      } else {
        setError(errorMessage || 'Invalid credentials.');
      }
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

  const currentLogo = dynamicLogo || (typeof window !== 'undefined'
    ? (localStorage.getItem('school_logo') || localStorage.getItem('logoUrl') || '/pirnav-school-logo.png')
    : '/pirnav-school-logo.png');

  return (
    <div className="h-screen w-full flex font-sans overflow-hidden relative bg-brand-950">
      {/* Background Image spanning the entire page */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-70 animate-in fade-in zoom-in-105 duration-[2000ms] z-0"
        style={{ backgroundImage: `url(${bgImageUrl})` }}
      />
      
      {/* Deep Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-brand-900/60 to-sky-900/80 z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/40 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/40 rounded-full blur-[100px] z-0 pointer-events-none" />

      {/* LEFT SIDE: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden z-10">


        {/* Content Wrapper */}
        <div className="relative z-20 w-full max-w-2xl text-white space-y-12">
          <div>
            <div className="inline-flex p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl mb-8">
              <img src={currentLogo} alt="School Logo" className="h-16 max-w-[200px] object-contain" />
            </div>
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Empowering the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">Next Generation</span>
            </h1>
            <p className="text-lg xl:text-xl text-brand-100 font-medium leading-relaxed max-w-xl">
              Pirnav Educational Institution provides a world-class digital campus experience. Manage academics, admissions, and administration effortlessly.
            </p>
          </div>

          {/* Floating Feature Cards */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-xl flex items-start gap-4 transform hover:-translate-y-1 transition-transform duration-300">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Academic Excellence</h3>
                <p className="text-sm text-brand-200 mt-1">Structured curriculum and live analytics.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-xl flex items-start gap-4 transform hover:-translate-y-1 transition-transform duration-300 delay-100">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Secure & Reliable</h3>
                <p className="text-sm text-brand-200 mt-1">Enterprise-grade security for your data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex flex-col relative z-10 overflow-y-auto justify-center">

        <div className="relative z-10 w-full max-w-[480px] mx-auto px-4 sm:px-12 flex flex-col min-h-full py-4 sm:py-6">
          {onBack && (
            <div className="mb-4">
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl sm:rounded-[2rem] border border-white/20 dark:border-slate-800/50 shadow-2xl mt-auto mb-auto backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
            {/* Minimalist Universal Header */}
          <div className="mb-6">
            <div className="lg:hidden inline-flex p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md mb-4 max-w-[160px]">
              <img src={currentLogo} alt="School Logo" className="h-10 object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
          </div>

          {error && (
            <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm font-semibold animate-in slide-in-from-top-2 fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                
                {/* Identifier */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Email or Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      onFocus={handleInputFocus}
                      onClick={handleInputFocus}
                      placeholder="Enter your email or phone"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={handleInputFocus}
                      onClick={handleInputFocus}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-12 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium placeholder:tracking-normal tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500/40 dark:bg-slate-900 accent-brand-600 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold transition-colors hover:underline decoration-brand-400/50 underline-offset-4"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-slate-900/10 dark:shadow-brand-600/20 transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
              
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reset Password</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Enter your email or phone number to receive recovery instructions.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Email or Phone</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={e => setForgotIdentifier(e.target.value)}
                    placeholder="Enter email or phone"
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white font-bold text-base shadow-xl shadow-slate-900/10 dark:shadow-brand-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send OTP Code <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-4 rounded-2xl bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* VERIFY OTP FORM */}
          {mode === 'verify-otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Verify Code</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  We've sent a 6-digit code to <span className="font-bold text-slate-800 dark:text-slate-200">{forgotIdentifier}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Verification Code</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    required
                    maxLength={6}
                    className="w-full px-4 py-4 text-center tracking-[0.75em] placeholder:tracking-normal text-3xl font-black rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white font-bold text-base shadow-xl shadow-slate-900/10 dark:shadow-brand-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Continue <CheckCircle2 className="w-5 h-5" /></>}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-4 rounded-2xl bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">New Password</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Create a new, strong password for your account.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium tracking-wider"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmNewPassword}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Save & Login <CheckCircle2 className="w-5 h-5" /></>}
                </button>
              </div>
            </form>
          )}

          
          
          </div>

          {/* Footer */}
          <div className="mt-8 pb-4">
            <p className="text-xs text-center text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} Pirnav Educational Institution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
