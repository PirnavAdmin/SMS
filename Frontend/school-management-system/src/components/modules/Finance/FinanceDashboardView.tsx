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
    fetchFinanceData,
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

  // Client-side fallback calculations if API response is empty
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

  const computedClassWiseRevenue = React.useMemo(() => {
    if (apiStats?.classWiseRevenue && apiStats.classWiseRevenue.length > 0) {
      return apiStats.classWiseRevenue;
    }
    if (!academicClasses || academicClasses.length === 0) return [];

    return academicClasses.map((c) => {
      const classStudents = (students || []).filter((s) => matchesClassName(s.className, c.name));
      let expected = 0;
      let collected = 0;

      classStudents.forEach((st) => {
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

        const studentPayments = (feePayments || []).filter(
          (p) => String(p.studentId) === String(st.id) || (st.admissionNo && String(p.studentId) === String(st.admissionNo))
        );
        studentPayments.forEach((p) => {
          collected += Number((p.amountPaid ?? (p as any).amount) || 0);
        });
      });

      return {
        className: c.name,
        expectedAmount: expected,
        collectedAmount: collected,
      };
    });
  }, [apiStats, academicClasses, students, studentFeeAssignments, dynamicFeeStructures, feePayments]);

  const totalCollected = computedCollected;
  const totalExpected = computedExpected;
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const todaysCollection = Number(apiStats?.todayCollectionAmount || 0);

  // Module Specific Expected, Collected, Pending Amounts
  const hostelExpected = Number(apiStats?.hostelExpected || (apiStats?.hostelRevenue ? apiStats.hostelRevenue * 1.2 : 0));
  const hostelCollected = Number(apiStats?.hostelCollected || apiStats?.hostelRevenue || 0);
  const hostelPending = Number(apiStats?.hostelPending || Math.max(0, hostelExpected - hostelCollected));

  const transportExpected = Number(apiStats?.transportExpected || (apiStats?.transportRevenue ? apiStats.transportRevenue * 1.2 : 0));
  const transportCollected = Number(apiStats?.transportCollected || apiStats?.transportRevenue || 0);
  const transportPending = Number(apiStats?.transportPending || Math.max(0, transportExpected - transportCollected));

  const uniformExpected = Number(apiStats?.uniformExpected || (apiStats?.uniformRevenue ? apiStats.uniformRevenue * 1.2 : 0));
  const uniformCollected = Number(apiStats?.uniformCollected || apiStats?.uniformRevenue || 0);
  const uniformPending = Number(apiStats?.uniformPending || Math.max(0, uniformExpected - uniformCollected));

  const finesExpected = Number(apiStats?.finesExpected || (apiStats?.fineCollected ? apiStats.fineCollected * 1.2 : 0));
  const finesCollected = Number(apiStats?.finesCollected || apiStats?.fineCollected || 0);
  const finesPending = Number(apiStats?.finesPending || Math.max(0, finesExpected - finesCollected));

  const scholarshipAmount = Number(apiStats?.scholarshipsGranted || apiStats?.totalConcessionsGranted || 0);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {apiStats?.categoryBreakdown && apiStats.categoryBreakdown.length > 0 ? (
              apiStats.categoryBreakdown.map((cat: any, idx: number) => {
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
