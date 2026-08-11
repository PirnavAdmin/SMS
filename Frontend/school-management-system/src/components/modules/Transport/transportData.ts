// ============================================================
// Transport Module — Shared static data and type definitions
// Moved here to fix Vite HMR "incompatible export" warnings.
// React component files must not export non-component values.
// ============================================================

// ---- Bus Attendant ----
export interface BusAttendantMaster {
  id: string;
  employeeId: string;
  attendantName: string;
  mobileNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  branch: string;
  status: 'Active' | 'Inactive' | 'On Leave';
}

export const initialBusAttendants: BusAttendantMaster[] = [
  {
    id: 'att-1',
    employeeId: 'ATT-2026-01',
    attendantName: 'Mary Smith',
    mobileNumber: '+1 (555) 019-8274',
    gender: 'Female',
    branch: 'Main Campus',
    status: 'Active'
  },
  {
    id: 'att-2',
    employeeId: 'ATT-2026-02',
    attendantName: 'Sarah Jenkins',
    mobileNumber: '+1 (555) 019-8275',
    gender: 'Female',
    branch: 'Main Campus',
    status: 'Active'
  },
  {
    id: 'att-3',
    employeeId: 'ATT-2026-03',
    attendantName: 'Robert Vance',
    mobileNumber: '+1 (555) 019-8276',
    gender: 'Male',
    branch: 'North Branch',
    status: 'Active'
  }
];
