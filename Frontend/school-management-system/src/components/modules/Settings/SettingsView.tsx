import React, { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon, Save, Database, Activity, RefreshCw, Building2, Plus, Edit, Trash2, CheckCircle, XCircle, Search, MapPin, Phone, Mail, X, Calendar, CheckCircle2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { AcademicYearMaster } from '../../../types';

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

const defaultCampuses: CampusItem[] = [
  { id: 'CMP-01', name: 'Main Campus', code: 'MAIN', address: '742 Evergreen Terrace, Knowledge City, NY 10001', phone: '+1 (555) 019-2834', email: 'main@stxaviers.edu', status: 'Active' },
  { id: 'CMP-02', name: 'North Branch', code: 'NORTH', address: '12 Executive Row, Knowledge City, NY 10002', phone: '+1 (555) 888-001', email: 'north@stxaviers.edu', status: 'Active' },
  { id: 'CMP-03', name: 'West Campus', code: 'WEST', address: '99 Mission Way, Knowledge Hub, NY 10003', phone: '+1 (555) 333-111', email: 'west@stxaviers.edu', status: 'Active' }
];

export const SettingsView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, auditLogs, academicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear, setCurrentAcademicYear } = useData();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState(schoolProfile);
  const [activeTab, setActiveTab] = useState<'profile' | 'campus' | 'academic-year' | 'backup' | 'audit'>('profile');

  // Academic Year Configuration States
  const [aySearch, setAySearch] = useState('');
  const [isAYModalOpen, setIsAYModalOpen] = useState(false);
  const [editingAY, setEditingAY] = useState<AcademicYearMaster | null>(null);
  const [deletingAY, setDeletingAY] = useState<AcademicYearMaster | null>(null);
  const [ayForm, setAyForm] = useState({
    academicYear: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming' as 'Upcoming' | 'Active' | 'Closed',
    description: '',
    isCurrentAcademicYear: false
  });

  // Campus Configuration States
  const [campuses, setCampuses] = useState<CampusItem[]>(() => {
    const saved = localStorage.getItem('school_campuses');
    return saved ? JSON.parse(saved) : defaultCampuses;
  });

  const [campusSearch, setCampusSearch] = useState('');
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [deletingCampus, setDeletingCampus] = useState<CampusItem | null>(null);

  const [campusForm, setCampusForm] = useState<{
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    status: 'Active'
  });

  // Sync campuses to localStorage and trigger Header sync event
  const syncCampuses = (updated: CampusItem[]) => {
    setCampuses(updated);
    localStorage.setItem('school_campuses', JSON.stringify(updated));

    // Sync managed_branches and inactive_branches for Header selector compatibility
    const allActive = updated.filter(c => c.status === 'Active').map(c => c.name);
    const allInactive = updated.filter(c => c.status === 'Inactive').map(c => c.name);
    const allManaged = updated.map(c => c.name);

    localStorage.setItem('managed_branches', JSON.stringify(allManaged));
    localStorage.setItem('inactive_branches', JSON.stringify(allInactive));

    // Dispatch custom event to update Header dropdown instantly
    window.dispatchEvent(new Event('branches_updated'));
  };

  const handleSaveProfile = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateSchoolProfile(profileForm);
    addToast('success', 'Settings Saved', 'School branding profile updated successfully.');
  };

  const handleOpenAddCampus = () => {
    setEditingCampus(null);
    setCampusForm({ name: '', code: '', address: '', phone: '', email: '', status: 'Active' });
    setIsCampusModalOpen(true);
  };

  const handleOpenEditCampus = (campus: CampusItem) => {
    setEditingCampus(campus);
    setCampusForm({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      phone: campus.phone,
      email: campus.email,
      status: campus.status
    });
    setIsCampusModalOpen(true);
  };

  const handleSaveCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim()) return;

    if (editingCampus) {
      const updated = campuses.map(c => c.id === editingCampus.id ? { ...c, ...campusForm } : c);
      syncCampuses(updated);
      addToast('success', 'Campus Updated', `${campusForm.name} configuration updated.`);
    } else {
      const newCampus: CampusItem = {
        id: `CMP-${Date.now().toString().slice(-4)}`,
        ...campusForm
      };
      const updated = [...campuses, newCampus];
      syncCampuses(updated);
      addToast('success', 'Campus Created', `${campusForm.name} added to campus configuration.`);
    }

    setIsCampusModalOpen(false);
  };

  const handleToggleStatus = (campus: CampusItem) => {
    const nextStatus = campus.status === 'Active' ? 'Inactive' : 'Active';
    const updated = campuses.map(c => c.id === campus.id ? { ...c, status: nextStatus as "Active" | "Inactive" } : c);
    syncCampuses(updated);
    addToast('info', 'Status Changed', `${campus.name} set to ${nextStatus}.`);
  };

  const confirmDeleteCampus = () => {
    if (!deletingCampus) return;
    const updated = campuses.filter(c => c.id !== deletingCampus.id);
    syncCampuses(updated);
    addToast('success', 'Campus Removed', `${deletingCampus.name} removed from campus configuration.`);
    setDeletingCampus(null);
  };

  const filteredCampuses = useMemo(() => {
    return campuses.filter(c =>
      c.name.toLowerCase().includes(campusSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(campusSearch.toLowerCase()) ||
      c.address.toLowerCase().includes(campusSearch.toLowerCase())
    );
  }, [campuses, campusSearch]);

  const handleOpenAddAY = () => {
    setEditingAY(null);
    setAyForm({
      academicYear: '',
      startDate: `${new Date().getFullYear()}-04-01`,
      endDate: `${new Date().getFullYear() + 1}-03-31`,
      status: 'Upcoming',
      description: '',
      isCurrentAcademicYear: false
    });
    setIsAYModalOpen(true);
  };

  const handleOpenEditAY = (ay: AcademicYearMaster) => {
    setEditingAY(ay);
    setAyForm({
      academicYear: ay.academicYear,
      startDate: ay.startDate || '',
      endDate: ay.endDate || '',
      status: ay.status || 'Upcoming',
      description: ay.description || '',
      isCurrentAcademicYear: ay.isCurrentAcademicYear || ay.status === 'Active'
    });
    setIsAYModalOpen(true);
  };

  const handleSaveAY = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayForm.academicYear.trim()) return;

    if (editingAY) {
      updateAcademicYear(editingAY.id, ayForm);
      addToast('success', 'Academic Year Updated', `Academic year ${ayForm.academicYear} configuration updated.`);
    } else {
      addAcademicYear(ayForm);
      addToast('success', 'Academic Year Added', `Academic year ${ayForm.academicYear} created successfully.`);
    }

    setIsAYModalOpen(false);
  };

  const confirmDeleteAY = () => {
    if (!deletingAY) return;
    deleteAcademicYear(deletingAY.id);
    addToast('success', 'Academic Year Removed', `Academic year ${deletingAY.academicYear} deleted.`);
    setDeletingAY(null);
  };

  const filteredAcademicYears = useMemo(() => {
    return (academicYears || []).filter(ay =>
      ay.academicYear.toLowerCase().includes(aySearch.toLowerCase()) ||
      (ay.description || '').toLowerCase().includes(aySearch.toLowerCase()) ||
      (ay.status || '').toLowerCase().includes(aySearch.toLowerCase())
    );
  }, [academicYears, aySearch]);

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `school_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Backup Exported', 'Downloaded database JSON backup');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-600" /> School Settings
        </h2>
        </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          School Branding Profile
        </button>
        <button
          onClick={() => setActiveTab('campus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'campus' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Campus Configuration ({campuses.length})
        </button>
        <button
          onClick={() => setActiveTab('academic-year')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'academic-year' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Academic Year Configuration ({(academicYears || []).length})
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'backup' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: SCHOOL BRANDING PROFILE */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">School Profile Setup</h3>
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">School Name *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={e => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Principal Name</label>
                <input
                  type="text"
                  value={profileForm.principalName}
                  onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Academic Session Year</label>
                <input
                  type="text"
                  value={profileForm.academicYear}
                  onChange={e => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Highest Class Offered (Terminal Graduation Grade)</label>
              <select
                value={profileForm.highestClass || 'Class 12'}
                onChange={e => setProfileForm({ ...profileForm, highestClass: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-brand-600 dark:text-brand-400"
              >
                <option value="Class 10">Class 10 (Secondary School Terminal)</option>
                <option value="Class 12">Class 12 (Higher Secondary Terminal)</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 12">Grade 12</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Students completing this class during annual promotion will automatically graduate to Alumni.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-md">
                <Save className="w-4 h-4" /> Save School Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CAMPUS CONFIGURATION */}
      {activeTab === 'campus' && (
        <div className="space-y-6">
          {/* Header Action & Filter Bar */}
          <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Campus Branch Master Setup
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Configure school branches. Active campuses appear in the top header selector.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search campus..."
                  value={campusSearch}
                  onChange={e => setCampusSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>
              <button
                onClick={handleOpenAddCampus}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> Add New Campus
              </button>
            </div>
          </div>

          {/* Campus Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCampuses.map(campus => (
              <div
                key={campus.id}
                className={`glass-card p-5 rounded-3xl space-y-4 border transition-all ${
                  campus.status === 'Active'
                    ? 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                    : 'border-slate-200/50 bg-slate-50/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{campus.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                        {campus.code}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(campus)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${
                      campus.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {campus.status}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {campus.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{campus.address}</span>
                    </div>
                  )}
                  {campus.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{campus.phone}</span>
                    </div>
                  )}
                  {campus.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{campus.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEditCampus(campus)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingCampus(campus)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC YEAR CONFIGURATION */}
      {activeTab === 'academic-year' && (
        <div className="space-y-6">
          {/* Header Action & Filter Bar */}
          <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                Academic Year Master Setup
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure school academic sessions. Active sessions reflect in the top header selector & entire system.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search academic year..."
                  value={aySearch}
                  onChange={e => setAySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>
              <button
                onClick={handleOpenAddAY}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Academic Year
              </button>
            </div>
          </div>

          {/* Academic Year Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAcademicYears.map(ay => {
              const isCurrent = ay.isCurrentAcademicYear || ay.status === 'Active';
              return (
                <div
                  key={ay.id}
                  className={`glass-card p-5 rounded-3xl space-y-4 border transition-all relative ${
                    isCurrent
                      ? 'border-emerald-300 dark:border-emerald-800/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                          {ay.academicYear}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                          {ay.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${
                        ay.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : ay.status === 'Upcoming'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {ay.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Start Date:</span>
                      <strong className="font-bold text-slate-800 dark:text-slate-200">{ay.startDate || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">End Date:</span>
                      <strong className="font-bold text-slate-800 dark:text-slate-200">{ay.endDate || 'N/A'}</strong>
                    </div>
                    {ay.description && (
                      <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        {ay.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    {!isCurrent ? (
                      <button
                        onClick={() => {
                          setCurrentAcademicYear(ay.id);
                          addToast('success', 'Active Session Updated', `${ay.academicYear} set as active. Header dropdown updated.`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Make Active
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Header Active
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditAY(ay)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingAY(ay)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Database Backup & Recovery
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Export a complete JSON snapshot of all student records, fee ledgers, staff records, and system settings for offline archival.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleBackup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" /> Download JSON Backup
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.userName} ({log.userRole})</td>
                  <td className="py-3 px-4 text-brand-600 font-semibold">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Academic Year Modal */}
      {isAYModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                {editingAY ? 'Edit Academic Year Configuration' : 'Add New Academic Year'}
              </h3>
              <button onClick={() => setIsAYModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAY} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027 or 2027-2028"
                  value={ayForm.academicYear}
                  onChange={e => setAyForm({ ...ayForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={ayForm.startDate}
                    onChange={e => setAyForm({ ...ayForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={ayForm.endDate}
                    onChange={e => setAyForm({ ...ayForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Session Status</label>
                <select
                  value={ayForm.status}
                  onChange={e => setAyForm({ ...ayForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="Upcoming">Upcoming (Future Academic Cycle)</option>
                  <option value="Active">Active (Current Running Session)</option>
                  <option value="Closed">Closed (Archived Past Session)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes for this session..."
                  value={ayForm.description}
                  onChange={e => setAyForm({ ...ayForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrentAcademicYear"
                  checked={ayForm.isCurrentAcademicYear}
                  onChange={e => setAyForm({ ...ayForm, isCurrentAcademicYear: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 cursor-pointer"
                />
                <label htmlFor="isCurrentAcademicYear" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as Active Academic Year in Header Selector
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAYModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md"
                >
                  Save Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Campus Modal */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {editingCampus ? 'Edit Campus Configuration' : 'Add New Campus Branch'}
              </h3>
              <button onClick={() => setIsCampusModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Campus"
                  value={campusForm.name}
                  onChange={e => setCampusForm({ ...campusForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOUTH"
                  value={campusForm.code}
                  onChange={e => setCampusForm({ ...campusForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Full street address..."
                  value={campusForm.address}
                  onChange={e => setCampusForm({ ...campusForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-..."
                    value={campusForm.phone}
                    onChange={e => setCampusForm({ ...campusForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="campus@domain.com"
                    value={campusForm.email}
                    onChange={e => setCampusForm({ ...campusForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                <select
                  value={campusForm.status}
                  onChange={e => setCampusForm({ ...campusForm, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="Active">Active (Displays in Header Selector)</option>
                  <option value="Inactive">Inactive (Hidden from Header Selector)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campus Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCampus}
        title="Remove Campus Configuration"
        message={`Are you sure you want to remove ${deletingCampus?.name}? This campus will be removed from system configurations.`}
        onConfirm={confirmDeleteCampus}
        onCancel={() => setDeletingCampus(null)}
      />

      {/* Delete Academic Year Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAY}
        title="Remove Academic Year"
        message={`Are you sure you want to remove ${deletingAY?.academicYear}? This session will be removed from system configurations.`}
        onConfirm={confirmDeleteAY}
        onCancel={() => setDeletingAY(null)}
      />
    </div>
  );
};

export default SettingsView;
