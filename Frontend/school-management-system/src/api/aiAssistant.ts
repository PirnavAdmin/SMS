import { getSubdomain } from '../utils/subdomain';
import { apiClient } from './client';

export interface AiEvidenceItem {
  source_type: 'LIVE_ERP' | 'ANALYTICS_ENGINE' | 'ML_PREDICTION' | 'DOCUMENT_RAG' | 'SYSTEM';
  module: string;
  tool_name: string;
  record_count: number;
  summary: string;
  verified: boolean;
}

export interface AiInvestigationPlanSummary {
  objective: string;
  modules_involved: string[];
  steps: string[];
  completed_steps: number;
  iterations_used: number;
  contradictions_detected: string[];
}

export interface AiToolExecution {
  toolName: string;
  description: string;
  success: boolean;
  summary?: any;
  module?: string;
  durationMs?: number;
  recordCount?: number;
}

export interface AiVisualArtifact {
  visual_type: 'table' | 'chart' | 'action_preview' | 'report' | 'none';
  title: string;
  data: any;
}

export interface IndexedPolicyDocument {
  doc_id: string;
  title: string;
  category: string;
  source_ref: string;
  allowed_roles: string[];
  chunk_count: number;
  updated_at: string;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messageCount: number;
  isPinned: boolean;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  visualType?: 'table' | 'chart' | 'action_preview' | 'report' | 'none';
  visualData?: any;
  additionalVisuals?: AiVisualArtifact[];
  toolCalls?: AiToolExecution[];
  evidence?: AiEvidenceItem[];
  investigationPlan?: AiInvestigationPlanSummary;
  followUpQuestions?: string[];
  latencyMs?: number;
  providerUsed?: string;
  pendingAction?: {
    actionType: string;
    title: string;
    description: string;
    parameters: Record<string, any>;
    confirmationToken: string;
    expiresAt: string;
  };
  isActionExecuted?: boolean;
  createdAt: string;
}

export interface AiConversationDetail {
  id: string;
  title: string;
  userRole: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  messages: AiChatMessage[];
}

export interface AiChatResponse {
  conversationId: string;
  messageId: string;
  reply: string;
  visualType?: 'table' | 'chart' | 'action_preview' | 'report' | 'none';
  visualData?: any;
  additionalVisuals?: AiVisualArtifact[];
  toolCallsExecuted: AiToolExecution[];
  evidence?: AiEvidenceItem[];
  investigationPlan?: AiInvestigationPlanSummary;
  followUpQuestions?: string[];
  tokensUsed?: number;
  latencyMs?: number;
  providerUsed?: string;
  pendingAction?: {
    actionType: string;
    title: string;
    description: string;
    parameters: Record<string, any>;
    confirmationToken: string;
    expiresAt: string;
  };
  timestamp: string;
}

export interface AiSuggestedPrompt {
  category: string;
  prompt: string;
  description: string;
  icon: string;
}

export const fetchAiConversationsApi = async (): Promise<AiConversationSummary[]> => {
  try {
    const res = await apiClient<{ success: boolean; data: AiConversationSummary[] }>('/api/ai/conversations');
    return res?.data || [];
  } catch {
    return [];
  }
};

export const fetchAiConversationDetailApi = async (conversationId: string): Promise<AiConversationDetail | null> => {
  try {
    const res = await apiClient<{ success: boolean; data: AiConversationDetail }>(`/api/ai/conversations/${conversationId}`);
    return res?.data || null;
  } catch {
    return null;
  }
};

export const createAiConversationApi = async (title?: string): Promise<AiConversationSummary> => {
  const res = await apiClient<{ success: boolean; data: AiConversationSummary }>('/api/ai/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return res?.data;
};

export const renameAiConversationApi = async (conversationId: string, title: string): Promise<boolean> => {
  try {
    const res = await apiClient<{ success: boolean }>(`/api/ai/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    return res?.success ?? true;
  } catch {
    return false;
  }
};

export const deleteAiConversationApi = async (conversationId: string): Promise<boolean> => {
  try {
    const res = await apiClient<{ success: boolean }>(`/api/ai/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    return res?.success ?? true;
  } catch {
    return false;
  }
};

export const sendAiChatMessageApi = async (params: {
  conversationId?: string;
  message: string;
  branchId?: number;
  academicYearId?: number;
  branchName?: string;
  academicYear?: string;
}): Promise<AiChatResponse> => {
  const res = await apiClient<{ success: boolean; data: AiChatResponse } | AiChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  // Handle both wrapped { success, data } and unwrapped direct response shapes
  if (!res) throw new Error('No response received from AI service. Please check if the backend is running.');
  const payload = (res as any)?.data ?? res as AiChatResponse;
  if (!payload) throw new Error('AI service returned an empty response.');
  return payload as AiChatResponse;
};

export const confirmAiActionApi = async (confirmationToken: string, confirmed: boolean = true): Promise<{ success: boolean; message: string; resultDetails?: any }> => {
  const res = await apiClient<{ success: boolean; data: { success: boolean; message: string; resultDetails?: any } }>('/api/ai/action/confirm', {
    method: 'POST',
    body: JSON.stringify({ confirmationToken, confirmed }),
  });
  return res?.data || (res as any) || { success: false, message: 'No response' };
};

export const fetchAiSuggestedPromptsApi = async (): Promise<AiSuggestedPrompt[]> => {
  try {
    const res = await apiClient<{ success: boolean; data: AiSuggestedPrompt[] }>('/api/ai/suggested-prompts');
    return res?.data || [];
  } catch {
    return [];
  }
};

function normalizeChatResponse(raw: any): AiChatResponse {
  const d = raw?.data ?? raw;
  return {
    conversationId: d.conversationId || d.conversation_id || '',
    messageId: d.messageId || d.message_id || 'msg-' + Date.now(),
    reply: d.reply || '',
    visualType: d.visualType || d.visual_type || undefined,
    visualData: d.visualData ?? d.visual_data ?? null,
    additionalVisuals: d.additionalVisuals || d.additional_visuals || [],
    toolCallsExecuted: (d.toolCallsExecuted || d.tool_calls_executed || []).map((t: any) => ({
      toolName: t.toolName || t.tool_name,
      description: t.description || '',
      success: Boolean(t.success),
      summary: t.summary,
      module: t.module,
      durationMs: t.durationMs ?? t.duration_ms,
      recordCount: t.recordCount ?? t.record_count,
    })),
    evidence: d.evidence || [],
    investigationPlan: d.investigationPlan || d.investigation_plan || undefined,
    followUpQuestions: d.followUpQuestions || d.follow_up_questions || [],
    tokensUsed: d.tokensUsed ?? d.tokens_used ?? 0,
    latencyMs: d.latencyMs ?? d.latency_ms ?? 0,
    providerUsed: d.providerUsed || d.provider_used || undefined,
    pendingAction: d.pendingAction || (d.pending_action
      ? {
          actionType: d.pending_action.action_type,
          title: d.pending_action.title,
          description: d.pending_action.description,
          parameters: d.pending_action.parameters || {},
          confirmationToken: d.pending_action.confirmation_token,
          expiresAt: d.pending_action.expires_at,
        }
      : undefined),
    timestamp: d.timestamp || new Date().toISOString(),
  };
}

export const streamAiChatMessageApi = async (
  params: {
    conversationId?: string;
    message: string;
    branchId?: number;
    academicYearId?: number;
    branchName?: string;
    academicYear?: string;
  },
  onProgress?: (event: { stage: string; message: string; modules?: string[]; tool_name?: string }) => void
): Promise<AiChatResponse> => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  const tenantId = getSubdomain();
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (params.branchId) headers['X-Branch-Id'] = String(params.branchId);
  else if (params.branchName && params.branchName !== 'All Branches' && params.branchName !== 'All') {
    headers['X-Branch-Id'] = params.branchName;
  }

  try {
    const resp = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!resp.ok || !resp.body) {
      return await sendAiChatMessageApi(params);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResponse: AiChatResponse | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const blk of blocks) {
        const lines = blk.split('\n');
        let evName = 'message';
        let dataLine = '';
        for (const ln of lines) {
          if (ln.startsWith('event:')) evName = ln.slice(6).trim();
          else if (ln.startsWith('data:')) dataLine += ln.slice(5).trim();
        }
        if (!dataLine) continue;
        const parsed = JSON.parse(dataLine);
        if (evName === 'complete') {
          finalResponse = normalizeChatResponse(parsed);
        } else if (evName === 'error') {
          throw new Error(parsed.message || 'Streaming investigation error');
        } else if (onProgress) {
          onProgress({
            stage: evName,
            message: parsed.message || `Stage: ${evName}`,
            modules: parsed.modules,
            tool_name: parsed.tool_name,
          });
        }
      }
    }

    if (finalResponse) return finalResponse;
    return await sendAiChatMessageApi(params);
  } catch {
    return await sendAiChatMessageApi(params);
  }
};

export const fetchAiDocumentsApi = async (): Promise<IndexedPolicyDocument[]> => {
  const res = await apiClient<{ success: boolean; data: { documents: IndexedPolicyDocument[] } }>('/api/ai/documents');
  return res?.data?.documents || [];
};

export const uploadAiDocumentApi = async (
  file: File,
  category: string,
  allowedRoles: string
): Promise<IndexedPolicyDocument> => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('category', category);
  fd.append('allowedRoles', allowedRoles);
  const res = await apiClient<{ success: boolean; data: { document: IndexedPolicyDocument } }>('/api/ai/documents', {
    method: 'POST',
    body: fd,
  });
  return res?.data?.document;
};

export const syncAiCircularsApi = async (): Promise<number> => {
  const res = await apiClient<{ success: boolean; data: { circulars_synced: number } }>(
    '/api/ai/documents/sync-circulars',
    { method: 'POST' }
  );
  return res?.data?.circulars_synced || 0;
};

export const deleteAiDocumentApi = async (docId: string): Promise<boolean> => {
  await apiClient(`/api/ai/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' });
  return true;
};
