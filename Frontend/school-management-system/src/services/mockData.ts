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
export const initialHolidays: Holiday[] = [
  { id: 'HOL-2026-01', name: 'New Year\'s Day', type: 'Festival', startDate: '2026-01-01', endDate: '2026-01-01', branch: 'All Branches', description: 'Global New Year Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-02', name: 'Makar Sankranti / Pongal Break', type: 'Festival', startDate: '2026-01-14', endDate: '2026-01-16', branch: 'All Branches', description: 'Traditional Harvest Festival Vacation', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-03', name: 'Republic Day', type: 'National', startDate: '2026-01-26', endDate: '2026-01-26', branch: 'All Branches', description: 'National Republic Day Flag Hoisting & Celebrations', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-04', name: 'Maha Shivratri', type: 'Festival', startDate: '2026-02-15', endDate: '2026-02-15', branch: 'All Branches', description: 'Maha Shivratri Observance', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-05', name: 'Holi - Festival of Colors', type: 'Festival', startDate: '2026-03-04', endDate: '2026-03-04', branch: 'All Branches', description: 'Holi Color Festival Celebration', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-06', name: 'Ugadi / Gudi Padwa', type: 'Festival', startDate: '2026-03-19', endDate: '2026-03-19', branch: 'All Branches', description: 'Telugu & Kannada New Year Festival', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-07', name: 'Good Friday', type: 'Gazetted', startDate: '2026-04-03', endDate: '2026-04-03', branch: 'All Branches', description: 'Good Friday Gazetted Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-08', name: 'Dr. B.R. Ambedkar Jayanti', type: 'Gazetted', startDate: '2026-04-14', endDate: '2026-04-14', branch: 'All Branches', description: 'Dr. B.R. Ambedkar Jayanti National Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-09', name: 'Id-ul-Fitr (Ramzan Eid)', type: 'Festival', startDate: '2026-04-20', endDate: '2026-04-20', branch: 'All Branches', description: 'Id-ul-Fitr Festival Celebration', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-10', name: 'Annual Summer Vacation', type: 'Vacation', startDate: '2026-05-01', endDate: '2026-06-07', branch: 'All Branches', description: 'Official 5-Week Summer Break for Students & Teachers', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-11', name: 'Bakrid / Id-ul-Adha', type: 'Festival', startDate: '2026-05-27', endDate: '2026-05-27', branch: 'All Branches', description: 'Id-ul-Adha Festival Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-12', name: 'Bonalu Festival', type: 'Festival', startDate: '2026-07-20', endDate: '2026-07-20', branch: 'All Branches', description: 'State Bonalu Festival Celebration', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-13', name: 'Independence Day', type: 'National', startDate: '2026-08-15', endDate: '2026-08-15', branch: 'All Branches', description: 'National Holiday celebrating Indian Independence Day', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-14', name: 'Raksha Bandhan', type: 'Festival', startDate: '2026-08-28', endDate: '2026-08-28', branch: 'All Branches', description: 'Raksha Bandhan Festival', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-15', name: 'Sri Krishna Janmashtami', type: 'Festival', startDate: '2026-09-04', endDate: '2026-09-04', branch: 'All Branches', description: 'Lord Krishna Jayanti Festival', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-16', name: 'Ganesh Chaturthi / Vinayaka Chavithi', type: 'Festival', startDate: '2026-09-14', endDate: '2026-09-14', branch: 'All Branches', description: 'Ganesh Chaturthi Festival Celebration', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-17', name: 'Milad-un-Nabi', type: 'Gazetted', startDate: '2026-09-25', endDate: '2026-09-25', branch: 'All Branches', description: 'Milad-un-Nabi Observance', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-18', name: 'Mahatma Gandhi Jayanti', type: 'National', startDate: '2026-10-02', endDate: '2026-10-02', branch: 'All Branches', description: 'Father of the Nation Birthday National Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-19', name: 'Bathukamma & Dussehra Vacation', type: 'Vacation', startDate: '2026-10-16', endDate: '2026-10-22', branch: 'All Branches', description: '7-Day Term Break for Dussehra & Vijayadashami', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-20', name: 'Diwali / Deepavali Vacation', type: 'Festival', startDate: '2026-11-07', endDate: '2026-11-11', branch: 'All Branches', description: '5-Day Festival Break for Diwali Lights Celebration', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-21', name: 'Guru Nanak Jayanti', type: 'Gazetted', startDate: '2026-11-24', endDate: '2026-11-24', branch: 'All Branches', description: 'Guru Nanak Dev Ji Prakash Purab', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2026-22', name: 'Christmas & Winter Vacation', type: 'Vacation', startDate: '2026-12-24', endDate: '2027-01-01', branch: 'All Branches', description: 'Official Winter Vacation & Christmas Break', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-23', name: 'Makar Sankranti / Pongal 2027', type: 'Festival', startDate: '2027-01-14', endDate: '2027-01-15', branch: 'All Branches', description: 'Harvest Festival Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-24', name: 'Republic Day 2027', type: 'National', startDate: '2027-01-26', endDate: '2027-01-26', branch: 'All Branches', description: 'Indian Constitution & Republic Day Flag Hoisting', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-25', name: 'Maha Shivratri 2027', type: 'Festival', startDate: '2027-03-06', endDate: '2027-03-06', branch: 'All Branches', description: 'Maha Shivratri Observance', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-26', name: 'Holi Festival 2027', type: 'Festival', startDate: '2027-03-22', endDate: '2027-03-22', branch: 'All Branches', description: 'Holi Festival Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-27', name: 'Good Friday 2027', type: 'Gazetted', startDate: '2027-03-26', endDate: '2027-03-26', branch: 'All Branches', description: 'Good Friday Gazetted Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-28', name: 'Ugadi Festival 2027', type: 'Festival', startDate: '2027-04-07', endDate: '2027-04-07', branch: 'All Branches', description: 'Ugadi New Year Celebration', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-29', name: 'Id-ul-Fitr 2027', type: 'Festival', startDate: '2027-04-09', endDate: '2027-04-09', branch: 'All Branches', description: 'Ramzan Eid Festival Holiday', status: 'Active', applicableTo: 'All' },
  { id: 'HOL-2027-30', name: 'Annual Summer Vacation 2027', type: 'Vacation', startDate: '2027-05-01', endDate: '2027-06-05', branch: 'All Branches', description: 'Annual Summer Vacation Break', status: 'Active', applicableTo: 'All' }
];
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
