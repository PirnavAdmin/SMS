import { apiClient } from './client';

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
  visualType?: 'table' | 'chart' | 'action_preview' | 'none';
  visualData?: any;
  toolCalls?: Array<{
    toolName: string;
    description: string;
    success: boolean;
    summary?: any;
  }>;
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
  visualType?: 'table' | 'chart' | 'action_preview' | 'none';
  visualData?: any;
  toolCallsExecuted: Array<{
    toolName: string;
    description: string;
    success: boolean;
    summary?: any;
  }>;
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
