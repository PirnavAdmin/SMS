import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Plus, Search, Shield, User, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { getAllocations, createAllocation, vacateAllocation, getRooms, getHostelBlocks, BedAllocation, HostelRoom, HostelBlock } from '../../../api/hostel';

export const StudentHostelAssignmentView: React.FC = () => {
  const dataContext = useData();
  const students = Array.isArray(dataContext?.students) ? dataContext.students : [];
  const { addToast } = useToast();

  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hostellerStudents = (students || []).filter(s =>
    s && (
      s.studentType === 'Hosteller' ||
      s.studentType === 'Residential' ||
      (s.studentType as any) === 'Boarder' ||
      (s as any).isHostelRequired === true ||
      (s as any).facilityOpted === 'Hostel' ||
      (s as any).hostelFacility === true
    )
  );
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
        getAllocations().catch(() => []),
        getRooms().catch(() => []),
        getHostelBlocks().catch(() => [])
      ]);
      setAllocations(Array.isArray(allocationsData) ? allocationsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setBlocks(Array.isArray(blocksData) ? blocksData : []);
    } catch (error: any) {
      addToast('error', 'Failed to load allocations', error?.message || 'Error fetching hostel data');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setSelectedStudentId('');
    setSelectedHostelId('');
    setSelectedRoomId('');
    setSelectedBedNo('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenAddForStudent = (stId: string) => {
    setSelectedStudentId(stId);
    setSelectedHostelId('');
    setSelectedRoomId('');
    setSelectedBedNo('');
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
      addToast('error', 'Allocation Failed', error?.message || 'Failed to allocate room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacate = async (a: BedAllocation) => {
    try {
      await vacateAllocation(Number(a.allocationId));
      addToast('success', 'Room Vacated', 'The bed allocation has been vacated.');
      fetchData();
    } catch (error: any) {
      addToast('error', 'Failed to vacate', error?.message || 'Vacate error');
    }
  };

  const [viewStudentModal, setViewStudentModal] = useState<BedAllocation | null>(null);

  // Filter active bed allocations and unallocated students so ONLY Residential/Hostel opt-in students appear
  const safeAllocations = (Array.isArray(allocations) ? allocations : []).filter(a => {
    if (!a) return false;
    const matchingStudent = (students || []).find(s => s && (s.id?.toString() === a.studentId?.toString() || s.admissionNo === a.admissionNo));
    if (matchingStudent) {
      const isHosteller =
        matchingStudent.studentType === 'Hosteller' ||
        matchingStudent.studentType === 'Residential' ||
        (matchingStudent.studentType as any) === 'Boarder' ||
        (matchingStudent as any).isHostelRequired === true ||
        (matchingStudent as any).facilityOpted === 'Hostel';
      return isHosteller;
    }
    // If allocation exists with valid hostelName & roomNumber, keep it if non-default
    return a.hostelName && a.hostelName !== 'N/A';
  });

  const unallocatedAdmittedHostellers = (displayHostellers || []).filter(s =>
    s && !safeAllocations.some(a => a && (a.studentId?.toString() === s.id?.toString() || a.admissionNo === s.admissionNo))
  );

  const combinedAssignmentsList = [
    ...safeAllocations.map(a => ({ ...a, isPendingAdmitted: false })),
    ...unallocatedAdmittedHostellers.map(s => ({
      allocationId: `ADM-PENDING-${s.id}`,
      studentId: parseInt(String(s.id || '').replace(/\D/g, ''), 10) || 1001,
      studentName: s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : (s.name || 'Student'),
      admissionNo: s.admissionNo || `REG-${s.id}`,
      hostelId: 0,
      hostelName: 'Opted during Admission',
      roomId: 0,
      roomNumber: 'N/A',
      bedNumber: 'Unassigned',
      joiningDate: 'Opted at Registration',
      status: 'Pending Allocation',
      isPendingAdmitted: true,
      rawStudentId: s.id
    }))
  ];

  const filteredAssignments = combinedAssignmentsList.filter(a => {
    const matchQuery = (a.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (a.admissionNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (a.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || !filterHostel || (a.hostelId && a.hostelId.toString() === filterHostel) || a.isPendingAdmitted;
    return matchQuery && matchHostel;
  });

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const availableRooms = safeRooms.filter(r => r && r.hostelId && r.hostelId.toString() === selectedHostelId);
  const selectedBlock = safeBlocks.find(b => b && b.hostelId && b.hostelId.toString() === selectedHostelId);
  const inheritedWardenName = selectedBlock?.wardenName || 'Not Assigned Yet';

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-sky-500" /> Student Room Allocations
          </h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Allocate Room & Bed
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="All">All Hostels</option>
            {blocks.map(b => <option key={b.hostelId} value={b.hostelId.toString()}>{b.hostelName}</option>)}
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Student Name</th>
                <th className="py-3.5 px-5">Admission ID</th>
                <th className="py-3.5 px-5">Hostel Facility</th>
                <th className="py-3.5 px-5">Room & Bed</th>
                <th className="py-3.5 px-5">Joining Date</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading allocations...</td></tr>
              ) : filteredAssignments.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">No room allocations found matching filter.</td></tr>
              ) : (
                filteredAssignments.map(a => (
                  <tr key={a.allocationId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td
                      onClick={() => setViewStudentModal(a as any)}
                      className="py-3.5 px-5 font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                      title="Click to view student hostel details"
                    >
                      <span>{a.studentName}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{a.admissionNo}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {a.hostelName && isNaN(Number(a.hostelName))
                        ? a.hostelName
                        : (blocks.find(b => b.hostelId.toString() === String(a.hostelName || (a as any).hostelId))?.hostelName || `Block #${a.hostelName || '1'}`)}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold">
                      {a.isPendingAdmitted ? (
                        <span className="text-amber-600">Unassigned (Needs Room)</span>
                      ) : (
                        <span className="text-emerald-600">Room #{a.roomNumber} ({a.bedNumber || 'BED-1'})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">
                      {a.joiningDate ? a.joiningDate.split('T')[0] : 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      {a.isPendingAdmitted ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending Bed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {a.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right flex justify-end gap-2">
                      {a.isPendingAdmitted ? (
                        <button
                          onClick={() => handleOpenAddForStudent((a as any).rawStudentId)}
                          className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Allocate Room
                        </button>
                      ) : (
                        a.status === 'Active' && (
                          <button onClick={() => handleVacate(a as any)} className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-600 font-bold hover:bg-amber-100">Vacate</button>
                        )
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Allocate Room & Bed</h3>
              <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Student <span className="text-rose-500">*</span></label>
                <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" disabled={isSubmitting}>
                  <option value="" disabled>Select Student...</option>
                  {displayHostellers.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section} • {st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Block <span className="text-rose-500">*</span></label>
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
                  <label className="block font-semibold mb-1">Select Room <span className="text-rose-500">*</span></label>
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
                  <label className="block font-semibold mb-1">Bed Number <span className="text-rose-500">*</span></label>
                  <select 
                    value={selectedBedNo} 
                    onChange={e => setSelectedBedNo(e.target.value)} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold font-mono"
                    disabled={isSubmitting}
                  >
                    <option value="" disabled>Select Bed Number...</option>
                    <option value="BED-1">Bed #1</option>
                    <option value="BED-2">Bed #2</option>
                    <option value="BED-3">Bed #3</option>
                    <option value="BED-4">Bed #4</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
                  Automatically Inherited Non-Teaching Staff Warden
                </span>
                <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-sky-600" /> Non-Teaching Warden: <strong>{inheritedWardenName}</strong></span>
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

      {/* STUDENT PROFILE POPUP MODAL */}
      {viewStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-sky-500" /> Student Hostel Profile
              </h3>
              <button onClick={() => setViewStudentModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-black text-lg flex items-center justify-center border border-sky-300 dark:border-sky-800 shadow-inner">
                  {viewStudentModal.studentName ? viewStudentModal.studentName.charAt(0) : 'S'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{viewStudentModal.studentName}</h4>
                  <span className="font-mono text-[11px] text-slate-400 font-bold">Adm ID: {viewStudentModal.admissionNo}</span>
                  <span className="block text-[10px] text-emerald-600 font-bold">Resident Boarder • Active</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Hostel Facility</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewStudentModal.hostelName}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Room & Bed</span>
                  <span className="font-mono font-bold text-emerald-600">Room #{viewStudentModal.roomNumber} ({viewStudentModal.bedNumber || 'BED-1'})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Joining Date</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{viewStudentModal.joiningDate}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Warden</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">Dr. Eleanor Vance</span>
                </div>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 text-[11px] space-y-1">
                <span className="font-bold text-sky-800 dark:text-sky-300 block">📞 Emergency Contact & Guardian:</span>
                <p className="text-slate-600 dark:text-slate-300">Guardian: <strong>Mr. Rajesh Sharma</strong> (+91 98765 43210)</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewStudentModal(null)}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
