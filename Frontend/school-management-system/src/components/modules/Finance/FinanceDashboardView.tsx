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
  Clock,
} from "lucide-react";
import { useData } from "../../../context/DataContext";
import * as FinanceAPI from "../../../api/finance";
import { useToast } from "../../../context/ToastContext";

export const FinanceDashboardView: React.FC = () => {
  const {
    students,
    feePayments,
    studentTransports,
    studentHostels,
    studentScholarships,
    feeHeads,
    academicClasses,
    studentUniformIssues = [],
    uniforms = [],
    getStudentFeeOutstandingSummary,
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

  // Calculations purely from live stats
  const totalCollected = Number(apiStats?.totalCollectedRevenue || 0);
  const totalPending = Number(apiStats?.totalOutstandingDues || 0);
  const totalExpected = Number(apiStats?.totalExpectedRevenue || 0);
  const todaysCollection = Number(apiStats?.todayCollectionAmount || 0);
  const transportCollection = Number(apiStats?.transportRevenue || 0);
  const hostelCollection = Number(apiStats?.hostelRevenue || 0);
  const uniformCollection = Number(apiStats?.uniformRevenue || 0);
  const scholarshipAmount = Number(apiStats?.scholarshipsGranted || 0);
  const fineCollection = Number(apiStats?.fineCollected || 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header with 5-min Auto Refresh Status & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-500" /> Finance Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time fee collection, institutional revenue streams, and cash-flow health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>Auto-refresh: 5 min</span>
            <span className="text-slate-400 dark:text-slate-500">• {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          <button
            onClick={() => loadDashboardData(true)}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all disabled:opacity-60"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Expected Collection
            </span>
            <IndianRupee className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalExpected)}
          </h3>
          <p className="text-[10px] text-slate-400">Target baseline revenue</p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Collected
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCollected)}
          </h3>
          <p className="text-[10px] text-emerald-500 font-semibold">
            Realized revenue
          </p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Pending Dues
            </span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalPending)}
          </h3>
          <p className="text-[10px] text-rose-500 font-semibold">
            Action required
          </p>
        </div>

        <div className="glass-card p-5 rounded-3xl space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Today's Collection
            </span>
            <TrendingUp className="w-5 h-5 text-sky-500" />
          </div>
          <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {formatCurrency(todaysCollection)}
          </h3>
          <p className="text-[10px] text-slate-400">Daily receipt total</p>
        </div>
      </div>

      {/* Secondary Service KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Transport Revenue
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(transportCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Hostel Revenue
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(hostelCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Uniform Revenue
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(uniformCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
            <Shirt className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Scholarships Granted
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(scholarshipAmount)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Fine Collected
            </p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(fineCollection)}
            </h4>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Charts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Wise Breakdown */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-sky-500" /> Class-wise Revenue
          </h3>
          <div className="space-y-3">
            {apiStats?.classWiseRevenue && apiStats.classWiseRevenue.length > 0 ? (
              apiStats.classWiseRevenue.map((item: any, idx: number) => {
                const collected = Number(item.collectedAmount || 0);
                const expected = Number(item.expectedAmount || 0);
                const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : (collected > 0 ? 100 : 0);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white">
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
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-sky-500" /> Fee Collection by Category
          </h3>
          <div className="space-y-3">
            {feeHeads && feeHeads.length > 0 ? (
              feeHeads.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
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
                No fee categories configured yet. Create fee heads in Fee Masters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

