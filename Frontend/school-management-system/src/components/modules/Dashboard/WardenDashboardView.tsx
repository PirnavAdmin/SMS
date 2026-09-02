import React, { useMemo, useState } from "react";
import {
  Building2,
  Bed,
  LogOut,
  Wrench,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Home,
  Check,
  FileText,
  UserX,
  Phone,
  AlertCircle,
  Users,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { useHostel } from "../../../context/HostelContext";
import { useToast } from "../../../context/ToastContext";

interface WardenDashboardViewProps {
  onNavigate?: (module: string) => void;
}

interface OutpassItem {
  id: string | number;
  studentName: string;
  className: string;
  roomNo: string;
  outpassType: string;
  departureDate: string;
  returnDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Active";
}

const WardenOccupancyDonutChart: React.FC<{
  occupied: number;
  total: number;
  vacant: number;
  outpass: number;
}> = ({ occupied, total, vacant, outpass }) => {
  const tot = total || 1;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  const occPct = Math.round((occupied / tot) * 100);
  const vacPct = Math.max(0, Math.round((vacant / tot) * 100));
  const outPct = Math.round((outpass / tot) * 100);

  const rotOcc = -90;
  const rotVac = rotOcc + (occupied / tot) * 360;
  const rotOut = rotVac + (vacant / tot) * 360;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full h-full gap-4 text-left">
      <div className="relative flex items-center justify-center shrink-0 w-[120px] h-[120px] group/chart cursor-pointer">
        <svg className="w-full h-full transform rotate-0" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
          {occupied > 0 && (
            <circle
              cx="40" cy="40" r={radius} fill="transparent" stroke="#0284c7" strokeWidth="10"
              strokeDasharray={`${(occupied / tot) * circumference} ${circumference}`}
              strokeDashoffset="0" transform={`rotate(${rotOcc} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
            />
          )}
          {vacant > 0 && (
            <circle
              cx="40" cy="40" r={radius} fill="transparent" stroke="#10b981" strokeWidth="10"
              strokeDasharray={`${(vacant / tot) * circumference} ${circumference}`}
              strokeDashoffset="0" transform={`rotate(${rotVac} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
            />
          )}
          {outpass > 0 && (
            <circle
              cx="40" cy="40" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="10"
              strokeDasharray={`${(outpass / tot) * circumference} ${circumference}`}
              strokeDashoffset="0" transform={`rotate(${rotOut} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
            {occPct}%
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
            Occupied
          </span>
        </div>
      </div>

      {/* Legend Breakdown */}
      <div className="flex-1 space-y-2 text-xs w-full">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Occupied Beds</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono">{occupied} ({occPct}%)</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Vacant Beds</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono">{vacant} ({vacPct}%)</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">On Out-Pass</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono">{outpass} ({outPct}%)</span>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-bold flex justify-between">
          <span>Total Bed Capacity</span>
          <span className="font-mono text-slate-900 dark:text-white font-bold">{tot} Beds</span>
        </div>
      </div>
    </div>
  );
};

export const WardenDashboardView: React.FC<WardenDashboardViewProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const { students = [], schoolProfile } = useData();
  const { hostelBlocks = [], hostelRooms = [], hostelBeds = [] } = useHostel();
  const { addToast } = useToast();

  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
      ? "Good Afternoon"
      : "Good Evening";

  // Hosteller Students
  const hostellerStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.status === "Active" &&
        (s.studentType === "Residential" ||
          s.studentType === "Hosteller" ||
          (s as any).isResidential)
    );
  }, [students]);

  // Bed Occupancy Metrics
  const totalBedsCount = useMemo(() => {
    return hostelBeds.length > 0
      ? hostelBeds.length
      : hostelRooms.reduce((acc, r) => acc + (r.capacity || 2), 0) || 120;
  }, [hostelBeds, hostelRooms]);

  const occupiedBedsCount = useMemo(() => {
    const fromBeds = hostelBeds.filter(
      (b) => b.status === "Occupied" || b.studentId
    ).length;
    return fromBeds > 0 ? fromBeds : Math.min(hostellerStudents.length, totalBedsCount);
  }, [hostelBeds, hostellerStudents, totalBedsCount]);

  const vacantBedsCount = Math.max(0, totalBedsCount - occupiedBedsCount);
  const bedOccupancyPct = Math.round((occupiedBedsCount / totalBedsCount) * 100) || 0;

  // Outpass Records State
  const [outpassRecords, setOutpassRecords] = useState<OutpassItem[]>(() => {
    try {
      const saved = localStorage.getItem("edu_db_hostel_outpasses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return [
      {
        id: "OUT-101",
        studentName: "Alexander Wright",
        className: "Class 10-A",
        roomNo: "Room 201",
        outpassType: "Home Leave",
        departureDate: "2026-08-25",
        returnDate: "2026-08-28",
        reason: "Family event at home",
        status: "Pending",
      },
      {
        id: "OUT-102",
        studentName: "Sophia Chen",
        className: "Class 9-B",
        roomNo: "Room 104",
        outpassType: "Local Outpass",
        departureDate: "2026-08-25",
        returnDate: "2026-08-25",
        reason: "Medical consultation at Apollo Clinic",
        status: "Pending",
      },
      {
        id: "OUT-103",
        studentName: "Rahul Sharma",
        className: "Class 11-A",
        roomNo: "Room 302",
        outpassType: "Emergency Outpass",
        departureDate: "2026-08-24",
        returnDate: "2026-08-26",
        reason: "Dentist appointment",
        status: "Approved",
      },
    ];
  });

  const activeOutpassCount = useMemo(() => {
    return outpassRecords.filter(
      (r) => r.status === "Approved" || r.status === "Active"
    ).length;
  }, [outpassRecords]);

  const pendingOutpassCount = useMemo(() => {
    return outpassRecords.filter((r) => r.status === "Pending").length;
  }, [outpassRecords]);

  // Maintenance Tickets
  const [maintenanceTickets] = useState([
    {
      id: "TKT-301",
      roomNo: "Room 204 (Block A)",
      issue: "Ceiling Fan Speed Regulator Fault",
      priority: "High",
      date: "2026-08-24",
      status: "Pending",
    },
    {
      id: "TKT-302",
      roomNo: "Room 108 (Block B)",
      issue: "Restroom Tap Leakage",
      priority: "Medium",
      date: "2026-08-23",
      status: "In Progress",
    },
  ]);

  const handleUpdateOutpassStatus = (
    id: string | number,
    newStatus: "Approved" | "Rejected"
  ) => {
    const updated = outpassRecords.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    setOutpassRecords(updated);
    try {
      localStorage.setItem("edu_db_hostel_outpasses", JSON.stringify(updated));
    } catch {}
    addToast(
      newStatus === "Approved" ? "success" : "info",
      `Outpass ${newStatus}`,
      `Outpass request marked as ${newStatus}.`
    );
  };

  // Block Occupancy Summary
  const blockSummary = useMemo(() => {
    if (hostelBlocks.length > 0) {
      return hostelBlocks.map((b) => {
        const total = b.capacity || b.totalRooms * 2 || 40;
        const occupied = Math.round(total * 0.85);
        return {
          id: b.id,
          name: b.name || `Hostel Block ${b.id}`,
          warden: b.wardenName || user?.name || "Hostel Warden",
          totalBeds: total,
          occupiedBeds: occupied,
          pct: Math.round((occupied / total) * 100),
        };
      });
    }

    return [
      {
        id: "BLK-1",
        name: "Ramachandra Bhavan (Boys Block A)",
        warden: user?.name || "VaraPrasad (Warden)",
        totalBeds: 60,
        occupiedBeds: 52,
        pct: 87,
      },
      {
        id: "BLK-2",
        name: "Vivekananda Hostel (Boys Block B)",
        warden: "Kiran Kumar",
        totalBeds: 40,
        occupiedBeds: 34,
        pct: 85,
      },
      {
        id: "BLK-3",
        name: "Saraswati Bhavan (Girls Block)",
        warden: "Lakshmi Devi",
        totalBeds: 50,
        occupiedBeds: 44,
        pct: 88,
      },
    ];
  }, [hostelBlocks, user]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 1. Header Banner matching Admin Dashboard - Compact Size */}
      <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-sky-600 via-brand-600 to-blue-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {schoolProfile?.logoUrl && (
                <img
                  src={schoolProfile.logoUrl}
                  alt="School Logo"
                  className="h-6 w-auto max-w-[120px] object-contain rounded-md bg-white/20 p-0.5"
                />
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] border border-white/30 uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {schoolProfile?.name || "PIRNAV SCHOOLS"} • Hostel Warden Portal
              </span>
              <span className="text-[11px] text-sky-100 font-semibold">
                • Main Campus
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              {greeting}, {user?.name || "VaraPrasad"} 🖐️
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate && onNavigate("hostel-attendance")}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs shadow-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Night Roll Call
            </button>
            <button
              onClick={() => onNavigate && onNavigate("hostel")}
              className="px-3.5 py-1.5 rounded-xl bg-white text-brand-600 hover:bg-sky-50 text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-brand-600" /> Manage Hostel
            </button>
          </div>
        </div>

        {/* Ambient background glows */}
        <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-32 h-32 rounded-full bg-sky-400/20 blur-lg pointer-events-none" />
      </div>

      {/* 2. Top 3 KPI Stat Cards matching Admin Dashboard styling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: No of Blocks */}
        <div
          onClick={() => onNavigate && onNavigate("hostel")}
          className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 group-hover:scale-105 transition-transform">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-full border border-sky-200/60 dark:border-sky-800">
              Hostel Buildings
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            No of Blocks
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {hostelBlocks.length > 0 ? hostelBlocks.length : blockSummary.length}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-sky-600 transition-colors">
              View Blocks <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Bed Occupancy */}
        <div
          onClick={() => onNavigate && onNavigate("hostel")}
          className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 group-hover:scale-105 transition-transform">
              <Bed className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800">
              {bedOccupancyPct}% Occupied
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Bed Capacity & Occupancy
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {occupiedBedsCount}{" "}
              <span className="text-xs font-semibold text-slate-400 font-sans">
                / {totalBedsCount} Beds
              </span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Hostel Beds <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Active Out-Passes */}
        <div
          onClick={() => onNavigate && onNavigate("hostel-outpass")}
          className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 group-hover:scale-105 transition-transform">
              <LogOut className="w-5.5 h-5.5" />
            </div>
            {pendingOutpassCount > 0 ? (
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                {pendingOutpassCount} Pending
              </span>
            ) : (
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                Outpass Register
              </span>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Out-Passes & Home Leaves
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {activeOutpassCount}{" "}
              <span className="text-xs font-semibold text-slate-400 font-sans">Active</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
              Approve Requests <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics & Dashboard Section matching Admin 12-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Donut Chart Gauge Widget for Bed Occupancy */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Hostel Bed Occupancy Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Live distribution of occupied, vacant, and out-pass beds
                  </p>
                </div>
              </div>
            </div>

            <WardenOccupancyDonutChart
              occupied={occupiedBedsCount}
              total={totalBedsCount}
              vacant={vacantBedsCount}
              outpass={activeOutpassCount}
            />
          </div>

          {/* Hostel Blocks Occupancy Cards */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Hostel Buildings & Room Occupancy
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Live Bed Occupancy Breakdown by Hostel Building
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              {blockSummary.map((block) => (
                <div
                  key={block.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {block.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Assigned Warden: <span className="text-slate-700 dark:text-slate-300 font-bold">{block.warden}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-base block">
                        {block.occupiedBeds} / {block.totalBeds} Beds
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {block.pct}% Capacity
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${block.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Out-Pass Approvals */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Out-Pass Approvals
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Review & Approve Student Out-Pass Requests
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {outpassRecords.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No out-pass requests recorded.
                </p>
              ) : (
                outpassRecords.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white">
                          {item.studentName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                          {item.className} • {item.roomNo}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                          item.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "Rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold">
                        <span>Type: {item.outpassType}</span>
                        <span className="font-mono text-[10px]">
                          {item.departureDate}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        "{item.reason}"
                      </p>
                    </div>

                    {item.status === "Pending" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() =>
                            handleUpdateOutpassStatus(item.id, "Approved")
                          }
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateOutpassStatus(item.id, "Rejected")
                          }
                          className="flex-1 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

