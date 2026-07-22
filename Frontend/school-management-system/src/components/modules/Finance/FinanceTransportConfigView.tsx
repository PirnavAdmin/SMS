import React, { useState } from 'react';
import { Route as RouteIcon, Plus, Search, Edit, Trash2, Bus, User, MapPin, DollarSign, Calendar } from 'lucide-react';
import { FinanceTransportConfig } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const FinanceTransportConfigView: React.FC = () => {
  const {
    financeTransportConfigs, routeMasters, pickupPoints, vehicleAssignments,
    addFinanceTransportConfig, updateFinanceTransportConfig, deleteFinanceTransportConfig
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FinanceTransportConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FinanceTransportConfig | null>(null);

  const defaultRoute = routeMasters[0];
  const defaultAssignment = vehicleAssignments.find(va => va.routeId === defaultRoute?.id);
  const defaultStops = pickupPoints.filter(p => p.routeId === defaultRoute?.id);

  const [form, setForm] = useState<Partial<FinanceTransportConfig>>({
    routeId: defaultRoute?.id || '',
    routeName: defaultRoute?.routeName || '',
    vehicleId: defaultAssignment?.vehicleId || 'VM-01',
    vehicleNumber: defaultAssignment?.vehicleNumber || 'BUS-101',
    driverId: defaultAssignment?.driverId || 'DRV-01',
    driverName: defaultAssignment?.driverName || 'Driver',
    pickupPointId: defaultStops[0]?.id || '',
    pickupName: defaultStops[0]?.pickupName || '',
    feePlan: 'Quarterly',
    feeAmount: 5000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const filteredConfigs = financeTransportConfigs.filter(c => {
    const matchQuery = c.routeName.toLowerCase().includes(query.toLowerCase()) ||
                       c.pickupName.toLowerCase().includes(query.toLowerCase()) ||
                       c.vehicleNumber.toLowerCase().includes(query.toLowerCase());
    const matchRoute = filterRoute === 'All' || c.routeId === filterRoute;
    return matchQuery && matchRoute;
  });

  const handleRouteSelect = (routeId: string) => {
    const route = routeMasters.find(r => r.id === routeId);
    const assignment = vehicleAssignments.find(va => va.routeId === routeId);
    const stops = pickupPoints.filter(p => p.routeId === routeId);

    setForm(prev => ({
      ...prev,
      routeId,
      routeName: route?.routeName || '',
      vehicleId: assignment?.vehicleId || '',
      vehicleNumber: assignment?.vehicleNumber || 'Unassigned',
      driverId: assignment?.driverId || '',
      driverName: assignment?.driverName || 'Unassigned',
      pickupPointId: stops[0]?.id || '',
      pickupName: stops[0]?.pickupName || ''
    }));
  };

  const handlePickupSelect = (pickupPointId: string) => {
    const pk = pickupPoints.find(p => p.id === pickupPointId);
    setForm(prev => ({
      ...prev,
      pickupPointId,
      pickupName: pk?.pickupName || ''
    }));
  };

  const handleOpenAdd = () => {
    setEditingConfig(null);
    handleRouteSelect(routeMasters[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: FinanceTransportConfig) => {
    setEditingConfig(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.routeId || !form.pickupPointId || !form.feeAmount) {
      addToast('warning', 'Missing Fields', 'Please select Route, Pickup Point and specify Fee Amount.');
      return;
    }

    const payload = form as Omit<FinanceTransportConfig, 'id'>;

    if (editingConfig) {
      updateFinanceTransportConfig(editingConfig.id, payload);
      addToast('success', 'Transport Fee Config Updated', `Updated pricing for ${form.pickupName}`);
    } else {
      addFinanceTransportConfig(payload);
      addToast('success', 'Transport Fee Config Saved', `Configured ${form.feePlan} fee of INR ${form.feeAmount} for ${form.pickupName}`);
    }
    setIsModalOpen(false);
  };

  const routeStops = pickupPoints.filter(p => p.routeId === form.routeId);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-sky-500" /> Finance ERP Transport Pricing Configuration
          </h2>
          <p className="text-xs text-slate-500">Single Source of Truth for Route & Pickup-Point Fee Slabs (Auto-linked with Transport Operational Masters)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Transport Pricing Config
          </button>
          <ExportButton data={financeTransportConfigs} filename="finance_transport_configurations" />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search pickup point, route, bus..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterRoute}
          onChange={e => setFilterRoute(e.target.value)}
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
                <th className="py-3.5 px-4">Route Name</th>
                <th className="py-3.5 px-4">Assigned Vehicle</th>
                <th className="py-3.5 px-4">Assigned Driver</th>
                <th className="py-3.5 px-4">Pickup Point</th>
                <th className="py-3.5 px-4">Fee Plan</th>
                <th className="py-3.5 px-4">Fee Amount</th>
                <th className="py-3.5 px-4">Effective Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredConfigs.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <RouteIcon className="w-3.5 h-3.5 text-sky-500" /> {c.routeName}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5 text-indigo-500" /> {c.vehicleNumber}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-500" /> {c.driverName}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {c.pickupName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">
                      {c.feePlan}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    INR {c.feeAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{c.effectiveFrom}</td>
                  <td className="py-3 px-4"><Badge variant={c.status === 'Active' ? 'success' : 'neutral'}>{c.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(c)} className="p-1 rounded hover:bg-slate-100 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingConfig(c)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                {editingConfig ? 'Edit Transport Pricing Configuration' : 'Configure Transport Fee Slab'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Route Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Route (Transport Master) *</label>
                <select
                  value={form.routeId}
                  onChange={e => handleRouteSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-slate-900 dark:text-white"
                >
                  {routeMasters.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              {/* Auto-populated Vehicle & Driver */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Vehicle (Read Only)</label>
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Bus className="w-3.5 h-3.5 text-indigo-500" /> {form.vehicleNumber || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Driver (Read Only)</label>
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" /> {form.driverName || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Pickup Point Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Point Stop *</label>
                <select
                  value={form.pickupPointId}
                  onChange={e => handlePickupSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-slate-900 dark:text-white"
                >
                  {routeStops.length > 0 ? (
                    routeStops.map(p => (
                      <option key={p.id} value={p.id}>{p.sequenceNumber}. {p.pickupName} ({p.arrivalTime})</option>
                    ))
                  ) : (
                    <option value="">No pickup points created for this route</option>
                  )}
                </select>
              </div>

              {/* Fee Plan & Fee Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fee Plan *</label>
                  <select
                    value={form.feePlan}
                    onChange={e => setForm({ ...form, feePlan: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fee Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.feeAmount}
                    onChange={e => setForm({ ...form, feeAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Effective Dates & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Effective From</label>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={e => setForm({ ...form, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Effective To</label>
                  <input
                    type="date"
                    value={form.effectiveTo || ''}
                    onChange={e => setForm({ ...form, effectiveTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Pricing Config</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingConfig}
        onCancel={() => setDeletingConfig(null)}
        onConfirm={() => {
          if (deletingConfig) {
            deleteFinanceTransportConfig(deletingConfig.id);
            addToast('info', 'Transport Config Deleted');
            setDeletingConfig(null);
          }
        }}
        title="Delete Transport Pricing Config"
        message={`Are you sure you want to delete transport pricing for ${deletingConfig?.pickupName}?`}
      />
    </div>
  );
};
