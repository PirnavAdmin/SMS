import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { formatDateForDisplay } from '../../../utils/dateValidation';
import { IndianRupee, Edit, Search, Save, CalendarDays, MapPin, Route as RouteIcon, Info } from 'lucide-react';
import { PickupPoint } from '../../../types';
import { useData, matchesAcademicYear } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';

export const TransportFeeConfigView: React.FC = () => {
  const { pickupPoints, updatePickupPoint, routeMasters, academicYearFeeSchedules, financeSettings } = useData();
  const { selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const activeAY = selectedAcademicYear || financeSettings?.academicYear || '2026-2027';

  // Get active fee schedule terms and due dates
  const currentSchedule = useMemo(() => {
    return academicYearFeeSchedules.find(s => matchesAcademicYear(s.academicYear, activeAY)) || academicYearFeeSchedules[0];
  }, [academicYearFeeSchedules, activeAY]);

  const scheduleTerms = useMemo(() => {
    return (currentSchedule?.terms && currentSchedule.terms.length > 0)
      ? [...currentSchedule.terms].sort((a, b) => a.sequence - b.sequence)
      : [
          { id: 'T1', termName: 'Term 1', sequence: 1, dueDate: '2026-07-15' },
          { id: 'T2', termName: 'Term 2', sequence: 2, dueDate: '2026-10-15' },
          { id: 'T3', termName: 'Term 3', sequence: 3, dueDate: '2027-01-15' },
          { id: 'T4', termName: 'Term 4', sequence: 4, dueDate: '2027-03-15' },
        ];
  }, [currentSchedule]);

  const oneTimeDueDate = currentSchedule?.oneTimeDueDate || scheduleTerms[0]?.dueDate || '2026-06-30';

  const [query, setQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('All');
  const [editingPointId, setEditingPointId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<Partial<PickupPoint>>({});

  const filteredPoints = pickupPoints.filter(p => {
    const matchesQuery = p.pickupName.toLowerCase().includes(query.toLowerCase()) || p.routeName.toLowerCase().includes(query.toLowerCase());
    const matchesRoute = selectedRoute === 'All' || p.routeId === selectedRoute;
    return matchesQuery && matchesRoute;
  });

  const handleStartEdit = (p: PickupPoint) => {
    setEditingPointId(p.id);
    setEditForm(p);
  };

  const handleSave = (id: string) => {
    updatePickupPoint(id, editForm);
    addToast('success', 'Fee Schedule Saved', 'Updated transport fee slabs for pickup point.');
    setEditingPointId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-sky-500" /> Pickup-Point Transport Fee Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure pickup-point driven monthly, quarterly & annual transport fees synchronized with Academic Fee Schedule due dates.</p>
        </div>

        <ExportButton data={filteredPoints} filename="transport_fee_matrix" />
      </div>

      {/* Official Academic Schedule Term Due Dates Banner */}
      <div className="glass-card p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-sky-900 dark:text-sky-200">
              Official Academic Year Fee Schedule Due Dates ({activeAY})
            </h3>
            <p className="text-[11px] text-sky-700 dark:text-sky-300">
              Transport fees collected on a Term-Wise or One-Time basis adhere to these official schedule due dates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-sky-100 dark:border-sky-900/40">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">One-Time / Annual Due</span>
            <span className="text-xs font-mono font-black text-sky-600 dark:text-sky-400">
              {formatDateForDisplay(oneTimeDueDate)}
            </span>
          </div>

          {scheduleTerms.map((term, idx) => (
            <div key={term.id || idx} className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{term.termName || `Term ${idx + 1}`} Due</span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                {formatDateForDisplay(term.dueDate)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search pickup point name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={selectedRoute}
          onChange={e => setSelectedRoute(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="All">All Transit Routes ({routeMasters.length})</option>
          {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
        </select>
      </div>

      {/* Fee Matrix Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4 text-center">Route Name</th>
                <th className="py-3.5 px-4 text-center">Pickup Point</th>
                <th className="py-3.5 px-4 text-center">Distance (KM)</th>
                <th className="py-3.5 px-4 text-center">Monthly Fee</th>
                <th className="py-3.5 px-4 text-center">Quarterly / Term Fee</th>
                <th className="py-3.5 px-4 text-center">Annual / One-Time Fee</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredPoints.map(p => {
                const isEditing = editingPointId === p.id;
                const distKm = p.distanceFromSchoolKm ?? (p as any).distanceFromStart ?? 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5 justify-center">
                        <RouteIcon className="w-3.5 h-3.5 text-sky-500" />
                        <span>{p.routeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">
                      <div className="flex items-center gap-1.5 justify-center">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{p.pickupName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {distKm} KM
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.monthlyFee}
                          onChange={e => setEditForm({ ...editForm, monthlyFee: Number(e.target.value) })}
                          className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold text-center"
                        />
                      ) : (
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.monthlyFee || 0)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.quarterlyFee}
                          onChange={e => setEditForm({ ...editForm, quarterlyFee: Number(e.target.value) })}
                          className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold text-center"
                        />
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(p.quarterlyFee || 0)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.annualFee}
                          onChange={e => setEditForm({ ...editForm, annualFee: Number(e.target.value) })}
                          className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold text-center"
                        />
                      ) : (
                        <span className="font-extrabold text-sky-600 dark:text-sky-400">{formatCurrency(p.annualFee || 0)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isEditing ? (
                        <button onClick={() => handleSave(p.id)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 mx-auto">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <button onClick={() => handleStartEdit(p)} className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1 mx-auto">
                          <Edit className="w-3.5 h-3.5" /> Edit Fees
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransportFeeConfigView;
