import React, { useState } from 'react';
import { X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Student, TransferDetails } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface TransferredOutModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransferredOutModal: React.FC<TransferredOutModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { transferOutStudent } = useData();
  const { addToast } = useToast();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lastAY, setLastAY] = useState<string>('2025-2026');
  const [reason, setReason] = useState<string>('Moved to another city / institution');
  const [destinationSchool, setDestinationSchool] = useState<string>('St. Xavier International School');
  const [tcRequired, setTcRequired] = useState<boolean>(true);
  const [tcNo, setTcNo] = useState<string>(`TC-TRF-${student.admissionNo}`);
  const [remarks, setRemarks] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const details: TransferDetails = {
      transferDate: date,
      lastAcademicYear: lastAY,
      lastClass: student.className,
      lastSection: student.section,
      reason,
      destinationSchool,
      tcRequired,
      tcNo: tcRequired ? tcNo : undefined,
      remarks
    };

    transferOutStudent(student.id, details);
    addToast('success', 'Transferred Out', `Marked ${student.firstName} ${student.lastName} as Transferred Out.`);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Transfer Student Out
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {student.firstName} {student.lastName} ({student.admissionNo})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Transfer Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Last Academic Year</label>
              <input type="text" value={lastAY} onChange={e => setLastAY(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Destination School Name *</label>
            <input type="text" value={destinationSchool} onChange={e => setDestinationSchool(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" required />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Reason for Transfer *</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">TC Required?</label>
              <div className="flex items-center gap-4 py-1.5 font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="tcTrf" checked={tcRequired} onChange={() => setTcRequired(true)} />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="tcTrf" checked={!tcRequired} onChange={() => setTcRequired(false)} />
                  <span>No</span>
                </label>
              </div>
            </div>
            {tcRequired && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">TC Reference No.</label>
                <input type="text" value={tcNo} onChange={e => setTcNo(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium font-mono" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Remarks</label>
            <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold shadow-md hover:bg-amber-700">Confirm Transfer Out</button>
          </div>
        </form>
      </div>
    </div>
  );
};
