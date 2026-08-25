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
import {
  getUniformPackageFeeByClass,
  getUniformFeeForClass,
  getItemFeeFromFinanceConfig,
} from "../utils/uniformUtils";
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
import {
  initialCertificateTemplates,
  initialStudents,
  initialStaff,
  initialAdmissions,
  initialFeeStructures,
  initialFeePayments,
  initialExamSetups,
  initialExamMarks,
  initialTimetable,
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
  BusAttendantMaster,
  initialBusAttendants,
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
  fetchTimetableForClassSectionApi,
  mapSubjectApi,
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
}

const initialClasses: AcademicClass[] = [
  {
    id: "CL-9",
    name: "Class 9",
    sections: ["A", "B"],
    sectionTeachers: { A: "Sarah Jenkins", B: "Jonathan Miller" },
    teacher: "Sarah Jenkins",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "History"],
  },
  {
    id: "CL-10",
    name: "Class 10",
    sections: ["A", "B"],
    sectionTeachers: { A: "Jonathan Miller", B: "Robert Langdon" },
    teacher: "Jonathan Miller",
    subjects: [
      "Mathematics",
      "Physics",
      "Computer Science",
      "English",
      "Biology",
    ],
  },
  {
    id: "CL-11",
    name: "Class 11",
    sections: ["A", "B", "C"],
    sectionTeachers: {
      A: "Robert Langdon",
      B: "Dr. Eleanor Vance",
      C: "Jonathan Miller",
    },
    teacher: "Robert Langdon",
    subjects: [
      "Advanced Calculus",
      "Organic Chemistry",
      "Physics",
      "Economics",
    ],
  },
  {
    id: "CL-12",
    name: "Class 12",
    sections: ["A", "B"],
    sectionTeachers: { A: "Dr. Eleanor Vance", B: "Sarah Jenkins" },
    teacher: "Dr. Eleanor Vance",
    subjects: [
      "Higher Mathematics",
      "Quantum Physics",
      "Literature",
      "Accountancy",
    ],
  },
];

const defaultPeriodSettings: PeriodSetting[] = [
  {
    id: "PS-1",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Period 1",
    startTime: "08:30 AM",
    endTime: "09:15 AM",
    sequence: 1,
    periodType: "Teaching",
    status: "Active",
  },
  {
    id: "PS-2",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Period 2",
    startTime: "09:15 AM",
    endTime: "10:00 AM",
    sequence: 2,
    periodType: "Teaching",
    status: "Active",
  },
  {
    id: "PS-3",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Morning Break",
    startTime: "10:00 AM",
    endTime: "10:15 AM",
    sequence: 3,
    periodType: "Break",
    status: "Active",
  },
  {
    id: "PS-4",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Period 3",
    startTime: "10:15 AM",
    endTime: "11:00 AM",
    sequence: 4,
    periodType: "Teaching",
    status: "Active",
  },
  {
    id: "PS-5",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Period 4",
    startTime: "11:00 AM",
    endTime: "11:45 AM",
    sequence: 5,
    periodType: "Teaching",
    status: "Active",
  },
  {
    id: "PS-6",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Lunch Break",
    startTime: "11:45 AM",
    endTime: "12:30 PM",
    sequence: 6,
    periodType: "Lunch",
    status: "Active",
  },
  {
    id: "PS-7",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Period 5",
    startTime: "12:30 PM",
    endTime: "01:15 PM",
    sequence: 7,
    periodType: "Teaching",
    status: "Active",
  },
  {
    id: "PS-8",
    academicYear: "2026-2027",
    branch: "Main Campus",
    periodName: "Period 6",
    startTime: "01:15 PM",
    endTime: "02:00 PM",
    sequence: 8,
    periodType: "Teaching",
    status: "Active",
  },
];
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
  fetchDepartments: (force?: boolean) => Promise<void>;
  fetchDesignations: (force?: boolean) => Promise<void>;
  fetchBooks: () => Promise<void>;
  fetchBookIssues: () => Promise<void>;
  fetchHomeworkData: () => Promise<void>;
  fetchInventoryData: () => Promise<void>;
  fetchUniformData: () => Promise<void>;
  fetchFinanceData: () => Promise<void>;
  fetchFacultyTrainingData: () => Promise<void>;
  fetchLeaveTypes: () => Promise<void>;
  fetchLeaveApplications: () => Promise<void>;
  fetchLeaveBalances: () => Promise<void>;
  fetchSalaryStructures: () => Promise<void>;
  fetchSalaryAssignments: () => Promise<void>;

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
  addDiscount: (disc: Omit<Discount, "id">) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;

  studentDiscounts: StudentDiscount[];
  assignDiscountToStudent: (studentId: string, discountId: string) => void;
  removeStudentDiscount: (id: string) => void;

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

  financialCategories: FinancialCategory[];
  addFinancialCategory: (category: Omit<FinancialCategory, "id">) => void;
  updateFinancialCategory: (
    id: string,
    updates: Partial<FinancialCategory>,
  ) => void;

  financialBudgets: FinancialBudget[];
  updateFinancialBudget: (id: string, allocatedAmount: number) => void;

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
    targetAcademicYear?: string,
  ) => StudentFeeLedger | null;
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
  saveMarks: (marks: Omit<ExamMark, "id">[]) => void;

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

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, "id">) => void;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (id: string) => void;
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
  addPeriodSetting: (data: Omit<PeriodSetting, "id">) => void;
  updatePeriodSetting: (id: string, updates: Partial<PeriodSetting>) => void;
  deletePeriodSetting: (id: string) => void;
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
  disburseSalary: (payslip: Omit<Payslip, "id">) => void;

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

const defaultGradeConfigurations: GradeConfig[] = [
  {
    id: "GRD-1",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "A+",
    minPercent: 90,
    maxPercent: 100,
    gradePoints: 10,
    passCriteria: "Pass",
  },
  {
    id: "GRD-2",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "A",
    minPercent: 80,
    maxPercent: 89,
    gradePoints: 9,
    passCriteria: "Pass",
  },
  {
    id: "GRD-3",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "B+",
    minPercent: 70,
    maxPercent: 79,
    gradePoints: 8,
    passCriteria: "Pass",
  },
  {
    id: "GRD-4",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "B",
    minPercent: 60,
    maxPercent: 69,
    gradePoints: 7,
    passCriteria: "Pass",
  },
  {
    id: "GRD-5",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "C",
    minPercent: 50,
    maxPercent: 59,
    gradePoints: 6,
    passCriteria: "Pass",
  },
  {
    id: "GRD-6",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "D",
    minPercent: 33,
    maxPercent: 49,
    gradePoints: 4,
    passCriteria: "Pass",
  },
  {
    id: "GRD-7",
    academicYear: "2025-2026",
    branch: "All Branches",
    schemeName: "Default Scholastic",
    gradeName: "F",
    minPercent: 0,
    maxPercent: 32,
    gradePoints: 0,
    passCriteria: "Fail",
  },
];

const defaultExamSchedules: ExamSchedule[] = [
  {
    id: "SCH-1",
    examId: "EXM-01",
    academicYear: "2025-2026",
    branch: "Main Campus",
    date: "2026-09-10",
    startTime: "09:00",
    endTime: "12:00",
    subject: "Mathematics",
    className: "Class 10",
    section: "A",
    maxMarks: 100,
    passMarks: 33,
    room: "Room 101",
    invigilatorId: "STF-002",
    invigilatorName: "Jonathan Miller",
  },
  {
    id: "SCH-2",
    examId: "EXM-01",
    academicYear: "2025-2026",
    branch: "Main Campus",
    date: "2026-09-12",
    startTime: "09:00",
    endTime: "12:00",
    subject: "Physics",
    className: "Class 10",
    section: "A",
    maxMarks: 100,
    passMarks: 33,
    room: "Room 102",
    invigilatorId: "STF-002",
    invigilatorName: "Jonathan Miller",
  },
];

const initialFinanceTransactions: FinanceTransaction[] = [
  {
    id: "TXN-001",
    transactionId: "TXN-2026-891001",
    date: "2026-07-28",
    time: "10:15 AM",
    type: "Income",
    category: "Student Tuition Fees",
    sourceModule: "Student Fee Collection",
    referenceNumber: "REC-2026-1001",
    description: "Term 1 Tuition Fee Collection for Aarav Sharma (Class 10-A)",
    amount: 18500,
    paymentMode: "UPI",
    account: "Main Bank Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Accounts Officer (Venkat)",
    approvedBy: "Chief Accountant",
    auditTrail: [
      {
        id: "AUD-1",
        action: "Created",
        user: "System Auto-Ledger",
        timestamp: "2026-07-28 10:15 AM",
        notes: "Auto-recorded from Fee Payment REC-2026-1001",
      },
    ],
  },
  {
    id: "TXN-002",
    transactionId: "TXN-2026-891002",
    date: "2026-07-28",
    time: "11:00 AM",
    type: "Income",
    category: "Admission Fees",
    sourceModule: "Admissions",
    referenceNumber: "ADM-2026-054",
    description:
      "New Student Admission & Registration Fee for Priya Patel (Class 1-B)",
    amount: 25000,
    paymentMode: "Bank Transfer",
    account: "Main Bank Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Admission Officer",
    approvedBy: "Principal",
    auditTrail: [
      {
        id: "AUD-2",
        action: "Created",
        user: "Admissions Module",
        timestamp: "2026-07-28 11:00 AM",
        notes: "Admission confirmation fee",
      },
    ],
  },
  {
    id: "TXN-003",
    transactionId: "TXN-2026-891003",
    date: "2026-07-27",
    time: "04:30 PM",
    type: "Expense",
    category: "Employee Salaries",
    sourceModule: "Payroll",
    referenceNumber: "PAYROLL-JUL-2026",
    description:
      "Monthly Faculty & Staff Payroll Disbursement (July 2026 Batch)",
    amount: 145000,
    paymentMode: "Bank Transfer",
    account: "Salary Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "HR Manager",
    approvedBy: "Chief Accountant",
    auditTrail: [
      {
        id: "AUD-3",
        action: "Created",
        user: "Payroll Module",
        timestamp: "2026-07-27 04:30 PM",
        notes: "Batch salary payout for 32 employees",
      },
    ],
  },
  {
    id: "TXN-004",
    transactionId: "TXN-2026-891004",
    date: "2026-07-26",
    time: "02:15 PM",
    type: "Income",
    category: "Hostel Fees",
    sourceModule: "Hostel",
    referenceNumber: "HST-REC-088",
    description:
      "Hostel Accommodation & Mess Fee Quarter 2 for Rohan Verma (Boys Block A)",
    amount: 32000,
    paymentMode: "Online",
    account: "Hostel Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Chief Warden",
    approvedBy: "Accounts Officer",
    auditTrail: [
      {
        id: "AUD-4",
        action: "Created",
        user: "Hostel Module",
        timestamp: "2026-07-26 02:15 PM",
        notes: "Hostel booking payment",
      },
    ],
  },
  {
    id: "TXN-005",
    transactionId: "TXN-2026-891005",
    date: "2026-07-25",
    time: "09:45 AM",
    type: "Income",
    category: "Transport Fees",
    sourceModule: "Transport",
    referenceNumber: "TRP-REC-112",
    description: "Bus Route #4 Monthly Pass Fee for Ananya Reddy",
    amount: 4500,
    paymentMode: "Cash",
    account: "Transport Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Transport Manager",
    approvedBy: "Accounts Officer",
    auditTrail: [
      {
        id: "AUD-5",
        action: "Created",
        user: "Transport Module",
        timestamp: "2026-07-25 09:45 AM",
        notes: "Transport pass issued",
      },
    ],
  },
  {
    id: "TXN-006",
    transactionId: "TXN-2026-891006",
    date: "2026-07-24",
    time: "03:20 PM",
    type: "Expense",
    category: "Fuel Expenses",
    sourceModule: "Transport",
    referenceNumber: "TRP-EXP-034",
    description:
      "Diesel Refueling for School Buses KA-01-F-1234 & KA-01-F-5678",
    amount: 18400,
    paymentMode: "Card",
    account: "Transport Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Transport Manager",
    approvedBy: "Chief Accountant",
    auditTrail: [
      {
        id: "AUD-6",
        action: "Created",
        user: "Transport Expense Entry",
        timestamp: "2026-07-24 03:20 PM",
        notes: "Indian Oil petrol bunk receipt #9921",
      },
    ],
  },
  {
    id: "TXN-007",
    transactionId: "TXN-2026-891007",
    date: "2026-07-23",
    time: "11:30 AM",
    type: "Expense",
    category: "Vendor Payments",
    sourceModule: "Inventory",
    referenceNumber: "PO-2026-789",
    description:
      "Purchase of Physics & Chemistry Laboratory Chemicals & Apparatus (Apex Scientific)",
    amount: 42500,
    paymentMode: "Bank Transfer",
    account: "Main Bank Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Store Keeper",
    approvedBy: "Principal",
    auditTrail: [
      {
        id: "AUD-7",
        action: "Created",
        user: "Inventory Module",
        timestamp: "2026-07-23 11:30 AM",
        notes: "Purchase Order #PO-2026-789 settled",
      },
    ],
  },
  {
    id: "TXN-008",
    transactionId: "TXN-2026-891008",
    date: "2026-07-22",
    time: "01:10 PM",
    type: "Income",
    category: "Library Fines",
    sourceModule: "Library",
    referenceNumber: "LIB-FINE-044",
    description: "Overdue Book Return Fine Collection (5 Days Late)",
    amount: 150,
    paymentMode: "Cash",
    account: "Cash",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Librarian",
    auditTrail: [
      {
        id: "AUD-8",
        action: "Created",
        user: "Library Module",
        timestamp: "2026-07-22 01:10 PM",
        notes: "Book issue ID ISS-104 fine",
      },
    ],
  },
  {
    id: "TXN-009",
    transactionId: "TXN-2026-891009",
    date: "2026-07-21",
    time: "10:00 AM",
    type: "Income",
    category: "Donations & Grants",
    sourceModule: "Manual",
    referenceNumber: "DON-2026-004",
    description:
      "Alumni Trust Annual Education Infrastructure Sponsorship & Endowment Fund",
    amount: 100000,
    paymentMode: "Cheque",
    account: "Main Bank Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Principal",
    approvedBy: "School Management Board",
    auditTrail: [
      {
        id: "AUD-9",
        action: "Created",
        user: "Manual Transaction Entry",
        timestamp: "2026-07-21 10:00 AM",
        notes: "Cheque No. 445902 deposited",
      },
    ],
  },
  {
    id: "TXN-010",
    transactionId: "TXN-2026-891010",
    date: "2026-07-20",
    time: "05:00 PM",
    type: "Expense",
    category: "Electricity Bills",
    sourceModule: "Manual",
    referenceNumber: "UTIL-ELEC-JUL26",
    description:
      "Monthly Campus Electricity Tariff Payment (State Power Utility Board)",
    amount: 38700,
    paymentMode: "Bank Transfer",
    account: "Main Bank Account",
    branch: "Main Campus",
    academicYear: "2025-2026",
    status: "Completed",
    createdBy: "Accounts Officer",
    approvedBy: "Principal",
    auditTrail: [
      {
        id: "AUD-10",
        action: "Created",
        user: "Accounts Entry",
        timestamp: "2026-07-20 05:00 PM",
        notes: "Consumer Account #998124501",
      },
    ],
  },
];

const initialFinancialAccounts: FinancialAccount[] = [
  {
    id: "ACC-01",
    accountName: "Cash in Hand",
    accountType: "Cash",
    currentBalance: 48500,
    currency: "INR",
    status: "Active",
  },
  {
    id: "ACC-02",
    accountName: "State Bank of India (Main Account)",
    accountType: "Main Bank Account",
    accountNumber: "30998124501",
    bankName: "State Bank of India",
    branchName: "MG Road Branch",
    currentBalance: 1245000,
    currency: "INR",
    status: "Active",
  },
  {
    id: "ACC-03",
    accountName: "HDFC Salary Disbursement Account",
    accountType: "Salary Account",
    accountNumber: "50100234891",
    bankName: "HDFC Bank",
    branchName: "City Center",
    currentBalance: 450000,
    currency: "INR",
    status: "Active",
  },
  {
    id: "ACC-04",
    accountName: "ICICI Hostel & Operations Account",
    accountType: "Hostel Account",
    accountNumber: "00120500981",
    bankName: "ICICI Bank",
    branchName: "Campus Branch",
    currentBalance: 320000,
    currency: "INR",
    status: "Active",
  },
  {
    id: "ACC-05",
    accountName: "Axis Bank Transport Account",
    accountType: "Transport Account",
    accountNumber: "91802004561",
    bankName: "Axis Bank",
    branchName: "Industrial Suburb",
    currentBalance: 185000,
    currency: "INR",
    status: "Active",
  },
  {
    id: "ACC-06",
    accountName: "Office Petty Cash Vault",
    accountType: "Petty Cash Account",
    currentBalance: 15000,
    currency: "INR",
    status: "Active",
  },
];

const initialFinancialCategories: FinancialCategory[] = [
  {
    id: "CAT-INC-01",
    name: "Student Tuition Fees",
    type: "Income",
    sourceModule: "Student Fee Collection",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-02",
    name: "Admission Fees",
    type: "Income",
    sourceModule: "Admissions",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-03",
    name: "Registration Fees",
    type: "Income",
    sourceModule: "Admissions",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-04",
    name: "Examination Fees",
    type: "Income",
    sourceModule: "Examination",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-05",
    name: "Hostel Fees",
    type: "Income",
    sourceModule: "Hostel",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-06",
    name: "Transport Fees",
    type: "Income",
    sourceModule: "Transport",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-07",
    name: "Library Fines",
    type: "Income",
    sourceModule: "Library",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-08",
    name: "Certificate Fees",
    type: "Income",
    sourceModule: "Student Management",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-09",
    name: "Uniform Sales",
    type: "Income",
    sourceModule: "Uniform",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-INC-10",
    name: "Donations & Grants",
    type: "Income",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
  {
    id: "CAT-INC-11",
    name: "Miscellaneous Income",
    type: "Income",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
  {
    id: "CAT-EXP-01",
    name: "Employee Salaries",
    type: "Expense",
    sourceModule: "Payroll",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-02",
    name: "Vendor Payments",
    type: "Expense",
    sourceModule: "Inventory",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-03",
    name: "Fuel Expenses",
    type: "Expense",
    sourceModule: "Transport",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-04",
    name: "Vehicle Maintenance",
    type: "Expense",
    sourceModule: "Transport",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-05",
    name: "Hostel Expenses",
    type: "Expense",
    sourceModule: "Hostel",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-06",
    name: "Library Purchases",
    type: "Expense",
    sourceModule: "Library",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-07",
    name: "Laboratory Equipment",
    type: "Expense",
    sourceModule: "Inventory",
    status: "Active",
    isSystem: true,
  },
  {
    id: "CAT-EXP-08",
    name: "Electricity Bills",
    type: "Expense",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
  {
    id: "CAT-EXP-09",
    name: "Water & Internet Bills",
    type: "Expense",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
  {
    id: "CAT-EXP-10",
    name: "Building & Furniture Maintenance",
    type: "Expense",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
  {
    id: "CAT-EXP-11",
    name: "Event & Festival Expenses",
    type: "Expense",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
  {
    id: "CAT-EXP-12",
    name: "Petty Cash Expenses",
    type: "Expense",
    sourceModule: "Manual",
    status: "Active",
    isSystem: false,
  },
];

const initialFinancialBudgets: FinancialBudget[] = [
  {
    id: "BDG-01",
    categoryName: "Employee Salaries",
    academicYear: "2025-2026",
    branch: "Main Campus",
    allocatedAmount: 2000000,
    consumedAmount: 145000,
    remainingAmount: 1855000,
    status: "Active",
  },
  {
    id: "BDG-02",
    categoryName: "Fuel Expenses",
    academicYear: "2025-2026",
    branch: "Main Campus",
    allocatedAmount: 250000,
    consumedAmount: 18400,
    remainingAmount: 231600,
    status: "Active",
  },
  {
    id: "BDG-03",
    categoryName: "Laboratory Equipment",
    academicYear: "2025-2026",
    branch: "Main Campus",
    allocatedAmount: 500000,
    consumedAmount: 42500,
    remainingAmount: 457500,
    status: "Active",
  },
  {
    id: "BDG-04",
    categoryName: "Electricity Bills",
    academicYear: "2025-2026",
    branch: "Main Campus",
    allocatedAmount: 400000,
    consumedAmount: 38700,
    remainingAmount: 361300,
    status: "Active",
  },
  {
    id: "BDG-05",
    categoryName: "Event & Festival Expenses",
    academicYear: "2025-2026",
    branch: "Main Campus",
    allocatedAmount: 300000,
    consumedAmount: 0,
    remainingAmount: 300000,
    status: "Active",
  },
];
const initialAlumniRecords: AlumniRecord[] = [
  {
    id: "ALM-101",
    studentId: "STD-1001",
    admissionNo: "ADM-2022-089",
    studentName: "Rohan Deshmukh",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    batch: "Class of 2025",
    completionAcademicYear: "2024-2025",
    finalClass: "Class 12",
    finalSection: "A",
    completionDate: "2025-05-20",
    currentStatus: "Higher Studies",
    higherEducationDetail: "IIT Madras (B.Tech Computer Science)",
    contactPhone: "9876543210",
    contactEmail: "rohan.deshmukh@gmail.com",
    parentName: "Sanjay Deshmukh",
    branch: "Main Campus",
    createdDate: "2025-05-20",
  },
  {
    id: "ALM-102",
    studentId: "STD-1002",
    admissionNo: "ADM-2022-094",
    studentName: "Ananya Verma",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    batch: "Class of 2025",
    completionAcademicYear: "2024-2025",
    finalClass: "Class 12",
    finalSection: "B",
    completionDate: "2025-05-20",
    currentStatus: "Working",
    organizationCompany: "Software Engineer @ Microsoft India",
    contactPhone: "9876543211",
    contactEmail: "ananya.verma@gmail.com",
    parentName: "Vikram Verma",
    branch: "Main Campus",
    createdDate: "2025-05-20",
  },
  {
    id: "ALM-103",
    studentId: "STD-1003",
    admissionNo: "ADM-2021-045",
    studentName: "Karthik Raja",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    batch: "Class of 2024",
    completionAcademicYear: "2023-2024",
    finalClass: "Class 12",
    finalSection: "A",
    completionDate: "2024-05-18",
    currentStatus: "Competitive Exams",
    higherEducationDetail: "UPSC Civil Services Aspirant",
    contactPhone: "9876543212",
    contactEmail: "karthik.raja@gmail.com",
    parentName: "Ramanathan Raja",
    branch: "Main Campus",
    createdDate: "2024-05-18",
  },
];

const initialSchoolEvents: SchoolEvent[] = [
  {
    id: "EVT-001",
    title: "Annual Sports Day & Athletic Meet 2026",
    category: "Sports Day",
    description:
      "Grand Annual Sports Day featuring track & field competitions, march past, relay races, and trophy distribution.",
    organizer: "Physical Education Dept",
    venue: "Main Campus Stadium Ground",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    startTime: "08:30 AM",
    endTime: "04:30 PM",
    branch: "Main Campus",
    academicYear: "2025-2026",
    applicableClasses: [
      "Class 1",
      "Class 2",
      "Class 5",
      "Class 8",
      "Class 10",
      "Class 12",
    ],
    participants: "All Students & Faculty",
    attachments: [
      { id: "ATT-1", name: "Sports_Day_Schedule.pdf", url: "#", type: "PDF" },
      { id: "ATT-2", name: "Track_Events_Rules.pdf", url: "#", type: "PDF" },
    ],
    status: "Published",
    createdBy: "PE Director (Jonathan Miller)",
  },
  {
    id: "EVT-002",
    title: "Inter-House Science & Robotics Exhibition",
    category: "Science Exhibition",
    description:
      "Student project showcases in AI, Renewable Energy, Physics Experiments, and Robotics Prototypes.",
    organizer: "Department of Science & Tech",
    venue: "Auditorium & STEM Lab 1",
    startDate: "2026-08-22",
    endDate: "2026-08-22",
    startTime: "10:00 AM",
    endTime: "03:00 PM",
    branch: "Main Campus",
    academicYear: "2025-2026",
    applicableClasses: [
      "Class 8",
      "Class 9",
      "Class 10",
      "Class 11",
      "Class 12",
    ],
    participants: "Class 8-12 Students",
    attachments: [
      {
        id: "ATT-3",
        name: "Science_Fair_Guidelines.pdf",
        url: "#",
        type: "PDF",
      },
    ],
    status: "Published",
    createdBy: "HOD Science (Dr. Sarah Jenkins)",
  },
  {
    id: "EVT-003",
    title: "Term 1 Parent Teacher Meeting (PTM)",
    category: "Parent Teacher Meeting",
    description:
      "Quarterly review meeting to discuss academic progress, attendance, and holistic student growth with parents.",
    organizer: "Academic Committee",
    venue: "Respective Classrooms",
    startDate: "2026-08-28",
    endDate: "2026-08-28",
    startTime: "09:00 AM",
    endTime: "01:00 PM",
    branch: "Main Campus",
    academicYear: "2025-2026",
    applicableClasses: ["All Classes"],
    participants: "Parents, Students & Class Teachers",
    status: "Published",
    createdBy: "Vice Principal",
  },
  {
    id: "EVT-004",
    title: "Grand Cultural Fest & Musical Night",
    category: "Cultural Fest",
    description:
      "Annual cultural extravaganza featuring classical dance, drama performance, school choir, and band live show.",
    organizer: "Cultural Arts Association",
    venue: "Open Air Amphitheatre",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    startTime: "04:00 PM",
    endTime: "08:30 PM",
    branch: "Main Campus",
    academicYear: "2025-2026",
    participants: "All Students, Staff & Alumni",
    status: "Published",
    createdBy: "Arts Coordinator",
  },
  {
    id: "EVT-005",
    title: "Career Guidance & University Fair Seminar",
    category: "Workshop & Seminar",
    description:
      "Interactive session with global university delegates and career counselors for Senior Secondary Students.",
    organizer: "Student Counseling Cell",
    venue: "Conference Hall B",
    startDate: "2026-09-18",
    endDate: "2026-09-18",
    startTime: "11:00 AM",
    endTime: "02:00 PM",
    branch: "Main Campus",
    academicYear: "2025-2026",
    applicableClasses: ["Class 11", "Class 12"],
    participants: "Class 11 & 12 Students",
    status: "Published",
    createdBy: "Senior Counselor",
  },
];

const initialWorkshops: WorkshopTraining[] = [
  {
    id: "WKS-101",
    workshopName: "AI & Machine Learning Tools in Modern Education",
    category: "AI Training",
    type: "Internal",
    trainerName: "Dr. Vikramaditya Sharma",
    organization: "EdTech Innovations Institute",
    branch: "Main Campus",
    department: "Academics",
    applicableDesignation: "All Teaching Staff",
    venue: "Smart Audio-Visual Lab 1",
    startDate: "2026-08-10",
    endDate: "2026-08-11",
    startTime: "09:30 AM",
    endTime: "03:30 PM",
    capacity: 40,
    description:
      "Hands-on workshop on leveraging Generative AI, lesson planning tools, automated assessment creators, and interactive student engagement platforms.",
    attachments: [
      { id: "ATT-W1", name: "AI_Tools_Handbook.pdf", url: "#", type: "PDF" },
    ],
    status: "Scheduled",
    attendancePct: 95,
    participants: [
      {
        employeeId: "STF-101",
        employeeName: "Rajesh Sharma",
        employeeRole: "Teaching Staff",
        department: "Mathematics",
        designation: "Senior PGT Teacher",
        branch: "Main Campus",
        attendanceStatus: "Present",
        certificateIssued: true,
        certificateNo: "CERT-2026-101",
      },
      {
        employeeId: "STF-102",
        employeeName: "Ananya Roy",
        employeeRole: "Teaching Staff",
        department: "Science",
        designation: "TGT Teacher",
        branch: "Main Campus",
        attendanceStatus: "Present",
        certificateIssued: true,
        certificateNo: "CERT-2026-102",
      },
    ],
  },
  {
    id: "WKS-102",
    workshopName: "POCSO & Child Safety Awareness Training",
    category: "POCSO Awareness",
    type: "External",
    trainerName: "Adv. Meenakshi Sundaram",
    organization: "National Child Rights & Protection Forum",
    branch: "Main Campus",
    department: "Administration",
    applicableDesignation: "All Staff",
    venue: "Main Auditorium",
    startDate: "2026-08-25",
    endDate: "2026-08-25",
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    capacity: 100,
    description:
      "Mandatory workshop on POCSO Act guidelines, identifying behavioral indicators, emergency protocols, and institutional reporting procedures.",
    attachments: [],
    status: "Scheduled",
    attendancePct: 100,
    participants: [],
  },
];

const initialEmployeeAssessments: EmployeeAssessment[] = [
  {
    id: "ASM-201",
    assessmentName: "Digital Pedagogy & Smart Classroom Skills Assessment",
    assessmentType: "Digital Skills Test",
    department: "Academics",
    applicableDesignation: "Teaching Staff",
    branch: "Main Campus",
    date: "2026-08-18",
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 70,
    instructions:
      "Comprehensive test covering interactive whiteboard usage, digital lesson design, online quiz creation, and LMS management.",
    evaluatorName: "Academic Director (Prof. V. K. Mehta)",
    status: "Evaluated",
    results: [
      {
        employeeId: "STF-101",
        employeeName: "Rajesh Sharma",
        department: "Mathematics",
        designation: "Senior PGT Teacher",
        branch: "Main Campus",
        marksObtained: 92,
        totalMarks: 100,
        percentage: 92,
        grade: "A+",
        result: "Pass",
        evaluatorRemarks:
          "Exceptional digital skills and interactive quiz integration.",
        certificateIssued: true,
        certificateNo: "CERT-2026-201",
      },
      {
        employeeId: "STF-102",
        employeeName: "Ananya Roy",
        department: "Science",
        designation: "TGT Teacher",
        branch: "Main Campus",
        marksObtained: 85,
        totalMarks: 100,
        percentage: 85,
        grade: "A",
        result: "Pass",
        evaluatorRemarks: "Great proficiency in smart board animations.",
        certificateIssued: true,
        certificateNo: "CERT-2026-202",
      },
    ],
  },
];

const initialIssuedCertificates: IssuedCertificate[] = [
  {
    id: "CRT-301",
    certificateNumber: "CERT-2026-101",
    programType: "Workshop",
    programName: "AI & Machine Learning Tools in Modern Education",
    employeeId: "STF-101",
    employeeName: "Rajesh Sharma",
    department: "Mathematics",
    designation: "Senior PGT Teacher",
    branch: "Main Campus",
    completionDate: "2026-08-11",
    issuedBy: "Pirnav Schools Professional Development Cell",
    status: "Issued",
  },
  {
    id: "CRT-302",
    certificateNumber: "CERT-2026-201",
    programType: "Assessment",
    programName: "Digital Pedagogy & Smart Classroom Skills Assessment",
    employeeId: "STF-101",
    employeeName: "Rajesh Sharma",
    department: "Mathematics",
    designation: "Senior PGT Teacher",
    branch: "Main Campus",
    completionDate: "2026-08-18",
    issuedBy: "Pirnav Schools Academic Council",
    status: "Issued",
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addToast } = useToast();
  const activeRequests = useRef<Record<string, any>>({});
  const {
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
      return saved ? JSON.parse(saved) : initial;
    } catch {
      const storageKey = key.startsWith("edu_db_") ? key : `edu_db_${key}`;
      localStorage.removeItem(storageKey);
      return initial;
    }
  };

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() =>
    getStored("profile", initialSchoolProfile),
  );
  const [academicYears, setAcademicYears] = useState<AcademicYearMaster[]>(() =>
    getStored("academic_years", initialAcademicYears),
  );
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
  const [students, setStudents] = useState<Student[]>(() => {
    const hasSyncedOnlyEnrolled = localStorage.getItem(
      "edu_db_students_enrolled_only_v8",
    );
    if (!hasSyncedOnlyEnrolled) {
      localStorage.setItem("edu_db_students_enrolled_only_v8", "true");
      localStorage.setItem("edu_db_students", JSON.stringify(initialStudents));
      localStorage.setItem("students", JSON.stringify(initialStudents));
      return initialStudents;
    }
    const stored = getStored("students", initialStudents);
    const version = localStorage.getItem("edu_db_full_data_v60");
    if (!version || stored.length < initialStudents.length) {
      localStorage.setItem("edu_db_full_data_v60", "true");
      localStorage.setItem("edu_db_students", JSON.stringify(initialStudents));
      localStorage.setItem("students", JSON.stringify(initialStudents));
      return initialStudents;
    }
    return stored && stored.length > 0 ? stored : initialStudents;
  });
  const [totalStudentCount, setTotalStudentCount] = useState<number>(0);
  const [staff, setStaff] = useState<Staff[]>(() =>
    getStored("edu_db_staff", initialStaff),
  );
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(() => {
    const hasSyncedOnlyEnrolled = localStorage.getItem(
      "edu_db_admissions_enrolled_only_v8",
    );
    if (!hasSyncedOnlyEnrolled) {
      localStorage.setItem("edu_db_admissions_enrolled_only_v8", "true");
      localStorage.setItem(
        "edu_db_admissions",
        JSON.stringify(initialAdmissions),
      );
      localStorage.setItem("admissions", JSON.stringify(initialAdmissions));
      return initialAdmissions;
    }
    const stored = getStored("admissions", initialAdmissions);
    return stored && stored.length > 0 ? stored : initialAdmissions;
  });
  const [rawClasses, setRawClasses] = useState<any[]>([]);
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>(
    () => {
      const stored = getStored("academic_classes", initialClasses);
      const ids = stored.map((c: any) => c.id);
      const hasDuplicates = ids.some(
        (id: any, index: number) => ids.indexOf(id) !== index,
      );
      if (hasDuplicates) {
        const seenIds = new Set<string>();
        const migrated = stored.map((c: any) => {
          let newId = c.id;
          if (!newId || seenIds.has(newId)) {
            let counter = 1;
            do {
              newId = `CL-${Math.floor(100 + Math.random() * 900)}`;
            } while (
              stored.some((x: any) => x.id === newId) ||
              seenIds.has(newId)
            );
          }
          seenIds.add(newId);
          return { ...c, id: newId };
        });
        localStorage.setItem(
          "edu_db_academic_classes",
          JSON.stringify(migrated),
        );
        return migrated;
      }
      return stored;
    },
  );
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
  const [uniforms, setUniforms] = useState<UniformItem[]>(() => {
    const stored = getStored<UniformItem[]>("uniforms", []);
    if (stored && stored.length > 0) {
      return stored;
    }
    const initialIds = new Set([
      "UNI-01",
      "UNI-02",
      "UNI-03",
      "UNI-04",
      "UNI-05",
      "UNI-06",
    ]);
    const sanitizePrice = (u: UniformItem): UniformItem => {
      let p = u.price;
      const nameLower = (u.name || u.category || "").toLowerCase();
      if (nameLower.includes("blazer") && (p < 500 || p === 85)) p = 1500;
      else if (nameLower.includes("shirt") && (p < 100 || p === 35)) p = 350;
      else if (nameLower.includes("tracksuit") && p < 300) p = 1200;
      else if (
        nameLower.includes("pant") ||
        nameLower.includes("trouser") ||
        nameLower.includes("skirt")
      ) {
        if (p < 200) p = 500;
      }
      return { ...u, price: p };
    };
    const sanitized = (initialUniforms || []).map(sanitizePrice);
    localStorage.setItem("edu_db_uniforms", JSON.stringify(sanitized));
    return sanitized;
  });
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() =>
    getStored("custom_roles", initialCustomRoles),
  );
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() =>
    getStored("fee_structures", initialFeeStructures),
  );
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() =>
    getStored("fee_payments", initialFeePayments),
  );
  const [attendance, setAttendance] = useState<DailyAttendance[]>(() =>
    getStored("attendance", []),
  );
  const [lastAttendancePayload, setLastAttendancePayload] = useState<any>(null);
  const [lastAttendanceResponse, setLastAttendanceResponse] =
    useState<any>(null);
  const [exams, setExams] = useState<ExamSetup[]>(() => {
    const stored = getStored<ExamSetup[]>("exams", initialExamSetups);
    return stored.length === 0 ? initialExamSetups : stored;
  });
  const [examMarks, setExamMarks] = useState<ExamMark[]>(() => {
    const stored = getStored("exam_marks", initialExamMarks);
    const version = localStorage.getItem("edu_db_full_exam_marks_v60");
    if (!version || stored.length < initialExamMarks.length) {
      localStorage.setItem("edu_db_full_exam_marks_v60", "true");
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
    () => getStored("grade_configurations", defaultGradeConfigurations),
  );
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>(
    () => getStored("processed_results", []),
  );
  const [studentAttendance, setStudentAttendance] = useState<any[]>(() =>
    getStored("student_attendance", []),
  );
  const [todayStudentAttendanceSummary, setTodayStudentAttendanceSummary] =
    useState<any>(null);
  const [coScholasticAssessments, setCoScholasticAssessments] = useState<any[]>(
    () => getStored("co_scholastic_assessments", []),
  );

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() =>
    getStored("timetable", initialTimetable),
  );
  const [homework, setHomework] = useState<Homework[]>(() =>
    getStored("homework", initialHomework),
  );
  const [books, setBooks] = useState<BookItem[]>(() =>
    getStored("books", initialBooks),
  );
  const [bookIssues, setBookIssues] = useState<BookIssue[]>(() =>
    getStored("book_issues", initialBookIssues),
  );
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() =>
    getStored("transport", initialTransportRoutes),
  );
  const [hostelRooms] = useState<HostelRoom[]>(() =>
    getStored("hostel", initialHostelRooms),
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    getStored("inventory", initialInventory),
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    getStored("announcements", initialAnnouncements),
  );
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const stored = getStored("holidays", initialHolidays);
    if (!stored || stored.length <= 1) {
      localStorage.setItem("edu_db_holidays", JSON.stringify(initialHolidays));
      return initialHolidays;
    }
    return stored;
  });
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(() =>
    getStored("school_events", initialSchoolEvents),
  );
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
  >(() => getStored("leave_applications", initialLeaveApplications));
  const [payslips, setPayslips] = useState<Payslip[]>(() =>
    getStored("payslips", initialPayslips),
  );
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

  // Uniform ERP States
  const [uniformCategories, setUniformCategories] = useState<UniformCategory[]>(
    () => {
      const stored = getStored<UniformCategory[]>("uniform_categories", []);
      if (stored && stored.length > 0) {
        return stored;
      }
      localStorage.setItem(
        "edu_db_uniform_categories",
        JSON.stringify(initialUniformCategories),
      );
      localStorage.setItem(
        "uniform_categories",
        JSON.stringify(initialUniformCategories),
      );
      return initialUniformCategories;
    },
  );
  const [uniformSizes, setUniformSizes] = useState<UniformSize[]>(() => {
    const vKey = "edu_db_uniform_sizes_v20";
    const hasV20 = localStorage.getItem(vKey);
    if (!hasV20) {
      localStorage.setItem(vKey, "true");
      localStorage.setItem(
        "edu_db_uniform_sizes",
        JSON.stringify(initialUniformSizes),
      );
      localStorage.setItem(
        "uniform_sizes",
        JSON.stringify(initialUniformSizes),
      );
      return initialUniformSizes;
    }
    const savedStr =
      localStorage.getItem("edu_db_uniform_sizes") ||
      localStorage.getItem("uniform_sizes");
    let baseList: UniformSize[] = savedStr
      ? JSON.parse(savedStr)
      : initialUniformSizes;

    // Strict deduplication by sizeName so duplicate sizes never exist
    const seenNames = new Set<string>();
    const deduplicated: UniformSize[] = [];

    for (const s of baseList || []) {
      if (!s || !s.sizeName) continue;
      const normName = s.sizeName.trim().toUpperCase();
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        deduplicated.push({ ...s, sizeName: normName });
      }
    }

    localStorage.setItem("edu_db_uniform_sizes", JSON.stringify(deduplicated));
    return deduplicated;
  });
  const [uniformSuppliers, setUniformSuppliers] = useState<UniformSupplier[]>(
    () => {
      const stored = getStored("uniform_suppliers", initialUniformSuppliers);
      const defaultMockIds = new Set(
        (initialUniformSuppliers || []).map((s) => s.id),
      );
      const isUserItem = (s: any) => {
        if (!s || !s.id) return false;
        if (s.createdAt) return true;
        if (!defaultMockIds.has(s.id)) return true;
        const num = parseInt(String(s.id || "").replace(/\D/g, ""), 10) || 0;
        return num > 20;
      };
      const userCreated = (stored || [])
        .filter(isUserItem)
        .sort((a: any, b: any) => {
          if (a.createdAt && b.createdAt)
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          const numA = parseInt(String(a.id || "").replace(/\D/g, ""), 10) || 0;
          const numB = parseInt(String(b.id || "").replace(/\D/g, ""), 10) || 0;
          return numB - numA;
        });
      const defaultMock = (stored || []).filter((s: any) => !isUserItem(s));
      const storedIds = new Set((stored || []).map((s: any) => s.id));
      const missing = initialUniformSuppliers.filter(
        (s: any) => !storedIds.has(s.id),
      );
      const merged = [...userCreated, ...defaultMock, ...missing];
      localStorage.setItem("edu_db_uniform_suppliers", JSON.stringify(merged));
      return merged;
    },
  );
  const [uniformInventory, setUniformInventory] = useState<
    UniformInventoryItem[]
  >(() => {
    try {
      const saved =
        localStorage.getItem("edu_db_uniform_inventory") ||
        localStorage.getItem("uniform_inventory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load uniform_inventory from localStorage", e);
    }
    const cleanInventory = (initialUniformInventory || []).map((item) => ({
      ...item,
      currentStock: item.openingStock || 100,
      status: "In Stock" as const,
    }));
    return cleanInventory;
  });

  const [studentUniformIssues, setStudentUniformIssues] = useState<
    StudentUniformIssue[]
  >(() => {
    try {
      const saved =
        localStorage.getItem("edu_db_student_uniform_issues") ||
        localStorage.getItem("student_uniform_issues");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((i) => {
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
              adm === "ADM-2026-001" ||
              adm === "REG-1022" ||
              adm === "REG-1021";
            return !isDummy;
          });
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ERP Finance System States
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(() => {
    const version = localStorage.getItem("edu_db_fee_heads_v68");
    if (!version) {
      localStorage.setItem("edu_db_fee_heads_v68", "true");
      localStorage.removeItem("fee_heads");
      localStorage.removeItem("edu_db_fee_heads");
      localStorage.removeItem("student_fee_installments");
      localStorage.removeItem("edu_db_student_fee_installments");
      localStorage.setItem("fee_heads", JSON.stringify(initialFeeHeads));
      return initialFeeHeads;
    }
    const stored = getStored("fee_heads", initialFeeHeads);
    return stored.map((fh) => {
      if (
        fh.name.toLowerCase().includes("tuition") &&
        fh.frequency === "Monthly"
      ) {
        return { ...fh, frequency: "Quarterly" as const };
      }
      return fh;
    });
  });
  const [dynamicFeeStructures, setDynamicFeeStructures] = useState<
    DynamicFeeStructure[]
  >(() => {
    const stored = getStored(
      "edu_db_dynamic_fee_structures",
      getStored("dynamic_fee_structures", initialDynamicFeeStructures),
    );
    const raw =
      stored && stored.length > 0 ? stored : initialDynamicFeeStructures;
    return raw.map((dfs) => {
      const cleanItems = (dfs.items || []).filter((item) => {
        if (!item) return false;
        const name = (item.feeHeadName || "").trim();
        return name !== "" && name !== "Fee Head" && name !== "Fee Head:";
      });
      const cleanTotal = cleanItems.reduce(
        (sum, i) => sum + (i.amount || 0),
        0,
      );
      return {
        ...dfs,
        items: cleanItems,
        totalAmount: cleanTotal,
      };
    });
  });
  const [studentFeeAssignments, setStudentFeeAssignments] = useState<
    StudentFeeAssignment[]
  >(() => getStored("student_fee_assignments", initialStudentFeeAssignments));

  const [dbAssignments, setDbAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!dbAssignments.length) return;
    const mapped = dbAssignments.map((a) => {
      const student = students.find(
        (s) =>
          s.id === a.studentId?.toString() || s.admissionNo === a.studentId,
      );
      const dfs = dynamicFeeStructures.find(
        (d) =>
          d.id === a.dynamicFeeStructureId?.toString() ||
          d.id === a.feeStructureId,
      );
      return {
        id: a.id?.toString() || a.id || "",
        studentId: a.studentId || "",
        studentName:
          (student as any)?.studentName ||
          (student ? `${student.firstName} ${student.lastName}` : "") ||
          a.studentName ||
          "",
        admissionNo: student?.admissionNo || a.admissionNo || a.studentId || "",
        branch: student?.branch || a.branch || "Main Campus",
        academicYear:
          (student as any)?.academicYear || a.academicYear || "2026-2027",
        className: student?.className || a.className || "",
        section: student?.section || a.section || "",
        feeStructureId:
          a.dynamicFeeStructureId?.toString() || a.feeStructureId || "",
        assignedFeeHeads: dfs?.items || a.assignedFeeHeads || [],
        baseFeeTotal: a.totalAmount ?? a.baseFeeTotal ?? dfs?.totalAmount ?? 0,
        originalFeeTotal:
          a.totalAmount ?? a.originalFeeTotal ?? dfs?.totalAmount ?? 0,
        adjustmentTotal: a.adjustmentTotal || 0,
        feePolicy: (a.feePolicy || "Full Annual Fee") as any,
        assignedDate: a.assignedDate || new Date().toISOString(),
        status: a.status || "Active",
      };
    });
    setStudentFeeAssignments(mapped);
  }, [dbAssignments, students, dynamicFeeStructures]);
  const [scholarships, setScholarships] = useState<Scholarship[]>(() =>
    getStored("scholarships", initialScholarships),
  );
  const [studentScholarships, setStudentScholarships] = useState<
    StudentScholarship[]
  >(() => getStored("student_scholarships", initialStudentScholarships));
  const [discounts, setDiscounts] = useState<Discount[]>(() =>
    getStored("discounts", initialDiscounts),
  );
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>(
    () => getStored("student_discounts", initialStudentDiscounts),
  );
  const [fineRules, setFineRules] = useState<FineRule[]>(() =>
    getStored("fine_rules", initialFineRules),
  );
  const [erpTransportRoutes, setERPTransportRoutes] = useState<
    ERPTransportRoute[]
  >(() => getStored("erp_transport_routes", initialERPTransportRoutes));
  const [studentTransports, setStudentTransports] = useState<
    StudentTransport[]
  >(() => getStored("student_transports", initialStudentTransports));
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
  const [routeMasters, setRouteMasters] = useState<RouteMaster[]>(() =>
    getStored("route_masters", initialRouteMasters),
  );
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>(() =>
    getStored("pickup_points", initialPickupPoints),
  );
  const [vehicleMasters, setVehicleMasters] = useState<VehicleMaster[]>(() =>
    getStored("vehicle_masters", initialVehicleMasters),
  );
  const [driverMasters, setDriverMasters] = useState<DriverMaster[]>(() =>
    getStored("driver_masters", initialDriverMasters),
  );
  const [busAttendants, setBusAttendants] = useState<BusAttendantMaster[]>(() =>
    getStored("bus_attendants", initialBusAttendants),
  );
  const [vehicleAssignments, setVehicleAssignments] = useState<
    VehicleAssignment[]
  >(() => getStored("vehicle_assignments", initialVehicleAssignments));
  const [vehicleMaintenances, setVehicleMaintenances] = useState<
    VehicleMaintenance[]
  >(() => getStored("vehicle_maintenances", initialVehicleMaintenances));

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
  >(() =>
    getStored("finance_transport_configs", initialFinanceTransportConfigs),
  );

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

  // Academic Year Fee Schedules State
  const [academicYearFeeSchedules, setAcademicYearFeeSchedules] = useState<
    AcademicYearFeeSchedule[]
  >(() => {
    const stored = getStored<AcademicYearFeeSchedule[]>(
      "academic_year_fee_schedules",
      [],
    );
    const version = localStorage.getItem("edu_db_schedules_v64");
    if (!version || stored.length < 3 || !stored[0]?.monthlyConfig) {
      localStorage.setItem("edu_db_schedules_v64", "true");
      const seeded: AcademicYearFeeSchedule[] = [
        {
          id: "SCH-2026-2027",
          academicYear: "2026-2027",
          numberOfTerms: 4,
          status: "Active",
          monthlyConfig: buildDefaultMonthlyConfig("2026-2027", 10),
          annualDueDate: "2026-04-15",
          oneTimeDueDate: "2026-04-15",
          terms: [
            {
              id: "T1-2026-2027",
              termName: "Term 1",
              startDate: "2026-04-01",
              endDate: "2026-06-30",
              dueDate: "2026-04-15",
              sequence: 1,
              status: "Active",
            },
            {
              id: "T2-2026-2027",
              termName: "Term 2",
              startDate: "2026-07-01",
              endDate: "2026-09-30",
              dueDate: "2026-07-15",
              sequence: 2,
              status: "Active",
            },
            {
              id: "T3-2026-2027",
              termName: "Term 3",
              startDate: "2026-10-01",
              endDate: "2026-12-31",
              dueDate: "2026-10-15",
              sequence: 3,
              status: "Active",
            },
            {
              id: "T4-2026-2027",
              termName: "Term 4",
              startDate: "2027-01-01",
              endDate: "2027-03-31",
              dueDate: "2027-01-15",
              sequence: 4,
              status: "Active",
            },
          ],
        },
        {
          id: "SCH-2025-2026",
          academicYear: "2025-2026",
          numberOfTerms: 4,
          status: "Active",
          monthlyConfig: buildDefaultMonthlyConfig("2025-2026", 10),
          annualDueDate: "2025-04-15",
          oneTimeDueDate: "2025-04-15",
          terms: [
            {
              id: "T1-2025-2026",
              termName: "Term 1",
              startDate: "2025-04-01",
              endDate: "2025-06-30",
              dueDate: "2025-04-15",
              sequence: 1,
              status: "Active",
            },
            {
              id: "T2-2025-2026",
              termName: "Term 2",
              startDate: "2025-07-01",
              endDate: "2025-09-30",
              dueDate: "2025-07-15",
              sequence: 2,
              status: "Active",
            },
            {
              id: "T3-2025-2026",
              termName: "Term 3",
              startDate: "2025-10-01",
              endDate: "2025-12-31",
              dueDate: "2025-10-15",
              sequence: 3,
              status: "Active",
            },
            {
              id: "T4-2025-2026",
              termName: "Term 4",
              startDate: "2026-01-01",
              endDate: "2026-03-31",
              dueDate: "2026-01-15",
              sequence: 4,
              status: "Active",
            },
          ],
        },
        {
          id: "SCH-2024-2025",
          academicYear: "2024-2025",
          numberOfTerms: 4,
          status: "Active",
          terms: [
            {
              id: "T1-2024-2025",
              termName: "Term 1",
              startDate: "2024-04-01",
              endDate: "2024-06-30",
              dueDate: "2024-06-15",
              sequence: 1,
              status: "Active",
            },
            {
              id: "T2-2024-2025",
              termName: "Term 2",
              startDate: "2024-07-01",
              endDate: "2024-09-30",
              dueDate: "2024-09-15",
              sequence: 2,
              status: "Active",
            },
            {
              id: "T3-2024-2025",
              termName: "Term 3",
              startDate: "2024-10-01",
              endDate: "2024-12-31",
              dueDate: "2024-12-15",
              sequence: 3,
              status: "Active",
            },
            {
              id: "T4-2024-2025",
              termName: "Term 4",
              startDate: "2025-01-01",
              endDate: "2025-03-31",
              dueDate: "2025-03-15",
              sequence: 4,
              status: "Active",
            },
          ],
        },
      ];
      localStorage.setItem(
        "academic_year_fee_schedules",
        JSON.stringify(seeded),
      );
      return seeded;
    }
    return stored;
  });

  // Student Fee Installments State
  const [studentFeeInstallments, setStudentFeeInstallments] = useState<
    StudentFeeInstallment[]
  >(() => {
    const version = localStorage.getItem("edu_db_clear_extra_paid_v100");
    if (!version) {
      localStorage.setItem("edu_db_clear_extra_paid_v100", "true");
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
    const version = localStorage.getItem("edu_db_full_ledgers_v101");
    if (!version) {
      localStorage.setItem("edu_db_full_ledgers_v101", "true");
      localStorage.removeItem("student_fee_ledgers");
      localStorage.removeItem("edu_db_student_fee_ledgers");
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

      return {
        ...ledger,
        feeItems: sanitizedItems,
        paidAmount: Math.max(
          0,
          (ledger.paidAmount || 0) - (ledger.paidAmount > 0 ? uniformPaid : 0),
        ),
        dueBalance:
          (ledger.dueBalance || 0) + (ledger.paidAmount > 0 ? uniformPaid : 0),
      };
    });
  });

  // Master Finance Ledger & Transactions States
  const [financeTransactions, setFinanceTransactions] = useState<
    FinanceTransaction[]
  >(() => getStored("finance_transactions", initialFinanceTransactions));
  const [financialAccounts, setFinancialAccounts] = useState<
    FinancialAccount[]
  >(() => getStored("financial_accounts", initialFinancialAccounts));
  const [financialCategories, setFinancialCategories] = useState<
    FinancialCategory[]
  >(() => getStored("financial_categories", initialFinancialCategories));
  const [financialBudgets, setFinancialBudgets] = useState<FinancialBudget[]>(
    () => getStored("financial_budgets", initialFinancialBudgets),
  );

  const addAcademicYear = (ayData: Omit<AcademicYearMaster, "id">) => {
    const id = `AY-${ayData.academicYear.replace(/\s+/g, "") || Date.now()}`;
    const newAY: AcademicYearMaster = { id, ...ayData };
    setAcademicYears((prev) => {
      let updated = [...prev];
      if (newAY.isCurrentAcademicYear) {
        updated = updated.map((a) => ({ ...a, isCurrentAcademicYear: false }));
        setSelectedAcademicYear(newAY.academicYear);
      }
      return [...updated, newAY];
    });
  };

  const updateAcademicYear = (
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
      return updated;
    });
  };

  const deleteAcademicYear = (id: string) => {
    setAcademicYears((prev) => prev.filter((a) => a.id !== id));
  };

  const setCurrentAcademicYear = (id: string) => {
    setAcademicYears((prev) => {
      const target = prev.find((a) => a.id === id);
      if (!target) return prev;
      setSelectedAcademicYear(target.academicYear);
      return prev.map((a) => ({
        ...a,
        isCurrentAcademicYear: a.id === id,
        status:
          a.id === id ? "Active" : a.status === "Active" ? "Closed" : a.status,
      }));
    });
  };

  useEffect(() => {
    localStorage.setItem("edu_db_profile", JSON.stringify(schoolProfile));
  }, [schoolProfile]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_academic_years",
      JSON.stringify(academicYears),
    );
  }, [academicYears]);
  useEffect(() => {
    localStorage.setItem("edu_db_students", JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem("edu_db_staff", JSON.stringify(staff));
  }, [staff]);
  useEffect(() => {
    localStorage.setItem("edu_db_admissions", JSON.stringify(admissions));
  }, [admissions]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_academic_classes",
      JSON.stringify(academicClasses),
    );
  }, [academicClasses]);
  useEffect(() => {
    localStorage.setItem("edu_db_attendance", JSON.stringify(attendance));
  }, [attendance]);
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
  useEffect(() => {
    localStorage.setItem("edu_db_uniforms", JSON.stringify(uniforms));
  }, [uniforms]);
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
    localStorage.setItem(
      "edu_db_financial_accounts",
      JSON.stringify(financialAccounts),
    );
  }, [financialAccounts]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_financial_categories",
      JSON.stringify(financialCategories),
    );
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
  }, [discounts]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_discounts",
      JSON.stringify(studentDiscounts),
    );
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

  // Uniform ERP Effects
  useEffect(() => {
    localStorage.setItem(
      "edu_db_uniform_categories",
      JSON.stringify(uniformCategories),
    );
  }, [uniformCategories]);
  useEffect(() => {
    localStorage.setItem("edu_db_uniform_sizes", JSON.stringify(uniformSizes));
  }, [uniformSizes]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_uniform_suppliers",
      JSON.stringify(uniformSuppliers),
    );
  }, [uniformSuppliers]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_uniform_inventory",
      JSON.stringify(uniformInventory),
    );
    localStorage.setItem("uniform_inventory", JSON.stringify(uniformInventory));
  }, [uniformInventory]);
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

  // Auto-sync uniform inventory items with uniforms list, deduplicate, and sanitize
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
      const seenNorms = new Set<string>();
      const deduplicated: UniformItem[] = [];

      for (const u of prevU || []) {
        if (!u) continue;
        const norm = (u.category || u.name || "").toLowerCase().trim();
        if (validCatNorms.has(norm) && !seenNorms.has(norm)) {
          seenNorms.add(norm);
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

      // Ensure every category in uniformCategories has 1 catalog item
      validCatList.forEach((cat) => {
        if (!seenNorms.has(cat.norm)) {
          seenNorms.add(cat.norm);
          let defPrice = 350;
          if (cat.norm.includes("blazer")) defPrice = 1500;
          else if (cat.norm.includes("sweater")) defPrice = 800;
          else if (
            cat.norm.includes("pant") ||
            cat.norm.includes("trouser") ||
            cat.norm.includes("skirt") ||
            cat.norm.includes("shoes") ||
            cat.norm.includes("tracksuit")
          )
            defPrice = 500;
          else if (
            cat.norm.includes("tie") ||
            cat.norm.includes("belt") ||
            cat.norm.includes("cap")
          )
            defPrice = 150;

          const dynamicPrice = getItemFeeFromFinanceConfig(
            "",
            cat.name,
            "Unisex",
            financeUniformConfigs,
            defPrice,
          );

          deduplicated.push({
            id: `UNI-${cat.id || Date.now()}`,
            category: cat.name,
            name: cat.name,
            gender: cat.norm.includes("boys")
              ? "Male"
              : cat.norm.includes("girls")
                ? "Female"
                : "Unisex",
            size:
              cat.norm.includes("tie") ||
              cat.norm.includes("belt") ||
              cat.norm.includes("ribbon") ||
              cat.norm.includes("cap")
                ? "Free Size"
                : "M",
            className: "All Wings",
            color: "Standard",
            price: dynamicPrice,
            availableStock: 100,
            branch: selectedBranch || "Main Campus",
          });
        }
      });

      if (JSON.stringify(deduplicated) !== JSON.stringify(prevU)) {
        try {
          localStorage.setItem("edu_db_uniforms", JSON.stringify(deduplicated));
        } catch (e) {}
        return deduplicated;
      }
      return prevU;
    });
  }, [uniformCategories, financeUniformConfigs]);

  // Auto-sync uniformInventory with uniforms list (Strict deduplication)
  useEffect(() => {
    if (!uniforms || uniforms.length === 0) return;

    const validItems = uniforms
      .map((u) => ({
        id: u.id,
        name: u.category || u.name || "",
        norm: (u.category || u.name || "").toLowerCase().trim(),
        stock: u.availableStock !== undefined ? Number(u.availableStock) : 100,
      }))
      .filter((x) => x.name !== "");

    const validNorms = new Set(validItems.map((x) => x.norm));

    setUniformInventory((prevInv) => {
      const seenNorms = new Set<string>();
      const deduplicated: UniformInventoryItem[] = [];

      for (const inv of prevInv || []) {
        if (!inv) continue;
        const norm = (inv.itemName || inv.category || "").toLowerCase().trim();
        if (validNorms.has(norm) && !seenNorms.has(norm)) {
          seenNorms.add(norm);
          deduplicated.push(inv);
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
            size:
              item.norm.includes("tie") ||
              item.norm.includes("belt") ||
              item.norm.includes("cap")
                ? "Free Size"
                : "M",
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
            branch: selectedBranch || "Main Campus",
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
    const allowedTransportRoles = [
      "Super Admin",
      "Admin",
      "Transport Manager",
      "Principal",
      "Receptionist",
    ];
    if (!isAuthenticated || !allowedTransportRoles.includes(role)) return;
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

        const mergeApiAndLocal = <T extends { id: string | number }>(
          apiList: T[],
          localKey: string,
          initialFallback: T[],
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
            localList.forEach((localItem: T) => {
              if (
                localItem &&
                localItem.id !== undefined &&
                localItem.id !== null
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
          return merged;
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
              r.routeName.toUpperCase() !== "N/A",
          );
          setRouteMasters(
            mergeApiAndLocal(
              validRoutes,
              "edu_db_route_masters",
              initialRouteMasters,
            ),
          );
        }
        if (points) {
          const mappedPoints = points.map((p: any) => ({
            id: (p.id || p.pickupPointId || "").toString(),
            routeId: (p.routeId || "").toString(),
            routeName: p.routeName || p.selectRoute || "",
            pickupName: p.pickupName || p.pickupPointName || "",
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
          setPickupPoints(
            mergeApiAndLocal(
              mappedPoints,
              "edu_db_pickup_points",
              initialPickupPoints,
            ),
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
          setVehicleMasters(
            mergeApiAndLocal(
              mappedVehicles,
              "edu_db_vehicle_masters",
              initialVehicleMasters,
            ),
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
          setDriverMasters(
            mergeApiAndLocal(
              mappedDrivers,
              "edu_db_driver_masters",
              initialDriverMasters,
            ),
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
              attendantId: (a.attendantId || "").toString(),
              attendantName: a.attendantName || a.selectBusAttendant || "",
              morningTripTime: a.morningTripTime || a.morningTrip || "",
              eveningTripTime: a.eveningTripTime || a.eveningTrip || "",
              effectiveFrom: a.effectiveFrom || a.effectiveFromDate || "",
              effectiveTo: a.effectiveTo || "",
              status: normalizeStatus(a.status),
            };
          });
          setVehicleAssignments(
            mergeApiAndLocal(
              mappedAssignments,
              "edu_db_vehicle_assignments",
              initialVehicleAssignments,
            ),
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
          setVehicleMaintenances(
            mergeApiAndLocal(
              mappedMaintenance,
              "edu_db_vehicle_maintenances",
              initialVehicleMaintenances,
            ),
          );
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
            gender: a.gender || "Female",
            branch: a.branch || "",
            status: normalizeStatus(a.status),
          }));
          setBusAttendants(
            mergeApiAndLocal(
              mappedAttendants,
              "edu_db_bus_attendants",
              initialBusAttendants,
            ),
          );
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
            return {
              id: (t.id || t.studentTransportId || "").toString(),
              studentId: (t.studentId || "").toString(),
              studentName: t.studentName || t.fullName || "",
              admissionNo: admNo,
              routeName: t.routeName || "",
              routeId: (t.routeId || "").toString(),
              pickupPoint: t.pickupPoint || t.pickupName || "",
              pickupPointId: (t.pickupPointId || "").toString(),
              vehicleNumber: t.vehicleNumber || "",
              vehicleId: (t.vehicleId || "").toString(),
              feePlan: t.feePlan || "Monthly",
              feeAmount: Number(t.feeAmount || 0),
              effectiveFrom: t.effectiveFrom
                ? t.effectiveFrom.split("T")[0]
                : "",
              status: normalizeStatus(t.status),
            };
          });
          setStudentTransports(
            mergeApiAndLocal(
              mappedTransports,
              "edu_db_student_transports",
              initialStudentTransports,
            ),
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
      "edu_db_leave_applications",
      JSON.stringify(leaveApplications),
    );
  }, [leaveApplications]);
  useEffect(() => {
    localStorage.setItem("edu_db_payslips", JSON.stringify(payslips));
  }, [payslips]);
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
      "edu_db_processed_results",
      JSON.stringify(processedResults),
    );
  }, [processedResults]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_student_attendance",
      JSON.stringify(studentAttendance),
    );
  }, [studentAttendance]);
  useEffect(() => {
    localStorage.setItem(
      "edu_db_co_scholastic_assessments",
      JSON.stringify(coScholasticAssessments),
    );
  }, [coScholasticAssessments]);

  const fetchAcademicClasses = async () => {
    if (activeRequests.current["classes"]) {
      return activeRequests.current["classes"];
    }
    const promise = (async () => {
      try {
        const data = await fetchClassesApi();
        if (data) {
          // Handle array response or object wrapper response
          const classList = Array.isArray(data)
            ? data
            : data.success && Array.isArray(data.data)
              ? data.data
              : null;
          if (classList) {
            const storedLocal = localStorage.getItem("edu_db_academic_classes");
            const localClasses: AcademicClass[] = storedLocal
              ? JSON.parse(storedLocal)
              : [];

            const mapped: AcademicClass[] = classList.map((c: any) => {
              const classIdStr = c.classId?.toString() || c.id?.toString();
              const localCls = localClasses.find((lc) => lc.id === classIdStr);

              return {
                id: classIdStr,
                name: c.className || c.name,
                sections: c.sections?.map((s: any) => s.sectionName || s) || [],
                sectionTeachers: c.sectionTeachers || {},
                teacher: c.teacher || "Unassigned",
                subjects: Array.isArray(c.curriculumSubjects)
                  ? c.curriculumSubjects.map(
                      (cs: any) => cs.subjectName || cs.name || "",
                    )
                  : c.subjects || [],
                weeklyPeriods: localCls?.weeklyPeriods || c.weeklyPeriods || {},
                sectionDetails:
                  localCls?.sectionDetails || c.sectionDetails || {},
              };
            });
            setAcademicClasses(mapped);
          }
        }
      } catch (err: any) {
        console.warn("Error fetching classes", err);
      } finally {
        delete activeRequests.current["classes"];
      }
    })();
    activeRequests.current["classes"] = promise;
    return promise;
  };

  const fetchSubjects = async () => {
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
  };

  const fetchPeriods = async () => {
    try {
      const data: any = await fetchAcademicPeriodsApi();
      const dataArray = Array.isArray(data) ? data : data?.data || [];
      if (Array.isArray(dataArray)) {
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
        setPeriodSettings(mappedData);
      }
    } catch (err: any) {
      console.warn("Error fetching periods", err);
    }
  };

  const fetchAdmissions = async () => {
    if (activeRequests.current["admissions"]) {
      return activeRequests.current["admissions"];
    }
    const promise = (async () => {
      try {
        const json = await fetchAdmissionsApi();
        console.log("Admissions API response:", json);
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
              return {
                id: item.applicationId
                  ? item.applicationId.toString()
                  : existing?.id || Math.random().toString(),
                applicationNo:
                  item.registrationNo || existing?.applicationNo || "",
                registrationNo:
                  item.registrationNo || existing?.registrationNo || "",
                applicantName:
                  item.applicantFullName || existing?.applicantName || "",
                appliedClass:
                  item.appliedClass || existing?.appliedClass || "Class 10",
                gender: item.gender || existing?.gender || "Male",
                dob: item.dob ? item.dob.split("T")[0] : existing?.dob || "",
                bloodGroup: item.bloodGroup || existing?.bloodGroup || "O+",
                religion: item.religion || existing?.religion || "General",
                casteCategory:
                  item.casteCategory || existing?.casteCategory || "General",
                parentName: item.fatherFullName || existing?.parentName || "",
                motherName: item.motherFullName || existing?.motherName || "",
                phone: item.fatherMobileNo || existing?.phone || "",
                email: item.email || existing?.email || "",
                addressHouseNo: item.houseNo || existing?.addressHouseNo || "",
                addressStreet: item.street || existing?.addressStreet || "",
                addressArea: item.areaLocality || existing?.addressArea || "",
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
                studentType:
                  item.studentType || existing?.studentType || "Day Scholar",
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
                branch: item.branch || existing?.branch || "Main Campus",
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
                selectedOptionalFees:
                  item.selectedOptionalFees ||
                  item.optionalFees ||
                  existing?.selectedOptionalFees ||
                  [],
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
  };

  const fetchDepartments = async () => {
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
          status: item.status || "Active",
        }));
        setDepartments(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch departments", err);
    }
  };

  const fetchDesignations = async () => {
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
          employeeCategory: item.employeeCategory || "Both",
          status: item.status || "Active",
        }));
        setDesignations(mapped);
      }
    } catch (err) {
      console.warn("Failed to fetch designations", err);
    }
  };

  const fetchStaff = async () => {
    if (activeRequests.current["staff"]) {
      return activeRequests.current["staff"];
    }
    const promise = (async () => {
      try {
        const response = await fetchStaffApi();
        if (response && response.success && response.data) {
          console.log("DEBUG: fetchStaff response data:", response.data);
          const mappedStaff: Staff[] = response.data.map((item: any) => {
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
            const itemEmpId = item.employeeId || item.empId || "";

            // Look up in current staff state to preserve local workload data
            const existing = staff.find(
              (s) => s.id === itemId || s.empId === itemEmpId,
            );

            return {
              id: itemId,
              empId: itemEmpId,
              employeeCategory: isTeaching ? "Teacher" : "Staff",
              firstName: item.firstName,
              middleName: item.middleName || "",
              lastName: item.lastName,
              email: item.email || "",
              phone: item.phone || "",
              alternateMobile: item.alternateMobile || "",
              gender: item.gender || "Male",
              dob: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
              bloodGroup: item.bloodGroup || "",
              aadhaarNumber: item.aadhaarNumber || "",
              panNumber: item.panNumber || "",
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
              employmentType: item.employmentType || existing?.employmentType || "",
              address: item.presentAddress || item.residentialAddress || item.address || "",
              presentAddress: item.presentAddress || item.residentialAddress || "",
              permanentAddress: item.permanentAddress || "",
              city: item.city || "",
              state: item.state || "",
              pinCode: item.pinCode || "",
              country: item.country || "India",
              assignedClasses: item.assignedClasses || existing?.assignedClasses || [],
              assignedSubjects: item.assignedSubjects || existing?.assignedSubjects || [],
              isClassTeacherEligible: item.isClassTeacherEligible !== undefined ? item.isClassTeacherEligible : (existing?.isClassTeacherEligible || false),
              bankDetails: {
                accountHolderName: item.accountHolderName || "",
                accountNumber: item.accountNumber || "",
                bankName: item.bankName || "",
                branch: item.branchName || "",
                ifscCode: item.ifscCode || "",
                upiId: item.upiId || "",
              },
              branch: item.branchName || existing?.branch || "Main Campus",
            };
          });
          setStaff(mappedStaff);
        }
      } catch (err) {
        console.warn("Failed to fetch staff from API", err);
      } finally {
        delete activeRequests.current["staff"];
      }
    })();
    activeRequests.current["staff"] = promise;
    return promise;
  };

  // =========================================================
  // FETCH FUNCTIONS — REAL API REPLACEMENTS FOR MOCK DATA
  // =========================================================

  const fetchStudents = async () => {
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
            return {
              id: s.studentId?.toString() || s.id?.toString() || "",
              admissionNo: s.admissionNumber || s.admissionNo || "",
              registrationNumber:
                s.registrationNumber ||
                s.admissionNumber ||
                s.admissionNo ||
                "",
              firstName,
              middleName: s.middleName || "",
              lastName,
              email: s.email || "",
              phone: s.phone || s.mobileNumber || s.contactNumber || "",
              gender: s.gender || "Male",
              dob: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
              className: s.className || s.class || "",
              section: s.sectionName || s.section || "",
              academicYear: s.academicYearName || s.academicYear || "",
              branch: s.branchName || s.branch || "Main Campus",
              status: s.status || "Active",
              studentType: s.studentType || "Day Scholar",
              parentName: s.parentName || s.fatherName || "",
              parentPhone: s.parentPhone || s.fatherContact || "",
              address: s.address || "",
              promotionHistory: [],
              rollNo: s.rollNumber || s.rollNo || "",
              bloodGroup: s.bloodGroup || "O+",
              category: s.category || "General",
              avatar: s.avatar || "",
              joiningDate:
                s.joiningDate || new Date().toISOString().split("T")[0],
            } as unknown as Student;
          });
          setStudents(mapped);
        }
      } catch (err) {
        console.warn("Failed to fetch students from API", err);
      } finally {
        delete activeRequests.current["students"];
      }
    })();
    activeRequests.current["students"] = promise;
    return promise;
  };

  const fetchBooks = async () => {
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
  };

  const fetchBookIssues = async () => {
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
  };

  const fetchHomeworkData = async () => {
    try {
      const response: any = await fetchHomeworkApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setHomework((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch homework from API", err);
    }
  };

  const fetchInventoryData = async () => {
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
  };

  const fetchUniformData = async () => {
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
      if (cats.length) {
        const mappedCats = cats.map((c: any) => ({
          id: String(
            c.id ||
              c.categoryId ||
              `UC-${Math.random().toString(36).substr(2, 5)}`,
          ),
          name: c.name || c.categoryName || "",
          categoryName: c.categoryName || c.name || "",
          description: c.description || "",
          status: c.status || "Active",
          branch: c.branch || selectedBranch || "Main Campus",
        }));
        setUniformCategories((prev) => {
          if (prev && prev.length > 0) return prev;
          return mappedCats;
        });
      }
      if (sizes.length) {
        const mappedSizes = sizes.map((s: any) => ({
          id: String(
            s.id || s.sizeId || `US-${Math.random().toString(36).substr(2, 5)}`,
          ),
          sizeName: s.sizeName || s.sizeCodeName || "",
          sizeCodeName: s.sizeCodeName || s.sizeName || "",
          chest: s.chest || s.chestSpec || s.chestWidth || "",
          waist: s.waist || s.waistSpec || s.waistSpecs || "",
          height: s.height || s.heightTarget || s.heightBounds || "",
          ageGroup: s.ageGroup || s.ageBracket || "",
          gender: s.gender || "Unisex",
          branch: s.branch || selectedBranch || "Main Campus",
        }));
        setUniformSizes((prev) => {
          if (prev && prev.length > 0) return prev;
          return mappedSizes;
        });
      }
      if (suppliers.length) {
        const mappedSuppliers = suppliers.map((s: any) => ({
          id: String(
            s.id ||
              s.supplierId ||
              `SUP-${Math.random().toString(36).substr(2, 5)}`,
          ),
          supplierName: s.supplierName || s.companyName || "",
          companyName: s.companyName || s.supplierName || "",
          contactPerson: s.contactPerson || s.contactRepresentative || "",
          mobile: s.mobile || s.phone || s.mobileNumber || "",
          phone: s.phone || s.mobile || s.mobileNumber || "",
          email: s.email || s.emailAddress || "",
          gstNumber: s.gstNumber || s.gstRegistrationNo || "",
          address: s.address || s.warehouseAddress || "",
          status: s.status || "Active",
          branch: s.branch || selectedBranch || "Main Campus",
        }));
        setUniformSuppliers((prev) => {
          if (prev && prev.length > 0) return prev;
          return mappedSuppliers;
        });
      }
      if (types.length) {
        const mappedInv = types.map((t: any) => ({
          id: String(
            t.id ||
              t.uniformTypeId ||
              `UINV-${Math.random().toString(36).substr(2, 5)}`,
          ),
          itemId: String(t.id || t.uniformTypeId || ""),
          itemName: t.itemName || t.uniformCategory || t.category || "",
          category: t.categoryName || t.category || t.itemName || "Uniform",
          size: t.size || "M",
          openingStock: Number(t.openingStock || 0),
          currentStock: Number(
            t.availableStock !== undefined
              ? t.availableStock
              : t.currentStock !== undefined
                ? t.currentStock
                : 0,
          ),
          minimumStock: Number(
            t.minThreshold !== undefined
              ? t.minThreshold
              : t.minimumStock !== undefined
                ? t.minimumStock
                : 30,
          ),
          reorderLevel: Number(
            t.reorderPoint !== undefined
              ? t.reorderPoint
              : t.reorderLevel !== undefined
                ? t.reorderLevel
                : 50,
          ),
          status:
            t.stockStatus ||
            (Number(t.availableStock ?? t.currentStock ?? 0) === 0
              ? "Out of Stock"
              : Number(t.availableStock ?? t.currentStock ?? 0) <=
                  Number(t.minThreshold ?? 30)
                ? "Low Stock"
                : "In Stock"),
          lastUpdated: t.createdAt || new Date().toISOString(),
          branch: t.branch || selectedBranch || "Main Campus",
        }));
        setUniformInventory((prev) => {
          const apiIds = new Set(mappedInv.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...localOnly, ...mappedInv];
        });

        const mappedUniforms = types.map((t: any) => ({
          id: String(
            t.id ||
              t.uniformTypeId ||
              `UNI-${Math.random().toString(36).substr(2, 5)}`,
          ),
          category: t.categoryName || t.category || t.itemName || "Uniform",
          name: t.itemName || "",
          gender: t.gender || "Unisex",
          size: t.size || "M",
          className: t.schoolWing || t.level || "All Wings",
          color: t.color || t.colorSpec || "Standard",
          price: Number(t.unitPrice || 0),
          availableStock: Number(
            t.availableStock !== undefined
              ? t.availableStock
              : t.currentStock !== undefined
                ? t.currentStock
                : 0,
          ),
          branch: t.branch || selectedBranch || "Main Campus",
        }));
        setUniforms((prev) => {
          const apiIds = new Set(mappedUniforms.map((u: any) => u.id));
          const localOnly = (prev || []).filter((u: any) => !apiIds.has(u.id));
          return [...localOnly, ...mappedUniforms];
        });
      }
      if (dists.length) {
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
          academicYear: d.academicYear || "2026-2027",
          branch: d.branch || selectedBranch || "Main Campus",
          notes: d.notes || d.actionRemarks || "",
          type: d.transactionType?.includes("Baseline")
            ? "Base Package"
            : "Additional Purchase",
          price: Number(d.totalAmount || 0),
        }));
        setStudentUniformIssues((prev) => {
          const apiIds = new Set(mappedDists.map((d: any) => d.id));
          const localOnly = (prev || []).filter((d: any) => !apiIds.has(d.id));
          return [...mappedDists, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch uniform data from API", err);
    }
  };

  const fetchSchoolEventsData = async () => {
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
  };

  const fetchHolidaysData = async () => {
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
  };

  const fetchAnnouncementsData = async () => {
    try {
      const response: any = await fetchNotificationsApi();
      const items = Array.isArray(response)
        ? response
        : response?.data?.items || response?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setAnnouncements((prev) => {
          const apiIds = new Set(items.map((i: any) => i.id));
          const localOnly = (prev || []).filter((i: any) => !apiIds.has(i.id));
          return [...items, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch announcements from API", err);
    }
  };

  const fetchMeetingsData = async () => {
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
  };

  const fetchFinanceData = async () => {
    try {
      const [headsRes, structsRes, assignmentsRes, paymentsRes] =
        await Promise.allSettled([
          FinanceAPI.fetchFeeHeadsApi(),
          FinanceAPI.fetchDynamicFeeStructuresApi(),
          FinanceAPI.fetchStudentFeeAssignmentsApi(),
          FinanceAPI.fetchFeePaymentsApi(),
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
      if (heads.length) setFeeHeads(heads);
      if (structs.length) {
        setDynamicFeeStructures((prev) => {
          const merged = [...prev];
          structs.forEach((apiItem: any) => {
            const idx = merged.findIndex(
              (m) =>
                m.id === apiItem.id ||
                (m.className &&
                  apiItem.className &&
                  m.className.toLowerCase().trim() ===
                    apiItem.className.toLowerCase().trim()),
            );
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...apiItem };
            } else {
              merged.push(apiItem);
            }
          });
          return merged;
        });
      }
      if (assignments.length) setDbAssignments(assignments);
      if (payments.length) setFeePayments(payments);
    } catch (err) {
      console.warn("Failed to fetch finance data from API", err);
    }
  };

  const fetchFacultyTrainingData = async () => {
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
            branch: w.branch || "Main Campus",
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
              branch: a.branchFilter || a.branch || "Main Campus",
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
  };

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

      // Always fetch students (handles ward lookup for parents)
      fetchStudents();

      if (!isParentOrStudent) {
        fetchAcademicClasses();
        fetchSubjects();
        fetchPeriods();
        fetchDepartments();
        fetchDesignations();
      }
    }
    const allowedAdmissionsRoles = [
      "Super Admin",
      "Admin",
      "Principal",
      "Receptionist",
    ];
    if (isAuthenticated && allowedAdmissionsRoles.includes(role)) {
      fetchAdmissions();
      fetchStaff();
    }
  }, [isAuthenticated, role]);

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
    setSchoolProfile((prev) => ({ ...prev, ...profile }));
    logActivity(
      "Updated School Profile",
      "Updated school contact and settings",
    );
  };

  const addStudent = (
    stData: Omit<Student, "id">,
    skipApiCall = false,
  ): Student => {
    const id = "STU-" + Math.floor(100 + Math.random() * 900);
    const newStudent: Student = {
      ...stData,
      id,
      branch: stData.branch || selectedBranch || "Main Campus",
      studentType: stData.studentType || "Day Scholar",
      promotionHistory: stData.promotionHistory || [],
    };

    if (!skipApiCall) {
      createStudentApi({
        admissionNumber:
          newStudent.admissionNo ||
          `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        rollNumber: newStudent.rollNo || "00",
        studentName:
          `${newStudent.firstName || ""} ${newStudent.lastName || ""}`.trim(),
        dateOfBirth: newStudent.dob || undefined,
        gender: newStudent.gender || "Male",
        fatherName: newStudent.parentName || "",
        fatherMobile:
          (newStudent as any).parentPhone || (newStudent as any).mobile || "",
        email: newStudent.email || undefined,
        mobileNumber:
          (newStudent as any).parentPhone || (newStudent as any).mobile || "",
        address: newStudent.address || "",
        branchId: 1,
        academicYearId: 1,
        classId: 1,
        sectionId: 1,
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
        selectedAcademicYear || financeSettings.academicYear || "2026-2027",
      );
    }, 100);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const oldStudent = students.find((s) => s.id === id);
    const numericId = parseInt(id, 10);

    if (!isNaN(numericId) && oldStudent) {
      const fullStudent = { ...oldStudent, ...updates };
      updateStudentApi(numericId, {
        admissionNumber: fullStudent.admissionNo || "ADM-00",
        rollNumber: fullStudent.rollNo || "00",
        studentName:
          `${fullStudent.firstName || ""} ${fullStudent.lastName || ""}`.trim(),
        dateOfBirth: fullStudent.dob || undefined,
        gender: fullStudent.gender || "Male",
        fatherName: fullStudent.parentName || "",
        fatherMobile:
          (fullStudent as any).parentPhone || (fullStudent as any).mobile || "",
        email: fullStudent.email || undefined,
        mobileNumber:
          (fullStudent as any).parentPhone || (fullStudent as any).mobile || "",
        address: fullStudent.address || "",
        branchId: 1,
        academicYearId: 1,
        classId: 1,
        sectionId: 1,
        status: fullStudent.status || "Active",
      }).catch((err) => console.error("Failed to update student", err));
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );

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
    targetYear = "2026-2027",
    targetBranch = "Main Campus",
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const historyItem: PromotionHistoryItem = {
            id: "PROM-" + Date.now().toString().slice(-6),
            fromClass: s.className,
            toClass: targetClass,
            fromSection: s.section,
            toSection: targetSection,
            fromBranch: s.branch || "Main Campus",
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
      completionAcademicYear || schoolProfile.academicYear || "2025-2026";
    const batchYear =
      finalYear.split("-")[1] || finalYear.split("-")[0] || "2026";
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
        branch: targetStudent.branch || selectedBranch || "Main Campus",
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
    const subjects = teacher.assignedSubjects || [];
    const teacherFullName =
      teacher.name || `${teacher.firstName} ${teacher.lastName}`;

    const norm = (n: string) =>
      n.toLowerCase().replace(/\s+/g, "").replace(/class/gi, "");

    setTeacherAssignments((prev) => {
      // 1. Filter out assignments for this teacher that are no longer in their workload lists
      let next = prev.filter((ta) => {
        if (ta.teacherId !== teacher.id) return true;
        const classSecKey = `${ta.className}-${ta.section}`;
        const hasClass = classes.includes(classSecKey);
        const hasSubject = subjects.includes(ta.subject);
        return hasClass && hasSubject;
      });

      // 2. Upsert assignments for classes and subjects they are assigned to
      classes.forEach((classSec) => {
        const parts = classSec.split("-");
        const className = parts[0]?.trim();
        const section = parts[1]?.trim() || "A";

        subjects.forEach((subject) => {
          const existingIdx = next.findIndex(
            (ta) =>
              ta.className === className &&
              ta.section === section &&
              ta.subject === subject,
          );

          if (existingIdx > -1) {
            next[existingIdx] = {
              ...next[existingIdx],
              teacherId: teacher.id,
              teacherName: teacherFullName,
              status: "Active",
            };
          } else {
            const taId = "TA-" + Math.floor(100 + Math.random() * 900);
            next.push({
              id: taId,
              academicYear: "2026-2027",
              branch: teacher.branch || "Main Campus",
              className,
              section,
              subject,
              teacherId: teacher.id,
              teacherName: teacherFullName,
              status: "Active",
            });
          }
        });
      });

      return next;
    });

    // 3. Auto-map subjects to class curriculum
    classes.forEach((classSec) => {
      const parts = classSec.split("-");
      const className = parts[0]?.trim();

      const classObj = academicClasses.find(
        (c) => norm(c.name) === norm(className),
      );
      if (classObj) {
        let subjectsUpdated = false;
        const updatedSubjects = [...(classObj.subjects || [])];

        subjects.forEach((subject) => {
          if (!updatedSubjects.includes(subject)) {
            updatedSubjects.push(subject);
            subjectsUpdated = true;

            mapSubjectApi(classObj.id, {
              subject_name: subject,
              weekly_periods: 5,
            }).catch((err) => {
              console.error(
                `Failed to map subject "${subject}" to class "${classObj.name}":`,
                err,
              );
            });
          }
        });

        if (subjectsUpdated) {
          setAcademicClasses((prev) => {
            const next = prev.map((c) =>
              c.id === classObj.id ? { ...c, subjects: updatedSubjects } : c,
            );
            localStorage.setItem(
              "edu_db_academic_classes",
              JSON.stringify(next),
            );
            return next;
          });
        }
      }
    });
  };

  const addStaff = (staffData: Omit<Staff, "id">): Staff => {
    const id = "STF-" + Math.floor(100 + Math.random() * 900);
    const newStaff: Staff = {
      ...staffData,
      id,
      branch: staffData.branch || selectedBranch || "Main Campus",
      profileStatus: staffData.profileStatus || "Incomplete",
    };

    createStaffApi({
      employeeId: staffData.empId,
      employeeCategory:
        staffData.employeeCategory === "Teacher"
          ? "Teaching Staff"
          : "Non-Teaching Staff",
      firstName: staffData.firstName,
      middleName: staffData.middleName || "",
      lastName: staffData.lastName,
      email: staffData.email?.trim() || null,
      phone: staffData.phone,
      alternateMobile: staffData.alternateMobile || null,
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
      aadhaarNumber: staffData.aadhaarNumber,
      panNumber: staffData.panNumber,
      presentAddress: staffData.presentAddress || null,
      permanentAddress: staffData.permanentAddress || null,
      city: staffData.city || null,
      state: staffData.state || null,
      pinCode: staffData.pinCode || null,
      country: staffData.country || "India",
      accountHolderName: staffData.bankDetails?.accountHolderName || "",
      accountNumber: staffData.bankDetails?.accountNumber || "",
      bankName: staffData.bankDetails?.bankName || "",
      branchName: staffData.bankDetails?.branch || "",
      ifscCode: staffData.bankDetails?.ifscCode || "",
      upiId: staffData.bankDetails?.upiId || "",
      assignedClasses: staffData.assignedClasses || [],
      assignedSubjects: staffData.assignedSubjects || [],
    })
      .then((response) => {
        if (response && response.success && response.data) {
          setStaff((prev) =>
            prev.map((s) =>
              s.empId === newStaff.empId
                ? {
                    ...s,
                    id:
                      response.data.staffId?.toString() ||
                      response.data.id?.toString() ||
                      s.id,
                  }
                : s,
            ),
          );
          // Sync actual ID as well if it changed from generated fake ID
          if (isTeachingStaff(newStaff)) {
            syncTeacherAssignments({ ...newStaff, id: actualId });
          }
        }
      })
      .catch((err) => {
        console.error("Failed to create staff in backend", err);
      });

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
          alternateMobile: fullStaff.alternateMobile || null,
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
          aadhaarNumber: fullStaff.aadhaarNumber,
          panNumber: fullStaff.panNumber,
          presentAddress: fullStaff.presentAddress || null,
          permanentAddress: fullStaff.permanentAddress || null,
          city: fullStaff.city || null,
          state: fullStaff.state || null,
          pinCode: fullStaff.pinCode || null,
          country: fullStaff.country || "India",
          accountHolderName: fullStaff.bankDetails?.accountHolderName || "",
          accountNumber: fullStaff.bankDetails?.accountNumber || "",
          bankName: fullStaff.bankDetails?.bankName || "",
          branchName: fullStaff.bankDetails?.branch || "",
          ifscCode: fullStaff.bankDetails?.ifscCode || "",
          upiId: fullStaff.bankDetails?.upiId || "",
          assignedClasses: fullStaff.assignedClasses || [],
          assignedSubjects: fullStaff.assignedSubjects || [],
        }).catch((err) => {
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
  const addAdmission = async (
    appData: Omit<AdmissionApplication, "id" | "applicationNo">,
    options?: { silent?: boolean },
  ) => {
    try {
      let isoDob = new Date().toISOString();
      if (appData.dob) {
        if (appData.dob instanceof Date) {
          if (!isNaN(appData.dob.getTime())) isoDob = appData.dob.toISOString();
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
      const appliedClassId = matchedClass ? Number(String(matchedClass.id).replace(/\D/g, "")) : 1;

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
        houseNo: appData.addressHouseNo || "",
        street: appData.addressStreet || "",
        areaLocality: appData.addressArea || "",
        city: appData.addressCity || "",
        district: appData.addressDistrict || "",
        state: appData.addressState || "",
        pinCode: appData.addressPinCode || "",
        numberOfSiblings: appData.siblingsCount || 0,
        siblingStudentId: "N/A",
        studentType: appData.studentType || "Day Scholar",
        transportRequired: !!appData.transportRequired,
        transportType: appData.transportType || "N/A",
        busRoute: appData.busRoute || "N/A",
        pickupPoint: appData.pickupPoint || "N/A",
        dropPoint: appData.dropPoint || "N/A",
        hostelBlock: appData.hostelBlock || "N/A",
        hostelRoom: appData.hostelRoom || "N/A",
        floorLevel: "N/A",
        allocatedBedId: appData.hostelBed || "N/A",
        branch: appData.branch || selectedBranch || "Main Campus",
        avatar: appData.avatar || "",
        scholarshipId: appData.scholarshipId || "",
        discountId: appData.discountId || "",
        selectedOptionalFees: appData.selectedOptionalFees || [],
      };

      const json = await createAdmissionApi(payload);

      if (json && json.success !== false) {
        const createdApp: AdmissionApplication = {
          id:
            json?.data?.applicationId?.toString() ||
            json?.data?.id?.toString() ||
            Math.random().toString(),
          applicationNo:
            json?.data?.registrationNo ||
            (appData as any).applicationNo ||
            `ADM2026-${Math.floor(100 + Math.random() * 900)}`,
          registrationNo:
            json?.data?.registrationNo || (appData as any).applicationNo || "",
          ...appData,
          selectedOptionalFees: appData.selectedOptionalFees || [],
        } as AdmissionApplication;

        setAdmissions((prev) => [
          createdApp,
          ...prev.filter((a) => a.id !== createdApp.id),
        ]);

        logActivity(
          "New Admission Application",
          `Received application from ${appData.applicantName}`,
        );
        if (!options?.silent) {
          addToast(
            "success",
            "Application Submitted",
            "New admission application has been registered.",
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
      const appliedClassId = matchedClass ? Number(String(matchedClass.id).replace(/\D/g, "")) : 1;

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
        houseNo: appData.addressHouseNo || "",
        street: appData.addressStreet || "",
        areaLocality: appData.addressArea || "",
        city: appData.addressCity || "",
        district: appData.addressDistrict || "",
        state: appData.addressState || "",
        pinCode: appData.addressPinCode || "",
        numberOfSiblings: appData.siblingsCount || 0,
        siblingStudentId: "N/A",
        studentType: appData.studentType || "Day Scholar",
        transportRequired: !!appData.transportRequired,
        transportType: appData.transportType || "N/A",
        busRoute: appData.busRoute || "N/A",
        pickupPoint: appData.pickupPoint || "N/A",
        hostelBlock: appData.hostelBlock || "N/A",
        hostelRoom: appData.hostelRoom || "N/A",
        availableBed: appData.hostelBed || "N/A",
        scholarship:
          (appData as any).scholarship || appData.scholarshipId || "None",
        discount: (appData as any).discount || appData.discountId || "None",
        avatar: appData.avatar || "",
        isLateAdmission: !!appData.isLateAdmission,
        feeCalculationMethod: appData.feeCalculationMethod || "Term-wise",
        selectedOptionalFees: appData.selectedOptionalFees || [],
        documentsSubmitted: appData.documentsSubmitted || [],
      };

      await updateAdmissionApi(parseInt(id, 10), payload);

      setAdmissions((prev) =>
        prev.map((a) => (a.id === id ? (appData as AdmissionApplication) : a)),
      );
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
      await deleteAdmissionApi(parseInt(id, 10));
      setAdmissions((prev) => prev.filter((a) => a.id !== id));
      logActivity("Deleted Admission Record", `Removed application ID ${id}`);
    } catch (err) {
      addToast(
        "error",
        "API Sync Failed",
        "Failed to delete admission from server.",
      );
      setAdmissions((prev) => prev.filter((a) => a.id !== id)); // Local fallback
    }
  };

  const updateAdmissionStatus = async (
    id: string,
    status: AdmissionApplication["status"],
  ): Promise<string | null> => {
    const app = admissions.find((a) => a.id === id);
    if (!app) return null;

    const appIdNumeric = parseInt(id, 10);

    try {
      let json: any;
      if (status === "Enrolled") {
        json = await enrollAdmissionApi(appIdNumeric);
      } else if (status === "Rejected") {
        json = await rejectAdmissionApi(appIdNumeric);
      } else {
        const registrationNo = (app as any).registrationNo || app.applicationNo;
        json = await updateAdmissionStatusApi(registrationNo, status);
      }

      if (json && json.success !== false) {
        let enrolledStudentId: string | null = null;
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
              : "Main Campus Area";

          // --- DYNAMIC FEE CALCULATION & ASSIGNMENT SETUP ---
          const clsName = app.appliedClass || "Class 1";
          const dfs =
            dynamicFeeStructures.find(
              (d) => d.className === clsName && d.status === "Active",
            ) || dynamicFeeStructures[0];
          const baseItems = dfs
            ? dfs.items
            : [
                {
                  feeHeadId: "FH-01",
                  feeHeadName: "Tuition Fee",
                  amount: 77000,
                },
                {
                  feeHeadId: "FH-02",
                  feeHeadName: "Admission Fee",
                  amount: 3000,
                },
                {
                  feeHeadId: "FH-03",
                  feeHeadName: "Textbook & Material Fee",
                  amount: 3000,
                },
                {
                  feeHeadId: "FH-04",
                  feeHeadName: "Uniform & Sports Kit Fee",
                  amount: 3500,
                },
              ];

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
          if (
            (app.studentType === "Day Scholar" ||
              app.studentType === "Non-Residential") &&
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
            const pFee =
              pObj && (pObj.monthlyFee ?? 0) > 0
                ? (pObj.monthlyFee ?? 0)
                : ftc
                  ? ftc.feeAmount
                  : 5500;
            additionalFees += pFee;
          } else if (
            (app.studentType === "Hosteller" ||
              app.studentType === "Residential") &&
            app.hostelBed
          ) {
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
            additionalFees += fhc ? fhc.hostelFee : 40000;
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
                )?.amount || 25000;
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
            const dObj = discounts.find((d) => d.id === app.discountId);
            if (dObj && dObj.status === "Active") {
              const tuitionFeeAmount =
                assignedFeeHeads.find(
                  (i) =>
                    i.feeHeadId === "FH-001" ||
                    i.feeHeadName === "Tuition Fee" ||
                    i.feeHeadId === "FH-01",
                )?.amount || 25000;
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

          const newStudent = addStudent(
            {
              admissionNo:
                app.applicationNo ||
                "ADM2026-" + Math.floor(100 + Math.random() * 900),
              rollNo: "",
              firstName: (() => {
                const parts = (app.applicantName || "").trim().split(" ");
                return app.firstName || parts[0] || "Enrolled";
              })(),
              lastName: (() => {
                const parts = (app.applicantName || "").trim().split(" ");
                return app.lastName || parts.slice(1).join(" ") || "";
              })(),
              gender: app.gender || "Male",
              dob: app.dob || "15/08/2012",
              bloodGroup: app.bloodGroup || "O+",
              religion: app.religion || "General",
              casteCategory: app.casteCategory || "General",
              className: app.appliedClass || "Class 1",
              section: "",
              category: app.casteCategory || "General",
              status: "Active",
              avatar:
                app.avatar ||
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
              joiningDate:
                app.joiningDate ||
                app.admissionDate ||
                app.submissionDate ||
                new Date().toISOString().split("T")[0],
              isLateAdmission: !!app.isLateAdmission,
              feeCalculationMethod: app.feeCalculationMethod || "Term-wise",
              branch: app.branch || "Main Campus",
              studentType: app.studentType || "Day Scholar",
              transportRequired: app.transportRequired,
              routeId: app.routeId,
              busRoute: app.busRoute || "Route A - North Suburbs",
              transportType: app.transportType || "AC",
              pickupPointId: app.pickupPointId,
              pickupPoint: app.pickupPoint || "",
              dropPoint: app.dropPoint || "",
              hostelBlock: app.hostelBlock || "",
              hostelRoom: app.hostelRoom || "",
              hostelBed: app.hostelBed || "",
              boardType: "CBSE",
              fatherName: app.parentName || "Father Name",
              fatherPhone: app.phone || "9876543210",
              fatherOccupation: "Business",
              motherName: app.motherName || "Mother Name",
              motherPhone: app.phone || "9876543210",
              email: app.email,
              phone: app.phone,
              alternatePhone: app.alternatePhone,
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
            branch: newStudent.branch || selectedBranch || "Main Campus",
            academicYear: dfs?.academicYear || "2025-2026",
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

          // Auto-assign transport facility if Day Scholar opted for transport
          if (
            (app.studentType === "Day Scholar" ||
              app.studentType === "Non-Residential") &&
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
                  : 5500;
            assignStudentTransport({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              routeId: rObj?.id || "RM-01",
              routeName: rObj?.routeName || app.busRoute || "Route A",
              pickupPoint:
                pObj?.pickupName || app.pickupPoint || "Miyapur Junction",
              feePlan: (ftc?.feePlan || "Quarterly") as any,
              feeAmount: trpFee,
              effectiveFrom: new Date().toISOString().split("T")[0],
              status: "Active",
            });
          }

          // Auto-assign hostel facility if Hosteller or Residential
          if (
            (app.studentType === "Hosteller" ||
              app.studentType === "Residential") &&
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

          // Automatically generate Student Fee Ledger for newly enrolled student
          setTimeout(
            () => generateStudentFeeLedger(newStudent.id, newStudent),
            50,
          );
        }

        // Update state to match API success
        setAdmissions((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a)),
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
      console.error("Error updating admission status", err);
      addToast(
        "error",
        "Network Error",
        err.message || "Failed to update application status.",
      );
    }
    return null;
  };

  const addAcademicClass = async (clsData: Omit<AcademicClass, "id">) => {
    try {
      const payload = {
        name: clsData.name,
        class_name: clsData.name,
        campus_location:
          (clsData as any).campus ||
          (clsData as any).branch ||
          selectedBranch ||
          "Main Campus",
        academic_year:
          (clsData as any).academicYear || selectedAcademicYear || "2026-2027",
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
    // Update local state immediately to avoid race conditions and provide instant UI updates
    setAcademicClasses((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      localStorage.setItem("edu_db_academic_classes", JSON.stringify(next));
      return next;
    });

    try {
      const numericId = id.startsWith("CL-") ? id.replace("CL-", "") : id;

      // Find the existing class in state to get the current name and other fields
      const existingClass = academicClasses.find((c) => c.id === id);
      const currentName =
        (existingClass as any)?.className || existingClass?.name || "";
      const finalName =
        (updates as any)?.className || updates.name || currentName;

      const payload = {
        name: finalName,
        class_name: finalName,
        display_order:
          (updates as any).displayOrder !== undefined
            ? (updates as any).displayOrder
            : (existingClass as any)?.displayOrder || 0,
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
      branch: (subjectData as any).branch || selectedBranch || "Main Campus",
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
      branch: (busData as any).branch || selectedBranch || "Main Campus",
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

  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>(
    defaultPeriodSettings,
  );
  const [teacherAssignments, setTeacherAssignments] = useState<
    TeacherAssignment[]
  >(() => getStored("teacher_assignments", defaultTeacherAssignments));

  useEffect(() => {
    localStorage.setItem(
      "edu_db_teacher_assignments",
      JSON.stringify(teacherAssignments),
    );
  }, [teacherAssignments]);

  useEffect(() => {
    localStorage.setItem("edu_db_timetable", JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem(
      "edu_db_period_settings",
      JSON.stringify(periodSettings),
    );
  }, [periodSettings]);

  const addPeriodSetting = (data: Omit<PeriodSetting, "id">) => {
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

    const id = "PS-" + Math.floor(100 + Math.random() * 900);
    const newPs: PeriodSetting = { ...data, id };
    setPeriodSettings((prev) => [...prev, newPs]);
    logActivity(
      "Created Period Setting",
      `Added ${newPs.periodName} (${newPs.startTime}-${newPs.endTime})`,
    );
  };

  const updatePeriodSetting = (id: string, updates: Partial<PeriodSetting>) => {
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
  };

  const deletePeriodSetting = (id: string) => {
    setPeriodSettings((prev) => prev.filter((p) => p.id !== id));
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

  const addTeacherAssignment = (data: Omit<TeacherAssignment, "id">) => {
    const id = "TA-" + Math.floor(100 + Math.random() * 900);
    const newTa: TeacherAssignment = { ...data, id };
    setTeacherAssignments((prev) => [
      ...prev.filter(
        (t) =>
          !(
            t.className === data.className &&
            t.section === data.section &&
            t.subject === data.subject
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
    setTeacherAssignments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTeacherAssignment = (id: string) => {
    setTeacherAssignments((prev) => prev.filter((t) => t.id !== id));
  };

  const publishClassTimetable = (
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
  };
  const addUniform = (itemData: Omit<UniformItem, "id">) => {
    const id = "UNI-" + Date.now();
    const createdAt = new Date().toISOString();
    const catName = itemData.category || itemData.name || "Uniform Item";
    const newItem: UniformItem = {
      ...itemData,
      id,
      createdAt,
      category: catName,
    };
    setUniforms((prev) => [newItem, ...prev]);

    // Automatically sync with uniformCategories so it appears in category lists & dropdowns
    setUniformCategories((prev) => {
      if (
        prev.some(
          (c) => c.name === catName || (c as any).categoryName === catName,
        )
      )
        return prev;
      const ucId = "UC-" + Date.now();
      return [
        {
          id: ucId,
          createdAt,
          name: catName,
          categoryName: catName,
          description: `Uniform ${catName}`,
          status: "Active",
          branch: (itemData as any).branch || selectedBranch || "Main Campus",
        } as any,
        ...prev,
      ];
    });

    // Automatically sync with uniformInventory so Dashboard Available Stock updates immediately
    const stockVal = Number(itemData.availableStock) || 0;
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
      branch: (itemData as any).branch || selectedBranch || "Main Campus",
    } as any;
    setUniformInventory((prev) => [...prev, newInvItem]);
  };

  const updateUniform = (id: string, updates: Partial<UniformItem>) => {
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
  };

  const deleteUniform = (id: string) => {
    setUniforms((prev) => {
      const targetItem = prev.find((u) => u.id === id);
      const targetName = (targetItem?.category || targetItem?.name || "")
        .toLowerCase()
        .trim();
      const updatedU = prev.filter((u) => u.id !== id);
      try {
        localStorage.setItem("edu_db_uniforms", JSON.stringify(updatedU));
      } catch (e) {}

      if (targetName) {
        setUniformCategories((prevCats) => {
          const updatedCats = prevCats.filter(
            (c) =>
              (c.name || (c as any).categoryName || "").toLowerCase().trim() !==
              targetName,
          );
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
        });

        setUniformInventory((prevInv) => {
          const updatedInv = prevInv.filter(
            (inv) =>
              inv.itemId !== id &&
              (inv.itemName || inv.category || "").toLowerCase().trim() !==
                targetName,
          );
          try {
            localStorage.setItem(
              "edu_db_uniform_inventory",
              JSON.stringify(updatedInv),
            );
          } catch (e) {}
          return updatedInv;
        });
      }

      return updatedU;
    });
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
      branch: (feeStruct as any).branch || selectedBranch || "Main Campus",
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
    FinanceAPI.createFeePaymentApi(paymentData).catch((err) => {
      console.warn("Fee payment API failed, continuing with local state", err);
    });
    const id = "PAY-" + Math.floor(100 + Math.random() * 900);
    const receiptNo =
      financeSettings.receiptPrefix + Math.floor(1000 + Math.random() * 9000);
    const activeAY =
      selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

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
        const instIndex = nextInstallments.findIndex(
          (i) => i.id === allocItem.installmentId,
        );
        if (instIndex !== -1) {
          const inst = { ...nextInstallments[instIndex] };
          const allocAmount = Math.min(inst.dueAmount, allocItem.amount);
          remainingAmountToAllocate -= allocAmount;

          inst.paidAmount += allocAmount;
          inst.dueAmount = Math.max(0, inst.dueAmount - allocAmount);
          inst.status = inst.dueAmount <= 0 ? "Paid" : "Partial";
          inst.updatedAt = new Date().toISOString();

          nextInstallments[instIndex] = inst;

          const ledgerIndex = nextLedgers.findIndex(
            (l) =>
              l.studentId === paymentData.studentId &&
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
                l.studentId === paymentData.studentId &&
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
            i.studentId === paymentData.studentId &&
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
        inst.status = inst.dueAmount === 0 ? "Paid" : "Partial";
        inst.updatedAt = new Date().toISOString();

        // Find parent ledger for this installment
        const ledgerIndex = nextLedgers.findIndex(
          (l) =>
            l.studentId === paymentData.studentId &&
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
              l.studentId === paymentData.studentId &&
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
        .filter((l) => l.studentId === paymentData.studentId)
        .sort((a, b) => a.academicYear.localeCompare(b.academicYear));

      studentLedgers.forEach((ledger) => {
        if (remainingAmountToAllocate <= 0) return;

        // Make sure the ledger has installments
        let insts = ledger.installments || [];
        if (insts.length === 0) {
          const assignment = studentFeeAssignments.find(
            (a) =>
              a.studentId === ledger.studentId &&
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
      paymentAllocation: paymentData.paymentAllocation || allocations,
      branch: (paymentData as any).branch || selectedBranch || "Main Campus",
    } as any;

    setFeePayments((prev) => {
      const next = [newPayment, ...prev];
      localStorage.setItem("edu_db_fee_payments", JSON.stringify(next));
      return next;
    });

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
      .filter((l) => l.studentId === paymentData.studentId)
      .reduce((sum, l) => sum + (l.dueBalance || 0), 0);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === paymentData.studentId) {
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
      branch: (newPayment as any).branch || selectedBranch || "Main Campus",
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

    setFinanceTransactions((prev) => [autoLedgerTxn, ...prev]);

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
      "TXN-2026-" + Math.floor(100000 + Math.random() * 900000);
    const newTxn: FinanceTransaction = {
      ...txnData,
      id,
      transactionId,
      branch: txnData.branch || selectedBranch || "Main Campus",
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
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  };

  const addFinancialCategory = (
    categoryData: Omit<FinancialCategory, "id">,
  ) => {
    const id = "CAT-" + Math.floor(100 + Math.random() * 900);
    const newCat: FinancialCategory = { ...categoryData, id };
    setFinancialCategories((prev) => [...prev, newCat]);
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
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const updateFinancialBudget = (id: string, allocatedAmount: number) => {
    setFinancialBudgets((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const remaining = Math.max(0, allocatedAmount - b.consumedAmount);
          return {
            ...b,
            allocatedAmount,
            remainingAmount: remaining,
            status: b.consumedAmount > allocatedAmount ? "Exceeded" : "Active",
          };
        }
        return b;
      }),
    );
  };

  // ==========================================
  // ERP FINANCE SYSTEM CRUD & ENGINE
  // ==========================================

  // 1. Fee Types CRUD
  const addFeeHead = async (head: Omit<FeeHead, "id">) => {
    try {
      const response = await FinanceAPI.createFeeHeadApi(head);
      const newHead: FeeHead = {
        ...head,
        id: response?.id || "FH-" + Math.floor(100 + Math.random() * 900),
        applicableBranches:
          head.applicableBranches && head.applicableBranches.length > 0
            ? head.applicableBranches
            : [selectedBranch || "Main Campus"],
      };
      setFeeHeads((prev) => [...prev, newHead]);
      logActivity(
        "Created Fee Head",
        `Added ${newHead.name} (${(newHead as any).code || ""})`,
      );
    } catch (err) {
      console.warn("API failed, using local", err);
      const id = "FH-" + Math.floor(100 + Math.random() * 900);
      const newHead: FeeHead = {
        ...head,
        id,
        applicableBranches:
          head.applicableBranches && head.applicableBranches.length > 0
            ? head.applicableBranches
            : [selectedBranch || "Main Campus"],
      };
      setFeeHeads((prev) => [...prev, newHead]);
      logActivity(
        "Created Fee Head",
        `Added ${newHead.name} (${(newHead as any).code || ""})`,
      );
    }
  };

  const updateFeeHead = (id: string, updates: Partial<FeeHead>) => {
    setFeeHeads((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
    logActivity("Updated Fee Head", `Updated Fee Head ID ${id}`);
  };

  const deleteFeeHead = (id: string) => {
    setFeeHeads((prev) => prev.filter((f) => f.id !== id));
    logActivity("Deleted Fee Head", `Removed Fee Head ID ${id}`);
  };

  const toggleFeeHeadStatus = (id: string) => {
    setFeeHeads((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: f.status === "Active" ? "Inactive" : "Active" }
          : f,
      ),
    );
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
          branch: st.branch || selectedBranch || "Main Campus",
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
      branch: dfs.branch || selectedBranch || "Main Campus",
    };
    setDynamicFeeStructures((prev) => {
      const idx = prev.findIndex(
        (d) =>
          d.id === id ||
          (d.className &&
            newDfs.className &&
            d.className.toLowerCase().trim() ===
              newDfs.className.toLowerCase().trim()),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newDfs;
        return next;
      }
      return [...prev, newDfs];
    });
    applyFeeStructureToClassStudents(newDfs);
    logActivity(
      "Created Dynamic Fee Structure",
      `Added structure for ${newDfs.className}`,
    );
  };

  const updateDynamicFeeStructure = (
    id: string,
    updates: Partial<DynamicFeeStructure>,
  ) => {
    const existing = dynamicFeeStructures.find((d) => d.id === id);
    const updatedDfs: DynamicFeeStructure = {
      ...(existing ||
        ({ id, className: "", items: [], totalAmount: 0 } as any)),
      ...updates,
    };

    setDynamicFeeStructures((prev) =>
      prev.map((d) => (d.id === id ? updatedDfs : d)),
    );
    applyFeeStructureToClassStudents(updatedDfs);
    logActivity("Updated Dynamic Fee Structure", `Updated structure ID ${id}`);
  };

  const deleteDynamicFeeStructure = (id: string) => {
    setDynamicFeeStructures((prev) => prev.filter((d) => d.id !== id));
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
      branch: st.branch || selectedBranch || "Main Campus",
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

    // Pro-rata multiplier calculation
    let proRataFactor = 1.0;
    if (feePolicy === "Pro-rata" && admissionDate) {
      const admMonth = new Date(admissionDate).getMonth() + 1; // 1-12
      // Standard academic year June (6) to May (5) = 12 months
      const remainingMonths = Math.max(
        1,
        12 - (admMonth >= 6 ? admMonth - 6 : admMonth + 6),
      );
      proRataFactor = remainingMonths / 12;
    } else if (feePolicy === "Term-wise" && admissionDate) {
      const admMonth = new Date(admissionDate).getMonth() + 1;
      proRataFactor = admMonth <= 9 ? 0.67 : 0.33;
    }

    dfs.items.forEach((item) => {
      const orig = item.amount;
      originalTotal += orig;
      let assignedAmt = orig;
      let isProRataEligible = false;

      // Fee head configuration check: Monthly / Quarterly / Term heads are pro-rata eligible
      const hNameLower = item.feeHeadName.toLowerCase();
      const categoryLower = (item.category || "").toLowerCase();
      if (
        hNameLower.includes("tuition") ||
        hNameLower.includes("transport") ||
        hNameLower.includes("mess") ||
        hNameLower.includes("monthly") ||
        categoryLower.includes("tuition") ||
        categoryLower.includes("transport") ||
        categoryLower.includes("mess")
      ) {
        isProRataEligible = true;
      }

      if (feePolicy === "Custom" && customBreakdown) {
        const found = customBreakdown.find(
          (c) =>
            c.feeHeadId === item.feeHeadId ||
            c.feeHeadName === item.feeHeadName,
        );
        if (found && typeof found.assignedAmount === "number") {
          assignedAmt = found.assignedAmount;
        }
      } else if (feePolicy === "Pro-rata" || feePolicy === "Term-wise") {
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
        category: item.feeHeadName.includes("Tuition")
          ? "Tuition Fee"
          : item.feeHeadName.includes("Transport")
            ? "Transport Fee"
            : "Other Fee",
        originalAmount: orig,
        assignedAmount: assignedAmt,
        adjustmentAmount: assignedAmt - orig,
        isEligibleForProRata: isProRataEligible,
      });

      assignedHeads.push({
        ...item,
        amount: assignedAmt,
      });
    });

    const id = "SFA-" + Math.floor(100 + Math.random() * 900);
    const assignment: StudentFeeAssignment = {
      id,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      branch: st.branch || selectedBranch || "Main Campus",
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

    logActivity(
      "Assigned Fee Policy",
      `Assigned ${feePolicy} (${formatCurrency(assignedTotal)}) to ${st.firstName} ${st.lastName} for ${dfs.academicYear}`,
    );

    setTimeout(() => generateStudentFeeLedger(studentId, dfs.academicYear), 50);
  };

  const bulkAssignFeeStructure = (
    studentIds: string[],
    feeStructureId: string,
  ) => {
    studentIds.forEach((id) => assignFeeStructure(id, feeStructureId));
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
  const addScholarship = (sch: Omit<Scholarship, "id">) => {
    const id = "SCH-" + Math.floor(100 + Math.random() * 900);
    const newSch: Scholarship = { ...sch, id };
    setScholarships((prev) => [...prev, newSch]);
    logActivity("Created Scholarship", `Added scholarship ${newSch.name}`);
  };

  const updateScholarship = (id: string, updates: Partial<Scholarship>) => {
    setScholarships((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const deleteScholarship = (id: string) => {
    setScholarships((prev) => prev.filter((s) => s.id !== id));
  };

  const assignScholarshipToStudent = (
    studentId: string,
    scholarshipId: string,
  ) => {
    const st = students.find((s) => s.id === studentId);
    const sch = scholarships.find((s) => s.id === scholarshipId);
    if (!st || !sch) return;

    const id = "SSCH-" + Math.floor(100 + Math.random() * 900);
    const newAlloc: StudentScholarship = {
      id,
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

  const revokeStudentScholarship = (id: string) => {
    setStudentScholarships((prev) => prev.filter((s) => s.id !== id));
  };

  // 5. Discounts & Concessions CRUD
  const addDiscount = (disc: Omit<Discount, "id">) => {
    const id = "DSC-" + Math.floor(100 + Math.random() * 900);
    const newDisc: Discount = { ...disc, id };
    setDiscounts((prev) => [...prev, newDisc]);
  };

  const updateDiscount = (id: string, updates: Partial<Discount>) => {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  };

  const deleteDiscount = (id: string) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  const assignDiscountToStudent = (studentId: string, discountId: string) => {
    const disc = discounts.find((d) => d.id === discountId);
    if (!disc) return;

    const id = "SDSC-" + Math.floor(100 + Math.random() * 900);
    const newAlloc: StudentDiscount = {
      id,
      studentId,
      discountId,
      discountName: disc.name,
      appliedDate: new Date().toISOString().split("T")[0],
    };
    setStudentDiscounts((prev) => [
      ...prev.filter(
        (d) => d.studentId !== studentId || d.discountId !== discountId,
      ),
      newAlloc,
    ]);

    setTimeout(() => recalculateStudentFeeLedger(studentId), 50);
  };

  const removeStudentDiscount = (id: string) => {
    setStudentDiscounts((prev) => prev.filter((d) => d.id !== id));
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
      branch: (route as any).branch || selectedBranch || "Main Campus",
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
        ) || pickupPoints[0];
      const pickupPointIdInt = pickupObj
        ? parseInt(pickupObj.id.replace(/\D/g, ""), 10) || 1
        : 1;

      const vaObj =
        vehicleAssignments.find((va) => va.routeId === st.routeId) ||
        vehicleAssignments[0];
      const vaIdInt = vaObj
        ? parseInt(vaObj.id.replace(/\D/g, ""), 10) || 1
        : 1;

      const payload = {
        studentId: studentIdInt || 1,
        routeId: routeIdInt || 1,
        pickupPointId: pickupPointIdInt || 1,
        vehicleAssignmentId: vaIdInt || 1,
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
        branch: (st as any).branch || selectedBranch || "Main Campus",
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
        branch: (st as any).branch || selectedBranch || "Main Campus",
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
      branch: (h as any).branch || selectedBranch || "Main Campus",
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
      branch: (rmData as any).branch || selectedBranch || "Main Campus",
    } as any;
    setRoomMasters((prev) => [newRm, ...prev]);
    logActivity(
      "Added Room Master",
      `Created room #${newRm.roomNumber} in ${newRm.hostelName}`,
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
      `Assigned ${newSha.studentName} to Room #${newSha.roomNo}`,
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
  };

  const updateFinanceHostelConfig = (
    id: string,
    updates: Partial<FinanceHostelConfig>,
  ) => {
    setFinanceHostelConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const deleteFinanceHostelConfig = (id: string) => {
    setFinanceHostelConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  // 10. Student Hostel Assignment
  const assignStudentHostel = (sh: Omit<StudentHostel, "id">) => {
    const id = "SHST-" + Math.floor(100 + Math.random() * 900);
    const newAssignment: StudentHostel = {
      ...sh,
      id,
      branch: (sh as any).branch || selectedBranch || "Main Campus",
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
    const refundNo = "RF-2026-" + Math.floor(1000 + Math.random() * 9000);
    const newRefund: Refund = {
      ...r,
      id,
      refundNo,
      branch: (r as any).branch || selectedBranch || "Main Campus",
    } as any;
    setRefunds((prev) => [newRefund, ...prev]);
    logActivity(
      "Requested Refund",
      `Created refund request ${refundNo} for ${formatCurrency(r.amount)}`,
    );
  };

  const updateRefundStatus = (
    id: string,
    status: Refund["status"],
    approvedBy = "Admin User",
  ) => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, approvedBy } : r)),
    );
  };

  // 12. Settings
  const updateFinanceSettings = (settings: Partial<FinanceSettings>) => {
    setFinanceSettings((prev) => ({ ...prev, ...settings }));
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
      branch: (c as any).branch || selectedBranch || "Main Campus",
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

  const generateInstallmentsForStudent = (
    studentId: string,
    academicYear: string,
    assignment: StudentFeeAssignment | undefined,
    ledger: StudentFeeLedger,
  ): StudentFeeInstallment[] => {
    let schedule = academicYearFeeSchedules.find(
      (s) => s.academicYear === academicYear,
    );
    if (!schedule && academicYearFeeSchedules.length > 0) {
      const baseSchedule = academicYearFeeSchedules[0];
      const targetStartYear = parseInt(academicYear.split("-")[0]) || 2024;
      const baseStartYear =
        parseInt(baseSchedule.academicYear.split("-")[0]) || 2026;
      const yearDiff = targetStartYear - baseStartYear;

      const shiftDate = (dateStr: string): string => {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const y = parseInt(parts[0]);
        return `${y + yearDiff}-${parts[1]}-${parts[2]}`;
      };

      schedule = {
        ...baseSchedule,
        academicYear,
        id: `SCH-VIRTUAL-${academicYear}`,
        terms: baseSchedule.terms.map((t) => ({
          ...t,
          id: `${t.id}-virtual-${academicYear}`,
          startDate: shiftDate(t.startDate),
          endDate: shiftDate(t.endDate),
          dueDate: shiftDate(t.dueDate),
        })),
        monthlyConfig: baseSchedule.monthlyConfig
          ? {
              ...baseSchedule.monthlyConfig,
              monthDueDates: baseSchedule.monthlyConfig.monthDueDates.map(
                (m) => ({
                  ...m,
                  dueDate: shiftDate(m.dueDate),
                }),
              ),
            }
          : undefined,
        annualDueDate: baseSchedule.annualDueDate
          ? shiftDate(baseSchedule.annualDueDate)
          : undefined,
        oneTimeDueDate: baseSchedule.oneTimeDueDate
          ? shiftDate(baseSchedule.oneTimeDueDate)
          : undefined,
      };
    }

    const ayStartYear = parseInt(academicYear.split("-")[0]) || 2026;

    const monthlyConfig =
      schedule?.monthlyConfig || buildDefaultMonthlyConfig(academicYear, 10);
    const annualDueDate =
      schedule?.annualDueDate ||
      schedule?.terms[0]?.dueDate ||
      `${ayStartYear}-04-15`;
    const oneTimeDueDate =
      schedule?.oneTimeDueDate ||
      schedule?.terms[0]?.dueDate ||
      `${ayStartYear}-04-15`;

    const terms =
      schedule?.terms && schedule.terms.length > 0
        ? [...schedule.terms].sort((a, b) => a.sequence - b.sequence)
        : [
            {
              id: `T1-${academicYear}`,
              termName: "Term 1",
              startDate: `${ayStartYear}-04-01`,
              endDate: `${ayStartYear}-06-30`,
              dueDate: `${ayStartYear}-04-15`,
              sequence: 1,
              status: "Active" as const,
            },
            {
              id: `T2-${academicYear}`,
              termName: "Term 2",
              startDate: `${ayStartYear}-07-01`,
              endDate: `${ayStartYear}-09-30`,
              dueDate: `${ayStartYear}-07-15`,
              sequence: 2,
              status: "Active" as const,
            },
            {
              id: `T3-${academicYear}`,
              termName: "Term 3",
              startDate: `${ayStartYear}-10-01`,
              endDate: `${ayStartYear}-12-31`,
              dueDate: `${ayStartYear}-10-15`,
              sequence: 3,
              status: "Active" as const,
            },
            {
              id: `T4-${academicYear}`,
              termName: "Term 4",
              startDate: `${ayStartYear + 1}-01-01`,
              endDate: `${ayStartYear + 1}-03-31`,
              dueDate: `${ayStartYear + 1}-01-15`,
              sequence: 4,
              status: "Active" as const,
            },
          ];

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

    const rawAdmissionDate =
      (student as any)?.admissionDate ||
      admApp?.admissionDate ||
      student?.joiningDate ||
      admApp?.joiningDate ||
      admApp?.submissionDate ||
      "";

    const admissionDate = normalizeToISODate(rawAdmissionDate);
    const firstTermStart = terms[0]?.startDate || `${ayStartYear}-04-01`;

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
      (student as any)?.feeCalculationMethod ||
      admApp?.feeCalculationMethod ||
      assignment?.feePolicy ||
      "Remaining Terms";

    const feeCalculationMethod =
      rawMethod === "Monthly" ? "Monthly" : "Remaining Terms";

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
        if (
          item.headId &&
          fh.id &&
          fh.id.toLowerCase() === item.headId.toLowerCase()
        )
          return true;
        if (
          item.headName &&
          fh.name &&
          fh.name.toLowerCase() === item.headName.toLowerCase()
        )
          return true;
        if (
          item.category &&
          fh.category &&
          (item.category.toLowerCase() === fh.category.toLowerCase() ||
            item.category.toLowerCase().includes(fh.category.toLowerCase()))
        )
          return true;
        if (
          item.headName &&
          fh.name &&
          (item.headName.toLowerCase().includes(fh.name.toLowerCase()) ||
            fh.name.toLowerCase().includes(item.headName.toLowerCase()))
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

      // 1. ONE TIME
      if (frequency === "One Time") {
        installments.push({
          id: `INST-${studentId}-${academicYear}-${item.headId}-onetime`,
          studentId,
          academicYear,
          feeAssignmentId: assignment?.id || "SYNTHETIC",
          feeHeadId: item.headId,
          feeHeadName: item.headName,
          frequency: "One Time",
          termId: "ONETIME",
          termName: "One Time",
          dueDate: oneTimeDueDate,
          amount: finalAmount,
          paidAmount: 0,
          dueAmount: finalAmount,
          status: "Pending",
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
          dueDate: annualDueDate,
          amount: finalAmount,
          paidAmount: 0,
          dueAmount: finalAmount,
          status: "Pending",
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
          dueDate: annualDueDate,
          amount: finalAmount,
          paidAmount: 0,
          dueAmount: finalAmount,
          status: "Pending",
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

            const termMonthMap: Record<number, number[]> = {
              1: [0, 1, 2],
              2: [3, 4, 5],
              3: [6, 7, 8],
              4: [9, 10, 11],
            };

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
        const totalTermsCount = terms.length || 4;
        const standardTermFee = Math.floor(finalAmount / totalTermsCount);

        let applicableTerms = terms;

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
            const admTime = new Date(admissionDate).getTime();

            const admIso = normalizeToISODate(admissionDate);
            applicableTerms = terms.filter((term) => {
              const termDueIso = normalizeToISODate(term.dueDate);
              const termEndIso = normalizeToISODate(term.endDate);

              if (termDueIso && admIso > termDueIso) return false;
              if (termEndIso && admIso > termEndIso) return false;
              return true;
            });
            if (applicableTerms.length === 0) {
              applicableTerms = [terms[terms.length - 1]];
            }

            const termMonthIndices: Record<number, number[]> = {
              1: [0, 1, 2],
              2: [3, 4, 5],
              3: [6, 7, 8],
              4: [9, 10, 11],
            };

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
                  termName: `Q${qNumber} (${term.termName})`,
                  dueDate: term.dueDate,
                  amount: amt,
                  paidAmount: 0,
                  dueAmount: amt,
                  status: "Pending",
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
            applicableTerms = terms.filter((term) => {
              const termEndIso = normalizeToISODate(term.endDate);
              if (!termEndIso) return true;
              return admIso <= termEndIso;
            });
            if (applicableTerms.length === 0) {
              applicableTerms = [terms[terms.length - 1]];
            }

            applicableTerms.forEach((term, tIdx) => {
              const amt = standardTermFee;
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
                termName: `Q${qNumber} (${term.termName})`,
                dueDate: term.dueDate,
                amount: amt,
                paidAmount: 0,
                dueAmount: amt,
                status: "Pending",
                isLateAdmission,
                feeCalculationMethod: "Remaining Terms",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            });
          }
        } else {
          // Regular (Not Late Admission)
          applicableTerms.forEach((term, tIdx) => {
            const amt = standardTermFee;
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
              termName: `Q${qNumber} (${term.termName})`,
              dueDate: term.dueDate,
              amount: amt,
              paidAmount: 0,
              dueAmount: amt,
              status: "Pending",
              isLateAdmission: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        }
      }
      // 5. HALF-YEARLY
      else if (frequency === "Half-Yearly") {
        let applicableTerms = terms;

        if (isLateAdmission && admissionDate) {
          const admTime = new Date(admissionDate).getTime();
          applicableTerms = terms.filter((term) => {
            if (!term.endDate) return true;
            return new Date(term.endDate).getTime() >= admTime;
          });
        }

        const count = Math.min(2, Math.max(1, applicableTerms.length));
        const baseAmt = Math.floor(finalAmount / count);

        for (let h = 0; h < count; h++) {
          const term = applicableTerms[h] || terms[0];
          const amt =
            h === count - 1 ? finalAmount - baseAmt * (count - 1) : baseAmt;

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
    const studentPayments = feePayments
      .filter(
        (p) =>
          p.studentId === studentId &&
          (p.academicYear === academicYear || !p.academicYear),
      )
      .sort(
        (a, b) =>
          new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
      );

    studentPayments.forEach((payment) => {
      if (payment.paymentAllocation && payment.paymentAllocation.length > 0) {
        payment.paymentAllocation.forEach((alloc) => {
          if (alloc.academicYear === academicYear) {
            let remaining = alloc.amount;
            installments
              .filter((inst) => inst.dueAmount > 0)
              .forEach((inst) => {
                if (remaining <= 0) return;
                const pay = Math.min(inst.dueAmount, remaining);
                inst.paidAmount += pay;
                inst.dueAmount -= pay;
                inst.status = inst.dueAmount === 0 ? "Paid" : "Partial";
                remaining -= pay;
              });
          }
        });
      } else {
        let remaining = payment.amountPaid;
        installments
          .filter((inst) => inst.dueAmount > 0)
          .forEach((inst) => {
            if (remaining <= 0) return;
            const pay = Math.min(inst.dueAmount, remaining);
            inst.paidAmount += pay;
            inst.dueAmount -= pay;
            inst.status = inst.dueAmount === 0 ? "Paid" : "Partial";
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
      "2026-2027";
    const ledger = getStudentFeeLedger(studentId, activeAY);
    const schedule =
      academicYearFeeSchedules.find((s) => s.academicYear === activeAY) ||
      academicYearFeeSchedules[0];

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
      "2026-2027";
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

  // ==========================================
  // PERMANENT STUDENT FEE LEDGER GENERATOR & RECALCULATOR
  // ==========================================

  const buildStudentFeeLedgerObject = (
    studentId: string,
    optStudentOrYear?: Student | string,
    targetAcademicYear?: string,
  ): StudentFeeLedger => {
    let optStudent: Student | undefined = undefined;
    let targetYear: string =
      targetAcademicYear ||
      selectedAcademicYear ||
      financeSettings.academicYear ||
      "2026-2027";

    if (typeof optStudentOrYear === "string") {
      targetYear = optStudentOrYear;
    } else if (optStudentOrYear && typeof optStudentOrYear === "object") {
      optStudent = optStudentOrYear;
    }

    const student =
      students.find(
        (s) =>
          s.id === studentId ||
          s.admissionNo === studentId ||
          (s as any).applicationNo === studentId ||
          (s as any).registrationNo === studentId,
      ) ||
      (optStudent && (optStudent as any).firstName
        ? (optStudent as Student)
        : undefined);

    const admApp =
      admissions.find(
        (a) =>
          a.id === studentId ||
          a.applicationNo === studentId ||
          (a as any).registrationNo === studentId ||
          (a as any).studentId === studentId ||
          (student &&
            (student.admissionNo === a.applicationNo ||
              student.admissionNo === (a as any).registrationNo ||
              student.id === a.id)) ||
          (student &&
            a.applicantName &&
            a.applicantName.trim().toLowerCase() ===
              `${student.firstName} ${student.lastName}`.trim().toLowerCase()),
      ) ||
      (optStudent && (optStudent as any).applicantName
        ? (optStudent as AdmissionApplication)
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
      "Class 10";
    const secName = admApp?.section || student?.section || "A";
    const admNo =
      student?.admissionNo ||
      admApp?.applicationNo ||
      (admApp as any)?.registrationNo ||
      (optStudent as any)?.admissionNo ||
      (optStudent as any)?.applicationNo ||
      (typeof studentId === "string" && studentId.length > 3
        ? studentId
        : "ADM-2026-001");

    const rawStName =
      (admApp?.applicantName || "").trim() ||
      `${admApp?.firstName || ""} ${admApp?.lastName || ""}`.trim() ||
      (admApp as any)?.name ||
      `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
      (student as any)?.name ||
      (student as any)?.applicantName ||
      (optStudent as any)?.applicantName ||
      (optStudent as any)?.name ||
      "";

    const stName =
      rawStName && rawStName.toLowerCase() !== "student"
        ? rawStName
        : admissions.find(
              (a) => a.id === studentId || a.applicationNo === studentId,
            )?.applicantName ||
            students.find(
              (s) => s.id === studentId || s.admissionNo === studentId,
            )?.firstName
          ? `${students.find((s) => s.id === studentId || s.admissionNo === studentId)?.firstName} ${students.find((s) => s.id === studentId || s.admissionNo === studentId)?.lastName}`.trim()
          : "Enrolled Student";

    const cleanCls = (clsName || "").replace(/[-\s][A-Z]$/i, "").trim();
    const dfs =
      dynamicFeeStructures.find(
        (d) => d.className.trim() === cleanCls && d.status === "Active",
      ) ||
      dynamicFeeStructures.find((d) => d.className.trim() === cleanCls) ||
      dynamicFeeStructures.find(
        (d) => d.className === clsName && d.status === "Active",
      ) ||
      dynamicFeeStructures.find((d) => d.className === clsName);

    const dfsUniformFee = dfs?.items?.find(
      (i) =>
        i.feeHeadName?.toLowerCase().includes("uniform") ||
        i.feeHeadName?.toLowerCase().includes("kit") ||
        i.feeHeadName?.toLowerCase().includes("accessories"),
    )?.amount;

    // Uniform Fee configuration lookup
    const uniformConfig = financeUniformConfigs.find(
      (c) =>
        c.status === "Active" &&
        c.academicYear === (financeSettings.academicYear || "2025-2026") &&
        c.className === clsName &&
        (c.gender === "Unisex" || c.gender === (student?.gender || "Male")),
    );
    const defaultClassUniformFee = getUniformPackageFeeByClass(clsName);

    const uniformAmount = uniformConfig
      ? uniformConfig.feeAmount
      : dfsUniformFee !== undefined && dfsUniformFee > 0
        ? dfsUniformFee
        : defaultClassUniformFee;

    // Helper to identify uniform fee heads
    const isUniformHead = (headName: string) => {
      const lower = headName.toLowerCase();
      return (
        lower.includes("uniform") ||
        lower.includes("kit") ||
        lower.includes("accessories")
      );
    };

    const selectedOptional = admApp ? admApp.selectedOptionalFees || [] : null;

    const isUniformOpted = (
      optList: string[] | null | undefined,
      hId?: string,
      hName?: string,
    ) => {
      if (optList === null || optList === undefined) return true;
      if (Array.isArray(optList) && optList.length === 0) return false;
      if (hId && optList.includes(hId)) return true;
      if (
        hName &&
        optList.some(
          (id) =>
            id.toLowerCase().includes("uniform") ||
            id.toLowerCase().includes("kit"),
        )
      )
        return true;
      return optList.some(
        (id) =>
          id === "FH-04" ||
          id === "FH-004" ||
          id.includes("UNI") ||
          id.includes("04"),
      );
    };

    // 1. Base Fee Structure
    const assignment = studentFeeAssignments.find(
      (a) => a.studentId === studentId && a.status === "Active",
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
          ? selectedOptional !== null
            ? isUniformOpted(selectedOptional, h.feeHeadId, h.feeHeadName)
            : false
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
          headName: isUni ? "Uniform & Accessories" : h.feeHeadName,
          category:
            h.category ||
            (h.feeHeadName.includes("Tuition")
              ? "Tuition Fee"
              : h.feeHeadName.includes("Admission")
                ? "Admission Fee"
                : h.feeHeadName.includes("Book")
                  ? "Books Fee"
                  : isUni
                    ? "Uniform Fee"
                    : h.feeHeadName.includes("Lab")
                      ? "Lab Fee"
                      : h.feeHeadName.includes("Sports")
                        ? "Sports Fee"
                        : "Other Fee"),
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

    if (dfs && dfs.items && dfs.items.length > 0) {
      dfs.items.forEach((i) => {
        const exists = ledgerItems.some(
          (item) =>
            (item.headId && i.feeHeadId && item.headId === i.feeHeadId) ||
            (item.headName &&
              i.feeHeadName &&
              item.headName.toLowerCase() === i.feeHeadName.toLowerCase()),
        );
        if (!exists) {
          const isUni = isUniformHead(i.feeHeadName);
          const isSelected = isUni
            ? selectedOptional !== null
              ? isUniformOpted(selectedOptional, i.feeHeadId, i.feeHeadName)
              : false
            : true;
          const uniFee = isUni
            ? getUniformFeeForClass(
                clsName || student?.className || "",
                student?.gender || "Male",
                financeUniformConfigs,
                dynamicFeeStructures,
              )
            : 0;
          const itemAmount = isUni && uniFee > 0 ? uniFee : i.amount;

          ledgerItems.push({
            headId: i.feeHeadId,
            headName: isUni ? "Uniform & Accessories" : i.feeHeadName,
            category: i.feeHeadName.includes("Tuition")
              ? "Tuition Fee"
              : i.feeHeadName.includes("Admission")
                ? "Admission Fee"
                : i.feeHeadName.includes("Book")
                  ? "Books Fee"
                  : isUni
                    ? "Uniform Fee"
                    : i.feeHeadName.includes("Lab")
                      ? "Lab Fee"
                      : i.feeHeadName.includes("Sports")
                        ? "Sports Fee"
                        : "Other Fee",
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
        }
      });
    }

    ledgerItems = ledgerItems.filter(
      (item) =>
        item.headName !== "ADD EXAM FEE" &&
        item.headName !== "Fee Head" &&
        item.headName !== "Fee Head:",
    );

    if (ledgerItems.length === 0) {
      const isUniSelected = isUniformOpted(
        selectedOptional,
        "FH-04",
        "Uniform & Sports Kit Fee",
      );
      ledgerItems = [
        {
          headId: "FH-01",
          headName: "Tuition Fee",
          category: "Tuition Fee",
          originalAmount: 77000,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: 77000,
          isApplicable: true,
          status: "Pending",
        },
        {
          headId: "FH-02",
          headName: "Admission Fee",
          category: "Admission Fee",
          originalAmount: 3000,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: 3000,
          isApplicable: true,
          status: "Pending",
        },
        {
          headId: "FH-03",
          headName: "Textbook & Material Fee",
          category: "Books Fee",
          originalAmount: 3000,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: 3000,
          isApplicable: true,
          status: "Pending",
        },
        {
          headId: "FH-04",
          headName: "Uniform & Sports Kit Fee",
          category: "Uniform Fee",
          originalAmount: uniformAmount,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: isUniSelected ? uniformAmount : 0,
          isApplicable: isUniSelected,
          status: "Pending",
          remarks: isUniSelected
            ? undefined
            : "Optional Fee - Not Selected at Admission",
        },
      ];
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

    // MUTUALLY EXCLUSIVE DECISION:
    // 1. Resident: Hostel applicable ONLY IF active block & room are assigned. Transport is NEVER applicable.
    // 2. Non-Resident: Transport applicable ONLY IF transportRequired === true AND pickupPoint is selected. Hostel is NEVER applicable.

    let transportApplicable = false;
    let activeTransportAssign: any = undefined;

    if (isNonResident) {
      activeTransportAssign = studentTransports.find(
        (t) => t.studentId === studentId && t.status === "Active",
      );

      const isTransportRequired =
        Boolean(activeTransportAssign) ||
        (student?.transportRequired === true &&
          Boolean(
            (student as any)?.busRoute || (student as any)?.pickupPoint,
          )) ||
        ((admApp as any)?.transportRequired === true &&
          Boolean((admApp as any)?.busRoute || (admApp as any)?.pickupPoint));

      const hasPickupPoint = Boolean(
        activeTransportAssign?.pickupPoint ||
        (student as any)?.pickupPoint ||
        (admApp as any)?.pickupPoint,
      );

      if (isTransportRequired && hasPickupPoint) {
        transportApplicable = true;
        if (!activeTransportAssign) {
          activeTransportAssign = {
            id: `STRP-AUTO-${studentId}`,
            studentId,
            studentName:
              `${student?.firstName || admApp?.firstName || "Student"} ${student?.lastName || admApp?.lastName || ""}`.trim(),
            admissionNo:
              student?.admissionNo || admApp?.applicationNo || "ADM-001",
            routeId:
              (student as any)?.routeId || (admApp as any)?.routeId || "RM-01",
            routeName:
              (student as any)?.busRoute ||
              (admApp as any)?.busRoute ||
              (admApp as any)?.routeName ||
              "Route 1",
            pickupPoint:
              (student as any)?.pickupPoint ||
              (admApp as any)?.pickupPoint ||
              "Main Stop",
            feePlan: "Monthly",
            feeAmount: 5500,
            effectiveFrom:
              student?.joiningDate || admApp?.admissionDate || "2026-04-01",
            status: "Active",
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

      const hasHostelBlock = Boolean(
        hstBlockName && hstBlockName.trim() !== "",
      );
      const hasHostelRoom = Boolean(hstRoomName && hstRoomName.trim() !== "");

      if (hasHostelBlock && hasHostelRoom) {
        const roomType =
          (activeHostelAssign as any)?.roomTypeName ||
          (student as any)?.roomType ||
          (admApp as any)?.roomType;

        let fhc = financeHostelConfigs.find((c) => {
          if (c.status !== "Active") return false;
          const blockMatch =
            (c.hostelId && String(c.hostelId) === String(hstBlockName)) ||
            (c.hostelName &&
              c.hostelName.toLowerCase() === hstBlockName.toLowerCase()) ||
            (c.hostelName &&
              c.hostelName
                .toLowerCase()
                .includes(hstBlockName.toLowerCase())) ||
            (c.hostelName &&
              hstBlockName.toLowerCase().includes(c.hostelName.toLowerCase()));

          if (!blockMatch) return false;
          if (!roomType) return true;

          return (
            (c.roomTypeName &&
              c.roomTypeName.toLowerCase().trim() ===
                String(roomType).toLowerCase().trim()) ||
            (c.roomTypeName &&
              c.roomTypeName
                .toLowerCase()
                .includes(String(roomType).toLowerCase())) ||
            (c.roomTypeName &&
              String(roomType)
                .toLowerCase()
                .includes(c.roomTypeName.toLowerCase()))
          );
        });

        if (!fhc) {
          fhc =
            financeHostelConfigs.find(
              (c) =>
                c.status === "Active" &&
                ((c.hostelId && String(c.hostelId) === String(hstBlockName)) ||
                  (c.hostelName &&
                    c.hostelName
                      .toLowerCase()
                      .includes(hstBlockName.toLowerCase()))),
            ) || financeHostelConfigs.find((c) => c.status === "Active");
        }

        if (fhc) {
          const hstFee = fhc.hostelFee;
          const secDep =
            fhc.securityDeposit !== undefined ? fhc.securityDeposit : 5000;
          combinedHostelTotal = hstFee + secDep;
          hostelFrequency = fhc.feePlan || (fhc as any).frequency || "Annual";
          hostelApplicable = true;
        }
      }
    }

    // Process Transport Fee Item in ledgerItems
    const existingTrpIdx = ledgerItems.findIndex(
      (item) =>
        item.category === "Transport Fee" ||
        item.headName.toLowerCase().includes("transport"),
    );

    if (transportApplicable && activeTransportAssign) {
      const activeTa = activeTransportAssign;
      const transportConfig = financeTransportConfigs.find(
        (c) =>
          (c.routeId === activeTa.routeId ||
            c.routeName === activeTa.routeName) &&
          (c.pickupPointId === (activeTa as any).pickupPointId ||
            c.pickupName === activeTa.pickupPoint) &&
          c.status === "Active",
      );
      const trpAmount = transportConfig
        ? transportConfig.feeAmount
        : activeTa.feeAmount || 5500;

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

    // Process Hostel Fee Item in ledgerItems
    const existingHstIdx = ledgerItems.findIndex(
      (item) =>
        item.category === "Hostel Fee" ||
        item.headName.toLowerCase().includes("hostel"),
    );

    if (hostelApplicable && combinedHostelTotal > 0) {
      const roomLabel = hstRoomName ? `, Room ${hstRoomName}` : "";
      const hstItem: LedgerFeeItem = {
        headId: "FH-HST",
        headName: `Hostel Fee (${hstBlockName}${roomLabel})`,
        category: "Hostel Fee",
        originalAmount: combinedHostelTotal,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: combinedHostelTotal,
        isApplicable: true,
        status: "Pending",
        frequency: hostelFrequency,
      } as any;

      if (existingHstIdx >= 0) {
        ledgerItems[existingHstIdx] = hstItem;
      } else {
        ledgerItems.push(hstItem);
      }
    } else {
      const remarksText = isNonResident
        ? "Not Applicable for Day Scholars"
        : "Hostel Fee Pending Room Assignment";

      if (existingHstIdx >= 0) {
        ledgerItems[existingHstIdx] = {
          ...ledgerItems[existingHstIdx],
          originalAmount: 0,
          finalAmount: 0,
          isApplicable: false,
          remarks: remarksText,
        };
      } else {
        ledgerItems.push({
          headId: "FH-HST",
          headName: "Hostel Fee & Mess Charges",
          category: "Hostel Fee",
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

    // 3. Deductions: Scholarships & Discounts
    const appliedSchs = studentScholarships.filter(
      (s) => s.studentId === studentId && s.status === "Active",
    );
    let totalSchDeduction = 0;
    appliedSchs.forEach((sch) => {
      totalSchDeduction +=
        sch.discountType === "Percentage"
          ? (25000 * sch.discountValue) / 100
          : sch.discountValue;
    });

    const appliedDiscs = studentDiscounts.filter(
      (d) => d.studentId === studentId,
    );
    let totalDiscDeduction = 0;
    appliedDiscs.forEach((sd) => {
      const dObj = discounts.find((d) => d.id === sd.discountId);
      if (dObj && dObj.status === "Active") {
        totalDiscDeduction +=
          dObj.mode === "Percentage" ? (25000 * dObj.value) / 100 : dObj.value;
      }
    });

    const tuitionItem =
      ledgerItems.find((i) => i.category === "Tuition Fee") || ledgerItems[0];
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

    const existingPayments = feePayments.filter(
      (p) =>
        p.studentId === studentId &&
        (p.academicYear === targetYear || !p.academicYear),
    );
    const paidAmt = existingPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const dueBal = Math.max(0, totalPayable - paidAmt);

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
      scholarshipAmount: totalSchDeduction,
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
    const extraTxns = (financeTransactions || []).filter(
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
    );

    const totalFromTxns = extraTxns.reduce(
      (sum, t) => sum + (t.amount || 0),
      0,
    );

    return Math.max(totalFromIssues, totalFromTxns);
  };

  const getStudentFeeLedger = (
    studentId: string,
    targetAcademicYear?: string,
  ): StudentFeeLedger => {
    const targetYear =
      targetAcademicYear ||
      selectedAcademicYear ||
      financeSettings.academicYear ||
      "2026-2027";
    const existing = studentFeeLedgers.find(
      (l) => l.studentId === studentId && l.academicYear === targetYear,
    );

    const isUniform = (name: string) => {
      const l = name.toLowerCase();
      return (
        l.includes("uniform") || l.includes("kit") || l.includes("accessories")
      );
    };

    if (existing) {
      const admApp = admissions.find(
        (a) =>
          a.id === studentId ||
          a.applicationNo === existing.admissionNo ||
          (a.applicantName &&
            existing.studentName &&
            a.applicantName.trim().toLowerCase() ===
              existing.studentName.trim().toLowerCase()),
      );
      const selectedOptional = admApp
        ? admApp.selectedOptionalFees || []
        : null;

      const isUniformOpted = (
        optList: string[] | null | undefined,
        hId?: string,
        hName?: string,
      ) => {
        if (optList === null || optList === undefined) return true;
        if (Array.isArray(optList) && optList.length === 0) return false;
        if (hId && optList.includes(hId)) return true;
        if (
          hName &&
          optList.some(
            (id) =>
              id.toLowerCase().includes("uniform") ||
              id.toLowerCase().includes("kit"),
          )
        )
          return true;
        return optList.some(
          (id) =>
            id === "FH-04" ||
            id === "FH-004" ||
            id.includes("UNI") ||
            id.includes("04"),
        );
      };

      const assignment = studentFeeAssignments.find(
        (a) => a.studentId === studentId && a.status === "Active",
      );
      const hasUniformInAssignment = assignment?.assignedFeeHeads?.some(
        (h) =>
          isUniform(h.feeHeadName) ||
          h.feeHeadId === "FH-04" ||
          h.feeHeadId === "FH-004",
      );

      const clsName = existing.className;
      const cleanCls = (clsName || "").replace(/[-\s][A-Z]$/i, "").trim();
      const dfs =
        dynamicFeeStructures.find(
          (d) => d.className.trim() === cleanCls && d.status === "Active",
        ) ||
        dynamicFeeStructures.find((d) => d.className.trim() === cleanCls) ||
        dynamicFeeStructures.find((d) => d.className === clsName);

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

        if (
          hasMissingHead ||
          hasAmountMismatch ||
          existing.grossAmount !== dfs.totalAmount
        ) {
          return buildStudentFeeLedgerObject(studentId, targetYear);
        }
      }

      const sanitizedItems = existing.feeItems.map((fi) => {
        if (
          isUniform(fi.headName) &&
          fi.category !== "Additional Uniform Purchase"
        ) {
          const isOptedInApp =
            selectedOptional !== null
              ? isUniformOpted(selectedOptional, fi.headId, fi.headName)
              : true;
          const shouldBeApplicable =
            selectedOptional !== null
              ? isOptedInApp
              : Boolean(hasUniformInAssignment);
          return {
            ...fi,
            isApplicable: shouldBeApplicable,
            finalAmount: shouldBeApplicable ? fi.originalAmount : 0,
            status: fi.status || ("Pending" as const),
            remarks: shouldBeApplicable
              ? undefined
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

      const totalOrig = itemsToReturn.reduce(
        (acc, i) => acc + (i.isApplicable ? i.originalAmount : 0),
        0,
      );
      const totalPay = itemsToReturn.reduce(
        (acc, i) => acc + (i.isApplicable ? i.finalAmount : 0),
        0,
      );
      const dueBal = Math.max(0, totalPay - (existing.paidAmount || 0));

      const updatedLedger: StudentFeeLedger = {
        ...existing,
        feeItems: itemsToReturn,
        totalOriginalAmount: totalOrig,
        grossAmount: totalOrig,
        totalPayable: totalPay,
        dueBalance: dueBal,
      };

      updatedLedger.installments = generateInstallmentsForStudent(
        studentId,
        targetYear,
        assignment,
        updatedLedger,
      );

      return updatedLedger;
    }

    return buildStudentFeeLedgerObject(studentId, targetYear);
  };

  // SINGLE SOURCE OF TRUTH HELPER FOR CONSOLIDATED STUDENT OUTSTANDING DUES
  const getStudentFeeOutstandingSummary = (
    studentId: string,
  ): StudentFeeOutstandingSummary => {
    const student = students.find((s) => s.id === studentId);
    const activeAcademicYear =
      selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

    // All ledgers for this student
    let studentLedgers = studentFeeLedgers.filter(
      (l) => l.studentId === studentId,
    );

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

    // If no ledger exists for active academic year and student exists, synthesize active ledger
    if (
      !ledgersToProcess.some((l) => l.academicYear === activeAcademicYear) &&
      student
    ) {
      const activeAssignment = studentFeeAssignments.find(
        (a) => a.studentId === studentId && a.status === "Active",
      );
      const baseFee = activeAssignment
        ? activeAssignment.baseFeeTotal
        : student.totalFee || 40500;

      let transportAssign = studentTransports.find(
        (t) => t.studentId === studentId && t.status === "Active",
      );
      if (
        !transportAssign &&
        student &&
        (student.transportRequired || (student as any).busRoute)
      ) {
        transportAssign = {
          id: `STRP-AUTO-${studentId}`,
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          routeId: (student as any).routeId || "RM-01",
          routeName: (student as any).busRoute || "Chennai",
          pickupPoint: (student as any).pickupPoint || "chennai",
          feePlan: "Monthly",
          feeAmount: 5500,
          effectiveFrom: student.joiningDate || "2026-04-01",
          status: "Active",
        };
      }
      const transportFee =
        (student.studentType === "Day Scholar" ||
          student.studentType === "Non-Residential") &&
        transportAssign
          ? transportAssign.feeAmount || 0
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

      const gross = baseFee + transportFee + pendingUniformExtrasSynth;
      const paid = student.paidFee || 0;
      const due = Math.max(0, gross - paid);

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
            scholarshipDeduction: 0,
            discountDeduction: 0,
            fineAmount: 0,
            finalAmount: baseFee,
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
        totalOriginalAmount: gross,
        grossAmount: gross,
        totalScholarship: 0,
        totalDiscount: 0,
        totalFine: 0,
        totalPayable: gross,
        paidAmount: paid,
        dueBalance: due,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        scholarshipAmount: 0,
        discountAmount: 0,
        fineAmount: 0,
        previousDue: 0,
      };

      ledgersToProcess.push(synthesizedCurrentLedger);
    }

    // Sort ledgers chronologically by academicYear ascending
    ledgersToProcess.sort((a, b) =>
      a.academicYear.localeCompare(b.academicYear),
    );

    const yearWiseOutstanding: YearWiseOutstandingItem[] = [];
    let currentYearDue = 0;
    let previousYearsDue = 0;

    ledgersToProcess.forEach((l) => {
      let gross = l.totalPayable || l.grossAmount || l.totalOriginalAmount;

      // For the active academic year, dynamically recalculate gross to include active transport/hostel fees
      if (l.academicYear === activeAcademicYear && student) {
        const activeAssignment = studentFeeAssignments.find(
          (a) => a.studentId === studentId && a.status === "Active",
        );
        const baseFee = activeAssignment
          ? activeAssignment.baseFeeTotal
          : l.totalOriginalAmount || student.totalFee || 40500;

        let transportAssign = studentTransports.find(
          (t) => t.studentId === studentId && t.status === "Active",
        );
        if (
          !transportAssign &&
          student &&
          (student.transportRequired || (student as any).busRoute)
        ) {
          transportAssign = {
            id: `STRP-AUTO-${studentId}`,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            admissionNo: student.admissionNo,
            routeId: (student as any).routeId || "RM-01",
            routeName: (student as any).busRoute || "Chennai",
            pickupPoint: (student as any).pickupPoint || "chennai",
            feePlan: "Monthly",
            feeAmount: 5500,
            effectiveFrom: student.joiningDate || "2026-04-01",
            status: "Active",
          };
        }
        const transportFee =
          (student.studentType === "Day Scholar" ||
            student.studentType === "Non-Residential") &&
          transportAssign
            ? transportAssign.feeAmount || 0
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

        const computedGross =
          baseFee + transportFee + hostelFee + pendingUniformExtras;
        gross = Math.max(
          gross,
          computedGross -
            (l.totalScholarship || 0) -
            (l.totalDiscount || 0) +
            (l.totalFine || 0),
        );
      }

      const paid = l.paidAmount || 0;
      const due = Math.max(0, gross - paid);
      const status: "Paid" | "Partial" | "Pending" =
        due === 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";

      yearWiseOutstanding.push({
        academicYear: l.academicYear,
        ledgerId: l.id,
        className: l.className,
        gross,
        paid,
        due,
        status,
      });

      if (l.academicYear === activeAcademicYear) {
        currentYearDue += due;
      } else if (l.academicYear < activeAcademicYear) {
        previousYearsDue += due;
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
        branch: (r as any).branch || selectedBranch || "Main Campus",
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
        branch: (r as any).branch || selectedBranch || "Main Campus",
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
    try {
      // Find all pickup points belonging to this route and delete them from the backend
      const pointsToDelete = pickupPoints.filter((p) => p.routeId === id);
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
        (a) => a.routeId === id,
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

      await TransportAPI.deleteRouteApi(id);
      setRouteMasters((prev) => prev.filter((r) => r.id !== id));
      setPickupPoints((prev) => prev.filter((p) => p.routeId !== id));
      setVehicleAssignments((prev) => prev.filter((a) => a.routeId !== id));
      setStudentTransports((prev) =>
        prev.map((st) =>
          st.routeId === id
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
      logActivity("Deleted Transport Route", `Removed Route ID ${id}`);
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setRouteMasters((prev) => prev.filter((r) => r.id !== id));
      setPickupPoints((prev) => prev.filter((p) => p.routeId !== id));
      setVehicleAssignments((prev) => prev.filter((a) => a.routeId !== id));
      setStudentTransports((prev) =>
        prev.map((st) =>
          st.routeId === id
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
    }
  };

  const toTimeSpanString = (timeStr: string): string => {
    if (!timeStr) return "00:00:00";
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr + ":00";

    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "00:00:00";

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
        routeId: Number(p.routeId) || 0,
        pickupPointName: p.pickupName || "",
        pickupName: p.pickupName || "",
        landmark: (p as any).landmark || "",
        sequenceNo: Number(p.sequenceNumber) || 0,
        sequenceNumber: Number(p.sequenceNumber) || 0,
        pickupTime: toTimeSpanString(
          p.morningPickupTime || p.arrivalTime || "07:30 AM",
        ),
        arrivalTime: toTimeSpanString(
          p.morningPickupTime || p.arrivalTime || "07:30 AM",
        ),
        dropTime: toTimeSpanString(p.eveningDropTime || "04:15 PM"),
        eveningDropTime: toTimeSpanString(p.eveningDropTime || "04:15 PM"),
        morningPickupTime: toTimeSpanString(
          p.morningPickupTime || p.arrivalTime || "07:30 AM",
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
        ...p,
        ...backendData,
        id,
        status:
          backendData.status === true ||
          String(backendData.status).toLowerCase() === "true" ||
          backendData.status === "Active" ||
          p.status === "Active"
            ? "Active"
            : "Inactive",
        branch: (p as any).branch || selectedBranch || "Main Campus",
      } as any;
      setPickupPoints((prev) => [...prev, newPt]);
      logActivity(
        "Created Pickup Point",
        `Added stop ${newPt.pickupName} for ${newPt.routeName}`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "PP-" + Math.floor(100 + Math.random() * 900);
      const newPt: PickupPoint = {
        ...p,
        id,
        branch: (p as any).branch || selectedBranch || "Main Campus",
      } as any;
      setPickupPoints((prev) => [...prev, newPt]);
    }
  };

  const updatePickupPoint = async (
    id: string,
    updates: Partial<PickupPoint>,
  ) => {
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
      if (updates.eveningDropTime !== undefined) {
        const tsVal = toTimeSpanString(updates.eveningDropTime);
        payload.dropTime = tsVal;
        payload.eveningDropTime = tsVal;
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
      setPickupPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setPickupPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    }
  };

  const deletePickupPoint = async (id: string) => {
    try {
      const p = pickupPoints.find((x) => x.id === id);
      await TransportAPI.deletePickupPointApi(id);
      setPickupPoints((prev) => prev.filter((pt) => pt.id !== id));
      if (p) {
        setStudentTransports((prev) =>
          prev.map((st) =>
            st.routeId === p.routeId && st.pickupPoint === p.pickupName
              ? { ...st, pickupPoint: "Unassigned" }
              : st,
          ),
        );
      }
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const p = pickupPoints.find((x) => x.id === id);
      setPickupPoints((prev) => prev.filter((pt) => pt.id !== id));
      if (p) {
        setStudentTransports((prev) =>
          prev.map((st) =>
            st.routeId === p.routeId && st.pickupPoint === p.pickupName
              ? { ...st, pickupPoint: "Unassigned" }
              : st,
          ),
        );
      }
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
        branch: (v as any).branch || selectedBranch || "Main Campus",
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
        branch: (v as any).branch || selectedBranch || "Main Campus",
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
      const id = (
        backendData.id ||
        backendData.driverId ||
        "DRV-" + Math.floor(100 + Math.random() * 900)
      ).toString();
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
        branch: (d as any).branch || selectedBranch || "Main Campus",
      } as any;
      setDriverMasters((prev) => [...prev, newDriver]);
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
        branch: (d as any).branch || selectedBranch || "Main Campus",
      } as any;
      setDriverMasters((prev) => [...prev, newDriver]);
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

      await TransportAPI.updateDriverApi(id, payload);
      setDriverMasters((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setDriverMasters((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      );
    }
  };

  const deleteDriverMaster = async (id: string) => {
    try {
      // Find all assignments referencing this driver and delete them from the backend
      const assignmentsToDelete = vehicleAssignments.filter(
        (a) => a.driverId === id,
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
      setDriverMasters((prev) => prev.filter((d) => d.id !== id));
      setVehicleAssignments((prev) =>
        prev.map((a) =>
          a.driverId === id
            ? {
                ...a,
                driverId: "",
                driverName: "Unassigned",
                driverEmployeeId: "",
              }
            : a,
        ),
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setDriverMasters((prev) => prev.filter((d) => d.id !== id));
      setVehicleAssignments((prev) =>
        prev.map((a) =>
          a.driverId === id
            ? {
                ...a,
                driverId: "",
                driverName: "Unassigned",
                driverEmployeeId: "",
              }
            : a,
        ),
      );
    }
  };

  const addBusAttendant = async (a: Omit<BusAttendantMaster, "id">) => {
    try {
      const payload = {
        employeeId: a.employeeId || "",
        empId: a.employeeId || "",
        attendantName: a.attendantName || "",
        attendantFullName: a.attendantName || "",
        fullName: a.attendantName || "",
        name: a.attendantName || "",
        mobileNumber: a.mobileNumber || "",
        phone: a.mobileNumber || "",
        gender: a.gender || "Female",
        status: a.status === "Active",
      };
      const response = await TransportAPI.createAttendantApi(payload as any);
      const backendData = (response as any)?.data || response || {};
      const id = (
        backendData.id ||
        backendData.attendantId ||
        "ATT-" + Math.floor(100 + Math.random() * 900)
      ).toString();
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
        branch: (a as any).branch || selectedBranch || "Main Campus",
      } as any;
      setBusAttendants((prev) => [...prev, newAttendant]);
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
        branch: (a as any).branch || selectedBranch || "Main Campus",
      } as any;
      setBusAttendants((prev) => [...prev, newAttendant]);
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
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setBusAttendants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      );
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
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
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
    }
  };

  const assignVehicleRouteDriver = async (
    va: Omit<VehicleAssignment, "id">,
  ) => {
    const effectiveBranch = va.branch || selectedBranch || "Main Campus";
    const effectiveAcademicYear =
      va.academicYear || schoolProfile.academicYear || "2026-2027";
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
          existing.status === "Active" &&
          (existing.vehicleId === normalizedAssignment.vehicleId ||
            existing.vehicleNumber === normalizedAssignment.vehicleNumber ||
            existing.routeId === normalizedAssignment.routeId ||
            existing.routeName === normalizedAssignment.routeName ||
            existing.driverId === normalizedAssignment.driverId ||
            existing.driverName === normalizedAssignment.driverName ||
            (normalizedAssignment.attendantId &&
              existing.attendantId === normalizedAssignment.attendantId) ||
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
        attendantId: va.attendantId ? Number(va.attendantId) : null,
        selectRoute: va.routeName || "",
        selectActiveVehicle: va.vehicleNumber || "",
        selectLicensedDriver: va.driverName || "",
        selectBusAttendant: va.attendantName || "",
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
      setVehicleAssignments((prev) => [
        ...deactivateConflicts(prev),
        newAssign,
      ]);
      logActivity(
        "Vehicle Assigned",
        `Assigned ${normalizedAssignment.vehicleNumber} to ${normalizedAssignment.routeName} with ${normalizedAssignment.driverName}${normalizedAssignment.attendantName ? ` and ${normalizedAssignment.attendantName}` : ""}`,
      );
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const id = "VA-" + Math.floor(100 + Math.random() * 900);
      const newAssign: VehicleAssignment = {
        ...normalizedAssignment,
        id,
        branch: effectiveBranch,
        academicYear: effectiveAcademicYear,
        status: normalizedAssignment.status,
      } as any;
      setVehicleAssignments((prev) => [
        ...deactivateConflicts(prev),
        newAssign,
      ]);
    }
  };

  const updateVehicleAssignment = async (
    id: string,
    updates: Partial<VehicleAssignment>,
  ) => {
    try {
      const current = vehicleAssignments.find((a) => a.id === id);
      const merged: VehicleAssignment = {
        ...(current as VehicleAssignment),
        ...(updates as VehicleAssignment),
        id,
        branch:
          updates.branch || current?.branch || selectedBranch || "Main Campus",
        academicYear:
          updates.academicYear ||
          current?.academicYear ||
          schoolProfile.academicYear ||
          "2026-2027",
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
        payload.attendantId = updates.attendantId
          ? Number(updates.attendantId)
          : null;
      }
      if (updates.routeName !== undefined) {
        payload.selectRoute = updates.routeName;
      }
      if (updates.vehicleNumber !== undefined) {
        payload.selectActiveVehicle = updates.vehicleNumber;
      }
      if (updates.driverName !== undefined) {
        payload.selectLicensedDriver = updates.driverName;
      }
      if (updates.attendantName !== undefined) {
        payload.selectBusAttendant = updates.attendantName;
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

      await TransportAPI.updateVehicleAssignmentApi(id, payload as any);
      setVehicleAssignments((prev) => {
        const deactivateConflicts = (
          items: VehicleAssignment[],
        ): VehicleAssignment[] =>
          items.map((existing) => {
            const isActiveConflict =
              existing.id !== id &&
              existing.status === "Active" &&
              merged.status === "Active" &&
              (existing.vehicleId === merged.vehicleId ||
                existing.vehicleNumber === merged.vehicleNumber ||
                existing.routeId === merged.routeId ||
                existing.routeName === merged.routeName ||
                existing.driverId === merged.driverId ||
                existing.driverName === merged.driverName ||
                (merged.attendantId &&
                  existing.attendantId === merged.attendantId) ||
                (merged.attendantName &&
                  existing.attendantName === merged.attendantName));

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

        return deactivateConflicts(prev).map((a) =>
          a.id === id ? sanitized : a,
        );
      });
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      const current = vehicleAssignments.find((a) => a.id === id);
      const merged: VehicleAssignment = {
        ...(current as VehicleAssignment),
        ...(updates as VehicleAssignment),
        id,
        branch:
          updates.branch || current?.branch || selectedBranch || "Main Campus",
        academicYear:
          updates.academicYear ||
          current?.academicYear ||
          schoolProfile.academicYear ||
          "2026-2027",
        status: (updates.status || current?.status || "Active") as
          | "Active"
          | "Inactive",
      };
      setVehicleAssignments((prev) => {
        const deactivateConflicts = (
          items: VehicleAssignment[],
        ): VehicleAssignment[] =>
          items.map((existing) => {
            const isActiveConflict =
              existing.id !== id &&
              existing.status === "Active" &&
              merged.status === "Active" &&
              (existing.vehicleId === merged.vehicleId ||
                existing.vehicleNumber === merged.vehicleNumber ||
                existing.routeId === merged.routeId ||
                existing.routeName === merged.routeName ||
                existing.driverId === merged.driverId ||
                existing.driverName === merged.driverName ||
                (merged.attendantId &&
                  existing.attendantId === merged.attendantId) ||
                (merged.attendantName &&
                  existing.attendantName === merged.attendantName));

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

        return deactivateConflicts(prev).map((a) =>
          a.id === id ? sanitized : a,
        );
      });
    }
  };

  const removeVehicleAssignment = async (id: string) => {
    try {
      await TransportAPI.deleteVehicleAssignmentApi(id);
      setVehicleAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      addToast("error", "API Sync Failed", "Operating in local fallback mode");
      setVehicleAssignments((prev) => prev.filter((a) => a.id !== id));
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
        branch: (vm as any).branch || selectedBranch || "Main Campus",
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
        branch: (vm as any).branch || selectedBranch || "Main Campus",
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

    const matchedTransports = studentTransports.filter(
      (st) =>
        (st.vehicleId === vehicleId ||
          st.vehicleNumber === vehicle?.vehicleNumber) &&
        st.status === "Active",
    );

    const assignedCount = matchedTransports.length;
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
        const adm = (admissions || []).find(
          (a) =>
            a.id === studentId ||
            a.applicationNo === studentId ||
            (a.applicantName &&
              a.applicantName.toLowerCase().includes(studentId.toLowerCase())),
        );
        if (!adm) return undefined;
        const nameParts = (adm.applicantName || "").trim().split(" ");
        return {
          id: adm.id || adm.applicationNo,
          firstName: adm.firstName || nameParts[0] || "Student",
          lastName: adm.lastName || nameParts.slice(1).join(" ") || "",
          admissionNo: adm.applicationNo || adm.id,
          className:
            adm.appliedClass || adm.targetClass || adm.className || "Class 10",
          section: adm.section || "A",
          gender: adm.gender || "Male",
          studentType: "Day Scholar",
          joiningDate:
            adm.admissionDate || new Date().toISOString().split("T")[0],
          dueFee: 0,
          paidFee: 3500,
          totalFee: 35000,
          rollNo: "0",
          fatherName: adm.parentName || "",
          motherName: adm.motherName || "",
          mobile: adm.mobile || "",
          email: adm.email || "",
          address: adm.address || "",
          status: "Active",
          academicYear: adm.academicYear || "2026-2027",
          branch: adm.branch || "Main Campus",
        } as unknown as Student;
      })();
    if (!student) return null;

    const ledger = getStudentFeeLedger(studentId);

    const assignment = studentFeeAssignments.find(
      (a) => a.studentId === studentId && a.status === "Active",
    );
    const baseFee = ledger
      ? ledger.totalOriginalAmount
      : assignment
        ? assignment.baseFeeTotal
        : student.totalFee || 35000;
    const assignedFeeHeads = assignment ? assignment.assignedFeeHeads : [];

    let transportAssign = studentTransports.find(
      (t) => t.studentId === studentId && t.status === "Active",
    );
    if (
      !transportAssign &&
      student &&
      (student.transportRequired || (student as any).busRoute)
    ) {
      transportAssign = {
        id: `STRP-AUTO-${studentId}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        routeId: (student as any).routeId || "RM-01",
        routeName: (student as any).busRoute || "Chennai",
        pickupPoint: (student as any).pickupPoint || "chennai",
        feePlan: "Monthly",
        feeAmount: 5500,
        effectiveFrom: student.joiningDate || "2026-04-01",
        status: "Active",
      };
    }
    let transportFee = 0;
    if (
      (student.studentType === "Day Scholar" ||
        student.studentType === "Non-Residential") &&
      transportAssign
    ) {
      const transportConfig = financeTransportConfigs.find(
        (c) =>
          (c.routeId === transportAssign.routeId ||
            c.routeName === transportAssign.routeName) &&
          (c.pickupPointId === (transportAssign as any).pickupPointId ||
            c.pickupName === transportAssign.pickupPoint) &&
          c.status === "Active",
      );
      transportFee = transportConfig
        ? transportConfig.feeAmount
        : transportAssign.feeAmount || 0;
    }

    const hostelAssign = studentHostels.find(
      (h) => h.studentId === studentId && h.status === "Active",
    );
    const hostelFee =
      (student.studentType === "Hosteller" ||
        student.studentType === "Residential") &&
      hostelAssign
        ? hostelAssign.feeAmount
        : 0;

    const previousDue = Math.max(0, student.dueFee || 0);

    const appliedScholarships = studentScholarships.filter(
      (s) => s.studentId === studentId && s.status === "Active",
    );
    let scholarshipDeduction = ledger ? ledger.totalScholarship : 0;

    const appliedDiscounts = studentDiscounts.filter(
      (d) => d.studentId === studentId,
    );
    let discountDeduction = ledger ? ledger.totalDiscount : 0;

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
    } else {
      const studentScholarshipId =
        student.scholarshipId || appliedScholarships[0]?.scholarshipId;
      const sObj = studentScholarshipId
        ? scholarships.find((s) => s.id === studentScholarshipId)
        : undefined;
      scholarshipId = studentScholarshipId;
      scholarshipName = sObj?.name || "";
      scholarshipDescription = sObj?.description || "";

      const studentDiscountId =
        student.discountId || appliedDiscounts[0]?.discountId;
      const dObj = studentDiscountId
        ? discounts.find((d) => d.id === studentDiscountId)
        : undefined;
      discountId = studentDiscountId;
      discountName = dObj?.name || "";
      discountDescription = dObj?.description || "";
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
      } else if (todayStr > "2026-04-15") {
        earliestOverdueDateStr = "2026-04-15";
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

    const gross = ledger
      ? (ledger.grossAmount || ledger.totalOriginalAmount) + pendingLibraryFines
      : baseFee +
        transportFee +
        hostelFee +
        pendingUniformExtras +
        pendingLibraryFines;
    const sch = ledger ? ledger.scholarshipAmount || 0 : scholarshipDeduction;
    const disc = ledger ? ledger.discountAmount || 0 : discountDeduction;
    const totalPayable = Math.max(0, gross + fineAmount - sch - disc);
    const activeYr =
      selectedAcademicYear || financeSettings.academicYear || "2026-2027";
    const studentPaymentItems = feePayments.filter(
      (p) => p.studentId === studentId,
    );
    const currentYearPayments = studentPaymentItems.filter(
      (p) => p.academicYear === activeYr || !p.academicYear,
    );
    const paidAmount = ledger
      ? ledger.paidAmount
      : currentYearPayments.reduce((acc, p) => acc + p.amountPaid, 0);
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
      uniformFee: pendingUniformExtras,
      previousDue,
      scholarshipDeduction,
      scholarshipsApplied: appliedScholarships,
      discountDeduction,
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
    const ledger = studentFeeLedgers.find((l) => l.studentId === studentId);
    if (!ledger) {
      throw new Error("Fee Ledger not found for student.");
    }
    const sch = scholarships.find((s) => s.id === scholarshipId);
    if (!sch) {
      throw new Error("Scholarship not found.");
    }

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];
    const tuitionAmount = tuitionItem ? tuitionItem.originalAmount : 25000;
    const waiver =
      sch.discountType === "Percentage"
        ? (tuitionAmount * (sch.percentage || 0)) / 100
        : sch.fixedAmount || 0;

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      scholarshipId: sch.id,
      scholarshipName: sch.name,
      scholarshipDescription: sch.description,
      scholarshipAmount: waiver,
      totalScholarship: waiver,
      feeItems: ledger.feeItems.map((item) => {
        if (
          item.category === "Tuition Fee" ||
          item.headId === (tuitionItem?.headId || "")
        ) {
          const finalAmt = Math.max(
            0,
            item.originalAmount - waiver - item.discountDeduction,
          );
          return {
            ...item,
            scholarshipDeduction: waiver,
            finalAmount: finalAmt,
          };
        }
        return item;
      }),
    };

    updatedLedger.totalPayable = Math.max(
      0,
      updatedLedger.grossAmount -
        updatedLedger.scholarshipAmount -
        updatedLedger.discountAmount +
        updatedLedger.fineAmount +
        updatedLedger.previousDue,
    );
    updatedLedger.dueBalance = Math.max(
      0,
      updatedLedger.totalPayable - updatedLedger.paidAmount,
    );

    setStudentFeeLedgers((prev) =>
      prev.map((l) => (l.studentId === studentId ? updatedLedger : l)),
    );
    assignScholarshipToStudent(studentId, scholarshipId);
    return updatedLedger;
  };

  const removeScholarshipFromStudent = (studentId: string) => {
    const ledger = studentFeeLedgers.find((l) => l.studentId === studentId);
    if (!ledger) {
      throw new Error("Fee Ledger not found for student.");
    }

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      scholarshipId: undefined,
      scholarshipName: "",
      scholarshipDescription: "",
      scholarshipAmount: 0,
      totalScholarship: 0,
      feeItems: ledger.feeItems.map((item) => {
        if (
          item.category === "Tuition Fee" ||
          item.headId === (tuitionItem?.headId || "")
        ) {
          const finalAmt = Math.max(
            0,
            item.originalAmount - item.discountDeduction,
          );
          return {
            ...item,
            scholarshipDeduction: 0,
            finalAmount: finalAmt,
          };
        }
        return item;
      }),
    };

    updatedLedger.totalPayable = Math.max(
      0,
      updatedLedger.grossAmount -
        updatedLedger.scholarshipAmount -
        updatedLedger.discountAmount +
        updatedLedger.fineAmount +
        updatedLedger.previousDue,
    );
    updatedLedger.dueBalance = Math.max(
      0,
      updatedLedger.totalPayable - updatedLedger.paidAmount,
    );

    setStudentFeeLedgers((prev) =>
      prev.map((l) => (l.studentId === studentId ? updatedLedger : l)),
    );
    const currentSch = studentScholarships.find(
      (s) =>
        s.studentId === studentId && s.scholarshipId === ledger.scholarshipId,
    );
    if (currentSch) {
      revokeStudentScholarship(currentSch.id);
    }
    return updatedLedger;
  };

  const applyDiscountToStudent = (studentId: string, discountId: string) => {
    const ledger = studentFeeLedgers.find((l) => l.studentId === studentId);
    if (!ledger) {
      throw new Error("Fee Ledger not found for student.");
    }
    const d = discounts.find((x) => x.id === discountId);
    if (!d) {
      throw new Error("Discount not found.");
    }

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];
    const tuitionAmount = tuitionItem ? tuitionItem.originalAmount : 25000;
    const discountAmount =
      d.mode === "Percentage" ? (tuitionAmount * d.value) / 100 : d.value;

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      discountId: d.id,
      discountName: d.name,
      discountDescription: d.description,
      discountAmount: discountAmount,
      totalDiscount: discountAmount,
      feeItems: ledger.feeItems.map((item) => {
        if (
          item.category === "Tuition Fee" ||
          item.headId === (tuitionItem?.headId || "")
        ) {
          const finalAmt = Math.max(
            0,
            item.originalAmount - ledger.scholarshipAmount - discountAmount,
          );
          return {
            ...item,
            discountDeduction: discountAmount,
            finalAmount: finalAmt,
          };
        }
        return item;
      }),
    };

    updatedLedger.totalPayable = Math.max(
      0,
      updatedLedger.grossAmount -
        updatedLedger.scholarshipAmount -
        updatedLedger.discountAmount +
        updatedLedger.fineAmount +
        updatedLedger.previousDue,
    );
    updatedLedger.dueBalance = Math.max(
      0,
      updatedLedger.totalPayable - updatedLedger.paidAmount,
    );

    setStudentFeeLedgers((prev) =>
      prev.map((l) => (l.studentId === studentId ? updatedLedger : l)),
    );
    assignDiscountToStudent(studentId, discountId);
    return updatedLedger;
  };

  const removeDiscountFromStudent = (studentId: string) => {
    const ledger = studentFeeLedgers.find((l) => l.studentId === studentId);
    if (!ledger) {
      throw new Error("Fee Ledger not found for student.");
    }

    const tuitionItem =
      ledger.feeItems.find((i) => i.category === "Tuition Fee") ||
      ledger.feeItems[0];

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      discountId: undefined,
      discountName: "",
      discountDescription: "",
      discountAmount: 0,
      totalDiscount: 0,
      feeItems: ledger.feeItems.map((item) => {
        if (
          item.category === "Tuition Fee" ||
          item.headId === (tuitionItem?.headId || "")
        ) {
          const finalAmt = Math.max(
            0,
            item.originalAmount - item.scholarshipDeduction,
          );
          return {
            ...item,
            discountDeduction: 0,
            finalAmount: finalAmt,
          };
        }
        return item;
      }),
    };

    updatedLedger.totalPayable = Math.max(
      0,
      updatedLedger.grossAmount -
        updatedLedger.scholarshipAmount -
        updatedLedger.discountAmount +
        updatedLedger.fineAmount +
        updatedLedger.previousDue,
    );
    updatedLedger.dueBalance = Math.max(
      0,
      updatedLedger.totalPayable - updatedLedger.paidAmount,
    );

    setStudentFeeLedgers((prev) =>
      prev.map((l) => (l.studentId === studentId ? updatedLedger : l)),
    );
    const currentDisc = studentDiscounts.find(
      (d) => d.studentId === studentId && d.discountId === ledger.discountId,
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
        if (response && response.success && response.data) {
          console.log(
            "DEBUG: fetchDailyAttendance response data:",
            response.data,
          );
          const mappedRecords: DailyAttendance[] = response.data.map(
            (item: any) => ({
              id:
                item.staffAttendanceId?.toString() ||
                item.id?.toString() ||
                Math.random().toString(),
              date: item.date,
              entityType: "Staff",
              entityId: item.staffId?.toString() || item.id?.toString() || "",
              status: item.status === "Half Day" ? "HalfDay" : (item.status === "On Leave" ? "Leave" : item.status),
              remarks: item.remarks || "",
              inTime: item.inTime || "",
              outTime: item.outTime || "",
              department: item.department || "",
              designation: item.designation || "",
            }),
          );

          setAttendance((prev) => {
            const filterDates = mappedRecords.map(
              (r) => `${r.entityId}_${r.date}`,
            );
            const filtered = prev.filter(
              (r) => !filterDates.includes(`${r.entityId}_${r.date}`),
            );
            return [...filtered, ...mappedRecords];
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
        if (response && response.success && response.data) {
          const mappedRecords: DailyAttendance[] = response.data.map(
            (item: any) => ({
              id:
                item.staffAttendanceId?.toString() ||
                item.id?.toString() ||
                Math.random().toString(),
              date: item.date,
              entityType: "Staff",
              entityId: item.staffId?.toString() || item.id?.toString() || "",
              status: item.status === "Half Day" ? "HalfDay" : (item.status === "On Leave" ? "Leave" : item.status),
              remarks: item.remarks || "",
              inTime: item.inTime || "",
              outTime: item.outTime || "",
              department: item.department || "",
              designation: item.designation || "",
            }),
          );

          setAttendance((prev) => {
            const filterDates = mappedRecords.map(
              (r) => `${r.entityId}_${r.date}`,
            );
            const filtered = prev.filter(
              (r) => !filterDates.includes(`${r.entityId}_${r.date}`),
            );
            return [...filtered, ...mappedRecords];
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
      const updated = prev.filter(
        (r) => !filterDates.includes(`${r.entityId}_${r.date}`),
      );
      return [...records, ...updated];
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

        console.log("DEBUG: markAttendance records input:", records);
        setLastAttendancePayload(recordsByDept);

        const savePromises = Object.entries(recordsByDept).map(
          async ([dept, deptRecords]) => {
            const payload = {
              date: date,
              academicYear: selectedAcademicYear || "2026-2027",
              branch: (!selectedBranch || selectedBranch === "All" || selectedBranch === "All Branches") ? "Main Campus" : selectedBranch,
              department: dept,
              records: deptRecords.map((r) => ({
                staffId: parseInt(r.entityId),
                status: r.status === "HalfDay" ? "Half Day" : (r.status === "Leave" ? "On Leave" : r.status),
                remarks: r.remarks || "",
                inTime: r.inTime || "",
                outTime: r.outTime || "",
              })),
            };
            console.log(
              `DEBUG: markAttendance payload for department ${dept}:`,
              payload,
            );
            const res = await markBulkStaffAttendanceApi(payload);
            console.log(`DEBUG: response for department ${dept}:`, res);
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
      branch: (examData as any).branch || selectedBranch || "Main Campus",
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

  const saveMarks = (marksData: Omit<ExamMark, "id">[]) => {
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
          m.branch ||
          exam?.branch ||
          student?.branch ||
          selectedBranch ||
          "Main Campus",
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
        branch:
          scheduleData.branch ||
          exam?.branch ||
          selectedBranch ||
          "Main Campus",
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
      branch: paperData.branch || selectedBranch || "Main Campus",
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
      branch: meetingData.branch || selectedBranch || "Main Campus",
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
    setStudentAttendance((prev) => {
      const filtered = prev.filter((r) => r.studentId !== record.studentId);
      return [...filtered, record];
    });
    logActivity(
      "Saved Student Attendance",
      `Updated attendance for student ID ${record.studentId}`,
    );
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
    const blockedLockedResults = results.filter((r) => {
      const existing = processedResults.find(
        (p) => p.examId === r.examId && p.studentId === r.studentId,
      );
      return existing?.status === "Locked";
    });
    if (blockedLockedResults.length > 0) {
      addToast(
        "error",
        "Results Locked",
        "Unlock results before recalculating this class.",
      );
      return;
    }

    setProcessedResults((prev) => {
      const newKeys = results.map((r) => `${r.examId}_${r.studentId}`);
      const filtered = prev.filter(
        (p) => !newKeys.includes(`${p.examId}_${p.studentId}`),
      );
      return [...filtered, ...results];
    });
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
    setProcessedResults((prev) =>
      prev.map((r) => {
        if (
          r.examId === examId &&
          r.className === className &&
          r.section === section
        ) {
          return {
            ...r,
            status,
            processedAt: stamp,
            publishedAt: status === "Published" ? stamp : r.publishedAt,
            lockedAt: status === "Locked" ? stamp : r.lockedAt,
          };
        }
        return r;
      }),
    );
    if (status === "Published" || status === "Locked") {
      setExamMarks((prev) =>
        prev.map((m) => {
          const student = students.find((s) => s.id === m.studentId);
          return m.examId === examId &&
            student?.className === className &&
            student?.section === section
            ? { ...m, isLocked: true }
            : m;
        }),
      );
    }
    if (status === "Draft") {
      setExamMarks((prev) =>
        prev.map((m) => {
          const student = students.find((s) => s.id === m.studentId);
          return m.examId === examId &&
            student?.className === className &&
            student?.section === section
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

  const addTimetableSlot = (slotData: Omit<TimetableSlot, "id">) => {
    const id = "TT-" + Math.floor(100 + Math.random() * 900);
    const newSlot: TimetableSlot = {
      ...slotData,
      id,
      branch: (slotData as any).branch || selectedBranch || "Main Campus",
    } as any;
    setTimetable((prev) => [...prev, newSlot]);
  };

  const updateTimetableSlot = (id: string, updates: Partial<TimetableSlot>) => {
    setTimetable((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable((prev) => prev.filter((t) => t.id !== id));
  };

  const addHomework = (hwData: Omit<Homework, "id">) => {
    const id = "HW-" + Math.floor(100 + Math.random() * 900);
    const newHw: Homework = {
      ...hwData,
      id,
      branch: (hwData as any).branch || selectedBranch || "Main Campus",
    } as any;
    setHomework((prev) => [newHw, ...prev]);
    logActivity(
      "Posted Homework",
      `Assigned ${newHw.title} for ${newHw.className}`,
    );
  };

  const updateHomework = (id: string, updates: Partial<Homework>) => {
    setHomework((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  };

  const deleteHomework = (id: string) => {
    setHomework((prev) => prev.filter((h) => h.id !== id));
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
      author: newAnn.author || "School Administration",
      isPinned: (newAnn as any).isPinned || false,
      smsSent: true,
      emailSent: true,
      pushDelivered: true,
    }).catch((e) => console.warn("API createNotification error:", e));

    logActivity("Published Announcement", `Posted: ${newAnn.title}`);
  };

  // Uniform category CRUD
  const addUniformCategory = (cData: Omit<UniformCategory, "id">) => {
    const id = "UC-" + Date.now();
    const createdAt = new Date().toISOString();
    const catName = cData.name || (cData as any).categoryName || "New Category";
    const newCat = {
      ...cData,
      id,
      createdAt,
      name: catName,
      categoryName: catName,
      branch: (cData as any).branch || selectedBranch || "Main Campus",
    };
    setUniformCategories((prev) => [newCat as any, ...prev]);

    // Automatically sync with uniforms list so it shows in all uniform configuration dropdowns immediately
    setUniforms((prev) => {
      if (prev.some((u) => u.category === catName || u.name === catName))
        return prev;
      const uId = "UNI-" + Date.now();
      const isPkg = catName.includes("Package") || catName.includes("Kit");
      return [
        {
          id: uId,
          createdAt,
          category: catName,
          name: catName,
          gender: catName.toLowerCase().includes("boys")
            ? "Male"
            : catName.toLowerCase().includes("girls")
              ? "Female"
              : "Unisex",
          size: "M",
          className: "All Wings",
          color: "Standard",
          price: isPkg ? 3000 : 350,
          availableStock: 50,
          branch: selectedBranch || "Main Campus",
        },
        ...prev,
      ];
    });

    setUniformInventory((prev) => {
      if (prev.some((i) => i.itemName === catName || i.category === catName))
        return prev;
      const invId = "UINV-" + Date.now();
      return [
        {
          id: invId,
          createdAt,
          itemId: "UNI-" + Date.now(),
          itemName: catName,
          category: catName,
          size: "M",
          openingStock: 50,
          currentStock: 50,
          minimumStock: 10,
          reorderLevel: 15,
          status: "In Stock",
          branch: selectedBranch || "Main Campus",
        } as any,
        ...prev,
      ];
    });
  };
  const updateUniformCategory = (
    id: string,
    updates: Partial<UniformCategory>,
  ) => {
    setUniformCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };
  const deleteUniformCategory = (id: string) => {
    setUniformCategories((prev) => {
      const targetCat = prev.find((c) => c.id === id);
      const targetName = (
        targetCat?.name ||
        (targetCat as any)?.categoryName ||
        ""
      )
        .toLowerCase()
        .trim();
      const updatedCats = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(
          "edu_db_uniform_categories",
          JSON.stringify(updatedCats),
        );
        localStorage.setItem("uniform_categories", JSON.stringify(updatedCats));
      } catch (e) {}

      if (targetName) {
        setUniforms((prevU) => {
          const updatedU = prevU.filter(
            (u) =>
              (u.category || u.name || "").toLowerCase().trim() !== targetName,
          );
          try {
            localStorage.setItem("edu_db_uniforms", JSON.stringify(updatedU));
          } catch (e) {}
          return updatedU;
        });

        setUniformInventory((prevInv) => {
          const updatedInv = prevInv.filter(
            (inv) =>
              (inv.itemName || inv.category || "").toLowerCase().trim() !==
              targetName,
          );
          try {
            localStorage.setItem(
              "edu_db_uniform_inventory",
              JSON.stringify(updatedInv),
            );
          } catch (e) {}
          return updatedInv;
        });
      }

      return updatedCats;
    });
  };

  // Uniform sizes CRUD
  const addUniformSize = (sData: Omit<UniformSize, "id">) => {
    const id = "US-" + Date.now();
    const createdAt = new Date().toISOString();
    setUniformSizes((prev) => [
      {
        ...sData,
        id,
        createdAt,
        branch: (sData as any).branch || selectedBranch || "Main Campus",
      } as any,
      ...prev,
    ]);
  };
  const updateUniformSize = (id: string, updates: Partial<UniformSize>) => {
    setUniformSizes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };
  const deleteUniformSize = (id: string) => {
    setUniformSizes((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem("edu_db_uniform_sizes", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Uniform suppliers CRUD
  const addUniformSupplier = (sData: Omit<UniformSupplier, "id">) => {
    const id = "SUP-" + Date.now();
    const createdAt = new Date().toISOString();
    setUniformSuppliers((prev) => [
      {
        ...sData,
        id,
        createdAt,
        branch: (sData as any).branch || selectedBranch || "Main Campus",
      } as any,
      ...prev,
    ]);
  };
  const updateUniformSupplier = (
    id: string,
    updates: Partial<UniformSupplier>,
  ) => {
    setUniformSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };
  const deleteUniformSupplier = (id: string) => {
    setUniformSuppliers((prev) => prev.filter((s) => s.id !== id));
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
        branch: (iData as any).branch || selectedBranch || "Main Campus",
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
  const updateUniformInventory = (
    id: string,
    updates: Partial<UniformInventoryItem>,
  ) => {
    setUniformInventory((prev) =>
      prev.map((i) => {
        if (i.id === id) {
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
  };
  const deleteUniformInventory = (id: string) => {
    setUniformInventory((prev) => prev.filter((i) => i.id !== id));
  };

  // Student Uniform issues CRUD
  const addStudentUniformIssue = (
    issueData: Omit<StudentUniformIssue, "id">,
  ) => {
    const id = "UIS-" + Math.floor(10 + Math.random() * 90);

    // Reduce stock if issued
    if (issueData.status === "Issued" || issueData.status === "Replaced") {
      const issueItemName = (issueData.itemName || "")
        .replace(/\(extra\)/gi, "")
        .replace(/\(extra purchase\)/gi, "")
        .toLowerCase()
        .trim();
      let calculatedNewStock: number | null = null;

      setUniformInventory((prevInv) => {
        let idx = prevInv.findIndex((i) =>
          Boolean(
            issueData.itemId &&
            (i.itemId === issueData.itemId || i.id === issueData.itemId),
          ),
        );
        if (idx === -1 && issueItemName) {
          idx = prevInv.findIndex((i) => {
            const itemCat = (i.category || "").toLowerCase().trim();
            const itemName = (i.itemName || "").toLowerCase().trim();
            return (
              itemName === issueItemName ||
              itemCat === issueItemName ||
              itemName.includes(issueItemName) ||
              issueItemName.includes(itemName)
            );
          });
        }
        if (idx === -1) return prevInv;
        return prevInv.map((item, index) => {
          if (index === idx) {
            calculatedNewStock = Math.max(
              0,
              item.currentStock - issueData.quantity,
            );
            const newStatus =
              calculatedNewStock === 0
                ? "Out of Stock"
                : calculatedNewStock <= (item.minimumStock || 10)
                  ? "Low Stock"
                  : "In Stock";
            return {
              ...item,
              currentStock: calculatedNewStock,
              status: newStatus,
            };
          }
          return item;
        });
      });

      setUniforms((prevU) => {
        let idx = prevU.findIndex((u) =>
          Boolean(issueData.itemId && u.id === issueData.itemId),
        );
        if (idx === -1 && issueItemName) {
          idx = prevU.findIndex((u) => {
            const uCat = (u.category || "").toLowerCase().trim();
            const uName = (u.name || "").toLowerCase().trim();
            return (
              uCat === issueItemName ||
              uName === issueItemName ||
              uCat.includes(issueItemName) ||
              issueItemName.includes(uCat)
            );
          });
        }
        if (idx === -1) return prevU;
        return prevU.map((u, index) => {
          if (index === idx) {
            const nextAvail =
              calculatedNewStock !== null
                ? calculatedNewStock
                : Math.max(0, (u.availableStock || 0) - issueData.quantity);
            return { ...u, availableStock: nextAvail };
          }
          return u;
        });
      });
    }

    const newIssue = {
      ...issueData,
      id: "UIS-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      branch: issueData.branch || selectedBranch || "Main Campus",
    };

    setStudentUniformIssues((prev) => [newIssue, ...prev]);
    try {
      const stored =
        localStorage.getItem("edu_db_student_uniform_issues") || "[]";
      const parsed = JSON.parse(stored);
      localStorage.setItem(
        "edu_db_student_uniform_issues",
        JSON.stringify([newIssue, ...parsed]),
      );
    } catch (e) {}
  };

  const updateStudentUniformIssue = (
    id: string,
    updates: Partial<StudentUniformIssue>,
  ) => {
    const issueToUpdate = studentUniformIssues.find((i) => i.id === id);
    if (!issueToUpdate) {
      setStudentUniformIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, ...updates } : issue,
        ),
      );
      return;
    }

    const oldStatus = issueToUpdate.status;
    const newStatus = updates.status;
    const qty = issueToUpdate.quantity;
    const issueItemName = (issueToUpdate.itemName || "").toLowerCase();
    const itemId = issueToUpdate.itemId;

    // Returning an item (increases stock by exact quantity)
    if (newStatus === "Returned" && oldStatus !== "Returned") {
      let calculatedNewStock: number | null = null;

      setUniformInventory((prevInv) => {
        let idx = prevInv.findIndex((i) =>
          Boolean(itemId && (i.itemId === itemId || i.id === itemId)),
        );
        if (idx === -1 && issueItemName) {
          idx = prevInv.findIndex((i) => {
            const itemCat = (i.category || "").toLowerCase();
            const itemName = (i.itemName || "").toLowerCase();
            return itemName === issueItemName || itemCat === issueItemName;
          });
        }
        if (idx === -1) return prevInv;
        return prevInv.map((item, index) => {
          if (index === idx) {
            calculatedNewStock = item.currentStock + qty;
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
        let idx = prevU.findIndex((u) => Boolean(itemId && u.id === itemId));
        if (idx === -1 && issueItemName) {
          idx = prevU.findIndex((u) => {
            const uCat = (u.category || "").toLowerCase();
            const uName = (u.name || "").toLowerCase();
            return uCat === issueItemName || uName === issueItemName;
          });
        }
        if (idx === -1) return prevU;
        return prevU.map((u, index) => {
          if (index === idx) {
            const nextAvail =
              calculatedNewStock !== null
                ? calculatedNewStock
                : (u.availableStock || 0) + qty;
            return { ...u, availableStock: nextAvail };
          }
          return u;
        });
      });
    }
    // Re-issuing a returned item (decreases stock)
    else if (
      (newStatus === "Issued" || newStatus === "Replaced") &&
      oldStatus === "Returned"
    ) {
      let calculatedNewStock: number | null = null;

      setUniformInventory((prevInv) => {
        let idx = prevInv.findIndex((i) =>
          Boolean(itemId && (i.itemId === itemId || i.id === itemId)),
        );
        if (idx === -1 && issueItemName) {
          idx = prevInv.findIndex((i) => {
            const itemCat = (i.category || "").toLowerCase();
            const itemName = (i.itemName || "").toLowerCase();
            return itemName === issueItemName || itemCat === issueItemName;
          });
        }
        if (idx === -1) return prevInv;
        return prevInv.map((item, index) => {
          if (index === idx) {
            calculatedNewStock = Math.max(0, item.currentStock - qty);
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
        let idx = prevU.findIndex((u) => Boolean(itemId && u.id === itemId));
        if (idx === -1 && issueItemName) {
          idx = prevU.findIndex((u) => {
            const uCat = (u.category || "").toLowerCase();
            const uName = (u.name || "").toLowerCase();
            return uCat === issueItemName || uName === issueItemName;
          });
        }
        if (idx === -1) return prevU;
        return prevU.map((u, index) => {
          if (index === idx) {
            const nextAvail =
              calculatedNewStock !== null
                ? calculatedNewStock
                : Math.max(0, (u.availableStock || 0) - qty);
            return { ...u, availableStock: nextAvail };
          }
          return u;
        });
      });
    }

    setStudentUniformIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, ...updates } : issue)),
    );
  };
  const deleteStudentUniformIssue = (id: string) => {
    const issueToDelete = studentUniformIssues.find((i) => i.id === id);
    if (
      issueToDelete &&
      (issueToDelete.status === "Issued" || issueToDelete.status === "Replaced")
    ) {
      const issueItemName = (issueToDelete.itemName || "").toLowerCase();
      let calculatedNewStock: number | null = null;

      setUniformInventory((prevInv) => {
        let idx = prevInv.findIndex((i) =>
          Boolean(
            issueToDelete.itemId &&
            (i.itemId === issueToDelete.itemId ||
              i.id === issueToDelete.itemId),
          ),
        );
        if (idx === -1 && issueItemName) {
          idx = prevInv.findIndex((i) => {
            const itemCat = (i.category || "").toLowerCase();
            const itemName = (i.itemName || "").toLowerCase();
            return itemName === issueItemName || itemCat === issueItemName;
          });
        }
        if (idx === -1) return prevInv;
        return prevInv.map((item, index) => {
          if (index === idx) {
            calculatedNewStock = item.currentStock + issueToDelete.quantity;
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
        if (idx === -1 && issueItemName) {
          idx = prevU.findIndex((u) => {
            const uCat = (u.category || "").toLowerCase();
            const uName = (u.name || "").toLowerCase();
            return uCat === issueItemName || uName === issueItemName;
          });
        }
        if (idx === -1) return prevU;
        return prevU.map((u, index) => {
          if (index === idx) {
            const nextAvail =
              calculatedNewStock !== null
                ? calculatedNewStock
                : (u.availableStock || 0) + issueToDelete.quantity;
            return { ...u, availableStock: nextAvail };
          }
          return u;
        });
      });
    }
    setStudentUniformIssues((prev) => prev.filter((issue) => issue.id !== id));
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
          academicYear: config.academicYear || "2026-2027",
          className: config.className.trim(),
          branch: config.branch || "Main Campus",
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

  const addFinanceUniformConfig = (cData: Omit<FinanceUniformConfig, "id">) => {
    const newConfig: FinanceUniformConfig = {
      ...cData,
      id: "FUC-" + Date.now(),
      branch: cData.branch || selectedBranch || "Main Campus",
      academicYear: cData.academicYear || selectedAcademicYear || "2026-2027",
      status: "Active",
    };

    setFinanceUniformConfigs((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const filtered = current.filter(
        (c) =>
          !(
            c.className?.toLowerCase() ===
              (newConfig.className || "").toLowerCase() &&
            c.gender === newConfig.gender &&
            c.uniformPackage === newConfig.uniformPackage
          ),
      );
      const updated = [newConfig, ...filtered];
      try {
        localStorage.setItem(
          "edu_db_finance_uniform_configs",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });

    syncUniformConfigToFinanceFees(newConfig);
  };

  const updateFinanceUniformConfig = (
    id: string,
    updates: Partial<FinanceUniformConfig>,
  ) => {
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
      } catch (e) {}
      return updated;
    });
  };

  const deleteFinanceUniformConfig = (id: string) => {
    setFinanceUniformConfigs((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const updated = current.filter((c) => c.id !== id);
      try {
        localStorage.setItem(
          "edu_db_finance_uniform_configs",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
  };

  // Leave Management Fetchers
  const fetchLeaveTypes = async () => {
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
  };

  const fetchLeaveApplications = async () => {
    if (activeRequests.current["leave-applications"]) {
      return activeRequests.current["leave-applications"];
    }
    const promise = (async () => {
      try {
        const response = await fetchLeaveApplicationsApi();
        if (response && response.success && response.data) {
          const mapped: LeaveApplication[] = response.data.map((item: any) => ({
            id:
              item.leaveApplicationId?.toString() || item.id?.toString() || "",
            employeeId: item.staffId?.toString() || item.id?.toString() || "",
            employeeName: item.staffName,
            empId: item.empId || item.employeeId,
            department: item.department || "Administration",
            designation: item.designation || "Staff",
            branch: item.branch || "Main Campus",
            employeeCategory:
              item.employeeCategory === "Teacher" ? "Teacher" : "Staff",
            leaveTypeId: item.leaveTypeId ? item.leaveTypeId.toString() : "1",
            leaveTypeName: item.leaveTypeName,
            fromDate: item.fromDate,
            toDate: item.toDate,
            isHalfDay: item.isHalfDay,
            numberOfDays: item.requestedDays,
            reason: item.reason,
            attachments: [],
            status: item.status,
            appliedDate: item.appliedDate,
            approverRemarks: item.approverRemarks || "",
            approvedBy: item.approvedBy || "",
          }));
          setLeaveApplications(mapped);
        }
      } catch (err) {
        console.warn("Failed to fetch leave applications from API", err);
      } finally {
        delete activeRequests.current["leave-applications"];
      }
    })();
    activeRequests.current["leave-applications"] = promise;
    return promise;
  };

  const fetchLeaveBalances = async () => {
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
  };

  const fetchSalaryStructures = async () => {
    try {
      const response = await fetchSalaryStructuresApi();
      if (response && response.success && response.data) {
        setSalaryStructures(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch salary structures from API", err);
    }
  };

  const fetchSalaryAssignments = async () => {
    try {
      const response = await fetchSalaryAssignmentsApi();
      if (response && response.success && response.data) {
        setEmployeeSalaryAssignments(response.data);
      }
    } catch (err) {
      console.warn("Failed to fetch salary assignments from API", err);
    }
  };

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
    try {
      const payload = {
        staffId: parseInt(appData.employeeId),
        leaveTypeId: parseInt(appData.leaveTypeId),
        fromDate: appData.fromDate,
        toDate: appData.toDate,
        isHalfDay: appData.isHalfDay,
        reason: appData.reason,
      };

      const response = await createLeaveApplicationApi(payload);
      if (response && response.success) {
        addToast(
          "success",
          "Leave Application Submitted",
          "Your leave request has been submitted.",
        );
        await fetchLeaveApplications();
        await fetchLeaveBalances();
      }
    } catch (err: any) {
      console.error("Error submitting leave application:", err);
      addToast("error", "API Error", "Failed to submit leave application.");
    }
  };
  const updateLeaveApplication = (
    id: string,
    updates: Partial<LeaveApplication>,
  ) => {
    setLeaveApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...updates } : app)),
    );
  };
  const deleteLeaveApplication = (id: string) => {
    setLeaveApplications((prev) => prev.filter((app) => app.id !== id));
  };

  // Holiday CRUD
  const addHoliday = (hData: Omit<Holiday, "id">) => {
    const id = "HOL-" + Math.floor(100 + Math.random() * 900);
    setHolidays((prev) => [
      ...prev,
      { ...hData, id, branch: hData.branch || selectedBranch || "Main Campus" },
    ]);
  };
  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  };
  const deleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  // School Events CRUD
  const addSchoolEvent = (eventData: Omit<SchoolEvent, "id">): SchoolEvent => {
    const id = "EVT-" + Math.floor(100 + Math.random() * 900);
    const newEvent: SchoolEvent = {
      ...eventData,
      id,
      branch: eventData.branch || selectedBranch || "Main Campus",
      status: eventData.status || "Published",
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setSchoolEvents((prev) => [newEvent, ...prev]);
    logActivity(
      "Created School Event",
      `Scheduled event ${newEvent.title} on ${newEvent.startDate}`,
    );
    return newEvent;
  };

  const updateSchoolEvent = (id: string, updates: Partial<SchoolEvent>) => {
    setSchoolEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : e,
      ),
    );
    logActivity("Updated School Event", `Updated event ID ${id}`);
  };

  const deleteSchoolEvent = (id: string) => {
    setSchoolEvents((prev) => prev.filter((e) => e.id !== id));
    logActivity("Deleted School Event", `Removed event ID ${id}`);
  };

  // TRAINING & ASSESSMENTS HANDLERS
  const addWorkshop = (
    wData: Omit<WorkshopTraining, "id">,
  ): WorkshopTraining => {
    const id = "WKS-" + Math.floor(100 + Math.random() * 900);
    const newWorkshop: WorkshopTraining = {
      ...wData,
      id,
      branch: wData.branch || selectedBranch || "Main Campus",
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
      academicYear: "2025-2026",
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
      branch: aData.branch || selectedBranch || "Main Campus",
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
      academicYear: "2025-2026",
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
            branch: res.branch || selectedBranch || "Main Campus",
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

  // Payslip handler
  const disburseSalary = (pData: Omit<Payslip, "id">) => {
    const id = "PAY-" + Math.floor(100 + Math.random() * 900);
    setPayslips((prev) => [
      ...prev,
      {
        ...pData,
        id,
        branch: (pData as any).branch || selectedBranch || "Main Campus",
      } as any,
    ]);
  };

  const addPayrollConfiguration = (
    configData: Omit<PayrollConfiguration, "id">,
  ) => {
    const id = "PAYCFG-" + Math.floor(100 + Math.random() * 900);
    setPayrollConfigurations((prev) => [
      ...prev.map((c) =>
        c.branch === configData.branch && configData.status === "Active"
          ? { ...c, status: "Inactive" as const }
          : c,
      ),
      {
        ...configData,
        id,
        branch: configData.branch || selectedBranch || "Main Campus",
      },
    ]);
  };
  const updatePayrollConfiguration = (
    id: string,
    updates: Partial<PayrollConfiguration>,
  ) => {
    setPayrollConfigurations((prev) => {
      const targetBranch =
        updates.branch || prev.find((c) => c.id === id)?.branch;
      return prev.map((c) => {
        if (
          updates.status === "Active" &&
          c.id !== id &&
          c.branch === targetBranch
        ) {
          return { ...c, status: "Inactive" };
        }
        return c.id === id ? { ...c, ...updates } : c;
      });
    });
  };
  const deletePayrollConfiguration = (id: string) => {
    setPayrollConfigurations((prev) => prev.filter((c) => c.id !== id));
  };
  const activatePayrollConfiguration = (id: string) => {
    const target = payrollConfigurations.find((c) => c.id === id);
    if (!target) return;
    setPayrollConfigurations((prev) =>
      prev.map((c) =>
        c.branch === target.branch
          ? { ...c, status: c.id === id ? "Active" : "Inactive" }
          : c,
      ),
    );
  };
  const deactivatePayrollConfiguration = (id: string) => {
    setPayrollConfigurations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Inactive" } : c)),
    );
  };

  const addPayrollComponent = (componentData: Omit<PayrollComponent, "id">) => {
    const id = "PC-" + Math.floor(1000 + Math.random() * 9000);
    setPayrollComponents((prev) => [
      ...prev,
      {
        ...componentData,
        id,
        branch: componentData.branch || selectedBranch || "Main Campus",
      },
    ]);
  };
  const updatePayrollComponent = (
    id: string,
    updates: Partial<PayrollComponent>,
  ) => {
    setPayrollComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };
  const deletePayrollComponent = (id: string) => {
    setPayrollComponents((prev) => prev.filter((c) => c.id !== id));
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
        branch: structureData.branch || selectedBranch || "Main Campus",
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
    return savedRun;
  };
  const updatePayrollRun = (id: string, updates: Partial<PayrollRun>) => {
    setPayrollRuns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };
  const deletePayrollRun = (id: string) => {
    setPayrollRuns((prev) => prev.filter((r) => r.id !== id));
  };

  // Leave Application Status Engine
  const updateLeaveApplicationStatus = async (
    id: string,
    status: LeaveApplication["status"],
    remarks?: string,
    approvedBy?: string,
  ) => {
    try {
      const payload = {
        status: status,
      };

      const response = await updateLeaveApplicationStatusApi(
        parseInt(id),
        payload,
      );

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
      console.error("Error updating leave application status:", err);
      addToast(
        "error",
        "API Error",
        "Failed to update leave application status.",
      );
    }
  };

  const filterByBranch = <T,>(items: T[]): T[] => {
    if (!items) return [];
    return items.filter((item) => {
      const anyItem = item as any;

      // Check branch
      let branchMatch = true;
      if (selectedBranch && selectedBranch !== "All Branches") {
        if (
          anyItem.applicableBranches &&
          Array.isArray(anyItem.applicableBranches)
        ) {
          branchMatch =
            anyItem.applicableBranches.includes(selectedBranch) ||
            anyItem.applicableBranches.includes("All Branches");
        } else if (anyItem.branch) {
          branchMatch =
            anyItem.branch === "All Branches" ||
            anyItem.branch.toLowerCase() === selectedBranch.toLowerCase() ||
            selectedBranch
              .toLowerCase()
              .includes(anyItem.branch.toLowerCase()) ||
            anyItem.branch.toLowerCase().includes(selectedBranch.toLowerCase());
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
    const branchFiltered = filterByBranch(students);
    const enrolledRegNos = new Set(
      admissions
        .filter(
          (a) => a.status === "Enrolled" || (a.status as string) === "enrolled",
        )
        .map((a) =>
          (a.registrationNo || a.applicationNo || "").trim().toLowerCase(),
        )
        .filter(Boolean),
    );
    if (admissions.length > 0) {
      return branchFiltered.filter((s) =>
        enrolledRegNos.has((s.admissionNo || "").trim().toLowerCase()),
      );
    }
    return branchFiltered;
  }, [students, admissions, selectedBranch]);

  useEffect(() => {
    setTotalStudentCount(filteredStudents.length);
  }, [filteredStudents]);
  const filteredStaff = filterByBranch(staff);
  const filteredAdmissions = filterByBranch(admissions);
  const filteredClasses = filterByBranch(academicClasses);
  const filteredSubjects = filterByBranch(subjects);
  const filteredExams = filterByBranch(exams);
  const filteredTimetable = filterByBranch(timetable);
  const filteredHomework = filterByBranch(homework);
  const filteredFeeStructures = filterByBranch(feeStructures);
  const filteredFeePayments = filterByBranch(feePayments);
  const filteredFeeHeads = filterByBranch(feeHeads);
  const filteredDynamicFeeStructures = filterByBranch(dynamicFeeStructures);
  const filteredStudentFeeAssignments = filterByBranch(studentFeeAssignments);
  const filteredERPTransportRoutes = filterByBranch(erpTransportRoutes);
  const filteredStudentTransports = filterByBranch(studentTransports);
  const filteredHostelMasters = filterByBranch(hostelMasters);
  const filteredStudentHostels = filterByBranch(studentHostels);
  const filteredRefunds = filterByBranch(refunds);
  const filteredRouteMasters = filterByBranch(routeMasters);
  const filteredPickupPoints = filterByBranch(pickupPoints);
  const filteredVehicleMasters = filterByBranch(vehicleMasters);
  const filteredDriverMasters = filterByBranch(driverMasters);
  const filteredBusAttendants = filterByBranch(busAttendants);
  const filteredVehicleAssignments = filterByBranch(vehicleAssignments);
  const filteredVehicleMaintenances = filterByBranch(vehicleMaintenances);
  const filteredUniformCategories = filterByBranch(uniformCategories);
  const filteredUniformSizes = filterByBranch(uniformSizes);
  const filteredUniformSuppliers = filterByBranch(uniformSuppliers);
  const filteredUniformInventory = filterByBranch(uniformInventory);
  const filteredStudentUniformIssues = filterByBranch(
    studentUniformIssues,
  ).filter((i) => {
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
      adm === "ADM-2026-001" ||
      adm === "REG-1022" ||
      adm === "REG-1021";
    return !isDummy;
  });
  const filteredFinanceUniformConfigs = filterByBranch(financeUniformConfigs);
  const filteredLeaveApplications = filterByBranch(leaveApplications);
  const filteredHolidays = filterByBranch(holidays);
  const filteredPayslips = filterByBranch(payslips);
  const filteredPayrollConfigurations = filterByBranch(payrollConfigurations);
  const filteredPayrollComponents = filterByBranch(payrollComponents);
  const filteredSalaryStructures = filterByBranch(salaryStructures);
  const filteredEmployeeSalaryAssignments = filterByBranch(
    employeeSalaryAssignments,
  );
  const filteredPayrollRuns = filterByBranch(payrollRuns);

  const filteredAttendance = attendance.filter((a) => {
    if (!selectedBranch) return true;
    if (a.entityType === "Student") {
      const stud = students.find((s) => s.id === a.entityId);
      return stud ? stud.branch === selectedBranch : true;
    } else {
      const st = staff.find((s) => s.id === a.entityId);
      return st && st.branch ? st.branch === selectedBranch : true;
    }
  });

  const filteredBookIssues = bookIssues.filter((bi) => {
    if (!selectedBranch) return true;
    if (bi.borrowerRole === "Student") {
      const stud = students.find((s) => s.id === bi.borrowerId);
      return stud ? stud.branch === selectedBranch : true;
    } else {
      const st = staff.find((s) => s.id === bi.borrowerId);
      return st ? st.branch === selectedBranch : true;
    }
  });

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
        setTimetable(res.data);
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
      localStorage.setItem("edu_db_students", JSON.stringify(next));
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
      localStorage.setItem("edu_db_students", JSON.stringify(next));
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
      localStorage.setItem("edu_db_students", JSON.stringify(next));
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
      localStorage.setItem("edu_db_students", JSON.stringify(next));
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
          s.admissionNo.toLowerCase() === admNo.toLowerCase() ||
          s.id.toLowerCase() === admNo.toLowerCase(),
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
        branch: targetStudent.branch || "Main Campus",
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
            s.admissionNo.toLowerCase() === admNo.toLowerCase() ||
            s.id.toLowerCase() === admNo.toLowerCase(),
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
      localStorage.setItem("edu_db_attendance", JSON.stringify(next));
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
            s.admissionNo.toLowerCase() === admNo.toLowerCase() ||
            s.id.toLowerCase() === admNo.toLowerCase(),
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
          row.totalPayable || row.TotalPayable || "45000",
        );

        const targetStudent = students.find(
          (s) =>
            s.admissionNo.toLowerCase() === admNo.toLowerCase() ||
            s.id.toLowerCase() === admNo.toLowerCase(),
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
        alumniRecords: filterByBranch(alumniRecords),
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
        fetchDepartments,
        fetchDesignations,
        fetchBooks,
        fetchBookIssues,
        fetchHomeworkData,
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
        uniforms,
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
        meetings,
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
        processedResults,
        saveProcessedResults,
        updateResultStatus,
        applyGraceOrRevaluation,
        studentAttendance,
        saveStudentAttendance,
        coScholasticAssessments,
        saveCoScholasticAssessment,
        timetable: filteredTimetable,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        publishClassTimetable,
        periodSettings,
        addPeriodSetting,
        updatePeriodSetting,
        deletePeriodSetting,
        bulkAssignPeriods,
        resetClassPeriods,
        teacherAssignments,
        addTeacherAssignment,
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
        announcements,
        addAnnouncement,
        saveAnnouncements: setAnnouncements,
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
        financialCategories,
        addFinancialCategory,
        updateFinancialCategory,
        financialBudgets,
        updateFinancialBudget,

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
  const hostel = useHostel();
  const exam = useExamination();
  const hr = useHR();
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return {
    ...context,
    ...hostel,
    ...exam,
    ...hr,
  } as unknown as DataContextType;
};
