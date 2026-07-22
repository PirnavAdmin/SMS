import React, { useState } from 'react';
import { DollarSign, Edit, Search, Save } from 'lucide-react';
import { PickupPoint } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';

export const TransportFeeConfigView: React.FC = () => {
  const { pickupPoints, updatePickupPoint, routeMasters } = useData();
  const { addToast } = useToast();

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
            <DollarSign className="w-6 h-6 text-sky-500" /> Pickup-Point Transport Fee Configuration
          </h2>
          <p className="text-xs text-slate-500">Configure pickup-point driven monthly, quarterly, half-yearly & annual transport fee matrix</p>
        </div>

        <ExportButton data={pickupPoints} filename="transport_fee_matrix" />
      </div>

      {/* Filter */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
        >
          <option value="All">All Transit Routes</option>
          {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
        </select>
      </div>

      {/* Fee Matrix Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Route Name</th>
                <th className="py-3.5 px-4">Pickup Point</th>
                <th className="py-3.5 px-4">Monthly Fee</th>
                <th className="py-3.5 px-4">Quarterly Fee</th>
                <th className="py-3.5 px-4">Half-Yearly Fee</th>
                <th className="py-3.5 px-4">Annual Fee</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredPoints.map(p => {
                const isEditing = editingPointId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.routeName}</td>
                    <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{p.pickupName}</td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input type="number" value={editForm.monthlyFee} onChange={e => setEditForm({ ...editForm, monthlyFee: Number(e.target.value) })} className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold" />
                      ) : (
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">INR {(p.monthlyFee || 0).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input type="number" value={editForm.quarterlyFee} onChange={e => setEditForm({ ...editForm, quarterlyFee: Number(e.target.value) })} className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold" />
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-slate-200">INR {(p.quarterlyFee || 0).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input type="number" value={editForm.halfYearlyFee} onChange={e => setEditForm({ ...editForm, halfYearlyFee: Number(e.target.value) })} className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold" />
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-slate-200">INR {(p.halfYearlyFee || 0).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input type="number" value={editForm.annualFee} onChange={e => setEditForm({ ...editForm, annualFee: Number(e.target.value) })} className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border font-bold" />
                      ) : (
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">INR {(p.annualFee || 0).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <button onClick={() => handleSave(p.id)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 ml-auto">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      ) : (
                        <button onClick={() => handleStartEdit(p)} className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 flex items-center gap-1 ml-auto">
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
