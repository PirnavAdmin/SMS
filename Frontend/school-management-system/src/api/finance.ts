import { apiClient } from './client';
import { FeeHead, DynamicFeeStructure, StudentFeeAssignment, FeePayment } from '../types';

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

export const bulkAssignStudentFeesApi = async (payload: {
  studentIds: string[];
  dynamicFeeStructureId?: number | string;
  className?: string;
  feePolicy?: string;
  totalAmount?: number;
}) => {
  return apiClient('/api/finance/fee-assignments/bulk', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      dynamicFeeStructureId: payload.dynamicFeeStructureId ? parseInt(String(payload.dynamicFeeStructureId)) : undefined
    })
  });
};

export const saveCustomStudentFeeAssignmentApi = async (payload: {
  studentId: string;
  dynamicFeeStructureId?: number | string;
  feePolicy: string;
  admissionDate?: string;
  adjustmentReason?: string;
  totalAmount: number;
  breakdown?: any[];
}) => {
  return apiClient('/api/finance/fee-assignments/custom', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      dynamicFeeStructureId: payload.dynamicFeeStructureId ? parseInt(String(payload.dynamicFeeStructureId)) : undefined
    })
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

// =========================================================================
// NEW FINANCE MODULE ENDPOINTS (Fee Collection, Due Fees, Receipts, Dashboard)
// =========================================================================

export const fetchFeeCollectionStudentsApi = async (params?: {
  search?: string;
  className?: string;
  sectionName?: string;
  studentType?: string;
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.className) query.append('className', params.className);
  if (params?.sectionName) query.append('sectionName', params.sectionName);
  if (params?.studentType) query.append('studentType', params.studentType);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

  const qs = query.toString();
  return apiClient(`/api/finance/fee-collection/students${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchStudentFeeProfileApi = async (studentId: number | string, academicYear = "2026-2027") => {
  return apiClient(`/api/finance/fee-collection/student/${studentId}?academicYear=${encodeURIComponent(academicYear)}`, { method: 'GET' });
};

export const collectFeePaymentApi = async (payload: {
  studentId: number;
  admissionNo: string;
  academicYear?: string;
  totalAmountPaid: number;
  concessionDiscountAmount?: number;
  fineAmount?: number;
  isFineWaived?: boolean;
  paymentMethod: string;
  transactionId?: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  remarks?: string;
  selectedItems?: Array<{
    feeHeadId: string;
    headName: string;
    termId: string;
    termName: string;
    amount: number;
  }>;
}) => {
  return apiClient('/api/finance/fee-collection/collect', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchDueFeesApi = async (params?: {
  className?: string;
  sectionName?: string;
  minDaysOverdue?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.className) query.append('className', params.className);
  if (params?.sectionName) query.append('sectionName', params.sectionName);
  if (params?.minDaysOverdue !== undefined) query.append('minDaysOverdue', params.minDaysOverdue.toString());

  const qs = query.toString();
  return apiClient(`/api/finance/due-fees${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const sendFeeReminderApi = async (payload: {
  studentId: number;
  reminderType?: string;
  customMessage?: string;
}) => {
  return apiClient('/api/finance/due-fees/send-reminder', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchPromotedDuesApi = async () => {
  return apiClient('/api/finance/promoted-students-dues', { method: 'GET' });
};

export const fetchFeeReceiptsRegisterApi = async (params?: {
  search?: string;
  paymentMode?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.paymentMode) query.append('paymentMode', params.paymentMode);
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

  const qs = query.toString();
  return apiClient(`/api/finance/receipts${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchReceiptByNoApi = async (receiptNo: string) => {
  return apiClient(`/api/finance/receipts/${encodeURIComponent(receiptNo)}`, { method: 'GET' });
};

export const cancelReceiptApi = async (receiptNo: string, reason: string) => {
  return apiClient(`/api/finance/receipts/${encodeURIComponent(receiptNo)}/cancel`, {
    method: 'POST',
    body: JSON.stringify(reason)
  });
};

export const fetchFinanceDashboardStatsApi = async () => {
  return apiClient('/api/finance/dashboard', { method: 'GET' });
};

// =========================================================================
// FEE HEADS / FEE TYPES CRUD APIS
// =========================================================================

export const fetchFeeHeadsApi = async (params?: {
  search?: string;
  category?: string;
  frequency?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category) query.append('category', params.category);
  if (params?.frequency) query.append('frequency', params.frequency);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiClient(`/api/finance/fee-heads${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const createFeeHeadApi = async (payload: any) => {
  return apiClient('/api/finance/fee-heads', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateFeeHeadApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/fee-heads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const toggleFeeHeadStatusApi = async (id: number | string) => {
  return apiClient(`/api/finance/fee-heads/${id}/toggle-status`, {
    method: 'PATCH'
  });
};

export const deleteFeeHeadApi = async (id: number | string) => {
  return apiClient(`/api/finance/fee-heads/${id}`, {
    method: 'DELETE'
  });
};

// =========================================================================
// GENERAL LEDGER, TRANSACTIONS, ACCOUNTS, REFUNDS & REPORTS APIS
// =========================================================================

export const fetchFinanceTransactionsApi = async (params?: {
  search?: string;
  type?: string;
  module?: string;
  category?: string;
  paymentMode?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.type) query.append('type', params.type);
  if (params?.module) query.append('module', params.module);
  if (params?.category) query.append('category', params.category);
  if (params?.paymentMode) query.append('paymentMode', params.paymentMode);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

  const qs = query.toString();
  return apiClient(`/api/finance/transactions${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchFinanceTransactionsSummaryApi = async () => {
  return apiClient('/api/finance/transactions/summary', { method: 'GET' });
};

export const createFinanceTransactionApi = async (payload: any) => {
  return apiClient('/api/finance/transactions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const reverseFinanceTransactionApi = async (id: number | string, reason: string) => {
  return apiClient(`/api/finance/transactions/${id}/reverse`, {
    method: 'POST',
    body: JSON.stringify({ reversalReason: reason, authorizedBy: 'Admin' })
  });
};

export const fetchFinancialAccountsApi = async () => {
  return apiClient('/api/finance/accounts', { method: 'GET' });
};

export const createFinancialAccountApi = async (payload: any) => {
  return apiClient('/api/finance/accounts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateFinancialAccountApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteFinancialAccountApi = async (id: number | string) => {
  return apiClient(`/api/finance/accounts/${id}`, {
    method: 'DELETE'
  });
};

export const fetchFinancialCategoriesApi = async (type?: string) => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return apiClient(`/api/finance/categories${qs}`, { method: 'GET' });
};

export const createFinancialCategoryApi = async (payload: any) => {
  return apiClient('/api/finance/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateFinancialCategoryApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteFinancialCategoryApi = async (id: number | string) => {
  return apiClient(`/api/finance/categories/${id}`, {
    method: 'DELETE'
  });
};

export const fetchFinancialBudgetsApi = async (academicYear = '2025-2026') => {
  return apiClient(`/api/finance/budgets?academicYear=${encodeURIComponent(academicYear)}`, { method: 'GET' });
};

export const saveFinancialBudgetApi = async (payload: any) => {
  return apiClient('/api/finance/budgets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateFinancialBudgetApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const fetchFeeRefundRequestsApi = async (status?: string) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient(`/api/finance/refunds${qs}`, { method: 'GET' });
};

export const createFeeRefundRequestApi = async (payload: any) => {
  return apiClient('/api/finance/refunds/request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const processFeeRefundRequestApi = async (id: number | string, payload: { status: string; remarks?: string }) => {
  return apiClient(`/api/finance/refunds/${id}/process`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchFeeScheduleConfigApi = async (academicYear = '2026-2027') => {
  return apiClient(`/api/finance/fee-schedules?academicYear=${encodeURIComponent(academicYear)}`, { method: 'GET' });
};

export const saveFeeScheduleConfigApi = async (payload: any) => {
  return apiClient('/api/finance/fee-schedules', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchFinanceGlobalSettingsApi = async () => {
  return apiClient('/api/finance/settings', { method: 'GET' });
};

export const updateFinanceGlobalSettingsApi = async (payload: any) => {
  return apiClient('/api/finance/settings', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const fetchFinanceReportsSummaryApi = async (academicYear = '2025-2026') => {
  return apiClient(`/api/finance/reports/summary?academicYear=${encodeURIComponent(academicYear)}`, { method: 'GET' });
};

export const fetchDailyCollectionReportApi = async (date?: string) => {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiClient(`/api/finance/reports/daily-collection${qs}`, { method: 'GET' });
};

export const fetchClassWiseCollectionReportApi = async (academicYear = '2025-2026') => {
  return apiClient(`/api/finance/reports/class-wise-collection?academicYear=${encodeURIComponent(academicYear)}`, { method: 'GET' });
};

// =========================================================================
// SCHOLARSHIPS & STUDENT AWARDS APIS
// =========================================================================

export const fetchScholarshipsApi = async (params?: {
  search?: string;
  type?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.type) query.append('type', params.type);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiClient(`/api/finance/scholarships${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchScholarshipByIdApi = async (id: number | string) => {
  return apiClient(`/api/finance/scholarships/${id}`, { method: 'GET' });
};

export const createScholarshipApi = async (payload: any) => {
  return apiClient('/api/finance/scholarships', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateScholarshipApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/scholarships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteScholarshipApi = async (id: number | string) => {
  return apiClient(`/api/finance/scholarships/${id}`, {
    method: 'DELETE'
  });
};

export const fetchStudentScholarshipsApi = async (params?: {
  search?: string;
  className?: string;
  scholarshipId?: number | string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.className) query.append('className', params.className);
  if (params?.scholarshipId) query.append('scholarshipId', params.scholarshipId.toString());

  const qs = query.toString();
  return apiClient(`/api/finance/student-scholarships${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const awardStudentScholarshipApi = async (payload: { studentId: string; scholarshipId: number; remarks?: string }) => {
  return apiClient('/api/finance/student-scholarships', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const revokeStudentScholarshipApi = async (id: number | string) => {
  return apiClient(`/api/finance/student-scholarships/${id}`, {
    method: 'DELETE'
  });
};

// =========================================================================
// DISCOUNTS & STUDENT CONCESSIONS APIS
// =========================================================================

export const fetchDiscountsApi = async (params?: {
  search?: string;
  type?: string;
  mode?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.type) query.append('type', params.type);
  if (params?.mode) query.append('mode', params.mode);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiClient(`/api/finance/discounts${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchDiscountByIdApi = async (id: number | string) => {
  return apiClient(`/api/finance/discounts/${id}`, { method: 'GET' });
};

export const createDiscountApi = async (payload: any) => {
  return apiClient('/api/finance/discounts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateDiscountApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/discounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteDiscountApi = async (id: number | string) => {
  return apiClient(`/api/finance/discounts/${id}`, {
    method: 'DELETE'
  });
};

export const fetchStudentDiscountsApi = async (params?: {
  search?: string;
  className?: string;
  discountId?: number | string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.className) query.append('className', params.className);
  if (params?.discountId) query.append('discountId', params.discountId.toString());

  const qs = query.toString();
  return apiClient(`/api/finance/student-discounts${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const grantStudentDiscountApi = async (payload: { studentId: string; discountId: number; remarks?: string }) => {
  return apiClient('/api/finance/student-discounts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const removeStudentDiscountApi = async (id: number | string) => {
  return apiClient(`/api/finance/student-discounts/${id}`, {
    method: 'DELETE'
  });
};

// =========================================================================
// LATE FINE RULES APIS
// =========================================================================

export const fetchFineRulesApi = async (params?: {
  search?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiClient(`/api/finance/fine-rules${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchFineRuleByIdApi = async (id: number | string) => {
  return apiClient(`/api/finance/fine-rules/${id}`, { method: 'GET' });
};

export const createFineRuleApi = async (payload: any) => {
  return apiClient('/api/finance/fine-rules', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateFineRuleApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/fine-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteFineRuleApi = async (id: number | string) => {
  return apiClient(`/api/finance/fine-rules/${id}`, {
    method: 'DELETE'
  });
};

// =========================================================================
// HOSTEL FEE CONFIGURATIONS APIS
// =========================================================================

export const fetchHostelFeeConfigsApi = async (params?: {
  search?: string;
  hostelId?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.hostelId) query.append('hostelId', params.hostelId);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiClient(`/api/finance/hostel-fees${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchHostelFeeConfigByIdApi = async (id: number | string) => {
  return apiClient(`/api/finance/hostel-fees/${id}`, { method: 'GET' });
};

export const createHostelFeeConfigApi = async (payload: any) => {
  return apiClient('/api/finance/hostel-fees', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateHostelFeeConfigApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/hostel-fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteHostelFeeConfigApi = async (id: number | string) => {
  return apiClient(`/api/finance/hostel-fees/${id}`, {
    method: 'DELETE'
  });
};

// =========================================================================
// UNIFORM FEE CONFIGURATIONS APIS
// =========================================================================

export const fetchUniformFeeConfigsApi = async (params?: {
  search?: string;
  className?: string;
  academicYear?: string;
  status?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.className) query.append('className', params.className);
  if (params?.academicYear) query.append('academicYear', params.academicYear);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiClient(`/api/finance/uniform-fees${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const fetchUniformFeeConfigByIdApi = async (id: number | string) => {
  return apiClient(`/api/finance/uniform-fees/${id}`, { method: 'GET' });
};

export const createUniformFeeConfigApi = async (payload: any) => {
  return apiClient('/api/finance/uniform-fees', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateUniformFeeConfigApi = async (id: number | string, payload: any) => {
  return apiClient(`/api/finance/uniform-fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteUniformFeeConfigApi = async (id: number | string) => {
  return apiClient(`/api/finance/uniform-fees/${id}`, {
    method: 'DELETE'
  });
};







