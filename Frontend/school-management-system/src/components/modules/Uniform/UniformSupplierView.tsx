import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users, Building2, X, Filter } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { UniformSupplier } from '../../../types';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';

export const UniformSupplierView: React.FC<{tabs?: React.ReactNode}> = ({ tabs }) => {
  const { uniformSuppliers = [], addUniformSupplier, updateUniformSupplier, deleteUniformSupplier } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const isFiltered = Boolean(query.trim() || filterStatus !== '');

  const filtered = !isFiltered ? [] : (uniformSuppliers || []).filter(s => {
    if (!s) return false;
    const name = (s.supplierName || (s as any).companyName || '').toLowerCase();
    const contact = (s.contactPerson || (s as any).contactRepresentative || '').toLowerCase();
    const gst = (s.gstNumber || (s as any).gstRegistrationNo || '').toLowerCase();
    const q = (query || '').toLowerCase();
    const matchQuery = !q || name.includes(q) || contact.includes(q) || gst.includes(q);
    const matchStatus = !filterStatus || filterStatus === 'All' || s.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setForm({ supplierName: '', contactPerson: '', mobile: '', email: '', gstNumber: '', address: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: UniformSupplier) => {
    setEditingSupplier(s);
    setForm({
      ...s,
      supplierName: s.supplierName || (s as any).companyName || '',
      contactPerson: s.contactPerson || (s as any).contactRepresentative || '',
      mobile: s.mobile || s.phone || (s as any).mobileNumber || '',
      email: s.email || (s as any).emailAddress || '',
      gstNumber: s.gstNumber || (s as any).gstRegistrationNo || '',
      address: s.address || (s as any).warehouseAddress || '',
      status: s.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const sName = form.supplierName?.trim() || (form as any).companyName?.trim();
    if (!sName || !form.contactPerson || !form.mobile) return;

    const payload = {
      ...form,
      supplierName: sName,
      companyName: sName,
      mobile: form.mobile,
      phone: form.mobile,
      status: form.status || 'Active'
    };

    if (editingSupplier) {
      updateUniformSupplier(editingSupplier.id, payload);
      addToast('success', 'Supplier Updated', `Updated supplier ${sName}`);
    } else {
      addUniformSupplier(payload as Omit<UniformSupplier, 'id'>);
      addToast('success', 'Supplier Added', `Added supplier ${sName}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Corporate Suppliers
          </h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {tabs}

      <div className="glass-card p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search suppliers by name, GST..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filters:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">Select Status</option>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
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
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {!isFiltered ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-6 h-6 text-sky-500/50" />
                      <span>Select a status filter or type in the search bar to display suppliers.</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No suppliers found matching the selected filter.</td>
                </tr>
              ) : (
                paginated.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.supplierName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{s.contactPerson}</td>
                    <td className="py-3 px-4 font-mono">{s.mobile}</td>
                    <td className="py-3 px-4">{s.email || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-sky-600 dark:text-sky-400">{s.gstNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'Active' ? 'success' : 'neutral'}>{s.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeletingSupplier(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        itemsPerPageOptions={[10, 25, 50, 100]}
        label="suppliers"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save Supplier Master</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Supplier / Company Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Uniform Mills Ltd"
                  value={form.supplierName}
                  onChange={e => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Person <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile"
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="supplier@company.com"
                    value={form.email || ''}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">GST Registration No</label>
                  <input
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    value={form.gstNumber || ''}
                    onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Supplier Status <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="">Select Status *</option>
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
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all">Save Details</button>
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
