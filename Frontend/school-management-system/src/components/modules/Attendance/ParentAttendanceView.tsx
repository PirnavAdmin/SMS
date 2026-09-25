// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, Calendar, Filter, User, AlertCircle, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { DailyAttendance } from '../../../types';
import { useParentWards, ParentStudentSelector } from '../../common/ParentStudentSelector';

export const ParentAttendanceView: React.FC = () => {
  const { studentAttendance = [], attendance: rawAttendance, fetchStudentAttendanceData } = useData();
  const attendance = rawAttendance || studentAttendance || [];
  const { role } = useAuth();
  const parentWards = useParentWards();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filters state
  const currentDate = new Date();
  const [filterType, setFilterType] = useState<'Month' | 'Day' | 'Custom'>('Month');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  
  const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(currentDate.toISOString().split('T')[0]);

  const months = [
    { value: '0', label: 'January' }, { value: '1', label: 'February' },
    { value: '2', label: 'March' }, { value: '3', label: 'April' },
    { value: '4', label: 'May' }, { value: '5', label: 'June' },
    { value: '6', label: 'July' }, { value: '7', label: 'August' },
    { value: '8', label: 'September' }, { value: '9', label: 'October' },
    { value: '10', label: 'November' }, { value: '11', label: 'December' },
  ];
  const years = ['2024', '2025', '2026'];

  useEffect(() => {
    if (fetchStudentAttendanceData) {
      fetchStudentAttendanceData();
    }
  }, [fetchStudentAttendanceData]);

  // Listen for real-time attendance updates
  const [registryVersion, setRegistryVersion] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setRegistryVersion(v => v + 1);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('attendance_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('attendance_updated', handleUpdate);
    };
  }, []);

  const combinedAttendance = useMemo(() => {
    const list: any[] = [];
    const seenDateKeys = new Set<string>();

    // 1. From studentAttendance in DataContext
    (studentAttendance || []).forEach(a => {
      const d = String(a.date || '').split('T')[0];
      const sId = String(a.studentId || a.id || '');
      const key = `${sId}_${d}`;
      seenDateKeys.add(key);
      list.push({
        ...a,
        date: d,
        studentId: sId,
        entityType: 'Student'
      });
    });

    // 2. From rawAttendance in DataContext
    (rawAttendance || []).forEach(a => {
      const d = String(a.date || '').split('T')[0];
      const sId = String(a.studentId || a.entityId || '');
      const key = `${sId}_${d}`;
      if (!seenDateKeys.has(key)) {
        seenDateKeys.add(key);
        list.push({
          ...a,
          date: d,
          studentId: sId,
          entityType: a.entityType || 'Student'
        });
      }
    });

    return list;
  }, [studentAttendance, rawAttendance, registryVersion]);

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  // Filter real attendance for the selected child and the selected month/year/day
  const rawWardAttendance = useMemo(() => {
    if (!currentWard) return [];
    const wardId = String(currentWard.id || '').trim();
    const wardStudentId = String((currentWard as any).studentId || '').trim();
    const wardRoll = String(currentWard.rollNo || '').trim();
    const wardAdm = String(currentWard.admissionNo || '').trim();

    return combinedAttendance.filter(a => {
      const isStudentEntity = !a.entityType || a.entityType === 'Student';
      if (!isStudentEntity) return false;

      const recId = String(a.studentId || a.entityId || a.id || '').trim().toLowerCase();
      const recRoll = String(a.rollNo || '').trim().toLowerCase();
      const recAdm = String(a.admissionNo || '').trim().toLowerCase();
      const recName = String(a.studentName || '').trim().toLowerCase();

      const wardIdStr = wardId.toLowerCase();
      const wardStudentIdStr = wardStudentId.toLowerCase();
      const wardRollStr = wardRoll.toLowerCase();
      const wardAdmStr = wardAdm.toLowerCase();
      const wardNameStr = String(currentWard.studentName || `${currentWard.firstName || ''} ${currentWard.lastName || ''}`).trim().toLowerCase();

      const isChildMatch = (
        (recId && (recId === wardIdStr || recId === wardStudentIdStr || recId === wardRollStr || recId === wardAdmStr)) ||
        (recRoll && (recRoll === wardRollStr || recRoll === wardIdStr || recRoll === wardAdmStr)) ||
        (recAdm && (recAdm === wardAdmStr || recAdm === wardIdStr || recAdm === wardRollStr)) ||
        (recName && wardNameStr && (recName === wardNameStr || recName.includes(wardNameStr) || wardNameStr.includes(recName)))
      );
      if (!isChildMatch) return false;
      
      const recDateParts = String(a.date || '').split('T')[0].split('-');
      if (recDateParts.length !== 3) return false;
      const recYear = recDateParts[0];
      const recMonth = String(parseInt(recDateParts[1], 10) - 1);
      const recDateStr = `${recDateParts[0]}-${recDateParts[1]}-${recDateParts[2]}`;

      if (filterType === 'Month') {
        const isMatchMonth = recMonth === selectedMonth;
        const isMatchYear = recYear === selectedYear;
        return isMatchMonth && isMatchYear;
      } else if (filterType === 'Day') {
        return recDateStr === selectedDate;
      } else if (filterType === 'Custom') {
        return recDateStr >= startDate && recDateStr <= endDate;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [combinedAttendance, currentWard, filterType, selectedMonth, selectedYear, selectedDate, startDate, endDate]);

  const wardAttendance = rawWardAttendance;

  const filteredRecords = useMemo(() => {
    return wardAttendance.filter(record => statusFilter === 'All' || record.status === statusFilter);
  }, [wardAttendance, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filterType, selectedMonth, selectedYear, selectedDate, startDate, endDate, selectedChildIdx]);

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active wards found in the system.
      </div>
    );
  }

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
    <div className="space-y-4 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 rounded-xl">
              <CalendarCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            Attendance
          </h1>
        </div>
      </div>

      {/* Multiple Wards Tabs */}
      <ParentStudentSelector
        wards={parentWards}
        selectedIndex={selectedChildIdx}
        onSelect={setSelectedChildIdx}
      />

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 min-w-[150px] w-full">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">View By</label>
          <select 
            value={filterType} onChange={(e) => setFilterType(e.target.value as 'Month' | 'Day' | 'Custom')}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
          >
            <option value="Day">Daily</option>
            <option value="Month">Monthly</option>
            <option value="Custom">Custom Range</option>
          </select>
        </div>

        {filterType === 'Month' && (
            <>
              <div className="flex-1 min-w-[150px] w-full">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Month</label>
                <select 
                  value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
                >
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px] w-full">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Year</label>
                <select 
                  value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
                >
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </>
          )}

          {filterType === 'Day' && (
             <div className="flex-1 min-w-[150px] w-full sm:max-w-xs">
               <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Date</label>
               <input 
                 type="date" 
                 value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
               />
             </div>
          )}

          {filterType === 'Custom' && (
            <>
             <div className="flex-1 min-w-[150px] w-full sm:max-w-xs">
               <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
               <input 
                 type="date" 
                 value={startDate} onChange={(e) => setStartDate(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
               />
             </div>
             <div className="flex-1 min-w-[150px] w-full sm:max-w-xs">
               <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
               <input 
                 type="date" 
                 value={endDate} onChange={(e) => setEndDate(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500/50 outline-none"
               />
             </div>
            </>
          )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-12 h-12 text-sky-600" />
          </div>
          <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Attendance %</h3>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{attendancePercentage}%</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Present</h3>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Absent</h3>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{absentDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Late</h3>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateDays + leaveDays}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Half Day</h3>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-400">{halfDays}</p>
        </div>
      </div>

      {/* Detailed Attendance List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Records</h3>
            {rawWardAttendance.length === 0 && filterType === 'Month' && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                Demo Data
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center flex-wrap gap-2">
              {['All', 'Present', 'Absent', 'Late', 'HalfDay'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    statusFilter === status 
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {status === 'HalfDay' ? 'Half Day' : status}
                </button>
              ))}
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <div className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap">
              {filterType === 'Month' ? `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}` : filterType === 'Day' ? selectedDate : `${startDate} to ${endDate}`}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-base">No attendance records found.</p>
              <p className="text-xs mt-1">There are no records matching your selected filter criteria.</p>
            </div>
          ) : (
            paginatedRecords.map(record => {
              const config = getStatusConfig(record.status);
              const StatusIcon = config.icon;
              
              return (
                <div key={record.id} className="px-4 py-3 sm:px-5 sm:py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {(() => {
                          const parts = String(record.date).split('T')[0].split('-').map(Number);
                          if (parts.length === 3) {
                            return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
                          }
                          return record.date;
                        })()}
                      </h4>
                      {record.remarks && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          Teacher Note: {record.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border border-current/20 ${config.bg} ${config.text}`}>
                    {record.status}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-xs font-medium text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
