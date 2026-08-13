import {
  Student, Staff, AdmissionApplication, FeeStructure, FeePayment,
  ExamSetup, ExamMark, TimetableSlot, Homework,
  BookItem, BookIssue, TransportRoute, HostelBlock, HostelRoom, HostelBed,
  Bus, UniformItem, CustomRole, InventoryItem, Announcement, Holiday,
  Birthday, AuditLog, SchoolProfile, AcademicYearMaster, SubjectItem,
  FeeHead, DynamicFeeStructure, StudentFeeAssignment, Scholarship,
  StudentScholarship, Discount, StudentDiscount, FineRule,
  TransportRoute as ERPTransportRoute, StudentTransport, HostelMaster,
  StudentHostel, Refund, FinanceSettings,
  RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, VehicleMaintenance,
  FinanceTransportConfig, StudentFeeLedger,
  RoomTypeMaster, RoomMaster, StudentHostelAssignment, HostelAttendanceLog, FinanceHostelConfig,
  UniformCategory, UniformSize, UniformSupplier, UniformInventoryItem, StudentUniformIssue, FinanceUniformConfig,
  LeaveType, LeaveApplication, Payslip, PayrollConfiguration, PayrollComponent,
  SalaryStructure, EmployeeSalaryAssignment, PayrollRun, QuestionPaper, SchoolMeeting, Department,
  CertificateTemplateConfig
} from '../types';

// ─── School Profile (empty default — loaded from backend/settings) ────────────
export const initialSchoolProfile: SchoolProfile = {
  name: '',
  tagline: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  principalName: '',
  academicYear: '',
  logoUrl: '',
};

// ─── Finance Settings (minimal default) ──────────────────────────────────────
export const initialFinanceSettings: FinanceSettings = {
  academicYear: '',
  defaultCurrency: 'INR',
  receiptFormat: 'Standard',
  lateFeeRuleId: '',
  receiptPrefix: 'REC-',
  invoicePrefix: 'INV-',
  paymentModes: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'],
  financialYear: '',
  autoReceiptNo: true,
  taxSettings: {
    enabled: false,
    taxName: 'GST',
    percentage: 0,
  },
};

// ─── All list data — empty (populated via backend APIs after login) ───────────

export const initialAcademicYears: AcademicYearMaster[] = [];
export const initialStudents: Student[] = [];
export const initialStaff: Staff[] = [];
export const initialAdmissions: AdmissionApplication[] = [];
export const initialBuses: Bus[] = [];
export const initialFeeStructures: FeeStructure[] = [];
export const initialFeePayments: FeePayment[] = [];
export const initialExamSetups: ExamSetup[] = [];
export const initialExamMarks: ExamMark[] = [];
export const initialTimetable: TimetableSlot[] = [];
export const initialHomework: Homework[] = [];
export const initialHostelBlocks: HostelBlock[] = [];
export const initialHostelRooms: HostelRoom[] = [];
export const initialHostelBeds: HostelBed[] = [];
export const initialUniforms: UniformItem[] = [];
export const initialBooks: BookItem[] = [];
export const initialBookIssues: BookIssue[] = [];
export const initialTransportRoutes: TransportRoute[] = [];
export const initialInventory: InventoryItem[] = [];
export const initialAnnouncements: Announcement[] = [];
export const initialHolidays: Holiday[] = [];
export const initialBirthdays: Birthday[] = [];
export const initialAuditLogs: AuditLog[] = [];
export const initialCustomRoles: CustomRole[] = [];
export const initialDesignations: any[] = [];
export const initialDepartments: Department[] = [];
export const initialSubjects: SubjectItem[] = [];
export const initialFeeHeads: FeeHead[] = [];
export const initialDynamicFeeStructures: DynamicFeeStructure[] = [];
export const initialStudentFeeAssignments: StudentFeeAssignment[] = [];
export const initialScholarships: Scholarship[] = [];
export const initialStudentScholarships: StudentScholarship[] = [];
export const initialDiscounts: Discount[] = [];
export const initialStudentDiscounts: StudentDiscount[] = [];
export const initialFineRules: FineRule[] = [];
export const initialERPTransportRoutes: ERPTransportRoute[] = [];
export const initialStudentTransports: StudentTransport[] = [];
export const initialStudentHostels: StudentHostel[] = [];
export const initialRefunds: Refund[] = [];
export const initialRouteMasters: RouteMaster[] = [];
export const initialPickupPoints: PickupPoint[] = [];
export const initialVehicleMasters: VehicleMaster[] = [];
export const initialDriverMasters: DriverMaster[] = [];
export const initialVehicleAssignments: VehicleAssignment[] = [];
export const initialVehicleMaintenances: VehicleMaintenance[] = [];
export const initialFinanceTransportConfigs: FinanceTransportConfig[] = [];
export const initialStudentFeeLedgers: StudentFeeLedger[] = [];
export const initialHostelMasters: HostelMaster[] = [];
export const initialRoomTypeMasters: RoomTypeMaster[] = [];
export const initialRoomMasters: RoomMaster[] = [];
export const initialStudentHostelAssignments: StudentHostelAssignment[] = [];
export const initialHostelVisitorLogs: any[] = [];
export const initialHostelAttendanceLogs: HostelAttendanceLog[] = [];
export const initialFinanceHostelConfigs: FinanceHostelConfig[] = [];
export const initialUniformCategories: UniformCategory[] = [];
export const initialUniformSizes: UniformSize[] = [];
export const initialUniformSuppliers: UniformSupplier[] = [];
export const initialUniformInventory: UniformInventoryItem[] = [];
export const initialStudentUniformIssues: StudentUniformIssue[] = [];
export const initialFinanceUniformConfigs: FinanceUniformConfig[] = [];
export const initialLeaveTypes: LeaveType[] = [];
export const initialLeaveApplications: LeaveApplication[] = [];
export const initialPayslips: Payslip[] = [];
export const initialPayrollConfigurations: PayrollConfiguration[] = [];
export const initialPayrollComponents: PayrollComponent[] = [];
export const initialSalaryStructures: SalaryStructure[] = [];
export const initialEmployeeSalaryAssignments: EmployeeSalaryAssignment[] = [];
export const initialPayrollRuns: PayrollRun[] = [];
export const initialQuestionPapers: QuestionPaper[] = [];
export const initialMeetings: SchoolMeeting[] = [];
export const initialCertificateTemplates: CertificateTemplateConfig[] = [];
