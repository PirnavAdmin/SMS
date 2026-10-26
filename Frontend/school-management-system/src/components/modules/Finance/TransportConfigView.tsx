import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Route, Plus, Search, Edit, Trash2, Bus, AlertTriangle } from 'lucide-react';
import { TransportRoute } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const TransportConfigView: React.FC = () => {
  const { erpTransportRoutes, studentTransports = [], students = [], admissions = [], addERPTransportRoute, updateERPTransportRoute, deleteERPTransportRoute } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<TransportRoute | null>(null);

  const getAssignedStudentsForRoute = (route: TransportRoute | null) => {
    if (!route) return [];
    const routeIdStr = String(route.id || '').trim();
    const routeNameStr = (route.routeName || '').trim().toLowerCase();
    const routeCodeStr = (route.routeCode || '').trim().toLowerCase();

    const assignedMap = new Map<string, { studentId: string; studentName: string; admissionNo: string }>();

    (studentTransports || []).forEach(st => {
      const isActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
      if (!isActive) return;

      const stRouteId = String(st.routeId || '').trim();
      const stRouteName = (st.routeName || '').trim().toLowerCase();

      const matches = (routeIdStr && stRouteId && stRouteId === routeIdStr) ||
                      (routeNameStr && stRouteName && stRouteName === routeNameStr) ||
                      (routeCodeStr && stRouteName && stRouteName === routeCodeStr);

      if (matches) {
        const student = (students || []).find(s => s.id === st.studentId || s.admissionNo === st.admissionNo || s.name === st.studentName);
        const admNo = st.admissionNo || student?.admissionNo || '-';
        const sName = st.studentName || student?.name || 'Student';
        const key = admNo !== '-' ? admNo : (st.studentId || sName);
        if (key && !assignedMap.has(key)) {
          assignedMap.set(key, {
            studentId: st.studentId || student?.id || '',
            studentName: sName,
            admissionNo: admNo
          });
        }
      }
    });

    (admissions || []).forEach(a => {
      const aAny = a as any;
      if (aAny.isDeleted || a.status === 'Rejected' || a.studentType === 'Residential' || a.transportRequired === false) return;
      const aBusRoute = (aAny.busRoute || '').trim().toLowerCase();
      if (!aBusRoute) return;

      const matches = (routeNameStr && aBusRoute === routeNameStr) ||
                      (routeCodeStr && aBusRoute === routeCodeStr) ||
                      (routeIdStr && aBusRoute === routeIdStr);

      if (matches) {
        const admNo = aAny.admissionNo || a.applicationNo || String(a.id);
        const sName = a.applicantName || aAny.studentName || 'Student';
        const key = admNo || sName;
        if (key && !assignedMap.has(key)) {
          assignedMap.set(key, {
            studentId: String(a.id),
            studentName: sName,
            admissionNo: admNo
          });
        }
      }
    });

    (students || []).forEach(s => {
      const sAny = s as any;
      if (sAny.isDeleted || s.status === 'Inactive') return;
      const sRoute = (sAny.busRoute || '').trim().toLowerCase();
      const sRouteId = String(sAny.routeId || '').trim();

      const matches = (routeIdStr && sRouteId && sRouteId === routeIdStr) ||
                      (routeNameStr && sRoute && sRoute === routeNameStr) ||
                      (routeCodeStr && sRoute && sRoute === routeCodeStr);

      if (matches) {
        const admNo = s.admissionNo || '-';
        const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
        const key = admNo !== '-' ? admNo : (s.id || sName);
        if (key && !assignedMap.has(key)) {
          assignedMap.set(key, {
            studentId: s.id,
            studentName: sName,
            admissionNo: admNo
          });
        }
      }
    });

    return Array.from(assignedMap.values());
  };

  const assignedStudentsForDeletingRoute = useMemo(() => {
    return getAssignedStudentsForRoute(deletingRoute);
  }, [deletingRoute, studentTransports, admissions, students]);

  const hasAssignedStudents = assignedStudentsForDeletingRoute.length > 0;

  const [formData, setFormData] = useState<Partial<TransportRoute>>({
    routeName: '',
    routeCode: '',
    vehicleNumber: '',
    vehicleName: '',
    driverName: '',
    driverMobile: '',
    pickupPoint: '',
    dropPoint: '',
    distanceKm: 0,
    monthlyFee: 0,
    quarterlyFee: 0,
    halfYearlyFee: 0,
    annualFee: 0,
    status: 'Active'
  });

  const filteredRoutes = erpTransportRoutes.filter(r =>
    r.routeName.toLowerCase().includes(query.toLowerCase()) || r.routeCode.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setFormData({
      routeName: '',
      routeCode: '',
      vehicleNumber: '',
      vehicleName: '',
      driverName: '',
      driverMobile: '',
      pickupPoint: '',
      dropPoint: '',
      distanceKm: 0,
      monthlyFee: 0,
      quarterlyFee: 0,
      halfYearlyFee: 0,
      annualFee: 0,
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
          <ExportButton data={filteredRoutes} filename="transport_routes" />
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
                  <label className="block font-semibold mb-1">Route Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input type="text" required value={formData.routeName} onChange={e => setFormData({ ...formData, routeName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Route Code <span className="text-rose-500 font-bold ml-0.5">*</span></label>
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
        title={hasAssignedStudents ? "Warning: Students Assigned to Route" : "Delete Route"}
        subtitle={hasAssignedStudents ? `Attention Required: ${assignedStudentsForDeletingRoute.length} active student(s) assigned` : "Please review this action carefully"}
        variant={hasAssignedStudents ? "warning" : "danger"}
        confirmLabel={hasAssignedStudents ? "Proceed & Delete Route" : "Confirm Delete"}
        onConfirm={() => {
          if (deletingRoute) {
            const count = assignedStudentsForDeletingRoute.length;
            const rName = deletingRoute.routeName;
            deleteERPTransportRoute(deletingRoute.id);
            if (count > 0) {
              addToast('warning', 'Route Removed with Assigned Students', `Route "${rName}" removed. ${count} student(s) affected.`);
            } else {
              addToast('success', 'Route Removed', `Route "${rName}" removed.`);
            }
            setDeletingRoute(null);
          }
        }}
        onCancel={() => setDeletingRoute(null)}
      >
        {hasAssignedStudents ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Warning: Students are assigned to this route</span>
              </div>
              <p>
                There are <strong className="font-extrabold">{assignedStudentsForDeletingRoute.length} student(s)</strong> assigned to <strong className="font-extrabold">{deletingRoute?.routeName}</strong> ({deletingRoute?.routeCode}). Deleting this route will unassign these students.
              </p>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
              {assignedStudentsForDeletingRoute.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800 border text-xs">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">{st.admissionNo}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{st.studentName}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Are you sure you want to proceed?</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete {deletingRoute?.routeName}?
          </p>
        )}
      </ConfirmModal>
    </div>
  );
};
