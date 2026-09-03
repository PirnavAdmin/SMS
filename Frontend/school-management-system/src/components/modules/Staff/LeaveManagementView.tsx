import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  FileText, Plus, Edit, Trash2, Eye, Printer, Calendar, CheckCircle, XCircle, Search, Filter, X,
  User, Layers, HelpCircle, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, ChevronDown, GraduationCap
} from 'lucide-react';
import { LeaveApplication, LeaveType, Holiday, Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'LT-001', name: 'Casual Leave', code: 'CL', maxDays: 10, isPaid: true, description: 'Annual casual leave for personal matters', requiresDocument: false },
  { id: 'LT-002', name: 'Sick Leave', code: 'SL', maxDays: 10, isPaid: true, description: 'Medical and health leave', requiresDocument: true },
  { id: 'LT-003', name: 'Paid / Earned Leave', code: 'PL', maxDays: 15, isPaid: true, description: 'Earned paid annual leave', requiresDocument: false },
  { id: 'LT-004', name: 'On Duty Leave', code: 'OD', maxDays: 12, isPaid: true, description: 'Official school duty, exam, seminar, or workshop', requiresDocument: false },
  { id: 'LT-005', name: 'Maternity / Paternity Leave', code: 'ML', maxDays: 90, isPaid: true, description: 'Parental leave', requiresDocument: true },
  { id: 'LT-006', name: 'Loss of Pay (Unpaid)', code: 'LOP', maxDays: 30, isPaid: false, description: 'Unpaid leave beyond entitlement', requiresDocument: false }
];

export const LeaveManagementView: React.FC = () => {
  const {
    staff,
    leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType,
    leaveApplications, addLeaveApplication, updateLeaveApplication, deleteLeaveApplication, updateLeaveApplicationStatus,
    holidays, addHoliday, updateHoliday, deleteHoliday,
    fetchLeaveTypes, fetchLeaveApplications, fetchLeaveBalances
  } = useData();

  useEffect(() => {
    if (fetchLeaveTypes) fetchLeaveTypes();
    if (fetchLeaveApplications) fetchLeaveApplications();
    if (fetchLeaveBalances) fetchLeaveBalances();
  }, []);

  const activeLeaveTypes = (Array.isArray(leaveTypes) && leaveTypes.length > 0) ? leaveTypes : DEFAULT_LEAVE_TYPES;

  const { user, role } = useAuth();
  const { addToast } = useToast();

  const userRole = (role || user?.role || '').toLowerCase();
  const isTeacher = userRole === 'teacher';
  const isDriver = userRole === 'driver';
  const isSelfServiceStaff = isTeacher || isDriver;
  const hasApprovalPermission = ['admin', 'principal', 'hr'].includes(userRole);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'applications' | 'types' | 'balance' | 'queue' | 'holidays'>(
    hasApprovalPermission ? 'queue' : 'applications'
  );

  // Filter staff to teaching staff ONLY (exclude drivers, peons, conductors) for teachers
  const teachingStaff = staff.filter(s => {
    const des = (s.designation || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();
    const cat = (s.employeeCategory || '').toLowerCase();
    return !dept.includes('transport') && !des.includes('driver') && !des.includes('attendant') && !cat.includes('non-teaching');
  });

  const teacherStaffMember = teachingStaff.find(s => 
    (s.email && user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    (s.phone && user?.phone && s.phone === user.phone) ||
    (s.firstName && user?.name && s.firstName.toLowerCase() === user.name.split(' ')[0]?.toLowerCase())
  ) || teachingStaff.find(s => s.role === 'Teacher' || s.employeeCategory === 'Teacher') || teachingStaff[0] || staff[0];

  const driverStaffMember = useMemo(() => {
    const uEmail = user?.email?.toLowerCase().trim();
    const uName = user?.name?.toLowerCase().trim();
    const uId = user?.id ? String(user.id).trim() : '';
    const uEmpId = (user as any)?.empId ? String((user as any).empId).trim() : '';

    const matched = staff.find(s =>
      (uId && (String(s.id) === uId || String(s.empId) === uId)) ||
      (uEmpId && (String(s.id) === uEmpId || String(s.empId) === uEmpId)) ||
      (uEmail && s.email && s.email.toLowerCase().trim() === uEmail) ||
      (uName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === uName) ||
      (uName && s.firstName && s.firstName.toLowerCase() === uName.split(' ')[0])
    );
    if (matched) return matched;

    const fromDriverDesignation = staff.find(s =>
      (s.designation || '').toLowerCase().includes('driver') ||
      (s.department || '').toLowerCase().includes('transport')
    );
    if (fromDriverDesignation) return fromDriverDesignation;

    const parts = (user?.name || 'Nag Sahoo').trim().split(' ');
    return {
      id: user?.id || '3',
      firstName: parts[0] || 'Nag',
      lastName: parts.slice(1).join(' ') || 'Sahoo',
      department: 'Transport Dept',
      designation: 'Driver',
      employeeCategory: 'Non-Teaching Staff',
      empId: (user as any)?.empId || user?.id || 'STF-2026-0003',
      leaveBalance: { casual: 10, sick: 10, paid: 15 }
    } as any;
  }, [staff, user]);

  // Filter applications for current user if teacher or driver
  const myApplications = leaveApplications.filter(a => {
    if (!isSelfServiceStaff) return true;
    if (isDriver) {
      if (driverStaffMember && (a.employeeId === driverStaffMember.id || a.empId === driverStaffMember.empId)) return true;
      if (user?.name && a.employeeName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) return true;
      if (user?.id && (String(a.employeeId) === String(user.id) || String(a.empId) === String(user.id))) return true;
      if (a.designation?.toLowerCase().includes('driver') || a.department?.toLowerCase().includes('transport')) return true;
      return false;
    }
    if (teacherStaffMember && (a.employeeId === teacherStaffMember.id || a.empId === teacherStaffMember.empId)) return true;
    if (user?.name && a.employeeName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) return true;
    if (user?.id && (String(a.employeeId) === String(user.id) || String(a.empId) === String(user.id))) return true;
    return false;
  });

  // Filter States
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [balanceCategoryFilter, setBalanceCategoryFilter] = useState<'All' | 'Teaching Staff' | 'Non-Teaching Staff'>('All');
  const [balanceCurrentPage, setBalanceCurrentPage] = useState(1);
  const balancePageSize = 8;

  useEffect(() => {
    setBalanceCurrentPage(1);
  }, [query, balanceCategoryFilter]);

  const filteredStaffForBalance = useMemo(() => {
    if (isDriver) {
      const driverMatches = staff.filter(s =>
        (driverStaffMember && (s.id === driverStaffMember.id || s.empId === driverStaffMember.empId)) ||
        (user?.email && s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (user?.name && `${s.firstName} ${s.lastName}`.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) ||
        (user?.id && (String(s.id) === String(user.id) || String(s.empId) === String(user.id)))
      );
      return driverMatches.length > 0 ? driverMatches : [driverStaffMember];
    }

    if (isTeacher) {
      const teacherMatches = staff.filter(s =>
        (teacherStaffMember && (s.id === teacherStaffMember.id || s.empId === teacherStaffMember.empId)) ||
        (user?.email && s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (user?.name && `${s.firstName} ${s.lastName}`.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) ||
        (user?.id && (String(s.id) === String(user.id) || String(s.empId) === String(user.id)))
      );
      return teacherMatches.length > 0 ? teacherMatches : [teacherStaffMember];
    }

    const isTeaching = (s: Staff) => {
      return (
        s.employeeCategory === "Teacher" ||
        s.employeeCategory === "Teaching Staff" ||
        s.role === "Teacher"
      );
    };

    return staff.filter(s => {
      const matchesQuery = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase());
      
      let matchesCategory = true;
      if (balanceCategoryFilter === 'Teaching Staff') {
        matchesCategory = isTeaching(s);
      } else if (balanceCategoryFilter === 'Non-Teaching Staff') {
        matchesCategory = !isTeaching(s);
      }

      return matchesQuery && matchesCategory;
    });
  }, [staff, isDriver, isTeacher, driverStaffMember, teacherStaffMember, user, query, balanceCategoryFilter]);

  const totalBalancePages = Math.ceil(filteredStaffForBalance.length / balancePageSize) || 1;

  const paginatedStaffForBalance = useMemo(() => {
    const start = (balanceCurrentPage - 1) * balancePageSize;
    return filteredStaffForBalance.slice(start, start + balancePageSize);
  }, [filteredStaffForBalance, balanceCurrentPage, balancePageSize]);

  // Modals / Drawer triggers
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<LeaveApplication | null>(null);
  const [viewingApplication, setViewingApplication] = useState<LeaveApplication | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelTargetApp, setCancelTargetApp] = useState<LeaveApplication | null>(null);

  // Leave Type Modals
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  // Holiday Modals
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  // Approval remarks
  const [selectedQueueApp, setSelectedQueueApp] = useState<LeaveApplication | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [queueActionType, setQueueActionType] = useState<LeaveApplication['status'] | null>(null);

  // Auto-calculated LOP warning modal state
  const [lopWarning, setLopWarning] = useState<{
    show: boolean;
    available: number;
    requested: number;
    appData: Omit<LeaveApplication, 'id'> | null;
  }>({ show: false, available: 0, requested: 0, appData: null });

  // Summaries Calculations
  const targetList = isTeacher || isDriver ? myApplications : leaveApplications;
  const pendingCount = targetList.filter(a => (a.status || '').toLowerCase() === 'pending').length;
  const approvedCount = targetList.filter(a => (a.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = targetList.filter(a => (a.status || '').toLowerCase() === 'rejected').length;
  
  // Aggregate total leave balance for current active staff
  const totalBalance = staff.reduce((sum, s) => {
    const bal = s.leaveBalance || { casual: 10, sick: 10, paid: 15 };
    return sum + (bal.casual || 0) + (bal.sick || 0) + (bal.paid || 0);
  }, 0);

  // Overlap date checker
  const hasOverlappingLeaves = (empId: string, from: string, to: string, skipId?: string) => {
    const start = new Date(from);
    const end = new Date(to);
    return leaveApplications.some(app => {
      if (app.id === skipId || app.employeeId !== empId || app.status === 'Rejected') return false;
      const appStart = new Date(app.fromDate);
      const appEnd = new Date(app.toDate);
      return start <= appEnd && end >= appStart;
    });
  };

  // Form State for Apply Leave
  const [applyForm, setApplyForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    halfDayPeriod: 'First Half' as 'First Half' | 'Second Half',
    reason: '',
    attachments: [] as string[]
  });

  const selectedStaffMember = (isTeacher && teacherStaffMember) ? teacherStaffMember : (staff.find(s => s.id === applyForm.employeeId) || teacherStaffMember);
  const selectedLeaveType = leaveTypes.find(t => t.id === applyForm.leaveTypeId);

  const calculateDays = (from: string, to: string, half: boolean) => {
    if (half) return 0.5;
    const start = new Date(from);
    const end = new Date(to);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays(applyForm.fromDate, applyForm.toDate, applyForm.isHalfDay);

  const getAvailableBalance = (s: Staff, typeName: string) => {
    const bal = s.leaveBalance || { casual: 10, sick: 10, paid: 15 };
    const name = typeName.toLowerCase();
    if (name.includes('casual')) return bal.casual || 0;
    if (name.includes('sick')) return bal.sick || 0;
    if (name.includes('earned') || name.includes('paid')) return bal.paid || 0;
    return 99; // Lost of pay or unlimited allowance
  };

  // Submit Leave application
  const handleApplySubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const employee = (isTeacher && teacherStaffMember) 
      ? teacherStaffMember 
      : (staff.find(s => s.id === applyForm.employeeId) || teacherStaffMember);

    const lType = leaveTypes.find(t => t.id === applyForm.leaveTypeId) || activeLeaveTypes[0] || { id: 'LT-01', name: 'Casual Leave', isPaid: true };

    if (!employee || !applyForm.reason.trim()) {
      addToast('warning', 'Missing Details', 'Please provide a reason for your leave request.');
      return;
    }

    if (hasOverlappingLeaves(employee.id, applyForm.fromDate, applyForm.toDate, editingApplication?.id)) {
      addToast('error', 'Date Overlap', 'Leave has already been applied for the selected dates.');
      return;
    }

    const availableBal = getAvailableBalance(employee, lType.name);

    const appData: Omit<LeaveApplication, 'id'> = {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      empId: employee.empId,
      department: employee.department,
      designation: employee.designation,
      branch: (employee as any).branch || 'Main Campus',
      employeeCategory: employee.employeeCategory || (employee.role === 'Teacher' ? 'Teacher' : 'Staff'),
      leaveTypeId: lType.id,
      leaveTypeName: lType.name,
      fromDate: applyForm.fromDate,
      toDate: applyForm.toDate,
      isHalfDay: applyForm.isHalfDay,
      halfDayPeriod: applyForm.isHalfDay ? applyForm.halfDayPeriod : undefined,
      numberOfDays: requestedDays,
      reason: applyForm.reason,
      attachments: applyForm.attachments,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    // Balance validation
    if (lType.isPaid && requestedDays > availableBal) {
      setLopWarning({
        show: true,
        available: availableBal,
        requested: requestedDays,
        appData
      });
      return;
    }

    saveApplication(appData);
  };

  const saveApplication = (appData: Omit<LeaveApplication, 'id'>) => {
    if (editingApplication) {
      updateLeaveApplication(editingApplication.id, appData);
      addToast('success', 'Request Updated', 'Leave application updated.');
      setEditingApplication(null);
    } else {
      addLeaveApplication(appData);
      addToast('success', 'Request Filed', 'Leave application has been submitted for approval.');
    }
    setIsApplyOpen(false);
    resetApplyForm();
  };

  const handleContinueAsLop = () => {
    if (lopWarning.appData) {
      const lopType = leaveTypes.find(t => t.code === 'LOP') || leaveTypes[leaveTypes.length - 1];
      const updatedData: Omit<LeaveApplication, 'id'> = {
        ...lopWarning.appData,
        leaveTypeId: lopType.id,
        leaveTypeName: lopType.name
      };
      saveApplication(updatedData);
    }
    setLopWarning({ show: false, available: 0, requested: 0, appData: null });
  };

  const resetApplyForm = () => {
    setApplyForm({
      employeeId: '',
      leaveTypeId: '',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      isHalfDay: false,
      halfDayPeriod: 'First Half',
      reason: '',
      attachments: []
    });
  };

  const openEditApplication = (app: LeaveApplication) => {
    setEditingApplication(app);
    setApplyForm({
      employeeId: app.employeeId,
      leaveTypeId: app.leaveTypeId,
      fromDate: app.fromDate,
      toDate: app.toDate,
      isHalfDay: app.isHalfDay,
      halfDayPeriod: app.halfDayPeriod || 'First Half',
      reason: app.reason,
      attachments: app.attachments
    });
    setIsApplyOpen(true);
  };

  const triggerCancelApplication = (app: LeaveApplication) => {
    setCancelTargetApp(app);
    setConfirmCancelId(app.id);
  };

  const confirmCancel = () => {
    if (confirmCancelId) {
      if (cancelTargetApp?.status === 'Approved') {
        updateLeaveApplicationStatus(confirmCancelId, 'Rejected', 'Cancelled by employee after approval');
        addToast('info', 'Approved Leave Cancelled', 'The approved leave request has been cancelled.');
      } else {
        deleteLeaveApplication(confirmCancelId);
        addToast('info', 'Leave Application Deleted', 'Pending leave application has been deleted.');
      }
      setConfirmCancelId(null);
      setCancelTargetApp(null);
    }
  };

  // Leave Type Form Handlers
  const handleTypeSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const payload: Omit<LeaveType, 'id'> = {
      name: data.get('name') as string,
      code: data.get('code') as string,
      annualAllowance: Number(data.get('annualAllowance')),
      carryForward: data.get('carryForward') === 'true',
      maxConsecutiveDays: Number(data.get('maxConsecutiveDays')),
      requiresAttachment: data.get('requiresAttachment') === 'true',
      isPaid: data.get('isPaid') === 'true',
      status: data.get('status') as any
    };

    if (editingType) {
      updateLeaveType(editingType.id, payload);
      addToast('success', 'Leave Type Updated');
    } else {
      addLeaveType(payload);
      addToast('success', 'Leave Type Registered');
    }
    setIsTypeModalOpen(false);
    setEditingType(null);
  };

  // Holiday Form Handlers
  const handleHolidaySubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const payload: Omit<Holiday, 'id'> = {
      name: data.get('name') as string,
      startDate: data.get('startDate') as string,
      endDate: data.get('endDate') as string,
      type: data.get('type') as any,
      branch: data.get('branch') as string || 'All Branches',
      description: data.get('description') as string
    };

    if (editingHoliday) {
      updateHoliday(editingHoliday.id, payload);
      addToast('success', 'Holiday Updated');
    } else {
      addHoliday(payload);
      addToast('success', 'Holiday Registered');
    }
    setIsHolidayModalOpen(false);
    setEditingHoliday(null);
  };

  // Approval Process submission
  const handleApprovalSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedQueueApp || !queueActionType) return;
    if (queueActionType === 'Rejected' && !approvalRemarks) {
      addToast('warning', 'Remarks Required', 'Please provide a reason for rejecting this leave application.');
      return;
    }

    updateLeaveApplicationStatus(selectedQueueApp.id, queueActionType, approvalRemarks, 'Principal / HR Administrator');
    setSelectedQueueApp(null);
    setApprovalRemarks('');
    setQueueActionType(null);
  };

  // Printing application layout with official school template
  const handlePrintApplication = (app: LeaveApplication) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Leave Application Slip - ${app.employeeName}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 35px; color: #1e293b; line-height: 1.5; }
              .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 20px; margin-bottom: 25px; }
              .logo { font-size: 24px; font-weight: 900; color: #0369a1; letter-spacing: 1px; }
              .sub-logo { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 3px; }
              .title { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 15px; background: #f0f9ff; display: inline-block; padding: 6px 18px; border-radius: 6px; border: 1px solid #bae6fd; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; font-size: 13px; }
              .card { background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; }
              .label { color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
              .value { font-weight: 700; color: #0f172a; margin-top: 2px; }
              .reason-box { margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
              .footer-sign { margin-top: 70px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #475569; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">PIRNAV EDUCATIONAL INSTITUTION</div>
              <div class="sub-logo">Human Resource & Administrative Management</div>
              <div class="title">OFFICIAL LEAVE APPLICATION SLIP</div>
            </div>
            
            <div class="grid">
              <div class="card"><div class="label">Employee Name</div><div class="value">${app.employeeName}</div></div>
              <div class="card"><div class="label">Employee ID</div><div class="value">${app.empId}</div></div>
              <div class="card"><div class="label">Department</div><div class="value">${app.department}</div></div>
              <div class="card"><div class="label">Designation</div><div class="value">${app.designation || 'Faculty Member'}</div></div>
              <div class="card"><div class="label">Leave Type</div><div class="value">${app.leaveTypeName}</div></div>
              <div class="card"><div class="label">Leave Duration</div><div class="value">${app.numberOfDays} Day(s) (${app.fromDate} to ${app.toDate})</div></div>
              <div class="card"><div class="label">Applied Date</div><div class="value">${app.appliedDate}</div></div>
              <div class="card"><div class="label">Application Status</div><div class="value" style="color: ${app.status === 'Approved' ? '#16a34a' : (app.status === 'Pending' ? '#d97706' : '#dc2626')}">${app.status.toUpperCase()}</div></div>
            </div>

            <div class="reason-box">
              <div class="label">Reason for Leave</div>
              <p style="margin-top: 5px; font-style: italic;">"${app.reason}"</p>
            </div>

            ${app.approverRemarks ? `
              <div class="reason-box" style="border-color: #fecaca; background: #fff5f5;">
                <div class="label" style="color: #991b1b;">Approver Comments</div>
                <p style="margin-top: 5px;">${app.approverRemarks}</p>
              </div>
            ` : ''}

            <div class="footer-sign">
              <div>__________________________________<br/>Employee Signature</div>
              <div>__________________________________<br/>Authorized HR / Principal Signature</div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" /> Leave Management
          </h2>
        </div>

        {userRole !== 'admin' && userRole !== 'superadmin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingApplication(null);
                resetApplyForm();
                if (isDriver && driverStaffMember) {
                  setApplyForm(prev => ({ ...prev, employeeId: driverStaffMember.id }));
                } else if (isTeacher && teacherStaffMember) {
                  setApplyForm(prev => ({ ...prev, employeeId: teacherStaffMember.id }));
                }
                setIsApplyOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-brand-500">Approved Leaves</span>
          <p className="text-lg font-black text-brand-600 mt-1">{approvedCount} Leaves</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-500">Pending Approvals</span>
          <p className="text-lg font-black text-amber-600 mt-1">{pendingCount} Applications</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-rose-500">Rejected / Cancelled</span>
          <p className="text-lg font-black text-rose-600 mt-1">{rejectedCount} Leaves</p>
        </div>
      </div>

      {/* Internal Tabs Layout */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 py-1">
        {hasApprovalPermission && (
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'queue' ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Approval Queue
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'applications' ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Leave Applications
        </button>
        {hasApprovalPermission && (
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'types' ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Leave Types
          </button>
        )}
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'balance' ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Leave Balance
        </button>
      </div>

      {/* TAB CONTENT: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Advanced Filter Header */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search employee name..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border outline-none"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {!isTeacher && (
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="appearance-none pl-3.5 pr-9 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer outline-none transition-all shadow-sm"
                  >
                    <option value="All">All Categories</option>
                    <option value="Teacher">Teachers</option>
                    <option value="Staff">Staff</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3.5 pr-9 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer outline-none transition-all shadow-sm"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="appearance-none pl-3.5 pr-9 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer outline-none transition-all shadow-sm"
                >
                  <option value="All">All Leave Types</option>
                  {activeLeaveTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Applications list table */}
          <div className="glass-card rounded-2xl overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">S.No.</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Employee</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Emp ID</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Department</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Leave Type</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">From - To Date</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Requested Days</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Applied On</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {(() => {
                    const baseApps = isTeacher || isDriver ? myApplications : leaveApplications;
                    const filteredList = baseApps.filter(app => {
                      const nameMatch = !query || app.employeeName.toLowerCase().includes(query.toLowerCase());
                      const catMatch = filterCategory === 'All' || app.employeeCategory === filterCategory;
                      const statusMatch = filterStatus === 'All' || (app.status || '').toLowerCase() === filterStatus.toLowerCase();
                      const typeMatch = filterType === 'All' || app.leaveTypeName === filterType;
                      return nameMatch && catMatch && statusMatch && typeMatch;
                    });

                    if (filteredList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400 font-bold italic">
                            No leave applications found. Click "+ Apply for Leave" above to file a new leave request.
                          </td>
                        </tr>
                      );
                    }

                    return filteredList.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500 text-center whitespace-nowrap">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100 text-center whitespace-nowrap">{app.employeeName}</td>
                        <td className="py-3.5 px-4 font-mono text-center whitespace-nowrap">{app.empId}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">{app.department}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="font-semibold text-sky-600 block">{app.leaveTypeName}</span>
                          {app.isHalfDay && <span className="block text-[9px] text-amber-600 font-semibold">{app.halfDayPeriod ? `Half Day (${app.halfDayPeriod})` : 'Half Day'}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                          {app.fromDate} <span className="text-slate-400 font-sans mx-0.5">to</span> {app.toDate}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-center whitespace-nowrap">{app.numberOfDays} Days</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-slate-500">{app.appliedDate}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge variant={app.status === 'Approved' ? 'success' : (app.status === 'Pending' ? 'warning' : 'danger')}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setViewingApplication(app)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors" title="View Details & Print">
                              <Eye className="w-4 h-4" />
                            </button>
                            {app.status === 'Pending' && (
                              <>
                                <button onClick={() => openEditApplication(app)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 hover:text-blue-800 transition-colors" title="Edit Request">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => triggerCancelApplication(app)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 hover:text-rose-800 transition-colors" title="Delete Pending Request">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {app.status === 'Approved' && (
                              <button onClick={() => triggerCancelApplication(app)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 hover:text-rose-800 transition-colors" title="Cancel Approved Leave">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEAVE TYPES MASTER */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Leave Category Configuration</h3>
            <button
              onClick={() => { setEditingType(null); setIsTypeModalOpen(true); }}
              className="px-3 py-1.5 bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Configure Leave Type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeLeaveTypes.map(t => (
              <div key={t.id} className="p-5 bg-white dark:bg-slate-900 border rounded-3xl space-y-3 relative group">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                    <span className="font-mono text-[10px] text-sky-600 font-bold uppercase">{t.code}</span>
                  </div>
                  <Badge variant={t.status === 'Active' ? 'success' : 'neutral'}>{t.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t">
                  <div><span className="text-slate-400">Allowance:</span> <span className="font-bold text-slate-800">{t.annualAllowance} Days/yr</span></div>
                  <div><span className="text-slate-400">Carry Forward:</span> <span className="font-bold text-slate-800">{t.carryForward ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-slate-400">Max Consecutive:</span> <span className="font-bold text-slate-800">{t.maxConsecutiveDays} Days</span></div>
                  <div><span className="text-slate-400">Type:</span> <span className={`font-bold ${t.isPaid ? 'text-brand-600' : 'text-amber-600'}`}>{t.isPaid ? 'Paid' : 'Unpaid (LOP)'}</span></div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingType(t); setIsTypeModalOpen(true); }} className="p-1 text-blue-600 hover:bg-slate-100 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteLeaveType(t.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEAVE BALANCE */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          {!isSelfServiceStaff && (
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by staff..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Filter By Category:</span>
                <div className="relative w-full sm:w-48">
                  <select
                    value={balanceCategoryFilter}
                    onChange={e => setBalanceCategoryFilter(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border outline-none font-bold text-slate-700 dark:text-slate-355 cursor-pointer appearance-none pr-8"
                  >
                    <option value="All">All Categories</option>
                    <option value="Teaching Staff">Teaching Staff</option>
                    <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl overflow-hidden border bg-white dark:bg-slate-900">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-3.5 px-4 text-center">S.No.</th>
                  <th className="py-3.5 px-4 text-center">Employee</th>
                  <th className="py-3.5 px-4 text-center">Casual Leave Balance</th>
                  <th className="py-3.5 px-4 text-center">Sick Leave Balance</th>
                  <th className="py-3.5 px-4 text-center">Earned Leave Balance</th>
                  <th className="py-3.5 px-4 text-center">Used Leave Balance</th>
                  <th className="py-3.5 px-4 text-center">Total Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium text-slate-705 dark:text-slate-300">
                {paginatedStaffForBalance.map((s, idx) => {
                  const bal = s.leaveBalance || { casual: 10, sick: 10, paid: 15 };
                  const employeeApplications = leaveApplications.filter(
                    app => (app.employeeId === s.id || app.empId === s.empId) && app.status === 'Approved'
                  );
                  const usedLeaves = employeeApplications.reduce((sum, app) => sum + (app.numberOfDays || 0), 0);
                  const totalRemaining = (bal.casual || 0) + (bal.sick || 0) + (bal.paid || 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 text-center">{(balanceCurrentPage - 1) * balancePageSize + idx + 1}</td>
                      <td className="py-3 px-4 text-center">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{s.firstName} {s.lastName}</p>
                        <p className="text-[10px] text-slate-400">{s.designation} • {s.empId}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-center">{bal.casual} Days</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-center">{bal.sick} Days</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-center">{bal.paid} Days</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-center">{usedLeaves} Days</td>
                      <td className="py-3 px-4 font-mono font-black text-brand-600 dark:text-brand-400 text-center">{totalRemaining} Days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination bar */}
            {filteredStaffForBalance.length > 0 && (
              <div className="px-4 pb-3">
                <Pagination
                  currentPage={balanceCurrentPage}
                  totalItems={filteredStaffForBalance.length}
                  itemsPerPage={balancePageSize}
                  onPageChange={setBalanceCurrentPage}
                  onItemsPerPageChange={(n) => { setBalancePageSize(n); setBalanceCurrentPage(1); }}
                  label="staff records"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPROVAL QUEUE */}
      {activeTab === 'queue' && hasApprovalPermission && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass-card rounded-2xl overflow-hidden border">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-3.5 px-4 text-center">S.No.</th>
                  <th className="py-3.5 px-4 text-center">Employee</th>
                  <th className="py-3.5 px-4 text-center">Leave Type</th>
                  <th className="py-3.5 px-4 text-center">Applied Date</th>
                  <th className="py-3.5 px-4 text-center">From - To Date</th>
                  <th className="py-3.5 px-4 text-center">Requested Days</th>
                  <th className="py-3.5 px-4 text-center">Reason</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {leaveApplications.filter(app => (app.status || '').toLowerCase() === 'pending').length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400">All pending leave applications processed.</td></tr>
                ) : (
                  leaveApplications
                    .filter(app => (app.status || '').toLowerCase() === 'pending')
                    .map((app, idx) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500 text-center">{idx + 1}</td>
                        <td className="py-3 px-4 text-center">
                          <p className="font-bold text-slate-800">{app.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{app.designation} • {app.empId || app.employeeId}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-sky-600 text-center">{app.leaveTypeName}</td>
                        <td className="py-3 px-4 text-center">{app.appliedDate}</td>
                        <td className="py-3 px-4 text-center">{app.fromDate} to {app.toDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-center">{app.numberOfDays || (app as any).daysCount || 1} Days</td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate text-center">{app.reason}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => { setSelectedQueueApp(app); setQueueActionType('Approved'); }}
                              className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setSelectedQueueApp(app); setQueueActionType('Rejected'); }}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => { setSelectedQueueApp(app); setQueueActionType('Sent Back'); }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg"
                            >
                              Send Back
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: HOLIDAY CALENDAR */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Holidays Calendar</h3>
            <button
              onClick={() => { setEditingHoliday(null); setIsHolidayModalOpen(true); }}
              className="px-3 py-1.5 bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Holiday
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-3 px-4">Holiday Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From Date</th>
                  <th className="py-3 px-4">To Date</th>
                  <th className="py-3 px-4">Applicable Branch</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {holidays.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No holidays scheduled in the calendar.</td></tr>
                ) : (
                  holidays.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{h.name}</td>
                      <td className="py-3 px-4"><Badge variant="info">{h.type}</Badge></td>
                      <td className="py-3 px-4 font-mono">{h.startDate}</td>
                      <td className="py-3 px-4 font-mono">{h.endDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{h.branch || 'All Branches'}</td>
                      <td className="py-3 px-4 text-slate-400">{h.description || 'No description'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingHoliday(h); setIsHolidayModalOpen(true); }} className="p-1 hover:bg-slate-100 text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => deleteHoliday(h.id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: APPLY / EDIT LEAVE APPLICATION - COMPACT SINGLE-FRAME */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-2.5 my-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                {editingApplication ? 'Edit Leave Application' : 'Apply For Leave'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsApplyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-2.5 text-xs">
              
              {/* Employee Selection */}
              <div>
                <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  Applicant Employee <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                {isTeacher && teacherStaffMember ? (
                  <input
                    type="text"
                    disabled
                    value={`${teacherStaffMember.firstName} ${teacherStaffMember.lastName} (${teacherStaffMember.empId} - ${teacherStaffMember.designation || 'Teacher'})`}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-not-allowed outline-none text-xs"
                  />
                ) : (
                  <select
                    required
                    value={applyForm.employeeId}
                    onChange={e => setApplyForm({ ...applyForm, employeeId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer text-xs"
                  >
                    <option value="">Select Staff Member</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.empId} - {s.designation})</option>)}
                  </select>
                )}
              </div>

              {selectedStaffMember && (
                (() => {
                  const bal = selectedStaffMember.leaveBalance || { casual: 10, sick: 10, paid: 15 };
                  return (
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      <div><span className="text-slate-400">Branch:</span> <span className="font-bold">{(selectedStaffMember as any).branch || 'Main Campus'}</span></div>
                      <div><span className="text-slate-400">Department:</span> <span className="font-bold">{selectedStaffMember.department}</span></div>
                      <div><span className="text-slate-400">Designation:</span> <span className="font-bold">{selectedStaffMember.designation}</span></div>
                      <div className="col-span-2 pt-1 mt-0.5 border-t border-slate-200 dark:border-slate-700 text-brand-700 dark:text-brand-400 font-bold flex gap-3">
                        <span>Casual: {bal.casual ?? 10}</span>
                        <span>Sick: {bal.sick ?? 10}</span>
                        <span>Paid: {bal.paid ?? 15}</span>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Leave Type & Half Day Inline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    Leave Type <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    required
                    value={applyForm.leaveTypeId}
                    onChange={e => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer text-xs"
                  >
                    <option value="">Select Leave Type</option>
                    {activeLeaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    Duration Type
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300 text-xs">
                      <input
                        type="checkbox"
                        checked={applyForm.isHalfDay}
                        onChange={e => {
                          const checked = e.target.checked;
                          setApplyForm({
                            ...applyForm,
                            isHalfDay: checked,
                            toDate: checked ? applyForm.fromDate : applyForm.toDate
                          });
                        }}
                        className="rounded text-brand-600"
                      />
                      <span>Half Day</span>
                    </label>

                    {applyForm.isHalfDay && (
                      <select
                        value={applyForm.halfDayPeriod}
                        onChange={e => setApplyForm({ ...applyForm, halfDayPeriod: e.target.value as any })}
                        className="px-2 py-0.5 text-[10px] rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer outline-none font-bold"
                      >
                        <option value="First Half">First Half</option>
                        <option value="Second Half">Second Half</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    From Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.fromDate}
                    onChange={e => setApplyForm({ ...applyForm, fromDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    To Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.toDate}
                    disabled={applyForm.isHalfDay}
                    onChange={e => setApplyForm({ ...applyForm, toDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  Reason for Request <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  required
                  placeholder="Explain why you are applying for leave..."
                  value={applyForm.reason}
                  onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-14 resize-none outline-none text-xs"
                />
              </div>

              {/* Submissions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                  Total duration: <span className="text-sky-600 font-extrabold">{requestedDays} Days</span>
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsApplyOpen(false)} className="px-3.5 py-1.5 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 font-extrabold text-white bg-brand-600 hover:bg-brand-500 rounded-lg text-xs shadow-md transition-all active:scale-95">
                    {editingApplication ? 'Save Changes' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOP BALANCE WARNING DIALOG */}
      {lopWarning.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Leave Balance Exceeded</h3>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <p>Available Balance: <strong className="text-slate-800">{lopWarning.available} Days</strong></p>
                <p>Requested Leave: <strong className="text-slate-800">{lopWarning.requested} Days</strong></p>
                <p className="pt-2 text-rose-600">Would you like to file the excess request as **Loss of Pay (LOP)** unpaid leave?</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLopWarning({ show: false, available: 0, requested: 0, appData: null })}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl"
              >
                Cancel Application
              </button>
              <button
                type="button"
                onClick={handleContinueAsLop}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md"
              >
                Continue as LOP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: APPROVAL REMARKS/QUEUE ACTIONS */}
      {selectedQueueApp && queueActionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {queueActionType} Leave Request
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to {queueActionType.toLowerCase()} leave request for **{selectedQueueApp.employeeName}**?
            </p>
            
            <form onSubmit={handleApprovalSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700">Approver Remarks / Reason {queueActionType === 'Rejected' && '*'}</label>
                <textarea
                  required={queueActionType === 'Rejected'}
                  placeholder="Provide comments or reason for rejection/approval..."
                  value={approvalRemarks}
                  onChange={e => setApprovalRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border h-16 resize-none outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => { setSelectedQueueApp(null); setQueueActionType(null); }}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl ${
                    queueActionType === 'Approved' ? 'bg-brand-600 hover:bg-brand-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {queueActionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG: VIEW DETAILS (PREVIEW MODAL WITH SCHOOL BRANDING) */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            {/* School Logo & Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">PIRNAV EDUCATIONAL INSTITUTION</h3>
                  <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">Leave Application Slip Preview</p>
                </div>
              </div>
              <button onClick={() => setViewingApplication(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Employee & Application Details Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Employee Name</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewingApplication.employeeName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Emp ID</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{viewingApplication.empId}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingApplication.department}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Designation</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingApplication.designation || 'Faculty Member'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Leave Type</span>
                  <p className="font-bold text-sky-600 mt-0.5">{viewingApplication.leaveTypeName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <div className="mt-0.5">
                    <Badge variant={viewingApplication.status === 'Approved' ? 'success' : (viewingApplication.status === 'Pending' ? 'warning' : 'danger')}>
                      {viewingApplication.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Leave Period</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{viewingApplication.fromDate} to {viewingApplication.toDate}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Duration</span>
                  <p className="font-black text-slate-900 dark:text-white mt-0.5">{viewingApplication.numberOfDays} Day(s) {viewingApplication.isHalfDay ? `(Half Day - ${viewingApplication.halfDayPeriod})` : ''}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Reason for Leave</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800/40 border rounded-xl italic text-slate-700 dark:text-slate-300 mt-1">{viewingApplication.reason}</p>
              </div>

              {viewingApplication.approverRemarks && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-500">Approver Remarks</span>
                  <p className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 mt-1">{viewingApplication.approverRemarks}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-[10px] text-slate-400 font-mono">Applied on: {viewingApplication.appliedDate}</span>
              <div className="flex gap-2">
                <button onClick={() => handlePrintApplication(viewingApplication)} className="px-4 py-2 text-xs bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all cursor-pointer">
                  <Printer className="w-4 h-4" /> Print Slip
                </button>
                <button onClick={() => setViewingApplication(null)} className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCEL / DELETE MODAL */}
      <ConfirmModal
        isOpen={!!confirmCancelId}
        title={cancelTargetApp?.status === 'Approved' ? "Cancel Approved Leave" : "Delete Leave Application"}
        message={
          cancelTargetApp?.status === 'Approved'
            ? "Are you sure you want to cancel this approved leave request?"
            : "Are you sure you want to delete this pending leave request before approval?"
        }
        onConfirm={confirmCancel}
        onCancel={() => { setConfirmCancelId(null); setCancelTargetApp(null); }}
      />

      {/* MASTER FORM MODAL: LEAVE TYPES */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">{editingType ? 'Edit Leave Type' : 'Configure Leave Type'}</h3>
            <form onSubmit={handleTypeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Leave Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input type="text" name="name" required defaultValue={editingType?.name || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Leave Code <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input type="text" name="code" placeholder="e.g. CL" required defaultValue={editingType?.code || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Annual Allowance (Days) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input type="number" name="annualAllowance" required defaultValue={editingType?.annualAllowance || 10} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Carry Forward</label>
                  <select name="carryForward" defaultValue={String(editingType?.carryForward || false)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Consecutive Days</label>
                  <input type="number" name="maxConsecutiveDays" defaultValue={editingType?.maxConsecutiveDays || 5} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Requires Attachment</label>
                  <select name="requiresAttachment" defaultValue={String(editingType?.requiresAttachment || false)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Is Paid Leave</label>
                  <select name="isPaid" defaultValue={String(editingType?.isPaid || true)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer">
                    <option value="true">Paid</option>
                    <option value="false">Unpaid (LOP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select name="status" defaultValue={editingType?.status || 'Active'} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsTypeModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-brand-600 rounded-xl">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MASTER FORM MODAL: HOLIDAY CALENDAR */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">{editingHoliday ? 'Edit Holiday' : 'Add Calendar Holiday'}</h3>
            <form onSubmit={handleHolidaySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Holiday Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input type="text" name="name" required defaultValue={editingHoliday?.name || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input type="date" name="startDate" required defaultValue={editingHoliday?.startDate || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input type="date" name="endDate" required defaultValue={editingHoliday?.endDate || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Holiday Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select name="type" defaultValue={editingHoliday?.type || 'School'} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer">
                    <option value="National">National Holiday</option>
                    <option value="School">School Holiday</option>
                    <option value="Festival">Festival Holiday</option>
                    <option value="Branch">Branch Specific Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Applicable Branch</label>
                  <input type="text" name="branch" placeholder="e.g. Main Campus" defaultValue={editingHoliday?.branch || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description / Notes</label>
                <textarea name="description" defaultValue={editingHoliday?.description || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border h-16 resize-none outline-none" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsHolidayModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-brand-600 rounded-xl">Save Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default LeaveManagementView;
