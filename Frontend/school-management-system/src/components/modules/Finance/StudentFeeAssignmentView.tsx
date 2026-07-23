import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { UserPlus, Search, CheckSquare, Square, CheckCircle, ArrowRight } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const StudentFeeAssignmentView: React.FC = () => {
  const { students, dynamicFeeStructures, studentFeeAssignments, assignFeeStructure, bulkAssignFeeStructure, removeStudentFeeAssignment, academicClasses } = useData();
  const { addToast } = useToast();

  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [query, setQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetStructureId, setTargetStructureId] = useState<string>(dynamicFeeStructures[0]?.id || '');

  const filteredStudents = students.filter(s => {
    const matchesClass = s.className === selectedClass;
    const matchesSection = selectedSection === 'All' || s.section === selectedSection;
    const matchesQuery = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) || s.admissionNo.toLowerCase().includes(query.toLowerCase());
    return matchesClass && matchesSection && matchesQuery;
  });

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    if (selectedStudentIds.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one student for bulk fee assignment.');
      return;
    }
    if (!targetStructureId) {
      addToast('warning', 'Select Fee Structure', 'Please select a fee structure to assign.');
      return;
    }

    bulkAssignFeeStructure(selectedStudentIds, targetStructureId);
    addToast('success', 'Fee Structure Assigned', `Assigned structure to ${selectedStudentIds.length} students.`);
    setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-sky-500" /> Student Fee Assignment
        </h2>
        <p className="text-xs text-slate-500">Assign standard fee structures to individual students or in bulk across Class & Section filters</p>
      </div>

      {/* Filter & Bulk Control Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
          <div>
            <label className="block font-semibold text-slate-500 mb-0.5">Class Grade</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
            >
              {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-0.5">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="All">All Sections</option>
            </select>
          </div>

          <div className="relative pt-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-7" />
            <input
              type="text"
              placeholder="Search student or adm no..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none w-56"
            />
          </div>
        </div>

        {/* Bulk Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
          <select
            value={targetStructureId}
            onChange={e => setTargetStructureId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            {dynamicFeeStructures.map(dfs => (
              <option key={dfs.id} value={dfs.id}>
                {dfs.className} - {formatCurrency(dfs.totalAmount)} ({dfs.studentCategory})
              </option>
            ))}
          </select>

          <button
            onClick={handleBulkAssign}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 shrink-0"
          >
            <CheckCircle className="w-4 h-4" /> Bulk Assign ({selectedStudentIds.length})
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">
                  <button onClick={handleSelectAll} className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Class & Sec</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Assigned Fee Structure</th>
                <th className="py-3.5 px-4">Base Fee Total</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredStudents.map(st => {
                const isSelected = selectedStudentIds.includes(st.id);
                const assignment = studentFeeAssignments.find(a => a.studentId === st.id && a.status === 'Active');
                const dfs = assignment ? dynamicFeeStructures.find(d => d.id === assignment.feeStructureId) : null;

                return (
                  <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''}`}>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggleSelect(st.id)}>
                        {isSelected ? <CheckSquare className="w-4 h-4 text-sky-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <img src={st.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      {st.firstName} {st.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{st.className}-{st.section}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">{st.category || 'General'}</td>
                    <td className="py-3 px-4">
                      {assignment ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          {dfs ? dfs.className : 'Standard Assigned'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-bold">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(assignment ? assignment.baseFeeTotal : st.totalFee || 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (targetStructureId) {
                            assignFeeStructure(st.id, targetStructureId);
                            addToast('success', 'Fee Structure Assigned', `Updated fee structure for ${st.firstName}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1 ml-auto"
                      >
                        Assign <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
