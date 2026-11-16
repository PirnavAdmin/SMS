import React, { useState, useEffect } from 'react';
import { Activity, Users, GraduationCap, Briefcase, UserCheck, Shield, Building2, RefreshCw, HardDrive, Cpu, Database } from 'lucide-react';
import { fetchUserStatisticsApi, UserStatisticsResponse, fetchSchoolsApi, SchoolItem } from '../../../api/superadmin';

export const SuperAdminMetricsView: React.FC = () => {
  const [stats, setStats] = useState<UserStatisticsResponse | null>(null);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
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
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
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

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
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

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
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

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total System Users</p>
              <h3 className="text-2xl font-black text-orange-600 mt-1">
                {stats?.totalUsers ?? schools.reduce((a, b) => a + (b.totalUsersCount || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* School-Wise Usage Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Tenant Usage Breakdown by Educational Institution
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">School</th>
                <th className="p-4">Code</th>
                <th className="p-4">Students</th>
                <th className="p-4">Teachers</th>
                <th className="p-4">Staff</th>
                <th className="p-4">Admins</th>
                <th className="p-4">Total Users</th>
                <th className="p-4">Cloud Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {schools.map(s => (
                <tr key={s.schoolId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    <span>{s.schoolName}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-500">{s.schoolCode}</td>
                  <td className="p-4 font-bold text-blue-600">{s.studentsCount}</td>
                  <td className="p-4 font-bold text-emerald-600">{s.teachersCount}</td>
                  <td className="p-4 font-medium">{s.staffCount}</td>
                  <td className="p-4 font-medium">{s.adminsCount}</td>
                  <td className="p-4 font-black text-slate-900 dark:text-white">{s.totalUsersCount}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Healthy Pod
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
