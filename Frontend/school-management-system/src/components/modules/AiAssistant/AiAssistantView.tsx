import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Plus,
  Search,
  Trash2,
  Edit2,
  Pin,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Calendar,
  CalendarCheck,
  CreditCard,
  Award,
  Bus,
  Clock,
  BookOpen,
  Users,
  BarChart2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  ShieldCheck,
  Download,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  AiConversationSummary,
  AiChatMessage,
  AiSuggestedPrompt,
  fetchAiConversationsApi,
  fetchAiConversationDetailApi,
  createAiConversationApi,
  renameAiConversationApi,
  deleteAiConversationApi,
  sendAiChatMessageApi,
  confirmAiActionApi,
  fetchAiSuggestedPromptsApi,
} from '../../../api/aiAssistant';

// Simple markdown renderer that supports bold, italic, code, lists, headings, and quotes
const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-base text-slate-900 dark:text-white mt-3 mb-1">
              {trimmed.substring(4)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-lg text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
              {trimmed.substring(3)}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-extrabold text-xl text-slate-900 dark:text-white mt-4 mb-2">
              {trimmed.substring(2)}
            </h2>
          );
        }

        // Unordered lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 list-disc text-slate-700 dark:text-slate-200 pl-1">
              {formatInlineStyles(trimmed.substring(2))}
            </li>
          );
        }

        // Ordered lists
        const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNum) {
          return (
            <li key={idx} className="ml-4 list-decimal text-slate-700 dark:text-slate-200 pl-1">
              {formatInlineStyles(matchNum[2])}
            </li>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-sky-500 pl-3 py-1 my-2 bg-sky-50 dark:bg-sky-950/30 text-slate-700 dark:text-slate-300 italic rounded-r">
              {formatInlineStyles(trimmed.substring(2))}
            </blockquote>
          );
        }

        return <p key={idx}>{formatInlineStyles(line)}</p>;
      })}
    </div>
  );
};

const formatInlineStyles = (str: string): React.ReactNode => {
  // Replace bold **text** and code `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900 dark:text-white">
          {token.substring(2, token.length - 2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-mono text-xs">
          {token.substring(1, token.length - 1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index}>{token.substring(1, token.length - 1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
};

// Interactive Dynamic Table Component
const DynamicTable: React.FC<{ data: any }> = ({ data }) => {
  const [filter, setFilter] = useState('');
  if (!data) return null;

  const title = data.title || 'Data Records';
  const columns: string[] = data.columns || (data.rows && data.rows.length > 0 ? Object.keys(data.rows[0]) : []);
  const rawRows: any[] = data.rows || (Array.isArray(data) ? data : []);

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rawRows;
    const f = filter.toLowerCase();
    return rawRows.filter((r) =>
      columns.some((c) => String(r[c] ?? '').toLowerCase().includes(f))
    );
  }, [rawRows, columns, filter]);

  const handleExportCsv = () => {
    if (!rawRows || rawRows.length === 0) return;
    const header = columns.join(',');
    const csvRows = rawRows.map((r) =>
      columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search table..."
              className="h-7 w-36 rounded-md border border-slate-200 bg-white pl-8 pr-2 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={handleExportCsv}
            title="Export CSV"
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap">
                    {String(row[col] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Interactive Dynamic Chart Component
const DynamicChart: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;
  const chart = data.chart || (data.type === 'bar' ? data : null);
  if (!chart || !chart.labels || chart.labels.length === 0) {
    if (data.table) return <DynamicTable data={data.table} />;
    return null;
  }

  const title = data.title || 'Analytics Overview';
  const labels: string[] = chart.labels;
  const dataset = chart.datasets?.[0] || { label: 'Value', data: [] };
  const rawData: number[] = dataset.data.map((d: any) => Number(d) || 0);
  const maxVal = Math.max(...rawData, 1);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4 text-sky-500" />
          {title}
        </h4>
        <span className="text-xs text-slate-400">{dataset.label}</span>
      </div>

      <div className="space-y-2.5">
        {labels.map((lbl, idx) => {
          const val = rawData[idx] ?? 0;
          const pct = Math.min(100, Math.max(4, Math.round((val / maxVal) * 100)));
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{lbl}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {val.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.table && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <DynamicTable data={data.table} />
        </div>
      )}
    </div>
  );
};

// Authorized Write Action Preview Card
const ActionPreviewCard: React.FC<{
  action: any;
  isExecuted?: boolean;
  onConfirm: (token: string, confirmed: boolean) => void;
}> = ({ action, isExecuted, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);

  if (!action) return null;

  const handleAction = async (confirmed: boolean) => {
    setSubmitting(true);
    try {
      await onConfirm(action.confirmationToken, confirmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {action.title || 'Authorized Action Preview'}
            </h4>
            {isExecuted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Check className="h-3 w-3" />
                Executed & Logged
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                Confirmation Required
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{action.description}</p>

          {action.parameters && (
            <div className="mt-3 rounded-lg border border-amber-200/80 dark:border-amber-800/80 bg-white/70 dark:bg-slate-900/60 p-2.5 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Action Parameters:
              </span>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(action.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                    <dt className="text-slate-500 capitalize">{key}:</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {String(value ?? '-')}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {!isExecuted && (
            <div className="mt-3.5 flex items-center justify-end gap-2.5">
              <button
                disabled={submitting}
                onClick={() => handleAction(false)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"
              >
                Cancel Action
              </button>
              <button
                disabled={submitting}
                onClick={() => handleAction(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Confirm & Execute</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AiAssistantView: React.FC = () => {
  const { user, role, selectedBranch, selectedAcademicYear } = useAuth();

  // State
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<AiSuggestedPrompt[]>([]);
  const [searchConvText, setSearchConvText] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and suggestions on mount
  const loadConversations = useCallback(async () => {
    try {
      const list = await fetchAiConversationsApi();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  }, [activeConversationId]);

  const loadPrompts = useCallback(async () => {
    try {
      const p = await fetchAiSuggestedPromptsApi();
      setSuggestedPrompts(p);
    } catch (err) {
      console.warn('Failed to load prompts:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadPrompts();
  }, [loadConversations, loadPrompts]);

  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setLoadingDetail(true);
    setErrorBanner(null);
    setShowMobileSidebar(false);
    try {
      const detail = await fetchAiConversationDetailApi(convId);
      if (detail) {
        setMessages(detail.messages || []);
      }
    } catch (err: any) {
      setErrorBanner('Failed to load conversation history.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleNewConversation = async () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setErrorBanner(null);
    setShowMobileSidebar(false);
    textareaRef.current?.focus();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');
    setErrorBanner(null);

    // Optimistically append user message
    const tempUserMsg: AiChatMessage = {
      id: 'temp-' + Date.now(),
      sender: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const branchId = selectedBranch && /^\d+$/.test(selectedBranch) ? parseInt(selectedBranch) : undefined;
      const ayId = selectedAcademicYear && /^\d+$/.test(selectedAcademicYear) ? parseInt(selectedAcademicYear) : undefined;

      const res = await sendAiChatMessageApi({
        conversationId: activeConversationId || undefined,
        message: text,
        branchId,
        academicYearId: ayId,
      });

      if (!activeConversationId) {
        setActiveConversationId(res.conversationId);
      }

      const assistantMsg: AiChatMessage = {
        id: res.messageId,
        sender: 'assistant',
        content: res.reply,
        visualType: res.visualType,
        visualData: res.visualData,
        toolCalls: res.toolCallsExecuted,
        pendingAction: res.pendingAction,
        createdAt: res.timestamp,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadConversations();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Error executing request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (token: string, confirmed: boolean) => {
    try {
      const res = await confirmAiActionApi(token, confirmed);
      if (res.success) {
        // Mark pending action in current messages
        setMessages((prev) =>
          prev.map((m) =>
            m.pendingAction?.confirmationToken === token
              ? { ...m, isActionExecuted: confirmed }
              : m
          )
        );
        // Append confirmation receipt from AI
        const receiptMsg: AiChatMessage = {
          id: 'receipt-' + Date.now(),
          sender: 'assistant',
          content: `✅ ${res.message}`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, receiptMsg]);
      } else {
        alert(res.message || 'Action failed.');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm action.');
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleRenameSubmit = async (convId: string) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    await renameAiConversationApi(convId, editingTitle.trim());
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: editingTitle.trim() } : c))
    );
    setEditingConvId(null);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    await deleteAiConversationApi(convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      handleNewConversation();
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchConvText.trim()) return conversations;
    const f = searchConvText.toLowerCase();
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(f) || (c.lastMessage && c.lastMessage.toLowerCase().includes(f))
    );
  }, [conversations, searchConvText]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-4.25rem)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile Drawer Overlay */}
      {showMobileSidebar && (
        <div
          onClick={() => setShowMobileSidebar(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR: Conversation History */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0 ${
          showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                School AI
              </h2>
              <p className="text-[10px] text-slate-500">ERP Copilot • v2.0</p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="lg:hidden rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 space-y-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={handleNewConversation}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchConvText}
              onChange={(e) => setSearchConvText(e.target.value)}
              placeholder="Search chat history..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEditing = editingConvId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group relative flex items-center justify-between rounded-xl p-2.5 cursor-pointer text-xs transition-all ${
                  isActive
                    ? 'bg-sky-50 font-semibold text-sky-900 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                  <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(conv.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(conv.id)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-full rounded border border-sky-500 bg-white px-1 text-xs text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-white"
                    />
                  ) : (
                    <div className="truncate">
                      <p className="truncate text-xs">{conv.title}</p>
                      {conv.lastMessage && (
                        <p className="truncate text-[10px] text-slate-400 font-normal mt-0.5">
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConvId(conv.id);
                        setEditingTitle(conv.title);
                      }}
                      title="Rename"
                      className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      title="Delete"
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No chat history found.
            </div>
          )}
        </div>

        {/* Sidebar Footer: Authenticated User Badge */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs dark:bg-sky-900 dark:text-sky-200">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || 'Authorized User'}
              </p>
              <p className="text-[10px] font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                {role || 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Chat Header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeConv?.title || 'School ERP Assistant'}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live ERP Connected
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Authorized Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{role || 'Administrator'}</span>
                {selectedBranch ? ` • Branch: ${selectedBranch}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Conversation</span>
            </button>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Welcome Hero when no messages */}
          {messages.length === 0 && !loadingDetail && (
            <div className="mx-auto max-w-2xl py-8 text-center space-y-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  How can I assist you with the School ERP today?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  I am directly integrated with all modules: Attendance, Fees & Finance, Examination Results, Timetables, Transport Routes, Library Stock, and Staff.
                </p>
              </div>

              {/* Role-tailored Suggested Prompts Grid */}
              <div className="pt-2">
                <div className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Suggested Questions for {role || 'Your Role'}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p.prompt)}
                      className="group flex flex-col text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-sky-500 hover:bg-sky-50/50 hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                          {p.prompt}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                        {p.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isCopied = copiedMsgId === msg.id;

            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-bl-none'
                  }`}
                >
                  {/* Tool execution badge */}
                  {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {msg.toolCalls.map((tc, tcIdx) => (
                        <span
                          key={tcIdx}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>{tc.toolName}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Main text content */}
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}

                  {/* Dynamic Visualizations: Table or Chart */}
                  {!isUser && msg.visualType === 'table' && msg.visualData && (
                    <DynamicTable data={msg.visualData} />
                  )}
                  {!isUser && msg.visualType === 'chart' && msg.visualData && (
                    <DynamicChart data={msg.visualData} />
                  )}

                  {/* Authorized Write Action Preview Card */}
                  {!isUser && msg.pendingAction && (
                    <ActionPreviewCard
                      action={msg.pendingAction}
                      isExecuted={msg.isActionExecuted}
                      onConfirm={handleConfirmAction}
                    />
                  )}

                  {/* Message Footer: Timestamp & Copy Button */}
                  <div className={`mt-2 flex items-center justify-between gap-2 text-[10px] ${isUser ? 'text-sky-200' : 'text-slate-400'}`}>
                    <span>
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity flex items-center gap-1"
                      >
                        {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-sky-100 text-sky-800 font-bold text-xs dark:bg-sky-950 dark:text-sky-200">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-none border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                  <span>Consulting ERP databases & calculating response...</span>
                </div>
              </div>
            </div>
          )}

          {errorBanner && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorBanner}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="flex items-center gap-1 font-semibold text-rose-800 hover:underline dark:text-rose-200"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="mx-auto max-w-4xl"
          >
            <div className="relative flex items-center rounded-2xl border border-slate-300 bg-slate-50 shadow-xs focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-900 transition-all">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask anything about students, attendance, fee dues, exams, transport, timetable..."
                className="max-h-32 min-h-[46px] w-full resize-none bg-transparent px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none dark:text-white"
              />
              <div className="flex items-center pr-2">
                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              Responses are verified against live ERP records. Role-based permissions strictly enforced.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};
