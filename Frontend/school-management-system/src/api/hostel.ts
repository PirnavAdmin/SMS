import { apiClient } from './client';

const HOSTEL_CACHE_TTL_MS = 3000;
const hostelGetCache = new Map<string, { data: any; expiresAt: number }>();
const hostelInFlight = new Map<string, Promise<any>>();

export const invalidateHostelCache = () => {
  hostelGetCache.clear();
  hostelInFlight.clear();
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth_logout', invalidateHostelCache);
  window.addEventListener('hostel_allocations_updated', invalidateHostelCache);
  window.addEventListener('hostel_outpasses_updated', invalidateHostelCache);
  window.addEventListener('hostel_wardens_updated', invalidateHostelCache);
  window.addEventListener('room_types_updated', invalidateHostelCache);
  window.addEventListener('residential_students_updated', invalidateHostelCache);
}

const cachedHostelGet = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const cached = hostelGetCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const existing = hostelInFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      hostelGetCache.set(key, { data, expiresAt: Date.now() + HOSTEL_CACHE_TTL_MS });
      return data;
    })
    .finally(() => {
      hostelInFlight.delete(key);
    });

  hostelInFlight.set(key, promise);
  return promise;
};

const hostelApiClient = async (endpoint: string, options?: RequestInit) => {
  const method = (options?.method || 'GET').toUpperCase();
  const res = await apiClient(endpoint, options);
  if (method !== 'GET') {
    invalidateHostelCache();
  }
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
  totalFloors?: number;
}

export interface RoomType {
  roomTypeId: number;
  roomTypeSpecification: string;
  bedCapacity: number;
  acType: string;
  status: string;
  description: string;
  createdAt: string;
  hostelId?: number | string;
  floorLevel?: string;
}

export interface HostelRoom {
  roomId: number;
  hostelId: number;
  hostelName: string;
  hostelCode: string;
  roomTypeId: number;
  roomTypeSpecification: string;
  bedCapacity: number;
  capacity?: number;
  monthlyFee?: number;
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

export interface WardenRecord {
  wardenId: number;
  staffId: number;
  staffName: string;
  wardenName: string;
  employeeId: string;
  designation: string;
  department: string;
  email: string;
  emailAddress?: string;
  phone: string;
  mobileNumber?: string;
  hostelId: number;
  hostelName: string;
  assignedDate: string;
  effectiveDate?: string;
  effectiveDateString?: string;
  createdAt?: string;
  status: string;
}

export interface BedAllocation {
  allocationId: number;
  studentId: string | number;
  studentName: string;
  admissionNo: string;
  hostelId: number;
  hostelName: string;
  roomId: number;
  roomNumber: string;
  bedNumber: string;
  joiningDate: string;
  vacatedDate?: string;
  status: string;
  isPendingAdmitted?: boolean;
}

export interface NightAttendanceRecord {
  attendanceId: number;
  allocationId: number;
  studentId?: number | string;
  studentName: string;
  admissionNo: string;
  roomNumber: string;
  bedNumber: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'On Outpass';
  remarks?: string;
  curfewStatus?: string;
  inTime?: string;
  outTime?: string;
}

export interface DashboardMetrics {
  totalHostels: number;
  totalCapacity: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyPercentage: number;
  totalWardens: number;
  recentAllocations: BedAllocation[];
}

export interface EligibleHostelStudent {
  id?: number | string;
  applicationId?: number | string;
  studentId: number;
  admissionNo: string;
  studentName: string;
  className: string;
  gender: string;
  parentName: string;
  contactNumber: string;
  photoUrl?: string;
  branchName?: string;
}

export interface OutpassRecord {
  id: number | string;
  studentId?: string | number;
  studentName: string;
  admissionNo: string;
  hostelName: string;
  roomNumber: string;
  outpassType: 'Local Outpass' | 'Home Leave' | 'Emergency Outpass';
  departureDate: string;
  returnDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Completed' | 'Cancelled';
  approvedBy?: string;
  remarks?: string;
  createdAt?: string;
}

export interface TransferRecord {
  id: number | string;
  requestId?: number | string;
  studentId?: string | number;
  studentName: string;
  admissionNo: string;
  actionType: 'Room Transfer' | 'Bed Vacate';
  fromHostel: string;
  fromRoom: string;
  toHostel: string;
  toRoom: string;
  requestDate: string;
  reason: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  totalFeePaid?: number;
  monthsStayed?: number;
  feeUtilized?: number;
  refundableBalance?: number;
  feeAdjustmentMode?: string;
  createdAt?: string;
}

// Backwards-compatible legacy exports
export const defaultHostelBlocks: HostelBlock[] = [];
export const addDeletedHostelKey = (_key: string) => {};
export const saveStoredAllocations = (_allocs: BedAllocation[]) => {};

export const formatRoomNumber = (roomNumber?: string | number | null): string => {
  if (roomNumber === undefined || roomNumber === null || String(roomNumber).trim() === '') {
    return 'Room No - 1';
  }
  const str = String(roomNumber).trim();
  const stripped = str.replace(/^room\s*(no\.?|-|#)?\s*/i, '').replace(/^#\s*/, '').trim();
  if (!stripped) return 'Room No - 1';

  const num = parseInt(stripped, 10);
  if (!isNaN(num) && /^\d+$/.test(stripped)) {
    return `Room No - ${num}`;
  }
  return `Room No - ${stripped}`;
};

// 1. Hostel Blocks Master API
export const getHostelBlocks = async (search?: string, type?: string, _signal?: AbortSignal): Promise<HostelBlock[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (type && type !== 'All') params.append('type', type);
  const query = params.toString();

  const sanitizeBlock = (b: any, idx: number): HostelBlock => ({
    hostelId: Number(b?.hostelId ?? b?.id ?? idx + 1),
    hostelName: String(b?.hostelName || b?.name || `Hostel Block #${idx + 1}`).trim(),
    hostelCode: String(b?.hostelCode || `HST-${b?.hostelId || idx + 1}`).trim(),
    hostelType: String(b?.hostelType || b?.type || 'Boys Hostel').trim(),
    wardenName: b?.wardenName || 'Unassigned',
    primaryMobileNumber: b?.primaryMobileNumber || b?.phone || '',
    alternateMobileNumber: b?.alternateMobileNumber || '',
    email: b?.email || '',
    status: b?.status || 'Active',
    address: b?.address || '',
    createdAt: b?.createdAt || new Date().toISOString(),
    totalRooms: Number(b?.totalRooms) || 0,
    occupiedBeds: Number(b?.occupiedBeds) || 0,
    totalCapacity: Number(b?.totalCapacity) || 0,
    totalFloors: Number(b?.totalFloors) || 4
  });

  return cachedHostelGet(`blocks:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/blocks${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : (res && Array.isArray(res.blocks) ? res.blocks : null));
      if (arrayData) return (arrayData as any[]).map((b: any, idx: number) => sanitizeBlock(b, idx));
    } catch (err) {
      try {
        const resFallback = await hostelApiClient(`/api/hostels/blocks${query ? `?${query}` : ''}`);
        const arrayDataFallback = Array.isArray(resFallback) ? resFallback : (resFallback && Array.isArray(resFallback.data) ? resFallback.data : null);
        if (arrayDataFallback) return (arrayDataFallback as any[]).map((b: any, idx: number) => sanitizeBlock(b, idx));
      } catch {}
    }

    return [];
  });
};

export const createHostelBlock = async (data: Partial<HostelBlock>) => {
  try {
    const res = await hostelApiClient('/api/hostel/blocks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient('/api/hostels/blocks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const updateHostelBlock = async (id: number, data: Partial<HostelBlock>) => {
  try {
    const res = await hostelApiClient(`/api/hostel/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient(`/api/hostels/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

export const deleteHostelBlock = async (id: number | string, _code?: string, _name?: string) => {
  try {
    return await hostelApiClient(`/api/hostel/blocks/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return await hostelApiClient(`/api/hostels/blocks/${id}`, {
      method: 'DELETE'
    });
  }
};

// 2. Room Type Configurations API
export const getRoomTypes = async (): Promise<RoomType[]> => {
  return cachedHostelGet('room-types', async () => {
    try {
      const res = await hostelApiClient('/api/hostel/room-types');
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    try {
      const res = await hostelApiClient('/api/hostels/room-types');
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    return [];
  });
};

export const createRoomType = async (data: Partial<RoomType>) => {
  try {
    const res = await hostelApiClient('/api/hostel/room-types', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient('/api/hostels/room-types', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const updateRoomType = async (id: number, data: Partial<RoomType>) => {
  try {
    const res = await hostelApiClient(`/api/hostel/room-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient(`/api/hostels/room-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

export const deleteRoomType = async (id: number) => {
  try {
    return await hostelApiClient(`/api/hostel/room-types/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return await hostelApiClient(`/api/hostels/room-types/${id}`, {
      method: 'DELETE'
    });
  }
};

// 3. Room Masters API
export const getRooms = async (hostelId?: number, floor?: string, roomTypeId?: number): Promise<HostelRoom[]> => {
  const params = new URLSearchParams();
  if (hostelId) params.append('hostelId', hostelId.toString());
  if (floor) params.append('floor', floor);
  if (roomTypeId) params.append('roomTypeId', roomTypeId.toString());
  const query = params.toString();

  return cachedHostelGet(`rooms:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/rooms${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    try {
      const res = await hostelApiClient(`/api/hostels/rooms${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    return [];
  });
};

export const createRoom = async (data: Partial<HostelRoom>) => {
  try {
    const res = await hostelApiClient('/api/hostel/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient('/api/hostels/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const updateRoom = async (id: number, data: Partial<HostelRoom>) => {
  try {
    const res = await hostelApiClient(`/api/hostel/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient(`/api/hostels/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

export const deleteRoom = async (id: number) => {
  try {
    return await hostelApiClient(`/api/hostel/rooms/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return await hostelApiClient(`/api/hostels/rooms/${id}`, {
      method: 'DELETE'
    });
  }
};

// 4. Staff Candidates & Wardens API
export const getStaffCandidates = async (search?: string): Promise<StaffCandidate[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return cachedHostelGet(`staff-candidates:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/wardens/candidates${query}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    try {
      const res = await hostelApiClient(`/api/hostels/staff-candidates${query}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    return [];
  });
};

export const getWardens = async (hostelId?: number, search?: string): Promise<WardenRecord[]> => {
  const params = new URLSearchParams();
  if (hostelId) params.append('hostelId', hostelId.toString());
  if (search) params.append('search', search);
  const query = params.toString();

  return cachedHostelGet(`wardens:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/wardens${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    try {
      const res = await hostelApiClient(`/api/hostels/wardens${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    return [];
  });
};

export const assignWarden = async (data: Partial<WardenRecord>) => {
  try {
    const res = await hostelApiClient('/api/hostel/wardens', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient('/api/hostels/wardens', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const deleteWarden = async (id: number) => {
  try {
    return await hostelApiClient(`/api/hostel/wardens/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return await hostelApiClient(`/api/hostels/wardens/${id}`, {
      method: 'DELETE'
    });
  }
};

// 5. Eligible Students & Bed Allocations API
export const getEligibleStudentsForAllocation = async (search?: string): Promise<EligibleHostelStudent[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return cachedHostelGet(`eligible-students:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/eligible-students${query}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {
      try {
        const res = await hostelApiClient(`/api/hostels/eligible-students${query}`);
        const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
        if (arrayData) return arrayData;
      } catch {}
    }
    return [];
  });
};

export const getAllocations = async (hostelId?: number, roomId?: number, search?: string): Promise<BedAllocation[]> => {
  const params = new URLSearchParams();
  if (hostelId) params.append('hostelId', hostelId.toString());
  if (roomId) params.append('roomId', roomId.toString());
  if (search) params.append('search', search);
  const query = params.toString();

  return cachedHostelGet(`allocations:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/allocations${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) {
        return (arrayData as any[]).filter((a: any) => a && a.status !== 'Vacated' && a.status !== 'Inactive');
      }
    } catch (e) {}

    try {
      const res = await hostelApiClient(`/api/hostels/allocations${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) {
        return (arrayData as any[]).filter((a: any) => a && a.status !== 'Vacated' && a.status !== 'Inactive');
      }
    } catch (e) {}

    return [];
  });
};

export const createAllocation = async (data: Partial<BedAllocation>) => {
  try {
    const res = await hostelApiClient('/api/hostel/allocations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data || res;
  } catch (e) {
    return await hostelApiClient('/api/hostels/allocations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const vacateAllocation = async (id: number | string) => {
  try {
    return await hostelApiClient(`/api/hostel/allocations/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return await hostelApiClient(`/api/hostels/allocations/${id}/vacate`, {
      method: 'PUT'
    });
  }
};

export const updateStudentAllocationBlock = async (
  studentId: string | number,
  admissionNo: string,
  targetBlockName: string,
  targetRoomNumber: string,
  targetBlockId?: number,
  studentName?: string,
  targetBedNumber?: string
) => {
  try {
    await createTransferVacateRequest({
      studentId,
      studentName,
      admissionNo,
      actionType: 'Room Transfer',
      destinationHostelId: targetBlockId,
      destinationHostelName: targetBlockName,
      destinationRoomNumber: targetRoomNumber,
      destinationBedNumber: targetBedNumber,
      reason: 'Room and block transfer'
    });
  } catch (e) {}
  window.dispatchEvent(new Event('hostel_allocations_updated'));
  window.dispatchEvent(new Event('residential_students_updated'));
};

export const vacateStudentAllocation = async (
  studentId: string | number,
  _admissionNo?: string,
  _reason?: string
) => {
  try {
    await vacateAllocation(studentId);
  } catch (e) {}
  window.dispatchEvent(new Event('hostel_allocations_updated'));
  window.dispatchEvent(new Event('residential_students_updated'));
};

// 6. Night Attendance Roll-Call API
export const getNightAttendance = async (date: string, hostelId: number, floor?: string, roomId?: number): Promise<NightAttendanceRecord[]> => {
  const params = new URLSearchParams();
  params.append('date', date);
  params.append('hostelId', hostelId.toString());
  if (floor) params.append('floor', floor);
  if (roomId) params.append('roomId', roomId.toString());
  const query = params.toString();

  return cachedHostelGet(`attendance:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/attendance?${query}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    try {
      const res = await hostelApiClient(`/api/hostels/attendance?${query}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) return arrayData;
    } catch (e) {}

    return [];
  });
};

export const saveNightAttendance = async (data: { date: string; hostelId: number; floorLevel?: string; records: any[] }) => {
  try {
    return await hostelApiClient('/api/hostel/attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (e) {
    return await hostelApiClient('/api/hostels/attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// 7. Executive Dashboard Metrics API
export const getHostelDashboardMetrics = async (_signal?: AbortSignal): Promise<DashboardMetrics> => {
  return cachedHostelGet('dashboard', async () => {
    try {
      return await hostelApiClient('/api/hostel/dashboard');
    } catch (e) {
      return await hostelApiClient('/api/hostels/dashboard');
    }
  });
};

// 8. Outpass & Leave API (Dynamic Server Integration)
export const getOutpasses = async (search?: string, status?: string): Promise<OutpassRecord[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  const query = params.toString();

  return cachedHostelGet(`outpasses:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/outpasses${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) {
        return arrayData.map((o: any) => ({
          id: o.outpassId ?? o.id,
          studentId: o.studentId,
          studentName: o.studentName || 'Student',
          admissionNo: o.admissionNo || '',
          hostelName: o.hostelName || '',
          roomNumber: o.roomNumber || '',
          outpassType: o.requestType || o.outpassType || 'Local Outpass',
          departureDate: o.outDate ? new Date(o.outDate).toISOString().split('T')[0] : (o.departureDate || ''),
          returnDate: o.expectedReturnDate ? new Date(o.expectedReturnDate).toISOString().split('T')[0] : (o.returnDate || ''),
          reason: o.reason || '',
          status: o.status || 'Pending',
          approvedBy: o.approvedBy,
          remarks: o.remarks,
          createdAt: o.createdAt
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch outpasses from server:', e);
    }
    return [];
  });
};

export const createOutpass = async (data: any): Promise<any> => {
  const payload = {
    studentId: Number(data.studentId) || 0,
    studentName: data.studentName,
    requestType: data.outpassType || data.requestType || 'Local Outpass',
    reason: data.reason || '',
    outDate: data.departureDate ? new Date(data.departureDate).toISOString() : new Date().toISOString(),
    expectedReturnDate: data.returnDate ? new Date(data.returnDate).toISOString() : new Date(Date.now() + 86400000).toISOString()
  };
  return hostelApiClient('/api/hostel/outpasses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateOutpassStatus = async (id: number | string, status: string, approvedBy?: string, remarks?: string): Promise<any> => {
  const query = new URLSearchParams({
    status,
    approvedBy: approvedBy || 'Hostel Warden',
    remarks: remarks || ''
  }).toString();
  return hostelApiClient(`/api/hostel/outpasses/${id}/status?${query}`, {
    method: 'PUT'
  });
};

export const deleteOutpass = async (id: number | string): Promise<boolean> => {
  await hostelApiClient(`/api/hostel/outpasses/${id}`, {
    method: 'DELETE'
  });
  return true;
};

// 9. Transfer & Vacate API (Dynamic Server Integration)
export const getTransferVacateRequests = async (search?: string, actionType?: string): Promise<TransferRecord[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (actionType && actionType !== 'All') params.append('actionType', actionType);
  const query = params.toString();

  return cachedHostelGet(`transfers:${query}`, async () => {
    try {
      const res = await hostelApiClient(`/api/hostel/transfers${query ? `?${query}` : ''}`);
      const arrayData = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : null);
      if (arrayData) {
        return arrayData.map((t: any) => ({
          id: t.id ?? t.requestId,
          requestId: t.id ?? t.requestId,
          studentId: t.studentId,
          studentName: t.studentName || t.student || 'Student',
          admissionNo: t.admissionNo || t.admNo || '',
          actionType: (t.actionType && t.actionType.toLowerCase().includes('vacate')) ? 'Bed Vacate' : 'Room Transfer',
          fromHostel: t.currentRoom ? t.currentRoom.split(' - ')[0] || t.currentRoom : (t.fromHostel || 'Hostel Block'),
          fromRoom: t.currentRoom ? t.currentRoom.split(' - ')[1] || t.currentRoom : (t.fromRoom || ''),
          toHostel: t.destinationHostelName || t.toHostel || 'N/A',
          toRoom: t.destinationRoomNumber || t.toRoom || 'N/A',
          requestDate: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : (t.requestDate || new Date().toISOString().split('T')[0]),
          reason: t.reason || '',
          status: t.status || 'Completed',
          totalFeePaid: t.totalFeePaid,
          monthsStayed: t.monthsStayed,
          feeUtilized: t.feeUtilized,
          refundableBalance: t.refundableBalance,
          feeAdjustmentMode: t.feeAdjustmentMode,
          createdAt: t.createdAt
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch transfers from server:', e);
    }
    return [];
  });
};

export const createTransferVacateRequest = async (data: any): Promise<any> => {
  const payload = {
    studentId: Number(data.studentId) || 0,
    studentName: data.studentName,
    actionType: data.actionType || 'Room Transfer (Change Room/Block)',
    destinationHostelId: data.destinationHostelId ? Number(data.destinationHostelId) : null,
    destinationHostelName: data.destinationHostelName || data.toHostel,
    destinationRoomId: data.destinationRoomId ? Number(data.destinationRoomId) : null,
    destinationRoomNumber: data.destinationRoomNumber || data.toRoom,
    destinationBedNumber: data.destinationBedNumber || '',
    reason: data.reason || ''
  };
  return hostelApiClient('/api/hostel/transfers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const deleteTransferVacateRequest = async (id: number | string): Promise<boolean> => {
  await hostelApiClient(`/api/hostel/transfers/${id}`, {
    method: 'DELETE'
  });
  return true;
};
