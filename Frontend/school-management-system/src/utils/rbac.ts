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
    'dashboard', 'students', 'attendance', 'timetable', 'examination', 
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
  'Hostel Warden': [
    'dashboard', 'hostel', 'students', 'communication', 'events', 'training'
  ],
  'Receptionist': [
    'dashboard', 'admissions', 'students', 'certificates', 'communication', 'events', 'training'
  ],
  'Student': [
    'dashboard', 'attendance', 'timetable', 'examination', 'homework', 'library', 'communication', 'events', 'fees', 'hostel', 'staff', 'transport', 'certificates'
  ],
  'Parent': [
    'dashboard', 'attendance', 'timetable', 'examination', 'homework', 'fees', 'communication', 'events', 'hostel', 'staff', 'transport', 'certificates'
  ],
  'Staff': [
    'dashboard', 'communication', 'events', 'training'
  ]
};

export const hasModuleAccess = (role: any, moduleId: ModuleId | string): boolean => {
  if (moduleId === 'transfer-certificates') moduleId = 'certificates';
  if (moduleId === 'librarian-attendance') moduleId = 'library';
  if (moduleId === 'library-timetable') moduleId = 'library';
  const baseModule = moduleId.split('-')[0] as ModuleId;
  let lookupRole = role;
  if (role === 'Class Teacher') {
    lookupRole = 'Teacher';
  }
  const allowedModules = ROLE_PERMISSIONS[lookupRole as Role] || [];
  return allowedModules.includes(baseModule) || allowedModules.includes(moduleId as ModuleId);
};
