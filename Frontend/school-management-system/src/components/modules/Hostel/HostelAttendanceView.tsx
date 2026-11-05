import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserCheck, Loader2, Calendar, Search, Filter, Save, Sun, Moon, Printer, FileText, FileSpreadsheet, CheckCircle2, XCircle, Clock, UserX, RotateCcw, X, AlertCircle, Edit3, Lock, Unlock } from 'lucide-react';
import { validateSearchQuery } from '../../../utils/validation';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';
import { Pagination } from '../../common/Pagination';
import { getHostelBlocks, getRooms, getAllocations, getNightAttendance, saveNightAttendance, formatRoomNumber, HostelBlock, HostelRoom, BedAllocation, NightAttendanceRecord } from '../../../api/hostel';
import { formatConfiguredStudentAdmissionNo } from '../../../utils/idGenerator';
import { exportToExcel } from '../../../utils/excelExport';

export const HostelAttendanceView: React.FC = () => {
  const { addToast } = useToast();
  const { user, role } = useAuth();
  const { students } = useData();
  const userRole = (role || user?.role || '').toLowerCase();
  const isWarden = userRole.includes('warden');

  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<NightAttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

    return blocks.length > 0 ? [blocks[0]] : [];
  }, [blocks, isWarden, user]);

  const targetBlocks = isWarden ? wardenAssignedBlocks : blocks;
  const targetBlockIds = targetBlocks.map(b => String(b.hostelId || (b as any).id || '')).join(',');

  // Edit Mode state - locked by default until user clicks Edit Attendance
  const [isEditing, setIsEditing] = useState(false);

  // Shift, View Mode & Date state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
  const [attendanceShift, setAttendanceShift] = useState<'morning' | 'night'>('morning');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Filter states
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);

  const handleSearchQueryChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    if (!val.trim()) {
      setSearchError(undefined);
    } else {
      const res = validateSearchQuery(val, 30);
      setSearchError(res.isValid ? undefined : (res.error || 'Enter a valid search term.'));
    }
  };
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (targetBlocks.length > 0) {
      if (isWarden) {
        const assignedId = String(targetBlocks[0].hostelId || (targetBlocks[0] as any).id || '');
        if (!selectedBlockId || selectedBlockId === 'All' || !targetBlocks.some(b => String(b.hostelId || (b as any).id) === selectedBlockId)) {
          setSelectedBlockId(assignedId);
        }
      } else {
        if (!selectedBlockId) {
          setSelectedBlockId('All');
        }
      }
    }
  }, [isWarden, targetBlockIds, selectedBlockId]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Attendance & Time state per student for Morning and Night shifts separately
  const [morningAttendanceState, setMorningAttendanceState] = useState<Record<string, string>>({});
  const [nightAttendanceState, setNightAttendanceState] = useState<Record<string, string>>({});

  const [morningInTimeState, setMorningInTimeState] = useState<Record<string, string>>({});
  const [nightInTimeState, setNightInTimeState] = useState<Record<string, string>>({});

  const [morningOutTimeState, setMorningOutTimeState] = useState<Record<string, string>>({});
  const [nightOutTimeState, setNightOutTimeState] = useState<Record<string, string>>({});

  // Monthly Matrix Attendance State
  const [monthlyMorningAttendance, setMonthlyMorningAttendance] = useState<Record<string, Record<string, string>>>({});
  const [monthlyNightAttendance, setMonthlyNightAttendance] = useState<Record<string, Record<string, string>>>({});

  const matrixDates = useMemo(() => {
    if (viewMode !== 'monthly') return [];
    const [yearStr, mStr] = (selectedMonth || currentMonthStr).split('-');
    const year = parseInt(yearStr, 10);
    const m = parseInt(mStr, 10);
    if (!year || !m) return [];
    const daysInMonth = new Date(year, m, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return dates;
  }, [viewMode, selectedMonth, currentMonthStr]);

  const formattedMonthLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const [yr, mo] = selectedMonth.split('-');
    const dt = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const fetchData = useCallback(async () => {
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
      addToast('error', 'Failed to load data', error?.message || 'Data load error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    const handleSync = () => fetchData();
    window.addEventListener('hostel_allocations_updated', handleSync);
    window.addEventListener('hostel_students_updated', handleSync);
    window.addEventListener('residential_students_updated', handleSync);
    window.addEventListener('students_updated', handleSync);

    return () => {
      window.removeEventListener('hostel_allocations_updated', handleSync);
      window.removeEventListener('hostel_students_updated', handleSync);
      window.removeEventListener('residential_students_updated', handleSync);
      window.removeEventListener('students_updated', handleSync);
    };
  }, [fetchData]);

  // Fetch Attendance when Date or Block changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (selectedDate) {
        try {
          const isAll = !selectedBlockId || selectedBlockId === 'All';
          const blockParam = isAll ? 0 : Number(selectedBlockId);
          const records = await getNightAttendance(selectedDate, blockParam);
          setAttendanceRecords(records || []);
          
          const newMorningAtt: Record<string, string> = {};
          const newMorningIn: Record<string, string> = {};
          const newMorningOut: Record<string, string> = {};

          const newNightAtt: Record<string, string> = {};
          const newNightIn: Record<string, string> = {};
          const newNightOut: Record<string, string> = {};

          (records || []).forEach(r => {
            if (r) {
              const status = r.curfewStatus;
              const inT = r.inTime;
              const outT = r.outTime;
              const isMorningRecord = Boolean(r.remarks && r.remarks.toLowerCase().includes('morning'));

              const populate = (attMap: Record<string, string>, inMap: Record<string, string>, outMap: Record<string, string>) => {
                if (r.studentId !== undefined && r.studentId !== null) {
                  const sKey = String(r.studentId);
                  if (status) attMap[sKey] = status;
                  if (status) attMap[`st_${sKey}`] = status;
                  if (inT) inMap[sKey] = inT;
                  if (inT) inMap[`st_${sKey}`] = inT;
                  if (outT) outMap[sKey] = outT;
                  if (outT) outMap[`st_${sKey}`] = outT;
                }
                if (r.allocationId !== undefined && r.allocationId !== null) {
                  const aKey = String(r.allocationId);
                  if (status) attMap[aKey] = status;
                  if (inT) inMap[aKey] = inT;
                  if (outT) outMap[aKey] = outT;
                }
              };

              if (isMorningRecord) {
                populate(newMorningAtt, newMorningIn, newMorningOut);
              } else {
                populate(newNightAtt, newNightIn, newNightOut);
              }
            }
          });

          setMorningAttendanceState(newMorningAtt);
          setMorningInTimeState(newMorningIn);
          setMorningOutTimeState(newMorningOut);

          setNightAttendanceState(newNightAtt);
          setNightInTimeState(newNightIn);
          setNightOutTimeState(newNightOut);
        } catch (error: any) {
          addToast('error', 'Failed to load attendance', error.message);
        }
      } else {
        setAttendanceRecords([]);
        setMorningAttendanceState({});
        setMorningInTimeState({});
        setMorningOutTimeState({});
        setNightAttendanceState({});
        setNightInTimeState({});
        setNightOutTimeState({});
      }
    };
    fetchAttendance();
  }, [selectedDate, selectedBlockId, addToast]);

  // Derived filters
  const availableBlockRooms = rooms.filter(rm =>
    rm && rm.hostelId !== undefined && rm.hostelId !== null &&
    (!selectedBlockId || selectedBlockId === 'All' || String(rm.hostelId) === selectedBlockId)
  );
  const floors = Array.from(new Set(availableBlockRooms.map(rm => rm.floorLevel))).sort();

  const filteredRooms = rooms.filter(rm =>
    rm && rm.hostelId !== undefined && rm.hostelId !== null &&
    (!selectedBlockId || selectedBlockId === 'All' || String(rm.hostelId) === selectedBlockId) &&
    (!selectedFloor || rm.floorLevel === selectedFloor)
  );

  const getItemKey = (a: BedAllocation, idx: number = 0): string => {
    return String(a.studentId || a.allocationId || `row_${idx}`);
  };

  const getEnrolledStudentId = useCallback((item: BedAllocation | any): string => {
    if (!item) return '';

    const rawAdm = String(item.admissionNo || '').trim();
    const rawId = String(item.studentId || item.id || '').trim();
    const rawName = String(item.studentName || item.name || '').trim().toLowerCase();

    // Match against enrolled students master roster
    const matched = (students || []).find((s: any) => {
      const sId = String(s.id || '').trim();
      const sStudId = String(s.studentId || '').trim();
      const sAdm = String(s.admissionNo || '').trim();
      const sReg = String(s.registrationNo || '').trim();
      const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() || String(s.name || '').trim().toLowerCase();

      if (rawId && (sId === rawId || sStudId === rawId)) return true;
      if (rawAdm && (sAdm.toLowerCase() === rawAdm.toLowerCase() || sReg.toLowerCase() === rawAdm.toLowerCase())) return true;
      if (rawName && sName && sName === rawName) return true;
      return false;
    });

    // 1. Post-enrollment official admission number from students master store
    if (matched?.admissionNo && String(matched.admissionNo).trim()) {
      return String(matched.admissionNo).trim();
    }

    // 2. Allocation record's admission number (if non-empty and not just pre-enrollment reg- prefix)
    if (rawAdm && rawAdm !== '—' && rawAdm !== 'N/A' && !rawAdm.toLowerCase().startsWith('reg-')) {
      return rawAdm;
    }

    // 3. Post-enrollment student ID from students master store
    if (matched?.studentId && String(matched.studentId).trim() && !String(matched.studentId).trim().toLowerCase().startsWith('reg-')) {
      return String(matched.studentId).trim();
    }

    // 4. Raw admission number if present
    if (rawAdm && rawAdm !== '—' && rawAdm !== 'N/A') {
      return rawAdm;
    }

    // 5. Configured Automated ID format (e.g. ADM-2026-1221 / STU-2026-1221)
    if (rawId && rawId !== '0') {
      try {
        const formatted = formatConfiguredStudentAdmissionNo(rawAdm || undefined, rawId);
        if (formatted && formatted !== '—') return formatted;
      } catch {}
      return rawId;
    }

    return rawAdm || rawId || '—';
  }, [students]);

  const getAttendanceStatus = (key: string): string => {
    const map = attendanceShift === 'morning' ? morningAttendanceState : nightAttendanceState;
    return map[key] || '';
  };

  const getInTime = (key: string): string => {
    const map = attendanceShift === 'morning' ? morningInTimeState : nightInTimeState;
    return map[key] || (attendanceShift === 'morning' ? '07:00 AM' : '09:00 PM');
  };

  const getOutTime = (key: string): string => {
    const map = attendanceShift === 'morning' ? morningOutTimeState : nightOutTimeState;
    return map[key] || (attendanceShift === 'morning' ? '08:30 AM' : '06:00 AM');
  };

  const handleStatusChange = (key: string, status: string) => {
    if (attendanceShift === 'morning') {
      setMorningAttendanceState(prev => ({ ...prev, [key]: status }));
    } else {
      setNightAttendanceState(prev => ({ ...prev, [key]: status }));
    }
  };

  const handleInTimeChange = (key: string, value: string) => {
    if (attendanceShift === 'morning') {
      setMorningInTimeState(prev => ({ ...prev, [key]: value }));
    } else {
      setNightInTimeState(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleOutTimeChange = (key: string, value: string) => {
    if (attendanceShift === 'morning') {
      setMorningOutTimeState(prev => ({ ...prev, [key]: value }));
    } else {
      setNightOutTimeState(prev => ({ ...prev, [key]: value }));
    }
  };

  const getMatrixCellStatus = (studentKey: string, dateStr: string): string => {
    const map = attendanceShift === 'morning' ? monthlyMorningAttendance : monthlyNightAttendance;
    if (map[studentKey] && map[studentKey][dateStr] !== undefined) {
      return map[studentKey][dateStr];
    }
    if (dateStr === selectedDate) {
      return getAttendanceStatus(studentKey);
    }
    return '';
  };

  const handleMatrixCellClick = (studentKey: string, dateStr: string) => {
    if (!isEditing) return;
    const current = getMatrixCellStatus(studentKey, dateStr);
    const cycle: Record<string, string> = {
      '': 'Present',
      'Present': 'Absent',
      'Absent': 'Late',
      'Late': 'Leave',
      'Leave': ''
    };
    const next = cycle[current] ?? 'Present';
    const setFn = attendanceShift === 'morning' ? setMonthlyMorningAttendance : setMonthlyNightAttendance;
    setFn(prev => ({
      ...prev,
      [studentKey]: {
        ...(prev[studentKey] || {}),
        [dateStr]: next
      }
    }));
  };

  const currentBlockObj = useMemo(() => {
    if (!selectedBlockId || selectedBlockId === 'All') return null;
    return blocks.find(b => String(b.hostelId) === selectedBlockId) || targetBlocks[0];
  }, [blocks, selectedBlockId, targetBlocks]);

  const targetBlockName = useMemo(() => {
    return (currentBlockObj?.hostelName || '').toLowerCase().trim();
  }, [currentBlockObj]);

  const blockAllocations = useMemo(() => {
    const isAll = !selectedBlockId || selectedBlockId === 'All';
    return allocations.filter(a => {
      if (!a) return false;
      const st = (a.status || '').toLowerCase().trim();
      if (st === 'vacated' || st === 'inactive' || st === 'cancelled') return false;
      if (isAll) return true;
      const matchId = String(a.hostelId) === selectedBlockId;
      const matchName = targetBlockName && (a.hostelName || '').toLowerCase().includes(targetBlockName);
      return matchId || matchName;
    });
  }, [allocations, selectedBlockId, targetBlockName]);

  const attendanceStudentRows = useMemo(() => {
    const list: BedAllocation[] = [];
    const seenKeys = new Set<string>();
    const isAll = !selectedBlockId || selectedBlockId === 'All';

    // 1. Primary Source: Active room allocations for this hostel block (or all blocks)
    blockAllocations.forEach((a, idx) => {
      if (!a) return;
      const sName = String(a.studentName || '').toLowerCase().trim();
      const sAdm = String(a.admissionNo || '').toLowerCase().trim();
      const sId = String(a.studentId || '').toLowerCase().trim();

      // Resolve post-enrollment student ID from enrolled students master store
      const enrolledStudent = (students || []).find((s: any) => {
        const studIdStr = String(s.id || '').trim();
        const studRefId = String(s.studentId || '').trim();
        const studAdm = String(s.admissionNo || '').trim();
        const studReg = String(s.registrationNo || '').trim();
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() || String(s.name || '').trim().toLowerCase();

        if (sId && (studIdStr === sId || studRefId === sId)) return true;
        if (sAdm && (studAdm.toLowerCase() === sAdm || studReg.toLowerCase() === sAdm)) return true;
        if (sName && fullName && fullName === sName) return true;
        return false;
      });

      const effectiveAdmissionNo =
        enrolledStudent?.admissionNo ||
        (a.admissionNo && !a.admissionNo.toLowerCase().startsWith('reg-') ? a.admissionNo : '') ||
        enrolledStudent?.studentId ||
        a.admissionNo ||
        (a.studentId ? formatConfiguredStudentAdmissionNo(undefined, a.studentId) : '');

      const primaryKey = sName || sAdm || sId;
      if (primaryKey && !seenKeys.has(primaryKey) && !seenKeys.has(sName) && !seenKeys.has(sAdm)) {
        if (sName) seenKeys.add(sName);
        if (sAdm) seenKeys.add(sAdm);
        if (sId) seenKeys.add(sId);
        list.push({
          ...a,
          studentId: a.studentId,
          admissionNo: effectiveAdmissionNo || a.admissionNo,
          allocationId: Number(a.allocationId) || (idx + 1)
        });
      }
    });

    // 2. Secondary Source: Any active hostellers explicitly assigned to this target block from student store
    (students || []).forEach((s: any, idx: number) => {
      if (!s || s.status === 'Completed' || s.status === 'Alumni') return;

      const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || '';
      const nameKey = String(sName).toLowerCase().trim();
      const admKey = String(s.admissionNo || s.registrationNumber || '').toLowerCase().trim();
      const idKey = String(s.id || s.studentId || '').toLowerCase().trim();

      if ((nameKey && seenKeys.has(nameKey)) || (admKey && seenKeys.has(admKey)) || (idKey && seenKeys.has(idKey))) {
        return;
      }

      const hBlock = String(s.hostelBlock || s.blockName || s.hostelName || '').toLowerCase().trim();
      const isTargetBlockExplicit = targetBlockName && hBlock.includes(targetBlockName);
      const isHostellerType = s.studentType === 'Hosteller' || s.studentType === 'Residential' || s.isHosteller || Boolean(hBlock);

      if (isAll ? isHostellerType : (isTargetBlockExplicit || (blockAllocations.length === 0 && isHostellerType))) {
        if (nameKey) seenKeys.add(nameKey);
        if (admKey) seenKeys.add(admKey);
        if (idKey) seenKeys.add(idKey);

        const effectiveAdmissionNo =
          s.admissionNo ||
          (s.studentId && !String(s.studentId).toLowerCase().startsWith('reg-') ? s.studentId : '') ||
          formatConfiguredStudentAdmissionNo(s.admissionNo, s.id);

        list.push({
          allocationId: s.id || `alloc_st_${idx + 1}`,
          studentId: s.id,
          studentName: sName,
          admissionNo: effectiveAdmissionNo || `ADM-${s.id}`,
          hostelId: Number(selectedBlockId) || 1,
          hostelName: s.hostelBlock || s.hostelName || currentBlockObj?.hostelName || 'Hostel Block',
          roomId: 101,
          roomNumber: s.roomNumber || s.room || '101',
          bedNumber: s.bedNumber || s.bed || 'BED-1',
          status: 'Active'
        } as BedAllocation);
      }
    });

    return list;
  }, [blockAllocations, students, selectedBlockId, currentBlockObj, targetBlockName]);

  const matchedAssignments = useMemo(() => {
    return attendanceStudentRows.filter((a, idx) => {
      if (selectedRoomId) {
        const roomMatch = String(a.roomId) === selectedRoomId || String(a.roomNumber) === selectedRoomId;
        if (!roomMatch) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (a.studentName || '').toLowerCase().includes(q);
        const admMatch = (a.admissionNo || '').toLowerCase().includes(q) || getEnrolledStudentId(a).toLowerCase().includes(q);
        const roomMatch = (a.roomNumber || '').toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !roomMatch) return false;
      }

      const itemKey = getItemKey(a, idx);
      const currentSt = getAttendanceStatus(itemKey);
      if (statusFilter !== 'All' && currentSt !== statusFilter) return false;

      return true;
    });
  }, [attendanceStudentRows, selectedRoomId, searchQuery, statusFilter, attendanceShift, morningAttendanceState, nightAttendanceState, getEnrolledStudentId]);

  const totalPages = Math.ceil(matchedAssignments.length / itemsPerPage);
  const paginatedAssignments = matchedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary Counts
  const totalStudentsCount = matchedAssignments.length;
  const presentCount = matchedAssignments.filter((a, idx) => getAttendanceStatus(getItemKey(a, idx)) === 'Present').length;
  const absentCount = matchedAssignments.filter((a, idx) => getAttendanceStatus(getItemKey(a, idx)) === 'Absent').length;
  const leaveCount = matchedAssignments.filter((a, idx) => getAttendanceStatus(getItemKey(a, idx)) === 'Leave').length;
  const lateCount = matchedAssignments.filter((a, idx) => getAttendanceStatus(getItemKey(a, idx)) === 'Late').length;

  // Bulk Quick Actions (Only operable in Edit Mode)
  const handleBulkAction = (targetStatus: string) => {
    if (!isEditing) {
      addToast('warning', 'Attendance Locked', 'Click "Edit Attendance" first to enable marking.');
      return;
    }
    if (matchedAssignments.length === 0) {
      addToast('info', 'No Students', 'No resident students available for bulk action.');
      return;
    }
    const updateFn = attendanceShift === 'morning' ? setMorningAttendanceState : setNightAttendanceState;
    updateFn(prev => {
      const newState = { ...prev };
      matchedAssignments.forEach((a, idx) => {
        newState[getItemKey(a, idx)] = targetStatus;
      });
      return newState;
    });
    addToast('success', `Marked All ${targetStatus}`, `Set ${matchedAssignments.length} students to ${targetStatus} for ${attendanceShift === 'morning' ? 'Morning' : 'Night'} Attendance.`);
  };

  const handleClearSelection = () => {
    if (!isEditing) {
      addToast('warning', 'Attendance Locked', 'Click "Edit Attendance" first to enable marking.');
      return;
    }
    if (attendanceShift === 'morning') {
      setMorningAttendanceState({});
    } else {
      setNightAttendanceState({});
    }
    addToast('info', 'Selection Cleared', `${attendanceShift === 'morning' ? 'Morning' : 'Night'} attendance selections reset to default.`);
  };

  // Monthly bulk actions & statistics (Only operable in Edit Mode)
  const handleMonthlyBulkAction = (targetStatus: string) => {
    if (!isEditing) {
      addToast('warning', 'Attendance Locked', 'Click "Edit Attendance" first to enable marking.');
      return;
    }
    if (matchedAssignments.length === 0) return;
    const setFn = attendanceShift === 'morning' ? setMonthlyMorningAttendance : setMonthlyNightAttendance;
    setFn(prev => {
      const updated = { ...prev };
      matchedAssignments.forEach((a, idx) => {
        const key = getItemKey(a, idx);
        const studentDates = { ...(updated[key] || {}) };
        matrixDates.forEach(d => {
          studentDates[d] = targetStatus;
        });
        updated[key] = studentDates;
      });
      return updated;
    });
    addToast('success', `Marked All ${targetStatus}`, `Updated all days in ${selectedMonth} to ${targetStatus}`);
  };

  const handleMonthlyClearSelection = () => {
    if (!isEditing) {
      addToast('warning', 'Attendance Locked', 'Click "Edit Attendance" first to enable marking.');
      return;
    }
    const setFn = attendanceShift === 'morning' ? setMonthlyMorningAttendance : setMonthlyNightAttendance;
    setFn(prev => {
      const updated = { ...prev };
      matchedAssignments.forEach((a, idx) => {
        const key = getItemKey(a, idx);
        delete updated[key];
      });
      return updated;
    });
    addToast('info', 'Month Cleared', `Cleared attendance for ${selectedMonth}`);
  };

  const monthlyStats = useMemo(() => {
    let totalP = 0;
    let totalA = 0;
    let totalHD = 0;
    let totalL = 0;
    let totalSlots = 0;

    matchedAssignments.forEach((a, idx) => {
      const key = getItemKey(a, idx);
      matrixDates.forEach(d => {
        const st = getMatrixCellStatus(key, d);
        if (st === 'Present') totalP++;
        else if (st === 'Absent') totalA++;
        else if (st === 'Late') totalHD++;
        else if (st === 'Leave') totalL++;
        if (st) totalSlots++;
      });
    });

    const avgPct = totalSlots > 0
      ? Math.round(((totalP + totalL + (totalHD * 0.5)) / totalSlots) * 100)
      : 100;

    return {
      totalStudents: matchedAssignments.length,
      daysInMonth: matrixDates.length,
      avgPct,
      totalP,
      totalA,
      totalHD,
      totalL
    };
  }, [matchedAssignments, matrixDates, monthlyMorningAttendance, monthlyNightAttendance, attendanceShift]);

  // Prepare Data for Export
  const exportData = matchedAssignments.map((a, idx) => ({
    'Shift': attendanceShift === 'morning' ? 'Morning Attendance' : 'Night Attendance',
    'Date': selectedDate,
    'Student Name': a.studentName,
    'Student ID': getEnrolledStudentId(a),
    'Hostel Block': a.hostelName,
    'Room No': formatRoomNumber(a.roomNumber),
    'Bed No': a.bedNumber || 'BED-1',
    'Attendance Status': getAttendanceStatus(getItemKey(a, idx)),
    'In Time': getInTime(getItemKey(a, idx)),
    'Out Time': getOutTime(getItemKey(a, idx))
  }));

  const handlePrint = () => {
    addToast('info', 'Preparing Print', `Printing ${exportData.length} records for ${attendanceShift === 'morning' ? 'Morning' : 'Night'} Attendance`);
    window.print();
  };

  const handleExportReport = () => {
    if (matchedAssignments.length === 0) {
      addToast('warning', 'No Records', 'There are no student attendance records to export for the selected filter.');
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      try {
        const shiftLabel = attendanceShift === 'morning' ? 'Morning' : 'Night';
        const blockName = currentBlockObj?.hostelName || 'All_Blocks';
        let filename = '';
        let sheetName = '';
        const rows: any[][] = [];

        if (viewMode === 'daily') {
          filename = `Hostel_${shiftLabel}_Attendance_${selectedDate}_${blockName.replace(/\s+/g, '_')}`;
          sheetName = `Daily_${selectedDate}`;

          rows.push([
            'S.No',
            'Student ID',
            'Student Name',
            'Hostel Block',
            'Room No',
            'Bed No',
            'Attendance Status',
            'In Time',
            'Out Time'
          ]);

          matchedAssignments.forEach((a, idx) => {
            const itemKey = getItemKey(a, idx);
            const status = getAttendanceStatus(itemKey) || 'Unmarked';
            const inT = getInTime(itemKey);
            const outT = getOutTime(itemKey);
            const hName = a.hostelName && isNaN(Number(a.hostelName))
              ? a.hostelName
              : (blocks.find(b => String(b.hostelId ?? '') === String(a.hostelName || a.hostelId))?.hostelName || `Block #${a.hostelName || '1'}`);

            rows.push([
              idx + 1,
              getEnrolledStudentId(a),
              a.studentName,
              hName,
              formatRoomNumber(a.roomNumber),
              a.bedNumber || 'BED-1',
              status,
              inT,
              outT
            ]);
          });
        } else {
          // Monthly matrix register export
          filename = `Hostel_${shiftLabel}_Attendance_${selectedMonth || 'Monthly'}_${blockName.replace(/\s+/g, '_')}`;
          sheetName = 'Monthly Register';

          const dayHeaders = matrixDates.map(d => {
            const parts = d.split('-');
            return parts[2] ? parts[2] : d;
          });

          rows.push([
            'S.No',
            'Student ID',
            'Student Name',
            ...dayHeaders,
            'Present (P)',
            'Absent (A)',
            'Half Day (HD)',
            'Leave (L)',
            'Attendance %'
          ]);

          matchedAssignments.forEach((a, idx) => {
            const itemKey = getItemKey(a, idx);
            let pCount = 0;
            let aCount = 0;
            let hdCount = 0;
            let lCount = 0;

            const dayStatuses = matrixDates.map(d => {
              const st = getMatrixCellStatus(itemKey, d);
              if (st === 'Present') { pCount++; return 'P'; }
              if (st === 'Absent') { aCount++; return 'A'; }
              if (st === 'Late') { hdCount++; return 'HD'; }
              if (st === 'Leave') { lCount++; return 'L'; }
              return '-';
            });

            const totalMarked = pCount + aCount + hdCount + lCount;
            const pct = totalMarked > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / totalMarked) * 100) : 100;

            rows.push([
              idx + 1,
              getEnrolledStudentId(a),
              a.studentName,
              ...dayStatuses,
              pCount,
              aCount,
              hdCount,
              lCount,
              `${pct}%`
            ]);
          });
        }

        exportToExcel(rows, filename, sheetName);
        addToast('success', 'Download Complete', `Exported ${matchedAssignments.length} attendance records to Excel.`);
      } catch (err: any) {
        console.error('Attendance export error:', err);
        addToast('error', 'Export Failed', err.message || 'Failed to export attendance report');
      } finally {
        setIsExporting(false);
      }
    }, 300);
  };

  const handleSaveAttendance = async () => {
    if (matchedAssignments.length === 0) {
      addToast('warning', 'No Students Found', 'There are no active students listed to mark attendance.');
      return;
    }

    if (viewMode === 'monthly') {
      try {
        const recordsToSavePromises: Promise<any>[] = [];
        const datesToProcess = matrixDates.filter(d => {
          return matchedAssignments.some((a, idx) => {
            const key = getItemKey(a, idx);
            return Boolean(getMatrixCellStatus(key, d));
          });
        });

        const targetDates = datesToProcess.length > 0 ? datesToProcess : [selectedDate];

        for (const d of targetDates) {
          const records = matchedAssignments.map((a, idx) => {
            const itemKey = getItemKey(a, idx);
            const rawStudId = String(a.studentId || '').trim();
            const studIdNum = typeof a.studentId === 'number' ? a.studentId : (parseInt(rawStudId.replace(/\D/g, ''), 10) || null);
            const allocIdNum = typeof a.allocationId === 'number' ? a.allocationId : (parseInt(String(a.allocationId).replace(/\D/g, ''), 10) || (studIdNum ?? (idx + 1)));

            const st = getMatrixCellStatus(itemKey, d) || 'Present';
            return {
              allocationId: allocIdNum,
              studentId: studIdNum,
              curfewStatus: st,
              inTime: getInTime(itemKey),
              outTime: getOutTime(itemKey),
              remarks: `${attendanceShift === 'morning' ? 'Morning Roll Call' : 'Night Curfew Roll Call'}`
            };
          });

          recordsToSavePromises.push(
            saveNightAttendance({
              date: d,
              hostelId: Number(!selectedBlockId || selectedBlockId === 'All' ? 0 : selectedBlockId),
              floorLevel: selectedFloor || '1st Floor',
              records
            })
          );
        }

        await Promise.all(recordsToSavePromises);
        addToast('success', 'Monthly Attendance Saved', `${attendanceShift === 'morning' ? 'Morning' : 'Night'} attendance records saved for ${selectedMonth}.`);
        setIsEditing(false);
      } catch (error: any) {
        addToast('error', 'Save Failed', error.message || 'Error saving monthly attendance log');
      }
      return;
    }

    const records = matchedAssignments.map((a, idx) => {
      const itemKey = getItemKey(a, idx);
      const rawStudId = String(a.studentId || '').trim();
      const studIdNum = typeof a.studentId === 'number' ? a.studentId : (parseInt(rawStudId.replace(/\D/g, ''), 10) || null);
      const allocIdNum = typeof a.allocationId === 'number' ? a.allocationId : (parseInt(String(a.allocationId).replace(/\D/g, ''), 10) || (studIdNum ?? (idx + 1)));

      return {
        allocationId: allocIdNum,
        studentId: studIdNum,
        curfewStatus: getAttendanceStatus(itemKey) || 'Present',
        inTime: getInTime(itemKey),
        outTime: getOutTime(itemKey),
        remarks: `${attendanceShift === 'morning' ? 'Morning Roll Call' : 'Night Curfew Roll Call'}`
      };
    });

    try {
      await saveNightAttendance({
        date: selectedDate,
        hostelId: Number(!selectedBlockId || selectedBlockId === 'All' ? 0 : selectedBlockId),
        floorLevel: selectedFloor || '1st Floor',
        records
      });
      addToast('success', 'Attendance Log Saved', `${attendanceShift === 'morning' ? 'Morning' : 'Night'} attendance saved for ${records.length} students.`);
      setIsEditing(false);
    } catch (error: any) {
      addToast('error', 'Save Failed', error.message || 'Error saving attendance log');
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {/* Top Main Heading & Save Log Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-500" /> Hostel Attendance
        </h2>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Attendance Locked
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Click to enable editing and mark attendance"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Attendance
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 shadow-xs">
                <Unlock className="w-3.5 h-3.5 text-amber-500" /> Editing Mode
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" /> Save Attendance Log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Bar matching Staff Attendance: Left Shift Pills | Right View Mode & Export */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: Morning & Night Shift Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setAttendanceShift('morning');
              setIsEditing(false);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              attendanceShift === 'morning'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-300" /> Morning Attendance
          </button>

          <button
            onClick={() => {
              setAttendanceShift('night');
              setIsEditing(false);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              attendanceShift === 'night'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-300" /> Night Attendance
          </button>
        </div>

        {/* Right: Daily/Monthly Pills & Export Report Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily Attendance
            </button>

            <button
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Attendance
            </button>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportReport}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Download Excel attendance report"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="glass-card p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="flex flex-col w-full lg:w-72">
            <div className="relative w-full h-[36px]">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchError ? "text-rose-500" : "text-slate-400"}`} />
              <input
                type="text"
                data-skip-global-validation="true"
                data-search-input="true"
                placeholder="Search by name, student ID, room..."
                value={searchQuery}
                onChange={e => handleSearchQueryChange(e.target.value)}
                className={`w-full h-[36px] pl-9 ${searchQuery ? "pr-8" : "pr-4"} text-xs font-semibold rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border text-slate-900 dark:text-white outline-none transition-all ${
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
                    setCurrentPage(1);
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

          {/* Right: Date/Month, Block, Room filters */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full lg:w-auto">
            {viewMode === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-mono font-bold outline-none h-[34px] cursor-pointer hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                max={currentMonthStr}
                onChange={e => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-mono font-bold outline-none h-[34px] cursor-pointer hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            )}

            {isWarden ? (
              <div className="px-3 py-1.5 text-xs rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-bold h-[34px] flex items-center">
                {targetBlocks[0]?.hostelName || 'Assigned Hostel Block'}
              </div>
            ) : (
              <select
                value={selectedBlockId}
                onChange={e => {
                  setSelectedBlockId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-bold outline-none h-[34px] cursor-pointer hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <option value="All" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">All Blocks</option>
                {(targetBlocks || [])
                  .filter(h => h != null)
                  .map((h, idx) => {
                    const idVal = h.hostelId !== undefined && h.hostelId !== null ? String(h.hostelId) : String((h as any).id || idx);
                    return (
                      <option key={`att_blk_${idVal}_${idx}`} value={idVal} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                        {h.hostelName || `Block #${idVal}`}
                      </option>
                    );
                  })}
              </select>
            )}

            <select
              value={selectedRoomId}
              onChange={e => {
                setSelectedRoomId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-bold outline-none h-[34px] cursor-pointer hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            >
              <option value="" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">All Rooms</option>
              {(filteredRooms || [])
                .filter(r => r != null)
                .map((r, idx) => {
                  const rId = r.roomId !== undefined && r.roomId !== null ? String(r.roomId) : String((r as any).id || idx);
                  return (
                    <option key={`att_rm_${rId}_${idx}`} value={rId} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      {formatRoomNumber(r.roomNumber || rId)}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>
      </div>

      {/* ATTENDANCE SUMMARY CARD */}
      <div className="glass-card p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-500" />
            {viewMode === 'daily'
              ? `ATTENDANCE SUMMARY (${attendanceShift.toUpperCase()})`
              : `MONTHLY ATTENDANCE SUMMARY (${attendanceShift.toUpperCase()})`}
          </h3>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {viewMode === 'daily' ? `Date: ${selectedDate}` : `Month: ${formattedMonthLabel || selectedMonth}`}
          </span>
        </div>

        {viewMode === 'daily' ? (
          /* 5 KPI Stat Cards for Daily */
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">TOTAL STUDENTS</p>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">{totalStudentsCount}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">PRESENT</p>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{presentCount}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">ABSENT</p>
              <p className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">{absentCount}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">ON LEAVE</p>
              <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">{leaveCount}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-center col-span-2 sm:col-span-1">
              <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">HALF DAY</p>
              <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">{lateCount}</p>
            </div>
          </div>
        ) : (
          /* 5 KPI Stat Cards for Monthly */
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">TOTAL STUDENTS</p>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">{monthlyStats.totalStudents}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">DAYS IN MONTH</p>
              <p className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{monthlyStats.daysInMonth}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">AVG ATTENDANCE</p>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{monthlyStats.avgPct}%</p>
            </div>

            <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 text-center">
              <p className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">TOTAL PRESENT</p>
              <p className="text-lg font-black font-mono text-teal-600 dark:text-teal-400 mt-0.5">{monthlyStats.totalP}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-center col-span-2 sm:col-span-1">
              <p className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">TOTAL ABSENT</p>
              <p className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">{monthlyStats.totalA}</p>
            </div>
          </div>
        )}

        {/* QUICK BULK ACTIONS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">QUICK BULK ACTIONS:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'daily' ? (
              <>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleBulkAction('Present')}
                  className={`px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-emerald-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable marking' : 'Mark All Present'}
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleBulkAction('Absent')}
                  className={`px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable marking' : 'Mark All Absent'}
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleBulkAction('Leave')}
                  className={`px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable marking' : 'Mark All Leave'}
                >
                  Mark All Leave
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={handleClearSelection}
                  className={`px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable' : 'Clear Selection'}
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleMonthlyBulkAction('Present')}
                  className={`px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-emerald-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable marking' : 'Mark Month Present'}
                >
                  Mark Month Present
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleMonthlyBulkAction('Absent')}
                  className={`px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable marking' : 'Mark Month Absent'}
                >
                  Mark Month Absent
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleMonthlyBulkAction('Leave')}
                  className={`px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable marking' : 'Mark Month Leave'}
                >
                  Mark Month Leave
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={handleMonthlyClearSelection}
                  className={`px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] transition-all select-none ${
                    !isEditing ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-200 cursor-pointer active:scale-95'
                  }`}
                  title={!isEditing ? 'Click "Edit Attendance" first to enable' : 'Clear Month'}
                >
                  Clear Month
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student Attendance Roster Table (Daily) vs Monthly Matrix Register */}
      {viewMode === 'daily' ? (
        <div className="glass-card rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs p-3 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-center">STUDENT ID</th>
                  <th className="py-2 px-3 text-center">STUDENT NAME</th>
                  <th className="py-2 px-3 text-center">HOSTEL BLOCK</th>
                  <th className="py-2 px-3 text-center">ROOM & BED NO</th>
                  <th className="py-2 px-3 text-center">ATTENDANCE STATUS</th>
                  <th className="py-2 px-3 text-center">IN TIME</th>
                  <th className="py-2 px-3 text-center">OUT TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-bold">Loading student attendance register...</td></tr>
                ) : paginatedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                      No active hostel resident students found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedAssignments.map((a, idx) => {
                    const itemKey = getItemKey(a, idx);
                    const currentSt = getAttendanceStatus(itemKey);
                    return (
                      <tr key={`alloc_${a.allocationId}_${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-500 whitespace-nowrap">{getEnrolledStudentId(a)}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                          {a.studentName}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {a.hostelName && isNaN(Number(a.hostelName))
                            ? a.hostelName
                            : (blocks.find(b => String(b.hostelId ?? '') === String(a.hostelName || a.hostelId))?.hostelName || `Block #${a.hostelName || '1'}`)}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono">
                          {formatRoomNumber(a.roomNumber)} ({a.bedNumber || 'BED-1'})
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap mx-auto">
                            {(['Present', 'Absent', 'Late', 'Leave'] as const).map(st => {
                              const isSelected = currentSt === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  disabled={!isEditing}
                                  onClick={() => handleStatusChange(itemKey, st)}
                                  className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                                    isSelected
                                      ? st === 'Present' ? 'bg-emerald-600 text-white shadow-sm' :
                                        st === 'Absent' ? 'bg-rose-600 text-white shadow-sm' :
                                        st === 'Late' ? 'bg-amber-500 text-white shadow-sm' :
                                        'bg-blue-600 text-white shadow-sm'
                                      : isEditing
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
                                        : 'bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40'
                                  } ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {st === 'Late' ? 'Half Day' : st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={getInTime(itemKey)}
                            onChange={e => handleInTimeChange(itemKey, e.target.value)}
                            className={`px-2 py-1 text-xs rounded-lg border text-center font-mono font-bold w-24 outline-none h-[30px] transition-all ${
                              isEditing
                                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 cursor-text'
                                : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={getOutTime(itemKey)}
                            onChange={e => handleOutTimeChange(itemKey, e.target.value)}
                            className={`px-2 py-1 text-xs rounded-lg border text-center font-mono font-bold w-24 outline-none h-[30px] transition-all ${
                              isEditing
                                ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 cursor-text'
                                : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Neat Table Footer with Integrated Pagination */}
          {matchedAssignments.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-b-xl">
              <Pagination
                currentPage={currentPage}
                totalItems={matchedAssignments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                showBorder={false}
                className="pt-0 pb-0"
              />
            </div>
          )}
        </div>
      ) : (
        /* Monthly Matrix Register table (matching AttendanceView.tsx) */
        <div className="glass-card rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs p-3 space-y-3">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[10px]">
                  <th className="py-3 px-3 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 shadow-sm border-r border-slate-200 dark:border-slate-700 text-center">
                    Student Details
                  </th>
                  {matrixDates.map(d => {
                    const dayNum = parseInt(d.split('-')[2], 10);
                    return (
                      <th
                        key={d}
                        className="py-3 px-1 text-center min-w-[28px] font-mono font-black"
                        title={d}
                      >
                        {dayNum}
                      </th>
                    );
                  })}
                  <th className="py-3 px-2 text-center text-emerald-600 font-bold">P</th>
                  <th className="py-3 px-2 text-center text-amber-500 font-bold">HD</th>
                  <th className="py-3 px-2 text-center text-blue-600 font-bold">L</th>
                  <th className="py-3 px-2 text-center text-rose-600 font-bold">A</th>
                  <th className="py-3 px-2 text-center text-sky-600 font-bold">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={matrixDates.length + 6} className="py-12 text-center text-slate-400 font-bold">
                      Loading monthly attendance register...
                    </td>
                  </tr>
                ) : paginatedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={matrixDates.length + 6} className="py-12 text-center text-slate-400 font-semibold italic">
                      No active hostel resident students found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedAssignments.map((a, idx) => {
                    const itemKey = getItemKey(a, idx);
                    let pCount = 0;
                    let aCount = 0;
                    let hdCount = 0;
                    let lCount = 0;

                    return (
                      <tr
                        key={`matrix_${itemKey}_${idx}`}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-200 ${
                          idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'
                        }`}
                      >
                        <td className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 border-r border-slate-200 dark:border-slate-700 shadow-sm text-center ${
                          idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                        }`}>
                          <span className="font-extrabold text-slate-900 dark:text-white block text-center text-xs">
                            {a.studentName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block text-center mt-0.5">
                            ID: {getEnrolledStudentId(a)}
                          </span>
                        </td>
                        {matrixDates.map(d => {
                          const status = getMatrixCellStatus(itemKey, d);
                          let code = '-';
                          let badgeStyle = 'text-slate-400';

                          if (status === 'Present') {
                            code = 'P';
                            pCount++;
                            badgeStyle = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold';
                          } else if (status === 'Absent') {
                            code = 'A';
                            aCount++;
                            badgeStyle = 'text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 font-black';
                          } else if (status === 'Late') {
                            code = 'HD';
                            hdCount++;
                            badgeStyle = 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 font-bold';
                          } else if (status === 'Leave') {
                            code = 'L';
                            lCount++;
                            badgeStyle = 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 font-bold';
                          }

                          const cellTitle = `${d}: ${a.studentName} (${status || 'Unmarked'})`;

                          return (
                            <td key={d} className="py-2 px-0.5 text-center font-mono font-bold text-[10px]">
                              {isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => handleMatrixCellClick(itemKey, d)}
                                  className={`inline-block w-6 py-0.5 rounded transition-all hover:scale-110 active:scale-95 shadow-xs border border-dashed cursor-pointer ${
                                    code !== '-'
                                      ? `${badgeStyle} border-transparent`
                                      : 'text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 hover:border-sky-400 hover:text-sky-600'
                                  }`}
                                  title={cellTitle}
                                >
                                  {code}
                                </button>
                              ) : code !== '-' ? (
                                <span className={`inline-block w-6 py-0.5 rounded ${badgeStyle}`} title={cellTitle}>
                                  {code}
                                </span>
                              ) : (
                                <span className={badgeStyle} title={cellTitle}>
                                  {code}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center font-bold text-emerald-600">{pCount}</td>
                        <td className="py-2 px-2 text-center font-bold text-amber-500">{hdCount}</td>
                        <td className="py-2 px-2 text-center font-bold text-blue-600">{lCount}</td>
                        <td className="py-2 px-2 text-center font-bold text-rose-600">{aCount}</td>
                        <td className="py-2 px-2 text-center font-extrabold text-sky-600 bg-sky-50/30 dark:bg-sky-900/10">
                          {(() => {
                            const marked = pCount + aCount + hdCount + lCount;
                            const totalDays = marked > 0 ? marked : matrixDates.length;
                            return totalDays > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / totalDays) * 100) : 100;
                          })()}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Neat Table Footer with Integrated Pagination */}
          {matchedAssignments.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-b-xl">
              <Pagination
                currentPage={currentPage}
                totalItems={matchedAssignments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                showBorder={false}
                className="pt-0 pb-0"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
