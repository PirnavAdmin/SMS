import React, { useState, useEffect, useCallback } from 'react';
import { Home, Plus, Edit, Trash2, Search, Building2, CheckCircle2, AlertTriangle, XCircle, Users, Layers } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { getRooms, createRoom, updateRoom, deleteRoom, getHostelBlocks, getRoomTypes, HostelRoom, HostelBlock, RoomType } from '../../../api/hostel';

export const RoomMasterView: React.FC = () => {
  const { addToast } = useToast();

  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

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

      if (blocksData.length > 0) setFormHostelId(blocksData[0].hostelId.toString());
      if (rtsData.length > 0) setFormRoomTypeId(rtsData[0].roomTypeId.toString());
      
    } catch (error: any) {
      addToast('error', 'Failed to load room data', error.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormRoomNumber('101');
    setFormFloorLevel('1st Floor');
    setFormStatus('Active');
    
    if (blocks.length > 0) setFormHostelId(blocks[0].hostelId.toString());
    if (roomTypes.length > 0) setFormRoomTypeId(roomTypes[0].roomTypeId.toString());
    
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
      fetchData(); // refresh grid
    } catch (error: any) {
      addToast('error', editingRoom ? 'Update Failed' : 'Creation Failed', error.message);
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
    const matchQuery = rm.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rm.hostelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rm.roomTypeSpecification?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || rm.hostelId.toString() === filterHostel;
    return matchQuery && matchHostel;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-sky-500" /> Rooms
          </h2>
          </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search room number, hostel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterHostel}
            onChange={e => setFilterHostel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Hostels</option>
            {blocks.map(h => <option key={h.hostelId} value={h.hostelId.toString()}>{h.hostelName}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-bold">Loading rooms...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-bold">No rooms found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map(rm => (
            <div key={rm.roomId} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingRoom ? 'Edit Room' : 'Create Room'}</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Hostel Block *</label>
                <select
                  value={formHostelId}
                  onChange={e => setFormHostelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  disabled={isSubmitting}
                  required
                >
                  <option value="" disabled>Select Hostel Block</option>
                  {blocks.map(h => <option key={h.hostelId} value={h.hostelId.toString()}>{h.hostelName}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Floor Level *</label>
                <select 
                  value={formFloorLevel} 
                  onChange={e => setFormFloorLevel(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600"
                  disabled={isSubmitting}
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                  <option value="4th Floor">4th Floor</option>
                  <option value="5th Floor">5th Floor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formRoomNumber}
                    onChange={e => setFormRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Room Category *</label>
                  <select 
                    value={formRoomTypeId} 
                    onChange={e => setFormRoomTypeId(e.target.value)} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>Select Type</option>
                    {roomTypes.map(rt => <option key={rt.roomTypeId} value={rt.roomTypeId.toString()}>{rt.roomTypeSpecification} (Cap: {rt.bedCapacity})</option>)}
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : (editingRoom ? 'Update Room' : 'Save Room')}
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
