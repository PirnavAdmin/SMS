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
import { BRANCHES } from '../../utils/validation';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  onOpenSearch: () => void;
  onOpenChangePass: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed, onOpenSearch, onOpenChangePass }) => {
  const { user, role, setRole, selectedBranch, setSelectedBranch, selectedAcademicYear, setSelectedAcademicYear, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { announcements, students, admissions, academicClasses, dynamicFeeStructures, routeMasters, hostelMasters, academicYears } = useData();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showAYMenu, setShowAYMenu] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [managedBranches, setManagedBranches] = useState<string[]>(() => {
    const saved = localStorage.getItem('managed_branches');
    return saved ? JSON.parse(saved) : [...BRANCHES];
  });
  const [inactiveBranches, setInactiveBranches] = useState<string[]>(() => {
    const saved = localStorage.getItem('inactive_branches');
    return saved ? JSON.parse(saved) : [];
  });
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
    const handleBranchesUpdate = () => {
      const savedManaged = localStorage.getItem('managed_branches');
      if (savedManaged) setManagedBranches(JSON.parse(savedManaged));
      const savedInactive = localStorage.getItem('inactive_branches');
      if (savedInactive) setInactiveBranches(JSON.parse(savedInactive));
    };
    window.addEventListener('branches_updated', handleBranchesUpdate);
    window.addEventListener('storage', handleBranchesUpdate);
    return () => {
      window.removeEventListener('branches_updated', handleBranchesUpdate);
      window.removeEventListener('storage', handleBranchesUpdate);
    };
  }, []);

  const roles: UserRole[] = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'
  ];

  const getAuthorizedBranches = (currentRole: string, userBranch?: string) => {
    if (currentRole === 'Super Admin' || currentRole === 'Admin') {
      return ['Main Campus', 'North Branch', 'West Campus'];
    }
    if (currentRole === 'Principal') {
      return [userBranch || 'North Branch'];
    }
    if (currentRole === 'Accountant') {
      return ['Main Campus'];
    }
    if (currentRole === 'Teacher') {
      return ['West Campus', 'Main Campus'];
    }
    return [userBranch || 'Main Campus'];
  };

  const canViewBranch = ['Super Admin', 'Admin', 'Principal', 'Accountant', 'Teacher', 'Receptionist', 'HR', 'Transport Manager', 'Hostel Warden'].includes(role);
  const canCreateBranch = ['Super Admin', 'Admin'].includes(role);
  const canManageBranch = ['Super Admin', 'Admin'].includes(role);

  const branchOptions = useMemo(() => {
    const sourceBranches = [
      ...(managedBranches || []),
      ...(students || []).map(s => s.branch || 'Main Campus'),
      ...(admissions || []).map(a => a.branch || 'Main Campus'),
      ...(academicClasses || []).map(c => (c as any).branch || 'Main Campus'),
      ...(dynamicFeeStructures || []).map(f => f.branch || 'Main Campus'),
      ...(routeMasters || []).map(r => (r as any).branch || 'Main Campus'),
      ...(hostelMasters || []).map(h => (h as any).branch || 'Main Campus')
    ];
    return Array.from(new Set(sourceBranches))
      .filter(branch => branch && !(inactiveBranches || []).includes(branch))
      .sort();
  }, [managedBranches, students, admissions, academicClasses, dynamicFeeStructures, routeMasters, hostelMasters, inactiveBranches]);

  const authorizedBranches = useMemo(() => {
    const roleBranches = getAuthorizedBranches(role, user?.branch);
    if (role === 'Super Admin' || role === 'Admin') return branchOptions;
    return roleBranches.filter(branch => branchOptions.includes(branch));
  }, [role, user?.branch, branchOptions]);

  const filteredBranchOptions = authorizedBranches.filter(branch =>
    branch.toLowerCase().includes(branchSearch.toLowerCase())
  );

  useEffect(() => {
    if (authorizedBranches.length > 0 && !authorizedBranches.includes(selectedBranch)) {
      setSelectedBranch(authorizedBranches[0]);
    }
  }, [selectedBranch, authorizedBranches, setSelectedBranch]);

  useEffect(() => {
    localStorage.setItem('managed_branches', JSON.stringify(managedBranches));
  }, [managedBranches]);

  useEffect(() => {
    localStorage.setItem('inactive_branches', JSON.stringify(inactiveBranches));
  }, [inactiveBranches]);

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

  const saveBranch = () => {
    const nextName = branchDraftName.trim();
    if (!nextName) return;
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
    let list: { id: string; academicYear: string; isCurrent: boolean }[] = [];
    if (academicYears && academicYears.length > 0) {
      list = academicYears.map(ay => ({
        id: ay.id,
        academicYear: ay.academicYear || (ay as any).year || '',
        isCurrent: ay.isCurrentAcademicYear || ay.status === 'Active'
      })).filter(a => a.academicYear && a.academicYear.length > 4); // Filter out junk IDs like '01', '02'
    } else {
      list = [
        { id: 'AY-2026-2027', academicYear: '2026-2027', isCurrent: true },
        { id: 'AY-2025-2026', academicYear: '2025-2026', isCurrent: false }
      ];
    }

    if (!list.some(ay => ay.academicYear === '2026-2027')) {
      list.push({ id: 'AY-2026-2027', academicYear: '2026-2027', isCurrent: true });
    }

    // Deduplicate by academicYear
    const uniqueList: typeof list = [];
    const seen = new Set<string>();
    for (const item of list) {
      if (item.academicYear && !seen.has(item.academicYear)) {
        seen.add(item.academicYear);
        uniqueList.push(item);
      }
    }

    return uniqueList.sort((a, b) => b.academicYear.localeCompare(a.academicYear));
  }, [academicYears]);

  const confirmDeactivateBranch = () => {
    if (!deactivatingBranch || !canManageBranch) return;
    setInactiveBranches(prev => Array.from(new Set([...(prev || []), deactivatingBranch])));
    if (selectedBranch === deactivatingBranch) {
      const fallback = branchOptions.find(branch => branch !== deactivatingBranch) || 'Main Campus';
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

  return (
    <header
      className={`fixed top-0 right-0 z-50 h-16 bg-brand-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 ${
        collapsed ? 'left-20' : 'left-64'
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
            <span className="truncate">Search...</span>
          </button>

        {/* Global Branch Selector with Permissions */}
        {canViewBranch && authorizedBranches.length > 0 && (
          <div className="relative animate-in fade-in" ref={branchRef}>
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors h-9"
            >
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="max-w-32 truncate text-indigo-900 dark:text-indigo-100">{selectedBranch}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>

            {showBranchMenu && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                <div className="mb-2 px-1">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={branchSearch}
                      onChange={e => setBranchSearch(e.target.value)}
                      placeholder="Filter campus..."
                      className="w-full bg-transparent outline-none text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredBranchOptions.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-slate-500">No campuses configured.</div>
                  ) : filteredBranchOptions.map(branch => {
                    const isSelected = selectedBranch === branch;
                    return (
                      <button
                        key={branch}
                        onClick={() => selectBranch(branch)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{branch}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Academic Year Selector */}
        <div className="relative animate-in fade-in" ref={ayRef}>
          <button
            onClick={() => setShowAYMenu(!showAYMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors h-9 whitespace-nowrap"
            title="Academic Year"
          >
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-indigo-600 dark:text-indigo-400 font-medium hidden md:inline">Academic Year:</span>
            <span className="truncate text-indigo-900 dark:text-indigo-100">{formatAYDisplay(selectedAcademicYear)}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>

          {showAYMenu && (
            <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
              <div className="max-h-64 overflow-y-auto space-y-1">
                {ayOptions.map(ay => {
                  const isSelected = selectedAcademicYear === ay.academicYear || formatAYDisplay(selectedAcademicYear) === formatAYDisplay(ay.academicYear);
                  return (
                    <button
                      key={ay.id}
                      onClick={() => {
                        setSelectedAcademicYear(ay.academicYear);
                        setShowAYMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{formatAYDisplay(ay.academicYear)}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={toggleNotifMenu}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title={unreadAnnouncements.length > 0 ? `${unreadAnnouncements.length} unread notifications` : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncements.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-brand-600" /> Notifications
                </h4>
                {unreadAnnouncements.length > 0 ? (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Mark all as read
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">All read</span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {!(announcements && announcements.length > 0) ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  (announcements || []).map(a => {
                    const isUnread = !(readNotifIds || []).includes(a.id);
                    return (
                      <div
                        key={a.id}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          isUnread
                            ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800/60'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{a.title}</p>
                          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{a.content}</p>
                      </div>
                    );
                  })
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
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{role}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 space-y-1">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{role} • {user?.email}</p>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); onOpenChangePass(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
