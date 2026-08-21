import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, Clock, Plus, Users, User, ShieldAlert, Search, Printer, Download, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Pagination } from '../../common/Pagination';

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

const LIBRARIAN_ATTENDANCE_KEY = 'edu_db_librarian_attendance';

const DEFAULT_LIBRARIAN_ATTENDANCE: LibrarianAttendanceRecord[] = [
  { id: 'ATT-LIB-101', staffId: 'EMP-LIB-01', staffName: 'Bhanu Prakash', role: 'Librarian', date: '2026-08-20', checkInTime: '08:30 AM', checkOutTime: '05:00 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Catalog audit & inventory completed' },
  { id: 'ATT-LIB-102', staffId: 'EMP-LIB-02', staffName: 'Rachel Green', role: 'Assistant Librarian', date: '2026-08-20', checkInTime: '08:45 AM', checkOutTime: '05:15 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Circulation desk duty' },
  { id: 'ATT-LIB-103', staffId: 'EMP-LIB-01', staffName: 'Bhanu Prakash', role: 'Librarian', date: '2026-08-19', checkInTime: '08:28 AM', checkOutTime: '05:05 PM', workingHours: '8.6 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Book issue renewals' },
  { id: 'ATT-LIB-104', staffId: 'EMP-LIB-02', staffName: 'Rachel Green', role: 'Assistant Librarian', date: '2026-08-19', checkInTime: '09:15 AM', checkOutTime: '05:00 PM', workingHours: '7.75 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Late', remarks: 'Traffic delay' },
  { id: 'ATT-LIB-105', staffId: 'EMP-LIB-01', staffName: 'Bhanu Prakash', role: 'Librarian', date: '2026-08-18', checkInTime: '08:30 AM', checkOutTime: '05:00 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'New book arrivals cataloging' },
  { id: 'ATT-LIB-106', staffId: 'EMP-LIB-02', staffName: 'Rachel Green', role: 'Assistant Librarian', date: '2026-08-18', checkInTime: '08:30 AM', checkOutTime: '05:00 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Fine collection reconciliation' }
];

export const LibrarianAttendanceView: React.FC = () => {
  const { user, role } = useAuth();
  const { staff } = useData();
  const { addToast } = useToast();

  const [librarianAttendance, setLibrarianAttendance] = useState<LibrarianAttendanceRecord[]>(() => {
    const s = localStorage.getItem(LIBRARIAN_ATTENDANCE_KEY);
    return s ? JSON.parse(s) : DEFAULT_LIBRARIAN_ATTENDANCE;
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

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Librarian Attendance</h2>
            <p className="text-xs text-slate-500 font-medium">Digital Shift Punch Desk & Master Attendance Log Registry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={() => addToast('success', 'Report Exported', 'Downloaded Librarian Attendance Log.')} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
            <Download className="w-4 h-4" /> Export Log
          </button>
        </div>
      </div>

      {/* Daily Shift Punch Control Banner */}
      <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-extrabold tracking-wider uppercase text-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Daily Shift Punch Desk
          </div>
          <h3 className="text-xl font-black">{currentStaffName} ({role || 'Librarian'})</h3>
          <p className="text-xs text-sky-100 font-medium">
            Today: <span className="font-mono font-bold">{todayStr}</span> • Shift: Morning Shift (08:30 AM - 05:00 PM)
          </p>
          {todayRecord && (
            <div className="flex items-center gap-3 pt-1 text-xs justify-center md:justify-start">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Checked In: {todayRecord.checkInTime}
              </span>
              {todayRecord.checkOutTime && (
                <span className="px-3 py-1 rounded-xl bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Checked Out: {todayRecord.checkOutTime}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {!todayRecord ? (
            <button
              onClick={() => {
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
                localStorage.setItem('teacher_check_in_time', now.toISOString());
                saveLibrarianAttendance([newRec, ...librarianAttendance]);
                addToast('success', 'Checked In', `Successfully checked in at ${timeStr}`);
              }}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4.5 h-4.5" /> Check In Now
            </button>
          ) : !todayRecord.checkOutTime ? (
            <button
              onClick={() => {
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const updated = librarianAttendance.map(r => {
                  if (r.id === todayRecord.id) {
                    return {
                      ...r,
                      checkOutTime: timeStr,
                      workingHours: '8.5 Hours',
                      remarks: (r.remarks || '') + ` • Checked out at ${timeStr}`
                    };
                  }
                  return r;
                });
                localStorage.setItem('teacher_check_out_time', now.toISOString());
                saveLibrarianAttendance(updated);
                addToast('success', 'Checked Out', `Successfully checked out at ${timeStr}`);
              }}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Clock className="w-4.5 h-4.5" /> Check Out Shift
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-black text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Shift Completed ({todayRecord.workingHours || '8.5 Hours'})
            </div>
          )}
        </div>
      </div>

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
                {mode} Sheet
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
            <Plus className="w-4 h-4" /> Add Punch Entry
          </button>
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
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{r.workingHours || '--'}</td>
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
              <CalendarCheck className="w-5 h-5 text-sky-500" /> Record Punch Entry
            </h3>
            <form onSubmit={e => {
              e.preventDefault();
              const newRec: LibrarianAttendanceRecord = {
                id: `ATT-LIB-${Date.now()}`,
                staffId: modalData?.staffId || 'EMP-LIB-01',
                staffName: modalData?.staffName || 'Bhanu Prakash',
                role: 'Librarian',
                date: modalData?.date || new Date().toISOString().split('T')[0],
                checkInTime: modalData?.checkInTime || '',
                checkOutTime: modalData?.checkOutTime || '',
                workingHours: modalData?.workingHours || (modalData?.checkInTime && modalData?.checkOutTime ? '8.5 Hours' : '--'),
                shift: modalData?.shift || 'Morning Shift (08:30 - 17:00)',
                status: modalData?.status || 'Present',
                remarks: modalData?.remarks || 'Manual shift entry'
              };
              saveLibrarianAttendance([newRec, ...librarianAttendance]);
              addToast('success', 'Attendance Recorded', `Recorded attendance punch for ${newRec.staffName}`);
              setModalType(null);
            }} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Staff Member *</label>
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
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Date *</label>
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
    </div>
  );
};

export default LibrarianAttendanceView;
