import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Building2,
  Bus,
  BedDouble,
  CreditCard,
  Bell,
  CheckCircle2,
  Lock,
  UserCheck,
  Briefcase,
  HeartHandshake,
  ArrowUpRight,
  Globe,
  Check,
  Star,
  Eye,
  Image as ImageIcon,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react';
import { fetchSchoolSettingsApi } from '../../../api/settings';
import { fetchNotificationsApi } from '../../../api/communication';
import { useTheme } from '../../../context/ThemeContext';
import pirnavLogo from '../../../assets/pirnav-school-logo.png';

interface LandingViewProps {
  onLoginClick: (role?: string) => void;
}

interface DynamicSchoolInfo {
  name: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  tagline: string;
  affiliation: string;
}

interface NoticeItem {
  id: string | number;
  date: string;
  badge: string;
  title: string;
  desc: string;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLoginClick }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'management' | 'campus'>('all');
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'classrooms' | 'labs' | 'sports' | 'library'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; desc: string } | null>(null);
  const [heroConsoleTab, setHeroConsoleTab] = useState<'admin' | 'teacher' | 'parent'>('admin');

  // School Campus Backdrop Image
  const bgCampusImage = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000&auto=format&fit=crop';

  // Dynamic School Info State loaded from API / localStorage with no hardcoded fallback text or logos
  const [schoolInfo, setSchoolInfo] = useState<DynamicSchoolInfo>(() => {
    return {
      name: localStorage.getItem('school_name') || '',
      logoUrl: localStorage.getItem('school_logo') || localStorage.getItem('logoUrl') || '',
      address: localStorage.getItem('school_address') || '',
      email: localStorage.getItem('school_email') || '',
      phone: localStorage.getItem('school_phone') || '',
      website: localStorage.getItem('school_website') || '',
      tagline: localStorage.getItem('school_tagline') || '',
      affiliation: localStorage.getItem('school_affiliation') || '',
    };
  });

  // Dynamic Notices State
  const [notices, setNotices] = useState<NoticeItem[]>([
    {
      id: 1,
      date: 'SEP 10, 2026',
      badge: 'Admissions',
      title: 'Admissions Open for Academic Year 2026-2027',
      desc: 'Applications are now open for Pre-Primary to Senior Secondary classes. Schedule a campus visit today.',
    },
    {
      id: 2,
      date: 'SEP 15, 2026',
      badge: 'Academic',
      title: 'Mid-Term Board Examinations Schedule Released',
      desc: 'The official datesheet for Grades 9 through 12 has been published on the student and parent portal.',
    },
    {
      id: 3,
      date: 'SEP 22, 2026',
      badge: 'Event',
      title: 'Annual STEM & Robotics Exhibition 2026',
      desc: 'Students showcase creative engineering projects and innovation models in the main auditorium.',
    },
  ]);

  // Fetch dynamic school profile settings and notices on mount
  useEffect(() => {
    let isMounted = true;

    const loadSchoolSettings = () => {
      const savedName = localStorage.getItem('school_name');
      const savedLogo = localStorage.getItem('school_logo') || localStorage.getItem('logoUrl');
      const savedAddr = localStorage.getItem('school_address');

      if (savedName || savedLogo || savedAddr) {
        setSchoolInfo(prev => ({
          ...prev,
          name: savedName || prev.name,
          logoUrl: savedLogo || prev.logoUrl,
          address: savedAddr || prev.address
        }));
      }

      fetchSchoolSettingsApi()
        .then((res: any) => {
          if (!isMounted) return;
          const data = res?.data || res;
          if (data) {
            const updated: DynamicSchoolInfo = {
              name: data.schoolName || data.name || savedName || '',
              logoUrl: data.logoUrl || data.logo || savedLogo || '',
              address: data.address || data.schoolAddress || savedAddr || '',
              email: data.email || data.contactEmail || '',
              phone: data.phone || data.contactPhone || '',
              website: data.website || '',
              tagline: data.tagline || data.motto || '',
              affiliation: data.affiliation || data.board || '',
            };
            setSchoolInfo(updated);
            if (updated.name) localStorage.setItem('school_name', updated.name);
            if (updated.logoUrl) localStorage.setItem('school_logo', updated.logoUrl);
            if (updated.address) localStorage.setItem('school_address', updated.address);
          }
        })
        .catch(() => {});
    };

    loadSchoolSettings();

    window.addEventListener('school_profile_updated', loadSchoolSettings);
    window.addEventListener('storage', loadSchoolSettings);

    fetchNotificationsApi()
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const formatted: NoticeItem[] = list.slice(0, 4).map((item: any, index: number) => ({
            id: item.id || index,
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'TODAY',
            badge: item.type || item.category || 'Notice',
            title: item.title || item.subject || 'School Notice',
            desc: item.content || item.message || item.description || 'Log into portal to read full details.',
          }));
          setNotices(formatted);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      window.removeEventListener('school_profile_updated', loadSchoolSettings);
      window.removeEventListener('storage', loadSchoolSettings);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const portalRoles = [
    {
      id: 'Admin',
      title: 'Administrator Portal',
      icon: ShieldCheck,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      badge: 'Control Hub',
      description: 'Institutional metrics, staff HR, payroll, fee collections, and global system configuration.',
      highlights: ['Staff & Payroll Control', 'Financial Ledgers & Reports', 'Multi-Branch Administration']
    },
    {
      id: 'Teacher',
      title: 'Faculty & Teacher Portal',
      icon: Briefcase,
      color: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/25',
      badge: 'Classroom Hub',
      description: 'Mark attendance, record exam marks, assign homework, and review class timetables.',
      highlights: ['Biometric Check-in & Out', 'Instant Gradebook Entry', 'Digital Lesson Plans']
    },
    {
      id: 'Parent',
      title: 'Parents & Guardians Portal',
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      badge: 'Live Tracking',
      description: 'View children report cards, track school bus GPS live, pay fees online, and check attendance.',
      highlights: ['Live GPS Bus Tracking', 'Online Fee Payment', 'Direct Teacher Messaging']
    },
    {
      id: 'Student',
      title: 'Student Learning Portal',
      icon: GraduationCap,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
      badge: 'Academic Hub',
      description: 'Access exam datesheets, homework submissions, digital library books, and notice circulars.',
      highlights: ['Timetables & Exam Dates', 'Homework & Assignments', 'Digital Library Catalog']
    },
  ];

  const stats = [
    { label: 'Active Students', value: '2,500+', icon: Users, desc: 'Enrolled across Pre-K to Grade 12' },
    { label: 'Certified Faculty', value: '150+', icon: Award, desc: 'Dedicated educators & specialists' },
    { label: 'Academic Excellence', value: '99.2%', icon: Sparkles, desc: 'Board examination pass rate' },
    { label: 'Smart Campus ERP', value: '100%', icon: CheckCircle2, desc: 'Fully synchronized digital workflow' },
  ];

  // School Photo Gallery Showcase Items
  const campusGallery = [
    {
      category: 'classrooms',
      title: 'Interactive Smart Board Classrooms',
      desc: 'Digitally enabled classrooms equipped with touch panels, high-speed Wi-Fi, and ergonomic learning spaces.',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000&auto=format&fit=crop',
      badge: 'Digital Learning'
    },
    {
      category: 'labs',
      title: 'Advanced Science & STEM Robotics Lab',
      desc: 'State-of-the-art physics, chemistry, biology, and robotics laboratories for practical hands-on discovery.',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000&auto=format&fit=crop',
      badge: 'STEM & Research'
    },
    {
      category: 'sports',
      title: 'Olympic-Standard Athletic Grounds',
      desc: 'Spacious football field, basketball courts, swimming pool, and indoor sports arena for holistic fitness.',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
      badge: 'Sports Complex'
    },
    {
      category: 'library',
      title: 'Central Digital Library & Study Commons',
      desc: 'Over 25,000 physical volumes, research journals, e-book archives, and quiet study zones.',
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1000&auto=format&fit=crop',
      badge: 'Knowledge Hub'
    },
    {
      category: 'classrooms',
      title: 'Early Years & Primary Activity Center',
      desc: 'Vibrant activity rooms designed for early childhood cognitive development and creative expression.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000&auto=format&fit=crop',
      badge: 'Pre-Primary'
    },
    {
      category: 'labs',
      title: 'High-Tech Computer & AI Technology Center',
      desc: 'Modern computer workstation suites supporting coding, artificial intelligence, and digital arts curricula.',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop',
      badge: 'Computer Science'
    },
  ];

  const filteredGallery = activeGalleryTab === 'all'
    ? campusGallery
    : campusGallery.filter(item => item.category === activeGalleryTab);

  const erpFeatures = [
    {
      category: 'academic',
      title: 'Academics & Timetables',
      icon: BookOpen,
      color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
      description: 'Dynamic section scheduling, subject teacher mapping, lesson planning, and real-time class timetables.',
    },
    {
      category: 'academic',
      title: 'Examinations & Report Cards',
      icon: Award,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
      description: 'Automated report card generation, grade calculation, online marks entry, and historical transcripts.',
    },
    {
      category: 'management',
      title: 'Attendance & Biometrics',
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Instant student and staff check-ins, automated absentee SMS alerts, and monthly attendance logs.',
    },
    {
      category: 'management',
      title: 'Fee & Financial Management',
      icon: CreditCard,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Online fee payments, automated receipts, due notifications, scholarship tracking, and financial ledgers.',
    },
    {
      category: 'campus',
      title: 'Transport & Live Bus GPS',
      icon: Bus,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Real-time vehicle location tracking, pickup/drop point updates, and driver profile logs.',
    },
    {
      category: 'campus',
      title: 'Hostel & Digital Outpass',
      icon: BedDouble,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      description: 'Room allocation management, warden check-ins, parent digital outpass authorization, and mess logs.',
    },
    {
      category: 'campus',
      title: 'Digital Library System',
      icon: Building2,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
      description: 'Barcode book issue and return tracking, fine calculation, and online catalog searching.',
    },
    {
      category: 'management',
      title: 'Communication Hub',
      icon: Bell,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      description: 'Instant broadcast notices, principal announcements, event calendars, and direct parent messaging.',
    },
  ];

  const filteredFeatures = activeTab === 'all' 
    ? erpFeatures 
    : erpFeatures.filter(f => f.category === activeTab);

  const testimonials = [
    {
      name: 'Dr. Rajesh Verma',
      role: 'Parent of Class 10 Student',
      comment: 'The real-time bus tracking and online fee portal give us total peace of mind. Pirnav Institution provides both academic rigor and safety.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Sunita Rao',
      role: 'Senior Physics Educator',
      comment: 'The integrated ERP makes recording marks, tracking attendance, and uploading homework effortless so we can focus on teaching.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
    },
    {
      name: 'Ananya Sharma',
      role: 'Alumni (Batch of 2025)',
      comment: 'The STEM robotics lab and digital library resources at Pirnav gave me the ideal foundation for my engineering university studies.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop'
    }
  ];

  return (
    <div className="min-h-screen w-full font-sans text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      
      {/* Full-Screen Blurred School Campus Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${bgCampusImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-slate-100/75 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-300 pointer-events-none" />

      {/* Sleek Compact Sticky Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/95 dark:bg-slate-950/95 border-b border-slate-800/90 text-slate-100 transition-all shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Logo & Dynamic School Name (Direct Logo without background box) */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => scrollToSection('hero')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
              {schoolInfo.logoUrl ? (
                <img
                  src={schoolInfo.logoUrl}
                  alt={schoolInfo.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <GraduationCap className="w-6 h-6 text-sky-400" />
              )}
            </div>
            
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white flex items-center gap-1.5 truncate">
                {schoolInfo.name}
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 font-medium text-xs sm:text-sm text-slate-300">
            <button onClick={() => scrollToSection('hero')} className="hover:text-sky-400 transition-colors py-1.5">
              Home
            </button>
            <button onClick={() => scrollToSection('campus-life')} className="hover:text-sky-400 transition-colors py-1.5">
              Campus Gallery
            </button>
            <button onClick={() => scrollToSection('portals')} className="hover:text-sky-400 transition-colors py-1.5">
              Portals
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors py-1.5">
              ERP Features
            </button>
            <button onClick={() => scrollToSection('notices')} className="hover:text-sky-400 transition-colors py-1.5">
              Notice Board
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-sky-400 transition-colors py-1.5">
              Contact
            </button>
          </nav>

          {/* Desktop Actions (Theme Toggle + Sign In) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme Mode"
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-300" />}
            </button>

            <button
              onClick={() => onLoginClick()}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-lg text-xs sm:text-sm shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In to ERP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Toggle & Theme Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme Mode"
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800/80 border border-slate-700/80"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-sky-300" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 border border-slate-700/80 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/95 dark:bg-slate-950/95 border-b border-slate-800 px-4 py-3 space-y-1.5 backdrop-blur-2xl animate-in slide-in-from-top duration-300 text-slate-200">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left py-1.5 px-3 text-slate-200 font-medium hover:text-sky-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('campus-life')}
              className="block w-full text-left py-1.5 px-3 text-slate-200 font-medium hover:text-sky-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
            >
              Campus Gallery
            </button>
            <button
              onClick={() => scrollToSection('portals')}
              className="block w-full text-left py-1.5 px-3 text-slate-200 font-medium hover:text-sky-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
            >
              Role Portals
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-1.5 px-3 text-slate-200 font-medium hover:text-sky-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
            >
              ERP Features
            </button>
            <button
              onClick={() => scrollToSection('notices')}
              className="block w-full text-left py-1.5 px-3 text-slate-200 font-medium hover:text-sky-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
            >
              Notice Board
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-1.5 px-3 text-slate-200 font-medium hover:text-sky-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
            >
              Contact Us
            </button>

            <div className="pt-1.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-lg text-center shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all text-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign In to ERP
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <div className="relative z-10">
        
        {/* Hero Section */}
        <section id="hero" className="relative pt-6 sm:pt-10 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">Next-Gen Digital Campus & Learning ERP</span>
              </div>

              <h1 className="font-black text-slate-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.12]">
                Empowering Minds, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-violet-600 to-purple-600 dark:from-sky-400 dark:via-violet-400 dark:to-purple-400">
                  Shaping Tomorrow
                </span>
              </h1>

              <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium backdrop-blur-sm bg-white/40 dark:bg-slate-950/40 p-3 rounded-2xl border border-white/40 dark:border-slate-800/40">
                Welcome to <strong className="text-slate-900 dark:text-white">{schoolInfo.name}</strong>. Connecting students, educators, parents, and administrators under one synchronized, paperless digital campus ecosystem.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <button
                  onClick={() => onLoginClick()}
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
                >
                  <span>Access Portal</span>
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToSection('campus-life')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
                  <span>Explore Campus</span>
                </button>
              </div>

              {/* Trust Signals */}
              <div className="pt-4 border-t border-slate-300/80 dark:border-slate-800/80 grid grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Accreditation</div>
                  <div className="text-slate-900 dark:text-white text-xs font-bold mt-0.5 truncate">{schoolInfo.affiliation}</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Campus Safety</div>
                  <div className="text-slate-900 dark:text-white text-xs font-bold mt-0.5 truncate">24/7 Digital GPS</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Digital ERP</div>
                  <div className="text-slate-900 dark:text-white text-xs font-bold mt-0.5 truncate">100% Paperless</div>
                </div>
              </div>

            </div>

            {/* Right Interactive Smart School ERP Live Console Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                <div className="relative rounded-2xl overflow-hidden border border-white/60 dark:border-slate-800/90 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-5 shadow-2xl space-y-4">
                  
                  {/* Console Top Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[220px]" title={`${schoolInfo.name} Live Console`}>
                          {schoolInfo.name} Live Console
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Smart Campus Ecosystem</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      <span>ONLINE</span>
                    </div>
                  </div>

                  {/* Console Role Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100/90 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[11px] font-bold">
                    {[
                      { id: 'admin', label: 'Admin' },
                      { id: 'teacher', label: 'Teacher' },
                      { id: 'parent', label: 'Parent' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setHeroConsoleTab(tab.id as any)}
                        className={`py-1.5 rounded-lg text-center transition-all ${
                          heroConsoleTab === tab.id
                            ? 'bg-sky-500 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Console Live Content Panel */}
                  <div className="space-y-3 pt-1">
                    
                    {heroConsoleTab === 'admin' && (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <UserCheck className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Daily Attendance</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">98.6% Checked In</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            2,465 / 2,500
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Class Sessions</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">42 Classes Live</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            In Session
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <Bus className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">School Bus Fleet</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">18 GPS Vehicles Active</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                            Tracked
                          </span>
                        </div>
                      </div>
                    )}

                    {heroConsoleTab === 'teacher' && (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Current Period</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">Physics - Grade 10-A</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            Room 204
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                              <Award className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pending Marks Entry</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">Mid-Term Board Scores</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            3 Classes
                          </span>
                        </div>
                      </div>
                    )}

                    {heroConsoleTab === 'parent' && (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Child Attendance</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">Present Today (8:15 AM)</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            Verified
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <Bus className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">School Bus Route #4</div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">2.4 km from Home Stop</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                            En Route
                          </span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Console Footer */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Multi-Role Sign In</span>
                    </div>
                    <button
                      onClick={() => onLoginClick()}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>Launch Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="border-y border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="p-4 sm:p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-md transition-all hover:-translate-y-0.5 duration-300 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{stat.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{stat.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Campus Life & School Infrastructure Gallery Section */}
        <section id="campus-life" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
              <ImageIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Campus Infrastructure & Life
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              World-Class School Campus & Facilities
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
              Explore our state-of-the-art classrooms, advanced STEM laboratories, athletic complexes, and modern learning spaces.
            </p>
          </div>

          {/* Gallery Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              { id: 'all', label: 'All Campus View' },
              { id: 'classrooms', label: 'Smart Classrooms' },
              { id: 'labs', label: 'STEM & Science Labs' },
              { id: 'sports', label: 'Sports Complex' },
              { id: 'library', label: 'Library & Commons' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGalleryTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeGalleryTab === tab.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 backdrop-blur-md'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto({ url: item.image, title: item.title, desc: item.desc })}
                className="group relative rounded-2xl overflow-hidden bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-sky-500/50 transition-all duration-300 cursor-pointer shadow-lg backdrop-blur-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Category Badge top left */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-sky-400">
                    {item.badge}
                  </div>

                  {/* Hover Quick View Icon */}
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                  </div>

                  {/* Card Title & Desc Bottom Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-0.5 text-left">
                    <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Portal Role Launcher Section */}
        <section id="portals" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
              <Lock className="w-3.5 h-3.5" /> Sign In Portals
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Tailored Access for Every Stakeholder
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm max-w-xl mx-auto font-medium">
              Select your portal role to log in directly to your personalized workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {portalRoles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => onLoginClick(role.id)}
                  className="group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-xl backdrop-blur-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${role.color} text-white flex items-center justify-center shadow-md ${role.shadow}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        {role.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-1.5">
                      {role.description}
                    </p>

                    {/* Top Features */}
                    <ul className="mt-3 space-y-1 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                      {role.highlights.map((feat, hIdx) => (
                        <li key={hIdx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-500">
                    <span>Enter Portal</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ERP Modules Showcase */}
        <section id="features" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
              <Building2 className="w-3.5 h-3.5" /> Complete Ecosystem
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Integrated School Management Modules
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
              Streamlining administrative, academic, and campus operations into a paperless digital workflow.
            </p>
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'academic', label: 'Academics & Exams' },
              { id: 'management', label: 'Admin & Finance' },
              { id: 'campus', label: 'Campus Facilities' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 backdrop-blur-md'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:bg-white dark:hover:bg-slate-900 group shadow-md backdrop-blur-md"
                >
                  <div className={`w-10 h-10 rounded-xl border ${feat.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{feat.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dynamic Notice Board & Announcements */}
        <section id="notices" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
                <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Live Updates
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                School Circulars & Announcements
              </h2>
              <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Stay informed with official circulars, exam notifications, and campus events. Log into your parent or student portal for complete details.
              </p>

              <div className="pt-1">
                <button
                  onClick={() => onLoginClick()}
                  className="px-4 py-2.5 bg-white/90 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-sm backdrop-blur-md"
                >
                  <span>View All Circulars</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md backdrop-blur-md"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                        {notice.badge}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {notice.date}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{notice.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{notice.desc}</p>
                  </div>

                  <button
                    onClick={() => onLoginClick()}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-sky-600 transition-colors text-xs font-semibold flex items-center gap-1 self-start sm:self-center"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Testimonials & Community Voices
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trusted by Parents, Educators & Students
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
              Discover what our institutional community says about our academic excellence and digital portal experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-md backdrop-blur-md">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Institutional Mission Banner */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="bg-white/80 dark:bg-slate-900/85 border border-white/60 dark:border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl backdrop-blur-xl">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">Institutional Heritage</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Nurturing Character & Academic Excellence
                </h2>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  At {schoolInfo.name}, our mission extends beyond textbook learning. We foster critical thinking, athletic resilience, ethical leadership, and technological literacy in every student.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> STEM & Robotics Innovation Labs
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Sports & Athletic Coaching
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Interactive Digital Classrooms
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Dedicated Student Guidance
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="p-5 rounded-xl bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-center max-w-sm space-y-3 shadow-xl w-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-violet-600 mx-auto flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-sky-500/30">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Admissions Open 2026</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Limited seats available for Pre-K through Grade 12.</p>
                  </div>
                  <button
                    onClick={() => onLoginClick()}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
                  >
                    Inquire & Apply Online
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* Photo Modal Preview Popup */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
            <div className="p-5 space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedPhoto.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedPhoto.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Dynamic Footer Section */}
      <footer id="contact" className="relative z-10 border-t border-slate-800/90 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl pt-6 sm:pt-8 pb-4 px-4 sm:px-6 lg:px-8 text-slate-300 dark:text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-6">
          
          {/* Dynamic Institution Contact Info (Direct Logo without background box) */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
                {schoolInfo.logoUrl ? (
                  <img
                    src={schoolInfo.logoUrl}
                    alt={schoolInfo.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <GraduationCap className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {schoolInfo.name}
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {schoolInfo.tagline}
            </p>

            {/* Dynamic Address & Contact */}
            <div className="pt-0.5 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{schoolInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{schoolInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{schoolInfo.email}</span>
              </div>
              {schoolInfo.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{schoolInfo.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Quick Links</h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => scrollToSection('hero')} className="hover:text-sky-400 transition-colors">
                  Home & Overview
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('campus-life')} className="hover:text-sky-400 transition-colors">
                  Campus Gallery
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('portals')} className="hover:text-sky-400 transition-colors">
                  Role Portals
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors">
                  ERP Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('notices')} className="hover:text-sky-400 transition-colors">
                  Notice Board
                </button>
              </li>
            </ul>
          </div>

          {/* User Portals */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Portal Sign In</h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onLoginClick('Admin')} className="hover:text-sky-400 transition-colors">
                  Administrator Portal
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Teacher')} className="hover:text-sky-400 transition-colors">
                  Faculty & Teacher Portal
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Parent')} className="hover:text-sky-400 transition-colors">
                  Parents & Guardians Portal
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Student')} className="hover:text-sky-400 transition-colors">
                  Student Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Office Hours</h3>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Mon - Fri: 8:00 AM - 4:30 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Saturday: 8:30 AM - 1:00 PM</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-0.5">
                Digital ERP Portals available 24/7.
              </p>
            </div>
          </div>

        </div>

        {/* Dynamic Copyright Footer */}
        <div className="max-w-7xl mx-auto mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-2">
          <p>© {new Date().getFullYear()} {schoolInfo.name}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
