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

export const initialBusAttendants: BusAttendantMaster[] = [];
