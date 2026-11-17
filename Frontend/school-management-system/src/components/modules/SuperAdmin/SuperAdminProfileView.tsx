import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon, ShieldCheck, Mail, Phone, Lock, Eye, EyeOff,
  Edit, Save, X, Building2, Globe, Layers,
  Server, Key, CheckCircle2, AlertTriangle, ArrowLeft, Activity,
  Database, RefreshCw, Award, Upload, Image as ImageIcon,
  Link as LinkIcon, Sparkles, Sun, Moon, Check, Info, Palette,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  fetchUserProfileApi,
  updateUserProfileApi,
  saveLocalUserProfile,
  UserProfileData
} from '../../../api/profile';
import { fetchSchoolsApi, fetchPackagesApi } from '../../../api/superadmin';
import { uploadSchoolLogoFileApi, uploadSchoolLogoApi } from '../../../api/settings';
import { createOptimizedLogoDataUrl, resolveMediaUrl } from '../../../utils/mediaUtils';
import { validateEmail, validateFullName, validatePhoneNumber, sanitizeEmailInput, sanitizePhoneInput } from '../../../utils/validation';

interface SuperAdminProfileViewProps {
  onNavigate?: (module: string) => void;
}

const DEFAULT_PLATFORM_LOGO = '/pirnav-school-logo.png';

export const SuperAdminProfileView: React.FC<SuperAdminProfileViewProps> = ({ onNavigate }) => {
  const { user, setUser, changePassword } = useAuth();
  const { addToast } = useToast();

  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  // Tab State: 'branding' | 'profile' | 'security'
  const [activeTab, setActiveTab] = useState<'branding' | 'profile' | 'security'>('branding');

  // Company / Platform Branding State
  const [companyBranding, setCompanyBranding] = useState({
    name: localStorage.getItem('company_name') || localStorage.getItem('school_name') || 'SaaS Cloud Portal',
    logo: localStorage.getItem('school_logo') || localStorage.getItem('logoUrl') || DEFAULT_PLATFORM_LOGO,
    tagline: localStorage.getItem('platform_tagline') || 'Multi-Tenant Educational Cloud Infrastructure',
    supportEmail: localStorage.getItem('platform_support_email') || user?.email || 'admin@saascloud.com',
    supportPhone: localStorage.getItem('platform_support_phone') || user?.phone || '+91 98765 43210',
    websiteUrl: localStorage.getItem('platform_website') || 'https://smscloud.portal',
  });
  const [logoSourceMode, setLogoSourceMode] = useState<'upload' | 'url'>('upload');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [previewContrast, setPreviewContrast] = useState<'light' | 'dark'>('light');

  // Personal Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: localStorage.getItem('company_name') || 'Multi-Tenant SaaS Portal',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Platform Telemetry
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalPackages: 0,
    loading: true,
  });

  // Calculate initials for monogram
  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Load existing profile & stats
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const [profileRes, schools, pkgs] = await Promise.all([
          user?.email ? fetchUserProfileApi(user.email).catch(() => null) : Promise.resolve(null),
          fetchSchoolsApi().catch(() => []),
          fetchPackagesApi().catch(() => []),
        ]);

        if (isMounted) {
          if (profileRes?.data) {
            const data = profileRes.data as UserProfileData;
            setProfileForm(prev => ({
              ...prev,
              name: data.name || user?.name || prev.name,
              email: data.email || user?.email || prev.email,
              phone: data.phone || user?.phone || prev.phone,
            }));
          } else if (user) {
            setProfileForm(prev => ({
              ...prev,
              name: user.name || prev.name,
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
            }));
          }

          setStats({
            totalSchools: schools.length,
            totalPackages: pkgs.length,
            loading: false,
          });
        }
      } catch (err) {
        if (isMounted) setStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Company Logo File Selection
  const handleCompanyLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Invalid Format', 'Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      addToast('error', 'File Too Large', 'Maximum logo image file size is 4MB.');
      return;
    }

    setIsUploadingCompanyLogo(true);
    try {
      const dataUrl = await createOptimizedLogoDataUrl(file, 800);
      setCompanyBranding(prev => ({ ...prev, logo: dataUrl }));

      try {
        const uploadRes = await uploadSchoolLogoFileApi(file);
        if (uploadRes?.success && uploadRes?.logoUrl) {
          setCompanyBranding(prev => ({ ...prev, logo: uploadRes.logoUrl }));
        }
      } catch (err) {
        console.warn('Backend file upload fallback to optimized data URL:', err);
      }

      addToast('info', 'Logo Selected', 'Click "Save Branding Changes" to apply.');
    } catch (err: any) {
      addToast('error', 'Upload Error', err?.message || 'Failed to load logo image.');
    } finally {
      setIsUploadingCompanyLogo(false);
      if (companyLogoInputRef.current) companyLogoInputRef.current.value = '';
    }
  };

  // Apply custom URL for company logo
  const handleApplyLogoUrl = () => {
    if (!logoUrlInput.trim()) {
      addToast('error', 'URL Required', 'Please enter a valid image URL.');
      return;
    }
    setCompanyBranding(prev => ({ ...prev, logo: logoUrlInput.trim() }));
    addToast('success', 'URL Applied', 'Logo preview updated.');
  };

  // Reset Company Logo to Default
  const handleResetCompanyLogo = () => {
    const defaultLogo = DEFAULT_PLATFORM_LOGO;
    setCompanyBranding(prev => ({ ...prev, logo: defaultLogo }));
    localStorage.setItem('school_logo', defaultLogo);
    localStorage.setItem('logoUrl', defaultLogo);
    window.dispatchEvent(new Event('school_profile_updated'));
    window.dispatchEvent(new Event('storage'));
    addToast('info', 'Logo Reset', 'Platform company logo reset to standard system default.');
  };

  // Save All Company Branding
  const handleSaveCompanyBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyBranding.name.trim()) {
      addToast('error', 'Name Required', 'Please enter a company / platform name.');
      return;
    }

    setIsSavingBranding(true);
    try {
      const finalLogo = companyBranding.logo.trim() || DEFAULT_PLATFORM_LOGO;
      const finalName = companyBranding.name.trim();

      localStorage.setItem('school_logo', finalLogo);
      localStorage.setItem('logoUrl', finalLogo);
      localStorage.setItem('company_name', finalName);
      localStorage.setItem('school_name', finalName);
      localStorage.setItem('platform_tagline', companyBranding.tagline.trim());
      localStorage.setItem('platform_support_email', companyBranding.supportEmail.trim());
      localStorage.setItem('platform_support_phone', companyBranding.supportPhone.trim());
      localStorage.setItem('platform_website', companyBranding.websiteUrl.trim());

      try {
        if (finalLogo.startsWith('data:')) {
          await uploadSchoolLogoApi(finalLogo).catch(() => null);
        }
      } catch (err) {}

      setProfileForm(prev => ({ ...prev, organization: finalName }));

      window.dispatchEvent(new Event('school_profile_updated'));
      window.dispatchEvent(new Event('storage'));

      addToast('success', 'Branding Saved', 'Platform company logo & branding updated across Super Admin login and sidebar.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Failed to save company branding settings.');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Save Personal Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameRes = validateFullName(profileForm.name, true);
    if (!nameRes.isValid) {
      setFormErrors(prev => ({ ...prev, name: nameRes.error }));
      addToast('error', 'Invalid Name', nameRes.error || 'Please enter a valid full name.');
      return;
    }

    const emailRes = validateEmail(profileForm.email, true);
    if (!emailRes.isValid) {
      setFormErrors(prev => ({ ...prev, email: emailRes.error }));
      addToast('error', 'Invalid Email', emailRes.error || 'Please enter a valid email address.');
      return;
    }

    if (profileForm.phone) {
      const phoneRes = validatePhoneNumber(profileForm.phone, false);
      if (!phoneRes.isValid) {
        setFormErrors(prev => ({ ...prev, phone: phoneRes.error }));
        addToast('error', 'Invalid Phone', phoneRes.error || 'Phone must be exactly 10 digits.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Partial<UserProfileData> = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        role: 'Super Admin',
        status: 'Active Account',
      };

      await updateUserProfileApi(payload);

      if (user) {
        const updatedUser = {
          ...user,
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
        };
        setUser(updatedUser);
      }

      setIsEditing(false);
      setFormErrors({});
      addToast('success', 'Profile Updated', 'Super Admin profile details saved successfully.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Failed to update profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Password Update Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (changePassword) {
        await changePassword(currentPassword, newPassword);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('success', 'Password Changed', 'Super Admin master password updated successfully.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to change password. Please verify current credentials.';
      setPasswordError(msg);
      addToast('error', 'Password Update Failed', msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('superadmin-dashboard')}
              className="p-2 rounded-xl btn-glass-secondary text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Super Admin Account
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Platform Identity & Company Settings
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Super Administrator & Company Profile
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Root SaaS Clearance Active
          </span>
        </div>
      </div>

      {/* Hero Identity Banner - Reduced Padding & Clean Monogram */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 sm:p-5 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left">
            {/* Monogram Badge (No stock photo avatar) */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-inner shrink-0">
              {getInitials(profileForm.name)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {profileForm.name || 'Master Administrator'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  Super Admin
                </span>
              </div>
              <p className="text-sky-100 text-xs font-medium">
                {profileForm.email} {profileForm.phone ? `• ${profileForm.phone}` : ''}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/20 text-white backdrop-blur-md font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-300" />
                  Root Authority
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/20 text-white backdrop-blur-md font-semibold">
                  <Building2 className="w-3 h-3 text-sky-200" />
                  {companyBranding.name}
                </span>
              </div>
            </div>
          </div>

          {/* Company Brand Badge & Quick Action */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2.5 p-2 bg-black/25 backdrop-blur-md rounded-xl border border-white/15">
              <div className="w-9 h-9 rounded-lg bg-white/95 p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={resolveMediaUrl(companyBranding.logo)}
                  alt="Company Logo"
                  className="max-h-7 max-w-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_PLATFORM_LOGO;
                  }}
                />
              </div>
              <div className="text-left pr-1.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-sky-200 block">
                  Company Brand
                </span>
                <span className="text-xs font-black text-white truncate max-w-[130px] block">
                  {companyBranding.name}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('profile');
                setIsEditing(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-sky-700 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Edit className="w-3.5 h-3.5 text-sky-600" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Compact KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-white/20 text-xs">
          <div className="bg-black/15 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-100 uppercase tracking-wider block">Managed Schools</span>
            <span className="text-lg font-black text-white mt-0.5 block">{stats.totalSchools}</span>
          </div>
          <div className="bg-black/15 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-100 uppercase tracking-wider block">SaaS Packages</span>
            <span className="text-lg font-black text-white mt-0.5 block">{stats.totalPackages}</span>
          </div>
          <div className="bg-black/15 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-100 uppercase tracking-wider block">Security Level</span>
            <span className="text-xs font-black text-emerald-300 mt-0.5 block">Tier 1 Master</span>
          </div>
          <div className="bg-black/15 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-100 uppercase tracking-wider block">System Status</span>
            <span className="text-xs font-black text-white mt-0.5 block">Active Multi-Tenant</span>
          </div>
        </div>
      </div>

      {/* 3 Modern Compact Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'btn-glass-secondary text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company Branding & Platform Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'btn-glass-secondary text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Super Admin Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'btn-glass-secondary text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Security & Master Password</span>
        </button>
      </div>

      {/* TAB 1: COMPANY BRANDING & LOGO */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200">
          {/* Left Column (7 cols): Company Settings Form & Logo Upload */}
          <div className="lg:col-span-7 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Building2 className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    Platform Company Branding & Logo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SaaS corporate branding displayed on Super Admin login & sidebar
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetCompanyLogo}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset to system default logo"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Logo</span>
              </button>
            </div>

            <form onSubmit={handleSaveCompanyBranding} className="space-y-4 text-xs">
              {/* Company Logo Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Company / Platform Logo <span className="text-rose-500">*</span>
                  </label>
                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLogoSourceMode('upload')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        logoSourceMode === 'upload'
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSourceMode('url')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        logoSourceMode === 'url'
                          ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {logoSourceMode === 'upload' ? (
                  <div className="p-3.5 rounded-xl border-2 border-dashed border-sky-300/70 dark:border-sky-800/60 bg-sky-50/20 dark:bg-sky-950/20 hover:border-sky-500 transition-colors">
                    <input
                      ref={companyLogoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleCompanyLogoSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={resolveMediaUrl(companyBranding.logo)}
                          alt="Current Logo"
                          className="max-h-12 max-w-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_PLATFORM_LOGO;
                          }}
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          Upload High-Resolution Platform Logo
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          PNG, SVG, JPG, or WebP (up to 4MB). Transparent background recommended.
                        </p>
                        <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                            type="button"
                            disabled={isUploadingCompanyLogo}
                            onClick={() => companyLogoInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
                          >
                            <Upload className={`w-3.5 h-3.5 ${isUploadingCompanyLogo ? 'animate-spin' : ''}`} />
                            <span>{isUploadingCompanyLogo ? 'Uploading...' : 'Browse Image File'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="url"
                          placeholder="https://example.com/assets/logo.png"
                          value={logoUrlInput}
                          onChange={(e) => setLogoUrlInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyLogoUrl}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer transition active:scale-95 shrink-0"
                      >
                        Apply URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Platform / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. SMS Enterprise Cloud"
                      value={companyBranding.name}
                      onChange={(e) => setCompanyBranding(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Tagline
                  </label>
                  <div className="relative">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Multi-Tenant Educational Cloud"
                      value={companyBranding.tagline}
                      onChange={(e) => setCompanyBranding(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Support Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="support@saascloud.com"
                      value={companyBranding.supportEmail}
                      onChange={(e) => setCompanyBranding(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Support Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={companyBranding.supportPhone}
                      onChange={(e) => setCompanyBranding(prev => ({ ...prev, supportPhone: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Platform Website URL */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Portal Website URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    placeholder="https://smscloud.portal"
                    value={companyBranding.websiteUrl}
                    onChange={(e) => setCompanyBranding(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              {/* Submit Button - Loading in button only */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingBranding}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isSavingBranding ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingBranding ? 'Saving...' : 'Save Branding Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column (5 cols): Live Preview Simulators & Info */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Preview Card */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-sky-500" />
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    Live Portal Preview
                  </h4>
                </div>

                {/* Contrast Switcher */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewContrast('light')}
                    className={`p-1 rounded-md text-[10px] font-bold cursor-pointer ${
                      previewContrast === 'light'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-400'
                    }`}
                    title="Light Contrast"
                  >
                    <Sun className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewContrast('dark')}
                    className={`p-1 rounded-md text-[10px] font-bold cursor-pointer ${
                      previewContrast === 'dark'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-400'
                    }`}
                    title="Dark Contrast"
                  >
                    <Moon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Login View Mockup */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-sky-500" />
                  Super Admin Login Screen
                </span>

                <div className={`p-3.5 rounded-xl border text-center transition-all ${
                  previewContrast === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="inline-block p-1.5 rounded-xl bg-white/10 dark:bg-slate-800/60 shadow-xs mb-1.5">
                    <img
                      src={resolveMediaUrl(companyBranding.logo)}
                      alt="Brand Preview"
                      className="h-8 max-w-[120px] object-contain mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLATFORM_LOGO;
                      }}
                    />
                  </div>
                  <h5 className="font-black text-xs">{companyBranding.name}</h5>
                  <p className="text-[10px] opacity-70 mt-0.5">{companyBranding.tagline}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Super Administrator Portal</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Header Mockup */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-sky-500" />
                  Sidebar Navigation Brand Header
                </span>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/95 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={resolveMediaUrl(companyBranding.logo)}
                      alt="Sidebar Logo"
                      className="max-h-6 max-w-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PLATFORM_LOGO;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h6 className="font-extrabold text-xs truncate text-white">
                      {companyBranding.name}
                    </h6>
                    <span className="text-[9px] text-sky-300 font-semibold block truncate">
                      Multi-Tenant Console
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Explanation Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Platform Logo vs School Tenant Logos
                </h4>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Platform Company Logo (Here):</strong> Sets the master brand on the Super Admin login and sidebar headers.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Client School Logos:</strong> Individual schools configure their own logo in <strong>Schools → Add School</strong> or inside their own Settings.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL IDENTITY & PROFILE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200">
          {/* Left Column: Personal Information Form (7 Cols) */}
          <div className="lg:col-span-7 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <UserIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    Super Administrator Personal Profile
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Master administrator credentials and root identification
                  </p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={profileForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfileForm(prev => ({ ...prev, name: val }));
                        const res = validateFullName(val, true);
                        setFormErrors(prev => ({ ...prev, name: res.error }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : formErrors.name
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      disabled={!isEditing}
                      value={profileForm.email}
                      onChange={(e) => {
                        const val = sanitizeEmailInput(e.target.value);
                        setProfileForm(prev => ({ ...prev, email: val }));
                        const res = validateEmail(val, true);
                        setFormErrors(prev => ({ ...prev, email: res.error }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : formErrors.email
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      maxLength={10}
                      disabled={!isEditing}
                      value={profileForm.phone}
                      onChange={(e) => {
                        const val = sanitizePhoneInput(e.target.value);
                        setProfileForm(prev => ({ ...prev, phone: val }));
                        const res = validatePhoneNumber(val, false);
                        setFormErrors(prev => ({ ...prev, phone: val ? res.error : undefined }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : formErrors.phone
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Organization
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profileForm.organization}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, organization: e.target.value }))}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - Loading strictly inside the button */}
              {isEditing && (
                <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 text-xs"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
                  </button>
                </div>
              )}
            </form>

            {/* Clearances Strip */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Active Platform Authority & Clearances
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {[
                  { title: 'Multi-Tenant Isolation', desc: 'Institutional partitioning & oversight', icon: Building2 },
                  { title: 'SaaS Packaging & Tiers', desc: 'Pricing, limits, and module enablement', icon: Layers },
                  { title: 'Domain Gateway', desc: 'Subdomain routing & SSL management', icon: Globe },
                  { title: 'Telemetry & Usage', desc: 'Real-time database and memory stats', icon: Activity },
                ].map((c, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                      <c.icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{c.title}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{c.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Master Access Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-white">Root Clearance Token</h4>
                  <p className="text-[10px] text-slate-400">Tenant-Wildcard Bypass Active</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                As the Super Administrator, your account possesses unilateral authority across all school databases, tenant subscription lifecycles, and financial transactions.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-bold">Unrestricted Master</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & MASTER PASSWORD */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-200">
          {/* Left Column: Password Update Form */}
          <div className="lg:col-span-7 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Key className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  Super Admin Master Password
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Update root Super Admin login authentication credentials
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              {/* Current Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Master Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter current master password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Master Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new master password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Loading in button only */}
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isUpdatingPassword ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Master Password'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Telemetry & Host Security Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 dark:bg-black text-white space-y-2.5 shadow-md border border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-200">
                  Master Platform Telemetry
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Super Admin sessions are logged with IP tracking and protected with high-level JWT token authentication.
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>DB Host: MySQL 8.0</span>
                <span className="text-emerald-400">TLS 1.3 Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminProfileView;
