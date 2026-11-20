import React, { useState } from 'react';
import {
  Save,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  ChevronDown,
  X
} from 'lucide-react';
import { ApplicationDraft } from '../../api/applicationDrafts';
import { SaveStatus } from '../../hooks/useApplicationDraft';

interface DraftActionBarProps {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  applicantName?: string;
  currentStep?: number;
  totalSteps?: number;
  isDraftRestored?: boolean;
  onManualSave: () => void;
  onDiscardDraft: () => void;
  allDrafts?: ApplicationDraft[];
  onSelectDraft?: (draft: ApplicationDraft) => void;
  className?: string;
}

export const DraftActionBar: React.FC<DraftActionBarProps> = ({
  saveStatus,
  lastSavedAt,
  applicantName,
  currentStep,
  totalSteps,
  isDraftRestored,
  onManualSave,
  onDiscardDraft,
  allDrafts = [],
  onSelectDraft,
  className = ''
}) => {
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [showDraftListModal, setShowDraftListModal] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Restored / Pending Application Notification Banner */}
      {isDraftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-700/50 rounded-2xl text-amber-900 dark:text-amber-200 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Pending application restored:</strong>{' '}
              {applicantName ? `"${applicantName}"` : 'In-progress draft'}{' '}
              {currentStep && totalSteps ? `(Step ${currentStep} of ${totalSteps})` : ''}
              {lastSavedAt ? ` • Last saved at ${formatTime(lastSavedAt)}` : ''}.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {allDrafts.length > 1 && onSelectDraft && (
              <button
                type="button"
                onClick={() => setShowDraftListModal(true)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-200/60 dark:bg-amber-800/60 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                View All Pending ({allDrafts.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowConfirmDiscard(true)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 dark:hover:bg-rose-800/60 text-rose-700 dark:text-rose-300 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard & Start New
            </button>
          </div>
        </div>
      )}

      {/* Draft Control Strip (Status + Actions) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Saving draft to server...
            </span>
          )}

          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Draft saved to server
              {lastSavedAt && (
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                  ({formatTime(lastSavedAt)})
                </span>
              )}
            </span>
          )}

          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed to save draft. Check connection.
            </span>
          )}

          {saveStatus === 'idle' && (
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Auto-save enabled (Server Draft)
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {allDrafts.length > 0 && onSelectDraft && (
            <button
              type="button"
              onClick={() => setShowDraftListModal(true)}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-brand-500" />
              Drafts ({allDrafts.length})
            </button>
          )}

          <button
            type="button"
            onClick={onManualSave}
            disabled={saveStatus === 'saving'}
            className="px-3 py-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
          </button>

          {(saveStatus === 'saved' || isDraftRestored || lastSavedAt) && (
            <button
              type="button"
              onClick={() => setShowConfirmDiscard(true)}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-1"
              title="Discard this draft and start fresh"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard Draft
            </button>
          )}
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showConfirmDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Discard Draft?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to discard this pending draft application? All entered information will be permanently removed from the server and the form will be reset.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDiscard(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Keep Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDiscard(false);
                  onDiscardDraft();
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Yes, Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Drafts List Modal */}
      {showDraftListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pending Application Drafts ({allDrafts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftListModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allDrafts.map(d => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {d.applicantName || 'Unnamed Draft'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Step {d.currentStep} • Saved{' '}
                      {new Date(d.updatedAt || d.createdAt).toLocaleDateString()}{' '}
                      {new Date(d.updatedAt || d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDraft) onSelectDraft(d);
                      setShowDraftListModal(false);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                  >
                    Load Draft
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDraftListModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
