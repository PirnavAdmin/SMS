import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Search, Phone, User, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { HostelMaster } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const HostelMasterView: React.FC = () => {
  const { hostelMasters, addHostelMaster, updateHostelMaster, deleteHostelMaster, roomMasters, roomTypeMasters, studentHostelAssignments } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<HostelMaster | null>(null);
  const [deletingHostel, setDeletingHostel] = useState<HostelMaster | null>(null);

  const [form, setForm] = useState<Partial<HostelMaster>>({
    hostelName: '',
    hostelCode: '',
    hostelType: 'Boys',
    wardenName: '',
    wardenMobile: '',
    wardenAlternateMobile: '',
    wardenEmail: '',
    address: '',
    description: '',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingHostel(null);
    setForm({
      hostelName: '',
      hostelCode: 'HST-' + Math.floor(100 + Math.random() * 900),
      hostelType: 'Boys',
      wardenName: '',
      wardenMobile: '',
      wardenAlternateMobile: '',
      wardenEmail: '',
      address: '',
      description: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: HostelMaster) => {
    setEditingHostel(h);
    setForm({
      ...h,
      wardenAlternateMobile: h.wardenAlternateMobile || '',
      wardenEmail: h.wardenEmail || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hostelName || !form.hostelCode) {
      addToast('error', 'Validation Error', 'Please enter hostel name and code');
      return;
    }

    if (form.wardenAlternateMobile) {
      if (!/^\d{1,10}$/.test(form.wardenAlternateMobile)) {
        addToast('error', 'Validation Error', 'Alternate mobile must be numeric and maximum 10 digits');
        return;
      }
      if (form.wardenAlternateMobile === form.wardenMobile) {
        addToast('error', 'Validation Error', 'Alternate mobile number cannot be the same as primary mobile number');
        return;
      }
    }

    if (editingHostel) {
      updateHostelMaster(editingHostel.id, form);
      addToast('success', 'Hostel Updated', `${form.hostelName} updated successfully`);
    } else {
      addHostelMaster(form as Omit<HostelMaster, 'id'>);
      addToast('success', 'Hostel Created', `${form.hostelName} created successfully`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingHostel) {
      deleteHostelMaster(deletingHostel.id);
      addToast('success', 'Hostel Deleted');
      setDeletingHostel(null);
    }
  };

  const toggleStatus = (h: HostelMaster) => {
    const newStatus = h.status === 'Active' ? 'Inactive' : 'Active';
    updateHostelMaster(h.id, { status: newStatus });
    addToast('info', 'Status Updated', `Hostel is now ${newStatus}`);
  };

  const filteredHostels = hostelMasters.filter(h => {
    const matchQuery = h.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       h.hostelCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       h.wardenName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'All' || h.hostelType === filterType;
    return matchQuery && matchType;
  });

  const handleExportCSV = () => {
    const headers = 'ID,Code,Name,Type,Warden,Mobile,Status\n';
    const rows = filteredHostels.map(h => `"${h.id}","${h.hostelCode}","${h.hostelName}","${h.hostelType}","${h.wardenName}","${h.wardenMobile}","${h.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostels_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Hostel Master Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure residential hostel blocks, warden contacts, gender segregation, and capacity</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Hostel Block
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search hostel name, code, warden..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none"
        >
          <option value="All">All Hostel Types</option>
          <option value="Boys">Boys Hostel</option>
          <option value="Girls">Girls Hostel</option>
          <option value="Mixed">Mixed Hostel</option>
        </select>
      </div>

      {/* Grid Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHostels.map(h => {
          const rooms = roomMasters.filter(r => r.hostelId === h.id);
          const totalCap = rooms.reduce((acc, r) => {
            const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
            return acc + (rtObj ? rtObj.capacity : (r.capacity || 2));
          }, 0);
          const occupiedCount = studentHostelAssignments.filter(a => a.hostelId === h.id && a.status === 'Active').length;

          return (
            <div key={h.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 hover:border-indigo-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    h.hostelType === 'Boys' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                    h.hostelType === 'Girls' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-purple-50 text-purple-600 border-purple-200'
                  }`}>
                    {h.hostelType} Hostel
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">{h.hostelName}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{h.hostelCode}</p>
                </div>

                <button
                  onClick={() => toggleStatus(h)}
                  className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] flex items-center gap-1 transition-all ${
                    h.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {h.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {h.status}
                </button>
              </div>

              {/* Warden Details */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-500" /> Warden:</span>
                  <span>{h.wardenName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> Mobile:</span>
                  <span>{h.wardenMobile || 'N/A'}</span>
                </div>
              </div>

              {/* Capacity Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold">Rooms</p>
                  <p className="font-black text-slate-900 dark:text-white">{rooms.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Occupied</p>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">{occupiedCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Capacity</p>
                  <p className="font-black text-indigo-700 dark:text-indigo-300">{totalCap}</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 truncate max-w-[180px]">{h.address || 'Campus Location'}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(h)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingHostel(h)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              {editingHostel ? 'Edit Hostel Master' : 'Add New Hostel Master'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Boys Central Block A"
                    value={form.hostelName}
                    onChange={e => setForm({ ...form, hostelName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="HST-BOYS-A"
                    value={form.hostelCode}
                    onChange={e => setForm({ ...form, hostelCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Type *</label>
                  <select
                    value={form.hostelType}
                    onChange={e => setForm({ ...form, hostelType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Boys">Boys Hostel</option>
                    <option value="Girls">Girls Hostel</option>
                    <option value="Mixed">Mixed Hostel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Warden Name</label>
                <input
                  type="text"
                  placeholder="Arthur Pendelton"
                  value={form.wardenName}
                  onChange={e => setForm({ ...form, wardenName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Primary Mobile Number</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={form.wardenMobile}
                    onChange={e => setForm({ ...form, wardenMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Alternate Mobile Number</label>
                  <input
                    type="text"
                    placeholder="9876543219"
                    value={form.wardenAlternateMobile}
                    onChange={e => setForm({ ...form, wardenAlternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    placeholder="arthur.p@school.edu"
                    value={form.wardenEmail}
                    onChange={e => setForm({ ...form, wardenEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
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

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Address</label>
                <input
                  type="text"
                  placeholder="Campus North Wing, Gate 3"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20">
                  Save Hostel Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingHostel && (
        <ConfirmModal
          isOpen={true}
          title="Delete Hostel Master"
          message={`Are you sure you want to delete ${deletingHostel.hostelName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingHostel(null)}
        />
      )}
    </div>
  );
};
