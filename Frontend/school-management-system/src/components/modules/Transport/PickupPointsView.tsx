import React, { useState } from 'react';
import { MapPin, Plus, Search, Edit, Trash2, Clock, X } from 'lucide-react';
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
  const [selectedRouteFilter, setSelectedRouteFilter] = useState(() => sessionStorage.getItem('tm_pickup_route_filter') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PickupPoint | null>(null);

  const handleRouteFilterChange = (val: string) => {
    setSelectedRouteFilter(val);
    sessionStorage.setItem('tm_pickup_route_filter', val);
  };

  const calculateFeeForDistance = (routeId?: string, distanceKm: number = 0) => {
    const r = routeMasters.find(rt => rt.id === routeId);
    const minKm = r?.minDistanceKm ?? 5;
    const baseFare = r?.minBaseFare ?? 1000;
    const rateKm = r?.ratePerKm ?? 100;
    const additionalKm = Math.max(0, distanceKm - minKm);
    return Math.round(baseFare + (additionalKm * rateKm));
  };

  const [form, setForm] = useState<Partial<PickupPoint>>({
    routeId: '',
    routeName: '',
    pickupName: '',
    sequenceNumber: undefined,
    arrivalTime: '',
    morningPickupTime: '',
    eveningDropTime: '',
    distanceFromSchoolKm: undefined,
    monthlyFee: undefined,
    status: 'Active'
  });

  const filteredPoints = pickupPoints.filter(p => {
    const matchesQuery = p.pickupName.toLowerCase().includes(query.toLowerCase()) || p.routeName.toLowerCase().includes(query.toLowerCase());
    const matchesRoute = selectedRouteFilter === 'All' || p.routeId === selectedRouteFilter;
    return matchesQuery && matchesRoute;
  }).sort((a, b) => {
    const routeCompare = a.routeName.localeCompare(b.routeName);
    return routeCompare !== 0 ? routeCompare : a.sequenceNumber - b.sequenceNumber;
  });

  const handleOpenAdd = () => {
    setEditingPoint(null);
    const defaultRoute = (selectedRouteFilter && selectedRouteFilter !== 'All')
      ? routeMasters.find(r => r.id === selectedRouteFilter)
      : null;
    setForm({
      routeId: defaultRoute?.id || '',
      routeName: defaultRoute?.routeName || '',
      pickupName: '',
      sequenceNumber: undefined,
      arrivalTime: '',
      morningPickupTime: '',
      eveningDropTime: '',
      distanceFromSchoolKm: undefined,
      monthlyFee: undefined,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PickupPoint) => {
    setEditingPoint(p);
    setForm({
      ...p,
      morningPickupTime: p.morningPickupTime || p.arrivalTime || '',
      eveningDropTime: p.eveningDropTime || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.pickupName || !form.routeId) return;

    const r = routeMasters.find(rt => rt.id === form.routeId);
    const routeName = r ? r.routeName : form.routeName || '';
    const seqNum = Number(form.sequenceNumber) || 1;
    const distKm = Number(form.distanceFromSchoolKm) || 0;
    const feeAmt = Number(form.monthlyFee) || calculateFeeForDistance(form.routeId, distKm);

    const routeSequence = pickupPoints.filter(p => p.routeId === form.routeId && p.id !== editingPoint?.id);
    const isDuplicateSequence = routeSequence.some(p => p.sequenceNumber === seqNum);

    if (isDuplicateSequence) {
      addToast('warning', 'Duplicate Sequence', `Sequence #${seqNum} is already used on ${routeName}.`);
      return;
    }

    const payload = {
      ...form,
      routeName,
      sequenceNumber: seqNum,
      distanceFromSchoolKm: distKm,
      arrivalTime: form.morningPickupTime || form.arrivalTime || '07:30 AM',
      monthlyFee: feeAmt
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
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-500" /> Pickup Points
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Pickup Point
          </button>
          <ExportButton 
            data={filteredPoints} 
            filename={selectedRouteFilter !== 'All' 
              ? `pickup_points_${routeMasters.find(r => r.id === selectedRouteFilter)?.routeCode || 'filtered'}` 
              : 'pickup_points'} 
          />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by pickup point name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Pickup Point:</label>
          <select
            value={selectedRouteFilter}
            onChange={e => handleRouteFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Route --</option>
            <option value="All">All Pickup Points</option>
            {routeMasters.map(r => (
              <option key={r.id} value={r.id}>
                {r.routeName} ({r.routeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRouteFilter === '' ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Please Select a Route</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a route from the dropdown above or click below to view all pickup points.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleRouteFilterChange('All')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Pickup Points
            </button>
          </div>
        </div>
      ) : filteredPoints.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">No pickup points found matching your filter or search query.</p>
          <button
            onClick={() => { handleRouteFilterChange('All'); setQuery(''); }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Table */
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 text-center">Seq #</th>
                  <th className="py-3.5 px-4 text-center">Route</th>
                  <th className="py-3.5 px-4 text-center">Pickup Point Name</th>
                  <th className="py-3.5 px-4 text-center">Distance (KM)</th>
                  <th className="py-3.5 px-4 text-center">Morning Pickup</th>
                  <th className="py-3.5 px-4 text-center">Evening Drop</th>
                  <th className="py-3.5 px-4 text-center">Monthly Fee</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
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
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.routeName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.pickupName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{p.distanceFromSchoolKm} KM</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {p.morningPickupTime || p.arrivalTime || '07:30 AM'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">
                      {p.eveningDropTime || '04:15 PM'}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{p.monthlyFee || calculateFeeForDistance(p.routeId, p.distanceFromSchoolKm)}/mo
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'Active' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </td>
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPoint ? 'Edit Pickup Point' : 'Create Pickup Point'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Route *</label>
                <select
                  required
                  value={form.routeId || ''}
                  onChange={e => {
                    const r = routeMasters.find(rt => rt.id === e.target.value);
                    const autoFee = (form.distanceFromSchoolKm !== undefined && form.distanceFromSchoolKm !== null && (form.distanceFromSchoolKm as any) !== '')
                      ? calculateFeeForDistance(e.target.value, Number(form.distanceFromSchoolKm))
                      : undefined;
                    setForm({
                      ...form,
                      routeId: e.target.value,
                      routeName: r?.routeName || '',
                      monthlyFee: autoFee
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Route --</option>
                  {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Pickup Point Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter pickup point name..."
                    value={form.pickupName || ''}
                    onChange={e => setForm({ ...form, pickupName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sequence Number *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 1"
                    value={form.sequenceNumber !== undefined && form.sequenceNumber !== null ? form.sequenceNumber : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setForm({ ...form, sequenceNumber: val as any });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Distance from School (KM) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 10.0"
                    value={form.distanceFromSchoolKm !== undefined && form.distanceFromSchoolKm !== null ? form.distanceFromSchoolKm : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        const dist = val === '' ? 0 : Number(val);
                        const autoFee = val === '' ? undefined : calculateFeeForDistance(form.routeId, dist);
                        setForm({ ...form, distanceFromSchoolKm: val as any, monthlyFee: autoFee });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Monthly Fare (Auto-Calculated) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 1500"
                    value={form.monthlyFee !== undefined && form.monthlyFee !== null ? form.monthlyFee : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setForm({ ...form, monthlyFee: val as any });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-extrabold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Morning Pickup Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:30 AM"
                    value={form.morningPickupTime || ''}
                    onChange={e => setForm({ ...form, morningPickupTime: e.target.value, arrivalTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Evening Drop Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 04:00 PM"
                    value={form.eveningDropTime || ''}
                    onChange={e => setForm({ ...form, eveningDropTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save</button>
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
