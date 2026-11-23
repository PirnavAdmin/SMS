import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Search, RefreshCw, X, AlertCircle, SearchX } from 'lucide-react';
import { AuditLogItem, fetchAuditLogsApi } from '../../../api/superadmin';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { validateSearchQuery } from '../../../utils/validation';

export const SuperAdminAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogsApi();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (searchError) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return logs;
    return logs.filter(l =>
      (l.action?.toLowerCase() || '').includes(term) ||
      (l.details?.toLowerCase() || '').includes(term) ||
      (l.userName?.toLowerCase() || '').includes(term) ||
      (l.schoolName?.toLowerCase() || '').includes(term)
    );
  }, [logs, searchTerm, searchError]);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
    if (!val.trim()) {
      setSearchError(undefined);
    } else {
      const res = validateSearchQuery(val.trim(), 30);
      setSearchError(res.isValid ? undefined : (res.error || 'Please enter a valid search keyword.'));
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchError(undefined);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">System Security & Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Live System Audit Logs
          </h1>
        </div>

        <button
          onClick={loadLogs}
          className="w-9 h-9 rounded-2xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-all cursor-pointer active:scale-95"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {filteredLogs.length} Event{filteredLogs.length === 1 ? '' : 's'} Logged
            </span>
          </div>

          <div className="flex flex-col">
            <div className="relative flex items-center">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${searchError ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search audit action, user or details..."
                value={searchTerm}
                maxLength={30}
                onChange={e => handleSearchChange(e.target.value)}
                className={`w-72 pl-8 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all ${
                  searchError
                    ? 'border-rose-500 ring-1 ring-rose-500/20 text-rose-900 dark:text-rose-100 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-500'
                } outline-none font-medium`}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchError && (
              <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1.5 pl-1 animate-in fade-in duration-150">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-center border-collapse text-xs table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 text-center w-[16%]">Timestamp</th>
                <th className="p-3 text-center w-[15%]">User</th>
                <th className="p-3 text-center w-[12%]">Role</th>
                <th className="p-3 text-center w-[18%]">Action</th>
                <th className="p-3 text-center w-[24%]">Details</th>
                <th className="p-3 text-center w-[15%]">School Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <LoadingSpinner text="Loading..." />
                  </td>
                </tr>
              ) : searchError || paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                        {searchTerm ? <SearchX className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {searchTerm ? 'No Matching Audit Logs' : 'No Security Audit Events Logged Yet'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchTerm
                          ? `No logged actions or system events match "${searchTerm}".`
                          : 'Administrative actions, institutional modifications, and security events will be automatically recorded here.'}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={handleClearSearch}
                          className="mt-2 px-3 py-1.5 rounded-xl btn-glass-secondary text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          Reset Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(l => (
                  <tr key={l.auditLogId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center text-slate-500 truncate" title={new Date(l.timestamp).toLocaleString()}>
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white truncate" title={l.userName || 'System'}>
                      {l.userName || 'System'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {l.userRole || 'SuperAdmin'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold text-sky-600 truncate" title={l.action}>
                      {l.action}
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-300 truncate" title={l.details}>
                      {l.details}
                    </td>
                    <td className="p-3 text-center text-slate-500 truncate" title={l.schoolName || 'Global Multi-Tenant'}>
                      {l.schoolName || 'Global Multi-Tenant'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white font-medium cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
