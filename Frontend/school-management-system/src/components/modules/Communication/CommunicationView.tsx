import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Send, Mail, MessageSquare, Bell, Users, Calendar, Search, 
  Plus, X, CheckCircle2, AlertTriangle, Pin, Trash2, Filter, Clock, 
  Sparkles, Radio, Smartphone, ShieldAlert, Check, Eye, Edit
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { MeetingsView } from './MeetingsView';
import {
  fetchNotificationsApi,
  createNotificationApi,
  updateNotificationApi,
  deleteNotificationApi
} from '../../../api/communication';

interface LocalAnnouncement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'STUDENTS' | 'STAFF' | 'PARENTS' | string;
  category: 'SPORTS' | 'ACADEMIC' | 'ASSEMBLY' | 'URGENT' | 'GENERAL' | 'EXAM' | 'HOLIDAY' | string;
  date: string;
  author: string;
  channels?: { sms: boolean; email: boolean; push: boolean };
  deliveredCount?: number;
  isPinned?: boolean;
}

interface AutoTemplate {
  key: string;
  category: 'SPORTS' | 'ACADEMIC' | 'ASSEMBLY' | 'URGENT' | 'GENERAL' | 'EXAM' | 'HOLIDAY';
  targetAudience: 'ALL' | 'STUDENTS' | 'STAFF' | 'PARENTS';
  title: string;
  content: string;
  icon: string;
  badgeLabel: string;
}

const CATEGORY_TEMPLATES: Record<string, AutoTemplate> = {
  SPORTS: {
    key: 'SPORTS',
    category: 'SPORTS',
    targetAudience: 'STUDENTS',
    title: 'Annual Sports Meet Registration Open',
    content: 'Submit entries to PE department before August 5th. Inter-house selection trials will be conducted on August 8th in the main sports grounds.',
    icon: '⚽',
    badgeLabel: 'Sports & Athletics',
  },
  ACADEMIC: {
    key: 'ACADEMIC',
    category: 'ACADEMIC',
    targetAudience: 'STAFF',
    title: 'Mid-Term Review & Pedagogical Standards Alignment',
    content: 'All teachers are requested to update their lesson plans and student progress reports by this Friday. We will have a short alignment briefing during department meetings.',
    icon: '📚',
    badgeLabel: 'Academic Review',
  },
  ASSEMBLY: {
    key: 'ASSEMBLY',
    category: 'ASSEMBLY',
    targetAudience: 'ALL',
    title: 'All-School Morning Assembly & Leadership Talk',
    content: 'A special morning assembly will be held tomorrow at 08:30 AM in the Main Campus Auditorium. Attendance is mandatory for all students and faculty members. Dr. Eleanor Vance will present the new student council members.',
    icon: '🎙️',
    badgeLabel: 'School Assembly',
  },
  URGENT: {
    key: 'URGENT',
    category: 'URGENT',
    targetAudience: 'PARENTS',
    title: 'Term 1 Fee Payment & Clearance Notice',
    content: 'Parents are requested to ensure all outstanding Term 1 fee dues are settled before August 15th to avoid late penalty charges.',
    icon: '⚠️',
    badgeLabel: 'Urgent Dues Notice',
  },
  EXAM: {
    key: 'EXAM',
    category: 'EXAM',
    targetAudience: 'STUDENTS',
    title: 'Term 1 Examination Timetable & Admit Card Issuance',
    content: 'The official examination timetable for Term 1 has been published on the student portal. Admit cards will be issued from the administrative office starting next Monday.',
    icon: '📝',
    badgeLabel: 'Exam Timetable',
  },
  HOLIDAY: {
    key: 'HOLIDAY',
    category: 'HOLIDAY',
    targetAudience: 'ALL',
    title: 'School Holiday Announcement & Campus Reopening',
    content: 'Please note that the institution will remain closed on account of the upcoming public holiday. Regular academic classes and transport schedules will resume on the next working day.',
    icon: '🌴',
    badgeLabel: 'Holiday Advisory',
  },
  GENERAL: {
    key: 'GENERAL',
    category: 'GENERAL',
    targetAudience: 'ALL',
    title: 'Important Institutional Circular & Weekly Campus Update',
    content: 'Dear parents and staff, please find the latest weekly institutional updates attached. We request all stakeholders to review the upcoming schedule and campus activities.',
    icon: '📢',
    badgeLabel: 'General Circular',
  }
};

const DEFAULT_ANNOUNCEMENTS: LocalAnnouncement[] = [
  {
    id: 'COMM-001',
    title: 'Annual Sports Meet Registration Open',
    content: 'Submit entries to PE department before August 5th. Inter-house selection trials will be conducted on August 8th in the main sports grounds.',
    category: 'SPORTS',
    targetAudience: 'ALL',
    date: '2026-07-20',
    author: 'Physical Education Department',
    channels: { sms: true, email: true, push: true },
    deliveredCount: 1420,
    isPinned: true,
  },
  {
    id: 'COMM-002',
    title: 'Mid-Term Review & Pedagogical Standards Alignment',
    content: 'All teachers are requested to update their lesson plans and student progress reports by this Friday. We will have a short alignment briefing during department meetings.',
    category: 'ACADEMIC',
    targetAudience: 'STAFF',
    date: '2026-07-30',
    author: 'Academic Directorate',
    channels: { sms: false, email: true, push: true },
    deliveredCount: 185,
    isPinned: false,
  },
  {
    id: 'COMM-003',
    title: 'All-School Morning Assembly & Leadership Talk',
    content: 'A special morning assembly will be held tomorrow at 08:30 AM in the Main Campus Auditorium. Attendance is mandatory for all students and faculty members. Dr. Eleanor Vance will present the new student council members.',
    category: 'ASSEMBLY',
    targetAudience: 'ALL',
    date: '2026-07-30',
    author: 'Principal Office',
    channels: { sms: true, email: true, push: true },
    deliveredCount: 1420,
    isPinned: false,
  },
  {
    id: 'COMM-004',
    title: 'Science & Innovation Fair 2026 Guidelines',
    content: 'All class 8 to 12 students interested in presenting working models must submit project abstracts to their respective science teachers by August 12th.',
    category: 'ACADEMIC',
    targetAudience: 'STUDENTS',
    date: '2026-08-05',
    author: 'Science Department',
    channels: { sms: true, email: true, push: true },
    deliveredCount: 650,
    isPinned: false,
  },
  {
    id: 'COMM-005',
    title: 'Term 1 Fee Payment & Clearance Notice',
    content: 'Parents are requested to ensure all outstanding Term 1 fee dues are settled before August 15th to avoid late penalty charges.',
    category: 'URGENT',
    targetAudience: 'PARENTS',
    date: '2026-08-10',
    author: 'Finance & Accounts',
    channels: { sms: true, email: true, push: true },
    deliveredCount: 1280,
    isPinned: false,
  }
];

export const CommunicationView: React.FC = () => {
  const { announcements: contextAnnouncements, addAnnouncement } = useData();
  const { addToast } = useToast();
  const { role } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'meetings'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('edu_comm_active_tab');
      if (saved === 'meetings' || saved === 'notifications') return saved;
    }
    return 'notifications';
  });

  const handleTabChange = (tab: 'notifications' | 'meetings') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('edu_comm_active_tab', tab);
    }
  };

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [targetFilter, setTargetFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local announcements state
  const [localAnnouncements, setLocalAnnouncements] = useState<LocalAnnouncement[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('edu_db_communication_hub_notices');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((a: any) => ({
              ...a,
              author: (a.author || '').replace(' & Crisis Management', '') || 'Principal Office'
            }));
          }
        } catch (e) {}
      }
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  const saveAnnouncements = (newItems: LocalAnnouncement[]) => {
    setLocalAnnouncements(newItems);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edu_db_communication_hub_notices', JSON.stringify(newItems));
    }
  };

  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const res = await fetchNotificationsApi(categoryFilter === 'All' ? undefined : categoryFilter, searchQuery || undefined);
        const data = (res as any)?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: LocalAnnouncement[] = data.map((c: any) => ({
            id: String(c.circularId || c.id || `COMM-${Date.now()}`),
            title: c.title || c.circularHeadline || '',
            content: c.content || c.messageContent || '',
            category: (c.category || c.categoryTag || 'SPORTS • ALL').toUpperCase(),
            targetAudience: (c.targetAudience || c.audience || 'ALL').toUpperCase(),
            date: c.createdDate || c.broadcastDate || c.date || new Date().toISOString().split('T')[0],
            author: c.author || 'School Administration',
            deliveredCount: c.deliveredCount || 1420,
            isPinned: Boolean(c.isPinned),
            channels: {
              sms: c.smsSent ?? c.smsAlert ?? true,
              email: c.emailSent ?? c.emailBlast ?? true,
              push: c.pushDelivered ?? c.appPush ?? true,
            }
          }));
          setLocalAnnouncements(mapped);
        }
      } catch (e) {
        console.warn("API fetch notifications fallback to local:", e);
      }
    };
    loadFromApi();
  }, [categoryFilter, searchQuery]);

  // Modal Composer & Edit States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'ALL' | 'STUDENTS' | 'STAFF' | 'PARENTS'>('ALL');
  const [category, setCategory] = useState<'SPORTS' | 'ACADEMIC' | 'ASSEMBLY' | 'URGENT' | 'GENERAL' | 'EXAM' | 'HOLIDAY'>('SPORTS');
  const [broadcastDate, setBroadcastDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [sendSMS, setSendSMS] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [autoLoadedKey, setAutoLoadedKey] = useState<string>('SPORTS');

  const canModify = role === 'Super Admin' || role === 'Admin' || role === 'Principal' || role === 'Teacher';

  // Apply Auto Announcement Template Function
  const applyCategoryTemplate = (catKey: string, isUserClick = true) => {
    const tpl = CATEGORY_TEMPLATES[catKey] || CATEGORY_TEMPLATES['GENERAL'];
    setCategory(tpl.category);
    setTarget(tpl.targetAudience);
    setTitle(tpl.title);
    setContent(tpl.content);
    setAutoLoadedKey(catKey);

    if (isUserClick) {
      addToast(
        'info',
        '✨ Auto Template Loaded',
        `Generated template for ${tpl.badgeLabel}. You can edit the text or send directly.`
      );
    }
  };

  const handleOpenNewCompose = () => {
    setEditingId(null);
    setBroadcastDate(new Date().toISOString().split('T')[0]);
    applyCategoryTemplate('SPORTS', false);
    setIsComposeOpen(true);
  };

  const handleOpenEdit = (item: LocalAnnouncement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setBroadcastDate(item.date || new Date().toISOString().split('T')[0]);
    setCategory((item.category.toUpperCase() as any) || 'GENERAL');
    setTarget((item.targetAudience.toUpperCase() as any) || 'ALL');
    setSendSMS(item.channels?.sms ?? true);
    setSendEmail(item.channels?.email ?? true);
    setSendPush(item.channels?.push ?? true);
    setIsComposeOpen(true);
  };

  const handleCategoryDropdownChange = (selectedCat: string) => {
    applyCategoryTemplate(selectedCat, true);
  };

  const handleBroadcast = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast('warning', 'Required Fields Missing', 'Please provide announcement title and content.');
      return;
    }

    const finalDate = broadcastDate || new Date().toISOString().split('T')[0];

    if (editingId) {
      // API Update Call
      const numericId = parseInt(editingId.replace(/\D/g, ''), 10);
      if (numericId) {
        updateNotificationApi(numericId, {
          title: title.trim(),
          content: content.trim(),
          category: category.toUpperCase(),
          targetAudience: target.toUpperCase(),
          createdDate: finalDate,
          smsSent: sendSMS,
          emailSent: sendEmail,
          pushDelivered: sendPush,
        }).catch(e => console.warn("API update failed:", e));
      }

      // Update local state
      const updated = localAnnouncements.map(a => {
        if (a.id === editingId) {
          return {
            ...a,
            title: title.trim(),
            content: content.trim(),
            category: category.toUpperCase(),
            targetAudience: target.toUpperCase(),
            date: finalDate,
            channels: { sms: sendSMS, email: sendEmail, push: sendPush },
          };
        }
        return a;
      });
      saveAnnouncements(updated);
      addToast('success', 'Announcement Updated', 'Circular text and settings updated successfully.');
    } else {
      // API Create Call
      createNotificationApi({
        title: title.trim(),
        content: content.trim(),
        category: category.toUpperCase(),
        targetAudience: target.toUpperCase(),
        createdDate: finalDate,
        author: role === 'Teacher' ? 'Faculty Member' : 'School Administration',
        deliveredCount: target === 'ALL' ? 1420 : target === 'STAFF' ? 185 : 1280,
        isPinned: priority === 'Urgent',
        smsSent: sendSMS,
        emailSent: sendEmail,
        pushDelivered: sendPush,
      }).catch(e => console.warn("API create failed:", e));

      // Create new local announcement
      const newNotice: LocalAnnouncement = {
        id: `COMM-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        category: category.toUpperCase(),
        targetAudience: target.toUpperCase(),
        date: finalDate,
        author: role === 'Teacher' ? 'Faculty Member' : 'School Administration',
        channels: { sms: sendSMS, email: sendEmail, push: sendPush },
        deliveredCount: target === 'ALL' ? 1420 : target === 'STAFF' ? 185 : 1280,
        isPinned: priority === 'Urgent',
      };

      saveAnnouncements([newNotice, ...localAnnouncements]);
      addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        targetAudience: target as any,
        date: finalDate,
        author: 'School Administration',
        category: category as any,
      });

      addToast(
        'success',
        'Broadcast Circular Dispatched',
        `Dispatched to ${target} via ${sendSMS ? 'SMS, ' : ''}${sendEmail ? 'Email, ' : ''}${sendPush ? 'Push' : ''}`
      );
    }

    setTitle('');
    setContent('');
    setEditingId(null);
    setIsComposeOpen(false);
  };

  const handleEmergencyBroadcast = (type: string) => {
    createNotificationApi({
      title: `🚨 EMERGENCY ALERT: ${type}`,
      content: `Urgent notification regarding ${type}. All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.`,
      category: 'URGENT',
      targetAudience: 'ALL',
      createdDate: new Date().toISOString().split('T')[0],
      author: 'Principal Office',
      deliveredCount: 1420,
      isPinned: true,
      smsSent: true,
      emailSent: true,
      pushDelivered: true,
    }).catch(e => console.warn("API emergency broadcast failed:", e));

    const emergencyNotice: LocalAnnouncement = {
      id: `EMERGENCY-${Date.now()}`,
      title: `🚨 EMERGENCY ALERT: ${type}`,
      content: `Urgent notification regarding ${type}. All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.`,
      category: 'URGENT',
      targetAudience: 'ALL',
      date: new Date().toISOString().split('T')[0],
      author: 'Principal Office',
      channels: { sms: true, email: true, push: true },
      deliveredCount: 1420,
      isPinned: true,
    };

    saveAnnouncements([emergencyNotice, ...localAnnouncements]);
    addToast('error', 'EMERGENCY ALERT BROADCASTED', `Priority SMS & Push alerts sent to all 1,420 users for: ${type}`);
    setIsEmergencyOpen(false);
  };

  const handleDeleteNotice = (id: string) => {
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (numericId) {
      deleteNotificationApi(numericId).catch(e => console.warn("API delete failed:", e));
    }
    const updated = localAnnouncements.filter(a => a.id !== id);
    saveAnnouncements(updated);
    addToast('info', 'Notice Removed', 'Broadcast circular removed from notice board.');
  };

  const handleTogglePin = (id: string) => {
    const updated = localAnnouncements.map(a => {
      if (a.id === id) return { ...a, isPinned: !a.isPinned };
      return a;
    });
    saveAnnouncements(updated);
    addToast('success', 'Notice Updated', 'Pin status updated.');
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, targetFilter, searchQuery, pageSize]);

  // Filtered announcements
  const filteredAnnouncements = localAnnouncements.filter(item => {
    const matchCat = categoryFilter === 'All' || item.category.toUpperCase() === categoryFilter.toUpperCase();
    const matchTarget = targetFilter === 'All' || item.targetAudience.toUpperCase() === targetFilter.toUpperCase();
    const matchQuery = 
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchTarget && matchQuery;
  });

  const totalItems = filteredAnnouncements.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAnnouncements = filteredAnnouncements.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Header Tab Navigation matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-2xl shadow-sm">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Communication Hub</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Broadcast official circulars, SMS alerts & schedule parent-teacher meetings
            </p>
          </div>
        </div>

        {/* Tab Switcher matching screenshot right side pill buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('notifications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-500/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Broadcast Notifications
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('meetings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'meetings'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-500/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Meetings & Schedules
          </button>
        </div>
      </div>

      {activeTab === 'meetings' ? (
        <MeetingsView />
      ) : (
        <>
          {/* Executive Analytics & Quick Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Circulars</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{localAnnouncements.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SMS Alerts Sent</p>
                <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">14,280</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Dispatches</p>
                <h3 className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">14,280</h3>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Delivery Rate</p>
                <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">99.4%</h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Radio className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Toolbar & Search Bar - Sleek Rearranged 2-Tier Layout */}
          <div className="glass-card p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm bg-white dark:bg-slate-900">
            {/* Row 1: Search Bar & Primary Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search circulars by keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {canModify && (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                  <button
                    onClick={() => setIsEmergencyOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4" /> Emergency Alert
                  </button>
                  <button
                    onClick={handleOpenNewCompose}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Compose Broadcast
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Clean Category Filters & Target Audience Selector */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
                {['All', 'Sports', 'Academic', 'Assembly', 'Urgent', 'Exam', 'Holiday'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden sm:inline">Audience:</span>
                <select
                  value={targetFilter}
                  onChange={e => setTargetFilter(e.target.value)}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="All">All Audiences</option>
                  <option value="ALL">All Users</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="PARENTS">Parents Only</option>
                  <option value="STAFF">Staff Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Broadcast Circular List Cards - Matching Screenshot Design Pixel-Perfectly */}
          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="py-16 text-center glass-card rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No broadcast notifications match your search/filter.</p>
              </div>
            ) : (
              paginatedAnnouncements.map((item) => {
                const badgeLabel = `${item.category.toUpperCase()} • ${item.targetAudience.toUpperCase()}`;
                
                return (
                  <div
                    key={item.id}
                    className={`glass-card p-6 rounded-3xl border transition-all hover:shadow-md space-y-3 bg-white dark:bg-slate-900 ${
                      item.isPinned 
                        ? 'border-sky-300 dark:border-sky-800 ring-1 ring-sky-400/20' 
                        : 'border-sky-100 dark:border-sky-900/60'
                    }`}
                  >
                    {/* Top Row: Category Badge (Left) & Date + Actions (Right) matching screenshot */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 border border-sky-100 dark:border-sky-900/60 uppercase">
                        {badgeLabel}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                          {item.date}
                        </span>
                        {canModify && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors"
                              title="Edit Announcement Text"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTogglePin(item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.isPinned ? 'text-sky-600 bg-sky-50 dark:bg-sky-950' : 'text-slate-300 hover:text-slate-600'
                              }`}
                              title={item.isPinned ? 'Unpin' : 'Pin to top'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(item.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 transition-colors"
                              title="Delete Notice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Headline Title */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {item.title}
                    </h3>

                    {/* Notice Content */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {item.content}
                    </p>

                    {/* Footer Row: Channel Delivery Status */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sent via SMS & Email ({item.deliveredCount || 1420} Recipients)
                        </span>
                      </div>
                      <span className="text-slate-400 italic">Issued by {item.author}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Clean Pagination Bar */}
            {filteredAnnouncements.length > 0 && (
              <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span>
                    Showing <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> circulars
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] font-bold text-slate-400">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={e => setPageSize(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all ${
                        currentPage === p
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COMPOSE & EDIT BROADCAST MODAL WITH AUTO-TEMPLATES */}
          {isComposeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-600 rounded-xl">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingId ? 'Edit Broadcast Circular' : 'Compose Broadcast Circular'}
                    </h3>
                  </div>
                  <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Auto Announcement Preset Chips */}
                {!editingId && (
                  <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" /> ✨ Quick Auto Templates:
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">1-Click Auto Fill</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(CATEGORY_TEMPLATES).map((tpl) => (
                        <button
                          key={tpl.key}
                          type="button"
                          onClick={() => applyCategoryTemplate(tpl.key, true)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                            autoLoadedKey === tpl.key
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-sky-50'
                          }`}
                        >
                          <span>{tpl.icon}</span>
                          <span>{tpl.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Circular Headline / Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Annual Sports Meet Registration Open"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Broadcast Date *</label>
                      <input
                        type="date"
                        value={broadcastDate}
                        onChange={e => setBroadcastDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Category Tag *</label>
                      <select
                        value={category}
                        onChange={e => handleCategoryDropdownChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="SPORTS">SPORTS</option>
                        <option value="ACADEMIC">ACADEMIC</option>
                        <option value="ASSEMBLY">ASSEMBLY</option>
                        <option value="URGENT">URGENT</option>
                        <option value="EXAM">EXAM</option>
                        <option value="HOLIDAY">HOLIDAY</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Audience *</label>
                      <select
                        value={target}
                        onChange={e => setTarget(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="ALL">ALL (Students, Parents & Staff)</option>
                        <option value="STUDENTS">STUDENTS ONLY</option>
                        <option value="PARENTS">PARENTS ONLY</option>
                        <option value="STAFF">STAFF ONLY</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Notification Delivery Channels</label>
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                        <input type="checkbox" checked={sendSMS} onChange={e => setSendSMS(e.target.checked)} className="rounded text-sky-600" />
                        <span>SMS Alert</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                        <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="rounded text-sky-600" />
                        <span>Email Blast</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                        <input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} className="rounded text-sky-600" />
                        <span>App Push</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">Message Content / Circular Text *</label>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold italic">✏️ Editable Text Area</span>
                    </div>
                    <textarea
                      rows={5}
                      required
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Type or edit the announcement text here..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(false)}
                      className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> {editingId ? 'Save Changes & Dispatch' : 'Dispatch Broadcast'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EMERGENCY ALERT TRIGGER MODAL */}
          {isEmergencyOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/70 backdrop-blur-md animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-2xl animate-pulse">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Emergency Broadcast Trigger</h3>
                    <p className="text-[11px] text-rose-600 font-bold">Instant SMS & Call Advisory to 1,420 Users</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  Select emergency category and broadcast date to immediately dispatch high-priority SMS and push notifications to all parents, students, and staff:
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Broadcast Date *</label>
                  <input
                    type="date"
                    value={broadcastDate}
                    onChange={e => setBroadcastDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => handleEmergencyBroadcast('Heavy Rainfall & Weather Advisory - Unexpected Holiday')}
                    className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs text-left flex items-center justify-between transition-all"
                  >
                    <span>⛈️ Weather & Rainy Holiday Alert</span>
                    <Send className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    onClick={() => handleEmergencyBroadcast('Campus Safety Drill Notice')}
                    className="w-full p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs text-left flex items-center justify-between transition-all"
                  >
                    <span>🛡️ Campus Safety Drill Notice</span>
                    <Send className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsEmergencyOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
