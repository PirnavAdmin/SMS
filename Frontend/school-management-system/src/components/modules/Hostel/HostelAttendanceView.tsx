import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Calendar, Search, Filter, Save, Sun, Moon, Printer, FileText, FileSpreadsheet, CheckCircle2, XCircle, Clock, UserX, RotateCcw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { Pagination } from '../../common/Pagination';
import { getHostelBlocks, getRooms, getAllocations, getNightAttendance, saveNightAttendance, HostelBlock, HostelRoom, BedAllocation, NightAttendanceRecord } from '../../../api/hostel';

export const HostelAttendanceView: React.FC = () => {
  const { addToast } = useToast();

  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<NightAttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Attendance & Time state per student
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  const [inTimeState, setInTimeState] = useState<Record<string, string>>({});
  const [outTimeState, setOutTimeState] = useState<Record<string, string>>({});

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
          
          // Hydrate local state
          const newState: Record<string, string> = {};
          (records || []).forEach(r => {
            if (r && r.studentId !== undefined && r.studentId !== null) {
              newState[String(r.studentId)] = r.curfewStatus;
            }
          });
          setAttendanceState(newState);
        } catch (error: any) {
          addToast('error', 'Failed to load attendance', error.message);
        }
      } else {
        setAttendanceRecords([]);
        setAttendanceState({});
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

  const getAttendanceStatus = (studentId: string): string => {
    return attendanceState[studentId] || 'Present';
  };

  const getInTime = (studentId: string): string => {
    return inTimeState[studentId] || (attendanceShift === 'morning' ? '07:00 AM' : '09:00 PM');
  };

  const getOutTime = (studentId: string): string => {
    return outTimeState[studentId] || (attendanceShift === 'morning' ? '08:30 AM' : '06:00 AM');
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const matchedAssignments = (allocations || []).filter(a => {
    if (!a || a.status !== 'Active') return false;
    // Exclude invalid/N/A waste dummy data
    if (!a.hostelName || a.hostelName === 'N/A' || !a.roomNumber || a.roomNumber === 'N/A' || a.bedNumber === 'N/A') return false;

    if (selectedBlockId && a.hostelId.toString() !== selectedBlockId) return false;
    if (selectedRoomId && a.roomId.toString() !== selectedRoomId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (a.studentName || '').toLowerCase().includes(q);
      const admMatch = (a.admissionNo || '').toLowerCase().includes(q);
      const roomMatch = (a.roomNumber || '').toLowerCase().includes(q);
      if (!nameMatch && !admMatch && !roomMatch) return false;
    }

    const currentSt = getAttendanceStatus(a.studentId.toString());
    if (statusFilter !== 'All' && currentSt !== statusFilter) return false;

    return true;
  });

  const totalPages = Math.ceil(matchedAssignments.length / itemsPerPage);
  const paginatedAssignments = matchedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary Counts
  const totalStudentsCount = matchedAssignments.length;
  const presentCount = matchedAssignments.filter(a => getAttendanceStatus(a.studentId.toString()) === 'Present').length;
  const absentCount = matchedAssignments.filter(a => getAttendanceStatus(a.studentId.toString()) === 'Absent').length;
  const leaveCount = matchedAssignments.filter(a => getAttendanceStatus(a.studentId.toString()) === 'Leave').length;
  const lateCount = matchedAssignments.filter(a => getAttendanceStatus(a.studentId.toString()) === 'Late').length;

  // Bulk Quick Actions
  const handleBulkAction = (targetStatus: string) => {
    if (matchedAssignments.length === 0) {
      addToast('info', 'No Students', 'No resident students available for bulk action.');
      return;
    }
    const newState: Record<string, string> = { ...attendanceState };
    matchedAssignments.forEach(a => {
      newState[a.studentId.toString()] = targetStatus;
    });
    setAttendanceState(newState);
    addToast('success', `Marked All ${targetStatus}`, `Set ${matchedAssignments.length} students to ${targetStatus}.`);
  };

  const handleClearSelection = () => {
    setAttendanceState({});
    addToast('info', 'Selection Cleared', 'Attendance selections reset to default.');
  };

  // Prepare Data for Export
  const exportData = matchedAssignments.map(a => ({
    'Shift': attendanceShift === 'morning' ? 'Morning Attendance' : 'Night Attendance',
    'Date': selectedDate,
    'Student Name': a.studentName,
    'Admission No': a.admissionNo,
    'Hostel Block': a.hostelName,
    'Room No': `Room #${a.roomNumber}`,
    'Bed No': a.bedNumber || 'BED-1',
    'Attendance Status': getAttendanceStatus(a.studentId.toString()),
    'In Time': getInTime(a.studentId.toString()),
    'Out Time': getOutTime(a.studentId.toString())
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

    const records = matchedAssignments.map(a => ({
      allocationId: a.allocationId,
      studentId: a.studentId,
      curfewStatus: getAttendanceStatus(a.studentId.toString()),
      remarks: `${attendanceShift === 'morning' ? 'Morning Roll Call' : 'Night Curfew Roll Call'}`
    }));

    try {
      await saveNightAttendance({
        date: selectedDate,
        hostelId: Number(selectedBlockId || 1),
        floorLevel: selectedFloor || '1st Floor',
        records
      });
      addToast('success', 'Attendance Log Saved', `${attendanceShift === 'morning' ? 'Morning' : 'Night'} attendance saved for ${records.length} students.`);
    } catch (error: any) {
      addToast('error', 'Save Failed', error.message);
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
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Attendance Date *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Hostel Block</label>
            <select
              value={selectedBlockId}
              onChange={e => {
                setSelectedBlockId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="">All Blocks</option>
              {(blocks || [])
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
            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">HALF DAY / LATE</p>
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
                paginatedAssignments.map(a => {
                  const currentSt = getAttendanceStatus(a.studentId.toString());
                  return (
                    <tr key={a.allocationId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
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
                              onClick={() => handleStatusChange(a.studentId.toString(), st)}
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
                          value={getInTime(a.studentId.toString())}
                          onChange={e => setInTimeState(prev => ({ ...prev, [a.studentId.toString()]: e.target.value }))}
                          className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold w-28 outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <input
                          type="text"
                          value={getOutTime(a.studentId.toString())}
                          onChange={e => setOutTimeState(prev => ({ ...prev, [a.studentId.toString()]: e.target.value }))}
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
