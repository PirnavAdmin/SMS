import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Edit, Trash2, Search, ChevronDown, Building2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';
import { SearchableSelect } from '../../common/SearchableSelect';
import { getRoomTypes, createRoomType, updateRoomType, deleteRoomType, getHostelBlocks, createRoom, RoomType, HostelBlock } from '../../../api/hostel';

interface CustomAllocation {
  categoryName: string;
  bedCapacity: number;
  count: number;
  acType: 'AC' | 'Non-AC';
}

interface FloorSharingConfig {
  floorIndex: number;
  floorLabel: string;
  singleSharing: number;
  singleAc: 'AC' | 'Non-AC';
  doubleSharing: number;
  doubleAc: 'AC' | 'Non-AC';
  tripleSharing: number;
  tripleAc: 'AC' | 'Non-AC';
  fourSharing: number;
  fourAc: 'AC' | 'Non-AC';
  customAllocations?: CustomAllocation[];
}

const getStoredFloorConfigs = (hostelId: string): FloorSharingConfig[] | null => {
  if (typeof window === 'undefined' || !hostelId) return null;
  const stored = localStorage.getItem(`edu_db_floor_sharing_config_${hostelId}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return null;
};

const saveStoredFloorConfigs = (hostelId: string, configs: FloorSharingConfig[]) => {
  if (typeof window !== 'undefined' && hostelId && configs && configs.length > 0) {
    localStorage.setItem(`edu_db_floor_sharing_config_${hostelId}`, JSON.stringify(configs));
  }
};

export const RoomTypeMasterView: React.FC = () => {
  const { addToast } = useToast();

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAcType, setFilterAcType] = useState('');
  const [manualFilterInput, setManualFilterInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRt, setEditingRt] = useState<RoomType | null>(null);
  const [deletingRt, setDeletingRt] = useState<RoomType | null>(null);

  // Modal Step Integration: Block & Floor Details
  const [activeModalTab, setActiveModalTab] = useState<'block' | 'sharing' | 'overview'>('block');
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [selectedFloorLevel, setSelectedFloorLevel] = useState<string>('');
  const [floorConfigs, setFloorConfigs] = useState<FloorSharingConfig[]>([]);
  const [formStatus, setFormStatus] = useState<string>('Active');
  const [formDescription, setFormDescription] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rtRes, bRes] = await Promise.all([getRoomTypes(), getHostelBlocks()]);
      const rtList = Array.isArray(rtRes) ? rtRes : (rtRes as any)?.data || [];
      const bList: HostelBlock[] = Array.isArray(bRes) ? bRes : (bRes as any)?.data || [];
      setRoomTypes(rtList);
      setBlocks(bList);
    } catch (err: any) {
      addToast(err?.message || 'Failed to load room type data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected hostel block object
  const selectedBlock = (blocks || []).find(b => b && b.hostelId !== undefined && b.hostelId !== null && String(b.hostelId) === selectedHostelId);

  // Initialize floor configurations when block selection changes
  const handleHostelChange = (hostelIdStr: string) => {
    setSelectedHostelId(hostelIdStr);
    setSelectedFloorLevel('');

    const blockObj = (blocks || []).find(b => b && b.hostelId !== undefined && b.hostelId !== null && String(b.hostelId) === hostelIdStr);
    if (!blockObj) {
      setFloorConfigs([]);
      return;
    }

    // Restore saved floor configs if present
    const saved = getStoredFloorConfigs(hostelIdStr);
    if (saved && saved.length > 0) {
      setFloorConfigs(saved);
      return;
    }

    const totalFloorsCount = Math.max(1, (blockObj as any).totalFloors || (blockObj as any).totalBuildingFloors || 4);
    const initialConfigs: FloorSharingConfig[] = Array.from({ length: totalFloorsCount }, (_, i) => {
      const floorIndex = i;
      const floorLabel = i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`;
      return {
        floorIndex,
        floorLabel,
        singleSharing: 0,
        singleAc: 'AC',
        doubleSharing: 0,
        doubleAc: 'Non-AC',
        tripleSharing: 0,
        tripleAc: 'Non-AC',
        fourSharing: 0,
        fourAc: 'Non-AC',
        customAllocations: []
      };
    });

    setFloorConfigs(initialConfigs);
    saveStoredFloorConfigs(hostelIdStr, initialConfigs);
  };

  const updateAndSaveFloorConfigs = (fn: (prev: FloorSharingConfig[]) => FloorSharingConfig[]) => {
    setFloorConfigs(prev => {
      const updated = fn(prev);
      if (selectedHostelId) {
        saveStoredFloorConfigs(selectedHostelId, updated);
      }
      return updated;
    });
  };

  const handleFloorConfigChange = (floorIndex: number, field: keyof FloorSharingConfig, value: any) => {
    updateAndSaveFloorConfigs(prev =>
      prev.map(fc => (fc.floorIndex === floorIndex ? { ...fc, [field]: value } : fc))
    );
  };

  const handleAcToggle = (floorIndex: number, field: 'singleAc' | 'doubleAc' | 'tripleAc' | 'fourAc') => {
    updateAndSaveFloorConfigs(prev =>
      prev.map(fc => {
        if (fc.floorIndex === floorIndex) {
          const currentVal = fc[field];
          return { ...fc, [field]: currentVal === 'AC' ? 'Non-AC' : 'AC' };
        }
        return fc;
      })
    );
  };

  const handleCustomAllocationChange = (floorIndex: number, customIdx: number, field: keyof CustomAllocation, value: any) => {
    updateAndSaveFloorConfigs(prev =>
      prev.map(fc => {
        if (fc.floorIndex === floorIndex) {
          const updatedCustom = [...(fc.customAllocations || [])];
          updatedCustom[customIdx] = { ...updatedCustom[customIdx], [field]: value };
          return { ...fc, customAllocations: updatedCustom };
        }
        return fc;
      })
    );
  };

  const handleAddCustomAllocation = (floorIndex: number) => {
    updateAndSaveFloorConfigs(prev =>
      prev.map(fc => {
        if (fc.floorIndex === floorIndex) {
          const updatedCustom = [...(fc.customAllocations || [])];
          updatedCustom.push({
            categoryName: 'Deluxe Executive Suite',
            bedCapacity: 2,
            count: 1,
            acType: 'AC'
          });
          return { ...fc, customAllocations: updatedCustom };
        }
        return fc;
      })
    );
  };

  const handleRemoveCustomAllocation = (floorIndex: number, customIdx: number) => {
    updateAndSaveFloorConfigs(prev =>
      prev.map(fc => {
        if (fc.floorIndex === floorIndex) {
          const updatedCustom = (fc.customAllocations || []).filter((_, idx) => idx !== customIdx);
          return { ...fc, customAllocations: updatedCustom };
        }
        return fc;
      })
    );
  };

  const handleOpenAdd = async () => {
    setEditingRt(null);
    setSelectedHostelId('');
    setSelectedFloorLevel('');
    setFloorConfigs([]);
    setFormStatus('Active');
    setFormDescription('');
    setActiveModalTab('block');
    
    try {
      const bList = await getHostelBlocks();
      if (Array.isArray(bList) && bList.length > 0) {
        setBlocks(bList);
      }
    } catch (e) {
      // Ignored
    }

    setIsModalOpen(true);
  };

  const handleOpenEdit = (rt: RoomType) => {
    setEditingRt(rt);
    setSelectedHostelId(rt.hostelId ? rt.hostelId.toString() : (blocks[0]?.hostelId.toString() || ''));
    setSelectedFloorLevel(rt.floorLevel || '');
    setFormStatus(rt.status || 'Active');
    setFormDescription(rt.description || '');
    if (blocks.length > 0) {
      handleHostelChange(rt.hostelId ? rt.hostelId.toString() : blocks[0].hostelId.toString());
    }
    setActiveModalTab('block');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBlock) {
      addToast('Please select a Hostel Block in Step 1.', 'warning');
      setActiveModalTab('block');
      return;
    }

    setIsSubmitting(true);
    try {
      let totalCreatedRooms = 0;
      let totalCreatedBeds = 0;

      // Iterate over each floor configuration and auto-create physical rooms & bed capacity
      for (const fc of floorConfigs) {
        let roomCounter = 1;

        const categoriesToProcess: Array<{ count: number; capacity: number; ac: 'AC' | 'Non-AC'; specName: string }> = [
          { count: fc.singleSharing, capacity: 1, ac: fc.singleAc, specName: `Single Sharing (${fc.singleAc})` },
          { count: fc.doubleSharing, capacity: 2, ac: fc.doubleAc, specName: `Double Sharing (${fc.doubleAc})` },
          { count: fc.tripleSharing, capacity: 3, ac: fc.tripleAc, specName: `Triple Sharing (${fc.tripleAc})` },
          { count: fc.fourSharing, capacity: 4, ac: fc.fourAc, specName: `Four Sharing (${fc.fourAc})` },
        ];

        (fc.customAllocations || []).forEach(ca => {
          if (ca.count > 0) {
            categoriesToProcess.push({
              count: ca.count,
              capacity: ca.bedCapacity,
              ac: ca.acType,
              specName: `${ca.categoryName} (${ca.acType})`
            });
          }
        });

        for (const cat of categoriesToProcess) {
          if (cat.count <= 0) continue;

          // Register or verify room type spec
          const existingRt = roomTypes.find(
            rt => rt.roomTypeSpecification.toLowerCase() === cat.specName.toLowerCase()
          );

          let activeRtId = existingRt?.roomTypeId || 0;

          if (!existingRt) {
            const newRtRes = await createRoomType({
              roomTypeSpecification: cat.specName,
              bedCapacity: cat.capacity,
              acType: cat.ac,
              description: `Auto-generated ${cat.specName} allocation for ${selectedBlock.hostelName}`,
              status: 'Active',
              hostelId: selectedBlock.hostelId,
              floorLevel: fc.floorLabel
            });

            if (newRtRes.success && newRtRes.data) {
              activeRtId = newRtRes.data.roomTypeId;
            }
          }

          // Auto-generate physical room numbers and bed capacity
          for (let i = 0; i < cat.count; i++) {
            const roomNumStr = `${fc.floorIndex}${roomCounter < 10 ? '0' + roomCounter : roomCounter}`;
            roomCounter++;

            await createRoom({
              hostelId: selectedBlock.hostelId,
              roomNumber: roomNumStr,
              floorLevel: fc.floorLabel,
              roomTypeId: activeRtId || 1,
              bedCapacity: cat.capacity,
              occupiedBeds: 0,
              vacantBeds: cat.capacity,
              status: 'Active'
            });

            totalCreatedRooms++;
            totalCreatedBeds += cat.capacity;
          }
        }
      }

      // If no floor matrix was set up, create default room type configuration
      if (totalCreatedRooms === 0) {
        const specName = `Standard Sharing (${selectedBlock.hostelName})`;
        await createRoomType({
          roomTypeSpecification: specName,
          bedCapacity: 2,
          acType: 'Non-AC',
          description: `Hostel room allocation for ${selectedBlock.hostelName}`,
          status: 'Active',
          hostelId: selectedBlock.hostelId,
          floorLevel: '1st Floor'
        });
      }

      addToast(
        editingRt
          ? 'Room sharing configuration updated successfully.'
          : `Successfully configured ${totalCreatedRooms} rooms (${totalCreatedBeds} beds capacity) for ${selectedBlock.hostelName}!`,
        'success'
      );

      saveStoredFloorConfigs(selectedBlock.hostelId.toString(), floorConfigs);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err?.message || 'Failed to save room sharing configuration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRt) return;
    try {
      const res = await deleteRoomType(deletingRt.roomTypeId);
      if (res.success) {
        addToast('Room type configuration deleted successfully.', 'success');
        loadData();
      } else {
        addToast(res.message || 'Failed to delete room type.', 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Error deleting room type.', 'error');
    } finally {
      setDeletingRt(null);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAcType]);

  const uniqueRoomTypes = Array.from(
    new Map(
      (roomTypes || []).map(rt => [
        `${(rt.roomTypeSpecification || '').toLowerCase().trim()}-${rt.acType}-${rt.bedCapacity}`,
        rt
      ])
    ).values()
  );

  const filtered = uniqueRoomTypes.filter(rt => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      rt.roomTypeSpecification?.toLowerCase().includes(q) ||
      (rt.description || '').toLowerCase().includes(q);

    let matchesAc = false;
    if (filterAcType === 'All') {
      matchesAc = true;
    } else if (filterAcType === 'AC' || filterAcType === 'Non-AC') {
      matchesAc = (rt.acType || '').toLowerCase() === filterAcType.toLowerCase();
    } else if (filterAcType === 'Custom' && manualFilterInput.trim()) {
      const mq = manualFilterInput.toLowerCase().trim();
      matchesAc = rt.roomTypeSpecification?.toLowerCase().includes(mq) ||
                  (rt.acType || '').toLowerCase().includes(mq) ||
                  (rt.description || '').toLowerCase().includes(mq);
    } else if (filterAcType && filterAcType !== 'Custom') {
      matchesAc = (rt.acType || '').toLowerCase() === filterAcType.toLowerCase();
    }

    if (q) return matchesSearch && (filterAcType ? matchesAc : true);
    if (filterAcType) return matchesAc;
    return false;
  });

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-end">
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Room Type
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by category or specification..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <div className="min-w-[220px] w-full sm:w-auto">
            <SearchableSelect
              value={filterAcType}
              onChange={val => {
                setFilterAcType(val);
                if (val !== 'Custom') setManualFilterInput('');
              }}
              placeholder="-- Select AC / Non-AC Option --"
              searchPlaceholder="Search option..."
              options={[
                { value: '', label: '-- Select AC / Non-AC Option --' },
                { value: 'All', label: 'All Categories (AC & Non-AC)' },
                { value: 'AC', label: 'AC Rooms' },
                { value: 'Non-AC', label: 'Non-AC Rooms' },
                { value: 'Custom', label: '✍️ Custom / Manual Entry' }
              ]}
            />
          </div>

          {filterAcType === 'Custom' && (
            <input
              type="text"
              placeholder="Type category (e.g. Deluxe)..."
              value={manualFilterInput}
              onChange={e => setManualFilterInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none w-full sm:w-56"
              autoFocus
            />
          )}
        </div>
      </div>

      {/* Empty State Prompt Card when filter is not selected */}
      {!filterAcType && !searchQuery.trim() ? (
        <div className="py-16 px-6 glass-card rounded-3xl border border-sky-300 dark:border-sky-800 text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select a Filter Option</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Please select an option from the dropdown above to view room categories.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Room Category</th>
                  <th className="py-3.5 px-5 text-center">Bed Capacity</th>
                  <th className="py-3.5 px-5 text-center">AC / NON AC</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 italic font-semibold">Loading room types...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 italic font-semibold">No room type configurations found matching filter.</td>
                  </tr>
                ) : (
                  paginated.map((rt, idx) => (
                    <tr key={`rt-row-${rt.roomTypeId || idx}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">{rt.roomTypeSpecification}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          {rt.bedCapacity} Beds
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${rt.acType === 'AC' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {rt.acType}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">{rt.description || 'No description provided'}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${rt.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {rt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(rt)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeletingRt(rt)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* CREATE / EDIT ROOM SHARING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRt ? 'Edit Room Sharing Config' : 'Create Room Sharing Config'}
              </h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Wizard Step Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveModalTab('block')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeModalTab === 'block' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                1. Block & Floor Setup
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('sharing')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeModalTab === 'sharing' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                2. Room Sharing & AC
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('overview')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs transition-all ${
                  activeModalTab === 'overview' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                3. Summary & Overview
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto max-h-[72vh] flex-1 px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* TAB 1: BLOCK & FLOOR DETAILS */}
              {activeModalTab === 'block' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Select Hostel Block <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      value={selectedHostelId}
                      onChange={handleHostelChange}
                      placeholder="Select Hostel Block..."
                      searchPlaceholder="Search hostel block..."
                      disabled={isSubmitting}
                      options={(blocks || [])
                        .filter(b => b != null)
                        .map((b, idx) => {
                          const bId = b.hostelId !== undefined && b.hostelId !== null ? String(b.hostelId) : String((b as any).id || idx);
                          const nameVal = b.hostelName || (b as any).name || (b as any).blockName || `Hostel Block #${bId}`;
                          return {
                            value: bId,
                            label: nameVal,
                            code: b.hostelCode || `BLK-${bId}`,
                            sublabel: `${b.hostelType || 'Hostel'} • ${b.totalFloors || 1} Floors`
                          };
                        })}
                    />
                    {selectedBlock && (
                      <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] grid grid-cols-2 gap-3 items-center">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Category</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedBlock.hostelType || 'Boys Hostel'}</span>
                        </div>
                        <div>
                          <label className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5">Total Floors in Block *</label>
                          <select
                            value={floorConfigs.length || selectedBlock.totalFloors || 3}
                            onChange={e => {
                              const newFloorsCount = parseInt(e.target.value) || 1;
                              selectedBlock.totalFloors = newFloorsCount;
                              (selectedBlock as any).totalBuildingFloors = newFloorsCount;                               const updatedConfigs: FloorSharingConfig[] = Array.from({ length: newFloorsCount }, (_, i) => {
                                const floorIndex = i;
                                const existing = floorConfigs.find(f => f.floorIndex === floorIndex);
                                if (existing) return existing;
                                const floorLabel = i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`;
                                return {
                                  floorIndex,
                                  floorLabel,
                                  singleSharing: 0,
                                  singleAc: 'AC',
                                  doubleSharing: 0,
                                  doubleAc: 'Non-AC',
                                  tripleSharing: 0,
                                  tripleAc: 'Non-AC',
                                  fourSharing: 0,
                                  fourAc: 'Non-AC',
                                  customAllocations: []
                                };
                              });
                              setFloorConfigs(updatedConfigs);
                            }}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-sky-600 dark:text-sky-400 outline-none text-xs"
                          >
                            {Array.from({ length: 30 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1} Floor{i > 0 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Select Floor Level
                    </label>
                    <div className="relative">
                      <select
                        value={selectedFloorLevel}
                        onChange={e => setSelectedFloorLevel(e.target.value)}
                        className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        disabled={!selectedBlock || isSubmitting}
                      >
                        {(() => {
                          const numFloors = Math.max(1, floorConfigs.length || selectedBlock?.totalFloors || 3);
                          return (
                            <>
                              <option value="">All Floors ({numFloors} Floors Configured)</option>
                              {Array.from({ length: numFloors }, (_, i) => {
                                const floorLabel = i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`;
                                return <option key={i} value={floorLabel}>{floorLabel}</option>;
                              })}
                            </>
                          );
                        })()}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FLOOR-BY-FLOOR ROOM SHARING & PER-SHARING AC SELECTION */}
              {activeModalTab === 'sharing' && (
                <div className="space-y-3.5 animate-in fade-in">
                  {!selectedBlock ? (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                      Please select a Hostel Block in Step 1 first to configure floor sharing and AC options.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {floorConfigs
                        .filter(fc => !selectedFloorLevel || fc.floorLabel === selectedFloorLevel)
                        .map((fc) => {
                          const customRoomsCount = (fc.customAllocations || []).reduce((acc, c) => acc + (c.count || 0), 0);
                          const customBedsCount = (fc.customAllocations || []).reduce((acc, c) => acc + ((c.count || 0) * (c.bedCapacity || 1)), 0);

                          const totalRoomsOnFloor = (fc.singleSharing || 0) + (fc.doubleSharing || 0) + (fc.tripleSharing || 0) + (fc.fourSharing || 0) + customRoomsCount;
                          const totalBedsOnFloor = (fc.singleSharing * 1) + (fc.doubleSharing * 2) + (fc.tripleSharing * 3) + (fc.fourSharing * 4) + customBedsCount;

                          const startRoomNum = fc.floorIndex === 0 ? '001' : `${fc.floorIndex}01`;
                          const endRoomNumStr = totalRoomsOnFloor < 10 ? `0${totalRoomsOnFloor}` : `${totalRoomsOnFloor}`;
                          const endRoomNum = fc.floorIndex === 0 ? `0${endRoomNumStr}` : `${fc.floorIndex}${endRoomNumStr}`;
                          const roomRangeText = totalRoomsOnFloor === 0 
                            ? 'No rooms allocated' 
                            : totalRoomsOnFloor === 1 
                              ? `Room #${startRoomNum}` 
                              : `Room #${startRoomNum} to #${endRoomNum}`;

                          return (
                            <div key={fc.floorIndex} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                    {fc.floorLabel}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                    {roomRangeText}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono">
                                  {totalRoomsOnFloor} Rooms ({totalBedsOnFloor} Beds Capacity)
                                </span>
                              </div>

                              {/* Per-Sharing Category & AC Selection Matrix */}
                              <div className="grid grid-cols-4 gap-2.5 text-center">
                                {/* 1-Share */}
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">1-Share (1 Bed)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    value={fc.singleSharing || ''}
                                    placeholder="0"
                                    onChange={e => handleFloorConfigChange(fc.floorIndex, 'singleSharing', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 rounded-lg text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAcToggle(fc.floorIndex, 'singleAc')}
                                    className={`w-full py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                                      fc.singleAc === 'AC' 
                                        ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {fc.singleAc === 'AC' ? 'AC Room' : 'Non-AC'}
                                  </button>
                                </div>

                                {/* 2-Share */}
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">2-Share (2 Beds)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    value={fc.doubleSharing || ''}
                                    placeholder="0"
                                    onChange={e => handleFloorConfigChange(fc.floorIndex, 'doubleSharing', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 rounded-lg text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAcToggle(fc.floorIndex, 'doubleAc')}
                                    className={`w-full py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                                      fc.doubleAc === 'AC' 
                                        ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {fc.doubleAc === 'AC' ? 'AC Room' : 'Non-AC'}
                                  </button>
                                </div>

                                {/* 3-Share */}
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">3-Share (3 Beds)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    value={fc.tripleSharing || ''}
                                    placeholder="0"
                                    onChange={e => handleFloorConfigChange(fc.floorIndex, 'tripleSharing', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 rounded-lg text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAcToggle(fc.floorIndex, 'tripleAc')}
                                    className={`w-full py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                                      fc.tripleAc === 'AC' 
                                        ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {fc.tripleAc === 'AC' ? 'AC Room' : 'Non-AC'}
                                  </button>
                                </div>

                                {/* 4-Share */}
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">4-Share (4 Beds)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    value={fc.fourSharing || ''}
                                    placeholder="0"
                                    onChange={e => handleFloorConfigChange(fc.floorIndex, 'fourSharing', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 rounded-lg text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAcToggle(fc.floorIndex, 'fourAc')}
                                    className={`w-full py-1 rounded-lg text-[10px] font-extrabold transition-all border ${
                                      fc.fourAc === 'AC' 
                                        ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {fc.fourAc === 'AC' ? 'AC Room' : 'Non-AC'}
                                  </button>
                                </div>
                              </div>

                              {/* Custom Room Categories with per-item AC toggle */}
                              {fc.customAllocations && fc.customAllocations.length > 0 && (
                                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Custom Categories:</span>
                                  {fc.customAllocations.map((ca, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                      <input
                                        type="text"
                                        placeholder="e.g. VIP Executive Room"
                                        value={ca.categoryName}
                                        onChange={e => handleCustomAllocationChange(fc.floorIndex, cIdx, 'categoryName', e.target.value)}
                                        className="flex-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
                                      />
                                      <div className="flex items-center gap-1 min-w-[85px]">
                                        <span className="text-[10px] text-slate-400 font-bold">Beds:</span>
                                        <input
                                          type="number"
                                          min={1}
                                          max={20}
                                          value={ca.bedCapacity}
                                          onChange={e => handleCustomAllocationChange(fc.floorIndex, cIdx, 'bedCapacity', Number(e.target.value))}
                                          className="w-10 px-1 py-1 rounded-lg text-center text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 min-w-[85px]">
                                        <span className="text-[10px] text-slate-400 font-bold">Rooms:</span>
                                        <input
                                          type="number"
                                          min={1}
                                          max={20}
                                          value={ca.count}
                                          onChange={e => handleCustomAllocationChange(fc.floorIndex, cIdx, 'count', Number(e.target.value))}
                                          className="w-10 px-1 py-1 rounded-lg text-center text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCustomAllocationChange(fc.floorIndex, cIdx, 'acType', ca.acType === 'AC' ? 'Non-AC' : 'AC')}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border ${
                                          ca.acType === 'AC'
                                            ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                      >
                                        {ca.acType}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCustomAllocation(fc.floorIndex, cIdx)}
                                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomAllocation(fc.floorIndex)}
                                  className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Custom Room Category for {fc.floorLabel}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUMMARY & OVERVIEW */}
              {activeModalTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in">
                  {!selectedBlock ? (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-semibold">
                      Please select a Hostel Block in Step 1 first to view summary & overview.
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {selectedBlock.hostelName}
                          </span>
                          <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-sky-600 text-white shadow-sm">
                            {selectedBlock.hostelCode}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Category</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBlock.hostelType || 'Boys Hostel'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Floors</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBlock.totalFloors || floorConfigs.length} Floors</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Location</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{selectedBlock.address || 'Main Campus'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Floor Breakdown Overview */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Floor-by-Floor Allocation Overview
                        </label>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {floorConfigs.map(fc => {
                            const customRoomsCount = (fc.customAllocations || []).reduce((acc, c) => acc + (c.count || 0), 0);
                            const customBedsCount = (fc.customAllocations || []).reduce((acc, c) => acc + ((c.count || 0) * (c.bedCapacity || 1)), 0);

                            const totalRoomsOnFloor = (fc.singleSharing || 0) + (fc.doubleSharing || 0) + (fc.tripleSharing || 0) + (fc.fourSharing || 0) + customRoomsCount;
                            const totalBedsOnFloor = (fc.singleSharing * 1) + (fc.doubleSharing * 2) + (fc.tripleSharing * 3) + (fc.fourSharing * 4) + customBedsCount;

                            const startRoomNum = `${fc.floorIndex}01`;
                            const endRoomNumStr = totalRoomsOnFloor < 10 ? `0${totalRoomsOnFloor}` : `${totalRoomsOnFloor}`;
                            const endRoomNum = `${fc.floorIndex}${endRoomNumStr}`;

                            return (
                              <div key={fc.floorIndex} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                    {fc.floorLabel} (Room #{startRoomNum} to #{endRoomNum})
                                  </span>
                                  <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                                    {totalRoomsOnFloor} Rooms • {totalBedsOnFloor} Beds
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                  {fc.singleSharing > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                                      1-Share: {fc.singleSharing} Rms ({fc.singleAc})
                                    </span>
                                  )}
                                  {fc.doubleSharing > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                                      2-Share: {fc.doubleSharing} Rms ({fc.doubleAc})
                                    </span>
                                  )}
                                  {fc.tripleSharing > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                                      3-Share: {fc.tripleSharing} Rms ({fc.tripleAc})
                                    </span>
                                  )}
                                  {fc.fourSharing > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                                      4-Share: {fc.fourSharing} Rms ({fc.fourAc})
                                    </span>
                                  )}
                                  {(fc.customAllocations || []).map((ca, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                                      {ca.categoryName}: {ca.count} Rms ({ca.acType})
                                    </span>
                                  ))}
                                  {totalRoomsOnFloor === 0 && (
                                    <span className="text-slate-400 italic">No room sharing configured for this floor</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Grand Totals Summary Box */}
                      {(() => {
                        let grandRooms = 0;
                        let grandBeds = 0;
                        let grandAcRooms = 0;
                        let grandNonAcRooms = 0;

                        floorConfigs.forEach(fc => {
                          const customRooms = (fc.customAllocations || []).reduce((acc, c) => acc + (c.count || 0), 0);
                          const customBeds = (fc.customAllocations || []).reduce((acc, c) => acc + ((c.count || 0) * (c.bedCapacity || 1)), 0);

                          const rooms = (fc.singleSharing || 0) + (fc.doubleSharing || 0) + (fc.tripleSharing || 0) + (fc.fourSharing || 0) + customRooms;
                          const beds = (fc.singleSharing * 1) + (fc.doubleSharing * 2) + (fc.tripleSharing * 3) + (fc.fourSharing * 4) + customBeds;

                          grandRooms += rooms;
                          grandBeds += beds;

                          if (fc.singleSharing > 0) {
                            if (fc.singleAc === 'AC') grandAcRooms += fc.singleSharing; else grandNonAcRooms += fc.singleSharing;
                          }
                          if (fc.doubleSharing > 0) {
                            if (fc.doubleAc === 'AC') grandAcRooms += fc.doubleSharing; else grandNonAcRooms += fc.doubleSharing;
                          }
                          if (fc.tripleSharing > 0) {
                            if (fc.tripleAc === 'AC') grandAcRooms += fc.tripleSharing; else grandNonAcRooms += fc.tripleSharing;
                          }
                          if (fc.fourSharing > 0) {
                            if (fc.fourAc === 'AC') grandAcRooms += fc.fourSharing; else grandNonAcRooms += fc.fourSharing;
                          }
                          (fc.customAllocations || []).forEach(ca => {
                            if (ca.acType === 'AC') grandAcRooms += (ca.count || 0); else grandNonAcRooms += (ca.count || 0);
                          });
                        });

                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Rooms</span>
                                <span className="font-mono text-base font-extrabold text-sky-400">{grandRooms}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Bed Capacity</span>
                                <span className="font-mono text-base font-extrabold text-emerald-400">{grandBeds}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">AC Rooms</span>
                                <span className="font-mono text-base font-extrabold text-cyan-300">{grandAcRooms}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Non-AC Rooms</span>
                                <span className="font-mono text-base font-extrabold text-amber-300">{grandNonAcRooms}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                              <div>
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Status <span className="text-rose-500">*</span></label>
                                <select
                                  value={formStatus}
                                  onChange={e => setFormStatus(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Description / Layout Note</label>
                                <input
                                  type="text"
                                  placeholder="Standard features, layout descriptions..."
                                  value={formDescription}
                                  onChange={e => setFormDescription(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* Modal Action Bar: Cancel on left, Back & Next/Save on right */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {activeModalTab === 'sharing' && (
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('block')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      ⬅ Back
                    </button>
                  )}

                  {activeModalTab === 'overview' && (
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('sharing')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      ⬅ Back
                    </button>
                  )}

                  {activeModalTab === 'block' && (
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('sharing')}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
                    >
                      Next ➔
                    </button>
                  )}

                  {activeModalTab === 'sharing' && (
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('overview')}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
                    >
                      Next ➔
                    </button>
                  )}

                  {activeModalTab === 'overview' && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRt && (
        <ConfirmModal
          isOpen={true}
          title="Delete Room Type Specification"
          message={`Are you sure you want to remove the "${deletingRt.roomTypeSpecification}" configuration?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRt(null)}
        />
      )}
    </div>
  );
};
