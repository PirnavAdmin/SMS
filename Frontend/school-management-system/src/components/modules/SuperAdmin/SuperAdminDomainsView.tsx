import React, { useState, useEffect } from 'react';
import { Globe, ShieldCheck, Key, RefreshCw, Search, Building2, UserCheck, CheckCircle2, Lock } from 'lucide-react';
import { SchoolItem, AdminItem, fetchSchoolsApi, fetchAdminsApi, resetAdminPasswordApi } from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';

export const SuperAdminDomainsView: React.FC = () => {
  const { addToast } = useToast();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Password reset modal
  const [resetModalAdmin, setResetModalAdmin] = useState<AdminItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, aData] = await Promise.all([
        fetchSchoolsApi().catch(() => []),
        fetchAdminsApi().catch(() => [])
      ]);
      setSchools(sData);
      setAdmins(aData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalAdmin || !newPassword) return;
    if (newPassword.length < 6) {
      addToast('error', 'Validation Error', 'Password must be at least 6 characters.');
      return;
    }
    setIsResetting(true);
    try {
      await resetAdminPasswordApi(resetModalAdmin.userId, newPassword);
      addToast('success', 'Password Reset', `Password for ${resetModalAdmin.fullName} has been updated.`);
      setResetModalAdmin(null);
      setNewPassword('');
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredSchools = schools.filter(s =>
    (s.schoolName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.schoolCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Domain & Portals</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            School Domains & Administrator Credentials
          </h1>
        </div>

        <button
          onClick={loadData}
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
              placeholder="Search domain or school..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none w-64 dark:text-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">{filteredSchools.length} Managed Portals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">School</th>
                <th className="p-4">Subdomain URL</th>
                <th className="p-4">SSL / Status</th>
                <th className="p-4">Assigned Admin</th>
                <th className="p-4">Admin Email</th>
                <th className="p-4 text-center">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading domains...</td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No domains matching criteria.</td>
                </tr>
              ) : (
                filteredSchools.map(school => {
                  const assignedAdmin = admins.find(a => a.schoolId === school.schoolId);

                  return (
                    <tr key={school.schoolId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>{school.schoolName}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        https://{school.schoolCode}.sms.portal
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active SSL
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {assignedAdmin ? assignedAdmin.fullName : (school.principalName || 'Administrator')}
                      </td>
                      <td className="p-4 text-slate-500">
                        {assignedAdmin?.email || school.email || 'N/A'}
                      </td>
                      <td className="p-4 text-center">
                        {assignedAdmin ? (
                          <button
                            onClick={() => setResetModalAdmin(assignedAdmin)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-orange-600 hover:text-white hover:bg-orange-600 border border-orange-500/30 rounded-lg transition-colors"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Admin Account</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Reset Administrator Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a new secure password for <strong>{resetModalAdmin.fullName}</strong> ({resetModalAdmin.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalAdmin(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isResetting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
