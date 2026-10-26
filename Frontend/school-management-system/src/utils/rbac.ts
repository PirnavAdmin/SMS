import { Role } from "../types";

export const MODULES = [
  "dashboard",
  "students",
  "staff",
  "admissions",
  "student-promotion",
  "certificates",
  "transfer-certificates",
  "alumni",
  "student-management",
  "academics",
  "subjects",
  "attendance",
  "timetable",
  "examination",
  "marks-entry",
  "report-cards",
  "homework",
  "fees",
  "uniforms",
  "library",
  "transport",
  "hostel",
  "inventory",
  "communication",
  "events",
  "reports",
  "users",
  "settings",
  "training",
] as const;

export type ModuleId = (typeof MODULES)[number];

// Central Role-Based Access Control matrix
export const ROLE_PERMISSIONS: Record<Role, ModuleId[]> = {
  "Super Admin": [...MODULES],
  Admin: [...MODULES],
  Principal: [
    "dashboard",
    "students",
    "staff",
    "admissions",
    "academics",
    "subjects",
    "timetable",
    "examination",
    "marks-entry",
    "report-cards",
    "certificates",
    "communication",
    "events",
    "reports",
    "settings",
    "training",
  ],
  Teacher: [
    "dashboard",
    "students",
    "attendance",
    "timetable",
    "examination",
    "marks-entry",
    "report-cards",
    "homework",
    "communication",
    "events",
    "staff",
  ],
  HR: ["dashboard", "staff", "communication", "events", "training"],
  Accountant: [
    "dashboard",
    "staff",
    "fees",
    "inventory",
    "communication",
    "events",
  ],
  Librarian: ["dashboard", "library", "communication", "events", "training"],
  "Transport Manager": [
    "dashboard",
    "transport",
    "communication",
    "events",
    "training",
  ],
  Driver: ["dashboard", "transport", "communication", "events", "staff"],
  "Hostel Warden": [
    "dashboard",
    "hostel",
    "students",
    "communication",
    "events",
    "staff",
  ],
  Receptionist: [
    "dashboard",
    "admissions",
    "students",
    "certificates",
    "communication",
    "events",
    "training",
  ],
  Student: [
    "dashboard",
    "attendance",
    "timetable",
    "report-cards",
    "homework",
    "library",
    "communication",
    "events",
    "fees",
    "hostel",
    "staff",
    "transport",
  ],
  Parent: [
    "dashboard",
    "attendance",
    "timetable",
    "report-cards",
    "homework",
    "fees",
    "communication",
    "events",
    "hostel",
    "staff",
    "transport",
  ],
  Staff: ["dashboard", "communication", "events", "training"],
};

const normalizeRoleForRbac = (roleStr: string): Role => {
  const clean = (roleStr || "")
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .trim();
  if (clean === "superadmin" || clean === "super admin" || clean === "admin")
    return "Admin";
  if (clean === "principal") return "Principal";
  if (clean === "teacher" || clean === "faculty" || clean === "class teacher")
    return "Teacher";
  if (
    clean === "warden" ||
    clean === "hostel warden" ||
    clean === "hostelwarden"
  )
    return "Hostel Warden";
  if (clean === "librarian") return "Librarian";
  if (
    clean === "driver" ||
    clean === "bus attendant" ||
    clean === "bus driver" ||
    clean === "chauffeur"
  )
    return "Driver";
  if (
    clean === "transport manager" ||
    clean === "transportmanager" ||
    clean === "transport"
  )
    return "Transport Manager";
  if (clean === "accountant" || clean === "finance") return "Accountant";
  if (clean === "hr") return "HR";
  if (clean === "receptionist") return "Receptionist";
  if (clean === "parent") return "Parent";
  if (clean === "student") return "Student";
  return "Staff";
};

export const hasModuleAccess = (
  role: any,
  moduleId: ModuleId | string,
): boolean => {
  if (moduleId === "transfer-certificates") moduleId = "certificates";
  if (moduleId === "librarian-attendance") moduleId = "library";
  if (moduleId === "library-timetable") moduleId = "library";
  if (moduleId === "warden-profile") moduleId = "staff";
  if (moduleId === "roles") moduleId = "users";
  const baseModule = moduleId.split("-")[0] as ModuleId;
  const lookupRole = normalizeRoleForRbac(role);
  const allowedModules =
    ROLE_PERMISSIONS[lookupRole] || ROLE_PERMISSIONS["Staff"] || [];
  return (
    allowedModules.includes(baseModule) ||
    allowedModules.includes(moduleId as ModuleId)
  );
};

/**
 * Checks whether an announcement/circular is visible to a user based on their role,
 * the announcement's target audience, and the category.
 * Used identically across Header (notification bell & dropdown) and CommunicationView (circulars list)
 * to prevent any count or visibility mismatch.
 */
export const isAnnouncementAudienceMatch = (
  targetAudience: string | undefined,
  category: string | undefined,
  userRole: string | undefined
): boolean => {
  if (!userRole) return true;
  const role = userRole.toLowerCase().trim();
  const aud = (targetAudience || 'ALL').toUpperCase().trim();
  const cat = (category || 'GENERAL').toUpperCase().trim();

  // 1. Super Admin, Admin, and Principal can see all circulars
  if (role.includes('admin') || role.includes('principal') || role.includes('super')) {
    return true;
  }

  // 2. Universal circulars, Urgent emergency advisories, and Holiday announcements are visible to everyone
  if (
    aud === 'ALL' ||
    aud === 'ALL AUDIENCES' ||
    aud === '' ||
    aud === 'GENERAL' ||
    aud === 'EVERYONE' ||
    cat === 'URGENT' ||
    cat === 'HOLIDAY'
  ) {
    return true;
  }

  // 3. Staff members (Teachers, Support Staff, Driver, Warden, Librarian, Accountant, Receptionist, HR, Transport, etc.)
  const isStaff =
    role.includes('teacher') ||
    role.includes('faculty') ||
    role.includes('staff') ||
    role.includes('warden') ||
    role.includes('librarian') ||
    role.includes('accountant') ||
    role.includes('driver') ||
    role.includes('receptionist') ||
    role.includes('employee') ||
    role.includes('hr') ||
    role.includes('transport') ||
    role.includes('bus');

  if (isStaff) {
    // Staff notices are visible to all staff
    if (aud.includes('STAFF') || aud === 'STAFF ONLY') {
      return true;
    }
    // School-wide broadcast circulars directed to students (academics, assemblies, sports, exams) are visible to staff
    if (aud.includes('STUDENT') || aud === 'STUDENTS ONLY') {
      return true;
    }
    // Only exclude strictly private parent-only circulars
    if (aud === 'PARENTS ONLY' || aud === 'PARENTS') {
      return false;
    }
    return true;
  }

  // 4. Student logins
  if (role.includes('student')) {
    // Students see circulars targeted to students or all
    return aud.includes('STUDENT') || aud === 'STUDENTS ONLY' || aud.includes('ALL');
  }

  // 5. Parent logins
  if (role.includes('parent')) {
    // Parents see parent circulars, student circulars, or all
    return (
      aud.includes('PARENT') ||
      aud.includes('STUDENT') ||
      aud === 'PARENTS ONLY' ||
      aud === 'STUDENTS ONLY' ||
      aud.includes('ALL')
    );
  }

  return true;
};
