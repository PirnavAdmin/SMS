import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Users, GraduationCap, Briefcase, UserCheck, Shield, Building2, RefreshCw, HardDrive, Cpu, Database } from 'lucide-react';
import { fetchUserStatisticsApi, UserStatisticsResponse, fetchSchoolsApi, SchoolItem } from '../../../api/superadmin';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const SuperAdminMetricsView: React.FC = () => {
  const [stats, setStats] = useState<UserStatisticsResponse | null>(null);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uStats, sList] = await Promise.all([
        fetchUserStatisticsApi().catch(() => null),
        fetchSchoolsApi().catch(() => [])
      ]);
      if (uStats) setStats(uStats);
      if (sList) setSchools(sList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPages = Math.ceil(schools.length / rowsPerPage) || 1;

  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return schools.slice(start, start + rowsPerPage);
  }, [schools, currentPage, rowsPerPage]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Tenant Usage Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Tenant Multi-School Usage Metrics</span>
            <span className="px-2 py-0.5 text-xs font-black bg-rose-600 text-white rounded-md">LIVE</span>
          </h1>
        </div>

        <button
          onClick={loadData}
          className="w-9 h-9 rounded-2xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-all cursor-pointer active:scale-95"
          title="Refresh Metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Enrolled Students</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.studentsCount ?? schools.reduce((a, b) => a + (b.studentsCount || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Faculty & Teachers</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.teachersCount ?? schools.reduce((a, b) => a + (b.teachersCount || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Administrative Staff</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats?.staffCount ?? schools.reduce((a, b) => a + (b.staffCount || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total System Users</p>
              <h3 className="text-2xl font-black text-sky-600 mt-1">
                {stats?.totalUsers ?? schools.reduce((a, b) => a + (b.totalUsersCount || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* School-Wise Usage Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Tenant Usage Breakdown by Educational Institution
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-500/20">
            {schools.length} {schools.length === 1 ? 'School' : 'Schools'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 text-center">School</th>
                <th className="p-3 text-center">Code</th>
                <th className="p-3 text-center">Students</th>
                <th className="p-3 text-center">Teachers</th>
                <th className="p-3 text-center">Staff</th>
                <th className="p-3 text-center">Admins</th>
                <th className="p-3 text-center">Total Users</th>
                <th className="p-3 text-center">Cloud Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <LoadingSpinner text="Loading..." />
                  </td>
                </tr>
              ) : paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                        <Activity className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">No Tenant Usage Metrics Recorded</p>
                      <p className="text-xs text-slate-400">No school usage data or enrolled users found yet. As client schools register students, staff, and teachers, aggregate metrics will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSchools.map(s => (
                  <tr key={s.schoolId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                      <div className="inline-flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>{s.schoolName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">{s.schoolCode}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{s.studentsCount}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{s.teachersCount}</td>
                    <td className="p-3 text-center font-medium">{s.staffCount}</td>
                    <td className="p-3 text-center font-medium">{s.adminsCount}</td>
                    <td className="p-3 text-center font-black text-slate-900 dark:text-white">{s.totalUsersCount}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                        Healthy Pod
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination & Rows Per Page Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {schools.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, schools.length)} of {schools.length} entries
          </span>

          <div className="flex items-center gap-4">
            {/* Rows Per Page Grouped in Footer */}
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
            {schools.length > 0 ? (
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

    </div>
  );
};
