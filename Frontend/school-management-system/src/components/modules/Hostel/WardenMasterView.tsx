// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Edit, Trash2, Plus, Search, ShieldCheck, History, UserCheck, Layers, Building, Filter } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
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

export const WardenMasterView: React.FC = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('');
  const [manualHostelInput, setManualHostelInput] = useState('');
  const effectiveHostel = filterHostel === 'MANUAL' ? manualHostelInput : filterHostel;

  const [wardens, setWardens] = useState<WardenRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffCandidate[]>([]);
  const [hostels, setHostels] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingWarden, setDeletingWarden] = useState<WardenRecord | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Block A');
  const [selectedFloor, setSelectedFloor] = useState('Floor 1');
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

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
      const matchesHostel = !effectiveHostel || effectiveHostel === 'ALL_HOSTELS' || (w.hostelName || '').toLowerCase().includes(effectiveHostel.toLowerCase().trim());
      return matchesSearch && matchesHostel;
    });
  }, [wardens, staffList, hostels, searchQuery, filterHostel, effectiveHostel]);

  const wardenCandidates = useMemo(() => {
    const predefinedWardens = [
      { staffId: 101, employeeId: 'STF-2026-NTS-01', staffName: 'Dr. Eleanor Vance', designation: 'Chief Hostel Warden' },
      { staffId: 102, employeeId: 'STF-2026-NTS-02', staffName: 'Rajesh Kumar', designation: 'Senior Hostel Warden' },
      { staffId: 103, employeeId: 'STF-2026-NTS-03', staffName: 'Savitri Devi', designation: 'Girls Hostel Warden' },
      { staffId: 104, employeeId: 'STF-2026-NTS-04', staffName: 'Vikram Singh', designation: 'Assistant Hostel Warden' },
    ];

    const fromStaffList = (staffList || [])
      .filter(s => {
        const desig = (s.designation || '').toLowerCase();
        const role = ((s as any).role || '').toLowerCase();
        const cat = ((s as any).employeeCategory || '').toLowerCase();
        return desig.includes('warden') || role.includes('warden') || cat.includes('warden');
      })
      .map(s => ({
        ...s,
        designation: s.designation || 'Hostel Warden'
      }));

    const combined = [...predefinedWardens, ...fromStaffList];
    return Array.from(new Map(combined.map(item => [item.staffId, item])).values());
  }, [staffList]);

  const handleOpenAdd = () => {
    setSelectedStaffId(wardenCandidates.length > 0 ? wardenCandidates[0].staffId.toString() : '101');
    setSelectedHostelId(hostels.length > 0 ? hostels[0].hostelId.toString() : '1');
    setSelectedBlock('Block A');
    setSelectedFloor('Floor 1');
    setAssignmentDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedHostelId) {
      addToast('warning', 'Selection Required', 'Please select an employee and a hostel.');
      return;
    }

    const staffMember = (wardenCandidates || []).find(s => s.staffId.toString() === selectedStaffId);
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
        emailAddress: staffMember.email || 'no-email@school.edu'
      });
      addToast('success', 'Hostel Warden Assigned', `Assigned ${staffMember.staffName} successfully.`);
      setIsModalOpen(false);
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
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-500" /> Wardens
          </h2>
          </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Warden
          </button>
          <ExportButton data={filteredWardens} filename="hostel_warden_assignments" />
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search warden by name, ID, hostel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <select
            value={filterHostel}
            onChange={e => {
              setFilterHostel(e.target.value);
              if (e.target.value !== 'MANUAL') setManualHostelInput('');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:border-sky-500 min-w-[180px]"
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
        </div>
      ) : (
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Warden Name</th>
                  <th className="py-3.5 px-4">Mobile & Email</th>
                  <th className="py-3.5 px-4">Assigned Hostel</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
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
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{a.employeeId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.wardenName}</td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-sky-600">{a.mobileNumber}</p>
                        <p className="text-[10px] text-slate-400">{a.emailAddress}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{a.hostelName}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                <label className="block font-semibold mb-1">Select Hostel Warden <span className="text-rose-500">*</span></label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full max-w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white truncate outline-none cursor-pointer"
                >
                  {wardenCandidates.map(s => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.staffName} ({s.designation})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">Dedicated Hostel Warden directory auto-loaded for assignment.</p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Block <span className="text-rose-500">*</span></label>
                <select
                  value={selectedHostelId}
                  onChange={e => setSelectedHostelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600 dark:text-sky-400"
                >
                  {hostels
                    .filter(h => h && h.hostelId && h.hostelName && !h.hostelName.includes('undefined'))
                    .map(h => (
                      <option key={h.hostelId} value={h.hostelId}>
                        {h.hostelName} ({h.hostelType || 'Boys Hostel'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assignment Date</label>
                <input
                  type="date"
                  value={assignmentDate}
                  onChange={e => setAssignmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
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
