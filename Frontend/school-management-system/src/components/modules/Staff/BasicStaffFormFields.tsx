import React from 'react';
import { useData } from '../../../context/DataContext';
import {
  BasicStaffFormState,
  branchOptions,
  employeeCategoryOptions,
  EmployeeCategory,
  employmentTypeOptions,
  getDepartmentOptions,
  getEmployeeCategoryLabel
} from './staffFlowOptions';

interface BasicStaffFormFieldsProps {
  value: BasicStaffFormState;
  errors?: Record<string, string>;
  onChange: (field: keyof BasicStaffFormState, value: string) => void;
  onCategoryChange: (value: EmployeeCategory | '') => void;
  employeeIdReadOnly?: boolean;
  compact?: boolean;
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-brand-500';

export const BasicStaffFormFields: React.FC<BasicStaffFormFieldsProps> = ({
  value,
  errors = {},
  onChange,
  onCategoryChange,
  employeeIdReadOnly = true,
  compact = false
}) => {
  const { designations } = useData();
  const departmentOptions = getDepartmentOptions(value.employeeCategory);
  const designationOptions = designations
    .filter(d => 
      d.status === 'Active' && 
      (d.employeeCategory === 'Both' || 
      (value.employeeCategory === 'Teacher' && d.employeeCategory === 'Teaching') || 
      (value.employeeCategory === 'Staff' && d.employeeCategory === 'Non-Teaching'))
    )
    .map(d => d.designationName);

  const gridClass = compact ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'grid grid-cols-1 gap-4 lg:grid-cols-2';

  return (
    <div className={gridClass}>
      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Employee Category <span className="text-rose-500">*</span>
        </label>
        <select value={value.employeeCategory} onChange={e => onCategoryChange(e.target.value as EmployeeCategory | '')} className={fieldClass}>
          <option value="">Select Employee Category</option>
          {employeeCategoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.employeeCategory && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.employeeCategory}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Employee ID <span className="text-rose-500">*</span>
        </label>
        <input readOnly={employeeIdReadOnly} value={value.empId} onChange={e => onChange('empId', e.target.value)} className={`${fieldClass} font-mono ${employeeIdReadOnly ? 'bg-slate-50 dark:bg-slate-900/60' : ''}`} />
        <p className="mt-1 text-[11px] text-slate-500">Auto-generated employee code.</p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          First Name <span className="text-rose-500">*</span>
        </label>
        <input value={value.firstName} onChange={e => onChange('firstName', e.target.value)} className={fieldClass} />
        {errors.firstName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.firstName}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Last Name <span className="text-rose-500">*</span>
        </label>
        <input value={value.lastName} onChange={e => onChange('lastName', e.target.value)} className={fieldClass} />
        {errors.lastName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.lastName}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Email <span className="text-rose-500">*</span>
        </label>
        <input type="email" value={value.email} onChange={e => onChange('email', e.target.value)} className={fieldClass} />
        {errors.email && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.email}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Mobile Number <span className="text-rose-500">*</span>
        </label>
        <input value={value.mobileNumber} onChange={e => onChange('mobileNumber', e.target.value)} className={fieldClass} />
        {errors.mobileNumber && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.mobileNumber}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Branch <span className="text-rose-500">*</span>
        </label>
        <select value={value.branch} onChange={e => onChange('branch', e.target.value)} className={fieldClass}>
          <option value="">Select Branch</option>
          {branchOptions.map(branch => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        {errors.branch && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.branch}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Department <span className="text-rose-500">*</span>
        </label>
        <select value={value.department} onChange={e => onChange('department', e.target.value)} className={fieldClass} disabled={!value.employeeCategory}>
          <option value="">{value.employeeCategory ? 'Select Department' : 'Select Employee Category First'}</option>
          {departmentOptions.map(dept => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        {errors.department && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.department}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Designation <span className="text-rose-500">*</span>
        </label>
        <select value={value.designation} onChange={e => onChange('designation', e.target.value)} className={fieldClass} disabled={!value.employeeCategory}>
          <option value="">{value.employeeCategory ? 'Select Designation' : 'Select Employee Category First'}</option>
          {designationOptions.map(designation => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>
        {errors.designation && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.designation}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Joining Date <span className="text-rose-500">*</span>
        </label>
        <input type="date" value={value.joiningDate} onChange={e => onChange('joiningDate', e.target.value)} className={fieldClass} />
        {errors.joiningDate && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.joiningDate}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Employment Type</label>
        <select value={value.employmentType} onChange={e => onChange('employmentType', e.target.value)} className={fieldClass}>
          <option value="">Select Employment Type</option>
          {employmentTypeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
        <select value={value.status} onChange={e => onChange('status', e.target.value as BasicStaffFormState['status'])} className={fieldClass}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">{getEmployeeCategoryLabel(value.employeeCategory)}</span>
          <span className="mx-2">•</span>
          The employee profile will remain incomplete until the employee finishes the self-service wizard after login.
        </div>
      </div>
    </div>
  );
};

export default BasicStaffFormFields;
