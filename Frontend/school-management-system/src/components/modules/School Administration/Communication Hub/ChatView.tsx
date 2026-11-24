// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, Search, Users, User, Video, Calendar, Paperclip, Smile, 
  CheckCheck, Clock, Plus, Phone, FileText, Image as ImageIcon, 
  Sparkles, MessageSquare, AlertCircle, X, ExternalLink, ThumbsUp, 
  Heart, Star, Check, BookOpen, GraduationCap, ArrowRight, ShieldCheck,
  ChevronDown, RefreshCw, Loader2
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { useData } from '../../../../context/DataContext';
import { DateInput } from '../../../common/DateInput';
import { TimeInput } from '../../../common/TimeInput';
import { 
  fetchChatContactsApi, 
  fetchChatMessagesApi, 
  sendChatMessageApi, 
  initiateDirectCallApi,
  ChatContact,
  ChatMessage 
} from '../../../../api/chatApi';
import { scheduleMeetingApi } from '../../../../api/communication';

interface ChatViewProps {
  preselectedContactId?: string;
  onNavigateToMeetings?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ 
  preselectedContactId,
  onNavigateToMeetings 
}) => {
  const { user, role, selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();
  const { academicClasses } = useData();

  // Live Contacts & Messages state loaded from Backend
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string;
    name: string;
    role: string;
    className?: string;
    section?: string;
  } | null>(null);

  const effectiveRole = (currentUserProfile?.role || user?.role || role || '').toLowerCase();
  const safeRole = effectiveRole.includes('student') ? 'student' : (effectiveRole.includes('teacher') ? 'teacher' : (effectiveRole.includes('parent') ? 'parent' : 'staff'));
  const currentUserId = String(currentUserProfile?.id || user?.id || user?.email || 'current-user');
  const currentUserName = currentUserProfile?.name || user?.name || user?.username || 'You';

  const [selectedContactId, setSelectedContactId] = useState<string>(preselectedContactId || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Filters
  const [contactFilter, setContactFilter] = useState<'all' | 'teachers' | 'students' | 'parents'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Extract all distinct classes for filtering
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(academicClasses)) {
      academicClasses.forEach((c: any) => {
        const name = c.name || c.className;
        if (name && typeof name === 'string' && name.trim()) set.add(name.trim());
      });
    }
    contacts.forEach(c => {
      if (c.className && typeof c.className === 'string' && c.className.trim()) {
        set.add(c.className.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [academicClasses, contacts]);

  // 1. Fetch Contacts from Backend API
  const loadContacts = async (preserveSelectedId?: string, classFilterParam?: string) => {
    try {
      const activeClass = classFilterParam !== undefined ? classFilterParam : selectedClassFilter;
      const res = await fetchChatContactsApi(activeClass);
      if (res && res.success && Array.isArray(res.data)) {
        setContacts(res.data);
        if (res.currentUser) {
          setCurrentUserProfile(res.currentUser);
        }

        const targetId = preserveSelectedId || selectedContactId || preselectedContactId;
        if (targetId && res.data.some(c => c.id === targetId)) {
          setSelectedContactId(targetId);
        } else if (res.data.length > 0 && !selectedContactId) {
          setSelectedContactId(res.data[0].id);
        }
      }
    } catch (err: any) {
      console.warn("Failed to load chat contacts from backend:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts(preselectedContactId);
  }, [preselectedContactId]);

  // 2. Resolve Active Contact
  const activeContact = useMemo(() => {
    return contacts.find(c => c.id === selectedContactId) || contacts[0] || null;
  }, [contacts, selectedContactId]);

  // 3. Fetch Messages for Active Contact from Backend API
  const loadMessages = async (contactId: string, isSilent = false) => {
    if (!contactId) return;
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await fetchChatMessagesApi(contactId);
      if (res && res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        // Clear unread badge on active contact
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err: any) {
      console.warn("Failed to load messages from backend:", err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeContact?.id) {
      loadMessages(activeContact.id);
    }
  }, [activeContact?.id]);

  // 4. Polling for live message delivery every 4 seconds
  useEffect(() => {
    if (!activeContact?.id) return;
    const interval = setInterval(() => {
      loadMessages(activeContact.id, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeContact?.id]);

  // Auto-scroll chat to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedContactId]);

  // Filtered Contacts List with Category & Class Filters
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (contactFilter === 'teachers' && c.role !== 'teacher') return false;
      if (contactFilter === 'students' && c.role !== 'student') return false;
      if (contactFilter === 'parents' && c.role !== 'parent') return false;

      // Filter by class (for students and parents)
      if (selectedClassFilter !== 'all') {
        if (c.role === 'student' || c.role === 'parent') {
          if (!c.className || !c.className.toLowerCase().includes(selectedClassFilter.toLowerCase())) {
            return false;
          }
        } else if (c.role === 'teacher' && contactFilter !== 'teachers') {
          // Under 'All', when a specific class is chosen, focus on that class's students & parents
          return false;
        }
      }

      if (contactSearch.trim()) {
        const q = contactSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) || 
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          (c.className && c.className.toLowerCase().includes(q)) ||
          (c.admissionNo && c.admissionNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [contacts, contactFilter, contactSearch, selectedClassFilter]);

  // Send Direct Message via Backend API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeContact || isSending) return;

    const textToSend = inputText.trim();
    setIsSending(true);

    try {
      const res = await sendChatMessageApi({
        receiverId: activeContact.id,
        receiverName: activeContact.name,
        receiverRole: activeContact.role,
        messageText: textToSend
      });

      if (res && res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setInputText('');
        setShowEmojiPicker(false);

        // Update last message preview in contacts list
        setContacts(prev => prev.map(c => 
          c.id === activeContact.id 
            ? { ...c, lastMessage: textToSend, lastMessageTime: res.data.timestamp }
            : c
        ));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send message.';
      addToast('error', 'Message Delivery Failed', msg);
    } finally {
      setIsSending(false);
    }
  };

  // Launch Instant Live Video Call via Backend API (Generates Room & Invitation Card)
  const handleLaunchInstantVideoCall = async () => {
    if (!activeContact) return;

    try {
      const res = await initiateDirectCallApi({
        receiverId: activeContact.id,
        receiverName: activeContact.name,
        receiverRole: activeContact.role,
        callType: 'video'
      });

      if (res && res.success) {
        if (res.chatMessage) {
          setMessages(prev => [...prev, res.chatMessage]);
        }
        window.open(res.meetingUrl, '_blank');
        addToast('success', 'Video Meeting Ready', 'Instant video meeting generated and opened in a new tab.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to initiate call.';
      addToast('error', 'Call Failed', msg);
    }
  };

  // 5. In-Chat Formal Meeting Scheduler Modal (Connected to backend meetings)
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [meetingStartTime, setMeetingStartTime] = useState('16:00');
  const [meetingEndTime, setMeetingEndTime] = useState('16:30');
  const [meetingMode, setMeetingMode] = useState<'Online' | 'In-Person'>('Online');
  const [meetingRoomVenue, setMeetingRoomVenue] = useState('Room 102 - Academic Block');
  const [meetingAgenda, setMeetingAgenda] = useState('');

  const openScheduleMeetingModal = () => {
    if (!activeContact) return;
    const defaultTopic = safeRole === 'student' 
      ? (activeContact.role === 'teacher' ? `Academic Doubt Session with ${activeContact.name}` : `Peer Study Group with ${activeContact.name}`)
      : safeRole === 'parent'
      ? `Parent-Teacher Conference with ${activeContact.name}`
      : `Meeting with ${activeContact.name}`;
    setMeetingTitle(defaultTopic);
    setIsMeetingModalOpen(true);
  };

  const handleConfirmMeetingSchedule = async () => {
    if (!meetingTitle.trim() || !activeContact) {
      addToast('warning', 'Title Required', 'Please enter a title or topic for the meeting.');
      return;
    }

    const videoUrl = meetingMode === 'Online' 
      ? `https://meet.jit.si/SMS-Meet-${Date.now().toString(36)}`
      : undefined;

    try {
      // 1. Post to Backend Meetings API
      await scheduleMeetingApi({
        meetingAudience: 'Individual Meeting',
        participantType: activeContact.role === 'teacher' ? 'Teaching Staff' : activeContact.role === 'student' ? 'Student' : 'Parent',
        participantName: activeContact.name,
        participantPhone: activeContact.phone || '',
        wardStudentName: activeContact.role === 'student' ? activeContact.name : undefined,
        wardAdmissionNo: activeContact.admissionNo,
        wardClass: activeContact.className,
        meetingTitle: meetingTitle.trim(),
        agenda: meetingAgenda || `Scheduled via Direct Chat between ${currentUserName} and ${activeContact.name}`,
        meetingMode: meetingMode,
        meetingRoom: meetingMode === 'In-Person' ? meetingRoomVenue : undefined,
        onlineMeetingUrl: videoUrl,
        meetingDate: meetingDate,
        startTime: meetingStartTime,
        endTime: meetingEndTime,
        meetingStatus: 'SCHEDULED',
        organizerName: currentUserName,
        organizerRole: safeRole === 'student' ? 'Student' : safeRole === 'parent' ? 'Parent' : 'Teacher'
      });

      // 2. Dispatch Invitation Message in Direct Chat stream
      const msgText = videoUrl 
        ? `I have scheduled an online meeting with you: "${meetingTitle.trim()}" on ${meetingDate} from ${meetingStartTime} to ${meetingEndTime}.`
        : `I have scheduled an in-person meeting with you: "${meetingTitle.trim()}" on ${meetingDate} at ${meetingRoomVenue}.`;

      await sendChatMessageApi({
        receiverId: activeContact.id,
        receiverName: activeContact.name,
        receiverRole: activeContact.role,
        messageText: msgText
      });

      // Refresh messages
      loadMessages(activeContact.id, true);

      setIsMeetingModalOpen(false);
      addToast('success', 'Meeting Scheduled', `Meeting invitation saved to database and sent to ${activeContact.name}.`);
    } catch (err: any) {
      addToast('error', 'Failed to Schedule Meeting', err?.message || 'Could not save meeting.');
    }
  };

  // Add Emoji to Input
  const handleAddEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] flex flex-col lg:flex-row rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl animate-in fade-in">
      
      {/* ========================================================================= */}
      {/* LEFT SIDEBAR: CONTACTS & CHAT DIRECTORY */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 shrink-0">
        
        {/* Header & Role Badge */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Direct Messages</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {safeRole === 'student' ? (
                  currentUserProfile?.className 
                    ? `Classmates (${currentUserProfile.className}${currentUserProfile.section ? `-${currentUserProfile.section}` : ''}) & Teachers`
                    : 'Classmates & Teachers'
                ) : safeRole === 'parent' ? (
                  'Ward Teachers & Faculty'
                ) : (
                  'Students, Parents & Faculty'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => loadContacts()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Contacts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {onNavigateToMeetings && (
              <button
                onClick={onNavigateToMeetings}
                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[11px] font-bold border border-sky-500/20 flex items-center gap-1 transition-all cursor-pointer"
                title="Open Meetings View"
              >
                <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Meetings</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Policy Notice Badge */}
        {safeRole === 'student' && (
          <div className="px-4 py-2 bg-sky-50/80 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/50 flex items-center gap-2 text-[11px] text-sky-800 dark:text-sky-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
            <span>You can message peers in your enrolled class and any school teacher.</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-200/60 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          {/* Contact Category Filter Tabs */}
          <div className="flex items-center gap-1 mt-2.5 p-0.5 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setContactFilter('all')}
              className={`flex-1 py-1 rounded-lg transition-all ${
                contactFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setContactFilter('teachers')}
              className={`flex-1 py-1 rounded-lg transition-all ${
                contactFilter === 'teachers'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setContactFilter('students')}
              className={`flex-1 py-1 rounded-lg transition-all ${
                contactFilter === 'students'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {safeRole === 'student' ? 'Classmates' : 'Students'}
            </button>
            {safeRole !== 'student' && (
              <button
                onClick={() => setContactFilter('parents')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  contactFilter === 'parents'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Parents
              </button>
            )}
          </div>

          {/* Class Filter Bar (for Teachers, Staff & Admins) */}
          {safeRole !== 'student' && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="relative flex-1">
                <GraduationCap className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedClassFilter(val);
                    loadContacts(selectedContactId, val);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 appearance-none cursor-pointer transition-all hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
                >
                  <option value="all">🎓 All Classes</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>Class {cls.replace(/^Class\s*/i, '')}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {selectedClassFilter !== 'all' && (
                <button
                  onClick={() => {
                    setSelectedClassFilter('all');
                    loadContacts(selectedContactId, 'all');
                  }}
                  className="px-2 py-1 text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors shrink-0"
                  title="Reset to All Classes"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contacts Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
          {loadingContacts ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
              <span className="text-xs font-semibold">Loading live contacts from database...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1.5">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No contacts found</p>
              <p className="text-[11px] text-slate-400">
                {selectedClassFilter !== 'all' 
                  ? `No contacts found in ${selectedClassFilter}.` 
                  : (safeRole === 'student' ? 'No peers found matching your enrolled class.' : 'Try adjusting your search criteria.')}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = contact.id === selectedContactId;
              const isTeacherContact = contact.role === 'teacher';
              const isStudentContact = contact.role === 'student';

              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-800 shadow-xs'
                      : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shadow-xs ${
                        isTeacherContact 
                          ? 'bg-gradient-to-tr from-sky-500 to-indigo-600'
                          : isStudentContact
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-tr from-amber-500 to-orange-600'
                      }`}>
                        {contact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      {contact.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {contact.name}
                        </h4>
                        {contact.lastMessageTime && (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {contact.lastMessageTime}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          isTeacherContact
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80'
                            : isStudentContact
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80'
                        }`}>
                          {isTeacherContact ? 'Teacher' : isStudentContact ? 'Classmate' : 'Parent'}
                        </span>

                        {contact.subject && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[120px]">
                            {contact.subject}
                          </span>
                        )}
                        {contact.className && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                            {contact.className}{contact.section ? `-${contact.section}` : ''}
                          </span>
                        )}
                      </div>

                      {contact.lastMessage && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                          {contact.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {contact.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT MAIN CHAT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
        
        {activeContact ? (
          <>
            {/* Chat Top Banner */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-xs ${
                    activeContact.role === 'teacher'
                      ? 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                      : activeContact.role === 'student'
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-tr from-amber-500 to-orange-600'
                  }`}>
                    {activeContact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  {activeContact.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {activeContact.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      activeContact.role === 'teacher'
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                        : activeContact.role === 'student'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {activeContact.role === 'teacher' ? 'Faculty Teacher' : activeContact.role === 'student' ? 'Enrolled Classmate' : 'Parent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {activeContact.subject ? `Subject: ${activeContact.subject}` : ''}
                    {activeContact.className ? ` • Class: ${activeContact.className}${activeContact.section ? `-${activeContact.section}` : ''}` : ''}
                    {activeContact.admissionNo ? ` • Adm: ${activeContact.admissionNo}` : ''}
                  </p>
                </div>
              </div>

              {/* Quick Actions in Header */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={openScheduleMeetingModal}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Schedule a formal meeting with this person"
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="hidden sm:inline">Schedule Meeting</span>
                </button>

                <button
                  onClick={handleLaunchInstantVideoCall}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-95"
                  title="Start an instant live video call room"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Instant Meet</span>
                </button>
              </div>
            </div>

            {/* Messages Stream Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* Channel Header Banner */}
              <div className="flex items-center justify-center my-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50">
                  Official School Communication Channel • Secure Database Persistence
                </span>
              </div>

              {loadingMessages ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                  <span className="text-xs font-semibold">Loading conversation history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No messages yet with {activeContact.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {activeContact.role === 'teacher'
                      ? 'Ask your teacher a doubt or question regarding today\'s topics.'
                      : 'Send a message to your classmate for homework discussion or study sync.'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.isOutgoing || msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {!isMine && (
                          <div className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 mb-1">
                            {msg.senderName.charAt(0)}
                          </div>
                        )}

                        <div
                          className={`rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all relative ${
                            isMine
                              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-xs'
                          }`}
                        >
                          {!isMine && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400">
                                {msg.senderName}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                                {msg.senderRole}
                              </span>
                            </div>
                          )}

                          {/* Message Text */}
                          <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.text}
                          </p>

                          {/* Interactive Call Invitation Card */}
                          {msg.callMeetingUrl && (
                            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-sky-500/30 text-slate-900 dark:text-white shadow-sm space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <Video className="w-4 h-4 text-sky-500 shrink-0" />
                                  <span className="text-xs font-bold truncate">
                                    Instant Live Video Room
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Live Sync
                                </span>
                              </div>

                              <a
                                href={msg.callMeetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full mt-1 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join Video Call</span>
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            </div>
                          )}

                          {/* Attachment preview if any */}
                          {msg.attachmentUrl && (
                            <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{msg.attachmentName || 'Attachment'}</span>
                              </div>
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-sky-500 text-white text-[11px] font-bold hover:bg-sky-400"
                              >
                                Open
                              </a>
                            </div>
                          )}

                          {/* Timestamp & Delivery status */}
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMine ? 'text-sky-100' : 'text-slate-400'
                          }`}>
                            <span>{msg.timestamp}</span>
                            {isMine && <CheckCheck className="w-3 h-3 text-sky-200" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Message Input Compose Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
              
              {/* Emoji Quick Picker Overlay */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 z-20 p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl flex items-center gap-1.5 flex-wrap max-w-xs animate-in zoom-in-95">
                  {['👍', '❤️', '👏', '😊', '🙌', '💡', '🎉', '🔥', '📚', '❓', '✅'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleAddEmoji(emoji)}
                      className="p-1.5 text-lg hover:scale-125 transition-transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${activeContact.name}...`}
                  value={inputText}
                  disabled={isSending}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-200">Select a Contact to Start Messaging</h3>
            <p className="text-xs max-w-sm">
              {safeRole === 'student'
                ? 'Choose a teacher to resolve doubts or a classmate to collaborate on projects.'
                : 'Choose a student, parent, or teacher from the left sidebar to begin.'}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SCHEDULE MEETING MODAL */}
      {/* ========================================================================= */}
      {isMeetingModalOpen && activeContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Schedule Meeting</h3>
                  <p className="text-[11px] text-slate-500">With {activeContact.name} ({activeContact.role})</p>
                </div>
              </div>
              <button onClick={() => setIsMeetingModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Topic / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingMode('Online')}
                    className={`py-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      meetingMode === 'Online'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Online (Video)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingMode('In-Person')}
                    className={`py-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      meetingMode === 'In-Person'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>In-Person</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={meetingStartTime}
                    onChange={e => setMeetingStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {meetingMode === 'In-Person' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={meetingRoomVenue}
                    onChange={e => setMeetingRoomVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Agenda / Details</label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={e => setMeetingAgenda(e.target.value)}
                  placeholder="Key questions or topics to discuss..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsMeetingModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMeetingSchedule}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              >
                Schedule & Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
