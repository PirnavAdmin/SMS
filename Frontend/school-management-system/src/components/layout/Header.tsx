import React, { useState, useEffect } from 'react';
import {
  Search, Sun, Moon, Bell, Shield, LogOut, Key, Clock, CheckCircle2,
  Megaphone, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';

interface HeaderProps {
  collapsed: boolean;
  onOpenSearch: () => void;
  onOpenChangePass: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onOpenSearch, onOpenChangePass }) => {
  const { user, role, setRole, selectedBranch, setSelectedBranch, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { announcements } = useData();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
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
      return ['West Campus'];
    }
    return [userBranch || 'Main Campus'];
  };

  const authorizedBranches = getAuthorizedBranches(role, user?.branch);

  useEffect(() => {
    if (authorizedBranches.length > 0 && !authorizedBranches.includes(selectedBranch)) {
      setSelectedBranch(authorizedBranches[0]);
    }
  }, [role, user?.branch, selectedBranch, authorizedBranches]);

  return (
    <header
      className={`fixed top-0 right-0 z-50 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Search & Branch Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all w-40 sm:w-60"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="truncate">Search system (Ctrl+K)...</span>
        </button>

        {/* Global Branch Selector with Permissions */}
        {authorizedBranches.length > 1 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold animate-in fade-in">
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Branch:</span>
            <select
              value={selectedBranch}
              onChange={e => {
                const targetVal = e.target.value;
                if (authorizedBranches.includes(targetVal)) {
                  setSelectedBranch(targetVal);
                }
              }}
              className="bg-transparent border-none outline-none font-bold cursor-pointer text-indigo-900 dark:text-indigo-200 text-xs"
            >
              {authorizedBranches.map(b => (
                <option key={b} value={b} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {b}
                </option>
              ))}
            </select>
          </div>
        ) : (
          authorizedBranches.length === 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold animate-in fade-in">
              <Building2 className="w-3.5 h-3.5" />
              <span>Branch: {authorizedBranches[0]}</span>
            </div>
          )
        )}

        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>{dateStr} • {timeStr}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role: {role}</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch System Role</div>
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setShowRoleMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between ${
                    role === r ? 'bg-brand-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{r}</span>
                  {role === r && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {announcements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-brand-600" /> Recent Notifications
                </h4>
                <span className="text-[10px] text-slate-400">{announcements.length} new</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {announcements.map(a => (
                  <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{a.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
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
    </header>
  );
};
