import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { fetchSchoolSettingsApi } from '../../../api/settings';
import pirnavLogo from '../../../assets/pirnav-school-logo.png';

interface LoginViewProps {
  onBack?: () => void;
  initialRole?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack, initialRole }) => {
  const { login, sendOtp, verifyOtp, resetPasswordWithOtp } = useAuth();
  const { addToast } = useToast();

  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem('school_name') || '';
  });

  // Dynamic School Logo state (No default logo fallback)
  const [dynamicLogo, setDynamicLogo] = useState<string>(() => {
    return localStorage.getItem('school_logo') || localStorage.getItem('logoUrl') || '';
  });

  useEffect(() => {
    let isMounted = true;

    const updateLogo = () => {
      const savedLogo =
        localStorage.getItem('school_logo') ||
        localStorage.getItem('logoUrl') ||
        localStorage.getItem('schoolLogo') ||
        '';
      if (savedLogo) {
        setDynamicLogo(savedLogo);
      }
    };

    updateLogo();

    fetchSchoolSettingsApi()
      .then((res: any) => {
        if (!isMounted) return;
        const data = res?.data || res;
        if (data) {
          if (data.schoolName || data.name) {
            const name = data.schoolName || data.name;
            setSchoolName(name);
            localStorage.setItem('school_name', name);
          }
          const savedLogo =
            localStorage.getItem('school_logo') ||
            localStorage.getItem('logoUrl') ||
            localStorage.getItem('schoolLogo');
          const backendLogo = data.logoUrl || data.logo || data.schoolLogo || data.logoData;
          const effectiveLogo = backendLogo || savedLogo || pirnavLogo;

          if (effectiveLogo) {
            setDynamicLogo(effectiveLogo);
            localStorage.setItem('school_logo', effectiveLogo);
            localStorage.setItem('logoUrl', effectiveLogo);
            localStorage.setItem('schoolLogo', effectiveLogo);
          }
        }
      })
      .catch(() => {});

    window.addEventListener('school_profile_updated', updateLogo);
    window.addEventListener('storage', updateLogo);

    return () => {
      isMounted = false;
      window.removeEventListener('school_profile_updated', updateLogo);
      window.removeEventListener('storage', updateLogo);
    };
  }, []);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('remember_me') === 'true';
  });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modes: 'login' | 'forgot' | 'verify-otp' | 'reset-password'
  const [mode, setMode] = useState<'login' | 'forgot' | 'verify-otp' | 'reset-password'>('login');
  
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotIdentifierTouched, setForgotIdentifierTouched] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const [otp, setOtp] = useState('');
  const [otpTouched, setOtpTouched] = useState(false);
  const [otpSubmitted, setOtpSubmitted] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmNewPasswordTouched, setConfirmNewPasswordTouched] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  // High Resolution School Campus Background Image
  const bgCampusImage = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000&auto=format&fit=crop';

  // Load remembered credentials helper
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

  const [activeRole, setActiveRole] = useState<string | undefined>(initialRole);

  useEffect(() => {
    setActiveRole(initialRole);
  }, [initialRole]);

  const handleLoginSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoginSubmitted(true);
    if (!identifier.trim() || !password) {
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
      await login(identifier, password, activeRole as any);
      addToast('success', 'Authentication Successful', `Welcome to ${schoolName}!`);
    } catch (err: any) {
      const errorMessage = err?.message || '';
      if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('Failed to fetch')) {
        setError('The server is currently unreachable. Please try again later.');
      } else {
        setError(errorMessage || 'Invalid email/phone or password.');
      }
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
    if (!forgotIdentifier.trim()) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp(forgotIdentifier);
      addToast('info', 'OTP Sent', `Verification code sent to ${forgotIdentifier}.`);
      setMode('verify-otp');
    } catch (err) {
      setError('Failed to send OTP. Please check your contact information.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setOtpSubmitted(true);
    if (!otp.trim()) return;
    setError('');
    setLoading(true);
    try {
      await verifyOtp(forgotIdentifier, otp);
      addToast('success', 'OTP Verified', 'Please enter your new password.');
      setMode('reset-password');
    } catch (err) {
      setError('Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setResetSubmitted(true);
    if (!newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordWithOtp(forgotIdentifier, otp, newPassword);
      addToast('success', 'Password Reset Successful', 'You can now sign in with your new password.');
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
    <div className="min-h-screen w-full flex flex-col font-sans overflow-x-hidden relative text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white">
      
      {/* Full-Screen School Campus Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center scale-105 transition-all duration-1000"
        style={{ backgroundImage: `url(${bgCampusImage})` }}
      />
      
      {/* Dark Ambient Overlay */}
      <div className="fixed inset-0 z-0 backdrop-blur-[8px] bg-slate-950/65 dark:bg-slate-950/75 pointer-events-none transition-all" />

      {/* Top Left Corner: Simple Clean Back to Home Navigation */}
      {onBack && (
        <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-30">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/90 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      {/* MAIN CENTERED LOGIN PORTAL */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 z-10">
        
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
          
          {/* CENTERED SIGN IN CARD */}
          <div className="bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 rounded-3xl border border-white/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
            
            {/* School Logo & Title Header inside Card */}
            <div className="mb-6 flex flex-col items-center text-center space-y-2">
              {dynamicLogo && (
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-950 p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={dynamicLogo}
                    alt={schoolName || 'School Logo'}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {schoolName}
                </h1>
                {activeRole ? (
                  <div className="mt-1.5 flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      {activeRole === 'Admin' ? 'Administrator Portal' : `${activeRole} Portal`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveRole(undefined)}
                      className="text-[11px] text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      (Switch)
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider mt-0.5">
                    Sign In Portal
                  </p>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in slide-in-from-top-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* SINGLE LOGIN FORM FOR ALL USERS */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                
                {/* Email / Phone Identifier */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address or Phone Number <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500">
                      <Mail className="w-4.5 h-4.5 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => {
                        setIdentifier(e.target.value);
                        if (error) setError('');
                      }}
                      onBlur={() => setIdentifierTouched(true)}
                      onFocus={handleInputFocus}
                      onClick={handleInputFocus}
                      placeholder="Enter registered email or phone"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                        (!identifier.trim() && (identifierTouched || loginSubmitted))
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-sky-500/50 focus:border-sky-500'
                      }`}
                    />
                  </div>
                  {(!identifier.trim() && (identifierTouched || loginSubmitted)) && (
                    <p className="text-xs text-red-500 font-medium mt-1">Required</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500">
                      <Lock className="w-4.5 h-4.5 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      onFocus={handleInputFocus}
                      onClick={handleInputFocus}
                      placeholder="Enter your password"
                      className={`w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                        (!password && (passwordTouched || loginSubmitted))
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-sky-500/50 focus:border-sky-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide Password" : "Show Password"}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {(!password && (passwordTouched || loginSubmitted)) && (
                    <p className="text-xs text-red-500 font-medium mt-1">Required</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 dark:bg-slate-950 accent-sky-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Remember me
                      </span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-sky-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} noValidate className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1 mb-2 text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recover Password</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Enter your registered email or phone to receive an OTP code.
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email or Phone <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={e => setForgotIdentifier(e.target.value)}
                      onBlur={() => setForgotIdentifierTouched(true)}
                      placeholder="Enter registered email or phone"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                        (!forgotIdentifier.trim() && (forgotIdentifierTouched || forgotSubmitted))
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-sky-500/50 focus:border-sky-500'
                      }`}
                    />
                  </div>
                  {(!forgotIdentifier.trim() && (forgotIdentifierTouched || forgotSubmitted)) && (
                    <p className="text-xs text-red-500 font-medium mt-1">Required</p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/25 transition-all flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Send OTP Code <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* VERIFY OTP FORM */}
            {mode === 'verify-otp' && (
              <form onSubmit={handleVerifyOtpSubmit} noValidate className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1 mb-2 text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verify Code</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    We sent a 6-digit code to <span className="font-bold text-slate-900 dark:text-white">{forgotIdentifier}</span>
                  </p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Verification Code <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => setOtpTouched(true)}
                    placeholder="123456"
                    maxLength={6}
                    className={`w-full px-4 py-3 text-center tracking-[0.5em] text-2xl font-black rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
                      (!otp.trim() && (otpTouched || otpSubmitted))
                        ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-sky-500/50 focus:border-sky-500'
                    }`}
                  />
                  {(!otp.trim() && (otpTouched || otpSubmitted)) && (
                    <p className="text-xs text-red-500 font-medium mt-1">Required</p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Verify Code <CheckCircle2 className="w-4 h-4" /></>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {mode === 'reset-password' && (
              <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1 mb-2 text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Password</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Create a new password for your account.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      New Password <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      onBlur={() => setNewPasswordTouched(true)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                        (!newPassword && (newPasswordTouched || resetSubmitted))
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50 focus:border-emerald-500'
                      }`}
                    />
                    {(!newPassword && (newPasswordTouched || resetSubmitted)) && (
                      <p className="text-xs text-red-500 font-medium mt-1">Required</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confirm Password <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      onBlur={() => setConfirmNewPasswordTouched(true)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                        (!confirmNewPassword && (confirmNewPasswordTouched || resetSubmitted))
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/50 focus:border-emerald-500'
                      }`}
                    />
                    {(!confirmNewPassword && (confirmNewPasswordTouched || resetSubmitted)) && (
                      <p className="text-xs text-red-500 font-medium mt-1">Required</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmNewPassword}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Save & Sign In <CheckCircle2 className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
