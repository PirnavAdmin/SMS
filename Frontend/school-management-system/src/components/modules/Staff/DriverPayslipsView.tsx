// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Download, Eye, Calendar, IndianRupee,
  Search, CheckCircle2, XCircle, ShieldCheck, ChevronLeft,
  ChevronRight, ArrowUpDown, ChevronDown, Printer, X, Bus
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Payslip } from '../../../types';
import { Pagination } from '../../common/Pagination';
import { numberToWords } from '../../../utils/numberToWords';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

const formatPayMonth = (monthLabel?: string): string => {
  if (!monthLabel) return 'N/A';
  const ym = monthLabel.match(/\b(19|20\d\d)\b/g);
  const year = ym ? ym[0] : '';
  const monthName = monthLabel.replace(/\b(19|20\d\d)\b/g, '').trim();
  if (monthName && year) return `${monthName} ${year}`;
  return monthName || year || 'N/A';
};

export const DriverPayslipsView: React.FC = () => {
  const { user } = useAuth();
  const { staff = [], driverMasters = [], payslips = [], schoolProfile, fetchPayslips } = useData();

  useEffect(() => {
    if (fetchPayslips) {
      fetchPayslips();
    }
  }, [fetchPayslips]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  // 1. Resolve Driver Profile
  const matchedDriver = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const userEmpId = (user?.id || (user as any)?.empId || '').trim().toLowerCase();

    const fromMaster = driverMasters.find(d =>
      (userEmpId && (d.employeeId?.toLowerCase() === userEmpId || String(d.id) === userEmpId)) ||
      (userEmail && d.email?.toLowerCase() === userEmail) ||
      (userName && d.driverName?.toLowerCase() === userName)
    );

    if (fromMaster) return fromMaster;

    const fromStaff = staff.find(s =>
      (userEmpId && (s.employeeId?.toLowerCase() === userEmpId || String(s.id) === userEmpId)) ||
      (userEmail && s.email?.toLowerCase() === userEmail) ||
      (userName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === userName)
    );

    if (fromStaff) {
      return {
        id: fromStaff.id,
        driverName: `${fromStaff.firstName} ${fromStaff.lastName}`,
        employeeId: fromStaff.employeeId || fromStaff.empId || fromStaff.id || '',
        salary: fromStaff.salary || 30000
      };
    }

    return {
      id: user?.id || '1',
      driverName: user?.name || user?.email || 'Driver',
      employeeId: (user as any)?.empId || (user as any)?.employeeId || user?.id || '',
      salary: 30000
    };
  }, [user, driverMasters, staff]);

  // 2. Retrieve Generated Monthly Payslips
  const driverPayslips: Payslip[] = useMemo(() => {
    const driverId = String(matchedDriver.employeeId || matchedDriver.id || '').toLowerCase();
    const driverName = (matchedDriver.driverName || '').toLowerCase();

    return payslips.filter(p =>
      (p.employeeId && p.employeeId.toLowerCase() === driverId) ||
      (p.empId && p.empId.toLowerCase() === driverId) ||
      (p.employeeName && p.employeeName.toLowerCase().includes(driverName))
    ).map(p => ({
      ...p,
      month: formatPayMonth(p.month)
    }));
  }, [payslips, matchedDriver]);

  // 3. Filtered & Sorted payslips
  const sortedPayslips = useMemo(() => {
    const filtered = driverPayslips.filter(p => {
      const monthMatch = p.month.toLowerCase().includes(searchQuery.toLowerCase());
      const yearMatch = selectedYear === 'All' || p.month.includes(selectedYear);
      return monthMatch && yearMatch;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.disbursedDate || a.month).getTime();
      const dateB = new Date(b.disbursedDate || b.month).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [driverPayslips, searchQuery, selectedYear, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, sortOrder]);

  const totalPages = Math.ceil(sortedPayslips.length / itemsPerPage) || 1;
  const paginatedPayslips = sortedPayslips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Download / Print Payslip helper
  const handleDownloadPayslip = (p: Payslip) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const earnings = (p.earnings && p.earnings.length > 0) ? p.earnings : [
      { name: 'Basic Pay', amount: Number(p.basicSalary) || 20000 },
      { name: 'House Rent Allowance (HRA)', amount: Number(p.hra) || 6000 },
      { name: 'Special Transit Allowance', amount: Number(p.da) || 4000 },
    ];

    const deductions = (p.deductions && p.deductions.length > 0) ? p.deductions : [
      { name: 'Provident Fund (PF)', amount: Number(p.pfDeduction) || 1800 },
      { name: 'Professional Tax (PT)', amount: Number(p.otherDeductions) || 200 },
    ];

    const totalEarnings = Number(p.grossSalary) || earnings.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const netSalaryVal = Number(p.netSalary) || Math.max(0, totalEarnings - totalDeductions);

    const formatNum = (num: number) => isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const inWords = numberToWords(netSalaryVal);

    const maxRows = Math.max(earnings.length, deductions.length, 1);
    const tableRowsHtml = Array.from({ length: maxRows }).map((_, i) => {
      const earn = earnings[i];
      const ded = deductions[i];
      return `
        <tr>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${earn ? earn.name : ''}</td>
          <td style="padding: 5px 8px; border-right: 2px solid #94a3b8; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Consolas', monospace; font-weight: 600;">${earn ? `₹${formatNum(Number(earn.amount))}` : ''}</td>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${ded ? ded.name : ''}</td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; color: ${ded ? '#b91c1c' : 'inherit'};">${ded ? `₹${formatNum(Number(ded.amount))}` : ''}</td>
        </tr>
      `;
    }).join('');

    const activeSchoolName = schoolProfile?.name || schoolProfile?.schoolName || 'PIRNAV EDUCATIONAL INSTITUTIONS';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Payslip - ${p.month} - ${p.employeeName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .payslip-sheet {
                box-shadow: none !important;
                border: 1.5px solid #0f172a !important;
                max-height: 275mm !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
              }
              .no-print { display: none !important; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #f8fafc;
              margin: 0;
              padding: 12px;
              font-size: 11px;
              line-height: 1.35;
            }
            .payslip-sheet {
              max-width: 210mm;
              margin: 0 auto;
              background: #ffffff;
              border: 1.5px solid #0f172a;
              padding: 20px 24px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .school-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .school-info {
              flex: 1;
              text-align: center;
              padding: 0 10px;
            }
            .school-name {
              font-size: 19px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .school-sub {
              font-size: 10px;
              color: #475569;
              font-weight: 500;
              line-height: 1.3;
            }
            .logo-img {
              max-height: 52px;
              max-width: 100px;
              object-fit: contain;
            }
            .doc-title-bar {
              background: #0f172a;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 5px 12px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .emp-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              border: 1px solid #cbd5e1;
            }
            .emp-table td {
              padding: 4px 8px;
              font-size: 10px;
              border: 1px solid #e2e8f0;
            }
            .emp-table .lbl {
              background: #f8fafc;
              color: #475569;
              font-weight: 700;
              width: 18%;
              text-transform: uppercase;
              font-size: 9.5px;
              letter-spacing: 0.3px;
            }
            .emp-table .val {
              color: #0f172a;
              font-weight: 600;
              width: 32%;
            }
            .salary-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              border: 1.5px solid #0f172a;
            }
            .salary-table th {
              padding: 5px 8px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #cbd5e1;
            }
            .salary-table th.main-hdr {
              background: #0f172a;
              color: #ffffff;
              font-size: 10.5px;
              text-align: left;
            }
            .salary-table th.sub-hdr {
              background: #f1f5f9;
              color: #334155;
            }
            .salary-table td {
              padding: 4.5px 8px;
              font-size: 10.5px;
              border: 1px solid #e2e8f0;
              color: #1e293b;
            }
            .salary-table td.amount {
              text-align: right;
              font-family: 'Consolas', 'Courier New', monospace;
              font-weight: 600;
            }
            .salary-table .divider-col {
              border-right: 2px solid #94a3b8 !important;
            }
            .salary-table .tot-row td {
              background: #f1f5f9;
              font-weight: 800;
              color: #0f172a;
              border-top: 1.5px solid #0f172a;
              border-bottom: 1.5px solid #0f172a;
            }
            .net-summary-box {
              border: 1.5px solid #0f172a;
              background: #f8fafc;
              padding: 10px 14px;
              margin-bottom: 14px;
              border-radius: 2px;
            }
            .net-main {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px dashed #cbd5e1;
              padding-bottom: 6px;
              margin-bottom: 6px;
            }
            .net-title {
              font-size: 11px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .net-amount {
              font-size: 19px;
              font-weight: 900;
              color: #0f172a;
              font-family: 'Consolas', 'Courier New', monospace;
            }
            .net-words {
              font-size: 10px;
              color: #334155;
              font-weight: 600;
            }
            .net-words strong {
              color: #0f172a;
            }
            .net-meta {
              margin-top: 4px;
              font-size: 9.5px;
              color: #64748b;
            }
            .signature-block {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 36px;
              margin-bottom: 12px;
              padding: 0 10px;
            }
            .sign-col {
              text-align: center;
              width: 210px;
            }
            .sign-line {
              border-top: 1px solid #475569;
              margin-bottom: 4px;
            }
            .sign-label {
              font-size: 9.5px;
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
            }
            .footer-note {
              text-align: center;
              font-size: 9px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              margin-top: 8px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="payslip-sheet">
            <div class="school-header">
              ${schoolProfile?.logoUrl ? `<img src="${resolveMediaUrl(schoolProfile.logoUrl)}" class="logo-img" alt="Logo" />` : '<div style="width: 70px;"></div>'}
              <div class="school-info">
                <div class="school-name">${activeSchoolName.toUpperCase()}</div>
                <div class="school-sub">
                  ${schoolProfile?.address || 'Madhapur Campus, Hyderabad, Telangana - 500081'}<br/>
                  Affiliated to CBSE, New Delhi | Affiliation No. 3630284 | Phone: ${schoolProfile?.phone || '+91 40 2345 6789'}
                </div>
              </div>
              <div style="width: 70px; text-align: right;">
                <span style="font-size: 9px; font-weight: 800; color: #16a34a; background: #dcfce7; border: 1px solid #86efac; padding: 2px 6px; border-radius: 3px;">PAID</span>
              </div>
            </div>

            <div class="doc-title-bar">
              <span>SALARY PAYSLIP FOR THE MONTH OF ${String(p.month || 'CURRENT').toUpperCase()}</span>
              <span style="font-size: 9.5px; font-weight: 600; opacity: 0.9;">Ref: PS-${p.empId || p.employeeId || 'DRV'}-${String(p.month || 'M').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</span>
            </div>

            <table class="emp-table">
              <tr>
                <td class="lbl">Employee ID</td>
                <td class="val" style="font-family: monospace; font-weight: 700;">${p.empId || p.employeeId}</td>
                <td class="lbl">Employee Name</td>
                <td class="val">${p.employeeName}</td>
              </tr>
              <tr>
                <td class="lbl">Designation</td>
                <td class="val">${p.designation || 'Bus Driver'}</td>
                <td class="lbl">Department</td>
                <td class="val">${p.department || 'Transport'}</td>
              </tr>
              <tr>
                <td class="lbl">Campus / Branch</td>
                <td class="val">${p.branch || 'Transport Division'}</td>
                <td class="lbl">Disbursed Date</td>
                <td class="val">${p.disbursedDate || p.paymentDate || new Date().toISOString().split('T')[0]}</td>
              </tr>
              <tr>
                <td class="lbl">Bank Name &amp; A/C</td>
                <td class="val" style="font-family: monospace;">${p.bankAccount ? `Bank A/C: ${p.bankAccount}` : 'Direct Bank Deposit'}</td>
                <td class="lbl">Payment Status</td>
                <td class="val" style="color: #16a34a; font-weight: 700;">CONFIRMED (PAID)</td>
              </tr>
            </table>

            <table class="salary-table">
              <thead>
                <tr>
                  <th class="main-hdr divider-col" colspan="2">EARNINGS</th>
                  <th class="main-hdr" colspan="2">DEDUCTIONS</th>
                </tr>
                <tr>
                  <th class="sub-hdr" style="text-align: left; width: 33%;">Particulars / Component</th>
                  <th class="sub-hdr divider-col" style="text-align: right; width: 17%;">Amount (₹)</th>
                  <th class="sub-hdr" style="text-align: left; width: 33%;">Particulars / Component</th>
                  <th class="sub-hdr" style="text-align: right; width: 17%;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr class="tot-row">
                  <td><strong>TOTAL GROSS EARNINGS (A)</strong></td>
                  <td class="amount divider-col"><strong>₹${formatNum(totalEarnings)}</strong></td>
                  <td><strong>TOTAL DEDUCTIONS (B)</strong></td>
                  <td class="amount" style="color: #b91c1c;"><strong>₹${formatNum(totalDeductions)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="net-summary-box">
              <div class="net-main">
                <div>
                  <div class="net-title">NET TAKE-HOME SALARY PAYABLE (A - B)</div>
                  <div class="net-meta">Payment Mode: Direct Bank Transfer (NEFT/RTGS) &bull; Credit Account: ${p.bankAccount || 'On File'}</div>
                </div>
                <div class="net-amount">₹${formatNum(netSalaryVal)}</div>
              </div>
              <div class="net-words">
                Amount in Words: <strong>Rupees ${inWords}</strong>
              </div>
            </div>

            <div class="signature-block">
              <div class="sign-col">
                <div class="sign-line"></div>
                <div class="sign-label">Employee Signature</div>
              </div>
              <div class="sign-col">
                <div class="sign-line"></div>
                <div class="sign-label">Authorised Signatory / Accounts</div>
              </div>
            </div>

            <div class="footer-note">
              This is a computer-generated official payslip issued by ${activeSchoolName}. Does not require an ink signature.
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800 shadow-xs">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Driver Salary & Payslips
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {matchedDriver.driverName} • ID: {matchedDriver.employeeId || matchedDriver.id || '—'} • Transport Roster
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Net Salary</span>
          <span className="text-2xl font-black text-sky-600">
            {formatCurrency(driverPayslips[0]?.netSalary || 28000)}
          </span>
          <p className="text-[10px] text-slate-400">Regular Monthly Transit Disbursement</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Gross Earnings</span>
          <span className="text-2xl font-black text-emerald-600">
            {formatCurrency(driverPayslips[0]?.grossSalary || 30000)}
          </span>
          <p className="text-[10px] text-slate-400">Includes Base, HRA & Transit Allowance</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-600 block">Total Statutory PF</span>
          <span className="text-2xl font-black text-amber-600">
            {formatCurrency(driverPayslips[0]?.pfDeduction || 1800)}
          </span>
          <p className="text-[10px] text-slate-400">Monthly Provident Fund Contribution</p>
        </div>
      </div>

      {/* Payslips Table Card */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            Payslip History ({sortedPayslips.length})
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search month..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500/20 outline-none w-36 sm:w-44"
              />
            </div>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Payslip Month</th>
                <th className="py-2.5 px-3">Disbursed Date</th>
                <th className="py-2.5 px-3">Gross Salary</th>
                <th className="py-2.5 px-3">Deductions</th>
                <th className="py-2.5 px-3">Net Pay</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedPayslips.map(p => {
                const totalDeductions = (p.pfDeduction || 0) + (p.otherDeductions || 0);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      {p.month}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {p.disbursedDate}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.grossSalary)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">
                      {formatCurrency(totalDeductions)}
                    </td>
                    <td className="py-2.5 px-3 font-black text-emerald-600">
                      {formatCurrency(p.netSalary)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" size="sm">Paid</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingPayslip(p)}
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                          title="View Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(p)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Print / Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedPayslips.length > 0 && (
          <div className="px-4 pb-3">
            <Pagination
              currentPage={currentPage}
              totalItems={sortedPayslips.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              label="payslips"
            />
          </div>
        )}
      </div>

      {/* View Breakdown Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  Salary Breakdown - {viewingPayslip.month}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {viewingPayslip.id}</p>
              </div>
              <button
                onClick={() => setViewingPayslip(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Earnings & Deductions grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-black text-emerald-600 block">Earnings</span>
                  {(viewingPayslip.earnings || []).map((e, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">{e.name}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-emerald-600">
                    <span>Total Gross</span>
                    <span>{formatCurrency(viewingPayslip.grossSalary)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-black text-rose-600 block">Deductions</span>
                  {(viewingPayslip.deductions || []).map((d, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                      <span className="font-bold text-rose-600">{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-rose-600">
                    <span>Total Deductions</span>
                    <span>{formatCurrency((viewingPayslip.pfDeduction || 0) + (viewingPayslip.otherDeductions || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Net pay callout */}
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300 block">Net Payable Amount</span>
                  <span className="text-xs text-slate-500">Disbursed to Bank Account</span>
                </div>
                <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                  {formatCurrency(viewingPayslip.netSalary)}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewingPayslip(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPayslip(viewingPayslip);
                    setViewingPayslip(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
