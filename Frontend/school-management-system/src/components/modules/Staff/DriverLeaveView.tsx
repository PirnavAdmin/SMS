import React, { useState, useMemo } from 'react';
import {
  CalendarCheck, Plus, FileText, Activity, Layers,
  CheckCircle2, XCircle, Clock, Send, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { LeaveApplication, LeaveType } from '../../../types';

export const DriverLeaveView: React.FC = () => {
  const { user } = useAuth();
  const {
    staff = [],
    driverMasters = [],
    leaveApplications = [],
    addLeaveApplication,
    deleteLeaveApplication,
    leaveTypes = []
  } = useData();
  const { addToast } = useToast();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Identify logged-in Driver
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
        employeeId: fromStaff.employeeId || `DRV-${fromStaff.id}`
      };
    }

    return driverMasters[0] || {
      id: '1',
      driverName: user?.name || 'Nag Sahoo',
      employeeId: 'DRV-001'
    };
  }, [user, driverMasters, staff]);

  // 2. Filter driver's leave applications
  const driverFirstName = (matchedDriver.driverName || '').split(' ')[0].toLowerCase();
  const driverEmpId = String(matchedDriver.employeeId || matchedDriver.id || 'DRV-001').toLowerCase();

  const driverApplications = useMemo(() => {
    return (leaveApplications || []).filter(a => {
      const empId = String(a.employeeId || (a as any).empId || '').toLowerCase();
      const empName = String(a.employeeName || '').toLowerCase();
      const dept = String(a.department || '').toLowerCase();
      const des = String(a.designation || '').toLowerCase();

      return (
        (driverEmpId && (empId === driverEmpId || empId.includes(driverEmpId))) ||
        (driverFirstName && empName.includes(driverFirstName)) ||
        (dept.includes('transport') && des.includes('driver'))
      );
    });
  }, [leaveApplications, driverEmpId, driverFirstName]);

  // 3. Dynamic Leave Balances Calculation
  const leaveBalances = useMemo(() => {
    let casualUsed = 0;
    let sickUsed = 0;
    let paidUsed = 0;

    driverApplications.forEach(app => {
      if (app.status === 'Approved' || app.status === 'Pending') {
        const typeName = (app.leaveTypeName || '').toLowerCase();
        const typeId = (app.leaveTypeId || '').toLowerCase();
        const days = Number(app.daysCount || 1);

        if (typeName.includes('casual') || typeId.includes('cl')) {
          casualUsed += days;
        } else if (typeName.includes('sick') || typeId.includes('sl') || typeName.includes('medical')) {
          sickUsed += days;
        } else if (typeName.includes('paid') || typeName.includes('earned') || typeId.includes('pl')) {
          paidUsed += days;
        }
      }
    });

    return {
      casual: { total: 10, remaining: Math.max(0, 10 - casualUsed), used: casualUsed },
      sick: { total: 10, remaining: Math.max(0, 10 - sickUsed), used: sickUsed },
      paid: { total: 15, remaining: Math.max(0, 15 - paidUsed), used: paidUsed }
    };
  }, [driverApplications]);

  // Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('LT-001');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate days
  const durationDays = useMemo(() => {
    if (!fromDate || !toDate) return 1;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end < start) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate]);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('error', 'Reason Required', 'Please enter a reason for taking leave.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedType = (leaveTypes || []).find(t => t.id === leaveTypeId) || {
        id: leaveTypeId,
        name: leaveTypeId === 'LT-002' ? 'Sick Leave' : leaveTypeId === 'LT-003' ? 'Paid / Earned Leave' : 'Casual Leave',
        code: leaveTypeId === 'LT-002' ? 'SL' : leaveTypeId === 'LT-003' ? 'PL' : 'CL',
        isPaid: true
      };

      const staffMember = staff.find(s =>
        (user?.email && s.email?.toLowerCase() === user.email.toLowerCase()) ||
        (user?.name && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === user.name.toLowerCase().trim()) ||
        String(s.id) === String(matchedDriver.id) ||
        s.empId === matchedDriver.employeeId ||
        (s.designation || '').toLowerCase().includes('driver') ||
        (s.department || '').toLowerCase().includes('transport')
      ) || staff[0];

      const staffId = staffMember?.id || matchedDriver.id || '3';
      const staffEmpId = staffMember?.empId || staffMember?.employeeId || matchedDriver.employeeId || 'STF-2026-0003';
      const staffFullName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : (matchedDriver.driverName || 'Nag Sahoo');

      const newApp: any = {
        id: `LA-DRV-${Date.now()}`,
        employeeId: staffId,
        empId: staffEmpId,
        employeeName: staffFullName,
        department: staffMember?.department || 'Transport Dept',
        designation: staffMember?.designation || 'Driver',
        employeeCategory: 'Non-Teaching Staff',
        leaveTypeId: selectedType.id,
        leaveTypeName: selectedType.name,
        fromDate: fromDate,
        toDate: toDate,
        startDate: fromDate,
        endDate: toDate,
        numberOfDays: durationDays,
        daysCount: durationDays,
        reason: reason.trim(),
        appliedDate: todayStr,
        status: 'Pending',
        branch: 'Main Campus',
        isPaid: (selectedType as any).isPaid !== false,
        requiresDocument: false
      };

      if (addLeaveApplication) {
        addLeaveApplication(newApp);
      }

      addToast('success', 'Leave Submitted', `Applied for ${durationDays} day(s) of ${selectedType.name}. Synced with Admin approval queue.`);
      setIsApplyModalOpen(false);
      setReason('');
      setFromDate(todayStr);
      setToDate(todayStr);
    } catch (err) {
      console.error(err);
      addToast('error', 'Submission Failed', 'Could not submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelApplication = (appId: string) => {
    if (deleteLeaveApplication) {
      deleteLeaveApplication(appId);
      addToast('success', 'Application Cancelled', 'Leave request has been withdrawn.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800 shadow-xs">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Driver Leave Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {matchedDriver.driverName} • ID: {matchedDriver.employeeId || 'DRV-001'} • Annual Leave Entitlement
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {/* 3 Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Casual Leave */}
        <div className="glass-card p-4 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">Casual Leave (CL)</span>
            <span className="p-1 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {leaveBalances.casual.remaining} <span className="text-xs font-bold text-slate-500">/ {leaveBalances.casual.total} Days</span>
            </span>
            <span className="text-xs font-bold text-slate-500">Used: {leaveBalances.casual.used}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (leaveBalances.casual.remaining / leaveBalances.casual.total) * 100)}%` }}
            />
          </div>
        </div>

        {/* Sick Leave */}
        <div className="glass-card p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Sick Leave (SL)</span>
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {leaveBalances.sick.remaining} <span className="text-xs font-bold text-slate-500">/ {leaveBalances.sick.total} Days</span>
            </span>
            <span className="text-xs font-bold text-slate-500">Used: {leaveBalances.sick.used}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (leaveBalances.sick.remaining / leaveBalances.sick.total) * 100)}%` }}
            />
          </div>
        </div>

        {/* Paid Leave */}
        <div className="glass-card p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Earned / Paid Leave (PL)</span>
            <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {leaveBalances.paid.remaining} <span className="text-xs font-bold text-slate-500">/ {leaveBalances.paid.total} Days</span>
            </span>
            <span className="text-xs font-bold text-slate-500">Used: {leaveBalances.paid.used}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (leaveBalances.paid.remaining / leaveBalances.paid.total) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Applied Leave History Table */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          My Leave Applications History ({driverApplications.length})
        </h3>

        {driverApplications.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No leave requests recorded yet</p>
            <p className="text-[11px] text-slate-400">Click &quot;Apply For Leave&quot; above to submit an application to School Administration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Days</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Applied On</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {driverApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      {app.leaveTypeName || 'Casual Leave'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {app.fromDate || app.startDate} to {app.toDate || app.endDate}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-sky-600 dark:text-sky-400">
                      {app.daysCount || 1} day(s)
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={app.reason}>
                      {app.reason || 'Personal leave'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                      {app.appliedDate || todayStr}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          app.status === 'Approved'
                            ? 'success'
                            : app.status === 'Rejected'
                            ? 'error'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {app.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelApplication(app.id)}
                          className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-black cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">Apply For Leave</h3>
                  <p className="text-[11px] text-slate-500">Submit leave request for Admin & HR approval</p>
                </div>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-4 sm:p-5 space-y-4">
              {/* Leave Type Select */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer"
                >
                  <option value="LT-001">Casual Leave (CL) - {leaveBalances.casual.remaining} days left</option>
                  <option value="LT-002">Sick Leave (SL) - {leaveBalances.sick.remaining} days left</option>
                  <option value="LT-003">Paid / Earned Leave (PL) - {leaveBalances.paid.remaining} days left</option>
                  <option value="LT-004">On Duty Leave (OD)</option>
                  <option value="LT-006">Loss of Pay (LOP / Unpaid)</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    From Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                    To Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Duration Banner */}
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-300">Total Leave Duration:</span>
                <span className="font-black text-sky-600 dark:text-sky-400 font-mono">
                  {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason for taking leave..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
                  required
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
