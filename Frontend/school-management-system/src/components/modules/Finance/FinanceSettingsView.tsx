import React, { useState } from 'react';
import { SlidersHorizontal, Save } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const FinanceSettingsView: React.FC = () => {
  const { financeSettings, updateFinanceSettings, fineRules } = useData();
  const { addToast } = useToast();

  const [form, setForm] = useState(financeSettings);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateFinanceSettings(form);
    addToast('success', 'Settings Saved', 'Updated global finance configuration.');
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-sky-500" /> Finance System Settings
        </h2>
        <p className="text-xs text-slate-500">Configure global currency, receipt numbering prefixes, payment gateways & tax settings</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-6 text-xs">
        {/* Core Settings */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-sky-600">General Financial Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Academic Session Year</label>
              <input type="text" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Financial Fiscal Year</label>
              <input type="text" value={form.financialYear} onChange={e => setForm({ ...form, financialYear: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Default Base Currency</label>
              <input type="text" value={form.defaultCurrency} onChange={e => setForm({ ...form, defaultCurrency: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Active Late Fee Rule</label>
              <select value={form.lateFeeRuleId} onChange={e => setForm({ ...form, lateFeeRuleId: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                {fineRules.map(r => <option key={r.id} value={r.id}>{r.ruleName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Numbering & Prefixes */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-sky-600">Invoice & Receipt Formatting</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Receipt Number Prefix</label>
              <input type="text" value={form.receiptPrefix} onChange={e => setForm({ ...form, receiptPrefix: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Invoice Number Prefix</label>
              <input type="text" value={form.invoicePrefix} onChange={e => setForm({ ...form, invoicePrefix: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Auto-Generate Sequential Receipt Numbers</span>
            <input
              type="checkbox"
              checked={form.autoReceiptNo}
              onChange={e => setForm({ ...form, autoReceiptNo: e.target.checked })}
              className="w-4 h-4 rounded text-sky-600"
            />
          </div>
        </div>

        {/* Tax Settings */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-sky-600">Tax & GST Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Tax Label</label>
              <input type="text" value={form.taxSettings.taxName} onChange={e => setForm({ ...form, taxSettings: { ...form.taxSettings, taxName: e.target.value } })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tax Percentage (%)</label>
              <input type="number" value={form.taxSettings.percentage} onChange={e => setForm({ ...form, taxSettings: { ...form.taxSettings, percentage: Number(e.target.value) } })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Financial Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
