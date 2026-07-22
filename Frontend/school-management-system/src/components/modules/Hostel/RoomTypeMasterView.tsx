import React, { useState } from 'react';
import { Layers, Plus, Edit, Trash2, Search, CheckCircle2, XCircle, Users, Download, ShieldAlert } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { RoomTypeMaster } from '../../../types';
import { ConfirmModal } from '../../common/ConfirmModal';

export const RoomTypeMasterView: React.FC = () => {
  const { roomTypeMasters, addRoomTypeMaster, updateRoomTypeMaster, deleteRoomTypeMaster } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRt, setEditingRt] = useState<RoomTypeMaster | null>(null);
  const [deletingRt, setDeletingRt] = useState<RoomTypeMaster | null>(null);

  const [form, setForm] = useState<Partial<RoomTypeMaster>>({
    roomTypeName: '',
    capacity: 2,
    acType: 'AC',
    description: '',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setEditingRt(null);
    setForm({
      roomTypeName: '',
      capacity: 2,
      acType: 'AC',
      description: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rt: RoomTypeMaster) => {
    setEditingRt(rt);
    setForm({
      ...rt,
      acType: rt.acType || 'AC'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Trim leading/trailing spaces
    const trimmedName = (form.roomTypeName || '').trim();

    // 2. Required check
    if (!trimmedName) {
      addToast('error', 'Validation Error', 'Room Type Specification is required.');
      return;
    }

    // 3. Min/Max length check
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      addToast('error', 'Validation Error', 'Room Type Specification must be between 3 and 50 characters.');
      return;
    }

    // 4. White-list character validation: letters, numbers, spaces, hyphens, ampersands
    const validPattern = /^[a-zA-Z0-9\s&\-]+$/;
    if (!validPattern.test(trimmedName)) {
      addToast(
        'error',
        'Validation Error',
        'Room Type Specification can only contain letters, numbers, spaces, hyphens, and ampersands (&).'
      );
      return;
    }

    // 5. Case-insensitive composite duplicate check: roomTypeName + acType
    const targetAcType = form.acType || 'AC';
    const isDuplicate = roomTypeMasters.some(
      rt => rt.roomTypeName.toLowerCase() === trimmedName.toLowerCase() && 
            (rt.acType || 'AC') === targetAcType && 
            rt.id !== editingRt?.id
    );
    if (isDuplicate) {
      addToast('error', 'Duplicate Entry', `A Room Type configuration for "${trimmedName} (${targetAcType})" already exists.`);
      return;
    }

    // 6. Bed Capacity check (min: 1, max: 20)
    const capValue = Number(form.capacity);
    if (isNaN(capValue) || capValue < 1 || capValue > 20) {
      addToast('error', 'Validation Error', 'Bed Capacity must be a number between 1 and 20.');
      return;
    }

    const payload = {
      ...form,
      roomTypeName: trimmedName,
      capacity: capValue,
      acType: form.acType || 'AC',
      status: form.status || 'Active',
      description: form.description || ''
    };

    if (editingRt) {
      updateRoomTypeMaster(editingRt.id, payload);
      addToast('success', 'Room Type Updated', `Successfully updated "${trimmedName}"`);
    } else {
      addRoomTypeMaster(payload as Omit<RoomTypeMaster, 'id'>);
      addToast('success', 'Room Type Created', `Successfully created "${trimmedName}"`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingRt) {
      deleteRoomTypeMaster(deletingRt.id);
      addToast('success', 'Room Type Deleted', `Successfully deleted "${deletingRt.roomTypeName}"`);
      setDeletingRt(null);
    }
  };

  const handleExportCSV = () => {
    const headers = 'Room Type,Bed Capacity,AC Type,Description,Status\n';
    const rows = roomTypeMasters
      .map(
        rt =>
          `"${rt.roomTypeName}",${rt.capacity},"${rt.acType}","${rt.description || ''}","${rt.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Room_Type_Master_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('success', 'Export Completed', 'Room Type configurations exported successfully');
  };

  const filtered = roomTypeMasters.filter(rt =>
    rt.roomTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rt.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" /> Room Type Master Configurator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Define capacity limits, AC designations, and specifications for hostel accommodations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Room Type
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search room type name or descriptions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Room Type Config Table */}
      <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Room Type</th>
                <th className="py-3.5 px-5 text-center">Bed Capacity</th>
                <th className="py-3.5 px-5">AC Type</th>
                <th className="py-3.5 px-5">Description</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No Room Type specifications found.</td>
                </tr>
              ) : (
                filtered.map(rt => (
                  <tr key={rt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-5 font-black text-slate-900 dark:text-white">{rt.roomTypeName}</td>
                    <td className="py-4 px-5 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 font-black">{rt.capacity} Beds</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${rt.acType === 'AC' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {rt.acType || 'Non-AC'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-500 max-w-xs truncate">{rt.description || 'No description provided'}</td>
                    <td className="py-4 px-5">
                      {rt.status === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px]">Inactive</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(rt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingRt(rt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              {editingRt ? 'Edit Room Type Config' : 'Add Room Type Config'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Room Type Name */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Room Type Specification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Double Sharing, Deluxe AC, VIP Suite"
                  value={form.roomTypeName || ''}
                  onChange={e => setForm({ ...form, roomTypeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              {/* Bed Capacity */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bed Capacity (Manual Input) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={form.capacity || ''}
                  onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-extrabold outline-none"
                />
              </div>

              {/* AC Type */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">AC Type *</label>
                <select
                  value={form.acType || 'AC'}
                  onChange={e => setForm({ ...form, acType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  <option value="AC">AC</option>
                  <option value="Non-AC">Non-AC</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status *</label>
                <select
                  value={form.status || 'Active'}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  placeholder="Standard features, configurations, layout descriptions..."
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-medium resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20 transition-all"
                >
                  Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingRt && (
        <ConfirmModal
          isOpen={true}
          title="Delete Room Type Specification"
          message={`Are you sure you want to remove the "${deletingRt.roomTypeName}" configuration?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRt(null)}
        />
      )}
    </div>
  );
};
