// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CalendarCheck, Calendar, Filter, User, AlertCircle, CheckCircle2,
  Clock, CalendarDays, Loader2, RefreshCw, FileSpreadsheet, Check
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { DailyAttendance } from '../../../types';
import { useParentWards, ParentStudentSelector } from '../../common/ParentStudentSelector';
import { fetchStudentAttendanceRegisterApi } from '../../../api/attendance';
import { checkSundayOrHoliday } from '../../../utils/dateValidation';
import { exportToExcel } from '../../../utils/excelExport';

export const ParentAttendanceView: React.FC = () => {
  const { studentAttendance = [], holidays = [] } = useData();
  const { role, user } = useAuth();
  const { addToast } = useToast?.() || {};
  const parentWards = useParentWards();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters state
  const currentDate = new Date();
  const [filterType, setFilterType] = useState<'Overall' | 'Month' | 'Day' | 'Custom'>('Month');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  
  const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(currentDate.toISOString().split('T')[0]);

  const [apiRecords, setApiRecords] = useState<any[]>([]);
  const [apiSummary, setApiSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // In-flight guard to completely prevent infinite request loops
  const isFetchingRef = useRef(false);

  const months = [
    { value: '0', label: 'January' }, { value: '1', label: 'February' },
    { value: '2', label: 'March' }, { value: '3', label: 'April' },
    { value: '4', label: 'May' }, { value: '5', label: 'June' },
    { value: '6', label: 'July' }, { value: '7', label: 'August' },
    { value: '8', label: 'September' }, { value: '9', label: 'October' },
    { value: '10', label: 'November' }, { value: '11', label: 'December' }
  ];

  const currentYear = currentDate.getFullYear();
  const years = [
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString()
  ];

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];
  const displayWards = useMemo(() => {
    return parentWards && parentWards.length > 0 ? parentWards : [];
  }, [parentWards]);

  // Helper to format class name without duplicate 'Class'
  const formatClassName = useCallback((className?: string) => {
    if (!className) return '';
    const clean = className.trim();
    return clean.toLowerCase().startsWith('class') ? clean : `Class ${clean}`;
  }, []);

  // Helper to match a record against the current ward
  const isChildMatch = useCallback((rec: any) => {
    if (!currentWard || !rec) return false;
    const wardId = String(currentWard.studentId ?? currentWard.id ?? '').trim().toLowerCase();
    const wardAdm = String(currentWard.admissionNo || '').trim().toLowerCase();
    const wardRoll = String(currentWard.rollNo || '').trim().toLowerCase();
    const wardName = String(currentWard.studentName || `${currentWard.firstName || ''} ${currentWard.lastName || ''}`).trim().toLowerCase();

    const recId = String(rec.studentId ?? rec.entityId ?? rec.id ?? '').trim().toLowerCase();
    const recAdm = String(rec.admissionNo || '').trim().toLowerCase();
    const recRoll = String(rec.rollNo || '').trim().toLowerCase();
    const recName = String(rec.studentName || '').trim().toLowerCase();

    if (wardId && (recId === wardId || recAdm === wardId || recRoll === wardId)) return true;
    if (wardAdm && (recAdm === wardAdm || recId === wardAdm || recRoll === wardAdm)) return true;
    if (wardRoll && (recRoll === wardRoll || recId === wardRoll || recAdm === wardRoll)) return true;
    if (wardName && recName && (recName === wardName || recName.includes(wardName) || wardName.includes(recName))) return true;

    return false;
  }, [currentWard]);

  // Fetch dynamic attendance register from backend for the currently selected child and filters
  const loadDynamicAttendance = useCallback(async (force = false) => {
    if (!currentWard) return;
    if (isFetchingRef.current && !force) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const rawStudentId = currentWard.studentId ?? currentWard.id;
      const numStudentId = Number(rawStudentId);
      const validStudentId = !isNaN(numStudentId) && numStudentId > 0 ? numStudentId : undefined;

      const query: any = {
        filterType: filterType,
        statusFilter: statusFilter !== 'All' ? statusFilter : undefined
      };

      if (validStudentId) {
        query.studentId = validStudentId;
      }

      if (filterType === 'Month') {
        query.month = parseInt(selectedMonth, 10) + 1;
        query.year = parseInt(selectedYear, 10);
      } else if (filterType === 'Day') {
        query.date = selectedDate;
      } else if (filterType === 'Custom') {
        query.startDate = startDate;
        query.endDate = endDate;
      }

      const regRes: any = await fetchStudentAttendanceRegisterApi(query);
      const regData = regRes?.data || regRes;
      if (regData && Array.isArray(regData.records)) {
        setApiRecords(regData.records);
        setApiSummary(regData.summary || null);
      } else {
        setApiRecords([]);
        setApiSummary(null);
      }
    } catch (err) {
      console.warn('Failed to load dynamic student attendance register:', err);
      setApiRecords([]);
      setApiSummary(null);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    currentWard?.studentId,
    currentWard?.id,
    filterType,
    selectedMonth,
    selectedYear,
    selectedDate,
    startDate,
    endDate,
    statusFilter
  ]);

  useEffect(() => {
    loadDynamicAttendance();
  }, [loadDynamicAttendance]);

  // Listen for real-time attendance updates (debounced and guarded)
  useEffect(() => {
    let timeoutId: any;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isFetchingRef.current) {
          loadDynamicAttendance(true);
        }
      }, 1000);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('attendance_updated', handleUpdate);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('attendance_updated', handleUpdate);
    };
  }, [loadDynamicAttendance]);

  // Merge API register records with any real-time in-memory attendance from teacher submissions
  const wardAttendance = useMemo(() => {
    const dateMap = new Map<string, any>();

    // 1. Add records returned from the backend Register API
    (apiRecords || []).forEach(r => {
      const dKey = String(r.date || '').split('T')[0].trim();
      if (dKey) {
        dateMap.set(dKey, {
          id: r.id || `att_${dKey}`,
          date: dKey,
          status: r.status || 'Present',
          remarks: r.remarks || '',
          formattedDate: r.formattedDate,
          dayOfWeek: r.dayOfWeek
        });
      }
    });

    // 2. Add any real-time student attendance in DataContext matching this specific ward
    (studentAttendance || []).forEach(r => {
      if (!isChildMatch(r)) return;
      const rawDate = String(r.date || '').split('T')[0].trim();
      if (!rawDate) return;

      // Filter against selected criteria if filter is active
      let inScope = true;
      if (filterType === 'Month') {
        const parts = rawDate.split('-');
        if (parts.length === 3) {
          const recY = parts[0];
          const recM = String(parseInt(parts[1], 10) - 1);
          inScope = recY === selectedYear && recM === selectedMonth;
        }
      } else if (filterType === 'Day') {
        inScope = rawDate === selectedDate;
      } else if (filterType === 'Custom') {
        inScope = rawDate >= startDate && rawDate <= endDate;
      }

      if (inScope) {
        dateMap.set(rawDate, {
          id: r.id || `att_${rawDate}`,
          date: rawDate,
          status: r.status || 'Present',
          remarks: r.remarks || r.teacherNote || '',
          subject: r.subject || '',
          period: r.period || ''
        });
      }
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [apiRecords, studentAttendance, isChildMatch, filterType, selectedMonth, selectedYear, selectedDate, startDate, endDate]);

  const filteredRecords = useMemo(() => {
    return wardAttendance.filter(record => statusFilter === 'All' || record.status === statusFilter);
  }, [wardAttendance, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filterType, selectedMonth, selectedYear, selectedDate, startDate, endDate, selectedChildIdx]);

  // Construct dates for the Monthly / Custom grid register
  const matrixDates = useMemo(() => {
    const dates: string[] = [];
    if (filterType === 'Month') {
      const year = parseInt(selectedYear, 10);
      const month = parseInt(selectedMonth, 10); // 0-indexed
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(dStr);
      }
    } else if (filterType === 'Custom') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const curr = new Date(start);
        while (curr <= end && dates.length < 31) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
          curr.setDate(curr.getDate() + 1);
        }
      }
    }
    return dates;
  }, [filterType, selectedMonth, selectedYear, startDate, endDate]);

  // Helper to resolve student status for a given calendar date in matrix view
  const getStudentStatusForDate = useCallback((ward: any, dateStr: string) => {
    const holCheck = checkSundayOrHoliday(dateStr, holidays);

    const wId = String(ward.studentId ?? ward.id ?? '').trim().toLowerCase();
    const wAdm = String(ward.admissionNo || '').trim().toLowerCase();
    const wRoll = String(ward.rollNo || '').trim().toLowerCase();
    const wName = String(ward.studentName || `${ward.firstName || ''} ${ward.lastName || ''}`).trim().toLowerCase();

    let foundStatus: string | null = null;
    let foundRemarks: string = '';

    // Check currently loaded apiRecords (if it matches this ward)
    const currentWardId = String(currentWard?.studentId ?? currentWard?.id ?? '').trim().toLowerCase();
    if (wId && wId === currentWardId) {
      for (const r of apiRecords) {
        const rDate = String(r.date || '').split('T')[0].trim();
        if (rDate === dateStr) {
          foundStatus = r.status;
          foundRemarks = r.remarks || '';
          break;
        }
      }
    }

    // Check studentAttendance in DataContext
    if (!foundStatus) {
      for (const r of (studentAttendance || [])) {
        const rDate = String(r.date || '').split('T')[0].trim();
        if (rDate !== dateStr) continue;

        const rId = String(r.studentId ?? r.id ?? '').trim().toLowerCase();
        const rAdm = String(r.admissionNo || '').trim().toLowerCase();
        const rRoll = String(r.rollNo || '').trim().toLowerCase();
        const rName = String(r.studentName || `${r.firstName || ''} ${r.lastName || ''}`).trim().toLowerCase();

        const match = (wId && (rId === wId || rAdm === wId || rRoll === wId)) ||
                      (wAdm && (rAdm === wAdm || rId === wAdm || rRoll === wAdm)) ||
                      (wRoll && (rRoll === wRoll || rId === wRoll || rAdm === wRoll)) ||
                      (wName && rName && (rName === wName || rName.includes(wName) || wName.includes(rName)));

        if (match) {
          foundStatus = r.status;
          foundRemarks = r.remarks || r.teacherNote || '';
          break;
        }
      }
    }

    if (holCheck.isHoliday && (!foundStatus || foundStatus === 'Holiday')) {
      return {
        code: 'H',
        badgeStyle: 'text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold border border-purple-200/80 dark:border-purple-800/80',
        tooltip: holCheck.name ? `${dateStr} - ${holCheck.name}` : `${dateStr} - Sunday / School Holiday`
      };
    }

    if (!foundStatus) {
      return {
        code: '-',
        badgeStyle: 'text-slate-400 font-medium',
        tooltip: `${dateStr} - Unmarked`
      };
    }

    const norm = String(foundStatus).toLowerCase().replace(/[\s_-]/g, '');
    if (norm === 'present' || norm === 'p') {
      return {
        code: 'P',
        badgeStyle: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/40',
        tooltip: `${dateStr} - Present${foundRemarks ? ` (${foundRemarks})` : ''}`
      };
    }
    if (norm === 'absent' || norm === 'a') {
      return {
        code: 'A',
        badgeStyle: 'text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 font-black border border-rose-200/60 dark:border-rose-800/40',
        tooltip: `${dateStr} - Absent${foundRemarks ? ` (${foundRemarks})` : ''}`
      };
    }
    if (norm === 'halfday' || norm === 'hd') {
      return {
        code: 'HD',
        badgeStyle: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 font-bold border border-amber-200/60 dark:border-amber-800/40',
        tooltip: `${dateStr} - Half Day${foundRemarks ? ` (${foundRemarks})` : ''}`
      };
    }
    if (norm === 'late' || norm === 'l') {
      return {
        code: 'L',
        badgeStyle: 'text-orange-700 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-800/40',
        tooltip: `${dateStr} - Late${foundRemarks ? ` (${foundRemarks})` : ''}`
      };
    }
    if (norm === 'holiday' || norm === 'h') {
      return {
        code: 'H',
        badgeStyle: 'text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold border border-purple-200/80 dark:border-purple-800/80',
        tooltip: `${dateStr} - Holiday${foundRemarks ? ` (${foundRemarks})` : ''}`
      };
    }
    if (norm === 'leave' || norm === 'lv') {
      return {
        code: 'LV',
        badgeStyle: 'text-sky-700 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400 font-bold border border-sky-200/60 dark:border-sky-800/40',
        tooltip: `${dateStr} - Approved Leave${foundRemarks ? ` (${foundRemarks})` : ''}`
      };
    }

    return {
      code: foundStatus.slice(0, 2).toUpperCase(),
      badgeStyle: 'text-slate-600 bg-slate-100 font-bold',
      tooltip: `${dateStr} - ${foundStatus}`
    };
  }, [holidays, currentWard, apiRecords, studentAttendance]);

  // Excel exporter matching AttendanceView
  const handleExportCSV = () => {
    if (displayWards.length === 0) {
      if (addToast) addToast('warning', 'Download Blocked', 'No student records available.');
      return;
    }
    setIsDownloading(true);

    setTimeout(() => {
      try {
        const rows: any[][] = [];
        let filename = "";
        let sheetName = "Attendance";

        const dateHeaders = matrixDates.map(d => {
          const dayNum = d.split('-')[2];
          const holCheck = checkSundayOrHoliday(d, holidays);
          return holCheck.isHoliday ? `${dayNum} (H)` : dayNum;
        });
        rows.push([
          "Admission No",
          "Student Name",
          "Class",
          "Section",
          ...dateHeaders,
          "Present (P)",
          "Half Day (HD)",
          "Late (L)",
          "Absent (A)",
          "Holiday (H)",
          "Attendance %"
        ]);

        displayWards.forEach(ward => {
          let pCount = 0;
          let aCount = 0;
          let hdCount = 0;
          let lCount = 0;
          let hCount = 0;

          const dateCells = matrixDates.map(d => {
            const cell = getStudentStatusForDate(ward, d);
            if (cell.code === 'P') { pCount++; return 'P'; }
            if (cell.code === 'A') { aCount++; return 'A'; }
            if (cell.code === 'HD') { hdCount++; return 'HD'; }
            if (cell.code === 'L') { lCount++; return 'L'; }
            if (cell.code === 'H') { hCount++; return 'H'; }
            return cell.code;
          });

          const netWorkingDays = matrixDates.length - hCount;
          const pct = netWorkingDays > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / netWorkingDays) * 100) : 100;

          rows.push([
            ward.admissionNo || ward.rollNo || `ADM-${ward.studentId}`,
            ward.studentName || `${ward.firstName} ${ward.lastName}`.trim(),
            formatClassName(ward.className),
            ward.section,
            ...dateCells,
            pCount,
            hdCount,
            lCount,
            aCount,
            hCount,
            `${pct}%`
          ]);
        });

        const periodName = filterType === 'Month' 
          ? `${months.find(m => m.value === selectedMonth)?.label || 'Month'}_${selectedYear}`
          : `${startDate}_to_${endDate}`;
        filename = `Attendance_Register_${periodName}`;
        sheetName = "Matrix Register";

        exportToExcel(rows, filename, sheetName);
        if (addToast) addToast('success', 'Download Complete', 'Attendance Excel report has been downloaded.');
      } catch (err) {
        console.error('Failed to export attendance to Excel:', err);
        if (addToast) addToast('error', 'Download Failed', 'Failed to generate attendance Excel report.');
      } finally {
        setIsDownloading(false);
      }
    }, 400);
  };

  // If no registered wards linked to this parent account
  if (parentWards.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs text-center space-y-3 animate-in fade-in">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          No Registered Student Records Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          No active wards are linked to your parent account ({user?.email || user?.name || 'current account'}). Please contact the school administrative office to link your student profile.
        </p>
      </div>
    );
  }

  // Statistics dynamically derived from real records
  const presentDays = wardAttendance.filter(a => a.status === 'Present').length;
  const absentDays = wardAttendance.filter(a => a.status === 'Absent').length;
  const lateDays = wardAttendance.filter(a => a.status === 'Late').length;
  const halfDays = wardAttendance.filter(a => a.status === 'HalfDay' || a.status === 'Half Day').length;
  const leaveDays = wardAttendance.filter(a => a.status === 'Leave').length;

  const workingDays = presentDays + absentDays + lateDays + halfDays;
  const totalDays = workingDays > 0 ? workingDays : wardAttendance.length;

  const attendancePercentage = totalDays > 0 
    ? Math.round(((presentDays + lateDays + (halfDays * 0.5)) / totalDays) * 100) 
    : 100;

  const getStatusConfig = (status: DailyAttendance['status']) => {
    switch (status) {
      case 'Present':
        return { color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 };
      case 'Absent':
        return { color: 'rose', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', icon: AlertCircle };
      case 'Late':
        return { color: 'orange', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', icon: Clock };
      case 'HalfDay':
        return { color: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: CalendarDays };
      case 'Holiday':
        return { color: 'purple', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', icon: CalendarDays };
      case 'Leave':
        return { color: 'sky', bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', icon: CalendarCheck };
      default:
        return { color: 'slate', bg: 'bg-slate-50', text: 'text-slate-700', icon: AlertCircle };
    }
  };

  const currentClassFormatted = formatClassName(currentWard?.className);

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in">
      
      {/* Cockpit Header with Unified Filters */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:px-4 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 dark:bg-sky-500/20 rounded-xl shrink-0">
            <CalendarCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Student Attendance
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentWard ? `${currentWard.studentName || `${currentWard.firstName} ${currentWard.lastName}`} • ${currentClassFormatted} ${currentWard.section ? `(${currentWard.section})` : ''}` : "View your child's attendance records"}
            </p>
          </div>
        </div>

        {/* Filters & Refresh */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => loadDynamicAttendance(true)}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh dynamic records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">View:</span>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as 'Overall' | 'Month' | 'Day' | 'Custom')}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none cursor-pointer"
            >
              <option value="Month">Monthly</option>
              <option value="Custom">Custom Range</option>
              <option value="Day">Daily</option>
              <option value="Overall">Overall</option>
            </select>
          </div>

          {filterType === 'Month' && (
            <>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none cursor-pointer"
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none cursor-pointer"
              >
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </>
          )}

          {filterType === 'Day' && (
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
            />
          )}

          {filterType === 'Custom' && (
            <div className="flex items-center gap-1.5">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
              />
              <span className="text-slate-400 text-xs font-bold">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Multiple Wards Tabs (Shows only parent's real children) */}
      <ParentStudentSelector
        wards={parentWards}
        selectedIndex={selectedChildIdx}
        onSelect={setSelectedChildIdx}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2.5 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-8 h-8 text-sky-600" />
          </div>
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Attendance %</h3>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{attendancePercentage}%</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Present</h3>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Absent</h3>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{absentDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Late / Leave</h3>
          <p className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">{lateDays + leaveDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Half Day</h3>
          <p className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">{halfDays}</p>
        </div>
      </div>

      {/* Monthly & Custom Day-Grid Register Matrix View (User Requested Design) */}
      {(filterType === 'Month' || filterType === 'Custom') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-4 sm:p-5 space-y-3">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Attendance ({displayWards.length} {displayWards.length === 1 ? 'Student' : 'Students'})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-bold text-[10.5px] border border-sky-200/60 dark:border-sky-800 whitespace-nowrap">
                {currentWard ? `${currentClassFormatted}${currentWard.section ? `-${currentWard.section}` : ''}` : 'General'}
              </span>
              {isLoading && (
                <span className="text-[10px] text-sky-600 flex items-center gap-1 font-bold">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isDownloading}
                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs whitespace-nowrap"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-xl py-1.5 px-3 flex items-center gap-1.5 text-xs font-black cursor-default whitespace-nowrap select-none">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span>Saved & Locked</span>
              </div>
            </div>
          </div>

          {/* Read-Only Mode Banner */}
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              <strong className="font-extrabold text-slate-700 dark:text-slate-200">Read-Only Mode:</strong> Records are officially verified and locked by school administration. Below is the attendance day-grid register.
            </span>
          </div>

          {/* Table View */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-3 min-w-[170px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 shadow-xs border-r border-slate-200 dark:border-slate-700 text-center">
                      Student Name
                    </th>
                    {matrixDates.map(d => {
                      const dayNum = parseInt(d.split('-')[2], 10);
                      const holCheck = checkSundayOrHoliday(d, holidays);
                      return (
                        <th
                          key={d}
                          className={`py-3 px-1 text-center min-w-[28px] font-mono ${
                            holCheck.isHoliday
                              ? 'bg-purple-100/90 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-black border-b-2 border-purple-400'
                              : ''
                          }`}
                          title={holCheck.isHoliday ? (holCheck.name ? `${d} - ${holCheck.name}` : `${d} - Sunday / School Holiday`) : d}
                        >
                          {dayNum}
                        </th>
                      );
                    })}
                    <th className="py-3 px-2 text-center text-emerald-600 font-bold">P</th>
                    <th className="py-3 px-2 text-center text-amber-500 font-bold">HD</th>
                    <th className="py-3 px-2 text-center text-orange-500 font-bold">L</th>
                    <th className="py-3 px-2 text-center text-rose-600 font-bold">A</th>
                    <th className="py-3 px-2 text-center text-purple-600 font-bold">H</th>
                    <th className="py-3 px-2 text-center text-sky-600 font-bold">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {displayWards.length === 0 ? (
                    <tr>
                      <td colSpan={matrixDates.length + 7} className="py-12 text-center text-slate-400 italic">
                        No registered student records found.
                      </td>
                    </tr>
                  ) : (
                    displayWards.map((ward, idx) => {
                      let pCount = 0;
                      let aCount = 0;
                      let hdCount = 0;
                      let lCount = 0;
                      let hCount = 0;

                      const isSelected = idx === selectedChildIdx;
                      const wardDisplayName = ward.studentName || `${ward.firstName || ''} ${ward.lastName || ''}`.trim() || 'Student';
                      const wardClassFormatted = formatClassName(ward.className);

                      return (
                        <tr
                          key={ward.id || ward.studentId || idx}
                          onClick={() => setSelectedChildIdx(idx)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-sky-50/30 dark:bg-sky-950/20' 
                              : (idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10')
                          }`}
                          title="Click to view detailed daily records for this child"
                        >
                          <td
                            className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 border-r border-slate-200 dark:border-slate-700 shadow-xs text-center ${
                              isSelected
                                ? 'bg-sky-50 dark:bg-slate-850 font-bold'
                                : (idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800')
                            }`}
                          >
                            <span className="font-extrabold text-slate-900 dark:text-white block text-center">
                              {wardDisplayName}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 block text-center">
                              {ward.admissionNo || ward.rollNo || `ADM-${ward.studentId}`} &bull; {wardClassFormatted}{ward.section ? `-${ward.section}` : ''}
                            </span>
                          </td>

                          {matrixDates.map(d => {
                            const cell = getStudentStatusForDate(ward, d);
                            if (cell.code === 'P') pCount++;
                            else if (cell.code === 'A') aCount++;
                            else if (cell.code === 'HD') hdCount++;
                            else if (cell.code === 'L') lCount++;
                            else if (cell.code === 'H') hCount++;

                            const holCheck = checkSundayOrHoliday(d, holidays);

                            return (
                              <td
                                key={d}
                                className={`py-2 px-0.5 text-center font-mono font-bold text-[10px] ${
                                  holCheck.isHoliday ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''
                                }`}
                              >
                                {cell.code !== '-' ? (
                                  <span className={`inline-block w-6 py-0.5 rounded shadow-2xs ${cell.badgeStyle}`} title={cell.tooltip}>
                                    {cell.code}
                                  </span>
                                ) : (
                                  <span className={cell.badgeStyle} title={cell.tooltip}>
                                    {cell.code}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          <td className="py-2 px-2 text-center font-bold text-emerald-600">{pCount}</td>
                          <td className="py-2 px-2 text-center font-bold text-amber-500">{hdCount}</td>
                          <td className="py-2 px-2 text-center font-bold text-orange-500">{lCount}</td>
                          <td className="py-2 px-2 text-center font-bold text-rose-600">{aCount}</td>
                          <td className="py-2 px-2 text-center font-bold text-purple-600">{hCount}</td>
                          <td className="py-2 px-2 text-center font-extrabold text-sky-600 bg-sky-50/30 dark:bg-sky-900/10">
                            {(() => {
                              const netDays = matrixDates.length - hCount;
                              return netDays > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / netDays) * 100) : 100;
                            })()}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Attendance List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Records {currentWard?.studentName ? `• ${currentWard.studentName}` : ''}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
            </span>
            {isLoading && (
              <span className="text-[10px] text-sky-600 flex items-center gap-1 font-bold">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center flex-wrap gap-1.5">
              {['All', 'Present', 'Absent', 'Late', 'HalfDay'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {status === 'HalfDay' ? 'Half Day' : status}
                </button>
              ))}
            </div>
            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:border-slate-700"></div>
            <div className="text-[11px] font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap">
              {filterType === 'Overall' ? 'Overall Records' : filterType === 'Month' ? `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}` : filterType === 'Day' ? selectedDate : `${startDate} to ${endDate}`}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-1.5">
              <Calendar className="w-8 h-8 mx-auto mb-1 opacity-25" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {isLoading ? 'Checking for attendance records...' : `No attendance records found for ${currentWard?.studentName || 'this student'}.`}
              </p>
              <p className="text-xs text-slate-400">
                {isLoading ? 'Please wait while dynamic attendance is synchronized from the school registry.' : 'There are no attendance entries recorded matching your selected criteria.'}
              </p>
            </div>
          ) : (
            paginatedRecords.map(record => {
              const config = getStatusConfig(record.status);
              const StatusIcon = config.icon;
              
              return (
                <div key={record.id} className="px-4 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {(() => {
                          if (record.formattedDate) return record.formattedDate;
                          const parts = String(record.date).split('T')[0].split('-').map(Number);
                          if (parts.length === 3) {
                            return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
                          }
                          return record.date;
                        })()}
                      </h4>
                      {record.remarks && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          Teacher Note: {record.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border border-current/20 self-start sm:self-auto ${config.bg} ${config.text}`}>
                    {record.status}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            <span className="font-medium text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
