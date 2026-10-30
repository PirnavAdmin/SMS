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
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Payslip } from '../../../types';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import { numberToWords } from '../../../utils/numberToWords';
import { printPayslip, downloadPayslipPdf } from '../../../utils/payslipTemplate';
import { PayslipModal } from './PayslipModal';

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
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isDriver ? 'Driver' : (byEmail.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : isDriver ? 'Transport' : (byEmail.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isDriver ? 'Driver' : (byEmail.role || 'Teacher'),
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
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isDriver ? 'Driver' : (byId.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : isDriver ? 'Transport' : (byId.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isDriver ? 'Driver' : (byId.role || 'Teacher'),
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
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isDriver ? 'Driver' : (byName.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : isDriver ? 'Transport' : (byName.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isDriver ? 'Driver' : (byName.role || 'Teacher')
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

      // Check Email match
      if (staffEmail && pEmail && pEmail === staffEmail) return true;

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

  // Download Payslip PDF helper
  const handleDownloadPayslip = (p: Payslip) => {
    downloadPayslipPdf(p, teacherStaffMember, schoolProfile);
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
        <PayslipModal
          payslip={viewingPayslip}
          staffMember={teacherStaffMember}
          onClose={() => setViewingPayslip(null)}
        />
      )}    </div>
  );
};
