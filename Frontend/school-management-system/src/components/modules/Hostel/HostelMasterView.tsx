import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { getHostelBlocks, createHostelBlock, updateHostelBlock, deleteHostelBlock, getRooms, getAllocations, HostelBlock, HostelRoom, BedAllocation } from '../../../api/hostel';

export const HostelMasterView: React.FC = () => {
  const { addToast } = useToast();

  const [hostelMasters, setHostelMasters] = useState<HostelBlock[]>([]);
  const [roomMasters, setRoomMasters] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHostel, setEditingHostel] = useState<HostelBlock | null>(null);
  const [deletingHostel, setDeletingHostel] = useState<HostelBlock | null>(null);

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
    setForm({
      hostelName: '',
      hostelCode: 'HST-' + Math.floor(100 + Math.random() * 900),
      hostelType: 'Boys Hostel',
      address: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: HostelBlock) => {
    setEditingHostel(h);
    setForm({ ...h });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.hostelName || !form.hostelCode) {
      addToast('error', 'Validation Error', 'Please enter hostel name and code');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingHostel) {
        await updateHostelBlock(editingHostel.hostelId, {
          hostelName: form.hostelName,
          hostelCode: form.hostelCode,
          hostelType: form.hostelType,
          status: form.status || 'Active',
          address: form.address || ''
        });
        addToast('success', 'Hostel Updated', `${form.hostelName} updated successfully`);
      } else {
        await createHostelBlock({
          hostelName: form.hostelName,
          hostelCode: form.hostelCode,
          hostelType: form.hostelType,
          wardenName: 'Unassigned',
          primaryMobileNumber: 'N/A',
          alternateMobileNumber: '',
          email: '',
          status: form.status || 'Active',
          address: form.address || ''
        });
        addToast('success', 'Hostel Created', `${form.hostelName} created successfully`);
      }
      setIsModalOpen(false);
      fetchData();
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
    const matchesSearch = h.hostelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.hostelCode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Normalize type string for matching
    const typeKey = h.hostelType?.toLowerCase().replace(' hostel', '') || 'boys';
    const filterKey = filterType.toLowerCase();
    
    const matchesType = filterType === 'All' || typeKey === filterKey;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-500" /> Hostel Master Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure top-level hostel facilities. (Block Supervisors & Floor Wardens are managed under Blocks & Floors)</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Hostel
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Hostel Types</option>
            <option value="Boys">Boys</option>
            <option value="Girls">Girls</option>
            <option value="Co-Ed">Co-Ed</option>
          </select>
        </div>
      </div>

      {/* Hostels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading Hostels...</div>
        ) : filteredHostels.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No hostels found.</div>
        ) : (
          filteredHostels.map(h => {
            const hRooms = roomMasters.filter(r => r.hostelId === h.hostelId);
            const totalBeds = hRooms.reduce((acc, r) => acc + (r.bedCapacity || 0), 0);
            const activeAssignments = allocations.filter(a => a.status === 'Active' && hRooms.some(r => r.roomId === a.roomId)).length;

            return (
              <div key={h.hostelId} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400">{h.hostelCode}</span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{h.hostelName}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                    h.hostelType?.toLowerCase().includes('boys') ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                    h.hostelType?.toLowerCase().includes('girls') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingHostel ? 'Edit Hostel Master' : 'Create Hostel Facility'}</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Hostel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Xavier Boys Hostel"
                  value={form.hostelName || ''}
                  onChange={e => setForm({ ...form, hostelName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Hostel Code *</label>
                  <input
                    type="text"
                    required
                    value={form.hostelCode || ''}
                    onChange={e => setForm({ ...form, hostelCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Hostel Type</label>
                  <select
                    value={form.hostelType || 'Boys Hostel'}
                    onChange={e => setForm({ ...form, hostelType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                    disabled={isSubmitting}
                  >
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Girls Hostel">Girls Hostel</option>
                    <option value="Co-Ed Hostel">Co-Ed Hostel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Campus Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4, North Campus"
                  value={form.address || ''}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => !isSubmitting && setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl" disabled={isSubmitting}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : (editingHostel ? 'Update Hostel' : 'Save Hostel')}
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
