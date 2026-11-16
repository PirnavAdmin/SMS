import React, { useState, useEffect } from 'react';
import { X, Upload, Eye, EyeOff, Building2, Mail, Phone, Globe, User, Shield, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolItem, createSchoolApi, updateSchoolApi, createAdminApi } from '../../../api/superadmin';
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
    planName: 'Basic',
    planType: 'Monthly',
    currency: 'INR',
    language: 'English',
    status: 'Active',
    logoUrl: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');

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
        planName: editingSchool.planName || 'Basic',
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
        planName: 'Basic',
        planType: 'Monthly',
        currency: 'INR',
        language: 'English',
        status: 'Active',
        logoUrl: ''
      });
      setLogoPreview('');
    }
    setError('');
  }, [editingSchool, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('Image file size must be less than 4MB');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('School Name is required');
      return;
    }
    if (!formData.accountUrl.trim()) {
      setError('Account URL / School Code is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!editingSchool) {
      if (!formData.password) {
        setError('Password is required for the initial School Admin');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
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
        // Create new school
        const cleanCode = formData.accountUrl.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const createdSchool = await createSchoolApi({
          schoolName: formData.name.trim(),
          schoolCode: cleanCode,
          address: formData.address.trim(),
          phone: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          website: formData.website.trim(),
          principalName: formData.principalName.trim(),
          planName: formData.planName,
          planType: formData.planType,
          currency: formData.currency,
          language: formData.language,
          status: formData.status
        });

        // Auto-provision initial School Admin
        if (formData.password) {
          try {
            await createAdminApi({
              fullName: formData.principalName.trim() || `${formData.name.trim()} Admin`,
              email: formData.email.trim(),
              mobileNumber: formData.phoneNumber.trim(),
              password: formData.password,
              schoolId: createdSchool.schoolId
            });
          } catch (adminErr: any) {
            console.warn('School created, but admin auto-provisioning had warning:', adminErr);
          }
        }

        const enriched: SchoolItem = {
          ...createdSchool,
          planName: formData.planName,
          planType: formData.planType as any,
          logoUrl: formData.logoUrl
        };

        addToast('success', 'School Registered', `${formData.name} has been successfully added to the portal.`);
        onSchoolSaved(enriched);
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving school:', err);
      setError(err?.message || 'Failed to save school. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSchool ? 'Edit School' : 'Add New School'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editingSchool ? 'Update school credentials and subscription settings' : 'Register a new educational institution to the multi-tenant portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile / School Logo Upload Box */}
          <div className="flex items-center gap-5 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
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
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-colors shadow-sm">
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields: Two Column Grid matching Image 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* School Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. BrightWave Innovations Academy"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="contact@brightwave.edu"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Account URL / School Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account URL / Portal Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500">
                <input
                  type="text"
                  required
                  disabled={!!editingSchool}
                  placeholder="brightwave"
                  value={formData.accountUrl}
                  onChange={e => setFormData({ ...formData, accountUrl: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 text-sm bg-transparent outline-none dark:text-white disabled:opacity-60"
                />
                <span className="inline-flex items-center px-3 bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 select-none">
                  .sms.portal
                </span>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://brightwave.edu"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Principal Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal / Head of School
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Dr. Eleanor Vance"
                  value={formData.principalName}
                  onChange={e => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Password (only required on creation) */}
            {!editingSchool && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  placeholder="Street, City, State, Postal Code"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Plan Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Name <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.planName}
                onChange={e => setFormData({ ...formData, planName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
              >
                <option value="Basic">Basic (Up to 500 Students)</option>
                <option value="Advanced">Advanced (Up to 1,500 Students)</option>
                <option value="Premium">Premium (Up to 3,500 Students)</option>
                <option value="Enterprise">Enterprise (Unlimited Campus & Branches)</option>
              </select>
            </div>

            {/* Plan Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.planType}
                onChange={e => setFormData({ ...formData, planType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
              >
                <option value="Monthly">Monthly Billing</option>
                <option value="Yearly">Yearly (Save 20%)</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="AED">AED (د.إ - UAE Dirham)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Language <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
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
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingSchool ? 'Save Changes' : 'Add School'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
