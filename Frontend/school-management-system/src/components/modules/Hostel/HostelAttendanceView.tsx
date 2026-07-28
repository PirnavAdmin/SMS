import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Calendar, Search, Filter, Save, Home } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { getHostelBlocks, getRooms, getAllocations, getNightAttendance, saveNightAttendance, HostelBlock, HostelRoom, BedAllocation, NightAttendanceRecord } from '../../../api/hostel';

export const HostelAttendanceView: React.FC = () => {
  const { addToast } = useToast();

  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<NightAttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [blocksData, roomsData, allocationsData] = await Promise.all([
        getHostelBlocks(),
        getRooms(),
        getAllocations()
      ]);
      setBlocks(blocksData);
      setRooms(roomsData);
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

  // Fetch Attendance when Date or Block changes
  useEffect(() => {
    const fetchAttendance = async () => {
      if (selectedDate && selectedBlockId) {
        try {
          const records = await getNightAttendance(selectedDate, Number(selectedBlockId));
          setAttendanceRecords(records);
          
          // Hydrate local state
          const newState: Record<string, string> = {};
          records.forEach(r => {
            newState[r.studentId.toString()] = r.curfewStatus;
          });
          setAttendanceState(newState);
        } catch (error: any) {
          addToast('error', 'Failed to load attendance', error.message);
        }
      } else {
        setAttendanceRecords([]);
        setAttendanceState({});
      }
    };
    fetchAttendance();
  }, [selectedDate, selectedBlockId, addToast]);

  // Derived filters
  const floors = Array.from(new Set(rooms.filter(rm => rm.hostelId.toString() === selectedBlockId).map(rm => rm.floorLevel))).sort();
  
  useEffect(() => {
    if (floors.length > 0) setSelectedFloor(floors[0]);
    else setSelectedFloor('');
  }, [selectedBlockId]); // only trigger when block changes

  const filteredRooms = rooms.filter(rm => rm.hostelId.toString() === selectedBlockId && rm.floorLevel === selectedFloor);
  
  useEffect(() => {
    if (filteredRooms.length > 0) setSelectedRoomId(filteredRooms[0].roomId.toString());
    else setSelectedRoomId('');
  }, [selectedFloor, selectedBlockId]);

  const activeRoomObj = rooms.find(rm => rm.roomId.toString() === selectedRoomId);

  const matchedAssignments = allocations.filter(a => {
    if (a.status !== 'Active') return false;
    if (a.hostelId.toString() !== selectedBlockId) return false;
    
    if (activeRoomObj && a.roomId !== activeRoomObj.roomId) return false;
    else if (!activeRoomObj && selectedRoomId) return false;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const nameMatch = a.studentName.toLowerCase().includes(query);
      const admMatch = (a.admissionNo || '').toLowerCase().includes(query);
      if (!nameMatch && !admMatch) return false;
    }

    return true;
  });

  const getAttendanceStatus = (studentId: string): string => {
    return attendanceState[studentId] || 'Present';
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedBlockId || !selectedFloor || !selectedRoomId) {
      addToast('error', 'Select Required Filters', 'Please select a Block, Floor, and Room first.');
      return;
    }

    if (matchedAssignments.length === 0) {
      addToast('warning', 'No Students Found', 'There are no students listed in the selected room to mark.');
      return;
    }

    const records = matchedAssignments.map(a => ({
      allocationId: a.allocationId,
      studentId: a.studentId,
      curfewStatus: getAttendanceStatus(a.studentId.toString()),
      remarks: 'Night Roll Call'
    }));

    try {
      await saveNightAttendance({
        date: selectedDate,
        hostelId: Number(selectedBlockId),
        floorLevel: selectedFloor,
        records
      });
      addToast('success', 'Attendance Saved', `Hostel attendance saved for ${records.length} students.`);
    } catch (error: any) {
      addToast('error', 'Save Failed', error.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-500" /> Hostel Night Attendance
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

      <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-sky-500" /> Step-wise Filter Workflow
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Block *</label>
            <select
              value={selectedBlockId}
              onChange={e => setSelectedBlockId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
            >
              <option value="">-- Choose Block --</option>
              {blocks.map(h => (
                <option key={h.hostelId} value={h.hostelId.toString()}>{h.hostelName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Floor *</label>
            <select
              value={selectedFloor}
              onChange={e => setSelectedFloor(e.target.value)}
              disabled={!selectedBlockId}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Floor --</option>
              {floors.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Room *</label>
            <select
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(e.target.value)}
              disabled={!selectedFloor}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Room --</option>
              {filteredRooms.map(r => (
                <option key={r.roomId} value={r.roomId.toString()}>Room {r.roomNumber} ({r.roomTypeSpecification})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 items-center justify-between">
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
        </div>
      </div>

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
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : !selectedBlockId || !selectedFloor || !selectedRoomId ? (
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
                  const currentSt = getAttendanceStatus(a.studentId.toString());
                  return (
                    <tr key={a.allocationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.studentName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{a.admissionNo}</td>
                      <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{a.hostelName}</td>
                      <td className="py-3 px-4 font-black">Room #{a.roomNumber}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{a.bedNumber}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['Present', 'Absent', 'Leave'] as const).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(a.studentId.toString(), st)}
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
