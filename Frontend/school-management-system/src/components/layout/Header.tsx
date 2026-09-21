import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Sun, Moon, Bell, Shield, LogOut, Key, Calendar, CheckCircle2,
  Megaphone, Building2, Plus, Edit, Trash2, ChevronDown, X, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { resolveMediaUrl, DEFAULT_USER_AVATAR, getInitialsAvatar } from '../../utils/mediaUtils';
import { fetchBranchesApi, fetchAcademicYearsApi, createBranchApi, updateBranchApi } from '../../api/settings';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  onOpenSearch: () => void;
  onOpenChangePass: () => void;
  onNavigate?: (module: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed, onOpenSearch, onOpenChangePass, onNavigate }) => {
  const { user, role, setRole, selectedBranch, setSelectedBranch, selectedAcademicYear, setSelectedAcademicYear, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { staff = [], announcements, students, admissions, academicClasses, dynamicFeeStructures, routeMasters, hostelMasters, driverMasters = [], academicYears, branches = [], fetchBranches } = useData();

  const formatEmailToName = (email?: string): string => {
    if (!email || !email.includes('@')) return '';
    const username = email.split('@')[0];
    const parts = username.split(/[._-]/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const currentStaff = useMemo(() => {
    if (!user) return null;
    const userRole = (role || user.role || '').toLowerCase();
    // Admin, Super Admin, Student, Parent are NEVER in staff list
    if (['admin', 'super admin', 'superadmin', 'student', 'parent'].includes(userRole)) {
      return null;
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    const userPhone = (user.phone || '').replace(/\D/g, '');
    const userId = String(user.id || (user as any)?.empId || '').trim();

    if (userEmail) {
      const emailMatch = staff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (emailMatch) return emailMatch;
    }

    if (userPhone && userPhone.length >= 10) {
      const phoneMatch = staff.find(s => s.phone && s.phone.replace(/\D/g, '').endsWith(userPhone));
      if (phoneMatch) return phoneMatch;
    }

    if (userId) {
      const idMatch = staff.find(s => {
        const matchesId = (s.id && String(s.id).trim() === userId) || (s.empId && String(s.empId).trim() === userId);
        if (!matchesId) return false;
        if (s.email && userEmail && s.email.toLowerCase().trim() !== userEmail) {
          return false;
        }
        return true;
      });
      if (idMatch) return idMatch;
    }

    // Match in driverMasters if Driver
    if (userRole === 'driver') {
      const driverMatch = (driverMasters || []).find(d =>
        (userEmail && d.email?.toLowerCase().trim() === userEmail) ||
        (userPhone && d.mobileNumber && d.mobileNumber.replace(/\D/g, '').endsWith(userPhone)) ||
        (userId && (d.employeeId?.toLowerCase() === userId.toLowerCase() || String(d.id) === userId))
      );
      if (driverMatch && driverMatch.driverName) {
        return {
          firstName: driverMatch.driverName,
          lastName: '',
          email: driverMatch.email || user.email,
        } as any;
      }
    }

    return null;
  }, [staff, driverMasters, user, role]);

  const displayName = useMemo(() => {
    return (user?.name || '').trim();
  }, [user?.name]);

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showAYMenu, setShowAYMenu] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [managedBranches, setManagedBranches] = useState<string[]>([]);
  const [inactiveBranches, setInactiveBranches] = useState<string[]>([]);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchDraftName, setBranchDraftName] = useState('');
  const [editingBranchName, setEditingBranchName] = useState<string | null>(null);
  const [deactivatingBranch, setDeactivatingBranch] = useState<string | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const ayRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (showNotifMenu && notifRef.current && !notifRef.current.contains(targetNode)) {
        setShowNotifMenu(false);
      }
      if (showBranchMenu && branchRef.current && !branchRef.current.contains(targetNode)) {
        setShowBranchMenu(false);
      }
      if (showAYMenu && ayRef.current && !ayRef.current.contains(targetNode)) {
        setShowAYMenu(false);
      }
      if (showUserMenu && userRef.current && !userRef.current.contains(targetNode)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showNotifMenu, showBranchMenu, showAYMenu, showUserMenu]);

  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        if (fetchBranches) await fetchBranches();
      } catch {}
      try {
        const ayRes: any = await fetchAcademicYearsApi();
        if (ayRes?.success && Array.isArray(ayRes.data) && ayRes.data.length > 0) {
          localStorage.setItem('edu_db_academic_years', JSON.stringify(ayRes.data));
        }
      } catch {}
    };
    loadSettingsData();
  }, []);

  const roles: UserRole[] = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'
  ];

  const canViewBranch = ['Super Admin', 'Admin', 'Principal', 'Accountant', 'Receptionist', 'HR', 'Transport Manager', 'Hostel Warden'].includes(role) && role !== 'Teacher';
  const canCreateBranch = ['Super Admin', 'Admin'].includes(role);
  const canManageBranch = ['Super Admin', 'Admin'].includes(role);
  const canViewAcademicYear = ['Super Admin', 'Admin', 'Principal', 'Accountant', 'Teacher', 'Receptionist', 'HR', 'Transport Manager', 'Hostel Warden'].includes(role);

  const branchOptions = useMemo(() => {
    const fromApi = (branches || [])
      .filter((b: any) => b.status !== 'Inactive')
      .map((b: any) => b.name || b.branchName)
      .filter(Boolean);

    if (fromApi.length > 0) {
      return Array.from(new Set(fromApi)).sort();
    }

    const sourceBranches = [
      ...(managedBranches || []),
      ...(students || []).map(s => s.branch).filter(Boolean),
      ...(admissions || []).map(a => a.branch).filter(Boolean),
      ...(academicClasses || []).map(c => (c as any).branch).filter(Boolean),
      ...(dynamicFeeStructures || []).map(f => f.branch).filter(Boolean),
      ...(routeMasters || []).map(r => (r as any).branch).filter(Boolean),
      ...(hostelMasters || []).map(h => (h as any).branch).filter(Boolean)
    ];
    return Array.from(new Set(sourceBranches))
      .filter(branch => branch && !(inactiveBranches || []).includes(branch))
      .sort();
  }, [branches, managedBranches, students, admissions, academicClasses, dynamicFeeStructures, routeMasters, hostelMasters, inactiveBranches]);

  const authorizedBranches = useMemo(() => {
    return branchOptions;
  }, [branchOptions]);

  const filteredBranchOptions = authorizedBranches.filter(branch =>
    branch.toLowerCase().includes(branchSearch.toLowerCase())
  );

  useEffect(() => {
    if (authorizedBranches.length > 0 && (!selectedBranch || !authorizedBranches.includes(selectedBranch))) {
      setSelectedBranch(authorizedBranches[0]);
    }
  }, [selectedBranch, authorizedBranches, setSelectedBranch]);

  const selectBranch = (branch: string) => {
    if (!canViewBranch || !authorizedBranches.includes(branch)) return;
    setSelectedBranch(branch);
    setShowBranchMenu(false);
    setBranchSearch('');
  };

  const openCreateBranch = () => {
    if (!canCreateBranch) return;
    setEditingBranchName(null);
    setBranchDraftName('');
    setBranchModalOpen(true);
    setShowBranchMenu(false);
  };

  const openEditBranch = (branch: string) => {
    if (!canManageBranch) return;
    setEditingBranchName(branch);
    setBranchDraftName(branch);
    setBranchModalOpen(true);
  };

  const saveBranch = async () => {
    const nextName = branchDraftName.trim();
    if (!nextName) return;

    try {
      if (editingBranchName) {
        const existing = (branches || []).find((b: any) => (b.name || b.branchName) === editingBranchName);
        if (existing) {
          await updateBranchApi(existing.id, { ...existing, name: nextName });
        }
      } else {
        await createBranchApi({ name: nextName, code: nextName.slice(0, 4).toUpperCase(), status: 'Active' });
      }
      if (fetchBranches) await fetchBranches();
      window.dispatchEvent(new Event('branches_updated'));
    } catch (err) {
      console.warn('Failed to save branch from header:', err);
    }

    setManagedBranches(prev => {
      const withoutEdited = editingBranchName ? prev.filter(branch => branch !== editingBranchName) : prev;
      return Array.from(new Set([...withoutEdited, nextName]));
    });
    if (editingBranchName && (inactiveBranches || []).includes(editingBranchName)) {
      setInactiveBranches(prev => (prev || []).filter(branch => branch !== editingBranchName));
    }
    setBranchModalOpen(false);
    setEditingBranchName(null);
    setBranchDraftName('');
    selectBranch(nextName);
  };

  const formatAYDisplay = (ay?: string) => {
    if (!ay) return '';
    const parts = ay.split(/[-–]/);
    if (parts.length === 2) {
      const start = parts[0].trim();
      let end = parts[1].trim();
      if (end.length === 4) {
        end = end.substring(2);
      }
      return `${start}–${end}`;
    }
    return ay;
  };

  const ayOptions = useMemo(() => {
    const allYears = new Map<string, { id: string; academicYear: string; isCurrent: boolean; status?: string }>();

    // 1. Prioritize academic years configured in Settings / DataContext
    if (academicYears && academicYears.length > 0) {
      academicYears.forEach(ay => {
        const val = ay.academicYear || (ay as any).year;
        if (val && String(val).trim().length >= 4) {
          const yearStr = String(val).trim();
          allYears.set(yearStr, {
            id: ay.id || `AY-${yearStr}`,
            academicYear: yearStr,
            isCurrent: Boolean(ay.isCurrentAcademicYear || ay.status === 'Active'),
            status: ay.status
          });
        }
      });
    }

    // 2. Also inspect local storage if any
    try {
      const storedAYs = localStorage.getItem('edu_db_academic_years') || localStorage.getItem('academic_years');
      if (storedAYs) {
        const parsed = JSON.parse(storedAYs);
        if (Array.isArray(parsed)) {
          parsed.forEach((ay: any) => {
            const val = ay.academicYear || ay.year;
            if (val && String(val).trim().length >= 4) {
              const yearStr = String(val).trim();
              if (!allYears.has(yearStr)) {
                allYears.set(yearStr, {
                  id: ay.id || `AY-${yearStr}`,
                  academicYear: yearStr,
                  isCurrent: Boolean(ay.isCurrentAcademicYear || ay.status === 'Active'),
                  status: ay.status
                });
              }
            }
          });
        }
      }
    } catch {}

    return Array.from(allYears.values()).sort((a, b) => b.academicYear.localeCompare(a.academicYear));
  }, [academicYears, students]);

  useEffect(() => {
    if (ayOptions.length > 0 && (!selectedAcademicYear || !ayOptions.some(a => a.academicYear === selectedAcademicYear))) {
      const current = ayOptions.find(a => a.isCurrent) || ayOptions[0];
      if (current) {
        setSelectedAcademicYear(current.academicYear);
      }
    }
  }, [ayOptions, selectedAcademicYear, setSelectedAcademicYear]);

  const confirmDeactivateBranch = () => {
    if (!deactivatingBranch || !canManageBranch) return;
    setInactiveBranches(prev => Array.from(new Set([...(prev || []), deactivatingBranch])));
    if (selectedBranch === deactivatingBranch) {
      const fallback = branchOptions.find(branch => branch !== deactivatingBranch) || '';
      setSelectedBranch(fallback);
    }
    setDeactivatingBranch(null);
    setShowBranchMenu(false);
  };

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('read_notif_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('read_notif_ids', JSON.stringify(readNotifIds));
  }, [readNotifIds]);

  const unreadAnnouncements = useMemo(() => {
    return (announcements || []).filter(a => !(readNotifIds || []).includes(a.id));
  }, [announcements, readNotifIds]);

  const toggleNotifMenu = () => {
    const nextState = !showNotifMenu;
    setShowNotifMenu(nextState);
    if (nextState && unreadAnnouncements.length > 0) {
      const allIds = (announcements || []).map(a => a.id);
      setReadNotifIds(prev => Array.from(new Set([...(prev || []), ...allIds])));
    }
  };

  const markAllAsRead = () => {
    const allIds = (announcements || []).map(a => a.id);
    setReadNotifIds(Array.from(new Set([...(readNotifIds || []), ...allIds])));
  };

  const displayRole = useMemo(() => {
    const userRole = (role || user?.role || '').toLowerCase();
    if (userRole === 'parent' || (user?.role && user.role.toLowerCase() === 'parent') || (user?.email && user.email.toLowerCase().includes('parent'))) return 'Parent';
    if (userRole === 'student') return 'Student';
    return role || user?.role || 'User';
  }, [role, user]);

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-16 bg-brand-50 dark:bg-brand-950 border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-all duration-300 flex items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 ${
        collapsed ? 'left-20' : 'left-56'
      }`}
    >
      <div className="flex items-center flex-1 min-w-0">
        {/* Sidebar Toggle Hamburger (in circle) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mr-4 sm:mr-6 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search & Branch & Academic Year Selectors */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all w-40 sm:w-60 shrink min-w-0 h-9"
          >
            <Search className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">Search by modules, students, staff...</span>
          </button>

        {/* Global Branch Selector with Permissions */}
        {canViewBranch && (
          <div className="relative animate-in fade-in" ref={branchRef}>
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50/80 dark:bg-brand-950/60 border border-brand-200/70 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors h-9"
            >
              <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="max-w-32 truncate text-brand-900 dark:text-brand-100">
                {selectedBranch || (authorizedBranches.length > 0 ? authorizedBranches[0] : "Select Campus")}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>

            {showBranchMenu && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                {canManageBranch && (
                  <button
                    onClick={() => {
                      setShowBranchMenu(false);
                      localStorage.setItem('settings_active_tab', 'campus');
                      window.dispatchEvent(new CustomEvent('settings_tab_change', { detail: { tab: 'campus' } }));
                      if (onNavigate) {
                        onNavigate('settings');
                      }
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl transition-colors mb-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Add New Campus
                    </span>
                  </button>
                )}

                <div className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar">
                  {branchOptions.map((branch, idx) => {
                    const isSelected = selectedBranch === branch;
                    const isInactive = (inactiveBranches || []).includes(branch);
                    return (
                      <div key={idx} className="flex items-center justify-between group px-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <button
                          onClick={() => {
                            setSelectedBranch(branch);
                            setShowBranchMenu(false);
                          }}
                          className={`flex-1 flex items-center justify-between px-2 py-1.5 text-xs text-left transition-colors font-medium cursor-pointer ${
                            isSelected ? 'text-brand-600 font-bold' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{branch}</span>
                          {isInactive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-normal">
                              Inactive
                            </span>
                          )}
                        </button>
                        {canManageBranch && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pr-2 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBranchName(branch);
                                setBranchDraftName(branch);
                                setBranchModalOpen(true);
                              }}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                              title="Edit branch"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeactivatingBranch(branch);
                              }}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded text-rose-500"
                              title="Deactivate branch"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Academic Year Selector */}
        {canViewAcademicYear && (
          <div className="relative animate-in fade-in" ref={ayRef}>
            <button
              onClick={() => setShowAYMenu(!showAYMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 text-xs hover:bg-sky-50/50 dark:hover:bg-slate-700 transition-colors h-9 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="text-sky-600 dark:text-sky-400 font-semibold whitespace-nowrap">Academic Year:</span>
              <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {formatAYDisplay(selectedAcademicYear) || "2026–27"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            </button>

            {showAYMenu && (
              <div className="absolute left-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 space-y-1">
                {ayOptions.map((item) => {
                  const isSelected = selectedAcademicYear === item.academicYear || formatAYDisplay(selectedAcademicYear) === formatAYDisplay(item.academicYear);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedAcademicYear(item.academicYear);
                        setShowAYMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors font-medium text-left cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-semibold">{formatAYDisplay(item.academicYear)}</span>
                      {item.isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-normal">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Right side tools: Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifMenu}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAnnouncements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-brand-600" />
                  Notifications & Announcements
                </h3>
                {unreadAnnouncements.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {(announcements || []).length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No notifications yet</p>
                ) : (
                  (announcements || []).map((ann) => (
                    <div key={ann.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</span>
                        <span className="text-[10px] text-slate-400">{ann.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{ann.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={resolveMediaUrl(user?.avatar) || getInitialsAvatar(displayName, user?.email)}
              alt=""
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = getInitialsAvatar(displayName, user?.email);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{displayRole}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 space-y-1">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{displayRole} • {user?.email}</p>
              </div>

              {['Admin', 'Super Admin', 'Teacher'].includes(role) && (
                <button
                  onClick={() => { setShowUserMenu(false); onNavigate?.('profile-completion'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4 text-sky-500" />
                  <span>Edit Profile</span>
                </button>
              )}

              <button
                onClick={() => { setShowUserMenu(false); onOpenChangePass(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4 text-amber-500" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {branchModalOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingBranchName ? 'Edit Branch' : 'Create Branch'}</h3>
                <p className="text-xs text-slate-500">Branch will be available immediately from the header selector.</p>
              </div>
              <button
                onClick={() => {
                  setBranchModalOpen(false);
                  setEditingBranchName(null);
                  setBranchDraftName('');
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
            <input
              value={branchDraftName}
              onChange={e => setBranchDraftName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveBranch()}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. East Campus"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setBranchModalOpen(false);
                  setEditingBranchName(null);
                  setBranchDraftName('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={saveBranch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700"
              >
                {editingBranchName ? 'Save Branch' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deactivatingBranch}
        title="Deactivate Branch"
        message={`Deactivate ${deactivatingBranch || 'this branch'}? Existing records will remain unchanged, but the branch will be hidden from active selection.`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={confirmDeactivateBranch}
        onCancel={() => setDeactivatingBranch(null)}
      />
    </header>
  );
};
