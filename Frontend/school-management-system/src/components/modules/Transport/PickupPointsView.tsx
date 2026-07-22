import React, { useState } from 'react';
import { MapPin, Plus, Search, Edit, Trash2, Clock } from 'lucide-react';
import { PickupPoint } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const PickupPointsView: React.FC = () => {
  const { pickupPoints, routeMasters, addPickupPoint, updatePickupPoint, deletePickupPoint } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PickupPoint | null>(null);

  const [form, setForm] = useState<Partial<PickupPoint>>({
    routeId: routeMasters[0]?.id || '',
    routeName: routeMasters[0]?.routeName || '',
    pickupName: 'Kukatpally Housing Board',
    sequenceNumber: 1,
    arrivalTime: '07:20 AM',
    distanceFromSchoolKm: 12.0,
    status: 'Active'
  });

  const filteredPoints = pickupPoints.filter(p => {
    const matchesQuery = p.pickupName.toLowerCase().includes(query.toLowerCase()) || p.routeName.toLowerCase().includes(query.toLowerCase());
    const matchesRoute = selectedRouteFilter === 'All' || p.routeId === selectedRouteFilter;
    return matchesQuery && matchesRoute;
  }).sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const handleOpenAdd = () => {
    setEditingPoint(null);
    const defaultRoute = routeMasters[0];
    setForm({
      routeId: defaultRoute?.id || '',
      routeName: defaultRoute?.routeName || '',
      pickupName: '',
      sequenceNumber: (pickupPoints.length + 1),
      arrivalTime: '07:30 AM',
      distanceFromSchoolKm: 10,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PickupPoint) => {
    setEditingPoint(p);
    setForm(p);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupName || !form.routeId) return;

    const r = routeMasters.find(rt => rt.id === form.routeId);
    const routeName = r ? r.routeName : form.routeName || '';

    const payload = {
      ...form,
      routeName
    } as Omit<PickupPoint, 'id'>;

    if (editingPoint) {
      updatePickupPoint(editingPoint.id, payload);
      addToast('success', 'Pickup Point Updated', `Updated ${form.pickupName}`);
    } else {
      addPickupPoint(payload);
      addToast('success', 'Pickup Point Created', `Added ${form.pickupName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-500" /> Operational Pickup Point Master
          </h2>
          <p className="text-xs text-slate-500">Manage route waypoints & arrival times in travel sequence (Pricing managed under Finance ERP)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Pickup Point
          </button>
          <ExportButton data={pickupPoints} filename="pickup_points" />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search pickup point name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={selectedRouteFilter}
          onChange={e => setSelectedRouteFilter(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
        >
          <option value="All">All Transit Routes</option>
          {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Seq #</th>
                <th className="py-3.5 px-4">Pickup Point Name</th>
                <th className="py-3.5 px-4">Assigned Route</th>
                <th className="py-3.5 px-4">Arrival Time</th>
                <th className="py-3.5 px-4">Distance (KM)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredPoints.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[11px] flex items-center justify-center">
                      {p.sequenceNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.pickupName}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.routeName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" /> {p.arrivalTime}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.distanceFromSchoolKm} KM</td>
                  <td className="py-3 px-4"><Badge variant={p.status === 'Active' ? 'success' : 'neutral'}>{p.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(p)} className="p-1 rounded hover:bg-slate-100 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingPoint(p)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPoint ? 'Edit Pickup Point' : 'Create Pickup Point'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Route *</label>
                <select
                  value={form.routeId}
                  onChange={e => {
                    const r = routeMasters.find(rt => rt.id === e.target.value);
                    setForm({ ...form, routeId: e.target.value, routeName: r?.routeName || '' });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Pickup Point Name *</label>
                  <input type="text" required value={form.pickupName} onChange={e => setForm({ ...form, pickupName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sequence Number *</label>
                  <input type="number" required value={form.sequenceNumber} onChange={e => setForm({ ...form, sequenceNumber: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Arrival Time</label><input type="text" value={form.arrivalTime} onChange={e => setForm({ ...form, arrivalTime: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">Distance (KM)</label><input type="number" step="0.1" value={form.distanceFromSchoolKm} onChange={e => setForm({ ...form, distanceFromSchoolKm: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Operational Stop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingPoint}
        onCancel={() => setDeletingPoint(null)}
        onConfirm={() => {
          if (deletingPoint) {
            deletePickupPoint(deletingPoint.id);
            addToast('info', 'Pickup Point Deleted');
            setDeletingPoint(null);
          }
        }}
        title="Delete Pickup Point"
        message={`Are you sure you want to delete ${deletingPoint?.pickupName}?`}
      />
    </div>
  );
};
