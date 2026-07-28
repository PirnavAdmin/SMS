import React, { useState, useEffect, useCallback } from 'react';
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
  const [filterHostel, setFilterHostel] = useState('All');

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

  const filteredWardens = wardens.filter(w => {
    const matchesSearch =
      (w.wardenName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.hostelName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHostel = filterHostel === 'All' || w.hostelName === filterHostel;
    return matchesSearch && matchesHostel;
  });

  const handleOpenAdd = () => {
    setSelectedStaffId(staffList.length > 0 ? staffList[0].staffId.toString() : '');
    setSelectedHostelId(hostels.length > 0 ? hostels[0].hostelId.toString() : '');
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

    const staffMember = staffList.find(s => s.staffId.toString() === selectedStaffId);
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
            <ShieldCheck className="w-6 h-6 text-sky-500" /> Unified Hostel Warden Allocation
          </h2>
          <p className="text-xs text-slate-500">Assign non-teaching staff to hostels without record duplication</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Warden
          </button>
          <ExportButton data={wardens} filename="hostel_warden_assignments" />
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
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterHostel}
            onChange={e => setFilterHostel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Hostels</option>
            {hostels.map(h => <option key={h.hostelId} value={h.hostelName}>{h.hostelName}</option>)}
          </select>
        </div>
      </div>

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
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">No warden assignments found. Click "Assign Warden" to assign.</td>
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
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{a.hostelName}</td>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assign Hostel Warden
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Employee (Staff & HR Master) *</label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                >
                  {staffList.map(s => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.staffName} ({s.employeeId} • {s.designation})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Personal info auto-loads from Staff & HR database</p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel *</label>
                <select
                  value={selectedHostelId}
                  onChange={e => setSelectedHostelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-indigo-600"
                >
                  {hostels.map(h => (
                    <option key={h.hostelId} value={h.hostelId}>
                      {h.hostelName} ({h.hostelType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Assign Block *</label>
                  <select
                    value={selectedBlock}
                    onChange={e => setSelectedBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assign Floor *</label>
                  <select
                    value={selectedFloor}
                    onChange={e => setSelectedFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Floor 3">Floor 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assignment Effective Date</label>
                <input
                  type="date"
                  value={assignmentDate}
                  onChange={e => setAssignmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold">Assign Responsibility</button>
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