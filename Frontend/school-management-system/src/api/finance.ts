import { apiClient } from './client';
import { FeeHead, DynamicFeeStructure, StudentFeeAssignment, FeePayment } from '../types';

export const fetchFeeHeadsApi = async () => {
  return apiClient('/api/finance/fee-heads', { method: 'GET' });
};

export const createFeeHeadApi = async (data: Omit<FeeHead, 'id'>) => {
  return apiClient('/api/finance/fee-heads', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateFeeHeadApi = async (id: string, data: Partial<FeeHead>) => {
  return apiClient(`/api/finance/fee-heads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteFeeHeadApi = async (id: string) => {
  return apiClient(`/api/finance/fee-heads/${id}`, { method: 'DELETE' });
};

export const fetchDynamicFeeStructuresApi = async () => {
  const response: any = await apiClient('/api/finance/fee-structures', { method: 'GET' });
  const items = Array.isArray(response)
    ? response
    : response?.data?.items || response?.data || [];
  if (Array.isArray(items)) {
    return items.map((item: any) => ({
      id: item.id?.toString() || "",
      academicYear: item.academicYear || "2026-2027",
      branch: item.branch || "Main Campus",
      className: item.className || "",
      section: item.section || "",
      studentCategory: item.studentCategory || "General",
      items: (item.items || []).map((x: any) => ({
        feeHeadId: x.feeHeadId?.toString() || "",
        feeHeadName: x.feeHeadName || "",
        category: x.category || "",
        amount: x.amount ?? 0
      })),
      totalAmount: item.totalAmount ?? 0,
      status: item.status || "Active"
    }));
  }
  return [];
};

export const createDynamicFeeStructureApi = async (data: Omit<DynamicFeeStructure, 'id'>) => {
  const payload = {
    name: `${data.className} Structure`,
    description: `Dynamic fee structure for ${data.className}`,
    targetAudience: data.studentCategory || "All",
    academicYear: data.academicYear || "2026-2027",
    branch: data.branch || "Main Campus",
    className: data.className || "",
    section: data.section || "",
    studentCategory: data.studentCategory || "General",
    totalAmount: data.totalAmount || 0,
    status: data.status || "Active",
    items: data.items || []
  };
  return apiClient('/api/finance/fee-structures', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateDynamicFeeStructureApi = async (id: string, data: Partial<DynamicFeeStructure>) => {
  return apiClient(`/api/finance/fee-structures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteDynamicFeeStructureApi = async (id: string) => {
  return apiClient(`/api/finance/fee-structures/${id}`, { method: 'DELETE' });
};

export const fetchStudentFeeAssignmentsApi = async () => {
  const response: any = await apiClient('/api/finance/fee-assignments', { method: 'GET' });
  const items = Array.isArray(response)
    ? response
    : response?.data?.items || response?.data || [];
  return items;
};

export const createStudentFeeAssignmentApi = async (data: Omit<StudentFeeAssignment, 'id'>) => {
  const payload = {
    studentId: data.studentId || "",
    dynamicFeeStructureId: parseInt(data.feeStructureId) || 0,
    totalAmount: data.baseFeeTotal ?? data.originalFeeTotal ?? 0,
    paidAmount: 0,
    dueAmount: data.baseFeeTotal ?? data.originalFeeTotal ?? 0,
    status: data.status || "Active",
    feePolicy: data.feePolicy || "Full Annual Fee"
  };
  return apiClient('/api/finance/fee-assignments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateStudentFeeAssignmentApi = async (id: string, data: Partial<StudentFeeAssignment>) => {
  return apiClient(`/api/finance/fee-assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteStudentFeeAssignmentApi = async (id: string) => {
  return apiClient(`/api/finance/fee-assignments/${id}`, { method: 'DELETE' });
};

export const fetchFeePaymentsApi = async () => {
  const response: any = await apiClient('/api/finance/fee-payments', { method: 'GET' });
  const items = Array.isArray(response)
    ? response
    : response?.data?.items || response?.data || [];
  if (Array.isArray(items)) {
    return items.map((item: any) => ({
      id: item.id?.toString() || "",
      receiptNo: item.receiptNo || "",
      studentId: item.studentId || "",
      studentName: item.studentName || "",
      className: item.className || "",
      amountPaid: item.amount ?? 0,
      discount: item.discountAmount ?? 0,
      fine: item.fineAmount ?? 0,
      transportFee: item.transportFee ?? 0,
      paymentMode: item.paymentMethod || "Cash",
      transactionId: item.transactionId || "",
      paymentDate: item.paymentDate || "",
      status: item.status || "Completed",
      remarks: item.remarks || ""
    }));
  }
  return [];
};

export const createFeePaymentApi = async (data: Omit<FeePayment, 'id' | 'receiptNo'>) => {
  const payload = {
    receiptNo: (data as any).receiptNo || "",
    studentId: data.studentId || "",
    amount: data.amountPaid ?? (data as any).amount ?? 0,
    discountAmount: data.discount ?? (data as any).discountAmount ?? 0,
    fineAmount: data.fine ?? (data as any).fineAmount ?? 0,
    transportFee: data.transportFee ?? 0,
    transactionId: data.transactionId || "",
    paymentDate: data.paymentDate || new Date().toISOString(),
    paymentMethod: data.paymentMode || (data as any).paymentMethod || "Cash",
    status: data.status || "Completed"
  };
  return apiClient('/api/finance/fee-payments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
