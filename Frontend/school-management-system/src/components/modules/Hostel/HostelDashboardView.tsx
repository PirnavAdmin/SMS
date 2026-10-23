import React, { useState, useEffect, useCallback } from 'react';
import { Home, Building2, Bed, Users, IndianRupee, Shield, Plus, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, PieChart, Layers, Search } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Pagination } from '../../common/Pagination';
import { getHostelBlocks, getRooms, getAllocations, formatRoomNumber, HostelBlock, HostelRoom, BedAllocation } from '../../../api/hostel';
import { formatCurrency } from '../../../utils/currency';
import { isClassInRange } from '../../../utils/classSorter';

interface HostelDashboardViewProps {
  onNavigate?: (tab: string) => void;
}

export const HostelDashboardView: React.FC<HostelDashboardViewProps> = ({ onNavigate }) => {
  const { addToast } = useToast();
  const dataContext = useData();
  const students = Array.isArray(dataContext?.students) ? dataContext.students : [];

  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [blockPage, setBlockPage] = useState(1);
  const blocksPerPage = 3;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [blocksData, roomsData, allocationsData] = await Promise.all([
        getHostelBlocks().catch(() => []),
        getRooms().catch(() => []),
        getAllocations().catch(() => [])
      ]);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setAllocations(Array.isArray(allocationsData) ? allocationsData : []);
    } catch (error: any) {
      addToast('error', 'Failed to load dashboard data', error?.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { user, role } = useAuth();
  const userRole = (role || user?.role || '').toLowerCase();
  const isWarden = userRole.includes('warden');

  const wardenAssignedBlocks = React.useMemo(() => {
    if (!isWarden) return blocks;
    const uName = (user?.name || '').toLowerCase().trim();
    const uFirst = uName ? uName.split(' ')[0] : '';
    const uEmail = (user?.email || '').toLowerCase().trim();

    const matched = blocks.filter(b => {
      const wName = (b.wardenName || (b as any).warden || '').toLowerCase().trim();
      const wEmail = (b.email || (b as any).wardenEmail || '').toLowerCase().trim();
      if (uEmail && wEmail && wEmail === uEmail) return true;
      if (uFirst && wName && (wName.includes(uFirst) || uFirst.includes(wName.split(' ')[0]))) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    const defaultWardenBlock = blocks.find(b =>
      (b.hostelName || '').toLowerCase().includes('ramachandra') ||
      (b.hostelName || '').toLowerCase().includes('bhanu') ||
      (b.hostelName || '').toLowerCase().includes('boys')
    );

    return defaultWardenBlock ? [defaultWardenBlock] : (blocks.length > 0 ? [blocks[0]] : []);
  }, [blocks, isWarden, user]);

  // Derived calculations from real data across all hostel modules
  const displayBlocks = isWarden ? wardenAssignedBlocks : blocks;
  const totalHostels = displayBlocks.length;

  const activeBlockIds = new Set(displayBlocks.map(b => String(b.hostelId)));

  // Rooms belonging strictly to active blocks
  const activeBlockRooms = rooms.filter(r => r && activeBlockIds.has(String(r.hostelId)));

  // Room capacity sum for active blocks
  const roomsCapacitySum = activeBlockRooms.reduce((acc, r) => acc + (Number(r.bedCapacity) || Number(r.capacity) || 0), 0);
  const blocksCapacitySum = displayBlocks.reduce((acc, b) => acc + (Number(b.totalCapacity) || 0), 0);
  const totalCapacity = roomsCapacitySum > 0 ? roomsCapacitySum : blocksCapacitySum;

  // Active bed allocations belonging strictly to active blocks
  const validAllocations = allocations.filter(a =>
    a && (a.status === 'Active' || !a.isPendingAdmitted) &&
    (activeBlockIds.has(String(a.hostelId)) || activeBlockRooms.some(r => Number(r.roomId) === Number(a.roomId)))
  );
  const occupiedBeds = validAllocations.length;

  // Vacant beds
  const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);

  // Accurate, bounded Occupancy Rate
  const rawPercentage = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;
  const occupancyPercentage = Math.min(100, Math.max(0, rawPercentage));
  const vacantPercentage = 100 - occupancyPercentage;

  // Hostellers count matching active occupied beds
  const enrolledHostellers = occupiedBeds;

  // Dynamic Hostel Revenue calculation from feePayments and active hostel fee configs
  const dynamicHostelRevenue = React.useMemo(() => {
    const payments = Array.isArray(dataContext?.feePayments) ? dataContext.feePayments : [];

    // 1. Total payments for hostel (hostel fee, security deposit, room fee)
    const totalCollected = payments.reduce((sum, p) => {
      const pAny = p as any;
      if (typeof pAny.hostelFee === 'number' && pAny.hostelFee > 0) return sum + pAny.hostelFee;
      if (Array.isArray(p.paymentAllocation) && p.paymentAllocation.length > 0) {
        const alloc = p.paymentAllocation
          .filter(a => (a.feeHeadName || '').toLowerCase().includes('hostel') || (a.termName || '').toLowerCase().includes('hostel'))
          .reduce((s, a) => s + (Number(a.amount) || 0), 0);
        if (alloc > 0) return sum + alloc;
      }
      const isHst =
        pAny.feeHeadId === 'FH-HST' ||
        (pAny.feeHeadName || '').toLowerCase().includes('hostel') ||
        (pAny.feeHeadName || '').toLowerCase().includes('security deposit') ||
        (pAny.category || '').toLowerCase().includes('hostel') ||
        (pAny.remarks || '').toLowerCase().includes('hostel');
      return sum + (isHst ? Number(p.amountPaid ?? pAny.amount ?? 0) : 0);
    }, 0);

    // 2. Expected monthly revenue from room configs or occupied beds
    const configs = dataContext?.financeHostelConfigs || [];
    let expectedAnnualFromOccupied = 0;
    validAllocations.forEach(a => {
      const rm = rooms.find(r => Number(r.roomId) === Number(a.roomId) || r.roomNumber === a.roomNumber);
      const rmSpec = rm?.roomTypeSpecification || '';
      const st = students.find(s => String(s.id) === String(a.studentId) || (s.admissionNo && s.admissionNo === a.admissionNo));
      const stClass = st?.className || '';
      const cfg = configs.find(c =>
        c.status === 'Active' &&
        (!stClass || isClassInRange(stClass, c.startClass, c.endClass, c.classRange, dataContext?.academicClasses)) &&
        (!rmSpec || (c.roomTypeName && c.roomTypeName.toLowerCase().includes(rmSpec.toLowerCase())))
      );
      if (cfg) {
        const annual = Number((cfg as any).annualFee || cfg.hostelFee) || (Number((cfg as any).termFee || 0) * 3) || 0;
        expectedAnnualFromOccupied += annual;
      }
    });

    const expectedMonthly = Math.round(expectedAnnualFromOccupied / 12);
    const totalExpected = expectedAnnualFromOccupied > 0 ? expectedAnnualFromOccupied : totalCollected;
    const totalPendingDues = Math.max(0, totalExpected - totalCollected);
    const displayRevenue = totalCollected > 0 ? totalCollected : expectedMonthly;

    const hostellersFeeStatus = validAllocations.map((a) => {
      const st = students.find((s) => String(s.id) === String(a.studentId) || (s.admissionNo && s.admissionNo === a.admissionNo));
      const stId = String(a.studentId || '');
      const stAdm = String(a.admissionNo || '');
      const stPayments = payments.filter((p) => {
        const pid = String(p.studentId || '');
        const padm = String(p.admissionNo || '');
        const pname = String(p.studentName || '').toLowerCase().trim();
        const matchesId = (stId && (pid === stId || padm === stId)) || (stAdm && (pid === stAdm || padm === stAdm)) || (pname && pname === String(a.studentName || '').toLowerCase().trim());
        const isHst = (p as any).feeHeadId === 'FH-HST' || (p as any).feeHeadId === 'FH-HST-DEP' || (p.feeHeadName || '').toLowerCase().includes('hostel') || (p.feeHeadName || '').toLowerCase().includes('security deposit') || (p.remarks || '').toLowerCase().includes('hostel') || (p.remarks || '').toLowerCase().includes('security deposit');
        return matchesId && isHst;
      });
      const paid = stPayments.reduce((sum, p) => sum + Number(p.amountPaid ?? (p as any).amount ?? 0), 0);
      const ledger = dataContext?.getStudentFeeLedger ? dataContext.getStudentFeeLedger(stId, st) : null;
      let expected = 0;
      if (ledger?.feeItems) {
        expected = ledger.feeItems
          .filter((i) => i.isApplicable && (i.headId === 'FH-HST' || i.headId === 'FH-HST-DEP' || (i.category || '').toLowerCase().includes('hostel') || (i.headName || '').toLowerCase().includes('security deposit')))
          .reduce((sum, i) => sum + (i.finalAmount || i.originalAmount || 0), 0);
      }
      if (expected === 0) {
        const cfg = (dataContext?.financeHostelConfigs || []).find((c) => c.status === 'Active');
        expected = Number(cfg?.hostelFee || 40000) + Number(cfg?.securityDeposit || 2000);
      }
      const due = Math.max(0, expected - paid);
      const isDepPaid = Boolean(st?.hostelSecurityDepositPaid || stPayments.some((p) => (p.feeHeadName || '').toLowerCase().includes('security deposit') || (p.remarks || '').toLowerCase().includes('security deposit')));
      return {
        allocationId: a.allocationId,
        studentName: a.studentName || 'Student',
        admissionNo: a.admissionNo || 'ADM',
        hostelName: a.hostelName || 'Hostel',
        roomNumber: a.roomNumber || '101',
        bedNumber: a.bedNumber || 'BED-1',
        isDepositPaid: isDepPaid,
        expected,
        paid,
        due,
        status: due === 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Due')
      };
    });

    return {
      totalCollected,
      totalExpected,
      totalPendingDues,
      expectedMonthly,
      displayRevenue,
      hostellersFeeStatus
    };
  }, [dataContext?.feePayments, dataContext?.financeHostelConfigs, dataContext?.academicClasses, dataContext?.getStudentFeeLedger, validAllocations, rooms, students]);

  const estMonthlyRevenue = dynamicHostelRevenue.displayRevenue;

  // Unique Active Wardens count (excluding 'Unassigned' and 'N/A')
  const activeWardensCount = new Set(
    displayBlocks
      .map(b => b.wardenName)
      .filter(w => w && w !== 'Unassigned' && w !== 'N/A' && w !== 'Not Assigned Yet')
  ).size;

  const [dashboardBlockFilter, setDashboardBlockFilter] = useState('');
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');

  const filteredBlocksList = displayBlocks.filter(b => {
    const blockTitle = b.hostelName || (b as any).name || (b as any).blockName || `Hostel Block #${b.hostelId}`;
    const codeVal = b.hostelCode || (b as any).code || 'HST-01';

    const matchesFilter =
      !dashboardBlockFilter ||
      dashboardBlockFilter === 'All' ||
      blockTitle === dashboardBlockFilter ||
      (b.hostelType || '').toLowerCase().includes(dashboardBlockFilter.toLowerCase());

    const matchesSearch =
      !dashboardSearchQuery.trim() ||
      blockTitle.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) ||
      codeVal.toLowerCase().includes(dashboardSearchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBlocksList.length / blocksPerPage);
  const paginatedBlocks = filteredBlocksList.slice(
    (blockPage - 1) * blocksPerPage,
    blockPage * blocksPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header with Title and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-7 h-7 text-sky-500" /> Hostel Dashboard
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold italic">
          Loading executive metrics & operational overview...
        </div>
      ) : (
        <>
          {/* TOP 8 EXECUTIVE KPI METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Total Hostels */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Hostels</span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalHostels}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            {/* Card 2: Total Bed Capacity */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">Total Capacity</span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
                  <Bed className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{totalCapacity} Beds</p>
                <span className="text-[10px] font-semibold text-slate-400">Max Cap</span>
              </div>
            </div>

            {/* Card 3: Occupancy Rate */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Occupancy Rate</span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{occupancyPercentage}%</p>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-md">Optimal</span>
              </div>
            </div>

            {/* Card 4: Occupied Beds */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Occupied Beds</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{occupiedBeds}</p>
                <span className="text-[10px] font-semibold text-slate-400">Assigned</span>
              </div>
            </div>

            {/* Card 5: Available Vacant Beds */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Vacant Beds</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <Home className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{vacantBeds}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">Available</span>
              </div>
            </div>

            {/* Card 6: Enrolled Hostellers */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">Hostellers</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{enrolledHostellers}</p>
                <span className="text-[10px] font-semibold text-slate-400">Students</span>
              </div>
            </div>

            {/* Card 7: Dynamic Hostel Fee Revenue & Collections */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Hostel Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(dynamicHostelRevenue.totalCollected)}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">Collected</span>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between font-medium pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span>Due Balance:</span>
                <span className="font-mono text-rose-500 font-bold">{formatCurrency(dynamicHostelRevenue.totalPendingDues)}</span>
              </div>
            </div>

            {/* Card 8: Active Wardens */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Active Wardens</span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{activeWardensCount}</p>
                <span className="text-[10px] font-bold text-slate-500">Supervising</span>
              </div>
            </div>
          </div>

          {/* OCCUPANCY BREAKDOWN & PROGRESS BAR */}
          <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-sky-600" />
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Overall Hostel Bed Occupancy
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                {occupiedBeds} Occupied / {vacantBeds} Vacant ({totalCapacity} Total Capacity)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${occupancyPercentage}%` }}
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-l-full transition-all duration-500"
                title={`Occupied: ${occupiedBeds} beds (${occupancyPercentage}%)`}
              />
              <div
                style={{ width: `${100 - occupancyPercentage}%` }}
                className="h-full bg-emerald-400 dark:bg-emerald-600 rounded-r-full transition-all duration-500"
                title={`Vacant: ${vacantBeds} beds (${100 - occupancyPercentage}%)`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Occupied Beds ({occupancyPercentage}%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Vacant Beds ({100 - occupancyPercentage}%)</span>
              </div>
              <span className="font-mono text-slate-400 font-bold">Live Status</span>
            </div>
          </div>

          {/* HOSTEL BLOCK OVERVIEW */}
          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-500" /> Hostel Block Overview
              </h3>
              {!isWarden && (
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                  {/* Optional Search Input */}
                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search block name or code..."
                      value={dashboardSearchQuery}
                      onChange={e => setDashboardSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  {/* Block Name Filter Dropdown */}
                  <select
                    value={dashboardBlockFilter}
                    onChange={e => setDashboardBlockFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="">Select Hostel Block...</option>
                    <option value="All">All Hostel Blocks</option>
                    {(displayBlocks || [])
                      .filter(b => b != null)
                      .map((b, idx) => {
                        const rawName = b.hostelName || (b as any).name || (b as any).blockName || '';
                        const title = rawName && isNaN(Number(rawName)) ? rawName : `Hostel Block #${b.hostelId || idx + 1}`;
                        const idKey = b.hostelId !== undefined && b.hostelId !== null ? String(b.hostelId) : `dash_blk_${idx}`;
                        return (
                          <option key={`dash_opt_${idKey}_${idx}`} value={title}>
                            {title}
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}
            </div>

            {/* Render Empty State Prompt if not selected */}
            {!dashboardBlockFilter && !dashboardSearchQuery.trim() && !isWarden ? (
              <div className="py-12 px-6 rounded-2xl border border-sky-200/80 dark:border-sky-900/50 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <Building2 className="w-8 h-8 text-sky-500 mx-auto opacity-70" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Select a Hostel Block</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Please select a hostel block from the dropdown above or type a search query to render block details.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedBlocks.map(b => {
                  const rawName = b.hostelName || (b as any).name || (b as any).blockName || '';
                  const blockTitle = rawName && isNaN(Number(rawName)) ? rawName : `Hostel Block #${b.hostelId || ''}`;
                  const codeVal = b.hostelCode || (b as any).code || `HST-${b.hostelId || '01'}`;
                  const wardenVal = b.wardenName || (b as any).warden || 'Not Assigned';
                  const phoneVal = b.primaryMobileNumber || (b as any).contactNumber || 'N/A';
                  const addressVal = b.address || 'Main Campus';
                  const blockRooms = rooms.filter(r => String(r.hostelId) === String(b.hostelId));
                  const roomsVal = blockRooms.length > 0 ? blockRooms.length : (Number(b.totalRooms) || 0);
                  const occBedsVal = validAllocations.filter(a => String(a.hostelId) === String(b.hostelId)).length;
                  const roomsCap = blockRooms.reduce((sum, r) => sum + (Number(r.bedCapacity) || Number(r.capacity) || 0), 0);
                  const capVal = roomsCap > 0 ? roomsCap : (Number(b.totalCapacity) || 0);
                  const blockOccupancy = capVal > 0 ? Math.round((occBedsVal / capVal) * 100) : 0;

                  return (
                    <div key={b.hostelId} className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all">
                      <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-slate-700 pb-2.5">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white block">{blockTitle}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">Code: {codeVal}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          {b.hostelType || 'Boys Hostel'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Assigned Warden:</span>
                          <strong className="text-sky-600 dark:text-sky-400 font-bold">{wardenVal}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Warden Contact:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{phoneVal}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Location:</span>
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{addressVal}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Total Rooms:</span>
                          <strong className="font-mono text-slate-800 dark:text-slate-200">{roomsVal} Rooms</strong>
                        </div>
                      </div>

                      {/* Block Bed Occupancy Bar */}
                      <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500 uppercase">Occupancy</span>
                          <span className="font-mono text-sky-600 dark:text-sky-400">{occBedsVal}/{capVal} Beds ({blockOccupancy}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div style={{ width: `${blockOccupancy}%` }} className="h-full bg-sky-600 rounded-full" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                        <button
                          onClick={() => onNavigate && onNavigate('hostel-masters')}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                          Manage Block <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {displayBlocks.length > blocksPerPage && (
              <Pagination
                currentPage={blockPage}
                totalItems={displayBlocks.length}
                itemsPerPage={blocksPerPage}
                onPageChange={setBlockPage}
              />
            )}
          </div>

          {/* DYNAMIC HOSTEL FEE COLLECTIONS & DUE BALANCE REGISTER */}
          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-500" /> Hosteller Fee Payment & Due Balance Register
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Live dynamic billing, security deposit tracking, and remaining balance for admitted hostellers.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  Collected: {formatCurrency(dynamicHostelRevenue.totalCollected)}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                  Remaining Due: {formatCurrency(dynamicHostelRevenue.totalPendingDues)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold uppercase text-slate-400">
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Room & Bed</th>
                    <th className="py-2.5 px-3">Security Deposit</th>
                    <th className="py-2.5 px-3">Expected Fee</th>
                    <th className="py-2.5 px-3">Amount Paid</th>
                    <th className="py-2.5 px-3">Remaining Due</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {(dynamicHostelRevenue.hostellersFeeStatus || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 font-semibold italic text-xs">
                        No active bed allocations or hosteller records found.
                      </td>
                    </tr>
                  ) : (
                    dynamicHostelRevenue.hostellersFeeStatus.map((h, i) => (
                      <tr key={h.allocationId || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{h.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{h.admissionNo}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {formatRoomNumber(h.roomNumber)} • {h.bedNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          {h.isDepositPaid ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(h.expected)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(h.paid)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(h.due)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ 
                            h.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : h.status === 'Partial'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECENT ACTIVITY SUMMARY TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Bed Allocations Card */}
            <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recent Bed Allocations
                </span>
                <button
                  onClick={() => onNavigate && onNavigate('hostel-student-hostel')}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {validAllocations.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs font-semibold">
                    No active student allocations found.
                  </div>
                ) : (
                  validAllocations.slice(0, 3).map((a, idx) => (
                    <div key={`alloc-${a.allocationId || idx}`} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between text-xs border border-slate-200/70 dark:border-slate-700/70">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{a.studentName || 'Student'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.admissionNo || (a as any).registrationNo || 'ADM'} • {a.hostelName || 'Hostel'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 block text-[11px]">{formatRoomNumber(a.roomNumber)} ({a.bedNumber || 'BED-1'})</span>
                        <span className="text-[10px] text-slate-400 font-medium">Joined: {a.joiningDate ? new Date(a.joiningDate).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Outpass Requests Card */}
            <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Active Outpass & Leave Requests
                </span>
                <button
                  onClick={() => onNavigate && onNavigate('hostel-student-hostel')}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                <div className="py-4 text-center text-slate-400 text-xs font-semibold">
                  No pending outpass or leave requests.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
