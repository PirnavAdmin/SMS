// @ts-nocheck
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
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import { numberToWords } from '../../../utils/numberToWords';

export const formatPayMonth = (monthLabel?: string): string => {
  if (!monthLabel) return 'N/A';
  const ym = monthLabel.match(/\b(19|20\d\d)\b/g);
  const year = ym ? ym[0] : '';
  const monthName = monthLabel.replace(/\b(19|20\d\d)\b/g, '').trim();
  if (monthName && year) return `${monthName} ${year}`;
  return monthName || year || 'N/A';
};

export const TeacherPayslipsView: React.FC = () => {
  const { user } = useAuth();
  const { staff, payslips, schoolProfile, fetchPayslips } = useData();

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

  const isWarden = (user?.role || '').toLowerCase().includes('warden');
  const isDriver = (user?.role || '').toLowerCase() === 'driver';
  const isAccountant = (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance';

  const teacherStaffMember = useMemo(() => {
    const uEmail = user?.email?.toLowerCase().trim();
    const uName = user?.name?.toLowerCase().trim();
    const uRole = (user?.role || '').toLowerCase();
    const uId = (user?.id || (user as any)?.empId || '').trim().toLowerCase();

    // 1. Direct match on email in staff list
    if (uEmail) {
      const byEmail = staff.find(s => s.email && s.email.toLowerCase().trim() === uEmail);
      if (byEmail) {
        const isGenericAdmin = (byEmail.firstName || '').toLowerCase().includes('administrator') || (byEmail.firstName || '').toLowerCase().includes('admin');
        const userFirst = uName ? uName.split(' ')[0] : '';
        const userLast = uName ? uName.split(' ').slice(1).join(' ') : '';
        
        return {
          ...byEmail,
          firstName: (isGenericAdmin && userFirst) ? userFirst : (isAccountant ? (userFirst || 'Sardhar') : (byEmail.firstName || userFirst || 'Faculty')),
          lastName: (isGenericAdmin && userLast) ? userLast : (isAccountant ? (userLast || 'Karthi') : (byEmail.lastName || userLast || 'Member')),
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byEmail.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : (byEmail.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byEmail.role || 'Teacher'),
          empId: (isGenericAdmin || byEmail.empId === '358' || byEmail.id === '358') ? (user?.id || (user as any)?.empId || (isAccountant ? 'ACT-101' : isWarden ? 'WRD-102' : 'STF-001')) : (byEmail.empId || byEmail.employeeId || byEmail.id || 'STF-001')
        };
      }
    }

    // 2. Direct match on ID or Employee ID
    if (uId) {
      const byId = staff.find(s =>
        (s.id && String(s.id).toLowerCase().trim() === uId) ||
        (s.empId && String(s.empId).toLowerCase().trim() === uId) ||
        (s.employeeId && String(s.employeeId).toLowerCase().trim() === uId)
      );
      if (byId) {
        return {
          ...byId,
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byId.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : (byId.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byId.role || 'Teacher'),
          empId: isAccountant ? (user?.id || (user as any)?.empId || 'ACT-101') : (byId.empId || byId.id)
        };
      }
    }

    // 3. Match on user full name if available and not generic admin
    if (uName && !uName.includes('admin')) {
      const byName = staff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        return sFullName === uName || sName === uName;
      });
      if (byName) {
        return {
          ...byName,
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byName.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : (byName.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byName.role || 'Teacher')
        };
      }
    }

    // 4. Role specific search for Driver
    if (uRole === 'driver') {
      const driverStaff = staff.find(s =>
        (s.designation || '').toLowerCase().includes('driver') ||
        (s.department || '').toLowerCase().includes('transport')
      );
      if (driverStaff) return driverStaff;
    }

    // 5. Role specific search for Warden
    if (isWarden) {
      const wardenStaff = staff.find(s =>
        (s.designation || '').toLowerCase().includes('warden') ||
        (s.role || '').toLowerCase().includes('warden') ||
        (s.department || '').toLowerCase().includes('hostel')
      );
      if (wardenStaff) return wardenStaff;
    }

    // 6. Role specific search for Accountant
    if (isAccountant) {
      const accountantStaff = staff.find(s =>
        (s.designation || '').toLowerCase().includes('accountant') ||
        (s.role || '').toLowerCase().includes('accountant') ||
        (s.department || '').toLowerCase().includes('finance')
      );
      if (accountantStaff) {
        const userFirst = uName ? uName.split(' ')[0] : '';
        const userLast = uName ? uName.split(' ').slice(1).join(' ') : '';
        return {
          ...accountantStaff,
          firstName: userFirst || accountantStaff.firstName || 'Sardhar',
          lastName: userLast || accountantStaff.lastName || 'Karthi',
          designation: 'Accountant',
          department: 'Finance & Accounts',
          role: 'Accountant',
          empId: user?.id || (user as any)?.empId || accountantStaff.empId || 'ACT-101'
        };
      }
    }

    // 7. Role specific search for Teacher (ONLY if role is teacher)
    if (uRole === 'teacher') {
      const teachingStaff = staff.filter(s => {
        const des = (s.designation || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        const cat = (s.employeeCategory || '').toLowerCase();
        return !dept.includes('transport') && !des.includes('driver') && !des.includes('attendant') && !cat.includes('non-teaching');
      });

      const teacherMatch = teachingStaff.find(s => s.role === 'Teacher' || s.employeeCategory === 'Teacher');
      if (teacherMatch) return teacherMatch;
    }

    // 8. Dynamic staff object fallback for logged in user (DO NOT default to random teacher like Srinivas Rao)
    const rawName = user?.name || (isWarden ? (user?.name || user?.firstName || 'Hostel Warden') : isAccountant ? 'Sardhar Karthi' : 'Faculty Member');
    const nameParts = rawName.split(' ');
    return {
      id: user?.id || (user as any)?.empId || (isWarden ? 'WRD-102' : isAccountant ? 'ACT-101' : 'STF-001'),
      empId: (user as any)?.empId || user?.id || (isWarden ? 'WRD-102' : isAccountant ? 'ACT-101' : 'STF-001'),
      firstName: nameParts[0] || (isAccountant ? 'Sardhar' : 'Faculty'),
      lastName: nameParts.slice(1).join(' ') || (isAccountant ? 'Karthi' : 'Member'),
      email: user?.email || (isWarden ? 'warden@pirnavschools.edu' : isAccountant ? 'accountant@pirnavschools.edu' : 'faculty@pirnavschools.edu'),
      phone: user?.phone || '+91 9878645565',
      department: isWarden ? 'Hostel Management' : isAccountant ? 'Finance & Accounts' : ((user as any)?.department || 'Academics'),
      designation: isWarden ? 'Hostel Warden' : isAccountant ? 'Accountant' : ((user as any)?.designation || 'Teacher'),
      role: isWarden ? 'Hostel Warden' : isAccountant ? 'Accountant' : 'Teacher',
      branch: user?.branch || '',
      bankDetails: { accountNumber: 'XXXX-XXXX-4829' }
    };
  }, [staff, user, isWarden, isAccountant]);

  // Retrieve only real, dynamically generated payslips for the staff member
  const teacherPayslips: Payslip[] = useMemo(() => {
    const staffName = teacherStaffMember
      ? `${teacherStaffMember.firstName || ''} ${teacherStaffMember.lastName || ''}`.trim()
      : (user?.name || '').trim();
    const empIdCode = teacherStaffMember?.empId || teacherStaffMember?.id || (user as any)?.empId || user?.id || '';
    const staffFullName = staffName.toLowerCase().trim();
    const staffId = teacherStaffMember?.id ? String(teacherStaffMember.id).toLowerCase().trim() : '';
    const userId = user?.id ? String(user.id).toLowerCase().trim() : '';
    const staffEmail = (teacherStaffMember?.email || user?.email || '').toLowerCase().trim();

    return (payslips || []).filter(p => {
      if (!p) return false;
      const pEmpId = String(p.empId || '').toLowerCase().trim();
      const pEmployeeId = String(p.employeeId || '').toLowerCase().trim();
      const pName = String(p.employeeName || '').toLowerCase().trim();
      const pEmail = String((p as any).email || '').toLowerCase().trim();

      // Check ID match
      if (staffId && (pEmployeeId === staffId || pEmpId === staffId)) return true;
      if (userId && (pEmployeeId === userId || pEmpId === userId)) return true;
      if (empIdCode && (pEmpId === String(empIdCode).toLowerCase().trim() || pEmployeeId === String(empIdCode).toLowerCase().trim())) return true;

<<<<<<< HEAD
    const generated: Payslip[] = pastMonths.map((m, idx) => {
      const gross = m.basic + m.hra + m.da;
      const totalDeductions = m.pf + m.lop + 200; // 200 Professional Tax
      const net = gross - totalDeductions;
      return {
        id: `PS-TCH-${1000 + idx}`,
        employeeId: teacherStaffMember?.id || empIdCode,
        employeeName: staffName,
        empId: empIdCode,
        branch: (teacherStaffMember as any)?.branch || user?.branch || '',
        department: dept,
        designation: desig,
        employeeCategory: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : 'Teacher',
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
=======
      // Check Email match
      if (staffEmail && pEmail && pEmail === staffEmail) return true;
>>>>>>> 2c7d0190f1106e317e9965ae947dc2f54d4d3f76

      // Check Full Name match
      if (staffFullName && !staffFullName.includes('admin') && pName === staffFullName) return true;

      return false;
    }).map(p => ({
      ...p,
      month: formatPayMonth(p.month)
    }));
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

    const earningsRows: { name: string; amount: number }[] = [];
    if (Array.isArray(p.earnings) && p.earnings.length > 0) {
      p.earnings.forEach(e => {
        if (Number(e.amount) > 0) {
          earningsRows.push({ name: e.name, amount: Number(e.amount) });
        }
      });
    } else {
      if (Number(p.basicSalary) > 0) earningsRows.push({ name: 'Basic Salary', amount: Number(p.basicSalary) });
      if (Number(p.hra) > 0) earningsRows.push({ name: 'House Rent Allowance (HRA)', amount: Number(p.hra) });
      if (Number(p.da) > 0) earningsRows.push({ name: 'Dearness Allowance (DA)', amount: Number(p.da) });
      if (Number((p as any).conveyance) > 0) earningsRows.push({ name: 'Conveyance Allowance', amount: Number((p as any).conveyance) });
      if (Number((p as any).medical) > 0) earningsRows.push({ name: 'Medical Allowance', amount: Number((p as any).medical) });
      const currentEarnSum = earningsRows.reduce((sum, item) => sum + item.amount, 0);
      if (Number(p.grossSalary) > currentEarnSum) {
        earningsRows.push({ name: 'Other Allowances', amount: Number(p.grossSalary) - currentEarnSum });
      }
    }

    const deductionsRows: { name: string; amount: number }[] = [];
    if (Array.isArray(p.deductions) && p.deductions.length > 0) {
      p.deductions.forEach(d => {
        if (Number(d.amount) > 0) {
          deductionsRows.push({ name: d.name, amount: Number(d.amount) });
        }
      });
    } else {
      if (Number(p.pfDeduction) > 0) deductionsRows.push({ name: 'Provident Fund (PF)', amount: Number(p.pfDeduction) });
      if (Number(p.otherDeductions) > 0) deductionsRows.push({ name: 'Professional Tax / Deductions', amount: Number(p.otherDeductions) });
      if (Number(p.lopDeduction) > 0) deductionsRows.push({ name: 'Loss of Pay (LOP)', amount: Number(p.lopDeduction) });
      if (Number(p.leaveDeduction) > 0 && !p.lopDeduction) deductionsRows.push({ name: 'Leave Deduction', amount: Number(p.leaveDeduction) });
    }

    const grossVal = Number(p.grossSalary) || earningsRows.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductionsVal = deductionsRows.length > 0
      ? deductionsRows.reduce((sum, d) => sum + d.amount, 0)
      : (Number(p.otherDeductions) || 0);
    const netTakeHomeVal = Number(p.netSalary) || Math.max(0, grossVal - totalDeductionsVal);

    const formatNum = (num: number) => isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const inWords = numberToWords(netTakeHomeVal);

    const maxRows = Math.max(earningsRows.length, deductionsRows.length, 1);

    const rowsHtml = Array.from({ length: maxRows }).map((_, i) => {
      const e = earningsRows[i];
      const d = deductionsRows[i];
      return `
        <tr>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${e ? e.name : ''}</td>
          <td style="padding: 5px 8px; border-right: 2px solid #94a3b8; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Consolas', monospace; font-weight: 600;">${e ? `₹${formatNum(e.amount)}` : ''}</td>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${d ? d.name : ''}</td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; color: ${d ? '#b91c1c' : 'inherit'};">${d ? `₹${formatNum(d.amount)}` : ''}</td>
        </tr>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Payslip - ${formatPayMonth(p.month)} - ${p.employeeName}</title>
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
                <div class="school-name">${(schoolProfile?.name || schoolProfile?.schoolName || 'PIRNAV EDUCATIONAL INSTITUTIONS').toUpperCase()}</div>
                <div class="school-sub">
                  ${schoolProfile?.address || 'Madhapur Campus, Hyderabad, Telangana - 500081'}<br/>
                  Affiliated to CBSE, New Delhi | Affiliation No. 3630284 | Phone: ${schoolProfile?.phone || '+91 40 2345 6789'}
                </div>
              </div>
              <div style="width: 70px; text-align: right;">
                <span style="font-size: 9px; font-weight: 800; color: #16a34a; background: #dcfce7; border: 1px solid #86efac; padding: 2px 6px; border-radius: 3px;">PAID</span>
              </div>
            </div>

<<<<<<< HEAD
            <div class="emp-grid">
              <div class="emp-cell"><span class="emp-label">Employee Name:</span><span class="emp-val">${p.employeeName}</span></div>
              <div class="emp-cell"><span class="emp-label">Employee ID:</span><span class="emp-val">${p.empId}</span></div>
              <div class="emp-cell"><span class="emp-label">Department:</span><span class="emp-val">${p.department || 'Academics'}</span></div>
              <div class="emp-cell"><span class="emp-label">Designation:</span><span class="emp-val">${p.designation || 'Teacher'}</span></div>
              <div class="emp-cell"><span class="emp-label">Branch/Campus:</span><span class="emp-val">${p.branch || '—'}</span></div>
              <div class="emp-cell"><span class="emp-label">Disbursed Date:</span><span class="emp-val">${p.disbursedDate}</span></div>
              <div class="emp-cell"><span class="emp-label">Bank Account:</span><span class="emp-val">${p.bankAccount}</span></div>
              <div class="emp-cell"><span class="emp-label">Payment Status:</span><span class="emp-val" style="color: #16a34a;">CONFIRMED (PAID)</span></div>
=======
            <div class="doc-title-bar">
              <span>SALARY PAYSLIP FOR THE MONTH OF ${formatPayMonth(p.month).toUpperCase()}</span>
              <span style="font-size: 9.5px; font-weight: 600; opacity: 0.9;">Ref: PS-${p.empId || 'EMP'}-${formatPayMonth(p.month).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</span>
>>>>>>> 2c7d0190f1106e317e9965ae947dc2f54d4d3f76
            </div>

            <table class="emp-table">
              <tr>
                <td class="lbl">Employee ID</td>
                <td class="val" style="font-family: monospace; font-weight: 700;">${p.empId}</td>
                <td class="lbl">Employee Name</td>
                <td class="val">${p.employeeName}</td>
              </tr>
              <tr>
                <td class="lbl">Designation</td>
                <td class="val">${p.designation || 'Teacher'}</td>
                <td class="lbl">Department</td>
                <td class="val">${p.department || 'Academics'}</td>
              </tr>
              <tr>
                <td class="lbl">Campus / Branch</td>
                <td class="val">${p.branch || 'Main Campus'}</td>
                <td class="lbl">Disbursed Date</td>
                <td class="val">${p.disbursedDate || new Date().toISOString().split('T')[0]}</td>
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
                ${rowsHtml}
                <tr class="tot-row">
                  <td><strong>TOTAL GROSS EARNINGS (A)</strong></td>
                  <td class="amount divider-col"><strong>₹${formatNum(grossVal)}</strong></td>
                  <td><strong>TOTAL DEDUCTIONS (B)</strong></td>
                  <td class="amount" style="color: #b91c1c;"><strong>₹${formatNum(totalDeductionsVal)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="net-summary-box">
              <div class="net-main">
                <div>
                  <div class="net-title">NET TAKE-HOME SALARY PAYABLE (A - B)</div>
                  <div class="net-meta">Payment Mode: Direct Bank Transfer (NEFT/RTGS) &bull; Credit Account: ${p.bankAccount}</div>
                </div>
                <div class="net-amount">₹${formatNum(netTakeHomeVal)}</div>
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
              This is a computer-generated official payslip issued by ${(schoolProfile?.name || schoolProfile?.schoolName || 'Pirnav Educational Institutions')}. Does not require an ink signature.
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    teacherPayslips.forEach(p => {
      const match = (p.month || p.disbursedDate || '').match(/\b(20\d\d)\b/);
      if (match) years.add(match[1]);
    });
    if (years.size === 0) {
      years.add(String(new Date().getFullYear()));
    }
    return Array.from(years).sort().reverse();
  }, [teacherPayslips]);

  const totalNetDisbursed = useMemo(() => {
    return sortedPayslips.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0);
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
              {latestPayslip ? formatPayMonth(latestPayslip.month) : 'N/A'}
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
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Year {yr}</option>
              ))}
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
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || selectedYear !== 'All'
                          ? 'No payslips found matching your search filter.'
                          : 'No payslips generated yet.'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery || selectedYear !== 'All'
                          ? 'Try adjusting your search query or selecting a different year.'
                          : 'Official monthly payslips generated by the administration or accounts department will appear here automatically.'}
                      </p>
                    </div>
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
                        {formatPayMonth(p.month)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl space-y-4 overflow-y-auto max-h-[92vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                {schoolProfile?.logoUrl ? (
                  <img
                    src={resolveMediaUrl(schoolProfile.logoUrl)}
                    alt={schoolProfile?.name || 'School Logo'}
                    className="w-12 h-12 object-contain rounded-2xl border border-slate-200 dark:border-slate-700 p-1 bg-white shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    <GraduationCap className="w-6 h-6 text-brand-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {schoolProfile?.name || schoolProfile?.schoolName || 'PIRNAV EDUCATIONAL INSTITUTIONS'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      Salary Payslip &bull; {formatPayMonth(viewingPayslip.month)}
                    </span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      PAID
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setViewingPayslip(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Info Card (4 Columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Employee ID</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.empId}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Employee Name</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.employeeName}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Designation</span>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{viewingPayslip.designation || 'Teacher'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Department</span>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{viewingPayslip.department || 'Academics'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Campus / Branch</span>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{viewingPayslip.branch || 'Main Campus'}</p>
              </div>
              <div>
<<<<<<< HEAD
                <span className="text-[10px] uppercase font-bold text-slate-400">Branch</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.branch || '—'}</p>
=======
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Disbursed Date</span>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{viewingPayslip.disbursedDate || new Date().toISOString().split('T')[0]}</p>
>>>>>>> 2c7d0190f1106e317e9965ae947dc2f54d4d3f76
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Bank Account</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{viewingPayslip.bankAccount ? `A/C: ${viewingPayslip.bankAccount}` : 'Bank Deposit'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Payment Status</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">CONFIRMED (PAID)</p>
              </div>
            </div>

            {/* MONTHLY SALARY STATEMENT BREAKDOWN (SIDE-BY-SIDE REALTIME TABLE) */}
            {(() => {
              const earningsRows: { name: string; amount: number }[] = [];
              if (Array.isArray(viewingPayslip.earnings) && viewingPayslip.earnings.length > 0) {
                viewingPayslip.earnings.forEach(e => {
                  if (Number(e.amount) > 0) {
                    earningsRows.push({ name: e.name, amount: Number(e.amount) });
                  }
                });
              } else {
                if (Number(viewingPayslip.basicSalary) > 0) earningsRows.push({ name: 'Basic Salary', amount: Number(viewingPayslip.basicSalary) });
                if (Number(viewingPayslip.hra) > 0) earningsRows.push({ name: 'House Rent Allowance (HRA)', amount: Number(viewingPayslip.hra) });
                if (Number(viewingPayslip.da) > 0) earningsRows.push({ name: 'Dearness Allowance (DA)', amount: Number(viewingPayslip.da) });
                if (Number((viewingPayslip as any).conveyance) > 0) earningsRows.push({ name: 'Conveyance Allowance', amount: Number((viewingPayslip as any).conveyance) });
                if (Number((viewingPayslip as any).medical) > 0) earningsRows.push({ name: 'Medical Allowance', amount: Number((viewingPayslip as any).medical) });
                const currentEarnSum = earningsRows.reduce((sum, item) => sum + item.amount, 0);
                if (Number(viewingPayslip.grossSalary) > currentEarnSum) {
                  earningsRows.push({ name: 'Other Allowances', amount: Number(viewingPayslip.grossSalary) - currentEarnSum });
                }
              }

              const deductionsRows: { name: string; amount: number }[] = [];
              if (Array.isArray(viewingPayslip.deductions) && viewingPayslip.deductions.length > 0) {
                viewingPayslip.deductions.forEach(d => {
                  if (Number(d.amount) > 0) {
                    deductionsRows.push({ name: d.name, amount: Number(d.amount) });
                  }
                });
              } else {
                if (Number(viewingPayslip.pfDeduction) > 0) deductionsRows.push({ name: 'Provident Fund (PF)', amount: Number(viewingPayslip.pfDeduction) });
                if (Number(viewingPayslip.otherDeductions) > 0) deductionsRows.push({ name: 'Professional Tax / Deductions', amount: Number(viewingPayslip.otherDeductions) });
                if (Number(viewingPayslip.lopDeduction) > 0) deductionsRows.push({ name: 'Loss of Pay (LOP)', amount: Number(viewingPayslip.lopDeduction) });
                if (Number(viewingPayslip.leaveDeduction) > 0 && !viewingPayslip.lopDeduction) deductionsRows.push({ name: 'Leave Deduction', amount: Number(viewingPayslip.leaveDeduction) });
              }

              const grossVal = Number(viewingPayslip.grossSalary) || earningsRows.reduce((sum, e) => sum + e.amount, 0);
              const totalDeductionsVal = deductionsRows.length > 0
                ? deductionsRows.reduce((sum, d) => sum + d.amount, 0)
                : (Number(viewingPayslip.otherDeductions) || 0);
              const netTakeHomeVal = Number(viewingPayslip.netSalary) || Math.max(0, grossVal - totalDeductionsVal);

              const formatNum = (num: number) => isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const inWords = numberToWords(netTakeHomeVal);

              const maxRows = Math.max(earningsRows.length, deductionsRows.length, 1);

              return (
                <div className="space-y-3">
                  <div className="text-center font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    MONTHLY SALARY BREAKDOWN (SIDE-BY-SIDE)
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white dark:bg-slate-800 text-[11px] font-extrabold uppercase tracking-wider">
                          <th colSpan={2} className="py-2.5 px-4 border-r border-slate-700">
                            EARNINGS
                          </th>
                          <th colSpan={2} className="py-2.5 px-4">
                            DEDUCTIONS
                          </th>
                        </tr>
                        <tr className="bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 px-4 w-[35%]">Particulars / Component</th>
                          <th className="py-2 px-4 text-right w-[15%] border-r border-slate-200 dark:border-slate-700">Monthly Amount (₹)</th>
                          <th className="py-2 px-4 w-[35%]">Particulars / Component</th>
                          <th className="py-2 px-4 text-right w-[15%]">Monthly Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200 text-xs">
                        {Array.from({ length: maxRows }).map((_, i) => {
                          const e = earningsRows[i];
                          const d = deductionsRows[i];
                          return (
                            <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{e ? e.name : ''}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                                {e ? `₹${formatNum(e.amount)}` : ''}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{d ? d.name : ''}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                                {d ? `-₹${formatNum(d.amount)}` : ''}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Summary Total Row */}
                        <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                          <td className="py-2.5 px-4 font-black">TOTAL GROSS EARNINGS (A)</td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                            ₹{formatNum(grossVal)}
                          </td>
                          <td className="py-2.5 px-4 font-black">TOTAL DEDUCTIONS (B)</td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                            -₹{formatNum(totalDeductionsVal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Salary Executive Summary Card */}
                  <div className="p-4 bg-slate-900 text-white dark:bg-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-800 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          NET TAKE-HOME SALARY PAYABLE (A - B)
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          DISBURSED
                        </span>
                      </div>
                      <p className="text-2xl font-black text-white mt-1">₹{formatNum(netTakeHomeVal)}</p>
                      <p className="text-[11px] text-slate-300 font-medium mt-1">
                        Amount in Words: <strong className="text-white font-bold">Rupees {inWords}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Credited directly to Bank Account: <span className="font-mono text-slate-200 font-semibold">{viewingPayslip.bankAccount}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDownloadPayslip(viewingPayslip)}
                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-4 h-4" /> Download PDF / Print
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewingPayslip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
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
