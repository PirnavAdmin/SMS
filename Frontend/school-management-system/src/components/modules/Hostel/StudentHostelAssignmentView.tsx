import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserPlus, Plus, Search, Shield, User, Edit, Trash2, ChevronDown, Building2, Layers, Home, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { isClassInRange } from '../../../utils/classSorter';
import * as FinanceAPI from '../../../api/finance';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';
import { SearchableSelect } from '../../common/SearchableSelect';
import { useAuth } from '../../../context/AuthContext';
import { getAllocations, createAllocation, vacateAllocation, vacateStudentAllocation, getRooms, getHostelBlocks, formatRoomNumber, getEligibleStudentsForAllocation, BedAllocation, HostelRoom, HostelBlock, EligibleHostelStudent } from '../../../api/hostel';
import { normalizeStudentType } from '../../../utils/studentTypeUtils';

const StudentInlineCombobox: React.FC<{
  students: any[];
  value: string;
  onChange: (val: string, student?: any) => void;
  disabled?: boolean;
}> = ({ students, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedStudent = students.find(s => 
    String(s.id) === String(value) || 
    String(s.studentId) === String(value) || 
    String(s.applicationId) === String(value) ||
    String(s.admissionNo) === String(value)
  );

  useEffect(() => {
    if (selectedStudent) {
      const name = selectedStudent.studentName || selectedStudent.name || '';
      const cls = selectedStudent.className || '';
      const sec = selectedStudent.section ? `-${selectedStudent.section}` : '';
      const adm = selectedStudent.admissionNo || '';
      setSearchText(`${name} (${cls}${sec} â€¢ ${adm})`);
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

  const filteredStudents = useMemo(() => {
    if (!searchText.trim()) return students;
    if (selectedStudent) {
      const selectedLabel = `${selectedStudent.studentName || selectedStudent.name} (${selectedStudent.className}${selectedStudent.section ? `-${selectedStudent.section}` : ''} â€¢ ${selectedStudent.admissionNo})`;
      if (searchText === selectedLabel) return students;
    }
    const q = searchText.toLowerCase().trim();
    return students.filter(st => {
      const nameMatch = (st.studentName || st.name || '').toLowerCase().includes(q);
      const regMatch = (st.admissionNo || st.registrationNo || '').toLowerCase().includes(q);
      const classMatch = (`${st.className || ''}-${st.section || ''}`).toLowerCase().includes(q);
      return nameMatch || regMatch || classMatch;
    });
  }, [students, searchText, selectedStudent]);

  return (
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
            if (!e.target.value) onChange('', undefined);
          }}
          placeholder="Search eligible residential students (by name, adm no, reg no)..."
          className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
        />
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 space-y-0.5 custom-scrollbar">
          {students.length === 0 ? (
            <div className="px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold italic">
              No eligible residential students available for allocation
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold italic">
              No matching eligible residential students found
            </div>
          ) : (
            filteredStudents.map(st => {
              const stId = String(st.id || st.studentId || st.applicationId || st.admissionNo);
              const isSelected = String(value) === stId;
              const name = st.studentName || st.name || 'Student';
              const cls = st.className || '';
              const sec = st.section ? `-${st.section}` : '';
              const adm = st.admissionNo || '';
              const depositAmount = Number(st.paidSecurityDeposit || st.requiredSecurityDeposit || 0);

              return (
                <button
                  key={`eligible_st_${stId}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(stId, st);
                    setSearchText(`${name} (${cls}${sec} â€¢ ${adm})`);
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
                      <span>{name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({cls}${sec} â€¢ ${adm})</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Available for Allocation â€¢ Deposit Paid ({depositAmount > 0 ? `â‚¹${depositAmount.toLocaleString('en-IN')}` : 'Verified'})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-sky-600 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full shrink-0 ml-1">
                    â˜… Residential
                  </span>
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
  const { user, role } = useAuth();
  const userRole = (role || user?.role || '').toLowerCase();
  const isWarden = userRole.includes('warden');

  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<EligibleHostelStudent[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  const fetchEligibleStudents = useCallback(async (search?: string) => {
    try {
      setLoadingEligible(true);
      const data = await getEligibleStudentsForAllocation(search);
      setEligibleStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching eligible students', err);
      setEligibleStudents([]);
    } finally {
      setLoadingEligible(false);
    }
  }, []);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  const wardenAssignedBlocks = React.useMemo(() => {
    if (!isWarden) return blocks;
    const uName = (user?.name || '').toLowerCase().trim();
    const uFirst = uName ? uName.split(' ')[0] : '';
    const uEmail = (user?.email || '').toLowerCase().trim();

    const matched = blocks.filter(b => {
      const wName = (b.wardenName || (b as any).warden || '').toLowerCase().trim();
      const wEmail = (b.email || (b as any).wardenEmail || '').toLowerCase().trim();
      if (uEmail && wEmail && wEmail === uEmail) return true;
      if (uFirst && wName && (wName.includes(uFirst) || uFirst.includes(wName.split(' ')[0]))) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    const defaultWardenBlock = blocks.find(b =>
      (b.hostelName || '').toLowerCase().includes('ramachandra') ||
      (b.hostelName || '').toLowerCase().includes('bhanu') ||
      (b.hostelName || '').toLowerCase().includes('boys')
    );

    return defaultWardenBlock ? [defaultWardenBlock] : (blocks.length > 0 ? [blocks[0]] : []);
  }, [blocks, isWarden, user]);

  const targetBlocks = isWarden ? wardenAssignedBlocks : blocks;
  const targetBlockIds = targetBlocks.map(b => String(b.hostelId || (b as any).id || '')).join(',');

  useEffect(() => {
    if (isWarden && targetBlocks.length > 0 && (!filterHostel || filterHostel === 'All')) {
      setFilterHostel(String(targetBlocks[0].hostelId || (targetBlocks[0] as any).id || ''));
    }
  }, [isWarden, targetBlockIds, filterHostel]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositPaidOverride, setDepositPaidOverride] = useState(false);
  const [collectPaymentMode, setCollectPaymentMode] = useState('Cash');
  const [collectTxnId, setCollectTxnId] = useState('');

  const candidateStudents = React.useMemo(() => {
    const rawStudents = Array.isArray(dataContext?.students) ? dataContext.students : [];
    const rawAdmissions = Array.isArray(dataContext?.admissions) ? dataContext.admissions : [];

    const map = new Map<string, any>();
    const seenAdmNos = new Set<string>();
    const seenNames = new Set<string>();

    const normalize = (v: any) => String(v || '').trim().toLowerCase();

    // 1. Process enrolled students first as primary source of truth
    rawStudents.forEach((s: any) => {
      if (!s) return;
      const sId = String(s.id || s.studentId || '').trim();
      const sAdm = normalize(s.admissionNo || s.registrationNumber || sId);
      const sName = normalize(`${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || `Student #${sId}`);
      const sClass = normalize(s.className || s.class || '');

      const rawType = s.studentType || s.residenceType || s.facilityOpted || s.residentialStatus;
      const normalizedType = normalizeStudentType(rawType);
      const isRes = normalizedType === 'Residential' || s.isHostelRequired === true || s.optedResidential === true;

      const studentObj = {
        id: sId || sAdm,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || `Student #${sId}`,
        className: s.className || s.class || 'Class 10',
        section: s.section || 'A',
        admissionNo: s.admissionNo || s.registrationNumber || sId,
        isResidential: Boolean(isRes),
        studentType: isRes ? 'Residential' : 'Non-Residential',
        hostelSecurityDepositPaid: Boolean(s.hostelSecurityDepositPaid || (s as any).securityDepositPaid)
      };

      const primaryKey = sAdm || `id_${sId}` || `name_${sName}`;
      map.set(primaryKey, studentObj);
      if (sAdm) seenAdmNos.add(sAdm);
      if (sName) {
        seenNames.add(sName);
        if (sClass) seenNames.add(`${sName}__${sClass}`);
      }
    });

    // 2. Add students from Admissions store (only if not already enrolled)
    rawAdmissions.forEach((a: any) => {
      if (!a) return;
      const aId = String(a.id || '').trim();
      const aAdm = normalize(a.admissionNo || a.applicationNo || a.registrationNo || aId);
      const aName = normalize(a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || `Applicant #${aId}`);
      const aClass = normalize(a.appliedClass || a.className || '');

      const rawType = a.studentType || a.residenceType || a.facilityOpted || a.residentialStatus;
      const normalizedType = normalizeStudentType(rawType);
      const isRes = normalizedType === 'Residential' || a.isHostelRequired === true || a.optedResidential === true;

      // Check if this applicant is already in map by admissionNo or Name
      const isAlreadyAdded = (aAdm && seenAdmNos.has(aAdm)) || (aName && seenNames.has(aName));

      if (isAlreadyAdded) {
        // Find existing record and update residential status if opted in admission
        for (const [, existing] of map.entries()) {
          const matchAdm = aAdm && (normalize(existing.admissionNo) === aAdm || normalize(existing.id) === aAdm);
          const matchName = aName && normalize(existing.name) === aName;
          if (matchAdm || matchName) {
            if (isRes) {
              existing.isResidential = true;
              existing.studentType = 'Residential';
            } else {
              existing.isResidential = false;
              existing.studentType = 'Non-Residential';
            }
            break;
          }
        }
        return;
      }

      const admissionObj = {
        id: aId || aAdm,
        name: a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || `Applicant #${aId}`,
        className: a.appliedClass || a.className || 'Class 10',
        section: a.section || 'A',
        admissionNo: a.admissionNo || a.applicationNo || a.registrationNo || aId,
        isResidential: Boolean(isRes),
        studentType: isRes ? 'Residential' : 'Non-Residential',
        hostelSecurityDepositPaid: Boolean(a.hostelSecurityDepositPaid || (a as any).securityDepositPaid)
      };

      const key = aAdm || `id_${aId}` || `name_${aName}`;
      map.set(key, admissionObj);
      if (aAdm) seenAdmNos.add(aAdm);
      if (aName) {
        seenNames.add(aName);
        if (aClass) seenNames.add(`${aName}__${aClass}`);
      }
    });

    const list = Array.from(map.values());
    const activeAllocs = (allocations || []).filter(a => a && a.status !== 'Vacated' && a.status !== 'Inactive' && (a.status === 'Active' || !a.status));

    list.forEach((st: any) => {
      const sId = normalize(st.id);
      const sAdm = normalize(st.admissionNo);
      const sName = normalize(st.name);

      const matchedAlloc = activeAllocs.find(a => {
        const aId = normalize(a.studentId);
        const aAdm = normalize(a.admissionNo);
        const aName = normalize(a.studentName);
        return (sId && aId === sId) || (sAdm && aAdm === sAdm) || (sName && aName === sName) || (sName && aName.includes(sName));
      });

      if (matchedAlloc) {
        st.isAllocated = true;
        st.allocatedBlock = matchedAlloc.hostelName || 'Hostel Block';
        st.allocatedRoom = matchedAlloc.roomNumber || '101';
        st.allocatedBed = matchedAlloc.bedNumber || 'BED-1';
        st.allocationStatus = matchedAlloc.status || 'Active';
      } else {
        st.isAllocated = false;
      }
    });

    // Sort so Residential/Hosteller students appear FIRST at the top, followed by Day Scholars
    return list.sort((a, b) => {
      if (a.isResidential && !b.isResidential) return -1;
      if (!a.isResidential && b.isResidential) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [dataContext?.students, dataContext?.admissions, allocations]);

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
    fetchEligibleStudents();
    const handleSync = () => {
      fetchData();
      fetchEligibleStudents();
    };
    window.addEventListener('residential_students_updated', handleSync);
    window.addEventListener('hostel_allocations_updated', handleSync);
    window.addEventListener('hostel_students_updated', handleSync);
    window.addEventListener('students_updated', handleSync);
    return () => {
      window.removeEventListener('residential_students_updated', handleSync);
      window.removeEventListener('hostel_allocations_updated', handleSync);
      window.removeEventListener('hostel_students_updated', handleSync);
      window.removeEventListener('students_updated', handleSync);
    };
  }, [fetchData, fetchEligibleStudents]);

  const selectedCandidate = useMemo(() => {
    return candidateStudents.find(s => String(s.id) === String(selectedStudentId));
  }, [candidateStudents, selectedStudentId]);

  const candidateClass = selectedCandidate?.className || selectedCandidate?.appliedClass || '';

  const applicableHostelFeeConfig = useMemo(() => {
    if (!selectedStudentId || !selectedRoomId) return null;
    if (!candidateClass) return null;

    const targetRm = (rooms || []).find(r => String(r.roomId || (r as any).id) === String(selectedRoomId));
    const targetSpec = targetRm?.roomTypeSpecification || '';

    const configs = dataContext?.financeHostelConfigs || [];
    let fhc = configs.find(c => {
      if (c.status !== 'Active') return false;
      if (!isClassInRange(candidateClass, c.startClass, c.endClass, c.classRange, dataContext?.academicClasses)) return false;
      const bMatch = !selectedHostelId || String(c.hostelId) === String(selectedHostelId);
      if (!bMatch) return false;
      if (!targetSpec) return true;
      return c.roomTypeName && c.roomTypeName.toLowerCase().includes(targetSpec.toLowerCase());
    });

    if (!fhc) {
      fhc = configs.find(c =>
        c.status === 'Active' &&
        isClassInRange(candidateClass, c.startClass, c.endClass, c.classRange, dataContext?.academicClasses) &&
        (!selectedHostelId || String(c.hostelId) === String(selectedHostelId))
      );
    }

    if (!fhc) {
      fhc = configs.find(c =>
        c.status === 'Active' &&
        isClassInRange(candidateClass, c.startClass, c.endClass, c.classRange, dataContext?.academicClasses)
      );
    }

    return fhc || null;
  }, [selectedStudentId, selectedRoomId, selectedHostelId, candidateClass, rooms, dataContext?.financeHostelConfigs, dataContext?.academicClasses]);

  const secDepAmount = Number(applicableHostelFeeConfig?.securityDeposit) || 0;

  const isDepositAlreadyPaid = useMemo(() => {
    if (secDepAmount <= 0) return true;
    if (depositPaidOverride) return true;
    if (!selectedStudentId) return false;

    const sId = String(selectedStudentId);
    const sAdm = String(selectedCandidate?.admissionNo || '');
    const sName = String(selectedCandidate?.name || '').toLowerCase().trim();

    if ((selectedCandidate as any)?.hostelSecurityDepositPaid) return true;

    const payments = dataContext?.feePayments || [];
    return payments.some(p => {
      const pId = String(p.studentId || '');
      const pAdm = String(p.admissionNo || '');
      const pName = String(p.studentName || '').toLowerCase().trim();

      const matchesId = (pId && (pId === sId || pId === sAdm)) || (pAdm && (pAdm === sId || pAdm === sAdm)) || (sName && pName && sName === pName);
      const isDepositHead =
        String(p.feeHeadName || '').toLowerCase().includes('security deposit') ||
        String(p.remarks || '').toLowerCase().includes('security deposit') ||
        String(p.paidItemsJson || '').toLowerCase().includes('security deposit');

      return matchesId && isDepositHead;
    });
  }, [secDepAmount, depositPaidOverride, selectedStudentId, selectedCandidate, dataContext?.feePayments]);

  const handleOpenAdd = () => {
    fetchEligibleStudents();
    setSelectedStudentId('');
    setSelectedHostelId(isWarden && targetBlocks.length > 0 ? String(targetBlocks[0].hostelId) : '');
    setSelectedRoomId('');
    setSelectedBedNo('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenAddForStudent = (stId: string) => {
    fetchEligibleStudents();
    setSelectedStudentId(stId);
    setSelectedHostelId(isWarden && targetBlocks.length > 0 ? String(targetBlocks[0].hostelId) : '');
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

    if (secDepAmount > 0 && !isDepositAlreadyPaid) {
      addToast('error', 'Security Deposit Required', `Security deposit fee of ${formatCurrency(secDepAmount)} must be paid before allotting a bed to this student.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedSt = eligibleStudents.find(s => 
        String(s.id) === String(selectedStudentId) || 
        String(s.studentId) === String(selectedStudentId) || 
        String(s.applicationId) === String(selectedStudentId) ||
        String(s.admissionNo) === String(selectedStudentId)
      ) || candidateStudents.find(s => String(s.id) === String(selectedStudentId));

      const selectedBlk = blocks.find(b => String(b.hostelId || (b as any).id) === String(selectedHostelId));
      const selectedRm = rooms.find(r => String(r.roomId || (r as any).id) === String(selectedRoomId));

      const payload = {
        studentId: selectedSt?.studentId || (typeof selectedStudentId === 'number' ? selectedStudentId : parseInt(selectedStudentId, 10)) || selectedSt?.applicationId || 0,
        studentName: (selectedSt as any)?.studentName || selectedSt?.name || 'Student',
        admissionNo: selectedSt?.admissionNo || '',
        hostelId: Number(selectedHostelId),
        hostelName: selectedBlk?.hostelName || (selectedBlk as any)?.name || 'Hostel Block',
        roomId: Number(selectedRoomId),
        roomNumber: selectedRm?.roomNumber || '101',
        bedNumber: selectedBedNo || 'BED-1',
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      await createAllocation(payload);
      addToast('success', 'Allocation Created', 'Room & bed allocated successfully');
      fetchEligibleStudents();


      
      if (dataContext?.assignStudentHostelRoom) {
        dataContext.assignStudentHostelRoom({
          studentId: String(selectedStudentId),
          studentName: (selectedSt as any)?.studentName || selectedSt?.name || 'Student',
          admissionNo: selectedSt?.admissionNo || `ADM-${selectedStudentId}`,
          hostelId: String(selectedHostelId),
          hostelName: selectedBlk?.hostelName || (selectedBlk as any)?.name || 'Hostel Block',
          roomNo: selectedRm?.roomNumber || '101',
          bedNo: selectedBedNo || 'BED-1',
          joiningDate: joiningDate || new Date().toISOString().split('T')[0],
          status: 'Active',
        } as any);
      }

      setIsModalOpen(false);
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_data_updated'));
        window.dispatchEvent(new Event('residential_students_updated'));
        window.dispatchEvent(new Event('students_updated'));
      }
    } catch (error: any) {
      addToast('error', 'Allocation Failed', error?.message || 'Failed to allocate room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVacate = async (a: BedAllocation) => {
    try {
      await vacateStudentAllocation(a.studentId, a.admissionNo, a.allocationId);
      addToast('success', 'Room Vacated', 'The bed allocation has been vacated.');
      if (dataContext?.deleteStudentHostelAssignment && a.allocationId) {
        dataContext.deleteStudentHostelAssignment(String(a.allocationId));
      }
      fetchData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_data_updated'));
        window.dispatchEvent(new Event('residential_students_updated'));
        window.dispatchEvent(new Event('students_updated'));
      }
    } catch (error: any) {
      addToast('error', 'Failed to vacate', error?.message || 'Vacate error');
    }
  };

  const [viewStudentModal, setViewStudentModal] = useState<BedAllocation | null>(null);

  // Filter active bed allocations and unallocated students
  const safeAllocations = useMemo(() => {
    return (Array.isArray(allocations) ? allocations : []).filter(a => {
      return a && a.status !== 'Vacated' && a.status !== 'Inactive';
    });
  }, [allocations]);

  const unallocatedAdmittedHostellers = useMemo(() => {
    const allocatedIds = new Set<string>();
    const allocatedAdmNos = new Set<string>();
    const allocatedNames = new Set<string>();

    safeAllocations.forEach(a => {
      if (a.studentId) allocatedIds.add(String(a.studentId).trim().toLowerCase());
      if (a.admissionNo) allocatedAdmNos.add(String(a.admissionNo).trim().toLowerCase());
      if (a.studentName) allocatedNames.add(String(a.studentName).trim().toLowerCase());
    });

    const seenUnallocated = new Set<string>();

    return (candidateStudents || []).filter(s => {
      if (!s || !s.isResidential || s.studentType === 'Day Scholar') return false;

      // STRICT GATE: Only students who have paid the security deposit fee reflect in Student Room Allocations!
      const sId = String(s.id || '').trim();
      const sAdm = String(s.admissionNo || '').trim();
      const sName = String(s.name || '').trim().toLowerCase();

      const candidateApp = (dataContext?.admissions || []).find(a => 
        String(a.id) === sId || (sAdm && String(a.admissionNo || a.applicationNo || a.registrationNo) === sAdm)
      );
      const isDepositFlagPaid = Boolean(
        s.hostelSecurityDepositPaid || 
        (s as any).securityDepositPaid || 
        candidateApp?.hostelSecurityDepositPaid
      );

      const payments = dataContext?.feePayments || [];
      const hasDepPayment = payments.some(p => {
        const pId = String(p.studentId || '');
        const pAdm = String(p.admissionNo || '');
        const pName = String(p.studentName || '').toLowerCase().trim();
        const matchesId = (pId && (pId === sId || pId === sAdm)) || (pAdm && (pAdm === sId || pAdm === sAdm)) || (sName && pName && sName === pName);
        const isDepHead =
          String(p.feeHeadName || '').toLowerCase().includes('security deposit') ||
          String((p as any).feeType || '').toLowerCase().includes('security deposit') ||
          String(p.remarks || '').toLowerCase().includes('security deposit') ||
          String(p.paidItemsJson || '').toLowerCase().includes('security deposit') ||
          (Array.isArray(p.paymentAllocation) && p.paymentAllocation.some(alloc => String(alloc.feeHeadName || '').toLowerCase().includes('security deposit')));
        return matchesId && isDepHead;
      });

      if (!isDepositFlagPaid && !hasDepPayment) {
        return false;
      }

      // Check if already allocated
      const isAllocated =
        (sId && allocatedIds.has(sId.toLowerCase())) ||
        (sAdm && allocatedAdmNos.has(sAdm.toLowerCase())) ||
        (sName && allocatedNames.has(sName));

      if (isAllocated) return false;

      // Deduplicate unallocated entries
      const dedupKey = sAdm || sName || sId;
      if (seenUnallocated.has(dedupKey)) return false;
      seenUnallocated.add(dedupKey);
      if (sAdm) seenUnallocated.add(sAdm);
      if (sName) seenUnallocated.add(sName);

      return true;
    });
  }, [safeAllocations, candidateStudents]);

  const combinedAssignmentsList = useMemo(() => {
    const rawList = [
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

    const seenListKeys = new Set<string>();
    return rawList.filter(item => {
      if (!item) return false;
      const admKey = (item.admissionNo || '').trim().toLowerCase();
      const nameKey = (item.studentName || '').trim().toLowerCase();
      const itemKey = admKey ? `adm_${admKey}` : `name_${nameKey}`;
      if (seenListKeys.has(itemKey)) return false;
      seenListKeys.add(itemKey);
      if (admKey) seenListKeys.add(`adm_${admKey}`);
      if (nameKey) seenListKeys.add(`name_${nameKey}`);
      return true;
    });
  }, [safeAllocations, unallocatedAdmittedHostellers]);

  const [filterFloor, setFilterFloor] = useState('All Floors');
  const [filterRoom, setFilterRoom] = useState('All Rooms');

  const availableFloorOptions = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => {
      if (r && r.floorLevel) set.add(r.floorLevel);
    });
    const list = Array.from(set).sort();
    return ['All Floors', ...list.length > 0 ? list : ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor']];
  }, [rooms]);

  const availableRoomOptions = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => {
      if (r && r.roomNumber) set.add(formatRoomNumber(r.roomNumber));
    });
    const list = Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
    return ['All Rooms', ...list];
  }, [rooms]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterHostel, filterFloor, filterRoom]);

  const filteredAssignments = combinedAssignmentsList.filter(a => {
    const isBlockAllowed = !isWarden || targetBlocks.some(b =>
      (a.hostelId && String(b.hostelId) === String(a.hostelId)) ||
      (a.hostelName && b.hostelName && b.hostelName.toLowerCase().trim() === a.hostelName.toLowerCase().trim()) ||
      a.isPendingAdmitted
    );
    if (!isBlockAllowed) return false;

    const matchQuery = (a.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (a.admissionNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (a.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const selectedFilterBlock = blocks.find(b => String(b.hostelId || (b as any).id) === String(filterHostel));
    const matchHostel =
      filterHostel === 'All' ||
      !filterHostel ||
      a.isPendingAdmitted ||
      (a.hostelId && String(a.hostelId) === String(filterHostel)) ||
      (selectedFilterBlock && a.hostelName && a.hostelName.toLowerCase().trim() === selectedFilterBlock.hostelName.toLowerCase().trim());

    const matchFloor = filterFloor === 'All Floors' || !filterFloor || ((a as any).floorLevel && (a as any).floorLevel.toLowerCase() === filterFloor.toLowerCase()) || a.isPendingAdmitted;
    const matchRoom = filterRoom === 'All Rooms' || !filterRoom || (a.roomNumber && formatRoomNumber(a.roomNumber) === filterRoom) || a.isPendingAdmitted;

    return matchQuery && matchHostel && matchFloor && matchRoom;
  });

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeBlocks = Array.isArray(targetBlocks) ? targetBlocks : [];
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
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student, adm no, room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {isWarden ? (
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center h-[38px] truncate">
              {targetBlocks[0]?.hostelName || 'Assigned Hostel Block'}
            </div>
          ) : (
            <select
              value={filterHostel}
              onChange={e => setFilterHostel(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="">Select Hostel...</option>
              <option value="All">All Hostels</option>
              {(targetBlocks || [])
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
          )}

          <select
            value={filterFloor}
            onChange={e => setFilterFloor(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {availableFloorOptions.map((f: string) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select
            value={filterRoom}
            onChange={e => setFilterRoom(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {availableRoomOptions.map((r: string) => (
              <option key={r} value={r}>{r}</option>
            ))}
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
                        : (blocks.find(b => String(b.hostelId ?? '') === String(a.hostelName || (a as any).hostelId))?.hostelName || `Block #${a.hostelName || '1'}`)}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold">
                      {a.isPendingAdmitted ? (
                        <span className="text-amber-600">Unassigned (Needs Room)</span>
                      ) : (
                        <span className="text-emerald-600">{formatRoomNumber(a.roomNumber)} ({a.bedNumber || 'BED-1'})</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">Select Student <span className="text-rose-500">*</span></label>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                    Residential &amp; Deposit Paid Only
                  </span>
                </div>
                <StudentInlineCombobox
                  value={selectedStudentId}
                  onChange={val => setSelectedStudentId(val)}
                  students={eligibleStudents}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Block <span className="text-rose-500">*</span></label>
                {isWarden ? (
                  <div className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sky-600 dark:text-sky-400">
                    {targetBlocks[0]?.hostelName || 'Assigned Hostel Block'}
                  </div>
                ) : (
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
                    {(targetBlocks || [])
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
                )}
              </div>

              {selectedStudentId && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Hostel Security Deposit: Verified &amp; Paid
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-300">
                    PAID
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Select Room <span className="text-rose-500">*</span></label>
                  <select 
                    value={selectedRoomId} 
                    onChange={e => {
                      const newRoomId = e.target.value;
                      setSelectedRoomId(newRoomId);
                      const targetRm = (availableRooms || []).find(r => String(r.roomId) === String(newRoomId));
                      const cap = Number(targetRm?.bedCapacity) || Number(targetRm?.capacity) || 1;
                      const rmNum = targetRm?.roomNumber || newRoomId;

                      // Find first available bed for this room
                      const bedOpts = Array.from({ length: Math.max(1, cap) }, (_, i) => `BED-${i + 1}`);
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
                        const cap = Number(rm.bedCapacity) || Number(rm.capacity) || 1;
                        const spec = rm.roomTypeSpecification || 'Room';
                        
                        const rmOccupiedCount = (allocations || []).filter(a => 
                          a && a.status !== 'Vacated' && a.status !== 'Inactive' &&
                          (String(a.roomId) === String(rmId) || (String(a.roomNumber) === String(rmNum) && String(a.hostelId) === String(selectedHostelId)))
                        ).length;

                        const isFull = rmOccupiedCount >= cap;

                        return (
                          <option key={`modal_rm_${rmId}_${idx}`} value={rmId}>
                            {formatRoomNumber(rmNum)} • {spec} ({rmOccupiedCount}/{cap} Occupied{isFull ? ' • FULL' : ''})
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bed Number <span className="text-rose-500">*</span></label>
                  {(() => {
                    const currentRm = (availableRooms || []).find(r => String(r.roomId) === String(selectedRoomId));
                    const cap = Number(currentRm?.bedCapacity) || Number(currentRm?.capacity) || 1;
                    const rmNum = currentRm?.roomNumber || selectedRoomId;

                    const roomBedOptions = Array.from({ length: Math.max(1, cap) }, (_, i) => {
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
                          onChange={e => {
                            if (secDepAmount > 0 && !isDepositAlreadyPaid) {
                              addToast('error', 'Security Deposit Required', `Security deposit fee of ${formatCurrency(secDepAmount)} must be paid before selecting a bed.`);
                              return;
                            }
                            setSelectedBedNo(e.target.value);
                          }} 
                          className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold font-mono transition-all ${
                            currentBedOccupant ? 'border-amber-400 text-amber-600 dark:text-amber-400' : 'focus:border-sky-500'
                          } ${secDepAmount > 0 && !isDepositAlreadyPaid ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60' : ''}`}
                          disabled={isSubmitting || (secDepAmount > 0 && !isDepositAlreadyPaid)}
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
      {viewStudentModal && (() => {
        const matchedStudent = students.find(s => 
          String(s.id) === String(viewStudentModal.studentId) || 
          String(s.admissionNo) === String(viewStudentModal.admissionNo)
        );
        const parentName = matchedStudent?.fatherName || matchedStudent?.parentName || (matchedStudent as any)?.guardianName || (matchedStudent as any)?.motherName || 'Parent / Guardian';
        const parentPhone = matchedStudent?.fatherPhone || matchedStudent?.guardianPhone || matchedStudent?.phone || (matchedStudent as any)?.emergencyContact || (matchedStudent as any)?.parentPhone || 'N/A';
        const matchedBlock = blocks.find(b => 
          String(b.hostelId) === String(viewStudentModal.hostelId) || 
          b.hostelName === viewStudentModal.hostelName
        );
        const wardenName = (viewStudentModal as any).wardenName || (matchedBlock as any)?.wardenName || (matchedBlock as any)?.warden || 'Assigned Warden';

        return (
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
                    <span className="font-mono font-bold text-emerald-600">{formatRoomNumber(viewStudentModal.roomNumber)} ({viewStudentModal.bedNumber || 'BED-1'})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Joining Date</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{viewStudentModal.joiningDate ? viewStudentModal.joiningDate.split('T')[0] : 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Warden</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{wardenName}</span>
                  </div>
                </div>

                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 text-[11px] space-y-1">
                  <span className="font-bold text-sky-800 dark:text-sky-300 block">📞 Emergency Contact & Guardian:</span>
                  <p className="text-slate-600 dark:text-slate-300">Guardian: <strong>{parentName}</strong> ({parentPhone})</p>
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
        );
      })()}
    </div>
  );
};
