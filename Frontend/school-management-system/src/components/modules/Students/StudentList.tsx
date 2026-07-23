import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  UserCheck, Search, Filter, Edit, Trash2, ArrowUpRight, ArrowRightLeft,
  Eye, Building2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { StudentFormModal } from './StudentFormModal';
import { StudentProfileDrawer } from './StudentProfileDrawer';
import { PromoteStudentModal } from './PromoteStudentModal';
import { TransferStudentModal } from './TransferStudentModal';
import { BRANCHES } from '../../../utils/validation';

export const StudentList: React.FC = () => {
  const { students, deleteStudent, academicClasses } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Dynamic sections based on Class model
  const availableSections = filterClass === 'All'
    ? Array.from(new Set(academicClasses.flatMap(c => c.sections)))
    : (academicClasses.find(c => c.name === filterClass)?.sections || ['A', 'B', 'C']);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToPromote, setStudentToPromote] = useState<Student | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const filtered = students.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
                      s.rollNo.toLowerCase().includes(query.toLowerCase()) ||
                      s.admissionNo.toLowerCase().includes(query.toLowerCase());
    const classMatch = filterClass === 'All' || s.className === filterClass;
    const sectionMatch = filterSection === 'All' || s.section === filterSection;
    const branchMatch = filterBranch === 'All' || (s.branch || 'Main Campus') === filterBranch;
    const statusMatch = filterStatus === 'All' || s.status === filterStatus;
    return nameMatch && classMatch && sectionMatch && branchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Student Management Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comprehensive student profiles, ID cards, branch transfers & filter-aware data export</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter-Aware Export Button */}
          <ExportButton data={filtered} filename="student_records" filteredCount={filtered.length} />
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, roll no, adm no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Branch:</span>
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Branches</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Class:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Classes</option>
              {academicClasses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Section:</span>
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Sec</option>
              {availableSections.map(sec => (
                <option key={sec} value={sec}>Sec {sec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Promoted">Promoted</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class & Roll</th>
                <th className="py-3.5 px-4">Branch / Campus</th>
                <th className="py-3.5 px-4">Guardian Contact</th>
                <th className="py-3.5 px-4">Fee Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">No matching student records found.</td></tr>
              ) : (
                paginated.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={st.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Adm: {st.admissionNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{st.className}-{st.section}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Roll: {st.rollNo}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 w-max">
                        <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> {st.branch || 'Main Campus'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 dark:text-slate-200">{st.fatherName}</p>
                      <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">{st.fatherPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${st.dueFee > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(st.dueFee)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={st.status === 'Active' ? 'success' : st.status === 'Promoted' ? 'info' : 'warning'}>
                        {st.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStudent(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Profile & Student ID Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setStudentToEdit(st); setIsEditOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToPromote(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                          title="Promote Class / Branch Transfer"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToTransfer(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400"
                          title="Issue Transfer Certificate (TC)"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(st)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Showing {paginated.length} of {filtered.length} filtered students</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-bold text-slate-900 dark:text-white">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Drawers & Modals */}
      <StudentFormModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setStudentToEdit(null); }}
        studentToEdit={studentToEdit}
      />

      <StudentProfileDrawer
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <PromoteStudentModal
        student={studentToPromote}
        isOpen={!!studentToPromote}
        onClose={() => setStudentToPromote(null)}
      />

      <TransferStudentModal
        student={studentToTransfer}
        isOpen={!!studentToTransfer}
        onClose={() => setStudentToTransfer(null)}
      />

      <ConfirmModal
        isOpen={!!studentToDelete}
        title="Delete Student Record"
        message={`Are you sure you want to delete student record for ${studentToDelete?.firstName} ${studentToDelete?.lastName}?`}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            addToast('success', 'Student Record Deleted');
            setStudentToDelete(null);
          }
        }}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
