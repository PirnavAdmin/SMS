import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { getHostelBlocks, createHostelBlock, updateHostelBlock, deleteHostelBlock, getRooms, getAllocations, HostelBlock, HostelRoom, BedAllocation } from '../../../api/hostel';

interface FloorAlloc {
  floorIndex: number;
  floorLabel: string;
  share1: number;
  share2: number;
  share3: number;
  share4: number;
  vipRooms: number;
  vipBeds: number;
  isEditing?: boolean;
}

export const HostelMasterView: React.FC = () => {
  const { addToast } = useToast();

  const [hostelMasters, setHostelMasters] = useState<HostelBlock[]>([]);
  const [roomMasters, setRoomMasters] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHostel, setEditingHostel] = useState<HostelBlock | null>(null);
  const [deletingHostel, setDeletingHostel] = useState<HostelBlock | null>(null);
  const [isCustomFloors, setIsCustomFloors] = useState(false);
  const [floorAllocations, setFloorAllocations] = useState<FloorAlloc[]>([]);

  const generateFloorAllocations = (count: number, existing?: FloorAlloc[]) => {
    const result: FloorAlloc[] = [];
    for (let i = 1; i <= count; i++) {
      const existingFloor = existing?.find(f => f.floorIndex === i);
      if (existingFloor) {
        result.push(existingFloor);
      } else {
        const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
        const label = i === 1 ? '1st Floor' : `${i}${suffix} Floor`;
        result.push({
          floorIndex: i,
          floorLabel: label,
          share1: 0,
          share2: 4,
          share3: 0,
          share4: 0,
          vipRooms: 0,
          vipBeds: 1,
          isEditing: false
        });
      }
    }
    return result;
  };

  const [form, setForm] = useState<Partial<HostelBlock>>({
    hostelName: '',
    hostelCode: '',
    hostelType: 'Boys Hostel',
    address: '',
    status: 'Active'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [blocksData, roomsData, allocationsData] = await Promise.all([
        getHostelBlocks(),
        getRooms(),
        getAllocations()
      ]);
      setHostelMasters(blocksData);
      setRoomMasters(roomsData);
      setAllocations(allocationsData);
    } catch (error: any) {
      addToast('error', 'Failed to load data', error.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingHostel(null);
    setIsCustomFloors(false);
    setForm({
      hostelName: '',
      hostelCode: '',
      hostelType: '',
      address: '',
      status: 'Active',
      totalFloors: ''
    } as any);
    setFloorAllocations(generateFloorAllocations(1));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: HostelBlock) => {
    setEditingHostel(h);
    const fl = h.totalFloors || (h as any).totalBuildingFloors || 1;
    setIsCustomFloors(fl > 30);
    setForm({
      ...h,
      totalFloors: fl
    } as any);
    setFloorAllocations(generateFloorAllocations(fl));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.hostelName || !form.hostelCode) {
      addToast('error', 'Validation Error', 'Please enter hostel name and code');
      return;
    }

    const floorsVal = (form as any).totalFloors || 4;

    try {
      setIsSubmitting(true);
      if (editingHostel) {
        await updateHostelBlock(editingHostel.hostelId, {
          hostelName: form.hostelName,
          hostelCode: form.hostelCode,
          hostelType: form.hostelType,
          totalFloors: floorsVal,
          status: form.status || 'Active',
          address: form.address || ''
        });

        // Update local state for immediate UI feedback
        setHostelMasters(prev => prev.map(b => b.hostelId === editingHostel.hostelId ? {
          ...b,
          hostelName: form.hostelName!,
          hostelCode: form.hostelCode!,
          hostelType: form.hostelType!,
          totalFloors: floorsVal,
          address: form.address || ''
        } : b));

        addToast('success', 'Hostel Updated', `${form.hostelName} updated successfully`);
      } else {
        await createHostelBlock({
          hostelName: form.hostelName,
          hostelCode: form.hostelCode,
          hostelType: form.hostelType,
          totalFloors: floorsVal,
          wardenName: 'Unassigned',
          primaryMobileNumber: 'N/A',
          alternateMobileNumber: '',
          email: '',
          status: form.status || 'Active',
          address: form.address || ''
        });

        fetchData();
        addToast('success', 'Hostel Created', `${form.hostelName} created successfully`);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      addToast('error', 'Failed to save hostel', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deletingHostel) {
      try {
        await deleteHostelBlock(deletingHostel.hostelId);
        addToast('success', 'Hostel Deleted', 'The hostel was deleted successfully.');
        fetchData();
      } catch (error: any) {
        addToast('error', 'Delete Failed', error.message);
      } finally {
        setDeletingHostel(null);
      }
    }
  };

  const toggleStatus = async (h: HostelBlock) => {
    try {
      const newStatus = h.status === 'Active' ? 'Inactive' : 'Active';
      await updateHostelBlock(h.hostelId, { status: newStatus });
      addToast('success', 'Status Updated', `Hostel is now ${newStatus}`);
      fetchData();
    } catch (error: any) {
      addToast('error', 'Update Failed', error.message);
    }
  };

  const filteredHostels = hostelMasters.filter(h => {
    const displayTitle = h.hostelName || (h as any).name || (h as any).blockName || `Block #${h.hostelId}`;

    const matchesSearch = displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.hostelCode || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      !filterType ||
      filterType === 'All' ||
      displayTitle.toLowerCase().includes(filterType.toLowerCase()) ||
      (h.hostelType || '').toLowerCase().includes(filterType.toLowerCase());

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-500" /> Hostels
          </h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Hostel Block
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">Filter:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="">Select Hostel...</option>
            <option value="All">All Hostels</option>
            {hostelMasters.map(h => {
              const displayTitle = h.hostelName || (h as any).name || (h as any).blockName || `Block #${h.hostelId}`;
              return (
                <option key={h.hostelId} value={displayTitle}>
                  {displayTitle} ({h.hostelCode || 'HST-01'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Empty State Prompt if no filter selected and no search query */}
      {!filterType && !searchQuery.trim() ? (
        <div className="py-16 px-6 glass-card rounded-3xl border border-sky-200/80 dark:border-sky-900/50 text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select a Hostel</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Please select a hostel option from the filter dropdown above to render operational hostel blocks.
            </p>
          </div>
        </div>
      ) : (
        /* Hostels Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-semibold italic">Loading Hostels...</div>
          ) : filteredHostels.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-semibold italic">No hostels found for this category.</div>
          ) : (
            filteredHostels.map(h => {
              const hRooms = roomMasters.filter(r => r.hostelId === h.hostelId);
              const totalBeds = hRooms.reduce((acc, r) => acc + (r.bedCapacity || 0), 0);
              const activeAssignments = allocations.filter(a => a.status === 'Active' && hRooms.some(r => r.roomId === a.roomId)).length;

              const displayTitle = h.hostelName || (h as any).name || (h as any).blockName || `Block #${h.hostelId}`;

              return (
                <div key={h.hostelId} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400">{h.hostelCode}</span>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">{displayTitle}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                      h.hostelType?.toLowerCase().includes('boys') ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                      h.hostelType?.toLowerCase().includes('girls') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}>
                      {h.hostelType}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-500 line-clamp-2">Enterprise hostel facility with block-level supervision and floor wardens.</p>
                    <p className="text-slate-400 font-medium">📍 {h.address || 'Campus Facility Area 1'}</p>
                  </div>

                  {/* Occupancy Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Rooms</span>
                      <span className="font-extrabold text-slate-900 dark:text-white font-mono">{hRooms.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Beds</span>
                      <span className="font-extrabold text-slate-900 dark:text-white font-mono">{totalBeds}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Occupied</span>
                      <span className="font-extrabold text-emerald-600 font-mono">{activeAssignments}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleStatus(h)}
                      className={`flex items-center gap-1 font-bold ${h.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {h.status === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{h.status}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenEdit(h)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingHostel(h)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingHostel ? 'Edit Hostel Block' : 'Add New Hostel Block'}</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Block Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boys Residence - Block A"
                  value={form.hostelName || ''}
                  onChange={e => setForm({ ...form, hostelName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1">Block Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLK-A"
                    value={form.hostelCode || ''}
                    onChange={e => setForm({ ...form, hostelCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category <span className="text-rose-500">*</span></label>
                  <select
                    value={form.hostelType || ''}
                    onChange={e => setForm({ ...form, hostelType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>Select Category...</option>
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Girls Hostel">Girls Hostel</option>
                    <option value="Co-Ed Hostel">Co-Ed Hostel</option>
                    <option value="Senior Student Hostel">Senior Student Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Total Floors <span className="text-rose-500">*</span></label>
                  <select
                    value={(form as any).totalFloors || ''}
                    onChange={e => setForm({ ...form, totalFloors: parseInt(e.target.value) || 1 } as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>Select Floors...</option>
                    {Array.from({ length: 30 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} Floor{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. North Campus, Block A"
                  value={form.address || ''}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium text-slate-900 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => !isSubmitting && setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" disabled={isSubmitting}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingHostel}
        onCancel={() => setDeletingHostel(null)}
        onConfirm={handleDelete}
        title="Delete Hostel Master"
        message={`Are you sure you want to delete ${deletingHostel?.hostelName}?`}
      />
    </div>
  );
};
