import React, { useState } from 'react';
import { Layers, Plus, Search, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { VehicleAssignment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const VehicleAssignmentView: React.FC = () => {
  const {
    vehicleAssignments, vehicleMasters, routeMasters, driverMasters,
    assignVehicleRouteDriver, removeVehicleAssignment
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<VehicleAssignment | null>(null);

  const [vehicleId, setVehicleId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const filteredAssignments = vehicleAssignments.filter(a =>
    a.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
    a.routeName.toLowerCase().includes(query.toLowerCase()) ||
    a.driverName.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setVehicleId('');
    setRouteId('');
    setDriverId('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const veh = vehicleMasters.find(v => v.id === vehicleId);
    const rt = routeMasters.find(r => r.id === routeId);
    const drv = driverMasters.find(d => d.id === driverId);

    if (!veh || !rt || !drv) {
      addToast('warning', 'Incomplete Form', 'Select vehicle, route, and driver.');
      return;
    }

    // Rules:
    // 1. One vehicle can have only one active route assignment
    const existingVehicleAssign = vehicleAssignments.find(a => a.vehicleId === vehicleId && a.status === 'Active');
    // 2. One driver can have only one active vehicle assignment
    const existingDriverAssign = vehicleAssignments.find(a => a.driverId === driverId && a.status === 'Active');

    if (existingVehicleAssign) {
      addToast('info', 'Vehicle Reassigned', `${veh.vehicleNumber} was reassigned to ${rt.routeName}`);
    }

    if (existingDriverAssign) {
      addToast('info', 'Driver Reassigned', `${drv.driverName} was reassigned to ${veh.vehicleNumber}`);
    }

    assignVehicleRouteDriver({
      vehicleId: veh.id,
      vehicleNumber: veh.vehicleNumber,
      routeId: rt.id,
      routeName: rt.routeName,
      driverId: drv.id,
      driverName: drv.driverName,
      effectiveFrom,
      status: 'Active'
    });

    addToast('success', 'Assignment Created', `Assigned ${veh.vehicleNumber} to ${rt.routeName}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Tripartite Vehicle Assignment
          </h2>
          <p className="text-xs text-slate-500">Assign Vehicle → Route → Driver enforcing 1-to-1 operational constraints</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Assignment
          </button>
          <ExportButton data={vehicleAssignments} filename="vehicle_assignments" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by vehicle, route, or driver..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Assigned Vehicle</th>
                <th className="py-3.5 px-4">Target Transit Route</th>
                <th className="py-3.5 px-4">Designated Driver</th>
                <th className="py-3.5 px-4">Effective From</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredAssignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.vehicleNumber}</td>
                  <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{a.routeName}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-semibold">{a.driverName}</td>
                  <td className="py-3 px-4 text-slate-500">{a.effectiveFrom}</td>
                  <td className="py-3 px-4"><Badge variant={a.status === 'Active' ? 'success' : 'neutral'}>{a.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setDeletingAssignment(a)} className="p-1 rounded hover:bg-rose-50 text-rose-600 ml-auto flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Vehicle → Route → Driver</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Fleet Vehicle *</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {vehicleMasters.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.registrationNumber} • {v.capacity} Seats)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Transit Route *</label>
                <select value={routeId} onChange={e => setRouteId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {routeMasters.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Driver *</label>
                <select value={driverId} onChange={e => setDriverId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {driverMasters.map(d => (
                    <option key={d.id} value={d.id}>{d.driverName} ({d.mobileNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Effective Date</label>
                <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Assign Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingAssignment}
        onCancel={() => setDeletingAssignment(null)}
        onConfirm={() => {
          if (deletingAssignment) {
            removeVehicleAssignment(deletingAssignment.id);
            addToast('info', 'Assignment Removed');
            setDeletingAssignment(null);
          }
        }}
        title="Remove Vehicle Assignment"
        message={`Remove assignment of ${deletingAssignment?.vehicleNumber} from ${deletingAssignment?.routeName}?`}
      />
    </div>
  );
};
