import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers, Check, Plus, Edit3, Trash2, Zap, Shield, Sparkles, Building2,
  CheckCircle2, X, AlertCircle, RefreshCw, Star, Info, HelpCircle
} from 'lucide-react';
import {
  PackagePlan,
  fetchPackagesApi,
  savePackagesApi,
  fetchSchoolsApi,
  SchoolItem
} from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';

const PREDEFINED_MODULE_FEATURES = [
  'Student Admissions & Directory',
  'Daily Attendance & Leave Tracking',
  'Timetable & Automated Substitution',
  'Examination, Marks & Report Cards',
  'Fee Management & Online Payments',
  'Staff Payroll Processing & Payslips',
  'Library & Book Tracking',
  'Transport Fleet & GPS Tracking',
  'Hostel & Room Allocation',
  'Uniform & Inventory Store',
  'Multi-Branch & Multi-Campus Support',
  'Custom Domain & Dedicated Subdomain',
  'White-Labeling & School Branding',
  'Automated Cloud Backups & SLA'
];

export const SuperAdminPackagesView: React.FC = () => {
  const { addToast } = useToast();
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PackagePlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<PackagePlan | null>(null);

  // Form State & Validation
  const [formData, setFormData] = useState<PackagePlan>({
    id: '',
    name: '',
    tagline: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'INR',
    maxStudents: 0,
    maxStaff: 0,
    maxBranches: 0,
    storageGb: 0,
    isPopular: false,
    status: '' as any,
    features: []
  });

  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [featureError, setFeatureError] = useState<string | null>(null);
  const [newlyAddedFeature, setNewlyAddedFeature] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [loadedPlans, loadedSchools] = await Promise.all([
        fetchPackagesApi(),
        fetchSchoolsApi().catch(() => [])
      ]);
      setPlans(loadedPlans);
      setSchools(loadedSchools);
    } catch (err) {
      console.error('Failed to load packages or schools', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    const handleUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setPlans(e.detail);
      }
    };
    window.addEventListener('packages_updated', handleUpdated);
    return () => window.removeEventListener('packages_updated', handleUpdated);
  }, []);

  // Compute live schools count for a plan
  const getSchoolCountForPlan = (planName: string): number => {
    return schools.filter(s => {
      const sp = (s.planName || '').toLowerCase().trim();
      const pn = planName.toLowerCase().trim();
      return sp === pn || sp.includes(pn) || pn.includes(sp);
    }).length;
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormErrors({});
    setFeatureError(null);
    setNewlyAddedFeature(null);
    setFormData({
      id: `plan-${Date.now()}`,
      name: '',
      tagline: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'INR',
      maxStudents: 0,
      maxStaff: 0,
      maxBranches: 0,
      storageGb: 0,
      isPopular: false,
      status: '' as any,
      features: [] // Start empty for clean new package creation
    });
    setCustomFeatureInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PackagePlan) => {
    setEditingPlan(plan);
    setFormErrors({});
    setFeatureError(null);
    setNewlyAddedFeature(null);
    setFormData({ ...plan });
    setCustomFeatureInput('');
    setIsModalOpen(true);
  };

  const handleToggleFeature = (feat: string) => {
    setFormData(prev => {
      const exists = prev.features.includes(feat);
      return {
        ...prev,
        features: exists ? prev.features.filter(f => f !== feat) : [...prev.features, feat]
      };
    });
  };

  const handleAddCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customFeatureInput.trim();
    if (!trimmed) return;
    
    // Check for duplicate feature
    const isDuplicate = formData.features.some(
      f => f.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setFeatureError('Feature already exists in package.');
      return;
    }

    setFeatureError(null);
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, trimmed]
    }));
    setNewlyAddedFeature(trimmed);
    setCustomFeatureInput('');
    addToast('success', 'Feature Added', `Added "${trimmed.slice(0, 30)}" to package modules.`);

    setTimeout(() => {
      setNewlyAddedFeature(prev => prev === trimmed ? null : prev);
    }, 2500);
  };

  const handleRemoveFeature = (feat: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feat)
    }));
  };

  const handleCalculateYearlyDiscount = () => {
    const discounted = Math.round(formData.monthlyPrice * 12 * 0.8);
    setFormData(prev => ({ ...prev, yearlyPrice: discounted }));
    addToast('info', '20% Discount Applied', `Yearly price calculated as ₹${discounted}.`);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanName = formData.name.trim();
    if (!cleanName) {
      errors.name = 'Package name is required.';
    } else if (cleanName.length < 2) {
      errors.name = 'Package name must be at least 2 characters.';
    } else if (cleanName.length > 40) {
      errors.name = 'Package name cannot exceed 40 characters.';
    } else if (!/^[A-Za-z0-9\s\-_().&]+$/.test(cleanName)) {
      errors.name = 'Package name contains invalid characters.';
    } else if (!/[A-Za-z]/.test(cleanName)) {
      errors.name = 'Package name must contain at least one letter.';
    }

    if (!formData.status) {
      errors.status = 'Please choose a package status.';
    }

    if (formData.monthlyPrice < 0) {
      errors.monthlyPrice = 'Monthly price cannot be negative.';
    } else if (formData.monthlyPrice > 1000000) {
      errors.monthlyPrice = 'Monthly price cannot exceed ₹10,00,000.';
    }

    if (formData.yearlyPrice < 0) {
      errors.yearlyPrice = 'Yearly price cannot be negative.';
    } else if (formData.yearlyPrice > 10000000) {
      errors.yearlyPrice = 'Yearly price cannot exceed ₹1,00,00,000.';
    }

    if (formData.maxStudents < 0) {
      errors.maxStudents = 'Student limit cannot be negative.';
    } else if (formData.maxStudents > 100000) {
      errors.maxStudents = 'Max students limit cannot exceed 1,00,000.';
    }

    if (formData.maxStaff < 0) {
      errors.maxStaff = 'Staff limit cannot be negative.';
    } else if (formData.maxStaff > 10000) {
      errors.maxStaff = 'Max staff limit cannot exceed 10,000.';
    }

    if (formData.maxBranches < 0) {
      errors.maxBranches = 'Branches limit cannot be negative.';
    } else if (formData.maxBranches > 1000) {
      errors.maxBranches = 'Max branches cannot exceed 1,000.';
    }

    if ((formData.storageGb || 0) < 0) {
      errors.storageGb = 'Storage cannot be negative.';
    } else if ((formData.storageGb || 0) > 10000) {
      errors.storageGb = 'Storage cannot exceed 10,000 GB.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('error', 'Validation Error', 'Please correct the highlighted fields before saving.');
      return;
    }

    setFormErrors({});
    const safeData: PackagePlan = {
      ...formData,
      name: cleanName,
      tagline: (formData.tagline || '').trim().slice(0, 80),
      monthlyPrice: Number(formData.monthlyPrice) || 0,
      yearlyPrice: Number(formData.yearlyPrice) || 0,
      maxStudents: Number(formData.maxStudents) || 0,
      maxStaff: Number(formData.maxStaff) || 0,
      maxBranches: Number(formData.maxBranches) || 0,
      storageGb: Number(formData.storageGb) || 0,
    };

    let updatedList: PackagePlan[];
    const displayName = safeData.name.length > 28 ? `${safeData.name.slice(0, 28)}...` : safeData.name;
    if (editingPlan) {
      updatedList = plans.map(p => (p.id === editingPlan.id ? safeData : p));
      addToast('success', 'Package Updated', `${displayName} configuration saved.`);
    } else {
      updatedList = [...plans, safeData];
      addToast('success', 'Package Created', `${displayName} is now available.`);
    }

    setPlans(updatedList);
    try {
      const saved = await savePackagesApi(updatedList);
      if (Array.isArray(saved) && saved.length > 0) {
        setPlans(saved);
      }
    } catch (err) {
      console.error('Failed to save packages:', err);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    const remaining = plans.filter(p => p.id !== deletingPlan.id);
    setPlans(remaining);
    try {
      const saved = await savePackagesApi(remaining);
      if (Array.isArray(saved)) {
        setPlans(saved);
      }
    } catch (err) {
      console.error('Failed to delete package:', err);
    }
    addToast('success', 'Package Removed', `${deletingPlan.name} has been deleted.`);
    setDeletingPlan(null);
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-32">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Subscriptions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Subscription Packages & SaaS Tiers
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setBillingCycle('Monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                billingCycle === 'Monthly'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('Yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'Yearly'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded">Save 20%</span>
            </button>
          </div>

          {/* Add Package Button */}
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl btn-glass-primary text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Package</span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid / Empty State */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Subscription Packages Created Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only packages created by you will be listed here. Click below to configure your first institutional SaaS plan.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl btn-glass-primary text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Package</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map(plan => {
            const price = billingCycle === 'Monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const liveSchoolCount = getSchoolCountForPlan(plan.name);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 group hover:shadow-lg ${
                  plan.isPopular
                    ? 'border-sky-500 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Reserved Top Slot - Consistent alignment across all cards without border overlap */}
                  <div className="h-6 mb-2 flex items-center">
                    {plan.isPopular ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-600 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-500/20 text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
                        <Sparkles className="w-3 h-3 text-sky-500" />
                        Most Popular
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        Standard Tier
                      </span>
                    )}
                  </div>

                  {/* Header Title & Fixed School Count Badge */}
                  <div className="flex items-center justify-between gap-2 h-7 mb-1.5">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate" title={plan.name}>
                      {plan.name}
                    </h3>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {liveSchoolCount} {liveSchoolCount === 1 ? 'School' : 'Schools'}
                    </span>
                  </div>

                  {/* Subtitle / Tagline with uniform 2-line height */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 h-9 line-clamp-2 leading-relaxed" title={plan.tagline || 'Configured institutional SaaS tier'}>
                    {plan.tagline || 'Configured institutional SaaS tier'}
                  </p>

                  {/* Standardized Price Display Block */}
                  <div className="my-4 py-3.5 border-y border-slate-100 dark:border-slate-800 h-24 flex flex-col justify-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{Number(price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">/{billingCycle.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                      <span>{plan.maxStudents === 0 ? 'Unlimited' : `Up to ${plan.maxStudents.toLocaleString('en-IN')}`} Students</span>
                      <span>&bull;</span>
                      <span>{plan.maxBranches === 0 ? 'Unlimited' : `${plan.maxBranches}`} Campuses</span>
                    </div>
                  </div>

                  {/* Features List with Fixed Starting Y Position & Balanced Overflow */}
                  <div className="flex-1 min-h-[160px] max-h-[200px] overflow-y-auto pr-1 mb-4 space-y-2">
                    <ul className="space-y-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="break-words">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer Actions - Uniform Bottom Baseline */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95 ${
                      plan.isPopular
                        ? 'btn-glass-primary text-white shadow-md'
                        : 'btn-glass-secondary text-slate-800 dark:text-white'
                    }`}
                  >
                    Configure Plan
                  </button>
                  <button
                    onClick={() => setDeletingPlan(plan)}
                    title="Delete Package"
                    className="w-9 h-9 rounded-xl btn-glass-secondary flex items-center justify-center text-rose-500 hover:text-rose-600 active:scale-90 transition-transform cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingPlan ? `Configure ${editingPlan.name}` : 'Create New Subscription Package'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure pricing, limits, and included modules for schools</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. Starter Plan (max 40 chars)"
                    value={formData.name}
                    onChange={e => {
                      setFormData({ ...formData, name: e.target.value.slice(0, 40) });
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.name ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Best for pre-primary institutes"
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value.slice(0, 80) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>

                {/* Monthly Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    required
                    placeholder="0"
                    value={formData.monthlyPrice === 0 ? '' : formData.monthlyPrice}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.min(1000000, Math.max(0, Number(e.target.value)));
                      setFormData({ ...formData, monthlyPrice: val });
                      if (formErrors.monthlyPrice) setFormErrors(prev => ({ ...prev, monthlyPrice: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.monthlyPrice ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.monthlyPrice && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.monthlyPrice}</span>
                    </p>
                  )}
                </div>

                {/* Yearly Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Yearly Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleCalculateYearlyDiscount}
                      className="text-[10px] text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                    >
                      Apply 20% Discount
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    required
                    placeholder="0"
                    value={formData.yearlyPrice === 0 ? '' : formData.yearlyPrice}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.min(10000000, Math.max(0, Number(e.target.value)));
                      setFormData({ ...formData, yearlyPrice: val });
                      if (formErrors.yearlyPrice) setFormErrors(prev => ({ ...prev, yearlyPrice: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.yearlyPrice ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.yearlyPrice && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.yearlyPrice}</span>
                    </p>
                  )}
                </div>

                {/* Max Students */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Students Limit <span className="text-slate-400 font-normal">(0 = Unlimited, max 1,00,000)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    placeholder="0"
                    value={formData.maxStudents === 0 ? '' : formData.maxStudents}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.min(100000, Math.max(0, Number(e.target.value)));
                      setFormData({ ...formData, maxStudents: val });
                      if (formErrors.maxStudents) setFormErrors(prev => ({ ...prev, maxStudents: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.maxStudents ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.maxStudents && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.maxStudents}</span>
                    </p>
                  )}
                </div>

                {/* Max Staff */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Staff / Faculty <span className="text-slate-400 font-normal">(0 = Unlimited, max 10,000)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="0"
                    value={formData.maxStaff === 0 ? '' : formData.maxStaff}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.min(10000, Math.max(0, Number(e.target.value)));
                      setFormData({ ...formData, maxStaff: val });
                      if (formErrors.maxStaff) setFormErrors(prev => ({ ...prev, maxStaff: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.maxStaff ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.maxStaff && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.maxStaff}</span>
                    </p>
                  )}
                </div>

                {/* Max Campuses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Branches / Campuses <span className="text-slate-400 font-normal">(0 = Unlimited, max 1,000)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    placeholder="0"
                    value={formData.maxBranches === 0 ? '' : formData.maxBranches}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.min(1000, Math.max(0, Number(e.target.value)));
                      setFormData({ ...formData, maxBranches: val });
                      if (formErrors.maxBranches) setFormErrors(prev => ({ ...prev, maxBranches: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.maxBranches ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.maxBranches && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.maxBranches}</span>
                    </p>
                  )}
                </div>

                {/* Storage Quota */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storage Quota (GB) <span className="text-slate-400 font-normal">(max 10,000 GB)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="0"
                    value={formData.storageGb === 0 ? '' : formData.storageGb}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Math.min(10000, Math.max(0, Number(e.target.value)));
                      setFormData({ ...formData, storageGb: val });
                      if (formErrors.storageGb) setFormErrors(prev => ({ ...prev, storageGb: '' }));
                    }}
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border ${
                      formErrors.storageGb ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  />
                  {formErrors.storageGb && (
                    <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.storageGb}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Toggles: Most Popular & Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Mark as "Most Popular"</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Status: <span className="text-rose-500">*</span></span>
                  <select
                    value={formData.status}
                    onChange={e => {
                      setFormData({ ...formData, status: e.target.value as any });
                      if (formErrors.status) setFormErrors(prev => ({ ...prev, status: '' }));
                    }}
                    className={`px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border ${
                      formErrors.status ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                    } rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white`}
                  >
                    <option value="">Choose Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
              {formErrors.status && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{formErrors.status}</span>
                </p>
              )}

              {/* Features Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Included Features & Modules
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {formData.features.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  {PREDEFINED_MODULE_FEATURES.map((feat, idx) => {
                    const checked = formData.features.includes(feat);
                    return (
                      <label key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleFeature(feat)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="truncate">{feat}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Add Custom Feature */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom feature (e.g. 24/7 Dedicated Account Manager)"
                      value={customFeatureInput}
                      onChange={e => {
                        setCustomFeatureInput(e.target.value);
                        if (featureError) setFeatureError(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomFeature(e);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={!customFeatureInput.trim()}
                      onClick={handleAddCustomFeature}
                      className="px-3.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                  {featureError && (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 pl-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{featureError}</span>
                    </p>
                  )}
                </div>

                {/* Current Active Features List Badges */}
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                    {formData.features.map((f, i) => {
                      const isNew = f === newlyAddedFeature;
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            isNew
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-400 ring-2 ring-emerald-500/20 scale-105'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-500/20'
                          }`}
                        >
                          <span>{f}</span>
                          {isNew && <span className="text-[9px] font-black uppercase text-emerald-600">New</span>}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(f)}
                            className="hover:text-rose-600 cursor-pointer ml-0.5"
                            title="Remove feature"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold btn-glass-secondary rounded-2xl active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl btn-glass-primary font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingPlan ? 'Save Changes' : 'Create Package'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Package Plan"
        message={`Are you sure you want to delete "${deletingPlan?.name}"? ${getSchoolCountForPlan(deletingPlan?.name || '')} active schools are currently on this plan.`}
        confirmText="Delete Package"
        type="danger"
      />

    </div>
  );
};
