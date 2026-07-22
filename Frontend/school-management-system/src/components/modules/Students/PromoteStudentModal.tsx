import React, { useState } from 'react';
import { X, ArrowUpRight, Building2, Calendar, BookOpen } from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { BRANCHES } from '../../../utils/validation';

interface PromoteStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PromoteStudentModal: React.FC<PromoteStudentModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const { promoteStudent, academicClasses } = useData();
  const { addToast } = useToast();

  const [targetYear, setTargetYear] = useState('2026-2027');
  const [targetClass, setTargetClass] = useState(academicClasses[0]?.name || 'Class 11');
  const [targetSection, setTargetSection] = useState('A');
  const [enableBranchTransfer, setEnableBranchTransfer] = useState(false);
  const [targetBranch, setTargetBranch] = useState<string>(student?.branch || 'Main Campus');

  if (!isOpen || !student) return null;

  const targetClassModel = academicClasses.find(c => c.name === targetClass);
  const availableSections = targetClassModel?.sections || ['A', 'B', 'C'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    promoteStudent(
      student.id,
      targetClass,
      targetSection,
      targetYear,
      enableBranchTransfer ? targetBranch : student.branch
    );

    const message = enableBranchTransfer
      ? `Promoted ${student.firstName} to ${targetClass}-${targetSection} (${targetYear}) and transferred to ${targetBranch}`
      : `Promoted ${student.firstName} to ${targetClass}-${targetSection} (${targetYear})`;

    addToast('success', 'Student Promoted', message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Promote Student</h3>
              <p className="text-xs text-slate-500">{student.firstName} {student.lastName} ({student.className}-{student.section})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" /> New Academic Year *
            </label>
            <select
              value={targetYear}
              onChange={e => setTargetYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="2026-2027">2026-2027 (Next Term)</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-brand-600" /> New Class *
              </label>
              <select
                value={targetClass}
                onChange={e => {
                  const selectedCls = e.target.value;
                  const clsModel = academicClasses.find(c => c.name === selectedCls);
                  setTargetClass(selectedCls);
                  setTargetSection(clsModel?.sections[0] || 'A');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
              >
                {academicClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Section *</label>
              <select
                value={targetSection}
                onChange={e => setTargetSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
              >
                {availableSections.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch Transfer Option */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableBranchTransfer}
                onChange={e => setEnableBranchTransfer(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" /> Enable Branch Transfer
              </span>
            </label>

            {enableBranchTransfer && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Destination Branch / Campus</label>
                <select
                  value={targetBranch}
                  onChange={e => setTargetBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white"
                >
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 italic">
                  Branch transfer will update student's campus assignment while preserving full academic history.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md">
              Confirm Promotion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
