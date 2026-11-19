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
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  Phone,
  Building2,
  MapPin,
  Globe,
  BookOpen,
  Users,
  UserCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { fetchSchoolSettingsApi } from '../../../api/settings';
import { getSuperAdminSetupStatusApi, setupInitialSuperAdminApi, fetchCompanyProfileApi } from '../../../api/superadmin';
import { useTenant } from '../../../context/TenantContext';
import { applySchoolBranding } from '../../../utils/brandingUtils';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

interface LoginViewProps {
  onBack?: () => void;
  initialRole?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBack, initialRole }) => {
  const { login, sendOtp, verifyOtp, resetPasswordWithOtp } = useAuth();
  const { addToast } = useToast();
  const { tenant } = useTenant();

  // Dynamic Logo & Profile resolution with strict SuperAdmin vs School Admin isolation
  const isSuperAdminLogin = initialRole === 'Super Admin';

  const [superAdminBranding, setSuperAdminBranding] = useState<{
    logoUrl: string;
    companyName: string;
    tagline: string;
    address: string;
    supportEmail: string;
    supportPhone: string;
    websiteUrl: string;
  }>({
    logoUrl: '',
    companyName: '',
    tagline: '',
    address: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
  });

  const getTenantLogo = () => {
    return localStorage.getItem('tenant_school_logo') || localStorage.getItem('school_logo') || '';
  };

  const [schoolProfile, setSchoolProfile] = useState<{
    schoolName: string;
    logoUrl: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    boardType: string;
    principalName: string;
  }>(() => {
    let savedProfile: any = null;
    try {
      const raw = localStorage.getItem('edu_db_profile') || localStorage.getItem('profile');
      if (raw) savedProfile = JSON.parse(raw);
    } catch {}

    const localLogo = getTenantLogo();
    const tLogo = tenant?.logoUrl || '';
    const cleanTLogo = !tLogo.includes('pirnav') ? tLogo : '';

    return {
      schoolName: savedProfile?.name || savedProfile?.schoolName || localStorage.getItem('school_name') || (tenant?.companyName && !tenant.companyName.includes('Pirnav') ? tenant.companyName : '') || '',
      logoUrl: savedProfile?.logoUrl || localLogo || cleanTLogo || '',
      tagline: savedProfile?.tagline || localStorage.getItem('school_tagline') || '',
      address: savedProfile?.address || localStorage.getItem('school_address') || '',
      phone: savedProfile?.phone || localStorage.getItem('school_phone') || '',
      email: savedProfile?.email || localStorage.getItem('school_email') || '',
      website: savedProfile?.website || localStorage.getItem('school_website') || '',
      boardType: savedProfile?.boardType || '',
      principalName: savedProfile?.principalName || '',
    };
  });

  // 1. Fetch Super Admin profile when logging in as Super Admin
  useEffect(() => {
    if (isSuperAdminLogin) {
      fetchCompanyProfileApi()
        .then(p => {
          if (p) {
            setSuperAdminBranding({
              logoUrl: p.logoUrl || '',
              companyName: p.companyName || '',
              tagline: p.tagline || '',
              address: p.address || '',
              supportEmail: p.supportEmail || '',
              supportPhone: p.supportPhone || '',
              websiteUrl: p.websiteUrl || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdminLogin]);

  // 2. Fetch School Profile (when School Admin edits profile, this syncs live from DB & events)
  useEffect(() => {
    if (isSuperAdminLogin) return;
    let isMounted = true;

    const loadBranding = async () => {
      try {
        const res: any = await fetchSchoolSettingsApi();
        const data = res?.data || res;
        if (data && isMounted) {
          const sName = data.schoolName || data.SchoolName || data.name || data.Name || '';
          const sLogo = data.logoUrl || data.LogoUrl || '';
          const sTagline = data.tagline || data.Tagline || '';
          const sAddress = data.address || data.Address || '';
          const sPhone = data.phone || data.Phone || '';
          const sEmail = data.email || data.Email || '';
          const sWebsite = data.website || data.Website || '';
          const sBoardType = data.boardType || data.BoardType || '';
          const sPrincipal = data.principalName || data.PrincipalName || '';

          setSchoolProfile({
            schoolName: sName,
            logoUrl: sLogo,
            tagline: sTagline,
            address: sAddress,
            phone: sPhone,
            email: sEmail,
            website: sWebsite,
            boardType: sBoardType,
            principalName: sPrincipal,
          });

          if (sName) {
            applySchoolBranding(sName, sLogo);
          }
        }
      } catch {
        try {
          const raw = localStorage.getItem('edu_db_profile') || localStorage.getItem('profile');
          if (raw && isMounted) {
            const parsed = JSON.parse(raw);
            setSchoolProfile(prev => ({
              ...prev,
              schoolName: parsed.name || parsed.schoolName || prev.schoolName,
              logoUrl: parsed.logoUrl || prev.logoUrl,
              tagline: parsed.tagline || prev.tagline,
              address: parsed.address || prev.address,
              phone: parsed.phone || prev.phone,
              email: parsed.email || prev.email,
              website: parsed.website || prev.website,
              boardType: parsed.boardType || prev.boardType,
            }));
          }
        } catch {}
      }
    };

    loadBranding();

    const updateProfile = () => {
      loadBranding();
    };

    window.addEventListener('school_branding_updated', updateProfile);
    window.addEventListener('school_profile_updated', updateProfile);
    window.addEventListener('storage', updateProfile);

    return () => {
      isMounted = false;
      window.removeEventListener('school_branding_updated', updateProfile);
      window.removeEventListener('school_profile_updated', updateProfile);
      window.removeEventListener('storage', updateProfile);
    };
  }, [isSuperAdminLogin, tenant?.logoUrl, tenant?.companyName]);

  // Prioritize configured School Branding over generic multi-tenant defaults
  const effectiveLogo = isSuperAdminLogin
    ? superAdminBranding.logoUrl
    : (schoolProfile.logoUrl || (tenant?.logoUrl && !tenant.logoUrl.includes('pirnav') ? tenant.logoUrl : '') || '');

  const effectiveName = isSuperAdminLogin
    ? (superAdminBranding.companyName || 'Super Admin Portal')
    : (schoolProfile.schoolName || (tenant?.companyName && !tenant.companyName.includes('Pirnav') ? tenant.companyName : '') || 'Campus Portal');

  const effectiveTagline = isSuperAdminLogin
    ? (superAdminBranding.tagline || 'Multi-Tenant Central Administration')
    : (schoolProfile.tagline || 'Empowering Minds, Shaping Tomorrow');

  const effectiveAddress = isSuperAdminLogin ? (superAdminBranding.address || '') : schoolProfile.address;
  const effectivePhone = isSuperAdminLogin ? superAdminBranding.supportPhone : schoolProfile.phone;
  const effectiveEmail = isSuperAdminLogin ? superAdminBranding.supportEmail : schoolProfile.email;
  const effectiveWebsite = isSuperAdminLogin ? superAdminBranding.websiteUrl : schoolProfile.website;
  const effectiveBoard = isSuperAdminLogin ? '' : schoolProfile.boardType;

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return localStorage.getItem('remember_me') === 'true';
    } catch {
      return false;
    }
  });
  const [identifier, setIdentifier] = useState<string>(() => {
    try {
      if (localStorage.getItem('remember_me') === 'true') {
        return localStorage.getItem('remember_me_identifier') || '';
      }
    } catch {}
    return '';
  });
  const [password, setPassword] = useState<string>(() => {
    try {
      if (localStorage.getItem('remember_me') === 'true') {
        return localStorage.getItem('remember_me_password') || '';
      }
    } catch {}
    return '';
  });
  const [showPassword, setShowPassword] = useState(false);

  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  // Re-hydrate remembered credentials on mount
  useEffect(() => {
    try {
      const isRemembered = localStorage.getItem('remember_me') === 'true';
      if (isRemembered) {
        setRememberMe(true);
        const savedId = localStorage.getItem('remember_me_identifier') || '';
        const savedPw = localStorage.getItem('remember_me_password') || '';
        if (savedId) setIdentifier(savedId);
        if (savedPw) setPassword(savedPw);
      }
    } catch {}
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modes: 'login' | 'forgot' | 'verify-otp' | 'reset-password' | 'setup-superadmin'
  const [mode, setMode] = useState<'login' | 'forgot' | 'verify-otp' | 'reset-password' | 'setup-superadmin'>('login');
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  // Setup form state
  const [saSetupForm, setSaSetupForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showSaPassword, setShowSaPassword] = useState(false);
  const [showSaConfirmPassword, setShowSaConfirmPassword] = useState(false);

  // Only check setup status if explicitly navigating to setup mode (not on standard login mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#setup' || window.location.hash === '#setup-superadmin')) {
      let isMounted = true;
      getSuperAdminSetupStatusApi()
        .then(res => {
          if (!isMounted) return;
          if (!res.isConfigured || res.superAdminCount === 0) {
            setIsSetupRequired(true);
            setMode('setup-superadmin');
          }
        })
        .catch(() => {});

      return () => { isMounted = false; };
    }
  }, []);

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

  // High Resolution Anime Scenery Artwork Background in School Theme Colors (Sky / Twilight Blue)
  const animeBgImage = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop';

  // Floating Starlight Particles Configuration (Sky & Cyan Theme)
  const starlightParticles = [
    { left: '6%', delay: '0s', duration: '11s', size: 4 },
    { left: '14%', delay: '2.5s', duration: '13s', size: 5 },
    { left: '24%', delay: '4s', duration: '9s', size: 3 },
    { left: '34%', delay: '1s', duration: '14s', size: 6 },
    { left: '44%', delay: '5.5s', duration: '10s', size: 4 },
    { left: '54%', delay: '3s', duration: '12s', size: 5 },
    { left: '64%', delay: '0.5s', duration: '15s', size: 3 },
    { left: '74%', delay: '4.5s', duration: '11s', size: 5 },
    { left: '84%', delay: '2s', duration: '13s', size: 4 },
    { left: '94%', delay: '1.5s', duration: '9.5s', size: 3 },
    { left: '18%', delay: '6s', duration: '14s', size: 4 },
    { left: '50%', delay: '7s', duration: '10.5s', size: 5 },
    { left: '78%', delay: '6.5s', duration: '12.5s', size: 4 },
    { left: '88%', delay: '8s', duration: '11s', size: 3 }
  ];

  // Listen for session expiration events
  useEffect(() => {
    try {
      const isTimeout = localStorage.getItem('session_timeout_occurred');
      if (isTimeout) {
        localStorage.removeItem('session_timeout_occurred');
        setError('Your session has expired. Please sign in again to continue.');
      }
    } catch {}

    const handleSessionExpired = () => {
      setError('Your session has expired. Please sign in again to continue.');
    };
    window.addEventListener('session_expired', handleSessionExpired);
    return () => window.removeEventListener('session_expired', handleSessionExpired);
  }, []);

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    try {
      if (isChecked) {
        localStorage.setItem('remember_me', 'true');
        if (identifier.trim()) {
          localStorage.setItem('remember_me_identifier', identifier.trim());
        }
        if (password) {
          localStorage.setItem('remember_me_password', password);
        }
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('remember_me_identifier');
        localStorage.removeItem('remember_me_password');
      }
    } catch {}
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (error) setError('');
    if (rememberMe) {
      try {
        localStorage.setItem('remember_me_identifier', value.trim());
      } catch {}
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (error) setError('');
    if (rememberMe && initialRole !== 'Super Admin') {
      try {
        localStorage.setItem('remember_me_password', value);
      } catch {}
    }
  };

  // Validation helpers
  const getIdentifierError = () => {
    if (!identifier.trim()) {
      return (identifierTouched || loginSubmitted)
        ? (initialRole === 'Super Admin' ? 'Super Admin email or username is required' : 'Email, mobile or Student ID is required')
        : '';
    }
    const clean = identifier.trim();
    if (initialRole === 'Super Admin') {
      return '';
    }
    if (clean.includes('@')) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(clean) && (identifierTouched || loginSubmitted)) {
        return 'Invalid email address';
      }
    } else {
      const isPureDigitsOrPhone = /^[0-9+\-\s()]+$/.test(clean);
      const digits = clean.replace(/\D/g, '');
      if (isPureDigitsOrPhone && digits.length > 0 && digits.length < 8 && (identifierTouched || loginSubmitted)) {
        return 'Invalid phone number';
      }
    }
    return '';
  };

  const getPasswordError = () => {
    if (!password) {
      return (passwordTouched || loginSubmitted) ? 'Password is required' : '';
    }
    if (password.length < 4 && (passwordTouched || loginSubmitted)) {
      return 'Password must be at least 4 characters';
    }
    return '';
  };

  const handleLoginSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoginSubmitted(true);

    const idErr = getIdentifierError();
    const pwErr = getPasswordError();
    if (idErr || pwErr || !identifier.trim() || !password) {
      return;
    }

    if (rememberMe && initialRole !== 'Super Admin') {
      localStorage.setItem('remember_me', 'true');
      localStorage.setItem('remember_me_identifier', identifier.trim());
      localStorage.setItem('remember_me_password', password);
    } else {
      localStorage.removeItem('remember_me');
      localStorage.removeItem('remember_me_identifier');
      localStorage.removeItem('remember_me_password');
    }

    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password, initialRole as any);
      addToast('success', 'Authentication Successful', `Welcome back to ${effectiveName}!`);
    } catch (err: any) {
      const errorMessage = err?.message || '';
      if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Server unreachable. Please try again.');
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('credential') || errorMessage.toLowerCase().includes('user not found')) {
        setError('Invalid email/phone or password');
      } else if (errorMessage.toLowerCase().includes('inactive') || errorMessage.toLowerCase().includes('disabled')) {
        setError('Account is inactive. Contact admin.');
      } else {
        setError(errorMessage || 'Sign in failed');
      }
      setLoading(false);
    }
  };

  const handleSetupSuperAdminSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!saSetupForm.fullName.trim() || !saSetupForm.email.trim() || !saSetupForm.mobileNumber.trim() || !saSetupForm.password) {
      setError('All fields are required to create the Super Admin account.');
      return;
    }
    if (saSetupForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (saSetupForm.password !== saSetupForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await setupInitialSuperAdminApi({
        fullName: saSetupForm.fullName.trim(),
        email: saSetupForm.email.trim(),
        mobileNumber: saSetupForm.mobileNumber.trim(),
        password: saSetupForm.password
      });

      addToast('success', 'Super Admin Configured', `Account created for ${saSetupForm.fullName}!`);
      await login(saSetupForm.email.trim(), saSetupForm.password, 'Super Admin' as any);
      setIsSetupRequired(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to setup Super Admin account.');
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
      await sendOtp(forgotIdentifier.trim());
      addToast('info', 'OTP Sent', `Verification code sent to ${forgotIdentifier.trim()}.`);
      setMode('verify-otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setOtpSubmitted(true);
    if (!otp.trim() || otp.trim().length < 6) return;
    setError('');
    setLoading(true);
    try {
      await verifyOtp(forgotIdentifier.trim(), otp.trim());
      addToast('success', 'OTP Verified', 'Please set your new password.');
      setMode('reset-password');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setResetSubmitted(true);
    if (!newPassword || !confirmNewPassword) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordWithOtp(forgotIdentifier.trim(), otp.trim(), newPassword);
      addToast('success', 'Password Reset Successful', 'You can now sign in with your new password.');
      try {
        if (localStorage.getItem('remember_me') === 'true') {
          localStorage.setItem('remember_me_password', newPassword);
          setPassword(newPassword);
        }
      } catch {}
      setMode('login');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotIdentifier('');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const identifierError = getIdentifierError();
  const passwordError = getPasswordError();

  return (
    <div className="min-h-screen w-full flex flex-col font-sans overflow-x-hidden relative text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white">

      {/* Embedded CSS Keyframes for Floating Anime Starlight Particles */}
      <style>{`
        @keyframes starlightFloat {
          0% {
            transform: translate3d(0, 105vh, 0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translate3d(40px, -5vh, 0) scale(1.1);
            opacity: 0;
          }
        }
      `}</style>

      {/* Full-Screen Anime Artwork Background (Makoto Shinkai Sky Theme) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${animeBgImage})` }}
      />

      {/* Theme Gradient Overlay in School Colors (Deep Navy / Sky / Indigo) */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/75 via-blue-950/70 to-slate-950/85 dark:from-slate-950/85 dark:via-slate-950/80 dark:to-slate-950/90 backdrop-blur-[4px] pointer-events-none transition-all duration-500" />

      {/* Ambient Glowing Anime Flares in School Theme (Sky & Indigo) */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/25 blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-32 left-1/4 w-[30rem] h-[30rem] rounded-full bg-indigo-500/20 blur-[130px] pointer-events-none z-0" />

      {/* Floating Starlight Anime Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {starlightParticles.map((particle, idx) => (
          <div
            key={idx}
            className="absolute bottom-0 rounded-full bg-sky-300 dark:bg-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
            style={{
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `starlightFloat ${particle.duration} linear infinite`,
              animationDelay: particle.delay
            }}
          />
        ))}
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-1 flex items-center justify-between shrink-0">
        {/* Left: Back to Home Button */}
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 text-xs sm:text-sm font-bold shadow-lg shadow-black/5 hover:shadow-sky-500/20 transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-sky-500" />
            <span>Back to Home</span>
          </button>
        ) : (
          <div />
        )}
      </header>

      {/* Main Login Portal Layout: Left Institutional Showcase & Right Login Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 z-20">
        
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SIDE: Relative Institutional / School Branding Showcase (Configured by Admin in Settings) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between space-y-6 text-white animate-in fade-in slide-in-from-left-6 duration-700">
            
            {/* Top Pill / Affiliation */}
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/15 dark:border-slate-700/60 text-sky-300 text-xs font-bold shadow-lg shadow-black/10">
                {isSuperAdminLogin ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Root Platform Administration</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <span>{effectiveBoard ? `${effectiveBoard} Affiliated Institution` : 'Official Institutional Portal'}</span>
                  </>
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                <span className="text-emerald-300 font-semibold text-[11px]">Campus Online</span>
              </div>
            </div>

            {/* School / Platform Hero Branding */}
            <div className="space-y-4">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl ring-4 ring-sky-400/30 shrink-0 flex items-center justify-center overflow-hidden backdrop-blur-xl">
                  {effectiveLogo ? (
                    <img
                      src={resolveMediaUrl(effectiveLogo)}
                      alt={effectiveName || 'School Logo'}
                      className="w-full h-full object-contain"
                      onError={() => {
                        if (isSuperAdminLogin) {
                          setSuperAdminBranding(prev => ({ ...prev, logoUrl: '' }));
                        } else {
                          setSchoolProfile(prev => ({ ...prev, logoUrl: '' }));
                        }
                      }}
                    />
                  ) : isSuperAdminLogin ? (
                    <ShieldCheck className="w-12 h-12 text-amber-500" />
                  ) : (
                    <GraduationCap className="w-12 h-12 text-sky-500" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    {effectiveName}
                  </h1>
                  <p className="text-sky-300/90 text-sm sm:text-base font-semibold italic mt-1 max-w-xl">
                    {effectiveTagline}
                  </p>
                </div>
              </div>
            </div>

            {/* Institutional Capabilities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {isSuperAdminLogin ? (
                <>
                  <div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-slate-800/60 shadow-lg">
                    <div className="flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span>Multi-Branch & Tenant Isolation</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      Unified database partitioning, dedicated tenant domains, and centralized SaaS package orchestration.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-slate-800/60 shadow-lg">
                    <div className="flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>Root Security & 99.95% SLA</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      Enterprise TLS encryption, automated cloud snapshots, and 24/7 high-availability infrastructure.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-slate-800/60 shadow-lg">
                    <div className="flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span>Academic & Examinations</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      Real-time student attendance, automated gradebooks, dynamic schedules, and digital report cards.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-slate-800/60 shadow-lg">
                    <div className="flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span>Campus Finance & Transport</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      Online fee payments, instant receipt generation, live bus GPS fleet tracking, and parent SMS alerts.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* School Contact Details Card (Configured by Admin in Settings) */}
            {(effectiveAddress || effectivePhone || effectiveEmail || effectiveWebsite) && (
              <div className="p-4 rounded-2xl bg-slate-950/45 backdrop-blur-md border border-white/10 text-xs text-slate-300 space-y-3 shadow-xl">
                <div className="text-[10px] uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1.5 pb-0.5 border-b border-white/5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{isSuperAdminLogin ? 'Platform Support & Contact' : 'School Campus & Contact Information'}</span>
                </div>
                <div className="space-y-2 text-xs">
                  {effectiveAddress && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200 leading-relaxed">{effectiveAddress}</span>
                    </div>
                  )}
                  {effectivePhone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-200 font-medium">{effectivePhone}</span>
                    </div>
                  )}
                  {effectiveEmail && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <a href={`mailto:${effectiveEmail}`} className="text-slate-200 hover:text-sky-300 transition-colors font-medium truncate">
                        {effectiveEmail}
                      </a>
                    </div>
                  )}
                  {effectiveWebsite && (
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <a
                        href={effectiveWebsite.startsWith('http') ? effectiveWebsite : `https://${effectiveWebsite}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-200 hover:text-sky-300 transition-colors font-medium truncate"
                      >
                        {effectiveWebsite}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Security / Trust Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isSuperAdminLogin
                  ? 'Authorized Root Administrators Only • Encrypted Multi-Tenant Session'
                  : 'Authorized School Administrators, Faculty, Students & Guardians Only'}
              </span>
            </div>

          </div>

          {/* RIGHT SIDE: The Login Container Card */}
          <div className="w-full max-w-[26rem] mx-auto lg:col-span-5 animate-in fade-in slide-in-from-right-6 duration-700">
            
            {/* Card in School Theme */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-sky-100 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(14,165,233,0.2)] dark:shadow-[0_20px_50px_-15px_rgba(2,132,199,0.25)] overflow-hidden">
            
            {/* Top School Theme Ribbon (Sky to Blue to Indigo) */}
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600" />

            <div className="p-5 sm:p-6">
              
              {/* Header: School Logo & Title */}
              <div className="mb-4 flex flex-col items-center text-center space-y-2">
                
                {/* School / Company Logo */}
                {effectiveLogo ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-950 p-2 shadow-lg ring-3 ring-sky-500/20 shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-300">
                    <img
                      src={resolveMediaUrl(effectiveLogo)}
                      alt={effectiveName || 'Company Logo'}
                      className="w-full h-full object-contain"
                      onError={() => {
                        if (isSuperAdminLogin) {
                          setSuperAdminBranding(prev => ({ ...prev, logoUrl: '' }));
                        } else {
                          setSchoolProfile(prev => ({ ...prev, logoUrl: '' }));
                        }
                      }}
                    />
                  </div>
                ) : isSuperAdminLogin ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-2 shadow-lg ring-3 ring-sky-500/20 shrink-0 flex items-center justify-center text-white transition-transform hover:scale-105 duration-300">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-2 shadow-lg ring-3 ring-sky-500/20 shrink-0 flex items-center justify-center text-white transition-transform hover:scale-105 duration-300">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                )}

                {/* Company / School Name */}
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                    {effectiveName}
                  </h1>
                  {initialRole === 'Super Admin' && (
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                      Multi-Tenant Central Administration
                    </p>
                  )}
                  {mode !== 'login' && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      {mode === 'setup-superadmin' && 'Initial System Setup'}
                      {mode === 'forgot' && 'Reset Your Password'}
                      {mode === 'verify-otp' && 'Enter Verification Code'}
                      {mode === 'reset-password' && 'Create New Password'}
                    </p>
                  )}
                </div>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300/80 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* MODE 1: UNIFIED LOGIN FOR ALL USERS */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} noValidate className="space-y-3">
                  
                  {initialRole === 'Super Admin' ? (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Super Administrator Portal
                    </div>
                  ) : initialRole === 'Admin' ? (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-semibold mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Administrator Sign In
                    </div>
                  ) : initialRole === 'Teacher' ? (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Faculty & Teacher Portal
                    </div>
                  ) : initialRole === 'Student' ? (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> Student Portal
                    </div>
                  ) : initialRole === 'Parent' ? (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold mb-2">
                      <Users className="w-3.5 h-3.5 text-purple-500" /> Parents & Guardians Portal
                    </div>
                  ) : null}

                  {/* Email / Phone Field */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {initialRole === 'Super Admin' ? 'Email or Username' : 'Email, Mobile Number or Student ID'} <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={e => handleIdentifierChange(e.target.value)}
                        onBlur={() => setIdentifierTouched(true)}
                        placeholder={initialRole === 'Super Admin' ? 'Enter email or username' : 'Enter email, phone, or Student ID'}
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 transition-all font-medium ${
                          identifierError
                            ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-slate-950'
                        }`}
                      />
                    </div>
                    {identifierError && (
                      <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{identifierError}</span>
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => handlePasswordChange(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        placeholder="Enter your password"
                        className={`w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 transition-all font-medium ${
                          passwordError
                            ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-slate-950'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {/* Remember Me & Forgot Password Row */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={handleRememberMeChange}
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 dark:bg-slate-950 accent-sky-600 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                          Remember me
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMode('forgot');
                        }}
                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button in School Theme */}
                  <div className="pt-1.5">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer group"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {isSetupRequired && typeof window !== 'undefined' && window.location.hash.includes('setup') && (
                    <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => { setError(''); setMode('setup-superadmin'); }}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold flex items-center justify-center gap-1 mx-auto"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Initial Setup: Create Super Admin
                      </button>
                    </div>
                  )}

                </form>
              )}

              {/* MODE: INITIAL SUPER ADMIN SETUP */}
              {mode === 'setup-superadmin' && (
                <form onSubmit={handleSetupSuperAdminSubmit} noValidate className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Create Super Admin Account</span>
                    </div>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                      No Super Administrator exists yet. Register your root account to initialize the system.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Name <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={saSetupForm.fullName}
                        onChange={e => {
                          setSaSetupForm({ ...saSetupForm, fullName: e.target.value });
                          if (error) setError('');
                        }}
                        placeholder="e.g. System Administrator"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={saSetupForm.email}
                        onChange={e => {
                          setSaSetupForm({ ...saSetupForm, email: e.target.value });
                          if (error) setError('');
                        }}
                        placeholder="admin@yourschool.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mobile Number <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={saSetupForm.mobileNumber}
                        onChange={e => {
                          setSaSetupForm({ ...saSetupForm, mobileNumber: e.target.value });
                          if (error) setError('');
                        }}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password (min 6 characters) <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSaPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={saSetupForm.password}
                        onChange={e => {
                          setSaSetupForm({ ...saSetupForm, password: e.target.value });
                          if (error) setError('');
                        }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSaPassword(!showSaPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showSaPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confirm Password <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-500 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showSaConfirmPassword ? 'text' : 'password'}
                        required
                        value={saSetupForm.confirmPassword}
                        onChange={e => {
                          setSaSetupForm({ ...saSetupForm, confirmPassword: e.target.value });
                          if (error) setError('');
                        }}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSaConfirmPassword(!showSaConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showSaConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Create Super Admin & Launch Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => { setError(''); setMode('login'); }}
                      className="text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 font-semibold"
                    >
                      Already have an account? Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: FORGOT PASSWORD */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotSubmit} noValidate className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email or Mobile Number <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={e => {
                          setForgotIdentifier(e.target.value);
                          if (error) setError('');
                        }}
                        onBlur={() => setForgotIdentifierTouched(true)}
                        placeholder="Enter registered email or phone"
                        className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition-all font-medium ${
                          (!forgotIdentifier.trim() && (forgotIdentifierTouched || forgotSubmitted))
                            ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-slate-950'
                        }`}
                      />
                    </div>
                    {(!forgotIdentifier.trim() && (forgotIdentifierTouched || forgotSubmitted)) && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Email or phone is required</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-sky-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('login');
                      }}
                      className="w-full py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: VERIFY OTP */}
              {mode === 'verify-otp' && (
                <form onSubmit={handleVerifyOtpSubmit} noValidate className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      6-Digit Verification Code <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => {
                        setOtp(e.target.value.replace(/\D/g, ''));
                        if (error) setError('');
                      }}
                      onBlur={() => setOtpTouched(true)}
                      placeholder="123456"
                      maxLength={6}
                      className={`w-full px-4 py-3.5 text-center tracking-[0.4em] text-2xl font-black rounded-2xl bg-slate-50/70 dark:bg-slate-950/80 border text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-4 transition-all ${
                        (!otp.trim() && (otpTouched || otpSubmitted))
                          ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-800 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-slate-950'
                      }`}
                    />
                    {(!otp.trim() && (otpTouched || otpSubmitted)) && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Verification code is required</span>
                      </div>
                    )}
                    {otp.trim() && otp.trim().length < 6 && (otpTouched || otpSubmitted) && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Code must be 6 digits</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-sky-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify Code</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('login');
                      }}
                      className="w-full py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 4: RESET PASSWORD */}
              {mode === 'reset-password' && (
                <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-3 text-left">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        New Password <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => {
                          setNewPassword(e.target.value);
                          if (error) setError('');
                        }}
                        onBlur={() => setNewPasswordTouched(true)}
                        placeholder="Min. 6 characters"
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition-all font-medium ${
                          (!newPassword && (newPasswordTouched || resetSubmitted))
                            ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-slate-950'
                        }`}
                      />
                      {(!newPassword && (newPasswordTouched || resetSubmitted)) && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>New password is required</span>
                        </div>
                      )}
                      {newPassword && newPassword.length < 6 && (newPasswordTouched || resetSubmitted) && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Password must be at least 6 characters</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Confirm New Password <span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => {
                          setConfirmNewPassword(e.target.value);
                          if (error) setError('');
                        }}
                        onBlur={() => setConfirmNewPasswordTouched(true)}
                        placeholder="Re-type new password"
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/80 border text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-4 transition-all font-medium ${
                          (!confirmNewPassword && (confirmNewPasswordTouched || resetSubmitted))
                            ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 dark:border-slate-800 focus:border-sky-500 dark:focus:border-sky-400 focus:ring-sky-500/20 focus:bg-white dark:focus:bg-slate-950'
                        }`}
                      />
                      {(!confirmNewPassword && (confirmNewPasswordTouched || resetSubmitted)) && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium mt-1 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Please confirm your password</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !newPassword || !confirmNewPassword}
                      className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-sky-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Save & Sign In</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>

        </div>

      </div>

    </main>

    </div>
  );
};
