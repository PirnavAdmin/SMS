import React, { useState } from 'react';
import { X, Shield, Plus, Edit, Trash2, CheckCircle, FileText } from 'lucide-react';
import { DocumentRequirementRule } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface DocumentRequirementMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_DOC_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License',
  'Medical Certificate',
  'Police Verification',
  'Bank Passbook',
  'Degree Certificate',
  'Post Graduation Certificate',
  'B.Ed.',
  'M.Ed.',
  'Teaching Eligibility Certificate',
  'Experience Letter',
  'Resume',
  'Offer Letter'
];

export const DocumentRequirementMasterModal: React.FC<DocumentRequirementMasterModalProps> = ({ isOpen, onClose }) => {
  const { documentRequirementRules, addDocumentRequirementRule, updateDocumentRequirementRule, deleteDocumentRequirementRule, departments } = useData();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [department, setDepartment] = useState('Transport');
  const [designation, setDesignation] = useState('Driver');
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(['Aadhaar Card', 'PAN Card', 'Driving License']);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  if (!isOpen) return null;

  const handleToggleDoc = (docType: string) => {
    if (selectedDocTypes.includes(docType)) {
      setSelectedDocTypes(selectedDocTypes.filter(d => d !== docType));
    } else {
      setSelectedDocTypes([...selectedDocTypes, docType]);
    }
  };

  const handleOpenNew = () => {
    setEditingRuleId(null);
    setDepartment('Transport');
    setDesignation('Driver');
    setSelectedDocTypes(['Aadhaar Card', 'PAN Card']);
    setStatus('Active');
    setIsEditing(true);
  };

  const handleOpenEdit = (rule: DocumentRequirementRule) => {
    setEditingRuleId(rule.id);
    setDepartment(rule.department);
    setDesignation(rule.designation);
    setSelectedDocTypes(rule.requiredDocTypes || []);
    setStatus(rule.status);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !designation) {
      addToast('warning', 'Missing Fields', 'Please specify Department and Designation');
      return;
    }
    if (selectedDocTypes.length === 0) {
      addToast('warning', 'No Documents Selected', 'Please select at least 1 required document');
      return;
    }

    if (editingRuleId) {
      updateDocumentRequirementRule(editingRuleId, {
        department,
        designation,
        requiredDocTypes: selectedDocTypes,
        status
      });
      addToast('success', 'Rule Updated', `Updated document requirement rule for ${department} - ${designation}`);
    } else {
      addDocumentRequirementRule({
        department,
        designation,
        requiredDocTypes: selectedDocTypes,
        status
      });
      addToast('success', 'Rule Created', `Created document requirement rule for ${department} - ${designation}`);
    }

    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" />
              Document Requirement Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure dynamic document checklists by Department & Designation. HR will only collect required credentials.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={handleOpenNew}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Requirement Rule
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingRuleId ? 'Edit Requirement Rule' : 'New Document Requirement Rule'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Transport, Hostel, Finance"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Driver, Warden, Accountant, All"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Rule Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-2 text-xs text-slate-700 dark:text-slate-300">
                  Select Required Documents ({selectedDocTypes.length} Selected)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_DOC_TYPES.map(docType => {
                    const isChecked = selectedDocTypes.includes(docType);
                    return (
                      <button
                        type="button"
                        key={docType}
                        onClick={() => handleToggleDoc(docType)}
                        className={`p-2.5 rounded-xl text-xs text-left font-semibold border flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="truncate">{docType}</span>
                        {isChecked && <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl text-xs shadow-md hover:bg-sky-500"
                >
                  Save Configuration Rule
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {documentRequirementRules.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed">
                    No custom rules defined yet. System will automatically generate defaults.
                  </div>
                ) : (
                  documentRequirementRules.map(rule => (
                    <div key={rule.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">{rule.department}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400 text-xs">{rule.designation}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                            {rule.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rule.requiredDocTypes.map(doc => (
                            <span key={doc} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-sky-500" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Edit Rule"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            deleteDocumentRequirementRule(rule.id);
                            addToast('info', 'Rule Deleted');
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DocumentRequirementMasterModal;
