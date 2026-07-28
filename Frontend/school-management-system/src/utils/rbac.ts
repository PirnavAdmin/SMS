import { Role } from '../types';

export const MODULES = [
  'dashboard',
  'students',
  'staff',
  'admissions',
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
    'timetable', 'examination', 'communication', 'events', 'reports', 'settings', 'training'
  ],
  'Teacher': [
    'dashboard', 'students', 'academics', 'subjects', 'attendance',
    'timetable', 'examination', 'homework', 'library', 'communication', 'events', 'training'
  ],
  'HR': [
    'dashboard', 'staff', 'communication', 'events', 'training'
  ],
  'Accountant': [
    'dashboard', 'students', 'fees', 'inventory', 'reports', 'communication', 'events', 'training'
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
    'dashboard', 'admissions', 'students', 'communication', 'events', 'training'
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

export const hasModuleAccess = (role: Role, moduleId: ModuleId | string): boolean => {
  const baseModule = moduleId.split('-')[0] as ModuleId;
  const allowedModules = ROLE_PERMISSIONS[role] || [];
  return allowedModules.includes(baseModule) || allowedModules.includes(moduleId as ModuleId);
};
