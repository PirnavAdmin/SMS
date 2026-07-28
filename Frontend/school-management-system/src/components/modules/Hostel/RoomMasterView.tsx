import React, { useState } from 'react';
import { Home, Plus, Edit, Trash2, Search, Building2, CheckCircle2, AlertTriangle, XCircle, Users, Layers } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { RoomMaster } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';
import { initialHostelBlocks } from './HostelBlocksView';
import { initialHostelFloors } from './HostelFloorsView';

export const RoomMasterView: React.FC = () => {
  const { hostelMasters, roomTypeMasters, roomMasters, addRoomMaster, updateRoomMaster, deleteRoomMaster, studentHostelAssignments } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomMaster | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomMaster | null>(null);

  const [formHostelId, setFormHostelId] = useState(hostelMasters[0]?.id || '1');
  const [formBlockId, setFormBlockId] = useState(initialHostelBlocks[0]?.id || 'blk-1');
  const [formFloorId, setFormFloorId] = useState(initialHostelFloors[0]?.id || 'flr-1');
  const [formRoomNumber, setFormRoomNumber] = useState('101');
  const [formRoomTypeId, setFormRoomTypeId] = useState(roomTypeMasters[0]?.id || '');
  const [formCapacity, setFormCapacity] = useState(2);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive' | 'Maintenance'>('Active');

  const availableBlocks = initialHostelBlocks.filter(b => b.hostelId === formHostelId);
  const availableFloors = initialHostelFloors.filter(f => f.blockId === formBlockId || f.hostelId === formHostelId);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    const defaultHostel = hostelMasters[0];
    const defaultBlock = initialHostelBlocks.find(b => b.hostelId === defaultHostel?.id) || initialHostelBlocks[0];
    const defaultFloor = initialHostelFloors.find(f => f.blockId === defaultBlock?.id) || initialHostelFloors[0];
    const defaultRt = roomTypeMasters[0];

    setFormHostelId(defaultHostel?.id || '1');
    setFormBlockId(defaultBlock?.id || 'blk-1');
    setFormFloorId(defaultFloor?.id || 'flr-1');
    setFormRoomNumber(String(100 + Math.floor(1 + Math.random() * 90)));
    setFormRoomTypeId(defaultRt?.id || '');
    setFormCapacity(defaultRt?.capacity || 2);
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rm: RoomMaster) => {
    setEditingRoom(rm);
    setFormHostelId(rm.hostelId);
    setFormRoomNumber(rm.roomNumber);
    setFormRoomTypeId(rm.roomTypeId);
    setFormCapacity(rm.capacity || 2);
    setFormStatus(rm.status || 'Active');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formHostelId || !formRoomNumber) {
      addToast('error', 'Validation Error', 'Please select hostel and enter room number');
      return;
    }

    const hObj = hostelMasters.find(h => h.id === formHostelId);
    const bObj = initialHostelBlocks.find(b => b.id === formBlockId);
    const fObj = initialHostelFloors.find(f => f.id === formFloorId);
    const rtObj = roomTypeMasters.find(rt => rt.id === formRoomTypeId);

    const roomData: Partial<RoomMaster> = {
      hostelId: formHostelId,
      hostelName: hObj?.hostelName || 'St. Xavier Boys Hostel',
      floor: fObj ? fObj.floorName : '1st Floor',
      roomNumber: formRoomNumber,
      roomTypeId: formRoomTypeId,
      status: formStatus,
      capacity: formCapacity || rtObj?.capacity || 2,
      roomTypeName: rtObj?.roomTypeName || 'Double Sharing'
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
            <Home className="w-6 h-6 text-sky-500" /> Room Master Management
          </h2>
          <p className="text-xs text-slate-500">Configure hostel rooms with strict hierarchy: Hostel → Block → Floor → Room</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      {/* Filter */}
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
            {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName}</option>)}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map(rm => {
          const rtObj = roomTypeMasters.find(rt => rt.id === rm.roomTypeId);
          const capacity = rm.capacity || rtObj?.capacity || 2;
          const assignedCount = studentHostelAssignments.filter(a => a.roomId === rm.id && a.status === 'Active').length;

          return (
            <div key={rm.id} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400">Room #{rm.roomNumber}</span>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">{rm.hostelName}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {rm.roomTypeName || rtObj?.roomTypeName || 'Standard Room'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-slate-500">Hierarchy: <strong className="text-slate-900 dark:text-white font-bold">{rm.hostelName} → Block A → {rm.floor || '1st Floor'}</strong></p>
                <p className="text-slate-500">Capacity: <strong className="text-emerald-600 font-mono font-bold">{assignedCount} / {capacity} Beds Occupied</strong></p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button onClick={() => handleOpenEdit(rm)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeletingRoom(rm)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingRoom ? 'Edit Room Master' : 'Create Room (Hostel → Block → Floor)'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">1. Select Hostel *</label>
                <select
                  value={formHostelId}
                  onChange={e => {
                    setFormHostelId(e.target.value);
                    const b = initialHostelBlocks.find(blk => blk.hostelId === e.target.value);
                    setFormBlockId(b?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">2. Select Block *</label>
                <select
                  value={formBlockId}
                  onChange={e => {
                    setFormBlockId(e.target.value);
                    const f = initialHostelFloors.find(flr => flr.blockId === e.target.value);
                    setFormFloorId(f?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-indigo-600"
                >
                  {availableBlocks.map(b => <option key={b.id} value={b.id}>{b.blockName} ({b.blockCode})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">3. Select Floor *</label>
                <select value={formFloorId} onChange={e => setFormFloorId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600">
                  {availableFloors.map(f => <option key={f.id} value={f.id}>{f.floorName} (Floor #{f.floorNumber})</option>)}
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
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Room Category *</label>
                  <select value={formRoomTypeId} onChange={e => setFormRoomTypeId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    {roomTypeMasters.map(rt => <option key={rt.id} value={rt.id}>{rt.roomTypeName} (Cap: {rt.capacity})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Bed Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formCapacity}
                    onChange={e => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">{editingRoom ? 'Update Room' : 'Save Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingRoom}
        onCancel={() => setDeletingRoom(null)}
        onConfirm={handleDelete}
        title="Delete Room Master"
        message={`Delete room ${deletingRoom?.roomNumber}?`}
      />
    </div>
  );
};
