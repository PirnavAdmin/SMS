import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Layers, Plus, Search, Edit, Trash2, Calculator, CheckCircle } from 'lucide-react';
import { DynamicFeeStructure, FeeStructureItem } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const FeeStructuresView: React.FC = () => {
  const { feeHeads, dynamicFeeStructures, addDynamicFeeStructure, updateDynamicFeeStructure, deleteDynamicFeeStructure, academicClasses } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<DynamicFeeStructure | null>(null);
  const [deletingStruct, setDeletingStruct] = useState<DynamicFeeStructure | null>(null);

  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [branch, setBranch] = useState('Main Campus');
  const [className, setClassName] = useState('Class 10');
  const [section, setSection] = useState('A');
  const [studentCategory, setStudentCategory] = useState('General');
  const [selectedHeadItems, setSelectedHeadItems] = useState<Record<string, number>>({});

  const activeFeeHeads = feeHeads.filter(h => h.status === 'Active');

  const totalCalculated = Object.values(selectedHeadItems).reduce((sum, amt) => sum + (Number(amt) || 0), 0);

  const filteredStructures = dynamicFeeStructures.filter(s => {
    const matchesQuery = s.className.toLowerCase().includes(query.toLowerCase()) || s.studentCategory.toLowerCase().includes(query.toLowerCase());
    const matchesClass = selectedClassFilter === 'All' || s.className === selectedClassFilter;
    return matchesQuery && matchesClass;
  });

  const handleOpenAdd = () => {
    setEditingStruct(null);
    setAcademicYear('2025-2026');
    setBranch('Main Campus');
    setClassName('Class 10');
    setSection('A');
    setStudentCategory('General');

    // Default pre-select active heads
    const initialItems: Record<string, number> = {};
    activeFeeHeads.forEach(h => {
      initialItems[h.id] = h.category === 'Tuition' ? 25000 : 3000;
    });
    setSelectedHeadItems(initialItems);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: DynamicFeeStructure) => {
    setEditingStruct(s);
    setAcademicYear(s.academicYear);
    setBranch(s.branch);
    setClassName(s.className);
    setSection(s.section || 'A');
    setStudentCategory(s.studentCategory);

    const mapItems: Record<string, number> = {};
    s.items.forEach(item => {
      mapItems[item.feeHeadId] = item.amount;
    });
    setSelectedHeadItems(mapItems);
    setIsModalOpen(true);
  };

  const handleAmountChange = (headId: string, value: number) => {
    setSelectedHeadItems(prev => ({
      ...prev,
      [headId]: value
    }));
  };

  const handleToggleHead = (headId: string) => {
    setSelectedHeadItems(prev => {
      const copy = { ...prev };
      if (headId in copy) {
        delete copy[headId];
      } else {
        copy[headId] = 2000;
      }
      return copy;
    });
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const itemsList: FeeStructureItem[] = Object.entries(selectedHeadItems)
      .filter(([_, amt]) => amt > 0)
      .map(([headId, amount]) => {
        const head = feeHeads.find(h => h.id === headId);
        return {
          feeHeadId: headId,
          feeHeadName: head ? head.name : 'Fee Head',
          amount: Number(amount)
        };
      });

    if (itemsList.length === 0) {
      addToast('warning', 'Validation Error', 'At least one fee head must be selected with amount > 0.');
      return;
    }

    const payload: Omit<DynamicFeeStructure, 'id'> = {
      academicYear,
      branch,
      className,
      section,
      studentCategory,
      items: itemsList,
      totalAmount: totalCalculated,
      status: 'Active'
    };

    if (editingStruct) {
      updateDynamicFeeStructure(editingStruct.id, payload);
      addToast('success', 'Fee Structure Updated', `Updated structure for ${className}`);
    } else {
      addDynamicFeeStructure(payload);
      addToast('success', 'Fee Structure Configured', `Configured structure for ${className}`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Class Fee Structures
          </h2>
          <p className="text-xs text-slate-500">Configure class-wise, section-wise & category-wise fee breakdowns automatically calculated from Master Fee Heads</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Fee Structure
          </button>
          <ExportButton data={filteredStructures} filename="fee_structures" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search class or category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <select
          value={selectedClassFilter}
          onChange={e => setSelectedClassFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
        >
          <option value="All">All Class Grades</option>
          {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid of Structures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStructures.map(s => (
          <div key={s.id} className="glass-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {s.academicYear} • {s.branch} • Category: {s.studentCategory}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {s.className} {s.section ? `(Sec ${s.section})` : ''} Fee Structure
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 text-sky-600" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeletingStruct(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              {s.items.map(item => (
                <div key={item.feeHeadId} className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{item.feeHeadName}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
              <span>Total Standard Base Fee:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(s.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStruct ? 'Edit Dynamic Fee Structure' : 'Configure Dynamic Fee Structure'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Academic Year</label>
                  <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Branch</label>
                  <input type="text" value={branch} onChange={e => setBranch(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Class Grade *</label>
                  <select value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Section</label>
                  <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="All">All Sections</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Student Category</label>
                  <select value={studentCategory} onChange={e => setStudentCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC/ST">SC/ST</option>
                    <option value="RTE">RTE</option>
                    <option value="Staff Child">Staff Child</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Fee Heads Selection */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Select Applicable Master Fee Heads</h4>
                {activeFeeHeads.map(head => {
                  const isSelected = head.id in selectedHeadItems;
                  return (
                    <div key={head.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleHead(head.id)}
                          className="w-4 h-4 rounded text-sky-600"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{head.name}</p>
                          <p className="text-[10px] text-slate-400">{head.category} • {head.frequency}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={selectedHeadItems[head.id] || 0}
                            onChange={e => handleAmountChange(head.id, Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border text-right font-bold text-sky-600"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" /> Total Auto-Calculated Fee:
                </span>
                <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCalculated)}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl">Save Fee Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingStruct}
        title="Delete Structure"
        message={`Are you sure you want to delete structure for ${deletingStruct?.className}?`}
        onConfirm={() => {
          if (deletingStruct) {
            deleteDynamicFeeStructure(deletingStruct.id);
            addToast('success', 'Fee Structure Removed');
            setDeletingStruct(null);
          }
        }}
        onCancel={() => setDeletingStruct(null)}
      />
    </div>
  );
};
