import React, { useState } from 'react';
import { Route as RouteIcon, Plus, Search, Edit, Trash2, X, MapPin, Clock, ChevronRight } from 'lucide-react';
import { RouteMaster } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export interface RouteStop {
  id: string;
  routeId: string;
  stopName: string;
  stopOrder: number;
  pickupTime: string;
  dropTime: string;
  distanceKm?: number;
}

const initialRouteStops: RouteStop[] = [
  { id: 'stop-1', routeId: 'rm-01', stopName: 'School Main Gate', stopOrder: 1, pickupTime: '07:00 AM', dropTime: '04:45 PM', distanceKm: 0 },
  { id: 'stop-2', routeId: 'rm-01', stopName: 'Central Bus Stand', stopOrder: 2, pickupTime: '07:15 AM', dropTime: '04:30 PM', distanceKm: 3.5 },
  { id: 'stop-3', routeId: 'rm-01', stopName: 'Temple Square', stopOrder: 3, pickupTime: '07:30 AM', dropTime: '04:15 PM', distanceKm: 7.2 },
  { id: 'stop-4', routeId: 'rm-01', stopName: 'Lakshmi Nagar Circle', stopOrder: 4, pickupTime: '07:45 AM', dropTime: '04:00 PM', distanceKm: 12.0 },
  { id: 'stop-5', routeId: 'rm-02', stopName: 'School Campus', stopOrder: 1, pickupTime: '07:00 AM', dropTime: '04:30 PM', distanceKm: 0 },
  { id: 'stop-6', routeId: 'rm-02', stopName: 'Tech Park Gate 3', stopOrder: 2, pickupTime: '07:20 AM', dropTime: '04:10 PM', distanceKm: 5.0 },
  { id: 'stop-7', routeId: 'rm-02', stopName: 'Greenwood Apartments', stopOrder: 3, pickupTime: '07:40 AM', dropTime: '03:50 PM', distanceKm: 9.8 }
];

type RouteSequenceItem = {
  id: string;
  sequenceNumber: number;
  label: string;
};

export const RouteMasterView: React.FC = () => {
  const { routeMasters, pickupPoints, vehicleAssignments, addRouteMaster, updateRouteMaster, deleteRouteMaster } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState(() => sessionStorage.getItem('tm_route_filter') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteMaster | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteMaster | null>(null);

  const handleRouteFilterChange = (val: string) => {
    setSelectedRouteFilter(val);
    sessionStorage.setItem('tm_route_filter', val);
  };

  const [form, setForm] = useState<Partial<RouteMaster>>({
    routeCode: '',
    routeName: '',
    routeStart: '',
    routeEnd: '',
    totalDistanceKm: undefined,
    estimatedTimeMinutes: undefined,
    minDistanceKm: undefined,
    minBaseFare: undefined,
    ratePerKm: undefined,
    description: '',
    status: 'Active'
  });

  const filteredRoutes = routeMasters.filter(r => {
    const matchesQuery = r.routeName.toLowerCase().includes(query.toLowerCase()) ||
                         r.routeCode.toLowerCase().includes(query.toLowerCase());
    const matchesRoute = selectedRouteFilter === 'ALL' || r.id === selectedRouteFilter;
    return matchesQuery && matchesRoute;
  });

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setForm({
      routeCode: '',
      routeName: '',
      routeStart: '',
      routeEnd: '',
      totalDistanceKm: undefined,
      estimatedTimeMinutes: undefined,
      minDistanceKm: undefined,
      minBaseFare: undefined,
      ratePerKm: undefined,
      description: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: RouteMaster) => {
    setEditingRoute(r);
    setForm({
      ...r,
      minDistanceKm: r.minDistanceKm ?? 5,
      minBaseFare: r.minBaseFare ?? 1000,
      ratePerKm: r.ratePerKm ?? 100,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.routeCode || !form.routeName) return;

    const isDuplicate = routeMasters.some(r => r.routeCode.toLowerCase() === form.routeCode?.toLowerCase() && r.id !== editingRoute?.id);
    if (isDuplicate) {
      addToast('warning', 'Duplicate Code', 'Route Code must be unique.');
      return;
    }

    const payload = {
      ...form,
      totalDistanceKm: Number(form.totalDistanceKm) || 0,
      estimatedTimeMinutes: Number(form.estimatedTimeMinutes) || 0,
      minDistanceKm: Number(form.minDistanceKm) || 5,
      minBaseFare: Number(form.minBaseFare) || 1000,
      ratePerKm: Number(form.ratePerKm) || 100,
    };

    if (editingRoute) {
      updateRouteMaster(editingRoute.id, payload);
      addToast('success', 'Route Updated', `Updated ${form.routeName}`);
    } else {
      addRouteMaster(payload as Omit<RouteMaster, 'id'>);
      addToast('success', 'Route Created', `Added ${form.routeName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-sky-500" /> Route Management
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Route
          </button>
          <ExportButton 
            data={filteredRoutes} 
            filename={selectedRouteFilter && selectedRouteFilter !== 'ALL' 
              ? `routes_${routeMasters.find(r => r.id === selectedRouteFilter)?.routeCode || 'filtered'}` 
              : 'route_masters'} 
          />
        </div>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by route code or name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Route:</label>
          <select
            value={selectedRouteFilter}
            onChange={e => handleRouteFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Route --</option>
            <option value="ALL">All Routes</option>
            {routeMasters.map(r => (
              <option key={r.id} value={r.id}>
                {r.routeName} ({r.routeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRouteFilter === '' ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <RouteIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Please Select a Route</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a route from the dropdown above or click below to view all routes.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleRouteFilterChange('ALL')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Routes
            </button>
          </div>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">No routes found matching your filter or search query.</p>
          <button
            onClick={() => { handleRouteFilterChange('ALL'); setQuery(''); }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map(r => {
            const routePickupPoints = pickupPoints
              .filter(p => p.routeId === r.id)
              .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
            const activeAssignment = vehicleAssignments.find(va => va.routeId === r.id && va.status === 'Active')
              || vehicleAssignments.find(va => va.routeId === r.id);
            const assignedBus = activeAssignment?.vehicleNumber || 'Unassigned';
            const assignedDriver = activeAssignment?.driverName || 'Unassigned';
            const previewStops: RouteSequenceItem[] = routePickupPoints.length > 0
              ? routePickupPoints.map(p => ({ id: p.id, sequenceNumber: p.sequenceNumber, label: p.pickupName }))
              : initialRouteStops
                .filter(s => s.routeId.toLowerCase() === r.id.toLowerCase())
                .sort((a, b) => a.stopOrder - b.stopOrder)
                .map(s => ({ id: s.id, sequenceNumber: s.stopOrder, label: s.stopName }));

            return (
              <div key={r.id} className="glass-card p-5 rounded-3xl space-y-3 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div>
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        {r.routeCode}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{r.routeName}</h4>
                    </div>
                    <Badge variant={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between"><span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-sky-500" /> Start:</span> <span className="font-semibold text-slate-900 dark:text-white">{r.routeStart}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-500" /> Destination:</span> <span className="font-semibold text-slate-900 dark:text-white">{r.routeEnd}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400">Total Distance:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{r.totalDistanceKm} KM</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Est. Duration:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.estimatedTimeMinutes} Mins</span></div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60">
                      <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">Rate Structure:</span>
                      <span className="text-[11px] font-mono font-black text-sky-800 dark:text-sky-200">
                        ₹{r.minBaseFare || 1000} (0-{r.minDistanceKm || 5} km) + ₹{r.ratePerKm || 100}/km
                      </span>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-slate-400">Total Pickup Points:</span> <span className="font-bold text-sky-600 dark:text-sky-400">{routePickupPoints.length}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400">Assigned Bus:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{assignedBus}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-400">Assigned Driver:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{assignedDriver}</span></div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pickup Point Sequence</span>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] font-medium space-y-1">
                      {previewStops.length > 0 ? previewStops.map((st, idx, arr) => (
                        <span key={st.id} className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold mr-1">
                          <span className="w-4 h-4 rounded-full bg-sky-600 text-white font-mono text-[9px] flex items-center justify-center shrink-0">{st.sequenceNumber}</span>
                          {st.label}
                          {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 inline shrink-0" />}
                        </span>
                      )) : (
                        <span className="text-slate-400">Add pickup points in the Pickup Points tab.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">Pickup points are maintained in the Pickup Points tab.</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeletingRoute(r)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRoute ? 'Edit Route' : 'Create Route'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Route Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. R-NORTH-101"
                    value={form.routeCode || ''}
                    onChange={e => setForm({ ...form, routeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={form.status || 'Active'} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter route name..."
                  value={form.routeName || ''}
                  onChange={e => setForm({ ...form, routeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Route Start</label>
                  <input
                    type="text"
                    placeholder="Enter route start location..."
                    value={form.routeStart || ''}
                    onChange={e => setForm({ ...form, routeStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Route End</label>
                  <input
                    type="text"
                    placeholder="Enter route end location..."
                    value={form.routeEnd || ''}
                    onChange={e => setForm({ ...form, routeEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Distance (KM)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 18.5"
                    value={form.totalDistanceKm !== undefined && form.totalDistanceKm !== null ? form.totalDistanceKm : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setForm({ ...form, totalDistanceKm: val as any });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Est Time (Minutes)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 45"
                    value={form.estimatedTimeMinutes !== undefined && form.estimatedTimeMinutes !== null ? form.estimatedTimeMinutes : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setForm({ ...form, estimatedTimeMinutes: val as any });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Distance-based Pricing Configuration */}
              <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/60 space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-sky-700 dark:text-sky-300">Distance & Slab Rate Configuration</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Min Range (KM)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 5"
                      value={form.minDistanceKm !== undefined && form.minDistanceKm !== null ? form.minDistanceKm : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setForm({ ...form, minDistanceKm: val as any });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Base Min Fare (₹)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1000"
                      value={form.minBaseFare !== undefined && form.minBaseFare !== null ? form.minBaseFare : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) {
                          setForm({ ...form, minBaseFare: val as any });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Rate / Addl KM (₹)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 100"
                      value={form.ratePerKm !== undefined && form.ratePerKm !== null ? form.ratePerKm : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) {
                          setForm({ ...form, ratePerKm: val as any });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-mono font-bold text-sky-600 dark:text-sky-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Enter route description..."
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 cursor-pointer">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingRoute}
        onCancel={() => setDeletingRoute(null)}
        onConfirm={() => {
          if (deletingRoute) {
            deleteRouteMaster(deletingRoute.id);
            addToast('info', 'Route Deleted');
            setDeletingRoute(null);
          }
        }}
        title="Delete Route Master"
        message={`Are you sure you want to delete ${deletingRoute?.routeName}?`}
      />
    </div>
  );
};
