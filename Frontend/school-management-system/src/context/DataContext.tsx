import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import {
  Student, Staff, StaffDocument, BankDetails, AdmissionApplication, FeeStructure, FeePayment,
  DailyAttendance, ExamSetup, ExamMark, TimetableSlot, Homework,
  BookItem, BookIssue, TransportRoute, HostelBlock, HostelRoom, HostelBed, Bus, UniformItem,
  CustomRole, InventoryItem, Announcement, Holiday, Birthday, AuditLog, SchoolProfile, AcademicYearMaster, PromotionHistoryItem,
  SubjectItem, ExamSchedule, GradeConfig, ProcessedResult, PeriodSetting, TeacherAssignment,
  FeeHead, DynamicFeeStructure, StudentFeeAssignment, Scholarship, StudentScholarship,
  Discount, StudentDiscount, FineRule, TransportRoute as ERPTransportRoute, StudentTransport,
  HostelMaster, StudentHostel, Refund, FinanceSettings, FeeStructureItem,
  RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, VehicleMaintenance,
  FinanceTransportConfig, StudentFeeLedger, LedgerFeeItem,
  RoomTypeMaster, RoomMaster, StudentHostelAssignment, HostelVisitorLog, HostelAttendanceLog, FinanceHostelConfig,
  UniformCategory, UniformSize, UniformSupplier, UniformInventoryItem, StudentUniformIssue, FinanceUniformConfig,
  LeaveType, LeaveApplication, Payslip, PayrollConfiguration, PayrollComponent,
  SalaryStructure, EmployeeSalaryAssignment, PayrollRun, QuestionPaper, SchoolMeeting, Department, DesignationMaster, DocumentRequirementRule,
  FinanceTransaction, FinancialAccount, FinancialCategory, FinancialBudget, TransactionAuditLog,
  SchoolEvent, UnifiedCalendarEvent, EventCategory, HolidayType,
  TrainingCategory, TrainingParticipant, WorkshopTraining, AssessmentType, AssessmentResult, EmployeeAssessment, IssuedCertificate
} from '../types';
import {
  initialStudents, initialStaff, initialAdmissions, initialFeeStructures,
  initialFeePayments, initialExamSetups, initialExamMarks, initialTimetable,
  initialHomework, initialBooks, initialBookIssues, initialTransportRoutes,
  initialHostelBlocks, initialHostelRooms, initialHostelBeds, initialBuses,
  initialUniforms, initialCustomRoles, initialInventory, initialAnnouncements,
  initialHolidays, initialBirthdays, initialAuditLogs, initialSchoolProfile, initialAcademicYears,
  initialSubjects,
  initialFeeHeads, initialDynamicFeeStructures, initialStudentFeeAssignments,
  initialScholarships, initialStudentScholarships, initialDiscounts, initialStudentDiscounts,
  initialFineRules, initialERPTransportRoutes, initialStudentTransports, initialHostelMasters,
  initialStudentHostels, initialRefunds, initialFinanceSettings,
  initialRouteMasters, initialPickupPoints, initialVehicleMasters, initialDriverMasters,
  initialVehicleAssignments, initialVehicleMaintenances,
  initialFinanceTransportConfigs, initialStudentFeeLedgers,
  initialRoomTypeMasters, initialRoomMasters, initialStudentHostelAssignments,
  initialHostelVisitorLogs, initialHostelAttendanceLogs, initialFinanceHostelConfigs,
  initialUniformCategories, initialUniformSizes, initialUniformSuppliers, initialUniformInventory,
  initialStudentUniformIssues, initialFinanceUniformConfigs,
  initialLeaveTypes, initialLeaveApplications, initialPayslips,
  initialPayrollConfigurations, initialPayrollComponents, initialSalaryStructures,
  initialEmployeeSalaryAssignments, initialPayrollRuns, initialQuestionPapers, initialMeetings, initialDepartments, initialDesignations
} from '../services/mockData';
import { fetchAdmissionsApi, createAdmissionApi, updateAdmissionApi, updateAdmissionStatusApi, deleteAdmissionApi } from '../api/admission';
import * as TransportAPI from '../api/transport';
import { apiClient } from '../api/client';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

export interface AcademicClass {
  id: string;
  name: string;
  sections: string[];
  sectionTeachers?: Record<string, string>;
  teacher: string;
  subjects: string[];
}

const initialClasses: AcademicClass[] = [
  { id: 'CL-9', name: 'Class 9', sections: ['A', 'B'], sectionTeachers: { 'A': 'Sarah Jenkins', 'B': 'Jonathan Miller' }, teacher: 'Sarah Jenkins', subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'History'] },
  { id: 'CL-10', name: 'Class 10', sections: ['A', 'B'], sectionTeachers: { 'A': 'Jonathan Miller', 'B': 'Robert Langdon' }, teacher: 'Jonathan Miller', subjects: ['Mathematics', 'Physics', 'Computer Science', 'English', 'Biology'] },
  { id: 'CL-11', name: 'Class 11', sections: ['A', 'B', 'C'], sectionTeachers: { 'A': 'Robert Langdon', 'B': 'Dr. Eleanor Vance', 'C': 'Jonathan Miller' }, teacher: 'Robert Langdon', subjects: ['Advanced Calculus', 'Organic Chemistry', 'Physics', 'Economics'] },
  { id: 'CL-12', name: 'Class 12', sections: ['A', 'B'], sectionTeachers: { 'A': 'Dr. Eleanor Vance', 'B': 'Sarah Jenkins' }, teacher: 'Dr. Eleanor Vance', subjects: ['Higher Mathematics', 'Quantum Physics', 'Literature', 'Accountancy'] }
];

const defaultPeriodSettings: PeriodSetting[] = [
  { id: 'PS-1', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Period 1', startTime: '08:30 AM', endTime: '09:15 AM', sequence: 1, periodType: 'Teaching', status: 'Active' },
  { id: 'PS-2', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Period 2', startTime: '09:15 AM', endTime: '10:00 AM', sequence: 2, periodType: 'Teaching', status: 'Active' },
  { id: 'PS-3', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Morning Break', startTime: '10:00 AM', endTime: '10:15 AM', sequence: 3, periodType: 'Break', status: 'Active' },
  { id: 'PS-4', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Period 3', startTime: '10:15 AM', endTime: '11:00 AM', sequence: 4, periodType: 'Teaching', status: 'Active' },
  { id: 'PS-5', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Period 4', startTime: '11:00 AM', endTime: '11:45 AM', sequence: 5, periodType: 'Teaching', status: 'Active' },
  { id: 'PS-6', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Lunch Break', startTime: '11:45 AM', endTime: '12:30 PM', sequence: 6, periodType: 'Lunch', status: 'Active' },
  { id: 'PS-7', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Period 5', startTime: '12:30 PM', endTime: '01:15 PM', sequence: 7, periodType: 'Teaching', status: 'Active' },
  { id: 'PS-8', academicYear: '2026-2027', branch: 'Main Campus', periodName: 'Period 6', startTime: '01:15 PM', endTime: '02:00 PM', sequence: 8, periodType: 'Teaching', status: 'Active' }
];

const defaultTeacherAssignments: TeacherAssignment[] = [
  { id: 'TA-1', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 10', section: 'A', subject: 'Mathematics', teacherId: 'STF-01', teacherName: 'Jonathan Miller', status: 'Active' },
  { id: 'TA-2', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 10', section: 'A', subject: 'Physics', teacherId: 'STF-02', teacherName: 'Sarah Jenkins', status: 'Active' },
  { id: 'TA-3', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 10', section: 'A', subject: 'Computer Science', teacherId: 'STF-03', teacherName: 'Robert Langdon', status: 'Active' },
  { id: 'TA-4', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 10', section: 'A', subject: 'English', teacherId: 'STF-04', teacherName: 'Dr. Eleanor Vance', status: 'Active' },
  { id: 'TA-5', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 10', section: 'A', subject: 'Biology', teacherId: 'STF-02', teacherName: 'Sarah Jenkins', status: 'Active' },
  { id: 'TA-6', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 9', section: 'A', subject: 'Mathematics', teacherId: 'STF-02', teacherName: 'Sarah Jenkins', status: 'Active' },
  { id: 'TA-7', academicYear: '2026-2027', branch: 'Main Campus', className: 'Class 9', section: 'A', subject: 'Physics', teacherId: 'STF-01', teacherName: 'Jonathan Miller', status: 'Active' }
];

export interface StudentCalculationResult {
  student: Student;
  assignment?: StudentFeeAssignment;
  baseFee: number;
  assignedFeeHeads: FeeStructureItem[];
  transportFee: number;
  transportDetails?: StudentTransport;
  hostelFee: number;
  hostelDetails?: StudentHostel;
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
  addAcademicYear: (ay: Omit<AcademicYearMaster, 'id'>) => void;
  updateAcademicYear: (id: string, updates: Partial<AcademicYearMaster>) => void;
  deleteAcademicYear: (id: string) => void;
  setCurrentAcademicYear: (id: string) => void;
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  promoteStudent: (id: string, targetClass: string, targetSection?: string, targetYear?: string, targetBranch?: string) => void;
  transferStudent: (id: string, reason: string) => void;

  staff: Staff[];
  addStaff: (staffMember: Omit<Staff, 'id'>) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addStaffDocument: (staffId: string, doc: Omit<StaffDocument, 'id'>) => void;
  deleteStaffDocument: (staffId: string, docId: string) => void;
  updateBankDetails: (staffId: string, bankDetails: BankDetails) => void;
  documentRequirementRules: DocumentRequirementRule[];
  getRequiredDocuments: (department?: string, designation?: string) => string[];
  addDocumentRequirementRule: (rule: Omit<DocumentRequirementRule, 'id'>) => void;
  updateDocumentRequirementRule: (id: string, updates: Partial<DocumentRequirementRule>) => void;
  deleteDocumentRequirementRule: (id: string) => void;
  verifyStaffDocument: (staffId: string, docId: string, status: 'Pending Verification' | 'Verified' | 'Rejected', remarks?: string) => void;
  replaceStaffDocument: (staffId: string, docId: string, newFileUrl: string, replacedBy?: string, remarks?: string) => void;

  admissions: AdmissionApplication[];
  addAdmission: (app: Omit<AdmissionApplication, 'id' | 'applicationNo'>) => void;
  updateAdmission: (id: string, updates: Partial<AdmissionApplication>) => void;
  deleteAdmission: (id: string) => void;
  updateAdmissionStatus: (id: string, status: AdmissionApplication['status']) => void;

  academicClasses: AcademicClass[];
  addAcademicClass: (cls: Omit<AcademicClass, 'id'>) => void;
  updateAcademicClass: (id: string, updates: Partial<AcademicClass>) => void;
  deleteAcademicClass: (id: string) => void;

  subjects: SubjectItem[];
  addSubject: (subject: Omit<SubjectItem, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<SubjectItem>) => void;
  deleteSubject: (id: string) => void;

  buses: Bus[];
  addBus: (bus: Omit<Bus, 'id'>) => void;
  updateBus: (id: string, updates: Partial<Bus>) => void;
  deleteBus: (id: string) => void;

  hostelBlocks: HostelBlock[];
  addHostelBlock: (block: Omit<HostelBlock, 'id'>) => void;
  updateHostelBlock: (id: string, updates: Partial<HostelBlock>) => void;
  deleteHostelBlock: (id: string) => void;

  hostelBeds: HostelBed[];
  addHostelBed: (bed: Omit<HostelBed, 'id'>) => void;
  updateHostelBed: (id: string, updates: Partial<HostelBed>) => void;
  deleteHostelBed: (id: string) => void;

  uniforms: UniformItem[];
  addUniform: (item: Omit<UniformItem, 'id'>) => void;
  updateUniform: (id: string, updates: Partial<UniformItem>) => void;
  deleteUniform: (id: string) => void;

  customRoles: CustomRole[];
  addCustomRole: (role: Omit<CustomRole, 'id'>) => void;
  updateCustomRole: (id: string, updates: Partial<CustomRole>) => void;
  deleteCustomRole: (id: string) => void;

  feeStructures: FeeStructure[];
  addFeeStructure: (feeStruct: Omit<FeeStructure, 'id'>) => void;
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => void;
  deleteFeeStructure: (id: string) => void;

  feePayments: FeePayment[];
  addFeePayment: (payment: Omit<FeePayment, 'id' | 'receiptNo'>) => FeePayment;

  // ERP Finance System Additions
  feeHeads: FeeHead[];
  addFeeHead: (head: Omit<FeeHead, 'id'>) => void;
  updateFeeHead: (id: string, updates: Partial<FeeHead>) => void;
  deleteFeeHead: (id: string) => void;
  toggleFeeHeadStatus: (id: string) => void;

  dynamicFeeStructures: DynamicFeeStructure[];
  addDynamicFeeStructure: (dfs: Omit<DynamicFeeStructure, 'id'>) => void;
  updateDynamicFeeStructure: (id: string, updates: Partial<DynamicFeeStructure>) => void;
  deleteDynamicFeeStructure: (id: string) => void;

  studentFeeAssignments: StudentFeeAssignment[];
  assignFeeStructure: (studentId: string, feeStructureId: string) => void;
  bulkAssignFeeStructure: (studentIds: string[], feeStructureId: string) => void;
  updateStudentFeeAssignment: (id: string, updates: Partial<StudentFeeAssignment>) => void;
  removeStudentFeeAssignment: (id: string) => void;

  scholarships: Scholarship[];
  addScholarship: (sch: Omit<Scholarship, 'id'>) => void;
  updateScholarship: (id: string, updates: Partial<Scholarship>) => void;
  deleteScholarship: (id: string) => void;

  studentScholarships: StudentScholarship[];
  assignScholarshipToStudent: (studentId: string, scholarshipId: string) => void;
  revokeStudentScholarship: (id: string) => void;

  discounts: Discount[];
  addDiscount: (disc: Omit<Discount, 'id'>) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;

  studentDiscounts: StudentDiscount[];
  assignDiscountToStudent: (studentId: string, discountId: string) => void;
  removeStudentDiscount: (id: string) => void;

  fineRules: FineRule[];
  addFineRule: (rule: Omit<FineRule, 'id'>) => void;
  updateFineRule: (id: string, updates: Partial<FineRule>) => void;
  deleteFineRule: (id: string) => void;

  erpTransportRoutes: ERPTransportRoute[];
  addERPTransportRoute: (route: Omit<ERPTransportRoute, 'id'>) => void;
  updateERPTransportRoute: (id: string, updates: Partial<ERPTransportRoute>) => void;
  deleteERPTransportRoute: (id: string) => void;

  studentTransports: StudentTransport[];
  assignStudentTransport: (st: Omit<StudentTransport, 'id'>) => void;
  removeStudentTransport: (id: string) => void;

  // Master Finance Ledger & Transactions System
  financeTransactions: FinanceTransaction[];
  addFinanceTransaction: (txn: Omit<FinanceTransaction, 'id' | 'transactionId'>) => FinanceTransaction;
  reverseFinanceTransaction: (transactionId: string, reason: string, user: string) => void;
  cancelFinanceTransaction: (transactionId: string, reason: string, user: string) => void;

  financialAccounts: FinancialAccount[];
  addFinancialAccount: (account: Omit<FinancialAccount, 'id'>) => void;
  updateFinancialAccount: (id: string, updates: Partial<FinancialAccount>) => void;

  financialCategories: FinancialCategory[];
  addFinancialCategory: (category: Omit<FinancialCategory, 'id'>) => void;
  updateFinancialCategory: (id: string, updates: Partial<FinancialCategory>) => void;

  financialBudgets: FinancialBudget[];
  updateFinancialBudget: (id: string, allocatedAmount: number) => void;

  // Academic Calendar & School Events System
  schoolEvents: SchoolEvent[];
  addSchoolEvent: (event: Omit<SchoolEvent, 'id'>) => SchoolEvent;
  updateSchoolEvent: (id: string, updates: Partial<SchoolEvent>) => void;
  deleteSchoolEvent: (id: string) => void;

  hostelMasters: HostelMaster[];
  addHostelMaster: (h: Omit<HostelMaster, 'id'>) => void;
  updateHostelMaster: (id: string, updates: Partial<HostelMaster>) => void;
  deleteHostelMaster: (id: string) => void;

  roomTypeMasters: RoomTypeMaster[];
  addRoomTypeMaster: (rt: Omit<RoomTypeMaster, 'id'>) => void;
  updateRoomTypeMaster: (id: string, updates: Partial<RoomTypeMaster>) => void;
  deleteRoomTypeMaster: (id: string) => void;

  roomMasters: RoomMaster[];
  addRoomMaster: (rm: Omit<RoomMaster, 'id'>) => void;
  updateRoomMaster: (id: string, updates: Partial<RoomMaster>) => void;
  deleteRoomMaster: (id: string) => void;

  studentHostelAssignments: StudentHostelAssignment[];
  assignStudentHostelRoom: (sha: Omit<StudentHostelAssignment, 'id'>) => void;
  updateStudentHostelAssignment: (id: string, updates: Partial<StudentHostelAssignment>) => void;
  deleteStudentHostelAssignment: (id: string) => void;

  hostelVisitorLogs: HostelVisitorLog[];
  addHostelVisitorLog: (vl: Omit<HostelVisitorLog, 'id'>) => void;
  updateHostelVisitorLogStatus: (id: string, status: 'In' | 'Out', outTime?: string) => void;

  hostelAttendanceLogs: HostelAttendanceLog[];
  recordHostelAttendance: (att: Omit<HostelAttendanceLog, 'id'>) => void;

  financeHostelConfigs: FinanceHostelConfig[];
  addFinanceHostelConfig: (c: Omit<FinanceHostelConfig, 'id'>) => void;
  updateFinanceHostelConfig: (id: string, updates: Partial<FinanceHostelConfig>) => void;
  deleteFinanceHostelConfig: (id: string) => void;

  studentHostels: StudentHostel[];
  assignStudentHostel: (sh: Omit<StudentHostel, 'id'>) => void;
  removeStudentHostel: (id: string) => void;

  refunds: Refund[];
  addRefund: (r: Omit<Refund, 'id' | 'refundNo'>) => void;
  updateRefundStatus: (id: string, status: Refund['status'], approvedBy?: string) => void;

  financeSettings: FinanceSettings;
  updateFinanceSettings: (settings: Partial<FinanceSettings>) => void;

  // FINANCE -> TRANSPORT CONFIGURATION MASTER
  financeTransportConfigs: FinanceTransportConfig[];
  addFinanceTransportConfig: (c: Omit<FinanceTransportConfig, 'id'>) => void;
  updateFinanceTransportConfig: (id: string, updates: Partial<FinanceTransportConfig>) => void;
  deleteFinanceTransportConfig: (id: string) => void;

  // STUDENT PERMANENT FEE LEDGER ENGINE
  studentFeeLedgers: StudentFeeLedger[];
  generateStudentFeeLedger: (studentId: string) => StudentFeeLedger;
  recalculateStudentFeeLedger: (studentId: string) => StudentFeeLedger;
  getStudentFeeLedger: (studentId: string) => StudentFeeLedger | null;

  calculateStudentPayableFee: (studentId: string) => StudentCalculationResult | null;
  applyScholarshipToStudent: (studentId: string, scholarshipId: string) => StudentFeeLedger;
  removeScholarshipFromStudent: (studentId: string) => StudentFeeLedger;
  applyDiscountToStudent: (studentId: string, discountId: string) => StudentFeeLedger;
  removeDiscountFromStudent: (studentId: string) => StudentFeeLedger;

  // TRANSPORT ERP MODULE ADDITIONS
  routeMasters: RouteMaster[];
  addRouteMaster: (r: Omit<RouteMaster, 'id'>) => Promise<void>;
  updateRouteMaster: (id: string, updates: Partial<RouteMaster>) => Promise<void>;
  deleteRouteMaster: (id: string) => Promise<void>;

  pickupPoints: PickupPoint[];
  addPickupPoint: (p: Omit<PickupPoint, 'id'>) => Promise<void>;
  updatePickupPoint: (id: string, updates: Partial<PickupPoint>) => Promise<void>;
  deletePickupPoint: (id: string) => Promise<void>;

  vehicleMasters: VehicleMaster[];
  addVehicleMaster: (v: Omit<VehicleMaster, 'id'>) => Promise<void>;
  updateVehicleMaster: (id: string, updates: Partial<VehicleMaster>) => Promise<void>;
  deleteVehicleMaster: (id: string) => Promise<void>;

  driverMasters: DriverMaster[];
  addDriverMaster: (d: Omit<DriverMaster, 'id'>) => Promise<void>;
  updateDriverMaster: (id: string, updates: Partial<DriverMaster>) => Promise<void>;
  deleteDriverMaster: (id: string) => Promise<void>;

  vehicleAssignments: VehicleAssignment[];
  assignVehicleRouteDriver: (va: Omit<VehicleAssignment, 'id'>) => Promise<void>;
  updateVehicleAssignment: (id: string, updates: Partial<VehicleAssignment>) => Promise<void>;
  removeVehicleAssignment: (id: string) => Promise<void>;

  vehicleMaintenances: VehicleMaintenance[];
  addVehicleMaintenance: (vm: Omit<VehicleMaintenance, 'id'>) => Promise<void>;
  updateVehicleMaintenance: (id: string, updates: Partial<VehicleMaintenance>) => Promise<void>;
  deleteVehicleMaintenance: (id: string) => Promise<void>;

  checkVehicleCapacity: (vehicleId: string) => CapacityCheckResult;

  attendance: DailyAttendance[];
  markAttendance: (records: DailyAttendance[]) => void;
  fetchDailyAttendance?: (date: string, department?: string) => Promise<void>;
  fetchMonthlyAttendance?: (month: number, year: number, department?: string) => Promise<void>;

  exams: ExamSetup[];
  examMarks: ExamMark[];
  addExam: (exam: Omit<ExamSetup, 'id'>) => void;
  updateExam: (id: string, updates: Partial<ExamSetup>) => void;
  deleteExam: (id: string) => void;
  saveMarks: (marks: Omit<ExamMark, 'id'>[]) => void;

  examSchedules: ExamSchedule[];
  addExamSchedule: (schedule: Omit<ExamSchedule, 'id'>) => void;
  updateExamSchedule: (id: string, updates: Partial<ExamSchedule>) => void;
  deleteExamSchedule: (id: string) => void;

  questionPapers: QuestionPaper[];
  addQuestionPaper: (paper: Omit<QuestionPaper, 'id'>) => QuestionPaper;
  updateQuestionPaper: (id: string, updates: Partial<QuestionPaper>) => void;
  deleteQuestionPaper: (id: string) => void;

  meetings: SchoolMeeting[];
  addMeeting: (meeting: Omit<SchoolMeeting, 'id' | 'createdAt'>) => SchoolMeeting;
  updateMeeting: (id: string, updates: Partial<SchoolMeeting>) => void;
  cancelMeeting: (id: string, reason: string) => void;
  deleteMeeting: (id: string) => void;

  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id'>) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  
  designations: DesignationMaster[];
  addDesignation: (designation: Omit<DesignationMaster, 'id'>) => DesignationMaster;
  updateDesignation: (id: string, updates: Partial<DesignationMaster>) => void;
  deleteDesignation: (id: string) => void;
  
  gradeConfigurations: GradeConfig[];
  saveGradeConfiguration: (grades: GradeConfig[]) => void;
  
  processedResults: ProcessedResult[];
  saveProcessedResults: (results: ProcessedResult[]) => void;
  updateResultStatus: (examId: string, className: string, section: string, status: ProcessedResult['status']) => void;
  applyGraceOrRevaluation: (markId: string, newMarks: number, type: 'Grace' | 'Revaluation', reason: string, updatedBy: string) => void;

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (id: string) => void;
  publishClassTimetable: (className: string, section: string, academicYear?: string, branch?: string) => void;

  periodSettings: PeriodSetting[];
  addPeriodSetting: (data: Omit<PeriodSetting, 'id'>) => void;
  updatePeriodSetting: (id: string, updates: Partial<PeriodSetting>) => void;
  deletePeriodSetting: (id: string) => void;

  teacherAssignments: TeacherAssignment[];
  addTeacherAssignment: (data: Omit<TeacherAssignment, 'id'>) => void;
  updateTeacherAssignment: (id: string, updates: Partial<TeacherAssignment>) => void;
  deleteTeacherAssignment: (id: string) => void;

  homework: Homework[];
  addHomework: (hw: Omit<Homework, 'id'>) => void;
  updateHomework: (id: string, updates: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;

  books: BookItem[];
  bookIssues: BookIssue[];
  addBook: (book: Omit<BookItem, 'id'>) => void;
  issueBook: (issue: Omit<BookIssue, 'id'>) => void;
  returnBook: (issueId: string) => void;

  transportRoutes: TransportRoute[];
  addTransportRoute: (route: Omit<TransportRoute, 'id'>) => void;

  hostelRooms: HostelRoom[];
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;

  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, 'id'>) => void;

  holidays: Holiday[];
  birthdays: Birthday[];
  auditLogs: AuditLog[];
  logActivity: (action: string, details: string, userName?: string, role?: string) => void;

  // UNIFORM ERP ADDITIONS
  uniformCategories: UniformCategory[];
  addUniformCategory: (c: Omit<UniformCategory, 'id'>) => void;
  updateUniformCategory: (id: string, updates: Partial<UniformCategory>) => void;
  deleteUniformCategory: (id: string) => void;

  uniformSizes: UniformSize[];
  addUniformSize: (s: Omit<UniformSize, 'id'>) => void;
  updateUniformSize: (id: string, updates: Partial<UniformSize>) => void;
  deleteUniformSize: (id: string) => void;

  uniformSuppliers: UniformSupplier[];
  addUniformSupplier: (s: Omit<UniformSupplier, 'id'>) => void;
  updateUniformSupplier: (id: string, updates: Partial<UniformSupplier>) => void;
  deleteUniformSupplier: (id: string) => void;

  uniformInventory: UniformInventoryItem[];
  addUniformInventory: (i: Omit<UniformInventoryItem, 'id'>) => void;
  updateUniformInventory: (id: string, updates: Partial<UniformInventoryItem>) => void;
  deleteUniformInventory: (id: string) => void;

  studentUniformIssues: StudentUniformIssue[];
  addStudentUniformIssue: (issue: Omit<StudentUniformIssue, 'id'>) => void;
  updateStudentUniformIssue: (id: string, updates: Partial<StudentUniformIssue>) => void;
  deleteStudentUniformIssue: (id: string) => void;

  financeUniformConfigs: FinanceUniformConfig[];
  addFinanceUniformConfig: (c: Omit<FinanceUniformConfig, 'id'>) => void;
  updateFinanceUniformConfig: (id: string, updates: Partial<FinanceUniformConfig>) => void;
  deleteFinanceUniformConfig: (id: string) => void;

  // LEAVE MANAGEMENT ERP ADDITIONS
  leaveTypes: LeaveType[];
  addLeaveType: (t: Omit<LeaveType, 'id'>) => void;
  updateLeaveType: (id: string, updates: Partial<LeaveType>) => void;
  deleteLeaveType: (id: string) => void;

  leaveApplications: LeaveApplication[];
  addLeaveApplication: (app: Omit<LeaveApplication, 'id'>) => void;
  updateLeaveApplication: (id: string, updates: Partial<LeaveApplication>) => void;
  deleteLeaveApplication: (id: string) => void;
  updateLeaveApplicationStatus: (id: string, status: LeaveApplication['status'], remarks?: string, approvedBy?: string) => void;

  addHoliday: (h: Omit<Holiday, 'id'>) => void;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;

  payslips: Payslip[];
  disburseSalary: (payslip: Omit<Payslip, 'id'>) => void;

  payrollConfigurations: PayrollConfiguration[];
  addPayrollConfiguration: (config: Omit<PayrollConfiguration, 'id'>) => void;
  updatePayrollConfiguration: (id: string, updates: Partial<PayrollConfiguration>) => void;
  deletePayrollConfiguration: (id: string) => void;
  activatePayrollConfiguration: (id: string) => void;
  deactivatePayrollConfiguration: (id: string) => void;

  payrollComponents: PayrollComponent[];
  addPayrollComponent: (component: Omit<PayrollComponent, 'id'>) => void;
  updatePayrollComponent: (id: string, updates: Partial<PayrollComponent>) => void;
  deletePayrollComponent: (id: string) => void;

  salaryStructures: SalaryStructure[];
  addSalaryStructure: (structure: Omit<SalaryStructure, 'id'>) => void;
  updateSalaryStructure: (id: string, updates: Partial<SalaryStructure>) => void;
  deleteSalaryStructure: (id: string) => void;
  cloneSalaryStructure: (id: string) => void;
  loadSalaryStructures: (structures: SalaryStructure[]) => void;

  employeeSalaryAssignments: EmployeeSalaryAssignment[];
  assignEmployeeSalaryStructure: (assignment: Omit<EmployeeSalaryAssignment, 'id'>) => any;
  updateEmployeeSalaryAssignment: (id: string, updates: Partial<EmployeeSalaryAssignment>) => void;
  deleteEmployeeSalaryAssignment: (id: string) => void;

  payrollRuns: PayrollRun[];
  upsertPayrollRun: (run: Omit<PayrollRun, 'id'>) => PayrollRun;
  updatePayrollRun: (id: string, updates: Partial<PayrollRun>) => void;
  deletePayrollRun: (id: string) => void;

  // TRAINING & ASSESSMENTS ERP MODULE ADDITIONS
  workshops: WorkshopTraining[];
  addWorkshop: (workshop: Omit<WorkshopTraining, 'id'>) => WorkshopTraining;
  updateWorkshop: (id: string, updates: Partial<WorkshopTraining>) => void;
  deleteWorkshop: (id: string) => void;
  markWorkshopAttendance: (workshopId: string, attendanceList: { employeeId: string; status: 'Present' | 'Absent' | 'Excused' }[]) => void;
  submitWorkshopFeedback: (workshopId: string, employeeId: string, feedback: TrainingParticipant['feedback']) => void;

  employeeAssessments: EmployeeAssessment[];
  addAssessment: (assessment: Omit<EmployeeAssessment, 'id'>) => EmployeeAssessment;
  updateAssessment: (id: string, updates: Partial<EmployeeAssessment>) => void;
  deleteAssessment: (id: string) => void;
  saveAssessmentResults: (assessmentId: string, results: AssessmentResult[]) => void;

  issuedCertificates: IssuedCertificate[];
  issueCertificate: (cert: Omit<IssuedCertificate, 'id' | 'certificateNumber'>) => IssuedCertificate;
  reissueCertificate: (id: string) => void;
}

const defaultGradeConfigurations: GradeConfig[] = [
  { id: 'GRD-1', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'A+', minPercent: 90, maxPercent: 100, gradePoints: 10, passCriteria: 'Pass' },
  { id: 'GRD-2', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'A', minPercent: 80, maxPercent: 89, gradePoints: 9, passCriteria: 'Pass' },
  { id: 'GRD-3', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'B+', minPercent: 70, maxPercent: 79, gradePoints: 8, passCriteria: 'Pass' },
  { id: 'GRD-4', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'B', minPercent: 60, maxPercent: 69, gradePoints: 7, passCriteria: 'Pass' },
  { id: 'GRD-5', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'C', minPercent: 50, maxPercent: 59, gradePoints: 6, passCriteria: 'Pass' },
  { id: 'GRD-6', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'D', minPercent: 33, maxPercent: 49, gradePoints: 4, passCriteria: 'Pass' },
  { id: 'GRD-7', academicYear: '2025-2026', branch: 'All Branches', schemeName: 'Default Scholastic', gradeName: 'F', minPercent: 0, maxPercent: 32, gradePoints: 0, passCriteria: 'Fail' }
];

const defaultExamSchedules: ExamSchedule[] = [
  {
    id: 'SCH-1',
    examId: 'EXM-01',
    academicYear: '2025-2026',
    branch: 'Main Campus',
    date: '2026-09-10',
    startTime: '09:00',
    endTime: '12:00',
    subject: 'Mathematics',
    className: 'Class 10',
    section: 'A',
    maxMarks: 100,
    passMarks: 33,
    room: 'Room 101',
    invigilatorId: 'STF-002',
    invigilatorName: 'Jonathan Miller'
  },
  {
    id: 'SCH-2',
    examId: 'EXM-01',
    academicYear: '2025-2026',
    branch: 'Main Campus',
    date: '2026-09-12',
    startTime: '09:00',
    endTime: '12:00',
    subject: 'Physics',
    className: 'Class 10',
    section: 'A',
    maxMarks: 100,
    passMarks: 33,
    room: 'Room 102',
    invigilatorId: 'STF-002',
    invigilatorName: 'Jonathan Miller'
  }
];

const initialFinanceTransactions: FinanceTransaction[] = [
  {
    id: 'TXN-001',
    transactionId: 'TXN-2026-891001',
    date: '2026-07-28',
    time: '10:15 AM',
    type: 'Income',
    category: 'Student Tuition Fees',
    sourceModule: 'Student Fee Collection',
    referenceNumber: 'REC-2026-1001',
    description: 'Term 1 Tuition Fee Collection for Aarav Sharma (Class 10-A)',
    amount: 18500,
    paymentMode: 'UPI',
    account: 'Main Bank Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Accounts Officer (Venkat)',
    approvedBy: 'Chief Accountant',
    auditTrail: [
      { id: 'AUD-1', action: 'Created', user: 'System Auto-Ledger', timestamp: '2026-07-28 10:15 AM', notes: 'Auto-recorded from Fee Payment REC-2026-1001' }
    ]
  },
  {
    id: 'TXN-002',
    transactionId: 'TXN-2026-891002',
    date: '2026-07-28',
    time: '11:00 AM',
    type: 'Income',
    category: 'Admission Fees',
    sourceModule: 'Admissions',
    referenceNumber: 'ADM-2026-054',
    description: 'New Student Admission & Registration Fee for Priya Patel (Class 1-B)',
    amount: 25000,
    paymentMode: 'Bank Transfer',
    account: 'Main Bank Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Admission Officer',
    approvedBy: 'Principal',
    auditTrail: [
      { id: 'AUD-2', action: 'Created', user: 'Admissions Module', timestamp: '2026-07-28 11:00 AM', notes: 'Admission confirmation fee' }
    ]
  },
  {
    id: 'TXN-003',
    transactionId: 'TXN-2026-891003',
    date: '2026-07-27',
    time: '04:30 PM',
    type: 'Expense',
    category: 'Employee Salaries',
    sourceModule: 'Payroll',
    referenceNumber: 'PAYROLL-JUL-2026',
    description: 'Monthly Faculty & Staff Payroll Disbursement (July 2026 Batch)',
    amount: 145000,
    paymentMode: 'Bank Transfer',
    account: 'Salary Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'HR Manager',
    approvedBy: 'Chief Accountant',
    auditTrail: [
      { id: 'AUD-3', action: 'Created', user: 'Payroll Module', timestamp: '2026-07-27 04:30 PM', notes: 'Batch salary payout for 32 employees' }
    ]
  },
  {
    id: 'TXN-004',
    transactionId: 'TXN-2026-891004',
    date: '2026-07-26',
    time: '02:15 PM',
    type: 'Income',
    category: 'Hostel Fees',
    sourceModule: 'Hostel',
    referenceNumber: 'HST-REC-088',
    description: 'Hostel Accommodation & Mess Fee Quarter 2 for Rohan Verma (Boys Block A)',
    amount: 32000,
    paymentMode: 'Online',
    account: 'Hostel Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Chief Warden',
    approvedBy: 'Accounts Officer',
    auditTrail: [
      { id: 'AUD-4', action: 'Created', user: 'Hostel Module', timestamp: '2026-07-26 02:15 PM', notes: 'Hostel booking payment' }
    ]
  },
  {
    id: 'TXN-005',
    transactionId: 'TXN-2026-891005',
    date: '2026-07-25',
    time: '09:45 AM',
    type: 'Income',
    category: 'Transport Fees',
    sourceModule: 'Transport',
    referenceNumber: 'TRP-REC-112',
    description: 'Bus Route #4 Monthly Pass Fee for Ananya Reddy',
    amount: 4500,
    paymentMode: 'Cash',
    account: 'Transport Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Transport Manager',
    approvedBy: 'Accounts Officer',
    auditTrail: [
      { id: 'AUD-5', action: 'Created', user: 'Transport Module', timestamp: '2026-07-25 09:45 AM', notes: 'Transport pass issued' }
    ]
  },
  {
    id: 'TXN-006',
    transactionId: 'TXN-2026-891006',
    date: '2026-07-24',
    time: '03:20 PM',
    type: 'Expense',
    category: 'Fuel Expenses',
    sourceModule: 'Transport',
    referenceNumber: 'TRP-EXP-034',
    description: 'Diesel Refueling for School Buses KA-01-F-1234 & KA-01-F-5678',
    amount: 18400,
    paymentMode: 'Card',
    account: 'Transport Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Transport Manager',
    approvedBy: 'Chief Accountant',
    auditTrail: [
      { id: 'AUD-6', action: 'Created', user: 'Transport Expense Entry', timestamp: '2026-07-24 03:20 PM', notes: 'Indian Oil petrol bunk receipt #9921' }
    ]
  },
  {
    id: 'TXN-007',
    transactionId: 'TXN-2026-891007',
    date: '2026-07-23',
    time: '11:30 AM',
    type: 'Expense',
    category: 'Vendor Payments',
    sourceModule: 'Inventory',
    referenceNumber: 'PO-2026-789',
    description: 'Purchase of Physics & Chemistry Laboratory Chemicals & Apparatus (Apex Scientific)',
    amount: 42500,
    paymentMode: 'Bank Transfer',
    account: 'Main Bank Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Store Keeper',
    approvedBy: 'Principal',
    auditTrail: [
      { id: 'AUD-7', action: 'Created', user: 'Inventory Module', timestamp: '2026-07-23 11:30 AM', notes: 'Purchase Order #PO-2026-789 settled' }
    ]
  },
  {
    id: 'TXN-008',
    transactionId: 'TXN-2026-891008',
    date: '2026-07-22',
    time: '01:10 PM',
    type: 'Income',
    category: 'Library Fines',
    sourceModule: 'Library',
    referenceNumber: 'LIB-FINE-044',
    description: 'Overdue Book Return Fine Collection (5 Days Late)',
    amount: 150,
    paymentMode: 'Cash',
    account: 'Cash',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Librarian',
    auditTrail: [
      { id: 'AUD-8', action: 'Created', user: 'Library Module', timestamp: '2026-07-22 01:10 PM', notes: 'Book issue ID ISS-104 fine' }
    ]
  },
  {
    id: 'TXN-009',
    transactionId: 'TXN-2026-891009',
    date: '2026-07-21',
    time: '10:00 AM',
    type: 'Income',
    category: 'Donations & Grants',
    sourceModule: 'Manual',
    referenceNumber: 'DON-2026-004',
    description: 'Alumni Trust Annual Education Infrastructure Sponsorship & Endowment Fund',
    amount: 100000,
    paymentMode: 'Cheque',
    account: 'Main Bank Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Principal',
    approvedBy: 'School Management Board',
    auditTrail: [
      { id: 'AUD-9', action: 'Created', user: 'Manual Transaction Entry', timestamp: '2026-07-21 10:00 AM', notes: 'Cheque No. 445902 deposited' }
    ]
  },
  {
    id: 'TXN-010',
    transactionId: 'TXN-2026-891010',
    date: '2026-07-20',
    time: '05:00 PM',
    type: 'Expense',
    category: 'Electricity Bills',
    sourceModule: 'Manual',
    referenceNumber: 'UTIL-ELEC-JUL26',
    description: 'Monthly Campus Electricity Tariff Payment (State Power Utility Board)',
    amount: 38700,
    paymentMode: 'Bank Transfer',
    account: 'Main Bank Account',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    status: 'Completed',
    createdBy: 'Accounts Officer',
    approvedBy: 'Principal',
    auditTrail: [
      { id: 'AUD-10', action: 'Created', user: 'Accounts Entry', timestamp: '2026-07-20 05:00 PM', notes: 'Consumer Account #998124501' }
    ]
  }
];

const initialFinancialAccounts: FinancialAccount[] = [
  { id: 'ACC-01', accountName: 'Cash in Hand', accountType: 'Cash', currentBalance: 48500, currency: 'INR', status: 'Active' },
  { id: 'ACC-02', accountName: 'State Bank of India (Main Account)', accountType: 'Main Bank Account', accountNumber: '30998124501', bankName: 'State Bank of India', branchName: 'MG Road Branch', currentBalance: 1245000, currency: 'INR', status: 'Active' },
  { id: 'ACC-03', accountName: 'HDFC Salary Disbursement Account', accountType: 'Salary Account', accountNumber: '50100234891', bankName: 'HDFC Bank', branchName: 'City Center', currentBalance: 450000, currency: 'INR', status: 'Active' },
  { id: 'ACC-04', accountName: 'ICICI Hostel & Operations Account', accountType: 'Hostel Account', accountNumber: '00120500981', bankName: 'ICICI Bank', branchName: 'Campus Branch', currentBalance: 320000, currency: 'INR', status: 'Active' },
  { id: 'ACC-05', accountName: 'Axis Bank Transport Account', accountType: 'Transport Account', accountNumber: '91802004561', bankName: 'Axis Bank', branchName: 'Industrial Suburb', currentBalance: 185000, currency: 'INR', status: 'Active' },
  { id: 'ACC-06', accountName: 'Office Petty Cash Vault', accountType: 'Petty Cash Account', currentBalance: 15000, currency: 'INR', status: 'Active' }
];

const initialFinancialCategories: FinancialCategory[] = [
  { id: 'CAT-INC-01', name: 'Student Tuition Fees', type: 'Income', sourceModule: 'Student Fee Collection', status: 'Active', isSystem: true },
  { id: 'CAT-INC-02', name: 'Admission Fees', type: 'Income', sourceModule: 'Admissions', status: 'Active', isSystem: true },
  { id: 'CAT-INC-03', name: 'Registration Fees', type: 'Income', sourceModule: 'Admissions', status: 'Active', isSystem: true },
  { id: 'CAT-INC-04', name: 'Examination Fees', type: 'Income', sourceModule: 'Examination', status: 'Active', isSystem: true },
  { id: 'CAT-INC-05', name: 'Hostel Fees', type: 'Income', sourceModule: 'Hostel', status: 'Active', isSystem: true },
  { id: 'CAT-INC-06', name: 'Transport Fees', type: 'Income', sourceModule: 'Transport', status: 'Active', isSystem: true },
  { id: 'CAT-INC-07', name: 'Library Fines', type: 'Income', sourceModule: 'Library', status: 'Active', isSystem: true },
  { id: 'CAT-INC-08', name: 'Certificate Fees', type: 'Income', sourceModule: 'Student Management', status: 'Active', isSystem: true },
  { id: 'CAT-INC-09', name: 'Uniform Sales', type: 'Income', sourceModule: 'Uniform', status: 'Active', isSystem: true },
  { id: 'CAT-INC-10', name: 'Donations & Grants', type: 'Income', sourceModule: 'Manual', status: 'Active', isSystem: false },
  { id: 'CAT-INC-11', name: 'Miscellaneous Income', type: 'Income', sourceModule: 'Manual', status: 'Active', isSystem: false },
  { id: 'CAT-EXP-01', name: 'Employee Salaries', type: 'Expense', sourceModule: 'Payroll', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-02', name: 'Vendor Payments', type: 'Expense', sourceModule: 'Inventory', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-03', name: 'Fuel Expenses', type: 'Expense', sourceModule: 'Transport', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-04', name: 'Vehicle Maintenance', type: 'Expense', sourceModule: 'Transport', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-05', name: 'Hostel Expenses', type: 'Expense', sourceModule: 'Hostel', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-06', name: 'Library Purchases', type: 'Expense', sourceModule: 'Library', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-07', name: 'Laboratory Equipment', type: 'Expense', sourceModule: 'Inventory', status: 'Active', isSystem: true },
  { id: 'CAT-EXP-08', name: 'Electricity Bills', type: 'Expense', sourceModule: 'Manual', status: 'Active', isSystem: false },
  { id: 'CAT-EXP-09', name: 'Water & Internet Bills', type: 'Expense', sourceModule: 'Manual', status: 'Active', isSystem: false },
  { id: 'CAT-EXP-10', name: 'Building & Furniture Maintenance', type: 'Expense', sourceModule: 'Manual', status: 'Active', isSystem: false },
  { id: 'CAT-EXP-11', name: 'Event & Festival Expenses', type: 'Expense', sourceModule: 'Manual', status: 'Active', isSystem: false },
  { id: 'CAT-EXP-12', name: 'Petty Cash Expenses', type: 'Expense', sourceModule: 'Manual', status: 'Active', isSystem: false }
];

const initialFinancialBudgets: FinancialBudget[] = [
  { id: 'BDG-01', categoryName: 'Employee Salaries', academicYear: '2025-2026', branch: 'Main Campus', allocatedAmount: 2000000, consumedAmount: 145000, remainingAmount: 1855000, status: 'Active' },
  { id: 'BDG-02', categoryName: 'Fuel Expenses', academicYear: '2025-2026', branch: 'Main Campus', allocatedAmount: 250000, consumedAmount: 18400, remainingAmount: 231600, status: 'Active' },
  { id: 'BDG-03', categoryName: 'Laboratory Equipment', academicYear: '2025-2026', branch: 'Main Campus', allocatedAmount: 500000, consumedAmount: 42500, remainingAmount: 457500, status: 'Active' },
  { id: 'BDG-04', categoryName: 'Electricity Bills', academicYear: '2025-2026', branch: 'Main Campus', allocatedAmount: 400000, consumedAmount: 38700, remainingAmount: 361300, status: 'Active' },
  { id: 'BDG-05', categoryName: 'Event & Festival Expenses', academicYear: '2025-2026', branch: 'Main Campus', allocatedAmount: 300000, consumedAmount: 0, remainingAmount: 300000, status: 'Active' }
];

const initialSchoolEvents: SchoolEvent[] = [
  {
    id: 'EVT-001',
    title: 'Annual Sports Day & Athletic Meet 2026',
    category: 'Sports Day',
    description: 'Grand Annual Sports Day featuring track & field competitions, march past, relay races, and trophy distribution.',
    organizer: 'Physical Education Dept',
    venue: 'Main Campus Stadium Ground',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    startTime: '08:30 AM',
    endTime: '04:30 PM',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    applicableClasses: ['Class 1', 'Class 2', 'Class 5', 'Class 8', 'Class 10', 'Class 12'],
    participants: 'All Students & Faculty',
    attachments: [
      { id: 'ATT-1', name: 'Sports_Day_Schedule.pdf', url: '#', type: 'PDF' },
      { id: 'ATT-2', name: 'Track_Events_Rules.pdf', url: '#', type: 'PDF' }
    ],
    status: 'Published',
    createdBy: 'PE Director (Jonathan Miller)'
  },
  {
    id: 'EVT-002',
    title: 'Inter-House Science & Robotics Exhibition',
    category: 'Science Exhibition',
    description: 'Student project showcases in AI, Renewable Energy, Physics Experiments, and Robotics Prototypes.',
    organizer: 'Department of Science & Tech',
    venue: 'Auditorium & STEM Lab 1',
    startDate: '2026-08-22',
    endDate: '2026-08-22',
    startTime: '10:00 AM',
    endTime: '03:00 PM',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    applicableClasses: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
    participants: 'Class 8-12 Students',
    attachments: [
      { id: 'ATT-3', name: 'Science_Fair_Guidelines.pdf', url: '#', type: 'PDF' }
    ],
    status: 'Published',
    createdBy: 'HOD Science (Dr. Sarah Jenkins)'
  },
  {
    id: 'EVT-003',
    title: 'Term 1 Parent Teacher Meeting (PTM)',
    category: 'Parent Teacher Meeting',
    description: 'Quarterly review meeting to discuss academic progress, attendance, and holistic student growth with parents.',
    organizer: 'Academic Committee',
    venue: 'Respective Classrooms',
    startDate: '2026-08-28',
    endDate: '2026-08-28',
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    applicableClasses: ['All Classes'],
    participants: 'Parents, Students & Class Teachers',
    status: 'Published',
    createdBy: 'Vice Principal'
  },
  {
    id: 'EVT-004',
    title: 'Grand Cultural Fest & Musical Night',
    category: 'Cultural Fest',
    description: 'Annual cultural extravaganza featuring classical dance, drama performance, school choir, and band live show.',
    organizer: 'Cultural Arts Association',
    venue: 'Open Air Amphitheatre',
    startDate: '2026-09-05',
    endDate: '2026-09-05',
    startTime: '04:00 PM',
    endTime: '08:30 PM',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    participants: 'All Students, Staff & Alumni',
    status: 'Published',
    createdBy: 'Arts Coordinator'
  },
  {
    id: 'EVT-005',
    title: 'Career Guidance & University Fair Seminar',
    category: 'Workshop & Seminar',
    description: 'Interactive session with global university delegates and career counselors for Senior Secondary Students.',
    organizer: 'Student Counseling Cell',
    venue: 'Conference Hall B',
    startDate: '2026-09-18',
    endDate: '2026-09-18',
    startTime: '11:00 AM',
    endTime: '02:00 PM',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    applicableClasses: ['Class 11', 'Class 12'],
    participants: 'Class 11 & 12 Students',
    status: 'Published',
    createdBy: 'Senior Counselor'
  }
];

const initialWorkshops: WorkshopTraining[] = [
  {
    id: 'WKS-101',
    workshopName: 'AI & Machine Learning Tools in Modern Education',
    category: 'AI Training',
    type: 'Internal',
    trainerName: 'Dr. Vikramaditya Sharma',
    organization: 'EdTech Innovations Institute',
    branch: 'Main Campus',
    department: 'Academics',
    applicableDesignation: 'All Teaching Staff',
    venue: 'Smart Audio-Visual Lab 1',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    startTime: '09:30 AM',
    endTime: '03:30 PM',
    capacity: 40,
    description: 'Hands-on workshop on leveraging Generative AI, lesson planning tools, automated assessment creators, and interactive student engagement platforms.',
    attachments: [
      { id: 'ATT-W1', name: 'AI_Tools_Handbook.pdf', url: '#', type: 'PDF' }
    ],
    status: 'Scheduled',
    attendancePct: 95,
    participants: [
      { employeeId: 'STF-101', employeeName: 'Rajesh Sharma', employeeRole: 'Teaching Staff', department: 'Mathematics', designation: 'Senior PGT Teacher', branch: 'Main Campus', attendanceStatus: 'Present', certificateIssued: true, certificateNo: 'CERT-2026-101' },
      { employeeId: 'STF-102', employeeName: 'Ananya Roy', employeeRole: 'Teaching Staff', department: 'Science', designation: 'TGT Teacher', branch: 'Main Campus', attendanceStatus: 'Present', certificateIssued: true, certificateNo: 'CERT-2026-102' }
    ]
  },
  {
    id: 'WKS-102',
    workshopName: 'POCSO & Child Safety Awareness Training',
    category: 'POCSO Awareness',
    type: 'External',
    trainerName: 'Adv. Meenakshi Sundaram',
    organization: 'National Child Rights & Protection Forum',
    branch: 'Main Campus',
    department: 'Administration',
    applicableDesignation: 'All Staff',
    venue: 'Main Auditorium',
    startDate: '2026-08-25',
    endDate: '2026-08-25',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    capacity: 100,
    description: 'Mandatory workshop on POCSO Act guidelines, identifying behavioral indicators, emergency protocols, and institutional reporting procedures.',
    attachments: [],
    status: 'Scheduled',
    attendancePct: 100,
    participants: []
  }
];

const initialEmployeeAssessments: EmployeeAssessment[] = [
  {
    id: 'ASM-201',
    assessmentName: 'Digital Pedagogy & Smart Classroom Skills Assessment',
    assessmentType: 'Digital Skills Test',
    department: 'Academics',
    applicableDesignation: 'Teaching Staff',
    branch: 'Main Campus',
    date: '2026-08-18',
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 70,
    instructions: 'Comprehensive test covering interactive whiteboard usage, digital lesson design, online quiz creation, and LMS management.',
    evaluatorName: 'Academic Director (Prof. V. K. Mehta)',
    status: 'Evaluated',
    results: [
      { employeeId: 'STF-101', employeeName: 'Rajesh Sharma', department: 'Mathematics', designation: 'Senior PGT Teacher', branch: 'Main Campus', marksObtained: 92, totalMarks: 100, percentage: 92, grade: 'A+', result: 'Pass', evaluatorRemarks: 'Exceptional digital skills and interactive quiz integration.', certificateIssued: true, certificateNo: 'CERT-2026-201' },
      { employeeId: 'STF-102', employeeName: 'Ananya Roy', department: 'Science', designation: 'TGT Teacher', branch: 'Main Campus', marksObtained: 85, totalMarks: 100, percentage: 85, grade: 'A', result: 'Pass', evaluatorRemarks: 'Great proficiency in smart board animations.', certificateIssued: true, certificateNo: 'CERT-2026-202' }
    ]
  }
];

const initialIssuedCertificates: IssuedCertificate[] = [
  {
    id: 'CRT-301',
    certificateNumber: 'CERT-2026-101',
    programType: 'Workshop',
    programName: 'AI & Machine Learning Tools in Modern Education',
    employeeId: 'STF-101',
    employeeName: 'Rajesh Sharma',
    department: 'Mathematics',
    designation: 'Senior PGT Teacher',
    branch: 'Main Campus',
    completionDate: '2026-08-11',
    issuedBy: 'Pirnav Schools Professional Development Cell',
    status: 'Issued'
  },
  {
    id: 'CRT-302',
    certificateNumber: 'CERT-2026-201',
    programType: 'Assessment',
    programName: 'Digital Pedagogy & Smart Classroom Skills Assessment',
    employeeId: 'STF-101',
    employeeName: 'Rajesh Sharma',
    department: 'Mathematics',
    designation: 'Senior PGT Teacher',
    branch: 'Main Campus',
    completionDate: '2026-08-18',
    issuedBy: 'Pirnav Schools Academic Council',
    status: 'Issued'
  }
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { selectedBranch, selectedAcademicYear, setSelectedAcademicYear, isAuthenticated, role } = useAuth();

  const getStored = <T,>(key: string, initial: T): T => {
    const saved = localStorage.getItem(`edu_db_${key}`);
    return saved ? JSON.parse(saved) : initial;
  };

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => getStored('profile', initialSchoolProfile));
  const [academicYears, setAcademicYears] = useState<AcademicYearMaster[]>(() => getStored('academic_years', initialAcademicYears));
  const [students, setStudents] = useState<Student[]>(() => getStored('students', initialStudents));
  const [staff, setStaff] = useState<Staff[]>(() => getStored('staff', initialStaff));
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(() => getStored('admissions', initialAdmissions));
  const [academicClasses, setAcademicClasses] = useState<AcademicClass[]>(() => getStored('academic_classes', initialClasses));
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => getStored('subjects', initialSubjects));
  const [buses, setBuses] = useState<Bus[]>(() => getStored('buses', initialBuses));
  const [hostelBlocks, setHostelBlocks] = useState<HostelBlock[]>(() => getStored('hostel_blocks', initialHostelBlocks));
  const [hostelBeds, setHostelBeds] = useState<HostelBed[]>(() => getStored('hostel_beds', initialHostelBeds));
  const [uniforms, setUniforms] = useState<UniformItem[]>(() => getStored('uniforms', initialUniforms));
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => getStored('custom_roles', initialCustomRoles));
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => getStored('fee_structures', initialFeeStructures));
  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => getStored('fee_payments', initialFeePayments));
  const [attendance, setAttendance] = useState<DailyAttendance[]>(() => getStored('attendance', []));
  const [exams, setExams] = useState<ExamSetup[]>(() => getStored('exams', initialExamSetups));
  const [examMarks, setExamMarks] = useState<ExamMark[]>(() => getStored('exam_marks', initialExamMarks));

  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>(() => getStored('exam_schedules', defaultExamSchedules));
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>(() => getStored('question_papers', initialQuestionPapers));
  const [meetings, setMeetings] = useState<SchoolMeeting[]>(() => getStored('school_meetings', initialMeetings));
  const [departments, setDepartments] = useState<Department[]>(() => getStored('departments', initialDepartments));
  const [designations, setDesignations] = useState<DesignationMaster[]>(() => getStored('designations', initialDesignations));
  const [gradeConfigurations, setGradeConfigurations] = useState<GradeConfig[]>(() => getStored('grade_configurations', defaultGradeConfigurations));
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>(() => getStored('processed_results', []));

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => getStored('timetable', initialTimetable));
  const [homework, setHomework] = useState<Homework[]>(() => getStored('homework', initialHomework));
  const [books, setBooks] = useState<BookItem[]>(() => getStored('books', initialBooks));
  const [bookIssues, setBookIssues] = useState<BookIssue[]>(() => getStored('book_issues', initialBookIssues));
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() => getStored('transport', initialTransportRoutes));
  const [hostelRooms] = useState<HostelRoom[]>(() => getStored('hostel', initialHostelRooms));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStored('inventory', initialInventory));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStored('announcements', initialAnnouncements));
  const [holidays, setHolidays] = useState<Holiday[]>(() => getStored('holidays', initialHolidays));
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(() => getStored('school_events', initialSchoolEvents));
  const [birthdays] = useState<Birthday[]>(() => getStored('birthdays', initialBirthdays));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStored('audit_logs', initialAuditLogs));

  // Leave Management ERP States
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(() => getStored('leave_types', initialLeaveTypes));
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(() => getStored('leave_applications', initialLeaveApplications));
  const [payslips, setPayslips] = useState<Payslip[]>(() => getStored('payslips', initialPayslips));
  const [payrollConfigurations, setPayrollConfigurations] = useState<PayrollConfiguration[]>(() => getStored('payroll_configurations', initialPayrollConfigurations));
  const [payrollComponents, setPayrollComponents] = useState<PayrollComponent[]>(() => getStored('payroll_components', initialPayrollComponents));
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>(() => getStored('salary_structures', initialSalaryStructures));
  const [employeeSalaryAssignments, setEmployeeSalaryAssignments] = useState<EmployeeSalaryAssignment[]>(() => getStored('employee_salary_assignments', initialEmployeeSalaryAssignments));
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => getStored('payroll_runs', initialPayrollRuns));

  // Uniform ERP States
  const [uniformCategories, setUniformCategories] = useState<UniformCategory[]>(() => getStored('uniform_categories', initialUniformCategories));
  const [uniformSizes, setUniformSizes] = useState<UniformSize[]>(() => getStored('uniform_sizes', initialUniformSizes));
  const [uniformSuppliers, setUniformSuppliers] = useState<UniformSupplier[]>(() => getStored('uniform_suppliers', initialUniformSuppliers));
  const [uniformInventory, setUniformInventory] = useState<UniformInventoryItem[]>(() => getStored('uniform_inventory', initialUniformInventory));
  const [studentUniformIssues, setStudentUniformIssues] = useState<StudentUniformIssue[]>(() => getStored('student_uniform_issues', initialStudentUniformIssues));
  const [financeUniformConfigs, setFinanceUniformConfigs] = useState<FinanceUniformConfig[]>(() => getStored('finance_uniform_configs', initialFinanceUniformConfigs));

  // ERP Finance System States
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(() => getStored('fee_heads', initialFeeHeads));
  const [dynamicFeeStructures, setDynamicFeeStructures] = useState<DynamicFeeStructure[]>(() => getStored('dynamic_fee_structures', initialDynamicFeeStructures));
  const [studentFeeAssignments, setStudentFeeAssignments] = useState<StudentFeeAssignment[]>(() => getStored('student_fee_assignments', initialStudentFeeAssignments));
  const [scholarships, setScholarships] = useState<Scholarship[]>(() => getStored('scholarships', initialScholarships));
  const [studentScholarships, setStudentScholarships] = useState<StudentScholarship[]>(() => getStored('student_scholarships', initialStudentScholarships));
  const [discounts, setDiscounts] = useState<Discount[]>(() => getStored('discounts', initialDiscounts));
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>(() => getStored('student_discounts', initialStudentDiscounts));
  const [fineRules, setFineRules] = useState<FineRule[]>(() => getStored('fine_rules', initialFineRules));
  const [erpTransportRoutes, setERPTransportRoutes] = useState<ERPTransportRoute[]>(() => getStored('erp_transport_routes', initialERPTransportRoutes));
  const [studentTransports, setStudentTransports] = useState<StudentTransport[]>(() => getStored('student_transports', initialStudentTransports));
  const [hostelMasters, setHostelMasters] = useState<HostelMaster[]>(() => getStored('hostel_masters', initialHostelMasters));
  const [studentHostels, setStudentHostels] = useState<StudentHostel[]>(() => getStored('student_hostels', initialStudentHostels));
  const [refunds, setRefunds] = useState<Refund[]>(() => getStored('refunds', initialRefunds));
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(() => getStored('finance_settings', initialFinanceSettings));

  // Transport ERP System States
  const [routeMasters, setRouteMasters] = useState<RouteMaster[]>(() => getStored('route_masters', initialRouteMasters));
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>(() => getStored('pickup_points', initialPickupPoints));
  const [vehicleMasters, setVehicleMasters] = useState<VehicleMaster[]>(() => getStored('vehicle_masters', initialVehicleMasters));
  const [driverMasters, setDriverMasters] = useState<DriverMaster[]>(() => getStored('driver_masters', initialDriverMasters));
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignment[]>(() => getStored('vehicle_assignments', initialVehicleAssignments));
  const [vehicleMaintenances, setVehicleMaintenances] = useState<VehicleMaintenance[]>(() => getStored('vehicle_maintenances', initialVehicleMaintenances));

  // Hostel ERP System States
  const [roomTypeMasters, setRoomTypeMasters] = useState<RoomTypeMaster[]>(() => getStored('room_type_masters', initialRoomTypeMasters));
  const [roomMasters, setRoomMasters] = useState<RoomMaster[]>(() => getStored('room_masters', initialRoomMasters));
  const [studentHostelAssignments, setStudentHostelAssignments] = useState<StudentHostelAssignment[]>(() => getStored('student_hostel_assignments', initialStudentHostelAssignments));
  const [hostelVisitorLogs, setHostelVisitorLogs] = useState<HostelVisitorLog[]>(() => getStored('hostel_visitor_logs', initialHostelVisitorLogs));
  const [hostelAttendanceLogs, setHostelAttendanceLogs] = useState<HostelAttendanceLog[]>(() => getStored('hostel_attendance_logs', initialHostelAttendanceLogs));

  // Finance -> Hostel Pricing Configuration Master State
  const [financeHostelConfigs, setFinanceHostelConfigs] = useState<FinanceHostelConfig[]>(() => getStored('finance_hostel_configs', initialFinanceHostelConfigs));

  // Finance -> Transport Pricing Configuration Master State
  const [financeTransportConfigs, setFinanceTransportConfigs] = useState<FinanceTransportConfig[]>(() => getStored('finance_transport_configs', initialFinanceTransportConfigs));

  // Permanent Student Fee Ledger State
  const [studentFeeLedgers, setStudentFeeLedgers] = useState<StudentFeeLedger[]>(() => getStored('student_fee_ledgers', initialStudentFeeLedgers));

  // Master Finance Ledger & Transactions States
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() => getStored('finance_transactions', initialFinanceTransactions));
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(() => getStored('financial_accounts', initialFinancialAccounts));
  const [financialCategories, setFinancialCategories] = useState<FinancialCategory[]>(() => getStored('financial_categories', initialFinancialCategories));
  const [financialBudgets, setFinancialBudgets] = useState<FinancialBudget[]>(() => getStored('financial_budgets', initialFinancialBudgets));

  const addAcademicYear = (ayData: Omit<AcademicYearMaster, 'id'>) => {
    const id = `AY-${ayData.academicYear.replace(/\s+/g, '') || Date.now()}`;
    const newAY: AcademicYearMaster = { id, ...ayData };
    setAcademicYears(prev => {
      let updated = [...prev];
      if (newAY.isCurrentAcademicYear) {
        updated = updated.map(a => ({ ...a, isCurrentAcademicYear: false }));
        setSelectedAcademicYear(newAY.academicYear);
      }
      return [...updated, newAY];
    });
  };

  const updateAcademicYear = (id: string, updates: Partial<AcademicYearMaster>) => {
    setAcademicYears(prev => {
      let updated = prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a);
      if (updates.isCurrentAcademicYear) {
        const target = updated.find(a => a.id === id);
        updated = updated.map(a => a.id === id ? { ...a, isCurrentAcademicYear: true } : { ...a, isCurrentAcademicYear: false });
        if (target) setSelectedAcademicYear(target.academicYear);
      }
      return updated;
    });
  };

  const deleteAcademicYear = (id: string) => {
    setAcademicYears(prev => prev.filter(a => a.id !== id));
  };

  const setCurrentAcademicYear = (id: string) => {
    setAcademicYears(prev => {
      const target = prev.find(a => a.id === id);
      if (!target) return prev;
      setSelectedAcademicYear(target.academicYear);
      return prev.map(a => ({
        ...a,
        isCurrentAcademicYear: a.id === id,
        status: a.id === id ? 'Active' : (a.status === 'Active' ? 'Closed' : a.status)
      }));
    });
  };

  useEffect(() => { localStorage.setItem('edu_db_profile', JSON.stringify(schoolProfile)); }, [schoolProfile]);
  useEffect(() => { localStorage.setItem('edu_db_academic_years', JSON.stringify(academicYears)); }, [academicYears]);
  useEffect(() => { localStorage.setItem('edu_db_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('edu_db_staff', JSON.stringify(staff)); }, [staff]);
  useEffect(() => { localStorage.setItem('edu_db_admissions', JSON.stringify(admissions)); }, [admissions]);
  useEffect(() => { localStorage.setItem('edu_db_academic_classes', JSON.stringify(academicClasses)); }, [academicClasses]);
  useEffect(() => { localStorage.setItem('edu_db_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('edu_db_buses', JSON.stringify(buses)); }, [buses]);
  useEffect(() => { localStorage.setItem('edu_db_hostel_blocks', JSON.stringify(hostelBlocks)); }, [hostelBlocks]);
  useEffect(() => { localStorage.setItem('edu_db_hostel_beds', JSON.stringify(hostelBeds)); }, [hostelBeds]);
  useEffect(() => { localStorage.setItem('edu_db_uniforms', JSON.stringify(uniforms)); }, [uniforms]);
  useEffect(() => { localStorage.setItem('edu_db_custom_roles', JSON.stringify(customRoles)); }, [customRoles]);
  useEffect(() => { localStorage.setItem('edu_db_fee_payments', JSON.stringify(feePayments)); }, [feePayments]);
  useEffect(() => { localStorage.setItem('edu_db_finance_transactions', JSON.stringify(financeTransactions)); }, [financeTransactions]);
  useEffect(() => { localStorage.setItem('edu_db_financial_accounts', JSON.stringify(financialAccounts)); }, [financialAccounts]);
  useEffect(() => { localStorage.setItem('edu_db_financial_categories', JSON.stringify(financialCategories)); }, [financialCategories]);
  useEffect(() => { localStorage.setItem('edu_db_financial_budgets', JSON.stringify(financialBudgets)); }, [financialBudgets]);
  useEffect(() => { localStorage.setItem('edu_db_school_events', JSON.stringify(schoolEvents)); }, [schoolEvents]);

  // One-time automatic normalization of class names to "Class X"
  useEffect(() => {
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
    const migratedClasses = academicClasses.map(c => {
      const newName = normalizeClassNameStr(c.name);
      if (newName !== c.name || (c as any).displayName !== newName) {
        classesChanged = true;
        nameMap[c.name] = newName;
        return {
          ...c,
          name: newName,
          displayName: newName
        };
      }
      return c;
    });

    if (classesChanged) {
      setAcademicClasses(migratedClasses);

      // Update students
      setStudents(prev => prev.map(s => {
        if (s.className && nameMap[s.className]) {
          return { ...s, className: nameMap[s.className] };
        }
        return s;
      }));

      // Update teacher assignments
      setTeacherAssignments(prev => prev.map(ta => {
        if (ta.className && nameMap[ta.className]) {
          return { ...ta, className: nameMap[ta.className] };
        }
        return ta;
      }));

      // Update timetable slots
      setTimetable(prev => prev.map(ts => {
        if (ts.className && nameMap[ts.className]) {
          return { ...ts, className: nameMap[ts.className] };
        }
        return ts;
      }));
    }
  }, []);

  // Training & Assessments States
  const [workshops, setWorkshops] = useState<WorkshopTraining[]>(() => getStored('workshops', initialWorkshops));
  const [employeeAssessments, setEmployeeAssessments] = useState<EmployeeAssessment[]>(() => getStored('employee_assessments', initialEmployeeAssessments));
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>(() => getStored('issued_certificates', initialIssuedCertificates));

  useEffect(() => { localStorage.setItem('edu_db_workshops', JSON.stringify(workshops)); }, [workshops]);
  useEffect(() => { localStorage.setItem('edu_db_employee_assessments', JSON.stringify(employeeAssessments)); }, [employeeAssessments]);
  useEffect(() => { localStorage.setItem('edu_db_issued_certificates', JSON.stringify(issuedCertificates)); }, [issuedCertificates]);

  // ERP Effects
  useEffect(() => { localStorage.setItem('edu_db_fee_heads', JSON.stringify(feeHeads)); }, [feeHeads]);
  useEffect(() => { localStorage.setItem('edu_db_dynamic_fee_structures', JSON.stringify(dynamicFeeStructures)); }, [dynamicFeeStructures]);
  useEffect(() => { localStorage.setItem('edu_db_student_fee_assignments', JSON.stringify(studentFeeAssignments)); }, [studentFeeAssignments]);
  useEffect(() => { localStorage.setItem('edu_db_scholarships', JSON.stringify(scholarships)); }, [scholarships]);
  useEffect(() => { localStorage.setItem('edu_db_student_scholarships', JSON.stringify(studentScholarships)); }, [studentScholarships]);
  useEffect(() => { localStorage.setItem('edu_db_discounts', JSON.stringify(discounts)); }, [discounts]);
  useEffect(() => { localStorage.setItem('edu_db_student_discounts', JSON.stringify(studentDiscounts)); }, [studentDiscounts]);
  useEffect(() => { localStorage.setItem('edu_db_fine_rules', JSON.stringify(fineRules)); }, [fineRules]);
  useEffect(() => { localStorage.setItem('edu_db_erp_transport_routes', JSON.stringify(erpTransportRoutes)); }, [erpTransportRoutes]);
  useEffect(() => { localStorage.setItem('edu_db_student_transports', JSON.stringify(studentTransports)); }, [studentTransports]);
  useEffect(() => { localStorage.setItem('edu_db_hostel_masters', JSON.stringify(hostelMasters)); }, [hostelMasters]);
  useEffect(() => { localStorage.setItem('edu_db_room_type_masters', JSON.stringify(roomTypeMasters)); }, [roomTypeMasters]);
  useEffect(() => { localStorage.setItem('edu_db_room_masters', JSON.stringify(roomMasters)); }, [roomMasters]);
  useEffect(() => { localStorage.setItem('edu_db_student_hostel_assignments', JSON.stringify(studentHostelAssignments)); }, [studentHostelAssignments]);
  useEffect(() => { localStorage.setItem('edu_db_hostel_visitor_logs', JSON.stringify(hostelVisitorLogs)); }, [hostelVisitorLogs]);
  useEffect(() => { localStorage.setItem('edu_db_hostel_attendance_logs', JSON.stringify(hostelAttendanceLogs)); }, [hostelAttendanceLogs]);
  useEffect(() => { localStorage.setItem('edu_db_finance_hostel_configs', JSON.stringify(financeHostelConfigs)); }, [financeHostelConfigs]);
  useEffect(() => { localStorage.setItem('edu_db_student_hostels', JSON.stringify(studentHostels)); }, [studentHostels]);
  useEffect(() => { localStorage.setItem('edu_db_refunds', JSON.stringify(refunds)); }, [refunds]);
  useEffect(() => { localStorage.setItem('edu_db_finance_settings', JSON.stringify(financeSettings)); }, [financeSettings]);
  useEffect(() => { localStorage.setItem('edu_db_question_papers', JSON.stringify(questionPapers)); }, [questionPapers]);
  useEffect(() => { localStorage.setItem('edu_db_school_meetings', JSON.stringify(meetings)); }, [meetings]);
  useEffect(() => { localStorage.setItem('edu_db_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('edu_db_designations', JSON.stringify(designations)); }, [designations]);

  // Uniform ERP Effects
  useEffect(() => { localStorage.setItem('edu_db_uniform_categories', JSON.stringify(uniformCategories)); }, [uniformCategories]);
  useEffect(() => { localStorage.setItem('edu_db_uniform_sizes', JSON.stringify(uniformSizes)); }, [uniformSizes]);
  useEffect(() => { localStorage.setItem('edu_db_uniform_suppliers', JSON.stringify(uniformSuppliers)); }, [uniformSuppliers]);
  useEffect(() => { localStorage.setItem('edu_db_uniform_inventory', JSON.stringify(uniformInventory)); }, [uniformInventory]);
  useEffect(() => { localStorage.setItem('edu_db_student_uniform_issues', JSON.stringify(studentUniformIssues)); }, [studentUniformIssues]);
  useEffect(() => { localStorage.setItem('edu_db_finance_uniform_configs', JSON.stringify(financeUniformConfigs)); }, [financeUniformConfigs]);

  // Transport ERP Effects
  useEffect(() => { localStorage.setItem('edu_db_route_masters', JSON.stringify(routeMasters)); }, [routeMasters]);
  useEffect(() => { localStorage.setItem('edu_db_pickup_points', JSON.stringify(pickupPoints)); }, [pickupPoints]);
  useEffect(() => { localStorage.setItem('edu_db_vehicle_masters', JSON.stringify(vehicleMasters)); }, [vehicleMasters]);
  useEffect(() => { localStorage.setItem('edu_db_driver_masters', JSON.stringify(driverMasters)); }, [driverMasters]);
  useEffect(() => { localStorage.setItem('edu_db_vehicle_assignments', JSON.stringify(vehicleAssignments)); }, [vehicleAssignments]);
  useEffect(() => { localStorage.setItem('edu_db_vehicle_maintenances', JSON.stringify(vehicleMaintenances)); }, [vehicleMaintenances]);

  // Fetch API data on mount
  useEffect(() => {
    const allowedTransportRoles = ['Super Admin', 'Admin', 'Transport Manager', 'Principal', 'Receptionist'];
    if (!isAuthenticated || !allowedTransportRoles.includes(role)) return;
    const fetchTransportData = async () => {
      try {
        const results = await Promise.allSettled([
          TransportAPI.fetchRoutesApi(),
          TransportAPI.fetchPickupPointsApi(),
          TransportAPI.fetchVehiclesApi(),
          TransportAPI.fetchDriversApi(),
          TransportAPI.fetchVehicleAssignmentsApi(),
          TransportAPI.fetchMaintenanceApi()
        ]);
        
        const extractData = (result: any) => {
          if (result.status !== 'fulfilled' || !result.value) return null;
          
          let dataArray = null;
          const val = result.value;
          
          if (Array.isArray(val)) dataArray = val;
          else if (val?.items && Array.isArray(val.items)) dataArray = val.items;
          else if (val?.Items && Array.isArray(val.Items)) dataArray = val.Items;
          else if (val?.data && Array.isArray(val.data)) dataArray = val.data;
          else if (val?.data?.items && Array.isArray(val.data.items)) dataArray = val.data.items;
          else if (val?.data?.Items && Array.isArray(val.data.Items)) dataArray = val.data.Items;

          if (!dataArray) return null;
          
          return dataArray.map((item: any) => ({
            ...item,
            id: (item.id || item.routeId || item.vehicleId || item.driverId || item.pickupPointId || item.assignmentId || item.maintenanceId || item.studentTransportId || '').toString()
          }));
        };

        const routes = extractData(results[0]);
        const points = extractData(results[1]);
        const vehicles = extractData(results[2]);
        const drivers = extractData(results[3]);
        const assignments = extractData(results[4]);
        const maintenance = extractData(results[5]);

        if (routes) setRouteMasters(routes);
        if (points) setPickupPoints(points);
        if (vehicles) setVehicleMasters(vehicles);
        if (drivers) setDriverMasters(drivers);
        if (assignments) setVehicleAssignments(assignments);
        if (maintenance) setVehicleMaintenances(maintenance);
        
        if (results.some(r => r.status === 'rejected')) {
          console.warn('Some Transport API fetches failed', results.filter(r => r.status === 'rejected'));
        }
      } catch (err) {
        console.warn('Transport API fetch failed entirely', err);
      }
    };
    fetchTransportData();
  }, [isAuthenticated]);

  // Finance Transport Config & Ledger Effects
  useEffect(() => { localStorage.setItem('edu_db_finance_transport_configs', JSON.stringify(financeTransportConfigs)); }, [financeTransportConfigs]);
  useEffect(() => { localStorage.setItem('edu_db_student_fee_ledgers', JSON.stringify(studentFeeLedgers)); }, [studentFeeLedgers]);

  // Leave & Payroll System Effects
  useEffect(() => { localStorage.setItem('edu_db_holidays', JSON.stringify(holidays)); }, [holidays]);
  useEffect(() => { localStorage.setItem('edu_db_leave_types', JSON.stringify(leaveTypes)); }, [leaveTypes]);
  useEffect(() => { localStorage.setItem('edu_db_leave_applications', JSON.stringify(leaveApplications)); }, [leaveApplications]);
  useEffect(() => { localStorage.setItem('edu_db_payslips', JSON.stringify(payslips)); }, [payslips]);
  useEffect(() => { localStorage.setItem('edu_db_payroll_configurations', JSON.stringify(payrollConfigurations)); }, [payrollConfigurations]);
  useEffect(() => { localStorage.setItem('edu_db_payroll_components', JSON.stringify(payrollComponents)); }, [payrollComponents]);
  useEffect(() => { localStorage.setItem('edu_db_salary_structures', JSON.stringify(salaryStructures)); }, [salaryStructures]);
  useEffect(() => { localStorage.setItem('edu_db_employee_salary_assignments', JSON.stringify(employeeSalaryAssignments)); }, [employeeSalaryAssignments]);
  useEffect(() => { localStorage.setItem('edu_db_payroll_runs', JSON.stringify(payrollRuns)); }, [payrollRuns]);

  useEffect(() => { localStorage.setItem('edu_db_exam_schedules', JSON.stringify(examSchedules)); }, [examSchedules]);
  useEffect(() => { localStorage.setItem('edu_db_grade_configurations', JSON.stringify(gradeConfigurations)); }, [gradeConfigurations]);
  useEffect(() => { localStorage.setItem('edu_db_processed_results', JSON.stringify(processedResults)); }, [processedResults]);

  const fetchAdmissions = async () => {
    try {
      const json = await fetchAdmissionsApi();
      console.log('Admissions API response:', json);
      if (json && json.success && json.data) {
        if (json.data.length === 0) {
          addToast('info', 'No Records Found', 'There are currently no admission applications available.');
        }
        const mappedAdmissions: AdmissionApplication[] = json.data.map((item: any) => ({
          id: item.applicationId.toString(),
          applicationNo: item.registrationNo,
          registrationNo: item.registrationNo,
          applicantName: item.applicantFullName,
          appliedClass: item.appliedClass,
          gender: item.gender,
          dob: item.dob ? item.dob.split('T')[0] : '',
          bloodGroup: item.bloodGroup,
          religion: item.religion,
          casteCategory: item.casteCategory,
          parentName: item.fatherFullName,
          motherName: item.motherFullName,
          phone: item.fatherMobileNo,
          email: '',
          addressHouseNo: item.houseNo,
          addressStreet: item.street,
          addressArea: item.areaLocality,
          addressCity: item.city,
          addressDistrict: item.district,
          addressState: item.state,
          addressPinCode: item.pinCode,
          siblingsCount: item.numberOfSiblings,
          studentType: item.studentType,
          transportRequired: item.transportRequired,
          transportType: item.transportType,
          busRoute: item.busRoute,
          pickupPoint: item.pickupPoint,
          dropPoint: item.dropPoint,
          hostelBlock: item.hostelBlock,
          hostelBed: item.allocatedBedId,
          status: item.status,
          applicationDate: item.createdAt,
          branch: item.branch || 'Main Campus',
        }));
        setAdmissions(mappedAdmissions);
      } else {
        addToast('error', 'API Error', json?.message || 'Failed to fetch admission records.');
      }
    } catch (err: any) {
      console.error('Error fetching admissions', err);
      // Don't show toast for 404 errors as it might just mean the backend endpoint isn't ready
      if (err.status !== 404) {
        addToast('error', 'Network Error', err.message || 'Unable to connect to the server. Please try again later.');
      }
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiClient('/api/staff', { method: 'GET' });
      if (response && response.success && response.data) {
        const mappedStaff: Staff[] = response.data.map((item: any) => {
          const cat = (item.employeeCategory || '').toLowerCase();
          const isTeaching = cat.includes('teaching') || cat.includes('teacher') || cat.includes('faculty') || cat.includes('professor');
          return {
            id: item.staffId.toString(),
            empId: item.employeeId,
            employeeCategory: isTeaching ? 'Teacher' : 'Staff',
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email || '',
            phone: item.phone || '',
            gender: item.gender || 'Male',
            dob: item.dateOfBirth ? item.dateOfBirth.split('T')[0] : '',
            joiningDate: item.joiningDate ? item.joiningDate.split('T')[0] : '',
            qualification: item.qualification || '',
            experienceYears: 0,
            salary: item.monthlySalary || 0,
            designation: item.designation || '',
            department: item.department || '',
            role: item.systemRole || (isTeaching ? 'Teacher' : 'Staff'),
            profileStatus: 'Completed',
            status: item.isActive ? 'Active' : 'Inactive',
            bankDetails: {
              accountHolderName: item.accountHolderName || '',
              accountNumber: item.accountNumber || '',
              bankName: item.bankName || '',
              branch: item.branchName || '',
              ifscCode: item.ifscCode || '',
              upiId: item.upiId || ''
            }
          };
        });
        setStaff(mappedStaff);
      }
    } catch (err) {
      console.warn('Failed to fetch staff from API', err);
    }
  };

  useEffect(() => {
    const allowedAdmissionsRoles = ['Super Admin', 'Admin', 'Principal', 'Receptionist'];
    if (isAuthenticated && allowedAdmissionsRoles.includes(role)) {
      fetchAdmissions();
      fetchStaff().then(() => {
        fetchLeaveTypes();
        fetchLeaveApplications();
        fetchLeaveBalances();
        fetchSalaryStructures();
        fetchSalaryAssignments();
      });
    }
  }, [isAuthenticated, role]);

  const logActivity = (action: string, details: string, userName = 'Admin User', role = 'Admin') => {
    const newLog: AuditLog = {
      id: 'LOG-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      userName,
      userRole: role,
      action,
      details,
      ipAddress: '192.168.1.1'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setSchoolProfile(prev => ({ ...prev, ...profile }));
    logActivity('Updated School Profile', 'Updated school contact and settings');
  };

  const addStudent = (stData: Omit<Student, 'id'>): Student => {
    const id = 'STU-' + Math.floor(100 + Math.random() * 900);
    const newStudent: Student = {
      ...stData,
      id,
      branch: stData.branch || selectedBranch || 'Main Campus',
      studentType: stData.studentType || 'Day Scholar',
      promotionHistory: stData.promotionHistory || []
    };
    setStudents(prev => [...prev, newStudent]);
    logActivity('Registered Student', `Enrolled ${newStudent.firstName} ${newStudent.lastName}`);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Updated Student', `Updated record for ID ${id}`);

    // Dynamic recalculation of Fee Ledger if studentType or details change
    if (updates.studentType || updates.className || updates.section) {
      setTimeout(() => recalculateStudentFeeLedger(id), 100);
    }
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setStudentFeeLedgers(prev => prev.filter(l => l.studentId !== id));
    logActivity('Deleted Student', `Removed student ID ${id}`);
  };

  const promoteStudent = (id: string, targetClass: string, targetSection = 'A', targetYear = '2026-2027', targetBranch = 'Main Campus') => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const historyItem: PromotionHistoryItem = {
          id: 'PROM-' + Date.now().toString().slice(-6),
          fromClass: s.className,
          toClass: targetClass,
          fromSection: s.section,
          toSection: targetSection,
          fromBranch: s.branch || 'Main Campus',
          toBranch: targetBranch,
          academicYear: targetYear,
          date: new Date().toISOString().split('T')[0]
        };
        return {
          ...s,
          className: targetClass,
          section: targetSection,
          branch: targetBranch,
          status: 'Promoted',
          promotionHistory: [...(s.promotionHistory || []), historyItem]
        };
      }
      return s;
    }));
    logActivity('Promoted Student', `Promoted student ID ${id} to ${targetClass}`);

    setTimeout(() => recalculateStudentFeeLedger(id), 100);
  };

  const transferStudent = (id: string, reason: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'Transferred' } : s));
    logActivity('Transferred Student', `Transferred student ID ${id}. Reason: ${reason}`);
  };

  // Staff CRUD
  const addStaff = (staffData: Omit<Staff, 'id'>): Staff => {
    const id = 'STF-' + Math.floor(100 + Math.random() * 900);
    const newStaff: Staff = {
      ...staffData,
      id,
      branch: staffData.branch || selectedBranch || 'Main Campus',
      profileStatus: staffData.profileStatus || 'Incomplete'
    };

    apiClient('/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: staffData.empId,
        employeeCategory: staffData.employeeCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff',
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        phone: staffData.phone,
        gender: staffData.gender || 'Male',
        designation: staffData.designation,
        department: staffData.department,
        systemRole: staffData.role,
        joiningDate: staffData.joiningDate,
        qualification: staffData.qualification || '',
        monthlySalary: staffData.salary || 0,
        accountHolderName: staffData.bankDetails?.accountHolderName || '',
        accountNumber: staffData.bankDetails?.accountNumber || '',
        bankName: staffData.bankDetails?.bankName || '',
        branchName: staffData.bankDetails?.branch || '',
        ifscCode: staffData.bankDetails?.ifscCode || '',
        upiId: staffData.bankDetails?.upiId || ''
      })
    }).then(response => {
      if (response && response.success && response.data) {
        setStaff(prev => prev.map(s => s.empId === newStaff.empId ? { ...s, id: response.data.staffId.toString() } : s));
      }
    }).catch(err => {
      console.error('Failed to create staff in backend', err);
    });

    setStaff(prev => [...prev, newStaff]);
    logActivity('Hired Staff Member', `Registered ${newStaff.firstName} ${newStaff.lastName}`);
    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      const existing = staff.find(s => s.id === id);
      if (existing) {
        const fullStaff = { ...existing, ...updates };
        apiClient(`/api/staff/${numericId}`, {
          method: 'PUT',
          body: JSON.stringify({
            employeeId: fullStaff.empId,
            employeeCategory: fullStaff.employeeCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff',
            firstName: fullStaff.firstName,
            lastName: fullStaff.lastName,
            email: fullStaff.email,
            phone: fullStaff.phone,
            gender: fullStaff.gender || 'Male',
            designation: fullStaff.designation,
            department: fullStaff.department,
            systemRole: fullStaff.role,
            joiningDate: fullStaff.joiningDate,
            qualification: fullStaff.qualification || '',
            monthlySalary: fullStaff.salary || 0,
            accountHolderName: fullStaff.bankDetails?.accountHolderName || '',
            accountNumber: fullStaff.bankDetails?.accountNumber || '',
            bankName: fullStaff.bankDetails?.bankName || '',
            branchName: fullStaff.bankDetails?.branch || '',
            ifscCode: fullStaff.bankDetails?.ifscCode || '',
            upiId: fullStaff.bankDetails?.upiId || ''
          })
        }).catch(err => {
          console.error('Failed to update staff in backend', err);
        });
      }
    }

    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Updated Staff Record', `Updated details for staff ID ${id}`);
  };

  const deleteStaff = (id: string) => {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      apiClient(`/api/staff/${numericId}`, {
        method: 'DELETE'
      }).catch(err => {
        console.error('Failed to delete staff in backend', err);
      });
    }

    setStaff(prev => prev.filter(s => s.id !== id));
    logActivity('Terminated Staff Record', `Removed staff ID ${id}`);
  };

  const addStaffDocument = (staffId: string, docData: Omit<StaffDocument, 'id'>) => {
    const newDoc: StaffDocument = { ...docData, id: 'DOC-' + Date.now().toString().slice(-6) };
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, documents: [...(s.documents || []), newDoc] } : s));
  };

  const deleteStaffDocument = (staffId: string, docId: string) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, documents: (s.documents || []).filter(d => d.id !== docId) } : s));
  };

  const updateBankDetails = (staffId: string, bankDetails: BankDetails) => {
    const numericId = parseInt(staffId, 10);
    if (!isNaN(numericId)) {
      const existing = staff.find(s => s.id === staffId);
      if (existing) {
        const fullStaff = { ...existing, bankDetails };
        apiClient(`/api/staff/${numericId}`, {
          method: 'PUT',
          body: JSON.stringify({
            employeeId: fullStaff.empId,
            employeeCategory: fullStaff.employeeCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff',
            firstName: fullStaff.firstName,
            lastName: fullStaff.lastName,
            email: fullStaff.email,
            phone: fullStaff.phone,
            gender: fullStaff.gender || 'Male',
            designation: fullStaff.designation,
            department: fullStaff.department,
            systemRole: fullStaff.role,
            joiningDate: fullStaff.joiningDate,
            qualification: fullStaff.qualification || '',
            monthlySalary: fullStaff.salary || 0,
            accountHolderName: bankDetails.accountHolderName || '',
            accountNumber: bankDetails.accountNumber || '',
            bankName: bankDetails.bankName || '',
            branchName: bankDetails.branch || '',
            ifscCode: bankDetails.ifscCode || '',
            upiId: bankDetails.upiId || ''
          })
        }).catch(err => {
          console.error('Failed to update bank details in backend', err);
        });
      }
    }

    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, bankDetails } : s));
  };

  // DOCUMENT REQUIREMENT RULES MASTER MANAGEMENT
  const [documentRequirementRules, setDocumentRequirementRules] = useState<DocumentRequirementRule[]>([
    {
      id: 'DOC-RULE-01',
      department: 'Transport',
      designation: 'Driver',
      requiredDocTypes: ['Aadhaar Card', 'PAN Card', 'Driving License', 'Medical Certificate', 'Police Verification', 'Bank Passbook'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-02',
      department: 'Transport',
      designation: 'Bus Attendant',
      requiredDocTypes: ['Aadhaar Card', 'Medical Certificate', 'Police Verification'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-03',
      department: 'Hostel',
      designation: 'Hostel Warden',
      requiredDocTypes: ['Aadhaar Card', 'PAN Card', 'Police Verification'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-04',
      department: 'Finance & Accounts',
      designation: 'Accountant',
      requiredDocTypes: ['Aadhaar Card', 'PAN Card', 'Bank Passbook'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-05',
      department: 'Administration',
      designation: 'Receptionist',
      requiredDocTypes: ['Aadhaar Card', 'PAN Card'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-06',
      department: 'Housekeeping',
      designation: 'Cleaner',
      requiredDocTypes: ['Aadhaar Card'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-07',
      department: 'Security',
      designation: 'Security Guard',
      requiredDocTypes: ['Aadhaar Card', 'Police Verification', 'Medical Certificate'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-08',
      department: 'Library',
      designation: 'Librarian',
      requiredDocTypes: ['Aadhaar Card', 'Degree Certificate'],
      status: 'Active'
    },
    {
      id: 'DOC-RULE-09',
      department: 'Mathematics',
      designation: 'Subject Teacher',
      requiredDocTypes: ['Aadhaar Card', 'PAN Card', 'Degree Certificate', 'B.Ed.', 'Experience Letter'],
      status: 'Active'
    }
  ]);

  const getRequiredDocuments = (department?: string, designation?: string): string[] => {
    if (!department || !designation) return ['Aadhaar Card', 'PAN Card'];

    const exact = documentRequirementRules.find(
      r => r.status === 'Active' &&
           r.department.toLowerCase() === department.toLowerCase() &&
           r.designation.toLowerCase() === designation.toLowerCase()
    );
    if (exact) return exact.requiredDocTypes;

    const deptMatch = documentRequirementRules.find(
      r => r.status === 'Active' &&
           r.department.toLowerCase() === department.toLowerCase() &&
           (r.designation === 'All' || r.designation.toLowerCase() === 'all')
    );
    if (deptMatch) return deptMatch.requiredDocTypes;

    const desigLower = designation.toLowerCase();
    const deptLower = department.toLowerCase();

    if (desigLower.includes('driver')) {
      return ['Aadhaar Card', 'PAN Card', 'Driving License', 'Medical Certificate', 'Police Verification', 'Bank Passbook'];
    }
    if (desigLower.includes('attendant') || desigLower.includes('conductor')) {
      return ['Aadhaar Card', 'Medical Certificate', 'Police Verification'];
    }
    if (desigLower.includes('warden')) {
      return ['Aadhaar Card', 'PAN Card', 'Police Verification'];
    }
    if (desigLower.includes('accountant') || desigLower.includes('cashier') || desigLower.includes('billing')) {
      return ['Aadhaar Card', 'PAN Card', 'Bank Passbook'];
    }
    if (desigLower.includes('receptionist')) {
      return ['Aadhaar Card', 'PAN Card'];
    }
    if (desigLower.includes('security') || desigLower.includes('guard')) {
      return ['Aadhaar Card', 'Police Verification', 'Medical Certificate'];
    }
    if (desigLower.includes('cleaner') || desigLower.includes('housekeeping')) {
      return ['Aadhaar Card'];
    }
    if (desigLower.includes('librarian')) {
      return ['Aadhaar Card', 'Degree Certificate'];
    }

    const isTeaching = desigLower.includes('teacher') ||
                       desigLower.includes('hod') ||
                       desigLower.includes('coordinator') ||
                       ['mathematics', 'science', 'english', 'social science', 'languages', 'computer science / ict', 'commerce', 'humanities', 'fine arts', 'performing arts', 'physical education', 'pre-primary'].includes(deptLower);

    if (isTeaching) {
      return ['Aadhaar Card', 'PAN Card', 'Degree Certificate', 'B.Ed.', 'Experience Letter'];
    }

    return ['Aadhaar Card', 'PAN Card'];
  };

  const addDocumentRequirementRule = (ruleData: Omit<DocumentRequirementRule, 'id'>) => {
    const id = 'DOC-RULE-' + Math.floor(10 + Math.random() * 90);
    const newRule: DocumentRequirementRule = {
      ...ruleData,
      id,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setDocumentRequirementRules(prev => [newRule, ...prev]);
    logActivity('Created Document Requirement Rule', `Configured requirements for ${newRule.department} -> ${newRule.designation}`);
  };

  const updateDocumentRequirementRule = (id: string, updates: Partial<DocumentRequirementRule>) => {
    setDocumentRequirementRules(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : r));
    logActivity('Updated Document Requirement Rule', `Updated rule ID ${id}`);
  };

  const deleteDocumentRequirementRule = (id: string) => {
    setDocumentRequirementRules(prev => prev.filter(r => r.id !== id));
    logActivity('Deleted Document Requirement Rule', `Removed rule ID ${id}`);
  };

  const verifyStaffDocument = (staffId: string, docId: string, status: 'Pending Verification' | 'Verified' | 'Rejected', remarks?: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      return {
        ...s,
        documents: (s.documents || []).map(d => {
          if (d.id !== docId) return d;
          return {
            ...d,
            verificationStatus: status,
            remarks: remarks !== undefined ? remarks : d.remarks
          };
        })
      };
    }));
    logActivity('Verified Staff Document', `Updated document status to ${status} for staff ID ${staffId}`);
  };

  const replaceStaffDocument = (staffId: string, docId: string, newFileUrl: string, replacedBy = 'HR Admin', remarks?: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      return {
        ...s,
        documents: (s.documents || []).map(d => {
          if (d.id !== docId) return d;
          const currentVersion = d.versionHistory?.length ? Math.max(...d.versionHistory.map(v => v.version)) + 1 : 2;
          const oldVersionItem = {
            version: currentVersion - 1,
            fileUrl: d.fileUrl,
            replacedDate: new Date().toISOString().split('T')[0],
            replacedBy
          };
          return {
            ...d,
            fileUrl: newFileUrl,
            uploadedDate: new Date().toISOString().split('T')[0],
            verificationStatus: 'Pending Verification',
            remarks: remarks !== undefined ? remarks : d.remarks,
            versionHistory: [...(d.versionHistory || [oldVersionItem]), {
              version: currentVersion,
              fileUrl: newFileUrl,
              replacedDate: new Date().toISOString().split('T')[0],
              replacedBy
            }]
          };
        })
      };
    }));
    logActivity('Replaced Staff Document', `Uploaded new version of document for staff ID ${staffId}`);
  };

  // Admission CRUD
  const addAdmission = async (appData: Omit<AdmissionApplication, 'id' | 'applicationNo'>) => {
    try {
      let isoDob = new Date().toISOString();
      if (appData.dob) {
        if (appData.dob.includes('/')) {
          const parts = appData.dob.split('/');
          if (parts.length === 3) {
            const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
            if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
          }
        } else {
          const parsed = new Date(appData.dob);
          if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
        }
      }

      const payload = {
        applicantFullName: appData.applicantName || "",
        appliedClass: appData.appliedClass || "",
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
        floorLevel: "N/A",
        allocatedBedId: appData.hostelBed || "N/A",
        branch: appData.branch || selectedBranch || 'Main Campus'
      };

      const json = await createAdmissionApi(payload);

      if (json && json.success !== false) {
        logActivity('New Admission Application', `Received application from ${appData.applicantName}`);
        addToast('success', 'Application Submitted', 'New admission application has been registered.');
        fetchAdmissions();
      } else {
        addToast('error', 'Failed to Add', json?.message || 'Failed to submit admission application.');
        console.error("Failed to add admission");
      }
    } catch (err: any) {
      console.error('Error adding admission', err);
      addToast('error', 'Network Error', err.message || 'Unable to submit application.');
    }
  };

  const updateAdmission = async (id: string, updates: Partial<AdmissionApplication>) => {
    try {
      const existing = admissions.find(a => a.id === id);
      if (!existing) return;
      const appData = { ...existing, ...updates };

      let isoDob = new Date().toISOString();
      if (appData.dob) {
        if (appData.dob.includes('/')) {
          const parts = appData.dob.split('/');
          if (parts.length === 3) {
            const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
            if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
          }
        } else {
          const parsed = new Date(appData.dob);
          if (!isNaN(parsed.getTime())) isoDob = parsed.toISOString();
        }
      }

      const payload = {
        applicantFullName: appData.applicantName || "",
        appliedClass: appData.appliedClass || "",
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
        scholarship: (appData as any).scholarship || appData.scholarshipId || "None",
        discount: (appData as any).discount || appData.discountId || "None"
      };

      await updateAdmissionApi(parseInt(id, 10), payload);

      setAdmissions(prev => prev.map(a => a.id === id ? appData as AdmissionApplication : a));
      logActivity('Updated Admission Record', `Updated application ID ${id}`);
    } catch (err) {
      console.error(err);
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setAdmissions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  };

  const deleteAdmission = async (id: string) => {
    try {
      await deleteAdmissionApi(parseInt(id, 10));
      setAdmissions(prev => prev.filter(a => a.id !== id));
      logActivity('Deleted Admission Record', `Removed application ID ${id}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Failed to delete admission from server.');
      setAdmissions(prev => prev.filter(a => a.id !== id)); // Local fallback
    }
  };

  const updateAdmissionStatus = async (id: string, status: AdmissionApplication['status']) => {
    const app = admissions.find(a => a.id === id);
    if (!app) return;

    const registrationNo = (app as any).registrationNo || app.applicationNo;

    try {
      const json = await updateAdmissionStatusApi(registrationNo, status);

      if (json && json.success !== false) {
        if (status === 'Enrolled' && app) {
          const addressParts = [
            app.addressHouseNo ? `H.No ${app.addressHouseNo}` : '',
            app.addressStreet,
            app.addressArea,
            app.addressCity,
            app.addressDistrict,
            app.addressState,
            app.addressPinCode ? `PIN: ${app.addressPinCode}` : ''
          ].filter(Boolean);
          const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Main Campus Area';

          // --- DYNAMIC FEE CALCULATION & ASSIGNMENT SETUP ---
          const clsName = app.appliedClass || 'Class 10';
          const dfs = dynamicFeeStructures.find(d => d.className === clsName && d.status === 'Active') || dynamicFeeStructures[0];
          const baseItems = dfs ? dfs.items : [
            { feeHeadId: 'FH-01', feeHeadName: 'Tuition Fee', amount: 25000 },
            { feeHeadId: 'FH-02', feeHeadName: 'Admission Fee', amount: 5000 },
            { feeHeadId: 'FH-03', feeHeadName: 'Books & Stationery Fee', amount: 4500 },
            { feeHeadId: 'FH-04', feeHeadName: 'Uniform & Sports Kit Fee', amount: 3500 },
            { feeHeadId: 'FH-05', feeHeadName: 'Science & Computer Lab Fee', amount: 2500 }
          ];

          const selectedOptional = app.selectedOptionalFees || [];
          const assignedFeeHeads = baseItems.filter(item => {
            const fh = feeHeads.find(h => h.id === item.feeHeadId || h.name === item.feeHeadName);
            const isMandatory = fh ? fh.mandatory : true;
            return isMandatory || selectedOptional.includes(item.feeHeadId);
          });
          const baseFeeTotal = assignedFeeHeads.reduce((acc, h) => acc + h.amount, 0);

          let additionalFees = 0;
          if (app.studentType === 'Day Scholar' && app.transportRequired) {
            const rObj = routeMasters.find(r => r.id === app.routeId || r.routeName === app.busRoute);
            const pObj = pickupPoints.find(p => p.id === app.pickupPointId || (rObj && p.routeId === rObj.id && p.pickupName === app.pickupPoint));
            const ftc = financeTransportConfigs.find(c => c.routeId === rObj?.id && (c.pickupPointId === pObj?.id || c.pickupName === pObj?.pickupName) && c.status === 'Active');
            additionalFees += ftc ? ftc.feeAmount : 5500;
          } else if (app.studentType === 'Hosteller' && app.hostelBed) {
            const hObj = hostelMasters.find(h => h.id === app.hostelBlock || h.hostelName === app.hostelBlock) || hostelMasters[0];
            const fhc = financeHostelConfigs.find(c => (c.hostelId === hObj?.id || c.hostelName === hObj?.hostelName) && c.status === 'Active') || financeHostelConfigs[0];
            additionalFees += fhc ? fhc.hostelFee : 40000;
            if (fhc && fhc.messFee) additionalFees += fhc.messFee;
            if (fhc && fhc.securityDeposit) additionalFees += fhc.securityDeposit;
          }

          let scholarshipAmount = 0;
          if (app.scholarshipId) {
            const sObj = scholarships.find(s => s.id === app.scholarshipId);
            if (sObj && sObj.status === 'Active') {
              const tuitionFeeAmount = assignedFeeHeads.find(i => i.feeHeadId === 'FH-001' || i.feeHeadName === 'Tuition Fee' || i.feeHeadId === 'FH-01')?.amount || 25000;
              const sVal = sObj.discountType === 'Percentage' ? (sObj.percentage || 0) : (sObj.fixedAmount || 0);
              scholarshipAmount = sObj.discountType === 'Percentage' ? (tuitionFeeAmount * sVal) / 100 : sVal;
            }
          }

          let discountAmount = 0;
          if (app.discountId) {
            const dObj = discounts.find(d => d.id === app.discountId);
            if (dObj && dObj.status === 'Active') {
              const tuitionFeeAmount = assignedFeeHeads.find(i => i.feeHeadId === 'FH-001' || i.feeHeadName === 'Tuition Fee' || i.feeHeadId === 'FH-01')?.amount || 25000;
              discountAmount = dObj.mode === 'Percentage' ? (tuitionFeeAmount * dObj.value) / 100 : dObj.value;
            }
          }

          const calculatedTotalFee = Math.max(0, baseFeeTotal + additionalFees - scholarshipAmount - discountAmount);

          const newStudent = addStudent({
            admissionNo: app.applicationNo || ('ADM2026-' + Math.floor(100 + Math.random() * 900)),
            rollNo: '20' + Math.floor(10 + Math.random() * 90),
            firstName: app.firstName || app.applicantName.split(' ')[0] || 'Enrolled',
            lastName: app.lastName || app.applicantName.slice(app.applicantName.indexOf(' ') + 1) || 'Student',
            gender: app.gender || 'Male',
            dob: app.dob || '15/08/2012',
            bloodGroup: app.bloodGroup || 'O+',
            religion: app.religion || 'General',
            casteCategory: app.casteCategory || 'General',
            className: app.appliedClass || 'Class 10',
            section: 'A',
            category: app.casteCategory || 'General',
            status: 'Active',
            avatar: app.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
            joiningDate: new Date().toISOString().split('T')[0],
            branch: app.branch || 'Main Campus',
            studentType: app.studentType || 'Day Scholar',
            transportRequired: app.transportRequired,
            routeId: app.routeId,
            busRoute: app.busRoute || 'Route A - North Suburbs',
            transportType: app.transportType || 'AC',
            pickupPointId: app.pickupPointId,
            pickupPoint: app.pickupPoint || '',
            dropPoint: app.dropPoint || '',
            hostelBlock: app.hostelBlock || '',
            hostelRoom: app.hostelRoom || '',
            hostelBed: app.hostelBed || '',
            boardType: 'CBSE',
            fatherName: app.parentName || 'Father Name',
            fatherPhone: app.phone || '9876543210',
            fatherOccupation: 'Business',
            motherName: app.motherName || 'Mother Name',
            motherPhone: app.phone || '9876543210',
            email: app.email,
            phone: app.phone,
            alternatePhone: app.alternatePhone,
            address: fullAddress,
            siblingsCount: app.siblingsCount || 0,
            totalFee: calculatedTotalFee,
            paidFee: 0,
            dueFee: calculatedTotalFee,
            attendancePct: 100.0,
            gpa: 4.0
          });

          // Create Student Fee Assignment based on selected fee types
          const sfaId = 'SFA-' + Math.floor(100 + Math.random() * 900);
          const assignment: StudentFeeAssignment = {
            id: sfaId,
            studentId: newStudent.id,
            studentName: `${newStudent.firstName} ${newStudent.lastName}`,
            admissionNo: newStudent.admissionNo,
            branch: newStudent.branch || selectedBranch || 'Main Campus',
            academicYear: dfs?.academicYear || '2025-2026',
            className: newStudent.className,
            section: newStudent.section,
            feeStructureId: dfs?.id || 'DFS-FALLBACK',
            assignedFeeHeads,
            baseFeeTotal,
            assignedDate: new Date().toISOString().split('T')[0],
            status: 'Active'
          };
          setStudentFeeAssignments(prev => [...prev.filter(a => a.studentId !== newStudent.id), assignment]);

          // Auto-assign transport facility if Day Scholar opted for transport
          if (app.studentType === 'Day Scholar' && app.transportRequired) {
            const rObj = routeMasters.find(r => r.id === app.routeId || r.routeName === app.busRoute);
            const pObj = pickupPoints.find(p => p.id === app.pickupPointId || (rObj && p.routeId === rObj.id && p.pickupName === app.pickupPoint));
            const ftc = financeTransportConfigs.find(c => c.routeId === rObj?.id && (c.pickupPointId === pObj?.id || c.pickupName === pObj?.pickupName) && c.status === 'Active');

            const trpFee = ftc ? ftc.feeAmount : 5500;
            assignStudentTransport({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              routeId: rObj?.id || 'RM-01',
              routeName: rObj?.routeName || app.busRoute || 'Route A',
              pickupPoint: pObj?.pickupName || app.pickupPoint || 'Miyapur Junction',
              feePlan: (ftc?.feePlan || 'Quarterly') as any,
              feeAmount: trpFee,
              effectiveFrom: new Date().toISOString().split('T')[0],
              status: 'Active'
            });
          }

          // Auto-assign hostel facility if Hosteller
          if (app.studentType === 'Hosteller' && app.hostelBed) {
            const hObj = hostelMasters.find(h => h.id === app.hostelBlock || h.hostelName === app.hostelBlock) || hostelMasters[0];
            const rObj = roomMasters.find(r => r.id === app.hostelRoom) || roomMasters[0];
            const fhc = financeHostelConfigs.find(
              c => (c.hostelId === hObj?.id || c.hostelName === hObj?.hostelName) && c.status === 'Active'
            ) || financeHostelConfigs[0];
            const hstFee = fhc ? fhc.hostelFee : 40000;

            const hostelBlockId = hObj?.id || 'HM-01';
            const hostelBlockName = hObj?.hostelName || 'Boys Hostel';
            const roomNumberStr = rObj?.roomNumber || '101';

            assignStudentHostel({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              hostelId: hostelBlockId,
              hostelName: hostelBlockName,
              roomNo: roomNumberStr,
              bedNo: app.hostelBed || 'BED-1',
              feeAmount: hstFee,
              effectiveFrom: new Date().toISOString().split('T')[0],
              status: 'Active'
            });

            assignStudentHostelRoom({
              studentId: newStudent.id,
              studentName: `${newStudent.firstName} ${newStudent.lastName}`,
              admissionNo: newStudent.admissionNo,
              hostelId: hostelBlockId,
              hostelName: hostelBlockName,
              roomId: rObj?.id || 'RM-01',
              roomNo: roomNumberStr,
              bedNo: app.hostelBed || 'BED-1',
              joiningDate: new Date().toISOString().split('T')[0],
              status: 'Active'
            });
          }

          // Automatically generate Student Fee Ledger for newly enrolled student
          setTimeout(() => generateStudentFeeLedger(newStudent.id), 50);
        }

          // Update state to match API success
          setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
          logActivity('Updated Application Status', `Changed application ID ${id} to ${status}`);
          try {
            await fetchAdmissions();
          } catch (fetchErr) {
            console.error("Failed to refresh admissions list", fetchErr);
          }
      } else {
        addToast('error', 'Update Failed', json?.message || `Failed to update status to ${status}`);
      }
    } catch (err: any) {
      console.error('Error updating admission status', err);
      addToast('error', 'Network Error', err.message || 'Failed to update application status.');
    }
  };


  const addAcademicClass = (clsData: Omit<AcademicClass, 'id'>) => {
    const id = 'CL-' + Math.floor(10 + Math.random() * 90);
    const newCls: AcademicClass = { ...clsData, id, branch: (clsData as any).branch || selectedBranch || 'Main Campus' } as any;
    setAcademicClasses(prev => [...prev, newCls]);
    logActivity('Created Academic Class', `Added ${newCls.name}`);
  };

  const updateAcademicClass = (id: string, updates: Partial<AcademicClass>) => {
    setAcademicClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logActivity('Updated Academic Class', `Updated class ID ${id}`);
  };

  const deleteAcademicClass = (id: string) => {
    const cls = academicClasses.find(c => c.id === id);
    if (cls) {
      setStudents(prev => prev.map(s => s.className === cls.name ? { ...s, className: '', section: '', rollNo: '' } : s));
    }
    setAcademicClasses(prev => prev.filter(c => c.id !== id));
    logActivity('Deleted Academic Class', `Removed class ID ${id}`);
  };

  // Subjects CRUD
  const addSubject = (subjectData: Omit<SubjectItem, 'id'>) => {
    const id = 'SUB-' + Math.floor(100 + Math.random() * 900);
    const newSub: SubjectItem = {
      ...subjectData,
      id,
      code: subjectData.code || subjectData.subjectId,
      branch: (subjectData as any).branch || selectedBranch || 'Main Campus'
    } as any;
    setSubjects(prev => [...prev, newSub]);
    logActivity('Created Subject', `Added subject ${newSub.name} (${newSub.subjectId})`);
  };

  const updateSubject = (id: string, updates: Partial<SubjectItem>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Updated Subject', `Updated subject ID ${id}`);
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    logActivity('Deleted Subject', `Removed subject ID ${id}`);
  };

  // Bus CRUD
  const addBus = (busData: Omit<Bus, 'id'>) => {
    const id = 'BUS-' + Math.floor(10 + Math.random() * 90);
    const newBus: Bus = { ...busData, id, branch: (busData as any).branch || selectedBranch || 'Main Campus' } as any;
    setBuses(prev => [...prev, newBus]);
    logActivity('Added Bus', `Registered Bus ${newBus.busNumber} (${newBus.routeName})`);
  };

  const updateBus = (id: string, updates: Partial<Bus>) => {
    setBuses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    logActivity('Updated Bus', `Updated details for Bus ID ${id}`);
  };

  const deleteBus = (id: string) => {
    setBuses(prev => prev.filter(b => b.id !== id));
    logActivity('Deleted Bus', `Removed Bus ID ${id}`);
  };

  // Hostel CRUD
  const addHostelBlock = (blockData: Omit<HostelBlock, 'id'>) => {
    const id = 'BLK-' + Math.floor(10 + Math.random() * 90);
    const newBlock: HostelBlock = { ...blockData, id };
    setHostelBlocks(prev => [...prev, newBlock]);
  };

  const updateHostelBlock = (id: string, updates: Partial<HostelBlock>) => {
    setHostelBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteHostelBlock = (id: string) => {
    setHostelBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addHostelBed = (bedData: Omit<HostelBed, 'id'>) => {
    const id = 'BED-' + Math.floor(100 + Math.random() * 900);
    const newBed: HostelBed = { ...bedData, id };
    setHostelBeds(prev => [...prev, newBed]);
  };

  const updateHostelBed = (id: string, updates: Partial<HostelBed>) => {
    setHostelBeds(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteHostelBed = (id: string) => {
    setHostelBeds(prev => prev.filter(b => b.id !== id));
  };

  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>(defaultPeriodSettings);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(defaultTeacherAssignments);

  const addPeriodSetting = (data: Omit<PeriodSetting, 'id'>) => {
    const id = 'PS-' + Math.floor(100 + Math.random() * 900);
    const newPs: PeriodSetting = { ...data, id };
    setPeriodSettings(prev => [...prev, newPs]);
    logActivity('Created Period Setting', `Added ${newPs.periodName} (${newPs.startTime}-${newPs.endTime})`);
  };

  const updatePeriodSetting = (id: string, updates: Partial<PeriodSetting>) => {
    setPeriodSettings(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePeriodSetting = (id: string) => {
    setPeriodSettings(prev => prev.filter(p => p.id !== id));
  };

  const addTeacherAssignment = (data: Omit<TeacherAssignment, 'id'>) => {
    const id = 'TA-' + Math.floor(100 + Math.random() * 900);
    const newTa: TeacherAssignment = { ...data, id };
    setTeacherAssignments(prev => [...prev.filter(t => !(t.className === data.className && t.section === data.section && t.subject === data.subject)), newTa]);
    logActivity('Assigned Subject Teacher', `Assigned ${data.teacherName} to ${data.className}-${data.section} ${data.subject}`);
  };

  const updateTeacherAssignment = (id: string, updates: Partial<TeacherAssignment>) => {
    setTeacherAssignments(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTeacherAssignment = (id: string) => {
    setTeacherAssignments(prev => prev.filter(t => t.id !== id));
  };

  const publishClassTimetable = (className: string, section: string, academicYear?: string, branch?: string) => {
    setTimetable(prev => prev.map(t => {
      if (t.className === className && t.section === section) {
        return { ...t, status: 'Published' };
      }
      return t;
    }));
    logActivity('Published Timetable', `Published timetable for ${className}-${section}`);
  };
  const addUniform = (itemData: Omit<UniformItem, 'id'>) => {
    const id = 'UNI-' + Math.floor(100 + Math.random() * 900);
    const newItem: UniformItem = { ...itemData, id };
    setUniforms(prev => [...prev, newItem]);
  };

  const updateUniform = (id: string, updates: Partial<UniformItem>) => {
    setUniforms(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUniform = (id: string) => {
    setUniforms(prev => prev.filter(u => u.id !== id));
  };

  // Custom Roles CRUD
  const addCustomRole = (roleData: Omit<CustomRole, 'id'>) => {
    const id = 'ROLE-' + Math.floor(100 + Math.random() * 900);
    const newRole: CustomRole = { ...roleData, id };
    setCustomRoles(prev => [...prev, newRole]);
    logActivity('Created User Role', `Configured role ${newRole.name}`);
  };

  const updateCustomRole = (id: string, updates: Partial<CustomRole>) => {
    setCustomRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteCustomRole = (id: string) => {
    setCustomRoles(prev => prev.filter(r => r.id !== id));
  };

  const addFeeStructure = (feeStruct: Omit<FeeStructure, 'id'>) => {
    const id = 'FEE-' + Math.floor(100 + Math.random() * 900);
    const newStruct: FeeStructure = { ...feeStruct, id, branch: (feeStruct as any).branch || selectedBranch || 'Main Campus' } as any;
    setFeeStructures(prev => [...prev, newStruct]);
    logActivity('Configured Fee Structure', `Added fee structure for ${newStruct.className} (${newStruct.term})`);
  };

  const updateFeeStructure = (id: string, updates: Partial<FeeStructure>) => {
    setFeeStructures(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFeeStructure = (id: string) => {
    setFeeStructures(prev => prev.filter(f => f.id !== id));
  };

  // Fee Payments CRUD with Student Fee Ledger Update
  const addFeePayment = (paymentData: Omit<FeePayment, 'id' | 'receiptNo'>): FeePayment => {
    const id = 'PAY-' + Math.floor(100 + Math.random() * 900);
    const receiptNo = financeSettings.receiptPrefix + Math.floor(1000 + Math.random() * 9000);
    const newPayment: FeePayment = { ...paymentData, id, receiptNo, branch: (paymentData as any).branch || selectedBranch || 'Main Campus' } as any;
    setFeePayments(prev => [newPayment, ...prev]);

    setStudents(prev => prev.map(s => {
      if (s.id === paymentData.studentId) {
        const newPaid = s.paidFee + paymentData.amountPaid;
        const newDue = Math.max(0, s.totalFee - newPaid);
        return { ...s, paidFee: newPaid, dueFee: newDue };
      }
      return s;
    }));

    // Update Student Fee Ledger
    setStudentFeeLedgers(prev => prev.map(ledger => {
      if (ledger.studentId === paymentData.studentId) {
        const newPaid = ledger.paidAmount + paymentData.amountPaid;
        const newDue = Math.max(0, ledger.totalPayable - newPaid);
        return {
          ...ledger,
          paidAmount: newPaid,
          dueBalance: newDue,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return ledger;
    }));

    logActivity('Collected Fee', `Processed payment of ${formatCurrency(newPayment.amountPaid)} for ${newPayment.studentName}`);

    // Automatic Master Finance Ledger Entry Creation
    const autoLedgerTxn: FinanceTransaction = {
      id: 'TXN-' + Date.now(),
      transactionId: 'TXN-2026-' + Math.floor(100000 + Math.random() * 900000),
      date: newPayment.paymentDate || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Income',
      category: (newPayment as any).feeType || 'Student Tuition Fees',
      sourceModule: 'Student Fee Collection',
      referenceNumber: newPayment.receiptNo,
      referenceRecordId: newPayment.id,
      description: `Student Fee Collection from ${newPayment.studentName} (${newPayment.className})`,
      amount: newPayment.amountPaid,
      paymentMode: (newPayment.paymentMode as any) || 'Cash',
      account: newPayment.paymentMode === 'Cash' ? 'Cash' : 'Main Bank Account',
      branch: (newPayment as any).branch || selectedBranch || 'Main Campus',
      academicYear: '2025-2026',
      status: 'Completed',
      createdBy: 'System Auto-Ledger',
      auditTrail: [
        {
          id: 'AUD-AUTO-' + Date.now(),
          action: 'Created',
          user: 'System Auto-Ledger',
          timestamp: new Date().toLocaleString(),
          notes: `Automatically recorded from Student Fee Payment ${newPayment.receiptNo}`
        }
      ]
    };

    setFinanceTransactions(prev => [autoLedgerTxn, ...prev]);

    // Update Financial Account Balance
    setFinancialAccounts(prev => prev.map(acc => {
      if (acc.accountType === autoLedgerTxn.account) {
        return { ...acc, currentBalance: acc.currentBalance + autoLedgerTxn.amount };
      }
      return acc;
    }));

    return newPayment;
  };

  // Master Finance Ledger CRUD Engine
  const addFinanceTransaction = (txnData: Omit<FinanceTransaction, 'id' | 'transactionId'>): FinanceTransaction => {
    const id = 'TXN-' + Date.now();
    const transactionId = 'TXN-2026-' + Math.floor(100000 + Math.random() * 900000);
    const newTxn: FinanceTransaction = {
      ...txnData,
      id,
      transactionId,
      branch: txnData.branch || selectedBranch || 'Main Campus',
      auditTrail: [
        {
          id: 'AUD-' + Date.now(),
          action: 'Created',
          user: txnData.createdBy || 'Finance Admin',
          timestamp: new Date().toLocaleString(),
          notes: 'Master Ledger Entry Created'
        }
      ]
    };

    setFinanceTransactions(prev => [newTxn, ...prev]);

    // Update Account Balance
    setFinancialAccounts(prev => prev.map(acc => {
      if (acc.accountType === newTxn.account) {
        const delta = newTxn.type === 'Income' ? newTxn.amount : -newTxn.amount;
        return { ...acc, currentBalance: acc.currentBalance + delta };
      }
      return acc;
    }));

    // Update Budget if Expense
    if (newTxn.type === 'Expense') {
      setFinancialBudgets(prev => prev.map(b => {
        if (b.categoryName === newTxn.category) {
          const newConsumed = b.consumedAmount + newTxn.amount;
          const newRemaining = Math.max(0, b.allocatedAmount - newConsumed);
          return {
            ...b,
            consumedAmount: newConsumed,
            remainingAmount: newRemaining,
            status: newConsumed > b.allocatedAmount ? 'Exceeded' : 'Active'
          };
        }
        return b;
      }));
    }

    logActivity('Recorded Financial Transaction', `Added ${newTxn.type} ${transactionId} for ${formatCurrency(newTxn.amount)}`);
    return newTxn;
  };

  const reverseFinanceTransaction = (transactionId: string, reason: string, user: string) => {
    setFinanceTransactions(prev => prev.map(t => {
      if (t.transactionId === transactionId || t.id === transactionId) {
        const logItem: TransactionAuditLog = {
          id: 'AUD-REV-' + Date.now(),
          action: 'Reversed',
          user: user,
          timestamp: new Date().toLocaleString(),
          notes: `Transaction Reversed: ${reason}`
        };

        // Offset Account Balance
        setFinancialAccounts(accs => accs.map(acc => {
          if (acc.accountType === t.account) {
            const offsetDelta = t.type === 'Income' ? -t.amount : t.amount;
            return { ...acc, currentBalance: acc.currentBalance + offsetDelta };
          }
          return acc;
        }));

        return {
          ...t,
          status: 'Reversed',
          auditTrail: [...(t.auditTrail || []), logItem]
        };
      }
      return t;
    }));

    logActivity('Reversed Financial Transaction', `Reversed ${transactionId}. Reason: ${reason}`);
  };

  const cancelFinanceTransaction = (transactionId: string, reason: string, user: string) => {
    reverseFinanceTransaction(transactionId, reason, user);
  };

  const addFinancialAccount = (accountData: Omit<FinancialAccount, 'id'>) => {
    const id = 'ACC-' + Math.floor(10 + Math.random() * 90);
    const newAcc: FinancialAccount = { ...accountData, id };
    setFinancialAccounts(prev => [...prev, newAcc]);
    logActivity('Created Financial Account', `Added Account ${newAcc.accountName}`);
  };

  const updateFinancialAccount = (id: string, updates: Partial<FinancialAccount>) => {
    setFinancialAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const addFinancialCategory = (categoryData: Omit<FinancialCategory, 'id'>) => {
    const id = 'CAT-' + Math.floor(100 + Math.random() * 900);
    const newCat: FinancialCategory = { ...categoryData, id };
    setFinancialCategories(prev => [...prev, newCat]);
    logActivity('Created Financial Category', `Added ${newCat.type} Category ${newCat.name}`);
  };

  const updateFinancialCategory = (id: string, updates: Partial<FinancialCategory>) => {
    setFinancialCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateFinancialBudget = (id: string, allocatedAmount: number) => {
    setFinancialBudgets(prev => prev.map(b => {
      if (b.id === id) {
        const remaining = Math.max(0, allocatedAmount - b.consumedAmount);
        return {
          ...b,
          allocatedAmount,
          remainingAmount: remaining,
          status: b.consumedAmount > allocatedAmount ? 'Exceeded' : 'Active'
        };
      }
      return b;
    }));
  };

  // ==========================================
  // ERP FINANCE SYSTEM CRUD & ENGINE
  // ==========================================

  // 1. Fee Types CRUD
  const addFeeHead = (head: Omit<FeeHead, 'id'>) => {
    const id = 'FH-' + Math.floor(100 + Math.random() * 900);
    const newHead: FeeHead = {
      ...head,
      id,
      applicableBranches: head.applicableBranches && head.applicableBranches.length > 0
        ? head.applicableBranches
        : [selectedBranch || 'Main Campus']
    };
    setFeeHeads(prev => [...prev, newHead]);
    logActivity('Created Fee Head', `Added ${newHead.name} (${newHead.code})`);
  };

  const updateFeeHead = (id: string, updates: Partial<FeeHead>) => {
    setFeeHeads(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    logActivity('Updated Fee Head', `Updated Fee Head ID ${id}`);
  };

  const deleteFeeHead = (id: string) => {
    setFeeHeads(prev => prev.filter(f => f.id !== id));
    logActivity('Deleted Fee Head', `Removed Fee Head ID ${id}`);
  };

  const toggleFeeHeadStatus = (id: string) => {
    setFeeHeads(prev => prev.map(f => f.id === id ? { ...f, status: f.status === 'Active' ? 'Inactive' : 'Active' } : f));
  };

  // 2. Dynamic Fee Structures CRUD
  const addDynamicFeeStructure = (dfs: Omit<DynamicFeeStructure, 'id'>) => {
    const id = 'DFS-' + Math.floor(100 + Math.random() * 900);
    const newDfs: DynamicFeeStructure = { ...dfs, id, branch: dfs.branch || selectedBranch || 'Main Campus' };
    setDynamicFeeStructures(prev => [...prev, newDfs]);
    logActivity('Created Dynamic Fee Structure', `Added structure for ${newDfs.className}`);
  };

  const updateDynamicFeeStructure = (id: string, updates: Partial<DynamicFeeStructure>) => {
    setDynamicFeeStructures(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    logActivity('Updated Dynamic Fee Structure', `Updated structure ID ${id}`);
  };

  const deleteDynamicFeeStructure = (id: string) => {
    setDynamicFeeStructures(prev => prev.filter(d => d.id !== id));
    logActivity('Deleted Dynamic Fee Structure', `Removed structure ID ${id}`);
  };

  // 3. Student Fee Assignment
  const assignFeeStructure = (studentId: string, feeStructureId: string) => {
    const st = students.find(s => s.id === studentId);
    const dfs = dynamicFeeStructures.find(d => d.id === feeStructureId);
    if (!st || !dfs) return;

    const id = 'SFA-' + Math.floor(100 + Math.random() * 900);
    const assignment: StudentFeeAssignment = {
      id,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      branch: st.branch || selectedBranch || 'Main Campus',
      academicYear: dfs.academicYear,
      className: st.className,
      section: st.section,
      feeStructureId: dfs.id,
      assignedFeeHeads: dfs.items,
      baseFeeTotal: dfs.totalAmount,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    setStudentFeeAssignments(prev => [...prev.filter(a => a.studentId !== studentId), assignment]);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, totalFee: dfs.totalAmount, dueFee: Math.max(0, dfs.totalAmount - s.paidFee) } : s));
    logActivity('Assigned Fee Structure', `Assigned ${dfs.className} structure to ${st.firstName} ${st.lastName}`);

    setTimeout(() => recalculateStudentFeeLedger(studentId), 50);
  };

  const bulkAssignFeeStructure = (studentIds: string[], feeStructureId: string) => {
    studentIds.forEach(id => assignFeeStructure(id, feeStructureId));
  };

  const updateStudentFeeAssignment = (id: string, updates: Partial<StudentFeeAssignment>) => {
    setStudentFeeAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeStudentFeeAssignment = (id: string) => {
    setStudentFeeAssignments(prev => prev.filter(a => a.id !== id));
  };

  // 4. Scholarships CRUD
  const addScholarship = (sch: Omit<Scholarship, 'id'>) => {
    const id = 'SCH-' + Math.floor(100 + Math.random() * 900);
    const newSch: Scholarship = { ...sch, id };
    setScholarships(prev => [...prev, newSch]);
    logActivity('Created Scholarship', `Added scholarship ${newSch.name}`);
  };

  const updateScholarship = (id: string, updates: Partial<Scholarship>) => {
    setScholarships(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteScholarship = (id: string) => {
    setScholarships(prev => prev.filter(s => s.id !== id));
  };

  const assignScholarshipToStudent = (studentId: string, scholarshipId: string) => {
    const st = students.find(s => s.id === studentId);
    const sch = scholarships.find(s => s.id === scholarshipId);
    if (!st || !sch) return;

    const id = 'SSCH-' + Math.floor(100 + Math.random() * 900);
    const newAlloc: StudentScholarship = {
      id,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      scholarshipId: sch.id,
      scholarshipName: sch.name,
      discountType: sch.discountType,
      discountValue: sch.discountType === 'Percentage' ? (sch.percentage || 0) : (sch.fixedAmount || 0),
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    setStudentScholarships(prev => [...prev.filter(s => s.studentId !== studentId || s.scholarshipId !== scholarshipId), newAlloc]);
    logActivity('Allocated Scholarship', `Assigned ${sch.name} to ${st.firstName} ${st.lastName}`);

    setTimeout(() => recalculateStudentFeeLedger(studentId), 50);
  };

  const revokeStudentScholarship = (id: string) => {
    setStudentScholarships(prev => prev.filter(s => s.id !== id));
  };

  // 5. Discounts & Concessions CRUD
  const addDiscount = (disc: Omit<Discount, 'id'>) => {
    const id = 'DSC-' + Math.floor(100 + Math.random() * 900);
    const newDisc: Discount = { ...disc, id };
    setDiscounts(prev => [...prev, newDisc]);
  };

  const updateDiscount = (id: string, updates: Partial<Discount>) => {
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDiscount = (id: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== id));
  };

  const assignDiscountToStudent = (studentId: string, discountId: string) => {
    const disc = discounts.find(d => d.id === discountId);
    if (!disc) return;

    const id = 'SDSC-' + Math.floor(100 + Math.random() * 900);
    const newAlloc: StudentDiscount = {
      id,
      studentId,
      discountId,
      discountName: disc.name,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setStudentDiscounts(prev => [...prev.filter(d => d.studentId !== studentId || d.discountId !== discountId), newAlloc]);

    setTimeout(() => recalculateStudentFeeLedger(studentId), 50);
  };

  const removeStudentDiscount = (id: string) => {
    setStudentDiscounts(prev => prev.filter(d => d.id !== id));
  };

  // 6. Fine Rules CRUD
  const addFineRule = (rule: Omit<FineRule, 'id'>) => {
    const id = 'FR-' + Math.floor(100 + Math.random() * 900);
    const newRule: FineRule = { ...rule, id };
    setFineRules(prev => [...prev, newRule]);
  };

  const updateFineRule = (id: string, updates: Partial<FineRule>) => {
    setFineRules(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFineRule = (id: string) => {
    setFineRules(prev => prev.filter(f => f.id !== id));
  };

  // 7. Transport Routes CRUD
  const addERPTransportRoute = (route: Omit<ERPTransportRoute, 'id'>) => {
    const id = 'TRP-' + Math.floor(100 + Math.random() * 900);
    const newRoute: ERPTransportRoute = { ...route, id, branch: (route as any).branch || selectedBranch || 'Main Campus' } as any;
    setERPTransportRoutes(prev => [...prev, newRoute]);
  };

  const updateERPTransportRoute = (id: string, updates: Partial<ERPTransportRoute>) => {
    setERPTransportRoutes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteERPTransportRoute = (id: string) => {
    setERPTransportRoutes(prev => prev.filter(r => r.id !== id));
  };

  // 8. Student Transport Assignment
  const assignStudentTransport = async (st: Omit<StudentTransport, 'id'>) => {
    try {
      const studentIdInt = parseInt(st.studentId.replace(/\D/g, ''), 10) || 0;
      const routeIdInt = parseInt(st.routeId.replace(/\D/g, ''), 10) || 0;

      const pickupObj = pickupPoints.find(p => p.pickupName === st.pickupPoint && p.routeId === st.routeId) || pickupPoints[0];
      const pickupPointIdInt = pickupObj ? parseInt(pickupObj.id.replace(/\D/g, ''), 10) || 1 : 1;

      const vaObj = vehicleAssignments.find(va => va.routeId === st.routeId) || vehicleAssignments[0];
      const vaIdInt = vaObj ? parseInt(vaObj.id.replace(/\D/g, ''), 10) || 1 : 1;

      const payload = {
        studentId: studentIdInt || 1,
        routeId: routeIdInt || 1,
        pickupPointId: pickupPointIdInt || 1,
        vehicleAssignmentId: vaIdInt || 1,
        effectiveFrom: st.effectiveFrom,
        effectiveTo: st.effectiveTo || null,
        transportType: "Both",
        remarks: "",
        status: st.status === 'Active'
      };

      const response = await TransportAPI.createStudentAssignmentApi(payload as any);
      const backendData = response?.data || {};

      const id = (backendData.id || backendData.assignmentId || 'STRP-' + Math.floor(100 + Math.random() * 900)).toString();
      const newAssignment: StudentTransport = { ...st, ...backendData, id, branch: (st as any).branch || selectedBranch || 'Main Campus' } as any;
      setStudentTransports(prev => [...prev.filter(t => t.studentId !== st.studentId), newAssignment]);
      logActivity('Assigned Transport', `Assigned route ${st.routeName} to ${st.studentName}`);
      setTimeout(() => recalculateStudentFeeLedger(st.studentId), 50);
    } catch (err: any) {
      addToast('error', 'API Sync Failed', err?.message || 'Operating in local fallback mode');
      const id = 'STRP-' + Math.floor(100 + Math.random() * 900);
      const newAssignment: StudentTransport = { ...st, id, branch: (st as any).branch || selectedBranch || 'Main Campus' } as any;
      setStudentTransports(prev => [...prev.filter(t => t.studentId !== st.studentId), newAssignment]);
      logActivity('Assigned Transport', `Assigned route ${st.routeName} to ${st.studentName}`);
      setTimeout(() => recalculateStudentFeeLedger(st.studentId), 50);
    }
  };

  const removeStudentTransport = async (id: string) => {
    try {
      const assignmentIdInt = parseInt(id.replace(/\D/g, ''), 10) || 0;
      await TransportAPI.deleteStudentAssignmentApi(assignmentIdInt.toString());

      const target = studentTransports.find(t => t.id === id);
      setStudentTransports(prev => prev.filter(t => t.id !== id));
      if (target) {
        setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
      }
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const target = studentTransports.find(t => t.id === id);
      setStudentTransports(prev => prev.filter(t => t.id !== id));
      if (target) {
        setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
      }
    }
  };

  // 9. Hostel Masters CRUD
  const addHostelMaster = (h: Omit<HostelMaster, 'id'>) => {
    const id = 'HM-' + Math.floor(100 + Math.random() * 900);
    const newHostel: HostelMaster = { ...h, id, branch: (h as any).branch || selectedBranch || 'Main Campus' } as any;
    setHostelMasters(prev => [...prev, newHostel]);
    logActivity('Added Hostel Master', `Created hostel ${newHostel.hostelName}`);
  };

  const updateHostelMaster = (id: string, updates: Partial<HostelMaster>) => {
    setHostelMasters(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHostelMaster = (id: string) => {
    setHostelMasters(prev => prev.filter(h => h.id !== id));
  };

  // Room Type Master CRUD
  const addRoomTypeMaster = (rtData: Omit<RoomTypeMaster, 'id'>) => {
    const id = 'RT-' + Math.floor(100 + Math.random() * 900);
    const newRt: RoomTypeMaster = { ...rtData, id };
    setRoomTypeMasters(prev => [newRt, ...prev]);
    logActivity('Added Room Type Master', `Created room type ${newRt.roomTypeName}`);
  };

  const updateRoomTypeMaster = (id: string, updates: Partial<RoomTypeMaster>) => {
    setRoomTypeMasters(prev => prev.map(rt => rt.id === id ? { ...rt, ...updates } : rt));
  };

  const deleteRoomTypeMaster = (id: string) => {
    setRoomTypeMasters(prev => prev.filter(rt => rt.id !== id));
  };

  // Room Master CRUD
  const addRoomMaster = (rmData: Omit<RoomMaster, 'id'>) => {
    const id = 'RM-' + Math.floor(100 + Math.random() * 900);
    const newRm: RoomMaster = { ...rmData, id, branch: (rmData as any).branch || selectedBranch || 'Main Campus' } as any;
    setRoomMasters(prev => [newRm, ...prev]);
    logActivity('Added Room Master', `Created room #${newRm.roomNumber} in ${newRm.hostelName}`);
  };

  const updateRoomMaster = (id: string, updates: Partial<RoomMaster>) => {
    setRoomMasters(prev => prev.map(rm => rm.id === id ? { ...rm, ...updates } : rm));
  };

  const deleteRoomMaster = (id: string) => {
    setRoomMasters(prev => prev.filter(rm => rm.id !== id));
  };

  // Student Hostel Assignment CRUD
  const assignStudentHostelRoom = (shaData: Omit<StudentHostelAssignment, 'id'>) => {
    const id = 'SHA-' + Math.floor(100 + Math.random() * 900);
    const newSha: StudentHostelAssignment = { ...shaData, id };
    setStudentHostelAssignments(prev => [...prev.filter(a => a.studentId !== shaData.studentId || a.status !== 'Active'), newSha]);
    logActivity('Assigned Student Hostel Room', `Assigned ${newSha.studentName} to Room #${newSha.roomNo}`);
    setTimeout(() => generateStudentFeeLedger(newSha.studentId), 50);
  };

  const updateStudentHostelAssignment = (id: string, updates: Partial<StudentHostelAssignment>) => {
    setStudentHostelAssignments(prev => prev.map(sha => sha.id === id ? { ...sha, ...updates } : sha));
  };

  const deleteStudentHostelAssignment = (id: string) => {
    setStudentHostelAssignments(prev => prev.filter(sha => sha.id !== id));
  };

  // Visitor Log CRUD
  const addHostelVisitorLog = (vlData: Omit<HostelVisitorLog, 'id'>) => {
    const id = 'HVL-' + Math.floor(100 + Math.random() * 900);
    const newVl: HostelVisitorLog = { ...vlData, id };
    setHostelVisitorLogs(prev => [newVl, ...prev]);
    logActivity('Added Hostel Visitor Log', `Visitor ${newVl.visitorName} checked in for ${newVl.studentName}`);
  };

  const updateHostelVisitorLogStatus = (id: string, status: 'In' | 'Out', outTime?: string) => {
    setHostelVisitorLogs(prev => prev.map(vl => vl.id === id ? { ...vl, status, outTime: outTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : vl));
  };

  // Attendance Log
  const recordHostelAttendance = (attData: Omit<HostelAttendanceLog, 'id'>) => {
    const id = 'HAL-' + Math.floor(100 + Math.random() * 900);
    const newAtt: HostelAttendanceLog = { ...attData, id };
    setHostelAttendanceLogs(prev => [...prev.filter(a => !(a.studentId === attData.studentId && a.date === attData.date)), newAtt]);
  };

  // Finance -> Hostel Pricing Config CRUD
  const addFinanceHostelConfig = (cData: Omit<FinanceHostelConfig, 'id'>) => {
    const id = 'FHC-' + Math.floor(100 + Math.random() * 900);
    const newC: FinanceHostelConfig = { ...cData, id };
    setFinanceHostelConfigs(prev => [newC, ...prev]);
    logActivity('Added Finance Hostel Config', `Configured pricing for ${newC.hostelName}`);
  };

  const updateFinanceHostelConfig = (id: string, updates: Partial<FinanceHostelConfig>) => {
    setFinanceHostelConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteFinanceHostelConfig = (id: string) => {
    setFinanceHostelConfigs(prev => prev.filter(c => c.id !== id));
  };

  // 10. Student Hostel Assignment
  const assignStudentHostel = (sh: Omit<StudentHostel, 'id'>) => {
    const id = 'SHST-' + Math.floor(100 + Math.random() * 900);
    const newAssignment: StudentHostel = { ...sh, id, branch: (sh as any).branch || selectedBranch || 'Main Campus' } as any;
    setStudentHostels(prev => [...prev.filter(h => h.studentId !== sh.studentId), newAssignment]);
    logActivity('Assigned Hostel', `Assigned ${sh.hostelName} Room ${sh.roomNo} to ${sh.studentName}`);

    setTimeout(() => recalculateStudentFeeLedger(sh.studentId), 50);
  };

  const removeStudentHostel = (id: string) => {
    const target = studentHostels.find(h => h.id === id);
    setStudentHostels(prev => prev.filter(h => h.id !== id));
    if (target) {
      setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
    }
  };

  // 11. Refunds CRUD
  const addRefund = (r: Omit<Refund, 'id' | 'refundNo'>) => {
    const id = 'RFD-' + Math.floor(100 + Math.random() * 900);
    const refundNo = 'RF-2026-' + Math.floor(1000 + Math.random() * 9000);
    const newRefund: Refund = { ...r, id, refundNo, branch: (r as any).branch || selectedBranch || 'Main Campus' } as any;
    setRefunds(prev => [newRefund, ...prev]);
    logActivity('Requested Refund', `Created refund request ${refundNo} for ${formatCurrency(r.amount)}`);
  };

  const updateRefundStatus = (id: string, status: Refund['status'], approvedBy = 'Admin User') => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status, approvedBy } : r));
  };

  // 12. Settings
  const updateFinanceSettings = (settings: Partial<FinanceSettings>) => {
    setFinanceSettings(prev => ({ ...prev, ...settings }));
    logActivity('Updated Finance Settings', 'Configured tax, receipt format & currency settings');
  };

  // 13. FINANCE -> TRANSPORT CONFIGURATION CRUD
  const addFinanceTransportConfig = (c: Omit<FinanceTransportConfig, 'id'>) => {
    const id = 'FTC-' + Math.floor(100 + Math.random() * 900);
    const newConfig: FinanceTransportConfig = { ...c, id, branch: (c as any).branch || selectedBranch || 'Main Campus' } as any;
    setFinanceTransportConfigs(prev => [...prev, newConfig]);
    logActivity('Created Transport Fee Structure', `Set ${newConfig.feePlan} fee ${formatCurrency(newConfig.feeAmount)} for ${newConfig.pickupName}`);
  };

  const updateFinanceTransportConfig = (id: string, updates: Partial<FinanceTransportConfig>) => {
    setFinanceTransportConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteFinanceTransportConfig = (id: string) => {
    setFinanceTransportConfigs(prev => prev.filter(c => c.id !== id));
  };

  // ==========================================
  // PERMANENT STUDENT FEE LEDGER GENERATOR & RECALCULATOR
  // ==========================================

  const generateStudentFeeLedger = (studentId: string): StudentFeeLedger => {
    const student = students.find(s => s.id === studentId);
    const stType: 'Day Scholar' | 'Hosteller' = (student?.studentType === 'Hosteller') ? 'Hosteller' : 'Day Scholar';
    const clsName = student?.className || 'Class 10';
    const secName = student?.section || 'A';
    const admNo = student?.admissionNo || 'ADM-2026-000';
    const stName = student ? `${student.firstName} ${student.lastName}` : 'Student';

    // Uniform Fee configuration lookup
    const uniformConfig = financeUniformConfigs.find(
      c => c.status === 'Active' &&
           c.academicYear === (financeSettings.academicYear || '2025-2026') &&
           c.className === clsName &&
           (c.gender === 'Unisex' || c.gender === (student?.gender || 'Male'))
    );
    const uniformAmount = uniformConfig ? uniformConfig.feeAmount : 3500;

    // 1. Base Fee Structure
    const assignment = studentFeeAssignments.find(a => a.studentId === studentId && a.status === 'Active');
    const baseFeeHeads = assignment ? assignment.assignedFeeHeads : [];

    let ledgerItems: LedgerFeeItem[] = [];

    if (baseFeeHeads.length > 0) {
      baseFeeHeads.forEach(h => {
        ledgerItems.push({
          headId: h.feeHeadId,
          headName: h.feeHeadName,
          category: h.category || 'Tuition Fee',
          originalAmount: h.amount,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: h.amount,
          isApplicable: true,
          status: 'Pending'
        });
      });
    } else {
      ledgerItems = [
        { headId: 'FH-01', headName: 'Tuition Fee', category: 'Tuition Fee', originalAmount: 25000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 25000, isApplicable: true, status: 'Pending' },
        { headId: 'FH-02', headName: 'Admission Fee', category: 'Admission Fee', originalAmount: 5000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 5000, isApplicable: true, status: 'Pending' },
        { headId: 'FH-03', headName: 'Books & Stationery Fee', category: 'Books Fee', originalAmount: 4500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 4500, isApplicable: true, status: 'Pending' },
        { headId: 'FH-04', headName: 'Uniform & Sports Kit Fee', category: 'Uniform Fee', originalAmount: uniformAmount, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: uniformAmount, isApplicable: true, status: 'Pending' },
        { headId: 'FH-05', headName: 'Science & Computer Lab Fee', category: 'Lab Fee', originalAmount: 2500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 2500, isApplicable: true, status: 'Pending' }
      ];
    }

    // Ensure Uniform Fee category amount matches config lookup
    ledgerItems = ledgerItems.map(item => {
      if (item.category === 'Uniform Fee') {
        return {
          ...item,
          originalAmount: uniformAmount,
          finalAmount: Math.max(0, uniformAmount - item.scholarshipDeduction - item.discountDeduction)
        };
      }
      return item;
    });

    // 2. Day Scholar vs Hosteller Fee Rules
    // Transport Fee: Applicable ONLY for Day Scholar
    const transportAssign = studentTransports.find(t => t.studentId === studentId && t.status === 'Active');
    if (stType === 'Day Scholar' && transportAssign) {
      const transportConfig = financeTransportConfigs.find(
        c => (c.routeId === transportAssign.routeId || c.routeName === transportAssign.routeName) &&
             (c.pickupPointId === (transportAssign as any).pickupPointId || c.pickupName === transportAssign.pickupPoint) &&
             c.status === 'Active'
      );
      const trpAmount = transportConfig ? transportConfig.feeAmount : (transportAssign.feeAmount || 5500);

      ledgerItems.push({
        headId: 'FH-TRP',
        headName: `Transport Fee (${transportAssign.routeName})`,
        category: 'Transport Fee',
        originalAmount: trpAmount,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: trpAmount,
        isApplicable: true,
        status: 'Pending'
      });
    } else {
      ledgerItems.push({
        headId: 'FH-TRP',
        headName: 'Transport Fee',
        category: 'Transport Fee',
        originalAmount: 0,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: 0,
        isApplicable: false,
        status: 'Pending',
        remarks: stType === 'Hosteller' ? 'Not Applicable for Hostellers' : 'Transport Not Opted'
      });
    }

    // Hostel Fee, Mess Fee & Security Deposit: Applicable ONLY for Hostellers
    const hostelAssign = studentHostelAssignments.find(h => h.studentId === studentId && h.status === 'Active') ||
                         studentHostels.find(h => h.studentId === studentId && h.status === 'Active');

    if (stType === 'Hosteller' && (hostelAssign || student?.hostelBed)) {
      const hId = (hostelAssign as any)?.hostelId || student?.hostelBlock;
      const hName = (hostelAssign as any)?.hostelName || student?.hostelBlock;

      const fhc = financeHostelConfigs.find(
        c => (c.hostelId === hId || c.hostelName === hName) && c.status === 'Active'
      ) || financeHostelConfigs[0];

      const hstFee = fhc ? fhc.hostelFee : 40000;
      const messFee = fhc ? (fhc.messFee || 0) : 18000;
      const secDep = fhc ? fhc.securityDeposit : 5000;

      ledgerItems.push({
        headId: 'FH-HST-RENT',
        headName: `Hostel Accommodation Fee (${hName || 'Hostel'})`,
        category: 'Hostel Fee',
        originalAmount: hstFee,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: hstFee,
        isApplicable: true,
        status: 'Pending'
      });

      if (messFee > 0) {
        ledgerItems.push({
          headId: 'FH-HST-MESS',
          headName: 'Hostel Mess Charges',
          category: 'Mess Fee',
          originalAmount: messFee,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: messFee,
          isApplicable: true,
          status: 'Pending'
        });
      }

      if (secDep > 0) {
        ledgerItems.push({
          headId: 'FH-HST-DEP',
          headName: 'Hostel Security Deposit (One-Time)',
          category: 'Security Deposit',
          originalAmount: secDep,
          scholarshipDeduction: 0,
          discountDeduction: 0,
          fineAmount: 0,
          finalAmount: secDep,
          isApplicable: true,
          status: 'Pending'
        });
      }
    } else {
      ledgerItems.push({
        headId: 'FH-HST',
        headName: 'Hostel Rent & Mess Charges',
        category: 'Hostel Fee',
        originalAmount: 0,
        scholarshipDeduction: 0,
        discountDeduction: 0,
        fineAmount: 0,
        finalAmount: 0,
        isApplicable: false,
        status: 'Pending',
        remarks: stType === 'Day Scholar' ? 'Not Applicable for Day Scholars' : 'Hostel Not Opted'
      });
    }

    // 3. Deductions: Scholarships & Discounts
    const appliedSchs = studentScholarships.filter(s => s.studentId === studentId && s.status === 'Active');
    let totalSchDeduction = 0;
    appliedSchs.forEach(sch => {
      totalSchDeduction += sch.discountType === 'Percentage' ? (25000 * sch.discountValue) / 100 : sch.discountValue;
    });

    const appliedDiscs = studentDiscounts.filter(d => d.studentId === studentId);
    let totalDiscDeduction = 0;
    appliedDiscs.forEach(sd => {
      const dObj = discounts.find(d => d.id === sd.discountId);
      if (dObj && dObj.status === 'Active') {
        totalDiscDeduction += dObj.mode === 'Percentage' ? (25000 * dObj.value) / 100 : dObj.value;
      }
    });

    const tuitionItem = ledgerItems.find(i => i.category === 'Tuition Fee') || ledgerItems[0];
    if (tuitionItem) {
      tuitionItem.scholarshipDeduction = totalSchDeduction;
      tuitionItem.discountDeduction = totalDiscDeduction;
      tuitionItem.finalAmount = Math.max(0, tuitionItem.originalAmount - totalSchDeduction - totalDiscDeduction);
    }

    const totalOriginal = ledgerItems.reduce((acc, i) => acc + (i.isApplicable ? i.originalAmount : 0), 0);
    const totalPayable = ledgerItems.reduce((acc, i) => acc + (i.isApplicable ? i.finalAmount : 0), 0);

    const existingPayments = feePayments.filter(p => p.studentId === studentId);
    const paidAmt = existingPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const dueBal = Math.max(0, totalPayable - paidAmt);

    const newLedger: StudentFeeLedger = {
      id: 'LED-' + Math.floor(100 + Math.random() * 900),
      studentId,
      studentName: stName,
      admissionNo: admNo,
      className: clsName,
      section: secName,
      studentType: stType,
      academicYear: financeSettings.academicYear || '2025-2026',
      feeItems: ledgerItems,
      totalOriginalAmount: totalOriginal,
      totalScholarship: totalSchDeduction,
      totalDiscount: totalDiscDeduction,
      totalFine: 0,
      totalPayable,
      paidAmount: paidAmt,
      dueBalance: dueBal,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      grossAmount: totalOriginal,
      scholarshipAmount: totalSchDeduction,
      discountAmount: totalDiscDeduction,
      fineAmount: 0,
      previousDue: student?.dueFee || 0
    };

    setStudentFeeLedgers(prev => [...prev.filter(l => l.studentId !== studentId), newLedger]);
    logActivity('Generated Fee Ledger', `Created Student Fee Ledger for ${stName}`);
    return newLedger;
  };

  const recalculateStudentFeeLedger = (studentId: string): StudentFeeLedger => {
    return generateStudentFeeLedger(studentId);
  };

  const getStudentFeeLedger = (studentId: string): StudentFeeLedger | null => {
    const existing = studentFeeLedgers.find(l => l.studentId === studentId);
    return existing || null;
  };

  // ==========================================
  // TRANSPORT ERP MODULE CRUD & CAPACITY ENGINE
  // ==========================================

  const addRouteMaster = async (r: Omit<RouteMaster, 'id'>) => {
    try {
      const payload = {
        routeCode: r.routeCode,
        routeName: r.routeName,
        startLocation: r.routeStart,
        endLocation: r.routeEnd,
        distanceKm: r.totalDistanceKm,
        estimatedDurationMinutes: r.estimatedTimeMinutes,
        description: r.description,
        status: r.status === 'Active'
      };
      const response = await TransportAPI.createRouteApi(payload as any);
      const backendData = response?.data || {};
      const id = (backendData.id || backendData.routeId || 'RM-' + Math.floor(100 + Math.random() * 900)).toString();
      const newRoute: RouteMaster = { ...r, ...backendData, id, branch: (r as any).branch || selectedBranch || 'Main Campus' } as any;
      setRouteMasters(prev => [...prev, newRoute]);
      logActivity('Created Transport Route', `Added ${newRoute.routeName} (${newRoute.routeCode})`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const id = 'RM-' + Math.floor(100 + Math.random() * 900);
      const newRoute: RouteMaster = { ...r, id, branch: (r as any).branch || selectedBranch || 'Main Campus' } as any;
      setRouteMasters(prev => [...prev, newRoute]);
      logActivity('Created Transport Route (Local)', `Added ${newRoute.routeName}`);
    }
  };

  const updateRouteMaster = async (id: string, updates: Partial<RouteMaster>) => {
    try {
      const payload: any = {};
      if (updates.routeCode !== undefined) payload.routeCode = updates.routeCode;
      if (updates.routeName !== undefined) payload.routeName = updates.routeName;
      if (updates.routeStart !== undefined) payload.startLocation = updates.routeStart;
      if (updates.routeEnd !== undefined) payload.endLocation = updates.routeEnd;
      if (updates.totalDistanceKm !== undefined) payload.distanceKm = updates.totalDistanceKm;
      if (updates.estimatedTimeMinutes !== undefined) payload.estimatedDurationMinutes = updates.estimatedTimeMinutes;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status !== undefined) payload.status = updates.status === 'Active';
      
      await TransportAPI.updateRouteApi(id, payload);
      setRouteMasters(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      logActivity('Updated Transport Route', `Updated Route ID ${id}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setRouteMasters(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }
  };

  const deleteRouteMaster = async (id: string) => {
    try {
      await TransportAPI.deleteRouteApi(id);
      setRouteMasters(prev => prev.filter(r => r.id !== id));
      logActivity('Deleted Transport Route', `Removed Route ID ${id}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setRouteMasters(prev => prev.filter(r => r.id !== id));
    }
  };

  const addPickupPoint = async (p: Omit<PickupPoint, 'id'>) => {
    try {
      const payload = { ...p, status: true };
      const response = await TransportAPI.createPickupPointApi(payload as any);
      const backendData = response?.data || {};
      const id = (backendData.id || backendData.pickupPointId || 'PP-' + Math.floor(100 + Math.random() * 900)).toString();
      const newPt: PickupPoint = { ...p, ...backendData, id, branch: (p as any).branch || selectedBranch || 'Main Campus' } as any;
      setPickupPoints(prev => [...prev, newPt]);
      logActivity('Created Pickup Point', `Added stop ${newPt.pickupName} for ${newPt.routeName}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const id = 'PP-' + Math.floor(100 + Math.random() * 900);
      const newPt: PickupPoint = { ...p, id, branch: (p as any).branch || selectedBranch || 'Main Campus' } as any;
      setPickupPoints(prev => [...prev, newPt]);
    }
  };

  const updatePickupPoint = async (id: string, updates: Partial<PickupPoint>) => {
    try {
      const payload = { ...updates, status: true };
      await TransportAPI.updatePickupPointApi(id, payload as any);
      setPickupPoints(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setPickupPoints(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const deletePickupPoint = async (id: string) => {
    try {
      await TransportAPI.deletePickupPointApi(id);
      setPickupPoints(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setPickupPoints(prev => prev.filter(p => p.id !== id));
    }
  };

  const addVehicleMaster = async (v: Omit<VehicleMaster, 'id'>) => {
    try {
      const payload = {
        vehicleNumber: v.vehicleNumber,
        registrationNumber: v.registrationNumber,
        vehicleName: v.vehicleNumber,
        vehicleType: v.vehicleType,
        capacity: v.capacity,
        insuranceExpiry: v.insuranceExpiry,
        pollutionExpiry: v.pollutionExpiry,
        fitnessExpiry: v.fitnessExpiry,
        status: v.status === 'Active'
      };
      const response = await TransportAPI.createVehicleApi(payload as any);
      const backendData = response?.data || {};
      const id = (backendData.id || backendData.vehicleId || 'VM-' + Math.floor(100 + Math.random() * 900)).toString();
      const newVehicle: VehicleMaster = { ...v, ...backendData, id, branch: (v as any).branch || selectedBranch || 'Main Campus' } as any;
      setVehicleMasters(prev => [...prev, newVehicle]);
      logActivity('Added Fleet Vehicle', `Registered ${newVehicle.vehicleType} ${newVehicle.vehicleNumber}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const id = 'VM-' + Math.floor(100 + Math.random() * 900);
      const newVehicle: VehicleMaster = { ...v, id, branch: (v as any).branch || selectedBranch || 'Main Campus' } as any;
      setVehicleMasters(prev => [...prev, newVehicle]);
    }
  };

  const updateVehicleMaster = async (id: string, updates: Partial<VehicleMaster>) => {
    try {
      const payload: any = {};
      if (updates.vehicleNumber !== undefined) {
        payload.vehicleNumber = updates.vehicleNumber;
        payload.vehicleName = updates.vehicleNumber;
      }
      if (updates.registrationNumber !== undefined) payload.registrationNumber = updates.registrationNumber;
      if (updates.vehicleType !== undefined) payload.vehicleType = updates.vehicleType;
      if (updates.capacity !== undefined) payload.capacity = updates.capacity;
      if (updates.insuranceExpiry !== undefined) payload.insuranceExpiry = updates.insuranceExpiry;
      if (updates.pollutionExpiry !== undefined) payload.pollutionExpiry = updates.pollutionExpiry;
      if (updates.fitnessExpiry !== undefined) payload.fitnessExpiry = updates.fitnessExpiry;
      if (updates.status !== undefined) payload.status = updates.status === 'Active';

      await TransportAPI.updateVehicleApi(id, payload);
      setVehicleMasters(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setVehicleMasters(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    }
  };

  const deleteVehicleMaster = async (id: string) => {
    try {
      await TransportAPI.deleteVehicleApi(id);
      setVehicleMasters(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setVehicleMasters(prev => prev.filter(v => v.id !== id));
    }
  };

  const addDriverMaster = async (d: Omit<DriverMaster, 'id'>) => {
    try {
      const payload = {
        driverName: d.driverName,
        mobileNumber: d.mobileNumber,
        email: d.email,
        licenceNumber: d.licenseNumber,
        licenceExpiry: d.licenseExpiryDate,
        address: d.address,
        emergencyContactNumber: d.emergencyContact,
        status: d.status === 'Active'
      };
      const response = await TransportAPI.createDriverApi(payload as any);
      const backendData = response?.data || {};
      const id = (backendData.id || backendData.driverId || 'DRV-' + Math.floor(100 + Math.random() * 900)).toString();
      const newDriver: DriverMaster = { ...d, ...backendData, id, branch: (d as any).branch || selectedBranch || 'Main Campus' } as any;
      setDriverMasters(prev => [...prev, newDriver]);
      logActivity('Added Transport Driver', `Registered driver ${newDriver.driverName}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const id = 'DRV-' + Math.floor(100 + Math.random() * 900);
      const newDriver: DriverMaster = { ...d, id, branch: (d as any).branch || selectedBranch || 'Main Campus' } as any;
      setDriverMasters(prev => [...prev, newDriver]);
    }
  };

  const updateDriverMaster = async (id: string, updates: Partial<DriverMaster>) => {
    try {
      const payload: any = {};
      if (updates.driverName !== undefined) payload.driverName = updates.driverName;
      if (updates.mobileNumber !== undefined) payload.mobileNumber = updates.mobileNumber;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.licenseNumber !== undefined) payload.licenceNumber = updates.licenseNumber;
      if (updates.licenseExpiryDate !== undefined) payload.licenceExpiry = updates.licenseExpiryDate;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.emergencyContact !== undefined) payload.emergencyContactNumber = updates.emergencyContact;
      if (updates.status !== undefined) payload.status = updates.status === 'Active';

      await TransportAPI.updateDriverApi(id, payload);
      setDriverMasters(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setDriverMasters(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  const deleteDriverMaster = async (id: string) => {
    try {
      await TransportAPI.deleteDriverApi(id);
      setDriverMasters(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setDriverMasters(prev => prev.filter(d => d.id !== id));
    }
  };

  const assignVehicleRouteDriver = async (va: Omit<VehicleAssignment, 'id'>) => {
    const effectiveBranch = va.branch || selectedBranch || 'Main Campus';
    const effectiveAcademicYear = va.academicYear || schoolProfile.academicYear || '2026-2027';
    const normalizedAssignment: Omit<VehicleAssignment, 'id'> = {
      ...va,
      branch: effectiveBranch,
      academicYear: effectiveAcademicYear,
      status: va.status
    };

    const deactivateConflicts = (items: VehicleAssignment[]): VehicleAssignment[] => items.map(existing => {
      if (normalizedAssignment.status !== 'Active') return existing;

      const isActiveConflict =
        existing.status === 'Active' &&
        (
          existing.vehicleId === normalizedAssignment.vehicleId ||
          existing.vehicleNumber === normalizedAssignment.vehicleNumber ||
          existing.routeId === normalizedAssignment.routeId ||
          existing.routeName === normalizedAssignment.routeName ||
          existing.driverId === normalizedAssignment.driverId ||
          existing.driverName === normalizedAssignment.driverName ||
          (normalizedAssignment.attendantId && existing.attendantId === normalizedAssignment.attendantId) ||
          (normalizedAssignment.attendantName && existing.attendantName === normalizedAssignment.attendantName)
        );

      if (!isActiveConflict) return existing;

      return {
        ...existing,
        status: 'Inactive' as const,
        effectiveTo: existing.effectiveTo || normalizedAssignment.effectiveFrom || new Date().toISOString().split('T')[0]
      } as VehicleAssignment;
    });

    try {
      const payload = {
        ...normalizedAssignment,
        status: true,
        assignmentDate: new Date().toISOString()
      };
      const response = await TransportAPI.createVehicleAssignmentApi(payload as any);
      const backendData = response?.data || {};
      const id = (backendData.id || backendData.assignmentId || 'VA-' + Math.floor(100 + Math.random() * 900)).toString();
      const newAssign: VehicleAssignment = {
        ...backendData,
        ...normalizedAssignment,
        id,
        branch: effectiveBranch,
        academicYear: effectiveAcademicYear,
        status: normalizedAssignment.status
      } as any;
      setVehicleAssignments(prev => [...deactivateConflicts(prev), newAssign]);
      logActivity('Vehicle Assigned', `Assigned ${normalizedAssignment.vehicleNumber} to ${normalizedAssignment.routeName} with ${normalizedAssignment.driverName}${normalizedAssignment.attendantName ? ` and ${normalizedAssignment.attendantName}` : ''}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const id = 'VA-' + Math.floor(100 + Math.random() * 900);
      const newAssign: VehicleAssignment = {
        ...normalizedAssignment,
        id,
        branch: effectiveBranch,
        academicYear: effectiveAcademicYear,
        status: normalizedAssignment.status
      } as any;
      setVehicleAssignments(prev => [...deactivateConflicts(prev), newAssign]);
    }
  };

  const updateVehicleAssignment = async (id: string, updates: Partial<VehicleAssignment>) => {
    try {
      const current = vehicleAssignments.find(a => a.id === id);
      const merged: VehicleAssignment = {
        ...(current as VehicleAssignment),
        ...(updates as VehicleAssignment),
        id,
        branch: updates.branch || current?.branch || selectedBranch || 'Main Campus',
        academicYear: updates.academicYear || current?.academicYear || schoolProfile.academicYear || '2026-2027',
        status: (updates.status || current?.status || 'Active') as 'Active' | 'Inactive'
      };
      const payload = { ...updates, status: true };
      await TransportAPI.updateVehicleAssignmentApi(id, payload as any);
      setVehicleAssignments(prev => {
        const deactivateConflicts = (items: VehicleAssignment[]): VehicleAssignment[] => items.map(existing => {
          const isActiveConflict =
            existing.id !== id &&
            existing.status === 'Active' &&
            merged.status === 'Active' &&
            (
              existing.vehicleId === merged.vehicleId ||
              existing.vehicleNumber === merged.vehicleNumber ||
              existing.routeId === merged.routeId ||
              existing.routeName === merged.routeName ||
              existing.driverId === merged.driverId ||
              existing.driverName === merged.driverName ||
              (merged.attendantId && existing.attendantId === merged.attendantId) ||
              (merged.attendantName && existing.attendantName === merged.attendantName)
            );

          if (!isActiveConflict) return existing;

          return {
            ...existing,
            status: 'Inactive' as const,
            effectiveTo: existing.effectiveTo || merged.effectiveFrom || new Date().toISOString().split('T')[0]
          } as VehicleAssignment;
        });

        const sanitized: VehicleAssignment = merged.status === 'Inactive' && !merged.effectiveTo
          ? { ...merged, effectiveTo: new Date().toISOString().split('T')[0] }
          : merged;

        return deactivateConflicts(prev).map(a => a.id === id ? sanitized : a);
      });
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const current = vehicleAssignments.find(a => a.id === id);
      const merged: VehicleAssignment = {
        ...(current as VehicleAssignment),
        ...(updates as VehicleAssignment),
        id,
        branch: updates.branch || current?.branch || selectedBranch || 'Main Campus',
        academicYear: updates.academicYear || current?.academicYear || schoolProfile.academicYear || '2026-2027',
        status: (updates.status || current?.status || 'Active') as 'Active' | 'Inactive'
      };
      setVehicleAssignments(prev => {
        const deactivateConflicts = (items: VehicleAssignment[]): VehicleAssignment[] => items.map(existing => {
          const isActiveConflict =
            existing.id !== id &&
            existing.status === 'Active' &&
            merged.status === 'Active' &&
            (
              existing.vehicleId === merged.vehicleId ||
              existing.vehicleNumber === merged.vehicleNumber ||
              existing.routeId === merged.routeId ||
              existing.routeName === merged.routeName ||
              existing.driverId === merged.driverId ||
              existing.driverName === merged.driverName ||
              (merged.attendantId && existing.attendantId === merged.attendantId) ||
              (merged.attendantName && existing.attendantName === merged.attendantName)
            );

          if (!isActiveConflict) return existing;

          return {
            ...existing,
            status: 'Inactive' as const,
            effectiveTo: existing.effectiveTo || merged.effectiveFrom || new Date().toISOString().split('T')[0]
          } as VehicleAssignment;
        });

        const sanitized: VehicleAssignment = merged.status === 'Inactive' && !merged.effectiveTo
          ? { ...merged, effectiveTo: new Date().toISOString().split('T')[0] }
          : merged;

        return deactivateConflicts(prev).map(a => a.id === id ? sanitized : a);
      });
    }
  };

  const removeVehicleAssignment = async (id: string) => {
    try {
      await TransportAPI.deleteVehicleAssignmentApi(id);
      setVehicleAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setVehicleAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  const addVehicleMaintenance = async (vm: Omit<VehicleMaintenance, 'id'>) => {
    try {
      const response = await TransportAPI.createMaintenanceApi(vm);
      const backendData = response?.data || {};
      const id = (backendData.id || backendData.maintenanceId || 'VMN-' + Math.floor(100 + Math.random() * 900)).toString();
      const newMaint: VehicleMaintenance = { ...vm, ...backendData, id, branch: (vm as any).branch || selectedBranch || 'Main Campus' } as any;
      setVehicleMaintenances(prev => [newMaint, ...prev]);
      logActivity('Logged Vehicle Maintenance', `Serviced vehicle ${newMaint.vehicleNumber}`);
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      const id = 'VMN-' + Math.floor(100 + Math.random() * 900);
      const newMaint: VehicleMaintenance = { ...vm, id, branch: (vm as any).branch || selectedBranch || 'Main Campus' } as any;
      setVehicleMaintenances(prev => [newMaint, ...prev]);
    }
  };

  const updateVehicleMaintenance = async (id: string, updates: Partial<VehicleMaintenance>) => {
    try {
      await TransportAPI.updateMaintenanceApi(id, updates);
      setVehicleMaintenances(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setVehicleMaintenances(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }
  };

  const deleteVehicleMaintenance = async (id: string) => {
    try {
      await TransportAPI.deleteMaintenanceApi(id);
      setVehicleMaintenances(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      addToast('error', 'API Sync Failed', 'Operating in local fallback mode');
      setVehicleMaintenances(prev => prev.filter(m => m.id !== id));
    }
  };

  const checkVehicleCapacity = (vehicleId: string): CapacityCheckResult => {
    const vehicle = vehicleMasters.find(v => v.id === vehicleId);
    const totalCapacity = vehicle ? vehicle.capacity : 40;

    const assignedCount = studentTransports.filter(st => st.vehicleId === vehicleId && st.status === 'Active').length;
    const availableSeats = Math.max(0, totalCapacity - assignedCount);

    return {
      vehicle,
      totalCapacity,
      assignedCount,
      availableSeats,
      isFull: availableSeats <= 0
    };
  };

  // DYNAMIC FEE CALCULATION ENGINE
  const calculateStudentPayableFee = (studentId: string): StudentCalculationResult | null => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const ledger = getStudentFeeLedger(studentId);

    const assignment = studentFeeAssignments.find(a => a.studentId === studentId && a.status === 'Active');
    const baseFee = ledger ? ledger.totalOriginalAmount : (assignment ? assignment.baseFeeTotal : student.totalFee || 35000);
    const assignedFeeHeads = assignment ? assignment.assignedFeeHeads : [];

    const transportAssign = studentTransports.find(t => t.studentId === studentId && t.status === 'Active');
    let transportFee = 0;
    if (student.studentType === 'Day Scholar' && transportAssign) {
      const transportConfig = financeTransportConfigs.find(
        c => (c.routeId === transportAssign.routeId || c.routeName === transportAssign.routeName) &&
             (c.pickupPointId === (transportAssign as any).pickupPointId || c.pickupName === transportAssign.pickupPoint) &&
             c.status === 'Active'
      );
      transportFee = transportConfig ? transportConfig.feeAmount : (transportAssign.feeAmount || 0);
    }

    const hostelAssign = studentHostels.find(h => h.studentId === studentId && h.status === 'Active');
    const hostelFee = (student.studentType === 'Hosteller' && hostelAssign) ? hostelAssign.feeAmount : 0;

    const previousDue = Math.max(0, student.dueFee || 0);

    const appliedScholarships = studentScholarships.filter(s => s.studentId === studentId && s.status === 'Active');
    let scholarshipDeduction = ledger ? ledger.totalScholarship : 0;

    const appliedDiscounts = studentDiscounts.filter(d => d.studentId === studentId);
    let discountDeduction = ledger ? ledger.totalDiscount : 0;

    let scholarshipId: string | undefined = undefined;
    let scholarshipName = '';
    let scholarshipDescription = '';
    
    let discountId: string | undefined = undefined;
    let discountName = '';
    let discountDescription = '';

    if (ledger) {
      scholarshipId = ledger.scholarshipId;
      scholarshipName = ledger.scholarshipName || '';
      scholarshipDescription = ledger.scholarshipDescription || '';
      discountId = ledger.discountId;
      discountName = ledger.discountName || '';
      discountDescription = ledger.discountDescription || '';
    } else {
      const studentScholarshipId = student.scholarshipId || appliedScholarships[0]?.scholarshipId;
      const sObj = studentScholarshipId ? scholarships.find(s => s.id === studentScholarshipId) : undefined;
      scholarshipId = studentScholarshipId;
      scholarshipName = sObj?.name || '';
      scholarshipDescription = sObj?.description || '';
      
      const studentDiscountId = student.discountId || appliedDiscounts[0]?.discountId;
      const dObj = studentDiscountId ? discounts.find(d => d.id === studentDiscountId) : undefined;
      discountId = studentDiscountId;
      discountName = dObj?.name || '';
      discountDescription = dObj?.description || '';
    }

    let fineAmount = 0;
    let fineDetails: { ruleName: string; daysOverdue: number; amount: number } | undefined;

    const activeFineRule = fineRules.find(f => f.status === 'Active') || fineRules[0];
    if (activeFineRule && activeFineRule.dueDate) {
      const dueTime = new Date(activeFineRule.dueDate).getTime();
      const nowTime = new Date().getTime();
      const daysDiff = Math.floor((nowTime - dueTime) / (1000 * 3600 * 24));
      if (daysDiff > activeFineRule.graceDays) {
        const overdueDays = daysDiff - activeFineRule.graceDays;
        if (activeFineRule.fineType === 'Daily Fine') {
          fineAmount = overdueDays * (activeFineRule.dailyFine || 50);
        } else {
          fineAmount = activeFineRule.fixedFine || 200;
        }
        if (activeFineRule.maximumFine && fineAmount > activeFineRule.maximumFine) {
          fineAmount = activeFineRule.maximumFine;
        }
        fineDetails = {
          ruleName: activeFineRule.ruleName,
          daysOverdue: overdueDays,
          amount: fineAmount
        };
      }
    }

    const totalPayable = ledger ? (ledger.totalPayable + fineAmount) : Math.max(0, baseFee + transportFee + hostelFee + previousDue + fineAmount - scholarshipDeduction - discountDeduction);
    const studentPaymentItems = feePayments.filter(p => p.studentId === studentId);
    const paidAmount = studentPaymentItems.reduce((acc, p) => acc + p.amountPaid, 0);
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
      discountDescription
    };
  };

  const applyScholarshipToStudent = (studentId: string, scholarshipId: string) => {
    const ledger = studentFeeLedgers.find(l => l.studentId === studentId);
    if (!ledger) {
      throw new Error('Fee Ledger not found for student.');
    }
    const sch = scholarships.find(s => s.id === scholarshipId);
    if (!sch) {
      throw new Error('Scholarship not found.');
    }
    
    const tuitionItem = ledger.feeItems.find(i => i.category === 'Tuition Fee') || ledger.feeItems[0];
    const tuitionAmount = tuitionItem ? tuitionItem.originalAmount : 25000;
    const waiver = sch.discountType === 'Percentage' ? (tuitionAmount * (sch.percentage || 0)) / 100 : (sch.fixedAmount || 0);

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      scholarshipId: sch.id,
      scholarshipName: sch.name,
      scholarshipDescription: sch.description,
      scholarshipAmount: waiver,
      totalScholarship: waiver,
      feeItems: ledger.feeItems.map(item => {
        if (item.category === 'Tuition Fee' || item.headId === (tuitionItem?.headId || '')) {
          const finalAmt = Math.max(0, item.originalAmount - waiver - item.discountDeduction);
          return {
            ...item,
            scholarshipDeduction: waiver,
            finalAmount: finalAmt
          };
        }
        return item;
      })
    };

    updatedLedger.totalPayable = Math.max(0, updatedLedger.grossAmount - updatedLedger.scholarshipAmount - updatedLedger.discountAmount + updatedLedger.fineAmount + updatedLedger.previousDue);
    updatedLedger.dueBalance = Math.max(0, updatedLedger.totalPayable - updatedLedger.paidAmount);

    setStudentFeeLedgers(prev => prev.map(l => l.studentId === studentId ? updatedLedger : l));
    assignScholarshipToStudent(studentId, scholarshipId);
    return updatedLedger;
  };

  const removeScholarshipFromStudent = (studentId: string) => {
    const ledger = studentFeeLedgers.find(l => l.studentId === studentId);
    if (!ledger) {
      throw new Error('Fee Ledger not found for student.');
    }

    const tuitionItem = ledger.feeItems.find(i => i.category === 'Tuition Fee') || ledger.feeItems[0];

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      scholarshipId: undefined,
      scholarshipName: '',
      scholarshipDescription: '',
      scholarshipAmount: 0,
      totalScholarship: 0,
      feeItems: ledger.feeItems.map(item => {
        if (item.category === 'Tuition Fee' || item.headId === (tuitionItem?.headId || '')) {
          const finalAmt = Math.max(0, item.originalAmount - item.discountDeduction);
          return {
            ...item,
            scholarshipDeduction: 0,
            finalAmount: finalAmt
          };
        }
        return item;
      })
    };

    updatedLedger.totalPayable = Math.max(0, updatedLedger.grossAmount - updatedLedger.scholarshipAmount - updatedLedger.discountAmount + updatedLedger.fineAmount + updatedLedger.previousDue);
    updatedLedger.dueBalance = Math.max(0, updatedLedger.totalPayable - updatedLedger.paidAmount);

    setStudentFeeLedgers(prev => prev.map(l => l.studentId === studentId ? updatedLedger : l));
    const currentSch = studentScholarships.find(s => s.studentId === studentId && s.scholarshipId === ledger.scholarshipId);
    if (currentSch) {
      revokeStudentScholarship(currentSch.id);
    }
    return updatedLedger;
  };

  const applyDiscountToStudent = (studentId: string, discountId: string) => {
    const ledger = studentFeeLedgers.find(l => l.studentId === studentId);
    if (!ledger) {
      throw new Error('Fee Ledger not found for student.');
    }
    const d = discounts.find(x => x.id === discountId);
    if (!d) {
      throw new Error('Discount not found.');
    }

    const tuitionItem = ledger.feeItems.find(i => i.category === 'Tuition Fee') || ledger.feeItems[0];
    const tuitionAmount = tuitionItem ? tuitionItem.originalAmount : 25000;
    const discountAmount = d.mode === 'Percentage' ? (tuitionAmount * d.value) / 100 : d.value;

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      discountId: d.id,
      discountName: d.name,
      discountDescription: d.description,
      discountAmount: discountAmount,
      totalDiscount: discountAmount,
      feeItems: ledger.feeItems.map(item => {
        if (item.category === 'Tuition Fee' || item.headId === (tuitionItem?.headId || '')) {
          const finalAmt = Math.max(0, item.originalAmount - ledger.scholarshipAmount - discountAmount);
          return {
            ...item,
            discountDeduction: discountAmount,
            finalAmount: finalAmt
          };
        }
        return item;
      })
    };

    updatedLedger.totalPayable = Math.max(0, updatedLedger.grossAmount - updatedLedger.scholarshipAmount - updatedLedger.discountAmount + updatedLedger.fineAmount + updatedLedger.previousDue);
    updatedLedger.dueBalance = Math.max(0, updatedLedger.totalPayable - updatedLedger.paidAmount);

    setStudentFeeLedgers(prev => prev.map(l => l.studentId === studentId ? updatedLedger : l));
    assignDiscountToStudent(studentId, discountId);
    return updatedLedger;
  };

  const removeDiscountFromStudent = (studentId: string) => {
    const ledger = studentFeeLedgers.find(l => l.studentId === studentId);
    if (!ledger) {
      throw new Error('Fee Ledger not found for student.');
    }

    const tuitionItem = ledger.feeItems.find(i => i.category === 'Tuition Fee') || ledger.feeItems[0];

    const updatedLedger: StudentFeeLedger = {
      ...ledger,
      discountId: undefined,
      discountName: '',
      discountDescription: '',
      discountAmount: 0,
      totalDiscount: 0,
      feeItems: ledger.feeItems.map(item => {
        if (item.category === 'Tuition Fee' || item.headId === (tuitionItem?.headId || '')) {
          const finalAmt = Math.max(0, item.originalAmount - item.scholarshipDeduction);
          return {
            ...item,
            discountDeduction: 0,
            finalAmount: finalAmt
          };
        }
        return item;
      })
    };

    updatedLedger.totalPayable = Math.max(0, updatedLedger.grossAmount - updatedLedger.scholarshipAmount - updatedLedger.discountAmount + updatedLedger.fineAmount + updatedLedger.previousDue);
    updatedLedger.dueBalance = Math.max(0, updatedLedger.totalPayable - updatedLedger.paidAmount);

    setStudentFeeLedgers(prev => prev.map(l => l.studentId === studentId ? updatedLedger : l));
    const currentDisc = studentDiscounts.find(d => d.studentId === studentId && d.discountId === ledger.discountId);
    if (currentDisc) {
      removeStudentDiscount(currentDisc.id);
    }
    return updatedLedger;
  };

  const fetchDailyAttendance = async (date: string, department?: string) => {
    try {
      const deptParam = department && department !== 'All' ? `&department=${encodeURIComponent(department)}` : '';
      const response = await apiClient(`/api/staff/attendance?date=${date}${deptParam}`, { method: 'GET' });
      if (response && response.success && response.data) {
        const mappedRecords: DailyAttendance[] = response.data.map((item: any) => ({
          id: item.staffAttendanceId.toString(),
          date: item.date,
          entityType: 'Staff',
          entityId: item.staffId.toString(),
          status: item.status,
          remarks: item.remarks || '',
          inTime: item.inTime || '',
          outTime: item.outTime || '',
          department: item.department || '',
          designation: item.designation || ''
        }));

        setAttendance(prev => {
          const filterDates = mappedRecords.map(r => `${r.entityId}_${r.date}`);
          const filtered = prev.filter(r => !filterDates.includes(`${r.entityId}_${r.date}`));
          return [...filtered, ...mappedRecords];
        });
      }
    } catch (err: any) {
      console.error('Error fetching staff attendance:', err);
    }
  };

  const fetchMonthlyAttendance = async (month: number, year: number, department?: string) => {
    try {
      const deptParam = department && department !== 'All' ? `&department=${encodeURIComponent(department)}` : '';
      const response = await apiClient(`/api/staff/attendance/monthly?month=${month}&year=${year}${deptParam}`, { method: 'GET' });
      if (response && response.success && response.data) {
        const mappedRecords: DailyAttendance[] = response.data.map((item: any) => ({
          id: item.staffAttendanceId.toString(),
          date: item.date,
          entityType: 'Staff',
          entityId: item.staffId.toString(),
          status: item.status,
          remarks: item.remarks || '',
          inTime: item.inTime || '',
          outTime: item.outTime || '',
          department: item.department || '',
          designation: item.designation || ''
        }));

        setAttendance(prev => {
          const filterDates = mappedRecords.map(r => `${r.entityId}_${r.date}`);
          const filtered = prev.filter(r => !filterDates.includes(`${r.entityId}_${r.date}`));
          return [...filtered, ...mappedRecords];
        });
      }
    } catch (err: any) {
      console.error('Error fetching monthly staff attendance:', err);
    }
  };

  const markAttendance = async (records: DailyAttendance[]) => {
    setAttendance(prev => {
      const filterDates = records.map(r => `${r.entityId}_${r.date}`);
      const updated = prev.filter(r => !filterDates.includes(`${r.entityId}_${r.date}`));
      return [...records, ...updated];
    });
    logActivity('Marked Attendance', `Recorded attendance for ${records.length} items`);

    try {
      const date = records[0]?.date;
      if (!date) return;

      const payload = {
        date: date,
        academicYear: selectedAcademicYear || '2026-2027',
        branch: selectedBranch || 'Main Campus',
        department: records[0]?.department || '',
        records: records.map(r => ({
          staffId: parseInt(r.entityId),
          status: r.status,
          remarks: r.remarks || '',
          inTime: r.inTime || '',
          outTime: r.outTime || ''
        }))
      };

      await apiClient('/api/staff/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      console.error('Error saving staff attendance to server:', err);
      addToast('error', 'API Error', 'Failed to save staff attendance to database.');
    }
  };

  const addExam = (examData: Omit<ExamSetup, 'id'>) => {
    const id = 'EXM-' + Math.floor(10 + Math.random() * 90);
    const newExam: ExamSetup = { ...examData, id, branch: (examData as any).branch || selectedBranch || 'Main Campus' } as any;
    setExams(prev => [...prev, newExam]);
    logActivity('Created Examination', `Scheduled ${newExam.name}`);
  };

  const updateExam = (id: string, updates: Partial<ExamSetup>) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    logActivity('Updated Examination', `Updated exam ID ${id}`);
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    logActivity('Deleted Examination', `Removed exam ID ${id}`);
  };

  const saveMarks = (marksData: Omit<ExamMark, 'id'>[]) => {
    const blockedLockedMarks = marksData.filter(m => {
      const existing = examMarks.find(em => em.examId === m.examId && em.studentId === m.studentId && em.subject === m.subject);
      return existing?.isLocked && m.isLocked !== false;
    });
    if (blockedLockedMarks.length > 0) {
      addToast('error', 'Marks Locked', 'Submitted marks are locked. Unlock them before saving changes.');
      return;
    }

    const newMarks: ExamMark[] = marksData.map(m => {
      const exam = exams.find(e => e.id === m.examId);
      const student = students.find(s => s.id === m.studentId);
      return {
        ...m,
        academicYear: m.academicYear || exam?.academicYear || schoolProfile.academicYear,
        branch: m.branch || exam?.branch || student?.branch || selectedBranch || 'Main Campus',
        className: m.className || student?.className,
        section: m.section || student?.section,
        id: 'MRK-' + Math.floor(1000 + Math.random() * 9000)
      };
    });

    setExamMarks(prev => {
      const existingKeys = newMarks.map(nm => `${nm.examId}_${nm.studentId}_${nm.subject}`);
      const filtered = prev.filter(em => !existingKeys.includes(`${em.examId}_${em.studentId}_${em.subject}`));
      return [...filtered, ...newMarks];
    });
    logActivity('Saved Exam Marks', `Entered marks for ${newMarks.length} records`);
  };

  const addExamSchedule = (scheduleData: Omit<ExamSchedule, 'id'>) => {
    const id = 'SCH-' + Math.floor(100 + Math.random() * 900);
    const exam = exams.find(e => e.id === scheduleData.examId);
    setExamSchedules(prev => [...prev, {
      ...scheduleData,
      id,
      academicYear: scheduleData.academicYear || exam?.academicYear || schoolProfile.academicYear,
      branch: scheduleData.branch || exam?.branch || selectedBranch || 'Main Campus'
    }]);
    logActivity('Scheduled Subject Exam', `Scheduled ${scheduleData.subject} for Class ${scheduleData.className}`);
  };

  const updateExamSchedule = (id: string, updates: Partial<ExamSchedule>) => {
    setExamSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Updated Exam Schedule', `Updated schedule ID ${id}`);
  };

  const deleteExamSchedule = (id: string) => {
    setExamSchedules(prev => prev.filter(s => s.id !== id));
    logActivity('Deleted Exam Schedule', `Removed schedule ID ${id}`);
  };

  const addQuestionPaper = (paperData: Omit<QuestionPaper, 'id'>): QuestionPaper => {
    const id = 'QP-' + Math.floor(1000 + Math.random() * 9000);
    const newPaper: QuestionPaper = {
      ...paperData,
      id,
      academicYear: paperData.academicYear || schoolProfile.academicYear,
      branch: paperData.branch || selectedBranch || 'Main Campus'
    };
    setQuestionPapers(prev => [newPaper, ...prev]);
    logActivity('Uploaded Question Paper', `Uploaded ${newPaper.paperTitle} for ${newPaper.className} ${newPaper.subject}`);
    return newPaper;
  };

  const updateQuestionPaper = (id: string, updates: Partial<QuestionPaper>) => {
    setQuestionPapers(prev => prev.map(qp => qp.id === id ? { ...qp, ...updates } : qp));
    logActivity('Updated Question Paper', `Updated question paper ID ${id}`);
  };

  const deleteQuestionPaper = (id: string) => {
    setQuestionPapers(prev => prev.filter(qp => qp.id !== id));
    logActivity('Deleted Question Paper', `Removed question paper ID ${id}`);
  };

  const addMeeting = (meetingData: Omit<SchoolMeeting, 'id' | 'createdAt'>): SchoolMeeting => {
    const id = 'MTG-' + Math.floor(100 + Math.random() * 900);
    const newMeeting: SchoolMeeting = {
      ...meetingData,
      id,
      academicYear: meetingData.academicYear || schoolProfile.academicYear,
      branch: meetingData.branch || selectedBranch || 'Main Campus',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setMeetings(prev => [newMeeting, ...prev]);

    if (newMeeting.status === 'Scheduled') {
      const targets = newMeeting.participants.map(p => p.name).join(', ');
      logActivity('Scheduled Meeting', `Scheduled ${newMeeting.meetingAudience} meeting '${newMeeting.title}' for ${targets}`);
    } else {
      logActivity('Created Meeting Draft', `Saved draft meeting '${newMeeting.title}'`);
    }

    return newMeeting;
  };

  const updateMeeting = (id: string, updates: Partial<SchoolMeeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    logActivity('Updated Meeting', `Updated details for meeting ID ${id}`);
  };

  const cancelMeeting = (id: string, reason: string) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'Cancelled', cancellationReason: reason } : m));
    logActivity('Cancelled Meeting', `Cancelled meeting ID ${id}. Reason: ${reason}`);
  };

  const deleteMeeting = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    logActivity('Deleted Meeting', `Removed meeting record ID ${id}`);
  };

  const addDepartment = (deptData: Omit<Department, 'id'>): Department => {
    const id = 'DEPT-' + Math.floor(100 + Math.random() * 900);
    const newDept: Department = {
      ...deptData,
      id
    };
    setDepartments(prev => [newDept, ...prev]);
    logActivity('Created Department', `Added department ${newDept.departmentName}`);
    return newDept;
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    const oldDept = departments.find(d => d.id === id);
    const oldName = oldDept?.departmentName;

    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

    if (updates.departmentName && oldName && updates.departmentName !== oldName) {
      setSubjects(prev => prev.map(sub => {
        if (sub.department === oldName || sub.departmentId === id) {
          return { ...sub, department: updates.departmentName };
        }
        return sub;
      }));
    }

    logActivity('Updated Department', `Updated details for department ${updates.departmentName || id}`);
  };

  const deleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    logActivity('Deleted Department', `Removed department ID ${id}`);
  };

  const addDesignation = (designationData: Omit<DesignationMaster, 'id'>): DesignationMaster => {
    const id = 'DESIG-' + Math.floor(100 + Math.random() * 900);
    const newDesignation: DesignationMaster = {
      ...designationData,
      id,
    };
    setDesignations(prev => [newDesignation, ...prev]);
    logActivity('Created Designation', `Added designation ${newDesignation.designationName}`);
    return newDesignation;
  };

  const updateDesignation = (id: string, updates: Partial<DesignationMaster>) => {
    setDesignations(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    logActivity('Updated Designation', `Updated details for designation ID ${id}`);
  };

  const deleteDesignation = (id: string) => {
    setDesignations(prev => prev.filter(d => d.id !== id));
    logActivity('Deleted Designation', `Removed designation ID ${id}`);
  };

  const saveGradeConfiguration = (grades: GradeConfig[]) => {
    setGradeConfigurations(grades);
    logActivity('Saved Grade Configurations', `Updated grade range settings`);
  };

  const saveProcessedResults = (results: ProcessedResult[]) => {
    const blockedLockedResults = results.filter(r => {
      const existing = processedResults.find(p => p.examId === r.examId && p.studentId === r.studentId);
      return existing?.status === 'Locked';
    });
    if (blockedLockedResults.length > 0) {
      addToast('error', 'Results Locked', 'Unlock results before recalculating this class.');
      return;
    }

    setProcessedResults(prev => {
      const newKeys = results.map(r => `${r.examId}_${r.studentId}`);
      const filtered = prev.filter(p => !newKeys.includes(`${p.examId}_${p.studentId}`));
      return [...filtered, ...results];
    });
    logActivity('Processed Exam Results', `Calculated grades & percentages for ${results.length} students`);
  };

  const updateResultStatus = (examId: string, className: string, section: string, status: ProcessedResult['status']) => {
    const stamp = new Date().toISOString().split('T')[0];
    setProcessedResults(prev => prev.map(r => {
      if (r.examId === examId && r.className === className && r.section === section) {
        return {
          ...r,
          status,
          processedAt: stamp,
          publishedAt: status === 'Published' ? stamp : r.publishedAt,
          lockedAt: status === 'Locked' ? stamp : r.lockedAt
        };
      }
      return r;
    }));
    if (status === 'Published' || status === 'Locked') {
      setExamMarks(prev => prev.map(m => {
        const student = students.find(s => s.id === m.studentId);
        return m.examId === examId && student?.className === className && student?.section === section
          ? { ...m, isLocked: true }
          : m;
      }));
    }
    if (status === 'Draft') {
      setExamMarks(prev => prev.map(m => {
        const student = students.find(s => s.id === m.studentId);
        return m.examId === examId && student?.className === className && student?.section === section
          ? { ...m, isLocked: false }
          : m;
      }));
    }
    setExams(prev => prev.map(e => e.id === examId ? {
      ...e,
      status: status === 'Published' || status === 'Locked' ? 'Results Published' : status === 'Processed' ? 'Completed' : e.status
    } : e));
    logActivity('Updated Results Status', `Set results for ${examId} (${className}-${section}) to ${status}`);
  };

  const applyGraceOrRevaluation = (markId: string, newMarks: number, type: 'Grace' | 'Revaluation', reason: string, updatedBy: string) => {
    setExamMarks(prev => prev.map(m => {
      if (m.id === markId) {
        const oldMarks = m.marksObtained;
        const history = m.revaluationHistory || [];
        const newLog = {
          date: new Date().toISOString().split('T')[0],
          oldMarks,
          newMarks,
          reason,
          updatedBy,
          type
        };
        
        let grade = 'F';
        const pct = (newMarks / m.totalMarks) * 100;
        const matchedConfig = gradeConfigurations.find(c => pct >= c.minPercent && pct <= c.maxPercent);
        if (matchedConfig) grade = matchedConfig.gradeName;

        return {
          ...m,
          marksObtained: newMarks,
          graceMarks: type === 'Grace' ? (newMarks - oldMarks) : m.graceMarks,
          isRevalued: type === 'Revaluation' ? true : m.isRevalued,
          grade,
          revaluationHistory: [...history, newLog]
        };
      }
      return m;
    }));
    logActivity(`Applied ${type}`, `Updated mark ID ${markId} to score ${newMarks}`);
  };

  const addTimetableSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const id = 'TT-' + Math.floor(100 + Math.random() * 900);
    const newSlot: TimetableSlot = { ...slotData, id, branch: (slotData as any).branch || selectedBranch || 'Main Campus' } as any;
    setTimetable(prev => [...prev, newSlot]);
  };

  const updateTimetableSlot = (id: string, updates: Partial<TimetableSlot>) => {
    setTimetable(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable(prev => prev.filter(t => t.id !== id));
  };

  const addHomework = (hwData: Omit<Homework, 'id'>) => {
    const id = 'HW-' + Math.floor(100 + Math.random() * 900);
    const newHw: Homework = { ...hwData, id, branch: (hwData as any).branch || selectedBranch || 'Main Campus' } as any;
    setHomework(prev => [newHw, ...prev]);
    logActivity('Posted Homework', `Assigned ${newHw.title} for ${newHw.className}`);
  };

  const updateHomework = (id: string, updates: Partial<Homework>) => {
    setHomework(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHomework = (id: string) => {
    setHomework(prev => prev.filter(h => h.id !== id));
  };

  const addBook = (bookData: Omit<BookItem, 'id'>) => {
    const id = 'BK-' + Math.floor(10 + Math.random() * 90);
    const newBook: BookItem = { ...bookData, id };
    setBooks(prev => [...prev, newBook]);
    logActivity('Cataloged Book', `Added ${newBook.title} to Library`);
  };

  const issueBook = (issueData: Omit<BookIssue, 'id'>) => {
    const id = 'ISS-' + Math.floor(100 + Math.random() * 900);
    const newIssue: BookIssue = { ...issueData, id };
    setBookIssues(prev => [newIssue, ...prev]);

    setBooks(prev => prev.map(b => {
      if (b.id === issueData.bookId) {
        const available = Math.max(0, b.availableCopies - 1);
        const status = available === 0 ? 'Issued' : 'Available';
        return { ...b, availableCopies: available, status: status as any };
      }
      return b;
    }));

    logActivity('Issued Library Book', `Issued book ID ${issueData.bookId} to ${issueData.borrowerName}`);
  };

  const returnBook = (issueId: string) => {
    const issue = bookIssues.find(i => i.id === issueId);
    if (!issue) return;

    setBookIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'Returned' } : i));

    setBooks(prev => prev.map(b => {
      if (b.id === issue.bookId) {
        const available = b.availableCopies + 1;
        return { ...b, availableCopies: available, status: 'Available' };
      }
      return b;
    }));

    logActivity('Returned Library Book', `Book issue ID ${issueId} marked returned`);
  };

  const addTransportRoute = (routeData: Omit<TransportRoute, 'id'>) => {
    const id = 'TR-' + Math.floor(10 + Math.random() * 90);
    const newRoute: TransportRoute = { ...routeData, id };
    setTransportRoutes(prev => [...prev, newRoute]);
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const id = 'INV-' + Math.floor(10 + Math.random() * 90);
    const newItem: InventoryItem = { ...itemData, id };
    setInventory(prev => [...prev, newItem]);
  };

  const addAnnouncement = (annData: Omit<Announcement, 'id'>) => {
    const id = 'ANC-' + Math.floor(10 + Math.random() * 90);
    const newAnn: Announcement = { ...annData, id };
    setAnnouncements(prev => [newAnn, ...prev]);
    logActivity('Published Announcement', `Posted: ${newAnn.title}`);
  };

  // Uniform category CRUD
  const addUniformCategory = (cData: Omit<UniformCategory, 'id'>) => {
    const id = 'UC-' + Math.floor(10 + Math.random() * 90);
    setUniformCategories(prev => [...prev, { ...cData, id, branch: (cData as any).branch || selectedBranch || 'Main Campus' } as any]);
  };
  const updateUniformCategory = (id: string, updates: Partial<UniformCategory>) => {
    setUniformCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteUniformCategory = (id: string) => {
    setUniformCategories(prev => prev.filter(c => c.id !== id));
  };

  // Uniform sizes CRUD
  const addUniformSize = (sData: Omit<UniformSize, 'id'>) => {
    const id = 'US-' + Math.floor(10 + Math.random() * 90);
    setUniformSizes(prev => [...prev, { ...sData, id, branch: (sData as any).branch || selectedBranch || 'Main Campus' } as any]);
  };
  const updateUniformSize = (id: string, updates: Partial<UniformSize>) => {
    setUniformSizes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const deleteUniformSize = (id: string) => {
    setUniformSizes(prev => prev.filter(s => s.id !== id));
  };

  // Uniform suppliers CRUD
  const addUniformSupplier = (sData: Omit<UniformSupplier, 'id'>) => {
    const id = 'SUP-' + Math.floor(10 + Math.random() * 90);
    setUniformSuppliers(prev => [...prev, { ...sData, id, branch: (sData as any).branch || selectedBranch || 'Main Campus' } as any]);
  };
  const updateUniformSupplier = (id: string, updates: Partial<UniformSupplier>) => {
    setUniformSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const deleteUniformSupplier = (id: string) => {
    setUniformSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Uniform inventory CRUD
  const addUniformInventory = (iData: Omit<UniformInventoryItem, 'id'>) => {
    const id = 'UINV-' + Math.floor(10 + Math.random() * 90);
    setUniformInventory(prev => [...prev, { ...iData, id, branch: (iData as any).branch || selectedBranch || 'Main Campus' } as any]);
  };
  const updateUniformInventory = (id: string, updates: Partial<UniformInventoryItem>) => {
    setUniformInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };
  const deleteUniformInventory = (id: string) => {
    setUniformInventory(prev => prev.filter(i => i.id !== id));
  };

  // Student Uniform issues CRUD
  const addStudentUniformIssue = (issueData: Omit<StudentUniformIssue, 'id'>) => {
    const id = 'UIS-' + Math.floor(10 + Math.random() * 90);
    setStudentUniformIssues(prev => [...prev, { ...issueData, id, branch: issueData.branch || selectedBranch || 'Main Campus' }]);

    // Reduce stock if issued
    if (issueData.status === 'Issued' || issueData.status === 'Replaced') {
      setUniformInventory(prev => prev.map(item => {
        if (item.itemId === issueData.itemId || item.itemName === issueData.itemName) {
          const newStock = Math.max(0, item.currentStock - issueData.quantity);
          const newStatus = newStock === 0 ? 'Out of Stock' : (newStock <= item.minimumStock ? 'Low Stock' : 'In Stock');
          return { ...item, currentStock: newStock, status: newStatus };
        }
        return item;
      }));
    }
  };
  const updateStudentUniformIssue = (id: string, updates: Partial<StudentUniformIssue>) => {
    setStudentUniformIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        if (updates.status === 'Returned' && issue.status !== 'Returned') {
          setUniformInventory(prevInv => prevInv.map(item => {
            if (item.itemId === issue.itemId || item.itemName === issue.itemName) {
              const newStock = item.currentStock + issue.quantity;
              const newStatus = newStock === 0 ? 'Out of Stock' : (newStock <= item.minimumStock ? 'Low Stock' : 'In Stock');
              return { ...item, currentStock: newStock, status: newStatus };
            }
            return item;
          }));
        }
        return { ...issue, ...updates };
      }
      return issue;
    }));
  };
  const deleteStudentUniformIssue = (id: string) => {
    setStudentUniformIssues(prev => prev.filter(issue => issue.id !== id));
  };

  // Finance Uniform configurations CRUD
  const addFinanceUniformConfig = (cData: Omit<FinanceUniformConfig, 'id'>) => {
    const id = 'FUC-' + Math.floor(10 + Math.random() * 90);
    setFinanceUniformConfigs(prev => [...prev, { ...cData, id, branch: cData.branch || selectedBranch || 'Main Campus' }]);
  };
  const updateFinanceUniformConfig = (id: string, updates: Partial<FinanceUniformConfig>) => {
    setFinanceUniformConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteFinanceUniformConfig = (id: string) => {
    setFinanceUniformConfigs(prev => prev.filter(c => c.id !== id));
  };

  // Leave Management Fetchers
  const fetchLeaveTypes = async () => {
    try {
      const response = await apiClient('/api/hr/leave-types', { method: 'GET' });
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
          status: item.status
        }));
        setLeaveTypes(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch leave types from API', err);
    }
  };

  const fetchLeaveApplications = async () => {
    try {
      const response = await apiClient('/api/hr/leave-applications', { method: 'GET' });
      if (response && response.success && response.data) {
        const mapped: LeaveApplication[] = response.data.map((item: any) => ({
          id: item.leaveApplicationId.toString(),
          employeeId: item.staffId.toString(),
          employeeName: item.staffName,
          empId: item.employeeId,
          department: item.department || 'Administration',
          designation: item.designation || 'Staff',
          branch: item.branch || 'Main Campus',
          employeeCategory: item.employeeCategory === 'Teacher' ? 'Teacher' : 'Staff',
          leaveTypeId: item.leaveTypeId ? item.leaveTypeId.toString() : '1',
          leaveTypeName: item.leaveTypeName,
          fromDate: item.fromDate,
          toDate: item.toDate,
          isHalfDay: item.isHalfDay,
          numberOfDays: item.requestedDays,
          reason: item.reason,
          attachments: [],
          status: item.status,
          appliedDate: item.appliedDate,
          approverRemarks: item.approverRemarks || '',
          approvedBy: item.approvedBy || ''
        }));
        setLeaveApplications(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch leave applications from API', err);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await apiClient('/api/hr/leave-balances', { method: 'GET' });
      if (response && response.success && response.data) {
        setStaff(prevStaff => prevStaff.map(s => {
          const bal = response.data.find((item: any) => item.staffId.toString() === s.id);
          if (bal) {
            return {
              ...s,
              leaveBalance: {
                casual: bal.casualLeaveBalance,
                sick: bal.sickLeaveBalance,
                paid: bal.earnedLeaveBalance
              }
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch leave balances from API', err);
    }
  };

  const fetchSalaryStructures = async () => {
    try {
      const response = await apiClient('/api/payroll/salary-structures', { method: 'GET' });
      if (response && response.success && response.data) {
        setSalaryStructures(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch salary structures from API', err);
    }
  };

  const fetchSalaryAssignments = async () => {
    try {
      const response = await apiClient('/api/payroll/salary-assignments', { method: 'GET' });
      if (response && response.success && response.data) {
        setEmployeeSalaryAssignments(response.data);
      }
    } catch (err) {
      console.warn('Failed to fetch salary assignments from API', err);
    }
  };

  // Leave Types CRUD
  const addLeaveType = async (tData: Omit<LeaveType, 'id'>) => {
    try {
      const response = await apiClient('/api/hr/leave-types', {
        method: 'POST',
        body: JSON.stringify(tData)
      });
      if (response && response.success) {
        addToast('success', 'Leave Type Created', 'Leave type configuration saved successfully.');
        await fetchLeaveTypes();
      }
    } catch (err: any) {
      console.error('Error adding leave type:', err);
      addToast('error', 'API Error', 'Failed to configure leave type.');
    }
  };
  const updateLeaveType = (id: string, updates: Partial<LeaveType>) => {
    setLeaveTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteLeaveType = (id: string) => {
    setLeaveTypes(prev => prev.filter(t => t.id !== id));
  };

  // Leave Applications CRUD
  const addLeaveApplication = async (appData: Omit<LeaveApplication, 'id'>) => {
    try {
      const payload = {
        staffId: parseInt(appData.employeeId),
        leaveTypeId: parseInt(appData.leaveTypeId),
        fromDate: appData.fromDate,
        toDate: appData.toDate,
        isHalfDay: appData.isHalfDay,
        reason: appData.reason
      };

      const response = await apiClient('/api/hr/leave-applications', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (response && response.success) {
        addToast('success', 'Leave Application Submitted', 'Your leave request has been submitted.');
        await fetchLeaveApplications();
        await fetchLeaveBalances();
      }
    } catch (err: any) {
      console.error('Error submitting leave application:', err);
      addToast('error', 'API Error', 'Failed to submit leave application.');
    }
  };
  const updateLeaveApplication = (id: string, updates: Partial<LeaveApplication>) => {
    setLeaveApplications(prev => prev.map(app => app.id === id ? { ...app, ...updates } : app));
  };
  const deleteLeaveApplication = (id: string) => {
    setLeaveApplications(prev => prev.filter(app => app.id !== id));
  };

  // Holiday CRUD
  const addHoliday = (hData: Omit<Holiday, 'id'>) => {
    const id = 'HOL-' + Math.floor(100 + Math.random() * 900);
    setHolidays(prev => [...prev, { ...hData, id, branch: hData.branch || selectedBranch || 'Main Campus' }]);
  };
  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };
  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  // School Events CRUD
  const addSchoolEvent = (eventData: Omit<SchoolEvent, 'id'>): SchoolEvent => {
    const id = 'EVT-' + Math.floor(100 + Math.random() * 900);
    const newEvent: SchoolEvent = {
      ...eventData,
      id,
      branch: eventData.branch || selectedBranch || 'Main Campus',
      status: eventData.status || 'Published',
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setSchoolEvents(prev => [newEvent, ...prev]);
    logActivity('Created School Event', `Scheduled event ${newEvent.title} on ${newEvent.startDate}`);
    return newEvent;
  };

  const updateSchoolEvent = (id: string, updates: Partial<SchoolEvent>) => {
    setSchoolEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : e));
    logActivity('Updated School Event', `Updated event ID ${id}`);
  };

  const deleteSchoolEvent = (id: string) => {
    setSchoolEvents(prev => prev.filter(e => e.id !== id));
    logActivity('Deleted School Event', `Removed event ID ${id}`);
  };

  // TRAINING & ASSESSMENTS HANDLERS
  const addWorkshop = (wData: Omit<WorkshopTraining, 'id'>): WorkshopTraining => {
    const id = 'WKS-' + Math.floor(100 + Math.random() * 900);
    const newWorkshop: WorkshopTraining = {
      ...wData,
      id,
      branch: wData.branch || selectedBranch || 'Main Campus',
      status: wData.status || 'Scheduled',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setWorkshops(prev => [newWorkshop, ...prev]);

    // Automatically Sync to Academic Calendar
    addSchoolEvent({
      title: `[Workshop] ${newWorkshop.workshopName}`,
      category: 'Workshop & Seminar',
      description: `${newWorkshop.category} - ${newWorkshop.description}`,
      organizer: `${newWorkshop.trainerName} (${newWorkshop.organization})`,
      venue: newWorkshop.venue,
      startDate: newWorkshop.startDate,
      endDate: newWorkshop.endDate,
      startTime: newWorkshop.startTime,
      endTime: newWorkshop.endTime,
      branch: newWorkshop.branch,
      academicYear: '2025-2026',
      participants: `${newWorkshop.participants.length} Employees Assigned`,
      status: 'Published'
    });

    logActivity('Created Workshop', `Created workshop ${newWorkshop.workshopName}`);
    return newWorkshop;
  };

  const updateWorkshop = (id: string, updates: Partial<WorkshopTraining>) => {
    setWorkshops(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    logActivity('Updated Workshop', `Updated workshop ID ${id}`);
  };

  const deleteWorkshop = (id: string) => {
    setWorkshops(prev => prev.filter(w => w.id !== id));
    logActivity('Deleted Workshop', `Removed workshop ID ${id}`);
  };

  const markWorkshopAttendance = (
    workshopId: string,
    attendanceList: { employeeId: string; status: 'Present' | 'Absent' | 'Excused' }[]
  ) => {
    setWorkshops(prev => prev.map(w => {
      if (w.id !== workshopId) return w;
      const updatedParticipants = w.participants.map(p => {
        const match = attendanceList.find(a => a.employeeId === p.employeeId);
        return match ? { ...p, attendanceStatus: match.status } : p;
      });
      const presentCount = updatedParticipants.filter(p => p.attendanceStatus === 'Present').length;
      const total = updatedParticipants.length;
      const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
      return { ...w, participants: updatedParticipants, attendancePct: pct, status: 'Completed' };
    }));
  };

  const submitWorkshopFeedback = (
    workshopId: string,
    employeeId: string,
    feedback: TrainingParticipant['feedback']
  ) => {
    setWorkshops(prev => prev.map(w => {
      if (w.id !== workshopId) return w;
      return {
        ...w,
        participants: w.participants.map(p => p.employeeId === employeeId ? { ...p, feedback } : p)
      };
    }));
  };

  const addAssessment = (aData: Omit<EmployeeAssessment, 'id'>): EmployeeAssessment => {
    const id = 'ASM-' + Math.floor(100 + Math.random() * 900);
    const newAssessment: EmployeeAssessment = {
      ...aData,
      id,
      branch: aData.branch || selectedBranch || 'Main Campus',
      status: aData.status || 'Scheduled',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setEmployeeAssessments(prev => [newAssessment, ...prev]);

    // Automatically Sync to Academic Calendar
    addSchoolEvent({
      title: `[Assessment] ${newAssessment.assessmentName}`,
      category: 'Custom Event',
      description: `${newAssessment.assessmentType} for ${newAssessment.department || 'All Departments'}`,
      organizer: newAssessment.evaluatorName,
      venue: 'Online / Assessment Center',
      startDate: newAssessment.date,
      endDate: newAssessment.date,
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      branch: newAssessment.branch,
      academicYear: '2025-2026',
      participants: `${newAssessment.results.length} Candidates Scheduled`,
      status: 'Published'
    });

    logActivity('Created Assessment', `Scheduled ${newAssessment.assessmentName}`);
    return newAssessment;
  };

  const updateAssessment = (id: string, updates: Partial<EmployeeAssessment>) => {
    setEmployeeAssessments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    logActivity('Updated Assessment', `Updated assessment ID ${id}`);
  };

  const deleteAssessment = (id: string) => {
    setEmployeeAssessments(prev => prev.filter(a => a.id !== id));
    logActivity('Deleted Assessment', `Removed assessment ID ${id}`);
  };

  const saveAssessmentResults = (assessmentId: string, results: AssessmentResult[]) => {
    setEmployeeAssessments(prev => prev.map(a => {
      if (a.id !== assessmentId) return a;
      return { ...a, results, status: 'Evaluated' };
    }));

    // Auto issue certificates for passing candidates
    const targetAssessment = employeeAssessments.find(a => a.id === assessmentId);
    if (targetAssessment) {
      results.forEach(res => {
        if (res.result === 'Pass') {
          issueCertificate({
            programType: 'Assessment',
            programName: targetAssessment.assessmentName,
            employeeId: res.employeeId,
            employeeName: res.employeeName,
            department: res.department,
            designation: res.designation,
            branch: res.branch || selectedBranch || 'Main Campus',
            completionDate: new Date().toISOString().split('T')[0],
            issuedBy: targetAssessment.evaluatorName || 'Academic Competency Board',
            status: 'Issued'
          });
        }
      });
    }
  };

  const issueCertificate = (certData: Omit<IssuedCertificate, 'id' | 'certificateNumber'>): IssuedCertificate => {
    const id = 'CRT-' + Math.floor(100 + Math.random() * 900);
    const certificateNumber = 'CERT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newCert: IssuedCertificate = {
      ...certData,
      id,
      certificateNumber,
      status: certData.status || 'Issued'
    };
    setIssuedCertificates(prev => [newCert, ...prev]);
    return newCert;
  };

  const reissueCertificate = (id: string) => {
    setIssuedCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'Reissued', completionDate: new Date().toISOString().split('T')[0] } : c));
  };

  // Payslip handler
  const disburseSalary = (pData: Omit<Payslip, 'id'>) => {
    const id = 'PAY-' + Math.floor(100 + Math.random() * 900);
    setPayslips(prev => [...prev, { ...pData, id, branch: (pData as any).branch || selectedBranch || 'Main Campus' } as any]);
  };

  const addPayrollConfiguration = (configData: Omit<PayrollConfiguration, 'id'>) => {
    const id = 'PAYCFG-' + Math.floor(100 + Math.random() * 900);
    setPayrollConfigurations(prev => [
      ...prev.map(c => c.branch === configData.branch && configData.status === 'Active' ? { ...c, status: 'Inactive' as const } : c),
      { ...configData, id, branch: configData.branch || selectedBranch || 'Main Campus' }
    ]);
  };
  const updatePayrollConfiguration = (id: string, updates: Partial<PayrollConfiguration>) => {
    setPayrollConfigurations(prev => {
      const targetBranch = updates.branch || prev.find(c => c.id === id)?.branch;
      return prev.map(c => {
        if (updates.status === 'Active' && c.id !== id && c.branch === targetBranch) {
          return { ...c, status: 'Inactive' };
        }
        return c.id === id ? { ...c, ...updates } : c;
      });
    });
  };
  const deletePayrollConfiguration = (id: string) => {
    setPayrollConfigurations(prev => prev.filter(c => c.id !== id));
  };
  const activatePayrollConfiguration = (id: string) => {
    const target = payrollConfigurations.find(c => c.id === id);
    if (!target) return;
    setPayrollConfigurations(prev => prev.map(c => c.branch === target.branch ? { ...c, status: c.id === id ? 'Active' : 'Inactive' } : c));
  };
  const deactivatePayrollConfiguration = (id: string) => {
    setPayrollConfigurations(prev => prev.map(c => c.id === id ? { ...c, status: 'Inactive' } : c));
  };

  const addPayrollComponent = (componentData: Omit<PayrollComponent, 'id'>) => {
    const id = 'PC-' + Math.floor(1000 + Math.random() * 9000);
    setPayrollComponents(prev => [...prev, { ...componentData, id, branch: componentData.branch || selectedBranch || 'Main Campus' }]);
  };
  const updatePayrollComponent = (id: string, updates: Partial<PayrollComponent>) => {
    setPayrollComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deletePayrollComponent = (id: string) => {
    setPayrollComponents(prev => prev.filter(c => c.id !== id));
  };

  const roundAmount = (amount: number, rule?: SalaryStructure['roundOffRule']) => {
    if (!rule || rule === 'No Round Off') return amount;
    if (rule === 'Nearest 1') return Math.round(amount);
    if (rule === 'Nearest 10') return Math.round(amount / 10) * 10;
    if (rule === 'Nearest 50') return Math.round(amount / 50) * 50;
    return amount;
  };

  const getStructureBreakdown = (structure?: SalaryStructure) => {
    const basicLine = structure?.earnings.find(line => /basic/i.test(line.name)) || structure?.earnings[0];
    const basicSalary = basicLine?.amount || 0;
    const allowances = Math.max(0, (structure?.earnings || []).reduce((sum, line) => sum + line.amount, 0) - basicSalary);
    const deductions = (structure?.deductions || []).reduce(
      (sum, line) => sum + (/employer\s*pf/i.test(line.name) ? 0 : line.amount),
      0
    );
    const grossSalary = structure?.grossSalary || basicSalary + allowances;
    const netSalary = roundAmount(Math.max(0, grossSalary - deductions), structure?.roundOffRule);
    return { basicSalary, allowances, deductions, grossSalary, netSalary };
  };

  const addSalaryStructure = async (structureData: Omit<SalaryStructure, 'id'>) => {
    try {
      const response = await apiClient('/api/payroll/salary-structures', {
        method: 'POST',
        body: JSON.stringify({
          ...structureData,
          branch: structureData.branch || selectedBranch || 'Main Campus'
        })
      });
      if (response && response.success) {
        addToast('success', 'Salary Structure Created', 'Salary structure configuration saved successfully.');
        await fetchSalaryStructures();
      }
    } catch (err: any) {
      console.error('Error adding salary structure:', err);
      addToast('error', 'API Error', 'Failed to save salary structure.');
    }
  };

  const updateSalaryStructure = async (id: string, updates: Partial<SalaryStructure>) => {
    try {
      const response = await apiClient(`/api/payroll/salary-structures/${parseInt(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (response && response.success) {
        addToast('success', 'Salary Structure Updated', 'Salary structure updated successfully.');
        await fetchSalaryStructures();
        await fetchSalaryAssignments();
        await fetchStaff();
      }
    } catch (err: any) {
      console.error('Error updating salary structure:', err);
      addToast('error', 'API Error', 'Failed to update salary structure.');
    }
  };

  const deleteSalaryStructure = async (id: string) => {
    try {
      const response = await apiClient(`/api/payroll/salary-structures/${parseInt(id)}`, {
        method: 'DELETE'
      });
      if (response && response.success) {
        addToast('success', 'Salary Structure Deleted', 'Salary structure removed successfully.');
        await fetchSalaryStructures();
        await fetchSalaryAssignments();
        await fetchStaff();
      }
    } catch (err: any) {
      console.error('Error deleting salary structure:', err);
      addToast('error', 'API Error', 'Failed to delete salary structure.');
    }
  };

  const cloneSalaryStructure = async (id: string) => {
    try {
      const response = await apiClient(`/api/payroll/salary-structures/${parseInt(id)}/clone`, {
        method: 'POST'
      });
      if (response && response.success) {
        addToast('success', 'Salary Structure Cloned', 'Structure cloned successfully.');
        await fetchSalaryStructures();
      }
    } catch (err: any) {
      console.error('Error cloning salary structure:', err);
      addToast('error', 'API Error', 'Failed to clone salary structure.');
    }
  };

  const loadSalaryStructures = (structures: SalaryStructure[]) => {
    setSalaryStructures(structures);
  };

  const assignEmployeeSalaryStructure = async (assignmentData: Omit<EmployeeSalaryAssignment, 'id'>) => {
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
        overrideNetSalary: assignmentData.overrideNetSalary
      };

      const response = await apiClient('/api/payroll/salary-assignments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response && response.success) {
        addToast('success', 'Salary Structure Assigned', 'Employee salary assignment saved successfully.');
        await fetchSalaryAssignments();
        await fetchStaff();
      }
    } catch (err: any) {
      console.error('Error assigning salary structure:', err);
      addToast('error', 'API Error', 'Failed to assign salary structure.');
    }
  };

  const updateEmployeeSalaryAssignment = (id: string, updates: Partial<EmployeeSalaryAssignment>) => {
    setEmployeeSalaryAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteEmployeeSalaryAssignment = (id: string) => {
    const assignment = employeeSalaryAssignments.find(a => a.id === id);
    setEmployeeSalaryAssignments(prev => prev.filter(a => a.id !== id));
    if (assignment?.status === 'Active') {
      setStaff(prev => prev.map(s => s.id === assignment.employeeId ? {
        ...s,
        salaryStructureId: undefined,
        salaryStructureName: undefined,
        salaryStructureEffectiveDate: undefined,
        salary: 0,
        grossSalary: undefined,
        netSalary: undefined
      } : s));
    }
  };

  const upsertPayrollRun = (runData: Omit<PayrollRun, 'id'>): PayrollRun => {
    let savedRun: PayrollRun = { ...runData, id: 'PRUN-' + Math.floor(1000 + Math.random() * 9000) };
    setPayrollRuns(prev => {
      const existing = prev.find(r => r.employeeId === runData.employeeId && r.payrollMonth === runData.payrollMonth);
      if (existing) {
        savedRun = { ...existing, ...runData };
        return prev.map(r => r.id === existing.id ? savedRun : r);
      }
      return [...prev, savedRun];
    });
    return savedRun;
  };
  const updatePayrollRun = (id: string, updates: Partial<PayrollRun>) => {
    setPayrollRuns(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  const deletePayrollRun = (id: string) => {
    setPayrollRuns(prev => prev.filter(r => r.id !== id));
  };

  // Leave Application Status Engine
  const updateLeaveApplicationStatus = async (
    id: string,
    status: LeaveApplication['status'],
    remarks?: string,
    approvedBy?: string
  ) => {
    try {
      const payload = {
        status: status
      };

      const response = await apiClient(`/api/hr/leave-applications/${parseInt(id)}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (response && response.success) {
        addToast('success', 'Status Updated', `Leave application status updated to ${status}.`);
        await fetchLeaveApplications();
        await fetchLeaveBalances();
      }
    } catch (err: any) {
      console.error('Error updating leave application status:', err);
      addToast('error', 'API Error', 'Failed to update leave application status.');
    }
  };

  const filterByBranch = <T,>(items: T[]): T[] => {
    if (!items) return [];
    return items.filter(item => {
      const anyItem = item as any;
      
      // Check branch
      let branchMatch = true;
      if (selectedBranch && anyItem.branch !== 'All Branches') {
        if (anyItem.applicableBranches) {
          branchMatch = anyItem.applicableBranches.includes(selectedBranch);
        } else if (anyItem.branch) {
          branchMatch = anyItem.branch === selectedBranch;
        }
      }

      // Check academic year
      let ayMatch = true;
      if (selectedAcademicYear && anyItem.academicYear && anyItem.academicYear !== 'All') {
        ayMatch = anyItem.academicYear === selectedAcademicYear;
      }

      return branchMatch && ayMatch;
    });
  };

  const filteredStudents = filterByBranch(students);
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
  const filteredVehicleAssignments = filterByBranch(vehicleAssignments);
  const filteredVehicleMaintenances = filterByBranch(vehicleMaintenances);
  const filteredUniformCategories = filterByBranch(uniformCategories);
  const filteredUniformSizes = filterByBranch(uniformSizes);
  const filteredUniformSuppliers = filterByBranch(uniformSuppliers);
  const filteredUniformInventory = filterByBranch(uniformInventory);
  const filteredStudentUniformIssues = filterByBranch(studentUniformIssues);
  const filteredFinanceUniformConfigs = filterByBranch(financeUniformConfigs);
  const filteredLeaveApplications = filterByBranch(leaveApplications);
  const filteredHolidays = filterByBranch(holidays);
  const filteredPayslips = filterByBranch(payslips);
  const filteredPayrollConfigurations = filterByBranch(payrollConfigurations);
  const filteredPayrollComponents = filterByBranch(payrollComponents);
  const filteredSalaryStructures = filterByBranch(salaryStructures);
  const filteredEmployeeSalaryAssignments = filterByBranch(employeeSalaryAssignments);
  const filteredPayrollRuns = filterByBranch(payrollRuns);

  const filteredAttendance = attendance.filter(a => {
    if (!selectedBranch) return true;
    if (a.entityType === 'Student') {
      const stud = students.find(s => s.id === a.entityId);
      return stud ? stud.branch === selectedBranch : true;
    } else {
      const st = staff.find(s => s.id === a.entityId);
      return st ? st.branch === selectedBranch : true;
    }
  });

  const filteredBookIssues = bookIssues.filter(bi => {
    if (!selectedBranch) return true;
    if (bi.borrowerRole === 'Student') {
      const stud = students.find(s => s.id === bi.borrowerId);
      return stud ? stud.branch === selectedBranch : true;
    } else {
      const st = staff.find(s => s.id === bi.borrowerId);
      return st ? st.branch === selectedBranch : true;
    }
  });

  return (
    <DataContext.Provider
      value={{
        schoolProfile, updateSchoolProfile,
        academicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear, setCurrentAcademicYear,
        students: filteredStudents, addStudent, updateStudent, deleteStudent, promoteStudent, transferStudent,
        staff: filteredStaff, addStaff, updateStaff, deleteStaff, addStaffDocument, deleteStaffDocument, updateBankDetails,
        admissions: filteredAdmissions, addAdmission, updateAdmission, deleteAdmission, updateAdmissionStatus,
        academicClasses: filteredClasses, addAcademicClass, updateAcademicClass, deleteAcademicClass,
        subjects: filteredSubjects, addSubject, updateSubject, deleteSubject,
        buses, addBus, updateBus, deleteBus,
        hostelBlocks, addHostelBlock, updateHostelBlock, deleteHostelBlock,
        hostelBeds, addHostelBed, updateHostelBed, deleteHostelBed,
        uniforms, addUniform, updateUniform, deleteUniform,
        customRoles, addCustomRole, updateCustomRole, deleteCustomRole,
        feeStructures: filteredFeeStructures, addFeeStructure, updateFeeStructure, deleteFeeStructure,
        feePayments: filteredFeePayments, addFeePayment,
        feeHeads: filteredFeeHeads, addFeeHead, updateFeeHead, deleteFeeHead, toggleFeeHeadStatus,
        dynamicFeeStructures: filteredDynamicFeeStructures, addDynamicFeeStructure, updateDynamicFeeStructure, deleteDynamicFeeStructure,
        studentFeeAssignments: filteredStudentFeeAssignments, assignFeeStructure, bulkAssignFeeStructure, updateStudentFeeAssignment, removeStudentFeeAssignment,
        scholarships, addScholarship, updateScholarship, deleteScholarship,
        studentScholarships, assignScholarshipToStudent, revokeStudentScholarship,
        discounts, addDiscount, updateDiscount, deleteDiscount,
        studentDiscounts, assignDiscountToStudent, removeStudentDiscount,
        fineRules, addFineRule, updateFineRule, deleteFineRule,
        erpTransportRoutes: filteredERPTransportRoutes, addERPTransportRoute, updateERPTransportRoute, deleteERPTransportRoute,
        studentTransports: filteredStudentTransports, assignStudentTransport, removeStudentTransport,
        hostelMasters: filteredHostelMasters, addHostelMaster, updateHostelMaster, deleteHostelMaster,
        roomTypeMasters, addRoomTypeMaster, updateRoomTypeMaster, deleteRoomTypeMaster,
        roomMasters, addRoomMaster, updateRoomMaster, deleteRoomMaster,
        studentHostelAssignments, assignStudentHostelRoom, updateStudentHostelAssignment, deleteStudentHostelAssignment,
        hostelVisitorLogs, addHostelVisitorLog, updateHostelVisitorLogStatus,
        hostelAttendanceLogs, recordHostelAttendance,
        financeHostelConfigs, addFinanceHostelConfig, updateFinanceHostelConfig, deleteFinanceHostelConfig,
        studentHostels: filteredStudentHostels, assignStudentHostel, removeStudentHostel,
        refunds: filteredRefunds, addRefund, updateRefundStatus,
        financeSettings, updateFinanceSettings,
        financeTransportConfigs, addFinanceTransportConfig, updateFinanceTransportConfig, deleteFinanceTransportConfig,
        studentFeeLedgers, generateStudentFeeLedger, recalculateStudentFeeLedger, getStudentFeeLedger,
        calculateStudentPayableFee,
        applyScholarshipToStudent, removeScholarshipFromStudent,
        applyDiscountToStudent, removeDiscountFromStudent,
        routeMasters: filteredRouteMasters, addRouteMaster, updateRouteMaster, deleteRouteMaster,
        pickupPoints: filteredPickupPoints, addPickupPoint, updatePickupPoint, deletePickupPoint,
        vehicleMasters: filteredVehicleMasters, addVehicleMaster, updateVehicleMaster, deleteVehicleMaster,
        driverMasters: filteredDriverMasters, addDriverMaster, updateDriverMaster, deleteDriverMaster,
        vehicleAssignments: filteredVehicleAssignments, assignVehicleRouteDriver, updateVehicleAssignment, removeVehicleAssignment,
        vehicleMaintenances: filteredVehicleMaintenances, addVehicleMaintenance, updateVehicleMaintenance, deleteVehicleMaintenance,
        checkVehicleCapacity,
        attendance: filteredAttendance, markAttendance, fetchDailyAttendance, fetchMonthlyAttendance,
        exams: filteredExams, examMarks, addExam, updateExam, deleteExam, saveMarks,
        examSchedules, addExamSchedule, updateExamSchedule, deleteExamSchedule,
        questionPapers, addQuestionPaper, updateQuestionPaper, deleteQuestionPaper,
        meetings, addMeeting, updateMeeting, cancelMeeting, deleteMeeting,
        departments, addDepartment, updateDepartment, deleteDepartment,
        designations, addDesignation, updateDesignation, deleteDesignation,
        gradeConfigurations, saveGradeConfiguration,
        processedResults, saveProcessedResults, updateResultStatus, applyGraceOrRevaluation,
        timetable: filteredTimetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, publishClassTimetable,
        periodSettings, addPeriodSetting, updatePeriodSetting, deletePeriodSetting,
        teacherAssignments, addTeacherAssignment, updateTeacherAssignment, deleteTeacherAssignment,
        homework: filteredHomework, addHomework, updateHomework, deleteHomework,
        books, bookIssues: filteredBookIssues, addBook, issueBook, returnBook,
        transportRoutes, addTransportRoute,
        hostelRooms, inventory, addInventoryItem,
        announcements, addAnnouncement,
        holidays: filteredHolidays, birthdays, auditLogs, logActivity,

        // UNIFORM ERP MAPPINGS
        uniformCategories: filteredUniformCategories, addUniformCategory, updateUniformCategory, deleteUniformCategory,
        uniformSizes: filteredUniformSizes, addUniformSize, updateUniformSize, deleteUniformSize,
        uniformSuppliers: filteredUniformSuppliers, addUniformSupplier, updateUniformSupplier, deleteUniformSupplier,
        uniformInventory: filteredUniformInventory, addUniformInventory, updateUniformInventory, deleteUniformInventory,
        studentUniformIssues: filteredStudentUniformIssues, addStudentUniformIssue, updateStudentUniformIssue, deleteStudentUniformIssue,
        financeUniformConfigs: filteredFinanceUniformConfigs, addFinanceUniformConfig, updateFinanceUniformConfig, deleteFinanceUniformConfig,

        // LEAVE MANAGEMENT ERP MAPPINGS
        leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType,
        leaveApplications: filteredLeaveApplications, addLeaveApplication, updateLeaveApplication, deleteLeaveApplication, updateLeaveApplicationStatus,
        addHoliday, updateHoliday, deleteHoliday,
        payslips: filteredPayslips, disburseSalary,
        payrollConfigurations: filteredPayrollConfigurations,
        addPayrollConfiguration, updatePayrollConfiguration, deletePayrollConfiguration, activatePayrollConfiguration, deactivatePayrollConfiguration,
        payrollComponents: filteredPayrollComponents,
        addPayrollComponent, updatePayrollComponent, deletePayrollComponent,
        salaryStructures: filteredSalaryStructures,
        addSalaryStructure, updateSalaryStructure, deleteSalaryStructure, cloneSalaryStructure, loadSalaryStructures,
        employeeSalaryAssignments: filteredEmployeeSalaryAssignments,
        assignEmployeeSalaryStructure, updateEmployeeSalaryAssignment, deleteEmployeeSalaryAssignment,
        payrollRuns: filteredPayrollRuns,
        upsertPayrollRun, updatePayrollRun, deletePayrollRun,
        documentRequirementRules, getRequiredDocuments, addDocumentRequirementRule, updateDocumentRequirementRule, deleteDocumentRequirementRule, verifyStaffDocument, replaceStaffDocument,

        // MASTER FINANCE LEDGER MAPPINGS
        financeTransactions, addFinanceTransaction, reverseFinanceTransaction, cancelFinanceTransaction,
        financialAccounts, addFinancialAccount, updateFinancialAccount,
        financialCategories, addFinancialCategory, updateFinancialCategory,
        financialBudgets, updateFinancialBudget,

        // ACADEMIC CALENDAR & SCHOOL EVENTS MAPPINGS
        schoolEvents, addSchoolEvent, updateSchoolEvent, deleteSchoolEvent,

        // TRAINING & ASSESSMENTS MAPPINGS
        workshops, addWorkshop, updateWorkshop, deleteWorkshop, markWorkshopAttendance, submitWorkshopFeedback,
        employeeAssessments, addAssessment, updateAssessment, deleteAssessment, saveAssessmentResults,
        issuedCertificates, issueCertificate, reissueCertificate
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
