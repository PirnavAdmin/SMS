// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, Clock, Plus, Users, User, ShieldAlert, Search, Printer, Download, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Pagination } from '../../common/Pagination';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';
import * as LibraryAPI from '../../../api/library';

import { exportToExcel } from '../../../utils/excelExport';

export interface LibrarianAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: string;
  shift: string;
  status: 'Present' | 'Late' | 'Absent' | 'Half Day' | 'On Leave';
  remarks?: string;
}

export const calculateWorkedHours = (checkInTime?: string, checkOutTime?: string): string => {
  if (!checkInTime || !checkOutTime) return '--';
  
  const parseTime = (timeStr: string): number | null => {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const startMins = parseTime(checkInTime);
  const endMins = parseTime(checkOutTime);

  if (startMins === null || endMins === null || endMins < startMins) return '--';

  const diffMins = endMins - startMins;
  if (diffMins === 0) return '0 Mins';

  if (diffMins < 60) {
    return `${diffMins} Mins (${(diffMins / 60).toFixed(1)} Hours)`;
  }

  const decimalHrs = (diffMins / 60).toFixed(1);
  return `${decimalHrs} Hours`;
};

export const LIBRARIAN_ATTENDANCE_KEY = 'edu_db_librarian_attendance';

export const DEFAULT_LIBRARIAN_ATTENDANCE: LibrarianAttendanceRecord[] = [];

export const LibrarianAttendanceView: React.FC = () => {
  const { user, role } = useAuth();
  const { staff } = useData();
  const { addToast } = useToast();

  const isLibrarian = (role || '').toLowerCase().includes('librarian');
  const canManageAttendance = isLibrarian;
  const isReadOnlyAccess = !canManageAttendance;

  const [librarianAttendance, setLibrarianAttendance] = useState<LibrarianAttendanceRecord[]>(() => {
    const s = localStorage.getItem(LIBRARIAN_ATTENDANCE_KEY);
    if (!s) return [];
    try {
      const parsed: LibrarianAttendanceRecord[] = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState<string>('2026-08');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  const saveLibrarianAttendance = (data: LibrarianAttendanceRecord[]) => {
    setLibrarianAttendance(data);
    localStorage.setItem(LIBRARIAN_ATTENDANCE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('librarian_attendance_updated'));
    }
  };

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        const res: any = await LibraryAPI.fetchLibrarianAttendanceApi(attendanceViewMode, selectedAttendanceDate, selectedAttendanceMonth);
        if (res?.success && Array.isArray(res.data)) {
          const mapped: LibrarianAttendanceRecord[] = res.data.map((item: any) => ({
            id: String(item.id || item.attendanceId || `ATT-LIB-${item.attendanceId}`),
            staffId: item.staffId || item.employeeCode || 'EMP-LIB-01',
            staffName: item.staffName || item.librarian || 'Bhanu Prakash',
            role: item.role || 'Librarian',
            date: item.date,
            checkInTime: item.checkInTime || item.checkIn,
            checkOutTime: (item.checkOutTime || item.checkOut || '').replace('Active Shift', ''),
            workingHours: item.workingHours || item.hours,
            shift: item.shift || item.shiftDetails || 'Morning Shift (08:30 - 17:00)',
            status: item.status || 'Present',
            remarks: item.remarks || item.dutyRemarks || ''
          }));

          saveLibrarianAttendance(mapped);
        }
      } catch (err) {
        console.warn("Librarian attendance API load notice:", err);
      }
    };
    loadAttendanceData();
  }, [attendanceViewMode, selectedAttendanceDate, selectedAttendanceMonth]);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentStaffName = user?.name || 'Bhanu Prakash';
  const currentStaffId = user?.empId || 'EMP-LIB-01';
  const todayRecord = librarianAttendance.find(r => r.date === todayStr && r.staffId === currentStaffId);

  const filteredAttendance = librarianAttendance.filter(r => {
    if (attendanceViewMode === 'daily') {
      return r.date === selectedAttendanceDate;
    } else if (attendanceViewMode === 'weekly') {
      const rDate = new Date(r.date);
      const selDate = new Date(selectedAttendanceDate);
      const diffDays = Math.abs((selDate.getTime() - rDate.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 7;
    } else {
      return r.date.startsWith(selectedAttendanceMonth);
    }
  });

  const totalPresent = filteredAttendance.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const totalLate = filteredAttendance.filter(r => r.status === 'Late').length;
  const totalOnLeave = filteredAttendance.filter(r => r.status === 'On Leave').length;

  const handleExportLog = () => {
    if (filteredAttendance.length === 0) {
      addToast('warning', 'No Data Available', 'No attendance records match the selected filter to export.');
      return;
    }

    const headers = ['Date', 'Staff ID', 'Staff Name', 'Role', 'Shift', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Duty Remarks'];
    const excelRows = [
      headers,
      ...filteredAttendance.map(r => {
        const hrs = r.checkInTime && r.checkOutTime ? calculateWorkedHours(r.checkInTime, r.checkOutTime) : (r.workingHours || '--');
        return [
          r.date,
          r.staffId,
          r.staffName,
          r.role,
          r.shift,
          r.checkInTime || '--',
          r.checkOutTime || 'Active Shift',
          hrs,
          r.status,
          r.remarks || 'Routine Shift'
        ];
      })
    ];

    const fileName = `librarian_attendance_${attendanceViewMode}_${selectedAttendanceDate}`;
    try {
      exportToExcel(excelRows, fileName, 'Librarian Attendance');
      addToast('success', 'Report Exported', `Exported ${filteredAttendance.length} filtered attendance records to Excel.`);
    } catch (err: any) {
      console.error("Export error:", err);
      addToast('error', 'Export Failed', err.message || 'Failed to export report.');
    }
  };

  const handlePrint = () => {
    if (filteredAttendance.length === 0) {
      addToast('warning', 'No Data Available', 'No attendance records match the selected filter to print.');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/80 dark:border-sky-800 shadow-xs flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Librarian Attendance</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReadOnlyAccess && (
            <span className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> View-Only Mode (Main Admin)
            </span>
          )}
          <button onClick={handlePrint} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleExportLog} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
            <Download className="w-4 h-4" /> Export Log
          </button>
        </div>
      </div>

      {/* Daily Shift Punch Control Banner - Shown ONLY in Librarian Panel */}
      {!isReadOnlyAccess && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold tracking-wider uppercase border border-sky-200 dark:border-sky-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Daily Attendance Desk
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{currentStaffName} ({role || 'Librarian'})</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Today: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{todayStr}</span> • Shift: <span className="font-semibold text-slate-700 dark:text-slate-300">Morning Shift (08:30 AM - 05:00 PM)</span>
            </p>
            {todayRecord && (
              <div className="flex items-center gap-3 pt-1 text-xs justify-center md:justify-start">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Checked In: {todayRecord.checkInTime}
                </span>
                {todayRecord.checkOutTime && (
                  <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Checked Out: {todayRecord.checkOutTime}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {!todayRecord ? (
              <button
                onClick={async () => {
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isLate = now.getHours() >= 9 && now.getMinutes() > 0;
                  const newRec: LibrarianAttendanceRecord = {
                    id: `ATT-LIB-${Date.now()}`,
                    staffId: currentStaffId,
                    staffName: currentStaffName,
                    role: role || 'Librarian',
                    date: todayStr,
                    checkInTime: timeStr,
                    shift: 'Morning Shift (08:30 - 17:00)',
                    status: isLate ? 'Late' : 'Present',
                    remarks: isLate ? 'Late arrival check-in' : 'On-time shift arrival'
                  };
                  try {
                    const res: any = await LibraryAPI.logLibrarianAttendanceApi(newRec);
                    if (res?.success && res?.data) {
                      newRec.id = String(res.data.id || `ATT-LIB-${res.data.attendanceId}`);
                    }
                  } catch (e) {
                    console.warn("Check-in API notice:", e);
                  }
                  localStorage.setItem('teacher_check_in_time', now.toISOString());
                  saveLibrarianAttendance([newRec, ...librarianAttendance]);
                  addToast('success', 'Checked In', `Successfully checked in at ${timeStr}`);
                }}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Check In Now
              </button>
            ) : !todayRecord.checkOutTime ? (
              <button
                onClick={async () => {
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const calcHours = calculateWorkedHours(todayRecord.checkInTime, timeStr);
                  const updatedRemarks = (todayRecord.remarks || '') + ` • Checked out at ${timeStr}`;
                  const updatedRec = {
                    ...todayRecord,
                    checkOutTime: timeStr,
                    workingHours: calcHours,
                    remarks: updatedRemarks
                  };

                  const updatedList = librarianAttendance.map(r => r.id === todayRecord.id ? updatedRec : r);
                  saveLibrarianAttendance(updatedList);
                  addToast('success', 'Checked Out', `Successfully checked out at ${timeStr}`);

                  try {
                    await LibraryAPI.updateLibrarianAttendanceApi(todayRecord.id, {
                      date: todayRecord.date,
                      staffId: todayRecord.staffId,
                      staffName: todayRecord.staffName,
                      checkInTime: todayRecord.checkInTime,
                      checkOutTime: timeStr,
                      status: todayRecord.status,
                      remarks: updatedRemarks,
                      dutyRemarks: updatedRemarks,
                      workingHours: calcHours
                    });
                  } catch (e) {
                    console.warn("Check-out API notice:", e);
                  }
                }}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" /> Check Out Shift
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Shift Completed ({calculateWorkedHours(todayRecord.checkInTime, todayRecord.checkOutTime)})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar & Summary Cards */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-3xl bg-white dark:bg-slate-900 border">
        {/* Daily, Weekly, Monthly Filter Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border flex items-center gap-1">
            {(['daily', 'weekly', 'monthly'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAttendanceViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  attendanceViewMode === mode
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {attendanceViewMode === 'daily' && (
            <input
              type="date"
              value={selectedAttendanceDate}
              onChange={e => setSelectedAttendanceDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
            />
          )}

          {attendanceViewMode === 'monthly' && (
            <input
              type="month"
              value={selectedAttendanceMonth}
              onChange={e => setSelectedAttendanceMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {!isReadOnlyAccess && (
            <button
              onClick={() => {
                setModalData({
                  staffId: 'EMP-LIB-01',
                  staffName: 'Bhanu Prakash',
                  date: todayStr,
                  checkInTime: '',
                  checkOutTime: '',
                  workingHours: '',
                  shift: 'Morning Shift (08:30 - 17:00)',
                  status: 'Present',
                  remarks: ''
                });
                setModalType('addAttendance');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Mark Attendance
            </button>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs">
            Present: {totalPresent}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs">
            Late: {totalLate}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs">
            On Leave: {totalOnLeave}
          </span>
        </div>
      </div>

      {/* Librarian Master Attendance Log Sheet Table */}
      <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b">
              <tr>
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">LIBRARIAN / STAFF</th>
                <th className="py-3.5 px-4">SHIFT DETAILS</th>
                <th className="py-3.5 px-4 text-center">CHECK IN</th>
                <th className="py-3.5 px-4 text-center">CHECK OUT</th>
                <th className="py-3.5 px-4 text-center">HOURS</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">DUTY REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAttendance.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{r.date}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                    {r.staffName} <span className="font-mono text-[11px] font-normal text-slate-400">({r.staffId})</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">{r.shift}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-extrabold text-emerald-600">{r.checkInTime || '--'}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-extrabold text-amber-600">{r.checkOutTime || 'Active Shift'}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {r.checkInTime && r.checkOutTime ? calculateWorkedHours(r.checkInTime, r.checkOutTime) : (r.workingHours || '--')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                      r.status === 'Present' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      r.status === 'Late' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">{r.remarks || 'Routine Shift'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAttendance.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            label="attendance logs"
          />
        </div>
      </div>

      {/* Add Punch Entry Modal */}
      {modalType === 'addAttendance' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-sky-500" /> Mark Attendance
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const newRec: LibrarianAttendanceRecord = {
                id: `ATT-LIB-${Date.now()}`,
                staffId: modalData?.staffId || 'EMP-LIB-01',
                staffName: modalData?.staffName || 'Bhanu Prakash',
                role: 'Librarian',
                date: modalData?.date || new Date().toISOString().split('T')[0],
                checkInTime: modalData?.checkInTime || '',
                checkOutTime: modalData?.checkOutTime || '',
                workingHours: calculateWorkedHours(modalData?.checkInTime, modalData?.checkOutTime),
                shift: modalData?.shift || 'Morning Shift (08:30 - 17:00)',
                status: modalData?.status || 'Present',
                remarks: modalData?.remarks || 'Manual shift entry'
              };
              try { await LibraryAPI.logLibrarianAttendanceApi(newRec); } catch (err) {}
              saveLibrarianAttendance([newRec, ...librarianAttendance]);
              addToast('success', 'Attendance Recorded', `Recorded attendance punch for ${newRec.staffName}`);
              setModalType(null);
            }} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Staff Member <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={modalData?.staffId}
                    onChange={e => {
                      const selected = e.target.value;
                      const sObj = staff.find(st => st.id === selected || st.empId === selected);
                      setModalData({
                        ...modalData,
                        staffId: selected,
                        staffName: sObj ? `${sObj.firstName} ${sObj.lastName}` : 'Bhanu Prakash'
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="EMP-LIB-01">Bhanu Prakash (Librarian)</option>
                    <option value="EMP-LIB-02">Rachel Green (Assistant Librarian)</option>
                    <option value="EMP-LIB-03">Sarah Jenkins (Library Attendant)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="date"
                    value={modalData?.date}
                    onChange={e => setModalData({ ...modalData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Check In Time</label>
                  <input
                    type="text"
                    value={modalData?.checkInTime}
                    onChange={e => setModalData({ ...modalData, checkInTime: e.target.value })}
                    placeholder="e.g. 08:30 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Check Out Time</label>
                  <input
                    type="text"
                    value={modalData?.checkOutTime}
                    onChange={e => setModalData({ ...modalData, checkOutTime: e.target.value })}
                    placeholder="e.g. 05:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={modalData?.status}
                    onChange={e => setModalData({ ...modalData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Remarks</label>
                  <input
                    type="text"
                    value={modalData?.remarks}
                    onChange={e => setModalData({ ...modalData, remarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold cursor-pointer shadow-md">
                  Save Attendance Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Area for Filtered Librarian Attendance Logs */}
      <div id="printable-content" className="hidden print:block space-y-4 p-4">
        <SchoolPrintHeader
          title="Librarian Attendance Report"
          subtitle={`Filter View: ${attendanceViewMode.toUpperCase()} (${selectedAttendanceDate}) • Total Logs: ${filteredAttendance.length}`}
        />

        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 uppercase text-[10px] text-slate-700 font-extrabold border-b">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Librarian / Staff</th>
              <th className="p-2 border">Shift Details</th>
              <th className="p-2 border text-center">Check In</th>
              <th className="p-2 border text-center">Check Out</th>
              <th className="p-2 border text-center">Hours</th>
              <th className="p-2 border text-center">Status</th>
              <th className="p-2 border">Duty Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-2 border font-mono font-bold">{r.date}</td>
                <td className="p-2 border font-bold">{r.staffName} ({r.staffId})</td>
                <td className="p-2 border">{r.shift}</td>
                <td className="p-2 border text-center font-mono font-bold text-emerald-700">{r.checkInTime || '--'}</td>
                <td className="p-2 border text-center font-mono font-bold text-amber-700">{r.checkOutTime || 'Active Shift'}</td>
                <td className="p-2 border text-center font-mono">{r.checkInTime && r.checkOutTime ? calculateWorkedHours(r.checkInTime, r.checkOutTime) : (r.workingHours || '--')}</td>
                <td className="p-2 border text-center font-bold">{r.status}</td>
                <td className="p-2 border text-slate-600">{r.remarks || 'Routine Shift'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LibrarianAttendanceView;
