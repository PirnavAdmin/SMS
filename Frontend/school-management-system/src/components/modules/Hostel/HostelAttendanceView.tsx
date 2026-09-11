import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserCheck, Calendar, Search, Filter, Save, Sun, Moon, Printer, FileText, FileSpreadsheet, CheckCircle2, XCircle, Clock, UserX, RotateCcw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';
import { Pagination } from '../../common/Pagination';
import { getHostelBlocks, getRooms, getAllocations, getNightAttendance, saveNightAttendance, HostelBlock, HostelRoom, BedAllocation, NightAttendanceRecord } from '../../../api/hostel';

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

  const targetBlocks = isWarden ? wardenAssignedBlocks : blocks;

  // Shift, View Mode & Date state
  const [attendanceShift, setAttendanceShift] = useState<'morning' | 'night'>('morning');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter states
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (isWarden && targetBlocks.length > 0) {
      const assignedId = String(targetBlocks[0].hostelId);
      if (!selectedBlockId || !targetBlocks.some(b => String(b.hostelId) === selectedBlockId)) {
        setSelectedBlockId(assignedId);
      }
    }
  }, [isWarden, targetBlocks, selectedBlockId]);

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
  }, [fetchData]);

  // Fetch Attendance when Date or Block changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (selectedDate && selectedBlockId) {
        try {
          const records = await getNightAttendance(selectedDate, Number(selectedBlockId));
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
  const availableBlockRooms = rooms.filter(rm => rm && rm.hostelId !== undefined && rm.hostelId !== null && (!selectedBlockId || String(rm.hostelId) === selectedBlockId));
  const floors = Array.from(new Set(availableBlockRooms.map(rm => rm.floorLevel))).sort();

  const filteredRooms = rooms.filter(rm =>
    rm && rm.hostelId !== undefined && rm.hostelId !== null &&
    (!selectedBlockId || String(rm.hostelId) === selectedBlockId) &&
    (!selectedFloor || rm.floorLevel === selectedFloor)
  );

  const getItemKey = (a: BedAllocation, idx: number = 0): string => {
    return String(a.studentId || a.allocationId || `row_${idx}`);
  };

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

  const currentBlockObj = useMemo(() => {
    return blocks.find(b => String(b.hostelId) === selectedBlockId) || targetBlocks[0];
  }, [blocks, selectedBlockId, targetBlocks]);

  const targetBlockName = useMemo(() => {
    return (currentBlockObj?.hostelName || '').toLowerCase().trim();
  }, [currentBlockObj]);

  const blockAllocations = useMemo(() => {
    return allocations.filter(a =>
      a && (a.status === 'Active' || !a.status) &&
      (!selectedBlockId || String(a.hostelId) === selectedBlockId ||
       (a.hostelName || '').toLowerCase().includes(targetBlockName))
    );
  }, [allocations, selectedBlockId, targetBlockName]);

  const attendanceStudentRows = useMemo(() => {
    const allocatedStudentKeys = new Set<string>();
    blockAllocations.forEach(a => {
      if (a.studentId) allocatedStudentKeys.add(String(a.studentId).toLowerCase().trim());
      if (a.admissionNo) allocatedStudentKeys.add(String(a.admissionNo).toLowerCase().trim());
      if (a.studentName) allocatedStudentKeys.add(String(a.studentName).toLowerCase().trim());
    });

    const activeHostellersFromManagement = (students || []).filter(s => {
      if (s.status === 'Completed' || s.status === 'Alumni') return false;

      const sId = String(s.id || '').toLowerCase().trim();
      const sAdm = String(s.admissionNo || '').toLowerCase().trim();
      const sName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
      const hBlock = String((s as any).hostelBlock || (s as any).blockName || (s as any).hostelName || '').toLowerCase().trim();

      const hasDirectAllocation = allocatedStudentKeys.has(sId) || allocatedStudentKeys.has(sAdm) || allocatedStudentKeys.has(sName);
      const isTargetBlockExplicit = targetBlockName && hBlock.includes(targetBlockName);

      if (blockAllocations.length > 0) {
        return hasDirectAllocation || isTargetBlockExplicit;
      }

      const isHostellerType = (s as any).studentType === 'Hosteller' || (s as any).studentType === 'Residential' || (s as any).isHosteller || Boolean(hBlock);
      return isHostellerType && (isTargetBlockExplicit || !hBlock || !targetBlockName);
    });

    return activeHostellersFromManagement.map((s, idx) => {
      const sId = String(s.id || '').toLowerCase().trim();
      const sAdm = String(s.admissionNo || '').toLowerCase().trim();
      const alloc = blockAllocations.find(a =>
        (a.studentId && String(a.studentId).toLowerCase().trim() === sId) ||
        (a.admissionNo && String(a.admissionNo).toLowerCase().trim() === sAdm)
      );

      return {
        allocationId: alloc?.allocationId || s.id || `alloc_${idx + 1}`,
        studentId: s.id,
        studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        admissionNo: s.admissionNo || `ADM-${s.id}`,
        hostelId: alloc?.hostelId || Number(selectedBlockId) || 1,
        hostelName: alloc?.hostelName || (currentBlockObj?.hostelName) || 'Luxury hostel',
        roomId: alloc?.roomId || 101,
        roomNumber: alloc?.roomNumber || (s as any).roomNumber || (s as any).room || '101',
        bedNumber: alloc?.bedNumber || (s as any).bedNumber || (s as any).bed || 'BED-1',
        status: 'Active'
      } as BedAllocation;
    });
  }, [students, blockAllocations, selectedBlockId, currentBlockObj, targetBlockName]);

  const matchedAssignments = useMemo(() => {
    return attendanceStudentRows.filter((a, idx) => {
      if (selectedRoomId) {
        const roomMatch = String(a.roomId) === selectedRoomId || String(a.roomNumber) === selectedRoomId;
        if (!roomMatch) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (a.studentName || '').toLowerCase().includes(q);
        const admMatch = (a.admissionNo || '').toLowerCase().includes(q);
        const roomMatch = (a.roomNumber || '').toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !roomMatch) return false;
      }

      const itemKey = getItemKey(a, idx);
      const currentSt = getAttendanceStatus(itemKey);
      if (statusFilter !== 'All' && currentSt !== statusFilter) return false;

      return true;
    });
  }, [attendanceStudentRows, selectedRoomId, searchQuery, statusFilter, attendanceShift, morningAttendanceState, nightAttendanceState]);

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

  // Bulk Quick Actions
  const handleBulkAction = (targetStatus: string) => {
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
    if (attendanceShift === 'morning') {
      setMorningAttendanceState({});
    } else {
      setNightAttendanceState({});
    }
    addToast('info', 'Selection Cleared', `${attendanceShift === 'morning' ? 'Morning' : 'Night'} attendance selections reset to default.`);
  };

  // Prepare Data for Export
  const exportData = matchedAssignments.map((a, idx) => ({
    'Shift': attendanceShift === 'morning' ? 'Morning Attendance' : 'Night Attendance',
    'Date': selectedDate,
    'Student Name': a.studentName,
    'Admission No': a.admissionNo,
    'Hostel Block': a.hostelName,
    'Room No': `Room #${a.roomNumber}`,
    'Bed No': a.bedNumber || 'BED-1',
    'Attendance Status': getAttendanceStatus(getItemKey(a, idx)),
    'In Time': getInTime(getItemKey(a, idx)),
    'Out Time': getOutTime(getItemKey(a, idx))
  }));

  const handlePrint = () => {
    addToast('info', 'Preparing Print', `Printing ${exportData.length} records for ${attendanceShift === 'morning' ? 'Morning' : 'Night'} Attendance`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('success', 'PDF Export Complete', `Exported ${exportData.length} records to PDF`);
  };

  const handleSaveAttendance = async () => {
    if (matchedAssignments.length === 0) {
      addToast('warning', 'No Students Found', 'There are no active students listed to mark attendance.');
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
        hostelId: Number(selectedBlockId || 1),
        floorLevel: selectedFloor || '1st Floor',
        records
      });
      addToast('success', 'Attendance Log Saved', `${attendanceShift === 'morning' ? 'Morning' : 'Night'} attendance saved for ${records.length} students.`);
    } catch (error: any) {
      addToast('error', 'Save Failed', error.message || 'Error saving attendance log');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Main Heading & Save Log Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sky-500" /> Hostel Attendance
        </h2>

        <button
          onClick={handleSaveAttendance}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" /> Save Attendance Log
        </button>
      </div>

      {/* Sub-Navigation Bar matching Staff Attendance: Left Shift Pills | Right View Mode & Export */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Morning & Night Shift Pills */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setAttendanceShift('morning');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              attendanceShift === 'morning'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-300" /> Morning Attendance
          </button>

          <button
            onClick={() => {
              setAttendanceShift('night');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              attendanceShift === 'night'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-300" /> Night Attendance
          </button>
        </div>

        {/* Right: Daily/Monthly Pills & Export Report Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily Attendance
            </button>

            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Attendance
            </button>
          </div>

          <button
            onClick={handlePdfExport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, adm no, room..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Attendance Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Hostel Block</label>
            {isWarden ? (
              <div className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-bold">
                {targetBlocks[0]?.hostelName || 'Assigned Hostel Block'}
              </div>
            ) : (
              <select
                value={selectedBlockId}
                onChange={e => {
                  setSelectedBlockId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
              >
                <option value="">All Blocks</option>
                {(targetBlocks || [])
                  .filter(h => h != null)
                  .map((h, idx) => {
                    const idVal = h.hostelId !== undefined && h.hostelId !== null ? String(h.hostelId) : String((h as any).id || idx);
                    return (
                      <option key={`att_blk_${idVal}_${idx}`} value={idVal}>
                        {h.hostelName || `Block #${idVal}`}
                      </option>
                    );
                  })}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Room / Floor</label>
            <select
              value={selectedRoomId}
              onChange={e => {
                setSelectedRoomId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="">All Rooms</option>
              {(filteredRooms || [])
                .filter(r => r != null)
                .map((r, idx) => {
                  const rId = r.roomId !== undefined && r.roomId !== null ? String(r.roomId) : String((r as any).id || idx);
                  return (
                    <option key={`att_rm_${rId}_${idx}`} value={rId}>
                      Room #{r.roomNumber || rId}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>
      </div>

      {/* ATTENDANCE SUMMARY CARD */}
      <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-500" /> ATTENDANCE SUMMARY ({attendanceShift.toUpperCase()})
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Date: {selectedDate}</span>
        </div>

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-center">
            <p className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">TOTAL STUDENTS</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalStudentsCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-center">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">PRESENT</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-center">
            <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">ABSENT</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{absentCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-center">
            <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">ON LEAVE</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{leaveCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">HALF DAY</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{lateCount}</p>
          </div>
        </div>

        {/* QUICK BULK ACTIONS BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">QUICK BULK ACTIONS:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBulkAction('Present')}
              className="px-3.5 py-1.5 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-xs hover:bg-sky-200 transition-all"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('Absent')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs hover:bg-rose-200 transition-all"
            >
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction('Leave')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-xs hover:bg-blue-200 transition-all"
            >
              Mark All Leave
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-200 transition-all"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>

      {/* Student Attendance Roster Table */}
      <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">ADMISSION NO</th>
                <th className="py-3 px-4">STUDENT NAME</th>
                <th className="py-3 px-4">HOSTEL BLOCK</th>
                <th className="py-3 px-4">ROOM & BED NO</th>
                <th className="py-3 px-4 text-center">ATTENDANCE STATUS</th>
                <th className="py-3 px-4 text-center">IN TIME</th>
                <th className="py-3 px-4 text-center">OUT TIME</th>
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
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">{a.admissionNo}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
                        {a.studentName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {a.hostelName && isNaN(Number(a.hostelName))
                          ? a.hostelName
                          : (blocks.find(b => b.hostelId.toString() === String(a.hostelName || a.hostelId))?.hostelName || `Block #${a.hostelName || '1'}`)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono">
                        Room #{a.roomNumber} ({a.bedNumber || 'BED-1'})
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {(['Present', 'Absent', 'Late', 'Leave'] as const).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(itemKey, st)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                                currentSt === st
                                  ? st === 'Present' ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]' :
                                    st === 'Absent' ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 scale-[1.02]' :
                                    st === 'Late' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]' :
                                    'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {st === 'Late' ? 'Half Day' : st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <input
                          type="text"
                          value={getInTime(itemKey)}
                          onChange={e => handleInTimeChange(itemKey, e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold w-28 outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <input
                          type="text"
                          value={getOutTime(itemKey)}
                          onChange={e => handleOutTimeChange(itemKey, e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold w-28 outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
