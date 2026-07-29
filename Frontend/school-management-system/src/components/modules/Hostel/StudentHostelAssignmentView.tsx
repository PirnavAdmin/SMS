import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Plus, Search, Shield, User, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { getAllocations, createAllocation, vacateAllocation, getRooms, getHostelBlocks, BedAllocation, HostelRoom, HostelBlock } from '../../../api/hostel';

export const StudentHostelAssignmentView: React.FC = () => {
  const { students } = useData();
  const { addToast } = useToast();

  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hostellerStudents = students.filter(s => s.studentType === 'Hosteller');
  const displayHostellers = hostellerStudents;

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedNo, setSelectedBedNo] = useState('BED-1');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [allocationsData, roomsData, blocksData] = await Promise.all([
        getAllocations(),
        getRooms(),
        getHostelBlocks()
      ]);
      setAllocations(allocationsData);
      setRooms(roomsData);
      setBlocks(blocksData);
    } catch (error: any) {
      addToast('error', 'Failed to load allocations', error.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setSelectedStudentId('');
    if (blocks.length > 0) {
      const firstHostelId = blocks[0].hostelId.toString();
      setSelectedHostelId(firstHostelId);
      const availableRoomsForFirstHostel = rooms.filter(r => r.hostelId.toString() === firstHostelId);
      setSelectedRoomId(availableRoomsForFirstHostel.length > 0 ? availableRoomsForFirstHostel[0].roomId.toString() : '');
    } else {
      setSelectedHostelId('');
      setSelectedRoomId('');
    }
    setSelectedBedNo('BED-1');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };



  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedHostelId || !selectedRoomId) {
      addToast('error', 'Validation Error', 'Please complete all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const numericStudentId = parseInt(selectedStudentId.replace(/\D/g, ''), 10) || 0;

      const payload = {
        studentId: numericStudentId,
        hostelId: Number(selectedHostelId),
        roomId: Number(selectedRoomId),
        bedNumber: selectedBedNo,
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      await createAllocation(payload);
      addToast('success', 'Allocation Created', 'Room & bed allocated successfully');
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      addToast('error', 'Allocation Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleVacate = async (a: BedAllocation) => {
    try {
      await vacateAllocation(a.allocationId);
      addToast('success', 'Room Vacated', 'The bed allocation has been vacated.');
      fetchData();
    } catch (error: any) {
      addToast('error', 'Failed to vacate', error.message);
    }
  };

  const filteredAssignments = allocations.filter(a => {
    const matchQuery = a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || a.hostelId.toString() === filterHostel;
    return matchQuery && matchHostel;
  });

  const availableRooms = rooms.filter(r => r.hostelId.toString() === selectedHostelId);
  const selectedBlock = blocks.find(b => b.hostelId.toString() === selectedHostelId);
  const inheritedWardenName = selectedBlock?.wardenName || 'Unassigned';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-sky-500" /> Student Hostel Allocation
          </h2>
          <p className="text-xs text-slate-500">Allocate rooms and beds to Hostellers with automatic inheritance of Wardens</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Allocate Room & Bed
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student, adm no, room..."
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

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Hostel Facility</th>
                <th className="py-3.5 px-4">Room & Bed</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading allocations...</td></tr>
              ) : filteredAssignments.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No allocations found.</td></tr>
              ) : (
                filteredAssignments.map(a => (
                  <tr key={a.allocationId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.studentName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{a.admissionNo}</td>
                    <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{a.hostelName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">Room #{a.roomNumber} ({a.bedNumber || 'BED-1'})</td>
                    <td className="py-3 px-4 text-slate-500">{a.joiningDate}</td>
                    <td className="py-3 px-4 text-slate-500">{a.status}</td>
                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                      {a.status === 'Active' && (
                        <button onClick={() => handleVacate(a)} className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-600 font-bold hover:bg-amber-100">Vacate</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Allocate Student Room</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Hosteller Student *</label>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" disabled={isSubmitting}>
                  <option value="" disabled>Select Student...</option>
                  {displayHostellers.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section} • {st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Facility *</label>
                <select 
                  value={selectedHostelId || ''} 
                  onChange={e => {
                    const newHostelId = e.target.value;
                    setSelectedHostelId(newHostelId);
                    const newRooms = rooms.filter(r => r.hostelId.toString() === newHostelId);
                    setSelectedRoomId(newRooms.length > 0 ? newRooms[0].roomId.toString() : '');
                  }} 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                  disabled={isSubmitting}
                >
                  <option value="" disabled>Select Hostel Block</option>
                  {blocks.map(h => <option key={h.hostelId} value={h.hostelId.toString()}>{h.hostelName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Select Room *</label>
                  <select 
                    value={selectedRoomId} 
                    onChange={e => setSelectedRoomId(e.target.value)} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                    disabled={isSubmitting}
                  >
                    <option value="" disabled>Select Room</option>
                    {availableRooms.map(rm => <option key={rm.roomId} value={rm.roomId.toString()}>Room #{rm.roomNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bed Number *</label>
                  <select 
                    value={selectedBedNo} 
                    onChange={e => setSelectedBedNo(e.target.value)} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold font-mono"
                    disabled={isSubmitting}
                  >
                    <option value="BED-1">Bed #1</option>
                    <option value="BED-2">Bed #2</option>
                    <option value="BED-3">Bed #3</option>
                    <option value="BED-4">Bed #4</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
                  Automatically Inherited Management Crew
                </span>
                <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-sky-600" /> Warden: <strong>{inheritedWardenName}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Joining Date</label>
                <input 
                  type="date" 
                  value={joiningDate || ''} 
                  onChange={e => setJoiningDate(e.target.value)} 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" 
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Allocate Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
