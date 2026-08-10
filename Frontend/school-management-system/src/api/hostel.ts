import { apiClient } from './client';

const hostelApiClient = async (endpoint: string, options?: RequestInit) => {
  const res = await apiClient(endpoint, options);
  if (res && typeof res === 'object' && 'data' in res) {
    return res.data;
  }
  return res;
};

export interface HostelBlock {
  hostelId: number;
  hostelName: string;
  hostelCode: string;
  hostelType: string;
  wardenName: string;
  primaryMobileNumber: string;
  alternateMobileNumber: string;
  email: string;
  status: string;
  address: string;
  createdAt: string;
  totalRooms: number;
  occupiedBeds: number;
  totalCapacity: number;
}

export interface RoomType {
  roomTypeId: number;
  roomTypeSpecification: string;
  bedCapacity: number;
  acType: string;
  status: string;
  description: string;
  createdAt: string;
}

export interface HostelRoom {
  roomId: number;
  hostelId: number;
  hostelName: string;
  hostelCode: string;
  roomTypeId: number;
  roomTypeSpecification: string;
  bedCapacity: number;
  floorLevel: string;
  roomNumber: string;
  status: string;
  occupiedBeds: number;
  vacantBeds: number;
  createdAt: string;
}

export interface StaffCandidate {
  staffId: number;
  employeeId: string;
  staffName: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
}

export interface BedAllocation {
  allocationId: number;
  studentId: number;
  studentName: string;
  admissionNo: string;
  hostelId: number;
  hostelName: string;
  roomId: number;
  roomNumber: string;
  bedNumber: string;
  joiningDate: string;
  status: string;
}

export interface NightAttendanceRecord {
  attendanceId: number;
  allocationId: number;
  studentId: number;
  studentName: string;
  admissionNo: string;
  hostelName: string;
  roomNumber: string;
  bedNumber: string;
  date: string;
  curfewStatus: string;
  remarks: string | null;
}

export interface DashboardMetrics {
  totalHostels: number;
  totalRooms: number;
  totalBedCapacity: number;
  activeOccupiedBeds: number;
  availableVacantBeds: number;
  enrolledHostellers: number;
  occupancyPercentage: number;
  estMonthlyRevenue: number;
}

// 1. Hostel Blocks Master API
export const getHostelBlocks = async (search?: string, type?: string, signal?: AbortSignal): Promise<HostelBlock[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (type) params.append('type', type);
  const query = params.toString();
  return hostelApiClient(`/api/hostels/blocks${query ? `?${query}` : ''}`, { signal });
};

export const createHostelBlock = async (data: Partial<HostelBlock>) => {
  return hostelApiClient('/api/hostels/blocks', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateHostelBlock = async (id: number, data: Partial<HostelBlock>) => {
  return hostelApiClient(`/api/hostels/blocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteHostelBlock = async (id: number) => {
  return hostelApiClient(`/api/hostels/blocks/${id}`, {
    method: 'DELETE'
  });
};

// 2. Room Type Configurations API
export const getRoomTypes = async (): Promise<RoomType[]> => {
  return hostelApiClient('/api/hostels/room-types');
};

export const createRoomType = async (data: Partial<RoomType>) => {
  return hostelApiClient('/api/hostels/room-types', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateRoomType = async (id: number, data: Partial<RoomType>) => {
  return hostelApiClient(`/api/hostels/room-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteRoomType = async (id: number) => {
  return hostelApiClient(`/api/hostels/room-types/${id}`, {
    method: 'DELETE'
  });
};

// 3. Room Masters API
export const getRooms = async (hostelId?: number, floor?: string, roomTypeId?: number): Promise<HostelRoom[]> => {
  const params = new URLSearchParams();
  if (hostelId) params.append('hostelId', hostelId.toString());
  if (floor) params.append('floor', floor);
  if (roomTypeId) params.append('roomTypeId', roomTypeId.toString());
  const query = params.toString();
  return hostelApiClient(`/api/hostels/rooms${query ? `?${query}` : ''}`);
};

export const createRoom = async (data: Partial<HostelRoom>) => {
  return hostelApiClient('/api/hostels/rooms', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateRoom = async (id: number, data: Partial<HostelRoom>) => {
  return hostelApiClient(`/api/hostels/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteRoom = async (id: number) => {
  return hostelApiClient(`/api/hostels/rooms/${id}`, {
    method: 'DELETE'
  });
};

// 4. Warden & Staff Integration API
export const getStaffCandidates = async (): Promise<StaffCandidate[]> => {
  return hostelApiClient('/api/hostels/staff-candidates');
};

export const getWardens = async (): Promise<any[]> => {
  return hostelApiClient('/api/hostels/wardens');
};

export const deleteWarden = async (id: number) => {
  return hostelApiClient(`/api/hostels/wardens/${id}`, {
    method: 'DELETE'
  });
};

export const assignWarden = async (data: any) => {
  return hostelApiClient('/api/hostels/wardens', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// 5. Student Bed Allocation API
export const getAllocations = async (): Promise<BedAllocation[]> => {
  return hostelApiClient('/api/hostels/allocations');
};

export const createAllocation = async (data: Partial<BedAllocation>) => {
  return hostelApiClient('/api/hostels/allocations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const vacateAllocation = async (id: number) => {
  return hostelApiClient(`/api/hostels/allocations/${id}/vacate`, {
    method: 'PUT'
  });
};

// 6. Night Attendance Roll-Call API
export const getNightAttendance = async (date: string, hostelId: number): Promise<NightAttendanceRecord[]> => {
  const params = new URLSearchParams();
  params.append('date', date);
  params.append('hostelId', hostelId.toString());
  const query = params.toString();
  return hostelApiClient(`/api/hostels/attendance?${query}`);
};

export const saveNightAttendance = async (data: { date: string; hostelId: number; floorLevel: string; records: any[] }) => {
  return hostelApiClient('/api/hostels/attendance', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// 7. Executive Dashboard Metrics API
export const getHostelDashboardMetrics = async (signal?: AbortSignal): Promise<DashboardMetrics> => {
  return hostelApiClient('/api/hostels/dashboard', { signal });
};
