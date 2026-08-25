import React, { useState } from 'react';
import { Bus, Plus, Search, Edit, Trash2, Shield, AlertTriangle, Cpu, FileText, Calendar, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { VehicleMaster } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export interface VehicleDocumentItem {
  id: string;
  vehicleId: string;
  docType: 'RC' | 'Insurance' | 'Fitness' | 'Pollution (PUC)' | 'Permit' | 'Tax Certificate';
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  attachmentName?: string;
}

const initialVehicleDocs: VehicleDocumentItem[] = [
  { id: 'vd-1', vehicleId: 'vm-01', docType: 'RC', docNumber: 'RC-NY-99104', issueDate: '2022-01-15', expiryDate: '2037-01-15', attachmentName: 'RC_Official_Bus101.pdf' },
  { id: 'vd-2', vehicleId: 'vm-01', docType: 'Insurance', docNumber: 'INS-8810-AB', issueDate: '2025-12-01', expiryDate: '2026-12-01', attachmentName: 'Insurance_Policy_2026.pdf' },
  { id: 'vd-3', vehicleId: 'vm-01', docType: 'Fitness', docNumber: 'FIT-2025-001', issueDate: '2025-03-01', expiryDate: '2026-08-15', attachmentName: 'Fitness_Certificate_Passed.pdf' },
  { id: 'vd-4', vehicleId: 'vm-01', docType: 'Pollution (PUC)', docNumber: 'PUC-99218', issueDate: '2026-02-01', expiryDate: '2026-08-01', attachmentName: 'PUC_Receipt.pdf' },
  { id: 'vd-5', vehicleId: 'vm-01', docType: 'Permit', docNumber: 'PERM-SCH-101', issueDate: '2024-04-01', expiryDate: '2029-04-01', attachmentName: 'State_Bus_Permit.pdf' },
  { id: 'vd-6', vehicleId: 'vm-01', docType: 'Tax Certificate', docNumber: 'TAX-2026-99', issueDate: '2026-04-01', expiryDate: '2027-04-01', attachmentName: 'Road_Tax_Receipt.pdf' }
];

export const VehicleMasterView: React.FC = () => {
  const { vehicleMasters, vehicleAssignments, addVehicleMaster, updateVehicleMaster, deleteVehicleMaster, checkVehicleCapacity } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(() => sessionStorage.getItem('tm_vehicle_filter') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleMaster | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<VehicleMaster | null>(null);

  const handleVehicleFilterChange = (val: string) => {
    setSelectedVehicleFilter(val);
    sessionStorage.setItem('tm_vehicle_filter', val);
  };

  // Document Management Modal State
  const [vehicleDocs, setVehicleDocs] = useState<VehicleDocumentItem[]>(initialVehicleDocs);
  const [docModalVehicle, setDocModalVehicle] = useState<VehicleMaster | null>(null);
  const [docForm, setDocForm] = useState<Partial<VehicleDocumentItem>>({
    docType: 'Insurance',
    docNumber: '',
    issueDate: '2026-01-01',
    expiryDate: '2027-01-01',
    attachmentName: ''
  });

  const [form, setForm] = useState<Partial<VehicleMaster>>({
    vehicleNumber: '',
    registrationNumber: '',
    vehicleType: 'Bus',
    capacity: undefined,
    isAC: false,
    chassisNumber: '',
    engineNumber: '',
    insuranceExpiry: '',
    pollutionExpiry: '',
    fitnessExpiry: '',
    gpsDeviceId: '',
    status: 'Active'
  });

  const filteredVehicles = vehicleMasters.filter(v => {
    const matchesQuery = v.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
                         v.registrationNumber.toLowerCase().includes(query.toLowerCase());
    const matchesVehicle = selectedVehicleFilter === 'ALL' || v.id === selectedVehicleFilter;
    return matchesQuery && matchesVehicle;
  });

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setForm({
      vehicleNumber: '',
      registrationNumber: '',
      vehicleType: 'Bus',
      capacity: undefined,
      isAC: false,
      chassisNumber: '',
      engineNumber: '',
      insuranceExpiry: '',
      pollutionExpiry: '',
      fitnessExpiry: '',
      gpsDeviceId: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleMaster) => {
    setEditingVehicle(v);
    setForm(v);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.vehicleNumber || !form.registrationNumber) return;

    if (editingVehicle) {
      updateVehicleMaster(editingVehicle.id, form);
      addToast('success', 'Vehicle Updated', `Updated ${form.vehicleNumber}`);
    } else {
      addVehicleMaster(form as Omit<VehicleMaster, 'id'>);
      addToast('success', 'Vehicle Registered', `Added ${form.vehicleNumber}`);
    }
    setIsModalOpen(false);
  };

  // Document Management Handlers
  const handleOpenDocs = (v: VehicleMaster) => {
    setDocModalVehicle(v);
    setDocForm({
      docType: 'Insurance',
      docNumber: `DOC-NO-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attachmentName: ''
    });
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModalVehicle || !docForm.docNumber) return;

    const newDoc: VehicleDocumentItem = {
      id: 'vd-' + Date.now(),
      vehicleId: docModalVehicle.id,
      docType: (docForm.docType || 'Insurance') as any,
      docNumber: docForm.docNumber || '',
      issueDate: docForm.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: docForm.expiryDate || '2027-01-01',
      attachmentName: docForm.attachmentName || `${docForm.docType}_${docModalVehicle.vehicleNumber}.pdf`
    };

    setVehicleDocs(prev => [newDoc, ...prev]);
    addToast('success', 'Vehicle Document Uploaded', `Added ${newDoc.docType} for ${docModalVehicle.vehicleNumber}`);
    setDocForm({
      docType: 'Pollution (PUC)',
      docNumber: `DOC-NO-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attachmentName: ''
    });
  };

  const handleDeleteDocument = (docId: string) => {
    setVehicleDocs(prev => prev.filter(d => d.id !== docId));
    addToast('info', 'Document Removed');
  };

  const checkDocExpiryStatus = (expiryDateStr?: string) => {
    if (!expiryDateStr) return { isExpired: false, isExpiringSoon: false, daysLeft: 999 };
    const exp = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return {
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 30,
      daysLeft: diffDays
    };
  };

  const resolveCurrentAssignment = (vehicle: VehicleMaster) =>
    vehicleAssignments.find(assignment => assignment.vehicleId === vehicle.id && assignment.status === 'Active') ||
    vehicleAssignments.find(assignment => assignment.vehicleNumber === vehicle.vehicleNumber && assignment.status === 'Active');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bus className="w-6 h-6 text-sky-500" /> Vehicles
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
          <ExportButton 
            data={filteredVehicles} 
            filename={selectedVehicleFilter && selectedVehicleFilter !== 'ALL' 
              ? `vehicle_${vehicleMasters.find(v => v.id === selectedVehicleFilter)?.vehicleNumber || 'filtered'}` 
              : 'vehicle_masters'} 
          />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vehicle no or reg no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Vehicle:</label>
          <select
            value={selectedVehicleFilter}
            onChange={e => handleVehicleFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Vehicle --</option>
            <option value="ALL">All Vehicles</option>
            {vehicleMasters.map(v => (
              <option key={v.id} value={v.id}>
                {v.vehicleNumber} ({v.registrationNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedVehicleFilter === '' ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <Bus className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Please Select a Vehicle</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a vehicle from the dropdown above or click below to view all vehicles.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleVehicleFilterChange('ALL')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Vehicles
            </button>
          </div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">No vehicles found matching your filter or search query.</p>
          <button
            onClick={() => { handleVehicleFilterChange('ALL'); setQuery(''); }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Vehicle Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map(v => {
          const cap = checkVehicleCapacity(v.id);
          const docsForV = vehicleDocs.filter(d => d.vehicleId === v.id);
          const currentAssignment = resolveCurrentAssignment(v);

          // Expiry evaluations
          const insStatus = checkDocExpiryStatus(v.insuranceExpiry);
          const polStatus = checkDocExpiryStatus(v.pollutionExpiry);
          const fitStatus = checkDocExpiryStatus(v.fitnessExpiry);

          const hasExpiringDoc = insStatus.isExpiringSoon || polStatus.isExpiringSoon || fitStatus.isExpiringSoon || insStatus.isExpired;

          return (
            <div key={v.id} className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {v.vehicleType} • {v.isAC ? 'AC' : 'Non-AC'}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{v.vehicleNumber}</h4>
                  </div>
                  <Badge variant={v.status === 'Active' ? 'success' : v.status === 'Maintenance' ? 'warning' : 'neutral'}>{v.status}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Reg No:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{v.registrationNumber}</span></div>
                  
                  {/* Seating Capacity Display */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500 text-[11px]">Seating Capacity:</span>
                      <span className="text-emerald-600">{cap.assignedCount} / {v.capacity} Seats ({cap.availableSeats} Left)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (cap.assignedCount / v.capacity) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between"><span className="text-slate-400">GPS Device ID:</span><span className="font-mono text-sky-600 flex items-center gap-1"><Cpu className="w-3 h-3" /> {v.gpsDeviceId}</span></div>

                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-sky-600 block">Current Assignment</span>
                    {currentAssignment ? (
                      <>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Route:</span><span className="font-bold text-slate-900 dark:text-white text-right">{currentAssignment.routeName}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Driver:</span><span className="font-semibold text-sky-600 text-right">{currentAssignment.driverName}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Bus Attendant:</span><span className="font-semibold text-emerald-600 text-right">{currentAssignment.attendantName || 'Unassigned'}</span></div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500">No active assignment</p>
                    )}
                  </div>

                  {/* Document Warning Badge */}
                  {hasExpiringDoc && (
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Document expiry warning active for this vehicle!</span>
                    </div>
                  )}

                  <div className="flex justify-between"><span className="text-slate-400">Insurance Expiry:</span><span className={`font-semibold ${insStatus.isExpiringSoon || insStatus.isExpired ? 'text-rose-600 font-bold' : ''}`}>{v.insuranceExpiry}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Fitness Expiry:</span><span className="font-semibold">{v.fitnessExpiry}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenDocs(v)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Vehicle Docs ({docsForV.length > 0 ? docsForV.length : 6})
                </button>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(v)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingVehicle(v)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Edit/Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingVehicle ? 'Edit Vehicle Master' : 'Register Vehicle Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-4 text-xs">
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 pb-4 scrollbar-thin">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Vehicle Number <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AP05DC0527"
                      value={form.vehicleNumber || ''}
                      onChange={e => setForm({ ...form, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Reg Number <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. REG-SC-2026-213243"
                      value={form.registrationNumber || ''}
                      onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Vehicle Type</label>
                    <select
                      value={form.vehicleType || 'Bus'}
                      onChange={e => setForm({ ...form, vehicleType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Bus">Bus</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">AC Specification</label>
                    <select
                      value={form.isAC === true ? 'AC' : 'Non-AC'}
                      onChange={e => setForm({ ...form, isAC: e.target.value === 'AC' })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Non-AC">Regular (Non-AC)</option>
                      <option value="AC">Air Conditioned (AC)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Seating Capacity <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="e.g. 40"
                      value={form.capacity !== undefined && form.capacity !== null ? form.capacity : ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*$/.test(val)) {
                          setForm({ ...form, capacity: val === '' ? undefined : Number(val) });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={form.status || 'Active'}
                      onChange={e => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Chassis Number</label>
                    <input
                      type="text"
                      placeholder="e.g. CH-88219-Z3"
                      value={form.chassisNumber || ''}
                      onChange={e => setForm({ ...form, chassisNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Engine Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ENG-44102-M"
                      value={form.engineNumber || ''}
                      onChange={e => setForm({ ...form, engineNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">GPS Device ID</label>
                    <input
                      type="text"
                      placeholder="e.g. GPS-DEV-9003"
                      value={form.gpsDeviceId || ''}
                      onChange={e => setForm({ ...form, gpsDeviceId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-sky-600 dark:text-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Insurance Expiry</label>
                    <input
                      type="date"
                      value={form.insuranceExpiry?.split('T')[0] || ''}
                      onChange={e => setForm({ ...form, insuranceExpiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pollution (PUC) Expiry</label>
                    <input
                      type="date"
                      value={form.pollutionExpiry?.split('T')[0] || ''}
                      onChange={e => setForm({ ...form, pollutionExpiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fitness Expiry</label>
                    <input
                      type="date"
                      value={form.fitnessExpiry?.split('T')[0] || ''}
                      onChange={e => setForm({ ...form, fitnessExpiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE DOCUMENTS MODAL */}
      {docModalVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" /> Vehicle Documents: {docModalVehicle.vehicleNumber} ({docModalVehicle.registrationNumber})
                </h3>
                <p className="text-[11px] text-slate-400">RC, Insurance, Fitness, PUC, Permit, Tax Certificates with expiry reminders</p>
              </div>
              <button onClick={() => setDocModalVehicle(null)} className="text-slate-400">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-thin">
              {/* Upload New Document Form */}
              <form onSubmit={handleAddDocument} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Add / Renew Vehicle Certificate</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Document Category <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <select
                      value={docForm.docType}
                      onChange={e => setDocForm({ ...docForm, docType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                    >
                      <option value="RC">Registration Certificate (RC)</option>
                      <option value="Insurance">Insurance Policy</option>
                      <option value="Fitness">Fitness Certificate</option>
                      <option value="Pollution (PUC)">Pollution (PUC)</option>
                      <option value="Permit">State Permit</option>
                      <option value="Tax Certificate">Tax Certificate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Document Number <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INS-99001-B"
                      value={docForm.docNumber}
                      onChange={e => setDocForm({ ...docForm, docNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={docForm.issueDate}
                      onChange={e => setDocForm({ ...docForm, issueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Expiry Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                    <input
                      type="date"
                      required
                      value={docForm.expiryDate}
                      onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Supporting Document PDF Uploaded</span>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-md">
                    <Plus className="w-3.5 h-3.5" /> Save Document
                  </button>
                </div>
              </form>

              {/* List of Documents */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Maintained Vehicle Documents</h4>
                <div className="space-y-2">
                  {vehicleDocs.filter(d => d.vehicleId === docModalVehicle.id).map(doc => {
                    const status = checkDocExpiryStatus(doc.expiryDate);
                    return (
                      <div key={doc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{doc.docType}</span>
                            <span className="font-mono text-[11px] text-slate-500">({doc.docNumber})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Issue: {doc.issueDate} • Expiry: <strong className={status.isExpiringSoon || status.isExpired ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>{doc.expiryDate}</strong>
                          </p>
                        </div>

                        <div className="text-right space-y-1">
                          {status.isExpired ? (
                            <Badge variant="danger" size="sm">EXPIRED</Badge>
                          ) : status.isExpiringSoon ? (
                            <Badge variant="warning" size="sm">Expiring in {status.daysLeft}d</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Valid & Active</Badge>
                          )}
                          <p className="text-[10px] text-sky-600 font-bold flex items-center justify-end gap-1"><FileText className="w-3 h-3" /> {doc.attachmentName || 'Attachment.pdf'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={() => setDocModalVehicle(null)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingVehicle}
        onCancel={() => setDeletingVehicle(null)}
        onConfirm={() => {
          if (deletingVehicle) {
            deleteVehicleMaster(deletingVehicle.id);
            addToast('info', 'Vehicle Deleted');
            setDeletingVehicle(null);
          }
        }}
        title="Delete Vehicle Master"
        message={`Are you sure you want to delete ${deletingVehicle?.vehicleNumber}?`}
      />
    </div>
  );
};
