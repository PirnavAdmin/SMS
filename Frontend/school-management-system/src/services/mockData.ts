import {
  Student, Staff, AdmissionApplication, FeeStructure, FeePayment,
  ExamSetup, ExamMark, TimetableSlot, Homework,
  BookItem, BookIssue, TransportRoute, HostelBlock, HostelRoom, HostelBed,
  Bus, UniformItem, CustomRole, InventoryItem, Announcement, Holiday,
  Birthday, AuditLog, SchoolProfile, SubjectItem,
  FeeHead, DynamicFeeStructure, StudentFeeAssignment, Scholarship,
  StudentScholarship, Discount, StudentDiscount, FineRule,
  TransportRoute as ERPTransportRoute, StudentTransport, HostelMaster,
  StudentHostel, Refund, FinanceSettings,
  RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, VehicleMaintenance,
  FinanceTransportConfig, StudentFeeLedger, LedgerFeeItem,
  RoomTypeMaster, RoomMaster, StudentHostelAssignment, HostelAttendanceLog, FinanceHostelConfig,
  UniformCategory, UniformSize, UniformSupplier, UniformInventoryItem, StudentUniformIssue, FinanceUniformConfig,
  LeaveType, LeaveApplication, Payslip
} from '../types';

export const initialSchoolProfile: SchoolProfile = {
  name: "St. Xavier's International Academy",
  tagline: "Empowering Minds, Shaping Tomorrow",
  address: "742 Evergreen Terrace, Knowledge City, NY 10001",
  phone: "+1 (555) 019-2834",
  email: "contact@stxaviers.edu",
  website: "https://stxaviers-academy.edu",
  principalName: "Dr. Eleanor Vance",
  academicYear: "2025-2026",
  logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80"
};

export const initialStudents: Student[] = [
  {
    id: "STU-001",
    admissionNo: "ADM2024-001",
    rollNo: "1001",
    firstName: "Alexander",
    lastName: "Wright",
    gender: "Male",
    dob: "12/04/2008",
    bloodGroup: "O+",
    religion: "Christianity",
    casteCategory: "General",
    className: "Class 10",
    section: "A",
    category: "General",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    joiningDate: "2022-06-10",
    branch: "Main Campus",
    studentType: "Day Scholar",
    busRoute: "Route A - North Suburbs",
    transportType: "AC",
    boardType: "CBSE",
    fatherName: "Robert Wright",
    fatherPhone: "9876543210",
    fatherOccupation: "Software Engineer",
    motherName: "Clara Wright",
    motherPhone: "9876543211",
    email: "alex.wright@student.edu",
    phone: "9876543210",
    address: "H.No 42, Willow Brook Way, Apt 3B, Knowledge City, NY 10001",
    siblingsCount: 1,
    totalFee: 4500,
    paidFee: 4500,
    dueFee: 0,
    attendancePct: 96.5,
    gpa: 3.9,
    previousSchool: "Greenwood Middle School",
    promotionHistory: [
      { id: "PROM-101", academicYear: "2025-2026", fromClass: "Class 9", toClass: "Class 10", fromSection: "A", toSection: "A", fromBranch: "Main Campus", toBranch: "Main Campus", date: "2025-06-15" }
    ]
  },
  {
    id: "STU-002",
    admissionNo: "ADM2024-002",
    rollNo: "1002",
    firstName: "Sophia",
    lastName: "Chen",
    gender: "Female",
    dob: "25/09/2008",
    bloodGroup: "A+",
    religion: "Buddhism",
    casteCategory: "General",
    className: "Class 10",
    section: "A",
    category: "General",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    joiningDate: "2022-06-11",
    branch: "North Branch",
    studentType: "Hosteller",
    busRoute: "Route B - East Downtown",
    transportType: "Non-AC",
    hostelBlock: "BLK-B",
    hostelRoom: "RM-201",
    hostelBed: "BED-201-A",
    boardType: "State Board",
    fatherName: "David Chen",
    fatherPhone: "9876543212",
    fatherOccupation: "Architect",
    motherName: "Mei Ling Chen",
    motherPhone: "9876543213",
    email: "sophia.chen@student.edu",
    phone: "9876543212",
    address: "H.No 18, Sunset Boulevard, Downtown, NY 10002",
    siblingsCount: 0,
    totalFee: 4500,
    paidFee: 3000,
    dueFee: 1500,
    attendancePct: 94.0,
    gpa: 4.0
  }
];

export const initialStaff: Staff[] = [
  {
    id: "STF-001",
    empId: "EMP001",
    employeeCategory: "Staff",
    firstName: "Dr. Eleanor",
    lastName: "Vance",
    designation: "Principal",
    department: "Administration",
    email: "eleanor.vance@stxaviers.edu",
    phone: "+1 555-888-001",
    gender: "Female",
    dob: "15/03/1975",
    joiningDate: "2015-08-01",
    qualification: "Ph.D. in Educational Leadership",
    experienceYears: 22,
    salary: 11000,
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    address: "12 Executive Row, Knowledge City, NY",
    assignedClasses: [],
    assignedSubjects: ["Educational Ethics"],
    documents: [
      { id: "DOC-101", title: "Ph.D Degree Certificate.pdf", type: "Educational Certificates", fileUrl: "#", uploadedDate: "2015-08-01" },
      { id: "DOC-102", title: "Aadhaar Card Copy.pdf", type: "Aadhaar Card", fileUrl: "#", uploadedDate: "2015-08-01" }
    ],
    bankDetails: {
      accountHolderName: "Eleanor Vance",
      accountNumber: "991204812301",
      bankName: "Chase Bank",
      branch: "Knowledge City Main",
      ifscCode: "CHAS009912",
      upiId: "eleanor@chase"
    },
    leaveBalance: { casual: 10, sick: 12, paid: 20 }
  },
  {
    id: "STF-002",
    empId: "EMP002",
    employeeCategory: "Teacher",
    firstName: "Jonathan",
    lastName: "Miller",
    designation: "Senior Teacher",
    department: "Mathematics",
    email: "j.miller@stxaviers.edu",
    phone: "+1 555-888-002",
    gender: "Male",
    dob: "20/06/1984",
    joiningDate: "2018-06-15",
    qualification: "M.Sc. Mathematics, B.Ed.",
    experienceYears: 14,
    salary: 7500,
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    address: "78 Faculty Quarters, Knowledge City, NY",
    assignedClasses: ["Class 10-A", "Class 11-B"],
    assignedSubjects: ["Mathematics"],
    documents: [
      { id: "DOC-103", title: "M.Sc Degree Certificate.pdf", type: "Educational Certificates", fileUrl: "#", uploadedDate: "2018-06-15" }
    ],
    bankDetails: {
      accountHolderName: "Jonathan Miller",
      accountNumber: "442100918234",
      bankName: "Bank of America",
      branch: "Downtown NY",
      ifscCode: "BOFA004421"
    },
    leaveBalance: { casual: 8, sick: 10, paid: 15 }
  }
];

export const initialAdmissions: AdmissionApplication[] = [
  {
    id: "APP-2026-001",
    applicationNo: "REG-9081",
    applicantName: "Ethan Hunt",
    appliedClass: "Class 10",
    gender: "Male",
    dob: "15/08/2012",
    bloodGroup: "O+",
    religion: "General",
    casteCategory: "General",
    parentName: "Tom Hunt",
    motherName: "Jane Hunt",
    email: "tom.hunt@gmail.com",
    phone: "9876543214",
    addressHouseNo: "99",
    addressStreet: "Mission Way",
    addressArea: "Knowledge Hub",
    addressCity: "New York",
    addressDistrict: "Knowledge City",
    addressState: "NY",
    addressPinCode: "10001",
    siblingsCount: 0,
    studentType: "Day Scholar",
    transportRequired: true,
    transportType: "AC",
    busRoute: "Route A - North Suburbs",
    pickupPoint: "North Suburbs Stop 4",
    dropPoint: "Academy Main Gate",
    branch: "Main Campus",
    submissionDate: "2026-07-01",
    status: "Pending",
    documentsSubmitted: ["Birth Certificate", "Previous Report Card"]
  }
];

export const initialBuses: Bus[] = [
  { id: "BUS-01", busNumber: "BUS-101", registrationNumber: "NY-99-AB-1001", routeName: "Route A - North Suburbs", driverName: "Michael Scott", driverPhone: "+1 555-333-111", capacity: 40, type: "AC", status: "Active" },
  { id: "BUS-02", busNumber: "BUS-102", registrationNumber: "NY-99-AB-1002", routeName: "Route B - East Downtown", driverName: "Jim Halpert", driverPhone: "+1 555-333-222", capacity: 45, type: "Non-AC", status: "Active" }
];

export const initialFeeStructures: FeeStructure[] = [
  {
    id: "FEE-CL10",
    academicYear: "2025-2026",
    className: "Class 10",
    term: "Quarterly",
    tuitionFee: 2500,
    transportFee: 300,
    hostelFee: 0,
    uniformFee: 200,
    booksFee: 300,
    labFee: 400,
    miscFee: 100,
    dueDate: "2026-08-15"
  }
];

export const initialFeePayments: FeePayment[] = [
  {
    id: "PAY-901",
    receiptNo: "REC-2026-0891",
    studentId: "STU-001",
    studentName: "Alexander Wright",
    className: "Class 10-A",
    amountPaid: 3800,
    discount: 0,
    fine: 0,
    paymentMode: "Online",
    transactionId: "TXN-88129031",
    paymentDate: "2026-06-15",
    status: "Paid"
  }
];

export const initialExamSetups: ExamSetup[] = [
  { id: "EXM-01", name: "Mid-Term Examination 2026", academicYear: "2025-2026", className: "Class 10", startDate: "2026-09-10", endDate: "2026-09-22", status: "Scheduled" }
];

export const initialExamMarks: ExamMark[] = [
  { id: "M1", examId: "EXM-01", studentId: "STU-001", subject: "Mathematics", marksObtained: 95, totalMarks: 100, grade: "A+" }
];

export const initialTimetable: TimetableSlot[] = [
  { id: "TT-01", day: "Monday", timeSlot: "08:30 AM - 09:15 AM", className: "Class 10", section: "A", subject: "Mathematics", teacherName: "Jonathan Miller", roomNo: "Room 101" }
];

export const initialHomework: Homework[] = [
  {
    id: "HW-101",
    title: "Quadratic Equations Problem Set",
    className: "Class 10",
    section: "A",
    subject: "Mathematics",
    teacherName: "Jonathan Miller",
    assignedDate: "2026-07-18",
    dueDate: "2026-07-22",
    description: "Complete Problems 1 to 25 from Chapter 4 in the textbook.",
    totalSubmissions: 24,
    attachments: [{ id: "ATT-1", name: "Chapter4_Guide.pdf", url: "#", type: "PDF" }]
  }
];

export const initialHostelBlocks: HostelBlock[] = [
  { id: "BLK-A", name: "Block A (Boys)", wardenName: "Arthur Pendelton", wardenPhone: "+1 555-777-101" },
  { id: "BLK-B", name: "Block B (Girls)", wardenName: "Beatrice Thorne", wardenPhone: "+1 555-777-201" }
];

export const initialHostelRooms: HostelRoom[] = [
  { id: "RM-101", blockId: "BLK-A", roomNo: "101", capacity: 4, occupied: 3, feePerTerm: 1200 },
  { id: "RM-201", blockId: "BLK-B", roomNo: "201", capacity: 2, occupied: 2, feePerTerm: 1500 }
];

export const initialHostelBeds: HostelBed[] = [
  { id: "BED-101-A", roomId: "RM-101", bedNo: "Bed 1", status: "Occupied", studentName: "Alexander Wright" },
  { id: "BED-101-B", roomId: "RM-101", bedNo: "Bed 2", status: "Available" }
];

export const initialUniforms: UniformItem[] = [
  { id: "UNI-01", category: "Summer Polo Shirt", gender: "Unisex", className: "Class 10", size: "M", color: "Navy Blue", price: 35, availableStock: 120 },
  { id: "UNI-02", category: "Winter Blazer", gender: "Male", className: "Class 10", size: "L", color: "Dark Charcoal", price: 85, availableStock: 45 }
];

export const initialBooks: BookItem[] = [
  { id: "BK-01", isbn: "978-0134685991", title: "Fundamentals of Physics", author: "Halliday & Resnick", category: "Science", totalCopies: 15, availableCopies: 11, rackNo: "Rack S-04" }
];

export const initialBookIssues: BookIssue[] = [
  { id: "ISS-501", bookId: "BK-01", bookTitle: "Fundamentals of Physics", borrowerId: "STU-001", borrowerName: "Alexander Wright", borrowerRole: "Student", issueDate: "2026-07-05", dueDate: "2026-07-19", fineAmount: 2.00, status: "Overdue" }
];

export const initialTransportRoutes: TransportRoute[] = [
  {
    id: "TR-01",
    routeName: "Route A - North Suburbs",
    routeCode: "R-NORTH",
    vehicleNo: "BUS-101",
    vehicleNumber: "NY-99-AB-1001",
    vehicleName: "Tata Starbus AC 40-Seater",
    driverName: "Michael Scott",
    driverPhone: "+1 555-333-111",
    driverMobile: "+1 555-333-111",
    pickupPoint: "North Suburbs Stop 4",
    dropPoint: "Academy Main Gate",
    distanceKm: 12.5,
    fareMonthly: 150,
    monthlyFee: 1800,
    quarterlyFee: 5000,
    halfYearlyFee: 9500,
    annualFee: 18000,
    capacity: 40,
    assignedStudentsCount: 38,
    status: "Active"
  }
];

export const initialInventory: InventoryItem[] = [
  { id: "INV-01", itemName: "Dell Core i7 Lab PCs", category: "Lab Equipment", quantity: 35, unitPrice: 850, location: "Computer Lab 1", supplier: "TechCorp Logistics", status: "In Stock" }
];

export const initialAnnouncements: Announcement[] = [
  { id: "ANC-01", title: "Annual Sports Meet Registration Open", content: "Submit entries to PE department before August 5th.", targetAudience: "All", date: "2026-07-20", author: "PE Department", category: "Sports" }
];

export const initialHolidays: Holiday[] = [
  { id: "HOL-01", name: "Independence Holiday", startDate: "2026-07-04", endDate: "2026-07-04", type: "Gazetted" }
];

export const initialBirthdays: Birthday[] = [
  { id: "BD-01", name: "Alexander Wright", role: "Student", className: "Class 10-A", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80", dob: "Today" }
];

export const initialAuditLogs: AuditLog[] = [
  { id: "LOG-01", timestamp: "2026-07-21 10:30", userName: "Admin User", userRole: "Admin", action: "System Initialized", details: "Portal initialized with Phase 2 data models", ipAddress: "192.168.1.1" }
];

export const initialCustomRoles: CustomRole[] = [
  {
    id: "ROLE-ADMIN",
    name: "Admin",
    description: "Full system administration and oversight",
    permissions: {}
  },
  {
    id: "ROLE-TEACHER",
    name: "Teacher",
    description: "Academic marking, homework posting, and class attendance",
    permissions: {}
  }
];

export const initialSubjects: SubjectItem[] = [
  { id: 'SUB-101', subjectId: 'SUB-101', name: 'Mathematics', code: 'MTH-101', department: 'Mathematics' },
  { id: 'SUB-102', subjectId: 'SUB-102', name: 'Physics', code: 'PHY-102', department: 'Science' },
  { id: 'SUB-103', subjectId: 'SUB-103', name: 'Chemistry', code: 'CHM-103', department: 'Science' },
  { id: 'SUB-104', subjectId: 'SUB-104', name: 'Biology', code: 'BIO-104', department: 'Science' },
  { id: 'SUB-105', subjectId: 'SUB-105', name: 'English', code: 'ENG-105', department: 'Languages' },
  { id: 'SUB-106', subjectId: 'SUB-106', name: 'Computer Science', code: 'CS-106', department: 'Technology' },
  { id: 'SUB-107', subjectId: 'SUB-107', name: 'History', code: 'HIS-107', department: 'Social Studies' },
  { id: 'SUB-108', subjectId: 'SUB-108', name: 'Economics', code: 'ECO-108', department: 'Humanities' },
  { id: 'SUB-109', subjectId: 'SUB-109', name: 'Accountancy', code: 'ACC-109', department: 'Commerce' }
];

export const initialFeeHeads: FeeHead[] = [
  { id: 'FH-001', name: 'Tuition Fee', code: 'TUIT-101', category: 'Tuition', frequency: 'Quarterly', mandatory: true, applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 1, status: 'Active' },
  { id: 'FH-002', name: 'Admission Fee', code: 'ADM-102', category: 'Admission', frequency: 'One Time', mandatory: true, applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 2, status: 'Active' },
  { id: 'FH-003', name: 'Textbook & Material Fee', code: 'BKS-103', category: 'Books', frequency: 'Annual', mandatory: true, applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 3, status: 'Active' },
  { id: 'FH-004', name: 'Uniform & Accessories', code: 'UNF-104', category: 'Uniform', frequency: 'Annual', mandatory: false, applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 4, status: 'Active' },
  { id: 'FH-005', name: 'Science & Lab Fee', code: 'LAB-105', category: 'Lab', frequency: 'Quarterly', mandatory: false, applicableClasses: ['Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 5, status: 'Active' },
  { id: 'FH-006', name: 'Computer Lab & Tech Fee', code: 'CMP-106', category: 'Computer', frequency: 'Quarterly', mandatory: false, applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 6, status: 'Active' },
  { id: 'FH-007', name: 'Sports & Athletic Fee', code: 'SPT-107', category: 'Sports', frequency: 'Annual', mandatory: false, applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'], applicableBranches: ['Main Campus'], displayOrder: 7, status: 'Active' }
];

export const initialDynamicFeeStructures: DynamicFeeStructure[] = [
  {
    id: 'DFS-CL10',
    academicYear: '2025-2026',
    branch: 'Main Campus',
    className: 'Class 10',
    section: 'A',
    studentCategory: 'General',
    items: [
      { feeHeadId: 'FH-001', feeHeadName: 'Tuition Fee', amount: 25000 },
      { feeHeadId: 'FH-003', feeHeadName: 'Textbook & Material Fee', amount: 5000 },
      { feeHeadId: 'FH-004', feeHeadName: 'Uniform & Accessories', amount: 3000 },
      { feeHeadId: 'FH-005', feeHeadName: 'Science & Lab Fee', amount: 2000 },
      { feeHeadId: 'FH-007', feeHeadName: 'Sports & Athletic Fee', amount: 1500 }
    ],
    totalAmount: 36500,
    status: 'Active'
  }
];

export const initialStudentFeeAssignments: StudentFeeAssignment[] = [
  {
    id: 'SFA-001',
    studentId: 'STU-001',
    studentName: 'Alexander Wright',
    admissionNo: 'ADM-2024-001',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    className: 'Class 10',
    section: 'A',
    feeStructureId: 'DFS-CL10',
    assignedFeeHeads: [
      { feeHeadId: 'FH-001', feeHeadName: 'Tuition Fee', amount: 25000 },
      { feeHeadId: 'FH-003', feeHeadName: 'Textbook & Material Fee', amount: 5000 },
      { feeHeadId: 'FH-004', feeHeadName: 'Uniform & Accessories', amount: 3000 },
      { feeHeadId: 'FH-005', feeHeadName: 'Science & Lab Fee', amount: 2000 },
      { feeHeadId: 'FH-007', feeHeadName: 'Sports & Athletic Fee', amount: 1500 }
    ],
    baseFeeTotal: 36500,
    assignedDate: '2026-06-01',
    status: 'Active'
  }
];

export const initialScholarships: Scholarship[] = [
  {
    id: 'SCH-01',
    name: 'Academic Merit Scholarship',
    code: 'MERIT-10',
    type: 'Merit',
    discountType: 'Percentage',
    percentage: 15,
    applicableFeeHeadIds: ['FH-001'],
    applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    eligibility: 'GPA >= 3.8 in previous academic session',
    description: '15% waiver on Tuition Fee for top academic achievers',
    status: 'Active'
  },
  {
    id: 'SCH-02',
    name: 'Staff Child Educational Concession',
    code: 'STAFF-CHILD',
    type: 'Staff Child',
    discountType: 'Percentage',
    percentage: 25,
    applicableFeeHeadIds: ['FH-001', 'FH-003'],
    applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    eligibility: 'Children of full-time faculty and staff members',
    description: '25% concession on tuition and books for staff dependents',
    status: 'Active'
  }
];

export const initialStudentScholarships: StudentScholarship[] = [];

export const initialDiscounts: Discount[] = [
  { id: 'DSC-01', name: 'Sibling Concession', code: 'SIBLING-01', type: 'Sibling Discount', mode: 'Percentage', value: 10, description: 'Applicable for students having siblings studying in the same school.', status: 'Active' },
  { id: 'DSC-02', name: 'Early Payment Grant', code: 'EARLY-PAY', type: 'Early Payment Discount', mode: 'Fixed Amount', value: 1000, description: 'Early payment grant concession for fees settled before due date', status: 'Active' }
];

export const initialStudentDiscounts: StudentDiscount[] = [];

export const initialFineRules: FineRule[] = [
  {
    id: 'FR-01',
    ruleName: 'Standard Monthly Late Fine Rule',
    dueDate: '2026-08-15',
    graceDays: 5,
    fineType: 'Daily Fine',
    dailyFine: 50,
    fixedFine: 200,
    maximumFine: 1500,
    status: 'Active'
  }
];

export const initialERPTransportRoutes: ERPTransportRoute[] = [
  {
    id: 'TRP-01',
    routeName: 'Route A - North Suburbs Express',
    routeCode: 'R-NORTH',
    vehicleNumber: 'NY-99-AB-1001',
    vehicleName: 'Tata Starbus AC 40-Seater',
    driverName: 'Michael Scott',
    driverMobile: '+1 555-333-111',
    pickupPoint: 'North Suburbs Stop 4',
    dropPoint: 'Academy Main Gate',
    distanceKm: 12.5,
    monthlyFee: 1800,
    quarterlyFee: 5000,
    halfYearlyFee: 9500,
    annualFee: 18000,
    status: 'Active'
  },
  {
    id: 'TRP-02',
    routeName: 'Route B - East Downtown Loop',
    routeCode: 'R-EAST',
    vehicleNumber: 'NY-99-AB-1002',
    vehicleName: 'Ashok Leyland 45-Seater',
    driverName: 'Jim Halpert',
    driverMobile: '+1 555-333-222',
    pickupPoint: 'Downtown Central Square',
    dropPoint: 'Academy Main Gate',
    distanceKm: 8.0,
    monthlyFee: 1500,
    quarterlyFee: 4200,
    halfYearlyFee: 8000,
    annualFee: 15000,
    status: 'Active'
  }
];

export const initialStudentTransports: StudentTransport[] = [];

export const initialStudentHostels: StudentHostel[] = [];

export const initialRefunds: Refund[] = [
  {
    id: 'RFD-01',
    refundNo: 'RF-2026-001',
    receiptNo: 'REC-2026-0891',
    studentId: 'STU-001',
    studentName: 'Alexander Wright',
    amount: 1000,
    reason: 'Scholarship Adjustment',
    approvedBy: 'Dr. Eleanor Vance (Principal)',
    refundMode: 'Bank Transfer',
    refundDate: '2026-07-10',
    remarks: 'Approved post merit list publication adjustment',
    status: 'Approved'
  }
];

export const initialFinanceSettings: FinanceSettings = {
  academicYear: '2025-2026',
  defaultCurrency: 'INR',
  receiptFormat: 'Standard GST Format',
  lateFeeRuleId: 'FR-01',
  receiptPrefix: 'REC-2026-',
  invoicePrefix: 'INV-2026-',
  paymentModes: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online Gateway'],
  financialYear: '2025-2026',
  autoReceiptNo: true,
  taxSettings: {
    enabled: false,
    taxName: 'GST',
    percentage: 0
  }
};

export const initialRouteMasters: RouteMaster[] = [
  {
    id: 'RM-01',
    routeCode: 'R-NORTH-101',
    routeName: 'Route A - North Suburbs Express',
    routeStart: 'North Suburbs Stop 1',
    routeEnd: 'St. Xavier Main Gate',
    totalDistanceKm: 18.5,
    estimatedTimeMinutes: 45,
    description: 'Covers North Suburbs Stops 1 to 5',
    status: 'Active'
  },
  {
    id: 'RM-02',
    routeCode: 'R-EAST-102',
    routeName: 'Route B - East Downtown Loop',
    routeStart: 'Downtown Central Square',
    routeEnd: 'St. Xavier Main Gate',
    totalDistanceKm: 12.0,
    estimatedTimeMinutes: 30,
    description: 'Serves Eastern Metro Corridor',
    status: 'Active'
  }
];

export const initialPickupPoints: PickupPoint[] = [
  {
    id: 'PP-01',
    routeId: 'RM-01',
    routeName: 'Route A - North Suburbs Express',
    pickupName: 'Miyapur Junction',
    sequenceNumber: 1,
    arrivalTime: '07:15 AM',
    distanceFromSchoolKm: 18.5,
    monthlyFee: 2000,
    quarterlyFee: 5500,
    halfYearlyFee: 10000,
    annualFee: 19000,
    status: 'Active'
  },
  {
    id: 'PP-02',
    routeId: 'RM-01',
    routeName: 'Route A - North Suburbs Express',
    pickupName: 'KPHB Colony Stop 3',
    sequenceNumber: 2,
    arrivalTime: '07:25 AM',
    distanceFromSchoolKm: 14.0,
    monthlyFee: 1800,
    quarterlyFee: 5000,
    halfYearlyFee: 9500,
    annualFee: 18000,
    status: 'Active'
  },
  {
    id: 'PP-03',
    routeId: 'RM-01',
    routeName: 'Route A - North Suburbs Express',
    pickupName: 'JNTU Metro Gate',
    sequenceNumber: 3,
    arrivalTime: '07:35 AM',
    distanceFromSchoolKm: 10.0,
    monthlyFee: 1500,
    quarterlyFee: 4200,
    halfYearlyFee: 8000,
    annualFee: 15000,
    status: 'Active'
  },
  {
    id: 'PP-04',
    routeId: 'RM-02',
    routeName: 'Route B - East Downtown Loop',
    pickupName: 'Downtown Central Square',
    sequenceNumber: 1,
    arrivalTime: '07:30 AM',
    distanceFromSchoolKm: 12.0,
    monthlyFee: 1600,
    quarterlyFee: 4500,
    halfYearlyFee: 8500,
    annualFee: 16000,
    status: 'Active'
  }
];

export const initialVehicleMasters: VehicleMaster[] = [
  {
    id: 'VM-01',
    vehicleNumber: 'BUS-101',
    registrationNumber: 'NY-99-AB-1001',
    vehicleType: 'Bus',
    capacity: 40,
    isAC: true,
    chassisNumber: 'CH-98234-X1',
    engineNumber: 'ENG-88123-B',
    insuranceExpiry: '2026-12-31',
    pollutionExpiry: '2026-11-30',
    fitnessExpiry: '2027-03-31',
    gpsDeviceId: 'GPS-DEV-9001',
    status: 'Active'
  },
  {
    id: 'VM-02',
    vehicleNumber: 'VAN-102',
    registrationNumber: 'NY-99-AB-1002',
    vehicleType: 'Van',
    capacity: 18,
    isAC: true,
    chassisNumber: 'CH-77412-Y2',
    engineNumber: 'ENG-55311-V',
    insuranceExpiry: '2026-10-15',
    pollutionExpiry: '2026-09-30',
    fitnessExpiry: '2027-01-31',
    gpsDeviceId: 'GPS-DEV-9002',
    status: 'Active'
  }
];

export const initialDriverMasters: DriverMaster[] = [
  {
    id: 'DRV-01',
    driverName: 'Michael Scott',
    mobileNumber: '+1 555-333-111',
    licenseNumber: 'DL-NY-2020-99123',
    licenseExpiryDate: '2028-05-20',
    address: '42 Scranton Way, NY',
    emergencyContact: '+1 555-333-999',
    experienceYears: 12,
    status: 'Active'
  },
  {
    id: 'DRV-02',
    driverName: 'Jim Halpert',
    mobileNumber: '+1 555-333-222',
    licenseNumber: 'DL-NY-2021-88412',
    licenseExpiryDate: '2029-08-15',
    address: '88 Park Avenue, NY',
    emergencyContact: '+1 555-333-888',
    experienceYears: 8,
    status: 'Active'
  }
];

export const initialVehicleAssignments: VehicleAssignment[] = [
  {
    id: 'VA-01',
    vehicleId: 'VM-01',
    vehicleNumber: 'BUS-101',
    routeId: 'RM-01',
    routeName: 'Route A - North Suburbs Express',
    driverId: 'DRV-01',
    driverName: 'Michael Scott',
    effectiveFrom: '2026-06-01',
    status: 'Active'
  },
  {
    id: 'VA-02',
    vehicleId: 'VM-02',
    vehicleNumber: 'VAN-102',
    routeId: 'RM-02',
    routeName: 'Route B - East Downtown Loop',
    driverId: 'DRV-02',
    driverName: 'Jim Halpert',
    effectiveFrom: '2026-06-01',
    status: 'Active'
  }
];

export const initialVehicleMaintenances: VehicleMaintenance[] = [
  {
    id: 'VMN-01',
    vehicleId: 'VM-01',
    vehicleNumber: 'BUS-101',
    serviceDate: '2026-07-01',
    serviceType: 'Regular Engine Service & Brake Check',
    vendor: 'City Auto Tech Ltd',
    cost: 4500,
    nextServiceDue: '2026-10-01',
    remarks: 'Oil changed, brake pads replaced',
    status: 'Completed'
  }
];

export const initialFinanceTransportConfigs: FinanceTransportConfig[] = [
  {
    id: 'FTC-01',
    routeId: 'RM-01',
    routeName: 'Route A - North Suburbs Express',
    vehicleId: 'VM-01',
    vehicleNumber: 'BUS-101',
    driverId: 'DRV-01',
    driverName: 'Michael Scott',
    pickupPointId: 'PP-01',
    pickupName: 'Miyapur Junction',
    feePlan: 'Quarterly',
    feeAmount: 5500,
    effectiveFrom: '2026-06-01',
    status: 'Active'
  },
  {
    id: 'FTC-02',
    routeId: 'RM-01',
    routeName: 'Route A - North Suburbs Express',
    vehicleId: 'VM-01',
    vehicleNumber: 'BUS-101',
    driverId: 'DRV-01',
    driverName: 'Michael Scott',
    pickupPointId: 'PP-02',
    pickupName: 'KPHB Colony Stop 3',
    feePlan: 'Quarterly',
    feeAmount: 5000,
    effectiveFrom: '2026-06-01',
    status: 'Active'
  },
  {
    id: 'FTC-03',
    routeId: 'RM-02',
    routeName: 'Route B - East Downtown Loop',
    vehicleId: 'VM-02',
    vehicleNumber: 'VAN-102',
    driverId: 'DRV-02',
    driverName: 'Jim Halpert',
    pickupPointId: 'PP-04',
    pickupName: 'Downtown Central Square',
    feePlan: 'Quarterly',
    feeAmount: 4500,
    effectiveFrom: '2026-06-01',
    status: 'Active'
  }
];

export const initialStudentFeeLedgers: StudentFeeLedger[] = [
  {
    id: 'LED-001',
    studentId: 'STU-001',
    studentName: 'Alexander Wright',
    admissionNo: 'ADM2024-001',
    className: 'Class 10',
    section: 'A',
    studentType: 'Day Scholar',
    academicYear: '2025-2026',
    feeItems: [
      { headId: 'FH-01', headName: 'Tuition Fee', category: 'Tuition Fee', originalAmount: 25000, scholarshipDeduction: 2000, discountDeduction: 1000, fineAmount: 0, finalAmount: 22000, isApplicable: true, status: 'Paid' },
      { headId: 'FH-02', headName: 'Admission Fee', category: 'Admission Fee', originalAmount: 5000, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 5000, isApplicable: true, status: 'Paid' },
      { headId: 'FH-03', headName: 'Books & Stationery Fee', category: 'Books Fee', originalAmount: 4500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 4500, isApplicable: true, status: 'Paid' },
      { headId: 'FH-04', headName: 'Uniform & Sports Kit Fee', category: 'Uniform Fee', originalAmount: 3500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 3500, isApplicable: true, status: 'Paid' },
      { headId: 'FH-05', headName: 'Science & Computer Lab Fee', category: 'Lab Fee', originalAmount: 2500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 2500, isApplicable: true, status: 'Pending' },
      { headId: 'FH-TRP', headName: 'Transport Fee (Route A)', category: 'Transport Fee', originalAmount: 5500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 5500, isApplicable: true, status: 'Pending' },
      { headId: 'FH-HST', headName: 'Hostel Fee', category: 'Hostel Fee', originalAmount: 0, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 0, isApplicable: false, status: 'Pending', remarks: 'Not Applicable for Day Scholars' }
    ],
    totalOriginalAmount: 46000,
    grossAmount: 46000,
    totalScholarship: 2000,
    totalDiscount: 1000,
    totalFine: 0,
    totalPayable: 43000,
    paidAmount: 35000,
    dueBalance: 8000,
    createdAt: '2026-06-01',
    updatedAt: '2026-07-21',
    scholarshipAmount: 2000,
    discountAmount: 1000,
    fineAmount: 0,
    previousDue: 0
  }
];

export const initialHostelMasters: HostelMaster[] = [
  {
    id: 'HM-01',
    hostelName: 'Boys Central Hostel Block A',
    hostelCode: 'HST-BOYS-A',
    hostelType: 'Boys',
    wardenName: 'Arthur Pendelton',
    wardenMobile: '9876543210',
    wardenAlternateMobile: '9876543219',
    wardenEmail: 'arthur.p@school.edu',
    address: 'Campus North Wing, Gate 3',
    description: 'Main residential block for senior male students with AC & study lounge',
    status: 'Active'
  },
  {
    id: 'HM-02',
    hostelName: 'Girls Excellence Residence Block B',
    hostelCode: 'HST-GIRLS-B',
    hostelType: 'Girls',
    wardenName: 'Eleanor Vance',
    wardenMobile: '9876543211',
    wardenAlternateMobile: '9876543218',
    wardenEmail: 'eleanor.v@school.edu',
    address: 'Campus South Garden Wing',
    description: 'Premier hostel facility for female students with 24/7 security & indoor gym',
    status: 'Active'
  }
];

export const initialRoomTypeMasters: RoomTypeMaster[] = [
  { id: 'RT-01', roomTypeName: 'Single Sharing', capacity: 1, acType: 'AC', description: 'Private AC room with attached bath', status: 'Active' },
  { id: 'RT-02', roomTypeName: 'Double Sharing', capacity: 2, acType: 'AC', description: 'Two bed room with dual study desks', status: 'Active' },
  { id: 'RT-03', roomTypeName: 'Triple Sharing', capacity: 3, acType: 'Non-AC', description: 'Three bed room with shared amenities', status: 'Active' },
  { id: 'RT-04', roomTypeName: 'Four Sharing', capacity: 4, acType: 'Non-AC', description: 'Four bed student room with lockers', status: 'Active' },
  { id: 'RT-05', roomTypeName: 'Dormitory', capacity: 8, acType: 'Non-AC', description: 'Spacious dormitory hall for sports teams', status: 'Active' }
];

export const initialRoomMasters: RoomMaster[] = [
  { id: 'RM-101', hostelId: 'HM-01', hostelName: 'Boys Central Hostel Block A', floor: '1st Floor', roomNumber: '101', roomTypeId: 'RT-02', roomTypeName: 'Double Sharing', capacity: 2, status: 'Active' },
  { id: 'RM-102', hostelId: 'HM-01', hostelName: 'Boys Central Hostel Block A', floor: '1st Floor', roomNumber: '102', roomTypeId: 'RT-03', roomTypeName: 'Triple Sharing', capacity: 3, status: 'Active' },
  { id: 'RM-201', hostelId: 'HM-02', hostelName: 'Girls Excellence Residence Block B', floor: '2nd Floor', roomNumber: '201', roomTypeId: 'RT-01', roomTypeName: 'Single Sharing', capacity: 1, status: 'Active' },
  { id: 'RM-202', hostelId: 'HM-02', hostelName: 'Girls Excellence Residence Block B', floor: '2nd Floor', roomNumber: '202', roomTypeId: 'RT-02', roomTypeName: 'Double Sharing', capacity: 2, status: 'Active' }
];

export const initialStudentHostelAssignments: StudentHostelAssignment[] = [
  {
    id: 'SHA-01',
    studentId: 'STU-002',
    studentName: 'Sophia Montgomery',
    admissionNo: 'ADM2024-002',
    hostelId: 'HM-02',
    hostelName: 'Girls Excellence Residence Block B',
    roomId: 'RM-201',
    roomNo: '201',
    bedNo: 'BED-1',
    joiningDate: '2026-06-01',
    status: 'Active'
  }
];

export const initialHostelVisitorLogs: any[] = [];

export const initialHostelAttendanceLogs: HostelAttendanceLog[] = [
  {
    id: 'HAL-01',
    studentId: 'STU-002',
    studentName: 'Sophia Montgomery',
    hostelId: 'HM-02',
    hostelName: 'Girls Excellence Residence Block B',
    roomNo: '201',
    date: '2026-07-21',
    status: 'Present',
    remarks: 'Night Roll Call Verified'
  }
];

export const initialFinanceHostelConfigs: FinanceHostelConfig[] = [
  {
    id: 'FHC-01',
    hostelId: 'HM-01',
    hostelName: 'Boys Central Hostel Block A',
    roomTypeId: 'RT-02',
    roomTypeName: 'Double Sharing',
    feePlan: 'Annual',
    hostelFee: 40000,
    securityDeposit: 5000,
    effectiveFrom: '2026-06-01',
    status: 'Active'
  },
  {
    id: 'FHC-02',
    hostelId: 'HM-02',
    hostelName: 'Girls Excellence Residence Block B',
    roomTypeId: 'RT-01',
    roomTypeName: 'Single Sharing',
    feePlan: 'Annual',
    hostelFee: 50000,
    securityDeposit: 5000,
    effectiveFrom: '2026-06-01',
    status: 'Active'
  }
];

export const initialUniformCategories: UniformCategory[] = [
  { id: 'UC-01', name: 'Shirt', description: 'Regular school uniform shirts' },
  { id: 'UC-02', name: 'Pant', description: 'Regular school uniform trousers' },
  { id: 'UC-03', name: 'Skirt', description: 'Regular school uniform skirts' },
  { id: 'UC-04', name: 'Tie', description: 'School uniform neckties' },
  { id: 'UC-05', name: 'Belt', description: 'School uniform belts' },
  { id: 'UC-06', name: 'Blazer', description: 'Winter uniform blazers' },
  { id: 'UC-07', name: 'Shoes', description: 'Black formal shoes' },
  { id: 'UC-08', name: 'Socks', description: 'School logo socks' },
  { id: 'UC-09', name: 'Sports Uniform', description: 'House wise sports tracksuits' },
  { id: 'UC-10', name: 'Winter Uniform', description: 'Woolen sweaters and jackets' }
];

export const initialUniformSizes: UniformSize[] = [
  { id: 'US-01', sizeName: 'S', chest: '36"', waist: '30"', height: '160cm', ageGroup: '11-13 yrs', gender: 'Unisex' },
  { id: 'US-02', sizeName: 'M', chest: '38"', waist: '32"', height: '170cm', ageGroup: '13-15 yrs', gender: 'Unisex' },
  { id: 'US-03', sizeName: 'L', chest: '40"', waist: '34"', height: '175cm', ageGroup: '15-17 yrs', gender: 'Unisex' },
  { id: 'US-04', sizeName: 'XL', chest: '42"', waist: '36"', height: '180cm', ageGroup: '17+ yrs', gender: 'Unisex' }
];

export const initialUniformSuppliers: UniformSupplier[] = [
  { id: 'SUP-01', supplierName: 'Apex Apparel Group', contactPerson: 'John Miller', mobile: '9876543210', email: 'apex@apparel.com', gstNumber: '29AAAAA1111A1Z1', address: '12 Industrial Area, Phase 1, New Delhi', status: 'Active' },
  { id: 'SUP-02', supplierName: 'Elite Uniforms Ltd', contactPerson: 'Sarah Davis', mobile: '8765432109', email: 'sales@eliteuniforms.com', gstNumber: '29BBBBB2222B2Z2', address: '45 Textile Hub, Surat, Gujarat', status: 'Active' }
];

export const initialUniformInventory: UniformInventoryItem[] = [
  { id: 'UINV-01', itemId: 'UNI-01', itemName: 'Summer Polo Shirt', category: 'Shirt', size: 'M', openingStock: 200, currentStock: 120, minimumStock: 30, reorderLevel: 50, status: 'In Stock' },
  { id: 'UINV-02', itemId: 'UNI-02', itemName: 'Winter Blazer', category: 'Blazer', size: 'L', openingStock: 50, currentStock: 45, minimumStock: 10, reorderLevel: 15, status: 'In Stock' }
];

export const initialStudentUniformIssues: StudentUniformIssue[] = [
  { id: 'UIS-01', studentId: 'STU-001', studentName: 'Alexander Wright', admissionNo: 'ADM-2026-000', className: 'Class 10', section: 'A', itemId: 'UNI-01', itemName: 'Summer Polo Shirt', size: 'M', quantity: 2, issueDate: '2026-06-15', status: 'Issued', academicYear: '2025-2026' }
];

export const initialFinanceUniformConfigs: FinanceUniformConfig[] = [
  {
    id: 'FUC-01',
    academicYear: '2025-2026',
    branch: 'Main Campus',
    className: 'Class 10',
    gender: 'Unisex',
    uniformPackage: 'Full Kit',
    feePlan: 'Annual',
    feeAmount: 3500,
    effectiveFrom: '2026-06-01',
    status: 'Active'
  }
];

export const initialLeaveTypes: LeaveType[] = [
  { id: 'LT-01', name: 'Casual Leave', code: 'CL', annualAllowance: 10, carryForward: false, maxConsecutiveDays: 3, requiresAttachment: false, isPaid: true, status: 'Active' },
  { id: 'LT-02', name: 'Sick Leave', code: 'SL', annualAllowance: 12, carryForward: true, maxConsecutiveDays: 5, requiresAttachment: true, isPaid: true, status: 'Active' },
  { id: 'LT-03', name: 'Earned Leave', code: 'EL', annualAllowance: 15, carryForward: true, maxConsecutiveDays: 10, requiresAttachment: false, isPaid: true, status: 'Active' },
  { id: 'LT-04', name: 'Maternity Leave', code: 'ML', annualAllowance: 90, carryForward: false, maxConsecutiveDays: 90, requiresAttachment: true, isPaid: true, status: 'Active' },
  { id: 'LT-05', name: 'Paternity Leave', code: 'PL', annualAllowance: 15, carryForward: false, maxConsecutiveDays: 15, requiresAttachment: true, isPaid: true, status: 'Active' },
  { id: 'LT-06', name: 'Loss of Pay', code: 'LOP', annualAllowance: 0, carryForward: false, maxConsecutiveDays: 30, requiresAttachment: false, isPaid: false, status: 'Active' }
];

export const initialLeaveApplications: LeaveApplication[] = [
  {
    id: 'LAP-01',
    employeeId: 'STF-002',
    employeeName: 'Jonathan Miller',
    empId: 'EMP002',
    department: 'Mathematics',
    designation: 'Senior Teacher',
    branch: 'Main Campus',
    employeeCategory: 'Teacher',
    leaveTypeId: 'LT-01',
    leaveTypeName: 'Casual Leave',
    fromDate: '2026-07-28',
    toDate: '2026-07-29',
    isHalfDay: false,
    numberOfDays: 2,
    reason: 'Family function at hometown',
    attachments: [],
    status: 'Pending',
    appliedDate: '2026-07-23'
  }
];

export const initialPayslips: Payslip[] = [];



