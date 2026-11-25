import React, { useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { AiEvidenceItem, AiInvestigationPlanSummary, AiToolExecution } from '../../../api/aiAssistant';

export interface StreamProgressEvent {
  stage: string;
  message: string;
  modules?: string[];
  tool_name?: string;
}

const PROVENANCE_STYLES: Record<string, { label: string; badge: string }> = {
  LIVE_ERP: {
    label: 'LIVE ERP',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  ANALYTICS_ENGINE: {
    label: 'ANALYTICS ENGINE',
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  },
  ML_PREDICTION: {
    label: 'ML ADVISORY',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  DOCUMENT_RAG: {
    label: 'POLICY RAG',
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  },
  SYSTEM: {
    label: 'SYSTEM ACTION',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export const LiveInvestigationProgressCard: React.FC<{ events: StreamProgressEvent[] }> = ({ events }) => {
  if (!events.length) return null;
  const latest = events[events.length - 1];
  return (
    <div className="my-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs dark:border-sky-900 dark:bg-sky-950/40">
      <div className="flex items-center gap-2 font-semibold text-sky-800 dark:text-sky-200">
        <Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400" />
        <span>Autonomous Investigation in Progress ({latest.stage.toUpperCase()})</span>
      </div>
      <div className="mt-2 space-y-1">
        {events.slice(-5).map((ev, idx) => (
          <div key={`${ev.stage}-${idx}`} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
            <span className="font-mono text-[10px] uppercase text-sky-700 dark:text-sky-300">{ev.stage}</span>
            <span className="truncate">{ev.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InvestigationTracePanel: React.FC<{
  plan?: AiInvestigationPlanSummary;
  evidence?: AiEvidenceItem[];
  toolCalls?: AiToolExecution[];
  followUps?: string[];
  latencyMs?: number;
  providerUsed?: string;
  onSelectFollowUp: (prompt: string) => void;
}> = ({ plan, evidence, toolCalls, followUps, latencyMs, providerUsed, onSelectFollowUp }) => {
  const [expanded, setExpanded] = useState(false);

  const contradictions = plan?.contradictions_detected || [];
  const hasMetadata = Boolean(plan || (evidence && evidence.length > 0) || (toolCalls && toolCalls.length > 0));

  return (
    <div className="mt-3 space-y-2.5">
      {contradictions.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Data Integrity & Reconciliation Alerts ({contradictions.length})</span>
          </div>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {contradictions.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {hasMetadata && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Evidence & Investigation Trace</span>
              {plan && (
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {plan.modules_involved.length} modules • {plan.completed_steps} steps
                </span>
              )}
              {typeof latencyMs === 'number' && latencyMs > 0 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {Math.round(latencyMs)} ms{providerUsed ? ` • ${providerUsed}` : ''}
                </span>
              )}
            </div>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="border-t border-slate-200 px-3 py-2.5 text-xs space-y-3 dark:border-slate-800">
              {plan && plan.steps.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Investigation Plan</span>
                  </div>
                  <ol className="list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                    {plan.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {evidence && evidence.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    <Database className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Verified Evidence Sources ({evidence.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {evidence.map((ev, i) => {
                      const style = PROVENANCE_STYLES[ev.source_type] || PROVENANCE_STYLES.LIVE_ERP;
                      return (
                        <div
                          key={`${ev.tool_name}-${i}`}
                          className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2
                                className={`h-3.5 w-3.5 ${ev.verified ? 'text-emerald-600' : 'text-amber-500'}`}
                              />
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                                {ev.tool_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                                {style.label}
                              </span>
                              <span className="text-[10px] text-slate-500">{ev.record_count} rec</span>
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{ev.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!evidence || evidence.length === 0) && toolCalls && toolCalls.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    <FileText className="h-3.5 w-3.5 text-sky-500" />
                    <span>Executed Tools</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {toolCalls.map((tc, idx) => (
                      <span
                        key={`${tc.toolName}-${idx}`}
                        className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] dark:border-slate-700 dark:bg-slate-900"
                      >
                        {tc.toolName} ({tc.success ? 'OK' : 'FAIL'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {followUps && followUps.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3 w-3 text-sky-500" />
            Next:
          </span>
          {followUps.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectFollowUp(q)}
              className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700 hover:border-sky-400 hover:bg-sky-50 transition-colors dark:border-sky-900 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-sky-950"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
