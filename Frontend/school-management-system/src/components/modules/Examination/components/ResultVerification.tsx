import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface ResultVerificationProps {
  issues: string[];
  isVerified: boolean;
  onVerify: () => void;
  onApprove: () => void;
  status: string;
}

export const ResultVerification: React.FC<ResultVerificationProps> = ({
  issues,
  isVerified,
  onVerify,
  onApprove,
  status
}) => {
  const cardClass = "p-5 rounded-3xl border shadow-sm text-xs space-y-4";

  if (issues.length > 0) {
    return (
      <div className={`${cardClass} bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 dark:border-rose-900/40 pb-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" /> Result Approval Validation Blocking
            </h4>
            <p className="text-xs text-rose-600 dark:text-rose-350/80 font-medium">Please resolve the following issues prior to calculations approval.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase">
            {issues.length} Issues Found
          </span>
        </div>

        <ul className="list-disc pl-5 space-y-1 font-semibold text-rose-800 dark:text-rose-300">
          {issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`${cardClass} bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Verification Succeeded
        </h4>
        <p className="text-xs text-emerald-600 dark:text-emerald-350/80 font-medium">All student subject marks are fully submitted, calculated, and valid. Ready for approval.</p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
        {!isVerified ? (
          <button
            type="button"
            onClick={onVerify}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-sm transition"
          >
            Mark as Verified
          </button>
        ) : (
          <button
            type="button"
            disabled={status === 'Approved' || status === 'Published'}
            onClick={onApprove}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition disabled:opacity-60"
          >
            {status === 'Approved' || status === 'Published' ? 'Approved (Locked)' : 'Approve & Release'}
          </button>
        )}
      </div>
    </div>
  );
};
