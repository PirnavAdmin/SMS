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

  // Form State
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
      features: [
        'Student Admissions & Directory',
        'Daily Attendance & Leave Tracking',
        'Timetable & Automated Substitution',
        'Fee Management & Online Payments'
      ]
    });
    setCustomFeatureInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PackagePlan) => {
    setEditingPlan(plan);
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
    if (!customFeatureInput.trim()) return;
    if (formData.features.includes(customFeatureInput.trim())) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, customFeatureInput.trim()]
    }));
    setCustomFeatureInput('');
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
    if (!formData.name.trim()) {
      addToast('error', 'Validation Error', 'Package name is required.');
      return;
    }
    if (!formData.status) {
      addToast('error', 'Validation Error', 'Please select a package status.');
      return;
    }

    let updatedList: PackagePlan[];
    if (editingPlan) {
      updatedList = plans.map(p => (p.id === editingPlan.id ? formData : p));
      addToast('success', 'Package Updated', `${formData.name} configuration saved.`);
    } else {
      updatedList = [...plans, formData];
      addToast('success', 'Package Created', `${formData.name} is now available.`);
    }

    setPlans(updatedList);
    await savePackagesApi(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    const remaining = plans.filter(p => p.id !== deletingPlan.id);
    setPlans(remaining);
    await savePackagesApi(remaining);
    addToast('success', 'Package Removed', `${deletingPlan.name} has been deleted.`);
    setDeletingPlan(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {liveSchoolCount} {liveSchoolCount === 1 ? 'School' : 'Schools'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{plan.tagline || 'Configured institutional SaaS tier'}</p>

                  {/* Price Display */}
                  <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{price}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">/{billingCycle.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>{plan.maxStudents === 0 ? 'Unlimited' : `Up to ${plan.maxStudents}`} Students</span>
                      &bull;
                      <span>{plan.maxBranches === 0 ? 'Unlimited' : `${plan.maxBranches}`} Campuses</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
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
                    placeholder="e.g. Starter Plan"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Best for pre-primary institutes"
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
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
                    required
                    placeholder="0"
                    value={formData.monthlyPrice === 0 ? '' : formData.monthlyPrice}
                    onChange={e => setFormData({ ...formData, monthlyPrice: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
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
                    required
                    placeholder="0"
                    value={formData.yearlyPrice === 0 ? '' : formData.yearlyPrice}
                    onChange={e => setFormData({ ...formData, yearlyPrice: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>

                {/* Max Students */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Students Limit <span className="text-slate-400 font-normal">(0 = Unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.maxStudents === 0 ? '' : formData.maxStudents}
                    onChange={e => setFormData({ ...formData, maxStudents: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>

                {/* Max Staff */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Staff / Faculty <span className="text-slate-400 font-normal">(0 = Unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.maxStaff === 0 ? '' : formData.maxStaff}
                    onChange={e => setFormData({ ...formData, maxStaff: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>

                {/* Max Campuses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Branches / Campuses <span className="text-slate-400 font-normal">(0 = Unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.maxBranches === 0 ? '' : formData.maxBranches}
                    onChange={e => setFormData({ ...formData, maxBranches: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>

                {/* Storage Quota */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storage Quota (GB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.storageGb === 0 ? '' : formData.storageGb}
                    onChange={e => setFormData({ ...formData, storageGb: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Toggles: Most Popular & Status */}
              <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
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
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Features Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Included Features & Modules
                </label>
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
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom feature (e.g. 24/7 Dedicated Account Manager)"
                    value={customFeatureInput}
                    onChange={e => setCustomFeatureInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFeature}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Current Active Features List Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-500/20"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(f)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
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
