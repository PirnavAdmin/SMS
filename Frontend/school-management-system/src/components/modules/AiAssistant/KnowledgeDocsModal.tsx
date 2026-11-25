import React, { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import {
  deleteAiDocumentApi,
  fetchAiDocumentsApi,
  IndexedPolicyDocument,
  syncAiCircularsApi,
  uploadAiDocumentApi,
} from '../../../api/aiAssistant';

export const KnowledgeDocsModal: React.FC<{
  open: boolean;
  canManage: boolean;
  onClose: () => void;
}> = ({ open, canManage, onClose }) => {
  const [docs, setDocs] = useState<IndexedPolicyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('policy');
  const [allowedRoles, setAllowedRoles] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDocs(await fetchAiDocumentsApi());
    } catch (e: any) {
      setError(e?.message || 'Unable to load indexed documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  if (!open) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadAiDocumentApi(file, category, allowedRoles);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSyncCirculars = async () => {
    setUploading(true);
    setError(null);
    try {
      await syncAiCircularsApi();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Circular sync failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteAiDocumentApi(docId);
      setDocs((prev) => prev.filter((d) => d.doc_id !== docId));
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                School Policy & RAG Knowledge Base
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permission-scoped policies, circulars, and uploaded PDFs/DOCX/TXT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
              {error}
            </div>
          )}

          {canManage && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="policy">School Policy</option>
                <option value="fee_policy">Fee Policy</option>
                <option value="academic_policy">Academic Regulation</option>
                <option value="hr_procedure">HR Procedure</option>
              </select>
              <input
                type="text"
                value={allowedRoles}
                onChange={(e) => setAllowedRoles(e.target.value)}
                placeholder="Roles e.g. All or Admin,HR"
                className="w-44 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploading ? 'Indexing...' : 'Upload Document'}</span>
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleSyncCirculars}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${uploading ? 'animate-spin' : ''}`} />
                <span>Sync ERP Circulars</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading knowledge index...</div>
          ) : docs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No indexed documents visible for your role.</div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.doc_id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-800"
                >
                  <div className="min-w-0 pr-3">
                    <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {doc.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                        {doc.category}
                      </span>
                      <span>{doc.chunk_count} chunk(s)</span>
                      <span>Roles: {doc.allowed_roles.join(', ')}</span>
                    </div>
                  </div>
                  {canManage && !doc.doc_id.startsWith('policy_') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.doc_id)}
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      title="Delete indexed document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
