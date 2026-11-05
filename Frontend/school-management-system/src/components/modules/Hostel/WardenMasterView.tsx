// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Edit, Trash2, Plus, Search, ShieldCheck, History, UserCheck, Layers, Building, Filter, Eye } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { DateInput } from '../../common/DateInput';
import { SearchableSelect } from '../../common/SearchableSelect';
import { getWardens, getStaffCandidates, getHostelBlocks, assignWarden, deleteWarden, HostelBlock, StaffCandidate } from '../../../api/hostel';

interface WardenRecord {
  wardenId: number;
  hostelId: number;
  hostelName: string;
  staffId: number;
  employeeId: string;
  wardenName: string;
  mobileNumber: string;
  emailAddress: string;
  createdAt: string;
}

interface WardenMasterViewProps {
  selectedHostelFilter?: string;
  onHostelFilterChange?: (hostelName: string) => void;
}

export const WardenMasterView: React.FC<WardenMasterViewProps> = ({
  selectedHostelFilter,
  onHostelFilterChange
}) => {
  const dataContext = useData();
  const contextStaff = Array.isArray(dataContext?.staff) ? dataContext.staff : [];
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [localFilterHostel, setLocalFilterHostel] = useState(() => {
    try {
      const saved = localStorage.getItem('hostel_warden_filter') || localStorage.getItem('hostel_master_selected_filter') || '';
      return (saved === 'All' || saved === 'ALL_HOSTELS') ? 'ALL_HOSTELS' : saved;
    } catch {
      return '';
    }
  });

  const filterHostel = selectedHostelFilter !== undefined
    ? ((selectedHostelFilter === 'All' || selectedHostelFilter === 'ALL_HOSTELS') ? 'ALL_HOSTELS' : selectedHostelFilter)
    : localFilterHostel;

  const [manualHostelInput, setManualHostelInput] = useState('');
  const effectiveHostel = filterHostel === 'MANUAL' ? manualHostelInput : filterHostel;

  const handleFilterHostelChange = (val: string) => {
    setLocalFilterHostel(val);
    try {
      localStorage.setItem('hostel_warden_filter', val);
      if (val === 'ALL_HOSTELS') {
        localStorage.setItem('hostel_master_selected_filter', 'All');
      } else if (val && val !== 'MANUAL') {
        localStorage.setItem('hostel_master_selected_filter', val);
      }
    } catch {}
    if (onHostelFilterChange) {
      onHostelFilterChange(val === 'ALL_HOSTELS' ? 'All' : val);
    }
    if (val !== 'MANUAL') setManualHostelInput('');
  };

  const [wardens, setWardens] = useState<WardenRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffCandidate[]>([]);
  const [hostels, setHostels] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingWarden, setDeletingWarden] = useState<WardenRecord | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [wardensData, staffData, hostelsData] = await Promise.all([
        getWardens(),
        getStaffCandidates(),
        getHostelBlocks()
      ]);
      setWardens(wardensData);
      setStaffList(staffData);
      setHostels(hostelsData);
    } catch (error: any) {
      addToast('error', 'Failed to load data', error.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredWardens = useMemo(() => {
    if (!filterHostel && !searchQuery.trim()) return [];
    return wardens.map(w => {
      const matchedStaff = staffList.find(s => 
        (s.employeeId && w.employeeId && s.employeeId.toLowerCase() === w.employeeId.toLowerCase()) ||
        (s.staffId && w.staffId && Number(s.staffId) === Number(w.staffId))
      );
      const matchedHostel = hostels.find(h => 
        (h.hostelName && w.hostelName && h.hostelName.toLowerCase() === w.hostelName.toLowerCase()) ||
        (h.hostelId && w.hostelId && Number(h.hostelId) === Number(w.hostelId))
      );

      const name = w.wardenName || w.staffName || matchedStaff?.staffName || matchedHostel?.wardenName || 'Assigned Warden';
      const mobile = w.mobileNumber || w.phone || matchedStaff?.phone || matchedHostel?.primaryMobileNumber || 'N/A';
      const mail = w.emailAddress || w.email || matchedStaff?.email || matchedHostel?.email || 'N/A';
      const empId = w.employeeId || matchedStaff?.employeeId || `EMP-${w.wardenId || '1001'}`;

      return {
        ...w,
        employeeId: empId,
        wardenName: name,
        mobileNumber: mobile,
        emailAddress: mail
      };
    }).filter(w => {
      const matchesSearch =
        (w.wardenName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.hostelName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHostel = !effectiveHostel || effectiveHostel === 'ALL_HOSTELS' || effectiveHostel === 'All' || (w.hostelName || '').toLowerCase().includes(effectiveHostel.toLowerCase().trim());
      return matchesSearch && matchesHostel;
    });
  }, [wardens, staffList, hostels, searchQuery, filterHostel, effectiveHostel]);

  const wardenCandidates = useMemo(() => {
    // 100% dynamic candidates from backend API & DataContext staff list (zero hardcoded mock wardens)
    const combinedList: any[] = [];
    const seenIds = new Set<string>();

    const pushItem = (item: any) => {
      if (!item) return;
      const sId = String(item.staffId ?? item.id ?? '');
      if (!sId || seenIds.has(sId)) return;
      seenIds.add(sId);
      combinedList.push(item);
    };

    (staffList || []).forEach(pushItem);
    contextStaff.forEach((cs: any) => {
      pushItem({
        staffId: Number(cs.id) || cs.staffId,
        employeeId: cs.empId || cs.employeeId,
        staffName: cs.name || cs.staffName,
        designation: cs.designation,
        phone: cs.phone || cs.mobileNumber,
        email: cs.email || cs.emailAddress,
        role: cs.role,
        employeeCategory: cs.employeeCategory,
        department: cs.department
      });
    });

    // ONLY hostel wardens (strictly filtering out teachers, drivers, attendants, accountants, etc.)
    const onlyHostelWardens = combinedList.filter(s => {
      const desig = (s.designation || '').toLowerCase().trim();
      const role = ((s as any).role || '').toLowerCase().trim();
      const cat = ((s as any).employeeCategory || '').toLowerCase().trim();
      return desig.includes('warden') || role.includes('warden') || cat.includes('warden');
    });

    return onlyHostelWardens.map(s => ({
      staffId: s.staffId ?? Number(s.id),
      employeeId: s.employeeId || s.empId || `STF-${s.staffId || s.id}`,
      staffName: s.staffName || s.name || `${(s as any).firstName || ''} ${(s as any).lastName || ''}`.trim() || 'Staff Member',
      designation: s.designation || 'Hostel Warden',
      phone: s.phone || s.mobileNumber || '',
      email: s.email || s.emailAddress || ''
    }));
  }, [staffList, contextStaff]);

  const wardenSelectOptions = useMemo(() => {
    return wardenCandidates.map(s => ({
      value: String(s.staffId),
      label: `${s.staffName} (${s.designation || 'Hostel Warden'})`,
      code: s.employeeId
    }));
  }, [wardenCandidates]);

  const hostelSelectOptions = useMemo(() => {
    return hostels
      .filter(h => h && h.hostelId && h.hostelName && !h.hostelName.includes('undefined'))
      .map(h => ({
        value: String(h.hostelId),
        label: `${h.hostelName} (${h.hostelType || 'Hostel'})`
      }));
  }, [hostels]);

  const handleOpenAdd = () => {
    setSelectedStaffId('');
    setSelectedHostelId('');
    setSelectedBlock('');
    setSelectedFloor('');
    setAssignmentDate('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      addToast('warning', 'Selection Required', 'Please select a hostel warden.');
      return;
    }
    if (!selectedHostelId) {
      addToast('warning', 'Selection Required', 'Please select a hostel block.');
      return;
    }

    if (!assignmentDate || !assignmentDate.trim()) {
      addToast('warning', 'Selection Required', 'Please select an assignment date.');
      return;
    }

    const staffMember = (wardenCandidates || []).find(s => String(s.staffId ?? '') === selectedStaffId);
    if (!staffMember) {
      addToast('error', 'Error', 'Selected staff member not found.');
      return;
    }

    try {
      await assignWarden({
        hostelId: Number(selectedHostelId),
        staffId: Number(selectedStaffId),
        employeeId: staffMember.employeeId,
        wardenName: staffMember.staffName,
        mobileNumber: staffMember.phone || '0000000000',
        emailAddress: staffMember.email || 'no-email@school.edu',
        assignedDate: assignmentDate
      });
      addToast('success', 'Hostel Warden Assigned', `Assigned ${staffMember.staffName} successfully.`);
      setIsModalOpen(false);
      setSelectedStaffId('');
      setSelectedHostelId('');
      setAssignmentDate('');
      fetchData();
    } catch (error: any) {
      addToast('error', 'Assignment Failed', error.message);
    }
  };

  const handleRevoke = async () => {
    if (deletingWarden) {
      try {
        await deleteWarden(deletingWarden.wardenId);
        addToast('success', 'Warden Assignment Revoked', `Revoked assignment for ${deletingWarden.wardenName}`);
        setDeletingWarden(null);
        fetchData();
      } catch (error: any) {
        addToast('error', 'Failed to revoke', error.message);
      }
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-500" /> Wardens
          </h2>
          </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Warden
          </button>
          <ExportButton data={filteredWardens} filename="hostel_warden_assignments" />
        </div>
      </div>

      <div className="glass-card p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search warden by name, ID, hostel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 h-[34px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <select
            value={filterHostel}
            onChange={e => handleFilterHostelChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:border-sky-500 min-w-[180px]"
          >
            <option value="">-- Select Hostel --</option>
            <option value="ALL_HOSTELS">All Hostels</option>
            {hostels.map(h => <option key={h.hostelId} value={h.hostelName}>{h.hostelName}</option>)}
            <option value="MANUAL">✍️ Custom / Manual Entry</option>
          </select>

          {filterHostel === 'MANUAL' && (
            <input
              type="text"
              placeholder="Type manual hostel..."
              value={manualHostelInput}
              onChange={e => setManualHostelInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          )}
        </div>
      </div>

      {!filterHostel && !searchQuery.trim() ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-sky-300 dark:border-sky-800 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">No Hostel Filter Selected</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Please select a hostel block from the filter dropdown above or use search/manual entry to load warden records.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleFilterHostelChange('ALL_HOSTELS')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer hover:shadow-lg active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>View All Wardens</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 text-center">Employee ID</th>
                  <th className="py-3.5 px-4 text-center">Warden Name</th>
                  <th className="py-3.5 px-4 text-center">Mobile & Email</th>
                  <th className="py-3.5 px-4 text-center">Assigned Hostel</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">Loading wardens...</td>
                  </tr>
                ) : filteredWardens.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No warden assignments found matching filter.</td>
                  </tr>
                ) : (
                  filteredWardens.map(a => (
                    <tr key={a.wardenId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{a.employeeId}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{a.wardenName}</td>
                      <td className="py-3 px-4 text-center">
                        <p className="font-mono font-bold text-sky-600">{a.mobileNumber}</p>
                        <p className="text-[10px] text-slate-400">{a.emailAddress}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sky-600 dark:text-sky-400">{a.hostelName}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 mx-auto">
                          <button onClick={() => setDeletingWarden(a)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600" title="Revoke Assignment"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assign Warden
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Select Hostel Warden <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <SearchableSelect
                  value={selectedStaffId}
                  onChange={val => setSelectedStaffId(val)}
                  options={wardenSelectOptions}
                  placeholder="Select Hostel Warden"
                  searchPlaceholder="Search hostel warden..."
                  showSearch={true}
                />
                <p className="text-[10px] font-semibold text-slate-400 mt-1">Dedicated Hostel Warden directory auto-loaded for assignment.</p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Select Hostel Block <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <SearchableSelect
                  value={selectedHostelId}
                  onChange={val => setSelectedHostelId(val)}
                  options={hostelSelectOptions}
                  placeholder="Select Hostel Block"
                  searchPlaceholder="Search hostel block..."
                  showSearch={true}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Assignment Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <DateInput
                  value={assignmentDate}
                  onChange={e => setAssignmentDate(e.target.value)}
                  placeholder="Select Assignment Date"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingWarden && (
        <ConfirmModal
          isOpen={true}
          title="Revoke Assignment"
          message={`Are you sure you want to revoke warden assignment for ${deletingWarden.wardenName}?`}
          onConfirm={handleRevoke}
          onCancel={() => setDeletingWarden(null)}
        />
      )}
    </div>
  );
};
