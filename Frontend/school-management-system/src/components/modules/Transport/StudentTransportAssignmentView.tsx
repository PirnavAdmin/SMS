import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Bus, UserPlus, Search, Trash2, CheckCircle, AlertTriangle, Users, ShieldAlert } from 'lucide-react';
import { StudentTransport, Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const StudentTransportAssignmentView: React.FC = () => {
  const {
    students, studentTransports, routeMasters, pickupPoints, vehicleAssignments,
    vehicleMasters, assignStudentTransport, removeStudentTransport, checkVehicleCapacity,
    academicClasses, financeTransportConfigs
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<StudentTransport | null>(null);

  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [pickupPointId, setPickupPointId] = useState('');
  const [feePlan, setFeePlan] = useState<'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual'>('Quarterly');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  // Bulk Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const activeAssignedRoute = routeMasters.find(r => r.id === routeId);
  const availablePickupPoints = pickupPoints.filter(p => p.routeId === routeId);
  const assignedVehicleRel = vehicleAssignments.find(va => va.routeId === routeId && va.status === 'Active');
  const autoVehicleNumber = assignedVehicleRel ? assignedVehicleRel.vehicleNumber : 'BUS-101';
  const autoVehicleId = assignedVehicleRel ? assignedVehicleRel.vehicleId : 'VM-01';

  // Capacity evaluation for autoVehicleId
  const capacityInfo = checkVehicleCapacity(autoVehicleId);

  const filteredStudentTransports = studentTransports.filter(st => {
    const matchesQuery = st.studentName.toLowerCase().includes(query.toLowerCase()) || st.admissionNo.toLowerCase().includes(query.toLowerCase());
    return matchesQuery;
  });

  const handleOpenAdd = () => {
    const defaultRoute = routeMasters[0];
    setStudentId(students[0]?.id || '');
    setRouteId(defaultRoute?.id || '');
    const firstPickup = pickupPoints.find(p => p.routeId === defaultRoute?.id);
    setPickupPointId(firstPickup?.id || '');
    setFeePlan('Quarterly');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === studentId);
    const rt = routeMasters.find(r => r.id === routeId);
    const pk = pickupPoints.find(p => p.id === pickupPointId);

    if (!st || !rt || !pk) {
      addToast('warning', 'Missing Details', 'Please select student, route, and pickup point.');
      return;
    }

    // Capacity Enforcement Check!
    if (capacityInfo.isFull) {
      addToast('warning', 'Vehicle Capacity Full', `Vehicle ${autoVehicleNumber} has reached 100% capacity (${capacityInfo.totalCapacity}/${capacityInfo.totalCapacity} seats). Cannot assign more students!`);
      return;
    }

    const ftc = financeTransportConfigs.find(
      c => c.routeId === rt.id && (c.pickupPointId === pk.id || c.pickupName === pk.pickupName) && c.feePlan === feePlan && c.status === 'Active'
    );
    const fee = ftc ? ftc.feeAmount : 5000;

    assignStudentTransport({
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      routeId: rt.id,
      routeName: rt.routeName,
      pickupPoint: pk.pickupName,
      feePlan,
      feeAmount: fee,
      effectiveFrom,
      status: 'Active',
      vehicleId: autoVehicleId,
      vehicleNumber: autoVehicleNumber
    } as any);

    addToast('success', 'Transport Assigned', `Assigned ${rt.routeName} (${pk.pickupName}) to ${st.firstName}`);
    setIsModalOpen(false);
  };

  const handleBulkAssign = () => {
    if (selectedStudentIds.length === 0) {
      addToast('warning', 'No Students Selected', 'Select students for bulk transport assignment.');
      return;
    }

    const defaultRoute = routeMasters[0];
    const defaultPickup = pickupPoints.find(p => p.routeId === defaultRoute?.id) || pickupPoints[0];

    if (!defaultRoute || !defaultPickup) {
      addToast('warning', 'No Routes Configured', 'Add a route and pickup point first.');
      return;
    }

    let successCount = 0;
    selectedStudentIds.forEach(stId => {
      const st = students.find(s => s.id === stId);
      if (st) {
        assignStudentTransport({
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          admissionNo: st.admissionNo,
          routeId: defaultRoute.id,
          routeName: defaultRoute.routeName,
          pickupPoint: defaultPickup.pickupName,
          feePlan: 'Quarterly',
          feeAmount: defaultPickup.quarterlyFee,
          effectiveFrom,
          status: 'Active',
          vehicleId: autoVehicleId,
          vehicleNumber: autoVehicleNumber
        } as any);
        successCount++;
      }
    });

    addToast('success', 'Bulk Assignment Completed', `Assigned transport to ${successCount} students.`);
    setSelectedStudentIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-500" /> Student Transport Service Allocation
          </h2>
          <p className="text-xs text-slate-500">Allocate 1-to-1 transport routes to enrolled students with vehicle seat capacity enforcement</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Assign Transport
          </button>
          <ExportButton data={studentTransports} filename="student_transport_allocations" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student or adm no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Class Grades</option>
            {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Allocation Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Transit Route</th>
                <th className="py-3.5 px-4">Pickup Point</th>
                <th className="py-3.5 px-4">Auto Vehicle</th>
                <th className="py-3.5 px-4">Fee Plan</th>
                <th className="py-3.5 px-4">Fee Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredStudentTransports.map(st => (
                <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.studentName}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                  <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{st.routeName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200">{st.pickupPoint}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{st.vehicleNumber || 'BUS-101'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{st.feePlan}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(st.feeAmount)}</td>
                  <td className="py-3 px-4"><Badge variant={st.status === 'Active' ? 'success' : 'neutral'}>{st.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setDeletingAssignment(st)} className="p-1 rounded hover:bg-rose-50 text-rose-600 ml-auto flex items-center gap-1 font-bold">
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Allocate Student Transport Service</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Enrolled Student *</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section} • {st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Transit Route *</label>
                <select
                  value={routeId}
                  onChange={e => {
                    setRouteId(e.target.value);
                    const firstPk = pickupPoints.find(p => p.routeId === e.target.value);
                    setPickupPointId(firstPk?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                >
                  {routeMasters.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Pickup Point (Stop) *</label>
                <select value={pickupPointId} onChange={e => setPickupPointId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {availablePickupPoints.map(p => (
                    <option key={p.id} value={p.id}>{p.pickupName} (Stop #{p.sequenceNumber} • {formatCurrency(p.monthlyFee || 0)}/mo)</option>
                  ))}
                </select>
              </div>

              {/* Auto Assigned Vehicle & Capacity Status Banner */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${capacityInfo.isFull ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200'}`}>
                <div>
                  <p className="text-[10px] font-bold uppercase">Auto-Assigned Vehicle</p>
                  <p className="font-extrabold text-sm">{autoVehicleNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold">Capacity Status</p>
                  <p className="font-bold text-xs">{capacityInfo.assignedCount} / {capacityInfo.totalCapacity} Seats ({capacityInfo.availableSeats} Available)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fee Payment Plan</label>
                  <select value={feePlan} onChange={e => setFeePlan(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Effective Date</label>
                  <input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" disabled={capacityInfo.isFull} className="px-5 py-2 font-bold bg-sky-600 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-sky-500/20">Allocate Service</button>
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
            removeStudentTransport(deletingAssignment.id);
            addToast('info', 'Transport Service Revoked');
            setDeletingAssignment(null);
          }
        }}
        title="Revoke Transport Service"
        message={`Revoke transport service for ${deletingAssignment?.studentName}?`}
      />
    </div>
  );
};
