import { apiClient } from './client';

export interface ChatContact {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'parent';
  avatar?: string;
  email?: string;
  phone?: string;
  className?: string;
  section?: string;
  subject?: string;
  designation?: string;
  admissionNo?: string;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderClass?: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  receiverClass?: string;
  text: string;
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  callType?: 'video' | 'audio';
  callMeetingUrl?: string;
  isOutgoing: boolean;
}

export interface SendMessagePayload {
  receiverId: string;
  receiverName?: string;
  receiverRole?: string;
  messageText: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface InitiateCallPayload {
  receiverId: string;
  receiverName?: string;
  receiverRole?: string;
  callType: 'video' | 'audio';
}

/**
 * Fetch contacts available for chat.
 * Enforces business rule: Students only see peers from their own class & all teachers.
 * Teachers, admins, and staff can view all contacts and filter students/parents by class.
 */
export const fetchChatContactsApi = async (classFilter?: string): Promise<{
  success: boolean;
  currentUser?: {
    id: string;
    name: string;
    role: string;
    className?: string;
    section?: string;
  };
  data: ChatContact[];
}> => {
  const query = classFilter && classFilter !== 'all' ? `?classFilter=${encodeURIComponent(classFilter)}` : '';
  return apiClient(`/api/chat/contacts${query}`, { method: 'GET' });
};

/**
 * Fetch messages between authenticated user and a specific contact.
 */
export const fetchChatMessagesApi = async (contactId: string): Promise<{
  success: boolean;
  contactId: string;
  data: ChatMessage[];
}> => {
  return apiClient(`/api/chat/messages?contactId=${encodeURIComponent(contactId)}`, {
    method: 'GET'
  });
};

/**
 * Send a direct message to a contact.
 */
export const sendChatMessageApi = async (payload: SendMessagePayload): Promise<{
  success: boolean;
  message: string;
  data: ChatMessage;
}> => {
  return apiClient('/api/chat/messages', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Initiate an instant direct video/audio call with room generation.
 */
export const initiateDirectCallApi = async (payload: InitiateCallPayload): Promise<{
  success: boolean;
  meetingUrl: string;
  callType: string;
  message: string;
  chatMessage: ChatMessage;
}> => {
  return apiClient('/api/chat/call', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Get total unread direct messages count for the active user.
 */
export const fetchChatUnreadCountApi = async (): Promise<{
  success: boolean;
  unreadCount: number;
}> => {
  return apiClient('/api/chat/unread-count', { method: 'GET' });
};
