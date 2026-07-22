import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Phone, ShieldCheck, Award } from 'lucide-react';
import { DriverMaster } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const DriverMasterView: React.FC = () => {
  const { driverMasters, vehicleAssignments, addDriverMaster, updateDriverMaster, deleteDriverMaster } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMaster | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<DriverMaster | null>(null);

  const [form, setForm] = useState<Partial<DriverMaster>>({
    driverName: 'Dwight Schrute',
    mobileNumber: '+1 555-333-333',
    licenseNumber: 'DL-NY-2022-77112',
    licenseExpiryDate: '2029-10-31',
    address: 'Beet Farm Road, Scranton, NY',
    emergencyContact: '+1 555-333-888',
    experienceYears: 10,
    status: 'Active'
  });

  const filteredDrivers = driverMasters.filter(d =>
    d.driverName.toLowerCase().includes(query.toLowerCase()) ||
    d.mobileNumber.toLowerCase().includes(query.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setForm({
      driverName: '',
      mobileNumber: '+1 555-333-444',
      licenseNumber: `DL-NY-2023-${Math.floor(10000 + Math.random() * 90000)}`,
      licenseExpiryDate: '2030-01-01',
      address: '',
      emergencyContact: '+1 555-333-999',
      experienceYears: 5,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DriverMaster) => {
    setEditingDriver(d);
    setForm(d);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.driverName || !form.mobileNumber || !form.licenseNumber) return;

    if (editingDriver) {
      updateDriverMaster(editingDriver.id, form);
      addToast('success', 'Driver Details Updated', `Updated ${form.driverName}`);
    } else {
      addDriverMaster(form as Omit<DriverMaster, 'id'>);
      addToast('success', 'Driver Registered', `Added ${form.driverName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" /> Driver Directory Master
          </h2>
          <p className="text-xs text-slate-500">Manage transport driver profiles, commercial licenses, driving experience, and emergency contacts</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
          <ExportButton data={driverMasters} filename="driver_masters" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search driver name, phone, or license..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Driver Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map(d => {
          const activeAssignedVehicle = vehicleAssignments.find(va => va.driverId === d.id && va.status === 'Active');

          return (
            <div key={d.id} className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{d.driverName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-sky-500" /> {d.licenseNumber}</p>
                  </div>
                  <Badge variant={d.status === 'Active' ? 'success' : d.status === 'On Leave' ? 'warning' : 'neutral'}>{d.status}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Mobile Number:</span><span className="font-bold text-sky-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {d.mobileNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Assigned Vehicle:</span><span className="font-bold text-emerald-600">{activeAssignedVehicle ? activeAssignedVehicle.vehicleNumber : 'Unassigned'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">License Expiry:</span><span className="font-semibold text-slate-700 dark:text-slate-300">{d.licenseExpiryDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Experience:</span><span className="font-bold text-slate-900 dark:text-white">{d.experienceYears} Years</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Emergency Phone:</span><span className="font-mono text-slate-500">{d.emergencyContact}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                <span className="truncate max-w-[160px]">{d.address}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingDriver(d)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
                {editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Driver Full Name *</label>
                <input type="text" required value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Mobile Number *</label><input type="text" required value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">Emergency Contact</label><input type="text" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Commercial License No *</label><input type="text" required value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">License Expiry Date</label><input type="date" value={form.licenseExpiryDate} onChange={e => setForm({ ...form, licenseExpiryDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Experience (Years)</label><input type="number" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600" /></div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Residential Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingDriver}
        onCancel={() => setDeletingDriver(null)}
        onConfirm={() => {
          if (deletingDriver) {
            deleteDriverMaster(deletingDriver.id);
            addToast('info', 'Driver Deleted');
            setDeletingDriver(null);
          }
        }}
        title="Delete Driver Profile"
        message={`Are you sure you want to delete ${deletingDriver?.driverName}?`}
      />
    </div>
  );
};
