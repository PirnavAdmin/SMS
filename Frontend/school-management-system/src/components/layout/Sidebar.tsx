import React, { useState } from 'react';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap, IndianRupee,
  CalendarCheck, BookOpen, Clock, Award, FileText, Library,
  Bus, Home, Package, Megaphone, Calendar, BarChart3, ShieldCheck,
  Settings, ChevronRight, School, Shirt, Layers, Tag, UserPlus,
  Gift, Percent, AlertTriangle, Route, Bed, Receipt, RotateCcw,
  FileSpreadsheet, SlidersHorizontal, ChevronDown, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  collapsed: boolean;
  setCollapsed: (col: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  collapsed,
  setCollapsed
}) => {
  const { role } = useAuth();
  const { schoolProfile, admissions } = useData();

  const [financeExpanded, setFinanceExpanded] = useState(true);
  const [hostelExpanded, setHostelExpanded] = useState(true);
  const [transportExpanded, setTransportExpanded] = useState(true);
  const [uniformExpanded, setUniformExpanded] = useState(true);
  const [staffExpanded, setStaffExpanded] = useState(true);

  const isFinanceActive = activeModule.startsWith('finance-') || activeModule === 'fees';
  const isHostelActive = activeModule.startsWith('hostel-') || activeModule === 'hostel';
  const isTransportActive = activeModule.startsWith('transport-') || activeModule === 'transport';
  const isUniformActive = activeModule.startsWith('uniform-') || activeModule === 'uniforms';
  const isStaffActive = activeModule.startsWith('staff-') || activeModule === 'staff';

  const [lastActiveGroup, setLastActiveGroup] = useState<'finance' | 'hostel' | 'transport' | 'uniform' | 'staff' | 'other'>('other');

  React.useEffect(() => {
    if (isFinanceActive && lastActiveGroup !== 'finance') {
      setFinanceExpanded(true);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setLastActiveGroup('finance');
    } else if (isHostelActive && lastActiveGroup !== 'hostel') {
      setHostelExpanded(true);
      setFinanceExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setLastActiveGroup('hostel');
    } else if (isTransportActive && lastActiveGroup !== 'transport') {
      setTransportExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setLastActiveGroup('transport');
    } else if (isUniformActive && lastActiveGroup !== 'uniform') {
      setUniformExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setStaffExpanded(false);
      setLastActiveGroup('uniform');
    } else if (isStaffActive && lastActiveGroup !== 'staff') {
      setStaffExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setLastActiveGroup('staff');
    } else if (!isFinanceActive && !isHostelActive && !isTransportActive && !isUniformActive && !isStaffActive) {
      setLastActiveGroup('other');
    }
  }, [activeModule, isFinanceActive, isHostelActive, isTransportActive, isUniformActive, isStaffActive, lastActiveGroup]);

  const pendingAdmissions = admissions.filter(a => a.status === 'Pending').length;

  const financeSubItems = [
    { id: 'finance-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finance-masters', label: 'Finance Masters', icon: SlidersHorizontal },
    { id: 'finance-fee-collection', label: 'Fee Collection', icon: IndianRupee },
    { id: 'finance-reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const hostelSubItems = [
    { id: 'hostel-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hostel-masters', label: 'Hostel Masters', icon: Building2 },
    { id: 'hostel-student-hostel', label: 'Student Hostel', icon: UserPlus },
    { id: 'hostel-reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const transportSubItems = [
    { id: 'transport-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transport-masters', label: 'Transport Masters', icon: Route },
    { id: 'transport-student-assignment', label: 'Student Transport', icon: UserPlus },
    { id: 'transport-reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const uniformSubItems = [
    { id: 'uniform-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'uniform-masters', label: 'Uniform Masters', icon: Shirt },
    { id: 'uniform-student-uniform', label: 'Student Uniform', icon: UserPlus },
    { id: 'uniform-reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const staffSubItems = [
    { id: 'staff-teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'staff-directory', label: 'Staff', icon: Users },
    { id: 'staff-attendance', label: 'Staff Attendance', icon: CalendarCheck },
    { id: 'staff-leave', label: 'Leave Management', icon: FileText },
    { id: 'staff-payroll', label: 'Payroll', icon: IndianRupee },
    { id: 'staff-payslips', label: 'Payslips', icon: Receipt },
  ];

  const menuGroups = [
    {
      title: 'Core Management',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Principal', 'Teacher', 'Accountant', 'Librarian', 'Student', 'Parent'] },
        { id: 'students', label: 'Students', icon: UserCheck, roles: ['Admin', 'Principal', 'Teacher', 'Accountant'] },
        { id: 'staff', label: 'Staff & HR', icon: Users, roles: ['Admin', 'Principal'] },
        { id: 'admissions', label: 'Admissions', icon: GraduationCap, badge: pendingAdmissions ? String(pendingAdmissions) : undefined, roles: ['Admin', 'Principal'] },
      ]
    },
    {
      title: 'Academics & Operations',
      items: [
        { id: 'academics', label: 'Academics', icon: School, roles: ['Admin', 'Principal', 'Teacher'] },
        { id: 'subjects', label: 'Subjects', icon: BookOpen, roles: ['Admin', 'Principal', 'Teacher'] },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['Admin', 'Teacher'] },
        { id: 'timetable', label: 'Timetable', icon: Clock, roles: ['Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'examination', label: 'Examinations', icon: Award, roles: ['Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'homework', label: 'Homework', icon: FileText, roles: ['Admin', 'Teacher', 'Student', 'Parent'] },
      ]
    },
    {
      title: 'Finance & Operations',
      isFinanceSection: true,
      items: [
        { id: 'library', label: 'Library', icon: Library, roles: ['Admin', 'Librarian', 'Teacher', 'Student'] },
        { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Principal', 'Accountant'] },
      ]
    },
    {
      title: 'Communication & Admin',
      items: [
        { id: 'communication', label: 'Announcements', icon: Megaphone, roles: ['Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'events', label: 'Events & Holidays', icon: Calendar, roles: ['Admin', 'Principal', 'Teacher', 'Student', 'Parent'] },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['Admin', 'Principal', 'Accountant'] },
        { id: 'users', label: 'User Roles & Access', icon: ShieldCheck, roles: ['Admin'] },
        { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Principal'] },
      ]
    }
  ];

  // Handled above

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shrink-0">
            {schoolProfile.name ? schoolProfile.name.charAt(0) : 'E'}
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold text-sm text-slate-900 dark:text-white truncate">{schoolProfile.name}</h1>
              <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 tracking-wider uppercase">Admin Portal</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(role || ''));

          if (visibleItems.length === 0 && !group.isFinanceSection && !(group as any).isTransportSection) return null;

          return (
            <div key={idx} className="space-y-1.5">
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}

              {group.isFinanceSection && (
                <>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                        const newExpanded = !financeExpanded;
                        setFinanceExpanded(newExpanded);
                        if (newExpanded) {
                          setHostelExpanded(false);
                        }
                        if (!isFinanceActive) {
                          setActiveModule('finance-dashboard');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                        isFinanceActive
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <IndianRupee className={`w-4 h-4 shrink-0 ${isFinanceActive ? 'text-white' : 'text-sky-500'}`} />
                        {!collapsed && <span className="font-bold">Finance ERP</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${financeExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {!collapsed && financeExpanded && (
                      <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                        {financeSubItems.map(sub => {
                          const SubIcon = sub.icon;
                          const isSubActive = 
                            activeModule === sub.id || 
                            (sub.id === 'finance-dashboard' && activeModule === 'fees') ||
                            (sub.id === 'finance-masters' && ['finance-fee-heads', 'finance-fee-structure', 'finance-student-fee-assignment', 'finance-scholarships', 'finance-discounts', 'finance-fine-rules', 'finance-transport-config', 'finance-student-transport', 'finance-hostel-config', 'finance-student-hostel', 'finance-refund-management', 'finance-settings'].includes(activeModule)) ||
                            (sub.id === 'finance-fee-collection' && ['finance-fee-collection', 'finance-fee-receipts', 'finance-due-fees', 'fees'].includes(activeModule));
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveModule(sub.id)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                isSubActive
                                  ? 'bg-sky-600 text-white font-bold'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                        const newExpanded = !hostelExpanded;
                        setHostelExpanded(newExpanded);
                        if (newExpanded) {
                          setFinanceExpanded(false);
                          setTransportExpanded(false);
                        }
                        if (!isHostelActive) {
                          setActiveModule('hostel-dashboard');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                        isHostelActive
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Home className={`w-4 h-4 shrink-0 ${isHostelActive ? 'text-white' : 'text-indigo-500'}`} />
                        {!collapsed && <span className="font-bold">Hostel ERP</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${hostelExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {!collapsed && hostelExpanded && (
                      <div className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900 ml-3 space-y-0.5 my-1">
                        {hostelSubItems.map(sub => {
                          const SubIcon = sub.icon;
                          const isSubActive = 
                            activeModule === sub.id || 
                            (sub.id === 'hostel-dashboard' && activeModule === 'hostel') ||
                            (sub.id === 'hostel-masters' && ['hostel-master', 'hostel-room-type', 'hostel-room-master'].includes(activeModule)) ||
                            (sub.id === 'hostel-student-hostel' && ['hostel-student-hostel', 'hostel-student-assignment', 'hostel-attendance'].includes(activeModule));
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveModule(sub.id)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                isSubActive
                                  ? 'bg-sky-600 text-white font-bold'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                        const newExpanded = !transportExpanded;
                        setTransportExpanded(newExpanded);
                        if (newExpanded) {
                          setFinanceExpanded(false);
                          setHostelExpanded(false);
                        }
                        if (!isTransportActive) {
                          setActiveModule('transport-dashboard');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                        isTransportActive
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Bus className={`w-4 h-4 shrink-0 ${isTransportActive ? 'text-white' : 'text-slate-400'}`} />
                        {!collapsed && <span className="font-bold">Transport</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${transportExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {!collapsed && transportExpanded && (
                      <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                        {transportSubItems.map(sub => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeModule === sub.id || (sub.id === 'transport-dashboard' && activeModule === 'transport');
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveModule(sub.id)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                isSubActive
                                  ? 'bg-sky-600 text-white font-bold'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                        const newExpanded = !uniformExpanded;
                        setUniformExpanded(newExpanded);
                        if (newExpanded) {
                          setFinanceExpanded(false);
                          setHostelExpanded(false);
                          setTransportExpanded(false);
                        }
                        if (!isUniformActive) {
                          setActiveModule('uniform-dashboard');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                        isUniformActive
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Shirt className={`w-4 h-4 shrink-0 ${isUniformActive ? 'text-white' : 'text-slate-400'}`} />
                        {!collapsed && <span className="font-bold">Uniform Store</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${uniformExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {!collapsed && uniformExpanded && (
                      <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                        {uniformSubItems.map(sub => {
                          const SubIcon = sub.icon;
                          const isSubActive =
                            activeModule === sub.id ||
                            (sub.id === 'uniform-dashboard' && activeModule === 'uniforms') ||
                            (sub.id === 'uniform-masters' && ['uniform-master', 'uniform-categories', 'uniform-sizes', 'uniform-suppliers', 'uniform-inventory'].includes(activeModule)) ||
                            (sub.id === 'uniform-student-uniform' && ['uniform-student-uniform', 'uniform-issues'].includes(activeModule));
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveModule(sub.id)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                isSubActive
                                  ? 'bg-sky-600 text-white font-bold'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {visibleItems.map(item => {
                if (item.id === 'staff') {
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false);
                          }
                          const newExpanded = !staffExpanded;
                          setStaffExpanded(newExpanded);
                          if (newExpanded) {
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                          }
                          if (!isStaffActive) {
                            setActiveModule('staff-teachers');
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isStaffActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Users className={`w-4 h-4 shrink-0 ${isStaffActive ? 'text-white' : 'text-emerald-500'}`} />
                          {!collapsed && <span className="font-bold">Staff & HR</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${staffExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {!collapsed && staffExpanded && (
                        <div className="pl-3 border-l-2 border-emerald-200 dark:border-emerald-950 ml-3 space-y-0.5 my-1">
                          {staffSubItems.map(sub => {
                            const SubIcon = sub.icon;
                            const isSubActive = activeModule === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? 'bg-sky-600 text-white font-bold'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && (item as any).badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      }`}>
                        {(item as any).badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
