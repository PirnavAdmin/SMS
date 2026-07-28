import React, { useState } from 'react';
import { Layers, Plus, Edit, Trash2, Search, UserCheck, CheckCircle2, XCircle, History, Building2, Phone, Mail, Calendar, Shield } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Staff } from '../../../types';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export interface HostelBlock {
  id: string;
  hostelId: string;
  hostelName: string;
  blockName: string;
  blockCode: string;
  numberOfFloors: number;
  description?: string;
  status: 'Active' | 'Inactive';
  supervisorId?: string;
  supervisorName?: string;
  supervisorMobile?: string;
  supervisorEmail?: string;
  supervisorJoiningDate?: string;
}

export interface SupervisorHistoryItem {
  id: string;
  blockId: string;
  blockName: string;
  supervisorName: string;
  employeeId: string;
  mobile: string;
  assignedDate: string;
  unassignedDate?: string;
  status: 'Active' | 'Historical';
}

export const initialHostelBlocks: HostelBlock[] = [
  { id: 'blk-1', hostelId: '1', hostelName: 'St. Xavier Boys Hostel', blockName: 'Block A - Vivekananda Block', blockCode: 'BLK-A', numberOfFloors: 4, description: 'Senior Boys Wing', status: 'Active', supervisorId: 'EMP-101', supervisorName: 'Robert Langdon', supervisorMobile: '+1 555-444-001', supervisorEmail: 'robert@stxaviers.edu', supervisorJoiningDate: '2025-06-01' },
  { id: 'blk-2', hostelId: '1', hostelName: 'St. Xavier Boys Hostel', blockName: 'Block B - Kalam Block', blockCode: 'BLK-B', numberOfFloors: 3, description: 'Junior Boys Wing', status: 'Active', supervisorId: 'EMP-102', supervisorName: 'Arthur Pendelton', supervisorMobile: '+1 555-444-002', supervisorEmail: 'arthur@stxaviers.edu', supervisorJoiningDate: '2025-08-15' },
  { id: 'blk-3', hostelId: '2', hostelName: 'Mother Teresa Girls Hostel', blockName: 'Block Alpha - Main Block', blockCode: 'BLK-ALPHA', numberOfFloors: 5, description: 'Girls Main Residence', status: 'Active', supervisorId: 'EMP-103', supervisorName: 'Sarah Connor', supervisorMobile: '+1 555-444-003', supervisorEmail: 'sarah@stxaviers.edu', supervisorJoiningDate: '2026-01-10' }
];

export const initialSupervisorLogs: SupervisorHistoryItem[] = [
  { id: 'sh-1', blockId: 'blk-1', blockName: 'Block A - Vivekananda Block', supervisorName: 'Robert Langdon', employeeId: 'EMP-101', mobile: '+1 555-444-001', assignedDate: '2025-06-01', status: 'Active' },
  { id: 'sh-2', blockId: 'blk-2', blockName: 'Block B - Kalam Block', supervisorName: 'Arthur Pendelton', employeeId: 'EMP-102', mobile: '+1 555-444-002', assignedDate: '2025-08-15', status: 'Active' },
  { id: 'sh-3', blockId: 'blk-1', blockName: 'Block A - Vivekananda Block', supervisorName: 'James Potter', employeeId: 'EMP-099', mobile: '+1 555-444-099', assignedDate: '2024-04-01', unassignedDate: '2025-05-31', status: 'Historical' }
];

export const HostelBlocksView: React.FC = () => {
  const { hostelMasters, staff } = useData();
  const { addToast } = useToast();

  const [blocks, setBlocks] = useState<HostelBlock[]>(initialHostelBlocks);
  const [supervisorLogs, setSupervisorLogs] = useState<SupervisorHistoryItem[]>(initialSupervisorLogs);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'blocks' | 'history'>('blocks');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<HostelBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<HostelBlock | null>(null);

  const [formHostelId, setFormHostelId] = useState('');
  const [formBlockName, setFormBlockName] = useState('');
  const [formBlockCode, setFormBlockCode] = useState('');
  const [formFloors, setFormFloors] = useState(4);
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formSupervisorId, setFormSupervisorId] = useState('');

  const filteredBlocks = blocks.filter(b =>
    b.blockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.blockCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.supervisorName && b.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingBlock(null);
    setFormHostelId(hostelMasters[0]?.id || '1');
    setFormBlockName('');
    setFormBlockCode('BLK-' + Math.floor(100 + Math.random() * 900));
    setFormFloors(4);
    setFormDesc('');
    setFormStatus('Active');
    setFormSupervisorId(staff[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: HostelBlock) => {
    setEditingBlock(b);
    setFormHostelId(b.hostelId);
    setFormBlockName(b.blockName);
    setFormBlockCode(b.blockCode);
    setFormFloors(b.numberOfFloors);
    setFormDesc(b.description || '');
    setFormStatus(b.status);
    setFormSupervisorId(b.supervisorId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hostelObj = hostelMasters.find(h => h.id === formHostelId) || hostelMasters[0];
    const staffObj = staff.find((s: Staff) => s.id === formSupervisorId);

    const supName = staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : 'Robert Langdon';
    const supEmpId = staffObj ? (staffObj.empId || staffObj.id) : 'EMP-101';
    const supMobile = staffObj ? (staffObj.phone || '+1 555-444-001') : '+1 555-444-001';
    const supEmail = staffObj ? (staffObj.email || 'supervisor@stxaviers.edu') : 'supervisor@stxaviers.edu';

    // Business Rule Check: 1 active supervisor per block
    const existingActiveSup = blocks.find(b => b.supervisorId === formSupervisorId && b.id !== editingBlock?.id && b.status === 'Active');
    if (existingActiveSup) {
      addToast('warning', 'Supervisor Rule', `${supName} is already assigned to ${existingActiveSup.blockName}. Enforcing 1 block per active supervisor.`);
    }

    if (editingBlock) {
      const updatedBlock: HostelBlock = {
        ...editingBlock,
        hostelId: hostelObj ? hostelObj.id : '1',
        hostelName: hostelObj ? hostelObj.hostelName : 'St. Xavier Boys Hostel',
        blockName: formBlockName,
        blockCode: formBlockCode,
        numberOfFloors: Number(formFloors),
        description: formDesc,
        status: formStatus,
        supervisorId: formSupervisorId,
        supervisorName: supName,
        supervisorMobile: supMobile,
        supervisorEmail: supEmail,
        supervisorJoiningDate: new Date().toISOString().split('T')[0]
      };

      setBlocks(prev => prev.map(b => b.id === editingBlock.id ? updatedBlock : b));
      addToast('success', 'Block Updated', `${formBlockName} updated successfully`);
    } else {
      const newBlock: HostelBlock = {
        id: 'blk-' + Date.now(),
        hostelId: hostelObj ? hostelObj.id : '1',
        hostelName: hostelObj ? hostelObj.hostelName : 'St. Xavier Boys Hostel',
        blockName: formBlockName,
        blockCode: formBlockCode,
        numberOfFloors: Number(formFloors),
        description: formDesc,
        status: formStatus,
        supervisorId: formSupervisorId,
        supervisorName: supName,
        supervisorMobile: supMobile,
        supervisorEmail: supEmail,
        supervisorJoiningDate: new Date().toISOString().split('T')[0]
      };

      setBlocks(prev => [newBlock, ...prev]);

      // Add to Supervisor History Log
      const historyItem: SupervisorHistoryItem = {
        id: 'sh-' + Date.now(),
        blockId: newBlock.id,
        blockName: newBlock.blockName,
        supervisorName: supName,
        employeeId: supEmpId,
        mobile: supMobile,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      setSupervisorLogs(prev => [historyItem, ...prev]);

      addToast('success', 'Hostel Block Created', `${formBlockName} with Supervisor ${supName} added.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingBlock) {
      setBlocks(prev => prev.filter(b => b.id !== deletingBlock.id));
      addToast('info', 'Block Deleted');
      setDeletingBlock(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Block Management & Supervisor Allocation
          </h2>
          <p className="text-xs text-slate-500">Configure hostel blocks, floor counts, and assign 1 active Block Supervisor (from Staff & HR) per block</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Hostel Block
          </button>
          <ExportButton data={blocks} filename="hostel_blocks" />
        </div>
      </div>

      {/* Sub Tab Toggle: Active Blocks vs Supervisor Assignment History */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'blocks'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Configured Hostel Blocks ({filteredBlocks.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Supervisor Assignment History Log ({supervisorLogs.length})
        </button>
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search block name, code, supervisor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: ACTIVE BLOCKS GRID */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlocks.map(b => (
            <div key={b.id} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400">{b.blockCode}</span>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">{b.blockName}</h3>
                </div>
                <Badge variant={b.status === 'Active' ? 'success' : 'neutral'}>{b.status}</Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-slate-500">Hostel: <strong className="text-slate-900 dark:text-white font-bold">{b.hostelName}</strong></p>
                <p className="text-slate-500">Floors: <strong className="text-sky-600 font-mono font-bold">{b.numberOfFloors} Floors Configured</strong></p>
                <p className="text-slate-400 text-[11px]">{b.description || 'Hostel residence block with assigned Block Supervisor'}</p>
              </div>

              {/* Assigned Block Supervisor Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" /> Assigned Block Supervisor
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-xs">{b.supervisorName || 'Unassigned'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{b.supervisorEmail}</p>
                  </div>
                  <a href={`tel:${b.supervisorMobile}`} className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-[11px] hover:bg-indigo-100 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {b.supervisorMobile}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button onClick={() => handleOpenEdit(b)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeletingBlock(b)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: SUPERVISOR ASSIGNMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Hostel Block</th>
                  <th className="py-3.5 px-4">Supervisor Name</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Assigned Period</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {supervisorLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.blockName}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{log.supervisorName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.employeeId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{log.mobile}</td>
                    <td className="py-3 px-4 text-slate-500">{log.assignedDate} {log.unassignedDate ? ` to ${log.unassignedDate}` : ' (Current Active)'}</td>
                    <td className="py-3 px-4 text-right"><Badge variant={log.status === 'Active' ? 'success' : 'neutral'}>{log.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT BLOCK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingBlock ? 'Edit Hostel Block' : 'Add Hostel Block & Assign Supervisor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Hostel *</label>
                <select value={formHostelId} onChange={e => setFormHostelId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Block Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block A - Vivekananda Block"
                  value={formBlockName}
                  onChange={e => setFormBlockName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Block Code *</label>
                  <input
                    type="text"
                    required
                    value={formBlockCode}
                    onChange={e => setFormBlockCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Number of Floors *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formFloors}
                    onChange={e => setFormFloors(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Block Supervisor (from Staff & HR) *</label>
                <select value={formSupervisorId} onChange={e => setFormSupervisorId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-indigo-600">
                  {staff.map((st: Staff) => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.designation || 'Staff'} • {st.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Block description..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">{editingBlock ? 'Update Block' : 'Save Block'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingBlock}
        onCancel={() => setDeletingBlock(null)}
        onConfirm={handleDelete}
        title="Delete Hostel Block"
        message={`Delete block ${deletingBlock?.blockName}?`}
      />
    </div>
  );
};
