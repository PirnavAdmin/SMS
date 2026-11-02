// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
import {
  Building2,
  Bed,
  LogOut,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  Home,
  Check,
  FileText,
  Users,
  ShieldCheck,
  Phone,
  DoorOpen,
  UserPlus,
  ClipboardList
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useData } from "../../../context/DataContext";
import { useHostel } from "../../../context/HostelContext";
import { useToast } from "../../../context/ToastContext";
import { getHostelBlocks, getRooms, getAllocations, getWardens, getOutpasses, updateOutpassStatus } from "../../../api/hostel";

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
  status: "Pending" | "Approved" | "Rejected" | "Active" | "Completed" | "Cancelled";
}

const WardenOccupancyDonutChart: React.FC<{
  occupied: number;
  total: number;
  vacant: number;
  outpass: number;
}> = ({ occupied, total, vacant, outpass }) => {
  const tot = total || 1;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  const occPct = Math.round((occupied / tot) * 100);
  const vacPct = Math.max(0, Math.round((vacant / tot) * 100));
  const outPct = Math.round((outpass / tot) * 100);

  const rotOcc = -90;
  const rotVac = rotOcc + (occupied / tot) * 360;
  const rotOut = rotVac + (vacant / tot) * 360;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full h-full gap-3 sm:gap-4 text-left">
      <div className="relative flex items-center justify-center shrink-0 w-[110px] h-[110px] group/chart cursor-pointer">
        <svg className="w-full h-full transform rotate-0" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="9" />
          {occupied > 0 && (
            <circle
              cx="40" cy="40" r={radius} fill="transparent" stroke="#0284c7" strokeWidth="9"
              strokeDasharray={`${(occupied / tot) * circumference} ${circumference}`}
              strokeDashoffset="0" transform={`rotate(${rotOcc} 40 40)`}
              className="transition-all duration-300 hover:stroke-[11px] cursor-pointer"
            />
          )}
          {vacant > 0 && (
            <circle
              cx="40" cy="40" r={radius} fill="transparent" stroke="#10b981" strokeWidth="9"
              strokeDasharray={`${(vacant / tot) * circumference} ${circumference}`}
              strokeDashoffset="0" transform={`rotate(${rotVac} 40 40)`}
              className="transition-all duration-300 hover:stroke-[11px] cursor-pointer"
            />
          )}
          {outpass > 0 && (
            <circle
              cx="40" cy="40" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="9"
              strokeDasharray={`${(outpass / tot) * circumference} ${circumference}`}
              strokeDashoffset="0" transform={`rotate(${rotOut} 40 40)`}
              className="transition-all duration-300 hover:stroke-[11px] cursor-pointer"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none">
            {occPct}%
          </span>
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
            Occupied
          </span>
        </div>
      </div>

      {/* Legend Breakdown */}
      <div className="flex-1 space-y-1.5 text-xs w-full">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Occupied Beds</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">{occupied} ({occPct}%)</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Vacant Beds</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">{vacant} ({vacPct}%)</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">On Out-Pass</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">{outpass} ({outPct}%)</span>
        </div>
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-bold flex justify-between">
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
  const [wardens, setWardens] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [bData, rData, aData, wData] = await Promise.all([
          getHostelBlocks().catch(() => []),
          getRooms().catch(() => []),
          getAllocations().catch(() => []),
          getWardens().catch(() => [])
        ]);
        setBlocks(Array.isArray(bData) && bData.length > 0 ? bData : contextBlocks);
        setRooms(Array.isArray(rData) && rData.length > 0 ? rData : contextRooms);
        setAllocations(Array.isArray(aData) ? aData : []);
        setWardens(Array.isArray(wData) ? wData : []);
      } catch (e) {
        console.warn('Failed to load hostel metrics:', e);
      }
    };
    fetchMetrics();
    const handleSync = () => fetchMetrics();
    window.addEventListener("hostel_outpasses_updated", handleSync);
    window.addEventListener("residential_students_updated", handleSync);
    window.addEventListener("hostel_wardens_updated", handleSync);
    return () => {
      window.removeEventListener("hostel_outpasses_updated", handleSync);
      window.removeEventListener("residential_students_updated", handleSync);
      window.removeEventListener("hostel_wardens_updated", handleSync);
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

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
    return allBlks.length > 0 ? [allBlks[0]] : [];
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
    return contextBeds.length > 0 ? contextBeds.length : 0;
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

  // Outpass Records State (Dynamic API Integration)
  const [outpassRecords, setOutpassRecords] = useState<OutpassItem[]>([]);

  useEffect(() => {
    const fetchOutpasses = async () => {
      try {
        const data = await getOutpasses();
        setOutpassRecords(data || []);
      } catch (err) {
        console.warn("Failed to load outpasses:", err);
      }
    };

    fetchOutpasses();
    window.addEventListener("hostel_outpasses_updated", fetchOutpasses);
    return () => {
      window.removeEventListener("hostel_outpasses_updated", fetchOutpasses);
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
        const total = Number((b as any).totalCapacity) || Number((b as any).capacity) || 0;
        const bAllocs = allocations.filter(a => String(a.hostelId) === String(b.hostelId || b.id) && (a.status === 'Active' || !a.status));
        const occupied = bAllocs.length > 0 ? bAllocs.length : ((b as any).occupiedBeds !== undefined ? (b as any).occupiedBeds : 0);
        
        // Find assigned warden from master or block record
        const matchedWarden = wardens.find((w: any) =>
          String(w.hostelId || w.blockId) === String(b.hostelId || b.id) ||
          (w.hostelName && b.hostelName && String(w.hostelName).toLowerCase().trim() === String(b.hostelName).toLowerCase().trim()) ||
          (w.hostelName && b.name && String(w.hostelName).toLowerCase().trim() === String(b.name).toLowerCase().trim())
        );

        const rawWarden = b.wardenName || (b as any).warden || matchedWarden?.wardenName || matchedWarden?.staffName || matchedWarden?.name || '';
        const isUnassigned = !rawWarden || rawWarden.toLowerCase().includes('unassigned') || rawWarden.toLowerCase().includes('not assigned');

        return {
          id: String(b.id || (b as any).hostelId || ''),
          name: b.name || (b as any).hostelName || `Hostel Block ${b.id}`,
          warden: isUnassigned ? 'Unassigned' : rawWarden,
          isUnassigned,
          totalBeds: total,
          occupiedBeds: occupied,
          pct: Math.min(100, Math.round((occupied / Math.max(1, total)) * 100)),
        };
      });
    }

    return [];
  }, [blocks, contextBlocks, allocations, wardens]);

  // Assigned block name for the logged-in warden
  const assignedBlockName = useMemo(() => {
    if (targetBlocks.length > 0) {
      return targetBlocks[0].name || (targetBlocks[0] as any).hostelName || 'Hostel Facility';
    }
    return 'Hostel Facility';
  }, [targetBlocks]);

  const displayName = useMemo(() => {
    return (user?.name || '').trim();
  }, [user]);

  // Handle Approve / Reject Outpass directly from Dashboard (Server Sync)
  const handleUpdateOutpassStatus = async (id: string | number, newStatus: "Approved" | "Rejected") => {
    try {
      await updateOutpassStatus(id, newStatus, displayName || "Hostel Warden");
      setOutpassRecords(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      window.dispatchEvent(new Event("hostel_outpasses_updated"));
      addToast(
        newStatus === 'Approved' ? 'success' : 'info',
        `Outpass ${newStatus}`,
        `Outpass request has been marked as ${newStatus.toLowerCase()}.`
      );
    } catch (e) {
      console.error("Failed to update outpass status:", e);
      addToast("Failed to update outpass status on server.", "error");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in pb-6">
      {/* 1. Header Banner matching Admin Dashboard - Sleek Transparent Layout */}
      <div className="relative flex items-center justify-between text-slate-900 dark:text-white -mb-0.5">
        <div className="relative z-10 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {displayName || "Hostel Warden"}!</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
              🏢 {assignedBlockName}
            </span>
          </div>
        </div>

        {/* Right side: Campus Building Graphic Illustration */}
        <div className="relative z-10 shrink-0 pointer-events-none select-none pl-3 hidden sm:block">
          <svg className="w-36 sm:w-44 md:w-52 h-10 sm:h-12 md:h-14 overflow-visible" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="210" cy="22" r="12" fill="#FDE68A" opacity="0.85" />
            <circle cx="210" cy="22" r="9" fill="#FBBF24" opacity="0.9" />
            <ellipse cx="25" cy="20" rx="14" ry="7" fill="#E0F2FE" opacity="0.7" />
            <ellipse cx="120" cy="18" rx="12" ry="6" fill="#E0F2FE" opacity="0.6" />
            {/* Hostel Facility Illustration */}
            <circle cx="26" cy="74" r="13" fill="#86EFAC" />
            <circle cx="36" cy="70" r="14" fill="#4ADE80" />
            <rect x="48" y="44" width="72" height="50" rx="3" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1.5" />
            <rect x="68" y="32" width="32" height="62" rx="3" fill="#FFEDD5" stroke="#FDBA74" strokeWidth="1.5" />
            <polygon points="84,14 62,32 106,32" fill="#0284C7" />
            <rect x="54" y="52" width="6" height="8" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="62" y="52" width="6" height="8" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="100" y="52" width="6" height="8" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="108" y="52" width="6" height="8" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <path d="M79 94 V80 Q84 76 89 80 V94 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            {/* Right Bushes */}
            <circle cx="132" cy="72" r="12" fill="#4ADE80" />
            <circle cx="144" cy="74" r="13" fill="#86EFAC" />
            <rect x="160" y="72" width="3" height="18" fill="#92400E" rx="1" />
            <circle cx="161.5" cy="58" r="13" fill="#22C55E" />
            <path d="M6 94 Q120 92 234 94" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 2. Top 4 KPI Stat Cards matching Admin Dashboard styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Assigned Block */}
        <div
          onClick={() => onNavigate && onNavigate("hostel-blocks")}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Assigned Block
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 truncate" title={assignedBlockName}>
              {assignedBlockName}
            </p>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-sky-600 transition-colors">
              Hostel Facility <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 border border-sky-200 dark:border-sky-800 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Bed Capacity & Occupancy */}
        <div
          onClick={() => onNavigate && onNavigate("hostel-rooms")}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Bed Occupancy
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {occupiedBedsCount}{" "}
              <span className="text-xs font-semibold text-slate-400 font-sans">
                / {totalBedsCount} Beds
              </span>
            </p>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Hostel Beds • {bedOccupancyPct}% Occupied <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Bed className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Vacant Beds */}
        <div
          onClick={() => onNavigate && onNavigate("hostel-room-allocation")}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Vacant Beds
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {vacantBedsCount}{" "}
              <span className="text-xs font-semibold text-slate-400 font-sans">
                Available
              </span>
            </p>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
              Ready for Allocation <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Active Out-Passes */}
        <div
          onClick={() => onNavigate && onNavigate("hostel-outpass")}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Out-Passes & Leaves
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {activeOutpassCount}{" "}
              <span className="text-xs font-semibold text-slate-400 font-sans">Active</span>
            </p>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:underline">
              {pendingOutpassCount > 0 ? `${pendingOutpassCount} Pending Review` : "All Requests Handled"} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 border border-amber-200 dark:border-amber-800 shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Panel matching Admin Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs p-3.5 sm:p-4.5 rounded-2xl flex flex-col gap-3 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hostel Quick Actions</h3>
          <button 
            onClick={() => onNavigate && onNavigate('hostel-masters')} 
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-slate-850 dark:text-sky-400 text-xs font-bold hover:bg-sky-100 border border-sky-200 dark:border-sky-800 transition-colors shrink-0 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-500" />
            Hostel Hub <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <button 
            onClick={() => onNavigate && onNavigate('hostel-student-hostel')} 
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-sky-50/50 hover:border-sky-400 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <Bed className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="truncate">Allocate Bed</span>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('hostel-outpass')} 
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-sky-50/50 hover:border-sky-400 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Out-Pass Register</span>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('hostel-attendance')} 
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-sky-50/50 hover:border-sky-400 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate">Night Roll Call</span>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('hostel-rooms')} 
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-sky-50/50 hover:border-sky-400 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">Rooms & Beds</span>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('students')} 
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-sky-50/50 hover:border-sky-400 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="truncate">Hostel Students</span>
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('hostel-reports')} 
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 dark:border-sky-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-sky-50/50 hover:border-sky-400 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">Hostel Reports</span>
          </button>
        </div>
      </div>

      {/* 4. Main Analytics & Operations Section (12-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Bed Occupancy Donut Chart Card */}
          <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 p-4 sm:p-4.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Hostel Bed Occupancy
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Real-time bed allocation and vacancy overview
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("hostel-student-hostel")}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                Allocations <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <WardenOccupancyDonutChart
              occupied={occupiedBedsCount}
              total={totalBedsCount}
              vacant={vacantBedsCount}
              outpass={activeOutpassCount}
            />
          </div>

          {/* Hostel Blocks Occupancy Progress Card */}
          <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 p-4 sm:p-4.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Hostel Buildings & Room Occupancy
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Block-wise capacity distribution
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("hostel-blocks")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                Manage Blocks <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {blockSummary.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No hostel blocks recorded.</p>
              ) : (
                blockSummary.map((block) => (
                  <div
                    key={block.id}
                    className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {block.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">Assigned Warden:</span>
                          {!block.isUnassigned ? (
                            <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px]">{block.warden}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate && onNavigate("hostel-blocks");
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                              title="Click to assign warden"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Action Required: Unassigned
                            </button>
                          )}
                        </div>
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Out-Pass Approvals Card */}
          <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 p-4 sm:p-4.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Out-Pass Approvals
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pending student home leave requests
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("hostel-outpass")}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                Register <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {outpassRecords.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-400 italic">No out-pass requests recorded.</p>
                  <button
                    onClick={() => onNavigate && onNavigate("hostel-outpass")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    View Out-Pass Register <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                outpassRecords.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white">
                          {item.studentName}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                          {item.className} • Room {item.roomNo}
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

                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[10.5px] space-y-0.5">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold">
                        <span>Type: {item.outpassType}</span>
                        <span className="font-mono text-[10px]">
                          {item.departureDate}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-[10px] text-slate-500 italic truncate">
                          "{item.reason}"
                        </p>
                      )}
                    </div>

                    {item.status === "Pending" && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() => handleUpdateOutpassStatus(item.id, "Approved")}
                          className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateOutpassStatus(item.id, "Rejected")}
                          className="flex-1 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-600 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
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

          {/* Hostel Schedule & Timings Card */}
          <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 p-4 sm:p-4.5 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Hostel Schedule & Timings
                </h3>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                Daily Routine
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                  <Clock className="w-3 h-3 text-sky-500" /> Night Roll Call
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  09:30 PM
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">Daily Verification</p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                  <DoorOpen className="w-3 h-3 text-rose-500" /> Gate Curfew
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  10:00 PM
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">Main Gates Locked</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3 text-slate-400" /> Emergency Hotline: Ext 104
              </span>
              <button
                onClick={() => onNavigate && onNavigate("hostel-attendance")}
                className="font-bold text-sky-600 hover:underline cursor-pointer"
              >
                Mark Attendance →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
