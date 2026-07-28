import React, { useState } from 'react';
import { UserPlus, Plus, Search, Building2, Home, Bed, Calendar, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { StudentHostelAssignment } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

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

  const [form, setForm] = useState<Partial<StudentHostelAssignment>>({
    studentId: hostellerStudents[0]?.id || '',
    studentName: hostellerStudents[0] ? `${hostellerStudents[0].firstName} ${hostellerStudents[0].lastName}` : '',
    admissionNo: hostellerStudents[0]?.admissionNo || '',
    hostelId: hostelMasters[0]?.id || '',
    hostelName: hostelMasters[0]?.hostelName || '',
    roomId: roomMasters[0]?.id || '',
    roomNo: roomMasters[0]?.roomNumber || '101',
    bedNo: 'BED-1',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const handleOpenAdd = () => {
    if (hostellerStudents.length === 0) {
      addToast('warning', 'No Hosteller Students', 'No students with Student Type = Hosteller found in database');
    }

    const st = hostellerStudents[0];
    const h = hostelMasters[0];
    const rm = roomMasters.filter(r => r.hostelId === h?.id)[0] || roomMasters[0];

    setForm({
      studentId: st?.id || '',
      studentName: st ? `${st.firstName} ${st.lastName}` : '',
      admissionNo: st?.admissionNo || '',
      hostelId: h?.id || '',
      hostelName: h?.hostelName || '',
      roomId: rm?.id || '',
      roomNo: rm?.roomNumber || '101',
      bedNo: 'BED-1',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.hostelId || !form.roomId) {
      addToast('error', 'Validation Error', 'Please select student, hostel, and room');
      return;
    }

    const rmObj = roomMasters.find(rm => rm.id === form.roomId);
    if (rmObj) {
      const rtObj = roomTypeMasters.find(rt => rt.id === rmObj.roomTypeId);
      const capacity = rtObj ? rtObj.capacity : (rmObj.capacity || 2);
      const activeInRoom = studentHostelAssignments.filter(a => a.roomId === rmObj.id && a.status === 'Active').length;
      if (activeInRoom >= capacity) {
        addToast('error', 'Room Capacity Full', `Room #${rmObj.roomNumber} has reached maximum capacity of ${capacity} beds.`);
        return;
      }
    }

    const stObj = students.find(s => s.id === form.studentId);
    const hObj = hostelMasters.find(h => h.id === form.hostelId);

    const assignmentData = {
      ...form,
      studentName: stObj ? `${stObj.firstName} ${stObj.lastName}` : form.studentName || 'Student',
      admissionNo: stObj ? stObj.admissionNo : form.admissionNo || 'ADM2026-000',
      hostelName: hObj?.hostelName || form.hostelName || 'Hostel Block',
      roomNo: rmObj?.roomNumber || form.roomNo || '101'
    };

    assignStudentHostelRoom(assignmentData as Omit<StudentHostelAssignment, 'id'>);
    addToast('success', 'Room Assigned', `Assigned ${assignmentData.studentName} to Room #${assignmentData.roomNo}`);
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
            <UserPlus className="w-6 h-6 text-indigo-500" /> Student Hostel Assignment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Allocate rooms and beds exclusively to enrolled Hosteller students</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> New Bed Allocation
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, admission number, room..."
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

      {/* Table */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Hostel Block</th>
                <th className="py-3 px-4">Room No</th>
                <th className="py-3 px-4">Bed No</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No active student hostel assignments found. Click "New Bed Allocation" to assign rooms.</td>
                </tr>
              ) : (
                filteredAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.studentName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{a.admissionNo}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{a.hostelName}</td>
                    <td className="py-3 px-4 font-black text-slate-800 dark:text-slate-200">Room #{a.roomNo}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{a.bedNo}</td>
                    <td className="py-3 px-4 font-mono">{a.joiningDate}</td>
                    <td className="py-3 px-4">
                      {a.status === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px]">Vacated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setDeletingAssignment(a)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800">
                        Vacate / Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" /> Allocate Hostel Room Bed
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Hosteller Student *</label>
                <select
                  required
                  value={form.studentId}
                  onChange={e => {
                    const stObj = hostellerStudents.find(s => s.id === e.target.value);
                    setForm({
                      ...form,
                      studentId: e.target.value,
                      studentName: stObj ? `${stObj.firstName} ${stObj.lastName}` : '',
                      admissionNo: stObj?.admissionNo || ''
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  {hostellerStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo} - {s.className})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Block *</label>
                  <select
                    required
                    value={form.hostelId}
                    onChange={e => {
                      const hObj = hostelMasters.find(h => h.id === e.target.value);
                      const availRooms = roomMasters.filter(r => r.hostelId === e.target.value);
                      setForm({
                        ...form,
                        hostelId: e.target.value,
                        hostelName: hObj?.hostelName || '',
                        roomId: availRooms[0]?.id || '',
                        roomNo: availRooms[0]?.roomNumber || '101'
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    {hostelMasters.map(h => (
                      <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Room Number *</label>
                  <select
                    required
                    value={form.roomId}
                    onChange={e => {
                      const rmObj = roomMasters.find(rm => rm.id === e.target.value);
                      setForm({
                        ...form,
                        roomId: e.target.value,
                        roomNo: rmObj?.roomNumber || '101'
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    {roomMasters
                      .filter(rm => !form.hostelId || rm.hostelId === form.hostelId)
                      .map(rm => {
                        const rtObj = roomTypeMasters.find(rt => rt.id === rm.roomTypeId);
                        const rCap = rtObj ? rtObj.capacity : (rm.capacity || 2);
                        const rName = rtObj ? rtObj.roomTypeName : (rm.roomTypeName || 'Standard Room');
                        const occupied = studentHostelAssignments.filter(a => a.roomId === rm.id && a.status === 'Active').length;
                        return (
                          <option key={rm.id} value={rm.id} disabled={occupied >= rCap}>
                            Room #{rm.roomNumber} ({rName}) - {occupied}/{rCap} Beds {occupied >= rCap ? '[FULL]' : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bed Number *</label>
                  <select
                    value={form.bedNo}
                    onChange={e => setForm({ ...form, bedNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-extrabold outline-none"
                  >
                    <option value="BED-1">Bed #1</option>
                    <option value="BED-2">Bed #2</option>
                    <option value="BED-3">Bed #3</option>
                    <option value="BED-4">Bed #4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Joining Date</label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={e => setForm({ ...form, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20">
                  Assign Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingAssignment && (
        <ConfirmModal
          isOpen={true}
          title="Vacate Hostel Bed"
          message={`Are you sure you want to vacate bed for ${deletingAssignment.studentName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingAssignment(null)}
        />
      )}
    </div>
  );
};
