import React, { useState } from 'react';
import { Bus, Plus, Search, Edit, Trash2, Shield, AlertTriangle, Cpu } from 'lucide-react';
import { VehicleMaster } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const VehicleMasterView: React.FC = () => {
  const { vehicleMasters, addVehicleMaster, updateVehicleMaster, deleteVehicleMaster, checkVehicleCapacity } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleMaster | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<VehicleMaster | null>(null);

  const [form, setForm] = useState<Partial<VehicleMaster>>({
    vehicleNumber: 'BUS-103',
    registrationNumber: 'NY-99-AB-1003',
    vehicleType: 'Bus',
    capacity: 40,
    isAC: true,
    chassisNumber: 'CH-88219-Z3',
    engineNumber: 'ENG-44102-M',
    insuranceExpiry: '2026-12-31',
    pollutionExpiry: '2026-11-30',
    fitnessExpiry: '2027-03-31',
    gpsDeviceId: 'GPS-DEV-9003',
    status: 'Active'
  });

  const filteredVehicles = vehicleMasters.filter(v =>
    v.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setForm({
      vehicleNumber: `BUS-${Math.floor(100 + Math.random() * 900)}`,
      registrationNumber: `NY-99-AB-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleType: 'Bus',
      capacity: 40,
      isAC: true,
      chassisNumber: `CH-${Math.floor(10000 + Math.random() * 90000)}`,
      engineNumber: `ENG-${Math.floor(10000 + Math.random() * 90000)}`,
      insuranceExpiry: '2026-12-31',
      pollutionExpiry: '2026-11-30',
      fitnessExpiry: '2027-03-31',
      gpsDeviceId: `GPS-DEV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleMaster) => {
    setEditingVehicle(v);
    setForm(v);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleNumber || !form.registrationNumber) return;

    if (editingVehicle) {
      updateVehicleMaster(editingVehicle.id, form);
      addToast('success', 'Vehicle Updated', `Updated ${form.vehicleNumber}`);
    } else {
      addVehicleMaster(form as Omit<VehicleMaster, 'id'>);
      addToast('success', 'Vehicle Registered', `Added ${form.vehicleNumber}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-500" /> Fleet Vehicle Master
          </h2>
          <p className="text-xs text-slate-500">Manage school fleet, AC/Non-AC specs, chassis/engine numbers, and regulatory expiry dates</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
          <ExportButton data={vehicleMasters} filename="vehicle_masters" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vehicle no or reg no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map(v => {
          const cap = checkVehicleCapacity(v.id);
          return (
            <div key={v.id} className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {v.vehicleType} • {v.isAC ? 'AC' : 'Non-AC'}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{v.vehicleNumber}</h4>
                  </div>
                  <Badge variant={v.status === 'Active' ? 'success' : v.status === 'Maintenance' ? 'warning' : 'neutral'}>{v.status}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Reg No:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{v.registrationNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Seat Occupancy:</span><span className="font-bold text-emerald-600">{cap.assignedCount} / {v.capacity} ({cap.availableSeats} Left)</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">GPS Device ID:</span><span className="font-mono text-sky-600 flex items-center gap-1"><Cpu className="w-3 h-3" /> {v.gpsDeviceId}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Insurance Expiry:</span><span className="font-semibold text-slate-700 dark:text-slate-300">{v.insuranceExpiry}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Fitness Expiry:</span><span className="font-semibold text-slate-700 dark:text-slate-300">{v.fitnessExpiry}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Chassis: {v.chassisNumber}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(v)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingVehicle(v)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVehicle ? 'Edit Vehicle Master' : 'Register Vehicle Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Vehicle Number *</label><input type="text" required value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" /></div>
                <div><label className="block font-semibold mb-1">Reg Number *</label><input type="text" required value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div><label className="block font-semibold mb-1">Seating Capacity</label><input type="number" required value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600" /></div>
                <div>
                  <label className="block font-semibold mb-1">AC Specification</label>
                  <select value={form.isAC ? 'AC' : 'Non-AC'} onChange={e => setForm({ ...form, isAC: e.target.value === 'AC' })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="AC">Air Conditioned (AC)</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Chassis Number</label><input type="text" value={form.chassisNumber} onChange={e => setForm({ ...form, chassisNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">Engine Number</label><input type="text" value={form.engineNumber} onChange={e => setForm({ ...form, engineNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="block font-semibold mb-1">Insurance Expiry</label><input type="date" value={form.insuranceExpiry} onChange={e => setForm({ ...form, insuranceExpiry: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-1">Pollution Expiry</label><input type="date" value={form.pollutionExpiry} onChange={e => setForm({ ...form, pollutionExpiry: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-1">Fitness Expiry</label><input type="date" value={form.fitnessExpiry} onChange={e => setForm({ ...form, fitnessExpiry: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">GPS Device ID</label><input type="text" value={form.gpsDeviceId} onChange={e => setForm({ ...form, gpsDeviceId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-sky-600" /></div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingVehicle}
        onCancel={() => setDeletingVehicle(null)}
        onConfirm={() => {
          if (deletingVehicle) {
            deleteVehicleMaster(deletingVehicle.id);
            addToast('info', 'Vehicle Deleted');
            setDeletingVehicle(null);
          }
        }}
        title="Delete Vehicle Master"
        message={`Are you sure you want to delete ${deletingVehicle?.vehicleNumber}?`}
      />
    </div>
  );
};
