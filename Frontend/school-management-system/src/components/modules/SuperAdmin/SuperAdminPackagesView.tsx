import React, { useState } from 'react';
import { Layers, Check, Plus, Edit, Zap, Shield, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface PackagePlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxStaff: number;
  maxBranches: number;
  isPopular?: boolean;
  features: string[];
  activeSubscribers: number;
}

export const SuperAdminPackagesView: React.FC = () => {
  const { addToast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Yearly'>('Monthly');

  const [plans, setPlans] = useState<PackagePlan[]>([
    {
      id: 'basic',
      name: 'Basic Plan',
      tagline: 'Ideal for small schools and pre-primary institutes',
      monthlyPrice: 245,
      yearlyPrice: 2450,
      maxStudents: 500,
      maxStaff: 50,
      maxBranches: 1,
      features: [
        'Up to 500 Active Students',
        'Single Campus / Branch',
        'Student Attendance & Leave',
        'Academic Timetable & Subjects',
        'Standard Fee Collection',
        'Email Notifications'
      ],
      activeSubscribers: 18
    },
    {
      id: 'advanced',
      name: 'Advanced Plan',
      tagline: 'Perfect for growing primary and secondary schools',
      monthlyPrice: 495,
      yearlyPrice: 4950,
      maxStudents: 1500,
      maxStaff: 150,
      maxBranches: 2,
      isPopular: true,
      features: [
        'Up to 1,500 Active Students',
        'Up to 2 Campuses / Branches',
        'Online Admissions & Parent Portal',
        'Staff Payroll & Payslips',
        'Examination & Report Cards',
        'Library & Book Tracking',
        'Priority Technical Support'
      ],
      activeSubscribers: 42
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      tagline: 'Comprehensive suite for large multi-wing educational institutions',
      monthlyPrice: 795,
      yearlyPrice: 7950,
      maxStudents: 3500,
      maxStaff: 300,
      maxBranches: 5,
      features: [
        'Up to 3,500 Active Students',
        'Up to 5 Multi-Wing Campuses',
        'Transport & GPS Bus Tracking',
        'Hostel & Room Allocation',
        'Automated Substitution Engine',
        'SMS & WhatsApp Gateways',
        '24/7 Dedicated Account Manager'
      ],
      activeSubscribers: 14
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      tagline: 'Custom infrastructure for school groups, trusts, and universities',
      monthlyPrice: 1295,
      yearlyPrice: 12950,
      maxStudents: 99999,
      maxStaff: 99999,
      maxBranches: 999,
      features: [
        'Unlimited Students & Staff',
        'Unlimited Campuses & Branches',
        'Custom Domain & Dedicated Subdomain',
        'Full White-Labeling & Custom App',
        'Custom ERP Integrations & SLA',
        'Automated Database Backups',
        'Dedicated Cloud Pod'
      ],
      activeSubscribers: 8
    }
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Packages & Subscriptions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Subscription Packages & SaaS Tiers
          </h1>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setBillingCycle('Monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              billingCycle === 'Monthly'
                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('Yearly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              billingCycle === 'Yearly'
                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Yearly</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => {
          const price = billingCycle === 'Monthly' ? plan.monthlyPrice : plan.yearlyPrice;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 ${
                plan.isPopular
                  ? 'border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {plan.activeSubscribers} Schools
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{plan.tagline}</p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">${price}</span>
                    <span className="text-xs font-semibold text-slate-400">/{billingCycle.toLowerCase()}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => addToast('info', 'Package Selected', `Assigned ${plan.name} configuration.`)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    plan.isPopular
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                  }`}
                >
                  Configure Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
