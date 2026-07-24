export type Role = 'Super Admin' | 'Admin' | 'Teacher' | 'Staff' | 'Parent' | 'Student' | 'Principal' | 'HR' | 'Accountant' | 'Librarian' | 'Transport Manager' | 'Hostel Warden' | 'Receptionist';
export type UserRole = Role;

export type StudentType = 'Day Scholar' | 'Hosteller';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type CasteCategory = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Other';

export type FeeTerm = 'Annual' | 'Bi-Annual' | 'Quarterly' | 'Monthly';

export type StaffDocType = 'Aadhaar Card' | 'PAN Card' | 'Resume' | 'Experience Letter' | 'Educational Certificates' | 'Offer Letter' | 'Other';

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
}

export interface StaffDocument {
  id: string;
  title: string;
  type: StaffDocType;
  fileUrl: string;
  uploadedDate: string;
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
  status: 'Active' | 'Inactive' | 'Promoted' | 'Transferred';
  avatar: string;
  joiningDate: string;

  // Global Multi-branch & Facility Allocation
  branch?: string; // e.g. "Main Campus", "North Branch", "West Campus", "Hyderabad"
  studentType?: StudentType; // Day Scholar vs Hosteller
  busRoute?: string;
  transportType?: 'AC' | 'Non-AC';
  pickupPoint?: string;
  dropPoint?: string;

  hostelBlock?: string;
  hostelRoom?: string;
  hostelBed?: string;

  boardType?: 'State Board' | 'CBSE';

  // Parent/Guardian
  fatherName: string;
  fatherPhone: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;

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
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  role?: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  joiningDate: string;
  qualification: string;
  experienceYears: number;
  salary: number;
  status: 'Active' | 'Inactive' | 'On Leave';
  avatar: string;
  address: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  documents: StaffDocument[];
  bankDetails: BankDetails;
  leaveBalance: {
    casual: number;
    sick: number;
    paid: number;
  };
  salaryStructureId?: string;
  salaryStructureName?: string;
  salaryStructureEffectiveDate?: string;
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
}

export interface ExamSetup {
  id: string;
  name: string;
  academicYear: string;
  className: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Results Published';
  
  // Enterprise fields
  branch?: string;
  examType?: 'Unit Test' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Practical' | 'Custom';
  applicableClasses?: string[];
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
  className: string;
  section: string;
  subject: string;
  teacherName: string;
  roomNo: string;
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
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  totalSubmissions?: number;
  attachments?: HomeworkAttachment[];
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
  occupied: number;
  feePerTerm: number;
}

export interface HostelBed {
  id: string;
  roomId: string;
  bedNo: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
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
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'Gazetted' | 'Restricted' | 'Vacation' | 'National' | 'School' | 'Festival' | 'Branch';
  branch?: string;
  description?: string;
}

export interface Birthday {
  id: string;
  name: string;
  role: 'Student' | 'Staff';
  className?: string;
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

export interface SubjectItem {
  id: string;
  subjectId: string;
  name: string;
  code?: string;
  department?: string;
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
  roomNo: string;
  bedNo: string;
  feeAmount: number;
  effectiveFrom: string;
  status: 'Active' | 'Inactive';
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
  licenseNumber: string;
  licenseExpiryDate: string;
  address: string;
  emergencyContact: string;
  experienceYears: number;
  status: 'Active' | 'Inactive' | 'On Leave';
}

export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
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
  roomId: string;
  roomNo: string;
  bedNo: string;
  joiningDate: string;
  leavingDate?: string;
  status: 'Active' | 'Vacated' | 'Transferred';
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
  department?: string;
  employmentType?: string;
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
  gradeName: string;
  minPercent: number;
  maxPercent: number;
  gradePoints: number;
  passCriteria: 'Pass' | 'Fail';
}

export interface ProcessedResult {
  id: string;
  examId: string;
  academicYear?: string;
  branch?: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  className: string;
  section: string;
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  gpa: number;
  finalGrade: string;
  passStatus: 'Pass' | 'Fail';
  status: 'Draft' | 'Processed' | 'Published' | 'Locked';
  processedBy?: string;
  processedAt?: string;
  publishedAt?: string;
  lockedAt?: string;
  remarks?: string;
}






