import React, { useState } from 'react';
import { X, UserX, AlertCircle, Calendar, Shield, FileText } from 'lucide-react';
import { Student, DiscontinuationDetails } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface DiscontinueStudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DiscontinueStudentModal: React.FC<DiscontinueStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { discontinueStudent } = useData();
  const { addToast } = useToast();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [discontinuationAY, setDiscontinuationAY] = useState<string>('2026-2027');
  const [lastAY, setLastAY] = useState<string>('2025-2026');
  const [reason, setReason] = useState<string>('Personal / Relocation');
  const [customReason, setCustomReason] = useState<string>('');
  const [tcRequired, setTcRequired] = useState<boolean>(true);
  const [tcNo, setTcNo] = useState<string>(`TC-DIS-${student.admissionNo}`);
  const [authorizedBy, setAuthorizedBy] = useState<string>('Principal Office');
  const [remarks, setRemarks] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason) {
      addToast('warning', 'Missing Field', 'Please provide a discontinuation reason.');
      return;
    }

    const details: DiscontinuationDetails = {
      discontinuationDate: date,
      discontinuationAcademicYear: discontinuationAY,
      lastAcademicYear: lastAY,
      lastClass: student.className,
      lastSection: student.section,
      reason: finalReason,
      remarks,
      tcRequired,
      tcNo: tcRequired ? tcNo : undefined,
      authorizedBy
    };

    discontinueStudent(student.id, details);
    addToast('success', 'Student Discontinued', `Marked ${student.firstName} ${student.lastName} as Discontinued. Not converted to Alumni.`);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-md">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Discontinue Student Record
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {student.firstName} {student.lastName} ({student.admissionNo}) • {student.className}-{student.section}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Discontinued status stops active enrollment without deleting historical academic records. This student will <strong>NOT</strong> be added to Alumni.
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Discontinuation Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Discontinuation Academic Year <span className="text-rose-500 font-bold ml-0.5">*</span></label>
              <input
                type="text"
                value={discontinuationAY}
                onChange={(e) => setDiscontinuationAY(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                placeholder="2026-2027"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Last Attended Academic Year
              </label>
              <input
                type="text"
                value={lastAY}
                onChange={(e) => setLastAY(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Last Class & Section
              </label>
              <input
                type="text"
                value={`${student.className}-${student.section}`}
                disabled
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 font-bold text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Reason for Discontinuation <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            >
              <option value="Personal / Relocation">Personal / Relocation</option>
              <option value="Financial Reasons">Financial Reasons</option>
              <option value="Medical Health Issues">Medical Health Issues</option>
              <option value="Parent Job Transfer">Parent Job Transfer</option>
              <option value="Joined Another School">Joined Another School</option>
              <option value="Other">Other (Custom Reason)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Custom Reason Details <span className="text-rose-500 font-bold ml-0.5">*</span></label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                TC Required?
              </label>
              <div className="flex items-center gap-4 py-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="tcReq"
                    checked={tcRequired}
                    onChange={() => setTcRequired(true)}
                    className="rounded-full text-rose-600"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="tcReq"
                    checked={!tcRequired}
                    onChange={() => setTcRequired(false)}
                    className="rounded-full text-rose-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {tcRequired && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  TC Reference No.
                </label>
                <input
                  type="text"
                  value={tcNo}
                  onChange={(e) => setTcNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium font-mono"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Authorized By <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional administrative notes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              Confirm Discontinuation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
