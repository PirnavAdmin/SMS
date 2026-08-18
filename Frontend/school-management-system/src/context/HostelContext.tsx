import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import {
  getHostelBlocks,
  createHostelBlock,
  updateHostelBlock,
  deleteHostelBlock,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllocations,
  createAllocation,
  vacateAllocation,
  HostelBlock as APIHostelBlock,
  HostelRoom as APIHostelRoom,
  BedAllocation as APIBedAllocation
} from '../api/hostel';
import { HostelBlock, HostelRoom, HostelBed } from '../types';

interface HostelContextType {
  hostelBlocks: HostelBlock[];
  hostelRooms: HostelRoom[];
  hostelBeds: HostelBed[];
  addHostelBlock: (block: Omit<HostelBlock, 'id'>) => Promise<void>;
  updateHostelBlock: (id: string, updates: Partial<HostelBlock>) => Promise<void>;
  deleteHostelBlock: (id: string) => Promise<void>;
  addHostelBed: (bed: Omit<HostelBed, 'id'>) => void;
  updateHostelBed: (id: string, updates: Partial<HostelBed>) => void;
  deleteHostelBed: (id: string) => void;
  refreshHostelData: () => Promise<void>;
}

const HostelContext = createContext<HostelContextType | undefined>(undefined);

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [blocks, setBlocks] = useState<APIHostelBlock[]>([]);
  const [rooms, setRooms] = useState<APIHostelRoom[]>([]);
  const [allocations, setAllocations] = useState<APIBedAllocation[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshHostelData = useCallback(async () => {
    try {
      setLoading(true);
      const [blocksData, roomsData, allocationsData] = await Promise.all([
        getHostelBlocks(),
        getRooms(),
        getAllocations()
      ]);
      setBlocks(blocksData || []);
      setRooms(roomsData || []);
      setAllocations(allocationsData || []);
    } catch (err: any) {
      console.error('Failed to load hostel data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHostelData();
  }, [refreshHostelData]);

  // Map to legacy models
  const hostelBlocks: HostelBlock[] = (blocks || [])
    .filter(b => b != null)
    .map(b => ({
      id: String(b.hostelId ?? (b as any).id ?? ''),
      name: b.hostelName || (b as any).name || 'Hostel Block',
      wardenName: b.wardenName || 'Unassigned',
      wardenPhone: b.primaryMobileNumber || 'N/A'
    }));

  const hostelRooms: HostelRoom[] = (rooms || [])
    .filter(r => r != null)
    .map(r => ({
      id: String(r.roomId ?? (r as any).id ?? ''),
      blockId: String(r.hostelId ?? (r as any).blockId ?? ''),
      roomNo: r.roomNumber || (r as any).roomNo || '',
      capacity: r.bedCapacity ?? (r as any).capacity ?? 0,
      occupiedBeds: r.occupiedBeds ?? 0,
      status: r.status === 'Active' ? ((r.vacantBeds ?? 0) > 0 ? 'Available' : 'Full') : 'Maintenance'
    }));

  // Dynamically generate beds based on room capacities and allocations
  const hostelBeds: HostelBed[] = [];
  (rooms || []).filter(r => r != null).forEach(r => {
    const cap = r.bedCapacity || 0;
    for (let i = 1; i <= cap; i++) {
      const bedNo = `Bed ${i}`;
      // Check if this specific bed is allocated
      const isOccupied = (allocations || []).some(
        a => a && a.roomId === r.roomId && a.bedNumber === bedNo && a.status === 'Active'
      );
      // Find occupying student name if any
      const studentName = (allocations || []).find(
        a => a && a.roomId === r.roomId && a.bedNumber === bedNo && a.status === 'Active'
      )?.studentName;

      hostelBeds.push({
        id: `bed_${r.roomId || '0'}_${i}`,
        roomId: String(r.roomId ?? ''),
        bedNo,
        status: isOccupied ? 'Occupied' : 'Available',
        studentName
      });
    }
  });

  const handleAddHostelBlock = async (blockData: Omit<HostelBlock, 'id'>) => {
    try {
      await createHostelBlock({
        hostelName: blockData.name,
        hostelCode: 'HST-' + Math.floor(100 + Math.random() * 900),
        hostelType: 'Mixed Hostel',
        wardenName: blockData.wardenName,
        primaryMobileNumber: blockData.wardenPhone,
        status: 'Active',
        address: ''
      });
      addToast('success', 'Hostel Block Added', 'Hostel block created successfully.');
      await refreshHostelData();
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to add hostel block.');
    }
  };

  const handleUpdateHostelBlock = async (id: string, updates: Partial<HostelBlock>) => {
    try {
      const numericId = parseInt(id);
      const original = blocks.find(b => b.hostelId === numericId);
      if (!original) return;

      await updateHostelBlock(numericId, {
        hostelName: updates.name || original.hostelName,
        hostelCode: original.hostelCode,
        hostelType: original.hostelType,
        wardenName: updates.wardenName !== undefined ? updates.wardenName : original.wardenName,
        primaryMobileNumber: updates.wardenPhone !== undefined ? updates.wardenPhone : original.primaryMobileNumber,
        status: original.status,
        address: original.address
      });
      addToast('success', 'Hostel Block Updated', 'Hostel block updated successfully.');
      await refreshHostelData();
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to update hostel block.');
    }
  };

  const handleDeleteHostelBlock = async (id: string) => {
    try {
      const numericId = parseInt(id);
      await deleteHostelBlock(numericId);
      addToast('success', 'Hostel Block Deleted', 'Hostel block deleted successfully.');
      await refreshHostelData();
    } catch (err: any) {
      addToast('error', 'API Error', err.message || 'Failed to delete hostel block.');
    }
  };

  // No-op stubs for beds CRUD as they are managed via rooms/room-types on backend
  const addHostelBed = () => {};
  const updateHostelBed = () => {};
  const deleteHostelBed = () => {};

  return (
    <HostelContext.Provider
      value={{
        hostelBlocks,
        hostelRooms,
        hostelBeds,
        addHostelBlock: handleAddHostelBlock,
        updateHostelBlock: handleUpdateHostelBlock,
        deleteHostelBlock: handleDeleteHostelBlock,
        addHostelBed,
        updateHostelBed,
        deleteHostelBed,
        refreshHostelData
      }}
    >
      {children}
    </HostelContext.Provider>
  );
};

export const useHostel = () => {
  const context = useContext(HostelContext);
  if (context === undefined) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return context;
};
