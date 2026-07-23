import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Percent, Plus, Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { Discount, DiscountType, StudentDiscount } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

const DISCOUNT_TYPES: DiscountType[] = [
  'Sibling Discount', 'Employee Discount', 'Early Payment Discount', 'Special Approval', 'Custom'
];

export const DiscountsView: React.FC = () => {
  const { discounts, studentDiscounts, students, addDiscount, updateDiscount, deleteDiscount, assignDiscountToStudent, removeStudentDiscount } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'master' | 'allocated'>('master');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState<Discount | null>(null);
  const [deletingDisc, setDeletingDisc] = useState<Discount | null>(null);

  const [isAllocOpen, setIsAllocOpen] = useState(false);
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocDiscountId, setAllocDiscountId] = useState(discounts[0]?.id || '');

  const [formData, setFormData] = useState<Partial<Discount>>({
    name: '',
    code: '',
    type: 'Sibling Discount',
    mode: 'Percentage',
    value: 10,
    status: 'Active'
  });

  const filteredDiscounts = discounts.filter(d =>
    d.name.toLowerCase().includes(query.toLowerCase()) || d.code.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingDisc(null);
    setFormData({
      name: '',
      code: 'DSC-' + Math.floor(100 + Math.random() * 900),
      type: 'Sibling Discount',
      mode: 'Percentage',
      value: 10,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Discount) => {
    setEditingDisc(d);
    setFormData(d);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation Error', 'Name and code are required.');
      return;
    }

    if (editingDisc) {
      updateDiscount(editingDisc.id, formData);
      addToast('success', 'Discount Updated', `Updated ${formData.name}`);
    } else {
      addDiscount(formData as Omit<Discount, 'id'>);
      addToast('success', 'Discount Created', `Created ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  const handleAllocSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!allocStudentId || !allocDiscountId) return;
    assignDiscountToStudent(allocStudentId, allocDiscountId);
    addToast('success', 'Discount Assigned', 'Applied concession to student.');
    setIsAllocOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-sky-500" /> Discounts & Concessions Master
          </h2>
          <p className="text-xs text-slate-500">Configure Sibling, Staff Child, Early Payment & Custom Concessions</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAllocOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Grant Student Concession
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Discount
          </button>
          <ExportButton data={discounts} filename="discounts" />
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'master' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Discount Rules ({discounts.length})
          </button>
          <button
            onClick={() => setActiveTab('allocated')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'allocated' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Granted Student Concessions ({studentDiscounts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search discount name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {activeTab === 'master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiscounts.map(d => (
            <div key={d.id} className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {d.type} • {d.code}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{d.name}</h3>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {d.mode === 'Percentage' ? `${d.value}% Concession` : `${formatCurrency(d.value)} Flat Off`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(d)} className="p-1.5 rounded hover:bg-slate-100 text-sky-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => setDeletingDisc(d)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'allocated' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Granted Concession</th>
                <th className="py-3.5 px-4">Applied Date</th>
                <th className="py-3.5 px-4 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {studentDiscounts.map(sd => {
                const st = students.find(s => s.id === sd.studentId);
                return (
                  <tr key={sd.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st ? `${st.firstName} ${st.lastName}` : sd.studentId}</td>
                    <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{sd.discountName}</td>
                    <td className="py-3 px-4 text-slate-500">{sd.appliedDate}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => removeStudentDiscount(sd.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDisc ? 'Edit Discount Rule' : 'Add Discount Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Discount Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Code *</label>
                  <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Discount Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mode</label>
                  <select value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Value ({formData.mode === 'Percentage' ? '%' : '₹'}) *</label>
                <input type="number" required value={formData.value} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Discount</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Concession Modal */}
      {isAllocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Grant Student Concession</h3>
              <button onClick={() => setIsAllocOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAllocSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Student *</label>
                <select value={allocStudentId} onChange={e => setAllocStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="">-- Choose Student --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Discount Rule *</label>
                <select value={allocDiscountId} onChange={e => setAllocDiscountId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {discounts.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.mode === 'Percentage' ? `${d.value}%` : formatCurrency(d.value)})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsAllocOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-emerald-600 text-white rounded-xl">Grant Concession</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingDisc}
        title="Delete Discount"
        message={`Are you sure you want to delete ${deletingDisc?.name}?`}
        onConfirm={() => {
          if (deletingDisc) {
            deleteDiscount(deletingDisc.id);
            addToast('success', 'Discount Deleted');
            setDeletingDisc(null);
          }
        }}
        onCancel={() => setDeletingDisc(null)}
      />
    </div>
  );
};
