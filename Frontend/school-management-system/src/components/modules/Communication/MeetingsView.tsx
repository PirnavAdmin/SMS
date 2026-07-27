import React, { useState } from 'react';
import { 
  Users, User, Calendar, Clock, MapPin, Video, Plus, X, Search, CheckCircle2, 
  AlertCircle, ShieldAlert, Check, XCircle, Lock, Edit, Trash2, Link as LinkIcon, Building2
} from 'lucide-react';
import { 
  SchoolMeeting, MeetingAudience, MeetingParticipantType, MeetingMode, 
  MeetingStatus, MeetingParticipantInfo 
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const MeetingsView: React.FC = () => {
  const { meetings, staff, students, schoolProfile, addMeeting, updateMeeting, cancelMeeting, deleteMeeting } = useData();
  const { addToast } = useToast();
  const { user, role } = useAuth();

  const isAdminOrPrincipal = role === 'Super Admin' || role === 'Admin' || role === 'Principal' || role === 'HR';
  const isTeacher = role === 'Teacher';
  const canManageMeetings = isAdminOrPrincipal || isTeacher;

  // Filter States
  const [filterAudience, setFilterAudience] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<SchoolMeeting | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<SchoolMeeting | null>(null);
  const [cancellingMeeting, setCancellingMeeting] = useState<SchoolMeeting | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Form State
  const [meetingAudience, setMeetingAudience] = useState<MeetingAudience>('Individual');
  const [participantType, setParticipantType] = useState<MeetingParticipantType>('Parent');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [targetGroupDesc, setTargetGroupDesc] = useState<string>('All Mathematics Teachers');
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    meetingMode: MeetingMode;
    building: string;
    floor: string;
    roomVenue: string;
    roomCapacity: number;
    onlineMeetingUrl: string;
    meetingDate: string;
    startTime: string;
    endTime: string;
    status: MeetingStatus;
  }>({
    title: '',
    description: '',
    meetingMode: 'In-Person',
    building: 'Academic Wing A',
    floor: '1st Floor',
    roomVenue: 'Conference Room 102',
    roomCapacity: 15,
    onlineMeetingUrl: 'https://meet.google.com/abc-defg-hij',
    meetingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:30',
    status: 'Scheduled'
  });

  // Dynamic Options for Participant Type (Individual)
  const teachingStaffOptions = staff.filter(s => s.employeeCategory === 'Teacher' && s.status === 'Active');
  const nonTeachingStaffOptions = staff.filter(s => s.employeeCategory !== 'Teacher' && s.status === 'Active');
  const studentOptions = students.filter(s => s.status === 'Active');

  // Pre-formatted Parent options from student list
  const parentOptions = students.filter(s => s.status === 'Active').map(s => ({
    id: `PAR-${s.id}`,
    name: `${s.fatherName || 'Parent'} (${s.firstName} ${s.lastName}'s Guardian)`,
    type: 'Parent' as MeetingParticipantType,
    details: `Parent of ${s.firstName} ${s.lastName} (Class ${s.className}-${s.section})`,
    email: s.guardianEmail || s.contactEmail || 'parent@school.edu',
    phone: s.fatherPhone || s.contactPhone || '9876543210'
  }));

  const handleOpenAddModal = () => {
    setEditingMeeting(null);
    setMeetingAudience('Individual');
    setParticipantType('Parent');
    setSelectedParticipantId(parentOptions[0]?.id || '');
    setFormData({
      title: '',
      description: '',
      meetingMode: 'In-Person',
      building: 'Academic Block A',
      floor: '1st Floor',
      roomVenue: 'Conference Room 102',
      roomCapacity: 15,
      onlineMeetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '10:30',
      status: 'Scheduled'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meeting: SchoolMeeting) => {
    if (meeting.status === 'Completed' || meeting.status === 'Cancelled') {
      addToast('warning', 'Action Restricted', `Completed or Cancelled meetings are read-only.`);
      return;
    }
    setEditingMeeting(meeting);
    setMeetingAudience(meeting.meetingAudience);
    setParticipantType(meeting.participantType || 'Parent');
    setSelectedParticipantId(meeting.participants[0]?.id || '');
    setTargetGroupDesc(meeting.targetGroupDescription || '');
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      meetingMode: meeting.meetingMode,
      building: meeting.building || 'Academic Block A',
      floor: meeting.floor || '1st Floor',
      roomVenue: meeting.roomVenue || 'Conference Room 102',
      roomCapacity: meeting.roomCapacity || 15,
      onlineMeetingUrl: meeting.onlineMeetingUrl || '',
      meetingDate: meeting.meetingDate,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.status
    });
    setIsModalOpen(true);
  };

  // Submit Handler with Validations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { title, meetingMode, roomVenue, meetingDate, startTime, endTime, status } = formData;

    if (!title.trim() || !meetingDate || !startTime || !endTime) {
      addToast('warning', 'Validation Warning', 'Please complete mandatory fields (Title, Date, Start & End Time).');
      return;
    }

    // 1. Time validation
    if (startTime >= endTime) {
      addToast('error', 'Time Error', 'Start Time must be strictly before End Time.');
      return;
    }

    // 2. Room / Venue Conflict Validation for In-Person or Hybrid mode
    if (meetingMode === 'In-Person' || meetingMode === 'Hybrid') {
      if (!roomVenue.trim()) {
        addToast('warning', 'Venue Warning', 'Please specify a Meeting Room / Venue for In-Person/Hybrid mode.');
        return;
      }

      const venueConflict = meetings.find(m => 
        m.id !== editingMeeting?.id &&
        m.status !== 'Cancelled' &&
        (m.meetingMode === 'In-Person' || m.meetingMode === 'Hybrid') &&
        m.roomVenue?.toLowerCase().trim() === roomVenue.toLowerCase().trim() &&
        m.meetingDate === meetingDate &&
        ((startTime >= m.startTime && startTime < m.endTime) ||
         (endTime > m.startTime && endTime <= m.endTime) ||
         (startTime <= m.startTime && endTime >= m.endTime))
      );

      if (venueConflict) {
        addToast('error', 'Venue Conflict Error', `Room '${roomVenue}' is already reserved for '${venueConflict.title}' from ${venueConflict.startTime} to ${venueConflict.endTime} on ${meetingDate}.`);
        return;
      }
    }

    // 3. Participant Assembly
    let participantsList: MeetingParticipantInfo[] = [];

    if (meetingAudience === 'Individual') {
      if (!selectedParticipantId) {
        addToast('warning', 'Participant Required', 'Please select exactly one participant for an Individual meeting.');
        return;
      }

      if (participantType === 'Teaching Staff') {
        const st = staff.find(s => s.id === selectedParticipantId);
        if (st) {
          participantsList = [{
            id: st.id,
            name: `${st.firstName} ${st.lastName}`,
            type: 'Teaching Staff',
            details: `${st.empId || st.id} • ${st.department || 'Academics'} • ${st.designation || 'Teacher'}`,
            email: st.email,
            phone: st.phone
          }];
        }
      } else if (participantType === 'Non-Teaching Staff') {
        const st = staff.find(s => s.id === selectedParticipantId);
        if (st) {
          participantsList = [{
            id: st.id,
            name: `${st.firstName} ${st.lastName}`,
            type: 'Non-Teaching Staff',
            details: `${st.empId || st.id} • ${st.department || 'Operations'} • ${st.designation || 'Staff'}`,
            email: st.email,
            phone: st.phone
          }];
        }
      } else if (participantType === 'Student') {
        const st = students.find(s => s.id === selectedParticipantId);
        if (st) {
          participantsList = [{
            id: st.id,
            name: `${st.firstName} ${st.lastName}`,
            type: 'Student',
            details: `ADM-${st.admissionNo || st.id} • Class ${st.className}-${st.section}`,
            email: st.guardianEmail,
            phone: st.fatherPhone
          }];
        }
      } else if (participantType === 'Parent') {
        const pObj = parentOptions.find(p => p.id === selectedParticipantId);
        if (pObj) {
          participantsList = [pObj];
        }
      }
    } else {
      // Group Meeting
      participantsList = staff.slice(0, 3).map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        type: 'Teaching Staff',
        details: `${s.department} Department`,
        email: s.email
      }));
    }

    const payload: Omit<SchoolMeeting, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: formData.description,
      academicYear: schoolProfile.academicYear || '2025-2026',
      branch: user?.branch || 'Main Campus',
      meetingAudience,
      participantType: meetingAudience === 'Individual' ? participantType : undefined,
      participants: participantsList,
      targetGroupDescription: meetingAudience === 'Group' ? targetGroupDesc : undefined,
      meetingMode,
      building: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.building : undefined,
      floor: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.floor : undefined,
      roomVenue: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.roomVenue : undefined,
      roomCapacity: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.roomCapacity : undefined,
      onlineMeetingUrl: (meetingMode === 'Online' || meetingMode === 'Hybrid') ? formData.onlineMeetingUrl : undefined,
      meetingDate,
      startTime,
      endTime,
      status,
      organizerName: user?.name || 'Administrator',
      organizerRole: role || 'Admin'
    };

    if (editingMeeting) {
      updateMeeting(editingMeeting.id, payload);
      addToast('success', 'Meeting Updated', `Successfully updated meeting details for '${title}'.`);
    } else {
      addMeeting(payload);
      if (status === 'Scheduled') {
        const targetName = meetingAudience === 'Individual' ? participantsList[0]?.name || 'the participant' : targetGroupDesc;
        addToast('success', 'Meeting Scheduled', `Dispatched notification exclusively to ${targetName}.`);
      } else {
        addToast('info', 'Draft Saved', `Saved draft meeting '${title}'.`);
      }
    }

    setIsModalOpen(false);
  };

  const handleConfirmCancel = () => {
    if (!cancellingMeeting) return;
    if (!cancellationReason.trim()) {
      addToast('warning', 'Reason Required', 'Please provide a reason for cancelling the meeting.');
      return;
    }

    cancelMeeting(cancellingMeeting.id, cancellationReason);
    const targetName = cancellingMeeting.meetingAudience === 'Individual' ? cancellingMeeting.participants[0]?.name : cancellingMeeting.targetGroupDescription;
    addToast('info', 'Meeting Cancelled', `Cancellation notification sent exclusively to ${targetName}.`);
    setCancellingMeeting(null);
    setCancellationReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Meeting Management</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Schedule & manage Individual in-person meetings, group syncs, venue availability & private alerts</p>
          </div>
        </div>

        {canManageMeetings && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 text-xs transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-3xl grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-semibold">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Audience</label>
          <select
            value={filterAudience}
            onChange={e => setFilterAudience(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="">All Audiences</option>
            <option value="Individual">Individual Meetings</option>
            <option value="Group">Group Meetings</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Mode</label>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="">All Modes</option>
            <option value="In-Person">In-Person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Search Meetings</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, venue, participant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Meetings Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(() => {
          const filtered = meetings.filter(m => {
            if (filterAudience && m.meetingAudience !== filterAudience) return false;
            if (filterMode && m.meetingMode !== filterMode) return false;
            if (filterStatus && m.status !== filterStatus) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const pMatch = m.participants.some(p => p.name.toLowerCase().includes(q) || p.details.toLowerCase().includes(q));
              const match = m.title.toLowerCase().includes(q) || (m.roomVenue && m.roomVenue.toLowerCase().includes(q)) || pMatch;
              if (!match) return false;
            }
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="col-span-full p-12 text-center text-slate-400 font-bold glass-card rounded-3xl">
                No meetings found matching your selected criteria.
              </div>
            );
          }

          return filtered.map(meeting => (
            <div key={meeting.id} className="glass-card p-5 rounded-3xl space-y-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-800 shadow-md">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    meeting.meetingAudience === 'Individual'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200'
                  }`}>
                    {meeting.meetingAudience} Meeting
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    meeting.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' :
                    meeting.status === 'Draft' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200' :
                    meeting.status === 'Completed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                  }`}>
                    {meeting.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-indigo-600 transition-colors leading-tight">
                  {meeting.title}
                </h3>
                {meeting.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2">{meeting.description}</p>
                )}
              </div>

              <div className="space-y-2 text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Participant Info */}
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div className="truncate">
                    {meeting.meetingAudience === 'Individual' ? (
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {meeting.participants[0]?.name || '1 Participant'}
                        <span className="block text-[10px] text-slate-400 font-normal truncate">{meeting.participants[0]?.details}</span>
                      </span>
                    ) : (
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {meeting.targetGroupDescription || `${meeting.participants.length} Participants`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-xs">{meeting.meetingDate}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                  <span className="font-mono text-xs">{meeting.startTime} - {meeting.endTime}</span>
                </div>

                {/* Venue / Link */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  {(meeting.meetingMode === 'In-Person' || meeting.meetingMode === 'Hybrid') ? (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate font-bold text-amber-600 dark:text-amber-400">
                        {meeting.roomVenue} {meeting.building ? `(${meeting.building})` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate text-blue-600 font-mono text-[11px]">{meeting.onlineMeetingUrl || 'Online Video Room'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <button
                  onClick={() => setViewingMeeting(meeting)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors"
                >
                  View Details
                </button>

                {canManageMeetings && (
                  <div className="flex items-center gap-1">
                    {meeting.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => {
                            updateMeeting(meeting.id, { status: 'Completed' });
                            addToast('success', 'Meeting Completed', `Marked meeting '${meeting.title}' as Completed.`);
                          }}
                          title="Mark Completed"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCancellingMeeting(meeting)}
                          title="Cancel Meeting"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(meeting.status === 'Scheduled' || meeting.status === 'Draft') && (
                      <button
                        onClick={() => handleOpenEditModal(meeting)}
                        title="Edit Meeting"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete meeting '${meeting.title}'?`)) {
                          deleteMeeting(meeting.id);
                          addToast('info', 'Deleted', 'Meeting record removed.');
                        }
                      }}
                      title="Delete Record"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Schedule / Edit Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {editingMeeting ? 'Modify Meeting Details' : 'Schedule New Meeting'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {/* Meeting Audience Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Meeting Audience *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingAudience('Individual')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      meetingAudience === 'Individual'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Individual Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingAudience('Group')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      meetingAudience === 'Group'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Group Meeting
                  </button>
                </div>
              </div>

              {/* Individual Participant Picker */}
              {meetingAudience === 'Individual' ? (
                <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1">Participant Type *</label>
                    <select
                      value={participantType}
                      onChange={e => {
                        const nextType = e.target.value as MeetingParticipantType;
                        setParticipantType(nextType);
                        if (nextType === 'Teaching Staff') setSelectedParticipantId(teachingStaffOptions[0]?.id || '');
                        else if (nextType === 'Non-Teaching Staff') setSelectedParticipantId(nonTeachingStaffOptions[0]?.id || '');
                        else if (nextType === 'Student') setSelectedParticipantId(studentOptions[0]?.id || '');
                        else if (nextType === 'Parent') setSelectedParticipantId(parentOptions[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Student">Student</option>
                      <option value="Teaching Staff">Teaching Staff</option>
                      <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1">
                      Select Participant ({participantType}) *
                    </label>
                    <select
                      required
                      value={selectedParticipantId}
                      onChange={e => setSelectedParticipantId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-bold text-purple-700 dark:text-purple-300"
                    >
                      {participantType === 'Teaching Staff' && teachingStaffOptions.map(t => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.empId || t.id} • {t.department || 'Academics'} • {t.designation})</option>
                      ))}
                      {participantType === 'Non-Teaching Staff' && nonTeachingStaffOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.empId || s.id} • {s.department || 'Operations'})</option>
                      ))}
                      {participantType === 'Student' && studentOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} (ADM-{s.admissionNo || s.id} • Class {s.className}-{s.section})</option>
                      ))}
                      {participantType === 'Parent' && parentOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
                      Note: Only the single selected {participantType.toLowerCase()} will receive this meeting notification.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">Target Group Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. All Mathematics Teachers / All Grade 8 Parents"
                    value={targetGroupDesc}
                    onChange={e => setTargetGroupDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-bold"
                  />
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Notifications will be sent strictly to users inside the selected group.
                  </p>
                </div>
              )}

              {/* Title & Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Performance Review Sync"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Agenda / Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter meeting agenda or discussion topics..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              {/* Meeting Mode */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['In-Person', 'Online', 'Hybrid'] as MeetingMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, meetingMode: mode })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.meetingMode === mode
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue details for In-Person or Hybrid */}
              {(formData.meetingMode === 'In-Person' || formData.meetingMode === 'Hybrid') && (
                <div className="p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                  <h4 className="font-extrabold text-[11px] text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> In-Person Venue Configuration
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 mb-1">Building</label>
                      <input
                        type="text"
                        placeholder="e.g. Academic Wing A"
                        value={formData.building}
                        onChange={e => setFormData({ ...formData, building: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 mb-1">Floor</label>
                      <input
                        type="text"
                        placeholder="e.g. 1st Floor"
                        value={formData.floor}
                        onChange={e => setFormData({ ...formData, floor: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Room / Venue *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Conference Room 102"
                        value={formData.roomVenue}
                        onChange={e => setFormData({ ...formData, roomVenue: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 mb-1">Room Capacity (Read-Only Info)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.roomCapacity}
                      className="w-28 px-3 py-1.5 rounded-xl border bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 ml-2">Seats available in venue</span>
                  </div>
                </div>
              )}

              {/* Online link for Online or Hybrid */}
              {(formData.meetingMode === 'Online' || formData.meetingMode === 'Hybrid') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Online Video URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/xyz-pdq-abc"
                    value={formData.onlineMeetingUrl}
                    onChange={e => setFormData({ ...formData, onlineMeetingUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.meetingDate}
                    onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Start Time (24h) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">End Time (24h) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Status *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as MeetingStatus })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="Scheduled">Scheduled (Send Notifications Immediately)</option>
                  <option value="Draft">Draft (Do Not Notify)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md">
                  {editingMeeting ? 'Save Changes' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Meeting Drawer / Modal */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Meeting Details</h3>
                  <p className="text-[10px] text-slate-400">{viewingMeeting.title}</p>
                </div>
              </div>
              <button onClick={() => setViewingMeeting(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Audience</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{viewingMeeting.meetingAudience} Meeting</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Mode</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{viewingMeeting.meetingMode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Date</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{viewingMeeting.meetingDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Time Window</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{viewingMeeting.startTime} - {viewingMeeting.endTime}</span>
                </div>
              </div>

              {viewingMeeting.description && (
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Agenda</span>
                  <p className="text-slate-700 dark:text-slate-300">{viewingMeeting.description}</p>
                </div>
              )}

              {(viewingMeeting.meetingMode === 'In-Person' || viewingMeeting.meetingMode === 'Hybrid') && (
                <div className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">Venue Details</span>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingMeeting.roomVenue} ({viewingMeeting.building}, {viewingMeeting.floor})</p>
                  <p className="text-[10px] text-slate-500 font-mono">Room Capacity: {viewingMeeting.roomCapacity || 15} Seats</p>
                </div>
              )}

              {viewingMeeting.participants && viewingMeeting.participants.length > 0 && (
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Invited Participant(s)</span>
                  {viewingMeeting.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-extrabold text-slate-900 dark:text-white">{p.name} ({p.type})</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.details}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewingMeeting.cancellationReason && (
                <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50/30 text-rose-700 text-xs font-medium">
                  <strong>Cancellation Reason:</strong> {viewingMeeting.cancellationReason}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t text-[10px] text-slate-400 font-medium">
                <span>Organized by: <strong className="text-slate-600 dark:text-slate-300">{viewingMeeting.organizerName} ({viewingMeeting.organizerRole})</strong></span>
                <span>Created: <strong className="font-mono text-slate-600 dark:text-slate-300">{viewingMeeting.createdAt}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Meeting Confirmation Modal */}
      {cancellingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Cancel Scheduled Meeting</h3>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Are you sure you want to cancel <strong>{cancellingMeeting.title}</strong>? A cancellation alert will be dispatched to invited participants.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 mb-1">Reason for Cancellation *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Principal unavailable due to urgent board meeting..."
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setCancellingMeeting(null)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl text-xs">
                Keep Scheduled
              </button>
              <button onClick={handleConfirmCancel} className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md text-xs">
                Cancel Meeting & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
