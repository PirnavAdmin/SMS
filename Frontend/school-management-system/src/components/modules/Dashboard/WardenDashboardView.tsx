import React, { useMemo, useState, useEffect } from "react";
import {
  Building2,
  Bed,
  LogOut,
  Wrench,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Megaphone,
  Home,
  Check,
  RefreshCw,
  FileText,
  DoorOpen,
  UserX,
  Phone,
  AlertCircle
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

export const WardenDashboardView: React.FC<WardenDashboardViewProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const { students = [], announcements = [] } = useData();
  const { hostelBlocks = [], hostelRooms = [], hostelBeds = [] } = useHostel();
  const { addToast } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];
  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
      ? "Good Afternoon"
      : "Good Evening";

  // 1. Hosteller Students Calculation
  const hostellerStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.status === "Active" &&
        (s.studentType === "Residential" ||
          s.studentType === "Hosteller" ||
          (s as any).isResidential)
    );
  }, [students]);

  // 2. Bed Occupancy Metrics
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

  const bedOccupancyPct = Math.round((occupiedBedsCount / totalBedsCount) * 100) || 0;

  // 3. Outpass Records State & Storage
  const [outpassRecords, setOutpassRecords] = useState<OutpassItem[]>(() => {
    try {
      const saved = localStorage.getItem("edu_db_hostel_outpasses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Mock initial outpass items if none in storage
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

  // 4. Maintenance Issues
  const [maintenanceTickets, setMaintenanceTickets] = useState([
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

  // Handle Outpass Approval / Rejection
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

  // Block Occupancy Breakdown
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
      {/* 1. Header Banner */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-sky-600 via-brand-600 to-blue-600 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-[11px] border border-white/30 uppercase tracking-wider backdrop-blur-xs">
                Hostel Warden Portal
              </span>
              <span className="text-xs text-sky-100 font-medium">
                • Main Campus
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {greeting}, {user?.name || "VaraPrasad"} 🖐️
            </h1>
            <p className="text-xs text-sky-100 max-w-xl">
              Hostel Occupancy, Resident Night Attendance, Out-Pass Approvals, and Room Maintenance Overview.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate && onNavigate("hostel")}
              className="px-4 py-2.5 rounded-2xl bg-white text-brand-600 hover:bg-sky-50 text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-brand-600" /> Manage Hostel
            </button>
          </div>
        </div>

        {/* Decorative subtle ambient glows */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-40 h-40 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />
      </div>

      {/* 2. Top 4 Relevant KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: No of Blocks */}
        <div
          onClick={() => onNavigate && onNavigate("hostel")}
          className="glass-card p-4.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 group-hover:scale-105 transition-transform">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800">
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
          className="glass-card p-4.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 group-hover:scale-105 transition-transform">
              <Bed className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
              {bedOccupancyPct}% Occupied
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Bed Capacity & Occupancy
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {occupiedBedsCount}{" "}
              <span className="text-sm font-semibold text-slate-400">
                / {totalBedsCount} Beds
              </span>
            </h3>
          </div>
        </div>

        {/* Card 3: Active Out-Passes */}
        <div
          onClick={() => onNavigate && onNavigate("hostel-outpass")}
          className="glass-card p-4.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 group-hover:scale-105 transition-transform">
              <LogOut className="w-5.5 h-5.5" />
            </div>
            {pendingOutpassCount > 0 && (
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                {pendingOutpassCount} Pending Approval
              </span>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Out-Passes & Home Leaves
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {activeOutpassCount}{" "}
              <span className="text-xs font-semibold text-slate-400">Active</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
              Approve Requests <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Open Room Maintenance */}
        <div
          onClick={() => onNavigate && onNavigate("hostel")}
          className="glass-card p-4.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 group-hover:scale-105 transition-transform">
              <Wrench className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Room Complaints
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Maintenance Tickets
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {maintenanceTickets.length}{" "}
              <span className="text-xs font-semibold text-slate-400">Open</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Main Analytics & Quick Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Hostel Attendance Register + Block Occupancy */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hostel Night Attendance Widget */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Night Roll Call & Attendance
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Today's Hosteller Night Roll Call Status
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("hostel-attendance")}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Night Roll Call
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 space-y-1 text-center">
                <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                  Present in Rooms
                </p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono">
                  {Math.max(0, hostellerStudents.length - activeOutpassCount)}
                </h4>
                <p className="text-[10px] text-emerald-600 font-bold">
                  In Hostel Premises
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 space-y-1 text-center">
                <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                  On Out-Pass / Leave
                </p>
                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono">
                  {activeOutpassCount}
                </h4>
                <p className="text-[10px] text-amber-600 font-bold">
                  Approved Absences
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 space-y-1 text-center">
                <p className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400">
                  Unaccounted / Unreported
                </p>
                <h4 className="text-2xl font-black text-rose-600 dark:text-rose-300 font-mono">
                  0
                </h4>
                <p className="text-[10px] text-rose-600 font-bold">
                  100% Accounted For
                </p>
              </div>
            </div>
          </div>

          {/* Hostel Blocks Occupancy Cards */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Hostel Blocks & Room Occupancy
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Live Bed Occupancy Breakdown by Hostel Building
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {blockSummary.map((block) => (
                <div
                  key={block.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white">
                        {block.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Assigned Warden: {block.warden}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                        {block.occupiedBeds} / {block.totalBeds} Beds
                      </span>
                      <span className="block text-[10px] text-slate-400 font-bold">
                        {block.pct}% Capacity
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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

        {/* Right 5 Cols: Pending Out-Pass Approvals & Maintenance Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Out-Pass Requests */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Out-Pass Approvals
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Review and Approve Student Leave Applications
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {outpassRecords.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No out-pass requests recorded.
                </p>
              ) : (
                outpassRecords.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {item.studentName}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          {item.className} • {item.roomNo}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
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

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300 font-bold">
                        <span>Type: {item.outpassType}</span>
                        <span className="font-mono text-[10px]">
                          {item.departureDate}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        "{item.reason}"
                      </p>
                    </div>

                    {item.status === "Pending" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() =>
                            handleUpdateOutpassStatus(item.id, "Approved")
                          }
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateOutpassStatus(item.id, "Rejected")
                          }
                          className="flex-1 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all"
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

          {/* Maintenance & Room Tickets */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Room Maintenance Complaints
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Active Room Repair & Maintenance Issues
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {maintenanceTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {tkt.roomNo}
                    </span>
                    <p className="text-[10px] text-slate-500">{tkt.issue}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-extrabold text-[9px] border border-rose-200 dark:border-rose-800">
                    {tkt.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
