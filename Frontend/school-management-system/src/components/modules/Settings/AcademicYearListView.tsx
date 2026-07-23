import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, CheckSquare, ShieldAlert, Sparkles } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { AcademicYear } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';

export const AcademicYearListView: React.FC = () => {
  const {
    academicYears,
    addAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    activateAcademicYear,
    closeAcademicYear
  } = useData();

  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  // Closing year validation checklist modal
  const [closingYear, setClosingYear] = useState<AcademicYear | null>(null);
  const [checklist, setChecklist] = useState({
    exams: false,
    fees: false,
    promotions: false,
    attendance: false
  });

  const [form, setForm] = useState<Partial<AcademicYear>>({
    name: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming'
  });

  const handleOpenAdd = () => {
    setEditingYear(null);
    setForm({
      name: '',
      startDate: '',
      endDate: '',
      status: 'Upcoming'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ay: AcademicYear) => {
    setEditingYear(ay);
    setForm(ay);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) return;

    if (editingYear) {
      updateAcademicYear(editingYear.id, form);
      addToast('success', 'Academic Year Updated');
    } else {
      addAcademicYear(form as Omit<AcademicYear, 'id'>);
      addToast('success', 'Academic Year Created');
    }
    setIsModalOpen(false);
  };

  const handleActivate = (ay: AcademicYear) => {
    activateAcademicYear(ay.id);
    addToast('success', 'Session Activated', `Academic Session ${ay.name} is now the primary Active year.`);
  };

  const handleCloseSession = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!closingYear) return;

    if (!checklist.exams || !checklist.fees || !checklist.promotions || !checklist.attendance) {
      addToast('warning', 'Checks Pending', 'All closure verification checklists must be confirmed before archiving.');
      return;
    }

    closeAcademicYear(closingYear.id);
    addToast('success', 'Session Archived', `Academic session ${closingYear.name} is now closed and set to read-only.`);
    setClosingYear(null);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic Years Registry</h3>
          <p className="text-xs text-slate-500">Configure academic sessions, activate upcoming terms, and close completed years</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Academic Year
        </button>
      </div>

      {/* Grid of Years */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {academicYears.map(ay => (
          <div key={ay.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start">
                <Badge variant={ay.status === 'Active' ? 'success' : (ay.status === 'Upcoming' ? 'purple' : 'neutral')}>{ay.status}</Badge>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(ay)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                  {ay.status !== 'Active' && (
                    <button onClick={() => deleteAcademicYear(ay.id)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>

              <h4 className="font-black text-base text-slate-900 dark:text-white mt-3">{ay.name} Session</h4>
              <div className="space-y-1 mt-2 text-slate-400">
                <p>Start Date: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{ay.startDate}</span></p>
                <p>End Date: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{ay.endDate}</span></p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              {ay.status === 'Upcoming' && (
                <button
                  onClick={() => handleActivate(ay)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Activate Session
                </button>
              )}
              {ay.status === 'Active' && (
                <button
                  onClick={() => {
                    setClosingYear(ay);
                    setChecklist({ exams: false, fees: false, promotions: false, attendance: false });
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Close & Archive Year
                </button>
              )}
              {ay.status === 'Closed' && (
                <span className="w-full text-center py-2 text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-xl">Read-Only History</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-purple-500" /> Save Academic Year
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Academic Year Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status *</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all">Save Year</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closure validation checklist modal */}
      {closingYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-black">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h3 className="text-base uppercase tracking-wider">Closure Verification</h3>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Archiving session **{closingYear.name}** is a permanent action. All marks, collection histories, and attendances will be locked as read-only. Verify all checklist fields:
            </p>

            <form onSubmit={handleCloseSession} className="space-y-4 font-semibold">
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.exams}
                    onChange={e => setChecklist({ ...checklist, exams: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                  />
                  <span>All exam grades & marks published?</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.fees}
                    onChange={e => setChecklist({ ...checklist, fees: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                  />
                  <span>Fee collections reconciled / dues carried forward?</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.promotions}
                    onChange={e => setChecklist({ ...checklist, promotions: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                  />
                  <span>All eligible students promoted to next classes?</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.attendance}
                    onChange={e => setChecklist({ ...checklist, attendance: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                  />
                  <span>Daily attendance logs finalized?</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setClosingYear(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black">Verify & Archive Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AcademicYearListView;
