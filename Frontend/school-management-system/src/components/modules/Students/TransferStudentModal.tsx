import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface TransferStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({ student, isOpen, onClose }) => {
  const { transferStudent } = useData();
  const { addToast } = useToast();
  const [reason, setReason] = useState('Parent relocation to another city');

  if (!isOpen || !student) return null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transferStudent(student.id, reason);
    addToast('info', 'Transfer Certificate Issued', `Issued TC for ${student.firstName} ${student.lastName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Issue Transfer Certificate</h3>
              <p className="text-xs text-slate-500">Generate TC & change student status to Transferred</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
            <p className="text-slate-500">Adm No: {student.admissionNo} • Class: {student.className}-{student.section}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Transfer / TC Issue</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-500/20"
            >
              Issue TC & Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
