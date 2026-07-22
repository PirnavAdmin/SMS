import React, { useState } from 'react';
import { Clock, Search, AlertCircle, DollarSign } from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';

interface DueFeesViewProps {
  onCollectStudentFee: (student: Student) => void;
}

export const DueFeesView: React.FC<DueFeesViewProps> = ({ onCollectStudentFee }) => {
  const { students, calculateStudentPayableFee, academicClasses } = useData();

  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  const studentsWithDues = students.map(st => {
    const calc = calculateStudentPayableFee(st.id);
    return {
      student: st,
      calc
    };
  }).filter(item => {
    const due = item.calc ? item.calc.dueBalance : item.student.dueFee;
    const matchesQuery = `${item.student.firstName} ${item.student.lastName}`.toLowerCase().includes(query.toLowerCase()) || item.student.admissionNo.toLowerCase().includes(query.toLowerCase());
    const matchesClass = selectedClass === 'All' || item.student.className === selectedClass;
    return due > 0 && matchesQuery && matchesClass;
  });

  const totalOutstanding = studentsWithDues.reduce((acc, item) => acc + (item.calc ? item.calc.dueBalance : item.student.dueFee), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-rose-500" /> Outstanding Due Fees Matrix
          </h2>
          <p className="text-xs text-slate-500">Track pending tuition, transport, hostel & fine dues across all enrolled students</p>
        </div>

        <ExportButton data={studentsWithDues.map(i => ({ name: `${i.student.firstName} ${i.student.lastName}`, admissionNo: i.student.admissionNo, class: i.student.className, due: i.calc?.dueBalance }))} filename="outstanding_dues" />
      </div>

      {/* Summary KPI Banner */}
      <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">Total System Outstanding Dues</p>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">INR {totalOutstanding.toLocaleString()}</h3>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student or adm no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
        >
          <option value="All">All Class Grades</option>
          {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Dues Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Transport Due</th>
                <th className="py-3.5 px-4">Hostel Due</th>
                <th className="py-3.5 px-4">Fine Due</th>
                <th className="py-3.5 px-4">Total Net Due</th>
                <th className="py-3.5 px-4 text-right">Collect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {studentsWithDues.map(({ student: st, calc }) => (
                <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{st.className}-{st.section}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    INR {(calc?.transportFee || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    INR {(calc?.hostelFee || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-rose-500">
                    INR {(calc?.fineAmount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-black text-rose-600 dark:text-rose-400">
                    INR {(calc ? calc.dueBalance : st.dueFee).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onCollectStudentFee(st)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1 ml-auto"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Collect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
