// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck, AlertTriangle, CheckCircle2, Clock, Calendar, RefreshCw,
  Sparkles, Plus, Trash2, Printer, Search, UserX, BookOpen, School,
  ArrowRight, ShieldCheck, ChevronDown, ChevronRight, Check, X, Filter,
  Layers, Info, Zap, Award, Coffee
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';
import {
  fetchTeacherSubstitutionsApi,
  fetchAbsentTeachersScheduleApi,
  fetchAvailableLeisureTeachersApi,
  assignTeacherSubstitutionApi,
  autoReplaceTeacherSubstitutionsApi,
  deleteTeacherSubstitutionApi
} from '../../../api/academic';
import { TeacherSubstitution, AbsentTeacherSchedule, AbsentTeacherPeriod, AvailableLeisureTeacher } from '../../../types';

export const TeacherSubstitutionWorkspace: React.FC<{
  onNavigate?: (module: string) => void;
  initialDate?: string;
}> = ({ onNavigate, initialDate }) => {
  const { staff = [], timetable = [], periodSettings = [], academicClasses = [], subjects = [], teacherAssignments = [] } = useData();
  const { user, role, selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [absentSchedules, setAbsentSchedules] = useState<AbsentTeacherSchedule[]>([]);
  const [substitutions, setSubstitutions] = useState<TeacherSubstitution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'replaced'>('all');

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState<{
    absentTeacherId: number;
    absentTeacherName: string;
    leaveReason?: string;
    leaveAppId?: number;
    period: AbsentTeacherPeriod;
  } | null>(null);

  const [leisureTeachers, setLeisureTeachers] = useState<AvailableLeisureTeacher[]>([]);
  const [loadingLeisure, setLoadingLeisure] = useState(false);
  const [leisureSearch, setLeisureSearch] = useState('');
  const [selectedLeisureTeacherId, setSelectedLeisureTeacherId] = useState<number | null>(null);
  const [assignRemarks, setAssignRemarks] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Auto-replace state
  const [isAutoReplacing, setIsAutoReplacing] = useState(false);

  // Manual Add Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    absentTeacherId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    periodId: '',
    startTime: '08:30 AM',
    endTime: '09:15 AM',
    substituteTeacherId: '',
    roomNo: '',
    reason: 'Emergency Leave / Relieved',
    remarks: ''
  });

  // Calculate day of week from selectedDate
  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return 'Monday';
    const d = new Date(selectedDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }, [selectedDate]);

  // Load Absent Teachers & Substitutions data for selectedDate
  const loadData = async () => {
    setLoading(true);
    try {
      const [absentRes, subsRes]: any = await Promise.all([
        fetchAbsentTeachersScheduleApi(selectedDate, selectedAcademicYear, selectedBranch),
        fetchTeacherSubstitutionsApi(selectedDate, undefined, undefined, selectedAcademicYear, selectedBranch)
      ]);

      if (absentRes && absentRes.success && Array.isArray(absentRes.data)) {
        setAbsentSchedules(absentRes.data);
      } else {
        setAbsentSchedules([]);
      }

      if (subsRes && subsRes.success && Array.isArray(subsRes.data)) {
        setSubstitutions(subsRes.data);
      } else {
        setSubstitutions([]);
      }
    } catch (err: any) {
      console.warn('Error loading substitution data:', err);
      addToast('error', 'Sync Failed', 'Could not load substitution data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedAcademicYear, selectedBranch]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalAbsent = absentSchedules.length;
    let totalPeriodsNeeding = 0;
    let totalReplaced = 0;

    absentSchedules.forEach(s => {
      totalPeriodsNeeding += (s.periods || []).length;
      totalReplaced += (s.periods || []).filter(p => p.isReplaced).length;
    });

    const pendingPeriods = totalPeriodsNeeding - totalReplaced;
    const completionRate = totalPeriodsNeeding > 0 ? Math.round((totalReplaced / totalPeriodsNeeding) * 100) : 100;

    return {
      totalAbsent,
      totalPeriodsNeeding,
      totalReplaced,
      pendingPeriods,
      completionRate
    };
  }, [absentSchedules]);

  // Open Assign Modal for a specific period
  const handleOpenAssignModal = async (
    absentTeacherId: number,
    absentTeacherName: string,
    leaveReason: string | undefined,
    leaveAppId: number | undefined,
    period: AbsentTeacherPeriod
  ) => {
    setTargetPeriod({
      absentTeacherId,
      absentTeacherName,
      leaveReason,
      leaveAppId,
      period
    });
    setSelectedLeisureTeacherId(null);
    setAssignRemarks('');
    setIsAssignModalOpen(true);
    setLoadingLeisure(true);

    try {
      const res: any = await fetchAvailableLeisureTeachersApi({
        date: selectedDate,
        dayOfWeek: dayOfWeek,
        startTime: period.startTime,
        endTime: period.endTime,
        subjectId: period.subjectId,
        excludeTeacherId: absentTeacherId
      });

      if (res && res.success && Array.isArray(res.data)) {
        setLeisureTeachers(res.data);
        if (res.data.length > 0) {
          setSelectedLeisureTeacherId(res.data[0].teacherId);
        }
      } else {
        setLeisureTeachers([]);
      }
    } catch (err) {
      console.warn('Error fetching leisure teachers:', err);
      setLeisureTeachers([]);
    } finally {
      setLoadingLeisure(false);
    }
  };

  // Confirm Single Substitution Assignment
  const handleConfirmAssign = async () => {
    if (!targetPeriod || !selectedLeisureTeacherId) {
      addToast('warning', 'Selection Required', 'Please choose a leisure teacher to replace this class.');
      return;
    }

    const chosenTeacher = leisureTeachers.find(t => t.teacherId === selectedLeisureTeacherId);

    setIsAssigning(true);
    try {
      const payload = {
        date: selectedDate,
        slotId: targetPeriod.period.slotId,
        periodId: targetPeriod.period.periodId,
        periodName: targetPeriod.period.periodName,
        startTime: targetPeriod.period.startTime,
        endTime: targetPeriod.period.endTime,
        classId: targetPeriod.period.classId,
        className: targetPeriod.period.className,
        sectionId: targetPeriod.period.sectionId,
        sectionName: targetPeriod.period.sectionName,
        subjectId: targetPeriod.period.subjectId,
        subjectName: targetPeriod.period.subjectName,
        originalTeacherId: targetPeriod.absentTeacherId,
        originalTeacherName: targetPeriod.absentTeacherName,
        substituteTeacherId: selectedLeisureTeacherId,
        substituteTeacherName: chosenTeacher?.teacherName,
        roomNo: targetPeriod.period.roomNo,
        reason: `Replaced for ${targetPeriod.leaveReason || 'Teacher on Leave'}`,
        leaveApplicationId: targetPeriod.leaveAppId,
        remarks: assignRemarks || 'Assigned to available leisure teacher',
        academicYear: selectedAcademicYear,
        branchName: selectedBranch
      };

      const res: any = await assignTeacherSubstitutionApi(payload);
      if (res && res.success) {
        addToast('success', 'Teacher Replaced', `Class assigned to ${chosenTeacher?.teacherName || 'substitute teacher'}.`);
        setIsAssignModalOpen(false);
        await loadData();
      } else {
        addToast('error', 'Assignment Failed', res?.message || 'Could not assign substitution.');
      }
    } catch (err: any) {
      addToast('error', 'Assignment Error', err?.message || 'Failed to replace teacher.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Quick 1-Click Auto Replace All Uncovered Classes
  const handleAutoReplaceAll = async () => {
    setIsAutoReplacing(true);
    try {
      const payload = {
        date: selectedDate,
        academicYear: selectedAcademicYear,
        branchName: selectedBranch,
        remarks: 'Auto-Matched to Leisure Teachers'
      };

      const res: any = await autoReplaceTeacherSubstitutionsApi(payload);
      if (res && res.success) {
        const result = res.data;
        if (result.successfullyReplacedCount > 0) {
          addToast('success', 'Auto-Replacement Complete', `Replaced ${result.successfullyReplacedCount} periods with leisure faculty.`);
        } else if (result.totalUnassignedPeriods === 0) {
          addToast('info', 'All Covered', 'All periods for absent teachers are already replaced.');
        } else {
          addToast('warning', 'No Leisure Matches', 'No free leisure teachers available for the pending periods.');
        }
        await loadData();
      } else {
        addToast('error', 'Auto-Replace Failed', res?.message || 'Failed to auto-replace.');
      }
    } catch (err: any) {
      addToast('error', 'Auto-Replace Error', err?.message || 'Error running auto-replacement engine.');
    } finally {
      setIsAutoReplacing(false);
    }
  };

  // Cancel / Delete Substitution
  const handleCancelSubstitution = async (substitutionId: number) => {
    if (!window.confirm('Are you sure you want to cancel this teacher substitution?')) return;
    try {
      const res: any = await deleteTeacherSubstitutionApi(substitutionId);
      if (res && res.success) {
        addToast('info', 'Substitution Cancelled', 'The substitution assignment has been removed.');
        await loadData();
      }
    } catch (err: any) {
      addToast('error', 'Cancel Error', err?.message || 'Could not cancel substitution.');
    }
  };

  // Filtered absent schedules
  const filteredAbsentSchedules = useMemo(() => {
    return absentSchedules.filter(s => {
      const matchQuery =
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.leaveType.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      if (filterStatus === 'pending') {
        return s.pendingPeriodsCount > 0;
      }
      if (filterStatus === 'replaced') {
        return s.pendingPeriodsCount === 0 && s.totalPeriodsToday > 0;
      }
      return true;
    });
  }, [absentSchedules, searchQuery, filterStatus]);

  // Filtered Leisure Teachers inside modal
  const filteredLeisureTeachers = useMemo(() => {
    return leisureTeachers.filter(t =>
      t.teacherName.toLowerCase().includes(leisureSearch.toLowerCase()) ||
      t.department.toLowerCase().includes(leisureSearch.toLowerCase()) ||
      t.assignedSubjects.some(s => s.toLowerCase().includes(leisureSearch.toLowerCase()))
    );
  }, [leisureTeachers, leisureSearch]);

  const handlePrint = () => {
    window.print();
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="hidden print:block">
        <SchoolPrintHeader
          title="Daily Teacher Substitution & Leisure Replacement Register"
          subtitle={`Date: ${selectedDate} (${dayOfWeek}) • Academic Year: ${selectedAcademicYear || '2026-2027'}`}
        />
      </div>

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              Teacher Substitution & Leisure Replacement
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Daily proxy management for faculty on leave • <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedDate} ({dayOfWeek})</span>
            </p>
          </div>
        </div>

        {/* Date Selector & Action Controls Bar */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0">
          {/* Date Selector Pill */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                isToday
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Refresh Schedules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          {/* Print Register */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shadow-2xs cursor-pointer"
            title="Print Daily Substitution Slip"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* 1-Click Auto Replace All Button */}
          <button
            type="button"
            onClick={handleAutoReplaceAll}
            disabled={isAutoReplacing || metrics.pendingPeriods === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAutoReplacing ? 'animate-spin' : ''}`} />
            <span>{isAutoReplacing ? 'Matching...' : 'Auto-Replace All'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Card 1: Teachers on Leave */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent Faculty Today</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{metrics.totalAbsent}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Approved leaves & attendances</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Periods Needing Replacement */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Replacement</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{metrics.pendingPeriods}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Periods needing leisure teacher</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Replaced Periods */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Successfully Replaced</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.totalReplaced} <span className="text-xs font-normal text-slate-400">/ {metrics.totalPeriodsNeeding}</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.completionRate}%` }} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{metrics.completionRate}%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Leisure Teachers Available */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Substitutions</p>
            <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{substitutions.length}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Duties logged on this date</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search absent teacher, department, leave..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: `All Absent (${absentSchedules.length})` },
            { id: 'pending', label: `Needs Replacement (${metrics.pendingPeriods})` },
            { id: 'replaced', label: `Fully Covered` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === f.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Absent Teachers & Periods Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-card p-12 rounded-2xl text-center border border-slate-200/80 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Loading daily schedules & leaves...</p>
          </div>
        ) : filteredAbsentSchedules.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center border border-slate-200/80 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">No Absent Teachers Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              All faculty members are present or no approved leaves match {selectedDate} ({dayOfWeek}).
            </p>
          </div>
        ) : (
          filteredAbsentSchedules.map(schedule => {
            const isAllCovered = schedule.pendingPeriodsCount === 0 && schedule.totalPeriodsToday > 0;

            return (
              <div
                key={schedule.teacherId}
                className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
              >
                {/* Teacher Summary Banner */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center font-black text-sm">
                      {schedule.teacherName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">{schedule.teacherName}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          {schedule.leaveType}
                        </span>
                        {schedule.isHalfDay && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                            Half Day
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Dept: {schedule.department}</span>
                        <span>•</span>
                        <span>Reason: {schedule.leaveReason || 'On Leave'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Periods Today</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {schedule.replacedPeriodsCount} / {schedule.totalPeriodsToday} Replaced
                      </p>
                    </div>
                    {isAllCovered ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> All Covered
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {schedule.pendingPeriodsCount} Uncovered
                      </span>
                    )}
                  </div>
                </div>

                {/* Periods Grid / Table for this Teacher */}
                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {schedule.periods.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium">
                      No timetable classes scheduled for this teacher on {dayOfWeek}.
                    </div>
                  ) : (
                    schedule.periods.map(period => (
                      <div
                        key={period.slotId || `${period.periodName}-${period.timeSlot}`}
                        className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 -mx-4 px-4 rounded-xl transition-colors"
                      >
                        {/* Class & Period Details */}
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {period.periodName} ({period.timeSlot})
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300">
                                {period.className} - {period.sectionName}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                {period.subjectName}
                              </span>
                              {period.roomNo && (
                                <span className="text-[11px] font-medium text-slate-400">
                                  {period.roomNo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Replacement Status & Quick Action Buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                          {period.isReplaced && period.activeSubstitution ? (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Replaced with
                                </span>
                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                  {period.activeSubstitution.substituteTeacherName}
                                </p>
                              </div>
                              <button
                                onClick={() => handleCancelSubstitution(period.activeSubstitution.substitutionId!)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Remove substitution"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Quick Top Leisure Recommendation preview */}
                              {period.availableLeisureTeachers && period.availableLeisureTeachers.length > 0 ? (
                                <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-500 mr-2">
                                  <span className="font-bold text-sky-600 dark:text-sky-400">
                                    {period.availableLeisureTeachers.length} Leisure Faculty Free
                                  </span>
                                </div>
                              ) : null}

                              <button
                                onClick={() =>
                                  handleOpenAssignModal(
                                    schedule.teacherId,
                                    schedule.teacherName,
                                    schedule.leaveReason,
                                    schedule.leaveApplicationId,
                                    period
                                  )
                                }
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 transition-all"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Assign Leisure Teacher</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Active Substitutions Duty Log / Register Table */}
      {substitutions.length > 0 && (
        <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Active Substitution Duty Log ({selectedDate})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Time & Period</th>
                  <th className="py-2.5 px-3">Class & Section</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Absent Teacher (On Leave)</th>
                  <th className="py-2.5 px-3">Substitute Teacher (Leisure)</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3 text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {substitutions.map(sub => (
                  <tr key={sub.substitutionId || sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      <div>{sub.periodName || 'Period'}</div>
                      <div className="text-[10px] text-slate-400">{sub.timeSlot}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-sky-600 dark:text-sky-400">
                      {sub.className} - {sub.sectionName || sub.section}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {sub.subjectName || sub.subject}
                    </td>
                    <td className="py-3 px-3 text-rose-600 dark:text-rose-400 font-bold">
                      {sub.originalTeacherName}
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{sub.substituteTeacherName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{sub.roomNo || '-'}</td>
                    <td className="py-3 px-3 text-right no-print">
                      <button
                        onClick={() => handleCancelSubstitution(sub.substitutionId!)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Cancel Duty"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Assign Leisure Teacher */}
      {isAssignModalOpen && targetPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-600" />
                  Select Leisure Teacher Replacement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Replacing <span className="font-bold text-rose-600">{targetPeriod.absentTeacherName}</span> for{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{targetPeriod.period.className}-{targetPeriod.period.sectionName} ({targetPeriod.period.subjectName})</span>
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Period Info Card */}
              <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-sky-900 dark:text-sky-300">Period Timing:</span>{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">{targetPeriod.period.timeSlot} ({dayOfWeek})</span>
                </div>
                <div>
                  <span className="font-bold text-sky-900 dark:text-sky-300">Room:</span>{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">{targetPeriod.period.roomNo || 'Main Classroom'}</span>
                </div>
              </div>

              {/* Leisure Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter available leisure teachers by name or subject..."
                  value={leisureSearch}
                  onChange={e => setLeisureSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {/* List of Available Leisure Teachers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Available Leisure Faculty ({filteredLeisureTeachers.length})</span>
                  <span>Workload Today</span>
                </div>

                {loadingLeisure ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
                    Finding faculty at leisure...
                  </div>
                ) : filteredLeisureTeachers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    No teaching faculty are at leisure (free period) during this time slot.
                  </div>
                ) : (
                  filteredLeisureTeachers.map(teacher => {
                    const isSelected = selectedLeisureTeacherId === teacher.teacherId;

                    return (
                      <div
                        key={teacher.teacherId}
                        onClick={() => setSelectedLeisureTeacherId(teacher.teacherId)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-500 ring-2 ring-sky-500/20'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              isSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {teacher.teacherName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                {teacher.teacherName}
                              </h4>
                              {teacher.isSubjectMatch && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-0.5">
                                  <Award className="w-2.5 h-2.5" /> Subject Match
                                </span>
                              )}
                              {teacher.isDepartmentMatch && !teacher.isSubjectMatch && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                                  Same Dept
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {teacher.department} • {teacher.assignedSubjects.join(', ') || teacher.designation}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {teacher.todaySubstitutionsCount} Subs Assigned
                          </span>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Free Period Now
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Optional Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Instructions for Substitute (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Conduct chapter 4 revision test..."
                  value={assignRemarks}
                  onChange={e => setAssignRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={isAssigning || !selectedLeisureTeacherId}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAssigning ? 'Replacing...' : 'Assign & Replace Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
