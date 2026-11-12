import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Plus, Search, CheckCircle2, Trash2, ChevronDown, X, AlertCircle } from 'lucide-react';
import { validateSearchQuery } from '../../../utils/validation';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { getHostelBlocks, getRooms, getAllocations, vacateAllocation, createAllocation, updateStudentAllocationBlock, vacateStudentAllocation, getTransferVacateRequests, createTransferVacateRequest, deleteTransferVacateRequest, updateTransferVacateStatus } from '../../../api/hostel';
import { SearchableSelect } from '../../common/SearchableSelect';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';

interface TransferRecord {
  id: number | string;
  studentId?: string | number;
  studentName: string;
  admissionNo: string;
  actionType: 'Room Transfer' | 'Bed Vacate';
  fromHostel: string;
  fromRoom: string;
  toHostel: string;
  toRoom: string;
  requestDate: string;
  reason: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  totalFeePaid?: number;
  monthsStayed?: number;
  feeUtilized?: number;
  refundableBalance?: number;
  feeAdjustmentMode?: string;
}

const DEFAULT_INITIAL_TRANSFERS: TransferRecord[] = [];

export const HostelTransferVacateView: React.FC = () => {
  const { students } = useData();
  const { addToast } = useToast();
  const { user, role } = useAuth();

  const isWarden = Boolean(role && role.toLowerCase().includes('warden'));

  const [blocks, setBlocks] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadHostelData = async () => {
      try {
        const [bData, aData, rData] = await Promise.all([
          getHostelBlocks().catch(() => []),
          getAllocations().catch(() => []),
          getRooms().catch(() => [])
        ]);
        if (isMounted) {
          setBlocks(Array.isArray(bData) ? bData : []);
          setAllocations(Array.isArray(aData) ? aData : []);
          setRooms(Array.isArray(rData) ? rData : []);
        }
      } catch (e) {
        console.warn('Failed to load hostel data for transfer view', e);
      }
    };
    loadHostelData();

    const handleSync = () => loadHostelData();
    window.addEventListener('hostel_allocations_updated', handleSync);
    window.addEventListener('hostel_students_updated', handleSync);
    window.addEventListener('residential_students_updated', handleSync);
    window.addEventListener('students_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('hostel_allocations_updated', handleSync);
      window.removeEventListener('hostel_students_updated', handleSync);
      window.removeEventListener('residential_students_updated', handleSync);
      window.removeEventListener('students_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const wardenAssignedBlocks = useMemo(() => {
    if (!blocks || blocks.length === 0) return [];

    const uName = String(user?.name || (user as any)?.firstName || '').toLowerCase().trim();
    const uFirst = uName ? uName.split(' ')[0] : '';
    const uEmail = String(user?.email || '').toLowerCase().trim();
    const uId = String(user?.id || '').toLowerCase().trim();
    const uEmpId = String((user as any)?.empId || '').toLowerCase().trim();

    if (isWarden) {
      const matched = blocks.filter(b => {
        const wName = String(b.wardenName || (b as any).warden || (b as any).assignedWarden || '').toLowerCase().trim();
        const wEmail = String(b.email || (b as any).wardenEmail || '').toLowerCase().trim();
        const wId = String(b.wardenId || (b as any).staffId || '').toLowerCase().trim();

        if (uEmail && wEmail && (wEmail === uEmail || wEmail.includes(uEmail) || uEmail.includes(wEmail))) return true;
        if (uId && wId && wId === uId) return true;
        if (uEmpId && wId && wId === uEmpId) return true;
        if (uName && wName && (wName === uName || wName.includes(uName) || uName.includes(wName))) return true;
        if (uFirst && wName && (wName.includes(uFirst) || uFirst.includes(wName.split(' ')[0]))) return true;
        return false;
      });

      if (matched.length > 0) return matched;
      return blocks.length > 0 ? [blocks[0]] : [];
    }

    return blocks;
  }, [blocks, allocations, isWarden, user]);

  // Dynamically load all residential hostellers allocated to assigned block(s) or all blocks for admin
  const displayStudentsList = useMemo(() => {
    const targetBlocks = isWarden && wardenAssignedBlocks.length > 0 ? wardenAssignedBlocks : blocks;
    const targetBlockIds = new Set(targetBlocks.map(b => String(b.hostelId || b.id)));
    const targetBlockNames = targetBlocks.map(b => (b.hostelName || b.name || '').toLowerCase().trim()).filter(Boolean);

    // Active allocations specifically for target block(s) (or all blocks if not warden)
    const blockAllocations = (allocations || []).filter(a => {
      if (!a) return false;
      const st = (a.status || '').toLowerCase().trim();
      if (st === 'vacated' || st === 'inactive' || st === 'cancelled') return false;
      if (!isWarden) return true;
      const aName = (a.hostelName || '').toLowerCase().trim();
      const aId = String(a.hostelId || '');
      const matchId = targetBlockIds.has(aId);
      const matchName = targetBlockNames.some(tn => tn && (aName.includes(tn) || tn.includes(aName)));
      return matchId || matchName;
    });

    const list: Array<{
      id: string;
      studentId: string | number;
      studentName: string;
      firstName: string;
      lastName: string;
      admissionNo: string;
      hostelName: string;
      roomNumber: string;
      bedNumber: string;
    }> = [];

    const seenKeys = new Set<string>();

    blockAllocations.forEach(a => {
      const key = String(a.studentId || a.admissionNo || a.allocationId).toLowerCase().trim();
      if (!key || seenKeys.has(key)) return;
      seenKeys.add(key);

      const matchedStudent = (students || []).find(s =>
        (s.id && a.studentId && String(s.id).toLowerCase() === String(a.studentId).toLowerCase()) ||
        (s.admissionNo && a.admissionNo && s.admissionNo.toLowerCase().trim() === a.admissionNo.toLowerCase().trim())
      );

      const sName = a.studentName || (matchedStudent ? `${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim() : 'Resident Student');
      const parts = sName.split(' ');

      list.push({
        id: String(a.studentId || a.admissionNo || a.allocationId),
        studentId: a.studentId,
        studentName: sName,
        firstName: matchedStudent?.firstName || parts[0] || sName,
        lastName: matchedStudent?.lastName || parts.slice(1).join(' ') || '',
        admissionNo: a.admissionNo || matchedStudent?.admissionNo || '',
        hostelName: a.hostelName || (matchedStudent as any)?.hostelBlock || '',
        roomNumber: a.roomNumber || '',
        bedNumber: a.bedNumber || ''
      });
    });

    // Also include any students context marked as Hosteller not yet in list
    (students || []).forEach(s => {
      if (!s || s.status === 'Completed' || s.status === 'Alumni') return;
      const sId = String(s.id || '').toLowerCase().trim();
      const sAdm = String(s.admissionNo || '').toLowerCase().trim();
      if ((sId && seenKeys.has(sId)) || (sAdm && seenKeys.has(sAdm))) return;

      const isHosteller = Boolean((s as any).isHosteller) || s.studentType === 'Hosteller' || s.studentType === 'Residential' || Boolean((s as any).hostelBlock);
      if (!isHosteller) return;

      const hBlock = String((s as any).hostelBlock || (s as any).hostelName || '').toLowerCase().trim();
      if (isWarden && targetBlockNames.length > 0 && !targetBlockNames.some(tn => tn && hBlock.includes(tn))) {
        return;
      }

      const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Resident Student';
      if (sId) seenKeys.add(sId);
      if (sAdm) seenKeys.add(sAdm);

      list.push({
        id: String(s.id),
        studentId: s.id,
        studentName: sName,
        firstName: s.firstName || sName,
        lastName: s.lastName || '',
        admissionNo: s.admissionNo || '',
        hostelName: (s as any).hostelBlock || (s as any).hostelName || 'Hostel Block',
        roomNumber: (s as any).roomNumber || '',
        bedNumber: (s as any).bedNumber || ''
      });
    });

    return list;
  }, [students, wardenAssignedBlocks, blocks, allocations, isWarden]);

  const availableBlockNames = useMemo(() => {
    return (blocks || []).map(b => b.hostelName || b.name).filter(Boolean);
  }, [blocks]);

  const [records, setRecords] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransfers = async () => {
    try {
      setIsLoading(true);
      const data = await getTransferVacateRequests();
      setRecords(data || []);
    } catch (err) {
      console.warn("Failed to load transfers from server:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchQueryChange = (val: string) => {
    setCurrentPage(1);
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchError(undefined);
    } else {
      const res = validateSearchQuery(val, 30);
      setSearchError(res.isValid ? undefined : (res.error || 'Enter a valid search term.'));
    }
  };
  const [filterAction, setFilterAction] = useState('');

  const handleFilterActionChange = (val: string) => {
    setCurrentPage(1);
    setFilterAction(val);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<TransferRecord | null>(null);
  const [selectedFeeDetail, setSelectedFeeDetail] = useState<TransferRecord | null>(null);

  // Form fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [actionType, setActionType] = useState<'Room Transfer' | 'Bed Vacate' | ''>('');
  const [targetBlock, setTargetBlock] = useState('');
  const [targetRoom, setTargetRoom] = useState('');
  const [targetBed, setTargetBed] = useState('');
  const [reason, setReason] = useState('');

  const destinationRooms = useMemo(() => {
    if (!targetBlock) return [];
    const selName = String(targetBlock).toLowerCase().trim();
    return (rooms || []).filter(r => {
      const hName = String(r.hostelName || '').toLowerCase().trim();
      const matchBlock = blocks.find(b => String(b.hostelId) === String(r.hostelId));
      const bName = matchBlock ? (matchBlock.hostelName || '').toLowerCase().trim() : '';
      return hName === selName || bName === selName;
    });
  }, [rooms, targetBlock, blocks]);

  const selectedDestinationRoomObj = useMemo(() => {
    return destinationRooms.find(r => String(r.roomId) === String(targetRoom) || String(r.roomNumber) === String(targetRoom));
  }, [destinationRooms, targetRoom]);

  const destinationBedOptions = useMemo(() => {
    if (!selectedDestinationRoomObj) return [];
    const cap = Number(selectedDestinationRoomObj.bedCapacity) || Number(selectedDestinationRoomObj.capacity) || 2;
    const roomNumber = selectedDestinationRoomObj.roomNumber;
    const roomId = selectedDestinationRoomObj.roomId;

    return Array.from({ length: Math.max(1, cap) }, (_, i) => {
      const bedVal = `BED-${i + 1}`;
      const isOccupied = (allocations || []).some(a =>
        a && a.status !== 'Vacated' && a.status !== 'Inactive' &&
        (String(a.roomId) === String(roomId) || String(a.roomNumber) === String(roomNumber)) &&
        String(a.bedNumber || '').toLowerCase().trim() === bedVal.toLowerCase()
      );
      return {
        value: bedVal,
        label: `Bed #${i + 1}`,
        isOccupied
      };
    });
  }, [selectedDestinationRoomObj, allocations]);

  // Fee Settlement fields
  const [totalFeePaid, setTotalFeePaid] = useState<number>(0);
  const [monthsStayed, setMonthsStayed] = useState<number>(1);
  const [feeAdjustmentMode, setFeeAdjustmentMode] = useState<string>('');

  const hostellers = (students || []).filter(s => s && (s.studentType === 'Hosteller' || s.studentType === 'Residential' || (s as any).isHostelRequired));

  // Calculated prorated fee values
  const feeUtilized = Math.round((totalFeePaid * monthsStayed) / 12);
  const refundableBalance = Math.max(0, totalFeePaid - feeUtilized);

  const handleOpenAdd = () => {
    setSelectedStudentId('');
    setActionType('');
    setTargetBlock('');
    setTargetRoom('');
    setTargetBed('');
    setReason('');
    setTotalFeePaid(0);
    setMonthsStayed(1);
    setFeeAdjustmentMode('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      addToast('Please select a student.', 'warning');
      return;
    }

    if (!actionType) {
      addToast('Please select an action type.', 'warning');
      return;
    }

    if (actionType === 'Bed Vacate' && !feeAdjustmentMode) {
      addToast('Please select a Fee Settlement & Adjustment Mode.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const selectedSt = displayStudentsList.find(s => String(s.id) === String(selectedStudentId)) || students.find(s => String(s.id) === String(selectedStudentId));
    const stName = selectedSt ? `${selectedSt.firstName || ''} ${selectedSt.lastName || ''}`.trim() : 'Student';
    const admNo = selectedSt?.admissionNo || `ADM-2026-${selectedStudentId}`;
    const activeStudentAlloc = (allocations || []).find(a =>
      a && a.status !== 'Vacated' && a.status !== 'Inactive' &&
      (String(a.studentId) === String(selectedStudentId) || (a.admissionNo && a.admissionNo === selectedSt?.admissionNo))
    );
    const fromHostel = activeStudentAlloc?.hostelName || (selectedSt as any)?.hostelName || (selectedSt as any)?.hostelBlock || (wardenAssignedBlocks[0]?.hostelName || '');
    const fromRoom = activeStudentAlloc?.roomNumber || (selectedSt as any)?.roomNumber || '';

    if (actionType === 'Room Transfer') {
      if (!targetBlock) {
        addToast('Please select a destination hostel block.', 'warning');
        setIsSubmitting(false);
        return;
      }
      if (!targetRoom) {
        addToast('Please select a destination room.', 'warning');
        setIsSubmitting(false);
        return;
      }
      if (!targetBed) {
        addToast('Please select a destination bed number.', 'warning');
        setIsSubmitting(false);
        return;
      }
      try {
        const matchBlock = blocks.find(b => (b.hostelName || b.name || '').toLowerCase() === targetBlock.toLowerCase());
        const targetBlockId = matchBlock?.hostelId || matchBlock?.id;
        await updateStudentAllocationBlock(selectedStudentId, admNo, targetBlock, targetRoom, targetBlockId, stName, targetBed);
      } catch (err) {
        console.error('Failed to update student allocation block:', err);
      }
    } else if (actionType === 'Bed Vacate') {
      try {
        const allocs = await getAllocations();
        const matchAlloc = allocs.find(a => String(a.studentId) === String(selectedStudentId) || a.admissionNo === admNo);
        await vacateStudentAllocation(selectedStudentId, admNo, matchAlloc?.allocationId ? String(matchAlloc.allocationId) : undefined);
      } catch (err) {
        console.error('Failed to vacate student allocation:', err);
      }
    }

    const newRecord: TransferRecord = {
      id: Date.now(),
      studentId: selectedStudentId,
      studentName: stName,
      admissionNo: admNo,
      actionType: actionType as 'Room Transfer' | 'Bed Vacate',
      fromHostel,
      fromRoom,
      toHostel: actionType === 'Bed Vacate' ? 'N/A (Vacated)' : targetBlock,
      toRoom: actionType === 'Bed Vacate' ? 'N/A' : targetRoom,
      requestDate: new Date().toISOString().split('T')[0],
      reason: reason || (actionType === 'Bed Vacate' ? 'Opted out to Non-Residential' : 'Personal request'),
      status: 'Completed',
      ...(actionType === 'Bed Vacate' ? {
        totalFeePaid,
        monthsStayed,
        feeUtilized,
        refundableBalance: feeAdjustmentMode === 'Non-Refundable' ? 0 : refundableBalance,
        feeAdjustmentMode
      } : {})
    };

    try {
      await createTransferVacateRequest({
        studentId: selectedStudentId,
        studentName: stName,
        actionType,
        destinationHostelName: targetBlock,
        destinationRoomNumber: targetRoom,
        reason: reason || (actionType === 'Bed Vacate' ? 'Opted out to Non-Residential' : 'Personal request')
      });
      await loadTransfers();
    } catch (e: any) {
      addToast(e?.message || 'Failed to submit transfer/vacate request on server.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const freshAllocs = await getAllocations();
      setAllocations(freshAllocs);
    } catch (e) {
      console.warn('Could not refresh allocations:', e);
    }

    addToast(`${actionType} request processed. ${actionType === 'Bed Vacate' ? 'Bed released to available. Fee adjusted: ₹' + refundableBalance.toLocaleString() : 'Transferred to ' + targetBlock}`, 'success');
    setIsSubmitting(false);
    setIsModalOpen(false);
    setActionType('');
  };

  const handleApprove = async (id: number | string) => {
    try {
      await updateTransferVacateStatus(id, 'Completed');
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'Completed' as const } : r));
      addToast('Transfer/Vacate request completed successfully. Bed released to available status.', 'success');
      await loadTransfers();
    } catch (e: any) {
      addToast(e?.message || 'Failed to complete transfer/vacate request on server.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    try {
      await deleteTransferVacateRequest(deletingRecord.id);
      setRecords(prev => prev.filter(r => r.id !== deletingRecord.id));
      addToast('Record removed.', 'success');
    } catch (e: any) {
      addToast(e?.message || 'Failed to delete transfer/vacate record on server.', 'error');
    } finally {
      setDeletingRecord(null);
    }
  };

  const filtered = records.filter(r => {
    if (searchError) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.admissionNo || '').toLowerCase().includes(q) ||
      (r.fromRoom || '').toLowerCase().includes(q);
    const matchesAction = filterAction === 'All' || !filterAction || r.actionType === filterAction;
    return matchesSearch && matchesAction;
  });

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  return (
    <div className="space-y-3.5 animate-in fade-in">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Request Transfer / Vacate
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3 rounded-xl flex flex-col sm:flex-row items-start justify-between gap-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col w-full sm:w-80">
          <div className="relative w-full h-[36px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchError ? "text-rose-500" : "text-slate-400"}`} />
            <input
              type="text"
              data-skip-global-validation="true"
              data-search-input="true"
              placeholder="Search student, student ID, room..."
              value={searchQuery}
              onChange={e => handleSearchQueryChange(e.target.value)}
              className={`w-full h-[36px] pl-10 ${searchQuery ? "pr-8" : "pr-4"} rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border text-xs font-semibold text-slate-900 dark:text-white outline-none transition-all ${
                searchError
                  ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                  : "border-sky-200/80 dark:border-sky-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchError(undefined);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchError && (
            <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 mt-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{searchError}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="min-w-[180px] w-full sm:w-auto">
            <SearchableSelect
              value={filterAction}
              onChange={handleFilterActionChange}
              placeholder="Select"
              searchPlaceholder="Search type..."
              options={[
                { value: '', label: 'Select' },
                { value: 'All', label: 'All Requests' },
                { value: 'Room Transfer', label: 'Room Transfer' },
                { value: 'Bed Vacate', label: 'Bed Vacate' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Empty State Prompt Card */}
      {!filterAction && !searchQuery.trim() ? (
        <div className="py-16 px-6 glass-card rounded-3xl border border-sky-300 dark:border-sky-800 text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <ArrowRightLeft className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Please enter a search query or filter to load transfer and vacate records.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-center">Student</th>
                  <th className="py-2 px-3 text-center">Student ID</th>
                  <th className="py-2 px-3 text-center">Action Type</th>
                  <th className="py-2 px-3 text-center">Current Room</th>
                  <th className="py-2 px-3 text-center">Target Room / Fee Adjustment</th>
                  <th className="py-2 px-3 text-center">Date</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 italic font-semibold">No transfer/vacate records found matching filter.</td>
                  </tr>
                ) : (
                  paginated.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white">{r.studentName}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">{r.admissionNo || r.studentId}</td>
                      <td className="py-2 px-3 text-center font-bold text-sky-600 dark:text-sky-400">{r.actionType}</td>
                      <td className="py-2 px-3 text-center text-slate-600 font-semibold">{r.fromHostel} (#{r.fromRoom})</td>
                      <td className="py-2 px-3 text-center">
                        {r.actionType === 'Bed Vacate' ? (
                          <div className="space-y-1">
                            <span className="text-emerald-600 font-bold block">✓ Old Bed Released to Available</span>
                            {r.refundableBalance !== undefined && (
                              <button
                                onClick={() => setSelectedFeeDetail(r)}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800 hover:underline cursor-pointer"
                              >
                                Fee Adjusted: ₹{r.refundableBalance.toLocaleString()} ({r.feeAdjustmentMode})
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-emerald-600 font-bold block">New Bed: {r.toHostel} (#{r.toRoom})</span>
                            <span className="text-[10px] font-semibold text-slate-400 block">✓ Old Bed #{r.fromRoom} Released to Available</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{r.requestDate}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-2 min-h-[32px]">
                          {r.status === 'Pending' && (
                            <button onClick={() => handleApprove(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer" title="Approve & Release Bed"><CheckCircle2 className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => setDeletingRecord(r)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center justify-center" title="Delete Record"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Neat Table Footer with Integrated Pagination */}
          {filtered.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-b-xl">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                showBorder={false}
                className="pt-0 pb-0"
              />
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL WITH PRO-RATA FEE ADJUSTMENT CALCULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Transfer / Vacate Bed</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Resident Student <span className="text-rose-500">*</span></label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-all hover:border-sky-400 ${
                    !selectedStudentId ? 'text-sky-600/70 dark:text-sky-400/70 font-sans font-medium' : 'text-sky-950 dark:text-sky-100'
                  }`}
                  disabled={isSubmitting}
                  required
                >
                  <option value="" disabled className="text-slate-400 dark:text-slate-500 font-sans italic bg-white dark:bg-slate-900">Select Resident Student...</option>
                  {displayStudentsList.map(st => (
                    <option key={st.id} value={String(st.id ?? '')} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      {st.studentName} ({st.admissionNo ? `ADM: ${st.admissionNo}` : `ID: ${st.id}`}) - {st.hostelName} (Room #{st.roomNumber || 'N/A'})
                    </option>
                  ))}
                </select>

                {selectedStudentId && (() => {
                  const st = displayStudentsList.find(s => String(s.id) === String(selectedStudentId));
                  if (!st) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 text-xs flex items-center justify-between animate-in fade-in">
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">
                        Current: <strong className="text-sky-600 dark:text-sky-400">{st.hostelName}</strong> • Room #{st.roomNumber} ({st.bedNumber || 'BED-1'})
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active Resident</span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Action Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={actionType}
                  onChange={e => { setActionType(e.target.value as any); setFeeAdjustmentMode(''); }}
                  required
                  className={`w-full px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-all hover:border-sky-400 ${
                    !actionType
                      ? 'text-sky-600/70 dark:text-sky-400/70 font-normal'
                      : 'text-sky-900 dark:text-sky-100'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="" disabled hidden className="text-slate-400 dark:text-slate-500 font-normal bg-white dark:bg-slate-900">
                    Select Action Type
                  </option>
                  <option value="" className="text-slate-400 dark:text-slate-500 font-normal bg-white dark:bg-slate-900">
                    Select Action Type
                  </option>
                  <option value="Room Transfer" className="text-slate-900 dark:text-white font-medium bg-white dark:bg-slate-900">
                    Room Transfer (Change Room/Block)
                  </option>
                  <option value="Bed Vacate" className="text-slate-900 dark:text-white font-medium bg-white dark:bg-slate-900">
                    Bed Vacate (Checkout & Switch to Day Scholar)
                  </option>
                </select>
              </div>

              {actionType === 'Room Transfer' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Destination Hostel Block <span className="text-rose-500">*</span></label>
                    <select
                      value={targetBlock}
                      onChange={e => { setTargetBlock(e.target.value); setTargetRoom(''); setTargetBed(''); }}
                      className={`w-full px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 font-bold cursor-pointer transition-all hover:border-sky-400 ${
                        !targetBlock ? 'text-sky-600/70 dark:text-sky-400/70 font-medium' : 'text-sky-950 dark:text-sky-100'
                      }`}
                      required
                    >
                      <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-900">Select Destination Hostel Block</option>
                      {availableBlockNames.map(bName => (
                        <option key={bName} value={bName} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                          {bName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Destination Room <span className="text-rose-500">*</span></label>
                      <select
                        value={targetRoom}
                        onChange={e => { setTargetRoom(e.target.value); setTargetBed(''); }}
                        className={`w-full px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 font-bold cursor-pointer transition-all hover:border-sky-400 ${
                          !targetRoom ? 'text-sky-600/70 dark:text-sky-400/70 font-sans font-medium' : 'font-mono text-sky-950 dark:text-sky-100'
                        }`}
                        required
                      >
                        <option value="" disabled className="text-slate-400 font-sans bg-white dark:bg-slate-900">
                          {destinationRooms.length === 0 ? 'No rooms configured in this block' : 'Select Destination Room'}
                        </option>
                        {destinationRooms.map(r => (
                          <option key={r.roomId || r.roomNumber} value={r.roomNumber || r.roomId} className="text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900">
                            Room #{r.roomNumber} ({r.roomTypeSpecification || `${r.bedCapacity || 2} Beds`})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Destination Bed Number <span className="text-rose-500">*</span></label>
                      <select
                        value={targetBed}
                        onChange={e => setTargetBed(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 font-bold cursor-pointer transition-all hover:border-sky-400 ${
                          !targetBed ? 'text-sky-600/70 dark:text-sky-400/70 font-sans font-medium' : 'font-mono text-sky-950 dark:text-sky-100'
                        }`}
                        required
                        disabled={!targetRoom || destinationBedOptions.length === 0}
                      >
                        <option value="" disabled className="text-slate-400 font-sans bg-white dark:bg-slate-900">
                          {!targetRoom ? 'Select room first' : destinationBedOptions.length === 0 ? 'No beds available' : 'Select Destination Bed Number'}
                        </option>
                        {destinationBedOptions.map(b => (
                          <option key={b.value} value={b.value} disabled={b.isOccupied} className="text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900">
                            {b.label} {b.isOccupied ? '(Occupied)' : '(Available)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {actionType === 'Bed Vacate' && (
                /* PRO-RATA HOSTEL FEE ADJUSTMENT & REFUND CALCULATOR */
                <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-200 dark:border-sky-800 pb-2">
                    <span className="font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wider text-[11px]">
                      💰 Pro-rata Hostel Fee Settlement Calculator
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                      Bed Released to Available
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Annual Hostel Fee Paid (₹)</label>
                      <input
                        type="number"
                        value={totalFeePaid}
                        onChange={e => setTotalFeePaid(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Months Stayed</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={monthsStayed}
                        onChange={e => setMonthsStayed(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Fee Breakdown Summary */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-1.5 border border-sky-100 dark:border-sky-900">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Utilized Fee ({monthsStayed} Mos @ Pro-rata):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{feeUtilized.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-emerald-600 font-bold">Unused Refundable Balance:</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">₹{refundableBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Settlement / Adjustment Mode */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee Settlement & Adjustment Mode <span className="text-rose-500">*</span></label>
                    <select
                      value={feeAdjustmentMode}
                      onChange={e => setFeeAdjustmentMode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 font-bold text-sky-900 dark:text-sky-100 outline-none cursor-pointer hover:border-sky-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    >
                      <option value="">Select Fee Settlement & Adjustment Mode</option>
                      <option value="Credit to Tuition Fee">Credit Balance to Student Tuition Dues (Recommended)</option>
                      <option value="Refund Cash/Bank">Direct Cash / Bank Refund Voucher to Parent</option>
                      <option value="Non-Refundable">Non-Refundable (As per School Policy)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Switched to Non-Residential / Day Scholar after 3 months"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border font-medium text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Approve & Release Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEE ADJUSTMENT DETAILS MODAL */}
      {selectedFeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hostel Fee Settlement Receipt</h3>
              <button onClick={() => setSelectedFeeDetail(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedFeeDetail.studentName}</p>
                <p className="text-slate-400 font-mono">Adm ID: {selectedFeeDetail.admissionNo}</p>
                <p className="text-slate-500">Hostel: {selectedFeeDetail.fromHostel} (#{selectedFeeDetail.fromRoom})</p>
              </div>

              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Annual Fee Paid:</span>
                  <span className="font-mono font-bold">₹{selectedFeeDetail.totalFeePaid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Months Stayed:</span>
                  <span className="font-mono font-bold">{selectedFeeDetail.monthsStayed} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Utilized:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{selectedFeeDetail.feeUtilized?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-emerald-600 font-bold">
                  <span>Adjusted Refundable Balance:</span>
                  <span className="font-mono text-sm">₹{selectedFeeDetail.refundableBalance?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">Adjustment Mode:</span>
                  <span className="font-bold text-sky-600">{selectedFeeDetail.feeAdjustmentMode}</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-[11px]">
                ✓ Bed released to available status. Fee adjustment entry logged in Finance Ledger.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFeeDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-slate-700 dark:text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingRecord && (
        <ConfirmModal
          isOpen={true}
          title="Delete Request"
          message={`Are you sure you want to remove request for ${deletingRecord.studentName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecord(null)}
        />
      )}
    </div>
  );
};
