import React, { useState, useEffect } from 'react';
import {
  X, Upload, Eye, EyeOff, Building2, Mail, Phone, Globe, User, MapPin,
  AlertCircle, CheckCircle2, KeyRound, Copy, Check, Download, Sparkles
} from 'lucide-react';
import {
  SchoolItem,
  registerInstitutionApi,
  updateSchoolApi,
  fetchPackagesApi,
  PackagePlan
} from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolSaved: (savedSchool: SchoolItem) => void;
  editingSchool?: SchoolItem | null;
}

export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  isOpen,
  onClose,
  onSchoolSaved,
  editingSchool
}) => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accountUrl: '',
    phoneNumber: '',
    website: '',
    principalName: '',
    password: '',
    confirmPassword: '',
    address: '',
    planName: 'Custom Plan',
    planType: 'Monthly',
    currency: 'INR',
    language: 'English',
    status: 'Active',
    logoUrl: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [availablePackages, setAvailablePackages] = useState<PackagePlan[]>([]);

  // Post-Creation Handover Card State
  const [createdAccessSlip, setCreatedAccessSlip] = useState<{
    schoolName: string;
    schoolCode: string;
    email: string;
    password?: string;
    loginUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load live packages dynamically from API
  useEffect(() => {
    if (isOpen) {
      setCreatedAccessSlip(null);
      setFieldErrors({});
      setTouchedFields({});
      setGeneralError('');

      fetchPackagesApi().then(pkgs => {
        const activePkgs = pkgs.filter(p => p.status === 'Active');
        setAvailablePackages(activePkgs);
        if (!editingSchool) {
          setFormData(prev => ({
            ...prev,
            planName: activePkgs.length > 0 ? activePkgs[0].name : 'Custom Plan'
          }));
        }
      }).catch(() => {});
    }
  }, [isOpen, editingSchool]);

  useEffect(() => {
    if (editingSchool) {
      setFormData({
        name: editingSchool.schoolName || '',
        email: editingSchool.email || '',
        accountUrl: editingSchool.schoolCode || '',
        phoneNumber: editingSchool.phone || '',
        website: editingSchool.website || '',
        principalName: editingSchool.principalName || '',
        password: '',
        confirmPassword: '',
        address: editingSchool.address || '',
        planName: editingSchool.planName || (availablePackages[0]?.name ?? 'Custom Plan'),
        planType: editingSchool.planType || 'Monthly',
        currency: 'INR',
        language: 'English',
        status: editingSchool.status || 'Active',
        logoUrl: editingSchool.logoUrl || ''
      });
      setLogoPreview(editingSchool.logoUrl || '');
    } else {
      setFormData({
        name: '',
        email: '',
        accountUrl: '',
        phoneNumber: '',
        website: '',
        principalName: '',
        password: '',
        confirmPassword: '',
        address: '',
        planName: availablePackages[0]?.name || 'Custom Plan',
        planType: 'Monthly',
        currency: 'INR',
        language: 'English',
        status: 'Active',
        logoUrl: ''
      });
      setLogoPreview('');
    }
    setFieldErrors({});
    setTouchedFields({});
    setGeneralError('');
  }, [editingSchool, isOpen, availablePackages]);

  if (!isOpen) return null;

  // Real-time Field Validator
  const validateField = (field: string, value: string, currentForm: typeof formData): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'School / Institution Name is required';
        if (value.trim().length < 3) return 'School name must be at least 3 characters';
        if (value.trim().length > 200) return 'School name cannot exceed 200 characters';
        return '';

      case 'accountUrl': {
        if (!value.trim()) return 'Account Subdomain Code is required';
        const clean = value.trim().toLowerCase();
        if (clean.length < 3) return 'Subdomain must be at least 3 characters';
        if (clean.length > 50) return 'Subdomain cannot exceed 50 characters';
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) {
          return 'Subdomain must contain only lowercase letters, numbers, and hyphens (cannot start or end with a hyphen)';
        }
        return '';
      }

      case 'email':
        if (!value.trim()) return 'Customer Administrator Email is required';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())) {
          return 'Please provide a valid administrator email address (e.g. admin@school.edu)';
        }
        return '';

      case 'phoneNumber': {
        const clean = (value || '').trim();
        if (!clean) return 'Phone / Mobile Number is required';
        const digits = clean.replace(/\D/g, '');
        if (digits.length < 10) return 'Mobile number must be at least 10 digits';
        if (digits.length > 15) return 'Mobile number cannot exceed 15 digits';
        if (!/^[+]?[0-9\s\-()]{10,20}$/.test(clean)) {
          return 'Please enter a valid mobile number (e.g. 9876543210 or +91 98765 43210)';
        }
        return '';
      }

      case 'website':
        if (value.trim() && !/^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/.test(value.trim())) {
          return 'Please enter a valid website URL (e.g. https://www.school.edu)';
        }
        return '';

      case 'password':
        if (!editingSchool) {
          if (!value) return 'Initial login password is required';
          if (value.length < 6) return 'Password must be at least 6 characters long';
        }
        return '';

      case 'confirmPassword':
        if (!editingSchool) {
          if (!value) return 'Please confirm the initial password';
          if (value !== currentForm.password) return 'Passwords do not match';
        }
        return '';

      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    let updatedValue = value;
    const updatedForm = { ...formData, [field]: value };

    if (field === 'accountUrl') {
      // Auto-sanitize subdomain: lowercase, replace spaces with hyphens, strip invalid characters
      updatedValue = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      updatedForm.accountUrl = updatedValue;
    }

    if (field === 'name' && !editingSchool && !touchedFields.accountUrl) {
      const suggestedCode = value.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      updatedForm.accountUrl = suggestedCode;
    }

    setFormData(updatedForm);

    // Validate current field in real-time
    const err = validateField(field, updatedValue, updatedForm);
    setFieldErrors(prev => ({
      ...prev,
      [field]: err,
      ...(field === 'password' && updatedForm.confirmPassword
        ? { confirmPassword: updatedForm.confirmPassword !== updatedValue ? 'Passwords do not match' : '' }
        : {})
    }));

    if (generalError && !err) {
      setGeneralError('');
    }
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field] as string, formData);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Pass@';
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += Math.floor(10 + Math.random() * 90);
    setFormData(prev => ({ ...prev, password: pwd, confirmPassword: pwd }));
    setFieldErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
    addToast('info', 'Secure Password Generated', `Generated: ${pwd}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setGeneralError('Image file size must be less than 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    const fieldsToValidate: (keyof typeof formData)[] = ['name', 'accountUrl', 'email', 'phoneNumber'];
    if (!editingSchool) {
      fieldsToValidate.push('password', 'confirmPassword');
    }
    if (formData.website) fieldsToValidate.push('website');

    fieldsToValidate.forEach(field => {
      const err = validateField(field, formData[field] as string, formData);
      if (err) errors[field] = err;
    });

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setGeneralError('Please resolve the highlighted validation errors below.');
      return false;
    }

    setGeneralError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);

    try {
      const cleanCode = formData.accountUrl.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

      if (editingSchool) {
        // Update existing school
        const updated = await updateSchoolApi(editingSchool.schoolId, {
          schoolName: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          website: formData.website.trim(),
          principalName: formData.principalName.trim(),
          status: formData.status
        });

        const merged: SchoolItem = {
          ...editingSchool,
          ...updated,
          planName: formData.planName,
          planType: formData.planType as any,
          logoUrl: formData.logoUrl || editingSchool.logoUrl
        };

        addToast('success', 'School Updated', `${formData.name} details have been updated successfully.`);
        onSchoolSaved(merged);
        onClose();
      } else {
        // Atomic Registration: Creates School, Customer Admin, and Credentials in 1 API call
        const regResult = await registerInstitutionApi({
          schoolName: formData.name.trim(),
          schoolCode: cleanCode,
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phoneNumber.trim(),
          website: formData.website.trim(),
          principalName: formData.principalName.trim(),
          address: formData.address.trim(),
          planName: formData.planName,
          planType: formData.planType,
          currency: formData.currency,
          language: formData.language,
          status: formData.status
        });

        const enriched: SchoolItem = {
          ...regResult.school,
          planName: formData.planName,
          planType: formData.planType as any,
          logoUrl: formData.logoUrl
        };

        addToast('success', 'School Registered', `${formData.name} registered! Customer credentials generated.`);
        onSchoolSaved(enriched);

        // Show Handover Credentials Screen
        setCreatedAccessSlip({
          schoolName: regResult.school.schoolName,
          schoolCode: regResult.school.schoolCode,
          email: regResult.admin.email,
          password: regResult.temporaryPassword || formData.password,
          loginUrl: `${window.location.origin}/#login`
        });
      }
    } catch (err: any) {
      console.error('Error saving school:', err);
      const msg = err?.message || 'Failed to save school. Please check connection and try again.';
      const lower = msg.toLowerCase();

      const newErrors: Record<string, string> = {};
      if (lower.includes('subdomain') || lower.includes('code')) {
        newErrors.accountUrl = msg;
      }
      if (lower.includes('email')) {
        newErrors.email = msg;
      }

      setFieldErrors(prev => ({ ...prev, ...newErrors }));
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  const customerHandoverText = createdAccessSlip
    ? `=====================================================
🎓 SCHOOL MANAGEMENT PORTAL - CLIENT ACCESS CREDENTIALS
=====================================================
Institution Name: ${createdAccessSlip.schoolName}
School Code     : ${createdAccessSlip.schoolCode}
Portal Login URL: ${createdAccessSlip.loginUrl}

CUSTOMER ADMINISTRATOR LOGIN:
-----------------------------------------------------
Login ID / Email: ${createdAccessSlip.email}
Password        : ${createdAccessSlip.password}
Assigned Role   : School Administrator (Full Management Access)

LOGIN INSTRUCTIONS:
1. Open the Portal Login URL above.
2. Sign in with the Login ID and Password.
3. Configure your classes, students, staff, and timetable.
=====================================================`
    : '';

  const handleCopySlip = async () => {
    try {
      await navigator.clipboard.writeText(customerHandoverText);
      setCopied(true);
      addToast('success', 'Copied to Clipboard', 'Customer credentials slip copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      addToast('error', 'Error', 'Failed to copy to clipboard.');
    }
  };

  const handleDownloadSlip = () => {
    if (!createdAccessSlip) return;
    const blob = new Blob([customerHandoverText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${createdAccessSlip.schoolCode}_Admin_Access_Slip.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Download Complete', 'Customer access slip downloaded.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {createdAccessSlip
                  ? 'Customer Access Credentials Handover'
                  : editingSchool
                  ? 'Edit School Institution'
                  : 'Add New School'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {createdAccessSlip
                  ? 'Official login credentials generated for the school administrator'
                  : 'Register a new educational institution & generate customer login'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl btn-glass-secondary flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* POST-CREATION CREDENTIALS HANDOVER SCREEN */}
        {createdAccessSlip ? (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  School & Customer Login Created Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  The institution is registered and an administrator account is provisioned. Share the access details below with the client.
                </p>
              </div>
            </div>

            {/* Quick Access Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">School Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{createdAccessSlip.schoolName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Subdomain Code</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{createdAccessSlip.schoolCode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Portal Login URL</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 break-all">{createdAccessSlip.loginUrl}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Customer Admin Login ID</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 break-all">{createdAccessSlip.email}</span>
                </div>
              </div>

              {createdAccessSlip.password && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Admin Password
                    </span>
                    <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                      {createdAccessSlip.password}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Role: School Admin
                  </span>
                </div>
              )}
            </div>

            {/* Handover Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopySlip}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl btn-glass-primary font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Customer Access Details'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSlip}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl btn-glass-secondary text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Slip (.txt)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl btn-glass-secondary font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Slip Preview Box */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Full Handover Slip Text
              </span>
              <pre className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-40 border border-slate-800 select-all leading-relaxed">
                {customerHandoverText}
              </pre>
            </div>
          </div>
        ) : (
          /* STANDARD FORM BODY */
          <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
            
            {generalError && (
              <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Profile / School Logo Upload Box */}
            <div className="flex items-center gap-5 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Upload School Logo / Profile Image
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PNG, JPG or SVG formats up to 4MB recommended
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields: Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* School Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School / Institution Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter school or institution name"
                    value={formData.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      fieldErrors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Customer Admin Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Admin Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="admin@school.com"
                    value={formData.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      fieldErrors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Account URL / Subdomain */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account URL / Subdomain Code <span className="text-rose-500">*</span>
                </label>
                <div className={`flex rounded-xl shadow-xs overflow-hidden border ${
                  fieldErrors.accountUrl ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                } focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500`}>
                  <input
                    type="text"
                    placeholder="subdomain-code"
                    value={formData.accountUrl}
                    onChange={e => handleFieldChange('accountUrl', e.target.value)}
                    onBlur={() => handleBlur('accountUrl')}
                    disabled={!!editingSchool}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none dark:text-white font-mono"
                  />
                  <span className="px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border-l border-slate-200 dark:border-slate-700 flex items-center shrink-0">
                    .sms.portal
                  </span>
                </div>
                {fieldErrors.accountUrl && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.accountUrl}</span>
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone / Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    value={formData.phoneNumber}
                    onChange={e => handleFieldChange('phoneNumber', e.target.value)}
                    onBlur={() => handleBlur('phoneNumber')}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      fieldErrors.phoneNumber ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white`}
                  />
                </div>
                {fieldErrors.phoneNumber && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.phoneNumber}</span>
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="https://www.yourschool.com"
                    value={formData.website}
                    onChange={e => handleFieldChange('website', e.target.value)}
                    onBlur={() => handleBlur('website')}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      fieldErrors.website ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white`}
                  />
                </div>
                {fieldErrors.website && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.website}</span>
                  </p>
                )}
              </div>

              {/* Principal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Principal / Head of Institution
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Principal or Head of Institution"
                    value={formData.principalName}
                    onChange={e => handleFieldChange('principalName', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              {/* Password & Confirm Password (Initial Creation Only) */}
              {!editingSchool && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Admin Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate Secure</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password (min 6 characters)"
                        value={formData.password}
                        onChange={e => handleFieldChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={`w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-slate-800 border ${
                          fieldErrors.password ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                        } rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={e => handleFieldChange('confirmPassword', e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-slate-800 border ${
                          fieldErrors.confirmPassword ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                        } rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Physical Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  <textarea
                    rows={2}
                    placeholder="Street, City, State, Postal Code"
                    value={formData.address}
                    onChange={e => handleFieldChange('address', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Subscription Plan Dropdown (Dynamic from Backend API) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subscription Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.planName}
                  onChange={e => handleFieldChange('planName', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-medium"
                >
                  {availablePackages.length > 0 ? (
                    availablePackages.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.maxStudents === 0 ? 'Unlimited' : `Up to ${p.maxStudents}`} Students)
                      </option>
                    ))
                  ) : (
                    <option value="Custom Plan">Custom Plan (Configure plans under Subscriptions)</option>
                  )}
                </select>
                {availablePackages.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    No packages created yet. You can configure packages under Subscriptions.
                  </p>
                )}
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Cycle <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.planType}
                  onChange={e => handleFieldChange('planType', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-medium"
                >
                  <option value="Monthly">Monthly Recurring</option>
                  <option value="Yearly">Yearly (Institutional Discount)</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Currency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={e => handleFieldChange('currency', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-medium"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Language <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.language}
                  onChange={e => handleFieldChange('language', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-medium"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={e => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all dark:text-white font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            {/* Footer Actions with Admin UI buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold btn-glass-secondary rounded-2xl active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl btn-glass-primary font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>{editingSchool ? 'Save Changes' : 'Add School & Create Login'}</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
