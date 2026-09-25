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
} from "lucide-react";
import { useData } from "../../../context/DataContext";
import * as FinanceAPI from "../../../api/finance";
import { useToast } from "../../../context/ToastContext";
import { matchesClassName } from "../../../utils/classSorter";

interface FinanceDashboardViewProps {
  onNavigate?: (tab: string) => void;
}

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({ onNavigate }) => {
  const {
    students,
    feePayments,
    studentTransports,
    studentHostels,
    studentScholarships,
    feeHeads,
    academicClasses,
    dynamicFeeStructures,
    studentFeeAssignments,
    fetchFinanceData,
  } = useData();

  const { addToast } = useToast();
  const [apiStats, setApiStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchFinanceDataRef = React.useRef(fetchFinanceData);
  fetchFinanceDataRef.current = fetchFinanceData;
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  const loadDashboardData = useCallback(async (isManual = false) => {
    setIsLoading(true);
    try {
      const [dashRes] = await Promise.allSettled([
        FinanceAPI.fetchFinanceDashboardStatsApi(),
        fetchFinanceDataRef.current ? fetchFinanceDataRef.current() : Promise.resolve(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setApiStats(dashRes.value.data);
      }
      setLastUpdated(new Date());
      if (isManual) {
        addToastRef.current("success", "Dashboard Refreshed", "Loaded latest financial metrics and transactions.");
      }
    } catch (err) {
      console.warn("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount and 5-minute recurring auto-refresh timer
  useEffect(() => {
    loadDashboardData(false);
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const computedExpected = React.useMemo(() => {
    if (apiStats && Number(apiStats?.totalExpectedRevenue || 0) > 0) {
      return Number(apiStats.totalExpectedRevenue);
    }
    let expected = 0;
    (students || []).forEach((st) => {
      const assignment = (studentFeeAssignments || []).find(
        (a) => (String(a.studentId) === String(st.id) || (st.admissionNo && String(a.studentId) === String(st.admissionNo))) && (a.status === 'Active' || !a.status)
      );
      if (assignment) {
        expected += Number(assignment.baseFeeTotal || (assignment as any).totalAmount || 0);
      } else {
        const dfs = (dynamicFeeStructures || []).find(
          (d) => matchesClassName(d.className, st.className) && (d.status === 'Active' || !d.status)
        );
        if (dfs) {
          expected += Number(dfs.totalAmount || 0);
        }
      }
    });
    return expected;
  }, [apiStats, students, studentFeeAssignments, dynamicFeeStructures]);

  const computedCollected = React.useMemo(() => {
    if (apiStats && Number(apiStats?.totalCollectedRevenue || 0) > 0) {
      return Number(apiStats.totalCollectedRevenue);
    }
    return (feePayments || []).reduce(
      (sum, p) => sum + (Number(p.amountPaid ?? (p as any).amount) || 0),
      0
    );
  }, [apiStats, feePayments]);

  const totalCollected = computedCollected;
  const totalExpected = computedExpected;
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const todaysCollection = Number(apiStats?.todayCollectionAmount || 0);
  const transportCollection = Number(apiStats?.transportRevenue || 0);
  const hostelCollection = Number(apiStats?.hostelRevenue || 0);
  const uniformCollection = Number(apiStats?.uniformRevenue || 0);
  const scholarshipAmount = Number(apiStats?.scholarshipsGranted || 0);
  const fineCollection = Number(apiStats?.fineCollected || 0);

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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial overview. Click any KPI card to navigate directly to its detail screen.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Primary KPI Cards Grid with Interactive Navigations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected Collection */}
        <div
          onClick={() => handleCardClick("fee-setup")}
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
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-400">Target baseline revenue</p>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:underline">
              Fee Setup <ArrowUpRight className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-emerald-500 font-semibold">
              Realized revenue
            </p>
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
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-rose-500 font-semibold">
              Action required
            </p>
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
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-400">Daily receipt total</p>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:underline">
              Receipts <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Service KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Transport Revenue */}
        <div
          onClick={() => handleCardClick("reports")}
          className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all hover:scale-[1.02] group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Transport <ArrowUpRight className="w-3 h-3 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(transportCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        {/* Hostel Revenue */}
        <div
          onClick={() => handleCardClick("reports")}
          className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all hover:scale-[1.02] group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Hostel <ArrowUpRight className="w-3 h-3 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(hostelCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
            <Home className="w-5 h-5" />
          </div>
        </div>

        {/* Uniform Revenue */}
        <div
          onClick={() => handleCardClick("reports")}
          className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-all hover:scale-[1.02] group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Uniform <ArrowUpRight className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(uniformCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <Shirt className="w-5 h-5" />
          </div>
        </div>

        {/* Scholarships Granted */}
        <div
          onClick={() => handleCardClick("concessions")}
          className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800 transition-all hover:scale-[1.02] group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Scholarships <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(scholarshipAmount)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        {/* Fine Collected */}
        <div
          onClick={() => handleCardClick("ledger")}
          className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-rose-300 dark:hover:border-rose-800 transition-all hover:scale-[1.02] group"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
              Fines <ArrowUpRight className="w-3 h-3 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(fineCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Charts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Wise Breakdown */}
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
            {apiStats?.classWiseRevenue && apiStats.classWiseRevenue.length > 0 ? (
              apiStats.classWiseRevenue.map((item: any, idx: number) => {
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
                        Collected: {formatCurrency(collected)} / Target: {formatCurrency(expected)} ({pct}%)
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
            ) : academicClasses && academicClasses.length > 0 ? (
              academicClasses.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-slate-500">Collected: ₹0 / Target: ₹0 (0%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                No classes or fee assignments configured yet.
              </div>
            )}
          </div>
        </div>

        {/* Fee Head Wise Breakdown */}
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
            {feeHeads && feeHeads.length > 0 ? (
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
