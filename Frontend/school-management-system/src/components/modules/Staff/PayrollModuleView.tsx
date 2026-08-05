import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Layers, Users, Workflow, ReceiptText, Clock3, FileSpreadsheet, Settings,
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Download, Mail, Printer, Eye,
  Copy, Pencil, Trash2, CheckCircle2, AlertTriangle, Plus, Banknote, Building2, CalendarDays,
  TrendingUp, BarChart3, PieChart, Activity, ShieldCheck, ArrowRight, SlidersHorizontal,
  WalletCards, ListChecks, X, Save
} from 'lucide-react';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  EmployeeSalaryAssignment,
  PayrollAmountLine,
  PayrollRun,
  Payslip,
  SalaryStructure,
  Staff
} from '../../../types';
import { PayrollDrawer } from './PayrollDrawer';

type PayrollTabId =
  | 'staff-payroll'
  | 'staff-payroll-structures'
  | 'staff-payroll-assignment'
  | 'staff-payroll-processing'
  | 'staff-payroll-payslips'
  | 'staff-payroll-history'
  | 'staff-payroll-reports'
  | 'staff-payroll-settings';

type SortDirection = 'asc' | 'desc';

type ColumnAlign = 'left' | 'center' | 'right';

type TableColumn<T> = {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number;
  sortable?: boolean;
  visible?: boolean;
  align?: ColumnAlign;
  className?: string;
};

type SalaryStructureDraft = {
  id?: string;
  structureCode: string;
  structureName: string;
  department: string;
  employeeCategory: 'Teacher' | 'Staff';
  branch: string;
  designation: string;
  employmentType: string;
  basicSalary: number;
  hra: number;
  da: number;
  medicalAllowance: number;
  conveyance: number;
  specialAllowance: number;
  pf: number;
  esi: number;
  professionalTax: number;
  otherDeductions: number;
  status: 'Active' | 'Inactive';
  notes: string;
};

type SalaryHistoryEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  empId: string;
  department: string;
  month: string;
  gross: number;
  allowances: number;
  deductions: number;
  net: number;
  paymentDate: string;
  revision: string;
  status: 'Generated' | 'Paid' | 'Revised';
};

type AssignmentRow = EmployeeSalaryAssignment & {
  grossSalary: number;
  netSalary: number;
  assignedDate: string;
};

type ReportRow = {
  id: string;
  reportName: string;
  scope: string;
  format: string;
  records: number;
  amount: number;
  lastGenerated: string;
  owner: string;
  category: string;
};

const payrollTabs: { id: PayrollTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'staff-payroll-structures', label: 'Salary Structure', icon: Layers },
  { id: 'staff-payroll-payslips', label: 'Generate Payslips', icon: ReceiptText },
  { id: 'staff-payroll-history', label: 'Payslip History', icon: Clock3 },
  { id: 'staff-payroll-settings', label: 'Payroll Settings', icon: Settings }
];

const monthOptions = ['July 2026', 'June 2026', 'May 2026', 'April 2026', 'March 2026'];
const branchOptions = ['All Branches', 'Main Campus', 'North Campus', 'South Campus', 'West Campus'];
const departmentOptions = ['All Departments', 'Academics', 'Science', 'Mathematics', 'Administration', 'Accounts', 'Library', 'Computer Science'];
const categoryOptions = ['All Categories', 'Teacher', 'Staff'];
const statusOptions = ['All Status', 'Active', 'Inactive', 'Pending', 'Processed', 'HR Review', 'Accounts Review', 'Principal Approval', 'Locked'];

const today = () => new Date().toISOString().split('T')[0];

const normalizePayrollTab = (tab?: string): PayrollTabId => {
  switch (tab) {
    case 'staff-payroll-structures':
      return 'staff-payroll-structures';
    case 'staff-payroll-payslips':
    case 'staff-payslips':
    case 'staff-payroll':
    case 'staff-payroll-assignment':
    case 'staff-payroll-processing':
    case 'staff-payroll-reports':
      return 'staff-payroll-payslips';
    case 'staff-payroll-history':
      return 'staff-payroll-history';
    case 'staff-payroll-settings':
    case 'staff-payroll-config':
      return 'staff-payroll-settings';
    default:
      return 'staff-payroll-payslips';
  }
};

const sumLines = (lines: PayrollAmountLine[] = []) => lines.reduce((total, line) => total + line.amount, 0);

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const makeStructure = (draft: SalaryStructureDraft): SalaryStructure => {
  const earnings: PayrollAmountLine[] = [
    { name: 'Basic Salary', amount: draft.basicSalary, type: 'Fixed', value: draft.basicSalary },
    { name: 'House Rent Allowance (HRA)', amount: draft.hra, type: 'Fixed', value: draft.hra },
    { name: 'Dearness Allowance (DA)', amount: draft.da, type: 'Fixed', value: draft.da },
    { name: 'Medical Allowance', amount: draft.medicalAllowance, type: 'Fixed', value: draft.medicalAllowance },
    { name: 'Conveyance', amount: draft.conveyance, type: 'Fixed', value: draft.conveyance },
    { name: 'Special Allowance', amount: draft.specialAllowance, type: 'Fixed', value: draft.specialAllowance }
  ];
  const deductions: PayrollAmountLine[] = [
    { name: 'Provident Fund (PF)', amount: draft.pf, type: 'Fixed', value: draft.pf },
    { name: 'Employee State Insurance (ESI)', amount: draft.esi, type: 'Fixed', value: draft.esi },
    { name: 'Professional Tax', amount: draft.professionalTax, type: 'Fixed', value: draft.professionalTax },
    { name: 'Other Deductions', amount: draft.otherDeductions, type: 'Fixed', value: draft.otherDeductions }
  ];
  return {
    id: draft.id || `SAL-${Math.floor(1000 + Math.random() * 9000)}`,
    structureCode: draft.structureCode,
    structureName: draft.structureName,
    employeeCategory: draft.employeeCategory,
    branch: draft.branch,
    earnings,
    deductions,
    grossSalary: sumLines(earnings),
    netSalaryFormula: 'Gross Salary - Deductions',
    status: draft.status,
    designation: draft.designation,
    department: draft.department,
    employmentType: draft.employmentType,
    notes: draft.notes,
    effectiveDate: today()
  };
};

const baseStructures = [
  makeStructure({
    structureCode: 'PRN-2026-01',
    structureName: 'Principal Premium',
    department: 'Academics',
    employeeCategory: 'Staff',
    branch: 'Main Campus',
    designation: 'Principal',
    employmentType: 'Permanent',
    basicSalary: 45000,
    hra: 12000,
    da: 6000,
    medicalAllowance: 3000,
    conveyance: 3000,
    specialAllowance: 12000,
    pf: 5400,
    esi: 585,
    professionalTax: 200,
    otherDeductions: 500,
    status: 'Active',
    notes: 'Leadership package for the school head office.'
  }),
  makeStructure({
    structureCode: 'TCH-2026-02',
    structureName: 'Senior Teacher Scale',
    department: 'Mathematics',
    employeeCategory: 'Teacher',
    branch: 'Main Campus',
    designation: 'Senior Teacher',
    employmentType: 'Permanent',
    basicSalary: 32000,
    hra: 8000,
    da: 4800,
    medicalAllowance: 2500,
    conveyance: 2500,
    specialAllowance: 5500,
    pf: 3840,
    esi: 396,
    professionalTax: 200,
    otherDeductions: 400,
    status: 'Active',
    notes: 'Used by senior academic staff and HOD-level faculty.'
  }),
  makeStructure({
    structureCode: 'TCH-2026-03',
    structureName: 'Standard Teacher Scale',
    department: 'Science',
    employeeCategory: 'Teacher',
    branch: 'Main Campus',
    designation: 'Subject Teacher',
    employmentType: 'Permanent',
    basicSalary: 25000,
    hra: 6000,
    da: 3500,
    medicalAllowance: 2000,
    conveyance: 2200,
    specialAllowance: 4000,
    pf: 3000,
    esi: 289,
    professionalTax: 200,
    otherDeductions: 350,
    status: 'Active',
    notes: 'Default structure for teaching staff on the academic track.'
  }),
  makeStructure({
    structureCode: 'OPS-2026-04',
    structureName: 'Office & Admin Scale',
    department: 'Administration',
    employeeCategory: 'Staff',
    branch: 'Main Campus',
    designation: 'Office Assistant',
    employmentType: 'Permanent',
    basicSalary: 22000,
    hra: 4500,
    da: 2500,
    medicalAllowance: 1000,
    conveyance: 1800,
    specialAllowance: 3000,
    pf: 2640,
    esi: 240,
    professionalTax: 200,
    otherDeductions: 300,
    status: 'Active',
    notes: 'Administrative and back-office payroll tier.'
  }),
  makeStructure({
    structureCode: 'SUP-2026-05',
    structureName: 'Support Staff Scale',
    department: 'Maintenance',
    employeeCategory: 'Staff',
    branch: 'Main Campus',
    designation: 'Support Staff',
    employmentType: 'Contract',
    basicSalary: 18000,
    hra: 3600,
    da: 2000,
    medicalAllowance: 1000,
    conveyance: 1200,
    specialAllowance: 2200,
    pf: 2160,
    esi: 194,
    professionalTax: 150,
    otherDeductions: 250,
    status: 'Active',
    notes: 'For support, maintenance, transport, and campus operations.'
  })
];

const createAssignmentRow = (
  employee: Staff,
  structure: SalaryStructure,
  index: number
): AssignmentRow => {
  const grossSalary = structure.grossSalary;
  const deductionTotal = sumLines(structure.deductions);
  const netSalary = grossSalary - deductionTotal;
  return {
    id: `ESA-${String(index + 1).padStart(3, '0')}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    empId: employee.empId,
    employeeCategory: employee.employeeCategory || 'Teacher',
    branch: employee.branch || structure.branch,
    department: employee.department,
    salaryStructureId: structure.id,
    salaryStructureName: structure.structureName,
    effectiveDate: employee.salaryStructureEffectiveDate || '2026-04-01',
    status: 'Active',
    monthlyGross: grossSalary,
    previousGross: grossSalary - 2200,
    updatedBy: 'HR Admin',
    updatedAt: '2026-07-30T08:00:00.000Z',
    reason: 'Annual payroll mapping',
    grossSalary,
    netSalary,
    assignedDate: '2026-04-01'
  };
};

const createPayrollRun = (
  employee: Staff,
  structure: SalaryStructure,
  index: number,
  status: PayrollRun['status']
): PayrollRun => {
  const leaveDeduction = index % 2 === 0 ? 1200 : 0;
  const otherDeductions = sumLines(structure.deductions) + (index % 3 === 0 ? 450 : 0);
  const grossSalary = structure.grossSalary;
  const netSalary = grossSalary - leaveDeduction - otherDeductions;
  return {
    id: `PRUN-${String(index + 1).padStart(3, '0')}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    empId: employee.empId,
    branch: employee.branch || structure.branch,
    department: employee.department,
    employeeCategory: employee.employeeCategory || 'Teacher',
    payrollMonth: 'July 2026',
    grossSalary,
    leaveDeduction,
    otherDeductions,
    netSalary,
    status,
    salaryStructureId: structure.id,
    configurationId: 'PAYCFG-001',
    earnings: structure.earnings,
    deductions: structure.deductions,
    leaveDetails: {
      paidLeaveDays: index % 2 === 0 ? 1 : 2,
      unpaidLeaveDays: index % 3 === 0 ? 1 : 0,
      halfDays: index % 2,
      lateEntries: index + 1
    },
    processedDate: '2026-07-28',
    lockedDate: status === 'Locked' ? '2026-07-29' : undefined,
    paymentDate: status === 'Locked' ? '2026-07-30' : undefined,
    workflowStage:
      status === 'Pending'
        ? 'HR'
        : status === 'Processed'
          ? 'Accounts'
          : status === 'HR Review'
            ? 'HR'
            : status === 'Accounts Review'
              ? 'Accounts'
              : status === 'Principal Approval'
                ? 'Principal'
                : 'Released',
    manualAdjustments: index % 2 === 0
      ? [{ type: 'Bonus', amount: 1500, reason: 'Attendance reward', date: '2026-07-27' }]
      : [{ type: 'Recovery', amount: 450, reason: 'Late entry recovery', date: '2026-07-27' }],
    notes: 'Static payroll batch generated for ERP preview.'
  };
};

const createPayslip = (
  employee: Staff,
  structure: SalaryStructure,
  index: number,
  status: Payslip['status']
): Payslip => {
  const basicSalary = structure.earnings[0]?.amount || Math.round(structure.grossSalary * 0.55);
  const hra = structure.earnings[1]?.amount || Math.round(structure.grossSalary * 0.2);
  const da = structure.earnings[2]?.amount || Math.round(structure.grossSalary * 0.1);
  const pfDeduction = structure.deductions.find(item => item.name.toLowerCase().includes('provident'))?.amount || Math.round(structure.grossSalary * 0.08);
  const lopDeduction = index % 2 === 0 ? 1200 : 0;
  const otherDeductions = structure.deductions
    .filter(item => !item.name.toLowerCase().includes('provident'))
    .reduce((total, item) => total + item.amount, 0);
  const netSalary = structure.grossSalary - pfDeduction - lopDeduction - otherDeductions;
  return {
    id: `PAY-${String(index + 1).padStart(3, '0')}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    empId: employee.empId,
    branch: employee.branch || structure.branch,
    department: employee.department,
    designation: employee.designation,
    employeeCategory: employee.employeeCategory || 'Teacher',
    month: 'July 2026',
    basicSalary,
    hra,
    da,
    earnings: structure.earnings,
    deductions: structure.deductions,
    grossSalary: structure.grossSalary,
    leaveDeduction: lopDeduction,
    otherDeductions,
    pfDeduction,
    lopDeduction,
    netSalary,
    bankAccount: employee.bankDetails?.accountNumber || '0000 0000 0000',
    disbursedDate: '2026-07-30',
    paymentDate: '2026-07-30',
    leaveDetails: {
      paidLeaveDays: index % 2,
      unpaidLeaveDays: index % 3 === 0 ? 1 : 0,
      halfDays: index % 2,
      lateEntries: index + 1
    },
    status
  };
};

const createHistoryEntries = (employees: Staff[]): SalaryHistoryEntry[] => {
  const months = [
    { month: 'July 2026', paymentDate: '2026-07-30', revision: 'Annual increment cycle' },
    { month: 'June 2026', paymentDate: '2026-06-30', revision: 'Stable payroll month' },
    { month: 'May 2026', paymentDate: '2026-05-30', revision: 'Minor leave adjustments' }
  ];
  return employees.flatMap((employee, employeeIndex) => {
    const grossBase = 62000 - employeeIndex * 1800;
    return months.map((month, monthIndex) => {
      const allowances = 14500 - employeeIndex * 600 - monthIndex * 350;
      const deductions = 4200 + employeeIndex * 180 + monthIndex * 120;
      const gross = grossBase - monthIndex * 800;
      return {
        id: `HIST-${employee.id}-${monthIndex}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        empId: employee.empId,
        department: employee.department,
        month: month.month,
        gross,
        allowances,
        deductions,
        net: gross + allowances - deductions,
        paymentDate: month.paymentDate,
        revision: month.revision,
        status: monthIndex === 0 ? 'Paid' : monthIndex === 1 ? 'Paid' : 'Generated'
      } as SalaryHistoryEntry;
    });
  });
};

const reportsCatalog: ReportRow[] = [
  { id: 'R-01', reportName: 'Salary Register', scope: 'All Branches', format: 'Excel / PDF', records: 185, amount: 2845000, lastGenerated: '2026-07-30', owner: 'HR Department', category: 'Compliance' },
  { id: 'R-02', reportName: 'Bank Transfer Statement', scope: 'Main Campus', format: 'Excel / PDF', records: 170, amount: 2490000, lastGenerated: '2026-07-30', owner: 'Accounts', category: 'Disbursement' },
  { id: 'R-03', reportName: 'PF Report', scope: 'All Employees', format: 'Excel', records: 185, amount: 182500, lastGenerated: '2026-07-29', owner: 'HR / Accounts', category: 'Compliance' },
  { id: 'R-04', reportName: 'ESI Report', scope: 'Eligible Staff', format: 'Excel', records: 142, amount: 19875, lastGenerated: '2026-07-29', owner: 'Accounts', category: 'Compliance' },
  { id: 'R-05', reportName: 'Professional Tax', scope: 'Monthly', format: 'PDF', records: 185, amount: 37000, lastGenerated: '2026-07-29', owner: 'Accounts', category: 'Compliance' },
  { id: 'R-06', reportName: 'Department Salary', scope: 'Department Wise', format: 'Excel / Print', records: 8, amount: 2845000, lastGenerated: '2026-07-30', owner: 'Management', category: 'Analytics' },
  { id: 'R-07', reportName: 'Annual Payroll', scope: 'FY 2026-27', format: 'PDF', records: 185, amount: 32680000, lastGenerated: '2026-07-30', owner: 'Management', category: 'Analytics' },
  { id: 'R-08', reportName: 'Monthly Payroll', scope: 'July 2026', format: 'Excel / PDF', records: 185, amount: 2845000, lastGenerated: '2026-07-30', owner: 'HR', category: 'Analytics' },
  { id: 'R-09', reportName: 'Employee Salary Report', scope: 'Employee Level', format: 'PDF', records: 185, amount: 2845000, lastGenerated: '2026-07-30', owner: 'HR', category: 'Employee' },
  { id: 'R-10', reportName: 'Payroll Summary', scope: 'Management', format: 'Excel / Print', records: 1, amount: 2845000, lastGenerated: '2026-07-30', owner: 'Finance Head', category: 'Summary' }
];

const monthlyTrend = [
  { month: 'Feb', amount: 2310000 },
  { month: 'Mar', amount: 2385000 },
  { month: 'Apr', amount: 2450000 },
  { month: 'May', amount: 2525000 },
  { month: 'Jun', amount: 2680000 },
  { month: 'Jul', amount: 2845000 }
];

const departmentDistribution = [
  { department: 'Academics', amount: 1575000, color: 'from-sky-500 to-blue-600' },
  { department: 'Administration', amount: 320000, color: 'from-emerald-500 to-teal-500' },
  { department: 'Science', amount: 240000, color: 'from-violet-500 to-fuchsia-500' },
  { department: 'Accounts', amount: 210000, color: 'from-amber-500 to-orange-500' },
  { department: 'Operations', amount: 500000, color: 'from-rose-500 to-red-500' }
];

const payrollStatusSummary = [
  { label: 'Pending', value: 15, color: 'bg-amber-500' },
  { label: 'Processed', value: 92, color: 'bg-sky-500' },
  { label: 'HR Review', value: 28, color: 'bg-violet-500' },
  { label: 'Accounts Review', value: 22, color: 'bg-emerald-500' },
  { label: 'Principal Approval', value: 8, color: 'bg-rose-500' },
  { label: 'Locked', value: 170, color: 'bg-slate-700' }
];

const salaryBreakdown = [
  { label: 'Basic', value: 1380000, percent: 56 },
  { label: 'Allowances', value: 590000, percent: 23 },
  { label: 'Overtime', value: 85000, percent: 3 },
  { label: 'Deductions', value: 285000, percent: 11 },
  { label: 'Employer Cost', value: 355000, percent: 14 }
];

const recentActivity = [
  { title: 'Payroll Generated', time: '08:30 AM', detail: 'July 2026 batch generated for Main Campus.' },
  { title: 'Payslip Published', time: '09:10 AM', detail: '170 payslips published to employee portals.' },
  { title: 'Salary Structure Updated', time: '10:05 AM', detail: 'Senior Teacher Scale revised for two faculty members.' },
  { title: 'Employee Assigned', time: '11:15 AM', detail: 'Three new staff members linked to payroll structures.' },
  { title: 'Payroll Approved', time: '02:45 PM', detail: 'Principal approval completed for locked payroll batch.' }
];

interface TableShellProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: TableColumn<T>[];
  searchableText: (row: T) => string;
  rowKey: (row: T) => string;
  filters?: React.ReactNode;
  onExport?: () => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  initialPageSize?: number;
}

function TableShell<T extends { id: string }>({
  title,
  subtitle,
  rows,
  columns,
  searchableText,
  rowKey,
  filters,
  onExport,
  emptyStateTitle = 'No records found',
  emptyStateDescription = 'Try adjusting the filters or search query.',
  rowActions,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  initialPageSize = 5
}: TableShellProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>(columns.find(column => column.sortable)?.id || '');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.filter(column => column.visible !== false).map(column => column.id));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [query, rows.length, pageSize]);

  const filteredRows = useMemo(() => rows.filter(row => searchableText(row).toLowerCase().includes(query.toLowerCase())), [rows, query, searchableText]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find(item => item.id === sortKey);
    if (!column || !column.accessor) return filteredRows;
    const ordered = [...filteredRows].sort((a, b) => {
      const left = column.accessor?.(a);
      const right = column.accessor?.(b);
      if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
      }
      return String(left).localeCompare(String(right));
    });
    return sortDirection === 'asc' ? ordered : ordered.reverse();
  }, [columns, filteredRows, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const visibleColumnDefs = columns.filter(column => visibleColumns.includes(column.id));
  const allSelected = selectable && pageRows.length > 0 && pageRows.every(row => selectedIds.includes(rowKey(row)));

  const toggleSelection = (rowId: string) => {
    if (!onSelectedIdsChange) return;
    const next = selectedIds.includes(rowId)
      ? selectedIds.filter(id => id !== rowId)
      : [...selectedIds, rowId];
    onSelectedIdsChange(next);
  };

  const toggleAll = () => {
    if (!onSelectedIdsChange) return;
    const pageIds = pageRows.map(row => rowKey(row));
    if (allSelected) {
      onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
    } else {
      const merged = new Set([...selectedIds, ...pageIds]);
      onSelectedIdsChange(Array.from(merged));
    }
  };

  return (
    <section className="space-y-4 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          {filters}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <details className="relative group">
            <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
              <SlidersHorizontal className="h-4 w-4" /> Columns <ChevronDown className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Visible Columns</p>
              <div className="space-y-2">
                {columns.map(column => (
                  <label key={column.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(column.id)}
                      onChange={() => {
                        setVisibleColumns(prev => prev.includes(column.id) ? prev.filter(item => item !== column.id) : [...prev, column.id]);
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[18px] border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}
              {visibleColumnDefs.map(column => (
                <th
                  key={column.id}
                  className={`px-4 py-3 ${column.className || ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {column.sortable && column.accessor ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (sortKey === column.id) {
                          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortKey(column.id);
                          setSortDirection('asc');
                        }
                      }}
                      className="inline-flex items-center gap-1"
                    >
                      <span>{column.label}</span>
                      {sortKey === column.id ? (sortDirection === 'asc' ? <ChevronRight className="h-3.5 w-3.5 rotate-90" /> : <ChevronLeft className="h-3.5 w-3.5 rotate-90" />) : <ChevronDown className="h-3.5 w-3.5 opacity-30" />}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {rowActions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={(selectable ? 1 : 0) + visibleColumnDefs.length + (rowActions ? 1 : 0)} className="px-6 py-16 text-center">
                  <div className="mx-auto max-w-sm space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{emptyStateTitle}</p>
                    <p className="text-xs text-slate-500">{emptyStateDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map(row => {
                const id = rowKey(row);
                const selected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''} ${selected ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}
                  >
                    {selectable && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelection(id)}
                          onClick={e => e.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    )}
                    {visibleColumnDefs.map(column => (
                      <td
                        key={column.id}
                        className={`px-4 py-4 align-middle text-sm text-slate-700 dark:text-slate-300 ${column.className || ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {rowActions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedRows.length)} of {sortedRows.length}
          </span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            {[5, 10, 15].map(size => <option key={size} value={size}>{size} / page</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs font-bold text-slate-500">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}
            disabled={page === pageCount}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

const ShellCard: React.FC<{
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, action, className = '', children }) => (
  <section className={`rounded-[20px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    {(title || subtitle || action) && (
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="min-w-0">
          {title && (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
            </div>
          )}
          {subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </section>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
  helper?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
}> = ({ label, value, helper, icon: Icon, tone = 'sky' }) => {
  const tones = {
    sky: 'from-sky-500 to-blue-600',
    emerald: 'from-emerald-500 to-teal-500',
    violet: 'from-violet-500 to-fuchsia-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-red-500',
    slate: 'from-slate-600 to-slate-800'
  };
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

const ChipButton: React.FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-10 items-center rounded-xl px-4 text-xs font-bold transition-all ${
      active
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
    }`}
  >
    {label}
  </button>
);

const SectionLabel: React.FC<{ eyebrow: string; title: string; subtitle: string }> = ({ eyebrow, title, subtitle }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
    <p className="max-w-3xl text-sm text-slate-500">{subtitle}</p>
  </div>
);

interface PayrollModuleViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PayrollModuleView: React.FC<PayrollModuleViewProps> = ({ initialTab = 'staff-payroll-payslips', onTabChange }) => {
  const { staff } = useData();
  const { selectedBranch } = useAuth();
  const { addToast } = useToast();

  const sampleEmployees = useMemo(() => staff.slice(0, 5), [staff]);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PayrollTabId>(normalizePayrollTab(initialTab));
  const [structureRows, setStructureRows] = useState<SalaryStructure[]>(baseStructures);
  const [selectedStructureId, setSelectedStructureId] = useState<string>(baseStructures[1]?.id || baseStructures[0].id);
  const [isStructureEditorOpen, setIsStructureEditorOpen] = useState(false);
  const [structureDraft, setStructureDraft] = useState<SalaryStructureDraft>({
    structureCode: 'NEW-STRUCT-001',
    structureName: '',
    department: 'Administration',
    employeeCategory: 'Teacher',
    branch: selectedBranch || 'Main Campus',
    designation: '',
    employmentType: 'Permanent',
    basicSalary: 30000,
    hra: 7500,
    da: 4200,
    medicalAllowance: 2000,
    conveyance: 1800,
    specialAllowance: 4500,
    pf: 3600,
    esi: 300,
    professionalTax: 200,
    otherDeductions: 250,
    status: 'Active',
    notes: ''
  });
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [selectedStructurePreview, setSelectedStructurePreview] = useState<SalaryStructure>(baseStructures[1]);

  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>(() => {
    const structures = baseStructures;
    const seed = sampleEmployees.slice(0, Math.min(sampleEmployees.length, structures.length + 1));
    return seed.map((employee, index) => {
      const structure = structures[index % structures.length];
      return createAssignmentRow(employee, structure, index);
    });
  });
  const [assignmentSelection, setAssignmentSelection] = useState<string[]>([]);
  const [assignmentFilters, setAssignmentFilters] = useState({
    branch: 'All Branches',
    department: 'All Departments',
    category: 'All Categories',
    employee: 'All',
    designation: 'All',
    status: 'All Status'
  });
  const [bulkStructureId, setBulkStructureId] = useState<string>(baseStructures[0].id);
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState('2026-08-01');

  const [payrollMonth, setPayrollMonth] = useState('July 2026');
  const [processingStep, setProcessingStep] = useState(0);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const statuses: PayrollRun['status'][] = ['Locked', 'Processed', 'HR Review', 'Accounts Review', 'Pending'];
    return sampleEmployees.slice(0, 5).map((employee, index) => createPayrollRun(employee, baseStructures[index % baseStructures.length], index, statuses[index % statuses.length]));
  });

  const [payslipRows, setPayslipRows] = useState<Payslip[]>(() => {
    const statuses: Payslip['status'][] = ['Paid', 'Paid', 'Emailed', 'Generated', 'Paid'];
    return sampleEmployees.slice(0, 5).map((employee, index) => createPayslip(employee, baseStructures[index % baseStructures.length], index, statuses[index % statuses.length]));
  });
  const [payslipSelection, setPayslipSelection] = useState<string[]>([]);
  const [payrollPreviewStaff, setPayrollPreviewStaff] = useState<Staff | null>(null);
  const [payrollDrawerOpen, setPayrollDrawerOpen] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    employee: 'All Employees',
    year: '2026',
    month: 'All Months',
    department: 'All Departments'
  });
  const [settings, setSettings] = useState({
    payrollCycle: 'Monthly',
    salaryDate: '05',
    workingDays: 26,
    pfPercent: 12,
    esiPercent: 0.75,
    professionalTax: 200,
    defaultStructureId: baseStructures[1].id,
    overtimeEnabled: true,
    overtimeRate: 1.5,
    overtimeWeekendRate: 2,
    overtimeHolidayRate: 2.5,
    lopRule: 'Full day deduction for each unapproved absence',
    leaveRule: 'Approved leave is salary protected within entitlement',
    roundOffRule: 'Round to nearest rupee',
    payslipTemplate: 'Modern',
    autoGeneratePayslips: true,
    autoPublishPayslips: false,
    autoLockPayroll: true
  });

  const historyEntries = useMemo(() => createHistoryEntries(sampleEmployees), [sampleEmployees]);

  useEffect(() => {
    const normalized = normalizePayrollTab(initialTab);
    setActiveTab(normalized);
  }, [initialTab]);

  const openStaffDrawer = (employeeId: string) => {
    const employee = staff.find(item => item.id === employeeId) || null;
    setPayrollPreviewStaff(employee);
    setPayrollDrawerOpen(true);
  };

  const navigateTab = (tab: PayrollTabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const employeeCount = 185;
  const payrollCompleted = 170;
  const pendingPayroll = 15;
  const pendingApproval = 8;
  const totalPayroll = 2845000;
  const totalNetSalary = 2490000;
  const processedCount = payrollRuns.filter(run => ['Processed', 'Locked', 'Accounts Review', 'Principal Approval'].includes(run.status)).length;
  const warningCount = payrollRuns.filter(run => run.leaveDeduction > 0 || run.otherDeductions > 4200).length;
  const totalGrossCalculated = payrollRuns.reduce((sum, run) => sum + run.grossSalary, 0);
  const totalDeductionCalculated = payrollRuns.reduce((sum, run) => sum + run.leaveDeduction + run.otherDeductions, 0);
  const totalNetCalculated = payrollRuns.reduce((sum, run) => sum + run.netSalary, 0);
  const currentStepLabel = ['Select Month', 'Load Attendance', 'Load Leave', 'Load Overtime', 'Calculate Salary', 'Review', 'Approve Payroll'][processingStep];

  const selectedStructure = structureRows.find(structure => structure.id === selectedStructureId) || structureRows[0];
  const selectedStructureEmployees = assignmentRows.filter(row => row.salaryStructureId === selectedStructure.id).length;
  const selectedStructureAllowance = sumLines(selectedStructure.earnings) - (selectedStructure.earnings[0]?.amount || 0);
  const selectedStructureDeductions = sumLines(selectedStructure.deductions);
  const selectedStructureNet = selectedStructure.grossSalary - selectedStructureDeductions;

  const filteredAssignmentRows = useMemo<AssignmentRow[]>(() => {
    return assignmentRows.filter(row => {
      const matchesBranch = assignmentFilters.branch === 'All Branches' || row.branch === assignmentFilters.branch;
      const matchesDepartment = assignmentFilters.department === 'All Departments' || row.department === assignmentFilters.department;
      const matchesCategory = assignmentFilters.category === 'All Categories' || row.employeeCategory === assignmentFilters.category;
      const matchesEmployee = assignmentFilters.employee === 'All' || row.employeeName === assignmentFilters.employee;
      const matchesDesignation = assignmentFilters.designation === 'All' || (row.salaryStructureName || '').includes(assignmentFilters.designation);
      const matchesStatus = assignmentFilters.status === 'All Status' || row.status === assignmentFilters.status;
      return matchesBranch && matchesDepartment && matchesCategory && matchesEmployee && matchesDesignation && matchesStatus;
    });
  }, [assignmentFilters, assignmentRows]);

  const filteredPayslips = useMemo(() => {
    return payslipRows.filter(row => {
      const matchesMonth = payrollMonth === 'All Months' || row.month === payrollMonth;
      const matchesBranch = row.branch === 'Main Campus' || row.branch === selectedBranch || !row.branch;
      return matchesMonth && matchesBranch;
    });
  }, [payrollMonth, payslipRows, selectedBranch]);

  const filteredHistory = useMemo(() => {
    return historyEntries.filter(item => {
      const employeeMatch = historyFilters.employee === 'All Employees' || item.employeeName === historyFilters.employee;
      const yearMatch = historyFilters.year === 'All Years' || item.month.includes(historyFilters.year);
      const monthMatch = historyFilters.month === 'All Months' || item.month === historyFilters.month;
      const departmentMatch = historyFilters.department === 'All Departments' || item.department === historyFilters.department;
      return employeeMatch && yearMatch && monthMatch && departmentMatch;
    });
  }, [historyEntries, historyFilters]);

  const structureColumns: TableColumn<SalaryStructure>[] = [
    { id: 'code', label: 'Structure Code', sortable: true, accessor: row => row.structureCode || row.id, visible: true, render: row => <span className="font-mono text-xs font-bold text-slate-500">{row.structureCode || row.id}</span> },
    { id: 'name', label: 'Structure Name', sortable: true, accessor: row => row.structureName, visible: true, render: row => <span className="font-bold text-slate-900 dark:text-white">{row.structureName}</span> },
    { id: 'department', label: 'Department', sortable: true, accessor: row => row.department || '', visible: true, render: row => row.department || 'All Departments' },
    { id: 'category', label: 'Category', sortable: true, accessor: row => row.employeeCategory, visible: true, render: row => <Badge variant={row.employeeCategory === 'Teacher' ? 'info' : 'neutral'} size="sm">{row.employeeCategory}</Badge> },
    { id: 'gross', label: 'Gross Salary', sortable: true, accessor: row => row.grossSalary, align: 'right', render: row => <span className="font-mono font-black text-brand-600">{formatCurrency(row.grossSalary)}</span> },
    { id: 'allowances', label: 'Allowances', sortable: true, accessor: row => sumLines(row.earnings) - (row.earnings[0]?.amount || 0), align: 'right', render: row => <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(sumLines(row.earnings) - (row.earnings[0]?.amount || 0))}</span> },
    { id: 'deductions', label: 'Deductions', sortable: true, accessor: row => sumLines(row.deductions), align: 'right', render: row => <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(sumLines(row.deductions))}</span> },
    { id: 'employees', label: 'Employees Assigned', sortable: true, accessor: row => assignmentRows.filter(assign => assign.salaryStructureId === row.id).length, align: 'center', render: row => <span className="font-black text-slate-900 dark:text-white">{assignmentRows.filter(assign => assign.salaryStructureId === row.id).length}</span> },
    { id: 'status', label: 'Status', sortable: true, accessor: row => row.status, render: row => <Badge variant={row.status === 'Active' ? 'success' : 'neutral'} size="sm">{row.status}</Badge> }
  ];

  const assignmentColumns: TableColumn<AssignmentRow>[] = [
    { id: 'employee', label: 'Employee', sortable: true, accessor: row => row.employeeName, render: row => (
      <button type="button" onClick={e => { e.stopPropagation(); openStaffDrawer(row.employeeId); }} className="text-left">
        <p className="font-bold text-slate-900 dark:text-white">{row.employeeName}</p>
        <p className="font-mono text-[10px] text-slate-400">{row.empId}</p>
      </button>
    )},
    { id: 'employeeId', label: 'Employee ID', sortable: true, accessor: row => row.empId, render: row => <span className="font-mono text-xs text-slate-500">{row.empId}</span> },
    { id: 'department', label: 'Department', sortable: true, accessor: row => row.department, render: row => row.department },
    { id: 'structure', label: 'Current Structure', sortable: true, accessor: row => row.salaryStructureName, render: row => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.salaryStructureName}</span> },
    { id: 'gross', label: 'Gross Salary', sortable: true, accessor: row => row.grossSalary, align: 'right', render: row => <span className="font-mono font-black text-brand-600">{formatCurrency(row.grossSalary)}</span> },
    { id: 'status', label: 'Status', sortable: true, accessor: row => row.status, render: row => <Badge variant={row.status === 'Active' ? 'success' : 'warning'} size="sm">{row.status}</Badge> },
    { id: 'assignedDate', label: 'Assigned Date', sortable: true, accessor: row => row.assignedDate, render: row => formatShortDate(row.assignedDate) }
  ];

  const payslipColumns: TableColumn<Payslip>[] = [
    { id: 'employee', label: 'Employee', sortable: true, accessor: row => row.employeeName, render: row => (
      <button type="button" onClick={e => { e.stopPropagation(); openStaffDrawer(row.employeeId); }} className="text-left">
        <p className="font-bold text-slate-900 dark:text-white">{row.employeeName}</p>
        <p className="font-mono text-[10px] text-slate-400">{row.empId}</p>
      </button>
    )},
    { id: 'department', label: 'Department', sortable: true, accessor: row => row.department || '', render: row => row.department || '-' },
    { id: 'net', label: 'Net Salary', sortable: true, accessor: row => row.netSalary, align: 'right', render: row => <span className="font-mono font-black text-brand-600">{formatCurrency(row.netSalary)}</span> },
    { id: 'status', label: 'Payslip Status', sortable: true, accessor: row => row.status, render: row => <Badge variant={row.status === 'Generated' ? 'warning' : row.status === 'Paid' ? 'success' : 'info'} size="sm">{row.status}</Badge> },
    { id: 'generated', label: 'Generated Date', sortable: true, accessor: row => row.disbursedDate, render: row => formatShortDate(row.disbursedDate) },
    { id: 'published', label: 'Published', sortable: true, accessor: row => (row.status === 'Emailed' || row.status === 'Paid' ? 1 : 0), align: 'center', render: row => <Badge variant={row.status === 'Generated' ? 'warning' : 'success'} size="sm">{row.status === 'Generated' ? 'No' : 'Yes'}</Badge> }
  ];

  const reportColumns: TableColumn<ReportRow>[] = [
    { id: 'report', label: 'Report', sortable: true, accessor: row => row.reportName, render: row => <span className="font-bold text-slate-900 dark:text-white">{row.reportName}</span> },
    { id: 'scope', label: 'Scope', sortable: true, accessor: row => row.scope, render: row => row.scope },
    { id: 'format', label: 'Format', sortable: true, accessor: row => row.format, render: row => row.format },
    { id: 'records', label: 'Records', sortable: true, accessor: row => row.records, align: 'right', render: row => <span className="font-mono font-black text-slate-800 dark:text-slate-200">{row.records}</span> },
    { id: 'amount', label: 'Total Amount', sortable: true, accessor: row => row.amount, align: 'right', render: row => <span className="font-mono font-black text-brand-600">{formatCurrency(row.amount)}</span> },
    { id: 'generated', label: 'Last Generated', sortable: true, accessor: row => row.lastGenerated, render: row => formatShortDate(row.lastGenerated) },
    { id: 'owner', label: 'Owner', sortable: true, accessor: row => row.owner, render: row => row.owner }
  ];

  const handleDuplicateStructure = (structure: SalaryStructure) => {
    const clone: SalaryStructure = {
      ...structure,
      id: `SAL-${Math.floor(1000 + Math.random() * 9000)}`,
      structureCode: `${structure.structureCode}-COPY`,
      structureName: `${structure.structureName} Copy`,
      status: 'Inactive'
    };
    setStructureRows(prev => [clone, ...prev]);
    addToast('success', 'Structure duplicated', `${structure.structureName} duplicated successfully.`);
  };

  const handleDeleteStructure = (structureId: string) => {
    setStructureRows(prev => prev.filter(row => row.id !== structureId));
    if (selectedStructureId === structureId) {
      const next = structureRows.find(row => row.id !== structureId);
      if (next) setSelectedStructureId(next.id);
    }
    addToast('info', 'Structure removed', 'Salary structure deleted from the static payroll set.');
  };

  const handleSaveStructure = () => {
    const next = makeStructure({ ...structureDraft, id: editingStructureId || undefined });
    setStructureRows(prev => {
      if (editingStructureId) {
        return prev.map(row => row.id === editingStructureId ? next : row);
      }
      return [next, ...prev];
    });
    setSelectedStructureId(next.id);
    setSelectedStructurePreview(next);
    setIsStructureEditorOpen(false);
    setEditingStructureId(null);
    addToast('success', editingStructureId ? 'Structure updated' : 'Structure created', next.structureName);
  };

  const openStructureEditor = (structure?: SalaryStructure) => {
    if (structure) {
      setEditingStructureId(structure.id);
      setStructureDraft({
        id: structure.id,
        structureCode: structure.structureCode || structure.id,
        structureName: structure.structureName,
        department: structure.department || 'Administration',
        employeeCategory: structure.employeeCategory,
        branch: structure.branch,
        designation: structure.designation || '',
        employmentType: structure.employmentType || 'Permanent',
        basicSalary: structure.earnings[0]?.amount || 30000,
        hra: structure.earnings[1]?.amount || 7000,
        da: structure.earnings[2]?.amount || 4000,
        medicalAllowance: structure.earnings[3]?.amount || 2000,
        conveyance: structure.earnings[4]?.amount || 1500,
        specialAllowance: structure.earnings[5]?.amount || 4000,
        pf: structure.deductions[0]?.amount || 3000,
        esi: structure.deductions[1]?.amount || 300,
        professionalTax: structure.deductions[2]?.amount || 200,
        otherDeductions: structure.deductions[3]?.amount || 0,
        status: structure.status,
        notes: structure.notes || ''
      });
    } else {
      setEditingStructureId(null);
      setStructureDraft({
        structureCode: `NEW-${Math.floor(100 + Math.random() * 900)}`,
        structureName: '',
        department: 'Administration',
        employeeCategory: 'Teacher',
        branch: selectedBranch || 'Main Campus',
        designation: '',
        employmentType: 'Permanent',
        basicSalary: 30000,
        hra: 7500,
        da: 4200,
        medicalAllowance: 2000,
        conveyance: 1800,
        specialAllowance: 4500,
        pf: 3600,
        esi: 300,
        professionalTax: 200,
        otherDeductions: 250,
        status: 'Active',
        notes: ''
      });
    }
    setIsStructureEditorOpen(true);
  };

  const handleBulkAssign = () => {
    if (assignmentSelection.length === 0) {
      addToast('warning', 'No selection', 'Choose one or more employees before bulk assigning.');
      return;
    }
    const targetStructure = structureRows.find(row => row.id === bulkStructureId);
    if (!targetStructure) return;
    setAssignmentRows(prev => prev.map(row => assignmentSelection.includes(row.id) ? {
      ...row,
      salaryStructureId: targetStructure.id,
      salaryStructureName: targetStructure.structureName,
      monthlyGross: targetStructure.grossSalary,
      grossSalary: targetStructure.grossSalary,
      netSalary: targetStructure.grossSalary - sumLines(targetStructure.deductions),
      status: 'Active',
      effectiveDate: bulkEffectiveDate,
      assignedDate: bulkEffectiveDate,
      updatedAt: new Date().toISOString(),
      reason: 'Bulk assign'
    } : row));
    setAssignmentSelection([]);
    addToast('success', 'Bulk assignment complete', `${assignmentSelection.length} employees mapped to ${targetStructure.structureName}.`);
  };

  const handleBulkRemove = () => {
    if (assignmentSelection.length === 0) {
      addToast('warning', 'No selection', 'Choose one or more employees before bulk removal.');
      return;
    }
    setAssignmentRows(prev => prev.filter(row => !assignmentSelection.includes(row.id)).map(row => row));
    setAssignmentSelection([]);
    addToast('info', 'Assignments removed', 'Selected employees were removed from the active payroll map.');
  };

  const handleTransferStructure = () => {
    if (assignmentSelection.length === 0) {
      addToast('warning', 'No selection', 'Choose one or more employees before transferring.');
      return;
    }
    const targetStructure = structureRows.find(row => row.id === bulkStructureId);
    if (!targetStructure) return;
    setAssignmentRows(prev => prev.map(row => assignmentSelection.includes(row.id) ? {
      ...row,
      salaryStructureId: targetStructure.id,
      salaryStructureName: targetStructure.structureName,
      monthlyGross: targetStructure.grossSalary,
      grossSalary: targetStructure.grossSalary,
      netSalary: targetStructure.grossSalary - sumLines(targetStructure.deductions),
      effectiveDate: bulkEffectiveDate,
      assignedDate: bulkEffectiveDate,
      updatedAt: new Date().toISOString(),
      reason: 'Structure transfer'
    } : row));
    setAssignmentSelection([]);
    addToast('success', 'Structure transferred', `${assignmentSelection.length} employees moved to ${targetStructure.structureName}.`);
  };

  const handleProcessPayroll = () => {
    setProcessingStep(prev => Math.min(6, prev + 1));
    addToast('success', 'Payroll batch generated', `Payroll for ${payrollMonth} advanced to the next workflow step.`);
  };

  const handleGeneratePayslips = () => setIsGenerateModalOpen(true);
    
  const confirmGeneratePayslips = () => {
    setIsGenerateModalOpen(false);
    setPayslipRows(prev => prev.map(row => payslipSelection.length === 0 || payslipSelection.includes(row.id) ? { ...row, status: 'Generated', disbursedDate: today(), paymentDate: today() } : row));
    addToast('success', 'Payslips generated', payslipSelection.length > 0 ? `${payslipSelection.length} payslips regenerated.` : 'All payslips regenerated.');
  };

  const handlePublishPayslips = () => {
    setPayslipRows(prev => prev.map(row => payslipSelection.length === 0 || payslipSelection.includes(row.id) ? { ...row, status: 'Emailed' } : row));
    addToast('success', 'Payslips published', payslipSelection.length > 0 ? `${payslipSelection.length} payslips published.` : 'All payslips published.');
  };

  const handleEmailPayslips = () => {
    addToast('success', 'Emails queued', payslipSelection.length > 0 ? `${payslipSelection.length} emails queued.` : 'All employee payslip emails queued.');
  };

  const handleDownloadZip = () => {
    addToast('info', 'ZIP ready', 'The payroll ZIP archive is ready for download.');
  };

  const handlePreviewPayslip = (employeeId: string) => {
    openStaffDrawer(employeeId);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Payroll Overview"
        title="Payroll Dashboard"
        subtitle="A static enterprise overview for salary processing, disbursement, compliance, and approvals."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        <MetricCard label="Payroll Month" value="July 2026" helper="Current disbursement cycle" icon={CalendarDays} tone="sky" />
        <MetricCard label="Employees" value={String(employeeCount)} helper="Active staff in payroll scope" icon={Users} tone="emerald" />
        <MetricCard label="Payroll Completed" value={String(payrollCompleted)} helper="Processed batches ready for release" icon={CheckCircle2} tone="violet" />
        <MetricCard label="Pending Payroll" value={String(pendingPayroll)} helper="Awaiting attendance or leave load" icon={AlertTriangle} tone="amber" />
        <MetricCard label="Total Payroll" value={formatCurrency(totalPayroll)} helper="Gross payroll value for July" icon={Banknote} tone="rose" />
        <MetricCard label="Net Salary" value={formatCurrency(totalNetSalary)} helper="After standard deductions" icon={WalletCards} tone="sky" />
        <MetricCard label="Pending Approval" value={String(pendingApproval)} helper="Principal approval queue" icon={ShieldCheck} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ShellCard title="Monthly Payroll Trend" subtitle="Five-month payroll movement across the school." icon={TrendingUp}>
          <div className="space-y-4">
            {monthlyTrend.map(point => {
              const max = Math.max(...monthlyTrend.map(item => item.amount));
              const width = Math.round((point.amount / max) * 100);
              return (
                <div key={point.month} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{point.month}</span>
                    <span>{formatCurrency(point.amount)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-3 rounded-full bg-gradient-to-r from-brand-600 to-sky-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard title="Department Salary Distribution" subtitle="Static split of salary allocation by department." icon={PieChart}>
          <div className="space-y-4">
            {departmentDistribution.map(item => {
              const max = Math.max(...departmentDistribution.map(entry => entry.amount));
              const width = Math.round((item.amount / max) * 100);
              return (
                <div key={item.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{item.department}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-3 rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard title="Payroll Status" subtitle="Workflow positions across the static payroll batch." icon={Activity}>
          <div className="space-y-3">
            {payrollStatusSummary.map(item => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </ShellCard>

        <ShellCard title="Salary Breakdown" subtitle="High-level payroll cost split." icon={BarChart3}>
          <div className="space-y-4">
            {salaryBreakdown.map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{item.label}</span>
                  <span>{formatCurrency(item.value)}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-brand-600" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.7fr)]">
        <ShellCard title="Recent Activity" subtitle="The latest payroll milestones recorded in the ERP." icon={ListChecks}>
          <div className="space-y-3">
            {recentActivity.map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ShellCard>

        <ShellCard title="Quick Actions" subtitle="Shortcuts into the payroll flow." icon={ArrowRight}>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Process Payroll', tab: 'staff-payroll-processing' as PayrollTabId, icon: Workflow },
              { label: 'Generate Payslips', tab: 'staff-payroll-payslips' as PayrollTabId, icon: ReceiptText },
              { label: 'Salary Structures', tab: 'staff-payroll-structures' as PayrollTabId, icon: Layers },
              { label: 'Reports', tab: 'staff-payroll-reports' as PayrollTabId, icon: FileSpreadsheet }
            ].map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigateTab(action.tab)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{action.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </ShellCard>
      </div>
    </div>
  );

  const renderStructures = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Salary Structures"
        title="Salary Structures"
        subtitle="Create, duplicate, edit, assign, and retire payroll structures without jumping to another page."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Structures" value={String(structureRows.filter(row => row.status === 'Active').length)} helper="Currently assignable templates" icon={Layers} tone="sky" />
        <MetricCard label="Total Structures" value={String(structureRows.length)} helper="All static salary templates" icon={Building2} tone="emerald" />
        <MetricCard label="Employees Assigned" value={String(selectedStructureEmployees)} helper={`Selected: ${selectedStructure.structureName}`} icon={Users} tone="violet" />
        <MetricCard label="Net Salary Preview" value={formatCurrency(selectedStructureNet)} helper="Selected structure preview" icon={Banknote} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
        <div className="space-y-6">
          <ShellCard
            title="Salary Structures Table"
            subtitle="Table with search, filters, sorting, pagination, export, and column visibility."
            icon={Layers}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openStructureEditor()}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
                >
                  <Plus className="h-4 w-4" /> Create Structure
                </button>
              </div>
            }
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <ChipButton label="All" active={selectedStructure.department === 'All'} onClick={() => setSelectedStructureId(baseStructures[0].id)} />
              {categoryOptions.slice(1).map(option => (
                <ChipButton key={option} label={option} active={false} onClick={() => undefined} />
              ))}
            </div>
            <TableShell
              title="Salary Structure Register"
              subtitle="Static ERP view for structure lifecycle management."
              rows={structureRows}
              columns={structureColumns}
              searchableText={row => `${row.structureCode} ${row.structureName} ${row.department || ''} ${row.employeeCategory} ${row.designation || ''}`}
              rowKey={row => row.id}
              onExport={() => addToast('success', 'Export ready', 'Salary structures exported as CSV preview.')}
              onRowClick={row => {
                setSelectedStructureId(row.id);
                setSelectedStructurePreview(row);
              }}
              rowActions={row => (
                <>
                  <button type="button" onClick={e => { e.stopPropagation(); setSelectedStructureId(row.id); setSelectedStructurePreview(row); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); openStructureEditor(row); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); handleDuplicateStructure(row); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); handleDeleteStructure(row.id); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              )}
            />
          </ShellCard>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ShellCard title="Structure Detail" subtitle={`Selected: ${selectedStructure.structureName}`} icon={WalletCards}>
              <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    ['Basic Salary', selectedStructure.earnings[0]?.amount || 0],
                    ['HRA', selectedStructure.earnings[1]?.amount || 0],
                    ['DA', selectedStructure.earnings[2]?.amount || 0],
                    ['Medical Allowance', selectedStructure.earnings[3]?.amount || 0],
                    ['Conveyance', selectedStructure.earnings[4]?.amount || 0],
                    ['Special Allowance', selectedStructure.earnings[5]?.amount || 0],
                    ['PF', selectedStructure.deductions[0]?.amount || 0],
                    ['ESI', selectedStructure.deductions[1]?.amount || 0],
                    ['Professional Tax', selectedStructure.deductions[2]?.amount || 0],
                    ['Other Deductions', selectedStructure.deductions[3]?.amount || 0]
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{label as string}</p>
                      <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(Number(value))}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-500">Gross</p>
                    <p className="mt-2 text-lg font-black text-brand-700 dark:text-brand-300">{formatCurrency(selectedStructure.grossSalary)}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-500">Allowances</p>
                    <p className="mt-2 text-lg font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(selectedStructureAllowance)}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-500">Deductions</p>
                    <p className="mt-2 text-lg font-black text-rose-700 dark:text-rose-300">{formatCurrency(selectedStructureDeductions)}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Net Salary Preview</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(selectedStructureNet)}</p>
                </div>
              </div>
            </ShellCard>

            <ShellCard title="Structure Actions" subtitle="Business operations for the selected salary structure." icon={SlidersHorizontal}>
              <div className="space-y-3">
                <button type="button" onClick={() => openStructureEditor(selectedStructure)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Edit Structure</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button type="button" onClick={() => handleDuplicateStructure(selectedStructure)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Duplicate Structure</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button type="button" onClick={() => navigateTab('staff-payroll-payslips')} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Generate Payslips</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
                <button type="button" onClick={() => handleDeleteStructure(selectedStructure.id)} className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                  <span className="text-sm font-bold">Delete Structure</span>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </ShellCard>
          </div>
        </div>

        <ShellCard title="Structure Notes" subtitle="Quick notes and employee linkage." icon={CheckCircle2} className="sticky top-[100px] h-fit">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{selectedStructure.structureName}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedStructure.structureCode}</p>
              </div>
              <Badge variant={selectedStructure.status === 'Active' ? 'success' : 'neutral'} size="sm">{selectedStructure.status}</Badge>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{selectedStructure.department || 'All Departments'}</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{selectedStructure.designation || 'General'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employees Assigned</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{selectedStructureEmployees}</p>
              <p className="mt-1 text-xs text-slate-500">Mapped in the assignment register.</p>
            </div>
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950">
              {selectedStructure.notes || 'This structure is part of the static payroll configuration catalogue and can be duplicated or edited directly from the table.'}
            </p>
          </div>
        </ShellCard>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Employee Salary Assignment"
        title="Employee Salary Assignment"
        subtitle="Filter employees, bulk assign salary structures, and transfer payroll templates across the staff roster."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Assigned" value={String(assignmentRows.length)} helper="Employees currently linked to structures" icon={Users} tone="sky" />
        <MetricCard label="Unassigned" value={String(Math.max(0, sampleEmployees.length - assignmentRows.length))} helper="Employees pending payroll map" icon={AlertTriangle} tone="amber" />
        <MetricCard label="Average Gross" value={formatCurrency(Math.round(assignmentRows.reduce((sum, row) => sum + row.grossSalary, 0) / Math.max(1, assignmentRows.length)))} helper="Across the visible employee map" icon={Banknote} tone="emerald" />
        <MetricCard label="Bulk Selection" value={String(assignmentSelection.length)} helper="Rows ready for mass action" icon={CheckCircle2} tone="violet" />
      </div>

      <ShellCard
        title="Bulk Actions"
        subtitle="Use a single target structure to bulk assign, remove, or transfer employees."
        icon={SlidersHorizontal}
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBulkAssign} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20">
              <CheckCircle2 className="h-4 w-4" /> Bulk Assign
            </button>
            <button type="button" onClick={handleTransferStructure} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white shadow-lg shadow-sky-500/20">
              <ArrowRight className="h-4 w-4" /> Transfer Structure
            </button>
            <button type="button" onClick={handleBulkRemove} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white shadow-lg shadow-rose-500/20">
              <Trash2 className="h-4 w-4" /> Bulk Remove
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Target Structure</span>
            <select value={bulkStructureId} onChange={e => setBulkStructureId(e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {structureRows.map(structure => <option key={structure.id} value={structure.id}>{structure.structureName}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Effective Date</span>
            <input value={bulkEffectiveDate} onChange={e => setBulkEffectiveDate(e.target.value)} type="date" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Branch</span>
            <select value={assignmentFilters.branch} onChange={e => setAssignmentFilters(prev => ({ ...prev, branch: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {branchOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</span>
            <select value={assignmentFilters.department} onChange={e => setAssignmentFilters(prev => ({ ...prev, department: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {departmentOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</span>
            <select value={assignmentFilters.category} onChange={e => setAssignmentFilters(prev => ({ ...prev, category: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {categoryOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</span>
            <select value={assignmentFilters.employee} onChange={e => setAssignmentFilters(prev => ({ ...prev, employee: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option>All</option>
              {sampleEmployees.map(employee => <option key={employee.id}>{`${employee.firstName} ${employee.lastName}`}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</span>
            <select value={assignmentFilters.designation} onChange={e => setAssignmentFilters(prev => ({ ...prev, designation: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option>All</option>
              {['Principal', 'Senior Teacher', 'Subject Teacher', 'Office Assistant', 'Support Staff'].map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</span>
            <select value={assignmentFilters.status} onChange={e => setAssignmentFilters(prev => ({ ...prev, status: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {statusOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => setAssignmentFilters({ branch: 'All Branches', department: 'All Departments', category: 'All Categories', employee: 'All', designation: 'All', status: 'All Status' })} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Filter className="h-4 w-4" /> Reset Filters
            </button>
          </div>
        </div>
      </ShellCard>

      <TableShell
        title="Salary Assignment Table"
        subtitle="Employees, current structures, and payroll linkage."
        rows={filteredAssignmentRows}
        columns={assignmentColumns}
        searchableText={row => `${row.employeeName} ${row.empId} ${row.department} ${row.salaryStructureName} ${row.branch}`}
        rowKey={row => row.id}
        selectable
        selectedIds={assignmentSelection}
        onSelectedIdsChange={setAssignmentSelection}
        onExport={() => addToast('success', 'Export ready', 'Employee salary assignments exported as CSV preview.')}
        rowActions={row => (
          <>
            <button type="button" onClick={e => { e.stopPropagation(); openStaffDrawer(row.employeeId); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Eye className="h-3.5 w-3.5" /> View
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); const targetStructure = structureRows.find(structure => structure.id === bulkStructureId); if (!targetStructure) return; setAssignmentRows(prev => prev.map(item => item.id === row.id ? { ...item, salaryStructureId: targetStructure.id, salaryStructureName: targetStructure.structureName, monthlyGross: targetStructure.grossSalary, grossSalary: targetStructure.grossSalary, netSalary: targetStructure.grossSalary - sumLines(targetStructure.deductions), effectiveDate: bulkEffectiveDate, assignedDate: bulkEffectiveDate, updatedAt: new Date().toISOString(), reason: 'Structure transfer' } : item)); setAssignmentSelection([row.id]); addToast('success', 'Structure transferred', `${row.employeeName} moved to ${targetStructure.structureName}.`); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
              <ArrowRight className="h-3.5 w-3.5" /> Transfer
            </button>
          </>
        )}
      />
    </div>
  );

  const renderProcessing = () => {
    const steps = [
      { id: 0, label: 'Select Month', icon: CalendarDays },
      { id: 1, label: 'Load Attendance', icon: ListChecks },
      { id: 2, label: 'Load Leave', icon: FileSpreadsheet },
      { id: 3, label: 'Load Overtime', icon: Banknote },
      { id: 4, label: 'Calculate Salary', icon: Workflow },
      { id: 5, label: 'Review', icon: Eye },
      { id: 6, label: 'Approve Payroll', icon: CheckCircle2 }
    ];

    const attendanceSnapshot = [
      { employee: 'Jonathan Miller', present: 24, leave: 2, late: 1, status: 'Ready' },
      { employee: 'Sarah Jenkins', present: 25, leave: 1, late: 0, status: 'Ready' },
      { employee: 'Robert Langdon', present: 23, leave: 2, late: 2, status: 'Warning' },
      { employee: 'Eleanor Vance', present: 26, leave: 0, late: 0, status: 'Ready' }
    ];

    const leaveSnapshot = [
      { employee: 'Jonathan Miller', type: 'Casual Leave', days: 1, impact: 'No deduction' },
      { employee: 'Sarah Jenkins', type: 'Sick Leave', days: 2, impact: 'Protected' },
      { employee: 'Robert Langdon', type: 'Loss of Pay', days: 1, impact: '₹1,200 deduction' },
      { employee: 'Marcus Brody', type: 'Earned Leave', days: 1, impact: 'Protected' }
    ];

    const overtimeSnapshot = [
      { employee: 'Jonathan Miller', hours: 8, rate: '1.5x', amount: 4200 },
      { employee: 'Sarah Jenkins', hours: 6, rate: '1.5x', amount: 3150 },
      { employee: 'Robert Langdon', hours: 5, rate: '1.25x', amount: 2450 },
      { employee: 'Marcus Brody', hours: 9, rate: '2x', amount: 5800 }
    ];

    const reviewWarnings = [
      '3 employees have late entries above the configured threshold.',
      '1 employee has loss-of-pay impact pending approval.',
      '2 rows include overtime above the usual weekly quota.'
    ];

    return (
      <div className="space-y-6">
        <SectionLabel
          eyebrow="Payroll Workflow"
          title="Payroll Processing"
          subtitle="A seven-step static workflow with meaningful review data, approvals, and batch status."
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <ShellCard title="Workflow Stepper" subtitle="Each step is rendered with equal-size cards and aligned content." icon={Workflow}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {steps.map(step => {
                  const Icon = step.icon;
                  const active = processingStep === step.id;
                  const complete = processingStep > step.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setProcessingStep(step.id)}
                      className={`flex min-h-[72px] items-center gap-4 rounded-[18px] border p-5 text-left transition-all ${
                        active
                          ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                          : complete
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : complete ? 'bg-emerald-100 dark:bg-emerald-950/60' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-75">Step {step.id + 1}</p>
                        <p className="mt-1 truncate whitespace-nowrap text-sm font-black">{step.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ShellCard>

            <ShellCard title={`Step ${processingStep + 1}: ${currentStepLabel}`} subtitle="Every step shows data, counts, and the batch context." icon={AlertTriangle}>
              {processingStep === 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Select Payroll Month</p>
                    <label className="mt-2 block space-y-1">
                      <span className="text-xs font-bold text-slate-500">Payroll Month</span>
                      <select value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                        {monthOptions.map(option => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payroll Context</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="font-bold text-slate-900 dark:text-white">Default Structure: {structureRows[0].structureName}</p>
                      <p className="text-slate-500">Cycle: {settings.payrollCycle} | Salary date: {settings.salaryDate}</p>
                      <p className="text-slate-500">Working days: {settings.workingDays} | PF: {settings.pfPercent}%</p>
                    </div>
                  </div>
                </div>
              )}

              {processingStep === 1 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {attendanceSnapshot.map(item => (
                    <div key={item.employee} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.employee}</p>
                          <p className="mt-1 text-xs text-slate-500">Present: {item.present} days | Leave: {item.leave} days</p>
                        </div>
                        <Badge variant={item.status === 'Ready' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-white p-2 dark:bg-slate-900"><p className="text-[10px] text-slate-400">Present</p><p className="font-black text-slate-900 dark:text-white">{item.present}</p></div>
                        <div className="rounded-xl bg-white p-2 dark:bg-slate-900"><p className="text-[10px] text-slate-400">Leave</p><p className="font-black text-slate-900 dark:text-white">{item.leave}</p></div>
                        <div className="rounded-xl bg-white p-2 dark:bg-slate-900"><p className="text-[10px] text-slate-400">Late</p><p className="font-black text-slate-900 dark:text-white">{item.late}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {processingStep === 2 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {leaveSnapshot.map(item => (
                    <div key={item.employee} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.employee}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.type} for {item.days} day(s)</p>
                        </div>
                        <Badge variant={item.impact.includes('deduction') ? 'warning' : 'success'} size="sm">{item.impact}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {processingStep === 3 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {overtimeSnapshot.map(item => (
                    <div key={item.employee} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.employee}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.hours} hrs at {item.rate}</p>
                        </div>
                        <p className="text-sm font-black text-brand-600">{formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {processingStep === 4 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {payrollRuns.map(run => (
                    <div key={run.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{run.employeeName}</p>
                          <p className="mt-1 text-xs text-slate-500">{run.department} | {run.empId}</p>
                        </div>
                        <Badge variant={run.status === 'Locked' ? 'success' : run.status === 'Pending' ? 'warning' : 'info'} size="sm">{run.status}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-white p-2 dark:bg-slate-900"><p className="text-[10px] text-slate-400">Gross</p><p className="font-black text-slate-900 dark:text-white">{formatCurrency(run.grossSalary)}</p></div>
                        <div className="rounded-xl bg-white p-2 dark:bg-slate-900"><p className="text-[10px] text-slate-400">Deductions</p><p className="font-black text-slate-900 dark:text-white">{formatCurrency(run.leaveDeduction + run.otherDeductions)}</p></div>
                        <div className="rounded-xl bg-white p-2 dark:bg-slate-900"><p className="text-[10px] text-slate-400">Net</p><p className="font-black text-slate-900 dark:text-white">{formatCurrency(run.netSalary)}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {processingStep === 5 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <MetricCard label="Employees Processed" value={String(processedCount)} helper="Ready or locked records" icon={CheckCircle2} tone="emerald" />
                  <MetricCard label="Pending Employees" value={String(Math.max(0, sampleEmployees.length - processedCount))} helper="Awaiting workflow steps" icon={AlertTriangle} tone="amber" />
                  <MetricCard label="Warnings" value={String(warningCount)} helper="Late entries and leave impacts" icon={ShieldCheck} tone="violet" />
                  <MetricCard label="Total Gross" value={formatCurrency(totalGrossCalculated)} helper="Calculated from current runs" icon={Banknote} tone="sky" />
                  <MetricCard label="Total Deduction" value={formatCurrency(totalDeductionCalculated)} helper="Leave and other deductions" icon={Trash2} tone="rose" />
                  <MetricCard label="Net Salary" value={formatCurrency(totalNetCalculated)} helper="Net disbursal after review" icon={WalletCards} tone="emerald" />
                </div>
              )}

              {processingStep === 6 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Generate Payroll Batch</p>
                      <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Ready to finalize July 2026 payroll.</p>
                      <button type="button" onClick={handleProcessPayroll} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20">
                        <Workflow className="h-4 w-4" /> Generate Payroll Batch
                      </button>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Approve Payroll</p>
                      <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Management approval locks the batch for pay-out.</p>
                      <button type="button" onClick={() => addToast('success', 'Payroll approved', 'The payroll batch has been approved and locked.')} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4" /> Approve Payroll
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Workflow Status</p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Step {processingStep + 1} of 7: {currentStepLabel}</p>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-sky-500" style={{ width: `${Math.round(((processingStep + 1) / 7) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </ShellCard>
          </div>

          <ShellCard title="Current Batch Summary" subtitle="Sticky sidebar summary for payroll processing." icon={ShieldCheck} className="sticky top-[100px] h-fit">
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payroll Month</p>
                <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{payrollMonth}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Current Step</p>
                <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{currentStepLabel}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-brand-50 p-3 text-center dark:bg-brand-950/30">
                  <p className="text-[10px] text-brand-500">Gross</p>
                  <p className="mt-1 text-sm font-black text-brand-700 dark:text-brand-300">{formatCurrency(totalGrossCalculated)}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                  <p className="text-[10px] text-rose-500">Deduction</p>
                  <p className="mt-1 text-sm font-black text-rose-700 dark:text-rose-300">{formatCurrency(totalDeductionCalculated)}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                  <p className="text-[10px] text-emerald-500">Net</p>
                  <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(totalNetCalculated)}</p>
                </div>
              </div>
              <div className="space-y-2">
                {steps.map(step => {
                  const active = processingStep === step.id;
                  const done = processingStep > step.id;
                  return (
                    <div key={step.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{step.label}</span>
                      <Badge variant={active ? 'info' : done ? 'success' : 'neutral'} size="sm">{active ? 'Current' : done ? 'Done' : 'Pending'}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </ShellCard>
        </div>
      </div>
    );
  };

  const renderPayslips = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Generate Payslips"
        title="Generate Payslips"
        subtitle="Search, filter, publish, email, regenerate, and download employee payslips from a single production-style workspace."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Payslips" value={String(payslipRows.length)} helper="Static payslip records" icon={ReceiptText} tone="sky" />
        <MetricCard label="Published" value={String(payslipRows.filter(row => row.status !== 'Generated').length)} helper="Visible to employees" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Draft" value={String(payslipRows.filter(row => row.status === 'Generated').length)} helper="Ready for generation" icon={AlertTriangle} tone="amber" />
        <MetricCard label="Selected" value={String(payslipSelection.length)} helper="Rows marked for bulk action" icon={ListChecks} tone="violet" />
      </div>

      <ShellCard
        title="Bulk Actions"
        subtitle="Generate, publish, email, or download all selected payslips."
        icon={WalletCards}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleGeneratePayslips} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20">
              <Workflow className="h-4 w-4" /> Generate All
            </button>
            <button type="button" onClick={handlePublishPayslips} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" /> Publish All
            </button>
            <button type="button" onClick={handleEmailPayslips} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-4 text-sm font-black text-white shadow-lg shadow-sky-500/20">
              <Mail className="h-4 w-4" /> Email All
            </button>
            <button type="button" onClick={handleDownloadZip} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Download className="h-4 w-4" /> Download ZIP
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payroll Month</span>
            <select value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {['All Months', ...monthOptions].map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Branch</span>
            <select className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {branchOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</span>
            <select className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {departmentOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</span>
            <select className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {['All Status', 'Generated', 'Paid', 'Emailed'].map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </ShellCard>

      <TableShell
        title="Payslip Register"
        subtitle="Every row can be previewed, downloaded, emailed, published, or regenerated."
        rows={filteredPayslips}
        columns={payslipColumns}
        searchableText={row => `${row.employeeName} ${row.empId} ${row.department || ''} ${row.month}`}
        rowKey={row => row.id}
        selectable
        selectedIds={payslipSelection}
        onSelectedIdsChange={setPayslipSelection}
        onExport={() => addToast('success', 'Export ready', 'Payslip register exported as CSV preview.')}
        rowActions={row => (
          <>
            <button type="button" onClick={e => { e.stopPropagation(); handlePreviewPayslip(row.employeeId); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); addToast('success', 'PDF ready', `${row.employeeName}'s payslip downloaded.`); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); addToast('success', 'Email sent', `${row.employeeName}'s payslip email queued.`); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-50 px-3 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); setPayslipRows(prev => prev.map(item => item.id === row.id ? { ...item, status: item.status === 'Generated' ? 'Paid' : 'Emailed' } : item)); addToast('success', 'Payslip published', `${row.employeeName} marked as published.`); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); addToast('info', 'Regenerated', `${row.employeeName}'s payslip has been regenerated.`); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Copy className="h-3.5 w-3.5" /> Regenerate
            </button>
          </>
        )}
      />
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Salary History"
        title="Salary History"
        subtitle="View every employee's month-by-month salary journey, revision notes, payment date, and net disbursal."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Employees in Scope" value={String(sampleEmployees.length)} helper="Historical entries are generated per employee" icon={Users} tone="sky" />
        <MetricCard label="Latest Net Salary" value={formatCurrency(historyEntries[0]?.net || 0)} helper="Most recent entry in the static timeline" icon={Banknote} tone="emerald" />
        <MetricCard label="Revisions" value={String(historyEntries.filter(item => item.revision.includes('increment')).length)} helper="Revision notes attached" icon={Pencil} tone="violet" />
        <MetricCard label="Paid Months" value={String(historyEntries.filter(item => item.status === 'Paid').length)} helper="Paid entries across the timeline" icon={CheckCircle2} tone="amber" />
      </div>

      <ShellCard title="Salary History Filters" subtitle="Filter by employee, year, month, and department." icon={Filter}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</span>
            <select value={historyFilters.employee} onChange={e => setHistoryFilters(prev => ({ ...prev, employee: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option>All Employees</option>
              {sampleEmployees.map(employee => <option key={employee.id}>{`${employee.firstName} ${employee.lastName}`}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Year</span>
            <select value={historyFilters.year} onChange={e => setHistoryFilters(prev => ({ ...prev, year: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option>All Years</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Month</span>
            <select value={historyFilters.month} onChange={e => setHistoryFilters(prev => ({ ...prev, month: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option>All Months</option>
              {monthOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</span>
            <select value={historyFilters.department} onChange={e => setHistoryFilters(prev => ({ ...prev, department: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option>All Departments</option>
              {departmentOptions.slice(1).map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </ShellCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
        <div className="space-y-4">
          {filteredHistory.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openStaffDrawer(entry.employeeId)}
              className="w-full rounded-[20px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{entry.month}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.employeeName} | {entry.department}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{entry.revision}</p>
                  </div>
                </div>
                <Badge variant={entry.status === 'Paid' ? 'success' : entry.status === 'Generated' ? 'warning' : 'info'} size="sm">{entry.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400">Gross</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(entry.gross)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400">Allowances</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(entry.allowances)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400">Deductions</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(entry.deductions)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400">Net</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(entry.net)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-[10px] text-slate-400">Payment Date</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{formatShortDate(entry.paymentDate)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <ShellCard title="History Snapshot" subtitle="Selected employee details and revisions." icon={TrendingUp} className="sticky top-[100px] h-fit">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Latest Month</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{filteredHistory[0]?.month || 'July 2026'}</p>
              <p className="mt-2 text-sm text-slate-500">{filteredHistory[0]?.employeeName || 'Choose an employee from the timeline.'}</p>
            </div>
            <div className="space-y-3">
              {filteredHistory.slice(0, 4).map(entry => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{entry.month}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{entry.revision}</p>
                </div>
              ))}
            </div>
          </div>
        </ShellCard>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Reports"
        title="Payroll Reports"
        subtitle="A static report center with Excel, PDF, and print-ready exports for every payroll view."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Report Types" value={String(reportsCatalog.length)} helper="Covered payroll report set" icon={FileSpreadsheet} tone="sky" />
        <MetricCard label="Compliance Reports" value="4" helper="PF, ESI, PT, and transfers" icon={ShieldCheck} tone="emerald" />
        <MetricCard label="Analytics Views" value="5" helper="Department, summary, annual" icon={BarChart3} tone="violet" />
        <MetricCard label="Generated Today" value="10" helper="All report entries refreshed" icon={CalendarDays} tone="amber" />
      </div>

      <TableShell
        title="Payroll Report Catalog"
        subtitle="Search, sort, filter, hide columns, export, and page through the full report set."
        rows={reportsCatalog}
        columns={reportColumns}
        searchableText={row => `${row.reportName} ${row.scope} ${row.owner} ${row.category}`}
        rowKey={row => row.id}
        onExport={() => addToast('success', 'Export ready', 'Payroll report catalog exported as CSV preview.')}
        filters={
          <select className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option>All Reports</option>
            <option>Compliance</option>
            <option>Analytics</option>
            <option>Employee</option>
          </select>
        }
        rowActions={row => (
          <>
            <button type="button" onClick={() => addToast('success', 'Excel export ready', `${row.reportName} exported to Excel.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
              <Download className="h-3.5 w-3.5" /> Excel
            </button>
            <button type="button" onClick={() => addToast('success', 'PDF export ready', `${row.reportName} exported to PDF.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-50 px-3 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
              <FileSpreadsheet className="h-3.5 w-3.5" /> PDF
            </button>
            <button type="button" onClick={() => addToast('info', 'Print queued', `${row.reportName} print job queued.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </>
        )}
      />
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <SectionLabel
        eyebrow="Payroll Settings"
        title="Payroll Settings"
        subtitle="Payroll-only configuration for cycle rules, statutory percentages, round-off rules, and payslip templates."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <ShellCard title="Configuration" subtitle="Static payroll settings for salary cycles, statutory percentages, and payslip output." icon={Settings}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Cycle</span>
              <select value={settings.payrollCycle} onChange={e => setSettings(prev => ({ ...prev, payrollCycle: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {['Monthly', 'Bi-Weekly', 'Weekly'].map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Payment Date</span>
              <input value={settings.salaryDate} onChange={e => setSettings(prev => ({ ...prev, salaryDate: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Working Days</span>
              <input type="number" value={settings.workingDays} onChange={e => setSettings(prev => ({ ...prev, workingDays: Number(e.target.value) }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Default Salary Structure</span>
              <select value={settings.defaultStructureId} onChange={e => setSettings(prev => ({ ...prev, defaultStructureId: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {structureRows.map(structure => <option key={structure.id} value={structure.id}>{structure.structureName}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF Percentage</span>
              <input type="number" value={settings.pfPercent} onChange={e => setSettings(prev => ({ ...prev, pfPercent: Number(e.target.value) }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">ESI Percentage</span>
              <input type="number" value={settings.esiPercent} onChange={e => setSettings(prev => ({ ...prev, esiPercent: Number(e.target.value) }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Professional Tax</span>
              <input type="number" value={settings.professionalTax} onChange={e => setSettings(prev => ({ ...prev, professionalTax: Number(e.target.value) }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Round Off Rules</span>
              <select value={settings.roundOffRule} onChange={e => setSettings(prev => ({ ...prev, roundOffRule: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {['Round to nearest rupee', 'Round to nearest 5', 'No rounding'].map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payslip Template</span>
              <select value={settings.payslipTemplate} onChange={e => setSettings(prev => ({ ...prev, payslipTemplate: e.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                {['Modern', 'Compact', 'Signature'].map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => addToast('success', 'Settings saved', 'Payroll settings updated in the static ERP shell.')} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20">
              <Save className="h-4 w-4" /> Save Settings
            </button>
            <button type="button" onClick={() => setSettings({
              payrollCycle: 'Monthly',
              salaryDate: '05',
              workingDays: 26,
              pfPercent: 12,
              esiPercent: 0.75,
              professionalTax: 200,
              defaultStructureId: baseStructures[1].id,
              overtimeEnabled: true,
              overtimeRate: 1.5,
              overtimeWeekendRate: 2,
              overtimeHolidayRate: 2.5,
              lopRule: 'Full day deduction for each unapproved absence',
              leaveRule: 'Approved leave is salary protected within entitlement',
              roundOffRule: 'Round to nearest rupee',
              payslipTemplate: 'Modern',
              autoGeneratePayslips: true,
              autoPublishPayslips: false,
              autoLockPayroll: true
            })} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <X className="h-4 w-4" /> Reset
            </button>
          </div>
        </ShellCard>

        <ShellCard title="Settings Snapshot" subtitle="A quick overview of the active payroll configuration." icon={ShieldCheck} className="sticky top-[100px] h-fit">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Default Structure</p>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-white">{structureRows.find(row => row.id === settings.defaultStructureId)?.structureName || 'Not set'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF</p>
                <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{settings.pfPercent}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-950">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">ESI</p>
                <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{settings.esiPercent}%</p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Template</p>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-white">{settings.payslipTemplate}</p>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950">
              The payroll module is intentionally static: no API calls, no empty setup screen, and no duplicate payroll setup tabs.
            </div>
          </div>
        </ShellCard>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff-payroll-structures':
        return renderStructures();
      case 'staff-payroll-payslips':
        return renderPayslips();
      case 'staff-payroll-history':
        return renderHistory();
      case 'staff-payroll-settings':
        return renderSettings();
      case 'staff-payroll':
      case 'staff-payroll-assignment':
      case 'staff-payroll-processing':
      case 'staff-payroll-reports':
      default:
        return renderPayslips();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[20px] border border-slate-200 bg-white/95 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">Payroll</Badge>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">School ERP / Payroll</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Complete Payroll Module</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              A clean static payroll workspace focused on salary structures, payslip generation, payslip history, and payroll settings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => navigateTab('staff-payroll-structures')} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20">
              <Layers className="h-4 w-4" /> Salary Structure
            </button>
            <button type="button" onClick={() => navigateTab('staff-payroll-payslips')} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <ReceiptText className="h-4 w-4" /> Generate Payslips
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 px-4 py-4 dark:border-slate-800 md:grid-cols-4">
          {payrollTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateTab(tab.id)}
                className={`flex min-h-[72px] items-center gap-3 rounded-[18px] border p-4 text-left transition-all ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-75">Payroll</p>
                  <p className="mt-1 truncate whitespace-nowrap text-xs font-black">{tab.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {renderTabContent()}

      <PayrollDrawer
        staff={payrollPreviewStaff}
        isOpen={payrollDrawerOpen}
        onClose={() => setPayrollDrawerOpen(false)}
      />

      {isStructureEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[24px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">{editingStructureId ? 'Edit Structure' : 'Create Structure'}</p>
                <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{structureDraft.structureName || 'New Structure'}</h3>
              </div>
              <button type="button" onClick={() => setIsStructureEditorOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['Structure Code', 'structureCode'],
                  ['Structure Name', 'structureName'],
                  ['Department', 'department'],
                  ['Designation', 'designation'],
                  ['Branch', 'branch'],
                  ['Employment Type', 'employmentType']
                ].map(([label, key]) => (
                  <label key={key} className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{label}</span>
                    <input
                      value={(structureDraft as any)[key]}
                      onChange={e => setStructureDraft(prev => ({ ...prev, [key]: e.target.value }))}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </label>
                ))}
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</span>
                  <select value={structureDraft.employeeCategory} onChange={e => setStructureDraft(prev => ({ ...prev, employeeCategory: e.target.value as 'Teacher' | 'Staff' }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <option value="Teacher">Teacher</option>
                    <option value="Staff">Staff</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</span>
                  <select value={structureDraft.status} onChange={e => setStructureDraft(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>

                {[
                  ['Basic Salary', 'basicSalary'],
                  ['HRA', 'hra'],
                  ['DA', 'da'],
                  ['Medical Allowance', 'medicalAllowance'],
                  ['Conveyance', 'conveyance'],
                  ['Special Allowance', 'specialAllowance'],
                  ['PF', 'pf'],
                  ['ESI', 'esi'],
                  ['Professional Tax', 'professionalTax'],
                  ['Other Deductions', 'otherDeductions']
                ].map(([label, key]) => (
                  <label key={key} className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{label}</span>
                    <input
                      type="number"
                      value={(structureDraft as any)[key]}
                      onChange={e => setStructureDraft(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </label>
                ))}
                <label className="md:col-span-2 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Notes</span>
                  <textarea value={structureDraft.notes} onChange={e => setStructureDraft(prev => ({ ...prev, notes: e.target.value }))} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Net Salary Preview</p>
                  <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(makeStructure(structureDraft).grossSalary - sumLines(makeStructure(structureDraft).deductions))}</p>
                  <p className="mt-2 text-xs text-slate-500">This preview recalculates from the static components entered in the form.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Component Summary</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Gross Salary</span><span className="font-black text-slate-900 dark:text-white">{formatCurrency(makeStructure(structureDraft).grossSalary)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Allowances</span><span className="font-black text-slate-900 dark:text-white">{formatCurrency(sumLines(makeStructure(structureDraft).earnings) - (makeStructure(structureDraft).earnings[0]?.amount || 0))}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Deductions</span><span className="font-black text-slate-900 dark:text-white">{formatCurrency(sumLines(makeStructure(structureDraft).deductions))}</span></div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => setIsStructureEditorOpen(false)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveStructure} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white shadow-lg shadow-brand-500/20">
                    <Save className="h-4 w-4" /> Save Structure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isGenerateModalOpen}
        title="Generate Payslips"
        message="Are you sure you want to generate payslips for the selected employees?"
        confirmLabel="Generate"
        variant="info"
        onConfirm={confirmGeneratePayslips}
        onCancel={() => setIsGenerateModalOpen(false)}
      />
    </div>
  );
};

export default PayrollModuleView;
