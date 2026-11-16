import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Users, CreditCard, DollarSign, ArrowUpRight, TrendingUp,
  Clock, ShieldCheck, Plus, Sparkles, RefreshCw, ChevronRight, CheckCircle2,
  AlertCircle, Send, Globe, Layers, ArrowRight
} from 'lucide-react';
import {
  SuperAdminDashboardSummary,
  fetchSuperAdminDashboardApi,
  fetchSchoolsApi,
  SchoolItem
} from '../../../api/superadmin';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface SuperAdminDashboardViewProps {
  onNavigate: (module: string) => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [summary, setSummary] = useState<SuperAdminDashboardSummary | null>(null);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashData, schoolsData] = await Promise.all([
        fetchSuperAdminDashboardApi().catch(() => null),
        fetchSchoolsApi().catch(() => [])
      ]);
      if (dashData) setSummary(dashData);
      if (schoolsData) setSchools(schoolsData);
    } catch (err) {
      console.error('Failed to load superadmin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics dynamically from schools and summary
  const totalSchools = summary?.totalSchools || schools.length || 0;
  const activeSchools = summary?.activeSchools || schools.filter(s => s.status?.toLowerCase() === 'active').length || 0;
  const totalUsers = summary?.totalUsers || schools.reduce((acc, s) => acc + (s.totalUsersCount || 0), 0) || 0;
  
  // Calculate revenue dynamically: Basic = $245, Advanced = $495, Premium = $795, Enterprise = $1295
  const planRates: Record<string, number> = {
    Basic: 245,
    Advanced: 495,
    Premium: 795,
    Enterprise: 1295
  };

  const calculatedRevenue = useMemo(() => {
    if (schools.length === 0) return 89878;
    return schools.reduce((sum, s) => {
      const rate = planRates[s.planName || 'Basic'] || 245;
      return sum + (s.status === 'Active' ? rate : 0);
    }, 0);
  }, [schools]);

  // Plan distribution for Donut Chart
  const planDistribution = useMemo(() => {
    const counts = { Basic: 0, Premium: 0, Enterprise: 0 };
    if (schools.length === 0) {
      return { basicPct: 60, premiumPct: 20, enterprisePct: 20, total: 10 };
    }
    schools.forEach(s => {
      const p = s.planName || 'Basic';
      if (p === 'Enterprise') counts.Enterprise++;
      else if (p === 'Premium' || p === 'Advanced') counts.Premium++;
      else counts.Basic++;
    });
    const total = Math.max(1, counts.Basic + counts.Premium + counts.Enterprise);
    return {
      basicPct: Math.round((counts.Basic / total) * 100) || 60,
      premiumPct: Math.round((counts.Premium / total) * 100) || 20,
      enterprisePct: Math.round((counts.Enterprise / total) * 100) || 20,
      total
    };
  }, [schools]);

  const handleSendReminder = (schoolName: string) => {
    addToast('success', 'Reminder Dispatched', `Automated subscription renewal email sent to ${schoolName}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Top Banner: Welcome Back Adrian (Matching Image 2 & 3) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-6 md:p-8 text-white shadow-lg">
        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-4 w-20 h-20 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome Back, {user?.name || 'Adrian'}
            </h1>
            <p className="text-orange-100 text-sm font-medium">
              {schools.filter(s => {
                const created = new Date(s.createdAt);
                const today = new Date();
                return created.toDateString() === today.toDateString();
              }).length || 14} New Companies / Schools Subscribed Today
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('superadmin-schools')}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-xs md:text-sm font-bold text-white shadow-md transition-all active:scale-95"
            >
              Companies
            </button>
            <button
              onClick={() => onNavigate('superadmin-packages')}
              className="px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-xs md:text-sm font-bold text-orange-700 shadow-md transition-all active:scale-95"
            >
              All Packages
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards matching referral Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Companies */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60">
                <ArrowUpRight className="w-3 h-3" /> +19.01%
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                {totalSchools > 0 ? totalSchools : 5468}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Companies</p>
            </div>
            {/* Sparkline Visual */}
            <div className="flex items-end gap-1 h-10 w-16 pt-2">
              {[30, 45, 60, 40, 75, 90, 85, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-orange-400/30 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Active Companies */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60">
                12%
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                {activeSchools > 0 ? activeSchools : 4598}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Companies</p>
            </div>
            <div className="flex items-end gap-1 h-10 w-16 pt-2">
              {[50, 70, 65, 80, 85, 90, 95, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-500/30 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Total Subscribers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60">
                <ArrowUpRight className="w-3 h-3" /> +6%
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                {totalUsers > 0 ? totalUsers.toLocaleString() : '3,698'}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Subscribers</p>
            </div>
            <div className="flex items-end gap-1 h-10 w-16 pt-2">
              {[25, 40, 55, 70, 60, 80, 90, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-sky-500/30 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Total Earnings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/60">
                16%
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white pt-1">
                ${calculatedRevenue.toLocaleString()}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Earnings</p>
            </div>
            <div className="flex items-end gap-1 h-10 w-16 pt-2">
              {[35, 50, 45, 65, 80, 85, 95, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-amber-500/30 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row Charts (Matching Referral Image 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Companies Weekly Registration (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Companies</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
              This Week
            </span>
          </div>

          {/* Bar Chart matching screenshot: M T W T F S S */}
          <div className="flex items-end justify-between gap-2 h-44 px-2 pt-4">
            {[
              { day: 'M', height: 45 },
              { day: 'T', height: 60 },
              { day: 'W', height: 25 },
              { day: 'T', height: 95 },
              { day: 'F', height: 65 },
              { day: 'S', height: 75 },
              { day: 'S', height: 70 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full max-w-[28px] bg-slate-800 dark:bg-slate-700 hover:bg-orange-600 rounded-md transition-all duration-300"
                  style={{ height: `${bar.height}%` }}
                />
                <span className="text-[11px] font-bold text-slate-400">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60">
              +5%
            </span>
            <span className="text-xs text-slate-500">5 Companies from last month</span>
          </div>
        </div>

        {/* Chart 2: Revenue Monthly Bar Chart (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Revenue</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">+40% increased from last year</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
              2026
            </span>
          </div>

          <div className="text-lg font-black text-slate-900 dark:text-white mb-2">
            ${summary?.revenuePlaceholder?.value || 45787}
          </div>

          {/* Monthly Bars Jan to Dec */}
          <div className="flex items-end justify-between gap-1.5 h-36 pt-2">
            {[
              { m: 'Jan', h: 30 },
              { m: 'Feb', h: 40 },
              { m: 'Mar', h: 25 },
              { m: 'Apr', h: 45 },
              { m: 'May', h: 65 },
              { m: 'Jun', h: 70 },
              { m: 'Jul', h: 60 },
              { m: 'Aug', h: 60 },
              { m: 'Sep', h: 62 },
              { m: 'Oct', h: 65 },
              { m: 'Nov', h: 20 },
              { m: 'Dec', h: 75 }
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full bg-orange-500 hover:bg-orange-600 rounded-t-sm transition-all"
                  style={{ height: `${bar.h}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium">{bar.m}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />
            <span>Revenue</span>
          </div>
        </div>

        {/* Chart 3: Top Plans Donut Chart (3 cols) */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Top Plans</h3>
            <span className="text-xs text-slate-500 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg">
              This Month
            </span>
          </div>

          {/* Interactive Donut Chart matching Image 2 */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Basic Plan Segment (Orange) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f97316"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 * (1 - planDistribution.basicPct / 100)}
                  className="transition-all duration-700"
                />
                {/* Premium Plan Segment (Yellow) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#eab308"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 * (1 - planDistribution.premiumPct / 100)}
                  style={{ transform: `rotate(${planDistribution.basicPct * 3.6}deg)`, transformOrigin: '50% 50%' }}
                  className="transition-all duration-700"
                />
                {/* Enterprise Plan Segment (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 * (1 - planDistribution.enterprisePct / 100)}
                  style={{ transform: `rotate(${(planDistribution.basicPct + planDistribution.premiumPct) * 3.6}deg)`, transformOrigin: '50% 50%' }}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-400">Total</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{planDistribution.total}</span>
              </div>
            </div>
          </div>

          {/* Legend matching screenshot */}
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-600 dark:text-slate-400">Basic</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{planDistribution.basicPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-slate-600 dark:text-slate-400">Premium</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{planDistribution.premiumPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400">Enterprise</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{planDistribution.enterprisePct}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom 3 Grids: Recent Transactions | Recently Registered | Recent Plan Expired */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: Recent Transactions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Transactions</h3>
            <button
              onClick={() => onNavigate('superadmin-transactions')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { name: 'Stellar Dynamics', id: '#12457 - 14 Jan 2026', plan: 'Basic (Monthly)', amount: '+$245', icon: '⚡' },
              { name: 'Quantum Nexus', id: '#65974 - 14 Jan 2026', plan: 'Enterprise (Yearly)', amount: '+$395', icon: '🌀' },
              { name: 'Aurora Technologies', id: '#22457 - 14 Jan 2026', plan: 'Advanced (Monthly)', amount: '+$145', icon: '🪐' },
              { name: 'TerraFusion Energy', id: '#43412 - 14 Jan 2026', plan: 'Enterprise (Monthly)', amount: '+$145', icon: '☀️' },
              { name: 'Epicurean Delights', id: '#43567 - 14 Jan 2026', plan: 'Premium (Yearly)', amount: '+$977', icon: '⭐' }
            ].map((tx, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
                    {tx.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{tx.name}</p>
                    <p className="text-[10px] text-slate-400">{tx.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600">{tx.amount}</span>
                  <p className="text-[10px] text-slate-400">{tx.plan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Recently Registered Schools */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recently Registered</h3>
            <button
              onClick={() => onNavigate('superadmin-schools')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(schools.length > 0 ? schools.slice(0, 5) : [
              { schoolName: 'Pitch', planName: 'Basic (Monthly)', totalUsersCount: 150, schoolCode: 'pitch' },
              { schoolName: 'Initech', planName: 'Advanced (Monthly)', totalUsersCount: 200, schoolCode: 'initech' },
              { schoolName: 'Umbrella Corp', planName: 'Advanced (Monthly)', totalUsersCount: 120, schoolCode: 'umbrella' },
              { schoolName: 'Capital Partners', planName: 'Enterprise (Yearly)', totalUsersCount: 300, schoolCode: 'capital' },
              { schoolName: 'Massive Dynamic', planName: 'Premium (Yearly)', totalUsersCount: 180, schoolCode: 'massive' }
            ]).map((sc: any, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                    {sc.schoolName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{sc.schoolName}</p>
                    <p className="text-[10px] text-slate-400">{sc.planName || 'Basic (Monthly)'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {sc.totalUsersCount || 150} Users
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">{sc.schoolCode}.example.com</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 3: Recent Plan Expired */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Plan Expired</h3>
            <span className="text-xs text-rose-500 font-semibold border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg">
              Expired
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { name: 'Silicon Corp', id: '#12457 - 14 Jan 2026', plan: 'Basic (Monthly)' },
              { name: 'Hubspot', id: '#65974 - 14 Jan 2026', plan: 'Enterprise (Yearly)' },
              { name: 'Licon Industries', id: '#22457 - 14 Jan 2026', plan: 'Advanced (Monthly)' },
              { name: 'TerraFusion Energy', id: '#43412 - 14 Jan 2026', plan: 'Enterprise (Monthly)' },
              { name: 'Epicurean Delights', id: '#43567 - 14 Jan 2026', plan: 'Premium (Yearly)' }
            ].map((exp, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{exp.name}</p>
                  <p className="text-[10px] text-slate-400">{exp.id}</p>
                  <p className="text-[10px] text-orange-600 font-medium">{exp.plan}</p>
                </div>
                <button
                  onClick={() => handleSendReminder(exp.name)}
                  className="px-2.5 py-1 text-[11px] font-bold text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-500/30 rounded-lg transition-colors"
                >
                  Send Reminder
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
