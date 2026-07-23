import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  Users, Search, Filter, Plus, Edit, Trash2, Eye,
  IndianRupee, ChevronLeft, ChevronRight, GraduationCap, Briefcase
} from 'lucide-react';
import { Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { StaffFormModal } from './StaffFormModal';
import { PayrollDrawer } from './PayrollDrawer';
import { StaffProfileDrawer } from './StaffProfileDrawer';

export const StaffList: React.FC<{ initialCategory?: 'Teacher' | 'Staff' }> = ({ initialCategory }) => {
  const { staff, updateStaff, deleteStaff, subjects } = useData();
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<'Teacher' | 'Staff'>(initialCategory || 'Teacher');

  // Filters state
  const [query, setQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterDesignation, setFilterDesignation] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffPayroll, setStaffPayroll] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  // Helper to categorize staff dynamically for backward compatibility
  const getStaffCategory = (s: Staff): 'Teacher' | 'Staff' => {
    return s.employeeCategory || (s.role === 'Teacher' ? 'Teacher' : 'Staff');
  };

  const categoryStaffList = staff.filter(s => getStaffCategory(s) === activeCategory);

  // Apply filters
  const filtered = categoryStaffList.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
                      s.empId.toLowerCase().includes(query.toLowerCase());
    const deptMatch = filterDept === 'All' || s.department === filterDept;
    
    const subjectMatch = activeCategory === 'Staff' ||
                         filterSubject === 'All' ||
                         s.assignedSubjects?.includes(filterSubject);
    
    const desigMatch = activeCategory === 'Teacher' ||
                       filterDesignation === 'All' ||
                       s.designation === filterDesignation;

    const branchMatch = filterBranch === 'All' ||
                        (s as any).branch === filterBranch;

    const statusMatch = filterStatus === 'All' ||
                        s.status === filterStatus;

    return nameMatch && deptMatch && subjectMatch && desigMatch && branchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleStatus = (s: Staff) => {
    const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
    updateStaff(s.id, { status: nextStatus as any });
    addToast('info', 'Status Updated', `${s.firstName} is now ${nextStatus}`);
  };

  // Derive filter lists from the current category list
  const uniqueDepts = Array.from(new Set(categoryStaffList.map(s => s.department).filter(Boolean)));
  const uniqueDesignations = Array.from(new Set(categoryStaffList.map(s => s.designation).filter(Boolean)));
  const uniqueBranches = Array.from(new Set(categoryStaffList.map(s => (s as any).branch).filter(Boolean)));

  const handleTabChange = (cat: 'Teacher' | 'Staff') => {
    setActiveCategory(cat);
    setFilterDept('All');
    setFilterSubject('All');
    setFilterDesignation('All');
    setFilterBranch('All');
    setFilterStatus('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Faculty & Staff HR Directory
          </h2>
          <p className="text-xs text-slate-500">Manage academic teachers, support workers, payroll records, and credentials</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={filtered} filename={`${activeCategory.toLowerCase()}_directory`} />
          <button
            onClick={() => { setStaffToEdit(null); setIsAddOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> {activeCategory === 'Teacher' ? 'Add Teacher' : 'Add Staff'}
          </button>
        </div>
      </div>

      {/* Top Segmented Tab Switches */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 max-w-xs border border-slate-200/40 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('Teacher')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'Teacher'
              ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Teachers ({staff.filter(s => getStaffCategory(s) === 'Teacher').length})
        </button>
        <button
          onClick={() => handleTabChange('Staff')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'Staff'
              ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Staff ({staff.filter(s => getStaffCategory(s) === 'Staff').length})
        </button>
      </div>

      {/* Advanced Filters Block */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Query search */}
          <div className="relative col-span-1 md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, employee ID..."
              value={query}
              onChange={e => { setQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* Department */}
          <div>
            <select
              value={filterDept}
              onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              {uniqueDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* Branch */}
          <div>
            <select
              value={filterBranch}
              onChange={e => { setFilterBranch(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Branches</option>
              {uniqueBranches.map(br => <option key={br} value={br}>{br}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic Second Filter Row */}
        {((activeCategory === 'Teacher' && subjects.length > 0) || (activeCategory === 'Staff' && uniqueDesignations.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {activeCategory === 'Teacher' ? (
              <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Subject:</span>
                <select
                  value={filterSubject}
                  onChange={e => { setFilterSubject(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold cursor-pointer outline-none"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Designation:</span>
                <select
                  value={filterDesignation}
                  onChange={e => { setFilterDesignation(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold cursor-pointer outline-none"
                >
                  <option value="All">All Designations</option>
                  {uniqueDesignations.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Directory Table Grid */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {activeCategory === 'Teacher' ? (
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Teacher</th>
                  <th className="py-3.5 px-4 font-mono">Employee ID</th>
                  <th className="py-3.5 px-4">Assigned Subjects</th>
                  <th className="py-3.5 px-4">Assigned Classes</th>
                  <th className="py-3.5 px-4">Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              ) : (
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4 font-mono">Employee ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No {activeCategory.toLowerCase()} records match search filters.
                  </td>
                </tr>
              ) : (
                paginated.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={st.avatar} alt="" className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</p>
                          <p className="text-[10px] text-slate-400">{st.role || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{st.empId}</td>
                    
                    {activeCategory === 'Teacher' ? (
                      <>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {st.assignedSubjects?.join(', ') || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                            {st.assignedClasses?.join(', ') || 'N/A'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">{st.department || 'N/A'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{st.designation || 'N/A'}</td>
                      </>
                    )}

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{formatCurrency(st.salary)}/mo</td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleStatus(st)}>
                        <Badge variant={st.status === 'Active' ? 'success' : (st.status === 'On Leave' ? 'warning' : 'neutral')}>
                          {st.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStaff(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStaffPayroll(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600"
                          title="Payroll Setup"
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setStaffToEdit(st); setIsAddOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600"
                          title="Edit Information"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStaffToDelete(st)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="Remove Record"
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

        {/* Pagination bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">Showing {paginated.length} of {filtered.length} employees</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-bold">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <StaffFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        staffToEdit={staffToEdit}
        defaultCategory={activeCategory}
      />

      <StaffProfileDrawer
        staff={selectedStaff}
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
      />

      <PayrollDrawer
        staff={staffPayroll}
        isOpen={!!staffPayroll}
        onClose={() => setStaffPayroll(null)}
      />

      <ConfirmModal
        isOpen={!!staffToDelete}
        title="Delete Employee Record"
        message={`Are you sure you want to remove ${staffToDelete?.firstName} ${staffToDelete?.lastName} from registry?`}
        onConfirm={() => {
          if (staffToDelete) {
            deleteStaff(staffToDelete.id);
            addToast('success', 'Employee deleted');
            setStaffToDelete(null);
          }
        }}
        onCancel={() => setStaffToDelete(null)}
      />
    </div>
  );
};
export default StaffList;
