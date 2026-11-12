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

const dashboardStatsCache = new Map<string, any>();

const pickStat = (apiVal: unknown, fallbackVal: number): number =>
  typeof apiVal === "number" && Number.isFinite(apiVal) ? Number(apiVal) : fallbackVal;

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
  const cacheKey = `${selectedBranch || "all"}::${selectedAcademicYear || "all"}`;

  const { addToast } = useToast();
  const [apiStats, setApiStats] = useState<any>(() => dashboardStatsCache.get(cacheKey) ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setApiStats(dashboardStatsCache.get(cacheKey) ?? null);
  }, [cacheKey]);

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
        fetchFinanceDataRef.current ? fetchFinanceDataRef.current(isManual) : Promise.resolve(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value) {
        const stats = dashRes.value.data || dashRes.value;
        if (stats && (typeof stats.totalExpectedRevenue === "number" || typeof stats.totalOutstandingDues === "number")) {
          dashboardStatsCache.set(cacheKey, stats);
          setApiStats(stats);
          setApiError(null);
        }
      } else if (dashRes.status === "rejected") {
        console.warn("fetchFinanceDashboardStatsApi notice:", dashRes.reason);
        setApiError(dashRes.reason?.message || "Failed to fetch finance dashboard metrics from backend.");
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

    let totalPendingPolicyDues = 0;
    const todayStr = new Date().toISOString().slice(0, 10);

    (students || []).forEach((st) => {
      const ledger = getStudentFeeLedger ? getStudentFeeLedger(st.id, selectedAcademicYear) : null;
      if (!ledger) return;

      const stExp = Number(ledger.totalPayable ?? ledger.grossAmount ?? 0);
      const rawColl = Number(ledger.paidAmount || 0);
      const stColl = stExp > 0 ? Math.min(stExp, rawColl) : rawColl;
      concessions += Number(ledger.discountAmount || 0);

      expected += stExp;
      collected += stColl;

      // Student-wise Payment Policy Logic:
      const policyLower = String((ledger as any).feePolicy || (st as any).feePolicy || (st as any).feeCalculationMethod || "Full Annual Fee")
        .toLowerCase()
        .trim();
      const isFullAnnual = policyLower.includes("full") || policyLower.includes("annual") || policyLower.includes("one time") || policyLower.includes("one-time") ||
        (!policyLower.includes("term") && !policyLower.includes("quarter") && !policyLower.includes("monthly") && !policyLower.includes("pro-rata"));

      let stPending = 0;
      if (isFullAnnual) {
        // Annual Policy: Entire unpaid annual fee is pending regardless of term due dates
        stPending = Math.max(0, stExp - stColl);
      } else {
        // Term-wise Policy: Only installments whose due dates have arrived (Due Date <= Current Date)
        if (ledger.installments && ledger.installments.length > 0) {
          ledger.installments.forEach((inst: any) => {
            const instDue = inst.dueDate ? String(inst.dueDate).slice(0, 10) : "";
            if (!instDue || instDue <= todayStr) {
              stPending += Number(inst.dueAmount || 0);
            }
          });
        } else {
          stPending = Math.max(0, stExp - stColl);
        }
      }
      totalPendingPolicyDues += stPending;

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
        const amt = Number(item.finalAmount ?? item.originalAmount ?? item.amount ?? 0);
        const paid = Number(item.paidAmount ?? (item.status === 'Paid' ? amt : 0));

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

    const rawCollected = Math.max(collected, actualPaymentsSum);
    const finalCollected = expected > 0 ? Math.min(expected, rawCollected) : rawCollected;

    const classWise = Array.from(classMap.values()).map((c) => {
      const cExp = c.expected;
      const cColl = cExp > 0 ? Math.min(cExp, c.collected) : c.collected;
      return {
        className: c.className,
        totalExpectedRevenue: cExp,
        totalCollectedRevenue: cColl,
        totalPendingRevenue: Math.max(0, cExp - cColl),
        collectionPercentage: cExp > 0 ? Math.round((cColl / cExp) * 100) : 0,
        studentCount: c.studentCount,
      };
    });

    const categories = Array.from(categoryMap.values()).map((cat) => {
      const exp = cat.expectedAmount;
      const coll = exp > 0 ? Math.min(exp, cat.collectedAmount) : cat.collectedAmount;
      return {
        ...cat,
        collectedAmount: coll,
      };
    });

    const safeHostelColl = hostelExp > 0 ? Math.min(hostelExp, hostelColl) : hostelColl;
    const safeTransportColl = transportExp > 0 ? Math.min(transportExp, transportColl) : transportColl;
    const safeUniformColl = uniformExp > 0 ? Math.min(uniformExp, uniformColl) : uniformColl;
    const safeFinesColl = finesExp > 0 ? Math.min(finesExp, finesColl) : finesColl;

    return {
      expected,
      collected: finalCollected,
      pending: Math.min(Math.max(0, expected - finalCollected), totalPendingPolicyDues),
      classWise,
      categories,
      hostelExp,
      hostelColl: safeHostelColl,
      transportExp,
      transportColl: safeTransportColl,
      uniformExp,
      uniformColl: safeUniformColl,
      finesExp,
      finesColl: safeFinesColl,
      concessions,
    };
  }, [students, getStudentFeeLedger, selectedAcademicYear, feePayments]);

  // Dashboard financial metrics sourced directly and dynamically from the backend API stats or ledger fallback
  const computedExpected = React.useMemo(() => {
    if (apiStats && typeof apiStats.totalExpectedRevenue === 'number') {
      return Number(apiStats.totalExpectedRevenue);
    }
    return localStats.expected;
  }, [apiStats, localStats.expected]);

  const computedCollected = React.useMemo(() => {
    if (apiStats && typeof apiStats.totalCollectedRevenue === 'number') {
      return Number(apiStats.totalCollectedRevenue);
    }
    return localStats.collected;
  }, [apiStats, localStats.collected]);

  const totalCollected = computedCollected;
  const totalExpected = Math.max(computedExpected, computedCollected);

  const computedClassWiseRevenue = React.useMemo(() => {
    const raw = (apiStats?.classWiseRevenue && Array.isArray(apiStats.classWiseRevenue) && apiStats.classWiseRevenue.length > 0)
      ? apiStats.classWiseRevenue
      : localStats.classWise;
    return (raw || []).map((c: any) => {
      const exp = Number(c.expectedAmount ?? c.totalExpectedRevenue ?? 0);
      const coll = Number(c.collectedAmount ?? c.totalCollectedRevenue ?? 0);
      const safeExp = Math.max(exp, coll);
      return {
        ...c,
        totalExpectedRevenue: safeExp,
        expectedAmount: safeExp,
        totalCollectedRevenue: coll,
        collectedAmount: coll,
        totalPendingRevenue: Math.max(0, safeExp - coll),
        collectionPercentage: safeExp > 0 ? Math.round((coll / safeExp) * 100) : (coll > 0 ? 100 : 0),
      };
    });
  }, [apiStats, localStats.classWise]);

  const totalPending = React.useMemo(() => {
    if (apiStats && typeof apiStats.totalPendingDues === "number") {
      return Number(apiStats.totalPendingDues);
    }
    if (apiStats && typeof apiStats.totalOutstandingDues === "number") {
      return Number(apiStats.totalOutstandingDues);
    }
    return localStats.pending;
  }, [apiStats, localStats.pending]);
  const todaysCollection = Number(apiStats?.todayCollectionAmount || 0);

  // Module Specific Expected, Collected, Pending Amounts (never fall back on valid 0 from API)
  const hostelCollected = pickStat(apiStats?.hostelCollected, localStats.hostelColl);
  const hostelExpected = Math.max(pickStat(apiStats?.hostelExpected, localStats.hostelExp), hostelCollected);
  const hostelPending = Math.max(0, hostelExpected - hostelCollected);

  const transportCollected = pickStat(apiStats?.transportCollected, localStats.transportColl);
  const transportExpected = Math.max(pickStat(apiStats?.transportExpected, localStats.transportExp), transportCollected);
  const transportPending = Math.max(0, transportExpected - transportCollected);

  const uniformCollected = pickStat(apiStats?.uniformCollected, localStats.uniformColl);
  const uniformExpected = Math.max(pickStat(apiStats?.uniformExpected, localStats.uniformExp), uniformCollected);
  const uniformPending = Math.max(0, uniformExpected - uniformCollected);

  const finesExpected = pickStat(apiStats?.finesExpected, localStats.finesExp);
  const finesCollected = pickStat(apiStats?.finesCollected, localStats.finesColl);
  const finesPending = Math.max(0, finesExpected - finesCollected);

  const scholarshipAmount = pickStat(
    apiStats?.scholarshipsGranted ?? apiStats?.totalConcessionsGranted,
    localStats.concessions
  );

  const cashBalance = React.useMemo(() => {
    if (apiStats && typeof apiStats.cashBalance === "number" && Number.isFinite(apiStats.cashBalance)) {
      return Number(apiStats.cashBalance);
    }
    return (financialAccounts || [])
      .filter((a) => a.accountType === "Cash" || a.accountType === "Petty Cash Account" || (a.accountType || "").toLowerCase().includes("cash"))
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [apiStats, financialAccounts]);

  const bankBalance = React.useMemo(() => {
    if (apiStats && typeof apiStats.bankBalance === "number" && Number.isFinite(apiStats.bankBalance)) {
      return Number(apiStats.bankBalance);
    }
    return (financialAccounts || [])
      .filter((a) => a.accountType !== "Cash" && a.accountType !== "Petty Cash Account" && !(a.accountType || "").toLowerCase().includes("cash"))
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [apiStats, financialAccounts]);

  const totalLiquidity = pickStat(apiStats?.totalLiquidity, cashBalance + bankBalance);

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
      const safeExp = Math.max(exp, coll);

      if (!map.has(name)) {
        map.set(name, {
          categoryName: name,
          expectedAmount: safeExp,
          collectedAmount: coll,
        });
      } else {
        const existing = map.get(name)!;
        existing.expectedAmount = Math.max(existing.expectedAmount, safeExp);
        existing.collectedAmount = Math.max(existing.collectedAmount, coll);
      }
    }

    return Array.from(map.values());
  }, [apiStats?.categoryBreakdown, localStats.categories]);

  const handleCardClick = (targetTab: string) => {
    if (onNavigate) {
      onNavigate(targetTab);
    }
  };

  const primaryKpiCards = [
    {
      label: "Total Expected Collection",
      value: totalExpected,
      valueClass: "text-slate-900 dark:text-white",
      borderClass: "border-l-sky-500",
      iconBgClass: "bg-sky-50 dark:bg-sky-950 text-sky-500 group-hover:bg-sky-500",
      linkClass: "text-sky-600 dark:text-sky-400",
      linkText: "View Dues",
      targetTab: "due-fees",
      Icon: IndianRupee,
    },
    {
      label: "Total Collected",
      value: totalCollected,
      valueClass: "text-emerald-600 dark:text-emerald-400",
      borderClass: "border-l-emerald-500",
      iconBgClass: "bg-emerald-50 dark:bg-emerald-950 text-emerald-500 group-hover:bg-emerald-500",
      linkClass: "text-emerald-600 dark:text-emerald-400",
      linkText: "Collect Fees",
      targetTab: "fee-collection",
      Icon: CheckCircle,
    },
    {
      label: "Total Pending Dues",
      value: totalPending,
      valueClass: "text-rose-600 dark:text-rose-400",
      borderClass: "border-l-rose-500",
      iconBgClass: "bg-rose-50 dark:bg-rose-950 text-rose-500 group-hover:bg-rose-500",
      linkClass: "text-rose-600 dark:text-rose-400",
      linkText: "View Dues",
      targetTab: "student-fees",
      Icon: AlertCircle,
    },
    {
      label: "Today's Collection",
      value: todaysCollection,
      valueClass: "text-sky-600 dark:text-sky-400",
      borderClass: "border-l-sky-500",
      iconBgClass: "bg-sky-50 dark:bg-sky-950 text-sky-500 group-hover:bg-sky-500",
      linkClass: "text-sky-600 dark:text-sky-400",
      linkText: "Receipts",
      targetTab: "fee-collection",
      Icon: TrendingUp,
    },
    {
      label: "Liquidity Accounts",
      value: totalLiquidity,
      valueClass: "text-indigo-600 dark:text-indigo-400",
      borderClass: "border-l-indigo-500",
      iconBgClass: "bg-indigo-50 dark:bg-indigo-950 text-indigo-500 group-hover:bg-indigo-500",
      linkClass: "text-indigo-600 dark:text-indigo-400",
      linkText: "View Vaults",
      targetTab: "accounts",
      Icon: CreditCard,
      sublines: [
        { label: "Bank", amount: bankBalance, cls: "text-sky-600 dark:text-sky-400 font-semibold" },
        { label: "Cash", amount: cashBalance, cls: "text-emerald-600 dark:text-emerald-400 font-semibold" },
      ],
    },
  ];

  const secondaryKpiCards = [
    {
      label: "Transport",
      value: transportCollected,
      hoverBorder: "hover:border-sky-300 dark:hover:border-sky-800",
      arrowClass: "text-sky-500",
      iconBgClass: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 group-hover:bg-sky-500",
      targetTab: "transport",
      Icon: Bus,
      sublines: [
        { label: "Expected", amount: transportExpected, cls: "text-slate-500 dark:text-slate-400" },
        { label: "Pending", amount: transportPending, cls: "text-rose-500 font-semibold" },
      ],
    },
    {
      label: "Hostel",
      value: hostelCollected,
      hoverBorder: "hover:border-cyan-300 dark:hover:border-cyan-800",
      arrowClass: "text-cyan-500",
      iconBgClass: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 group-hover:bg-cyan-500",
      targetTab: "hostel",
      Icon: Home,
      sublines: [
        { label: "Expected", amount: hostelExpected, cls: "text-slate-500 dark:text-slate-400" },
        { label: "Pending", amount: hostelPending, cls: "text-rose-500 font-semibold" },
      ],
    },
    {
      label: "Uniform",
      value: uniformCollected,
      hoverBorder: "hover:border-purple-300 dark:hover:border-purple-800",
      arrowClass: "text-purple-500",
      iconBgClass: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 group-hover:bg-purple-500",
      targetTab: "uniforms",
      Icon: Shirt,
      sublines: [
        { label: "Expected", amount: uniformExpected, cls: "text-slate-500 dark:text-slate-400" },
        { label: "Pending", amount: uniformPending, cls: "text-rose-500 font-semibold" },
      ],
    },
    {
      label: "Scholarships",
      value: scholarshipAmount,
      hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-800",
      arrowClass: "text-emerald-500",
      iconBgClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:bg-emerald-500",
      targetTab: "concessions",
      Icon: Gift,
      sublines: [],
    },
    {
      label: "Fines",
      value: finesCollected,
      hoverBorder: "hover:border-rose-300 dark:hover:border-rose-800",
      arrowClass: "text-rose-500",
      iconBgClass: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 group-hover:bg-rose-500",
      targetTab: "student-fees",
      Icon: AlertTriangle,
      sublines: [
        { label: "Assessed", amount: finesExpected, cls: "text-slate-500 dark:text-slate-400" },
        { label: "Pending", amount: finesPending, cls: "text-rose-500 font-semibold" },
      ],
    },
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {primaryKpiCards.map((card) => {
          const formatted = formatCurrency(card.value);
          const IconComponent = card.Icon;
          return (
            <div
              key={card.label}
              onClick={() => handleCardClick(card.targetTab)}
              className={`glass-card p-4 sm:p-5 rounded-3xl flex flex-col justify-between h-full min-w-0 overflow-hidden gap-2 border-l-4 ${card.borderClass} cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-xl group`}
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide leading-snug">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl shrink-0 ${card.iconBgClass} group-hover:text-white transition-colors`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <h3
                title={formatted}
                className={`text-lg font-black tabular-nums leading-tight truncate ${card.valueClass}`}
              >
                {formatted}
              </h3>
              {card.sublines && card.sublines.length > 0 && (
                <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
                  {card.sublines.map((sub) => {
                    const subFormatted = formatCurrency(sub.amount);
                    return (
                      <div key={sub.label} className="flex items-center justify-between gap-2 min-w-0">
                        <span className="shrink-0">{sub.label}:</span>
                        <span title={subFormatted} className={`truncate tabular-nums ${sub.cls}`}>
                          {subFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center justify-end mt-auto pt-1">
                <span className={`text-[11px] font-bold ${card.linkClass} flex items-center gap-0.5 group-hover:underline`}>
                  {card.linkText} <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module-Wise Functional KPI Cards Grid (Hostel, Transport, Uniform, Fines, Scholarships) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {secondaryKpiCards.map((card) => {
          const formatted = formatCurrency(card.value);
          const IconComponent = card.Icon;
          return (
            <div
              key={card.label}
              onClick={() => handleCardClick(card.targetTab)}
              className={`glass-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between h-full min-w-0 overflow-hidden gap-2 cursor-pointer ${card.hoverBorder} transition-all hover:scale-[1.01] group`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 truncate">
                  {card.label} <ArrowUpRight className={`w-3 h-3 shrink-0 ${card.arrowClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </p>
                <div className={`p-2 rounded-xl shrink-0 ${card.iconBgClass} group-hover:text-white transition-colors`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <div className="min-w-0">
                <h4
                  title={formatted}
                  className="text-lg font-black tabular-nums leading-tight truncate text-slate-900 dark:text-white"
                >
                  {formatted}
                </h4>
                {card.sublines.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium min-w-0">
                    {card.sublines.map((sub) => {
                      const subFormatted = formatCurrency(sub.amount);
                      return (
                        <div key={sub.label} className="flex items-center justify-between gap-2 min-w-0">
                          <span className="shrink-0">{sub.label}:</span>
                          <span title={subFormatted} className={`truncate tabular-nums ${sub.cls}`}>
                            {subFormatted}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
