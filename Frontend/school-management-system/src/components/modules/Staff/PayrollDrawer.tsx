import React, { useMemo, useState, useEffect } from 'react';
import {
  X, WalletCards, Coins, Banknote, ReceiptText, ShieldCheck,
  FileSpreadsheet, Download, Mail, Printer, Eye, CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface PayrollDrawerProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab =
  | 'overview'
  | 'salary-structure'
  | 'allowances'
  | 'deductions'
  | 'history'
  | 'payslips'
  | 'bank';

const tabs: { id: DrawerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: WalletCards },
  { id: 'salary-structure', label: 'Salary Structure', icon: FileSpreadsheet },
  { id: 'allowances', label: 'Allowances', icon: Coins },
  { id: 'deductions', label: 'Deductions', icon: ShieldCheck },
  { id: 'history', label: 'Payroll History', icon: ReceiptText },
  { id: 'payslips', label: 'Payslips', icon: Printer },
  { id: 'bank', label: 'Bank Details', icon: Banknote }
];

const DrawerCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = '' }) => (
  <section className={`space-y-4 pt-2 ${className}`}>
    <div className="mb-2">
      <h4 className="text-sm font-black text-slate-900 dark:text-white">{title}</h4>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const formatShortDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StaffAvatar: React.FC<{ staff: Staff; className?: string }> = ({ staff, className = '' }) => {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => {
    setImgErr(false);
  }, [staff.avatar, staff.id]);

  if (!imgErr && staff.avatar) {
    return (
      <img
        src={staff.avatar}
        alt={`${staff.firstName} ${staff.lastName}`}
        onError={() => setImgErr(true)}
        className={`h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm ${className}`}
      />
    );
  }

  return (
    <div className={`h-12 w-12 rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center text-xs font-black ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm uppercase ${className}`}>
      {((staff.firstName?.[0] || '') + (staff.lastName?.[0] || '')).toUpperCase() || '?'}
    </div>
  );
};

export const PayrollDrawer: React.FC<PayrollDrawerProps> = ({ staff, isOpen, onClose }) => {
  const { salaryStructures, employeeSalaryAssignments, payslips } = useData();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');

  const assignment = staff ? employeeSalaryAssignments.find(item => item.employeeId === staff.id && item.status === 'Active') : null;
  const structure = staff ? (salaryStructures.find(item => item.id === assignment?.salaryStructureId || item.id === staff.salaryStructureId) || salaryStructures[0]) : null;
  const employeePayslips = staff ? payslips.filter(item => item.employeeId === staff.id) : [];

  const basicSalary = structure?.earnings[0]?.amount || staff?.salary || 0;
  const allowances = structure ? structure.earnings.slice(1).reduce((sum, line) => sum + line.amount, 0) : Math.round(basicSalary * 0.25);
  const deductions = structure ? structure.deductions.reduce((sum, line) => sum + line.amount, 0) : Math.round(basicSalary * 0.12);
  const grossSalary = structure?.grossSalary || basicSalary + allowances;
  const netSalary = assignment?.monthlyGross ? assignment.monthlyGross - deductions : Math.max(0, grossSalary - deductions);
  const historyRows = employeePayslips.length > 0
    ? employeePayslips.slice(0, 5)
    : [
        { month: 'July 2026', status: 'Paid' as const, netSalary, disbursedDate: '2026-07-30', paymentDate: '2026-07-30' },
        { month: 'June 2026', status: 'Paid' as const, netSalary: Math.max(0, netSalary - 800), disbursedDate: '2026-06-30', paymentDate: '2026-06-30' },
        { month: 'May 2026', status: 'Generated' as const, netSalary: Math.max(0, netSalary - 1500), disbursedDate: '2026-05-30', paymentDate: '2026-05-30' }
      ];

  const [viewingPayslip, setViewingPayslip] = useState<any>(null);

  const latestPayslip = useMemo(() => {
    if (!staff) return null;
    if (employeePayslips && employeePayslips.length > 0) {
      return employeePayslips[0];
    }
    return {
      id: `PS-${staff.id}-DRAFT`,
      employeeId: staff.id,
      employeeName: `${staff.firstName} ${staff.lastName}`,
      empId: staff.empId,
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      basicSalary: basicSalary,
      hra: structure?.earnings.find(e => e.name.toLowerCase().includes('hra'))?.amount || Math.round(basicSalary * 0.1),
      da: structure?.earnings.find(e => e.name.toLowerCase().includes('da'))?.amount || Math.round(basicSalary * 0.05),
      pfDeduction: structure?.deductions.find(d => d.name.toLowerCase().includes('pf'))?.amount || Math.round(basicSalary * 0.12),
      lopDeduction: 0,
      otherDeductions: deductions - (structure?.deductions.find(d => d.name.toLowerCase().includes('pf'))?.amount || Math.round(basicSalary * 0.12)),
      grossSalary: grossSalary,
      netSalary: netSalary,
      status: 'Paid',
      disbursedDate: new Date().toISOString().split('T')[0],
      bankAccount: staff.bankDetails?.accountNumber || 'N/A',
      department: staff.department || 'General',
      designation: staff.designation || 'Staff',
      branch: staff.branch || 'Main Campus',
      earnings: structure?.earnings || [
        { name: 'Basic Pay', amount: basicSalary },
        { name: 'Allowances', amount: allowances }
      ],
      deductions: structure?.deductions || [
        { name: 'Deductions', amount: deductions }
      ]
    };
  }, [staff, employeePayslips, basicSalary, allowances, deductions, grossSalary, netSalary, structure]);

  const handleDownloadPayslip = (p: any) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const earnings = p.earnings || [
      { name: 'Basic Pay', amount: p.basicSalary },
      { name: 'House Rent Allowance (HRA)', amount: p.hra || 0 },
      { name: 'Dearness Allowance (DA)', amount: p.da || 0 },
    ];

    const deductions = p.deductions || [
      { name: 'Provident Fund (PF)', amount: p.pfDeduction || 0 },
      { name: 'Professional Tax (PT)', amount: p.otherDeductions || 200 },
      ...(p.lopDeduction ? [{ name: 'Loss of Pay (LOP)', amount: p.lopDeduction }] : [])
    ];

    const totalEarnings = earnings.reduce((sum: number, e: any) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum: number, d: any) => sum + d.amount, 0);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${p.month} - ${p.employeeName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header-banner { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 15px; margin-bottom: 25px; }
            .school-title { font-size: 24px; font-weight: 900; color: #0369a1; letter-spacing: 1px; }
            .sub-title { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 3px; }
            .doc-heading { font-size: 15px; font-weight: 800; background: #f0f9ff; display: inline-block; padding: 6px 20px; border-radius: 8px; border: 1px solid #bae6fd; color: #0369a1; margin-top: 12px; }
            .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; font-size: 12px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .emp-cell { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
            .emp-label { color: #64748b; font-weight: 600; }
            .emp-val { font-weight: 700; color: #0f172a; }
            .table-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 11px; }
            td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }
            .t-right { text-align: right; }
            .tot-row { font-weight: 800; background: #f8fafc; font-size: 13px; }
            .net-box { background: #ecfdf5; border: 2px solid #a7f3d0; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
            .net-label { font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
            .net-val { font-size: 26px; font-weight: 900; color: #065f46; margin: 4px 0; }
            .sign-grid { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; font-weight: 700; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="school-title">PIRNAV EDUCATIONAL INSTITUTION</div>
            <div class="sub-title">Monthly Salary Statement / Payslip</div>
            <div class="doc-heading">STATEMENT OF EARNINGS FOR ${p.month.toUpperCase()}</div>
          </div>

          <div class="emp-grid">
            <div class="emp-cell"><span class="emp-label">Employee Name:</span><span class="emp-val">${p.employeeName}</span></div>
            <div class="emp-cell"><span class="emp-label">Employee ID:</span><span class="emp-val">${p.empId}</span></div>
            <div class="emp-cell"><span class="emp-label">Department:</span><span class="emp-val">${p.department}</span></div>
            <div class="emp-cell"><span class="emp-label">Designation:</span><span class="emp-val">${p.designation}</span></div>
            <div class="emp-cell"><span class="emp-label">Bank Account:</span><span class="emp-val">${p.bankAccount}</span></div>
            <div class="emp-cell"><span class="emp-label">Disbursed Date:</span><span class="emp-val">${p.disbursedDate}</span></div>
            <div class="emp-cell"><span class="emp-label">Branch:</span><span class="emp-val">${p.branch}</span></div>
            <div class="emp-cell"><span class="emp-label">Status:</span><span class="emp-val">PAID / DISBURSED</span></div>
          </div>

          <div class="table-container">
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Earnings Component</th>
                    <th class="t-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${earnings.map((e: any) => `
                    <tr>
                      <td>${e.name}</td>
                      <td class="t-right">${formatCurrency(e.amount)}</td>
                    </tr>
                  `).join('')}
                  <tr class="tot-row">
                    <td>Gross Earnings</td>
                    <td class="t-right">${formatCurrency(totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <table>
                <thead>
                  <tr>
                    <th>Deductions</th>
                    <th class="t-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${deductions.map((d: any) => `
                    <tr>
                      <td>${d.name}</td>
                      <td class="t-right">-${formatCurrency(d.amount)}</td>
                    </tr>
                  `).join('')}
                  <tr class="tot-row">
                    <td>Total Deductions</td>
                    <td class="t-right">-${formatCurrency(totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="net-box">
            <div class="net-label">Net Take-Home Salary</div>
            <div class="net-val">${formatCurrency(p.netSalary)}</div>
            <div style="font-size: 10px; color: #10b981; font-weight: 700; margin-top: 4px;">Disbursement completed successfully via Bank Transfer</div>
          </div>

          <div class="sign-grid">
            <div>Authorized Signatory<br><br><br>____________________</div>
            <div style="text-align: right;">Employee Signature<br><br><br>____________________</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleQuickAction = (title: string) => {
    if (title === 'Preview Payslip') {
      setViewingPayslip(latestPayslip);
    } else if (title === 'Download PDF') {
      handleDownloadPayslip(latestPayslip);
    } else {
      addToast('success', title, `${staff.firstName} ${staff.lastName}'s payroll action executed in the static drawer.`);
    }
  };

  const structureAllowances = structure?.earnings.slice(1) || [];
  const structureDeductions = structure?.deductions || [];
  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="flex w-full max-w-5xl h-full flex-col border-l border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-950 animate-in slide-in-from-right-16">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <StaffAvatar staff={staff} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={staff.employeeCategory === 'Teacher' ? 'info' : 'neutral'} size="sm">{staff.employeeCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff'}</Badge>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">{staff.empId}</span>
              </div>
              <h2 className="mt-1 truncate text-base font-black text-slate-900 dark:text-white">{staff.firstName} {staff.lastName}</h2>
              <p className="text-xs font-bold text-slate-500">{staff.designation} | {staff.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 transition-all ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${active ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
              <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DrawerCard title="Payroll Snapshot" subtitle="Current payroll values pulled from the static ERP data.">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Structure</span><span className="font-bold text-slate-900 dark:text-white">{structure?.structureName || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Gross Salary</span><span className="font-black text-brand-600">{formatCurrency(grossSalary)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Net Salary</span><span className="font-black text-emerald-600">{formatCurrency(netSalary)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><Badge variant={employeePayslips[0]?.status === 'Generated' ? 'warning' : 'success'} size="sm">{employeePayslips[0]?.status || 'Ready'}</Badge></div>
                  </div>
                </DrawerCard>
                <DrawerCard title="Employment Info" subtitle="Core profile and payroll mapping.">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Branch</span><span className="font-bold text-slate-900 dark:text-white">{staff.branch || 'Main Campus'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Joining Date</span><span className="font-bold text-slate-900 dark:text-white">{formatShortDate(staff.joiningDate)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Current Assignment</span><span className="font-bold text-slate-900 dark:text-white">{assignment?.salaryStructureName || 'Unassigned'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Bank</span><span className="font-bold text-slate-900 dark:text-white">{staff.bankDetails.bankName}</span></div>
                  </div>
                </DrawerCard>
              </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: 'Payslips', value: String(employeePayslips.length) },
                    { label: 'Gross', value: formatCurrency(grossSalary) },
                    { label: 'Net', value: formatCurrency(netSalary) },
                    { label: 'Status', value: employeePayslips[0]?.status || 'Ready' }
                  ].map(card => (
                    <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{card.label}</p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <DrawerCard title="Payroll Actions" subtitle="Fast payroll operations from the employee drawer.">
                <div className="space-y-3">
                  {[
                    'Preview Payslip',
                    'Download PDF'
                  ].map(action => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 transition-all hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <span>{action}</span>
                      <Eye className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </DrawerCard>
            </div>
          )}

          {activeTab === 'salary-structure' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <DrawerCard title="Salary Components" subtitle="Basic, allowances, and deductions for the active structure.">
                <div className="space-y-3">
                  {[
                    ['Basic Salary', basicSalary],
                    ...structureAllowances.map(item => [item.name, item.amount] as const)
                  ].map(([label, amount]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatCurrency(Number(amount))}</span>
                    </div>
                  ))}
                </div>
              </DrawerCard>
              <DrawerCard title="Deductions & Net" subtitle="Static payroll deductions and salary preview.">
                <div className="space-y-3">
                  {structureDeductions.map(item => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                      <span className="font-black text-rose-600">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-500">Net Salary Preview</p>
                    <p className="mt-2 text-3xl font-black text-brand-700 dark:text-brand-300">{formatCurrency(netSalary)}</p>
                  </div>
                </div>
              </DrawerCard>
            </div>
          )}

          {activeTab === 'allowances' && (
            <DrawerCard title="Allowances" subtitle="Positive earnings from the active salary structure.">
              <div className="space-y-2">
                {structureAllowances.map(item => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-black text-emerald-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'deductions' && (
            <DrawerCard title="Deductions" subtitle="Statutory and policy deductions for the active employee.">
              <div className="space-y-2">
                {structureDeductions.map(item => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-black text-rose-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'history' && (
            <DrawerCard title="Payroll History" subtitle="Three months of payroll history for this employee.">
              <div className="space-y-3">
                {historyRows.map((item: any) => (
                  <div key={`${item.month}-${item.disbursedDate}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.month}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatShortDate(item.paymentDate || item.disbursedDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-600">{formatCurrency(item.netSalary)}</p>
                      <Badge variant={item.status === 'Paid' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'payslips' && (
            <DrawerCard title="Payslips" subtitle="Download and publish ready-made employee payslips.">
              <div className="space-y-3">
                {historyRows.map((item: any) => (
                  <div key={`${item.month}-slip`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.month}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatCurrency(item.netSalary)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleQuickAction('Preview Payslip')} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Preview</button>
                      <button onClick={() => handleQuickAction('Download Payslip')} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'bank' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
              <DrawerCard title="Bank Details" subtitle="Salary disbursement account information.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Account Holder</p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.accountHolderName}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Account Number</p>
                    <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.accountNumber}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Bank</p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.bankName}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">IFSC</p>
                    <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.ifscCode}</p>
                  </div>
                </div>
              </DrawerCard>
              <DrawerCard title="Quick Bank Actions" subtitle="Static action buttons for bank workflows.">
                <div className="space-y-3">
                  {['Copy Account Number', 'Download Bank Advice', 'Email Bank Team', 'Print Salary Advice'].map(action => (
                    <button key={action} type="button" onClick={() => handleQuickAction(action)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                      <span>{action}</span>
                      <Mail className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </DrawerCard>
            </div>
          )}
        </div>

        {/* VIEW PAYSLIP MODAL PREVIEW */}
        {viewingPayslip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">PIRNAV EDUCATIONAL INSTITUTION</h3>
                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">Monthly Salary Statement ({viewingPayslip.month})</p>
                  </div>
                </div>
                <button onClick={() => setViewingPayslip(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Employee Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Employee Name</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.employeeName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Employee ID</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.empId}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingPayslip.department}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Designation</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingPayslip.designation}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Bank Account</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.bankAccount}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Disbursed Date</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.disbursedDate}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Branch</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.branch}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Payment Status</span>
                  <div className="mt-0.5"><Badge variant="success">Paid</Badge></div>
                </div>
              </div>

              {/* Salary Components Breakdown Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="border rounded-2xl p-3 bg-white dark:bg-slate-900">
                  <h4 className="font-bold text-slate-800 dark:text-white border-b pb-2 mb-2 flex items-center justify-between text-[11px]">
                    <span>EARNINGS COMPONENTS</span>
                    <span className="text-slate-400">AMOUNT</span>
                  </h4>
                  <div className="space-y-2">
                    {viewingPayslip.earnings.map((e: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>{e.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-black text-slate-900 dark:text-white">
                      <span>GROSS EARNINGS</span>
                      <span className="text-emerald-600">{formatCurrency(viewingPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border rounded-2xl p-3 bg-white dark:bg-slate-900">
                  <h4 className="font-bold text-slate-800 dark:text-white border-b pb-2 mb-2 flex items-center justify-between text-[11px]">
                    <span>DEDUCTIONS</span>
                    <span className="text-slate-400">AMOUNT</span>
                  </h4>
                  <div className="space-y-2">
                    {viewingPayslip.deductions.map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>{d.name}</span>
                        <span className="font-bold text-rose-600">-{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-black text-slate-900 dark:text-white">
                      <span>TOTAL DEDUCTIONS</span>
                      <span className="text-rose-600">-{formatCurrency(viewingPayslip.grossSalary - viewingPayslip.netSalary)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Summary Callout */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wider">NET TAKE-HOME SALARY</span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{formatCurrency(viewingPayslip.netSalary)}</p>
                </div>
                <button
                  onClick={() => handleDownloadPayslip(viewingPayslip)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" /> Download PDF / Print
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close Statement
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PayrollDrawer;
