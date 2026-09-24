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
  FinanceTransportConfig, StudentFeeLedger, LedgerFeeItem,
  RoomTypeMaster, RoomMaster, StudentHostelAssignment, HostelAttendanceLog, FinanceHostelConfig,
  UniformCategory, UniformSize, UniformSupplier, UniformInventoryItem, StudentUniformIssue, FinanceUniformConfig,
  LeaveType, LeaveApplication, Payslip, PayrollConfiguration, PayrollComponent, PayrollAmountLine,
  SalaryStructure, EmployeeSalaryAssignment, PayrollRun, QuestionPaper, SchoolMeeting, Department,
  CertificateTemplateConfig, Designation
} from '../types';

export const initialSchoolProfile: SchoolProfile = {
  name: "Pirnav Educational Institutions",
  tagline: "Empowering Minds, Shaping Tomorrow",
  address: "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081",
  phone: "+91 9123456789",
  email: "contact@pirnavschools.edu",
  website: "https://pirnavschools.edu",
  principalName: "Dr. Eleanor Vance",
  academicYear: "2026-2027",
  logoUrl: "/pirnav-school-logo.png",
  staffCheckInTime: "08:30 AM",
  staffCheckOutTime: "05:00 PM",
  schoolStartTime: "08:30 AM",
  schoolEndTime: "03:30 PM",
  boardType: "CBSE",
  staffLoginAllowWindow: true,
  staffGracePeriodMinutes: 15
};

export const initialFinanceSettings: FinanceSettings = {
  academicYear: '2026-2027',
  activeAcademicYear: '2026-2027',
  currency: 'INR',
  defaultCurrency: 'INR',
  paymentGatewayEnabled: false,
  autoInvoiceGeneration: false,
  invoiceDueDays: 15,
  taxRatePct: 0,
  taxRegistrationNo: '',
  bankName: '',
  bankBranch: '',
  accountName: '',
  accountNo: '',
  ifscCode: '',
  lateFeeDailyAmount: 10,
  lateFeeGraceDays: 5,
  receiptFormat: 'REC-{YYYY}-{0000}',
  lateFeeRuleId: '',
  receiptPrefix: 'REC',
  invoicePrefix: 'INV',
  paymentModes: ['Cash', 'UPI', 'Cheque', 'Bank Transfer', 'Online'],
  financialYear: '2026-2027',
  autoReceiptNo: true,
  taxSettings: {
    enabled: false,
    taxName: 'GST',
    percentage: 0
  }
};

export const initialAcademicYears: AcademicYearMaster[] = [];
export const initialStudents: Student[] = [];
export const initialStaff: Staff[] = [];
export const initialAdmissions: AdmissionApplication[] = [];
export const initialBuses: Bus[] = [];
export const initialFeeStructures: FeeStructure[] = [];
export const initialFeePayments: FeePayment[] = [];
export const initialExamSetups: ExamSetup[] = [
  {
    id: 'EXAM-TEST-1',
    name: 'TEST 1',
    className: 'Class 1',
    academicYear: '2026-2027',
    term: 'Term 1',
    startDate: '2026-08-10',
    endDate: '2026-08-18',
    status: 'Results Published',
    publishStatus: 'Published',
    applicableClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
  },
  {
    id: 'EXAM-MIDTERM',
    name: 'Mid-Term Examination 2026',
    className: 'Class 1',
    academicYear: '2026-2027',
    term: 'Term 1',
    startDate: '2026-10-05',
    endDate: '2026-10-15',
    status: 'Results Published',
    publishStatus: 'Published',
    applicableClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
  }
];

export const initialExamMarks: ExamMark[] = [
  // Kavya Singh / Class 1 / TEST 1
  { id: 'MK-101', examId: 'EXAM-TEST-1', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'English', marksObtained: 88, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A', isAbsent: false },
  { id: 'MK-102', examId: 'EXAM-TEST-1', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'Mathematics', marksObtained: 94, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A+', isAbsent: false },
  { id: 'MK-103', examId: 'EXAM-TEST-1', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'Environmental Studies', marksObtained: 90, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A+', isAbsent: false },
  { id: 'MK-104', examId: 'EXAM-TEST-1', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'General Knowledge', marksObtained: 85, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A', isAbsent: false },

  // Kavya Singh / Class 1 / Mid-Term
  { id: 'MK-105', examId: 'EXAM-MIDTERM', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'English', marksObtained: 90, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A+', isAbsent: false },
  { id: 'MK-106', examId: 'EXAM-MIDTERM', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'Mathematics', marksObtained: 96, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A+', isAbsent: false },
  { id: 'MK-107', examId: 'EXAM-MIDTERM', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'Environmental Studies', marksObtained: 92, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A+', isAbsent: false },
  { id: 'MK-108', examId: 'EXAM-MIDTERM', studentId: '1', studentName: 'Kavya Singh', className: 'Class 1', section: 'A', subject: 'General Knowledge', marksObtained: 89, maxMarks: 100, totalMarks: 100, passMarks: 35, grade: 'A', isAbsent: false },
];
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
