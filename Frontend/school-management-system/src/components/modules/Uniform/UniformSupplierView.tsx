import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformSupplier } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';

export const UniformSupplierView: React.FC = () => {
  const { uniformSuppliers, addUniformSupplier, updateUniformSupplier, deleteUniformSupplier } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<UniformSupplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<UniformSupplier | null>(null);

  const [form, setForm] = useState<Partial<UniformSupplier>>({
    supplierName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    gstNumber: '',
    address: '',
    status: 'Active'
  });

  const filtered = uniformSuppliers.filter(s =>
    s.supplierName.toLowerCase().includes(query.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
    (s.gstNumber && s.gstNumber.toLowerCase().includes(query.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setForm({ supplierName: '', contactPerson: '', mobile: '', email: '', gstNumber: '', address: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: UniformSupplier) => {
    setEditingSupplier(s);
    setForm(s);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.contactPerson || !form.mobile) return;

    if (editingSupplier) {
      updateUniformSupplier(editingSupplier.id, form);
      addToast('success', 'Supplier Updated', `Updated supplier ${form.supplierName}`);
    } else {
      addUniformSupplier(form as Omit<UniformSupplier, 'id'>);
      addToast('success', 'Supplier Added', `Added supplier ${form.supplierName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uniform Suppliers</h3>
          <p className="text-xs text-slate-500">Configure corporate suppliers, contact information, GSTIN codes, and order coordinates</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, representative, GST number..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Contact Representative</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 font-mono">GST Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No active suppliers found. Click "Add Supplier".</td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.supplierName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{s.contactPerson}</td>
                    <td className="py-3 px-4 font-mono">{s.mobile}</td>
                    <td className="py-3 px-4">{s.email || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">{s.gstNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'Active' ? 'success' : 'neutral'}>{s.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingSupplier(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save Supplier Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.supplierName}
                  onChange={e => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Representative *</label>
                  <input
                    type="text"
                    required
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={form.gstNumber || ''}
                    onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Supplier Status *</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Warehouse Address</label>
                  <input
                    type="text"
                    value={form.address || ''}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSupplier}
        title="Remove Supplier Partner"
        message={`Are you sure you want to delete supplier ${deletingSupplier?.supplierName}?`}
        onConfirm={() => {
          if (deletingSupplier) {
            deleteUniformSupplier(deletingSupplier.id);
            addToast('success', 'Supplier deleted');
            setDeletingSupplier(null);
          }
        }}
        onCancel={() => setDeletingSupplier(null)}
      />
    </div>
  );
};
export default UniformSupplierView;
