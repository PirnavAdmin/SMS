import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConflictIssue {
  type: 'room' | 'invigilator' | 'date' | 'setup';
  message: string;
}

interface ExamConflictAlertProps {
  issues: ConflictIssue[];
}

export const ExamConflictAlert: React.FC<ExamConflictAlertProps> = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-350 text-xs space-y-2">
      <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider text-rose-600 dark:text-rose-400">
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>Scheduling Warning - Conflicts Detected ({issues.length})</span>
      </div>

      <ul className="list-disc pl-5 space-y-1 font-semibold">
        {issues.map((issue, idx) => (
          <li key={idx}>
            <span className="font-extrabold uppercase text-[9px] mr-1.5 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
              {issue.type}
            </span>
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
};
