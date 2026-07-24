import React, { useState } from 'react';
import { Clock, Plus, Edit, Trash2, X, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { TimetableSlot } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const TimetableView: React.FC = () => {
  const { timetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, staff, academicClasses, subjects } = useData();
  const { addToast } = useToast();

  const [selectedClass, setSelectedClass] = useState(academicClasses[0]?.name || 'Class 10');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimetableSlot | null>(null);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const parseSortable = (ts: string) => {
    const match = ts.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 9999;
    let [_, h, m, p] = match;
    let hr = parseInt(h);
    if (p.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (p.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return hr * 60 + parseInt(m);
  };

  const parseTo24 = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '09:00';
    let [_, h, m, p] = match;
    let hr = parseInt(h);
    if (p.toUpperCase() === 'PM' && hr !== 12) hr += 12;
    if (p.toUpperCase() === 'AM' && hr === 12) hr = 0;
    return `${hr.toString().padStart(2, '0')}:${m}`;
  };

  const formatTo12 = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    hr = hr ? hr : 12;
    return `${hr.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const classTimetable = timetable.filter(t => t.className === selectedClass);
  const timeSlots = Array.from(new Set(classTimetable.map(t => t.timeSlot))).sort((a, b) => parseSortable(a) - parseSortable(b));

  const [formData, setFormData] = useState<Partial<TimetableSlot>>({
    day: 'Monday',
    timeSlot: '08:30 AM - 09:15 AM',
    className: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    teacherName: 'Jonathan Miller',
    roomNo: 'Room 101'
  });

  const handleOpenAdd = (day?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday', slot?: string) => {
    setEditingSlot(null);
    if (slot) {
      const parts = slot.split('-');
      setStartTime(parseTo24(parts[0]?.trim() || '08:30'));
      setEndTime(parseTo24(parts[1]?.trim() || '09:15'));
    } else {
      setStartTime('');
      setEndTime('');
    }
    setFormData({
      day: day || 'Monday',
      timeSlot: slot || '',
      className: selectedClass,
      section: '',
      subject: '',
      teacherName: '',
      roomNo: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: TimetableSlot) => {
    setEditingSlot(t);
    setFormData(t);
    const parts = t.timeSlot.split('-');
    setStartTime(parseTo24(parts[0]?.trim() || '08:30'));
    setEndTime(parseTo24(parts[1]?.trim() || '09:15'));
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.teacherName) return;

    const timeSlotStr = `${formatTo12(startTime)} - ${formatTo12(endTime)}`;
    const finalData = { ...formData, timeSlot: timeSlotStr };

    if (editingSlot) {
      updateTimetableSlot(editingSlot.id, finalData);
      addToast('success', 'Schedule Updated', `Updated ${finalData.subject} slot`);
    } else {
      addTimetableSlot(finalData as Omit<TimetableSlot, 'id'>);
      addToast('success', 'Schedule Added', `Added ${finalData.subject} to ${finalData.day}`);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 rounded-lg hidden sm:block">
            <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Timetable Management</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage daily schedules for all classes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="appearance-none pr-10 pl-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow cursor-pointer min-w-[140px] shadow-sm"
            >
              {academicClasses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4 inline-block mr-1" /> Add Slot
          </button>
        </div>
      </div>

      <div className="glass-card bg-white dark:bg-[#0B1121] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50 flex flex-col">
        <div className="w-full px-6 flex-1 py-4">
          <div className="overflow-x-auto py-2">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/50">
                <th className="py-3.5 px-4">Time Slot</th>
                {days.map(d => (
                  <th key={d} className="py-3.5 px-4 text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-medium">
              {timeSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm">No timetable slots have been added for this class yet.</p>
                    <p className="text-xs mt-1">Click <span className="font-bold text-brand-600 dark:text-brand-400">+ Add Slot</span> above to begin building the schedule.</p>
                  </td>
                </tr>
              ) : (
                timeSlots.map(slot => (
                <tr key={slot} className="text-slate-700 dark:text-white border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <td className="py-4 px-2 font-mono font-bold whitespace-nowrap">{slot}</td>
                  {days.map(day => {
                    const match = timetable.find(t => t.day === day && t.timeSlot === slot && t.className === selectedClass);
                    return (
                      <td key={day} className="py-4 px-2 text-center align-middle">
                        {match ? (
                          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-transparent space-y-1 relative group text-left mx-auto w-40 hover:shadow-md transition-shadow">
                            <p className="font-extrabold text-slate-900 dark:text-white truncate">{match.subject}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{match.teacherName}</p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                                {match.roomNo}
                              </span>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800/50 rounded-md p-1">
                                <button onClick={() => handleOpenEdit(match)} className="text-brand-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeletingSlot(match)} className="text-rose-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAdd(day as any, slot)}
                            className="text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 italic text-[11px] hover:underline"
                          >
                            + Assign
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Day</label>
                  <div className="relative">
                    <select
                      value={formData.day}
                      onChange={e => setFormData({ ...formData, day: e.target.value as any })}
                      className="appearance-none w-full pr-10 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Subject Name *</label>
                <div className="relative">
                  <select
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="appearance-none w-full pr-10 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="">Select a Subject</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.name}>{sub.name} ({sub.subjectId})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Teacher</label>
                <div className="relative">
                  <select
                    value={formData.teacherName}
                    onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                    className="appearance-none w-full pr-10 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="">Select Teacher</option>
                    {staff.map(st => (
                      <option key={st.id} value={`${st.firstName} ${st.lastName}`}>{st.firstName} {st.lastName}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Room / Lab No</label>
                <input
                  type="text"
                  value={formData.roomNo}
                  onChange={e => setFormData({ ...formData, roomNo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 dark:text-white bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-brand-600 dark:bg-[#020617] hover:bg-brand-700 dark:hover:bg-black rounded-xl shadow-md transition-colors">
                  {editingSlot ? 'Save Changes' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSlot}
        title="Delete Schedule Slot"
        message={`Are you sure you want to delete ${deletingSlot?.subject} on ${deletingSlot?.day}?`}
        onConfirm={() => {
          if (deletingSlot) {
            deleteTimetableSlot(deletingSlot.id);
            addToast('success', 'Slot Removed');
            setDeletingSlot(null);
          }
        }}
        onCancel={() => setDeletingSlot(null)}
      />
    </div>
  );
};
