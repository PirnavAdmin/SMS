import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, ShieldCheck, Key, RefreshCw, Search, Building2, UserCheck,
  CheckCircle2, Lock, X, AlertCircle, SearchX, KeyRound, Plus
} from 'lucide-react';
import { SchoolItem, AdminItem, fetchSchoolsApi, fetchAdminsApi } from '../../../api/superadmin';
import { validateSearchQuery } from '../../../utils/validation';
import { CustomerLoginModal } from './CustomerLoginModal';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const SuperAdminDomainsView: React.FC = () => {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSearchError(undefined);
    setCurrentPage(1);
    loadData();
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

  const totalPages = Math.ceil(filteredSchools.length / rowsPerPage) || 1;

  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSchools.slice(start, start + rowsPerPage);
  }, [filteredSchools, currentPage, rowsPerPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-24">
      
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
          onClick={handleRefresh}
          className="w-9 h-9 rounded-2xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-all cursor-pointer active:scale-95"
          title="Reset and Refresh Domains"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Search Bar & Header Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Managed School Domains</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-500/20">
              {filteredSchools.length} {filteredSchools.length === 1 ? 'Portal' : 'Portals'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <div className="relative flex items-center">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${searchError ? 'text-rose-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search domain or school name..."
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 text-center">School</th>
                <th className="p-3 text-center">Subdomain URL</th>
                <th className="p-3 text-center">SSL / Status</th>
                <th className="p-3 text-center">Customer Administrator</th>
                <th className="p-3 text-center">Admin Email</th>
                <th className="p-3 text-center">Customer Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <LoadingSpinner text="Loading..." />
                  </td>
                </tr>
              ) : searchError ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <SearchX className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">Invalid Search Keyword</p>
                      <p className="text-[11px] text-slate-400 font-normal">Enter valid letters or numbers in the search field above to view matching domains.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No Matching Domains</p>
                          <p className="text-xs text-slate-400">No managed portals found matching "{searchTerm}". Try checking the school name or code.</p>
                          <button
                            onClick={handleClearSearch}
                            className="mt-2 px-3 py-1.5 rounded-xl btn-glass-secondary text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Reset Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                            <Globe className="w-6 h-6" />
                          </div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">No Managed Tenant Domains Configured</p>
                          <p className="text-xs text-slate-400">When client schools register or are added, their dedicated subdomains and SSL status appear here.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSchools.map(school => {
                  const assignedAdmin = admins.find(a => a.schoolId === school.schoolId);

                  return (
                    <tr key={school.schoolId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                        <div className="inline-flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>{school.schoolName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        <a
                          href={`/?tenant=${encodeURIComponent(school.schoolCode.toLowerCase())}&portal=customer#login`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline inline-flex items-center gap-1.5"
                          title={`Open ${school.schoolName} Customer Portal`}
                        >
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>https://{school.schoolCode.toLowerCase()}.sms.portal</span>
                        </a>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active SSL
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-900 dark:text-white">
                        {assignedAdmin ? assignedAdmin.fullName : (school.principalName || 'Administrator')}
                      </td>
                      <td className="p-3 text-center text-slate-500">
                        {assignedAdmin?.email || school.email || 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          {assignedAdmin ? (
                            <button
                              onClick={() => setSelectedSchoolForLogin(school)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl btn-glass-secondary text-sky-600 dark:text-sky-400 hover:text-sky-700 active:scale-95 transition-all cursor-pointer shadow-xs"
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
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination & Rows Per Page Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {filteredSchools.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredSchools.length)} of {filteredSchools.length} entries
          </span>

          <div className="flex items-center gap-4">
            {/* Rows Per Page grouped in Footer */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Pagination Controls - Hidden or disabled when 0 records */}
            {filteredSchools.length > 0 ? (
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
            ) : null}
          </div>
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
