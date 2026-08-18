import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, Save, Database, Activity, RefreshCw, Building2, 
  Plus, Edit, Trash2, CheckCircle, XCircle, Search, MapPin, Phone, Mail, 
  X, Calendar, CheckCircle2, Award, FileCheck, Layers, Palette, ShieldCheck, 
  FileText, Check, Layout
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { AcademicYearMaster, CertificateTemplateConfig } from '../../../types';
import { PrintableCertificateContainer } from '../Certificates/PrintableCertificateContainer';
import { formatDateDDMMYYYY } from '../../../utils/dateValidation';
import { SchoolLogoUploader } from './SchoolLogoUploader';
import { CertificateSettingsTab } from './CertificateSettingsTab';

export interface CampusItem {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

const defaultCampuses: CampusItem[] = [
  { id: 'CMP-01', name: 'Main Campus', code: 'MAIN', address: 'Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081', phone: '+91 9123456789', email: 'main@pirnavschools.edu', status: 'Active' },
  { id: 'CMP-02', name: 'North Branch', code: 'NORTH', address: 'Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081', phone: '+91 9123456789', email: 'north@pirnavschools.edu', status: 'Active' },
  { id: 'CMP-03', name: 'West Campus', code: 'WEST', address: 'Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081', phone: '+91 9123456789', email: 'west@pirnavschools.edu', status: 'Active' }
];

const defaultCertificateTemplates: CertificateTemplateConfig[] = [
  {
    id: 'TPL-TC',
    certificateType: 'Transfer Certificate',
    title: 'OFFICIAL TRANSFER CERTIFICATE',
    subTitle: 'CBSE Affiliation No: 883012 • School Code: 40192',
    headerStyle: 'Classic Double Border',
    themeColor: '#1e3a8a',
    showLogo: true,
    showSeal: true,
    signatory1: 'Class Teacher Signature',
    signatory2: 'Verified By (Accounts)',
    signatory3: 'Principal Signature & Seal',
    customPreamble: 'Certified that the student details listed below are verified from original school admission registers.',
    footerDisclaimer: 'Official Transfer Certificate issued in accordance with Education Code Rules.'
  },
  {
    id: 'TPL-BONAFIDE',
    certificateType: 'Bonafide Certificate',
    title: 'BONAFIDE STUDY CERTIFICATE',
    subTitle: 'Recognized Educational Institution',
    headerStyle: 'Modern Minimalist',
    themeColor: '#065f46',
    showLogo: true,
    showSeal: true,
    signatory1: 'Class Teacher',
    signatory2: 'Administrative Officer',
    signatory3: 'Headmaster / Principal',
    customPreamble: 'This is to certify that the student is a genuine student studying in our institution.',
    footerDisclaimer: 'Valid for official passport, bank, or scholarship verification.'
  },
  {
    id: 'TPL-CONDUCT',
    certificateType: 'Character Certificate',
    title: 'CHARACTER & CONDUCT CERTIFICATE',
    subTitle: 'General Student Conduct Evaluation',
    headerStyle: 'Executive Slate',
    themeColor: '#1e293b',
    showLogo: true,
    showSeal: true,
    signatory1: 'Counselor / Class Teacher',
    signatory2: 'Vice Principal',
    signatory3: 'Principal',
    customPreamble: 'Certified that the student bears exemplary moral character and satisfactory conduct.',
    footerDisclaimer: 'Issued upon student or parent request for higher studies.'
  },
  {
    id: 'TPL-LEAVING',
    certificateType: 'Leaving Certificate',
    title: 'SCHOOL LEAVING CERTIFICATE',
    subTitle: 'Secondary Education Departure Record',
    headerStyle: 'Classic Double Border',
    themeColor: '#991b1b',
    showLogo: true,
    showSeal: true,
    signatory1: 'Class Teacher',
    signatory2: 'Registrar',
    signatory3: 'Principal',
    customPreamble: 'Certified that the student has completed course work and departed the institution.',
    footerDisclaimer: 'Official leaving record for board verification.'
  },
  {
    id: 'TPL-MERIT',
    certificateType: 'Merit Certificate',
    title: 'CERTIFICATE OF ACADEMIC EXCELLENCE',
    subTitle: 'Awarded for Outstanding Academic Performance',
    headerStyle: 'Royal Gold Crest',
    themeColor: '#92400e',
    showLogo: true,
    showSeal: true,
    signatory1: 'Academic Coordinator',
    signatory2: 'Exam Controller',
    signatory3: 'Principal',
    customPreamble: 'In recognition of stellar academic achievements and exemplary effort.',
    footerDisclaimer: 'Honorary academic award presented at annual convocation.'
  },
  {
    id: 'TPL-SPORTS',
    certificateType: 'Sports Certificate',
    title: 'CERTIFICATE OF SPORTS ACHIEVEMENT',
    subTitle: 'Annual Inter-School Athletics Championship',
    headerStyle: 'Modern Minimalist',
    themeColor: '#0284c7',
    showLogo: true,
    showSeal: true,
    signatory1: 'Physical Education Director',
    signatory2: 'Sports Coordinator',
    signatory3: 'Principal',
    customPreamble: 'Presented for outstanding sportsmanship and championship performance.',
    footerDisclaimer: 'Official sports recognition certificate.'
  }
];

export const SettingsView: React.FC = () => {
  const { 
    schoolProfile, updateSchoolProfile, auditLogs, 
    academicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear, setCurrentAcademicYear,
    certificateTemplates: contextTemplates, updateCertificateTemplate: contextUpdateTemplate
  } = useData();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState(schoolProfile);
  useEffect(() => {
    setProfileForm(schoolProfile);
  }, [schoolProfile]);
  const [activeTab, setActiveTab] = useState<'profile' | 'campus' | 'academic-year' | 'certificates' | 'backup' | 'audit'>('profile');

  // Academic Year Configuration States
  const [aySearch, setAySearch] = useState('');
  const [isAYModalOpen, setIsAYModalOpen] = useState(false);
  const [editingAY, setEditingAY] = useState<AcademicYearMaster | null>(null);
  const [deletingAY, setDeletingAY] = useState<AcademicYearMaster | null>(null);
  const [ayForm, setAyForm] = useState<{
    academicYear: string;
    startDate: string;
    endDate: string;
    status: 'Active' | 'Closed' | 'Upcoming';
    description: string;
    isCurrentAcademicYear: boolean;
  }>({
    academicYear: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
    description: '',
    isCurrentAcademicYear: false
  });

  // Campus Configuration States
  const [campuses, setCampuses] = useState<CampusItem[]>(() => {
    const saved = localStorage.getItem('school_campuses');
    return saved ? JSON.parse(saved) : defaultCampuses;
  });

  const [campusSearch, setCampusSearch] = useState('');
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [deletingCampus, setDeletingCampus] = useState<CampusItem | null>(null);

  const [campusForm, setCampusForm] = useState<{
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    status: 'Active'
  });

  // Certificate Template Configuration States
  const certificateTemplates = useMemo(() => {
    if (Array.isArray(contextTemplates) && contextTemplates.length > 0 && contextTemplates[0]?.certificateType && contextTemplates[0]?.title) {
      return contextTemplates;
    }
    try {
      const saved = localStorage.getItem('edu_db_certificate_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.certificateType && parsed[0]?.title) {
          return parsed;
        }
      }
    } catch (e) {}
    return defaultCertificateTemplates;
  }, [contextTemplates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('TPL-TC');

  // Currently Selected Certificate Template
  const currentTemplate = useMemo(() => {
    const found = certificateTemplates.find(t => t.id === selectedTemplateId);
    return found || certificateTemplates[0] || defaultCertificateTemplates[0];
  }, [certificateTemplates, selectedTemplateId]);

  // Sync campuses to localStorage and trigger Header sync event
  const syncCampuses = (updated: CampusItem[]) => {
    setCampuses(updated);
    localStorage.setItem('school_campuses', JSON.stringify(updated));

    const allActive = updated.filter(c => c.status === 'Active').map(c => c.name);
    const allInactive = updated.filter(c => c.status === 'Inactive').map(c => c.name);
    const allManaged = updated.map(c => c.name);

    localStorage.setItem('managed_branches', JSON.stringify(allManaged));
    localStorage.setItem('inactive_branches', JSON.stringify(allInactive));

    window.dispatchEvent(new Event('branches_updated'));
  };

  const handleSaveProfile = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateSchoolProfile(profileForm);
    addToast('success', 'Settings Saved', 'School branding profile updated successfully.');
  };

  const handleUpdateTemplate = (updatedFields: Partial<CertificateTemplateConfig>) => {
    if (!currentTemplate) return;
    if (contextUpdateTemplate) {
      contextUpdateTemplate(currentTemplate.id, updatedFields);
    }
  };

  const handleSaveCertificateTemplates = () => {
    localStorage.setItem('edu_db_certificate_templates', JSON.stringify(certificateTemplates));
    addToast('success', 'Certificate Template Configured', `Saved layout and branding configurations for ${currentTemplate?.certificateType || 'all certificates'}.`);
  };

  const handleOpenAddCampus = () => {
    setEditingCampus(null);
    setCampusForm({ name: '', code: '', address: '', phone: '', email: '', status: 'Active' });
    setIsCampusModalOpen(true);
  };

  const handleOpenEditCampus = (campus: CampusItem) => {
    setEditingCampus(campus);
    setCampusForm({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      phone: campus.phone,
      email: campus.email,
      status: campus.status
    });
    setIsCampusModalOpen(true);
  };

  const handleSaveCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim() || !campusForm.code.trim()) return;

    let updated: CampusItem[];
    if (editingCampus) {
      updated = campuses.map(c => c.id === editingCampus.id ? { ...editingCampus, ...campusForm } : c);
      addToast('success', 'Campus Updated', `Updated settings for ${campusForm.name}`);
    } else {
      const newCampus: CampusItem = {
        id: `CMP-${Date.now().toString().slice(-4)}`,
        ...campusForm
      };
      updated = [...campuses, newCampus];
      addToast('success', 'Campus Added', `Added new campus ${campusForm.name}`);
    }

    syncCampuses(updated);
    setIsCampusModalOpen(false);
  };

  const confirmDeleteCampus = () => {
    if (!deletingCampus) return;
    const updated = campuses.filter(c => c.id !== deletingCampus.id);
    syncCampuses(updated);
    addToast('success', 'Campus Removed', `Removed ${deletingCampus.name} campus.`);
    setDeletingCampus(null);
  };

  const handleOpenAddAY = () => {
    setEditingAY(null);
    setAyForm({
      academicYear: '',
      startDate: '',
      endDate: '',
      status: 'Upcoming',
      description: '',
      isCurrentAcademicYear: false
    });
    setIsAYModalOpen(true);
  };

  const handleOpenEditAY = (ay: AcademicYearMaster) => {
    setEditingAY(ay);
    setAyForm({
      academicYear: ay.academicYear,
      startDate: ay.startDate || '',
      endDate: ay.endDate || '',
      status: ay.status,
      description: ay.description || '',
      isCurrentAcademicYear: ay.isCurrentAcademicYear || false
    });
    setIsAYModalOpen(true);
  };

  const handleSaveAY = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayForm.academicYear.trim()) return;

    if (editingAY) {
      updateAcademicYear(editingAY.id, ayForm);
      addToast('success', 'Academic Year Updated', `Academic year ${ayForm.academicYear} configuration updated.`);
    } else {
      addAcademicYear(ayForm);
      addToast('success', 'Academic Year Added', `Academic year ${ayForm.academicYear} created successfully.`);
    }

    setIsAYModalOpen(false);
  };

  const confirmDeleteAY = () => {
    if (!deletingAY) return;
    deleteAcademicYear(deletingAY.id);
    addToast('success', 'Academic Year Removed', `Academic year ${deletingAY.academicYear} deleted.`);
    setDeletingAY(null);
  };

  const filteredAcademicYears = useMemo(() => {
    return (academicYears || []).filter(ay =>
      (ay.academicYear || '').toLowerCase().includes(aySearch.toLowerCase()) ||
      (ay.description || '').toLowerCase().includes(aySearch.toLowerCase()) ||
      (ay.status || '').toLowerCase().includes(aySearch.toLowerCase())
    );
  }, [academicYears, aySearch]);

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `school_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Backup Exported', 'Downloaded database JSON backup');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-600" /> School Settings
        </h2>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          School Branding Profile
        </button>
        <button
          onClick={() => setActiveTab('campus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'campus' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Campus Configuration ({campuses.length})
        </button>
        <button
          onClick={() => setActiveTab('academic-year')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'academic-year' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Academic Year Configuration ({(academicYears || []).length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'certificates' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Certificate Templates ({certificateTemplates.length})
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'backup' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: SCHOOL BRANDING PROFILE */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">School Profile Setup</h3>
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">School Name *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={e => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Full Address</label>
              <textarea
                rows={2}
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Website URL</label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Principal Name</label>
                <input
                  type="text"
                  value={profileForm.principalName}
                  onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>
            </div>
            <div className="pt-2">
              <SchoolLogoUploader
                value={profileForm.logoUrl || ''}
                onChange={(newLogoUrl) => setProfileForm(prev => ({ ...prev, logoUrl: newLogoUrl }))}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CAMPUS CONFIGURATION */}
      {activeTab === 'campus' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Campus & Branch Master
              </h3>
            </div>
            <button
              onClick={handleOpenAddCampus}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Campus Branch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campuses.map(campus => (
              <div
                key={campus.id}
                className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200 dark:border-slate-800 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    {campus.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    campus.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {campus.status}
                  </span>
                </div>

                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{campus.name}</h4>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{campus.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{campus.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{campus.email}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditCampus(campus)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCampus(campus)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC YEAR CONFIGURATION */}
      {activeTab === 'academic-year' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" /> Academic Year Master & Sessions
              </h3>
            </div>
            <button
              onClick={handleOpenAddAY}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Academic Year
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAcademicYears.map(ay => (
              <div
                key={ay.id}
                className="glass-card p-5 rounded-3xl space-y-3 border border-slate-200 dark:border-slate-800 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                    {ay.academicYear}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    ay.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {ay.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>Start Date: <strong>{formatDateDDMMYYYY(ay.startDate)}</strong></p>
                  <p>End Date: <strong>{formatDateDDMMYYYY(ay.endDate)}</strong></p>
                  {ay.description && <p className="text-slate-400 text-[11px]">{ay.description}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {ay.status !== 'Active' ? (
                    <button
                      onClick={() => {
                        setCurrentAcademicYear(ay.id);
                        addToast('success', 'Current Session Updated', `Set ${ay.academicYear} as active academic session.`);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer"
                    >
                      Set as Active Session
                    </button>
                  ) : (
                    <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Current Active Session
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditAY(ay)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingAY(ay)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATES SETTINGS (NEW CERTIFICATE MODULE CONFIGURATION) */}
      {activeTab === 'certificates' && (
        <CertificateSettingsTab />
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="glass-card p-6 rounded-3xl space-y-4 max-w-xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Database Backup & Recovery
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Export a complete JSON snapshot of all student records, fee ledgers, staff records, and system settings for offline archival.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleBackup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" /> Download JSON Backup
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.userName} ({log.userRole})</td>
                  <td className="py-3 px-4 text-brand-600 font-semibold">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Campus Modal */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingCampus ? 'Edit Campus Branch' : 'Add Campus Branch'}
              </h3>
              <button onClick={() => setIsCampusModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Branch"
                  value={campusForm.name}
                  onChange={e => setCampusForm({ ...campusForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NORTH"
                  value={campusForm.code}
                  onChange={e => setCampusForm({ ...campusForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Full street address..."
                  value={campusForm.address}
                  onChange={e => setCampusForm({ ...campusForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-..."
                    value={campusForm.phone}
                    onChange={e => setCampusForm({ ...campusForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="campus@domain.com"
                    value={campusForm.email}
                    onChange={e => setCampusForm({ ...campusForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                <select
                  value={campusForm.status}
                  onChange={e => setCampusForm({ ...campusForm, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="Active">Active (Displays in Header Selector)</option>
                  <option value="Inactive">Inactive (Hidden from Header Selector)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Campus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campus Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCampus}
        title="Remove Campus Configuration"
        message={`Are you sure you want to remove ${deletingCampus?.name}? This campus will be removed from system configurations.`}
        onConfirm={confirmDeleteCampus}
        onCancel={() => setDeletingCampus(null)}
      />

      {/* Delete Academic Year Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAY}
        title="Remove Academic Year"
        message={`Are you sure you want to remove ${deletingAY?.academicYear}? This session will be removed from system configurations.`}
        onConfirm={confirmDeleteAY}
        onCancel={() => setDeletingAY(null)}
      />
    </div>
  );
};

export default SettingsView;
