import React, { useState, useEffect } from 'react';
import {
  X, KeyRound, Copy, Check, Eye, EyeOff, Shield, Mail, Phone,
  Building2, UserCheck, AlertCircle, CheckCircle2, Download, Sparkles, RefreshCw
} from 'lucide-react';
import {
  SchoolItem,
  AdminItem,
  fetchAdminsApi,
  createAdminApi,
  resetAdminPasswordApi
} from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolItem | null;
  onAdminUpdated?: () => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  school,
  onAdminUpdated
}) => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState<AdminItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Mode: 'view' | 'create' | 'reset'
  const [mode, setMode] = useState<'view' | 'create' | 'reset'>('view');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Reset Password State
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  // Latest generated/updated password to show in copy slip
  const [activePassword, setActivePassword] = useState<string | null>(null);

  const loadAdminForSchool = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const allAdmins = await fetchAdminsApi();
      const matched = allAdmins.find(a => a.schoolId === school.schoolId);
      setAdmin(matched || null);
      if (!matched) {
        setMode('create');
        setCreateForm({
          fullName: school.principalName || `${school.schoolName} Administrator`,
          email: school.email || '',
          mobileNumber: school.phone || '',
          password: `Pass@${Math.floor(1000 + Math.random() * 9000)}`,
          confirmPassword: ''
        });
      } else {
        setMode('view');
      }
    } catch (err) {
      console.error('Failed to load admin for school:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && school) {
      setCreateErrors({});
      setResetError('');
      setActivePassword(null);
      loadAdminForSchool();
    }
  }, [isOpen, school]);

  if (!isOpen || !school) return null;

  const loginPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#login`
    : `https://${school.schoolCode}.sms.portal`;

  const handleGeneratePassword = (target: 'create' | 'reset') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Pass@';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += Math.floor(10 + Math.random() * 90);

    if (target === 'create') {
      setCreateForm(prev => ({ ...prev, password: pwd, confirmPassword: pwd }));
    } else {
      setResetPassword(pwd);
      setConfirmResetPassword(pwd);
    }
    addToast('info', 'Secure Password Generated', `Generated: ${pwd}`);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!createForm.fullName.trim()) errors.fullName = 'Full name is required';
    if (!createForm.email.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!createForm.password) errors.password = 'Password is required';
    else if (createForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const created = await createAdminApi({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        mobileNumber: createForm.mobileNumber.trim(),
        password: createForm.password,
        schoolId: school.schoolId
      });

      setAdmin(created);
      setActivePassword(createForm.password);
      setMode('view');
      addToast('success', 'Customer Login Created', `Admin credentials created for ${created.fullName}.`);
      onAdminUpdated?.();
    } catch (err: any) {
      setCreateErrors({ submit: err?.message || 'Failed to create customer login.' });
      addToast('error', 'Error', err?.message || 'Failed to create customer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    if (!resetPassword || resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (resetPassword !== confirmResetPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetAdminPasswordApi(admin.userId, resetPassword);
      setActivePassword(resetPassword);
      setMode('view');
      setResetPassword('');
      setConfirmResetPassword('');
      setResetError('');
      addToast('success', 'Password Updated', `Customer login password has been reset.`);
      onAdminUpdated?.();
    } catch (err: any) {
      setResetError(err?.message || 'Failed to reset password.');
      addToast('error', 'Error', err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const customerAccessSlipText = `=====================================================
🎓 SCHOOL MANAGEMENT PORTAL - CLIENT ACCESS CREDENTIALS
=====================================================
Institution Name: ${school.schoolName}
School Code     : ${school.schoolCode}
Portal Login URL: ${loginPortalUrl}
Account URL     : https://${school.schoolCode}.sms.portal

ADMINISTRATOR CREDENTIALS:
-----------------------------------------------------
Admin Name      : ${admin?.fullName || createForm.fullName}
Login ID / Email: ${admin?.email || createForm.email}
Mobile Number   : ${admin?.mobileNumber || createForm.mobileNumber || 'N/A'}
Role Assigned   : School Administrator (Full Management Access)
Temporary Pass  : ${activePassword || '•••••••• (Configured by Super Admin)'}

LOGIN INSTRUCTIONS FOR THE CUSTOMER:
1. Open the Portal Login URL: ${loginPortalUrl}
2. Enter your Administrator Email and Password.
3. Access your institutional dashboard to configure classes, students, staff, and fees.
=====================================================`;

  const handleCopyAccessSlip = async () => {
    try {
      await navigator.clipboard.writeText(customerAccessSlipText);
      setCopied(true);
      addToast('success', 'Credentials Copied', 'Customer access details copied to clipboard. Ready to send via WhatsApp or Email.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      addToast('info', 'Copy Failed', 'Please manually select and copy the text slip below.');
    }
  };

  const handleDownloadSlip = () => {
    const blob = new Blob([customerAccessSlipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${school.schoolCode}_Customer_Login_Access.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Slip Downloaded', `Access slip saved as ${school.schoolCode}_Customer_Login_Access.txt.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Customer Login Access</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                  {school.schoolCode}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {school.schoolName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl btn-glass-secondary flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">

          {/* Mode 1: VIEW EXISTING CUSTOMER CREDENTIALS */}
          {mode === 'view' && admin && (
            <div className="space-y-4">
              
              {/* Customer Account Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {admin.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{admin.fullName}</p>
                      <p className="text-xs text-slate-500">School Administrator</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Active Access
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Login Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono break-all">{admin.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone / Mobile</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{admin.mobileNumber || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">School Code / Tenant</span>
                    <span className="font-semibold text-orange-600 font-mono">{school.schoolCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Portal Login URL</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono truncate block" title={loginPortalUrl}>
                      {loginPortalUrl}
                    </span>
                  </div>
                </div>

                {activePassword && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                        New Password Created
                      </span>
                      <span className="text-sm font-mono font-black text-emerald-900 dark:text-emerald-100">
                        {activePassword}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready to share</span>
                  </div>
                )}
              </div>

              {/* Handover Actions Box */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyAccessSlip}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl btn-glass-primary font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Credentials Copied!' : 'Copy Customer Access'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl btn-glass-secondary text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                  title="Download .txt access card"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl btn-glass-secondary text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-50 active:scale-95 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Reset Password</span>
                </button>
              </div>

              {/* Shareable Preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer Handover Slip Preview
                </span>
                <pre className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-48 border border-slate-800 select-all leading-relaxed">
                  {customerAccessSlipText}
                </pre>
              </div>
            </div>
          )}

          {/* Mode 2: PROVISION NEW CUSTOMER LOGIN (When no admin exists yet) */}
          {mode === 'create' && (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Create Administrator Account for {school.schoolName}
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                    Generate initial login access for the school principal or client. These credentials will allow them to manage their school portal.
                  </p>
                </div>
              </div>

              {createErrors.submit && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{createErrors.submit}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Admin Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.fullName}
                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Johnathan Doe"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${createErrors.fullName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white`}
                  />
                  {createErrors.fullName && <p className="text-[11px] text-rose-500 mt-1">{createErrors.fullName}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Login Email (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. principal@greenwood.edu"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${createErrors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white`}
                  />
                  {createErrors.email && <p className="text-[11px] text-rose-500 mt-1">{createErrors.email}</p>}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile / Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createForm.mobileNumber}
                    onChange={e => setCreateForm({ ...createForm, mobileNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white"
                  />
                </div>

                {/* Password with Auto-generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Temporary Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword('create')}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Secure</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      value={createForm.password}
                      onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className={`w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border ${createErrors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {createErrors.password && <p className="text-[11px] text-rose-500 mt-1">{createErrors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={e => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${createErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white font-mono`}
                  />
                  {createErrors.confirmPassword && <p className="text-[11px] text-rose-500 mt-1">{createErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {admin && (
                  <button
                    type="button"
                    onClick={() => setMode('view')}
                    className="px-4 py-2 text-xs font-semibold btn-glass-secondary rounded-xl"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-glass-primary font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Creating Account...' : 'Create & Handover Access'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: RESET EXISTING PASSWORD */}
          {mode === 'reset' && admin && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60">
                <p className="font-bold text-xs text-orange-900 dark:text-orange-200">
                  Reset Password for {admin.fullName}
                </p>
                <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-0.5">
                  Update customer login credentials so they can regain immediate access to their portal.
                </p>
              </div>

              {resetError && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword('reset')}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetPassword}
                      onChange={e => setResetPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmResetPassword}
                    onChange={e => setConfirmResetPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="px-4 py-2 text-xs font-semibold btn-glass-secondary rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-glass-primary font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Updating...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>School Tenant ID: #{school.schoolId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl btn-glass-secondary font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
