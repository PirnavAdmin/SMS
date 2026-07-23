import React, { useState } from 'react';
import { Clock, Plus, Edit, Trash2, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { TimetableSlot } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const TimetableView: React.FC = () => {
  const { timetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, staff } = useData();
  const { addToast } = useToast();

  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimetableSlot | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['08:30 AM - 09:15 AM', '09:15 AM - 10:00 AM', '10:15 AM - 11:00 AM'];

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
    setFormData({
      day: day || 'Monday',
      timeSlot: slot || '08:30 AM - 09:15 AM',
      className: selectedClass,
      section: 'A',
      subject: 'Mathematics',
      teacherName: staff[0]?.firstName ? `${staff[0].firstName} ${staff[0].lastName}` : 'Jonathan Miller',
      roomNo: 'Room 101'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: TimetableSlot) => {
    setEditingSlot(t);
    setFormData(t);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.teacherName) return;

    if (editingSlot) {
      updateTimetableSlot(editingSlot.id, formData);
      addToast('success', 'Schedule Updated', `Updated ${formData.subject} slot`);
    } else {
      addTimetableSlot(formData as Omit<TimetableSlot, 'id'>);
      addToast('success', 'Schedule Added', `Added ${formData.subject} to ${formData.day}`);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500" /> Class & Teacher Timetable Schedule
          </h2>
          <p className="text-xs text-slate-500">Weekly class routine, teacher allocations, and room assignments</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-slate-700"
          >
            <option value="Class 9">Class 9 Schedule</option>
            <option value="Class 10">Class 10 Schedule</option>
            <option value="Class 11">Class 11 Schedule</option>
            <option value="Class 12">Class 12 Schedule</option>
          </select>

          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Time Slot</th>
                {days.map(d => (
                  <th key={d} className="py-3.5 px-4 text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {timeSlots.map(slot => (
                <tr key={slot} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{slot}</td>
                  {days.map(day => {
                    const match = timetable.find(t => t.day === day && t.timeSlot === slot && t.className === selectedClass);
                    return (
                      <td key={day} className="py-3 px-4 text-center">
                        {match ? (
                          <div className="p-2.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 space-y-1 relative group">
                            <p className="font-extrabold text-brand-700 dark:text-brand-300">{match.subject}</p>
                            <p className="text-[10px] text-slate-500">{match.teacherName}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {match.roomNo}
                              </span>
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                <button onClick={() => handleOpenEdit(match)} className="text-brand-600 hover:text-brand-700"><Edit className="w-3 h-3" /></button>
                                <button onClick={() => setDeletingSlot(match)} className="text-rose-600 hover:text-rose-700"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAdd(day as any, slot)}
                            className="text-slate-400 hover:text-indigo-600 italic text-[11px] hover:underline"
                          >
                            + Assign
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Day</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Time Slot</label>
                  <select
                    value={formData.timeSlot}
                    onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teacher</label>
                <select
                  value={formData.teacherName}
                  onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                >
                  {staff.map(st => (
                    <option key={st.id} value={`${st.firstName} ${st.lastName}`}>{st.firstName} {st.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Room / Lab No</label>
                <input
                  type="text"
                  value={formData.roomNo}
                  onChange={e => setFormData({ ...formData, roomNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md">
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
