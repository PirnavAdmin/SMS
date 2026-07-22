import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Search, Filter, Save, Home } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { HostelAttendanceLog } from '../../../types';

export const HostelAttendanceView: React.FC = () => {
  const {
    hostelMasters,
    roomMasters,
    roomTypeMasters,
    studentHostelAssignments,
    hostelAttendanceLogs,
    recordHostelAttendance
  } = useData();
  
  const { addToast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBlock, setSelectedBlock] = useState(hostelMasters[0]?.id || '');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically query floors based on selected block
  const floors = Array.from(
    new Set(
      roomMasters
        .filter(rm => rm.hostelId === selectedBlock)
        .map(rm => rm.floor)
    )
  ).sort();

  // Reset floor and room selections when block changes
  useEffect(() => {
    if (floors.length > 0) {
      setSelectedFloor(floors[0]);
    } else {
      setSelectedFloor('');
    }
  }, [selectedBlock]);

  // Dynamically query rooms based on selected block & floor
  const rooms = roomMasters.filter(
    rm => rm.hostelId === selectedBlock && rm.floor === selectedFloor
  );

  // Reset room selection when floor changes
  useEffect(() => {
    if (rooms.length > 0) {
      setSelectedRoom(rooms[0].id);
    } else {
      setSelectedRoom('');
    }
  }, [selectedFloor, selectedBlock]);

  // Resolve active room name/number
  const activeRoomObj = roomMasters.find(rm => rm.id === selectedRoom);

  // Query students assigned to this block -> floor -> room
  const matchedAssignments = studentHostelAssignments.filter(a => {
    if (a.status !== 'Active') return false;
    if (a.hostelId !== selectedBlock) return false;
    
    // Match exact room
    if (activeRoomObj && a.roomId !== activeRoomObj.id && a.roomNo !== activeRoomObj.roomNumber) {
      return false;
    } else if (!activeRoomObj && selectedRoom) {
      return false;
    }

    // Filter by Room Type if selected
    if (selectedRoomType !== 'All') {
      const room = roomMasters.find(r => r.id === a.roomId || r.roomNumber === a.roomNo);
      if (!room || room.roomTypeId !== selectedRoomType) return false;
    }

    // Filter by search query (Name or Admission Number)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = a.studentName.toLowerCase().includes(query);
      const admMatch = (a.admissionNo || '').toLowerCase().includes(query);
      if (!nameMatch && !admMatch) return false;
    }

    return true;
  });

  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent' | 'Leave'>>({});

  const getAttendanceStatus = (studentId: string): 'Present' | 'Absent' | 'Leave' => {
    if (attendanceState[studentId]) return attendanceState[studentId];
    const existing = hostelAttendanceLogs.find(
      a => a.studentId === studentId && a.date === selectedDate
    );
    if (existing) {
      if (existing.status === 'Late') return 'Present'; // Map late back to present safely
      return existing.status as 'Present' | 'Absent' | 'Leave';
    }
    return 'Present';
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    if (!selectedBlock || !selectedFloor || !selectedRoom) {
      addToast('error', 'Select Required Filters', 'Please select a Block, Floor, and Room first.');
      return;
    }

    if (matchedAssignments.length === 0) {
      addToast('warning', 'No Students Found', 'There are no students listed in the selected room to mark.');
      return;
    }

    matchedAssignments.forEach(a => {
      const currentSt = getAttendanceStatus(a.studentId);
      recordHostelAttendance({
        studentId: a.studentId,
        studentName: a.studentName,
        hostelId: a.hostelId,
        hostelName: a.hostelName,
        roomNo: a.roomNo,
        date: selectedDate,
        status: currentSt,
        remarks: 'Night Roll Call'
      });
    });

    addToast('success', 'Attendance Saved', `Hostel attendance saved for ${matchedAssignments.length} students.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-500" /> Hostel Night Attendance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select Hostel Block, Floor, and Room to mark night roll-call attendance</p>
        </div>

        <button
          onClick={handleSaveAttendance}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" /> Save Attendance
        </button>
      </div>

      {/* Workflow Filter panel */}
      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-indigo-500" /> Step-wise Filter Workflow
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Date Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none"
            />
          </div>

          {/* 2. Block Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Block *</label>
            <select
              value={selectedBlock}
              onChange={e => setSelectedBlock(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="">-- Choose Block --</option>
              {hostelMasters.map(h => (
                <option key={h.id} value={h.id}>{h.hostelName}</option>
              ))}
            </select>
          </div>

          {/* 3. Floor Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Floor *</label>
            <select
              value={selectedFloor}
              onChange={e => setSelectedFloor(e.target.value)}
              disabled={!selectedBlock}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Floor --</option>
              {floors.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* 4. Room Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Room *</label>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              disabled={!selectedFloor}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Room --</option>
              {rooms.map(r => {
                const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                const rName = rtObj ? rtObj.roomTypeName : (r.roomTypeName || 'Standard Room');
                return (
                  <option key={r.id} value={r.id}>Room {r.roomNumber} ({rName})</option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 items-center justify-between">
          {/* Search Student */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Student by Name or Adm No..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
            />
          </div>

          {/* Filter by Room Type */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Filter by Room Type:</span>
            <select
              value={selectedRoomType}
              onChange={e => setSelectedRoomType(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="All">All Room Types</option>
              {roomTypeMasters.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.roomTypeName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roll Call Table Section */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Hostel Block</th>
                <th className="py-3 px-4">Room No</th>
                <th className="py-3 px-4">Bed No</th>
                <th className="py-3 px-4 text-center">Curfew Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {!selectedBlock || !selectedFloor || !selectedRoom ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Please complete the workflow filters to load room student directory.
                  </td>
                </tr>
              ) : matchedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active students match selected criteria in this room.
                  </td>
                </tr>
              ) : (
                matchedAssignments.map(a => {
                  const currentSt = getAttendanceStatus(a.studentId);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.studentName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{a.admissionNo}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{a.hostelName}</td>
                      <td className="py-3 px-4 font-black">Room #{a.roomNo}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{a.bedNo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['Present', 'Absent', 'Leave'] as const).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(a.studentId, st)}
                              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${
                                currentSt === st
                                  ? st === 'Present' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]' :
                                    st === 'Absent' ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 scale-[1.02]' :
                                    'bg-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
