import React, { useState, useMemo, useEffect } from "react";
import {
  Megaphone,
  MessageSquare,
  Calendar,
  AlertTriangle,
  ClipboardList,
  Plus,
  X,
  Search,
  CheckCircle2,
  Clock,
  User,
  Users,
  Building2,
  Check,
  Send,
  Eye,
  Trash2,
  Paperclip,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  BellRing,
  CheckSquare,
  AlertCircle,
  FileText,
  HeartPulse,
  Wrench,
  Utensils,
  LogOut,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useData } from "../../../../context/DataContext";
import { useHostel } from "../../../../context/HostelContext";
import { useToast } from "../../../../context/ToastContext";

// Warden Announcement Interface
export interface WardenAnnouncement {
  id: string;
  title: string;
  message: string;
  audience:
    | "All Hostel Students"
    | "Specific Hostel"
    | "Specific Hostel Block"
    | "Specific Room"
    | "Specific Student"
    | "Hostel Staff"
    | "Parents";
  hostelBlock?: string;
  roomNo?: string;
  studentId?: string;
  studentName?: string;
  priority: "Normal" | "Important" | "Urgent";
  publishDate: string;
  expiryDate?: string;
  attachmentName?: string;
  status: "Published" | "Draft" | "Expired";
  author: string;
}

// Parent Communication Interface
export interface ParentCommunicationMessage {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  roomNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  category:
    | "Hostel Leave"
    | "Late Return"
    | "Student Absence"
    | "Hostel Discipline"
    | "Student Welfare"
    | "Medical Notification"
    | "Important Hostel Notice"
    | "Other";
  subject: string;
  message: string;
  sentDate: string;
  sentTime: string;
  readStatus: "Read" | "Unread";
  replyStatus: "No Reply" | "Replied";
  replyText?: string;
}

// Relevant Warden Meeting Interface
export interface WardenMeeting {
  id: string;
  title: string;
  meetingType:
    | "Hostel Staff Meeting"
    | "Parent Meeting"
    | "Student Counselling"
    | "Discipline Meeting"
    | "Hostel Inspection"
    | "Warden Meeting";
  hostelBlock: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  participants: string;
  status: "Scheduled" | "Completed" | "Cancelled";
}

// Hostel Alert Interface
export interface HostelAlertItem {
  id: string;
  alertType:
    | "Emergency"
    | "Student Safety"
    | "Medical"
    | "Maintenance"
    | "Discipline"
    | "Late Return"
    | "Facility Issue";
  title: string;
  description: string;
  hostel: string;
  block: string;
  room: string;
  studentName?: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  createdDate: string;
  createdTime: string;
  status: "Active" | "Acknowledged" | "Resolved";
}

// Hostel Request & Complaint Interface
export interface HostelRequestItem {
  id: string;
  submittedBy: string;
  submitterRole: "Student" | "Parent" | "Hostel Staff";
  studentName?: string;
  roomNo: string;
  block: string;
  category:
    | "Room Maintenance"
    | "Electrical Issue"
    | "Water Issue"
    | "Food / Mess Complaint"
    | "Room Change Request"
    | "Hostel Facility Request"
    | "Leave Request"
    | "Other";
  title: string;
  description: string;
  submittedDate: string;
  status: "Open" | "In Progress" | "Resolved" | "Rejected";
  wardenResponse?: string;
  updatedDate?: string;
}

export const WardenCommunicationHubView: React.FC = () => {
  const { user, selectedBranch, selectedAcademicYear } = useAuth();
  const { students = [], staff = [] } = useData();
  const { hostelBlocks = [] } = useHostel();
  const { addToast } = useToast();

  const wardenName = user?.name || "VaraPrasad (Hostel Warden)";

  // Active Tab: 'announcements' | 'parent-comm' | 'meetings' | 'requests'
  const [activeTab, setActiveTab] = useState<
    "announcements" | "parent-comm" | "meetings" | "requests"
  >("announcements");

  // Filters State
  const [filterType, setFilterType] = useState<string>("All");
  const [filterHostel, setFilterHostel] = useState<string>("All");
  const [filterBlock, setFilterBlock] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. ANNOUNCEMENTS STATE
  const [announcements, setAnnouncements] = useState<WardenAnnouncement[]>(
    () => {
      try {
        const saved = localStorage.getItem("warden_announcements_store");
        if (saved) return JSON.parse(saved);
      } catch {}
      return [
        {
          id: "W-ANN-101",
          title: "Night Curfew Hours & Weekend Gate Pass Policy",
          message:
            "All hostellers must report to their respective blocks before 08:30 PM. Outpasses for weekend leave must be submitted by Friday noon.",
          audience: "All Hostel Students",
          hostelBlock: "All Blocks",
          priority: "Important",
          publishDate: "2026-08-25",
          status: "Published",
          author: wardenName,
        },
        {
          id: "W-ANN-102",
          title: "Monthly Mess Advisory Committee Inspection",
          message:
            "Hostel mess inspection and quality audit scheduled for tomorrow evening. Student representatives are requested to attend.",
          audience: "Hostel Staff",
          hostelBlock: "Ramachandra Bhavan (Block A)",
          priority: "Normal",
          publishDate: "2026-08-24",
          status: "Published",
          author: wardenName,
        },
      ];
    }
  );

  // 2. PARENT COMMUNICATION STATE
  const [parentMessages, setParentMessages] = useState<
    ParentCommunicationMessage[]
  >(() => {
    try {
      const saved = localStorage.getItem("warden_parent_messages_store");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "PCM-201",
        studentId: "STU-101",
        studentName: "Alexander Wright",
        className: "Class 10-A",
        roomNo: "Room 201",
        parentName: "Robert Wright",
        parentPhone: "9876543210",
        parentEmail: "robert.wright@gmail.com",
        category: "Hostel Leave",
        subject: "Weekend Home Leave Approval Request",
        message:
          "Dear Parent, Alexander has requested home leave from Aug 28 to Aug 30. Please confirm approval.",
        sentDate: "2026-08-25",
        sentTime: "10:15 AM",
        readStatus: "Read",
        replyStatus: "Replied",
        replyText: "Approved. He will travel by train on Friday evening.",
      },
      {
        id: "PCM-202",
        studentId: "STU-102",
        studentName: "Sophia Chen",
        className: "Class 9-B",
        roomNo: "Room 104",
        parentName: "David Chen",
        parentPhone: "9876543211",
        parentEmail: "david.chen@gmail.com",
        category: "Medical Notification",
        subject: "Routine Health Checkup & Prescription Note",
        message:
          "Dear Parent, Sophia visited the medical center today for minor throat pain and was prescribed rest.",
        sentDate: "2026-08-24",
        sentTime: "04:30 PM",
        readStatus: "Read",
        replyStatus: "No Reply",
      },
    ];
  });

  // 3. MEETINGS & SCHEDULES STATE
  const [wardenMeetings, setWardenMeetings] = useState<WardenMeeting[]>(() => {
    try {
      const saved = localStorage.getItem("warden_meetings_store");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "WMT-301",
        title: "Monthly Warden & Block Monitors Inspection Review",
        meetingType: "Hostel Inspection",
        hostelBlock: "Ramachandra Bhavan (Block A)",
        date: "2026-08-26",
        time: "05:00 PM",
        venue: "Warden Conference Office",
        organizer: wardenName,
        participants: "Warden, Assistant Warden & Block Prefects",
        status: "Scheduled",
      },
      {
        id: "WMT-302",
        title: "Hostel Staff Safety & Discipline Review",
        meetingType: "Hostel Staff Meeting",
        hostelBlock: "All Blocks",
        date: "2026-08-27",
        time: "03:00 PM",
        venue: "Main Hostel Seminar Room",
        organizer: wardenName,
        participants: "Security Guards, Mess Supervisors, Cleaning Staff",
        status: "Scheduled",
      },
    ];
  });

  // 4. HOSTEL ALERTS STATE
  const [hostelAlerts, setHostelAlerts] = useState<HostelAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem("warden_alerts_store");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "ALT-401",
        alertType: "Late Return",
        title: "Late Night Entry Alert - Room 204",
        description:
          "Student reported back to hostel gate at 09:45 PM after evening curfew. Entry recorded at security.",
        hostel: "Main Campus Hostel",
        block: "Ramachandra Bhavan (Block A)",
        room: "Room 204",
        studentName: "Rahul Sharma",
        priority: "High",
        createdDate: "2026-08-25",
        createdTime: "09:50 PM",
        status: "Active",
      },
      {
        id: "ALT-402",
        alertType: "Maintenance",
        title: "Block B Main Water Line Pressure Issue",
        description:
          "Low water pressure detected in 2nd floor restrooms of Vivekananda Hostel Block B.",
        hostel: "Main Campus Hostel",
        block: "Vivekananda Hostel (Block B)",
        room: "2nd Floor Restrooms",
        priority: "Critical",
        createdDate: "2026-08-25",
        createdTime: "07:30 AM",
        status: "Acknowledged",
      },
      {
        id: "ALT-403",
        alertType: "Medical",
        title: "Fever Consultation & Medical Observation",
        description:
          "Student in Room 104 under observation for mild seasonal fever.",
        hostel: "Girls Hostel",
        block: "Saraswati Bhavan (Girls Block)",
        room: "Room 104",
        studentName: "Sophia Chen",
        priority: "Medium",
        createdDate: "2026-08-24",
        createdTime: "02:15 PM",
        status: "Active",
      },
    ];
  });

  // 5. REQUESTS & COMPLAINTS STATE
  const [hostelRequests, setHostelRequests] = useState<HostelRequestItem[]>(
    () => {
      try {
        const saved = localStorage.getItem("warden_requests_store");
        if (saved) return JSON.parse(saved);
      } catch {}
      return [
        {
          id: "REQ-501",
          submittedBy: "Alexander Wright",
          submitterRole: "Student",
          studentName: "Alexander Wright",
          roomNo: "Room 201",
          block: "Ramachandra Bhavan (Block A)",
          category: "Room Maintenance",
          title: "Ceiling Fan Regulator Malfunction",
          description:
            "The ceiling fan regulator in Room 201 is stuck at high speed. Request electrician check.",
          submittedDate: "2026-08-24",
          status: "Open",
        },
        {
          id: "REQ-502",
          submittedBy: "David Chen (Parent)",
          submitterRole: "Parent",
          studentName: "Sophia Chen",
          roomNo: "Room 104",
          block: "Saraswati Bhavan (Girls Block)",
          category: "Food / Mess Complaint",
          title: "Special Dietary Meal Request during recovery",
          description:
            "Request light warm porridge meal for Sophia for 2 days during her recovery.",
          submittedDate: "2026-08-24",
          status: "In Progress",
          wardenResponse:
            "Informed Mess Manager to prepare warm porridge for Room 104.",
          updatedDate: "2026-08-25",
        },
        {
          id: "REQ-503",
          submittedBy: "Security Supervisor",
          submitterRole: "Hostel Staff",
          roomNo: "Block A Entrance",
          block: "Ramachandra Bhavan (Block A)",
          category: "Electrical Issue",
          title: "Courtyard Floodlight Bulb Replacement",
          description:
            "Night security floodlight bulb outside Block A entrance requires replacement.",
          submittedDate: "2026-08-23",
          status: "Resolved",
          wardenResponse: "Replaced floodlight bulb with 50W LED fixture.",
          updatedDate: "2026-08-24",
        },
      ];
    }
  );

  // Persistence helpers
  useEffect(() => {
    try {
      localStorage.setItem(
        "warden_announcements_store",
        JSON.stringify(announcements)
      );
      localStorage.setItem(
        "warden_parent_messages_store",
        JSON.stringify(parentMessages)
      );
      localStorage.setItem(
        "warden_meetings_store",
        JSON.stringify(wardenMeetings)
      );
      localStorage.setItem(
        "warden_alerts_store",
        JSON.stringify(hostelAlerts)
      );
      localStorage.setItem(
        "warden_requests_store",
        JSON.stringify(hostelRequests)
      );
    } catch {}
  }, [announcements, parentMessages, wardenMeetings, hostelAlerts, hostelRequests]);

  // MODALS STATE
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isParentMsgModalOpen, setIsParentMsgModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] =
    useState<HostelRequestItem | null>(null);
  const [wardenResponseInput, setWardenResponseInput] = useState("");

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annAudience, setAnnAudience] = useState<WardenAnnouncement["audience"]>(
    "All Hostel Students"
  );
  const [annBlock, setAnnBlock] = useState("Ramachandra Bhavan (Block A)");
  const [annRoom, setAnnRoom] = useState("");
  const [annStudentId, setAnnStudentId] = useState("");
  const [annPriority, setAnnPriority] =
    useState<WardenAnnouncement["priority"]>("Normal");
  const [annPublishDate, setAnnPublishDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [annExpiryDate, setAnnExpiryDate] = useState("");
  const [annAttachmentName, setAnnAttachmentName] = useState("");

  // Parent Message Form State
  const [pmStudentId, setPmStudentId] = useState("");
  const [pmClassFilter, setPmClassFilter] = useState("All");
  const [pmStudentSearch, setPmStudentSearch] = useState("");
  const [pmCategory, setPmCategory] =
    useState<ParentCommunicationMessage["category"]>("Hostel Leave");
  const [pmCustomCategory, setPmCustomCategory] = useState("");
  const [pmSubject, setPmSubject] = useState("");
  const [pmMessage, setPmMessage] = useState("");

  // Alert Form State
  const [altType, setAltType] =
    useState<HostelAlertItem["alertType"]>("Emergency");
  const [altTitle, setAltTitle] = useState("");
  const [altDesc, setAltDesc] = useState("");
  const [altBlock, setAltBlock] = useState("Ramachandra Bhavan (Block A)");
  const [altRoom, setAltRoom] = useState("");
  const [altStudentName, setAltStudentName] = useState("");
  const [altPriority, setAltPriority] =
    useState<HostelAlertItem["priority"]>("High");

  // Meeting Form State
  const [mType, setMType] =
    useState<WardenMeeting["meetingType"]>("Hostel Staff Meeting");
  const [mTitle, setMTitle] = useState("");
  const [mBlock, setMBlock] = useState("Ramachandra Bhavan (Block A)");
  const [mDate, setMDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mTime, setMTime] = useState("04:00 PM");
  const [mVenue, setMVenue] = useState("Warden Office");
  const [mParticipants, setMParticipants] = useState("Hostel Staff");

  // Available Classes from Students list
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach((s) => {
      if (s.className) classSet.add(s.className);
    });
    return Array.from(classSet).sort();
  }, [students]);

  // Filtered Residential Students Only
  const filteredResidentialStudents = useMemo(() => {
    return students.filter((s) => {
      // Residential / Hosteller Check
      const isResidential =
        (s as any).studentType === "Hosteller" ||
        (s as any).studentType === "Residential" ||
        (s as any).isHosteller ||
        (s as any).studentType !== "Day Scholar";

      if (!isResidential) return false;

      // Filter by Class
      if (pmClassFilter !== "All" && s.className !== pmClassFilter) {
        return false;
      }

      // Filter by Search Query
      if (pmStudentSearch.trim()) {
        const query = pmStudentSearch.toLowerCase();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const admNo = ((s as any).admissionNo || (s as any).admissionNumber || s.id || "").toLowerCase();
        const room = ((s as any).roomNo || (s as any).hostelRoom || "").toLowerCase();
        return (
          fullName.includes(query) ||
          admNo.includes(query) ||
          room.includes(query)
        );
      }

      return true;
    });
  }, [students, pmClassFilter, pmStudentSearch]);

  // Selected Student Object for Parent Comm Auto-Population
  const selectedStudentObj = useMemo(() => {
    if (!pmStudentId) return null;
    return students.find((s) => s.id === pmStudentId) || null;
  }, [pmStudentId, students]);

  // Derived Summary Counts
  const activeAlertsCount = useMemo(() => {
    return hostelAlerts.filter((a) => a.status !== "Resolved").length;
  }, [hostelAlerts]);

  const openRequestsCount = useMemo(() => {
    return hostelRequests.filter((r) => r.status !== "Resolved" && r.status !== "Rejected").length;
  }, [hostelRequests]);

  // 8. RECENT HOSTEL COMMUNICATION FEED (Sorted Newest First)
  const recentCommunicationsFeed = useMemo(() => {
    const feed: {
      id: string;
      type: "Announcement" | "Parent Message" | "Alert" | "Request" | "Meeting";
      title: string;
      target: string;
      date: string;
      status: string;
      icon: any;
      color: string;
    }[] = [];

    announcements.forEach((a) => {
      feed.push({
        id: a.id,
        type: "Announcement",
        title: a.title,
        target: `${a.audience}${a.hostelBlock ? ` (${a.hostelBlock})` : ""}`,
        date: a.publishDate,
        status: a.priority,
        icon: Megaphone,
        color: "text-sky-600 bg-sky-50 dark:bg-sky-950/60 border-sky-200",
      });
    });

    parentMessages.forEach((pm) => {
      feed.push({
        id: pm.id,
        type: "Parent Message",
        title: `${pm.category}: ${pm.subject}`,
        target: `Student: ${pm.studentName} • Parent: ${pm.parentName}`,
        date: pm.sentDate,
        status: pm.replyStatus,
        icon: MessageSquare,
        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200",
      });
    });

    hostelAlerts.forEach((alt) => {
      feed.push({
        id: alt.id,
        type: "Alert",
        title: `[${alt.alertType}] ${alt.title}`,
        target: `${alt.block} • ${alt.room}`,
        date: alt.createdDate,
        status: alt.status,
        icon: ShieldAlert,
        color: alt.priority === "Critical" || alt.priority === "High"
          ? "text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200"
          : "text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200",
      });
    });

    hostelRequests.forEach((req) => {
      feed.push({
        id: req.id,
        type: "Request",
        title: `[${req.category}] ${req.title}`,
        target: `By: ${req.submittedBy} (${req.roomNo})`,
        date: req.submittedDate,
        status: req.status,
        icon: ClipboardList,
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200",
      });
    });

    wardenMeetings.forEach((m) => {
      feed.push({
        id: m.id,
        type: "Meeting",
        title: `${m.meetingType}: ${m.title}`,
        target: `${m.hostelBlock} • ${m.venue}`,
        date: m.date,
        status: m.status,
        icon: Calendar,
        color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200",
      });
    });

    return feed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [announcements, parentMessages, hostelAlerts, hostelRequests, wardenMeetings]);

  // Handlers for Creating Items
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      addToast("warning", "Required Fields", "Please enter Announcement Title and Message.");
      return;
    }

    const newAnn: WardenAnnouncement = {
      id: `W-ANN-${Date.now().toString().slice(-4)}`,
      title: annTitle,
      message: annMessage,
      audience: annAudience,
      hostelBlock: annBlock,
      roomNo: annRoom,
      studentId: annStudentId,
      priority: annPriority,
      publishDate: annPublishDate,
      expiryDate: annExpiryDate,
      attachmentName: annAttachmentName,
      status: "Published",
      author: wardenName,
    };

    setAnnouncements((prev) => [newAnn, ...prev]);
    setIsAnnouncementModalOpen(false);
    setAnnTitle("");
    setAnnMessage("");
    addToast("success", "Announcement Published", "Hostel broadcast announcement published successfully.");
  };

  const handleSendParentMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentObj || !pmSubject.trim() || !pmMessage.trim()) {
      addToast("warning", "Required Fields", "Please select a student and enter subject and message.");
      return;
    }

    const parentName =
      (selectedStudentObj as any).fatherName ||
      (selectedStudentObj as any).motherName ||
      (selectedStudentObj as any).parentName ||
      "Parent / Guardian";
    const parentPhone =
      (selectedStudentObj as any).fatherPhone ||
      (selectedStudentObj as any).phone ||
      "9876543210";
    const parentEmail =
      (selectedStudentObj as any).email || "parent@gmail.com";

    const finalCategory = (pmCategory === "Other" && pmCustomCategory.trim())
      ? (pmCustomCategory.trim() as any)
      : pmCategory;

    const newMsg: ParentCommunicationMessage = {
      id: `PCM-${Date.now().toString().slice(-4)}`,
      studentId: selectedStudentObj.id,
      studentName: `${selectedStudentObj.firstName} ${selectedStudentObj.lastName}`.trim(),
      className: selectedStudentObj.className || "Class 10",
      roomNo: (selectedStudentObj as any).roomNo || "Room 101",
      parentName,
      parentPhone,
      parentEmail,
      category: finalCategory,
      subject: pmSubject,
      message: pmMessage,
      sentDate: new Date().toISOString().split("T")[0],
      sentTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      readStatus: "Unread",
      replyStatus: "No Reply",
    };

    setParentMessages((prev) => [newMsg, ...prev]);
    setIsParentMsgModalOpen(false);
    setPmStudentId("");
    setPmCustomCategory("");
    setPmSubject("");
    setPmMessage("");
    addToast("success", "Message Sent", `Communication sent to ${parentName}.`);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altTitle.trim() || !altDesc.trim()) {
      addToast("warning", "Required Fields", "Please enter Alert Title and Description.");
      return;
    }

    const newAlt: HostelAlertItem = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      alertType: altType,
      title: altTitle,
      description: altDesc,
      hostel: "Main Campus Hostel",
      block: altBlock,
      room: altRoom || "General Area",
      studentName: altStudentName,
      priority: altPriority,
      createdDate: new Date().toISOString().split("T")[0],
      createdTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Active",
    };

    setHostelAlerts((prev) => [newAlt, ...prev]);
    setIsAlertModalOpen(false);
    setAltTitle("");
    setAltDesc("");
    addToast("success", "Hostel Alert Created", "New urgent hostel alert broadcasted.");
  };

  const handleUpdateAlertStatus = (
    alertId: string,
    newStatus: HostelAlertItem["status"]
  ) => {
    setHostelAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
    addToast("info", "Alert Status Updated", `Alert marked as ${newStatus}.`);
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) {
      addToast("warning", "Required Fields", "Please enter Meeting Title.");
      return;
    }

    const newM: WardenMeeting = {
      id: `WMT-${Date.now().toString().slice(-4)}`,
      title: mTitle,
      meetingType: mType,
      hostelBlock: mBlock,
      date: mDate,
      time: mTime,
      venue: mVenue,
      organizer: wardenName,
      participants: mParticipants,
      status: "Scheduled",
    };

    setWardenMeetings((prev) => [newM, ...prev]);
    setIsMeetingModalOpen(false);
    setMTitle("");
    addToast("success", "Meeting Scheduled", "Hostel meeting scheduled successfully.");
  };

  const handleUpdateResponse = (newStatus: HostelRequestItem["status"]) => {
    if (!selectedRequestForDetail) return;
    const updatedDate = new Date().toISOString().split("T")[0];
    setHostelRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequestForDetail.id
          ? {
              ...r,
              status: newStatus,
              wardenResponse: wardenResponseInput || r.wardenResponse,
              updatedDate,
            }
          : r
      )
    );
    setSelectedRequestForDetail(null);
    setWardenResponseInput("");
    addToast("success", "Request Updated", `Request status changed to ${newStatus}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 12. PAGE HEADER & SUBTITLE */}
      <div className="glass-card py-4 px-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Communication Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Hostel communication, parent updates, alerts and requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold text-[11px] border border-sky-200 dark:border-sky-800">
            Role: Hostel Warden
          </span>
        </div>
      </div>

      {/* 7. WARDEN DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Announcements */}
        <div
          onClick={() => setActiveTab("announcements")}
          className={`glass-card p-4.5 rounded-3xl border transition-all cursor-pointer group ${
            activeTab === "announcements"
              ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/40 dark:bg-sky-950/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 group-hover:scale-105 transition-transform">
              <Megaphone className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800">
              Broadcasts
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Announcements
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {announcements.length}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-sky-600 transition-colors">
              Open Tab <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Parent Messages */}
        <div
          onClick={() => setActiveTab("parent-comm")}
          className={`glass-card p-4.5 rounded-3xl border transition-all cursor-pointer group ${
            activeTab === "parent-comm"
              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
              Parents
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Parent Messages
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {parentMessages.length}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Open Tab <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Relevant Meetings */}
        <div
          onClick={() => setActiveTab("meetings")}
          className={`glass-card p-4.5 rounded-3xl border transition-all cursor-pointer group ${
            activeTab === "meetings"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:scale-105 transition-transform">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800">
              Meetings
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Hostel Meetings
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {wardenMeetings.length}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
              Open Tab <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Open Requests */}
        <div
          onClick={() => setActiveTab("requests")}
          className={`glass-card p-4.5 rounded-3xl border transition-all cursor-pointer group ${
            activeTab === "requests"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
              Complaints
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Open Requests
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {openRequestsCount}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
              Open Tab <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 13. WARDEN TAB LAYOUT */}
      <div className="glass-card p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-slate-800">
        {[
          { id: "announcements", label: "Announcements", icon: Megaphone },
          { id: "parent-comm", label: "Parent Communication", icon: MessageSquare },
          { id: "meetings", label: "Meetings & Schedules", icon: Calendar },
          { id: "requests", label: "Requests & Complaints", icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 9. WARDEN MULTI-FILTERS BAR */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, room, title..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>

        {/* Hostel Block */}
        <div>
          <select
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Blocks</option>
            <option value="Ramachandra Bhavan (Block A)">Block A</option>
            <option value="Vivekananda Hostel (Block B)">Block B</option>
            <option value="Saraswati Bhavan (Girls Block)">Girls Block</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Priorities</option>
            <option value="Normal">Normal / Low</option>
            <option value="Medium">Medium</option>
            <option value="Important">Important / High</option>
            <option value="Critical">Critical / Urgent</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Open / Active</option>
            <option value="Pending">Pending / In Progress</option>
            <option value="Resolved">Resolved / Completed</option>
          </select>
        </div>

        {/* Reset Filters */}
        <div className="flex items-center">
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterBlock("All");
              setFilterPriority("All");
              setFilterStatus("All");
            }}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB CONTENT */}

      {/* TAB 1: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-sky-600" /> Hostel Broadcast Announcements
              </h3>
              <p className="text-[10px] text-slate-400">
                Create and publish official announcements for hostel blocks, residents, staff and parents.
              </p>
            </div>
            <button
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 italic text-slate-400">
                No announcements published yet.
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-50 text-sky-700 border border-sky-200">
                          {a.audience}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            a.priority === "Urgent"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : a.priority === "Important"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {a.priority} Priority
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {a.publishDate}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {a.title}
                      </h4>
                    </div>

                    <button
                      onClick={() =>
                        setAnnouncements((prev) => prev.filter((item) => item.id !== a.id))
                      }
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {a.message}
                  </p>

                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Target Block: {a.hostelBlock || "All Hostel Blocks"}</span>
                    <span>Published By: {a.author}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARENT COMMUNICATION */}
      {activeTab === "parent-comm" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" /> Parent Communication Channel
              </h3>
              <p className="text-[10px] text-slate-400">
                Direct parent updates regarding hostel leaves, late return notices, student welfare, and medical alerts.
              </p>
            </div>
            <button
              onClick={() => setIsParentMsgModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> New Message
            </button>
          </div>

          <div className="space-y-3">
            {parentMessages.map((pm) => (
              <div
                key={pm.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {pm.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {pm.sentDate} at {pm.sentTime}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {pm.subject}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                      Student: {pm.studentName} ({pm.className}, {pm.roomNo}) • Parent: {pm.parentName} ({pm.parentPhone})
                    </p>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border ${
                      pm.readStatus === "Read"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {pm.readStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {pm.message}
                </p>

                {pm.replyText && (
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 space-y-1">
                    <p className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase">
                      Parent Reply ({pm.parentName}):
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 italic">
                      "{pm.replyText}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MEETINGS & SCHEDULES */}
      {activeTab === "meetings" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Relevant Warden Meetings & Inspections
              </h3>
              <p className="text-[10px] text-slate-400">
                Scheduled hostel staff briefings, parent meetings, student counselling, and block inspections.
              </p>
            </div>
            <button
              onClick={() => setIsMeetingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule Meeting
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wardenMeetings.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {m.meetingType}
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {m.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Block Target: {m.hostelBlock}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
                  <span>📅 Date: {m.date}</span>
                  <span>⏰ Time: {m.time}</span>
                  <span>📍 Venue: {m.venue}</span>
                  <span>👥 Attendees: {m.participants}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REQUESTS & COMPLAINTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" /> Student & Staff Hostel Complaints
              </h3>
              <p className="text-[10px] text-slate-400">
                Track room maintenance, electrical, water, mess food and leave requests.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {hostelRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {req.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Submitted: {req.submittedDate}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {req.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold">
                      Submitted By: {req.submittedBy} ({req.submitterRole}) • {req.block}, {req.roomNo}
                    </p>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border ${
                      req.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : req.status === "In Progress"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : req.status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {req.description}
                </p>

                {req.wardenResponse && (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 space-y-1">
                    <p className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase">
                      Warden Resolution Note ({req.updatedDate || req.submittedDate}):
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 italic">
                      "{req.wardenResponse}"
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedRequestForDetail(req);
                      setWardenResponseInput(req.wardenResponse || "");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View & Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. RECENT HOSTEL COMMUNICATION FEED TABLE */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Recent Hostel Communication Stream
              </h3>
              <p className="text-[10px] text-slate-400">
                Latest announcements, parent messages, alerts, requests & meetings sorted newest first
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-400">
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Title / Subject</th>
                <th className="py-3 px-3">Target Audience / Room</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentCommunicationsFeed.slice(0, 8).map((item) => {
                const IconComp = item.icon;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-xl font-bold text-[10px] border flex items-center gap-1.5 w-fit ${item.color}`}
                      >
                        <IconComp className="w-3 h-3 shrink-0" />
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                      {item.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium truncate max-w-[200px]">
                      {item.target}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {item.date}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[9px] uppercase border border-slate-200 dark:border-slate-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE ANNOUNCEMENT */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-600" /> New Hostel Announcement
              </h3>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Night Curfew Hours Advisory"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audience Target
                  </label>
                  <select
                    value={annAudience}
                    onChange={(e) =>
                      setAnnAudience(e.target.value as WardenAnnouncement["audience"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="All Hostel Students">All Hostel Students</option>
                    <option value="Specific Hostel Block">Specific Hostel Block</option>
                    <option value="Specific Room">Specific Room</option>
                    <option value="Hostel Staff">Hostel Staff</option>
                    <option value="Parents">Parents</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e) =>
                      setAnnPriority(e.target.value as WardenAnnouncement["priority"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {annAudience === "Specific Hostel Block" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hostel Block
                  </label>
                  <select
                    value={annBlock}
                    onChange={(e) => setAnnBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Ramachandra Bhavan (Block A)">Block A</option>
                    <option value="Vivekananda Hostel (Block B)">Block B</option>
                    <option value="Saraswati Bhavan (Girls Block)">Girls Block</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  required
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Enter announcement details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PARENT COMMUNICATION MESSAGE */}
      {isParentMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> New Parent Communication
              </h3>
              <button
                onClick={() => setIsParentMsgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendParentMessage} className="space-y-3 text-xs">
              {/* Class Filter & Student Search Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Filter by Class
                  </label>
                  <select
                    value={pmClassFilter}
                    onChange={(e) => setPmClassFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="All">All Classes</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Search Student
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={pmStudentSearch}
                      onChange={(e) => setPmStudentSearch(e.target.value)}
                      placeholder="Name, Adm No or Room..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Student Select Dropdown (Residential Only) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student (Residential Only) *
                </label>
                <select
                  required
                  value={pmStudentId}
                  onChange={(e) => setPmStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="">-- Choose Residential Hosteller Student --</option>
                  {filteredResidentialStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.className || "Class 10"}) — Adm: {(s as any).admissionNo || (s as any).admissionNumber || s.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-Identified Residential Student & Guardian Details Card */}
              {selectedStudentObj && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-800/40 pb-2">
                    <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Residential Student & Guardian Info
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100">
                      Residential Hosteller
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Admission Number</span>
                      <span className="font-mono font-bold text-indigo-900 dark:text-indigo-200">
                        {(selectedStudentObj as any).admissionNo || (selectedStudentObj as any).admissionNumber || selectedStudentObj.id}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Parent / Guardian</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {(selectedStudentObj as any).fatherName || (selectedStudentObj as any).motherName || (selectedStudentObj as any).parentName || "Robert Wright"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Hostel Block</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {(selectedStudentObj as any).hostelBlock || (selectedStudentObj as any).block || "Ramachandra Bhavan (Block A)"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Room Number</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {(selectedStudentObj as any).hostelRoom || (selectedStudentObj as any).roomNo || "Room 201"}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Guardian Phone Contact:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {(selectedStudentObj as any).fatherPhone || (selectedStudentObj as any).parentPhone || (selectedStudentObj as any).phone || "9876543210"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={pmCategory}
                    onChange={(e) =>
                      setPmCategory(e.target.value as ParentCommunicationMessage["category"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Hostel Leave">Hostel Leave</option>
                    <option value="Late Return">Late Return</option>
                    <option value="Student Absence">Student Absence</option>
                    <option value="Hostel Discipline">Hostel Discipline</option>
                    <option value="Student Welfare">Student Welfare</option>
                    <option value="Medical Notification">Medical Notification</option>
                    <option value="Important Hostel Notice">Important Hostel Notice</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={pmSubject}
                    onChange={(e) => setPmSubject(e.target.value)}
                    placeholder="Subject title..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              {pmCategory === "Other" && (
                <div className="animate-in fade-in">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specify Custom Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={pmCustomCategory}
                    onChange={(e) => setPmCustomCategory(e.target.value)}
                    placeholder="Enter custom category name (e.g. Special Permission, Gate Pass...)"
                    className="w-full px-3 py-2 rounded-xl bg-indigo-50/50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 font-bold text-indigo-900 dark:text-indigo-200"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={3}
                  required
                  value={pmMessage}
                  onChange={(e) => setPmMessage(e.target.value)}
                  placeholder="Enter message for parent..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsParentMsgModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE HOSTEL ALERT */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Create Hostel Alert
              </h3>
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alert Type *
                  </label>
                  <select
                    value={altType}
                    onChange={(e) =>
                      setAltType(e.target.value as HostelAlertItem["alertType"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="Student Safety">Student Safety</option>
                    <option value="Medical">Medical</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Discipline">Discipline</option>
                    <option value="Late Return">Late Return</option>
                    <option value="Facility Issue">Facility Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority *
                  </label>
                  <select
                    value={altPriority}
                    onChange={(e) =>
                      setAltPriority(e.target.value as HostelAlertItem["priority"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Title *
                </label>
                <input
                  type="text"
                  required
                  value={altTitle}
                  onChange={(e) => setAltTitle(e.target.value)}
                  placeholder="e.g. Water Line Maintenance Issue"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hostel Block
                  </label>
                  <select
                    value={altBlock}
                    onChange={(e) => setAltBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Ramachandra Bhavan (Block A)">Block A</option>
                    <option value="Vivekananda Hostel (Block B)">Block B</option>
                    <option value="Saraswati Bhavan (Girls Block)">Girls Block</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room No / Area
                  </label>
                  <input
                    type="text"
                    value={altRoom}
                    onChange={(e) => setAltRoom(e.target.value)}
                    placeholder="e.g. Room 204 or Restrooms"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={altDesc}
                  onChange={(e) => setAltDesc(e.target.value)}
                  placeholder="Detailed alert description..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold"
                >
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SCHEDULE MEETING */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Schedule Warden Meeting
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleMeeting} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Type
                  </label>
                  <select
                    value={mType}
                    onChange={(e) =>
                      setMType(e.target.value as WardenMeeting["meetingType"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value="Hostel Staff Meeting">Hostel Staff Meeting</option>
                    <option value="Parent Meeting">Parent Meeting</option>
                    <option value="Student Counselling">Student Counselling</option>
                    <option value="Discipline Meeting">Discipline Meeting</option>
                    <option value="Hostel Inspection">Hostel Inspection</option>
                    <option value="Warden Meeting">Warden Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="e.g. Block A Prefects Briefing"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={mTime}
                    onChange={(e) => setMTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue & Attendees
                </label>
                <input
                  type="text"
                  value={mVenue}
                  onChange={(e) => setMVenue(e.target.value)}
                  placeholder="Warden Office"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border mb-2"
                />
                <input
                  type="text"
                  value={mParticipants}
                  onChange={(e) => setMParticipants(e.target.value)}
                  placeholder="Participants list..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW & RESPOND TO REQUEST / COMPLAINT */}
      {selectedRequestForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" /> Request Details & Action
              </h3>
              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-1">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                  <span>Category: {selectedRequestForDetail.category}</span>
                  <span className="font-mono text-[10px]">
                    {selectedRequestForDetail.submittedDate}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {selectedRequestForDetail.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Submitted By: {selectedRequestForDetail.submittedBy} (
                  {selectedRequestForDetail.submitterRole}) • {selectedRequestForDetail.block},{" "}
                  {selectedRequestForDetail.roomNo}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                  "{selectedRequestForDetail.description}"
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Warden Resolution / Response Note
                </label>
                <textarea
                  rows={3}
                  value={wardenResponseInput}
                  onChange={(e) => setWardenResponseInput(e.target.value)}
                  placeholder="Enter response or resolution notes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForDetail(null)}
                  className="px-3.5 py-2 rounded-xl border font-bold text-slate-600"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateResponse("In Progress")}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateResponse("Resolved")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
