import React, { useEffect, useState } from 'react';
import { CheckCircle2, Edit3, Users, X } from 'lucide-react';
import { Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import {
  BasicStaffFormState,
  buildBasicStaffCreatePayload,
  buildBasicStaffUpdatePayload,
  defaultBasicStaffFormState,
  getNextEmployeeId
} from './staffFlowOptions';
import { BasicStaffFormFields } from './BasicStaffFormFields';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Staff | null;
  defaultCategory?: 'Teacher' | 'Staff';
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
  defaultCategory = 'Teacher'
}) => {
  const { staff, addStaff, updateStaff } = useData();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<BasicStaffFormState>(() => ({
    ...defaultBasicStaffFormState(defaultCategory),
    empId: getNextEmployeeId(staff)
  }));

  useEffect(() => {
    if (!isOpen) return;

    if (staffToEdit) {
      setForm({
        employeeCategory: staffToEdit.employeeCategory || defaultCategory,
        empId: staffToEdit.empId,
        firstName: staffToEdit.firstName || '',
        lastName: staffToEdit.lastName || '',
        email: staffToEdit.email || '',
        mobileNumber: staffToEdit.phone || '',
        branch: staffToEdit.branch || '',
        department: staffToEdit.department || '',
        designation: staffToEdit.designation || '',
        joiningDate: staffToEdit.joiningDate || new Date().toISOString().split('T')[0],
        employmentType: (staffToEdit as any).employmentType || 'Full Time',
        status: staffToEdit.status === 'Inactive' ? 'Inactive' : 'Active'
      });
    } else {
      setForm({
        ...defaultBasicStaffFormState(defaultCategory),
        empId: getNextEmployeeId(staff)
      });
    }
    setErrors({});
  }, [isOpen, staffToEdit, staff, defaultCategory]);

  const handleChange = (field: keyof BasicStaffFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCategoryChange = (value: BasicStaffFormState['employeeCategory']) => {
    setForm(prev => ({
      ...prev,
      employeeCategory: value,
      department: '',
      designation: ''
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const require = (key: string, condition: boolean, message: string) => {
      if (!condition) nextErrors[key] = message;
    };

    require('employeeCategory', !!form.employeeCategory, 'Employee category is required.');
    require('firstName', !!form.firstName.trim(), 'First name is required.');
    require('lastName', !!form.lastName.trim(), 'Last name is required.');
    require('email', !!form.email.trim(), 'Email is required.');
    require('mobileNumber', !!form.mobileNumber.trim(), 'Mobile number is required.');
    require('branch', !!form.branch.trim(), 'Branch is required.');
    require('department', !!form.department.trim(), 'Department is required.');
    require('designation', !!form.designation.trim(), 'Designation is required.');
    require('joiningDate', !!form.joiningDate.trim(), 'Joining date is required.');
    require('employmentType', !!form.employmentType.trim(), 'Employment type is required.');

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast('warning', 'Please complete the form', 'Required basic employee fields are missing.');
      return;
    }

    setSubmitting(true);

    if (staffToEdit) {
      updateStaff(staffToEdit.id, buildBasicStaffUpdatePayload(form));
      addToast('success', 'Employee updated', 'Basic employee details were saved successfully.');
    } else {
      const added = addStaff(buildBasicStaffCreatePayload(form));
      addToast('success', 'Employee created', `${added.firstName} ${added.lastName} has been added to the directory.`);
    }

    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="sm">Staff Record</Badge>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  {staffToEdit ? 'Edit Basic Details' : 'Staff Registration'}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                {staffToEdit ? 'Edit Basic Employee Details' : 'Create Employee'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep this form short. Detailed personal and profile information is completed by the employee after login.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-96px)] overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5">
              <BasicStaffFormFields
                value={form}
                errors={errors}
                onChange={handleChange}
                onCategoryChange={handleCategoryChange}
                employeeIdReadOnly
                compact
              />

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-600/20 disabled:opacity-70"
                >
                  {submitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {staffToEdit ? 'Save Changes' : 'Create Employee'}
                    </>
                  )}
                </button>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                    {staffToEdit ? <Edit3 className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-900 dark:text-white">
                      {form.firstName || 'First Name'} {form.lastName || 'Last Name'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {form.employeeCategory ? (form.employeeCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff') : 'Select category'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Key Notes</p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>• Employee ID is auto-generated.</p>
                  <p>• Profile status starts as Incomplete.</p>
                  <p>• Employee portal details are completed later by the user.</p>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffFormModal;
