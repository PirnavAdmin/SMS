import { Staff, StaffDocType } from "../../../types";

export type StaffType = "Teaching Staff" | "Non-Teaching Staff";
export type EmployeeCategory = "Teacher" | "Staff" | StaffType;
export type EmploymentType = "Full Time" | "Contract" | "Part Time";

export const staffTypeOptions: { value: StaffType; label: string }[] = [
  { value: "Teaching Staff", label: "Teaching Staff" },
  { value: "Non-Teaching Staff", label: "Non-Teaching Staff" },
];

export const employeeCategoryOptions = staffTypeOptions;

export const employmentTypeOptions: EmploymentType[] = [
  "Full Time",
  "Contract",
  "Part Time",
];
export const branchOptions = [
  "Main Campus",
  "North Campus",
  "South Campus",
  "West Campus",
  "City Center",
];

// Department mappings per Staff Type
export const staffTypeDepartmentMap: Record<StaffType, string[]> = {
  "Teaching Staff": [
    "Academics",
    "Mathematics",
    "English",
    "Science",
    "Social Studies",
    "Telugu",
    "Hindi",
    "Computer Science",
    "Physical Education",
    "Arts",
    "Music",
  ],
  "Non-Teaching Staff": [
    "Administration",
    "Accounts",
    "HR",
    "Admissions",
    "Library",
    "Laboratory",
    "Transport",
    "Hostel",
    "Reception",
    "IT Support",
    "Housekeeping",
    "Security",
    "Maintenance",
    "Medical",
    "Stores & Inventory",
  ],
};

// Designation mappings per Staff Type
export const staffTypeDesignationMap: Record<StaffType, string[]> = {
  "Teaching Staff": [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Pre-Primary / Nursery Teacher",
    "Subject Teacher",
    "Assistant Teacher",
    "Physical Education Teacher",
    "Music Teacher",
    "Art Teacher",
    "Activity Teacher",
    "Special Educator",
  ],
  "Non-Teaching Staff": [
    "Administrator",
    "Office Manager",
    "Administrative Executive",
    "HR Manager",
    "HR Executive",
    "HR Assistant",
    "Admission Officer",
    "Admissions Counselor",
    "Admissions Head",
    "Accountant",
    "Senior Accountant",
    "Finance Manager",
    "Finance Executive",
    "Cashier",
    "Billing Clerk",
    "Accounts Assistant",
    "Bursar",
    "Librarian",
    "Assistant Librarian",
    "Library Attendant",
    "Lab Assistant",
    "Lab Technician",
    "Lab In-charge",
    "Receptionist",
    "Front Desk Executive",
    "Transport Coordinator",
    "Fleet Supervisor",
    "Driver",
    "Bus Conductor",
    "Hostel Warden",
    "Assistant Warden",
    "Hostel Caretaker",
    "IT Executive",
    "Network Administrator",
    "System Administrator",
    "Office Assistant",
    "Store Keeper",
    "Security Guard",
    "Security Supervisor",
    "Security Officer",
    "Chief Security Officer",
    "Housekeeping Staff",
    "Housekeeping Supervisor",
    "Sweeper",
    "Sanitation Worker",
    "Electrician",
    "Plumber",
    "Gardener",
    "Maintenance Mechanic",
    "Attender",
  ],
};

export function normalizeStaffType(category?: string): StaffType {
  if (!category) return "Teaching Staff";
  if (category === "Teaching Staff" || category === "Teacher")
    return "Teaching Staff";
  return "Non-Teaching Staff";
}

// Department to Designation mapping strictly enforcing matching designations per department
export const departmentDesignationMap: Record<string, string[]> = {
  // Security
  Security: [
    "Security Guard",
    "Security Supervisor",
    "Security Officer",
    "Chief Security Officer",
    "Head Guard",
    "Gate Keeper",
    "Night Guard",
  ],

  // Housekeeping
  Housekeeping: [
    "Housekeeping Staff",
    "Housekeeping Supervisor",
    "Sweeper",
    "Sanitation Worker",
    "Cleaning Attendant",
    "Head Housekeeper",
  ],

  // Transport
  Transport: [
    "Transport Coordinator",
    "Fleet Supervisor",
    "Driver",
    "Bus Conductor",
    "Vehicle Mechanic",
    "Transport Manager",
    "Cleaner / Helper",
  ],

  // Maintenance
  Maintenance: [
    "Electrician",
    "Plumber",
    "Gardener",
    "Maintenance Mechanic",
    "Facility Supervisor",
    "Carpenter",
    "Painter",
    "Estate Officer",
  ],

  // Accounts
  Accounts: [
    "Accountant",
    "Senior Accountant",
    "Finance Manager",
    "Finance Executive",
    "Cashier",
    "Billing Clerk",
    "Accounts Assistant",
    "Bursar",
  ],

  // Administration
  Administration: [
    "Administrator",
    "Office Manager",
    "Administrative Executive",
    "Office Assistant",
    "Store Keeper",
    "Estate Manager",
    "Compliance Officer",
    "Record Keeper",
  ],

  // HR
  HR: [
    "HR Manager",
    "HR Executive",
    "HR Assistant",
    "Talent Acquisition Specialist",
    "Payroll Officer",
  ],

  // Admissions
  Admissions: [
    "Admission Officer",
    "Admissions Counselor",
    "Admissions Head",
    "Student Counselor",
    "Front Desk Representative",
  ],

  // Library
  Library: [
    "Librarian",
    "Assistant Librarian",
    "Library Attendant",
    "Library Assistant",
    "Resource Center Executive",
  ],

  // Laboratory
  Laboratory: [
    "Lab Assistant",
    "Lab Technician",
    "Lab In-charge",
    "Lab Attendant",
    "Physics Lab Assistant",
    "Chemistry Lab Assistant",
    "Biology Lab Assistant",
    "Computer Lab Assistant",
  ],

  // Hostel
  Hostel: [
    "Hostel Warden",
    "Chief Warden",
    "Assistant Warden",
    "Hostel Caretaker",
    "Mess Manager",
    "Hostel Attendant",
  ],

  // Reception
  Reception: [
    "Receptionist",
    "Front Desk Executive",
    "Information Desk Officer",
    "Telecaller / Helpdesk Executive",
  ],

  // IT Support
  "IT Support": [
    "IT Executive",
    "Network Administrator",
    "System Administrator",
    "IT Support Specialist",
    "Hardware Engineer",
    "EDP Manager",
  ],

  // Teaching Departments
  Mathematics: [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  English: [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  Science: [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  "Social Studies": [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  Telugu: [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  Hindi: [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  "Computer Science": [
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Subject Teacher",
    "Assistant Teacher",
  ],
  "Physical Education": [
    "Head of Department (HOD)",
    "Physical Education Teacher",
    "Assistant Teacher",
  ],
  Arts: ["Head of Department (HOD)", "Art Teacher", "Assistant Teacher"],
  Music: ["Head of Department (HOD)", "Music Teacher", "Assistant Teacher"],
};

export function isAcademicAssignmentVisible(
  staffTypeCategory?: string,
): boolean {
  return normalizeStaffType(staffTypeCategory) === "Teaching Staff";
}

export function getDepartmentOptions(
  staffTypeCategory?: string,
  settingsDepts?: any[],
): string[] {
  const staffType = normalizeStaffType(staffTypeCategory);
  const defaultList = staffTypeDepartmentMap[staffType] || [];

  const teachingDeptNames = new Set([
    "Mathematics",
    "Science",
    "English",
    "Social Science",
    "Social Studies",
    "Languages",
    "Telugu",
    "Hindi",
    "Computer Science",
    "Computer Science / ICT",
    "Commerce",
    "Humanities",
    "Fine Arts",
    "Performing Arts",
    "Arts",
    "Music",
    "Physical Education",
    "Pre-Primary",
    "Special Education",
  ]);

  const nonTeachingDeptNames = new Set([
    "Accounts",
    "Administration",
    "Library",
    "Laboratory",
    "Transport",
    "Hostel",
    "Reception",
    "IT Support",
    "HR",
    "Admissions",
    "Housekeeping",
    "Security",
    "Maintenance",
    "Medical",
    "Stores & Inventory",
  ]);

  let customDepts: string[] = [];
  if (settingsDepts && settingsDepts.length > 0) {
    customDepts = settingsDepts
      .filter((d) => {
        const name = typeof d === "string" ? d : d.name || d.departmentName;
        if (!name) return false;

        const status = typeof d === "object" ? d.status : "Active";
        if (status === "Inactive") return false;

        const targetType =
          typeof d === "object" ? d.staffType || d.employeeCategory : null;
        if (targetType && targetType !== "All" && targetType !== "Both") {
          return normalizeStaffType(targetType) === staffType;
        }

        if (staffType === "Teaching Staff") {
          return !nonTeachingDeptNames.has(name);
        } else {
          return !teachingDeptNames.has(name);
        }
      })
      .map((d) => (typeof d === "string" ? d : d.name || d.departmentName));
  }

  let combined = Array.from(new Set([...defaultList, ...customDepts])).filter(
    Boolean,
  );

  if (staffType === "Teaching Staff") {
    combined = combined.filter((dept) => !nonTeachingDeptNames.has(dept));
  } else {
    combined = combined.filter((dept) => !teachingDeptNames.has(dept));
  }

  return combined;
}

export function getDepartmentCode(name: string, customCode?: string): string {
  if (customCode && customCode.trim()) return customCode.trim().toUpperCase();
  const knownCodes: Record<string, string> = {
    Mathematics: "MATH",
    English: "ENG",
    Science: "SCI",
    "Social Studies": "SOC",
    "Social Science": "SOC",
    "Computer Science": "CS",
    "Physical Education": "PE",
    Arts: "ART",
    Music: "MUS",
    Telugu: "TEL",
    Hindi: "HIN",
    Academics: "ACAD",
    Administration: "ADM",
    Accounts: "ACCT",
    "Finance & Accounts": "ACCT",
    HR: "HR",
    "Human Resources": "HR",
    Admissions: "ADMS",
    Library: "LIB",
    Laboratory: "LAB",
    Transport: "TRN",
    Hostel: "HST",
    Reception: "RCP",
    "IT Support": "IT",
    "Information Technology": "IT",
    Housekeeping: "HSK",
    Security: "SEC",
    Maintenance: "MNT",
    Medical: "MED",
    "Stores & Inventory": "STR",
  };

  if (knownCodes[name]) return knownCodes[name];
  const clean = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return clean.slice(0, 4) || "DEPT";
}

export function getDepartmentSelectOptions(
  staffTypeCategory?: string,
  settingsDepts?: any[],
): { value: string; label: string; code: string }[] {
  const depts = getDepartmentOptions(staffTypeCategory, settingsDepts);

  return depts.map((dept) => {
    let code = "";
    if (settingsDepts && settingsDepts.length > 0) {
      const match = settingsDepts.find((d) => {
        const name = typeof d === "string" ? d : d.name || d.departmentName;
        return name && name.toLowerCase() === dept.toLowerCase();
      });
      if (match && typeof match === "object") {
        code = match.code || match.departmentCode || match.deptCode || "";
      }
    }
    const finalCode = getDepartmentCode(dept, code);
    return {
      value: dept,
      label: dept,
      code: finalCode,
    };
  });
}

export function getDesignationOptions(
  staffTypeCategory?: string,
  selectedDepartment?: string,
  settingsDesignations?: any[],
): string[] {
  const staffType = normalizeStaffType(staffTypeCategory);
  const staffTypeDesignations = staffTypeDesignationMap[staffType] || [];

  let baseList = staffTypeDesignations;
  if (selectedDepartment && departmentDesignationMap[selectedDepartment]) {
    baseList = departmentDesignationMap[selectedDepartment];
  }

  const teachingDesignationNames = new Set([
    "Principal",
    "Vice Principal",
    "Head of Department (HOD)",
    "PGT Teacher",
    "TGT Teacher",
    "PRT Teacher",
    "Pre-Primary / Nursery Teacher",
    "Subject Teacher",
    "Assistant Teacher",
    "Physical Education Teacher",
    "Music Teacher",
    "Art Teacher",
    "Activity Teacher",
    "Special Educator",
  ]);

  const nonTeachingDesignationNames = new Set([
    "Accountant",
    "Senior Accountant",
    "Finance Manager",
    "Finance Executive",
    "Cashier",
    "Billing Clerk",
    "Accounts Assistant",
    "Bursar",
    "Librarian",
    "Assistant Librarian",
    "Library Attendant",
    "Library Assistant",
    "Resource Center Executive",
    "Lab Assistant",
    "Lab Technician",
    "Lab In-charge",
    "Lab Attendant",
    "Physics Lab Assistant",
    "Chemistry Lab Assistant",
    "Biology Lab Assistant",
    "Computer Lab Assistant",
    "Receptionist",
    "Front Desk Executive",
    "Information Desk Officer",
    "Telecaller / Helpdesk Executive",
    "Transport Coordinator",
    "Fleet Supervisor",
    "Driver",
    "Bus Conductor",
    "Vehicle Mechanic",
    "Transport Manager",
    "Cleaner / Helper",
    "Hostel Warden",
    "Chief Warden",
    "Assistant Warden",
    "Hostel Caretaker",
    "Mess Manager",
    "Hostel Attendant",
    "IT Executive",
    "Network Administrator",
    "System Administrator",
    "IT Support Specialist",
    "Hardware Engineer",
    "EDP Manager",
    "Office Assistant",
    "Store Keeper",
    "Administrator",
    "Office Manager",
    "Administrative Executive",
    "HR Executive",
    "HR Manager",
    "Admission Officer",
    "Admissions Counselor",
    "Admissions Head",
    "Security Guard",
    "Security Supervisor",
    "Security Officer",
    "Chief Security Officer",
    "Head Guard",
    "Gate Keeper",
    "Night Guard",
    "Housekeeping Staff",
    "Housekeeping Supervisor",
    "Sweeper",
    "Sanitation Worker",
    "Cleaning Attendant",
    "Head Housekeeper",
    "Electrician",
    "Plumber",
    "Gardener",
    "Maintenance Mechanic",
    "Facility Supervisor",
    "Carpenter",
    "Painter",
    "Estate Officer",
    "Attender",
  ]);

  let customDesignations: string[] = [];
  if (settingsDesignations && settingsDesignations.length > 0) {
    customDesignations = settingsDesignations
      .filter((d) => {
        const name = typeof d === "string" ? d : d.designationName || d.name;
        if (!name) return false;
        const status = typeof d === "object" ? d.status : "Active";
        if (status === "Inactive") return false;

        const targetCategory =
          typeof d === "object" ? d.staffType || d.employeeCategory : null;
        if (
          targetCategory &&
          targetCategory !== "Both" &&
          targetCategory !== "All" &&
          normalizeStaffType(targetCategory) !== staffType
        ) {
          return false;
        }

        const targetDept = typeof d === "object" ? d.department : null;
        if (
          selectedDepartment &&
          targetDept &&
          targetDept !== selectedDepartment &&
          targetDept !== "All"
        ) {
          return false;
        }

        if (staffType === "Teaching Staff") {
          return !nonTeachingDesignationNames.has(name);
        } else {
          return !teachingDesignationNames.has(name);
        }
      })
      .map((d) => (typeof d === "string" ? d : d.designationName || d.name));
  }

  let combined = Array.from(
    new Set([...baseList, ...customDesignations]),
  ).filter(Boolean);

  if (staffType === "Teaching Staff") {
    combined = combined.filter(
      (desig) => !nonTeachingDesignationNames.has(desig),
    );
  } else {
    combined = combined.filter((desig) => !teachingDesignationNames.has(desig));
  }

  return combined;
}

export interface DocumentRequirementSlot {
  label: string;
  required: boolean;
  type: StaffDocType | "Other";
}

export const teachingDocumentRequirements: DocumentRequirementSlot[] = [
  { label: "Passport Photo", required: true, type: "Other" },
  { label: "Aadhaar Card", required: true, type: "Aadhaar Card" },
  { label: "PAN Card", required: true, type: "PAN Card" },
  { label: "Degree Certificate", required: true, type: "Degree Certificate" },
  { label: "B.Ed./M.Ed. (if applicable)", required: false, type: "B.Ed." },
  {
    label: "Experience Certificate",
    required: true,
    type: "Experience Letter",
  },
  { label: "Joining Letter", required: true, type: "Offer Letter" },
  { label: "Bank Passbook", required: true, type: "Bank Passbook" },
];

export const nonTeachingDocumentRequirements: DocumentRequirementSlot[] = [
  { label: "Passport Photo", required: true, type: "Other" },
  { label: "Aadhaar Card", required: true, type: "Aadhaar Card" },
  { label: "PAN Card", required: true, type: "PAN Card" },
  {
    label: "Qualification Certificate",
    required: true,
    type: "Educational Certificates",
  },
  {
    label: "Experience Certificate (optional)",
    required: false,
    type: "Experience Letter",
  },
  { label: "Bank Passbook", required: true, type: "Bank Passbook" },
  { label: "Joining Letter", required: true, type: "Offer Letter" },
];

export interface StaffQualificationItem {
  id: string;
  qualification: string;
  specialization: string;
  institution: string;
  boardUniversity: string;
  passingYear: string;
  percentageCgpa: string;
}

export interface StaffExperienceItem {
  id: string;
  previousOrganization: string;
  designation: string;
  fromDate: string;
  toDate: string;
  totalExperience: string;
  reasonForLeaving: string;
}

export interface StaffUploadedDocItem {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  uploadedAt: string;
}

export interface BasicStaffFormState {
  // SECTION 1: BASIC INFORMATION
  employeeCategory: StaffType | string;
  empId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  bloodGroup: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email: string;
  photoUrl?: string;

  // Identity Details
  aadhaarNumber?: string;
  panNumber?: string;

  // Address
  presentAddress: string;
  permanentAddress: string;
  sameAsPresentAddress: boolean;
  city: string;
  state: string;
  pinCode: string;

  // SECTION 2: EMPLOYMENT DETAILS
  branch: string;
  department: string;
  designation: string;
  employmentType: "Full-Time" | "Part-Time" | "Contract" | string;
  joiningDate: string;
  reportingManager?: string;
  status: "Active" | "On Leave" | "Resigned" | "Retired" | string;

  // Academic Assignment Fields (Teaching Staff)
  academicYear?: string;
  assignedClasses?: string[];
  assignedSections?: string[];
  assignedSubjects?: string[];
  isClassTeacher?: "Yes" | "No";

  // SECTION 3: QUALIFICATIONS
  qualifications: StaffQualificationItem[];

  // SECTION 4: EXPERIENCE
  experiences: StaffExperienceItem[];

  // SECTION 5: DOCUMENTS
  documents: StaffUploadedDocItem[];
}

export const defaultBasicStaffFormState = (
  category: string = "Teaching Staff",
): BasicStaffFormState => ({
  employeeCategory: normalizeStaffType(category),
  empId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "Male",
  dob: "",
  bloodGroup: "O+",
  mobileNumber: "",
  alternateMobileNumber: "",
  email: "",
  photoUrl: "",

  aadhaarNumber: "",
  panNumber: "",

  presentAddress: "",
  permanentAddress: "",
  sameAsPresentAddress: false,
  city: "",
  state: "",
  pinCode: "",

  branch: "Main Campus",
  department: "",
  designation: "",
  joiningDate: new Date().toISOString().split("T")[0],
  employmentType: "Full-Time",
  reportingManager: "",
  status: "Active",

  academicYear: "2026-2027",
  assignedClasses: [],
  assignedSections: [],
  assignedSubjects: [],
  isClassTeacher: "No",

  qualifications: [],
  experiences: [],
  documents: [],
});

export function calculateExperienceYearsMonths(
  fromDate: string,
  toDate: string,
): string {
  if (!fromDate || !toDate) return "0 Years 0 Months";
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start)
    return "0 Years 0 Months";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} Year${years !== 1 ? "s" : ""} ${months} Month${months !== 1 ? "s" : ""}`;
}

export function getEmployeeCategoryLabel(category?: string) {
  return normalizeStaffType(category);
}

export function getEmployeeCategoryFromLabel(label: string): StaffType {
  return normalizeStaffType(label);
}

export function getDocumentRequirements(category?: string) {
  return normalizeStaffType(category) === "Teaching Staff"
    ? teachingDocumentRequirements
    : nonTeachingDocumentRequirements;
}

export function getNextEmployeeId(staff: Staff[]) {
  const year = new Date().getFullYear();
  const numbers = staff
    .map((item) => {
      const match = (item.empId || "").match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((value): value is number => Number.isFinite(value) && value > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `STF-${year}-${String(next).padStart(4, "0")}`;
}

export function buildBasicStaffCreatePayload(
  form: BasicStaffFormState,
): Omit<Staff, "id"> {
  const normalizedCategory = normalizeStaffType(form.employeeCategory);
  const isTeaching = normalizedCategory === "Teaching Staff";

  const formattedName = [form.firstName, form.middleName, form.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const formattedQual =
    form.qualifications.length > 0
      ? form.qualifications
          .map((q) => `${q.qualification} (${q.specialization || "General"})`)
          .join(", ")
      : "";

  let expYears = 0;
  if (form.experiences.length > 0) {
    form.experiences.forEach((exp) => {
      if (exp.fromDate && exp.toDate) {
        const diffMs =
          new Date(exp.toDate).getTime() - new Date(exp.fromDate).getTime();
        if (diffMs > 0) {
          expYears += diffMs / (1000 * 60 * 60 * 24 * 365.25);
        }
      }
    });
  }

  return {
    empId: form.empId,
    employeeCategory: (normalizedCategory === "Teaching Staff"
      ? "Teacher"
      : "Staff") as any,
    branch: form.branch,
    name: formattedName || "Unnamed Employee",
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    designation: form.designation.trim(),
    department: form.department.trim(),
    role: isTeaching ? "Teacher" : "Staff",
    email: form.email.trim(),
    phone: form.mobileNumber.trim(),
    gender: form.gender || "Male",
    dob: form.dob || "",
    joiningDate: form.joiningDate,
    qualification: formattedQual,
    experienceYears: Math.round(expYears * 10) / 10,
    salary: 0,
    status: form.status === "Active" ? "Active" : "Inactive",
    avatar:
      form.photoUrl ||
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    address: form.presentAddress || "",
    assignedClasses: isTeaching ? form.assignedClasses || [] : [],
    assignedSubjects: isTeaching ? form.assignedSubjects || [] : [],
    isClassTeacherEligible: isTeaching && form.isClassTeacher === "Yes",
    documents: form.documents.map((d) => ({
      id: d.id,
      title: d.fileName,
      name: d.fileName,
      type: d.docType as any,
      fileUrl: d.fileUrl,
      uploadDate: d.uploadedAt,
      uploadedDate: d.uploadedAt,
      verified: true,
    })) as any,
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      branch: "",
      ifscCode: "",
      upiId: "",
    },
    leaveBalance: {
      casual: 12,
      sick: 10,
      paid: 15,
    },
    profileStatus: "Incomplete",
    employmentType: form.employmentType || "Full-Time",
  } as Omit<Staff, "id">;
}

export function buildBasicStaffUpdatePayload(
  form: BasicStaffFormState,
): Partial<Staff> {
  const normalizedCategory = normalizeStaffType(form.employeeCategory);
  const isTeaching = normalizedCategory === "Teaching Staff";

  const formattedName = [form.firstName, form.middleName, form.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    empId: form.empId,
    employeeCategory: (normalizedCategory === "Teaching Staff"
      ? "Teacher"
      : "Staff") as any,
    branch: form.branch,
    name: formattedName,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    designation: form.designation.trim(),
    department: form.department.trim(),
    role: isTeaching ? "Teacher" : "Staff",
    email: form.email.trim(),
    phone: form.mobileNumber.trim(),
    gender: form.gender,
    dob: form.dob,
    joiningDate: form.joiningDate,
    status: form.status === "Active" ? "Active" : "Inactive",
    employmentType: form.employmentType || "Full-Time",
    address: form.presentAddress,
    assignedClasses: isTeaching ? form.assignedClasses || [] : [],
    assignedSubjects: isTeaching ? form.assignedSubjects || [] : [],
    isClassTeacherEligible: isTeaching && form.isClassTeacher === "Yes",
  };
}
