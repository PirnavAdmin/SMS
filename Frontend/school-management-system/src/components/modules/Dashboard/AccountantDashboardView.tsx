// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  WalletCards,
  Receipt,
  Users,
  Search,
  Calendar,
  ShieldCheck,
  Layers,
  Plus,
  FileText,
  RefreshCw,
  CreditCard,
  ArrowUpRight,
  PieChart,
  Filter,
  Megaphone,
  Check,
  Building,
  Bus,
  Home,
  Shirt
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { formatCurrency } from "../../../utils/currency";
import * as FinanceAPI from "../../../api/finance";

interface AccountantDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const AccountantDashboardView: React.FC<AccountantDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    students = [],
    feePayments = [],
    academicClasses = [],
    announcements = [],
    holidays = [],
    schoolEvents = [],
    fetchFinanceData
  } = useData();

  const { addToast } = useToast();
  const [apiStats, setApiStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async (isManual = false) => {
    setIsLoading(true);
    try {
      const [dashRes] = await Promise.allSettled([
        FinanceAPI.fetchFinanceDashboardStatsApi(),
        fetchFinanceData ? fetchFinanceData() : Promise.resolve(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setApiStats(dashRes.value.data);
      }
      setLastUpdated(new Date());
      if (isManual) {
        addToast("success", "Dashboard Refreshed", "Loaded latest financial metrics and transactions.");
      }
    } catch (err) {
      console.warn("Failed to load accountant dashboard metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFinanceData, addToast]);

  useEffect(() => {
    loadDashboardData(false);
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleNavigate = (moduleName: string) => {
    if (onNavigate) {
      onNavigate(moduleName);
    }
  };

  // Financial Metric Calculations
  const totalCollected = Number(apiStats?.totalCollectedRevenue || 0);
  const totalPending = Number(apiStats?.totalOutstandingDues || 0);
  const totalExpected = Number(apiStats?.totalExpectedRevenue || (totalCollected + totalPending)) || 1;
  const todaysCollection = Number(apiStats?.todayCollectionAmount || 0);
  const transportCollection = Number(apiStats?.transportRevenue || 0);
  const hostelCollection = Number(apiStats?.hostelRevenue || 0);
  const uniformCollection = Number(apiStats?.uniformRevenue || 0);
  const scholarshipAmount = Number(apiStats?.scholarshipsGranted || 0);
  const fineCollection = Number(apiStats?.fineCollected || 0);

  const collectionRatePct = Math.min(100, Math.round((totalCollected / totalExpected) * 100)) || 0;

  // Filtered recent fee transactions
  const recentTransactions = useMemo(() => {
    const sorted = [...(feePayments || [])].sort(
      (a, b) => new Date(b.date || b.paymentDate || 0).getTime() - new Date(a.date || a.paymentDate || 0).getTime()
    );

    if (!searchQuery.trim()) return sorted.slice(0, 7);

    const q = searchQuery.toLowerCase();
    return sorted.filter(
      (t) =>
        (t.studentName || "").toLowerCase().includes(q) ||
        (t.receiptNo || t.id || "").toString().toLowerCase().includes(q) ||
        (t.className || "").toLowerCase().includes(q) ||
        (t.paymentMode || "").toLowerCase().includes(q)
    ).slice(0, 7);
  }, [feePayments, searchQuery]);

  // Students with pending dues
  const topDuesStudents = useMemo(() => {
    const defaulters: Array<{
      id: string;
      name: string;
      rollNo: string;
      className: string;
      dueAmount: number;
      phone: string;
    }> = [];

    students.forEach((s) => {
      const pending = Number(s.pendingFee || s.dueAmount || s.outstandingFee || 0);
      if (pending > 0) {
        defaulters.push({
          id: s.id,
          name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.name || "Student",
          rollNo: s.rollNo || s.admissionNo || "N/A",
          className: `${s.className || ""} ${s.section || ""}`.trim() || "N/A",
          dueAmount: pending,
          phone: s.mobileNo || s.parentMobile || s.fatherMobile || "N/A",
        });
      }
    });

    defaulters.sort((a, b) => b.dueAmount - a.dueAmount);
    return defaulters.slice(0, 5);
  }, [students]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner - Matching Application CSS Theme */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-900 dark:text-white pb-1">
        <div className="relative z-10 text-left space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {user?.name || "Accountant"}!</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => handleNavigate("fees")}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-sm shadow-sky-600/30 flex items-center gap-1.5 transition cursor-pointer h-[34px]"
          >
            <IndianRupee className="w-3.5 h-3.5" /> Collect Student Fee
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("finance-due-fees")}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition cursor-pointer h-[34px] border border-slate-200/60 dark:border-slate-700"
          >
            <WalletCards className="w-3.5 h-3.5 text-emerald-600" /> View Dues List
          </button>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer h-[34px] w-[34px] flex items-center justify-center border border-slate-200/60 dark:border-slate-700"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Collected */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Revenue Collected
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200/60 dark:border-emerald-800/60">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(totalCollected)}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs font-extrabold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {collectionRatePct}% Collected
              </span>
              <span className="text-slate-400 font-mono text-[11px]">Target: {formatCurrency(totalExpected)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${collectionRatePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Outstanding Dues
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200/60 dark:border-rose-800/60">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalPending)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Pending fee balances across enrolled students
            </p>
          </div>
        </div>

        {/* Today's Collections */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Today's Collections
            </span>
            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 border border-sky-200/60 dark:border-sky-800/60">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
              {formatCurrency(todaysCollection)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Cash, online, UPI & bank receipts today
            </p>
          </div>
        </div>

        {/* Concessions & Fine Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Scholarships & Fines
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 border border-purple-200/60 dark:border-purple-800/60">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Scholarships Granted:</span>
              <span className="font-extrabold text-purple-600">{formatCurrency(scholarshipAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Fines & Penalties:</span>
              <span className="font-extrabold text-emerald-600">{formatCurrency(fineCollection)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown & Quick Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fee Category Collections */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" /> Fee Category Collections
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate("finance-masters")}
              className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1 cursor-pointer"
            >
              Fee Setup <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Transport */}
            <div
              onClick={() => handleNavigate("transport")}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition"
            >
              <div className="flex items-center gap-2 text-sky-600">
                <Bus className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transport Fees</span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(transportCollection)}
              </p>
            </div>

            {/* Hostel */}
            <div
              onClick={() => handleNavigate("hostel")}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              <div className="flex items-center gap-2 text-indigo-600">
                <Home className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hostel Fees</span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(hostelCollection)}
              </p>
            </div>

            {/* Uniform */}
            <div
              onClick={() => handleNavigate("uniforms")}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition"
            >
              <div className="flex items-center gap-2 text-amber-600">
                <Shirt className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Uniform Store Sales</span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(uniformCollection)}
              </p>
            </div>
          </div>
        </div>

        {/* Accountant Quick Actions Panel */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-sky-600" /> Accountant Quick Shortcuts
          </h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleNavigate("fees")}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition">
                    Fee Collection
                  </h4>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("finance-due-fees")}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 shrink-0">
                  <WalletCards className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                    Outstanding Dues
                  </h4>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("inventory")}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-800 text-left transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                    Inventory
                  </h4>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Fee Receipts & Outstanding Defaulters Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Payment Receipts */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" /> Recent Fee Payments
              </h3>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 h-[32px] w-full sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="px-3 py-2.5">Receipt #</th>
                  <th className="px-3 py-2.5">Student Name</th>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">Mode</th>
                  <th className="px-3 py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-bold">
                      No fee payment records found.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-sky-600">
                        #{t.receiptNo || t.id || `REC-${1000 + idx}`}
                      </td>
                      <td className="px-3 py-2.5 font-extrabold text-slate-900 dark:text-white">
                        {t.studentName || "Student Payment"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 font-semibold">
                        {t.className || "N/A"}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-extrabold text-emerald-600">
                        {formatCurrency(Number(t.amount || t.paidAmount || 0))}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                          {t.paymentMode || t.mode || "Cash"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-500 text-[11px]">
                        {t.date || t.paymentDate || "Today"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highest Dues Defaulter List */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" /> High Dues Balances
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate("fees")}
              className="text-xs font-bold text-sky-600 hover:text-sky-500"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {topDuesStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                No high outstanding dues recorded.
              </div>
            ) : (
              topDuesStudents.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 truncate">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {s.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Class: {s.className} • Roll: {s.rollNo}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-rose-600 block">
                      {formatCurrency(s.dueAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavigate("fees")}
                      className="text-[10px] font-extrabold text-sky-600 hover:underline cursor-pointer"
                    >
                      Collect Dues
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
