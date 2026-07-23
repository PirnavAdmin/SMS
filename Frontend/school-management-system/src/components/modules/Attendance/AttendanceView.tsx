import React, { useState } from 'react';
import { CalendarCheck, Users, CheckCircle2, XCircle, Clock, AlertTriangle, Fingerprint } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { DailyAttendance } from '../../../types';

export const AttendanceView: React.FC = () => {
  const { students, staff, attendance, markAttendance, academicClasses } = useData();
  const { addToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(academicClasses[0]?.name || 'Class 10');
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
  const [biometricOnline, setBiometricOnline] = useState(true);

  // Local state for grid edit
  const classStudents = students.filter(s => s.className === selectedClass);

  const getAttendanceStatus = (entityId: string): DailyAttendance['status'] => {
    const record = attendance.find(a => a.date === date && a.entityId === entityId);
    return record ? record.status : 'Present';
  };

  const handleSingleMark = (entityId: string, type: 'Student' | 'Staff', status: DailyAttendance['status']) => {
    markAttendance([{ date, entityId, entityType: type, status }]);
  };

  const markAllClass = (status: DailyAttendance['status']) => {
    const records: DailyAttendance[] = classStudents.map(s => ({
      date,
      entityId: s.id,
      entityType: 'Student',
      status
    }));
    markAttendance(records);
    addToast('success', 'Bulk Attendance Marked', `Set all ${selectedClass} students to ${status}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" /> Daily Attendance Register
          </h2>
          <p className="text-xs text-slate-500">Log student & staff daily attendance, view analytics, biometric sync status</p>
        </div>

        {/* Biometric Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <Fingerprint className={`w-4 h-4 ${biometricOnline ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          <span>Biometric Scanner: {biometricOnline ? 'Online Syncing' : 'Offline'}</span>
          <button
            onClick={() => setBiometricOnline(!biometricOnline)}
            className="ml-2 text-[10px] text-brand-600 underline font-bold"
          >
            Toggle
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'students' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Students Attendance
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'staff' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Staff & Faculty Attendance
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          {activeTab === 'students' && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Class Grade</label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              >
                {academicClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="flex items-center gap-1 mt-4">
              <button
                onClick={() => markAllClass('Present')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 text-[11px] font-bold"
              >
                All Present
              </button>
              <button
                onClick={() => markAllClass('Absent')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 text-[11px] font-bold"
              >
                All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'students' ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Showing students for {selectedClass} ({classStudents.length} Students)
            </span>
            <span className="text-slate-400">Date: {date}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classStudents.map(s => {
              const currentStatus = getAttendanceStatus(s.id);
              return (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={s.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                      <p className="text-[10px] text-slate-400">Roll: {s.rollNo} • Adm: {s.admissionNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSingleMark(s.id, 'Student', 'Present')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() => handleSingleMark(s.id, 'Student', 'Absent')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      onClick={() => handleSingleMark(s.id, 'Student', 'Late')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Late'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Staff & Faculty Attendance Directory ({staff.length} Members)
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {staff.map(stf => {
              const currentStatus = getAttendanceStatus(stf.id);
              return (
                <div key={stf.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={stf.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{stf.firstName} {stf.lastName}</p>
                      <p className="text-[10px] text-slate-400">{stf.designation} • {stf.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSingleMark(stf.id, 'Staff', 'Present')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() => handleSingleMark(stf.id, 'Staff', 'Absent')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      onClick={() => handleSingleMark(stf.id, 'Staff', 'On Leave' as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        currentStatus === 'Leave'
                          ? 'bg-sky-500 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      On Leave
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
