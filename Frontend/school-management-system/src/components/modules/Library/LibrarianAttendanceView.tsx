// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CalendarCheck, CheckCircle2, XCircle, Clock, Plus, Users, User, ShieldAlert, Search, Printer, Download, Sparkles } from 'lucide-react';
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
  const { staff, attendance = [], leaveApplications = [], addLeaveApplication } = useData();
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

  const todayStr = new Date().toISOString().split('T')[0];

  const matchedStaff = (staff || []).find(s => 
    (user?.email && s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
    (user?.empId && (String(s.empId || '').trim() === String(user.empId).trim() || String(s.id || '').trim() === String(user.empId).trim())) ||
    (user?.name && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase().includes(user.name.toLowerCase().trim())) ||
    (s.designation || '').toLowerCase().includes('librarian')
  );

  const currentStaffName = user?.name || (matchedStaff ? `${matchedStaff.firstName || ''} ${matchedStaff.lastName || ''}`.trim() : 'Jammi Naidu');
  const currentStaffId = user?.empId || matchedStaff?.empId || matchedStaff?.id || 'NTS-2026-805';

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        const res: any = await LibraryAPI.fetchLibrarianAttendanceApi(attendanceViewMode, selectedAttendanceDate, selectedAttendanceMonth);
        if (res?.success && Array.isArray(res.data)) {
          const mapped: LibrarianAttendanceRecord[] = res.data.map((item: any) => ({
            id: String(item.id || item.attendanceId || `ATT-LIB-${item.attendanceId}`),
            staffId: item.staffId || item.employeeCode || currentStaffId,
            staffName: item.staffName || item.librarian || currentStaffName,
            role: item.role || 'Librarian',
            date: String(item.date || todayStr).split('T')[0],
            checkInTime: item.checkInTime || item.checkIn,
            checkOutTime: (item.checkOutTime || item.checkOut || '').replace('Active Shift', ''),
            workingHours: item.workingHours || item.hours,
            shift: item.shift || item.shiftDetails || 'Morning Shift (08:30 - 17:00)',
            status: item.status || 'Present',
            remarks: item.remarks || item.dutyRemarks || ''
          }));

          // Merge backend API data with local state so local check-in records are NEVER overwritten or wiped out
          setLibrarianAttendance(prev => {
            const map = new Map<string, LibrarianAttendanceRecord>();
            (prev || []).forEach(r => {
              const rDate = String(r.date || '').split('T')[0];
              const key = `${rDate}_${r.staffId || r.staffName}`;
              map.set(key, { ...r, date: rDate });
            });
            mapped.forEach(r => {
              const rDate = String(r.date || '').split('T')[0];
              const key = `${rDate}_${r.staffId || r.staffName}`;
              if (!map.has(key)) {
                map.set(key, { ...r, date: rDate });
              } else {
                const existing = map.get(key)!;
                map.set(key, {
                  ...existing,
                  ...r,
                  date: rDate,
                  checkInTime: existing.checkInTime || r.checkInTime,
                  checkOutTime: existing.checkOutTime || r.checkOutTime
                });
              }
            });
            const merged = Array.from(map.values());
            localStorage.setItem(LIBRARIAN_ATTENDANCE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn("Librarian attendance API load notice:", err);
      }
    };
    loadAttendanceData();
  }, [attendanceViewMode, selectedAttendanceDate, selectedAttendanceMonth, currentStaffId, currentStaffName, todayStr]);

  // Listen for external attendance updates
  useEffect(() => {
    const handleUpdate = () => {
      const s = localStorage.getItem(LIBRARIAN_ATTENDANCE_KEY);
      if (s) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) setLibrarianAttendance(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener('librarian_attendance_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('librarian_attendance_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Leave applications submitted by / for Librarian
  const myLeaveApplications = useMemo(() => {
    return (leaveApplications || []).filter(app => {
      const isLibRole = (app.role || '').toLowerCase().includes('librarian') || (app.department || '').toLowerCase().includes('library');
      const isIdMatch = (app.employeeId && (String(app.employeeId) === String(currentStaffId) || String(app.employeeId) === 'EMP-LIB-01')) ||
                        ((app as any).empId && (String((app as any).empId) === String(currentStaffId) || String((app as any).empId) === 'EMP-LIB-01'));
      const isNameMatch = app.employeeName && (user?.name ? app.employeeName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]) : true);
      return isLibRole || isIdMatch || isNameMatch;
    }).sort((a, b) => new Date(b.startDate || b.appliedOn || 0).getTime() - new Date(a.startDate || a.appliedOn || 0).getTime());
  }, [leaveApplications, currentStaffId, user?.name]);

  // Combined records from DataContext attendance, localStorage & local librarian attendance & approved leave
  const allLibrarianAttendance = useMemo(() => {
    const map = new Map<string, LibrarianAttendanceRecord>();

    // Helper function to process any list of daily attendance objects
    const processDailyRecords = (list: any[]) => {
      (list || []).forEach((r: any) => {
        const isStaff = !r.entityType || String(r.entityType).toLowerCase() === 'staff';
        const rDate = String(r.date || '').split('T')[0];
        if (!isStaff || !rDate) return;

        const sMatch = matchedStaff && (
          String(r.entityId) === String(matchedStaff.id) ||
          String(r.entityId) === String(matchedStaff.empId) ||
          String(r.staffId) === String(matchedStaff.id) ||
          String(r.staffId) === String(matchedStaff.empId) ||
          String(r.entityId) === String(currentStaffId) ||
          String(r.staffId) === String(currentStaffId)
        );
        const isNameMatch = currentStaffName && String(r.employeeName || r.name || r.staffName || '').toLowerCase().trim().includes(currentStaffName.toLowerCase().trim().split(' ')[0]);
        const isDesignationMatch = String(r.designation || '').toLowerCase().includes('librarian');
        const isDeptMatch = String(r.department || '').toLowerCase().includes('library') || String(r.department || '').toLowerCase().includes('librarian');
        const isRoleMatch = String(r.role || '').toLowerCase().includes('librarian');
        const isRemarksMatch = String(r.remarks || '').toLowerCase().includes('librarian');
        const isLibrarianMatch = isDesignationMatch || isDeptMatch || isRoleMatch || isRemarksMatch;

        if (sMatch || isNameMatch || isLibrarianMatch) {
          const key = rDate;
          if (!map.has(key)) {
            map.set(key, {
              id: String(r.id || `ATT-ADMIN-${rDate}`),
              staffId: String(r.staffId || r.entityId || matchedStaff?.empId || matchedStaff?.id || currentStaffId),
              staffName: String(r.employeeName || r.name || r.staffName || currentStaffName),
              role: 'Librarian',
              date: rDate,
              checkInTime: r.checkInTime || r.inTime || r.timeIn || r.time || (r.status === 'Present' || r.status === 'Late' ? '08:30 AM' : '--'),
              checkOutTime: r.checkOutTime || r.outTime || r.timeOut || (r.status === 'Present' || r.status === 'Late' ? '05:00 PM' : undefined),
              workingHours: r.workingHours || (r.checkInTime && r.checkOutTime ? calculateWorkedHours(r.checkInTime, r.checkOutTime) : '8 Hours'),
              shift: r.shift || 'Morning Shift (08:30 - 17:00)',
              status: (r.status as any) || 'Present',
              remarks: r.remarks || 'Recorded via Admin Staff Attendance'
            });
          }
        }
      });
    };

    // 1. Add records from DataContext attendance (which Admin Staff Attendance updates)
    processDailyRecords(attendance);

    // 2. Add records from localStorage keys edu_db_attendance and attendance
    if (typeof window !== 'undefined') {
      try {
        const storedAtt = localStorage.getItem('edu_db_attendance') || localStorage.getItem('attendance');
        if (storedAtt) {
          processDailyRecords(JSON.parse(storedAtt));
        }
      } catch (e) {}
    }

    // 3. Add/Override with local librarian attendance (punches from Librarian login)
    (librarianAttendance || []).forEach((r) => {
      const rDate = String(r.date || '').split('T')[0];
      const key = rDate;
      map.set(key, {
        ...r,
        date: rDate
      });
    });

    // 4. Add approved leave applications
    myLeaveApplications.forEach(app => {
      if (app.status === 'Approved' && app.startDate) {
        const leaveDate = String(app.startDate).split('T')[0];
        const key = leaveDate;
        if (!map.has(key)) {
          map.set(key, {
            id: `ATT-LIB-LV-${app.id || Date.now()}`,
            staffId: app.employeeId || (app as any).empId || currentStaffId || 'EMP-LIB-01',
            staffName: app.employeeName || currentStaffName || 'Jammi Naidu',
            role: 'Librarian',
            date: leaveDate,
            checkInTime: '--',
            checkOutTime: '--',
            workingHours: '0 Hours',
            shift: 'Morning Shift (08:30 - 17:00)',
            status: 'On Leave',
            remarks: `Approved Leave [${app.leaveType}]: ${app.reason || 'Approved by Admin'}`
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, librarianAttendance, myLeaveApplications, matchedStaff, currentStaffId, currentStaffName]);

  const todayRecord = allLibrarianAttendance.find(r => 
    String(r.date || '').split('T')[0] === todayStr &&
    (String(r.staffId || '').trim() === String(currentStaffId).trim() || String(r.staffName || '').toLowerCase().includes(currentStaffName.toLowerCase().trim()))
  );

  const filteredAttendance = allLibrarianAttendance.filter(r => {
    const recDate = String(r.date || '').split('T')[0];
    const targetDate = String(selectedAttendanceDate || todayStr).split('T')[0];
    if (attendanceViewMode === 'daily') {
      return recDate === targetDate;
    } else if (attendanceViewMode === 'weekly') {
      const d1 = new Date(recDate);
      const d2 = new Date(targetDate);
      const diffDays = Math.abs((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 7;
    } else {
      return recDate.startsWith(selectedAttendanceMonth);
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
                  saveLibrarianAttendance([newRec, ...librarianAttendance.filter(r => r.date !== todayStr || (r.staffId !== currentStaffId && r.staffName !== currentStaffName))]);

                  // Sync to DataContext Daily Attendance so Admin Staff Attendance receives the record
                  if (typeof markAttendance === 'function') {
                    try {
                      const staffEntityId = matchedStaff?.id || matchedStaff?.empId || currentStaffId;
                      await markAttendance([
                        {
                          id: `ATT-STF-${Date.now()}`,
                          entityId: staffEntityId,
                          entityType: 'Staff',
                          date: todayStr,
                          status: isLate ? 'Late' : 'Present',
                          inTime: timeStr,
                          department: matchedStaff?.department || 'Library',
                          remarks: isLate ? 'Late arrival check-in' : 'On-time shift arrival'
                        }
                      ]);
                    } catch (err) {
                      console.warn("DataContext markAttendance sync notice:", err);
                    }
                  }

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

                  // Sync check-out to DataContext Daily Attendance
                  if (typeof markAttendance === 'function') {
                    try {
                      const staffEntityId = matchedStaff?.id || matchedStaff?.empId || currentStaffId;
                      await markAttendance([
                        {
                          id: `ATT-STF-${Date.now()}`,
                          entityId: staffEntityId,
                          entityType: 'Staff',
                          date: todayStr,
                          status: todayRecord.status as any,
                          inTime: todayRecord.checkInTime || '',
                          outTime: timeStr,
                          department: matchedStaff?.department || 'Library',
                          remarks: updatedRemarks
                        }
                      ]);
                    } catch (err) {}
                  }

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
            <>
              <button
                onClick={() => {
                  setModalData({
                    staffId: currentStaffId,
                    staffName: currentStaffName,
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
              <button
                onClick={() => {
                  setModalData({
                    staffId: currentStaffId,
                    staffName: currentStaffName,
                    date: todayStr,
                    startDate: todayStr,
                    endDate: todayStr,
                    leaveType: 'Casual Leave',
                    shift: 'Morning Shift (08:30 - 17:00)',
                    status: 'On Leave',
                    remarks: ''
                  });
                  setModalType('applyLeave');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all"
              >
                <CalendarCheck className="w-4 h-4" /> Apply Leave
              </button>
            </>
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

      {/* My Leave Applications & Approval Tracker */}
      <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" /> My Leave Applications & Approval Status
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Track real-time leave requests submitted for Admin approval.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px] text-slate-700 dark:text-slate-300">
            Total Requests: {myLeaveApplications.length}
          </span>
        </div>

        {myLeaveApplications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-medium bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed">
            No leave requests submitted yet. Use the <span className="font-bold text-rose-600">"+ Apply Leave"</span> button above to apply.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b">
                <tr>
                  <th className="py-3 px-3">APPLIED DATE</th>
                  <th className="py-3 px-3">LEAVE DATES</th>
                  <th className="py-3 px-3">LEAVE TYPE</th>
                  <th className="py-3 px-3">REASON</th>
                  <th className="py-3 px-3 text-center">APPROVAL STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myLeaveApplications.map((app: any) => (
                  <tr key={app.id || Math.random()} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {app.appliedOn || app.startDate}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-slate-900 dark:text-white">
                      {app.startDate} {app.endDate && app.endDate !== app.startDate ? `to ${app.endDate}` : ''}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                      {app.leaveType}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                      {app.reason || 'Leave requested'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                        app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                        app.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}>
                        {app.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {app.status === 'Rejected' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                        {(!app.status || app.status === 'Pending') && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                        {app.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Apply Leave Modal */}
      {modalType === 'applyLeave' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-rose-500" /> Apply Leave
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const leaveDate = modalData?.date || modalData?.startDate || new Date().toISOString().split('T')[0];
              const leaveType = modalData?.leaveType || 'Casual Leave';
              const userReason = modalData?.remarks || 'Applied for leave';
              
              // 1. Submit leave application to global DataContext state for Admin review & approval
              const leaveApp: any = {
                id: `LV-LIB-${Date.now()}`,
                employeeId: modalData?.staffId || currentStaffId || 'EMP-LIB-01',
                empId: modalData?.staffId || currentStaffId || 'EMP-LIB-01',
                employeeName: modalData?.staffName || currentStaffName || 'Jammi Naidu',
                applicantName: modalData?.staffName || currentStaffName || 'Jammi Naidu',
                role: 'Librarian',
                department: 'Library',
                leaveType: leaveType,
                startDate: leaveDate,
                endDate: leaveDate,
                reason: userReason,
                status: 'Pending',
                appliedOn: new Date().toISOString().split('T')[0]
              };

              if (addLeaveApplication) {
                try {
                  addLeaveApplication(leaveApp);
                } catch (err) {
                  console.warn('addLeaveApplication error:', err);
                }
              }

              // 2. Log locally in API/storage
              const newRec: LibrarianAttendanceRecord = {
                id: `ATT-LIB-LV-${Date.now()}`,
                staffId: modalData?.staffId || currentStaffId || 'EMP-LIB-01',
                staffName: modalData?.staffName || currentStaffName || 'Jammi Naidu',
                role: 'Librarian',
                date: leaveDate,
                checkInTime: '--',
                checkOutTime: '--',
                workingHours: '0 Hours',
                shift: modalData?.shift || 'Morning Shift (08:30 - 17:00)',
                status: 'On Leave',
                remarks: `Pending Admin Approval [${leaveType}]: ${userReason}`
              };
              try { await LibraryAPI.logLibrarianAttendanceApi(newRec); } catch (err) {}
              saveLibrarianAttendance([newRec, ...librarianAttendance]);
              addToast('success', 'Leave Application Sent to Admin', `Leave request for ${newRec.staffName} on ${leaveDate} submitted for Admin approval.`);
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
                        staffName: sObj ? `${sObj.firstName} ${sObj.lastName}` : (user?.name || 'Jammi Naidu')
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="EMP-LIB-01">Jammi Naidu / Bhanu Prakash (Librarian)</option>
                    <option value="EMP-LIB-02">Rachel Green (Assistant Librarian)</option>
                    <option value="EMP-LIB-03">Sarah Jenkins (Library Attendant)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Leave Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={modalData?.leaveType}
                    onChange={e => setModalData({ ...modalData, leaveType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="Casual Leave">Casual Leave (CL)</option>
                    <option value="Sick Leave">Sick Leave (SL)</option>
                    <option value="Earned Leave">Earned Leave (EL)</option>
                    <option value="Duty Leave">Duty Leave (DL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Leave Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="date"
                    value={modalData?.date || modalData?.startDate}
                    onChange={e => setModalData({ ...modalData, date: e.target.value, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Shift</label>
                  <input
                    type="text"
                    disabled
                    value={modalData?.shift || 'Morning Shift (08:30 - 05:00)'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border font-medium text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Reason / Remarks <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the reason for leave..."
                  value={modalData?.remarks}
                  onChange={e => setModalData({ ...modalData, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer shadow-md">
                  Submit Leave Request
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
