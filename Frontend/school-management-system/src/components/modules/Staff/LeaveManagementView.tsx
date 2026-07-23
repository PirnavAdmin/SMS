import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  FileText, Plus, Edit, Trash2, Eye, Printer, Calendar, CheckCircle, XCircle, Search, Filter,
  User, Layers, HelpCircle, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react';
import { LeaveApplication, LeaveType, Holiday, Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';

export const LeaveManagementView: React.FC = () => {
  const {
    staff,
    leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType,
    leaveApplications, addLeaveApplication, updateLeaveApplication, deleteLeaveApplication, updateLeaveApplicationStatus,
    holidays, addHoliday, updateHoliday, deleteHoliday
  } = useData();

  const { addToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'applications' | 'types' | 'balance' | 'queue' | 'holidays'>('applications');

  // Filter States
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals / Drawer triggers
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<LeaveApplication | null>(null);
  const [viewingApplication, setViewingApplication] = useState<LeaveApplication | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

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

  // Current User Role Simulation for RBAC
  const currentUserRole = 'Admin'; // In production, this would come from an auth hook.
  const hasApprovalPermission = ['Admin', 'Principal', 'HR'].includes(currentUserRole);

  // Summaries Calculations
  const pendingCount = leaveApplications.filter(a => a.status === 'Pending').length;
  const approvedCount = leaveApplications.filter(a => a.status === 'Approved').length;
  const rejectedCount = leaveApplications.filter(a => a.status === 'Rejected').length;
  
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

  const selectedStaffMember = staff.find(s => s.id === applyForm.employeeId);
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
    if (!applyForm.employeeId || !applyForm.leaveTypeId || !applyForm.reason) {
      addToast('warning', 'Missing Details', 'Please complete all required fields.');
      return;
    }

    if (hasOverlappingLeaves(applyForm.employeeId, applyForm.fromDate, applyForm.toDate, editingApplication?.id)) {
      addToast('error', 'Date Overlap', 'Leave has already been applied for the selected dates.');
      return;
    }

    const employee = staff.find(s => s.id === applyForm.employeeId)!;
    const lType = leaveTypes.find(t => t.id === applyForm.leaveTypeId)!;
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

  const triggerCancelApplication = (appId: string) => {
    setConfirmCancelId(appId);
  };

  const confirmCancel = () => {
    if (confirmCancelId) {
      updateLeaveApplicationStatus(confirmCancelId, 'Rejected', 'Cancelled by employee');
      addToast('info', 'Leave Cancelled', 'Leave request has been marked as cancelled/rejected.');
      setConfirmCancelId(null);
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

  // Printing application layout mock
  const handlePrintApplication = (app: LeaveApplication) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Leave Application - ${app.employeeName}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
              .details { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .section { margin-top: 40px; }
              .sign { margin-top: 80px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>LEAVE APPLICATION SLIP</h2>
              <p>St. Xavier's International Academy - HR Department</p>
            </div>
            <div class="details">
              <div><strong>Employee Name:</strong> ${app.employeeName}</div>
              <div><strong>Employee ID:</strong> ${app.empId}</div>
              <div><strong>Department:</strong> ${app.department}</div>
              <div><strong>Designation:</strong> ${app.designation}</div>
              <div><strong>Leave Type:</strong> ${app.leaveTypeName}</div>
              <div><strong>Period:</strong> ${app.fromDate} to ${app.toDate} (${app.numberOfDays} Days)</div>
              <div><strong>Applied Date:</strong> ${app.appliedDate}</div>
              <div><strong>Status:</strong> ${app.status}</div>
            </div>
            <div class="section">
              <h4>Reason for Leave:</h4>
              <p>${app.reason}</p>
            </div>
            <div class="sign">
              <div>____________________<br/>Employee Signature</div>
              <div>____________________<br/>Approver Signature</div>
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
            <FileText className="w-6 h-6 text-emerald-600" /> Leave Management System
          </h2>
          <p className="text-xs text-slate-500">Configure leave settings, monitor balances, process approvals, and manage school calendars</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditingApplication(null); resetApplyForm(); setIsApplyOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Leave Balance</span>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{totalBalance} Days</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-500">Pending Approvals</span>
          <p className="text-lg font-black text-amber-600 mt-1">{pendingCount} Applications</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-500">Approved Leaves</span>
          <p className="text-lg font-black text-emerald-600 mt-1">{approvedCount} Leaves</p>
        </div>
        <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm">
          <span className="text-[10px] uppercase font-bold text-rose-500">Rejected / Cancelled</span>
          <p className="text-lg font-black text-rose-600 mt-1">{rejectedCount} Leaves</p>
        </div>
      </div>

      {/* Internal Tabs Layout */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 py-1">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'applications' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Leave Applications
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'types' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Leave Types Master
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'balance' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Leave Balance
        </button>
        {hasApprovalPermission && (
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'queue' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'
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
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'holidays' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          Holiday Calendar
        </button>
      </div>

      {/* TAB CONTENT: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Advanced Filter Header */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center gap-3">
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
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-slate-50 border cursor-pointer outline-none">
                <option value="All">All Categories</option>
                <option value="Teacher">Teachers</option>
                <option value="Staff">Staff</option>
              </select>

              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-slate-50 border cursor-pointer outline-none">
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-slate-50 border cursor-pointer outline-none">
                <option value="All">All Leave Types</option>
                {leaveTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Applications list table */}
          <div className="glass-card rounded-2xl overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Emp ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">From - To Date</th>
                    <th className="py-3 px-4">Requested Days</th>
                    <th className="py-3 px-4">Applied On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {leaveApplications
                    .filter(app => {
                      const nameMatch = app.employeeName.toLowerCase().includes(query.toLowerCase());
                      const catMatch = filterCategory === 'All' || app.employeeCategory === filterCategory;
                      const statusMatch = filterStatus === 'All' || app.status === filterStatus;
                      const typeMatch = filterType === 'All' || app.leaveTypeName === filterType;
                      return nameMatch && catMatch && statusMatch && typeMatch;
                    })
                    .map(app => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{app.employeeName}</td>
                        <td className="py-3 px-4 font-mono">{app.empId}</td>
                        <td className="py-3 px-4">{app.department}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-purple-600">{app.leaveTypeName}</span>
                          {app.isHalfDay && <span className="block text-[9px] text-amber-500">Half Day ({app.halfDayPeriod})</span>}
                        </td>
                        <td className="py-3 px-4">{app.fromDate} to {app.toDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{app.numberOfDays} Days</td>
                        <td className="py-3 px-4">{app.appliedDate}</td>
                        <td className="py-3 px-4">
                          <Badge variant={app.status === 'Approved' ? 'success' : (app.status === 'Pending' ? 'warning' : 'danger')}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setViewingApplication(app)} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handlePrintApplication(app)} className="p-1 rounded hover:bg-slate-100 text-emerald-600" title="Print Request">
                              <Printer className="w-4 h-4" />
                            </button>
                            {app.status === 'Pending' && (
                              <>
                                <button onClick={() => openEditApplication(app)} className="p-1 rounded hover:bg-slate-100 text-blue-600" title="Edit Request">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => triggerCancelApplication(app.id)} className="p-1 rounded hover:bg-rose-50 text-rose-600" title="Cancel Request">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Configure Leave Type
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaveTypes.map(t => (
              <div key={t.id} className="p-5 bg-white dark:bg-slate-900 border rounded-3xl space-y-3 relative group">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{t.name}</h4>
                    <span className="font-mono text-[10px] text-purple-600 font-bold uppercase">{t.code}</span>
                  </div>
                  <Badge variant={t.status === 'Active' ? 'success' : 'neutral'}>{t.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t">
                  <div><span className="text-slate-400">Allowance:</span> <span className="font-bold text-slate-800">{t.annualAllowance} Days/yr</span></div>
                  <div><span className="text-slate-400">Carry Forward:</span> <span className="font-bold text-slate-800">{t.carryForward ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-slate-400">Max Consecutive:</span> <span className="font-bold text-slate-800">{t.maxConsecutiveDays} Days</span></div>
                  <div><span className="text-slate-400">Type:</span> <span className={`font-bold ${t.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{t.isPaid ? 'Paid' : 'Unpaid (LOP)'}</span></div>
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
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff balances..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border outline-none"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Casual Leave Balance</th>
                  <th className="py-3.5 px-4">Sick Leave Balance</th>
                  <th className="py-3.5 px-4">Earned Leave Balance</th>
                  <th className="py-3.5 px-4">Total Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {staff
                  .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()))
                  .map(s => {
                    const bal = s.leaveBalance || { casual: 10, sick: 10, paid: 15 };
                    const totalRemaining = (bal.casual || 0) + (bal.sick || 0) + (bal.paid || 0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img src={s.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-slate-800">{s.firstName} {s.lastName}</p>
                              <p className="text-[10px] text-slate-400">{s.designation} • {s.empId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{bal.casual} Days</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{bal.sick} Days</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{bal.paid} Days</td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600">{totalRemaining} Days</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPROVAL QUEUE */}
      {activeTab === 'queue' && hasApprovalPermission && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass-card rounded-2xl overflow-hidden border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-4">From - To Date</th>
                  <th className="py-3.5 px-4">Requested Days</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {leaveApplications.filter(app => app.status === 'Pending').length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">All pending leave applications processed.</td></tr>
                ) : (
                  leaveApplications
                    .filter(app => app.status === 'Pending')
                    .map(app => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{app.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{app.designation} • {app.empId}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-purple-600">{app.leaveTypeName}</td>
                        <td className="py-3 px-4">{app.appliedDate}</td>
                        <td className="py-3 px-4">{app.fromDate} to {app.toDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{app.numberOfDays} Days</td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{app.reason}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setSelectedQueueApp(app); setQueueActionType('Approved'); }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg"
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
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
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

      {/* MODAL: APPLY / EDIT LEAVE APPLICATION */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {editingApplication ? 'Edit Leave Application' : 'Apply For Leave'}
              </h3>
              <button onClick={() => setIsApplyOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              
              {/* Employee Selection */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Select Employee *</label>
                <select
                  required
                  value={applyForm.employeeId}
                  onChange={e => setApplyForm({ ...applyForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer"
                >
                  <option value="">Choose Employee</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.empId})</option>)}
                </select>
              </div>

              {selectedStaffMember && (
                <div className="p-3 bg-slate-50 rounded-2xl border grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-slate-400">Branch:</span> <span className="font-bold">{(selectedStaffMember as any).branch || 'Main Campus'}</span></div>
                  <div><span className="text-slate-400">Department:</span> <span className="font-bold">{selectedStaffMember.department}</span></div>
                  <div><span className="text-slate-400">Designation:</span> <span className="font-bold">{selectedStaffMember.designation}</span></div>
                  <div className="col-span-2 pt-1.5 mt-1 border-t text-emerald-700 font-bold flex gap-3">
                    <span>Casual Leave: {selectedStaffMember.leaveBalance?.casual || 0}</span>
                    <span>Sick Leave: {selectedStaffMember.leaveBalance?.sick || 0}</span>
                    <span>Paid Leave: {selectedStaffMember.leaveBalance?.paid || 0}</span>
                  </div>
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Leave Type *</label>
                <select
                  required
                  value={applyForm.leaveTypeId}
                  onChange={e => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none cursor-pointer"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">From Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.fromDate}
                    onChange={e => setApplyForm({ ...applyForm, fromDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">To Date *</label>
                  <input
                    type="date"
                    required
                    value={applyForm.toDate}
                    disabled={applyForm.isHalfDay}
                    onChange={e => setApplyForm({ ...applyForm, toDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Half Day Option */}
              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
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
                    className="rounded text-emerald-600"
                  />
                  <span>Apply Half Day Leave</span>
                </label>

                {applyForm.isHalfDay && (
                  <select
                    value={applyForm.halfDayPeriod}
                    onChange={e => setApplyForm({ ...applyForm, halfDayPeriod: e.target.value as any })}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-50 border cursor-pointer outline-none"
                  >
                    <option value="First Half">First Half Session</option>
                    <option value="Second Half">Second Half Session</option>
                  </select>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Reason for Request *</label>
                <textarea
                  required
                  placeholder="Explain why you are applying for leave..."
                  value={applyForm.reason}
                  onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border h-20 resize-none outline-none"
                />
              </div>

              {/* Submissions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-bold text-slate-900 text-[11px]">
                  Total Leave duration: <span className="text-purple-600">{requestedDays} Days</span>
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsApplyOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md">
                    {editingApplication ? 'Save Changes' : 'Submit Leave Request'}
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
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
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
                    queueActionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {queueActionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG: VIEW DETAILS */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leave Application Details</h3>
              <button onClick={() => setViewingApplication(null)} className="p-1 text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border">
                <div><span className="text-slate-400">Employee:</span> <p className="font-bold">{viewingApplication.employeeName}</p></div>
                <div><span className="text-slate-400">Emp ID:</span> <p className="font-mono font-bold">{viewingApplication.empId}</p></div>
                <div><span className="text-slate-400">Department:</span> <p className="font-semibold">{viewingApplication.department}</p></div>
                <div><span className="text-slate-400">Leave Type:</span> <p className="font-semibold text-purple-600">{viewingApplication.leaveTypeName}</p></div>
                <div><span className="text-slate-400">Duration:</span> <p className="font-bold">{viewingApplication.numberOfDays} Days</p></div>
                <div><span className="text-slate-400">Period:</span> <p className="font-semibold">{viewingApplication.fromDate} to {viewingApplication.toDate}</p></div>
              </div>

              <div>
                <span className="text-slate-400">Reason for Leave:</span>
                <p className="p-3 bg-slate-50 border rounded-xl italic text-slate-700 mt-1">{viewingApplication.reason}</p>
              </div>

              {viewingApplication.approverRemarks && (
                <div>
                  <span className="text-slate-400">Approver Remarks:</span>
                  <p className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-rose-800 mt-1">{viewingApplication.approverRemarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => handlePrintApplication(viewingApplication)} className="px-4 py-2 text-xs bg-emerald-50 text-emerald-700 font-bold rounded-xl flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Print Slip
              </button>
              <button onClick={() => setViewingApplication(null)} className="px-4 py-2 text-xs bg-slate-100 font-semibold rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCEL MODAL */}
      <ConfirmModal
        isOpen={!!confirmCancelId}
        title="Cancel Leave Application"
        message="Are you sure you want to cancel this pending leave request?"
        onConfirm={confirmCancel}
        onCancel={() => setConfirmCancelId(null)}
      />

      {/* MASTER FORM MODAL: LEAVE TYPES */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">{editingType ? 'Edit Leave Type' : 'Configure Leave Type'}</h3>
            <form onSubmit={handleTypeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Leave Name *</label>
                <input type="text" name="name" required defaultValue={editingType?.name || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Leave Code *</label>
                  <input type="text" name="code" placeholder="e.g. CL" required defaultValue={editingType?.code || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Annual Allowance (Days) *</label>
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsTypeModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 rounded-xl">Save Configuration</button>
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
                <label className="block font-semibold mb-1">Holiday Name *</label>
                <input type="text" name="name" required defaultValue={editingHoliday?.name || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date *</label>
                  <input type="date" name="startDate" required defaultValue={editingHoliday?.startDate || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date *</label>
                  <input type="date" name="endDate" required defaultValue={editingHoliday?.endDate || ''} className="w-full px-3 py-2 rounded-xl bg-slate-50 border outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Holiday Type *</label>
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
                <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 rounded-xl">Save Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default LeaveManagementView;
