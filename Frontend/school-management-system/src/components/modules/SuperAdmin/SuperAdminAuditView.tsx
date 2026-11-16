import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Clock, Filter, User, Building2, CheckCircle2 } from 'lucide-react';
import { AuditLogItem, fetchAuditLogsApi } from '../../../api/superadmin';

export const SuperAdminAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredLogs = logs.filter(l =>
    (l.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (l.details?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (l.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (l.schoolName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
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
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit action, user or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none w-72 dark:text-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">{filteredLogs.length} Logged Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
                <th className="p-4">School Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No audit logs matching search.</td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.auditLogId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {l.userName || 'System'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {l.userRole || 'SuperAdmin'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-orange-600">
                      {l.action}
                    </td>
                    <td className="p-4 max-w-md truncate text-slate-600 dark:text-slate-300">
                      {l.details}
                    </td>
                    <td className="p-4 text-slate-500">
                      {l.schoolName || 'Global Multi-Tenant'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
