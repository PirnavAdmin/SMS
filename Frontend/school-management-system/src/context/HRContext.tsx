import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import {
  fetchLeaveTypesApi,
  createLeaveTypeApi,
  fetchLeaveApplicationsApi,
  createLeaveApplicationApi,
  updateLeaveApplicationStatusApi,
  fetchLeaveBalancesApi
} from '../api/hr';
import {
  fetchSalaryStructuresApi,
  createSalaryStructureApi,
  updateSalaryStructureApi,
  deleteSalaryStructureApi,
  cloneSalaryStructureApi,
  fetchSalaryAssignmentsApi,
  assignSalaryStructureApi
} from '../api/payroll';
import { LeaveType, LeaveApplication, SalaryStructure, EmployeeSalaryAssignment, PayrollRun } from '../types';

interface HRContextType {
  leaveTypes: LeaveType[];
  leaveApplications: LeaveApplication[];
  salaryStructures: SalaryStructure[];
  employeeSalaryAssignments: EmployeeSalaryAssignment[];
  payrollRuns: PayrollRun[];

  fetchLeaveTypes: () => Promise<void>;
  fetchLeaveApplications: () => Promise<void>;
  fetchSalaryStructures: () => Promise<void>;
  fetchSalaryAssignments: () => Promise<void>;

  addLeaveType: (type: Omit<LeaveType, 'id'>) => Promise<void>;
  updateLeaveType: (id: string, updates: Partial<LeaveType>) => Promise<void>;
  deleteLeaveType: (id: string) => Promise<void>;

  addLeaveApplication: (app: Omit<LeaveApplication, 'id'>) => Promise<void>;
  updateLeaveApplication: (id: string, updates: Partial<LeaveApplication>) => Promise<void>;
  deleteLeaveApplication: (id: string) => Promise<void>;
  updateLeaveApplicationStatus: (id: string, status: LeaveApplication['status'], remarks?: string, approvedBy?: string) => Promise<void>;

  addSalaryStructure: (structure: Omit<SalaryStructure, 'id'>) => Promise<void>;
  updateSalaryStructure: (id: string, updates: Partial<SalaryStructure>) => Promise<void>;
  deleteSalaryStructure: (id: string) => Promise<void>;
  cloneSalaryStructure: (id: string) => Promise<void>;

  assignEmployeeSalaryStructure: (assignment: Omit<EmployeeSalaryAssignment, 'id'>) => Promise<void>;
  updateEmployeeSalaryAssignment: (id: string, updates: Partial<EmployeeSalaryAssignment>) => Promise<void>;

  upsertPayrollRun: (runData: Omit<PayrollRun, 'id'>) => PayrollRun;
  updatePayrollRun: (id: string, updates: Partial<PayrollRun>) => Promise<void>;
  deletePayrollRun: (id: string) => Promise<void>;
}

import { initialLeaveApplications } from '../services/mockData';

const HRContext = createContext<HRContextType | undefined>(undefined);

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(() => {
    try {
      const stored = localStorage.getItem("edu_db_leave_applications");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* Ignored */
    }
    return initialLeaveApplications;
  });
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [employeeSalaryAssignments, setEmployeeSalaryAssignments] = useState<EmployeeSalaryAssignment[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);

  useEffect(() => {
    try {
      const dataStr = JSON.stringify(leaveApplications);
      localStorage.setItem("edu_db_leave_applications", dataStr);
      localStorage.setItem("leave_applications", dataStr);
      localStorage.setItem("sms_leave_applications", dataStr);
    } catch {
      /* Ignored */
    }
  }, [leaveApplications]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await fetchLeaveTypesApi();
      if (response && response.success && response.data) {
        const mapped: LeaveType[] = response.data.map((item: any) => ({
          id: item.leaveTypeId.toString(),
          name: item.name,
          code: item.code,
          annualAllowance: item.annualAllowance,
          carryForward: item.carryForward,
          maxConsecutiveDays: item.maxConsecutiveDays,
          requiresAttachment: item.requiresAttachment,
          isPaid: item.isPaid,
          status: item.status,
        }));
        setLeaveTypes(mapped);
      }
    } catch (err: any) {
      console.warn("Failed to fetch leave types from API", err);
    }
  }, []);

  const fetchLeaveApplications = useCallback(async () => {
    try {
      const normalizeLeaveStatus = (st: string | undefined): LeaveApplication["status"] => {
        if (!st) return "Pending";
        const lower = st.trim().toLowerCase();
        if (lower === "approved") return "Approved";
        if (lower === "rejected") return "Rejected";
        if (lower === "cancelled" || lower === "canceled") return "Cancelled" as any;
        return "Pending";
      };

      const response = await fetchLeaveApplicationsApi();
      if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
        const mapped: LeaveApplication[] = response.data.map((item: any) => ({
          id: item.leaveApplicationId?.toString() || item.id?.toString() || "",
          employeeId: item.staffId?.toString() || item.id?.toString() || "",
          employeeName: item.staffName || item.employeeName || "Staff Member",
          empId: item.empId || item.employeeId,
          department: item.department || "Administration",
          designation: item.designation || "Staff",
          branch: item.branch || "Main Campus",
          employeeCategory: item.employeeCategory === "Teacher" ? "Teacher" : "Staff",
          leaveTypeId: item.leaveTypeId ? item.leaveTypeId.toString() : "1",
          leaveTypeName: item.leaveTypeName || "Leave",
          fromDate: item.fromDate,
          toDate: item.toDate,
          isHalfDay: item.isHalfDay,
          numberOfDays: Number(item.requestedDays || item.numberOfDays || 1),
          reason: item.reason || "",
          attachments: [],
          status: normalizeLeaveStatus(item.status),
          appliedDate: item.appliedDate || new Date().toISOString().split("T")[0],
          approverRemarks: item.approverRemarks || "",
          approvedBy: item.approvedBy || "",
        }));
        setLeaveApplications(prev => {
          const apiIds = new Set(mapped.map(m => m.id));
          const localOnly = prev.filter(p => !apiIds.has(p.id));
          const merged = [...mapped, ...localOnly];
          try {
            const dataStr = JSON.stringify(merged);
            localStorage.setItem("edu_db_leave_applications", dataStr);
            localStorage.setItem("leave_applications", dataStr);
            localStorage.setItem("sms_leave_applications", dataStr);
          } catch {}
          return merged;
        });
      }
    } catch (err: any) {
      console.warn("Failed to fetch leave applications from API", err);
    }
  }, []);

  const fetchSalaryStructures = useCallback(async () => {
    try {
      const response = await fetchSalaryStructuresApi();
      if (response && response.success && response.data) {
        setSalaryStructures(response.data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch salary structures from API", err);
    }
  }, []);

  const fetchSalaryAssignments = useCallback(async () => {
    try {
      const response = await fetchSalaryAssignmentsApi();
      if (response && response.success && response.data) {
        setEmployeeSalaryAssignments(response.data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch salary assignments from API", err);
    }
  }, []);

  // Leave Types CRUD
  const addLeaveType = async (tData: Omit<LeaveType, "id">) => {
    try {
      const response = await createLeaveTypeApi(tData);
      if (response && response.success) {
        addToast("success", "Leave Type Created", "Leave type configuration saved successfully.");
        await fetchLeaveTypes();
      }
    } catch (err: any) {
      console.error("Error adding leave type:", err);
      addToast("error", "API Error", "Failed to configure leave type.");
    }
  };

  const updateLeaveType = async (id: string, updates: Partial<LeaveType>) => {
    setLeaveTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteLeaveType = async (id: string) => {
    setLeaveTypes(prev => prev.filter(t => t.id !== id));
  };

  // Leave Applications CRUD
  const addLeaveApplication = async (appData: Omit<LeaveApplication, "id">) => {
    const id = "LA-2026-" + Math.floor(100 + Math.random() * 900);
    const newApp: LeaveApplication = {
      ...appData,
      id,
      status: appData.status || "Pending",
      appliedDate: appData.appliedDate || new Date().toISOString().split("T")[0],
    };

    setLeaveApplications(prev => {
      const updated = [newApp, ...prev];
      try {
        const dataStr = JSON.stringify(updated);
        localStorage.setItem("edu_db_leave_applications", dataStr);
        localStorage.setItem("leave_applications", dataStr);
        localStorage.setItem("sms_leave_applications", dataStr);
      } catch {}
      return updated;
    });

    try {
      const parsedStaffId = parseInt((appData.employeeId || '').replace(/\D/g, '')) || 1;
      const parsedLeaveTypeId = parseInt((appData.leaveTypeId || '').replace(/\D/g, '')) || 1;

      const payload = {
        staffId: parsedStaffId,
        leaveTypeId: parsedLeaveTypeId,
        fromDate: appData.fromDate,
        toDate: appData.toDate,
        isHalfDay: appData.isHalfDay,
        reason: appData.reason,
      };

      await createLeaveApplicationApi(payload);
    } catch (err: any) {
      console.warn("Backend API leave submission fallback (persisted in local state):", err);
    }
  };

  const updateLeaveApplication = async (id: string, updates: Partial<LeaveApplication>) => {
    setLeaveApplications(prev => {
      const updated = prev.map(app => app.id === id ? { ...app, ...updates } : app);
      try {
        const dataStr = JSON.stringify(updated);
        localStorage.setItem("edu_db_leave_applications", dataStr);
        localStorage.setItem("leave_applications", dataStr);
        localStorage.setItem("sms_leave_applications", dataStr);
      } catch {}
      return updated;
    });
  };

  const deleteLeaveApplication = async (id: string) => {
    setLeaveApplications(prev => {
      const updated = prev.filter(app => app.id !== id);
      try {
        const dataStr = JSON.stringify(updated);
        localStorage.setItem("edu_db_leave_applications", dataStr);
        localStorage.setItem("leave_applications", dataStr);
        localStorage.setItem("sms_leave_applications", dataStr);
      } catch {}
      return updated;
    });
  };

  const updateLeaveApplicationStatus = async (
    id: string,
    status: LeaveApplication["status"],
    remarks?: string,
    approvedBy?: string
  ) => {
    setLeaveApplications(prev => {
      const updated = prev.map(app =>
        app.id === id
          ? {
              ...app,
              status,
              approvedBy: approvedBy || app.approvedBy || "Admin",
              approverRemarks: remarks || app.approverRemarks,
            }
          : app
      );
      try {
        const dataStr = JSON.stringify(updated);
        localStorage.setItem("edu_db_leave_applications", dataStr);
        localStorage.setItem("leave_applications", dataStr);
        localStorage.setItem("sms_leave_applications", dataStr);
      } catch {}
      return updated;
    });

    try {
      const numericId = parseInt(id.replace(/\D/g, '')) || 1;
      const payload = { status, approverRemarks: remarks, approvedBy };
      await updateLeaveApplicationStatusApi(numericId, payload);
    } catch (err: any) {
      console.warn("Backend API status update fallback (persisted in local state):", err);
    }
  };

  // Salary Structure CRUD
  const addSalaryStructure = async (structureData: Omit<SalaryStructure, "id">) => {
    try {
      const response = await createSalaryStructureApi({
        ...structureData,
        branch: structureData.branch || "Main Campus",
      });
      if (response && response.success) {
        addToast("success", "Salary Structure Created", "Salary structure configuration saved successfully.");
        await fetchSalaryStructures();
      }
    } catch (err: any) {
      console.error("Error adding salary structure:", err);
      addToast("error", "API Error", "Failed to save salary structure.");
    }
  };

  const updateSalaryStructure = async (id: string, updates: Partial<SalaryStructure>) => {
    try {
      const response = await updateSalaryStructureApi(parseInt(id), updates);
      if (response && response.success) {
        addToast("success", "Salary Structure Updated", "Salary structure updated successfully.");
        await fetchSalaryStructures();
        await fetchSalaryAssignments();
      }
    } catch (err: any) {
      console.error("Error updating salary structure:", err);
      addToast("error", "API Error", "Failed to update salary structure.");
    }
  };

  const deleteSalaryStructure = async (id: string) => {
    try {
      const response = await deleteSalaryStructureApi(parseInt(id));
      if (response && response.success) {
        addToast("success", "Salary Structure Deleted", "Salary structure removed successfully.");
        await fetchSalaryStructures();
        await fetchSalaryAssignments();
      }
    } catch (err: any) {
      console.error("Error deleting salary structure:", err);
      addToast("error", "API Error", "Failed to delete salary structure.");
    }
  };

  const cloneSalaryStructure = async (id: string) => {
    try {
      const response = await cloneSalaryStructureApi(parseInt(id));
      if (response && response.success) {
        addToast("success", "Salary Structure Cloned", "Structure cloned successfully.");
        await fetchSalaryStructures();
      }
    } catch (err: any) {
      console.error("Error cloning salary structure:", err);
      addToast("error", "API Error", "Failed to clone salary structure.");
    }
  };

  // Assignments
  const assignEmployeeSalaryStructure = async (assignmentData: Omit<EmployeeSalaryAssignment, "id">) => {
    try {
      const payload = {
        employeeId: assignmentData.employeeId,
        salaryStructureId: assignmentData.salaryStructureId,
        effectiveDate: assignmentData.effectiveDate,
        status: assignmentData.status,
        reason: assignmentData.reason,
        salaryOverride: assignmentData.salaryOverride,
        overrideBasicSalary: assignmentData.overrideBasicSalary,
        overrideAllowances: assignmentData.overrideAllowances,
        overrideDeductions: assignmentData.overrideDeductions,
        overrideNetSalary: assignmentData.overrideNetSalary,
      };

      const response = await assignSalaryStructureApi(payload);
      if (response && response.success) {
        addToast("success", "Salary Structure Assigned", "Employee salary assignment saved successfully.");
        await fetchSalaryAssignments();
      }
    } catch (err: any) {
      console.error("Error assigning salary structure:", err);
      addToast("error", "API Error", "Failed to assign salary structure.");
    }
  };

  const updateEmployeeSalaryAssignment = async (id: string, updates: Partial<EmployeeSalaryAssignment>) => {
    setEmployeeSalaryAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // Payroll Runs
  const upsertPayrollRun = (runData: Omit<PayrollRun, "id">): PayrollRun => {
    let savedRun: PayrollRun = {
      ...runData,
      id: "PRUN-" + Math.floor(1000 + Math.random() * 9000),
    };
    setPayrollRuns((prev) => {
      const existing = prev.find(
        (r) => r.employeeId === runData.employeeId && r.payrollMonth === runData.payrollMonth
      );
      if (existing) {
        savedRun = { ...existing, ...runData };
        return prev.map((r) => (r.id === existing.id ? savedRun : r));
      }
      return [...prev, savedRun];
    });
    return savedRun;
  };

  const updatePayrollRun = async (id: string, updates: Partial<PayrollRun>) => {
    setPayrollRuns(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deletePayrollRun = async (id: string) => {
    setPayrollRuns(prev => prev.filter(r => r.id !== id));
  };

  return (
    <HRContext.Provider
      value={{
        leaveTypes,
        leaveApplications,
        salaryStructures,
        employeeSalaryAssignments,
        payrollRuns,
        fetchLeaveTypes,
        fetchLeaveApplications,
        fetchSalaryStructures,
        fetchSalaryAssignments,
        addLeaveType,
        updateLeaveType,
        deleteLeaveType,
        addLeaveApplication,
        updateLeaveApplication,
        deleteLeaveApplication,
        updateLeaveApplicationStatus,
        addSalaryStructure,
        updateSalaryStructure,
        deleteSalaryStructure,
        cloneSalaryStructure,
        assignEmployeeSalaryStructure,
        updateEmployeeSalaryAssignment,
        upsertPayrollRun,
        updatePayrollRun,
        deletePayrollRun
      }}
    >
      {children}
    </HRContext.Provider>
  );
};

export const useHR = () => {
  const context = useContext(HRContext);
  if (context === undefined) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};
