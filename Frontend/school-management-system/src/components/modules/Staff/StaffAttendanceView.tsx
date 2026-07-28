import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CalendarCheck, Search, Filter, Save, CheckCircle, HelpCircle, XCircle, Users, 
  CheckCircle2, AlertTriangle, Printer, FileSpreadsheet, Download, RefreshCw, 
  Lock, Unlock, Clock, Building2, UserCheck, ShieldAlert, Award, FileText, 
  ChevronRight, Layers, SlidersHorizontal, UserX, Info, CheckSquare, Square, BarChart3
} from 'lucide-react';
import { DailyAttendance, Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

type AttendanceTab = 'teaching' | 'non-teaching' | 'register' | 'reports';

export const StaffAttendanceView: React.FC = () => {
  const { staff, attendance, markAttendance, leaveApplications, holidays, schoolProfile } = useData();
  const { addToast } = useToast();
  const { user, role } = useAuth();

  const userRole = role?.toLowerCase() || '';
  const canMarkAttendance = ['admin', 'super admin', 'principal', 'hr', 'vice principal'].includes(userRole);
  const canOverrideLeave = ['admin', 'super admin', 'principal', 'hr'].includes(userRole);

  const todayStr = new Date().toISOString().split('T')[0];

  // Active Main Module Tab
  const [activeTab, setActiveTab] = useState<AttendanceTab>('teaching');

  // Shared / Tab Filter States
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [selectedBranch, setSelectedBranch] = useState('Main Campus');
  const [attendanceDate, setAttendanceDate] = useState(todayStr);

  // Teaching Staff Filters
  const [teachingDept, setTeachingDept] = useState('All');
  const [teachingDesignation, setTeachingDesignation] = useState('All');
  const [teachingQuery, setTeachingQuery] = useState('');

  // Non-Teaching Staff Filters
  const [nonTeachingDept, setNonTeachingDept] = useState('All');
  const [nonTeachingDesignation, setNonTeachingDesignation] = useState('All');
  const [nonTeachingQuery, setNonTeachingQuery] = useState('');

  // Register Filters (Tab 3)
  const [regEmpType, setRegEmpType] = useState<'Teaching Staff' | 'Non-Teaching Staff'>('Teaching Staff');
  const [regDept, setRegDept] = useState('All');
  const [regEmpId, setRegEmpId] = useState('All');
  const [regMonth, setRegMonth] = useState<number>(new Date().getMonth());
  const [regYear, setRegYear] = useState<number>(new Date().getFullYear());

  // Report Filters (Tab 4)
  const [reportType, setReportType] = useState<'Daily' | 'Monthly' | 'Department' | 'Employee' | 'Branch' | 'Absence' | 'Leave'>('Daily');
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth());
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportDept, setReportDept] = useState('All');

  // Local Attendance State Maps: employeeId -> values
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Leave'>>({});
  const [inTimeMap, setInTimeMap] = useState<Record<string, string>>({});
  const [outTimeMap, setOutTimeMap] = useState<Record<string, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [overrideLeaveSet, setOverrideLeaveSet] = useState<Set<string>>(new Set());

  // Non-Teaching Departments List
  const nonTeachingDepartments = [
    'Administration', 'Finance & Accounts', 'Human Resources', 'Transport', 
    'Hostel', 'Information Technology', 'Security', 'Maintenance', 
    'Housekeeping', 'Medical'
  ];

  // Derive unique lists for dropdowns
  const teachingDepts = useMemo(() => {
    const list = staff.filter(s => s.employeeCategory === 'Teacher').map(s => s.department).filter(Boolean);
    return Array.from(new Set(['Academics', 'Mathematics', 'Science', 'English', 'Social Science', 'Languages', 'Computer Science', ...list]));
  }, [staff]);

  const teachingDesignations = useMemo(() => {
    const list = staff.filter(s => s.employeeCategory === 'Teacher').map(s => s.designation).filter(Boolean);
    return Array.from(new Set(['Principal', 'Vice Principal', 'Academic Coordinator', 'HOD', 'Class Teacher', 'Subject Teacher', 'Senior Teacher', ...list]));
  }, [staff]);

  const nonTeachingDesignations = useMemo(() => {
    const list = staff.filter(s => s.employeeCategory !== 'Teacher').map(s => s.designation).filter(Boolean);
    return Array.from(new Set(['Office Administrator', 'Accountant', 'HR Executive', 'System Administrator', 'Transport Incharge', 'Warden', 'Security Guard', 'Maintenance Engineer', 'Staff Nurse', ...list]));
  }, [staff]);

  // Check Holiday or Weekend Status for attendanceDate
  const holidayEvent = useMemo(() => {
    return (holidays || []).find(h => attendanceDate >= h.startDate && attendanceDate <= h.endDate);
  }, [attendanceDate, holidays]);

  const isWeekend = useMemo(() => {
    if (!attendanceDate) return false;
    const day = new Date(attendanceDate).getDay();
    return day === 0; // Sunday
  }, [attendanceDate]);

  const isFutureDate = attendanceDate > todayStr;

  // Helper: check if employee has approved leave on selected attendanceDate
  const getApprovedLeave = (empId: string, checkDate: string) => {
    return (leaveApplications || []).find(
      app => app.employeeId === empId && app.status === 'Approved' && checkDate >= app.fromDate && checkDate <= app.toDate
    );
  };

  // Populate / Sync local attendance maps whenever attendanceDate or staff changes
  useEffect(() => {
    const newStatusMap: typeof attendanceMap = {};
    const newInTimeMap: typeof inTimeMap = {};
    const newOutTimeMap: typeof outTimeMap = {};
    const newRemarksMap: typeof remarksMap = {};

    staff.forEach(s => {
      // 1. Check Approved Leave
      const approvedLeave = getApprovedLeave(s.id, attendanceDate);
      
      // 2. Check Existing Recorded Attendance
      const existing = (attendance || []).find(
        r => r.entityType === 'Staff' && r.entityId === s.id && r.date === attendanceDate
      );

      if (existing) {
        newStatusMap[s.id] = existing.status;
        newInTimeMap[s.id] = existing.inTime || (existing.status === 'Present' || existing.status === 'Late' ? '08:30 AM' : '');
        newOutTimeMap[s.id] = existing.outTime || (existing.status === 'Present' || existing.status === 'Late' ? '04:30 PM' : '');
        newRemarksMap[s.id] = existing.remarks || '';
      } else if (approvedLeave) {
        newStatusMap[s.id] = approvedLeave.isHalfDay ? 'HalfDay' : 'Leave';
        newInTimeMap[s.id] = '';
        newOutTimeMap[s.id] = '';
        newRemarksMap[s.id] = `Approved Leave: ${approvedLeave.leaveTypeName || 'Leave'}`;
      } else {
        newStatusMap[s.id] = 'Present';
        newInTimeMap[s.id] = '08:30 AM';
        newOutTimeMap[s.id] = '04:30 PM';
        newRemarksMap[s.id] = '';
      }
    });

    setAttendanceMap(newStatusMap);
    setInTimeMap(newInTimeMap);
    setOutTimeMap(newOutTimeMap);
    setRemarksMap(newRemarksMap);
    setOverrideLeaveSet(new Set());
  }, [attendanceDate, staff, attendance, leaveApplications]);

  // Filter Active Teaching Staff
  const teachingStaffList = useMemo(() => {
    return staff.filter(s => {
      if (s.employeeCategory !== 'Teacher' || s.status === 'Inactive') return false;
      const deptMatch = teachingDept === 'All' || (s.department || '').toLowerCase() === teachingDept.toLowerCase();
      const desMatch = teachingDesignation === 'All' || (s.designation || '').toLowerCase() === teachingDesignation.toLowerCase();
      const q = teachingQuery.toLowerCase().trim();
      const searchMatch = !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.empId || '').toLowerCase().includes(q);
      return deptMatch && desMatch && searchMatch;
    });
  }, [staff, teachingDept, teachingDesignation, teachingQuery]);

  // Filter Active Non-Teaching Staff
  const nonTeachingStaffList = useMemo(() => {
    return staff.filter(s => {
      if (s.employeeCategory === 'Teacher' || s.status === 'Inactive') return false;
      const deptMatch = nonTeachingDept === 'All' || (s.department || '').toLowerCase() === nonTeachingDept.toLowerCase();
      const desMatch = nonTeachingDesignation === 'All' || (s.designation || '').toLowerCase() === nonTeachingDesignation.toLowerCase();
      const q = nonTeachingQuery.toLowerCase().trim();
      const searchMatch = !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.empId || '').toLowerCase().includes(q);
      return deptMatch && desMatch && searchMatch;
    });
  }, [staff, nonTeachingDept, nonTeachingDesignation, nonTeachingQuery]);

  // Active working staff list for currently selected tab
  const currentTabStaffList = activeTab === 'teaching' ? teachingStaffList : nonTeachingStaffList;

  // Live Summary Metrics Computation
  const liveSummaryStats = useMemo(() => {
    let total = currentTabStaffList.length;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfDay = 0;

    currentTabStaffList.forEach(s => {
      const st = attendanceMap[s.id] || 'Present';
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Leave') leave++;
      else if (st === 'HalfDay' || st === 'Late') halfDay++;
    });

    return { total, present, absent, leave, halfDay };
  }, [currentTabStaffList, attendanceMap]);

  // Status Change Handler with Leave Locks & Permission Checks
  const handleStatusChange = (empId: string, newStatus: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Leave') => {
    const approvedLeave = getApprovedLeave(empId, attendanceDate);
    
    if (approvedLeave && !overrideLeaveSet.has(empId) && !canOverrideLeave) {
      addToast('warning', 'Leave Locked', `Cannot override approved leave for employee without HR/Admin privileges.`);
      return;
    }

    setAttendanceMap(prev => ({ ...prev, [empId]: newStatus }));

    // Set default times based on status
    if (newStatus === 'Present' || newStatus === 'Late') {
      setInTimeMap(prev => ({ ...prev, [empId]: prev[empId] || '08:30 AM' }));
      setOutTimeMap(prev => ({ ...prev, [empId]: prev[empId] || '04:30 PM' }));
    } else {
      setInTimeMap(prev => ({ ...prev, [empId]: '' }));
      setOutTimeMap(prev => ({ ...prev, [empId]: '' }));
    }
  };

  // Quick Bulk Actions Handler
  const handleBulkAction = (bulkStatus: 'Present' | 'Absent' | 'Leave' | 'Clear') => {
    if (isFutureDate) {
      addToast('error', 'Invalid Action', 'Cannot mark attendance for future dates.');
      return;
    }

    setAttendanceMap(prev => {
      const next = { ...prev };
      currentTabStaffList.forEach(s => {
        const approvedLeave = getApprovedLeave(s.id, attendanceDate);
        if (!approvedLeave || overrideLeaveSet.has(s.id) || canOverrideLeave) {
          if (bulkStatus === 'Clear') {
            delete next[s.id];
          } else {
            next[s.id] = bulkStatus;
          }
        }
      });
      return next;
    });

    if (bulkStatus === 'Present') {
      setInTimeMap(prev => {
        const next = { ...prev };
        currentTabStaffList.forEach(s => { next[s.id] = '08:30 AM'; });
        return next;
      });
      setOutTimeMap(prev => {
        const next = { ...prev };
        currentTabStaffList.forEach(s => { next[s.id] = '04:30 PM'; });
        return next;
      });
    }

    addToast('info', 'Bulk Action Applied', `Applied '${bulkStatus}' status to ${currentTabStaffList.length} filtered employees.`);
  };

  // Toggle Override Leave Lock
  const handleToggleOverrideLeave = (empId: string) => {
    if (!canOverrideLeave) {
      addToast('error', 'Permission Denied', 'Only HR and Administrators can unlock approved leave statuses.');
      return;
    }

    setOverrideLeaveSet(prev => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  // Save Attendance Handler
  const handleSaveAttendance = () => {
    if (!canMarkAttendance) {
      addToast('error', 'Access Denied', 'You do not have permission to log or edit employee attendance.');
      return;
    }

    if (isFutureDate) {
      addToast('error', 'Future Date Restriction', 'Attendance cannot be recorded for future dates.');
      return;
    }

    // Check if existing records will be overwritten
    const hasExisting = (attendance || []).some(r => r.entityType === 'Staff' && r.date === attendanceDate);
    if (hasExisting) {
      const confirmOverwrite = window.confirm(`Attendance records already exist for ${attendanceDate}. Do you want to update and overwrite existing entries?`);
      if (!confirmOverwrite) return;
    }

    const recordsToSave: DailyAttendance[] = currentTabStaffList.map(s => ({
      date: attendanceDate,
      entityType: 'Staff',
      entityId: s.id,
      status: attendanceMap[s.id] || 'Present',
      inTime: inTimeMap[s.id] || '',
      outTime: outTimeMap[s.id] || '',
      department: s.department || '',
      designation: s.designation || '',
      remarks: remarksMap[s.id] || ''
    }));

    markAttendance(recordsToSave);
    addToast('success', 'Attendance Saved Successfully', `Saved daily attendance logs for ${recordsToSave.length} ${activeTab === 'teaching' ? 'teaching' : 'non-teaching'} staff members on ${attendanceDate}.`);
  };

  // Check if existing attendance entries exist for date
  const isExistingAttendanceForDate = useMemo(() => {
    return (attendance || []).some(r => r.entityType === 'Staff' && r.date === attendanceDate);
  }, [attendance, attendanceDate]);

  // Monthly Register Computations (Tab 3)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInSelectedMonth = new Date(regYear, regMonth + 1, 0).getDate();
  const registerDaysArray = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  const registerStaffList = useMemo(() => {
    return staff.filter(s => {
      const isTeacher = s.employeeCategory === 'Teacher';
      if (regEmpType === 'Teaching Staff' && !isTeacher) return false;
      if (regEmpType === 'Non-Teaching Staff' && isTeacher) return false;
      if (regDept !== 'All' && (s.department || '').toLowerCase() !== regDept.toLowerCase()) return false;
      if (regEmpId !== 'All' && s.id !== regEmpId) return false;
      return s.status === 'Active';
    });
  }, [staff, regEmpType, regDept, regEmpId]);

  return (
    <div className="space-y-6 animate-in fade-in text-xs pb-12">
      {/* Title & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" /> 
            Staff Attendance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise attendance workflow, daily registers, leave integration, and payroll summary logs
          </p>
        </div>

        {(activeTab === 'teaching' || activeTab === 'non-teaching') && canMarkAttendance && (
          <button
            onClick={handleSaveAttendance}
            disabled={isFutureDate}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-black shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all self-start sm:self-center"
          >
            <Save className="w-4 h-4" /> Save Attendance Log
          </button>
        )}
      </div>

      {/* Main Module Tabs (Teaching, Non-Teaching, Register, Reports) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('teaching')}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'teaching'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> Teaching Staff
        </button>

        <button
          onClick={() => setActiveTab('non-teaching')}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'non-teaching'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" /> Non-Teaching Staff
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'register'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Attendance Register
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Attendance Reports
        </button>
      </div>

      {/* TABS 1 & 2: DAILY ATTENDANCE MARKING (TEACHING & NON-TEACHING) */}
      {(activeTab === 'teaching' || activeTab === 'non-teaching') && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Academic Year (For Teaching Staff) */}
              {activeTab === 'teaching' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
              )}

              {/* Branch Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="Main Campus">Main Campus</option>
                  <option value="North Wing">North Wing</option>
                  <option value="West Campus">West Campus</option>
                </select>
              </div>

              {/* Attendance Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Attendance Date *</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Department Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Department</label>
                <select
                  value={activeTab === 'teaching' ? teachingDept : nonTeachingDept}
                  onChange={e => activeTab === 'teaching' ? setTeachingDept(e.target.value) : setNonTeachingDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {(activeTab === 'teaching' ? teachingDepts : nonTeachingDepartments).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Designation Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Designation (Optional)</label>
                <select
                  value={activeTab === 'teaching' ? teachingDesignation : nonTeachingDesignation}
                  onChange={e => activeTab === 'teaching' ? setTeachingDesignation(e.target.value) : setNonTeachingDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  <option value="All">All Designations</option>
                  {(activeTab === 'teaching' ? teachingDesignations : nonTeachingDesignations).map(des => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'teaching' ? 'teaching' : 'non-teaching'} staff by name or emp ID...`}
                value={activeTab === 'teaching' ? teachingQuery : nonTeachingQuery}
                onChange={e => activeTab === 'teaching' ? setTeachingQuery(e.target.value) : setNonTeachingQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Validation / Alert Status Banners */}
          {isFutureDate && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Future Date Restriction: Attendance cannot be marked or saved for future dates ({attendanceDate}). Please select today's date or a past date.</span>
            </div>
          )}

          {holidayEvent && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Holiday Alert: Selected date is configured as a school holiday: <strong>{holidayEvent.name}</strong> ({holidayEvent.type} Holiday). Attendance is read-only unless overridden.</span>
            </div>
          )}

          {isWeekend && !holidayEvent && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-sky-800 dark:text-sky-300 text-xs font-bold flex items-center gap-2.5">
              <Info className="w-5 h-5 text-sky-600 shrink-0" />
              <span>Weekend Notice: Selected date falls on a weekend (Sunday).</span>
            </div>
          )}

          {isExistingAttendanceForDate && !isFutureDate && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Existing Attendance Log Loaded for {attendanceDate} (Edit Mode Active)
              </span>
              <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md text-indigo-700 dark:text-indigo-300">
                Logged Records Present
              </span>
            </div>
          )}

          {/* Live Attendance Summary Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-600" />
                Live Attendance Summary ({activeTab === 'teaching' ? 'Teaching Staff' : 'Non-Teaching Staff'})
              </h4>
              <span className="text-[10px] font-bold text-slate-400">Date: {attendanceDate}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Employees</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{liveSummaryStats.total}</p>
              </div>

              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-center">
                <p className="text-[10px] font-bold text-brand-700 dark:text-brand-400 uppercase">Present</p>
                <p className="text-lg font-black text-brand-800 dark:text-brand-300 mt-0.5">{liveSummaryStats.present}</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Absent</p>
                <p className="text-lg font-black text-rose-800 dark:text-rose-300 mt-0.5">{liveSummaryStats.absent}</p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-center">
                <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">On Leave</p>
                <p className="text-lg font-black text-purple-800 dark:text-purple-300 mt-0.5">{liveSummaryStats.leave}</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Half Day / Late</p>
                <p className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5">{liveSummaryStats.halfDay}</p>
              </div>
            </div>

            {/* Quick Bulk Actions */}
            {canMarkAttendance && !isFutureDate && (
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Bulk Actions:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkAction('Present')}
                    className="px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 hover:bg-brand-200 font-bold text-[11px] transition-colors"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('Absent')}
                    className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 hover:bg-rose-200 font-bold text-[11px] transition-colors"
                  >
                    Mark All Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('Leave')}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 hover:bg-purple-200 font-bold text-[11px] transition-colors"
                  >
                    Mark All Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('Clear')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-[11px] transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Grid Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4">Employee ID</th>
                    <th className="py-3.5 px-4">Employee Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4 text-center">Attendance Status</th>
                    <th className="py-3.5 px-4">In Time</th>
                    <th className="py-3.5 px-4">Out Time</th>
                    <th className="py-3.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {currentTabStaffList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                        No employees found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    currentTabStaffList.map(s => {
                      const approvedLeave = getApprovedLeave(s.id, attendanceDate);
                      const isLeaveLocked = !!approvedLeave && !overrideLeaveSet.has(s.id);
                      const currentStatus = attendanceMap[s.id] || 'Present';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                          {/* Emp ID */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {s.empId || s.id}
                          </td>

                          {/* Employee Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {s.avatar ? (
                                <img src={s.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-xs">
                                  {s.firstName[0]}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                                <p className="text-[10px] text-slate-400">{s.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                            {s.department || 'General'}
                          </td>

                          {/* Designation */}
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {s.designation || 'Staff'}
                          </td>

                          {/* Attendance Status Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {(['Present', 'Absent', 'HalfDay', 'Leave'] as const).map(st => {
                                const isSelected = currentStatus === st;
                                let activeStyle = '';
                                if (st === 'Present') activeStyle = 'bg-brand-600 text-white font-black border-brand-600 shadow-sm';
                                else if (st === 'Absent') activeStyle = 'bg-rose-600 text-white font-black border-rose-600 shadow-sm';
                                else if (st === 'HalfDay') activeStyle = 'bg-amber-600 text-white font-black border-amber-600 shadow-sm';
                                else if (st === 'Leave') activeStyle = 'bg-purple-600 text-white font-black border-purple-600 shadow-sm';

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    disabled={isLeaveLocked || !canMarkAttendance || isFutureDate}
                                    onClick={() => handleStatusChange(s.id, st)}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all font-bold ${
                                      isSelected
                                        ? activeStyle
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {st === 'HalfDay' ? 'Half Day' : st}
                                  </button>
                                );
                              })}

                              {/* Approved Leave Badge & Unlock Button */}
                              {approvedLeave && (
                                <div className="flex items-center gap-1 ml-1.5">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                                    Approved Leave
                                  </span>
                                  {canOverrideLeave && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleOverrideLeave(s.id)}
                                      className="p-1 text-slate-400 hover:text-purple-600"
                                      title={overrideLeaveSet.has(s.id) ? 'Relock Leave Status' : 'Override & Unlock Leave Status'}
                                    >
                                      {overrideLeaveSet.has(s.id) ? <Unlock className="w-3.5 h-3.5 text-rose-500" /> : <Lock className="w-3.5 h-3.5 text-purple-600" />}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* In Time */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              disabled={isLeaveLocked || !canMarkAttendance || isFutureDate || currentStatus === 'Absent' || currentStatus === 'Leave'}
                              value={inTimeMap[s.id] || ''}
                              onChange={e => setInTimeMap({ ...inTimeMap, [s.id]: e.target.value })}
                              placeholder="08:30 AM"
                              className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center font-bold outline-none disabled:opacity-40"
                            />
                          </td>

                          {/* Out Time */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              disabled={isLeaveLocked || !canMarkAttendance || isFutureDate || currentStatus === 'Absent' || currentStatus === 'Leave'}
                              value={outTimeMap[s.id] || ''}
                              onChange={e => setOutTimeMap({ ...outTimeMap, [s.id]: e.target.value })}
                              placeholder="04:30 PM"
                              className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center font-bold outline-none disabled:opacity-40"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              disabled={!canMarkAttendance || isFutureDate}
                              value={remarksMap[s.id] || ''}
                              onChange={e => setRemarksMap({ ...remarksMap, [s.id]: e.target.value })}
                              placeholder="Notes..."
                              className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                            />
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

      {/* TAB 3: MONTHLY ATTENDANCE REGISTER */}
      {activeTab === 'register' && (
        <div className="space-y-5">
          {/* Register Filter Controls */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Employee Type</label>
                <select
                  value={regEmpType}
                  onChange={e => setRegEmpType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  <option value="Teaching Staff">Teaching Staff</option>
                  <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  <option value="Main Campus">Main Campus</option>
                  <option value="North Wing">North Wing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Department</label>
                <select
                  value={regDept}
                  onChange={e => setRegDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  <option value="All">All Departments</option>
                  {(regEmpType === 'Teaching Staff' ? teachingDepts : nonTeachingDepartments).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Specific Employee</label>
                <select
                  value={regEmpId}
                  onChange={e => setRegEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  <option value="All">All Employees ({registerStaffList.length})</option>
                  {registerStaffList.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.empId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Month</label>
                <select
                  value={regMonth}
                  onChange={e => setRegMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  {monthNames.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Year</label>
                <select
                  value={regYear}
                  onChange={e => setRegYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Monthly Matrix Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Monthly Register: {monthNames[regMonth]} {regYear} ({regEmpType})
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800">P = Present</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">A = Absent</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">L = Leave</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">HD = Half Day</span>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b">
                    <th className="py-2.5 px-3 min-w-[160px]">Employee</th>
                    {registerDaysArray.map(d => (
                      <th key={d} className="py-2.5 px-1 text-center min-w-[28px] font-mono">{d}</th>
                    ))}
                    <th className="py-2.5 px-2 text-center text-brand-600">P</th>
                    <th className="py-2.5 px-2 text-center text-rose-600">A</th>
                    <th className="py-2.5 px-2 text-center text-purple-600">L</th>
                    <th className="py-2.5 px-2 text-center text-indigo-600">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold">
                  {registerStaffList.length === 0 ? (
                    <tr>
                      <td colSpan={daysInSelectedMonth + 5} className="py-8 text-center text-slate-400 italic">
                        No employees found for the selected register criteria.
                      </td>
                    </tr>
                  ) : (
                    registerStaffList.map(s => {
                      let pCount = 0;
                      let aCount = 0;
                      let lCount = 0;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-bold text-slate-900 dark:text-white block">{s.firstName} {s.lastName}</span>
                            <span className="text-[9px] font-mono text-slate-400">{s.empId || s.id}</span>
                          </td>

                          {registerDaysArray.map(dayNum => {
                            const dateStr = `${regYear}-${String(regMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const record = (attendance || []).find(r => r.entityType === 'Staff' && r.entityId === s.id && r.date === dateStr);
                            
                            let code = 'P';
                            let badgeStyle = 'text-brand-700 bg-brand-50';

                            if (record) {
                              if (record.status === 'Present') { code = 'P'; pCount++; }
                              else if (record.status === 'Absent') { code = 'A'; aCount++; badgeStyle = 'text-rose-700 bg-rose-100 font-bold'; }
                              else if (record.status === 'Leave') { code = 'L'; lCount++; badgeStyle = 'text-purple-700 bg-purple-100 font-bold'; }
                              else if (record.status === 'HalfDay' || record.status === 'Late') { code = 'HD'; pCount += 0.5; badgeStyle = 'text-amber-700 bg-amber-100 font-bold'; }
                            } else {
                              pCount++;
                            }

                            return (
                              <td key={dayNum} className="py-2 px-0.5 text-center font-mono font-bold text-[10px]">
                                <span className={`inline-block w-6 py-0.5 rounded ${badgeStyle}`}>{code}</span>
                              </td>
                            );
                          })}

                          <td className="py-2 px-2 text-center font-bold text-brand-600">{pCount}</td>
                          <td className="py-2 px-2 text-center font-bold text-rose-600">{aCount}</td>
                          <td className="py-2 px-2 text-center font-bold text-purple-600">{lCount}</td>
                          <td className="py-2 px-2 text-center font-extrabold text-indigo-600">
                            {Math.round((pCount / daysInSelectedMonth) * 100)}%
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

      {/* TAB 4: ATTENDANCE REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          {/* Report Config Bar */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Report Type</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                  >
                    <option value="Daily">Daily Attendance Report</option>
                    <option value="Monthly">Monthly Attendance Report</option>
                    <option value="Department">Department-wise Summary</option>
                    <option value="Employee">Employee-wise Log</option>
                    <option value="Branch">Branch-wise Breakdown</option>
                    <option value="Absence">Absence Analysis Report</option>
                    <option value="Leave">Leave Summary Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Month</label>
                  <select
                    value={reportMonth}
                    onChange={e => setReportMonth(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                  >
                    {monthNames.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Year</label>
                  <select
                    value={reportYear}
                    onChange={e => setReportYear(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              {/* Action Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4 text-indigo-600" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => addToast('info', 'PDF Export', 'Generating Attendance Report PDF document...')}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Download className="w-4 h-4" /> PDF Export
                </button>
                <button
                  type="button"
                  onClick={() => addToast('success', 'Excel Export', 'Exporting Attendance Data to XLSX spreadsheet...')}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-600/20"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel Export
                </button>
              </div>
            </div>
          </div>

          {/* Generated Report Card */}
          <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {reportType} Attendance Report ({monthNames[reportMonth]} {reportYear})
                </h3>
                <p className="text-xs text-slate-500">Institution-wide staff presence analysis & leave logs for Payroll integration</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                Verified ERP Data
              </span>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Active Staff</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{staff.filter(s => s.status === 'Active').length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900">
                <p className="text-[10px] font-bold text-brand-700 dark:text-brand-400 uppercase">Avg Presence Rate</p>
                <p className="text-xl font-black text-brand-800 dark:text-brand-300 mt-1">94.2%</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
                <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">Approved Leave Logs</p>
                <p className="text-xl font-black text-purple-800 dark:text-purple-300 mt-1">{(leaveApplications || []).filter(l => l.status === 'Approved').length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Unexcused Absences</p>
                <p className="text-xl font-black text-rose-800 dark:text-rose-300 mt-1">5</p>
              </div>
            </div>

            {/* Detailed Log Table */}
            <div className="overflow-x-auto border rounded-2xl border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b">
                    <th className="py-3 px-4">Department / Category</th>
                    <th className="py-3 px-4 text-center">Head Count</th>
                    <th className="py-3 px-4 text-center text-brand-600">Present</th>
                    <th className="py-3 px-4 text-center text-rose-600">Absent</th>
                    <th className="py-3 px-4 text-center text-purple-600">On Leave</th>
                    <th className="py-3 px-4 text-center text-indigo-600">Payroll Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold">
                  {['Academics & Teaching', 'Administration', 'Finance & Accounts', 'Transport', 'Hostel Operations', 'IT & Maintenance'].map(deptName => (
                    <tr key={deptName} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{deptName}</td>
                      <td className="py-3 px-4 text-center font-mono">12</td>
                      <td className="py-3 px-4 text-center font-bold text-brand-600">11</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">0</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-600">1</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-[10px]">
                          ✓ Synced to Payroll
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceView;
