import { Role } from '../types';

export const MODULES = [
  'dashboard',
  'students',
  'staff',
  'admissions',
  'student-promotion',
  'certificates',
  'transfer-certificates',
  'alumni',
  'student-management',
  'academics',
  'subjects',
  'attendance',
  'timetable',
  'examination',
  'homework',
  'fees',
  'uniforms',
  'library',
  'transport',
  'hostel',
  'inventory',
  'communication',
  'events',
  'reports',
  'users',
  'settings',
  'training'
] as const;

export type ModuleId = typeof MODULES[number];

// Central Role-Based Access Control matrix
export const ROLE_PERMISSIONS: Record<Role, ModuleId[]> = {
  'Super Admin': [...MODULES],
  'Admin': [...MODULES],
  'Principal': [
    'dashboard', 'students', 'staff', 'admissions', 'academics', 'subjects',
    'timetable', 'examination', 'certificates', 'communication', 'events', 'reports', 'settings', 'training'
  ],
  'Teacher': [
    'dashboard', 'students', 'attendance', 'timetable', 
    'homework', 'communication', 'events', 'staff'
  ],
  'HR': [
    'dashboard', 'staff', 'communication', 'events', 'training'
  ],
  'Accountant': [
    'dashboard', 'students', 'fees', 'certificates', 'inventory', 'reports', 'communication', 'events', 'training'
  ],
  'Librarian': [
    'dashboard', 'library', 'communication', 'events', 'training'
  ],
  'Transport Manager': [
    'dashboard', 'transport', 'communication', 'events', 'training'
  ],
  'Driver': [
    'dashboard', 'transport', 'communication', 'events', 'training'
  ],
  'Hostel Warden': [
    'dashboard', 'hostel', 'students', 'communication', 'events'
  ],
  'Receptionist': [
    'dashboard', 'admissions', 'students', 'certificates', 'communication', 'events', 'training'
  ],
  'Student': [
    'dashboard', 'attendance', 'timetable', 'examination', 'homework', 'library', 'communication', 'events', 'fees', 'hostel', 'staff', 'transport'
  ],
  'Parent': [
    'dashboard', 'attendance', 'timetable', 'examination', 'homework', 'fees', 'communication', 'events', 'hostel', 'staff', 'transport'
  ],
  'Staff': [
    'dashboard', 'communication', 'events', 'training'
  ]
};

const normalizeRoleForRbac = (roleStr: string): Role => {
  const clean = (roleStr || '').toLowerCase().replace(/[_\s-]+/g, ' ').trim();
  if (clean === 'superadmin' || clean === 'super admin' || clean === 'admin') return 'Admin';
  if (clean === 'principal') return 'Principal';
  if (clean === 'teacher' || clean === 'faculty' || clean === 'class teacher') return 'Teacher';
  if (clean === 'warden' || clean === 'hostel warden' || clean === 'hostelwarden') return 'Hostel Warden';
  if (clean === 'librarian') return 'Librarian';
  if (clean === 'driver' || clean === 'bus attendant' || clean === 'bus driver' || clean === 'chauffeur') return 'Driver';
  if (clean === 'transport manager' || clean === 'transportmanager' || clean === 'transport') return 'Transport Manager';
  if (clean === 'accountant' || clean === 'finance') return 'Accountant';
  if (clean === 'hr') return 'HR';
  if (clean === 'receptionist') return 'Receptionist';
  if (clean === 'parent') return 'Parent';
  if (clean === 'student') return 'Student';
  return 'Staff';
};

export const hasModuleAccess = (role: any, moduleId: ModuleId | string): boolean => {
  if (moduleId === 'transfer-certificates') moduleId = 'certificates';
  if (moduleId === 'librarian-attendance') moduleId = 'library';
  if (moduleId === 'library-timetable') moduleId = 'library';
  const baseModule = moduleId.split('-')[0] as ModuleId;
  const lookupRole = normalizeRoleForRbac(role);
  const allowedModules = ROLE_PERMISSIONS[lookupRole] || ROLE_PERMISSIONS['Staff'] || [];
  return allowedModules.includes(baseModule) || allowedModules.includes(moduleId as ModuleId);
};
