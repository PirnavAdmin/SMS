import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Library, BookOpen, Plus, Search, Edit, Trash2, Users, Layers, Bookmark,
  FileText, CheckCircle2, XCircle, AlertTriangle, Clock, RotateCcw,
  ShieldAlert, IndianRupee, Sliders, Printer, Download, ChevronDown,
  RefreshCw, AlertOctagon, FileSpreadsheet, Sparkles, Home, UserCheck, Calendar, CalendarCheck
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../utils/currency';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Pagination } from '../../common/Pagination';
import {
  BookItem, BookIssue, BookCategory, BookAuthor, BookRack, LibraryMember,
  BookReservation, LibraryFineRecord, LostDamagedBook, LibraryRule
} from '../../../types';
import * as LibraryAPI from '../../../api/library';

// Default initial storage keys
const CATEGORIES_KEY = 'edu_db_library_categories';
const AUTHORS_KEY = 'edu_db_library_authors';
const RACKS_KEY = 'edu_db_library_racks';
const MEMBERS_KEY = 'edu_db_library_members';
const RESERVATIONS_KEY = 'edu_db_library_reservations';
const FINES_KEY = 'edu_db_library_fines';
const LOST_DAMAGED_KEY = 'edu_db_library_lost_damaged';
const RULES_KEY = 'edu_db_library_rules';
const LIBRARIAN_ATTENDANCE_KEY = 'edu_db_librarian_attendance';

export interface LibrarianAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  workingHours?: string;
  shift: string;
  status: 'Present' | 'Late' | 'Half Day' | 'On Leave';
  remarks?: string;
}

const DEFAULT_LIBRARIAN_ATTENDANCE: LibrarianAttendanceRecord[] = [
  { id: 'ATT-LIB-101', staffId: 'EMP-LIB-01', staffName: 'Bhanu Prakash', role: 'Librarian', date: '2026-08-20', checkInTime: '08:30 AM', checkOutTime: '05:00 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Catalog audit & inventory completed' },
  { id: 'ATT-LIB-102', staffId: 'EMP-LIB-02', staffName: 'Rachel Green', role: 'Assistant Librarian', date: '2026-08-20', checkInTime: '08:45 AM', checkOutTime: '05:15 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Circulation desk duty' },
  { id: 'ATT-LIB-103', staffId: 'EMP-LIB-01', staffName: 'Bhanu Prakash', role: 'Librarian', date: '2026-08-19', checkInTime: '08:28 AM', checkOutTime: '05:05 PM', workingHours: '8.6 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Book issue renewals' },
  { id: 'ATT-LIB-104', staffId: 'EMP-LIB-02', staffName: 'Rachel Green', role: 'Assistant Librarian', date: '2026-08-19', checkInTime: '09:15 AM', checkOutTime: '05:00 PM', workingHours: '7.75 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Late', remarks: 'Traffic delay' },
  { id: 'ATT-LIB-105', staffId: 'EMP-LIB-01', staffName: 'Bhanu Prakash', role: 'Librarian', date: '2026-08-18', checkInTime: '08:30 AM', checkOutTime: '05:00 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'New book arrivals cataloging' },
  { id: 'ATT-LIB-106', staffId: 'EMP-LIB-02', staffName: 'Rachel Green', role: 'Assistant Librarian', date: '2026-08-18', checkInTime: '08:30 AM', checkOutTime: '05:00 PM', workingHours: '8.5 Hours', shift: 'Morning Shift (08:30 - 17:00)', status: 'Present', remarks: 'Fine collection reconciliation' }
];

// Initial Defaults
const DEFAULT_CATEGORIES: BookCategory[] = [
  { id: 'CAT-1', name: 'Science & Physics', code: 'SCI', description: 'Physics, Chemistry & Biology textbooks', totalBooksCount: 45 },
  { id: 'CAT-2', name: 'Mathematics', code: 'MATH', description: 'Algebra, Geometry & Calculus reference books', totalBooksCount: 30 },
  { id: 'CAT-3', name: 'Computer Science', code: 'CS', description: 'Programming, Data Structures & AI guides', totalBooksCount: 25 },
  { id: 'CAT-4', name: 'Literature & Fiction', code: 'LIT', description: 'Classic & Modern English Literature', totalBooksCount: 40 },
  { id: 'CAT-5', name: 'History & Civics', code: 'HIS', description: 'World History & Indian Constitution', totalBooksCount: 20 },
];

const DEFAULT_AUTHORS: BookAuthor[] = [
  { id: 'ATH-1', name: 'Halliday & Resnick', publisher: 'Wiley India', biography: 'Renowned physicists and educators', booksCount: 15 },
  { id: 'ATH-2', name: 'R.D. Sharma', publisher: 'Dhanpat Rai Publications', biography: 'Prominent Mathematics author', booksCount: 20 },
  { id: 'ATH-3', name: 'E. Balagurusamy', publisher: 'McGraw Hill', biography: 'Computer Science & Programming pioneer', booksCount: 12 },
  { id: 'ATH-4', name: 'William Shakespeare', publisher: 'Penguin Classics', biography: 'English playwright and poet', booksCount: 18 },
];

const DEFAULT_RACKS: BookRack[] = [
  { id: 'RCK-1', rackNo: 'Rack A-01', shelfNo: 'Shelf 1', floor: '1st Floor', section: 'Science Wing', capacity: 50, occupiedCount: 32 },
  { id: 'RCK-2', rackNo: 'Rack A-01', shelfNo: 'Shelf 2', floor: '1st Floor', section: 'Science Wing', capacity: 50, occupiedCount: 18 },
  { id: 'RCK-3', rackNo: 'Rack A-01', shelfNo: 'Shelf 3', floor: '1st Floor', section: 'Science Wing', capacity: 50, occupiedCount: 10 },
  { id: 'RCK-4', rackNo: 'Rack B-02', shelfNo: 'Shelf 1', floor: '1st Floor', section: 'Maths Wing', capacity: 40, occupiedCount: 25 },
  { id: 'RCK-5', rackNo: 'Rack B-02', shelfNo: 'Shelf 2', floor: '1st Floor', section: 'Maths Wing', capacity: 40, occupiedCount: 15 },
  { id: 'RCK-6', rackNo: 'Rack C-03', shelfNo: 'Shelf 1', floor: '2nd Floor', section: 'CS & Tech Lab', capacity: 45, occupiedCount: 20 },
  { id: 'RCK-7', rackNo: 'Rack C-03', shelfNo: 'Shelf 2', floor: '2nd Floor', section: 'CS & Tech Lab', capacity: 45, occupiedCount: 8 },
  { id: 'RCK-8', rackNo: 'Rack D-04', shelfNo: 'Shelf 1', floor: '2nd Floor', section: 'Literature Section', capacity: 60, occupiedCount: 40 },
  { id: 'RCK-9', rackNo: 'Rack D-04', shelfNo: 'Shelf 2', floor: '2nd Floor', section: 'Literature Section', capacity: 60, occupiedCount: 22 },
];

const DEFAULT_RULES: LibraryRule[] = [
  { id: 'RUL-1', userRole: 'Student', maxBooks: 3, issueDurationDays: 14, dailyFineRate: 5, maxRenewals: 2 },
  { id: 'RUL-2', userRole: 'Staff', maxBooks: 6, issueDurationDays: 30, dailyFineRate: 2, maxRenewals: 3 },
];

interface LibraryViewProps {
  initialPhase?: 'phase1' | 'phase2' | 'phase3' | 'phase4';
  initialTab?: string;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ initialPhase = 'phase1', initialTab = 'dashboard' }) => {
  const { role, user } = useAuth();
  const isAdmin = (role || '').toLowerCase().includes('admin');
  const isLibrarian = (role || '').toLowerCase().includes('librarian');
  // Main Admin is View-Only; ONLY Librarian / Library Admin has management & edit authority
  const canManageLibrary = isLibrarian;
  const isReadOnlyAccess = !canManageLibrary;

  const { books, bookIssues, addBook, deleteBook, issueBook, returnBook, students, staff, admissions } = useData();
  const { addToast } = useToast();

  // Unified candidate list from Enrolled Students and Admission Applications
  const studentAdmissionCandidates = useMemo(() => {
    const list: Array<{ id: string; name: string; admissionNo: string; phone: string; className: string; role: 'Student' }> = [];

    // Add enrolled students
    (students || []).forEach(st => {
      const name = `${st.firstName} ${st.lastName}`.trim();
      list.push({
        id: st.id,
        name: name,
        admissionNo: st.admissionNo || st.id,
        phone: st.phone || st.fatherPhone || '',
        className: `${st.className || ''}-${st.section || ''}`.replace(/^-$/, 'General'),
        role: 'Student'
      });
    });

    // Add admission application records
    (admissions || []).forEach(adm => {
      const name = (adm.applicantName || `${adm.firstName || ''} ${adm.lastName || ''}`).trim();
      const admNo = adm.admissionNo || adm.applicationNo || adm.id;
      if (name && !list.some(item => item.admissionNo === admNo || item.name.toLowerCase() === name.toLowerCase())) {
        list.push({
          id: adm.id,
          name: name,
          admissionNo: admNo,
          phone: adm.phone || adm.parentPhone || '',
          className: adm.appliedClass || 'Admission Candidate',
          role: 'Student'
        });
      }
    });

    return list;
  }, [students, admissions]);

  const staffCandidates = useMemo(() => {
    return (staff || []).map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      admissionNo: s.id,
      phone: s.phone || '',
      className: s.department || 'Staff',
      role: 'Staff' as const
    }));
  }, [staff]);

  // Member Form State for Auto-fill & Search
  const [memberFormState, setMemberFormState] = useState({
    memberId: '',
    name: '',
    role: 'Student' as 'Student' | 'Staff',
    phone: '',
    maxLimit: 3
  });
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);

  // Book Form State for Add / Edit
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: 'Science & Physics',
    isbn: '',
    totalCopies: 10,
    rackNo: 'Rack A-01 (Shelf 1)'
  });

  const filteredMemberSuggestions = useMemo(() => {
    if (!memberFormState.name || memberFormState.name.trim().length < 1) return [];
    const q = memberFormState.name.toLowerCase().trim();
    const source = memberFormState.role === 'Staff' ? staffCandidates : studentAdmissionCandidates;
    return source.filter(c => c.name.toLowerCase().includes(q) || c.admissionNo.toLowerCase().includes(q)).slice(0, 8);
  }, [memberFormState.name, memberFormState.role, staffCandidates, studentAdmissionCandidates]);

  const handleSelectCandidateToForm = (c: { name: string; admissionNo: string; phone: string; role: 'Student' | 'Staff' }) => {
    setMemberFormState({
      memberId: c.admissionNo,
      name: c.name,
      role: c.role,
      phone: c.phone || '9876543210',
      maxLimit: c.role === 'Staff' ? 6 : 3
    });
    setShowMemberSuggestions(false);
  };

  // Active Phase & Sub-tab Navigation
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2' | 'phase3' | 'phase4'>(initialPhase);
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);
  const [issueMode, setIssueMode] = useState<'catalog' | 'manual'>('catalog');

  useEffect(() => {
    if (initialPhase) setActivePhase(initialPhase);
    if (initialTab) setActiveSubTab(initialTab);
  }, [initialPhase, initialTab]);

  // Search & Filter & Pagination state across views
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);

  // Local Storage Dynamic States
  const [categories, setCategories] = useState<BookCategory[]>(() => {
    const s = localStorage.getItem(CATEGORIES_KEY);
    return s ? JSON.parse(s) : DEFAULT_CATEGORIES;
  });

  const [authors, setAuthors] = useState<BookAuthor[]>(() => {
    const s = localStorage.getItem(AUTHORS_KEY);
    return s ? JSON.parse(s) : DEFAULT_AUTHORS;
  });

  const [racks, setRacks] = useState<BookRack[]>(() => {
    const s = localStorage.getItem(RACKS_KEY);
    return s ? JSON.parse(s) : DEFAULT_RACKS;
  });

  const [members, setMembers] = useState<LibraryMember[]>(() => {
    const s = localStorage.getItem(MEMBERS_KEY);
    if (s) return JSON.parse(s);
    // Seed initial members from students/staff if empty
    const stMembers: LibraryMember[] = (students || []).slice(0, 10).map((st, i) => ({
      id: `MEM-STU-${st.id || i}`,
      memberId: st.admissionNo || `LIB-STU-${100 + i}`,
      name: `${st.firstName} ${st.lastName}`,
      role: 'Student',
      email: st.email || 'student@school.edu',
      phone: st.phone || '9876543210',
      className: `${st.className || 'Class 10'}-${st.section || 'A'}`,
      maxLimit: 3,
      issuedCount: i % 2 === 0 ? 1 : 0,
      fineBalance: i === 1 ? 50 : 0,
      joinedDate: '2026-06-01',
      status: 'Active'
    }));
    return stMembers;
  });

  // Dynamic Library Members merged from DataContext students & staff + local custom members
  const mergedMembersList = useMemo(() => {
    const map = new Map<string, LibraryMember>();

    // 1. Add all staff (Teachers, Admins, Librarians, Non-teaching staff)
    (staff || []).forEach(s => {
      const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member';
      const memId = s.empId || s.id;
      map.set(memId, {
        id: `MEM-STF-${s.id}`,
        memberId: memId,
        name,
        role: (s.employeeCategory === 'Teacher' || (s.designation || '').toLowerCase().includes('teacher')) ? 'Teacher' : 'Staff',
        email: s.email || `${(s.firstName || 'staff').toLowerCase()}@school.edu`,
        phone: s.phone || '9876543210',
        className: s.department || s.designation || 'Staff',
        maxLimit: 6,
        issuedCount: (bookIssues || []).filter(bi => bi.borrowerId === memId && (bi.status === 'Issued' || bi.status === 'Overdue')).length,
        fineBalance: 0,
        joinedDate: s.joiningDate || '2026-06-01',
        status: 'Active'
      });
    });

    // 2. Add all enrolled students
    (students || []).forEach(st => {
      const name = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
      const memId = st.admissionNo || st.rollNo || st.id;
      map.set(memId, {
        id: `MEM-STU-${st.id}`,
        memberId: memId,
        name,
        role: 'Student',
        email: st.email || `${(st.firstName || 'student').toLowerCase()}@school.edu`,
        phone: st.phone || st.fatherPhone || '9876543210',
        className: `${st.className || 'Class 10'}-${st.section || 'A'}`,
        maxLimit: 3,
        issuedCount: (bookIssues || []).filter(bi => bi.borrowerId === memId && (bi.status === 'Issued' || bi.status === 'Overdue')).length,
        fineBalance: 0,
        joinedDate: st.joiningDate || '2026-06-01',
        status: 'Active'
      });
    });

    // 3. Add saved custom members from local state
    (members || []).forEach(m => {
      if (!map.has(m.memberId)) {
        map.set(m.memberId, m);
      } else {
        const existing = map.get(m.memberId)!;
        map.set(m.memberId, {
          ...existing,
          fineBalance: m.fineBalance || existing.fineBalance,
          status: m.status || existing.status
        });
      }
    });

    return Array.from(map.values());
  }, [staff, students, members, bookIssues]);

  const [reservations, setReservations] = useState<BookReservation[]>(() => {
    const s = localStorage.getItem(RESERVATIONS_KEY);
    return s ? JSON.parse(s) : [
      { id: 'RES-101', bookId: 'BK-01', bookTitle: 'Fundamentals of Physics', memberId: 'ADM2024-001', memberName: 'Alexander Wright', memberRole: 'Student', requestDate: '2026-08-14', status: 'Pending' },
      { id: 'RES-102', bookId: 'BK-03', bookTitle: 'Computer Science Principles & AI', memberId: 'EMP001', memberName: 'Sarah Jenkins', memberRole: 'Teacher', requestDate: '2026-08-18', status: 'Pending' }
    ];
  });

  const [fineRecords, setFineRecords] = useState<LibraryFineRecord[]>(() => {
    const s = localStorage.getItem(FINES_KEY);
    return s ? JSON.parse(s) : [
      { id: 'FIN-101', issueId: 'ISS-501', memberId: 'ADM2024-001', memberName: 'Alexander Wright', memberRole: 'Student', bookTitle: 'Fundamentals of Physics', overdueDays: 5, fineAmount: 25, paidAmount: 25, paymentStatus: 'Paid', createdDate: '2026-08-10', paidDate: '2026-08-12', remarks: 'Late return fine paid at counter' },
      { id: 'FIN-102', issueId: 'ISS-503', memberId: 'ADM2024-002', memberName: 'Emily Davis', memberRole: 'Student', bookTitle: 'Computer Science Principles & AI', overdueDays: 10, fineAmount: 50, paidAmount: 0, paymentStatus: 'Unpaid', createdDate: '2026-08-16', remarks: 'Pending overdue fine' }
    ];
  });

  const [lostDamagedList, setLostDamagedList] = useState<LostDamagedBook[]>(() => {
    const s = localStorage.getItem(LOST_DAMAGED_KEY);
    return s ? JSON.parse(s) : [
      { id: 'LD-101', bookId: 'BK-01', bookTitle: 'Fundamentals of Physics', memberId: 'ADM2024-003', memberName: 'James Brown', memberRole: 'Student', issueType: 'Damaged', fineAmount: 100, replacementCost: 450, reportDate: '2026-08-11', status: 'Pending', notes: 'Torn back cover page' }
    ];
  });

  const [rules, setRules] = useState<LibraryRule[]>(() => {
    const s = localStorage.getItem(RULES_KEY);
    return s ? JSON.parse(s) : DEFAULT_RULES;
  });

  const [librarianAttendance, setLibrarianAttendance] = useState<LibrarianAttendanceRecord[]>(() => {
    const s = localStorage.getItem(LIBRARIAN_ATTENDANCE_KEY);
    return s ? JSON.parse(s) : DEFAULT_LIBRARIAN_ATTENDANCE;
  });

  const [attendanceViewMode, setAttendanceViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState<string>('2026-08');

  // Sync helpers to localStorage & trigger Finance Module Integration event
  const saveCategories = (data: BookCategory[]) => { setCategories(data); localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data)); };
  const saveAuthors = (data: BookAuthor[]) => { setAuthors(data); localStorage.setItem(AUTHORS_KEY, JSON.stringify(data)); };
  const saveRacks = (data: BookRack[]) => { setRacks(data); localStorage.setItem(RACKS_KEY, JSON.stringify(data)); };
  const saveMembers = (data: LibraryMember[]) => { setMembers(data); localStorage.setItem(MEMBERS_KEY, JSON.stringify(data)); };
  const saveReservations = (data: BookReservation[]) => { setReservations(data); localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(data)); };
  const saveLibrarianAttendance = (data: LibrarianAttendanceRecord[]) => {
    setLibrarianAttendance(data);
    localStorage.setItem(LIBRARIAN_ATTENDANCE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('librarian_attendance_updated'));
    }
  };
  const saveFines = (data: LibraryFineRecord[]) => {
    setFineRecords(data);
    localStorage.setItem(FINES_KEY, JSON.stringify(data));
    // Broadcast event for Finance & Fees module integration
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('library_fines_updated'));
    }
  };
  const saveLostDamaged = (data: LostDamagedBook[]) => { setLostDamagedList(data); localStorage.setItem(LOST_DAMAGED_KEY, JSON.stringify(data)); };
  const saveRules = (data: LibraryRule[]) => { setRules(data); localStorage.setItem(RULES_KEY, JSON.stringify(data)); };

  // Modals & Deletion visibility states
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string; title: string } | null>(null);

  const handleOpenAddOrEditBook = (bookToEdit?: BookItem) => {
    if (bookToEdit) {
      setModalData(bookToEdit);
      setBookForm({
        title: bookToEdit.title || '',
        author: bookToEdit.author || '',
        category: bookToEdit.category || (categories[0]?.name || 'Science & Physics'),
        isbn: bookToEdit.isbn || '',
        totalCopies: bookToEdit.totalCopies || 1,
        rackNo: bookToEdit.rackNo || (racks[0] ? `${racks[0].rackNo} (${racks[0].shelfNo})` : 'Rack A-01 (Shelf 1)')
      });
      setModalType('editBook');
    } else {
      setModalData(null);
      setBookForm({
        title: '',
        author: '',
        category: categories[0]?.name || 'Science & Physics',
        isbn: '978-0134' + Math.floor(100000 + Math.random() * 900000),
        totalCopies: 10,
        rackNo: racks[0] ? `${racks[0].rackNo} (${racks[0].shelfNo})` : 'Rack A-01 (Shelf 1)'
      });
      setModalType('addBook');
    }
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    const { type, id, title } = deletingItem;

    if (type === 'book') {
      deleteBook(id);
      addToast('success', 'Book Deleted', `Removed "${title}" from library catalog.`);
    } else if (type === 'category') {
      saveCategories(categories.filter(c => c.id !== id));
      addToast('success', 'Category Deleted', `Removed category "${title}"`);
    } else if (type === 'author') {
      saveAuthors(authors.filter(a => a.id !== id));
      addToast('success', 'Author Deleted', `Removed author "${title}"`);
    } else if (type === 'rack') {
      saveRacks(racks.filter(r => r.id !== id));
      addToast('success', 'Rack Location Deleted', `Removed rack location "${title}"`);
    } else if (type === 'member') {
      saveMembers(members.filter(m => m.id !== id && m.memberId !== id));
      addToast('success', 'Member Removed', `Removed library member "${title}"`);
    } else if (type === 'reservation') {
      saveReservations(reservations.filter(r => r.id !== id));
      addToast('success', 'Reservation Cancelled', `Removed reservation for "${title}"`);
    } else if (type === 'fine') {
      saveFines(fineRecords.filter(f => f.id !== id));
      addToast('success', 'Fine Record Removed', `Removed fine record for "${title}"`);
    } else if (type === 'lostDamaged') {
      saveLostDamaged(lostDamagedList.filter(ld => ld.id !== id));
      addToast('success', 'Report Removed', `Removed report for "${title}"`);
    }
    setDeletingItem(null);
  };

  // Quick Stats for Dashboard
  const totalBooksCount = useMemo(() => books.reduce((acc, b) => acc + (b.totalCopies || 0), 0), [books]);
  const availableCopiesCount = useMemo(() => books.reduce((acc, b) => acc + (b.availableCopies || 0), 0), [books]);
  const issuedBooksCount = useMemo(() => bookIssues.filter(i => i.status === 'Issued' || i.status === 'Renewed').length, [bookIssues]);
  const overdueCount = useMemo(() => bookIssues.filter(i => i.status === 'Overdue').length, [bookIssues]);
  const totalFinesCollected = useMemo(() => fineRecords.filter(f => f.paymentStatus === 'Paid').reduce((acc, f) => acc + (f.fineAmount || 0), 0), [fineRecords]);
  const pendingFinesTotal = useMemo(() => fineRecords.filter(f => f.paymentStatus === 'Unpaid').reduce((acc, f) => acc + (f.fineAmount || 0), 0), [fineRecords]);

  // Handle Tab Switch
  const switchTab = (phase: 'phase1' | 'phase2' | 'phase3' | 'phase4', tab: string) => {
    setActivePhase(phase);
    setActiveSubTab(tab);
    setSearchQuery('');
    setFilterCategory('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus]);

  // Navigation tabs structure definition
  const navigationStructure = [
    {
      phaseId: 'phase1',
      title: 'Core & Masters',
      tabs: [
        { id: 'dashboard', label: 'Library Dashboard', icon: Library },
        { id: 'books', label: 'Books Catalog', icon: BookOpen },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'authors', label: 'Authors', icon: Users },
        { id: 'racks', label: 'Racks & Shelves', icon: Bookmark },
        { id: 'members', label: 'Library Members', icon: UserCheck }
      ]
    },
    {
      phaseId: 'phase2',
      title: 'Circulation Desk',
      tabs: [
        { id: 'issue', label: 'Issue Book', icon: Plus },
        { id: 'return', label: 'Return Book', icon: RotateCcw },
        { id: 'renewal', label: 'Renewal', icon: RefreshCw },
        { id: 'reservations', label: 'Reservations', icon: Clock }
      ]
    },
    {
      phaseId: 'phase3',
      title: 'Fines & Management',
      tabs: [
        { id: 'fines', label: 'Fines Management', icon: IndianRupee },
        { id: 'lost-damaged', label: 'Lost / Damaged Books', icon: AlertTriangle },
        { id: 'rules', label: 'Library Rules', icon: Sliders }
      ]
    },
    {
      phaseId: 'phase4',
      title: 'Reports & Analytics',
      tabs: [
        { id: 'book-reports', label: 'Book Reports', icon: FileText },
        { id: 'issue-reports', label: 'Issue / Return Reports', icon: FileSpreadsheet },
        { id: 'overdue-reports', label: 'Overdue Reports', icon: ShieldAlert },
        { id: 'fine-reports', label: 'Fine Reports', icon: Printer }
      ]
    }
  ] as const;

  // Render Core Setup: Phase 1 Components
  const renderPhase1 = () => {
    if (activeSubTab === 'dashboard') {
      return (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Total Books</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalBooksCount}</p>
              <span className="text-[10px] text-sky-600 font-bold">In Catalog</span>
            </div>

            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Available</span>
              <p className="text-2xl font-black text-emerald-600 font-mono">{availableCopiesCount}</p>
              <span className="text-[10px] text-slate-400 font-semibold">On Shelves</span>
            </div>

            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-sky-600">Active Issues</span>
              <p className="text-2xl font-black text-sky-600 font-mono">{issuedBooksCount}</p>
              <span className="text-[10px] text-sky-600 font-semibold">Borrowed</span>
            </div>

            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-rose-600">Overdue</span>
              <p className="text-2xl font-black text-rose-600 font-mono">{overdueCount}</p>
              <span className="text-[10px] text-rose-500 font-semibold">Late Returns</span>
            </div>

            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-purple-600">Active Members</span>
              <p className="text-2xl font-black text-purple-600 font-mono">{mergedMembersList.length}</p>
              <span className="text-[10px] text-purple-500 font-semibold">Students & Staff</span>
            </div>

            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Fines Collected</span>
              <p className="text-lg font-black text-emerald-600 font-mono">{formatCurrency(totalFinesCollected)}</p>
              <span className="text-[10px] text-amber-500 font-bold">Pending: {formatCurrency(pendingFinesTotal)}</span>
            </div>
          </div>

          {/* Operational Quick Actions Banner - Shown ONLY in Librarian Panel */}
          {!isReadOnlyAccess && (
            <div className="glass-card p-5 rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" /> Library Operations Hub
                </h3>
                <p className="text-xs text-sky-100 font-medium">Issue books, return active loans, manage member fines, and run book audits.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button onClick={() => switchTab('phase2', 'issue')} className="px-4 py-2 rounded-xl bg-white text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all shadow-md flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Issue Book
                </button>
                <button onClick={() => switchTab('phase2', 'return')} className="px-4 py-2 rounded-xl bg-sky-950/40 text-white font-extrabold text-xs border border-white/30 hover:bg-sky-900/60 transition-all flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Return Book
                </button>
                <button onClick={() => switchTab('phase3', 'fines')} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-extrabold text-xs hover:bg-emerald-400 transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
                  <IndianRupee className="w-4 h-4" /> Manage Fines
                </button>
              </div>
            </div>
          )}

          {/* Quick Overview Grid: Categories & Recent Issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-500" /> Book Categories Breakdown
                </h4>
                <button onClick={() => switchTab('phase1', 'categories')} className="text-[11px] font-bold text-sky-600 hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name} ({cat.code})</span>
                    <span className="font-mono font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                      {books.filter(b => b.category === cat.name).reduce((acc, b) => acc + (b.totalCopies || 0), 0) || cat.totalBooksCount || 0} Copies
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Recent Book Transactions
                </h4>
                <button onClick={() => switchTab('phase4', 'issue-reports')} className="text-[11px] font-bold text-sky-600 hover:underline">View Audit Log</button>
              </div>
              <div className="space-y-2">
                {bookIssues.slice(0, 4).map(iss => (
                  <div key={iss.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{iss.bookTitle}</p>
                      <p className="text-[10px] text-slate-400">Borrower: {iss.borrowerName} ({iss.borrowerRole})</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      iss.status === 'Issued' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                      iss.status === 'Overdue' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {iss.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSubTab === 'books') {
      const filteredBooks = books.filter(b =>
        (!searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase()) || b.isbn.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!filterCategory || b.category === filterCategory)
      );

      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search title, author, ISBN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-medium outline-none" />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            {!isReadOnlyAccess && (
              <button onClick={() => handleOpenAddOrEditBook()} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add New Book
              </button>
            )}
          </div>

          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">ISBN</th>
                    <th className="py-3.5 px-4">BOOK TITLE</th>
                    <th className="py-3.5 px-4">AUTHOR</th>
                    <th className="py-3.5 px-4">CATEGORY</th>
                    <th className="py-3.5 px-4">RACK / LOCATION</th>
                    <th className="py-3.5 px-4 text-center">TOTAL COPIES</th>
                    <th className="py-3.5 px-4 text-center">AVAILABLE</th>
                    <th className="py-3.5 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{b.isbn}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white leading-snug">{b.title}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{b.author}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold text-[10px] border border-sky-100 dark:border-sky-900/40">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {b.rackNo || 'Rack A-01 (Shelf 1)'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-900 dark:text-white">{b.totalCopies}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-[11px] ${b.availableCopies > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'}`}>
                          {b.availableCopies} / {b.totalCopies}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!isReadOnlyAccess ? (
                          <>
                            <button onClick={() => { switchTab('phase2', 'issue'); }} className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] shadow-xs transition-all cursor-pointer">
                              Issue
                            </button>
                            <button onClick={() => handleOpenAddOrEditBook(b)} className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-all cursor-pointer" title="Edit Book">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeletingItem({ type: 'book', id: b.id, title: b.title })} className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-all cursor-pointer" title="Delete Book">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredBooks.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="books"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSubTab === 'categories') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4 text-sky-500" /> Book Categories Master</h3>
            {!isReadOnlyAccess && (
              <button onClick={() => setModalType('addCategory')} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => (
              <div key={c.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 font-mono font-black text-xs">{c.code}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{c.totalBooksCount || 0} Books</span>
                    {!isReadOnlyAccess && (
                      <button onClick={() => setDeletingItem({ type: 'category', id: c.id, title: c.name })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{c.name}</h4>
                <p className="text-xs text-slate-500 font-medium">{c.description}</p>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={categories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            label="categories"
          />
        </div>
      );
    }

    if (activeSubTab === 'authors') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-sky-500" /> Authors Directory</h3>
            {!isReadOnlyAccess && (
              <button onClick={() => setModalType('addAuthor')} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add Author
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {authors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(a => (
              <div key={a.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{a.name}</h4>
                  {!isReadOnlyAccess && (
                    <button onClick={() => setDeletingItem({ type: 'author', id: a.id, title: a.name })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">Publisher: {a.publisher}</p>
                <p className="text-[11px] text-slate-500">{a.biography || 'Educational Author'}</p>
                <div className="pt-2 border-t text-[11px] font-bold text-slate-400">{a.booksCount || 10} Titles Published</div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={authors.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            label="authors"
          />
        </div>
      );
    }

    if (activeSubTab === 'racks') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Bookmark className="w-4 h-4 text-sky-500" /> Racks & Shelves Location Mapping</h3>
            {!isReadOnlyAccess && (
              <button onClick={() => setModalType('addRack')} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Add Rack Location
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {racks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r => {
              const matchedBooks = books.filter(b => (b.rackNo || '').toLowerCase().includes(r.rackNo.toLowerCase()) || (r.rackNo || '').toLowerCase().includes((b.rackNo || '').toLowerCase()));
              const totalOnShelf = matchedBooks.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
              const availableOnShelf = matchedBooks.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
              const issuedFromShelf = Math.max(0, totalOnShelf - availableOnShelf);
              const occupancyPct = totalOnShelf > 0 ? Math.round((availableOnShelf / totalOnShelf) * 100) : 100;

              return (
                <div key={r.id} className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sky-600 text-sm">{r.rackNo}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">{r.shelfNo}</span>
                      {!isReadOnlyAccess && (
                        <button onClick={() => setDeletingItem({ type: 'rack', id: r.id, title: `${r.rackNo} (${r.shelfNo})` })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{r.section}</p>
                  <p className="text-[11px] text-slate-400">{r.floor}</p>

                  <div className="space-y-1.5 pt-2 border-t text-[11px] font-bold">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Shelf Capacity:</span>
                      <span className="font-mono">{r.capacity} Books</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>On Shelf (Available):</span>
                      <span className="font-mono font-black">{availableOnShelf} Copies</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                      <span>Issued Out (Borrowed):</span>
                      <span className="font-mono font-black">{issuedFromShelf} Copies</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1 flex">
                      <div style={{ width: `${occupancyPct}%` }} className="bg-emerald-500 h-full" title={`${availableOnShelf} Available on shelf`} />
                      <div style={{ width: `${100 - occupancyPct}%` }} className="bg-amber-500 h-full" title={`${issuedFromShelf} Issued out`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={racks.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            label="locations"
          />
        </div>
      );
    }

    if (activeSubTab === 'members') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><UserCheck className="w-4 h-4 text-sky-500" /> Library Membership Roster</h3>
            {!isReadOnlyAccess && (
              <button onClick={() => { setMemberFormState({ memberId: '', name: '', role: 'Student', phone: '', maxLimit: 3 }); setModalType('addMember'); }} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Register Member
              </button>
            )}
          </div>
          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">MEMBER ID</th>
                  <th className="py-3 px-4">MEMBER NAME</th>
                  <th className="py-3 px-4">ROLE</th>
                  <th className="py-3 px-4">CLASS / DEPT</th>
                  <th className="py-3 px-4 text-center">MAX LIMIT</th>
                  <th className="py-3 px-4 text-center">ISSUED</th>
                  <th className="py-3 px-4 text-right">FINE DUE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mergedMembersList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{m.memberId}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{m.name}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold text-[10px]">{m.role}</span></td>
                    <td className="py-3 px-4 font-medium text-slate-600">{m.className || m.department || 'Main'}</td>
                    <td className="py-3 px-4 text-center font-mono font-extrabold">{m.maxLimit} Books</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sky-600">{m.issuedCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{formatCurrency(m.fineBalance || 0)}</td>
                    <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">{m.status}</span></td>
                    <td className="py-3 px-4 text-right">
                      {!isReadOnlyAccess ? (
                        <button onClick={() => setDeletingItem({ type: 'member', id: m.id, title: m.name })} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={mergedMembersList.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="members"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Main Operations: Phase 2 Components
  const renderPhase2 = () => {
    if (activeSubTab === 'issue') {
      if (isReadOnlyAccess) {
        return (
          <div className="max-w-2xl mx-auto glass-card p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 animate-in fade-in shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Book Issuance Restricted (Read-Only Mode)</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Book issuance dispatch is managed by the Librarian. Admin mode has View-Only access to all library logs, books, and reports.
            </p>
          </div>
        );
      }

      return (
        <div className="max-w-2xl mx-auto glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-lg space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3.5">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" /> Issue Book to Student / Staff
            </h3>
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIssueMode('catalog')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  issueMode === 'catalog' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Catalog Dropdown
              </button>
              <button
                type="button"
                onClick={() => setIssueMode('manual')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  issueMode === 'manual' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as any;
            const dDate = form.dueDate.value;

            if (issueMode === 'catalog') {
              const bId = form.bookId.value;
              const mId = form.memberId.value;

              const targetBk = books.find(b => String(b.id) === String(bId) || String(b.isbn) === String(bId) || b.title === bId);
              const targetMem = mergedMembersList.find(m => String(m.memberId) === String(mId) || String(m.id) === String(mId)) || { name: mId, role: 'Student' };

              if (!targetBk) {
                addToast('error', 'Book Not Found', 'Selected book was not found in library catalog.');
                return;
              }

              if (targetBk.availableCopies <= 0) {
                addToast('error', 'Book Unavailable', `"${targetBk.title}" is out of stock (0 copies available).`);
                return;
              }

              issueBook({
                bookId: targetBk.id,
                bookTitle: targetBk.title,
                borrowerId: mId,
                borrowerName: targetMem.name,
                borrowerRole: targetMem.role as any,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: dDate,
                fineAmount: 0,
                status: 'Issued'
              });
              addToast('success', 'Book Issued Successfully', `Issued "${targetBk.title}" to ${targetMem.name}`);
            } else {
              // Manual Entry Mode
              const manualMemId = form.manualMemberId.value;
              const manualMemName = form.manualMemberName.value;
              const manualMemRole = form.manualMemberRole.value;
              const manualBookTitle = form.manualBookTitle.value;

              const matchedBk = books.find(b => b.title.toLowerCase() === manualBookTitle.toLowerCase() || String(b.id) === manualBookTitle);
              const bookIdToUse = matchedBk ? matchedBk.id : `BK-MAN-${Date.now()}`;

              issueBook({
                bookId: bookIdToUse,
                bookTitle: manualBookTitle,
                borrowerId: manualMemId,
                borrowerName: manualMemName,
                borrowerRole: manualMemRole as any,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: dDate,
                fineAmount: 0,
                status: 'Issued'
              });
              addToast('success', 'Book Issued (Manual Entry)', `Issued "${manualBookTitle}" to ${manualMemName} (${manualMemId})`);
            }

            switchTab('phase1', 'dashboard');
          }} className="space-y-4 text-xs">
            {issueMode === 'catalog' ? (
              <>
                <div>
                  <label className="block font-bold mb-1">Select Member (Student / Staff) *</label>
                  <select name="memberId" required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="">Select Member...</option>
                    {mergedMembersList.map(m => (
                      <option key={m.id} value={m.memberId}>{m.name} ({m.memberId} - {m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Select Book from Catalog *</label>
                  <select name="bookId" required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                    <option value="">Select Book...</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                        {b.title} (Author: {b.author} • Available: {b.availableCopies}/{b.totalCopies})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold space-y-1">
                  <p className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Manual Issue Mode Enabled</p>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Type custom borrower details and book accession details directly if not selecting from predefined dropdowns.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Member ID / Admission No *</label>
                    <input type="text" name="manualMemberId" placeholder="e.g. ADM2024-001" required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Member Full Name *</label>
                    <input type="text" name="manualMemberName" placeholder="e.g. Alexander Wright" required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Borrower Role *</label>
                    <select name="manualMemberRole" required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold">
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Book Title / Accession Code *</label>
                    <input type="text" name="manualBookTitle" placeholder="e.g. Fundamentals of Physics" required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Author / ISBN (Optional)</label>
                    <input type="text" name="manualBookAuthor" placeholder="e.g. Halliday & Resnick" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium" />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold mb-1">Issue Date</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} readOnly className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono font-bold" />
              </div>
              <div>
                <label className="block font-bold mb-1">Due Date *</label>
                <input type="date" name="dueDate" defaultValue={new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]} required className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-500/20 cursor-pointer transition-all">
              Confirm & Dispatch Book Issue
            </button>
          </form>
        </div>
      );
    }

    if (activeSubTab === 'return') {
      const activeIssues = bookIssues.filter(i => i.status === 'Issued' || i.status === 'Overdue' || i.status === 'Renewed');

      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><RotateCcw className="w-4 h-4 text-emerald-500" /> Return Book Processing</h3>
            <span className="text-xs font-bold text-slate-400">{activeIssues.length} Active Loans</span>
          </div>

          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">ISSUE ID</th>
                  <th className="py-3 px-4">BOOK TITLE</th>
                  <th className="py-3 px-4">BORROWER</th>
                  <th className="py-3 px-4">ISSUE DATE</th>
                  <th className="py-3 px-4">DUE DATE</th>
                  <th className="py-3 px-4 text-center">FINE CALCULATED</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(iss => {
                  const isOverdue = new Date(iss.dueDate) < new Date();
                  const lateDays = isOverdue ? Math.max(1, Math.floor((Date.now() - new Date(iss.dueDate).getTime()) / 86400000)) : 0;
                  const ruleForRole = rules.find(r => r.userRole.toLowerCase() === (iss.borrowerRole || 'Student').toLowerCase()) || rules[0];
                  const dailyRate = ruleForRole ? ruleForRole.dailyFineRate : 5;
                  const calculatedFine = lateDays * dailyRate;

                  return (
                    <tr key={iss.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{iss.id}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{iss.bookTitle}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{iss.borrowerName} ({iss.borrowerRole})</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{iss.issueDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{iss.dueDate}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-rose-600">
                        {calculatedFine > 0 ? formatCurrency(calculatedFine) : '₹0 (On Time)'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isReadOnlyAccess ? (
                          <button onClick={() => {
                            returnBook(iss.id);
                            if (calculatedFine > 0) {
                              const newFine: LibraryFineRecord = {
                                id: `FIN-${Date.now()}`,
                                issueId: iss.id,
                                memberId: iss.borrowerId,
                                memberName: iss.borrowerName,
                                memberRole: iss.borrowerRole,
                                bookTitle: iss.bookTitle,
                                overdueDays: lateDays,
                                fineAmount: calculatedFine,
                                paymentStatus: 'Unpaid',
                                createdDate: new Date().toISOString().split('T')[0],
                                remarks: `Late return fine for ${lateDays} days`
                              };
                              saveFines([newFine, ...fineRecords]);
                            }
                            addToast('success', 'Book Returned', `Marked "${iss.bookTitle}" as returned.${calculatedFine > 0 ? ` Overdue fine of ${formatCurrency(calculatedFine)} added.` : ''}`);
                          }} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-[11px] hover:bg-emerald-500 transition-all shadow-sm">
                            Process Return
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={activeIssues.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="loans"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSubTab === 'renewal') {
      const activeIssues = bookIssues.filter(i => i.status === 'Issued' || i.status === 'Renewed');

      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><RefreshCw className="w-4 h-4 text-sky-500" /> Book Issue Renewal</h3>
          </div>
          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">BOOK TITLE</th>
                  <th className="py-3 px-4">BORROWER</th>
                  <th className="py-3 px-4">CURRENT DUE DATE</th>
                  <th className="py-3 px-4 text-center">RENEWALS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(iss => (
                  <tr key={iss.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{iss.bookTitle}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{iss.borrowerName} ({iss.borrowerRole})</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{iss.dueDate}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sky-600">{iss.renewCount || 0} / 2</td>
                    <td className="py-3 px-4 text-right">
                      {!isReadOnlyAccess ? (
                        <button onClick={() => {
                          const newDueDate = new Date(new Date(iss.dueDate).getTime() + 14 * 86400000).toISOString().split('T')[0];
                          iss.dueDate = newDueDate;
                          iss.renewCount = (iss.renewCount || 0) + 1;
                          iss.status = 'Renewed';
                          addToast('success', 'Issue Renewed', `Extended due date for "${iss.bookTitle}" to ${newDueDate}`);
                          switchTab('phase1', 'dashboard');
                        }} className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white font-extrabold text-[11px] hover:bg-sky-500 transition-all shadow-sm">
                          Extend +14 Days
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={activeIssues.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="renewals"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSubTab === 'reservations') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Book Reservation Queue</h3>
            {!isReadOnlyAccess && (
              <button onClick={() => setModalType('addReservation')} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Reserve Book
              </button>
            )}
          </div>
          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">RES CODE</th>
                  <th className="py-3 px-4">BOOK TITLE</th>
                  <th className="py-3 px-4">REQUESTED BY</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4 text-center">QUEUE STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(res => (
                  <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{res.id}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{res.bookTitle}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{res.memberName} ({res.memberRole})</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{res.requestDate}</td>
                    <td className="py-3 px-4 text-center"><span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">{res.status}</span></td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!isReadOnlyAccess ? (
                        <>
                          <button onClick={() => {
                            const updated = reservations.map(r => r.id === res.id ? { ...r, status: 'Fulfilled' as any } : r);
                            saveReservations(updated);
                            addToast('success', 'Reservation Fulfilled', `Book copy assigned to ${res.memberName}`);
                          }} className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]">Fulfill</button>
                          <button onClick={() => setDeletingItem({ type: 'reservation', id: res.id, title: res.bookTitle })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={reservations.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="reservations"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Management: Phase 3 Components
  const renderPhase3 = () => {
    if (activeSubTab === 'fines') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-500" /> Library Fines & Fee Integration
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Overdue & Damage fines automatically sync to Finance Fee Collection reports.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-black text-xs">
                Total Collected: {formatCurrency(totalFinesCollected)}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-mono font-black text-xs">
                Pending: {formatCurrency(pendingFinesTotal)}
              </span>
            </div>
          </div>

          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">FINE ID</th>
                  <th className="py-3 px-4">MEMBER NAME</th>
                  <th className="py-3 px-4">BOOK TITLE</th>
                  <th className="py-3 px-4 text-center">DAYS LATE</th>
                  <th className="py-3 px-4 text-right">FINE AMOUNT</th>
                  <th className="py-3 px-4 text-center">PAYMENT STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fineRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{f.id}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{f.memberName} ({f.memberRole})</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{f.bookTitle}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{f.overdueDays} Days</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{formatCurrency(f.fineAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${f.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {f.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!isReadOnlyAccess ? (
                        <>
                          {f.paymentStatus === 'Unpaid' ? (
                            <button onClick={() => {
                              const updated = fineRecords.map(item => item.id === f.id ? { ...item, paymentStatus: 'Paid' as any, paidDate: new Date().toISOString().split('T')[0] } : item);
                              saveFines(updated);
                              addToast('success', 'Fine Collected', `Collected ${formatCurrency(f.fineAmount)} fine for ${f.memberName}`);
                            }} className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px]">Collect Fine</button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600">Paid on {f.paidDate}</span>
                          )}
                          <button onClick={() => setDeletingItem({ type: 'fine', id: f.id, title: f.memberName })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={fineRecords.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="fines"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSubTab === 'lost-damaged') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Lost / Damaged Books Registry</h3>
            {!isReadOnlyAccess && (
              <button onClick={() => setModalType('addLostDamaged')} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer">
                <Plus className="w-4 h-4" /> Report Issue
              </button>
            )}
          </div>
          <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="py-3 px-4">REPORT ID</th>
                  <th className="py-3 px-4">BOOK TITLE</th>
                  <th className="py-3 px-4">MEMBER NAME</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4 text-right">REPLACEMENT COST</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lostDamagedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(ld => (
                  <tr key={ld.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{ld.id}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{ld.bookTitle}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{ld.memberName} ({ld.memberRole})</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded font-bold text-[10px] ${ld.issueType === 'Lost' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{ld.issueType}</span></td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600">{formatCurrency(ld.replacementCost)}</td>
                    <td className="py-3 px-4 text-center"><span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-[10px]">{ld.status}</span></td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!isReadOnlyAccess ? (
                        <>
                          <button onClick={() => {
                            const updated = lostDamagedList.map(item => item.id === ld.id ? { ...item, status: 'Replaced' as any } : item);
                            saveLostDamaged(updated);
                            addToast('success', 'Book Replaced', `Recorded replacement copy for "${ld.bookTitle}"`);
                          }} className="px-3 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px]">Mark Replaced</button>
                          <button onClick={() => setDeletingItem({ type: 'lostDamaged', id: ld.id, title: ld.bookTitle })} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalItems={lostDamagedList.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="reports"
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeSubTab === 'rules') {
      return (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Sliders className="w-4 h-4 text-sky-500" /> Library Policy & Rule Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map(rule => (
              <div key={rule.id} className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-sky-500" /> {rule.userRole} Borrowing Policy
                  </h4>
                  <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">{rule.userRole}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div><span className="text-slate-400">Max Books Limit:</span> <p className="text-base font-mono font-black text-slate-900 dark:text-white">{rule.maxBooks} Books</p></div>
                  <div><span className="text-slate-400">Issue Duration:</span> <p className="text-base font-mono font-black text-slate-900 dark:text-white">{rule.issueDurationDays} Days</p></div>
                  <div><span className="text-slate-400">Daily Overdue Fine:</span> <p className="text-base font-mono font-black text-rose-600">{formatCurrency(rule.dailyFineRate)} / day</p></div>
                  <div><span className="text-slate-400">Max Renewals Allowed:</span> <p className="text-base font-mono font-black text-sky-600">{rule.maxRenewals} Times</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render Phase 4 Reporting Components
  const renderPhase4 = () => {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-500" /> Library Enterprise Reports & Analytics
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Generated reports for audit compliance and Finance fee matching.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => addToast('success', 'Report Exported', 'Downloaded Excel report summary.')} className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border overflow-hidden shadow-sm space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            {activeSubTab === 'book-reports' ? 'BOOK INVENTORY AUDIT REPORT' :
             activeSubTab === 'issue-reports' ? 'TRANSACTION ISSUE / RETURN LOG REPORT' :
             activeSubTab === 'overdue-reports' ? 'OVERDUE BORROWERS REPORT' : 'FINE COLLECTION & FINANCE SYNC REPORT'}
          </h4>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-extrabold text-[10px] text-slate-500">
              <tr>
                <th className="py-3 px-4">RECORD ID</th>
                <th className="py-3 px-4">PRIMARY ENTITY</th>
                <th className="py-3 px-4">DETAILS</th>
                <th className="py-3 px-4 text-center">DATE</th>
                <th className="py-3 px-4 text-right">AMOUNT / STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {activeSubTab === 'book-reports' && books.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(b => (
                <tr key={b.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{b.isbn}</td>
                  <td className="py-3 px-4 font-bold">{b.title}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">Author: {b.author} • {b.category}</td>
                  <td className="py-3 px-4 text-center font-mono">{b.rackNo}</td>
                  <td className="py-3 px-4 text-right font-bold text-sky-600">{b.availableCopies} / {b.totalCopies} Available</td>
                </tr>
              ))}

              {activeSubTab === 'issue-reports' && bookIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(i => (
                <tr key={i.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{i.id}</td>
                  <td className="py-3 px-4 font-bold">{i.bookTitle}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">Borrower: {i.borrowerName} ({i.borrowerRole})</td>
                  <td className="py-3 px-4 text-center font-mono">{i.issueDate}</td>
                  <td className="py-3 px-4 text-right font-bold">{i.status}</td>
                </tr>
              ))}

              {activeSubTab === 'overdue-reports' && bookIssues.filter(i => i.status === 'Overdue').slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(i => (
                <tr key={i.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{i.id}</td>
                  <td className="py-3 px-4 font-bold text-rose-600">{i.bookTitle}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">Late Borrower: {i.borrowerName}</td>
                  <td className="py-3 px-4 text-center font-mono text-rose-500">Due: {i.dueDate}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600">Overdue Fine Pending</td>
                </tr>
              ))}

              {activeSubTab === 'fine-reports' && fineRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(f => (
                <tr key={f.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{f.id}</td>
                  <td className="py-3 px-4 font-bold">{f.memberName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{f.bookTitle} ({f.overdueDays} Days Overdue)</td>
                  <td className="py-3 px-4 text-center font-mono">{f.createdDate}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">{formatCurrency(f.fineAmount)} ({f.paymentStatus})</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalItems={
                activeSubTab === 'book-reports' ? books.length :
                activeSubTab === 'issue-reports' ? bookIssues.length :
                activeSubTab === 'overdue-reports' ? bookIssues.filter(i => i.status === 'Overdue').length :
                fineRecords.length
              }
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              label="records"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/80 dark:border-sky-800 shadow-xs flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Library</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && isReadOnlyAccess && (
            <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs shadow-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Administrator Read-Only Mode (View Purpose Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Phase & Sub-tab Navigation Bar */}
      <div className="glass-card p-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs">
        {/* Main Phase Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 pb-2">
          {navigationStructure.map(phase => {
            const isActive = activePhase === phase.phaseId;
            return (
              <button
                key={phase.phaseId}
                onClick={() => {
                  setActivePhase(phase.phaseId);
                  setActiveSubTab(phase.tabs[0].id);
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                }`}
              >
                {phase.title}
              </button>
            );
          })}
        </div>

        {/* Sub-tab Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
          {navigationStructure
            .find(p => p.phaseId === activePhase)
            ?.tabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(activePhase, tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Content Area based on Active Phase & Sub-tab */}
      <div>
        {activePhase === 'phase1' && renderPhase1()}
        {activePhase === 'phase2' && renderPhase2()}
        {activePhase === 'phase3' && renderPhase3()}
        {activePhase === 'phase4' && renderPhase4()}
      </div>

      {/* Dynamic Modals */}
      {modalType === 'addCategory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Book Category</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const f = e.target as any;
              const newC: BookCategory = {
                id: `CAT-${Date.now()}`,
                name: f.name.value,
                code: f.code.value,
                description: f.description.value,
                totalBooksCount: 0
              };
              saveCategories([...categories, newC]);
              addToast('success', 'Category Created', `Added category ${newC.name}`);
              setModalType(null);
            }} className="space-y-3 text-xs">
              <div><label className="block font-bold mb-1">Category Name *</label><input type="text" name="name" required placeholder="e.g. Computer Science" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold" /></div>
              <div><label className="block font-bold mb-1">Category Code *</label><input type="text" name="code" required placeholder="e.g. CS" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-mono font-bold" /></div>
              <div><label className="block font-bold mb-1">Description</label><input type="text" name="description" placeholder="Short summary..." className="w-full px-3 py-2 rounded-xl bg-slate-50 border" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold">Save Category</button></div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'addAuthor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Author Record</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const f = e.target as any;
              const newA: BookAuthor = {
                id: `ATH-${Date.now()}`,
                name: f.name.value,
                publisher: f.publisher.value,
                biography: f.biography.value,
                booksCount: 0
              };
              saveAuthors([...authors, newA]);
              addToast('success', 'Author Added', `Added ${newA.name}`);
              setModalType(null);
            }} className="space-y-3 text-xs">
              <div><label className="block font-bold mb-1">Author Name *</label><input type="text" name="name" required placeholder="e.g. R.D. Sharma" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold" /></div>
              <div><label className="block font-bold mb-1">Publisher *</label><input type="text" name="publisher" required placeholder="e.g. Oxford Press" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold" /></div>
              <div><label className="block font-bold mb-1">Biography</label><input type="text" name="biography" placeholder="Short biography..." className="w-full px-3 py-2 rounded-xl bg-slate-50 border" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold">Save Author</button></div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'addRack' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Rack Location</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const f = e.target as any;
              const newR: BookRack = {
                id: `RCK-${Date.now()}`,
                rackNo: f.rackNo.value,
                shelfNo: f.shelfNo.value,
                floor: f.floor.value,
                section: f.section.value,
                capacity: Number(f.capacity.value) || 50,
                occupiedCount: 0
              };
              saveRacks([...racks, newR]);
              addToast('success', 'Rack Added', `Added ${newR.rackNo}`);
              setModalType(null);
            }} className="space-y-3 text-xs">
              <div><label className="block font-bold mb-1">Rack Number *</label><input type="text" name="rackNo" required placeholder="e.g. Rack E-05" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold" /></div>
              <div><label className="block font-bold mb-1">Shelf Number *</label><input type="text" name="shelfNo" required placeholder="e.g. Shelf 1" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold" /></div>
              <div><label className="block font-bold mb-1">Floor / Wing</label><input type="text" name="floor" defaultValue="1st Floor" className="w-full px-3 py-2 rounded-xl bg-slate-50 border" /></div>
              <div><label className="block font-bold mb-1">Section</label><input type="text" name="section" placeholder="e.g. Reference Section" className="w-full px-3 py-2 rounded-xl bg-slate-50 border" /></div>
              <div><label className="block font-bold mb-1">Capacity</label><input type="number" name="capacity" defaultValue={50} className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-mono" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold">Save Location</button></div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'addMember' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Register Library Member</h3>

            {/* Quick Auto-Fill Selector */}
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-200 dark:border-sky-800 space-y-1.5">
              <label className="block font-bold text-xs text-sky-900 dark:text-sky-300">
                ⚡ Auto-Fill from Admission List / Students / Staff
              </label>
              <select
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (!val) return;
                  const found = studentAdmissionCandidates.find(c => c.id === val || c.admissionNo === val) ||
                                staffCandidates.find(c => c.id === val);
                  if (found) {
                    handleSelectCandidateToForm(found);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none hover:border-sky-500 shadow-xs"
              >
                <option value="">-- Select from Admission List / Students --</option>
                <optgroup label="📋 Admission Applications & Candidates">
                  {studentAdmissionCandidates.filter(c => c.className.toLowerCase().includes('admission')).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.admissionNo} • {c.className})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🎓 Enrolled Students">
                  {studentAdmissionCandidates.filter(c => !c.className.toLowerCase().includes('admission')).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.admissionNo} • {c.className})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="👔 Faculty & Staff">
                  {staffCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.admissionNo} • {c.className})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              if (!memberFormState.name.trim() || !memberFormState.memberId.trim()) {
                addToast('warning', 'Validation Error', 'Please enter Member ID and Full Name.');
                return;
              }
              const newM: LibraryMember = {
                id: `MEM-${Date.now()}`,
                memberId: memberFormState.memberId.trim(),
                name: memberFormState.name.trim(),
                role: memberFormState.role,
                email: `${memberFormState.memberId.toLowerCase()}@school.edu`,
                phone: memberFormState.phone || '9876543210',
                maxLimit: Number(memberFormState.maxLimit) || 3,
                issuedCount: 0,
                fineBalance: 0,
                joinedDate: new Date().toISOString().split('T')[0],
                status: 'Active'
              };
              saveMembers([...members, newM]);
              addToast('success', 'Member Registered', `Registered ${newM.name} (${newM.memberId})`);
              setModalType(null);
            }} className="space-y-3 text-xs">

              <div>
                <label className="block font-bold mb-1">Member ID / Admission No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADM-2026-105"
                  value={memberFormState.memberId}
                  onChange={e => {
                    const val = e.target.value;
                    setMemberFormState(prev => ({ ...prev, memberId: val }));
                    const found = studentAdmissionCandidates.find(c => c.admissionNo.toLowerCase() === val.trim().toLowerCase()) ||
                                  staffCandidates.find(c => c.admissionNo.toLowerCase() === val.trim().toLowerCase());
                    if (found) {
                      setMemberFormState({
                        memberId: found.admissionNo,
                        name: found.name,
                        role: found.role,
                        phone: found.phone || '9876543210',
                        maxLimit: found.role === 'Staff' ? 6 : 3
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div className="relative">
                <label className="block font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Type name to auto-search admission list..."
                  value={memberFormState.name}
                  onFocus={() => setShowMemberSuggestions(true)}
                  onChange={e => {
                    const val = e.target.value;
                    setMemberFormState(prev => ({ ...prev, name: val }));
                    setShowMemberSuggestions(true);
                    const found = studentAdmissionCandidates.find(c => c.name.toLowerCase() === val.trim().toLowerCase()) ||
                                  staffCandidates.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
                    if (found) {
                      setMemberFormState({
                        memberId: found.admissionNo,
                        name: found.name,
                        role: found.role,
                        phone: found.phone || '9876543210',
                        maxLimit: found.role === 'Staff' ? 6 : 3
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />

                {/* Autocomplete Suggestions from Admission List */}
                {showMemberSuggestions && filteredMemberSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMemberSuggestions.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCandidateToForm(c)}
                        className="p-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.admissionNo} • {c.className}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                          {c.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">Role *</label>
                <select
                  value={memberFormState.role}
                  onChange={e => setMemberFormState(prev => ({ ...prev, role: e.target.value as any, maxLimit: e.target.value === 'Staff' ? 6 : 3 }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={memberFormState.phone}
                  onChange={e => setMemberFormState(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Max Books Limit</label>
                <input
                  type="number"
                  value={memberFormState.maxLimit}
                  onChange={e => setMemberFormState(prev => ({ ...prev, maxLimit: Number(e.target.value) || 3 }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'addReservation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Reserve Book Copy</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const f = e.target as any;
              const targetBk = books.find(b => b.id === f.bookId.value);
              const targetMem = members.find(m => m.memberId === f.memberId.value) || { name: f.memberId.value, role: 'Student' };
              const newRes: BookReservation = {
                id: `RES-${Date.now()}`,
                bookId: f.bookId.value,
                bookTitle: targetBk?.title || 'Library Book',
                memberId: f.memberId.value,
                memberName: targetMem.name,
                memberRole: targetMem.role as any,
                requestDate: new Date().toISOString().split('T')[0],
                status: 'Pending'
              };
              saveReservations([...reservations, newRes]);
              addToast('success', 'Book Reserved', `Reserved "${newRes.bookTitle}" for ${newRes.memberName}`);
              setModalType(null);
            }} className="space-y-3 text-xs">
              <div><label className="block font-bold mb-1">Select Member *</label><select name="memberId" required className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold"><option value="">Select Member...</option>{members.map(m => <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>)}</select></div>
              <div><label className="block font-bold mb-1">Select Book *</label><select name="bookId" required className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold"><option value="">Select Book...</option>{books.map(b => <option key={b.id} value={b.id}>{b.title} (Author: {b.author})</option>)}</select></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold">Save Reservation</button></div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'addLostDamaged' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Report Lost / Damaged Book</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const f = e.target as any;
              const targetBk = books.find(b => b.id === f.bookId.value);
              const targetMem = members.find(m => m.memberId === f.memberId.value) || { name: f.memberId.value, role: 'Student' };
              const newLD: LostDamagedBook = {
                id: `LD-${Date.now()}`,
                bookId: f.bookId.value,
                bookTitle: targetBk?.title || 'Book',
                memberId: f.memberId.value,
                memberName: targetMem.name,
                memberRole: targetMem.role as any,
                issueType: f.issueType.value as any,
                fineAmount: Number(f.fineAmount.value) || 50,
                replacementCost: Number(f.replacementCost.value) || 300,
                reportDate: new Date().toISOString().split('T')[0],
                status: 'Pending'
              };
              saveLostDamaged([...lostDamagedList, newLD]);
              addToast('success', 'Issue Logged', `Logged ${newLD.issueType} report for "${newLD.bookTitle}"`);
              setModalType(null);
            }} className="space-y-3 text-xs">
              <div><label className="block font-bold mb-1">Select Member *</label><select name="memberId" required className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold"><option value="">Select Member...</option>{members.map(m => <option key={m.id} value={m.memberId}>{m.name} ({m.memberId})</option>)}</select></div>
              <div><label className="block font-bold mb-1">Select Book *</label><select name="bookId" required className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold"><option value="">Select Book...</option>{books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select></div>
              <div><label className="block font-bold mb-1">Issue Type *</label><select name="issueType" className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-bold"><option value="Damaged">Damaged</option><option value="Lost">Lost</option></select></div>
              <div><label className="block font-bold mb-1">Replacement Cost (₹)</label><input type="number" name="replacementCost" defaultValue={350} className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-mono" /></div>
              <div><label className="block font-bold mb-1">Fine Penalty Amount (₹)</label><input type="number" name="fineAmount" defaultValue={50} className="w-full px-3 py-2 rounded-xl bg-slate-50 border font-mono" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold">Log Report</button></div>
            </form>
          </div>
        </div>
      )}

      {(modalType === 'addBook' || modalType === 'editBook') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {modalType === 'editBook' ? 'Edit Book Details' : 'Add New Book to Catalog'}
            </h3>
            <form onSubmit={e => {
              e.preventDefault();
              if (!bookForm.title.trim() || !bookForm.author.trim()) {
                addToast('warning', 'Validation Error', 'Please enter Book Title and Author Name.');
                return;
              }

              if (modalType === 'editBook' && modalData) {
                const updatedBk: BookItem = {
                  ...modalData,
                  title: bookForm.title.trim(),
                  author: bookForm.author.trim(),
                  category: bookForm.category,
                  isbn: bookForm.isbn.trim(),
                  totalCopies: Number(bookForm.totalCopies) || 1,
                  availableCopies: Number(bookForm.totalCopies) || 1,
                  rackNo: bookForm.rackNo
                };
                addBook(updatedBk);
                addToast('success', 'Book Updated', `Updated "${updatedBk.title}" in library catalog`);
              } else {
                const newBk: BookItem = {
                  id: `BK-${Date.now()}`,
                  isbn: bookForm.isbn.trim() || ('978-0134' + Math.floor(100000 + Math.random() * 900000)),
                  title: bookForm.title.trim(),
                  author: bookForm.author.trim(),
                  category: bookForm.category,
                  totalCopies: Number(bookForm.totalCopies) || 1,
                  availableCopies: Number(bookForm.totalCopies) || 1,
                  rackNo: bookForm.rackNo
                };
                addBook(newBk);
                addToast('success', 'Book Registered', `Added "${newBk.title}" to library catalog`);
              }
              setModalType(null);
            }} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Book Title *</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={e => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Fundamentals of Physics"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Author Name *</label>
                <input
                  type="text"
                  required
                  value={bookForm.author}
                  onChange={e => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="e.g. Halliday & Resnick"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Category *</label>
                <select
                  value={bookForm.category}
                  onChange={e => setBookForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">ISBN Number</label>
                <input
                  type="text"
                  value={bookForm.isbn}
                  onChange={e => setBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                  placeholder="978-0134891234"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Total Copies</label>
                  <input
                    type="number"
                    value={bookForm.totalCopies}
                    onChange={e => setBookForm(prev => ({ ...prev, totalCopies: Number(e.target.value) || 1 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">Rack / Shelf *</label>
                    <button type="button" onClick={() => setModalType('addRack')} className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                      + Add New Shelf
                    </button>
                  </div>
                  <select
                    value={bookForm.rackNo}
                    onChange={e => setBookForm(prev => ({ ...prev, rackNo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    {racks.map(r => (
                      <option key={r.id} value={`${r.rackNo} (${r.shelfNo})`}>
                        {r.rackNo} ({r.shelfNo}) {r.section ? `• ${r.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold cursor-pointer shadow-md">
                  {modalType === 'editBook' ? 'Update Book' : 'Save Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Punch Attendance Modal */}
      {modalType === 'addAttendance' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-sky-500" /> Record Librarian Shift Attendance
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const newRec: LibrarianAttendanceRecord = {
                id: `ATT-LIB-${Date.now()}`,
                staffId: modalData?.staffId || 'EMP-LIB-01',
                staffName: modalData?.staffName || 'Bhanu Prakash',
                role: 'Librarian',
                date: modalData?.date || new Date().toISOString().split('T')[0],
                checkInTime: modalData?.checkInTime || '08:30 AM',
                checkOutTime: modalData?.checkOutTime || '05:00 PM',
                workingHours: modalData?.workingHours || '8.5 Hours',
                shift: modalData?.shift || 'Morning Shift (08:30 - 17:00)',
                status: modalData?.status || 'Present',
                remarks: modalData?.remarks || 'Manual shift record entry'
              };
              saveLibrarianAttendance([newRec, ...librarianAttendance]);
              addToast('success', 'Attendance Recorded', `Recorded attendance punch for ${newRec.staffName}`);
              setModalType(null);
            }} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Staff Member *</label>
                  <select
                    value={modalData?.staffId}
                    onChange={e => {
                      const selected = e.target.value;
                      const name = selected === 'EMP-LIB-01' ? 'Bhanu Prakash' : selected === 'EMP-LIB-02' ? 'Rachel Green' : 'Sarah Jenkins';
                      setModalData((prev: any) => ({ ...prev, staffId: selected, staffName: name }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="EMP-LIB-01">Bhanu Prakash (Librarian)</option>
                    <option value="EMP-LIB-02">Rachel Green (Assistant Librarian)</option>
                    <option value="EMP-LIB-03">Sarah Jenkins (Library Attendant)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Shift Date *</label>
                  <input
                    type="date"
                    required
                    value={modalData?.date}
                    onChange={e => setModalData((prev: any) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Check In Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:30 AM"
                    value={modalData?.checkInTime}
                    onChange={e => setModalData((prev: any) => ({ ...prev, checkInTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Check Out Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:00 PM"
                    value={modalData?.checkOutTime}
                    onChange={e => setModalData((prev: any) => ({ ...prev, checkOutTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Attendance Status *</label>
                  <select
                    value={modalData?.status}
                    onChange={e => setModalData((prev: any) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Shift Name</label>
                  <input
                    type="text"
                    value={modalData?.shift}
                    onChange={e => setModalData((prev: any) => ({ ...prev, shift: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Duty Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Catalog verification and desk duty"
                  value={modalData?.remarks}
                  onChange={e => setModalData((prev: any) => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl border font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold cursor-pointer shadow-md">
                  Save Attendance Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {deletingItem && (
        <ConfirmModal
          isOpen={Boolean(deletingItem)}
          onCancel={() => setDeletingItem(null)}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${deletingItem.title}"? This action will permanently remove the record.`}
          confirmLabel="Delete Record"
          variant="danger"
        />
      )}
    </div>
  );
};

export default LibraryView;
