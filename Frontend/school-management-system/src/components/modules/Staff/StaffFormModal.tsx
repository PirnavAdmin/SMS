import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Staff | null;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, staffToEdit }) => {
  const { staff, addStaff, updateStaff, customRoles } = useData();
  const { addToast } = useToast();

  const defaultRoles = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'
  ];
  const allRoles = Array.from(new Set([...defaultRoles, ...(customRoles || []).map(r => r.name)]));

  const generateNextEmpId = () => {
    const empNumbers = staff
      .map(s => {
        const match = (s.empId || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = empNumbers.length > 0 ? Math.max(...empNumbers) : 0;
    const nextNum = maxNum + 1;
    return `EMP${String(nextNum).padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState<Partial<Staff>>({
    empId: '',
    firstName: '',
    lastName: '',
    designation: '',
    department: 'General',
    role: 'Teacher',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '15/05/1988',
    joiningDate: new Date().toISOString().split('T')[0],
    qualification: 'M.Sc. Mathematics, B.Ed.',
    experienceYears: 5,
    salary: 6500,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    address: 'Faculty Block, NY',
    assignedClasses: [],
    assignedSubjects: [],
    documents: [],
    bankDetails: {
      accountHolderName: '',
      accountNumber: 'XXXX-XXXX-9912',
      bankName: 'Chase Bank',
      branch: 'Main City',
      ifscCode: 'CHAS001'
    },
    leaveBalance: { casual: 10, sick: 10, paid: 15 }
  });

  useEffect(() => {
    if (isOpen) {
      if (staffToEdit) {
        setFormData(staffToEdit);
      } else {
        setFormData({
          empId: generateNextEmpId(),
          firstName: '',
          lastName: '',
          designation: '',
          department: 'General',
          role: 'Teacher',
          email: '',
          phone: '',
          gender: 'Male',
          dob: '15/05/1988',
          joiningDate: new Date().toISOString().split('T')[0],
          qualification: 'M.Sc. Mathematics, B.Ed.',
          experienceYears: 5,
          salary: 6500,
          status: 'Active',
          avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
          address: 'Faculty Block, NY',
          assignedClasses: [],
          assignedSubjects: [],
          documents: [],
          bankDetails: {
            accountHolderName: '',
            accountNumber: 'XXXX-XXXX-9912',
            bankName: 'Chase Bank',
            branch: 'Main City',
            ifscCode: 'CHAS001'
          },
          leaveBalance: { casual: 10, sick: 10, paid: 15 }
        });
      }
    }
  }, [isOpen, staffToEdit, staff]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      addToast('warning', 'Missing Fields', 'First name, last name, and email are required.');
      return;
    }

    if (staffToEdit) {
      updateStaff(staffToEdit.id, formData);
      addToast('success', 'Staff Updated', `Updated record for ${formData.firstName}`);
    } else {
      addStaff(formData as Omit<Staff, 'id'>);
      addToast('success', 'Staff Registered', `Hired ${formData.firstName} ${formData.lastName} (${formData.empId})`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {staffToEdit ? 'Edit Faculty Details' : 'Register New Staff Member'}
              </h3>
              <p className="text-xs text-slate-500">Employee HR profile & contract setup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Auto-Generated Employee ID */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Employee ID (Auto-Generated) *
            </label>
            <input
              type="text"
              required
              readOnly
              value={formData.empId}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">First Name *</label>
              <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Last Name *</label>
              <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Mathematics Teacher"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Role *</label>
              <select
                required
                value={formData.role || 'Teacher'}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium outline-none cursor-pointer"
              >
                {allRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Monthly Salary ($)</label>
              <input type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Birth (DD/MM/YYYY)</label>
              <input type="text" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md">
              {staffToEdit ? 'Save Changes' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
