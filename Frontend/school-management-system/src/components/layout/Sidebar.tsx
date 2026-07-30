import React, { useState } from 'react';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap, IndianRupee,
  CalendarCheck, BookOpen, Clock, Award, FileText, Library,
  Bus, Home, Package, Megaphone, Calendar, BarChart3, ShieldCheck,
  Settings, ChevronRight, School, Shirt, Layers, Tag, UserPlus,
  Gift, Percent, AlertTriangle, Route, Bed, Receipt, RotateCcw,
  FileSpreadsheet, SlidersHorizontal, ChevronDown, Building2, Presentation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { hasModuleAccess } from '../../utils/rbac';

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
  const { role, user } = useAuth();
  const { schoolProfile, admissions, students } = useData();

  let isHosteller = false;
  let usesTransport = false;

  if (role.toLowerCase() !== 'student' && role.toLowerCase() !== 'parent') {
    isHosteller = true;
    usesTransport = true;
  } else {
    const parentWards = students.filter(s => 
      s.status === 'Active' && 
      (
        role === 'Student' ? s.id === user?.id : 
        (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
      )
    );
    if (parentWards.length > 0) {
       isHosteller = parentWards.some(w => w.studentType === 'Hosteller');
       usesTransport = parentWards.some(w => w.transportRequired || w.busRoute || w.transportType || w.routeId);
    }
  }

  const [financeExpanded, setFinanceExpanded] = useState(true);
  const [hostelExpanded, setHostelExpanded] = useState(true);
  const [transportExpanded, setTransportExpanded] = useState(true);
  const [uniformExpanded, setUniformExpanded] = useState(true);
  const [staffExpanded, setStaffExpanded] = useState(true);

  const isFinanceActive = activeModule.startsWith('finance-') || activeModule === 'fees';
  const isHostelActive = activeModule.startsWith('hostel-') || activeModule === 'hostel';
  const isTransportActive = activeModule.startsWith('transport-') || activeModule === 'transport' || activeModule === 'parent-bus-info';
  const isUniformActive = activeModule.startsWith('uniform-') || activeModule === 'uniforms';
  const isStaffActive = activeModule.startsWith('staff-') || activeModule === 'staff' || activeModule === 'parent-teacher-info';

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

  const financeSubItems = (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? [] : [
    { id: 'finance-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finance-transactions', label: 'Transactions (Master Ledger)', icon: FileSpreadsheet },
    { id: 'finance-fee-collection', label: 'Fee Collection', icon: IndianRupee },
    { id: 'finance-masters', label: 'Finance Setup', icon: SlidersHorizontal },
    { id: 'finance-reports', label: 'Finance Reports', icon: FileSpreadsheet },
  ];

  const hostelSubItems = (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? [] : [
    { id: 'hostel-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hostel-masters', label: 'Hostel Master Setup', icon: Building2 },
    { id: 'hostel-student-hostel', label: 'Room Allocation', icon: UserPlus },
    { id: 'hostel-reports', label: 'Hostel Reports', icon: FileSpreadsheet },
  ];

  const transportSubItems = (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? [] : [
    { id: 'transport-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transport-trips', label: 'Vehicle Trips', icon: Bus },
    { id: 'transport-masters', label: 'Route & Vehicle Setup', icon: Route },
    { id: 'transport-student-assignment', label: 'Transport Assignment', icon: UserPlus },
    { id: 'transport-reports', label: 'Transport Reports', icon: FileSpreadsheet },
  ];

  const uniformSubItems = [
    { id: 'uniform-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'uniform-masters', label: 'Uniform Configuration', icon: Shirt },
    { id: 'uniform-student-uniform', label: 'Student Uniform Distribution', icon: UserPlus },
    { id: 'uniform-reports', label: 'Uniform Reports', icon: FileSpreadsheet },
  ];

  const staffSubItems = (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? [] : [
    { id: 'staff-directory', label: 'Staff Directory', icon: Users },
    { id: 'staff-attendance', label: 'Attendance Register', icon: CalendarCheck },
    { id: 'staff-leave', label: 'Leave Management', icon: FileText },
    { id: 'staff-payroll', label: 'Payroll Processing', icon: IndianRupee },
  ];

  const payrollSubItems = [
    { id: 'staff-payroll-config', label: 'Payroll Configuration', icon: SlidersHorizontal },
    { id: 'staff-payroll-structures', label: 'Salary Structures', icon: Layers },
    { id: 'staff-payroll-processing', label: 'Payroll Processing', icon: IndianRupee },
    { id: 'staff-payroll-payslips', label: 'Payslips', icon: Receipt },
  ];

  const menuGroups = [
    {
      title: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Student Directory', icon: UserCheck },
        { id: 'staff', label: (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Teachers' : 'Faculty & Staff', icon: Users },
        { id: 'admissions', label: 'Admissions', icon: GraduationCap, badge: pendingAdmissions ? String(pendingAdmissions) : undefined },
      ]
    },
    {
      title: 'Academics',
      items: [
        { id: 'academics', label: 'Class Management', icon: Presentation },
        { id: 'subjects', label: 'Subject Management', icon: BookOpen },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'timetable', label: (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Timetable' : 'Time Table', icon: Clock },
        { id: 'examination', label: (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Report Cards' : 'Examinations', icon: Award },
        { id: 'homework', label: 'Homework', icon: FileText },
      ]
    },
    {
      title: 'Finance & Logistics',
      isFinanceSection: true,
      items: [
        { id: 'library', label: 'Library', icon: Library },
        { id: 'inventory', label: 'Inventory', icon: Package },
      ]
    },
    {
      title: 'School Administration',
      items: [
        { id: 'communication', label: (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Notifications' : 'Communication Hub', icon: Megaphone },
        { id: 'events', label: 'Events & Holidays', icon: Calendar },
        { id: 'training', label: 'Faculty Training', icon: GraduationCap },
        { id: 'reports', label: 'School Reports', icon: BarChart3 },
        { id: 'users', label: 'Roles', icon: ShieldCheck },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ].map(group => ({
    ...group,
    items: group.items.filter(item => hasModuleAccess(role, item.id))
  })).filter(group => group.items.length > 0 || group.isFinanceSection);

  // Handled above

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center justify-center border-b border-slate-200/80 dark:border-slate-800`}>
        {collapsed ? (
          <div className="flex items-center justify-center w-12 h-10 rounded-xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
               onClick={() => setCollapsed(false)}>
             <span className="text-[8px] font-black italic tracking-wider text-sky-700 dark:text-sky-500">PIRNAV</span>
          </div>
        ) : (
          <div className="flex items-center w-52 select-none cursor-pointer px-4 py-1.5 rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-sm transition-all hover:bg-slate-50">
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xl font-black italic tracking-wider text-sky-700 dark:text-sky-500 leading-none">PIRNAV</span>
              </div>
              <span className="text-[9px] font-bold tracking-widest text-sky-600/80 dark:text-sky-400/80 uppercase mt-0.5 whitespace-nowrap">Schools</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter((item: any) => !item.roles || item.roles.includes(role || ''));

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
                  {hasModuleAccess(role, 'fees') && (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                          const newExpanded = !financeExpanded;
                          setFinanceExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                          }
                        if (!isFinanceActive) {
                          setActiveModule((role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'parent-fee-dues' : 'finance-dashboard');
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
                        {!collapsed && <span className="font-bold">
                            {(role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Fee Details' : 'Finance & Fees'}
                          </span>}
                      </div>
                      {!collapsed && financeSubItems.length > 0 && (
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
                  )}

                  {hasModuleAccess(role, 'hostel') && (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                          const newExpanded = !hostelExpanded;
                          setHostelExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setFinanceExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                          }
                        if (!isHostelActive) {
                          setActiveModule((role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'parent-hostel-details' : 'hostel-dashboard');
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
                        {!collapsed && <span className="font-bold">
                            {(role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Hostel' : 'Hostel Management'}
                          </span>}
                      </div>
                      {!collapsed && hostelSubItems.length > 0 && (
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
                  )}

                  {hasModuleAccess(role, 'transport') && (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                          const newExpanded = !transportExpanded;
                          setTransportExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setUniformExpanded(false);
                          }
                        if (!isTransportActive) {
                          if (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') {
                            setActiveModule('parent-bus-info');
                          } else {
                            setActiveModule('transport-dashboard');
                          }
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
                        {!collapsed && <span className="font-bold">{(role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Transport' : 'Transport Management'}</span>}
                      </div>
                      {!collapsed && transportSubItems.length > 0 && (
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
                  )}

                  {hasModuleAccess(role, 'uniforms') && (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => {
                        if (collapsed) {
                          setCollapsed(false);
                        }
                          const newExpanded = !uniformExpanded;
                          setUniformExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
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
                        {!collapsed && <span className="font-bold">Uniform Management</span>}
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
                  )}
                </>
              )}

              {visibleItems.map(item => {
                if (item.id === 'staff' && hasModuleAccess(role, 'staff')) {
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
                            if (role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') {
                              setActiveModule('parent-teacher-info');
                            } else {
                              setActiveModule('staff-teachers');
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isStaffActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Users className={`w-4 h-4 shrink-0 ${isStaffActive ? 'text-white' : 'text-sky-500'}`} />
                          {!collapsed && <span className="font-bold">{(role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? 'Teachers' : 'Faculty & Staff'}</span>}
                        </div>
                        {!collapsed && staffSubItems.length > 0 && (
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${staffExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {!collapsed && staffExpanded && (
                        <div className="pl-3 border-l-2 border-sky-200 dark:border-sky-950 ml-3 space-y-0.5 my-1">
                          {staffSubItems.map(sub => {
                            const SubIcon = sub.icon;
                            const isPayroll = sub.id === 'staff-payroll';
                            const isSubActive = activeModule === sub.id || (isPayroll && activeModule.startsWith('staff-payroll-'));
                            return (
                              <React.Fragment key={sub.id}>
                                <button
                                  onClick={() => setActiveModule(isPayroll ? 'staff-payroll-config' : sub.id)}
                                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                    isSubActive
                                      ? 'bg-sky-600 text-white font-bold'
                                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                                  }`}
                                >
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                                {isPayroll && isSubActive && (
                                  <div className="ml-5 border-l border-sky-100 pl-2 dark:border-sky-950">
                                    {payrollSubItems.map(payrollSub => {
                                      const PayrollSubIcon = payrollSub.icon;
                                      const isPayrollSubActive = activeModule === payrollSub.id || (activeModule === 'staff-payroll' && payrollSub.id === 'staff-payroll-config');
                                      return (
                                        <button
                                          key={payrollSub.id}
                                          onClick={() => setActiveModule(payrollSub.id)}
                                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                                            isPayrollSubActive
                                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                          }`}
                                        >
                                          <PayrollSubIcon className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{payrollSub.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const Icon = item.icon;
                const isActive = activeModule === item.id || (item.id === 'admissions' && activeModule === 'admissions-add');

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setStaffExpanded(false);
                      setFinanceExpanded(false);
                      setHostelExpanded(false);
                      setTransportExpanded(false);
                      setUniformExpanded(false);
                    }}
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
