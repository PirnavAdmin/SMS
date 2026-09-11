// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
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
import { getHostelBlocks, getRooms, getAllocations } from "../../../api/hostel";

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
  const { students = [], staff = [] } = useData();
  const { hostelBlocks: contextBlocks = [], hostelRooms: contextRooms = [], hostelBeds: contextBeds = [] } = useHostel();
  const { addToast } = useToast();

  const [blocks, setBlocks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [bData, rData, aData] = await Promise.all([
          getHostelBlocks().catch(() => []),
          getRooms().catch(() => []),
          getAllocations().catch(() => [])
        ]);
        setBlocks(Array.isArray(bData) && bData.length > 0 ? bData : contextBlocks);
        setRooms(Array.isArray(rData) && rData.length > 0 ? rData : contextRooms);
        setAllocations(Array.isArray(aData) ? aData : []);
      } catch (e) {
        console.warn('Failed to load hostel metrics:', e);
      }
    };
    fetchMetrics();
    const handleSync = () => fetchMetrics();
    window.addEventListener("hostel_outpasses_updated", handleSync);
    window.addEventListener("residential_students_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("hostel_outpasses_updated", handleSync);
      window.removeEventListener("residential_students_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [contextBlocks, contextRooms]);

  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
      ? "Good Afternoon"
      : "Good Evening";

  // Matched assigned blocks for logged-in warden
  const targetBlocks = useMemo(() => {
    const uName = (user?.name || '').toLowerCase().trim();
    const uFirst = uName ? uName.split(' ')[0] : '';
    const uEmail = (user?.email || '').toLowerCase().trim();

    const allBlks = blocks.length > 0 ? blocks : contextBlocks;
    const matched = allBlks.filter(b => {
      const wName = (b.wardenName || (b as any).warden || '').toLowerCase().trim();
      const wEmail = (b.email || (b as any).wardenEmail || '').toLowerCase().trim();
      if (uEmail && wEmail && wEmail === uEmail) return true;
      if (uFirst && wName && (wName.includes(uFirst) || uFirst.includes(wName.split(' ')[0]))) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    const defaultWardenBlock = allBlks.find(b =>
      (b.hostelName || b.name || '').toLowerCase().includes('ramachandra') ||
      (b.hostelName || b.name || '').toLowerCase().includes('bhanu') ||
      (b.hostelName || b.name || '').toLowerCase().includes('boys')
    );

    return defaultWardenBlock ? [defaultWardenBlock] : (allBlks.length > 0 ? [allBlks[0]] : []);
  }, [blocks, contextBlocks, user]);

  const activeBlockIds = useMemo(() => {
    return new Set(targetBlocks.map(b => String(b.hostelId || b.id)));
  }, [targetBlocks]);

  // Dynamic Bed Occupancy Metrics
  const activeBlockRooms = useMemo(() => {
    const allRooms = rooms.length > 0 ? rooms : contextRooms;
    if (activeBlockIds.size === 0) return allRooms;
    return allRooms.filter(r => r && activeBlockIds.has(String(r.hostelId || r.blockId)));
  }, [rooms, contextRooms, activeBlockIds]);

  const totalBedsCount = useMemo(() => {
    const roomsCap = activeBlockRooms.reduce((acc, r) => acc + (Number(r.bedCapacity) || Number(r.capacity) || 0), 0);
    const blocksCap = targetBlocks.reduce((acc, b) => acc + (Number((b as any).totalCapacity) || Number((b as any).capacity) || 0), 0);
    if (roomsCap > 0) return roomsCap;
    if (blocksCap > 0) return blocksCap;
    return contextBeds.length > 0 ? contextBeds.length : 12;
  }, [activeBlockRooms, targetBlocks, contextBeds]);

  const occupiedBedsCount = useMemo(() => {
    const validAllocs = allocations.filter(a =>
      a && (a.status === 'Active' || !a.status) &&
      (activeBlockIds.size === 0 || activeBlockIds.has(String(a.hostelId)) || activeBlockRooms.some(r => String(r.roomId) === String(a.roomId)))
    );
    return validAllocs.length;
  }, [allocations, activeBlockIds, activeBlockRooms]);

  const vacantBedsCount = Math.max(0, totalBedsCount - occupiedBedsCount);
  const bedOccupancyPct = totalBedsCount > 0 ? Math.min(100, Math.round((occupiedBedsCount / totalBedsCount) * 100)) : 0;

  // Outpass Records State
  const [outpassRecords, setOutpassRecords] = useState<OutpassItem[]>(() => {
    try {
      const saved = localStorage.getItem("edu_db_hostel_outpasses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    const syncOutpasses = () => {
      try {
        const saved = localStorage.getItem("edu_db_hostel_outpasses");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOutpassRecords(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener("hostel_outpasses_updated", syncOutpasses);
    window.addEventListener("storage", syncOutpasses);
    return () => {
      window.removeEventListener("hostel_outpasses_updated", syncOutpasses);
      window.removeEventListener("storage", syncOutpasses);
    };
  }, []);

  const activeOutpassCount = useMemo(() => {
    return outpassRecords.filter(
      (r) => r.status === "Approved" || r.status === "Active"
    ).length;
  }, [outpassRecords]);

  const pendingOutpassCount = useMemo(() => {
    return outpassRecords.filter((r) => r.status === "Pending").length;
  }, [outpassRecords]);

  // Block Occupancy Summary across ALL hostel blocks
  const blockSummary = useMemo(() => {
    const allBlks = blocks.length > 0 ? blocks : contextBlocks;
    if (allBlks.length > 0) {
      return allBlks.map((b) => {
        const total = Number((b as any).totalCapacity) || Number((b as any).capacity) || 12;
        const bAllocs = allocations.filter(a => String(a.hostelId) === String(b.hostelId || b.id) && (a.status === 'Active' || !a.status));
        const occupied = bAllocs.length > 0 ? bAllocs.length : ((b as any).occupiedBeds !== undefined ? (b as any).occupiedBeds : 0);
        return {
          id: String(b.id || (b as any).hostelId || ''),
          name: b.name || (b as any).hostelName || `Hostel Block ${b.id}`,
          warden: b.wardenName || "Unassigned",
          totalBeds: total,
          occupiedBeds: occupied,
          pct: Math.min(100, Math.round((occupied / Math.max(1, total)) * 100)),
        };
      });
    }

    return [];
  }, [blocks, contextBlocks, allocations]);

  // Assigned block name for the logged-in warden
  const assignedBlockName = useMemo(() => {
    if (targetBlocks.length > 0) {
      return targetBlocks[0].name || (targetBlocks[0] as any).hostelName || 'Ramachandra Bhavan (Block A)';
    }
    return 'Ramachandra Bhavan (Block A)';
  }, [targetBlocks]);

  const formatEmailToName = (email?: string): string => {
    if (!email || !email.includes('@')) return '';
    const username = email.split('@')[0];
    const parts = username.split(/[._-]/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const displayName = useMemo(() => {
    // 1. Authentic user account name if set and NOT generic 'Administrator' / 'Admin'
    const rawName = (user?.name || '').trim();
    if (rawName && rawName.toLowerCase() !== 'administrator' && rawName.toLowerCase() !== 'admin' && rawName.toLowerCase() !== 'user') {
      return rawName;
    }

    const uEmail = (user?.email || '').toLowerCase().trim();

    // 2. Match staff record by email in staff list from Admin login
    if (uEmail) {
      const matchedStaff = (staff || []).find(s => s.email && s.email.toLowerCase().trim() === uEmail);
      if (matchedStaff) {
        const fullStaffName = `${matchedStaff.firstName || ''} ${matchedStaff.lastName || ''}`.trim();
        if (fullStaffName && !fullStaffName.toLowerCase().includes('admin')) return fullStaffName;
      }
    }

    // 3. Match hostel block / warden record by email in hostel blocks / wardens list from Admin login
    if (uEmail) {
      const allBlks = blocks.length > 0 ? blocks : contextBlocks;
      const matchedBlock = allBlks.find(b =>
        (b.email || (b as any).wardenEmail || '').toLowerCase().trim() === uEmail ||
        (b.wardenName && b.wardenName.toLowerCase().includes(uEmail.split('@')[0]))
      );
      if (matchedBlock?.wardenName && !matchedBlock.wardenName.toLowerCase().includes('admin')) return matchedBlock.wardenName;
    }

    // 4. Derivation from email (e.g. vishal@pirnav.com -> Vishal)
    if (uEmail) {
      const derived = formatEmailToName(uEmail);
      if (derived && derived.toLowerCase() !== 'admin' && derived.toLowerCase() !== 'administrator') return derived;
    }

    return 'Hostel Warden';
  }, [user, staff, blocks, contextBlocks]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 1. Header Banner matching Admin Dashboard - Compact Size */}
      <div className="glass-card p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-sky-600 via-brand-600 to-blue-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              {greeting}, {displayName} 🖐️
            </h1>
          </div>
        </div>

        {/* Ambient background glows */}
        <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-32 h-32 rounded-full bg-sky-400/20 blur-lg pointer-events-none" />
      </div>

      {/* 2. Top 3 KPI Stat Cards matching Admin Dashboard styling */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Assigned Block Name */}
        <div
          onClick={() => onNavigate && onNavigate("hostel")}
          className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 group-hover:scale-105 transition-transform shrink-0">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-full border border-sky-200/60 dark:border-sky-800">
              Hostel
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Assigned Block
          </p>
          <div className="flex items-baseline justify-between mt-1 gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate" title={assignedBlockName}>
              {assignedBlockName}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-sky-600 transition-colors shrink-0">
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
                    Hostel Bed Occupancy
                  </h3>
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
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {blockSummary.map((block) => (
                <div
                  key={block.id}
                  className="p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {block.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Assigned Warden: <span className="text-sky-600 dark:text-sky-400 font-bold">{block.warden}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono text-xs block">
                        {block.occupiedBeds} / {block.totalBeds} Beds
                      </span>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {block.pct}% Capacity
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
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

