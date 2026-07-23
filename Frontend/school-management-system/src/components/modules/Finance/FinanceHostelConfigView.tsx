import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Home, Plus, Edit, Trash2, Search, Building2, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { FinanceHostelConfig } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const FinanceHostelConfigView: React.FC = () => {
  const {
    hostelMasters, roomTypeMasters, roomMasters, financeHostelConfigs,
    addFinanceHostelConfig, updateFinanceHostelConfig, deleteFinanceHostelConfig
  } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FinanceHostelConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<FinanceHostelConfig | null>(null);

  const [form, setForm] = useState<Partial<FinanceHostelConfig>>({
    hostelId: hostelMasters[0]?.id || '',
    hostelName: hostelMasters[0]?.hostelName || '',
    roomTypeId: roomTypeMasters[0]?.id || '',
    roomTypeName: roomTypeMasters[0]?.roomTypeName || '',
    roomId: '',
    roomNo: 'All Rooms',
    feePlan: 'Annual',
    hostelFee: 40000,
    securityDeposit: 5000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingConfig(null);
    setForm({
      hostelId: hostelMasters[0]?.id || '',
      hostelName: hostelMasters[0]?.hostelName || '',
      roomTypeId: roomTypeMasters[0]?.id || '',
      roomTypeName: roomTypeMasters[0]?.roomTypeName || '',
      roomId: '',
      roomNo: 'All Rooms',
      feePlan: 'Annual',
      hostelFee: 40000,
      securityDeposit: 5000,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: FinanceHostelConfig) => {
    setEditingConfig(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.hostelId || !form.hostelFee) {
      addToast('error', 'Validation Error', 'Please select a hostel and enter a valid hostel fee');
      return;
    }

    const hObj = hostelMasters.find(h => h.id === form.hostelId);
    const rtObj = roomTypeMasters.find(rt => rt.id === form.roomTypeId);
    const rmObj = roomMasters.find(rm => rm.id === form.roomId);

    const configData = {
      ...form,
      hostelName: hObj?.hostelName || form.hostelName || 'Hostel Block',
      roomTypeName: rtObj?.roomTypeName || form.roomTypeName || 'Standard Room',
      roomNo: rmObj ? rmObj.roomNumber : 'All Rooms'
    };

    if (editingConfig) {
      updateFinanceHostelConfig(editingConfig.id, configData);
      addToast('success', 'Configuration Updated', 'Hostel fee configuration saved');
    } else {
      addFinanceHostelConfig(configData as Omit<FinanceHostelConfig, 'id'>);
      addToast('success', 'Configuration Created', 'New hostel fee configuration added');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingConfig) {
      deleteFinanceHostelConfig(deletingConfig.id);
      addToast('success', 'Configuration Deleted');
      setDeletingConfig(null);
    }
  };

  const filteredConfigs = financeHostelConfigs.filter(c => {
    const matchQuery = c.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.roomTypeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHostel = filterHostel === 'All' || c.hostelId === filterHostel;
    return matchQuery && matchHostel;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-sky-500" /> Finance → Hostel Fee Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master pricing repository for Hostel Rent and One-Time Security Deposits</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Hostel Pricing Rule
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Hostel Name or Room Type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterHostel}
          onChange={e => setFilterHostel(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none"
        >
          <option value="All">All Hostels ({hostelMasters.length})</option>
          {hostelMasters.map(h => <option key={h.id} value={h.id}>{h.hostelName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Hostel Block</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Fee Plan</th>
                <th className="py-3 px-4 text-right">Hostel Rent</th>
                <th className="py-3 px-4 text-right">Deposit</th>
                <th className="py-3 px-4 text-right">Total Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No hostel fee configurations found. Click "Add Hostel Pricing Rule" to configure pricing.</td>
                </tr>
              ) : (
                filteredConfigs.map(c => {
                  const total = (c.hostelFee || 0) + (c.securityDeposit || 0);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500 shrink-0" /> {c.hostelName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{c.roomTypeName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[10px]">
                          {c.feePlan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(c.hostelFee || 0)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400">{formatCurrency(c.securityDeposit || 0)}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(total)}</td>
                      <td className="py-3 px-4">
                        {c.status === 'Active' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingConfig(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-sky-500" />
              {editingConfig ? 'Edit Hostel Pricing Configuration' : 'Add Hostel Pricing Configuration'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Block *</label>
                <select
                  required
                  value={form.hostelId}
                  onChange={e => {
                    const hObj = hostelMasters.find(h => h.id === e.target.value);
                    setForm({ ...form, hostelId: e.target.value, hostelName: hObj?.hostelName || '' });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  {hostelMasters.map(h => (
                    <option key={h.id} value={h.id}>{h.hostelName} ({h.hostelType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Room Type *</label>
                  <select
                    value={form.roomTypeId}
                    onChange={e => {
                      const rtObj = roomTypeMasters.find(rt => rt.id === e.target.value);
                      setForm({ ...form, roomTypeId: e.target.value, roomTypeName: rtObj?.roomTypeName || '' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    {roomTypeMasters.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.roomTypeName} (Capacity: {rt.capacity})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fee Frequency *</label>
                  <select
                    value={form.feePlan}
                    onChange={e => setForm({ ...form, feePlan: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Rent Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.hostelFee}
                    onChange={e => setForm({ ...form, hostelFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-extrabold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Security Deposit</label>
                  <input
                    type="number"
                    min={0}
                    value={form.securityDeposit}
                    onChange={e => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Effective Date</label>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={e => setForm({ ...form, effectiveFrom: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingConfig && (
        <ConfirmModal
          isOpen={true}
          title="Delete Hostel Pricing Rule"
          message={`Are you sure you want to delete the pricing rule for ${deletingConfig.hostelName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingConfig(null)}
        />
      )}
    </div>
  );
};
