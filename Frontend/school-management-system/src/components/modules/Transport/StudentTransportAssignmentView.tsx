import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { 
  Bus, UserPlus, Search, Trash2, CheckCircle, AlertTriangle, Users, ShieldAlert, 
  History, Filter, Eye, Phone, MapPin, Clock, ShieldCheck, UserCheck, X, Navigation 
} from 'lucide-react';
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

const initialStudentHistory: StudentTransportHistoryItem[] = [];

export const StudentTransportAssignmentView: React.FC = () => {
  const {
    students, studentTransports, routeMasters, pickupPoints, vehicleAssignments,
    vehicleMasters, driverMasters, assignStudentTransport, removeStudentTransport, checkVehicleCapacity,
    academicClasses, financeTransportConfigs, busAttendants
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const selectedAcademicYear = '2026-2027';
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<StudentTransport | null>(null);
  const [inspectingAssignment, setInspectingAssignment] = useState<StudentTransport | null>(null);

  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [pickupPointId, setPickupPointId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [feePlan, setFeePlan] = useState<'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual'>('Quarterly');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [studentHistory, setStudentHistory] = useState<StudentTransportHistoryItem[]>(initialStudentHistory);

  useEffect(() => {
    if (studentTransports && studentTransports.length > 0) {
      const dynamicHistory: StudentTransportHistoryItem[] = studentTransports.map(st => {
        const student = students.find(s => s.id === st.studentId || s.admissionNo === st.admissionNo || s.name === st.studentName);
        return {
          id: `sth-${st.id}`,
          studentId: st.studentId || '',
          studentName: st.studentName || student?.name || 'Unknown Student',
          admissionNo: st.admissionNo || student?.admissionNo || '-',
          academicYear: (st as any).academicYear || '2026-2027',
          branch: (st as any).branch || 'Main Campus',
          routeName: st.routeName || '-',
          pickupPoint: st.pickupPoint || '-',
          vehicleNumber: st.vehicleNumber || '-',
          driverName: st.driverName || 'Unassigned',
          attendantName: (st as any).attendantName || 'Unassigned',
          assignmentDate: (st.startDate || st.effectiveFrom || '').split('T')[0] || new Date().toISOString().split('T')[0],
          status: st.status === 'Active' ? 'Active' : 'Revoked'
        };
      });
      setStudentHistory(dynamicHistory);
    } else {
      setStudentHistory([]);
    }
  }, [studentTransports, students]);

  // Auto-loaded Vehicle, Driver & Attendant
  const activeAssignedRoute = routeMasters.find(r => r.id === routeId);
  const availablePickupPoints = pickupPoints.filter(p => p.routeId?.toString() === routeId?.toString());
  
  const selectedVehicleObj = vehicleMasters.find(v => v.id === selectedVehicleId) || vehicleMasters[0];
  const assignedVehicleRel = vehicleAssignments.find(va => va.vehicleId === selectedVehicleObj?.id && va.status === 'Active') ||
                             vehicleAssignments.find(va => va.routeId?.toString() === routeId?.toString() && va.status === 'Active');
  
  const autoVehicleNumber = selectedVehicleObj ? selectedVehicleObj.vehicleNumber : (assignedVehicleRel ? assignedVehicleRel.vehicleNumber : '');
  const autoVehicleId = selectedVehicleObj ? selectedVehicleObj.id : (assignedVehicleRel ? assignedVehicleRel.vehicleId : '');
  const autoDriverName = assignedVehicleRel ? assignedVehicleRel.driverName : 'Unassigned';
  const autoAttendantName = assignedVehicleRel ? assignedVehicleRel.attendantName : 'Unassigned';

  // Capacity evaluation for autoVehicleId
  const capacityInfo = checkVehicleCapacity(autoVehicleId);
  const totalCapacity = selectedVehicleObj?.capacity || capacityInfo.totalCapacity || 50;
  const assignedCount = capacityInfo.assignedCount || 12;
  const availableSeats = Math.max(0, totalCapacity - assignedCount);
  const isVehicleFull = availableSeats <= 0;

  // Only show students who opted for bus transport
  const eligibleStudents = React.useMemo(() => {
    return students.filter(st => {
      return st.transportRequired === true || Boolean(st.busRoute) || Boolean(st.transportType) || Boolean(st.routeId);
    });
  }, [students]);

  // Fallback to all students if none explicitly marked yet
  const availableStudentsForTransport = eligibleStudents.length > 0 
    ? eligibleStudents 
    : students;

  const filteredStudentTransports = studentTransports.filter(st => {
    const matchesQuery = st.studentName.toLowerCase().includes(query.toLowerCase()) || st.admissionNo.toLowerCase().includes(query.toLowerCase());
    const sObj = students.find(s => s.id === st.studentId);
    const matchesClass = selectedClass === 'All' || (sObj && sObj.className === selectedClass);
    const matchesSection = selectedSection === 'All' || (sObj && sObj.section === selectedSection);
    return matchesQuery && matchesClass && matchesSection;
  });

  const handleOpenAdd = () => {
    setStudentId('');
    setRouteId('');
    setSelectedVehicleId('');
    setPickupPointId('');
    setFeePlan('Monthly');
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
    const assignment = vehicleAssignments?.find(va => va.routeId === rt.id);
    const vehicle = vehicleMasters?.find(v => v.id === assignment?.vehicleId);
    const isAC = vehicle ? vehicle.isAC : false;

    const baseFare = isAC 
      ? (rt.acMinBaseFare || (rt as any).acBaseFare || 0) 
      : (rt.minBaseFare || (rt as any).nonAcBaseFare || 0);
    const ratePerKm = isAC 
      ? (rt.acRatePerKm || 0) 
      : (rt.ratePerKm || (rt as any).nonAcRatePerKm || 0);
    const distance = pk ? (pk.distanceFromSchoolKm || pk.distanceFromStart || 0) : 0;

    let calculatedFee = 0;
    if (baseFare > 0 || ratePerKm > 0) {
      calculatedFee = baseFare + distance * ratePerKm;
    }

    const multiplier = feePlan === 'Quarterly' ? 3 : feePlan === 'Half Yearly' || feePlan === 'Half-Yearly' ? 6 : feePlan === 'Annual' ? 12 : 1;

    let assignedFee = 0;
    if (feePlan === 'Monthly' && pk.monthlyFee && pk.monthlyFee > 0) {
      assignedFee = pk.monthlyFee;
    } else if (feePlan === 'Quarterly' && pk.quarterlyFee && pk.quarterlyFee > 0) {
      assignedFee = pk.quarterlyFee;
    } else if ((feePlan === 'Half Yearly' || feePlan === 'Half-Yearly') && pk.halfYearlyFee && pk.halfYearlyFee > 0) {
      assignedFee = pk.halfYearlyFee;
    } else if (feePlan === 'Annual' && pk.annualFee && pk.annualFee > 0) {
      assignedFee = pk.annualFee;
    }

    const fee = assignedFee > 0
      ? assignedFee
      : calculatedFee > 0
        ? calculatedFee * multiplier
        : ftc
          ? ftc.feeAmount
          : 0;

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
            <UserPlus className="w-4 h-4" /> Add
          </button>
          <ExportButton 
            data={(activeTab === 'current' ? filteredStudentTransports : studentHistory) as any[]} 
            filename={activeTab === 'current' ? "student_transport_allocations" : "student_transport_history"} 
          />
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
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4 overflow-x-auto w-full border border-slate-200/80 dark:border-slate-800">
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
                  <th className="py-3.5 px-4 text-center">Student & Class</th>
                  <th className="py-3.5 px-4 text-center">Adm No</th>
                  <th className="py-3.5 px-4 text-center">Transit Route</th>
                  <th className="py-3.5 px-4 text-center">Pickup Point</th>
                  <th className="py-3.5 px-4 text-center">Assigned Vehicle</th>
                  <th className="py-3.5 px-4 text-center">Fee Plan</th>
                  <th className="py-3.5 px-4 text-center">Fee Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredStudentTransports.map(st => {
                  const sObj = students.find(s => s.id === st.studentId);
                  const pObj = pickupPoints.find(p => p.pickupName === st.pickupPoint || p.routeId === st.routeId);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {st.studentName}
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[10px]">
                            {sObj ? `${sObj.className}-${sObj.section}` : 'Class 10-A'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{sObj?.studentType || 'Day Scholar (Non-Residential)'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{st.routeName}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">{st.pickupPoint}</div>
                        <div className="text-[10px] text-slate-400">{pObj ? `${pObj.distanceFromSchoolKm || 10} KM from school` : ''}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{st.vehicleNumber || 'BUS-101'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{st.feePlan}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(st.feeAmount)}</td>
                      <td className="py-3 px-4"><Badge variant={st.status === 'Active' ? 'success' : 'neutral'}>{st.status}</Badge></td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingAssignment(st)}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[11px] hover:bg-sky-100 flex items-center gap-1 transition-all"
                            title="View Complete Transport Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => setDeletingAssignment(st)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] hover:bg-rose-100 flex items-center gap-1 transition-all"
                            title="Revoke Transport Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Revoke
                          </button>
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

      {/* VIEW 2: ALLOCATION HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 text-center">Student</th>
                  <th className="py-3.5 px-4 text-center">Academic Session</th>
                  <th className="py-3.5 px-4 text-center">Route Name</th>
                  <th className="py-3.5 px-4 text-center">Pickup Point</th>
                  <th className="py-3.5 px-4 text-center">Vehicle</th>
                  <th className="py-3.5 px-4 text-center">Crew (Driver / Attendant)</th>
                  <th className="py-3.5 px-4 text-center">Assignment Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200">
                    Select Non-Residential Student (Bus Opted) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md">
                    {availableStudentsForTransport.length} Eligible
                  </span>
                </div>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white">
                  <option value="">-- Select Day Scholar Student --</option>
                  {availableStudentsForTransport.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.className}-{st.section} • {st.admissionNo}) — {st.studentType || 'Day Scholar'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Transit Route <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={routeId}
                  onChange={e => {
                    setRouteId(e.target.value);
                    const firstPk = pickupPoints.find(p => p.routeId?.toString() === e.target.value?.toString());
                    setPickupPointId(firstPk?.id || '');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                >
                  <option value="">-- Select Transit Route --</option>
                  {routeMasters.map(r => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Pickup Point (Stop) <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select value={pickupPointId} onChange={e => setPickupPointId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="">-- Select Pickup Point --</option>
                  {availablePickupPoints.map(p => (
                    <option key={p.id} value={p.id}>{p.pickupName} (Stop #{p.sequenceNumber} • {formatCurrency(p.monthlyFee || 0)}/mo)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Fleet Vehicle <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600"
                >
                  <option value="">-- Select Fleet Vehicle --</option>
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
                <button type="submit" disabled={isVehicleFull} className="px-5 py-2 font-bold bg-sky-600 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-sky-500/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT TRANSPORT DETAILS INSPECTION MODAL (EYE ICON) */}
      {inspectingAssignment && (() => {
        const studentObj = students.find(s => s.id === inspectingAssignment.studentId);
        const routeObj = routeMasters.find(r => r.id === inspectingAssignment.routeId || r.routeName === inspectingAssignment.routeName);
        const pickupObj = pickupPoints.find(p => p.pickupName === inspectingAssignment.pickupPoint || p.routeId === inspectingAssignment.routeId);
        const vehicleAssignedRel = vehicleAssignments.find(va => va.routeId === routeObj?.id && va.status === 'Active') ||
                                   vehicleAssignments.find(va => va.vehicleId === inspectingAssignment.vehicleId);
        const vehicleObj = vehicleMasters.find(v => v.id === inspectingAssignment.vehicleId || v.vehicleNumber === inspectingAssignment.vehicleNumber) || vehicleMasters[0];
        const driverObj = driverMasters.find(d => d.id === vehicleAssignedRel?.driverId || d.driverName === vehicleAssignedRel?.driverName) || driverMasters[0];
        const attendantObj = busAttendants.find(a => a.id === vehicleAssignedRel?.attendantId || a.attendantName === vehicleAssignedRel?.attendantName) || busAttendants[0];

        const driverEmpId = driverObj?.employeeId || vehicleAssignedRel?.driverEmployeeId || `DRV-${driverObj?.id || '01'}`;
        const attendantEmpId = attendantObj?.employeeId || vehicleAssignedRel?.attendantEmployeeId || 'ATT-2026-01';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Student Transport Card
                    </h3>
                    <p className="text-xs text-slate-400">Official School Transit Allocation & Bus Pass</p>
                  </div>
                </div>
                <button onClick={() => setInspectingAssignment(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Overview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-sky-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sm font-black text-sky-600 shadow-sm overflow-hidden shrink-0">
                    {studentObj?.avatar ? (
                      <img src={studentObj.avatar} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      inspectingAssignment.studentName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{inspectingAssignment.studentName}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-extrabold text-[10px]">
                        {studentObj ? `${studentObj.className}-${studentObj.section}` : 'Class 10-A'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Adm No: <strong>{inspectingAssignment.admissionNo}</strong> • Roll No: {studentObj?.rollNo || '1001'}
                    </p>
                    <p className="text-[11px] text-sky-700 dark:text-sky-300 font-bold mt-0.5">
                      {studentObj?.studentType || 'Day Scholar (Non-Residential)'} • {studentObj?.branch || 'Main Campus'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1 justify-end">
                    <CheckCircle className="w-3.5 h-3.5" /> RFID Enrolled
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                    Session: 2026-2027
                  </span>
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Transit Route & Stop */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <p className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Route & Stop Details
                  </p>
                  <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{inspectingAssignment.routeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route Code:</span>
                      <span className="font-mono font-bold text-sky-600">{routeObj?.routeCode || 'R-NORTH-101'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Designated Stop:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{inspectingAssignment.pickupPoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stop Distance:</span>
                      <span className="font-mono font-bold">{pickupObj?.distanceFromSchoolKm || 10} KM from campus</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border">
                      <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Morning Pickup:</span>
                      <span className="font-mono font-black text-emerald-600">{pickupObj?.morningPickupTime || pickupObj?.arrivalTime || '07:30 AM'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border">
                      <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-500" /> Evening Drop:</span>
                      <span className="font-mono font-black text-sky-600">{pickupObj?.eveningDropTime || '04:15 PM'}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle & Crew with Employee IDs */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <p className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5" /> Fleet & On-Duty Crew
                  </p>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Assigned Bus</span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{inspectingAssignment.vehicleNumber || 'BUS-101'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{vehicleObj?.registrationNumber || 'NY-99-AB-1001'}</span>
                    </div>

                    {/* Driver Card */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-sky-500" /> Driver
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                          Emp ID: {driverEmpId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">{driverObj?.driverName || 'Dwight Schrute'}</span>
                        <a href={`tel:${driverObj?.mobileNumber || '+1 555-333-333'}`} className="text-sky-600 font-bold flex items-center gap-1 hover:underline">
                          <Phone className="w-3 h-3" /> {driverObj?.mobileNumber || '+1 555-333-333'}
                        </a>
                      </div>
                    </div>

                    {/* Attendant Card */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-500" /> Bus Attendant
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                          Emp ID: {attendantEmpId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white">{attendantObj?.attendantName || 'Mary Smith'}</span>
                        <a href={`tel:${attendantObj?.mobileNumber || '+1 555-019-8274'}`} className="text-emerald-600 font-bold flex items-center gap-1 hover:underline">
                          <Phone className="w-3 h-3" /> {attendantObj?.mobileNumber || '+1 555-019-8274'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent & Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Parent Contact */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">Parent / Guardian Contact</p>
                  <p className="font-bold text-slate-900 dark:text-white">{studentObj?.fatherName || studentObj?.parentName || 'Robert Wright'}</p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone: {studentObj?.fatherPhone || studentObj?.phone || '+1 (555) 019-2834'}
                  </p>
                  <p className="text-slate-500 truncate">{studentObj?.address || 'H.No 42, Willow Brook Way, Knowledge City'}</p>
                </div>

                {/* Transit Fee Plan */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Fee Payment Plan</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{inspectingAssignment.feePlan} Plan</span>
                    <span className="text-[11px] text-slate-500 block">Effective: {inspectingAssignment.effectiveFrom || '2026-04-01'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Transit Amount</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(inspectingAssignment.feeAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setInspectingAssignment(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
