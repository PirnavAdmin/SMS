// @refresh reset
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { formatCurrency } from "../utils/currency";
import { fetchWorkshopsApi, fetchAssessmentsApi } from "../api/facultyTraining";
import { publishTimetableApi, allocateStudentApi } from "../api/academic";
import {
  fetchStudentAttendanceAllApi,
  saveBulkStudentAttendanceApi,
} from "../api/attendance";
import {
  fetchGradingScaleRulesApi,
  fetchReportCardsApi,
  publishExamResultsApi,
  saveMarksEntryDraftApi,
  submitMarksEntryApi,
} from "../api/examination";
import {
  createAcademicYearApi,
  updateAcademicYearApi,
  deleteAcademicYearApi,
  fetchAcademicYearsApi,
} from "../api/settings";
import {
  generateNextStudentId,
  generateNextAdmissionNo,
  generateNextEmployeeId,
  saveIdSequenceSettings,
} from "../utils/idGenerator";
import {
  getUniformPackageFeeByClass,
  getUniformFeeForClass,
  getItemFeeFromFinanceConfig,
} from "../utils/uniformUtils";
import {
  matchesClassName,
  normalizeClassName,
  compareClassesAscending,
  isClassInRange,
} from "../utils/classSorter";
import { buildTermMonthMap } from "../utils/lateAdmission";
import { generateTermsFromAcademicYear } from "../utils/academicYearTermUtils";
import {
  normalizeStudentType,
  formatStudentType,
} from "../utils/studentTypeUtils";
import {
  createStaffLetterRecord,
  saveStaffLetterRecord,
  syncStaffLettersWithStaffList,
} from "../utils/staffLetterTemplates";
import {
  parseAcademicYearRange,
  validateStudentAge,
} from "../utils/dateValidation";
import {
  Student,
  AcademicHistoryRecord,
  DiscontinuationDetails,
  TransferDetails,
  BranchTransferDetails,
  StudentStatus,
  AcademicYearStatus,
  Staff,
  StaffDocument,
  BankDetails,
  AdmissionApplication,
  FeeStructure,
  FeePolicyType,
  FeeHeadAssignmentBreakdown,
  FeePayment,
  DailyAttendance,
  ExamSetup,
  ExamMark,
  TimetableSlot,
  Homework,
  BookItem,
  BookIssue,
  TransportRoute,
  HostelBlock,
  HostelRoom,
  HostelBed,
  Bus,
  UniformItem,
  CustomRole,
  InventoryItem,
  Announcement,
  Holiday,
  Birthday,
  AuditLog,
  SchoolProfile,
  AcademicYearMaster,
  PromotionHistoryItem,
  SubjectItem,
  ExamSchedule,
  GradeConfig,
  ProcessedResult,
  PeriodSetting,
  TeacherAssignment,
  FeeHead,
  DynamicFeeStructure,
  StudentFeeAssignment,
  Scholarship,
  StudentScholarship,
  Discount,
  StudentDiscount,
  FineRule,
  TransportRoute as ERPTransportRoute,
  StudentTransport,
  HostelMaster,
  StudentHostel,
  Refund,
  FinanceSettings,
  FeeStructureItem,
  RouteMaster,
  PickupPoint,
  VehicleMaster,
  DriverMaster,
  VehicleAssignment,
  VehicleMaintenance,
  FinanceTransportConfig,
  StudentFeeLedger,
  LedgerFeeItem,
  PaymentAllocationItem,
  YearWiseOutstandingItem,
  StudentFeeOutstandingSummary,
  PromotedStudentWithDues,
  RoomTypeMaster,
  RoomMaster,
  StudentHostelAssignment,
  HostelVisitorLog,
  HostelAttendanceLog,
  FinanceHostelConfig,
  UniformCategory,
  UniformSize,
  UniformSupplier,
  UniformInventoryItem,
  StudentUniformIssue,
  FinanceUniformConfig,
  LeaveType,
  LeaveApplication,
  Payslip,
  PayrollConfiguration,
  PayrollComponent,
  SalaryStructure,
  EmployeeSalaryAssignment,
  PayrollRun,
  QuestionPaper,
  SchoolMeeting,
  Department,
  DesignationMaster,
  DocumentRequirementRule,
  FinanceTransaction,
  FinancialAccount,
  FinancialCategory,
  FinancialBudget,
  TransactionAuditLog,
  SchoolEvent,
  UnifiedCalendarEvent,
  EventCategory,
  HolidayType,
  TrainingCategory,
  TrainingParticipant,
  WorkshopTraining,
  AssessmentType,
  AssessmentResult,
  EmployeeAssessment,
  IssuedCertificate,
  AlumniRecord,
  AlumniCurrentStatus,
  CertificateTemplateConfig,
  TcRecord,
  AcademicYearFeeSchedule,
  StudentFeeInstallment,
  FeeScheduleTerm,
  MonthlyDueDateConfig,
  MonthDueDateItem,
} from "../types";

export function normalizeToISODate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  if (!trimmed) return "";

  // 1. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // 2. YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[/.]\d{2}[/.]\d{2}$/.test(trimmed))
    return trimmed.replace(/[/.]/g, "-");

  // 3. MM/DD/YYYY or DD/MM/YYYY
  const parts = trimmed.split(/[-/. ]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const d = parts[2].padStart(2, "0");
      return `${y}-${m}-${d}`;
    } else if (parts[2].length === 4) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const year = parts[2];

      let month: number;
      let day: number;

      if (p2 > 12) {
        // MM/DD/YYYY format (e.g. 08/20/2026 -> month=8, day=20)
        month = p1;
        day = p2;
      } else if (p1 > 12) {
        // DD/MM/YYYY format (e.g. 20/08/2026 -> day=20, month=8)
        day = p1;
        month = p2;
      } else {
        // Ambiguous (e.g. 05/06/2026) -> try JS native parse first
        const parsedJs = new Date(trimmed);
        if (!isNaN(parsedJs.getTime())) {
          const y = parsedJs.getFullYear();
          const m = String(parsedJs.getMonth() + 1).padStart(2, "0");
          const d = String(parsedJs.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        }
        month = p1;
        day = p2;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return trimmed;
}

export function normalizeAcademicYear(dateOrAy?: string | null): string {
  if (!dateOrAy || typeof dateOrAy !== "string") return "";
  const trimmed = dateOrAy.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/\s+/g, "");
  const match = cleaned.match(/^(\d{4})[-/](\d{2,4})$/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    let endYear = parseInt(match[2], 10);
    if (endYear < 100) {
      const century = Math.floor(startYear / 100) * 100;
      endYear = century + endYear;
    }
    return `${startYear}-${endYear}`;
  }
  return cleaned;
}

export function matchesAcademicYear(
  ay1?: string | null,
  ay2?: string | null,
): boolean {
  if (!ay1 || !ay2) return true;
  return normalizeAcademicYear(ay1) === normalizeAcademicYear(ay2);
}

export function normalizeInstId(id?: string | null): string {
  if (!id) return "";
  let norm = id.replace(/(\d{4})-(\d{2})(?!\d)/g, (match, p1, p2) => {
    const start = parseInt(p1, 10);
    const end = parseInt(p2, 10);
    const century = Math.floor(start / 100) * 100;
    return `${start}-${century + end}`;
  });
  return norm.toLowerCase().trim();
}

export function matchesInstallmentId(
  id1?: string | null,
  id2?: string | null,
): boolean {
  if (!id1 || !id2) return false;
  const n1 = normalizeInstId(id1);
  const n2 = normalizeInstId(id2);
  if (n1 === n2) return true;
  if (n1.length > 5 && n2.length > 5 && (n1.includes(n2) || n2.includes(n1)))
    return true;
  return false;
}
import {
  initialCertificateTemplates,
  initialStudents,
  initialStaff,
  initialAdmissions,
  initialFeeStructures,
  initialFeePayments,
  initialExamSetups,
  initialExamMarks,
  initialHomework,
  initialBooks,
  initialBookIssues,
  initialTransportRoutes,
  initialHostelBlocks,
  initialHostelRooms,
  initialHostelBeds,
  initialBuses,
  initialUniforms,
  initialCustomRoles,
  initialInventory,
  initialAnnouncements,
  initialHolidays,
  initialBirthdays,
  initialAuditLogs,
  initialSchoolProfile,
  initialAcademicYears,
  initialSubjects,
  initialFeeHeads,
  initialDynamicFeeStructures,
  initialStudentFeeAssignments,
  initialScholarships,
  initialStudentScholarships,
  initialDiscounts,
  initialStudentDiscounts,
  initialFineRules,
  initialERPTransportRoutes,
  initialStudentTransports,
  initialHostelMasters,
  initialStudentHostels,
  initialRefunds,
  initialFinanceSettings,
  initialRouteMasters,
  initialPickupPoints,
  initialVehicleMasters,
  initialDriverMasters,
  initialVehicleAssignments,
  initialVehicleMaintenances,
  initialFinanceTransportConfigs,
  initialStudentFeeLedgers,
  initialRoomTypeMasters,
  initialRoomMasters,
  initialStudentHostelAssignments,
  initialHostelVisitorLogs,
  initialHostelAttendanceLogs,
  initialFinanceHostelConfigs,
  initialUniformCategories,
  initialUniformSizes,
  initialUniformSuppliers,
  initialUniformInventory,
  initialStudentUniformIssues,
  initialFinanceUniformConfigs,
  initialLeaveTypes,
  initialLeaveApplications,
  initialPayslips,
  initialPayrollConfigurations,
  initialPayrollComponents,
  initialSalaryStructures,
  initialEmployeeSalaryAssignments,
  initialPayrollRuns,
  initialQuestionPapers,
  initialMeetings,
  initialDepartments,
  initialDesignations,
} from "../services/mockData";
import {
  fetchAdmissionsApi,
  createAdmissionApi,
  updateAdmissionApi,
  updateAdmissionStatusApi,
  deleteAdmissionApi,
  enrollAdmissionApi,
  rejectAdmissionApi,
} from "../api/admission";
import * as TransportAPI from "../api/transport";
import * as FinanceAPI from "../api/finance";
import {
  getHostelBlocks,
  getRooms,
  getAllocations,
  formatRoomNumber,
} from "../api/hostel";
import {
  BusAttendantMaster,
  initialBusAttendants,
  resolveAssignedStudentsForTrip,
} from "../components/modules/Transport/transportData";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import {
  fetchClassesApi,
  createClassApi,
  updateClassApi,
  deleteClassApi,
  fetchDepartmentsApi,
  createDepartmentApi,
  updateDepartmentApi,
  fetchDesignationsApi,
  createDesignationApi,
  updateDesignationApi,
  fetchAcademicSubjectsApi,
  fetchAcademicPeriodsApi,
  savePeriodApi,
  deletePeriodApi,
  fetchTimetableForClassSectionApi,
  mapSubjectApi,
  assignTeacherApi,
  saveTimetableSlotApi,
  deleteTimetableSlotApi,
  fetchTimetableGridApi,
  fetchClassTeacherAssignmentsApi,
  fetchAllTimetablesApi,
  clearClassTimetableApi,
} from "../api/academic";
import {
  fetchStaffApi,
  createStaffApi,
  updateStaffApi,
  deleteStaffApi,
} from "../api/staff";
import {
  fetchLeaveTypesApi,
  createLeaveTypeApi,
  fetchLeaveApplicationsApi,
  createLeaveApplicationApi,
  updateLeaveApplicationStatusApi,
  deleteLeaveApplicationApi,
  fetchLeaveBalancesApi,
} from "../api/hr";
import {
  fetchSalaryStructuresApi,
  createSalaryStructureApi,
  updateSalaryStructureApi,
  deleteSalaryStructureApi,
  cloneSalaryStructureApi,
  fetchSalaryAssignmentsApi,
  assignSalaryStructureApi,
  fetchPayrollConfigurationsApi,
  createPayrollConfigurationApi,
  updatePayrollConfigurationApi,
  deletePayrollConfigurationApi,
  activatePayrollConfigurationApi,
  deactivatePayrollConfigurationApi,
  fetchPayrollComponentsApi,
  createPayrollComponentApi,
  updatePayrollComponentApi,
  deletePayrollComponentApi,
  fetchPayrollRunsApi,
  upsertPayrollRunApi,
  updatePayrollRunApi,
  deletePayrollRunApi,
  fetchPayslipsApi,
  createPayslipApi,
} from "../api/payroll";
import {
  fetchDailyStaffAttendanceApi,
  fetchMonthlyStaffAttendanceApi,
  markBulkStaffAttendanceApi,
  fetchStudentAttendanceRegisterApi,
} from "../api/attendance";
import {
  fetchBooksApi,
  fetchIssuedBooksApi,
  issueBookApi,
  returnBookApi,
  createBookApi,
  updateBookApi,
  deleteBookApi,
} from "../api/library";
import {
  fetchHomeworkApi,
  createHomeworkApi,
  updateHomeworkApi,
  deleteHomeworkApi,
} from "../api/homework";
import {
  fetchInventoryItemsApi,
  fetchInventoryCategoriesApi,
  createInventoryItemApi,
  updateInventoryItemApi,
  deleteInventoryItemApi,
} from "../api/inventory";
import {
  fetchUniformCategoriesApi,
  fetchUniformSizesApi,
  fetchUniformSuppliersApi,
  fetchUniformTypesApi,
  fetchUniformDistributionsApi,
  issueUniformApi,
  adjustUniformStockApi,
  deleteUniformDistributionApi,
  returnUniformApi,
  exchangeUniformApi,
  createUniformTypeApi,
  updateUniformTypeApi,
  deleteUniformTypeApi,
  createUniformCategoryApi,
  updateUniformCategoryApi,
  deleteUniformCategoryApi,
  createUniformSizeApi,
  updateUniformSizeApi,
  deleteUniformSizeApi,
  createUniformSupplierApi,
  updateUniformSupplierApi,
  deleteUniformSupplierApi,
  fetchUniformDashboardApi,
} from "../api/uniform";
import {
  fetchStudentsApi,
  fetchStudentByIdApi,
  createStudentApi,
  updateStudentApi,
  updateStudentStatusApi,
  deleteStudentApi,
} from "../api/students";
import {
  fetchSchoolEventsApi,
  createSchoolEventApi,
  updateSchoolEventApi,
  deleteSchoolEventApi,
  fetchHolidaysApi,
  createHolidayApi,
  updateHolidayApi,
  deleteHolidayApi,
} from "../api/events";
import {
  fetchNotificationsApi,
  createNotificationApi,
  updateNotificationApi,
  deleteNotificationApi,
  fetchMeetingsApi,
  scheduleMeetingApi,
  updateMeetingApi,
  deleteMeetingApi,
} from "../api/communication";
import {
  fetchBranchesApi,
  fetchSchoolSettingsApi,
  updateSchoolSettingsApi,
  fetchIdSequenceSettingsApi,
} from "../api/settings";

export interface AcademicClass {
  id: string;
  name: string;
  sections: string[];
  sectionTeachers?: Record<string, string>;
  teacher: string;
  subjects: string[];
  weeklyPeriods?: Record<string, number>;
  sectionDetails?: Record<string, any>;
  status?: string;
  campusLocation?: string;
  branch?: string;
  minimumAge?: number;
}

const initialClasses: AcademicClass[] = [];

const defaultPeriodSettings: PeriodSetting[] = [];
const defaultTeacherAssignments: TeacherAssignment[] = [];
export interface StudentCalculationResult {
  student: Student;
  assignment?: StudentFeeAssignment;
  baseFee: number;
  assignedFeeHeads: FeeStructureItem[];
  transportFee: number;
  transportDetails?: StudentTransport;
  hostelFee: number;
  hostelDetails?: StudentHostel;
  uniformFee: number;
  previousDue: number;
  scholarshipDeduction: number;
  scholarshipsApplied: StudentScholarship[];
  discountDeduction: number;
  discountsApplied: StudentDiscount[];
  fineAmount: number;
  fineDetails?: { ruleName: string; daysOverdue: number; amount: number };
  totalPayable: number;
  paidAmount: number;
  dueBalance: number;
  paymentHistory: FeePayment[];
  scholarshipId?: string;
  scholarshipName?: string;
  scholarshipDescription?: string;
  discountId?: string;
  discountName?: string;
  discountDescription?: string;
}

export interface CapacityCheckResult {
  vehicle?: VehicleMaster;
  totalCapacity: number;
  assignedCount: number;
  availableSeats: number;
  isFull: boolean;
}

interface DataContextType {
  schoolProfile: SchoolProfile;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;
  academicYears: AcademicYearMaster[];
  addAcademicYear: (ay: Omit<AcademicYearMaster, "id">) => void;
  updateAcademicYear: (
    id: string,
    updates: Partial<AcademicYearMaster>,
  ) => void;
  deleteAcademicYear: (id: string) => void;
  setCurrentAcademicYear: (id: string) => void;
  students: Student[];
  totalStudentCount: number;
  addStudent: (student: Omit<Student, "id">) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  promoteStudent: (
    id: string,
    targetClass: string,
    targetSection?: string,
    targetYear?: string,
    targetBranch?: string,
  ) => void;
  transferStudent: (id: string, reason: string) => void;
  completeStudent: (
    id: string,
    completionAcademicYear?: string,
    currentStatus?: AlumniCurrentStatus,
  ) => void;
  getHighestClass: () => string;
  addAcademicHistoryRecord: (
    studentId: string,
    record: AcademicHistoryRecord,
  ) => void;
  discontinueStudent: (
    studentId: string,
    details: DiscontinuationDetails,
  ) => void;
  transferOutStudent: (studentId: string, details: TransferDetails) => void;
  branchTransferStudent: (
    studentId: string,
    details: BranchTransferDetails,
  ) => void;
  importHistoricalAcademicData: (records: any[]) => {
    successCount: number;
    errorCount: number;
    errors: string[];
  };
  importHistoricalAttendanceData: (records: any[]) => {
    successCount: number;
    errorCount: number;
    errors: string[];
  };
  importHistoricalExamData: (records: any[]) => {
    successCount: number;
    errorCount: number;
    errors: string[];
  };
  importHistoricalFeeData: (records: any[]) => {
    successCount: number;
    errorCount: number;
    errors: string[];
  };

  alumniRecords: AlumniRecord[];
  addAlumniRecord: (
    record: Omit<AlumniRecord, "id" | "createdDate">,
  ) => AlumniRecord;
  updateAlumniStatus: (
    id: string,
    currentStatus: AlumniCurrentStatus,
    details?: { higherEducationDetail?: string; organizationCompany?: string },
  ) => void;

  staff: Staff[];
  addStaff: (staffMember: Omit<Staff, "id">) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addStaffDocument: (staffId: string, doc: Omit<StaffDocument, "id">) => void;
  deleteStaffDocument: (staffId: string, docId: string) => void;
  updateBankDetails: (staffId: string, bankDetails: BankDetails) => void;
  documentRequirementRules: DocumentRequirementRule[];
  getRequiredDocuments: (department?: string, designation?: string) => string[];
  addDocumentRequirementRule: (
    rule: Omit<DocumentRequirementRule, "id">,
  ) => void;
  updateDocumentRequirementRule: (
    id: string,
    updates: Partial<DocumentRequirementRule>,
  ) => void;
  deleteDocumentRequirementRule: (id: string) => void;
  verifyStaffDocument: (
    staffId: string,
    docId: string,
    status: "Pending Verification" | "Verified" | "Rejected",
    remarks?: string,
  ) => void;
  replaceStaffDocument: (
    staffId: string,
    docId: string,
    newFileUrl: string,
    replacedBy?: string,
    remarks?: string,
  ) => void;

  admissions: AdmissionApplication[];
  addAdmission: (
    app: Omit<AdmissionApplication, "id" | "applicationNo">,
    options?: { silent?: boolean },
  ) => Promise<any>;
  updateAdmission: (id: string, updates: Partial<AdmissionApplication>) => void;
  deleteAdmission: (id: string) => void;
  updateAdmissionStatus: (
    id: string,
    status: AdmissionApplication["status"],
  ) => Promise<string | null>;
  fetchAdmissions: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchAcademicClasses: (force?: boolean) => Promise<void>;
  fetchSubjects: (force?: boolean) => Promise<void>;
  fetchPeriods: (force?: boolean) => Promise<void>;
  fetchTimetables: (force?: boolean) => Promise<void>;
  fetchDepartments: (force?: boolean) => Promise<void>;
  fetchDesignations: (force?: boolean) => Promise<void>;
  fetchBooks: () => Promise<void>;
  fetchBookIssues: () => Promise<void>;
  fetchHomeworkData: () => Promise<void>;
  fetchStudentAttendanceData: (query?: any) => Promise<void>;
  saveBulkStudentAttendance: (payload: any) => Promise<any>;
  fetchInventoryData: () => Promise<void>;
  fetchUniformData: () => Promise<void>;
  fetchFinanceData: () => Promise<void>;
  fetchFacultyTrainingData: () => Promise<void>;
  fetchLeaveTypes: () => Promise<void>;
  fetchLeaveApplications: () => Promise<void>;
  fetchLeaveBalances: () => Promise<void>;
  fetchSalaryStructures: () => Promise<void>;
  fetchSalaryAssignments: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  branches: any[];

  academicClasses: AcademicClass[];
  rawClasses: any[];
  addAcademicClass: (cls: Omit<AcademicClass, "id">) => Promise<void>;
  updateAcademicClass: (
    id: string,
    updates: Partial<AcademicClass>,
  ) => Promise<void>;
  deleteAcademicClass: (id: string) => Promise<void>;

  subjects: SubjectItem[];
  addSubject: (subject: Omit<SubjectItem, "id">) => void;
  updateSubject: (id: string, updates: Partial<SubjectItem>) => void;
  deleteSubject: (id: string) => void;

  buses: Bus[];
  addBus: (bus: Omit<Bus, "id">) => void;
  updateBus: (id: string, updates: Partial<Bus>) => void;
  deleteBus: (id: string) => void;

  hostelBlocks: HostelBlock[];
  addHostelBlock: (block: Omit<HostelBlock, "id">) => void;
  updateHostelBlock: (id: string, updates: Partial<HostelBlock>) => void;
  deleteHostelBlock: (id: string) => void;

  hostelBeds: HostelBed[];
  addHostelBed: (bed: Omit<HostelBed, "id">) => void;
  updateHostelBed: (id: string, updates: Partial<HostelBed>) => void;
  deleteHostelBed: (id: string) => void;

  uniforms: UniformItem[];
  addUniform: (item: Omit<UniformItem, "id">) => void;
  updateUniform: (id: string, updates: Partial<UniformItem>) => void;
  deleteUniform: (id: string) => void;

  customRoles: CustomRole[];
  addCustomRole: (role: Omit<CustomRole, "id">) => void;
  updateCustomRole: (id: string, updates: Partial<CustomRole>) => void;
  deleteCustomRole: (id: string) => void;

  feeStructures: FeeStructure[];
  addFeeStructure: (feeStruct: Omit<FeeStructure, "id">) => void;
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => void;
  deleteFeeStructure: (id: string) => void;

  feePayments: FeePayment[];
  addFeePayment: (payment: Omit<FeePayment, "id" | "receiptNo">) => FeePayment;

  // ERP Finance System Additions
  feeHeads: FeeHead[];
  addFeeHead: (head: Omit<FeeHead, "id">) => void;
  updateFeeHead: (id: string, updates: Partial<FeeHead>) => void;
  deleteFeeHead: (id: string) => void;
  toggleFeeHeadStatus: (id: string) => void;

  dynamicFeeStructures: DynamicFeeStructure[];
  allDynamicFeeStructures: DynamicFeeStructure[];
  addDynamicFeeStructure: (dfs: Omit<DynamicFeeStructure, "id">) => void;
  updateDynamicFeeStructure: (
    id: string,
    updates: Partial<DynamicFeeStructure>,
  ) => void;
  deleteDynamicFeeStructure: (id: string) => void;

  studentFeeAssignments: StudentFeeAssignment[];
  assignFeeStructure: (studentId: string, feeStructureId: string) => void;
  assignCustomFeeStructure: (
    studentId: string,
    feeStructureId: string,
    feePolicy: FeePolicyType,
    customBreakdown?: FeeHeadAssignmentBreakdown[],
    adjustmentReason?: string,
    admissionDate?: string,
  ) => void;
  bulkAssignFeeStructure: (
    studentIds: string[],
    feeStructureId: string,
  ) => void;
  updateStudentFeeAssignment: (
    id: string,
    updates: Partial<StudentFeeAssignment>,
  ) => void;
  removeStudentFeeAssignment: (id: string) => void;

  scholarships: Scholarship[];
  addScholarship: (sch: Omit<Scholarship, "id">) => void;
  updateScholarship: (id: string, updates: Partial<Scholarship>) => void;
  deleteScholarship: (id: string) => void;

  studentScholarships: StudentScholarship[];
  assignScholarshipToStudent: (
    studentId: string,
    scholarshipId: string,
  ) => void;
  revokeStudentScholarship: (id: string) => void;

  discounts: Discount[];
  addDiscount: (disc: Omit<Discount, "id">) => Promise<void> | void;
  updateDiscount: (
    id: string,
    updates: Partial<Discount>,
  ) => Promise<void> | void;
  deleteDiscount: (id: string) => Promise<void> | void;

  studentDiscounts: StudentDiscount[];
  assignDiscountToStudent: (
    studentId: string,
    discountId: string,
  ) => Promise<void> | void;
  removeStudentDiscount: (id: string) => Promise<void> | void;

  fineRules: FineRule[];
  addFineRule: (rule: Omit<FineRule, "id">) => void;
  updateFineRule: (id: string, updates: Partial<FineRule>) => void;
  deleteFineRule: (id: string) => void;

  erpTransportRoutes: ERPTransportRoute[];
  addERPTransportRoute: (route: Omit<ERPTransportRoute, "id">) => void;
  updateERPTransportRoute: (
    id: string,
    updates: Partial<ERPTransportRoute>,
  ) => void;
  deleteERPTransportRoute: (id: string) => void;

  studentTransports: StudentTransport[];
  assignStudentTransport: (st: Omit<StudentTransport, "id">) => void;
  removeStudentTransport: (id: string) => void;

  // Master Finance Ledger & Transactions System
  financeTransactions: FinanceTransaction[];
  addFinanceTransaction: (
    txn: Omit<FinanceTransaction, "id" | "transactionId">,
  ) => FinanceTransaction;
  reverseFinanceTransaction: (
    transactionId: string,
    reason: string,
    user: string,
  ) => void;
  cancelFinanceTransaction: (
    transactionId: string,
    reason: string,
    user: string,
  ) => void;

  financialAccounts: FinancialAccount[];
  addFinancialAccount: (account: Omit<FinancialAccount, "id">) => void;
  updateFinancialAccount: (
    id: string,
    updates: Partial<FinancialAccount>,
  ) => void;
  deleteFinancialAccount: (id: string) => void;

  financialCategories: FinancialCategory[];
  addFinancialCategory: (category: Omit<FinancialCategory, "id">) => void;
  updateFinancialCategory: (
    id: string,
    updates: Partial<FinancialCategory>,
  ) => void;
  deleteFinancialCategory: (id: string) => void;

  financialBudgets: FinancialBudget[];
  addFinancialBudget: (
    budget: Omit<FinancialBudget, "id" | "consumedAmount" | "remainingAmount">,
  ) => Promise<FinancialBudget>;
  updateFinancialBudget: (
    id: string,
    allocatedAmount: number,
    extra?: Partial<FinancialBudget>,
  ) => Promise<boolean>;
  deleteFinancialBudget: (id: string) => Promise<boolean>;

  // Academic Calendar & School Events System
  schoolEvents: SchoolEvent[];
  addSchoolEvent: (event: Omit<SchoolEvent, "id">) => SchoolEvent;
  updateSchoolEvent: (id: string, updates: Partial<SchoolEvent>) => void;
  deleteSchoolEvent: (id: string) => void;

  hostelMasters: HostelMaster[];
  addHostelMaster: (h: Omit<HostelMaster, "id">) => void;
  updateHostelMaster: (id: string, updates: Partial<HostelMaster>) => void;
  deleteHostelMaster: (id: string) => void;

  roomTypeMasters: RoomTypeMaster[];
  addRoomTypeMaster: (rt: Omit<RoomTypeMaster, "id">) => void;
  updateRoomTypeMaster: (id: string, updates: Partial<RoomTypeMaster>) => void;
  deleteRoomTypeMaster: (id: string) => void;

  roomMasters: RoomMaster[];
  addRoomMaster: (rm: Omit<RoomMaster, "id">) => void;
  updateRoomMaster: (id: string, updates: Partial<RoomMaster>) => void;
  deleteRoomMaster: (id: string) => void;

  studentHostelAssignments: StudentHostelAssignment[];
  assignStudentHostelRoom: (sha: Omit<StudentHostelAssignment, "id">) => void;
  updateStudentHostelAssignment: (
    id: string,
    updates: Partial<StudentHostelAssignment>,
  ) => void;
  deleteStudentHostelAssignment: (id: string) => void;

  hostelVisitorLogs: HostelVisitorLog[];
  addHostelVisitorLog: (vl: Omit<HostelVisitorLog, "id">) => void;
  updateHostelVisitorLogStatus: (
    id: string,
    status: "In" | "Out",
    outTime?: string,
  ) => void;

  hostelAttendanceLogs: HostelAttendanceLog[];
  recordHostelAttendance: (att: Omit<HostelAttendanceLog, "id">) => void;

  financeHostelConfigs: FinanceHostelConfig[];
  addFinanceHostelConfig: (c: Omit<FinanceHostelConfig, "id">) => void;
  updateFinanceHostelConfig: (
    id: string,
    updates: Partial<FinanceHostelConfig>,
  ) => void;
  deleteFinanceHostelConfig: (id: string) => void;

  studentHostels: StudentHostel[];
  assignStudentHostel: (sh: Omit<StudentHostel, "id">) => void;
  removeStudentHostel: (id: string) => void;

  refunds: Refund[];
  addRefund: (r: Omit<Refund, "id" | "refundNo">) => void;
  updateRefundStatus: (
    id: string,
    status: Refund["status"],
    approvedBy?: string,
  ) => void;

  financeSettings: FinanceSettings;
  updateFinanceSettings: (settings: Partial<FinanceSettings>) => void;

  // FINANCE -> TRANSPORT CONFIGURATION MASTER
  financeTransportConfigs: FinanceTransportConfig[];
  addFinanceTransportConfig: (c: Omit<FinanceTransportConfig, "id">) => void;
  updateFinanceTransportConfig: (
    id: string,
    updates: Partial<FinanceTransportConfig>,
  ) => void;
  deleteFinanceTransportConfig: (id: string) => void;

  // STUDENT PERMANENT FEE LEDGER ENGINE
  studentFeeLedgers: StudentFeeLedger[];
  academicYearFeeSchedules: AcademicYearFeeSchedule[];
  setAcademicYearFeeSchedules: React.Dispatch<
    React.SetStateAction<AcademicYearFeeSchedule[]>
  >;
  studentFeeInstallments: StudentFeeInstallment[];
  setStudentFeeInstallments: React.Dispatch<
    React.SetStateAction<StudentFeeInstallment[]>
  >;
  getStudentInstallmentSummary: (
    studentId: string,
    targetAcademicYear?: string,
  ) => {
    currentAcademicYear: string;
    currentTerm: string;
    termDueDate: string;
    currentTermDue: number;
    previousTermDue: number;
    overdueAmount: number;
    upcomingAmount: number;
    totalOutstanding: number;
  };
  generateInstallmentsForStudent: (
    studentId: string,
    academicYear: string,
    assignment: StudentFeeAssignment | undefined,
    ledger: StudentFeeLedger,
  ) => StudentFeeInstallment[];
  generateStudentFeeLedger: (
    studentId: string,
    optStudentOrYear?: Student | string,
    targetAcademicYear?: string,
  ) => StudentFeeLedger;
  recalculateStudentFeeLedger: (
    studentId: string,
    targetAcademicYear?: string,
  ) => StudentFeeLedger;
  getStudentFeeLedger: (
    studentId: string,
    optStudentOrYear?: Student | AdmissionApplication | string,
    targetAcademicYear?: string,
  ) => StudentFeeLedger;
  getDynamicTransportFee: (activeTa: any) => number;
  getStudentFeeOutstandingSummary: (
    studentId: string,
  ) => StudentFeeOutstandingSummary;
  getPromotedStudentsWithPreviousDues: (
    targetAcademicYear?: string,
  ) => PromotedStudentWithDues[];

  calculateStudentPayableFee: (
    studentId: string,
  ) => StudentCalculationResult | null;
  applyScholarshipToStudent: (
    studentId: string,
    scholarshipId: string,
  ) => StudentFeeLedger;
  removeScholarshipFromStudent: (studentId: string) => StudentFeeLedger;
  applyDiscountToStudent: (
    studentId: string,
    discountId: string,
  ) => StudentFeeLedger;
  removeDiscountFromStudent: (studentId: string) => StudentFeeLedger;

  // TRANSPORT ERP MODULE ADDITIONS
  routeMasters: RouteMaster[];
  addRouteMaster: (r: Omit<RouteMaster, "id">) => Promise<void>;
  updateRouteMaster: (
    id: string,
    updates: Partial<RouteMaster>,
  ) => Promise<void>;
  deleteRouteMaster: (id: string) => Promise<void>;

  pickupPoints: PickupPoint[];
  addPickupPoint: (p: Omit<PickupPoint, "id">) => Promise<void>;
  updatePickupPoint: (
    id: string,
    updates: Partial<PickupPoint>,
  ) => Promise<void>;
  deletePickupPoint: (id: string) => Promise<void>;

  vehicleMasters: VehicleMaster[];
  addVehicleMaster: (v: Omit<VehicleMaster, "id">) => Promise<void>;
  updateVehicleMaster: (
    id: string,
    updates: Partial<VehicleMaster>,
  ) => Promise<void>;
  deleteVehicleMaster: (id: string) => Promise<void>;

  driverMasters: DriverMaster[];
  addDriverMaster: (d: Omit<DriverMaster, "id">) => Promise<void>;
  updateDriverMaster: (
    id: string,
    updates: Partial<DriverMaster>,
  ) => Promise<void>;
  deleteDriverMaster: (id: string) => Promise<void>;

  busAttendants: BusAttendantMaster[];
  addBusAttendant: (a: Omit<BusAttendantMaster, "id">) => Promise<void>;
  updateBusAttendant: (
    id: string,
    updates: Partial<BusAttendantMaster>,
  ) => Promise<void>;
  deleteBusAttendant: (id: string) => Promise<void>;

  vehicleAssignments: VehicleAssignment[];
  assignVehicleRouteDriver: (
    va: Omit<VehicleAssignment, "id">,
  ) => Promise<void>;
  updateVehicleAssignment: (
    id: string,
    updates: Partial<VehicleAssignment>,
  ) => Promise<void>;
  removeVehicleAssignment: (id: string) => Promise<void>;

  vehicleMaintenances: VehicleMaintenance[];
  addVehicleMaintenance: (vm: Omit<VehicleMaintenance, "id">) => Promise<void>;
  updateVehicleMaintenance: (
    id: string,
    updates: Partial<VehicleMaintenance>,
  ) => Promise<void>;
  deleteVehicleMaintenance: (id: string) => Promise<void>;

  checkVehicleCapacity: (vehicleId: string) => CapacityCheckResult;

  attendance: DailyAttendance[];
  markAttendance: (records: DailyAttendance[]) => Promise<boolean>;
  fetchDailyAttendance?: (date: string, department?: string) => Promise<void>;
  fetchMonthlyAttendance?: (
    month: number,
    year: number,
    department?: string,
  ) => Promise<void>;
  lastAttendancePayload?: any;
  lastAttendanceResponse?: any;
  todayStudentAttendanceSummary: any;
  fetchTodayStudentAttendanceSummary: () => Promise<void>;

  exams: ExamSetup[];
  examMarks: ExamMark[];
  addExam: (exam: Omit<ExamSetup, "id">) => void;
  updateExam: (id: string, updates: Partial<ExamSetup>) => void;
  deleteExam: (id: string) => void;
  saveMarks: (marks: Omit<ExamMark, "id">[], skipBackendSync?: boolean) => void;

  examSchedules: ExamSchedule[];
  addExamSchedule: (schedule: Omit<ExamSchedule, "id">) => void;
  updateExamSchedule: (id: string, updates: Partial<ExamSchedule>) => void;
  deleteExamSchedule: (id: string) => void;

  questionPapers: QuestionPaper[];
  addQuestionPaper: (paper: Omit<QuestionPaper, "id">) => QuestionPaper;
  updateQuestionPaper: (id: string, updates: Partial<QuestionPaper>) => void;
  deleteQuestionPaper: (id: string) => void;

  meetings: SchoolMeeting[];
  addMeeting: (
    meeting: Omit<SchoolMeeting, "id" | "createdAt">,
  ) => SchoolMeeting;
  updateMeeting: (id: string, updates: Partial<SchoolMeeting>) => void;
  cancelMeeting: (id: string, reason: string) => void;
  deleteMeeting: (id: string) => void;

  departments: Department[];
  addDepartment: (dept: Omit<Department, "id">) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  designations: DesignationMaster[];
  addDesignation: (
    designation: Omit<DesignationMaster, "id">,
  ) => DesignationMaster;
  updateDesignation: (id: string, updates: Partial<DesignationMaster>) => void;
  deleteDesignation: (id: string) => void;

  gradeConfigurations: GradeConfig[];
  saveGradeConfiguration: (grades: GradeConfig[]) => void;
  fetchGradingScaleRules?: (examType?: string) => Promise<void>;
  studentAttendance: any[];
  saveStudentAttendance: (record: any) => void;
  coScholasticAssessments: any[];
  saveCoScholasticAssessment: (record: any) => void;

  processedResults: ProcessedResult[];
  saveProcessedResults: (results: ProcessedResult[]) => void;
  updateResultStatus: (
    examId: string,
    className: string,
    section: string,
    status: ProcessedResult["status"],
  ) => void;
  applyGraceOrRevaluation: (
    markId: string,
    newMarks: number,
    type: "Grace" | "Revaluation",
    reason: string,
    updatedBy: string,
  ) => void;
  refreshReleasedExamResults?: () => Promise<void>;

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, "id">) => Promise<void>;
  bulkAddTimetableSlots?: (slots: TimetableSlot[]) => void;
  updateTimetableSlot: (
    id: string,
    updates: Partial<TimetableSlot>,
  ) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  clearClassTimetable: (className: string, section: string) => Promise<void>;
  publishClassTimetable: (
    className: string,
    section: string,
    academicYear?: string,
    branch?: string,
  ) => void;
  loadTimetableForClassSection: (
    classId: string,
    sectionName: string,
    academicYear: string,
  ) => Promise<void>;

  periodSettings: PeriodSetting[];
  addPeriodSetting: (data: Omit<PeriodSetting, "id">) => Promise<void>;
  bulkAddPeriodSettings?: (periods: PeriodSetting[]) => void;
  updatePeriodSetting: (
    id: string,
    updates: Partial<PeriodSetting>,
  ) => Promise<void>;
  deletePeriodSetting: (id: string) => Promise<void>;
  bulkAssignPeriods: (classKeys: string[]) => void;
  resetClassPeriods: (className: string, section: string) => void;

  teacherAssignments: TeacherAssignment[];
  addTeacherAssignment: (data: Omit<TeacherAssignment, "id">) => void;
  updateTeacherAssignment: (
    id: string,
    updates: Partial<TeacherAssignment>,
  ) => void;
  deleteTeacherAssignment: (id: string) => void;

  homework: Homework[];
  addHomework: (hw: Omit<Homework, "id">) => void;
  updateHomework: (id: string, updates: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;

  books: BookItem[];
  bookIssues: BookIssue[];
  addBook: (book: Omit<BookItem, "id"> & { id?: string }) => void;
  deleteBook: (id: string) => void;
  issueBook: (issue: Omit<BookIssue, "id">) => void;
  returnBook: (issueId: string) => void;

  transportRoutes: TransportRoute[];
  addTransportRoute: (route: Omit<TransportRoute, "id">) => void;

  hostelRooms: HostelRoom[];
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, "id">) => void;

  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, "id">) => void;
  saveAnnouncements?: (anns: Announcement[]) => void;
  fetchAnnouncements?: () => Promise<void>;

  holidays: Holiday[];
  birthdays: Birthday[];
  auditLogs: AuditLog[];
  logActivity: (
    action: string,
    details: string,
    userName?: string,
    role?: string,
  ) => void;

  // UNIFORM ERP ADDITIONS
  uniformCategories: UniformCategory[];
  addUniformCategory: (c: Omit<UniformCategory, "id">) => void;
  updateUniformCategory: (
    id: string,
    updates: Partial<UniformCategory>,
  ) => void;
  deleteUniformCategory: (id: string) => void;

  uniformSizes: UniformSize[];
  addUniformSize: (s: Omit<UniformSize, "id">) => void;
  updateUniformSize: (id: string, updates: Partial<UniformSize>) => void;
  deleteUniformSize: (id: string) => void;

  uniformSuppliers: UniformSupplier[];
  addUniformSupplier: (s: Omit<UniformSupplier, "id">) => void;
  updateUniformSupplier: (
    id: string,
    updates: Partial<UniformSupplier>,
  ) => void;
  deleteUniformSupplier: (id: string) => void;

  uniformInventory: UniformInventoryItem[];
  addUniformInventory: (i: Omit<UniformInventoryItem, "id">) => void;
  updateUniformInventory: (
    id: string,
    updates: Partial<UniformInventoryItem>,
  ) => void;
  deleteUniformInventory: (id: string) => void;

  studentUniformIssues: StudentUniformIssue[];
  setStudentUniformIssues: React.Dispatch<
    React.SetStateAction<StudentUniformIssue[]>
  >;
  addStudentUniformIssue: (issue: Omit<StudentUniformIssue, "id">) => void;
  updateStudentUniformIssue: (
    id: string,
    updates: Partial<StudentUniformIssue>,
  ) => void;
  deleteStudentUniformIssue: (id: string) => void;

  financeUniformConfigs: FinanceUniformConfig[];
  addFinanceUniformConfig: (c: Omit<FinanceUniformConfig, "id">) => void;
  updateFinanceUniformConfig: (
    id: string,
    updates: Partial<FinanceUniformConfig>,
  ) => void;
  deleteFinanceUniformConfig: (id: string) => void;

  // LEAVE MANAGEMENT ERP ADDITIONS
  leaveTypes: LeaveType[];
  addLeaveType: (t: Omit<LeaveType, "id">) => void;
  updateLeaveType: (id: string, updates: Partial<LeaveType>) => void;
  deleteLeaveType: (id: string) => void;

  leaveApplications: LeaveApplication[];
  addLeaveApplication: (app: Omit<LeaveApplication, "id">) => void;
  updateLeaveApplication: (
    id: string,
    updates: Partial<LeaveApplication>,
  ) => void;
  deleteLeaveApplication: (id: string) => void;
  updateLeaveApplicationStatus: (
    id: string,
    status: LeaveApplication["status"],
    remarks?: string,
    approvedBy?: string,
  ) => void;

  addHoliday: (h: Omit<Holiday, "id">) => void;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;

  payslips: Payslip[];
  disburseSalary: (
    payslip: Omit<Payslip, "id">,
    silent?: boolean,
  ) => Promise<void>;
  fetchPayslips: (month?: string, year?: number) => Promise<void>;

  payrollConfigurations: PayrollConfiguration[];
  addPayrollConfiguration: (config: Omit<PayrollConfiguration, "id">) => void;
  updatePayrollConfiguration: (
    id: string,
    updates: Partial<PayrollConfiguration>,
  ) => void;
  deletePayrollConfiguration: (id: string) => void;
  activatePayrollConfiguration: (id: string) => void;
  deactivatePayrollConfiguration: (id: string) => void;

  payrollComponents: PayrollComponent[];
  addPayrollComponent: (component: Omit<PayrollComponent, "id">) => void;
  updatePayrollComponent: (
    id: string,
    updates: Partial<PayrollComponent>,
  ) => void;
  deletePayrollComponent: (id: string) => void;
  loadMonthlyStaffAttendance: (month: number, year: number) => Promise<void>;

  salaryStructures: SalaryStructure[];
  addSalaryStructure: (structure: Omit<SalaryStructure, "id">) => void;
  updateSalaryStructure: (
    id: string,
    updates: Partial<SalaryStructure>,
  ) => void;
  deleteSalaryStructure: (id: string) => void;
  cloneSalaryStructure: (id: string) => void;
  loadSalaryStructures: (structures: SalaryStructure[]) => void;

  employeeSalaryAssignments: EmployeeSalaryAssignment[];
  assignEmployeeSalaryStructure: (
    assignment: Omit<EmployeeSalaryAssignment, "id">,
  ) => any;
  updateEmployeeSalaryAssignment: (
    id: string,
    updates: Partial<EmployeeSalaryAssignment>,
  ) => void;
  deleteEmployeeSalaryAssignment: (id: string) => void;

  payrollRuns: PayrollRun[];
  upsertPayrollRun: (run: Omit<PayrollRun, "id">) => PayrollRun;
  updatePayrollRun: (id: string, updates: Partial<PayrollRun>) => void;
  deletePayrollRun: (id: string) => void;

  // TRAINING & ASSESSMENTS ERP MODULE ADDITIONS
  workshops: WorkshopTraining[];
  addWorkshop: (workshop: Omit<WorkshopTraining, "id">) => WorkshopTraining;
  updateWorkshop: (id: string, updates: Partial<WorkshopTraining>) => void;
  deleteWorkshop: (id: string) => void;
  markWorkshopAttendance: (
    workshopId: string,
    attendanceList: {
      employeeId: string;
      status: "Present" | "Absent" | "Excused";
    }[],
  ) => void;
  submitWorkshopFeedback: (
    workshopId: string,
    employeeId: string,
    feedback: TrainingParticipant["feedback"],
  ) => void;

  employeeAssessments: EmployeeAssessment[];
  addAssessment: (
    assessment: Omit<EmployeeAssessment, "id">,
  ) => EmployeeAssessment;
  updateAssessment: (id: string, updates: Partial<EmployeeAssessment>) => void;
  deleteAssessment: (id: string) => void;
  saveAssessmentResults: (
    assessmentId: string,
    results: AssessmentResult[],
  ) => void;

  issuedCertificates: IssuedCertificate[];
  issueCertificate: (
    cert: Omit<IssuedCertificate, "id" | "certificateNumber">,
  ) => IssuedCertificate;
  reissueCertificate: (id: string) => void;

  certificateTemplates: CertificateTemplateConfig[];
  updateCertificateTemplate: (
    id: string,
    updates: Partial<CertificateTemplateConfig>,
  ) => void;
  tcRegister: TcRecord[];
  issueTransferCertificate: (tc: TcRecord) => void;
  reissueTransferCertificate: (
    tcNo: string,
    reissueDetails: { reason: string; authorizedBy: string; remarks?: string },
  ) => void;
}

const defaultGradeConfigurations: GradeConfig[] = [];

const defaultExamSchedules: ExamSchedule[] = [];

const initialFinanceTransactions: FinanceTransaction[] = [];

const initialFinancialAccounts: FinancialAccount[] = [];

const initialFinancialCategories: FinancialCategory[] = [];

const initialFinancialBudgets: FinancialBudget[] = [];
const initialAlumniRecords: AlumniRecord[] = [];

const initialSchoolEvents: SchoolEvent[] = [];

const initialWorkshops: WorkshopTraining[] = [];
const initialEmployeeAssessments: EmployeeAssessment[] = [];
const initialIssuedCertificates: IssuedCertificate[] = [];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addToast } = useToast();
  const activeRequests = useRef<Record<string, any>>({});
  const {
    user,
    selectedBranch,
    selectedAcademicYear,
    setSelectedAcademicYear,
    isAuthenticated,
    role,
  } = useAuth();

  const getStored = <T,>(key: string, initial: T): T => {
    try {
      const storageKey = key.startsWith("edu_db_") ? key : `edu_db_${key}`;
      const saved =
        localStorage.getItem(storageKey) || localStorage.getItem(key);
      if (!saved || saved === "undefined" || saved === "null") return initial;
      const parsed = JSON.parse(saved);
      return parsed !== null && parsed !== undefined ? parsed : initial;
    } catch {
      const storageKey = key.startsWith("edu_db_") ? key : `edu_db_${key}`;
      localStorage.removeItem(storageKey);
      return initial;
    }
  };

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const profile = getStored("profile", initialSchoolProfile);
    const storedLogo =
      localStorage.getItem("school_logo") ??
      localStorage.getItem("logoUrl") ??
      localStorage.getItem("schoolLogo");
    if (storedLogo !== null) {
      return { ...profile, logoUrl: storedLogo };
    }
    return profile;
  });
  const [academicYears, setAcademicYears] = useState<AcademicYearMaster[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<
    CertificateTemplateConfig[]
  >(() => {
    const stored = getStored(
      "certificate_templates",
      initialCertificateTemplates,
    );
    if (
      Array.isArray(stored) &&
      stored.length > 0 &&
      stored[0]?.certificateType &&
      stored[0]?.title
    ) {
      return stored;
    }
    return initialCertificateTemplates;
  });
  const [tcRegister, setTcRegister] = useState<TcRecord[]>(() =>
    getStored("tc_register", []),
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudentCount, setTotalStudentCount] = useState<number>(0);
  const [staff, setStaff] = useState<Staff[]>(() =>
    getStored("edu_db_staff", initialStaff),
  );
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
  const [rawClasses, setRawClasses] = useState<any[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>(() =>
    getStored("subjects", initialSubjects),
  );
  const [buses, setBuses] = useState<Bus[]>(() =>
    getStored("buses", initialBuses),
  );
  const [hostelBlocks, setHostelBlocks] = useState<HostelBlock[]>(() =>
    getStored("hostel_blocks", initialHostelBlocks),
  );
  const [hostelBeds, setHostelBeds] = useState<HostelBed[]>(() =>
    getStored("hostel_beds", initialHostelBeds),
  );
  const [uniforms, setUniforms] = useState<UniformItem[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() =>
    getStored("custom_roles", initialCustomRoles),
  );
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() =>
    getStored("fee_structures", initialFeeStructures),
  );
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => {
    const rawStored =
      getStored<FeePayment[]>("fee_payments", initialFeePayments) || [];
    const seen = new Set<string>();
    const deduplicated = rawStored.filter((p) => {
      if (!p) return false;
      const key =
        p.receiptNo && String(p.receiptNo).trim()
          ? `REC_${String(p.receiptNo).trim()}`
          : `ID_${String(p.id).trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const versionKey = "edu_db_fee_payments_wipe_overpayment_v1006";
    if (!localStorage.getItem(versionKey)) {
      const cleaned = deduplicated.filter((p) => {
        if (!p) return false;
        if (
          p.receiptNo === "REC-2026-2500" ||
          p.receiptNo === "REC-2026-3209" ||
          p.id === "2" ||
          (p.amountPaid === 5000 &&
            (p.studentId === "2" || p.admissionNo === "ADM-2026-2001"))
        )
          return false;
        if (
          p.studentId === "1204" ||
          p.receiptNo === "REC-2026-3912" ||
          p.id === "3912"
        )
          return false;
        if (!p.studentName || p.studentName.startsWith("Student #"))
          return false;
        const notesLower = (p.notes || "").toLowerCase();
        const recLower = (p.receiptNo || "").toLowerCase();
        const hasAlloc =
          p.paymentAllocation &&
          p.paymentAllocation.some((a) =>
            (a.feeHeadName || a.termName || "")
              .toLowerCase()
              .includes("uniform"),
          );
        const isUniformPayment =
          notesLower.includes("uniform") ||
          recLower.includes("uni") ||
          hasAlloc;
        return !isUniformPayment;
      });

      localStorage.setItem(versionKey, "true");
      localStorage.setItem("edu_db_fee_payments", JSON.stringify(cleaned));
      localStorage.setItem("fee_payments", JSON.stringify(cleaned));
      return cleaned;
    }
    return deduplicated;
  });
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [lastAttendancePayload, setLastAttendancePayload] = useState<any>(null);
  const [lastAttendanceResponse, setLastAttendanceResponse] =
    useState<any>(null);
  const [exams, setExams] = useState<ExamSetup[]>(() => {
    const stored = getStored<ExamSetup[]>("exams", initialExamSetups);
    return !stored || stored.length === 0 ? initialExamSetups : stored;
  });
  const [examMarks, setExamMarks] = useState<ExamMark[]>(() => {
    const stored = getStored("exam_marks", initialExamMarks);
    if (!stored || stored.length === 0) {
      localStorage.setItem(
        "edu_db_exam_marks",
        JSON.stringify(initialExamMarks),
      );
      localStorage.setItem("exam_marks", JSON.stringify(initialExamMarks));
      return initialExamMarks;
    }
    return stored;
  });

  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>(() =>
    getStored("exam_schedules", defaultExamSchedules),
  );
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>(() =>
    getStored("question_papers", initialQuestionPapers),
  );
  const [meetings, setMeetings] = useState<SchoolMeeting[]>(() =>
    getStored("school_meetings", initialMeetings),
  );
  const [departments, setDepartments] = useState<Department[]>(() =>
    getStored("departments", initialDepartments),
  );
  const [designations, setDesignations] = useState<DesignationMaster[]>(() =>
    getStored("designations", initialDesignations),
  );
  const [gradeConfigurations, setGradeConfigurations] = useState<GradeConfig[]>(
    () =>
      getStored(
        "edu_db_grade_configurations",
        getStored("grade_configurations", defaultGradeConfigurations),
      ),
  );
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>(
    [],
  );
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [todayStudentAttendanceSummary, setTodayStudentAttendanceSummary] =
    useState<any>(null);
  const [coScholasticAssessments, setCoScholasticAssessments] = useState<any[]>(
    () => getStored("co_scholastic_assessments", []),
  );

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() =>
    getStored("timetable", []),
  );
  const [homework, setHomework] = useState<Homework[]>(() => {
    const raw = getStored("homework", initialHomework);
    if (Array.isArray(raw)) {
      return raw.map((hw: any) => {
        let sec = (hw.section || "").trim();
        let cls = (hw.className || "").trim();
        if (cls.includes("-")) {
          const parts = cls.split("-");
          cls = parts[0].trim();
          if (!sec && parts[1]) sec = parts[1].trim();
        }
        return {
          ...hw,
          className: cls || hw.className || "",
          section: sec || hw.section || "",
        };
      });
    }
    return raw;
  });
  const [books, setBooks] = useState<BookItem[]>(() =>
    getStored("books", initialBooks),
  );
  const [bookIssues, setBookIssues] = useState<BookIssue[]>(() =>
    getStored("book_issues", initialBookIssues),
  );
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() =>
    getStored("transport", initialTransportRoutes),
  );
  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>(() =>
    getStored("hostel", initialHostelRooms),
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    getStored("inventory", initialInventory),
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const stored = getStored("holidays", initialHolidays);
    const combined =
      Array.isArray(stored) && stored.length > 0
        ? [...stored, ...initialHolidays]
        : initialHolidays;
    const seen = new Set<string>();
    const unique: Holiday[] = [];
    combined.forEach((h: any) => {
      if (!h || !h.name || !h.startDate) return;
      const cleanName = (h.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const key = `${cleanName}_${h.startDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(h);
      }
    });
    return unique;
  });
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(() => {
    const stored = getStored("school_events", initialSchoolEvents);
    const rawList =
      !stored || stored.length === 0 ? initialSchoolEvents : stored;
    const seen = new Set<string>();
    const unique: SchoolEvent[] = [];
    rawList.forEach((e: any) => {
      const cleanTitle = (e.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const key = `${cleanTitle}_${e.startDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(e);
      }
    });
    return unique;
  });
  const [birthdays] = useState<Birthday[]>(() => {
    const val = getStored("birthdays", initialBirthdays);
    if (
      val.some((b) => b.name === "Alexander Wright" && b.role === "Student")
    ) {
      localStorage.setItem("birthdays", JSON.stringify(initialBirthdays));
      return initialBirthdays;
    }
    return val;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getStored("audit_logs", initialAuditLogs),
  );

  // Leave Management ERP States
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => {
    const stored = getStored("leave_types", initialLeaveTypes);
    return Array.isArray(stored) && stored.length > 0
      ? stored
      : [
          {
            id: "LT-001",
            name: "Casual Leave",
            code: "CL",
            annualAllowance: 10,
            maxConsecutiveDays: 3,
            isPaid: true,
            carryForward: true,
            requiresAttachment: false,
            status: "Active",
          },
          {
            id: "LT-002",
            name: "Sick Leave",
            code: "SL",
            annualAllowance: 10,
            maxConsecutiveDays: 5,
            isPaid: true,
            carryForward: true,
            requiresAttachment: true,
            status: "Active",
          },
          {
            id: "LT-003",
            name: "Paid / Earned Leave",
            code: "PL",
            annualAllowance: 15,
            maxConsecutiveDays: 10,
            isPaid: true,
            carryForward: true,
            requiresAttachment: false,
            status: "Active",
          },
          {
            id: "LT-004",
            name: "On Duty Leave",
            code: "OD",
            annualAllowance: 12,
            maxConsecutiveDays: 4,
            isPaid: true,
            carryForward: false,
            requiresAttachment: false,
            status: "Active",
          },
          {
            id: "LT-005",
            name: "Maternity / Paternity Leave",
            code: "ML",
            annualAllowance: 90,
            maxConsecutiveDays: 90,
            isPaid: true,
            carryForward: false,
            requiresAttachment: true,
            status: "Active",
          },
          {
            id: "LT-006",
            name: "Loss of Pay (Unpaid)",
            code: "LOP",
            annualAllowance: 30,
            maxConsecutiveDays: 30,
            isPaid: false,
            carryForward: false,
            requiresAttachment: false,
            status: "Active",
          },
        ];
  });
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const cleanPayslipMonth = (m?: string): string => {
    if (!m) return "";
    const ym = m.match(/\b(19|20\d\d)\b/g);
    const y = ym ? ym[0] : "";
    const mon = m.replace(/\b(19|20\d\d)\b/g, "").trim();
    if (mon && y) return `${mon} ${y}`;
    return mon || y;
  };
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  useEffect(() => {
    try {
      localStorage.removeItem("edu_db_payslips");
    } catch {}
  }, []);
  const [payrollConfigurations, setPayrollConfigurations] = useState<
    PayrollConfiguration[]
  >(() => getStored("payroll_configurations", initialPayrollConfigurations));
  const [payrollComponents, setPayrollComponents] = useState<
    PayrollComponent[]
  >(() => getStored("payroll_components", initialPayrollComponents));
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>(
    () => getStored("salary_structures", initialSalaryStructures),
  );
  const [employeeSalaryAssignments, setEmployeeSalaryAssignments] = useState<
    EmployeeSalaryAssignment[]
  >(() =>
    getStored("employee_salary_assignments", initialEmployeeSalaryAssignments),
  );
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() =>
    getStored("payroll_runs", initialPayrollRuns),
  );

  // Uniform ERP States (Database API driven - no mock or local storage)
  const [uniformCategories, setUniformCategories] = useState<UniformCategory[]>([]);
  const [uniformSizes, setUniformSizes] = useState<UniformSize[]>([]);
  const [uniformSuppliers, setUniformSuppliers] = useState<UniformSupplier[]>([]);
  const [uniformInventory, setUniformInventory] = useState<UniformInventoryItem[]>([]);

  const [studentUniformIssues, setStudentUniformIssues] = useState<
    StudentUniformIssue[]
  >(() => {
    const versionKey = "edu_db_student_uniform_issues_wipe_v100004_split_qty";
    if (!localStorage.getItem(versionKey)) {
      localStorage.setItem(versionKey, "true");

      try {
        const saved =
          localStorage.getItem("edu_db_student_uniform_issues") ||
          localStorage.getItem("student_uniform_issues");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const splitData: StudentUniformIssue[] = [];
            parsed.forEach((issue) => {
              const qty = issue.quantity || 1;
              const nameLower = (
                issue.itemName ||
                issue.itemCategory ||
                ""
              ).toLowerCase();
              const isCloth =
                nameLower.includes("cloth") ||
                nameLower.includes("fabric") ||
                nameLower.includes("unstitched");
              if (!isCloth && qty > 1) {
                for (let i = 0; i < qty; i++) {
                  splitData.push({
                    ...issue,
                    status: issue.status === "Paid" ? "Partial" : issue.status,
                    id: `${issue.id}-P${i + 1}`,
                    itemName: `${issue.itemName} (#${i + 1})`,
                    quantity: 1,
                    totalAmount: issue.price || 0,
                  });
                }
              } else {
                splitData.push(issue);
              }
            });
            localStorage.setItem(
              "edu_db_student_uniform_issues",
              JSON.stringify(splitData),
            );
            localStorage.setItem(
              "student_uniform_issues",
              JSON.stringify(splitData),
            );
            return splitData;
          }
        }
      } catch (e) {}

      localStorage.setItem("edu_db_student_uniform_issues", JSON.stringify([]));
      localStorage.setItem("student_uniform_issues", JSON.stringify([]));
      return [];
    }
    try {
      const saved =
        localStorage.getItem("edu_db_student_uniform_issues") ||
        localStorage.getItem("student_uniform_issues");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(
        "Failed to load student_uniform_issues from localStorage",
        e,
      );
    }
    return [];
  });
  const [financeUniformConfigs, setFinanceUniformConfigs] = useState<
    FinanceUniformConfig[]
  >(() => {
    try {
      const saved =
        localStorage.getItem("edu_db_finance_uniform_configs") ||
        localStorage.getItem("finance_uniform_configs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, FinanceUniformConfig>();
          (initialFinanceUniformConfigs || []).forEach((c) => map.set(c.id, c));
          parsed.forEach((c) => {
            if (c && c.id) {
              map.set(c.id, c);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {}

    return initialFinanceUniformConfigs || [];
  });

  const deduplicateFeeHeads = (heads: FeeHead[]): FeeHead[] => {
    if (!heads || !Array.isArray(heads)) return [];
    const seenIds = new Set<string>();
    const seenCodes = new Set<string>();

    return heads.filter((h) => {
      if (!h) return false;
      const id = String(h.id || "").trim();
      const code = String(h.code || "")
        .trim()
        .toLowerCase();

      if (id && seenIds.has(id)) return false;
      if (code && seenCodes.has(code)) return false;

      if (id) seenIds.add(id);
      if (code) seenCodes.add(code);

      return true;
    });
  };

  // ERP Finance System States
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(() =>
    deduplicateFeeHeads(getStored("fee_heads", initialFeeHeads)),
  );
  const [dynamicFeeStructures, setDynamicFeeStructures] = useState<
    DynamicFeeStructure[]
  >(() => getStored("dynamic_fee_structures", initialDynamicFeeStructures));
  const [studentFeeAssignments, setStudentFeeAssignments] = useState<
    StudentFeeAssignment[]
  >(() => getStored("student_fee_assignments", initialStudentFeeAssignments));

  const [dbAssignments, setDbAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!dbAssignments.length) {
      setStudentFeeAssignments([]);
      try {
        localStorage.setItem("student_fee_assignments", JSON.stringify([]));
        localStorage.setItem(
          "edu_db_student_fee_assignments",
          JSON.stringify([]),
        );
      } catch (e) {}
      return;
    }
    const mapped = dbAssignments
      .map((a) => {
        const student = students.find(
          (s) =>
            s.id === a.studentId?.toString() || s.admissionNo === a.studentId,
        );
        const dfs = dynamicFeeStructures.find(
          (d) =>
            String(d.id) === String(a.dynamicFeeStructureId) ||
            String(d.id) === String(a.feeStructureId),
        );

        // If no dynamic fee structures exist, or if an assignment points to a deleted structure, omit it!
        if (dynamicFeeStructures.length === 0) return null;
        if (a.dynamicFeeStructureId && !dfs) return null;

        const effectiveTotal = dfs ? dfs.totalAmount : (a.totalAmount ?? 0);
        return {
          id: a.id?.toString() || a.id || "",
          studentId: a.studentId || "",
          studentName:
            (student as any)?.studentName ||
            (student ? `${student.firstName} ${student.lastName}` : "") ||
            a.studentName ||
            "",
          admissionNo:
            student?.admissionNo || a.admissionNo || a.studentId || "",
          branch: student?.branch || a.branch || selectedBranch || "",
          academicYear:
            (student as any)?.academicYear ||
            a.academicYear ||
            selectedAcademicYear ||
            "",
          className: student?.className || a.className || "",
          section: student?.section || a.section || "",
          feeStructureId:
            a.dynamicFeeStructureId?.toString() || a.feeStructureId || "",
          assignedFeeHeads: dfs?.items || a.assignedFeeHeads || [],
          baseFeeTotal: effectiveTotal,
          originalFeeTotal: effectiveTotal,
          adjustmentTotal: a.adjustmentTotal || 0,
          feePolicy: (a.feePolicy || "Full Annual Fee") as any,
          assignedDate: a.assignedDate || new Date().toISOString(),
          status: a.status || "Active",
        };
      })
      .filter(Boolean) as StudentFeeAssignment[];
    setStudentFeeAssignments(mapped);
    try {
      localStorage.setItem("student_fee_assignments", JSON.stringify(mapped));
      localStorage.setItem(
        "edu_db_student_fee_assignments",
        JSON.stringify(mapped),
      );
    } catch (e) {}
  }, [dbAssignments, students, dynamicFeeStructures]);

  useEffect(() => {
    if (dynamicFeeStructures.length === 0) {
      setStudents((prev) => {
        const hasNonZero = prev.some((s) => (s.totalFee || 0) > 0);
        if (!hasNonZero) return prev;
        const updated = prev.map((s) => ({
          ...s,
          totalFee: 0,
          dueFee: Math.max(0, 0 - (s.paidFee || 0)),
        }));
        return updated;
      });
      setStudentFeeAssignments((prev) => {
        if (prev.length === 0) return prev;
        try {
          localStorage.setItem("student_fee_assignments", JSON.stringify([]));
          localStorage.setItem(
            "edu_db_student_fee_assignments",
            JSON.stringify([]),
          );
        } catch (e) {}
        return [];
      });
    }
  }, [dynamicFeeStructures]);
  const [scholarships, setScholarships] = useState<Scholarship[]>(() =>
    getStored("scholarships", initialScholarships),
  );
  const [studentScholarships, setStudentScholarships] = useState<
    StudentScholarship[]
  >(() => getStored("student_scholarships", initialStudentScholarships));
  const [discounts, setDiscounts] = useState<Discount[]>(() => {
    const versionKey = "edu_db_discounts_clean_v1";
    if (!localStorage.getItem(versionKey)) {
      localStorage.setItem(versionKey, "true");
      localStorage.setItem("edu_db_discounts", JSON.stringify([]));
      localStorage.setItem("discounts", JSON.stringify([]));
      return [];
    }
    const stored = getStored("discounts", initialDiscounts);
    return Array.isArray(stored) ? stored : [];
  });
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>(
    () => {
      const versionKey = "edu_db_student_discounts_clean_v1";
      if (!localStorage.getItem(versionKey)) {
        localStorage.setItem(versionKey, "true");
        localStorage.setItem("edu_db_student_discounts", JSON.stringify([]));
        localStorage.setItem("student_discounts", JSON.stringify([]));
        return [];
      }
      const stored = getStored("student_discounts", initialStudentDiscounts);
      return Array.isArray(stored) ? stored : [];
    },
  );
  const [fineRules, setFineRules] = useState<FineRule[]>(() =>
    getStored("fine_rules", initialFineRules),
  );
  const [erpTransportRoutes, setERPTransportRoutes] = useState<
    ERPTransportRoute[]
  >(() => getStored("erp_transport_routes", initialERPTransportRoutes));
  const [studentTransports, setStudentTransports] = useState<
    StudentTransport[]
  >([]);
  const [hostelMasters, setHostelMasters] = useState<HostelMaster[]>(() =>
    getStored("hostel_masters", initialHostelMasters),
  );
  const [studentHostels, setStudentHostels] = useState<StudentHostel[]>(() =>
    getStored("student_hostels", initialStudentHostels),
  );
  const [refunds, setRefunds] = useState<Refund[]>(() =>
    getStored("refunds", initialRefunds),
  );
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(() =>
    getStored("finance_settings", initialFinanceSettings),
  );

  // Transport ERP System States
  const [routeMasters, setRouteMasters] = useState<RouteMaster[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [vehicleMasters, setVehicleMasters] = useState<VehicleMaster[]>(() =>
    getStored("edu_db_vehicle_masters", getStored("vehicle_masters", [])),
  );
  const [driverMasters, setDriverMasters] = useState<DriverMaster[]>(() =>
    getStored("edu_db_driver_masters", getStored("driver_masters", [])),
  );
  const [busAttendants, setBusAttendants] = useState<BusAttendantMaster[]>(() =>
    getStored("edu_db_bus_attendants", getStored("bus_attendants", [])),
  );
  const [vehicleAssignments, setVehicleAssignments] = useState<
    VehicleAssignment[]
  >(() =>
    getStored(
      "edu_db_vehicle_assignments",
      getStored("vehicle_assignments", []),
    ),
  );
  const [vehicleMaintenances, setVehicleMaintenances] = useState<
    VehicleMaintenance[]
  >(() =>
    getStored(
      "edu_db_vehicle_maintenances",
      getStored("vehicle_maintenances", []),
    ),
  );

  // Hostel ERP System States
  const [roomTypeMasters, setRoomTypeMasters] = useState<RoomTypeMaster[]>(() =>
    getStored("room_type_masters", initialRoomTypeMasters),
  );
  const [roomMasters, setRoomMasters] = useState<RoomMaster[]>(() =>
    getStored("room_masters", initialRoomMasters),
  );
  const [studentHostelAssignments, setStudentHostelAssignments] = useState<
    StudentHostelAssignment[]
  >(() =>
    getStored("student_hostel_assignments", initialStudentHostelAssignments),
  );
  const [hostelVisitorLogs, setHostelVisitorLogs] = useState<
    HostelVisitorLog[]
  >(() => getStored("hostel_visitor_logs", initialHostelVisitorLogs));
  const [hostelAttendanceLogs, setHostelAttendanceLogs] = useState<
    HostelAttendanceLog[]
  >(() => getStored("hostel_attendance_logs", initialHostelAttendanceLogs));

  // Finance -> Hostel Pricing Configuration Master State
  const [financeHostelConfigs, setFinanceHostelConfigs] = useState<
    FinanceHostelConfig[]
  >(() => getStored("finance_hostel_configs", initialFinanceHostelConfigs));

  // Finance -> Transport Pricing Configuration Master State
  const [financeTransportConfigs, setFinanceTransportConfigs] = useState<
    FinanceTransportConfig[]
  >([]);

  const MONTH_NAMES_ACADEMIC = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];

  function getMonthYearForAcademicIndex(
    ayStr: string,
    monthIndex: number,
  ): { year: number; month: number } {
    const startYear = parseInt(ayStr.split("-")[0], 10) || 2026;
    if (monthIndex < 9) {
      return { year: startYear, month: monthIndex + 4 };
    } else {
      return { year: startYear + 1, month: monthIndex - 8 };
    }
  }

  function buildDefaultMonthlyConfig(
    ayStr: string,
    dueDay: number = 10,
  ): MonthlyDueDateConfig {
    const monthDueDates: MonthDueDateItem[] = MONTH_NAMES_ACADEMIC.map(
      (mName, idx) => {
        const { year, month } = getMonthYearForAcademicIndex(ayStr, idx);
        const dayStr = String(dueDay).padStart(2, "0");
        const monthStr = String(month).padStart(2, "0");
        return {
          monthIndex: idx,
          monthName: mName,
          dueDate: `${year}-${monthStr}-${dayStr}`,
        };
      },
    );

    return {
      applySameDayToAllMonths: true,
      dueDay,
      monthDueDates,
    };
  }

  const [academicYearFeeSchedules, setAcademicYearFeeSchedules] = useState<
    AcademicYearFeeSchedule[]
  >(() => {
    const stored = getStored<AcademicYearFeeSchedule[]>(
      "academic_year_fee_schedules",
      [],
    );
    // Sanitize stored schedules: strip out any stale mock schedules with legacy hardcoded 04-15 dates
    const cleanStored = Array.isArray(stored)
      ? stored.filter(
          (s) =>
            s &&
            !s.terms?.some(
              (t) =>
                t.dueDate?.includes("04-15") ||
                t.dueDate?.includes("2026-04") ||
                t.dueDate?.includes("2025-04"),
            ),
        )
      : [];
    return cleanStored;
  });

  // Student Fee Installments State
  const [studentFeeInstallments, setStudentFeeInstallments] = useState<
    StudentFeeInstallment[]
  >(() => {
    const version = localStorage.getItem(
      "edu_db_full_ledgers_v110_dynamic_only",
    );
    if (!version) {
      localStorage.setItem("edu_db_full_ledgers_v110_dynamic_only", "true");
      localStorage.removeItem("student_fee_installments");
      localStorage.removeItem("edu_db_student_fee_installments");
      return [];
    }
    return getStored("student_fee_installments", []);
  });

  // Permanent Student Fee Ledger State
  const [studentFeeLedgers, setStudentFeeLedgers] = useState<
    StudentFeeLedger[]
  >(() => {
    const version = localStorage.getItem(
      "edu_db_full_ledgers_v116_no_hardcoded_dues",
    );
    if (!version) {
      localStorage.setItem(
        "edu_db_full_ledgers_v116_no_hardcoded_dues",
        "true",
      );
      localStorage.removeItem("student_fee_ledgers");
      localStorage.removeItem("edu_db_student_fee_ledgers");
      localStorage.removeItem("student_fee_installments");
      localStorage.removeItem("edu_db_student_fee_installments");
      localStorage.removeItem("edu_db_fee_payments");
      localStorage.removeItem("fee_payments");
      localStorage.removeItem("edu_db_full_ledgers_v112_exact_classes");
      localStorage.removeItem("edu_db_full_ledgers_v110_dynamic_only");
      localStorage.removeItem("edu_db_full_ledgers_v105_realmysql");
      localStorage.removeItem("edu_db_full_ledgers_v106_strictly_dynamic");
      localStorage.removeItem("edu_db_full_ledgers_v107_strictly_dynamic");
      localStorage.removeItem("edu_db_clear_extra_paid_v100");
      return [];
    }
    const stored = getStored("student_fee_ledgers", initialStudentFeeLedgers);
    return stored.map((ledger) => {
      const sanitizedItems = ledger.feeItems.map((fi) => {
        const isUnif =
          fi.headName.toLowerCase().includes("uniform") ||
          (fi.category && fi.category.toLowerCase().includes("uniform"));
        if (isUnif) {
          return {
            ...fi,
            status: "Pending" as const,
          };
        }
        return fi;
      });
      const uniformPaid = ledger.feeItems
        .filter(
          (fi) =>
            fi.headName.toLowerCase().includes("uniform") ||
            (fi.category && fi.category.toLowerCase().includes("uniform")),
        )
        .reduce(
          (sum, fi) => sum + (fi.finalAmount || fi.originalAmount || 0),
          0,
        );

      const finalPaid = Math.min(
        ledger.totalPayable,
        Math.max(
          0,
          (ledger.paidAmount || 0) - (ledger.paidAmount > 0 ? uniformPaid : 0),
        ),
      );
      const finalDue = Math.max(0, ledger.totalPayable - finalPaid);
      return {
        ...ledger,
        feeItems: sanitizedItems,
        paidAmount: finalPaid,
        dueBalance: finalDue,
      };
    });
  });

  // Master Finance Ledger & Transactions States
  const [financeTransactions, setFinanceTransactions] = useState<
    FinanceTransaction[]
  >(() => {
    const rawStored =
      getStored<FinanceTransaction[]>(
        "finance_transactions",
        initialFinanceTransactions,
      ) || [];
    const seenRefs = new Set<string>();
    const seenIds = new Set<string>();
    const deduped: FinanceTransaction[] = [];
    for (const t of rawStored) {
      if (!t) continue;
      const ref = (t.referenceNumber || "").trim();
      const tid = (t.transactionId || t.id || "").trim();
      if (ref && seenRefs.has(ref)) continue;
      if (tid && seenIds.has(tid)) continue;
      if (ref) seenRefs.add(ref);
      if (tid) seenIds.add(tid);
      deduped.push(t);
    }
    return deduped;
  });
  const [financialAccounts, setFinancialAccounts] = useState<
    FinancialAccount[]
  >(() =>
    getStored(
      "financial_accounts",
      getStored("edu_db_financial_accounts", initialFinancialAccounts),
    ),
  );
  const [financialCategories, setFinancialCategories] = useState<
    FinancialCategory[]
  >(() =>
    getStored(
      "financial_categories",
      getStored("edu_db_financial_categories", initialFinancialCategories),
    ),
  );
  const [financialBudgets, setFinancialBudgets] = useState<FinancialBudget[]>(
    () => {
      const versionKey = "edu_db_financial_budgets_clean_v1";
      if (!localStorage.getItem(versionKey)) {
        localStorage.setItem(versionKey, "true");
        localStorage.removeItem("edu_db_financial_budgets");
        localStorage.removeItem("financial_budgets");
        return [];
      }
      return getStored("financial_budgets", initialFinancialBudgets);
    },
  );

  const addAcademicYear = async (ayData: Omit<AcademicYearMaster, "id">) => {
    const id = `AY-${ayData.academicYear.replace(/\s+/g, "") || Date.now()}`;
    const newAY: AcademicYearMaster = { id, ...ayData };
    setAcademicYears((prev) => {
      let updated = [...prev];
      if (newAY.isCurrentAcademicYear) {
        updated = updated.map((a) => ({ ...a, isCurrentAcademicYear: false }));
        setSelectedAcademicYear(newAY.academicYear);
      }
      const next = [...updated, newAY];
      window.dispatchEvent(new Event("academic_years_updated"));
      return next;
    });

    try {
      await createAcademicYearApi(newAY);
    } catch (err) {
      console.warn("Failed to create academic year on backend:", err);
    }
  };

  const updateAcademicYear = async (
    id: string,
    updates: Partial<AcademicYearMaster>,
  ) => {
    setAcademicYears((prev) => {
      let updated = prev.map((a) =>
        a.id === id
          ? { ...a, ...updates, updatedAt: new Date().toISOString() }
          : a,
      );
      if (updates.isCurrentAcademicYear) {
        const target = updated.find((a) => a.id === id);
        updated = updated.map((a) =>
          a.id === id
            ? { ...a, isCurrentAcademicYear: true }
            : { ...a, isCurrentAcademicYear: false },
        );
        if (target) setSelectedAcademicYear(target.academicYear);
      }
      window.dispatchEvent(new Event("academic_years_updated"));
      return updated;
    });

    try {
      await updateAcademicYearApi(id, updates);
    } catch (err) {
      console.warn("Failed to update academic year on backend:", err);
    }
  };

  const deleteAcademicYear = async (id: string) => {
    setAcademicYears((prev) => {
      const next = prev.filter((a) => a.id !== id);
      window.dispatchEvent(new Event("academic_years_updated"));
      return next;
    });

    try {
      await deleteAcademicYearApi(id);
    } catch (err) {
      console.warn("Failed to delete academic year on backend:", err);
    }
  };

  const setCurrentAcademicYear = (id: string) => {
    setAcademicYears((prev) => {
      const target = prev.find((a) => a.id === id);
      if (!target) return prev;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = target.endDate ? new Date(target.endDate) : null;
      const isCompleted =
        target.status === "Closed" ||
        (end && !isNaN(end.getTime()) && end < today);
      if (isCompleted) {
        addToast(
          "error",
          "Action Not Allowed",
          "Completed academic year cannot be set as active session.",
        );
        return prev;
      }
      setSelectedAcademicYear(target.academicYear);
      const next: AcademicYearMaster[] = prev.map((a) => ({
        ...a,
        isCurrentAcademicYear: a.id === id,
        status: (a.id === id
          ? "Active"
          : a.status === "Active"
            ? "Closed"
            : a.status) as "Upcoming" | "Active" | "Closed",
      }));
      window.dispatchEvent(new Event("academic_years_updated"));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem("edu_db_profile", JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  useEffect(() => {
    const syncAcademicYearsFromApi = async () => {
      try {
        const res: any = await fetchAcademicYearsApi();
        if (res?.success && Array.isArray(res.data)) {
          setAcademicYears(res.data);
        }
      } catch {}
    };
    syncAcademicYearsFromApi();

    const handleAYUpdate = () => {
      syncAcademicYearsFromApi();
    };
    window.addEventListener("academic_years_updated", handleAYUpdate);

    return () => {
      window.removeEventListener("academic_years_updated", handleAYUpdate);
    };
  }, []);
  useEffect(() => {
    try {
      const lightweightStaff = (staff || []).map((s) => {
        if (
          s.avatar &&
          typeof s.avatar === "string" &&
          s.avatar.startsWith("data:")
        ) {
          const { avatar, ...rest } = s;
          return rest;
        }
        return s;
      });
      localStorage.setItem("edu_db_staff", JSON.stringify(lightweightStaff));
    } catch {}
  }, [staff]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "edu_db_academic_classes",
        JSON.stringify(academicClasses),
      );
    } catch {}
  }, [academicClasses]);
  useEffect(() => {
    localStorage.setItem("edu_db_subjects", JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem("edu_db_buses", JSON.stringify(buses));
  }, [buses]);
  useEffect(() => {
    localStorage.setItem("edu_db_hostel_blocks", JSON.stringify(hostelBlocks));
  }, [hostelBlocks]);
  useEffect(() => {
    localStorage.setItem("edu_db_hostel_beds", JSON.stringify(hostelBeds));
  }, [hostelBeds]);

  // Auto-reconcile uniform package stocks in real-time based on active non-returned student uniform issues
  useEffect(() => {
    if (!studentUniformIssues || studentUniformIssues.length === 0) return;

    setUniforms((prevU) => {
      let changed = false;
      const reconciled = prevU.map((u) => {
        const isPkg =
          u.isPackage || (u.category || "").toLowerCase().includes("package");
        if (!isPkg) return u;

        const opening =
          u.openingStock !== undefined
            ? u.openingStock
            : u.initialStock !== undefined
              ? u.initialStock
              : 150;
        const uCatClean = (u.category || u.name || "").toLowerCase().trim();
        const uSizeClean = (u.size || "").toLowerCase().trim();

        const activeCount = studentUniformIssues.reduce((sum, issue) => {
          if (
            !issue ||
            issue.status === "Returned" ||
            (issue.notes || "").toLowerCase().includes("returned")
          ) {
            return sum;
          }
          const iCatClean = (issue.itemName || "")
            .replace(/\s*\(extra\)/gi, "")
            .toLowerCase()
            .trim();
          const iSizeClean = (issue.size || "").toLowerCase().trim();

          const isCatMatch =
            iCatClean === uCatClean ||
            uCatClean.includes(iCatClean) ||
            iCatClean.includes(uCatClean);
          const isSizeMatch =
            !uSizeClean || !iSizeClean || uSizeClean === iSizeClean;

          if (isCatMatch && isSizeMatch) {
            return sum + (issue.quantity || 1);
          }
          return sum;
        }, 0);

        const correctAvail = Math.max(0, opening - activeCount);
        if (u.availableStock !== correctAvail) {
          changed = true;
          return { ...u, availableStock: correctAvail };
        }
        return u;
      });

      return changed ? reconciled : prevU;
    });
  }, [studentUniformIssues]);

  useEffect(() => {
    localStorage.setItem("edu_db_custom_roles", JSON.stringify(customRoles));
  }, [customRoles]);
  useEffect(() => {
    localStorage.setItem("edu_db_fee_payments", JSON.stringify(feePayments));
  }, [feePayments]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_finance_transactions",
      JSON.stringify(financeTransactions),
    );
  }, [financeTransactions]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "financial_accounts",
        JSON.stringify(financialAccounts),
      );
      localStorage.setItem(
        "edu_db_financial_accounts",
        JSON.stringify(financialAccounts),
      );
    } catch (e) {}
  }, [financialAccounts]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "financial_categories",
        JSON.stringify(financialCategories),
      );
      localStorage.setItem(
        "edu_db_financial_categories",
        JSON.stringify(financialCategories),
      );
    } catch (e) {}
  }, [financialCategories]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_financial_budgets",
      JSON.stringify(financialBudgets),
    );
  }, [financialBudgets]);
  useEffect(() => {
    localStorage.setItem("edu_db_school_events", JSON.stringify(schoolEvents));
  }, [schoolEvents]);

  // One-time automatic normalization of class names to "Class X"
  useEffect(() => {
    // Auto-remove any cloned classes from local databases if present
    const hasCloneClasses = academicClasses.some((c) =>
      c.name.toLowerCase().includes("clone"),
    );
    if (hasCloneClasses) {
      const cleanClasses = academicClasses.filter(
        (c) => !c.name.toLowerCase().includes("clone"),
      );
      setAcademicClasses(cleanClasses);
      setStudents((prev) =>
        prev.map((s) => {
          if (s.className && s.className.toLowerCase().includes("clone")) {
            return { ...s, className: "", section: "", rollNo: "" };
          }
          return s;
        }),
      );
      setTeacherAssignments((prev) =>
        prev.filter((ta) => !ta.className.toLowerCase().includes("clone")),
      );
      setTimetable((prev) =>
        prev.filter((ts) => !ts.className.toLowerCase().includes("clone")),
      );
    }

    const normalizeClassNameStr = (nameString: string): string => {
      let clean = nameString.trim();
      const match = clean.match(/^(grade|class)\s*(\d+.*)$/i);
      if (match) {
        return `Class ${match[2].trim()}`;
      }
      return clean;
    };

    const nameMap: Record<string, string> = {};
    let classesChanged = false;
    const migratedClasses = academicClasses.map((c) => {
      const newName = normalizeClassNameStr(c.name);
      if (newName !== c.name || (c as any).displayName !== newName) {
        classesChanged = true;
        nameMap[c.name] = newName;
        return {
          ...c,
          name: newName,
          displayName: newName,
        };
      }
      return c;
    });

    if (classesChanged) {
      setAcademicClasses(migratedClasses);

      // Update students
      setStudents((prev) =>
        prev.map((s) => {
          if (s.className && nameMap[s.className]) {
            return { ...s, className: nameMap[s.className] };
          }
          return s;
        }),
      );

      // Update teacher assignments
      setTeacherAssignments((prev) =>
        prev.map((ta) => {
          if (ta.className && nameMap[ta.className]) {
            return { ...ta, className: nameMap[ta.className] };
          }
          return ta;
        }),
      );

      // Update timetable slots
      setTimetable((prev) =>
        prev.map((ts) => {
          if (ts.className && nameMap[ts.className]) {
            return { ...ts, className: nameMap[ts.className] };
          }
          return ts;
        }),
      );
    }
  }, []);

  // Training & Assessments States
  const [workshops, setWorkshops] = useState<WorkshopTraining[]>(() =>
    getStored("workshops", initialWorkshops),
  );
  const [employeeAssessments, setEmployeeAssessments] = useState<
    EmployeeAssessment[]
  >(() => getStored("employee_assessments", initialEmployeeAssessments));
  const [issuedCertificates, setIssuedCertificates] = useState<
    IssuedCertificate[]
  >(() => getStored("issued_certificates", initialIssuedCertificates));

  // Alumni ERP State
  const [alumniRecords, setAlumniRecords] = useState<AlumniRecord[]>(() =>
    getStored("alumni_records", initialAlumniRecords),
  );

  useEffect(() => {
    localStorage.setItem("edu_db_workshops", JSON.stringify(workshops));
  }, [workshops]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_employee_assessments",
      JSON.stringify(employeeAssessments),
    );
  }, [employeeAssessments]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_issued_certificates",
      JSON.stringify(issuedCertificates),
    );
  }, [issuedCertificates]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_alumni_records",
      JSON.stringify(alumniRecords),
    );
  }, [alumniRecords]);

  // ERP Effects
  useEffect(() => {
    localStorage.setItem("edu_db_fee_heads", JSON.stringify(feeHeads));
  }, [feeHeads]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_dynamic_fee_structures",
      JSON.stringify(dynamicFeeStructures),
    );
  }, [dynamicFeeStructures]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_fee_assignments",
      JSON.stringify(studentFeeAssignments),
    );
  }, [studentFeeAssignments]);
  useEffect(() => {
    localStorage.setItem("edu_db_scholarships", JSON.stringify(scholarships));
  }, [scholarships]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_scholarships",
      JSON.stringify(studentScholarships),
    );
  }, [studentScholarships]);
  useEffect(() => {
    localStorage.setItem("edu_db_discounts", JSON.stringify(discounts));
    localStorage.setItem("discounts", JSON.stringify(discounts));
  }, [discounts]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_discounts",
      JSON.stringify(studentDiscounts),
    );
    localStorage.setItem("student_discounts", JSON.stringify(studentDiscounts));
  }, [studentDiscounts]);
  useEffect(() => {
    localStorage.setItem("edu_db_fine_rules", JSON.stringify(fineRules));
  }, [fineRules]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_erp_transport_routes",
      JSON.stringify(erpTransportRoutes),
    );
  }, [erpTransportRoutes]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_transports",
      JSON.stringify(studentTransports),
    );
  }, [studentTransports]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_hostel_masters",
      JSON.stringify(hostelMasters),
    );
  }, [hostelMasters]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_room_type_masters",
      JSON.stringify(roomTypeMasters),
    );
  }, [roomTypeMasters]);
  useEffect(() => {
    localStorage.setItem("edu_db_room_masters", JSON.stringify(roomMasters));
  }, [roomMasters]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_hostel_assignments",
      JSON.stringify(studentHostelAssignments),
    );
  }, [studentHostelAssignments]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_hostel_visitor_logs",
      JSON.stringify(hostelVisitorLogs),
    );
  }, [hostelVisitorLogs]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_hostel_attendance_logs",
      JSON.stringify(hostelAttendanceLogs),
    );
  }, [hostelAttendanceLogs]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_finance_hostel_configs",
      JSON.stringify(financeHostelConfigs),
    );
  }, [financeHostelConfigs]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_hostels",
      JSON.stringify(studentHostels),
    );
  }, [studentHostels]);
  useEffect(() => {
    localStorage.setItem("edu_db_refunds", JSON.stringify(refunds));
  }, [refunds]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_finance_settings",
      JSON.stringify(financeSettings),
    );
  }, [financeSettings]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_question_papers",
      JSON.stringify(questionPapers),
    );
  }, [questionPapers]);
  useEffect(() => {
    localStorage.setItem("edu_db_school_meetings", JSON.stringify(meetings));
  }, [meetings]);
  useEffect(() => {
    localStorage.setItem("edu_db_departments", JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    localStorage.setItem("edu_db_designations", JSON.stringify(designations));
  }, [designations]);

  // Uniform ERP Effects (API & Database driven - no local storage caching)
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_uniform_issues",
      JSON.stringify(studentUniformIssues),
    );
    localStorage.setItem(
      "student_uniform_issues",
      JSON.stringify(studentUniformIssues),
    );
  }, [studentUniformIssues]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_finance_uniform_configs",
      JSON.stringify(financeUniformConfigs),
    );
  }, [financeUniformConfigs]);

  // Persist Uniform ERP State
  useEffect(() => {
    setUniformInventory((prevInv) => {
      if (!prevInv) return [];
      const seen = new Set<string>();
      const deduplicated: UniformInventoryItem[] = [];

      for (const item of prevInv) {
        if (!item) continue;
        const normName = (item.itemName || item.category || "")
          .toLowerCase()
          .trim();
        if (
          !normName ||
          normName.includes("polo") ||
          normName === "winter blazer"
        )
          continue;

        const key = `${normName}_${(item.size || "m").toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(item);
        }
      }
      return deduplicated;
    });

    setUniforms((prevU) => {
      if (!prevU) return [];
      const seen = new Set<string>();
      const deduplicated: UniformItem[] = [];

      for (const u of prevU) {
        if (!u) continue;
        const normName = (u.name || u.category || "").toLowerCase().trim();
        if (
          !normName ||
          normName.includes("polo") ||
          normName === "winter blazer"
        )
          continue;

        const key = `${normName}_${(u.size || "m").toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(u);
        }
      }
      return deduplicated;
    });

    setStudentUniformIssues((prev) => {
      if (!prev) return [];
      const filtered = prev.filter(
        (iss) =>
          !iss.studentName?.toLowerCase().includes("dattu") &&
          !iss.notes?.toLowerCase().includes("dattu"),
      );
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, []);

  // Auto-sync uniformCategories with uniforms catalog & inventory (Strict 1-to-1 count & deduplication)
  useEffect(() => {
    if (!uniformCategories || uniformCategories.length === 0) return;

    const validCatList = uniformCategories
      .map((c) => {
        const name = (c.name || (c as any).categoryName || "").trim();
        return { id: c.id, name, norm: name.toLowerCase() };
      })
      .filter((c) => c.name !== "");

    const validCatNorms = new Set(validCatList.map((c) => c.norm));

    // 1. Strict deduplication of uniforms catalog and dynamic Finance Setup price sync
    setUniforms((prevU) => {
      const seenItemKeys = new Set<string>();
      const seenCatNorms = new Set<string>();
      const deduplicated: UniformItem[] = [];

      for (const u of prevU || []) {
        if (!u) continue;
        const norm = (u.category || u.name || "").toLowerCase().trim();
        if (!norm) continue;
        seenCatNorms.add(norm);
        const itemKey = `${u.id || ""}_${norm}_${u.size || ""}`;
        if (!seenItemKeys.has(itemKey)) {
          seenItemKeys.add(itemKey);
          const dynamicPrice = getItemFeeFromFinanceConfig(
            "",
            u.category || u.name,
            u.gender,
            financeUniformConfigs,
            u.price,
          );
          deduplicated.push({ ...u, price: dynamicPrice });
        }
      }
      if (JSON.stringify(deduplicated) !== JSON.stringify(prevU)) {
        return deduplicated;
      }
      return prevU;
    });
  }, [uniformCategories, financeUniformConfigs]);

  // Auto-sync uniformInventory with uniforms list (Strict deduplication - preserves saved stock)
  useEffect(() => {
    if (!uniforms || uniforms.length === 0) {
      setUniformInventory((prev) => {
        if (prev && prev.length > 0) {
          return [];
        }
        return prev;
      });
      return;
    }

    setUniformInventory((prevInv) => {
      const validItems = uniforms
        .map((u) => ({
          id: u.id,
          name: u.category || u.name || "",
          size: u.size || (u as any).meterRange || "M",
          norm: `${(u.category || u.name || "").toLowerCase().trim()}_${(u.size || (u as any).meterRange || "").toLowerCase().trim()}_${u.id}`,
          stock:
            u.availableStock !== undefined ? Number(u.availableStock) : 100,
        }))
        .filter((x) => x.name !== "");

      const seenNorms = new Set<string>();
      const deduplicated: UniformInventoryItem[] = [];

      for (const inv of prevInv || []) {
        if (!inv) continue;
        const normKey = `${(inv.itemName || inv.category || "").toLowerCase().trim()}_${(inv.size || (inv as any).meterRange || "").toLowerCase().trim()}_${inv.itemId || inv.id}`;
        if (!seenNorms.has(normKey)) {
          seenNorms.add(normKey);
          const openingCap = Math.min(100, inv.openingStock || 100);
          const cappedStock = Math.min(
            openingCap,
            inv.currentStock !== undefined ? inv.currentStock : openingCap,
          );
          deduplicated.push({
            ...inv,
            openingStock: openingCap,
            currentStock: cappedStock,
          });
        }
      }

      validItems.forEach((item) => {
        if (!seenNorms.has(item.norm)) {
          seenNorms.add(item.norm);
          deduplicated.push({
            id: `UINV-${item.id || Date.now()}`,
            itemId: item.id,
            itemName: item.name,
            category: item.name,
            size: item.size,
            openingStock: item.stock,
            currentStock: item.stock,
            minimumStock: 10,
            reorderLevel: 15,
            status:
              item.stock === 0
                ? "Out of Stock"
                : item.stock <= 10
                  ? "Low Stock"
                  : "In Stock",
            branch: selectedBranch || "",
          } as any);
        }
      });

      if (deduplicated.length !== (prevInv || []).length) {
        try {
          localStorage.setItem(
            "edu_db_uniform_inventory",
            JSON.stringify(deduplicated),
          );
        } catch (e) {}
        return deduplicated;
      }
      return prevInv;
    });
  }, [uniforms]);

  // Transport ERP Effects
  useEffect(() => {
    localStorage.setItem("edu_db_route_masters", JSON.stringify(routeMasters));
  }, [routeMasters]);
  useEffect(() => {
    localStorage.setItem("edu_db_pickup_points", JSON.stringify(pickupPoints));
  }, [pickupPoints]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_vehicle_masters",
      JSON.stringify(vehicleMasters),
    );
  }, [vehicleMasters]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_driver_masters",
      JSON.stringify(driverMasters),
    );
  }, [driverMasters]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_bus_attendants",
      JSON.stringify(busAttendants),
    );
  }, [busAttendants]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_vehicle_assignments",
      JSON.stringify(vehicleAssignments),
    );
  }, [vehicleAssignments]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_vehicle_maintenances",
      JSON.stringify(vehicleMaintenances),
    );
  }, [vehicleMaintenances]);

  // Fetch API data on mount
  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        const results = await Promise.allSettled([
          TransportAPI.fetchRoutesApi(),
          TransportAPI.fetchPickupPointsApi(),
          TransportAPI.fetchVehiclesApi(),
          TransportAPI.fetchDriversApi(),
          TransportAPI.fetchVehicleAssignmentsApi(),
          TransportAPI.fetchMaintenanceApi(),
          TransportAPI.fetchAttendantsApi(),
          TransportAPI.fetchStudentAssignmentsApi(),
        ]);

        const extractData = (result: any) => {
          if (result.status !== "fulfilled" || !result.value) return null;

          let dataArray = null;
          const val = result.value;

          if (Array.isArray(val)) dataArray = val;
          else if (val?.items && Array.isArray(val.items))
            dataArray = val.items;
          else if (val?.Items && Array.isArray(val.Items))
            dataArray = val.Items;
          else if (val?.data && Array.isArray(val.data)) dataArray = val.data;
          else if (val?.data?.items && Array.isArray(val.data.items))
            dataArray = val.data.items;
          else if (val?.data?.Items && Array.isArray(val.data.Items))
            dataArray = val.data.Items;

          if (!dataArray) return null;

          return dataArray.map((item: any) => ({
            ...item,
            id: (
              item.id ||
              item.routeId ||
              item.vehicleId ||
              item.driverId ||
              item.pickupPointId ||
              item.assignmentId ||
              item.maintenanceId ||
              item.studentTransportId ||
              item.attendantId ||
              item.busAttendantId ||
              ""
            ).toString(),
          }));
        };

        const routes = extractData(results[0]);
        const points = extractData(results[1]);
        const vehicles = extractData(results[2]);
        const drivers = extractData(results[3]);
        const assignments = extractData(results[4]);
        const maintenance = extractData(results[5]);
        const attendants = extractData(results[6]);

        const normalizeStatus = (status: any) => {
          if (
            status === true ||
            String(status).toLowerCase() === "true" ||
            String(status).toLowerCase() === "active"
          ) {
            return "Active";
          }
          if (String(status).toLowerCase() === "on leave") {
            return "On Leave";
          }
          return "Inactive";
        };

        const deletedRouteIds = new Set<string>(
          JSON.parse(localStorage.getItem("edu_db_deleted_route_ids") || "[]"),
        );
        const deletedPickupIds = new Set<string>(
          JSON.parse(localStorage.getItem("edu_db_deleted_pickup_ids") || "[]"),
        );
        const deletedVehicleIds = new Set<string>(
          JSON.parse(
            localStorage.getItem("edu_db_deleted_vehicle_ids") || "[]",
          ),
        );
        const deletedDriverIds = new Set<string>(
          JSON.parse(localStorage.getItem("edu_db_deleted_driver_ids") || "[]"),
        );
        const deletedAssignmentIds = new Set<string>(
          JSON.parse(
            localStorage.getItem("edu_db_deleted_assignment_ids") || "[]",
          ),
        );

        const mergeApiAndLocal = <T extends { id: string | number }>(
          apiList: T[],
          localKey: string,
          deletedSet?: Set<string>,
        ): T[] => {
          const saved = localStorage.getItem(localKey);
          let localList: T[] = [];
          if (saved) {
            try {
              localList = JSON.parse(saved);
            } catch (e) {
              console.error("Error parsing local storage key " + localKey, e);
            }
          }
          const merged = [...apiList];
          if (Array.isArray(localList)) {
            localList.forEach((localItem: any) => {
              if (
                localItem &&
                localItem.id !== undefined &&
                localItem.id !== null &&
                !localItem.isDeleted &&
                localItem.status !== "Deleted" &&
                (!deletedSet || !deletedSet.has(String(localItem.id)))
              ) {
                if (
                  !merged.some(
                    (m) => m.id.toString() === localItem.id.toString(),
                  )
                ) {
                  merged.push(localItem);
                }
              }
            });
          }
          return deletedSet
            ? merged.filter((item: any) => !deletedSet.has(String(item.id)))
            : merged;
        };

        if (routes) {
          const mergedRoutes = routes.map((r: any) => {
            const stored = localStorage.getItem(`route_slab_${r.id}`);
            let updated = { ...r };
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                updated = {
                  ...r,
                  minDistanceKm: parsed.minDistanceKm ?? r.minDistanceKm,
                  minBaseFare: parsed.minBaseFare ?? r.minBaseFare,
                  ratePerKm: parsed.ratePerKm ?? r.ratePerKm,
                  acMinBaseFare: parsed.acMinBaseFare ?? r.acMinBaseFare,
                  acRatePerKm: parsed.acRatePerKm ?? r.acRatePerKm,
                };
              } catch (e) {
                console.error(e);
              }
            }
            return {
              id: (updated.id || updated.routeId || "").toString(),
              routeCode: updated.routeCode || "",
              routeName: updated.routeName || "",
              routeStart: updated.routeStart || updated.startLocation || "",
              routeEnd: updated.routeEnd || updated.endLocation || "",
              totalDistanceKm: Number(
                updated.totalDistanceKm !== undefined
                  ? updated.totalDistanceKm
                  : updated.distanceKm !== undefined
                    ? updated.distanceKm
                    : 0,
              ),
              estimatedTimeMinutes: Number(
                updated.estimatedTimeMinutes !== undefined
                  ? updated.estimatedTimeMinutes
                  : updated.estimatedDurationMinutes !== undefined
                    ? updated.estimatedDurationMinutes
                    : 0,
              ),
              minDistanceKm: Number(
                updated.minDistanceKm !== undefined
                  ? updated.minDistanceKm
                  : updated.minRangeKm !== undefined
                    ? updated.minRangeKm
                    : updated.minRange !== undefined
                      ? updated.minRange
                      : 5,
              ),
              minBaseFare: Number(
                updated.minBaseFare !== undefined
                  ? updated.minBaseFare
                  : updated.nonAcBaseFare !== undefined
                    ? updated.nonAcBaseFare
                    : 1000,
              ),
              ratePerKm: Number(
                updated.ratePerKm !== undefined
                  ? updated.ratePerKm
                  : updated.nonAcRateAddlKm !== undefined
                    ? updated.nonAcRateAddlKm
                    : updated.nonAcRatePerKm !== undefined
                      ? updated.nonAcRatePerKm
                      : 100,
              ),
              acMinBaseFare: Number(
                updated.acMinBaseFare !== undefined
                  ? updated.acMinBaseFare
                  : updated.acBaseFare !== undefined
                    ? updated.acBaseFare
                    : 1200,
              ),
              acRatePerKm: Number(
                updated.acRatePerKm !== undefined
                  ? updated.acRatePerKm
                  : updated.acRateAddlKm !== undefined
                    ? updated.acRateAddlKm
                    : updated.acRatePerKm !== undefined
                      ? updated.acRatePerKm
                      : 150,
              ),
              description: updated.description || "",
              status: normalizeStatus(updated.status),
            };
          });
          const validRoutes = mergedRoutes.filter(
            (r: any) =>
              r.routeName &&
              r.routeName.trim() !== "" &&
              r.routeName.toUpperCase() !== "N/A" &&
              !r.isDeleted &&
              r.status !== "Deleted" &&
              !deletedRouteIds.has(String(r.id)) &&
              !deletedRouteIds.has(String(r.routeId)) &&
              !deletedRouteIds.has(String(r.routeCode)),
          );
          setRouteMasters(validRoutes);
          localStorage.setItem(
            "edu_db_route_masters",
            JSON.stringify(validRoutes),
          );
        }
        if (points) {
          const mappedPoints = points.map((p: any) => ({
            id: (p.id || p.pickupPointId || p.pickupId || "").toString(),
            routeId: (p.routeId || p.transportRouteId || "").toString(),
            routeName: p.routeName || p.selectRoute || "",
            pickupName: p.pickupName || p.pickupPointName || p.stopName || "",
            landmark: p.landmark || "",
            sequenceNumber: Number(
              p.sequenceNumber !== undefined
                ? p.sequenceNumber
                : p.sequenceNo !== undefined
                  ? p.sequenceNo
                  : 0,
            ),
            arrivalTime:
              p.morningPickupTime || p.arrivalTime || p.pickupTime || "",
            morningPickupTime:
              p.morningPickupTime || p.arrivalTime || p.pickupTime || "",
            eveningDropTime: p.eveningDropTime || p.dropTime || "",
            dropTime: p.eveningDropTime || p.dropTime || "",
            isDropOptional:
              p.isDropOptional ?? (!p.eveningDropTime && !p.dropTime),
            distanceFromSchoolKm: Number(
              p.distanceFromSchoolKm !== undefined
                ? p.distanceFromSchoolKm
                : p.distanceFromStart !== undefined
                  ? p.distanceFromStart
                  : 0,
            ),
            monthlyFee: Number(
              p.monthlyFee !== undefined
                ? p.monthlyFee
                : p.monthlyFare !== undefined
                  ? p.monthlyFare
                  : 0,
            ),
            status: normalizeStatus(p.status),
          }));

          const deletedPickupTrack = new Set<string>(
            JSON.parse(
              localStorage.getItem("edu_db_deleted_pickup_ids") || "[]",
            ),
          );
          const localStoredPoints: PickupPoint[] = JSON.parse(
            localStorage.getItem("edu_db_pickup_points") || "[]",
          );

          const activeRoutes = routes || routeMasters || [];
          const validRouteIds = new Set<string>(activeRoutes.map((r: any) => String(r.id || r.routeId)));
          const validRouteNames = new Set<string>(activeRoutes.map((r: any) => (r.routeName || '').trim().toLowerCase()));

          const isValidRouteForPoint = (pt: any) => {
            const rId = String(pt.routeId || '');
            const rName = (pt.routeName || '').trim().toLowerCase();
            return (rId && validRouteIds.has(rId)) || (rName && validRouteNames.has(rName));
          };

          const validMappedPoints = mappedPoints.filter(isValidRouteForPoint);

          // If backend provided points, use validMappedPoints directly as source of truth
          let finalPickupPoints: PickupPoint[];
          if (validMappedPoints.length > 0) {
            finalPickupPoints = validMappedPoints;
          } else {
            finalPickupPoints = localStoredPoints.filter(
              (pt) => isValidRouteForPoint(pt) && !deletedPickupTrack.has(String(pt.id))
            );
          }

          setPickupPoints(finalPickupPoints);
          localStorage.setItem(
            "edu_db_pickup_points",
            JSON.stringify(finalPickupPoints),
          );
        }
        if (vehicles) {
          const mappedVehicles = vehicles.map((v: any) => ({
            id: (v.id || v.vehicleId || "").toString(),
            vehicleNumber: v.vehicleNumber || "",
            registrationNumber: v.registrationNumber || v.regNumber || "",
            vehicleType: v.vehicleType || v.vehicleName || "",
            capacity: Number(
              v.capacity !== undefined
                ? v.capacity
                : v.seatingCapacity !== undefined
                  ? v.seatingCapacity
                  : 40,
            ),
            insuranceExpiry: v.insuranceExpiry || "",
            pollutionExpiry: v.pollutionExpiry || "",
            fitnessExpiry: v.fitnessExpiry || "",
            isAC: v.isAC === true,
            status: normalizeStatus(v.status),
          }));
          const localStoredVehicles: VehicleMaster[] = JSON.parse(
            localStorage.getItem("edu_db_vehicle_masters") || "[]",
          );
          const mergedVehiclesMap = new Map<string, VehicleMaster>();
          localStoredVehicles.forEach((v) => {
            if (v && v.vehicleNumber) {
              mergedVehiclesMap.set(
                String(v.id || v.vehicleNumber).toLowerCase(),
                v,
              );
            }
          });
          mappedVehicles.forEach((v: VehicleMaster) => {
            if (v && v.vehicleNumber) {
              const key = String(v.id || v.vehicleNumber).toLowerCase();
              mergedVehiclesMap.set(key, {
                ...mergedVehiclesMap.get(key),
                ...v,
              });
            }
          });
          const finalVehicles = Array.from(mergedVehiclesMap.values());
          setVehicleMasters(finalVehicles);
          localStorage.setItem(
            "edu_db_vehicle_masters",
            JSON.stringify(finalVehicles),
          );
        }
        if (drivers) {
          const mappedDrivers = drivers.map((d: any) => ({
            id: (d.id || d.driverId || "").toString(),
            employeeId: d.employeeId || d.empId || "",
            driverName:
              d.driverName || d.driverFullName || d.fullName || d.name || "",
            mobileNumber: d.mobileNumber || d.phone || "",
            email: d.email || "",
            licenseNumber:
              d.licenseNumber || d.licenceNumber || d.commercialLicenseNo || "",
            licenseExpiryDate: d.licenseExpiryDate || d.licenceExpiry || "",
            address: d.address || "",
            emergencyContact:
              d.emergencyContact || d.emergencyContactNumber || "",
            experienceYears: Number(d.experienceYears || 0),
            status: normalizeStatus(d.status),
          }));

          const localStoredDrivers: DriverMaster[] = JSON.parse(
            localStorage.getItem("edu_db_driver_masters") || "[]",
          );

          const uniqueDriversMap = new Map<string, DriverMaster>();
          mappedDrivers.forEach((drv: DriverMaster) => {
            const empKey = drv.employeeId?.trim().toLowerCase();
            const nameKey = drv.driverName?.trim().toLowerCase();
            const phoneKey = drv.mobileNumber?.trim();
            const key = empKey
              ? `emp_${empKey}`
              : nameKey && phoneKey
                ? `np_${nameKey}_${phoneKey}`
                : nameKey
                  ? `n_${nameKey}`
                  : drv.id
                    ? `id_${drv.id}`
                    : "";
            if (key && !uniqueDriversMap.has(key)) {
              uniqueDriversMap.set(key, drv);
            }
          });

          localStoredDrivers.forEach((localDrv: DriverMaster) => {
            if (!localDrv) return;
            const empKey = localDrv.employeeId?.trim().toLowerCase();
            const nameKey = localDrv.driverName?.trim().toLowerCase();
            const phoneKey = localDrv.mobileNumber?.trim();
            const matchEntry = Array.from(uniqueDriversMap.entries()).find(
              ([, existing]) =>
                (localDrv.id && String(existing.id) === String(localDrv.id)) ||
                (empKey &&
                  existing.employeeId?.trim().toLowerCase() === empKey) ||
                (nameKey &&
                  existing.driverName?.trim().toLowerCase() === nameKey),
            );
            if (matchEntry) {
              const [mKey, existing] = matchEntry;
              uniqueDriversMap.set(mKey, {
                ...existing,
                ...localDrv,
                id: existing.id || localDrv.id,
                licenseNumber: localDrv.licenseNumber || existing.licenseNumber,
                licenseExpiryDate:
                  localDrv.licenseExpiryDate || existing.licenseExpiryDate,
              });
            } else if (empKey || nameKey || localDrv.id) {
              const fallbackKey = empKey
                ? `emp_${empKey}`
                : nameKey && phoneKey
                  ? `np_${nameKey}_${phoneKey}`
                  : `id_${localDrv.id}`;
              uniqueDriversMap.set(fallbackKey, localDrv);
            }
          });

          const finalDrivers = Array.from(uniqueDriversMap.values());
          setDriverMasters(finalDrivers);
          localStorage.setItem(
            "edu_db_driver_masters",
            JSON.stringify(finalDrivers),
          );
        }
        if (assignments) {
          const mappedAssignments = assignments.map((a: any) => {
            let routeId = (a.routeId || "").toString();
            let routeName = a.routeName || a.selectRoute || "";
            if (!routeId && routeMasters) {
              const matchedRoute = routeMasters.find(
                (r: any) =>
                  r.routeName?.toLowerCase() === routeName.toLowerCase() ||
                  r.routeCode?.toLowerCase() === routeName.toLowerCase(),
              );
              if (matchedRoute) {
                routeId = matchedRoute.id.toString();
              }
            }
            if (
              (!routeName || routeName.trim().toUpperCase() === "N/A") &&
              routeId &&
              routeMasters
            ) {
              const matchedRoute = routeMasters.find(
                (r: any) => r.id?.toString() === routeId.toString(),
              );
              if (matchedRoute) {
                routeName =
                  matchedRoute.routeName || matchedRoute.routeCode || "";
              }
            }

            let vehicleId = (a.vehicleId || "").toString();
            let vehicleNumber = a.vehicleNumber || a.selectActiveVehicle || "";
            if (!vehicleId && vehicleMasters) {
              const matchedVehicle = vehicleMasters.find(
                (v: any) =>
                  v.vehicleNumber?.toLowerCase() ===
                  vehicleNumber.toLowerCase(),
              );
              if (matchedVehicle) {
                vehicleId = matchedVehicle.id.toString();
              }
            }
            if (!vehicleNumber && vehicleId && vehicleMasters) {
              const matchedVehicle = vehicleMasters.find(
                (v: any) => v.id?.toString() === vehicleId.toString(),
              );
              if (matchedVehicle) {
                vehicleNumber =
                  matchedVehicle.vehicleNumber ||
                  (matchedVehicle as any).vehicleName ||
                  "";
              }
            }

            let driverId = (a.driverId || "").toString();
            let driverName = a.driverName || a.selectLicensedDriver || "";
            if (!driverId && driverMasters) {
              const matchedDriver = driverMasters.find(
                (d: any) =>
                  d.driverName?.toLowerCase() === driverName.toLowerCase(),
              );
              if (matchedDriver) {
                driverId = matchedDriver.id.toString();
              }
            }
            if (!driverName && driverId && driverMasters) {
              const matchedDriver = driverMasters.find(
                (d: any) => d.id?.toString() === driverId.toString(),
              );
              if (matchedDriver) {
                driverName = matchedDriver.driverName || "";
              }
            }

            let attendantId = (a.attendantId || "").toString();
            let attendantName =
              a.attendantName || a.selectBusAttendant || a.busAttendant || "";
            let attendantMobile = a.attendantMobile || "";
            let attendantEmployeeId = a.attendantEmployeeId || "";
            let driverEmployeeId = a.driverEmployeeId || "";
            if (!attendantName && attendantId && attendants) {
              const matchedAttendant = attendants.find(
                (at: any) =>
                  at.id?.toString() === attendantId ||
                  at.attendantId?.toString() === attendantId ||
                  at.employeeId === attendantId,
              );
              if (matchedAttendant) {
                attendantName =
                  matchedAttendant.attendantName || matchedAttendant.name || "";
                attendantMobile =
                  attendantMobile ||
                  matchedAttendant.mobileNumber ||
                  matchedAttendant.phone ||
                  "";
                attendantEmployeeId =
                  attendantEmployeeId || matchedAttendant.employeeId || "";
              }
            }
            if (!attendantName && attendantId && staff) {
              const matchedStaff = (staff as any[]).find(
                (s: any) =>
                  s.id?.toString() === attendantId ||
                  `staff-${s.id}` === attendantId ||
                  s.employeeId === attendantId ||
                  s.empId === attendantId,
              );
              if (matchedStaff) {
                attendantName =
                  `${matchedStaff.firstName || ""} ${matchedStaff.lastName || ""}`.trim() ||
                  matchedStaff.name ||
                  "";
                attendantMobile =
                  attendantMobile ||
                  matchedStaff.phone ||
                  matchedStaff.mobileNumber ||
                  "";
                attendantEmployeeId =
                  attendantEmployeeId ||
                  matchedStaff.empId ||
                  matchedStaff.employeeId ||
                  "";
              }
            }

            return {
              id: (a.id || a.assignmentId || "").toString(),
              branch: a.branch || "",
              academicYear: a.academicYear || "",
              routeId,
              routeName,
              vehicleId,
              vehicleNumber,
              driverId,
              driverName,
              driverEmployeeId,
              attendantId,
              attendantName,
              attendantEmployeeId,
              attendantMobile,
              morningTripTime: a.morningTripTime || a.morningTrip || "",
              eveningTripTime: a.eveningTripTime || a.eveningTrip || "",
              effectiveFrom: a.effectiveFrom || a.effectiveFromDate || "",
              effectiveTo: a.effectiveTo || "",
              status: normalizeStatus(a.status),
            };
          });

          const activeSeen = new Set<string>();
          const sortedAssignments = [...mappedAssignments].sort((a, b) => {
            const aHasAttendant =
              a.attendantName && a.attendantName.toLowerCase() !== "unassigned"
                ? 1
                : 0;
            const bHasAttendant =
              b.attendantName && b.attendantName.toLowerCase() !== "unassigned"
                ? 1
                : 0;
            if (aHasAttendant !== bHasAttendant)
              return bHasAttendant - aHasAttendant;
            return (Number(b.id) || 0) - (Number(a.id) || 0);
          });

          const deduplicatedAssignments = sortedAssignments.map((a) => {
            if (a.status !== "Active") return a;
            const key =
              (a.vehicleNumber ? a.vehicleNumber.trim().toUpperCase() : "") ||
              a.vehicleId;
            if (key && activeSeen.has(key)) {
              return { ...a, status: "Inactive" as const };
            }
            if (key) activeSeen.add(key);
            return a;
          });

          setVehicleAssignments(deduplicatedAssignments);
          localStorage.setItem(
            "edu_db_vehicle_assignments",
            JSON.stringify(deduplicatedAssignments),
          );
        }
        if (maintenance) {
          const mappedMaintenance = maintenance.map((m: any) => {
            let vNum = m.vehicleNumber || "";
            if (!vNum && vehicles) {
              const matchedVeh = vehicles.find(
                (v: any) => v.id?.toString() === m.vehicleId?.toString(),
              );
              if (matchedVeh) {
                vNum = matchedVeh.vehicleNumber || "";
              }
            }
            return {
              id: (m.id || m.maintenanceId || "").toString(),
              vehicleId: (m.vehicleId || "").toString(),
              vehicleNumber: vNum,
              serviceDate: m.serviceDate ? m.serviceDate.split("T")[0] : "",
              serviceType: m.serviceType || m.type || "Routine Service",
              vendor: m.vendor || m.serviceCenter || "Default Vendor",
              cost: Number(m.cost || 0),
              nextServiceDue: m.nextServiceDue
                ? m.nextServiceDue.split("T")[0]
                : "",
              remarks: m.remarks || m.description || "",
              status: normalizeStatus(m.status),
            };
          });
          setVehicleMaintenances(mappedMaintenance);
        }
        if (attendants) {
          const mappedAttendants = attendants.map((a: any) => ({
            id: (a.id || a.attendantId || "").toString(),
            employeeId: a.employeeId || a.empId || "",
            attendantName:
              a.attendantName ||
              a.attendantFullName ||
              a.fullName ||
              a.name ||
              "",
            mobileNumber: a.mobileNumber || a.phone || "",
            gender: a.gender || "",
            branch: a.branch || a.branchName || "",
            status: normalizeStatus(a.status),
          }));

          const uniqueAttendantsMap = new Map<string, BusAttendantMaster>();
          mappedAttendants.forEach((att: BusAttendantMaster) => {
            const empKey = att.employeeId?.trim().toLowerCase();
            const nameKey = att.attendantName?.trim().toLowerCase();
            const phoneKey = att.mobileNumber?.trim();
            const key = empKey
              ? `emp_${empKey}`
              : nameKey && phoneKey
                ? `np_${nameKey}_${phoneKey}`
                : nameKey
                  ? `n_${nameKey}`
                  : att.id
                    ? `id_${att.id}`
                    : "";
            if (key && !uniqueAttendantsMap.has(key)) {
              uniqueAttendantsMap.set(key, att);
            }
          });
          setBusAttendants(Array.from(uniqueAttendantsMap.values()));
        }
        const studentTransportsData = extractData(results[7]);
        if (studentTransportsData) {
          const mappedTransports = studentTransportsData.map((t: any) => {
            let admNo = t.admissionNo || t.admissionNumber || "";
            if (!admNo && students) {
              const matchedStudent = students.find(
                (s: any) => s.id?.toString() === t.studentId?.toString(),
              );
              if (matchedStudent) {
                admNo =
                  matchedStudent.admissionNo ||
                  (matchedStudent as any).admissionNumber ||
                  "";
              }
            }
            if (!admNo && admissions) {
              const matchedAdm = admissions.find(
                (a: any) =>
                  a.id?.toString() === t.studentId?.toString() ||
                  a.registrationNo === t.admissionNo ||
                  a.applicationNo === t.admissionNo,
              );
              if (matchedAdm) {
                admNo =
                  matchedAdm.registrationNo || matchedAdm.applicationNo || "";
              }
            }

            let sName = t.studentName || t.fullName || "";
            if (!sName && students) {
              const matchedStudent = students.find(
                (s: any) =>
                  s.id?.toString() === t.studentId?.toString() ||
                  (admNo && s.admissionNo === admNo),
              );
              if (matchedStudent) {
                sName =
                  `${matchedStudent.firstName || ""} ${matchedStudent.lastName || ""}`.trim() ||
                  matchedStudent.name ||
                  "";
              }
            }

            return {
              id: (
                t.id ||
                t.studentTransportAssignmentId ||
                t.studentTransportId ||
                ""
              ).toString(),
              studentId: (t.studentId || "").toString(),
              studentName: sName,
              admissionNo: admNo,
              routeName: t.routeName || "",
              routeId: (t.routeId || "").toString(),
              pickupPoint:
                t.pickupPoint || t.pickupPointName || t.pickupName || "",
              pickupPointId: (t.pickupPointId || "").toString(),
              vehicleNumber: t.vehicleNumber || "",
              vehicleId: (
                t.vehicleId ||
                t.vehicleAssignmentId ||
                ""
              ).toString(),
              branch: t.branch || t.branchName || "",
              academicYear: t.academicYear || "",
              feePlan: t.feePlan || "Monthly",
              feeAmount: Number(t.feeAmount || 0),
              effectiveFrom: t.effectiveFrom
                ? t.effectiveFrom.split("T")[0]
                : "",
              status: normalizeStatus(t.status),
            };
          });

          const localStoredTransports: StudentTransport[] = JSON.parse(
            localStorage.getItem("edu_db_student_transports") || "[]",
          );

          const activeRoutes = routes || routeMasters || [];
          const validRouteIds = new Set<string>(activeRoutes.map((r: any) => String(r.id || r.routeId)));
          const validRouteNames = new Set<string>(activeRoutes.map((r: any) => (r.routeName || '').trim().toLowerCase()));

          const isValidRouteForTransport = (st: any) => {
            const rId = String(st.routeId || '');
            const rName = (st.routeName || '').trim().toLowerCase();
            return (!rId && !rName) || (rId && validRouteIds.has(rId)) || (rName && validRouteNames.has(rName));
          };

          const validMappedTransports = mappedTransports.filter(isValidRouteForTransport);

          // If backend provided student transports, use validMappedTransports directly
          let finalTransports: StudentTransport[];
          if (validMappedTransports.length > 0) {
            finalTransports = validMappedTransports;
          } else {
            finalTransports = localStoredTransports.filter(isValidRouteForTransport);
          }

          setStudentTransports(finalTransports);
          localStorage.setItem(
            "edu_db_student_transports",
            JSON.stringify(finalTransports),
          );
        }

        if (results.some((r) => r.status === "rejected")) {
          console.warn(
            "Some Transport API fetches failed",
            results.filter((r) => r.status === "rejected"),
          );
        }
      } catch (err) {
        console.warn("Transport API fetch failed entirely", err);
      }
    };
    fetchTransportData();
  }, [isAuthenticated]);

  // Finance Transport Config & Ledger Effects
  useEffect(() => {
    localStorage.setItem(
      "edu_db_finance_transport_configs",
      JSON.stringify(financeTransportConfigs),
    );
  }, [financeTransportConfigs]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_fee_ledgers",
      JSON.stringify(studentFeeLedgers),
    );
  }, [studentFeeLedgers]);

  // Synchronize studentFeeLedgers with dynamic fee structures & assignments:
  // Prune any ledger where student has no active assignment, no payments, and no addons
  useEffect(() => {
    setStudentFeeLedgers((prev) => {
      let changed = false;
      const next = prev.filter((ledger) => {
        const hasAssign = studentFeeAssignments.some(
          (a) =>
            (a.studentId === ledger.studentId ||
              (ledger.admissionNo && a.admissionNo === ledger.admissionNo)) &&
            a.status === "Active",
        );
        const hasPayments = feePayments.some(
          (p) =>
            p.studentId === ledger.studentId ||
            (ledger.admissionNo && p.admissionNo === ledger.admissionNo),
        );
        const hasTransport = studentTransports.some(
          (t) =>
            (t.studentId === ledger.studentId ||
              (ledger.admissionNo && t.admissionNo === ledger.admissionNo)) &&
            t.status === "Active",
        );
        const hasHostel = studentHostels.some(
          (h) =>
            (h.studentId === ledger.studentId ||
              (ledger.admissionNo && h.admissionNo === ledger.admissionNo)) &&
            h.status === "Active",
        );
        if (!hasAssign && !hasPayments && !hasTransport && !hasHostel) {
          changed = true;
          return false;
        }
        return true;
      });
      return changed ? next : prev;
    });
  }, [studentFeeAssignments, feePayments, studentTransports, studentHostels]);

  useEffect(() => {
    localStorage.setItem(
      "edu_db_academic_year_fee_schedules",
      JSON.stringify(academicYearFeeSchedules),
    );
  }, [academicYearFeeSchedules]);

  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_fee_installments",
      JSON.stringify(studentFeeInstallments),
    );
  }, [studentFeeInstallments]);

  // Leave & Payroll System Effects
  useEffect(() => {
    localStorage.setItem("edu_db_holidays", JSON.stringify(holidays));
  }, [holidays]);
  useEffect(() => {
    localStorage.setItem("edu_db_leave_types", JSON.stringify(leaveTypes));
  }, [leaveTypes]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_payroll_configurations",
      JSON.stringify(payrollConfigurations),
    );
  }, [payrollConfigurations]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_payroll_components",
      JSON.stringify(payrollComponents),
    );
  }, [payrollComponents]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_salary_structures",
      JSON.stringify(salaryStructures),
    );
  }, [salaryStructures]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_employee_salary_assignments",
      JSON.stringify(employeeSalaryAssignments),
    );
  }, [employeeSalaryAssignments]);
  useEffect(() => {
    localStorage.setItem("edu_db_payroll_runs", JSON.stringify(payrollRuns));
  }, [payrollRuns]);

  useEffect(() => {
    localStorage.setItem("edu_db_exams", JSON.stringify(exams));
  }, [exams]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_exam_schedules",
      JSON.stringify(examSchedules),
    );
  }, [examSchedules]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_grade_configurations",
      JSON.stringify(gradeConfigurations),
    );
  }, [gradeConfigurations]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_attendance",
      JSON.stringify(studentAttendance),
    );
  }, [studentAttendance]);

  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_uniform_issues",
      JSON.stringify(studentUniformIssues),
    );
    localStorage.setItem(
      "student_uniform_issues",
      JSON.stringify(studentUniformIssues),
    );
  }, [studentUniformIssues]);

  useEffect(() => {
    localStorage.setItem(
      "edu_db_finance_uniform_configs",
      JSON.stringify(financeUniformConfigs),
    );
    localStorage.setItem(
      "finance_uniform_configs",
      JSON.stringify(financeUniformConfigs),
    );
  }, [financeUniformConfigs]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_co_scholastic_assessments",
      JSON.stringify(coScholasticAssessments),
    );
  }, [coScholasticAssessments]);

  const fetchTeacherAssignments = async () => {
    try {
      const res: any = await fetchClassTeacherAssignmentsApi();
      const list = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(list)) {
        const norm = (str?: string) =>
          (str || "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/class/gi, "")
            .replace(/section/gi, "");
        const mapped: TeacherAssignment[] = list.map((ta: any) => ({
          id: ta.id
            ? String(ta.id)
            : `TA-${Math.floor(100 + Math.random() * 900)}`,
          academicYear: ta.academicYear || selectedAcademicYear || "",
          branch: ta.branch || selectedBranch || "",
          className: ta.className || "",
          section: ta.section || "A",
          subject: ta.subject || "",
          teacherId: ta.teacherId ? String(ta.teacherId) : "",
          teacherName: ta.teacherName || "",
          status: ta.status || "Active",
          role: ta.role || "Subject Teacher",
        }));

        // Deduplicate: ensure latest assignment per class/section/subject
        const deduplicatedMap = new Map<string, TeacherAssignment>();
        for (const ta of mapped) {
          const key = `${norm(ta.className)}_${norm(ta.section)}_${norm(ta.subject)}_${(ta.role || "Subject Teacher").toLowerCase()}`;
          deduplicatedMap.set(key, ta);
        }
        const finalAssignments = Array.from(deduplicatedMap.values());

        setTeacherAssignments(finalAssignments);
        localStorage.setItem(
          "edu_db_teacher_assignments",
          JSON.stringify(finalAssignments),
        );
        return finalAssignments;
      }
    } catch (err) {
      console.warn("Error fetching teacher assignments", err);
    }
    return [];
  };

  const classUpdatesRef = useRef<Record<string, Partial<AcademicClass>>>({});

  const fetchAcademicClasses = useCallback(async () => {
    if (activeRequests.current["classes"]) {
      return activeRequests.current["classes"];
    }
    const promise = (async () => {
      try {
        const [data, taData]: [any, any] = await Promise.all([
          fetchClassesApi(),
          fetchClassTeacherAssignmentsApi().catch(() => null),
        ]);

        let liveAssignments: TeacherAssignment[] = [];
        const rawTaList = Array.isArray(taData) ? taData : taData?.data || [];
        if (Array.isArray(rawTaList) && rawTaList.length > 0) {
          const norm = (str?: string) =>
            (str || "")
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/class/gi, "")
              .replace(/section/gi, "");
          const mappedTa = rawTaList.map((ta: any) => ({
            id: ta.id
              ? String(ta.id)
              : `TA-${Math.floor(100 + Math.random() * 900)}`,
            academicYear: ta.academicYear || selectedAcademicYear || "",
            branch: ta.branch || selectedBranch || "",
            className: ta.className || "",
            section: ta.section || "A",
            subject: ta.subject || "",
            teacherId: ta.teacherId ? String(ta.teacherId) : "",
            teacherName: ta.teacherName || "",
            status: ta.status || "Active",
            role: ta.role || "Subject Teacher",
          }));

          const deduplicatedMap = new Map<string, TeacherAssignment>();
          for (const ta of mappedTa) {
            const key = `${norm(ta.className)}_${norm(ta.section)}_${norm(ta.subject)}_${(ta.role || "Subject Teacher").toLowerCase()}`;
            deduplicatedMap.set(key, ta);
          }
          liveAssignments = Array.from(deduplicatedMap.values());

          setTeacherAssignments(liveAssignments);
          localStorage.setItem(
            "edu_db_teacher_assignments",
            JSON.stringify(liveAssignments),
          );
        }

        if (data) {
          // Handle array response or object wrapper response
          const classList = Array.isArray(data)
            ? data
            : data.success && Array.isArray(data.data)
              ? data.data
              : null;
          if (classList) {
            setAcademicClasses((prev) => {
              const normId = (val: any) =>
                String(val ?? "").replace(/^CL-/i, "");
              const mapped: AcademicClass[] = classList.map((c: any) => {
                const classIdStr = c.classId?.toString() || c.id?.toString();
                const normKey = normId(classIdStr);
                const existing = (prev || []).find(
                  (p) => normId(p.id) === normKey,
                );
                const memUpdate = classUpdatesRef.current[normKey];
                const classNameStr =
                  c.className || c.name || existing?.name || "";

                const secDetails: Record<string, any> = {
                  ...((existing as any)?.sectionDetails || {}),
                  ...(c.sectionDetails || {}),
                };

                const sectionTeachersMap: Record<string, string> = {
                  ...(existing?.sectionTeachers || {}),
                  ...(c.sectionTeachers || {}),
                };

                if (Array.isArray(c.sections)) {
                  c.sections.forEach((s: any, idx: number) => {
                    const isObj = typeof s === "object" && s !== null;
                    const sName = isObj
                      ? s.sectionName || s.name || ""
                      : typeof s === "string"
                        ? s
                        : "";
                    if (sName) {
                      const cleanSName = sName
                        .replace(/^Section\s*/i, "")
                        .trim()
                        .toUpperCase();
                      const existingSec =
                        secDetails[sName] || secDetails[cleanSName] || {};
                      const resolvedSecId = isObj
                        ? (s.sectionId ??
                          s.id ??
                          existingSec.id ??
                          existingSec.sectionId ??
                          undefined)
                        : (existingSec.id ??
                          existingSec.sectionId ??
                          undefined);
                      const secInfo = {
                        id: resolvedSecId,
                        sectionId: resolvedSecId,
                        name: sName,
                        sectionName: sName,
                        capacity:
                          (isObj ? s.capacity : undefined) ??
                          existingSec.capacity ??
                          40,
                        status:
                          (isObj ? s.status : undefined) ||
                          existingSec.status ||
                          "Active",
                        remarks:
                          (isObj ? s.remarks : undefined) ??
                          existingSec.remarks ??
                          "",
                        roomNo:
                          (isObj
                            ? s.roomNo || s.RoomNo || s.room_number
                            : undefined) ||
                          existingSec.roomNo ||
                          "",
                      };
                      secDetails[sName] = secInfo;
                      secDetails[cleanSName] = secInfo;
                      secDetails[`Section ${cleanSName}`] = secInfo;

                      if (isObj && s.classTeacherName) {
                        const cleanCTName =
                          typeof s.classTeacherName === "string"
                            ? s.classTeacherName
                                .replace(
                                  /\s*\([^)]*(?:tch|emp|stf|id|\d)[^)]*\)/gi,
                                  "",
                                )
                                .replace(/\s*\([^)]*\)$/, "")
                                .trim()
                            : s.classTeacherName;
                        sectionTeachersMap[sName] = cleanCTName;
                        sectionTeachersMap[cleanSName] = cleanCTName;
                        sectionTeachersMap[`Section ${cleanSName}`] =
                          cleanCTName;
                      }
                    }
                  });
                }

                // Also populate sectionTeachers from liveAssignments where role is Class Teacher
                liveAssignments
                  .filter(
                    (ta) =>
                      (ta.className === classNameStr ||
                        ta.className
                          ?.toLowerCase()
                          .replace(/class/gi, "")
                          .trim() ===
                          classNameStr
                            .toLowerCase()
                            .replace(/class/gi, "")
                            .trim()) &&
                      ta.role === "Class Teacher" &&
                      ta.teacherName,
                  )
                  .forEach((ta) => {
                    if (ta.section) {
                      const cleanCTName =
                        typeof ta.teacherName === "string"
                          ? ta.teacherName
                              .replace(
                                /\s*\([^)]*(?:tch|emp|stf|id|\d)[^)]*\)/gi,
                                "",
                              )
                              .replace(/\s*\([^)]*\)$/, "")
                              .trim()
                          : ta.teacherName;
                      sectionTeachersMap[ta.section] = cleanCTName;
                      const cleanSec = ta.section
                        .replace(/^Section\s*/i, "")
                        .trim();
                      sectionTeachersMap[cleanSec] = cleanCTName;
                      sectionTeachersMap[`Section ${cleanSec}`] = cleanCTName;
                    }
                  });

                const backendWeeklyPeriods: Record<string, number> = {};
                if (Array.isArray(c.curriculumSubjects)) {
                  c.curriculumSubjects.forEach((cs: any) => {
                    const sName = cs.subjectName || cs.name;
                    const wPeriods =
                      cs.weeklyPeriods ??
                      cs.weekly_periods ??
                      cs.periodsPerWeek;
                    if (sName && typeof wPeriods === "number") {
                      backendWeeklyPeriods[sName] = wPeriods;
                    }
                  });
                }

                const subs =
                  Array.isArray(c.curriculumSubjects) &&
                  c.curriculumSubjects.length > 0
                    ? c.curriculumSubjects
                        .map((cs: any) => cs.subjectName || cs.name || "")
                        .filter(Boolean)
                    : c.subjects || existing?.subjects || [];

                const resolvedCampus =
                  (memUpdate as any)?.campus ||
                  c.campusLocation ||
                  c.CampusLocation ||
                  c.branch ||
                  (existing as any)?.campus ||
                  "";

                const resolvedYear =
                  (memUpdate as any)?.academicYear ||
                  c.academicYear ||
                  c.AcademicYear ||
                  c.academic_year ||
                  (existing as any)?.academicYear ||
                  "";

                const resolvedStatus =
                  memUpdate?.status ||
                  c.status ||
                  c.Status ||
                  existing?.status ||
                  "Active";

                const resolvedRemarks =
                  (memUpdate as any)?.remarks !== undefined
                    ? (memUpdate as any).remarks
                    : (c.remarks ??
                      c.Remarks ??
                      (existing as any)?.remarks ??
                      "");

                const resolvedDisplayOrder =
                  memUpdate && "displayOrder" in memUpdate
                    ? (memUpdate as any).displayOrder
                    : (c.displayOrder ??
                      c.DisplayOrder ??
                      c.display_order ??
                      (existing as any)?.displayOrder ??
                      undefined);

                return {
                  id: classIdStr,
                  name: classNameStr,
                  displayName:
                    (memUpdate as any)?.displayName ||
                    c.displayName ||
                    (existing as any)?.displayName ||
                    classNameStr,
                  status: resolvedStatus,
                  remarks: resolvedRemarks,
                  displayOrder: resolvedDisplayOrder,
                  academicYear: resolvedYear,
                  sections:
                    c.sections?.map((s: any) => s.sectionName || s) ||
                    existing?.sections ||
                    [],
                  sectionTeachers: sectionTeachersMap,
                  teacher:
                    c.teacher ||
                    Object.values(sectionTeachersMap)[0] ||
                    "Unassigned",
                  subjects: subs,
                  weeklyPeriods: {
                    ...(existing?.weeklyPeriods || {}),
                    ...(c.weeklyPeriods || {}),
                    ...backendWeeklyPeriods,
                  },
                  sectionDetails: secDetails,
                  campus: resolvedCampus,
                  campusLocation: resolvedCampus,
                  branch: resolvedCampus,
                } as any;
              });
              mapped.sort((a, b) => compareClassesAscending(a.name, b.name));
              return mapped;
            });
          }
        }
      } catch (err: any) {
        console.warn("Error fetching classes", err);
      } finally {
        delete activeRequests.current["classes"];
      }
    })();
    activeRequests.current["classes"] = promise;
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const data: any = await fetchAcademicSubjectsApi();
      const dataArray = Array.isArray(data) ? data : data?.data || [];
      if (Array.isArray(dataArray)) {
        const mappedData = dataArray.map((item: any) => ({
          id:
            item.subjectId?.toString() ||
            item.id?.toString() ||
            Math.random().toString(),
          subjectId: item.subjectId?.toString() || item.id?.toString() || "",
          name: item.subjectName || "",
          code: item.courseCode || "",
          department: item.departmentName || "",
          status: item.status || "Active",
        }));
        setSubjects(mappedData);
      }
    } catch (err: any) {
      console.warn("Error fetching subjects", err);
    }
  }, []);

  const fetchPeriods = useCallback(async () => {
    try {
      const data: any = await fetchAcademicPeriodsApi();
      const dataArray = Array.isArray(data) ? data : data?.data || [];
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        const mappedData: PeriodSetting[] = dataArray.map((item: any) => ({
          id:
            item.periodId?.toString() ||
            item.id?.toString() ||
            Math.random().toString(),
          academicYear: item.academicYear || "",
          branch: item.branch || "",
          periodName: item.periodName || "",
          startTime: item.startTime || "",
          endTime: item.endTime || "",
          durationMinutes: item.durationMinutes || 45,
          isBreak: item.isBreak || false,
          sequence: item.sequence || item.displayOrder || 1,
          periodType: item.periodType || "Teaching Period",
          status: item.status || "Active",
        }));

        // Strict deduplication by ID, periodName, sequence, or time slot
        const uniquePeriods: PeriodSetting[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();
        const seenSeqs = new Set<number>();
        const seenTimes = new Set<string>();

        mappedData.forEach((p) => {
          const idKey = p.id ? String(p.id).trim() : "";
          const nameKey = (p.periodName || "").trim().toLowerCase();
          const seqKey = Number(p.sequence);
          const timeKey = `${(p.startTime || "").trim()}-${(p.endTime || "").trim()}`;

          const isDuplicate =
            (idKey && seenIds.has(idKey)) ||
            (nameKey && seenNames.has(nameKey)) ||
            (seqKey && seenSeqs.has(seqKey)) ||
            (timeKey && timeKey !== "-" && seenTimes.has(timeKey));

          if (!isDuplicate) {
            if (idKey) seenIds.add(idKey);
            if (nameKey) seenNames.add(nameKey);
            if (seqKey) seenSeqs.add(seqKey);
            if (timeKey && timeKey !== "-") seenTimes.add(timeKey);
            uniquePeriods.push(p);
          }
        });

        setPeriodSettings((prev) => {
          const classSpecific = prev.filter(
            (p) =>
              p.className && p.className !== "Master" && p.className !== "All",
          );
          return [...uniquePeriods, ...classSpecific];
        });
      } else {
        setPeriodSettings([]);
      }
    } catch (err: any) {
      console.warn("Error fetching periods", err);
    }
  }, []);

  const fetchTimetables = useCallback(
    async (force: boolean = false) => {
      try {
        const data: any = await fetchAllTimetablesApi(selectedAcademicYear);
        const dataArray = Array.isArray(data) ? data : data?.data || [];
        if (Array.isArray(dataArray)) {
          const mappedData: TimetableSlot[] = dataArray.map((item: any) => {
            const timeSlotStr =
              item.timeSlot ||
              (item.startTime && item.endTime
                ? `${item.startTime} - ${item.endTime}`
                : "");
            return {
              id:
                item.id?.toString() ||
                item.slotId?.toString() ||
                `TT-${Math.random().toString(36).substr(2, 9)}`,
              className: item.className || "",
              section: item.section || item.sectionName || "",
              day: item.day || item.dayOfWeek || "",
              timeSlot: timeSlotStr,
              startTime: item.startTime,
              endTime: item.endTime,
              periodNumber: item.periodNumber || 1,
              subject: item.subject || item.subjectName || "",
              subjectId: item.subjectId?.toString(),
              teacherName: item.teacherName || "",
              teacherId: item.teacherId?.toString(),
              roomNo: item.roomNo || "",
              academicYear: item.academicYear || selectedAcademicYear || "",
              status: item.status || "Draft",
              branch: item.branch || selectedBranch || "",
            };
          });

          setTimetable(mappedData);
          try {
            localStorage.setItem(
              "edu_db_timetable",
              JSON.stringify(mappedData),
            );
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Failed to fetch all timetables from backend", err);
      }
    },
    [selectedAcademicYear, selectedBranch],
  );

  const getPersistedOptionalFees = (
    appId?: string,
    regNo?: string,
    name?: string,
    phone?: string,
  ): string[] => {
    try {
      const raw = localStorage.getItem("edu_db_admission_optional_fees");
      if (raw) {
        const store = JSON.parse(raw);
        if (appId && store[appId] && Array.isArray(store[appId]))
          return store[appId];
        if (regNo && store[regNo] && Array.isArray(store[regNo]))
          return store[regNo];
        if (name && phone) {
          const key = `${name.toLowerCase().trim()}_${phone.trim()}`;
          if (store[key] && Array.isArray(store[key])) return store[key];
        }
      }
    } catch (e) {}
    return [];
  };

  const savePersistedOptionalFees = (
    appId?: string,
    regNo?: string,
    name?: string,
    phone?: string,
    fees?: string[],
  ) => {
    if (!fees || !Array.isArray(fees) || fees.length === 0) return;
    try {
      const raw = localStorage.getItem("edu_db_admission_optional_fees");
      let store = raw ? JSON.parse(raw) : {};
      if (!store || typeof store !== "object") store = {};
      if (appId) store[appId] = fees;
      if (regNo) store[regNo] = fees;
      if (name && phone) {
        const key = `${name.toLowerCase().trim()}_${phone.trim()}`;
        store[key] = fees;
      }
      localStorage.setItem(
        "edu_db_admission_optional_fees",
        JSON.stringify(store),
      );
    } catch (e) {}
  };

  const fetchAdmissions = useCallback(async () => {
    if (activeRequests.current["admissions"]) {
      return activeRequests.current["admissions"];
    }
    const promise = (async () => {
      try {
        const json = await fetchAdmissionsApi();
        if (json && json.success && json.data) {
          if (json.data.length === 0) {
            addToast(
              "info",
              "No Records Found",
              "There are currently no admission applications available.",
            );
          }
          const mappedAdmissions: AdmissionApplication[] = json.data.map(
            (item: any) => {
              const existing = admissions.find(
                (a) =>
                  a.id === item.applicationId?.toString() ||
                  a.applicationNo === item.registrationNo ||
                  (a.applicantName === item.applicantFullName &&
                    a.phone === item.fatherMobileNo),
              );

              const parseFees = (val: any): string[] => {
                if (Array.isArray(val))
                  return val.map((x) => String(x)).filter(Boolean);
                if (typeof val === "string" && val.trim().length > 0) {
                  try {
                    const p = JSON.parse(val);
                    if (Array.isArray(p))
                      return p.map((x) => String(x)).filter(Boolean);
                  } catch (e) {}
                  return val
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                }
                return [];
              };

              const itemFees = parseFees(
                item.selectedOptionalFees ??
                  item.optionalFees ??
                  item.selectedOptionalFee ??
                  item.optionalFee ??
                  item.selectedOptional,
              );
              const existingFees = parseFees(existing?.selectedOptionalFees);
              const persistedFees = getPersistedOptionalFees(
                item.applicationId?.toString() || existing?.id,
                item.registrationNo || existing?.applicationNo,
                item.applicantFullName || existing?.applicantName,
                item.fatherMobileNo || existing?.phone,
              );

              let finalOptFees: string[] = [];
              if (itemFees.length > 0) {
                finalOptFees = itemFees;
              } else if (existingFees.length > 0) {
                finalOptFees = existingFees;
              } else if (persistedFees.length > 0) {
                finalOptFees = persistedFees;
              }

              return {
                id: item.applicationId
                  ? item.applicationId.toString()
                  : existing?.id || Math.random().toString(),
                admissionNo:
                  item.admissionNo ||
                  item.admissionNumber ||
                  existing?.admissionNo ||
                  "",
                applicationNo:
                  item.status === "Enrolled" ||
                  item.status === "Active" ||
                  item.status === "Approved"
                    ? item.admissionNo ||
                      item.admissionNumber ||
                      item.registrationNo ||
                      item.registrationNumber ||
                      existing?.applicationNo ||
                      ""
                    : item.registrationNo ||
                      item.registrationNumber ||
                      item.admissionNo ||
                      existing?.applicationNo ||
                      "",
                registrationNo:
                  item.registrationNo ||
                  item.registrationNumber ||
                  existing?.registrationNo ||
                  "",
                applicantName:
                  item.applicantFullName ||
                  item.studentName ||
                  existing?.applicantName ||
                  "",
                appliedClass:
                  item.appliedClass ||
                  item.appliedClassGrade ||
                  existing?.appliedClass ||
                  "",
                section:
                  item.section || item.sectionLetter || existing?.section || "",
                gender: item.gender || existing?.gender || "",
                dob: item.dob ? item.dob.split("T")[0] : existing?.dob || "",
                bloodGroup: item.bloodGroup || existing?.bloodGroup || "",
                religion: item.religion || existing?.religion || "",
                casteCategory:
                  item.casteCategory ||
                  item.caste ||
                  item.category ||
                  existing?.casteCategory ||
                  "",
                parentName:
                  item.fatherFullName ||
                  item.fatherName ||
                  existing?.parentName ||
                  "",
                motherName:
                  item.motherFullName ||
                  item.motherName ||
                  existing?.motherName ||
                  "",
                phone:
                  item.fatherMobileNo ||
                  item.fatherMobile ||
                  item.fatherContact ||
                  item.mobileNumber ||
                  existing?.phone ||
                  "",
                motherPhone:
                  item.motherPhone ||
                  item.motherMobileNumber ||
                  item.motherMobile ||
                  existing?.motherPhone ||
                  "",
                alternatePhone:
                  item.alternatePhone ||
                  item.alternateMobileNumber ||
                  existing?.alternatePhone ||
                  "",
                email: item.parentEmail || item.email || existing?.email || "",
                addressHouseNo: item.houseNo || existing?.addressHouseNo || "",
                addressStreet: item.street || existing?.addressStreet || "",
                addressArea:
                  item.areaLocality ||
                  item.address ||
                  existing?.addressArea ||
                  "",
                addressCity: item.city || existing?.addressCity || "",
                addressDistrict:
                  item.district || existing?.addressDistrict || "",
                addressState: item.state || existing?.addressState || "",
                addressPinCode: item.pinCode || existing?.addressPinCode || "",
                siblingsCount:
                  item.numberOfSiblings ?? existing?.siblingsCount ?? 0,
                hasSiblings:
                  existing?.hasSiblings ??
                  ((item.numberOfSiblings && item.numberOfSiblings > 0) ||
                    false),
                siblingDetails:
                  item.siblingDetails || existing?.siblingDetails || [],
                studentType: normalizeStudentType(
                  item.studentType || existing?.studentType,
                ),
                transportRequired:
                  item.transportRequired ??
                  existing?.transportRequired ??
                  false,
                transportType:
                  item.transportType || existing?.transportType || "",
                busRoute: item.busRoute || existing?.busRoute || "",
                pickupPoint: item.pickupPoint || existing?.pickupPoint || "",
                dropPoint: item.dropPoint || existing?.dropPoint || "",
                hostelBlock: item.hostelBlock || existing?.hostelBlock || "",
                hostelRoom:
                  item.hostelRoom ||
                  item.roomNumber ||
                  item.allocatedRoomId ||
                  existing?.hostelRoom ||
                  "",
                hostelBed:
                  item.allocatedBedId ||
                  item.hostelBed ||
                  existing?.hostelBed ||
                  "",
                status: item.status || existing?.status || "Pending",
                applicationDate:
                  item.createdAt ||
                  existing?.applicationDate ||
                  new Date().toISOString(),
                branch:
                  item.branch || item.branchName || existing?.branch || "",
                avatar: item.avatar || existing?.avatar || "",
                scholarshipId:
                  item.scholarshipId ||
                  item.scholarship ||
                  existing?.scholarshipId ||
                  "",
                discountId:
                  item.discountId ||
                  item.discount ||
                  existing?.discountId ||
                  "",
                selectedOptionalFees: finalOptFees,
                isLateAdmission:
                  item.isLateAdmission ??
                  item.isLate ??
                  existing?.isLateAdmission ??
                  false,
                feeCalculationMethod:
                  item.feeCalculationMethod ||
                  item.feePolicy ||
                  existing?.feeCalculationMethod ||
                  "Term-wise",
                joiningDate:
                  item.joiningDate ||
                  item.admissionDate ||
                  existing?.joiningDate ||
                  existing?.admissionDate ||
                  "",
                admissionDate:
                  item.admissionDate ||
                  item.joiningDate ||
                  existing?.admissionDate ||
                  existing?.joiningDate ||
                  "",
                documentsSubmitted:
                  item.documentsSubmitted ||
                  item.documents ||
                  existing?.documentsSubmitted ||
                  [],
                hostelSecurityDepositPaid:
                  item.hostelSecurityDepositPaid ??
                  existing?.hostelSecurityDepositPaid ??
                  false,
                securityDepositAmount:
                  item.securityDepositAmount ??
                  existing?.securityDepositAmount ??
                  0,
                securityDepositReceiptNo:
                  item.securityDepositReceiptNo ||
                  existing?.securityDepositReceiptNo ||
                  "",
                securityDepositPaymentMode:
                  item.securityDepositPaymentMode ||
                  existing?.securityDepositPaymentMode ||
                  "",
                securityDepositTxnId:
                  item.securityDepositTxnId ||
                  existing?.securityDepositTxnId ||
                  "",
                securityDepositDate:
                  item.securityDepositDate ||
                  existing?.securityDepositDate ||
                  "",
              };
            },
          );
          setAdmissions(mappedAdmissions);
        } else {
          addToast(
            "error",
            "API Error",
            json?.message || "Failed to fetch admission records.",
          );
        }
      } catch (err: any) {
        console.error("Error fetching admissions", err);
        // Don't show toast for 404 errors as it might just mean the backend endpoint isn't ready
        if (err.status !== 404) {
          addToast(
            "error",
            "Network Error",
            err.message ||
              "Unable to connect to the server. Please try again later.",
          );
        }
        throw err;
      } finally {
        delete activeRequests.current["admissions"];
      }
    })();
    activeRequests.current["admissions"] = promise;
    return promise;
  }, [addToast]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response: any = await fetchDepartmentsApi();
      const dataArray = Array.isArray(response)
        ? response
        : response?.data || [];
      if (Array.isArray(dataArray)) {
        const mapped: Department[] = dataArray.map((item: any) => ({
          id: (item.departmentId || item.id || Math.random()).toString(),
          departmentName: item.departmentName || "",
          departmentCode: item.departmentCode || "",
          description: item.description || "",
          category: item.category || item.departmentType || "Teaching",
          status: item.status || "Active",
        }));
        setDepartments(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch departments", err);
    }
  }, []);

  const fetchDesignations = useCallback(async () => {
    try {
      const response: any = await fetchDesignationsApi();
      const dataArray = Array.isArray(response)
        ? response
        : response?.data || [];
      if (Array.isArray(dataArray)) {
        const mapped: DesignationMaster[] = dataArray.map((item: any) => ({
          id: (item.designationId || item.id || Math.random()).toString(),
          designationName: item.designationName || "",
          designationCode: item.designationCode || "",
          description: item.description || "",
          employeeCategory:
            item.employeeCategory === "Both" || !item.employeeCategory
              ? "Non-Teaching"
              : item.employeeCategory,
          status: item.status || "Active",
        }));
        setDesignations(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch designations", err);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res: any = await fetchBranchesApi();
      const list = Array.isArray(res) ? res : res?.data || [];
      if (Array.isArray(list)) {
        setBranches(list);
      }
    } catch (err) {
      console.warn("Failed to fetch branches from API", err);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    const handleBranchesUpdated = () => {
      fetchBranches();
    };
    window.addEventListener("branches_updated", handleBranchesUpdated);
    return () => {
      window.removeEventListener("branches_updated", handleBranchesUpdated);
    };
  }, [fetchBranches]);

  const fetchStaff = useCallback(async () => {
    if (activeRequests.current["staff"]) {
      return activeRequests.current["staff"];
    }
    const promise = (async () => {
      try {
        const response = await fetchStaffApi();
        if (response && response.success && response.data) {
          setStaff((prevStaff) => {
            const seenEmpIds = new Set<string>();
            const mappedStaff: Staff[] = [];

            for (const item of response.data) {
              const cat = (item.employeeCategory || "").toLowerCase();
              const isTeaching =
                (cat.includes("teaching") && !cat.includes("non-teaching")) ||
                cat.includes("teacher") ||
                cat.includes("faculty") ||
                cat.includes("professor");

              const itemId = (
                item.staffId !== undefined && item.staffId !== null
                  ? item.staffId
                  : item.id !== undefined && item.id !== null
                    ? item.id
                    : ""
              ).toString();
              let itemEmpId = (item.employeeId || item.empId || "").trim();

              // Look up in current staff state to preserve local workload data
              const existing = prevStaff.find(
                (s) => s.id === itemId || (itemEmpId && s.empId === itemEmpId),
              );

              // Auto-heal duplicate or missing employee IDs from legacy database records
              if (!itemEmpId || seenEmpIds.has(itemEmpId.toUpperCase())) {
                itemEmpId = generateNextEmployeeId(
                  [...prevStaff, ...mappedStaff],
                  isTeaching ? "Teaching Staff" : "Non-Teaching Staff",
                );
              }
              seenEmpIds.add(itemEmpId.toUpperCase());

              mappedStaff.push({
                id: itemId,
                empId: itemEmpId,
                employeeCategory: isTeaching ? "Teacher" : "Staff",
                firstName: item.firstName,
                middleName: item.middleName || "",
                lastName: item.lastName,
                email: item.email || "",
                phone: item.phone || item.mobileNumber || "",
                alternateMobile: (() => {
                  const raw =
                    item.alternateMobile ||
                    item.alternateMobileNumber ||
                    item.alternatePhone ||
                    existing?.alternateMobile ||
                    "";
                  const digits = String(raw).replace(/\D/g, "");
                  return digits.length >= 5 ? String(raw).trim() : "";
                })(),
                gender: item.gender || "Male",
                dob: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
                bloodGroup: item.bloodGroup || "",
                aadhaarNumber:
                  item.aadhaarNumber || existing?.aadhaarNumber || "",
                panNumber:
                  item.panNumber ||
                  item.pan ||
                  item.panNo ||
                  existing?.panNumber ||
                  "",
                joiningDate: item.joiningDate
                  ? item.joiningDate.split("T")[0]
                  : "",
                qualification: item.qualification || "",
                experienceYears: item.experienceRecords
                  ? item.experienceRecords.reduce(
                      (total: number, rec: any) =>
                        total + (rec.yearsOfExperience || 0),
                      0,
                    )
                  : 0,
                salary: item.monthlySalary || 0,
                designation: item.designation || "",
                department: item.department || "",
                role: item.systemRole || (isTeaching ? "Teacher" : "Staff"),
                profileStatus: "Completed",
                status: item.isActive ? "Active" : "Inactive",
                employmentType:
                  item.employmentType || existing?.employmentType || "",
                address:
                  item.presentAddress ||
                  item.residentialAddress ||
                  item.address ||
                  "",
                presentAddress:
                  item.presentAddress || item.residentialAddress || "",
                permanentAddress: item.permanentAddress || "",
                city: item.city || "",
                state: item.state || "",
                pinCode: item.pinCode || "",
                country: item.country || "India",
                assignedClasses:
                  item.assignedClasses || existing?.assignedClasses || [],
                assignedSubjects:
                  item.assignedSubjects || existing?.assignedSubjects || [],
                isClassTeacherEligible:
                  item.isClassTeacherEligible !== undefined
                    ? item.isClassTeacherEligible
                    : existing?.isClassTeacherEligible || false,
                bankDetails: {
                  accountHolderName: item.accountHolderName || "",
                  accountNumber: item.accountNumber || "",
                  bankName: item.bankName || "",
                  branch: item.branchName || "",
                  ifscCode: item.ifscCode || "",
                  upiId: item.upiId || "",
                },
                qualifications:
                  item.qualifications || existing?.qualifications || [],
                experienceRecords:
                  item.experienceRecords || existing?.experienceRecords || [],
                documents: item.documents || existing?.documents || [],
                avatar: item.avatar || existing?.avatar || "",
                leaveBalance: existing?.leaveBalance,
                branch:
                  item.branchName || item.branch || existing?.branch || "",
              } as unknown as Staff);
            }
            return mappedStaff;
          });
        }
      } catch (err) {
        console.warn("Failed to fetch staff from API", err);
      } finally {
        delete activeRequests.current["staff"];
      }
    })();
    activeRequests.current["staff"] = promise;
    return promise;
  }, []);

  // =========================================================
  // FETCH FUNCTIONS — REAL API REPLACEMENTS FOR MOCK DATA
  // =========================================================

  const fetchStudents = useCallback(async () => {
    if (activeRequests.current["students"]) {
      return activeRequests.current["students"];
    }
    const promise = (async () => {
      try {
        const response: any = await fetchStudentsApi();
        const items = Array.isArray(response)
          ? response
          : response?.items || response?.data?.items || response?.data || [];
        const totalRecs =
          response?.totalRecords ??
          response?.TotalRecords ??
          response?.data?.totalRecords ??
          response?.data?.TotalRecords ??
          items.length;
        setTotalStudentCount(totalRecs);
        if (Array.isArray(items)) {
          const mapped = items.map((s: any) => {
            const nameParts = (s.studentName || s.name || "")
              .trim()
              .split(/\s+/);
            const firstName = s.firstName || nameParts[0] || "";
            const lastName = s.lastName || nameParts.slice(1).join(" ") || "";
            const parentName =
              s.fatherName || s.parentName || s.motherName || "";
            const parentPhone =
              s.fatherMobile ||
              s.parentPhone ||
              s.fatherContact ||
              s.fatherPhone ||
              s.motherMobile ||
              s.motherPhone ||
              s.mobileNumber ||
              s.phone ||
              "";

            const admNo = s.admissionNumber || s.admissionNo || "";
            const regNo = s.registrationNumber || admNo;
            const sIdStr = s.studentId?.toString() || s.id?.toString() || "";
            const cleanSName = (s.studentName || s.name || "")
              .trim()
              .toLowerCase();

            const matchingAdmission = (admissions || []).find(
              (a) =>
                (a.admissionNo &&
                  (a.admissionNo === admNo || a.admissionNo === regNo)) ||
                (a.registrationNo &&
                  (a.registrationNo === regNo || a.registrationNo === admNo)) ||
                (a.applicationNo &&
                  (a.applicationNo === admNo || a.applicationNo === regNo)) ||
                (a.id && a.id === sIdStr) ||
                (cleanSName &&
                  a.applicantName &&
                  a.applicantName.trim().toLowerCase() === cleanSName),
            );

            const resolvedReligion =
              s.religion || matchingAdmission?.religion || "";
            const resolvedCasteCategory =
              s.casteCategory ||
              s.caste ||
              matchingAdmission?.casteCategory ||
              (matchingAdmission as any)?.caste ||
              (matchingAdmission as any)?.category ||
              s.category ||
              "General";

            return {
              id: sIdStr,
              admissionNo: admNo,
              registrationNumber: regNo,
              firstName,
              middleName: s.middleName || "",
              lastName,
              email:
                s.email ||
                s.studentEmail ||
                s.emailAddress ||
                s.emailId ||
                s.contactEmail ||
                s.fatherEmail ||
                matchingAdmission?.email ||
                "",
              phone:
                s.mobileNumber || s.phone || s.contactNumber || parentPhone,
              gender: s.gender || "Male",
              dob: s.dateOfBirth
                ? s.dateOfBirth.split("T")[0]
                : s.dob
                  ? s.dob.split("T")[0]
                  : "",
              className:
                s.className || s.class || matchingAdmission?.appliedClass || "",
              section: (
                s.sectionName ||
                s.section ||
                matchingAdmission?.section ||
                ""
              )
                .replace(/^Section\s*/i, "")
                .trim(),
              academicYear: s.academicYearName || s.academicYear || "",
              branch: s.branchName || s.branch || "",
              branchId: s.branchId || s.branch_id || undefined,
              academicYearId:
                s.academicYearId || s.academic_year_id || undefined,
              classId: s.classId || s.class_id || undefined,
              sectionId: s.sectionId || s.section_id || undefined,
              status: s.status || "Active",
              studentType:
                s.studentType ||
                matchingAdmission?.studentType ||
                "Day Scholar",
              transportRequired: Boolean(
                s.transportRequired ?? matchingAdmission?.transportRequired,
              ),
              transportType:
                s.transportType || matchingAdmission?.transportType || "",
              busRoute: s.busRoute || matchingAdmission?.busRoute || "",
              pickupPoint:
                s.pickupPoint || matchingAdmission?.pickupPoint || "",
              parentName,
              parentPhone,
              fatherName: s.fatherName || parentName,
              fatherPhone: s.fatherMobile || s.fatherPhone || parentPhone,
              fatherOccupation: s.fatherOccupation || "",
              fatherEmail: s.fatherEmail || "",
              motherName: s.motherName || "",
              motherPhone: s.motherMobile || s.motherPhone || "",
              address: s.address || "",
              promotionHistory: [],
              rollNo: s.rollNumber || s.rollNo || "",
              bloodGroup: s.bloodGroup || matchingAdmission?.bloodGroup || "O+",
              religion: resolvedReligion,
              casteCategory: resolvedCasteCategory,
              category: resolvedCasteCategory,
              avatar: s.avatar || "",
              joiningDate:
                s.joiningDate || new Date().toISOString().split("T")[0],
            } as unknown as Student;
          });
          setStudents((prev) =>
            mapped.map((st) => {
              const existing = (prev || []).find(
                (p) =>
                  p.id === st.id ||
                  (st.admissionNo && p.admissionNo === st.admissionNo),
              );
              if (!existing) return st;
              const rawStSec = (st.section || "")
                .replace(/^Section\s*/i, "")
                .trim();
              const rawExSec = (existing.section || "")
                .replace(/^Section\s*/i, "")
                .trim();
              const effectiveSection = rawStSec || rawExSec || "";
              const effectiveRollNo = st.rollNo || existing.rollNo || "";
              return {
                ...st,
                section: effectiveSection,
                rollNo: effectiveRollNo,
                religion: st.religion || existing.religion || "",
                casteCategory:
                  (st.casteCategory && st.casteCategory !== "General"
                    ? st.casteCategory
                    : existing.casteCategory) ||
                  st.casteCategory ||
                  "General",
                category:
                  (st.category && st.category !== "General"
                    ? st.category
                    : existing.category) ||
                  st.category ||
                  "General",
              };
            }),
          );
        }
      } catch (err) {
        console.warn("Failed to fetch students from API", err);
      } finally {
        delete activeRequests.current["students"];
      }
    })();
    activeRequests.current["students"] = promise;
    return promise;
  }, []);

  const fetchBooks = useCallback(async () => {
    try {
      const response: any = await fetchBooksApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setBooks((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch books from API", err);
    }
  }, []);

  const fetchBookIssues = useCallback(async () => {
    try {
      const response: any = await fetchIssuedBooksApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setBookIssues((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch issued books from API", err);
    }
  }, []);

  const fetchHomeworkData = useCallback(async () => {
    try {
      const response: any = await fetchHomeworkApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items)) {
        const normalizedItems = items.map((hw: any) => {
          let sec = (hw.section || "").trim();
          let cls = (hw.className || "").trim();
          if (cls.includes("-")) {
            const parts = cls.split("-");
            cls = parts[0].trim();
            if (!sec && parts[1]) sec = parts[1].trim();
          }
          const id = String(hw.homeworkId || hw.id || "");
          return {
            ...hw,
            id: id || `HW-${Math.floor(100 + Math.random() * 900)}`,
            title: hw.title || hw.homeworkTitle || hw.topic || "",
            className: cls || hw.className || "",
            section: sec || hw.section || "",
            subject: hw.subject || hw.subjectName || "",
            teacherName: hw.teacherName || "",
            assignedDate:
              hw.assignedDate ||
              hw.createdAt ||
              new Date().toISOString().split("T")[0],
            dueDate: hw.dueDate || new Date().toISOString().split("T")[0],
            description: hw.description || hw.topic || "",
            status: hw.status || "PUBLISHED",
            totalSubmissions: hw.submissionsCount ?? hw.totalSubmissions ?? 0,
            publishToType: (hw.publishedTo || "")
              .toLowerCase()
              .includes("student")
              ? "Students"
              : "Class",
            publishedStudentIds:
              hw.publishedStudentIds ||
              (hw.studentIds
                ? Array.isArray(hw.studentIds)
                  ? hw.studentIds
                  : [hw.studentIds]
                : []),
            attachments:
              hw.attachments ||
              (hw.attachmentFileName
                ? [
                    {
                      id: "1",
                      name: hw.attachmentFileName,
                      url: hw.attachmentUrl || "#",
                      type: "Doc",
                    },
                  ]
                : []),
          };
        });

        // Deduplicate items cleanly
        const uniqueMap = new Map<string, any>();
        normalizedItems.forEach((item: any) => {
          const dedupeKey =
            item.id && !item.id.startsWith("HW-")
              ? `db_${item.id}`
              : `${item.className}_${item.section}_${item.subject}_${item.title}_${item.dueDate}`.toLowerCase();
          if (!uniqueMap.has(dedupeKey)) {
            uniqueMap.set(dedupeKey, item);
          }
        });

        const deduplicated = Array.from(uniqueMap.values());
        setHomework(deduplicated);
        try {
          localStorage.setItem("edu_db_homework", JSON.stringify(deduplicated));
          localStorage.setItem("homework", JSON.stringify(deduplicated));
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Failed to fetch homework from API", err);
    }
  }, []);

  const fetchInventoryData = useCallback(async () => {
    try {
      const response: any = await fetchInventoryItemsApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setInventory((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch inventory from API", err);
    }
  }, []);

  const fetchStudentAttendanceData = useCallback(async (query?: any) => {
    const reqKey = "student-attendance" + (query ? JSON.stringify(query) : "");
    if (activeRequests.current[reqKey]) {
      return activeRequests.current[reqKey];
    }

    const promise = (async () => {
      try {
        const response: any = await fetchStudentAttendanceAllApi(query);
        const items = Array.isArray(response)
          ? response
          : response?.data?.records ||
            response?.data?.items ||
            response?.data ||
            [];
        if (Array.isArray(items) && items.length > 0) {
          setStudentAttendance((prev) => {
            const existingMap = new Map<string, any>();
            (prev || []).forEach((r) => {
              const key = `${r.studentId || r.id}_${String(r.date || "").split("T")[0]}_${r.subject || ""}_${r.period || ""}`;
              existingMap.set(key, r);
            });
            let hasChanges = false;
            items.forEach((item: any) => {
              const recDate = String(item.date || "").split("T")[0];
              const key = `${item.studentId || item.id}_${recDate}_${item.subject || ""}_${item.period || ""}`;
              const existing = existingMap.get(key);
              if (
                !existing ||
                existing.status !== item.status ||
                existing.remarks !== item.remarks
              ) {
                hasChanges = true;
              }
              existingMap.set(key, { ...item, date: recDate });
            });

            if (!hasChanges && prev && prev.length === existingMap.size) {
              return prev; // Preserve reference to prevent unnecessary component re-renders
            }

            const merged = Array.from(existingMap.values());
            return merged;
          });
          setTimeout(() => {
            try {
              window.dispatchEvent(new Event("attendance_updated"));
            } catch {}
          }, 0);
        }
      } catch (err) {
        console.warn("Error fetching student attendance:", err);
      } finally {
        delete activeRequests.current[reqKey];
      }
    })();

    activeRequests.current[reqKey] = promise;
    return promise;
  }, []);

  const fetchGradingScaleRules = useCallback(
    async (examType: string = "All") => {
      try {
        const res: any = await fetchGradingScaleRulesApi(examType);
        if (
          res &&
          res.success &&
          res.data?.scaleRules &&
          Array.isArray(res.data.scaleRules)
        ) {
          const mapped: GradeConfig[] = res.data.scaleRules.map(
            (r: any, idx: number) => ({
              id: r.ruleId ? `GRD-${r.ruleId}` : `GRD-${idx + 1}`,
              academicYear: "",
              branch: "",
              examType: res.data.examType || examType,
              schemeName: res.data.examType || examType || "Default Scholastic",
              gradingType: "Percentage" as const,
              grade: r.grade || "",
              gradeName: r.grade || "",
              minPercent: r.minMarks ?? 0,
              maxPercent: r.maxMarks ?? 100,
              minMark: r.minMarks ?? 0,
              maxMark: r.maxMarks ?? 100,
              gradePoint: r.gpa ?? 0,
              gradePoints: r.gpa ?? 0,
              passCriteria: r.passFail || "Pass",
              remarks: r.remarks || "",
            }),
          );
          setGradeConfigurations(mapped);
          try {
            localStorage.setItem(
              "edu_db_grade_configurations",
              JSON.stringify(mapped),
            );
          } catch {}
        }
      } catch (err) {
        console.warn(
          "Failed to fetch grading scale rules in DataContext:",
          err,
        );
      }
    },
    [],
  );

  const fetchUniformData = async () => {
    if (activeRequests.current["uniform-data"]) {
      return activeRequests.current["uniform-data"];
    }
    const promise = (async () => {
      try {
        const [catRes, sizeRes, supplierRes, typeRes, distRes] =
          await Promise.allSettled([
            fetchUniformCategoriesApi(),
            fetchUniformSizesApi(),
            fetchUniformSuppliersApi(),
            fetchUniformTypesApi(),
            fetchUniformDistributionsApi(),
          ]);
        const extract = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled"
            ? Array.isArray(r.value)
              ? r.value
              : r.value?.data || []
            : [];
        const cats = extract(catRes);
        const sizes = extract(sizeRes);
        const suppliers = extract(supplierRes);
        const types = extract(typeRes);
        const dists = extract(distRes);
        if (catRes.status === "fulfilled") {
          const normalizedCats: UniformCategory[] = cats.map((c: any) => ({
            id: String(c.id || c.categoryId || ""),
            name: c.categoryName || c.name || "",
            categoryName: c.categoryName || c.name || "",
            description: c.description || "",
            createdAt: c.createdAt || new Date().toISOString(),
            branch: c.branch || selectedBranch || "",
          }));
          setUniformCategories(normalizedCats);
        }
        if (sizeRes.status === "fulfilled") {
          const normalizedSizes: UniformSize[] = sizes.map((s: any) => ({
            id: String(s.id || s.sizeId || ""),
            sizeName: s.sizeName || s.sizeCodeName || "",
            sizeCodeName: s.sizeName || s.sizeCodeName || "",
            chest: s.chestSpec || s.chest || "",
            waist: s.waistSpec || s.waist || "",
            shoulder: s.shoulderSpec || s.shoulder || "",
            ageGroup: s.ageBracket || s.ageGroup || "",
            gender: s.gender || "Unisex",
            createdAt: s.createdAt || new Date().toISOString(),
            branch: s.branch || selectedBranch || "",
          }));
          setUniformSizes(normalizedSizes);
        }
        if (supplierRes.status === "fulfilled") {
          const normalizedSuppliers: UniformSupplier[] = suppliers.map(
            (s: any) => ({
              id: String(s.id || s.supplierId || ""),
              supplierName: s.supplierName || s.companyName || "",
              companyName: s.supplierName || s.companyName || "",
              contactPerson: s.contactPerson || "",
              mobile: s.phone || s.mobile || s.mobileNumber || "",
              phone: s.phone || s.mobile || s.mobileNumber || "",
              email: s.email || s.emailAddress || "",
              gstNumber: s.gstNumber || s.gstRegistrationNo || "",
              address: s.address || s.warehouseAddress || "",
              status: s.status || "Active",
              createdAt: s.createdAt || new Date().toISOString(),
              branch: s.branch || selectedBranch || "",
            }),
          );
          setUniformSuppliers(normalizedSuppliers);
        }
        if (typeRes.status === "fulfilled") {
          const normalizedInventory: UniformInventoryItem[] = types.map(
            (t: any) => ({
              id: String(t.id || t.uniformTypeId || ""),
              itemId: String(t.id || t.uniformTypeId || ""),
              itemName: t.itemName || t.name || "",
              category: t.category || t.categoryName || "Uniform Item",
              size: t.sizeSpec || t.size || "M",
              color: t.color || "Standard",
              openingStock: Number(t.openingStock ?? t.stockQuantity ?? 100),
              currentStock: Number(t.currentStock ?? t.stockQuantity ?? 0),
              minimumStock: Number(t.minimumStock ?? t.minStockAlert ?? 10),
              reorderPoint: Number(t.reorderPoint ?? 15),
              unitPrice: Number(t.unitPrice || t.price || 0),
              supplier: t.supplier || t.supplierName || "Main Warehouse",
              lastUpdated:
                t.lastUpdated || new Date().toISOString().split("T")[0],
              status:
                t.status ||
                (Number(t.currentStock ?? t.stockQuantity ?? 0) <=
                Number(t.minimumStock ?? 10)
                  ? "Low Stock"
                  : "In Stock"),
            }),
          );
          setUniformInventory(normalizedInventory);

          const normalizedUniforms: UniformItem[] = types.map((t: any) => ({
            id: String(t.id || t.uniformTypeId || ""),
            name: t.itemName || t.name || "",
            category: t.category || t.categoryName || "Uniform Item",
            gender: t.gender || "Unisex",
            size: t.sizeSpec || t.size || "All Sizes",
            color: t.color || "",
            availableStock: Number(t.currentStock ?? t.stockQuantity ?? 0),
            price: Number(t.unitPrice || t.price || 0),
            className: t.className || "All Wings",
            isPackage: Boolean(t.isPackage),
            packageComponents: t.packageComponents || [],
            createdAt: t.createdAt || new Date().toISOString(),
            branch: t.branch || selectedBranch || "",
          }));
          setUniforms(normalizedUniforms);
        }
        if (distRes.status === "fulfilled") {
          const mappedDists = dists.map((d: any) => ({
            id: String(
              d.id ||
                d.distributionId ||
                `UID-${Math.random().toString(36).substr(2, 5)}`,
            ),
            studentId: String(d.studentId || ""),
            studentName: d.studentName || "",
            admissionNo: d.admissionNo || "",
            className: d.className || d.class || "",
            section: d.section || "",
            itemId: String(d.uniformTypeId || d.itemId || ""),
            itemName: d.itemName || d.issuedItem || d.clothingItem || "",
            size: d.sizeSpec || d.size || "M",
            quantity: Number(d.quantity || d.qty || 1),
            issueDate: d.distributionDate
              ? new Date(d.distributionDate).toISOString().split("T")[0]
              : d.issueDate || new Date().toISOString().split("T")[0],
            status: d.status || "Issued",
            academicYear: d.academicYear || selectedAcademicYear || "",
            branch: d.branch || selectedBranch || "",
            notes: d.notes || d.actionRemarks || "",
            type:
              (d.type === "Base Package" ||
                d.transactionType === "Base Package" ||
                (d.transactionType &&
                  (d.transactionType.toLowerCase().includes("baseline") ||
                    d.transactionType.toLowerCase().includes("base"))) ||
                (d.itemName &&
                  (d.itemName.toLowerCase().includes("package") ||
                    d.itemName.toLowerCase().includes("base") ||
                    d.itemName.toLowerCase().includes("kit"))) ||
                (d.notes &&
                  (d.notes.toLowerCase().includes("base package") ||
                    d.notes.toLowerCase().includes("admission kit")))) &&
              d.type !== "Additional Purchase" &&
              d.transactionType !== "Additional Purchase" &&
              !d.notes?.toLowerCase().includes("additional purchase")
                ? "Base Package"
                : "Additional Purchase",
            price: Number(d.totalAmount || 0),
          }));
          setStudentUniformIssues(mappedDists);
        }
      } catch (err) {
        console.warn("Failed to fetch uniform data from API", err);
      } finally {
        delete activeRequests.current["uniform-data"];
      }
    })();
    activeRequests.current["uniform-data"] = promise;
    return promise;
  };

  const fetchSchoolEventsData = useCallback(async () => {
    try {
      const response: any = await fetchSchoolEventsApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setSchoolEvents((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch school events from API", err);
    }
  }, []);

  const fetchHolidaysData = useCallback(async () => {
    try {
      const response: any = await fetchHolidaysApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setHolidays((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch holidays from API", err);
    }
  }, []);

  const fetchAnnouncementsData = useCallback(async () => {
    try {
      const response: any = await fetchNotificationsApi();
      const rawItems = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(rawItems)) {
        const seen = new Set<string>();
        const mapped: Announcement[] = [];
        rawItems.forEach((item: any) => {
          const id = String(
            item.id || item.circularId || `ANC-${item.title || Math.random()}`,
          );
          const title = (item.title || "Announcement").trim();
          const date =
            item.createdDate ||
            item.date ||
            new Date().toISOString().split("T")[0];
          const targetAudience = (item.targetAudience || "All").trim();
          const contentKey = `${title.toLowerCase()}_${date}_${targetAudience.toLowerCase()}`;
          if (!seen.has(id) && !seen.has(contentKey)) {
            seen.add(id);
            seen.add(contentKey);
            mapped.push({
              id,
              title,
              content: item.content || "",
              targetAudience,
              date,
              author: item.author || "",
              category: (item.category || "GENERAL").toUpperCase(),
              targetClass: item.targetClass || "",
              targetSection: item.targetSection || "",
            });
          }
        });
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch announcements from API", err);
    }
  }, []);

  useEffect(() => {
    const handleAnnouncementsUpdated = () => {
      fetchAnnouncementsData();
    };
    window.addEventListener(
      "announcements_updated",
      handleAnnouncementsUpdated,
    );
    window.addEventListener("circulars_updated", handleAnnouncementsUpdated);
    const interval = setInterval(() => {
      fetchAnnouncementsData();
    }, 30000);
    return () => {
      window.removeEventListener(
        "announcements_updated",
        handleAnnouncementsUpdated,
      );
      window.removeEventListener(
        "circulars_updated",
        handleAnnouncementsUpdated,
      );
      clearInterval(interval);
    };
  }, [fetchAnnouncementsData]);

  const fetchMeetingsData = useCallback(async () => {
    try {
      const response: any = await fetchMeetingsApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setMeetings((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch meetings from API", err);
    }
  }, []);
  const fetchFinanceData = useCallback(async () => {
    if (activeRequests.current["finance-data"]) {
      return activeRequests.current["finance-data"];
    }
    const promise = (async () => {
      try {
        const [
          headsRes,
          structsRes,
          assignmentsRes,
          paymentsRes,
          hostelFeesRes,
          uniformFeesRes,
          refundsRes,
          settingsRes,
          txnsRes,
          accountsRes,
          catsRes,
          budgetsRes,
          feeScheduleRes,
          scholarshipsRes,
          studentScholarshipsRes,
          discountsRes,
          studentDiscountsRes,
        ] = await Promise.allSettled([
          FinanceAPI.fetchFeeHeadsApi(),
          FinanceAPI.fetchDynamicFeeStructuresApi(),
          FinanceAPI.fetchStudentFeeAssignmentsApi(),
          FinanceAPI.fetchFeePaymentsApi(),
          FinanceAPI.fetchHostelFeeConfigsApi(),
          FinanceAPI.fetchUniformFeeConfigsApi(),
          FinanceAPI.fetchFeeRefundRequestsApi(),
          FinanceAPI.fetchFinanceGlobalSettingsApi(),
          FinanceAPI.fetchFinanceTransactionsApi({ pageSize: 100 }),
          FinanceAPI.fetchFinancialAccountsApi(),
          FinanceAPI.fetchFinancialCategoriesApi(),
          FinanceAPI.fetchFinancialBudgetsApi(
            selectedBranch,
            selectedAcademicYear,
          ),
          FinanceAPI.fetchFeeScheduleConfigApi(selectedAcademicYear || ""),
          FinanceAPI.fetchScholarshipsApi(),
          FinanceAPI.fetchStudentScholarshipsApi(),
          FinanceAPI.fetchDiscountsApi(),
          FinanceAPI.fetchStudentDiscountsApi(),
        ]);
        const extract = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled"
            ? Array.isArray(r.value)
              ? r.value
              : r.value?.data || []
            : [];
        const heads = extract(headsRes);
        const structs = extract(structsRes);
        const assignments = extract(assignmentsRes);
        const payments = extract(paymentsRes);
        const hostelFees = extract(hostelFeesRes);
        const uniformFees = extract(uniformFeesRes);
        const refundItems = extract(refundsRes);
        const apiTxns = extract(txnsRes);
        const apiAccounts = extract(accountsRes);
        const apiCats = extract(catsRes);
        const apiBudgets = extract(budgetsRes);

        const apiSettings =
          settingsRes.status === "fulfilled"
            ? settingsRes.value?.data || settingsRes.value
            : null;
        if (apiSettings && typeof apiSettings === "object") {
          setFinanceSettings((prev) => ({
            ...prev,
            academicYear: apiSettings.academicYear || prev.academicYear,
            financialYear: apiSettings.financialYear || prev.financialYear,
            defaultCurrency:
              apiSettings.defaultCurrency ||
              apiSettings.currency ||
              prev.defaultCurrency,
            lateFeeRuleId: String(
              apiSettings.lateFeeRuleId || prev.lateFeeRuleId,
            ),
            receiptPrefix: apiSettings.receiptPrefix || prev.receiptPrefix,
            invoicePrefix: apiSettings.invoicePrefix || prev.invoicePrefix,
            autoReceiptNo:
              typeof apiSettings.autoReceiptNo === "boolean"
                ? apiSettings.autoReceiptNo
                : prev.autoReceiptNo,
            taxSettings: {
              enabled:
                typeof apiSettings.taxSettings?.enabled === "boolean"
                  ? apiSettings.taxSettings.enabled
                  : (prev.taxSettings?.enabled ?? true),
              taxName:
                apiSettings.taxSettings?.taxName ||
                prev.taxSettings?.taxName ||
                "GST",
              percentage:
                typeof apiSettings.taxSettings?.percentage === "number"
                  ? apiSettings.taxSettings.percentage
                  : (prev.taxSettings?.percentage ?? 0),
            },
          }));
        }

        const apiFeeSchedule =
          feeScheduleRes.status === "fulfilled"
            ? feeScheduleRes.value?.data || feeScheduleRes.value
            : null;
        if (
          apiFeeSchedule &&
          apiFeeSchedule.terms &&
          apiFeeSchedule.terms.length > 0
        ) {
          const ay = apiFeeSchedule.academicYear || selectedAcademicYear || "";
          const loadedSchedule: AcademicYearFeeSchedule = {
            id: apiFeeSchedule.id || `SCH-${ay}`,
            academicYear: ay,
            numberOfTerms:
              apiFeeSchedule.numberOfTerms || apiFeeSchedule.terms.length,
            status: apiFeeSchedule.status || "Active",
            annualDueDate: apiFeeSchedule.annualDueDate || "",
            oneTimeDueDate: apiFeeSchedule.oneTimeDueDate || "",
            terms: apiFeeSchedule.terms,
            monthlyConfig: apiFeeSchedule.monthlyConfig,
          };
          setAcademicYearFeeSchedules((prev) => [
            ...prev.filter((s) => !matchesAcademicYear(s.academicYear, ay)),
            loadedSchedule,
          ]);
        }

        const apiScholarships = extract(scholarshipsRes);
        if (
          scholarshipsRes.status === "fulfilled" &&
          Array.isArray(apiScholarships)
        ) {
          const mappedScholarships: Scholarship[] = apiScholarships.map(
            (s: any) => ({
              id: String(s.id || s.code),
              name: s.name || "",
              code: s.code || `SCH-${s.id}`,
              type: s.type || "Merit",
              discountType: s.discountType || "Percentage",
              percentage: Number(s.percentage || 0),
              fixedAmount: Number(s.fixedAmount || 0),
              applicableFeeHeadIds: Array.isArray(s.applicableFeeHeadIds)
                ? s.applicableFeeHeadIds
                : [],
              applicableClasses: Array.isArray(s.applicableClasses)
                ? s.applicableClasses
                : [],
              startDate: s.startDate || "",
              endDate: s.endDate || "",
              eligibility: s.eligibility || "",
              description: s.description || "",
              status: s.status || "Active",
            }),
          );
          setScholarships(mappedScholarships);
          try {
            localStorage.setItem(
              "edu_db_scholarships",
              JSON.stringify(mappedScholarships),
            );
            localStorage.setItem(
              "scholarships",
              JSON.stringify(mappedScholarships),
            );
          } catch (e) {}
        }

        const apiStudentScholarships = extract(studentScholarshipsRes);
        if (
          studentScholarshipsRes.status === "fulfilled" &&
          Array.isArray(apiStudentScholarships)
        ) {
          const mappedStudentScholarships: StudentScholarship[] =
            apiStudentScholarships.map((ss: any) => ({
              id: String(ss.id),
              studentId: String(ss.studentId),
              studentName: ss.studentName || "",
              scholarshipId: String(ss.scholarshipId),
              scholarshipName: ss.scholarshipName || "",
              discountType: ss.discountType || "Percentage",
              discountValue: Number(ss.discountValue || 0),
              appliedDate: ss.appliedDate || "",
              status: ss.status || "Active",
            }));
          setStudentScholarships(mappedStudentScholarships);
          try {
            localStorage.setItem(
              "edu_db_student_scholarships",
              JSON.stringify(mappedStudentScholarships),
            );
            localStorage.setItem(
              "student_scholarships",
              JSON.stringify(mappedStudentScholarships),
            );
          } catch (e) {}
        }

        const apiDiscounts = extract(discountsRes);
        if (
          discountsRes.status === "fulfilled" &&
          Array.isArray(apiDiscounts)
        ) {
          const mappedDiscounts: Discount[] = apiDiscounts.map((d: any) => ({
            id: String(d.id || d.code),
            name: d.name || "",
            code: d.code || `DSC-${d.id}`,
            type: d.type || "Sibling Discount",
            mode: d.mode || "Percentage",
            value: Number(d.value || 0),
            description: d.description || "",
            status: d.status || "Active",
          }));
          setDiscounts(mappedDiscounts);
          try {
            localStorage.setItem(
              "edu_db_discounts",
              JSON.stringify(mappedDiscounts),
            );
            localStorage.setItem("discounts", JSON.stringify(mappedDiscounts));
          } catch (e) {}
        }

        const apiStudentDiscounts = extract(studentDiscountsRes);
        if (
          studentDiscountsRes.status === "fulfilled" &&
          Array.isArray(apiStudentDiscounts)
        ) {
          const mappedStudentDiscounts: StudentDiscount[] =
            apiStudentDiscounts.map((sd: any) => ({
              id: String(sd.id),
              studentId: String(sd.studentId),
              discountId: String(sd.discountId),
              discountName: sd.discountName || "",
              appliedDate: sd.appliedDate || "",
            }));
          setStudentDiscounts(mappedStudentDiscounts);
          try {
            localStorage.setItem(
              "edu_db_student_discounts",
              JSON.stringify(mappedStudentDiscounts),
            );
            localStorage.setItem(
              "student_discounts",
              JSON.stringify(mappedStudentDiscounts),
            );
          } catch (e) {}
        }

        const mappedHeads: FeeHead[] = (heads || []).map((h: any) => ({
          id: String(h.id),
          name: h.name || "",
          code: h.code || `FH-${h.id}`,
          category: (h.category as any) || "Tuition",
          frequency: (h.frequency as any) || "Quarterly",
          mandatory: h.mandatory === true,
          applicableClasses: Array.isArray(h.applicableClasses)
            ? h.applicableClasses
            : [],
          applicableBranches:
            Array.isArray(h.applicableBranches) &&
            h.applicableBranches.length > 0
              ? h.applicableBranches
              : ["All Branches"],
          amount: Number(h.amount || h.defaultAmount || 0),
          defaultAmount: Number(h.defaultAmount || h.amount || 0),
          taxPercentage: Number(h.taxPercentage || 0),
          displayOrder: Number(h.displayOrder || 1),
          status: (h.status === "Inactive" ? "Inactive" : "Active") as
            | "Active"
            | "Inactive",
          academicYear: h.academicYear || "All",
        }));
        const cleanHeads =
          headsRes.status === "fulfilled"
            ? deduplicateFeeHeads(mappedHeads)
            : feeHeads;
        if (headsRes.status === "fulfilled") {
          setFeeHeads(cleanHeads);
          try {
            localStorage.setItem("fee_heads", JSON.stringify(cleanHeads));
            localStorage.setItem(
              "edu_db_fee_heads",
              JSON.stringify(cleanHeads),
            );
          } catch (e) {}
        }
        if (structsRes.status === "fulfilled") {
          const apiStructs = Array.isArray(structs) ? structs : [];
          const activeHeadIds = new Set(
            cleanHeads.map((h: any) => String(h.id).trim().toLowerCase()),
          );
          const activeHeadCodes = new Set(
            cleanHeads
              .map((h: any) => (h.code || "").trim().toLowerCase())
              .filter(Boolean),
          );
          const activeHeadNames = new Set(
            cleanHeads
              .map((h: any) => (h.name || "").trim().toLowerCase())
              .filter(Boolean),
          );

          const validStructs = apiStructs.map((s: any) => {
            const currentItems = s.items || [];
            const validItems =
              cleanHeads.length > 0
                ? currentItems.filter((item: any) => {
                    const iId = String(item.feeHeadId || item.headId || "")
                      .trim()
                      .toLowerCase();
                    const iName = (item.feeHeadName || item.name || "")
                      .trim()
                      .toLowerCase();
                    const idMatch =
                      iId &&
                      (activeHeadIds.has(iId) || activeHeadCodes.has(iId));
                    const nameMatch = iName && activeHeadNames.has(iName);
                    return idMatch || nameMatch;
                  })
                : currentItems;

            const newTotal = validItems.reduce(
              (sum: number, it: any) => sum + (Number(it.amount) || 0),
              0,
            );

            return {
              ...s,
              items: validItems,
              totalAmount: newTotal,
            };
          });

          setDynamicFeeStructures(validStructs);
          try {
            localStorage.setItem(
              "dynamic_fee_structures",
              JSON.stringify(validStructs),
            );
            localStorage.setItem(
              "edu_db_dynamic_fee_structures",
              JSON.stringify(validStructs),
            );
          } catch (e) {}
        }
        setDbAssignments(assignments);
        if (paymentsRes.status === "fulfilled") {
          const rawPayments = Array.isArray(payments) ? payments : [];
          const seenKeys = new Set<string>();
          const freshPayments = rawPayments.filter((p: any) => {
            if (!p) return false;
            const rNo = p.receiptNo && String(p.receiptNo).trim();
            const key = rNo ? `REC_${rNo}` : `ID_${String(p.id).trim()}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          });
          setFeePayments((prev) => {
            if (freshPayments.length === 0) return [];
            return freshPayments.map((p: any) => {
              const amountPaidVal = Number(p.amountPaid ?? p.amount ?? 0);
              const paymentModeVal = p.paymentMode || p.paymentMethod || "Cash";

              let allocs = p.paymentAllocation || p.allocations;
              if ((!allocs || allocs.length === 0) && p.paidItemsJson) {
                try {
                  const parsed = JSON.parse(p.paidItemsJson);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    allocs = parsed.map((item: any) => ({
                      academicYear:
                        item.academicYear ||
                        p.academicYear ||
                        selectedAcademicYear ||
                        "",
                      amount: Number(
                        item.amount ?? item.Amount ?? item.finalAmount ?? 0,
                      ),
                      installmentId:
                        item.installmentId ||
                        item.id ||
                        item.TermId ||
                        item.feeHeadId ||
                        item.FeeHeadId,
                      feeHeadName:
                        item.feeHeadName ||
                        item.HeadName ||
                        p.feeHeadName ||
                        "",
                      termName:
                        item.termName || item.TermName || p.termName || "",
                    }));
                  }
                } catch {}
              }

              const existing = prev.find(
                (x) =>
                  String(x.id) === String(p.id) ||
                  (x.receiptNo && p.receiptNo && x.receiptNo === p.receiptNo),
              );

              return {
                ...p,
                id: String(p.id),
                studentId: String(p.studentId),
                amountPaid: amountPaidVal,
                amount: amountPaidVal,
                paymentMode: paymentModeVal,
                admissionNo: p.admissionNo || existing?.admissionNo,
                paymentAllocation:
                  allocs && allocs.length > 0
                    ? allocs
                    : existing?.paymentAllocation || [],
                selectedInstallmentIds:
                  p.selectedInstallmentIds &&
                  p.selectedInstallmentIds.length > 0
                    ? p.selectedInstallmentIds
                    : existing?.selectedInstallmentIds || [],
              };
            });
          });
          try {
            localStorage.setItem("fee_payments", JSON.stringify(freshPayments));
            localStorage.setItem(
              "edu_db_fee_payments",
              JSON.stringify(freshPayments),
            );
          } catch (e) {}
        }

        const mappedHostelFees: FinanceHostelConfig[] = (hostelFees || []).map(
          (apiItem: any) => ({
            id: String(apiItem.id || `FHC-${Date.now()}`),
            hostelId: String(apiItem.hostelId || ""),
            hostelName: apiItem.hostelName || "",
            roomTypeId: String(apiItem.roomTypeId || ""),
            roomTypeName: apiItem.roomTypeName || "",
            roomId: apiItem.roomId || "",
            roomNo: apiItem.roomNo || "All Rooms",
            acType: apiItem.acType || "All",
            sharingType: apiItem.sharingType || "All",
            startClass: apiItem.startClass || "",
            endClass: apiItem.endClass || "",
            classRange:
              apiItem.classRange ||
              (apiItem.startClass && apiItem.endClass
                ? `${apiItem.startClass} - ${apiItem.endClass}`
                : "All Classes"),
            applicableClasses: Array.isArray(apiItem.applicableClasses)
              ? apiItem.applicableClasses
              : apiItem.applicableClasses
                ? apiItem.applicableClasses.split(",")
                : [],
            academicYear: apiItem.academicYear || "2025-2026",
            branch: apiItem.branch || "",
            feePlan: apiItem.feePlan || "Annual",
            hostelFee: Number(apiItem.hostelFee || 0),
            securityDeposit: Number(apiItem.securityDeposit || 0),
            applicableTerms: Array.isArray(apiItem.applicableTerms)
              ? apiItem.applicableTerms
              : apiItem.applicableTerms
                ? JSON.parse(apiItem.applicableTerms)
                : [],
            effectiveFrom:
              apiItem.effectiveFrom || new Date().toISOString().split("T")[0],
            status: apiItem.status || "Active",
            createdAt: apiItem.createdAt,
          }),
        );
        setFinanceHostelConfigs(mappedHostelFees);
        try {
          localStorage.setItem(
            "finance_hostel_configs",
            JSON.stringify(mappedHostelFees),
          );
          localStorage.setItem(
            "edu_db_finance_hostel_configs",
            JSON.stringify(mappedHostelFees),
          );
        } catch (e) {}

        // Sync active Hostel Facilities & Rooms from existing Hostel Management module
        try {
          const [blocksRes, roomsRes, allocsRes] = await Promise.allSettled([
            getHostelBlocks(),
            getRooms(),
            getAllocations(),
          ]);
          if (
            blocksRes.status === "fulfilled" &&
            Array.isArray(blocksRes.value) &&
            blocksRes.value.length > 0
          ) {
            const mappedBlocks: HostelBlock[] = blocksRes.value.map(
              (b: any) => ({
                id: String(b.hostelId || b.id),
                name: b.hostelName || b.name || `Hostel ${b.hostelId}`,
                wardenName: b.wardenName || "Unassigned",
                wardenPhone: b.primaryMobileNumber || b.wardenPhone || "",
                totalFloors: b.totalFloors || 4,
              }),
            );
            setHostelBlocks(mappedBlocks);
            try {
              localStorage.setItem(
                "hostel_blocks",
                JSON.stringify(mappedBlocks),
              );
              localStorage.setItem(
                "edu_db_hostel_blocks",
                JSON.stringify(mappedBlocks),
              );
            } catch (e) {}
          }
          if (
            roomsRes.status === "fulfilled" &&
            Array.isArray(roomsRes.value) &&
            roomsRes.value.length > 0
          ) {
            const mappedRooms: any[] = roomsRes.value.map((r: any) => ({
              id: String(r.roomId || r.id),
              blockId: String(r.hostelId || r.blockId),
              roomNo: r.roomNumber || r.roomNo || `Room ${r.roomId}`,
              capacity: r.bedCapacity || r.capacity || 1,
              occupiedBeds: r.occupiedBeds || 0,
              monthlyRent: r.monthlyFee || 0,
            }));
            setHostelRooms(mappedRooms);
            try {
              localStorage.setItem("hostel", JSON.stringify(mappedRooms));
            } catch (e) {}
          }
          if (
            allocsRes.status === "fulfilled" &&
            Array.isArray(allocsRes.value)
          ) {
            const mappedAllocs: StudentHostelAssignment[] = allocsRes.value
              .filter((a: any) => a && (a.status === "Active" || !a.status))
              .map((a: any) => ({
                id: String(a.allocationId || `SHA-${a.studentId}`),
                studentId: String(a.studentId),
                studentName: a.studentName || "",
                admissionNo: a.admissionNo || a.registrationNo || "",
                hostelId: String(a.hostelId || ""),
                hostelName: a.hostelName || "",
                roomNo: String(a.roomNumber || a.roomId || ""),
                roomTypeName: a.roomTypeName || "",
                bedNo: a.bedNumber || "",
                allocatedDate:
                  a.joiningDate || new Date().toISOString().split("T")[0],
                joiningDate:
                  a.joiningDate ||
                  a.allocatedDate ||
                  new Date().toISOString().split("T")[0],                status: "Active" as const,
              }));
            setStudentHostelAssignments(mappedAllocs);
            try {
              localStorage.setItem(
                "student_hostel_assignments",
                JSON.stringify(mappedAllocs),
              );
              localStorage.setItem(
                "edu_db_student_hostel_assignments",
                JSON.stringify(mappedAllocs),
              );
            } catch (e) {}
          }
        } catch (e) {}

        if (Array.isArray(uniformFees) && uniformFees.length > 0) {
          setFinanceUniformConfigs((prev) => {
            const apiMapped = uniformFees.map((apiItem: any) => ({
              id: String(apiItem.id || `FUC-${Date.now()}`),
              academicYear: apiItem.academicYear || selectedAcademicYear || "",
              branch: apiItem.branch || selectedBranch || "",
              className: apiItem.className || "",
              gender: apiItem.gender || "Unisex",
              uniformPackage: apiItem.uniformPackage || "",
              uniformItemId: String(apiItem.uniformItemId || ""),
              feePlan: apiItem.feePlan || "Annual",
              feeAmount: Number(apiItem.feeAmount || 0),
              effectiveFrom:
                apiItem.effectiveFrom || new Date().toISOString().split("T")[0],
              status: apiItem.status || "Active",
            }));

            const combined = [...prev];
            apiMapped.forEach((apiCfg) => {
              const exists = combined.some((c) => c && c.id === apiCfg.id);
              if (!exists) {
                combined.push(apiCfg);
              }
            });

            try {
              localStorage.setItem(
                "edu_db_finance_uniform_configs",
                JSON.stringify(combined),
              );
              localStorage.setItem(
                "finance_uniform_configs",
                JSON.stringify(combined),
              );
            } catch (e) {}

            return combined;
          });
        }

        setRefunds(
          refundItems.map((apiItem: any) => {
            const rId = String(
              apiItem.id || apiItem.refundRequestId || Date.now(),
            );
            const rNo =
              apiItem.refundNo ||
              apiItem.refundRequestId ||
              `RF-${new Date().getFullYear()}-${rId}`;
            return {
              id: rId,
              refundNo: rNo,
              receiptNo:
                apiItem.receiptNo || `REC-${new Date().getFullYear()}-0001`,
              studentId: String(apiItem.studentId || ""),
              studentName: apiItem.studentName || "",
              admissionNo: apiItem.admissionNo || "",
              className: apiItem.className || "",
              section: apiItem.section || "",
              amount: Number(apiItem.refundAmount || apiItem.amount || 0),
              reason: apiItem.reason || "Fee Refund",
              approvedBy:
                apiItem.approvedBy ||
                (apiItem.status === "Approved"
                  ? "Dr. Eleanor Vance (Principal)"
                  : "Pending Admin Review"),
              refundMode:
                apiItem.paymentMode || apiItem.refundMode || "Bank Transfer",
              refundDate: (
                apiItem.requestedDate ||
                apiItem.refundDate ||
                new Date().toISOString()
              ).split("T")[0],
              remarks: apiItem.remarks || "",
              status: apiItem.status || "Pending",
            };
          }),
        );

        const seenTxnRefs = new Set<string>();
        const seenTxnIds = new Set<string>();
        const uniqueApiTxns: any[] = [];
        for (const item of Array.isArray(apiTxns) ? apiTxns : []) {
          const tId = String(item.transactionId || item.id || "").trim();
          const ref = String(item.referenceNumber || "").trim();
          if (ref && seenTxnRefs.has(ref)) continue;
          if (tId && seenTxnIds.has(tId)) continue;
          if (ref) seenTxnRefs.add(ref);
          if (tId) seenTxnIds.add(tId);
          uniqueApiTxns.push(item);
        }

        setFinanceTransactions(
          uniqueApiTxns.map((item: any) => {
            const tId = item.transactionId || `TXN-${item.id}`;
            return {
              id: String(item.id || tId),
              transactionId: tId,
              date:
                item.date ||
                (item.transactionDate
                  ? String(item.transactionDate).split("T")[0]
                  : new Date().toISOString().split("T")[0]),
              time: item.time || "10:00 AM",
              type: item.type === "Expense" ? "Expense" : "Income",
              category: item.category || "General",
              sourceModule: item.sourceModule || "Manual",
              referenceNumber: item.referenceNumber || "",
              description: item.description || "",
              amount: Number(item.amount || 0),
              paymentMode: item.paymentMode || "Bank Transfer",
              account: item.account || "Main Bank Account",
              branch: item.branch || selectedBranch || "",
              academicYear: item.academicYear || selectedAcademicYear || "",
              status: item.status || "Completed",
              createdBy: item.createdBy || "Finance Admin",
              approvedBy: item.approvedBy || "Chief Accountant",
              notes: item.notes || "",
              attachments: item.attachmentName
                ? [item.attachmentName]
                : item.attachments || [],
            };
          }),
        );

        setFinancialAccounts(
          apiAccounts.map((item: any) => ({
            id: String(item.id || "ACC-" + Date.now()),
            accountName: item.accountName,
            accountType: item.accountType || "Main Bank Account",
            accountNumber: item.accountNumber || "",
            bankName: item.bankName || "",
            branchName: item.branchName || "",
            currentBalance: Number(item.currentBalance || 0),
            currency: item.currency || "INR",
            status: item.status === "Inactive" ? "Inactive" : "Active",
          })),
        );

        setFinancialCategories(
          apiCats.map((item: any) => ({
            id: String(item.id || "CAT-" + Date.now()),
            name: item.name,
            type: item.type === "Expense" ? "Expense" : "Income",
            sourceModule: item.sourceModule || "Manual",
            status: item.status === "Inactive" ? "Inactive" : "Active",
            isSystem:
              typeof item.isSystem === "boolean" ? item.isSystem : false,
          })),
        );

        setFinancialBudgets(
          apiBudgets.map((item: any) => {
            const bName = item.categoryName || item.department || "";
            const alloc = Number(
              item.allocatedAmount || item.allocatedBudget || 0,
            );
            const cons = Number(
              item.consumedAmount || item.utilizedBudget || 0,
            );
            return {
              id: String(item.id || "BDG-" + Date.now()),
              categoryName: bName,
              academicYear: item.academicYear || selectedAcademicYear || "",
              branch: item.branch || selectedBranch || "",
              allocatedAmount: alloc,
              consumedAmount: cons,
              remainingAmount: Math.max(0, alloc - cons),
              status: cons > alloc ? "Exceeded" : item.status || "Active",
            };
          }),
        );
      } catch (err) {
        console.warn("Failed to fetch finance data from API", err);
      } finally {
        delete activeRequests.current["finance-data"];
      }
    })();
    activeRequests.current["finance-data"] = promise;
    return promise;
  }, []);

  const fetchFacultyTrainingData = useCallback(async () => {
    try {
      const [workshopsRes, assessmentsRes] = await Promise.allSettled([
        fetchWorkshopsApi(),
        fetchAssessmentsApi(),
      ]);
      if (workshopsRes.status === "fulfilled") {
        const wItems = Array.isArray(workshopsRes.value)
          ? workshopsRes.value
          : workshopsRes.value?.data || [];
        if (Array.isArray(wItems) && wItems.length > 0) {
          const mappedWorkshops: WorkshopTraining[] = wItems.map((w: any) => ({
            id: w.workshopId
              ? `WKS-${w.workshopId}`
              : w.id || `WKS-${Math.random()}`,
            workshopName: w.title || w.workshopName || "Workshop",
            category: w.category || "Faculty Development Program (FDP)",
            type: w.type || "Internal",
            trainerName: w.trainerName || "Trainer",
            organization: w.organization || "EdTech Innovations Institute",
            branch: w.branch || selectedBranch || "",
            department: w.department || "Academics",
            applicableDesignation: w.applicableDesignation || "All Staff",
            venue: w.venue || "Main Auditorium",
            startDate: w.startDate
              ? w.startDate.split("T")[0]
              : new Date().toISOString().split("T")[0],
            endDate: w.endDate
              ? w.endDate.split("T")[0]
              : new Date().toISOString().split("T")[0],
            startTime: w.startTime || "09:30 AM",
            endTime: w.endTime || "03:30 PM",
            capacity: w.capacity || 50,
            description: w.description || "",
            targetRoleType: w.targetRoleType || "Teaching Staff",
            attendancePct: w.attendanceRate || w.attendancePct || 95,
            status: w.status || "Scheduled",
            participants: (w.participants || []).map((p: any) => ({
              employeeId: p.staffId
                ? `STF-${p.staffId}`
                : p.employeeId || "STF-101",
              employeeName: p.staffName || p.employeeName || "Staff Member",
              department: p.department || "Academics",
              designation: p.designation || "Faculty",
              attendanceStatus:
                p.registrationStatus === "Attended"
                  ? "Present"
                  : p.attendanceStatus || "Present",
            })),
          }));
          setWorkshops(mappedWorkshops);
        }
      }
      if (assessmentsRes.status === "fulfilled") {
        const aItems = Array.isArray(assessmentsRes.value)
          ? assessmentsRes.value
          : assessmentsRes.value?.data || [];
        if (Array.isArray(aItems) && aItems.length > 0) {
          const mappedAssessments: EmployeeAssessment[] = aItems.map(
            (a: any) => ({
              id: a.assessmentId
                ? `ASM-${a.assessmentId}`
                : a.id || `ASM-${Math.random()}`,
              assessmentName: a.assessmentName || "Competency Assessment",
              assessmentType: a.assessmentType || "Digital Skills Test",
              department: a.departmentFilter || a.department || "Academics",
              totalMarks: a.totalMarks || 100,
              passingMarks: a.passingMarks || 40,
              date: a.scheduledDate
                ? a.scheduledDate.split("T")[0]
                : new Date().toISOString().split("T")[0],
              evaluatorName:
                a.mainEvaluator || a.evaluatorName || "Academic Director",
              status: a.status || "Scheduled",
              branch: a.branchFilter || a.branch || selectedBranch || "",
              createdAt: a.createdAt
                ? a.createdAt.split("T")[0]
                : new Date().toISOString().split("T")[0],
              results: (a.candidates || []).map((c: any) => ({
                employeeId: c.staffId
                  ? `STF-${c.staffId}`
                  : c.employeeId || "STF-101",
                employeeName: c.staffName || c.employeeName || "Staff Member",
                score: c.score || 80,
                percentage: c.score || 80,
                result: c.score >= (a.passingMarks || 40) ? "Pass" : "Fail",
                remarks: c.remarks || "Good performance",
              })),
            }),
          );
          setEmployeeAssessments(mappedAssessments);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch faculty training data from API", err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const userRole = role?.toLowerCase() || "";
      const isParentOrStudent = userRole === "parent" || userRole === "student";

      // Always fetch events, holidays, announcements, and meetings as these are relevant to parents/students
      fetchSchoolEventsData();
      fetchHolidaysData();
      fetchAnnouncementsData();
      fetchMeetingsData();
      fetchHomeworkData();
      fetchStudentAttendanceData();
      fetchGradingScaleRules();

      // Always fetch students (handles ward lookup for parents)
      fetchStudents();

      // Sync automated ID sequence settings from database
      fetchIdSequenceSettingsApi()
        .then((res: any) => {
          if (res && res.success && res.data) {
            saveIdSequenceSettings(res.data);
          }
        })
        .catch(() => {});

      if (!isParentOrStudent) {
        fetchStaff();
        fetchAcademicClasses();
        fetchSubjects();
        fetchPeriods();
        fetchTimetables();
        fetchDepartments();
        fetchDesignations();
        fetchPayrollConfigurations();
        fetchPayrollComponents();
        fetchPayrollRuns();
        fetchPayslips();
        fetchLeaveApplications();
        fetchLeaveTypes();
        fetchLeaveBalances();
        fetchDailyAttendance(new Date().toISOString().split("T")[0]);
        fetchUniformData().catch(() => {});
      }
    }
    if (isAuthenticated) {
      fetchAdmissions();
      fetchFinanceData().catch(() => {});
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    const handleFinanceUpdated = () => {
      fetchFinanceData().catch(() => {});
    };
    window.addEventListener("finance_updated", handleFinanceUpdated);
    return () => {
      window.removeEventListener("finance_updated", handleFinanceUpdated);
    };
  }, [fetchFinanceData]);

  const logActivity = (
    action: string,
    details: string,
    userName = "Admin User",
    role = "Admin",
  ) => {
    const newLog: AuditLog = {
      id: "LOG-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      userName,
      userRole: role,
      action,
      details,
      ipAddress: "192.168.1.1",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setSchoolProfile((prev) => {
      const next = { ...prev, ...profile };
      try {
        localStorage.setItem("edu_db_profile", JSON.stringify(next));
        localStorage.setItem("profile", JSON.stringify(next));
        const logoVal = next.logoUrl ?? "";
        localStorage.setItem("school_logo", logoVal);
        localStorage.setItem("logoUrl", logoVal);
        localStorage.setItem("schoolLogo", logoVal);
      } catch (e) {}

      // Asynchronously persist to database table
      updateSchoolSettingsApi({
        schoolName: next.name,
        tagline: next.tagline,
        address: next.address,
        phone: next.phone,
        email: next.email,
        website: next.website,
        principalName: next.principalName,
        logoUrl: next.logoUrl || "",
      }).catch((err) => {
        console.warn("Failed to save school settings to backend API:", err);
      });

      return next;
    });
    try {
      window.dispatchEvent(new Event("school_profile_updated"));
    } catch (e) {}
    logActivity(
      "Updated School Profile",
      "Updated school contact and settings",
    );
  };

  const loadReleasedExamResultsFromDb = useCallback(async () => {
    try {
      const res: any = await fetchReportCardsApi();
      const cards = res?.data || res;
      if (Array.isArray(cards) && cards.length > 0) {
        setProcessedResults((prev) => {
          const mapped: ProcessedResult[] = cards.map((r: any) => {
            const maxMarks = Number(r.totalMaxMarks ?? r.maxMarks ?? 0);
            const obtained = Number(
              r.totalMarksObtained ??
                r.totalObtainedMarks ??
                r.obtainedMarks ??
                0,
            );
            const pct = Number(
              r.percentage ?? (maxMarks > 0 ? (obtained / maxMarks) * 100 : 0),
            );
            const grade = r.finalGrade || r.overallGrade || r.grade || "";
            const passFail = r.resultStatus || r.passStatus || "";
            const rankVal = r.rank ? Number(r.rank) : 0;

            return {
              id: String(r.id || r.resultId || `API-${r.studentId}`),
              examId: String(
                r.examId || (exams.length > 0 ? exams[0].id : "1"),
              ),
              studentId: String(r.studentId || ""),
              studentName: r.studentName || "",
              className: r.className || "",
              section: r.sectionName || r.section || "",
              rollNo: r.rollNumber || r.rollNo || "",
              admissionNo:
                r.admissionNumber || r.admissionNo || String(r.studentId || ""),
              totalMaxMarks: maxMarks,
              totalObtainedMarks: obtained,
              percentage: pct,
              gpa: Number(r.gpa || 0),
              finalGrade: grade,
              overallGrade: grade,
              subjectMarks: Array.isArray(r.subjectMarks) ? r.subjectMarks : [],
              passStatus: passFail as "Pass" | "Fail",
              status: "Published",
              rank: rankVal,
              publishedAt:
                r.calculatedAt || new Date().toISOString().split("T")[0],
            };
          });

          const seen = new Set(
            mapped.map((m) => `${m.examId}_${m.studentId}_${m.className}`),
          );
          const remaining = prev.filter(
            (p) => !seen.has(`${p.examId}_${p.studentId}_${p.className}`),
          );
          return [...remaining, ...mapped];
        });

        // Also populate examMarks for subject marks consistency
        const newExamMarksList: any[] = [];
        cards.forEach((card: any) => {
          const subs = card.subjectMarks || card.subjectScores || [];
          if (Array.isArray(subs)) {
            subs.forEach((sub: any) => {
              newExamMarksList.push({
                id: `EM-${card.examId || "1"}-${card.studentId}-${sub.subject}`,
                examId: String(card.examId || "1"),
                studentId: String(card.studentId || ""),
                studentName: card.studentName || "",
                rollNo: card.rollNo || "",
                admissionNo: card.admissionNo || "",
                className: card.className || "",
                section: card.sectionName || card.section || "",
                subject: sub.subject || sub.subjectName || "",
                maxMarks: Number(sub.maxMarks || 0),
                marksObtained: Number(sub.obtainedMarks || 0),
                grade: sub.grade || "",
                isLocked: true,
              });
            });
          }
        });
        if (newExamMarksList.length > 0) {
          setExamMarks((prev) => {
            const existingKeys = new Set(
              newExamMarksList.map(
                (m) => `${m.examId}_${m.studentId}_${m.subject}`,
              ),
            );
            const remaining = prev.filter(
              (p) =>
                !existingKeys.has(`${p.examId}_${p.studentId}_${p.subject}`),
            );
            return [...remaining, ...newExamMarksList];
          });
        }
      }
    } catch (err) {
      console.warn("Initial released exam results load note:", err);
    }
  }, [exams]);

  useEffect(() => {
    const loadSchoolSettingsFromDb = async () => {
      try {
        const res: any = await fetchSchoolSettingsApi();
        const data = res?.data || res;
        if (
          data &&
          (data.schoolName !== undefined ||
            data.logoUrl !== undefined ||
            data.address !== undefined)
        ) {
          const localLogoRaw =
            localStorage.getItem("school_logo") ??
            localStorage.getItem("logoUrl") ??
            localStorage.getItem("schoolLogo");

          const currentProfile = schoolProfile || initialSchoolProfile;
          let effectiveLogo = currentProfile.logoUrl ?? "";
          if (data.logoUrl !== undefined && data.logoUrl !== null) {
            effectiveLogo = data.logoUrl;
          } else if (localLogoRaw !== null) {
            effectiveLogo = localLogoRaw;
          }

          const next: SchoolProfile = {
            ...initialSchoolProfile,
            ...currentProfile,
            name:
              data.schoolName ||
              data.name ||
              currentProfile.name ||
              initialSchoolProfile.name,
            tagline:
              data.tagline !== undefined && data.tagline !== null
                ? data.tagline
                : currentProfile.tagline || initialSchoolProfile.tagline,
            address:
              data.address !== undefined && data.address !== null
                ? data.address
                : currentProfile.address || initialSchoolProfile.address,
            phone:
              data.phone !== undefined && data.phone !== null
                ? data.phone
                : currentProfile.phone || initialSchoolProfile.phone,
            email:
              data.email !== undefined && data.email !== null
                ? data.email
                : currentProfile.email || initialSchoolProfile.email,
            website:
              data.website !== undefined && data.website !== null
                ? data.website
                : currentProfile.website || initialSchoolProfile.website,
            principalName:
              data.principalName !== undefined && data.principalName !== null
                ? data.principalName
                : currentProfile.principalName ||
                  initialSchoolProfile.principalName,
            logoUrl: effectiveLogo,
          };
          try {
            localStorage.setItem("edu_db_profile", JSON.stringify(next));
            localStorage.setItem("profile", JSON.stringify(next));
            localStorage.setItem("school_logo", next.logoUrl || "");
            localStorage.setItem("logoUrl", next.logoUrl || "");
            localStorage.setItem("schoolLogo", next.logoUrl || "");
          } catch (e) {}

          setSchoolProfile(next);
          setTimeout(() => {
            try {
              window.dispatchEvent(new Event("school_profile_updated"));
            } catch (e) {}
          }, 0);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch school branding from backend database:",
          err,
        );
      }
    };

    loadSchoolSettingsFromDb();
    loadReleasedExamResultsFromDb();

    const handleProfileUpdate = () => {
      try {
        const storedLogo =
          localStorage.getItem("school_logo") ??
          localStorage.getItem("logoUrl") ??
          localStorage.getItem("schoolLogo");

        const stored =
          localStorage.getItem("edu_db_profile") ||
          localStorage.getItem("profile");
        const parsed = stored ? JSON.parse(stored) : {};

        setSchoolProfile((prev) => {
          const base = prev || initialSchoolProfile;
          const effectiveLogo =
            storedLogo !== null
              ? storedLogo
              : parsed?.logoUrl !== undefined
                ? parsed.logoUrl
                : (base?.logoUrl ?? "");
          return {
            ...initialSchoolProfile,
            ...base,
            ...(parsed || {}),
            logoUrl: effectiveLogo,
          };
        });
      } catch (e) {}
    };

    window.addEventListener("school_profile_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    window.addEventListener("focus", loadSchoolSettingsFromDb);
    window.addEventListener("focus", loadReleasedExamResultsFromDb);
    window.addEventListener(
      "refresh_released_results",
      loadReleasedExamResultsFromDb,
    );
    window.addEventListener("results_published", loadReleasedExamResultsFromDb);

    const syncInterval = setInterval(() => {
      loadSchoolSettingsFromDb();
      loadReleasedExamResultsFromDb();
    }, 60000);

    return () => {
      window.removeEventListener("school_profile_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
      window.removeEventListener("focus", loadSchoolSettingsFromDb);
      window.removeEventListener("focus", loadReleasedExamResultsFromDb);
      window.removeEventListener(
        "refresh_released_results",
        loadReleasedExamResultsFromDb,
      );
      window.removeEventListener(
        "results_published",
        loadReleasedExamResultsFromDb,
      );
      clearInterval(syncInterval);
    };
  }, []);

  const addStudent = (
    stData: Omit<Student, "id">,
    skipApiCall = false,
  ): Student => {
    if (!skipApiCall && stData.dob) {
      const ageRes = validateStudentAge({
        dateOfBirth: stData.dob,
        dateOfAdmission:
          (stData as any).joiningDate ||
          stData.admissionDate ||
          new Date().toISOString().split("T")[0],
        className: stData.className,
        academicClasses,
      });
      if (!ageRes.isValid) {
        throw new Error(ageRes.message || "Age eligibility check failed.");
      }
    }

    const id = (stData as any).id || generateNextStudentId(students);
    const admissionNo = stData.admissionNo || generateNextAdmissionNo(students);
    const newStudent: Student = {
      ...stData,
      id,
      admissionNo,
      section: stData.section || "",
      rollNo: stData.rollNo || "",
      branch: stData.branch || selectedBranch || "",
      studentType: stData.studentType || "Day Scholar",
      promotionHistory: stData.promotionHistory || [],
    };

    if (!skipApiCall) {
      const targetClass = academicClasses.find(
        (c) =>
          c.name === newStudent.className ||
          c.name === `Class ${newStudent.className}` ||
          c.name.replace("Class ", "") ===
            (newStudent.className || "").replace("Class ", ""),
      );
      const targetClassId = targetClass ? parseInt(targetClass.id) || 1 : 1;

      let targetSectionId: number | undefined = undefined;
      if (
        newStudent.section &&
        newStudent.section !== "Unassigned" &&
        targetClass
      ) {
        const cleanSecName = newStudent.section.replace("Section ", "").trim();
        const secDetail =
          (targetClass as any).sectionDetails?.[cleanSecName] ||
          (targetClass as any).sectionDetails?.[newStudent.section];
        if (secDetail?.id) {
          targetSectionId = parseInt(secDetail.id);
        }
      }

      const studentBranchName = (newStudent.branch || selectedBranch || "")
        .trim()
        .toLowerCase();
      const matchedBranch = (branches || []).find(
        (b: any) =>
          (b.name || b.branchName || "").trim().toLowerCase() ===
          studentBranchName,
      );
      const resolvedBranchId =
        Number((newStudent as any)?.branchId) ||
        (matchedBranch
          ? Number(matchedBranch.id || matchedBranch.branchId)
          : undefined) ||
        (branches.length > 0
          ? Number(branches[0].id || branches[0].branchId)
          : 1);

      const matchedYear = (academicYears || []).find(
        (y: any) =>
          (y.year || y.academicYear) ===
          ((newStudent as any)?.academicYear || selectedAcademicYear),
      );
      const resolvedYearId =
        Number((newStudent as any)?.academicYearId) ||
        (matchedYear
          ? Number(
              String(
                matchedYear.id || (matchedYear as any).academicYearId,
              ).replace(/\D/g, ""),
            )
          : undefined) ||
        (academicYears.length > 0
          ? Number(
              String(
                academicYears[0].id || (academicYears[0] as any).academicYearId,
              ).replace(/\D/g, ""),
            )
          : 1);

      createStudentApi({
        admissionNumber: newStudent.admissionNo || "",
        rollNumber: newStudent.rollNo || "",
        studentName:
          `${newStudent.firstName || ""} ${newStudent.lastName || ""}`.trim(),
        dateOfBirth: newStudent.dob || undefined,
        gender: newStudent.gender || undefined,
        fatherName: newStudent.parentName || "",
        fatherMobile:
          (newStudent as any).parentPhone || (newStudent as any).mobile || "",
        email: newStudent.email || undefined,
        mobileNumber:
          (newStudent as any).parentPhone || (newStudent as any).mobile || "",
        address: newStudent.address || "",
        branchId: resolvedBranchId,
        academicYearId: resolvedYearId,
        classId: targetClassId,
        sectionId: targetSectionId as any,
        status: newStudent.status || "Active",
      })
        .then((response: any) => {
          if (response && response.success && response.data) {
            setStudents((prev) =>
              prev.map((s) =>
                s.id === newStudent.id
                  ? { ...s, id: response.data.studentId.toString() }
                  : s,
              ),
            );
          }
        })
        .catch((err) => console.error("Failed to create student", err));
    }

    setStudents((prev) => [...prev, newStudent]);
    logActivity(
      "Registered Student",
      `Enrolled ${newStudent.firstName} ${newStudent.lastName}`,
    );
    setTimeout(() => {
      generateStudentFeeLedger(
        id,
        newStudent,
        selectedAcademicYear || financeSettings.academicYear || "",
      );
    }, 100);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const oldStudent = students.find((s) => s.id === id);
    const numericId = parseInt(id, 10);

    const targetClassName = updates.className || oldStudent?.className || "";
    if (
      updates.dob !== undefined ||
      (updates as any).joiningDate !== undefined ||
      updates.admissionDate !== undefined ||
      updates.className !== undefined
    ) {
      const targetDob = updates.dob ?? oldStudent?.dob;
      const targetAdmissionDate =
        (updates as any).joiningDate ||
        updates.admissionDate ||
        (oldStudent as any)?.joiningDate ||
        oldStudent?.admissionDate ||
        new Date().toISOString().split("T")[0];
      if (targetDob) {
        const ageRes = validateStudentAge({
          dateOfBirth: targetDob,
          dateOfAdmission: targetAdmissionDate,
          className: targetClassName,
          academicClasses,
        });
        if (!ageRes.isValid) {
          throw new Error(ageRes.message || "Age eligibility check failed.");
        }
      }
    }

    const matchedClass = academicClasses.find(
      (c) =>
        c.name?.toLowerCase().trim() === targetClassName.toLowerCase().trim() ||
        c.name?.toLowerCase().replace(/class/gi, "").trim() ===
          targetClassName.toLowerCase().replace(/class/gi, "").trim(),
    );
    const resolvedClassId = matchedClass
      ? Number(String(matchedClass.id).replace(/\D/g, "")) || 1
      : 1;

    if (!isNaN(numericId) && oldStudent) {
      const fullStudent = { ...oldStudent, ...updates };
      const targetClass = academicClasses.find(
        (c) =>
          c.name === fullStudent.className ||
          c.name === `Class ${fullStudent.className}` ||
          c.name.replace("Class ", "") ===
            (fullStudent.className || "").replace("Class ", ""),
      );
      const targetClassId = targetClass
        ? Number(String(targetClass.id).replace(/\D/g, "")) || 1
        : 1;

      const cleanSecName = (fullStudent.section || "")
        .replace(/^Section\s*/i, "")
        .trim()
        .toUpperCase();
      let targetSectionId: number | undefined = undefined;

      if (cleanSecName && cleanSecName !== "UNASSIGNED" && targetClass) {
        const secDetail =
          (targetClass as any).sectionDetails?.[cleanSecName] ||
          (targetClass as any).sectionDetails?.[fullStudent.section] ||
          (targetClass as any).sectionDetails?.[`Section ${cleanSecName}`];
        if (secDetail?.id || secDetail?.sectionId) {
          targetSectionId =
            Number(
              String(secDetail.id || secDetail.sectionId).replace(/\D/g, ""),
            ) || undefined;
        } else if (Array.isArray((targetClass as any).sections)) {
          const sObj = (targetClass as any).sections.find(
            (s: any) =>
              typeof s === "object" &&
              s !== null &&
              (s.sectionName || s.name || "")
                .replace(/^Section\s*/i, "")
                .trim()
                .toUpperCase() === cleanSecName,
          );
          if (sObj?.sectionId || sObj?.id) {
            targetSectionId =
              Number(String(sObj.sectionId || sObj.id).replace(/\D/g, "")) ||
              undefined;
          }
        }
      }

      if (
        !targetSectionId &&
        fullStudent.section &&
        fullStudent.section === oldStudent?.section
      ) {
        targetSectionId = (oldStudent as any)?.sectionId;
      }

      const onlySectionOrRoll = Object.keys(updates).every((k) =>
        ["section", "rollNo", "rollNumber"].includes(k),
      );

      // If only section and/or rollNo are changing, allocateStudentApi is the dedicated endpoint.
      // Do NOT invoke updateStudentApi, which requires a full profile payload and validates sectionId references.
      if (onlySectionOrRoll) {
        allocateStudentApi(id, {
          section_letter: cleanSecName || "Unassigned",
          roll_no: fullStudent.rollNo || undefined,
        })
          .then((res: any) => {
            if (res && res.sectionId) {
              setStudents((prev) =>
                prev.map((s) =>
                  s.id === id
                    ? {
                        ...s,
                        sectionId: res.sectionId,
                        section: cleanSecName,
                        rollNo: res.rollNo || fullStudent.rollNo,
                      }
                    : s,
                ),
              );
            }
          })
          .catch((err) => console.warn("Allocation API notice:", err));
        return;
      }

      // If section is explicitly being updated alongside other profile fields, invoke allocateStudentApi
      if (updates.section !== undefined) {
        allocateStudentApi(id, {
          section_letter: cleanSecName || "Unassigned",
          roll_no: fullStudent.rollNo || undefined,
        })
          .then((res: any) => {
            if (res && res.sectionId) {
              (fullStudent as any).sectionId = res.sectionId;
            }
          })
          .catch((err) => console.warn("Allocation API notice:", err));
      }

      const matchedYear = (academicYears || []).find(
        (y: any) =>
          (y.year || y.academicYear) === (fullStudent as any)?.academicYear,
      );
      const targetAcademicYearId = matchedYear
        ? Number(
            String(
              matchedYear.id || (matchedYear as any).academicYearId,
            ).replace(/\D/g, ""),
          )
        : Number((oldStudent as any)?.academicYearId) ||
          Number((fullStudent as any)?.academicYearId) ||
          (academicYears.length > 0
            ? Number(
                String(
                  academicYears[0].id ||
                    (academicYears[0] as any).academicYearId,
                ).replace(/\D/g, ""),
              )
            : 1);

      const studentBranchName = (
        fullStudent.branch ||
        (oldStudent as any)?.branch ||
        selectedBranch ||
        ""
      )
        .trim()
        .toLowerCase();
      const matchedBranch = (branches || []).find(
        (b: any) =>
          (b.name || b.branchName || "").trim().toLowerCase() ===
          studentBranchName,
      );
      const resolvedBranchId =
        Number((oldStudent as any)?.branchId) ||
        Number((fullStudent as any)?.branchId) ||
        (matchedBranch
          ? Number(matchedBranch.id || matchedBranch.branchId)
          : undefined) ||
        (branches.length > 0
          ? Number(branches[0].id || branches[0].branchId)
          : 1);

      updateStudentApi(numericId, {
        admissionNumber:
          fullStudent.admissionNo || (oldStudent as any)?.admissionNo || "",
        rollNumber: fullStudent.rollNo || (oldStudent as any)?.rollNo || "",
        studentName:
          `${fullStudent.firstName || ""} ${fullStudent.lastName || ""}`.trim(),
        dateOfBirth: fullStudent.dob || undefined,
        gender: fullStudent.gender || (oldStudent as any)?.gender || undefined,
        fatherName:
          fullStudent.parentName || (oldStudent as any)?.parentName || "",
        fatherMobile:
          (fullStudent as any).parentPhone ||
          (fullStudent as any).mobile ||
          (oldStudent as any)?.phone ||
          "",
        email: fullStudent.email || (oldStudent as any)?.email || undefined,
        mobileNumber:
          (fullStudent as any).parentPhone ||
          (fullStudent as any).mobile ||
          (oldStudent as any)?.phone ||
          "",
        address: fullStudent.address || (oldStudent as any)?.address || "",
        branchId: resolvedBranchId,
        academicYearId: targetAcademicYearId,
        classId: targetClassId,
        sectionId: targetSectionId,
        status: fullStudent.status || (oldStudent as any)?.status || "Active",
      })
        .then(() => {
          fetchStudents();
        })
        .catch((err) => console.error("Failed to update student", err));
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...updates,
              className: targetClassName,
              casteCategory:
                updates.casteCategory !== undefined
                  ? updates.casteCategory
                  : updates.category !== undefined
                    ? updates.category
                    : s.casteCategory,
              category:
                updates.casteCategory !== undefined
                  ? updates.casteCategory
                  : updates.category !== undefined
                    ? updates.category
                    : s.category,
            }
          : s,
      ),
    );

    if (oldStudent) {
      const admNo =
        oldStudent.admissionNo || (updates as any).admissionNo || "";
      const fullName =
        `${updates.firstName ?? oldStudent.firstName ?? ""} ${updates.lastName ?? oldStudent.lastName ?? ""}`
          .trim()
          .toLowerCase();
      setAdmissions((prev) =>
        prev.map((a) => {
          const isMatch =
            (admNo &&
              (a.admissionNo === admNo ||
                a.applicationNo === admNo ||
                (a as any).registrationNo === admNo)) ||
            (fullName &&
              a.applicantName &&
              a.applicantName.trim().toLowerCase() === fullName);
          if (!isMatch) return a;
          return {
            ...a,
            religion:
              updates.religion !== undefined ? updates.religion : a.religion,
            casteCategory:
              updates.casteCategory !== undefined
                ? updates.casteCategory
                : updates.category !== undefined
                  ? updates.category
                  : a.casteCategory,
            bloodGroup:
              updates.bloodGroup !== undefined
                ? updates.bloodGroup
                : a.bloodGroup,
            gender: (updates.gender as any) || a.gender,
            dob: updates.dob !== undefined ? updates.dob : a.dob,
          };
        }),
      );
    }

    if ((updates as any).feeCalculationMethod || (updates as any).feePolicy) {
      const pol =
        (updates as any).feeCalculationMethod || (updates as any).feePolicy;
      setStudentFeeAssignments((prev) =>
        prev.map((a) => (a.studentId === id ? { ...a, feePolicy: pol } : a)),
      );
    }

    logActivity("Updated Student", `Updated record for ID ${id}`);

    // Dynamic recalculation of Fee Ledger if studentType, class, section, joiningDate, feeCalculationMethod, transport, or hostel details change
    if (
      updates.studentType ||
      updates.className ||
      updates.section ||
      updates.joiningDate ||
      (updates as any).isLateAdmission !== undefined ||
      (updates as any).feeCalculationMethod ||
      (updates as any).feePolicy ||
      updates.transportRequired !== undefined ||
      updates.busRoute ||
      updates.hostelBed !== undefined ||
      updates.hostelBlock
    ) {
      setTimeout(() => recalculateStudentFeeLedger(id), 100);
    }
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setStudentFeeLedgers((prev) => prev.filter((l) => l.studentId !== id));
    logActivity("Deleted Student", `Removed student ID ${id}`);
  };

  const promoteStudent = (
    id: string,
    targetClass: string,
    targetSection = "A",
    targetYear = "",
    targetBranch = "",
  ) => {
    const numericId = parseInt(id, 10);
    const targetStudent = students.find((s) => s.id === id);

    const matchedClass = academicClasses.find(
      (c) =>
        c.name?.toLowerCase().trim() === targetClass.toLowerCase().trim() ||
        c.name?.toLowerCase().replace(/class/gi, "").trim() ===
          targetClass.toLowerCase().replace(/class/gi, "").trim(),
    );
    const resolvedClassId = matchedClass
      ? Number(String(matchedClass.id).replace(/\D/g, "")) || 1
      : 1;

    const cleanSecName = (targetSection || "A")
      .replace(/^Section\s*/i, "")
      .trim()
      .toUpperCase();
    const secDetail =
      (matchedClass as any)?.sectionDetails?.[cleanSecName] ||
      (matchedClass as any)?.sectionDetails?.[targetSection] ||
      (matchedClass as any)?.sectionDetails?.[`Section ${cleanSecName}`];
    let resolvedSectionId =
      secDetail?.id || secDetail?.sectionId
        ? Number(
            String(secDetail.id || secDetail.sectionId).replace(/\D/g, ""),
          ) || undefined
        : undefined;
    // Avoid bogus letterIndex fallback
    if (!resolvedSectionId) {
      resolvedSectionId = (targetStudent as any)?.sectionId || 1;
    }

    const matchedYear = (academicYears || []).find(
      (y: any) => (y.year || y.academicYear) === targetYear,
    );
    const resolvedAcademicYearId = matchedYear
      ? Number(
          String(matchedYear.id || (matchedYear as any).academicYearId).replace(
            /\D/g,
            "",
          ),
        )
      : Number((targetStudent as any)?.academicYearId) ||
        (academicYears.length > 0
          ? Number(
              String(
                academicYears[0].id || (academicYears[0] as any).academicYearId,
              ).replace(/\D/g, ""),
            )
          : 1);

    const studentBranchName = (
      targetBranch ||
      targetStudent?.branch ||
      selectedBranch ||
      ""
    )
      .trim()
      .toLowerCase();
    const matchedBranch = (branches || []).find(
      (b: any) =>
        (b.name || b.branchName || "").trim().toLowerCase() ===
        studentBranchName,
    );
    const resolvedBranchId =
      Number((targetStudent as any)?.branchId) ||
      (matchedBranch
        ? Number(matchedBranch.id || matchedBranch.branchId)
        : undefined) ||
      (branches.length > 0
        ? Number(branches[0].id || branches[0].branchId)
        : 1);

    const isHighest = getHighestClass
      ? targetClass === getHighestClass()
      : false;
    const resolvedStatus = isHighest ? "Completed" : "Active";

    if (!isNaN(numericId) && targetStudent) {
      updateStudentApi(numericId, {
        admissionNumber: targetStudent.admissionNo || "",
        rollNumber: targetStudent.rollNo || "",
        studentName:
          `${targetStudent.firstName || ""} ${targetStudent.lastName || ""}`.trim(),
        dateOfBirth: targetStudent.dob || undefined,
        gender: targetStudent.gender || undefined,
        fatherName: targetStudent.parentName || "",
        fatherMobile:
          (targetStudent as any).parentPhone ||
          (targetStudent as any).mobile ||
          "",
        email: targetStudent.email || undefined,
        mobileNumber:
          (targetStudent as any).parentPhone ||
          (targetStudent as any).mobile ||
          "",
        address: targetStudent.address || "",
        branchId: resolvedBranchId,
        academicYearId: resolvedAcademicYearId,
        classId: resolvedClassId,
        sectionId: resolvedSectionId,
        status: resolvedStatus,
      })
        .then(() => {
          fetchStudents();
        })
        .catch((err) =>
          console.error("Failed to persist promoted student", err),
        );
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const historyItem: PromotionHistoryItem = {
            id: "PROM-" + Date.now().toString().slice(-6),
            fromClass: s.className,
            toClass: targetClass,
            fromSection: s.section,
            toSection: targetSection,
            fromBranch: s.branch || "",
            toBranch: targetBranch,
            academicYear: targetYear,
            date: new Date().toISOString().split("T")[0],
          };
          return {
            ...s,
            className: targetClass,
            section: targetSection,
            branch: targetBranch,
            status: "Promoted",
            promotionHistory: [...(s.promotionHistory || []), historyItem],
          };
        }
        return s;
      }),
    );
    logActivity(
      "Promoted Student",
      `Promoted student ID ${id} to ${targetClass}`,
    );

    setTimeout(() => recalculateStudentFeeLedger(id), 100);
  };

  const transferStudent = (id: string, reason: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "Transferred" } : s)),
    );
    logActivity(
      "Transferred Student",
      `Transferred student ID ${id}. Reason: ${reason}`,
    );
  };

  const getHighestClass = () => {
    if (schoolProfile?.highestClass) {
      return schoolProfile.highestClass;
    }
    if (academicClasses && academicClasses.length > 0) {
      const sorted = [...academicClasses]
        .map((c) => ({
          name: c.name,
          num: parseInt(c.name.replace(/[^0-9]/g, "")) || 0,
        }))
        .sort((a, b) => b.num - a.num);

      if (sorted[0] && sorted[0].num >= 10) {
        return sorted[0].name;
      }
    }
    return "Class 12";
  };

  const addAlumniRecord = (
    record: Omit<AlumniRecord, "id" | "createdDate">,
  ): AlumniRecord => {
    const id = "ALM-" + Math.floor(1000 + Math.random() * 9000);
    const newRecord: AlumniRecord = {
      ...record,
      id,
      createdDate: new Date().toISOString().split("T")[0],
    };
    setAlumniRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateAlumniStatus = (
    id: string,
    currentStatus: AlumniCurrentStatus,
    details?: { higherEducationDetail?: string; organizationCompany?: string },
  ) => {
    setAlumniRecords((prev) =>
      prev.map((a) => {
        if (a.id === id || a.studentId === id) {
          return {
            ...a,
            currentStatus,
            higherEducationDetail:
              details?.higherEducationDetail ?? a.higherEducationDetail,
            organizationCompany:
              details?.organizationCompany ?? a.organizationCompany,
          };
        }
        return a;
      }),
    );
  };

  const completeStudent = (
    id: string,
    completionAcademicYear?: string,
    currentStatus: AlumniCurrentStatus = "Unknown",
  ) => {
    const targetStudent = students.find((s) => s.id === id);
    if (!targetStudent) return;

    const finalYear =
      completionAcademicYear ||
      selectedAcademicYear ||
      schoolProfile.academicYear ||
      "";
    const batchYear =
      finalYear.split("-")[1] ||
      finalYear.split("-")[0] ||
      String(new Date().getFullYear());
    const batchLabel = `Class of ${batchYear}`;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Completed",
              completionDate: new Date().toISOString().split("T")[0],
              completionAcademicYear: finalYear,
            }
          : s,
      ),
    );

    const exists = alumniRecords.find(
      (a) => a.studentId === id || a.admissionNo === targetStudent.admissionNo,
    );
    if (!exists) {
      const newAlumni: AlumniRecord = {
        id: "ALM-" + Math.floor(1000 + Math.random() * 9000),
        studentId: targetStudent.id,
        admissionNo: targetStudent.admissionNo,
        studentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
        avatar: targetStudent.avatar,
        batch: batchLabel,
        completionAcademicYear: finalYear,
        finalClass: targetStudent.className,
        finalSection: targetStudent.section,
        completionDate: new Date().toISOString().split("T")[0],
        currentStatus,
        contactPhone:
          targetStudent.phone ||
          targetStudent.fatherPhone ||
          targetStudent.guardianPhone,
        contactEmail:
          targetStudent.email ||
          targetStudent.fatherEmail ||
          targetStudent.guardianEmail,
        parentName: targetStudent.fatherName || targetStudent.parentName,
        branch: targetStudent.branch || selectedBranch || "",
        createdDate: new Date().toISOString().split("T")[0],
      };
      setAlumniRecords((prev) => [newAlumni, ...prev]);
    }

    logActivity(
      "Completed Education",
      `Student ${targetStudent.firstName} ${targetStudent.lastName} completed ${targetStudent.className} and graduated to Alumni.`,
    );
  };

  const isTeachingStaff = (s: Staff) => {
    const category = (s.employeeCategory || "").toLowerCase();
    const role = (s.role || "").toLowerCase();
    const designation = (s.designation || "").toLowerCase();
    return (
      category.includes("teach") ||
      category.includes("teacher") ||
      role.includes("teach") ||
      role.includes("teacher") ||
      designation.includes("teach") ||
      designation.includes("teacher") ||
      designation.includes("principal") ||
      designation.includes("vice principal") ||
      designation.includes("coordinator") ||
      (s.assignedClasses && s.assignedClasses.length > 0) ||
      (s.assignedSubjects && s.assignedSubjects.length > 0)
    );
  };

  // Staff CRUD
  const syncTeacherAssignments = (teacher: Staff) => {
    const classes = teacher.assignedClasses || [];
    let subjects = teacher.assignedSubjects || [];
    if (subjects.length === 0) {
      if (teacher.primarySubject) subjects = [teacher.primarySubject];
      else if (teacher.specialization) subjects = [teacher.specialization];
    }
    const teacherFullName = (
      teacher.name || `${teacher.firstName} ${teacher.lastName}`
    )
      .replace(/\s*\([^)]*(?:tch|emp|stf|id|\d)[^)]*\)/gi, "")
      .replace(/\s*\([^)]*\)$/, "")
      .trim();

    const norm = (n: string) =>
      n.toLowerCase().replace(/\s+/g, "").replace(/class/gi, "");

    setTeacherAssignments((prev) => {
      // 1. Filter out assignments for this teacher that are no longer in their workload lists
      let next = prev.filter((ta) => {
        if (String(ta.teacherId) !== String(teacher.id)) return true;
        const classSecKey = `${ta.className}-${ta.section}`;
        const hasClass = classes.some((c) => norm(c) === norm(classSecKey));
        const hasSubject =
          subjects.length === 0 ||
          subjects.some((s) => s.toLowerCase() === ta.subject?.toLowerCase());
        return hasClass && hasSubject;
      });

      // 2. Upsert assignments for classes and subjects they are assigned to
      classes.forEach((classSec) => {
        const parts = classSec.split("-");
        const className = parts[0]?.trim();
        const section = parts[1]?.trim() || "A";

        // If teacher is eligible as class teacher, upsert Class Teacher role
        if (
          teacher.isClassTeacherEligible ||
          (teacher.designation &&
            teacher.designation.toLowerCase().includes("class teacher"))
        ) {
          const existingCtIdx = next.findIndex(
            (ta) =>
              norm(ta.className) === norm(className) &&
              ta.section.toLowerCase() === section.toLowerCase() &&
              ta.role === "Class Teacher",
          );
          if (existingCtIdx > -1) {
            next[existingCtIdx] = {
              ...next[existingCtIdx],
              teacherId: String(teacher.id),
              teacherName: teacherFullName,
              status: "Active",
            };
          } else {
            next.push({
              id: "TA-" + Math.floor(100 + Math.random() * 900),
              academicYear: selectedAcademicYear || "",
              branch: teacher.branch || selectedBranch || "",
              className,
              section,
              subject: "",
              teacherId: String(teacher.id),
              teacherName: teacherFullName,
              role: "Class Teacher",
              status: "Active",
            });
          }
        }

        subjects.forEach((subject) => {
          const existingIdx = next.findIndex(
            (ta) =>
              norm(ta.className) === norm(className) &&
              ta.section.toLowerCase() === section.toLowerCase() &&
              ta.subject?.toLowerCase() === subject.toLowerCase(),
          );

          if (existingIdx > -1) {
            next[existingIdx] = {
              ...next[existingIdx],
              teacherId: String(teacher.id),
              teacherName: teacherFullName,
              status: "Active",
            };
          } else {
            const taId = "TA-" + Math.floor(100 + Math.random() * 900);
            next.push({
              id: taId,
              academicYear: selectedAcademicYear || "",
              branch: teacher.branch || selectedBranch || "",
              className,
              section,
              subject,
              teacherId: String(teacher.id),
              teacherName: teacherFullName,
              role: "Subject Teacher",
              status: "Active",
            });
          }
        });
      });

      return next;
    });

    // 3. Update academicClasses state with sectionTeachers map & auto-mapped subjects and weeklyPeriods
    setAcademicClasses((prevClasses) => {
      const nextClasses = prevClasses.map((cls) => {
        const matchingClassSecs = classes.filter((cs) => {
          const [cName] = cs.split("-");
          return norm(cName) === norm(cls.name);
        });

        if (matchingClassSecs.length > 0) {
          const currentSecTeachers = { ...(cls.sectionTeachers || {}) };
          matchingClassSecs.forEach((cs) => {
            const parts = cs.split("-");
            const secLetter = parts[1]?.trim() || "A";
            if (
              teacher.isClassTeacherEligible ||
              !currentSecTeachers[secLetter]
            ) {
              currentSecTeachers[secLetter] = teacherFullName;
            }
          });

          // Also ensure subjects are added to this class
          const existingSubjects = [...(cls.subjects || [])];
          const existingWeeklyPeriods = { ...(cls.weeklyPeriods || {}) };
          let subjectsChanged = false;

          subjects.forEach((subject) => {
            if (
              !existingSubjects.some(
                (s) => s.toLowerCase() === subject.toLowerCase(),
              )
            ) {
              existingSubjects.push(subject);
              subjectsChanged = true;
            }
            if (!existingWeeklyPeriods[subject]) {
              existingWeeklyPeriods[subject] = 5;
            }
          });

          return {
            ...cls,
            sectionTeachers: currentSecTeachers,
            subjects: existingSubjects,
            weeklyPeriods: existingWeeklyPeriods,
          };
        }
        return cls;
      });

      localStorage.setItem(
        "edu_db_academic_classes",
        JSON.stringify(nextClasses),
      );
      return nextClasses;
    });

    // 4. Auto-map subjects to backend API for each assigned class
    classes.forEach((classSec) => {
      const parts = classSec.split("-");
      const className = parts[0]?.trim();
      const secLetter = parts[1]?.trim() || "A";

      const classObj = academicClasses.find(
        (c) => norm(c.name) === norm(className),
      );
      if (classObj) {
        subjects.forEach((subject) => {
          const wp = classObj.weeklyPeriods?.[subject] || 5;
          mapSubjectApi(classObj.id, {
            subject_name: subject,
            weekly_periods: wp,
          }).catch((err) => {
            console.error(
              `Failed to map subject "${subject}" to class "${classObj.name}":`,
              err,
            );
          });

          assignTeacherApi(classObj.id, secLetter, {
            teacher_id: String(teacher.id),
            role: "Subject Teacher",
            subject_name: subject,
          }).catch(() => {
            // Non-blocking fallback
          });
        });

        if (
          teacher.isClassTeacherEligible ||
          (teacher.designation &&
            teacher.designation.toLowerCase().includes("class teacher"))
        ) {
          assignTeacherApi(classObj.id, secLetter, {
            teacher_id: String(teacher.id),
            role: "Class Teacher",
          }).catch(() => {
            // Non-blocking fallback
          });
        }
      }
    });
  };

  const addStaff = (staffData: Omit<Staff, "id">): Staff => {
    let assignedEmpId = (staffData.empId || "").trim();
    const isTaken =
      assignedEmpId &&
      staff.some((s) => {
        const existingId = (s.empId || (s as any).employeeId || "")
          .trim()
          .toLowerCase();
        return existingId === assignedEmpId.toLowerCase();
      });
    if (!assignedEmpId || isTaken) {
      assignedEmpId = generateNextEmployeeId(staff, staffData.employeeCategory);
    }
    const id = assignedEmpId;
    const newStaff: Staff = {
      ...staffData,
      id,
      empId: assignedEmpId,
      status: staffData.status || "Active",
      branch: staffData.branch || selectedBranch || "",
      profileStatus: staffData.profileStatus || "Incomplete",
    };

    createStaffApi({
      employeeId: assignedEmpId,
      isActive: staffData.status === "Active" || staffData.status === undefined,
      employeeCategory:
        staffData.employeeCategory === "Teacher"
          ? "Teaching Staff"
          : "Non-Teaching Staff",
      firstName: staffData.firstName,
      middleName: staffData.middleName || "",
      lastName: staffData.lastName,
      email: staffData.email?.trim() || null,
      phone: staffData.phone,
      alternateMobile: (() => {
        const alt =
          staffData.alternateMobile ||
          (staffData as any).alternateMobileNumber ||
          (staffData as any).alternatePhone ||
          "";
        const digits = String(alt).replace(/\D/g, "");
        return digits.length >= 5 ? String(alt).trim() : null;
      })(),
      gender: staffData.gender || "Male",
      designation: staffData.designation,
      department: staffData.department,
      systemRole: staffData.role,
      joiningDate: staffData.joiningDate,
      qualification: staffData.qualification || "",
      employmentType: staffData.employmentType,
      monthlySalary: staffData.salary || 0,
      dateOfBirth: staffData.dob,
      bloodGroup: staffData.bloodGroup,
      aadhaarNumber: staffData.aadhaarNumber || null,
      panNumber:
        staffData.panNumber ||
        (staffData as any).panNo ||
        (staffData as any).pan ||
        null,
      presentAddress: staffData.presentAddress || null,
      permanentAddress: staffData.permanentAddress || null,
      city: staffData.city || null,
      state: staffData.state || null,
      pinCode: staffData.pinCode || null,
      country: staffData.country || "India",
      accountHolderName: staffData.bankDetails?.accountHolderName || "",
      accountNumber: staffData.bankDetails?.accountNumber || "",
      bankName: staffData.bankDetails?.bankName || "",
      branchName:
        staffData.branch ||
        selectedBranch ||
        staffData.bankDetails?.branch ||
        "",
      ifscCode: staffData.bankDetails?.ifscCode || "",
      upiId: staffData.bankDetails?.upiId || "",
      assignedClasses: staffData.assignedClasses || [],
      assignedSubjects: staffData.assignedSubjects || [],
      qualifications: (staffData.qualifications || []).map((q: any) => ({
        qualificationDegree: q.qualification || q.qualificationDegree || "",
        specializationSubject:
          q.specialization || q.specializationSubject || "",
        institutionCollege: q.institution || q.institutionCollege || "",
        boardUniversity: q.boardUniversity || q.university || "",
        passingYear: (q.passingYear || q.year || "").toString(),
        percentageCgpa: (q.percentageCgpa || q.percentage || "").toString(),
      })),
      experienceRecords: (staffData.experienceRecords || []).map((e: any) => ({
        previousOrganization:
          e.previousOrganization || e.school || e.organization || "",
        designationHeld: e.designationHeld || e.designation || e.role || "",
        fromDate: e.fromDate || null,
        toDate: e.toDate || null,
        totalExperience: e.totalExperience || "",
        reasonForLeaving: e.reasonForLeaving || "",
      })),
      documents: (staffData.documents || []).map((d: any) => ({
        documentTitle: d.title || d.fileName || d.name || "",
        documentType:
          d.documentType || d.docType || d.type || d.title || "Document",
        fileUrl: d.fileUrl || "",
        isRequired: d.isRequired ?? true,
        status: d.status || "Attached",
        uploadedAt:
          d.uploadedAt ||
          d.uploadDate ||
          d.uploadedDate ||
          new Date().toISOString(),
      })),
    })
      .then((response) => {
        if (response && response.success && response.data) {
          const actualId =
            response.data.staffId?.toString() ||
            response.data.id?.toString() ||
            newStaff.id;
          setStaff((prev) =>
            prev.map((s) =>
              s.empId === newStaff.empId
                ? {
                    ...s,
                    id: actualId,
                  }
                : s,
            ),
          );
          // Sync actual ID as well if it changed from generated fake ID
          if (isTeachingStaff(newStaff)) {
            syncTeacherAssignments({ ...newStaff, id: actualId });
          }
          fetchAcademicClasses();
        }
      })
      .catch((err) => {
        console.error("Failed to create staff in backend", err);
      });

    // Auto-generate and issue Official Offer & Appointment letter
    try {
      const offerLetter = createStaffLetterRecord(
        "offer",
        newStaff,
        schoolProfile,
        newStaff.joiningDate,
      );
      saveStaffLetterRecord(offerLetter);
      const offerDoc: StaffDocument = {
        id: `DOC-LTR-${Date.now()}`,
        title: `Offer & Appointment Letter (${offerLetter.letterNumber})`,
        type: "Appointment Letter",
        fileUrl: "",
        uploadedDate:
          offerLetter.issueDate || new Date().toISOString().split("T")[0],
        documentNumber: offerLetter.letterNumber,
        verificationStatus: "Verified",
        category: "Institutional Letters",
      };
      newStaff.documents = [offerDoc, ...(newStaff.documents || [])];
    } catch (e) {
      console.warn("Failed to auto-issue offer letter on addStaff:", e);
    }

    setStaff((prev) => [...prev, newStaff]);
    logActivity(
      "Hired Staff Member",
      `Registered ${newStaff.firstName} ${newStaff.lastName}`,
    );

    if (isTeachingStaff(newStaff)) {
      syncTeacherAssignments(newStaff);
    }

    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    if (updates.empId) {
      const trimmedTarget = updates.empId.trim().toLowerCase();
      const conflict = staff.find(
        (s) =>
          String(s.id) !== String(id) &&
          (s.empId || (s as any).employeeId || "").trim().toLowerCase() ===
            trimmedTarget,
      );
      if (conflict) {
        console.warn(
          "Cannot update staff: Employee ID already exists:",
          updates.empId,
        );
        const { empId, ...safeUpdates } = updates;
        updates = safeUpdates;
      }
    }
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const existing = staff.find((s) => s.id === id);
      if (existing) {
        const fullStaff = { ...existing, ...updates };
        updateStaffApi(numericId, {
          employeeId: fullStaff.empId,
          employeeCategory:
            fullStaff.employeeCategory === "Teacher"
              ? "Teaching Staff"
              : "Non-Teaching Staff",
          firstName: fullStaff.firstName,
          middleName: fullStaff.middleName || "",
          lastName: fullStaff.lastName,
          email: fullStaff.email?.trim() || null,
          phone: fullStaff.phone,
          alternateMobile: (() => {
            const alt =
              fullStaff.alternateMobile ||
              (fullStaff as any).alternateMobileNumber ||
              (fullStaff as any).alternatePhone ||
              "";
            const digits = String(alt).replace(/\D/g, "");
            return digits.length >= 5 ? String(alt).trim() : null;
          })(),
          gender: fullStaff.gender || "Male",
          designation: fullStaff.designation,
          department: fullStaff.department,
          systemRole: fullStaff.role,
          joiningDate: fullStaff.joiningDate,
          qualification: fullStaff.qualification || "",
          employmentType: fullStaff.employmentType,
          monthlySalary: fullStaff.salary || 0,
          dateOfBirth: fullStaff.dob,
          bloodGroup: fullStaff.bloodGroup,
          aadhaarNumber: fullStaff.aadhaarNumber || null,
          panNumber:
            fullStaff.panNumber ||
            (fullStaff as any).panNo ||
            (fullStaff as any).pan ||
            null,
          presentAddress: fullStaff.presentAddress || null,
          permanentAddress: fullStaff.permanentAddress || null,
          city: fullStaff.city || null,
          state: fullStaff.state || null,
          pinCode: fullStaff.pinCode || null,
          country: fullStaff.country || "India",
          accountHolderName: fullStaff.bankDetails?.accountHolderName || "",
          accountNumber: fullStaff.bankDetails?.accountNumber || "",
          bankName: fullStaff.bankDetails?.bankName || "",
          branchName: fullStaff.branch || fullStaff.bankDetails?.branch || "",
          ifscCode: fullStaff.bankDetails?.ifscCode || "",
          upiId: fullStaff.bankDetails?.upiId || "",
          isActive: fullStaff.status === "Active",
          assignedClasses: fullStaff.assignedClasses || [],
          assignedSubjects: fullStaff.assignedSubjects || [],
          qualifications: (fullStaff.qualifications || []).map((q: any) => ({
            qualificationDegree: q.qualification || q.qualificationDegree || "",
            specializationSubject:
              q.specialization || q.specializationSubject || "",
            institutionCollege: q.institution || q.institutionCollege || "",
            boardUniversity: q.boardUniversity || q.university || "",
            passingYear: (q.passingYear || q.year || "").toString(),
            percentageCgpa: (q.percentageCgpa || q.percentage || "").toString(),
          })),
          experienceRecords: (fullStaff.experienceRecords || []).map(
            (e: any) => ({
              previousOrganization:
                e.previousOrganization || e.school || e.organization || "",
              designationHeld:
                e.designationHeld || e.designation || e.role || "",
              fromDate: e.fromDate || null,
              toDate: e.toDate || null,
              totalExperience: e.totalExperience || "",
              reasonForLeaving: e.reasonForLeaving || "",
            }),
          ),
          documents: (fullStaff.documents || []).map((d: any) => ({
            documentTitle: d.title || d.fileName || d.name || "",
            documentType:
              d.documentType || d.docType || d.type || d.title || "Document",
            fileUrl: d.fileUrl || "",
            isRequired: d.isRequired ?? true,
            status: d.status || "Attached",
            uploadedAt:
              d.uploadedAt ||
              d.uploadDate ||
              d.uploadedDate ||
              new Date().toISOString(),
          })),
        })
          .then(() => {
            fetchAcademicClasses();
          })
          .catch((err) => {
            console.error("Failed to update staff in backend", err);
          });
      }
    }

    setStaff((prev) => {
      const nextStaff = prev.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      );
      const updated = nextStaff.find((s) => s.id === id);
      if (updated && isTeachingStaff(updated)) {
        syncTeacherAssignments(updated);
      }
      return nextStaff;
    });

    // Synchronize updates to Transport Driver and Bus Attendant records if this staff member is a Driver or Attendant
    const existingStaffMember = staff.find((s) => s.id === id);
    const targetEmpId = (
      updates.empId ||
      existingStaffMember?.empId ||
      (existingStaffMember as any)?.employeeId ||
      ""
    )
      .trim()
      .toLowerCase();
    const targetFullName =
      `${updates.firstName || existingStaffMember?.firstName || ""} ${updates.lastName || existingStaffMember?.lastName || ""}`.trim();
    const newPhone = updates.phone || (updates as any).mobileNumber;

    if (
      newPhone ||
      updates.firstName ||
      updates.lastName ||
      updates.status ||
      updates.presentAddress
    ) {
      setDriverMasters((prevDrivers) =>
        prevDrivers.map((d) => {
          const dEmp = (d.employeeId || "").trim().toLowerCase();
          const match =
            (targetEmpId && dEmp && dEmp === targetEmpId) ||
            String(d.id) === String(id) ||
            (targetFullName &&
              d.driverName.trim().toLowerCase() ===
                targetFullName.toLowerCase());

          if (match) {
            return {
              ...d,
              ...(newPhone ? { mobileNumber: newPhone } : {}),
              ...(targetFullName ? { driverName: targetFullName } : {}),
              ...(updates.presentAddress
                ? { address: updates.presentAddress }
                : {}),
              ...(updates.status
                ? {
                    status: updates.status === "Active" ? "Active" : "Inactive",
                  }
                : {}),
            };
          }
          return d;
        }),
      );

      setBusAttendants((prevAttendants) =>
        prevAttendants.map((a) => {
          const aEmp = (a.employeeId || "").trim().toLowerCase();
          const match =
            (targetEmpId && aEmp && aEmp === targetEmpId) ||
            String(a.id) === String(id) ||
            (targetFullName &&
              a.attendantName.trim().toLowerCase() ===
                targetFullName.toLowerCase());

          if (match) {
            return {
              ...a,
              ...(newPhone ? { mobileNumber: newPhone } : {}),
              ...(targetFullName ? { attendantName: targetFullName } : {}),
              ...(updates.gender ? { gender: updates.gender as any } : {}),
              ...(updates.status
                ? {
                    status: updates.status === "Active" ? "Active" : "Inactive",
                  }
                : {}),
            };
          }
          return a;
        }),
      );
    }
    logActivity("Updated Staff Record", `Updated details for staff ID ${id}`);
  };

  const deleteStaff = async (id: string) => {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      try {
        const response = await deleteStaffApi(numericId);
        if (response && response.success) {
          setStaff((prev) => prev.filter((s) => s.id !== id));
          setTeacherAssignments((prev) =>
            prev.filter((ta) => ta.teacherId !== id),
          );
          logActivity("Terminated Staff Record", `Removed staff ID ${id}`);
          addToast("success", "Staff member deleted successfully.");
        } else {
          addToast(
            "error",
            "Failed to delete staff",
            response.message || "An unknown error occurred.",
          );
        }
      } catch (err: any) {
        console.error("Failed to delete staff in backend", err);
        addToast(
          "error",
          "Failed to delete staff",
          err.message || "An error occurred while deleting staff.",
        );
      }
    } else {
      // Local/mock staff deletion
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setTeacherAssignments((prev) => prev.filter((ta) => ta.teacherId !== id));
      addToast("success", "Local staff member removed.");
    }
  };

  const addStaffDocument = (
    staffId: string,
    docData: Omit<StaffDocument, "id">,
  ) => {
    const newDoc: StaffDocument = {
      ...docData,
      id: "DOC-" + Date.now().toString().slice(-6),
    };
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, documents: [...(s.documents || []), newDoc] }
          : s,
      ),
    );
  };

  const deleteStaffDocument = (staffId: string, docId: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              documents: (s.documents || []).filter((d) => d.id !== docId),
            }
          : s,
      ),
    );
  };

  const updateBankDetails = (staffId: string, bankDetails: BankDetails) => {
    const numericId = parseInt(staffId, 10);
    if (!isNaN(numericId)) {
      const existing = staff.find((s) => s.id === staffId);
      if (existing) {
        const fullStaff = { ...existing, bankDetails };
        updateStaffApi(numericId, {
          employeeId: fullStaff.empId,
          employeeCategory:
            fullStaff.employeeCategory === "Teacher"
              ? "Teaching Staff"
              : "Non-Teaching Staff",
          firstName: fullStaff.firstName,
          lastName: fullStaff.lastName,
          email: fullStaff.email,
          phone: fullStaff.phone,
          gender: fullStaff.gender || "Male",
          designation: fullStaff.designation,
          department: fullStaff.department,
          systemRole: fullStaff.role,
          joiningDate: fullStaff.joiningDate,
          qualification: fullStaff.qualification || "",
          monthlySalary: fullStaff.salary || 0,
          accountHolderName: bankDetails.accountHolderName || "",
          accountNumber: bankDetails.accountNumber || "",
          bankName: bankDetails.bankName || "",
          branchName: bankDetails.branch || "",
          ifscCode: bankDetails.ifscCode || "",
          upiId: bankDetails.upiId || "",
        }).catch((err) => {
          console.error("Failed to update bank details in backend", err);
        });
      }
    }

    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, bankDetails } : s)),
    );
  };

  // DOCUMENT REQUIREMENT RULES MASTER MANAGEMENT
  const [documentRequirementRules, setDocumentRequirementRules] = useState<
    DocumentRequirementRule[]
  >([
    {
      id: "DOC-RULE-01",
      department: "Transport",
      designation: "Driver",
      requiredDocTypes: [
        "Aadhaar Card",
        "PAN Card",
        "Driving License",
        "Medical Certificate",
        "Police Verification",
        "Bank Passbook",
      ],
      status: "Active",
    },
    {
      id: "DOC-RULE-02",
      department: "Transport",
      designation: "Bus Attendant",
      requiredDocTypes: [
        "Aadhaar Card",
        "Medical Certificate",
        "Police Verification",
      ],
      status: "Active",
    },
    {
      id: "DOC-RULE-03",
      department: "Hostel",
      designation: "Hostel Warden",
      requiredDocTypes: ["Aadhaar Card", "PAN Card", "Police Verification"],
      status: "Active",
    },
    {
      id: "DOC-RULE-04",
      department: "Finance & Accounts",
      designation: "Accountant",
      requiredDocTypes: ["Aadhaar Card", "PAN Card", "Bank Passbook"],
      status: "Active",
    },
    {
      id: "DOC-RULE-05",
      department: "Administration",
      designation: "Receptionist",
      requiredDocTypes: ["Aadhaar Card", "PAN Card"],
      status: "Active",
    },
    {
      id: "DOC-RULE-06",
      department: "Housekeeping",
      designation: "Cleaner",
      requiredDocTypes: ["Aadhaar Card"],
      status: "Active",
    },
    {
      id: "DOC-RULE-07",
      department: "Security",
      designation: "Security Guard",
      requiredDocTypes: [
        "Aadhaar Card",
        "Police Verification",
        "Medical Certificate",
      ],
      status: "Active",
    },
    {
      id: "DOC-RULE-08",
      department: "Library",
      designation: "Librarian",
      requiredDocTypes: ["Aadhaar Card", "Degree Certificate"],
      status: "Active",
    },
    {
      id: "DOC-RULE-09",
      department: "Mathematics",
      designation: "Subject Teacher",
      requiredDocTypes: [
        "Aadhaar Card",
        "PAN Card",
        "Degree Certificate",
        "B.Ed.",
        "Experience Letter",
      ],
      status: "Active",
    },
  ]);

  const getRequiredDocuments = (
    department?: string,
    designation?: string,
  ): string[] => {
    if (!department || !designation) return ["Aadhaar Card", "PAN Card"];

    const exact = documentRequirementRules.find(
      (r) =>
        r.status === "Active" &&
        r.department.toLowerCase() === department.toLowerCase() &&
        r.designation.toLowerCase() === designation.toLowerCase(),
    );
    if (exact) return exact.requiredDocTypes;

    const deptMatch = documentRequirementRules.find(
      (r) =>
        r.status === "Active" &&
        r.department.toLowerCase() === department.toLowerCase() &&
        (r.designation === "All" || r.designation.toLowerCase() === "all"),
    );
    if (deptMatch) return deptMatch.requiredDocTypes;

    const desigLower = designation.toLowerCase();
    const deptLower = department.toLowerCase();

    if (desigLower.includes("driver")) {
      return [
        "Aadhaar Card",
        "PAN Card",
        "Driving License",
        "Medical Certificate",
        "Police Verification",
        "Bank Passbook",
      ];
    }
    if (desigLower.includes("attendant") || desigLower.includes("conductor")) {
      return ["Aadhaar Card", "Medical Certificate", "Police Verification"];
    }
    if (desigLower.includes("warden")) {
      return ["Aadhaar Card", "PAN Card", "Police Verification"];
    }
    if (
      desigLower.includes("accountant") ||
      desigLower.includes("cashier") ||
      desigLower.includes("billing")
    ) {
      return ["Aadhaar Card", "PAN Card", "Bank Passbook"];
    }
    if (desigLower.includes("receptionist")) {
      return ["Aadhaar Card", "PAN Card"];
    }
    if (desigLower.includes("security") || desigLower.includes("guard")) {
      return ["Aadhaar Card", "Police Verification", "Medical Certificate"];
    }
    if (desigLower.includes("cleaner") || desigLower.includes("housekeeping")) {
      return ["Aadhaar Card"];
    }
    if (desigLower.includes("librarian")) {
      return ["Aadhaar Card", "Degree Certificate"];
    }

    const isTeaching =
      desigLower.includes("teacher") ||
      desigLower.includes("hod") ||
      desigLower.includes("coordinator") ||
      [
        "mathematics",
        "science",
        "english",
        "social science",
        "languages",
        "computer science / ict",
        "commerce",
        "humanities",
        "fine arts",
        "performing arts",
        "physical education",
        "pre-primary",
      ].includes(deptLower);

    if (isTeaching) {
      return [
        "Aadhaar Card",
        "PAN Card",
        "Degree Certificate",
        "B.Ed.",
        "Experience Letter",
      ];
    }

    return ["Aadhaar Card", "PAN Card"];
  };

  const addDocumentRequirementRule = (
    ruleData: Omit<DocumentRequirementRule, "id">,
  ) => {
    const id = "DOC-RULE-" + Math.floor(10 + Math.random() * 90);
    const newRule: DocumentRequirementRule = {
      ...ruleData,
      id,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setDocumentRequirementRules((prev) => [newRule, ...prev]);
    logActivity(
      "Created Document Requirement Rule",
      `Configured requirements for ${newRule.department} -> ${newRule.designation}`,
    );
  };

  const updateDocumentRequirementRule = (
    id: string,
    updates: Partial<DocumentRequirementRule>,
  ) => {
    setDocumentRequirementRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...updates,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : r,
      ),
    );
    logActivity("Updated Document Requirement Rule", `Updated rule ID ${id}`);
  };

  const deleteDocumentRequirementRule = (id: string) => {
    setDocumentRequirementRules((prev) => prev.filter((r) => r.id !== id));
    logActivity("Deleted Document Requirement Rule", `Removed rule ID ${id}`);
  };

  const verifyStaffDocument = (
    staffId: string,
    docId: string,
    status: "Pending Verification" | "Verified" | "Rejected",
    remarks?: string,
  ) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        return {
          ...s,
          documents: (s.documents || []).map((d) => {
            if (d.id !== docId) return d;
            return {
              ...d,
              verificationStatus: status,
              remarks: remarks !== undefined ? remarks : d.remarks,
            };
          }),
        };
      }),
    );
    logActivity(
      "Verified Staff Document",
      `Updated document status to ${status} for staff ID ${staffId}`,
    );
  };

  const replaceStaffDocument = (
    staffId: string,
    docId: string,
    newFileUrl: string,
    replacedBy = "HR Admin",
    remarks?: string,
  ) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        return {
          ...s,
          documents: (s.documents || []).map((d) => {
            if (d.id !== docId) return d;
            const currentVersion = d.versionHistory?.length
              ? Math.max(...d.versionHistory.map((v) => v.version)) + 1
              : 2;
            const oldVersionItem = {
              version: currentVersion - 1,
              fileUrl: d.fileUrl,
              replacedDate: new Date().toISOString().split("T")[0],
              replacedBy,
            };
            return {
              ...d,
              fileUrl: newFileUrl,
              uploadedDate: new Date().toISOString().split("T")[0],
              verificationStatus: "Pending Verification",
              remarks: remarks !== undefined ? remarks : d.remarks,
              versionHistory: [
                ...(d.versionHistory || [oldVersionItem]),
                {
                  version: currentVersion,
                  fileUrl: newFileUrl,
                  replacedDate: new Date().toISOString().split("T")[0],
                  replacedBy,
                },
              ],
            };
          }),
        };
      }),
    );
    logActivity(
      "Replaced Staff Document",
      `Uploaded new version of document for staff ID ${staffId}`,
    );
  };

  // Admission CRUD
  const inFlightAdmissionSubmissions = new Set<string>();
  const inFlightStatusUpdates = new Set<string>();

  const addAdmission = async (
    appData: Omit<AdmissionApplication, "id" | "applicationNo">,
    options?: { silent?: boolean },
  ) => {
    const signature = `${(appData.applicantName || "").toLowerCase().trim()}_${(appData.phone || "").trim()}_${(appData.appliedClass || "").toLowerCase().trim()}`;
    if (signature.length > 5 && inFlightAdmissionSubmissions.has(signature)) {
      console.warn(
        `[addAdmission] Duplicate submission blocked for signature: ${signature}`,
      );
      return null;
    }
    if (signature.length > 5) inFlightAdmissionSubmissions.add(signature);

    try {
      if (appData.dob) {
        const ageRes = validateStudentAge({
          dateOfBirth: appData.dob,
          dateOfAdmission:
            (appData as any).admissionDate ||
            (appData as any).joiningDate ||
            new Date().toISOString().split("T")[0],
          className: appData.appliedClass,
          academicClasses,
        });
        if (!ageRes.isValid) {
          inFlightAdmissionSubmissions.delete(signature);
          throw new Error(ageRes.message || "Age eligibility check failed.");
        }
      }

      let isoDob = new Date().toISOString();
      if (appData.dob) {
        if ((appData.dob as any) instanceof Date) {
          if (!isNaN((appData.dob as any).getTime()))
            isoDob = (appData.dob as any).toISOString();
        } else if (typeof appData.dob === "number") {
          const utcDays = Math.floor(appData.dob - 25569);
          const parsed = new Date(utcDays * 86400 * 1000);
          if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
        } else {
          const dobStr = String(appData.dob).trim();
          if (dobStr.includes("/")) {
            const parts = dobStr.split("/");
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                const parsed = new Date(
                  `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}T00:00:00Z`,
                );
                if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
              } else {
                const parsed = new Date(
                  `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T00:00:00Z`,
                );
                if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
              }
            }
          } else if (dobStr.includes("-")) {
            const parts = dobStr.split("-");
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                const parsed = new Date(
                  `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}T00:00:00Z`,
                );
                if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
              } else {
                const parsed = new Date(
                  `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T00:00:00Z`,
                );
                if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
              }
            }
          } else {
            const parsed = new Date(dobStr);
            if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
          }
        }
      }

      const matchedClass = academicClasses.find(
        (c) =>
          c.name?.toLowerCase().trim() ===
          appData.appliedClass?.toLowerCase().trim(),
      );
      const appliedClassId = matchedClass
        ? Number(String(matchedClass.id).replace(/\D/g, ""))
        : 1;

      let maxRegSeq = 1000;
      admissions.forEach((a) => {
        const regStr = a.registrationNo || a.applicationNo || "";
        if (regStr.toUpperCase().startsWith("REG-")) {
          const m = regStr.match(/\d+/);
          if (m) {
            const num = parseInt(m[0], 10);
            if (!isNaN(num) && num > maxRegSeq) maxRegSeq = num;
          }
        }
      });
      const customProvidedRegNo =
        (appData as any).registrationNo || (appData as any).applicationNo;
      const generatedRegNo = customProvidedRegNo
        ? String(customProvidedRegNo).trim()
        : "";

      const payload: any = {
        registrationNo: generatedRegNo || undefined,
        applicationNo: generatedRegNo || undefined,
        applicantFullName: appData.applicantName || "",
        appliedClass: appData.appliedClass || "",
        appliedClassId: appliedClassId,
        AppliedClassId: appliedClassId,
        gender: appData.gender || "",
        dob: isoDob,
        bloodGroup: appData.bloodGroup || "O+",
        religion: appData.religion || "General",
        casteCategory: appData.casteCategory || "General",
        fatherFullName: appData.parentName || "",
        motherFullName: appData.motherName || "",
        fatherMobileNo: appData.phone || "",
        motherMobileNumber:
          (appData as any).motherPhone ||
          (appData as any).motherMobileNumber ||
          "",
        alternateMobileNumber:
          (appData as any).alternatePhone ||
          (appData as any).alternateMobileNumber ||
          "",
        email: appData.email || (appData as any).parentEmail || "",
        parentEmail: appData.email || (appData as any).parentEmail || "",
        houseNo: appData.addressHouseNo || "",
        street: appData.addressStreet || "",
        areaLocality: appData.addressArea || "",
        city: appData.addressCity || "",
        district: appData.addressDistrict || "",
        state: appData.addressState || "",
        pinCode: appData.addressPinCode || "",
        numberOfSiblings: appData.siblingsCount || 0,
        siblingStudentId: "N/A",
        studentType: normalizeStudentType(appData.studentType),
        transportRequired: !!appData.transportRequired,
        transportType: appData.transportRequired
          ? appData.transportType || "AC"
          : "",
        busRoute: appData.transportRequired ? appData.busRoute || "" : "",
        pickupPoint: appData.transportRequired ? appData.pickupPoint || "" : "",
        dropPoint: appData.transportRequired ? appData.dropPoint || "" : "",
        hostelBlock:
          normalizeStudentType(appData.studentType) === "Residential"
            ? appData.hostelBlock || ""
            : "",
        hostelRoom:
          normalizeStudentType(appData.studentType) === "Residential"
            ? appData.hostelRoom || ""
            : "",
        floorLevel: "N/A",
        allocatedBedId:
          normalizeStudentType(appData.studentType) === "Residential"
            ? appData.hostelBed || ""
            : "",
        hostelSecurityDepositPaid: Boolean(appData.hostelSecurityDepositPaid),
        securityDepositAmount: Number(appData.securityDepositAmount) || 0,
        securityDepositReceiptNo: appData.securityDepositReceiptNo || "",
        securityDepositPaymentMode: appData.securityDepositPaymentMode || "",
        securityDepositTxnId: appData.securityDepositTxnId || "",
        securityDepositDate: appData.securityDepositDate || "",
        branch: appData.branch || selectedBranch || "",
        status: appData.status || "Enrolled",
        section: (appData as any).section || "",
        academicYear:
          (appData as any).academicYear || selectedAcademicYear || "",
        avatar: appData.avatar || "",
        scholarship: appData.scholarshipId || "None",
        scholarshipId: appData.scholarshipId || "",
        discount: appData.discountId || "None",
        discountId: appData.discountId || "",
        selectedOptionalFees: appData.selectedOptionalFees || [],
      };

      const json = await createAdmissionApi(payload);

      const resolvedStatus = appData.status || json?.data?.status || "Pending";
      const assignedRegNo =
        json?.data?.registrationNo || generatedRegNo || `REG-${maxRegSeq + 1}`;
      const assignedAdmNo =
        json?.data?.admissionNo ||
        json?.data?.admissionNumber ||
        (appData as any).admissionNo ||
        "";
      const effectiveAppNo =
        resolvedStatus === "Enrolled" && assignedAdmNo
          ? assignedAdmNo
          : assignedRegNo || "ADM-" + Date.now();

      const createdApp: AdmissionApplication = {
        id:
          json?.data?.applicationId?.toString() ||
          json?.data?.id?.toString() ||
          "ADM-" + Date.now(),
        applicationNo: effectiveAppNo,
        registrationNo: assignedRegNo,
        admissionNo: assignedAdmNo,
        applicantName: appData.applicantName,
        appliedClass: appData.appliedClass,
        gender: appData.gender || "Male",
        dob: appData.dob || "",
        bloodGroup: appData.bloodGroup || "O+",
        religion: appData.religion || "General",
        casteCategory: appData.casteCategory || "General",
        parentName: appData.parentName,
        motherName: appData.motherName || "N/A",
        phone: appData.phone,
        email: appData.email || "",
        addressHouseNo: appData.addressHouseNo,
        addressStreet: appData.addressStreet,
        addressArea: appData.addressArea,
        addressCity: appData.addressCity,
        addressDistrict: appData.addressDistrict,
        addressState: appData.addressState,
        addressPinCode: appData.addressPinCode,
        hasSiblings: appData.hasSiblings,
        siblingsCount: appData.siblingsCount || 0,
        siblingDetails: appData.siblingDetails || [],
        siblingStudentId: appData.siblingStudentId || "",
        siblingStudentIds: appData.siblingStudentIds || [],
        studentType: normalizeStudentType(appData.studentType),
        transportRequired: appData.transportRequired,
        transportType: appData.transportType,
        busRoute: appData.busRoute,
        pickupPoint: appData.pickupPoint,
        dropPoint: appData.dropPoint,
        hostelBlock: appData.hostelBlock,
        floor: appData.floor,
        hostelRoom: appData.hostelRoom,
        hostelBed: appData.hostelBed,
        hostelSecurityDepositPaid: Boolean(appData.hostelSecurityDepositPaid),
        securityDepositAmount: Number(appData.securityDepositAmount) || 0,
        securityDepositReceiptNo: appData.securityDepositReceiptNo || "",
        securityDepositPaymentMode: appData.securityDepositPaymentMode || "",
        securityDepositTxnId: appData.securityDepositTxnId || "",
        securityDepositDate: appData.securityDepositDate || "",
        branch: appData.branch || selectedBranch || "",
        scholarshipId: appData.scholarshipId,
        discountId: appData.discountId,
        selectedOptionalFees: appData.selectedOptionalFees || [],
        submissionDate: new Date().toISOString().split("T")[0],
        status: resolvedStatus as any,
        documentsSubmitted: appData.documentsSubmitted || [],
        section: (appData as any).section || json?.data?.section || "",
      };

      savePersistedOptionalFees(
        createdApp.id,
        createdApp.registrationNo,
        appData.applicantName,
        appData.phone,
        appData.selectedOptionalFees || [],
      );

      setAdmissions((prev) => [
        createdApp,
        ...prev.filter((a) => a.id !== createdApp.id),
      ]);

      if (json && json.success !== false) {
        logActivity(
          "New Admission Application",
          `Received application from ${appData.applicantName}`,
        );
        if (!options?.silent) {
          addToast(
            "success",
            "Application Submitted",
            `New admission application registered with Registration No: ${assignedRegNo}`,
          );
          fetchAdmissions();
        }
        return json?.data;
      } else {
        if (!options?.silent) {
          addToast(
            "error",
            "Failed to Add",
            json?.message || "Failed to submit admission application.",
          );
        }
        console.error("Failed to add admission");
        return null;
      }
    } catch (err: any) {
      console.error("Error adding admission", err);
      if (!options?.silent) {
        addToast(
          "error",
          "Network Error",
          err.message || "Unable to submit application.",
        );
      }
      return null;
    } finally {
      setTimeout(() => {
        if (signature.length > 5)
          inFlightAdmissionSubmissions.delete(signature);
      }, 3000);
    }
  };

  const updateAdmission = async (
    id: string,
    updates: Partial<AdmissionApplication>,
  ) => {
    try {
      const existing = admissions.find((a) => a.id === id);
      if (!existing) return;
      const appData = { ...existing, ...updates };

      if (
        updates.dob !== undefined ||
        (updates as any).admissionDate !== undefined ||
        (updates as any).joiningDate !== undefined ||
        updates.appliedClass !== undefined
      ) {
        if (appData.dob) {
          const ageRes = validateStudentAge({
            dateOfBirth: appData.dob,
            dateOfAdmission:
              (appData as any).admissionDate ||
              (appData as any).joiningDate ||
              (existing as any).admissionDate ||
              (existing as any).joiningDate ||
              new Date().toISOString().split("T")[0],
            className: appData.appliedClass,
            academicClasses,
          });
          if (!ageRes.isValid) {
            throw new Error(ageRes.message || "Age eligibility check failed.");
          }
        }
      }

      let isoDob = new Date().toISOString();
      if (appData.dob) {
        if (appData.dob.includes("/")) {
          const parts = appData.dob.split("/");
          if (parts.length === 3) {
            const parsed = new Date(
              `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`,
            );
            if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
          }
        } else {
          const parsed = new Date(appData.dob);
          if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
        }
      }

      const matchedClass = academicClasses.find(
        (c) =>
          c.name?.toLowerCase().trim() ===
          appData.appliedClass?.toLowerCase().trim(),
      );
      const appliedClassId = matchedClass
        ? Number(String(matchedClass.id).replace(/\D/g, ""))
        : 1;

      const payload = {
        applicantFullName: appData.applicantName || "",
        appliedClass: appData.appliedClass || "",
        appliedClassId: appliedClassId,
        AppliedClassId: appliedClassId,
        gender: appData.gender || "",
        dob: isoDob,
        bloodGroup: appData.bloodGroup || "O+",
        religion: appData.religion || "General",
        casteCategory: appData.casteCategory || "General",
        fatherFullName: appData.parentName || "",
        motherFullName: appData.motherName || "",
        fatherMobileNo: appData.phone || "",
        motherMobileNumber:
          (appData as any).motherPhone ||
          (appData as any).motherMobileNumber ||
          "",
        alternateMobileNumber:
          (appData as any).alternatePhone ||
          (appData as any).alternateMobileNumber ||
          "",
        email: appData.email || (appData as any).parentEmail || "",
        parentEmail: appData.email || (appData as any).parentEmail || "",
        houseNo: appData.addressHouseNo || "",
        street: appData.addressStreet || "",
        areaLocality: appData.addressArea || "",
        city: appData.addressCity || "",
        district: appData.addressDistrict || "",
        state: appData.addressState || "",
        pinCode: appData.addressPinCode || "",
        numberOfSiblings: appData.siblingsCount || 0,
        siblingStudentId: "N/A",
        studentType: normalizeStudentType(appData.studentType),
        transportRequired: !!appData.transportRequired,
        transportType: appData.transportRequired
          ? appData.transportType || "AC"
          : "",
        busRoute: appData.transportRequired ? appData.busRoute || "" : "",
        pickupPoint: appData.transportRequired ? appData.pickupPoint || "" : "",
        dropPoint: appData.transportRequired ? appData.dropPoint || "" : "",
        hostelBlock:
          normalizeStudentType(appData.studentType) === "Residential"
            ? appData.hostelBlock || ""
            : "",
        hostelRoom:
          normalizeStudentType(appData.studentType) === "Residential"
            ? appData.hostelRoom || ""
            : "",
        floorLevel: "N/A",
        availableBed:
          normalizeStudentType(appData.studentType) === "Residential"
            ? appData.hostelBed || ""
            : "",
        hostelSecurityDepositPaid: Boolean(appData.hostelSecurityDepositPaid),
        securityDepositAmount: Number(appData.securityDepositAmount) || 0,
        securityDepositReceiptNo: appData.securityDepositReceiptNo || "",
        securityDepositPaymentMode: appData.securityDepositPaymentMode || "",
        securityDepositTxnId: appData.securityDepositTxnId || "",
        securityDepositDate: appData.securityDepositDate || "",
        scholarship:
          (appData as any).scholarship || appData.scholarshipId || "None",
        discount: (appData as any).discount || appData.discountId || "None",
        avatar: appData.avatar || "",
        branch: appData.branch || (appData as any).campus || "",
        branchName: appData.branch || (appData as any).campus || "",
        BranchName: appData.branch || (appData as any).campus || "",
        campus: appData.branch || (appData as any).campus || "",
        isLateAdmission: !!appData.isLateAdmission,
        feeCalculationMethod: appData.feeCalculationMethod || "Term-wise",
        selectedOptionalFees: appData.selectedOptionalFees || [],
        documentsSubmitted: appData.documentsSubmitted || [],
        section: (appData as any).section || (existing as any).section || "",
      };

      await updateAdmissionApi(parseInt(id, 10), payload);

      savePersistedOptionalFees(
        id,
        appData.registrationNo,
        appData.applicantName,
        appData.phone,
        appData.selectedOptionalFees || [],
      );

      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? (appData as AdmissionApplication) : a)),
      );

      // Also update any matching student in students state immediately
      setStudents((prev) =>
        prev.map((s) => {
          const isMatch =
            (appData.applicationNo &&
              (s.admissionNo === appData.applicationNo ||
                (s as any).registrationNumber === appData.applicationNo)) ||
            (appData.id &&
              (s.id === appData.id || s.admissionNo === `ADM-${appData.id}`)) ||
            (s.firstName?.toLowerCase() ===
              appData.applicantName?.toLowerCase().split(" ")[0] &&
              s.parentName?.toLowerCase() ===
                appData.parentName?.toLowerCase());

          if (isMatch) {
            return {
              ...s,
              firstName: appData.applicantName
                ? appData.applicantName.split(" ")[0]
                : s.firstName,
              lastName: appData.applicantName
                ? appData.applicantName.split(" ").slice(1).join(" ")
                : s.lastName,
              className: appData.appliedClass || s.className,
              section: (appData as any).section || s.section || "",
              gender: (appData.gender as any) || s.gender,
              dob: appData.dob || s.dob,
              bloodGroup: appData.bloodGroup || s.bloodGroup,
              religion: appData.religion || s.religion,
              casteCategory: appData.casteCategory || s.casteCategory,
              category: appData.casteCategory || s.category,
              parentName: appData.parentName || s.parentName,
              fatherName: appData.parentName || s.fatherName,
              motherName: appData.motherName || s.motherName,
              phone: appData.phone || s.phone,
              email: appData.email || (appData as any).parentEmail || s.email,
              studentType: normalizeStudentType(
                appData.studentType || s.studentType,
              ),
              transportRequired: !!appData.transportRequired,
              busRoute: appData.transportRequired ? appData.busRoute || "" : "",
              pickupPoint: appData.transportRequired
                ? appData.pickupPoint || ""
                : "",
              dropPoint: appData.transportRequired
                ? appData.dropPoint || ""
                : "",
              hostelBlock:
                normalizeStudentType(appData.studentType || s.studentType) ===
                "Residential"
                  ? appData.hostelBlock || ""
                  : "",
              hostelRoom:
                normalizeStudentType(appData.studentType || s.studentType) ===
                "Residential"
                  ? appData.hostelRoom || ""
                  : "",
              hostelBed:
                normalizeStudentType(appData.studentType || s.studentType) ===
                "Residential"
                  ? appData.hostelBed || ""
                  : "",
            };
          }
          return s;
        }),
      );

      fetchStudents();
      logActivity("Updated Admission Record", `Updated application ID ${id}`);
    } catch (err) {
      console.error(err);
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
    }
  };

  const deleteAdmission = async (id: string) => {
    try {
      await deleteAdmissionApi(id);
      setAdmissions((prev) =>
        prev.filter(
          (a) =>
            a.id !== id &&
            (a as any).registrationNo !== id &&
            a.applicationNo !== id,
        ),
      );
      logActivity("Deleted Admission Record", `Removed application ID ${id}`);
    } catch (err) {
      console.warn(
        "[deleteAdmission] Remote API delete call warning/bypassed:",
        err,
      );
      setAdmissions((prev) =>
        prev.filter(
          (a) =>
            a.id !== id &&
            (a as any).registrationNo !== id &&
            a.applicationNo !== id,
        ),
      );
    }
  };

  const updateAdmissionStatus = async (
    id: string,
    status: AdmissionApplication["status"],
  ): Promise<string | null> => {
    const matchedSt = students.find(
      (s) =>
        String(s.id).trim() === String(id).trim() ||
        (s.admissionNo && s.admissionNo === id),
    );
    const app =
      admissions.find(
        (a) =>
          String(a.id).trim() === String(id).trim() ||
          (a.applicationNo && a.applicationNo === id),
      ) ||
      (matchedSt
        ? ({
            id: String(matchedSt.id),
            applicationNo: matchedSt.admissionNo || String(matchedSt.id),
            registrationNo: matchedSt.admissionNo || String(matchedSt.id),
            applicantName:
              `${matchedSt.firstName || ""} ${matchedSt.lastName || ""}`.trim(),
            appliedClass: matchedSt.className || "Class 1",
            gender: matchedSt.gender || "Male",
            status: matchedSt.status === "Inactive" ? "Rejected" : "Enrolled",
            phone: matchedSt.phone || (matchedSt as any).fatherPhone || "",
            parentName: matchedSt.parentName || matchedSt.fatherName || "",
            dob: matchedSt.dob || "",
            bloodGroup: matchedSt.bloodGroup || "",
            studentType: normalizeStudentType(matchedSt.studentType),
            branch: matchedSt.branch || "",
            religion: matchedSt.religion || "General",
            casteCategory:
              matchedSt.casteCategory ||
              (matchedSt as any).category ||
              "General",
            email: matchedSt.email || "",
            submissionDate:
              matchedSt.joiningDate || new Date().toISOString().split("T")[0],
            documentsSubmitted: [],
          } as unknown as AdmissionApplication)
        : null);
    if (!app) return null;

    if (status === "Enrolled" && app.status === "Enrolled") {
      console.warn(
        `[updateAdmissionStatus] Application ${id} is already enrolled.`,
      );
      return null;
    }

    if (inFlightStatusUpdates.has(id)) {
      console.warn(
        `[updateAdmissionStatus] Status update already in progress for application ${id}`,
      );
      return null;
    }
    inFlightStatusUpdates.add(id);

    const appIdParam = (app as any).registrationNo || app.applicationNo || id;

    try {
      let json: any = { success: true };
      if (status === "Enrolled") {
        try {
          json = await enrollAdmissionApi(appIdParam);
        } catch (apiErr: any) {
          console.warn(
            "[updateAdmissionStatus] Remote API enroll call failed/bypassed:",
            apiErr,
          );
          json = { success: true };
        }
      } else if (status === "Rejected") {
        try {
          json = await rejectAdmissionApi(appIdParam);
        } catch (apiErr: any) {
          console.warn(
            "[updateAdmissionStatus] Remote API reject call failed/bypassed:",
            apiErr,
          );
          json = { success: true };
        }
      } else {
        try {
          if (appIdParam) {
            json = await updateAdmissionStatusApi(appIdParam, status);
          }
        } catch (apiErr: any) {
          console.warn(
            "[updateAdmissionStatus] Remote API status call failed/bypassed:",
            apiErr,
          );
          json = { success: true };
        }
      }

      if (json && json.success !== false) {
        let enrolledStudentId: string | null = null;
        let assignedAdmissionNo: string =
          json?.admissionNo || json?.data?.admissionNumber || "";
        if (status === "Enrolled" && app) {
          const addressParts = [
            app.addressHouseNo ? `H.No ${app.addressHouseNo}` : "",
            app.addressStreet,
            app.addressArea,
            app.addressCity,
            app.addressDistrict,
            app.addressState,
            app.addressPinCode ? `PIN: ${app.addressPinCode}` : "",
          ].filter(Boolean);
          const fullAddress =
            addressParts.length > 0
              ? addressParts.join(", ")
              : app.address || "";

          // --- DYNAMIC FEE CALCULATION & ASSIGNMENT SETUP ---
          const clsName = app.appliedClass || (app as any).className || "";
          const dfs =
            dynamicFeeStructures.find(
              (d) =>
                matchesClassName(d.className, clsName) &&
                (d.status === "Active" || !d.status),
            ) ||
            dynamicFeeStructures.find((d) =>
              matchesClassName(d.className, clsName),
            );

          let baseItems: any[] = [];
          if (dfs && dfs.items && dfs.items.length > 0) {
            baseItems = [...dfs.items];
          } else if (dfs && dfs.totalAmount > 0) {
            baseItems = [
              {
                feeHeadId: "FH-BASE",
                feeHeadName: "School Fee",
                category: "Tuition Fee",
                amount: dfs.totalAmount,
              },
            ];
          } else {
            baseItems = [];
          }

          const selectedOptional = app.selectedOptionalFees || [];
          const isUniformOpted = (hId?: string, hName?: string) => {
            if (!selectedOptional || selectedOptional.length === 0)
              return false;
            if (hId && selectedOptional.includes(hId)) return true;
            return selectedOptional.some((optId) => {
              if (!optId) return false;
              const lowerId = optId.toLowerCase();
              if (
                lowerId === "fh-04" ||
                lowerId === "fh-004" ||
                lowerId.includes("unf") ||
                lowerId.includes("uni")
              )
                return true;
              const fh = (feeHeads || []).find((h) => h.id === optId);
              if (
                fh &&
                (fh.name.toLowerCase().includes("uniform") ||
                  fh.name.toLowerCase().includes("kit") ||
                  fh.name.toLowerCase().includes("accessories"))
              )
                return true;
              const di = (dynamicFeeStructures || [])
                .flatMap((d) => d.items)
                .find((i) => i.feeHeadId === optId);
              if (
                di &&
                (di.feeHeadName.toLowerCase().includes("uniform") ||
                  di.feeHeadName.toLowerCase().includes("kit") ||
                  di.feeHeadName.toLowerCase().includes("accessories"))
              )
                return true;
              return false;
            });
          };

          const assignedFeeHeads = baseItems.filter((item) => {
            const lowerName = item.feeHeadName.toLowerCase();
            const isUniform =
              lowerName.includes("uniform") ||
              lowerName.includes("kit") ||
              lowerName.includes("accessories");
            if (isUniform) {
              return isUniformOpted(item.feeHeadId, item.feeHeadName);
            }
            const fh = feeHeads.find(
              (h) =>
                h.id === item.feeHeadId ||
                h.name.toLowerCase() === item.feeHeadName.toLowerCase(),
            );
            const isMandatory =
              fh && fh.mandatory !== undefined
                ? fh.mandatory
                : lowerName.includes("tuition") ||
                  lowerName.includes("admission") ||
                  lowerName.includes("book") ||
                  lowerName.includes("lab");
            return isMandatory || selectedOptional.includes(item.feeHeadId);
          });
          const baseFeeTotal = assignedFeeHeads.reduce(
            (acc, h) => acc + h.amount,
            0,
          );

          let additionalFees = 0;
          const appNormType = normalizeStudentType(app.studentType);
          if (appNormType === "Non-Residential" && app.transportRequired) {
            const rObj = routeMasters.find(
              (r) => r.id === app.routeId || r.routeName === app.busRoute,
            );
            const pObj = pickupPoints.find(
              (p) =>
                p.id === app.pickupPointId ||
                (rObj &&
                  p.routeId === rObj.id &&
                  p.pickupName === app.pickupPoint),
            );
            const ftc = financeTransportConfigs.find(
              (c) =>
                c.routeId === rObj?.id &&
                (c.pickupPointId === pObj?.id ||
                  c.pickupName === pObj?.pickupName) &&
                c.status === "Active",
            );
            const pFee =
              pObj && (pObj.monthlyFee ?? 0) > 0
                ? (pObj.monthlyFee ?? 0)
                : ftc
                  ? ftc.feeAmount
                  : 0;
            additionalFees += pFee;
          } else if (appNormType === "Residential" && app.hostelBed) {
            const hObj =
              hostelMasters.find(
                (h) =>
                  h.id === app.hostelBlock || h.hostelName === app.hostelBlock,
              ) || hostelMasters[0];
            let fhc = financeHostelConfigs.find(
              (c) =>
                c.status === "Active" &&
                ((hObj &&
                  c.hostelId &&
                  String(c.hostelId) === String(hObj.id)) ||
                  (hObj &&
                    c.hostelName &&
                    hObj.hostelName &&
                    c.hostelName.toLowerCase() ===
                      hObj.hostelName.toLowerCase()) ||
                  (app.hostelBlock &&
                    c.hostelName &&
                    c.hostelName
                      .toLowerCase()
                      .includes(app.hostelBlock.toLowerCase()))),
            );
            if (!fhc) {
              fhc =
                financeHostelConfigs.find((c) => c.status === "Active") ||
                financeHostelConfigs[0];
            }
            additionalFees += fhc ? fhc.hostelFee : 0;
            if (fhc && fhc.securityDeposit !== undefined)
              additionalFees += fhc.securityDeposit;
          }

          let scholarshipAmount = 0;
          if (app.scholarshipId) {
            const sObj = scholarships.find((s) => s.id === app.scholarshipId);
            if (sObj && sObj.status === "Active") {
              const tuitionFeeAmount =
                assignedFeeHeads.find(
                  (i) =>
                    i.feeHeadId === "FH-001" ||
                    i.feeHeadName === "Tuition Fee" ||
                    i.feeHeadId === "FH-01",
                )?.amount || 0;
              const sVal =
                sObj.discountType === "Percentage"
                  ? sObj.percentage || 0
                  : sObj.fixedAmount || 0;
              scholarshipAmount =
                sObj.discountType === "Percentage"
                  ? (tuitionFeeAmount * sVal) / 100
                  : sVal;
            }
          }

          let discountAmount = 0;
          if (app.discountId) {
            const dObj = discounts.find(
              (d) =>
                d.id === app.discountId ||
                d.code === app.discountId ||
                d.name === app.discountId,
            );
            if (dObj && dObj.status === "Active") {
              const tuitionFeeAmount =
                assignedFeeHeads.find(
                  (i) =>
                    i.feeHeadId === "FH-001" ||
                    i.feeHeadName === "Tuition Fee" ||
                    i.feeHeadId === "FH-01",
                )?.amount || 0;
              discountAmount =
                dObj.mode === "Percentage"
                  ? (tuitionFeeAmount * dObj.value) / 100
                  : dObj.value;
            }
          }

          const calculatedTotalFee = Math.max(
            0,
            baseFeeTotal + additionalFees - scholarshipAmount - discountAmount,
          );

          const resolvedAdmissionNo =
            json?.admissionNo ||
            json?.data?.admissionNumber ||
            generateNextAdmissionNo(students);
          assignedAdmissionNo = resolvedAdmissionNo;

          const newStudent = addStudent(
            {
              admissionNo: resolvedAdmissionNo,
              rollNo: (app as any).rollNo || "",
              firstName: (() => {
                const parts = (app.applicantName || "").trim().split(" ");
                return app.firstName || parts[0] || "";
              })(),
              lastName: (() => {
                const parts = (app.applicantName || "").trim().split(" ");
                return app.lastName || parts.slice(1).join(" ") || "";
              })(),
              gender: (app.gender as any) || "",
              dob: app.dob || "",
              bloodGroup: app.bloodGroup || "",
              religion: app.religion || "",
              casteCategory: app.casteCategory || "",
              className: app.appliedClass || (app as any).className || "",
              section: (app as any).section || (app as any).sectionLetter || "",
              category: app.casteCategory || "",
              status: "Active",
              avatar: app.avatar || "",
              joiningDate:
                app.joiningDate ||
                app.admissionDate ||
                app.submissionDate ||
                "",
              isLateAdmission: !!app.isLateAdmission,
              feeCalculationMethod: app.feeCalculationMethod || "Term-wise",
              branch: app.branch || selectedBranch || "",
              studentType: normalizeStudentType(app.studentType),
              transportRequired: !!app.transportRequired,
              routeId: app.transportRequired ? app.routeId || "" : "",
              busRoute: app.transportRequired ? app.busRoute || "" : "",
              transportType: app.transportRequired
                ? (app.transportType as any) || "AC"
                : undefined,
              pickupPointId: app.transportRequired
                ? app.pickupPointId || ""
                : "",
              pickupPoint: app.transportRequired ? app.pickupPoint || "" : "",
              dropPoint: app.transportRequired ? app.dropPoint || "" : "",
              hostelBlock:
                normalizeStudentType(app.studentType) === "Residential"
                  ? app.hostelBlock || ""
                  : "",
              hostelRoom:
                normalizeStudentType(app.studentType) === "Residential"
                  ? app.hostelRoom || ""
                  : "",
              hostelBed:
                normalizeStudentType(app.studentType) === "Residential"
                  ? app.hostelBed || ""
                  : "",
              boardType: (schoolProfile?.boardType as any) || "CBSE",
              fatherName: app.parentName || (app as any).fatherName || "",
              fatherPhone: app.phone || (app as any).fatherMobile || "",
              fatherOccupation: (app as any).fatherOccupation || "",
              motherName: app.motherName || (app as any).motherFullName || "",
              motherPhone: (app as any).motherPhone || "",
              email:
                app.email ||
                (app as any).contactEmail ||
                (app as any).parentEmail ||
                "",
              phone: app.phone || "",
              alternatePhone: app.alternatePhone || "",
              address: fullAddress,
              siblingsCount: app.siblingsCount || 0,
              totalFee: calculatedTotalFee,
              paidFee: 0,
              dueFee: calculatedTotalFee,
              attendancePct: 100.0,
              gpa: 4.0,
            },
            true,
          );

          enrolledStudentId = newStudent.id;

          // Create Student Fee Assignment based on selected fee types
          const sfaId = "SFA-" + Math.floor(100 + Math.random() * 900);
          const assignment: StudentFeeAssignment = {
            id: sfaId,
            studentId: newStudent.id,
            studentName: `${newStudent.firstName} ${newStudent.lastName}`,
            admissionNo: newStudent.admissionNo,
            branch: newStudent.branch || selectedBranch || "",
            academicYear: dfs?.academicYear || selectedAcademicYear || "",
            className: newStudent.className,
            section: newStudent.section,
            feeStructureId: dfs?.id || "DFS-FALLBACK",
            assignedFeeHeads,
            baseFeeTotal,
            feePolicy: (app.feeCalculationMethod as any) || "Term-wise",
            assignedDate: new Date().toISOString().split("T")[0],
            status: "Active",
          };
          setStudentFeeAssignments((prev) => [
            ...prev.filter((a) => a.studentId !== newStudent.id),
            assignment,
          ]);

          // Auto-assign transport facility if Non-Residential opted for transport
          if (
            normalizeStudentType(app.studentType) === "Non-Residential" &&
            app.transportRequired
          ) {
            const rObj = routeMasters.find(
              (r) => r.id === app.routeId || r.routeName === app.busRoute,
            );
            const pObj = pickupPoints.find(
              (p) =>
                p.id === app.pickupPointId ||
                (rObj &&
                  p.routeId === rObj.id &&
                  p.pickupName === app.pickupPoint),
            );
            const ftc = financeTransportConfigs.find(
              (c) =>
                c.routeId === rObj?.id &&
                (c.pickupPointId === pObj?.id ||
                  c.pickupName === pObj?.pickupName) &&
                c.status === "Active",
            );

            const trpFee =
              pObj && (pObj.monthlyFee ?? 0) > 0
                ? (pObj.monthlyFee ?? 0)
                : ftc
                  ? ftc.feeAmount
                  : 0;
            assignStudentTransport({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              routeId: rObj?.id || app.routeId || "",
              routeName: rObj?.routeName || app.busRoute || "",
              pickupPoint: pObj?.pickupName || app.pickupPoint || "",
              feePlan: (ftc?.feePlan || "Quarterly") as any,
              feeAmount: trpFee,
              effectiveFrom: new Date().toISOString().split("T")[0],
              status: "Active",
            });
          }

          // Auto-assign hostel facility if Residential
          if (
            normalizeStudentType(app.studentType) === "Residential" &&
            app.hostelBed
          ) {
            const hObj =
              hostelMasters.find(
                (h) =>
                  h.id === app.hostelBlock || h.hostelName === app.hostelBlock,
              ) || hostelMasters[0];
            const rObj =
              roomMasters.find((r) => r.id === app.hostelRoom) ||
              roomMasters[0];
            const fhc =
              financeHostelConfigs.find(
                (c) =>
                  (c.hostelId === hObj?.id ||
                    c.hostelName === hObj?.hostelName) &&
                  c.status === "Active",
              ) || financeHostelConfigs[0];
            const hstFee = fhc ? fhc.hostelFee : 40000;

            const hostelBlockId = hObj?.id || "HM-01";
            const hostelBlockName = hObj?.hostelName || "Boys Hostel";
            const roomNumberStr = rObj?.roomNumber || "101";

            assignStudentHostel({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              hostelId: hostelBlockId,
              hostelName: hostelBlockName,
              roomNo: roomNumberStr,
              bedNo: app.hostelBed || "BED-1",
              feeAmount: hstFee,
              effectiveFrom: new Date().toISOString().split("T")[0],
              status: "Active",
            });

            assignStudentHostelRoom({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              hostelId: hostelBlockId,
              hostelName: hostelBlockName,
              roomId: rObj?.id || "RM-01",
              roomNo: roomNumberStr,
              bedNo: app.hostelBed || "BED-1",
              joiningDate: new Date().toISOString().split("T")[0],
              status: "Active",
            });
          }

          // Auto-award scholarship to student upon admission enrollment
          if (app.scholarshipId) {
            assignScholarshipToStudent(newStudent.id, app.scholarshipId);
          }

          // Auto-grant discount concession to student upon admission enrollment
          if (app.discountId) {
            assignDiscountToStudent(newStudent.id, app.discountId);
          }

          // Automatically generate Student Fee Ledger for newly enrolled student
          setTimeout(
            () => generateStudentFeeLedger(newStudent.id, newStudent),
            50,
          );
        }

        // Update state to match API success
        const admNoToAssign = assignedAdmissionNo || json?.admissionNo;
        setAdmissions((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  admissionNo:
                    status === "Enrolled"
                      ? admNoToAssign || a.admissionNo
                      : a.admissionNo,
                  applicationNo:
                    status === "Enrolled" && (admNoToAssign || a.admissionNo)
                      ? admNoToAssign || a.admissionNo!
                      : a.applicationNo,
                }
              : a,
          ),
        );
        logActivity(
          "Updated Application Status",
          `Changed application ID ${id} to ${status}`,
        );
        try {
          await fetchAdmissions();
        } catch (fetchErr) {
          console.error("Failed to refresh admissions list", fetchErr);
        }
        return enrolledStudentId;
      } else {
        addToast(
          "error",
          "Update Failed",
          json?.message || `Failed to update status to ${status}`,
        );
      }
    } catch (err: any) {
      console.warn("Server status update note:", err?.message || err);
      // Seamless local fallback
      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      if (status === "Rejected") {
        setStudents((prev) =>
          prev.map((s) =>
            String(s.id) === String(id) || s.admissionNo === id
              ? { ...s, status: "Inactive" as any }
              : s,
          ),
        );
      }
    } finally {
      setTimeout(() => {
        inFlightStatusUpdates.delete(id);
      }, 3000);
    }
    return null;
  };

  const addAcademicClass = async (clsData: Omit<AcademicClass, "id">) => {
    try {
      const dynamicBranch =
        (selectedBranch &&
        selectedBranch !== "All" &&
        selectedBranch !== "All Branches" &&
        selectedBranch !== "All Campuses"
          ? selectedBranch
          : "") ||
        (branches || []).find((b: any) => b.status === "Active" || !b.status)
          ?.branchName ||
        (branches || []).find((b: any) => b.status === "Active" || !b.status)
          ?.name ||
        (branches || [])[0]?.branchName ||
        (branches || [])[0]?.name ||
        "";

      const dynamicYear =
        (selectedAcademicYear &&
        selectedAcademicYear !== "All" &&
        selectedAcademicYear !== "All Years"
          ? selectedAcademicYear
          : "") ||
        (academicYears || []).find(
          (ay: any) => ay.isCurrent || ay.status === "Active",
        )?.academicYear ||
        (academicYears || [])[0]?.academicYear ||
        "";

      const payload = {
        name: clsData.name,
        class_name: clsData.name,
        campus_location:
          (clsData as any).campus || (clsData as any).branch || dynamicBranch,
        academic_year: (clsData as any).academicYear || dynamicYear,
        display_order: (clsData as any).displayOrder,
        status: clsData.status || "Active",
        remarks: (clsData as any).remarks || "",
        sections: clsData.sections || [],
        sectionTeachers: (clsData as any).sectionTeachers || {},
        subjects: clsData.subjects || [],
      };

      await createClassApi(payload);
      await fetchAcademicClasses();
      addToast(
        "success",
        "Class Created",
        `Class ${clsData.name} has been created successfully.`,
      );
    } catch (err: any) {
      console.error("Error creating academic class:", err);
      addToast("error", "API Error", err.message || "Failed to create class.");
      throw err;
    }
  };

  const updateAcademicClass = async (
    id: string,
    updates: Partial<AcademicClass>,
  ) => {
    const normId = (val: any) => String(val ?? "").replace(/^CL-/i, "");
    const targetNormId = normId(id);

    classUpdatesRef.current[targetNormId] = {
      ...(classUpdatesRef.current[targetNormId] || {}),
      ...updates,
    };

    // Update React state optimistically
    setAcademicClasses((prev) =>
      prev.map((c) =>
        normId(c.id) === targetNormId ? { ...c, ...updates } : c,
      ),
    );

    try {
      const numericId = id.startsWith("CL-") ? id.replace("CL-", "") : id;

      // Find the existing class in state to get the current name and other fields
      const existingClass = academicClasses.find(
        (c) => normId(c.id) === targetNormId,
      );
      const currentName =
        (existingClass as any)?.className || existingClass?.name || "";
      const finalName =
        (updates as any)?.className || updates.name || currentName;

      const dynamicBranch =
        (selectedBranch &&
        selectedBranch !== "All" &&
        selectedBranch !== "All Branches" &&
        selectedBranch !== "All Campuses"
          ? selectedBranch
          : "") ||
        (branches || []).find((b: any) => b.status === "Active" || !b.status)
          ?.branchName ||
        (branches || []).find((b: any) => b.status === "Active" || !b.status)
          ?.name ||
        (branches || [])[0]?.branchName ||
        (branches || [])[0]?.name ||
        "";

      const dynamicYear =
        (selectedAcademicYear &&
        selectedAcademicYear !== "All" &&
        selectedAcademicYear !== "All Years"
          ? selectedAcademicYear
          : "") ||
        (academicYears || []).find(
          (ay: any) => ay.isCurrent || ay.status === "Active",
        )?.academicYear ||
        (academicYears || [])[0]?.academicYear ||
        "";

      const payload = {
        name: finalName,
        class_name: finalName,
        campus_location:
          (updates as any).campus ||
          (updates as any).branch ||
          (existingClass as any)?.campus ||
          (existingClass as any)?.branch ||
          dynamicBranch,
        academic_year:
          (updates as any).academicYear ||
          (existingClass as any)?.academicYear ||
          dynamicYear,
        display_order:
          "displayOrder" in updates
            ? ((updates as any).displayOrder ?? null)
            : ((existingClass as any)?.displayOrder ?? null),
        status: updates.status || existingClass?.status || "Active",
        remarks:
          (updates as any).remarks !== undefined
            ? (updates as any).remarks
            : (existingClass as any)?.remarks || "",
      };

      await updateClassApi(numericId, payload);
      await fetchAcademicClasses();
    } catch (err: any) {
      console.error("Error updating academic class:", err);
      addToast("error", "API Error", err.message || "Failed to update class.");
      throw err;
    }
  };

  const deleteAcademicClass = async (id: string) => {
    try {
      const numericId = id.startsWith("CL-") ? id.replace("CL-", "") : id;
      await deleteClassApi(numericId);
      await fetchAcademicClasses();
    } catch (err: any) {
      console.error("Error deleting academic class:", err);
      addToast("error", "API Error", err.message || "Failed to delete class.");
      throw err;
    }
  };

  // Subjects CRUD
  const addSubject = (subjectData: Omit<SubjectItem, "id">) => {
    const id = "SUB-" + Math.floor(100 + Math.random() * 900);
    const newSub: SubjectItem = {
      ...subjectData,
      id,
      code: subjectData.code || subjectData.subjectId,
      branch: (subjectData as any).branch || selectedBranch || "",
    } as any;
    setSubjects((prev) => [...prev, newSub]);
    logActivity(
      "Created Subject",
      `Added subject ${newSub.name} (${newSub.subjectId})`,
    );
  };

  const updateSubject = (id: string, updates: Partial<SubjectItem>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
    logActivity("Updated Subject", `Updated subject ID ${id}`);
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    logActivity("Deleted Subject", `Removed subject ID ${id}`);
  };

  // Bus CRUD
  const addBus = (busData: Omit<Bus, "id">) => {
    const id = "BUS-" + Math.floor(10 + Math.random() * 90);
    const newBus: Bus = {
      ...busData,
      id,
      branch: (busData as any).branch || selectedBranch || "",
    } as any;
    setBuses((prev) => [...prev, newBus]);
    logActivity(
      "Added Bus",
      `Registered Bus ${newBus.busNumber} (${newBus.routeName})`,
    );
  };

  const updateBus = (id: string, updates: Partial<Bus>) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
    logActivity("Updated Bus", `Updated details for Bus ID ${id}`);
  };

  const deleteBus = (id: string) => {
    setBuses((prev) => prev.filter((b) => b.id !== id));
    logActivity("Deleted Bus", `Removed Bus ID ${id}`);
  };

  // Hostel CRUD
  const addHostelBlock = (blockData: Omit<HostelBlock, "id">) => {
    const id = "BLK-" + Math.floor(10 + Math.random() * 90);
    const newBlock: HostelBlock = { ...blockData, id };
    setHostelBlocks((prev) => [...prev, newBlock]);
  };

  const updateHostelBlock = (id: string, updates: Partial<HostelBlock>) => {
    setHostelBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  };

  const deleteHostelBlock = (id: string) => {
    setHostelBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addHostelBed = (bedData: Omit<HostelBed, "id">) => {
    const id = "BED-" + Math.floor(100 + Math.random() * 900);
    const newBed: HostelBed = { ...bedData, id };
    setHostelBeds((prev) => [...prev, newBed]);
  };

  const updateHostelBed = (id: string, updates: Partial<HostelBed>) => {
    setHostelBeds((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  };

  const deleteHostelBed = (id: string) => {
    setHostelBeds((prev) => prev.filter((b) => b.id !== id));
  };

  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>(() =>
    getStored("period_settings", defaultPeriodSettings),
  );
  const [teacherAssignments, setTeacherAssignments] = useState<
    TeacherAssignment[]
  >([]);

  useEffect(() => {
    localStorage.setItem("edu_db_timetable", JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem("edu_db_homework", JSON.stringify(homework));
  }, [homework]);

  useEffect(() => {
    localStorage.setItem("edu_db_holidays", JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem("edu_db_school_events", JSON.stringify(schoolEvents));
  }, [schoolEvents]);

  useEffect(() => {
    localStorage.setItem(
      "edu_db_period_settings",
      JSON.stringify(periodSettings),
    );
  }, [periodSettings]);

  const addPeriodSetting = async (data: Omit<PeriodSetting, "id">) => {
    // Check duplicate
    const isDuplicate = periodSettings.some((p) => {
      if (p.status !== "Active") return false;
      const sameScope =
        (!p.className && !p.section && !data.className && !data.section) ||
        (p.className === data.className && p.section === data.section);
      if (!sameScope) return false;
      const sameName =
        p.periodName.trim().toLowerCase() ===
        data.periodName.trim().toLowerCase();
      const sameSeq = Number(p.sequence) === Number(data.sequence);
      const sameTime =
        p.startTime === data.startTime && p.endTime === data.endTime;
      return sameName || sameSeq || sameTime;
    });

    if (isDuplicate) return;

    const tempId = "PS-" + Math.floor(100 + Math.random() * 900);
    const newPs: PeriodSetting = { ...data, id: tempId };
    setPeriodSettings((prev) => [...prev, newPs]);

    try {
      const res: any = await savePeriodApi({
        periodName: data.periodName,
        startTime: data.startTime,
        endTime: data.endTime,
        periodType: data.periodType,
        displayOrder: Number(data.sequence),
      });

      if (res?.success && res.data) {
        const created = res.data;
        setPeriodSettings((prev) =>
          prev.map((p) =>
            p.id === tempId
              ? {
                  ...p,
                  id: created.periodId?.toString() || p.id,
                }
              : p,
          ),
        );
      }
    } catch (err) {
      console.warn("Failed to save period template to backend", err);
    }

    logActivity(
      "Created Period Setting",
      `Added ${newPs.periodName} (${newPs.startTime}-${newPs.endTime})`,
    );
  };

  const updatePeriodSetting = async (
    id: string,
    updates: Partial<PeriodSetting>,
  ) => {
    // Check duplicate if updates contains fields that can duplicate
    if (
      updates.periodName ||
      updates.sequence ||
      updates.startTime ||
      updates.endTime
    ) {
      const existing = periodSettings.find((p) => p.id === id);
      if (existing) {
        const merged = { ...existing, ...updates };
        const isDuplicate = periodSettings.some((p) => {
          if (p.id === id || p.status !== "Active") return false;
          const sameScope =
            (!p.className &&
              !p.section &&
              !merged.className &&
              !merged.section) ||
            (p.className === merged.className && p.section === merged.section);
          if (!sameScope) return false;
          const sameName =
            p.periodName.trim().toLowerCase() ===
            merged.periodName.trim().toLowerCase();
          const sameSeq = Number(p.sequence) === Number(merged.sequence);
          const sameTime =
            p.startTime === merged.startTime && p.endTime === merged.endTime;
          return sameName || sameSeq || sameTime;
        });
        if (isDuplicate) return;
      }
    }

    setPeriodSettings((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );

    try {
      const existing = periodSettings.find((p) => p.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      const numericId = id.startsWith("PS-") ? 0 : Number(id);

      await savePeriodApi({
        periodId: numericId > 0 ? numericId : undefined,
        periodName: merged.periodName,
        startTime: merged.startTime,
        endTime: merged.endTime,
        periodType: merged.periodType,
        displayOrder: Number(merged.sequence),
      });
    } catch (err) {
      console.warn("Failed to update period template on backend", err);
    }
  };

  const deletePeriodSetting = async (id: string) => {
    setPeriodSettings((prev) => prev.filter((p) => p.id !== id));

    try {
      const numericId = id.startsWith("PS-") ? id.replace("PS-", "") : id;
      await deletePeriodApi(numericId);
    } catch (err) {
      console.warn("Failed to delete period setting from backend", err);
    }
  };

  const bulkAssignPeriods = (classKeys: string[]) => {
    const master = periodSettings.filter(
      (p) => !p.className && p.status === "Active",
    );

    // Deduplicate master list on the fly to ensure we never write duplicates
    const uniqueMaster: PeriodSetting[] = [];
    const seenNames = new Set<string>();
    const seenSequences = new Set<number>();
    const seenTimes = new Set<string>();

    master.forEach((mp) => {
      const nameKey = mp.periodName.trim().toLowerCase();
      const seqKey = Number(mp.sequence);
      const timeKey = `${mp.startTime}-${mp.endTime}`;

      if (
        !seenNames.has(nameKey) &&
        !seenSequences.has(seqKey) &&
        !seenTimes.has(timeKey)
      ) {
        uniqueMaster.push(mp);
        seenNames.add(nameKey);
        seenSequences.add(seqKey);
        seenTimes.add(timeKey);
      }
    });

    setPeriodSettings((prev) => {
      let updated = [...prev];
      classKeys.forEach((key) => {
        const [className, section] = key.split("-");
        // Remove existing class-specific periods
        updated = updated.filter(
          (p) => !(p.className === className && p.section === section),
        );
        // Add cloned master periods
        uniqueMaster.forEach((mp) => {
          const id = "PS-" + Math.floor(100 + Math.random() * 900);
          updated.push({
            academicYear: mp.academicYear,
            branch: mp.branch,
            className,
            section,
            periodName: mp.periodName,
            startTime: mp.startTime,
            endTime: mp.endTime,
            sequence: mp.sequence,
            periodType: mp.periodType,
            status: "Active",
            id,
          });
        });
      });
      return updated;
    });
    logActivity(
      "Bulk Assigned Periods",
      `Assigned template to ${classKeys.length} class sections.`,
    );
  };

  const resetClassPeriods = (className: string, section: string) => {
    setPeriodSettings((prev) =>
      prev.filter((p) => !(p.className === className && p.section === section)),
    );
    logActivity(
      "Reset Class Periods",
      `Reverted ${className}-${section} to master template`,
    );
  };

  const bulkAddPeriodSettings = (newPeriods: PeriodSetting[]) => {
    if (!newPeriods || newPeriods.length === 0) return;
    setPeriodSettings((prev) => {
      const norm = (str?: string) =>
        (str || "").toLowerCase().replace(/\s+/g, "").replace(/class/gi, "");
      const hasMaster = newPeriods.some(
        (p) =>
          !p.className || p.className === "Master" || p.className === "All",
      );

      const targetClassSections = new Set(
        newPeriods
          .filter(
            (p) =>
              p.className && p.className !== "Master" && p.className !== "All",
          )
          .map((p) => `${norm(p.className)}-${norm(p.section)}`),
      );

      const filtered = prev.filter((p) => {
        if (
          hasMaster &&
          (!p.className || p.className === "Master" || p.className === "All")
        ) {
          return false;
        }
        if (p.className) {
          const key = `${norm(p.className)}-${norm(p.section)}`;
          if (targetClassSections.has(key)) {
            return false;
          }
        }
        return true;
      });

      const updated = [...filtered, ...newPeriods];
      try {
        localStorage.setItem("edu_db_period_settings", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const addTeacherAssignment = (data: Omit<TeacherAssignment, "id">) => {
    const id = "TA-" + Math.floor(100 + Math.random() * 900);
    const newTa: TeacherAssignment = { ...data, id };
    const norm = (str?: string) =>
      (str || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/class/gi, "")
        .replace(/section/gi, "");
    setTeacherAssignments((prev) => [
      ...prev.filter(
        (t) =>
          !(
            norm(t.className) === norm(data.className) &&
            norm(t.section) === norm(data.section) &&
            norm(t.subject) === norm(data.subject)
          ),
      ),
      newTa,
    ]);
    logActivity(
      "Assigned Subject Teacher",
      `Assigned ${data.teacherName} to ${data.className}-${data.section} ${data.subject}`,
    );
  };

  const updateTeacherAssignment = (
    id: string,
    updates: Partial<TeacherAssignment>,
  ) => {
    const norm = (str?: string) =>
      (str || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/class/gi, "")
        .replace(/section/gi, "");
    setTeacherAssignments((prev) =>
      prev.map((t) => {
        if (t.id === id) return { ...t, ...updates };
        if (
          updates.className &&
          updates.section &&
          updates.subject &&
          norm(t.className) === norm(updates.className) &&
          norm(t.section) === norm(updates.section) &&
          norm(t.subject) === norm(updates.subject)
        ) {
          return { ...t, ...updates };
        }
        return t;
      }),
    );
  };

  const deleteTeacherAssignment = (id: string) => {
    setTeacherAssignments((prev) => prev.filter((t) => t.id !== id));
  };

  const publishClassTimetable = async (
    className: string,
    section: string,
    academicYear?: string,
    branch?: string,
  ) => {
    setTimetable((prev) =>
      prev.map((t) => {
        if (t.className === className && t.section === section) {
          return { ...t, status: "Published" };
        }
        return t;
      }),
    );
    logActivity(
      "Published Timetable",
      `Published timetable for ${className}-${section}`,
    );

    try {
      const clsObj = (academicClasses || []).find(
        (c) =>
          c.name?.toLowerCase().trim() === className?.toLowerCase().trim() ||
          (c as any).className?.toLowerCase().trim() ===
            className?.toLowerCase().trim(),
      );
      const classId = clsObj?.id;
      const secLetter = (section || "A").replace(/^Section\s*/i, "").trim();

      await publishTimetableApi({
        classId,
        className,
        sectionName: secLetter,
        academicYear: academicYear || selectedAcademicYear || "",
        status: "Published",
      });
    } catch (err) {
      console.warn("Backend publish timetable sync notice:", err);
    }
  };
  const addUniform = async (itemData: Omit<UniformItem, "id">) => {
    const id = "UNI-" + Date.now();
    const createdAt = new Date().toISOString();
    const catName = itemData.category || itemData.name || "Uniform Item";
    const stockVal =
      itemData.availableStock !== undefined
        ? Number(itemData.availableStock)
        : itemData.openingStock !== undefined
          ? Number((itemData as any).openingStock)
          : 150;
    const newItem: UniformItem = {
      ...itemData,
      id,
      createdAt,
      category: catName,
    };
    setUniforms((prev) => {
      const updated = [newItem, ...prev];
      return updated;
    });

    if (catName) {
      const lower = catName.toLowerCase().trim();
      const isPkg =
        itemData.isPackage ||
        lower.includes("package") ||
        lower.includes("kit") ||
        (lower.includes("base") &&
          (lower.includes("boys") || lower.includes("girls")));

      if (!isPkg) {
        setUniformCategories((prevCats) => {
          const catNorm = catName.toLowerCase().trim();
          if (
            !prevCats.some(
              (c) =>
                (c.name || (c as any).categoryName || "")
                  .toLowerCase()
                  .trim() === catNorm,
            )
          ) {
            const newCat: UniformCategory = {
              id: `UC-${Date.now()}`,
              name: catName,
              categoryName: catName,
              description: `${catName} uniform category`,
            };
            const updatedCats = [...prevCats, newCat];
            try {
              localStorage.setItem(
                "edu_db_uniform_categories",
                JSON.stringify(updatedCats),
              );
              localStorage.setItem(
                "uniform_categories",
                JSON.stringify(updatedCats),
              );
            } catch (e) {}
            return updatedCats;
          }
          return prevCats;
        });
      }
    }

    // Automatically sync with uniformInventory so Dashboard Available Stock updates immediately
    const invId = "UINV-" + Math.floor(100 + Math.random() * 900);
    const newInvItem: UniformInventoryItem = {
      id: invId,
      itemId: id,
      itemName: catName,
      category: catName,
      size: itemData.size || "M",
      openingStock: stockVal,
      currentStock: stockVal,
      minimumStock: 10,
      reorderLevel: 15,
      status:
        stockVal === 0
          ? "Out of Stock"
          : stockVal <= 10
            ? "Low Stock"
            : "In Stock",
      branch: (itemData as any).branch || selectedBranch || "",
    } as any;
    setUniformInventory((prev) => [...prev, newInvItem]);

    try {
      const res: any = await createUniformTypeApi({
        itemName: catName,
        categoryName: catName,
        gender: itemData.gender || "Unisex",
        size: itemData.size || "All Sizes",
        color: itemData.color || "",
        availableStock: stockVal,
        price: itemData.price || 0,
        className: itemData.className || "All Wings",
        isPackage: itemData.isPackage || false,
        packageComponents: itemData.packageComponents || [],
      });
      if (res?.success && res?.data) {
        const serverItem = res.data;
        const realId = String(serverItem.uniformTypeId || serverItem.id);
        setUniforms((prev) =>
          prev.map((u) => (u.id === id ? { ...u, id: realId } : u)),
        );
      }
    } catch (err) {
      console.warn("Failed to create uniform type on backend:", err);
    }
  };

  const updateUniform = async (id: string, updates: Partial<UniformItem>) => {
    setUniforms((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );

    // Sync matching inventory item if availableStock, category or size changes
    setUniformInventory((prev) =>
      prev.map((inv) => {
        if (inv.itemId === id || inv.itemName === updates.category) {
          const newStock =
            updates.availableStock !== undefined
              ? Number(updates.availableStock)
              : inv.currentStock;
          const newStatus =
            newStock === 0
              ? "Out of Stock"
              : newStock <= inv.minimumStock
                ? "Low Stock"
                : "In Stock";
          return {
            ...inv,
            itemName: updates.category || inv.itemName,
            category: updates.category || inv.category,
            size: updates.size || inv.size,
            currentStock: newStock,
            status: newStatus,
          };
        }
        return inv;
      }),
    );

    if (id && !id.startsWith("UNI-")) {
      try {
        await updateUniformTypeApi(id, {
          itemName: updates.category || updates.name || "Uniform Item",
          categoryName: updates.category || updates.name || "Uniform Item",
          gender: updates.gender || "Unisex",
          size: updates.size || "All Sizes",
          color: updates.color || "",
          availableStock:
            updates.availableStock !== undefined
              ? Number(updates.availableStock)
              : 100,
          price: updates.price || 0,
          className: updates.className || "All Wings",
        });
      } catch (err) {
        console.warn("Failed to update uniform type on backend:", err);
      }
    }
  };

  const deleteUniform = async (id: string) => {
    setUniforms((prev) => {
      const targetItem = prev.find((u) => u.id === id);
      const targetName = (targetItem?.category || targetItem?.name || "")
        .toLowerCase()
        .trim();
      const targetSize = (
        targetItem?.size ||
        (targetItem as any)?.meterRange ||
        ""
      )
        .toLowerCase()
        .trim();
      const updatedU = prev.filter((u) => u.id !== id);

      setUniformInventory((prevInv) => {
        const updatedInv = prevInv.filter((inv) => {
          if (inv.itemId === id || inv.id === id) return false;
          const invName = (inv.itemName || inv.category || "")
            .toLowerCase()
            .trim();
          const invSize = (inv.size || (inv as any).meterRange || "")
            .toLowerCase()
            .trim();
          if (
            targetName &&
            targetSize &&
            invName === targetName &&
            invSize === targetSize
          )
            return false;
          return true;
        });

        return updatedInv;
      });

      return updatedU;
    });

    if (id && !id.startsWith("UNI-")) {
      try {
        await deleteUniformTypeApi(id);
      } catch (err) {
        console.warn("Failed to delete uniform type on backend:", err);
      }
    }
  };

  // Custom Roles CRUD
  const addCustomRole = (roleData: Omit<CustomRole, "id">) => {
    const id = "ROLE-" + Math.floor(100 + Math.random() * 900);
    const newRole: CustomRole = { ...roleData, id };
    setCustomRoles((prev) => [...prev, newRole]);
    logActivity("Created User Role", `Configured role ${newRole.name}`);
  };

  const updateCustomRole = (id: string, updates: Partial<CustomRole>) => {
    setCustomRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const deleteCustomRole = (id: string) => {
    setCustomRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const addFeeStructure = (feeStruct: Omit<FeeStructure, "id">) => {
    const id = "FEE-" + Math.floor(100 + Math.random() * 900);
    const newStruct: FeeStructure = {
      ...feeStruct,
      id,
      branch: (feeStruct as any).branch || selectedBranch || "",
    } as any;
    setFeeStructures((prev) => [...prev, newStruct]);
    logActivity(
      "Configured Fee Structure",
      `Added fee structure for ${newStruct.className} (${newStruct.term})`,
    );
  };

  const updateFeeStructure = (id: string, updates: Partial<FeeStructure>) => {
    setFeeStructures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const deleteFeeStructure = (id: string) => {
    setFeeStructures((prev) => prev.filter((f) => f.id !== id));
  };

  // Fee Payments CRUD with Student Fee Ledger Update & FIFO Allocation Engine
  const addFeePayment = (
    paymentData: Omit<FeePayment, "id" | "receiptNo">,
  ): FeePayment => {
    if (!paymentData || paymentData.amountPaid <= 0) {
      console.warn("Attempted to add payment with amount <= 0, aborted");
      return null as any;
    }
    const receiptNo =
      (paymentData as any).receiptNo ||
      financeSettings.receiptPrefix + Math.floor(1000 + Math.random() * 9000);
    const id = "PAY-" + Math.floor(100 + Math.random() * 900);
    const activeAY =
      selectedAcademicYear || financeSettings?.academicYear || "";

    const targetStudentId = paymentData.studentId;
    const targetAdmissionNo = (paymentData as any).admissionNo;

    const resolvedStudent =
      students.find(
        (s) =>
          s.id === targetStudentId ||
          s.admissionNo === targetStudentId ||
          (targetAdmissionNo &&
            (s.id === targetAdmissionNo ||
              s.admissionNo === targetAdmissionNo)),
      ) ||
      admissions.find(
        (a) =>
          a.id === targetStudentId ||
          a.applicationNo === targetStudentId ||
          (a as any).registrationNo === targetStudentId ||
          (targetAdmissionNo &&
            (a.id === targetAdmissionNo ||
              a.applicationNo === targetAdmissionNo ||
              (a as any).registrationNo === targetAdmissionNo)),
      );

    const isMatchForPayment = (stId: string) => {
      if (!stId) return false;
      const s = String(stId).trim().toLowerCase();
      const pSid = String(targetStudentId).trim().toLowerCase();
      const pAdm = targetAdmissionNo
        ? String(targetAdmissionNo).trim().toLowerCase()
        : "";
      if (s === pSid || (pAdm && s === pAdm)) return true;
      if (resolvedStudent) {
        const ids = [
          resolvedStudent.id
            ? String(resolvedStudent.id).trim().toLowerCase()
            : "",
          (resolvedStudent as Student).admissionNo
            ? String((resolvedStudent as Student).admissionNo)
                .trim()
                .toLowerCase()
            : "",
          (resolvedStudent as AdmissionApplication).applicationNo
            ? String((resolvedStudent as AdmissionApplication).applicationNo)
                .trim()
                .toLowerCase()
            : "",
          (resolvedStudent as any).registrationNo
            ? String((resolvedStudent as any).registrationNo)
                .trim()
                .toLowerCase()
            : "",
        ].filter(Boolean);
        return ids.includes(s);
      }
      return false;
    };

    let remainingAmountToAllocate = paymentData.amountPaid;
    const allocations: PaymentAllocationItem[] = [];

    let nextLedgers = [...studentFeeLedgers];
    let nextInstallments = [...studentFeeInstallments];

    if (
      paymentData.paymentAllocation &&
      paymentData.paymentAllocation.length > 0
    ) {
      // 1. EXPLICIT CUSTOM ALLOCATION PER INSTALLMENT
      paymentData.paymentAllocation.forEach((allocItem) => {
        if (remainingAmountToAllocate <= 0) return;
        let instIndex = nextInstallments.findIndex(
          (i) => i.id === allocItem.installmentId,
        );
        if (instIndex === -1 && allocItem.feeHeadName) {
          instIndex = nextInstallments.findIndex(
            (i) =>
              isMatchForPayment(i.studentId) &&
              i.dueAmount > 0 &&
              (i.feeHeadName?.toLowerCase().trim() ===
                allocItem.feeHeadName?.toLowerCase().trim() ||
                (allocItem.termName &&
                  i.termName?.toLowerCase().trim() ===
                    allocItem.termName?.toLowerCase().trim())),
          );
        }

        if (instIndex === -1 && allocItem.amount > 0) {
          const synthInst: StudentFeeInstallment = {
            id:
              allocItem.installmentId ||
              `INST-${targetStudentId}-${activeAY}-${allocItem.feeHeadName}`,
            studentId: targetStudentId,
            academicYear: activeAY,
            feeAssignmentId: `FA-PAY-${targetStudentId}`,
            feeHeadId: allocItem.feeHeadName
              ?.toLowerCase()
              .includes("transport")
              ? "FH-TRP"
              : "FH-GEN",
            feeHeadName: allocItem.feeHeadName || "Fee Head",
            frequency: "One Time",
            termName: allocItem.termName || "Term",
            dueDate: new Date().toISOString().split("T")[0],
            amount: allocItem.amount,
            paidAmount: 0,
            dueAmount: allocItem.amount,
            status: "Pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          nextInstallments.push(synthInst);
          instIndex = nextInstallments.length - 1;
        }

        if (instIndex !== -1) {
          const inst = { ...nextInstallments[instIndex] };
          const maxTarget =
            inst.dueAmount > 0 ? inst.dueAmount : allocItem.amount;
          const allocAmount = Math.min(
            maxTarget,
            allocItem.amount,
            remainingAmountToAllocate,
          );
          remainingAmountToAllocate -= allocAmount;

          inst.paidAmount += allocAmount;
          inst.dueAmount = Math.max(0, inst.dueAmount - allocAmount);
          inst.status = inst.dueAmount <= 0 ? "Paid" : "Partial";
          inst.updatedAt = new Date().toISOString();

          nextInstallments[instIndex] = inst;

          const ledgerIndex = nextLedgers.findIndex(
            (l) =>
              isMatchForPayment(l.studentId) &&
              l.academicYear === inst.academicYear,
          );

          if (ledgerIndex !== -1) {
            const ledger = { ...nextLedgers[ledgerIndex] };
            const ledgerInsts = ledger.installments || [];
            const updatedLedgerInsts = ledgerInsts.map((li) =>
              li.id === inst.id ? { ...inst } : li,
            );
            ledger.installments = updatedLedgerInsts;

            const totalPaid = updatedLedgerInsts.reduce(
              (sum, i) => sum + i.paidAmount,
              0,
            );
            const totalDue = Math.max(0, ledger.totalPayable - totalPaid);
            ledger.paidAmount = totalPaid;
            ledger.dueBalance = totalDue;
            ledger.updatedAt = new Date().toISOString().split("T")[0];

            nextLedgers[ledgerIndex] = ledger;
          }

          allocations.push({
            academicYear: inst.academicYear,
            ledgerId: nextLedgers.find(
              (l) =>
                isMatchForPayment(l.studentId) &&
                l.academicYear === inst.academicYear,
            )?.id,
            amount: allocAmount,
            installmentId: inst.id,
            feeHeadName: inst.feeHeadName,
            termName: inst.termName || inst.termId || "Installment",
          });
        }
      });
    } else if (
      paymentData.selectedInstallmentIds &&
      paymentData.selectedInstallmentIds.length > 0
    ) {
      // 2. DIRECT SELECTED INSTALLMENT ALLOCATION
      const selectedInsts = nextInstallments
        .filter(
          (i) =>
            isMatchForPayment(i.studentId) &&
            paymentData.selectedInstallmentIds?.includes(i.id),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)); // Pay chronologically if there's any overflow/partial

      selectedInsts.forEach((inst) => {
        if (remainingAmountToAllocate <= 0) return;

        const allocAmount = Math.min(inst.dueAmount, remainingAmountToAllocate);
        remainingAmountToAllocate -= allocAmount;

        // Apply allocation to installment
        inst.paidAmount += allocAmount;
        inst.dueAmount -= allocAmount;
        inst.status = inst.dueAmount <= 0 ? "Paid" : "Partial";
        inst.updatedAt = new Date().toISOString();

        // Find parent ledger for this installment
        const ledgerIndex = nextLedgers.findIndex(
          (l) =>
            isMatchForPayment(l.studentId) &&
            l.academicYear === inst.academicYear,
        );

        if (ledgerIndex !== -1) {
          const ledger = { ...nextLedgers[ledgerIndex] };
          const ledgerInsts = ledger.installments || [];
          const updatedLedgerInsts = ledgerInsts.map((li) =>
            li.id === inst.id ? { ...inst } : li,
          );
          ledger.installments = updatedLedgerInsts;

          // Recalculate ledger totals
          const totalPaid = updatedLedgerInsts.reduce(
            (sum, i) => sum + i.paidAmount,
            0,
          );
          const totalDue = Math.max(0, ledger.totalPayable - totalPaid);
          ledger.paidAmount = totalPaid;
          ledger.dueBalance = totalDue;
          ledger.updatedAt = new Date().toISOString().split("T")[0];

          nextLedgers[ledgerIndex] = ledger;
        }

        allocations.push({
          academicYear: inst.academicYear,
          ledgerId: nextLedgers.find(
            (l) =>
              isMatchForPayment(l.studentId) &&
              l.academicYear === inst.academicYear,
          )?.id,
          amount: allocAmount,
          installmentId: inst.id,
          feeHeadName: inst.feeHeadName,
          termName: inst.termName || inst.termId || "Installment",
        });

        // Sync global studentFeeInstallments
        nextInstallments = nextInstallments.map((i) =>
          i.id === inst.id ? { ...inst } : i,
        );
      });
    } else {
      // 2. FIFO ALLOCATION FALLBACK
      // Find all ledgers for the student
      const studentLedgers = studentFeeLedgers
        .filter((l) => isMatchForPayment(l.studentId))
        .sort((a, b) => a.academicYear.localeCompare(b.academicYear));

      studentLedgers.forEach((ledger) => {
        if (remainingAmountToAllocate <= 0) return;

        // Make sure the ledger has installments
        let insts = ledger.installments || [];
        if (insts.length === 0) {
          const assignment = studentFeeAssignments.find(
            (a) =>
              isMatchForPayment(a.studentId) &&
              a.academicYear === ledger.academicYear &&
              a.status === "Active",
          );
          insts = generateInstallmentsForStudent(
            ledger.studentId,
            ledger.academicYear,
            assignment,
            ledger,
          );
        }

        // Sort unpaid installments by due date ascending
        const unpaidInsts = insts
          .filter((inst) => inst.dueAmount > 0)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        unpaidInsts.forEach((inst) => {
          if (remainingAmountToAllocate <= 0) return;

          const allocAmount = Math.min(
            inst.dueAmount,
            remainingAmountToAllocate,
          );
          remainingAmountToAllocate -= allocAmount;

          // Apply allocation
          inst.paidAmount += allocAmount;
          inst.dueAmount -= allocAmount;
          inst.status = inst.dueAmount === 0 ? "Paid" : "Partial";
          inst.updatedAt = new Date().toISOString();

          allocations.push({
            academicYear: ledger.academicYear,
            ledgerId: ledger.id,
            amount: allocAmount,
            installmentId: inst.id,
            feeHeadName: inst.feeHeadName,
            termName: inst.termName || inst.termId || "Installment",
          });

          // Sync global studentFeeInstallments
          nextInstallments = nextInstallments.map((i) =>
            i.id === inst.id ? { ...inst } : i,
          );
        });

        // Update the ledger totals
        const totalPaid = insts.reduce((sum, i) => sum + i.paidAmount, 0);
        const totalDue = Math.max(0, ledger.totalPayable - totalPaid);

        nextLedgers = nextLedgers.map((l) => {
          if (l.id === ledger.id) {
            return {
              ...l,
              paidAmount: totalPaid,
              dueBalance: totalDue,
              installments: insts,
              updatedAt: new Date().toISOString().split("T")[0],
            };
          }
          return l;
        });
      });
    }

    // Fallback if no specific year had due or money left
    if (allocations.length === 0 && paymentData.amountPaid > 0) {
      allocations.push({
        academicYear: paymentData.academicYear || activeAY,
        amount: paymentData.amountPaid,
      });
    }

    const newPayment: FeePayment = {
      ...paymentData,
      id,
      receiptNo,
      academicYear: paymentData.academicYear || activeAY,
      paymentAllocation:
        allocations.length > 0
          ? allocations
          : paymentData.paymentAllocation || [],
      branch: (paymentData as any).branch || selectedBranch || "",
    } as any;

    setFeePayments((prev) => {
      const filtered = prev.filter(
        (p) =>
          p.id !== newPayment.id &&
          (!newPayment.receiptNo || p.receiptNo !== newPayment.receiptNo),
      );
      const next = [newPayment, ...filtered];
      localStorage.setItem("edu_db_fee_payments", JSON.stringify(next));
      return next;
    });

    FinanceAPI.createFeePaymentApi(newPayment)
      .then(() => {
        fetchFinanceData().catch(() => {});
      })
      .catch((err: any) => {
        console.warn("Backend create fee payment fallback to local state", err);
      });

    const student = students.find(
      (s) =>
        s.id === paymentData.studentId ||
        (s.admissionNo &&
          s.admissionNo.toLowerCase() === paymentData.studentId.toLowerCase()),
    );

    // Ensure student's active ledger exists in nextLedgers and reflects the new payment
    const ledgerIndex = nextLedgers.findIndex(
      (l) =>
        (l.studentId === paymentData.studentId ||
          (student && l.studentId === student.id) ||
          (student?.admissionNo && l.admissionNo === student.admissionNo)) &&
        l.academicYear === activeAY,
    );

    if (ledgerIndex !== -1) {
      const ledger = { ...nextLedgers[ledgerIndex] };
      const payable = ledger.totalPayable || ledger.grossAmount || 0;
      const newPaid = Math.min(
        payable,
        (ledger.paidAmount || 0) + paymentData.amountPaid,
      );
      ledger.paidAmount = newPaid;
      ledger.dueBalance = Math.max(0, payable - newPaid);
      ledger.updatedAt = new Date().toISOString().split("T")[0];
      nextLedgers[ledgerIndex] = ledger;
    } else {
      const freshLedger = getStudentFeeLedger(paymentData.studentId, activeAY);
      const payable = freshLedger.totalPayable || freshLedger.grossAmount || 0;
      const newPaid = Math.min(
        payable,
        (freshLedger.paidAmount || 0) + paymentData.amountPaid,
      );
      const updatedFresh = {
        ...freshLedger,
        paidAmount: newPaid,
        dueBalance: Math.max(0, payable - newPaid),
        updatedAt: new Date().toISOString().split("T")[0],
      };
      nextLedgers.push(updatedFresh);
    }

    setStudentFeeInstallments(nextInstallments);
    localStorage.setItem(
      "edu_db_student_fee_installments",
      JSON.stringify(nextInstallments),
    );

    setStudentFeeLedgers(nextLedgers);
    localStorage.setItem(
      "edu_db_student_fee_ledgers",
      JSON.stringify(nextLedgers),
    );

    // Synchronize Student Balance from updated ledgers
    const remainingTotalDue = nextLedgers
      .filter(
        (l) =>
          l.studentId === paymentData.studentId ||
          (student && l.studentId === student.id) ||
          (student?.admissionNo && l.admissionNo === student.admissionNo),
      )
      .reduce((sum, l) => sum + (l.dueBalance || 0), 0);

    setStudents((prev) =>
      prev.map((s) => {
        const isTarget =
          s.id === paymentData.studentId ||
          (student && s.id === student.id) ||
          (s.admissionNo &&
            s.admissionNo.toLowerCase() ===
              paymentData.studentId.toLowerCase()) ||
          (student?.admissionNo &&
            s.admissionNo?.toLowerCase() === student.admissionNo.toLowerCase());

        if (isTarget) {
          const newPaidTotal = (s.paidFee || 0) + paymentData.amountPaid;
          return {
            ...s,
            paidFee: newPaidTotal,
            dueFee: remainingTotalDue,
          };
        }
        return s;
      }),
    );

    logActivity(
      "Collected Fee",
      `Processed payment of ${formatCurrency(newPayment.amountPaid)} for ${newPayment.studentName}`,
    );

    // Automatic Master Finance Ledger Entry Creation (Synced to Global Academic Year)
    const autoLedgerTxn: FinanceTransaction = {
      id: "TXN-" + Date.now(),
      transactionId:
        "TXN-" +
        activeAY.slice(0, 4) +
        "-" +
        Math.floor(100000 + Math.random() * 900000),
      date: newPayment.paymentDate || new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "Income",
      category: (newPayment as any).feeType || "Student Tuition Fees",
      sourceModule: "Student Fee Collection",
      referenceNumber: newPayment.receiptNo,
      referenceRecordId: newPayment.id,
      description: `Student Fee Collection from ${newPayment.studentName} (${newPayment.className})`,
      amount: newPayment.amountPaid,
      paymentMode: (newPayment.paymentMode as any) || "Cash",
      account: newPayment.paymentMode === "Cash" ? "Cash" : "Main Bank Account",
      branch: (newPayment as any).branch || selectedBranch || "",
      academicYear: activeAY,
      status: "Completed",
      createdBy: "System Auto-Ledger",
      auditTrail: [
        {
          id: "AUD-AUTO-" + Date.now(),
          action: "Created",
          user: "System Auto-Ledger",
          timestamp: new Date().toLocaleString(),
          notes: `Automatically recorded from Student Fee Payment ${newPayment.receiptNo}`,
        },
      ],
    };

    setFinanceTransactions((prev) => {
      const filtered = prev.filter(
        (t) =>
          !(newPayment.receiptNo && t.referenceNumber === newPayment.receiptNo),
      );
      return [autoLedgerTxn, ...filtered];
    });

    // Update Financial Account Balance
    setFinancialAccounts((prev) =>
      prev.map((acc) => {
        if (acc.accountType === autoLedgerTxn.account) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + autoLedgerTxn.amount,
          };
        }
        return acc;
      }),
    );

    return newPayment;
  };

  // Master Finance Ledger CRUD Engine
  const addFinanceTransaction = (
    txnData: Omit<FinanceTransaction, "id" | "transactionId">,
  ): FinanceTransaction => {
    const id = "TXN-" + Date.now();
    const transactionId =
      "TXN-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(100000 + Math.random() * 900000);
    const newTxn: FinanceTransaction = {
      ...txnData,
      id,
      transactionId,
      branch: txnData.branch || selectedBranch || "",
      auditTrail: [
        {
          id: "AUD-" + Date.now(),
          action: "Created",
          user: txnData.createdBy || "Finance Admin",
          timestamp: new Date().toLocaleString(),
          notes: "Master Ledger Entry Created",
        },
      ],
    };

    setFinanceTransactions((prev) => [newTxn, ...prev]);

    // Backend API sync
    FinanceAPI.createFinanceTransactionApi({
      type: newTxn.type,
      sourceModule: newTxn.sourceModule,
      category: newTxn.category,
      description: newTxn.description,
      amount: newTxn.amount,
      paymentMode: newTxn.paymentMode,
      account: newTxn.account,
      transactionDate: newTxn.date,
      branch: newTxn.branch,
      academicYear: newTxn.academicYear,
      notes: newTxn.notes || "",
      attachmentName: (newTxn.attachments && newTxn.attachments[0]) || "",
    })
      .then((apiRes) => {
        if (apiRes?.data?.id) {
          setFinanceTransactions((prev) =>
            prev.map((t) =>
              t.transactionId === transactionId
                ? {
                    ...t,
                    id: String(apiRes.data.id),
                    transactionId: apiRes.data.transactionId || t.transactionId,
                  }
                : t,
            ),
          );
        }
      })
      .catch((err) => {
        console.warn("Backend add finance transaction fallback", err);
      });

    // Update Account Balance
    setFinancialAccounts((prev) =>
      prev.map((acc) => {
        if (acc.accountType === newTxn.account) {
          const delta =
            newTxn.type === "Income" ? newTxn.amount : -newTxn.amount;
          return { ...acc, currentBalance: acc.currentBalance + delta };
        }
        return acc;
      }),
    );

    // Update Budget if Expense
    if (newTxn.type === "Expense") {
      setFinancialBudgets((prev) =>
        prev.map((b) => {
          if (b.categoryName === newTxn.category) {
            const newConsumed = b.consumedAmount + newTxn.amount;
            const newRemaining = Math.max(0, b.allocatedAmount - newConsumed);
            return {
              ...b,
              consumedAmount: newConsumed,
              remainingAmount: newRemaining,
              status: newConsumed > b.allocatedAmount ? "Exceeded" : "Active",
            };
          }
          return b;
        }),
      );
    }

    logActivity(
      "Recorded Financial Transaction",
      `Added ${newTxn.type} ${transactionId} for ${formatCurrency(newTxn.amount)}`,
    );
    return newTxn;
  };

  const reverseFinanceTransaction = (
    transactionId: string,
    reason: string,
    user: string,
  ) => {
    setFinanceTransactions((prev) =>
      prev.map((t) => {
        if (t.transactionId === transactionId || t.id === transactionId) {
          const logItem: TransactionAuditLog = {
            id: "AUD-REV-" + Date.now(),
            action: "Reversed",
            user: user,
            timestamp: new Date().toLocaleString(),
            notes: `Transaction Reversed: ${reason}`,
          };

          // Backend API sync
          const numId = parseInt(t.id, 10);
          if (!isNaN(numId)) {
            FinanceAPI.reverseFinanceTransactionApi(numId, reason).catch(
              (err) => {
                console.warn("Backend reverse transaction fallback", err);
              },
            );
          }

          // Offset Account Balance
          setFinancialAccounts((accs) =>
            accs.map((acc) => {
              if (acc.accountType === t.account) {
                const offsetDelta = t.type === "Income" ? -t.amount : t.amount;
                return {
                  ...acc,
                  currentBalance: acc.currentBalance + offsetDelta,
                };
              }
              return acc;
            }),
          );

          return {
            ...t,
            status: "Reversed",
            auditTrail: [...(t.auditTrail || []), logItem],
          };
        }
        return t;
      }),
    );

    logActivity(
      "Reversed Financial Transaction",
      `Reversed ${transactionId}. Reason: ${reason}`,
    );
  };

  const cancelFinanceTransaction = (
    transactionId: string,
    reason: string,
    user: string,
  ) => {
    reverseFinanceTransaction(transactionId, reason, user);
  };

  const addFinancialAccount = (accountData: Omit<FinancialAccount, "id">) => {
    const id = "ACC-" + Math.floor(10 + Math.random() * 90);
    const newAcc: FinancialAccount = { ...accountData, id };
    setFinancialAccounts((prev) => [...prev, newAcc]);

    // Backend API sync
    FinanceAPI.createFinancialAccountApi({
      accountName: newAcc.accountName,
      accountType: newAcc.accountType,
      accountNumber: newAcc.accountNumber || "",
      bankName: newAcc.bankName || "",
      branchName: newAcc.branchName || "",
      currentBalance: newAcc.currentBalance,
      currency: newAcc.currency || "INR",
      status: newAcc.status || "Active",
    })
      .then((apiRes) => {
        if (apiRes?.data?.id) {
          setFinancialAccounts((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, id: String(apiRes.data.id) } : a,
            ),
          );
        }
      })
      .catch((err) => {
        console.warn("Backend add financial account fallback", err);
      });

    logActivity(
      "Created Financial Account",
      `Added Account ${newAcc.accountName}`,
    );
  };

  const updateFinancialAccount = (
    id: string,
    updates: Partial<FinancialAccount>,
  ) => {
    setFinancialAccounts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...updates };
          const numId = parseInt(id, 10);
          if (!isNaN(numId)) {
            FinanceAPI.updateFinancialAccountApi(numId, updated).catch(
              (err) => {
                console.warn("Backend update financial account fallback", err);
              },
            );
          }
          return updated;
        }
        return a;
      }),
    );
  };

  const addFinancialCategory = (
    categoryData: Omit<FinancialCategory, "id">,
  ) => {
    const id = "CAT-" + Math.floor(100 + Math.random() * 900);
    const newCat: FinancialCategory = { ...categoryData, id };
    setFinancialCategories((prev) => [...prev, newCat]);

    // Backend API sync
    FinanceAPI.createFinancialCategoryApi({
      name: newCat.name,
      type: newCat.type,
      sourceModule: newCat.sourceModule || "Manual",
      status: newCat.status || "Active",
      isSystem: newCat.isSystem || false,
    })
      .then((apiRes) => {
        if (apiRes?.data?.id) {
          setFinancialCategories((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, id: String(apiRes.data.id) } : c,
            ),
          );
        }
      })
      .catch((err) => {
        console.warn("Backend add financial category fallback", err);
      });

    logActivity(
      "Created Financial Category",
      `Added ${newCat.type} Category ${newCat.name}`,
    );
  };

  const updateFinancialCategory = (
    id: string,
    updates: Partial<FinancialCategory>,
  ) => {
    setFinancialCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          const numId = parseInt(id, 10);
          if (!isNaN(numId)) {
            FinanceAPI.updateFinancialCategoryApi(numId, updated).catch(
              (err) => {
                console.warn("Backend update category fallback", err);
              },
            );
          }
          return updated;
        }
        return c;
      }),
    );
  };

  const deleteFinancialAccount = async (id: string) => {
    setFinancialAccounts((prev) => {
      const next = prev.filter((a) => String(a.id) !== String(id));
      try {
        localStorage.setItem("financial_accounts", JSON.stringify(next));
        localStorage.setItem("edu_db_financial_accounts", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await FinanceAPI.deleteFinancialAccountApi(numId);
      } catch (err) {
        console.warn("Backend delete financial account fallback", err);
      }
    }
  };

  const deleteFinancialCategory = async (id: string) => {
    setFinancialCategories((prev) => {
      const next = prev.filter((c) => String(c.id) !== String(id));
      try {
        localStorage.setItem("financial_categories", JSON.stringify(next));
        localStorage.setItem(
          "edu_db_financial_categories",
          JSON.stringify(next),
        );
      } catch (e) {}
      return next;
    });
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await FinanceAPI.deleteFinancialCategoryApi(numId);
      } catch (err) {
        console.warn("Backend delete financial category fallback", err);
      }
    }
  };

  const addFinancialBudget = async (
    budgetData: Omit<
      FinancialBudget,
      "id" | "consumedAmount" | "remainingAmount"
    >,
  ) => {
    const payload = {
      categoryName: budgetData.categoryName,
      department: (budgetData as any).department || budgetData.categoryName,
      academicYear: budgetData.academicYear || selectedAcademicYear || "",
      branch: budgetData.branch || selectedBranch || "",
      allocatedAmount: Number(budgetData.allocatedAmount) || 0,
      status: budgetData.status || "Active",
    };
    try {
      const res = await FinanceAPI.saveFinancialBudgetApi(payload);
      const saved = res?.data || res;
      const newBudget: FinancialBudget = {
        id: String(saved?.id || "BDG-" + Date.now()),
        categoryName: saved?.categoryName || payload.categoryName,
        academicYear: saved?.academicYear || payload.academicYear,
        branch: saved?.branch || payload.branch,
        allocatedAmount: Number(
          saved?.allocatedAmount ?? payload.allocatedAmount,
        ),
        consumedAmount: Number(saved?.consumedAmount ?? 0),
        remainingAmount: Math.max(
          0,
          Number(saved?.allocatedAmount ?? payload.allocatedAmount) -
            Number(saved?.consumedAmount ?? 0),
        ),
        status: saved?.status || "Active",
      };
      setFinancialBudgets((prev) => [...prev, newBudget]);
      addToast({
        title: "Budget Allocated",
        description: `Successfully allocated budget for ${newBudget.categoryName}`,
        type: "success",
      });
      return newBudget;
    } catch (err: any) {
      console.error("Failed to allocate budget", err);
      const fallbackBudget: FinancialBudget = {
        id: "BDG-" + Date.now(),
        categoryName: payload.categoryName,
        academicYear: payload.academicYear,
        branch: payload.branch,
        allocatedAmount: payload.allocatedAmount,
        consumedAmount: 0,
        remainingAmount: payload.allocatedAmount,
        status: "Active",
      };
      setFinancialBudgets((prev) => [...prev, fallbackBudget]);
      return fallbackBudget;
    }
  };

  const updateFinancialBudget = async (
    id: string,
    allocatedAmount: number,
    extra?: Partial<FinancialBudget>,
  ) => {
    const target = financialBudgets.find((b) => b.id === id);
    const categoryName =
      extra?.categoryName || target?.categoryName || "General";
    const academicYear =
      extra?.academicYear || target?.academicYear || selectedAcademicYear || "";
    const branch = extra?.branch || target?.branch || selectedBranch || "";
    const consumed = target ? target.consumedAmount : 0;
    const remaining = Math.max(0, allocatedAmount - consumed);
    const status =
      consumed > allocatedAmount
        ? "Exceeded"
        : extra?.status || target?.status || "Active";

    const updated: FinancialBudget = {
      id,
      categoryName,
      academicYear,
      branch,
      allocatedAmount,
      consumedAmount: consumed,
      remainingAmount: remaining,
      status: status as any,
    };

    setFinancialBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));

    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await FinanceAPI.updateFinancialBudgetApi(numId, {
          id: numId,
          categoryName,
          department: categoryName,
          academicYear,
          branch,
          allocatedAmount,
          consumedAmount: consumed,
          status,
        });
      } catch (err) {
        console.warn("Backend update budget fallback", err);
      }
    }
    return true;
  };

  const deleteFinancialBudget = async (id: string) => {
    const numId = parseInt(id, 10);
    setFinancialBudgets((prev) => prev.filter((b) => b.id !== id));
    if (!isNaN(numId)) {
      try {
        await FinanceAPI.deleteFinancialBudgetApi(numId);
        addToast({
          title: "Budget Deleted",
          description: "Budget record has been removed.",
          type: "success",
        });
      } catch (err) {
        console.warn("Backend delete budget fallback", err);
      }
    }
    return true;
  };

  // ==========================================
  // ERP FINANCE SYSTEM CRUD & ENGINE
  // ==========================================

  const addFeeHead = async (head: Omit<FeeHead, "id">) => {
    // Duplicate validation check using Exception Handling
    const cleanCode = (head.code || "").trim().toLowerCase();
    const cleanName = (head.name || "").trim().toLowerCase();
    const existingDup = feeHeads.find(
      (h) =>
        (cleanCode && h.code && h.code.trim().toLowerCase() === cleanCode) ||
        (cleanName &&
          h.name &&
          h.name.trim().toLowerCase() === cleanName &&
          h.category === head.category),
    );

    if (existingDup) {
      if (
        existingDup.code &&
        existingDup.code.trim().toLowerCase() === cleanCode
      ) {
        throw new Error(
          `Duplicate Validation Error: Fee head code '${head.code}' already exists.`,
        );
      } else {
        throw new Error(
          `Duplicate Validation Error: Fee head '${head.name}' in category '${head.category}' already exists.`,
        );
      }
    }

    const payloadWithAy = {
      ...head,
      academicYear: head.academicYear || selectedAcademicYear || "All",
      applicableBranches:
        head.applicableBranches && head.applicableBranches.length > 0
          ? head.applicableBranches
          : ["All Branches"],
    };

    try {
      const response = await FinanceAPI.createFeeHeadApi(payloadWithAy);
      const resData = response?.data || response;
      const newHead: FeeHead = {
        ...payloadWithAy,
        id: resData?.id
          ? String(resData.id)
          : "FH-" + Math.floor(100 + Math.random() * 900),
        code: resData?.code || head.code,
      };
      setFeeHeads((prev) => {
        const next = deduplicateFeeHeads([newHead, ...prev]);
        try {
          localStorage.setItem("fee_heads", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      logActivity(
        "Created Fee Head",
        `Added ${newHead.name} (${(newHead as any).code || ""})`,
      );
    } catch (err) {
      console.warn("API failed, using local", err);
      const id = "FH-" + Math.floor(100 + Math.random() * 900);
      const newHead: FeeHead = {
        ...payloadWithAy,
        id,
      };
      setFeeHeads((prev) => {
        const next = deduplicateFeeHeads([newHead, ...prev]);
        try {
          localStorage.setItem("fee_heads", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      logActivity(
        "Created Fee Head",
        `Added ${newHead.name} (${(newHead as any).code || ""})`,
      );
    }
  };

  const updateFeeHead = async (id: string, updates: Partial<FeeHead>) => {
    const stringId = String(id);
    const numId = Number(id);

    // Duplicate validation check using Exception Handling
    const cleanCode = (updates.code || "").trim().toLowerCase();
    const cleanName = (updates.name || "").trim().toLowerCase();
    if (cleanCode || cleanName) {
      const existingDup = feeHeads.find(
        (h) =>
          String(h.id) !== stringId &&
          ((cleanCode && h.code && h.code.trim().toLowerCase() === cleanCode) ||
            (cleanName &&
              h.name &&
              h.name.trim().toLowerCase() === cleanName &&
              (updates.category ? h.category === updates.category : true))),
      );
      if (existingDup) {
        throw new Error(
          `Duplicate Validation Error: A fee head with code '${updates.code || existingDup.code}' or name '${updates.name || existingDup.name}' already exists.`,
        );
      }
    }

    setFeeHeads((prev) => {
      const next: FeeHead[] = deduplicateFeeHeads(
        prev.map((f) => (String(f.id) === stringId ? { ...f, ...updates } : f)),
      );
      try {
        localStorage.setItem("fee_heads", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (updates.name) {
      const newName = updates.name;
      const targetHead = feeHeads.find((f) => String(f.id) === stringId);
      const oldName = targetHead?.name;

      setFeeStructures((prev) =>
        prev.map((fs: any) => ({
          ...fs,
          items: ((fs as any).items || []).map((i: any) => {
            if (
              (i.feeHeadId && String(i.feeHeadId) === stringId) ||
              (oldName &&
                i.feeHeadName &&
                String(i.feeHeadName).toLowerCase() ===
                  String(oldName).toLowerCase())
            ) {
              return { ...i, feeHeadName: newName };
            }
            return i;
          }),
        })),
      );

      setDynamicFeeStructures((prev) =>
        prev.map((dfs) => ({
          ...dfs,
          items: (dfs.items || []).map((i) => {
            if (
              (i.feeHeadId && String(i.feeHeadId) === stringId) ||
              (oldName &&
                i.feeHeadName &&
                String(i.feeHeadName).toLowerCase() ===
                  String(oldName).toLowerCase())
            ) {
              return { ...i, feeHeadName: newName };
            }
            return i;
          }),
        })),
      );
    }

    try {
      const existing = feeHeads.find((f) => String(f.id) === stringId);
      const merged = { ...existing, ...updates };
      const payload = {
        id: !isNaN(numId) ? numId : 0,
        name: merged.name || "",
        code: merged.code || "",
        category: merged.category || "Tuition",
        frequency: merged.frequency || "Quarterly",
        defaultAmount: Number(merged.defaultAmount ?? merged.amount ?? 0),
        mandatory: merged.mandatory === true,
        isRefundable: (merged as any).isRefundable ?? false,
        isTaxable: (merged as any).isTaxable ?? (merged.taxPercentage || 0) > 0,
        taxPercentage: Number(merged.taxPercentage || 0),
        displayOrder: Number(merged.displayOrder || 1),
        status: merged.status || "Active",
        description: (merged as any).description || "",
        academicYear: merged.academicYear || "All",
        applicableClasses: Array.isArray(merged.applicableClasses)
          ? merged.applicableClasses
          : [],
        applicableBranches:
          Array.isArray(merged.applicableBranches) &&
          merged.applicableBranches.length > 0
            ? merged.applicableBranches
            : ["All Branches"],
        paymentEligibility:
          merged.paymentEligibility || "Both One-Time and Term-Wise",
        applicableTerms: Array.isArray(merged.applicableTerms)
          ? merged.applicableTerms
          : [],
        applicableSections: Array.isArray(merged.applicableSections)
          ? merged.applicableSections
          : [],
        hostelBlockId: merged.hostelBlockId || "",
        hostelBlockName: merged.hostelBlockName || "",
        hostelRoomId: merged.hostelRoomId || "",
        hostelRoomNo: merged.hostelRoomNo || "",
        hostelSharingType: merged.hostelSharingType || "",
        transportRouteId: merged.transportRouteId || "",
        transportRouteName: merged.transportRouteName || "",
        transportVehicleId: merged.transportVehicleId || "",
        transportVehicleNo: merged.transportVehicleNo || "",
        transportStopId: merged.transportStopId || "",
        transportStopName: merged.transportStopName || "",
        uniformItemId: merged.uniformItemId || "",
        uniformItemName: merged.uniformItemName || "",
        uniformSize: merged.uniformSize || "",
      };

      if (!isNaN(numId) && numId > 0) {
        await FinanceAPI.updateFeeHeadApi(numId, payload);
      }
    } catch (err) {
      console.error("Failed to persist fee head update to backend:", err);
    }

    logActivity("Updated Fee Head", `Updated Fee Head ID ${id}`);
  };

  const deleteFeeHead = async (id: string) => {
    const stringId = String(id);
    const numId = Number(id);

    const targetHead = feeHeads.find((f) => String(f.id) === stringId);
    const targetHeadName = targetHead?.name?.trim().toLowerCase();

    setFeeHeads((prev) => {
      const next = prev.filter((f) => String(f.id) !== stringId);
      try {
        localStorage.setItem("fee_heads", JSON.stringify(next));
        localStorage.setItem("edu_db_fee_heads", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Cascade deletion to dynamic fee structures (fee structure container remains, only deleted fee head item is removed)
    setDynamicFeeStructures((prev) => {
      const updated = prev.map((s) => {
        const items = s.items || [];
        const remainingItems = items.filter((item) => {
          const iHeadId = String(item.feeHeadId || (item as any).headId || "")
            .trim()
            .toLowerCase();
          const iHeadName = (item.feeHeadName || (item as any).name || "")
            .trim()
            .toLowerCase();
          const matchesId =
            iHeadId === stringId.toLowerCase() ||
            (targetHead?.code &&
              iHeadId === targetHead.code.trim().toLowerCase());
          const matchesName = Boolean(
            targetHeadName && iHeadName === targetHeadName,
          );
          return !matchesId && !matchesName;
        });

        // If no items were removed, retain as is
        if (remainingItems.length === items.length) {
          return s;
        }

        const newTotal = remainingItems.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0,
        );
        return {
          ...s,
          items: remainingItems,
          totalAmount: newTotal,
        };
      });

      const remainingStructIds = new Set(updated.map((s) => String(s.id)));
      setStudentFeeAssignments((prevAssignments) => {
        const nextAssigns = prevAssignments
          .map((a) => {
            if (
              a.feeStructureId &&
              !remainingStructIds.has(String(a.feeStructureId))
            ) {
              return null;
            }
            if (updated.length === 0) {
              return null;
            }
            const struct = updated.find(
              (s) => String(s.id) === String(a.feeStructureId),
            );
            const newTotal = struct ? struct.totalAmount : a.baseFeeTotal;
            return {
              ...a,
              baseFeeTotal: newTotal,
              originalFeeTotal: newTotal,
            };
          })
          .filter(Boolean) as StudentFeeAssignment[];

        try {
          localStorage.setItem(
            "student_fee_assignments",
            JSON.stringify(nextAssigns),
          );
          localStorage.setItem(
            "edu_db_student_fee_assignments",
            JSON.stringify(nextAssigns),
          );
        } catch (e) {}
        return nextAssigns;
      });

      setStudents((prevStudents) => {
        const nextStudents = prevStudents.map((st) => {
          const matchingStructure = updated.find((s) =>
            matchesClassName(s.className, st.className),
          );
          const newFee = matchingStructure ? matchingStructure.totalAmount : 0;
          return {
            ...st,
            totalFee: newFee,
            dueFee: Math.max(0, newFee - (st.paidFee || 0)),
          };
        });
        return nextStudents;
      });

      try {
        localStorage.setItem("dynamic_fee_structures", JSON.stringify(updated));
        localStorage.setItem(
          "edu_db_dynamic_fee_structures",
          JSON.stringify(updated),
        );
      } catch (e) {}

      // Persist updated fee structures to backend so changes are saved in MySQL
      updated.forEach((s) => {
        if (s.id) {
          FinanceAPI.updateDynamicFeeStructureApi(String(s.id), s as any).catch(
            () => {},
          );
        }
      });

      return updated;
    });

    try {
      if (!isNaN(numId) && numId > 0) {
        await FinanceAPI.deleteFeeHeadApi(numId);
      }
    } catch (err) {
      console.error("Failed to delete fee head from backend:", err);
    }

    logActivity("Deleted Fee Head", `Removed Fee Head ID ${id}`);
  };

  const toggleFeeHeadStatus = async (id: string) => {
    const stringId = String(id);
    const numId = Number(id);

    setFeeHeads((prev) => {
      const next: FeeHead[] = prev.map((f) =>
        String(f.id) === stringId
          ? {
              ...f,
              status: (f.status === "Active" ? "Inactive" : "Active") as
                | "Active"
                | "Inactive",
            }
          : f,
      );
      try {
        localStorage.setItem("fee_heads", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      if (!isNaN(numId) && numId > 0) {
        await FinanceAPI.toggleFeeHeadStatusApi(numId);
      }
    } catch (err) {
      console.error("Failed to toggle fee head status on backend:", err);
    }
  };

  // Helper to propagate fee structure changes to all students of the target class
  const applyFeeStructureToClassStudents = (dfs: DynamicFeeStructure) => {
    if (!dfs.className) return;

    const classStudents = students.filter(
      (s) =>
        s.className === dfs.className ||
        (s as any).appliedClass === dfs.className,
    );

    if (classStudents.length === 0) return;

    setStudentFeeAssignments((prev) => {
      let updated = [...prev];
      classStudents.forEach((st) => {
        const existingIdx = updated.findIndex(
          (a) => a.studentId === st.id && a.academicYear === dfs.academicYear,
        );
        const newAssign: StudentFeeAssignment = {
          id:
            existingIdx !== -1
              ? updated[existingIdx].id
              : `SFA-${st.id}-${dfs.academicYear}`,
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          admissionNo: st.admissionNo,
          branch: st.branch || selectedBranch || "",
          academicYear: dfs.academicYear,
          className: st.className,
          section: st.section,
          feeStructureId: dfs.id,
          assignedFeeHeads: dfs.items,
          baseFeeTotal: dfs.totalAmount,
          assignedDate: new Date().toISOString().split("T")[0],
          status: "Active",
        };
        if (existingIdx !== -1) {
          updated[existingIdx] = newAssign;
        } else {
          updated.push(newAssign);
        }
      });
      return updated;
    });

    setStudents((prev) =>
      prev.map((s) => {
        if (s.className === dfs.className) {
          return {
            ...s,
            totalFee: dfs.totalAmount,
            dueFee: Math.max(0, dfs.totalAmount - (s.paidFee || 0)),
          };
        }
        return s;
      }),
    );

    setTimeout(() => {
      classStudents.forEach((st) => {
        generateStudentFeeLedger(st.id, dfs.academicYear);
      });
    }, 100);
  };

  // 2. Dynamic Fee Structures CRUD
  const addDynamicFeeStructure = async (
    dfs: Omit<DynamicFeeStructure, "id">,
  ) => {
    let id = "DFS-" + Math.floor(100 + Math.random() * 900);
    try {
      const res = await FinanceAPI.createDynamicFeeStructureApi(dfs);
      if (res && res.data && res.data.id) {
        id = res.data.id.toString();
      } else if (res && res.id) {
        id = res.id.toString();
      }
    } catch (err) {
      console.warn("API failed, using local", err);
    }
    const newDfs: DynamicFeeStructure = {
      ...dfs,
      id,
      branch: dfs.branch || selectedBranch || "",
    };
    setDynamicFeeStructures((prev) => {
      const isHostel = newDfs.category === "Hostel";
      const normClass = (newDfs.className || "").trim().toLowerCase();
      const normHostel = (newDfs.hostelName || "").trim().toLowerCase();
      const filtered = prev.filter((d) => {
        if (String(d.id) === String(id)) return false;
        if (isHostel) {
          return !(
            d.category === "Hostel" &&
            (d.hostelName || "").trim().toLowerCase() === normHostel &&
            (!d.academicYear || d.academicYear === newDfs.academicYear)
          );
        } else {
          return (
            d.category === "Hostel" ||
            (d.className || "").trim().toLowerCase() !== normClass
          );
        }
      });
      const updated = [...filtered, newDfs];
      try {
        localStorage.setItem("dynamic_fee_structures", JSON.stringify(updated));
        localStorage.setItem(
          "edu_db_dynamic_fee_structures",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
    if (newDfs.category !== "Hostel") {
      applyFeeStructureToClassStudents(newDfs);
    }
    logActivity(
      "Created Dynamic Fee Structure",
      `Added structure for ${newDfs.category === "Hostel" ? newDfs.hostelName || "Hostel" : newDfs.className}`,
    );
  };

  const updateDynamicFeeStructure = async (
    id: string,
    updates: Partial<DynamicFeeStructure>,
  ) => {
    const existing = dynamicFeeStructures.find(
      (d) => String(d.id) === String(id),
    );
    const updatedDfs: DynamicFeeStructure = {
      ...(existing ||
        ({ id, className: "", items: [], totalAmount: 0 } as any)),
      ...updates,
    };

    setDynamicFeeStructures((prev) => {
      const next = prev.map((d) =>
        String(d.id) === String(id) ? updatedDfs : d,
      );
      try {
        localStorage.setItem("dynamic_fee_structures", JSON.stringify(next));
        localStorage.setItem(
          "edu_db_dynamic_fee_structures",
          JSON.stringify(next),
        );
      } catch (e) {}
      return next;
    });
    try {
      await FinanceAPI.updateDynamicFeeStructureApi(id, updatedDfs);
    } catch (err) {
      console.warn("API update dynamic fee structure failed:", err);
    }
    if (updatedDfs.category !== "Hostel") {
      applyFeeStructureToClassStudents(updatedDfs);
    }
    logActivity("Updated Dynamic Fee Structure", `Updated structure ID ${id}`);
  };

  const deleteDynamicFeeStructure = async (id: string) => {
    const target = dynamicFeeStructures.find(
      (d) => String(d.id) === String(id),
    );
    const targetClass = target?.className;
    const isHostel = target?.category === "Hostel";
    let remainingStructures: DynamicFeeStructure[] = [];
    setDynamicFeeStructures((prev) => {
      const filtered = prev.filter((d) => {
        if (String(d.id) === String(id)) return false;
        if (
          !isHostel &&
          targetClass &&
          d.className &&
          d.className.toLowerCase().trim() ===
            targetClass.toLowerCase().trim() &&
          (!target?.academicYear ||
            !d.academicYear ||
            d.academicYear === target.academicYear)
        ) {
          return false;
        }
        return true;
      });
      remainingStructures = filtered;
      try {
        localStorage.setItem(
          "dynamic_fee_structures",
          JSON.stringify(filtered),
        );
        localStorage.setItem(
          "edu_db_dynamic_fee_structures",
          JSON.stringify(filtered),
        );
      } catch (e) {}
      return filtered;
    });

    setStudentFeeAssignments((prev) => {
      const filtered = prev.filter((a) => {
        if (
          String(a.feeStructureId) === String(id) ||
          String((a as any).dynamicFeeStructureId) === String(id)
        ) {
          return false;
        }
        if (
          !isHostel &&
          targetClass &&
          a.className &&
          matchesClassName(a.className, targetClass)
        ) {
          return false;
        }
        return true;
      });
      try {
        localStorage.setItem(
          "student_fee_assignments",
          JSON.stringify(filtered),
        );
        localStorage.setItem(
          "edu_db_student_fee_assignments",
          JSON.stringify(filtered),
        );
      } catch (e) {}
      return filtered;
    });

    setStudents((prev) => {
      const nextStudents = prev.map((s) => {
        if (
          !isHostel &&
          targetClass &&
          matchesClassName(s.className, targetClass)
        ) {
          const otherStructure = remainingStructures.find((d) =>
            matchesClassName(d.className, s.className),
          );
          const newFee = otherStructure ? otherStructure.totalAmount : 0;
          return {
            ...s,
            totalFee: newFee,
            dueFee: Math.max(0, newFee - (s.paidFee || 0)),
          };
        }
        return s;
      });
      return nextStudents;
    });

    try {
      await FinanceAPI.deleteDynamicFeeStructureApi(id);
    } catch (err) {
      console.warn("API delete dynamic fee structure failed:", err);
    }
    logActivity("Deleted Dynamic Fee Structure", `Removed structure ID ${id}`);
  };

  // 3. Student Fee Assignment
  const assignFeeStructure = async (
    studentId: string,
    feeStructureId: string,
  ) => {
    const st = students.find((s) => s.id === studentId);
    const dfs = dynamicFeeStructures.find((d) => d.id === feeStructureId);
    if (!st || !dfs) return;

    const id = "SFA-" + Math.floor(100 + Math.random() * 900);
    const assignment: StudentFeeAssignment = {
      id,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      branch: st.branch || selectedBranch || "",
      academicYear: dfs.academicYear,
      className: st.className,
      section: st.section,
      feeStructureId: dfs.id,
      assignedFeeHeads: dfs.items,
      baseFeeTotal: dfs.totalAmount,
      assignedDate: new Date().toISOString().split("T")[0],
      status: "Active",
    };

    try {
      await FinanceAPI.createStudentFeeAssignmentApi(assignment);
    } catch (err) {
      console.warn("API failed, using local", err);
    }

    setStudentFeeAssignments((prev) => [
      ...prev.filter(
        (a) =>
          !(a.studentId === studentId && a.academicYear === dfs.academicYear),
      ),
      assignment,
    ]);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              totalFee: dfs.totalAmount,
              dueFee: Math.max(0, dfs.totalAmount - s.paidFee),
            }
          : s,
      ),
    );
    logActivity(
      "Assigned Fee Structure",
      `Assigned ${dfs.className} structure to ${st.firstName} ${st.lastName}`,
    );

    setTimeout(() => generateStudentFeeLedger(studentId, dfs.academicYear), 50);
  };

  const assignCustomFeeStructure = async (
    studentId: string,
    feeStructureId: string,
    feePolicy: FeePolicyType,
    customBreakdown?: FeeHeadAssignmentBreakdown[],
    adjustmentReason?: string,
    admissionDate?: string,
  ) => {
    const st = students.find((s) => s.id === studentId);
    const dfs = dynamicFeeStructures.find((d) => d.id === feeStructureId);
    if (!st || !dfs) return;

    let originalTotal = 0;
    let assignedTotal = 0;
    const finalBreakdown: FeeHeadAssignmentBreakdown[] = [];
    const assignedHeads: FeeStructureItem[] = [];

    // Pro-rata / Monthly pro-rated multiplier calculation
    let proRataFactor = 1.0;
    if (
      (feePolicy === "Pro-rata" ||
        feePolicy === "Monthly Pro-rated Fee" ||
        feePolicy === "Monthly Pro-rated" ||
        (feePolicy as string) === "Monthly") &&
      admissionDate
    ) {
      const admMonth = new Date(admissionDate).getMonth() + 1; // 1-12
      // Standard academic year June (6) to May (5) = 12 months
      const remainingMonths = Math.max(
        1,
        12 - (admMonth >= 6 ? admMonth - 6 : admMonth + 6),
      );
      proRataFactor = remainingMonths / 12;
    } else if (feePolicy === "Term-wise" || feePolicy === "Term-wise Fee") {
      proRataFactor = 1.0;
    }

    dfs.items.forEach((item) => {
      const orig = item.amount;
      originalTotal += orig;
      let assignedAmt = orig;
      let isProRataEligible = false;

      const fh = feeHeads.find(
        (f) =>
          f.id === item.feeHeadId ||
          f.name?.toLowerCase() === item.feeHeadName?.toLowerCase(),
      );
      const eligibility =
        item.paymentEligibility ||
        fh?.paymentEligibility ||
        "Both One-Time and Term-Wise";
      const isOneTimeOnly = eligibility === "One-Time Only";

      // Fee head configuration check: Monthly / Quarterly / Term heads are pro-rata eligible
      const hNameLower = item.feeHeadName.toLowerCase();
      const categoryLower = (item.category || "").toLowerCase();
      if (
        !isOneTimeOnly &&
        (hNameLower.includes("tuition") ||
          hNameLower.includes("transport") ||
          hNameLower.includes("mess") ||
          hNameLower.includes("monthly") ||
          categoryLower.includes("tuition") ||
          categoryLower.includes("transport") ||
          categoryLower.includes("mess"))
      ) {
        isProRataEligible = true;
      }

      const matchingBreakdownItem = customBreakdown?.find(
        (c) =>
          c.feeHeadId === item.feeHeadId ||
          c.feeHeadName.toLowerCase() === item.feeHeadName.toLowerCase(),
      );

      const isSelected = isOneTimeOnly
        ? true
        : matchingBreakdownItem
          ? matchingBreakdownItem.isSelected !== false
          : true;

      if (isOneTimeOnly) {
        assignedAmt = orig;
      } else if (!isSelected) {
        assignedAmt = 0;
      } else if (
        matchingBreakdownItem &&
        typeof matchingBreakdownItem.assignedAmount === "number"
      ) {
        assignedAmt = matchingBreakdownItem.assignedAmount;
      } else if (
        feePolicy === "Pro-rata" ||
        feePolicy === "Monthly Pro-rated Fee" ||
        feePolicy === "Monthly Pro-rated" ||
        feePolicy === "Term-wise" ||
        feePolicy === "Term-wise Fee"
      ) {
        if (isProRataEligible) {
          assignedAmt = Math.round(orig * proRataFactor);
        } else {
          assignedAmt = orig; // One-time / annual fee heads remain whole
        }
      } else {
        assignedAmt = orig; // Full Annual Fee
      }

      assignedTotal += assignedAmt;

      finalBreakdown.push({
        feeHeadId: item.feeHeadId,
        feeHeadName: item.feeHeadName,
        category:
          item.category ||
          (item.feeHeadName.includes("Tuition")
            ? "Tuition Fee"
            : item.feeHeadName.includes("Transport")
              ? "Transport Fee"
              : "Other Fee"),
        originalAmount: orig,
        assignedAmount: assignedAmt,
        adjustmentAmount: assignedAmt - orig,
        isEligibleForProRata: isProRataEligible,
        isSelected: isSelected,
        paymentEligibility: eligibility as any,
      });

      assignedHeads.push({
        ...item,
        amount: assignedAmt,
        paymentEligibility: eligibility as any,
      });
    });

    const id = "SFA-" + Math.floor(100 + Math.random() * 900);
    const assignment: StudentFeeAssignment = {
      id,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      branch: st.branch || selectedBranch || "",
      academicYear: dfs.academicYear,
      className: st.className,
      section: st.section,
      feeStructureId: dfs.id,
      assignedFeeHeads: assignedHeads,
      baseFeeTotal: assignedTotal,
      originalFeeTotal: originalTotal,
      adjustmentTotal: assignedTotal - originalTotal,
      feePolicy,
      feeBreakdown: finalBreakdown,
      adjustmentReason: adjustmentReason || `${feePolicy} adjustment`,
      assignedDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString().split("T")[0],
      status: "Active",
    };

    try {
      await FinanceAPI.saveCustomStudentFeeAssignmentApi({
        studentId: st.id,
        dynamicFeeStructureId: dfs.id,
        feePolicy,
        admissionDate,
        adjustmentReason,
        totalAmount: assignedTotal,
        breakdown: finalBreakdown,
      });
    } catch (err) {
      console.warn("API failed, using local", err);
    }

    setStudentFeeAssignments((prev) => [
      ...prev.filter(
        (a) =>
          !(a.studentId === studentId && a.academicYear === dfs.academicYear),
      ),
      assignment,
    ]);

    logActivity(
      "Assigned Fee Policy",
      `Assigned ${feePolicy} (${formatCurrency(assignedTotal)}) to ${st.firstName} ${st.lastName} for ${dfs.academicYear}`,
    );

    setTimeout(() => generateStudentFeeLedger(studentId, dfs.academicYear), 50);
  };

  const bulkAssignFeeStructure = async (
    studentIds: string[],
    feeStructureId: string,
  ) => {
    studentIds.forEach((id) => assignFeeStructure(id, feeStructureId));

    try {
      await FinanceAPI.bulkAssignStudentFeesApi({
        studentIds,
        dynamicFeeStructureId: feeStructureId,
      });
    } catch (err) {
      console.warn("Bulk assignment API failed, using local", err);
    }
  };

  const updateStudentFeeAssignment = (
    id: string,
    updates: Partial<StudentFeeAssignment>,
  ) => {
    setDbAssignments((prev) =>
      prev.map((a) =>
        a.id === id || a.dynamicFeeStructureId?.toString() === id
          ? { ...a, ...updates }
          : a,
      ),
    );
  };

  const removeStudentFeeAssignment = (id: string) => {
    setDbAssignments((prev) =>
      prev.filter(
        (a) => a.id !== id && a.dynamicFeeStructureId?.toString() !== id,
      ),
    );
  };

  // 4. Scholarships CRUD
  const addScholarship = async (sch: Omit<Scholarship, "id">) => {
    let newSch: Scholarship = {
      ...sch,
      id: sch.code || "SCH-" + Math.floor(100 + Math.random() * 900),
    };
    try {
      const res: any = await FinanceAPI.createScholarshipApi({
        name: sch.name,
        code: sch.code,
        type: sch.type,
        discountType: sch.discountType,
        percentage: sch.percentage || 0,
        fixedAmount: sch.fixedAmount || 0,
        applicableFeeHeadIds: sch.applicableFeeHeadIds || [],
        applicableClasses: sch.applicableClasses || [],
        startDate: sch.startDate || "",
        endDate: sch.endDate || "",
        eligibility: sch.eligibility || "",
        description: sch.description || "",
        status: sch.status || "Active",
      });
      const data = res?.data || res;
      if (data?.id) {
        newSch = {
          ...sch,
          id: String(data.id),
          code: data.code || sch.code,
        };
      }
    } catch (err) {
      console.warn("Could not persist scholarship to API:", err);
    }
    setScholarships((prev) => [
      ...prev.filter((s) => s.id !== newSch.id && s.code !== newSch.code),
      newSch,
    ]);
    logActivity("Created Scholarship", `Added scholarship ${newSch.name}`);
  };

  const updateScholarship = async (
    id: string,
    updates: Partial<Scholarship>,
  ) => {
    setScholarships((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await FinanceAPI.updateScholarshipApi(numId, updates);
      }
    } catch (err) {
      console.warn("Could not update scholarship via API:", err);
    }
  };

  const deleteScholarship = async (id: string) => {
    setScholarships((prev) => prev.filter((s) => s.id !== id));
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await FinanceAPI.deleteScholarshipApi(numId);
      }
    } catch (err) {
      console.warn("Could not delete scholarship via API:", err);
    }
  };

  const assignScholarshipToStudent = async (
    studentId: string,
    scholarshipId: string,
  ) => {
    const st = students.find((s) => s.id === studentId);
    const sch = scholarships.find(
      (s) => s.id === scholarshipId || s.code === scholarshipId,
    );
    if (!st || !sch) return;

    let awardId = "SSCH-" + Math.floor(100 + Math.random() * 900);
    const numSchId = parseInt(sch.id, 10) || 1;
    try {
      const res: any = await FinanceAPI.awardStudentScholarshipApi({
        studentId: st.admissionNo || st.id,
        scholarshipId: numSchId,
        remarks: "Awarded via Scholarship Management",
      });
      const data = res?.data || res;
      if (data?.id) awardId = String(data.id);
    } catch (err) {
      console.warn("Could not award scholarship via API:", err);
    }

    const newAlloc: StudentScholarship = {
      id: awardId,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      scholarshipId: sch.id,
      scholarshipName: sch.name,
      discountType: sch.discountType,
      discountValue:
        sch.discountType === "Percentage"
          ? sch.percentage || 0
          : sch.fixedAmount || 0,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Active",
    };

    setStudentScholarships((prev) => [
      ...prev.filter(
        (s) => s.studentId !== studentId || s.scholarshipId !== scholarshipId,
      ),
      newAlloc,
    ]);
    logActivity(
      "Allocated Scholarship",
      `Assigned ${sch.name} to ${st.firstName} ${st.lastName}`,
    );

    setTimeout(() => recalculateStudentFeeLedger(studentId), 50);
  };

  const revokeStudentScholarship = async (id: string) => {
    setStudentScholarships((prev) => prev.filter((s) => s.id !== id));
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await FinanceAPI.revokeStudentScholarshipApi(numId);
      }
    } catch (err) {
      console.warn("Could not revoke scholarship via API:", err);
    }
  };

  // 5. Discounts & Concessions CRUD
  const addDiscount = async (disc: Omit<Discount, "id">) => {
    let newDisc: Discount = {
      ...disc,
      id: "DSC-" + Math.floor(100 + Math.random() * 900),
    };
    try {
      const res: any = await FinanceAPI.createDiscountApi({
        name: disc.name,
        code: disc.code,
        type: disc.type,
        mode: disc.mode,
        value: Number(disc.value || 0),
        description: disc.description || "",
        status: disc.status || "Active",
      });
      const data = res?.data || res;
      if (data?.id) {
        newDisc = {
          ...disc,
          id: String(data.id),
          code: data.code || disc.code,
        };
      }
    } catch (err) {
      console.warn("Could not persist discount to API:", err);
    }
    setDiscounts((prev) => [
      ...prev.filter((d) => d.id !== newDisc.id && d.code !== newDisc.code),
      newDisc,
    ]);
    logActivity("Created Discount", `Added discount ${newDisc.name}`);
  };

  const updateDiscount = async (id: string, updates: Partial<Discount>) => {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await FinanceAPI.updateDiscountApi(numId, updates);
      }
    } catch (err) {
      console.warn("Could not update discount via API:", err);
    }
  };

  const deleteDiscount = async (id: string) => {
    const existing = discounts.find((d) => d.id === id || d.code === id);
    setDiscounts((prev) => prev.filter((d) => d.id !== id && d.code !== id));
    try {
      const targetId = existing ? existing.id : id;
      const numId = parseInt(targetId, 10);
      if (!isNaN(numId)) {
        await FinanceAPI.deleteDiscountApi(numId);
      }
    } catch (err) {
      console.warn("Could not delete discount via API:", err);
    }
  };

  const assignDiscountToStudent = async (
    studentId: string,
    discountId: string,
  ) => {
    const disc = discounts.find(
      (d) => d.id === discountId || d.code === discountId,
    );
    if (!disc) return;

    const st = students.find((s) => s.id === studentId);

    let awardId = "SDSC-" + Math.floor(100 + Math.random() * 900);
    const numDiscId = parseInt(disc.id, 10) || 1;
    try {
      const res: any = await FinanceAPI.grantStudentDiscountApi({
        studentId: st ? st.admissionNo || st.id : studentId,
        discountId: numDiscId,
        remarks: "Granted via Discount Management",
      });
      const data = res?.data || res;
      if (data?.id) awardId = String(data.id);
    } catch (err) {
      console.warn("Could not grant discount via API:", err);
    }

    const newAlloc: StudentDiscount = {
      id: awardId,
      studentId,
      discountId: disc.id,
      discountName: disc.name,
      appliedDate: new Date().toISOString().split("T")[0],
    };
    setStudentDiscounts((prev) => [
      ...prev.filter(
        (d) => d.studentId !== studentId || d.discountId !== disc.id,
      ),
      newAlloc,
    ]);

    setTimeout(() => recalculateStudentFeeLedger(studentId), 50);
  };

  const removeStudentDiscount = async (id: string) => {
    const existing = studentDiscounts.find((d) => d.id === id);
    setStudentDiscounts((prev) => prev.filter((d) => d.id !== id));
    try {
      const targetId = existing ? existing.id : id;
      const numId = parseInt(targetId, 10);
      if (!isNaN(numId)) {
        await FinanceAPI.removeStudentDiscountApi(numId);
      }
    } catch (err) {
      console.warn("Could not remove student discount via API:", err);
    }
  };

  // 6. Fine Rules CRUD
  const addFineRule = (rule: Omit<FineRule, "id">) => {
    const id = "FR-" + Math.floor(100 + Math.random() * 900);
    const newRule: FineRule = { ...rule, id };
    setFineRules((prev) => [...prev, newRule]);
  };

  const updateFineRule = (id: string, updates: Partial<FineRule>) => {
    setFineRules((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const deleteFineRule = (id: string) => {
    setFineRules((prev) => prev.filter((f) => f.id !== id));
  };

  // 7. Transport Routes CRUD
  const addERPTransportRoute = (route: Omit<ERPTransportRoute, "id">) => {
    const id = "TRP-" + Math.floor(100 + Math.random() * 900);
    const newRoute: ERPTransportRoute = {
      ...route,
      id,
      branch: (route as any).branch || selectedBranch || "",
    } as any;
    setERPTransportRoutes((prev) => [...prev, newRoute]);
  };

  const updateERPTransportRoute = (
    id: string,
    updates: Partial<ERPTransportRoute>,
  ) => {
    setERPTransportRoutes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const deleteERPTransportRoute = (id: string) => {
    setERPTransportRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  // 8. Student Transport Assignment
  const assignStudentTransport = async (st: Omit<StudentTransport, "id">) => {
    try {
      const studentIdInt = parseInt(st.studentId.replace(/\D/g, ""), 10) || 0;
      const routeIdInt = parseInt(st.routeId.replace(/\D/g, ""), 10) || 0;

      const pickupObj =
        pickupPoints.find(
          (p) => p.pickupName === st.pickupPoint && p.routeId === st.routeId,
        ) ||
        pickupPoints.find((p) => p.routeId === st.routeId) ||
        null;
      const pickupPointIdInt = pickupObj
        ? parseInt(String(pickupObj.id).replace(/\D/g, ""), 10) || null
        : null;

      const vaObj =
        vehicleAssignments.find(
          (va) =>
            va.routeId === st.routeId &&
            (va.status === "Active" || (va as any).status === true),
        ) ||
        vehicleAssignments.find((va) => va.routeId === st.routeId) ||
        null;
      const vaIdInt = vaObj
        ? parseInt(String(vaObj.id).replace(/\D/g, ""), 10) || null
        : null;

      const payload = {
        admissionNo: st.admissionNo || "",
        studentId: studentIdInt > 0 ? studentIdInt : null,
        routeId: routeIdInt,
        pickupPointId: pickupPointIdInt,
        vehicleAssignmentId: vaIdInt,
        effectiveFrom: st.effectiveFrom,
        effectiveTo: st.effectiveTo || null,
        transportType: "Both",
        remarks: "",
        status: st.status === "Active",
      };

      const response = await TransportAPI.createStudentAssignmentApi(
        payload as any,
      );
      const backendData = (response as any)?.data || response || {};

      const id = (
        backendData.id ||
        backendData.assignmentId ||
        "STRP-" + Math.floor(100 + Math.random() * 900)
      ).toString();
      const newAssignment: StudentTransport = {
        ...st,
        ...backendData,
        id,
        branch: (st as any).branch || selectedBranch || "",
      } as any;
      setStudentTransports((prev) => [
        ...prev.filter((t) => t.studentId !== st.studentId),
        newAssignment,
      ]);
      logActivity(
        "Assigned Transport",
        `Assigned route ${st.routeName} to ${st.studentName}`,
      );
      setTimeout(() => recalculateStudentFeeLedger(st.studentId), 50);
    } catch (err: any) {
      addToast(
        "error",
        "API Sync Failed",
        err?.message || "Operating in local fallback mode",
      );
      const id = "STRP-" + Math.floor(100 + Math.random() * 900);
      const newAssignment: StudentTransport = {
        ...st,
        id,
        branch: (st as any).branch || selectedBranch || "",
      } as any;
      setStudentTransports((prev) => [
        ...prev.filter((t) => t.studentId !== st.studentId),
        newAssignment,
      ]);
      logActivity(
        "Assigned Transport",
        `Assigned route ${st.routeName} to ${st.studentName}`,
      );
      setTimeout(() => recalculateStudentFeeLedger(st.studentId), 50);
    }
  };

  const removeStudentTransport = async (id: string) => {
    try {
      const assignmentIdInt = parseInt(id.replace(/\D/g, ""), 10) || 0;
      await TransportAPI.deleteStudentAssignmentApi(assignmentIdInt.toString());

      const target = studentTransports.find((t) => t.id === id);
      setStudentTransports((prev) => prev.filter((t) => t.id !== id));
      if (target) {
        setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
      }
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const target = studentTransports.find((t) => t.id === id);
      setStudentTransports((prev) => prev.filter((t) => t.id !== id));
      if (target) {
        setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
      }
    }
  };

  // 9. Hostel Masters CRUD
  const addHostelMaster = (h: Omit<HostelMaster, "id">) => {
    const id = "HM-" + Math.floor(100 + Math.random() * 900);
    const newHostel: HostelMaster = {
      ...h,
      id,
      branch: (h as any).branch || selectedBranch || "",
    } as any;
    setHostelMasters((prev) => [...prev, newHostel]);
    logActivity(
      "Added Hostel Master",
      `Created hostel ${newHostel.hostelName}`,
    );
  };

  const updateHostelMaster = (id: string, updates: Partial<HostelMaster>) => {
    setHostelMasters((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  };

  const deleteHostelMaster = (id: string) => {
    setHostelMasters((prev) => prev.filter((h) => h.id !== id));
  };

  // Room Type Master CRUD
  const addRoomTypeMaster = (rtData: Omit<RoomTypeMaster, "id">) => {
    const id = "RT-" + Math.floor(100 + Math.random() * 900);
    const newRt: RoomTypeMaster = { ...rtData, id };
    setRoomTypeMasters((prev) => [newRt, ...prev]);
    logActivity(
      "Added Room Type Master",
      `Created room type ${newRt.roomTypeName}`,
    );
  };

  const updateRoomTypeMaster = (
    id: string,
    updates: Partial<RoomTypeMaster>,
  ) => {
    setRoomTypeMasters((prev) =>
      prev.map((rt) => (rt.id === id ? { ...rt, ...updates } : rt)),
    );
  };

  const deleteRoomTypeMaster = (id: string) => {
    setRoomTypeMasters((prev) => prev.filter((rt) => rt.id !== id));
  };

  // Room Master CRUD
  const addRoomMaster = (rmData: Omit<RoomMaster, "id">) => {
    const id = "RM-" + Math.floor(100 + Math.random() * 900);
    const newRm: RoomMaster = {
      ...rmData,
      id,
      branch: (rmData as any).branch || selectedBranch || "",
    } as any;
    setRoomMasters((prev) => [newRm, ...prev]);
    logActivity(
      "Added Room Master",
      `Created ${formatRoomNumber(newRm.roomNumber)} in ${newRm.hostelName}`,
    );
  };

  const updateRoomMaster = (id: string, updates: Partial<RoomMaster>) => {
    setRoomMasters((prev) =>
      prev.map((rm) => (rm.id === id ? { ...rm, ...updates } : rm)),
    );
  };

  const deleteRoomMaster = (id: string) => {
    setRoomMasters((prev) => prev.filter((rm) => rm.id !== id));
  };

  // Student Hostel Assignment CRUD
  const assignStudentHostelRoom = (
    shaData: Omit<StudentHostelAssignment, "id">,
  ) => {
    const id = "SHA-" + Math.floor(100 + Math.random() * 900);
    const newSha: StudentHostelAssignment = { ...shaData, id };
    setStudentHostelAssignments((prev) => [
      ...prev.filter(
        (a) => a.studentId !== shaData.studentId || a.status !== "Active",
      ),
      newSha,
    ]);
    logActivity(
      "Assigned Student Hostel Room",
      `Assigned ${newSha.studentName} to ${formatRoomNumber(newSha.roomNo)}`,
    );
    setTimeout(() => generateStudentFeeLedger(newSha.studentId), 50);
  };

  const updateStudentHostelAssignment = (
    id: string,
    updates: Partial<StudentHostelAssignment>,
  ) => {
    setStudentHostelAssignments((prev) =>
      prev.map((sha) => (sha.id === id ? { ...sha, ...updates } : sha)),
    );
  };

  const deleteStudentHostelAssignment = (id: string) => {
    setStudentHostelAssignments((prev) => prev.filter((sha) => sha.id !== id));
  };

  // Visitor Log CRUD
  const addHostelVisitorLog = (vlData: Omit<HostelVisitorLog, "id">) => {
    const id = "HVL-" + Math.floor(100 + Math.random() * 900);
    const newVl: HostelVisitorLog = { ...vlData, id };
    setHostelVisitorLogs((prev) => [newVl, ...prev]);
    logActivity(
      "Added Hostel Visitor Log",
      `Visitor ${newVl.visitorName} checked in for ${newVl.studentName}`,
    );
  };

  const updateHostelVisitorLogStatus = (
    id: string,
    status: "In" | "Out",
    outTime?: string,
  ) => {
    setHostelVisitorLogs((prev) =>
      prev.map((vl) =>
        vl.id === id
          ? {
              ...vl,
              status,
              outTime:
                outTime ||
                new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
            }
          : vl,
      ),
    );
  };

  // Attendance Log
  const recordHostelAttendance = (attData: Omit<HostelAttendanceLog, "id">) => {
    const id = "HAL-" + Math.floor(100 + Math.random() * 900);
    const newAtt: HostelAttendanceLog = { ...attData, id };
    setHostelAttendanceLogs((prev) => [
      ...prev.filter(
        (a) => !(a.studentId === attData.studentId && a.date === attData.date),
      ),
      newAtt,
    ]);
  };

  // Finance -> Hostel Pricing Config CRUD
  const addFinanceHostelConfig = (cData: Omit<FinanceHostelConfig, "id">) => {
    const id = "FHC-" + Math.floor(100 + Math.random() * 900);
    const newC: FinanceHostelConfig = { ...cData, id };
    setFinanceHostelConfigs((prev) => [newC, ...prev]);
    logActivity(
      "Added Finance Hostel Config",
      `Configured pricing for ${newC.hostelName}`,
    );

    FinanceAPI.createHostelFeeConfigApi({
      hostelId: String(newC.hostelId),
      hostelName: newC.hostelName,
      roomTypeId: String(newC.roomTypeId || ""),
      roomTypeName: newC.roomTypeName || "",
      roomId: newC.roomId || "",
      roomNo: newC.roomNo || "All Rooms",
      acType: newC.acType || "All",
      sharingType: newC.sharingType || "All",
      startClass: newC.startClass || "",
      endClass: newC.endClass || "",
      classRange:
        newC.classRange ||
        (newC.startClass && newC.endClass
          ? `${newC.startClass} - ${newC.endClass}`
          : "All Classes"),
      applicableClasses: Array.isArray(newC.applicableClasses)
        ? newC.applicableClasses.join(",")
        : newC.applicableClasses || "",
      academicYear: newC.academicYear || "2025-2026",
      branch: newC.branch || "",
      feePlan: newC.feePlan,
      hostelFee: newC.hostelFee,
      securityDeposit: newC.securityDeposit,
      applicableTerms: Array.isArray(newC.applicableTerms)
        ? JSON.stringify(newC.applicableTerms)
        : newC.applicableTerms || "",
      effectiveFrom: newC.effectiveFrom,
      status: newC.status,
    })
      .then((res: any) => {
        const apiItem = res?.data || res;
        if (apiItem && apiItem.id) {
          setFinanceHostelConfigs((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, id: String(apiItem.id) } : c,
            ),
          );
        }
      })
      .catch((err) => {
        console.warn("Failed to persist hostel fee config to API:", err);
      });
  };

  const updateFinanceHostelConfig = (
    id: string,
    updates: Partial<FinanceHostelConfig>,
  ) => {
    setFinanceHostelConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );

    const apiPayload: any = {
      ...updates,
      hostelId: updates.hostelId ? String(updates.hostelId) : undefined,
      applicableClasses: Array.isArray(updates.applicableClasses)
        ? updates.applicableClasses.join(",")
        : updates.applicableClasses,
      applicableTerms: Array.isArray(updates.applicableTerms)
        ? JSON.stringify(updates.applicableTerms)
        : updates.applicableTerms,
    };

    FinanceAPI.updateHostelFeeConfigApi(id, apiPayload).catch((err) => {
      console.warn("Failed to update hostel fee config in API:", err);
    });
  };

  const deleteFinanceHostelConfig = (id: string) => {
    setFinanceHostelConfigs((prev) => prev.filter((c) => c.id !== id));

    FinanceAPI.deleteHostelFeeConfigApi(id).catch((err) => {
      console.warn("Failed to delete hostel fee config from API:", err);
    });
  };

  // 10. Student Hostel Assignment
  const assignStudentHostel = (sh: Omit<StudentHostel, "id">) => {
    const id = "SHST-" + Math.floor(100 + Math.random() * 900);
    const newAssignment: StudentHostel = {
      ...sh,
      id,
      branch: (sh as any).branch || selectedBranch || "",
    } as any;
    setStudentHostels((prev) => [
      ...prev.filter((h) => h.studentId !== sh.studentId),
      newAssignment,
    ]);
    logActivity(
      "Assigned Hostel",
      `Assigned ${sh.hostelName} Room ${sh.roomNo} to ${sh.studentName}`,
    );

    setTimeout(() => recalculateStudentFeeLedger(sh.studentId), 50);
  };

  const removeStudentHostel = (id: string) => {
    const target = studentHostels.find((h) => h.id === id);
    setStudentHostels((prev) => prev.filter((h) => h.id !== id));
    if (target) {
      setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
    }
  };

  // 11. Refunds CRUD
  const addRefund = (r: Omit<Refund, "id" | "refundNo">) => {
    const id = "RFD-" + Math.floor(100 + Math.random() * 900);
    const refundNo =
      "RF-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);
    const newRefund: Refund = {
      ...r,
      id,
      refundNo,
      branch: (r as any).branch || selectedBranch || "",
    } as any;
    setRefunds((prev) => [newRefund, ...prev]);
    logActivity(
      "Requested Refund",
      `Created refund request ${refundNo} for ${formatCurrency(r.amount)}`,
    );

    // Backend sync
    FinanceAPI.createFeeRefundRequestApi({
      studentId: Number(r.studentId) || 0,
      studentName: r.studentName,
      admissionNo: r.admissionNo || "",
      className: r.className || "",
      section: r.section || "",
      receiptNo: r.receiptNo,
      refundAmount: r.amount,
      reason: r.reason,
      paymentMode: r.refundMode,
      remarks: r.remarks,
    })
      .then((res: any) => {
        if (res?.data) {
          const apiData = res.data;
          setRefunds((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    id: String(apiData.id || item.id),
                    refundNo:
                      apiData.refundNo ||
                      apiData.refundRequestId ||
                      item.refundNo,
                  }
                : item,
            ),
          );
        }
      })
      .catch((err) => {
        console.warn(
          "Backend create refund request fallback to local state",
          err,
        );
      });
  };

  const updateRefundStatus = (
    id: string,
    status: Refund["status"],
    approvedBy = "Admin User",
    remarks = "",
  ) => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, approvedBy } : r)),
    );

    const numericId = parseInt(id.replace(/\D/g, ""), 10);
    if (!isNaN(numericId)) {
      FinanceAPI.processFeeRefundRequestApi(numericId, {
        status,
        remarks: remarks || `Refund ${status} by ${approvedBy}`,
      }).catch((err) => {
        console.warn(
          "Backend process refund request fallback to local state",
          err,
        );
      });
    }
  };

  // 12. Settings
  const updateFinanceSettings = (settings: Partial<FinanceSettings>) => {
    setFinanceSettings((prev) => {
      const updated = { ...prev, ...settings };
      // Sync with backend API
      FinanceAPI.updateFinanceGlobalSettingsApi({
        academicYear: updated.academicYear,
        financialYear: updated.financialYear,
        defaultCurrency: updated.defaultCurrency,
        currency: updated.defaultCurrency,
        lateFeeRuleId: updated.lateFeeRuleId,
        receiptPrefix: updated.receiptPrefix,
        invoicePrefix: updated.invoicePrefix,
        receiptFormat: updated.receiptFormat,
        autoReceiptNo: updated.autoReceiptNo,
        taxSettings: {
          enabled: updated.taxSettings?.enabled ?? true,
          taxName: updated.taxSettings?.taxName || "GST",
          percentage: updated.taxSettings?.percentage ?? 0,
        },
      }).catch((err) => {
        console.warn(
          "Backend update finance settings fallback to local state",
          err,
        );
      });
      return updated;
    });
    logActivity(
      "Updated Finance Settings",
      "Configured tax, receipt format & currency settings",
    );
  };

  // 13. FINANCE -> TRANSPORT CONFIGURATION CRUD
  const addFinanceTransportConfig = (c: Omit<FinanceTransportConfig, "id">) => {
    const id = "FTC-" + Math.floor(100 + Math.random() * 900);
    const newConfig: FinanceTransportConfig = {
      ...c,
      id,
      branch: (c as any).branch || selectedBranch || "",
    } as any;
    setFinanceTransportConfigs((prev) => [...prev, newConfig]);
    logActivity(
      "Created Transport Fee Structure",
      `Set ${newConfig.feePlan} fee ${formatCurrency(newConfig.feeAmount)} for ${newConfig.pickupName}`,
    );
  };

  const updateFinanceTransportConfig = (
    id: string,
    updates: Partial<FinanceTransportConfig>,
  ) => {
    setFinanceTransportConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const deleteFinanceTransportConfig = (id: string) => {
    setFinanceTransportConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  // ==========================================
  // FEE SCHEDULING & INSTALLMENT DISTRIBUTION RULES
  // ==========================================

  const findActiveStudentFeeAssignment = (
    sId: string,
    stObj?: Student | AdmissionApplication,
    ay?: string,
  ): StudentFeeAssignment | undefined => {
    const normSId = String(sId || "")
      .trim()
      .toLowerCase();
    const resolvedSt =
      stObj ||
      students.find(
        (s) =>
          String(s.id).toLowerCase() === normSId ||
          (s.admissionNo && String(s.admissionNo).toLowerCase() === normSId),
      ) ||
      admissions.find(
        (a) =>
          String(a.id).toLowerCase() === normSId ||
          (a.applicationNo &&
            String(a.applicationNo).toLowerCase() === normSId) ||
          ((a as any).registrationNo &&
            String((a as any).registrationNo).toLowerCase() === normSId),
      );

    const stAdm = String((resolvedSt as any)?.admissionNo || "")
      .trim()
      .toLowerCase();
    const stApp = String((resolvedSt as any)?.applicationNo || "")
      .trim()
      .toLowerCase();
    const stReg = String((resolvedSt as any)?.registrationNo || "")
      .trim()
      .toLowerCase();
    const rawStName =
      `${(resolvedSt as any)?.firstName || (resolvedSt as any)?.applicantName || ""} ${(resolvedSt as any)?.lastName || ""}`
        .trim()
        .toLowerCase();
    const stName =
      rawStName && rawStName !== "student" && rawStName !== "enrolled student"
        ? rawStName
        : "";

    return studentFeeAssignments.find((a) => {
      if (a.status !== "Active" && a.status !== undefined) return false;
      if (ay && a.academicYear && !matchesAcademicYear(a.academicYear, ay))
        return false;

      const aSid = String(a.studentId || "")
        .trim()
        .toLowerCase();
      const aAdm = String(a.admissionNo || "")
        .trim()
        .toLowerCase();
      const aName = String(a.studentName || "")
        .trim()
        .toLowerCase();

      if (normSId && (aSid === normSId || aAdm === normSId)) return true;
      if (stAdm && (aSid === stAdm || aAdm === stAdm)) return true;
      if (stApp && (aSid === stApp || aAdm === stApp)) return true;
      if (stReg && (aSid === stReg || aAdm === stReg)) return true;
      if (
        stName &&
        aName &&
        aName !== "student" &&
        (stName === aName || stName.includes(aName) || aName.includes(stName))
      )
        return true;
      return false;
    });
  };

  const generateInstallmentsForStudent = (
    studentId: string,
    academicYear: string,
    assignment: StudentFeeAssignment | undefined,
    ledger: StudentFeeLedger,
  ): StudentFeeInstallment[] => {
    let schedule = academicYearFeeSchedules.find((s) =>
      matchesAcademicYear(s.academicYear, academicYear),
    );

    const ayStartYear = parseInt(academicYear.split("-")[0]) || 2026;
    const currentAYMaster = academicYears.find((a) =>
      matchesAcademicYear(a.academicYear, academicYear),
    );
    const ayStartStr = currentAYMaster?.startDate || `${ayStartYear}-06-01`;
    const ayEndStr = currentAYMaster?.endDate || `${ayStartYear + 1}-05-31`;

    const dynamicGeneratedTerms: FeeScheduleTerm[] =
      schedule?.terms && schedule.terms.length > 0
        ? [...schedule.terms].sort((a, b) => a.sequence - b.sequence)
        : generateTermsFromAcademicYear(
            { startDate: ayStartStr, endDate: ayEndStr, academicYear },
            4,
            45,
          );

    const monthlyConfig =
      schedule?.monthlyConfig || buildDefaultMonthlyConfig(academicYear, 10);
    const annualDueDate =
      schedule?.annualDueDate ||
      dynamicGeneratedTerms[0]?.dueDate ||
      ayStartStr;
    const oneTimeDueDate =
      schedule?.oneTimeDueDate ||
      dynamicGeneratedTerms[0]?.dueDate ||
      ayStartStr;

    const terms: FeeScheduleTerm[] = dynamicGeneratedTerms;

    const student = students.find(
      (s) =>
        s.id === studentId ||
        s.admissionNo === studentId ||
        (s as any).applicationNo === studentId,
    );
    const admApp = admissions.find(
      (a) =>
        a.id === studentId ||
        a.applicationNo === studentId ||
        (a as any).registrationNo === studentId ||
        (student &&
          (student.admissionNo === a.applicationNo ||
            student.admissionNo === (a as any).registrationNo)),
    );

    const activeAssignment =
      assignment ||
      findActiveStudentFeeAssignment(
        studentId,
        student || admApp,
        academicYear,
      );

    const rawAdmissionDate =
      (student as any)?.admissionDate ||
      admApp?.admissionDate ||
      student?.joiningDate ||
      admApp?.joiningDate ||
      admApp?.submissionDate ||
      "";

    const admissionDate = normalizeToISODate(rawAdmissionDate);
    const firstTermStart = terms[0]?.startDate || `${ayStartYear}-04-01`;

    const configDateStr =
      activeAssignment?.assignedDate ||
      admissionDate ||
      new Date().toISOString().split("T")[0];

    const normalizedConfigDate =
      normalizeToISODate(configDateStr) ||
      new Date().toISOString().split("T")[0];

    // Dynamic resolution of One-Time Fee Due Date:
    // If configured on or before a term due date, set due date to that term's due date.
    // If configured after a term due date has passed, roll over to the next upcoming term's due date.
    const upcomingTerm = terms.find((t) => {
      const tDue = normalizeToISODate(t.dueDate);
      return tDue && tDue >= normalizedConfigDate;
    });

    const resolvedOneTimeDueDate = upcomingTerm?.dueDate
      ? normalizeToISODate(upcomingTerm.dueDate)
      : terms[terms.length - 1]?.dueDate
        ? normalizeToISODate(terms[terms.length - 1].dueDate)
        : oneTimeDueDate;

    const isExplicitLateAdmission =
      (student as any)?.isLateAdmission === true ||
      (student as any)?.isLateAdmission === "Yes" ||
      (student as any)?.isLateAdmission === "Late Admission" ||
      (admApp as any)?.isLateAdmission === true ||
      (admApp as any)?.isLateAdmission === "Yes" ||
      (admApp as any)?.isLateAdmission === "Late Admission";

    const isExplicitNotLate =
      (student as any)?.isLateAdmission === false ||
      (student as any)?.isLateAdmission === "No" ||
      (admApp as any)?.isLateAdmission === false ||
      (admApp as any)?.isLateAdmission === "No";

    const isLateAdmission = isExplicitLateAdmission;

    let rawMethod =
      activeAssignment?.feePolicy ||
      (student as any)?.feeCalculationMethod ||
      admApp?.feeCalculationMethod ||
      "Full Annual Fee";

    const studentPolicy =
      activeAssignment?.feePolicy ||
      (student as any)?.feeCalculationMethod ||
      admApp?.feeCalculationMethod ||
      rawMethod ||
      "Full Annual Fee";

    const feeCalculationMethod =
      studentPolicy === "Monthly" || rawMethod === "Monthly"
        ? "Monthly"
        : "Remaining Terms";

    const policyLower = String(studentPolicy || "")
      .toLowerCase()
      .trim();
    const isFullAnnual =
      policyLower === "full annual fee" ||
      policyLower === "full annual" ||
      policyLower === "one time" ||
      policyLower === "one-time" ||
      policyLower === "annual" ||
      policyLower.includes("full") ||
      policyLower.includes("one time") ||
      policyLower.includes("one-time");

    const isTermWise =
      !isFullAnnual &&
      (policyLower === "term-wise" ||
        policyLower === "term-wise fee" ||
        policyLower === "term wise" ||
        policyLower.includes("term") ||
        policyLower.includes("quarterly") ||
        policyLower.includes("pro-rata") ||
        policyLower.includes("prorated"));

    const installments: StudentFeeInstallment[] = [];

    ledger.feeItems.forEach((item) => {
      if (!item.isApplicable) return;

      // Filter out legacy mock phantom items like "ADD EXAM FEE" or "Fee Head"
      if (
        item.headName === "ADD EXAM FEE" ||
        item.headName === "Fee Head" ||
        item.headName === "Fee Head:"
      ) {
        return;
      }

      // Match FeeHead from master registry as SOURCE OF TRUTH for frequency
      const feeHead = feeHeads.find((fh) => {
        if (!fh) return false;
        const fhIdStr = fh.id != null ? String(fh.id).toLowerCase() : "";
        const itemIdStr =
          item.headId != null ? String(item.headId).toLowerCase() : "";
        if (itemIdStr && fhIdStr && fhIdStr === itemIdStr) return true;

        const fhNameStr = fh.name != null ? String(fh.name).toLowerCase() : "";
        const itemNameStr =
          item.headName != null ? String(item.headName).toLowerCase() : "";
        if (itemNameStr && fhNameStr && fhNameStr === itemNameStr) return true;

        const fhCatStr =
          fh.category != null ? String(fh.category).toLowerCase() : "";
        const itemCatStr =
          item.category != null ? String(item.category).toLowerCase() : "";
        if (
          itemCatStr &&
          fhCatStr &&
          (itemCatStr === fhCatStr || itemCatStr.includes(fhCatStr))
        )
          return true;

        if (
          itemNameStr &&
          fhNameStr &&
          (itemNameStr.includes(fhNameStr) || fhNameStr.includes(itemNameStr))
        )
          return true;

        return false;
      });

      // FEE STRUCTURE / FEE HEAD / HOSTEL CONFIG IS SOURCE OF TRUTH FOR FREQUENCY
      let rawFrequency: string =
        (item as any).frequency ||
        (item as any).feePlan ||
        feeHead?.frequency ||
        "";

      const catLower = (item.category || "").toLowerCase();
      const nameLower = (item.headName || "").toLowerCase();

      if (!rawFrequency) {
        if (
          catLower.includes("admission") ||
          nameLower.includes("admission") ||
          catLower.includes("caution") ||
          nameLower.includes("caution")
        ) {
          rawFrequency = "One Time";
        } else if (
          catLower.includes("book") ||
          nameLower.includes("book") ||
          nameLower.includes("textbook") ||
          catLower.includes("sports") ||
          catLower.includes("hostel") ||
          nameLower.includes("hostel")
        ) {
          rawFrequency = "Annual";
        } else if (
          catLower.includes("transport") ||
          nameLower.includes("transport")
        ) {
          rawFrequency = "Quarterly";
        } else if (
          catLower.includes("tuition") ||
          nameLower.includes("tuition")
        ) {
          rawFrequency = "Quarterly";
        } else {
          rawFrequency = "Quarterly";
        }
      }

      let frequency = rawFrequency;
      if (rawFrequency === "Half-Yearly" || rawFrequency === "Half Yearly") {
        frequency = "Half-Yearly";
      }

      const isTransportItem =
        catLower.includes("transport") ||
        nameLower.includes("transport") ||
        item.headId === "FH-TRP";

      if (isTransportItem) {
        const configuredTransportPolicy =
          (typeof window !== "undefined" &&
            window.localStorage?.getItem("transport_fee_billing_policy")) ||
          "Term-wise";
        if (
          isFullAnnual ||
          configuredTransportPolicy === "One-Time" ||
          (item as any).feePlan === "Annual" ||
          (item as any).billingType === "One-time"
        ) {
          frequency = "One Time";
        } else {
          frequency = "Quarterly";
        }
      }

      const catPaymentEligibility =
        (item as any).paymentEligibility || feeHead?.paymentEligibility;
      const catApplicableTerms: string[] =
        (item as any).applicableTerms || feeHead?.applicableTerms || [];

      if (!isTransportItem) {
        if (isFullAnnual) {
          frequency = "One Time";
        } else if (isTermWise) {
          if (catPaymentEligibility !== "One-Time Only") {
            frequency = "Term-wise";
          }
        } else if (catPaymentEligibility === "One-Time Only") {
          frequency = "One Time";
        } else if (catPaymentEligibility === "Term-Wise Allowed") {
          if (
            frequency === "One Time" ||
            frequency === "Annual" ||
            frequency === "One Term"
          ) {
            frequency = "Term-wise";
          }
        }
      }

      // ENFORCE ADMIN SELECTION FOR LATE ADMISSION METHOD:
      // If isLateAdmission is active, honor admin's choice (Term-wise vs Monthly) for recurring fee heads
      if (isLateAdmission) {
        if (feeCalculationMethod === "Monthly") {
          if (
            frequency !== "One Time" &&
            frequency !== "Annual" &&
            frequency !== "One Term"
          ) {
            frequency = "Monthly";
          }
        } else {
          // Admin selected Term-wise / Remaining Terms -> Group as Term-wise (Quarterly) installments
          if (
            frequency !== "One Time" &&
            frequency !== "Annual" &&
            frequency !== "One Term"
          ) {
            frequency = "Quarterly";
          }
        }
      }

      const finalAmount = item.finalAmount;

      // GENERATE OBLIGATIONS ACCORDING TO FREQUENCY & SCHEDULE DUE DATES:

      // 1. ONE TIME / FULL ANNUAL FEE
      if (frequency === "One Time") {
        installments.push({
          id: `INST-${studentId}-${academicYear}-${item.headId}-onetime`,
          studentId,
          academicYear,
          feeAssignmentId: activeAssignment?.id || "SYNTHETIC",
          feeHeadId: item.headId,
          feeHeadName: item.headName,
          frequency: "One Time",
          termId: "ONETIME",
          termName: isFullAnnual
            ? "Full Annual Fee"
            : isTransportItem
              ? "Annual Transport Fee"
              : "Annual / One-Time",
          dueDate: resolvedOneTimeDueDate,
          amount: finalAmount,
          paidAmount: 0,
          dueAmount: finalAmount,
          status: "Pending",
          isApplicable: true,
          isLateAdmission,
          feeCalculationMethod: isLateAdmission
            ? feeCalculationMethod
            : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      // 2. ANNUAL
      else if (frequency === "Annual") {
        installments.push({
          id: `INST-${studentId}-${academicYear}-${item.headId}-annual`,
          studentId,
          academicYear,
          feeAssignmentId: assignment?.id || "SYNTHETIC",
          feeHeadId: item.headId,
          feeHeadName: item.headName,
          frequency: "Annual",
          termId: "ANNUAL",
          termName: "Annual",
          dueDate: resolvedOneTimeDueDate,
          amount: finalAmount,
          paidAmount: 0,
          dueAmount: finalAmount,
          status: "Pending",
          isApplicable: true,
          isLateAdmission,
          feeCalculationMethod: isLateAdmission
            ? feeCalculationMethod
            : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      // 3. ONE TERM
      else if (frequency === "One Term" || frequency === "Single Term") {
        installments.push({
          id: `INST-${studentId}-${academicYear}-${item.headId}-oneterm`,
          studentId,
          academicYear,
          feeAssignmentId: assignment?.id || "SYNTHETIC",
          feeHeadId: item.headId,
          feeHeadName: item.headName,
          frequency: "One Term",
          termId: "ONETERM",
          termName: "One Term",
          dueDate: resolvedOneTimeDueDate,
          amount: finalAmount,
          paidAmount: 0,
          dueAmount: finalAmount,
          status: "Pending",
          isApplicable: true,
          isLateAdmission,
          feeCalculationMethod: isLateAdmission
            ? feeCalculationMethod
            : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      // 4. MONTHLY
      else if (frequency === "Monthly") {
        const allMonths =
          monthlyConfig.monthDueDates &&
          monthlyConfig.monthDueDates.length === 12
            ? monthlyConfig.monthDueDates
            : buildDefaultMonthlyConfig(academicYear, 10).monthDueDates;

        const totalMonthsCount = 12;
        const standardMonthlyFee = Math.floor(finalAmount / totalMonthsCount);

        let applicableMonthIndices: number[] = [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
        ];

        if (isLateAdmission && admissionDate) {
          if (
            (feeCalculationMethod as string) === "Term-wise" ||
            feeCalculationMethod === "Remaining Terms"
          ) {
            // Late Admission = Term-wise: Apply remaining terms/months according to selected method
            const admTime = new Date(admissionDate).getTime();
            const remainingTerms = terms.filter((term) => {
              if (!term.endDate) return true;
              return (
                new Date(normalizeToISODate(term.endDate)).getTime() >= admTime
              );
            });
            const validTerms =
              remainingTerms.length > 0
                ? remainingTerms
                : [terms[terms.length - 1]];

            const termMonthMap = buildTermMonthMap(terms.length);

            let termIndices: number[] = [];
            validTerms.forEach((t) => {
              const seq = t.sequence || 1;
              if (termMonthMap[seq]) {
                termIndices.push(...termMonthMap[seq]);
              }
            });
            applicableMonthIndices = applicableMonthIndices.filter((idx) =>
              termIndices.includes(idx),
            );
          } else {
            // Late Admission = Monthly: Apply remaining months
            const admDateObj = new Date(admissionDate);
            const admYear = admDateObj.getFullYear();
            const admMonth = admDateObj.getMonth();

            let startIdx = 0;
            if (admYear === ayStartYear) {
              if (admMonth >= 3) {
                startIdx = admMonth - 3;
              } else {
                startIdx = 0;
              }
            } else if (admYear > ayStartYear) {
              if (admMonth <= 2) {
                startIdx = admMonth + 9;
              } else {
                startIdx = 11;
              }
            }
            applicableMonthIndices = applicableMonthIndices.filter(
              (idx) => idx >= startIdx,
            );
          }
        }

        applicableMonthIndices.forEach((mIdx) => {
          const mInfo = allMonths[mIdx] || {
            monthName: `Month ${mIdx + 1}`,
            dueDate: `${ayStartYear}-04-10`,
          };

          const amt = standardMonthlyFee;

          installments.push({
            id: `INST-${studentId}-${academicYear}-${item.headId}-m-${mIdx + 1}`,
            studentId,
            academicYear,
            feeAssignmentId: assignment?.id || "SYNTHETIC",
            feeHeadId: item.headId,
            feeHeadName: item.headName,
            frequency: "Monthly",
            termName: `Monthly (${mInfo.monthName})`,
            dueDate: mInfo.dueDate,
            amount: amt,
            paidAmount: 0,
            dueAmount: amt,
            status: "Pending",
            isApplicable: true,
            isLateAdmission,
            feeCalculationMethod: isLateAdmission
              ? feeCalculationMethod
              : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      }
      // 5. QUARTERLY / TERM-WISE
      else if (frequency === "Quarterly" || frequency === "Term-wise") {
        let categoryTerms = terms;
        if (catApplicableTerms && catApplicableTerms.length > 0) {
          const filtered = terms.filter((t) =>
            catApplicableTerms.some(
              (at) =>
                String(at).toLowerCase() === String(t.id).toLowerCase() ||
                String(at).toLowerCase() === String(t.termName).toLowerCase() ||
                String(at) === String(t.sequence),
            ),
          );
          if (filtered.length > 0) {
            categoryTerms = filtered;
          }
        }

        let applicableTerms = categoryTerms;

        if (isLateAdmission && admissionDate) {
          if (feeCalculationMethod === "Monthly") {
            // Late Admission = Monthly: Apply remaining months
            const admDateObj = new Date(admissionDate);
            const admYear = admDateObj.getFullYear();
            const admMonth = admDateObj.getMonth();

            let startIdx = 0;
            if (admYear === ayStartYear) {
              startIdx = admMonth >= 3 ? admMonth - 3 : 0;
            } else if (admYear > ayStartYear) {
              startIdx = admMonth <= 2 ? admMonth + 9 : 11;
            }

            const standardMonthlyFee = Math.floor(finalAmount / 12);

            const admIso = normalizeToISODate(admissionDate);
            applicableTerms = categoryTerms.filter((term) => {
              const termDueIso = normalizeToISODate(term.dueDate);
              const termEndIso = normalizeToISODate(term.endDate);

              if (termDueIso && admIso > termDueIso) return false;
              if (termEndIso && admIso > termEndIso) return false;
              return true;
            });
            if (applicableTerms.length === 0) {
              applicableTerms = [categoryTerms[categoryTerms.length - 1]];
            }

            const termMonthIndices = buildTermMonthMap(categoryTerms.length);

            applicableTerms.forEach((term, tIdx) => {
              const qNumber = term.sequence || tIdx + 1;
              const monthsInTerm = termMonthIndices[qNumber] || [0, 1, 2];
              const remainingMonthsInTerm = monthsInTerm.filter(
                (m) => m >= startIdx,
              ).length;
              const amt = standardMonthlyFee * remainingMonthsInTerm;

              if (amt > 0) {
                installments.push({
                  id: `INST-${studentId}-${academicYear}-${item.headId}-term-${term.id}`,
                  studentId,
                  academicYear,
                  feeAssignmentId: assignment?.id || "SYNTHETIC",
                  feeHeadId: item.headId,
                  feeHeadName: item.headName,
                  frequency:
                    frequency === "Quarterly" ? "Quarterly" : "Term-wise",
                  termId: term.id,
                  termName: isTransportItem
                    ? `Transport Fee - ${term.termName || `Term ${qNumber}`}`
                    : term.termName || `Term ${qNumber}`,
                  dueDate: term.dueDate || resolvedOneTimeDueDate,
                  amount: amt,
                  paidAmount: 0,
                  dueAmount: amt,
                  status: "Pending",
                  isApplicable: true,
                  isLateAdmission,
                  feeCalculationMethod: "Monthly",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            });
          } else {
            // Late Admission = Term-wise: Apply remaining terms (Section 5 & 9: admissionDate <= term.endDate)
            const admIso = normalizeToISODate(admissionDate);
            applicableTerms = categoryTerms.filter((term) => {
              const termEndIso = normalizeToISODate(term.endDate);
              if (!termEndIso) return true;
              return admIso <= termEndIso;
            });
            if (applicableTerms.length === 0) {
              applicableTerms = [categoryTerms[categoryTerms.length - 1]];
            }

            const count = Math.max(1, applicableTerms.length);
            const baseAmt = Math.floor(finalAmount / count);
            const remainder = finalAmount - baseAmt * count;

            applicableTerms.forEach((term, tIdx) => {
              const amt = baseAmt + (tIdx < remainder ? 1 : 0);
              const qNumber = term.sequence || tIdx + 1;

              installments.push({
                id: `INST-${studentId}-${academicYear}-${item.headId}-term-${term.id}`,
                studentId,
                academicYear,
                feeAssignmentId: assignment?.id || "SYNTHETIC",
                feeHeadId: item.headId,
                feeHeadName: item.headName,
                frequency:
                  frequency === "Quarterly" ? "Quarterly" : "Term-wise",
                termId: term.id,
                termName: isTransportItem
                  ? `Transport Fee - ${term.termName || `Term ${qNumber}`}`
                  : term.termName || `Term ${qNumber}`,
                dueDate: term.dueDate || resolvedOneTimeDueDate,
                amount: amt,
                paidAmount: 0,
                dueAmount: amt,
                status: "Pending",
                isApplicable: true,
                isLateAdmission,
                feeCalculationMethod: "Remaining Terms",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            });
          }
        } else {
          // Regular (Not Late Admission)
          const count = Math.max(1, applicableTerms.length);
          const baseAmt = Math.floor(finalAmount / count);
          const remainder = finalAmount - baseAmt * count;

          applicableTerms.forEach((term, tIdx) => {
            const amt = baseAmt + (tIdx < remainder ? 1 : 0);
            const qNumber = term.sequence || tIdx + 1;

            installments.push({
              id: `INST-${studentId}-${academicYear}-${item.headId}-term-${term.id}`,
              studentId,
              academicYear,
              feeAssignmentId: assignment?.id || "SYNTHETIC",
              feeHeadId: item.headId,
              feeHeadName: item.headName,
              frequency: frequency === "Quarterly" ? "Quarterly" : "Term-wise",
              termId: term.id,
              termName: isTransportItem
                ? `Transport Fee - ${term.termName || `Term ${qNumber}`}`
                : term.termName || `Term ${qNumber}`,
              dueDate: term.dueDate || resolvedOneTimeDueDate,
              amount: amt,
              paidAmount: 0,
              dueAmount: amt,
              status: "Pending",
              isApplicable: true,
              isLateAdmission: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        }
      }
      // 5. HALF-YEARLY
      else if (frequency === "Half-Yearly") {
        let categoryTerms = terms;
        if (catApplicableTerms && catApplicableTerms.length > 0) {
          const filtered = terms.filter((t) =>
            catApplicableTerms.some(
              (at) =>
                String(at).toLowerCase() === String(t.id).toLowerCase() ||
                String(at).toLowerCase() === String(t.termName).toLowerCase() ||
                String(at) === String(t.sequence),
            ),
          );
          if (filtered.length > 0) categoryTerms = filtered;
        }

        let applicableTerms = categoryTerms;

        if (isLateAdmission && admissionDate) {
          const admTime = new Date(admissionDate).getTime();
          applicableTerms = categoryTerms.filter((term) => {
            if (!term.endDate) return true;
            return new Date(term.endDate).getTime() >= admTime;
          });
        }

        const count = Math.min(2, Math.max(1, applicableTerms.length));
        const baseAmt = Math.floor(finalAmount / count);
        const remainder = finalAmount - baseAmt * count;

        for (let h = 0; h < count; h++) {
          const term = applicableTerms[h] || categoryTerms[0];
          const amt = baseAmt + (h < remainder ? 1 : 0);

          installments.push({
            id: `INST-${studentId}-${academicYear}-${item.headId}-h-${h + 1}`,
            studentId,
            academicYear,
            feeAssignmentId: assignment?.id || "SYNTHETIC",
            feeHeadId: item.headId,
            feeHeadName: item.headName,
            frequency: "Half-Yearly",
            termId: term.id,
            termName: `H${h + 1} (${term.termName})`,
            dueDate: term.dueDate,
            amount: amt,
            paidAmount: 0,
            dueAmount: amt,
            status: "Pending",
            isApplicable: true,
            isLateAdmission,
            feeCalculationMethod: isLateAdmission
              ? feeCalculationMethod
              : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    // overlay existing payments allocations
    const isPaymentForThisStudent = (p: FeePayment) => {
      if (!p || !studentId) return false;
      const pSid = String(p.studentId || "")
        .trim()
        .toLowerCase();
      const pAdm = p.admissionNo
        ? String(p.admissionNo).trim().toLowerCase()
        : "";
      const sId = String(studentId || "")
        .trim()
        .toLowerCase();
      if (!sId) return false;
      if (pSid === sId || (pAdm && pAdm === sId)) return true;

      const stStudent =
        (student ? (student as Student) : undefined) ||
        students.find(
          (s) =>
            String(s.id).trim().toLowerCase() === sId ||
            (s.admissionNo &&
              String(s.admissionNo).trim().toLowerCase() === sId),
        );

      const stAdmission = admissions.find(
        (a) =>
          String(a.id).trim().toLowerCase() === sId ||
          (a.applicationNo &&
            String(a.applicationNo).trim().toLowerCase() === sId) ||
          ((a as any).registrationNo &&
            String((a as any).registrationNo)
              .trim()
              .toLowerCase() === sId) ||
          (stStudent?.admissionNo &&
            (String(a.id).trim().toLowerCase() ===
              String(stStudent.admissionNo).trim().toLowerCase() ||
              (a.applicationNo &&
                String(a.applicationNo).trim().toLowerCase() ===
                  String(stStudent.admissionNo).trim().toLowerCase()) ||
              ((a as any).registrationNo &&
                String((a as any).registrationNo)
                  .trim()
                  .toLowerCase() ===
                  String(stStudent.admissionNo).trim().toLowerCase()))),
      );

      const allIds = new Set<string>();
      allIds.add(sId);
      if (student?.id) allIds.add(String(student.id).trim().toLowerCase());
      if (student?.admissionNo)
        allIds.add(String(student.admissionNo).trim().toLowerCase());

      if (stStudent) {
        if (stStudent.id) allIds.add(String(stStudent.id).trim().toLowerCase());
        if (stStudent.admissionNo)
          allIds.add(String(stStudent.admissionNo).trim().toLowerCase());
      }

      if (stAdmission) {
        if (stAdmission.id)
          allIds.add(String(stAdmission.id).trim().toLowerCase());
        if (stAdmission.applicationNo)
          allIds.add(String(stAdmission.applicationNo).trim().toLowerCase());
        if ((stAdmission as any).registrationNo)
          allIds.add(
            String((stAdmission as any).registrationNo)
              .trim()
              .toLowerCase(),
          );
      }

      if (allIds.has(pSid) || (pAdm && allIds.has(pAdm))) return true;

      const stName =
        `${(stStudent || stAdmission || student)?.firstName || (stAdmission as any)?.applicantName || ""} ${(stStudent || student)?.lastName || ""}`
          .trim()
          .toLowerCase();
      const pName = String(p.studentName || "")
        .trim()
        .toLowerCase();
      if (
        stName &&
        pName &&
        (stName === pName || stName.includes(pName) || pName.includes(stName))
      )
        return true;

      return false;
    };

    const studentPayments = (feePayments || [])
      .filter(
        (p) =>
          isPaymentForThisStudent(p) &&
          (!p.academicYear ||
            matchesAcademicYear(p.academicYear, academicYear)),
      )
      .sort(
        (a, b) =>
          new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
      );

    // Deduplicate fee payments by receipt number to prevent applying duplicate database payment rows
    const uniqueStudentPayments: FeePayment[] = [];
    const seenReceiptKeys = new Set<string>();
    for (const p of studentPayments) {
      const rKey = (p.receiptNo || String(p.id || "")).toLowerCase().trim();
      if (rKey && seenReceiptKeys.has(rKey)) continue;
      if (rKey) seenReceiptKeys.add(rKey);
      uniqueStudentPayments.push(p);
    }

    const matchTermNameStr = (
      instTermRaw?: string,
      allocTermRaw?: string,
    ): boolean => {
      if (!instTermRaw || !allocTermRaw) return false;
      const t1 = instTermRaw.toLowerCase().trim();
      const t2 = allocTermRaw.toLowerCase().trim();
      if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) return true;
      const m1 = t1.match(/(?:q|term|h|m)[\s-]*(\d+)/i) || t1.match(/(\d+)/);
      const m2 = t2.match(/(?:q|term|h|m)[\s-]*(\d+)/i) || t2.match(/(\d+)/);
      if (m1 && m2 && m1[1] === m2[1]) return true;
      return false;
    };

    const matchHeadNameStr = (
      instHeadRaw?: string,
      allocHeadRaw?: string,
    ): boolean => {
      if (!allocHeadRaw) return true;
      if (!instHeadRaw) return false;
      const h1 = instHeadRaw.toLowerCase().trim();
      const h2 = allocHeadRaw.toLowerCase().trim();
      if (h1 === h2 || h1.includes(h2) || h2.includes(h1)) return true;
      return false;
    };

    uniqueStudentPayments.forEach((payment) => {
      let allocs: PaymentAllocationItem[] = payment.paymentAllocation || [];

      if ((!allocs || allocs.length === 0) && (payment as any).paidItemsJson) {
        try {
          const parsed = JSON.parse((payment as any).paidItemsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allocs = parsed.map((item: any) => ({
              academicYear:
                item.academicYear || payment.academicYear || academicYear,
              amount: Number(
                item.amount ?? item.Amount ?? item.finalAmount ?? 0,
              ),
              installmentId:
                item.installmentId ||
                item.id ||
                item.TermId ||
                item.feeHeadId ||
                item.FeeHeadId,
              feeHeadName:
                item.feeHeadName || item.HeadName || payment.feeHeadName || "",
              termName:
                item.termName || item.TermName || payment.termName || "",
            }));
          }
        } catch {}
      }

      if (
        (!allocs || allocs.length === 0) &&
        (payment.termName || payment.feeHeadName)
      ) {
        allocs = [
          {
            academicYear: payment.academicYear || academicYear,
            amount: Number(payment.amountPaid ?? (payment as any).amount ?? 0),
            installmentId: payment.selectedInstallmentIds?.[0],
            feeHeadName: payment.feeHeadName || "",
            termName: payment.termName || "",
          },
        ];
      }

      if (allocs && allocs.length > 0) {
        allocs.forEach((alloc) => {
          if (
            !alloc.academicYear ||
            matchesAcademicYear(alloc.academicYear, academicYear)
          ) {
            let remaining = Number(alloc.amount) || 0;
            if (remaining <= 0) return;

            const matchedInst = installments.find((inst) => {
              if (inst.dueAmount <= 0) return false;

              if (
                alloc.installmentId &&
                matchesInstallmentId(inst.id, alloc.installmentId)
              )
                return true;
              if (
                payment.selectedInstallmentIds &&
                payment.selectedInstallmentIds.some((sId) =>
                  matchesInstallmentId(inst.id, sId),
                )
              )
                return true;

              const headMatch = matchHeadNameStr(
                inst.feeHeadName,
                alloc.feeHeadName || payment.feeHeadName || "",
              );
              const termMatch = matchTermNameStr(
                inst.termName,
                alloc.termName || payment.termName || "",
              );

              if (alloc.termName || payment.termName) {
                return headMatch && termMatch;
              }
              return headMatch;
            });

            if (matchedInst) {
              const pay = Math.min(matchedInst.dueAmount, remaining);
              matchedInst.paidAmount += pay;
              matchedInst.dueAmount = Math.max(0, matchedInst.dueAmount - pay);
              matchedInst.status =
                matchedInst.dueAmount <= 0 ? "Paid" : "Partial";
              remaining -= pay;
            }

            if (remaining > 0) {
              installments
                .filter((inst) => inst.dueAmount > 0)
                .forEach((inst) => {
                  if (remaining <= 0) return;
                  const pay = Math.min(inst.dueAmount, remaining);
                  inst.paidAmount += pay;
                  inst.dueAmount = Math.max(0, inst.dueAmount - pay);
                  inst.status = inst.dueAmount <= 0 ? "Paid" : "Partial";
                  remaining -= pay;
                });
            }
          }
        });
      } else {
        let remaining =
          Number(payment.amountPaid ?? (payment as any).amount) || 0;
        installments
          .filter((inst) => inst.dueAmount > 0)
          .forEach((inst) => {
            if (remaining <= 0) return;
            const pay = Math.min(inst.dueAmount, remaining);
            inst.paidAmount += pay;
            inst.dueAmount = Math.max(0, inst.dueAmount - pay);
            inst.status = inst.dueAmount <= 0 ? "Paid" : "Partial";
            remaining -= pay;
          });
      }
    });

    return installments;
  };

  const getStudentInstallmentSummary = (
    studentId: string,
    targetAcademicYear?: string,
  ) => {
    const activeAY =
      targetAcademicYear ||
      selectedAcademicYear ||
      financeSettings?.academicYear ||
      "";
    const ledger = getStudentFeeLedger(studentId, activeAY);
    const schedule =
      academicYearFeeSchedules.find((s) =>
        matchesAcademicYear(s.academicYear, activeAY),
      ) || academicYearFeeSchedules[0];

    const fallback = {
      currentAcademicYear: activeAY,
      currentTerm: "Term 1",
      termDueDate: schedule?.terms[0]?.dueDate || "N/A",
      currentTermDue: 0,
      previousTermDue: 0,
      overdueAmount: 0,
      upcomingAmount: 0,
      totalOutstanding: ledger?.dueBalance || 0,
    };

    if (!ledger || !ledger.installments || ledger.installments.length === 0) {
      return fallback;
    }

    const insts = ledger.installments;
    const todayStr = new Date().toISOString().split("T")[0];

    const currentTermObj =
      schedule?.terms.find(
        (t: any) => todayStr >= t.startDate && todayStr <= t.endDate,
      ) || schedule?.terms[0];

    const currentTermName = currentTermObj?.termName || "Term 1";
    const termDueDate = currentTermObj?.dueDate || "N/A";

    let currentTermDue = 0;
    let previousTermDue = 0;
    let overdueAmount = 0;
    let upcomingAmount = 0;
    let totalOutstanding = 0;

    insts.forEach((inst) => {
      const isCurrentTerm =
        inst.termName === currentTermName ||
        (inst.termId && currentTermObj && inst.termId === currentTermObj.id);

      totalOutstanding += inst.dueAmount;

      if (isCurrentTerm) {
        currentTermDue += inst.dueAmount;
      }

      if (inst.dueDate < todayStr && inst.dueAmount > 0) {
        overdueAmount += inst.dueAmount;
        if (!isCurrentTerm) {
          previousTermDue += inst.dueAmount;
        }
      }

      if (inst.dueDate >= todayStr && inst.dueAmount > 0 && !isCurrentTerm) {
        upcomingAmount += inst.dueAmount;
      }
    });

    return {
      currentAcademicYear: activeAY,
      currentTerm: currentTermName,
      termDueDate,
      currentTermDue,
      previousTermDue,
      overdueAmount,
      upcomingAmount,
      totalOutstanding,
    };
  };

  const getPromotedStudentsWithPreviousDues = (
    targetAcademicYear?: string,
  ): PromotedStudentWithDues[] => {
    const activeAY =
      targetAcademicYear ||
      selectedAcademicYear ||
      financeSettings?.academicYear ||
      "";
    const todayStr = new Date().toISOString().split("T")[0];

    const result: PromotedStudentWithDues[] = [];

    students.forEach((student) => {
      if (student.status === "Inactive") return;

      // Collect all installments belonging to academic years strictly before activeAY
      let prevInsts = studentFeeInstallments.filter(
        (inst) =>
          inst.studentId === student.id &&
          inst.academicYear < activeAY &&
          inst.dueAmount > 0,
      );

      // Inspect previous year ledgers for student
      const prevLedgers = studentFeeLedgers.filter(
        (l) =>
          l.studentId === student.id &&
          l.academicYear < activeAY &&
          l.dueBalance > 0,
      );

      // If ledger installments exist but not in prevInsts, merge them
      prevLedgers.forEach((ledger) => {
        if (ledger.installments && ledger.installments.length > 0) {
          ledger.installments.forEach((inst) => {
            if (
              inst.dueAmount > 0 &&
              !prevInsts.some((i) => i.id === inst.id)
            ) {
              prevInsts.push(inst);
            }
          });
        }
      });

      // If no individual installments found, generate fallback installment items from feeItems
      if (prevInsts.length === 0 && prevLedgers.length > 0) {
        prevLedgers.forEach((ledger) => {
          if (ledger.feeItems && ledger.feeItems.length > 0) {
            ledger.feeItems.forEach((item, idx) => {
              if (item.status !== "Paid" && item.finalAmount > 0) {
                prevInsts.push({
                  id: `INST-HIST-${ledger.id}-${idx}`,
                  studentId: student.id,
                  studentName: `${student.firstName} ${student.lastName}`,
                  admissionNo: student.admissionNo,
                  academicYear: ledger.academicYear,
                  className: ledger.className || student.className,
                  feeHeadId: item.headId,
                  feeHeadName: item.headName,
                  termId: ledger.academicYear,
                  termName: item.category || item.headName,
                  dueDate:
                    ledger.updatedAt ||
                    `${ledger.academicYear.slice(0, 4)}-12-31`,
                  amount: item.originalAmount || item.finalAmount,
                  originalAmount: item.originalAmount,
                  paidAmount:
                    item.status === "Partial"
                      ? Math.max(0, item.originalAmount - item.finalAmount)
                      : 0,
                  dueAmount:
                    item.finalAmount > 0 ? item.finalAmount : ledger.dueBalance,
                  status:
                    item.finalAmount > 0
                      ? ledger.paidAmount > 0
                        ? "Partial"
                        : "Pending"
                      : "Paid",
                  isApplicable: true,
                  updatedAt: new Date().toISOString(),
                });
              }
            });
          }
        });
      }

      const activeUnpaidInsts = prevInsts.filter((i) => i.dueAmount > 0);
      const previousYearPendingAmount = activeUnpaidInsts.reduce(
        (sum, i) => sum + i.dueAmount,
        0,
      );

      // Rule 3: Only include if previous year pending amount > 0
      if (previousYearPendingAmount <= 0) return;

      // Group by academic year
      const yearMap = new Map<string, StudentFeeInstallment[]>();
      activeUnpaidInsts.forEach((inst) => {
        const ay = inst.academicYear;
        if (!yearMap.has(ay)) yearMap.set(ay, []);
        yearMap.get(ay)!.push(inst);
      });

      const previousAcademicYears = Array.from(yearMap.keys()).sort((a, b) =>
        b.localeCompare(a),
      );

      const latestPrevAY = previousAcademicYears[0];
      const prevHist = student.academicHistory?.find(
        (h) => h.academicYear === latestPrevAY,
      );
      const prevLedgerObj = prevLedgers.find(
        (l) => l.academicYear === latestPrevAY,
      );
      const previousClass =
        prevHist?.className || prevLedgerObj?.className || "Class 5";

      const breakdownByYear = previousAcademicYears.map((ay) => {
        const items = yearMap.get(ay) || [];
        const totPending = items.reduce((sum, i) => sum + i.dueAmount, 0);
        const histItem = student.academicHistory?.find(
          (h) => h.academicYear === ay,
        );
        const lObj = prevLedgers.find((l) => l.academicYear === ay);
        return {
          academicYear: ay,
          className: histItem?.className || lObj?.className || previousClass,
          totalPending: totPending,
          items,
        };
      });

      // Status logic: OVERDUE > PARTIALLY PAID > DUE
      const isOverdue = activeUnpaidInsts.some(
        (i) => i.dueDate && i.dueDate < todayStr,
      );
      const isPartiallyPaid =
        activeUnpaidInsts.some((i) => i.paidAmount > 0) ||
        prevLedgers.some((l) => l.paidAmount > 0);

      let status: "Due" | "Partially Paid" | "Overdue" = "Due";
      if (isOverdue) {
        status = "Overdue";
      } else if (isPartiallyPaid) {
        status = "Partially Paid";
      }

      result.push({
        student,
        previousYearPendingAmount,
        previousAcademicYears,
        previousClass,
        currentClass: `${student.className}-${student.section}`,
        currentAcademicYear: activeAY,
        pendingComponentsCount: activeUnpaidInsts.length,
        status,
        breakdownByYear,
      });
    });

    return result;
  };

  const getDynamicTransportFee = (activeTa: any) => {
    if (!activeTa) return 0;
    const normalizeKey = (val: any) =>
      String(val || "")
        .replace(/^rm-0*/i, "")
        .replace(/^pt-0*/i, "")
        .replace(/^pp-0*/i, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const taRouteIdNorm = normalizeKey(activeTa.routeId);
    const taRouteNameNorm = normalizeKey(
      activeTa.routeName || activeTa.busRoute,
    );
    const taPtIdNorm = normalizeKey(
      (activeTa as any).pickupPointId || activeTa.pickupId,
    );
    const taPtNameNorm = normalizeKey(
      activeTa.pickupPoint ||
        (activeTa as any).pickupName ||
        (activeTa as any).pickupPointName,
    );

    const routesPool =
      routeMasters && routeMasters.length > 0
        ? routeMasters
        : (() => {
            try {
              const raw =
                localStorage.getItem("edu_db_route_masters") ||
                localStorage.getItem("route_masters");
              return raw ? JSON.parse(raw) : [];
            } catch {
              return [];
            }
          })();

    const pointsPool =
      pickupPoints && pickupPoints.length > 0
        ? pickupPoints
        : (() => {
            try {
              const raw =
                localStorage.getItem("edu_db_pickup_points") ||
                localStorage.getItem("pickup_points");
              return raw ? JSON.parse(raw) : [];
            } catch {
              return [];
            }
          })();

    const rObj = routesPool.find((r: any) => {
      const rIdNorm = normalizeKey(r.id || (r as any).routeId);
      const rNameNorm = normalizeKey(r.routeName || (r as any).routeCode);
      if (taRouteIdNorm && rIdNorm && taRouteIdNorm === rIdNorm) return true;
      if (taRouteNameNorm && rNameNorm && taRouteNameNorm === rNameNorm)
        return true;
      if (
        taRouteNameNorm &&
        rNameNorm &&
        (taRouteNameNorm.includes(rNameNorm) ||
          rNameNorm.includes(taRouteNameNorm))
      )
        return true;
      return false;
    });

    const pObj = pointsPool.find((p: any) => {
      const pIdNorm = normalizeKey(
        p.id || (p as any).pickupPointId || (p as any).pickupId,
      );
      if (taPtIdNorm && pIdNorm && taPtIdNorm === pIdNorm) return true;

      const pNameNorm = normalizeKey(
        p.pickupName || (p as any).pickupPointName,
      );
      if (taPtNameNorm && pNameNorm && taPtNameNorm === pNameNorm) {
        if (!rObj) return true;
        const pRouteIdNorm = normalizeKey(
          p.routeId || (p as any).transportRouteId,
        );
        const rIdNorm = normalizeKey(rObj.id || (rObj as any).routeId);
        if (pRouteIdNorm && rIdNorm && pRouteIdNorm === rIdNorm) return true;
        const pRouteNameNorm = normalizeKey(p.routeName);
        const rRouteNameNorm = normalizeKey(rObj.routeName);
        if (
          pRouteNameNorm &&
          rRouteNameNorm &&
          pRouteNameNorm === rRouteNameNorm
        )
          return true;
        return true;
      }
      return false;
    });

    const isAC =
      String(activeTa.transportType || "")
        .toUpperCase()
        .includes("AC") &&
      !String(activeTa.transportType || "")
        .toUpperCase()
        .includes("NON");

    const plan = activeTa.feePlan || "Annual";
    let assignedFee = 0;
    if (pObj) {
      if (plan === "Monthly" && pObj.monthlyFee && pObj.monthlyFee > 0) {
        assignedFee = pObj.monthlyFee;
      } else if (
        plan === "Quarterly" &&
        pObj.quarterlyFee &&
        pObj.quarterlyFee > 0
      ) {
        assignedFee = pObj.quarterlyFee;
      } else if (
        (plan === "Half Yearly" || plan === "Half-Yearly") &&
        pObj.halfYearlyFee &&
        pObj.halfYearlyFee > 0
      ) {
        assignedFee = pObj.halfYearlyFee;
      } else if (plan === "Annual" && pObj.annualFee && pObj.annualFee > 0) {
        assignedFee = pObj.annualFee;
      }
    }

    if (assignedFee > 0) return assignedFee;

    const baseFare = rObj
      ? isAC
        ? Number(rObj.acMinBaseFare ?? (rObj as any).acBaseFare ?? 1500)
        : Number(rObj.minBaseFare ?? (rObj as any).nonAcBaseFare ?? 1200)
      : isAC
        ? 1500
        : 1200;
    const ratePerKm = rObj
      ? isAC
        ? Number(rObj.acRatePerKm ?? (rObj as any).acRateAddlKm ?? 150)
        : Number(
            rObj.ratePerKm ??
              (rObj as any).nonAcRatePerKm ??
              (rObj as any).nonAcRateAddlKm ??
              100,
          )
      : isAC
        ? 150
        : 100;
    const distance = pObj
      ? Number(
          pObj.distanceFromSchoolKm ?? (pObj as any).distanceFromStart ?? 35,
        )
      : 35;
    const minKm = rObj
      ? Number(
          rObj.minDistanceKm ??
            (rObj as any).minRangeKm ??
            (rObj as any).minRange ??
            35,
        )
      : 35;
    const additionalKm = Math.max(0, distance - minKm);

    const calculatedMonthlyRate =
      baseFare > 0 || ratePerKm > 0
        ? baseFare + additionalKm * ratePerKm
        : pObj && pObj.monthlyFee
          ? pObj.monthlyFee
          : isAC
            ? 1500
            : 1200;

    if (
      calculatedMonthlyRate > 0 &&
      (pObj || rObj || taRouteNameNorm || taPtNameNorm)
    ) {
      const multiplier =
        plan === "Quarterly"
          ? 3
          : plan === "Half Yearly" || plan === "Half-Yearly"
            ? 6
            : plan === "Annual"
              ? 12
              : 1;
      return calculatedMonthlyRate * multiplier;
    }

    const transportConfig = financeTransportConfigs.find((c) => {
      if (c.status !== "Active") return false;
      const cRouteIdNorm = normalizeKey(c.routeId);
      const cRouteNameNorm = normalizeKey(c.routeName);
      const cPtIdNorm = normalizeKey(c.pickupPointId);
      const cPtNameNorm = normalizeKey(c.pickupName);

      const routeMatches =
        (!taRouteIdNorm && !taRouteNameNorm) ||
        (taRouteIdNorm && cRouteIdNorm && taRouteIdNorm === cRouteIdNorm) ||
        (taRouteNameNorm &&
          cRouteNameNorm &&
          taRouteNameNorm === cRouteNameNorm);

      const ptMatches =
        (!taPtIdNorm && !taPtNameNorm) ||
        (taPtIdNorm && cPtIdNorm && taPtIdNorm === cPtIdNorm) ||
        (taPtNameNorm && cPtNameNorm && taPtNameNorm === cPtNameNorm);

      return routeMatches && ptMatches;
    });

    if (transportConfig && transportConfig.feeAmount > 0) {
      return transportConfig.feeAmount;
    }

    if (Number(activeTa.feeAmount) > 0) {
      return Number(activeTa.feeAmount);
    }

    if (taRouteNameNorm || taPtNameNorm) {
      const multiplier =
        plan === "Quarterly"
          ? 3
          : plan === "Half Yearly" || plan === "Half-Yearly"
            ? 6
            : plan === "Annual"
              ? 12
              : 1;
      return (isAC ? 1500 : 1200) * multiplier;
    }

    return 0;
  };

  const buildStudentFeeLedgerObject = (
    studentId: string,
    optStudentOrYear?: Student | AdmissionApplication | string,
    targetAcademicYear?: string,
  ): StudentFeeLedger => {
    let optStudent: Student | AdmissionApplication | undefined = undefined;
    let targetYear: string =
      targetAcademicYear ||
      selectedAcademicYear ||
      financeSettings.academicYear ||
      "";

    if (typeof optStudentOrYear === "string") {
      targetYear = optStudentOrYear;
    } else if (optStudentOrYear && typeof optStudentOrYear === "object") {
      optStudent = optStudentOrYear;
    }

    const sIdStr = String(studentId || "")
      .trim()
      .toLowerCase();
    const student =
      students.find(
        (s) =>
          String(s.id).trim().toLowerCase() === sIdStr ||
          (s.admissionNo &&
            String(s.admissionNo).trim().toLowerCase() === sIdStr) ||
          ((s as any).applicationNo &&
            String((s as any).applicationNo)
              .trim()
              .toLowerCase() === sIdStr) ||
          ((s as any).registrationNo &&
            String((s as any).registrationNo)
              .trim()
              .toLowerCase() === sIdStr),
      ) ||
      (optStudent && (optStudent as any).firstName
        ? (optStudent as Student)
        : undefined);

    const admApp =
      admissions.find((a) => {
        if (!a) return false;
        const aId = a.id != null ? String(a.id).trim().toLowerCase() : "";
        const aApp = a.applicationNo
          ? String(a.applicationNo).trim().toLowerCase()
          : (a as any).applicationId != null
            ? String((a as any).applicationId)
                .trim()
                .toLowerCase()
            : "";
        const aReg = a.registrationNo
          ? String(a.registrationNo).trim().toLowerCase()
          : (a as any).registrationNumber
            ? String((a as any).registrationNumber)
                .trim()
                .toLowerCase()
            : "";
        const aAdm = (a as any).admissionNo
          ? String((a as any).admissionNo)
              .trim()
              .toLowerCase()
          : (a as any).admissionNumber
            ? String((a as any).admissionNumber)
                .trim()
                .toLowerCase()
            : "";
        const aName = (
          a.applicantName ||
          (a as any).studentName ||
          (a as any).applicantFullName ||
          `${a.firstName || ""} ${a.lastName || ""}`
        )
          .trim()
          .toLowerCase();

        if (
          sIdStr &&
          (aId === sIdStr ||
            aApp === sIdStr ||
            aReg === sIdStr ||
            aAdm === sIdStr)
        )
          return true;

        if (student) {
          const stId =
            student.id != null ? String(student.id).trim().toLowerCase() : "";
          const stAdm = student.admissionNo
            ? String(student.admissionNo).trim().toLowerCase()
            : "";
          const stReg = (student as any).registrationNo
            ? String((student as any).registrationNo)
                .trim()
                .toLowerCase()
            : "";
          const stName = `${student.firstName || ""} ${student.lastName || ""}`
            .trim()
            .toLowerCase();

          if (
            stId &&
            (aId === stId || aApp === stId || aReg === stId || aAdm === stId)
          )
            return true;
          if (
            stAdm &&
            (aAdm === stAdm ||
              aReg === stAdm ||
              aApp === stAdm ||
              aId === stAdm)
          )
            return true;
          if (stReg && (aReg === stReg || aAdm === stReg || aApp === stReg))
            return true;
          if (
            aName &&
            stName &&
            (aName === stName ||
              aName.includes(stName) ||
              stName.includes(aName))
          )
            return true;
        }
        return false;
      }) ||
      (optStudent &&
      ((optStudent as any).applicantName ||
        (optStudent as any).appliedClass ||
        (optStudent as any).className ||
        (optStudent as any).firstName)
        ? (optStudent as unknown as AdmissionApplication)
        : undefined);

    const stType: "Day Scholar" | "Hosteller" =
      admApp?.residentialStatus === "Residential" ||
      admApp?.studentType === "Residential" ||
      student?.studentType === "Hosteller" ||
      student?.studentType === "Residential"
        ? "Hosteller"
        : "Day Scholar";
    const clsName =
      admApp?.appliedClass ||
      admApp?.targetClass ||
      admApp?.className ||
      student?.className ||
      (optStudent as any)?.appliedClass ||
      (optStudent as any)?.className ||
      "Nursery";
    const secName =
      admApp?.section || student?.section || (optStudent as any)?.section || "";
    const admNo =
      student?.admissionNo ||
      admApp?.applicationNo ||
      (admApp as any)?.registrationNo ||
      (optStudent as any)?.admissionNo ||
      (optStudent as any)?.applicationNo ||
      studentId;

    const rawStName =
      (admApp?.applicantName || "").trim() ||
      `${admApp?.firstName || ""} ${admApp?.lastName || ""}`.trim() ||
      (admApp as any)?.name ||
      `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
      (student as any)?.name ||
      (student as any)?.applicantName ||
      (optStudent as any)?.applicantName ||
      `${(optStudent as any)?.firstName || ""} ${(optStudent as any)?.lastName || ""}`.trim() ||
      "";

    const stName =
      rawStName &&
      rawStName.toLowerCase() !== "student" &&
      rawStName.toLowerCase() !== "enrolled student"
        ? rawStName
        : admissions.find(
              (a) =>
                String(a.id) === sIdStr ||
                String(a.applicationNo).toLowerCase() === sIdStr,
            )?.applicantName ||
            students.find(
              (s) =>
                String(s.id) === sIdStr ||
                String(s.admissionNo).toLowerCase() === sIdStr,
            )?.firstName
          ? `${students.find((s) => String(s.id) === sIdStr || String(s.admissionNo).toLowerCase() === sIdStr)?.firstName} ${students.find((s) => String(s.id) === sIdStr || String(s.admissionNo).toLowerCase() === sIdStr)?.lastName || ""}`.trim()
          : rawStName || "Student";

    const cleanCls = (clsName || "").replace(/[-\s][A-Z]$/i, "").trim();
    const dfs =
      dynamicFeeStructures.find(
        (d) =>
          matchesClassName(d.className, clsName) &&
          (d.status === "Active" || !d.status),
      ) ||
      dynamicFeeStructures.find((d) => matchesClassName(d.className, clsName));

    const dfsUniformFee = dfs?.items?.find(
      (i) =>
        i.feeHeadName?.toLowerCase().includes("uniform") ||
        i.feeHeadName?.toLowerCase().includes("kit") ||
        i.feeHeadName?.toLowerCase().includes("accessories"),
    )?.amount;

    // Uniform Fee configuration lookup using dynamic class matcher
    const uniformAmount =
      getUniformFeeForClass(
        clsName,
        student?.gender || "Male",
        financeUniformConfigs,
        dynamicFeeStructures,
      ) || 0;

    // Helper to identify uniform fee heads
    const isUniformHead = (headName: string) => {
      const lower = headName.toLowerCase();
      return (
        lower.includes("uniform") ||
        lower.includes("kit") ||
        lower.includes("accessories")
      );
    };

    const selectedOptional = admApp
      ? admApp.selectedOptionalFees || []
      : (student as any)?.selectedOptionalFees || null;

    const hasUniformIssued = (studentUniformIssues || []).some((issue) => {
      if (!issue) return false;
      const iId = String(issue.studentId || "")
        .trim()
        .toLowerCase();
      const iAdm = String(issue.admissionNo || "")
        .trim()
        .toLowerCase();
      const rId = String(studentId || "")
        .trim()
        .toLowerCase();
      const rAdm = student?.admissionNo
        ? String(student.admissionNo).trim().toLowerCase()
        : "";
      const isMatch =
        (rId && (iId === rId || iAdm === rId)) ||
        (rAdm && (iId === rAdm || iAdm === rAdm));
      return (
        isMatch &&
        (issue.status as string) !== "Returned" &&
        (issue.status as string) !== "Cancelled"
      );
    });

    const isUniformOpted = (
      optList: string[] | null | undefined,
      hId?: string,
      hName?: string,
    ) => {
      if (hasUniformIssued) return true;
      if (
        (admApp as any)?.uniformOpted === true ||
        (admApp as any)?.isUniformOpted === true ||
        (student as any)?.uniformOpted === true ||
        (student as any)?.isUniformOpted === true
      ) {
        return true;
      }
      if (
        (admApp as any)?.uniformOpted === false ||
        (admApp as any)?.isUniformOpted === false ||
        (student as any)?.uniformOpted === false ||
        (student as any)?.isUniformOpted === false
      ) {
        return false;
      }
      const persistedOpt =
        getPersistedOptionalFees(studentId) ||
        (student?.admissionNo
          ? getPersistedOptionalFees(student.admissionNo)
          : null);
      const listToUse =
        optList && Array.isArray(optList) && optList.length > 0
          ? optList
          : persistedOpt || [];
      if (!listToUse || !Array.isArray(listToUse) || listToUse.length === 0)
        return false;
      if (hId && listToUse.includes(hId)) return true;
      if (
        hName &&
        listToUse.some(
          (id) =>
            String(id).toLowerCase().includes("uniform") ||
            String(id).toLowerCase().includes("kit"),
        )
      )
        return true;
      return listToUse.some((id) => {
        const s = String(id).toLowerCase();
        return (
          s === "fh-04" ||
          s === "fh-004" ||
          s === "fh-uni-base" ||
          s.includes("uniform") ||
          s.includes("kit")
        );
      });
    };

    // 1. Base Fee Structure
    const assignment = findActiveStudentFeeAssignment(
      studentId,
      student || admApp,
      targetYear,
    );

    let ledgerItems: LedgerFeeItem[] = [];

    if (
      assignment &&
      assignment.assignedFeeHeads &&
      assignment.assignedFeeHeads.length > 0
    ) {
      assignment.assignedFeeHeads.forEach((h) => {
        const isUni = isUniformHead(h.feeHeadName);
        const isSelected = isUni
          ? isUniformOpted(selectedOptional, h.feeHeadId, h.feeHeadName)
          : true;
        const uniFee = isUni
          ? getUniformFeeForClass(
              clsName || student?.className || "",
              student?.gender || "Male",
              financeUniformConfigs,
              dynamicFeeStructures,
            )
          : 0;
        const itemAmount = isUni && uniFee > 0 ? uniFee : h.amount;

        ledgerItems.push({
          headId: h.feeHeadId,
          headName: h.feeHeadName,
          category: h.category || h.feeHeadName,
          originalAmount: itemAmount,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: isSelected ? itemAmount : 0,
          isApplicable: isSelected,
          status: "Pending",
          remarks: isSelected
            ? undefined
            : "Optional Fee - Not Selected at Admission",
        });
      });
    }

    // Ensure Uniform Fee category amount matches config lookup
    ledgerItems = ledgerItems.map((item) => {
      if (item.category === "Uniform Fee") {
        const isApp = item.isApplicable;
        return {
          ...item,
          originalAmount: isApp ? uniformAmount : 0,
          finalAmount: isApp
            ? Math.max(
                0,
                uniformAmount -
                  item.scholarshipDeduction -
                  item.discountDeduction,
              )
            : 0,
        };
      }
      return item;
    });

    // Normalize Residential Status
    const isResident =
      stType === "Hosteller" ||
      student?.studentType === "Hosteller" ||
      student?.studentType === "Residential" ||
      (student as any)?.residentialStatus === "Residential" ||
      (student as any)?.residentialStatus === "Resident" ||
      admApp?.residentialStatus === "Residential" ||
      admApp?.residentialStatus === "Resident" ||
      admApp?.studentType === "Residential" ||
      admApp?.studentType === "Hosteller";

    const isNonResident = !isResident;

    // DYNAMIC TRANSPORT ELIGIBILITY & PRORATION
    // Support Non-Residential students using transport, AND Residential students who previously used transport.
    let transportApplicable = false;
    let activeTransportAssign: any = undefined;

    // Search for active OR historical transport assignment
    activeTransportAssign = studentTransports.find(
      (t) =>
        (t.studentId === studentId ||
          (admNo && t.admissionNo === admNo) ||
          (student?.admissionNo && t.admissionNo === student.admissionNo) ||
          (admApp?.registrationNo &&
            t.admissionNo === admApp.registrationNo) ||
          (t.studentName &&
            stName &&
            t.studentName.trim().toLowerCase() ===
              stName.trim().toLowerCase())),
    );

    const isTransportRequired =
      Boolean(activeTransportAssign) ||
      student?.transportRequired === true ||
      Boolean(
        (student as any)?.busRoute ||
        (student as any)?.pickupPoint ||
        (student as any)?.routeId,
      ) ||
      admApp?.transportRequired === true ||
      Boolean(
        (admApp as any)?.busRoute ||
        (admApp as any)?.pickupPoint ||
        (admApp as any)?.routeId,
      );

    const hasPickupPoint = Boolean(
      activeTransportAssign?.pickupPoint ||
      (student as any)?.pickupPoint ||
      (admApp as any)?.pickupPoint,
    );

    if (isTransportRequired && hasPickupPoint) {
      const routeName =
        activeTransportAssign?.routeName ||
        (student as any)?.busRoute ||
        (admApp as any)?.busRoute ||
        (admApp as any)?.routeName ||
        "";
      const pickupName =
        activeTransportAssign?.pickupPoint ||
        (student as any)?.pickupPoint ||
        (admApp as any)?.pickupPoint ||
        "";
      const routeId =
        activeTransportAssign?.routeId ||
        (student as any)?.routeId ||
        (admApp as any)?.routeId ||
        "";
      const pickupPointId =
        (activeTransportAssign as any)?.pickupPointId ||
        (student as any)?.pickupPointId ||
        (admApp as any)?.pickupPointId ||
        "";
      const transportType =
        (activeTransportAssign as any)?.transportType ||
        (student as any)?.transportType ||
        (admApp as any)?.transportType ||
        "AC";

      const tempAssign = activeTransportAssign || {
        id: `STRP-AUTO-${studentId}`,
        studentId,
        studentName: stName,
        admissionNo: admNo,
        routeId,
        routeName,
        pickupPointId,
        pickupPoint: pickupName,
        transportType,
        feePlan: "Annual",
        status: isResident ? "Inactive" : "Active",
      };

      let dynamicFare = getDynamicTransportFee({
        ...tempAssign,
        feePlan: "Annual",
      });

      if (dynamicFare <= 0 && (routeName || pickupName)) {
        const isAC =
          String(transportType || "AC")
            .toUpperCase()
            .includes("AC") &&
          !String(transportType || "AC")
            .toUpperCase()
            .includes("NON");
        dynamicFare = (isAC ? 1500 : 1200) * 12;
      }

      // If resident and transport ended, prorate transport fee based on months used
      const monthlyRate = Math.round(dynamicFare / 12);
      let calculatedFare = dynamicFare;
      if (isResident) {
        const startDateStr = activeTransportAssign?.effectiveFrom || (admApp as any)?.admissionDate || new Date().toISOString();
        const endDateStr = activeTransportAssign?.effectiveTo || (student as any)?.hostelJoiningDate || new Date().toISOString();
        const daysUsed = Math.max(1, Math.round((new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)));
        const monthsUsed = Math.min(12, Math.max(1, Math.ceil(daysUsed / 30.4375)));
        calculatedFare = Math.round(monthlyRate * monthsUsed);
      }

      const configuredTransportFee =
        Number(activeTransportAssign?.feeAmount) ||
        Number((student as any)?.transportFee) ||
        Number((admApp as any)?.transportFee) ||
        calculatedFare;

      if (configuredTransportFee > 0 || calculatedFare > 0) {
        transportApplicable = true;
        if (!activeTransportAssign) {
          activeTransportAssign = {
            ...tempAssign,
            feeAmount:
              configuredTransportFee > 0
                ? configuredTransportFee
                : calculatedFare,
            effectiveFrom:
              student?.joiningDate ||
              admApp?.admissionDate ||
              new Date().toISOString().split("T")[0],
            status: isResident ? "Inactive" : "Active",
          };
        }
      }
    }

    let hostelApplicable = false;
    let activeHostelAssign: any = undefined;
    let hstBlockName = "";
    let hstRoomName = "";
    let combinedHostelTotal = 0;
    let hostelFrequency = "Annual";

    let hostelSecurityDepositTotal = 0;
    let hostelAccommodationTotal = 0;

    if (isResident) {
      activeHostelAssign =
        studentHostelAssignments.find(
          (h) => h.studentId === studentId && h.status === "Active",
        ) ||
        studentHostels.find(
          (h) => h.studentId === studentId && h.status === "Active",
        );

      hstBlockName =
        (activeHostelAssign as any)?.hostelName ||
        (activeHostelAssign as any)?.hostelId ||
        student?.hostelBlock ||
        (admApp as any)?.hostelBlock ||
        "";

      hstRoomName =
        (activeHostelAssign as any)?.roomNumber ||
        (activeHostelAssign as any)?.roomTypeName ||
        student?.hostelRoom ||
        student?.hostelBed ||
        (admApp as any)?.hostelRoom ||
        (admApp as any)?.hostelBed ||
        "";

      const preferredSharing =
        (admApp as any)?.hostelSharing ||
        (student as any)?.hostelSharing ||
        (admApp as any)?.roomSharing ||
        (admApp as any)?.roomType ||
        (student as any)?.roomType ||
        "Four Sharing";

      const preferredAc =
        (admApp as any)?.hostelAc ||
        (student as any)?.hostelAc ||
        (admApp as any)?.acType ||
        (student as any)?.acType ||
        "Non-AC";

      const isRoomAc =
        String(preferredAc).toUpperCase().includes("AC") &&
        !String(preferredAc).toUpperCase().includes("NON");
      const acTypeStr = isRoomAc ? "AC" : "Non-AC";

      // 1. Check DynamicFeeStructure for Hostel if present
      const activeHostelStruct = (dynamicFeeStructures || []).find((s) => {
        if (s.category !== "Hostel" && s.feeCategory !== "Hostel") return false;
        if (s.status === "Inactive") return false;
        if (
          s.academicYear &&
          selectedAcademicYear &&
          s.academicYear !== selectedAcademicYear
        )
          return false;
        return true;
      });

      if (activeHostelStruct && activeHostelStruct.hostelConfig) {
        const configs = activeHostelStruct.hostelConfig.configurations || [];
        const matchedItem =
          configs.find((c) => {
            if (c.acType !== acTypeStr) return false;
            if (c.acType === "Non-AC" && c.applyToAllNonAc) return true;
            return (
              (preferredSharing &&
                c.sharingType
                  .toLowerCase()
                  .includes(
                    preferredSharing.toLowerCase().replace(" sharing", ""),
                  )) ||
              (preferredSharing &&
                preferredSharing
                  .toLowerCase()
                  .includes(c.sharingType.toLowerCase()))
            );
          }) || configs.find((c) => c.acType === acTypeStr);

        if (matchedItem && matchedItem.amount > 0) {
          hostelAccommodationTotal = matchedItem.amount;
          hostelSecurityDepositTotal = (financeHostelConfigs || []).find(c => c.status === "Active")?.securityDeposit || 0;
          hostelFrequency = "Quarterly";
          hostelApplicable = true;
        }
      }

      // 2. Check financeHostelConfigs
      if (!hostelApplicable) {
        const candidateConfigs = (financeHostelConfigs || []).filter((c) => {
          if (c.status !== "Active") return false;
          if (
            c.academicYear &&
            selectedAcademicYear &&
            !matchesAcademicYear(c.academicYear, selectedAcademicYear)
          ) {
            return false;
          }
          if (hstBlockName) {
            const blockMatch =
              !c.hostelName ||
              c.hostelName === "All" ||
              (c.hostelId && String(c.hostelId) === String(hstBlockName)) ||
              (c.hostelName &&
                hstBlockName &&
                c.hostelName.toLowerCase() === hstBlockName.toLowerCase()) ||
              (c.hostelName &&
                hstBlockName &&
                c.hostelName
                  .toLowerCase()
                  .includes(hstBlockName.toLowerCase())) ||
              (c.hostelName &&
                hstBlockName &&
                hstBlockName
                  .toLowerCase()
                  .includes(c.hostelName.toLowerCase()));
            if (!blockMatch) return false;
          }
          if (
            !isClassInRange(
              clsName,
              c.startClass,
              c.endClass,
              c.classRange,
              academicClasses,
            )
          ) {
            return false;
          }
          if (c.acType && c.acType !== "All") {
            const cAc = c.acType.toUpperCase().includes("NON")
              ? "Non-AC"
              : "AC";
            if (cAc !== acTypeStr) return false;
          }
          if (c.sharingType && c.sharingType !== "All") {
            const clean = (s: string) =>
              String(s || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
            const prefClean = clean(preferredSharing);
            const confClean = clean(c.sharingType);
            const numPref = prefClean.match(/\d+/)?.[0];
            const numConf = confClean.match(/\d+/)?.[0];
            if (numPref && numConf && numPref !== numConf) return false;
            if (
              !numPref &&
              !numConf &&
              !prefClean.includes(confClean) &&
              !confClean.includes(prefClean)
            )
              return false;
          }
          return true;
        });

        const fhc =
          candidateConfigs[0] ||
          (financeHostelConfigs || []).find(
            (c) =>
              c.status === "Active" &&
              isClassInRange(
                clsName,
                c.startClass,
                c.endClass,
                c.classRange,
                academicClasses,
              ),
          ) ||
          (financeHostelConfigs || []).find((c) => c.status === "Active");

        if (fhc) {
          hostelAccommodationTotal = Number(fhc.hostelFee) || 0;
          hostelSecurityDepositTotal = Number(fhc.securityDeposit) || 0;
          hostelFrequency = fhc.feePlan || "Quarterly";
          hostelApplicable = true;
        }
      }

      combinedHostelTotal =
        hostelAccommodationTotal + hostelSecurityDepositTotal;
    }

    // Process Transport Fee Item in ledgerItems
    const existingTrpIdx = ledgerItems.findIndex(
      (item) =>
        item.category === "Transport Fee" ||
        item.headName.toLowerCase().includes("transport"),
    );

    if (transportApplicable && activeTransportAssign) {
      const activeTa = activeTransportAssign;
      const isAC =
        String(activeTa.transportType || "AC")
          .toUpperCase()
          .includes("AC") &&
        !String(activeTa.transportType || "AC")
          .toUpperCase()
          .includes("NON");
      const trpAmount =
        Number(activeTa.feeAmount) ||
        getDynamicTransportFee({
          ...activeTa,
          feePlan: "Annual",
        }) ||
        (isAC ? 1500 : 1200) * 12;

      const trpItem: LedgerFeeItem = {
        headId: "FH-TRP",
        headName: `Transport Fee (${activeTa.routeName} - ${activeTa.pickupPoint})`,
        category: "Transport Fee",
        originalAmount: trpAmount,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: trpAmount,
        isApplicable: true,
        status: "Pending",
      };

      if (existingTrpIdx >= 0) {
        ledgerItems[existingTrpIdx] = trpItem;
      } else {
        ledgerItems.push(trpItem);
      }
    } else {
      const remarksText = isResident
        ? "Not Applicable for Residential Students"
        : "Transport Not Opted / Missing Pickup Point";

      if (existingTrpIdx >= 0) {
        ledgerItems[existingTrpIdx] = {
          ...ledgerItems[existingTrpIdx],
          originalAmount: 0,
          finalAmount: 0,
          isApplicable: false,
          remarks: remarksText,
        };
      } else {
        ledgerItems.push({
          headId: "FH-TRP",
          headName: "Transport Fee",
          category: "Transport Fee",
          originalAmount: 0,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: 0,
          isApplicable: false,
          status: "Pending",
          remarks: remarksText,
        });
      }
    }

    // Process Hostel Security Deposit Item in ledgerItems
    const existingDepIdx = ledgerItems.findIndex(
      (item) =>
        item.headId === "FH-HST-DEP" ||
        (item.headName || "").toLowerCase().includes("security deposit"),
    );

    if (hostelApplicable && hostelSecurityDepositTotal > 0) {
      const depItem: LedgerFeeItem = {
        headId: "FH-HST-DEP",
        headName: "Hostel Security Deposit",
        category: "Hostel Fee",
        originalAmount: hostelSecurityDepositTotal,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: hostelSecurityDepositTotal,
        isApplicable: true,
        status: "Pending",
        frequency: "One Time",
      } as any;

      if (existingDepIdx >= 0) {
        ledgerItems[existingDepIdx] = depItem;
      } else {
        ledgerItems.push(depItem);
      }
    } else if (existingDepIdx >= 0) {
      ledgerItems.splice(existingDepIdx, 1);
    }

    // Process Hostel Fee Item in ledgerItems
    const existingHstIdx = ledgerItems.findIndex(
      (item) =>
        (item.headId === "FH-HST" ||
          (item.category === "Hostel Fee" && item.headId !== "FH-HST-DEP") ||
          (item.headName || "").toLowerCase().includes("hostel")) &&
        !(item.headName || "").toLowerCase().includes("security deposit"),
    );

    if (hostelApplicable && hostelAccommodationTotal > 0) {
      const roomLabel = hstRoomName ? `, Room ${hstRoomName}` : "";
      const hstItem: LedgerFeeItem = {
        headId: "FH-HST",
        headName: `Hostel Fee (${hstBlockName || "Hostel"}${roomLabel})`,
        category: "Hostel Fee",
        originalAmount: hostelAccommodationTotal,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: hostelAccommodationTotal,
        isApplicable: true,
        status: "Pending",
        frequency: hostelFrequency,
      } as any;

      if (existingHstIdx >= 0) {
        ledgerItems[existingHstIdx] = hstItem;
      } else {
        ledgerItems.push(hstItem);
      }
    } else if (existingHstIdx >= 0) {
      ledgerItems[existingHstIdx] = {
        ...ledgerItems[existingHstIdx],
        originalAmount: 0,
        finalAmount: 0,
        isApplicable: false,
        remarks: isNonResident
          ? "Not Applicable for Day Scholars"
          : "Hostel Fee Not Configured for Student's Class",
      };
    }

    // 3. Deductions: Scholarships & Discounts
    const tuitionItem =
      ledgerItems.find((i) => i.category === "Tuition Fee") || ledgerItems[0];
    const baseAmountForPercent = tuitionItem ? tuitionItem.originalAmount : 0;

    const isStudentMatchForDeduction = (idToCheck?: string) => {
      if (!idToCheck) return false;
      const chk = String(idToCheck).trim().toLowerCase();
      return (
        chk === sIdStr ||
        (student?.id && chk === String(student.id).trim().toLowerCase()) ||
        (student?.admissionNo &&
          chk === String(student.admissionNo).trim().toLowerCase()) ||
        (admApp?.applicationNo &&
          chk === String(admApp.applicationNo).trim().toLowerCase())
      );
    };

    const appliedSchs = studentScholarships.filter(
      (s) => isStudentMatchForDeduction(s.studentId) && s.status === "Active",
    );
    let totalSchDeduction = 0;
    appliedSchs.forEach((sch) => {
      totalSchDeduction +=
        sch.discountType === "Percentage"
          ? (baseAmountForPercent * sch.discountValue) / 100
          : sch.discountValue;
    });

    const appliedDiscs = studentDiscounts.filter((d) =>
      isStudentMatchForDeduction(d.studentId),
    );
    let totalDiscDeduction = 0;
    appliedDiscs.forEach((sd) => {
      const dObj = discounts.find((d) => d.id === sd.discountId);
      if (dObj && (dObj.status === "Active" || !dObj.status)) {
        totalDiscDeduction +=
          dObj.mode === "Percentage"
            ? (baseAmountForPercent * (dObj.value || 0)) / 100
            : dObj.value || 0;
      }
    });

    if (tuitionItem) {
      tuitionItem.scholarshipDeduction = totalSchDeduction;
      tuitionItem.discountDeduction = totalDiscDeduction;
      tuitionItem.finalAmount = Math.max(
        0,
        tuitionItem.originalAmount - totalSchDeduction - totalDiscDeduction,
      );
    }

    const totalOriginal = ledgerItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
      0,
    );
    const totalPayable = ledgerItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
      0,
    );

    const isPaymentForThisStudent = (p: FeePayment) => {
      if (!p || !studentId) return false;
      const pSid = String(p.studentId || "")
        .trim()
        .toLowerCase();
      const pAdm = p.admissionNo
        ? String(p.admissionNo).trim().toLowerCase()
        : "";
      const sId = String(studentId || "")
        .trim()
        .toLowerCase();
      if (!sId) return false;
      if (pSid === sId || (pAdm && pAdm === sId)) return true;

      const stStudent =
        (student ? (student as Student) : undefined) ||
        students.find(
          (s) =>
            String(s.id).trim().toLowerCase() === sId ||
            (s.admissionNo &&
              String(s.admissionNo).trim().toLowerCase() === sId),
        );

      const stAdmission =
        (admApp ? (admApp as any) : undefined) ||
        admissions.find(
          (a) =>
            String(a.id).trim().toLowerCase() === sId ||
            (a.applicationNo &&
              String(a.applicationNo).trim().toLowerCase() === sId) ||
            ((a as any).registrationNo &&
              String((a as any).registrationNo)
                .trim()
                .toLowerCase() === sId) ||
            (stStudent?.admissionNo &&
              (String(a.id).trim().toLowerCase() ===
                String(stStudent.admissionNo).trim().toLowerCase() ||
                (a.applicationNo &&
                  String(a.applicationNo).trim().toLowerCase() ===
                    String(stStudent.admissionNo).trim().toLowerCase()) ||
                ((a as any).registrationNo &&
                  String((a as any).registrationNo)
                    .trim()
                    .toLowerCase() ===
                    String(stStudent.admissionNo).trim().toLowerCase()))),
        );

      const allIds = new Set<string>();
      allIds.add(sId);
      if (student?.id) allIds.add(String(student.id).trim().toLowerCase());
      if (student?.admissionNo)
        allIds.add(String(student.admissionNo).trim().toLowerCase());

      if (stStudent) {
        if (stStudent.id) allIds.add(String(stStudent.id).trim().toLowerCase());
        if (stStudent.admissionNo)
          allIds.add(String(stStudent.admissionNo).trim().toLowerCase());
      }

      if (stAdmission) {
        if (stAdmission.id)
          allIds.add(String(stAdmission.id).trim().toLowerCase());
        if (stAdmission.applicationNo)
          allIds.add(String(stAdmission.applicationNo).trim().toLowerCase());
        if ((stAdmission as any).registrationNo)
          allIds.add(
            String((stAdmission as any).registrationNo)
              .trim()
              .toLowerCase(),
          );
      }

      if (allIds.has(pSid) || (pAdm && allIds.has(pAdm))) return true;

      const stName =
        `${(stStudent || stAdmission || student)?.firstName || (stAdmission as any)?.applicantName || ""} ${(stStudent || student)?.lastName || ""}`
          .trim()
          .toLowerCase();
      const pName = String(p.studentName || "")
        .trim()
        .toLowerCase();
      if (
        stName &&
        pName &&
        (stName === pName || stName.includes(pName) || pName.includes(stName))
      )
        return true;

      return false;
    };

    const existingPayments = (feePayments || []).filter(
      (p) =>
        isPaymentForThisStudent(p) &&
        (p.academicYear === targetYear || !p.academicYear),
    );
    const paidAmt = Math.max(
      existingPayments.reduce(
        (acc, p) => acc + (Number(p.amountPaid ?? (p as any).amount) || 0),
        0,
      ),
      student?.paidFee || 0,
    );
    const dueBal = Math.max(0, totalPayable - paidAmt);

    let schId: string | undefined = undefined;
    let schName = "";
    let schDesc = "";
    if (appliedSchs.length > 0) {
      const firstSch = appliedSchs[0];
      const schMaster = scholarships.find(
        (s) =>
          s.id === firstSch.scholarshipId || s.code === firstSch.scholarshipId,
      );
      schId = firstSch.scholarshipId;
      schName = firstSch.scholarshipName || schMaster?.name || "";
      schDesc = schMaster?.description || "";
    }

    let discId: string | undefined = undefined;
    let discName = "";
    let discDesc = "";
    if (appliedDiscs.length > 0) {
      const firstDisc = appliedDiscs[0];
      const discMaster = discounts.find(
        (d) => d.id === firstDisc.discountId || d.code === firstDisc.discountId,
      );
      discId = firstDisc.discountId;
      discName = firstDisc.discountName || discMaster?.name || "";
      discDesc = discMaster?.description || "";
    }

    const newLedger: StudentFeeLedger = {
      id: `LED-${targetYear}-${studentId}`,
      studentId,
      studentName: stName,
      admissionNo: admNo,
      className: clsName,
      section: secName,
      studentType: stType,
      academicYear: targetYear,
      feeItems: ledgerItems,
      totalOriginalAmount: totalOriginal,
      grossAmount: totalOriginal,
      totalScholarship: totalSchDeduction,
      totalDiscount: totalDiscDeduction,
      totalFine: 0,
      totalPayable,
      paidAmount: paidAmt,
      dueBalance: dueBal,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      scholarshipId: schId,
      scholarshipName: schName,
      scholarshipDescription: schDesc,
      scholarshipAmount: totalSchDeduction,
      discountId: discId,
      discountName: discName,
      discountDescription: discDesc,
      discountAmount: totalDiscDeduction,
      fineAmount: 0,
      previousDue: 0,
    };

    const insts = generateInstallmentsForStudent(
      studentId,
      targetYear,
      assignment,
      newLedger,
    );
    newLedger.installments = insts;

    // Update feeItems finalAmount to match generated installments sum
    newLedger.feeItems = newLedger.feeItems.map((item) => {
      if (!item.isApplicable) return item;
      const itemInsts = insts.filter(
        (i) =>
          i.feeHeadId === item.headId ||
          i.feeHeadName.toLowerCase().trim() ===
            item.headName.toLowerCase().trim() ||
          (item.category &&
            i.feeHeadName.toLowerCase().includes(item.category.toLowerCase())),
      );
      if (itemInsts.length > 0) {
        const itemSum = itemInsts.reduce((s, i) => s + i.amount, 0);
        return {
          ...item,
          finalAmount: itemSum,
          remarks:
            item.remarks ||
            (insts[0]?.isLateAdmission
              ? `Late Admission Prorated (${itemInsts.length} periods)`
              : undefined),
        };
      }
      return item;
    });

    const instsPayable = insts.reduce((sum, i) => sum + i.amount, 0);
    newLedger.totalPayable = instsPayable;
    newLedger.dueBalance = Math.max(0, instsPayable - paidAmt);
    return newLedger;
  };

  const generateStudentFeeLedger = (
    studentId: string,
    optStudentOrYear?: Student | string,
    targetAcademicYear?: string,
  ): StudentFeeLedger => {
    const newLedger = buildStudentFeeLedgerObject(
      studentId,
      optStudentOrYear,
      targetAcademicYear,
    );
    const targetYear = newLedger.academicYear;
    const insts = newLedger.installments || [];

    queueMicrotask(() => {
      setStudentFeeInstallments((prev) => [
        ...prev.filter(
          (i) => !(i.studentId === studentId && i.academicYear === targetYear),
        ),
        ...insts,
      ]);

      setStudentFeeLedgers((prev) => [
        ...prev.filter(
          (l) => !(l.studentId === studentId && l.academicYear === targetYear),
        ),
        newLedger,
      ]);
    });

    return newLedger;
  };

  const recalculateStudentFeeLedger = (
    studentId: string,
    targetAcademicYear?: string,
  ): StudentFeeLedger => {
    return generateStudentFeeLedger(studentId, targetAcademicYear);
  };

  const getPendingUniformExtraDues = (studentId: string): number => {
    const student = students.find(
      (s) =>
        s.id === studentId || (s.admissionNo && s.admissionNo === studentId),
    );
    const targetId = student ? student.id : studentId;
    const admNo = student ? student.admissionNo || "" : studentId;

    // Method 1: Calculate extra uniform charges from studentUniformIssues
    const studentIssues = (studentUniformIssues || []).filter(
      (iss) =>
        (iss.studentId === targetId ||
          (admNo && iss.admissionNo === admNo) ||
          (student &&
            iss.studentName &&
            iss.studentName
              .toLowerCase()
              .includes(student.firstName.toLowerCase()))) &&
        iss.status === "Issued",
    );

    let totalFromIssues = 0;
    let basePackageIssued = false;

    studentIssues.forEach((iss) => {
      const isExplicitExtra =
        iss.type === "Additional Purchase" ||
        iss.itemName?.includes("(Extra)") ||
        iss.notes?.includes("Additional Purchase") ||
        iss.notes?.includes("Collect from Finance");

      const isPackage =
        iss.type === "Base Package" ||
        (iss.itemName?.includes("Package") &&
          !iss.itemName?.includes("(Extra)"));

      const unitPrice =
        iss.price ||
        (uniforms || []).find(
          (u) => u.id === iss.itemId || u.category === iss.itemName,
        )?.price ||
        (isPackage ? 3000 : 350);

      const qty = iss.quantity || 1;

      if (isExplicitExtra) {
        totalFromIssues += unitPrice * qty;
      } else if (isPackage) {
        if (!basePackageIssued) {
          basePackageIssued = true;
          // 1 package quantity is free (covered in Admission). Any extra quantity > 1 is charged.
          if (qty > 1) {
            totalFromIssues += unitPrice * (qty - 1);
          }
        } else {
          // Student already received base package earlier! Any subsequent package is charged.
          totalFromIssues += unitPrice * qty;
        }
      } else {
        // Individual uniform item (shirt, trousers, shoes, blazer, accessories, etc.)
        totalFromIssues += unitPrice * qty;
      }
    });

    // Method 2: Check pending financeTransactions under 'Uniform' category
    const extraTxns = (financeTransactions || [])
      .filter(
        (t) =>
          t.status === "Pending" &&
          t.category === "Uniform" &&
          t.sourceModule === "Uniform" &&
          (t.description?.toLowerCase().includes(targetId.toLowerCase()) ||
            (admNo &&
              t.description?.toLowerCase().includes(admNo.toLowerCase())) ||
            (student &&
              t.description
                ?.toLowerCase()
                .includes(
                  `${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`,
                ))),
      )
      .filter((t) => {
        const descLow = (t.description || "").toLowerCase();
        const isReturnedIssue = (studentUniformIssues || []).some((i) => {
          const isStudent =
            i.studentId === targetId || (admNo && i.admissionNo === admNo);
          if (!isStudent) return false;
          const isRet =
            (i.status as string) === "Returned" ||
            (i.status as string) === "Cancelled" ||
            (i.notes || "").toLowerCase().includes("returned");
          if (!isRet) return false;
          const itemClean = (i.itemName || i.itemCategory || "")
            .replace(/\s*\(extra\)/gi, "")
            .trim()
            .toLowerCase();
          return (
            itemClean && itemClean.length > 2 && descLow.includes(itemClean)
          );
        });
        return !isReturnedIssue;
      });

    const totalFromTxns = extraTxns.reduce(
      (sum, t) => sum + (t.amount || 0),
      0,
    );

    return Math.max(totalFromIssues, totalFromTxns);
  };

  const getStudentFeeLedger = (
    studentId: string,
    optStudentOrYear?: Student | AdmissionApplication | string,
    targetAcademicYear?: string,
  ): StudentFeeLedger => {
    let optStudent: Student | AdmissionApplication | undefined = undefined;
    let targetYear: string =
      selectedAcademicYear || financeSettings.academicYear || "";

    if (typeof optStudentOrYear === "string") {
      targetYear = optStudentOrYear;
    } else if (optStudentOrYear && typeof optStudentOrYear === "object") {
      optStudent = optStudentOrYear;
      if (targetAcademicYear && typeof targetAcademicYear === "string") {
        targetYear = targetAcademicYear;
      }
    } else if (targetAcademicYear && typeof targetAcademicYear === "string") {
      targetYear = targetAcademicYear;
    }

    const sIdStr = String(studentId || "")
      .trim()
      .toLowerCase();
    const resolvedStudent =
      optStudent && ("className" in optStudent || (optStudent as any).firstName)
        ? (optStudent as Student)
        : students.find(
            (s) =>
              String(s.id).trim().toLowerCase() === sIdStr ||
              (s.admissionNo &&
                String(s.admissionNo).trim().toLowerCase() === sIdStr),
          ) ||
          (() => {
            const matchedAdm = admissions.find((a) => {
              if (!a) return false;
              const aId = a.id != null ? String(a.id).trim().toLowerCase() : "";
              const aApp = a.applicationNo
                ? String(a.applicationNo).trim().toLowerCase()
                : (a as any).applicationId != null
                  ? String((a as any).applicationId)
                      .trim()
                      .toLowerCase()
                  : "";
              const aReg = a.registrationNo
                ? String(a.registrationNo).trim().toLowerCase()
                : (a as any).registrationNumber
                  ? String((a as any).registrationNumber)
                      .trim()
                      .toLowerCase()
                  : "";
              const aAdm = (a as any).admissionNo
                ? String((a as any).admissionNo)
                    .trim()
                    .toLowerCase()
                : (a as any).admissionNumber
                  ? String((a as any).admissionNumber)
                      .trim()
                      .toLowerCase()
                  : "";
              return (
                sIdStr &&
                (aId === sIdStr ||
                  aApp === sIdStr ||
                  aReg === sIdStr ||
                  aAdm === sIdStr)
              );
            });
            if (!matchedAdm) return undefined;
            const fullName = (
              matchedAdm.applicantName ||
              (matchedAdm as any).studentName ||
              `${matchedAdm.firstName || ""} ${matchedAdm.lastName || ""}`
            ).trim();
            const nameParts = fullName.split(" ");
            return {
              id: String(
                matchedAdm.id ||
                  matchedAdm.applicationNo ||
                  (matchedAdm as any).registrationNo,
              ),
              firstName: matchedAdm.firstName || nameParts[0] || "Student",
              lastName:
                matchedAdm.lastName || nameParts.slice(1).join(" ") || "",
              admissionNo:
                (matchedAdm as any).admissionNo ||
                (matchedAdm as any).admissionNumber ||
                matchedAdm.registrationNo ||
                matchedAdm.applicationNo ||
                String(matchedAdm.id),
              className:
                matchedAdm.appliedClass ||
                (matchedAdm as any).appliedClassGrade ||
                matchedAdm.targetClass ||
                matchedAdm.className ||
                "Class 1",
              section: matchedAdm.section || "",
              gender: matchedAdm.gender || "Male",
              studentType:
                matchedAdm.residentialStatus === "Residential" ||
                matchedAdm.studentType === "Residential"
                  ? "Hosteller"
                  : "Day Scholar",
              residentialStatus:
                matchedAdm.residentialStatus ||
                matchedAdm.studentType ||
                "Non-Residential",
              transportRequired: Boolean(matchedAdm.transportRequired),
              transportType: matchedAdm.transportType || "AC",
              busRoute:
                matchedAdm.busRoute || (matchedAdm as any).routeName || "",
              pickupPoint:
                matchedAdm.pickupPoint ||
                (matchedAdm as any).pickupPointName ||
                (matchedAdm as any).pickupName ||
                "",
              routeId: (matchedAdm as any).routeId || "",
              pickupPointId: (matchedAdm as any).pickupPointId || "",
            } as unknown as Student;
          })();

    const existing = studentFeeLedgers.find(
      (l) =>
        (String(l.studentId).trim().toLowerCase() === sIdStr ||
          (resolvedStudent &&
            String(l.studentId).trim().toLowerCase() ===
              String(resolvedStudent.id).trim().toLowerCase()) ||
          (resolvedStudent?.admissionNo &&
            (String(l.studentId).trim().toLowerCase() ===
              String(resolvedStudent.admissionNo).trim().toLowerCase() ||
              String(l.admissionNo).trim().toLowerCase() ===
                String(resolvedStudent.admissionNo).trim().toLowerCase()))) &&
        l.academicYear === targetYear,
    );

    const isUniform = (name: string) => {
      const l = name.toLowerCase();
      return (
        l.includes("uniform") || l.includes("kit") || l.includes("accessories")
      );
    };

    if (existing) {
      const admApp = admissions.find((a) => {
        if (!a) return false;
        const aId = a.id != null ? String(a.id).trim().toLowerCase() : "";
        const aApp = a.applicationNo
          ? String(a.applicationNo).trim().toLowerCase()
          : (a as any).applicationId != null
            ? String((a as any).applicationId)
                .trim()
                .toLowerCase()
            : "";
        const aReg = a.registrationNo
          ? String(a.registrationNo).trim().toLowerCase()
          : (a as any).registrationNumber
            ? String((a as any).registrationNumber)
                .trim()
                .toLowerCase()
            : "";
        const aAdm = (a as any).admissionNo
          ? String((a as any).admissionNo)
              .trim()
              .toLowerCase()
          : (a as any).admissionNumber
            ? String((a as any).admissionNumber)
                .trim()
                .toLowerCase()
            : "";
        const aName = (
          a.applicantName ||
          (a as any).studentName ||
          (a as any).applicantFullName ||
          `${a.firstName || ""} ${a.lastName || ""}`
        )
          .trim()
          .toLowerCase();

        if (
          sIdStr &&
          (aId === sIdStr ||
            aApp === sIdStr ||
            aReg === sIdStr ||
            aAdm === sIdStr)
        )
          return true;

        const exAdm = existing.admissionNo
          ? String(existing.admissionNo).trim().toLowerCase()
          : "";
        if (
          exAdm &&
          (aApp === exAdm || aReg === exAdm || aAdm === exAdm || aId === exAdm)
        )
          return true;

        const exName = existing.studentName
          ? String(existing.studentName).trim().toLowerCase()
          : "";
        if (
          aName &&
          exName &&
          (aName === exName || aName.includes(exName) || exName.includes(aName))
        )
          return true;

        if (resolvedStudent) {
          const rId =
            resolvedStudent.id != null
              ? String(resolvedStudent.id).trim().toLowerCase()
              : "";
          const rAdm = resolvedStudent.admissionNo
            ? String(resolvedStudent.admissionNo).trim().toLowerCase()
            : "";
          const rReg = (resolvedStudent as any).registrationNo
            ? String((resolvedStudent as any).registrationNo)
                .trim()
                .toLowerCase()
            : "";
          const rName =
            `${resolvedStudent.firstName || ""} ${resolvedStudent.lastName || ""}`
              .trim()
              .toLowerCase();

          if (
            rId &&
            (aId === rId || aApp === rId || aReg === rId || aAdm === rId)
          )
            return true;
          if (
            rAdm &&
            (aAdm === rAdm || aReg === rAdm || aApp === rAdm || aId === rAdm)
          )
            return true;
          if (rReg && (aReg === rReg || aAdm === rReg || aApp === rReg))
            return true;
          if (
            aName &&
            rName &&
            (aName === rName || aName.includes(rName) || rName.includes(aName))
          )
            return true;
        }
        return false;
      });
      const selectedOptional = admApp
        ? admApp.selectedOptionalFees || []
        : (resolvedStudent as any)?.selectedOptionalFees || null;

      const isUniformOpted = (
        optList: string[] | null | undefined,
        hId?: string,
        hName?: string,
      ) => {
        if (
          (admApp as any)?.uniformOpted === true ||
          (admApp as any)?.isUniformOpted === true ||
          (resolvedStudent as any)?.uniformOpted === true ||
          (resolvedStudent as any)?.isUniformOpted === true
        ) {
          return true;
        }
        if (
          (admApp as any)?.uniformOpted === false ||
          (admApp as any)?.isUniformOpted === false ||
          (resolvedStudent as any)?.uniformOpted === false ||
          (resolvedStudent as any)?.isUniformOpted === false
        ) {
          return false;
        }
        const persistedOpt =
          getPersistedOptionalFees(studentId) ||
          (resolvedStudent?.admissionNo
            ? getPersistedOptionalFees(resolvedStudent.admissionNo)
            : null);
        const listToUse =
          optList && Array.isArray(optList) && optList.length > 0
            ? optList
            : persistedOpt || [];
        if (!listToUse || !Array.isArray(listToUse) || listToUse.length === 0)
          return false;
        if (hId && listToUse.includes(hId)) return true;
        if (
          hName &&
          listToUse.some(
            (id) =>
              String(id).toLowerCase().includes("uniform") ||
              String(id).toLowerCase().includes("kit"),
          )
        )
          return true;
        return listToUse.some((id) => {
          const s = String(id).toLowerCase();
          return (
            s === "fh-04" ||
            s === "fh-004" ||
            s === "fh-uni-base" ||
            s.includes("uniform") ||
            s.includes("kit")
          );
        });
      };

      const assignment = findActiveStudentFeeAssignment(
        studentId,
        resolvedStudent || optStudent,
        targetYear,
      );
      const hasUniformInAssignment = assignment?.assignedFeeHeads?.some(
        (h) =>
          isUniform(h.feeHeadName) ||
          h.feeHeadId === "FH-04" ||
          h.feeHeadId === "FH-004",
      );

      const student =
        optStudent && "className" in optStudent
          ? (optStudent as Student)
          : resolvedStudent ||
            students.find(
              (s) => s.id === studentId || s.admissionNo === studentId,
            );
      const clsName =
        existing.className ||
        student?.className ||
        (optStudent as any)?.className ||
        "";
      const dfs =
        dynamicFeeStructures.find(
          (d) =>
            matchesClassName(d.className, clsName) &&
            (d.status === "Active" || !d.status),
        ) ||
        dynamicFeeStructures.find((d) =>
          matchesClassName(d.className, clsName),
        );

      // STRICT DYNAMIC VALIDATION:
      // If student has NO active fee assignment and NO dynamic fee structure in MySQL for their class,
      // any existing ledger with tuition/school fees is STALE mock data and MUST NOT be used!
      if (!assignment && !dfs) {
        return buildStudentFeeLedgerObject(studentId, optStudent, targetYear);
      }

      if (assignment) {
        const existingBaseTotal = existing.feeItems
          .filter(
            (fi) =>
              fi.headId !== "FH-TRP" &&
              fi.category !== "Transport Fee" &&
              fi.headId !== "FH-HST" &&
              fi.category !== "Hostel Fee" &&
              fi.headId !== "FH-UNI-EXTRA" &&
              fi.category !== "Additional Uniform Purchase",
          )
          .reduce((sum, fi) => sum + fi.originalAmount, 0);

        if (
          existingBaseTotal !== assignment.baseFeeTotal &&
          existing.grossAmount !== assignment.baseFeeTotal
        ) {
          return buildStudentFeeLedgerObject(studentId, optStudent, targetYear);
        }

        const policyLower = String(assignment.feePolicy || "")
          .toLowerCase()
          .trim();
        const isFullAnnualPolicy =
          policyLower === "full annual fee" ||
          policyLower === "full annual" ||
          policyLower === "one time" ||
          policyLower === "one-time" ||
          policyLower === "annual" ||
          policyLower.includes("full") ||
          policyLower.includes("one time") ||
          policyLower.includes("one-time");

        if (existing.installments && existing.installments.length > 0) {
          const hasQuarterlyOrTermInstallments = existing.installments.some(
            (inst) =>
              inst.frequency === "Quarterly" ||
              inst.frequency === "Term-wise" ||
              (inst.termName &&
                (inst.termName.toLowerCase().includes("term") ||
                  inst.termName.toLowerCase().includes("quarter"))),
          );
          const hasOnlyOneTimeInstallment = existing.installments.every(
            (inst) =>
              inst.frequency === "One Time" ||
              inst.termName === "Full Annual Fee" ||
              inst.termName === "Annual / One-Time",
          );

          if (
            (isFullAnnualPolicy && hasQuarterlyOrTermInstallments) ||
            (!isFullAnnualPolicy && hasOnlyOneTimeInstallment)
          ) {
            return buildStudentFeeLedgerObject(
              studentId,
              optStudent,
              targetYear,
            );
          }
        }
      }

      if (dfs && dfs.items && dfs.items.length > 0) {
        const hasMissingHead = dfs.items.some((di) => {
          return !existing.feeItems.some(
            (fi) =>
              fi.headId === di.feeHeadId ||
              fi.headName.toLowerCase().trim() ===
                di.feeHeadName.toLowerCase().trim(),
          );
        });

        const hasAmountMismatch = dfs.items.some((di) => {
          const matchingFi = existing.feeItems.find(
            (fi) =>
              fi.headId === di.feeHeadId ||
              fi.headName.toLowerCase().trim() ===
                di.feeHeadName.toLowerCase().trim(),
          );
          return matchingFi && matchingFi.originalAmount !== di.amount;
        });

        const hasExtraHead = existing.feeItems.some((fi) => {
          if (fi.headId === "FH-TRP" || fi.category === "Transport Fee")
            return false;
          if (fi.headId === "FH-HST" || fi.category === "Hostel Fee")
            return false;
          if (
            fi.headId === "FH-UNI-EXTRA" ||
            fi.category === "Additional Uniform Purchase"
          )
            return false;
          return !dfs.items.some(
            (di) =>
              di.feeHeadId === fi.headId ||
              di.feeHeadName.toLowerCase().trim() ===
                fi.headName.toLowerCase().trim(),
          );
        });

        if (
          hasMissingHead ||
          hasAmountMismatch ||
          hasExtraHead ||
          existing.grossAmount !== dfs.totalAmount
        ) {
          return buildStudentFeeLedgerObject(studentId, optStudent, targetYear);
        }
      }

      const hasUniformIssued = (studentUniformIssues || []).some((issue) => {
        if (!issue) return false;
        const iId = String(issue.studentId || "")
          .trim()
          .toLowerCase();
        const iAdm = String(issue.admissionNo || "")
          .trim()
          .toLowerCase();
        const rId = String(studentId || "")
          .trim()
          .toLowerCase();
        const rAdm = resolvedStudent?.admissionNo
          ? String(resolvedStudent.admissionNo).trim().toLowerCase()
          : "";
        const isMatch =
          (rId && (iId === rId || iAdm === rId)) ||
          (rAdm && (iId === rAdm || iAdm === rAdm));
        return (
          isMatch &&
          (issue.status as string) !== "Returned" &&
          (issue.status as string) !== "Cancelled"
        );
      });

      const sanitizedItems = existing.feeItems.map((fi) => {
        if (
          isUniform(fi.headName) &&
          fi.category !== "Additional Uniform Purchase"
        ) {
          const isOptedInApp = isUniformOpted(
            selectedOptional,
            fi.headId,
            fi.headName,
          );
          const shouldBeApplicable = isOptedInApp || hasUniformIssued;

          return {
            ...fi,
            isApplicable: shouldBeApplicable,
            finalAmount: shouldBeApplicable ? fi.originalAmount : 0,
            status: fi.status || ("Pending" as const),
            remarks: shouldBeApplicable
              ? fi.remarks
              : "Optional Fee - Not Selected at Admission",
          };
        }
        return fi;
      });

      // Inject pending additional uniform purchase dues directly into feeItems
      const pendingUniformExtras = getPendingUniformExtraDues(studentId);
      const itemsToReturn = [...sanitizedItems];

      if (pendingUniformExtras > 0) {
        const extraIdx = itemsToReturn.findIndex(
          (i) =>
            i.headId === "FH-UNI-EXTRA" ||
            i.category === "Additional Uniform Purchase",
        );
        if (extraIdx >= 0) {
          itemsToReturn[extraIdx] = {
            ...itemsToReturn[extraIdx],
            originalAmount: pendingUniformExtras,
            finalAmount: pendingUniformExtras,
            isApplicable: true,
          };
        } else {
          itemsToReturn.push({
            headId: "FH-UNI-EXTRA",
            headName: "Additional Uniform Purchase",
            category: "Additional Uniform Purchase",
            originalAmount: pendingUniformExtras,
            scholarshipDeduction: 0,
            discountDeduction: 0,
            fineAmount: 0,
            finalAmount: pendingUniformExtras,
            isApplicable: true,
            status: "Pending",
          });
        }
      }

      // Inject / Reconcile Transport Fee directly into feeItems for existing ledger
      const isResidentStudent =
        existing.studentType === "Hosteller" ||
        student?.studentType === "Hosteller" ||
        student?.studentType === "Residential" ||
        (student as any)?.residentialStatus === "Residential" ||
        (student as any)?.residentialStatus === "Resident" ||
        admApp?.residentialStatus === "Residential" ||
        admApp?.residentialStatus === "Resident" ||
        admApp?.studentType === "Residential" ||
        admApp?.studentType === "Hosteller";

      const isNonResidentStudent = !isResidentStudent;

      const activeTransportAssign = isNonResidentStudent
        ? studentTransports.find(
            (t) =>
              t.status === "Active" &&
              (t.studentId === studentId ||
                (existing.admissionNo &&
                  t.admissionNo === existing.admissionNo) ||
                (student?.admissionNo &&
                  t.admissionNo === student.admissionNo) ||
                (admApp?.registrationNo &&
                  t.admissionNo === admApp.registrationNo) ||
                (t.studentName &&
                  existing.studentName &&
                  t.studentName.trim().toLowerCase() ===
                    existing.studentName.trim().toLowerCase())),
          )
        : undefined;

      const isTransportRequired =
        isNonResidentStudent &&
        (Boolean(activeTransportAssign) ||
          student?.transportRequired === true ||
          Boolean(
            (student as any)?.busRoute || (student as any)?.pickupPoint,
          ) ||
          admApp?.transportRequired === true ||
          Boolean((admApp as any)?.busRoute || (admApp as any)?.pickupPoint));

      const hasPickupPoint = Boolean(
        activeTransportAssign?.pickupPoint ||
        (student as any)?.pickupPoint ||
        (admApp as any)?.pickupPoint,
      );

      const existingTrpIdx = itemsToReturn.findIndex(
        (i) =>
          i.headId === "FH-TRP" ||
          i.category === "Transport Fee" ||
          i.headName.toLowerCase().includes("transport"),
      );

      if (isTransportRequired && hasPickupPoint) {
        const routeName =
          activeTransportAssign?.routeName ||
          (student as any)?.busRoute ||
          (admApp as any)?.busRoute ||
          (admApp as any)?.routeName ||
          "";
        const pickupName =
          activeTransportAssign?.pickupPoint ||
          (student as any)?.pickupPoint ||
          (admApp as any)?.pickupPoint ||
          "";
        const routeId =
          activeTransportAssign?.routeId ||
          (student as any)?.routeId ||
          (admApp as any)?.routeId ||
          "";
        const pickupPointId =
          (activeTransportAssign as any)?.pickupPointId ||
          (student as any)?.pickupPointId ||
          (admApp as any)?.pickupPointId ||
          "";
        const transportType =
          (activeTransportAssign as any)?.transportType ||
          (student as any)?.transportType ||
          (admApp as any)?.transportType ||
          "AC";

        const tempAssign = activeTransportAssign || {
          id: `STRP-AUTO-${studentId}`,
          studentId,
          studentName: existing.studentName || student?.firstName || "",
          admissionNo: existing.admissionNo || student?.admissionNo || "",
          routeId,
          routeName,
          pickupPointId,
          pickupPoint: pickupName,
          transportType,
          feePlan: "Annual",
          status: "Active",
        };

        let dynamicFare = getDynamicTransportFee({
          ...tempAssign,
          feePlan: "Annual",
        });

        if (dynamicFare <= 0 && (routeName || pickupName)) {
          const isAC =
            String(transportType || "AC")
              .toUpperCase()
              .includes("AC") &&
            !String(transportType || "AC")
              .toUpperCase()
              .includes("NON");
          dynamicFare = (isAC ? 1500 : 1200) * 12;
        }

        const trpAmount =
          Number(activeTransportAssign?.feeAmount) ||
          Number((student as any)?.transportFee) ||
          Number((admApp as any)?.transportFee) ||
          dynamicFare;

        if (trpAmount > 0) {
          const trpItem: LedgerFeeItem = {
            headId: "FH-TRP",
            headName: `Transport Fee (${routeName} - ${pickupName})`,
            category: "Transport Fee",
            originalAmount: trpAmount,
            scholarshipDeduction: 0,
            discountDeduction: 0,
            fineAmount: 0,
            finalAmount: trpAmount,
            isApplicable: true,
            status: "Pending",
          };

          if (existingTrpIdx >= 0) {
            itemsToReturn[existingTrpIdx] = trpItem;
          } else {
            itemsToReturn.push(trpItem);
          }
        }
      } else if (existingTrpIdx >= 0) {
        itemsToReturn[existingTrpIdx] = {
          ...itemsToReturn[existingTrpIdx],
          originalAmount: 0,
          finalAmount: 0,
          isApplicable: false,
          remarks: isResidentStudent
            ? "Not Applicable for Residential Students"
            : "Transport Not Opted",
        };
      }

      // Inject / Reconcile Hostel Fee directly into feeItems for existing ledger
      const existingHstIdx = itemsToReturn.findIndex(
        (i) =>
          i.headId === "FH-HST" ||
          i.category === "Hostel Fee" ||
          (i.headName || "").toLowerCase().includes("hostel"),
      );

      if (isResidentStudent) {
        const activeHostelAssign =
          studentHostelAssignments.find(
            (h) =>
              (h.studentId === studentId ||
                (existing.admissionNo &&
                  h.admissionNo === existing.admissionNo) ||
                (student?.admissionNo &&
                  h.admissionNo === student.admissionNo)) &&
              h.status === "Active",
          ) ||
          studentHostels.find(
            (h) =>
              (h.studentId === studentId ||
                (existing.admissionNo &&
                  (h as any).admissionNo === existing.admissionNo) ||
                (student?.admissionNo &&
                  (h as any).admissionNo === student.admissionNo)) &&
              h.status === "Active",
          );

        const hstBlockName =
          (activeHostelAssign as any)?.hostelName ||
          (activeHostelAssign as any)?.hostelId ||
          student?.hostelBlock ||
          (admApp as any)?.hostelBlock ||
          "";

        const hstRoomName =
          (activeHostelAssign as any)?.roomNumber ||
          (activeHostelAssign as any)?.roomNo ||
          (activeHostelAssign as any)?.roomTypeName ||
          student?.hostelRoom ||
          student?.hostelBed ||
          (admApp as any)?.hostelRoom ||
          (admApp as any)?.hostelBed ||
          "";

        const cleanRoom = (str?: string) =>
          String(str || "")
            .toLowerCase()
            .replace(/^room\s*/i, "")
            .trim();

        const roomType =
          (activeHostelAssign as any)?.roomTypeName ||
          (student as any)?.roomType ||
          (admApp as any)?.roomType ||
          "";

        const matchedRoomObj = (hostelRooms || []).find(
          (r: any) =>
            (cleanRoom(r.roomNo) === cleanRoom(hstRoomName) ||
              String(r.id) === String((activeHostelAssign as any)?.roomId)) &&
            (String(r.blockId) ===
              String((activeHostelAssign as any)?.blockId) ||
              !r.blockId ||
              !hstBlockName),
        );

        const isRoomAc =
          (matchedRoomObj as any)?.acType === "AC" ||
          (matchedRoomObj as any)?.isAc === true ||
          (String(roomType).toUpperCase().includes("AC") &&
            !String(roomType).toUpperCase().includes("NON"));
        const acTypeStr = isRoomAc ? "AC" : "Non-AC";

        const parsedCapMatch = roomType.match(/\d+/);
        const roomCap =
          matchedRoomObj?.capacity ||
          (activeHostelAssign as any)?.capacity ||
          (parsedCapMatch ? parseInt(parsedCapMatch[0], 10) : undefined);

        const studentClass =
          student?.className ||
          (admApp as any)?.appliedClass ||
          (admApp as any)?.className ||
          "Nursery";

        const candidateConfigs = (financeHostelConfigs || []).filter((c) => {
          if (c.status !== "Active") return false;
          if (
            c.academicYear &&
            selectedAcademicYear &&
            !matchesAcademicYear(c.academicYear, selectedAcademicYear)
          )
            return false;

          const blockMatch =
            !c.hostelName ||
            c.hostelName === "All" ||
            !hstBlockName ||
            (c.hostelId && String(c.hostelId) === String(hstBlockName)) ||
            (c.hostelName &&
              hstBlockName &&
              c.hostelName.toLowerCase() === hstBlockName.toLowerCase()) ||
            (c.hostelName &&
              hstBlockName &&
              c.hostelName
                .toLowerCase()
                .includes(hstBlockName.toLowerCase())) ||
            (c.hostelName &&
              hstBlockName &&
              hstBlockName.toLowerCase().includes(c.hostelName.toLowerCase()));
          if (!blockMatch) return false;

          if (
            !isClassInRange(
              studentClass,
              c.startClass,
              c.endClass,
              c.classRange,
              academicClasses,
            )
          )
            return false;

          if (
            c.roomNo &&
            c.roomNo !== "All Rooms" &&
            c.roomNo !== "All" &&
            hstRoomName
          ) {
            if (cleanRoom(c.roomNo) !== cleanRoom(hstRoomName)) return false;
          }

          if (c.acType && c.acType !== "All") {
            const cAc = c.acType.toUpperCase().includes("NON")
              ? "Non-AC"
              : "AC";
            if (cAc !== acTypeStr) return false;
          }

          if (c.sharingType && c.sharingType !== "All" && roomCap) {
            const capMatch =
              (c.sharingType.toLowerCase().includes("single") &&
                roomCap === 1) ||
              (c.sharingType.toLowerCase().includes("double") &&
                roomCap === 2) ||
              (c.sharingType.toLowerCase().includes("triple") &&
                roomCap === 3) ||
              (c.sharingType.toLowerCase().includes("4") && roomCap === 4) ||
              c.sharingType.includes(String(roomCap));
            if (!capMatch) return false;
          }

          return true;
        });

        candidateConfigs.sort((a, b) => {
          const aSpecificRoom = a.roomNo && a.roomNo !== "All Rooms" ? 10 : 0;
          const bSpecificRoom = b.roomNo && b.roomNo !== "All Rooms" ? 10 : 0;
          const aSpecificRt =
            a.roomTypeName && a.roomTypeName !== "All Room Types" ? 5 : 0;
          const bSpecificRt =
            b.roomTypeName && b.roomTypeName !== "All Room Types" ? 5 : 0;
          const aSpecificAc = a.acType && a.acType !== "All" ? 2 : 0;
          const bSpecificAc = b.acType && b.acType !== "All" ? 2 : 0;
          return (
            bSpecificRoom +
            bSpecificRt +
            bSpecificAc -
            (aSpecificRoom + aSpecificRt + aSpecificAc)
          );
        });

        const fhc =
          candidateConfigs[0] ||
          (financeHostelConfigs || []).find(
            (c) =>
              c.status === "Active" &&
              isClassInRange(
                studentClass,
                c.startClass,
                c.endClass,
                c.classRange,
                academicClasses,
              ),
          ) ||
          (financeHostelConfigs || []).find((c) => c.status === "Active");

        let hostelFeeTotal = 0;
        let hostelDepTotal = 0;
        let hostelFrequency = "Quarterly";

        if (fhc) {
          hostelFeeTotal = Number(fhc.hostelFee) || 0;
          hostelDepTotal = Number(fhc.securityDeposit) || 0;
          hostelFrequency = fhc.feePlan || "Quarterly";
        }

        // Process Hostel Security Deposit Item in itemsToReturn
        const existingDepIdx = itemsToReturn.findIndex(
          (i) =>
            i.headId === "FH-HST-DEP" ||
            (i.headName || "").toLowerCase().includes("security deposit"),
        );
        if (hostelDepTotal > 0) {
          const depItem: LedgerFeeItem = {
            headId: "FH-HST-DEP",
            headName: "Hostel Security Deposit",
            category: "Hostel Fee",
            originalAmount: hostelDepTotal,
            scholarshipDeduction: 0,
            discountDeduction: 0,
            fineAmount: 0,
            finalAmount: hostelDepTotal,
            isApplicable: true,
            status: "Pending",
            frequency: "One Time",
          } as any;
          if (existingDepIdx >= 0) {
            itemsToReturn[existingDepIdx] = depItem;
          } else {
            itemsToReturn.push(depItem);
          }
        } else if (existingDepIdx >= 0) {
          itemsToReturn.splice(existingDepIdx, 1);
        }

        // Process Hostel Fee Item in itemsToReturn
        const existingHstItemIdx = itemsToReturn.findIndex(
          (i) =>
            (i.headId === "FH-HST" ||
              (i.category === "Hostel Fee" && i.headId !== "FH-HST-DEP") ||
              (i.headName || "").toLowerCase().includes("hostel")) &&
            !(i.headName || "").toLowerCase().includes("security deposit"),
        );

        if (hostelFeeTotal > 0) {
          const roomLabel = hstRoomName ? `, Room ${hstRoomName}` : "";
          const hstItem: LedgerFeeItem = {
            headId: "FH-HST",
            headName: `Hostel Fee (${hstBlockName || "Hostel"}${roomLabel})`,
            category: "Hostel Fee",
            originalAmount: hostelFeeTotal,
            scholarshipDeduction: 0,
            discountDeduction: 0,
            fineAmount: 0,
            finalAmount: hostelFeeTotal,
            isApplicable: true,
            status: "Pending",
            frequency: hostelFrequency,
          } as any;

          if (existingHstItemIdx >= 0) {
            itemsToReturn[existingHstItemIdx] = hstItem;
          } else {
            itemsToReturn.push(hstItem);
          }
        }
      } else if (existingHstIdx >= 0) {
        itemsToReturn[existingHstIdx] = {
          ...itemsToReturn[existingHstIdx],
          originalAmount: 0,
          finalAmount: 0,
          isApplicable: false,
          remarks: "Not Applicable for Day Scholar Students",
        };
      }

      let finalSchAmount =
        existing.scholarshipAmount || existing.totalScholarship || 0;
      let finalDiscAmount =
        existing.discountAmount || existing.totalDiscount || 0;
      let finalSchId = existing.scholarshipId;
      let finalSchName = existing.scholarshipName;
      let finalSchDesc = existing.scholarshipDescription;
      let finalDiscId = existing.discountId;
      let finalDiscName = existing.discountName;
      let finalDiscDesc = existing.discountDescription;

      const isStudentMatchForDeduction = (idToCheck?: string) => {
        if (!idToCheck) return false;
        const chk = String(idToCheck).trim().toLowerCase();
        return (
          chk === sIdStr ||
          (student?.id && chk === String(student.id).trim().toLowerCase()) ||
          (student?.admissionNo &&
            chk === String(student.admissionNo).trim().toLowerCase())
        );
      };

      const appliedSchs = studentScholarships.filter(
        (s) => isStudentMatchForDeduction(s.studentId) && s.status === "Active",
      );
      if (finalSchAmount === 0 && appliedSchs.length > 0) {
        const activeSch = appliedSchs[0];
        const schMaster = scholarships.find(
          (s) =>
            s.id === activeSch.scholarshipId ||
            s.code === activeSch.scholarshipId,
        );
        const tuitionItem =
          itemsToReturn.find((i) => i.category === "Tuition Fee") ||
          itemsToReturn[0];
        const baseAmt = tuitionItem ? tuitionItem.originalAmount : 0;
        finalSchAmount =
          activeSch.discountType === "Percentage"
            ? (baseAmt * (activeSch.discountValue || 0)) / 100
            : activeSch.discountValue || 0;
        finalSchId = activeSch.scholarshipId;
        finalSchName = activeSch.scholarshipName || schMaster?.name || "";
        finalSchDesc = schMaster?.description || "";
        if (tuitionItem && finalSchAmount > 0) {
          tuitionItem.scholarshipDeduction = finalSchAmount;
          tuitionItem.finalAmount = Math.max(
            0,
            tuitionItem.originalAmount -
              finalSchAmount -
              (tuitionItem.discountDeduction || 0),
          );
        }
      }

      const appliedDiscs = studentDiscounts.filter((d) =>
        isStudentMatchForDeduction(d.studentId),
      );
      if (finalDiscAmount === 0 && appliedDiscs.length > 0) {
        const activeDisc = appliedDiscs[0];
        const discMaster = discounts.find(
          (d) =>
            d.id === activeDisc.discountId || d.code === activeDisc.discountId,
        );
        const tuitionItem =
          itemsToReturn.find((i) => i.category === "Tuition Fee") ||
          itemsToReturn[0];
        const baseAmt = tuitionItem ? tuitionItem.originalAmount : 0;
        finalDiscAmount =
          discMaster?.mode === "Percentage"
            ? (baseAmt * (discMaster.value || 0)) / 100
            : discMaster?.value || 0;
        finalDiscId = activeDisc.discountId;
        finalDiscName = activeDisc.discountName || discMaster?.name || "";
        finalDiscDesc = discMaster?.description || "";
        if (tuitionItem && finalDiscAmount > 0) {
          tuitionItem.discountDeduction = finalDiscAmount;
          tuitionItem.finalAmount = Math.max(
            0,
            tuitionItem.originalAmount -
              (tuitionItem.scholarshipDeduction || 0) -
              finalDiscAmount,
          );
        }
      }

      const totalOrig = itemsToReturn.reduce(
        (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
        0,
      );
      const totalPay = itemsToReturn.reduce(
        (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
        0,
      );
      const isPaymentForThisStudent = (p: FeePayment) => {
        if (!p || !studentId) return false;
        const pSid = String(p.studentId || "")
          .trim()
          .toLowerCase();
        const pAdm = p.admissionNo
          ? String(p.admissionNo).trim().toLowerCase()
          : "";
        const sId = String(studentId || "")
          .trim()
          .toLowerCase();
        if (!sId) return false;
        if (pSid === sId || (pAdm && pAdm === sId)) return true;

        const stStudent =
          (student ? (student as Student) : undefined) ||
          students.find(
            (s) =>
              String(s.id).trim().toLowerCase() === sId ||
              (s.admissionNo &&
                String(s.admissionNo).trim().toLowerCase() === sId),
          );

        const stAdmission = admissions.find(
          (a) =>
            String(a.id).trim().toLowerCase() === sId ||
            (a.applicationNo &&
              String(a.applicationNo).trim().toLowerCase() === sId) ||
            ((a as any).registrationNo &&
              String((a as any).registrationNo)
                .trim()
                .toLowerCase() === sId) ||
            (stStudent?.admissionNo &&
              (String(a.id).trim().toLowerCase() ===
                String(stStudent.admissionNo).trim().toLowerCase() ||
                (a.applicationNo &&
                  String(a.applicationNo).trim().toLowerCase() ===
                    String(stStudent.admissionNo).trim().toLowerCase()) ||
                ((a as any).registrationNo &&
                  String((a as any).registrationNo)
                    .trim()
                    .toLowerCase() ===
                    String(stStudent.admissionNo).trim().toLowerCase()))),
        );

        const allIds = new Set<string>();
        allIds.add(sId);
        if (student?.id) allIds.add(String(student.id).trim().toLowerCase());
        if (student?.admissionNo)
          allIds.add(String(student.admissionNo).trim().toLowerCase());

        if (stStudent) {
          if (stStudent.id)
            allIds.add(String(stStudent.id).trim().toLowerCase());
          if (stStudent.admissionNo)
            allIds.add(String(stStudent.admissionNo).trim().toLowerCase());
        }

        if (stAdmission) {
          if (stAdmission.id)
            allIds.add(String(stAdmission.id).trim().toLowerCase());
          if (stAdmission.applicationNo)
            allIds.add(String(stAdmission.applicationNo).trim().toLowerCase());
          if ((stAdmission as any).registrationNo)
            allIds.add(
              String((stAdmission as any).registrationNo)
                .trim()
                .toLowerCase(),
            );
        }

        if (allIds.has(pSid) || (pAdm && allIds.has(pAdm))) return true;

        const stName =
          `${(stStudent || stAdmission || student)?.firstName || (stAdmission as any)?.applicantName || ""} ${(stStudent || student)?.lastName || ""}`
            .trim()
            .toLowerCase();
        const pName = String(p.studentName || "")
          .trim()
          .toLowerCase();
        if (
          stName &&
          pName &&
          (stName === pName || stName.includes(pName) || pName.includes(stName))
        )
          return true;

        return false;
      };

      const yearPayments = (feePayments || []).filter(
        (p) =>
          isPaymentForThisStudent(p) &&
          (p.academicYear === targetYear || !p.academicYear),
      );
      const paidFromPayments = yearPayments.reduce(
        (sum, p) => sum + (Number(p.amountPaid ?? (p as any).amount) || 0),
        0,
      );
      const effectivePaid = Math.max(
        existing.paidAmount || 0,
        paidFromPayments,
        student?.paidFee || 0,
      );
      const dueBal = Math.max(0, totalPay - effectivePaid);

      const updatedLedger: StudentFeeLedger = {
        ...existing,
        feeItems: itemsToReturn,
        totalOriginalAmount: totalOrig,
        grossAmount: totalOrig,
        totalPayable: totalPay,
        paidAmount: effectivePaid,
        dueBalance: dueBal,
        scholarshipId: finalSchId,
        scholarshipName: finalSchName,
        scholarshipDescription: finalSchDesc,
        scholarshipAmount: finalSchAmount,
        totalScholarship: finalSchAmount,
        discountId: finalDiscId,
        discountName: finalDiscName,
        discountDescription: finalDiscDesc,
        discountAmount: finalDiscAmount,
        totalDiscount: finalDiscAmount,
      };

      updatedLedger.installments = generateInstallmentsForStudent(
        studentId,
        targetYear,
        assignment,
        updatedLedger,
      );

      return updatedLedger;
    }

    return buildStudentFeeLedgerObject(studentId, optStudent, targetYear);
  };

  // SINGLE SOURCE OF TRUTH HELPER FOR CONSOLIDATED STUDENT OUTSTANDING DUES
  const getStudentFeeOutstandingSummary = (
    studentId: string,
  ): StudentFeeOutstandingSummary => {
    const student =
      students.find(
        (s) =>
          s.id === studentId || (s.admissionNo && s.admissionNo === studentId),
      ) ||
      (() => {
        const sId = String(studentId || "")
          .trim()
          .toLowerCase();
        const adm = (admissions || []).find((a) => {
          if (!a) return false;
          const aId = a.id != null ? String(a.id).trim().toLowerCase() : "";
          const aApp = a.applicationNo
            ? String(a.applicationNo).trim().toLowerCase()
            : (a as any).applicationId != null
              ? String((a as any).applicationId)
                  .trim()
                  .toLowerCase()
              : "";
          const aReg = a.registrationNo
            ? String(a.registrationNo).trim().toLowerCase()
            : (a as any).registrationNumber
              ? String((a as any).registrationNumber)
                  .trim()
                  .toLowerCase()
              : "";
          const aAdm = (a as any).admissionNo
            ? String((a as any).admissionNo)
                .trim()
                .toLowerCase()
            : (a as any).admissionNumber
              ? String((a as any).admissionNumber)
                  .trim()
                  .toLowerCase()
              : "";
          const aName = (
            a.applicantName ||
            (a as any).studentName ||
            (a as any).applicantFullName ||
            `${a.firstName || ""} ${a.lastName || ""}`
          )
            .trim()
            .toLowerCase();
          return (
            sId &&
            (aId === sId ||
              aApp === sId ||
              aReg === sId ||
              aAdm === sId ||
              aName === sId ||
              aName.includes(sId))
          );
        });
        if (!adm) return undefined;
        const fullName = (
          adm.applicantName ||
          (adm as any).studentName ||
          (adm as any).applicantFullName ||
          `${adm.firstName || ""} ${adm.lastName || ""}`
        ).trim();
        const nameParts = fullName.split(" ");
        return {
          id: String(
            adm.id || adm.applicationNo || (adm as any).registrationNo,
          ),
          firstName: adm.firstName || nameParts[0] || "Student",
          lastName: adm.lastName || nameParts.slice(1).join(" ") || "",
          admissionNo:
            (adm as any).admissionNo ||
            (adm as any).admissionNumber ||
            adm.registrationNo ||
            adm.applicationNo ||
            String(adm.id),
          className:
            adm.appliedClass ||
            (adm as any).appliedClassGrade ||
            adm.targetClass ||
            adm.className ||
            "Nursery",
          section: adm.section || "",
          gender: adm.gender || "Male",
          studentType:
            adm.residentialStatus === "Residential" ||
            adm.studentType === "Residential"
              ? "Hosteller"
              : "Day Scholar",
          residentialStatus:
            adm.residentialStatus || adm.studentType || "Non-Residential",
          joiningDate:
            adm.admissionDate ||
            (adm as any).createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          dueFee: 0,
          paidFee: 0,
          totalFee: 0,
          rollNo: "0",
          fatherName: adm.parentName || (adm as any).fatherName || "",
          motherName: adm.motherName || "",
          mobile: adm.mobile || adm.phone || "",
          email: adm.email || "",
          address: adm.address || "",
          status: "Active",
          academicYear: adm.academicYear || "2026-2027",
          branch: adm.branch || "",
          transportRequired: Boolean(adm.transportRequired),
          transportType: adm.transportType || "AC",
          busRoute: adm.busRoute || (adm as any).routeName || "",
          pickupPoint:
            adm.pickupPoint ||
            (adm as any).pickupPointName ||
            (adm as any).pickupName ||
            "",
          routeId: (adm as any).routeId || "",
          pickupPointId: (adm as any).pickupPointId || "",
          registrationNo:
            adm.registrationNo || (adm as any).registrationNumber || "",
          applicationNo: adm.applicationNo || (adm as any).applicationId || "",
        } as unknown as Student;
      })();
    const activeAcademicYear =
      selectedAcademicYear || financeSettings?.academicYear || "";

    const isPaymentForThisStudent = (p: FeePayment) => {
      if (!p || !studentId) return false;
      const pSid = String(p.studentId || "")
        .trim()
        .toLowerCase();
      const pAdm = p.admissionNo
        ? String(p.admissionNo).trim().toLowerCase()
        : "";
      const sId = String(studentId || "")
        .trim()
        .toLowerCase();
      if (!sId) return false;
      if (pSid === sId || (pAdm && pAdm === sId)) return true;

      const stStudent =
        (student ? (student as Student) : undefined) ||
        students.find(
          (s) =>
            String(s.id).trim().toLowerCase() === sId ||
            (s.admissionNo &&
              String(s.admissionNo).trim().toLowerCase() === sId),
        );

      const stAdmission = admissions.find(
        (a) =>
          String(a.id).trim().toLowerCase() === sId ||
          (a.applicationNo &&
            String(a.applicationNo).trim().toLowerCase() === sId) ||
          ((a as any).registrationNo &&
            String((a as any).registrationNo)
              .trim()
              .toLowerCase() === sId) ||
          (stStudent?.admissionNo &&
            (String(a.id).trim().toLowerCase() ===
              String(stStudent.admissionNo).trim().toLowerCase() ||
              (a.applicationNo &&
                String(a.applicationNo).trim().toLowerCase() ===
                  String(stStudent.admissionNo).trim().toLowerCase()) ||
              ((a as any).registrationNo &&
                String((a as any).registrationNo)
                  .trim()
                  .toLowerCase() ===
                  String(stStudent.admissionNo).trim().toLowerCase()))),
      );

      const allIds = new Set<string>();
      allIds.add(sId);
      if (student?.id) allIds.add(String(student.id).trim().toLowerCase());
      if (student?.admissionNo)
        allIds.add(String(student.admissionNo).trim().toLowerCase());

      if (stStudent) {
        if (stStudent.id) allIds.add(String(stStudent.id).trim().toLowerCase());
        if (stStudent.admissionNo)
          allIds.add(String(stStudent.admissionNo).trim().toLowerCase());
      }

      if (stAdmission) {
        if (stAdmission.id)
          allIds.add(String(stAdmission.id).trim().toLowerCase());
        if (stAdmission.applicationNo)
          allIds.add(String(stAdmission.applicationNo).trim().toLowerCase());
        if ((stAdmission as any).registrationNo)
          allIds.add(
            String((stAdmission as any).registrationNo)
              .trim()
              .toLowerCase(),
          );
      }

      if (allIds.has(pSid) || (pAdm && allIds.has(pAdm))) return true;

      const stName =
        `${(stStudent || stAdmission || student)?.firstName || (stAdmission as any)?.applicantName || ""} ${(stStudent || student)?.lastName || ""}`
          .trim()
          .toLowerCase();
      const pName = String(p.studentName || "")
        .trim()
        .toLowerCase();
      if (
        stName &&
        pName &&
        (stName === pName || stName.includes(pName) || pName.includes(stName))
      )
        return true;

      return false;
    };

    const studentPayments = (feePayments || []).filter(isPaymentForThisStudent);
    const currentYearPayments = studentPayments.filter(
      (p) => p.academicYear === activeAcademicYear || !p.academicYear,
    );
    const totalPaidCurrentYear = currentYearPayments.reduce(
      (sum, p) => sum + (Number(p.amountPaid ?? (p as any).amount) || 0),
      0,
    );

    // All ledgers for this student
    let studentLedgers = studentFeeLedgers.filter(
      (l) =>
        l.studentId === studentId ||
        (student && l.studentId === student.id) ||
        (student?.admissionNo && l.admissionNo === student.admissionNo),
    );

    // Filter studentLedgers: only retain ledgers with genuine assignments, payments, or addons
    studentLedgers = studentLedgers.filter((l) => {
      const hasAssign = studentFeeAssignments.some(
        (a) =>
          (a.studentId === studentId ||
            (student && a.studentId === student.id) ||
            (student?.admissionNo && a.admissionNo === student.admissionNo)) &&
          (a.academicYear === l.academicYear ||
            (!a.academicYear && l.academicYear === activeAcademicYear)) &&
          a.status === "Active",
      );
      const hasPay = studentPayments.some(
        (p) =>
          p.academicYear === l.academicYear ||
          (!p.academicYear && l.academicYear === activeAcademicYear),
      );
      const hasTrp = l.feeItems?.some(
        (i) =>
          (i.headId === "FH-TRP" || i.category === "Transport Fee") &&
          i.isApplicable &&
          i.finalAmount > 0,
      );
      const hasHst = l.feeItems?.some(
        (i) =>
          (i.headId === "FH-HST" || i.category === "Hostel Fee") &&
          i.isApplicable &&
          i.finalAmount > 0,
      );
      return hasAssign || hasPay || hasTrp || hasHst;
    });

    // If student has a single ledger matching their current class, align its academicYear with activeAcademicYear
    // to prevent treating a current-class ledger as a carried-forward prior year debt.
    if (
      studentLedgers.length === 1 &&
      student &&
      studentLedgers[0].className === student.className &&
      studentLedgers[0].academicYear !== activeAcademicYear
    ) {
      studentLedgers = [
        { ...studentLedgers[0], academicYear: activeAcademicYear },
      ];
    }

    let ledgersToProcess = [...studentLedgers];

    // If no ledger exists for active academic year and student exists, synthesize active ledger ONLY IF assignment or addons/payments exist
    if (
      !ledgersToProcess.some((l) => l.academicYear === activeAcademicYear) &&
      student
    ) {
      const activeAssignment = studentFeeAssignments.find(
        (a) =>
          (a.studentId === studentId ||
            (student && a.studentId === student.id) ||
            (student?.admissionNo && a.admissionNo === student.admissionNo)) &&
          a.status === "Active",
      );
      const baseFee = activeAssignment ? activeAssignment.baseFeeTotal : 0;

      const isNonResident =
        student.studentType === "Day Scholar" ||
        student.studentType === "Non-Residential" ||
        (student as any).residentialStatus !== "Residential";

      let transportAssign = isNonResident
        ? studentTransports.find(
            (t) =>
              t.status === "Active" &&
              (t.studentId === studentId ||
                (student.admissionNo &&
                  t.admissionNo === student.admissionNo) ||
                (t.studentName &&
                  `${student.firstName} ${student.lastName}`
                    .trim()
                    .toLowerCase() === t.studentName.trim().toLowerCase())),
          )
        : undefined;

      const isTrpReq =
        isNonResident &&
        (Boolean(transportAssign) ||
          student.transportRequired === true ||
          Boolean((student as any).busRoute || (student as any).pickupPoint));

      const transportFee = isTrpReq
        ? getDynamicTransportFee(
            transportAssign || {
              id: `STRP-AUTO-${studentId}`,
              studentId,
              studentName: `${student.firstName} ${student.lastName}`,
              admissionNo: student.admissionNo || "",
              busRoute: (student as any).busRoute || "",
              pickupPoint: (student as any).pickupPoint || "",
              transportType: (student as any).transportType || "AC",
              feePlan: "Annual",
              status: "Active",
            },
          )
        : 0;

      // Include pending uniform extra purchase dues
      const pendingUniformExtrasSynth = financeTransactions
        .filter(
          (t) =>
            t.status === "Pending" &&
            t.category === "Uniform" &&
            t.sourceModule === "Uniform" &&
            t.academicYear === activeAcademicYear &&
            (t.description?.includes(studentId) ||
              (student.admissionNo &&
                t.description?.includes(student.admissionNo))),
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const isStudentMatchForDeduction = (idToCheck?: string) => {
        if (!idToCheck) return false;
        const chk = String(idToCheck).trim().toLowerCase();
        const sId = String(studentId).trim().toLowerCase();
        return (
          chk === sId ||
          (student?.id && chk === String(student.id).trim().toLowerCase()) ||
          (student?.admissionNo &&
            chk === String(student.admissionNo).trim().toLowerCase())
        );
      };

      const appliedSchs = studentScholarships.filter(
        (s) => isStudentMatchForDeduction(s.studentId) && s.status === "Active",
      );
      let totalSch = 0;
      appliedSchs.forEach((sch) => {
        totalSch +=
          sch.discountType === "Percentage"
            ? (baseFee * sch.discountValue) / 100
            : sch.discountValue;
      });

      const appliedDiscs = studentDiscounts.filter((d) =>
        isStudentMatchForDeduction(d.studentId),
      );
      let totalDisc = 0;
      appliedDiscs.forEach((sd) => {
        const dObj = discounts.find((d) => d.id === sd.discountId);
        if (dObj && (dObj.status === "Active" || !dObj.status)) {
          totalDisc +=
            dObj.mode === "Percentage"
              ? (baseFee * (dObj.value || 0)) / 100
              : dObj.value || 0;
        }
      });

      const originalGross = baseFee + transportFee + pendingUniformExtrasSynth;
      const netPayable = Math.max(0, originalGross - totalSch - totalDisc);
      const paid = Math.max(totalPaidCurrentYear, student.paidFee || 0);
      const due = Math.max(0, netPayable - paid);

      const synthesizedCurrentLedger: StudentFeeLedger = {
        id: `LED-${activeAcademicYear}-${studentId}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        className: student.className,
        section: student.section,
        studentType: (student.studentType as any) || "Day Scholar",
        academicYear: activeAcademicYear,
        feeItems: [
          {
            headId: "FH-01",
            headName: "Tuition & Academic Fee",
            category: "Tuition Fee",
            originalAmount: baseFee,
            scholarshipDeduction: totalSch,
            discountDeduction: totalDisc,
            fineAmount: 0,
            finalAmount: Math.max(0, baseFee - totalSch - totalDisc),
            isApplicable: true,
            status: (due === 0 ? "Paid" : "Pending") as "Paid" | "Pending",
          },
          ...(transportFee > 0
            ? [
                {
                  headId: "FH-TRP",
                  headName: "Transport Fee",
                  category: "Transport Fee",
                  originalAmount: transportFee,
                  scholarshipDeduction: 0,
                  discountDeduction: 0,
                  fineAmount: 0,
                  finalAmount: transportFee,
                  isApplicable: true,
                  status: (due === 0 ? "Paid" : "Pending") as
                    | "Paid"
                    | "Pending",
                },
              ]
            : []),
        ],
        totalOriginalAmount: originalGross,
        grossAmount: originalGross,
        totalScholarship: totalSch,
        totalDiscount: totalDisc,
        totalFine: 0,
        totalPayable: netPayable,
        paidAmount: paid,
        dueBalance: due,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        scholarshipAmount: totalSch,
        discountAmount: totalDisc,
        fineAmount: 0,
        previousDue: 0,
      };

      // Only synthesize active ledger if student actually has assigned fee, transport, uniform extras, or payments
      if (
        activeAssignment ||
        transportFee > 0 ||
        pendingUniformExtrasSynth > 0 ||
        totalPaidCurrentYear > 0
      ) {
        ledgersToProcess.push(synthesizedCurrentLedger);
      }
    }

    // Sort ledgers chronologically by academicYear ascending
    ledgersToProcess.sort((a, b) =>
      a.academicYear.localeCompare(b.academicYear),
    );

    const yearWiseOutstanding: YearWiseOutstandingItem[] = [];
    let currentYearDue = 0;
    let previousYearsDue = 0;

    ledgersToProcess.forEach((l) => {
      const isCurrentYr = l.academicYear === activeAcademicYear;

      let schDeduction = l.scholarshipAmount || l.totalScholarship || 0;
      let discDeduction = l.discountAmount || l.totalDiscount || 0;

      // Fallback check against active student scholarships and discounts
      if (isCurrentYr && schDeduction === 0) {
        const isStudentMatchForDeduction = (idToCheck?: string) => {
          if (!idToCheck) return false;
          const chk = String(idToCheck).trim().toLowerCase();
          const sId = String(studentId).trim().toLowerCase();
          return (
            chk === sId ||
            (student?.id && chk === String(student.id).trim().toLowerCase()) ||
            (student?.admissionNo &&
              chk === String(student.admissionNo).trim().toLowerCase())
          );
        };
        const appliedSchs = studentScholarships.filter(
          (s) =>
            isStudentMatchForDeduction(s.studentId) && s.status === "Active",
        );
        if (appliedSchs.length > 0) {
          const activeSch = appliedSchs[0];
          const tuitionItem =
            l.feeItems?.find((i) => i.category === "Tuition Fee") ||
            l.feeItems?.[0];
          const baseAmt = tuitionItem
            ? tuitionItem.originalAmount
            : l.totalOriginalAmount || l.grossAmount || 0;
          schDeduction =
            activeSch.discountType === "Percentage"
              ? (baseAmt * (activeSch.discountValue || 0)) / 100
              : activeSch.discountValue || 0;
        }
      }

      if (isCurrentYr && discDeduction === 0) {
        const isStudentMatchForDeduction = (idToCheck?: string) => {
          if (!idToCheck) return false;
          const chk = String(idToCheck).trim().toLowerCase();
          const sId = String(studentId).trim().toLowerCase();
          return (
            chk === sId ||
            (student?.id && chk === String(student.id).trim().toLowerCase()) ||
            (student?.admissionNo &&
              chk === String(student.admissionNo).trim().toLowerCase())
          );
        };
        const appliedDiscs = studentDiscounts.filter((d) =>
          isStudentMatchForDeduction(d.studentId),
        );
        if (appliedDiscs.length > 0) {
          const activeDisc = appliedDiscs[0];
          const discMaster = discounts.find(
            (d) =>
              d.id === activeDisc.discountId ||
              d.code === activeDisc.discountId,
          );
          const tuitionItem =
            l.feeItems?.find((i) => i.category === "Tuition Fee") ||
            l.feeItems?.[0];
          const baseAmt = tuitionItem
            ? tuitionItem.originalAmount
            : l.totalOriginalAmount || l.grossAmount || 0;
          discDeduction =
            discMaster?.mode === "Percentage"
              ? (baseAmt * (discMaster.value || 0)) / 100
              : discMaster?.value || 0;
        }
      }

      let grossOriginal =
        l.grossAmount || l.totalOriginalAmount || l.totalPayable || 0;

      // For the active academic year, dynamically recalculate gross to include active transport/hostel fees
      if (isCurrentYr && student) {
        const activeAssignment = studentFeeAssignments.find(
          (a) =>
            (a.studentId === studentId ||
              (student && a.studentId === student.id) ||
              (student?.admissionNo &&
                a.admissionNo === student.admissionNo)) &&
            a.status === "Active",
        );
        const baseFee = activeAssignment ? activeAssignment.baseFeeTotal : 0;

        const isNonResident =
          student.studentType === "Day Scholar" ||
          student.studentType === "Non-Residential" ||
          (student as any).residentialStatus !== "Residential";

        let transportAssign = isNonResident
          ? studentTransports.find(
              (t) =>
                t.status === "Active" &&
                (t.studentId === studentId ||
                  (student.admissionNo &&
                    t.admissionNo === student.admissionNo) ||
                  (t.studentName &&
                    `${student.firstName} ${student.lastName}`
                      .trim()
                      .toLowerCase() === t.studentName.trim().toLowerCase())),
            )
          : undefined;

        const isTrpReq =
          isNonResident &&
          (Boolean(transportAssign) ||
            student.transportRequired === true ||
            Boolean((student as any).busRoute || (student as any).pickupPoint));

        const transportFee = isTrpReq
          ? getDynamicTransportFee(
              transportAssign || {
                id: `STRP-AUTO-${studentId}`,
                studentId,
                studentName: `${student.firstName} ${student.lastName}`,
                admissionNo: student.admissionNo || "",
                busRoute: (student as any).busRoute || "",
                pickupPoint: (student as any).pickupPoint || "",
                transportType: (student as any).transportType || "AC",
                feePlan: "Annual",
                status: "Active",
              },
            )
          : 0;

        const hostelAssign = studentHostels.find(
          (h) => h.studentId === studentId && h.status === "Active",
        );
        const hostelFee =
          (student.studentType === "Hosteller" ||
            student.studentType === "Residential") &&
          hostelAssign
            ? hostelAssign.feeAmount || 0
            : 0;

        // Include pending Uniform extra purchase dues (added via Uniform Distribution module)
        const pendingUniformExtras = getPendingUniformExtraDues(studentId);

        const computedBaseGross =
          baseFee + transportFee + hostelFee + pendingUniformExtras;
        if (
          activeAssignment ||
          transportFee > 0 ||
          hostelFee > 0 ||
          pendingUniformExtras > 0
        ) {
          grossOriginal = Math.max(grossOriginal, computedBaseGross);
        } else if (
          !studentPayments.some((p) => p.academicYear === l.academicYear)
        ) {
          grossOriginal = 0;
        }
      }

      // Net payable after subtracting concessions (scholarships & discounts) and adding fine
      const netPayable =
        l.totalPayable !== undefined && l.totalPayable < grossOriginal
          ? l.totalPayable
          : Math.max(
              0,
              grossOriginal - schDeduction - discDeduction + (l.totalFine || 0),
            );

      let paid = l.paidAmount || 0;
      if (isCurrentYr) {
        paid = Math.max(paid, totalPaidCurrentYear, student?.paidFee || 0);
      } else {
        const yrPayments = studentPayments.filter(
          (p) => p.academicYear === l.academicYear,
        );
        if (yrPayments.length > 0) {
          const yrPaid = yrPayments.reduce(
            (sum, p) => sum + (Number(p.amountPaid ?? (p as any).amount) || 0),
            0,
          );
          paid = Math.max(paid, yrPaid);
        }
      }

      const due = Math.max(0, netPayable - paid);
      const status: "Paid" | "Partial" | "Pending" =
        due === 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";

      if (netPayable > 0 || paid > 0 || due > 0) {
        yearWiseOutstanding.push({
          academicYear: l.academicYear,
          ledgerId: l.id,
          className: l.className,
          gross: netPayable,
          paid,
          due,
          status,
        });

        if (isCurrentYr) {
          currentYearDue += due;
        } else if (l.academicYear < activeAcademicYear) {
          previousYearsDue += due;
        }
      }
    });

    const totalOutstanding = currentYearDue + previousYearsDue;

    return {
      studentId,
      currentAcademicYear: activeAcademicYear,
      currentYearDue,
      previousYearsDue,
      olderDues: 0,
      totalOutstanding,
      yearWiseOutstanding,
    };
  };

  // ==========================================
  // TRANSPORT ERP MODULE CRUD & CAPACITY ENGINE
  // ==========================================

  const addRouteMaster = async (r: Omit<RouteMaster, "id">) => {
    try {
      const payload = {
        routeCode: r.routeCode || "",
        routeName: r.routeName || "",
        startLocation: r.routeStart || "",
        routeStart: r.routeStart || "",
        endLocation: r.routeEnd || "",
        routeEnd: r.routeEnd || "",
        distanceKm: Number(r.totalDistanceKm) || 0,
        totalDistanceKm: Number(r.totalDistanceKm) || 0,
        estimatedDurationMinutes: Number(r.estimatedTimeMinutes) || 0,
        estimatedTimeMinutes: Number(r.estimatedTimeMinutes) || 0,
        minRangeKm: Number(r.minDistanceKm) || 0,
        minRange: Number(r.minDistanceKm) || 0,
        nonAcBaseFare: Number(r.minBaseFare) || 0,
        nonAcRateAddlKm: Number(r.ratePerKm) || 0,
        nonAcRatePerKm: Number(r.ratePerKm) || 0,
        acBaseFare: Number((r as any).acMinBaseFare) || 0,
        acRateAddlKm: Number((r as any).acRatePerKm) || 0,
        acRatePerKm: Number((r as any).acRatePerKm) || 0,
        description: r.description || "",
        status: r.status === "Active",
      };
      const response = await TransportAPI.createRouteApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (
        backendData.id ||
        backendData.routeId ||
        "RM-" + Math.floor(100 + Math.random() * 900)
      ).toString();

      localStorage.setItem(
        `route_slab_${id}`,
        JSON.stringify({
          minDistanceKm: r.minDistanceKm ?? 5,
          minBaseFare: r.minBaseFare ?? 1000,
          ratePerKm: r.ratePerKm ?? 100,
          acMinBaseFare: (r as any).acMinBaseFare ?? 1200,
          acRatePerKm: (r as any).acRatePerKm ?? 150,
        }),
      );

      const newRoute: RouteMaster = {
        ...r,
        ...backendData,
        id,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          r.status === "Active"
            ? "Active"
            : "Inactive",
        minDistanceKm: r.minDistanceKm ?? 5,
        minBaseFare: r.minBaseFare ?? 1000,
        ratePerKm: r.ratePerKm ?? 100,
        acMinBaseFare: (r as any).acMinBaseFare ?? 1200,
        acRatePerKm: (r as any).acRatePerKm ?? 150,
        branch: (r as any).branch || selectedBranch || "",
      } as any;
      setRouteMasters((prev) => [...prev, newRoute]);
      logActivity(
        "Created Transport Route",
        `Added ${newRoute.routeName} (${newRoute.routeCode})`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "RM-" + Math.floor(100 + Math.random() * 900);

      localStorage.setItem(
        `route_slab_${id}`,
        JSON.stringify({
          minDistanceKm: r.minDistanceKm ?? 5,
          minBaseFare: r.minBaseFare ?? 1000,
          ratePerKm: r.ratePerKm ?? 100,
          acMinBaseFare: (r as any).acMinBaseFare ?? 1200,
          acRatePerKm: (r as any).acRatePerKm ?? 150,
        }),
      );

      const newRoute: RouteMaster = {
        ...r,
        id,
        minDistanceKm: r.minDistanceKm ?? 5,
        minBaseFare: r.minBaseFare ?? 1000,
        ratePerKm: r.ratePerKm ?? 100,
        acMinBaseFare: (r as any).acMinBaseFare ?? 1200,
        acRatePerKm: (r as any).acRatePerKm ?? 150,
        branch: (r as any).branch || selectedBranch || "",
      } as any;
      setRouteMasters((prev) => [...prev, newRoute]);
      logActivity(
        "Created Transport Route (Local)",
        `Added ${newRoute.routeName}`,
      );
    }
  };

  const updateRouteMaster = async (
    id: string,
    updates: Partial<RouteMaster>,
  ) => {
    try {
      const payload: any = {};
      if (updates.routeCode !== undefined)
        payload.routeCode = updates.routeCode;
      if (updates.routeName !== undefined)
        payload.routeName = updates.routeName;
      if (updates.routeStart !== undefined) {
        payload.startLocation = updates.routeStart;
        payload.routeStart = updates.routeStart;
      }
      if (updates.routeEnd !== undefined) {
        payload.endLocation = updates.routeEnd;
        payload.routeEnd = updates.routeEnd;
      }
      if (updates.totalDistanceKm !== undefined) {
        payload.distanceKm = Number(updates.totalDistanceKm) || 0;
        payload.totalDistanceKm = Number(updates.totalDistanceKm) || 0;
      }
      if (updates.estimatedTimeMinutes !== undefined) {
        payload.estimatedDurationMinutes =
          Number(updates.estimatedTimeMinutes) || 0;
        payload.estimatedTimeMinutes =
          Number(updates.estimatedTimeMinutes) || 0;
      }
      if (updates.minDistanceKm !== undefined) {
        payload.minRangeKm = Number(updates.minDistanceKm) || 0;
        payload.minRange = Number(updates.minDistanceKm) || 0;
      }
      if (updates.minBaseFare !== undefined) {
        payload.nonAcBaseFare = Number(updates.minBaseFare) || 0;
      }
      if (updates.ratePerKm !== undefined) {
        payload.nonAcRateAddlKm = Number(updates.ratePerKm) || 0;
        payload.nonAcRatePerKm = Number(updates.ratePerKm) || 0;
      }
      if ((updates as any).acMinBaseFare !== undefined) {
        payload.acBaseFare = Number((updates as any).acMinBaseFare) || 0;
      }
      if ((updates as any).acRatePerKm !== undefined) {
        payload.acRateAddlKm = Number((updates as any).acRatePerKm) || 0;
        payload.acRatePerKm = Number((updates as any).acRatePerKm) || 0;
      }
      if (updates.description !== undefined)
        payload.description = updates.description;
      if (updates.status !== undefined)
        payload.status = updates.status === "Active";

      await TransportAPI.updateRouteApi(id, payload);

      const currentStored = localStorage.getItem(`route_slab_${id}`);
      let parsed = {
        minDistanceKm: 5,
        minBaseFare: 1000,
        ratePerKm: 100,
        acMinBaseFare: 1200,
        acRatePerKm: 150,
      };
      if (currentStored) {
        try {
          parsed = JSON.parse(currentStored);
        } catch {}
      }
      localStorage.setItem(
        `route_slab_${id}`,
        JSON.stringify({
          minDistanceKm:
            updates.minDistanceKm !== undefined
              ? updates.minDistanceKm
              : parsed.minDistanceKm,
          minBaseFare:
            updates.minBaseFare !== undefined
              ? updates.minBaseFare
              : parsed.minBaseFare,
          ratePerKm:
            updates.ratePerKm !== undefined
              ? updates.ratePerKm
              : parsed.ratePerKm,
          acMinBaseFare:
            (updates as any).acMinBaseFare !== undefined
              ? (updates as any).acMinBaseFare
              : parsed.acMinBaseFare,
          acRatePerKm:
            (updates as any).acRatePerKm !== undefined
              ? (updates as any).acRatePerKm
              : parsed.acRatePerKm,
        }),
      );

      setRouteMasters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
      logActivity("Updated Transport Route", `Updated Route ID ${id}`);
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");

      const currentStored = localStorage.getItem(`route_slab_${id}`);
      let parsed = {
        minDistanceKm: 5,
        minBaseFare: 1000,
        ratePerKm: 100,
        acMinBaseFare: 1200,
        acRatePerKm: 150,
      };
      if (currentStored) {
        try {
          parsed = JSON.parse(currentStored);
        } catch {}
      }
      localStorage.setItem(
        `route_slab_${id}`,
        JSON.stringify({
          minDistanceKm:
            updates.minDistanceKm !== undefined
              ? updates.minDistanceKm
              : parsed.minDistanceKm,
          minBaseFare:
            updates.minBaseFare !== undefined
              ? updates.minBaseFare
              : parsed.minBaseFare,
          ratePerKm:
            updates.ratePerKm !== undefined
              ? updates.ratePerKm
              : parsed.ratePerKm,
          acMinBaseFare:
            (updates as any).acMinBaseFare !== undefined
              ? (updates as any).acMinBaseFare
              : parsed.acMinBaseFare,
          acRatePerKm:
            (updates as any).acRatePerKm !== undefined
              ? (updates as any).acRatePerKm
              : parsed.acRatePerKm,
        }),
      );

      setRouteMasters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    }
  };

  const deleteRouteMaster = async (id: string) => {
    const cleanId = String(id || "").trim();
    const targetRoute = routeMasters.find(
      (r) =>
        String(r.id) === cleanId ||
        r.id === id ||
        (r.routeCode && r.routeCode.toLowerCase() === cleanId.toLowerCase()),
    );
    const routeCode = targetRoute?.routeCode;
    const routeName = targetRoute?.routeName;
    const routeId = targetRoute?.id ? String(targetRoute.id) : cleanId;

    // Immediately record in deleted track set so fetch re-hydrations won't bring it back
    const deletedTrack = new Set<string>(
      JSON.parse(localStorage.getItem("edu_db_deleted_route_ids") || "[]"),
    );
    deletedTrack.add(cleanId);
    if (routeId) deletedTrack.add(String(routeId));
    if (routeCode) deletedTrack.add(String(routeCode));
    if (routeName) deletedTrack.add(String(routeName));
    localStorage.setItem(
      "edu_db_deleted_route_ids",
      JSON.stringify(Array.from(deletedTrack)),
    );

    try {
      // Find all pickup points belonging to this route and delete them from the backend
      const pointsToDelete = pickupPoints.filter(
        (p) =>
          p.routeId === cleanId ||
          String(p.routeId) === cleanId ||
          (routeCode && p.routeName === routeCode),
      );
      for (const p of pointsToDelete) {
        try {
          await TransportAPI.deletePickupPointApi(p.id);
        } catch (e) {
          console.warn(
            "Failed to delete pickup point during route deletion",
            e,
          );
        }
      }

      // Find all vehicle assignments belonging to this route and delete them from the backend
      const assignmentsToDelete = vehicleAssignments.filter(
        (a) =>
          a.routeId === cleanId ||
          String(a.routeId) === cleanId ||
          (routeCode && a.routeName === routeCode) ||
          (routeName && a.routeName === routeName),
      );
      for (const a of assignmentsToDelete) {
        try {
          await TransportAPI.deleteVehicleAssignmentApi(a.id);
        } catch (e) {
          console.warn(
            "Failed to delete vehicle assignment during route deletion",
            e,
          );
        }
      }

      // Delete route from backend API (by ID, Route Code, and Route Name)
      await TransportAPI.deleteRouteApi(routeId);
      if (routeCode && routeCode !== routeId) {
        try {
          await TransportAPI.deleteRouteApi(routeCode);
        } catch (e) {
          // Ignore secondary delete attempt error
        }
      }
      if (routeName && routeName !== routeId && routeName !== routeCode) {
        try {
          await TransportAPI.deleteRouteApi(routeName);
        } catch (e) {
          // Ignore tertiary delete attempt error
        }
      }
    } catch (err) {
      console.warn("Transport route deletion error:", err);
    } finally {
      setRouteMasters((prev) => {
        const next = prev.filter(
          (r) =>
            String(r.id) !== cleanId &&
            r.id !== id &&
            (routeCode ? r.routeCode !== routeCode : true) &&
            (routeName ? r.routeName !== routeName : true),
        );
        localStorage.setItem("edu_db_route_masters", JSON.stringify(next));
        return next;
      });
      setPickupPoints((prev) => {
        const next = prev.filter(
          (p) =>
            p.routeId !== cleanId &&
            String(p.routeId) !== cleanId &&
            (routeCode ? p.routeName !== routeCode : true) &&
            (routeName ? p.routeName !== routeName : true),
        );
        localStorage.setItem("edu_db_pickup_points", JSON.stringify(next));
        return next;
      });
      setVehicleAssignments((prev) => {
        const next = prev.filter(
          (a) =>
            a.routeId !== cleanId &&
            String(a.routeId) !== cleanId &&
            (routeCode ? a.routeName !== routeCode : true) &&
            (routeName ? a.routeName !== routeName : true),
        );
        localStorage.setItem(
          "edu_db_vehicle_assignments",
          JSON.stringify(next),
        );
        return next;
      });
      setStudentTransports((prev) =>
        prev.map((st) =>
          st.routeId === cleanId ||
          String(st.routeId) === cleanId ||
          (routeCode && st.routeName === routeCode)
            ? {
                ...st,
                routeId: "",
                routeName: "Unassigned",
                pickupPoint: "Unassigned",
                vehicleId: "",
                vehicleNumber: "",
                status: "Inactive",
              }
            : st,
        ),
      );
      logActivity("Deleted Transport Route", `Removed Route ID ${cleanId}`);
    }
  };

  const toTimeSpanString = (timeStr: string): string => {
    if (!timeStr || !timeStr.trim()) return "";
    const trimmed = timeStr.trim();
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
      const parts = trimmed.split(":");
      return `${parts[0].padStart(2, "0")}:${parts[1]}:${parts[2]}`;
    }
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const parts = trimmed.split(":");
      return `${parts[0].padStart(2, "0")}:${parts[1]}:00`;
    }

    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (!match) return timeStr;

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  };

  const addPickupPoint = async (p: Omit<PickupPoint, "id">) => {
    try {
      const payload = {
        routeId:
          !isNaN(Number(p.routeId)) && Number(p.routeId) > 0
            ? Number(p.routeId)
            : p.routeId || 0,
        routeName: p.routeName || "",
        pickupPointName: p.pickupName || "",
        pickupName: p.pickupName || "",
        landmark: (p as any).landmark || "",
        sequenceNo: Number(p.sequenceNumber) || 0,
        sequenceNumber: Number(p.sequenceNumber) || 0,
        pickupTime: toTimeSpanString(
          p.morningPickupTime || p.arrivalTime || "",
        ),
        arrivalTime: toTimeSpanString(
          p.morningPickupTime || p.arrivalTime || "",
        ),
        dropTime: toTimeSpanString(p.eveningDropTime || ""),
        eveningDropTime: toTimeSpanString(p.eveningDropTime || ""),
        morningPickupTime: toTimeSpanString(
          p.morningPickupTime || p.arrivalTime || "",
        ),
        distanceFromStart: Number(p.distanceFromSchoolKm) || 0,
        distanceFromSchoolKm: Number(p.distanceFromSchoolKm) || 0,
        monthlyFee: Number(p.monthlyFee) || 0,
        monthlyFare: Number(p.monthlyFee) || 0,
        status: p.status === "Active" || (p.status as any) === true,
      };
      const response = await TransportAPI.createPickupPointApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (
        backendData.id ||
        backendData.pickupPointId ||
        "PP-" + Math.floor(100 + Math.random() * 900)
      ).toString();
      const newPt: PickupPoint = {
        ...backendData,
        ...p,
        id,
        routeId:
          p.routeId !== undefined &&
          p.routeId !== null &&
          String(p.routeId) !== "0"
            ? p.routeId
            : backendData.routeId || "",
        routeName: p.routeName || backendData.routeName || "",
        pickupName:
          p.pickupName ||
          backendData.pickupPointName ||
          backendData.pickupName ||
          "",
        sequenceNumber:
          Number(p.sequenceNumber) || Number(backendData.sequenceNo) || 1,
        morningPickupTime:
          p.morningPickupTime || p.arrivalTime || backendData.pickupTime || "",
        eveningDropTime:
          p.eveningDropTime ||
          (p as any).dropTime ||
          backendData.dropTime ||
          "",
        dropTime:
          p.eveningDropTime ||
          (p as any).dropTime ||
          backendData.dropTime ||
          "",
        isDropOptional:
          p.isDropOptional ??
          backendData.isDropOptional ??
          (!p.eveningDropTime && !(p as any).dropTime),
        distanceFromSchoolKm:
          Number(p.distanceFromSchoolKm) ||
          Number(backendData.distanceFromStart) ||
          0,
        monthlyFee:
          Number(p.monthlyFee) || Number(backendData.monthlyFare) || 0,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          p.status === "Active"
            ? "Active"
            : "Inactive",
        branch: (p as any).branch || selectedBranch || "",
      } as any;
      setPickupPoints((prev) => {
        const next = [...prev.filter((pt) => pt.id !== newPt.id), newPt];
        localStorage.setItem("edu_db_pickup_points", JSON.stringify(next));
        return next;
      });
      logActivity(
        "Created Pickup Point",
        `Added stop ${newPt.pickupName} for ${newPt.routeName}`,
      );
    } catch (err: any) {
      console.warn("API Sync fallback for create pickup point:", err);
      addToast(
        "warning",
        "API Warning",
        "Saved locally as backend API is unreachable or returned an error.",
      );
      const id = "PP-" + Math.floor(100 + Math.random() * 900);
      const newPt: PickupPoint = {
        ...p,
        id,
        branch: (p as any).branch || selectedBranch || "",
      } as any;
      setPickupPoints((prev) => {
        const next = [...prev.filter((pt) => pt.id !== newPt.id), newPt];
        localStorage.setItem("edu_db_pickup_points", JSON.stringify(next));
        return next;
      });
    }
  };

  const updatePickupPoint = async (
    id: string,
    updates: Partial<PickupPoint>,
  ) => {
    setPickupPoints((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      localStorage.setItem("edu_db_pickup_points", JSON.stringify(next));
      return next;
    });

    try {
      const payload: any = {};
      if (updates.routeId !== undefined)
        payload.routeId = Number(updates.routeId) || 0;
      if (updates.pickupName !== undefined) {
        payload.pickupPointName = updates.pickupName;
        payload.pickupName = updates.pickupName;
      }
      if ((updates as any).landmark !== undefined)
        payload.landmark = (updates as any).landmark;
      if (updates.sequenceNumber !== undefined) {
        payload.sequenceNo = Number(updates.sequenceNumber) || 0;
        payload.sequenceNumber = Number(updates.sequenceNumber) || 0;
      }
      if (updates.morningPickupTime !== undefined) {
        const tsVal = toTimeSpanString(updates.morningPickupTime);
        payload.pickupTime = tsVal;
        payload.arrivalTime = tsVal;
        payload.morningPickupTime = tsVal;
      }
      if (updates.arrivalTime !== undefined) {
        const tsVal = toTimeSpanString(updates.arrivalTime);
        payload.pickupTime = tsVal;
        payload.arrivalTime = tsVal;
        payload.morningPickupTime = tsVal;
      }
      if (
        updates.eveningDropTime !== undefined ||
        (updates as any).dropTime !== undefined
      ) {
        const val = updates.eveningDropTime || (updates as any).dropTime || "";
        const tsVal = toTimeSpanString(val);
        payload.dropTime = tsVal;
        payload.eveningDropTime = tsVal;
      }
      if (updates.isDropOptional !== undefined) {
        payload.isDropOptional = updates.isDropOptional;
      }
      if (updates.distanceFromSchoolKm !== undefined) {
        payload.distanceFromStart = Number(updates.distanceFromSchoolKm) || 0;
        payload.distanceFromSchoolKm =
          Number(updates.distanceFromSchoolKm) || 0;
      }
      if (updates.monthlyFee !== undefined) {
        payload.monthlyFee = Number(updates.monthlyFee) || 0;
        payload.monthlyFare = Number(updates.monthlyFee) || 0;
      }
      if (updates.status !== undefined) {
        payload.status =
          updates.status === "Active" || (updates.status as any) === true;
      }

      await TransportAPI.updatePickupPointApi(id, payload as any);
    } catch (err: any) {
      console.warn("API Sync fallback for update pickup point:", err);
      addToast(
        "warning",
        "API Warning",
        "Updated locally as backend API is unreachable or returned an error.",
      );
    }
  };

  const deletePickupPoint = async (id: string) => {
    const cleanId = String(id || "").trim();
    const targetPt = pickupPoints.find(
      (x) => String(x.id) === cleanId || x.id === id,
    );
    const pName = targetPt?.pickupName;
    const rId = targetPt?.routeId;

    const deletedTrack = new Set<string>(
      JSON.parse(localStorage.getItem("edu_db_deleted_pickup_ids") || "[]"),
    );
    deletedTrack.add(cleanId);
    if (pName && rId) deletedTrack.add((pName + "_" + rId).toLowerCase());
    localStorage.setItem(
      "edu_db_deleted_pickup_ids",
      JSON.stringify(Array.from(deletedTrack)),
    );

    setPickupPoints((prev) => {
      const next = prev.filter(
        (pt) => String(pt.id) !== cleanId && pt.id !== id,
      );
      localStorage.setItem("edu_db_pickup_points", JSON.stringify(next));
      return next;
    });

    if (targetPt) {
      setStudentTransports((prev) =>
        prev.map((st) =>
          st.routeId === targetPt.routeId &&
          st.pickupPoint === targetPt.pickupName
            ? { ...st, pickupPoint: "Unassigned" }
            : st,
        ),
      );
    }

    try {
      await TransportAPI.deletePickupPointApi(id);
    } catch (err: any) {
      console.warn("API Sync fallback for delete pickup point:", err);
      addToast(
        "warning",
        "API Warning",
        "Deleted locally as backend API is unreachable or returned an error.",
      );
    }
  };

  const addVehicleMaster = async (v: Omit<VehicleMaster, "id">) => {
    try {
      const payload = {
        vehicleNumber: v.vehicleNumber || "",
        registrationNumber: v.registrationNumber || "",
        regNumber: v.registrationNumber || "",
        vehicleName: v.vehicleNumber || "",
        vehicleType: v.vehicleType || "",
        capacity: Number(v.capacity) || 0,
        seatingCapacity: Number(v.capacity) || 0,
        insuranceExpiry: v.insuranceExpiry
          ? new Date(v.insuranceExpiry).toISOString()
          : null,
        pollutionExpiry: v.pollutionExpiry
          ? new Date(v.pollutionExpiry).toISOString()
          : null,
        fitnessExpiry: v.fitnessExpiry
          ? new Date(v.fitnessExpiry).toISOString()
          : null,
        isAC: (v as any).isAC === true || (v as any).isAC === "true",
        acSpecification: (v as any).acSpecification || "",
        chassisNumber: (v as any).chassisNumber || "",
        engineNumber: (v as any).engineNumber || "",
        gpsDeviceId: (v as any).gpsDeviceId || "",
        manufacturer: (v as any).manufacturer || "",
        model: (v as any).model || "",
        insuranceNumber: (v as any).insuranceNumber || "",
        status: v.status === "Active",
      };
      const response = await TransportAPI.createVehicleApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (
        backendData.id ||
        backendData.vehicleId ||
        "VM-" + Math.floor(100 + Math.random() * 900)
      ).toString();
      const newVehicle: VehicleMaster = {
        ...v,
        ...backendData,
        id,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          v.status === "Active"
            ? "Active"
            : "Inactive",
        branch: (v as any).branch || selectedBranch || "",
      } as any;
      setVehicleMasters((prev) => [...prev, newVehicle]);
      logActivity(
        "Added Fleet Vehicle",
        `Registered ${newVehicle.vehicleType} ${newVehicle.vehicleNumber}`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "VM-" + Math.floor(100 + Math.random() * 900);
      const newVehicle: VehicleMaster = {
        ...v,
        id,
        branch: (v as any).branch || selectedBranch || "",
      } as any;
      setVehicleMasters((prev) => [...prev, newVehicle]);
    }
  };

  const updateVehicleMaster = async (
    id: string,
    updates: Partial<VehicleMaster>,
  ) => {
    try {
      const payload: any = {};
      if (updates.vehicleNumber !== undefined) {
        payload.vehicleNumber = updates.vehicleNumber;
        payload.vehicleName = updates.vehicleNumber;
      }
      if (updates.registrationNumber !== undefined) {
        payload.registrationNumber = updates.registrationNumber;
        payload.regNumber = updates.registrationNumber;
      }
      if (updates.vehicleType !== undefined)
        payload.vehicleType = updates.vehicleType;
      if (updates.capacity !== undefined) {
        payload.capacity = Number(updates.capacity) || 0;
        payload.seatingCapacity = Number(updates.capacity) || 0;
      }
      if (updates.insuranceExpiry !== undefined)
        payload.insuranceExpiry = updates.insuranceExpiry
          ? new Date(updates.insuranceExpiry).toISOString()
          : null;
      if (updates.pollutionExpiry !== undefined)
        payload.pollutionExpiry = updates.pollutionExpiry
          ? new Date(updates.pollutionExpiry).toISOString()
          : null;
      if (updates.fitnessExpiry !== undefined)
        payload.fitnessExpiry = updates.fitnessExpiry
          ? new Date(updates.fitnessExpiry).toISOString()
          : null;
      if ((updates as any).isAC !== undefined)
        payload.isAC =
          (updates as any).isAC === true || (updates as any).isAC === "true";
      if (updates.status !== undefined)
        payload.status = updates.status === "Active";

      await TransportAPI.updateVehicleApi(id, payload);
      setVehicleMasters((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setVehicleMasters((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      );
    }
  };

  const deleteVehicleMaster = async (id: string) => {
    try {
      const v = vehicleMasters.find((x) => x.id === id);

      // Find all assignments referencing this vehicle and delete them from the backend
      const assignmentsToDelete = vehicleAssignments.filter(
        (a) => a.vehicleId === id || (v && a.vehicleNumber === v.vehicleNumber),
      );
      for (const a of assignmentsToDelete) {
        try {
          await TransportAPI.deleteVehicleAssignmentApi(a.id);
        } catch (e) {
          console.warn(
            "Failed to delete vehicle assignment during vehicle deletion",
            e,
          );
        }
      }

      await TransportAPI.deleteVehicleApi(id);
      setVehicleMasters((prev) => prev.filter((v) => v.id !== id));
      if (v) {
        setVehicleAssignments((prev) =>
          prev.filter(
            (a) => a.vehicleId !== id && a.vehicleNumber !== v.vehicleNumber,
          ),
        );
        setStudentTransports((prev) =>
          prev.map((st) =>
            st.vehicleId === id || st.vehicleNumber === v.vehicleNumber
              ? { ...st, vehicleId: "", vehicleNumber: "Unassigned" }
              : st,
          ),
        );
      }
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const v = vehicleMasters.find((x) => x.id === id);
      setVehicleMasters((prev) => prev.filter((v) => v.id !== id));
      if (v) {
        setVehicleAssignments((prev) =>
          prev.filter(
            (a) => a.vehicleId !== id && a.vehicleNumber !== v.vehicleNumber,
          ),
        );
        setStudentTransports((prev) =>
          prev.map((st) =>
            st.vehicleId === id || st.vehicleNumber === v.vehicleNumber
              ? { ...st, vehicleId: "", vehicleNumber: "Unassigned" }
              : st,
          ),
        );
      }
    }
  };

  const syncDriverToStaffAndAssignments = (
    id: string,
    updates: Partial<DriverMaster>,
  ) => {
    const currentDriver = driverMasters.find(
      (d) => String(d.id) === String(id),
    );
    const targetEmpId = (
      updates.employeeId ||
      currentDriver?.employeeId ||
      ""
    ).trim();
    const targetName = (
      updates.driverName ||
      currentDriver?.driverName ||
      ""
    ).trim();
    const targetMobile =
      updates.mobileNumber !== undefined
        ? updates.mobileNumber
        : currentDriver?.mobileNumber;
    const targetAddress =
      updates.address !== undefined ? updates.address : currentDriver?.address;
    const targetEmail =
      updates.email !== undefined ? updates.email : currentDriver?.email;
    const targetStatus =
      updates.status !== undefined ? updates.status : currentDriver?.status;

    let matchedStaffNumericId: number | null = null;

    setStaff((prevStaff) => {
      const sIdx = prevStaff.findIndex((s) => {
        const sEmp = (s.empId || (s as any).employeeId || "")
          .trim()
          .toLowerCase();
        const tEmp = targetEmpId.toLowerCase();
        if (tEmp && sEmp && sEmp === tEmp) return true;
        if (
          s.id &&
          (String(s.id) === String(id) ||
            (currentDriver?.id && String(s.id) === String(currentDriver.id)))
        )
          return true;
        const staffName = `${s.firstName || ""} ${s.lastName || ""}`
          .trim()
          .toLowerCase();
        if (targetName && staffName && staffName === targetName.toLowerCase())
          return true;
        return false;
      });

      if (sIdx !== -1) {
        const existingStaff = prevStaff[sIdx];
        const nId = parseInt(String(existingStaff.id), 10);
        if (!isNaN(nId)) matchedStaffNumericId = nId;

        const parts = targetName ? targetName.split(/\s+/) : [];
        const firstName = parts[0] || existingStaff.firstName;
        const lastName =
          parts.length > 1
            ? parts.slice(1).join(" ")
            : parts.length === 1
              ? ""
              : existingStaff.lastName;

        const updatedStaffMember: Staff = {
          ...existingStaff,
          ...(targetMobile !== undefined
            ? ({ phone: targetMobile, mobileNumber: targetMobile } as any)
            : {}),
          ...(targetEmail !== undefined ? { email: targetEmail } : {}),
          ...(targetAddress !== undefined
            ? { address: targetAddress, presentAddress: targetAddress }
            : {}),
          ...(targetName ? { firstName, lastName } : {}),
          ...(targetStatus !== undefined
            ? { status: targetStatus === "Active" ? "Active" : "Inactive" }
            : {}),
        };

        const nextStaff = [...prevStaff];
        nextStaff[sIdx] = updatedStaffMember;
        return nextStaff;
      }

      if (targetEmpId || targetName) {
        const parts = targetName ? targetName.split(/\s+/) : [];
        const newStaffMember: Staff = {
          id: targetEmpId || `staff-drv-${id}`,
          empId: targetEmpId || `NTS-${id}`,
          firstName: parts[0] || targetName || "Driver",
          lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
          phone: targetMobile || "",
          email: targetEmail || "",
          designation: "Driver",
          department: "Transport",
          role: "Non-Teaching Staff",
          employeeCategory: "Non-Teaching Staff",
          status: targetStatus === "Active" ? "Active" : "Inactive",
          joiningDate: new Date().toISOString().split("T")[0],
          employmentType: "Full-time",
          address: targetAddress || "",
          presentAddress: targetAddress || "",
        } as any;
        return [...prevStaff, newStaffMember];
      }

      return prevStaff;
    });

    if (matchedStaffNumericId && targetMobile !== undefined) {
      try {
        updateStaffApi(matchedStaffNumericId, {
          phone: targetMobile,
          ...(targetEmail !== undefined ? { email: targetEmail } : {}),
          ...(targetAddress !== undefined
            ? { presentAddress: targetAddress }
            : {}),
        }).catch((e) => console.warn("Background staff API update note:", e));
      } catch (e) {}
    }

    setVehicleAssignments((prevAssignments) =>
      prevAssignments.map((a) => {
        const matches =
          String(a.driverId) === String(id) ||
          (targetEmpId &&
            a.driverEmployeeId &&
            a.driverEmployeeId.trim().toLowerCase() ===
              targetEmpId.toLowerCase()) ||
          (currentDriver?.driverName &&
            a.driverName &&
            a.driverName.toLowerCase() ===
              currentDriver.driverName.toLowerCase());

        if (matches) {
          return {
            ...a,
            ...(targetName ? { driverName: targetName } : {}),
            ...(targetEmpId ? { driverEmployeeId: targetEmpId } : {}),
          };
        }
        return a;
      }),
    );
  };

  const syncAttendantToStaffAndAssignments = (
    id: string,
    updates: Partial<BusAttendantMaster>,
  ) => {
    const currentAttendant = busAttendants.find(
      (a) => String(a.id) === String(id),
    );
    const targetEmpId = (
      updates.employeeId ||
      currentAttendant?.employeeId ||
      ""
    ).trim();
    const targetName = (
      updates.attendantName ||
      currentAttendant?.attendantName ||
      ""
    ).trim();
    const targetMobile =
      updates.mobileNumber !== undefined
        ? updates.mobileNumber
        : currentAttendant?.mobileNumber;
    const targetGender =
      updates.gender !== undefined ? updates.gender : currentAttendant?.gender;
    const targetStatus =
      updates.status !== undefined ? updates.status : currentAttendant?.status;

    let matchedStaffNumericId: number | null = null;

    setStaff((prevStaff) => {
      const sIdx = prevStaff.findIndex((s) => {
        const sEmp = (s.empId || (s as any).employeeId || "")
          .trim()
          .toLowerCase();
        const tEmp = targetEmpId.toLowerCase();
        if (tEmp && sEmp && sEmp === tEmp) return true;
        if (
          s.id &&
          (String(s.id) === String(id) ||
            (currentAttendant?.id &&
              String(s.id) === String(currentAttendant.id)))
        )
          return true;
        const staffName = `${s.firstName || ""} ${s.lastName || ""}`
          .trim()
          .toLowerCase();
        if (targetName && staffName && staffName === targetName.toLowerCase())
          return true;
        return false;
      });

      if (sIdx !== -1) {
        const existingStaff = prevStaff[sIdx];
        const nId = parseInt(String(existingStaff.id), 10);
        if (!isNaN(nId)) matchedStaffNumericId = nId;

        const parts = targetName ? targetName.split(/\s+/) : [];
        const firstName = parts[0] || existingStaff.firstName;
        const lastName =
          parts.length > 1
            ? parts.slice(1).join(" ")
            : parts.length === 1
              ? ""
              : existingStaff.lastName;

        const updatedStaffMember: Staff = {
          ...existingStaff,
          ...(targetMobile !== undefined
            ? ({ phone: targetMobile, mobileNumber: targetMobile } as any)
            : {}),
          ...(targetGender !== undefined
            ? { gender: targetGender as any }
            : {}),
          ...(targetName ? { firstName, lastName } : {}),
          ...(targetStatus !== undefined
            ? { status: targetStatus === "Active" ? "Active" : "Inactive" }
            : {}),
        };

        const nextStaff = [...prevStaff];
        nextStaff[sIdx] = updatedStaffMember;
        return nextStaff;
      }

      if (targetEmpId || targetName) {
        const parts = targetName ? targetName.split(/\s+/) : [];
        const newStaffMember: Staff = {
          id: targetEmpId || `staff-att-${id}`,
          empId: targetEmpId || `NTS-${id}`,
          firstName: parts[0] || targetName || "Attendant",
          lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
          phone: targetMobile || "",
          gender: targetGender || "Male",
          designation: "Bus Attendant",
          department: "Transport",
          role: "Non-Teaching Staff",
          employeeCategory: "Non-Teaching Staff",
          status: targetStatus === "Active" ? "Active" : "Inactive",
          joiningDate: new Date().toISOString().split("T")[0],
          employmentType: "Full-time",
        } as any;
        return [...prevStaff, newStaffMember];
      }

      return prevStaff;
    });

    if (matchedStaffNumericId && targetMobile !== undefined) {
      try {
        updateStaffApi(matchedStaffNumericId, {
          phone: targetMobile,
          ...(targetGender !== undefined ? { gender: targetGender } : {}),
        }).catch((e) => console.warn("Background staff API update note:", e));
      } catch (e) {}
    }

    setVehicleAssignments((prevAssignments) =>
      prevAssignments.map((a) => {
        const matches =
          String(a.attendantId) === String(id) ||
          (targetEmpId &&
            a.attendantEmployeeId &&
            a.attendantEmployeeId.trim().toLowerCase() ===
              targetEmpId.toLowerCase()) ||
          (currentAttendant?.attendantName &&
            a.attendantName &&
            a.attendantName.toLowerCase() ===
              currentAttendant.attendantName.toLowerCase());

        if (matches) {
          return {
            ...a,
            ...(targetMobile !== undefined
              ? { attendantMobile: targetMobile }
              : {}),
            ...(targetName ? { attendantName: targetName } : {}),
            ...(targetEmpId ? { attendantEmployeeId: targetEmpId } : {}),
          };
        }
        return a;
      }),
    );
  };

  const addDriverMaster = async (d: Omit<DriverMaster, "id">) => {
    try {
      const payload = {
        employeeId: d.employeeId || "",
        empId: d.employeeId || "",
        driverName: d.driverName || "",
        driverFullName: d.driverName || "",
        fullName: d.driverName || "",
        name: d.driverName || "",
        mobileNumber: d.mobileNumber || "",
        phone: d.mobileNumber || "",
        email: d.email || "",
        licenceNumber: d.licenseNumber || "",
        licenseNumber: d.licenseNumber || "",
        commercialLicenseNo: d.licenseNumber || "",
        licenceExpiry: d.licenseExpiryDate
          ? new Date(d.licenseExpiryDate).toISOString()
          : null,
        licenseExpiryDate: d.licenseExpiryDate
          ? new Date(d.licenseExpiryDate).toISOString()
          : null,
        address: d.address || "",
        emergencyContactNumber: d.emergencyContact || "",
        emergencyContact: d.emergencyContact || "",
        experienceYears: Number(d.experienceYears) || 0,
        status: d.status === "Active",
      };
      const response = await TransportAPI.createDriverApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (backendData.id || backendData.driverId || "").toString();
      const newDriver: DriverMaster = {
        ...d,
        ...backendData,
        id,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          d.status === "Active"
            ? "Active"
            : d.status === "On Leave"
              ? "On Leave"
              : "Inactive",
        branch: (d as any).branch || selectedBranch || "",
      } as any;

      setDriverMasters((prev) => {
        const empKey = (newDriver.employeeId || "").trim().toLowerCase();
        const nameKey = (newDriver.driverName || "").trim().toLowerCase();
        const phoneKey = (newDriver.mobileNumber || "").trim();

        const exists = prev.some(
          (existing) =>
            (empKey &&
              (existing.employeeId || "").trim().toLowerCase() === empKey) ||
            existing.id === newDriver.id ||
            ((existing.driverName || "").trim().toLowerCase() === nameKey &&
              (existing.mobileNumber || "").trim() === phoneKey),
        );

        if (exists) {
          return prev.map((existing) =>
            (empKey &&
              (existing.employeeId || "").trim().toLowerCase() === empKey) ||
            existing.id === newDriver.id ||
            ((existing.driverName || "").trim().toLowerCase() === nameKey &&
              (existing.mobileNumber || "").trim() === phoneKey)
              ? { ...existing, ...newDriver }
              : existing,
          );
        }

        return [...prev, newDriver];
      });

      syncDriverToStaffAndAssignments(newDriver.id, newDriver);

      logActivity(
        "Added Transport Driver",
        `Registered driver ${newDriver.driverName}`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "DRV-" + Math.floor(100 + Math.random() * 900);
      const newDriver: DriverMaster = {
        ...d,
        id,
        branch: (d as any).branch || selectedBranch || "",
      } as any;
      setDriverMasters((prev) => [...prev, newDriver]);
      syncDriverToStaffAndAssignments(newDriver.id, newDriver);
    }
  };

  const updateDriverMaster = async (
    id: string,
    updates: Partial<DriverMaster>,
  ) => {
    try {
      const payload: any = {};
      if (updates.employeeId !== undefined) {
        payload.employeeId = updates.employeeId;
        payload.empId = updates.employeeId;
      }
      if (updates.driverName !== undefined) {
        payload.driverName = updates.driverName;
        payload.driverFullName = updates.driverName;
        payload.fullName = updates.driverName;
        payload.name = updates.driverName;
      }
      if (updates.mobileNumber !== undefined) {
        payload.mobileNumber = updates.mobileNumber;
        payload.phone = updates.mobileNumber;
      }
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.licenseNumber !== undefined) {
        payload.licenceNumber = updates.licenseNumber;
        payload.licenseNumber = updates.licenseNumber;
        payload.commercialLicenseNo = updates.licenseNumber;
      }
      if (updates.licenseExpiryDate !== undefined) {
        payload.licenceExpiry = updates.licenseExpiryDate
          ? new Date(updates.licenseExpiryDate).toISOString()
          : null;
        payload.licenseExpiryDate = updates.licenseExpiryDate
          ? new Date(updates.licenseExpiryDate).toISOString()
          : null;
      }
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.emergencyContact !== undefined) {
        payload.emergencyContactNumber = updates.emergencyContact;
        payload.emergencyContact = updates.emergencyContact;
      }
      if (updates.experienceYears !== undefined) {
        payload.experienceYears = Number(updates.experienceYears) || 0;
      }
      if (updates.status !== undefined)
        payload.status = updates.status === "Active";
      if (updates.bloodGroup !== undefined)
        payload.bloodGroup = updates.bloodGroup;
      if (updates.licenseType !== undefined)
        payload.licenseType = updates.licenseType;

      const applyLocalDriverUpdate = (prev: DriverMaster[]) => {
        let matched = false;
        const next = prev.map((d) => {
          const isMatch =
            String(d.id) === String(id) ||
            (updates.employeeId &&
              d.employeeId?.trim().toLowerCase() ===
                updates.employeeId.trim().toLowerCase());
          if (isMatch) {
            matched = true;
            return { ...d, ...updates };
          }
          return d;
        });
        const finalList = matched
          ? next
          : [
              ...next,
              {
                id: String(id),
                driverName: updates.driverName || user?.name || "",
                bloodGroup: updates.bloodGroup || "",
                licenseType: updates.licenseType || "",
                employeeId: updates.employeeId || (user as any)?.empId || "",
                mobileNumber: updates.mobileNumber || user?.phone || "",
                email: updates.email || user?.email || "",
                licenseNumber: updates.licenseNumber || "",
                licenseExpiryDate: updates.licenseExpiryDate || "",
                address: updates.address || "",
                emergencyContact: updates.emergencyContact || "",
                experienceYears: Number(updates.experienceYears) || 0,
                status: updates.status || "Active",
                branch: (updates as any).branch || selectedBranch || "",
              } as DriverMaster,
            ];
        try {
          localStorage.setItem(
            "edu_db_driver_masters",
            JSON.stringify(finalList),
          );
        } catch {}
        return finalList;
      };

      try {
        await TransportAPI.updateDriverApi(id, payload);
      } catch (apiErr) {
        console.warn("Driver API update fallback to local store", apiErr);
      }
      setDriverMasters(applyLocalDriverUpdate);
      syncDriverToStaffAndAssignments(id, updates);
    } catch (err) {
      console.warn("Driver master update error", err);
      syncDriverToStaffAndAssignments(id, updates);
    }
  };

  const deleteDriverMaster = async (id: string) => {
    try {
      // Find all assignments referencing this driver and delete them from the backend
      const assignmentsToDelete = vehicleAssignments.filter(
        (a) =>
          String(a.driverId) === String(id) ||
          (a.driverName && a.driverName.toLowerCase() === id.toLowerCase()),
      );
      for (const a of assignmentsToDelete) {
        try {
          await TransportAPI.deleteVehicleAssignmentApi(a.id);
        } catch (e) {
          console.warn(
            "Failed to delete vehicle assignment during driver deletion",
            e,
          );
        }
      }

      await TransportAPI.deleteDriverApi(id);

      setDriverMasters((prev) => {
        const next = prev.filter(
          (d) =>
            String(d.id) !== String(id) &&
            d.employeeId?.toLowerCase() !== id.toLowerCase() &&
            d.driverName?.toLowerCase() !== id.toLowerCase(),
        );
        localStorage.setItem("edu_db_driver_masters", JSON.stringify(next));
        return next;
      });

      setVehicleAssignments((prev) =>
        prev.map((a) =>
          String(a.driverId) === String(id)
            ? {
                ...a,
                driverId: "",
                driverName: "Unassigned",
                driverEmployeeId: "",
              }
            : a,
        ),
      );
      addToast(
        "success",
        "Driver Deleted",
        "Driver has been successfully deleted.",
      );
    } catch (err: any) {
      addToast(
        "error",
        "Delete Failed",
        err.message ||
          "Failed to delete driver from backend API. Please make sure the driver is unassigned first.",
      );
    }
  };

  const addBusAttendant = async (a: Omit<BusAttendantMaster, "id">) => {
    try {
      const branchCampus =
        (a as any).branch ||
        (a as any).branchCampus ||
        (selectedBranch &&
        selectedBranch !== "All Branches" &&
        selectedBranch !== "All"
          ? selectedBranch
          : "");
      const payload = {
        employeeId: a.employeeId || "",
        empId: a.employeeId || "",
        attendantName: a.attendantName || "",
        attendantFullName: a.attendantName || "",
        fullName: a.attendantName || "",
        name: a.attendantName || "",
        mobileNumber: a.mobileNumber || "",
        phone: a.mobileNumber || "",
        gender: a.gender || "",
        branchCampus: branchCampus,
        branch: branchCampus,
        status: a.status === "Active",
      };
      const response = await TransportAPI.createAttendantApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (backendData.id || backendData.attendantId || "").toString();
      const newAttendant: BusAttendantMaster = {
        ...a,
        ...backendData,
        id,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          a.status === "Active"
            ? "Active"
            : "Inactive",
        branch: (a as any).branch || selectedBranch || "",
      } as any;

      setBusAttendants((prev) => {
        const empKey = (newAttendant.employeeId || "").trim().toLowerCase();
        const nameKey = (newAttendant.attendantName || "").trim().toLowerCase();
        const phoneKey = (newAttendant.mobileNumber || "").trim();

        const exists = prev.some(
          (existing) =>
            (empKey &&
              (existing.employeeId || "").trim().toLowerCase() === empKey) ||
            existing.id === newAttendant.id ||
            ((existing.attendantName || "").trim().toLowerCase() === nameKey &&
              (existing.mobileNumber || "").trim() === phoneKey),
        );

        if (exists) {
          return prev.map((existing) =>
            (empKey &&
              (existing.employeeId || "").trim().toLowerCase() === empKey) ||
            existing.id === newAttendant.id ||
            ((existing.attendantName || "").trim().toLowerCase() === nameKey &&
              (existing.mobileNumber || "").trim() === phoneKey)
              ? { ...existing, ...newAttendant }
              : existing,
          );
        }

        return [...prev, newAttendant];
      });

      syncAttendantToStaffAndAssignments(newAttendant.id, newAttendant);

      logActivity(
        "Registered Bus Attendant",
        `Added attendant ${newAttendant.attendantName}`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "ATT-" + Math.floor(100 + Math.random() * 900);
      const newAttendant: BusAttendantMaster = {
        ...a,
        id,
        branch: (a as any).branch || selectedBranch || "",
      } as any;
      setBusAttendants((prev) => [...prev, newAttendant]);
      syncAttendantToStaffAndAssignments(newAttendant.id, newAttendant);
    }
  };

  const updateBusAttendant = async (
    id: string,
    updates: Partial<BusAttendantMaster>,
  ) => {
    try {
      const payload: any = {};
      if (updates.employeeId !== undefined) {
        payload.employeeId = updates.employeeId;
        payload.empId = updates.employeeId;
      }
      if (updates.attendantName !== undefined) {
        payload.attendantName = updates.attendantName;
        payload.attendantFullName = updates.attendantName;
        payload.fullName = updates.attendantName;
        payload.name = updates.attendantName;
      }
      if (updates.mobileNumber !== undefined) {
        payload.mobileNumber = updates.mobileNumber;
        payload.phone = updates.mobileNumber;
      }
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.status !== undefined)
        payload.status = updates.status === "Active";

      await TransportAPI.updateAttendantApi(id, payload);
      setBusAttendants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
      syncAttendantToStaffAndAssignments(id, updates);
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setBusAttendants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
      syncAttendantToStaffAndAssignments(id, updates);
    }
  };

  const deleteBusAttendant = async (id: string) => {
    try {
      // Find all assignments referencing this attendant and delete them from the backend
      const assignmentsToDelete = vehicleAssignments.filter(
        (a) => a.attendantId === id,
      );
      for (const a of assignmentsToDelete) {
        try {
          await TransportAPI.deleteVehicleAssignmentApi(a.id);
        } catch (e) {
          console.warn(
            "Failed to delete vehicle assignment during attendant deletion",
            e,
          );
        }
      }

      await TransportAPI.deleteAttendantApi(id);
      const att = busAttendants.find((x) => x.id === id);
      setBusAttendants((prev) => prev.filter((a) => a.id !== id));
      if (att) {
        setVehicleAssignments((prev) =>
          prev.map((a) =>
            a.attendantId === id || a.attendantName === att.attendantName
              ? {
                  ...a,
                  attendantId: "",
                  attendantName: "Unassigned",
                  attendantEmployeeId: "",
                }
              : a,
          ),
        );
      }
    } catch (err: any) {
      addToast(
        "error",
        "Delete Failed",
        err.message ||
          "Failed to delete attendant from backend API. Please make sure the attendant is unassigned first.",
      );
    }
  };

  const assignVehicleRouteDriver = async (
    va: Omit<VehicleAssignment, "id">,
  ) => {
    const effectiveBranch = va.branch || selectedBranch || "";
    const effectiveAcademicYear =
      va.academicYear ||
      schoolProfile.academicYear ||
      selectedAcademicYear ||
      "";
    const normalizedAssignment: Omit<VehicleAssignment, "id"> = {
      ...va,
      branch: effectiveBranch,
      academicYear: effectiveAcademicYear,
      status: va.status,
    };

    const deactivateConflicts = (
      items: VehicleAssignment[],
    ): VehicleAssignment[] =>
      items.map((existing) => {
        if (normalizedAssignment.status !== "Active") return existing;

        const isActiveConflict =
          (existing.status === "Active" ||
            (existing.status as any) === true ||
            String(existing.status).toLowerCase() === "true") &&
          (String(existing.vehicleId) ===
            String(normalizedAssignment.vehicleId) ||
            existing.vehicleNumber === normalizedAssignment.vehicleNumber ||
            String(existing.routeId) === String(normalizedAssignment.routeId) ||
            existing.routeName === normalizedAssignment.routeName ||
            String(existing.driverId) ===
              String(normalizedAssignment.driverId) ||
            existing.driverName === normalizedAssignment.driverName ||
            (normalizedAssignment.attendantId &&
              String(existing.attendantId) ===
                String(normalizedAssignment.attendantId)) ||
            (normalizedAssignment.attendantName &&
              existing.attendantName === normalizedAssignment.attendantName));

        if (!isActiveConflict) return existing;

        return {
          ...existing,
          status: "Inactive" as const,
          effectiveTo:
            existing.effectiveTo ||
            normalizedAssignment.effectiveFrom ||
            new Date().toISOString().split("T")[0],
        } as VehicleAssignment;
      });

    try {
      const payload = {
        routeId: Number(va.routeId) || 0,
        vehicleId: Number(va.vehicleId) || 0,
        driverId: Number(va.driverId) || 0,
        attendantId:
          va.attendantId &&
          !isNaN(Number(va.attendantId)) &&
          Number(va.attendantId) > 0
            ? Number(va.attendantId)
            : null,
        selectRoute: va.routeName || "",
        routeName: va.routeName || "",
        selectActiveVehicle: va.vehicleNumber || "",
        vehicleNumber: va.vehicleNumber || "",
        selectLicensedDriver: va.driverName || "",
        driverName: va.driverName || "",
        selectBusAttendant: va.attendantName || "",
        attendantName: va.attendantName || "",
        busAttendant: va.attendantName || "",
        branchName: effectiveBranch,
        branch: effectiveBranch,
        academicYear: effectiveAcademicYear,
        morningTripTime: va.morningTripTime || "07:00 AM",
        morningTrip: va.morningTripTime || "07:00 AM",
        eveningTripTime: va.eveningTripTime || "03:45 PM",
        eveningTrip: va.eveningTripTime || "03:45 PM",
        assignmentDate: new Date().toISOString(),
        effectiveFrom: va.effectiveFrom
          ? new Date(va.effectiveFrom).toISOString()
          : new Date().toISOString(),
        effectiveFromDate: va.effectiveFrom
          ? new Date(va.effectiveFrom).toISOString()
          : new Date().toISOString(),
        effectiveTo: va.effectiveTo
          ? new Date(va.effectiveTo).toISOString()
          : null,
        status: va.status === "Active" || (va.status as any) === true,
      };
      const response = await TransportAPI.createVehicleAssignmentApi(
        payload as any,
      );
      const backendData = (response as any)?.data || response || {};
      const id = (
        backendData.id ||
        backendData.assignmentId ||
        "VA-" + Math.floor(100 + Math.random() * 900)
      ).toString();
      const newAssign: VehicleAssignment = {
        ...backendData,
        ...normalizedAssignment,
        attendantId:
          backendData.attendantId || normalizedAssignment.attendantId,
        attendantName:
          backendData.attendantName || normalizedAssignment.attendantName,
        attendantEmployeeId:
          backendData.attendantEmployeeId ||
          normalizedAssignment.attendantEmployeeId,
        attendantMobile:
          backendData.attendantMobile || normalizedAssignment.attendantMobile,
        id,
        branch: effectiveBranch,
        academicYear: effectiveAcademicYear,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          normalizedAssignment.status === "Active"
            ? "Active"
            : "Inactive",
      } as any;
      setVehicleAssignments((prev) => {
        const filteredPrev = prev.filter((item) => item.id !== id);
        return [...deactivateConflicts(filteredPrev), newAssign];
      });
      logActivity(
        "Vehicle Assigned",
        `Assigned ${normalizedAssignment.vehicleNumber} to ${normalizedAssignment.routeName} with ${normalizedAssignment.driverName}${normalizedAssignment.attendantName ? ` and ${normalizedAssignment.attendantName}` : ""}`,
      );
    } catch (err: any) {
      console.warn(
        "Backend API assignment error (falling back to local state):",
        err,
      );
    }
  };

  const updateVehicleAssignment = async (
    id: string,
    updates: Partial<VehicleAssignment>,
  ) => {
    const current = vehicleAssignments.find((a) => a.id === id);
    const merged: VehicleAssignment = {
      ...(current as VehicleAssignment),
      ...(updates as VehicleAssignment),
      id,
      branch: updates.branch || current?.branch || selectedBranch || "",
      academicYear:
        updates.academicYear ||
        current?.academicYear ||
        selectedAcademicYear ||
        schoolProfile.academicYear ||
        "",
      status: (updates.status || current?.status || "Active") as
        | "Active"
        | "Inactive",
    };
    const payload: any = {};
    if (updates.routeId !== undefined) {
      payload.routeId = Number(updates.routeId) || 0;
    }
    if (updates.vehicleId !== undefined) {
      payload.vehicleId = Number(updates.vehicleId) || 0;
    }
    if (updates.driverId !== undefined) {
      payload.driverId = Number(updates.driverId) || 0;
    }
    if (updates.attendantId !== undefined) {
      payload.attendantId =
        updates.attendantId &&
        !isNaN(Number(updates.attendantId)) &&
        Number(updates.attendantId) > 0
          ? Number(updates.attendantId)
          : null;
    }
    if (updates.routeName !== undefined) {
      payload.selectRoute = updates.routeName;
      payload.routeName = updates.routeName;
    }
    if (updates.vehicleNumber !== undefined) {
      payload.selectActiveVehicle = updates.vehicleNumber;
      payload.vehicleNumber = updates.vehicleNumber;
    }
    if (updates.driverName !== undefined) {
      payload.selectLicensedDriver = updates.driverName;
      payload.driverName = updates.driverName;
    }
    if (updates.attendantName !== undefined) {
      payload.selectBusAttendant = updates.attendantName;
      payload.attendantName = updates.attendantName;
      payload.busAttendant = updates.attendantName;
    }
    if (updates.branch !== undefined) {
      payload.branchName = updates.branch;
      payload.branch = updates.branch;
    }
    if (updates.academicYear !== undefined) {
      payload.academicYear = updates.academicYear;
    }
    if (updates.morningTripTime !== undefined) {
      payload.morningTripTime = updates.morningTripTime;
      payload.morningTrip = updates.morningTripTime;
    }
    if (updates.eveningTripTime !== undefined) {
      payload.eveningTripTime = updates.eveningTripTime;
      payload.eveningTrip = updates.eveningTripTime;
    }
    if (updates.effectiveFrom !== undefined) {
      payload.effectiveFrom = updates.effectiveFrom
        ? new Date(updates.effectiveFrom).toISOString()
        : new Date().toISOString();
      payload.effectiveFromDate = updates.effectiveFrom
        ? new Date(updates.effectiveFrom).toISOString()
        : new Date().toISOString();
    }
    if (updates.effectiveTo !== undefined) {
      payload.effectiveTo = updates.effectiveTo
        ? new Date(updates.effectiveTo).toISOString()
        : null;
    }
    if (updates.status !== undefined) {
      payload.status =
        updates.status === "Active" || (updates.status as any) === true;
    }

    setVehicleAssignments((prev) => {
      const deactivateConflicts = (
        items: VehicleAssignment[],
      ): VehicleAssignment[] =>
        items.map((existing) => {
          const isActiveConflict =
            existing.id !== id &&
            (existing.status === "Active" ||
              (existing.status as any) === true ||
              String(existing.status).toLowerCase() === "true") &&
            (merged.status === "Active" ||
              (merged.status as any) === true ||
              String(merged.status).toLowerCase() === "true") &&
            (String(existing.vehicleId) === String(merged.vehicleId) ||
              existing.vehicleNumber === merged.vehicleNumber ||
              String(existing.routeId) === String(merged.routeId) ||
              existing.routeName === merged.routeName ||
              String(existing.driverId) === String(merged.driverId) ||
              existing.driverName === merged.driverName);

          if (!isActiveConflict) return existing;

          return {
            ...existing,
            status: "Inactive" as const,
            effectiveTo:
              existing.effectiveTo ||
              merged.effectiveFrom ||
              new Date().toISOString().split("T")[0],
          } as VehicleAssignment;
        });

      const sanitized: VehicleAssignment =
        merged.status === "Inactive" && !merged.effectiveTo
          ? { ...merged, effectiveTo: new Date().toISOString().split("T")[0] }
          : merged;

      const nextState = deactivateConflicts(prev).map((a) =>
        a.id === id ? sanitized : a,
      );
      localStorage.setItem(
        "edu_db_vehicle_assignments",
        JSON.stringify(nextState),
      );
      return nextState;
    });

    try {
      await TransportAPI.updateVehicleAssignmentApi(id, payload as any);
    } catch (err: any) {
      console.warn("Backend API update error (fallback to local state):", err);
    }
  };

  const removeVehicleAssignment = async (id: string) => {
    try {
      await TransportAPI.deleteVehicleAssignmentApi(id);
      setVehicleAssignments((prev) => prev.filter((a) => a.id !== id));
      addToast(
        "success",
        "Assignment Deleted",
        "Successfully removed vehicle assignment.",
      );
    } catch (err: any) {
      console.error(err);
      addToast(
        "error",
        "Delete Failed",
        err.message ||
          "Failed to delete vehicle assignment. Please make sure no students are active on this route first.",
      );
      throw err;
    }
  };

  const addVehicleMaintenance = async (vm: Omit<VehicleMaintenance, "id">) => {
    try {
      const payload = {
        vehicleId: Number(vm.vehicleId) || 0,
        selectFleetVehicle: vm.vehicleNumber || "",
        fleetVehicle: vm.vehicleNumber || "",
        serviceType: vm.serviceType || "",
        serviceDate: vm.serviceDate
          ? new Date(vm.serviceDate).toISOString()
          : new Date().toISOString(),
        serviceDateString: vm.serviceDate
          ? new Date(vm.serviceDate).toISOString()
          : new Date().toISOString(),
        cost: Number(vm.cost) || 0,
        vendor: vm.vendor || "",
        vendorCenter: vm.vendor || "",
        nextServiceDue: vm.nextServiceDue
          ? new Date(vm.nextServiceDue).toISOString()
          : null,
        nextServiceDueDate: vm.nextServiceDue
          ? new Date(vm.nextServiceDue).toISOString()
          : null,
        remarks: vm.remarks || "",
        status: vm.status === "Completed" || (vm.status as any) === true,
      };
      const response = await TransportAPI.createMaintenanceApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (
        backendData.id ||
        backendData.maintenanceId ||
        "VMN-" + Math.floor(100 + Math.random() * 900)
      ).toString();
      const newMaint: VehicleMaintenance = {
        ...vm,
        ...backendData,
        id,
        branch: (vm as any).branch || selectedBranch || "",
      } as any;
      setVehicleMaintenances((prev) => [newMaint, ...prev]);
      logActivity(
        "Logged Vehicle Maintenance",
        `Serviced vehicle ${newMaint.vehicleNumber}`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "VMN-" + Math.floor(100 + Math.random() * 900);
      const newMaint: VehicleMaintenance = {
        ...vm,
        id,
        branch: (vm as any).branch || selectedBranch || "",
      } as any;
      setVehicleMaintenances((prev) => [newMaint, ...prev]);
    }
  };

  const updateVehicleMaintenance = async (
    id: string,
    updates: Partial<VehicleMaintenance>,
  ) => {
    try {
      const payload: any = {};
      if (updates.vehicleId !== undefined) {
        payload.vehicleId = Number(updates.vehicleId) || 0;
      }
      if (updates.vehicleNumber !== undefined) {
        payload.selectFleetVehicle = updates.vehicleNumber;
        payload.fleetVehicle = updates.vehicleNumber;
      }
      if (updates.serviceType !== undefined) {
        payload.serviceType = updates.serviceType;
      }
      if (updates.serviceDate !== undefined) {
        payload.serviceDate = updates.serviceDate
          ? new Date(updates.serviceDate).toISOString()
          : new Date().toISOString();
        payload.serviceDateString = updates.serviceDate
          ? new Date(updates.serviceDate).toISOString()
          : new Date().toISOString();
      }
      if (updates.cost !== undefined) {
        payload.cost = Number(updates.cost) || 0;
      }
      if (updates.vendor !== undefined) {
        payload.vendor = updates.vendor;
        payload.vendorCenter = updates.vendor;
      }
      if (updates.nextServiceDue !== undefined) {
        payload.nextServiceDue = updates.nextServiceDue
          ? new Date(updates.nextServiceDue).toISOString()
          : null;
        payload.nextServiceDueDate = updates.nextServiceDue
          ? new Date(updates.nextServiceDue).toISOString()
          : null;
      }
      if (updates.remarks !== undefined) {
        payload.remarks = updates.remarks;
      }
      if (updates.status !== undefined) {
        payload.status =
          updates.status === "Completed" || (updates.status as any) === true;
      }

      await TransportAPI.updateMaintenanceApi(id, payload);
      setVehicleMaintenances((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setVehicleMaintenances((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
    }
  };

  const deleteVehicleMaintenance = async (id: string) => {
    try {
      await TransportAPI.deleteMaintenanceApi(id);
      setVehicleMaintenances((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setVehicleMaintenances((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const checkVehicleCapacity = (vehicleId: string): CapacityCheckResult => {
    const vehicle = vehicleMasters.find(
      (v) => v.id === vehicleId || v.vehicleNumber === vehicleId,
    );
    const totalCapacity = vehicle ? vehicle.capacity : 50;

    const activeAssignment = vehicleAssignments.find(
      (va) =>
        (va.vehicleId === vehicleId ||
          (vehicle?.vehicleNumber &&
            va.vehicleNumber === vehicle.vehicleNumber)) &&
        va.status === "Active",
    );

    let assignedCount = 0;
    if (activeAssignment) {
      assignedCount = resolveAssignedStudentsForTrip(activeAssignment, {
        studentTransports,
        students,
        admissions,
        routeMasters,
        pickupPoints,
        vehicleMasters,
      }).length;
    } else {
      const matchedTransports = studentTransports.filter(
        (st) =>
          (st.vehicleId === vehicleId ||
            (vehicle?.vehicleNumber &&
              st.vehicleNumber === vehicle.vehicleNumber)) &&
          st.status === "Active",
      );
      assignedCount = matchedTransports.length;
    }

    const availableSeats = Math.max(0, totalCapacity - assignedCount);

    return {
      vehicle,
      totalCapacity,
      assignedCount,
      availableSeats,
      isFull: availableSeats <= 0,
    };
  };

  const getPendingLibraryFineDues = (stId: string): number => {
    try {
      const s = localStorage.getItem("edu_db_library_fines");
      if (!s) return 0;
      const fines = JSON.parse(s);
      const stObj = students.find(
        (st) => st.id === stId || st.admissionNo === stId,
      );
      const admNo = stObj?.admissionNo || stId;
      const stName = stObj
        ? `${stObj.firstName} ${stObj.lastName}`.toLowerCase()
        : "";

      return fines
        .filter(
          (f: any) =>
            f.paymentStatus === "Unpaid" &&
            (f.memberId === stId ||
              f.memberId === admNo ||
              (stName && (f.memberName || "").toLowerCase() === stName)),
        )
        .reduce((sum: number, f: any) => sum + (f.fineAmount || 0), 0);
    } catch {
      return 0;
    }
  };

  // DYNAMIC FEE CALCULATION ENGINE
  const calculateStudentPayableFee = (
    studentId: string,
  ): StudentCalculationResult | null => {
    const student =
      students.find((s) => s.id === studentId || s.admissionNo === studentId) ||
      (() => {
        const sId = String(studentId || "")
          .trim()
          .toLowerCase();
        const adm = (admissions || []).find((a) => {
          if (!a) return false;
          const aId = a.id != null ? String(a.id).trim().toLowerCase() : "";
          const aApp = a.applicationNo
            ? String(a.applicationNo).trim().toLowerCase()
            : (a as any).applicationId != null
              ? String((a as any).applicationId)
                  .trim()
                  .toLowerCase()
              : "";
          const aReg = a.registrationNo
            ? String(a.registrationNo).trim().toLowerCase()
            : (a as any).registrationNumber
              ? String((a as any).registrationNumber)
                  .trim()
                  .toLowerCase()
              : "";
          const aAdm = (a as any).admissionNo
            ? String((a as any).admissionNo)
                .trim()
                .toLowerCase()
            : (a as any).admissionNumber
              ? String((a as any).admissionNumber)
                  .trim()
                  .toLowerCase()
              : "";
          const aName = (
            a.applicantName ||
            (a as any).studentName ||
            (a as any).applicantFullName ||
            `${a.firstName || ""} ${a.lastName || ""}`
          )
            .trim()
            .toLowerCase();
          return (
            sId &&
            (aId === sId ||
              aApp === sId ||
              aReg === sId ||
              aAdm === sId ||
              aName === sId ||
              aName.includes(sId))
          );
        });
        if (!adm) return undefined;
        const fullName = (
          adm.applicantName ||
          (adm as any).studentName ||
          (adm as any).applicantFullName ||
          `${adm.firstName || ""} ${adm.lastName || ""}`
        ).trim();
        const nameParts = fullName.split(" ");
        return {
          id: String(
            adm.id || adm.applicationNo || (adm as any).registrationNo,
          ),
          firstName: adm.firstName || nameParts[0] || "Student",
          lastName: adm.lastName || nameParts.slice(1).join(" ") || "",
          admissionNo:
            (adm as any).admissionNo ||
            (adm as any).admissionNumber ||
            adm.registrationNo ||
            adm.applicationNo ||
            String(adm.id),
          className:
            adm.appliedClass ||
            (adm as any).appliedClassGrade ||
            adm.targetClass ||
            adm.className ||
            "Nursery",
          section: adm.section || "",
          gender: adm.gender || "Male",
          studentType:
            adm.residentialStatus === "Residential" ||
            adm.studentType === "Residential"
              ? "Hosteller"
              : "Day Scholar",
          residentialStatus:
            adm.residentialStatus || adm.studentType || "Non-Residential",
          joiningDate:
            adm.admissionDate ||
            (adm as any).createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          dueFee: 0,
          paidFee: 0,
          totalFee: 0,
          rollNo: "0",
          fatherName: adm.parentName || (adm as any).fatherName || "",
          motherName: adm.motherName || "",
          mobile: adm.mobile || adm.phone || "",
          email: adm.email || "",
          address: adm.address || "",
          status: "Active",
          academicYear: adm.academicYear || selectedAcademicYear || "",
          branch: adm.branch || selectedBranch || "",
        } as unknown as Student;
      })();
    if (!student) return null;

    const ledger = getStudentFeeLedger(studentId, student);

    const assignment = studentFeeAssignments.find(
      (a) => a.studentId === studentId && a.status === "Active",
    );
    const dfs = dynamicFeeStructures.find((d) =>
      matchesClassName(d.className, student.className),
    );
    const baseFee = ledger
      ? ledger.totalOriginalAmount
      : assignment
        ? assignment.baseFeeTotal
        : (dfs?.totalAmount ?? 0);
    const assignedFeeHeads = assignment ? assignment.assignedFeeHeads : [];

    const isNonResident =
      student.studentType === "Day Scholar" ||
      student.studentType === "Non-Residential" ||
      (student as any).residentialStatus !== "Residential";

    let transportAssign = isNonResident
      ? studentTransports.find(
          (t) =>
            t.status === "Active" &&
            (t.studentId === studentId ||
              (student.admissionNo && t.admissionNo === student.admissionNo) ||
              (t.studentName &&
                `${student.firstName} ${student.lastName}`
                  .trim()
                  .toLowerCase() === t.studentName.trim().toLowerCase())),
        )
      : undefined;

    const isTrpReq =
      isNonResident &&
      (Boolean(transportAssign) ||
        student.transportRequired === true ||
        Boolean((student as any).busRoute || (student as any).pickupPoint));

    let transportFee = 0;
    if (isTrpReq) {
      transportFee = getDynamicTransportFee(
        transportAssign || {
          id: `STRP-AUTO-${studentId}`,
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo || "",
          busRoute: (student as any).busRoute || "",
          pickupPoint: (student as any).pickupPoint || "",
          transportType: (student as any).transportType || "AC",
          feePlan: "Annual",
          status: "Active",
        },
      );
    }
    const ledgerTrItem = ledger?.feeItems?.find(
      (i) =>
        i.isApplicable &&
        (i.headId === "FH-TRP" ||
          (i.category || "").toLowerCase().includes("transport") ||
          (i.headName || "").toLowerCase().includes("transport")),
    );
    if (ledgerTrItem) {
      transportFee =
        ledgerTrItem.finalAmount || ledgerTrItem.originalAmount || transportFee;
    }

    const hostelAssign = studentHostels.find(
      (h) => h.studentId === studentId && h.status === "Active",
    );
    let hostelFee =
      (student.studentType === "Hosteller" ||
        student.studentType === "Residential") &&
      hostelAssign
        ? hostelAssign.feeAmount
        : 0;

    const ledgerHstItems =
      ledger?.feeItems?.filter(
        (i) =>
          i.isApplicable &&
          (i.headId === "FH-HST" ||
            i.headId === "FH-HST-DEP" ||
            (i.category || "").toLowerCase().includes("hostel") ||
            (i.headName || "").toLowerCase().includes("hostel")),
      ) || [];
    if (ledgerHstItems.length > 0) {
      hostelFee = ledgerHstItems.reduce(
        (sum, item) => sum + (item.finalAmount || item.originalAmount || 0),
        0,
      );
    }

    const previousDue = Math.max(0, student.dueFee || 0);

    const isStudentMatchForDeduction = (idToCheck?: string) => {
      if (!idToCheck) return false;
      const chk = String(idToCheck).trim().toLowerCase();
      const sId = String(studentId).trim().toLowerCase();
      return (
        chk === sId ||
        (student?.id && chk === String(student.id).trim().toLowerCase()) ||
        (student?.admissionNo &&
          chk === String(student.admissionNo).trim().toLowerCase())
      );
    };

    const appliedScholarships = studentScholarships.filter(
      (s) => isStudentMatchForDeduction(s.studentId) && s.status === "Active",
    );
    let scholarshipDeduction = ledger
      ? ledger.scholarshipAmount || ledger.totalScholarship || 0
      : 0;

    const appliedDiscounts = studentDiscounts.filter((d) =>
      isStudentMatchForDeduction(d.studentId),
    );
    let discountDeduction = ledger
      ? ledger.discountAmount || ledger.totalDiscount || 0
      : 0;

    let scholarshipId: string | undefined = undefined;
    let scholarshipName = "";
    let scholarshipDescription = "";

    let discountId: string | undefined = undefined;
    let discountName = "";
    let discountDescription = "";

    if (ledger) {
      scholarshipId = ledger.scholarshipId;
      scholarshipName = ledger.scholarshipName || "";
      scholarshipDescription = ledger.scholarshipDescription || "";
      discountId = ledger.discountId;
      discountName = ledger.discountName || "";
      discountDescription = ledger.discountDescription || "";
    }

    if (scholarshipDeduction === 0 && appliedScholarships.length > 0) {
      const activeSch = appliedScholarships[0];
      const schMaster = scholarships.find(
        (s) =>
          s.id === activeSch.scholarshipId ||
          s.code === activeSch.scholarshipId,
      );
      scholarshipDeduction =
        activeSch.discountType === "Percentage"
          ? (baseFee * (activeSch.discountValue || 0)) / 100
          : activeSch.discountValue || 0;
      scholarshipId = activeSch.scholarshipId;
      scholarshipName = activeSch.scholarshipName || schMaster?.name || "";
      scholarshipDescription = schMaster?.description || "";
    }

    if (discountDeduction === 0 && appliedDiscounts.length > 0) {
      const activeDisc = appliedDiscounts[0];
      const discMaster = discounts.find(
        (d) =>
          d.id === activeDisc.discountId || d.code === activeDisc.discountId,
      );
      discountDeduction =
        discMaster?.mode === "Percentage"
          ? (baseFee * (discMaster.value || 0)) / 100
          : discMaster?.value || 0;
      discountId = activeDisc.discountId;
      discountName = discMaster?.name || "";
      discountDescription = discMaster?.description || "";
    }

    let fineAmount = 0;
    let fineDetails:
      | { ruleName: string; daysOverdue: number; amount: number }
      | undefined;

    const activeFineRule =
      fineRules.find((f) => f.status === "Active") || fineRules[0];

    const todayStr = new Date().toISOString().split("T")[0];
    const todayMs = new Date().getTime();

    // Dynamically find earliest overdue date among student's pending fee installments & fee items
    let earliestOverdueDateStr: string | null = null;

    if (ledger && ledger.installments && ledger.installments.length > 0) {
      const overdueInsts = ledger.installments.filter(
        (inst) =>
          (inst.dueAmount ?? inst.amount) > 0 &&
          inst.dueDate &&
          inst.dueDate < todayStr,
      );
      if (overdueInsts.length > 0) {
        const sorted = [...overdueInsts].sort((a, b) =>
          a.dueDate.localeCompare(b.dueDate),
        );
        earliestOverdueDateStr = sorted[0].dueDate;
      }
    }

    if (!earliestOverdueDateStr && ledger && ledger.feeItems) {
      const overdueItems = ledger.feeItems.filter(
        (item) =>
          item.isApplicable &&
          item.finalAmount > 0 &&
          (item as any).dueDate &&
          (item as any).dueDate < todayStr,
      );
      if (overdueItems.length > 0) {
        const sorted = [...overdueItems].sort((a, b) =>
          ((a as any).dueDate as string).localeCompare(
            (b as any).dueDate as string,
          ),
        );
        earliestOverdueDateStr = (sorted[0] as any).dueDate;
      }
    }

    if (!earliestOverdueDateStr && studentFeeInstallments) {
      const pendingInsts = studentFeeInstallments.filter(
        (inst) =>
          inst.studentId === studentId &&
          (inst.dueAmount ?? inst.amount) > 0 &&
          inst.dueDate &&
          inst.dueDate < todayStr,
      );
      if (pendingInsts.length > 0) {
        const sorted = [...pendingInsts].sort((a, b) =>
          a.dueDate.localeCompare(b.dueDate),
        );
        earliestOverdueDateStr = sorted[0].dueDate;
      }
    }

    if (!earliestOverdueDateStr) {
      if (
        activeFineRule &&
        activeFineRule.dueDate &&
        activeFineRule.dueDate < todayStr
      ) {
        earliestOverdueDateStr = activeFineRule.dueDate;
      }
    }

    if (
      activeFineRule &&
      earliestOverdueDateStr &&
      earliestOverdueDateStr < todayStr
    ) {
      const graceDays = activeFineRule.graceDays ?? 5;
      const dueMs = new Date(earliestOverdueDateStr).getTime();
      const daysDiff = Math.max(
        0,
        Math.floor((todayMs - dueMs) / (1000 * 3600 * 24)),
      );

      if (daysDiff > graceDays) {
        const overdueDays = daysDiff - graceDays;
        if (activeFineRule.fineType === "Daily Fine") {
          fineAmount = overdueDays * (activeFineRule.dailyFine || 50);
        } else {
          fineAmount = activeFineRule.fixedFine || 200;
        }
        if (
          activeFineRule.maximumFine &&
          fineAmount > activeFineRule.maximumFine
        ) {
          fineAmount = activeFineRule.maximumFine;
        }
        fineDetails = {
          ruleName: activeFineRule.ruleName || "Late Fee",
          daysOverdue: overdueDays,
          amount: fineAmount,
        };
      }
    }

    // Include pending uniform extra purchase dues & library overdue fines
    const pendingUniformExtras = getPendingUniformExtraDues(studentId);
    const pendingLibraryFines = getPendingLibraryFineDues(studentId);
    const hasExtraInLedger = Boolean(
      ledger &&
      ledger.feeItems &&
      ledger.feeItems.some(
        (i) =>
          i.headId === "FH-UNI-EXTRA" ||
          i.category === "Additional Uniform Purchase",
      ),
    );

    const configuredUniformBaseFee =
      getUniformFeeForClass(
        student?.className || "",
        student?.gender || "Male",
        financeUniformConfigs,
        dynamicFeeStructures,
      ) || 0;

    const baseUniformLedgerAmt = ledger
      ? (ledger.feeItems || [])
          .filter(
            (i) =>
              (i.headName || "").toLowerCase().includes("uniform") &&
              i.isApplicable !== false,
          )
          .reduce((sum, i) => sum + (i.finalAmount || 0), 0)
      : configuredUniformBaseFee;

    const totalUniformFee = baseUniformLedgerAmt + pendingUniformExtras;

    const hasTrpInLedger = Boolean(
      ledgerTrItem &&
      (ledgerTrItem.finalAmount || ledgerTrItem.originalAmount || 0) > 0,
    );
    const unincludedTransport = !hasTrpInLedger && isTrpReq ? transportFee : 0;

    const gross = ledger
      ? (ledger.grossAmount || ledger.totalOriginalAmount) +
        unincludedTransport +
        pendingLibraryFines
      : baseFee +
        transportFee +
        hostelFee +
        totalUniformFee +
        pendingLibraryFines;
    const sch = scholarshipDeduction;
    const disc = discountDeduction;
    const totalPayable = Math.max(0, gross + fineAmount - sch - disc);
    const activeYr = selectedAcademicYear || financeSettings.academicYear || "";
    const isPaymentForThisStudent = (p: FeePayment) => {
      if (!p || !studentId) return false;
      const pSid = String(p.studentId || "")
        .trim()
        .toLowerCase();
      const pAdm = p.admissionNo
        ? String(p.admissionNo).trim().toLowerCase()
        : "";
      const sId = String(studentId || "")
        .trim()
        .toLowerCase();
      if (!sId) return false;
      if (pSid === sId || (pAdm && pAdm === sId)) return true;

      const stStudent =
        (student ? (student as Student) : undefined) ||
        students.find(
          (s) =>
            String(s.id).trim().toLowerCase() === sId ||
            (s.admissionNo &&
              String(s.admissionNo).trim().toLowerCase() === sId),
        );

      const stAdmission = admissions.find(
        (a) =>
          String(a.id).trim().toLowerCase() === sId ||
          (a.applicationNo &&
            String(a.applicationNo).trim().toLowerCase() === sId) ||
          ((a as any).registrationNo &&
            String((a as any).registrationNo)
              .trim()
              .toLowerCase() === sId) ||
          (stStudent?.admissionNo &&
            (String(a.id).trim().toLowerCase() ===
              String(stStudent.admissionNo).trim().toLowerCase() ||
              (a.applicationNo &&
                String(a.applicationNo).trim().toLowerCase() ===
                  String(stStudent.admissionNo).trim().toLowerCase()) ||
              ((a as any).registrationNo &&
                String((a as any).registrationNo)
                  .trim()
                  .toLowerCase() ===
                  String(stStudent.admissionNo).trim().toLowerCase()))),
      );

      const allIds = new Set<string>();
      allIds.add(sId);
      if (student?.id) allIds.add(String(student.id).trim().toLowerCase());
      if (student?.admissionNo)
        allIds.add(String(student.admissionNo).trim().toLowerCase());

      if (stStudent) {
        if (stStudent.id) allIds.add(String(stStudent.id).trim().toLowerCase());
        if (stStudent.admissionNo)
          allIds.add(String(stStudent.admissionNo).trim().toLowerCase());
      }

      if (stAdmission) {
        if (stAdmission.id)
          allIds.add(String(stAdmission.id).trim().toLowerCase());
        if (stAdmission.applicationNo)
          allIds.add(String(stAdmission.applicationNo).trim().toLowerCase());
        if ((stAdmission as any).registrationNo)
          allIds.add(
            String((stAdmission as any).registrationNo)
              .trim()
              .toLowerCase(),
          );
      }

      if (allIds.has(pSid) || (pAdm && allIds.has(pAdm))) return true;

      const stName =
        `${(stStudent || stAdmission || student)?.firstName || (stAdmission as any)?.applicantName || ""} ${(stStudent || student)?.lastName || ""}`
          .trim()
          .toLowerCase();
      const pName = String(p.studentName || "")
        .trim()
        .toLowerCase();
      if (
        stName &&
        pName &&
        (stName === pName || stName.includes(pName) || pName.includes(stName))
      )
        return true;

      return false;
    };
    const studentPaymentItems = (feePayments || []).filter(
      isPaymentForThisStudent,
    );
    const currentYearPayments = studentPaymentItems.filter(
      (p) => p.academicYear === activeYr || !p.academicYear,
    );
    const sumCurrentPayments = currentYearPayments.reduce(
      (acc, p) => acc + (Number(p.amountPaid ?? (p as any).amount) || 0),
      0,
    );
    const paidAmount = Math.max(
      ledger ? ledger.paidAmount || 0 : 0,
      sumCurrentPayments,
      student?.paidFee || 0,
    );
    const dueBalance = Math.max(0, totalPayable - paidAmount);

    return {
      student,
      assignment,
      baseFee,
      assignedFeeHeads,
      transportFee,
      transportDetails: transportAssign,
      hostelFee,
      hostelDetails: hostelAssign,
      uniformFee: totalUniformFee,
      previousDue,
      scholarshipDeduction: sch,
      scholarshipsApplied: appliedScholarships,
      discountDeduction: disc,
      discountsApplied: appliedDiscounts,
      fineAmount,
      fineDetails,
      totalPayable,
      paidAmount,
      dueBalance,
      paymentHistory: studentPaymentItems,
      scholarshipId,
      scholarshipName,
      scholarshipDescription,
      discountId,
      discountName,
      discountDescription,
    };
  };

  const applyScholarshipToStudent = (
    studentId: string,
    scholarshipId: string,
  ) => {
    const student = students.find(
      (s) =>
        s.id === studentId ||
        (s.admissionNo &&
          s.admissionNo.toLowerCase() === studentId.toLowerCase()),
    );
    const ledger = getStudentFeeLedger(studentId);
    const sch = scholarships.find(
      (s) => s.id === scholarshipId || s.code === scholarshipId,
    );
    if (!sch) {
      throw new Error("Scholarship not found.");
    }

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];
    const tuitionAmount = tuitionItem ? tuitionItem.originalAmount : 0;
    const waiver =
      sch.discountType === "Percentage"
        ? (tuitionAmount * (sch.percentage || 0)) / 100
        : sch.fixedAmount || 0;

    const existingDiscDeduction = ledger.discountAmount || 0;

    const updatedFeeItems = ledger.feeItems.map((item) => {
      if (
        item.category === "Tuition Fee" ||
        item.headId === (tuitionItem?.headId || "")
      ) {
        const finalAmt = Math.max(
          0,
          item.originalAmount - waiver - existingDiscDeduction,
        );
        return {
          ...item,
          scholarshipDeduction: waiver,
          finalAmount: finalAmt,
        };
      }
      return item;
    });

    const totalOriginal = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
      0,
    );
    const totalPayable = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
      0,
    );
    const dueBalance = Math.max(0, totalPayable - (ledger.paidAmount || 0));

    let updatedLedger: StudentFeeLedger = {
      ...ledger,
      scholarshipId: sch.id,
      scholarshipName: sch.name,
      scholarshipDescription: sch.description,
      scholarshipAmount: waiver,
      totalScholarship: waiver,
      feeItems: updatedFeeItems,
      totalOriginalAmount: totalOriginal,
      grossAmount: totalOriginal,
      totalPayable,
      dueBalance,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const assignment = studentFeeAssignments.find(
      (a) =>
        (a.studentId === studentId ||
          (student && a.studentId === student.id) ||
          (student?.admissionNo && a.studentId === student.admissionNo)) &&
        a.status === "Active",
    );
    updatedLedger.installments = generateInstallmentsForStudent(
      studentId,
      updatedLedger.academicYear,
      assignment,
      updatedLedger,
    );

    setStudentFeeLedgers((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.studentId === studentId ||
          (student && l.studentId === student.id) ||
          (student?.admissionNo && l.admissionNo === student.admissionNo),
      );
      let next: StudentFeeLedger[];
      if (idx !== -1) {
        next = [...prev];
        next[idx] = updatedLedger;
      } else {
        next = [...prev, updatedLedger];
      }
      localStorage.setItem("edu_db_student_fee_ledgers", JSON.stringify(next));
      return next;
    });

    setStudentFeeInstallments((prev) => {
      const other = prev.filter(
        (i) =>
          !(
            i.studentId === studentId ||
            (student && i.studentId === student.id) ||
            (student?.admissionNo && i.studentId === student.admissionNo)
          ),
      );
      const next = [...other, ...(updatedLedger.installments || [])];
      localStorage.setItem(
        "edu_db_student_fee_installments",
        JSON.stringify(next),
      );
      return next;
    });

    assignScholarshipToStudent(studentId, scholarshipId);
    return updatedLedger;
  };

  const removeScholarshipFromStudent = (studentId: string) => {
    const student = students.find(
      (s) =>
        s.id === studentId ||
        (s.admissionNo &&
          s.admissionNo.toLowerCase() === studentId.toLowerCase()),
    );
    const ledger = getStudentFeeLedger(studentId);

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];

    const existingDiscDeduction = ledger.discountAmount || 0;

    const updatedFeeItems = ledger.feeItems.map((item) => {
      if (
        item.category === "Tuition Fee" ||
        item.headId === (tuitionItem?.headId || "")
      ) {
        const finalAmt = Math.max(
          0,
          item.originalAmount - existingDiscDeduction,
        );
        return {
          ...item,
          scholarshipDeduction: 0,
          finalAmount: finalAmt,
        };
      }
      return item;
    });

    const totalOriginal = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
      0,
    );
    const totalPayable = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
      0,
    );
    const dueBalance = Math.max(0, totalPayable - (ledger.paidAmount || 0));

    let updatedLedger: StudentFeeLedger = {
      ...ledger,
      scholarshipId: undefined,
      scholarshipName: "",
      scholarshipDescription: "",
      scholarshipAmount: 0,
      totalScholarship: 0,
      feeItems: updatedFeeItems,
      totalOriginalAmount: totalOriginal,
      grossAmount: totalOriginal,
      totalPayable,
      dueBalance,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const assignment = studentFeeAssignments.find(
      (a) =>
        (a.studentId === studentId ||
          (student && a.studentId === student.id) ||
          (student?.admissionNo && a.studentId === student.admissionNo)) &&
        a.status === "Active",
    );
    updatedLedger.installments = generateInstallmentsForStudent(
      studentId,
      updatedLedger.academicYear,
      assignment,
      updatedLedger,
    );

    setStudentFeeLedgers((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.studentId === studentId ||
          (student && l.studentId === student.id) ||
          (student?.admissionNo && l.admissionNo === student.admissionNo),
      );
      let next: StudentFeeLedger[];
      if (idx !== -1) {
        next = [...prev];
        next[idx] = updatedLedger;
      } else {
        next = [...prev, updatedLedger];
      }
      localStorage.setItem("edu_db_student_fee_ledgers", JSON.stringify(next));
      return next;
    });

    setStudentFeeInstallments((prev) => {
      const other = prev.filter(
        (i) =>
          !(
            i.studentId === studentId ||
            (student && i.studentId === student.id) ||
            (student?.admissionNo && i.studentId === student.admissionNo)
          ),
      );
      const next = [...other, ...(updatedLedger.installments || [])];
      localStorage.setItem(
        "edu_db_student_fee_installments",
        JSON.stringify(next),
      );
      return next;
    });

    const currentSch = studentScholarships.find(
      (s) =>
        (s.studentId === studentId ||
          (student && s.studentId === student.id) ||
          (student?.admissionNo && s.studentId === student.admissionNo)) &&
        (s.scholarshipId === ledger.scholarshipId || s.status === "Active"),
    );
    if (currentSch) {
      revokeStudentScholarship(currentSch.id);
    }
    return updatedLedger;
  };

  const applyDiscountToStudent = (studentId: string, discountId: string) => {
    const student = students.find(
      (s) =>
        s.id === studentId ||
        (s.admissionNo &&
          s.admissionNo.toLowerCase() === studentId.toLowerCase()),
    );
    const ledger = getStudentFeeLedger(studentId);
    const d = discounts.find(
      (x) => x.id === discountId || x.code === discountId,
    );
    if (!d) {
      throw new Error("Discount not found.");
    }

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];
    const tuitionAmount = tuitionItem ? tuitionItem.originalAmount : 0;
    const discountAmount =
      d.mode === "Percentage"
        ? (tuitionAmount * (d.value || 0)) / 100
        : d.value || 0;

    const existingSchDeduction = ledger.scholarshipAmount || 0;

    const updatedFeeItems = ledger.feeItems.map((item) => {
      if (
        item.category === "Tuition Fee" ||
        item.headId === (tuitionItem?.headId || "")
      ) {
        const finalAmt = Math.max(
          0,
          item.originalAmount - existingSchDeduction - discountAmount,
        );
        return {
          ...item,
          discountDeduction: discountAmount,
          finalAmount: finalAmt,
        };
      }
      return item;
    });

    const totalOriginal = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
      0,
    );
    const totalPayable = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
      0,
    );
    const dueBalance = Math.max(0, totalPayable - (ledger.paidAmount || 0));

    let updatedLedger: StudentFeeLedger = {
      ...ledger,
      discountId: d.id,
      discountName: d.name,
      discountDescription: d.description,
      discountAmount: discountAmount,
      totalDiscount: discountAmount,
      feeItems: updatedFeeItems,
      totalOriginalAmount: totalOriginal,
      grossAmount: totalOriginal,
      totalPayable,
      dueBalance,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const assignment = studentFeeAssignments.find(
      (a) =>
        (a.studentId === studentId ||
          (student && a.studentId === student.id) ||
          (student?.admissionNo && a.studentId === student.admissionNo)) &&
        a.status === "Active",
    );
    updatedLedger.installments = generateInstallmentsForStudent(
      studentId,
      updatedLedger.academicYear,
      assignment,
      updatedLedger,
    );

    setStudentFeeLedgers((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.studentId === studentId ||
          (student && l.studentId === student.id) ||
          (student?.admissionNo && l.admissionNo === student.admissionNo),
      );
      let next: StudentFeeLedger[];
      if (idx !== -1) {
        next = [...prev];
        next[idx] = updatedLedger;
      } else {
        next = [...prev, updatedLedger];
      }
      localStorage.setItem("edu_db_student_fee_ledgers", JSON.stringify(next));
      return next;
    });

    setStudentFeeInstallments((prev) => {
      const other = prev.filter(
        (i) =>
          !(
            i.studentId === studentId ||
            (student && i.studentId === student.id) ||
            (student?.admissionNo && i.studentId === student.admissionNo)
          ),
      );
      const next = [...other, ...(updatedLedger.installments || [])];
      localStorage.setItem(
        "edu_db_student_fee_installments",
        JSON.stringify(next),
      );
      return next;
    });

    assignDiscountToStudent(studentId, discountId);
    return updatedLedger;
  };

  const removeDiscountFromStudent = (studentId: string) => {
    const student = students.find(
      (s) =>
        s.id === studentId ||
        (s.admissionNo &&
          s.admissionNo.toLowerCase() === studentId.toLowerCase()),
    );
    const ledger = getStudentFeeLedger(studentId);

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];

    const existingSchDeduction = ledger.scholarshipAmount || 0;

    const updatedFeeItems = ledger.feeItems.map((item) => {
      if (
        item.category === "Tuition Fee" ||
        item.headId === (tuitionItem?.headId || "")
      ) {
        const finalAmt = Math.max(
          0,
          item.originalAmount - existingSchDeduction,
        );
        return {
          ...item,
          discountDeduction: 0,
          finalAmount: finalAmt,
        };
      }
      return item;
    });

    const totalOriginal = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
      0,
    );
    const totalPayable = updatedFeeItems.reduce(
      (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
      0,
    );
    const dueBalance = Math.max(0, totalPayable - (ledger.paidAmount || 0));

    let updatedLedger: StudentFeeLedger = {
      ...ledger,
      discountId: undefined,
      discountName: "",
      discountDescription: "",
      discountAmount: 0,
      totalDiscount: 0,
      feeItems: updatedFeeItems,
      totalOriginalAmount: totalOriginal,
      grossAmount: totalOriginal,
      totalPayable,
      dueBalance,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const assignment = studentFeeAssignments.find(
      (a) =>
        (a.studentId === studentId ||
          (student && a.studentId === student.id) ||
          (student?.admissionNo && a.studentId === student.admissionNo)) &&
        a.status === "Active",
    );
    updatedLedger.installments = generateInstallmentsForStudent(
      studentId,
      updatedLedger.academicYear,
      assignment,
      updatedLedger,
    );

    setStudentFeeLedgers((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.studentId === studentId ||
          (student && l.studentId === student.id) ||
          (student?.admissionNo && l.admissionNo === student.admissionNo),
      );
      let next: StudentFeeLedger[];
      if (idx !== -1) {
        next = [...prev];
        next[idx] = updatedLedger;
      } else {
        next = [...prev, updatedLedger];
      }
      localStorage.setItem("edu_db_student_fee_ledgers", JSON.stringify(next));
      return next;
    });

    setStudentFeeInstallments((prev) => {
      const other = prev.filter(
        (i) =>
          !(
            i.studentId === studentId ||
            (student && i.studentId === student.id) ||
            (student?.admissionNo && i.studentId === student.admissionNo)
          ),
      );
      const next = [...other, ...(updatedLedger.installments || [])];
      localStorage.setItem(
        "edu_db_student_fee_installments",
        JSON.stringify(next),
      );
      return next;
    });

    const currentDisc = studentDiscounts.find(
      (d) =>
        (d.studentId === studentId ||
          (student && d.studentId === student.id) ||
          (student?.admissionNo && d.studentId === student.admissionNo)) &&
        (d.discountId === ledger.discountId || Boolean(d.discountId)),
    );
    if (currentDisc) {
      removeStudentDiscount(currentDisc.id);
    }
    return updatedLedger;
  };

  const fetchDailyAttendance = useCallback(
    async (date: string, department?: string) => {
      try {
        const response = await fetchDailyStaffAttendanceApi(date, department);
        if (response && response.success && Array.isArray(response.data)) {
          const mappedRecords: DailyAttendance[] = response.data.map(
            (item: any) => ({
              id:
                item.staffAttendanceId?.toString() ||
                item.id?.toString() ||
                Math.random().toString(),
              date: String(item.date).split("T")[0].split(" ")[0],
              entityType: "Staff",
              entityId: item.staffId?.toString() || item.id?.toString() || "",
              status:
                item.status === "Half Day"
                  ? "HalfDay"
                  : item.status === "On Leave"
                    ? "Leave"
                    : item.status,
              remarks: item.remarks || "",
              inTime: item.inTime || "",
              outTime: item.outTime || "",
              department: item.department || "",
              designation: item.designation || "",
            }),
          );

          const targetDate = String(date).split("T")[0].split(" ")[0];
          setAttendance((prev) => {
            if (mappedRecords.length === 0) {
              // Preserve locally recorded staff attendance for targetDate when backend returns empty data
              return prev;
            }
            const apiEntityIds = new Set(
              mappedRecords.map((m) => String(m.entityId)),
            );
            const filtered = prev.filter((r) => {
              const isTargetDate =
                String(r.date || "")
                  .split("T")[0]
                  .split(" ")[0] === targetDate;
              const isStaff =
                !r.entityType || r.entityType.toLowerCase() === "staff";
              if (isTargetDate && isStaff) {
                // If this local record's entityId is in mappedRecords, drop it so mappedRecord overwrites it. Otherwise keep local record!
                return !apiEntityIds.has(String(r.entityId));
              }
              return true;
            });
            const updated = [...filtered, ...mappedRecords];
            if (JSON.stringify(prev) === JSON.stringify(updated)) {
              return prev;
            }
            return updated;
          });
        }
      } catch (err: any) {
        console.error("Error fetching staff attendance:", err);
      }
    },
    [],
  );

  const fetchMonthlyAttendance = useCallback(
    async (month: number, year: number, department?: string) => {
      try {
        const response = await fetchMonthlyStaffAttendanceApi(
          month,
          year,
          department,
        );
        if (response && response.success && Array.isArray(response.data)) {
          const mappedRecords: DailyAttendance[] = response.data.map(
            (item: any) => ({
              id:
                item.staffAttendanceId?.toString() ||
                item.id?.toString() ||
                Math.random().toString(),
              date: String(item.date).split("T")[0].split(" ")[0],
              entityType: "Staff",
              entityId: item.staffId?.toString() || item.id?.toString() || "",
              status:
                item.status === "Half Day"
                  ? "HalfDay"
                  : item.status === "On Leave"
                    ? "Leave"
                    : item.status,
              remarks: item.remarks || "",
              inTime: item.inTime || "",
              outTime: item.outTime || "",
              department: item.department || "",
              designation: item.designation || "",
            }),
          );

          const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
          setAttendance((prev) => {
            const filtered = prev.filter((r) => {
              const rDate = String(r.date || "")
                .split("T")[0]
                .split(" ")[0];
              const isStaff =
                !r.entityType || r.entityType.toLowerCase() === "staff";
              return !(isStaff && rDate.startsWith(monthPrefix));
            });
            const updated = [...filtered, ...mappedRecords];
            if (JSON.stringify(prev) === JSON.stringify(updated)) {
              return prev;
            }
            return updated;
          });
        }
      } catch (err: any) {
        console.error("Error fetching monthly staff attendance:", err);
      }
    },
    [],
  );

  const fetchTodayStudentAttendanceSummary = useCallback(async () => {
    if (activeRequests.current["today-attendance-summary"]) {
      return activeRequests.current["today-attendance-summary"];
    }
    const promise = (async () => {
      try {
        const todayStr = new Date().toLocaleDateString("en-CA");
        const response = await fetchStudentAttendanceRegisterApi({
          filterType: "day",
          date: todayStr,
        }).catch((e) => {
          console.warn(
            "Student attendance API offline/unavailable, using local summary fallback.",
          );
          return null;
        });
        if (
          response &&
          response.success &&
          response.data &&
          response.data.summary
        ) {
          setTodayStudentAttendanceSummary(response.data.summary);
        }
      } catch (err) {
        // Suppress unhandled rejection
      } finally {
        delete activeRequests.current["today-attendance-summary"];
      }
    })();
    activeRequests.current["today-attendance-summary"] = promise;
    return promise;
  }, []);

  const markAttendance = async (records: DailyAttendance[]) => {
    setAttendance((prev) => {
      const filterDates = records.map((r) => `${r.entityId}_${r.date}`);
      const updated = [
        ...records,
        ...prev.filter((r) => !filterDates.includes(`${r.entityId}_${r.date}`)),
      ];
      return updated;
    });
    logActivity(
      "Marked Attendance",
      `Recorded attendance for ${records.length} items`,
    );

    try {
      const date = records[0]?.date;
      if (!date) return false;

      if (records[0]?.entityType === "Staff") {
        const recordsByDept: Record<string, DailyAttendance[]> = {};
        records.forEach((r) => {
          const dept = r.department || "General";
          if (!recordsByDept[dept]) {
            recordsByDept[dept] = [];
          }
          recordsByDept[dept].push(r);
        });

        setLastAttendancePayload(recordsByDept);

        const savePromises = Object.entries(recordsByDept).map(
          async ([dept, deptRecords]) => {
            const payload = {
              date: date,
              academicYear: selectedAcademicYear || "",
              branch:
                !selectedBranch ||
                selectedBranch === "All" ||
                selectedBranch === "All Branches"
                  ? ""
                  : selectedBranch,
              department: dept,
              records: deptRecords.map((r) => {
                const sIdStr = String((r as any).staffId || r.entityId || "");
                const staffMember = staff.find(
                  (s) =>
                    String(s.id) === sIdStr ||
                    String(s.empId) === sIdStr ||
                    String((s as any).staffId) === sIdStr ||
                    `${s.firstName || ""}`.toLowerCase() ===
                      String((r as any).name || (r as any).employeeName || "")
                        .trim()
                        .toLowerCase() ||
                    `${s.firstName || ""} ${s.lastName || ""}`
                      .trim()
                      .toLowerCase() ===
                      String((r as any).name || (r as any).employeeName || "")
                        .trim()
                        .toLowerCase(),
                );

                let validStaffId = 0;
                if (staffMember) {
                  const parsedNum = parseInt(
                    String(
                      (staffMember as any).staffId || staffMember.id || "0",
                    ),
                  );
                  if (!isNaN(parsedNum) && parsedNum > 0)
                    validStaffId = parsedNum;
                  else if (staffMember.empId) {
                    const digits = staffMember.empId.replace(/\D/g, "");
                    if (digits) validStaffId = parseInt(digits);
                  }
                }
                if (!validStaffId) {
                  const digits = sIdStr.replace(/\D/g, "");
                  if (digits) validStaffId = parseInt(digits);
                  else validStaffId = 1;
                }

                return {
                  staffId: validStaffId,
                  status:
                    r.status === "HalfDay"
                      ? "Half Day"
                      : r.status === "Leave"
                        ? "On Leave"
                        : r.status,
                  remarks: r.remarks || "",
                  inTime: r.inTime || "",
                  outTime: r.outTime || "",
                };
              }),
            };
            const res = await markBulkStaffAttendanceApi(payload);
            return res;
          },
        );

        const responses = await Promise.all(savePromises);
        setLastAttendanceResponse(responses);
      }
      return true;
    } catch (err: any) {
      console.error("Error saving staff attendance to server:", err);
      addToast(
        "error",
        "API Error",
        "Failed to save staff attendance to database.",
      );
      return false;
    }
  };

  const addExam = (examData: Omit<ExamSetup, "id">) => {
    const id =
      (examData as any).id || "EXM-" + Math.floor(10 + Math.random() * 90);
    const newExam: ExamSetup = {
      ...examData,
      id,
      branch: (examData as any).branch || selectedBranch || "",
    } as any;
    setExams((prev) => [...prev, newExam]);
    logActivity("Created Examination", `Scheduled ${newExam.name}`);
  };

  const updateExam = (id: string, updates: Partial<ExamSetup>) => {
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
    logActivity("Updated Examination", `Updated exam ID ${id}`);
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    logActivity("Deleted Examination", `Removed exam ID ${id}`);
  };

  const saveMarks = (
    marksData: Omit<ExamMark, "id">[],
    skipBackendSync?: boolean,
  ) => {
    const blockedLockedMarks = marksData.filter((m) => {
      const existing = examMarks.find(
        (em) =>
          em.examId === m.examId &&
          em.studentId === m.studentId &&
          em.subject === m.subject,
      );
      return existing?.isLocked && m.isLocked !== false;
    });
    if (blockedLockedMarks.length > 0) {
      addToast(
        "error",
        "Marks Locked",
        "Submitted marks are locked. Unlock them before saving changes.",
      );
      return;
    }

    const newMarks: ExamMark[] = marksData.map((m) => {
      const exam = exams.find((e) => e.id === m.examId);
      const student = students.find((s) => s.id === m.studentId);
      return {
        ...m,
        academicYear:
          m.academicYear || exam?.academicYear || schoolProfile.academicYear,
        branch:
          m.branch || exam?.branch || student?.branch || selectedBranch || "",
        className: m.className || student?.className,
        section: m.section || student?.section,
        id: "MRK-" + Math.floor(1000 + Math.random() * 9000),
      };
    });

    setExamMarks((prev) => {
      const existingKeys = newMarks.map(
        (nm) => `${nm.examId}_${nm.studentId}_${nm.subject}`,
      );
      const filtered = prev.filter(
        (em) =>
          !existingKeys.includes(`${em.examId}_${em.studentId}_${em.subject}`),
      );
      return [...filtered, ...newMarks];
    });

    // Directly persist marks entries to backend database API unless skipped by caller
    if (!skipBackendSync) {
      try {
        const groups: Record<string, typeof newMarks> = {};
        newMarks.forEach((m) => {
          const key = `${m.examId || 1}__${m.className || ""}__${m.section || ""}__${m.subject || ""}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(m);
        });
        Object.entries(groups).forEach(([_, group]) => {
          const first = group[0];
          if (!first || !first.className || !first.section || !first.subject)
            return;
          const isFinal = group.every((m) => m.isLocked);
          const payload = {
            examId: Number(first.examId) || 1,
            className: first.className || "",
            sectionName: first.section || "",
            subjectCode: first.subject || "",
            students: group.map((m) => {
              const student = students.find((s) => s.id === m.studentId);
              return {
                entryId: 0,
                rollNo: (m as any).rollNo || student?.rollNo || "",
                studentName:
                  (m as any).studentName ||
                  (student ? `${student.firstName} ${student.lastName}` : ""),
                admissionNo:
                  (m as any).admissionNo || student?.admissionNo || "",
                attendanceStatus: m.isAbsent
                  ? "Absent"
                  : (m as any).attendanceStatus || "Present",
                marksObtained: Number(m.marksObtained || 0),
                maxMarks: Number(m.maxMarks || m.totalMarks || 100),
                grade: m.grade || "",
                evaluatorRemarks: m.remarks || "",
                status: m.isLocked ? "Submitted" : "Draft",
              };
            }),
            isFinalSubmit: isFinal,
          };
          if (isFinal) {
            submitMarksEntryApi(payload).catch((err) =>
              console.warn("Backend save marks error:", err),
            );
          } else {
            saveMarksEntryDraftApi(payload).catch((err) =>
              console.warn("Backend save marks error:", err),
            );
          }
        });
      } catch (err) {
        console.warn("Backend auto save marks sync error:", err);
      }
    }

    logActivity(
      "Saved Exam Marks",
      `Entered marks for ${newMarks.length} records`,
    );
  };

  const addExamSchedule = (scheduleData: Omit<ExamSchedule, "id">) => {
    const id = "SCH-" + Math.floor(100 + Math.random() * 900);
    const exam = exams.find((e) => e.id === scheduleData.examId);
    setExamSchedules((prev) => [
      ...prev,
      {
        ...scheduleData,
        id,
        academicYear:
          scheduleData.academicYear ||
          exam?.academicYear ||
          schoolProfile.academicYear,
        branch: scheduleData.branch || exam?.branch || selectedBranch || "",
      },
    ]);
    logActivity(
      "Scheduled Subject Exam",
      `Scheduled ${scheduleData.subject} for Class ${scheduleData.className}`,
    );
  };

  const updateExamSchedule = (id: string, updates: Partial<ExamSchedule>) => {
    setExamSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
    logActivity("Updated Exam Schedule", `Updated schedule ID ${id}`);
  };

  const deleteExamSchedule = (id: string) => {
    setExamSchedules((prev) => prev.filter((s) => s.id !== id));
    logActivity("Deleted Exam Schedule", `Removed schedule ID ${id}`);
  };

  const addQuestionPaper = (
    paperData: Omit<QuestionPaper, "id">,
  ): QuestionPaper => {
    const id = "QP-" + Math.floor(1000 + Math.random() * 9000);
    const newPaper: QuestionPaper = {
      ...paperData,
      id,
      academicYear: paperData.academicYear || schoolProfile.academicYear,
      branch: paperData.branch || selectedBranch || "",
    };
    setQuestionPapers((prev) => [newPaper, ...prev]);
    logActivity(
      "Uploaded Question Paper",
      `Uploaded ${newPaper.paperTitle} for ${newPaper.className} ${newPaper.subject}`,
    );
    return newPaper;
  };

  const updateQuestionPaper = (id: string, updates: Partial<QuestionPaper>) => {
    setQuestionPapers((prev) =>
      prev.map((qp) => (qp.id === id ? { ...qp, ...updates } : qp)),
    );
    logActivity("Updated Question Paper", `Updated question paper ID ${id}`);
  };

  const deleteQuestionPaper = (id: string) => {
    setQuestionPapers((prev) => prev.filter((qp) => qp.id !== id));
    logActivity("Deleted Question Paper", `Removed question paper ID ${id}`);
  };

  const addMeeting = (
    meetingData: Omit<SchoolMeeting, "id" | "createdAt">,
  ): SchoolMeeting => {
    const id = "MTG-" + Math.floor(100 + Math.random() * 900);
    const newMeeting: SchoolMeeting = {
      ...meetingData,
      id,
      academicYear: meetingData.academicYear || schoolProfile.academicYear,
      branch: meetingData.branch || selectedBranch || "",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setMeetings((prev) => [newMeeting, ...prev]);

    scheduleMeetingApi({
      meetingTitle: newMeeting.title,
      meetingAudience: newMeeting.meetingAudience,
      participantType:
        newMeeting.participantType ||
        newMeeting.participants?.[0]?.type ||
        "Parent",
      participantName:
        newMeeting.participants?.[0]?.name ||
        newMeeting.targetGroupDescription ||
        "Participant",
      participantPhone:
        (newMeeting.participants?.[0] as any)?.phone || "9876543210",
      wardStudentName:
        (newMeeting.participants?.[0] as any)?.wardName ||
        (newMeeting.participants?.[0] as any)?.studentName ||
        "",
      wardAdmissionNo: (newMeeting.participants?.[0] as any)?.admissionNo || "",
      wardClass: (newMeeting.participants?.[0] as any)?.className || "",
      agenda: newMeeting.description,
      meetingMode: newMeeting.mode,
      building: newMeeting.building || "Academic Block A",
      floor: newMeeting.floor || "1st Floor",
      meetingRoom:
        newMeeting.roomVenue || newMeeting.venue || "Conference Room 102",
      roomCapacity: newMeeting.roomCapacity || 15,
      onlineMeetingUrl: newMeeting.onlineMeetingUrl || "",
      meetingDate: newMeeting.date,
      startTime: newMeeting.startTime,
      endTime: newMeeting.endTime,
      meetingStatus: newMeeting.status
        ? newMeeting.status.toUpperCase()
        : "SCHEDULED",
      priority: newMeeting.priority || "Normal",
      attendancePolicy: newMeeting.attendanceRequired || "Mandatory",
      recurrence: newMeeting.recurrence || "None (One-time)",
      totalRecipients: newMeeting.participants?.length || 1,
    }).catch((e) => console.warn("API scheduleMeeting error:", e));

    if (newMeeting.status === "Scheduled") {
      const targets = newMeeting.participants.map((p) => p.name).join(", ");
      logActivity(
        "Scheduled Meeting",
        `Scheduled ${newMeeting.meetingAudience} meeting '${newMeeting.title}' for ${targets}`,
      );
    } else {
      logActivity(
        "Created Meeting Draft",
        `Saved draft meeting '${newMeeting.title}'`,
      );
    }

    return newMeeting;
  };

  const updateMeeting = (id: string, updates: Partial<SchoolMeeting>) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );

    const numericId = parseInt(id.replace(/\D/g, ""), 10);
    if (numericId) {
      updateMeetingApi(numericId, {
        meetingTitle: updates.title,
        meetingAudience: updates.meetingAudience,
        participantType:
          updates.participantType || updates.participants?.[0]?.type,
        participantName:
          updates.participants?.[0]?.name || updates.targetGroupDescription,
        participantPhone: (updates.participants?.[0] as any)?.phone,
        wardStudentName:
          (updates.participants?.[0] as any)?.wardName ||
          (updates.participants?.[0] as any)?.studentName,
        wardAdmissionNo: (updates.participants?.[0] as any)?.admissionNo,
        wardClass: (updates.participants?.[0] as any)?.className,
        agenda: updates.description,
        meetingMode: updates.mode,
        building: updates.building,
        floor: updates.floor,
        meetingRoom: updates.roomVenue || updates.venue,
        roomCapacity: updates.roomCapacity,
        onlineMeetingUrl: updates.onlineMeetingUrl,
        meetingDate: updates.date,
        startTime: updates.startTime,
        endTime: updates.endTime,
        meetingStatus: updates.status
          ? updates.status.toUpperCase()
          : undefined,
        priority: updates.priority,
        attendancePolicy: updates.attendanceRequired,
        recurrence: updates.recurrence,
        totalRecipients: updates.participants?.length,
      }).catch((e) => console.warn("API updateMeeting error:", e));
    }

    logActivity("Updated Meeting", `Updated details for meeting ID ${id}`);
  };

  const cancelMeeting = (id: string, reason: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: "Cancelled", cancellationReason: reason }
          : m,
      ),
    );
    logActivity(
      "Cancelled Meeting",
      `Cancelled meeting ID ${id}. Reason: ${reason}`,
    );
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    logActivity("Deleted Meeting", `Removed meeting record ID ${id}`);
  };

  const addDepartment = (deptData: Omit<Department, "id">): Department => {
    const id = "DEPT-" + Math.floor(100 + Math.random() * 900);
    const newDept: Department = {
      ...deptData,
      id,
    };

    createDepartmentApi({
      departmentName: newDept.departmentName,
      departmentCode: newDept.departmentCode || "",
      description: newDept.description || "",
      status: newDept.status,
    })
      .then((response: any) => {
        if (response && response.success && response.data) {
          setDepartments((prev) =>
            prev.map((d) =>
              d.id === newDept.id
                ? { ...d, id: response.data.departmentId.toString() }
                : d,
            ),
          );
        }
      })
      .catch((err) => console.error("Failed to create department", err));

    setDepartments((prev) => [newDept, ...prev]);
    logActivity(
      "Created Department",
      `Added department ${newDept.departmentName}`,
    );
    return newDept;
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    const oldDept = departments.find((d) => d.id === id);
    const oldName = oldDept?.departmentName;

    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && oldDept) {
      const fullDept = { ...oldDept, ...updates };
      updateDepartmentApi(numericId, {
        departmentName: fullDept.departmentName,
        departmentCode: fullDept.departmentCode || "",
        description: fullDept.description || "",
        status: fullDept.status,
      }).catch((err) => console.error("Failed to update department", err));
    }

    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );

    if (
      updates.departmentName &&
      oldName &&
      updates.departmentName !== oldName
    ) {
      setSubjects((prev) =>
        prev.map((sub) => {
          if (sub.department === oldName || sub.departmentId === id) {
            return { ...sub, department: updates.departmentName };
          }
          return sub;
        }),
      );
    }

    logActivity(
      "Updated Department",
      `Updated details for department ${updates.departmentName || id}`,
    );
  };

  const deleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    logActivity("Deleted Department", `Removed department ID ${id}`);
  };

  const addDesignation = (
    designationData: Omit<DesignationMaster, "id">,
  ): DesignationMaster => {
    const id = "DESIG-" + Math.floor(100 + Math.random() * 900);
    const newDesignation: DesignationMaster = {
      ...designationData,
      id,
    };

    createDesignationApi({
      designationName: newDesignation.designationName,
      status: newDesignation.status,
    })
      .then((response: any) => {
        if (response && response.success && response.data) {
          setDesignations((prev) =>
            prev.map((d) =>
              d.id === newDesignation.id
                ? { ...d, id: response.data.designationId.toString() }
                : d,
            ),
          );
        }
      })
      .catch((err) => console.error("Failed to create designation", err));

    setDesignations((prev) => [newDesignation, ...prev]);
    logActivity(
      "Created Designation",
      `Added designation ${newDesignation.designationName}`,
    );
    return newDesignation;
  };

  const updateDesignation = (
    id: string,
    updates: Partial<DesignationMaster>,
  ) => {
    const oldDesig = designations.find((d) => d.id === id);
    const numericId = parseInt(id, 10);

    if (!isNaN(numericId) && oldDesig) {
      const fullDesig = { ...oldDesig, ...updates };
      updateDesignationApi(numericId, {
        designationName: fullDesig.designationName,
        status: fullDesig.status,
      }).catch((err) => console.error("Failed to update designation", err));
    }

    setDesignations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
    logActivity(
      "Updated Designation",
      `Updated details for designation ID ${id}`,
    );
  };

  const deleteDesignation = (id: string) => {
    setDesignations((prev) => prev.filter((d) => d.id !== id));
    logActivity("Deleted Designation", `Removed designation ID ${id}`);
  };

  const saveGradeConfiguration = (grades: GradeConfig[]) => {
    setGradeConfigurations(grades);
    logActivity("Saved Grade Configurations", `Updated grade range settings`);
  };

  const saveStudentAttendance = (record: any) => {
    const recordDate = String(record.date || "").split("T")[0];
    setStudentAttendance((prev) => {
      const recStudentId = String(record.studentId || record.id || "").trim();
      const recRoll = String(record.rollNo || "").trim();
      const recAdm = String(record.admissionNo || "").trim();
      const recName = String(record.studentName || "")
        .trim()
        .toLowerCase();

      const filtered = prev.filter((r) => {
        const rDate = String(r.date || "").split("T")[0];
        if (rDate !== recordDate) return true;
        const rStudentId = String(r.studentId || r.id || "").trim();
        const rRoll = String(r.rollNo || "").trim();
        const rAdm = String(r.admissionNo || "").trim();
        const rName = String(r.studentName || "")
          .trim()
          .toLowerCase();

        const isMatch =
          (recStudentId && rStudentId === recStudentId) ||
          (recRoll && (rRoll === recRoll || rStudentId === recRoll)) ||
          (recAdm && (rAdm === recAdm || rStudentId === recAdm)) ||
          (recName && rName && rName === recName);
        return !isMatch;
      });
      const updated = [...filtered, { ...record, date: recordDate }];
      return updated;
    });
    setTimeout(() => {
      try {
        window.dispatchEvent(new Event("attendance_updated"));
      } catch {}
    }, 0);

    // Async backend persistence
    saveBulkStudentAttendanceApi({
      date: recordDate,
      className: record.className,
      section: record.section,
      subject: record.subject,
      period: record.period,
      records: [
        {
          studentId: record.studentId || record.id,
          rollNo: record.rollNo,
          admissionNo: record.admissionNo,
          studentName: record.studentName,
          className: record.className,
          section: record.section,
          date: recordDate,
          subject: record.subject,
          period: record.period,
          status: record.status || "Present",
          remarks: record.remarks || "",
          markedBy: record.markedBy,
        },
      ],
    }).catch((e) => {
      console.warn("Async saveStudentAttendance backend sync failed:", e);
    });

    logActivity(
      "Saved Student Attendance",
      `Updated attendance for student ID ${record.studentId}`,
    );
  };

  const saveBulkStudentAttendance = async (payload: any) => {
    try {
      const recs = payload.records || [];
      if (Array.isArray(recs) && recs.length > 0) {
        setStudentAttendance((prev) => {
          const map = new Map<string, any>();
          (prev || []).forEach((r) => {
            const k = `${r.studentId || r.id}_${String(r.date || "").split("T")[0]}_${r.subject || ""}_${r.period || ""}`;
            map.set(k, r);
          });
          recs.forEach((r: any) => {
            const rDate = String(r.date || payload.date || "").split("T")[0];
            const k = `${r.studentId || r.id}_${rDate}_${r.subject || payload.subject || ""}_${r.period || payload.period || ""}`;
            map.set(k, {
              ...r,
              date: rDate,
              className: r.className || payload.className,
              section: r.section || payload.section,
            });
          });
          const updated = Array.from(map.values());
          return updated;
        });
        setTimeout(() => {
          try {
            window.dispatchEvent(new Event("attendance_updated"));
          } catch {}
        }, 0);

        const response = await saveBulkStudentAttendanceApi(payload);
        return response;
      }
    } catch (err) {
      console.warn("Bulk attendance save failed:", err);
    }
  };

  const saveCoScholasticAssessment = (record: any) => {
    setCoScholasticAssessments((prev) => {
      const filtered = prev.filter((r) => r.studentId !== record.studentId);
      return [...filtered, record];
    });
    logActivity(
      "Saved Co-Scholastic Assessment",
      `Updated grades for student ID ${record.studentId}`,
    );
  };

  const saveProcessedResults = (results: ProcessedResult[]) => {
    setProcessedResults((prev) => {
      const cleanMap = new Map<string, ProcessedResult>();
      for (const r of results || []) {
        if (!r) continue;
        const k =
          `${String(r.examId || "").trim()}_${String(r.studentId || r.admissionNo || "").trim()}`.toLowerCase();
        cleanMap.set(k, r);
      }
      const cleanIncoming = Array.from(cleanMap.values());
      const incomingKeys = new Set(
        cleanIncoming.map((r) =>
          `${String(r.examId || "").trim()}_${String(r.studentId || r.admissionNo || "").trim()}`.toLowerCase(),
        ),
      );

      const filtered = prev.filter((p) => {
        if (!p) return false;
        const pKey =
          `${String(p.examId || "").trim()}_${String(p.studentId || p.admissionNo || "").trim()}`.toLowerCase();
        return !incomingKeys.has(pKey);
      });
      return [...filtered, ...cleanIncoming];
    });

    if (results && results.length > 0) {
      try {
        const first = results[0];
        publishExamResultsApi({
          examId: Number(first.examId) || 1,
          className: first.className,
          sectionName: first.section,
          results: results.map((r) => ({
            studentId: Number(r.studentId) || 0,
            rollNo: r.rollNo || "",
            studentName: r.studentName || "",
            admissionNo: r.admissionNo || "",
            className: r.className,
            sectionName: r.section,
            totalMarksObtained: Number(
              r.totalObtainedMarks || (r as any).totalMarksObtained || 0,
            ),
            totalMaxMarks: Number(r.totalMaxMarks || 0),
            percentage: Number(r.percentage || 0),
            grade: r.finalGrade || r.overallGrade || (r as any).grade || "",
            rank: Number(r.rank || 0),
            resultStatus: r.passStatus || (r as any).resultStatus || "",
            subjectMarks: (r.subjectMarks || []).map((sm: any) => ({
              subject: sm.subject || sm.subjectName || "",
              subjectCode: sm.subjectCode || sm.code || sm.subject || "",
              maxMarks: Number(sm.maxMarks || 100),
              passMarks: Number(sm.passMarks || 35),
              obtainedMarks: sm.obtainedMarks,
              grade: sm.grade || "",
              status: sm.status || (sm.isPass ? "Pass" : "Fail"),
            })),
          })),
        }).catch((err) => {
          console.warn("Backend auto save processed results sync error:", err);
        });
      } catch (err) {
        console.warn("Backend auto save processed results error:", err);
      }
    }

    logActivity(
      "Processed Exam Results",
      `Calculated grades & percentages for ${results.length} students`,
    );
  };

  const updateResultStatus = (
    examId: string,
    className: string,
    section: string,
    status: ProcessedResult["status"],
  ) => {
    const stamp = new Date().toISOString().split("T")[0];
    const cleanSec = (section || "")
      .replace("Section ", "")
      .trim()
      .toUpperCase();

    setProcessedResults((prev) =>
      prev.map((r) => {
        const rSec = (r.section || "")
          .replace("Section ", "")
          .trim()
          .toUpperCase();
        if (
          r.examId === examId &&
          r.className === className &&
          (!section ||
            section === "All" ||
            rSec === cleanSec ||
            r.section === section)
        ) {
          const isPublishing = status === "Published";
          const isApproving = status === "Approved";
          const isVerifying = (status as string) === "Verified";
          const isLocking = status === "Locked";
          const isResetting = status === "Draft";

          return {
            ...r,
            status,
            processedAt: r.processedAt || stamp,
            verifiedBy:
              isVerifying || isApproving || isPublishing
                ? r.verifiedBy || "Administrator"
                : r.verifiedBy,
            verifiedAt:
              isVerifying || isApproving || isPublishing
                ? r.verifiedAt || stamp
                : r.verifiedAt,
            approvedBy:
              isApproving || isPublishing
                ? r.approvedBy || "Administrator"
                : r.approvedBy,
            approvedAt:
              isApproving || isPublishing
                ? r.approvedAt || stamp
                : r.approvedAt,
            publishedAt: isPublishing
              ? r.publishedAt || stamp
              : isResetting
                ? undefined
                : r.publishedAt,
            lockedAt: isLocking ? stamp : undefined,
          };
        }
        return r;
      }),
    );
    if (status === "Published" || status === "Locked") {
      setExamMarks((prev) =>
        prev.map((m) => {
          const student = students.find((s) => s.id === m.studentId);
          const sSec = (student?.section || m.section || "")
            .replace("Section ", "")
            .trim()
            .toUpperCase();
          return m.examId === examId &&
            (student?.className === className || m.className === className) &&
            (!section || section === "All" || sSec === cleanSec)
            ? { ...m, isLocked: true }
            : m;
        }),
      );
    }
    if (status === "Draft" || status === "Calculated") {
      setExamMarks((prev) =>
        prev.map((m) => {
          const student = students.find((s) => s.id === m.studentId);
          const sSec = (student?.section || m.section || "")
            .replace("Section ", "")
            .trim()
            .toUpperCase();
          return m.examId === examId &&
            (student?.className === className || m.className === className) &&
            (!section || section === "All" || sSec === cleanSec)
            ? { ...m, isLocked: false }
            : m;
        }),
      );
    }
    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? {
              ...e,
              status:
                status === "Published" || status === "Locked"
                  ? "Results Published"
                  : status === "Calculated"
                    ? "Completed"
                    : e.status,
            }
          : e,
      ),
    );
    if (status === "Published") {
      try {
        const targetResults = processedResults.filter((r) => {
          const rSec = (r.section || "")
            .replace("Section ", "")
            .trim()
            .toUpperCase();
          return (
            r.examId === examId &&
            r.className === className &&
            (!section ||
              section === "All" ||
              rSec === cleanSec ||
              r.section === section)
          );
        });

        if (targetResults.length > 0) {
          publishExamResultsApi({
            examId: Number(examId) || 0,
            className,
            sectionName: section && section !== "All" ? section : "",
            results: targetResults.map((r) => ({
              studentId: Number(r.studentId) || 0,
              rollNo: r.rollNo || "",
              studentName: r.studentName || "",
              admissionNo: r.admissionNo || "",
              className: r.className || className,
              sectionName: r.section || section,
              totalMarksObtained: Number(
                r.totalObtainedMarks || (r as any).totalMarksObtained || 0,
              ),
              totalMaxMarks: Number(r.totalMaxMarks || 0),
              percentage: Number(r.percentage || 0),
              grade: r.finalGrade || r.overallGrade || (r as any).grade || "",
              rank: Number(r.rank || 0),
              resultStatus: r.passStatus || (r as any).resultStatus || "",
              subjectMarks: (r.subjectMarks || []).map((sm: any) => ({
                subject: sm.subject || sm.subjectName || "",
                subjectCode: sm.subjectCode || sm.code || sm.subject || "",
                maxMarks: Number(sm.maxMarks || 100),
                passMarks: Number(sm.passMarks || 35),
                obtainedMarks: sm.obtainedMarks,
                grade: sm.grade || "",
                status: sm.status || (sm.isPass ? "Pass" : "Fail"),
              })),
            })),
          }).catch((err) => {
            console.warn("Backend publish exam results sync error:", err);
          });
        }
      } catch (err) {
        console.warn("Backend publish exam results sync error:", err);
      }
    }

    logActivity(
      "Updated Results Status",
      `Set results for ${examId} (${className}-${section}) to ${status}`,
    );
  };

  const applyGraceOrRevaluation = (
    markId: string,
    newMarks: number,
    type: "Grace" | "Revaluation",
    reason: string,
    updatedBy: string,
  ) => {
    setExamMarks((prev) =>
      prev.map((m) => {
        if (m.id === markId) {
          const oldMarks = m.marksObtained;
          const history = m.revaluationHistory || [];
          const newLog = {
            date: new Date().toISOString().split("T")[0],
            oldMarks,
            newMarks,
            reason,
            updatedBy,
            type,
          };

          let grade = "F";
          const pct = (newMarks / m.totalMarks) * 100;
          const matchedConfig = gradeConfigurations.find(
            (c) => pct >= c.minPercent && pct <= c.maxPercent,
          );
          if (matchedConfig) grade = matchedConfig.gradeName;

          return {
            ...m,
            marksObtained: newMarks,
            graceMarks: type === "Grace" ? newMarks - oldMarks : m.graceMarks,
            isRevalued: type === "Revaluation" ? true : m.isRevalued,
            grade,
            revaluationHistory: [...history, newLog],
          };
        }
        return m;
      }),
    );
    logActivity(
      `Applied ${type}`,
      `Updated mark ID ${markId} to score ${newMarks}`,
    );
  };

  const addTimetableSlot = async (slotData: Omit<TimetableSlot, "id">) => {
    const tempId = `SLOT-TMP-${Date.now()}`;
    const newSlot: TimetableSlot = {
      id: tempId,
      ...slotData,
    };
    setTimetable((prev) => [...prev, newSlot]);

    try {
      const times = slotData.timeSlot.split("-");
      const startTime = times[0]?.trim() || "";
      const endTime = times[1]?.trim() || "";

      const res: any = await saveTimetableSlotApi({
        className: slotData.className,
        sectionName: slotData.section,
        academicYear: slotData.academicYear || selectedAcademicYear || "",
        dayOfWeek: slotData.day,
        startTime,
        endTime,
        subjectName: slotData.subject,
        teacherName: slotData.teacherName,
        roomNo: slotData.roomNo,
      });

      if (res?.success && res.data) {
        const created = res.data;
        setTimetable((prev) =>
          prev.map((s) =>
            s.id === tempId
              ? {
                  ...s,
                  id: created.slotId?.toString() || s.id,
                  subjectId: created.subjectId?.toString(),
                  teacherId: created.teacherId?.toString(),
                }
              : s,
          ),
        );
      }
    } catch (err) {
      console.warn("Failed to save timetable slot to backend", err);
    }
  };

  const updateTimetableSlot = async (
    id: string,
    updates: Partial<TimetableSlot>,
  ) => {
    setTimetable((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );

    try {
      const existingSlot = timetable.find((t) => t.id === id);
      if (!existingSlot) return;

      const merged = { ...existingSlot, ...updates };
      const times = merged.timeSlot.split("-");
      const startTime = times[0]?.trim() || "";
      const endTime = times[1]?.trim() || "";

      await saveTimetableSlotApi({
        className: merged.className,
        sectionName: merged.section,
        academicYear: merged.academicYear || selectedAcademicYear || "",
        dayOfWeek: merged.day,
        startTime,
        endTime,
        subjectName: merged.subject,
        teacherName: merged.teacherName,
        roomNo: merged.roomNo,
      });
    } catch (err) {
      console.warn("Failed to update timetable slot on backend", err);
    }
  };

  const deleteTimetableSlot = async (id: string) => {
    setTimetable((prev) => prev.filter((t) => t.id !== id));

    try {
      const numericId = id.startsWith("TT-") ? id.replace("TT-", "") : id;
      await deleteTimetableSlotApi(numericId);
    } catch (err) {
      console.warn("Failed to delete slot from backend", err);
    }
  };

  const clearClassTimetable = async (className: string, section: string) => {
    const norm = (str?: string) =>
      (str || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/class/gi, "")
        .replace(/section/gi, "");
    const existing = timetable.filter(
      (t) =>
        norm(t.className) === norm(className) &&
        norm(t.section) === norm(section),
    );

    // 1. Remove from local state and localStorage
    setTimetable((prev) => {
      const updated = prev.filter(
        (t) =>
          !(
            norm(t.className) === norm(className) &&
            norm(t.section) === norm(section)
          ),
      );
      try {
        localStorage.setItem("edu_db_timetable", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Call backend clear API to remove all slots for this class and section (all className & year variants)
    const cleanNum = className.replace(/^Class\s*/i, "").trim();
    try {
      await Promise.all([
        clearClassTimetableApi(className, section, selectedAcademicYear),
        clearClassTimetableApi(
          `Class ${cleanNum}`,
          section,
          selectedAcademicYear,
        ),
        clearClassTimetableApi(cleanNum, section, selectedAcademicYear),
        clearClassTimetableApi(className, section),
        clearClassTimetableApi(cleanNum, section),
      ]);
    } catch (err) {
      console.warn("Failed to clear timetable slots from backend", err);
    }

    // 3. Delete any known local id slots individually via backend API
    try {
      await Promise.all(
        existing.map(async (t) => {
          const rawId = String(t.id || "").trim();
          if (/^\d+$/.test(rawId) || /^TT-\d+$/i.test(rawId)) {
            const numericId = rawId.replace(/^TT-/i, "");
            await deleteTimetableSlotApi(numericId).catch(() => {});
          }
        }),
      );
    } catch (e) {}
  };

  const bulkAddTimetableSlots = (newSlots: TimetableSlot[]) => {
    setTimetable((prev) => {
      const norm = (str?: string) =>
        (str || "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/class/gi, "")
          .replace(/section/gi, "");
      const affectedKeys = new Set(
        newSlots.map((s) => `${norm(s.className)}-${norm(s.section)}`),
      );
      const filtered = prev.filter(
        (s) => !affectedKeys.has(`${norm(s.className)}-${norm(s.section)}`),
      );
      const updated = [...filtered, ...newSlots];
      try {
        localStorage.setItem("edu_db_timetable", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const addHomework = async (hwData: Omit<Homework, "id">) => {
    const id = "HW-" + Math.floor(100 + Math.random() * 900);
    const cleanSec = ((hwData as any).section || "")
      .replace(/^section\s*/i, "")
      .replace(/^sec\s*/i, "")
      .trim();
    const newHw: Homework = {
      ...hwData,
      id,
      section: cleanSec,
      branch: (hwData as any).branch || selectedBranch || "",
    } as any;
    setHomework((prev) => [newHw, ...prev]);
    logActivity(
      "Posted Homework",
      `Assigned ${newHw.title} for ${newHw.className}`,
    );

    try {
      const payload = {
        title: newHw.title,
        className: newHw.className,
        subjectName: newHw.subject,
        topic: newHw.title,
        description: newHw.description,
        dueDate: newHw.dueDate,
        publishedTo:
          newHw.publishToType === "Students"
            ? "Selected Students"
            : "Entire Class",
        status: newHw.status ? newHw.status.toUpperCase() : "PUBLISHED",
        teacherName: newHw.teacherName || "",
        attachmentFileName: newHw.attachments?.[0]?.name,
        attachmentUrl: newHw.attachments?.[0]?.url,
      };
      const res: any = await createHomeworkApi(payload);
      if (res?.data?.homeworkId) {
        const serverId = String(res.data.homeworkId);
        setHomework((prev) =>
          prev.map((h) => (h.id === id ? { ...h, id: serverId } : h)),
        );
      }
    } catch (err) {
      console.warn("Failed to create homework assignment on backend", err);
    }
  };

  const updateHomework = async (id: string, updates: Partial<Homework>) => {
    setHomework((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const cleanSec = (updates.section || h.section || "")
          .replace(/^section\s*/i, "")
          .replace(/^sec\s*/i, "")
          .trim();
        return { ...h, ...updates, section: cleanSec };
      }),
    );

    try {
      const numericId = id.replace(/^HW-/i, "");
      const payload = {
        title: updates.title,
        className: updates.className,
        subjectName: updates.subject,
        topic: updates.title,
        description: updates.description,
        dueDate: updates.dueDate,
        publishedTo:
          updates.publishToType === "Students"
            ? "Selected Students"
            : "Entire Class",
        status: updates.status ? updates.status.toUpperCase() : "PUBLISHED",
        teacherName: updates.teacherName || "",
        attachmentFileName: updates.attachments?.[0]?.name,
        attachmentUrl: updates.attachments?.[0]?.url,
      };
      await updateHomeworkApi(numericId, payload);
    } catch (err) {
      console.warn("Failed to update homework assignment on backend", err);
    }
  };

  const deleteHomework = async (id: string) => {
    const targetIdStr = String(id).toLowerCase().trim();
    const numericIdStr = targetIdStr.replace(/^hw-/i, "");

    setHomework((prev) => {
      const updated = prev.filter((h) => {
        const hIdStr = String(h.id).toLowerCase().trim();
        const hNumStr = hIdStr.replace(/^hw-/i, "");
        return hIdStr !== targetIdStr && hNumStr !== numericIdStr;
      });
      try {
        localStorage.setItem("edu_db_homework", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const numericId = id.replace(/^HW-/i, "");
      await deleteHomeworkApi(numericId);
    } catch (err) {
      console.warn("Failed to delete homework assignment on backend", err);
    }
  };

  const addBook = (bookData: Omit<BookItem, "id"> & { id?: string }) => {
    setBooks((prev) => {
      if (bookData.id && prev.some((b) => b.id === bookData.id)) {
        return prev.map((b) =>
          b.id === bookData.id ? { ...b, ...bookData } : b,
        );
      }
      const id = bookData.id || "BK-" + Math.floor(100 + Math.random() * 900);
      const newBook: BookItem = { ...bookData, id };
      return [newBook, ...prev];
    });
    logActivity("Cataloged Book", `Added/Updated ${bookData.title} in Library`);
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id && b.isbn !== id));
    logActivity("Deleted Book", `Removed book ID ${id} from Library`);
  };

  const issueBook = (issueData: Omit<BookIssue, "id">) => {
    const id = "ISS-" + Math.floor(100 + Math.random() * 900);
    const newIssue: BookIssue = { ...issueData, id };
    setBookIssues((prev) => [newIssue, ...prev]);

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === issueData.bookId) {
          const available = Math.max(0, b.availableCopies - 1);
          const status = available === 0 ? "Issued" : "Available";
          return { ...b, availableCopies: available, status: status as any };
        }
        return b;
      }),
    );

    logActivity(
      "Issued Library Book",
      `Issued book ID ${issueData.bookId} to ${issueData.borrowerName}`,
    );
  };

  const returnBook = (issueId: string) => {
    const issue = bookIssues.find((i) => i.id === issueId);
    if (!issue) return;

    setBookIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: "Returned" } : i)),
    );

    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === issue.bookId) {
          const available = b.availableCopies + 1;
          return { ...b, availableCopies: available, status: "Available" };
        }
        return b;
      }),
    );

    logActivity(
      "Returned Library Book",
      `Book issue ID ${issueId} marked returned`,
    );
  };

  const addTransportRoute = (routeData: Omit<TransportRoute, "id">) => {
    const id = "TR-" + Math.floor(10 + Math.random() * 90);
    const newRoute: TransportRoute = { ...routeData, id };
    setTransportRoutes((prev) => [...prev, newRoute]);
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, "id">) => {
    const id = "INV-" + Math.floor(10 + Math.random() * 90);
    const newItem: InventoryItem = { ...itemData, id };
    setInventory((prev) => [...prev, newItem]);
  };

  const addAnnouncement = (annData: Omit<Announcement, "id">) => {
    const id = "ANC-" + Math.floor(10 + Math.random() * 90);
    const newAnn: Announcement = { ...annData, id };
    setAnnouncements((prev) => [newAnn, ...prev]);

    createNotificationApi({
      title: newAnn.title,
      category: newAnn.category || "GENERAL",
      content: newAnn.content,
      targetAudience: newAnn.targetAudience || "ALL",
      createdDate: newAnn.date || new Date().toISOString().split("T")[0],
      author:
        newAnn.author ||
        user?.name ||
        (typeof role === "string" ? role : "") ||
        "",
      isPinned: (newAnn as any).isPinned || false,
      smsSent: true,
      emailSent: true,
      pushDelivered: true,
    }).catch((e) => console.warn("API createNotification error:", e));

    logActivity("Published Announcement", `Posted: ${newAnn.title}`);
  };

  // Uniform category CRUD
  const addUniformCategory = async (cData: Omit<UniformCategory, "id">) => {
    const catName = cData.name || (cData as any).categoryName || "New Category";
    try {
      const res: any = await createUniformCategoryApi({
        categoryName: catName,
        description: cData.description || "",
        status: (cData as any).status || "Active",
      });
      const serverCat = res?.data || res;
      const realId = String(serverCat?.categoryId || serverCat?.id || `UC-${Date.now()}`);
      const newCat: UniformCategory = {
        ...cData,
        id: realId,
        createdAt: serverCat?.createdAt || new Date().toISOString(),
        name: catName,
        categoryName: catName,
        branch: (cData as any).branch || selectedBranch || "",
      };
      setUniformCategories((prev) => [newCat, ...prev]);
      await fetchUniformData();
      return realId;
    } catch (err) {
      console.error("Failed to create uniform category on backend:", err);
      throw err;
    }
  };

  const updateUniformCategory = async (
    id: string,
    updates: Partial<UniformCategory>,
  ) => {
    const catName = updates.name || (updates as any).categoryName || "";
    try {
      await updateUniformCategoryApi(id, {
        id: isNaN(Number(id)) ? id : Number(id),
        categoryId: isNaN(Number(id)) ? id : Number(id),
        categoryName: catName,
        description: updates.description || "",
        status: (updates as any).status || "Active",
      });
      setUniformCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates, name: catName, categoryName: catName } : c)),
      );
      await fetchUniformData();
    } catch (err) {
      console.error("Failed to update uniform category on backend:", err);
      throw err;
    }
  };

  const deleteUniformCategory = async (id: string) => {
    try {
      await deleteUniformCategoryApi(id);
      setUniformCategories((prev) => prev.filter((c) => c.id !== id));
      await fetchUniformData();
    } catch (err) {
      console.error("Failed to delete uniform category on backend:", err);
      throw err;
    }
  };

  // Uniform sizes CRUD
  const addUniformSize = async (sData: Omit<UniformSize, "id">) => {
    const sName = sData.sizeName || (sData as any).sizeCodeName || "M";
    try {
      const res: any = await createUniformSizeApi({
        sizeName: sName,
        sizeCodeName: sName,
        chestSpec: sData.chest || "",
        waistSpec: sData.waist || "",
        shoulderSpec: sData.shoulder || "",
        ageBracket: sData.ageGroup || "",
        gender: sData.gender || "Unisex",
      });
      const serverSize = res?.data || res;
      const realId = String(serverSize?.sizeId || serverSize?.id || `US-${Date.now()}`);
      const newSize: UniformSize = {
        ...sData,
        id: realId,
        createdAt: serverSize?.createdAt || new Date().toISOString(),
        sizeName: sName,
        sizeCodeName: sName,
        branch: (sData as any).branch || selectedBranch || "",
      };
      setUniformSizes((prev) => [newSize, ...prev]);
      await fetchUniformData();
      return realId;
    } catch (err) {
      console.error("Failed to create uniform size on backend:", err);
      throw err;
    }
  };

  const updateUniformSize = async (
    id: string,
    updates: Partial<UniformSize>,
  ) => {
    const sName = updates.sizeName || (updates as any).sizeCodeName || "";
    try {
      await updateUniformSizeApi(id, {
        id: isNaN(Number(id)) ? id : Number(id),
        sizeId: isNaN(Number(id)) ? id : Number(id),
        sizeName: sName,
        sizeCodeName: sName,
        chestSpec: updates.chest || "",
        waistSpec: updates.waist || "",
        shoulderSpec: updates.shoulder || "",
        ageBracket: updates.ageGroup || "",
        gender: updates.gender || "Unisex",
      });
      setUniformSizes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates, sizeName: sName, sizeCodeName: sName } : s)),
      );
      await fetchUniformData();
    } catch (err) {
      console.error("Failed to update uniform size on backend:", err);
      throw err;
    }
  };

  const deleteUniformSize = async (id: string) => {
    try {
      await deleteUniformSizeApi(id);
      setUniformSizes((prev) => prev.filter((s) => s.id !== id));
      await fetchUniformData();
    } catch (err) {
      console.error("Failed to delete uniform size on backend:", err);
      throw err;
    }
  };

  // Uniform suppliers CRUD
  const addUniformSupplier = async (sData: Omit<UniformSupplier, "id">) => {
    const sName =
      sData.supplierName || (sData as any).companyName || "Supplier Partner";
    try {
      const res: any = await createUniformSupplierApi({
        supplierName: sName,
        companyName: sName,
        contactPerson: sData.contactPerson || "",
        phone: sData.mobile || sData.phone || (sData as any).mobileNumber || "",
        mobile: sData.mobile || sData.phone || (sData as any).mobileNumber || "",
        email: sData.email || (sData as any).emailAddress || "",
        gstNumber: sData.gstNumber || (sData as any).gstRegistrationNo || "",
        address: sData.address || (sData as any).warehouseAddress || "",
        status: sData.status || "Active",
      });
      const serverSup = res?.data || res;
      const realId = String(serverSup?.supplierId || serverSup?.id || `SUP-${Date.now()}`);
      const newSupplier: UniformSupplier = {
        ...sData,
        id: realId,
        createdAt: serverSup?.createdAt || new Date().toISOString(),
        supplierName: sName,
        companyName: sName,
        branch: (sData as any).branch || selectedBranch || "",
      };
      setUniformSuppliers((prev) => [newSupplier, ...prev]);
      await fetchUniformData();
      return realId;
    } catch (err) {
      console.error("Failed to create uniform supplier on backend:", err);
      throw err;
    }
  };

  const updateUniformSupplier = async (
    id: string,
    updates: Partial<UniformSupplier>,
  ) => {
    const sName = updates.supplierName || (updates as any).companyName || "";
    try {
      await updateUniformSupplierApi(id, {
        id: isNaN(Number(id)) ? id : Number(id),
        supplierId: isNaN(Number(id)) ? id : Number(id),
        supplierName: sName,
        companyName: sName,
        contactPerson: updates.contactPerson || "",
        phone:
          updates.mobile ||
          updates.phone ||
          (updates as any).mobileNumber ||
          "",
        mobile:
          updates.mobile ||
          updates.phone ||
          (updates as any).mobileNumber ||
          "",
        email: updates.email || (updates as any).emailAddress || "",
        gstNumber:
          updates.gstNumber || (updates as any).gstRegistrationNo || "",
        address: updates.address || (updates as any).warehouseAddress || "",
        status: updates.status || "Active",
      });
      setUniformSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates, supplierName: sName, companyName: sName } : s)),
      );
      await fetchUniformData();
    } catch (err) {
      console.error("Failed to update uniform supplier on backend:", err);
      throw err;
    }
  };

  const deleteUniformSupplier = async (id: string) => {
    try {
      await deleteUniformSupplierApi(id);
      setUniformSuppliers((prev) => prev.filter((s) => s.id !== id));
      await fetchUniformData();
    } catch (err) {
      console.error("Failed to delete uniform supplier on backend:", err);
      throw err;
    }
  };

  // Uniform inventory CRUD
  const addUniformInventory = (iData: Omit<UniformInventoryItem, "id">) => {
    const id = "UINV-" + Date.now();
    const createdAt = new Date().toISOString();
    setUniformInventory((prev) => [
      {
        ...iData,
        id,
        createdAt,
        branch: (iData as any).branch || selectedBranch || "",
      } as any,
      ...prev,
    ]);
    setUniforms((prev) =>
      prev.map((u) =>
        u.id === iData.itemId || u.category === iData.itemName
          ? { ...u, availableStock: iData.currentStock }
          : u,
      ),
    );
  };
  const updateUniformInventory = async (
    id: string,
    updates: Partial<UniformInventoryItem>,
  ) => {
    let targetItemId: any = undefined;

    setUniformInventory((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          targetItemId = i.itemId || i.id;
          const updated = { ...i, ...updates };
          if (updates.currentStock !== undefined) {
            setUniforms((prevU) =>
              prevU.map((u) =>
                u.id === i.itemId || u.category === i.itemName
                  ? { ...u, availableStock: updates.currentStock! }
                  : u,
              ),
            );
          }
          return updated;
        }
        return i;
      }),
    );

    const targetIdStr = String(targetItemId || "");
    if (
      targetIdStr &&
      !targetIdStr.startsWith("inv-cfg-") &&
      !targetIdStr.startsWith("UNI-") &&
      !targetIdStr.startsWith("UINV-")
    ) {
      try {
        await adjustUniformStockApi(targetItemId, {
          newStockLevel: updates.currentStock,
          quantity: updates.currentStock,
          notes: updates.lastUpdated
            ? `Stock updated on ${updates.lastUpdated}`
            : "Manual inventory adjustment",
        });
      } catch (err) {
        console.warn("Failed to adjust uniform stock on backend:", err);
      }
    }
  };
  const deleteUniformInventory = (id: string) => {
    setUniformInventory((prev) => prev.filter((i) => i.id !== id));
  };

  // Helper to sync inventory & catalog stock on issue or return
  const syncUniformStockOnIssueOrReturn = (
    action: "issue" | "return",
    itemInfo: {
      itemId?: string;
      itemName?: string;
      itemCategory?: string;
      quantity?: number;
      size?: string;
    },
  ) => {
    const qty = Number(itemInfo.quantity) || 1;
    const rawName = (itemInfo.itemName || itemInfo.itemCategory || "").trim();
    if (!rawName && !itemInfo.itemId) return;

    const cleanName = rawName
      .replace(/\s*\(extra\)/gi, "")
      .replace(/\s*\(extra purchase\)/gi, "")
      .replace(/\s*\(admission kit\)/gi, "")
      .replace(/\s*\(base admission kit\)/gi, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const normSize = (itemInfo.size || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    // 1. Update uniformInventory
    setUniformInventory((prevInv) => {
      let idx = prevInv.findIndex((i) =>
        Boolean(
          itemInfo.itemId &&
          (i.itemId === itemInfo.itemId || i.id === itemInfo.itemId),
        ),
      );

      if (idx === -1 && cleanName) {
        idx = prevInv.findIndex((i) => {
          const invCat = (i.category || i.itemName || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const invName = (i.itemName || i.category || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

          const nameMatch =
            invCat === cleanName ||
            invName === cleanName ||
            invCat.includes(cleanName) ||
            cleanName.includes(invCat) ||
            invName.includes(cleanName) ||
            cleanName.includes(invName);

          if (nameMatch) {
            if (normSize && (i.size || (i as any).meterRange)) {
              const invSize = (i.size || (i as any).meterRange || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              return (
                invSize === normSize ||
                invSize.includes(normSize) ||
                normSize.includes(invSize)
              );
            }
            return true;
          }

          // Keyword fallback matches for Girls Package, Boys Package, Cloth, Sports
          if (
            cleanName.includes("girl") &&
            (invCat.includes("girl") || invName.includes("girl"))
          )
            return true;
          if (
            cleanName.includes("boy") &&
            (invCat.includes("boy") || invName.includes("boy"))
          )
            return true;
          if (
            (cleanName.includes("cloth") || cleanName.includes("fabric")) &&
            (invCat.includes("cloth") ||
              invCat.includes("fabric") ||
              invName.includes("cloth") ||
              invName.includes("fabric"))
          )
            return true;

          return false;
        });
      }

      let updatedInv = prevInv;

      if (idx !== -1) {
        updatedInv = prevInv.map((item, index) => {
          if (index === idx) {
            const maxCap = Math.min(100, item.openingStock || 100);
            const newStock =
              action === "issue"
                ? Math.max(0, item.currentStock - qty)
                : Math.min(maxCap, item.currentStock + qty);

            const newStatus =
              newStock === 0
                ? "Out of Stock"
                : newStock <= (item.minimumStock || 10)
                  ? "Low Stock"
                  : "In Stock";

            return {
              ...item,
              currentStock: newStock,
              status: newStatus,
              lastUpdated: new Date().toISOString().split("T")[0],
            };
          }
          return item;
        });
      } else if (action === "issue" && rawName) {
        const newInvItem: UniformInventoryItem = {
          id: `INV-AUTO-${Date.now()}`,
          itemId: itemInfo.itemId || `ITEM-${Date.now()}`,
          itemName: rawName,
          category: rawName,
          size: itemInfo.size || "M",
          color: "Standard",
          openingStock: 100,
          currentStock: Math.max(0, 100 - qty),
          minimumStock: 10,
          unitPrice: 500,
          supplier: "Main Warehouse",
          lastUpdated: new Date().toISOString().split("T")[0],
          status: 100 - qty <= 10 ? "Low Stock" : "In Stock",
        };
        updatedInv = [newInvItem, ...prevInv];
      }

      return updatedInv;
    });

    // 2. Update uniforms catalog availableStock
    setUniforms((prevU) => {
      let idx = prevU.findIndex((u) =>
        Boolean(itemInfo.itemId && u.id === itemInfo.itemId),
      );

      if (idx === -1 && cleanName) {
        idx = prevU.findIndex((u) => {
          const uCat = (u.category || u.name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const isMatch =
            uCat === cleanName ||
            uCat.includes(cleanName) ||
            cleanName.includes(uCat);
          if (isMatch) return true;
          if (cleanName.includes("girl") && uCat.includes("girl")) return true;
          if (cleanName.includes("boy") && uCat.includes("boy")) return true;
          if (
            (cleanName.includes("cloth") || cleanName.includes("fabric")) &&
            (uCat.includes("cloth") || uCat.includes("fabric"))
          )
            return true;
          return false;
        });
      }

      if (idx === -1) return prevU;

      const updatedU = prevU.map((u, index) => {
        if (index === idx) {
          const maxCap = Math.min(100, u.openingStock || 100);
          const curAvail =
            u.availableStock !== undefined ? u.availableStock : maxCap;
          const nextAvail =
            action === "issue"
              ? Math.max(0, curAvail - qty)
              : Math.min(maxCap, curAvail + qty);
          return { ...u, availableStock: nextAvail };
        }
        return u;
      });

      return updatedU;
    });
  };

  // Student Uniform issues CRUD
  const addStudentUniformIssue = async (
    issueData: Omit<StudentUniformIssue, "id">,
  ) => {
    // Reduce warehouse inventory & catalog stock if issued
    if (
      issueData.status === "Issued" ||
      issueData.status === "Replaced" ||
      !issueData.status
    ) {
      syncUniformStockOnIssueOrReturn("issue", {
        itemId: issueData.itemId,
        itemName: issueData.itemName,
        itemCategory: (issueData as any).itemCategory,
        quantity: issueData.quantity,
        size: issueData.size,
      });
    }

    const newIssue = {
      ...issueData,
      id: "UIS-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      branch:
        selectedBranch &&
        selectedBranch !== "All Branches" &&
        selectedBranch !== "All"
          ? selectedBranch
          : issueData.branch || "",
    };

    setStudentUniformIssues((prev) => {
      const updated = [newIssue, ...prev];
      try {
        localStorage.setItem(
          "edu_db_student_uniform_issues",
          JSON.stringify(updated),
        );
        localStorage.setItem("student_uniform_issues", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const res: any = await issueUniformApi({
        studentId: issueData.studentId
          ? parseInt(issueData.studentId.replace(/\D/g, ""), 10) || undefined
          : undefined,
        admissionNo: issueData.admissionNo || issueData.studentId || "",
        studentName: issueData.studentName || "",
        className: issueData.className || "",
        transactionType:
          issueData.type || "Baseline Distribution (Admission Kit)",
        itemName: issueData.itemName || "Boys Package",
        sizeSpec: issueData.size || "M",
        quantity: issueData.quantity || 1,
        totalAmount: issueData.totalAmount || 0,
        notes: issueData.notes || "",
        status: issueData.status || "Issued",
      });
      if (res?.success && res?.data) {
        const serverId = String(res.data.distributionId || res.data.id);
        setStudentUniformIssues((prev) => {
          const updated = prev.map((i) =>
            i.id === newIssue.id ? { ...i, id: serverId } : i,
          );
          try {
            localStorage.setItem(
              "edu_db_student_uniform_issues",
              JSON.stringify(updated),
            );
            localStorage.setItem(
              "student_uniform_issues",
              JSON.stringify(updated),
            );
          } catch (e) {}
          return updated;
        });
      }
    } catch (err) {
      console.warn("Failed to issue uniform on backend:", err);
    }
  };

  const updateStudentUniformIssue = async (
    id: string,
    updates: Partial<StudentUniformIssue>,
  ) => {
    let issueToUpdate = studentUniformIssues.find((i) => i.id === id);
    if (!issueToUpdate && id) {
      const idLower = id.toLowerCase().trim();
      issueToUpdate = studentUniformIssues.find(
        (i) =>
          (i.studentId && i.studentId.toLowerCase().trim() === idLower) ||
          (i.admissionNo && i.admissionNo.toLowerCase().trim() === idLower) ||
          (i.studentName &&
            i.studentName.toLowerCase().trim().includes(idLower)),
      );
    }
    if (!issueToUpdate) {
      setStudentUniformIssues((prev) => {
        const updated = prev.map((issue) =>
          issue.id === id ? { ...issue, ...updates } : issue,
        );
        try {
          localStorage.setItem(
            "edu_db_student_uniform_issues",
            JSON.stringify(updated),
          );
          localStorage.setItem(
            "student_uniform_issues",
            JSON.stringify(updated),
          );
        } catch (e) {}
        return updated;
      });
      return;
    }

    const oldStatus = issueToUpdate.status;
    const newStatus = updates.status;
    const qty = issueToUpdate.quantity;
    const issueItemName = (issueToUpdate.itemName || "").toLowerCase();
    const itemId = issueToUpdate.itemId;

    // Adjust inventory stock on status change
    if (newStatus === "Returned" && oldStatus !== "Returned") {
      syncUniformStockOnIssueOrReturn("return", {
        itemId: issueToUpdate.itemId,
        itemName: issueToUpdate.itemName,
        quantity: issueToUpdate.quantity,
        size: issueToUpdate.size,
      });
    } else if (
      (newStatus === "Issued" || newStatus === "Replaced") &&
      oldStatus === "Returned"
    ) {
      syncUniformStockOnIssueOrReturn("issue", {
        itemId: issueToUpdate.itemId,
        itemName: issueToUpdate.itemName,
        quantity: issueToUpdate.quantity,
        size: issueToUpdate.size,
      });
    }
    // Handling Size Exchange (e.g. exchanging from Size L to Size M)
    else if (updates.size && updates.size !== issueToUpdate.size) {
      const oldSize = issueToUpdate.size;
      const newSize = updates.size;
      let newCardId = itemId;

      setUniforms((prevU) => {
        let oldIdx = prevU.findIndex((u) => Boolean(itemId && u.id === itemId));
        if (oldIdx === -1 && issueItemName) {
          oldIdx = prevU.findIndex((u) => {
            const uCat = (u.category || u.name || "").toLowerCase().trim();
            const isCatMatch =
              uCat === issueItemName ||
              uCat.includes(issueItemName) ||
              issueItemName.includes(uCat);
            if (!isCatMatch) return false;
            return oldSize
              ? (u.size || u.meterRange || "").toLowerCase().trim() ===
                  oldSize.toLowerCase().trim()
              : true;
          });
        }

        let newIdx = prevU.findIndex((u) => {
          const uCat = (u.category || u.name || "").toLowerCase().trim();
          const isCatMatch =
            uCat === issueItemName ||
            uCat.includes(issueItemName) ||
            issueItemName.includes(uCat);
          if (!isCatMatch) return false;
          return (
            (u.size || u.meterRange || "").toLowerCase().trim() ===
            newSize.toLowerCase().trim()
          );
        });

        if (newIdx !== -1) {
          newCardId = prevU[newIdx].id;
        }

        return prevU.map((u, index) => {
          if (index === oldIdx) {
            const maxCap =
              u.openingStock !== undefined
                ? u.openingStock
                : u.initialStock !== undefined
                  ? u.initialStock
                  : 150;
            const restored = Math.min(maxCap, (u.availableStock || 0) + qty);
            return { ...u, availableStock: restored };
          }
          if (index === newIdx) {
            const deducted = Math.max(0, (u.availableStock || 0) - qty);
            return { ...u, availableStock: deducted };
          }
          return u;
        });
      });

      if (newCardId) {
        updates.itemId = newCardId;
      }
    }

    setStudentUniformIssues((prev) => {
      const updated = prev.map((issue) =>
        issue.id === id ? { ...issue, ...updates } : issue,
      );
      try {
        localStorage.setItem(
          "edu_db_student_uniform_issues",
          JSON.stringify(updated),
        );
        localStorage.setItem("student_uniform_issues", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (id && !id.startsWith("UIS-")) {
      try {
        if (updates.status === "Returned") {
          await returnUniformApi(id, {
            returnReason: updates.notes || "Returned by student",
            remarks: updates.actionRemarks || "Item returned",
          });
        } else if (
          updates.status === "Exchanged" ||
          updates.newSize ||
          updates.size
        ) {
          await exchangeUniformApi(id, {
            newSize: updates.newSize || updates.size || "L",
            exchangeReason: updates.notes || "Size exchange",
            remarks: updates.actionRemarks || "Size exchanged",
          });
        }
      } catch (err) {
        console.warn("Failed to update uniform distribution on backend:", err);
      }
    }
  };

  const deleteStudentUniformIssue = async (idOrQuery: string) => {
    if (!idOrQuery) return;
    const targetLower = idOrQuery.toLowerCase().trim();

    // Find all issues matching id, studentId, admissionNo, or studentName
    const issuesToDelete = (studentUniformIssues || []).filter((i) => {
      if (!i) return false;
      const iId = (i.id || "").toLowerCase().trim();
      const iStdId = (i.studentId || "").toLowerCase().trim();
      const iAdmNo = (i.admissionNo || "").toLowerCase().trim();
      const iName = (i.studentName || "").toLowerCase().trim();

      return (
        iId === targetLower ||
        iStdId === targetLower ||
        iAdmNo === targetLower ||
        iName === targetLower ||
        (targetLower.length >= 3 && iName.includes(targetLower)) ||
        (targetLower.length >= 3 && targetLower.includes(iName))
      );
    });

    const idsToRemove = new Set(issuesToDelete.map((i) => i.id));
    if (idsToRemove.size === 0) {
      idsToRemove.add(idOrQuery);
    }

    // Track deleted IDs in localStorage so API refetches don't re-add them
    try {
      const deletedTrack = JSON.parse(
        localStorage.getItem("edu_db_deleted_uniform_issue_ids") || "[]",
      );
      idsToRemove.forEach((id) => deletedTrack.push(id));
      localStorage.setItem(
        "edu_db_deleted_uniform_issue_ids",
        JSON.stringify(deletedTrack),
      );
    } catch (e) {}

    // Restore inventory stock for each matching issue
    issuesToDelete.forEach((issueToDelete) => {
      const issueItemName = (issueToDelete.itemName || "").toLowerCase();
      const cleanIssueItemName = issueItemName
        .replace(/\s*\(extra\)/gi, "")
        .trim();

      setUniformInventory((prevInv) => {
        let idx = prevInv.findIndex((i) =>
          Boolean(
            issueToDelete.itemId &&
            (i.itemId === issueToDelete.itemId ||
              i.id === issueToDelete.itemId),
          ),
        );
        if (idx === -1 && cleanIssueItemName) {
          idx = prevInv.findIndex((i) => {
            const itemCat = (i.category || "").toLowerCase();
            const itemName = (i.itemName || "").toLowerCase();
            return (
              itemName === cleanIssueItemName ||
              itemCat === cleanIssueItemName ||
              itemName.includes(cleanIssueItemName) ||
              cleanIssueItemName.includes(itemName)
            );
          });
        }
        if (idx === -1) return prevInv;
        return prevInv.map((item, index) => {
          if (index === idx) {
            const calculatedNewStock =
              item.currentStock + (issueToDelete.quantity || 1);
            const st =
              calculatedNewStock === 0
                ? "Out of Stock"
                : calculatedNewStock <= (item.minimumStock || 10)
                  ? "Low Stock"
                  : "In Stock";
            return { ...item, currentStock: calculatedNewStock, status: st };
          }
          return item;
        });
      });

      setUniforms((prevU) => {
        let idx = prevU.findIndex((u) =>
          Boolean(issueToDelete.itemId && u.id === issueToDelete.itemId),
        );
        if (idx === -1 && cleanIssueItemName) {
          idx = prevU.findIndex((u) => {
            const uCat = (u.category || u.name || "").toLowerCase().trim();
            const isCatMatch =
              uCat === cleanIssueItemName ||
              uCat.includes(cleanIssueItemName) ||
              cleanIssueItemName.includes(uCat);
            if (!isCatMatch) return false;
            if (issueToDelete.size) {
              return (
                (u.size || u.meterRange || "").toLowerCase().trim() ===
                issueToDelete.size.toLowerCase().trim()
              );
            }
            return true;
          });
        }
        if (idx === -1) return prevU;
        return prevU.map((u, index) => {
          if (index === idx) {
            const nextAvail =
              (u.availableStock || 0) + (issueToDelete.quantity || 1);
            return { ...u, availableStock: nextAvail };
          }
          return u;
        });
      });
    });

    setStudentUniformIssues((prev) => {
      const updated = prev.filter((issue) => {
        if (!issue) return false;
        if (idsToRemove.has(issue.id)) return false;

        const iStdId = (issue.studentId || "").toLowerCase().trim();
        const iAdmNo = (issue.admissionNo || "").toLowerCase().trim();
        const iName = (issue.studentName || "").toLowerCase().trim();

        if (
          iStdId === targetLower ||
          iAdmNo === targetLower ||
          iName === targetLower
        )
          return false;
        if (targetLower.length >= 3 && iName.includes(targetLower))
          return false;
        if (targetLower.length >= 3 && targetLower.includes(iName))
          return false;

        return true;
      });

      try {
        localStorage.setItem(
          "edu_db_student_uniform_issues",
          JSON.stringify(updated),
        );
        localStorage.setItem("student_uniform_issues", JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    if (idOrQuery && !idOrQuery.startsWith("UIS-")) {
      try {
        await deleteUniformDistributionApi(idOrQuery);
      } catch (err) {
        console.warn("Failed to delete uniform distribution on backend:", err);
      }
    }
  };

  // Finance Uniform configurations CRUD with automatic Sync to Fee Setup & Dynamic Fee Structures
  const syncUniformConfigToFinanceFees = (config: FinanceUniformConfig) => {
    if (!config.className || !config.feeAmount || config.feeAmount <= 0) return;

    setDynamicFeeStructures((prevDfs) => {
      const targetLower = config.className.toLowerCase().trim();
      const targetDigits = targetLower.replace(/\D/g, "");
      const cleanTarget = targetLower.replace(/[^a-z0-9]/g, "");

      const existingDfs = prevDfs.find((d) => {
        if (!d || !d.className) return false;
        const dLower = d.className.toLowerCase().trim();
        if (dLower === targetLower) return true;
        if (targetLower.includes(dLower) || dLower.includes(targetLower))
          return true;

        const cleanD = dLower.replace(/[^a-z0-9]/g, "");
        if (
          cleanTarget &&
          cleanD &&
          (cleanTarget === cleanD ||
            cleanTarget.includes(cleanD) ||
            cleanD.includes(cleanTarget))
        )
          return true;

        const dDigits = dLower.replace(/\D/g, "");
        if (targetDigits && dDigits && targetDigits === dDigits) return true;

        return false;
      });

      const feeItemName = config.uniformPackage || "Uniform & Accessories Fee";

      if (existingDfs) {
        let hasItem = false;
        const updatedItems = (existingDfs.items || []).map((item) => {
          const lowerHead = (item.feeHeadName || "").toLowerCase();
          if (
            lowerHead.includes("uniform") ||
            lowerHead.includes("kit") ||
            lowerHead.includes("accessories")
          ) {
            hasItem = true;
            return {
              ...item,
              amount: Number(config.feeAmount),
              feeHeadName: feeItemName,
            };
          }
          return item;
        });

        if (!hasItem) {
          updatedItems.push({
            id: `FI-UNI-${Date.now()}`,
            feeHeadId: "FH-UNI-01",
            feeHeadName: feeItemName,
            amount: Number(config.feeAmount),
            frequency: config.feePlan || "Annual",
            dueMonth: "June",
          });
        }

        return prevDfs.map((d) =>
          d.id === existingDfs.id ? { ...d, items: updatedItems } : d,
        );
      } else {
        const newDfs: DynamicFeeStructure = {
          id: `DFS-UNI-${Date.now()}`,
          academicYear: config.academicYear || selectedAcademicYear || "",
          className: config.className.trim(),
          studentCategory: "All",
          totalAmount: Number(config.feeAmount),
          branch: config.branch || selectedBranch || "",
          items: [
            {
              id: `FI-UNI-${Date.now()}`,
              feeHeadId: "FH-UNI-01",
              feeHeadName: feeItemName,
              amount: Number(config.feeAmount),
              frequency: config.feePlan || "Annual",
              dueMonth: "June",
            },
          ],
          status: "Active",
        };
        return [...prevDfs, newDfs];
      }
    });
  };

  const cDigitsMatch = (t: string, c: string) => t && c && t === c;

  const addFinanceUniformConfig = async (
    cData: Omit<FinanceUniformConfig, "id">,
  ) => {
    let assignedId = `FUC-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    try {
      const apiRes: any = await FinanceAPI.createUniformFeeConfigApi({
        academicYear: cData.academicYear || selectedAcademicYear || "",
        branch: cData.branch || selectedBranch || "",
        className: cData.className,
        gender: cData.gender,
        uniformPackage: cData.uniformPackage,
        feePlan: cData.feePlan || "Annual",
        feeAmount: cData.feeAmount,
        effectiveFrom: cData.effectiveFrom,
        status: cData.status || "Active",
      });
      if (apiRes?.success && apiRes?.data?.id) {
        const candidateId = String(apiRes.data.id);
        // Only accept candidateId if it starts with FUC- and does NOT collide with any existing config
        if (
          candidateId.startsWith("FUC-") &&
          !financeUniformConfigs.some((c) => c && c.id === candidateId)
        ) {
          assignedId = candidateId;
        }
      }
    } catch (e) {
      console.warn("API createUniformFeeConfig failed, saving locally:", e);
    }

    const newConfig: FinanceUniformConfig = {
      ...cData,
      id: assignedId,
      branch: cData.branch || selectedBranch || "",
      academicYear: cData.academicYear || selectedAcademicYear || "",
      status: "Active",
    };

    setFinanceUniformConfigs((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const filtered = current.filter((c) => c && c.id !== newConfig.id);
      const updated = [newConfig, ...filtered];
      try {
        localStorage.setItem(
          "edu_db_finance_uniform_configs",
          JSON.stringify(updated),
        );
        localStorage.setItem(
          "finance_uniform_configs",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });

    syncUniformConfigToFinanceFees(newConfig);
  };

  const updateFinanceUniformConfig = async (
    id: string,
    updates: Partial<FinanceUniformConfig>,
  ) => {
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await FinanceAPI.updateUniformFeeConfigApi(numId, {
          className: updates.className || "",
          gender: updates.gender || "Unisex",
          uniformPackage: updates.uniformPackage || "",
          feePlan: updates.feePlan || "Annual",
          feeAmount: updates.feeAmount || 0,
          academicYear: updates.academicYear,
          branch: updates.branch,
          effectiveFrom: updates.effectiveFrom,
          status: updates.status || "Active",
        });
      } catch (e) {
        console.warn("API updateUniformFeeConfig failed:", e);
      }
    }

    setFinanceUniformConfigs((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const updated = current.map((c) => {
        if (c.id === id) {
          const u = { ...c, ...updates };
          syncUniformConfigToFinanceFees(u);
          return u;
        }
        return c;
      });
      try {
        localStorage.setItem(
          "edu_db_finance_uniform_configs",
          JSON.stringify(updated),
        );
        localStorage.setItem(
          "finance_uniform_configs",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
  };

  const deleteFinanceUniformConfig = async (id: string) => {
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      try {
        await FinanceAPI.deleteUniformFeeConfigApi(numId);
      } catch (e) {
        console.warn("API deleteUniformFeeConfig failed:", e);
      }
    }

    setFinanceUniformConfigs((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const updated = current.filter((c) => c.id !== id);
      try {
        localStorage.setItem(
          "edu_db_finance_uniform_configs",
          JSON.stringify(updated),
        );
        localStorage.setItem(
          "finance_uniform_configs",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
  };

  // Leave Management Fetchers
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
    } catch (err) {
      console.warn("Failed to fetch leave types from API", err);
    }
  }, []);

  const fetchLeaveApplications = useCallback(async () => {
    if (activeRequests.current["leave-applications"]) {
      return activeRequests.current["leave-applications"];
    }
    const promise = (async () => {
      try {
        const normalizeLeaveStatus = (
          st: string | undefined,
        ): LeaveApplication["status"] => {
          if (!st) return "Pending";
          const lower = st.trim().toLowerCase();
          if (lower === "approved") return "Approved";
          if (lower === "rejected") return "Rejected";
          if (lower === "cancelled" || lower === "canceled")
            return "Cancelled" as any;
          return "Pending";
        };

        const response = await fetchLeaveApplicationsApi();
        if (response && response.success && Array.isArray(response.data)) {
          const mapped: LeaveApplication[] = response.data.map((item: any) => ({
            id:
              item.leaveApplicationId?.toString() || item.id?.toString() || "",
            employeeId: item.staffId?.toString() || item.id?.toString() || "",
            employeeName: item.staffName || item.employeeName || "Staff Member",
            empId: item.employeeId || item.empId,
            department: item.department || "Academic Dept",
            designation: item.designation || "Staff",
            branchId:
              item.branchId ||
              (selectedBranch as any)?.id ||
              (typeof selectedBranch === "string" ? selectedBranch : "") ||
              "BR-001",
            branch: item.branch || item.branchName || "",
            employeeCategory:
              item.employeeCategory === "Teacher" ? "Teacher" : "Staff",
            leaveTypeId: item.leaveTypeId
              ? item.leaveTypeId.toString()
              : item.leaveTypeCode || "",
            leaveTypeName: item.leaveTypeName || "Leave",
            leaveTypeCode: item.leaveTypeCode || "",
            fromDate: item.fromDate,
            toDate: item.toDate,
            isHalfDay: item.isHalfDay,
            numberOfDays: Number(
              item.requestedDays || item.numberOfDays || item.daysCount || 1,
            ),
            reason: item.reason || "",
            attachments: [],
            status: normalizeLeaveStatus(item.status),
            appliedDate:
              item.appliedDate || new Date().toISOString().split("T")[0],
            approverRemarks: item.approverRemarks || "",
            approvedBy: item.approvedBy || "",
          }));
          const seen = new Set<string>();
          const deduped: LeaveApplication[] = [];
          for (const item of mapped) {
            const key = `${item.empId || item.employeeId}_${item.fromDate}_${item.toDate}_${item.leaveTypeId}_${item.status}`;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(item);
            }
          }
          setLeaveApplications(deduped);
        }
      } catch (err) {
        console.warn("Failed to fetch leave applications from API", err);
      } finally {
        delete activeRequests.current["leave-applications"];
      }
    })();
    activeRequests.current["leave-applications"] = promise;
    return promise;
  }, [selectedBranch]);

  const fetchLeaveBalances = useCallback(async () => {
    try {
      const response = await fetchLeaveBalancesApi();
      if (response && response.success && response.data) {
        setStaff((prevStaff) =>
          prevStaff.map((s) => {
            const bal = response.data.find(
              (item: any) => item.staffId?.toString() === s.id,
            );
            if (bal) {
              return {
                ...s,
                leaveBalance: {
                  casual: bal.casualLeaveBalance,
                  sick: bal.sickLeaveBalance,
                  paid: bal.earnedLeaveBalance,
                },
              };
            }
            return s;
          }),
        );
      }
    } catch (err) {
      console.warn("Failed to fetch leave balances from API", err);
    }
  }, []);

  const fetchSalaryStructures = useCallback(async () => {
    try {
      const response = await fetchSalaryStructuresApi();
      if (response && response.success && response.data) {
        setSalaryStructures(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch salary structures from API", err);
    }
  }, []);

  const fetchSalaryAssignments = useCallback(async () => {
    try {
      const response = await fetchSalaryAssignmentsApi();
      if (response && response.success && response.data) {
        setEmployeeSalaryAssignments(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch salary assignments from API", err);
    }
  }, []);

  const fetchPayrollConfigurations = useCallback(async () => {
    try {
      const response = await fetchPayrollConfigurationsApi();
      if (response && response.success && response.data) {
        setPayrollConfigurations(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch payroll configurations from API", err);
    }
  }, []);

  const fetchPayrollComponents = useCallback(async () => {
    try {
      const response = await fetchPayrollComponentsApi();
      if (response && response.success && response.data) {
        setPayrollComponents(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch payroll components from API", err);
    }
  }, []);

  const fetchPayrollRuns = useCallback(async () => {
    try {
      const response = await fetchPayrollRunsApi();
      if (response && response.success && response.data) {
        setPayrollRuns(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch payroll runs from API", err);
    }
  }, []);

  const fetchPayslips = useCallback(async (month?: string, year?: number) => {
    try {
      const response = await fetchPayslipsApi(month, year);
      if (response && response.success && response.data) {
        setPayslips(
          response.data.map((p: Payslip) => ({
            ...p,
            month: cleanPayslipMonth(p.month),
          })),
        );
      }
    } catch (err) {
      console.warn("Failed to fetch payslips from API", err);
    }
  }, []);

  // Leave Types CRUD
  const addLeaveType = async (tData: Omit<LeaveType, "id">) => {
    try {
      const response = await createLeaveTypeApi(tData);
      if (response && response.success) {
        addToast(
          "success",
          "Leave Type Created",
          "Leave type configuration saved successfully.",
        );
        await fetchLeaveTypes();
      }
    } catch (err: any) {
      console.error("Error adding leave type:", err);
      addToast("error", "API Error", "Failed to configure leave type.");
    }
  };
  const updateLeaveType = (id: string, updates: Partial<LeaveType>) => {
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };
  const deleteLeaveType = (id: string) => {
    setLeaveTypes((prev) => prev.filter((t) => t.id !== id));
  };

  // Leave Applications CRUD
  const addLeaveApplication = async (appData: Omit<LeaveApplication, "id">) => {
    let staffIdNum = 0;
    const staffMatch = staff.find(
      (s) =>
        s.id === appData.employeeId ||
        s.empId === appData.empId ||
        s.empId === appData.employeeId ||
        (s.email &&
          (appData as any).email &&
          s.email.toLowerCase() === (appData as any).email.toLowerCase()) ||
        `${s.firstName} ${s.lastName}`.trim().toLowerCase() ===
          (appData.employeeName || "").trim().toLowerCase(),
    );
    if (staffMatch) {
      staffIdNum = parseInt(staffMatch.id, 10) || 0;
    }
    if (!staffIdNum) {
      const rawNum = parseInt(
        (appData.employeeId || "").replace(/\D/g, ""),
        10,
      );
      staffIdNum = isNaN(rawNum) ? 0 : rawNum;
    }

    let leaveTypeIdNum = 0;
    const allKnownTypes =
      leaveTypes && leaveTypes.length > 0
        ? leaveTypes
        : [
            { id: "1", name: "Casual Leave", code: "CL" },
            { id: "2", name: "Sick Leave", code: "SL" },
            { id: "3", name: "Paid / Earned Leave", code: "PL" },
            { id: "4", name: "On Duty Leave", code: "OD" },
            { id: "5", name: "Maternity / Paternity Leave", code: "ML" },
            { id: "6", name: "Loss of Pay (Unpaid)", code: "LOP" },
          ];
    const typeMatch = allKnownTypes.find(
      (t) =>
        t.id === appData.leaveTypeId ||
        (t.id &&
          appData.leaveTypeId &&
          String(t.id).replace(/\D/g, "") !== "" &&
          String(t.id).replace(/\D/g, "") ===
            String(appData.leaveTypeId).replace(/\D/g, "")) ||
        t.name.toLowerCase() === (appData.leaveTypeName || "").toLowerCase() ||
        (t.code &&
          appData.leaveTypeName &&
          t.code.toLowerCase() === appData.leaveTypeName.toLowerCase()),
    );
    if (typeMatch) {
      leaveTypeIdNum =
        parseInt(String(typeMatch.id).replace(/\D/g, ""), 10) || 0;
    }
    if (!leaveTypeIdNum) {
      const rawNum = parseInt(
        String(appData.leaveTypeId || "").replace(/\D/g, ""),
        10,
      );
      leaveTypeIdNum = isNaN(rawNum) ? 0 : rawNum;
    }

    const payload = {
      staffId: staffIdNum,
      employeeId: staffMatch?.empId || appData.empId || appData.employeeId,
      leaveTypeId: leaveTypeIdNum,
      leaveTypeCode: typeMatch?.code || (appData as any).leaveTypeCode || "",
      fromDate: appData.fromDate,
      toDate: appData.toDate,
      isHalfDay: !!appData.isHalfDay,
      reason: appData.reason,
    };

    try {
      const res = await createLeaveApplicationApi(payload);
      if (res && res.success) {
        addToast(
          "success",
          "Request Filed",
          "Leave application submitted successfully.",
        );
        await fetchLeaveApplications();
        await fetchLeaveBalances();
        return;
      }
    } catch (err: any) {
      console.warn("API error during leave submission:", err);
      addToast(
        "error",
        "Submission Failed",
        "Failed to submit leave application to server.",
      );
    }

    const newId = `LA-${Date.now()}`;
    const newApp: LeaveApplication = {
      id: newId,
      ...appData,
      branchId:
        (selectedBranch as any)?.id ||
        (typeof selectedBranch === "string" ? selectedBranch : "") ||
        "BR-001",
      branch:
        (appData as any).branch ||
        (staffMatch as any)?.branchName ||
        staffMatch?.branch ||
        "",
      status: appData.status || "Pending",
      appliedDate:
        appData.appliedDate || new Date().toISOString().split("T")[0],
    };

    setLeaveApplications((prev) => {
      const updated = [newApp, ...prev];
      localStorage.setItem(
        "edu_db_leave_applications",
        JSON.stringify(updated),
      );
      localStorage.setItem("leave_applications", JSON.stringify(updated));
      localStorage.setItem("sms_leave_applications", JSON.stringify(updated));
      return updated;
    });
  };
  const updateLeaveApplication = async (
    id: string,
    updates: Partial<LeaveApplication>,
  ) => {
    setLeaveApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...updates } : app)),
    );
  };
  const deleteLeaveApplication = async (id: string) => {
    try {
      const numericId = parseInt(id.replace(/\D/g, ""), 10);
      if (numericId) {
        await deleteLeaveApplicationApi(numericId);
      }
      setLeaveApplications((prev) => prev.filter((app) => app.id !== id));
      await fetchLeaveApplications();
      await fetchLeaveBalances();
    } catch (err) {
      console.warn("Error deleting leave application:", err);
    }
  };

  // Holiday CRUD
  const addHoliday = async (hData: Omit<Holiday, "id">) => {
    const id = "HOL-" + Math.floor(100 + Math.random() * 900);
    const newHoliday: Holiday = {
      ...hData,
      id,
      branch: hData.branch || selectedBranch || "",
    };
    setHolidays((prev) => {
      const updated = [newHoliday, ...prev];
      try {
        localStorage.setItem("edu_db_holidays", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch {}
      return updated;
    });

    try {
      const payload = {
        name: newHoliday.name,
        type: newHoliday.type,
        startDate: newHoliday.startDate,
        endDate: newHoliday.endDate,
        description: newHoliday.description,
        applicableTo: newHoliday.applicableTo || "All Students & Staff",
      };
      await createHolidayApi(payload);
    } catch (err) {
      console.warn("Failed to create holiday on backend", err);
    }
  };

  const updateHoliday = async (id: string, updates: Partial<Holiday>) => {
    const targetIdStr = String(id).toLowerCase().trim();
    const numericIdStr = targetIdStr.replace(/^hol-/i, "");

    setHolidays((prev) => {
      const updated = prev.map((h) => {
        const hIdStr = String(h.id).toLowerCase().trim();
        const hNumStr = hIdStr.replace(/^hol-/i, "");
        if (hIdStr === targetIdStr || hNumStr === numericIdStr) {
          return { ...h, ...updates };
        }
        return h;
      });
      try {
        localStorage.setItem("edu_db_holidays", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const payload = {
        name: updates.name,
        type: updates.type,
        startDate: updates.startDate,
        endDate: updates.endDate,
        description: updates.description,
        applicableTo: updates.applicableTo || "All Students & Staff",
      };
      await updateHolidayApi(id, payload);
    } catch (err) {
      console.warn("Failed to update holiday on backend", err);
    }
  };

  const deleteHoliday = async (id: string) => {
    const targetIdStr = String(id).toLowerCase().trim();
    const numericIdStr = targetIdStr.replace(/^hol-/i, "");

    setHolidays((prev) => {
      const updated = prev.filter((h) => {
        const hIdStr = String(h.id).toLowerCase().trim();
        const hNumStr = hIdStr.replace(/^hol-/i, "");
        return hIdStr !== targetIdStr && hNumStr !== numericIdStr;
      });
      try {
        localStorage.setItem("edu_db_holidays", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const numericId = id.replace(/^HOL-/i, "");
      await deleteHolidayApi(numericId);
    } catch (err) {
      console.warn("Failed to delete holiday on backend", err);
    }
  };

  // School Events CRUD
  const addSchoolEvent = (eventData: Omit<SchoolEvent, "id">): SchoolEvent => {
    const id = "EVT-" + Math.floor(100 + Math.random() * 900);
    const newEvent: SchoolEvent = {
      ...eventData,
      id,
      branch: eventData.branch || selectedBranch || "",
      status: eventData.status || "Published",
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setSchoolEvents((prev) => [newEvent, ...prev]);
    logActivity(
      "Created School Event",
      `Scheduled event ${newEvent.title} on ${newEvent.startDate}`,
    );

    try {
      const payload = {
        title: newEvent.title,
        category: newEvent.category,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        location: newEvent.location,
        description: newEvent.description,
        status: newEvent.status ? newEvent.status.toUpperCase() : "PUBLISHED",
      };
      createSchoolEventApi(payload).catch((err) =>
        console.warn("Failed to create school event on backend", err),
      );
    } catch (err) {
      console.warn("Failed to create school event on backend", err);
    }

    return newEvent;
  };

  const updateSchoolEvent = async (
    id: string,
    updates: Partial<SchoolEvent>,
  ) => {
    const targetIdStr = String(id).toLowerCase().trim();
    const numericIdStr = targetIdStr.replace(/^evt-/i, "").replace(/^se-/i, "");

    setSchoolEvents((prev) => {
      const updated = prev.map((e) => {
        const eIdStr = String(e.id).toLowerCase().trim();
        const eNumStr = eIdStr.replace(/^evt-/i, "").replace(/^se-/i, "");
        if (eIdStr === targetIdStr || eNumStr === numericIdStr) {
          return {
            ...e,
            ...updates,
            updatedAt: new Date().toISOString().split("T")[0],
          };
        }
        return e;
      });
      try {
        localStorage.setItem("edu_db_school_events", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    logActivity("Updated School Event", `Updated event ID ${id}`);

    try {
      const payload = {
        title: updates.title,
        category: updates.category,
        startDate: updates.startDate,
        endDate: updates.endDate,
        startTime: updates.startTime,
        endTime: updates.endTime,
        location: updates.location || updates.venue,
        venue: updates.venue,
        organizer: updates.organizer,
        description: updates.description,
        status: updates.status ? updates.status.toUpperCase() : "PUBLISHED",
      };
      await updateSchoolEventApi(id, payload);
    } catch (err) {
      console.warn("Failed to update school event on backend", err);
    }
  };

  const deleteSchoolEvent = async (id: string) => {
    const targetIdStr = String(id).toLowerCase().trim();
    const numericIdStr = targetIdStr.replace(/^evt-/i, "").replace(/^se-/i, "");

    setSchoolEvents((prev) => {
      const updated = prev.filter((e) => {
        const eIdStr = String(e.id).toLowerCase().trim();
        const eNumStr = eIdStr.replace(/^evt-/i, "").replace(/^se-/i, "");
        return eIdStr !== targetIdStr && eNumStr !== numericIdStr;
      });
      try {
        localStorage.setItem("edu_db_school_events", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    logActivity("Deleted School Event", `Removed event ID ${id}`);

    try {
      await deleteSchoolEventApi(id);
    } catch (err) {
      console.warn("Failed to delete school event on backend", err);
    }
  };

  // TRAINING & ASSESSMENTS HANDLERS
  const addWorkshop = (
    wData: Omit<WorkshopTraining, "id">,
  ): WorkshopTraining => {
    const id = "WKS-" + Math.floor(100 + Math.random() * 900);
    const newWorkshop: WorkshopTraining = {
      ...wData,
      id,
      branch: wData.branch || selectedBranch || "",
      status: wData.status || "Scheduled",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setWorkshops((prev) => [newWorkshop, ...prev]);

    // Automatically Sync to Academic Calendar
    addSchoolEvent({
      title: `[Workshop] ${newWorkshop.workshopName}`,
      category: "Workshop & Seminar",
      description: `${newWorkshop.category} - ${newWorkshop.description}`,
      organizer: `${newWorkshop.trainerName} (${newWorkshop.organization})`,
      venue: newWorkshop.venue,
      startDate: newWorkshop.startDate,
      endDate: newWorkshop.endDate,
      startTime: newWorkshop.startTime,
      endTime: newWorkshop.endTime,
      branch: newWorkshop.branch,
      academicYear: selectedAcademicYear || "",
      participants: `${newWorkshop.participants.length} Employees Assigned`,
      status: "Published",
    });

    logActivity(
      "Created Workshop",
      `Created workshop ${newWorkshop.workshopName}`,
    );
    return newWorkshop;
  };

  const updateWorkshop = (id: string, updates: Partial<WorkshopTraining>) => {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    );
    logActivity("Updated Workshop", `Updated workshop ID ${id}`);
  };

  const deleteWorkshop = (id: string) => {
    setWorkshops((prev) => prev.filter((w) => w.id !== id));
    logActivity("Deleted Workshop", `Removed workshop ID ${id}`);
  };

  const markWorkshopAttendance = (
    workshopId: string,
    attendanceList: {
      employeeId: string;
      status: "Present" | "Absent" | "Excused";
    }[],
  ) => {
    setWorkshops((prev) =>
      prev.map((w) => {
        if (w.id !== workshopId) return w;
        const updatedParticipants = w.participants.map((p) => {
          const match = attendanceList.find(
            (a) => a.employeeId === p.employeeId,
          );
          return match ? { ...p, attendanceStatus: match.status } : p;
        });
        const presentCount = updatedParticipants.filter(
          (p) => p.attendanceStatus === "Present",
        ).length;
        const total = updatedParticipants.length;
        const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
        return {
          ...w,
          participants: updatedParticipants,
          attendancePct: pct,
          status: "Completed",
        };
      }),
    );
  };

  const submitWorkshopFeedback = (
    workshopId: string,
    employeeId: string,
    feedback: TrainingParticipant["feedback"],
  ) => {
    setWorkshops((prev) =>
      prev.map((w) => {
        if (w.id !== workshopId) return w;
        return {
          ...w,
          participants: w.participants.map((p) =>
            p.employeeId === employeeId ? { ...p, feedback } : p,
          ),
        };
      }),
    );
  };

  const addAssessment = (
    aData: Omit<EmployeeAssessment, "id">,
  ): EmployeeAssessment => {
    const id = "ASM-" + Math.floor(100 + Math.random() * 900);
    const newAssessment: EmployeeAssessment = {
      ...aData,
      id,
      branch: aData.branch || selectedBranch || "",
      status: aData.status || "Scheduled",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setEmployeeAssessments((prev) => [newAssessment, ...prev]);

    // Automatically Sync to Academic Calendar
    addSchoolEvent({
      title: `[Assessment] ${newAssessment.assessmentName}`,
      category: "Custom Event",
      description: `${newAssessment.assessmentType} for ${newAssessment.department || "All Departments"}`,
      organizer: newAssessment.evaluatorName,
      venue: "Online / Assessment Center",
      startDate: newAssessment.date,
      endDate: newAssessment.date,
      startTime: "10:00 AM",
      endTime: "11:30 AM",
      branch: newAssessment.branch,
      academicYear: selectedAcademicYear || "",
      participants: `${newAssessment.results.length} Candidates Scheduled`,
      status: "Published",
    });

    logActivity(
      "Created Assessment",
      `Scheduled ${newAssessment.assessmentName}`,
    );
    return newAssessment;
  };

  const updateAssessment = (
    id: string,
    updates: Partial<EmployeeAssessment>,
  ) => {
    setEmployeeAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
    logActivity("Updated Assessment", `Updated assessment ID ${id}`);
  };

  const deleteAssessment = (id: string) => {
    setEmployeeAssessments((prev) => prev.filter((a) => a.id !== id));
    logActivity("Deleted Assessment", `Removed assessment ID ${id}`);
  };

  const saveAssessmentResults = (
    assessmentId: string,
    results: AssessmentResult[],
  ) => {
    setEmployeeAssessments((prev) =>
      prev.map((a) => {
        if (a.id !== assessmentId) return a;
        return { ...a, results, status: "Evaluated" };
      }),
    );

    // Auto issue certificates for passing candidates
    const targetAssessment = employeeAssessments.find(
      (a) => a.id === assessmentId,
    );
    if (targetAssessment) {
      results.forEach((res) => {
        if (res.result === "Pass") {
          issueCertificate({
            programType: "Assessment",
            programName: targetAssessment.assessmentName,
            employeeId: res.employeeId,
            employeeName: res.employeeName,
            department: res.department,
            designation: res.designation,
            branch: res.branch || selectedBranch || "",
            completionDate: new Date().toISOString().split("T")[0],
            issuedBy:
              targetAssessment.evaluatorName || "Academic Competency Board",
            status: "Issued",
          });
        }
      });
    }
  };

  const issueCertificate = (
    certData: Omit<IssuedCertificate, "id" | "certificateNumber">,
  ): IssuedCertificate => {
    const id = "CRT-" + Math.floor(100 + Math.random() * 900);
    const certificateNumber =
      "CERT-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);
    const newCert: IssuedCertificate = {
      ...certData,
      id,
      certificateNumber,
      status: certData.status || "Issued",
    };
    setIssuedCertificates((prev) => [newCert, ...prev]);
    return newCert;
  };

  const reissueCertificate = (id: string) => {
    setIssuedCertificates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "Reissued",
              completionDate: new Date().toISOString().split("T")[0],
            }
          : c,
      ),
    );
  };

  // Payslip handler - strictly backend and database
  const disburseSalary = async (pData: Omit<Payslip, "id">, silent = false) => {
    const sanitizedData = {
      ...pData,
      month: cleanPayslipMonth(pData.month),
    };
    try {
      const response = await createPayslipApi(sanitizedData);
      if (response && response.success) {
        if (!silent) {
          addToast(
            "success",
            "Success",
            "Payslip generated and disbursal completed.",
          );
        }
        await fetchPayslips();
      } else {
        addToast(
          "error",
          "Error",
          response?.message || "Failed to generate payslip in database.",
        );
      }
    } catch (err: any) {
      console.error("Failed to disburse salary via API", err);
      addToast(
        "error",
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate payslip in database.",
      );
    }
  };

  const addPayrollConfiguration = async (
    configData: Omit<PayrollConfiguration, "id">,
  ) => {
    try {
      const response = await createPayrollConfigurationApi(configData);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Payroll configuration saved successfully.",
        );
        await fetchPayrollConfigurations();
      }
    } catch (err) {
      console.error("Failed to add payroll configuration", err);
      addToast("error", "Error", "Failed to add payroll configuration.");
    }
  };

  const updatePayrollConfiguration = async (
    id: string,
    updates: Partial<PayrollConfiguration>,
  ) => {
    try {
      const response = await updatePayrollConfigurationApi(id, updates);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Payroll configuration updated successfully.",
        );
        await fetchPayrollConfigurations();
      }
    } catch (err) {
      console.error("Failed to update payroll configuration", err);
      addToast("error", "Error", "Failed to update payroll configuration.");
    }
  };

  const deletePayrollConfiguration = async (id: string) => {
    try {
      const response = await deletePayrollConfigurationApi(id);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Payroll configuration deleted successfully.",
        );
        await fetchPayrollConfigurations();
      }
    } catch (err) {
      console.error("Failed to delete payroll configuration", err);
      addToast("error", "Error", "Failed to delete payroll configuration.");
    }
  };

  const activatePayrollConfiguration = async (id: string) => {
    try {
      const response = await activatePayrollConfigurationApi(id);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Payroll configuration activated successfully.",
        );
        await fetchPayrollConfigurations();
      }
    } catch (err) {
      console.error("Failed to activate payroll configuration", err);
      addToast("error", "Error", "Failed to activate payroll configuration.");
    }
  };

  const deactivatePayrollConfiguration = async (id: string) => {
    try {
      const response = await deactivatePayrollConfigurationApi(id);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Payroll configuration deactivated successfully.",
        );
        await fetchPayrollConfigurations();
      }
    } catch (err) {
      console.error("Failed to deactivate payroll configuration", err);
      addToast("error", "Error", "Failed to deactivate payroll configuration.");
    }
  };

  const addPayrollComponent = async (
    componentData: Omit<PayrollComponent, "id">,
  ) => {
    try {
      const response = await createPayrollComponentApi(componentData);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Salary component created successfully.",
        );
        await fetchPayrollComponents();
      }
    } catch (err) {
      console.error("Failed to add payroll component", err);
      addToast("error", "Error", "Failed to add payroll component.");
    }
  };

  const updatePayrollComponent = async (
    id: string,
    updates: Partial<PayrollComponent>,
  ) => {
    try {
      const response = await updatePayrollComponentApi(id, updates);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Salary component updated successfully.",
        );
        await fetchPayrollComponents();
      }
    } catch (err) {
      console.error("Failed to update payroll component", err);
      addToast("error", "Error", "Failed to update payroll component.");
    }
  };

  const deletePayrollComponent = async (id: string) => {
    try {
      const response = await deletePayrollComponentApi(id);
      if (response && response.success) {
        addToast(
          "success",
          "Success",
          "Salary component deleted successfully.",
        );
        await fetchPayrollComponents();
      }
    } catch (err) {
      console.error("Failed to delete payroll component", err);
      addToast("error", "Error", "Failed to delete payroll component.");
    }
  };

  const loadMonthlyStaffAttendance = async (
    monthNum: number,
    yearNum: number,
  ) => {
    try {
      const response = await fetchMonthlyStaffAttendanceApi(monthNum, yearNum);
      if (response && response.success && Array.isArray(response.data)) {
        const mappedRecords: DailyAttendance[] = response.data.map(
          (item: any) => ({
            id:
              item.staffAttendanceId?.toString() ||
              item.id?.toString() ||
              Math.random().toString(),
            date: String(item.date).split("T")[0].split(" ")[0],
            entityType: "Staff",
            entityId: item.staffId?.toString() || item.id?.toString() || "",
            status:
              item.status === "Half Day"
                ? "HalfDay"
                : item.status === "On Leave"
                  ? "Leave"
                  : item.status,
            remarks: item.remarks || "",
            inTime: item.inTime || "",
            outTime: item.outTime || "",
            department: item.department || "",
            designation: item.designation || "",
          }),
        );
        setAttendance((prev) => {
          const rest = prev.filter((r) => r.entityType !== "Staff");
          return [...rest, ...mappedRecords];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch monthly staff attendance", err);
    }
  };

  const roundAmount = (
    amount: number,
    rule?: SalaryStructure["roundOffRule"],
  ) => {
    if (!rule || rule === "No Round Off") return amount;
    if (rule === "Nearest 1") return Math.round(amount);
    if (rule === "Nearest 10") return Math.round(amount / 10) * 10;
    if (rule === "Nearest 50") return Math.round(amount / 50) * 50;
    return amount;
  };

  const getStructureBreakdown = (structure?: SalaryStructure) => {
    const basicLine =
      structure?.earnings.find((line) => /basic/i.test(line.name)) ||
      structure?.earnings[0];
    const basicSalary = basicLine?.amount || 0;
    const allowances = Math.max(
      0,
      (structure?.earnings || []).reduce((sum, line) => sum + line.amount, 0) -
        basicSalary,
    );
    const deductions = (structure?.deductions || []).reduce(
      (sum, line) => sum + (/employer\s*pf/i.test(line.name) ? 0 : line.amount),
      0,
    );
    const grossSalary = structure?.grossSalary || basicSalary + allowances;
    const netSalary = roundAmount(
      Math.max(0, grossSalary - deductions),
      structure?.roundOffRule,
    );
    return { basicSalary, allowances, deductions, grossSalary, netSalary };
  };

  const addSalaryStructure = async (
    structureData: Omit<SalaryStructure, "id">,
  ) => {
    try {
      const response = await createSalaryStructureApi({
        ...structureData,
        branch: structureData.branch || selectedBranch || "",
      });
      if (response && response.success) {
        addToast(
          "success",
          "Salary Structure Created",
          "Salary structure configuration saved successfully.",
        );
        await fetchSalaryStructures();
      }
    } catch (err: any) {
      console.error("Error adding salary structure:", err);
      addToast("error", "API Error", "Failed to save salary structure.");
    }
  };

  const updateSalaryStructure = async (
    id: string,
    updates: Partial<SalaryStructure>,
  ) => {
    try {
      const response = await updateSalaryStructureApi(parseInt(id), updates);
      if (response && response.success) {
        addToast(
          "success",
          "Salary Structure Updated",
          "Salary structure updated successfully.",
        );
        await fetchSalaryStructures();
        await fetchSalaryAssignments();
        await fetchStaff();
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
        addToast(
          "success",
          "Salary Structure Deleted",
          "Salary structure removed successfully.",
        );
        await fetchSalaryStructures();
        await fetchSalaryAssignments();
        await fetchStaff();
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
        addToast(
          "success",
          "Salary Structure Cloned",
          "Structure cloned successfully.",
        );
        await fetchSalaryStructures();
      }
    } catch (err: any) {
      console.error("Error cloning salary structure:", err);
      addToast("error", "API Error", "Failed to clone salary structure.");
    }
  };

  const loadSalaryStructures = (structures: SalaryStructure[]) => {
    setSalaryStructures(structures);
  };

  const assignEmployeeSalaryStructure = async (
    assignmentData: Omit<EmployeeSalaryAssignment, "id">,
  ) => {
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
        addToast(
          "success",
          "Salary Structure Assigned",
          "Employee salary assignment saved successfully.",
        );
        await fetchSalaryAssignments();
        await fetchStaff();
      }
    } catch (err: any) {
      console.error("Error assigning salary structure:", err);
      addToast("error", "API Error", "Failed to assign salary structure.");
    }
  };

  const updateEmployeeSalaryAssignment = (
    id: string,
    updates: Partial<EmployeeSalaryAssignment>,
  ) => {
    setEmployeeSalaryAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  };

  const deleteEmployeeSalaryAssignment = (id: string) => {
    const assignment = employeeSalaryAssignments.find((a) => a.id === id);
    setEmployeeSalaryAssignments((prev) => prev.filter((a) => a.id !== id));
    if (assignment?.status === "Active") {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === assignment.employeeId
            ? {
                ...s,
                salaryStructureId: undefined,
                salaryStructureName: undefined,
                salaryStructureEffectiveDate: undefined,
                salary: 0,
                grossSalary: undefined,
                netSalary: undefined,
              }
            : s,
        ),
      );
    }
  };

  const upsertPayrollRun = (runData: Omit<PayrollRun, "id">): PayrollRun => {
    let savedRun: PayrollRun = {
      ...runData,
      id: "PRUN-" + Math.floor(1000 + Math.random() * 9000),
    };
    setPayrollRuns((prev) => {
      const existing = prev.find(
        (r) =>
          r.employeeId === runData.employeeId &&
          r.payrollMonth === runData.payrollMonth,
      );
      if (existing) {
        savedRun = { ...existing, ...runData };
        return prev.map((r) => (r.id === existing.id ? savedRun : r));
      }
      return [...prev, savedRun];
    });

    upsertPayrollRunApi(savedRun)
      .then((res) => {
        if (res && res.success && res.data) {
          setPayrollRuns((prev) =>
            prev.map((r) =>
              r.employeeId === res.data.employeeId &&
              r.payrollMonth === res.data.payrollMonth
                ? { ...r, id: res.data.id }
                : r,
            ),
          );
        }
      })
      .catch((err) => console.error("Error upserting payroll run", err));

    return savedRun;
  };
  const updatePayrollRun = (id: string, updates: Partial<PayrollRun>) => {
    setPayrollRuns((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      const target = updated.find((r) => r.id === id);
      if (target) {
        updatePayrollRunApi(id, target).catch((err) =>
          console.error("Error updating payroll run", err),
        );
      }
      return updated;
    });
  };

  const deletePayrollRun = (id: string) => {
    setPayrollRuns((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      deletePayrollRunApi(id).catch((err) =>
        console.error("Error deleting payroll run", err),
      );
      return filtered;
    });
  };

  // Leave Application Status Engine
  const updateLeaveApplicationStatus = async (
    id: string,
    status: LeaveApplication["status"],
    remarks?: string,
    approvedBy?: string,
  ) => {
    setLeaveApplications((prev) => {
      const updated = prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              approverRemarks: remarks || app.approverRemarks,
              approvedBy: approvedBy || app.approvedBy || "Admin",
            }
          : app,
      );
      return updated;
    });

    try {
      const payload = {
        status: status,
        approverRemarks: remarks || "",
        approvedBy: approvedBy || "Admin",
      };

      const parsedId = parseInt(id.replace(/\D/g, "")) || 1;
      const response = await updateLeaveApplicationStatusApi(parsedId, payload);

      if (response && response.success) {
        addToast(
          "success",
          "Status Updated",
          `Leave application status updated to ${status}.`,
        );
        await fetchLeaveApplications();
        await fetchLeaveBalances();
      }
    } catch (err: any) {
      console.warn("API warning during status update (saved locally):", err);
      if (status === "Approved") {
        setStaff((prevStaff) => {
          const app = leaveApplications.find((a) => a.id === id);
          if (!app) return prevStaff;
          const targetStaffId = app.employeeId;
          const days = Number(app.numberOfDays) || 1;
          const tName = (
            (app as any).leaveType ||
            app.leaveTypeName ||
            ""
          ).toLowerCase();

          return prevStaff.map((s) => {
            if (
              s.id === targetStaffId ||
              (app.empId && s.empId === app.empId)
            ) {
              const getAllowance = (code: string) => {
                const found = leaveTypes.find(
                  (lt) =>
                    lt.code?.toUpperCase().includes(code) ||
                    lt.name?.toUpperCase().includes(code),
                );
                return found?.annualAllowance ?? found?.maxDays ?? 0;
              };
              const defaultCasual = getAllowance("CL");
              const defaultSick = getAllowance("SL");
              const defaultPaid = getAllowance("PL") || getAllowance("EL");

              const currentBal = s.leaveBalance || {
                casual: defaultCasual,
                sick: defaultSick,
                paid: defaultPaid,
              };
              let casual = currentBal.casual ?? defaultCasual;
              let sick = currentBal.sick ?? defaultSick;
              let paid = currentBal.paid ?? defaultPaid;
              if (tName.includes("casual")) casual = Math.max(0, casual - days);
              else if (tName.includes("sick")) sick = Math.max(0, sick - days);
              else if (tName.includes("earned") || tName.includes("paid"))
                paid = Math.max(0, paid - days);
              else casual = Math.max(0, casual - days);
              return { ...s, leaveBalance: { casual, sick, paid } };
            }
            return s;
          });
        });
      }
    }
  };

  const filterByBranch = <T,>(items: T[]): T[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter((item) => {
      const anyItem = item as any;

      // Check branch
      let branchMatch = true;
      if (
        selectedBranch &&
        selectedBranch !== "All Branches" &&
        selectedBranch !== "All"
      ) {
        const itemBranch =
          anyItem.branch ||
          anyItem.branchName ||
          anyItem.campusLocation ||
          anyItem.CampusLocation ||
          anyItem.branchFilter ||
          anyItem.campus;

        if (
          anyItem.applicableBranches &&
          Array.isArray(anyItem.applicableBranches)
        ) {
          branchMatch =
            anyItem.applicableBranches.includes(selectedBranch) ||
            anyItem.applicableBranches.includes("All Branches") ||
            anyItem.applicableBranches.includes("All");
        } else if (itemBranch) {
          const itemB = String(itemBranch).toLowerCase().trim();
          const selB = String(selectedBranch).toLowerCase().trim();
          branchMatch =
            itemB === "all branches" ||
            itemB === "all" ||
            itemB === selB ||
            selB.includes(itemB) ||
            itemB.includes(selB);
        }
      }

      // Check academic year
      let ayMatch = true;
      if (
        selectedAcademicYear &&
        selectedAcademicYear !== "All" &&
        anyItem.academicYear &&
        anyItem.academicYear !== "All"
      ) {
        const selClean = selectedAcademicYear.replace(/[^0-9]/g, "");
        const itemClean = String(anyItem.academicYear).replace(/[^0-9]/g, "");
        if (selClean && itemClean) {
          const selStart = selClean.slice(0, 4);
          const itemStart = itemClean.slice(0, 4);
          ayMatch =
            selClean === itemClean ||
            selStart === itemStart ||
            anyItem.academicYear === selectedAcademicYear;
        } else {
          ayMatch = anyItem.academicYear === selectedAcademicYear;
        }
      }

      return branchMatch && ayMatch;
    });
  };

  const filteredStudents = useMemo(() => {
    return filterByBranch(students);
  }, [students, selectedBranch, selectedAcademicYear]);

  useEffect(() => {
    setTotalStudentCount(filteredStudents.length);
  }, [students.length, selectedBranch, selectedAcademicYear]);

  const filteredStaff = useMemo(
    () => filterByBranch(staff),
    [staff, selectedBranch, selectedAcademicYear],
  );
  const filteredAdmissions = useMemo(
    () => filterByBranch(admissions),
    [admissions, selectedBranch, selectedAcademicYear],
  );
  const filteredClasses = useMemo(() => {
    const list = filterByBranch(academicClasses);
    return [...list].sort((a, b) => compareClassesAscending(a.name, b.name));
  }, [academicClasses, selectedBranch, selectedAcademicYear]);
  const filteredSubjects = useMemo(
    () => filterByBranch(subjects),
    [subjects, selectedBranch, selectedAcademicYear],
  );
  const filteredExams = useMemo(
    () => filterByBranch(exams),
    [exams, selectedBranch, selectedAcademicYear],
  );
  const filteredTimetable = useMemo(
    () => filterByBranch(timetable),
    [timetable, selectedBranch, selectedAcademicYear],
  );
  const filteredHomework = useMemo(
    () => filterByBranch(homework),
    [homework, selectedBranch, selectedAcademicYear],
  );
  const filteredFeeStructures = useMemo(
    () => filterByBranch(feeStructures),
    [feeStructures, selectedBranch, selectedAcademicYear],
  );
  const filteredFeePayments = useMemo(
    () => filterByBranch(feePayments),
    [feePayments, selectedBranch, selectedAcademicYear],
  );
  const filteredFeeHeads = useMemo(
    () => filterByBranch(deduplicateFeeHeads(feeHeads)),
    [feeHeads, selectedBranch, selectedAcademicYear],
  );
  const filteredDynamicFeeStructures = useMemo(
    () => filterByBranch(dynamicFeeStructures),
    [dynamicFeeStructures, selectedBranch, selectedAcademicYear],
  );
  const filteredStudentFeeAssignments = useMemo(
    () => filterByBranch(studentFeeAssignments),
    [studentFeeAssignments, selectedBranch, selectedAcademicYear],
  );
  const filteredERPTransportRoutes = useMemo(
    () => filterByBranch(erpTransportRoutes),
    [erpTransportRoutes, selectedBranch, selectedAcademicYear],
  );
  const filteredStudentTransports = useMemo(
    () => filterByBranch(studentTransports),
    [studentTransports, selectedBranch, selectedAcademicYear],
  );
  const filteredHostelMasters = useMemo(
    () => filterByBranch(hostelMasters),
    [hostelMasters, selectedBranch, selectedAcademicYear],
  );
  const filteredStudentHostels = useMemo(
    () => filterByBranch(studentHostels),
    [studentHostels, selectedBranch, selectedAcademicYear],
  );
  const filteredRefunds = useMemo(
    () => filterByBranch(refunds),
    [refunds, selectedBranch, selectedAcademicYear],
  );
  const filteredRouteMasters = useMemo(
    () => filterByBranch(routeMasters),
    [routeMasters, selectedBranch, selectedAcademicYear],
  );
  const filteredPickupPoints = useMemo(
    () => filterByBranch(pickupPoints),
    [pickupPoints, selectedBranch, selectedAcademicYear],
  );
  const filteredVehicleMasters = useMemo(
    () => filterByBranch(vehicleMasters),
    [vehicleMasters, selectedBranch, selectedAcademicYear],
  );
  const filteredDriverMasters = useMemo(
    () => filterByBranch(driverMasters),
    [driverMasters, selectedBranch, selectedAcademicYear],
  );
  const filteredBusAttendants = useMemo(
    () => filterByBranch(busAttendants),
    [busAttendants, selectedBranch, selectedAcademicYear],
  );
  const filteredVehicleAssignments = useMemo(
    () => filterByBranch(vehicleAssignments),
    [vehicleAssignments, selectedBranch, selectedAcademicYear],
  );
  const filteredVehicleMaintenances = useMemo(
    () => filterByBranch(vehicleMaintenances),
    [vehicleMaintenances, selectedBranch, selectedAcademicYear],
  );
  const filteredUniformCategories = useMemo(
    () =>
      filterByBranch(uniformCategories).filter((c) => {
        const name = (c?.name || (c as any)?.categoryName || "")
          .toLowerCase()
          .trim();
        return (
          (name !== "uniform package" && name !== "package") ||
          name.includes("boys") ||
          name.includes("girls")
        );
      }),
    [uniformCategories, selectedBranch, selectedAcademicYear],
  );
  const filteredUniforms = useMemo(
    () =>
      filterByBranch(uniforms).filter((u) => {
        if (!u) return false;
        const name = (u.name || u.category || "").toLowerCase().trim();
        return (
          (name !== "uniform package" && name !== "package") ||
          name.includes("boys") ||
          name.includes("girls")
        );
      }),
    [uniforms, selectedBranch, selectedAcademicYear],
  );
  const filteredUniformSizes = useMemo(
    () => filterByBranch(uniformSizes),
    [uniformSizes, selectedBranch, selectedAcademicYear],
  );
  const filteredUniformSuppliers = useMemo(
    () => filterByBranch(uniformSuppliers),
    [uniformSuppliers, selectedBranch, selectedAcademicYear],
  );
  const filteredUniformInventory = useMemo(
    () =>
      filterByBranch(uniformInventory).filter((inv) => {
        if (!inv) return false;
        const name = (inv.itemName || inv.category || "").toLowerCase().trim();
        return (
          (name !== "uniform package" && name !== "package") ||
          name.includes("boys") ||
          name.includes("girls")
        );
      }),
    [uniformInventory, selectedBranch, selectedAcademicYear],
  );
  const filteredStudentUniformIssues = useMemo(
    () =>
      filterByBranch(studentUniformIssues).filter((i) => {
        const name = (i?.studentName || "").toLowerCase();
        const adm = (i?.admissionNo || i?.studentId || "").toUpperCase();
        const isDummy =
          name.includes("fahim") ||
          name.includes("mahesh") ||
          name.includes("alexander") ||
          name.includes("wright") ||
          name.includes("rahul") ||
          name.includes("kiriti") ||
          name.includes("kiran") ||
          (name.includes("vishnu") && name.includes("n")) ||
          adm === "REG-1022" ||
          adm === "REG-1021";
        return !isDummy;
      }),
    [studentUniformIssues, selectedBranch, selectedAcademicYear],
  );
  const filteredFinanceUniformConfigs = useMemo(
    () => filterByBranch(financeUniformConfigs),
    [financeUniformConfigs, selectedBranch, selectedAcademicYear],
  );
  const filteredLeaveApplications = useMemo(
    () => filterByBranch(leaveApplications),
    [leaveApplications, selectedBranch, selectedAcademicYear],
  );
  const filteredHolidays = useMemo(() => {
    return (holidays || []).filter((h) => {
      if (!h) return false;
      const b = (h.branch || "").toLowerCase().trim();
      const typeStr = (h.type || "").toLowerCase().trim();
      const isGlobal =
        !b ||
        b === "all" ||
        b === "all branches" ||
        b === "global" ||
        ["national", "festival", "gazetted", "vacation"].includes(typeStr);
      if (isGlobal) return true;
      if (
        !selectedBranch ||
        selectedBranch === "All" ||
        selectedBranch === "All Branches"
      )
        return true;
      const selB = selectedBranch.toLowerCase().trim();
      return b.includes(selB) || selB.includes(b);
    });
  }, [holidays, selectedBranch, selectedAcademicYear]);
  const filteredPayslips = useMemo(
    () => filterByBranch(payslips),
    [payslips, selectedBranch, selectedAcademicYear],
  );
  const filteredPayrollConfigurations = useMemo(
    () => filterByBranch(payrollConfigurations),
    [payrollConfigurations, selectedBranch, selectedAcademicYear],
  );
  const filteredPayrollComponents = useMemo(
    () => filterByBranch(payrollComponents),
    [payrollComponents, selectedBranch, selectedAcademicYear],
  );
  const filteredSalaryStructures = useMemo(
    () => filterByBranch(salaryStructures),
    [salaryStructures, selectedBranch, selectedAcademicYear],
  );
  const filteredEmployeeSalaryAssignments = useMemo(
    () => filterByBranch(employeeSalaryAssignments),
    [employeeSalaryAssignments, selectedBranch, selectedAcademicYear],
  );
  const filteredPayrollRuns = useMemo(
    () => filterByBranch(payrollRuns),
    [payrollRuns, selectedBranch, selectedAcademicYear],
  );
  const filteredAlumniRecords = useMemo(
    () => filterByBranch(alumniRecords),
    [alumniRecords, selectedBranch, selectedAcademicYear],
  );
  const filteredAnnouncements = useMemo(
    () => filterByBranch(announcements),
    [announcements, selectedBranch, selectedAcademicYear],
  );
  const filteredMeetings = useMemo(
    () => filterByBranch(meetings),
    [meetings, selectedBranch, selectedAcademicYear],
  );

  const filteredAttendance = useMemo(() => {
    const ayRange = selectedAcademicYear
      ? parseAcademicYearRange(selectedAcademicYear, academicYears)
      : null;

    return attendance.filter((a) => {
      // 1. Filter by Academic Year date range
      if (ayRange && a.date) {
        const rDate = String(a.date).split("T")[0].split(" ")[0];
        if (rDate && (rDate < ayRange.startDate || rDate > ayRange.endDate)) {
          return false;
        }
      }

      // 2. Filter by Campus Branch
      if (
        selectedBranch &&
        selectedBranch !== "All" &&
        selectedBranch !== "All Branches" &&
        selectedBranch !== "All Campuses"
      ) {
        if (a.entityType === "Student") {
          const stud = students.find((s) => s.id === a.entityId);
          return stud ? stud.branch === selectedBranch : true;
        } else {
          const st = staff.find((s) => s.id === a.entityId);
          return st && st.branch ? st.branch === selectedBranch : true;
        }
      }

      return true;
    });
  }, [
    attendance,
    students,
    staff,
    selectedBranch,
    selectedAcademicYear,
    academicYears,
  ]);

  const filteredBookIssues = useMemo(
    () =>
      bookIssues.filter((bi) => {
        if (!selectedBranch) return true;
        if (bi.borrowerRole === "Student") {
          const stud = students.find((s) => s.id === bi.borrowerId);
          return stud ? stud.branch === selectedBranch : true;
        } else {
          const st = staff.find((s) => s.id === bi.borrowerId);
          return st ? st.branch === selectedBranch : true;
        }
      }),
    [bookIssues, students, staff, selectedBranch],
  );

  const updateCertificateTemplate = (
    id: string,
    updates: Partial<CertificateTemplateConfig>,
  ) => {
    setCertificateTemplates((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(
        "edu_db_certificate_templates",
        JSON.stringify(next),
      );
      return next;
    });
  };

  const issueTransferCertificate = (tc: TcRecord) => {
    setTcRegister((prev) => {
      const next = [tc, ...prev.filter((r) => r.studentId !== tc.studentId)];
      localStorage.setItem("edu_db_tc_register", JSON.stringify(next));
      return next;
    });
  };

  const reissueTransferCertificate = (
    tcNo: string,
    reissueDetails: { reason: string; authorizedBy: string; remarks?: string },
  ) => {
    setTcRegister((prev) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const next = prev.map((r) => {
        if (r.tcNo === tcNo || r.id === tcNo) {
          const currentCount = r.auditLog?.reissueCount || 0;
          const newHistory = [
            ...(r.reissueHistory || []),
            {
              reissueNo: `TC-RE-${r.tcNo}-${currentCount + 1}`,
              reissueDate: todayStr,
              reason: reissueDetails.reason,
              authorizedBy: reissueDetails.authorizedBy,
              remarks: reissueDetails.remarks,
            },
          ];
          return {
            ...r,
            status: "Reissued" as const,
            reissueHistory: newHistory,
            auditLog: {
              ...r.auditLog,
              reissueCount: currentCount + 1,
              lastPrintedDate: todayStr,
            },
          };
        }
        return r;
      });
      localStorage.setItem("edu_db_tc_register", JSON.stringify(next));
      return next;
    });
  };

  const loadTimetableForClassSection = async (
    classId: string,
    sectionName: string,
    academicYear: string,
  ) => {
    try {
      const res: any = await fetchTimetableForClassSectionApi(
        classId,
        sectionName,
        academicYear,
      );
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setTimetable((prev) => {
          const cls = academicClasses.find(
            (c) =>
              c.id === classId ||
              c.id === `CL-${classId}` ||
              c.name.toLowerCase().trim() === classId.toLowerCase().trim(),
          );
          const targetClassName = cls?.name || classId;

          const mappedSlots: TimetableSlot[] = res.data.map((item: any) => {
            const timeSlotStr =
              item.timeSlot ||
              (item.startTime && item.endTime
                ? `${item.startTime} - ${item.endTime}`
                : "");
            return {
              id:
                item.slotId?.toString() ||
                item.id?.toString() ||
                `SLOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              className: item.className || targetClassName,
              section: item.section || item.sectionName || sectionName,
              day: item.day || item.dayOfWeek || "Monday",
              timeSlot: timeSlotStr,
              startTime: item.startTime,
              endTime: item.endTime,
              periodNumber: item.periodNumber || item.periodId || 1,
              subject: item.subject || item.subjectName || "",
              subjectId: item.subjectId?.toString(),
              teacherName: item.teacherName || "",
              teacherId: item.teacherId?.toString(),
              roomNo: item.roomNo || "",
              academicYear: item.academicYear || academicYear,
              status: item.status || "Draft",
            };
          });

          const norm = (str?: string) =>
            (str || "")
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/class/gi, "")
              .replace(/section/gi, "");

          const filtered = (prev || []).filter(
            (t) =>
              !(
                norm(t.className) === norm(targetClassName) &&
                norm(t.section) === norm(sectionName)
              ),
          );
          const updated = [...filtered, ...mappedSlots];
          try {
            localStorage.setItem("edu_db_timetable", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (err) {
      console.warn("Failed to load timetable for class section", err);
    }
  };

  const addAcademicHistoryRecord = (
    studentId: string,
    record: AcademicHistoryRecord,
  ) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id === studentId || s.admissionNo === record.admissionNo) {
          const existingHistory = s.academicHistory || [];
          const filteredHistory = existingHistory.filter(
            (h) => h.academicYear !== record.academicYear,
          );
          const updatedHistory = [...filteredHistory, record].sort((a, b) =>
            a.academicYear.localeCompare(b.academicYear),
          );
          return {
            ...s,
            academicHistory: updatedHistory,
          };
        }
        return s;
      });
      return next;
    });
  };

  const discontinueStudent = (
    studentId: string,
    details: DiscontinuationDetails,
  ) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id === studentId || s.admissionNo === studentId) {
          return {
            ...s,
            status: "Discontinued" as StudentStatus,
            discontinuationDetails: details,
            remarks: details.remarks || s.remarks,
          };
        }
        return s;
      });
      return next;
    });
    logActivity(
      "Student Discontinued",
      `Marked student ${studentId} as Discontinued for ${details.discontinuationAcademicYear}`,
    );
  };

  const transferOutStudent = (studentId: string, details: TransferDetails) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id === studentId || s.admissionNo === studentId) {
          return {
            ...s,
            status: "Transferred Out" as StudentStatus,
            transferDetails: details,
            remarks: details.remarks || s.remarks,
          };
        }
        return s;
      });
      return next;
    });
    logActivity(
      "Student Transferred Out",
      `Marked student ${studentId} as Transferred Out`,
    );
  };

  const branchTransferStudent = (
    studentId: string,
    details: BranchTransferDetails,
  ) => {
    setStudents((prev) => {
      const next = prev.map((s) => {
        if (s.id === studentId || s.admissionNo === studentId) {
          return {
            ...s,
            status: "Branch Transfer" as StudentStatus,
            branch: details.toBranch,
            branchTransferDetails: details,
            remarks: details.remarks || s.remarks,
          };
        }
        return s;
      });
      return next;
    });
    logActivity(
      "Branch Transfer",
      `Transferred student ${studentId} from ${details.fromBranch} to ${details.toBranch}`,
    );
  };

  const importHistoricalAcademicData = (records: any[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    records.forEach((row, idx) => {
      const rowNum = idx + 2;
      const admNo = String(
        row.admissionNo || row.AdmissionNo || row.admission_no || "",
      ).trim();
      const ay = String(
        row.academicYear || row.AcademicYear || row.academic_year || "",
      ).trim();
      const clsName = String(
        row.className || row.Class || row.class || "",
      ).trim();
      const sec = String(row.section || row.Section || "").trim() || "A";
      const roll =
        String(row.rollNo || row.RollNo || row.roll_no || "").trim() || "101";
      const statusRaw = String(
        row.status || row.Status || row.promotionStatus || "Promoted",
      ).trim();

      if (!admNo) {
        errorCount++;
        errors.push(`Row ${rowNum}: Admission No is required.`);
        return;
      }
      if (!ay) {
        errorCount++;
        errors.push(`Row ${rowNum} (${admNo}): Academic Year is required.`);
        return;
      }
      if (!clsName) {
        errorCount++;
        errors.push(`Row ${rowNum} (${admNo}): Class is required.`);
        return;
      }

      const targetStudent = students.find(
        (s) =>
          (s.admissionNo != null &&
            String(s.admissionNo).toLowerCase() === admNo.toLowerCase()) ||
          (s.id != null && String(s.id).toLowerCase() === admNo.toLowerCase()),
      );

      if (!targetStudent) {
        errorCount++;
        errors.push(
          `Row ${rowNum}: Student with Admission No '${admNo}' not found.`,
        );
        return;
      }

      const validStatuses: AcademicYearStatus[] = [
        "Promoted",
        "Retained",
        "Discontinued",
        "Branch Transfer",
        "Transferred Out",
        "Graduated",
        "Active",
      ];
      const status: AcademicYearStatus = validStatuses.includes(
        statusRaw as any,
      )
        ? (statusRaw as AcademicYearStatus)
        : "Promoted";

      const historyRecord: AcademicHistoryRecord = {
        id: `ACH-${targetStudent.id}-${ay}`,
        studentId: targetStudent.id,
        admissionNo: targetStudent.admissionNo,
        academicYear: ay,
        className: clsName.startsWith("Class") ? clsName : `Class ${clsName}`,
        section: sec,
        rollNo: roll,
        branch: targetStudent.branch || selectedBranch || "",
        status: status,
        promotionStatus: statusRaw,
        remarks: row.remarks || row.Remarks || "Imported historical data",
        createdAt: new Date().toISOString().split("T")[0],
      };

      addAcademicHistoryRecord(targetStudent.id, historyRecord);
      successCount++;
    });

    return { successCount, errorCount, errors };
  };

  const importHistoricalAttendanceData = (records: any[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    setAttendance((prev) => {
      let next = [...prev];
      records.forEach((row, idx) => {
        const rowNum = idx + 2;
        const admNo = String(
          row.admissionNo || row.AdmissionNo || row.admission_no || "",
        ).trim();
        const ay = String(
          row.academicYear || row.AcademicYear || row.academic_year || "",
        ).trim();
        const workingDays = parseInt(
          row.workingDays || row.WorkingDays || "200",
          10,
        );
        const presentDays = parseInt(
          row.presentDays || row.PresentDays || "180",
          10,
        );

        const targetStudent = students.find(
          (s) =>
            (s.admissionNo != null &&
              String(s.admissionNo).toLowerCase() === admNo.toLowerCase()) ||
            (s.id != null &&
              String(s.id).toLowerCase() === admNo.toLowerCase()),
        );
        if (!targetStudent) {
          errorCount++;
          errors.push(`Row ${rowNum}: Admission No '${admNo}' not found.`);
          return;
        }

        const newAtt: DailyAttendance = {
          id: `ATT-IMP-${targetStudent.id}-${ay}`,
          date: `${ay.slice(0, 4)}-06-01`,
          entityType: "Student",
          entityId: targetStudent.id,
          status: "Present",
          remarks: `Summary Attendance ${ay}: ${presentDays}/${workingDays} Days (${Math.round((presentDays / (workingDays || 1)) * 100)}%)`,
        };

        next = [newAtt, ...next.filter((a) => a.id !== newAtt.id)];
        successCount++;
      });
      return next;
    });

    logActivity(
      "Attendance History Import",
      `Imported ${successCount} attendance records`,
    );
    return { successCount, errorCount, errors };
  };

  const importHistoricalExamData = (records: any[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    setExamMarks((prev) => {
      let next = [...prev];
      records.forEach((row, idx) => {
        const rowNum = idx + 2;
        const admNo = String(
          row.admissionNo || row.AdmissionNo || row.admission_no || "",
        ).trim();
        const ay = String(
          row.academicYear || row.AcademicYear || row.academic_year || "",
        ).trim();
        const examName = String(
          row.exam || row.Exam || "Annual Examination",
        ).trim();
        const subject = String(row.subject || row.Subject || "General").trim();
        const maxMarks = parseFloat(row.maxMarks || row.MaxMarks || "100");
        const marksObtained = parseFloat(
          row.marksObtained || row.MarksObtained || "85",
        );
        const grade = String(row.grade || row.Grade || "A").trim();

        const targetStudent = students.find(
          (s) =>
            (s.admissionNo != null &&
              String(s.admissionNo).toLowerCase() === admNo.toLowerCase()) ||
            (s.id != null &&
              String(s.id).toLowerCase() === admNo.toLowerCase()),
        );
        if (!targetStudent) {
          errorCount++;
          errors.push(`Row ${rowNum}: Admission No '${admNo}' not found.`);
          return;
        }

        const newMark: ExamMark = {
          id: `EXM-IMP-${targetStudent.id}-${ay}-${subject.replace(/\s+/g, "_")}`,
          examId: `EXAM-${ay}-${examName.replace(/\s+/g, "_")}`,
          studentId: targetStudent.id,
          subject,
          marksObtained,
          totalMarks: maxMarks,
          grade,
          remarks: `Imported exam result for ${ay}`,
        };

        next = [newMark, ...next.filter((m) => m.id !== newMark.id)];
        successCount++;
      });
      localStorage.setItem("edu_db_exam_marks", JSON.stringify(next));
      return next;
    });

    logActivity(
      "Examination History Import",
      `Imported ${successCount} exam result records`,
    );
    return { successCount, errorCount, errors };
  };

  const importHistoricalFeeData = (records: any[]) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    setStudentFeeAssignments((prev) => {
      let next = [...prev];
      records.forEach((row, idx) => {
        const rowNum = idx + 2;
        const admNo = String(
          row.admissionNo || row.AdmissionNo || row.admission_no || "",
        ).trim();
        const ay = String(
          row.academicYear || row.AcademicYear || row.academic_year || "",
        ).trim();
        const totalPayable = parseFloat(
          row.totalPayable || row.TotalPayable || "0",
        );

        const targetStudent = students.find(
          (s) =>
            (s.admissionNo != null &&
              String(s.admissionNo).toLowerCase() === admNo.toLowerCase()) ||
            (s.id != null &&
              String(s.id).toLowerCase() === admNo.toLowerCase()),
        );
        if (!targetStudent) {
          errorCount++;
          errors.push(`Row ${rowNum}: Admission No '${admNo}' not found.`);
          return;
        }

        const newAssign: StudentFeeAssignment = {
          id: `FEE-IMP-${targetStudent.id}-${ay}`,
          studentId: targetStudent.id,
          academicYear: ay,
          finalAmount: totalPayable,
          netPayable: totalPayable,
          status: "Assigned",
          createdAt: new Date().toISOString().split("T")[0],
        } as any;

        next = [newAssign, ...next.filter((a) => a.id !== newAssign.id)];
        successCount++;
      });
      localStorage.setItem(
        "edu_db_student_fee_assignments",
        JSON.stringify(next),
      );
      return next;
    });

    logActivity(
      "Fee Ledger History Import",
      `Imported ${successCount} fee ledger records`,
    );
    return { successCount, errorCount, errors };
  };

  return (
    <DataContext.Provider
      value={{
        rawClasses,
        getStudentFeeOutstandingSummary,
        loadTimetableForClassSection,
        certificateTemplates,
        updateCertificateTemplate,
        tcRegister,
        issueTransferCertificate,
        reissueTransferCertificate,
        addAcademicHistoryRecord,
        discontinueStudent,
        transferOutStudent,
        branchTransferStudent,
        importHistoricalAcademicData,
        importHistoricalAttendanceData,
        importHistoricalExamData,
        importHistoricalFeeData,
        schoolProfile,
        updateSchoolProfile,
        academicYears,
        branches,
        fetchBranches,
        addAcademicYear,
        updateAcademicYear,
        deleteAcademicYear,
        setCurrentAcademicYear,
        students: filteredStudents,
        totalStudentCount,
        addStudent,
        updateStudent,
        deleteStudent,
        promoteStudent,
        transferStudent,
        completeStudent,
        getHighestClass,
        alumniRecords: filteredAlumniRecords,
        addAlumniRecord,
        updateAlumniStatus,
        staff: filteredStaff,
        addStaff,
        updateStaff,
        deleteStaff,
        addStaffDocument,
        deleteStaffDocument,
        updateBankDetails,
        admissions: filteredAdmissions,
        addAdmission,
        updateAdmission,
        deleteAdmission,
        updateAdmissionStatus,
        fetchAdmissions,
        fetchStudents,
        fetchStaff,
        fetchAcademicClasses,
        fetchSubjects,
        fetchPeriods,
        fetchTimetables,
        fetchDepartments,
        fetchDesignations,
        fetchBooks,
        fetchBookIssues,
        fetchHomeworkData,
        fetchStudentAttendanceData,
        saveBulkStudentAttendance,
        fetchInventoryData,
        fetchUniformData,
        fetchFinanceData,
        fetchFacultyTrainingData,
        fetchLeaveTypes,
        fetchLeaveApplications,
        fetchLeaveBalances,
        fetchSalaryStructures,
        fetchSalaryAssignments,
        academicClasses: filteredClasses,
        addAcademicClass,
        updateAcademicClass,
        deleteAcademicClass,
        subjects: filteredSubjects,
        addSubject,
        updateSubject,
        deleteSubject,
        buses,
        addBus,
        updateBus,
        deleteBus,
        hostelBlocks,
        addHostelBlock,
        updateHostelBlock,
        deleteHostelBlock,
        hostelBeds,
        addHostelBed,
        updateHostelBed,
        deleteHostelBed,
        uniforms: filteredUniforms,
        addUniform,
        updateUniform,
        deleteUniform,
        customRoles,
        addCustomRole,
        updateCustomRole,
        deleteCustomRole,
        feeStructures: filteredFeeStructures,
        addFeeStructure,
        updateFeeStructure,
        deleteFeeStructure,
        feePayments: filteredFeePayments,
        addFeePayment,
        feeHeads: filteredFeeHeads,
        addFeeHead,
        updateFeeHead,
        deleteFeeHead,
        toggleFeeHeadStatus,
        dynamicFeeStructures: filteredDynamicFeeStructures,
        allDynamicFeeStructures: dynamicFeeStructures,
        addDynamicFeeStructure,
        updateDynamicFeeStructure,
        deleteDynamicFeeStructure,
        studentFeeAssignments: filteredStudentFeeAssignments,
        assignFeeStructure,
        assignCustomFeeStructure,
        bulkAssignFeeStructure,
        updateStudentFeeAssignment,
        removeStudentFeeAssignment,
        scholarships,
        addScholarship,
        updateScholarship,
        deleteScholarship,
        studentScholarships,
        assignScholarshipToStudent,
        revokeStudentScholarship,
        discounts,
        addDiscount,
        updateDiscount,
        deleteDiscount,
        studentDiscounts,
        assignDiscountToStudent,
        removeStudentDiscount,
        fineRules,
        addFineRule,
        updateFineRule,
        deleteFineRule,
        erpTransportRoutes: filteredERPTransportRoutes,
        addERPTransportRoute,
        updateERPTransportRoute,
        deleteERPTransportRoute,
        studentTransports: filteredStudentTransports,
        assignStudentTransport,
        removeStudentTransport,
        hostelMasters: filteredHostelMasters,
        addHostelMaster,
        updateHostelMaster,
        deleteHostelMaster,
        roomTypeMasters,
        addRoomTypeMaster,
        updateRoomTypeMaster,
        deleteRoomTypeMaster,
        roomMasters,
        addRoomMaster,
        updateRoomMaster,
        deleteRoomMaster,
        studentHostelAssignments,
        assignStudentHostelRoom,
        updateStudentHostelAssignment,
        deleteStudentHostelAssignment,
        hostelVisitorLogs,
        addHostelVisitorLog,
        updateHostelVisitorLogStatus,
        hostelAttendanceLogs,
        recordHostelAttendance,
        financeHostelConfigs,
        addFinanceHostelConfig,
        updateFinanceHostelConfig,
        deleteFinanceHostelConfig,
        studentHostels: filteredStudentHostels,
        assignStudentHostel,
        removeStudentHostel,
        refunds: filteredRefunds,
        addRefund,
        updateRefundStatus,
        financeSettings,
        updateFinanceSettings,
        financeTransportConfigs,
        addFinanceTransportConfig,
        updateFinanceTransportConfig,
        deleteFinanceTransportConfig,
        studentFeeLedgers,
        academicYearFeeSchedules,
        setAcademicYearFeeSchedules,
        studentFeeInstallments,
        setStudentFeeInstallments,
        getStudentInstallmentSummary,
        generateInstallmentsForStudent,
        generateStudentFeeLedger,
        recalculateStudentFeeLedger,
        getStudentFeeLedger,
        getDynamicTransportFee,
        getPromotedStudentsWithPreviousDues,
        calculateStudentPayableFee,
        applyScholarshipToStudent,
        removeScholarshipFromStudent,
        applyDiscountToStudent,
        removeDiscountFromStudent,
        routeMasters: filteredRouteMasters,
        addRouteMaster,
        updateRouteMaster,
        deleteRouteMaster,
        pickupPoints: filteredPickupPoints,
        addPickupPoint,
        updatePickupPoint,
        deletePickupPoint,
        vehicleMasters: filteredVehicleMasters,
        addVehicleMaster,
        updateVehicleMaster,
        deleteVehicleMaster,
        driverMasters: filteredDriverMasters,
        addDriverMaster,
        updateDriverMaster,
        deleteDriverMaster,
        busAttendants: filteredBusAttendants,
        addBusAttendant,
        updateBusAttendant,
        deleteBusAttendant,
        vehicleAssignments: filteredVehicleAssignments,
        assignVehicleRouteDriver,
        updateVehicleAssignment,
        removeVehicleAssignment,
        vehicleMaintenances: filteredVehicleMaintenances,
        addVehicleMaintenance,
        updateVehicleMaintenance,
        deleteVehicleMaintenance,
        checkVehicleCapacity,
        attendance: filteredAttendance,
        markAttendance,
        fetchDailyAttendance,
        fetchMonthlyAttendance,
        lastAttendancePayload,
        lastAttendanceResponse,
        todayStudentAttendanceSummary,
        fetchTodayStudentAttendanceSummary,
        exams: filteredExams,
        examMarks,
        addExam,
        updateExam,
        deleteExam,
        saveMarks,
        examSchedules,
        addExamSchedule,
        updateExamSchedule,
        deleteExamSchedule,
        questionPapers,
        addQuestionPaper,
        updateQuestionPaper,
        deleteQuestionPaper,
        meetings: filteredMeetings,
        addMeeting,
        updateMeeting,
        cancelMeeting,
        deleteMeeting,
        departments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        designations,
        addDesignation,
        updateDesignation,
        deleteDesignation,
        gradeConfigurations,
        saveGradeConfiguration,
        fetchGradingScaleRules,
        processedResults,
        saveProcessedResults,
        updateResultStatus,
        applyGraceOrRevaluation,
        refreshReleasedExamResults: loadReleasedExamResultsFromDb,
        studentAttendance,
        saveStudentAttendance,
        coScholasticAssessments,
        saveCoScholasticAssessment,
        timetable: filteredTimetable,
        addTimetableSlot,
        bulkAddTimetableSlots,
        updateTimetableSlot,
        deleteTimetableSlot,
        clearClassTimetable,
        publishClassTimetable,
        periodSettings,
        addPeriodSetting,
        bulkAddPeriodSettings,
        updatePeriodSetting,
        deletePeriodSetting,
        bulkAssignPeriods,
        resetClassPeriods,
        teacherAssignments,
        addTeacherAssignment,
        updateTeacherAssignment,
        deleteTeacherAssignment,
        homework: filteredHomework,
        addHomework,
        updateHomework,
        deleteHomework,
        books,
        bookIssues: filteredBookIssues,
        addBook,
        deleteBook,
        issueBook,
        returnBook,
        transportRoutes,
        addTransportRoute,
        hostelRooms,
        inventory,
        addInventoryItem,
        announcements: filteredAnnouncements,
        addAnnouncement,
        saveAnnouncements: setAnnouncements,
        fetchAnnouncements: fetchAnnouncementsData,
        holidays: filteredHolidays,
        birthdays,
        auditLogs,
        logActivity,

        // UNIFORM ERP MAPPINGS
        uniformCategories: filteredUniformCategories,
        addUniformCategory,
        updateUniformCategory,
        deleteUniformCategory,
        uniformSizes: filteredUniformSizes,
        addUniformSize,
        updateUniformSize,
        deleteUniformSize,
        uniformSuppliers: filteredUniformSuppliers,
        addUniformSupplier,
        updateUniformSupplier,
        deleteUniformSupplier,
        uniformInventory: filteredUniformInventory,
        addUniformInventory,
        updateUniformInventory,
        deleteUniformInventory,
        studentUniformIssues: filteredStudentUniformIssues,
        setStudentUniformIssues,
        addStudentUniformIssue,
        updateStudentUniformIssue,
        deleteStudentUniformIssue,
        financeUniformConfigs,
        addFinanceUniformConfig,
        updateFinanceUniformConfig,
        deleteFinanceUniformConfig,

        // LEAVE MANAGEMENT ERP MAPPINGS
        leaveTypes,
        addLeaveType,
        updateLeaveType,
        deleteLeaveType,
        leaveApplications: filteredLeaveApplications,
        addLeaveApplication,
        updateLeaveApplication,
        deleteLeaveApplication,
        updateLeaveApplicationStatus,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        payslips: filteredPayslips,
        disburseSalary,
        fetchPayslips,
        payrollConfigurations: filteredPayrollConfigurations,
        addPayrollConfiguration,
        updatePayrollConfiguration,
        deletePayrollConfiguration,
        activatePayrollConfiguration,
        deactivatePayrollConfiguration,
        payrollComponents: filteredPayrollComponents,
        addPayrollComponent,
        updatePayrollComponent,
        deletePayrollComponent,
        salaryStructures: filteredSalaryStructures,
        addSalaryStructure,
        updateSalaryStructure,
        deleteSalaryStructure,
        cloneSalaryStructure,
        loadSalaryStructures,
        loadMonthlyStaffAttendance,
        employeeSalaryAssignments: filteredEmployeeSalaryAssignments,
        assignEmployeeSalaryStructure,
        updateEmployeeSalaryAssignment,
        deleteEmployeeSalaryAssignment,
        payrollRuns: filteredPayrollRuns,
        upsertPayrollRun,
        updatePayrollRun,
        deletePayrollRun,
        documentRequirementRules,
        getRequiredDocuments,
        addDocumentRequirementRule,
        updateDocumentRequirementRule,
        deleteDocumentRequirementRule,
        verifyStaffDocument,
        replaceStaffDocument,

        // MASTER FINANCE LEDGER MAPPINGS
        financeTransactions,
        addFinanceTransaction,
        reverseFinanceTransaction,
        cancelFinanceTransaction,
        financialAccounts,
        addFinancialAccount,
        updateFinancialAccount,
        deleteFinancialAccount,
        financialCategories,
        addFinancialCategory,
        updateFinancialCategory,
        deleteFinancialCategory,
        financialBudgets,
        addFinancialBudget,
        updateFinancialBudget,
        deleteFinancialBudget,

        // ACADEMIC CALENDAR & SCHOOL EVENTS MAPPINGS
        schoolEvents,
        addSchoolEvent,
        updateSchoolEvent,
        deleteSchoolEvent,

        // TRAINING & ASSESSMENTS MAPPINGS
        workshops,
        addWorkshop,
        updateWorkshop,
        deleteWorkshop,
        markWorkshopAttendance,
        submitWorkshopFeedback,
        employeeAssessments,
        addAssessment,
        updateAssessment,
        deleteAssessment,
        saveAssessmentResults,
        issuedCertificates,
        issueCertificate,
        reissueCertificate,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

import { useHostel } from "./HostelContext";
import { useExamination } from "./ExaminationContext";
import { useHR } from "./HRContext";

export const useData = () => {
  const context = useContext(DataContext);
  let hostel: any = {};
  let exam: any = {};
  let hr: any = {};
  try {
    hostel = useHostel();
  } catch {
    /* Ignored when outside HostelProvider */
  }
  try {
    exam = useExamination();
  } catch {
    /* Ignored when outside ExaminationProvider */
  }
  try {
    hr = useHR();
  } catch {
    /* Ignored when outside HRProvider */
  }

  const merged = {
    ...(context || {}),
    ...hostel,
    ...exam,
    ...hr,
  } as unknown as DataContextType;

  if (typeof (merged as any).getHighestClass !== "function") {
    (merged as any).getHighestClass = () => {
      const cls = (merged as any).academicClasses;
      if (Array.isArray(cls) && cls.length > 0) {
        const sorted = [...cls]
          .map((c: any) => ({
            name: c.name,
            num: parseInt(String(c.name).replace(/[^0-9]/g, "")) || 0,
          }))
          .sort((a: any, b: any) => b.num - a.num);
        if (sorted[0] && sorted[0].num >= 10) {
          return sorted[0].name;
        }
      }
      return "Class 12";
    };
  }

  return merged;
};
