import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import {
  Student, Staff, StaffDocument, BankDetails, AdmissionApplication, FeeStructure, FeePayment,
  DailyAttendance, ExamSetup, ExamMark, TimetableSlot, Homework,
  BookItem, BookIssue, TransportRoute, HostelBlock, HostelRoom, HostelBed, Bus, UniformItem,
  CustomRole, InventoryItem, Announcement, Holiday, Birthday, AuditLog, SchoolProfile, PromotionHistoryItem,
  SubjectItem,
  FeeHead, DynamicFeeStructure, StudentFeeAssignment, Scholarship, StudentScholarship,
  Discount, StudentDiscount, FineRule, TransportRoute as ERPTransportRoute, StudentTransport,
  HostelMaster, StudentHostel, Refund, FinanceSettings, FeeStructureItem,
  RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, VehicleMaintenance,
  FinanceTransportConfig, StudentFeeLedger, LedgerFeeItem,
  RoomTypeMaster, RoomMaster, StudentHostelAssignment, HostelVisitorLog, HostelAttendanceLog, FinanceHostelConfig
} from '../types';
import {
  initialStudents, initialStaff, initialAdmissions, initialFeeStructures,
  initialFeePayments, initialExamSetups, initialExamMarks, initialTimetable,
  initialHomework, initialBooks, initialBookIssues, initialTransportRoutes,
  initialHostelBlocks, initialHostelRooms, initialHostelBeds, initialBuses,
  initialUniforms, initialCustomRoles, initialInventory, initialAnnouncements,
  initialHolidays, initialBirthdays, initialAuditLogs, initialSchoolProfile,
  initialSubjects,
  initialFeeHeads, initialDynamicFeeStructures, initialStudentFeeAssignments,
  initialScholarships, initialStudentScholarships, initialDiscounts, initialStudentDiscounts,
  initialFineRules, initialERPTransportRoutes, initialStudentTransports, initialHostelMasters,
  initialStudentHostels, initialRefunds, initialFinanceSettings,
  initialRouteMasters, initialPickupPoints, initialVehicleMasters, initialDriverMasters,
  initialVehicleAssignments, initialVehicleMaintenances,
  initialFinanceTransportConfigs, initialStudentFeeLedgers,
  initialRoomTypeMasters, initialRoomMasters, initialStudentHostelAssignments,
  initialHostelVisitorLogs, initialHostelAttendanceLogs, initialFinanceHostelConfigs
} from '../services/mockData';

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

  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  promoteStudent: (id: string, targetClass: string, targetSection?: string, targetYear?: string, targetBranch?: string) => void;
  transferStudent: (id: string, reason: string) => void;

  staff: Staff[];
  addStaff: (staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addStaffDocument: (staffId: string, doc: Omit<StaffDocument, 'id'>) => void;
  deleteStaffDocument: (staffId: string, docId: string) => void;
  updateBankDetails: (staffId: string, bankDetails: BankDetails) => void;

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

  // TRANSPORT ERP MODULE ADDITIONS
  routeMasters: RouteMaster[];
  addRouteMaster: (r: Omit<RouteMaster, 'id'>) => void;
  updateRouteMaster: (id: string, updates: Partial<RouteMaster>) => void;
  deleteRouteMaster: (id: string) => void;

  pickupPoints: PickupPoint[];
  addPickupPoint: (p: Omit<PickupPoint, 'id'>) => void;
  updatePickupPoint: (id: string, updates: Partial<PickupPoint>) => void;
  deletePickupPoint: (id: string) => void;

  vehicleMasters: VehicleMaster[];
  addVehicleMaster: (v: Omit<VehicleMaster, 'id'>) => void;
  updateVehicleMaster: (id: string, updates: Partial<VehicleMaster>) => void;
  deleteVehicleMaster: (id: string) => void;

  driverMasters: DriverMaster[];
  addDriverMaster: (d: Omit<DriverMaster, 'id'>) => void;
  updateDriverMaster: (id: string, updates: Partial<DriverMaster>) => void;
  deleteDriverMaster: (id: string) => void;

  vehicleAssignments: VehicleAssignment[];
  assignVehicleRouteDriver: (va: Omit<VehicleAssignment, 'id'>) => void;
  removeVehicleAssignment: (id: string) => void;

  vehicleMaintenances: VehicleMaintenance[];
  addVehicleMaintenance: (vm: Omit<VehicleMaintenance, 'id'>) => void;
  updateVehicleMaintenance: (id: string, updates: Partial<VehicleMaintenance>) => void;
  deleteVehicleMaintenance: (id: string) => void;

  checkVehicleCapacity: (vehicleId: string) => CapacityCheckResult;

  attendance: DailyAttendance[];
  markAttendance: (records: DailyAttendance[]) => void;

  exams: ExamSetup[];
  examMarks: ExamMark[];
  addExam: (exam: Omit<ExamSetup, 'id'>) => void;
  updateExam: (id: string, updates: Partial<ExamSetup>) => void;
  deleteExam: (id: string) => void;
  saveMarks: (marks: Omit<ExamMark, 'id'>[]) => void;

  timetable: TimetableSlot[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (id: string) => void;

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getStored = <T,>(key: string, initial: T): T => {
    const saved = localStorage.getItem(`edu_db_${key}`);
    return saved ? JSON.parse(saved) : initial;
  };

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => getStored('profile', initialSchoolProfile));
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
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => getStored('timetable', initialTimetable));
  const [homework, setHomework] = useState<Homework[]>(() => getStored('homework', initialHomework));
  const [books, setBooks] = useState<BookItem[]>(() => getStored('books', initialBooks));
  const [bookIssues, setBookIssues] = useState<BookIssue[]>(() => getStored('book_issues', initialBookIssues));
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(() => getStored('transport', initialTransportRoutes));
  const [hostelRooms] = useState<HostelRoom[]>(() => getStored('hostel', initialHostelRooms));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStored('inventory', initialInventory));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStored('announcements', initialAnnouncements));
  const [holidays] = useState<Holiday[]>(() => getStored('holidays', initialHolidays));
  const [birthdays] = useState<Birthday[]>(() => getStored('birthdays', initialBirthdays));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStored('audit_logs', initialAuditLogs));

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

  useEffect(() => { localStorage.setItem('edu_db_profile', JSON.stringify(schoolProfile)); }, [schoolProfile]);
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
  useEffect(() => { localStorage.setItem('edu_db_fee_structures', JSON.stringify(feeStructures)); }, [feeStructures]);
  useEffect(() => { localStorage.setItem('edu_db_fee_payments', JSON.stringify(feePayments)); }, [feePayments]);

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

  // Transport ERP Effects
  useEffect(() => { localStorage.setItem('edu_db_route_masters', JSON.stringify(routeMasters)); }, [routeMasters]);
  useEffect(() => { localStorage.setItem('edu_db_pickup_points', JSON.stringify(pickupPoints)); }, [pickupPoints]);
  useEffect(() => { localStorage.setItem('edu_db_vehicle_masters', JSON.stringify(vehicleMasters)); }, [vehicleMasters]);
  useEffect(() => { localStorage.setItem('edu_db_driver_masters', JSON.stringify(driverMasters)); }, [driverMasters]);
  useEffect(() => { localStorage.setItem('edu_db_vehicle_assignments', JSON.stringify(vehicleAssignments)); }, [vehicleAssignments]);
  useEffect(() => { localStorage.setItem('edu_db_vehicle_maintenances', JSON.stringify(vehicleMaintenances)); }, [vehicleMaintenances]);

  // Finance Transport Config & Ledger Effects
  useEffect(() => { localStorage.setItem('edu_db_finance_transport_configs', JSON.stringify(financeTransportConfigs)); }, [financeTransportConfigs]);
  useEffect(() => { localStorage.setItem('edu_db_student_fee_ledgers', JSON.stringify(studentFeeLedgers)); }, [studentFeeLedgers]);

  const fetchAdmissions = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await fetch('/api/SchoolManagement/admissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Admissions API response status:', res);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
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
          }));
          setAdmissions(mappedAdmissions);
        }
      }
    } catch (err) {
      console.error('Error fetching admissions', err);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

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
      branch: stData.branch || 'Main Campus',
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
  const addStaff = (staffData: Omit<Staff, 'id'>) => {
    const id = 'STF-' + Math.floor(100 + Math.random() * 900);
    const newStaff: Staff = { ...staffData, id };
    setStaff(prev => [...prev, newStaff]);
    logActivity('Hired Staff Member', `Registered ${newStaff.firstName} ${newStaff.lastName}`);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Updated Staff Record', `Updated details for staff ID ${id}`);
  };

  const deleteStaff = (id: string) => {
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
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, bankDetails } : s));
  };

  // Admission CRUD
  const addAdmission = async (appData: Omit<AdmissionApplication, 'id' | 'applicationNo'>) => {
    const token = localStorage.getItem('auth_token');
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
        allocatedBedId: appData.hostelBed || "N/A"
      };

      const res = await fetch('/api/SchoolManagement/admissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        logActivity('New Admission Application', `Received application from ${appData.applicantName}`);
        fetchAdmissions();
      } else {
        console.error("Failed to add admission");
      }
    } catch (err) {
      console.error('Error adding admission', err);
    }
  };

  const updateAdmission = (id: string, updates: Partial<AdmissionApplication>) => {
    setAdmissions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    logActivity('Updated Admission Record', `Updated application ID ${id}`);
  };

  const deleteAdmission = (id: string) => {
    setAdmissions(prev => prev.filter(a => a.id !== id));
    logActivity('Deleted Admission Record', `Removed application ID ${id}`);
  };

  const updateAdmissionStatus = async (id: string, status: AdmissionApplication['status']) => {
    const app = admissions.find(a => a.id === id);
    if (!app) return;

    const registrationNo = (app as any).registrationNo || app.applicationNo;
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`/api/SchoolManagement/admissions/${registrationNo}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
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
            totalFee: 36500,
            paidFee: 0,
            dueFee: 36500,
            attendancePct: 100.0,
            gpa: 4.0
          });

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

        setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        logActivity('Updated Application Status', `Changed application ID ${id} to ${status}`);
        fetchAdmissions();
      }
    } catch (err) {
      console.error('Error updating admission status', err);
    }
  };

  // Academic Classes CRUD
  const addAcademicClass = (clsData: Omit<AcademicClass, 'id'>) => {
    const id = 'CL-' + Math.floor(10 + Math.random() * 90);
    const newCls: AcademicClass = { ...clsData, id };
    setAcademicClasses(prev => [...prev, newCls]);
    logActivity('Created Academic Class', `Added ${newCls.name}`);
  };

  const updateAcademicClass = (id: string, updates: Partial<AcademicClass>) => {
    setAcademicClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logActivity('Updated Academic Class', `Updated class ID ${id}`);
  };

  const deleteAcademicClass = (id: string) => {
    setAcademicClasses(prev => prev.filter(c => c.id !== id));
    logActivity('Deleted Academic Class', `Removed class ID ${id}`);
  };

  // Subjects CRUD
  const addSubject = (subjectData: Omit<SubjectItem, 'id'>) => {
    const id = 'SUB-' + Math.floor(100 + Math.random() * 900);
    const newSub: SubjectItem = {
      ...subjectData,
      id,
      code: subjectData.code || subjectData.subjectId
    };
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
    const newBus: Bus = { ...busData, id };
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

  // Uniform CRUD
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

  // Fee Structures CRUD
  const addFeeStructure = (feeStruct: Omit<FeeStructure, 'id'>) => {
    const id = 'FEE-' + Math.floor(100 + Math.random() * 900);
    const newStruct: FeeStructure = { ...feeStruct, id };
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
    const newPayment: FeePayment = { ...paymentData, id, receiptNo };
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
    return newPayment;
  };

  // ==========================================
  // ERP FINANCE SYSTEM CRUD & ENGINE
  // ==========================================

  // 1. Fee Heads CRUD
  const addFeeHead = (head: Omit<FeeHead, 'id'>) => {
    const id = 'FH-' + Math.floor(100 + Math.random() * 900);
    const newHead: FeeHead = { ...head, id };
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
    const newDfs: DynamicFeeStructure = { ...dfs, id };
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
      branch: st.branch || 'Main Campus',
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
    const newRoute: ERPTransportRoute = { ...route, id };
    setERPTransportRoutes(prev => [...prev, newRoute]);
  };

  const updateERPTransportRoute = (id: string, updates: Partial<ERPTransportRoute>) => {
    setERPTransportRoutes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteERPTransportRoute = (id: string) => {
    setERPTransportRoutes(prev => prev.filter(r => r.id !== id));
  };

  // 8. Student Transport Assignment
  const assignStudentTransport = (st: Omit<StudentTransport, 'id'>) => {
    const id = 'STRP-' + Math.floor(100 + Math.random() * 900);
    const newAssignment: StudentTransport = { ...st, id };
    setStudentTransports(prev => [...prev.filter(t => t.studentId !== st.studentId), newAssignment]);
    logActivity('Assigned Transport', `Assigned route ${st.routeName} to ${st.studentName}`);

    setTimeout(() => recalculateStudentFeeLedger(st.studentId), 50);
  };

  const removeStudentTransport = (id: string) => {
    const target = studentTransports.find(t => t.id === id);
    setStudentTransports(prev => prev.filter(t => t.id !== id));
    if (target) {
      setTimeout(() => recalculateStudentFeeLedger(target.studentId), 50);
    }
  };

  // 9. Hostel Masters CRUD
  const addHostelMaster = (h: Omit<HostelMaster, 'id'>) => {
    const id = 'HM-' + Math.floor(100 + Math.random() * 900);
    const newHostel: HostelMaster = { ...h, id };
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
    const newRm: RoomMaster = { ...rmData, id };
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
    const newAssignment: StudentHostel = { ...sh, id };
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
    const newRefund: Refund = { ...r, id, refundNo };
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
    const newConfig: FinanceTransportConfig = { ...c, id };
    setFinanceTransportConfigs(prev => [...prev, newConfig]);
    logActivity('Created Transport Pricing Config', `Set ${newConfig.feePlan} fee ${formatCurrency(newConfig.feeAmount)} for ${newConfig.pickupName}`);
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
        { headId: 'FH-04', headName: 'Uniform & Sports Kit Fee', category: 'Uniform Fee', originalAmount: 3500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 3500, isApplicable: true, status: 'Pending' },
        { headId: 'FH-05', headName: 'Science & Computer Lab Fee', category: 'Lab Fee', originalAmount: 2500, scholarshipDeduction: 0, discountDeduction: 0, fineAmount: 0, finalAmount: 2500, isApplicable: true, status: 'Pending' }
      ];
    }

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
      const messFee = fhc ? fhc.messFee : 18000;
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
      updatedAt: new Date().toISOString().split('T')[0]
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

  const addRouteMaster = (r: Omit<RouteMaster, 'id'>) => {
    const id = 'RM-' + Math.floor(100 + Math.random() * 900);
    const newRoute: RouteMaster = { ...r, id };
    setRouteMasters(prev => [...prev, newRoute]);
    logActivity('Created Transport Route', `Added ${newRoute.routeName} (${newRoute.routeCode})`);
  };

  const updateRouteMaster = (id: string, updates: Partial<RouteMaster>) => {
    setRouteMasters(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    logActivity('Updated Transport Route', `Updated Route ID ${id}`);
  };

  const deleteRouteMaster = (id: string) => {
    setRouteMasters(prev => prev.filter(r => r.id !== id));
    logActivity('Deleted Transport Route', `Removed Route ID ${id}`);
  };

  const addPickupPoint = (p: Omit<PickupPoint, 'id'>) => {
    const id = 'PP-' + Math.floor(100 + Math.random() * 900);
    const newPt: PickupPoint = { ...p, id };
    setPickupPoints(prev => [...prev, newPt]);
    logActivity('Created Pickup Point', `Added stop ${newPt.pickupName} for ${newPt.routeName}`);
  };

  const updatePickupPoint = (id: string, updates: Partial<PickupPoint>) => {
    setPickupPoints(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePickupPoint = (id: string) => {
    setPickupPoints(prev => prev.filter(p => p.id !== id));
  };

  const addVehicleMaster = (v: Omit<VehicleMaster, 'id'>) => {
    const id = 'VM-' + Math.floor(100 + Math.random() * 900);
    const newVehicle: VehicleMaster = { ...v, id };
    setVehicleMasters(prev => [...prev, newVehicle]);
    logActivity('Added Fleet Vehicle', `Registered ${newVehicle.vehicleType} ${newVehicle.vehicleNumber}`);
  };

  const updateVehicleMaster = (id: string, updates: Partial<VehicleMaster>) => {
    setVehicleMasters(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVehicleMaster = (id: string) => {
    setVehicleMasters(prev => prev.filter(v => v.id !== id));
  };

  const addDriverMaster = (d: Omit<DriverMaster, 'id'>) => {
    const id = 'DRV-' + Math.floor(100 + Math.random() * 900);
    const newDriver: DriverMaster = { ...d, id };
    setDriverMasters(prev => [...prev, newDriver]);
    logActivity('Added Transport Driver', `Registered driver ${newDriver.driverName}`);
  };

  const updateDriverMaster = (id: string, updates: Partial<DriverMaster>) => {
    setDriverMasters(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDriverMaster = (id: string) => {
    setDriverMasters(prev => prev.filter(d => d.id !== id));
  };

  const assignVehicleRouteDriver = (va: Omit<VehicleAssignment, 'id'>) => {
    const id = 'VA-' + Math.floor(100 + Math.random() * 900);
    const newAssign: VehicleAssignment = { ...va, id };
    setVehicleAssignments(prev => [...prev.filter(a => a.vehicleId !== va.vehicleId && a.driverId !== va.driverId), newAssign]);
    logActivity('Vehicle Assigned', `Assigned ${va.vehicleNumber} to ${va.routeName} driven by ${va.driverName}`);
  };

  const removeVehicleAssignment = (id: string) => {
    setVehicleAssignments(prev => prev.filter(a => a.id !== id));
  };

  const addVehicleMaintenance = (vm: Omit<VehicleMaintenance, 'id'>) => {
    const id = 'VMN-' + Math.floor(100 + Math.random() * 900);
    const newMaint: VehicleMaintenance = { ...vm, id };
    setVehicleMaintenances(prev => [newMaint, ...prev]);
    logActivity('Logged Vehicle Maintenance', `Serviced vehicle ${newMaint.vehicleNumber}`);
  };

  const updateVehicleMaintenance = (id: string, updates: Partial<VehicleMaintenance>) => {
    setVehicleMaintenances(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteVehicleMaintenance = (id: string) => {
    setVehicleMaintenances(prev => prev.filter(m => m.id !== id));
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
      paymentHistory: studentPaymentItems
    };
  };

  const markAttendance = (records: DailyAttendance[]) => {
    setAttendance(prev => {
      const filterDates = records.map(r => `${r.entityId}_${r.date}`);
      const updated = prev.filter(r => !filterDates.includes(`${r.entityId}_${r.date}`));
      return [...records, ...updated];
    });
    logActivity('Marked Attendance', `Recorded attendance for ${records.length} items`);
  };

  const addExam = (examData: Omit<ExamSetup, 'id'>) => {
    const id = 'EXM-' + Math.floor(10 + Math.random() * 90);
    const newExam: ExamSetup = { ...examData, id };
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
    const newMarks: ExamMark[] = marksData.map(m => ({
      ...m,
      id: 'MRK-' + Math.floor(1000 + Math.random() * 9000)
    }));

    setExamMarks(prev => {
      const existingKeys = newMarks.map(nm => `${nm.examId}_${nm.studentId}_${nm.subject}`);
      const filtered = prev.filter(em => !existingKeys.includes(`${em.examId}_${em.studentId}_${em.subject}`));
      return [...filtered, ...newMarks];
    });
    logActivity('Saved Exam Marks', `Entered marks for ${newMarks.length} records`);
  };

  const addTimetableSlot = (slotData: Omit<TimetableSlot, 'id'>) => {
    const id = 'TT-' + Math.floor(100 + Math.random() * 900);
    const newSlot: TimetableSlot = { ...slotData, id };
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
    const newHw: Homework = { ...hwData, id };
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

  return (
    <DataContext.Provider
      value={{
        schoolProfile, updateSchoolProfile,
        students, addStudent, updateStudent, deleteStudent, promoteStudent, transferStudent,
        staff, addStaff, updateStaff, deleteStaff, addStaffDocument, deleteStaffDocument, updateBankDetails,
        admissions, addAdmission, updateAdmission, deleteAdmission, updateAdmissionStatus,
        academicClasses, addAcademicClass, updateAcademicClass, deleteAcademicClass,
        subjects, addSubject, updateSubject, deleteSubject,
        buses, addBus, updateBus, deleteBus,
        hostelBlocks, addHostelBlock, updateHostelBlock, deleteHostelBlock,
        hostelBeds, addHostelBed, updateHostelBed, deleteHostelBed,
        uniforms, addUniform, updateUniform, deleteUniform,
        customRoles, addCustomRole, updateCustomRole, deleteCustomRole,
        feeStructures, addFeeStructure, updateFeeStructure, deleteFeeStructure,
        feePayments, addFeePayment,
        feeHeads, addFeeHead, updateFeeHead, deleteFeeHead, toggleFeeHeadStatus,
        dynamicFeeStructures, addDynamicFeeStructure, updateDynamicFeeStructure, deleteDynamicFeeStructure,
        studentFeeAssignments, assignFeeStructure, bulkAssignFeeStructure, updateStudentFeeAssignment, removeStudentFeeAssignment,
        scholarships, addScholarship, updateScholarship, deleteScholarship,
        studentScholarships, assignScholarshipToStudent, revokeStudentScholarship,
        discounts, addDiscount, updateDiscount, deleteDiscount,
        studentDiscounts, assignDiscountToStudent, removeStudentDiscount,
        fineRules, addFineRule, updateFineRule, deleteFineRule,
        erpTransportRoutes, addERPTransportRoute, updateERPTransportRoute, deleteERPTransportRoute,
        studentTransports, assignStudentTransport, removeStudentTransport,
        hostelMasters, addHostelMaster, updateHostelMaster, deleteHostelMaster,
        roomTypeMasters, addRoomTypeMaster, updateRoomTypeMaster, deleteRoomTypeMaster,
        roomMasters, addRoomMaster, updateRoomMaster, deleteRoomMaster,
        studentHostelAssignments, assignStudentHostelRoom, updateStudentHostelAssignment, deleteStudentHostelAssignment,
        hostelVisitorLogs, addHostelVisitorLog, updateHostelVisitorLogStatus,
        hostelAttendanceLogs, recordHostelAttendance,
        financeHostelConfigs, addFinanceHostelConfig, updateFinanceHostelConfig, deleteFinanceHostelConfig,
        studentHostels, assignStudentHostel, removeStudentHostel,
        refunds, addRefund, updateRefundStatus,
        financeSettings, updateFinanceSettings,
        financeTransportConfigs, addFinanceTransportConfig, updateFinanceTransportConfig, deleteFinanceTransportConfig,
        studentFeeLedgers, generateStudentFeeLedger, recalculateStudentFeeLedger, getStudentFeeLedger,
        calculateStudentPayableFee,
        routeMasters, addRouteMaster, updateRouteMaster, deleteRouteMaster,
        pickupPoints, addPickupPoint, updatePickupPoint, deletePickupPoint,
        vehicleMasters, addVehicleMaster, updateVehicleMaster, deleteVehicleMaster,
        driverMasters, addDriverMaster, updateDriverMaster, deleteDriverMaster,
        vehicleAssignments, assignVehicleRouteDriver, removeVehicleAssignment,
        vehicleMaintenances, addVehicleMaintenance, updateVehicleMaintenance, deleteVehicleMaintenance,
        checkVehicleCapacity,
        attendance, markAttendance,
        exams, examMarks, addExam, updateExam, deleteExam, saveMarks,
        timetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
        homework, addHomework, updateHomework, deleteHomework,
        books, bookIssues, addBook, issueBook, returnBook,
        transportRoutes, addTransportRoute,
        hostelRooms, inventory, addInventoryItem,
        announcements, addAnnouncement,
        holidays, birthdays, auditLogs, logActivity
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
