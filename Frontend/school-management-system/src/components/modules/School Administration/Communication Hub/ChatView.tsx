// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Send, Search, Users, User, Video, Calendar, Paperclip, Smile, 
  CheckCheck, Clock, Plus, Phone, FileText, Image as ImageIcon, 
  Sparkles, MessageSquare, AlertCircle, X, ExternalLink, ThumbsUp, 
  Heart, Star, Check, BookOpen, GraduationCap, ArrowRight, ShieldCheck,
  ChevronDown, RefreshCw, Loader2, Trash2, CheckSquare, Square,
  Reply, Copy, Forward, Pin
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
  deleteConversationApi,
  deleteSpecificMessagesApi,
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
  const { academicClasses, students, staff } = useData();

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

  // Conversation & Message Deletion
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [contactToDelete, setContactToDelete] = useState<ChatContact | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState<boolean>(false);

  // Message Action Dropdown, Reply, Forward, Pin, Star & Reactions
  const [openMenuMessageId, setOpenMenuMessageId] = useState<number | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [forwardSearch, setForwardSearch] = useState<string>('');
  const [isForwarding, setIsForwarding] = useState<boolean>(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('sms_pinned_msg_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  const [starredMessageIds, setStarredMessageIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('sms_starred_msg_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  const [messageReactions, setMessageReactions] = useState<Record<number, string[]>>(() => {
    try {
      const raw = localStorage.getItem('sms_chat_reactions');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Filters
  const [contactFilter, setContactFilter] = useState<'all' | 'teaching' | 'non-teaching' | 'students' | 'parents'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [apiClasses, setApiClasses] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Extract all dynamic classes from API & context for filtering
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(apiClasses)) {
      apiClasses.forEach((c) => {
        if (typeof c === 'string' && c.trim()) set.add(c.trim());
      });
    }
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
  }, [apiClasses, academicClasses, contacts]);

  // Presence: Tracks active online users across tabs, windows, and sessions
  const [onlineUserMap, setOnlineUserMap] = useState<Map<string, number>>(new Map());
  const allLegacyOnlineRef = useRef<boolean>(false);

  // Helper to extract candidate keys for presence matching
  const getEntityKeys = useCallback((entity: any): string[] => {
    if (!entity) return [];
    const keys = new Set<string>();
    const add = (val?: string | number | null) => {
      if (val !== undefined && val !== null && String(val).trim()) {
        const s = String(val).trim().toLowerCase();
        keys.add(s);
        if (s.startsWith('stu-')) keys.add(s.replace(/^stu-/, ''));
        if (s.startsWith('tea-')) keys.add(s.replace(/^tea-/, ''));
        if (s.startsWith('adm-')) keys.add(s.replace(/^adm-/, ''));
        if (s.startsWith('par-')) keys.add(s.replace(/^par-/, ''));
      }
    };
    add(entity.id);
    add(entity.studentId);
    add(entity.employeeId);
    add(entity.empId);
    add(entity.admissionNo);
    add(entity.rollNo);
    add(entity.email);
    add(entity.phone);
    return Array.from(keys);
  }, []);

  // Evaluates whether a contact is genuinely online
  const isContactOnline = useCallback((contact: ChatContact | null | undefined, onlineMap: Map<string, number>, isLegacyAllOnline: boolean): boolean => {
    if (!contact) return false;
    const now = Date.now();
    const keys = getEntityKeys(contact);

    // 1. Live presence heartbeats (multi-tab / cross-window BroadcastChannel + localStorage)
    for (const k of keys) {
      const lastSeen = onlineMap.get(k);
      if (lastSeen && now - lastSeen < 25000) {
        return true;
      }
    }

    // 2. Recent live messages in current active conversation (sent by contact within last 2 minutes)
    const hasRecentIncoming = messages.some(m => 
      !m.isOutgoing && 
      (m.senderId === contact.id || keys.includes(String(m.senderId).toLowerCase())) &&
      m.createdAt && 
      (now - new Date(m.createdAt).getTime() < 120000)
    );
    if (hasRecentIncoming) return true;

    // 3. If backend returned discriminatory presence (NOT every contact marked true), respect backend's value
    if (!isLegacyAllOnline && Boolean(contact.isOnline)) {
      return true;
    }

    return false;
  }, [getEntityKeys, messages]);

  // Heartbeat & presence broadcaster across browser tabs and windows
  useEffect(() => {
    const myKeys = new Set<string>();
    const addKey = (v?: string | number | null) => {
      if (v !== undefined && v !== null && String(v).trim()) {
        const s = String(v).trim().toLowerCase();
        myKeys.add(s);
        if (s.startsWith('stu-')) myKeys.add(s.replace(/^stu-/, ''));
        if (s.startsWith('tea-')) myKeys.add(s.replace(/^tea-/, ''));
        if (s.startsWith('adm-')) myKeys.add(s.replace(/^adm-/, ''));
        if (s.startsWith('par-')) myKeys.add(s.replace(/^par-/, ''));
      }
    };

    addKey(currentUserProfile?.id);
    addKey(user?.id);
    addKey(user?.email);
    addKey((user as any)?.staffId);
    addKey((user as any)?.studentId);
    addKey((user as any)?.employeeId);
    addKey(localStorage.getItem('auth_user_id'));

    const myKeysList = Array.from(myKeys);
    if (myKeysList.length === 0) return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sms_chat_presence');
    } catch {}

    const broadcastHeartbeat = () => {
      const now = Date.now();
      try {
        const raw = localStorage.getItem('sms_chat_presence_users');
        const stored: Record<string, number> = raw ? JSON.parse(raw) : {};
        const updated: Record<string, number> = {};
        for (const [k, ts] of Object.entries(stored)) {
          if (typeof ts === 'number' && now - ts < 30000) {
            updated[k] = ts;
          }
        }
        for (const k of myKeysList) {
          updated[k] = now;
        }
        localStorage.setItem('sms_chat_presence_users', JSON.stringify(updated));
        setOnlineUserMap(new Map(Object.entries(updated)));
      } catch {}

      try {
        channel?.postMessage({ type: 'heartbeat', keys: myKeysList, timestamp: now });
      } catch {}
    };

    if (channel) {
      channel.onmessage = (event) => {
        if (!event?.data) return;
        const { type, keys: peerKeys, timestamp } = event.data;
        if (type === 'heartbeat' && Array.isArray(peerKeys)) {
          setOnlineUserMap(prev => {
            const next = new Map(prev);
            for (const pk of peerKeys) {
              next.set(pk, timestamp || Date.now());
            }
            return next;
          });
        } else if (type === 'offline' && Array.isArray(peerKeys)) {
          setOnlineUserMap(prev => {
            const next = new Map(prev);
            for (const pk of peerKeys) {
              next.delete(pk);
            }
            return next;
          });
        }
      };
    }

    // Initial read
    try {
      const raw = localStorage.getItem('sms_chat_presence_users');
      const stored: Record<string, number> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      const initialMap = new Map<string, number>();
      for (const [k, ts] of Object.entries(stored)) {
        if (typeof ts === 'number' && now - ts < 30000) {
          initialMap.set(k, ts);
        }
      }
      for (const k of myKeysList) {
        initialMap.set(k, now);
      }
      setOnlineUserMap(initialMap);
    } catch {}

    broadcastHeartbeat();
    const interval = setInterval(broadcastHeartbeat, 4000);

    const handleBeforeUnload = () => {
      try {
        channel?.postMessage({ type: 'offline', keys: myKeysList });
        const raw = localStorage.getItem('sms_chat_presence_users');
        const stored = raw ? JSON.parse(raw) : {};
        for (const k of myKeysList) {
          delete stored[k];
        }
        localStorage.setItem('sms_chat_presence_users', JSON.stringify(stored));
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        channel?.postMessage({ type: 'offline', keys: myKeysList });
        channel?.close();
      } catch {}
    };
  }, [currentUserProfile?.id, user?.id, user?.email]);

  // 1. Fetch Contacts from Backend API
  const loadContacts = async (preserveSelectedId?: string, classFilterParam?: string, isSilent = false) => {
    try {
      if (!isSilent) setLoadingContacts(true);
      const activeClass = classFilterParam !== undefined ? classFilterParam : selectedClassFilter;
      const res = await fetchChatContactsApi(activeClass);
      if (res && res.success && Array.isArray(res.data)) {
        // Detect if remote backend returned dummy "isOnline: true" on every single contact
        const isLegacyAllOnline = res.data.length > 1 && res.data.every(c => Boolean(c.isOnline));
        allLegacyOnlineRef.current = isLegacyAllOnline;

        const processed = res.data.map(c => ({
          ...c,
          isOnline: isContactOnline(c, onlineUserMap, isLegacyAllOnline)
        }));

        setContacts(processed);
        if (Array.isArray(res.classes) && res.classes.length > 0) {
          setApiClasses(res.classes);
        }
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
      if (!isSilent) setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts(preselectedContactId);
  }, [preselectedContactId]);

  // 2. Resolve Active Contact & Live Presence Status
  const activeContact = useMemo(() => {
    return contacts.find(c => c.id === selectedContactId) || contacts[0] || null;
  }, [contacts, selectedContactId]);

  const isActiveContactOnline = useMemo(() => {
    if (!activeContact) return false;
    return isContactOnline(activeContact, onlineUserMap, allLegacyOnlineRef.current);
  }, [activeContact, onlineUserMap, isContactOnline]);

  // 3. Fetch Messages for Active Contact from Backend API
  const loadMessages = async (contactId: string, isSilent = false) => {
    if (!contactId) return;
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await fetchChatMessagesApi(contactId);
      if (res && res.success && Array.isArray(res.data)) {
        let validMessages = res.data;
        try {
          const rawDel = localStorage.getItem('sms_deleted_conversations');
          const deletedMap = rawDel ? JSON.parse(rawDel) : {};
          const deleteTime = deletedMap[`${currentUserId}_${contactId}`];
          if (deleteTime && typeof deleteTime === 'number') {
            validMessages = res.data.filter(m => m.createdAt && new Date(m.createdAt).getTime() > deleteTime);
          }
        } catch {}

        try {
          const rawDelIds = localStorage.getItem('sms_deleted_msg_ids');
          if (rawDelIds) {
            const list = JSON.parse(rawDelIds);
            const delSet = new Set(Array.isArray(list) ? list : []);
            if (delSet.size > 0) {
              validMessages = validMessages.filter(m => !delSet.has(m.id));
            }
          }
        } catch {}

        setMessages(validMessages);
        const contactOnlineStatus = typeof res.isContactOnline === 'boolean'
          ? res.isContactOnline
          : undefined;

        // Check if there was recent incoming message from contact (< 2 minutes)
        const now = Date.now();
        const hasRecentIncoming = res.data.some(m => 
          !m.isOutgoing && 
          m.createdAt && 
          (now - new Date(m.createdAt).getTime() < 120000)
        );

        if (hasRecentIncoming) {
          const keys = getEntityKeys(contacts.find(c => c.id === contactId) || { id: contactId });
          setOnlineUserMap(prev => {
            const next = new Map(prev);
            for (const k of keys) next.set(k, now);
            return next;
          });
        }

        // Clear unread badge on active contact and sync live online presence
        setContacts(prev => prev.map(c => {
          if (c.id === contactId) {
            return {
              ...c,
              unreadCount: 0,
              isOnline: hasRecentIncoming || (contactOnlineStatus !== undefined ? contactOnlineStatus : isContactOnline(c, onlineUserMap, allLegacyOnlineRef.current))
            };
          }
          return c;
        }));
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

  // 5. Periodic silent refresh of contacts every 15 seconds to keep presence/online status fresh across all contacts
  useEffect(() => {
    const presenceInterval = setInterval(() => {
      loadContacts(selectedContactId, undefined, true);
    }, 15000);
    return () => clearInterval(presenceInterval);
  }, [selectedContactId, selectedClassFilter]);

  // Auto-scroll chat to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedContactId]);

  // Helper to extract official Student ID number (e.g. STU-2026-0120) instead of admission number (ADM-2026-0120)
  const getDisplayStudentId = (contact: ChatContact): string => {
    // 1. Dedicated studentId starting with STU-
    if (contact.studentId && contact.studentId.trim() && !contact.studentId.toUpperCase().startsWith('ADM-')) {
      const clean = contact.studentId.trim();
      return clean.toUpperCase().startsWith('STU-') ? clean : `STU-${clean}`;
    }

    // 2. Check rollNo if formatted as STU-
    if (contact.rollNo && contact.rollNo.trim()) {
      const cleanRoll = contact.rollNo.trim();
      if (cleanRoll.toUpperCase().startsWith('STU-')) {
        return cleanRoll;
      }
    }

    // 3. Find in DataContext students
    if (Array.isArray(students) && students.length > 0) {
      const matched = students.find((s: any) =>
        (contact.admissionNo && (s.admissionNo === contact.admissionNo || s.admissionNumber === contact.admissionNo)) ||
        (contact.id && (String(s.id) === contact.id || `STU-${s.id}` === contact.id || String((s as any).studentId) === contact.id || `STU-${(s as any).studentId}` === contact.id)) ||
        (`${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === contact.name.trim().toLowerCase())
      );
      if (matched) {
        const candidates = [
          matched.rollNo,
          (matched as any).rollNumber,
          matched.studentId,
          (matched as any).student_id,
        ];
        for (const c of candidates) {
          if (typeof c === 'string' && c.toUpperCase().startsWith('STU-')) {
            return c.trim();
          }
        }
      }
    }

    // 4. Derive official Student ID from admission number (e.g. ADM-2026-0120 -> STU-2026-0120)
    if (contact.admissionNo && /^ADM-/i.test(contact.admissionNo.trim())) {
      return contact.admissionNo.trim().replace(/^ADM-/i, 'STU-');
    }

    // 5. Fallback to contact.id if it starts with STU-
    if (contact.id && contact.id.startsWith('STU-')) {
      return contact.id;
    }

    if (contact.rollNo && contact.rollNo.trim()) {
      return `STU-${contact.rollNo.trim()}`;
    }

    return contact.id ? (contact.id.startsWith('STU-') ? contact.id : `STU-${contact.id}`) : '';
  };

  // Helper to extract official Staff ID number (e.g. TCH-2026-001 or NTS-2026-001) for teaching & non-teaching staff
  const getDisplayStaffId = (contact: ChatContact): string => {
    // 1. Direct employeeId / empId from contact payload
    if (contact.employeeId && contact.employeeId.trim()) {
      return contact.employeeId.trim();
    }
    if ((contact as any).empId && String((contact as any).empId).trim()) {
      return String((contact as any).empId).trim();
    }

    // 2. Look up in DataContext staff
    if (Array.isArray(staff) && staff.length > 0) {
      const contactNumId = contact.id.replace(/\D/g, '');
      const matched = staff.find((s: any) =>
        (contact.id && (String(s.id) === contact.id || `TEA-${s.id}` === contact.id || String(s.staffId) === contact.id || (contactNumId && String(s.id) === contactNumId))) ||
        (contact.email && s.email && s.email.toLowerCase() === contact.email.toLowerCase()) ||
        (`${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === contact.name.trim().toLowerCase())
      );
      if (matched) {
        const idVal = matched.empId || (matched as any).employeeId || (matched as any).employee_id;
        if (idVal && String(idVal).trim()) return String(idVal).trim();
      }
    }

    // 3. Fallback based on staff category and ID
    if (contact.id && contact.id.startsWith('TEA-')) {
      const num = contact.id.replace('TEA-', '');
      const isNonTeaching = contact.staffCategory?.toLowerCase().includes('non-teaching');
      return isNonTeaching ? `NTS-${num}` : `TCH-${num}`;
    }

    return contact.id || '';
  };

  // Filtered Contacts List with Category & Class Filters
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Teaching Staff filter
      if (contactFilter === 'teaching') {
        if (c.role !== 'teacher') return false;
        const isNonTeaching = c.staffCategory && c.staffCategory.toLowerCase().includes('non-teaching');
        if (isNonTeaching) return false;
      }
      // Non-Teaching Staff filter
      if (contactFilter === 'non-teaching') {
        if (c.role !== 'teacher') return false;
        const isNonTeaching = c.staffCategory && c.staffCategory.toLowerCase().includes('non-teaching');
        if (!isNonTeaching) return false;
      }
      if (contactFilter === 'students' && c.role !== 'student') return false;
      if (contactFilter === 'parents' && c.role !== 'parent') return false;

      // Filter by class (for students and parents)
      if (selectedClassFilter !== 'all') {
        if (c.role === 'student' || c.role === 'parent') {
          if (!c.className || !c.className.toLowerCase().includes(selectedClassFilter.toLowerCase())) {
            return false;
          }
        } else if (c.role === 'teacher' && contactFilter !== 'teaching' && contactFilter !== 'non-teaching') {
          // Under 'All', when a specific class is chosen, focus on that class's students & parents
          return false;
        }
      }

      if (contactSearch.trim()) {
        const q = contactSearch.toLowerCase();
        const stuId = getDisplayStudentId(c).toLowerCase();
        const staffId = getDisplayStaffId(c).toLowerCase();
        return (
          c.name.toLowerCase().includes(q) || 
          (c.subject && c.subject.toLowerCase().includes(q)) ||
          (c.className && c.className.toLowerCase().includes(q)) ||
          (c.designation && c.designation.toLowerCase().includes(q)) ||
          (c.staffCategory && c.staffCategory.toLowerCase().includes(q)) ||
          (c.department && c.department.toLowerCase().includes(q)) ||
          (c.admissionNo && c.admissionNo.toLowerCase().includes(q)) ||
          (c.studentId && c.studentId.toLowerCase().includes(q)) ||
          (c.employeeId && c.employeeId.toLowerCase().includes(q)) ||
          (c.rollNo && c.rollNo.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q)) ||
          stuId.includes(q) ||
          staffId.includes(q)
        );
      }
      return true;
    });
  }, [contacts, contactFilter, contactSearch, selectedClassFilter]);

  // Send Direct Message via Backend API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeContact || isSending) return;

    const replyHeader = replyingToMessage
      ? `⟦Reply to ${replyingToMessage.senderName}: "${parseReplyContent(replyingToMessage.text).body.slice(0, 50).replace(/\n/g, ' ')}"⟧\n`
      : '';
    const textToSend = `${replyHeader}${inputText.trim()}`;
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
        setReplyingToMessage(null);

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

  // Launch Instant Live Voice Call via Backend API (Audio Room)
  const handleLaunchInstantVoiceCall = async () => {
    if (!activeContact) return;

    try {
      const res = await initiateDirectCallApi({
        receiverId: activeContact.id,
        receiverName: activeContact.name,
        receiverRole: activeContact.role,
        callType: 'audio'
      });

      if (res && res.success) {
        if (res.chatMessage) {
          setMessages(prev => [...prev, res.chatMessage]);
        }
        const audioUrl = res.meetingUrl.includes('#')
          ? `${res.meetingUrl}&config.startAudioOnly=true&config.startWithVideoMuted=true`
          : `${res.meetingUrl}#config.startAudioOnly=true&config.startWithVideoMuted=true`;
        window.open(audioUrl, '_blank');
        addToast('success', 'Voice Call Ready', 'Instant voice call room generated and opened in a new tab.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to initiate voice call.';
      addToast('error', 'Call Failed', msg);
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

  // Delete Conversation (Clear all messages with contact)
  const handleDeleteConversation = async () => {
    const target = contactToDelete || activeContact;
    if (!target?.id) return;
    setIsDeletingConversation(true);
    try {
      // 1. Call Backend API
      try {
        await deleteConversationApi(target.id);
      } catch (apiErr) {
        console.warn("Backend conversation delete endpoint notice:", apiErr);
      }

      // 2. Persist deleted timestamp to localStorage for immediate cross-session clearance
      try {
        const raw = localStorage.getItem('sms_deleted_conversations');
        const deletedMap = raw ? JSON.parse(raw) : {};
        deletedMap[`${currentUserId}_${target.id}`] = Date.now();
        localStorage.setItem('sms_deleted_conversations', JSON.stringify(deletedMap));
      } catch {}

      // 3. Clear messages if target is currently active contact
      if (activeContact?.id === target.id) {
        setMessages([]);
      }

      // 4. Update contacts state: clear lastMessage & lastMessageTime & unreadCount
      setContacts(prev => prev.map(c => {
        if (c.id === target.id) {
          return {
            ...c,
            lastMessage: undefined,
            lastMessageTime: undefined,
            unreadCount: 0
          };
        }
        return c;
      }));

      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
      addToast('success', 'Conversation Deleted', `All messages with ${target.name} have been cleared.`);
    } catch (err: any) {
      addToast('error', 'Delete Failed', 'Could not delete conversation.');
    } finally {
      setIsDeletingConversation(false);
    }
  };

  // Helper to record deleted message IDs in localStorage
  const recordDeletedMessageIds = (ids: number[]) => {
    try {
      const raw = localStorage.getItem('sms_deleted_msg_ids');
      const list = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(list) ? list : []);
      ids.forEach(id => set.add(id));
      localStorage.setItem('sms_deleted_msg_ids', JSON.stringify(Array.from(set)));
    } catch {}
  };

  // Helper to parse quoted reply content if formatted in message
  const parseReplyContent = (rawText: string) => {
    if (!rawText) return { isReply: false, replyTo: '', replySnippet: '', body: '' };
    const match = rawText.match(/^⟦Reply to (.*?): "(.*?)"⟧\n([\s\S]*)$/);
    if (match) {
      return {
        isReply: true,
        replyTo: match[1],
        replySnippet: match[2],
        body: match[3]
      };
    }
    return { isReply: false, replyTo: '', replySnippet: '', body: rawText };
  };

  // Pinned messages for active contact
  const pinnedMessages = useMemo(() => {
    return messages.filter(m => pinnedMessageIds.has(m.id));
  }, [messages, pinnedMessageIds]);

  // Reset selection mode, menu & reply state if contact changes
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
    setOpenMenuMessageId(null);
    setReplyingToMessage(null);
  }, [selectedContactId]);

  // 1. Reply
  const handleInitiateReply = (msg: ChatMessage) => {
    setReplyingToMessage(msg);
    setOpenMenuMessageId(null);
  };

  // 2. Copy
  const handleCopyMessage = (msg: ChatMessage) => {
    const { body } = parseReplyContent(msg.text);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(body);
      addToast('success', 'Copied to Clipboard', 'Message text copied.');
    }
    setOpenMenuMessageId(null);
  };

  // 3. Pin Toggle
  const handleTogglePin = (msgId: number) => {
    setPinnedMessageIds(prev => {
      const next = new Set(prev);
      const isNowPinned = !next.has(msgId);
      if (isNowPinned) {
        next.add(msgId);
        addToast('success', 'Message Pinned', 'Message pinned to top of conversation.');
      } else {
        next.delete(msgId);
        addToast('info', 'Message Unpinned', 'Message unpinned.');
      }
      try {
        localStorage.setItem('sms_pinned_msg_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setOpenMenuMessageId(null);
  };

  // 4. Star Toggle
  const handleToggleStar = (msgId: number) => {
    setStarredMessageIds(prev => {
      const next = new Set(prev);
      const isNowStarred = !next.has(msgId);
      if (isNowStarred) {
        next.add(msgId);
        addToast('success', 'Message Starred', 'Added to starred messages.');
      } else {
        next.delete(msgId);
        addToast('info', 'Message Unstarred', 'Removed from starred messages.');
      }
      try {
        localStorage.setItem('sms_starred_msg_ids', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setOpenMenuMessageId(null);
  };

  // 5. Select from Menu
  const handleSelectMessageFromMenu = (msgId: number) => {
    setIsSelectionMode(true);
    setSelectedMessageIds(new Set([msgId]));
    setOpenMenuMessageId(null);
  };

  // 6. Toggle Reaction
  const handleToggleReaction = (msgId: number, emoji: string) => {
    setMessageReactions(prev => {
      const existing = prev[msgId] || [];
      const next = existing.includes(emoji)
        ? existing.filter(e => e !== emoji)
        : [...existing, emoji];
      const updated = { ...prev, [msgId]: next };
      try {
        localStorage.setItem('sms_chat_reactions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setOpenMenuMessageId(null);
  };

  // 7. Execute Forward Message to Selected Contact
  const handleExecuteForward = async (targetContact: ChatContact) => {
    if (!forwardingMessage) return;
    setIsForwarding(true);
    try {
      const { body } = parseReplyContent(forwardingMessage.text);
      const forwardPayload = `[Forwarded]:\n${body}`;
      await sendChatMessageApi({
        receiverId: targetContact.id,
        receiverName: targetContact.name,
        receiverRole: targetContact.role,
        messageText: forwardPayload
      });
      addToast('success', 'Message Forwarded', `Message forwarded to ${targetContact.name}.`);
      setForwardingMessage(null);
      setForwardSearch('');
      if (targetContact.id === activeContact?.id) {
        loadMessages(targetContact.id, true);
      }
    } catch (err: any) {
      addToast('error', 'Forward Failed', 'Could not forward message.');
    } finally {
      setIsForwarding(false);
    }
  };

  // Toggle selection for a single message
  const toggleSelectMessage = (msgId: number) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  // Toggle Select All / Deselect All messages
  const toggleSelectAllMessages = () => {
    if (selectedMessageIds.size === messages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(messages.map(m => m.id)));
    }
  };

  // Delete Selected Messages
  const handleDeleteSelectedMessages = async () => {
    if (selectedMessageIds.size === 0) return;
    const idsToDelete = Array.from(selectedMessageIds);
    setIsDeletingSelected(true);
    try {
      try {
        await deleteSpecificMessagesApi(idsToDelete);
      } catch (apiErr) {
        console.warn("Backend messages delete endpoint notice:", apiErr);
      }

      recordDeletedMessageIds(idsToDelete);
      const remaining = messages.filter(m => !selectedMessageIds.has(m.id));
      setMessages(remaining);

      if (activeContact) {
        const lastRemaining = remaining[remaining.length - 1];
        setContacts(prev => prev.map(c => 
          c.id === activeContact.id
            ? { 
                ...c, 
                lastMessage: lastRemaining ? lastRemaining.text : undefined,
                lastMessageTime: lastRemaining ? lastRemaining.timestamp : undefined
              }
            : c
        ));
      }

      addToast('success', 'Messages Deleted', `${idsToDelete.length} ${idsToDelete.length === 1 ? 'message' : 'messages'} removed successfully.`);
      setSelectedMessageIds(new Set());
      setIsSelectionMode(false);
    } catch (err: any) {
      addToast('error', 'Delete Failed', 'Failed to delete selected messages.');
    } finally {
      setIsDeletingSelected(false);
    }
  };

  // Delete a single message directly
  const handleDeleteSingleMessage = async (msgId: number) => {
    try {
      try {
        await deleteSpecificMessagesApi([msgId]);
      } catch (apiErr) {
        console.warn("Backend single message delete notice:", apiErr);
      }

      recordDeletedMessageIds([msgId]);
      const remaining = messages.filter(m => m.id !== msgId);
      setMessages(remaining);

      if (activeContact) {
        const lastRemaining = remaining[remaining.length - 1];
        setContacts(prev => prev.map(c => 
          c.id === activeContact.id
            ? { 
                ...c, 
                lastMessage: lastRemaining ? lastRemaining.text : undefined,
                lastMessageTime: lastRemaining ? lastRemaining.timestamp : undefined
              }
            : c
        ));
      }

      addToast('success', 'Message Deleted', 'Message removed from conversation.');
    } catch {
      addToast('error', 'Delete Failed', 'Failed to delete message.');
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

          {/* Filters Bar: Role/Category Dropdown & Class Dropdown */}
          <div className="mt-2.5 flex items-center gap-2">
            {/* Category / Role Filter Dropdown */}
            <div className="relative flex-1 min-w-0">
              <Users className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={contactFilter}
                onChange={(e) => {
                  const newFilter = e.target.value as any;
                  setContactFilter(newFilter);
                  if (newFilter !== 'students' && newFilter !== 'parents' && selectedClassFilter !== 'all') {
                    setSelectedClassFilter('all');
                    loadContacts(selectedContactId, 'all');
                  }
                }}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 appearance-none cursor-pointer transition-all hover:bg-slate-200/70 dark:hover:bg-slate-700/70 truncate"
              >
                <option value="all">All</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
                <option value="students">{safeRole === 'student' ? 'Classmates' : 'Students'}</option>
                {safeRole !== 'student' && <option value="parents">Parents</option>}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Dynamic Class Filter Bar: Available ONLY when Student or Parent is selected in dropdown */}
            {safeRole !== 'student' && (contactFilter === 'students' || contactFilter === 'parents') && (
              <div className="relative flex-1 min-w-0">
                <GraduationCap className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedClassFilter(val);
                    loadContacts(selectedContactId, val);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 appearance-none cursor-pointer transition-all hover:bg-slate-200/70 dark:hover:bg-slate-700/70 truncate"
                >
                  <option value="all">All Classes</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Clear Button if any filter is active */}
            {(contactFilter !== 'all' || (safeRole !== 'student' && (contactFilter === 'students' || contactFilter === 'parents') && selectedClassFilter !== 'all')) && (
              <button
                onClick={() => {
                  setContactFilter('all');
                  if (safeRole !== 'student') {
                    setSelectedClassFilter('all');
                    loadContacts(selectedContactId, 'all');
                  }
                }}
                className="px-2 py-1.5 text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors shrink-0 border border-sky-200/60 dark:border-sky-800/60"
                title="Reset Filters"
              >
                Clear
              </button>
            )}
          </div>
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
              const isNonTeachingContact = isTeacherContact && (contact.staffCategory?.toLowerCase().includes('non-teaching') || false);

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
                        isNonTeachingContact
                          ? 'bg-gradient-to-tr from-purple-500 to-pink-600'
                          : isTeacherContact 
                          ? 'bg-gradient-to-tr from-sky-500 to-indigo-600'
                          : isStudentContact
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-tr from-amber-500 to-orange-600'
                      }`}>
                        {contact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      {Boolean(isContactOnline(contact, onlineUserMap, allLegacyOnlineRef.current)) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online" />
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

                      {/* Student ID displayed below student name in small font */}
                      {isStudentContact && (
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 -mt-0.5 mb-1 flex items-center gap-1 truncate">
                          <span className="font-semibold text-slate-400 dark:text-slate-500">ID:</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">
                            {getDisplayStudentId(contact) || contact.id}
                          </span>
                        </div>
                      )}

                      {/* Staff ID displayed below teaching/non-teaching staff name in small font */}
                      {isTeacherContact && (
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 -mt-0.5 mb-1 flex items-center gap-1 truncate">
                          <span className="font-semibold text-slate-400 dark:text-slate-500">ID:</span>
                          <span className={`font-bold ${isNonTeachingContact ? 'text-purple-600 dark:text-purple-400' : 'text-sky-600 dark:text-sky-400'}`}>
                            {getDisplayStaffId(contact) || contact.id}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          isNonTeachingContact
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80'
                            : isTeacherContact
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80'
                            : isStudentContact
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80'
                        }`}>
                          {isNonTeachingContact ? 'Non-Teaching' : isTeacherContact ? 'Teaching' : isStudentContact ? 'Classmate' : 'Parent'}
                        </span>

                        {(contact.designation || contact.subject || contact.department) && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[130px]">
                            {contact.designation || contact.subject || contact.department}
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

                  <div className="flex items-center gap-1 shrink-0">
                    {contact.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                        {contact.unreadCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContactToDelete(contact);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title={`Delete conversation with ${contact.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                    activeContact.role === 'teacher' && activeContact.staffCategory?.toLowerCase().includes('non-teaching')
                      ? 'bg-gradient-to-tr from-purple-500 to-pink-600'
                      : activeContact.role === 'teacher'
                      ? 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                      : activeContact.role === 'student'
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-tr from-amber-500 to-orange-600'
                  }`}>
                    {activeContact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  {Boolean(isActiveContactOnline) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {activeContact.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      activeContact.role === 'teacher' && activeContact.staffCategory?.toLowerCase().includes('non-teaching')
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        : activeContact.role === 'teacher'
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                        : activeContact.role === 'student'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {activeContact.role === 'teacher' && activeContact.staffCategory?.toLowerCase().includes('non-teaching')
                        ? 'Non-Teaching Staff'
                        : activeContact.role === 'teacher'
                        ? 'Teaching Staff'
                        : activeContact.role === 'student'
                        ? 'Enrolled Classmate'
                        : 'Parent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {(() => {
                      const details: string[] = [];
                      if (activeContact.designation) {
                        details.push(`Designation: ${activeContact.designation}`);
                      } else if (activeContact.subject) {
                        details.push(`Subject: ${activeContact.subject}`);
                      }
                      if (activeContact.department) {
                        details.push(`Dept: ${activeContact.department}`);
                      }
                      if (activeContact.className) {
                        const rawClass = activeContact.className.trim();
                        const cleanClass = rawClass.toLowerCase().startsWith('class')
                          ? rawClass
                          : `Class ${rawClass}`;
                        const sec = activeContact.section ? `-${activeContact.section}` : '';
                        details.push(`${cleanClass}${sec}`);
                      }
                      if (activeContact.role === 'student') {
                        details.push(`Student ID: ${getDisplayStudentId(activeContact) || activeContact.id}`);
                      } else if (activeContact.role === 'teacher') {
                        details.push(`Staff ID: ${getDisplayStaffId(activeContact) || activeContact.id}`);
                      } else if (activeContact.admissionNo) {
                        details.push(`Adm: ${activeContact.admissionNo}`);
                      }
                      return details.join(' • ');
                    })()}
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
                  onClick={handleLaunchInstantVoiceCall}
                  className="w-8 h-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Start instant voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLaunchInstantVideoCall}
                  className="w-8 h-8 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Start instant video call"
                >
                  <Video className="w-4 h-4" />
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

              {/* Pinned Messages Banner */}
              {pinnedMessages.length > 0 && (
                <div className="sticky top-0 z-15 px-3.5 py-2 bg-amber-50/95 dark:bg-amber-950/80 border border-amber-200/90 dark:border-amber-900/60 rounded-2xl shadow-xs flex items-center justify-between gap-2.5 mb-2 backdrop-blur-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500 shrink-0" />
                    <div className="text-xs text-amber-800 dark:text-amber-200 truncate">
                      <span className="font-extrabold mr-1">Pinned:</span>
                      {parseReplyContent(pinnedMessages[0].text).body}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePin(pinnedMessages[0].id)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline shrink-0 cursor-pointer"
                  >
                    Unpin
                  </button>
                </div>
              )}

              {/* Sticky Selection Action Bar */}
              {isSelectionMode && (
                <div className="sticky top-0 z-20 px-3.5 py-2.5 bg-rose-50/95 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 backdrop-blur-xs mb-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={toggleSelectAllMessages}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
                    >
                      {selectedMessageIds.size === messages.length && messages.length > 0 ? (
                        <>
                          <CheckSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          <span>Select All ({messages.length})</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs text-rose-600/80 dark:text-rose-400 font-semibold border-l border-rose-200 dark:border-rose-800 pl-2.5">
                      <strong className="font-extrabold text-rose-700 dark:text-rose-300">{selectedMessageIds.size}</strong> selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedMessageIds(new Set());
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-rose-100/70 dark:hover:bg-rose-900/50 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={selectedMessageIds.size === 0 || isDeletingSelected}
                      onClick={handleDeleteSelectedMessages}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isDeletingSelected ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedMessageIds.size})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

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
                  const isSelected = selectedMessageIds.has(msg.id);
                  const isStarred = starredMessageIds.has(msg.id);
                  const isPinned = pinnedMessageIds.has(msg.id);
                  const reactions = messageReactions[msg.id] || [];
                  const { isReply, replyTo, replySnippet, body } = parseReplyContent(msg.text);
                  const isMenuOpen = openMenuMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelectMessage(msg.id);
                        }
                      }}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative ${
                        isSelectionMode ? 'cursor-pointer select-none' : ''
                      }`}
                    >
                      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Checkbox for selection mode */}
                        {isSelectionMode && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectMessage(msg.id);
                            }}
                            className="self-center p-1 rounded-lg hover:bg-rose-100/50 dark:hover:bg-rose-900/40 cursor-pointer shrink-0 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-rose-500" />
                            )}
                          </div>
                        )}

                        {!isMine && (
                          <div className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 mb-1">
                            {msg.senderName.charAt(0)}
                          </div>
                        )}

                        <div
                          className={`rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all relative pr-8 ${
                            isSelected
                              ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 '
                              : ''
                          }${
                            isMine
                              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-xs'
                          }`}
                        >
                          {/* Dropdown Chevron Trigger on Bubble (like WhatsApp) */}
                          {!isSelectionMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuMessageId(isMenuOpen ? null : msg.id);
                              }}
                              className={`absolute top-2 right-2 p-1 rounded-lg transition-all cursor-pointer z-10 ${
                                isMenuOpen
                                  ? 'opacity-100 bg-black/20 dark:bg-white/20'
                                  : 'opacity-0 group-hover:opacity-100 hover:bg-black/15 dark:hover:bg-white/15'
                              } ${isMine ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}
                              title="Message options"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Message Actions Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuMessageId(null);
                                }}
                              />
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute z-40 mt-1 min-w-[210px] p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
                                  isMine ? 'right-0 top-full' : 'left-0 top-full'
                                }`}
                              >
                                {/* Quick Reaction Bar at top (just like WhatsApp) */}
                                <div className="flex items-center justify-between px-2 py-1.5 mb-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60">
                                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className="p-1 hover:scale-130 transition-transform rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-base"
                                      title={`React ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>

                                <div className="space-y-0.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {/* 1. Reply */}
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateReply(msg)}
                                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                                  >
                                    <Reply className="w-4 h-4 text-sky-500" />
                                    <span>Reply</span>
                                  </button>

                                  {/* 2. Copy */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMessage(msg)}
                                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span>Copy</span>
                                  </button>

                                  {/* 3. Forward */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setForwardingMessage(msg);
                                      setOpenMenuMessageId(null);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                                  >
                                    <Forward className="w-4 h-4 text-emerald-500" />
                                    <span>Forward</span>
                                  </button>

                                  {/* 4. Pin */}
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePin(msg.id)}
                                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                                  >
                                    <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-amber-500'}`} />
                                    <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                                  </button>

                                  {/* 5. Star */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStar(msg.id)}
                                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                                  >
                                    <Star className={`w-4 h-4 ${isStarred ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
                                    <span>{isStarred ? 'Unstar' : 'Star'}</span>
                                  </button>

                                  {/* 6. Select */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectMessageFromMenu(msg.id)}
                                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                                  >
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                    <span>Select</span>
                                  </button>

                                  {/* 7. Delete */}
                                  <div className="pt-0.5 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteSingleMessage(msg.id);
                                        setOpenMenuMessageId(null);
                                      }}
                                      className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-500" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

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

                          {/* Quoted Reply Card preview if formatted */}
                          {isReply && (
                            <div className={`mb-2 p-2 rounded-xl border-l-4 text-left text-xs ${
                              isMine 
                                ? 'bg-black/15 border-sky-300 text-sky-50' 
                                : 'bg-slate-100 dark:bg-slate-700/60 border-sky-500 text-slate-700 dark:text-slate-200'
                            }`}>
                              <div className="font-extrabold text-[10px] uppercase tracking-wide opacity-90">{replyTo}</div>
                              <div className="italic text-[11px] truncate opacity-85 mt-0.5">{replySnippet}</div>
                            </div>
                          )}

                          {/* Message Text */}
                          <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                            {body}
                          </p>

                          {/* Interactive Call Invitation Card */}
                          {msg.callMeetingUrl && (
                            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-sky-500/30 text-slate-900 dark:text-white shadow-sm space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <div className="flex items-center gap-1.5">
                                  {msg.callType === 'audio' ? (
                                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Video className="w-4 h-4 text-sky-500 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold truncate">
                                    {msg.callType === 'audio' ? 'Instant Voice Call' : 'Instant Live Video Room'}
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
                                className={`w-full mt-1 py-1.5 px-3 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                  msg.callType === 'audio'
                                    ? 'bg-emerald-600 hover:bg-emerald-500'
                                    : 'bg-sky-600 hover:bg-sky-500'
                                }`}
                              >
                                {msg.callType === 'audio' ? (
                                  <>
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Join Voice Call</span>
                                  </>
                                ) : (
                                  <>
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Video Call</span>
                                  </>
                                )}
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
                            {isPinned && <Pin className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" title="Pinned" />}
                            {isStarred && <Star className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" title="Starred" />}
                            <span>{msg.timestamp}</span>
                            {isMine && <CheckCheck className="w-3 h-3 text-sky-200" />}
                          </div>
                        </div>
                      </div>

                      {/* Emoji Reactions Pill beneath bubble */}
                      {reactions.length > 0 && (
                        <div className={`flex items-center gap-0.5 mt-0.5 px-2 py-0.5 rounded-full text-xs shadow-xs border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-fit ${
                          isMine ? 'mr-1' : 'ml-9'
                        }`}>
                          {reactions.map((em, idx) => (
                            <span key={idx}>{em}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Message Input Compose Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
              
              {/* Active Replying Quoted Preview Bar */}
              {replyingToMessage && (
                <div className="mb-2 px-3.5 py-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2.5 min-w-0 border-l-3 border-sky-500 pl-2.5 py-0.5">
                    <Reply className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-sky-700 dark:text-sky-300">
                        Replying to {replyingToMessage.senderName}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        {parseReplyContent(replyingToMessage.text).body}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Cancel reply"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

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

      {/* Delete Conversation Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Delete Conversation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Choose whether to select specific messages to delete or permanently clear the entire conversation with <span className="font-bold text-slate-700 dark:text-slate-200">{contactToDelete?.name || activeContact?.name || 'this contact'}</span>.
                </p>
              </div>
            </div>

            {/* Two Choices: Select Specific Messages VS Delete Entire Conversation */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetId = contactToDelete?.id || activeContact?.id;
                  if (targetId && targetId !== selectedContactId) {
                    setSelectedContactId(targetId);
                  }
                  setIsDeleteDialogOpen(false);
                  setContactToDelete(null);
                  setIsSelectionMode(true);
                  setSelectedMessageIds(new Set());
                }}
                className="w-full p-3.5 rounded-2xl border border-sky-200/80 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800/60">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      Select Specific Messages to Delete
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Choose individual chats with checkboxes to delete
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={handleDeleteConversation}
                disabled={isDeletingConversation}
                className="w-full p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/80 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-800/60">
                    {isDeletingConversation ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-rose-600 dark:text-rose-400 group-hover:text-rose-700 transition-colors">
                      Delete Entire Conversation
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Permanently clear all messages with this contact
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setContactToDelete(null);
                }}
                disabled={isDeletingConversation}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Forward className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Forward Message</h3>
                  <p className="text-[11px] text-slate-400">Share this message with another contact</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForwardingMessage(null);
                  setForwardSearch('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message snippet preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 italic line-clamp-3">
              "{parseReplyContent(forwardingMessage.text).body}"
            </div>

            {/* Search contact */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search contact to forward to..."
                value={forwardSearch}
                onChange={e => setForwardSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Contact List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 space-y-1 pr-1">
              {contacts
                .filter(c => !forwardSearch || c.name.toLowerCase().includes(forwardSearch.toLowerCase()))
                .map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {contact.name}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {contact.role} {contact.className ? `• ${contact.className}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isForwarding}
                      onClick={() => handleExecuteForward(contact)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isForwarding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Send</span>
                          <Forward className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
