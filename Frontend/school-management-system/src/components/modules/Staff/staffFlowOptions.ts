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
    "Bus Attendant",
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

export const teachingDeptNames = new Set([
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

export const nonTeachingDeptNames = new Set([
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

const lowerTeachingDepts = new Set(Array.from(teachingDeptNames).map(n => n.toLowerCase()));
const lowerNonTeachingDepts = new Set(Array.from(nonTeachingDeptNames).map(n => n.toLowerCase()));

export function getDepartmentOptions(
  staffTypeCategory?: string,
  settingsDepts?: any[],
): string[] {
  const staffType = normalizeStaffType(staffTypeCategory);
  const isTeaching = staffType === "Teaching Staff";

  // Base list of standard departments for each category
  const baseStandardDepts = isTeaching
    ? Array.from(teachingDeptNames)
    : Array.from(nonTeachingDeptNames);

  // If settingsDepts (from DB/context) is provided, filter them based on Category / Name
  const customFilteredDepts: string[] = [];
  if (Array.isArray(settingsDepts) && settingsDepts.length > 0) {
    settingsDepts.forEach((d) => {
      const name = typeof d === "string" ? d : d.name || d.departmentName;
      if (!name) return;

      const status = typeof d === "object" ? d.status : "Active";
      if (status === "Inactive") return;

      const cleanName = name.toLowerCase().trim();
      const cat = typeof d === "object" ? d.category : undefined;

      // 1. If explicit category is set in database:
      if (cat) {
        const cleanCat = String(cat).toLowerCase().trim();
        if (cleanCat.includes("non-teach") || cleanCat.includes("non teach")) {
          if (!isTeaching) customFilteredDepts.push(name);
          return;
        } else if (cleanCat.includes("teach")) {
          if (isTeaching) customFilteredDepts.push(name);
          return;
        }
      }

      // 2. Exact match in our known sets
      if (lowerTeachingDepts.has(cleanName)) {
        if (isTeaching) customFilteredDepts.push(name);
        return;
      }
      if (lowerNonTeachingDepts.has(cleanName)) {
        if (!isTeaching) customFilteredDepts.push(name);
        return;
      }

      // 3. Keyword heuristic for custom/typoed names
      const nonTeachingKeywords = [
        'admin', 'account', 'hr', 'admission', 'lib', 'lab', 'transport', 'transp', 
        'hostel', 'recept', 'it', 'support', 'secur', 'clean', 'housekeep', 'maintenance', 
        'store', 'inv', 'oper', 'ops', 'non-teach', 'non teaching', 'canteen', 'cafeteria', 'medical', 'nurse'
      ];
      const isNonTeachingKeyword = nonTeachingKeywords.some(kw => cleanName.includes(kw));
      if (isNonTeachingKeyword) {
        if (!isTeaching) customFilteredDepts.push(name);
        return;
      }

      // 4. Academic keywords
      const teachingKeywords = [
        'math', 'sci', 'eng', 'soc', 'lang', 'telugu', 'hindi', 'art', 'mus', 'pe', 'sport', 'comp', 'ict', 'commerce', 'human'
      ];
      const isTeachingKeyword = teachingKeywords.some(kw => cleanName.includes(kw));
      if (isTeachingKeyword) {
        if (isTeaching) customFilteredDepts.push(name);
        return;
      }

      // Default fallback based on staff type
      if (isTeaching) {
        customFilteredDepts.push(name);
      }
    });
  }

  // Combine standard base departments and custom departments from DB without duplicates
  const combined = Array.from(new Set([...customFilteredDepts, ...baseStandardDepts]));

  // Strictly ensure no non-teaching dept leaks into Teaching and vice-versa
  return combined.filter(name => {
    const clean = name.toLowerCase().trim();
    if (isTeaching) {
      if (lowerNonTeachingDepts.has(clean)) return false;
      const nonTeachingKeywords = [
        'admin', 'account', 'hr', 'admission', 'lib', 'lab', 'transport', 'transp', 
        'hostel', 'recept', 'it', 'support', 'secur', 'clean', 'housekeep', 'maintenance', 
        'store', 'inv', 'oper', 'ops', 'non-teach', 'non teaching', 'canteen', 'cafeteria', 'medical', 'nurse'
      ];
      return !nonTeachingKeywords.some(kw => clean.includes(kw));
    } else {
      if (lowerTeachingDepts.has(clean)) return false;
      return true;
    }
  });
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

export const teachingDesignationNames = new Set([
  "Subject Teacher",
  "Head of Department (HOD)",
  "PGT Teacher",
  "TGT Teacher",
  "PRT Teacher",
  "Pre-Primary / Nursery Teacher",
  "Assistant Teacher",
  "Principal",
  "Vice Principal",
  "Physical Education Teacher",
  "Music Teacher",
  "Art Teacher",
  "Activity Teacher",
  "Special Educator",
  "Lecturer",
  "Faculty",
  "Lab Instructor",
]);

export const nonTeachingDesignationNames = new Set([
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
  "Bus Attendant",
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
  "School Doctor",
  "School Nurse",
]);

const lowerTeachingDesignations = new Set(Array.from(teachingDesignationNames).map(n => n.toLowerCase()));
const lowerNonTeachingDesignations = new Set(Array.from(nonTeachingDesignationNames).map(n => n.toLowerCase()));

export function getDesignationOptions(
  staffTypeCategory?: string,
  selectedDepartment?: string,
  settingsDesignations?: any[],
): string[] {
  const staffType = normalizeStaffType(staffTypeCategory);
  const isTeachingStaff = staffType === "Teaching Staff";

  const nonTeachingKeywords = [
    'driver', 'attendant', 'conductor', 'guard', 'sweeper', 'cleaner', 
    'accountant', 'clerk', 'cashier', 'librarian', 'warden', 'electrician', 
    'plumber', 'gardener', 'mechanic', 'receptionist', 'attender', 'caretaker', 
    'helper', 'security', 'housekeep', 'peon', 'cook', 'kitchen', 'bus'
  ];

  const teachingKeywords = [
    'teacher', 'pgt', 'tgt', 'prt', 'principal', 'vice principal', 'vice - principal', 
    'hod', 'faculty', 'lecturer', 'educator', 'instructor'
  ];

  // 1. Determine base standard designations
  let baseDesignations: string[] = [];
  if (isTeachingStaff) {
    baseDesignations = Array.from(teachingDesignationNames);
  } else {
    // If department is selected for non-teaching staff, try to find matching department-specific designations
    if (selectedDepartment && selectedDepartment.trim()) {
      const cleanDept = selectedDepartment.toLowerCase().trim();
      const matchedKey = Object.keys(departmentDesignationMap).find(key => 
        cleanDept.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanDept)
      );
      if (matchedKey && departmentDesignationMap[matchedKey]) {
        baseDesignations = departmentDesignationMap[matchedKey];
      } else {
        baseDesignations = Array.from(nonTeachingDesignationNames);
      }
    } else {
      baseDesignations = Array.from(nonTeachingDesignationNames);
    }
  }

  // 2. Filter custom settings designations from backend database
  const customDesignations: string[] = [];
  if (Array.isArray(settingsDesignations) && settingsDesignations.length > 0) {
    settingsDesignations.forEach((d) => {
      const name = typeof d === "string" ? d : d.designationName || d.name;
      if (!name) return;
      const status = typeof d === "object" ? d.status : "Active";
      if (status === "Inactive") return;

      const cleanName = name.toLowerCase().trim();
      const targetCategory = typeof d === "object" ? d.staffType || d.employeeCategory || '' : '';
      const cleanTarget = targetCategory.toLowerCase().trim();

      // Check category metadata if present
      if (cleanTarget && cleanTarget !== "both" && cleanTarget !== "all") {
        const isNonTeachCat = cleanTarget.includes('non');
        const isTeachCat = !isNonTeachCat && (cleanTarget.includes('teach') || cleanTarget.includes('teacher'));
        if (isTeachingStaff !== isTeachCat) return;
      }

      // Check strict keyword rules
      const isNonTeachingName = nonTeachingKeywords.some(kw => cleanName.includes(kw)) || lowerNonTeachingDesignations.has(cleanName);
      const isTeachingName = teachingKeywords.some(kw => cleanName.includes(kw)) || lowerTeachingDesignations.has(cleanName);

      if (isTeachingStaff) {
        if (isNonTeachingName && !isTeachingName) return;
        customDesignations.push(name);
      } else {
        if (isTeachingName && !isNonTeachingName) return;
        
        // If department is specified, check department match
        const targetDept = typeof d === "object" ? d.department || d.departmentName : null;
        if (
          selectedDepartment &&
          targetDept &&
          targetDept !== "All" &&
          targetDept !== "Both" &&
          targetDept.toLowerCase() !== selectedDepartment.toLowerCase()
        ) {
          return;
        }

        customDesignations.push(name);
      }
    });
  }

  // 3. Combine base and custom designations with deduplication
  const combined = Array.from(new Set([...customDesignations, ...baseDesignations]));

  // 4. Final safety filter
  return combined.filter(name => {
    const clean = name.toLowerCase().trim();
    if (isTeachingStaff) {
      if (lowerNonTeachingDesignations.has(clean)) return false;
      return !nonTeachingKeywords.some(kw => clean.includes(kw));
    } else {
      if (lowerTeachingDesignations.has(clean)) return false;
      return true;
    }
  });
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
  country: string;

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
  gender: "" as any,
  dob: "",
  bloodGroup: "",
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
  country: "India",

  branch: "Main Campus",
  department: "",
  designation: "",
  joiningDate: new Date().toISOString().split("T")[0],
  employmentType: "",
  reportingManager: "",
  status: "",

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
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years === 0 && months === 0) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Day${diffDays !== 1 ? "s" : ""}`;
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
    alternateMobile: form.alternateMobileNumber ? form.alternateMobileNumber.trim() : "",
    gender: form.gender || "Male",
    dob: form.dob || "",
    bloodGroup: form.bloodGroup,
    joiningDate: form.joiningDate,
    qualification: formattedQual,
    experienceYears: Math.round(expYears * 10) / 10,
    salary: 0,
    status: form.status === "Active" ? "Active" : "Inactive",
    avatar:
      form.photoUrl ||
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    address: form.presentAddress || "",
    presentAddress: form.presentAddress || "",
    permanentAddress: form.permanentAddress || "",
    city: form.city || "",
    state: form.state || "",
    pinCode: form.pinCode || "",
    country: form.country ? form.country.trim() : "",
    aadhaarNumber: form.aadhaarNumber ? form.aadhaarNumber.trim() : "",
    panNumber: form.panNumber ? form.panNumber.trim() : "",
    assignedClasses: isTeaching ? form.assignedClasses || [] : [],
    assignedSubjects: isTeaching ? form.assignedSubjects || [] : [],
    isClassTeacherEligible: isTeaching && form.isClassTeacher === "Yes",
    qualifications: form.qualifications as any,
    experienceRecords: form.experiences as any,
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
    profileStatus: (form.firstName && form.lastName && form.dob && form.mobileNumber && form.department && form.designation)
      ? "Completed"
      : "Incomplete",
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

  const formattedQual =
    form.qualifications.length > 0
      ? form.qualifications
          .map((q) => `${q.qualification} (${q.specialization || "General"})`)
          .join(", ")
      : "";

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
    alternateMobile: form.alternateMobileNumber ? form.alternateMobileNumber.trim() : "",
    gender: form.gender,
    dob: form.dob,
    bloodGroup: form.bloodGroup,
    joiningDate: form.joiningDate,
    qualification: formattedQual,
    qualifications: form.qualifications as any,
    experienceRecords: form.experiences as any,
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
    status: form.status === "Active" ? "Active" : "Inactive",
    employmentType: form.employmentType || "Full-Time",
    address: form.presentAddress,
    presentAddress: form.presentAddress,
    permanentAddress: form.permanentAddress,
    city: form.city,
    state: form.state,
    pinCode: form.pinCode,
    country: form.country ? form.country.trim() : "",
    aadhaarNumber: form.aadhaarNumber ? form.aadhaarNumber.trim() : "",
    panNumber: form.panNumber ? form.panNumber.trim() : "",
    assignedClasses: isTeaching ? form.assignedClasses || [] : [],
    assignedSubjects: isTeaching ? form.assignedSubjects || [] : [],
    isClassTeacherEligible: isTeaching && form.isClassTeacher === "Yes",
    profileStatus: (form.firstName && form.lastName && form.dob && form.mobileNumber && form.department && form.designation)
      ? "Completed"
      : "Incomplete",
  };
}
