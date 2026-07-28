import React, { useState } from 'react';
import { UserPlus, Plus, Search, Building2, Home, Bed, Calendar, CheckCircle2, XCircle, AlertTriangle, Shield, User } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { StudentHostelAssignment } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';
import { initialHostelBlocks } from './HostelBlocksView';
import { initialHostelFloors } from './HostelFloorsView';

export const StudentHostelAssignmentView: React.FC = () => {
  const {
    students, hostelMasters, roomMasters, roomTypeMasters, studentHostelAssignments,
    assignStudentHostelRoom, deleteStudentHostelAssignment
  } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<StudentHostelAssignment | null>(null);

  // Filter hosteller students only
  const hostellerStudents = students.filter(s => s.studentType === 'Hosteller');
  const displayHostellers = hostellerStudents.length > 0 ? hostellerStudents : students.slice(0, 5);

  const [selectedStudentId, setSelectedStudentId] = useState(displayHostellers[0]?.id || '');
  const [selectedHostelId, setSelectedHostelId] = useState(hostelMasters[0]?.id || '1');
  const [selectedBlockId, setSelectedBlockId] = useState(initialHostelBlocks[0]?.id || 'blk-1');
  const [selectedFloorId, setSelectedFloorId] = useState(initialHostelFloors[0]?.id || 'flr-1');
  const [selectedRoomId, setSelectedRoomId] = useState(roomMasters[0]?.id || '');
  const [selectedBedNo, setSelectedBedNo] = useState('BED-1');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Inherited Supervisor & Warden Details
  const selectedBlock = initialHostelBlocks.find(b => b.id === selectedBlockId) || initialHostelBlocks[0];
  const selectedFloor = initialHostelFloors.find(f => f.id === selectedFloorId) || initialHostelFloors[0];

  const inheritedSupervisorName = selectedBlock?.supervisorName || 'Robert Langdon';
  const inheritedSupervisorMobile = selectedBlock?.supervisorMobile || '+1 555-444-001';
  const inheritedWardenName = selectedFloor?.wardenName || 'Marcus Vance';
  const inheritedWardenMobile = selectedFloor?.wardenMobile || '+1 555-333-101';

  const handleOpenAdd = () => {
    const st = displayHostellers[0];
    const h = hostelMasters[0];
    const b = initialHostelBlocks.find(blk => blk.hostelId === h?.id) || initialHostelBlocks[0];
    const f = initialHostelFloors.find(flr => flr.blockId === b?.id) || initialHostelFloors[0];
    const rm = roomMasters.filter(r => r.hostelId === h?.id)[0] || roomMasters[0];

    setSelectedStudentId(st?.id || '');
    setSelectedHostelId(h?.id || '1');
    setSelectedBlockId(b?.id || 'blk-1');
    setSelectedFloorId(f?.id || 'flr-1');
    setSelectedRoomId(rm?.id || '');
    setSelectedBedNo('BED-1');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedHostelId || !selectedRoomId) {
      addToast('error', 'Validation Error', 'Please select student, hostel, and room');
      return;
    }

    const rmObj = roomMasters.find(rm => rm.id === selectedRoomId);
    if (rmObj) {
      const rtObj = roomTypeMasters.find(rt => rt.id === rmObj.roomTypeId);
      const capacity = rtObj ? rtObj.capacity : (rmObj.capacity || 2);
      const activeInRoom = studentHostelAssignments.filter(a => a.roomId === rmObj.id && a.status === 'Active').length;
      if (activeInRoom >= capacity) {
        addToast('error', 'Room Capacity Full', `Room #${rmObj.roomNumber} has reached maximum capacity of ${capacity} beds.`);
        return;
      }
    }

    const stObj = students.find(s => s.id === selectedStudentId);
    const hObj = hostelMasters.find(h => h.id === selectedHostelId);

    const assignmentData: Omit<StudentHostelAssignment, 'id'> = {
      studentId: selectedStudentId,
      studentName: stObj ? `${stObj.firstName} ${stObj.lastName}` : 'Hosteller Student',
      admissionNo: stObj ? stObj.admissionNo : 'ADM2026-000',
      hostelId: selectedHostelId,
      hostelName: hObj?.hostelName || 'St. Xavier Boys Hostel',
      roomId: selectedRoomId,
      roomNo: rmObj?.roomNumber || '101',
      bedNo: selectedBedNo,
      joiningDate,
      status: 'Active'
    };

    assignStudentHostelRoom(assignmentData);
    addToast('success', 'Room & Hierarchy Assigned', `Assigned ${assignmentData.studentName} to Room #${assignmentData.roomNo} (Supervisor: ${inheritedSupervisorName}, Warden: ${inheritedWardenName})`);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingAssignment) {
      deleteStudentHostelAssignment(deletingAssignment.id);
      addToast('success', 'Assignment Vacated/Removed');
      setDeletingAssignment(null);
    }
  };

  const filteredAssignments = studentHostelAssignments.filter(a => {
    const matchQuery = a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       a.roomNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || a.hostelId === filterHostel;
    return matchQuery && matchHostel;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-500" /> Student Hostel Allocation
          </h2>
          <p className="text-xs text-slate-500">Allocate rooms and beds to Hostellers with automatic inheritance of Block Supervisors & Floor Wardens</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Allocate Room & Bed
        </button>
      </div>

      {/* Search & Filters */}
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
            {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName}</option>)}
          </select>
        </div>
      </div>

      {/* Allocation List Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Hostel Facility</th>
                <th className="py-3.5 px-4">Hierarchy (Block / Floor)</th>
                <th className="py-3.5 px-4">Room & Bed</th>
                <th className="py-3.5 px-4">Inherited Crew (Supervisor / Warden)</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredAssignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.studentName}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{a.admissionNo}</td>
                  <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{a.hostelName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Block A • 1st Floor</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">Room #{a.roomNo} ({a.bedNo || 'BED-1'})</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Sup: <strong>Robert Langdon</strong> • Warden: <strong>Marcus Vance</strong></td>
                  <td className="py-3 px-4 text-slate-500">{a.joiningDate}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setDeletingAssignment(a)} className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100">Vacate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL WITH AUTOMATIC INHERITANCE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Allocate Student Room & Inherit Hierarchy</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Hosteller Student *</label>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {displayHostellers.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section} • {st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Facility *</label>
                <select value={selectedHostelId} onChange={e => setSelectedHostelId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600">
                  {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Select Block *</label>
                  <select value={selectedBlockId} onChange={e => setSelectedBlockId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-indigo-600">
                    {initialHostelBlocks.map(b => <option key={b.id} value={b.id}>{b.blockName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Select Floor *</label>
                  <select value={selectedFloorId} onChange={e => setSelectedFloorId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600">
                    {initialHostelFloors.map(f => <option key={f.id} value={f.id}>{f.floorName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Select Room *</label>
                  <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    {roomMasters.map(rm => <option key={rm.id} value={rm.id}>Room #{rm.roomNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bed Number *</label>
                  <select value={selectedBedNo} onChange={e => setSelectedBedNo(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold font-mono">
                    <option value="BED-1">Bed #1</option>
                    <option value="BED-2">Bed #2</option>
                    <option value="BED-3">Bed #3</option>
                    <option value="BED-4">Bed #4</option>
                  </select>
                </div>
              </div>

              {/* AUTOMATICALLY INHERITED SUPERVISOR & WARDEN DISPLAY */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                  Automatically Inherited Management Crew
                </span>
                <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-indigo-600" /> Block Supervisor: <strong>{inheritedSupervisorName}</strong></span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-600" /> Floor Warden: <strong>{inheritedWardenName}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Joining Date</label>
                <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Allocate Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingAssignment}
        onCancel={() => setDeletingAssignment(null)}
        onConfirm={handleDelete}
        title="Vacate Hostel Room"
        message={`Vacate room for ${deletingAssignment?.studentName}?`}
      />
    </div>
  );
};
