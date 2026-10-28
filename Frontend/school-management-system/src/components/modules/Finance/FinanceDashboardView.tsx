import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "../../../utils/currency";
import {
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Bus,
  Home,
  Gift,
  AlertTriangle,
  TrendingUp,
  PieChart,
  BarChart2,
  Shirt,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { useData } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import * as FinanceAPI from "../../../api/finance";
import { useToast } from "../../../context/ToastContext";
import { matchesClassName } from "../../../utils/classSorter";
import { FINANCE_UPDATED_EVENT } from "../../../utils/financeEvents";

interface FinanceDashboardViewProps {
  onNavigate?: (tab: string) => void;
}

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ onNavigate }) => {
  const {
    students,
    feePayments,
    feeHeads,
    academicClasses,
    dynamicFeeStructures,
    studentFeeAssignments,
    financialAccounts,
    fetchFinanceData,
    getStudentFeeLedger,
  } = useData();

  const { selectedBranch, selectedAcademicYear } = useAuth();

  const { addToast } = useToast();
  const [apiStats, setApiStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchFinanceDataRef = React.useRef(fetchFinanceData);
  fetchFinanceDataRef.current = fetchFinanceData;
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  const loadDashboardData = useCallback(async (isManual = false) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [dashRes] = await Promise.allSettled([
        FinanceAPI.fetchFinanceDashboardStatsApi(selectedBranch, selectedAcademicYear),
        fetchFinanceDataRef.current ? fetchFinanceDataRef.current() : Promise.resolve(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setApiStats(dashRes.value.data);
        setApiError(null);
      } else if (dashRes.status === "rejected") {
        setApiError("Failed to fetch finance dashboard metrics from backend.");
      }
      setLastUpdated(new Date());
      if (isManual) {
        addToastRef.current("success", "Dashboard Refreshed", "Loaded latest financial metrics and transactions.");
      }
    } catch (err: any) {
      console.warn("Failed to load dashboard data", err);
      setApiError(err?.message || "Error loading dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, selectedAcademicYear]);

  // Initial load on mount, branch/academicYear change, and 5-minute recurring auto-refresh timer
  useEffect(() => {
    loadDashboardData(false);
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Listen for global real-time finance update events (payments, fee assignments, distributions)
  useEffect(() => {
    const handleFinanceUpdated = () => {
      loadDashboardData(false);
    };

    window.addEventListener(FINANCE_UPDATED_EVENT, handleFinanceUpdated);
    return () => {
      window.removeEventListener(FINANCE_UPDATED_EVENT, handleFinanceUpdated);
    };
  }, [loadDashboardData]);

  // Real-time dynamic local fallback calculation directly from student fee ledgers
  const localStats = React.useMemo(() => {
    let expected = 0;
    let collected = 0;
    let hostelExp = 0;
    let hostelColl = 0;
    let transportExp = 0;
    let transportColl = 0;
    let uniformExp = 0;
    let uniformColl = 0;
    let finesExp = 0;
    let finesColl = 0;
    let concessions = 0;

    const classMap = new Map<string, { className: string; expected: number; collected: number; studentCount: number }>();
    const categoryMap = new Map<string, { categoryName: string; expectedAmount: number; collectedAmount: number }>();

    (students || []).forEach((st) => {
      const ledger = getStudentFeeLedger ? getStudentFeeLedger(st.id, selectedAcademicYear) : null;
      if (!ledger) return;

      const stExp = Number(ledger.totalPayable ?? ledger.grossAmount ?? 0);
      const stColl = Number(ledger.paidAmount || 0);
      concessions += Number(ledger.discountAmount || 0);

      expected += stExp;
      collected += stColl;

      const cName = st.className || "Unassigned";
      if (!classMap.has(cName)) {
        classMap.set(cName, { className: cName, expected: 0, collected: 0, studentCount: 0 });
      }
      const cEntry = classMap.get(cName)!;
      cEntry.expected += stExp;
      cEntry.collected += stColl;
      cEntry.studentCount += 1;

      (ledger.feeItems || []).forEach((item: any) => {
        let catName = (item.feeCategory || item.category || item.feeHeadName || "Tuition Fee").trim();
        const lower = catName.toLowerCase();
        const amt = Number(item.amount || 0);
        const paid = Number(item.paidAmount || 0);

        if (lower.includes("transport") || lower.includes("conveyance") || lower.includes("bus")) {
          catName = "Transport Fee";
          transportExp += amt;
          transportColl += paid;
        } else if (lower.includes("hostel") || lower.includes("boarding") || lower.includes("mess") || lower.includes("security")) {
          catName = "Hostel Fee";
          hostelExp += amt;
          hostelColl += paid;
        } else if (lower.includes("uniform") || lower.includes("dress")) {
          catName = "Uniform Fee";
          uniformExp += amt;
          uniformColl += paid;
        } else if (lower.includes("fine") || lower.includes("penalty")) {
          catName = "Late Fines & Penalties";
          finesExp += amt;
          finesColl += paid;
        } else if (lower.includes("admission") || lower.includes("registration")) {
          catName = "Admission Fee";
        } else {
          catName = "Tuition Fee";
        }

        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { categoryName: catName, expectedAmount: 0, collectedAmount: 0 });
        }
        const catEntry = categoryMap.get(catName)!;
        catEntry.expectedAmount += amt;
        catEntry.collectedAmount += paid;
      });
    });

    const actualPaymentsSum = (feePayments || [])
      .filter((p) => p.status === "Paid" || p.status === "Partial")
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const finalCollected = Math.max(collected, actualPaymentsSum);

    const classWise = Array.from(classMap.values()).map((c) => ({
      className: c.className,
      totalExpectedRevenue: c.expected,
      totalCollectedRevenue: c.collected,
      totalPendingRevenue: Math.max(0, c.expected - c.collected),
      collectionPercentage: c.expected > 0 ? Math.round((c.collected / c.expected) * 100) : 0,
      studentCount: c.studentCount,
    }));

    const categories = Array.from(categoryMap.values());

    return {
      expected,
      collected: finalCollected,
      pending: Math.max(0, expected - finalCollected),
      classWise,
      categories,
      hostelExp,
      hostelColl,
      transportExp,
      transportColl,
      uniformExp,
      uniformColl,
      finesExp,
      finesColl,
      concessions,
    };
  }, [students, getStudentFeeLedger, selectedAcademicYear, feePayments]);

  // Dashboard financial metrics sourced directly and dynamically from the backend API stats or ledger fallback
  const computedExpected = React.useMemo(() => {
    if (apiStats && typeof apiStats.totalExpectedRevenue === 'number' && apiStats.totalExpectedRevenue > 0) {
      return Number(apiStats.totalExpectedRevenue);
    }
    return localStats.expected;
  }, [apiStats, localStats.expected]);

  const computedCollected = React.useMemo(() => {
    if (apiStats && typeof apiStats.totalCollectedRevenue === 'number' && apiStats.totalCollectedRevenue > 0) {
      return Number(apiStats.totalCollectedRevenue);
    }
    return localStats.collected;
  }, [apiStats, localStats.collected]);

  const computedClassWiseRevenue = React.useMemo(() => {
    if (apiStats?.classWiseRevenue && Array.isArray(apiStats.classWiseRevenue) && apiStats.classWiseRevenue.length > 0) {
      return apiStats.classWiseRevenue;
    }
    return localStats.classWise;
  }, [apiStats, localStats.classWise]);

  const totalCollected = computedCollected;
  const totalExpected = computedExpected;
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const todaysCollection = Number(apiStats?.todayCollectionAmount || 0);

  // Module Specific Expected, Collected, Pending Amounts
  const hostelExpected = React.useMemo(() => {
    if (apiStats && typeof apiStats.hostelExpected === 'number' && apiStats.hostelExpected > 0) {
      return Number(apiStats.hostelExpected);
    }
    return localStats.hostelExp;
  }, [apiStats, localStats.hostelExp]);

  const hostelCollected = React.useMemo(() => {
    if (apiStats && typeof apiStats.hostelCollected === 'number' && apiStats.hostelCollected > 0) {
      return Number(apiStats.hostelCollected);
    }
    return localStats.hostelColl;
  }, [apiStats, localStats.hostelColl]);

  const hostelPending = Math.max(0, hostelExpected - hostelCollected);

  const transportExpected = React.useMemo(() => {
    if (apiStats && typeof apiStats.transportExpected === 'number' && apiStats.transportExpected > 0) {
      return Number(apiStats.transportExpected);
    }
    return localStats.transportExp;
  }, [apiStats, localStats.transportExp]);

  const transportCollected = React.useMemo(() => {
    if (apiStats && typeof apiStats.transportCollected === 'number' && apiStats.transportCollected > 0) {
      return Number(apiStats.transportCollected);
    }
    return localStats.transportColl;
  }, [apiStats, localStats.transportColl]);

  const transportPending = Math.max(0, transportExpected - transportCollected);

  const uniformExpected = React.useMemo(() => {
    if (apiStats && typeof apiStats.uniformExpected === 'number' && apiStats.uniformExpected > 0) {
      return Number(apiStats.uniformExpected);
    }
    return localStats.uniformExp;
  }, [apiStats, localStats.uniformExp]);

  const uniformCollected = React.useMemo(() => {
    if (apiStats && typeof apiStats.uniformCollected === 'number' && apiStats.uniformCollected > 0) {
      return Number(apiStats.uniformCollected);
    }
    return localStats.uniformColl;
  }, [apiStats, localStats.uniformColl]);

  const uniformPending = Math.max(0, uniformExpected - uniformCollected);

  const finesExpected = React.useMemo(() => {
    if (apiStats && typeof apiStats.finesExpected === 'number' && apiStats.finesExpected > 0) {
      return Number(apiStats.finesExpected);
    }
    return localStats.finesExp;
  }, [apiStats, localStats.finesExp]);

  const finesCollected = React.useMemo(() => {
    if (apiStats && typeof apiStats.finesCollected === 'number' && apiStats.finesCollected > 0) {
      return Number(apiStats.finesCollected);
    }
    return localStats.finesColl;
  }, [apiStats, localStats.finesColl]);

  const finesPending = Math.max(0, finesExpected - finesCollected);

  const scholarshipAmount = Number(apiStats?.scholarshipsGranted || apiStats?.totalConcessionsGranted || localStats.concessions || 0);

  const cashBalance = React.useMemo(() => {
    return (financialAccounts || [])
      .filter((a) => a.accountType === "Cash" || a.accountType === "Petty Cash Account" || (a.accountType || "").toLowerCase().includes("cash"))
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [financialAccounts]);

  const bankBalance = React.useMemo(() => {
    return (financialAccounts || [])
      .filter((a) => a.accountType !== "Cash" && a.accountType !== "Petty Cash Account" && !(a.accountType || "").toLowerCase().includes("cash"))
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [financialAccounts]);

  const totalLiquidity = cashBalance + bankBalance;

  const normalizedCategoryBreakdown = React.useMemo(() => {
    if (!apiStats?.categoryBreakdown || !Array.isArray(apiStats.categoryBreakdown) || apiStats.categoryBreakdown.length === 0) {
      return localStats.categories;
    }
    const map = new Map<string, { categoryName: string; expectedAmount: number; collectedAmount: number }>();

    for (const cat of apiStats.categoryBreakdown) {
      if (!cat) continue;
      let name = (cat.categoryName || "").trim();
      const lower = name.toLowerCase();

      // Normalize common variants to standard canonical category names
      if (lower.includes("transport") || lower.includes("conveyance") || lower.includes("bus route") || lower.startsWith("route") || lower.includes("van")) {
        name = "Transport Fee";
      } else if (lower.includes("hostel") || lower.includes("block fee") || lower.includes("boarding") || lower.includes("mess") || lower.includes("bed fee")) {
        name = "Hostel Fee";
      } else if (lower.includes("uniform") || lower.includes("merchandise") || lower.includes("dress")) {
        name = "Uniform Fee";
      } else if (lower.includes("fine") || lower.includes("penalty")) {
        name = "Late Fines & Penalties";
      } else if (lower.includes("admission") || lower.includes("registration") || lower.includes("application")) {
        name = "Admission Fee";
      } else if (lower.includes("tuition") || lower.includes("academic") || lower.includes("term")) {
        name = "Tuition Fee";
      }

      const exp = Number(cat.expectedAmount || 0);
      const coll = Number(cat.collectedAmount || 0);

      if (!map.has(name)) {
        map.set(name, {
          categoryName: name,
          expectedAmount: exp,
          collectedAmount: coll,
        });
      } else {
        const existing = map.get(name)!;
        existing.expectedAmount = Math.max(existing.expectedAmount, exp);
        existing.collectedAmount = Math.max(existing.collectedAmount, coll);
      }
    }

    return Array.from(map.values());
  }, [apiStats?.categoryBreakdown]);

  const handleCardClick = (targetTab: string) => {
    if (onNavigate) {
      onNavigate(targetTab);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-500" /> Finance Dashboard
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {apiError && (
            <span className="text-xs font-semibold text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" /> API Warning
            </span>
          )}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-500" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Expected Collection */}
        <div
          onClick={() => handleCardClick("due-fees")}
          className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Expected Collection
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpected)}
          </h3>
          <div className="flex items-center justify-end pt-1">
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:underline">
              View Dues <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Total Collected */}
        <div
          onClick={() => handleCardClick("fee-collection")}
          className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-500 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Collected
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCollected)}
          </h3>
          <div className="flex items-center justify-end pt-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:underline">
              Collect Fees <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Total Pending Dues */}
        <div
          onClick={() => handleCardClick("student-fees")}
          className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-500 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Pending Dues
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalPending)}
          </h3>
          <div className="flex items-center justify-end pt-1">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 group-hover:underline">
              View Dues <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Today's Collection */}
        <div
          onClick={() => handleCardClick("fee-collection")}
          className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Today's Collection
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {formatCurrency(todaysCollection)}
          </h3>
          <div className="flex items-center justify-end pt-1">
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:underline">
              Receipts <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Liquidity Accounts & Vaults KPI Card */}
        <div
          onClick={() => handleCardClick("accounts")}
          className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-indigo-500 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Liquidity Accounts
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalLiquidity)}
          </h3>
          <div className="flex flex-col gap-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Bank: <strong className="text-sky-600 dark:text-sky-400">{formatCurrency(bankBalance)}</strong></span>
            <span>Cash: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(cashBalance)}</strong></span>
          </div>
          <div className="flex items-center justify-end pt-1">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:underline">
              View Vaults <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Module-Wise Functional KPI Cards Grid (Hostel, Transport, Uniform, Fines, Scholarships) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Transport KPI Card */}
        <div
          onClick={() => handleCardClick("transport")}
          className="glass-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Transport <ArrowUpRight className="w-3 h-3 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(transportCollected)}
            </h4>
            <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Expected: {formatCurrency(transportExpected)}</span>
              <span className="text-rose-500 font-semibold">Pending: {formatCurrency(transportPending)}</span>
            </div>
          </div>
        </div>

        {/* Hostel KPI Card */}
        <div
          onClick={() => handleCardClick("hostel")}
          className="glass-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-800 transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Hostel <ArrowUpRight className="w-3 h-3 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(hostelCollected)}
            </h4>
            <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Expected: {formatCurrency(hostelExpected)}</span>
              <span className="text-rose-500 font-semibold">Pending: {formatCurrency(hostelPending)}</span>
            </div>
          </div>
        </div>

        {/* Uniform KPI Card */}
        <div
          onClick={() => handleCardClick("uniforms")}
          className="glass-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Uniform <ArrowUpRight className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(uniformCollected)}
            </h4>
            <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Expected: {formatCurrency(uniformExpected)}</span>
              <span className="text-rose-500 font-semibold">Pending: {formatCurrency(uniformPending)}</span>
            </div>
          </div>
        </div>

        {/* Scholarships Granted KPI Card */}
        <div
          onClick={() => handleCardClick("concessions")}
          className="glass-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800 transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Scholarships <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(scholarshipAmount)}
            </h4>
          </div>
        </div>

        {/* Fines KPI Card */}
        <div
          onClick={() => handleCardClick("student-fees")}
          className="glass-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-rose-300 dark:hover:border-rose-800 transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Fines <ArrowUpRight className="w-3 h-3 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(finesCollected)}
            </h4>
            <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Assessed: {formatCurrency(finesExpected)}</span>
              <span className="text-rose-500 font-semibold">Pending: {formatCurrency(finesPending)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-Wise Revenue Breakdown */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-sky-500" /> Class-wise Revenue Breakdown
            </h3>
            <button
              onClick={() => handleCardClick("student-fees")}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              View Student Fees <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {computedClassWiseRevenue && computedClassWiseRevenue.length > 0 ? (
              computedClassWiseRevenue.map((item: any, idx: number) => {
                const collected = Number(item.collectedAmount || 0);
                const expected = Number(item.expectedAmount || 0);
                const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : (collected > 0 ? 100 : 0);
                return (
                  <div
                    key={idx}
                    onClick={() => handleCardClick("student-fees")}
                    className="space-y-1 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {item.className}
                      </span>
                      <span className="text-slate-500">
                        Coll: {formatCurrency(collected)} / Exp: {formatCurrency(expected)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                No classes or fee assignments configured yet.
              </div>
            )}
          </div>
        </div>

        {/* Fee Collection by Category */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-sky-500" /> Fee Collection by Category
            </h3>
            <button
              onClick={() => handleCardClick("fee-setup")}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Fee Setup <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {normalizedCategoryBreakdown && normalizedCategoryBreakdown.length > 0 ? (
              normalizedCategoryBreakdown.map((cat: any, idx: number) => {
                const exp = Number(cat.expectedAmount || 0);
                const coll = Number(cat.collectedAmount || 0);
                const pend = Math.max(0, exp - coll);
                const pct = exp > 0 ? Math.min(100, Math.round((coll / exp) * 100)) : (coll > 0 ? 100 : 0);

                return (
                  <div
                    key={idx}
                    onClick={() => handleCardClick("fee-setup")}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col space-y-1 text-xs cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {cat.categoryName}
                      </p>
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {formatCurrency(coll)} / {formatCurrency(exp)} ({pct}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Collected: {formatCurrency(coll)}</span>
                      <span className="text-rose-500 font-semibold">Pending: {formatCurrency(pend)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : feeHeads && feeHeads.length > 0 ? (
              feeHeads.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  onClick={() => handleCardClick("fee-setup")}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {h.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {h.category} • {h.frequency}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold">
                    {h.mandatory ? "Mandatory" : "Optional"}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                No fee categories configured yet. Create fee heads in Fee Setup.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
