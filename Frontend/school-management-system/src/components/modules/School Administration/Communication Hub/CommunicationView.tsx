import React, { useState, useMemo, useEffect } from 'react';
import { 
  Megaphone, Send, Calendar, Clock, Plus, X, Edit3, Trash2, Pin, CheckCircle2, 
  ShieldAlert
} from 'lucide-react';
import { useData } from '../../../../context/DataContext';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';
import { MeetingsView } from './MeetingsView';
import { createNotificationApi, updateNotificationApi, deleteNotificationApi } from '../../../../api/communication';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  category: string;
  date: string;
  time?: string;
  author?: string;
  targetClass?: string;
  targetSection?: string;
  isPinned?: boolean;
  recipientsCount?: number;
  deliveryChannels?: string;
}

export const CommunicationView: React.FC = () => {
  const { announcements: contextAnnouncements, addAnnouncement, saveAnnouncements, students = [], staff = [] } = useData();
  const { addToast } = useToast();
  const { role } = useAuth();

  const totalUserCount = useMemo(() => {
    const sCount = students.length > 0 ? students.length : 650;
    const stCount = staff.length > 0 ? staff.length : 120;
    return sCount + sCount + stCount; // Students + Parents + Staff
  }, [students.length, staff.length]);

  const getTargetRecipientsCount = (targetAudience: string) => {
    const sCount = students.length > 0 ? students.length : 650;
    const stCount = staff.length > 0 ? staff.length : 120;
    switch (targetAudience?.toUpperCase()) {
      case 'STUDENTS ONLY':
        return sCount;
      case 'STAFF ONLY':
        return stCount;
      case 'PARENTS ONLY':
        return sCount;
      case 'ALL':
      default:
        return sCount + sCount + stCount;
    }
  };

  const [activeTab, setActiveTab] = useState<'notifications' | 'meetings'>('notifications');
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const userRole = (role || '').toLowerCase();
  const canModify = userRole.includes('admin') || userRole.includes('teacher') || userRole.includes('principal') || userRole.includes('staff') || userRole.includes('librarian');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [broadcastDate, setBroadcastDate] = useState(new Date().toISOString().split('T')[0]);
  const [broadcastTime, setBroadcastTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [emergencyDate, setEmergencyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [emergencyTime, setEmergencyTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [target, setTarget] = useState<'STUDENTS ONLY' | 'STAFF ONLY' | 'PARENTS ONLY' | 'ALL'>('ALL');
  const [category, setCategory] = useState<'SPORTS' | 'ACADEMIC' | 'ASSEMBLY' | 'URGENT' | 'EXAM' | 'HOLIDAY' | 'GENERAL'>('GENERAL');
  const [sendSMS, setSendSMS] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);

  // Initial Default sample circulars with Date & Time
  const defaultAnnouncements: AnnouncementItem[] = useMemo(() => [
    {
      id: 'ANN-REAL-2',
      title: '🚨 EMERGENCY ALERT: Heavy Rainfall & Weather Advisory - Unexpected Holiday',
      content: 'Urgent notification regarding Heavy Rainfall & Weather Advisory - Unexpected Holiday. All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.',
      targetAudience: 'ALL',
      category: 'URGENT',
      date: '2026-08-18',
      time: '08:15 AM',
      author: 'Principal Office',
      isPinned: true,
      recipientsCount: 1420,
      deliveryChannels: 'SMS & Email'
    },
    {
      id: 'ANN-REAL-3',
      title: 'All-School Morning Assembly & Leadership Talk',
      content: 'A special morning assembly will be held tomorrow at 08:30 AM in the Main Campus Auditorium. Attendance is mandatory for all students and faculty members. Dr. Eleanor Vance will present the new student council members.',
      targetAudience: 'ALL',
      category: 'ASSEMBLY',
      date: '2026-08-18',
      time: '09:00 AM',
      author: 'School Administration',
      isPinned: false,
      recipientsCount: 1420,
      deliveryChannels: 'SMS & Email'
    },
    {
      id: 'ANN-REAL-4',
      title: 'Annual Sports Meet Registration Open',
      content: 'Submit entries to PE department before August 5th. Inter-house selection trials will be conducted on August 8th in the main sports grounds.',
      targetAudience: 'STUDENTS ONLY',
      category: 'SPORTS',
      date: '2026-07-20',
      time: '10:30 AM',
      author: 'PE Department',
      isPinned: false,
      recipientsCount: 850,
      deliveryChannels: 'SMS & App Push'
    },
    {
      id: 'ANN-REAL-5',
      title: 'Mid-Term Review & Pedagogical Standards Alignment',
      content: 'All teachers are requested to update their lesson plans and student progress reports by this Friday. We will have a short alignment briefing during department meetings.',
      targetAudience: 'STAFF ONLY',
      category: 'ACADEMIC',
      date: '2026-07-30',
      time: '02:00 PM',
      author: 'Academic Coordinator',
      isPinned: false,
      recipientsCount: 120,
      deliveryChannels: 'Email Blast'
    }
  ], []);

  // Local list state synchronized with DataContext & Local Storage for instant updates
  const [localList, setLocalList] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('broadcast_announcements_store');
      if (saved) {
        const parsed: AnnouncementItem[] = JSON.parse(saved);
        return parsed.filter(item => !item.title.includes('Early School Dismissal') && !item.title.includes('Early Bus'));
      }
    } catch (e) {
      // Fallback
    }
    return defaultAnnouncements;
  });

  // Sync contextAnnouncements into localList if available
  useEffect(() => {
    if (contextAnnouncements && contextAnnouncements.length > 0) {
      const contextMapped: AnnouncementItem[] = contextAnnouncements
        .filter(a => !a.title.includes('Early School Dismissal') && !a.title.includes('Early Bus'))
        .map(a => ({
          id: a.id || `ANN-${Math.random()}`,
          title: a.title,
          content: a.content,
          targetAudience: a.targetAudience || 'ALL',
          category: (a.category || 'GENERAL').toUpperCase(),
          date: a.date || new Date().toISOString().split('T')[0],
          time: (a as any).time || '09:30 AM',
          author: a.author || 'School Administration',
          isPinned: (a as any).isPinned || false,
          recipientsCount: (a as any).recipientsCount || 1420,
          deliveryChannels: (a as any).deliveryChannels || 'SMS & Email'
        }));

      const mergedMap = new Map<string, AnnouncementItem>();
      [...contextMapped, ...localList, ...defaultAnnouncements].forEach(item => {
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, item);
        }
      });
      setLocalList(Array.from(mergedMap.values()));
    }
  }, [contextAnnouncements]);

  // Combined circular list sorted by pinned status first
  const displayAnnouncements: AnnouncementItem[] = useMemo(() => {
    return [...localList].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [localList]);

  // Helper to persist list
  const updateLocalList = (newList: AnnouncementItem[]) => {
    setLocalList(newList);
    try {
      localStorage.setItem('broadcast_announcements_store', JSON.stringify(newList));
    } catch (e) {}
    if (saveAnnouncements) {
      saveAnnouncements(newList as any);
    }
  };

  // Pagination calculation
  const totalItems = displayAnnouncements.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return displayAnnouncements.slice(start, start + rowsPerPage);
  }, [displayAnnouncements, currentPage, rowsPerPage]);

  const newDateDate = () => new Date().toISOString().split('T')[0];

  // Helper for current formatted time
  const getCurrentTimeFormatted = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Trigger Emergency Dispatch Quick Actions (Weather & Safety Drill Only) with Date & Time
  const handleTriggerEmergency = async (type: 'weather' | 'safety_drill') => {
    let emergencyTitle = '';
    let emergencyContent = '';

    const formattedDateTime = `Dispatched on ${emergencyDate} at ${emergencyTime}`;

    if (type === 'weather') {
      emergencyTitle = '🚨 EMERGENCY ALERT: Heavy Rainfall & Weather Advisory - Unexpected Holiday';
      emergencyContent = `Urgent notification regarding Heavy Rainfall & Weather Advisory - Unexpected Holiday (${formattedDateTime}). All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.`;
    } else if (type === 'safety_drill') {
      emergencyTitle = '🛡️ EMERGENCY NOTICE: Mandatory Campus Safety & Evacuation Drill';
      emergencyContent = `Special notice regarding Mandatory Campus Safety & Evacuation Drill (${formattedDateTime}). All faculty, staff, and students please prepare for the scheduled campus drill.`;
    }

    let serverId = `ANN-${Date.now()}`;
    try {
      const res = await createNotificationApi({
        title: emergencyTitle,
        content: emergencyContent,
        category: 'URGENT',
        targetAudience: 'ALL',
        createdDate: emergencyDate,
        author: 'Principal Office',
        isPinned: true,
        deliveredCount: totalUserCount,
        smsSent: true,
        emailSent: true,
        pushDelivered: true
      });
      if (res?.data?.circularId) serverId = res.data.circularId.toString();
    } catch (err) {
      console.warn("API createNotification emergency error:", err);
    }

    const newEmergencyItem: AnnouncementItem = {
      id: serverId,
      title: emergencyTitle,
      content: emergencyContent,
      targetAudience: 'ALL',
      category: 'URGENT',
      date: emergencyDate,
      time: emergencyTime,
      author: 'Principal Office',
      isPinned: true,
      recipientsCount: totalUserCount,
      deliveryChannels: 'SMS & Call Advisory'
    };

    const updated = [newEmergencyItem, ...localList];
    updateLocalList(updated);

    addAnnouncement({
      title: emergencyTitle,
      content: emergencyContent,
      targetAudience: 'ALL' as any,
      date: emergencyDate,
      author: 'Principal Office',
      category: 'URGENT' as any
    });

    addToast('success', '📱 Instant SMS & Emergency Call Advisory Sent!', `Dispatched ${totalUserCount.toLocaleString()} High-Priority SMS & Push Advisories via SMS Gateway on ${emergencyDate} at ${emergencyTime}!`);
    setIsEmergencyModalOpen(false);
    setCurrentPage(1);
  };

  // Quick Auto Templates Handler
  const applyTemplate = (tmplKey: 'SPORTS' | 'ACADEMIC' | 'ASSEMBLY' | 'URGENT' | 'EXAM' | 'HOLIDAY' | 'GENERAL') => {
    setCategory(tmplKey);
    setBroadcastDate(newDateDate());
    setBroadcastTime(getCurrentTimeFormatted());

    switch (tmplKey) {
      case 'SPORTS':
        setTitle('Annual Sports Meet Registration Open');
        setTarget('STUDENTS ONLY');
        setContent('Submit entries to PE department before August 5th. Inter-house selection trials will be conducted on August 8th in the main sports grounds.');
        break;
      case 'ACADEMIC':
        setTitle('Mid-Term Review & Pedagogical Standards Alignment');
        setTarget('STAFF ONLY');
        setContent('All teachers are requested to update their lesson plans and student progress reports by this Friday. We will have a short alignment briefing during department meetings.');
        break;
      case 'ASSEMBLY':
        setTitle('All-School Morning Assembly & Leadership Talk');
        setTarget('ALL');
        setContent('A special morning assembly will be held tomorrow at 08:30 AM in the Main Campus Auditorium. Attendance is mandatory for all students and faculty members.');
        break;
      case 'URGENT':
        setTitle('🚨 EMERGENCY ALERT: Heavy Rainfall & Weather Advisory - Unexpected Holiday');
        setTarget('ALL');
        setContent('Urgent notification regarding Heavy Rainfall & Weather Advisory - Unexpected Holiday. All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.');
        break;
      case 'EXAM':
        setTitle('Term Examination Schedule & Hall Tickets Issued');
        setTarget('STUDENTS ONLY');
        setContent('Hall tickets for the upcoming Term Examinations are now available for download. Students are requested to verify their subject codes and exam roll numbers.');
        break;
      case 'HOLIDAY':
        setTitle('Institutional Holiday Notice');
        setTarget('ALL');
        setContent('The institution will remain closed on account of national holiday. Normal academic operations will resume on the next working day.');
        break;
      case 'GENERAL':
        setTitle('General Campus Facilities & Library Timings Update');
        setTarget('ALL');
        setContent('Please note updated library opening hours and sports facility access schedules starting from next week.');
        break;
    }
  };

  const handleOpenCompose = (itemToEdit?: AnnouncementItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setTitle(itemToEdit.title);
      setContent(itemToEdit.content);
      setBroadcastDate(itemToEdit.date);
      setBroadcastTime(itemToEdit.time || getCurrentTimeFormatted());
      setCategory((itemToEdit.category.toUpperCase() as any) || 'GENERAL');
      setTarget((itemToEdit.targetAudience.toUpperCase() as any) || 'ALL');
    } else {
      setEditingItem(null);
      setTitle('');
      setContent('');
      setBroadcastDate(newDateDate());
      setBroadcastTime(getCurrentTimeFormatted());
      setCategory('GENERAL');
      setTarget('ALL');
    }
    setIsComposeModalOpen(true);
  };

  const handleOpenEmergencyModal = () => {
    setEmergencyDate(newDateDate());
    setEmergencyTime(getCurrentTimeFormatted());
    setIsEmergencyModalOpen(true);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingItem) {
      const numericId = parseInt(editingItem.id.replace(/\D/g, ''), 10);
      if (numericId) {
        try {
          await updateNotificationApi(numericId, {
            title: title.trim(),
            content: content.trim(),
            category: category.toUpperCase(),
            targetAudience: target.toUpperCase(),
            isPinned: editingItem.isPinned
          });
        } catch (err) {
          console.warn("API updateNotification error:", err);
        }
      }
      const updated = localList.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              title: title.trim(),
              content: content.trim(),
              date: broadcastDate,
              time: broadcastTime,
              category: category.toUpperCase(),
              targetAudience: target.toUpperCase()
            }
          : item
      );
      updateLocalList(updated);
      addToast('success', 'Broadcast Circular Updated', `Saved changes for "${title}"`);
    } else {
      const channelStr = `${sendSMS ? 'SMS' : ''}${sendSMS && sendEmail ? ' & ' : ''}${sendEmail ? 'Email' : ''}${sendPush ? ' & Push' : ''}`;
      let serverId = `ANN-${Date.now()}`;
      try {
        const res = await createNotificationApi({
          title: title.trim(),
          content: content.trim(),
          category: category.toUpperCase(),
          targetAudience: target.toUpperCase(),
          createdDate: broadcastDate,
          author: role.toLowerCase().includes('teacher') ? 'Teacher' : 'Principal Office',
          isPinned: false,
          deliveredCount: 1420,
          smsSent: sendSMS,
          emailSent: sendEmail,
          pushDelivered: sendPush
        });
        if (res?.data?.circularId) serverId = res.data.circularId.toString();
      } catch (err) {
        console.warn("API createNotification error:", err);
      }

      const newCircular: AnnouncementItem = {
        id: serverId,
        title: title.trim(),
        content: content.trim(),
        targetAudience: target,
        category: category.toUpperCase(),
        date: broadcastDate,
        time: broadcastTime,
        author: role.toLowerCase().includes('teacher') ? 'Teacher' : 'Principal Office',
        isPinned: false,
        recipientsCount: 1420,
        deliveryChannels: channelStr || 'SMS & Email'
      };

      const updated = [newCircular, ...localList];
      updateLocalList(updated);

      addAnnouncement({
        title: newCircular.title,
        content: newCircular.content,
        targetAudience: newCircular.targetAudience as any,
        date: newCircular.date,
        author: newCircular.author,
        category: newCircular.category as any
      });

      addToast('success', '📢 Broadcast Notification Published!', `Sent circular for ${broadcastDate} at ${broadcastTime} to ${target} via ${channelStr}`);
    }

    setIsComposeModalOpen(false);
    setCurrentPage(1);
  };

  const handleTogglePin = async (id: string) => {
    const targetItem = localList.find(i => i.id === id);
    const newPinStatus = !targetItem?.isPinned;
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (numericId) {
      try {
        await updateNotificationApi(numericId, { isPinned: newPinStatus });
      } catch (e) {
        console.warn("API pin update error:", e);
      }
    }
    const updated = localList.map(item =>
      item.id === id ? { ...item, isPinned: newPinStatus } : item
    );
    updateLocalList(updated);
    addToast('info', newPinStatus ? 'Pinned Circular to Top' : 'Unpinned Circular', `Updated pin status for "${targetItem?.title}"`);
  };

  const handleDeleteCircular = async (id: string, titleStr: string) => {
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (numericId) {
      try {
        await deleteNotificationApi(numericId);
      } catch (e) {
        console.warn("API delete circular error:", e);
      }
    }
    const updated = localList.filter(item => item.id !== id);
    updateLocalList(updated);
    addToast('success', 'Circular Removed', `Deleted "${titleStr}"`);
  };

  // Uniform Professional Single-Color Style for All Quick Auto Templates
  const templateButtonClass = "px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-400 font-extrabold text-[11px] border border-slate-200/80 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center gap-1 shadow-2xs";

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* LEVEL 1: Clean Page Title & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-xs">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Communication Hub</h2>
          </div>
        </div>

        {/* Action Buttons Aligned Cleanly on Right */}
        {canModify && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenEmergencyModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-800 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Emergency Trigger
            </button>

            <button
              onClick={() => handleOpenCompose()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Compose Broadcast
            </button>
          </div>
        )}
      </div>

      {/* LEVEL 2: Navigation Bar (Tab Switcher) Aligned Cleanly */}
      {!(role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') && (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              Broadcast Notifications
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'meetings'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Meetings & Schedules
            </button>
          </div>
        </div>
      )}

      {activeTab === 'meetings' && !(role.toLowerCase() === 'parent' || role.toLowerCase() === 'student') ? (
        <MeetingsView />
      ) : (
        <div className="space-y-4 max-w-full">
          {/* Main Cards List */}
          <div className="space-y-4">
            {paginatedItems.map((a) => (
              <div
                key={a.id}
                className={`glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border ${
                  a.isPinned ? 'border-sky-400 dark:border-sky-600 shadow-md' : 'border-sky-200 dark:border-sky-800/60 shadow-xs'
                } hover:shadow-md transition-all space-y-3`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[11px] tracking-wide uppercase border border-sky-100 dark:border-sky-900">
                      {a.category} • {a.targetAudience}
                    </span>
                    {a.isPinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3 text-amber-600 fill-amber-600" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Full Date & Time Display on Top Right */}
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <span className="flex items-center gap-1 text-sky-700 dark:text-sky-300">
                        <Calendar className="w-3 h-3" /> {a.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-amber-600" /> {a.time || '09:30 AM'}
                      </span>
                    </div>

                    {canModify && (
                      <div className="flex items-center gap-1 border-l pl-3 border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleOpenCompose(a)}
                          title="Edit Circular"
                          className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePin(a.id)}
                          title={a.isPinned ? 'Unpin Circular' : 'Pin to Top'}
                          className={`p-1 transition-colors cursor-pointer ${a.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-600'}`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCircular(a.id, a.title)}
                          title="Delete Circular"
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {a.title}
                </h3>

                {/* Body Text */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {a.content}
                </p>

                {/* Card Footer Line */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sent via {a.deliveryChannels || 'SMS & Email'} ({a.recipientsCount || 1420} Recipients)</span>
                  </div>

                  <span className="text-slate-400 dark:text-slate-500 italic font-medium">
                    Issued by {a.author || 'Principal Office'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Pagination Control */}
          <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="text-slate-900 dark:text-white">{totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</strong> to <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * rowsPerPage, totalItems)}</strong> of <strong className="text-slate-900 dark:text-white">{totalItems}</strong> circulars
              </span>

              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                    currentPage === pg
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Broadcast Trigger Modal with Date & Time Picker */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-8 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Emergency Broadcast Trigger</h3>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    Instant SMS & Call Advisory to {totalUserCount.toLocaleString()} Users
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date & Time Input Box */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-slate-800/60 border border-rose-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-black uppercase text-rose-900 dark:text-rose-300">
                📅 Broadcast Dispatch Date & Time *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Date</label>
                  <input
                    type="date"
                    required
                    value={emergencyDate}
                    onChange={e => setEmergencyDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono font-bold text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Time</label>
                  <input
                    type="text"
                    required
                    value={emergencyTime}
                    onChange={e => setEmergencyTime(e.target.value)}
                    placeholder="09:30 AM"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-white font-mono font-bold text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Select emergency category to immediately dispatch high-priority SMS and push notifications to all parents, students, and staff:
            </p>

            <div className="space-y-3">
              <div
                onClick={() => handleTriggerEmergency('weather')}
                className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:border-rose-400 transition-all flex items-center justify-between cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">☔</span>
                  <span className="font-black text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                    Weather & Rainy Holiday Alert
                  </span>
                </div>
                <Send className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
              </div>

              <div
                onClick={() => handleTriggerEmergency('safety_drill')}
                className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 hover:border-sky-400 transition-all flex items-center justify-between cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🛡️</span>
                  <span className="font-black text-xs sm:text-sm text-sky-700 dark:text-sky-300">
                    Campus Safety Drill Notice
                  </span>
                </div>
                <Send className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-5 py-2 font-extrabold text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Broadcast Circular Modal with Date & Time Inputs */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-xl w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-xl text-sky-600 dark:text-sky-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                {editingItem ? 'Edit Broadcast Circular' : 'Compose Broadcast Circular'}
              </h3>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Auto Templates Container */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold">
                <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1 uppercase tracking-wide">
                  ✨ Quick Auto Templates:
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px]">
                  1-Click Auto Fill
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => applyTemplate('SPORTS')}
                  className={templateButtonClass}
                >
                  🏀 SPORTS
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('ACADEMIC')}
                  className={templateButtonClass}
                >
                  📚 ACADEMIC
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('ASSEMBLY')}
                  className={templateButtonClass}
                >
                  🎙️ ASSEMBLY
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('URGENT')}
                  className={templateButtonClass}
                >
                  ⚠️ URGENT
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('EXAM')}
                  className={templateButtonClass}
                >
                  📝 EXAM
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('HOLIDAY')}
                  className={templateButtonClass}
                >
                  🌴 HOLIDAY
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('GENERAL')}
                  className={templateButtonClass}
                >
                  📢 GENERAL
                </button>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Circular Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Annual Sports Meet Registration Open"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Broadcast Date *</label>
                  <input
                    type="date"
                    required
                    value={broadcastDate}
                    onChange={e => setBroadcastDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Broadcast Time <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    value={broadcastTime}
                    onChange={e => setBroadcastTime(e.target.value)}
                    placeholder="09:30 AM"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Category Tag *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none cursor-pointer text-[11px]"
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
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Target Audience *</label>
                  <select
                    value={target}
                    onChange={e => setTarget(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none cursor-pointer text-[11px]"
                  >
                    <option value="STUDENTS ONLY">STUDENTS ONLY</option>
                    <option value="STAFF ONLY">STAFF ONLY</option>
                    <option value="PARENTS ONLY">PARENTS ONLY</option>
                    <option value="ALL">ALL</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">Notification Delivery Channels</label>
                <div className="flex flex-wrap items-center gap-6 font-bold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sendSMS} onChange={e => setSendSMS(e.target.checked)} className="rounded text-sky-600" />
                    <span>SMS Alert</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="rounded text-sky-600" />
                    <span>Email Blast</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} className="rounded text-sky-600" />
                    <span>App Push</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Message Content / Circular Text *</label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">✏️ Editable Text Area</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Submit entries to PE department before August 5th. Inter-house selection trials will be conducted on August 8th in the main sports grounds."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-medium outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {editingItem ? 'Save Changes' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
