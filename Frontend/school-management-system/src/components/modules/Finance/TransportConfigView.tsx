import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Route, Plus, Search, Edit, Trash2, Bus } from 'lucide-react';
import { TransportRoute } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const TransportConfigView: React.FC = () => {
  const { erpTransportRoutes, addERPTransportRoute, updateERPTransportRoute, deleteERPTransportRoute } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<TransportRoute | null>(null);

  const [formData, setFormData] = useState<Partial<TransportRoute>>({
    routeName: '',
    routeCode: '',
    vehicleNumber: 'NY-99-AB-1001',
    vehicleName: 'School Bus AC',
    driverName: '',
    driverMobile: '',
    pickupPoint: '',
    dropPoint: 'School Gate',
    distanceKm: 10,
    monthlyFee: 1500,
    quarterlyFee: 4200,
    halfYearlyFee: 8000,
    annualFee: 15000,
    status: 'Active'
  });

  const filteredRoutes = erpTransportRoutes.filter(r =>
    r.routeName.toLowerCase().includes(query.toLowerCase()) || r.routeCode.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      routeName: '',
      routeCode: 'R-' + Math.floor(100 + Math.random() * 900),
      vehicleNumber: 'NY-99-AB-' + Math.floor(1000 + Math.random() * 9000),
      vehicleName: 'Tata Starbus AC 40-Seater',
      driverName: '',
      driverMobile: '',
      pickupPoint: 'City Center Stop',
      dropPoint: 'Academy Gate 1',
      distanceKm: 10,
      monthlyFee: 1500,
      quarterlyFee: 4200,
      halfYearlyFee: 8000,
      annualFee: 15000,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: TransportRoute) => {
    setEditingRoute(r);
    setFormData(r);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.routeName || !formData.routeCode) return;

    if (editingRoute) {
      updateERPTransportRoute(editingRoute.id, formData);
      addToast('success', 'Route Updated', `Updated ${formData.routeName}`);
    } else {
      addERPTransportRoute(formData as Omit<TransportRoute, 'id'>);
      addToast('success', 'Route Configured', `Configured ${formData.routeName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Route className="w-6 h-6 text-sky-500" /> Transport Route Master Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure vehicle routes, drivers, stops, and frequency-based transport fee slabs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Route Master
          </button>
          <ExportButton data={erpTransportRoutes} filename="transport_routes" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search route name or code..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRoutes.map(r => (
          <div key={r.id} className="glass-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {r.routeCode} • {r.distanceKm} km
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{r.routeName}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(r)} className="p-1.5 rounded hover:bg-slate-100 text-sky-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeletingRoute(r)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div>Vehicle: <span className="font-bold text-slate-900 dark:text-white">{r.vehicleName} ({r.vehicleNumber})</span></div>
              <div>Driver: <span className="font-bold text-slate-900 dark:text-white">{r.driverName} ({r.driverMobile})</span></div>
              <div>Stops: <span className="font-semibold">{r.pickupPoint} ➔ {r.dropPoint}</span></div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2 text-[11px] text-center">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800"><p className="text-[10px] text-slate-400">Monthly</p><p className="font-bold text-sky-600">{formatCurrency(r.monthlyFee)}</p></div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800"><p className="text-[10px] text-slate-400">Quarterly</p><p className="font-bold text-sky-600">{formatCurrency(r.quarterlyFee)}</p></div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800"><p className="text-[10px] text-slate-400">Half-Yr</p><p className="font-bold text-sky-600">{formatCurrency(r.halfYearlyFee)}</p></div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800"><p className="text-[10px] text-slate-400">Annual</p><p className="font-bold text-sky-600">{formatCurrency(r.annualFee)}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRoute ? 'Edit Transport Route' : 'Add Transport Route Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Route Name *</label>
                  <input type="text" required value={formData.routeName} onChange={e => setFormData({ ...formData, routeName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Route Code *</label>
                  <input type="text" required value={formData.routeCode} onChange={e => setFormData({ ...formData, routeCode: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Vehicle Name</label>
                  <input type="text" value={formData.vehicleName} onChange={e => setFormData({ ...formData, vehicleName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Vehicle Number</label>
                  <input type="text" value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Driver Name</label>
                  <input type="text" value={formData.driverName} onChange={e => setFormData({ ...formData, driverName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Driver Mobile</label>
                  <input type="text" value={formData.driverMobile} onChange={e => setFormData({ ...formData, driverMobile: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Pickup Stop</label>
                  <input type="text" value={formData.pickupPoint} onChange={e => setFormData({ ...formData, pickupPoint: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Drop Stop</label>
                  <input type="text" value={formData.dropPoint} onChange={e => setFormData({ ...formData, dropPoint: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div><label className="block font-semibold mb-0.5">Monthly Fee (₹)</label><input type="number" value={formData.monthlyFee} onChange={e => setFormData({ ...formData, monthlyFee: Number(e.target.value) })} className="w-full px-2 py-1 rounded border" /></div>
                <div><label className="block font-semibold mb-0.5">Quarterly Fee (₹)</label><input type="number" value={formData.quarterlyFee} onChange={e => setFormData({ ...formData, quarterlyFee: Number(e.target.value) })} className="w-full px-2 py-1 rounded border" /></div>
                <div><label className="block font-semibold mb-0.5">Half Yearly (₹)</label><input type="number" value={formData.halfYearlyFee} onChange={e => setFormData({ ...formData, halfYearlyFee: Number(e.target.value) })} className="w-full px-2 py-1 rounded border" /></div>
                <div><label className="block font-semibold mb-0.5">Annual Fee (₹)</label><input type="number" value={formData.annualFee} onChange={e => setFormData({ ...formData, annualFee: Number(e.target.value) })} className="w-full px-2 py-1 rounded border" /></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingRoute}
        title="Delete Route"
        message={`Are you sure you want to delete ${deletingRoute?.routeName}?`}
        onConfirm={() => {
          if (deletingRoute) {
            deleteERPTransportRoute(deletingRoute.id);
            addToast('success', 'Route Removed');
            setDeletingRoute(null);
          }
        }}
        onCancel={() => setDeletingRoute(null)}
      />
    </div>
  );
};
