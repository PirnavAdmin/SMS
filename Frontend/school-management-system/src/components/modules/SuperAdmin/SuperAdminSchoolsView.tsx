import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Search, Filter, Download, Edit3, Trash2, Eye,
  CheckCircle2, XCircle, ArrowUpDown, ChevronDown, MoreVertical,
  Globe, Mail, Phone, Users, ShieldAlert, Sparkles, RefreshCw, Calendar,
  KeyRound, X, AlertCircle, SearchX
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  SchoolItem,
  fetchSchoolsApi,
  deleteSchoolApi,
  toggleSchoolStatusApi,
  fetchSchoolUsersSummaryApi,
  fetchPackagesApi,
  PackagePlan
} from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';
import { validateSearchQuery } from '../../../utils/validation';
import { AddSchoolModal } from './AddSchoolModal';
import { CustomerLoginModal } from './CustomerLoginModal';
import { ConfirmModal } from '../../common/ConfirmModal';

interface SuperAdminSchoolsViewProps {
  onNavigate?: (module: string) => void;
}

export const SuperAdminSchoolsView: React.FC<SuperAdminSchoolsViewProps> = ({ onNavigate }) => {
  const { addToast } = useToast();

  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [planFilter, setPlanFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'users'>('date');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolItem | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<SchoolItem | null>(null);
  const [viewingSchool, setViewingSchool] = useState<SchoolItem | null>(null);
  const [loginModalSchool, setLoginModalSchool] = useState<SchoolItem | null>(null);
  const [schoolUsersSummary, setSchoolUsersSummary] = useState<any>(null);

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

  const loadSchools = async () => {
    setLoading(true);
    try {
      const [data, pkgs] = await Promise.all([
        fetchSchoolsApi(),
        fetchPackagesApi().catch(() => [])
      ]);
      setSchools(data || []);
      setPackages(pkgs || []);
    } catch (err: any) {
      console.error('Failed to load schools:', err);
      addToast('error', 'Error', 'Failed to load schools. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  // Filtered & Sorted Schools
  const filteredSchools = useMemo(() => {
    if (searchError) return [];
    const term = searchTerm.toLowerCase().trim();

    return schools.filter(s => {
      const matchesSearch = !term ||
        (s.schoolName?.toLowerCase() || '').includes(term) ||
        (s.schoolCode?.toLowerCase() || '').includes(term) ||
        (s.email?.toLowerCase() || '').includes(term) ||
        (s.principalName?.toLowerCase() || '').includes(term);

      const matchesStatus =
        statusFilter === 'All' ? true : s.status?.toLowerCase() === statusFilter.toLowerCase();

      const schoolPlan = s.planName || 'Unassigned';
      const matchesPlan =
        planFilter === 'All' ? true : schoolPlan.toLowerCase() === planFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPlan;
    }).sort((a, b) => {
      if (sortBy === 'name') return (a.schoolName || '').localeCompare(b.schoolName || '');
      if (sortBy === 'users') return (b.totalUsersCount || 0) - (a.totalUsersCount || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [schools, searchTerm, searchError, statusFilter, planFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / rowsPerPage));
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSchools.slice(start, start + rowsPerPage);
  }, [filteredSchools, currentPage, rowsPerPage]);

  // Statistics calculation for KPI cards
  const stats = useMemo(() => {
    const total = schools.length;
    const active = schools.filter(s => s.status?.toLowerCase() === 'active').length;
    const inactive = total - active;
    const uniqueLocations = new Set(schools.map(s => (s.address || '').split(',').pop()?.trim()).filter(Boolean)).size || (total > 0 ? 1 : 0);
    return { total, active, inactive, locations: uniqueLocations };
  }, [schools]);

  // Status toggle handler
  const handleToggleStatus = async (school: SchoolItem) => {
    const nextStatus = school.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await toggleSchoolStatusApi(school.schoolId, nextStatus);
      setSchools(prev => prev.map(s => s.schoolId === school.schoolId ? { ...s, status: nextStatus } : s));
      addToast('success', 'Status Updated', `${school.schoolName} is now ${nextStatus}.`);
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Failed to update school status.');
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingSchool) return;
    try {
      await deleteSchoolApi(deletingSchool.schoolId);
      setSchools(prev => prev.filter(s => s.schoolId !== deletingSchool.schoolId));
      addToast('success', 'School Removed', `${deletingSchool.schoolName} has been deleted.`);
      setDeletingSchool(null);
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Failed to delete school.');
    }
  };

  // View details
  const handleViewSchool = async (school: SchoolItem) => {
    setViewingSchool(school);
    try {
      const summary = await fetchSchoolUsersSummaryApi(school.schoolId);
      setSchoolUsersSummary(summary);
    } catch (err) {
      setSchoolUsersSummary(null);
    }
  };

  // Excel Export Handler
  const handleExportToExcel = () => {
    if (filteredSchools.length === 0) {
      addToast('info', 'Export', 'No schools data available to export.');
      return;
    }

    const exportRows = filteredSchools.map((s, idx) => ({
      'S.No': idx + 1,
      'School ID': s.schoolId,
      'School Name': s.schoolName,
      'School Code': s.schoolCode,
      'Email': s.email || 'N/A',
      'Phone': s.phone || 'N/A',
      'Account URL': `${s.schoolCode}.sms.portal`,
      'Plan': s.planName ? `${s.planName} (${s.planType || 'Monthly'})` : 'Unassigned',
      'Principal': s.principalName || 'N/A',
      'Address': s.address || 'N/A',
      'Status': s.status,
      'Admins Count': s.adminsCount || 0,
      'Teachers Count': s.teachersCount || 0,
      'Students Count': s.studentsCount || 0,
      'Total Users': s.totalUsersCount || 0,
      'Registration Date': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registered Schools');
    XLSX.writeFile(workbook, `Schools_List_${new Date().toISOString().slice(0, 10)}.xlsx`);

    addToast('success', 'Export Completed', 'Schools dataset exported to Excel successfully.');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedSchools.map(s => s.schoolId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">
      
      {/* Top Header & Breadcrumbs matching referral Image 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="hover:text-sky-600 cursor-pointer" onClick={() => onNavigate && onNavigate('superadmin-dashboard')}>
              Super Admin
            </span>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Schools</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Schools & Educational Institutions
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSchools}
            className="w-9 h-9 rounded-2xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-all cursor-pointer active:scale-95"
            title="Refresh Schools"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 rounded-2xl btn-glass-secondary text-slate-700 dark:text-slate-300 text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setEditingSchool(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl btn-glass-primary text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add School</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Schools */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Schools
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {stats.total}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          {/* Mini Sparkline indicator */}
          <div className="mt-2.5 flex items-end gap-1.5 h-5">
            {[40, 65, 55, 80, 70, 90, 85, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-sky-500/20 dark:bg-sky-500/30 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Active Schools */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Schools
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {stats.active}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-end gap-1.5 h-5">
            {[60, 75, 70, 85, 90, 95, 92, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Inactive Schools */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Inactive Schools
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {stats.inactive}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-end gap-1.5 h-5">
            {[80, 60, 40, 30, 20, 15, 25, 10].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-rose-500/20 dark:bg-rose-500/30 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* School Locations */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                School Locations / Cities
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
                {stats.locations}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-end gap-1.5 h-5">
            {[30, 50, 45, 60, 75, 80, 85, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-sky-500/20 dark:bg-sky-500/30 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Filters & Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Row Per Page</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input with Validation & Clear Button */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${searchError ? 'text-rose-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={searchTerm}
                  maxLength={30}
                  onChange={e => handleSearchChange(e.target.value)}
                  className={`w-48 focus:w-64 pl-8 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all ${
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
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1 pl-1 animate-in fade-in duration-150 absolute -bottom-5 left-0 whitespace-nowrap z-20">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{searchError}</span>
                </p>
              )}
            </div>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={e => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            >
              <option value="All">Select Plan (All)</option>
              {packages.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            >
              <option value="All">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            >
              <option value="date">Sort By: Last 7 Days</option>
              <option value="name">Sort By: Name (A-Z)</option>
              <option value="users">Sort By: Total Users</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedSchools.length > 0 && selectedIds.length === paginatedSchools.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="p-3 text-center">School Name</th>
                <th className="p-3 text-center">Email</th>
                <th className="p-3 text-center">Account URL</th>
                <th className="p-3 text-center">Plan</th>
                <th className="p-3 text-center">Created Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading registered institutions...</span>
                    </div>
                  </td>
                </tr>
              ) : searchError ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-rose-500 dark:text-rose-400">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <p className="font-bold text-xs">{searchError}</p>
                      <p className="text-[11px] text-slate-400 font-normal">Please enter a valid search criteria (alphanumeric, max 30 characters).</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No Matching Institutions Found</p>
                          <p className="text-xs text-slate-400">No registered schools match your search query "{searchTerm}". Try checking for spelling or clear search filters.</p>
                          <button
                            onClick={handleClearSearch}
                            className="mt-2 px-3.5 py-1.5 rounded-xl btn-glass-secondary text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Reset Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">No Educational Institutions Registered Yet</p>
                          <p className="text-xs text-slate-400">No client schools or company tenants are onboarded yet. Click "Add School" above to register the first institution and provision administrator credentials.</p>
                          <button
                            onClick={() => {
                              setEditingSchool(null);
                              setIsAddModalOpen(true);
                            }}
                            className="mt-2 px-4 py-2 rounded-xl btn-glass-primary text-white text-xs font-bold shadow-md cursor-pointer"
                          >
                            Add First School
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSchools.map(school => {
                  const planName = school.planName
                    ? `${school.planName}${school.planType ? ` (${school.planType})` : ''}`
                    : 'Unassigned';
                  const isChecked = selectedIds.includes(school.schoolId);
                  const isSchoolActive = school.status?.toLowerCase() === 'active';

                  return (
                    <tr
                      key={school.schoolId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(school.schoolId)}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                      </td>

                      {/* School Name */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="font-bold text-slate-900 dark:text-white hover:text-sky-600 cursor-pointer" onClick={() => handleViewSchool(school)}>
                            {school.schoolName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">Code: {school.schoolCode}</p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3 text-center font-medium text-slate-600 dark:text-slate-300">
                        {school.email || 'N/A'}
                      </td>

                      {/* Account URL */}
                      <td className="p-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {school.schoolCode}.sms.portal
                      </td>

                      {/* Plan & Upgrade Pill */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {planName}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSchool(school);
                              setIsAddModalOpen(true);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 dark:text-sky-300 dark:bg-sky-950/60 rounded-lg transition-colors cursor-pointer"
                          >
                            Upgrade
                          </button>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="p-3 text-center text-slate-500 dark:text-slate-400">
                        {school.createdAt ? new Date(school.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(school)}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isSchoolActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSchoolActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{school.status}</span>
                        </button>
                      </td>

                      {/* Actions with Customer Login Access Handover */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setLoginModalSchool(school)}
                            title="Customer Login Access & Credentials Handover"
                            className="w-8 h-8 rounded-xl btn-glass-secondary flex items-center justify-center text-amber-600 dark:text-amber-400 active:scale-90 transition-transform cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewSchool(school)}
                            title="View School Details"
                            className="w-8 h-8 rounded-xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSchool(school);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit School"
                            className="w-8 h-8 rounded-xl btn-glass-secondary flex items-center justify-center text-sky-600 hover:text-sky-700 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSchool(school)}
                            title="Delete School"
                            className="w-8 h-8 rounded-xl btn-glass-secondary flex items-center justify-center text-rose-500 hover:text-rose-600 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredSchools.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredSchools.length)} of {filteredSchools.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Add / Edit School Modal */}
      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSchool(null);
        }}
        onSchoolSaved={(saved) => {
          setSchools(prev => {
            const exists = prev.some(s => s.schoolId === saved.schoolId);
            if (exists) {
              return prev.map(s => s.schoolId === saved.schoolId ? saved : s);
            }
            return [saved, ...prev];
          });
        }}
        editingSchool={editingSchool}
      />

      {/* Customer Login Access & Handover Modal */}
      <CustomerLoginModal
        isOpen={!!loginModalSchool}
        school={loginModalSchool}
        onClose={() => setLoginModalSchool(null)}
        onAdminUpdated={loadSchools}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingSchool}
        onClose={() => setDeletingSchool(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Educational Institution"
        message={`Are you sure you want to permanently delete "${deletingSchool?.schoolName}"? All associated classes, students, and admin accounts will be affected.`}
        confirmText="Delete School"
        type="danger"
      />

      {/* View School Details Drawer / Modal */}
      {viewingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg">
                  {viewingSchool.schoolName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingSchool.schoolName}</h3>
                  <p className="text-xs text-slate-500">Code: {viewingSchool.schoolCode} &bull; Status: {viewingSchool.status}</p>
                </div>
              </div>
              <button onClick={() => setViewingSchool(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-[11px] text-slate-500">Students</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{schoolUsersSummary?.studentsCount ?? viewingSchool.studentsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-[11px] text-slate-500">Teachers</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{schoolUsersSummary?.teachersCount ?? viewingSchool.teachersCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-[11px] text-slate-500">Staff</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{schoolUsersSummary?.staffCount ?? viewingSchool.staffCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                <p className="text-[11px] text-slate-500">Admins</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{schoolUsersSummary?.adminsCount ?? viewingSchool.adminsCount}</p>
              </div>
            </div>

            {/* School Contact Details */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p><strong className="text-slate-800 dark:text-slate-200">Email:</strong> {viewingSchool.email || 'N/A'}</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Phone:</strong> {viewingSchool.phone || 'N/A'}</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Website:</strong> {viewingSchool.website || 'N/A'}</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Principal:</strong> {viewingSchool.principalName || 'N/A'}</p>
              <p><strong className="text-slate-800 dark:text-slate-200">Address:</strong> {viewingSchool.address || 'N/A'}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewingSchool(null)}
                className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
