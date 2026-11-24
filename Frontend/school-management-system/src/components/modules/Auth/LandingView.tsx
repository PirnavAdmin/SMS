import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Users,
  BookOpen,
  Award,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
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
  CheckCircle,
  Sun,
  Moon,
  Zap,
  Layers,
  HardDrive,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import {
  PackagePlan,
  fetchPackagesApi,
  fetchCompanyProfileApi
} from '../../../api/superadmin';
import { useTheme, DEFAULT_THEME, applyThemeToDocument } from '../../../context/ThemeContext';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

interface LandingViewProps {
  onLoginClick: (role?: string) => void;
}

export interface SuperAdminPlatformProfile {
  companyName: string;
  tagline: string;
  logoUrl: string;
  address?: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  primaryColor?: string;
}

interface StatCounterProps {
  target: number;
  decimals?: number;
  suffix?: string;
  autoIncrement?: boolean;
}

const StatCounter: React.FC<StatCounterProps> = ({
  target,
  decimals = 0,
  suffix = '',
  autoIncrement = false,
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [extraIncrement, setExtraIncrement] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);
    const fallbackTimer = setTimeout(() => {
      setHasStarted(true);
    }, 300);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Smooth count-up animation on enter
  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    const duration = 2000;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = easeOut * target;
      setCurrentValue(val);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, target]);

  // Periodic auto-increase simulation (number ticks up every 3.5 seconds)
  useEffect(() => {
    if (!hasStarted || !autoIncrement) return;

    const interval = setInterval(() => {
      setExtraIncrement((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(interval);
  }, [hasStarted, autoIncrement]);

  const totalValue = currentValue + extraIncrement;
  const displayValue = decimals > 0 
    ? totalValue.toFixed(decimals) 
    : Math.floor(totalValue).toLocaleString();

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
};

export const LandingView: React.FC<LandingViewProps> = ({ onLoginClick }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Ensure LandingView always isolates its presentation to pure platform default colors, immune to tenant admin theme changes
  useEffect(() => {
    applyThemeToDocument(DEFAULT_THEME.primary, DEFAULT_THEME.secondary);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'academic' | 'management' | 'campus'>('all');
  const [heroConsoleTab, setHeroConsoleTab] = useState<'admin' | 'teacher' | 'parent'>('admin');

  // Super Admin Platform Branding & Profile (NO localStorage / NO mock data - direct from database API)
  const [platformProfile, setPlatformProfile] = useState<SuperAdminPlatformProfile>({
    companyName: '',
    tagline: '',
    logoUrl: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    primaryColor: '#0284c7',
  });
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Subscriptions & SaaS Packages (Loaded dynamically from Super Admin database - NO localStorage)
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);
  const [subscriptionBillingCycle, setSubscriptionBillingCycle] = useState<'Monthly' | 'Yearly'>('Yearly');

  // 1. Load live Super Admin Platform Profile from backend DB
  useEffect(() => {
    let isMounted = true;

    const loadPlatformProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await fetchCompanyProfileApi();
        if (isMounted && data) {
          setPlatformProfile({
            companyName: data.companyName || '',
            tagline: data.tagline || '',
            logoUrl: data.logoUrl || '',
            address: data.address || '',
            supportEmail: data.supportEmail || '',
            supportPhone: data.supportPhone || '',
            websiteUrl: data.websiteUrl || '',
            primaryColor: data.primaryColor || '#0284c7',
          });
        }
      } catch (err) {
        console.warn('Could not fetch Super Admin company profile for landing view:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadPlatformProfile();

    const handleProfileUpdate = () => {
      loadPlatformProfile();
    };

    window.addEventListener('superadmin_profile_updated', handleProfileUpdate);
    window.addEventListener('company_profile_updated', handleProfileUpdate);
    window.addEventListener('platform_branding_updated', handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('superadmin_profile_updated', handleProfileUpdate);
      window.removeEventListener('company_profile_updated', handleProfileUpdate);
      window.removeEventListener('platform_branding_updated', handleProfileUpdate);
    };
  }, []);

  // 2. Load live packages configured by Super Admin from backend database
  useEffect(() => {
    let isMounted = true;
    const loadPackages = async () => {
      try {
        setLoadingPackages(true);
        const data = await fetchPackagesApi();
        if (isMounted) {
          setPackages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Could not fetch Super Admin packages for landing view:', err);
      } finally {
        if (isMounted) setLoadingPackages(false);
      }
    };

    loadPackages();

    const handlePackagesUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setPackages(e.detail);
      } else {
        loadPackages();
      }
    };

    window.addEventListener('packages_updated', handlePackagesUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('packages_updated', handlePackagesUpdated);
    };
  }, []);

  const activePackages = useMemo(() => {
    const list = Array.isArray(packages) ? packages : [];
    return list.filter(p => !p.status || p.status.toLowerCase() === 'active');
  }, [packages]);

  const activeFeaturedPlan = useMemo(() => {
    return activePackages.find(p => p.isPopular) || activePackages[0] || null;
  }, [activePackages]);

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
    {
      id: 'Hostel Warden',
      title: 'Hostel Warden Portal',
      icon: BedDouble,
      color: 'from-indigo-500 to-blue-700',
      shadow: 'shadow-indigo-500/25',
      badge: 'Residential Hub',
      description: 'Hostel room allocations, occupancy tracking, student outpass & leave approvals, and campus safety.',
      highlights: ['Outpass & Leave Approvals', 'Hostel Attendance Register', 'Room & Bed Allocations']
    },
  ];

  const stats = useMemo(() => [
    { label: 'Cloud Architecture', target: 100, suffix: '%', icon: ShieldCheck, desc: 'Multi-tenant database isolation', autoIncrement: false },
    { label: 'Integrated Modules', target: 14, suffix: '+', icon: Layers, desc: 'Synchronized campus workflows', autoIncrement: false },
    { label: 'System SLA Uptime', target: 99.95, decimals: 2, suffix: '%', icon: Zap, desc: 'Guaranteed high availability', autoIncrement: false },
    { label: 'Subscription Tiers', target: activePackages.length > 0 ? activePackages.length : 3, suffix: ' Plans', icon: Sparkles, desc: 'Managed by Super Admin', autoIncrement: false },
  ], [activePackages.length]);

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

  // Carousel Refs & States for Portals
  const portalScrollRef = useRef<HTMLDivElement>(null);
  const [activePortalIndex, setActivePortalIndex] = useState(0);
  const [isPortalHovered, setIsPortalHovered] = useState(false);

  // Carousel Refs & States for Modules
  const moduleScrollRef = useRef<HTMLDivElement>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [isModuleHovered, setIsModuleHovered] = useState(false);

  // Carousel Refs & States for Subscriptions
  const packageScrollRef = useRef<HTMLDivElement>(null);
  const [activePackageIndex, setActivePackageIndex] = useState(0);
  const [isPackageHovered, setIsPackageHovered] = useState(false);

  const checkPortalScroll = () => {
    if (!portalScrollRef.current || portalRoles.length === 0) return;
    const { scrollLeft } = portalScrollRef.current;
    const cardEl = portalScrollRef.current.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 336;
    const rawIdx = Math.round(scrollLeft / cardWidth);
    setActivePortalIndex(Math.min(portalRoles.length - 1, Math.max(0, rawIdx)));
  };

  const scrollToPortalIndex = (index: number) => {
    if (!portalScrollRef.current || portalRoles.length === 0) return;
    const cardEl = portalScrollRef.current.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 336;
    portalScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setActivePortalIndex(index);
  };

  const checkModuleScroll = () => {
    if (!moduleScrollRef.current || filteredFeatures.length === 0) return;
    const { scrollLeft } = moduleScrollRef.current;
    const cardEl = moduleScrollRef.current.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 310;
    const rawIdx = Math.round(scrollLeft / cardWidth);
    setActiveModuleIndex(Math.min(filteredFeatures.length - 1, Math.max(0, rawIdx)));
  };

  const scrollToModuleIndex = (index: number) => {
    if (!moduleScrollRef.current || filteredFeatures.length === 0) return;
    const cardEl = moduleScrollRef.current.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 310;
    moduleScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setActiveModuleIndex(index);
  };

  const checkPackageScroll = () => {
    if (!packageScrollRef.current || activePackages.length <= 3) return;
    const { scrollLeft } = packageScrollRef.current;
    const cardEl = packageScrollRef.current.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 356;
    const rawIdx = Math.round(scrollLeft / cardWidth);
    setActivePackageIndex(Math.min(activePackages.length - 1, Math.max(0, rawIdx)));
  };

  const scrollToPackageIndex = (index: number) => {
    if (!packageScrollRef.current || activePackages.length <= 3) return;
    const cardEl = packageScrollRef.current.firstElementChild as HTMLElement | null;
    const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 356;
    packageScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setActivePackageIndex(index);
  };

  // Continuous auto-rotate Portals Carousel Timer (every 3.5 seconds)
  useEffect(() => {
    if (isPortalHovered || portalRoles.length <= 1) return;

    const timer = setInterval(() => {
      if (portalScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = portalScrollRef.current;
        const cardEl = portalScrollRef.current.firstElementChild as HTMLElement | null;
        const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 336;

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          portalScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          portalScrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isPortalHovered, portalRoles.length]);

  // Continuous auto-rotate Modules Carousel Timer (every 3.5 seconds)
  useEffect(() => {
    if (isModuleHovered || filteredFeatures.length <= 1) return;

    const timer = setInterval(() => {
      if (moduleScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = moduleScrollRef.current;
        const cardEl = moduleScrollRef.current.firstElementChild as HTMLElement | null;
        const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 310;

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          moduleScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          moduleScrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isModuleHovered, filteredFeatures.length]);

  // Continuous auto-rotate Subscriptions Carousel Timer (every 3.5 seconds, only active when > 3 packages)
  useEffect(() => {
    if (isPackageHovered || activePackages.length <= 3) return;

    const timer = setInterval(() => {
      if (packageScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = packageScrollRef.current;
        const cardEl = packageScrollRef.current.firstElementChild as HTMLElement | null;
        const cardWidth = cardEl ? cardEl.offsetWidth + 16 : 356;

        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          packageScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          packageScrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [isPackageHovered, activePackages.length]);

  // Auto-rotate Live Console Tabs (every 4.5 seconds)
  useEffect(() => {
    const tabs: Array<'admin' | 'teacher' | 'parent'> = ['admin', 'teacher', 'parent'];
    const timer = setInterval(() => {
      setHeroConsoleTab((prev) => {
        const nextIdx = (tabs.indexOf(prev) + 1) % tabs.length;
        return tabs[nextIdx];
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Reset module carousel to 0 when tab filter changes
  useEffect(() => {
    if (moduleScrollRef.current) {
      moduleScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActiveModuleIndex(0);
    }
  }, [activeTab]);

  // Reset subscriptions carousel to 0 when packages update
  useEffect(() => {
    if (packageScrollRef.current && activePackages.length > 3) {
      packageScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActivePackageIndex(0);
    }
  }, [activePackages.length]);

  return (
    <div className="min-h-screen w-full font-sans text-slate-900 dark:text-slate-100 selection:bg-sky-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      
      {/* Modern Cloud ERP Canvas Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 via-sky-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-slate-100/75 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-300 pointer-events-none" />

      {/* Sleek Compact Sticky Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/95 dark:bg-slate-950/95 border-b border-slate-800/90 text-slate-100 transition-all shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Dynamic Super Admin Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => scrollToSection('hero')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center border border-white/20 shadow-xs transition-transform group-hover:scale-105 overflow-hidden">
              {platformProfile.logoUrl ? (
                <img
                  src={resolveMediaUrl(platformProfile.logoUrl)}
                  alt={platformProfile.companyName || 'Platform Logo'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-5 h-5 text-sky-600" />
              )}
            </div>
            
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white flex items-center gap-1.5 truncate group-hover:text-sky-400 transition-colors">
                {platformProfile.companyName}
              </span>
              {platformProfile.tagline && (
                <span className="hidden sm:block text-[10px] font-semibold text-sky-400/90 truncate max-w-xs">
                  {platformProfile.tagline}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 font-medium text-xs sm:text-sm text-slate-300">
            <button onClick={() => scrollToSection('hero')} className="hover:text-sky-400 transition-colors py-1.5 cursor-pointer">
              Home
            </button>
            <button onClick={() => scrollToSection('portals')} className="hover:text-sky-400 transition-colors py-1.5 cursor-pointer">
              Portals
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors py-1.5 cursor-pointer">
              ERP Features
            </button>
            {activePackages.length > 0 && (
              <button onClick={() => scrollToSection('subscriptions')} className="hover:text-sky-400 transition-colors py-1.5 cursor-pointer">
                Subscriptions
              </button>
            )}
            <button onClick={() => scrollToSection('contact')} className="hover:text-sky-400 transition-colors py-1.5 cursor-pointer">
              Contact
            </button>
          </nav>

          {/* Desktop Actions (Theme Toggle + Sign In) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme Mode"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer flex items-center justify-center"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-300" />}
            </button>

            <button
              onClick={() => onLoginClick()}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
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
            {activePackages.length > 0 && (
              <button
                onClick={() => scrollToSection('subscriptions')}
                className="block w-full text-left py-1.5 px-3 text-sky-400 font-semibold hover:bg-slate-800/80 rounded-lg transition-colors text-xs flex items-center justify-between"
              >
                <span>Subscriptions</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-500/20 text-sky-300">SaaS</span>
              </button>
            )}
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
                Sign In
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <div className="relative z-10">
        
        {/* Hero Section */}
        <section id="hero" className="relative pt-4 sm:pt-6 pb-5 sm:pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">Next-Gen Digital Campus & Learning ERP</span>
              </div>

              <h1 className="font-black text-slate-900 dark:text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.12]">
                Empowering Modern Campuses, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-violet-600 to-purple-600 dark:from-sky-400 dark:via-violet-400 dark:to-purple-400">
                  Unified Cloud ERP
                </span>
              </h1>

              <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium backdrop-blur-sm bg-white/40 dark:bg-slate-950/40 p-3 rounded-2xl border border-white/40 dark:border-slate-800/40">
                {platformProfile.tagline
                  ? (platformProfile.companyName ? `${platformProfile.companyName} — ${platformProfile.tagline}.` : platformProfile.tagline)
                  : (platformProfile.companyName ? `Welcome to ${platformProfile.companyName}. Synchronizing academics, attendance, finance, and live operations on a unified cloud architecture.` : 'Synchronizing academics, attendance, finance, and live operations on a unified cloud architecture.')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <Building2 className="w-4.5 h-4.5" />
                  <span>Explore ERP Features</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToSection('portals')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
                  <span>Role Portals</span>
                </button>
              </div>

              {/* Trust Signals */}
              <div className="pt-4 border-t border-slate-300/80 dark:border-slate-800/80 grid grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Architecture</div>
                  <div className="text-slate-900 dark:text-white text-xs font-bold mt-0.5 truncate">Multi-Tenant Cloud</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Reliability</div>
                  <div className="text-slate-900 dark:text-white text-xs font-bold mt-0.5 truncate">99.95% SLA Uptime</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">Data Security</div>
                  <div className="text-slate-900 dark:text-white text-xs font-bold mt-0.5 truncate">Encrypted & Isolated</div>
                </div>
              </div>

            </div>

            {/* Right Showcase: Institutional Cloud ERP & Active Subscription Hub */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative Ambient Glow Orbs */}
                <div className="absolute -top-8 -right-8 w-60 h-60 bg-sky-500/15 dark:bg-sky-500/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-52 h-52 bg-blue-600/15 dark:bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative rounded-3xl overflow-hidden border border-white/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl shadow-sky-500/10 space-y-4">
                  
                  {/* Academic Session & ERP Cloud Spotlight Banner */}
                  <div
                    onClick={() => scrollToSection('features')}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-indigo-500/10 border border-sky-500/20 hover:border-sky-500/40 cursor-pointer transition-all hover:scale-[1.01] group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                              {platformProfile.companyName ? `${platformProfile.companyName} (${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)})` : ''}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/30 shrink-0">
                              Active ERP
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            Unified management across Academics, Attendance, Fees & Fleet
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 group-hover:underline flex items-center justify-end gap-1">
                          Explore ERP <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Interactive Campus Pulse Metric Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/40 transition-all text-center space-y-1 group">
                      <div className="w-7 h-7 mx-auto rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        98.6%
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        Attendance
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-sky-500/40 transition-all text-center space-y-1 group">
                      <div className="w-7 h-7 mx-auto rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        42 Live
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        Classrooms
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/40 transition-all text-center space-y-1 group">
                      <div className="w-7 h-7 mx-auto rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Bus className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        18 Buses
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        GPS Active
                      </div>
                    </div>
                  </div>

                  {/* Direct Role Portal Launchpad Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 px-0.5">
                      <span>Quick Portal Access</span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400">1-Click Launch</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => onLoginClick('Admin')}
                        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2 transition-all hover:scale-[1.02] text-left cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">Administrator</span>
                      </button>

                      <button
                        onClick={() => onLoginClick('Faculty')}
                        className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-800 dark:text-sky-300 font-bold flex items-center gap-2 transition-all hover:scale-[1.02] text-left cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">Teacher & Faculty</span>
                      </button>

                      <button
                        onClick={() => onLoginClick('Student')}
                        className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-800 dark:text-purple-300 font-bold flex items-center gap-2 transition-all hover:scale-[1.02] text-left cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">Student</span>
                      </button>

                      <button
                        onClick={() => onLoginClick('Parent')}
                        className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 transition-all hover:scale-[1.02] text-left cursor-pointer"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Parent & Guardian</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                    <button
                      onClick={() => scrollToSection(activePackages.length > 0 ? 'subscriptions' : 'features')}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline flex items-center gap-1.5 cursor-pointer py-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                      <span>{activePackages.length > 0 ? 'View Subscription Plans' : 'Explore ERP Modules'}</span>
                      <ArrowRight className="w-3 h-3 text-sky-500" />
                    </button>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="border-y border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md py-4 sm:py-5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="p-4 sm:p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-md transition-all hover:-translate-y-0.5 duration-300 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    {stat.autoIncrement && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    <StatCounter
                      target={stat.target}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                      autoIncrement={stat.autoIncrement}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{stat.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{stat.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Portal Role Launcher Section */}
        <section
          id="portals"
          onMouseEnter={() => setIsPortalHovered(true)}
          onMouseLeave={() => setIsPortalHovered(false)}
          onTouchStart={() => setIsPortalHovered(true)}
          onTouchEnd={() => setIsPortalHovered(false)}
          className="py-5 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60"
        >
          <div className="text-center max-w-3xl mx-auto mb-4 space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold backdrop-blur-md bg-white/60 dark:bg-slate-900/60">
              <Lock className="w-3.5 h-3.5" /> Sign In Portals
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Role-Based Access Portals
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
              Select your portal role to log in directly to your personalized workspace.
            </p>
          </div>

          {/* Carousel Slider */}
          <div
            ref={portalScrollRef}
            onScroll={checkPortalScroll}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2.5 px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {portalRoles.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => onLoginClick(role.id)}
                  className="w-[85vw] sm:w-[320px] md:w-[330px] lg:w-[340px] shrink-0 snap-start group relative bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-xl backdrop-blur-md select-none"
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
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-1.5 min-h-[36px]">
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

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-3.5">
            {portalRoles.map((role, idx) => (
              <button
                key={role.id}
                type="button"
                onClick={() => scrollToPortalIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activePortalIndex === idx
                    ? 'w-6 h-2 bg-sky-500 dark:bg-sky-400'
                    : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
                aria-label={`Go to portal ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ERP Modules Showcase */}
        <section
          id="features"
          onMouseEnter={() => setIsModuleHovered(true)}
          onMouseLeave={() => setIsModuleHovered(false)}
          onTouchStart={() => setIsModuleHovered(true)}
          onTouchEnd={() => setIsModuleHovered(false)}
          className="py-5 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60"
        >
          <div className="text-center max-w-3xl mx-auto mb-4 space-y-1.5">
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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'academic', label: 'Academics & Exams' },
              { id: 'management', label: 'Admin & Finance' },
              { id: 'campus', label: 'Campus Facilities' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 backdrop-blur-md'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Module Cards Carousel Track */}
          <div
            ref={moduleScrollRef}
            onScroll={checkModuleScroll}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2.5 px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="w-[85vw] sm:w-[280px] md:w-[290px] lg:w-[310px] shrink-0 snap-start p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:bg-white dark:hover:bg-slate-900 group shadow-md backdrop-blur-md flex flex-col justify-between select-none"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl border ${feat.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{feat.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot Indicators */}
          {filteredFeatures.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3.5">
              {filteredFeatures.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToModuleIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeModuleIndex === idx
                      ? 'w-6 h-2 bg-sky-500 dark:bg-sky-400'
                      : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Go to module ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* Institutional Subscriptions & SaaS Packages Section */}
        {/* Reflects live packages configured in Super Admin */}
        {/* ========================================================= */}
        {activePackages.length > 0 && (
          <section
            id="subscriptions"
            onMouseEnter={() => setIsPackageHovered(true)}
            onMouseLeave={() => setIsPackageHovered(false)}
            onTouchStart={() => setIsPackageHovered(true)}
            onTouchEnd={() => setIsPackageHovered(false)}
            className="py-5 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60 relative"
          >
            <div className="text-center max-w-3xl mx-auto space-y-2 mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Institutional Subscription Plans</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Flexible Subscription Plans for Every Institution
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                Affordable, cloud-ready subscription packages tailored for independent schools and multi-branch institutions.
              </p>

              {/* Monthly / Yearly Billing Switcher */}
              <div className="pt-1 flex items-center justify-center gap-2">
                <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700/80 shadow-inner">
                  <button
                    onClick={() => setSubscriptionBillingCycle('Monthly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      subscriptionBillingCycle === 'Monthly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setSubscriptionBillingCycle('Yearly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subscriptionBillingCycle === 'Yearly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Yearly Billing</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Subscriptions Carousel Slider / Centered Grid */}
            <div
              ref={packageScrollRef}
              onScroll={activePackages.length > 3 ? checkPackageScroll : undefined}
              className={`items-stretch ${
                activePackages.length <= 3
                  ? 'flex flex-wrap justify-center gap-5 sm:gap-6 py-4 px-2'
                  : 'flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-4 px-1'
              }`}
              style={activePackages.length > 3 ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
            >
              {activePackages.map((pkg) => {
                const isPopular = pkg.isPopular;
                const isMonthly = subscriptionBillingCycle === 'Monthly';
                const price = isMonthly
                  ? (pkg.monthlyPrice > 0 ? pkg.monthlyPrice : Math.round(pkg.yearlyPrice / 12))
                  : (pkg.yearlyPrice > 0 ? pkg.yearlyPrice : pkg.monthlyPrice * 12);
                const cycleLabel = isMonthly ? '/month' : '/yearly';
                const isCarousel = activePackages.length > 3;

                return (
                  <div
                    key={pkg.id || pkg.name}
                    className={`${
                      isCarousel
                        ? 'w-[85vw] sm:w-[320px] md:w-[340px] lg:w-[350px] shrink-0 snap-start'
                        : 'w-full max-w-[340px] sm:w-[310px] md:w-[320px] lg:w-[310px] xl:w-[350px]'
                    } relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] backdrop-blur-xl select-none ${
                      isPopular
                        ? 'bg-white/95 dark:bg-slate-900/95 border-2 border-sky-500 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/10'
                        : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-md'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-sky-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                        <Star className="w-3 h-3 fill-current" />
                        <span>MOST POPULAR</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{pkg.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {pkg.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                          {pkg.tagline || 'Institutional SaaS Tier'}
                        </p>
                      </div>

                      {/* Price Block */}
                      <div className="py-2 border-y border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            ₹{Number(price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{cycleLabel}</span>
                        </div>
                        {subscriptionBillingCycle === 'Yearly' && pkg.monthlyPrice > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Includes ~20% annual discount
                          </p>
                        )}
                      </div>

                      {/* Capacity Specs Grid */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] py-0.5">
                        <div className="py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {pkg.maxStudents > 0 ? `${pkg.maxStudents.toLocaleString()} Students` : 'Unlimited Students'}
                          </span>
                        </div>

                        <div className="py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {pkg.maxBranches > 1 ? `${pkg.maxBranches} Branches` : (pkg.maxBranches === 1 ? '1 Campus' : 'Unlimited Campuses')}
                          </span>
                        </div>

                        <div className="py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {pkg.maxStaff > 0 ? `${pkg.maxStaff} Staff` : 'Unlimited Staff'}
                          </span>
                        </div>

                        <div className="py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {pkg.storageGb ? `${pkg.storageGb} GB Cloud` : 'Cloud Storage'}
                          </span>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                          Included Modules & Capabilities
                        </div>
                        <ul className="space-y-1.5">
                          {pkg.features?.map((feat: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Plan CTA */}
                    <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={() => onLoginClick()}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-98 ${
                          isPopular
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
                        }`}
                      >
                        <span>Choose {pkg.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dot Indicators */}
            {activePackages.length > 3 && (
              <div className="flex items-center justify-center gap-1.5 mt-3.5">
                {activePackages.map((pkg, idx) => (
                  <button
                    key={pkg.id || idx}
                    type="button"
                    onClick={() => scrollToPackageIndex(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activePackageIndex === idx
                        ? 'w-6 h-2 bg-sky-500 dark:bg-sky-400'
                        : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                    }`}
                    aria-label={`Go to plan ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Enterprise Cloud ERP Architecture Banner */}
        <section className="py-5 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="bg-white/80 dark:bg-slate-900/85 border border-white/60 dark:border-slate-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl backdrop-blur-xl">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">Enterprise Cloud Architecture</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Empowering Modern Educational Campuses
                </h2>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                  {platformProfile.companyName ? `${platformProfile.companyName} provides a unified multi-tenant architecture.` : 'Our School Management ERP empowers institutions with unified cloud operations.'} Scale administrative efficiency, automate student lifecycles, and unify academics, finance, and transport on one intelligent cloud platform.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Multi-Branch & Tenant Isolation
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Automated Billing & Digital Receipts
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Real-Time Transit & Live Fleet GPS
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Role-Based Granular Access Control
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="p-5 rounded-xl bg-white/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-center max-w-sm space-y-3 shadow-xl w-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-sky-500/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{platformProfile.companyName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Have questions or looking for tailored campus deployment? Get in touch with our team for quick assistance and live onboarding.</p>
                  </div>
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Contact Us</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* Compact Dynamic Footer Section */}
      <footer id="contact" className="relative z-10 border-t border-slate-800/90 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl py-6 sm:py-7 px-4 sm:px-6 lg:px-8 text-slate-300 dark:text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Dynamic Platform Contact Info */}
          <div className="md:col-span-6 lg:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 p-1.5 shrink-0 flex items-center justify-center border border-white/15">
                {platformProfile.logoUrl ? (
                  <img
                    src={resolveMediaUrl(platformProfile.logoUrl)}
                    alt={platformProfile.companyName || 'Platform Logo'}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight block">
                  {platformProfile.companyName}
                </span>
                {platformProfile.tagline && (
                  <span className="block text-[11px] font-semibold text-sky-400 mt-0.5">
                    {platformProfile.tagline}
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Super Admin Contact & Address Details */}
            <div className="space-y-2 pt-1 text-xs text-slate-300">
              {platformProfile.address && (
                <div className="flex items-start gap-2.5 max-w-md">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" aria-label="Corporate Address" />
                  <span className="leading-relaxed">{platformProfile.address}</span>
                </div>
              )}
              {platformProfile.supportPhone && (
                <div className="flex items-center gap-2.5" title="Support Phone">
                  <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-label="Support Phone Icon" />
                  <span className="text-slate-200 font-medium">{platformProfile.supportPhone}</span>
                </div>
              )}
              {platformProfile.supportEmail && (
                <div className="flex items-center gap-2.5" title="Support Email">
                  <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-label="Support Email Icon" />
                  <a href={`mailto:${platformProfile.supportEmail}`} className="text-slate-200 hover:text-sky-300 transition-colors font-medium">
                    {platformProfile.supportEmail}
                  </a>
                </div>
              )}
              {platformProfile.websiteUrl && (
                <div className="flex items-center gap-2.5" title="Platform Website">
                  <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-label="Platform Website Icon" />
                  <a
                    href={platformProfile.websiteUrl.startsWith('http') ? platformProfile.websiteUrl : `https://${platformProfile.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-200 hover:text-sky-300 transition-colors font-medium truncate max-w-sm"
                  >
                    {platformProfile.websiteUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 lg:col-span-3 lg:col-start-7">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Navigation</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => scrollToSection('hero')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  Home & Overview
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  ERP Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('subscriptions')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  Subscription Plans
                </button>
              </li>
            </ul>
          </div>

          {/* User Portals */}
          <div className="md:col-span-3 lg:col-span-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Portal Access</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onLoginClick('Super Admin')}
                  className="hover:text-amber-400 text-amber-300 font-semibold transition-colors cursor-pointer text-left block"
                >
                  Super Administrator Portal
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Admin')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  Administrator Portal
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Teacher')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  Faculty & Teacher Portal
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Parent')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  Parents & Guardians
                </button>
              </li>
              <li>
                <button onClick={() => onLoginClick('Student')} className="hover:text-sky-400 transition-colors cursor-pointer text-left block">
                  Student Portal
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Dynamic Copyright Footer */}
        <div className="max-w-7xl mx-auto mt-7 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-3">
          <p>© {new Date().getFullYear()} {platformProfile.companyName ? `${platformProfile.companyName}. ` : ''}All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
