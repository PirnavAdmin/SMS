import React, { useState } from 'react';
import { Layers, Plus, Edit, Trash2, Search, UserCheck, CheckCircle2, XCircle, History, Building2, Phone, Mail, Calendar, User } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Staff } from '../../../types';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { initialHostelBlocks } from './HostelBlocksView';

export interface HostelFloor {
  id: string;
  hostelId: string;
  hostelName: string;
  blockId: string;
  blockName: string;
  floorName: string;
  floorNumber: number;
  description?: string;
  status: 'Active' | 'Inactive';
  wardenId?: string;
  wardenName?: string;
  wardenMobile?: string;
  wardenEmail?: string;
  wardenJoiningDate?: string;
}

export interface WardenHistoryItem {
  id: string;
  floorId: string;
  floorName: string;
  blockName: string;
  wardenName: string;
  employeeId: string;
  mobile: string;
  assignedDate: string;
  unassignedDate?: string;
  status: 'Active' | 'Historical';
}

export const initialHostelFloors: HostelFloor[] = [
  { id: 'flr-1', hostelId: '1', hostelName: 'St. Xavier Boys Hostel', blockId: 'blk-1', blockName: 'Block A - Vivekananda Block', floorName: 'Ground Floor', floorNumber: 0, description: 'Ground floor residence', status: 'Active', wardenId: 'EMP-201', wardenName: 'Marcus Vance', wardenMobile: '+1 555-333-101', wardenEmail: 'marcus@stxaviers.edu', wardenJoiningDate: '2025-06-01' },
  { id: 'flr-2', hostelId: '1', hostelName: 'St. Xavier Boys Hostel', blockId: 'blk-1', blockName: 'Block A - Vivekananda Block', floorName: '1st Floor', floorNumber: 1, description: 'First floor residence', status: 'Active', wardenId: 'EMP-202', wardenName: 'David Miller', wardenMobile: '+1 555-333-102', wardenEmail: 'david@stxaviers.edu', wardenJoiningDate: '2025-07-10' },
  { id: 'flr-3', hostelId: '1', hostelName: 'St. Xavier Boys Hostel', blockId: 'blk-2', blockName: 'Block B - Kalam Block', floorName: '1st Floor', floorNumber: 1, description: 'Junior wing first floor', status: 'Active', wardenId: 'EMP-203', wardenName: 'Lucas Grey', wardenMobile: '+1 555-333-103', wardenEmail: 'lucas@stxaviers.edu', wardenJoiningDate: '2025-09-01' }
];

export const initialWardenLogs: WardenHistoryItem[] = [
  { id: 'wh-1', floorId: 'flr-1', floorName: 'Ground Floor', blockName: 'Block A', wardenName: 'Marcus Vance', employeeId: 'EMP-201', mobile: '+1 555-333-101', assignedDate: '2025-06-01', status: 'Active' },
  { id: 'wh-2', floorId: 'flr-2', floorName: '1st Floor', blockName: 'Block A', wardenName: 'David Miller', employeeId: 'EMP-202', mobile: '+1 555-333-102', assignedDate: '2025-07-10', status: 'Active' }
];

export const HostelFloorsView: React.FC = () => {
  const { hostelMasters, staff } = useData();
  const { addToast } = useToast();

  const [floors, setFloors] = useState<HostelFloor[]>(initialHostelFloors);
  const [wardenLogs, setWardenLogs] = useState<WardenHistoryItem[]>(initialWardenLogs);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'floors' | 'history'>('floors');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<HostelFloor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<HostelFloor | null>(null);

  const [formHostelId, setFormHostelId] = useState('');
  const [formBlockId, setFormBlockId] = useState('');
  const [formFloorName, setFormFloorName] = useState('');
  const [formFloorNumber, setFormFloorNumber] = useState(1);
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formWardenId, setFormWardenId] = useState('');

  const filteredFloors = floors.filter(f =>
    f.floorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.blockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.wardenName && f.wardenName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const availableBlocks = initialHostelBlocks.filter(b => b.hostelId === formHostelId);

  const handleOpenAdd = () => {
    const defaultHostel = hostelMasters[0];
    const defaultBlock = initialHostelBlocks.find(b => b.hostelId === defaultHostel?.id) || initialHostelBlocks[0];

    setEditingFloor(null);
    setFormHostelId(defaultHostel?.id || '1');
    setFormBlockId(defaultBlock?.id || 'blk-1');
    setFormFloorName('');
    setFormFloorNumber(1);
    setFormDesc('');
    setFormStatus('Active');
    setFormWardenId(staff[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: HostelFloor) => {
    setEditingFloor(f);
    setFormHostelId(f.hostelId);
    setFormBlockId(f.blockId);
    setFormFloorName(f.floorName);
    setFormFloorNumber(f.floorNumber);
    setFormDesc(f.description || '');
    setFormStatus(f.status);
    setFormWardenId(f.wardenId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hostelObj = hostelMasters.find(h => h.id === formHostelId) || hostelMasters[0];
    const blockObj = initialHostelBlocks.find(b => b.id === formBlockId) || initialHostelBlocks[0];
    const staffObj = staff.find((s: Staff) => s.id === formWardenId);

    const wardenName = staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : 'Marcus Vance';
    const wardenEmpId = staffObj ? (staffObj.empId || staffObj.id) : 'EMP-201';
    const wardenMobile = staffObj ? (staffObj.phone || '+1 555-333-101') : '+1 555-333-101';
    const wardenEmail = staffObj ? (staffObj.email || 'warden@stxaviers.edu') : 'warden@stxaviers.edu';

    // Business Rule Check: 1 active warden per floor
    const existingActiveWarden = floors.find(f => f.wardenId === formWardenId && f.id !== editingFloor?.id && f.status === 'Active');
    if (existingActiveWarden) {
      addToast('warning', 'Warden Rule', `${wardenName} is already assigned to ${existingActiveWarden.floorName} in ${existingActiveWarden.blockName}. Enforcing 1 floor per active warden.`);
    }

    if (editingFloor) {
      const updatedFloor: HostelFloor = {
        ...editingFloor,
        hostelId: hostelObj ? hostelObj.id : '1',
        hostelName: hostelObj ? hostelObj.hostelName : 'St. Xavier Boys Hostel',
        blockId: blockObj ? blockObj.id : 'blk-1',
        blockName: blockObj ? blockObj.blockName : 'Block A',
        floorName: formFloorName,
        floorNumber: Number(formFloorNumber),
        description: formDesc,
        status: formStatus,
        wardenId: formWardenId,
        wardenName,
        wardenMobile,
        wardenEmail,
        wardenJoiningDate: new Date().toISOString().split('T')[0]
      };

      setFloors(prev => prev.map(f => f.id === editingFloor.id ? updatedFloor : f));
      addToast('success', 'Floor Updated', `${formFloorName} updated successfully`);
    } else {
      const newFloor: HostelFloor = {
        id: 'flr-' + Date.now(),
        hostelId: hostelObj ? hostelObj.id : '1',
        hostelName: hostelObj ? hostelObj.hostelName : 'St. Xavier Boys Hostel',
        blockId: blockObj ? blockObj.id : 'blk-1',
        blockName: blockObj ? blockObj.blockName : 'Block A',
        floorName: formFloorName,
        floorNumber: Number(formFloorNumber),
        description: formDesc,
        status: formStatus,
        wardenId: formWardenId,
        wardenName,
        wardenMobile,
        wardenEmail,
        wardenJoiningDate: new Date().toISOString().split('T')[0]
      };

      setFloors(prev => [newFloor, ...prev]);

      // Add to Warden History Log
      const historyItem: WardenHistoryItem = {
        id: 'wh-' + Date.now(),
        floorId: newFloor.id,
        floorName: newFloor.floorName,
        blockName: blockObj ? blockObj.blockName : 'Block A',
        wardenName,
        employeeId: wardenEmpId,
        mobile: wardenMobile,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      setWardenLogs(prev => [historyItem, ...prev]);

      addToast('success', 'Hostel Floor Configured', `${formFloorName} with Floor Warden ${wardenName} created.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingFloor) {
      setFloors(prev => prev.filter(f => f.id !== deletingFloor.id));
      addToast('info', 'Floor Deleted');
      setDeletingFloor(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-500" /> Floor Management & Warden Allocation
          </h2>
          <p className="text-xs text-slate-500">Configure hostel floors per block and assign 1 active Floor Warden (from Staff & HR) per floor</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Hostel Floor
          </button>
          <ExportButton data={floors} filename="hostel_floors" />
        </div>
      </div>

      {/* Sub Tab Toggle: Active Floors vs Warden Assignment History */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('floors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'floors'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Configured Hostel Floors ({filteredFloors.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Warden Assignment History Log ({wardenLogs.length})
        </button>
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search floor name, block, warden..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: ACTIVE FLOORS GRID */}
      {activeTab === 'floors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFloors.map(f => (
            <div key={f.id} className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 relative group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-sky-600 dark:text-sky-400">Floor #{f.floorNumber}</span>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">{f.floorName}</h3>
                </div>
                <Badge variant={f.status === 'Active' ? 'success' : 'neutral'}>{f.status}</Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-slate-500">Hostel: <strong className="text-slate-900 dark:text-white font-bold">{f.hostelName}</strong></p>
                <p className="text-slate-500">Block: <strong className="text-indigo-600 font-bold">{f.blockName}</strong></p>
                <p className="text-slate-400 text-[11px]">{f.description || 'Hostel floor section with assigned Floor Warden'}</p>
              </div>

              {/* Assigned Floor Warden Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-500" /> Assigned Floor Warden
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-xs">{f.wardenName || 'Unassigned'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{f.wardenEmail}</p>
                  </div>
                  <a href={`tel:${f.wardenMobile}`} className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {f.wardenMobile}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button onClick={() => handleOpenEdit(f)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeletingFloor(f)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: WARDEN ASSIGNMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Hostel Floor</th>
                  <th className="py-3.5 px-4">Hostel Block</th>
                  <th className="py-3.5 px-4">Warden Name</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Mobile Number</th>
                  <th className="py-3.5 px-4">Assigned Period</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {wardenLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.floorName}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{log.blockName}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{log.wardenName}</td>
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

      {/* CREATE / EDIT FLOOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingFloor ? 'Edit Hostel Floor' : 'Add Hostel Floor & Assign Warden'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Hostel *</label>
                <select
                  value={formHostelId}
                  onChange={e => {
                    setFormHostelId(e.target.value);
                    const b = initialHostelBlocks.find(blk => blk.hostelId === e.target.value);
                    setFormBlockId(b?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Hostel Block *</label>
                <select value={formBlockId} onChange={e => setFormBlockId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-indigo-600">
                  {availableBlocks.map(b => <option key={b.id} value={b.id}>{b.blockName} ({b.blockCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Floor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Floor - Wing A"
                    value={formFloorName}
                    onChange={e => setFormFloorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Floor Number *</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    required
                    value={formFloorNumber}
                    onChange={e => setFormFloorNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Floor Warden (from Staff & HR) *</label>
                <select value={formWardenId} onChange={e => setFormWardenId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600">
                  {staff.map((st: Staff) => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.designation || 'Staff'} • {st.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Floor description..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">{editingFloor ? 'Update Floor' : 'Save Floor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingFloor}
        onCancel={() => setDeletingFloor(null)}
        onConfirm={handleDelete}
        title="Delete Hostel Floor"
        message={`Delete floor ${deletingFloor?.floorName}?`}
      />
    </div>
  );
};
