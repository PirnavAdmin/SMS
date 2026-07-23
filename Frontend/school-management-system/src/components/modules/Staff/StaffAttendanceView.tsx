import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Save, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { DailyAttendance, Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const StaffAttendanceView: React.FC = () => {
  const { staff, attendance, markAttendance, leaveApplications, holidays } = useData();
  const { addToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDept, setFilterDept] = useState('All');
  const [query, setQuery] = useState('');

  // Daily state map: employeeId -> status ('Present' | 'Absent' | 'Late' | 'HalfDay' | 'Leave')
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Leave'>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  // Derive unique departments
  const uniqueDepts = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));

  // Check if date is holiday
  const holidayEvent = holidays.find(h => date >= h.startDate && date <= h.endDate);

  // Helper: check if employee has approved leave on this date
  const getApprovedLeave = (empId: string, checkDate: string) => {
    return (leaveApplications || []).find(
      app => app.employeeId === empId && app.status === 'Approved' && checkDate >= app.fromDate && checkDate <= app.toDate
    );
  };

  // Populate local maps when date, staff, or attendance changes
  useEffect(() => {
    const newMap: typeof attendanceMap = {};
    const newRemarks: typeof remarksMap = {};

    staff.forEach(s => {
      // 1. Check if approved leave exists
      const leave = getApprovedLeave(s.id, date);
      if (leave) {
        newMap[s.id] = leave.isHalfDay ? 'HalfDay' : 'Leave';
        newRemarks[s.id] = `Approved Leave: ${leave.leaveTypeName}`;
        return;
      }

      // 2. Check if attendance already recorded
      const existing = attendance.find(
        r => r.entityType === 'Staff' && r.entityId === s.id && r.date === date
      );
      if (existing) {
        newMap[s.id] = existing.status;
        newRemarks[s.id] = existing.remarks || '';
      } else {
        newMap[s.id] = 'Present'; // Default status
        newRemarks[s.id] = '';
      }
    });

    setAttendanceMap(newMap);
    setRemarksMap(newRemarks);
  }, [date, staff, attendance, leaveApplications]);

  const handleStatusChange = (empId: string, status: typeof attendanceMap[string]) => {
    // Prevent overriding approved leaves
    if (getApprovedLeave(empId, date)) return;

    setAttendanceMap(prev => ({ ...prev, [empId]: status }));
  };

  const handleRemarksChange = (empId: string, text: string) => {
    setRemarksMap(prev => ({ ...prev, [empId]: text }));
  };

  const handleSave = () => {
    const records: DailyAttendance[] = staff.map(s => ({
      date,
      entityType: 'Staff',
      entityId: s.id,
      status: attendanceMap[s.id] || 'Present',
      remarks: remarksMap[s.id] || ''
    }));

    markAttendance(records);
    addToast('success', 'Attendance Logged', `Successfully updated staff attendance for ${date}`);
  };

  const filteredStaff = staff.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) || s.empId.toLowerCase().includes(query.toLowerCase());
    const deptMatch = filterDept === 'All' || s.department === filterDept;
    return nameMatch && deptMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" /> Daily Staff Attendance
          </h2>
          <p className="text-xs text-slate-500">Record and review daily attendance logs for teaching and support employees</p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all self-start sm:self-center"
        >
          <Save className="w-4 h-4" /> Save Attendance Log
        </button>
      </div>

      {/* Date & Filter Row */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-500">Attendance Date:</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border outline-none font-bold text-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search staff..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border outline-none"
            />
          </div>

          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border cursor-pointer outline-none font-semibold"
          >
            <option value="All">All Departments</option>
            {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Holiday warning banner */}
      {holidayEvent && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5" />
          <span>Note: Selected date is configured as a school holiday: **{holidayEvent.name}** ({holidayEvent.type} Holiday)</span>
        </div>
      )}

      {/* Attendance Grid Sheet */}
      <div className="glass-card rounded-2xl overflow-hidden border shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Emp ID</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4 text-center">Attendance Logs</th>
              <th className="py-3.5 px-4">Remarks / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium text-xs">
            {filteredStaff.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">No employee files match this query.</td></tr>
            ) : (
              filteredStaff.map(s => {
                const leave = getApprovedLeave(s.id, date);
                const isLocked = !!leave;
                const status = attendanceMap[s.id] || 'Present';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-900">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-slate-400">{s.role || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{s.empId}</td>
                    <td className="py-3 px-4 text-slate-500">{s.department}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center items-center gap-1">
                        {(['Present', 'Late', 'HalfDay', 'Absent', 'Leave'] as const).map(st => {
                          const isSelected = status === st;
                          const disabled = isLocked && st !== 'Leave' && st !== 'HalfDay';
                          
                          let activeStyle = '';
                          if (st === 'Present') activeStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20';
                          else if (st === 'Absent') activeStyle = 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20';
                          else if (st === 'Late') activeStyle = 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20';
                          else if (st === 'HalfDay') activeStyle = 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20';
                          else if (st === 'Leave') activeStyle = 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20';

                          return (
                            <button
                              key={st}
                              disabled={disabled}
                              onClick={() => handleStatusChange(s.id, st)}
                              className={`px-2.5 py-1.5 rounded-lg border font-bold text-[10px] transition-all ${
                                isSelected ? activeStyle : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {st === 'Present' ? 'P' : (st === 'Absent' ? 'A' : (st === 'Late' ? 'L' : (st === 'HalfDay' ? 'HD' : 'LV')))}
                            </button>
                          );
                        })}
                        {leave && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded ml-2">
                            {leave.isHalfDay ? 'Half Day Leave' : 'On Leave'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder={isLocked ? 'Locked by approved leave' : 'Add private notes...'}
                        value={remarksMap[s.id] || ''}
                        onChange={e => handleRemarksChange(s.id, e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-50 border outline-none disabled:bg-slate-100 disabled:cursor-not-allowed text-[11px]"
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
  );
};
export default StaffAttendanceView;
