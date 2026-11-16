import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, ShieldCheck, Key, RefreshCw, Search, Building2, UserCheck,
  CheckCircle2, Lock, X, AlertCircle, SearchX, KeyRound, Plus
} from 'lucide-react';
import { SchoolItem, AdminItem, fetchSchoolsApi, fetchAdminsApi } from '../../../api/superadmin';
import { validateSearchQuery } from '../../../utils/validation';
import { CustomerLoginModal } from './CustomerLoginModal';

export const SuperAdminDomainsView: React.FC = () => {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);

  // Selected school for Customer Login Modal
  const [selectedSchoolForLogin, setSelectedSchoolForLogin] = useState<SchoolItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, aData] = await Promise.all([
        fetchSchoolsApi().catch(() => []),
        fetchAdminsApi().catch(() => [])
      ]);
      setSchools(sData || []);
      setAdmins(aData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchError(undefined);
    } else {
      const res = validateSearchQuery(value.trim(), 30);
      setSearchError(res.isValid ? undefined : (res.error || 'Enter a valid search term.'));
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchError(undefined);
  };

  const filteredSchools = useMemo(() => {
    if (searchError) return [];
    const term = searchTerm.toLowerCase().trim();
    return schools.filter(s =>
      !term ||
      (s.schoolName?.toLowerCase() || '').includes(term) ||
      (s.schoolCode?.toLowerCase() || '').includes(term)
    );
  }, [schools, searchTerm, searchError]);

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
            School Domains & Customer Login Access
          </h1>
        </div>

        <button
          onClick={loadData}
          className="w-9 h-9 rounded-2xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-all cursor-pointer active:scale-95"
          title="Refresh Domains"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Search Bar & Header Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="relative">
            <div className="relative flex items-center">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${searchError ? 'text-rose-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search domain or school..."
                value={searchTerm}
                maxLength={30}
                onChange={e => handleSearchChange(e.target.value)}
                className={`w-64 pl-8 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all ${
                  searchError
                    ? 'border-rose-500 ring-1 ring-rose-500/20 text-rose-900 dark:text-rose-100 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500'
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
              <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1 pl-1 animate-in fade-in duration-150 absolute -bottom-5 left-0 whitespace-nowrap z-20">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}
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
                <th className="p-4">Customer Administrator</th>
                <th className="p-4">Admin Email</th>
                <th className="p-4 text-center">Customer Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading portals & domains...</span>
                    </div>
                  </td>
                </tr>
              ) : searchError ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-rose-500 dark:text-rose-400">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <p className="font-bold text-xs">{searchError}</p>
                      <p className="text-[11px] text-slate-400 font-normal">Please enter a valid search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {searchTerm ? (
                        <>
                          <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">No domains matching "{searchTerm}"</p>
                          <p className="text-xs text-slate-400">Try adjusting your keyword.</p>
                          <button
                            onClick={handleClearSearch}
                            className="mt-2 px-3 py-1.5 rounded-xl btn-glass-secondary text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Reset Search
                          </button>
                        </>
                      ) : (
                        <>
                          <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">No managed portals registered.</p>
                        </>
                      )}
                    </div>
                  </td>
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
                            onClick={() => setSelectedSchoolForLogin(school)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl btn-glass-secondary text-amber-600 dark:text-amber-400 hover:text-amber-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Customer Access Slip</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedSchoolForLogin(school)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl btn-glass-primary text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Customer Login</span>
                          </button>
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

      {/* Customer Login Access & Handover Modal */}
      <CustomerLoginModal
        isOpen={!!selectedSchoolForLogin}
        school={selectedSchoolForLogin}
        onClose={() => setSelectedSchoolForLogin(null)}
        onAdminUpdated={loadData}
      />

    </div>
  );
};
