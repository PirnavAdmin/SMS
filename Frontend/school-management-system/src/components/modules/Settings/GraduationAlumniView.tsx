import React, { useState } from 'react';
import { GraduationCap, Search, Check, FolderArchive, ShieldAlert } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';

export const GraduationAlumniView: React.FC = () => {
  const { students, studentEnrollments, graduateStudents, academicClasses } = useData();
  const { addToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'alumni'>('pending');
  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('Completed Class 10 Graduation Ceremony');

  // Pending graduation students: status is NOT Graduated/Alumni
  const pendingGraduation = students.filter(s =>
    (s as any).status !== 'Graduated' &&
    (s as any).status !== 'Alumni' &&
    (filterClass === 'All' || s.className === filterClass) &&
    (`${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
     s.admissionNo.toLowerCase().includes(query.toLowerCase()))
  );

  // Alumni list: status IS Graduated/Alumni
  const alumniList = students.filter(s =>
    ((s as any).status === 'Graduated' || (s as any).status === 'Alumni') &&
    (`${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
     s.admissionNo.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingGraduation.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleExecuteGraduation = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      addToast('warning', 'No Students Selected');
      return;
    }

    graduateStudents(selectedIds, remarks);
    addToast('success', 'Graduation Completed', `Archived ${selectedIds.length} students into Alumni list.`);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveSubTab('pending'); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'pending' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            Pending Graduation Cohort
          </button>
          <button
            onClick={() => { setActiveSubTab('alumni'); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'alumni' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            Alumni & Graduated Registry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name, admission no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none"
          />
        </div>

        {activeSubTab === 'pending' && (
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold outline-none cursor-pointer"
          >
            <option value="All">All Classes</option>
            {academicClasses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        )}
      </div>

      {activeSubTab === 'pending' ? (
        <form onSubmit={handleExecuteGraduation} className="space-y-6">
          <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs text-rose-600">Batch Graduation Parameters</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Graduation ceremony notes / remarks *</label>
                <input
                  type="text"
                  required
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-5 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === pendingGraduation.length && pendingGraduation.length > 0}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Active Class</th>
                    <th className="py-3 px-4">Active Section</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {pendingGraduation.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No pending cohorts match filters.</td>
                    </tr>
                  ) : (
                    pendingGraduation.map(s => {
                      const isSelected = selectedIds.includes(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => handleSelectOne(s.id, e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{s.admissionNo}</td>
                          <td className="py-3 px-4">{s.firstName} {s.lastName}</td>
                          <td className="py-3 px-4 font-semibold text-purple-600">{s.className}</td>
                          <td className="py-3 px-4">Section {s.section}</td>
                          <td className="py-3 px-4 font-mono">{s.fatherPhone}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" /> Graduate Selected ({selectedIds.length})
            </button>
          </div>
        </form>
      ) : (
        /* Alumni List */
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Archived Class</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Remarks / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {alumniList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No alumni records found.</td>
                  </tr>
                ) : (
                  alumniList.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{s.admissionNo}</td>
                      <td className="py-3 px-4">{s.firstName} {s.lastName}</td>
                      <td className="py-3 px-4 text-slate-500">{s.className} (Archived)</td>
                      <td className="py-3 px-4 font-mono">{s.phone}</td>
                      <td className="py-3 px-4 text-rose-500 italic">{s.remarks || 'Graduated'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default GraduationAlumniView;
