import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  IndianRupee,
  Search,
  CheckCircle2,
  XCircle,
  GraduationCap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Payslip } from '../../../types';

export const TeacherPayslipsView: React.FC = () => {
  const { user } = useAuth();
  const { staff, payslips, schoolProfile } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  const isDriver = (user?.role || '').toLowerCase() === 'driver';

  const teacherStaffMember = useMemo(() => {
    const uEmail = user?.email?.toLowerCase().trim();
    const uName = user?.name?.toLowerCase().trim();
    const uRole = (user?.role || '').toLowerCase();

    // 1. Direct match on email / name / id in full staff list
    const directMatch = staff.find(s =>
      (uEmail && s.email && s.email.toLowerCase().trim() === uEmail) ||
      (uName && `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim() === uName) ||
      (user?.id && (String(s.id) === String(user.id) || String(s.empId) === String(user.id)))
    );
    if (directMatch) return directMatch;

    // 2. Driver role fallback
    if (uRole === 'driver') {
      const driverStaff = staff.find(s =>
        (s.designation || '').toLowerCase().includes('driver') ||
        (s.department || '').toLowerCase().includes('transport')
      );
      if (driverStaff) return driverStaff;
    }

    // 3. Teaching staff fallback for teachers
    const teachingStaff = staff.filter(s => {
      const des = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const cat = (s.employeeCategory || '').toLowerCase();
      return !dept.includes('transport') && !des.includes('driver') && !des.includes('attendant') && !cat.includes('non-teaching');
    });

    return teachingStaff.find(s => s.role === 'Teacher' || s.employeeCategory === 'Teacher') || teachingStaff[0] || staff[0];
  }, [staff, user]);

  // Synthesize realistic historical payslips for the teacher if none or few exist in state
  const teacherPayslips: Payslip[] = useMemo(() => {
    const existing = payslips.filter(p =>
      teacherStaffMember && (p.employeeId === teacherStaffMember.id || p.empId === teacherStaffMember.empId || p.employeeName.toLowerCase().includes(teacherStaffMember.firstName.toLowerCase()))
    );

    if (existing.length >= 3) return existing;

    // Past months default generator for teacher self view
    const pastMonths = [
      { month: 'July 2026', date: '2026-07-31', basic: 35000, hra: 12000, da: 5000, pf: 2400, lop: 0 },
      { month: 'June 2026', date: '2026-06-30', basic: 35000, hra: 12000, da: 5000, pf: 2400, lop: 0 },
      { month: 'May 2026', date: '2026-05-31', basic: 35000, hra: 12000, da: 5000, pf: 2400, lop: 1200 },
      { month: 'April 2026', date: '2026-04-30', basic: 35000, hra: 12000, da: 5000, pf: 2400, lop: 0 },
      { month: 'March 2026', date: '2026-03-31', basic: 34000, hra: 11500, da: 4800, pf: 2300, lop: 0 },
      { month: 'February 2026', date: '2026-02-28', basic: 34000, hra: 11500, da: 4800, pf: 2300, lop: 0 },
      { month: 'January 2026', date: '2026-01-31', basic: 34000, hra: 11500, da: 4800, pf: 2300, lop: 0 },
      { month: 'December 2025', date: '2025-12-31', basic: 32000, hra: 11000, da: 4500, pf: 2200, lop: 0 },
    ];

    const generated: Payslip[] = pastMonths.map((m, idx) => {
      const gross = m.basic + m.hra + m.da;
      const totalDeductions = m.pf + m.lop + 200; // 200 Professional Tax
      const net = gross - totalDeductions;
      return {
        id: `PS-TCH-${1000 + idx}`,
        employeeId: teacherStaffMember?.id || 'STF-001',
        employeeName: teacherStaffMember ? `${teacherStaffMember.firstName} ${teacherStaffMember.lastName}` : (user?.name || 'Faculty Member'),
        empId: teacherStaffMember?.empId || 'STF-2026-0001',
        branch: (teacherStaffMember as any)?.branch || 'Main Campus',
        department: teacherStaffMember?.department || 'Mathematics',
        designation: teacherStaffMember?.designation || 'Senior PGT Teacher',
        employeeCategory: 'Teacher',
        month: m.month,
        basicSalary: m.basic,
        hra: m.hra,
        da: m.da,
        grossSalary: gross,
        pfDeduction: m.pf,
        lopDeduction: m.lop,
        otherDeductions: 200,
        netSalary: net,
        bankAccount: teacherStaffMember?.bankDetails?.accountNumber || 'XXXX-XXXX-4829',
        disbursedDate: m.date,
        paymentDate: m.date,
        status: 'Paid',
        grossSalary: gross,
        pfDeduction: m.pf,
        lopDeduction: m.lop,
        otherDeductions: 200,
        netSalary: net,
        bankAccount: teacherStaffMember?.bankDetails?.accountNumber || 'XXXX-XXXX-4829',
        disbursedDate: m.date,
        paymentDate: m.date,
        status: 'Paid',
        earnings: [
          { name: 'Basic Pay', amount: m.basic },
          { name: 'House Rent Allowance (HRA)', amount: m.hra },
          { name: 'Dearness Allowance (DA)', amount: m.da },
        ],
        deductions: [
          { name: 'Provident Fund (PF)', amount: m.pf },
          { name: 'Professional Tax (PT)', amount: 200 },
          ...(m.lop > 0 ? [{ name: 'Loss of Pay (LOP)', amount: m.lop }] : [])
        ]
      };
    });

    // Combine existing and generated avoiding duplicate months
    const monthSet = new Set(existing.map(e => e.month));
    const finalPayslips = [...existing];
    generated.forEach(g => {
      if (!monthSet.has(g.month)) {
        finalPayslips.push(g);
      }
    });

    return finalPayslips;
  }, [payslips, teacherStaffMember, user]);

  // Filtered & Sorted payslips
  const sortedPayslips = useMemo(() => {
    const filtered = teacherPayslips.filter(p => {
      const monthMatch = p.month.toLowerCase().includes(searchQuery.toLowerCase());
      const yearMatch = selectedYear === 'All' || p.month.includes(selectedYear);
      return monthMatch && yearMatch;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.disbursedDate || a.month).getTime();
      const dateB = new Date(b.disbursedDate || b.month).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [teacherPayslips, searchQuery, selectedYear, sortOrder]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, sortOrder]);

  // Pagination Calculations
  const totalPages = Math.ceil(sortedPayslips.length / itemsPerPage) || 1;
  const paginatedPayslips = sortedPayslips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const latestPayslip = sortedPayslips[0];

  // Print/Download Payslip HTML helper
  const handleDownloadPayslip = (p: Payslip) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const earnings = p.earnings || [
      { name: 'Basic Pay', amount: p.basicSalary },
      { name: 'House Rent Allowance (HRA)', amount: p.hra },
      { name: 'Dearness Allowance (DA)', amount: p.da },
    ];

    const deductions = p.deductions || [
      { name: 'Provident Fund (PF)', amount: p.pfDeduction },
      { name: 'Professional Tax (PT)', amount: p.otherDeductions || 200 },
      ...(p.lopDeduction ? [{ name: 'Loss of Pay (LOP)', amount: p.lopDeduction }] : [])
    ];

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    const grossVal = p.grossSalary || (p.basicSalary + p.hra + p.da);
    const basicVal = p.basicSalary || Math.round(grossVal * 0.4);
    const hraVal = p.hra || Math.round(grossVal * 0.3);
    const conveyanceVal = (p as any).conveyance || 1600;
    const medicalVal = (p as any).medical || 1250;
    const othAllowVal = Math.max(0, grossVal - (basicVal + hraVal + conveyanceVal + medicalVal));
    const ptVal = p.otherDeductions || 200;
    const pfVal = p.pfDeduction || 1527;
    const esiVal = (p as any).esiDeduction || 0;
    const totalDeductionsVal = ptVal + pfVal + esiVal + (p.lopDeduction || 0);
    const netTakeHomeVal = grossVal - totalDeductionsVal;
    const employerPfVal = pfVal;
    const employerEsiVal = esiVal;
    const ctcVal = grossVal + employerPfVal + employerEsiVal;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${p.month} - ${p.employeeName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 4mm !important;
                height: auto !important;
                max-height: 100vh !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .payslip-sheet {
                max-height: 270mm !important;
                overflow: hidden !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
              }
              .no-print { display: none !important; }
            }
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 12px 16px; color: #0f172a; line-height: 1.2; font-size: 10px; }
            .payslip-sheet { max-height: 270mm; overflow: hidden; }
            .header-banner { text-align: center; border-bottom: 2px double #0284c7; padding-bottom: 4px; margin-bottom: 8px; }
            .school-title { font-size: 16px; font-weight: 900; color: #0369a1; letter-spacing: 0.5px; }
            .sub-logo { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 1px; }
            .doc-heading { font-size: 11px; font-weight: 800; background: #f0f9ff; display: inline-block; padding: 2px 10px; border-radius: 4px; border: 1px solid #bae6fd; color: #0369a1; margin-top: 4px; }
            .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px; margin-bottom: 8px; font-size: 10px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .emp-cell { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 1px; }
            .emp-label { color: #64748b; font-weight: 600; }
            .emp-val { font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
            th { background: #f1f5f9; padding: 4px 6px; text-align: left; font-weight: 700; color: #334155; border-bottom: 1.5px solid #cbd5e1; text-transform: uppercase; font-size: 9px; }
            td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; }
            .t-right { text-align: right; }
            .tot-row { font-weight: 800; background: #f8fafc; font-size: 10px; }
            .net-box { background: #ecfdf5; border: 1.5px solid #a7f3d0; padding: 6px; border-radius: 6px; text-align: center; margin-bottom: 10px; }
            .net-label { font-size: 9px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
            .net-val { font-size: 17px; font-weight: 900; color: #065f46; margin: 1px 0; }
            .sign-grid { display: flex; justify-content: space-between; margin-top: 16px; font-size: 10px; font-weight: 700; color: #475569; }
          </style>
        </head>
        <body>
          <div class="payslip-sheet">
            <div class="header-banner">
              ${schoolProfile?.logoUrl ? `<img src="${schoolProfile.logoUrl}" style="max-height: 48px; margin-bottom: 4px; object-fit: contain;" />` : ''}
              <div class="school-title">${(schoolProfile?.name || schoolProfile?.schoolName || 'PIRNAV EDUCATIONAL INSTITUTION').toUpperCase()}</div>
              <div class="sub-logo">Official Monthly Salary Slip</div>
              <div class="doc-heading">SALARY PAYSLIP - ${p.month.toUpperCase()}</div>
            </div>

            <div class="emp-grid">
              <div class="emp-cell"><span class="emp-label">Employee Name:</span><span class="emp-val">${p.employeeName}</span></div>
              <div class="emp-cell"><span class="emp-label">Employee ID:</span><span class="emp-val">${p.empId}</span></div>
              <div class="emp-cell"><span class="emp-label">Department:</span><span class="emp-val">${p.department || 'Academics'}</span></div>
              <div class="emp-cell"><span class="emp-label">Designation:</span><span class="emp-val">${p.designation || 'Teacher'}</span></div>
              <div class="emp-cell"><span class="emp-label">Branch/Campus:</span><span class="emp-val">${p.branch || 'Main Campus'}</span></div>
              <div class="emp-cell"><span class="emp-label">Disbursed Date:</span><span class="emp-val">${p.disbursedDate}</span></div>
              <div class="emp-cell"><span class="emp-label">Bank Account:</span><span class="emp-val">${p.bankAccount}</span></div>
              <div class="emp-cell"><span class="emp-label">Payment Status:</span><span class="emp-val" style="color: #16a34a;">CONFIRMED (PAID)</span></div>
            </div>

            <div style="text-align: center; font-weight: 800; font-size: 11px; text-decoration: underline; margin-bottom: 6px; letter-spacing: 0.5px;">
              MONTHLY SALARY BREAKDOWN STATEMENT
            </div>

            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #15803d; font-size: 10px; margin-bottom: 10px;">
              <thead>
                <tr style="background-color: #dcfce7; color: #14532d; font-weight: 800; border-bottom: 1.5px solid #15803d;">
                  <th style="padding: 4px 6px; border-right: 1px solid #86efac; width: 50px; text-align: center;">S. No.</th>
                  <th style="padding: 4px 6px; border-right: 1px solid #86efac; text-align: left;">Particulars / Component</th>
                  <th style="padding: 4px 6px; text-align: right;">Monthly Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="font-weight: 800; background: #f1f5f9;">
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center;">A</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0;" colspan="2">EARNINGS</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">1</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">Basic Pay</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${basicVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">2</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">House Rent Allowance (HRA)</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${hraVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">3</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">Conveyance Allowance</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${conveyanceVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">4</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">Medical Allowance</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${medicalVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">5</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">Other Allowances</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${othAllowVal.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #dcfce7; font-weight: 800; color: #14532d; border-top: 1.5px solid #15803d; border-bottom: 1.5px solid #15803d;">
                  <td style="padding: 3px 6px; border-right: 1px solid #86efac; text-align: center;"></td>
                  <td style="padding: 3px 6px; border-right: 1px solid #86efac;">GROSS EARNINGS</td>
                  <td style="padding: 3px 6px; text-align: right; font-family: monospace;">₹${grossVal.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 800; background: #f1f5f9; border-top: 1.5px solid #cbd5e1;">
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center;">B</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0;" colspan="2">DEDUCTIONS</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">1</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">Provident Fund (PF)</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color: #b91c1c;">-₹${pfVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc;">2</td>
                  <td style="padding: 3px 6px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">Professional Tax (PT)</td>
                  <td style="padding: 3px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color: #b91c1c;">-₹${ptVal.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #ffe4e6; font-weight: 800; color: #9f1239; border-top: 1.5px solid #fda4af; border-bottom: 1.5px solid #fda4af;">
                  <td style="padding: 3px 6px; border-right: 1px solid #fecdd3; text-align: center;"></td>
                  <td style="padding: 3px 6px; border-right: 1px solid #fecdd3;">TOTAL DEDUCTIONS</td>
                  <td style="padding: 3px 6px; text-align: right; font-family: monospace;">-₹${totalDeductionsVal.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #bbf7d0; font-weight: 900; color: #14532d; border-top: 2px solid #15803d; font-size: 11px;">
                  <td style="padding: 4px 6px; border-right: 1px solid #86efac; text-align: center;">C</td>
                  <td style="padding: 4px 6px; border-right: 1px solid #86efac;">NET TAKE-HOME SALARY (A - B)</td>
                  <td style="padding: 4px 6px; text-align: right; font-family: monospace;">₹${netTakeHomeVal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="net-box">
              <div class="net-label">NET TAKE-HOME SALARY DISBURSED</div>
              <div class="net-val">₹${p.netSalary.toLocaleString()}</div>
              <div style="font-size: 10px; color: #047857; font-weight: 600;">(Credited directly to Bank Account ${p.bankAccount})</div>
            </div>

            <div class="sign-grid">
              <div>__________________________________<br/>Employee Signature</div>
              <div>__________________________________<br/>Authorized Accounts / HR Officer</div>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const totalNetDisbursed = useMemo(() => {
    return sortedPayslips.reduce((sum, p) => sum + (p.netSalary || p.totalSalary || 45000), 0);
  }, [sortedPayslips]);

  return (
    <div className="space-y-4 animate-in fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-sky-600 dark:text-sky-400" /> My Payslips
          </h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="glass-card p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Available Statements</span>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{sortedPayslips.length} Payslips</p>
          </div>
        </div>

        <div className="glass-card p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Latest Statement</span>
            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {latestPayslip ? latestPayslip.month : 'N/A'}
            </p>
          </div>
        </div>

        <div className="glass-card p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center font-bold shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Total Net Salary Paid</span>
            <p className="text-lg sm:text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
              {formatCurrency(totalNetDisbursed)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by pay month..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer outline-none transition-all shadow-xs"
            >
              <option value="All">All Years</option>
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer outline-none transition-all shadow-xs"
            >
              <option value="desc">Sort: Latest Month First</option>
              <option value="asc">Sort: Oldest Month First</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 text-center">S.No.</th>
                <th className="py-2.5 px-3 text-center">Pay Month</th>
                <th className="py-2.5 px-3 text-center">Disbursed Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedPayslips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    No payslips found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedPayslips.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-center">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        {p.month}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 text-center">
                      {p.disbursedDate}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="success">Disbursed</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingPayslip(p)}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800 transition-colors cursor-pointer shadow-xs"
                          title="View Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(p)}
                          className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer"
                          title="Download PDF / Print"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedPayslips.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, sortedPayslips.length)}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{sortedPayslips.length}</span> payslips
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-all text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-all text-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW PAYSLIP MODAL PREVIEW */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                {schoolProfile?.logoUrl ? (
                  <img
                    src={schoolProfile.logoUrl}
                    alt={schoolProfile?.name || 'School Logo'}
                    className="w-10 h-10 object-contain rounded-2xl border border-slate-200 dark:border-slate-800 p-1 bg-white shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {schoolProfile?.name || schoolProfile?.schoolName || 'PIRNAV EDUCATIONAL INSTITUTION'}
                  </h3>
                  <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">Monthly Salary Statement ({viewingPayslip.month})</p>
                </div>
              </div>
              <button onClick={() => setViewingPayslip(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer">
                <XCircle className="w-5 h-5" />
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
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingPayslip.department || 'Academics'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Designation</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingPayslip.designation || 'Teacher'}</p>
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
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.branch || 'Main Campus'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Payment Status</span>
                <div className="mt-0.5"><Badge variant="success">Paid</Badge></div>
              </div>
            </div>

            {/* MONTHLY SALARY STATEMENT BREAKDOWN TABLE */}
            {(() => {
              const grossVal = viewingPayslip.grossSalary || (viewingPayslip.basicSalary + viewingPayslip.hra + viewingPayslip.da);
              const basicVal = viewingPayslip.basicSalary || Math.round(grossVal * 0.4);
              const hraVal = viewingPayslip.hra || Math.round(grossVal * 0.3);
              const conveyanceVal = (viewingPayslip as any).conveyance || 1600;
              const medicalVal = (viewingPayslip as any).medical || 1250;
              const othAllowVal = Math.max(0, grossVal - (basicVal + hraVal + conveyanceVal + medicalVal));
              const ptVal = viewingPayslip.otherDeductions || 200;
              const pfVal = viewingPayslip.pfDeduction || 2400;
              const esiVal = (viewingPayslip as any).esiDeduction || 0;
              const totalDeductionsVal = ptVal + pfVal + esiVal + (viewingPayslip.lopDeduction || 0);
              const netTakeHomeVal = grossVal - totalDeductionsVal;

              const formatNum = (num: number) => num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

              return (
                <div className="space-y-3">
                  <div className="text-center font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider underline">
                    MONTHLY SALARY BREAKDOWN STATEMENT
                  </div>

                  <div className="rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 border-b border-emerald-300 dark:border-emerald-800 font-extrabold text-[11px]">
                          <th className="py-2.5 px-3 border-r border-emerald-200 dark:border-emerald-800 w-14 text-center">S. No.</th>
                          <th className="py-2.5 px-3 border-r border-emerald-200 dark:border-emerald-800">Particulars / Component</th>
                          <th className="py-2.5 px-3 text-right">Monthly Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {/* Section A: Earnings */}
                        <tr className="font-bold bg-slate-50 dark:bg-slate-850">
                          <td className="py-2 px-3 border-r text-center font-bold text-slate-900 dark:text-white">A</td>
                          <td className="py-2 px-3 border-r font-extrabold" colSpan={2}>EARNINGS</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">1</td>
                          <td className="py-2 px-3 border-r font-medium">Basic Pay</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">₹{formatNum(basicVal)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">2</td>
                          <td className="py-2 px-3 border-r font-medium">House Rent Allowance (HRA)</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">₹{formatNum(hraVal)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">3</td>
                          <td className="py-2 px-3 border-r font-medium">Conveyance Allowance</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">₹{formatNum(conveyanceVal)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">4</td>
                          <td className="py-2 px-3 border-r font-medium">Medical Allowance</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">₹{formatNum(medicalVal)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">5</td>
                          <td className="py-2 px-3 border-r font-medium">Other Allowances</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">₹{formatNum(othAllowVal)}</td>
                        </tr>
                        {/* Gross Earnings (Green Highlight) */}
                        <tr className="bg-emerald-100/90 dark:bg-emerald-950/70 font-black text-emerald-950 dark:text-emerald-100 border-t-2 border-emerald-300">
                          <td className="py-2.5 px-3 border-r border-emerald-200 text-center"></td>
                          <td className="py-2.5 px-3 border-r border-emerald-200">GROSS EARNINGS</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-300">₹{formatNum(grossVal)}</td>
                        </tr>

                        {/* Section B: Deductions */}
                        <tr className="font-bold bg-slate-50 dark:bg-slate-850 border-t-2 border-slate-300 dark:border-slate-700">
                          <td className="py-2 px-3 border-r text-center font-bold text-slate-900 dark:text-white">B</td>
                          <td className="py-2 px-3 border-r font-extrabold" colSpan={2}>DEDUCTIONS</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">1</td>
                          <td className="py-2 px-3 border-r font-medium">Provident Fund (PF)</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{formatNum(pfVal)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">2</td>
                          <td className="py-2 px-3 border-r font-medium">Professional Tax (PT)</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{formatNum(ptVal)}</td>
                        </tr>
                        {esiVal > 0 && (
                          <tr>
                            <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">3</td>
                            <td className="py-2 px-3 border-r font-medium">ESI Deduction</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{formatNum(esiVal)}</td>
                          </tr>
                        )}
                        {viewingPayslip.lopDeduction ? (
                          <tr>
                            <td className="py-2 px-3 border-r text-center bg-slate-50/60 dark:bg-slate-900/60">4</td>
                            <td className="py-2 px-3 border-r font-medium">Loss of Pay (LOP)</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{formatNum(viewingPayslip.lopDeduction)}</td>
                          </tr>
                        ) : null}
                        {/* Total Deductions (Rose Highlight) */}
                        <tr className="bg-rose-50/90 dark:bg-rose-950/70 font-black text-rose-950 dark:text-rose-100 border-t-2 border-rose-300">
                          <td className="py-2.5 px-3 border-r border-rose-200 text-center"></td>
                          <td className="py-2.5 px-3 border-r border-rose-200">TOTAL DEDUCTIONS</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-700 dark:text-rose-300">-₹{formatNum(totalDeductionsVal)}</td>
                        </tr>

                        {/* Section C: Net Take Home Salary (Green Highlight) */}
                        <tr className="bg-emerald-200/90 dark:bg-emerald-900/80 font-black text-emerald-950 dark:text-emerald-50 border-t-2 border-emerald-400 text-sm">
                          <td className="py-3 px-3 border-r border-emerald-300 text-center font-bold">C</td>
                          <td className="py-3 px-3 border-r border-emerald-300">NET TAKE-HOME SALARY (A - B)</td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-200">₹{formatNum(netTakeHomeVal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Net Salary Summary Callout & Download Button */}
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
  );
};
