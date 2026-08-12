import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Phone, ShieldCheck, Award, FileText, AlertCircle, Mail, Bus } from 'lucide-react';
import { DriverMaster } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export interface DriverDocumentItem {
  id: string;
  driverId: string;
  docType: 'Driving License' | 'Medical Certificate' | 'Police Verification' | 'Badge Certificate';
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  badgeNumber?: string;
  attachmentName?: string;
}

const initialDriverDocs: DriverDocumentItem[] = [
  { id: 'dd-1', driverId: 'dm-01', docType: 'Driving License', docNumber: 'DL-NY-2022-77112', issueDate: '2022-10-31', expiryDate: '2029-10-31', badgeNumber: 'BDG-9901', attachmentName: 'Commercial_Driving_License.pdf' },
  { id: 'dd-2', driverId: 'dm-01', docType: 'Medical Certificate', docNumber: 'MED-2025-004', issueDate: '2025-05-01', expiryDate: '2026-08-30', attachmentName: 'Medical_Fitness_Report.pdf' },
  { id: 'dd-3', driverId: 'dm-01', docType: 'Police Verification', docNumber: 'POL-VER-8821', issueDate: '2025-01-10', expiryDate: '2027-01-10', attachmentName: 'Police_Clearance_Certificate.pdf' }
];

export const DriverMasterView: React.FC = () => {
  const { staff, driverMasters, vehicleAssignments, addDriverMaster, updateDriverMaster, deleteDriverMaster } = useData();
  const { addToast } = useToast();

  const nonTeachingStaff = React.useMemo(() => {
    return (staff || []).filter(s => 
      s.employeeCategory === 'Staff' ||
      s.department?.toLowerCase().includes('transport') ||
      s.department?.toLowerCase().includes('operation') ||
      s.department?.toLowerCase().includes('maintenance') ||
      s.department?.toLowerCase().includes('security') ||
      s.department?.toLowerCase().includes('admin') ||
      s.designation?.toLowerCase().includes('driver') ||
      s.designation?.toLowerCase().includes('attendant') ||
      s.designation?.toLowerCase().includes('staff')
    );
  }, [staff]);

  const [query, setQuery] = useState('');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState(() => sessionStorage.getItem('tm_driver_filter') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverMaster | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<DriverMaster | null>(null);

  const handleDriverFilterChange = (val: string) => {
    setSelectedDriverFilter(val);
    sessionStorage.setItem('tm_driver_filter', val);
  };

  // Driver Documents Modal State
  const [driverDocs, setDriverDocs] = useState<DriverDocumentItem[]>(initialDriverDocs);
  const [docModalDriver, setDocModalDriver] = useState<DriverMaster | null>(null);
  const [docForm, setDocForm] = useState<Partial<DriverDocumentItem>>({
    docType: 'Medical Certificate',
    docNumber: '',
    issueDate: '2026-01-01',
    expiryDate: '2027-01-01',
    badgeNumber: '',
    attachmentName: ''
  });

  const [form, setForm] = useState<Partial<DriverMaster>>({
    employeeId: '',
    driverName: '',
    mobileNumber: '',
    email: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    address: '',
    status: 'Active'
  });

  const filteredDrivers = driverMasters.filter(d => {
    const matchesQuery = d.driverName.toLowerCase().includes(query.toLowerCase()) ||
                         d.mobileNumber.toLowerCase().includes(query.toLowerCase()) ||
                         d.licenseNumber.toLowerCase().includes(query.toLowerCase()) ||
                         (d.employeeId && d.employeeId.toLowerCase().includes(query.toLowerCase()));
    const matchesDriver = selectedDriverFilter === 'ALL' || d.id === selectedDriverFilter;
    return matchesQuery && matchesDriver;
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setForm({
      employeeId: '',
      driverName: '',
      mobileNumber: '',
      email: '',
      licenseNumber: '',
      licenseExpiryDate: '',
      address: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DriverMaster) => {
    setEditingDriver(d);
    setForm(d);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.driverName || !form.mobileNumber || !form.licenseNumber) return;

    if (editingDriver) {
      updateDriverMaster(editingDriver.id, form);
      addToast('success', 'Driver Details Updated', `Updated ${form.driverName}`);
    } else {
      addDriverMaster(form as Omit<DriverMaster, 'id'>);
      addToast('success', 'Driver Registered', `Added ${form.driverName}`);
    }
    setIsModalOpen(false);
  };

  // Driver Documents Management Handlers
  const handleOpenDriverDocs = (d: DriverMaster) => {
    setDocModalDriver(d);
    setDocForm({
      docType: 'Medical Certificate',
      docNumber: `MED-VER-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      badgeNumber: 'BDG-1004',
      attachmentName: ''
    });
  };

  const handleAddDriverDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModalDriver || !docForm.docNumber) return;

    const newDoc: DriverDocumentItem = {
      id: 'dd-' + Date.now(),
      driverId: docModalDriver.id,
      docType: (docForm.docType || 'Medical Certificate') as any,
      docNumber: docForm.docNumber || '',
      issueDate: docForm.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: docForm.expiryDate || '2027-01-01',
      badgeNumber: docForm.badgeNumber || '',
      attachmentName: docForm.attachmentName || `${docForm.docType}_${docModalDriver.driverName.replace(/\s+/g, '_')}.pdf`
    };

    setDriverDocs(prev => [newDoc, ...prev]);
    addToast('success', 'Driver Document Uploaded', `Added ${newDoc.docType} for ${docModalDriver.driverName}`);
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

  const resolveCurrentAssignment = (driver: DriverMaster) =>
    vehicleAssignments.find(assignment => assignment.driverId === driver.id && assignment.status === 'Active') ||
    vehicleAssignments.find(assignment => assignment.driverName === driver.driverName && assignment.status === 'Active');

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" /> Drivers
          </h2>
          </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
          <ExportButton 
            data={filteredDrivers} 
            filename={selectedDriverFilter && selectedDriverFilter !== 'ALL' 
              ? `driver_${driverMasters.find(d => d.id === selectedDriverFilter)?.driverName.replace(/\s+/g, '_') || 'filtered'}` 
              : 'driver_masters'} 
          />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search driver name, phone, or license..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Driver:</label>
          <select
            value={selectedDriverFilter}
            onChange={e => handleDriverFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Driver --</option>
            <option value="ALL">All Drivers</option>
            {driverMasters.map(d => (
              <option key={d.id} value={d.id}>
                {d.driverName} ({d.employeeId || `DRV-${d.id}`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDriverFilter === '' ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Please Select a Driver</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a driver from the dropdown above or click below to view all drivers.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleDriverFilterChange('ALL')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Drivers
            </button>
          </div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">No drivers found matching your filter or search query.</p>
          <button
            onClick={() => { handleDriverFilterChange('ALL'); setQuery(''); }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Driver Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map(d => {
          const currentAssignment = resolveCurrentAssignment(d);
          const dDocs = driverDocs.filter(doc => doc.driverId === d.id);
          const licStatus = checkDocExpiryStatus(d.licenseExpiryDate);

          return (
            <div key={d.id} className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{d.driverName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-sky-500" /> {d.licenseNumber}</p>
                  </div>
                  <Badge variant={d.status === 'Active' ? 'success' : d.status === 'On Leave' ? 'warning' : 'neutral'}>{d.status}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Employee ID:</span><span className="font-mono font-bold text-sky-600 dark:text-sky-400">{d.employeeId || `DRV-${d.id}`}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Mobile Number:</span><span className="font-bold text-slate-900 dark:text-white flex items-center gap-1"><Phone className="w-3 h-3 text-sky-500" /> {d.mobileNumber}</span></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-sky-500" /> {d.email || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">Address:</span><span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[12rem]">{d.address || 'Not provided'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">License Expiry:</span><span className={`font-semibold ${licStatus.isExpiringSoon ? 'text-amber-600 font-bold' : ''}`}>{d.licenseExpiryDate}</span></div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                      <Bus className="w-3 h-3 text-emerald-500" /> Current Assignment
                    </span>
                    {currentAssignment ? (
                      <>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Bus:</span><span className="font-bold text-slate-900 dark:text-white">{currentAssignment.vehicleNumber}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Route:</span><span className="font-semibold text-sky-600 text-right">{currentAssignment.routeName}</span></div>
                        <div className="flex justify-between gap-3"><span className="text-slate-400">Status:</span><span className="font-bold text-emerald-600">{currentAssignment.status}</span></div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500">No active assignment</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenDriverDocs(d)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-500 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> Driver Documents ({dDocs.length > 0 ? dDocs.length : 3})
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingDriver(d)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Import from Non-Teaching Staff (Optional)
                </label>
                <select
                  onChange={e => {
                    const selected = nonTeachingStaff.find(s => s.id === e.target.value);
                    if (selected) {
                      setForm(prev => ({
                        ...prev,
                        driverName: `${selected.firstName} ${selected.lastName}`.trim(),
                        mobileNumber: selected.phone || prev.mobileNumber,
                        email: selected.email || prev.email,
                        address: selected.address || selected.presentAddress || prev.address
                      }));
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="">-- Choose Non-Teaching Staff Member --</option>
                  {nonTeachingStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.empId} • {s.designation} • {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Driver Full Name *</label>
                  <input type="text" required value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Employee ID *</label>
                  <input type="text" placeholder="e.g. EMP-DRV-101" value={form.employeeId || ''} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Mobile Number *</label><input type="text" required value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Commercial License No *</label><input type="text" required value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" /></div>
                <div><label className="block font-semibold mb-1">License Expiry Date</label><input type="date" value={form.licenseExpiryDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, licenseExpiryDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER DOCUMENTS MODAL */}
      {docModalDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" /> Driver Verification Documents: {docModalDriver.driverName}
                </h3>
                <p className="text-[11px] text-slate-400">License, Medical Certificate, Police Verification, and Badge Number</p>
              </div>
              <button onClick={() => setDocModalDriver(null)} className="text-slate-400">✕</button>
            </div>

            {/* Upload New Document Form */}
            <form onSubmit={handleAddDriverDoc} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Upload Driver Verification Document</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Document Category *</label>
                  <select
                    value={docForm.docType}
                    onChange={e => setDocForm({ ...docForm, docType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                  >
                    <option value="Driving License">Driving License</option>
                    <option value="Medical Certificate">Medical Certificate</option>
                    <option value="Police Verification">Police Verification</option>
                    <option value="Badge Certificate">Badge Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Document / Certificate No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-88190"
                    value={docForm.docNumber}
                    onChange={e => setDocForm({ ...docForm, docNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block font-semibold mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={docForm.expiryDate}
                    onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Badge Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BDG-9901"
                    value={docForm.badgeNumber}
                    onChange={e => setDocForm({ ...docForm, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-md">
                  <Plus className="w-3.5 h-3.5" /> Save Verification Document
                </button>
              </div>
            </form>

            {/* List of Documents */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Verified Driver Documents</h4>
              <div className="space-y-2">
                {driverDocs.filter(d => d.driverId === docModalDriver.id).map(doc => {
                  const status = checkDocExpiryStatus(doc.expiryDate);
                  return (
                    <div key={doc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{doc.docType}</span>
                          <span className="font-mono text-[11px] text-slate-500">({doc.docNumber})</span>
                          {doc.badgeNumber && <span className="font-mono font-bold text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded">Badge: {doc.badgeNumber}</span>}
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
                          <Badge variant="success" size="sm">Verified</Badge>
                        )}
                        <p className="text-[10px] text-sky-600 font-bold flex items-center justify-end gap-1"><FileText className="w-3 h-3" /> {doc.attachmentName || 'Document.pdf'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setDocModalDriver(null)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingDriver}
        onCancel={() => setDeletingDriver(null)}
        onConfirm={() => {
          if (deletingDriver) {
            deleteDriverMaster(deletingDriver.id);
            addToast('info', 'Driver Deleted');
            setDeletingDriver(null);
          }
        }}
        title="Delete Driver Profile"
        message={`Are you sure you want to delete ${deletingDriver?.driverName}?`}
      />
    </div>
  );
};
