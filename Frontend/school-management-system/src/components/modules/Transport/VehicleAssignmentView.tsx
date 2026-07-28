import React, { useState } from 'react';
import { Layers, Plus, Search, Trash2, Edit, X, ArrowRight, UserCheck, Users, Bus, Route, History, Eye, Navigation } from 'lucide-react';
import { VehicleAssignment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { initialBusAttendants } from './BusAttendantMasterView';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';

export interface VehicleAssignmentLogItem {
  id: string;
  vehicleNumber: string;
  driverName: string;
  attendantName: string;
  routeName: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Historical';
}

export const initialAssignmentLogs: VehicleAssignmentLogItem[] = [
  { id: 'log-1', vehicleNumber: 'BUS-101', driverName: 'Dwight Schrute', attendantName: 'Mary Smith', routeName: 'Route A - Downtown Express', effectiveFrom: '2026-04-01', status: 'Active' },
  { id: 'log-2', vehicleNumber: 'BUS-102', driverName: 'Jim Halpert', attendantName: 'Sarah Jenkins', routeName: 'Route B - North Campus Direct', effectiveFrom: '2026-04-01', status: 'Active' },
  { id: 'log-3', vehicleNumber: 'BUS-101', driverName: 'Michael Scott', attendantName: 'Pam Beesly', routeName: 'Route A - Downtown Express', effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'Historical' }
];

export const VehicleAssignmentView: React.FC = () => {
  const {
    vehicleAssignments, vehicleMasters, routeMasters, driverMasters,
    assignVehicleRouteDriver, removeVehicleAssignment, updateVehicleAssignment
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<VehicleAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<VehicleAssignment | null>(null);

  // Trip Details Modal State
  const [selectedTripAssignment, setSelectedTripAssignment] = useState<VehicleAssignment | null>(null);
  const [isTripDetailsOpen, setIsTripDetailsOpen] = useState(false);

  // Bus Attendant and Assignment History State
  const [attendants] = useState(initialBusAttendants);
  const [assignmentLogs, setAssignmentLogs] = useState<VehicleAssignmentLogItem[]>(initialAssignmentLogs);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const [vehicleId, setVehicleId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [attendantId, setAttendantId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const filteredAssignments = vehicleAssignments.filter(a =>
    a.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
    a.routeName.toLowerCase().includes(query.toLowerCase()) ||
    a.driverName.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setVehicleId(vehicleMasters.find(v => v.status === 'Active')?.id || '');
    setRouteId(routeMasters.find(r => r.status === 'Active')?.id || '');
    setDriverId(driverMasters.find(d => d.status === 'Active')?.id || '');
    setAttendantId(attendants.find(a => a.status === 'Active')?.id || '');
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: VehicleAssignment) => {
    setEditingAssignment(a);
    setVehicleId(a.vehicleId);
    setRouteId(a.routeId);
    setDriverId(a.driverId);
    const att = attendants[0];
    setAttendantId(att?.id || '');
    setEffectiveFrom(a.effectiveFrom);
    setIsModalOpen(true);
  };

  const handleOpenTripDetails = (a: VehicleAssignment) => {
    setSelectedTripAssignment(a);
    setIsTripDetailsOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const veh = vehicleMasters.find(v => v.id?.toString() === vehicleId?.toString());
    const rt = routeMasters.find(r => r.id?.toString() === routeId?.toString());
    const drv = driverMasters.find(d => d.id?.toString() === driverId?.toString());
    const att = attendants.find(a => a.id?.toString() === attendantId?.toString());

    if (!veh || !rt || !drv) {
      addToast('warning', 'Incomplete Form', 'Select active vehicle, route, and driver.');
      return;
    }

    // Business Rules Validations:
    if (veh.status === 'Inactive' || veh.status === 'Maintenance') {
      addToast('warning', 'Inactive Vehicle', `Cannot assign ${veh.vehicleNumber} because its status is ${veh.status}.`);
      return;
    }
    if (drv.status !== 'Active') {
      addToast('warning', 'Inactive Driver', `Cannot assign ${drv.driverName} because status is ${drv.status}.`);
      return;
    }
    if (att && att.status !== 'Active') {
      addToast('warning', 'Inactive Bus Attendant', `Cannot assign ${att.attendantName} because status is ${att.status}.`);
      return;
    }

    const attendantName = att ? att.attendantName : 'Mary Smith';

    const newLogItem: VehicleAssignmentLogItem = {
      id: 'log-' + Date.now(),
      vehicleNumber: veh.vehicleNumber,
      driverName: drv.driverName,
      attendantName,
      routeName: rt.routeName,
      effectiveFrom,
      status: 'Active'
    };

    setAssignmentLogs(prev => [newLogItem, ...prev]);

    if (editingAssignment) {
      updateVehicleAssignment(editingAssignment.id, {
        vehicleId: veh.id,
        vehicleNumber: veh.vehicleNumber,
        routeId: rt.id,
        routeName: rt.routeName,
        driverId: drv.id,
        driverName: drv.driverName,
        effectiveFrom,
        status: 'Active'
      });
      addToast('success', 'Assignment Chain Updated', `Updated ${veh.vehicleNumber} → ${drv.driverName} → ${attendantName} → ${rt.routeName}`);
      setIsModalOpen(false);
      return;
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

    addToast('success', 'Quad-Partite Assignment Created', `Assigned ${veh.vehicleNumber} → ${drv.driverName} → ${attendantName} → ${rt.routeName}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Vehicle Assignment & Crew Allocation
          </h2>
          <p className="text-xs text-slate-500">Enforce operational chain: Vehicle → Driver → Bus Attendant → Route (Click card to view Trip Details)</p>
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

      {/* Sub Tab Toggle: Current Assignments vs History Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'current'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Assignments ({filteredAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Assignment History Log ({assignmentLogs.length})
        </button>
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by vehicle, driver, or route..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: ACTIVE ASSIGNMENTS */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {/* Assignment Hierarchy Chain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map(a => {
              const attName = 'Mary Smith';

              return (
                <div
                  key={a.id}
                  className="glass-card p-5 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group"
                  onClick={() => handleOpenTripDetails(a)}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      {a.vehicleNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm">Active Assignment</Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTripDetails(a);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold text-[11px] hover:bg-sky-100 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Trip Details
                      </button>
                    </div>
                  </div>

                  {/* Visual Assignment Chain: Vehicle -> Driver -> Attendant -> Route */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5"><Bus className="w-4 h-4 text-sky-500" /> Vehicle: {a.vehicleNumber}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> Driver: {a.driverName}</span>
                    </div>

                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                      <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-emerald-500" /> Attendant: {attName}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="flex items-center gap-1.5"><Route className="w-4 h-4 text-amber-500" /> Route: {a.routeName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Effective Date: <strong className="text-slate-700 dark:text-slate-300">{a.effectiveFrom}</strong></span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleOpenEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingAssignment(a)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ASSIGNMENT HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Assigned Driver</th>
                  <th className="py-3.5 px-4">Bus Attendant</th>
                  <th className="py-3.5 px-4">Transit Route</th>
                  <th className="py-3.5 px-4">Assignment Period</th>
                  <th className="py-3.5 px-4 text-right">Actions / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {assignmentLogs.map(log => {
                  const matchingAssign = vehicleAssignments.find(a => a.vehicleNumber === log.vehicleNumber) || vehicleAssignments[0];

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{log.vehicleNumber}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{log.driverName}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{log.attendantName}</td>
                      <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{log.routeName}</td>
                      <td className="py-3 px-4 text-slate-500">{log.effectiveFrom} {log.effectiveTo ? ` to ${log.effectiveTo}` : ' (Current)'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant={log.status === 'Active' ? 'success' : 'neutral'}>{log.status}</Badge>
                          {matchingAssign && (
                            <button
                              onClick={() => handleOpenTripDetails(matchingAssign)}
                              className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold text-[10px] hover:bg-sky-100 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Trip Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAssignment ? 'Edit Vehicle Assignment' : 'Assign Vehicle → Driver → Attendant → Route'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Active Fleet Vehicle *</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="" disabled>-- Select a Vehicle --</option>
                  {vehicleMasters.filter(v => v.status === 'Active').map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.registrationNumber} • {v.capacity} Seats)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Licensed Driver *</label>
                <select value={driverId} onChange={e => setDriverId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="" disabled>-- Select a Driver --</option>
                  {driverMasters.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.id}>{d.driverName} ({d.mobileNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Bus Attendant *</label>
                <select value={attendantId} onChange={e => setAttendantId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="" disabled>-- Select a Bus Attendant --</option>
                  {attendants.filter(a => a.status === 'Active').map(a => (
                    <option key={a.id} value={a.id}>{a.attendantName} ({a.employeeId} • {a.mobileNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Transit Route *</label>
                <select value={routeId} onChange={e => setRouteId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="" disabled>-- Select a Route --</option>
                  {routeMasters.filter(r => r.status === 'Active').map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Effective Date</label>
                <input type="date" value={effectiveFrom?.split('T')[0] || ''} onChange={e => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">{editingAssignment ? 'Update Assignment' : 'Create Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE TRIP DETAILS MODAL */}
      <VehicleTripDetailsModal
        assignment={selectedTripAssignment}
        isOpen={isTripDetailsOpen}
        onClose={() => setIsTripDetailsOpen(false)}
      />

      {/* DELETE CONFIRMATION MODAL */}
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
