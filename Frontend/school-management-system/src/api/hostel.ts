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

export interface BedAllocation {
  allocationId: number | string;
  studentId: number | string;
  studentName: string;
  admissionNo: string;
  hostelId: number;
  hostelName: string;
  roomId: number;
  roomNumber: string;
  bedNumber: string;
  joiningDate: string;
  status: string;
  isPendingAdmitted?: boolean;
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

// Persistent Local Storage Sync Layer for Hostel Blocks
const HOSTEL_BLOCKS_STORE_KEY = 'edu_db_hostel_blocks';

const getStoredHostelBlocks = (): HostelBlock[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HOSTEL_BLOCKS_STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Ignored
    }
  }
  return [];
};

const saveStoredHostelBlocks = (blocks: HostelBlock[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HOSTEL_BLOCKS_STORE_KEY, JSON.stringify(blocks));
  }
};

// 1. Hostel Blocks Master API
export const getHostelBlocks = async (search?: string, type?: string, signal?: AbortSignal): Promise<HostelBlock[]> => {
  let serverBlocks: HostelBlock[] = [];
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    const query = params.toString();
    const res = await hostelApiClient(`/api/hostels/blocks${query ? `?${query}` : ''}`, { signal });
    if (Array.isArray(res)) {
      serverBlocks = res;
    }
  } catch (err) {
    // API offline fallback
  }

  const localBlocks = getStoredHostelBlocks();
  
  // Deduplicate server blocks & local blocks by code, name, and ID
  const blockMap = new Map<string, HostelBlock>();

  const sanitizeBlock = (b: any, fallbackIndex: number): HostelBlock => {
    const rawId = b?.hostelId !== undefined && b?.hostelId !== null 
      ? b.hostelId 
      : (b?.id !== undefined ? b.id : (b?.blockId !== undefined ? b.blockId : fallbackIndex + 1));
    const hostelId = Number(rawId) || (fallbackIndex + 1);

    let hostelName = String(b?.hostelName || b?.name || b?.blockName || '').trim();
    if (!hostelName || !isNaN(Number(hostelName)) || hostelName.includes('undefined')) {
      hostelName = hostelId === 1 ? 'Ramachandra Bhavan Block' : `Hostel Block #${hostelId}`;
    }

    let hostelType = String(b?.hostelType || b?.type || b?.genderType || '').trim();
    if (!hostelType || hostelType.includes('undefined')) {
      hostelType = hostelName.toLowerCase().includes('girls') ? 'Girls Hostel' : 'Boys Hostel';
    }

    const hCode = String(b?.hostelCode || `HST-00${hostelId}`).trim();

    return {
      hostelId,
      hostelName,
      hostelCode: hCode,
      hostelType,
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
    };
  };

  // Add server blocks first
  serverBlocks.forEach((b, idx) => {
    const clean = sanitizeBlock(b, idx);
    const key = (clean.hostelCode || clean.hostelName || clean.hostelId.toString()).toLowerCase().trim();
    blockMap.set(key, clean);
  });

  // Add local blocks (deduplicate against existing items by code/name/id)
  localBlocks.forEach((b, idx) => {
    const clean = sanitizeBlock(b, idx + serverBlocks.length);
    const keyByCode = (clean.hostelCode || '').toLowerCase().trim();
    const keyByName = (clean.hostelName || '').toLowerCase().trim();
    const keyById = clean.hostelId.toString();

    // Check if block already exists under any alias key
    const existingKey = Array.from(blockMap.keys()).find(k => k === keyByCode || k === keyByName || k === keyById);
    if (existingKey) {
      const existing = blockMap.get(existingKey)!;
      blockMap.set(existingKey, {
        ...existing,
        ...clean,
        hostelId: existing.hostelId,
        totalRooms: Math.max(existing.totalRooms, clean.totalRooms),
        occupiedBeds: Math.max(existing.occupiedBeds, clean.occupiedBeds),
        totalCapacity: Math.max(existing.totalCapacity, clean.totalCapacity)
      });
    } else {
      const primaryKey = keyByCode || keyByName || keyById;
      blockMap.set(primaryKey, clean);
    }
  });

  let result = Array.from(blockMap.values());
  saveStoredHostelBlocks(result);

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(b => 
      (b.hostelName || '').toLowerCase().includes(q) || 
      (b.hostelCode || '').toLowerCase().includes(q)
    );
  }

  if (type && type.trim() && type !== 'All') {
    result = result.filter(b => (b.hostelType || '').toLowerCase() === type.toLowerCase());
  }

  return result;
};

export const createHostelBlock = async (data: Partial<HostelBlock>) => {
  const current = getStoredHostelBlocks();

  // Check if a block with matching code or name already exists
  const reqCode = (data.hostelCode || '').toLowerCase().trim();
  const reqName = (data.hostelName || '').toLowerCase().trim();

  const existingIndex = current.findIndex(b => 
    (reqCode && (b.hostelCode || '').toLowerCase().trim() === reqCode) ||
    (reqName && (b.hostelName || '').toLowerCase().trim() === reqName)
  );

  if (existingIndex !== -1) {
    const updatedBlock = {
      ...current[existingIndex],
      ...data,
      hostelName: data.hostelName || current[existingIndex].hostelName,
      hostelCode: data.hostelCode || current[existingIndex].hostelCode,
    };
    current[existingIndex] = updatedBlock;
    saveStoredHostelBlocks(current);
    return updatedBlock;
  }

  const nextId = current.length > 0 ? Math.max(100, ...current.map(b => Number(b.hostelId) || 0)) + 1 : 101;
  const newBlock: HostelBlock = {
    hostelId: nextId,
    hostelName: data.hostelName || 'New Hostel Block',
    hostelCode: data.hostelCode || `HST-${nextId}`,
    hostelType: data.hostelType || 'Boys Hostel',
    wardenName: data.wardenName || 'Unassigned',
    primaryMobileNumber: data.primaryMobileNumber || 'N/A',
    alternateMobileNumber: '',
    email: '',
    status: data.status || 'Active',
    address: data.address || '',
    createdAt: new Date().toISOString(),
    totalRooms: 0,
    occupiedBeds: 0,
    totalCapacity: 0,
    totalFloors: data.totalFloors || 4
  };

  const updated = [newBlock, ...current];
  saveStoredHostelBlocks(updated);

  try {
    const res = await hostelApiClient('/api/hostels/blocks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res && res.hostelId) return res;
  } catch (e) {
    // API offline fallback
  }

  return newBlock;
};

export const updateHostelBlock = async (id: number, data: Partial<HostelBlock>) => {
  const current = getStoredHostelBlocks();
  const updated = current.map(b => b.hostelId === id ? { ...b, ...data } : b);
  saveStoredHostelBlocks(updated);

  try {
    return await hostelApiClient(`/api/hostels/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (e) {
    return updated.find(b => b.hostelId === id) || data;
  }
};

export const deleteHostelBlock = async (id: number | string, code?: string, name?: string) => {
  const current = getStoredHostelBlocks();
  const targetId = String(id || '').trim().toLowerCase();
  const targetCode = String(code || '').trim().toLowerCase();
  const targetName = String(name || '').trim().toLowerCase();

  const updated = current.filter(b => {
    const bId = String(b.hostelId !== undefined ? b.hostelId : (b as any).id || '').trim().toLowerCase();
    const bCode = String(b.hostelCode || '').trim().toLowerCase();
    const bName = String(b.hostelName || '').trim().toLowerCase();

    if (targetId && bId === targetId) return false;
    if (targetCode && bCode === targetCode) return false;
    if (targetName && bName === targetName) return false;
    return true;
  });

  saveStoredHostelBlocks(updated);

  try {
    return await hostelApiClient(`/api/hostels/blocks/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return { success: true };
  }
};

// Persistent Local Storage Sync Layer for Room Types
const ROOM_TYPES_STORE_KEY = 'edu_db_room_types';

const DEFAULT_INITIAL_ROOM_TYPES: RoomType[] = [
  { roomTypeId: 1, roomTypeSpecification: 'Single Deluxe AC', bedCapacity: 1, acType: 'AC', status: 'Active', description: 'Single bed air-conditioned room with study desk', createdAt: '2026-01-01' },
  { roomTypeId: 2, roomTypeSpecification: 'Double Sharing Non-AC', bedCapacity: 2, acType: 'Non-AC', status: 'Active', description: 'Two bed sharing ventilated room', createdAt: '2026-01-01' },
  { roomTypeId: 3, roomTypeSpecification: 'Triple Sharing Non-AC', bedCapacity: 3, acType: 'Non-AC', status: 'Active', description: 'Three bed standard room', createdAt: '2026-01-01' },
  { roomTypeId: 4, roomTypeSpecification: 'Four Bedded Standard', bedCapacity: 4, acType: 'Non-AC', status: 'Active', description: 'Four bed dormitory style room', createdAt: '2026-01-01' }
];

const getStoredRoomTypes = (): RoomType[] => {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_ROOM_TYPES;
  const stored = localStorage.getItem(ROOM_TYPES_STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return DEFAULT_INITIAL_ROOM_TYPES;
};

const saveStoredRoomTypes = (data: RoomType[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROOM_TYPES_STORE_KEY, JSON.stringify(data));
  }
};

// 2. Room Type Configurations API
export const getRoomTypes = async (): Promise<RoomType[]> => {
  let serverTypes: RoomType[] = [];
  try {
    const res = await hostelApiClient('/api/hostels/room-types');
    if (Array.isArray(res) && res.length > 0) serverTypes = res;
  } catch (e) {}

  const localTypes = getStoredRoomTypes();
  const typeMap = new Map<number, RoomType>();

  serverTypes.forEach(rt => typeMap.set(Number(rt.roomTypeId), rt));
  localTypes.forEach(rt => typeMap.set(Number(rt.roomTypeId), rt));

  return Array.from(typeMap.values());
};

export const createRoomType = async (data: Partial<RoomType>) => {
  const current = getStoredRoomTypes();
  const nextId = current.length > 0 ? Math.max(...current.map(rt => Number(rt.roomTypeId) || 0)) + 1 : 1;
  const newType: RoomType = {
    roomTypeId: nextId,
    roomTypeSpecification: data.roomTypeSpecification || `Room Type #${nextId}`,
    bedCapacity: Number(data.bedCapacity) || 2,
    acType: data.acType || 'Non-AC',
    status: data.status || 'Active',
    description: data.description || '',
    createdAt: new Date().toISOString()
  };

  const updated = [newType, ...current];
  saveStoredRoomTypes(updated);

  try {
    const res = await hostelApiClient('/api/hostels/room-types', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res && res.roomTypeId) return res;
  } catch (e) {}

  return newType;
};

export const updateRoomType = async (id: number, data: Partial<RoomType>) => {
  const current = getStoredRoomTypes();
  const updated = current.map(rt => Number(rt.roomTypeId) === Number(id) ? { ...rt, ...data } : rt);
  saveStoredRoomTypes(updated);

  try {
    return await hostelApiClient(`/api/hostels/room-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (e) {
    return updated.find(rt => Number(rt.roomTypeId) === Number(id)) || data;
  }
};

export const deleteRoomType = async (id: number) => {
  const current = getStoredRoomTypes();
  const updated = current.filter(rt => Number(rt.roomTypeId) !== Number(id));
  saveStoredRoomTypes(updated);

  try {
    return await hostelApiClient(`/api/hostels/room-types/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return { success: true };
  }
};

// Persistent Local Storage Sync Layer for Rooms
const ROOMS_STORE_KEY = 'edu_db_hostel_rooms';

const DEFAULT_INITIAL_ROOMS: HostelRoom[] = [
  { roomId: 201, hostelId: 1, hostelName: 'Ramachandra Bhavan Block', hostelCode: 'HST-001', roomTypeId: 4, roomTypeSpecification: 'Four Bedded Standard', bedCapacity: 4, capacity: 4, monthlyFee: 5000, floorLevel: '1st Floor', roomNumber: '101', status: 'Active', occupiedBeds: 2, vacantBeds: 2, createdAt: '2026-01-01' },
  { roomId: 202, hostelId: 1, hostelName: 'Ramachandra Bhavan Block', hostelCode: 'HST-001', roomTypeId: 4, roomTypeSpecification: 'Four Bedded Standard', bedCapacity: 4, capacity: 4, monthlyFee: 5000, floorLevel: '1st Floor', roomNumber: '102', status: 'Active', occupiedBeds: 1, vacantBeds: 3, createdAt: '2026-01-01' },
  { roomId: 203, hostelId: 1, hostelName: 'Ramachandra Bhavan Block', hostelCode: 'HST-001', roomTypeId: 2, roomTypeSpecification: 'Double Sharing Non-AC', bedCapacity: 2, capacity: 2, monthlyFee: 6500, floorLevel: '2nd Floor', roomNumber: '201', status: 'Active', occupiedBeds: 0, vacantBeds: 2, createdAt: '2026-01-01' },
  { roomId: 301, hostelId: 6, hostelName: 'Girls Block A', hostelCode: 'HST-006', roomTypeId: 4, roomTypeSpecification: 'Four Bedded Standard', bedCapacity: 4, capacity: 4, monthlyFee: 5500, floorLevel: '1st Floor', roomNumber: 'G-101', status: 'Active', occupiedBeds: 1, vacantBeds: 3, createdAt: '2026-01-01' }
];

const getStoredRooms = (): HostelRoom[] => {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_ROOMS;
  const stored = localStorage.getItem(ROOMS_STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return DEFAULT_INITIAL_ROOMS;
};

const saveStoredRooms = (rooms: HostelRoom[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ROOMS_STORE_KEY, JSON.stringify(rooms));
  }
};

// 3. Room Masters API
export const getRooms = async (hostelId?: number, floor?: string, roomTypeId?: number): Promise<HostelRoom[]> => {
  let serverRooms: HostelRoom[] = [];
  try {
    const params = new URLSearchParams();
    if (hostelId) params.append('hostelId', hostelId.toString());
    if (floor) params.append('floor', floor);
    if (roomTypeId) params.append('roomTypeId', roomTypeId.toString());
    const query = params.toString();
    const res = await hostelApiClient(`/api/hostels/rooms${query ? `?${query}` : ''}`);
    if (Array.isArray(res) && res.length > 0) serverRooms = res;
  } catch (e) {}

  const localRooms = getStoredRooms();
  const roomTypes = getStoredRoomTypes();
  const allocations = getStoredAllocations();

  const roomMap = new Map<number, HostelRoom>();

  serverRooms.forEach(r => roomMap.set(Number(r.roomId), r));
  localRooms.forEach(r => roomMap.set(Number(r.roomId), r));

  const blocks = getStoredHostelBlocks();

  let roomsList = Array.from(roomMap.values()).map(rm => {
    const matchingBlock = blocks.find(b => Number(b.hostelId) === Number(rm.hostelId));
    const matchingRt = roomTypes.find(rt => Number(rt.roomTypeId) === Number(rm.roomTypeId));
    const cap = rm.bedCapacity || rm.capacity || matchingRt?.bedCapacity || 4;

    const occCount = allocations.filter(a =>
      a && a.status === 'Active' &&
      (Number(a.roomId) === Number(rm.roomId) || (String(a.roomNumber) === String(rm.roomNumber) && Number(a.hostelId) === Number(rm.hostelId)))
    ).length;

    return {
      ...rm,
      hostelName: rm.hostelName || matchingBlock?.hostelName || `Hostel Block #${rm.hostelId}`,
      roomTypeSpecification: rm.roomTypeSpecification || matchingRt?.roomTypeSpecification || 'Standard Room',
      bedCapacity: cap,
      capacity: cap,
      occupiedBeds: occCount,
      vacantBeds: Math.max(0, cap - occCount)
    };
  });

  if (hostelId) {
    roomsList = roomsList.filter(r => Number(r.hostelId) === Number(hostelId));
  }
  if (floor) {
    roomsList = roomsList.filter(r => (r.floorLevel || '').toLowerCase() === floor.toLowerCase());
  }
  if (roomTypeId) {
    roomsList = roomsList.filter(r => Number(r.roomTypeId) === Number(roomTypeId));
  }

  return roomsList;
};

export const createRoom = async (data: Partial<HostelRoom>) => {
  const current = getStoredRooms();
  const nextId = current.length > 0 ? Math.max(...current.map(r => Number(r.roomId) || 0)) + 1 : 201;

  const roomTypes = getStoredRoomTypes();
  const matchingRt = roomTypes.find(rt => Number(rt.roomTypeId) === Number(data.roomTypeId));
  const cap = Number(data.bedCapacity) || Number(matchingRt?.bedCapacity) || 4;

  const blocks = getStoredHostelBlocks();
  const matchingBlock = blocks.find(b => Number(b.hostelId) === Number(data.hostelId));

  const newRoom: HostelRoom = {
    roomId: nextId,
    hostelId: Number(data.hostelId) || 1,
    hostelName: data.hostelName || matchingBlock?.hostelName || 'Ramachandra Bhavan Block',
    hostelCode: matchingBlock?.hostelCode || `HST-00${data.hostelId || 1}`,
    roomTypeId: Number(data.roomTypeId) || 1,
    roomTypeSpecification: matchingRt?.roomTypeSpecification || 'Standard Room',
    bedCapacity: cap,
    capacity: cap,
    monthlyFee: Number(data.monthlyFee) || 5000,
    floorLevel: data.floorLevel || '1st Floor',
    roomNumber: data.roomNumber || `${nextId}`,
    status: data.status || 'Active',
    occupiedBeds: 0,
    vacantBeds: cap,
    createdAt: new Date().toISOString()
  };

  const updated = [newRoom, ...current];
  saveStoredRooms(updated);

  try {
    const res = await hostelApiClient('/api/hostels/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res && res.roomId) return res;
  } catch (e) {}

  return newRoom;
};

export const updateRoom = async (id: number, data: Partial<HostelRoom>) => {
  const current = getStoredRooms();
  const updated = current.map(r => Number(r.roomId) === Number(id) ? { ...r, ...data } : r);
  saveStoredRooms(updated);

  try {
    return await hostelApiClient(`/api/hostels/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (e) {
    return updated.find(r => Number(r.roomId) === Number(id)) || data;
  }
};

export const deleteRoom = async (id: number) => {
  const current = getStoredRooms();
  const updated = current.filter(r => Number(r.roomId) !== Number(id));
  saveStoredRooms(updated);

  try {
    return await hostelApiClient(`/api/hostels/rooms/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return { success: true };
  }
};

// 4. Warden & Staff Integration API
export interface WardenRecord {
  wardenId: number;
  staffId: number;
  staffName: string;
  wardenName?: string;
  employeeId: string;
  designation?: string;
  department?: string;
  email: string;
  emailAddress?: string;
  phone: string;
  mobileNumber?: string;
  hostelId: number;
  hostelName: string;
  assignedDate?: string;
  createdAt?: string;
  status?: string;
}

const WARDENS_STORE_KEY = 'edu_db_hostel_wardens_v2';

const DEFAULT_INITIAL_WARDENS: WardenRecord[] = [
  { wardenId: 1, staffId: 1001, staffName: 'Dr. Eleanor Vance', wardenName: 'Dr. Eleanor Vance', employeeId: 'EMP-1001', designation: 'Senior Warden', department: 'Administration', email: 'eleanor.vance@school.edu', emailAddress: 'eleanor.vance@school.edu', phone: '+91 98765 43210', mobileNumber: '+91 98765 43210', hostelId: 1, hostelName: 'Ramachandra Bhavan Block', assignedDate: '2026-01-10', status: 'Active' },
  { wardenId: 2, staffId: 1002, staffName: 'Prof. Ramesh Sharma', wardenName: 'Prof. Ramesh Sharma', employeeId: 'EMP-1002', designation: 'Assistant Warden', department: 'Science', email: 'ramesh.sharma@school.edu', emailAddress: 'ramesh.sharma@school.edu', phone: '+91 98765 43211', mobileNumber: '+91 98765 43211', hostelId: 2, hostelName: 'Bhanu Block', assignedDate: '2026-01-15', status: 'Active' },
  { wardenId: 3, staffId: 1003, staffName: 'Mrs. Sunita Patel', wardenName: 'Mrs. Sunita Patel', employeeId: 'EMP-1003', designation: 'Resident Warden', department: 'Humanities', email: 'sunita.patel@school.edu', emailAddress: 'sunita.patel@school.edu', phone: '+91 98765 43212', mobileNumber: '+91 98765 43212', hostelId: 6, hostelName: 'Girls Block A', assignedDate: '2026-02-01', status: 'Active' }
];

const getStoredWardens = (): WardenRecord[] => {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_WARDENS;
  const stored = localStorage.getItem(WARDENS_STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return DEFAULT_INITIAL_WARDENS;
};

const saveStoredWardens = (data: WardenRecord[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WARDENS_STORE_KEY, JSON.stringify(data));
  }
};

export const getStaffCandidates = async (): Promise<StaffCandidate[]> => {
  try {
    const res = await hostelApiClient('/api/hostels/staff-candidates');
    if (Array.isArray(res) && res.length > 0) return res;
  } catch (e) {}

  return [
    { staffId: 1001, employeeId: 'EMP-1001', staffName: 'Dr. Eleanor Vance', designation: 'Senior Warden', department: 'Administration', email: 'eleanor.vance@school.edu', phone: '+91 98765 43210' },
    { staffId: 1002, employeeId: 'EMP-1002', staffName: 'Prof. Ramesh Sharma', designation: 'Assistant Warden', department: 'Science', email: 'ramesh.sharma@school.edu', phone: '+91 98765 43211' },
    { staffId: 1003, employeeId: 'EMP-1003', staffName: 'Mrs. Sunita Patel', designation: 'Resident Warden', department: 'Humanities', email: 'sunita.patel@school.edu', phone: '+91 98765 43212' },
    { staffId: 1004, employeeId: 'EMP-1004', staffName: 'Mr. Arvind Swamy', designation: 'Hostel Executive', department: 'Physical Ed', email: 'arvind.s@school.edu', phone: '+91 98765 43213' }
  ];
};

export const getWardens = async (): Promise<WardenRecord[]> => {
  let serverWardens: WardenRecord[] = [];
  try {
    const res = await hostelApiClient('/api/hostels/wardens');
    if (Array.isArray(res) && res.length > 0) serverWardens = res;
  } catch (e) {}

  const localWardens = getStoredWardens();
  const wardenMap = new Map<string, WardenRecord>();

  const normalizeWarden = (w: any): WardenRecord => {
    const wName = w.wardenName || w.staffName || w.name || 'Assigned Warden';
    const mobile = w.mobileNumber || w.phone || w.primaryMobileNumber || 'N/A';
    const mail = w.emailAddress || w.email || 'N/A';

    return {
      ...w,
      wardenId: Number(w.wardenId || w.id || 1),
      staffId: Number(w.staffId || w.employeeId || 1001),
      employeeId: w.employeeId || `EMP-${w.staffId || 1001}`,
      staffName: wName,
      wardenName: wName,
      phone: mobile,
      mobileNumber: mobile,
      email: mail,
      emailAddress: mail,
      hostelId: Number(w.hostelId || 1),
      hostelName: w.hostelName || 'Hostel Block'
    };
  };

  serverWardens.forEach(w => {
    const norm = normalizeWarden(w);
    wardenMap.set(norm.wardenId.toString(), norm);
  });

  localWardens.forEach(w => {
    const norm = normalizeWarden(w);
    wardenMap.set(norm.wardenId.toString(), norm);
  });

  return Array.from(wardenMap.values());
};

export const assignWarden = async (data: any) => {
  const current = getStoredWardens();
  const nextId = current.length > 0 ? Math.max(...current.map(w => Number(w.wardenId) || 0)) + 1 : 1;

  const blocks = getStoredHostelBlocks();
  const matchingBlock = blocks.find(b => Number(b.hostelId) === Number(data.hostelId));

  const newWarden: WardenRecord = {
    wardenId: nextId,
    staffId: Number(data.staffId) || 1001,
    staffName: data.staffName || 'Dr. Eleanor Vance',
    employeeId: data.employeeId || 'EMP-1001',
    designation: data.designation || 'Warden',
    department: data.department || 'Administration',
    email: data.email || 'warden@school.edu',
    phone: data.phone || '+91 98765 43210',
    hostelId: Number(data.hostelId) || 1,
    hostelName: data.hostelName || matchingBlock?.hostelName || 'Ramachandra Bhavan Block',
    assignedDate: data.assignedDate || new Date().toISOString().split('T')[0],
    status: 'Active'
  };

  const updated = [newWarden, ...current.filter(w => Number(w.hostelId) !== Number(newWarden.hostelId))];
  saveStoredWardens(updated);

  // Update block wardenName
  if (matchingBlock) {
    updateHostelBlock(matchingBlock.hostelId, { wardenName: newWarden.staffName });
  }

  try {
    const res = await hostelApiClient('/api/hostels/wardens', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res && res.wardenId) return res;
  } catch (e) {}

  return newWarden;
};

export const deleteWarden = async (id: number) => {
  const current = getStoredWardens();
  const updated = current.filter(w => Number(w.wardenId) !== Number(id));
  saveStoredWardens(updated);

  try {
    return await hostelApiClient(`/api/hostels/wardens/${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    return { success: true };
  }
};

// Persistent Local Storage Sync Layer for Hostel Allocations
const HOSTEL_ALLOCATIONS_STORE_KEY = 'edu_db_hostel_allocations';

const DEFAULT_INITIAL_ALLOCATIONS: BedAllocation[] = [
  {
    allocationId: 101,
    studentId: "STF-2026-0001",
    studentName: "Rajesh Kumar",
    admissionNo: "ADM-2026-101",
    hostelId: 1,
    hostelName: "Ramachandra Bhavan Block",
    roomId: 201,
    roomNumber: "101",
    bedNumber: "BED-1",
    joiningDate: "2026-06-01",
    status: "Active"
  },
  {
    allocationId: 102,
    studentId: "STF-2026-0002",
    studentName: "Surya Teja",
    admissionNo: "ADM-2026-102",
    hostelId: 1,
    hostelName: "Ramachandra Bhavan Block",
    roomId: 201,
    roomNumber: "101",
    bedNumber: "BED-2",
    joiningDate: "2026-06-01",
    status: "Active"
  },
  {
    allocationId: 103,
    studentId: "STF-2026-0003",
    studentName: "Dhanush Y",
    admissionNo: "ADM-2026-103",
    hostelId: 2,
    hostelName: "Hostel Block #2",
    roomId: 202,
    roomNumber: "102",
    bedNumber: "BED-1",
    joiningDate: "2026-06-05",
    status: "Active"
  },
  {
    allocationId: 104,
    studentId: "STF-2026-0006",
    studentName: "Ananya Roy",
    admissionNo: "ADM-2026-106",
    hostelId: 6,
    hostelName: "Girls Block A",
    roomId: 301,
    roomNumber: "G-101",
    bedNumber: "BED-1",
    joiningDate: "2026-06-10",
    status: "Active"
  }
];

const getStoredAllocations = (): BedAllocation[] => {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_ALLOCATIONS;
  const stored = localStorage.getItem(HOSTEL_ALLOCATIONS_STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      // Ignored
    }
  }
  return DEFAULT_INITIAL_ALLOCATIONS;
};

const saveStoredAllocations = (allocs: BedAllocation[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(HOSTEL_ALLOCATIONS_STORE_KEY, JSON.stringify(allocs));
  }
};

// 5. Student Bed Allocation API
export const getAllocations = async (): Promise<BedAllocation[]> => {
  let serverAllocs: BedAllocation[] = [];
  try {
    const res = await hostelApiClient('/api/hostels/allocations');
    if (Array.isArray(res)) serverAllocs = res;
  } catch (e) {
    // API offline fallback
  }

  const localAllocs = getStoredAllocations();
  const allocMap = new Map<string, BedAllocation>();

  // Add server allocations first
  serverAllocs.forEach(a => {
    const key = String(a.allocationId || `${a.studentId}_${a.hostelId}`);
    allocMap.set(key, a);
  });

  // Add local allocations (local blocks take priority)
  localAllocs.forEach(a => {
    const key = String(a.allocationId || `${a.studentId}_${a.hostelId}`);
    allocMap.set(key, a);
  });

  return Array.from(allocMap.values());
};

export const createAllocation = async (data: Partial<BedAllocation>) => {
  const current = getStoredAllocations();
  const nextId = current.length > 0 ? Math.max(...current.map(a => Number(a.allocationId) || 0)) + 1 : 101;
  
  const newAlloc: BedAllocation = {
    allocationId: nextId,
    studentId: data.studentId || `STF-2026-000${nextId}`,
    studentName: data.studentName || 'Student',
    admissionNo: data.admissionNo || `ADM-2026-${nextId}`,
    hostelId: Number(data.hostelId) || 1,
    hostelName: data.hostelName || 'Ramachandra Bhavan Block',
    roomId: Number(data.roomId) || 201,
    roomNumber: data.roomNumber || '101',
    bedNumber: data.bedNumber || 'BED-1',
    joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
    status: data.status || 'Active'
  };

  const updated = [newAlloc, ...current.filter(a => String(a.studentId) !== String(newAlloc.studentId))];
  saveStoredAllocations(updated);

  try {
    const res = await hostelApiClient('/api/hostels/allocations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res && res.allocationId) return res;
  } catch (e) {
    // API offline fallback
  }

  return newAlloc;
};

export const vacateAllocation = async (id: number | string) => {
  const current = getStoredAllocations();
  const updated = current.filter(a => String(a.allocationId) !== String(id));
  saveStoredAllocations(updated);

  try {
    return await hostelApiClient(`/api/hostels/allocations/${id}/vacate`, {
      method: 'PUT'
    });
  } catch (e) {
    return { success: true };
  }
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
