import React, { useState } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, ShieldCheck, User } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export interface BusAttendantMaster {
  id: string;
  employeeId: string;
  attendantName: string;
  mobileNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  branch: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  assignedVehicleId?: string;
  assignedVehicleNumber?: string;
}

export const initialBusAttendants: BusAttendantMaster[] = [
  {
    id: 'att-1',
    employeeId: 'ATT-2026-01',
    attendantName: 'Mary Smith',
    mobileNumber: '+1 (555) 019-8274',
    gender: 'Female',
    branch: 'Main Campus',
    status: 'Active',
    assignedVehicleNumber: 'BUS-101'
  },
  {
    id: 'att-2',
    employeeId: 'ATT-2026-02',
    attendantName: 'Sarah Jenkins',
    mobileNumber: '+1 (555) 019-8275',
    gender: 'Female',
    branch: 'Main Campus',
    status: 'Active',
    assignedVehicleNumber: 'BUS-102'
  },
  {
    id: 'att-3',
    employeeId: 'ATT-2026-03',
    attendantName: 'Robert Vance',
    mobileNumber: '+1 (555) 019-8276',
    gender: 'Male',
    branch: 'North Branch',
    status: 'Active',
    assignedVehicleNumber: 'VAN-201'
  }
];

export const BusAttendantMasterView: React.FC = () => {
  const { vehicleAssignments } = useData();
  const { addToast } = useToast();

  const [attendants, setAttendants] = useState<BusAttendantMaster[]>(initialBusAttendants);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<BusAttendantMaster | null>(null);
  const [deletingAttendant, setDeletingAttendant] = useState<BusAttendantMaster | null>(null);

  const [form, setForm] = useState<Partial<BusAttendantMaster>>({
    employeeId: 'ATT-2026-04',
    attendantName: '',
    mobileNumber: '+1 (555) 019-8800',
    gender: 'Female',
    branch: 'Main Campus',
    status: 'Active'
  });

  const filteredAttendants = attendants.filter(a =>
    a.attendantName.toLowerCase().includes(query.toLowerCase()) ||
    a.employeeId.toLowerCase().includes(query.toLowerCase()) ||
    a.mobileNumber.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingAttendant(null);
    setForm({
      employeeId: `ATT-2026-${Math.floor(10 + Math.random() * 90)}`,
      attendantName: '',
      mobileNumber: '+1 (555) 019-8800',
      gender: 'Female',
      branch: 'Main Campus',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: BusAttendantMaster) => {
    setEditingAttendant(a);
    setForm(a);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.attendantName || !form.employeeId || !form.mobileNumber) return;

    if (editingAttendant) {
      setAttendants(prev => prev.map(a => a.id === editingAttendant.id ? { ...a, ...form } as BusAttendantMaster : a));
      addToast('success', 'Bus Attendant Updated', `Updated details for ${form.attendantName}`);
    } else {
      const newAttendant: BusAttendantMaster = {
        id: 'att-' + Date.now(),
        employeeId: form.employeeId || '',
        attendantName: form.attendantName || '',
        mobileNumber: form.mobileNumber || '',
        gender: (form.gender || 'Female') as any,
        branch: form.branch || 'Main Campus',
        status: (form.status || 'Active') as any
      };
      setAttendants(prev => [newAttendant, ...prev]);
      addToast('success', 'Bus Attendant Registered', `Added ${form.attendantName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-500" /> Bus Attendant Management
          </h2>
          <p className="text-xs text-slate-500">Manage bus attendant staff, contact information, branch allocations, and vehicle assignments</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Bus Attendant
          </button>
          <ExportButton data={attendants} filename="bus_attendants_directory" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search attendant name, ID, or phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Attendant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttendants.map(a => {
          return (
            <div key={a.id} className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {a.employeeId}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{a.attendantName}</h4>
                  </div>
                  <Badge variant={a.status === 'Active' ? 'success' : a.status === 'On Leave' ? 'warning' : 'neutral'}>{a.status}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Mobile Number:</span><span className="font-bold text-sky-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {a.mobileNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Gender:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{a.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Branch:</span><span className="font-bold text-amber-600 dark:text-amber-400">{a.branch}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Assigned Vehicle:</span><span className="font-mono font-bold text-emerald-600">{a.assignedVehicleNumber || 'BUS-101'}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified ERP Staff</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingAttendant(a)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAttendant ? 'Edit Bus Attendant' : 'Register New Bus Attendant'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee ID *</label>
                  <input type="text" required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Attendant Full Name *</label>
                <input type="text" required value={form.attendantName} onChange={e => setForm({ ...form, attendantName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Mobile Number *</label><input type="text" required value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div>
                  <label className="block font-semibold mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Branch Campus</label>
                <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="Main Campus">Main Campus</option>
                  <option value="North Branch">North Branch</option>
                  <option value="West Campus">West Campus</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Attendant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingAttendant}
        onCancel={() => setDeletingAttendant(null)}
        onConfirm={() => {
          if (deletingAttendant) {
            setAttendants(prev => prev.filter(a => a.id !== deletingAttendant.id));
            addToast('info', 'Bus Attendant Removed');
            setDeletingAttendant(null);
          }
        }}
        title="Remove Bus Attendant"
        message={`Are you sure you want to remove ${deletingAttendant?.attendantName}?`}
      />
    </div>
  );
};
