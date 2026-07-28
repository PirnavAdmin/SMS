import React, { useState } from 'react';
import { Users, Edit, Trash2, Plus, Search, ShieldCheck, History, UserCheck, Layers, Building, Filter } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Staff, HostelAssignment, HostelAssignmentLogItem } from '../../../types';

export const initialHostelAssignments: HostelAssignment[] = [
  {
    id: 'hw-1',
    staffId: 'STF-05',
    empId: 'EMP005',
    employeeName: 'Ravi Kumar',
    designation: 'Hostel Warden',
    mobileNumber: '+1 555-901-234',
    email: 'ravi.kumar@stxaviers.edu',
    hostelId: 'HM-1',
    hostelName: 'Boys Hostel',
    block: 'Block A',
    floor: 'Floor 1',
    assignmentDate: '2026-04-01',
    status: 'Active',
    roleType: 'Warden'
  },
  {
    id: 'hw-2',
    staffId: 'STF-06',
    empId: 'EMP006',
    employeeName: 'Priya Sharma',
    designation: 'Senior Hostel Warden',
    mobileNumber: '+1 555-012-345',
    email: 'priya.sharma@stxaviers.edu',
    hostelId: 'HM-2',
    hostelName: 'Girls Hostel',
    block: 'Block B',
    floor: 'Floor 2',
    assignmentDate: '2026-04-01',
    status: 'Active',
    roleType: 'Warden'
  },
  {
    id: 'hw-3',
    staffId: 'STF-07',
    empId: 'EMP007',
    employeeName: 'Suresh Raina',
    designation: 'Assistant Hostel Warden',
    mobileNumber: '+1 555-123-456',
    email: 'suresh.raina@stxaviers.edu',
    hostelId: 'HM-1',
    hostelName: 'Boys Hostel',
    block: 'Block C',
    floor: 'Floor 1',
    assignmentDate: '2026-04-01',
    status: 'Active',
    roleType: 'Warden'
  }
];

export const initialHostelAssignmentLogs: HostelAssignmentLogItem[] = [
  {
    id: 'hlog-1',
    staffId: 'STF-05',
    empId: 'EMP005',
    employeeName: 'Ravi Kumar',
    designation: 'Hostel Warden',
    hostelName: 'Boys Hostel',
    block: 'Block A',
    floor: 'Floor 1',
    fromDate: '2026-04-01',
    status: 'Active',
    roleType: 'Warden'
  },
  {
    id: 'hlog-2',
    staffId: 'STF-05',
    empId: 'EMP005',
    employeeName: 'Ravi Kumar',
    designation: 'Hostel Warden',
    hostelName: 'Boys Hostel',
    block: 'Block B',
    floor: 'Floor 2',
    fromDate: '2025-04-01',
    toDate: '2026-03-31',
    status: 'Completed',
    roleType: 'Warden'
  }
];

export const WardenMasterView: React.FC = () => {
  const { staff, hostelMasters, updateHostelMaster, updateStaff } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  // Assignment Modal & Log State
  const [assignments, setAssignments] = useState<HostelAssignment[]>(initialHostelAssignments);
  const [assignmentLogs, setAssignmentLogs] = useState<HostelAssignmentLogItem[]>(initialHostelAssignmentLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<HostelAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<HostelAssignment | null>(null);

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Block A');
  const [selectedFloor, setSelectedFloor] = useState('Floor 1');
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Non-teaching staff list for dropdown selector (Warden staff)
  const nonTeachingStaffList = staff.filter(s =>
    (s.employeeCategory || (s.role === 'Teacher' ? 'Teacher' : 'Staff')) === 'Staff' ||
    s.designation.toLowerCase().includes('warden')
  );

  const availableStaff = nonTeachingStaffList.length > 0 ? nonTeachingStaffList : staff;

  // Dynamically synchronize live staff details (Name, Mobile, Email, Photo) from Master Database
  const synchronizedAssignments = assignments.map(a => {
    const sObj = staff.find(s => s.id === a.staffId || s.empId === a.empId || `${s.firstName} ${s.lastName}` === a.employeeName);
    return {
      ...a,
      employeeName: sObj ? `${sObj.firstName} ${sObj.lastName}` : a.employeeName,
      mobileNumber: sObj ? sObj.phone : a.mobileNumber,
      email: sObj ? sObj.email : a.email,
      designation: sObj ? sObj.designation : a.designation,
      avatar: sObj ? sObj.avatar : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };
  });

  const filteredAssignments = synchronizedAssignments.filter(a => {
    const matchesSearch =
      a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.block.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHostel = filterHostel === 'All' || a.hostelName === filterHostel;
    return matchesSearch && matchesHostel;
  });

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    const defaultStf = availableStaff[0];
    setSelectedStaffId(defaultStf?.id || '');
    const defaultHostel = hostelMasters[0];
    setSelectedHostelId(defaultHostel?.id || '');
    setSelectedBlock('Block A');
    setSelectedFloor('Floor 1');
    setAssignmentDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: HostelAssignment) => {
    setEditingAssignment(a);
    setSelectedStaffId(a.staffId);
    const h = hostelMasters.find(x => x.hostelName === a.hostelName) || hostelMasters[0];
    setSelectedHostelId(h?.id || '');
    setSelectedBlock(a.block);
    setSelectedFloor(a.floor);
    setAssignmentDate(a.assignmentDate);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = staff.find(s => s.id === selectedStaffId);
    const targetHostel = hostelMasters.find(h => h.id === selectedHostelId);

    if (!targetStaff || !targetHostel) {
      addToast('warning', 'Selection Required', 'Please select a staff member and a hostel.');
      return;
    }

    const newAssignment: HostelAssignment = {
      id: editingAssignment ? editingAssignment.id : 'hw-' + Date.now(),
      staffId: targetStaff.id,
      empId: targetStaff.empId,
      employeeName: `${targetStaff.firstName} ${targetStaff.lastName}`,
      designation: targetStaff.designation || 'Hostel Warden',
      mobileNumber: targetStaff.phone,
      email: targetStaff.email,
      hostelId: targetHostel.id,
      hostelName: targetHostel.hostelName,
      block: selectedBlock,
      floor: selectedFloor,
      assignmentDate,
      status: 'Active',
      roleType: 'Warden'
    };

    if (editingAssignment) {
      setAssignments(prev => prev.map(a => a.id === editingAssignment.id ? newAssignment : a));
    } else {
      setAssignments(prev => [newAssignment, ...prev]);
    }

    // Append to Assignment History Log
    const newLog: HostelAssignmentLogItem = {
      id: 'hlog-' + Date.now(),
      staffId: targetStaff.id,
      empId: targetStaff.empId,
      employeeName: `${targetStaff.firstName} ${targetStaff.lastName}`,
      designation: targetStaff.designation,
      hostelName: targetHostel.hostelName,
      block: selectedBlock,
      floor: selectedFloor,
      fromDate: assignmentDate,
      status: 'Active',
      roleType: 'Warden'
    };

    setAssignmentLogs(prev => [newLog, ...prev]);

    // TWO-WAY SYNCHRONIZATION: Update Staff Member's Profile in Staff & HR Master Database!
    updateStaff(targetStaff.id, {
      hostelAssignment: {
        hostelId: targetHostel.id,
        hostelName: targetHostel.hostelName,
        block: selectedBlock,
        floor: selectedFloor,
        assignmentDate,
        status: 'Active',
        roleType: 'Warden'
      }
    });

    // Synchronize Hostel Master warden contacts for backward compatibility
    updateHostelMaster(targetHostel.id, {
      wardenName: `${targetStaff.firstName} ${targetStaff.lastName}`,
      wardenMobile: targetStaff.phone,
      wardenEmail: targetStaff.email
    });

    addToast('success', 'Hostel Warden Assigned', `Assigned ${targetStaff.firstName} to ${targetHostel.hostelName} (${selectedBlock})`);
    setIsModalOpen(false);
  };

  const handleRevoke = () => {
    if (deletingAssignment) {
      setAssignments(prev => prev.filter(a => a.id !== deletingAssignment.id));
      
      updateStaff(deletingAssignment.staffId, {
        hostelAssignment: undefined
      });

      addToast('info', 'Warden Assignment Revoked', `Revoked assignment for ${deletingAssignment.employeeName}`);
      setDeletingAssignment(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-500" /> Unified Hostel Warden Allocation
          </h2>
          <p className="text-xs text-slate-500">Single Source of Truth: Assign non-teaching staff to hostels, blocks, and floors without record duplication</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Warden
          </button>
          <ExportButton data={synchronizedAssignments} filename="hostel_warden_assignments" />
        </div>
      </div>

      {/* Sub-Tabs: Active Assignments vs Assignment History Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'current'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Warden Assignments ({filteredAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Assignment History Log ({assignmentLogs.length})
        </button>
      </div>

      {/* Search & Filter Bar */}
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
            {hostelMasters.map(h => <option key={h.id} value={h.hostelName}>{h.hostelName}</option>)}
          </select>
        </div>
      </div>

      {/* TAB 1: ACTIVE ASSIGNMENTS */}
      {activeTab === 'current' && (
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Warden Name</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Mobile & Email (Staff HR Live)</th>
                  <th className="py-3.5 px-4">Assigned Hostel</th>
                  <th className="py-3.5 px-4">Block & Floor</th>
                  <th className="py-3.5 px-4">Assignment Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">No warden assignments found. Click "Assign Warden" to assign.</td>
                  </tr>
                ) : (
                  filteredAssignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{a.empId}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img src={a.avatar} alt={a.employeeName} className="w-7 h-7 rounded-full object-cover border" />
                          <span className="font-bold text-slate-900 dark:text-white">{a.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {a.designation} <Badge variant="info" size="sm">Hostel Warden</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-sky-600">{a.mobileNumber}</p>
                        <p className="text-[10px] text-slate-400">{a.email}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{a.hostelName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.block} • {a.floor}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{a.assignmentDate}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenEdit(a)} className="p-1.5 rounded hover:bg-slate-100 text-sky-600" title="Edit Assignment"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeletingAssignment(a)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600" title="Revoke Assignment"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* TAB 2: ASSIGNMENT HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Warden</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Hostel</th>
                  <th className="py-3.5 px-4">Block</th>
                  <th className="py-3.5 px-4">Floor</th>
                  <th className="py-3.5 px-4">From Date</th>
                  <th className="py-3.5 px-4">To Date</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {assignmentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.employeeName} <span className="font-mono text-slate-400 font-normal">({log.empId})</span></td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{log.designation}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{log.hostelName}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{log.block}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{log.floor}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{log.fromDate}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{log.toDate || 'Current'}</td>
                    <td className="py-3 px-4 text-right"><Badge variant={log.status === 'Active' ? 'success' : 'neutral'} size="sm">{log.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL (SELECTS STAFF MASTER) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAssignment ? 'Edit Hostel Warden Assignment' : 'Assign Hostel Warden'}
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
                  {availableStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.empId} • {s.designation})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Personal info (Name, Phone, Email) auto-loads from Staff & HR database</p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel *</label>
                <select
                  value={selectedHostelId}
                  onChange={e => setSelectedHostelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-indigo-600"
                >
                  {hostelMasters.map(h => (
                    <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Assign Block *</label>
                  <select value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                    <option value="Block D">Block D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Assign Floor *</label>
                  <select value={selectedFloor} onChange={e => setSelectedFloor(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Floor 3">Floor 3</option>
                    <option value="Floor 4">Floor 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assignment Effective Date</label>
                <input
                  type="date"
                  value={assignmentDate?.split('T')[0] || ''}
                  onChange={e => setAssignmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Assign Responsibility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM REVOKE MODAL */}
      <ConfirmModal
        isOpen={!!deletingAssignment}
        onCancel={() => setDeletingAssignment(null)}
        onConfirm={handleRevoke}
        title="Revoke Hostel Warden Assignment"
        message={`Revoke hostel warden assignment for ${deletingAssignment?.employeeName} from ${deletingAssignment?.hostelName}?`}
      />
    </div>
  );
};
