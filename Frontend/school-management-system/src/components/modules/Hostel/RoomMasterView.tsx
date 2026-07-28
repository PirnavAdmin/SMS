import React, { useState } from 'react';
import { Home, Plus, Edit, Trash2, Search, Building2, CheckCircle2, AlertTriangle, XCircle, Users } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { RoomMaster } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const RoomMasterView: React.FC = () => {
  const { hostelMasters, roomTypeMasters, roomMasters, addRoomMaster, updateRoomMaster, deleteRoomMaster, studentHostelAssignments } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomMaster | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomMaster | null>(null);

  const [form, setForm] = useState<Partial<RoomMaster>>({
    hostelId: hostelMasters[0]?.id || '',
    hostelName: hostelMasters[0]?.hostelName || '',
    floor: '1st Floor',
    roomNumber: '101',
    roomTypeId: roomTypeMasters[0]?.id || '',
    roomTypeName: roomTypeMasters[0]?.roomTypeName || '',
    capacity: roomTypeMasters[0]?.capacity || 2,
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingRoom(null);
    const defaultRt = roomTypeMasters[0];
    setForm({
      hostelId: hostelMasters[0]?.id || '',
      hostelName: hostelMasters[0]?.hostelName || '',
      floor: '1st Floor',
      roomNumber: String(100 + Math.floor(1 + Math.random() * 90)),
      roomTypeId: defaultRt?.id || '',
      roomTypeName: defaultRt?.roomTypeName || 'Double Sharing',
      capacity: defaultRt?.capacity || 2,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rm: RoomMaster) => {
    setEditingRoom(rm);
    setForm(rm);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.hostelId || !form.roomNumber) {
      addToast('error', 'Validation Error', 'Please select hostel and enter room number');
      return;
    }

    const hObj = hostelMasters.find(h => h.id === form.hostelId);

    const roomData = {
      ...form,
      hostelName: hObj?.hostelName || form.hostelName || 'Hostel Block',
      roomTypeName: undefined,
      capacity: undefined
    };

    if (editingRoom) {
      updateRoomMaster(editingRoom.id, roomData);
      addToast('success', 'Room Master Updated');
    } else {
      addRoomMaster(roomData as Omit<RoomMaster, 'id'>);
      addToast('success', 'Room Master Created');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingRoom) {
      deleteRoomMaster(deletingRoom.id);
      addToast('success', 'Room Master Deleted');
      setDeletingRoom(null);
    }
  };

  const filteredRooms = roomMasters.filter(rm => {
    const rtObj = roomTypeMasters.find(rt => rt.id === rm.roomTypeId);
    const rName = rtObj ? rtObj.roomTypeName : (rm.roomTypeName || '');
    const matchQuery = rm.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rm.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || rm.hostelId === filterHostel;
    return matchQuery && matchHostel;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-indigo-500" /> Room Master Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage individual hostel rooms, floor levels, bed capacities, and dynamic live occupancy engine</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Room Record
        </button>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search room number, hostel, room type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterHostel}
          onChange={e => setFilterHostel(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none"
        >
          <option value="All">All Hostels ({hostelMasters.length})</option>
          {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName}</option>)}
        </select>
      </div>

      {/* Grid of Room Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(rm => {
          const rtObj = roomTypeMasters.find(rt => rt.id === rm.roomTypeId);
          const roomTypeName = rtObj ? rtObj.roomTypeName : (rm.roomTypeName || 'Standard Room');
          const capacity = rtObj ? rtObj.capacity : (rm.capacity || 2);
          const currentOccupancy = studentHostelAssignments.filter(a => (a.roomId === rm.id || a.roomNo === rm.roomNumber) && a.status === 'Active').length;
          const availableBeds = Math.max(0, capacity - currentOccupancy);
          const occupancyPct = Math.min(100, Math.round((currentOccupancy / capacity) * 100));

          return (
            <div key={rm.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px]">
                    {rm.floor}
                  </span>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mt-1">Room #{rm.roomNumber}</h3>
                  <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{rm.hostelName}</p>
                </div>

                {rm.status === 'Active' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">Active</span>
                ) : rm.status === 'Maintenance' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">Maintenance</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px]">Inactive</span>
                )}
              </div>

              {/* Room Spec & Occupancy */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Room Type:</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{roomTypeName}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Capacity / Occupancy:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{currentOccupancy} / {capacity} Beds</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Available Vacant Beds:</span>
                  <span className={`font-black ${availableBeds > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {availableBeds} Vacant
                  </span>
                </div>

                {/* Progress Indicator */}
                <div className="space-y-1 pt-1">
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        occupancyPct >= 100 ? 'bg-rose-500' : occupancyPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Occupancy Rate</span>
                    <span>{occupancyPct}%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button onClick={() => handleOpenEdit(rm)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeletingRoom(rm)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-500" />
              {editingRoom ? 'Edit Room Master' : 'Add Room Master'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Block *</label>
                <select
                  required
                  value={form.hostelId}
                  onChange={e => {
                    const hObj = hostelMasters.find(h => h.id === e.target.value);
                    setForm({ ...form, hostelId: e.target.value, hostelName: hObj?.hostelName || '' });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  {hostelMasters.map(h => (
                    <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Floor Level *</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="e.g. Ground Floor, 1st Floor"
                    value={form.floor || ''}
                    onChange={e => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="101"
                    value={form.roomNumber}
                    onChange={e => setForm({ ...form, roomNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Room Type *</label>
                  <select
                    value={form.roomTypeId}
                    onChange={e => {
                      const rtObj = roomTypeMasters.find(rt => rt.id === e.target.value);
                      setForm({
                        ...form,
                        roomTypeId: e.target.value,
                        roomTypeName: rtObj?.roomTypeName || '',
                        capacity: rtObj ? rtObj.capacity : 2
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    {roomTypeMasters
                      .filter(rt => rt.status === 'Active' || rt.id === form.roomTypeId)
                      .map(rt => (
                        <option key={rt.id} value={rt.id}>
                          {rt.roomTypeName} ({rt.acType || 'Non-AC'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20">
                  Save Room Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingRoom && (
        <ConfirmModal
          isOpen={true}
          title="Delete Room Record"
          message={`Are you sure you want to delete Room #${deletingRoom.roomNumber}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRoom(null)}
        />
      )}
    </div>
  );
};
