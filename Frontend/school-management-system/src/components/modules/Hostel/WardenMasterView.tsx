import React, { useState } from 'react';
import { Users, Edit, Trash2, Plus, Search } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const WardenMasterView: React.FC = () => {
  const { hostelMasters, updateHostelMaster } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingHostelId, setEditingHostelId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    wardenName: '',
    wardenMobile: '',
    wardenAlternateMobile: '',
    wardenEmail: ''
  });

  const filteredWardens = hostelMasters.filter(h => h.wardenName && (
    h.wardenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.wardenEmail && h.wardenEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    h.hostelName.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const handleOpenEdit = (hostelId: string) => {
    const h = hostelMasters.find(x => x.id === hostelId);
    if (h) {
      setEditingHostelId(hostelId);
      setFormData({
        wardenName: h.wardenName,
        wardenMobile: h.wardenMobile,
        wardenAlternateMobile: h.wardenAlternateMobile || '',
        wardenEmail: h.wardenEmail || ''
      });
      setIsFormOpen(true);
    }
  };

  const handleOpenAdd = () => {
    const unassigned = hostelMasters.find(h => !h.wardenName) || hostelMasters[0];
    if (!unassigned) {
      addToast('warning', 'No Hostels Configured', 'Please configure a hostel block first.');
      return;
    }
    setEditingHostelId(unassigned.id);
    setFormData({
      wardenName: '',
      wardenMobile: '',
      wardenAlternateMobile: '',
      wardenEmail: ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHostelId || !formData.wardenName || !formData.wardenMobile) return;

    updateHostelMaster(editingHostelId, {
      wardenName: formData.wardenName,
      wardenMobile: formData.wardenMobile,
      wardenAlternateMobile: formData.wardenAlternateMobile,
      wardenEmail: formData.wardenEmail
    });

    addToast('success', 'Warden Details Saved', `Successfully updated warden details.`);
    setIsFormOpen(false);
  };

  const handleDelete = (hostelId: string) => {
    updateHostelMaster(hostelId, {
      wardenName: '',
      wardenMobile: '',
      wardenAlternateMobile: '',
      wardenEmail: ''
    });
    addToast('success', 'Warden Assignment Revoked');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hostel Wardens</h3>
          <p className="text-xs text-slate-500">Manage residential warden allocations and emergency contacts for hostels</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Warden
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search wardens by name, email, hostel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Warden Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Alternate Mobile</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Hostel</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredWardens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No wardens found. Click "Add Warden" to assign wardens.</td>
                </tr>
              ) : (
                filteredWardens.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{h.wardenName}</td>
                    <td className="py-3 px-4 font-mono">{h.wardenMobile}</td>
                    <td className="py-3 px-4 font-mono">{h.wardenAlternateMobile || 'N/A'}</td>
                    <td className="py-3 px-4">{h.wardenEmail || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{h.hostelName}</td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                      <button onClick={() => handleOpenEdit(h.id)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600" title="Edit Warden"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(h.id)} className="p-1 rounded hover:bg-rose-50 text-rose-600" title="Delete Warden"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save Warden Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Assign Hostel Block *</label>
                <select
                  value={editingHostelId || ''}
                  onChange={e => setEditingHostelId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
                >
                  {hostelMasters.map(x => (
                    <option key={x.id} value={x.id}>{x.hostelName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Warden Name *</label>
                <input
                  type="text"
                  required
                  value={formData.wardenName}
                  onChange={e => setFormData({ ...formData, wardenName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={formData.wardenMobile}
                  onChange={e => setFormData({ ...formData, wardenMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Alternate Mobile</label>
                <input
                  type="text"
                  value={formData.wardenAlternateMobile}
                  onChange={e => setFormData({ ...formData, wardenAlternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={formData.wardenEmail}
                  onChange={e => setFormData({ ...formData, wardenEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenMasterView;
