import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface AssignClassSubjectModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignClassSubjectModal: React.FC<AssignClassSubjectModalProps> = ({ staff, isOpen, onClose }) => {
  const { updateStaff } = useData();
  const { addToast } = useToast();

  const [classesStr, setClassesStr] = useState(staff?.assignedClasses.join(', ') || 'Class 10-A, Class 11-B');
  const [subjectsStr, setSubjectsStr] = useState(staff?.assignedSubjects.join(', ') || 'Mathematics, Physics');

  if (!isOpen || !staff) return null;

  const handleSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const assignedClasses = classesStr.split(',').map(s => s.trim()).filter(Boolean);
    const assignedSubjects = subjectsStr.split(',').map(s => s.trim()).filter(Boolean);

    updateStaff(staff.id, { assignedClasses, assignedSubjects });
    addToast('success', 'Allocations Updated', `Updated subject & class assignments for ${staff.firstName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Classes & Subjects</h3>
              <p className="text-xs text-slate-500">Configure academic teaching workload</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">{staff.firstName} {staff.lastName}</p>
            <p className="text-slate-500">{staff.designation} • {staff.department}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Classes (Comma separated)
            </label>
            <input
              type="text"
              value={classesStr}
              onChange={e => setClassesStr(e.target.value)}
              placeholder="Class 10-A, Class 9-B"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Subjects (Comma separated)
            </label>
            <input
              type="text"
              value={subjectsStr}
              onChange={e => setSubjectsStr(e.target.value)}
              placeholder="Mathematics, Physics"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-500/20"
            >
              Save Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
