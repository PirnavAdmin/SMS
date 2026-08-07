export type Role = 'Super Admin' | 'Admin' | 'Teacher' | 'Staff' | 'Parent' | 'Student' | 'Principal' | 'HR' | 'Accountant' | 'Librarian' | 'Transport Manager' | 'Hostel Warden' | 'Receptionist';
export type UserRole = Role;

export type StudentType = 'Day Scholar' | 'Hosteller' | 'Residential' | 'Non-Residential';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type CasteCategory = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Other';

export type FeeTerm = 'Annual' | 'Bi-Annual' | 'Quarterly' | 'Monthly';

export type StaffDocType =
  | 'Aadhaar Card'
  | 'PAN Card'
  | 'Driving License'
  | 'Medical Certificate'
  | 'Police Verification'
  | 'Bank Passbook'
  | 'Resume'
  | 'Experience Letter'
  | 'Educational Certificates'
  | 'Degree Certificate'
  | 'Post Graduation Certificate'
  | 'B.Ed.'
  | 'M.Ed.'
  | 'Teaching Eligibility Certificate'
  | 'Offer Letter'
  | 'Other';

export type ModulePermissions = Record<string, any>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  branch?: string;
  customRoleId?: string;
  phone?: string;
  lastLogin?: string;
  status?: string;
  isFirstLogin?: boolean;
}

export interface SchoolProfile {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  academicYear: string;
  logoUrl: string;
  highestClass?: string;
}

export interface AcademicYearMaster {
  id: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Closed';
  description?: string;
  isCurrentAcademicYear: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffDocumentVersion {
  version: number;
  fileUrl: string;
  replacedDate: string;
  replacedBy: string;
}

export interface StaffDocument {
  id: string;
  title: string;
  type: StaffDocType | string;
  fileUrl: string;
  uploadedDate: string;
  uploadedBy?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  verificationStatus?: 'Pending Verification' | 'Verified' | 'Rejected';
  remarks?: string;
  isRequired?: boolean;
  category?: string;
  versionHistory?: StaffDocumentVersion[];
}

export interface StaffEducationRecord {
  id: string;
  highestQualification: string;
  university: string;
  year: string;
  percentage: string;
  bed?: string;
  med?: string;
  phd?: string;
  specialization?: string;
}

export interface StaffExperienceRecord {
  id: string;
  totalExperience: string;
  previousSchool?: string;
  organization?: string;
  designation?: string;
  joiningDate?: string;
  relievingDate?: string;
  certificateFileName?: string;
  certificateFileUrl?: string;
  certificateUploadedAt?: string;
}

export interface DocumentRequirementRule {
  id: string;
  department: string;
  designation: string;
  requiredDocTypes: string[];
  status: 'Active' | 'Inactive';
  updatedAt?: string;
}

export interface PromotionHistoryItem {
  id: string;
  academicYear: string;
  fromClass: string;
  toClass: string;
  fromSection: string;
  toSection: string;
  fromBranch: string;
  toBranch: string;
  date: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string; // DD/MM/YYYY
  bloodGroup: BloodGroup | string;
  religion?: string;
  casteCategory?: CasteCategory | string;
  className: string;
  section: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Promoted' | 'Transferred' | 'Completed' | 'Alumni';
  avatar: string;
  joiningDate: string;

  // Global Multi-branch & Facility Allocation
  branch?: string; // e.g. "Main Campus", "North Branch", "West Campus", "Hyderabad"
  studentType?: StudentType; // Day Scholar vs Hosteller

  completionDate?: string;
  completionAcademicYear?: string;
  busRoute?: string;
  transportType?: 'AC' | 'Non-AC';
  pickupPoint?: string;
  dropPoint?: string;

  hostelBlock?: string;
  hostelRoom?: string;
  hostelBed?: string;

  boardType?: 'State Board' | 'CBSE';

  // Parent/Guardian
  parentName?: string;
  fatherName: string;
  fatherPhone: string;
  fatherOccupation: string;
  fatherEmail?: string;
  motherName: string;
  motherPhone: string;
  guardianEmail?: string;
  guardianPhone?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Contact
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;

  siblingsCount?: number;
  transportRequired?: boolean;
  routeId?: string;
  pickupPointId?: string;

  // Academic & Financial
  totalFee: number;
  paidFee: number;
  dueFee: number;
  attendancePct: number;
  gpa: number;
  previousSchool?: string;
  remarks?: string;
  scholarshipId?: string;
  discountId?: string;

  promotionHistory?: PromotionHistoryItem[];
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  upiId?: string;
}

export interface Staff {
  id: string;
  empId: string;
  employeeCategory?: 'Teacher' | 'Staff';
  branch?: string;
  name?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  designation: string;
  department: string;
  role?: string;
  email: string;
  phone: string;
  alternateMobile?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup?: BloodGroup | string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  joiningDate: string;
  qualification: string;
  experienceYears: number;
  salary: number;
  grossSalary?: number;
  netSalary?: number;
  profileStatus?: 'Incomplete' | 'Completed';
  employmentType?: string;
  reportingManager?: string;
  currentAddress?: string;
  residentialAddress?: string;
  permanentAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar: string;
  address: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  documents: StaffDocument[];
  qualifications?: StaffEducationRecord[];
  experienceRecords?: StaffExperienceRecord[];
  bankDetails: BankDetails;
  leaveBalance: {
    casual: number;
    sick: number;
    paid: number;
  };
  salaryStructureId?: string;
  salaryStructureName?: string;
  salaryStructureEffectiveDate?: string;
  teacherCode?: string;
  highestQualification?: string;
  specialization?: string;
  primarySubject?: string;
  secondarySubject?: string;
  isClassTeacherEligible?: boolean;
  weeklyWorkloadLimit?: number;
  dailyWorkloadLimit?: number;
  availableWorkingDays?: string[];
  availablePeriods?: string[];
  hostelAssignment?: {
    hostelId: string;
    hostelName: string;
    block: string;
    floor: string;
    assignmentDate: string;
    status: 'Active' | 'Completed' | 'Transferred';
    roleType: 'Warden' | 'Supervisor';
  };
}

export interface AdmissionApplication {
  id: string;
  applicationNo: string;
  applicantName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  appliedClass: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: BloodGroup | string;
  religion: string;
  casteCategory: CasteCategory | string;
  parentName: string; // Father Name
  motherName?: string;
  email: string;
  phone: string; // Father 10-digit phone
  motherPhone?: string; // Mother 10-digit phone
  alternatePhone?: string; // Optional Alternate 10-digit phone
  // Address breakdown
  addressHouseNo?: string;
  addressStreet?: string;
  addressArea?: string;
  addressCity?: string;
  addressDistrict?: string;
  addressState?: string;
  addressPinCode?: string;
  siblingsCount?: number;
  siblingStudentId?: string;
  siblingStudentIds?: string[];
  // Student type & transport/hostel fields
  studentType: StudentType;
  transportRequired?: boolean;
  transportType?: 'AC' | 'Non-AC';
  routeId?: string;
  busRoute?: string;
  pickupPointId?: string;
  pickupPoint?: string;
  dropPoint?: string;
  hostelBlock?: string;
  floor?: string;
  hostelRoom?: string;
  hostelBed?: string;
  branch?: string;
  scholarshipId?: string;
  discountId?: string;
  selectedOptionalFees?: string[];
  submissionDate: string;
  status: 'Pending' | 'Verified' | 'Approved' | 'Rejected' | 'Enrolled';
  documentsSubmitted: string[];
}

export interface Bus {
  id: string;
  busNumber: string;
  registrationNumber: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  type: 'AC' | 'Non-AC';
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface FeeStructure {
  id: string;
  academicYear: string;
  className: string;
  term: FeeTerm;
  tuitionFee: number;
  transportFee: number;
  hostelFee: number;
  uniformFee: number;
  booksFee: number;
  labFee: number;
  miscFee: number;
  dueDate: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  className: string;
  amountPaid: number;
  discount: number;
  fine: number;
  transportFee?: number;
  paymentMode: 'Cash' | 'Card' | 'Online' | 'Cheque';
  transactionId?: string;
  paymentDate: string;
  status: 'Paid' | 'Partial' | 'Pending';
  remarks?: string;
  scholarshipId?: string;
  scholarshipName?: string;
  scholarshipDescription?: string;
  scholarshipAmount?: number;
  discountId?: string;
  discountName?: string;
  discountDescription?: string;
  discountAmount?: number;
  grossAmount?: number;
  previousDue?: number;
}

export interface DailyAttendance {
  id?: string;
  date: string;
  entityType: 'Student' | 'Staff';
  entityId: string;
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Leave';
  remarks?: string;
  inTime?: string;
  outTime?: string;
  department?: string;
  designation?: string;
}

export interface ExamSetup {
  id: string;
  name: string;
  academicYear: string;
  className: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Results Published';
  
  // Enterprise & Unified Fields
  branch?: string;
  examType?: 'Unit Test' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Practical' | 'Custom';
  applicableClasses?: string[];
  sections?: string[];
  description?: string;
  publishResult?: boolean;
  publishStatus?: 'Draft' | 'Scheduled' | 'Published' | 'Completed' | 'Archived';
  gradeSchemeName?: string;
  schedules?: ExamSchedule[];
  marksConfig?: {
    maxMarks: number;
    passMarks: number;
    theoryMarks?: number;
    practicalMarks?: number;
    internalMarks?: number;
    gradingType?: string;
    attendanceWeightage?: number;
    subjectWiseConfig?: Record<string, { maxMarks: number; passMarks: number }>;
  };
  publishOptions?: {
    notifyTeachers?: boolean;
    notifyStudents?: boolean;
    generateHallTickets?: boolean;
  };
  lastUpdated?: string;
  isArchived?: boolean;
  auditLog?: Array<{
    timestamp: string;
    action: string;
    performedBy: string;
  }>;
}

export interface RevaluationLog {
  date: string;
  oldMarks: number;
  newMarks: number;
  reason: string;
  updatedBy: string;
  type: 'Grace' | 'Revaluation';
}

export interface ExamMark {
  id: string;
  examId: string;
  academicYear?: string;
  branch?: string;
  className?: string;
  section?: string;
  studentId: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks?: string;

  // Enterprise fields
  isAbsent?: boolean;
  maxMarks?: number;
  passMarks?: number;
  graceMarks?: number;
  isLocked?: boolean;
  isRevalued?: boolean;
  revaluationHistory?: RevaluationLog[];
  submittedBy?: string;
  submittedAt?: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string;
  startTime?: string;
  endTime?: string;
  className: string;
  section: string;
  subject: string;
  subjectId?: string;
  teacherName: string;
  teacherId?: string;
  roomNo: string;
  roomId?: string;
  academicYear?: string;
  branch?: string;
  status?: 'Draft' | 'Published' | 'Archived';
}

export interface PeriodSetting {
  id: string;
  academicYear: string;
  branch: string;
  periodName: string;
  startTime: string;
  endTime: string;
  sequence: number;
  periodType: string;
  status: 'Active' | 'Inactive';
}

export interface TeacherAssignment {
  id: string;
  academicYear: string;
  branch: string;
  className: string;
  section: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  status: 'Active' | 'Inactive';
}

export interface HomeworkAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface Homework {
  id: string;
  title: string;
  className: string;
  section: string;
  subject: string;
  subjectId?: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  totalSubmissions?: number;
  attachments?: HomeworkAttachment[];
  status?: 'Draft' | 'Published';
  publishToType?: 'Class' | 'Students';
  publishedStudentIds?: string[];
}

export interface HostelBlock {
  id: string;
  name: string;
  wardenName: string;
  wardenPhone: string;
}

export interface HostelRoom {
  id: string;
  blockId: string;
  roomNo: string;
  capacity: number;
  occupiedBeds?: number;
  occupied?: number;
  monthlyRent?: number;
  feePerTerm?: number;
  status: 'Available' | 'Full' | 'Maintenance';
}

export interface HostelBed {
  id: string;
  roomId: string;
  bedNo: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
  studentName?: string;
}

export interface UniformItem {
  id: string;
  category: string;
  gender: 'Male' | 'Female' | 'Unisex';
  className: string;
  size: string;
  color: string;
  price: number;
  availableStock: number;
}

export interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  rackNo: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: 'Student' | 'Staff';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number;
  status: 'Issued' | 'Returned' | 'Overdue';
}



export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: ModulePermissions;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  location: string;
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'All' | 'Students' | 'Staff' | 'Parents';
  date: string;
  author: string;
  category?: string;
  targetClass?: string;
  targetSection?: string;
}

export type HolidayType =
  | 'National'
  | 'State'
  | 'School'
  | 'Emergency'
  | 'Optional'
  | 'Gazetted'
  | 'Restricted'
  | 'Vacation'
  | 'Festival'
  | 'Branch';

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: HolidayType;
  branch?: string;
  applicableClasses?: string[];
  description?: string;
  status?: 'Active' | 'Inactive';
}

export type EventCategory =
  | 'Academic Activity'
  | 'Annual Day'
  | 'Sports Day'
  | 'Cultural Fest'
  | 'Science Exhibition'
  | 'School Tour'
  | 'Awareness Program'
  | 'Competition'
  | 'Workshop & Seminar'
  | 'Graduation Ceremony'
  | 'Celebration'
  | 'Parent Teacher Meeting'
  | 'Staff Meeting'
  | 'Admission Event'
  | 'Examination'
  | 'Custom Event';

export interface SchoolEvent {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  organizer: string;
  venue: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  branch: string;
  academicYear: string;
  applicableClasses?: string[];
  targetClass?: string;
  targetSection?: string;
  participants?: string;
  attachments?: { id: string; name: string; url: string; type: string }[];
  status: 'Published' | 'Draft' | 'Completed' | 'Cancelled';
  createdBy?: string;
  updatedAt?: string;
  sourceModule?: string;
  referenceId?: string;
}

export type UnifiedEventType =
  | 'School Event'
  | 'Holiday'
  | 'Examination'
  | 'Parent Teacher Meeting'
  | 'Staff Meeting'
  | 'Birthday'
  | 'Admission Event'
  | 'Custom Event';

export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  type: UnifiedEventType;
  category?: string;
  venue?: string;
  organizer?: string;
  description?: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'teal' | 'gray';
  sourceModule: string;
  branch?: string;
  applicableClasses?: string[];
  targetClass?: string;
  targetSection?: string;
  rawItem: any;
}

export interface Birthday {
  id: string;
  name: string;
  role: 'Student' | 'Staff';
  className?: string;
  department?: string;
  avatar: string;
  dob: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface Department {
  id: string;
  departmentName: string;
  departmentCode?: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface DesignationMaster {
  id: string;
  designationName: string;
  employeeCategory: 'Teaching' | 'Non-Teaching' | 'Both';
  status: 'Active' | 'Inactive';
  branch?: string;
  academicYear?: string;
  createdAt?: string;
}

export interface SubjectItem {
  id: string;
  subjectId: string;
  name: string;
  code?: string;
  department?: string;
  departmentId?: string;
  className?: string;
  weeklyPeriodCount?: number;
  isPractical?: boolean;
  labRequired?: boolean;
}

// ==========================================
// FINANCE & FEE ERP DATA MODELS
// ==========================================

export type FeeHeadCategory =
  | 'Tuition'
  | 'Admission'
  | 'Books'
  | 'Uniform'
  | 'Lab'
  | 'Computer'
  | 'Library'
  | 'Sports'
  | 'Activity'
  | 'Exam'
  | 'Transport'
  | 'Hostel'
  | 'Miscellaneous';

export type FeeHeadFrequency =
  | 'One Time'
  | 'Monthly'
  | 'Quarterly'
  | 'Half Yearly'
  | 'Annual'
  | 'Custom';

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  category: FeeHeadCategory;
  frequency: FeeHeadFrequency;
  mandatory: boolean;
  applicableClasses: string[];
  applicableBranches: string[];
  taxPercentage?: number;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

export interface FeeStructureItem {
  feeHeadId: string;
  feeHeadName: string;
  category?: string;
  amount: number;
}

export interface DynamicFeeStructure {
  id: string;
  academicYear: string;
  branch: string;
  className: string;
  section?: string;
  studentCategory: string;
  items: FeeStructureItem[];
  totalAmount: number;
  status: 'Active' | 'Inactive';
}

export interface StudentFeeAssignment {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  branch: string;
  academicYear: string;
  className: string;
  section: string;
  feeStructureId: string;
  assignedFeeHeads: FeeStructureItem[];
  baseFeeTotal: number;
  assignedDate: string;
  status: 'Active' | 'Modified' | 'Removed';
}

export type ScholarshipType =
  | 'Merit'
  | 'Government'
  | 'Minority'
  | 'Sports'
  | 'Staff Child'
  | 'Management'
  | 'Financial Aid';

export interface Scholarship {
  id: string;
  name: string;
  code: string;
  type: ScholarshipType;
  discountType: 'Percentage' | 'Fixed Amount';
  percentage?: number;
  fixedAmount?: number;
  applicableFeeHeadIds: string[];
  applicableClasses: string[];
  startDate: string;
  endDate: string;
  eligibility: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface StudentScholarship {
  id: string;
  studentId: string;
  studentName: string;
  scholarshipId: string;
  scholarshipName: string;
  discountType: 'Percentage' | 'Fixed Amount';
  discountValue: number;
  appliedDate: string;
  status: 'Active' | 'Revoked';
}

export type DiscountType =
  | 'Sibling Discount'
  | 'Employee Discount'
  | 'Early Payment Discount'
  | 'Special Approval'
  | 'Custom';

export interface Discount {
  id: string;
  name: string;
  code: string;
  type: DiscountType;
  mode: 'Percentage' | 'Fixed Amount';
  value: number;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface StudentDiscount {
  id: string;
  studentId: string;
  discountId: string;
  discountName: string;
  appliedDate: string;
}

export interface FineRule {
  id: string;
  ruleName: string;
  dueDate: string;
  graceDays: number;
  fineType: 'Daily Fine' | 'Fixed Fine';
  dailyFine?: number;
  fixedFine?: number;
  maximumFine?: number;
  status: 'Active' | 'Inactive';
}

export interface TransportRoute {
  id: string;
  routeName: string;
  routeCode: string;
  vehicleNo?: string;
  vehicleNumber: string;
  vehicleName: string;
  driverName: string;
  driverPhone?: string;
  driverMobile: string;
  pickupPoint: string;
  dropPoint: string;
  distanceKm: number;
  fareMonthly?: number;
  monthlyFee: number;
  quarterlyFee: number;
  halfYearlyFee: number;
  annualFee: number;
  capacity?: number;
  assignedStudentsCount?: number;
  status: 'Active' | 'Inactive';
}

export interface StudentTransport {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  routeId: string;
  routeName: string;
  pickupPoint: string;
  dropPoint?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  feePlan: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual';
  feeAmount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Inactive';
}

export interface StudentHostel {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  hostelId: string;
  hostelName: string;
  roomId?: string;
  roomNo: string;
  bedNo: string;
  feeAmount: number;
  effectiveFrom: string;
  status: 'Active' | 'Occupied' | 'Vacated' | 'Transferred' | 'Inactive' | string;
}

export interface Refund {
  id: string;
  refundNo: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  amount: number;
  reason: 'Duplicate Payment' | 'Admission Cancelled' | 'Scholarship Adjustment' | 'Others';
  approvedBy: string;
  refundMode: 'Bank Transfer' | 'Cash' | 'Cheque';
  refundDate: string;
  remarks: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface FinanceSettings {
  academicYear: string;
  defaultCurrency: string;
  receiptFormat: string;
  lateFeeRuleId: string;
  receiptPrefix: string;
  invoicePrefix: string;
  paymentModes: string[];
  financialYear: string;
  autoReceiptNo: boolean;
  taxSettings: {
    enabled: boolean;
    taxName: string;
    percentage: number;
  };
}

// ==========================================
// MASTER FINANCE LEDGER & TRANSACTIONS MODELS
// ==========================================

export type TransactionType = 'Income' | 'Expense';

export type FinancialAccountType =
  | 'Cash'
  | 'Main Bank Account'
  | 'Salary Account'
  | 'Hostel Account' | 'Transport Account' | 'Petty Cash Account';

export interface TransactionAuditLog {
  id: string;
  action: 'Created' | 'Updated' | 'Approved' | 'Cancelled' | 'Reversed';
  user: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  notes?: string;
}

export interface FinanceTransaction {
  id: string;
  transactionId: string;
  date: string;
  time?: string;
  type: TransactionType;
  category: string;
  sourceModule:
    | 'Student Fee Collection'
    | 'Admissions'
    | 'Payroll'
    | 'Hostel'
    | 'Transport'
    | 'Library'
    | 'Inventory'
    | 'Vendor Management'
    | 'Manual'
    | 'Accounts';
  referenceNumber: string;
  referenceRecordId?: string;
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Card' | 'DD' | 'Online';
  account: FinancialAccountType;
  branch: string;
  academicYear: string;
  status: 'Completed' | 'Pending' | 'Approved' | 'Cancelled' | 'Reversed';
  createdBy: string;
  approvedBy?: string;
  attachments?: string[];
  notes?: string;
  auditTrail?: TransactionAuditLog[];
}

export interface FinancialAccount {
  id: string;
  accountName: string;
  accountType: FinancialAccountType;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  currentBalance: number;
  currency: string;
  status: 'Active' | 'Inactive';
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType;
  sourceModule?: string;
  status: 'Active' | 'Inactive';
  isSystem?: boolean;
}

export interface FinancialBudget {
  id: string;
  categoryName: string;
  academicYear: string;
  branch: string;
  allocatedAmount: number;
  consumedAmount: number;
  remainingAmount: number;
  status: 'Active' | 'Exceeded' | 'Closed';
}

// ==========================================
// TRANSPORT ERP DATA MODELS
// ==========================================

export interface RouteMaster {
  id: string;
  routeCode: string;
  routeName: string;
  routeStart: string;
  routeEnd: string;
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface PickupPoint {
  id: string;
  routeId: string;
  routeName: string;
  pickupName: string;
  sequenceNumber: number;
  arrivalTime: string;
  distanceFromSchoolKm: number;
  monthlyFee?: number;
  quarterlyFee?: number;
  halfYearlyFee?: number;
  annualFee?: number;
  status: 'Active' | 'Inactive';
}

export interface FinanceTransportConfig {
  id: string;
  routeId: string;
  routeName: string;
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  pickupPointId: string;
  pickupName: string;
  feePlan: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual';
  feeAmount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Inactive';
}

export interface LedgerFeeItem {
  headId: string;
  headName: string;
  category: string;
  originalAmount: number;
  scholarshipDeduction: number;
  discountDeduction: number;
  fineAmount: number;
  finalAmount: number;
  isApplicable: boolean;
  status: 'Paid' | 'Partial' | 'Pending';
  remarks?: string;
}

export interface StudentFeeLedger {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  studentType: 'Day Scholar' | 'Hosteller';
  academicYear: string;
  feeItems: LedgerFeeItem[];
  totalOriginalAmount: number;
  grossAmount: number;
  totalScholarship: number;
  totalDiscount: number;
  totalFine: number;
  totalPayable: number;
  paidAmount: number;
  dueBalance: number;
  createdAt: string;
  updatedAt: string;
  scholarshipId?: string;
  scholarshipName?: string;
  scholarshipDescription?: string;
  scholarshipAmount: number;
  discountId?: string;
  discountName?: string;
  discountDescription?: string;
  discountAmount: number;
  fineAmount: number;
  previousDue: number;
}

export interface VehicleMaster {
  id: string;
  vehicleNumber: string;
  registrationNumber: string;
  vehicleType: 'Bus' | 'Van';
  capacity: number;
  isAC: boolean;
  chassisNumber: string;
  engineNumber: string;
  insuranceExpiry: string;
  pollutionExpiry: string;
  fitnessExpiry: string;
  gpsDeviceId: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface DriverMaster {
  id: string;
  driverName: string;
  mobileNumber: string;
  email?: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  address: string;
  emergencyContact: string;
  experienceYears: number;
  status: 'Active' | 'Inactive' | 'On Leave';
}

export interface VehicleAssignment {
  id: string;
  branch?: string;
  academicYear?: string;
  vehicleId: string;
  vehicleNumber: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  attendantId?: string;
  attendantName?: string;
  attendantMobile?: string;
  morningTripTime?: string;
  eveningTripTime?: string;
  vehicleCapacity?: number;
  assignedStudents?: number;
  gpsStatus?: 'Online' | 'Offline';
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Inactive';
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  serviceDate: string;
  serviceType: string;
  vendor: string;
  cost: number;
  nextServiceDue: string;
  remarks: string;
  status: 'Completed' | 'Scheduled' | 'Overdue';
}

// ==========================================
// HOSTEL ERP DATA MODELS
// ==========================================

export interface HostelMaster {
  id: string;
  hostelName: string;
  name?: string;
  hostelCode: string;
  hostelType: 'Boys' | 'Girls' | 'Mixed';
  wardenName: string;
  wardenMobile: string;
  wardenAlternateMobile?: string;
  wardenEmail?: string;
  address: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface HostelAssignment {
  id: string;
  staffId: string;
  empId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string;
  email: string;
  hostelId: string;
  hostelName: string;
  block: string;
  floor: string;
  assignmentDate: string;
  status: 'Active' | 'Completed' | 'Transferred';
  roleType: 'Warden' | 'Supervisor';
}

export interface HostelAssignmentLogItem {
  id: string;
  staffId: string;
  empId: string;
  employeeName: string;
  designation: string;
  hostelName: string;
  block: string;
  floor: string;
  fromDate: string;
  toDate?: string;
  status: 'Active' | 'Completed';
  roleType: 'Warden' | 'Supervisor';
}

export interface RoomTypeMaster {
  id: string;
  roomTypeName: string;
  capacity: number;
  acType: 'AC' | 'Non-AC';
  description: string;
  status: 'Active' | 'Inactive';
}

export interface RoomMaster {
  id: string;
  hostelId: string;
  hostelName: string;
  floor: string;
  roomNumber: string;
  roomTypeId: string;
  roomType?: string;
  roomTypeName?: string;
  capacity?: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface StudentHostelAssignment {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  hostelId: string;
  hostelName: string;
  roomId?: string;
  roomNo: string;
  bedNo: string;
  joiningDate: string;
  leavingDate?: string;
  status: 'Active' | 'Occupied' | 'Vacated' | 'Transferred' | string;
}


export interface HostelAttendanceLog {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  hostelName: string;
  roomNo: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
  remarks?: string;
}

export interface FinanceHostelConfig {
  id: string;
  hostelId: string;
  hostelName: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId?: string;
  roomNo?: string;
  feePlan: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual';
  hostelFee: number;
  securityDeposit: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Inactive';
  messFee?: number;
}

export interface HostelVisitorLog {
  id: string;
  visitorName: string;
  studentName: string;
  relation?: string;
  purpose?: string;
  inTime?: string;
  outTime?: string;
  status: 'In' | 'Out';
  date?: string;
  studentId?: string;
}

// ==========================================
// UNIFORM STORE ERP DATA MODELS
// ==========================================

export interface UniformCategory {
  id: string;
  name: string;
  description?: string;
}

export interface UniformSize {
  id: string;
  sizeName: string;
  chest?: string;
  waist?: string;
  height?: string;
  ageGroup?: string;
  gender: 'Male' | 'Female' | 'Unisex';
}

export interface UniformSupplier {
  id: string;
  supplierName: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  gstNumber?: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export interface UniformInventoryItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  size: string;
  openingStock: number;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface StudentUniformIssue {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  itemId: string;
  itemName: string;
  size: string;
  quantity: number;
  issueDate: string;
  status: 'Issued' | 'Returned' | 'Replaced';
  returnDate?: string;
  replacementDate?: string;
  academicYear: string;
  branch?: string;
  notes?: string;
}

export interface FinanceUniformConfig {
  id: string;
  academicYear: string;
  branch: string;
  className: string;
  gender: 'Male' | 'Female' | 'Unisex';
  uniformPackage: string;
  feePlan: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual';
  feeAmount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Inactive';
}

// ==========================================
// LEAVE & PAYROLL MANAGEMENT DATA MODELS
// ==========================================

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  annualAllowance: number;
  carryForward: boolean;
  maxConsecutiveDays: number;
  requiresAttachment: boolean;
  isPaid: boolean;
  status: 'Active' | 'Inactive';
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  empId: string;
  department: string;
  designation: string;
  branch: string;
  employeeCategory: 'Teacher' | 'Staff';
  leaveTypeId: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'First Half' | 'Second Half';
  numberOfDays: number;
  reason: string;
  attachments: string[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Sent Back';
  appliedDate: string;
  approverRemarks?: string;
  approvedBy?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  empId: string;
  branch?: string;
  department?: string;
  designation?: string;
  employeeCategory?: 'Teacher' | 'Staff';
  month: string;
  basicSalary: number;
  hra: number;
  da: number;
  earnings?: PayrollAmountLine[];
  deductions?: PayrollAmountLine[];
  grossSalary?: number;
  leaveDeduction?: number;
  otherDeductions?: number;
  pfDeduction: number;
  lopDeduction: number;
  netSalary: number;
  bankAccount: string;
  disbursedDate: string;
  paymentDate?: string;
  leaveDetails?: {
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    halfDays: number;
    lateEntries: number;
  };
  status: 'Generated' | 'Paid' | 'Emailed';
}

export type PayrollComponentCategory = 'Earning' | 'Deduction';
export type PayrollComponentValueType = 'Fixed' | 'Percentage';
export type PayrollStatus = 'Draft' | 'Active' | 'Inactive';
export type SalaryCalculationMethod = 'Calendar Days' | 'Working Days';
export type PayrollFrequency = 'Monthly' | 'Weekly' | 'Bi-Weekly';
export type PayrollRunStatus = 'Pending' | 'Processed' | 'HR Review' | 'Accounts Review' | 'Principal Approval' | 'Locked';

export interface PayrollAmountLine {
  name: string;
  amount: number;
  type?: PayrollComponentValueType;
  value?: number;
}

export interface PayrollComponent {
  id: string;
  name: string;
  category: PayrollComponentCategory;
  type: PayrollComponentValueType;
  value: number;
  taxable?: boolean;
  mandatory?: boolean;
  status: 'Active' | 'Inactive';
  branch?: string;
}

export interface PayrollLeaveRule {
  leaveTypeId: string;
  leaveTypeName: string;
  paidLeave: boolean;
  deductSalary: boolean;
  maximumPaidDays: number;
  carryForward: boolean;
}

export interface PayrollConfiguration {
  id: string;
  branch: string;
  financialYear: string;
  payrollName: string;
  status: PayrollStatus;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  leaveRules: PayrollLeaveRule[];
  attendanceRules: {
    salaryCalculationMethod: SalaryCalculationMethod;
    calendarDays: number;
    workingDays: number;
    includeWeeklyOff: boolean;
    includePublicHolidays: boolean;
    includeApprovedLeave: boolean;
    twoHalfDaysOneFullDay: boolean;
    deductHalfSalary: boolean;
    lateEntriesForHalfDay: number;
    halfDaysForLop: number;
  };
  deductionRules: {
    lopDeduction: string;
    halfDayDeduction: string;
    unauthorizedAbsence: string;
    lateComing: string;
    earlyExit: string;
  };
  payrollCycle: {
    payrollType: PayrollFrequency;
    payrollStartDate: string;
    payrollEndDate: string;
    salaryPaymentDate: string;
  };
  overtime: {
    enabled: boolean;
    calculationType: 'Fixed' | 'Multiplier';
    hourlyRate: number;
    weekendRate: number;
    holidayRate: number;
  };
  settings: {
    autoGeneratePayslips: boolean;
    autoLockPayrollAfterProcessing: boolean;
    allowManualAdjustment: boolean;
    autoCalculateLeaveDeduction: boolean;
    autoSendPayslips: boolean;
    enablePayrollApprovalWorkflow: boolean;
  };
  updatedBy?: string;
  updatedAt?: string;
  auditLogs?: {
    updatedBy: string;
    updatedAt: string;
    oldValue: string;
    newValue: string;
  }[];
}

export interface SalaryStructure {
  id: string;
  structureName: string;
  employeeCategory: 'Teacher' | 'Staff';
  branch: string;
  earnings: PayrollAmountLine[];
  deductions: PayrollAmountLine[];
  grossSalary: number;
  netSalaryFormula: string;
  status: 'Active' | 'Inactive';
  structureCode?: string;
  designation?: string;
  payGrade?: string;
  department?: string;
  employmentType?: string;
  payrollFrequency?: 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Hourly' | 'Daily' | 'Per Class' | 'Contractual';
  salaryPaymentDay?: string;
  pfApplicable?: boolean;
  pfPercentage?: number;
  esiApplicable?: boolean;
  esiPercentage?: number;
  professionalTaxApplicable?: boolean;
  professionalTaxAmount?: number;
  roundOffRule?: 'No Round Off' | 'Nearest 1' | 'Nearest 10' | 'Nearest 50';
  notes?: string;
  branchId?: string;
  effectiveDate?: string;
}

export interface EmployeeSalaryAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  empId: string;
  employeeCategory: 'Teacher' | 'Staff';
  branch: string;
  department: string;
  salaryStructureId: string;
  salaryStructureName: string;
  effectiveDate: string;
  status: 'Active' | 'Inactive';
  monthlyGross?: number;
  previousGross?: number;
  updatedBy?: string;
  updatedAt?: string;
  reason?: string;
  salaryOverride?: boolean;
  overrideBasicSalary?: number;
  overrideAllowances?: number;
  overrideDeductions?: number;
  overrideNetSalary?: number;
}

export interface PayrollRun {
  id: string;
  employeeId: string;
  employeeName: string;
  empId: string;
  branch: string;
  department: string;
  employeeCategory: 'Teacher' | 'Staff';
  payrollMonth: string;
  grossSalary: number;
  leaveDeduction: number;
  otherDeductions: number;
  netSalary: number;
  status: PayrollRunStatus;
  salaryStructureId?: string;
  configurationId?: string;
  earnings: PayrollAmountLine[];
  deductions: PayrollAmountLine[];
  leaveDetails: {
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    halfDays: number;
    lateEntries: number;
  };
  processedDate?: string;
  lockedDate?: string;
  paymentDate?: string;
  workflowStage?: 'HR' | 'Accounts' | 'Principal' | 'Management' | 'Released';
  manualAdjustments?: {
    type: 'Bonus' | 'Incentive' | 'Recovery' | 'Fine' | 'Advance Recovery';
    amount: number;
    reason: string;
    date: string;
  }[];
  notes?: string;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  academicYear?: string;
  branch?: string;
  date: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  subject: string;
  className: string;
  section: string;
  maxMarks: number;
  passMarks: number;
  room: string;
  invigilatorId: string;
  invigilatorName: string;
}

export interface GradeConfig {
  id: string;
  academicYear?: string;
  branch?: string;
  schemeName?: string;
  grade?: string;
  gradeName: string;
  minPercent: number;
  maxPercent: number;
  minMark?: number;
  maxMark?: number;
  gradePoints: number;
  gradePoint?: number;
  passCriteria: 'Pass' | 'Fail';
  remarks?: string;
}

export interface ProcessedResult {
  id: string;
  examId: string;
  academicYear?: string;
  branch?: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  admissionNo?: string;
  className: string;
  section: string;
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  gpa: number;
  finalGrade: string;
  overallGrade?: string;
  subjectMarks?: any[];
  passStatus: 'Pass' | 'Fail';
  status: 'Draft' | 'Calculated' | 'Approved' | 'Published' | 'Locked';
  processedBy?: string;
  processedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  lockedAt?: string;
  remarks?: string;
  rank?: number;
}

export interface ExamAuditLog {
  id: string;
  examId: string;
  academicYear: string;
  branch: string;
  className: string;
  section: string;
  subject: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  oldMarks: number;
  newMarks: number;
  modifiedBy: string;
  modifiedRole: string;
  reason: string;
  timestamp: string;
}

export interface QuestionPaper {
  id: string;
  academicYear: string;
  branch: string;
  examId: string;
  examName: string;
  className: string;
  section?: string;
  subject: string;
  paperTitle: string;
  paperCode?: string;
  examDate?: string;
  duration: string;
  maxMarks: number;
  instructions?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  uploadedBy: string;
  uploadedOn: string;
  status: 'Draft' | 'Published';
}

export type MeetingAudience = 'Individual' | 'Group';
export type MeetingParticipantType = 'Teaching Staff' | 'Non-Teaching Staff' | 'Student' | 'Parent';
export type MeetingMode = 'In-Person' | 'Online' | 'Hybrid';
export type MeetingStatus = 'Draft' | 'Scheduled' | 'Completed' | 'Cancelled';

export interface MeetingParticipantInfo {
  id: string;
  name: string;
  type: MeetingParticipantType;
  details: string;
  email?: string;
  phone?: string;
}

export interface SchoolMeeting {
  id: string;
  title: string;
  description?: string;
  academicYear: string;
  branch: string;
  meetingAudience: MeetingAudience;
  participantType?: MeetingParticipantType;
  participants: MeetingParticipantInfo[];
  targetGroupDescription?: string;
  meetingMode: MeetingMode;
  
  building?: string;
  floor?: string;
  roomVenue?: string;
  roomCapacity?: number;
  
  onlineMeetingUrl?: string;

  meetingDate: string;
  startTime: string;
  endTime: string;
  
  status: MeetingStatus;
  organizerName: string;
  organizerRole: string;
  createdAt: string;
  cancellationReason?: string;

  // Enterprise ERP Fields
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  attendanceRequired?: 'Mandatory' | 'Optional';
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  excludedParticipantIds?: string[];
}

// ==========================================
// ENTERPRISE TRAINING & ASSESSMENTS MODELS
// ==========================================

export type TrainingCategory =
  | 'Faculty Development Program (FDP)'
  | 'Subject Training'
  | 'Teaching Methodology'
  | 'Classroom Management'
  | 'Smart Classroom Training'
  | 'ERP Training'
  | 'AI Training'
  | 'Leadership Training'
  | 'First Aid'
  | 'Fire Safety'
  | 'Child Protection'
  | 'POCSO Awareness'
  | 'Communication Skills'
  | 'Time Management'
  | 'External Certification'
  | 'Vendor Training'
  | 'Other';

export interface TrainingParticipant {
  employeeId: string;
  employeeName: string;
  employeeRole: 'Teaching Staff' | 'Non-Teaching Staff';
  department: string;
  designation: string;
  branch: string;
  subject?: string;
  attendanceStatus: 'Present' | 'Absent' | 'Excused' | 'Pending';
  feedback?: {
    overallRating: number;
    trainerRating: number;
    contentRating: number;
    suggestions?: string;
  };
  certificateIssued?: boolean;
  certificateNo?: string;
}

export interface WorkshopTraining {
  id: string;
  workshopName: string;
  category: TrainingCategory;
  type: 'Internal' | 'External';
  trainerName: string;
  organization: string;
  branch: string;
  department?: string;
  applicableDesignation?: string;
  venue: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  description: string;
  attachments?: { id: string; name: string; url: string; type: string }[];
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  participants: TrainingParticipant[];
  attendancePct?: number;
  createdBy?: string;
  createdAt?: string;
}

export type AssessmentCategory =
  | 'Knowledge'
  | 'Practical'
  | 'Observation'
  | 'Interview'
  | 'Certification'
  | 'Performance Evaluation'
  | 'Validation';

export type AssessmentMode = 'Offline' | 'Online' | 'Practical' | 'Classroom Observation';

export type AssessmentType =
  | 'Subject Knowledge Test'
  | 'Teaching Competency'
  | 'Practical Demonstration'
  | 'Classroom Observation'
  | 'Viva'
  | 'Online Assessment'
  | 'Offline Assessment'
  | 'Digital Skills Test'
  | 'Safety Assessment'
  | 'Internal Promotion Assessment'
  | 'Compliance Assessment'
  | 'Custom Assessment';

export interface AssessmentResult {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  branch: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  result: 'Pass' | 'Fail' | 'Pending';
  evaluatorRemarks?: string;
  strengths?: string[];
  improvementAreas?: string[];
  evaluatedDate?: string;
  certificateIssued?: boolean;
  certificateNo?: string;
}

export interface EmployeeAssessment {
  id: string;
  assessmentName: string;
  assessmentType: AssessmentType;
  category?: AssessmentCategory;
  description?: string;
  gradingScheme?: 'Letter Grade' | 'Percentage' | 'Pass/Fail';
  department: string;
  applicableDesignation: string;
  branch: string;
  academicYear?: string;
  targetEmployeeType?: 'Teaching Staff' | 'Non-Teaching Staff' | 'Both';
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  venue?: string;
  mode?: AssessmentMode;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  evaluatorName: string;
  coEvaluatorName?: string;
  options?: {
    notifyParticipants?: boolean;
    addToCalendar?: boolean;
    allowReassessment?: boolean;
    publishImmediately?: boolean;
    generateCertificatesOnCompletion?: boolean;
  };
  status: 'Scheduled' | 'In Progress' | 'Evaluated' | 'Cancelled';
  results: AssessmentResult[];
  createdBy?: string;
  createdAt?: string;
}

export interface IssuedCertificate {
  id: string;
  certificateNumber: string;
  programType: 'Workshop' | 'Training' | 'Assessment';
  programName: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  branch: string;
  completionDate: string;
  issuedBy: string;
  downloadUrl?: string;
  status: 'Issued' | 'Revoked' | 'Reissued';
}

export type AlumniCurrentStatus = 'Higher Studies' | 'Working' | 'Business' | 'Competitive Exams' | 'Other' | 'Unknown';

export interface AlumniRecord {
  id: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  avatar?: string;
  batch: string;
  completionAcademicYear: string;
  finalClass: string;
  finalSection: string;
  completionDate: string;
  currentStatus: AlumniCurrentStatus;
  higherEducationDetail?: string;
  organizationCompany?: string;
  contactPhone?: string;
  contactEmail?: string;
  parentName?: string;
  branch?: string;
  createdDate: string;
  tcIssued?: boolean;
  tcNumber?: string;
}








