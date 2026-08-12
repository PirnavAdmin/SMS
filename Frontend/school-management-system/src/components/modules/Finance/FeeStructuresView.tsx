import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { Layers, Plus, Search, Edit, Trash2, Calculator, CheckCircle } from 'lucide-react';
import { DynamicFeeStructure, FeeStructureItem } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

export const FeeStructuresView: React.FC = () => {
  const { feeHeads, dynamicFeeStructures, addDynamicFeeStructure, updateDynamicFeeStructure, deleteDynamicFeeStructure, academicClasses } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState<DynamicFeeStructure | null>(null);
  const [deletingStruct, setDeletingStruct] = useState<DynamicFeeStructure | null>(null);

  const [className, setClassName] = useState('');
  const [selectedHeadIds, setSelectedHeadIds] = useState<string[]>([]);
  const [selectedHeadAmounts, setSelectedHeadAmounts] = useState<Record<string, string>>({});
  const [isLoadingFeeTypes, setIsLoadingFeeTypes] = useState(false);

  const activeFeeHeads = feeHeads.filter(h => h.status === 'Active');

  const totalCalculated = selectedHeadIds.reduce((sum, id) => {
    const val = Number(selectedHeadAmounts[id]) || 0;
    return sum + val;
  }, 0);

  const filteredStructures = dynamicFeeStructures.filter(s => {
    const matchesQuery = s.className.toLowerCase().includes(query.toLowerCase());
    const matchesClass = selectedClassFilter === 'All' || s.className === selectedClassFilter;
    return matchesQuery && matchesClass;
  });

  const handleOpenAdd = () => {
    setEditingStruct(null);
    setClassName('');
    setSelectedHeadIds([]);
    setSelectedHeadAmounts({});
    setIsLoadingFeeTypes(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: DynamicFeeStructure) => {
    setEditingStruct(s);
    setClassName(s.className);
    const ids: string[] = [];
    const amounts: Record<string, string> = {};
    s.items.forEach(item => {
      ids.push(item.feeHeadId);
      amounts[item.feeHeadId] = String(item.amount);
    });
    setSelectedHeadIds(ids);
    setSelectedHeadAmounts(amounts);
    setIsLoadingFeeTypes(false);
    setIsModalOpen(true);
  };

  const handleClassChange = (newClass: string) => {
    setClassName(newClass);
    // Clear previously selected fee types and entered amounts to prevent stale values
    setSelectedHeadIds([]);
    setSelectedHeadAmounts({});

    if (newClass) {
      setIsLoadingFeeTypes(true);
      setTimeout(() => {
        setIsLoadingFeeTypes(false);
      }, 250);
    } else {
      setIsLoadingFeeTypes(false);
    }
  };

  const handleToggleHead = (headId: string) => {
    if (selectedHeadIds.includes(headId)) {
      // Unchecked: remove from selection and clear amount
      setSelectedHeadIds(prev => prev.filter(id => id !== headId));
      setSelectedHeadAmounts(prev => {
        const copy = { ...prev };
        delete copy[headId];
        return copy;
      });
    } else {
      // Checked: enable input, keep amount field empty ("") until user enters an amount
      setSelectedHeadIds(prev => [...prev, headId]);
      setSelectedHeadAmounts(prev => ({
        ...prev,
        [headId]: ''
      }));
    }
  };

  const handleAmountChange = (headId: string, valStr: string) => {
    // Only accept numeric inputs (digits and optional single decimal point)
    if (valStr === '' || /^\d*\.?\d*$/.test(valStr)) {
      setSelectedHeadAmounts(prev => ({
        ...prev,
        [headId]: valStr
      }));
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!className) {
      addToast('warning', 'Validation Error', 'Please select a Class Grade.');
      return;
    }

    if (selectedHeadIds.length === 0) {
      addToast('warning', 'Validation Error', 'Please select at least one applicable master fee type.');
      return;
    }

    // Validate that every checked fee type has a valid amount > 0
    for (const headId of selectedHeadIds) {
      const head = feeHeads.find(h => h.id === headId);
      const headName = head ? head.name : 'Fee Type';
      const amtStr = (selectedHeadAmounts[headId] || '').trim();

      if (amtStr === '') {
        addToast('warning', 'Validation Error', `Please enter an amount for ${headName}.`);
        return;
      }

      const amtNum = Number(amtStr);
      if (isNaN(amtNum) || amtNum <= 0) {
        addToast('warning', 'Validation Error', `Please enter a valid amount greater than 0 for ${headName}.`);
        return;
      }
    }

    const itemsList: FeeStructureItem[] = selectedHeadIds.map(headId => {
      const head = feeHeads.find(h => h.id === headId);
      return {
        feeHeadId: headId,
        feeHeadName: head ? head.name : 'Fee Head',
        category: head ? head.category : undefined,
        amount: Number(selectedHeadAmounts[headId])
      };
    });

    const payload: Omit<DynamicFeeStructure, 'id'> = {
      academicYear: editingStruct ? editingStruct.academicYear : (selectedAcademicYear || '2026-2027'),
      branch: editingStruct ? editingStruct.branch : (selectedBranch || 'Main Campus'),
      className,
      section: 'A',
      studentCategory: 'General',
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

  // Filter applicable fee heads for selected class grade
  const applicableFeeHeads = activeFeeHeads.filter(h => {
    if (!className) return false;
    if (!h.applicableClasses || h.applicableClasses.length === 0) return true;
    return h.applicableClasses.includes(className) || h.applicableClasses.includes('All');
  });

  const displayFeeHeads = applicableFeeHeads.length > 0 ? applicableFeeHeads : activeFeeHeads;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Class Fee Structures
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
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
          className="w-full sm:w-48 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
        >
          <option value="All">All Class Grades</option>
          {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid of Structures */}
      {filteredStructures.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No Fee Structures Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No fee structures configured for the selected search filters. Click below to create a new class fee structure.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Fee Structure
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStructures.map(s => (
            <div key={s.id} className="glass-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {s.className} Fee Structure
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(s)} className="p-1 rounded hover:bg-slate-100 text-sky-600 cursor-pointer" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingStruct(s)} className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStruct ? 'Edit Dynamic Fee Structure' : 'Configure Dynamic Fee Structure'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class Grade *</label>
                <select
                  value={className}
                  onChange={e => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                >
                  <option value="">Select Class</option>
                  {academicClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Dynamic Fee Heads Selection — Displayed ONLY after class grade is selected */}
              {className !== '' && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                    SELECT APPLICABLE MASTER FEE TYPES
                  </h4>

                  {isLoadingFeeTypes ? (
                    <div className="p-6 text-center text-slate-400 space-y-2">
                      <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-medium italic">Loading applicable fee types...</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {displayFeeHeads.map(head => {
                        const isChecked = selectedHeadIds.includes(head.id);
                        const amountVal = selectedHeadAmounts[head.id] ?? '';

                        return (
                          <div
                            key={head.id}
                            className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                              isChecked
                                ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-850'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleHead(head.id)}
                                className="w-4 h-4 rounded text-sky-600 border-slate-300 dark:border-slate-700 bg-white focus:ring-sky-500 cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs">{head.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {head.category} • {head.frequency}
                                </p>
                              </div>
                            </label>

                            <div className="flex items-center gap-1.5 ml-2">
                              <span className={`font-bold text-xs ${isChecked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>₹</span>
                              <input
                                type="text"
                                disabled={!isChecked}
                                value={isChecked ? amountVal : ''}
                                placeholder=""
                                onChange={e => handleAmountChange(head.id, e.target.value)}
                                className={`w-28 px-3 py-1.5 rounded-xl border text-right font-mono font-bold text-xs outline-none transition-all ${
                                  isChecked
                                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 focus:ring-2 focus:ring-sky-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Total Auto-Calculated Fee Box */}
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between mt-3">
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4" /> Total Auto-Calculated Fee:
                    </span>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(totalCalculated)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  Save Fee Structure
                </button>
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
