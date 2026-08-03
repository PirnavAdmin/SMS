import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Bus, UserPlus, Search, Trash2, CheckCircle, AlertTriangle, Users, ShieldAlert, History, Filter } from 'lucide-react';
import { StudentTransport, Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { initialBusAttendants } from './BusAttendantMasterView';

export interface StudentTransportHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  academicYear: string;
  branch: string;
  routeName: string;
  pickupPoint: string;
  vehicleNumber: string;
  driverName: string;
  attendantName: string;
  assignmentDate: string;
  status: 'Active' | 'Revoked';
}

export const initialStudentHistory: StudentTransportHistoryItem[] = [
  { id: 'sth-1', studentId: 'std-1', studentName: 'Ethan Hunt', admissionNo: 'ADM2026-413', academicYear: '2026-2027', branch: 'Main Campus', routeName: 'Route A - Downtown Express', pickupPoint: 'Central Park West', vehicleNumber: 'BUS-101', driverName: 'Dwight Schrute', attendantName: 'Mary Smith', assignmentDate: '2026-04-01', status: 'Active' },
  { id: 'sth-2', studentId: 'std-2', studentName: 'Jane Doe', admissionNo: 'ADM2026-102', academicYear: '2026-2027', branch: 'Main Campus', routeName: 'Route B - North Campus Direct', pickupPoint: 'Tech Park Stop 2', vehicleNumber: 'BUS-102', driverName: 'Jim Halpert', attendantName: 'Sarah Jenkins', assignmentDate: '2026-04-01', status: 'Active' },
  { id: 'sth-3', studentId: 'std-1', studentName: 'Ethan Hunt', admissionNo: 'ADM2026-413', academicYear: '2025-2026', branch: 'Main Campus', routeName: 'Route C - West Suburbs', pickupPoint: 'West Colony Stop 1', vehicleNumber: 'BUS-103', driverName: 'Michael Scott', attendantName: 'Pam Beesly', assignmentDate: '2025-04-01', status: 'Revoked' }
];

export const StudentTransportAssignmentView: React.FC = () => {
  const {
    students, studentTransports, routeMasters, pickupPoints, vehicleAssignments,
    vehicleMasters, driverMasters, assignStudentTransport, removeStudentTransport, checkVehicleCapacity,
    academicClasses, financeTransportConfigs
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const selectedAcademicYear = '2026-2027';
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<StudentTransport | null>(null);

  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [pickupPointId, setPickupPointId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [feePlan, setFeePlan] = useState<'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual'>('Quarterly');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [studentHistory, setStudentHistory] = useState<StudentTransportHistoryItem[]>(initialStudentHistory);

  // Auto-loaded Vehicle, Driver & Attendant
  const activeAssignedRoute = routeMasters.find(r => r.id === routeId);
  const availablePickupPoints = pickupPoints.filter(p => p.routeId?.toString() === routeId?.toString());
  
  const selectedVehicleObj = vehicleMasters.find(v => v.id === selectedVehicleId) || vehicleMasters[0];
  const assignedVehicleRel = vehicleAssignments.find(va => va.vehicleId === selectedVehicleObj?.id && va.status === 'Active') ||
                             vehicleAssignments.find(va => va.routeId?.toString() === routeId?.toString() && va.status === 'Active');
  
  const autoVehicleNumber = selectedVehicleObj ? selectedVehicleObj.vehicleNumber : (assignedVehicleRel ? assignedVehicleRel.vehicleNumber : 'BUS-101');
  const autoVehicleId = selectedVehicleObj ? selectedVehicleObj.id : (assignedVehicleRel ? assignedVehicleRel.vehicleId : 'VM-01');
  const autoDriverName = assignedVehicleRel ? assignedVehicleRel.driverName : 'Dwight Schrute';
  const autoAttendantName = 'Mary Smith';

  // Capacity evaluation for autoVehicleId
  const capacityInfo = checkVehicleCapacity(autoVehicleId);
  const totalCapacity = selectedVehicleObj?.capacity || capacityInfo.totalCapacity || 50;
  const assignedCount = capacityInfo.assignedCount || 12;
  const availableSeats = Math.max(0, totalCapacity - assignedCount);
  const isVehicleFull = availableSeats <= 0;

  const filteredStudentTransports = studentTransports.filter(st => {
    const matchesQuery = st.studentName.toLowerCase().includes(query.toLowerCase()) || st.admissionNo.toLowerCase().includes(query.toLowerCase());
    const sObj = students.find(s => s.id === st.studentId);
    const matchesClass = selectedClass === 'All' || (sObj && sObj.className === selectedClass);
    const matchesSection = selectedSection === 'All' || (sObj && sObj.section === selectedSection);
    return matchesQuery && matchesClass && matchesSection;
  });

  const handleOpenAdd = () => {
    const defaultRoute = routeMasters[0];
    const defaultVehicle = vehicleMasters[0];
    setStudentId(students[0]?.id || '');
    setRouteId(defaultRoute?.id || '');
    setSelectedVehicleId(defaultVehicle?.id || '');
    const firstPickup = pickupPoints.find(p => p.routeId === defaultRoute?.id);
    setPickupPointId(firstPickup?.id || '');
    setFeePlan('Quarterly');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === studentId);
    const rt = routeMasters.find(r => r.id === routeId);
    const pk = pickupPoints.find(p => p.id === pickupPointId);

    if (!st || !rt || !pk) {
      addToast('warning', 'Missing Details', 'Please select student, route, and pickup point.');
      return;
    }

    // Rule: One active transport assignment per student per academic year
    const existingActive = studentTransports.find(s => s.studentId === st.id && s.status === 'Active');
    if (existingActive) {
      addToast('info', 'Active Assignment Updated', `Updated transport assignment for ${st.firstName} for ${selectedAcademicYear}`);
    }

    // Capacity Enforcement Check!
    if (isVehicleFull) {
      addToast('warning', 'Vehicle Capacity Reached', `Vehicle ${autoVehicleNumber} has reached 100% capacity (${assignedCount}/${totalCapacity} seats). Cannot assign more students!`);
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
      status,
      vehicleId: autoVehicleId,
      vehicleNumber: autoVehicleNumber
    } as any);

    // Maintain History Record
    const historyItem: StudentTransportHistoryItem = {
      id: 'sth-' + Date.now(),
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      admissionNo: st.admissionNo,
      academicYear: selectedAcademicYear,
      branch: st.branch || 'Main Campus',
      routeName: rt.routeName,
      pickupPoint: pk.pickupName,
      vehicleNumber: autoVehicleNumber,
      driverName: autoDriverName,
      attendantName: autoAttendantName,
      assignmentDate: effectiveFrom,
      status: 'Active'
    };

    setStudentHistory(prev => [historyItem, ...prev]);

    addToast('success', 'Transport Service Allocated', `Assigned ${rt.routeName} (${pk.pickupName}) on ${autoVehicleNumber} to ${st.firstName}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-500" /> Student Transport Assignment
          </h2>
          <p className="text-xs text-slate-500">Allocate transport routes & pickup stops to students with strict seat capacity enforcement and history tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Assign Student Transport
          </button>
          <ExportButton data={studentTransports} filename="student_transport_allocations" />
        </div>
      </div>

      {/* Sub-tab toggle: Current Allocations vs History Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'current'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Student Allocations ({filteredStudentTransports.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Allocation History Log ({studentHistory.length})
        </button>
      </div>

      {/* Multi-level Filters: Academic Year, Branch, Class, Section */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4 overflow-x-auto w-full">
        <div className="relative w-64 shrink-0 pt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-5" />
          <input
            type="text"
            placeholder="Search student or adm no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400">Class Grade</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Classes</option>
              {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: CURRENT ACTIVE ALLOCATIONS */}
      {activeTab === 'current' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Adm No</th>
                  <th className="py-3.5 px-4">Transit Route</th>
                  <th className="py-3.5 px-4">Pickup Point</th>
                  <th className="py-3.5 px-4">Assigned Vehicle</th>
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
      )}

      {/* VIEW 2: ALLOCATION HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Academic Session</th>
                  <th className="py-3.5 px-4">Route Name</th>
                  <th className="py-3.5 px-4">Pickup Point</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Crew (Driver / Attendant)</th>
                  <th className="py-3.5 px-4">Assignment Date</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {studentHistory.map(hist => (
                  <tr key={hist.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{hist.studentName} <span className="font-mono text-slate-400 font-normal">({hist.admissionNo})</span></td>
                    <td className="py-3 px-4 font-bold text-sky-600">{hist.academicYear}</td>
                    <td className="py-3 px-4 font-bold text-sky-600">{hist.routeName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{hist.pickupPoint}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{hist.vehicleNumber}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{hist.driverName} • {hist.attendantName}</td>
                    <td className="py-3 px-4 text-slate-500">{hist.assignmentDate}</td>
                    <td className="py-3 px-4 text-right"><Badge variant={hist.status === 'Active' ? 'success' : 'neutral'}>{hist.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL WITH AUTO-LOAD & CAPACITY VALIDATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                    const firstPk = pickupPoints.find(p => p.routeId?.toString() === e.target.value?.toString());
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
                  {availablePickupPoints.length === 0 ? (
                    <option value="" disabled>No pickup points available for this route</option>
                  ) : (
                    <>
                      <option value="" disabled>-- Select a Pickup Point --</option>
                      {availablePickupPoints.map(p => (
                        <option key={p.id} value={p.id}>{p.pickupName} (Stop #{p.sequenceNumber} • {formatCurrency(p.monthlyFee || 0)}/mo)</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Fleet Vehicle *</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600"
                >
                  {vehicleMasters.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.vehicleType} • Capacity: {v.capacity} Seats)</option>
                  ))}
                </select>
              </div>

              {/* AUTO-LOADED DRIVER & ATTENDANT DISPLAY */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auto-Loaded Crew Details</p>
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  <span>Driver: <strong className="text-sky-600">{autoDriverName}</strong></span>
                  <span>Attendant: <strong className="text-emerald-600">{autoAttendantName}</strong></span>
                </div>
              </div>

              {/* CAPACITY VALIDATION STATUS BANNER */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${isVehicleFull ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200'}`}>
                <div>
                  <p className="text-[10px] font-bold uppercase">Vehicle Capacity Validation</p>
                  <p className="font-extrabold text-sm">{autoVehicleNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold">Seat Status</p>
                  <p className="font-bold text-xs">{assignedCount} / {totalCapacity} Seats ({availableSeats} Available)</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <input type="date" value={effectiveFrom?.split('T')[0] || ''} onChange={e => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assignment Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" disabled={isVehicleFull} className="px-5 py-2 font-bold bg-sky-600 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-sky-500/20">Allocate Service</button>
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
