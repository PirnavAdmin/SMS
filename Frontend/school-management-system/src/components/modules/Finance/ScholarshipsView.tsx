import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Gift, Plus, Search, Edit, Trash2, CheckCircle2, UserPlus, X } from 'lucide-react';
import { Scholarship, ScholarshipType, StudentScholarship } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

const SCHOLARSHIP_TYPES: ScholarshipType[] = [
  'Merit', 'Government', 'Minority', 'Sports', 'Staff Child', 'Management', 'Financial Aid'
];

export const ScholarshipsView: React.FC = () => {
  const { scholarships, studentScholarships, feeHeads, students, addScholarship, updateScholarship, deleteScholarship, assignScholarshipToStudent, revokeStudentScholarship, academicClasses } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'master' | 'allocated'>('master');
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSch, setEditingSch] = useState<Scholarship | null>(null);
  const [deletingSch, setDeletingSch] = useState<Scholarship | null>(null);

  // Allocation Modal
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocScholarshipId, setAllocScholarshipId] = useState(scholarships[0]?.id || '');

  const [formData, setFormData] = useState<Partial<Scholarship>>({
    name: '',
    code: '',
    type: 'Merit',
    discountType: 'Percentage',
    percentage: 15,
    fixedAmount: 0,
    applicableFeeHeadIds: ['FH-001'],
    applicableClasses: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    eligibility: 'GPA >= 3.8',
    description: 'Academic excellence grant',
    status: 'Active'
  });

  const filteredScholarships = scholarships.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase()) || s.code.toLowerCase().includes(query.toLowerCase());
    const matchesType = selectedType === 'All' || s.type === selectedType;
    return matchesQuery && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingSch(null);
    setFormData({
      name: '',
      code: 'SCH-' + Math.floor(100 + Math.random() * 900),
      type: 'Merit',
      discountType: 'Percentage',
      percentage: 15,
      fixedAmount: 0,
      applicableFeeHeadIds: feeHeads.slice(0, 1).map(h => h.id),
      applicableClasses: academicClasses.map(c => c.name),
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      eligibility: 'Merit criteria',
      description: 'Educational Grant',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Scholarship) => {
    setEditingSch(s);
    setFormData(s);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation Error', 'Scholarship name and code are required.');
      return;
    }

    if (editingSch) {
      updateScholarship(editingSch.id, formData);
      addToast('success', 'Scholarship Updated', `Updated ${formData.name}`);
    } else {
      addScholarship(formData as Omit<Scholarship, 'id'>);
      addToast('success', 'Scholarship Created', `Created ${formData.name}`);
    }
    setIsModalOpen(false);
  };

  const handleAllocSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!allocStudentId || !allocScholarshipId) {
      addToast('warning', 'Selection Required', 'Select both student and scholarship.');
      return;
    }
    assignScholarshipToStudent(allocStudentId, allocScholarshipId);
    addToast('success', 'Scholarship Awarded', 'Awarded scholarship to student.');
    setIsAllocModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-sky-500" /> Scholarship & Financial Aid Master
          </h2>
          <p className="text-xs text-slate-500">Configure merit, sports, government & staff child scholarships with automatic fee recalculations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAllocModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Award Student Scholarship
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Scholarship
          </button>
          <ExportButton data={scholarships} filename="scholarships" />
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
            Scholarship Master Schemes ({scholarships.length})
          </button>
          <button
            onClick={() => setActiveTab('allocated')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'allocated' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Student Awarded Scholarships ({studentScholarships.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search scholarship name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Master Schemes */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScholarships.map(s => (
            <div key={s.id} className="glass-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {s.type} Type • Code: {s.code}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{s.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 text-sky-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingSch(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Discount Value:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {s.discountType === 'Percentage' ? `${s.percentage}% Fee Waiver` : `${formatCurrency(s.fixedAmount || 0)} Grant`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Eligibility:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.eligibility}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validity Period:</span>
                  <span>{s.startDate} to {s.endDate}</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 italic">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Awarded List */}
      {activeTab === 'allocated' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Scholarship Awarded</th>
                  <th className="py-3.5 px-4">Discount Applied</th>
                  <th className="py-3.5 px-4">Date Awarded</th>
                  <th className="py-3.5 px-4 text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {studentScholarships.map(ss => (
                  <tr key={ss.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ss.studentName}</td>
                    <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">{ss.scholarshipName}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {ss.discountType === 'Percentage' ? `${ss.discountValue}% Waiver` : `${formatCurrency(ss.discountValue)} Off`}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{ss.appliedDate}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => revokeStudentScholarship(ss.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Scholarship Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSch ? 'Edit Scholarship Scheme' : 'Add Scholarship Master'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Scholarship Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Scholarship Code *</label>
                  <input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Scheme Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    {SCHOLARSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Discount Mode</label>
                  <select value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              {formData.discountType === 'Percentage' ? (
                <div><label className="block font-semibold mb-1">Percentage Waiver (%)</label><input type="number" value={formData.percentage} onChange={e => setFormData({ ...formData, percentage: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600" /></div>
              ) : (
                <div><label className="block font-semibold mb-1">Fixed Grant Amount (₹)</label><input type="number" value={formData.fixedAmount} onChange={e => setFormData({ ...formData, fixedAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-emerald-600" /></div>
              )}

              <div>
                <label className="block font-semibold mb-1">Eligibility Criteria</label>
                <input type="text" value={formData.eligibility} onChange={e => setFormData({ ...formData, eligibility: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Scheme</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Scholarship Modal */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Award Student Scholarship</h3>
              <button onClick={() => setIsAllocModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAllocSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Student *</label>
                <select value={allocStudentId} onChange={e => setAllocStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  <option value="">-- Choose Student --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.firstName} {st.lastName} ({st.className}-{st.section} • Adm: {st.admissionNo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Scholarship Scheme *</label>
                <select value={allocScholarshipId} onChange={e => setAllocScholarshipId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                  {scholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.discountType === 'Percentage' ? `${s.percentage}%` : `${formatCurrency(s.fixedAmount || 0)}`})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsAllocModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-emerald-600 text-white rounded-xl">Award Scholarship</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingSch}
        title="Delete Scheme"
        message={`Are you sure you want to delete ${deletingSch?.name}?`}
        onConfirm={() => {
          if (deletingSch) {
            deleteScholarship(deletingSch.id);
            addToast('success', 'Scholarship Scheme Deleted');
            setDeletingSch(null);
          }
        }}
        onCancel={() => setDeletingSch(null)}
      />
    </div>
  );
};
