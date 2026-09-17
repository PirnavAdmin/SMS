import React, { useState, useMemo } from 'react';
import { X, Building2 } from 'lucide-react';
import { Student, BranchTransferDetails } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface BranchTransferModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BranchTransferModal: React.FC<BranchTransferModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { branchTransferStudent, branches = [] } = useData();
  const { selectedBranch } = useAuth();
  const { addToast } = useToast();

  const availableBranches = useMemo(() => {
    const list = (branches || [])
      .filter((b: any) => b.status !== 'Inactive')
      .map((b: any) => b.name || b.branchName)
      .filter(Boolean);
    if (selectedBranch && !list.includes(selectedBranch)) {
      list.push(selectedBranch);
    }
    return Array.from(new Set(list));
  }, [branches, selectedBranch]);

  const targetBranches = useMemo(() => {
    return availableBranches.filter(b => b && b.toLowerCase() !== (student.branch || '').toLowerCase());
  }, [availableBranches, student.branch]);

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toBranch, setToBranch] = useState<string>(() => targetBranches[0] || '');
  const [reason, setReason] = useState<string>('Internal Organizational Allocation / Parent Request');
  const [remarks, setRemarks] = useState<string>('');

  React.useEffect(() => {
    if (!toBranch && targetBranches.length > 0) {
      setToBranch(targetBranches[0]);
    }
  }, [targetBranches, toBranch]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const details: BranchTransferDetails = {
      transferDate: date,
      fromBranch: student.branch || selectedBranch || '',
      toBranch,
      reason,
      remarks
    };

    branchTransferStudent(student.id, details);
    addToast('success', 'Branch Transferred', `Transferred ${student.firstName} ${student.lastName} to ${toBranch}. Student profile ID preserved.`);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Internal Branch Transfer
              </h3>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
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
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Transfer Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Current Branch</label>
              <input type="text" value={student.branch || selectedBranch || 'Unassigned'} disabled className="w-full px-3 py-2 rounded-xl border bg-slate-100 dark:bg-slate-900 font-bold text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Target Destination Branch <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <select value={toBranch} onChange={e => setToBranch(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold">
              {targetBranches.length === 0 ? (
                <option value="">No other branches configured</option>
              ) : (
                targetBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Reason for Branch Transfer <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" required />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Remarks</label>
            <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-md hover:bg-sky-700">Confirm Branch Transfer</button>
          </div>
        </form>
      </div>
    </div>
  );
};
