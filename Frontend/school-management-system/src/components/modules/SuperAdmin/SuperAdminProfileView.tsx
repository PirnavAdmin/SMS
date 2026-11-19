import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon, ShieldCheck, Mail, Phone, Lock, Eye, EyeOff,
  Edit, Save, X, Building2, Globe, MapPin,
  Server, Key, CheckCircle2, AlertTriangle, ArrowLeft, Activity,
  Database, RefreshCw, Award, Upload, Image as ImageIcon,
  Link as LinkIcon, Sparkles, Check, Info,
  RotateCcw, Trash2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  fetchUserProfileApi,
  updateUserProfileApi,
  UserProfileData
} from '../../../api/profile';
import {
  fetchSchoolsApi,
  fetchPackagesApi,
  fetchCompanyProfileApi,
  updateCompanyProfileApi,
  uploadCompanyLogoFileApi,
} from '../../../api/superadmin';
import { createOptimizedLogoDataUrl, resolveMediaUrl } from '../../../utils/mediaUtils';
import {
  validateEmail,
  validateFullName,
  validatePhoneNumber,
  sanitizeEmailInput,
  sanitizePhoneInput,
  validateAddress,
  validateOrganizationName,
  validateTextName,
  validateWebsiteUrl,
} from '../../../utils/validation';

interface SuperAdminProfileViewProps {
  onNavigate?: (module: string) => void;
}

export const SuperAdminProfileView: React.FC<SuperAdminProfileViewProps> = ({ onNavigate }) => {
  const { user, setUser, changePassword } = useAuth();
  const { addToast } = useToast();

  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode for Unified Page
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Company / Platform Branding State (Direct API & DB driven - Instant cache backed)
  const [companyBranding, setCompanyBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('superadmin_company_profile');
      if (cached) {
        const p = JSON.parse(cached);
        return {
          name: p.companyName || p.name || '',
          logo: p.logoUrl || p.logo || '',
          tagline: p.tagline || '',
          address: p.address || '',
          supportEmail: p.supportEmail || user?.email || '',
          supportPhone: p.supportPhone || user?.phone || '',
          websiteUrl: p.websiteUrl || '',
        };
      }
    } catch { }
    return {
      name: '',
      logo: '',
      tagline: '',
      address: '',
      supportEmail: user?.email || '',
      supportPhone: user?.phone || '',
      websiteUrl: '',
    };
  });
  const [logoSourceMode, setLogoSourceMode] = useState<'upload' | 'url'>('upload');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);

  // Company Branding Form Validation Errors
  const [brandingErrors, setBrandingErrors] = useState<{
    name?: string;
    tagline?: string;
    address?: string;
    supportEmail?: string;
    supportPhone?: string;
    websiteUrl?: string;
  }>({});

  // Personal Profile State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: '',
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
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});

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

  // Load existing profile & stats directly from Backend APIs
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const [profileRes, schools, pkgs, companyProfile] = await Promise.all([
          user?.email ? fetchUserProfileApi(user.email).catch(() => null) : Promise.resolve(null),
          fetchSchoolsApi().catch(() => []),
          fetchPackagesApi().catch(() => []),
          fetchCompanyProfileApi().catch(() => null),
        ]);

        if (isMounted) {
          if (companyProfile) {
            setCompanyBranding(prev => ({
              name: companyProfile.companyName || prev.name || '',
              logo: companyProfile.logoUrl || prev.logo || '',
              tagline: companyProfile.tagline || prev.tagline || '',
              address: companyProfile.address || prev.address || '',
              supportEmail: companyProfile.supportEmail || prev.supportEmail || user?.email || '',
              supportPhone: companyProfile.supportPhone || prev.supportPhone || user?.phone || '',
              websiteUrl: companyProfile.websiteUrl || prev.websiteUrl || '',
            }));
            if (companyProfile.companyName) {
              setProfileForm(prev => ({ ...prev, organization: companyProfile.companyName }));
            }
          }

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
  }, [user?.email]);

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
        const uploadRes = await uploadCompanyLogoFileApi(file);
        if (uploadRes?.success && uploadRes?.logoUrl) {
          setCompanyBranding(prev => ({ ...prev, logo: uploadRes.logoUrl }));
        }
      } catch (err) {
        console.warn('Backend file upload fallback to optimized data URL:', err);
      }

      addToast('info', 'Logo Selected', 'Click "Save Changes" to apply this logo.');
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
    const urlRes = validateWebsiteUrl(logoUrlInput.trim(), true);
    if (!urlRes.isValid) {
      addToast('error', 'Invalid URL', urlRes.error || 'Please enter a valid image URL.');
      return;
    }
    setCompanyBranding(prev => ({ ...prev, logo: logoUrlInput.trim() }));
    addToast('success', 'URL Applied', 'Logo preview updated.');
  };

  // Delete / Remove Company Logo
  const handleDeleteCompanyLogo = async () => {
    setCompanyBranding(prev => ({ ...prev, logo: '' }));

    if (!isEditing) {
      try {
        await updateCompanyProfileApi({
          companyName: companyBranding.name.trim(),
          tagline: companyBranding.tagline.trim(),
          logoUrl: '',
          supportEmail: companyBranding.supportEmail.trim(),
          supportPhone: companyBranding.supportPhone.trim(),
          websiteUrl: companyBranding.websiteUrl.trim(),
        });
      } catch (err) {
        console.warn('Backend logo removal note:', err);
      }
    }

    window.dispatchEvent(new Event('superadmin_profile_updated'));
    addToast('info', 'Logo Removed', 'Custom platform logo deleted. Reverted to empty icon.');
  };

  // Save All Changes (Company Branding + Personal Profile)
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Personal Profile Validation
    const pErrors: { name?: string; email?: string; phone?: string } = {};
    const nameRes = validateFullName(profileForm.name, true);
    if (!nameRes.isValid) {
      pErrors.name = nameRes.error || 'Please enter a valid full name.';
    }

    const emailRes = validateEmail(profileForm.email, true);
    if (!emailRes.isValid) {
      pErrors.email = emailRes.error || 'Please enter a valid email address.';
    }

    if (profileForm.phone) {
      const phoneRes = validatePhoneNumber(profileForm.phone, false);
      if (!phoneRes.isValid) {
        pErrors.phone = phoneRes.error || 'Phone must be exactly 10 digits.';
      }
    }

    // 2. Company / Platform Branding Validation
    const bErrors: {
      name?: string;
      tagline?: string;
      address?: string;
      supportEmail?: string;
      supportPhone?: string;
      websiteUrl?: string;
    } = {};

    const companyNameRes = validateOrganizationName(companyBranding.name, true);
    if (!companyNameRes.isValid) {
      bErrors.name = companyNameRes.error || 'Please enter a valid platform / company name.';
    }

    if (companyBranding.tagline?.trim()) {
      const taglineRes = validateTextName(companyBranding.tagline, {
        label: 'platform tagline',
        required: false,
        minLength: 2,
        maxLength: 150,
        allowNumbers: true,
      });
      if (!taglineRes.isValid) {
        bErrors.tagline = taglineRes.error;
      }
    }

    if (companyBranding.address?.trim()) {
      const addressRes = validateAddress(companyBranding.address, false);
      if (!addressRes.isValid) {
        bErrors.address = addressRes.error;
      }
    }

    if (companyBranding.supportEmail?.trim()) {
      const sEmailRes = validateEmail(companyBranding.supportEmail, false);
      if (!sEmailRes.isValid) {
        bErrors.supportEmail = sEmailRes.error;
      }
    }

    if (companyBranding.supportPhone?.trim()) {
      const sPhoneRes = validatePhoneNumber(companyBranding.supportPhone, false);
      if (!sPhoneRes.isValid) {
        bErrors.supportPhone = sPhoneRes.error;
      }
    }

    if (companyBranding.websiteUrl?.trim()) {
      const sUrlRes = validateWebsiteUrl(companyBranding.websiteUrl, false);
      if (!sUrlRes.isValid) {
        bErrors.websiteUrl = sUrlRes.error;
      }
    }

    setFormErrors(pErrors);
    setBrandingErrors(bErrors);

    if (Object.keys(pErrors).length > 0 || Object.keys(bErrors).length > 0) {
      const firstError =
        bErrors.name ||
        bErrors.address ||
        bErrors.supportEmail ||
        bErrors.supportPhone ||
        bErrors.websiteUrl ||
        bErrors.tagline ||
        pErrors.name ||
        pErrors.email ||
        pErrors.phone ||
        'Please correct highlighted validation errors.';
      addToast('error', 'Validation Error', firstError);
      return;
    }

    setIsSaving(true);
    try {
      const finalLogo = companyBranding.logo.trim();
      const finalCompanyName = companyBranding.name.trim();

      // 1. Persist Company Profile to Backend DB API
      const updatedProfile = await updateCompanyProfileApi({
        companyName: finalCompanyName,
        tagline: companyBranding.tagline.trim(),
        logoUrl: finalLogo,
        address: companyBranding.address.trim(),
        supportEmail: companyBranding.supportEmail.trim(),
        supportPhone: companyBranding.supportPhone.trim(),
        websiteUrl: companyBranding.websiteUrl.trim(),
        primaryColor: '#0284c7',
      });

      // 2. Save user profile to backend
      const payload: Partial<UserProfileData> = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        role: 'Super Admin',
        status: 'Active Account',
      };

      try {
        await updateUserProfileApi(payload);
      } catch (apiErr) {
        console.warn('Backend user profile update note:', apiErr);
      }

      if (user) {
        const updatedUser = {
          ...user,
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim(),
        };
        setUser(updatedUser);
      }

      setCompanyBranding({
        name: updatedProfile?.companyName || finalCompanyName,
        logo: updatedProfile?.logoUrl || finalLogo,
        tagline: updatedProfile?.tagline !== undefined ? updatedProfile.tagline : companyBranding.tagline.trim(),
        address: updatedProfile?.address || companyBranding.address.trim(),
        supportEmail: updatedProfile?.supportEmail || companyBranding.supportEmail.trim(),
        supportPhone: updatedProfile?.supportPhone || companyBranding.supportPhone.trim(),
        websiteUrl: updatedProfile?.websiteUrl || companyBranding.websiteUrl.trim(),
      });
      setProfileForm(prev => ({ ...prev, organization: finalCompanyName }));
      setFormErrors({});
      setBrandingErrors({});
      setIsEditing(false);

      window.dispatchEvent(new Event('superadmin_profile_updated'));
      window.dispatchEvent(new Event('company_profile_updated'));
      window.dispatchEvent(new Event('platform_branding_updated'));

      addToast('success', 'Changes Saved', 'Company profile and branding saved to database successfully.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Password Update Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const errors: { current?: string; new?: string; confirm?: string } = {};

    if (!currentPassword) {
      errors.current = 'Current master password is required.';
    }
    if (!newPassword) {
      errors.new = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.new = 'New password must be at least 6 characters.';
    } else if (currentPassword && newPassword === currentPassword) {
      errors.new = 'New password cannot be the same as current password.';
    }
    if (!confirmPassword) {
      errors.confirm = 'Please confirm your new password.';
    } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirm = 'New password and confirmation do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors);
      const firstError = errors.current || errors.new || errors.confirm || 'Please resolve password errors.';
      setPasswordError(firstError);
      addToast('error', 'Password Validation Failed', firstError);
      return;
    }

    setPasswordFieldErrors({});
    setIsUpdatingPassword(true);
    try {
      if (changePassword) {
        await changePassword(currentPassword, newPassword);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFieldErrors({});
      setPasswordError(null);
      addToast('success', 'Password Changed', 'Super Admin master password updated successfully.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to change password. Please verify current credentials.';
      setPasswordError(msg);
      addToast('error', 'Password Update Failed', msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const isCustomLogo = Boolean(companyBranding.logo && companyBranding.logo.trim());

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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Company Profile
            </h1>
          </div>
        </div>
      </div>

      {/* Hero Identity Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 sm:p-5 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left">
            {/* Monogram Badge */}
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
            </div>
          </div>

          {/* Edit Trigger */}
          <div className="flex items-center shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-sky-700 font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Edit className="w-3.5 h-3.5 text-sky-600" />
                <span>Edit Profile & Branding</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                    setBrandingErrors({});
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
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

      {/* Main Single-Tab Layout: All in one cohesive view */}
      <form onSubmit={handleSaveAll} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (7 cols): Platform Branding + Personal Profile */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Card 1: Platform Company Branding & Logo */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
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
              </div>

              {/* Company Logo Section with Upload and Delete Options */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Company / Platform Logo <span className="text-rose-500">*</span>
                  </label>

                  {isEditing && (
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
                  )}
                </div>

                {/* Logo Box with Delete Option */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <input
                    ref={companyLogoInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                    onChange={handleCompanyLogoSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row items-center gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                      {companyBranding.logo ? (
                        <img
                          src={resolveMediaUrl(companyBranding.logo)}
                          alt="Platform Logo"
                          className="max-h-12 max-w-12 object-contain"
                          onError={() => setCompanyBranding(prev => ({ ...prev, logo: '' }))}
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {isCustomLogo ? 'Custom Platform Logo Active' : 'No Logo Uploaded (Empty Icon)'}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        PNG, SVG, JPG, or WebP up to 4MB. Transparent background recommended.
                      </p>

                      {/* Upload and Delete Controls */}
                      {isEditing && (
                        <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {logoSourceMode === 'upload' ? (
                            <button
                              type="button"
                              disabled={isUploadingCompanyLogo}
                              onClick={() => companyLogoInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-60"
                            >
                              <Upload className={`w-3.5 h-3.5 ${isUploadingCompanyLogo ? 'animate-spin' : ''}`} />
                              <span>{isUploadingCompanyLogo ? 'Uploading...' : 'Browse Image File'}</span>
                            </button>
                          ) : (
                            <div className="flex gap-2 w-full max-w-sm">
                              <input
                                type="url"
                                placeholder="https://example.com/logo.png"
                                value={logoUrlInput}
                                onChange={(e) => setLogoUrlInput(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                              />
                              <button
                                type="button"
                                onClick={handleApplyLogoUrl}
                                className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs cursor-pointer"
                              >
                                Apply
                              </button>
                            </div>
                          )}

                          {/* Delete Option for uploaded logo */}
                          {isCustomLogo && (
                            <button
                              type="button"
                              onClick={handleDeleteCompanyLogo}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                              title="Delete custom uploaded logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Logo</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Platform / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      maxLength={100}
                      placeholder="e.g. SMS Enterprise Cloud"
                      value={companyBranding.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCompanyBranding(prev => ({ ...prev, name: val }));
                        const res = validateOrganizationName(val, true);
                        setBrandingErrors(prev => ({ ...prev, name: res.error }));
                      }}
                      onBlur={() => {
                        const res = validateOrganizationName(companyBranding.name, true);
                        setBrandingErrors(prev => ({ ...prev, name: res.error }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : brandingErrors.name
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {brandingErrors.name && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {brandingErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Platform Tagline
                  </label>
                  <div className="relative">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      maxLength={150}
                      placeholder="e.g. Multi-Tenant Educational Cloud"
                      value={companyBranding.tagline}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCompanyBranding(prev => ({ ...prev, tagline: val }));
                        if (val.trim()) {
                          const res = validateTextName(val, { label: 'tagline', required: false, minLength: 2, maxLength: 150, allowNumbers: true });
                          setBrandingErrors(prev => ({ ...prev, tagline: res.error }));
                        } else {
                          setBrandingErrors(prev => ({ ...prev, tagline: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (companyBranding.tagline.trim()) {
                          const res = validateTextName(companyBranding.tagline, { label: 'tagline', required: false, minLength: 2, maxLength: 150, allowNumbers: true });
                          setBrandingErrors(prev => ({ ...prev, tagline: res.error }));
                        } else {
                          setBrandingErrors(prev => ({ ...prev, tagline: undefined }));
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : brandingErrors.tagline
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {brandingErrors.tagline && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {brandingErrors.tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* Corporate / Headquarter Address */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Office / Headquarter Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    maxLength={200}
                    placeholder="e.g. 158, Kalina Santa Cruz CST Road, Santacruz East, Mumbai"
                    value={companyBranding.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanyBranding(prev => ({ ...prev, address: val }));
                      if (val.trim()) {
                        const res = validateAddress(val, false);
                        setBrandingErrors(prev => ({ ...prev, address: res.error }));
                      } else {
                        setBrandingErrors(prev => ({ ...prev, address: undefined }));
                      }
                    }}
                    onBlur={() => {
                      if (companyBranding.address.trim()) {
                        const res = validateAddress(companyBranding.address, false);
                        setBrandingErrors(prev => ({ ...prev, address: res.error }));
                      } else {
                        setBrandingErrors(prev => ({ ...prev, address: undefined }));
                      }
                    }}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : brandingErrors.address
                        ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                </div>
                {brandingErrors.address && (
                  <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {brandingErrors.address}
                  </p>
                )}
              </div>

              {/* Support Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      placeholder="support@saascloud.com"
                      value={companyBranding.supportEmail}
                      onChange={(e) => {
                        const val = sanitizeEmailInput(e.target.value);
                        setCompanyBranding(prev => ({ ...prev, supportEmail: val }));
                        if (val.trim()) {
                          const res = validateEmail(val, false);
                          setBrandingErrors(prev => ({ ...prev, supportEmail: res.error }));
                        } else {
                          setBrandingErrors(prev => ({ ...prev, supportEmail: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (companyBranding.supportEmail.trim()) {
                          const res = validateEmail(companyBranding.supportEmail, false);
                          setBrandingErrors(prev => ({ ...prev, supportEmail: res.error }));
                        } else {
                          setBrandingErrors(prev => ({ ...prev, supportEmail: undefined }));
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : brandingErrors.supportEmail
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {brandingErrors.supportEmail && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {brandingErrors.supportEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Support Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      maxLength={10}
                      disabled={!isEditing}
                      placeholder="e.g. 9876543210"
                      value={companyBranding.supportPhone}
                      onChange={(e) => {
                        const val = sanitizePhoneInput(e.target.value, 10);
                        setCompanyBranding(prev => ({ ...prev, supportPhone: val }));
                        if (val) {
                          const res = validatePhoneNumber(val, false);
                          setBrandingErrors(prev => ({ ...prev, supportPhone: res.error }));
                        } else {
                          setBrandingErrors(prev => ({ ...prev, supportPhone: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (companyBranding.supportPhone) {
                          const res = validatePhoneNumber(companyBranding.supportPhone, false);
                          setBrandingErrors(prev => ({ ...prev, supportPhone: res.error }));
                        } else {
                          setBrandingErrors(prev => ({ ...prev, supportPhone: undefined }));
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        !isEditing
                          ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                          : brandingErrors.supportPhone
                          ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {brandingErrors.supportPhone && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {brandingErrors.supportPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Portal Website URL */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Portal Website URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    disabled={!isEditing}
                    maxLength={200}
                    placeholder="https://smscloud.portal"
                    value={companyBranding.websiteUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanyBranding(prev => ({ ...prev, websiteUrl: val }));
                      if (val.trim()) {
                        const res = validateWebsiteUrl(val.trim(), false);
                        setBrandingErrors(prev => ({ ...prev, websiteUrl: res.error }));
                      } else {
                        setBrandingErrors(prev => ({ ...prev, websiteUrl: undefined }));
                      }
                    }}
                    onBlur={() => {
                      if (companyBranding.websiteUrl.trim()) {
                        const res = validateWebsiteUrl(companyBranding.websiteUrl.trim(), false);
                        setBrandingErrors(prev => ({ ...prev, websiteUrl: res.error }));
                      } else {
                        setBrandingErrors(prev => ({ ...prev, websiteUrl: undefined }));
                      }
                    }}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : brandingErrors.websiteUrl
                        ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                </div>
                {brandingErrors.websiteUrl && (
                  <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {brandingErrors.websiteUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Card 2: Super Admin Personal Profile */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <UserIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      Super Administrator Identity
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Root administrator details and contact information
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
            </div>

            {/* Action Bar when in Edit Mode - Spinner is strictly in the button only */}
            {isEditing && (
              <div className="glass-card p-3 rounded-2xl border border-sky-200 dark:border-sky-800/50 flex items-center justify-between gap-3 animate-in fade-in">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 pl-2">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editing Profile & Company Branding</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormErrors({});
                      setBrandingErrors({});
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
                    <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Security & Master Password */}
          <div className="lg:col-span-5 space-y-4">
            {/* Security & Master Password */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Key className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    Master Password Security
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Update root Super Admin authentication credentials
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-2.5 text-xs">
                {/* Current Password */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Current master password"
                      value={currentPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentPassword(val);
                        if (passwordError) setPasswordError(null);
                        setPasswordFieldErrors(prev => ({
                          ...prev,
                          current: val ? undefined : 'Current master password is required.'
                        }));
                      }}
                      onBlur={() => {
                        if (!currentPassword) {
                          setPasswordFieldErrors(prev => ({ ...prev, current: 'Current master password is required.' }));
                        }
                      }}
                      className={`w-full pl-9 pr-9 py-1.5 rounded-xl border text-xs font-semibold transition ${
                        passwordFieldErrors.current
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordFieldErrors.current && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {passwordFieldErrors.current}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPassword(val);
                        if (passwordError) setPasswordError(null);
                        let err: string | undefined = undefined;
                        if (!val) {
                          err = 'New password is required.';
                        } else if (val.length < 6) {
                          err = 'New password must be at least 6 characters.';
                        } else if (currentPassword && val === currentPassword) {
                          err = 'New password cannot be the same as current password.';
                        }
                        setPasswordFieldErrors(prev => ({
                          ...prev,
                          new: err,
                          confirm: confirmPassword && val !== confirmPassword ? 'Passwords do not match.' : undefined
                        }));
                      }}
                      onBlur={() => {
                        if (!newPassword) {
                          setPasswordFieldErrors(prev => ({ ...prev, new: 'New password is required.' }));
                        } else if (newPassword.length < 6) {
                          setPasswordFieldErrors(prev => ({ ...prev, new: 'New password must be at least 6 characters.' }));
                        } else if (currentPassword && newPassword === currentPassword) {
                          setPasswordFieldErrors(prev => ({ ...prev, new: 'New password cannot be the same as current password.' }));
                        }
                      }}
                      className={`w-full pl-9 pr-9 py-1.5 rounded-xl border text-xs font-semibold transition ${
                        passwordFieldErrors.new
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordFieldErrors.new && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {passwordFieldErrors.new}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfirmPassword(val);
                        if (passwordError) setPasswordError(null);
                        let err: string | undefined = undefined;
                        if (!val) {
                          err = 'Please confirm your new password.';
                        } else if (newPassword && val !== newPassword) {
                          err = 'Passwords do not match.';
                        }
                        setPasswordFieldErrors(prev => ({ ...prev, confirm: err }));
                      }}
                      onBlur={() => {
                        if (!confirmPassword) {
                          setPasswordFieldErrors(prev => ({ ...prev, confirm: 'Please confirm your new password.' }));
                        } else if (newPassword !== confirmPassword) {
                          setPasswordFieldErrors(prev => ({ ...prev, confirm: 'Passwords do not match.' }));
                        }
                      }}
                      className={`w-full pl-9 pr-9 py-1.5 rounded-xl border text-xs font-semibold transition ${
                        passwordFieldErrors.confirm
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordFieldErrors.confirm && (
                    <p className="mt-1 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <span>⚠️</span> {passwordFieldErrors.confirm}
                    </p>
                  )}
                </div>

                {/* Loading is strictly in the button only */}
                <button
                  type="button"
                  disabled={isUpdatingPassword}
                  onClick={handlePasswordSubmit}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 mt-1"
                >
                  {isUpdatingPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Key className="w-3.5 h-3.5" />
                  )}
                  <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminProfileView;
