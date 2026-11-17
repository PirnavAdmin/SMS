import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon, ShieldCheck, Mail, Phone, Lock, Eye, EyeOff,
  Camera, Trash2, Edit, Save, X, Building2, Globe, Layers,
  Server, Key, CheckCircle2, AlertTriangle, ArrowLeft, Activity,
  Database, RefreshCw, Cpu, Award
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  fetchUserProfileApi,
  updateUserProfileApi,
  uploadUserProfileImageApi,
  saveLocalUserProfile,
  UserProfileData
} from '../../../api/profile';
import { fetchSchoolsApi, fetchPackagesApi } from '../../../api/superadmin';
import { validateEmail, validateFullName, validatePhoneNumber, sanitizeEmailInput, sanitizePhoneInput } from '../../../utils/validation';

interface SuperAdminProfileViewProps {
  onNavigate?: (module: string) => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

export const SuperAdminProfileView: React.FC<SuperAdminProfileViewProps> = ({ onNavigate }) => {
  const { user, setUser, changePassword } = useAuth();
  const { addToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    designation: 'Master SaaS Administrator / Platform Owner',
    organization: 'Multi-Tenant SaaS Portal',
    timezone: '(GMT+05:30) Asia/Kolkata (IST)',
    language: 'English',
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
              avatar: data.avatar || user?.avatar || prev.avatar,
            }));
          } else if (user) {
            setProfileForm(prev => ({
              ...prev,
              name: user.name || prev.name,
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
              avatar: user.avatar || prev.avatar,
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

  // Photo Upload Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Invalid File', 'Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      addToast('error', 'File Too Large', 'Maximum profile photo size is 4MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await uploadUserProfileImageApi(file);
      if (res.success && res.avatarUrl) {
        setProfileForm(prev => ({ ...prev, avatar: res.avatarUrl }));
        if (user) {
          const updated = { ...user, avatar: res.avatarUrl };
          setUser(updated);
        }
        saveLocalUserProfile({ email: profileForm.email, avatar: res.avatarUrl }, profileForm.email);
        addToast('success', 'Profile Photo Updated', 'Your avatar has been updated successfully.');
      }
    } catch (err: any) {
      addToast('error', 'Upload Failed', err?.message || 'Failed to update profile image.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setProfileForm(prev => ({ ...prev, avatar: '' }));
    if (user) {
      const updated = { ...user, avatar: '' };
      setUser(updated);
    }
    saveLocalUserProfile({ email: profileForm.email, avatar: '' }, profileForm.email);
    addToast('success', 'Photo Removed', 'Profile avatar reset to system default.');
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
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
        avatar: profileForm.avatar,
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
          avatar: profileForm.avatar,
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

  // Password Update
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('superadmin-dashboard')}
              className="p-2 rounded-2xl btn-glass-secondary text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Super Admin Account
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Identity & Access Management
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Super Administrator Profile
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Root SaaS Clearance Active
          </span>
        </div>
      </div>

      {/* Hero Identity Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-40 top-4 w-28 h-28 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Upload */}
          <div className="relative shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ring-4 ring-white/40 overflow-hidden shadow-2xl relative cursor-pointer group bg-slate-900"
              title="Click to update avatar"
            >
              <img
                src={profileForm.avatar || DEFAULT_AVATAR}
                alt="Super Admin Avatar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                {isUploadingPhoto ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white text-orange-600 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Change Photo"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* User Details in Hero */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {profileForm.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white border border-white/30 backdrop-blur-md">
                    Root Role
                  </span>
                </div>
                <p className="text-orange-100 text-sm font-medium mt-1">
                  {profileForm.email} &bull; {profileForm.phone}
                </p>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-2 pt-2 md:pt-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-2xl bg-white/95 hover:bg-white text-orange-700 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5 text-orange-600" />
                    <span>Edit Profile Details</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Editing</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/20 text-white backdrop-blur-md border border-white/10 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                Super Admin Access
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/20 text-white backdrop-blur-md border border-white/10 font-bold">
                <Building2 className="w-3.5 h-3.5 text-orange-200" />
                {profileForm.organization}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/20 text-white backdrop-blur-md border border-white/10 font-bold">
                <Globe className="w-3.5 h-3.5 text-sky-200" />
                Global Multi-Tenant Authority
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip at Bottom of Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20 text-xs">
          <div className="bg-black/15 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider block">Managed Schools</span>
            <span className="text-xl font-black text-white mt-0.5 block">{stats.totalSchools}</span>
          </div>
          <div className="bg-black/15 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider block">SaaS Packages</span>
            <span className="text-xl font-black text-white mt-0.5 block">{stats.totalPackages}</span>
          </div>
          <div className="bg-black/15 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider block">Security Level</span>
            <span className="text-sm font-black text-emerald-300 mt-1 block">Tier 1 Master</span>
          </div>
          <div className="bg-black/15 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider block">Status</span>
            <span className="text-sm font-black text-white mt-1 block">Active Account</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Information Form (7 Cols) */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <UserIcon className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Personal & Identity Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update primary identification details and platform contact profile
                </p>
              </div>
            </div>

            {profileForm.avatar && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                title="Remove Avatar"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Avatar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : formErrors.name
                        ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : formErrors.email
                        ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : formErrors.phone
                        ? 'bg-rose-50/20 border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <span>⚠️</span> {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Administrative Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Administrative Title
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, designation: e.target.value }))}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Platform Organization
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, organization: e.target.value }))}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* System Timezone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Platform Timezone
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      !isEditing
                        ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormErrors({});
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            )}
          </form>

          {/* System Clearances & Permissions Box */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Active Platform Clearances & Authority
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { title: 'Multi-Tenant Isolation', desc: 'Full institutional partitioning & oversight', icon: Building2 },
                { title: 'SaaS Packaging & Tiers', desc: 'Pricing, limits, and module enablement', icon: Layers },
                { title: 'Domain & Subdomain Gateway', desc: 'DNS routing & custom URL verification', icon: Globe },
                { title: 'Telemetry & Usage Metrics', desc: 'Real-time database and memory telemetry', icon: Activity },
                { title: 'Backup & Disaster Recovery', desc: 'Atomic restore & database snapshot control', icon: Database },
                { title: 'System Security Audit Trail', desc: 'Unrestricted security event log inspection', icon: Server },
              ].map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                    <c.icon className="w-3.5 h-3.5" />
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

        {/* Right Column: Security & Credentials Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Key className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Account Credentials & Security
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update root Super Admin login authentication password
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              {/* Current Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Master Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Master Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Key className={`w-3.5 h-3.5 ${isUpdatingPassword ? 'animate-spin' : ''}`} />
                <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Master Password'}</span>
              </button>
            </form>
          </div>

          {/* Quick Support / Emergency Box */}
          <div className="p-5 rounded-3xl bg-slate-900 dark:bg-black text-white space-y-3 shadow-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-400" />
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-200">
                Master Platform Telemetry
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Super Admin sessions are logged with IP tracking and protected with high-level JWT token authentication.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>DB Host: MySQL 8.0</span>
              <span className="text-emerald-400">TLS 1.3 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SuperAdminProfileView;
