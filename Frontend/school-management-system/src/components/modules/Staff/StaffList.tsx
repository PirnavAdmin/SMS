import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  Users, Search, Filter, Plus, Edit, Trash2, Eye,
  IndianRupee, CheckCircle, XCircle, ChevronLeft, ChevronRight
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

export const StaffList: React.FC = () => {
  const { staff, updateStaff, deleteStaff, customRoles } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffPayroll, setStaffPayroll] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const filtered = staff.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) || s.empId.toLowerCase().includes(query.toLowerCase());
    const deptMatch = filterDept === 'All' || s.department === filterDept;
    const roleMatch = filterRole === 'All' || (s.role || 'Teacher') === filterRole;
    return nameMatch && deptMatch && roleMatch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleStatus = (s: Staff) => {
    const nextStatus = s.status === 'Active' ? 'Inactive' : 'Active';
    updateStaff(s.id, { status: nextStatus as any });
    addToast('info', 'Status Updated', `${s.firstName} is now ${nextStatus}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Faculty & Staff HR Directory
          </h2>
          <p className="text-xs text-slate-500">Manage teacher profiles, documents, bank details, and payroll slips</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={staff} filename="staff_directory" />
          <button
            onClick={() => { setStaffToEdit(null); setIsAddOpen(true); }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search staff by name or emp ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Dept:</span>
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              {Array.from(new Set(staff.map(s => s.department).filter(Boolean))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Role:</span>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              {Array.from(new Set(staff.map(s => s.role || 'Teacher').filter(Boolean))).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Emp ID & Dept</th>
                <th className="py-3.5 px-4">Docs & Bank</th>
                <th className="py-3.5 px-4">Salary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No staff records found.</td></tr>
              ) : (
                paginated.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={st.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</p>
                          <p className="text-[10px] text-slate-400">{st.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {st.empId}
                      <span className="block text-[10px] text-slate-400 font-sans">{st.department} / {st.role || 'Teacher'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-emerald-600 block">
                        {st.documents?.length || 0} Docs Uploaded
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {st.bankDetails?.bankName ? 'Bank Set' : 'No Bank Info'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(st.salary)}/mo
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleStatus(st)}>
                        <Badge variant={st.status === 'Active' ? 'success' : 'neutral'}>
                          {st.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStaff(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Full HR Profile (Docs & Bank)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStaffPayroll(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600"
                          title="Payroll & Payslip"
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setStaffToEdit(st); setIsAddOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600"
                          title="Edit Basic Info"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStaffToDelete(st)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                          title="Delete Staff Record"
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

        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">Showing {paginated.length} of {filtered.length} staff members</span>
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
        title="Delete Staff Record"
        message={`Are you sure you want to delete ${staffToDelete?.firstName} ${staffToDelete?.lastName}?`}
        onConfirm={() => {
          if (staffToDelete) {
            deleteStaff(staffToDelete.id);
            addToast('success', 'Staff Member Deleted');
            setStaffToDelete(null);
          }
        }}
        onCancel={() => setStaffToDelete(null)}
      />
    </div>
  );
};
