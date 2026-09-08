// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '../../common/ConfirmModal';
import {
  AlertTriangle,
  BadgeIndianRupee,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Layers,
  Mail,
  Plus,
  ReceiptText,
  Search,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  X,
  ChevronDown,
  Wand2
} from 'lucide-react';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { Pagination } from '../../common/Pagination';
import { formatCurrency } from '../../../utils/currency';
import { exportToExcel } from '../../../utils/excelExport';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  EmployeeSalaryAssignment,
  Payslip,
  SalaryStructure,
  Staff
} from '../../../types';
import { PayrollDrawer } from './PayrollDrawer';

type PayrollTabId =
  | 'staff-payroll-employees'
  | 'staff-payroll-structures'
  | 'staff-payroll-payslips'
  | 'staff-payroll-history';

interface PayrollModuleViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

type CategoryValue = 'Teacher' | 'Staff';

type StructureDraft = {
  id?: string;
  structureName: string;
  employeeCategory: CategoryValue;
  staffId?: string;
  department?: string;
  designation: string;
  annualCtc?: string;
  basicPercentage: string;
  hraPercentage: string;
  status: 'Active' | 'Inactive';
  effectiveDate: string;
  payrollFrequency: 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Hourly' | 'Daily' | 'Per Class' | 'Contractual';
  salaryPaymentDay: string;
  pfApplicable: boolean;
  pfPercentage: string;
  esiApplicable: boolean;
  esiPercentage: string;
  professionalTaxApplicable: boolean;
  professionalTaxAmount: string;
  notes: string;
  basicSalary: string;
  hra: string;
  da: string;
  medicalAllowance: string;
  travelAllowance: string;
  specialAllowance: string;
  performanceAllowance: string;
  otherAllowance: string;
  employeePf: string;
  employerPf: string;
  esi: string;
  professionalTax: string;
  incomeTax: string;
  loanDeduction: string;
  otherDeduction: string;
};

type AssignmentDraft = {
  employeeId: string;
  employeeCategory: CategoryValue | '';
  designation: string;
  salaryStructureId: string;
  salaryOverride: boolean;
  basicSalary: string;
  allowances: string;
  deductions: string;
  effectiveDate: string;
};

const payrollTabs: { id: PayrollTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'staff-payroll-employees', label: 'Employees', icon: Users },
  { id: 'staff-payroll-structures', label: 'Salary Structures', icon: Layers },
  { id: 'staff-payroll-payslips', label: 'Generate Payslips', icon: ReceiptText },
  { id: 'staff-payroll-history', label: 'Payslip History', icon: Clock3 }
];



const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const currentYear = new Date().getFullYear();
const yearOptions = [String(currentYear), String(currentYear - 1), String(currentYear - 2)];
const roundOffOptions = ['No Round Off', 'Nearest 1', 'Nearest 10', 'Nearest 50'];

const inputClass =
  'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const selectClass =
  'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white appearance-none cursor-pointer';

const SelectField: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ value, onChange, className = selectClass, disabled, children }) => {
  return (
    <div className="relative w-full">
      <select value={value} onChange={onChange} className={className} disabled={disabled}>
        {children}
      </select>
      <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const getCategoryLabel = (category?: CategoryValue | null) => (category === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff');

const resolveCategory = (staff: Staff): CategoryValue => {
  if (staff.employeeCategory) return staff.employeeCategory;
  return staff.role === 'Teacher' ? 'Teacher' : 'Staff';
};



const roundAmount = (amount: number, rule?: 'No Round Off' | 'Nearest 1' | 'Nearest 10' | 'Nearest 50') => {
  if (!rule || rule === 'No Round Off') return amount;
  if (rule === 'Nearest 1') return Math.round(amount);
  if (rule === 'Nearest 10') return Math.round(amount / 10) * 10;
  if (rule === 'Nearest 50') return Math.round(amount / 50) * 50;
  return amount;
};

const structureEarningFields = [
  { key: 'basicSalary', label: 'Basic Salary (Monthly)', placeholder: 'e.g. 12722' },
  { key: 'hra', label: 'HRA (Monthly)', placeholder: 'e.g. 5089' },
  { key: 'travelAllowance', label: 'Conveyance Allowance (Monthly)', placeholder: 'e.g. 1600' },
  { key: 'medicalAllowance', label: 'Medical Allowance (Monthly)', placeholder: 'e.g. 1250' },
  { key: 'specialAllowance', label: 'Special Allowance (Monthly)', placeholder: 'e.g. 11145' },
  { key: 'da', label: 'DA (Monthly)', placeholder: 'e.g. 0' },
  { key: 'performanceAllowance', label: 'Performance Allowance (Monthly)', placeholder: 'e.g. 0' },
  { key: 'otherAllowance', label: 'Other Allowance (Monthly)', placeholder: 'e.g. 0' }
] as const;

const structureDeductionFields = [
  { key: 'employeePf', label: 'Employee PF (Monthly)', placeholder: 'e.g. 1527' },
  { key: 'employerPf', label: 'Employer PF (Monthly)', placeholder: 'e.g. 1527' },
  { key: 'professionalTax', label: 'Professional Tax (Monthly)', placeholder: 'e.g. 200' },
  { key: 'incomeTax', label: 'TDS (Monthly If Applicable)', placeholder: 'Enter TDS amount (e.g. 2500)' },
  { key: 'esi', label: 'ESI (Monthly)', placeholder: 'e.g. 0' },
  { key: 'loanDeduction', label: 'Loan Deduction (Monthly)', placeholder: 'e.g. 0' },
  { key: 'otherDeduction', label: 'Other Deduction (Monthly)', placeholder: 'Enter other deduction (e.g. 1000)' }
] as const;

const structureKeywords = (designation: string) => {
  const key = normalize(designation);
  if (key.includes('viceprincipal')) return ['vice-principal', 'vice principal'];
  if (key.includes('principal')) return ['principal'];
  if (key.includes('pgt')) return ['pgt'];
  if (key.includes('tgt')) return ['tgt'];
  if (key.includes('prt')) return ['prt'];
  if (key.includes('pet')) return ['pet'];
  if (key.includes('music')) return ['music'];
  if (key.includes('art')) return ['art'];
  if (key.includes('dance')) return ['dance'];
  if (key.includes('computer')) return ['computer'];
  if (key.includes('librarian')) return ['librarian'];
  if (key.includes('specialeducator')) return ['special-educator', 'special educator'];
  if (key.includes('administrator')) return ['administrator'];
  if (key.includes('hrexecutive')) return ['hr'];
  if (key.includes('accountant')) return ['accountant'];
  if (key.includes('receptionist')) return ['receptionist'];
  if (key.includes('officeassistant')) return ['office-assistant', 'office assistant'];
  if (key.includes('admissioncounselor')) return ['admission'];
  if (key.includes('itsupport')) return ['it'];
  if (key.includes('labassistant')) return ['lab'];
  if (key.includes('storekeeper')) return ['store'];
  if (key.includes('transportmanager')) return ['transport'];
  if (key.includes('driver')) return ['driver'];
  if (key.includes('securityguard')) return ['security'];
  if (key.includes('cleaner')) return ['cleaner'];
  if (key.includes('nurse')) return ['nurse'];
  if (key.includes('hostelwarden')) return ['hostel'];
  return [key];
};

const structureMatches = (structure: SalaryStructure, category: CategoryValue | '', designation: string) => {
  if (category && structure.employeeCategory !== category) return false;
  if (!designation) return true;
  const keywords = structureKeywords(designation);
  const haystack = normalize(`${structure.structureName} ${structure.designation || ''}`);
  return keywords.some(keyword => haystack.includes(normalize(keyword)));
};

const getStructureBreakdown = (
  structure?: SalaryStructure, 
  override?: Partial<EmployeeSalaryAssignment>,
  member?: Staff
) => {
  const memberSalary = Number(member?.salary || (member as any)?.monthlySalary || (member as any)?.basicSalary || 0);
  const basicLine = structure?.earnings.find(line => /basic/i.test(line.name)) || structure?.earnings?.[0];
  const structureEarnings = structure?.earnings || [];
  const structureDeductions = structure?.deductions || [];
  
  const structGross = Number(structure?.grossSalary || structureEarnings.reduce((sum, line) => sum + line.amount, 0));
  const fallbackGross = structGross > 0 ? structGross : memberSalary;

  const basicSalary = Number(
    override?.overrideBasicSalary ?? 
    (basicLine?.amount && basicLine.amount > 0 ? basicLine.amount : (fallbackGross > 0 ? Math.round(fallbackGross * 0.5) : 0))
  );

  const structAllowances = Math.max(0, structureEarnings.reduce((sum, line) => sum + line.amount, 0) - (basicLine?.amount ?? 0));
  const allowancesBase = structAllowances > 0 
    ? structAllowances 
    : (fallbackGross > 0 ? Math.max(0, fallbackGross - basicSalary) : 0);

  const structDeductionsVal = structureDeductions.reduce((sum, line) => sum + (/employer\s*pf/i.test(line.name) ? 0 : line.amount), 0);
  const deductionsBase = structDeductionsVal > 0 
    ? structDeductionsVal 
    : (fallbackGross > 0 ? Math.round(basicSalary * 0.12) : 0);

  const allowances = Number(override?.overrideAllowances ?? allowancesBase);
  const deductions = Number(override?.overrideDeductions ?? deductionsBase);
  const grossSalary = Number(
    override?.monthlyGross ?? 
    (fallbackGross > 0 ? fallbackGross : basicSalary + allowances)
  );
  const netSalary = Math.max(0, Number(
    override?.overrideNetSalary ?? 
    (grossSalary > 0 ? grossSalary - deductions : 0)
  ));

  return { basicSalary, allowances, deductions, grossSalary, netSalary };
};

const splitMonthYear = (monthLabel?: string) => {
  if (!monthLabel) return { month: 'N/A', year: 'N/A' };
  const match = monthLabel.match(/^(.*?)(?:\s+(\d{4}))?$/);
  if (!match) return { month: monthLabel, year: 'N/A' };
  return {
    month: match[1] || monthLabel,
    year: match[2] || 'N/A'
  };
};

const periodLabel = (month: string, year: string) => `${month} ${year}`.trim();

const todayString = () => new Date().toISOString().split('T')[0];

const normalizePayrollTab = (tab?: string): PayrollTabId => {
  switch (tab) {
    case 'staff-payroll-employees':
      return 'staff-payroll-employees';
    case 'staff-payroll-structures':
      return 'staff-payroll-structures';
    case 'staff-payroll-history':
      return 'staff-payroll-history';
    case 'staff-payroll-payslips':
      return 'staff-payroll-payslips';
    case 'staff-payslips':
    case 'staff-payroll':
    case 'staff-payroll-assignment':
    case 'staff-payroll-processing':
    case 'staff-payroll-reports':
      return 'staff-payroll-employees';
    default:
      return 'staff-payroll-employees';
  }
};

const StatCard: React.FC<{
  label: string;
  value: string;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'brand' | 'emerald' | 'sky' | 'amber' | 'slate' | 'rose';
}> = ({ label, value, helper, icon: Icon, tone = 'brand' }) => {
  const iconToneStyles: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100/50 dark:bg-brand-950/40 dark:text-brand-400 dark:border-brand-900/30',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30',
    sky: 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/30',
    amber: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30',
    rose: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
      <div className="space-y-1 text-left">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
        {helper && <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">{helper}</p>}
      </div>
      <div className={`p-3 rounded-2xl border transition-all duration-300 ${iconToneStyles[tone] || iconToneStyles.brand}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
};

const Panel: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`rounded-2xl border border-sky-200 bg-white p-5 shadow-xs dark:border-sky-900/40 dark:bg-slate-900 ${className}`}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const SearchableSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  getCode?: (val: string) => string;
}> = ({ value, onChange, options, placeholder = 'Select...', disabled, getCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border-none bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length > 0 ? filtered.map(option => {
              const match = option.match(/^(.*?)\s*\(([^)]+)\)$/);
              return (
                <div 
                  key={option} 
                  onClick={() => { onChange(option); setIsOpen(false); setSearch(''); }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 flex flex-col gap-0.5"
                >
                  {match ? (
                    <>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{match[1]}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{match[2]}</span>
                    </>
                  ) : (
                    <span>{option}</span>
                  )}
                  {getCode && option !== 'All Departments' && option !== 'All Employees' && (
                    <span className="text-[10px] text-slate-400 font-normal">Code: {getCode(option)}</span>
                  )}
                </div>
              );
            }) : (
              <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchableStaffSelect: React.FC<{
  value: string;
  onChange: (staffId: string) => void;
  staffList: Staff[];
  placeholder?: string;
  disabled?: boolean;
}> = ({ value, onChange, staffList, placeholder = '-- Select Staff Member --', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedStaff = staffList.find(s => String(s.id) === String(value));
  const selectedLabel = selectedStaff
    ? `${selectedStaff.name || `${selectedStaff.firstName || ''} ${selectedStaff.lastName || ''}`.trim()}${selectedStaff.empId ? ` - ${selectedStaff.empId}` : ''}${selectedStaff.designation || selectedStaff.role ? ` (${selectedStaff.designation || selectedStaff.role})` : ''}`
    : '';

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffList;
    const q = search.toLowerCase();
    return staffList.filter(s => {
      const fullName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
      const empCode = String(s.empId || s.id || '').toLowerCase();
      const desig = String(s.designation || s.role || '').toLowerCase();
      const dept = String((s as any).department || '').toLowerCase();
      return fullName.includes(q) || empCode.includes(q) || desig.includes(q) || dept.includes(q);
    });
  }, [staffList, search]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-slate-100 p-2.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Search by name, emp ID, designation..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            <div
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              className="cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              -- Select Staff Member --
            </div>
            {filteredStaff.length > 0 ? (
              filteredStaff.map(s => {
                const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
                const sCode = s.empId || s.id;
                const sDesig = s.designation || s.role || '';
                const isSelected = String(s.id) === String(value);

                return (
                  <div 
                    key={s.id} 
                    onClick={() => { onChange(String(s.id)); setIsOpen(false); setSearch(''); }}
                    className={`cursor-pointer rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-sky-50 text-sky-700 font-bold dark:bg-sky-950/40 dark:text-sky-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{sName}{sCode ? ` - ${sCode}` : ''}</p>
                      {sDesig && <p className="text-[10px] text-slate-400 mt-0.5">{sDesig}{(s as any).department ? ` • ${(s as any).department}` : ''}</p>}
                    </div>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-sky-600 shrink-0"></span>}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 italic text-center">No staff found matching query.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ModalShell: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ title, subtitle, onClose, children, maxWidth = 'max-w-5xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
    <div className={`w-full ${maxWidth} overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-5">{children}</div>
    </div>
  </div>
);

const defaultEffectiveDate = new Date().toISOString().split('T')[0];

const structureDraftDefaults: StructureDraft = {
  structureName: '',
  employeeCategory: 'Teacher',
  staffId: '',
  department: '',
  designation: '',
  basicPercentage: '50',
  hraPercentage: '40',
  status: 'Active',
  effectiveDate: defaultEffectiveDate,
  payrollFrequency: 'Monthly',
  salaryPaymentDay: '5',
  pfApplicable: true,
  pfPercentage: '12',
  esiApplicable: true,
  esiPercentage: '1.75',
  professionalTaxApplicable: true,
  professionalTaxAmount: '200',
  notes: '',
  basicSalary: '0',
  hra: '0',
  da: '0',
  medicalAllowance: '0',
  travelAllowance: '0',
  specialAllowance: '0',
  performanceAllowance: '0',
  otherAllowance: '0',
  employeePf: '0',
  employerPf: '0',
  esi: '0',
  professionalTax: '0',
  incomeTax: '0',
  loanDeduction: '0',
  otherDeduction: '0'
};

const parseMoney = (value: string) => Number(value) || 0;

const getPayslipUniqueId = (item: any, fallbackIndex?: number): string => {
  return String(item?.id || item?._id || item?.payslipNumber || item?.slipNo || (item?.employeeId && item?.month ? `${item.employeeId}-${item.month}` : '') || (item?.empId && item?.month ? `${item.empId}-${item.month}` : '') || `payslip-${fallbackIndex ?? 0}`);
};

const getEmployeeUniqueId = (member: any, fallbackIndex?: number): string => {
  return String(member?.id || member?._id || member?.empId || `emp-${fallbackIndex ?? 0}`);
};

const findLineAmount = (lines: { name: string; amount: number }[] = [], keywords: string[]) => {
  const match = lines.find(line => keywords.some(keyword => normalize(line.name).includes(normalize(keyword))));
  return match?.amount ?? 0;
};

const getStructureDraftFromStructure = (structure: SalaryStructure, mode: 'add' | 'edit' | 'duplicate'): StructureDraft => ({
  id: structure.id,
  staffId: (structure as any).staffId || (structure as any).employeeId || '',
  department: (structure as any).department || '',
  structureName: mode === 'duplicate' ? `${structure.structureName} Copy` : structure.structureName,
  employeeCategory: structure.employeeCategory,
  designation: structure.designation || '',
  basicPercentage: String(structure.basicPercentage ?? 50),
  hraPercentage: String(structure.hraPercentage ?? 40),
  status: mode === 'duplicate' ? 'Inactive' : structure.status,
  effectiveDate: structure.effectiveDate || defaultEffectiveDate,
  payrollFrequency: 'Monthly',
  salaryPaymentDay: structure.salaryPaymentDay || '5',
  pfApplicable: structure.pfApplicable ?? findLineAmount(structure.deductions, ['employee pf', 'employer pf', 'provident fund']) > 0,
  pfPercentage: String(structure.pfPercentage ?? 12),
  esiApplicable: structure.esiApplicable ?? findLineAmount(structure.deductions, ['esi', 'employee state insurance']) > 0,
  esiPercentage: String(structure.esiPercentage ?? 1.75),
  professionalTaxApplicable: structure.professionalTaxApplicable ?? findLineAmount(structure.deductions, ['professional tax']) > 0,
  professionalTaxAmount: String(structure.professionalTaxAmount ?? (findLineAmount(structure.deductions, ['professional tax']) || 200)),
  notes: structure.notes || '',
  basicSalary: String(findLineAmount(structure.earnings, ['basic salary', 'basic'])),
  hra: String(findLineAmount(structure.earnings, ['hra', 'house rent allowance'])),
  da: String(findLineAmount(structure.earnings, ['da', 'dearness allowance'])),
  medicalAllowance: String(findLineAmount(structure.earnings, ['medical allowance', 'medical'])),
  travelAllowance: String(findLineAmount(structure.earnings, ['travel allowance', 'conveyance', 'transport allowance'])),
  specialAllowance: String(findLineAmount(structure.earnings, ['special allowance'])),
  performanceAllowance: String(findLineAmount(structure.earnings, ['performance allowance', 'incentive'])),
  otherAllowance: String(findLineAmount(structure.earnings, ['other allowance', 'allowances'])),
  employeePf: String(findLineAmount(structure.deductions, ['employee pf', 'provident fund', 'pf'])),
  employerPf: String(findLineAmount(structure.deductions, ['employer pf'])),
  esi: String(findLineAmount(structure.deductions, ['esi', 'employee state insurance'])),
  professionalTax: String(findLineAmount(structure.deductions, ['professional tax'])),
  incomeTax: String(findLineAmount(structure.deductions, ['income tax', 'tds'])),
  loanDeduction: String(findLineAmount(structure.deductions, ['loan deduction', 'loan'])),
  otherDeduction: String(findLineAmount(structure.deductions, ['other deduction', 'deductions']))
});

const computeStatutoryValues = (draft: Partial<StructureDraft>) => {
  const basic = parseMoney(draft.basicSalary || '0');
  const totalEarnings =
    parseMoney(draft.basicSalary || '0') +
    parseMoney(draft.hra || '0') +
    parseMoney(draft.da || '0') +
    parseMoney(draft.medicalAllowance || '0') +
    parseMoney(draft.travelAllowance || '0') +
    parseMoney(draft.specialAllowance || '0') +
    parseMoney(draft.performanceAllowance || '0') +
    parseMoney(draft.otherAllowance || '0');

  // PF calculation
  let employeePf = '0';
  let employerPf = '0';
  if (draft.pfApplicable) {
    const pfPercentage = Number(draft.pfPercentage) || 12;
    const rawPf = Math.round(basic * (pfPercentage / 100));
    const pfAmount = Math.min(1800, rawPf);
    employeePf = String(pfAmount);
    employerPf = String(pfAmount);
  }

  // ESI calculation
  let esi = '0';
  if (draft.esiApplicable) {
    const esiPercentage = Number(draft.esiPercentage) || 1.75;
    const esiAmount = Math.round(totalEarnings * (esiPercentage / 100));
    esi = String(esiAmount);
  }

  // PT calculation
  let professionalTax = '0';
  if (draft.professionalTaxApplicable) {
    professionalTax = String(Number(draft.professionalTaxAmount) || 200);
  }

  return { employeePf, employerPf, esi, professionalTax };
};

const getStructureDraftTotals = (draft: StructureDraft) => {
  const totalEarnings =
    parseMoney(draft.basicSalary) +
    parseMoney(draft.hra) +
    parseMoney(draft.da) +
    parseMoney(draft.medicalAllowance) +
    parseMoney(draft.travelAllowance) +
    parseMoney(draft.specialAllowance) +
    parseMoney(draft.performanceAllowance) +
    parseMoney(draft.otherAllowance);

  const pfTotal = draft.pfApplicable ? parseMoney(draft.employeePf) + parseMoney(draft.employerPf) : 0;
  const esiTotal = draft.esiApplicable ? parseMoney(draft.esi) : 0;
  const professionalTaxTotal = draft.professionalTaxApplicable ? parseMoney(draft.professionalTax) : 0;
  const totalDeductions =
    pfTotal +
    esiTotal +
    professionalTaxTotal +
    parseMoney(draft.incomeTax) +
    parseMoney(draft.loanDeduction) +
    parseMoney(draft.otherDeduction);

  return {
    grossSalary: totalEarnings,
    totalEarnings,
    totalDeductions,
    netSalary: roundAmount(Math.max(0, totalEarnings - totalDeductions), 'Nearest 1')
  };
};

const buildStructurePayload = (draft: StructureDraft): Omit<SalaryStructure, 'id'> => {
  const totals = getStructureDraftTotals(draft);
  return {
    staffId: draft.staffId || undefined,
    employeeId: draft.staffId || undefined,
    structureName: draft.structureName.trim(),
    employeeCategory: draft.employeeCategory,
    branch: 'Main Campus',
    earnings: [
      { name: 'Basic Salary', amount: parseMoney(draft.basicSalary), type: 'Fixed', value: parseMoney(draft.basicSalary) },
      { name: 'HRA', amount: parseMoney(draft.hra), type: 'Fixed', value: parseMoney(draft.hra) },
      { name: 'DA', amount: parseMoney(draft.da), type: 'Fixed', value: parseMoney(draft.da) },
      { name: 'Medical Allowance', amount: parseMoney(draft.medicalAllowance), type: 'Fixed', value: parseMoney(draft.medicalAllowance) },
      { name: 'Travel Allowance', amount: parseMoney(draft.travelAllowance), type: 'Fixed', value: parseMoney(draft.travelAllowance) },
      { name: 'Special Allowance', amount: parseMoney(draft.specialAllowance), type: 'Fixed', value: parseMoney(draft.specialAllowance) },
      { name: 'Performance Allowance', amount: parseMoney(draft.performanceAllowance), type: 'Fixed', value: parseMoney(draft.performanceAllowance) },
      { name: 'Other Allowance', amount: parseMoney(draft.otherAllowance), type: 'Fixed', value: parseMoney(draft.otherAllowance) }
    ],
    deductions: [
      { name: 'Employee PF', amount: draft.pfApplicable ? parseMoney(draft.employeePf) : 0, type: 'Fixed', value: draft.pfApplicable ? parseMoney(draft.employeePf) : 0 },
      { name: 'Employer PF', amount: draft.pfApplicable ? parseMoney(draft.employerPf) : 0, type: 'Fixed', value: draft.pfApplicable ? parseMoney(draft.employerPf) : 0 },
      { name: 'ESI', amount: draft.esiApplicable ? parseMoney(draft.esi) : 0, type: 'Fixed', value: draft.esiApplicable ? parseMoney(draft.esi) : 0 },
      { name: 'Professional Tax', amount: draft.professionalTaxApplicable ? parseMoney(draft.professionalTax) : 0, type: 'Fixed', value: draft.professionalTaxApplicable ? parseMoney(draft.professionalTax) : 0 },
      { name: 'Income Tax', amount: parseMoney(draft.incomeTax), type: 'Fixed', value: parseMoney(draft.incomeTax) },
      { name: 'Loan Deduction', amount: parseMoney(draft.loanDeduction), type: 'Fixed', value: parseMoney(draft.loanDeduction) },
      { name: 'Other Deduction', amount: parseMoney(draft.otherDeduction), type: 'Fixed', value: parseMoney(draft.otherDeduction) }
    ],
    grossSalary: totals.grossSalary,
    netSalaryFormula: 'Gross Salary - Total Deductions',
    status: draft.status,
    designation: draft.designation.trim(),
    payrollFrequency: draft.payrollFrequency,
    salaryPaymentDay: draft.salaryPaymentDay.trim() || '5',
    basicPercentage: Number(draft.basicPercentage) || 50,
    hraPercentage: Number(draft.hraPercentage) || 40,
    pfApplicable: draft.pfApplicable,
    pfPercentage: Number(draft.pfPercentage) || 0,
    esiApplicable: draft.esiApplicable,
    esiPercentage: Number(draft.esiPercentage) || 0,
    professionalTaxApplicable: draft.professionalTaxApplicable,
    professionalTaxAmount: Number(draft.professionalTaxAmount) || 0,
    roundOffRule: 'Nearest 1',
    notes: draft.notes.trim() || undefined,
    effectiveDate: draft.effectiveDate || defaultEffectiveDate
  };
};

const assignmentDraftDefaults: AssignmentDraft = {
  employeeId: '',
  employeeCategory: '',
  designation: '',
  salaryStructureId: '',
  salaryOverride: false,
  basicSalary: '',
  allowances: '',
  deductions: '',
  effectiveDate: todayString()
};

export const PayrollModuleView: React.FC<PayrollModuleViewProps> = ({ initialTab = 'staff-payroll-employees', onTabChange }) => {
  const {
    staff,
    salaryStructures,
    employeeSalaryAssignments,
    payslips,
    attendance,
    leaveApplications,
    addSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    cloneSalaryStructure,
    assignEmployeeSalaryStructure,
    disburseSalary,
    designations,
    fetchSalaryStructures,
    fetchSalaryAssignments
  } = useData();

  useEffect(() => {
    if (fetchSalaryStructures) fetchSalaryStructures();
    if (fetchSalaryAssignments) fetchSalaryAssignments();
  }, []);

  const { addToast } = useToast();

  const getDesignationOptions = (category: CategoryValue | '') => {
    const fromMaster = designations
      .filter(d => 
        d.status === 'Active' && 
        (!category || d.employeeCategory === 'Both' || 
        (category === 'Teacher' && d.employeeCategory === 'Teaching') || 
        (category === 'Staff' && d.employeeCategory === 'Non-Teaching'))
      )
      .map(d => d.designationName);

    const fromStaff = staff
      .filter(s => !category || resolveCategory(s) === category)
      .map(s => s.designation)
      .filter(Boolean) as string[];

    const fromStructures = salaryStructures
      .filter(s => !category || s.employeeCategory === category)
      .map(s => s.designation)
      .filter(Boolean) as string[];

    return Array.from(new Set([...fromMaster, ...fromStaff, ...fromStructures]));
  };

  const handlePrintPayslip = (p: any, autoPrint = false) => {
    const linkedStaff = staff.find(member => member.id === p.employeeId || member.empId === p.empId) || null;
    const activeAssignment = employeeSalaryAssignments.find(a => (a.employeeId === p.employeeId || a.empId === p.empId) && a.status === 'Active') || null;
    const category = resolveCategory(linkedStaff || undefined);
    let structure = salaryStructures.find(s => s.id === activeAssignment?.salaryStructureId) || null;
    if (!structure && linkedStaff) {
      const matches = salaryStructures.filter(s => structureMatches(s, category, linkedStaff.designation || ''));
      structure = matches[0] || salaryStructures.find(s => s.employeeCategory === category) || salaryStructures[0] || null;
    }
    const fallbackBreakdown = getStructureBreakdown(structure || undefined, activeAssignment || undefined, linkedStaff || undefined);

    const rawGross = Number(p.grossSalary) || 0;
    const rawDed = (Number(p.leaveDeduction) || 0) + (Number(p.otherDeductions) || 0) + (Number(p.pfDeduction) || 0);
    const rawNet = Number(p.netSalary) || 0;

    const fallbackGross = (fallbackBreakdown.grossSalary > 0) ? fallbackBreakdown.grossSalary : Number(linkedStaff?.salary || 0);
    const safeGross = rawGross > 0 ? rawGross : fallbackGross;
    const safeDeductions = rawDed > 0 ? rawDed : (fallbackBreakdown.deductions || 0);
    const safeNet = rawNet > 0 ? rawNet : (safeGross > 0 ? Math.max(0, safeGross - safeDeductions) : (fallbackBreakdown.netSalary || 0));

    // Dynamic detailed earnings list
    let earningsList: { name: string; amount: number }[] = [];
    if (Array.isArray(p.earnings) && p.earnings.length > 0 && p.earnings.some((e: any) => Number(e.amount) > 0)) {
      earningsList = p.earnings.filter((e: any) => Number(e.amount) > 0).map((e: any) => ({ name: e.name, amount: Number(e.amount) || 0 }));
    } else if (structure?.earnings && structure.earnings.length > 0 && structure.earnings.some(e => e.amount > 0)) {
      earningsList = structure.earnings.filter(e => e.amount > 0).map(e => ({ name: e.name, amount: e.amount }));
    }
    if (earningsList.length === 0) {
      const basic = fallbackBreakdown.basicSalary > 0 ? fallbackBreakdown.basicSalary : Math.round(safeGross * 0.5);
      const hra = Math.round(basic * 0.4);
      const special = Math.max(0, safeGross - basic - hra);
      earningsList = [
        { name: 'Basic Salary', amount: basic },
        ...(hra > 0 ? [{ name: 'HRA', amount: hra }] : []),
        ...(special > 0 ? [{ name: 'Special Allowance', amount: special }] : [])
      ];
    }

    // Dynamic detailed deductions list
    let deductionsList: { name: string; amount: number }[] = [];
    if (Array.isArray(p.deductions) && p.deductions.length > 0 && p.deductions.some((d: any) => Number(d.amount) > 0)) {
      deductionsList = p.deductions.filter((d: any) => Number(d.amount) > 0).map((d: any) => ({ name: d.name, amount: Number(d.amount) || 0 }));
    } else if (structure?.deductions && structure.deductions.length > 0 && structure.deductions.some(d => d.amount > 0)) {
      deductionsList = structure.deductions.filter(d => d.amount > 0 && !/employer\s*pf/i.test(d.name)).map(d => ({ name: d.name, amount: d.amount }));
    }
    if (deductionsList.length === 0 && safeDeductions > 0) {
      const pf = Number(p.pfDeduction) || Math.min(1800, Math.round((earningsList[0]?.amount || safeGross * 0.5) * 0.12));
      const leave = Number(p.leaveDeduction) || 0;
      const other = Number(p.otherDeductions) || 0;
      if (pf > 0) deductionsList.push({ name: 'Provident Fund (PF)', amount: pf });
      if (leave > 0) deductionsList.push({ name: 'Leave / Attendance Deduction', amount: leave });
      if (other > 0) deductionsList.push({ name: 'Other Deductions', amount: other });
      if (deductionsList.length === 0) {
        deductionsList.push({ name: 'Total Deductions', amount: safeDeductions });
      }
    }

    const maxRows = Math.max(earningsList.length, deductionsList.length, 1);
    const tableRowsHtml = Array.from({ length: maxRows }).map((_, i) => {
      const earn = earningsList[i];
      const ded = deductionsList[i];
      return `
        <tr>
          <td>${earn ? earn.name : ''}</td>
          <td style="text-align: right; font-weight: 600;">${earn ? formatCurrency(earn.amount) : ''}</td>
          <td>${ded ? ded.name : ''}</td>
          <td style="text-align: right; font-weight: 600;">${ded ? formatCurrency(ded.amount) : ''}</td>
        </tr>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const schoolName = localStorage.getItem('school_name') || 'Educational Institution';
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Payslip - ${p.employeeName || (linkedStaff ? `${linkedStaff.firstName} ${linkedStaff.lastName}` : 'Staff')}</title>
            <style>
              @page { size: A4 portrait; margin: 8mm; }
              @media print {
                html, body { height: 100vh; margin: 0 !important; padding: 10px !important; box-sizing: border-box; page-break-inside: avoid !important; }
              }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px 24px; color: #333; font-size: 11px; line-height: 1.3; }
              .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 12px; }
              .header h2 { margin: 0; font-size: 18px; color: #0284c7; }
              .header p { margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
              .details { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
              .table th, .table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              .table th { background-color: #f1f5f9; font-weight: 700; }
              .net { font-size: 1.1em; font-weight: bold; margin-top: 14px; display: flex; justify-content: space-between; align-items: center; color: #16a34a; background: #f0fdf4; padding: 10px 14px; border-radius: 6px; border: 1px solid #bbf7d0; }
              .sign { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>MONTHLY SALARY PAYSLIP</h2>
              <p>${schoolName} - HR Department</p>
            </div>
            <div class="details">
              <div><strong>Employee Name:</strong> ${p.employeeName || (linkedStaff ? `${linkedStaff.firstName} ${linkedStaff.lastName}` : 'Staff')}</div>
              <div><strong>Employee ID:</strong> ${p.empId || linkedStaff?.empId || 'N/A'}</div>
              <div><strong>Salary Month:</strong> ${p.month}</div>
              <div><strong>Generated Date:</strong> ${p.disbursedDate || p.paymentDate || new Date().toISOString().split('T')[0]}</div>
              <div><strong>Bank Account:</strong> ${p.bankAccount || linkedStaff?.bankDetails?.accountNumber || 'N/A'}</div>
              <div><strong>Status:</strong> ${p.status || 'Generated'}</div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Earning Details</th>
                  <th style="text-align: right;">Amount</th>
                  <th>Deduction Details</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;">
                  <td><strong>Gross Earning</strong></td>
                  <td style="text-align: right; color: #0284c7;"><strong>${formatCurrency(safeGross)}</strong></td>
                  <td><strong>Total Deductions</strong></td>
                  <td style="text-align: right; color: #ef4444;"><strong>${formatCurrency(safeDeductions)}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="net">
              <span>Net Payable Salary:</span>
              <span style="font-size: 1.25em; font-weight: 900;">${formatCurrency(safeNet)}</span>
            </div>
            
            <div class="sign">
              <div>
                <p>_______________________</p>
                <p>Employee Signature</p>
              </div>
              <div>
                <p>_______________________</p>
                <p>Authorized Signatory</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      if (autoPrint) {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PayrollTabId>('staff-payroll-employees');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeCategoryFilter, setEmployeeCategoryFilter] = useState<'All' | CategoryValue>('All');
  const [employeeStructureFilter, setEmployeeStructureFilter] = useState('All Structures');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [structureSearch, setStructureSearch] = useState('');
  const [structureCategoryFilter, setStructureCategoryFilter] = useState<'All' | CategoryValue>('All');
  const [structureDesignationFilter, setStructureDesignationFilter] = useState('All');
  const [structureStatusFilter, setStructureStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [generationMonth, setGenerationMonth] = useState(monthOptions[new Date().getMonth()]);
  const [generationYear, setGenerationYear] = useState(String(currentYear));
  const [generationBranch, setGenerationBranch] = useState('All Branches');
  const [generationDepartment, setGenerationDepartment] = useState('All Departments');
  const [generationCategory, setGenerationCategory] = useState<'All' | CategoryValue>('All');
  const [generationEmployee, setGenerationEmployee] = useState('All Employees');
  const [historyEmployee, setHistoryEmployee] = useState('All Employees');
  const [historyMonth, setHistoryMonth] = useState('All');
  const [historyYear, setHistoryYear] = useState('All');
  const [historyDepartment, setHistoryDepartment] = useState('All Departments');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedStructureIds, setSelectedStructureIds] = useState<string[]>([]);
  const [selectedGenerationIds, setSelectedGenerationIds] = useState<string[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [drawerStaff, setDrawerStaff] = useState<Staff | null>(null);

  // Pagination states
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePerPage, setEmployeePerPage] = useState(10);
  const [structurePage, setStructurePage] = useState(1);
  const [structurePerPage, setStructurePerPage] = useState(10);
  const [generatedHistoryPage, setGeneratedHistoryPage] = useState(1);
  const [generatedHistoryPerPage, setGeneratedHistoryPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);

  useEffect(() => {
    setEmployeePage(1);
  }, [employeeSearch, employeeCategoryFilter, employeeStructureFilter, employeeStatusFilter]);

  useEffect(() => {
    setStructurePage(1);
  }, [structureSearch, structureCategoryFilter, structureDesignationFilter, structureStatusFilter]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyEmployee, historyMonth, historyYear, historyDepartment]);

  const [payslipMode, setPayslipMode] = useState<'Auto Payslip'>('Auto Payslip');
  const [globalDeduction, setGlobalDeduction] = useState<string>('');
  const [globalTdsPct, setGlobalTdsPct] = useState<string>('');
  const [standardPeriod, setStandardPeriod] = useState<'1m' | '3m' | '6m' | '12m'>('1m');
  const [leftEmployeeSearch, setLeftEmployeeSearch] = useState<string>('');
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [structureMode, setStructureMode] = useState<'add' | 'edit' | 'duplicate'>('add');
  const [structureEditingId, setStructureEditingId] = useState<string | null>(null);
  const [structureDraft, setStructureDraft] = useState<StructureDraft>(structureDraftDefaults);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>(assignmentDraftDefaults);

  useEffect(() => {
    setActiveTab(normalizePayrollTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const branches = useMemo(() => {
    const list = Array.from(new Set(staff.map(item => item.branch).filter(Boolean)));
    return ['All Branches', ...(list.length > 0 ? list : ['Main Campus'])];
  }, [staff]);

  const departments = useMemo(() => {
    const list = Array.from(new Set([
      ...staff.map(item => item.department).filter(Boolean),
      ...designations.map((d: any) => d.department).filter(Boolean)
    ]));
    return ['All Departments', ...list];
  }, [designations, staff]);

  const employeeOptions = useMemo(() => ['All Employees', ...staff.map(item => `${item.firstName} ${item.lastName} (${item.empId})`.trim())], [staff]);
  const structureOptions = useMemo(() => ['All Structures', ...Array.from(new Set(salaryStructures.map(item => item.structureName).filter(Boolean)))], [salaryStructures]);
  const designationSet = useMemo(() => {
    const values = Array.from(new Set([
      ...salaryStructures.map(item => item.designation).filter(Boolean),
      ...staff.map(item => item.designation).filter(Boolean),
      ...designations.map(d => d.designationName).filter(Boolean)
    ])) as string[];
    return ['All', ...values];
  }, [designations, salaryStructures, staff]);

  const employeeRows = useMemo(() => {
    return staff.map(member => {
      const activeAssignment = employeeSalaryAssignments.find(item => (item.employeeId === member.id || item.empId === member.empId) && item.status === 'Active') || null;
      const category = resolveCategory(member);

      const staffSpecificStructure = salaryStructures.find(item =>
        (item as any).staffId === member.id ||
        (item as any).employeeId === member.id ||
        normalize(item.structureName).includes(normalize(`${member.firstName} ${member.lastName}`))
      ) || null;

      const isConfigured = !!(activeAssignment || staffSpecificStructure);
      const structure = activeAssignment
        ? (salaryStructures.find(item => item.id === activeAssignment.salaryStructureId) || staffSpecificStructure || null)
        : (staffSpecificStructure || null);

      const breakdown = structure ? getStructureBreakdown(structure, activeAssignment || undefined, member) : { basicSalary: 0, allowances: 0, deductions: 0, grossSalary: 0, netSalary: 0 };
      const payrollStatus = isConfigured ? 'Active' : 'Inactive';

      return {
        member,
        category,
        assignment: activeAssignment,
        structure,
        breakdown,
        payrollStatus
      };
    });
  }, [employeeSalaryAssignments, salaryStructures, staff]);

  const filteredEmployeeRows = useMemo(() => {
    const query = normalize(employeeSearch);
    return employeeRows.filter(row => {
      const matchesSearch =
        query.length === 0 ||
        normalize(`${row.member.firstName} ${row.member.lastName} ${row.member.empId} ${row.member.department} ${row.member.designation} ${row.structure?.structureName || ''}`).includes(query);
      const matchesCategory = employeeCategoryFilter === 'All' || row.category === employeeCategoryFilter;
      const matchesStructure = employeeStructureFilter === 'All Structures' || row.structure?.structureName === employeeStructureFilter;
      const matchesStatus = employeeStatusFilter === 'All' || row.payrollStatus === employeeStatusFilter;
      return matchesSearch && matchesCategory && matchesStructure && matchesStatus;
    });
  }, [employeeCategoryFilter, employeeRows, employeeSearch, employeeStatusFilter, employeeStructureFilter]);

  const structureRows = useMemo(() => {
    return salaryStructures.map(structure => {
      const activeAssignments = employeeSalaryAssignments.filter(item => String(item.salaryStructureId) === String(structure.id) && item.status === 'Active');
      const assignedCount = activeAssignments.length;
      
      const directStaff = staff.find(s => String(s.id) === String((structure as any).staffId || (structure as any).employeeId));
      const assignedStaff = activeAssignments.length > 0 ? staff.find(s => String(s.id) === String(activeAssignments[0].employeeId) || s.empId === activeAssignments[0].empId) : null;
      const namedStaff = staff.find(s => {
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        const singleName = s.name || '';
        return (fullName && normalize(structure.structureName).includes(normalize(fullName))) ||
               (singleName && normalize(structure.structureName).includes(normalize(singleName)));
      });

      const matchingDesignationStaff = staff.filter(s => {
        const staffDesig = s.designation || s.role || '';
        const structDesig = structure.designation || '';
        return structDesig && staffDesig && normalize(staffDesig) === normalize(structDesig);
      });

      const linkedEmployee = directStaff || assignedStaff || namedStaff || (matchingDesignationStaff.length === 1 ? matchingDesignationStaff[0] : null);

      const assignedEmployees = activeAssignments.map(a => staff.find(s => String(s.id) === String(a.employeeId) || s.empId === a.empId)).filter(Boolean) as Staff[];

      return {
        structure,
        assignedCount,
        linkedEmployee,
        assignedEmployees,
        breakdown: getStructureBreakdown(structure)
      };
    });
  }, [employeeSalaryAssignments, salaryStructures, staff]);

  const filteredStructureRows = useMemo(() => {
    const query = normalize(structureSearch);
    return structureRows.filter(row => {
      const empText = row.linkedEmployee ? `${row.linkedEmployee.firstName} ${row.linkedEmployee.lastName} ${row.linkedEmployee.empId}` : '';
      const matchesSearch =
        query.length === 0 ||
        normalize(`${row.structure.structureName} ${row.structure.designation || ''} ${row.structure.structureCode || ''} ${empText}`).includes(query);
      const matchesCategory = structureCategoryFilter === 'All' || row.structure.employeeCategory === structureCategoryFilter;
      const matchesDesignation = structureDesignationFilter === 'All' || row.structure.designation === structureDesignationFilter;
      const matchesStatus = structureStatusFilter === 'All' || row.structure.status === structureStatusFilter;
      return matchesSearch && matchesCategory && matchesDesignation && matchesStatus;
    });
  }, [structureCategoryFilter, structureDesignationFilter, structureRows, structureSearch, structureStatusFilter]);

  const activeStructureCount = structureRows.filter(row => row.structure.status === 'Active').length;
  const assignedEmployeeCount = employeeRows.filter(row => row.assignment && row.assignment.status === 'Active').length;
  const overrideEmployeeCount = employeeRows.filter(row => row.assignment?.salaryOverride).length;
  const totalPreviewNet = structureRows.reduce((sum, row) => sum + row.breakdown.netSalary, 0);

  const payrollMonthLabel = periodLabel(generationMonth, generationYear);
  const structureDraftPreview = useMemo(() => getStructureDraftTotals(structureDraft), [structureDraft]);

  const availableCategoryStaff = useMemo(() => {
    const cat = structureDraft.employeeCategory;
    return staff.filter(s => resolveCategory(s) === cat);
  }, [staff, structureDraft.employeeCategory]);

  const autoCalculateCorporateSalary = (inputCtc?: string, customBasicPct?: string, customHraPct?: string) => {
    const annual = parseMoney(inputCtc !== undefined ? inputCtc : structureDraft.annualCtc || '0');
    if (annual <= 0) return;

    const monthlyGross = Math.round(annual / 12);
    const basicPct = Number(customBasicPct !== undefined ? customBasicPct : structureDraft.basicPercentage) || 50;
    const hraPct = Number(customHraPct !== undefined ? customHraPct : structureDraft.hraPercentage) || 40;

    // Realtime Corporate Salary Breakdown Rules (Dynamic % Basic, Dynamic % HRA of Basic, Conveyance 1600, Medical 1250, Special = balancing figure)
    const basic = Math.round(monthlyGross * (basicPct / 100));
    const hra = Math.round(basic * (hraPct / 100));
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, monthlyGross - (basic + hra + conveyance + medical));

    setStructureDraft(prev => {
      const updated: StructureDraft = {
        ...prev,
        annualCtc: String(annual),
        basicPercentage: customBasicPct !== undefined ? customBasicPct : prev.basicPercentage,
        hraPercentage: customHraPct !== undefined ? customHraPct : prev.hraPercentage,
        basicSalary: String(basic),
        hra: String(hra),
        travelAllowance: String(conveyance),
        medicalAllowance: String(medical),
        specialAllowance: String(special)
      };
      const statutory = computeStatutoryValues(updated);
      return {
        ...updated,
        employeePf: statutory.employeePf,
        employerPf: statutory.employerPf,
        esi: statutory.esi,
        professionalTax: statutory.professionalTax
      };
    });
  };

  const handleStaffSelect = (staffId: string) => {
    const selectedStaff = staff.find(s => String(s.id) === String(staffId));
    if (selectedStaff) {
      const autoDesignation = selectedStaff.designation || selectedStaff.role || '';
      const autoDept = (selectedStaff as any).department || selectedStaff.designation || selectedStaff.role || 'Staff';
      const staffName = selectedStaff.name || `${selectedStaff.firstName || ''} ${selectedStaff.lastName || ''}`.trim() || 'Staff Scale';
      const staffSalary = Number((selectedStaff as any).basicSalary || (selectedStaff as any).salary || 0);

      setStructureDraft(prev => {
        const next = {
          ...prev,
          staffId,
          designation: autoDesignation,
          department: autoDept,
          structureName: prev.structureName ? prev.structureName : `${staffName} Scale`
        };

        if (staffSalary > 0) {
          const annual = staffSalary > 50000 ? staffSalary : staffSalary * 12;
          const monthlyGross = Math.round(annual / 12);
          const basicPct = Number(prev.basicPercentage) || 50;
          const hraPct = Number(prev.hraPercentage) || 40;
          const basic = Math.round(monthlyGross * (basicPct / 100));
          const hra = Math.round(basic * (hraPct / 100));
          const conveyance = 1600;
          const medical = 1250;
          const special = Math.max(0, monthlyGross - (basic + hra + conveyance + medical));

          const baseDraft: StructureDraft = {
            ...next,
            annualCtc: String(annual),
            basicSalary: String(basic),
            hra: String(hra),
            travelAllowance: String(conveyance),
            medicalAllowance: String(medical),
            specialAllowance: String(special)
          };
          const statutory = computeStatutoryValues(baseDraft);

          return {
            ...baseDraft,
            employeePf: statutory.employeePf,
            employerPf: statutory.employerPf,
            esi: statutory.esi,
            professionalTax: statutory.professionalTax
          };
        }
        return next;
      });
    } else {
      setStructureDraft(prev => ({ ...prev, staffId: '' }));
    }
  };

  const generationCandidates = useMemo(() => {
    return employeeRows.filter(row => {
      const isSelected = selectedGenerationIds.includes(row.member.id);
      if (!isSelected && row.payrollStatus !== 'Active' && (!row.assignment || row.assignment.status !== 'Active')) return false;
      const staffBranch = row.member.branch || 'Main Campus';
      const matchesBranch = generationBranch === 'All Branches' || staffBranch === generationBranch;
      const matchesDepartment = generationDepartment === 'All Departments' || row.member.department === generationDepartment;
      const matchesCategory = generationCategory === 'All' || row.category === generationCategory;
      const employeeLabel = `${row.member.firstName} ${row.member.lastName} (${row.member.empId})`.trim();
      const matchesEmployee = generationEmployee === 'All Employees' || employeeLabel === generationEmployee;
      return matchesBranch && matchesDepartment && matchesCategory && matchesEmployee;
    });
  }, [employeeRows, generationBranch, generationCategory, generationDepartment, generationEmployee, selectedGenerationIds]);

  const generationRows = useMemo(() => {
    return generationCandidates.map(row => {
      const existing = payslips.find(item => item.employeeId === row.member.id && item.month === payrollMonthLabel) || null;
      const breakdown = row.breakdown;
      const leaveRecords = leaveApplications.filter(item => item.employeeId === row.member.id && item.status === 'Approved');
      const attendanceRecords = attendance.filter(item => item.entityType === 'Staff' && item.entityId === row.member.id);
      const presentDays = attendanceRecords.filter(item => item.status === 'Present').length;
      const halfDays = attendanceRecords.filter(item => item.status === 'HalfDay').length;
      const lateMarks = attendanceRecords.filter(item => item.status === 'Late').length;
      const approvedLeaveDays = leaveRecords.reduce((sum, item) => sum + Number(item.numberOfDays || 0), 0);
      const workingDays = Math.max(1, Math.max(presentDays + halfDays, 22));
      const lopDays = Math.max(0, workingDays - presentDays - approvedLeaveDays - halfDays * 0.5);
      const attendanceDeduction = Math.round((breakdown.grossSalary / workingDays) * lopDays);
      const extraDeduction = Number(globalDeduction) || 0;
      const tdsPercentage = Number(globalTdsPct) || 0;
      const tdsDeduction = Math.round(breakdown.grossSalary * (tdsPercentage / 100));

      const deductions = breakdown.deductions + attendanceDeduction + extraDeduction + tdsDeduction;
      const netSalary = roundAmount(Math.max(0, breakdown.grossSalary - deductions), row.structure?.roundOffRule);
      return {
        ...row,
        existing,
        breakdown,
        presentDays,
        halfDays,
        lateMarks,
        approvedLeaveDays,
        lopDays,
        deductions,
        netSalary
      };
    });
  }, [attendance, generationCandidates, leaveApplications, payrollMonthLabel, payslips]);

  const pendingGenerationRows = useMemo(() => generationRows.filter(row => !row.existing), [generationRows]);

  const historyRows = useMemo(() => {
    return payslips.filter(item => {
      const { month, year } = splitMonthYear(item.month);
      const employeeLabel = `${item.employeeName} (${item.empId})`.trim();
      const matchesEmployee = historyEmployee === 'All Employees' || employeeLabel === historyEmployee;
      const matchesMonth = historyMonth === 'All' || month === historyMonth;
      const matchesYear = historyYear === 'All' || year === historyYear;
      const matchesDepartment = historyDepartment === 'All Departments' || (item.department || 'Unknown') === historyDepartment;
      return matchesEmployee && matchesMonth && matchesYear && matchesDepartment;
    });
  }, [historyDepartment, historyEmployee, historyMonth, historyYear, payslips]);

  const activePreviewMonth = useMemo(() => {
    if (historyMonth === 'All' && historyYear === 'All') {
      return 'All Periods';
    }
    if (historyMonth !== 'All' && historyYear === 'All') {
      return `${historyMonth} (All Years)`;
    }
    if (historyMonth === 'All' && historyYear !== 'All') {
      return `All Months ${historyYear}`;
    }
    return `${historyMonth} ${historyYear}`;
  }, [historyMonth, historyYear]);

  const currentPreviewStaff = drawerStaff;

  const openStructureModal = (mode: 'add' | 'edit' | 'duplicate', structure?: SalaryStructure) => {
    setStructureMode(mode);
    setStructureEditingId(structure?.id || null);
    setStructureDraft(
      structure
        ? getStructureDraftFromStructure(structure, mode)
        : structureDraftDefaults
    );
    setStructureModalOpen(true);
  };

  const openAssignmentModal = (staffMember?: Staff) => {
    const member = staffMember || null;
    const category = member ? resolveCategory(member) : '';
    const activeAssignment = member ? employeeSalaryAssignments.find(item => (item.employeeId === member.id || item.empId === member.empId) && item.status === 'Active') || null : null;
    
    const staffSpecificStructure = member ? salaryStructures.find(item => 
      (item as any).staffId === member.id || 
      (item as any).employeeId === member.id || 
      normalize(item.structureName).includes(normalize(`${member.firstName} ${member.lastName}`))
    ) : null;

    const candidateStructures = member ? salaryStructures.filter(item => structureMatches(item, category, member.designation || '')) : [];
    const structure = member ? (
      activeAssignment
        ? salaryStructures.find(item => item.id === activeAssignment.salaryStructureId)
        : (staffSpecificStructure || candidateStructures[0] || salaryStructures.find(item => item.employeeCategory === category) || null)
    ) : null;

    const breakdown = structure ? getStructureBreakdown(structure, activeAssignment || undefined, member || undefined) : { basicSalary: 0, allowances: 0, deductions: 0, grossSalary: 0, netSalary: 0 };

    setAssignmentDraft({
      employeeId: member?.id || '',
      employeeCategory: category,
      designation: member?.designation || '',
      salaryStructureId: structure?.id || '',
      salaryOverride: !!activeAssignment?.salaryOverride,
      basicSalary: structure ? String(activeAssignment?.overrideBasicSalary ?? breakdown.basicSalary) : '',
      allowances: structure ? String(activeAssignment?.overrideAllowances ?? breakdown.allowances) : '',
      deductions: structure ? String(activeAssignment?.overrideDeductions ?? breakdown.deductions) : '',
      effectiveDate: activeAssignment?.effectiveDate || todayString()
    });
    setAssignmentModalOpen(true);
  };

  const closeStructureModal = () => {
    setStructureModalOpen(false);
    setStructureEditingId(null);
    setStructureDraft(structureDraftDefaults);
  };

  const closeAssignmentModal = () => {
    setAssignmentModalOpen(false);
    setAssignmentDraft(assignmentDraftDefaults);
  };


  const filteredDesignationOptions = useMemo(() => {
    return getDesignationOptions(assignmentDraft.employeeCategory);
  }, [assignmentDraft.employeeCategory, designations]);

  const structureOptionsForAssignment = useMemo(() => {
    const category = assignmentDraft.employeeCategory;
    const designation = assignmentDraft.designation;
    const empId = assignmentDraft.employeeId;
    const member = staff.find(s => s.id === empId);

    const employeeStructures = salaryStructures.filter(item => 
      empId && (
        (item as any).staffId === empId || 
        (item as any).employeeId === empId || 
        (member && normalize(item.structureName).includes(normalize(`${member.firstName} ${member.lastName}`)))
      )
    );

    const matches = salaryStructures.filter(item => structureMatches(item, category, designation));
    const otherCategory = category ? salaryStructures.filter(item => item.employeeCategory === category) : salaryStructures;
    
    return Array.from(new Set([...employeeStructures, ...matches, ...otherCategory, ...salaryStructures]));
  }, [assignmentDraft.designation, assignmentDraft.employeeCategory, assignmentDraft.employeeId, salaryStructures, staff]);

  useEffect(() => {
    if (!assignmentModalOpen) return;
    if (!assignmentDraft.employeeId) return;
    const member = staff.find(item => item.id === assignmentDraft.employeeId);
    if (!member) return;
    const category = resolveCategory(member);
    const designation = member.designation || assignmentDraft.designation;
    const staffSpecificStructure = salaryStructures.find(item => 
      (item as any).staffId === member.id || 
      (item as any).employeeId === member.id || 
      normalize(item.structureName).includes(normalize(`${member.firstName} ${member.lastName}`))
    ) || null;
    const options = salaryStructures.filter(item => structureMatches(item, category, designation));
    const nextStructure = staffSpecificStructure || options[0] || salaryStructures.find(item => item.employeeCategory === category);
    if (!assignmentDraft.salaryStructureId && nextStructure) {
      setAssignmentDraft(prev => ({
        ...prev,
        employeeCategory: category,
        designation,
        salaryStructureId: nextStructure.id
      }));
    }
  }, [assignmentDraft.employeeId, assignmentModalOpen, salaryStructures, staff]);

  useEffect(() => {
    if (!structureModalOpen) return;
    if (structureDraft.id) return;
    if (!structureDraft.structureName) {
      setStructureDraft(prev => ({
        ...prev,
        structureName: `${getCategoryLabel(prev.employeeCategory)} ${prev.designation || 'Scale'}`.trim()
      }));
    }
  }, [structureDraft.designation, structureDraft.employeeCategory, structureDraft.id, structureDraft.structureName, structureModalOpen]);

  const saveStructure = async () => {
    if (!structureDraft.structureName.trim() || !structureDraft.designation.trim()) {
      addToast('warning', 'Missing details', 'Please enter a structure name and designation before saving.');
      return;
    }

    const payload = buildStructurePayload(structureDraft);

    if (structureMode === 'edit' && structureEditingId) {
      await updateSalaryStructure(structureEditingId, payload);
      if (structureDraft.staffId) {
        const linkedStaffMember = staff.find(s => String(s.id) === String(structureDraft.staffId));
        if (linkedStaffMember) {
          const breakdown = getStructureBreakdown(payload as any, undefined, linkedStaffMember);
          const empFullName = `${linkedStaffMember.firstName || ''} ${linkedStaffMember.lastName || ''}`.trim() || linkedStaffMember.name || 'Staff Member';
          await assignEmployeeSalaryStructure({
            employeeId: linkedStaffMember.id,
            employeeName: empFullName,
            empId: linkedStaffMember.empId,
            employeeCategory: resolveCategory(linkedStaffMember),
            branch: linkedStaffMember.branch || 'Main Campus',
            department: linkedStaffMember.department,
            salaryStructureId: structureEditingId,
            salaryStructureName: payload.structureName,
            effectiveDate: structureDraft.effectiveDate || todayString(),
            status: 'Active',
            salaryOverride: false,
            overrideBasicSalary: breakdown.basicSalary,
            overrideAllowances: breakdown.allowances,
            overrideDeductions: breakdown.deductions,
            overrideNetSalary: breakdown.netSalary,
            monthlyGross: breakdown.grossSalary
          });
        }
      }
      addToast('success', 'Salary structure updated', `${payload.structureName} was updated and assigned to employee.`);
    } else {
      const tempStructureId = `struct-${Date.now()}`;
      const result = await addSalaryStructure({ ...payload, id: tempStructureId } as any);
      const newStructureId = result?.id ? String(result.id) : (result?.data?.id ? String(result.data.id) : tempStructureId);

      if (structureDraft.staffId) {
        const linkedStaffMember = staff.find(s => String(s.id) === String(structureDraft.staffId));
        if (linkedStaffMember) {
          const breakdown = getStructureBreakdown(payload as any, undefined, linkedStaffMember);
          const empFullName = `${linkedStaffMember.firstName || ''} ${linkedStaffMember.lastName || ''}`.trim() || linkedStaffMember.name || 'Staff Member';
          await assignEmployeeSalaryStructure({
            employeeId: linkedStaffMember.id,
            employeeName: empFullName,
            empId: linkedStaffMember.empId,
            employeeCategory: resolveCategory(linkedStaffMember),
            branch: linkedStaffMember.branch || 'Main Campus',
            department: linkedStaffMember.department,
            salaryStructureId: newStructureId,
            salaryStructureName: payload.structureName,
            effectiveDate: structureDraft.effectiveDate || todayString(),
            status: 'Active',
            salaryOverride: false,
            overrideBasicSalary: breakdown.basicSalary,
            overrideAllowances: breakdown.allowances,
            overrideDeductions: breakdown.deductions,
            overrideNetSalary: breakdown.netSalary,
            monthlyGross: breakdown.grossSalary
          });
        }
      }
      addToast('success', 'Salary structure created', `${payload.structureName} was created and directly assigned to employee.`);
    }
    closeStructureModal();
  };

  const assignSalary = () => {
    const member = staff.find(item => item.id === assignmentDraft.employeeId);
    const structure = salaryStructures.find(item => item.id === assignmentDraft.salaryStructureId);
    if (!member || !structure) {
      addToast('warning', 'Missing selection', 'Please choose an employee and a salary structure.');
      return;
    }

    const breakdown = getStructureBreakdown(structure, assignmentDraft.salaryOverride ? {
      overrideBasicSalary: Number(assignmentDraft.basicSalary) || 0,
      overrideAllowances: Number(assignmentDraft.allowances) || 0,
      overrideDeductions: Number(assignmentDraft.deductions) || 0
    } : undefined);

    assignEmployeeSalaryStructure({
      employeeId: member.id,
      employeeName: `${member.firstName} ${member.lastName}`.trim(),
      empId: member.empId,
      employeeCategory: resolveCategory(member),
      branch: member.branch || 'Main Campus',
      department: member.department,
      salaryStructureId: structure.id,
      salaryStructureName: structure.structureName,
      effectiveDate: assignmentDraft.effectiveDate || todayString(),
      status: 'Active',
      salaryOverride: assignmentDraft.salaryOverride,
      overrideBasicSalary: assignmentDraft.salaryOverride ? Number(assignmentDraft.basicSalary) || breakdown.basicSalary : undefined,
      overrideAllowances: assignmentDraft.salaryOverride ? Number(assignmentDraft.allowances) || breakdown.allowances : undefined,
      overrideDeductions: assignmentDraft.salaryOverride ? Number(assignmentDraft.deductions) || breakdown.deductions : undefined,
      overrideNetSalary: assignmentDraft.salaryOverride ? breakdown.netSalary : undefined,
      monthlyGross: breakdown.grossSalary
    });

    addToast('success', 'Salary assigned', `${member.firstName} ${member.lastName} is now linked to ${structure.structureName}.`);
    closeAssignmentModal();
  };

  const createPayslipForRow = (row: (typeof generationRows)[number]) => {
    const existing = row.existing;
    if (existing && Number(existing.grossSalary) > 0 && Number(existing.netSalary) > 0) {
      return existing;
    }

    const member = row.member;
    const structure = row.structure;
    const breakdown = row.breakdown;
    const grossSalary = breakdown.grossSalary > 0 ? breakdown.grossSalary : Number(member.salary || 0);
    const attendanceDeduction = Math.max(0, row.deductions - breakdown.deductions);
    const totalDeductions = row.deductions > 0 ? row.deductions : breakdown.deductions;
    const netSalary = row.netSalary > 0 ? row.netSalary : Math.max(0, grossSalary - totalDeductions);
    const basicSalary = breakdown.basicSalary > 0 ? breakdown.basicSalary : Math.round(grossSalary * 0.5);
    const allowances = breakdown.allowances > 0 ? breakdown.allowances : Math.max(0, grossSalary - basicSalary);

    const payload: Omit<Payslip, 'id'> = {
      employeeId: member.id,
      employeeName: `${member.firstName} ${member.lastName}`.trim(),
      empId: member.empId,
      branch: member.branch || 'Main Campus',
      department: member.department,
      designation: member.designation,
      employeeCategory: resolveCategory(member),
      month: payrollMonthLabel,
      basicSalary,
      hra: Math.round(allowances * 0.45),
      da: Math.round(allowances * 0.25),
      earnings: [
        { name: 'Basic Salary', amount: basicSalary, type: 'Fixed', value: basicSalary },
        { name: 'Allowances', amount: allowances, type: 'Fixed', value: allowances }
      ],
      deductions: [
        { name: 'Structure Deductions', amount: breakdown.deductions, type: 'Fixed', value: breakdown.deductions },
        ...(attendanceDeduction > 0 ? [{ name: 'Attendance Deduction', amount: attendanceDeduction, type: 'Fixed', value: attendanceDeduction }] : [])
      ],
      grossSalary,
      otherDeductions: totalDeductions,
      pfDeduction: breakdown.deductions > 0 ? Math.round(basicSalary * 0.12) : 0,
      leaveDeduction: attendanceDeduction,
      lopDeduction: row.lopDays,
      netSalary,
      bankAccount: member.bankDetails?.accountNumber || 'N/A',
      disbursedDate: todayString(),
      paymentDate: todayString(),
      leaveDetails: {
        paidLeaveDays: row.approvedLeaveDays,
        unpaidLeaveDays: row.lopDays,
        halfDays: row.halfDays,
        lateEntries: row.lateMarks
      },
      status: 'Generated'
    };

    disburseSalary(payload);
    return payload as Payslip;
  };

  const handleBulkGenerate = () => setIsGenerateModalOpen(true);
  
  const confirmBulkGenerate = () => {
    setIsGenerateModalOpen(false);
    const targetRows = selectedGenerationIds.length > 0
      ? generationRows.filter(row => selectedGenerationIds.includes(row.member.id))
      : generationRows;
    const created = targetRows.filter(row => !row.existing).map(createPayslipForRow).length;
    addToast('success', 'Payslips generated', created > 0 ? `${created} payslip${created === 1 ? '' : 's'} generated for ${payrollMonthLabel}.` : 'Nothing new to generate for this payroll period.');
  };

  const handleBulkDownload = () => {
    addToast('info', 'Download queued', `${generationRows.length} payroll records prepared for PDF download.`);
  };

  const handleBulkEmail = () => {
    addToast('info', 'Email queued', `${generationRows.length} payroll records queued for email delivery.`);
  };

  const renderEmployeesTab = () => {
    const totalEmployees = employeeRows.length;
    const activeEmployees = employeeRows.filter(row => row.assignment && row.assignment.status === 'Active').length;
    const unassignedEmployees = totalEmployees - activeEmployees;

    const paginatedEmployeeRows = filteredEmployeeRows.slice(
      (employeePage - 1) * employeePerPage,
      employeePage * employeePerPage
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Employees" value={String(totalEmployees)} icon={Users} tone="sky" />
          <StatCard label="Active" value={String(activeEmployees)} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Inactive" value={String(unassignedEmployees)} icon={AlertTriangle} tone="amber" />
          <StatCard label="Overrides" value={String(overrideEmployeeCount)} icon={ShieldCheck} tone="brand" />
        </div>

        <Panel
          title="Employee Payroll"
          action={(
            <div className="flex items-center gap-2">
              {selectedEmployeeIds.length > 0 && (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-xs font-black text-white shadow-lg shadow-slate-700/20"
                >
                  Bulk Actions ({selectedEmployeeIds.length})
                </button>
              )}
              <ExportButton
                data={filteredEmployeeRows.map(r => ({
                  'Employee ID': r.member.empId,
                  'Employee Name': `${r.member.firstName} ${r.member.lastName}`,
                  'Category': getCategoryLabel(r.category),
                  'Department': r.member.department,
                  'Designation': r.member.designation,
                  'Salary Structure': r.structure?.structureName || 'Not Assigned',
                  'Payroll Status': r.payrollStatus
                }))}
                filename="employee_payroll"
              />
              <button
                type="button"
                onClick={() => openAssignmentModal()}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-black text-white shadow-lg shadow-brand-500/20"
              >
                <Plus className="h-3.5 w-3.5" /> Assign Salary
              </button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  placeholder="Search..."
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div className="w-48">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
              <SelectField value={employeeCategoryFilter} onChange={e => setEmployeeCategoryFilter(e.target.value as 'All' | CategoryValue)}>
                <option value="All">All Categories</option>
                <option value="Teacher">Teaching Staff</option>
                <option value="Staff">Non-Teaching Staff</option>
              </SelectField>
            </div>
            <div className="w-48">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Structure</label>
              <SelectField value={employeeStructureFilter} onChange={e => setEmployeeStructureFilter(e.target.value)}>
                {structureOptions.map(option => <option key={option}>{option}</option>)}
              </SelectField>
            </div>
            <div className="w-48">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
              <SelectField value={employeeStatusFilter} onChange={e => setEmployeeStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </SelectField>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[1100px] w-full text-center border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-3 py-2 text-center w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      checked={filteredEmployeeRows.length > 0 && filteredEmployeeRows.every((r, idx) => selectedEmployeeIds.includes(getEmployeeUniqueId(r.member, idx)))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployeeIds(filteredEmployeeRows.map((r, idx) => getEmployeeUniqueId(r.member, idx)));
                        } else {
                          setSelectedEmployeeIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 text-center">Employee ID</th>
                  <th className="px-3 py-2 text-center">Employee Name</th>
                  <th className="px-3 py-2 text-center">Category</th>
                  <th className="px-3 py-2 text-center">Department</th>
                  <th className="px-3 py-2 text-center">Designation</th>
                  <th className="px-3 py-2 text-center">Salary Structure</th>
                  <th className="px-3 py-2 text-center">Payroll Status</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployeeRows.length === 0 ? (
                  <tr key="no-employees">
                    <td colSpan={9} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                      No employees matched the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployeeRows.map((row, idx) => {
                    const statusBadge = row.payrollStatus === 'Active' ? 'success' : 'neutral';
                    const empRowId = getEmployeeUniqueId(row.member, (employeePage - 1) * employeePerPage + idx);
                    const isEmpSelected = selectedEmployeeIds.includes(empRowId);
                    return (
                      <tr key={empRowId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                        <td className="px-3 py-2 text-center align-middle">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                            checked={isEmpSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployeeIds(prev => [...prev.filter(id => id !== empRowId), empRowId]);
                              } else {
                                setSelectedEmployeeIds(prev => prev.filter(id => id !== empRowId));
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white text-center align-middle">{row.member.empId}</td>
                        <td className="px-3 py-2 text-center align-middle">
                          <button type="button" onClick={() => setDrawerStaff(row.member)} className="text-center">
                            <div className="text-xs font-black text-slate-900 dark:text-white">{row.member.firstName} {row.member.lastName}</div>
                            <p className="text-[10px] text-slate-500">{row.member.branch || 'Main Campus'}</p>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center align-middle">{getCategoryLabel(row.category)}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center align-middle">{row.member.department}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center align-middle">{row.member.designation}</td>
                        <td className="px-3 py-2 text-center align-middle">
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-slate-900 dark:text-white">{row.structure?.structureName || 'Not Assigned'}</div>
                            {row.assignment?.salaryOverride && <Badge variant="warning" size="sm">Override</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center align-middle">
                          <Badge variant={statusBadge} size="sm">{row.payrollStatus}</Badge>
                        </td>
                        <td className="px-3 py-2 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDrawerStaff(row.member)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                              title="View Profile"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openAssignmentModal(row.member)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
                              title={row.assignment ? 'Edit Salary' : 'Assign Salary'}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (row.assignment) {
                                  deleteSalaryStructure(row.assignment.id);
                                  addToast('info', 'Assignment Removed', `Salary record for ${row.member.firstName} ${row.member.lastName} deleted.`);
                                } else {
                                  addToast('warning', 'No Assignment', `No salary structure is currently assigned to ${row.member.firstName} ${row.member.lastName}.`);
                                }
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                              title="Delete Assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={employeePage}
            totalItems={filteredEmployeeRows.length}
            itemsPerPage={employeePerPage}
            onPageChange={setEmployeePage}
            onItemsPerPageChange={setEmployeePerPage}
            itemsPerPageOptions={[5, 10, 20, 50, 100]}
            label="employees"
          />
        </Panel>
      </div>
    );
  };

  const renderStructureTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Active Structures" value={String(activeStructureCount)} icon={BadgeIndianRupee} tone="emerald" />
        <StatCard label="Total Structures" value={String(salaryStructures.length)} icon={Layers} tone="sky" />
        <StatCard label="Employees Assigned" value={String(assignedEmployeeCount)} icon={Users} tone="brand" />
        <StatCard label="Net Salary Preview" value={formatCurrency(totalPreviewNet)} icon={CheckCircle2} tone="amber" />
      </div>

      <Panel
        title="Salary Structures"
        action={(
          <div className="flex items-center gap-2">
            {selectedStructureIds.length > 0 && (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-xs font-black text-white shadow-lg shadow-slate-700/20"
              >
                Bulk Actions ({selectedStructureIds.length})
              </button>
            )}
            <ExportButton
              data={filteredStructureRows.map(r => ({
                'Structure Name': r.structure.structureName,
                'Category': getCategoryLabel(r.structure.employeeCategory),
                'Designation': r.structure.designation || 'Not set',
                'Effective From': r.structure.effectiveDate || 'Not set',
                'Frequency': r.structure.payrollFrequency || 'Monthly',
                'Gross Salary': r.breakdown.grossSalary,
                'Total Deductions': r.breakdown.deductions,
                'Net Salary': r.breakdown.netSalary,
                'Status': r.structure.status,
                'Employees Assigned': r.assignedCount
              }))}
              filename="salary_structures"
            />
            <button
              type="button"
              onClick={() => openStructureModal('add')}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-black text-white shadow-lg shadow-brand-500/20"
            >
              <Plus className="h-3.5 w-3.5" /> Create Structure
            </button>
          </div>
        )}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={structureSearch} onChange={e => setStructureSearch(e.target.value)} placeholder="Search..." className={`${inputClass} pl-9`} />
            </div>
          </div>
          <div className="w-48">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
            <SelectField value={structureCategoryFilter} onChange={e => setStructureCategoryFilter(e.target.value as 'All' | CategoryValue)}>
              <option value="All">All Categories</option>
              <option value="Teacher">Teaching Staff</option>
              <option value="Staff">Non-Teaching Staff</option>
            </SelectField>
          </div>
          <div className="w-48">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
            <SelectField value={structureDesignationFilter} onChange={e => setStructureDesignationFilter(e.target.value)}>
              {designationSet.map(item => <option key={item}>{item}</option>)}
            </SelectField>
          </div>
          <div className="w-48">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
            <SelectField value={structureStatusFilter} onChange={e => setStructureStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectField>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-3 py-2 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                    checked={filteredStructureRows.length > 0 && filteredStructureRows.every((r, idx) => selectedStructureIds.includes(r.structure?.id || `struct-${idx}`))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStructureIds(filteredStructureRows.map((r, idx) => r.structure?.id || `struct-${idx}`));
                      } else {
                        setSelectedStructureIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-2 text-center">Structure Name</th>
                <th className="px-3 py-2 text-center">Employee</th>
                <th className="px-3 py-2 text-center">Effective From</th>
                <th className="px-3 py-2 text-center">Frequency</th>
                <th className="px-3 py-2 text-center">Gross Salary</th>
                <th className="px-3 py-2 text-center">Total Deductions</th>
                <th className="px-3 py-2 text-center">Net Salary</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStructureRows.length === 0 ? (
                <tr key="no-structures">
                  <td colSpan={10} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                    No salary structures matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredStructureRows.slice((structurePage - 1) * structurePerPage, structurePage * structurePerPage).map((row, idx) => {
                  const structId = row.structure?.id || `struct-${(structurePage - 1) * structurePerPage + idx}`;
                  return (
                    <tr key={structId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                      <td className="px-3 py-2 text-center align-middle">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                          checked={selectedStructureIds.includes(structId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStructureIds(prev => [...prev.filter(id => id !== structId), structId]);
                            } else {
                              setSelectedStructureIds(prev => prev.filter(id => id !== structId));
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-900 dark:text-white">{row.structure.structureName}</div>
                          {row.structure.structureCode && <p className="text-[10px] text-slate-500 font-semibold">{row.structure.structureCode}</p>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        {row.linkedEmployee ? (
                          <button type="button" onClick={() => setDrawerStaff(row.linkedEmployee)} className="text-center">
                            <div className="text-xs font-black text-slate-900 dark:text-white">
                              {row.linkedEmployee.firstName} {row.linkedEmployee.lastName}
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold">{row.linkedEmployee.empId}</p>
                          </button>
                        ) : row.assignedEmployees && row.assignedEmployees.length > 0 ? (
                          <div className="text-center">
                            <div className="text-xs font-black text-slate-900 dark:text-white">
                              {row.assignedEmployees[0].firstName} {row.assignedEmployees[0].lastName}
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold">{row.assignedEmployees[0].empId}</p>
                            {row.assignedEmployees.length > 1 && (
                              <p className="text-[9px] text-brand-600 font-bold">+{row.assignedEmployees.length - 1} more</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">All Matching Staff</div>
                            <p className="text-[10px] text-slate-400 font-semibold">{row.structure.designation || 'All Staff'}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center align-middle">{row.structure.effectiveDate || 'Not set'}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center align-middle">{row.structure.payrollFrequency || 'Monthly'}</td>
                      <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white text-center align-middle">{formatCurrency(row.breakdown.grossSalary)}</td>
                      <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white text-center align-middle">{formatCurrency(row.breakdown.deductions)}</td>
                      <td className="px-3 py-2 text-xs font-black text-brand-700 dark:text-brand-300 text-center align-middle">{formatCurrency(row.breakdown.netSalary)}</td>
                      <td className="px-3 py-2 text-center align-middle">
                        <Badge variant={row.structure.status === 'Active' ? 'success' : 'neutral'} size="sm">{row.structure.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openStructureModal('edit', row.structure)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Edit Structure"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openStructureModal('duplicate', row.structure)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
                            title="Duplicate Structure"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm(`Delete ${row.structure.structureName}?`)) return;
                              deleteSalaryStructure(row.structure.id);
                              addToast('info', 'Structure deleted', `${row.structure.structureName} was removed from the library.`);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                            title="Delete Structure"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={structurePage}
          totalItems={filteredStructureRows.length}
          itemsPerPage={structurePerPage}
          onPageChange={setStructurePage}
          onItemsPerPageChange={setStructurePerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
          label="structures"
        />
      </Panel>
    </div>
  );

  const renderPayslipGenerationTab = () => {
    const allStaffCount = staff.length;
    const selectedCount = selectedGenerationIds.length;
    const currentPeriodLabel = `${generationMonth} ${generationYear}`;

    const filteredLeftStaff = staff.filter(member => {
      const category = resolveCategory(member);
      const matchesCategory = generationCategory === 'All' || category === generationCategory;

      const q = leftEmployeeSearch.trim().toLowerCase();
      const matchesSearch = !q || (
        member.firstName?.toLowerCase().includes(q) ||
        member.lastName?.toLowerCase().includes(q) ||
        member.empId?.toLowerCase().includes(q) ||
        member.department?.toLowerCase().includes(q) ||
        (member as any).email?.toLowerCase().includes(q)
      );

      return matchesCategory && matchesSearch;
    });

    return (
      <div className="space-y-6">
        {/* Top Header & Payslip Mode Bar */}
        <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                All Employees
                <span className="text-xs font-bold text-slate-500">
                  ({selectedCount > 0 ? `${selectedCount} selected` : `Showing payslips for ${filteredLeftStaff.length} employees`})
                </span>
              </h2>
              <p className="text-xs text-slate-500">Showing payslips for all employees</p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Payslip Mode</span>
              <span className="px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-extrabold text-xs">
                Auto Payslip
              </span>
            </div>
          </div>
        </div>

        {/* Global Deduction & TDS Config Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">DEDUCTION (₹)</label>
            <input
              type="number"
              value={globalDeduction}
              onChange={e => setGlobalDeduction(e.target.value)}
              placeholder="Enter Deduction"
              className={inputClass}
            />
            <p className="text-[11px] font-bold text-slate-500 pt-0.5">
              Current Deduction: ₹{globalDeduction || '0'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 p-4 rounded-2xl shadow-xs space-y-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">TDS (%)</label>
            <input
              type="number"
              value={globalTdsPct}
              onChange={e => setGlobalTdsPct(e.target.value)}
              placeholder="Enter TDS Percentage"
              className={inputClass}
            />
            <p className="text-[11px] font-bold text-slate-500 pt-0.5">
              Current TDS: {globalTdsPct || '0'}%
            </p>
          </div>
        </div>

        {/* Main 2-Column Section: Left Staff Selection List + Right Generate Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Employee Selection Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 rounded-2xl p-4 shadow-xs space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Filter by Category
              </label>
              <SelectField value={generationCategory} onChange={e => setGenerationCategory(e.target.value as any)}>
                <option value="All">All Staff</option>
                <option value="Teacher">Teaching Staff</option>
                <option value="Staff">Non-Teaching Staff</option>
              </SelectField>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={leftEmployeeSearch}
                onChange={e => setLeftEmployeeSearch(e.target.value)}
                placeholder="Search..."
                className={`${inputClass} pl-9`}
              />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-900 dark:text-white">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 h-4 w-4"
                  checked={filteredLeftStaff.length > 0 && filteredLeftStaff.every((s, idx) => selectedGenerationIds.includes(getEmployeeUniqueId(s, idx)))}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedGenerationIds(filteredLeftStaff.map((s, idx) => getEmployeeUniqueId(s, idx)));
                    } else {
                      setSelectedGenerationIds([]);
                    }
                  }}
                />
                <span>Select All ({filteredLeftStaff.length})</span>
              </label>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGenerationIds([])}
                  className="text-[11px] font-bold text-rose-500 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
              {filteredLeftStaff.map((member, idx) => {
                const memberId = getEmployeeUniqueId(member, idx);
                const isChecked = selectedGenerationIds.includes(memberId);
                const dept = member.department || member.designation || member.role || 'Staff';
                return (
                  <div
                    key={memberId}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedGenerationIds(prev => prev.filter(id => id !== memberId));
                      } else {
                        setSelectedGenerationIds(prev => [...prev.filter(id => id !== memberId), memberId]);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-sky-50/70 border-sky-300 dark:bg-sky-950/40 dark:border-sky-800'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-600 h-4 w-4"
                      />
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">{member.empId}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {dept}
                    </span>
                  </div>
                );
              })}
              {filteredLeftStaff.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 italic">No employees found.</div>
              )}
            </div>
          </div>

          {/* Right Control Box: Generate Payslip & Period Selector */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Generate Payslip
                </h3>
                <Badge variant={selectedCount > 0 ? 'success' : 'slate'} size="sm">
                  {selectedCount > 0 ? `${selectedCount} Selected` : 'No Selection'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                    STANDARD PERIODS
                  </label>
                  <div className="flex items-center gap-1.5">
                    {(['1m', '3m', '6m', '12m'] as const).map(period => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setStandardPeriod(period)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                          standardPeriod === period
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                    SPECIFIC PERIOD
                  </label>
                  <div className="flex items-center gap-2">
                    <SelectField value={generationMonth} onChange={e => setGenerationMonth(e.target.value)}>
                      {monthOptions.map(month => (
                        <option key={month}>{month}</option>
                      ))}
                    </SelectField>
                    <SelectField value={generationYear} onChange={e => setGenerationYear(e.target.value)}>
                      {yearOptions.map(year => (
                        <option key={year}>{year}</option>
                      ))}
                    </SelectField>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBulkGenerate}
                disabled={selectedCount === 0}
                className={`w-full py-3.5 rounded-xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  selectedCount > 0
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                }`}
              >
                <ReceiptText className="w-4 h-4" />
                {selectedCount > 0
                  ? `Generate Payslips for ${selectedCount} Employee(s) (${standardPeriod} / ${currentPeriodLabel})`
                  : 'Select employee(s) to generate'}
              </button>
            </div>

            {/* Recently Generated Section */}
            <Panel
              title="Recently Generated"
              subtitle={`Payslip records for ${currentPeriodLabel}`}
              action={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkDownload}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 text-xs font-black text-white shadow-md shadow-slate-700/20"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Monthly Report
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkEmail}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-xs font-black text-white shadow-md shadow-brand-500/20"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send Payslip Emails
                  </button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-center border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-3 py-2 text-center">EMPLOYEE</th>
                      <th className="px-3 py-2 text-center">DEPARTMENT</th>
                      <th className="px-3 py-2 text-center">PERIOD</th>
                      <th className="px-3 py-2 text-center">NET PAY</th>
                      <th className="px-3 py-2 text-center">DEDUCTION</th>
                      <th className="px-3 py-2 text-center">CTC</th>
                      <th className="px-3 py-2 text-center">GENERATED</th>
                      <th className="px-3 py-2 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generationRows.filter(r => r.existing).length === 0 ? (
                      <tr key="no-generated-payslips">
                        <td colSpan={8} className="px-6 py-10 text-center text-sm font-semibold text-slate-400 italic">
                          No Payslips Generated
                        </td>
                      </tr>
                    ) : (
                      generationRows.filter(r => r.existing).slice((generatedHistoryPage - 1) * generatedHistoryPerPage, generatedHistoryPage * generatedHistoryPerPage).map((row, idx) => {
                        const existing = row.existing!;
                        const rawGross = Number(existing.grossSalary) || 0;
                        const rawDeductions = (existing.otherDeductions || 0) + (existing.leaveDeduction || 0) + (existing.pfDeduction || 0);
                        const rawNet = Number(existing.netSalary) || 0;

                        const fallbackGross = (row.breakdown?.grossSalary && row.breakdown.grossSalary > 0) ? row.breakdown.grossSalary : Number(row.member?.salary || 0);
                        const safeGross = rawGross > 0 ? rawGross : fallbackGross;
                        const safeDeductions = rawDeductions > 0 ? rawDeductions : (row.breakdown?.deductions || 0);
                        const safeNet = rawNet > 0 ? rawNet : (safeGross > 0 ? Math.max(0, safeGross - safeDeductions) : (row.breakdown?.netSalary || 0));
                        const safeCtc = safeGross * 12;

                        return (
                          <tr key={existing.id || existing.payslipNumber || `gen-row-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                            <td className="px-3 py-2 text-center align-middle">
                              <div className="text-center">
                                <p className="font-extrabold text-slate-900 dark:text-white">{existing.employeeName}</p>
                                <p className="text-[10px] text-slate-400">{existing.empId}</p>
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-center align-middle">{existing.department || row.member?.department || 'Staff'}</td>
                            <td className="px-3 py-2 font-semibold text-center align-middle">{existing.month}</td>
                            <td className="px-3 py-2 text-center align-middle font-black text-brand-700 dark:text-brand-300">{formatCurrency(safeNet)}</td>
                            <td className="px-3 py-2 text-center align-middle font-bold">{formatCurrency(safeDeductions)}</td>
                            <td className="px-3 py-2 text-center align-middle font-bold">{formatCurrency(safeCtc)}</td>
                            <td className="px-3 py-2 text-center align-middle">
                              <Badge variant="success" size="sm">{existing.paymentDate || 'Generated'}</Badge>
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePrintPayslip(existing, false)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintPayslip(existing, true)}
                                  className="p-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/30 dark:text-brand-300"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={generatedHistoryPage}
                totalItems={generationRows.filter(r => r.existing).length}
                itemsPerPage={generatedHistoryPerPage}
                onPageChange={setGeneratedHistoryPage}
                onItemsPerPageChange={setGeneratedHistoryPerPage}
                itemsPerPageOptions={[5, 10, 20, 50, 100]}
                label="payslips"
              />
            </Panel>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Paid" value={String(historyRows.filter(item => item.status === 'Paid').length)} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Generated" value={String(historyRows.filter(item => item.status === 'Generated').length)} icon={ReceiptText} tone="amber" />
      </div>

      <Panel
        title="Payslip History"
        action={(
          <div className="flex items-center gap-2">
            {selectedHistoryIds.length > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  const count = selectedHistoryIds.length;
                  if (count === 0) return;
                  
                  const headers = ['Month', 'Employee Name', 'Emp ID', 'Gross Salary', 'Deductions', 'Net Salary', 'Generated Date', 'Payment Status'];
                  const rowsToDownload = historyRows.filter((r, idx) => selectedHistoryIds.includes(getPayslipUniqueId(r, idx)));
                  const excelRows = [
                    headers,
                    ...rowsToDownload.map(row => {
                      const linkedStaff = staff.find(member => member.id === row.employeeId) || null;
                      const activeAssignment = employeeSalaryAssignments.find(item => (item.employeeId === row.employeeId || item.empId === row.empId) && item.status === 'Active') || null;
                      let structure = salaryStructures.find(item => item.id === activeAssignment?.salaryStructureId) || null;
                      if (!structure && linkedStaff) {
                        const category = resolveCategory(linkedStaff);
                        const matches = salaryStructures.filter(item => structureMatches(item, category, linkedStaff.designation || ''));
                        structure = matches[0] || salaryStructures.find(item => item.employeeCategory === category) || salaryStructures[0] || null;
                      }
                      const breakdown = getStructureBreakdown(structure || undefined, activeAssignment || undefined, linkedStaff || undefined);
                      const rawGross = Number(row.grossSalary) || 0;
                      const rawDed = (row.leaveDeduction || 0) + (row.otherDeductions || 0) + (row.pfDeduction || 0);
                      const rawNet = Number(row.netSalary) || 0;
                      const fallbackGross = (breakdown?.grossSalary && breakdown.grossSalary > 0) ? breakdown.grossSalary : Number(linkedStaff?.salary || 0);
                      const safeGross = rawGross > 0 ? rawGross : fallbackGross;
                      const safeDed = rawDed > 0 ? rawDed : (breakdown?.deductions || 0);
                      const safeNet = rawNet > 0 ? rawNet : (safeGross > 0 ? Math.max(0, safeGross - safeDed) : (breakdown?.netSalary || 0));

                      return [
                        row.month,
                        row.employeeName,
                        row.empId,
                        safeGross,
                        safeDed,
                        safeNet,
                        row.paymentDate || 'Pending',
                        row.status
                      ];
                    })
                  ];
                  
                  try {
                    exportToExcel(excelRows, `payslips_${new Date().getTime()}`, 'Payslips');
                    addToast('success', 'Download Complete', `Downloaded ${count} payslip(s) in Excel (.xlsx) format.`);
                  } catch (err: any) {
                    console.error("Payslip export error:", err);
                    addToast('error', 'Download Failed', err.message || 'Failed to download payslips.');
                  }
                }} 
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-black text-white shadow-lg shadow-brand-500/20"
              >
                <Download className="h-3.5 w-3.5" /> 
                {selectedHistoryIds.length > 1 ? `Download All (${selectedHistoryIds.length})` : 'Download'}
              </button>
            )}
          </div>
        )}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
            <SearchableSelect value={historyEmployee} onChange={setHistoryEmployee} options={employeeOptions} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Month</label>
            <SelectField value={historyMonth} onChange={e => setHistoryMonth(e.target.value)}>
              <option value="All">All Months</option>
              {monthOptions.map(month => <option key={month}>{month}</option>)}
            </SelectField>
          </div>
          <div className="w-32">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Year</label>
            <SelectField value={historyYear} onChange={e => setHistoryYear(e.target.value)}>
              <option value="All">All Years</option>
              {yearOptions.map(year => <option key={year}>{year}</option>)}
            </SelectField>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</label>
            <SearchableSelect value={historyDepartment} onChange={setHistoryDepartment} options={departments} getCode={(val) => val.substring(0, 3).toUpperCase()} />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-3 py-2 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                    checked={historyRows.length > 0 && historyRows.every((r, idx) => selectedHistoryIds.includes(getPayslipUniqueId(r, idx)))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedHistoryIds(historyRows.map((r, idx) => getPayslipUniqueId(r, idx)));
                      } else {
                        setSelectedHistoryIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-2 text-center">Month</th>
                <th className="px-3 py-2 text-center">Year</th>
                <th className="px-3 py-2 text-center">Employee</th>
                <th className="px-3 py-2 text-center">Gross Salary</th>
                <th className="px-3 py-2 text-center">Deductions</th>
                <th className="px-3 py-2 text-center">Net Salary</th>
                <th className="px-3 py-2 text-center">Payment Status</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 ? (
                <tr key="no-history-records">
                  <td colSpan={9} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                    No payslip records found for the selected filters.
                  </td>
                </tr>
              ) : (
                historyRows.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((item, idx) => {
                  const globalIdx = (historyPage - 1) * historyPerPage + idx;
                  const rowId = getPayslipUniqueId(item, globalIdx);
                  const isChecked = selectedHistoryIds.includes(rowId);
                  const { month, year } = splitMonthYear(item.month);
                  const linkedStaff = staff.find(member => member.id === item.employeeId) || null;
                  const activeAssignment = employeeSalaryAssignments.find(a => (a.employeeId === item.employeeId || a.empId === item.empId) && a.status === 'Active') || null;
                  let structure = salaryStructures.find(s => s.id === activeAssignment?.salaryStructureId) || null;
                  if (!structure && linkedStaff) {
                    const category = resolveCategory(linkedStaff);
                    const matches = salaryStructures.filter(s => structureMatches(s, category, linkedStaff.designation || ''));
                    structure = matches[0] || salaryStructures.find(s => s.employeeCategory === category) || salaryStructures[0] || null;
                  }
                  const breakdown = getStructureBreakdown(structure || undefined, activeAssignment || undefined, linkedStaff || undefined);
                  const rawGross = Number(item.grossSalary) || 0;
                  const rawDed = (item.leaveDeduction || 0) + (item.otherDeductions || 0) + (item.pfDeduction || 0);
                  const rawNet = Number(item.netSalary) || 0;
                  const fallbackGross = (breakdown?.grossSalary && breakdown.grossSalary > 0) ? breakdown.grossSalary : Number(linkedStaff?.salary || 0);
                  const safeGross = rawGross > 0 ? rawGross : fallbackGross;
                  const safeDed = rawDed > 0 ? rawDed : (breakdown?.deductions || 0);
                  const safeNet = rawNet > 0 ? rawNet : (safeGross > 0 ? Math.max(0, safeGross - safeDed) : (breakdown?.netSalary || 0));

                  return (
                    <tr key={rowId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                      <td className="px-3 py-1.5 text-center align-middle">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedHistoryIds(prev => [...prev.filter(id => id !== rowId), rowId]);
                            } else {
                              setSelectedHistoryIds(prev => prev.filter(id => id !== rowId));
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white text-center align-middle">{month}</td>
                      <td className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center align-middle">{year}</td>
                      <td className="px-3 py-1.5 text-center align-middle">
                        <button type="button" onClick={() => setDrawerStaff(linkedStaff || null)} className="text-center">
                          <div className="text-xs font-black text-slate-900 dark:text-white">{item.employeeName}</div>
                          <p className="text-[10px] text-slate-500">{item.empId}</p>
                        </button>
                      </td>
                      <td className="px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white text-center align-middle">{formatCurrency(safeGross)}</td>
                      <td className="px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white text-center align-middle">{formatCurrency(safeDed)}</td>
                      <td className="px-3 py-1.5 text-xs font-black text-brand-700 dark:text-brand-300 text-center align-middle">{formatCurrency(safeNet)}</td>
                      <td className="px-3 py-1.5 text-center align-middle">
                        <Badge variant={item.status === 'Paid' ? 'success' : 'warning'} size="sm">{item.status || 'Generated'}</Badge>
                      </td>
                      <td className="px-3 py-1.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => handlePrintPayslip(item, false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors" title="View Payslip">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              handlePrintPayslip(item, true);
                              addToast('success', 'Download Started', `${item.employeeName} payslip PDF prepared.`);
                            }} 
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-900/50 transition-colors" 
                            title="Download Payslip PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => addToast('info', 'Email queued', `${item.employeeName} payslip email prepared.`)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors" title="Email Payslip">
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={historyPage}
          totalItems={historyRows.length}
          itemsPerPage={historyPerPage}
          onPageChange={setHistoryPage}
          onItemsPerPageChange={setHistoryPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
          label="payslips"
        />
      </Panel>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff-payroll-employees':
        return renderEmployeesTab();
      case 'staff-payroll-structures':
        return renderStructureTab();
      case 'staff-payroll-payslips':
        return renderPayslipGenerationTab();
      case 'staff-payroll-history':
        return renderHistoryTab();
      default:
        return renderEmployeesTab();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BadgeIndianRupee className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Payroll
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {payrollTabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[52px] items-center justify-center xl:justify-start gap-2 rounded-2xl border px-3 py-2 text-left transition-all ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'border-slate-200 bg-white shadow-sm text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              <div className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-center xl:text-left leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {renderTabContent()}

      {structureModalOpen && (
        <ModalShell
          title={structureMode === 'add' ? 'Create Salary Structure' : structureMode === 'edit' ? 'Edit Salary Structure' : 'Duplicate Salary Structure'}
          onClose={closeStructureModal}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Card 1: Package & Basic Details */}
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">1. Package & Basic Details</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill these fields according to your offer letter salary structure.</p>
                </div>
                <button
                  type="button"
                  onClick={() => autoCalculateCorporateSalary()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors shrink-0 cursor-pointer"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Auto-Calculate Breakdown
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">Annual CTC (Without Variable Pay) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={structureDraft.annualCtc || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setStructureDraft(prev => ({ ...prev, annualCtc: val }));
                        autoCalculateCorporateSalary(val);
                      }}
                      className={`${inputClass} pl-8 font-extrabold text-sky-700 dark:text-sky-300`}
                      placeholder="e.g. 399996"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee Category *</label>
                  <SelectField
                    value={structureDraft.employeeCategory}
                    onChange={e => {
                      const newCat = e.target.value as CategoryValue;
                      setStructureDraft(prev => ({ ...prev, employeeCategory: newCat, staffId: '', designation: '', department: '' }));
                    }}
                  >
                    <option value="Teacher">Teaching Staff</option>
                    <option value="Staff">Non-Teaching Staff</option>
                  </SelectField>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Select Employee / Staff *</label>
                  <SearchableStaffSelect
                    value={structureDraft.staffId || ''}
                    onChange={handleStaffSelect}
                    staffList={availableCategoryStaff}
                    placeholder="Search name, ID, designation..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation (Auto-populated)</label>
                  <input
                    readOnly
                    disabled
                    value={structureDraft.designation}
                    className={`${inputClass} bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 opacity-80 cursor-not-allowed font-bold`}
                    placeholder="Auto-populated on staff selection"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department (Auto-populated)</label>
                  <input
                    readOnly
                    disabled
                    value={structureDraft.department || ''}
                    className={`${inputClass} bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 opacity-80 cursor-not-allowed font-bold`}
                    placeholder="Auto-populated on staff selection"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Structure Name *</label>
                  <input
                    value={structureDraft.structureName}
                    onChange={e => setStructureDraft(prev => ({ ...prev, structureName: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Senior Teacher Scale"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Effective From</label>
                  <input
                    type="date"
                    value={structureDraft.effectiveDate}
                    onChange={e => setStructureDraft(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payroll Frequency</label>
                  <SelectField
                    value={structureDraft.payrollFrequency}
                    onChange={e => setStructureDraft(prev => ({ ...prev, payrollFrequency: e.target.value as any }))}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Per Class">Per Class</option>
                    <option value="Contractual">Contractual</option>
                  </SelectField>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
                  <SelectField
                    value={structureDraft.status}
                    onChange={e => setStructureDraft(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </SelectField>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Description / Notes</label>
                  <textarea
                    value={structureDraft.notes}
                    onChange={e => setStructureDraft(prev => ({ ...prev, notes: e.target.value }))}
                    className={`${inputClass} min-h-[70px] py-2`}
                    placeholder="Optional notes about this salary template..."
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Earnings Components (Monthly) */}
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">2. Earnings Components (Monthly)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Customize percentage formulas or specify custom amounts</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Basic % config */}
                  <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/50 rounded-xl px-2.5 py-1 text-xs">
                    <span className="font-bold text-sky-700 dark:text-sky-300 text-[11px]">Basic:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={structureDraft.basicPercentage}
                      onChange={e => {
                        const val = e.target.value;
                        setStructureDraft(prev => ({ ...prev, basicPercentage: val }));
                        if (Number(structureDraft.annualCtc) > 0) {
                          autoCalculateCorporateSalary(structureDraft.annualCtc, val, structureDraft.hraPercentage);
                        }
                      }}
                      className="w-12 h-6 text-center text-xs font-black text-sky-900 dark:text-sky-100 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                      placeholder="50"
                      title="Basic Salary Percentage (% of Monthly Gross)"
                    />
                    <span className="font-bold text-sky-700 dark:text-sky-300 text-[11px]">% of Gross</span>
                  </div>

                  {/* HRA % config */}
                  <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/50 rounded-xl px-2.5 py-1 text-xs">
                    <span className="font-bold text-sky-700 dark:text-sky-300 text-[11px]">HRA:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={structureDraft.hraPercentage}
                      onChange={e => {
                        const val = e.target.value;
                        setStructureDraft(prev => ({ ...prev, hraPercentage: val }));
                        if (Number(structureDraft.annualCtc) > 0) {
                          autoCalculateCorporateSalary(structureDraft.annualCtc, structureDraft.basicPercentage, val);
                        } else if (Number(structureDraft.basicSalary) > 0) {
                          const newHra = Math.round(Number(structureDraft.basicSalary) * (Number(val) / 100));
                          setStructureDraft(prev => ({ ...prev, hraPercentage: val, hra: String(newHra) }));
                        }
                      }}
                      className="w-12 h-6 text-center text-xs font-black text-sky-900 dark:text-sky-100 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                      placeholder="40"
                      title="HRA Percentage (% of Basic Salary)"
                    />
                    <span className="font-bold text-sky-700 dark:text-sky-300 text-[11px]">% of Basic</span>
                  </div>

                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    Balancing Special Allowance
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {structureEarningFields.map(field => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{field.label}</label>
                      {field.key === 'basicSalary' && (
                        <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/50 dark:border-sky-800/40">
                          {structureDraft.basicPercentage || '50'}% of Gross
                        </span>
                      )}
                      {field.key === 'hra' && (
                        <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/50 dark:border-sky-800/40">
                          {structureDraft.hraPercentage || '40'}% of Basic
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={field.placeholder}
                      value={structureDraft[field.key]}
                      onChange={e => {
                        const val = e.target.value;
                        setStructureDraft(prev => {
                          const updated = { ...prev, [field.key]: val };
                          const statutory = computeStatutoryValues(updated);
                          return {
                            ...updated,
                            employeePf: statutory.employeePf,
                            employerPf: statutory.employerPf,
                            esi: statutory.esi,
                            professionalTax: statutory.professionalTax
                          };
                        });
                      }}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Deductions Components (Monthly) */}
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">3. Deductions Components (Monthly)</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/40">12% PF ({structureDraft.pfPercentage}% of Basic)</span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">PT Slab ₹200</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {structureDeductionFields.map(field => (
                  <div key={field.key}>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{field.label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={field.placeholder}
                      value={structureDraft[field.key]}
                      onChange={e => setStructureDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4: Payroll Rules */}
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 shadow-sm">
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-slate-400">4. Statutory & Payroll Rules</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF Applicable</label>
                  <SelectField
                    value={structureDraft.pfApplicable ? 'Yes' : 'No'}
                    onChange={e => {
                      const isYes = e.target.value === 'Yes';
                      setStructureDraft(prev => {
                        const nextPfPct = isYes ? (prev.pfPercentage && prev.pfPercentage !== '0' ? prev.pfPercentage : '12') : '0';
                        const updated = {
                          ...prev,
                          pfApplicable: isYes,
                          pfPercentage: nextPfPct
                        };
                        const statutory = computeStatutoryValues(updated);
                        return {
                          ...updated,
                          employeePf: statutory.employeePf,
                          employerPf: statutory.employerPf
                        };
                      });
                    }}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </SelectField>
                  {structureDraft.pfApplicable && (
                    <div className="mt-3">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF Percentage (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={structureDraft.pfPercentage}
                        onChange={e => {
                          const val = e.target.value;
                          setStructureDraft(prev => {
                            const updated = { ...prev, pfPercentage: val };
                            const statutory = computeStatutoryValues(updated);
                            return {
                              ...updated,
                              employeePf: statutory.employeePf,
                              employerPf: statutory.employerPf
                            };
                          });
                        }}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">ESI Applicable</label>
                  <SelectField
                    value={structureDraft.esiApplicable ? 'Yes' : 'No'}
                    onChange={e => {
                      const isYes = e.target.value === 'Yes';
                      setStructureDraft(prev => {
                        const nextEsiPct = isYes ? (prev.esiPercentage && prev.esiPercentage !== '0' ? prev.esiPercentage : '1.75') : '0';
                        const updated = {
                          ...prev,
                          esiApplicable: isYes,
                          esiPercentage: nextEsiPct
                        };
                        const statutory = computeStatutoryValues(updated);
                        return {
                          ...updated,
                          esi: statutory.esi
                        };
                      });
                    }}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </SelectField>
                  {structureDraft.esiApplicable && (
                    <div className="mt-3">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">ESI Percentage (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={structureDraft.esiPercentage}
                        onChange={e => {
                          const val = e.target.value;
                          setStructureDraft(prev => {
                            const updated = { ...prev, esiPercentage: val };
                            const statutory = computeStatutoryValues(updated);
                            return {
                              ...updated,
                              esi: statutory.esi
                            };
                          });
                        }}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PT Applicable</label>
                  <SelectField
                    value={structureDraft.professionalTaxApplicable ? 'Yes' : 'No'}
                    onChange={e => {
                      const isYes = e.target.value === 'Yes';
                      setStructureDraft(prev => {
                        const nextPtAmt = isYes ? (prev.professionalTaxAmount && prev.professionalTaxAmount !== '0' ? prev.professionalTaxAmount : '200') : '0';
                        const updated = {
                          ...prev,
                          professionalTaxApplicable: isYes,
                          professionalTaxAmount: nextPtAmt
                        };
                        const statutory = computeStatutoryValues(updated);
                        return {
                          ...updated,
                          professionalTax: statutory.professionalTax
                        };
                      });
                    }}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </SelectField>
                  {structureDraft.professionalTaxApplicable && (
                    <div className="mt-3">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PT Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={structureDraft.professionalTaxAmount}
                        onChange={e => {
                          const val = e.target.value;
                          setStructureDraft(prev => {
                            const updated = { ...prev, professionalTaxAmount: val };
                            const statutory = computeStatutoryValues(updated);
                            return {
                              ...updated,
                              professionalTax: statutory.professionalTax
                            };
                          });
                        }}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 5 (Bottom / Down): Live Preview & Action Buttons */}
            <div className="rounded-[22px] border border-sky-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900 shadow-md">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">Live Preview Summary</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 dark:bg-slate-950 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Gross Salary</span>
                  <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">{formatCurrency(structureDraftPreview.grossSalary)}</span>
                </div>
                <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 dark:bg-slate-950 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Earnings</span>
                  <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">{formatCurrency(structureDraftPreview.totalEarnings)}</span>
                </div>
                <div className="rounded-2xl bg-white p-3.5 border border-slate-200/80 dark:bg-slate-950 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Deductions</span>
                  <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">{formatCurrency(structureDraftPreview.totalDeductions)}</span>
                </div>
                <div className="rounded-2xl bg-sky-600 p-3.5 text-white shadow-lg shadow-sky-500/20">
                  <span className="text-[11px] font-bold text-sky-100 block uppercase tracking-wider">Net Salary</span>
                  <span className="text-lg font-black text-white mt-0.5 block">{formatCurrency(structureDraftPreview.netSalary)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeStructureModal}
                  className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveStructure}
                  className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 text-sm font-black text-white shadow-lg shadow-sky-500/20 hover:bg-sky-700 transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" /> {structureMode === 'edit' ? 'Update Structure' : 'Save Structure'}
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {assignmentModalOpen && (
        <ModalShell
          title="Assign Salary"
          onClose={closeAssignmentModal}
          maxWidth="max-w-3xl"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
                <SearchableStaffSelect
                  value={assignmentDraft.employeeId}
                  staffList={staff}
                  placeholder="Select Employee"
                  onChange={employeeId => {
                    const member = staff.find(item => String(item.id) === String(employeeId));
                    if (!member) {
                      setAssignmentDraft(prev => ({ ...prev, employeeId: '' }));
                      return;
                    }
                    const category = resolveCategory(member);
                    const designation = member.designation || '';
                    const activeAssignment = employeeSalaryAssignments.find(item => (item.employeeId === member.id || item.empId === member.empId) && item.status === 'Active') || null;

                    const staffSpecificStructure = salaryStructures.find(item => 
                      (item as any).staffId === member.id || 
                      (item as any).employeeId === member.id || 
                      normalize(item.structureName).includes(normalize(`${member.firstName} ${member.lastName}`))
                    ) || null;

                    const candidateStructures = salaryStructures.filter(item => structureMatches(item, category, designation));
                    const selectedStructure = activeAssignment 
                      ? salaryStructures.find(item => item.id === activeAssignment.salaryStructureId)
                      : (staffSpecificStructure || candidateStructures[0] || salaryStructures.find(item => item.employeeCategory === category) || salaryStructures[0]);
                    
                    const breakdown = getStructureBreakdown(selectedStructure || undefined, activeAssignment || undefined, member);
                    setAssignmentDraft(prev => ({
                      ...prev,
                      employeeId,
                      employeeCategory: category,
                      designation,
                      salaryStructureId: selectedStructure?.id || '',
                      basicSalary: String(activeAssignment?.overrideBasicSalary ?? breakdown.basicSalary),
                      allowances: String(activeAssignment?.overrideAllowances ?? breakdown.allowances),
                      deductions: String(activeAssignment?.overrideDeductions ?? breakdown.deductions)
                    }));
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
                <SelectField
                  value={assignmentDraft.employeeCategory}
                  onChange={e => {
                    const category = e.target.value as CategoryValue | '';
                    const designation = assignmentDraft.designation;
                    const candidateStructures = category ? salaryStructures.filter(item => structureMatches(item, category, designation)) : [];
                    const selectedStructure = candidateStructures[0] || (category ? salaryStructures.find(item => item.employeeCategory === category) : null);
                    const breakdown = selectedStructure ? getStructureBreakdown(selectedStructure) : { basicSalary: 0, allowances: 0, deductions: 0, grossSalary: 0, netSalary: 0 };
                    setAssignmentDraft(prev => ({
                      ...prev,
                      employeeCategory: category,
                      salaryStructureId: selectedStructure?.id || '',
                      basicSalary: selectedStructure ? String(breakdown.basicSalary) : '',
                      allowances: selectedStructure ? String(breakdown.allowances) : '',
                      deductions: selectedStructure ? String(breakdown.deductions) : ''
                    }));
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Teacher">Teaching Staff</option>
                  <option value="Staff">Non-Teaching Staff</option>
                </SelectField>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
                <SearchableSelect
                    value={assignmentDraft.designation}
                    onChange={(val: string) => {
                      const designation = val;
                      const candidateStructures = salaryStructures.filter(item => structureMatches(item, assignmentDraft.employeeCategory || '', designation));
                      const selectedStructure = candidateStructures[0] || (assignmentDraft.employeeCategory ? salaryStructures.find(item => item.employeeCategory === assignmentDraft.employeeCategory) : null);
                      const breakdown = selectedStructure ? getStructureBreakdown(selectedStructure) : { basicSalary: 0, allowances: 0, deductions: 0, grossSalary: 0, netSalary: 0 };
                      setAssignmentDraft(prev => ({
                        ...prev,
                        designation,
                        salaryStructureId: selectedStructure?.id || '',
                        basicSalary: selectedStructure ? String(breakdown.basicSalary) : '',
                        allowances: selectedStructure ? String(breakdown.allowances) : '',
                        deductions: selectedStructure ? String(breakdown.deductions) : ''
                      }));
                    }}
                    options={filteredDesignationOptions}
                    placeholder="Select Designation"
                    disabled={!assignmentDraft.employeeCategory}
                  />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Structure</label>
                <SelectField
                  value={assignmentDraft.salaryStructureId}
                  onChange={e => {
                    const salaryStructureId = e.target.value;
                    const structure = salaryStructures.find(item => item.id === salaryStructureId);
                    const breakdown = getStructureBreakdown(structure || undefined);
                    setAssignmentDraft(prev => ({
                      ...prev,
                      salaryStructureId,
                      basicSalary: String(breakdown.basicSalary),
                      allowances: String(breakdown.allowances),
                      deductions: String(breakdown.deductions)
                    }));
                  }}
                  disabled={!assignmentDraft.designation}
                >
                  <option value="">Select Salary Structure</option>
                  {structureOptionsForAssignment.map(structure => (
                    <option key={structure.id} value={structure.id}>
                      {structure.structureName}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="md:col-span-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Salary Override</p>
                    <p className="text-[11px] text-slate-500">Default OFF. Enable only when this employee needs custom values.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignmentDraft(prev => ({ ...prev, salaryOverride: !prev.salaryOverride }))}
                    className={`inline-flex h-11 items-center rounded-full px-4 text-sm font-black transition ${assignmentDraft.salaryOverride ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    {assignmentDraft.salaryOverride ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              {assignmentDraft.salaryOverride && (
                <>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Basic Salary</label>
                    <input type="number" value={assignmentDraft.basicSalary} onChange={e => setAssignmentDraft(prev => ({ ...prev, basicSalary: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Allowances</label>
                    <input type="number" value={assignmentDraft.allowances} onChange={e => setAssignmentDraft(prev => ({ ...prev, allowances: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Deductions</label>
                    <input type="number" value={assignmentDraft.deductions} onChange={e => setAssignmentDraft(prev => ({ ...prev, deductions: e.target.value }))} className={inputClass} />
                  </div>
                </>
              )}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Effective Date</label>
                <input type="date" value={assignmentDraft.effectiveDate} onChange={e => setAssignmentDraft(prev => ({ ...prev, effectiveDate: e.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                const structure = salaryStructures.find(item => item.id === assignmentDraft.salaryStructureId);
                const hasSelection = !!structure || assignmentDraft.salaryOverride;
                const preview = hasSelection ? getStructureBreakdown(structure, assignmentDraft.salaryOverride ? {
                  overrideBasicSalary: Number(assignmentDraft.basicSalary) || 0,
                  overrideAllowances: Number(assignmentDraft.allowances) || 0,
                  overrideDeductions: Number(assignmentDraft.deductions) || 0
                } : undefined) : { basicSalary: 0, allowances: 0, deductions: 0, grossSalary: 0, netSalary: 0 };
                return (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Assignment Preview</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                        <span className="text-xs font-semibold text-slate-500 shrink-0">Structure</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-right break-words">{structure?.structureName || 'Not selected'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                        <span className="text-xs font-semibold text-slate-500 shrink-0">Gross Salary</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-right">{hasSelection ? formatCurrency(preview.grossSalary) : '₹0'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                        <span className="text-xs font-semibold text-slate-500 shrink-0">Net Salary</span>
                        <span className="text-xs sm:text-sm font-bold text-brand-700 dark:text-brand-300 text-right">{hasSelection ? formatCurrency(preview.netSalary) : '₹0'}</span>
                      </div>
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                        A new assignment sets the payroll status to Active and automatically updates the employee profile.
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAssignmentModal}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={assignSalary}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
                >
                  <Save className="h-4 w-4" /> Assign
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      <ConfirmModal
        isOpen={isGenerateModalOpen}
        title="Generate Payslips"
        message="Are you sure you want to generate these payslips? This action will process payroll for the selected employees."
        confirmLabel="Generate"
        variant="info"
        onConfirm={confirmBulkGenerate}
        onCancel={() => setIsGenerateModalOpen(false)}
      />

      <PayrollDrawer
        staff={currentPreviewStaff}
        isOpen={!!currentPreviewStaff}
        onClose={() => setDrawerStaff(null)}
      />
    </div>
  );
};

export default PayrollModuleView;
