import React, { useState, useEffect, useCallback } from 'react';
import { Home, Plus, Edit, Trash2, Search, Building2, CheckCircle2, AlertTriangle, XCircle, Users, Layers } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';
import { getRooms, createRoom, updateRoom, deleteRoom, getHostelBlocks, getRoomTypes, HostelRoom, HostelBlock, RoomType } from '../../../api/hostel';

interface RoomMasterViewProps {
  selectedHostelFilter?: string;
  onHostelFilterChange?: (hostelId: string) => void;
}

export const RoomMasterView: React.FC<RoomMasterViewProps> = ({ selectedHostelFilter, onHostelFilterChange }) => {
  const { addToast } = useToast();

  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostelState, setFilterHostelState] = useState('');
  const filterHostel = selectedHostelFilter !== undefined ? selectedHostelFilter : filterHostelState;
  const setFilterHostel = onHostelFilterChange || setFilterHostelState;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<HostelRoom | null>(null);

  const [formHostelId, setFormHostelId] = useState('');
  const [formFloorLevel, setFormFloorLevel] = useState('1st Floor');
  const [formRoomNumber, setFormRoomNumber] = useState('');
  const [formRoomTypeId, setFormRoomTypeId] = useState('');
  const [formStatus, setFormStatus] = useState('Active');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsData, blocksData, rtsData] = await Promise.all([
        getRooms(),
        getHostelBlocks(),
        getRoomTypes()
      ]);
      setRooms(roomsData);
      setBlocks(blocksData);
      setRoomTypes(rtsData);
    } catch (error: any) {
      addToast('error', 'Failed to load room data', error.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = async () => {
    setEditingRoom(null);
    setFormHostelId('');
    setFormFloorLevel('');
    setFormRoomNumber('');
    setFormRoomTypeId('');
    setFormStatus('Active');

    try {
      const blocksData = await getHostelBlocks();
      if (Array.isArray(blocksData) && blocksData.length > 0) {
        setBlocks(blocksData);
      }
    } catch (e) {
      // Ignored
    }

    setIsModalOpen(true);
  };

  const handleOpenEdit = (rm: HostelRoom) => {
    setEditingRoom(rm);
    setFormHostelId(rm.hostelId.toString());
    setFormFloorLevel(rm.floorLevel || '1st Floor');
    setFormRoomNumber(rm.roomNumber || '');
    setFormRoomTypeId(rm.roomTypeId.toString());
    setFormStatus(rm.status || 'Active');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formHostelId || !formRoomNumber || !formRoomTypeId) {
      addToast('error', 'Validation Error', 'Please complete all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        hostelId: Number(formHostelId),
        roomTypeId: Number(formRoomTypeId),
        floorLevel: formFloorLevel,
        roomNumber: formRoomNumber,
        status: formStatus
      };

      if (editingRoom) {
        await updateRoom(editingRoom.roomId, payload);
        addToast('success', 'Room Updated', `Room ${formRoomNumber} updated successfully.`);
      } else {
        await createRoom(payload);
        addToast('success', 'Room Created', `Room ${formRoomNumber} created successfully.`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      addToast('error', 'Operation Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deletingRoom) {
      try {
        await deleteRoom(deletingRoom.roomId);
        addToast('success', 'Room Deleted', 'Room deleted successfully.');
        fetchData();
      } catch (error: any) {
        addToast('error', 'Delete Failed', error.message);
      } finally {
        setDeletingRoom(null);
      }
    }
  };

  const filteredRooms = rooms.filter(rm => {
    const matchQuery = !searchQuery.trim() ||
                       rm.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rm.hostelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rm.roomTypeSpecification?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = !filterHostel || filterHostel === 'All' || rm.hostelId.toString() === filterHostel;
    return matchQuery && matchHostel;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-sky-500" /> Rooms & Bed Allocation
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search room number, hostel..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">Filter:</span>
          <select
            value={filterHostel}
            onChange={e => { setFilterHostel(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="">Select Hostel...</option>
            <option value="All">All Hostels</option>
            {(blocks || [])
              .filter(h => h != null)
              .map((h, idx) => {
                const idVal = h.hostelId !== undefined && h.hostelId !== null ? String(h.hostelId) : String((h as any).id || idx);
                const nameVal = h.hostelName || (h as any).name || `Hostel Block #${idVal}`;
                return (
                  <option key={`filter_h_${idVal}_${idx}`} value={idVal}>
                    {nameVal}
                  </option>
                );
              })}
          </select>
        </div>
      </div>

      {!filterHostel && !searchQuery.trim() ? (
        <div className="py-16 px-6 glass-card rounded-3xl border border-sky-200/80 dark:border-sky-900/50 text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-inner">
            <Home className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select a Hostel</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Please select a hostel option from the filter dropdown above to view room allocations.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-slate-400 font-bold">Loading rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-bold">No rooms found.</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedRooms.map((rm, idx) => (
              <div key={`rm-card-${rm.roomId || idx}-${rm.roomNumber || idx}-${idx}`} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400">Room #{rm.roomNumber}</span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{rm.hostelName}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    {rm.roomTypeSpecification || 'Standard Room'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-500">Hierarchy: <strong className="text-slate-900 dark:text-white font-bold">{rm.hostelName} → {rm.floorLevel}</strong></p>
                  <p className="text-slate-500">Capacity: <strong className="text-emerald-600 font-mono font-bold">{rm.occupiedBeds || 0} / {rm.bedCapacity} Beds Occupied</strong></p>
                  <p className="text-slate-500">Vacant: <strong className="text-amber-600 font-mono font-bold">{rm.vacantBeds} Beds Vacant</strong></p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button onClick={() => handleOpenEdit(rm)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setDeletingRoom(rm)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Hostel Block <span className="text-rose-500">*</span></label>
                <select
                  value={formHostelId}
                  onChange={e => {
                    setFormHostelId(e.target.value);
                    setFormFloorLevel('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  disabled={isSubmitting}
                  required
                >
                  <option value="" disabled>Select Hostel Block...</option>
                  {(blocks || [])
                    .filter(h => h != null)
                    .map((h, idx) => {
                      const idVal = h.hostelId !== undefined && h.hostelId !== null ? String(h.hostelId) : String((h as any).id || idx);
                      const nameVal = h.hostelName || (h as any).name || `Hostel Block #${idVal}`;
                      return (
                        <option key={`form_h_${idVal}_${idx}`} value={idVal}>
                          {nameVal}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Floor Level <span className="text-rose-500">*</span></label>
                {(() => {
                  const selBlock = (blocks || []).find(b => b && b.hostelId !== undefined && String(b.hostelId) === formHostelId);
                  let floorList: string[] = [];
                  if (selBlock) {
                    const stored = localStorage.getItem(`edu_db_floor_sharing_config_${selBlock.hostelId}`);
                    if (stored) {
                      try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          floorList = parsed.map((f: any) => f.floorLabel || `Floor #${f.floorIndex + 1}`);
                        }
                      } catch (e) {}
                    }
                    if (floorList.length === 0) {
                      const count = Math.max(1, Number((selBlock as any).totalFloors || (selBlock as any).totalBuildingFloors || 2));
                      floorList = Array.from({ length: count }, (_, i) =>
                        i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`
                      );
                    }
                  }

                  return (
                    <select 
                      value={formFloorLevel} 
                      onChange={e => setFormFloorLevel(e.target.value)} 
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                      disabled={isSubmitting || !formHostelId}
                      required
                    >
                      <option value="" disabled>{!formHostelId ? 'Select Hostel Block first...' : 'Select Floor Level...'}</option>
                      {floorList.map((fl, idx) => (
                        <option key={`fl_opt_${idx}`} value={fl}>
                          {fl}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Room Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101"
                    value={formRoomNumber}
                    onChange={e => setFormRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assigned Room Sharing <span className="text-rose-500">*</span></label>
                  <select 
                    value={formRoomTypeId} 
                    onChange={e => setFormRoomTypeId(e.target.value)} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>Select room sharing...</option>
                    {Array.from(
                      new Map(
                        (roomTypes || []).map(rt => [
                          `${(rt.roomTypeSpecification || '').toLowerCase().trim()}-${rt.acType}-${rt.bedCapacity}`,
                          rt
                        ])
                      ).values()
                    ).map(rt => (
                      <option key={rt.roomTypeId} value={rt.roomTypeId.toString()}>
                        {rt.roomTypeSpecification} (Cap: {rt.bedCapacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select 
                  value={formStatus} 
                  onChange={e => setFormStatus(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  disabled={isSubmitting}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRoom && (
        <ConfirmModal
          isOpen={true}
          onCancel={() => setDeletingRoom(null)}
          onConfirm={handleDelete}
          title="Delete Room"
          message={`Delete room ${deletingRoom.roomNumber}?`}
        />
      )}
    </div>
  );
};
