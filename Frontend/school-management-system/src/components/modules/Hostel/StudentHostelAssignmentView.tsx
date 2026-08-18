import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Plus, Search, Shield, User, Edit, Trash2, ChevronDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';
import { SearchableSelect } from '../../common/SearchableSelect';
import { getAllocations, createAllocation, vacateAllocation, getRooms, getHostelBlocks, BedAllocation, HostelRoom, HostelBlock } from '../../../api/hostel';

const StudentInlineCombobox: React.FC<{
  students: any[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}> = ({ students, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedStudent = students.find(s => String(s.id) === String(value));

  useEffect(() => {
    if (selectedStudent) {
      setSearchText(`${selectedStudent.name} (${selectedStudent.className}-${selectedStudent.section} • ${selectedStudent.admissionNo})`);
    } else if (!value) {
      setSearchText('');
    }
  }, [value, selectedStudent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = students.filter(st => {
    if (!searchText.trim()) return true;
    if (selectedStudent && searchText === `${selectedStudent.name} (${selectedStudent.className}-${selectedStudent.section} • ${selectedStudent.admissionNo})`) {
      return true;
    }
    const q = searchText.toLowerCase().trim();
    const nameMatch = (st.name || '').toLowerCase().includes(q);
    const regMatch = (st.admissionNo || '').toLowerCase().includes(q);
    const classMatch = (`${st.className || ''}-${st.section || ''}`).toLowerCase().includes(q);
    return nameMatch || regMatch || classMatch;
  });  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative cursor-pointer" onClick={() => setIsOpen(prev => !prev)}>
        <input
          type="text"
          disabled={disabled}
          value={searchText}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setSearchText(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          placeholder="Type student name or reg no (e.g. 's' or 'b')..."
          className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
        />
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 space-y-0.5 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="px-3 py-3 text-center text-xs text-slate-400 font-semibold">
              No matching students found
            </div>
          ) : (
            filteredStudents.map(st => {
              const isSelected = String(st.id) === String(value);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(String(st.id));
                    setSearchText(`${st.name} (${st.className}-${st.section} • ${st.admissionNo})`);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 font-extrabold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{st.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({st.className}-${st.section} • {st.admissionNo})</span>
                    </div>
                  </div>
                  {st.isResidential ? (
                    <span className="text-[10px] font-extrabold text-sky-600 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full shrink-0 ml-1">★ Residential</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0 ml-1">Day Scholar</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const candidateStudents = React.useMemo(() => {
    const rawStudents = Array.isArray(dataContext?.students) ? dataContext.students : [];
    const rawAdmissions = Array.isArray(dataContext?.admissions) ? dataContext.admissions : [];

    const map = new Map<string, any>();

    const getDedupKey = (item: any) => {
      const reg = String(item.registrationNo || item.admissionNo || item.applicationNo || item.registrationNumber || '').toLowerCase().trim();
      const name = String(item.applicantName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.name || '').toLowerCase().trim();
      if (reg && reg !== 'n/a') return `reg_${reg}`;
      if (name) return `name_${name}`;
      return `id_${item.id || item.studentId}`;
    };

    // Add students from Admissions store
    rawAdmissions.forEach((a: any) => {
      if (a) {
        const key = getDedupKey(a);
        const sType = String(a.studentType || a.residenceType || a.facilityOpted || a.residentialStatus || '').toLowerCase();
        const isRes =
          sType.includes('hostel') ||
          sType.includes('residential') ||
          sType.includes('boarder') ||
          a.isHostelRequired === true ||
          a.optedResidential === true ||
          (a.hostelBlock && a.hostelBlock !== 'N/A') ||
          (a.allocatedBedId && a.allocatedBedId !== 'N/A');

        map.set(key, {
          id: String(a.id || a.applicationNo || a.registrationNo),
          name: a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || `Applicant #${a.id}`,
          className: a.appliedClass || a.className || 'Class 10',
          section: a.section || 'A',
          admissionNo: a.applicationNo || a.registrationNo || String(a.id),
          isResidential: Boolean(isRes),
          studentType: isRes ? 'Residential' : 'Day Scholar'
        });
      }
    });

    // Add students from Students store
    rawStudents.forEach((s: any) => {
      if (s) {
        const key = getDedupKey(s);
        const existing = map.get(key);

        const sType = String(s.studentType || s.residenceType || s.facilityOpted || s.residentialStatus || '').toLowerCase();
        const isRes =
          sType.includes('hostel') ||
          sType.includes('residential') ||
          sType.includes('boarder') ||
          s.isHostelRequired === true ||
          s.optedResidential === true ||
          (s.hostelBlock && s.hostelBlock !== 'N/A') ||
          Boolean(existing?.isResidential);

        map.set(key, {
          id: String(s.id || s.studentId || s.admissionNo),
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || existing?.name || `Student #${s.id}`,
          className: s.className || s.class || existing?.className || 'Class 10',
          section: s.section || existing?.section || 'A',
          admissionNo: s.admissionNo || s.registrationNumber || existing?.admissionNo || String(s.id),
          isResidential: Boolean(isRes),
          studentType: s.studentType || existing?.studentType || (isRes ? 'Residential' : 'Day Scholar')
        });
      }
    });

    // Fallback default list if no students exist in DataContext yet
    if (map.size === 0) {
      const defaults = [
        { id: "STF-2026-0001", name: "Rajesh Kumar", className: "Class 10", section: "A", admissionNo: "ADM-2026-101", isResidential: true, studentType: "Residential" },
        { id: "STF-2026-0002", name: "Surya Teja", className: "Class 10", section: "A", admissionNo: "ADM-2026-102", isResidential: true, studentType: "Residential" },
        { id: "STF-2026-0003", name: "Dhanush Y", className: "Class 10", section: "B", admissionNo: "ADM-2026-103", isResidential: true, studentType: "Residential" },
        { id: "STF-2026-0004", name: "Bhanuprakash P", className: "Class 10", section: "B", admissionNo: "ADM-2026-104", isResidential: false, studentType: "Day Scholar" },
        { id: "STF-2026-0005", name: "Saranya Ch", className: "Class 9", section: "A", admissionNo: "ADM-2026-105", isResidential: false, studentType: "Day Scholar" },
        { id: "STF-2026-0006", name: "Ananya Roy", className: "Class 9", section: "B", admissionNo: "ADM-2026-106", isResidential: true, studentType: "Residential" },
        { id: "STF-2026-0007", name: "Sundharam Padala", className: "Class 10", section: "A", admissionNo: "ADM-2026-107", isResidential: true, studentType: "Residential" }
      ];
      defaults.forEach(d => map.set(d.id, d));
    }

    const list = Array.from(map.values());
    
    // Sort so Residential/Hosteller students appear FIRST at the top, followed by Day Scholars
    return list.sort((a, b) => {
      if (a.isResidential && !b.isResidential) return -1;
      if (!a.isResidential && b.isResidential) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [dataContext?.students, dataContext?.admissions]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedNo, setSelectedBedNo] = useState('BED-1');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const getBedOccupant = useCallback((roomIdStr: string, roomNumStr: string, bedNoStr: string) => {
    if ((!roomIdStr && !roomNumStr) || !bedNoStr || !Array.isArray(allocations)) return null;

    const normBed = bedNoStr.toLowerCase().replace(/[^a-z0-9]/g, '');

    return allocations.find(a => {
      if (!a || a.status === 'Vacated' || a.status === 'Inactive') return false;

      const isRoomMatch =
        (roomIdStr && String(a.roomId) === String(roomIdStr)) ||
        (roomNumStr && String(a.roomNumber) === String(roomNumStr) && String(a.hostelId) === String(selectedHostelId));
      if (!isRoomMatch) return false;

      const allocNormBed = (a.bedNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (allocNormBed === normBed) return true;
      if (normBed && allocNormBed && (allocNormBed.endsWith(normBed) || normBed.endsWith(allocNormBed))) return true;

      const allocDigit = (a.bedNumber || '').replace(/\D/g, '');
      const bedDigit = bedNoStr.replace(/\D/g, '');
      if (allocDigit && bedDigit && allocDigit === bedDigit) return true;

      return false;
    });
  }, [allocations, selectedHostelId]);

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
    const handleSync = () => fetchData();
    window.addEventListener('residential_students_updated', handleSync);
    return () => window.removeEventListener('residential_students_updated', handleSync);
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
      const payload = {
        studentId: String(selectedStudentId),
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

  const unallocatedAdmittedHostellers = (candidateStudents || []).filter(s =>
    s && s.isResidential && !safeAllocations.some(a => a && (a.studentId?.toString() === s.id?.toString() || a.admissionNo === s.admissionNo))
  );

  const combinedAssignmentsList = [
    ...safeAllocations.map(a => ({ ...a, isPendingAdmitted: false })),
    ...unallocatedAdmittedHostellers.map(s => ({
      allocationId: `ADM-PENDING-${s.id}`,
      studentId: parseInt(String(s.id || '').replace(/\D/g, ''), 10) || 1001,
      studentName: s.name || (s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : 'Student'),
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterHostel]);

  const filteredAssignments = combinedAssignmentsList.filter(a => {
    const matchQuery = (a.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (a.admissionNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (a.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || !filterHostel || (a.hostelId && a.hostelId.toString() === filterHostel) || a.isPendingAdmitted;
    return matchQuery && matchHostel;
  });

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const selectedBlock = safeBlocks.find(b => b && b.hostelId !== undefined && String(b.hostelId) === String(selectedHostelId));

  const availableRooms = safeRooms.filter(r => {
    if (!r || !selectedHostelId || !selectedBlock) return false;
    const matchId = String(r.hostelId) === String(selectedHostelId);
    const matchCode = Boolean(r.hostelCode && selectedBlock.hostelCode && r.hostelCode.toLowerCase().trim() === selectedBlock.hostelCode.toLowerCase().trim());
    const matchName = Boolean(r.hostelName && selectedBlock.hostelName && r.hostelName.toLowerCase().trim() === selectedBlock.hostelName.toLowerCase().trim());
    return matchId || matchCode || matchName;
  });

  const inheritedWardenName = selectedBlock?.wardenName || 'Unassigned';

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
            <option value="">Select Hostel...</option>
            <option value="All">All Hostels</option>
            {(blocks || [])
              .filter(b => b != null)
              .map((b, idx) => {
                const idVal = b.hostelId !== undefined && b.hostelId !== null ? String(b.hostelId) : String((b as any).id || idx);
                const nameVal = b.hostelName || (b as any).name || `Hostel Block #${idVal}`;
                return (
                  <option key={`stu_filter_${idVal}_${idx}`} value={idVal}>
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
            <UserPlus className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select a Hostel</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Please select a hostel option from the filter dropdown above to view student room allocations.
            </p>
          </div>
        </div>
      ) : (
        <>
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
                paginatedAssignments.map((a, idx) => (
                  <tr key={`alloc_tr_${a.allocationId || a.studentId || 'item'}_${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
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

      <Pagination
        currentPage={currentPage}
        totalItems={filteredAssignments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
        </>
      )}

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
                <StudentInlineCombobox
                  value={selectedStudentId}
                  onChange={val => setSelectedStudentId(val)}
                  students={candidateStudents}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Block <span className="text-rose-500">*</span></label>
                <select 
                  value={selectedHostelId || ''} 
                  onChange={e => {
                    const newHostelId = e.target.value;
                    setSelectedHostelId(newHostelId);
                    const newRooms = (rooms || []).filter(r => r && r.hostelId !== undefined && r.hostelId !== null && String(r.hostelId) === newHostelId);
                    setSelectedRoomId(newRooms.length > 0 ? String(newRooms[0].roomId) : '');
                  }} 
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                  disabled={isSubmitting}
                >
                  <option value="" disabled>Select Hostel Block</option>
                  {(blocks || [])
                    .filter(h => h != null)
                    .map((h, idx) => {
                      const idVal = h.hostelId !== undefined && h.hostelId !== null ? String(h.hostelId) : String((h as any).id || idx);
                      const nameVal = h.hostelName || (h as any).name || `Hostel Block #${idVal}`;
                      return (
                        <option key={`modal_blk_${idVal}_${idx}`} value={idVal}>
                          {nameVal}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Select Room <span className="text-rose-500">*</span></label>
                  <select 
                    value={selectedRoomId} 
                    onChange={e => {
                      const newRoomId = e.target.value;
                      setSelectedRoomId(newRoomId);
                      const targetRm = (availableRooms || []).find(r => String(r.roomId) === String(newRoomId));
                      const cap = targetRm?.bedCapacity || targetRm?.capacity || 4;
                      const rmNum = targetRm?.roomNumber || newRoomId;

                      // Find first available bed for this room
                      const bedOpts = Array.from({ length: Math.max(4, cap) }, (_, i) => `BED-${i + 1}`);
                      const firstVacant = bedOpts.find(bVal => !getBedOccupant(newRoomId, rmNum, bVal));
                      setSelectedBedNo(firstVacant || 'BED-1');
                    }} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                    disabled={isSubmitting || !selectedHostelId}
                  >
                    {!selectedHostelId ? (
                      <option value="" disabled>Select Hostel Block first...</option>
                    ) : availableRooms.length === 0 ? (
                      <option value="" disabled>No rooms created for this block yet</option>
                    ) : (
                      <option value="" disabled>Select Room...</option>
                    )}
                    {(availableRooms || [])
                      .filter(rm => rm != null)
                      .map((rm, idx) => {
                        const rmId = rm.roomId !== undefined && rm.roomId !== null ? String(rm.roomId) : String((rm as any).id || idx);
                        const rmNum = rm.roomNumber || rmId;
                        const cap = rm.bedCapacity || rm.capacity || 4;
                        
                        const rmOccupiedCount = (allocations || []).filter(a => 
                          a && a.status !== 'Vacated' && a.status !== 'Inactive' &&
                          (String(a.roomId) === String(rmId) || (String(a.roomNumber) === String(rmNum) && String(a.hostelId) === String(selectedHostelId)))
                        ).length;

                        const isFull = rmOccupiedCount >= cap;

                        return (
                          <option key={`modal_rm_${rmId}_${idx}`} value={rmId}>
                            Room #{rmNum} ({rmOccupiedCount}/{cap} Occupied{isFull ? ' • FULL' : ''})
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bed Number <span className="text-rose-500">*</span></label>
                  {(() => {
                    const currentRm = (availableRooms || []).find(r => String(r.roomId) === String(selectedRoomId));
                    const cap = currentRm?.bedCapacity || currentRm?.capacity || 4;
                    const rmNum = currentRm?.roomNumber || selectedRoomId;

                    const roomBedOptions = Array.from({ length: Math.max(4, cap) }, (_, i) => {
                      const bedVal = `BED-${i + 1}`;
                      const occupant = getBedOccupant(selectedRoomId, rmNum, bedVal);
                      return {
                        value: bedVal,
                        label: `Bed #${i + 1}`,
                        occupant: occupant ? occupant.studentName || 'Occupied' : null,
                        admissionNo: occupant ? occupant.admissionNo : null
                      };
                    });

                    const currentBedOccupant = getBedOccupant(selectedRoomId, rmNum, selectedBedNo);

                    return (
                      <div>
                        <select 
                          value={selectedBedNo} 
                          onChange={e => setSelectedBedNo(e.target.value)} 
                          className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold font-mono transition-all ${
                            currentBedOccupant ? 'border-amber-400 text-amber-600 dark:text-amber-400' : 'focus:border-sky-500'
                          }`}
                          disabled={isSubmitting}
                        >
                          <option value="" disabled>Select Bed Number...</option>
                          {roomBedOptions.map(b => (
                            <option key={b.value} value={b.value}>
                              {b.label} {b.occupant ? `(Occupied - ${b.occupant})` : '(Available)'}
                            </option>
                          ))}
                        </select>
                        {currentBedOccupant ? (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <span>⚠️ Occupied by {currentBedOccupant.studentName} ({currentBedOccupant.admissionNo})</span>
                          </div>
                        ) : selectedBedNo ? (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <span>✓ {selectedBedNo} is Vacant & Available</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
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
