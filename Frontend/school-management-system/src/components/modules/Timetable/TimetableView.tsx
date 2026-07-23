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
    <div className="animate-in fade-in h-full bg-white dark:bg-[#0B1121] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/50">
      <div className="flex justify-end items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800/50">
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-transparent focus:ring-2 focus:ring-brand-500"
        >
          <option value="Class 9">Class 9 Schedule</option>
          <option value="Class 10">Class 10 Schedule</option>
          <option value="Class 11">Class 11 Schedule</option>
          <option value="Class 12">Class 12 Schedule</option>
        </select>

        <button
          onClick={() => handleOpenAdd()}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-all border border-slate-200 dark:border-transparent"
        >
          <Plus className="w-4 h-4 inline-block mr-1" /> Add Slot
        </button>
      </div>

      <div className="w-full px-6">
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
              {timeSlots.map(slot => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-[13px]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Day</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Time Slot</label>
                  <select
                    value={formData.timeSlot}
                    onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-slate-700 dark:text-slate-200">Teacher</label>
                <select
                  value={formData.teacherName}
                  onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-transparent text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {staff.map(st => (
                    <option key={st.id} value={`${st.firstName} ${st.lastName}`}>{st.firstName} {st.lastName}</option>
                  ))}
                </select>
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
