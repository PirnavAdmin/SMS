import React, { useState } from 'react';
import { Bus as BusIcon, Plus, Edit, Trash2, Phone, X, Navigation } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Bus } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const TransportView: React.FC = () => {
  const { buses, addBus, updateBus, deleteBus, transportRoutes } = useData();
  const { addToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [deletingBus, setDeletingBus] = useState<Bus | null>(null);

  const [formData, setFormData] = useState<Partial<Bus>>({
    busNumber: 'BUS-103',
    registrationNumber: 'NY-99-AB-1003',
    routeName: 'Route C - West Suburbs',
    driverName: 'Dwight Schrute',
    driverPhone: '+1 555-333-333',
    capacity: 40,
    type: 'AC',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({
      busNumber: `BUS-${Math.floor(100 + Math.random() * 900)}`,
      registrationNumber: `NY-99-AB-${Math.floor(1000 + Math.random() * 9000)}`,
      routeName: 'Route C - West Suburbs',
      driverName: 'Dwight Schrute',
      driverPhone: '+1 555-333-333',
      capacity: 40,
      type: 'AC',
      status: 'Active'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: Bus) => {
    setEditingBus(b);
    setFormData(b);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busNumber || !formData.driverName) return;

    if (editingBus) {
      updateBus(editingBus.id, formData);
      addToast('success', 'Bus Details Updated', `Updated ${formData.busNumber}`);
    } else {
      addBus(formData as Omit<Bus, 'id'>);
      addToast('success', 'Bus Added', `Added ${formData.busNumber}`);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BusIcon className="w-6 h-6 text-sky-500" /> Transport & School Bus Management
          </h2>
          <p className="text-xs text-slate-500">Manage school fleet, AC/Non-AC vehicle capacity, driver contacts, and routes</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Bus
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buses List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active School Fleet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buses.map(b => (
              <div key={b.id} className="glass-card p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950">{b.type} Bus</span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{b.busNumber}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(b)} className="p-1 rounded hover:bg-slate-100 text-brand-600" title="Edit Bus"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeletingBus(b)} className="p-1 rounded hover:bg-rose-50 text-rose-600" title="Delete Bus"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Reg No:</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{b.registrationNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Assigned Route:</span><span className="font-bold text-slate-900 dark:text-white">{b.routeName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Driver:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{b.driverName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Driver Phone:</span><span className="font-bold text-brand-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {b.driverPhone}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Capacity:</span><span className="font-bold text-emerald-600">{b.capacity} Seats</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live GPS Telematics Box */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-500 animate-spin" /> Live GPS Bus Tracker
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs text-slate-500">Real-time telematics simulator feed</p>

            <div className="h-56 w-full rounded-2xl bg-slate-900 relative overflow-hidden flex items-center justify-center text-white p-4">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="relative text-center space-y-2">
                <BusIcon className="w-8 h-8 text-sky-400 mx-auto animate-bounce" />
                <p className="text-xs font-bold">Bus 101 - Speed: 42 km/h</p>
                <p className="text-[10px] text-sky-300">Approaching Stop #4: Willow Brook Way</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Bus Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingBus ? 'Edit Vehicle Details' : 'Add School Bus'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Bus Number *</label>
                  <input type="text" required value={formData.busNumber} onChange={e => setFormData({ ...formData, busNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Registration No</label>
                  <input type="text" value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Route Name</label>
                <select value={formData.routeName} onChange={e => setFormData({ ...formData, routeName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  {transportRoutes.map(r => <option key={r.id} value={r.routeName}>{r.routeName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Driver Name *</label>
                  <input type="text" required value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Driver Phone</label>
                  <input type="text" value={formData.driverPhone} onChange={e => setFormData({ ...formData, driverPhone: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Vehicle Capacity</label>
                  <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Vehicle Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="AC">AC Bus</option>
                    <option value="Non-AC">Non-AC Bus</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">
                  {editingBus ? 'Save Changes' : 'Add Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with exact text */}
      <ConfirmModal
        isOpen={!!deletingBus}
        title="Delete Bus Vehicle"
        message="Are you sure you want to delete this bus? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deletingBus) {
            deleteBus(deletingBus.id);
            addToast('success', 'Bus Removed');
            setDeletingBus(null);
          }
        }}
        onCancel={() => setDeletingBus(null)}
      />
    </div>
  );
};
