import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Wrench, Plus, Search, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { VehicleMaintenance } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const VehicleMaintenanceView: React.FC = () => {
  const { vehicleMaintenances, vehicleMasters, addVehicleMaintenance, deleteVehicleMaintenance } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingMaint, setDeletingMaint] = useState<VehicleMaintenance | null>(null);

  const [vehicleId, setVehicleId] = useState(vehicleMasters[0]?.id || '');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('Full Engine Service & Brake Pad Replacement');
  const [vendor, setVendor] = useState('Metro Auto Care Center');
  const [cost, setCost] = useState(5000);
  const [nextServiceDue, setNextServiceDue] = useState('2026-10-15');
  const [remarks, setRemarks] = useState('Engine oil replaced, air filters cleaned');
  const [status, setStatus] = useState<VehicleMaintenance['status']>('Completed');

  const filteredMaintenances = vehicleMaintenances.filter(m =>
    m.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
    m.serviceType.toLowerCase().includes(query.toLowerCase()) ||
    m.vendor.toLowerCase().includes(query.toLowerCase())
  );

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const veh = vehicleMasters.find(v => v.id === vehicleId);
    if (!veh) return;

    addVehicleMaintenance({
      vehicleId: veh.id,
      vehicleNumber: veh.vehicleNumber,
      serviceDate,
      serviceType,
      vendor,
      cost,
      nextServiceDue,
      remarks,
      status
    });

    addToast('success', 'Maintenance Logged', `Logged service for ${veh.vehicleNumber}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-500" /> Vehicle Maintenance Log & Reminders
          </h2>
          <p className="text-xs text-slate-500">Track fleet service history, vendor costs, and generate upcoming service due date reminders</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Log Service
          </button>
          <ExportButton data={vehicleMaintenances} filename="vehicle_maintenance_log" />
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vehicle, service type, or vendor..."
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
                <th className="py-3.5 px-4">Vehicle Number</th>
                <th className="py-3.5 px-4">Service Type</th>
                <th className="py-3.5 px-4">Service Date</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Cost (₹)</th>
                <th className="py-3.5 px-4">Next Service Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredMaintenances.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.vehicleNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{m.serviceType}</td>
                  <td className="py-3 px-4 text-slate-500">{m.serviceDate}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{m.vendor}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(m.cost)}</td>
                  <td className="py-3 px-4 font-bold text-rose-500">{m.nextServiceDue}</td>
                  <td className="py-3 px-4"><Badge variant={m.status === 'Completed' ? 'success' : m.status === 'Scheduled' ? 'warning' : 'danger'}>{m.status}</Badge></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setDeletingMaint(m)} className="p-1 rounded hover:bg-rose-50 text-rose-600 ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Vehicle Maintenance Service</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Fleet Vehicle *</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {vehicleMasters.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Service Type *</label>
                <input type="text" required value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Service Date</label><input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-1">Cost (₹) *</label><input type="number" required value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold mb-1">Vendor Center</label><input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" /></div>
                <div><label className="block font-semibold mb-1">Next Service Due</label><input type="date" value={nextServiceDue} onChange={e => setNextServiceDue(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-rose-500" /></div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Remarks</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">Log Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingMaint}
        onCancel={() => setDeletingMaint(null)}
        onConfirm={() => {
          if (deletingMaint) {
            deleteVehicleMaintenance(deletingMaint.id);
            addToast('info', 'Maintenance Record Removed');
            setDeletingMaint(null);
          }
        }}
        title="Remove Maintenance Record"
        message={`Delete maintenance record for ${deletingMaint?.vehicleNumber}?`}
      />
    </div>
  );
};
