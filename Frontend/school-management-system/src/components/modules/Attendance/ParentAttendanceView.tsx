import React, { useState, useMemo } from 'react';
import { CalendarCheck, Calendar, Filter, User, AlertCircle, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { DailyAttendance } from '../../../types';

export const ParentAttendanceView: React.FC = () => {
  const { students, attendance } = useData();
  const { user, role } = useAuth();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  // Filters state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027'); // Mock academic year

  const academicYears = ['2024-2025', '2025-2026', '2026-2027'];
  const months = [
    { value: '0', label: 'January' }, { value: '1', label: 'February' },
    { value: '2', label: 'March' }, { value: '3', label: 'April' },
    { value: '4', label: 'May' }, { value: '5', label: 'June' },
    { value: '6', label: 'July' }, { value: '7', label: 'August' },
    { value: '8', label: 'September' }, { value: '9', label: 'October' },
    { value: '10', label: 'November' }, { value: '11', label: 'December' },
  ];
  const years = ['2024', '2025', '2026'];

  // Match children for Parent/Student role
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (
      role === 'Student' ? s.id === user?.id :
      (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
    )
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
  }

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  // Static Fallback Attendance Data for Demonstration
  const staticFallbackAttendance: DailyAttendance[] = [
    { id: 'mock-att-1', date: `${selectedYear}-${(parseInt(selectedMonth)+1).toString().padStart(2, '0')}-02`, entityType: 'Student', entityId: currentWard.id, status: 'Present' },
    { id: 'mock-att-2', date: `${selectedYear}-${(parseInt(selectedMonth)+1).toString().padStart(2, '0')}-03`, entityType: 'Student', entityId: currentWard.id, status: 'Present' },
    { id: 'mock-att-3', date: `${selectedYear}-${(parseInt(selectedMonth)+1).toString().padStart(2, '0')}-04`, entityType: 'Student', entityId: currentWard.id, status: 'Absent', remarks: 'Sick leave' },
    { id: 'mock-att-4', date: `${selectedYear}-${(parseInt(selectedMonth)+1).toString().padStart(2, '0')}-05`, entityType: 'Student', entityId: currentWard.id, status: 'Present' },
    { id: 'mock-att-5', date: `${selectedYear}-${(parseInt(selectedMonth)+1).toString().padStart(2, '0')}-06`, entityType: 'Student', entityId: currentWard.id, status: 'Late', remarks: 'Bus delay' },
  ];

  // Filter attendance for the selected child and the selected month/year
  const rawWardAttendance = useMemo(() => {
    return attendance.filter(a => {
      if (a.entityType !== 'Student' || a.entityId !== currentWard.id) return false;
      
      const recordDate = new Date(a.date);
      const isMatchMonth = recordDate.getMonth().toString() === selectedMonth;
      const isMatchYear = recordDate.getFullYear().toString() === selectedYear;
      
      return isMatchMonth && isMatchYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, currentWard.id, selectedMonth, selectedYear]);

  const wardAttendance = rawWardAttendance.length > 0 ? rawWardAttendance : staticFallbackAttendance;

  // Statistics
  const totalDays = wardAttendance.length;
  const presentDays = wardAttendance.filter(a => a.status === 'Present').length;
  const absentDays = wardAttendance.filter(a => a.status === 'Absent').length;
  const lateDays = wardAttendance.filter(a => a.status === 'Late').length;
  const halfDays = wardAttendance.filter(a => a.status === 'HalfDay').length;
  const leaveDays = wardAttendance.filter(a => a.status === 'Leave').length;

  const attendancePercentage = totalDays > 0 
    ? Math.round(((presentDays + lateDays + (halfDays * 0.5)) / totalDays) * 100) 
    : 0;

  const getStatusConfig = (status: DailyAttendance['status']) => {
    switch (status) {
      case 'Present':
        return { color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 };
      case 'Absent':
        return { color: 'rose', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', icon: AlertCircle };
      case 'Late':
        return { color: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: Clock };
      case 'HalfDay':
        return { color: 'sky', bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', icon: CalendarDays };
      case 'Leave':
        return { color: 'sky', bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', icon: CalendarCheck };
      default:
        return { color: 'slate', bg: 'bg-slate-50', text: 'text-slate-700', icon: AlertCircle };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-3 bg-sky-100 dark:bg-sky-500/20 rounded-2xl">
              <CalendarCheck className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            </div>
            Attendance Register
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Track daily attendance records and statistics.
          </p>
        </div>
      </div>

      {/* Multiple Wards Tabs (Only for Parent Role with >1 ward) */}
      {role === 'Parent' && parentWards.length > 1 && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800'
              }`}
            >
              {ward.firstName} {ward.lastName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 min-w-[200px] w-full">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Academic Year
          </label>
          <select 
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
          >
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] w-full">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Month
          </label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] w-full">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Year
          </label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-16 h-16 text-sky-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Attendance %</h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{attendancePercentage}%</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Present</h3>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{presentDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Absent</h3>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{absentDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Late</h3>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{lateDays + leaveDays}</p>
        </div>
      </div>

      {/* Detailed Attendance List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Records</h3>
          <div className="flex items-center gap-3">
            {rawWardAttendance.length === 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                Demo Data
              </span>
            )}
            <div className="text-sm font-medium text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {wardAttendance.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-lg">No attendance records found.</p>
              <p className="text-sm">There are no records marked by the teacher for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.</p>
            </div>
          ) : (
            wardAttendance.map(record => {
              const config = getStatusConfig(record.status);
              const StatusIcon = config.icon;
              
              return (
                <div key={record.id} className="px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                      </h4>
                      {record.remarks && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          Teacher Note: {record.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold border border-current/20 ${config.bg} ${config.text}`}>
                    {record.status}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
