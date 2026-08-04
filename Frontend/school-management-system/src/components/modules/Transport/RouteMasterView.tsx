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

export const initialRouteStops: RouteStop[] = [
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteMaster | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteMaster | null>(null);

  const [form, setForm] = useState<Partial<RouteMaster>>({
    routeCode: 'R-NORTH-103',
    routeName: 'Route C - West Suburbs Express',
    routeStart: 'West Suburbs Stop 1',
    routeEnd: 'St. Xavier Main Gate',
    totalDistanceKm: 15.0,
    estimatedTimeMinutes: 35,
    description: 'Serving West Suburbs housing colonies',
    status: 'Active'
  });

  const filteredRoutes = routeMasters.filter(r =>
    r.routeName.toLowerCase().includes(query.toLowerCase()) ||
    r.routeCode.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setForm({
      routeCode: `R-CODE-${Math.floor(100 + Math.random() * 900)}`,
      routeName: '',
      routeStart: '',
      routeEnd: 'St. Xavier Main Gate',
      totalDistanceKm: 10,
      estimatedTimeMinutes: 30,
      description: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: RouteMaster) => {
    setEditingRoute(r);
    setForm(r);
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

    if (editingRoute) {
      updateRouteMaster(editingRoute.id, form);
      addToast('success', 'Route Updated', `Updated ${form.routeName}`);
    } else {
      addRouteMaster(form as Omit<RouteMaster, 'id'>);
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
          <ExportButton data={routeMasters} filename="route_masters" />
        </div>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by route code or name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRoute ? 'Edit Route Master' : 'Create Route Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Route Code (Unique) *</label>
                  <input type="text" required value={form.routeCode} onChange={e => setForm({ ...form, routeCode: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Route Name *</label>
                <input type="text" required value={form.routeName} onChange={e => setForm({ ...form, routeName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Route Start</label><input type="text" value={form.routeStart} onChange={e => setForm({ ...form, routeStart: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-1">Route End</label><input type="text" value={form.routeEnd} onChange={e => setForm({ ...form, routeEnd: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Distance (KM)</label><input type="number" step="0.1" value={form.totalDistanceKm} onChange={e => setForm({ ...form, totalDistanceKm: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-1">Est Time (Minutes)</label><input type="number" value={form.estimatedTimeMinutes} onChange={e => setForm({ ...form, estimatedTimeMinutes: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save Route</button>
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
