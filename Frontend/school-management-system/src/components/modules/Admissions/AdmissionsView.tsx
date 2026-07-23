import React, { useState } from 'react';
import {
  GraduationCap, Plus, Search, Filter, CheckCircle2, UserCheck,
  Building2, Phone, X, Eye, Edit, Trash2, ChevronLeft, ChevronRight, XCircle,
  ArrowLeft, Camera, User, Shield, Home, Bus, Upload, Calculator
} from 'lucide-react';
import { AdmissionApplication, StudentType, Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { validate10DigitPhone, BLOOD_GROUPS, CASTE_CATEGORIES, BRANCHES } from '../../../utils/validation';
import { validateDOB } from '../../../utils/dateValidation';
import { formatCurrency } from '../../../utils/currency';

interface AdmissionsViewProps {
  onSelectStudentProfile?: (student: Student) => void;
}

export const AdmissionsView: React.FC<AdmissionsViewProps> = ({ onSelectStudentProfile }) => {
  const {
    admissions, addAdmission, updateAdmission, deleteAdmission, updateAdmissionStatus, students,
    transportRoutes, hostelBlocks, hostelRooms, hostelBeds, routeMasters, pickupPoints,
    getStudentFeeLedger, dynamicFeeStructures, financeTransportConfigs, hostelMasters, financeHostelConfigs,
    roomMasters, studentHostelAssignments, scholarships, discounts, roomTypeMasters
  } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // View States: Table View vs Full-Page Form View
  const [isFormView, setIsFormView] = useState(false);
  const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(null);
  const [deletingApp, setDeletingApp] = useState<AdmissionApplication | null>(null);
  const [selectedAppForView, setSelectedAppForView] = useState<AdmissionApplication | null>(null);
  const [confirmingApp, setConfirmingApp] = useState<{ app: AdmissionApplication; status: AdmissionApplication['status'] } | null>(null);
  const [feeSummaryStudentId, setFeeSummaryStudentId] = useState<string | null>(null);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  const [formData, setFormData] = useState<Partial<AdmissionApplication>>({
    appliedClass: 'Class 10',
    gender: 'Male',
    dob: '15/08/2012',
    bloodGroup: 'O+',
    religion: 'General',
    casteCategory: 'General',
    parentName: '',
    motherName: '',
    email: '',
    phone: '',
    addressHouseNo: '',
    addressStreet: '',
    addressArea: '',
    addressCity: 'New York',
    addressDistrict: 'Knowledge City',
    addressState: 'NY',
    addressPinCode: '10001',
    siblingsCount: 0,
    siblingStudentId: '',
    studentType: 'Day Scholar',
    transportRequired: true,
    transportType: 'AC',
    busRoute: transportRoutes[0]?.routeName || 'Route A - North Suburbs',
    pickupPoint: 'North Suburbs Stop 4',
    hostelBlock: hostelMasters[0]?.id || '',
    floor: '1st Floor',
    hostelRoom: roomMasters.filter(r => r.hostelId === hostelMasters[0]?.id)[0]?.id || '',
    hostelBed: 'BED-1',
    branch: 'Main Campus',
    documentsSubmitted: ['Birth Certificate', 'Previous Report Card']
  });

  const [phoneError, setPhoneError] = useState('');
  const [altPhoneError, setAltPhoneError] = useState('');
  const [dobError, setDobError] = useState('');

  const handleAltPhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, alternatePhone: cleaned }));

    if (cleaned && cleaned === formData.phone) {
      setAltPhoneError('Alternate mobile cannot be identical to Father primary mobile number');
    } else if (cleaned && cleaned.length > 0 && cleaned.length !== 10) {
      setAltPhoneError('Alternate mobile number must be exactly 10 digits');
    } else {
      setAltPhoneError('');
    }
  };

  // Multi-filter filtering
  const filteredAdmissions = admissions.filter(a => {
    const matchQuery = a.applicantName.toLowerCase().includes(query.toLowerCase()) ||
                      a.applicationNo.toLowerCase().includes(query.toLowerCase()) ||
                      a.parentName.toLowerCase().includes(query.toLowerCase());
    const matchClass = filterClass === 'All' || a.appliedClass === filterClass;
    const matchBranch = filterBranch === 'All' || (a.branch || 'Main Campus') === filterBranch;
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchQuery && matchClass && matchBranch && matchStatus;
  });

  const totalPages = Math.ceil(filteredAdmissions.length / pageSize) || 1;
  const paginated = filteredAdmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const availableBeds = hostelBeds.filter(b => b.status === 'Available');

  const handleOpenAdd = () => {
    setEditingApp(null);
    setFirstName('');
    setLastName('');
    setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    setFormData({
      appliedClass: 'Class 10',
      gender: 'Male',
      dob: '15/08/2012',
      bloodGroup: 'O+',
      religion: 'General',
      casteCategory: 'General',
      parentName: '',
      motherName: '',
      email: '',
      phone: '',
      addressHouseNo: '',
      addressStreet: '',
      addressArea: '',
      addressCity: 'New York',
      addressDistrict: 'Knowledge City',
      addressState: 'NY',
      addressPinCode: '10001',
      siblingsCount: 0,
      siblingStudentId: '',
      studentType: 'Day Scholar',
      transportRequired: true,
      transportType: 'AC',
      busRoute: transportRoutes[0]?.routeName || 'Route A - North Suburbs',
      pickupPoint: 'North Suburbs Stop 4',
      hostelBlock: hostelMasters[0]?.id || '',
      floor: '1st Floor',
      hostelRoom: roomMasters.filter(r => r.hostelId === hostelMasters[0]?.id)[0]?.id || '',
      hostelBed: 'BED-1',
      branch: 'Main Campus',
      scholarshipId: '',
      discountId: '',
      documentsSubmitted: ['Birth Certificate', 'Previous Report Card']
    });
    setPhoneError('');
    setDobError('');
    setIsFormView(true);
  };

  const handleOpenEdit = (app: AdmissionApplication) => {
    setEditingApp(app);
    const parts = app.applicantName.split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setAvatar(app.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    setFormData(app);
    setPhoneError('');
    setDobError('');
    setIsFormView(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        addToast('info', 'Photo Selected', 'Profile photo preview updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  };

  const handlePhoneChange = (val: string) => {
    setFormData(prev => ({ ...prev, phone: val }));
    if (val) {
      const res = validate10DigitPhone(val);
      setPhoneError(res.isValid ? '' : res.error || '');
    } else {
      setPhoneError('Father mobile number is required.');
    }
  };

  const handleDOBChange = (val: string) => {
    setFormData(prev => ({ ...prev, dob: val }));
    if (val) {
      const res = validateDOB(val);
      setDobError(res.isValid ? '' : res.error || '');
    } else {
      setDobError('DOB is required.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !formData.parentName) {
      addToast('warning', 'Missing Required Fields', 'First name, last name, and father name are required.');
      return;
    }

    const phoneValidation = validate10DigitPhone(formData.phone || '');
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid 10-digit phone');
      addToast('error', 'Phone Validation Error', phoneValidation.error);
      return;
    }

    const dobValidation = validateDOB(formData.dob || '');
    if (!dobValidation.isValid) {
      setDobError(dobValidation.error || 'Invalid DOB');
      addToast('error', 'DOB Validation Error', dobValidation.error);
      return;
    }

    const fullApplicantName = `${firstName.trim()} ${lastName.trim()}`;

    if (editingApp) {
      updateAdmission(editingApp.id, {
        ...formData,
        applicantName: fullApplicantName,
        avatar
      });
      addToast('success', 'Application Updated', `Updated details for ${fullApplicantName}`);
    } else {
      addAdmission({
        applicantName: fullApplicantName,
        avatar,
        appliedClass: formData.appliedClass || 'Class 10',
        gender: formData.gender || 'Male',
        dob: formData.dob || '15/08/2012',
        bloodGroup: formData.bloodGroup || 'O+',
        religion: formData.religion || 'General',
        casteCategory: formData.casteCategory || 'General',
        parentName: formData.parentName,
        motherName: formData.motherName || 'N/A',
        email: formData.email || `${fullApplicantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        phone: formData.phone || '9876543210',
        addressHouseNo: formData.addressHouseNo,
        addressStreet: formData.addressStreet,
        addressArea: formData.addressArea,
        addressCity: formData.addressCity,
        addressDistrict: formData.addressDistrict,
        addressState: formData.addressState,
        addressPinCode: formData.addressPinCode,
        siblingsCount: formData.siblingsCount || 0,
        siblingStudentId: formData.siblingStudentId,
        studentType: formData.studentType as StudentType,
        transportRequired: formData.transportRequired,
        transportType: formData.transportType,
        busRoute: formData.busRoute,
        pickupPoint: formData.pickupPoint,
        dropPoint: formData.dropPoint,
        hostelBlock: formData.hostelBlock,
        floor: formData.floor,
        hostelRoom: formData.hostelRoom,
        hostelBed: formData.hostelBed,
        branch: formData.branch || 'Main Campus',
        scholarshipId: formData.scholarshipId,
        discountId: formData.discountId,
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        documentsSubmitted: formData.documentsSubmitted || []
      });

      addToast('success', 'Application Submitted', `Application registered for ${fullApplicantName}`);
    }

    setIsFormView(false);
  };

  const calculateLiveFeePreview = () => {
    const stType = formData.studentType || 'Day Scholar';
    const clsName = formData.appliedClass || 'Class 10';

    const dfs = dynamicFeeStructures.find(d => d.className === clsName && d.status === 'Active') || dynamicFeeStructures[0];
    const baseItems = dfs ? dfs.items : [
      { feeHeadId: 'FH-01', feeHeadName: 'Tuition Fee', amount: 25000 },
      { feeHeadId: 'FH-02', feeHeadName: 'Admission Fee', amount: 5000 },
      { feeHeadId: 'FH-03', feeHeadName: 'Books & Stationery Fee', amount: 4500 },
      { feeHeadId: 'FH-04', feeHeadName: 'Uniform & Sports Kit Fee', amount: 3500 },
      { feeHeadId: 'FH-05', feeHeadName: 'Science & Computer Lab Fee', amount: 2500 }
    ];

    let items: { name: string; amount: number; isApplicable: boolean; remarks?: string }[] = [];

    baseItems.forEach(i => {
      items.push({ name: i.feeHeadName, amount: i.amount, isApplicable: true });
    });

    if (stType === 'Day Scholar') {
      if (formData.transportRequired) {
        const rObj = routeMasters.find(r => r.id === formData.routeId || r.routeName === formData.busRoute);
        const pObj = pickupPoints.find(p => p.id === formData.pickupPointId || (rObj && p.routeId === rObj.id && p.pickupName === formData.pickupPoint));
        const ftc = financeTransportConfigs.find(
          c => (c.routeId === rObj?.id) && (c.pickupPointId === pObj?.id || c.pickupName === pObj?.pickupName) && c.status === 'Active'
        ) || financeTransportConfigs[0];

        const trpFee = ftc ? ftc.feeAmount : 5500;
        items.push({
          name: `Transport Fee (${rObj?.routeName || formData.busRoute || 'Selected Route'})`,
          amount: trpFee,
          isApplicable: true
        });
      } else {
        items.push({
          name: 'Transport Fee',
          amount: 0,
          isApplicable: false,
          remarks: 'Transport Not Opted'
        });
      }

      items.push({
        name: 'Hostel Fee',
        amount: 0,
        isApplicable: false,
        remarks: 'Not Applicable for Day Scholars'
      });
    } else {
      const hObj = hostelMasters.find(h => h.id === formData.hostelBlock || h.hostelName === formData.hostelBlock) || hostelMasters[0];
      const fhc = financeHostelConfigs.find(
        c => (c.hostelId === hObj?.id || c.hostelName === hObj?.hostelName) && c.status === 'Active'
      ) || financeHostelConfigs[0];

      const hstFee = fhc ? fhc.hostelFee : 40000;
      const secDep = fhc ? fhc.securityDeposit : 5000;

      items.push({
        name: `Hostel Fee (${hObj?.hostelName || 'Hostel Accommodation'})`,
        amount: hstFee,
        isApplicable: true
      });

      if (secDep > 0) {
        items.push({
          name: 'Security Deposit',
          amount: secDep,
          isApplicable: true
        });
      }

      items.push({
        name: 'Transport Fee',
        amount: 0,
        isApplicable: false,
        remarks: 'Not Applicable for Hostellers'
      });
    }

    let scholarshipAmount = 0;
    if (formData.scholarshipId) {
      const sObj = scholarships.find(s => s.id === formData.scholarshipId);
      if (sObj && sObj.status === 'Active') {
        const tuitionFeeAmount = baseItems.find(i => i.feeHeadId === 'FH-01' || i.feeHeadName === 'Tuition Fee')?.amount || 25000;
        const sVal = sObj.discountType === 'Percentage' ? (sObj.percentage || 0) : (sObj.fixedAmount || 0);
        scholarshipAmount = sObj.discountType === 'Percentage' ? (tuitionFeeAmount * sVal) / 100 : sVal;
      }
    }

    let discountAmount = 0;
    if (formData.discountId) {
      const dObj = discounts.find(d => d.id === formData.discountId);
      if (dObj && dObj.status === 'Active') {
        const tuitionFeeAmount = baseItems.find(i => i.feeHeadId === 'FH-01' || i.feeHeadName === 'Tuition Fee')?.amount || 25000;
        discountAmount = dObj.mode === 'Percentage' ? (tuitionFeeAmount * dObj.value) / 100 : dObj.value;
      }
    }

    if (scholarshipAmount > 0) {
      items.push({
        name: 'Scholarship Deduction',
        amount: -scholarshipAmount,
        isApplicable: true
      });
    }

    if (discountAmount > 0) {
      items.push({
        name: 'Discount Deduction',
        amount: -discountAmount,
        isApplicable: true
      });
    }

    const totalPayable = items.reduce((acc, i) => acc + (i.isApplicable ? i.amount : 0), 0);

    return { items, totalPayable };
  };

  // FULL-PAGE APPLICATION FORM VIEW
  if (isFormView) {
    return (
      <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto pb-12">
        {/* Full Page Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFormView(false)}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Back to Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                {editingApp ? `Edit Application #${editingApp.applicationNo}` : 'New Student Admission Application'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete student enrollment form with live fee preview, personal, guardian, and facility details</p>
            </div>
          </div>
        </div>

        {/* Full Page Layout with Sticky Live Fee Preview Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Admission Form */}
          <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-slate-900 dark:text-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">

            {/* Profile Photo Upload & Delete Section */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative">
                <img
                  src={avatar}
                  alt="Applicant Photo Preview"
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-brand-500/20 shadow-md"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Applicant Profile Photo</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload a clear passport-sized photo for identity card and official record</p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md transition-all">
                    <Camera className="w-4 h-4" /> Upload Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/40"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Personal Details */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <User className="w-4 h-4" /> 1. Student Personal Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wright"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Applied Class Grade *</label>
                  <select
                    value={formData.appliedClass}
                    onChange={e => setFormData({ ...formData, appliedClass: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Campus / Branch *</label>
                  <select
                    value={formData.branch}
                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Birth (DD/MM/YYYY) *</label>
                  <input
                    type="text"
                    required
                    placeholder="15/08/2012"
                    value={formData.dob}
                    onChange={e => handleDOBChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      dobError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {dobError && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{dobError}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Blood Group *</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Religion</label>
                  <input
                    type="text"
                    placeholder="e.g. Christianity"
                    value={formData.religion}
                    onChange={e => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Caste Category *</label>
                  <select
                    value={formData.casteCategory}
                    onChange={e => setFormData({ ...formData, casteCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    {CASTE_CATEGORIES.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Parent & Guardian Details */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> 2. Parent & Mobile Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Father Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mother Full Name</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">1. Father Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      phoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {phoneError && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{phoneError}</p>}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">2. Mother Mobile Number</label>
                  <input
                    type="text"
                    placeholder="9876543211"
                    value={formData.motherPhone || ''}
                    onChange={e => setFormData({ ...formData, motherPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">3. Alternate Mobile (Optional)</label>
                  <input
                    type="text"
                    placeholder="9876543212"
                    value={formData.alternatePhone || ''}
                    onChange={e => handleAltPhoneChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-slate-900 dark:text-white outline-none ${
                      altPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {altPhoneError && <p className="text-[10px] text-rose-500 mt-0.5 font-bold">{altPhoneError}</p>}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">4. Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Address Breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Home className="w-4 h-4" /> 3. Complete Residential Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">House No</label><input type="text" value={formData.addressHouseNo} onChange={e => setFormData({ ...formData, addressHouseNo: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Street</label><input type="text" value={formData.addressStreet} onChange={e => setFormData({ ...formData, addressStreet: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Area / Locality</label><input type="text" value={formData.addressArea} onChange={e => setFormData({ ...formData, addressArea: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">City</label><input type="text" value={formData.addressCity} onChange={e => setFormData({ ...formData, addressCity: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">District</label><input type="text" value={formData.addressDistrict} onChange={e => setFormData({ ...formData, addressDistrict: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">State</label><input type="text" value={formData.addressState} onChange={e => setFormData({ ...formData, addressState: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none" /></div>
                <div><label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">PIN Code</label><input type="text" value={formData.addressPinCode} onChange={e => setFormData({ ...formData, addressPinCode: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono" /></div>
              </div>
            </div>

            {/* Section 4: Siblings */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">4. Sibling Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Number of Siblings</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.siblingsCount}
                    onChange={e => setFormData({ ...formData, siblingsCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Existing Student Sibling Lookup (Optional)</label>
                  <select
                    value={formData.siblingStudentId}
                    onChange={e => setFormData({ ...formData, siblingStudentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">None / Not Enrolled</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.className})</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Student Type (Conditional Day Scholar vs Hosteller) */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Bus className="w-4 h-4" /> 5. Student Type & Facility Allocation
              </h4>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Student Type *</label>
                <select
                  value={formData.studentType}
                  onChange={e => setFormData({ ...formData, studentType: e.target.value as StudentType })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                >
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Hosteller">Hosteller</option>
                </select>
              </div>

              {/* Conditional Rendering for Day Scholar */}
              {formData.studentType === 'Day Scholar' && (
                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900 dark:text-sky-200">Transport Required?</span>
                    <div className="flex gap-4 font-bold text-slate-900 dark:text-white">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="trans" checked={formData.transportRequired === true} onChange={() => setFormData({ ...formData, transportRequired: true })} /> Yes
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="trans" checked={formData.transportRequired === false} onChange={() => setFormData({ ...formData, transportRequired: false })} /> No
                      </label>
                    </div>
                  </div>

                  {formData.transportRequired && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bus Route (Transport Master)</label>
                        <select
                          value={formData.busRoute}
                          onChange={e => {
                            const rName = e.target.value;
                            const rObj = routeMasters.find(r => r.routeName === rName);
                            const rStops = pickupPoints.filter(p => p.routeId === rObj?.id || p.routeName === rName);
                            setFormData({
                              ...formData,
                              busRoute: rName,
                              pickupPoint: rStops[0]?.pickupName || ''
                            });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                        >
                          {routeMasters.map(r => <option key={r.id} value={r.routeName}>{r.routeName} ({r.routeCode})</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Pickup Point Stop</label>
                        <select
                          value={formData.pickupPoint}
                          onChange={e => setFormData({ ...formData, pickupPoint: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                        >
                          {pickupPoints
                            .filter(p => p.routeName === formData.busRoute || p.routeId === routeMasters.find(r => r.routeName === formData.busRoute)?.id)
                            .map(p => (
                              <option key={p.id} value={p.pickupName}>{p.sequenceNumber}. {p.pickupName} ({p.arrivalTime})</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Rendering for Hosteller (Available Rooms & Beds Only) */}
              {formData.studentType === 'Hosteller' && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3 animate-in fade-in">
                  <h5 className="font-bold text-indigo-900 dark:text-indigo-200">Hostel Bed Allocation</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hostel Block</label>
                      <select
                        value={formData.hostelBlock}
                        onChange={e => {
                          const blockRooms = roomMasters.filter(r => r.hostelId === e.target.value);
                          const firstRoom = blockRooms[0];
                          let firstAvailBed = 'BED-1';
                          if (firstRoom) {
                            const rtObj = roomTypeMasters.find(rt => rt.id === firstRoom.roomTypeId);
                            const rCap = rtObj ? rtObj.capacity : (firstRoom.capacity || 2);
                            for (let i = 1; i <= rCap; i++) {
                              const bedName = `BED-${i}`;
                              const isTaken = studentHostelAssignments.some(
                                a => a.roomId === firstRoom.id && a.bedNo === bedName && a.status === 'Active'
                              );
                              if (!isTaken) {
                                firstAvailBed = bedName;
                                break;
                              }
                            }
                          }
                          setFormData({
                            ...formData,
                            hostelBlock: e.target.value,
                            hostelRoom: firstRoom?.id || '',
                            hostelBed: firstAvailBed
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                      >
                        {hostelMasters.map(b => <option key={b.id} value={b.id}>{b.hostelName} ({b.hostelType})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Room</label>
                      <select
                        value={formData.hostelRoom}
                        onChange={e => {
                          const selectedRoomId = e.target.value;
                          const selectedRoomObj = roomMasters.find(r => r.id === selectedRoomId);
                          let firstAvailBed = 'BED-1';
                          if (selectedRoomObj) {
                            const rtObj = roomTypeMasters.find(rt => rt.id === selectedRoomObj.roomTypeId);
                            const rCap = rtObj ? rtObj.capacity : (selectedRoomObj.capacity || 2);
                            for (let i = 1; i <= rCap; i++) {
                              const bedName = `BED-${i}`;
                              const isTaken = studentHostelAssignments.some(
                                a => a.roomId === selectedRoomId && a.bedNo === bedName && a.status === 'Active'
                              );
                              if (!isTaken) {
                                firstAvailBed = bedName;
                                break;
                              }
                            }
                          }
                          setFormData({
                            ...formData,
                            hostelRoom: selectedRoomId,
                            hostelBed: firstAvailBed
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                      >
                        {roomMasters
                          .filter(r => r.hostelId === formData.hostelBlock)
                          .map(r => {
                            const rtObj = roomTypeMasters.find(rt => rt.id === r.roomTypeId);
                            const rCap = rtObj ? rtObj.capacity : (r.capacity || 2);
                            const rName = rtObj ? rtObj.roomTypeName : (r.roomTypeName || 'Standard Room');
                            const acLabel = rtObj?.acType || 'Non-AC';
                            const occupied = studentHostelAssignments.filter(a => a.roomId === r.id && a.status === 'Active').length;
                            return (
                              <option key={r.id} value={r.id} disabled={occupied >= rCap}>
                                Room #{r.roomNumber} ({rName} - {acLabel}) {occupied >= rCap ? '[FULLY OCCUPIED]' : ''}
                              </option>
                            );
                          })}
                      </select>
                      {(() => {
                        const selRoom = roomMasters.find(r => r.id === formData.hostelRoom);
                        if (selRoom) {
                          const rtObj = roomTypeMasters.find(rt => rt.id === selRoom.roomTypeId);
                          const rCap = rtObj ? rtObj.capacity : (selRoom.capacity || 2);
                          const occupied = studentHostelAssignments.filter(a => a.roomId === selRoom.id && a.status === 'Active').length;
                          const avail = Math.max(0, rCap - occupied);
                          return (
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">
                              Occupancy: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{occupied} / {rCap}</span> Beds ({avail} Bed{avail !== 1 ? 's' : ''} Available) {avail === 0 && <span className="text-rose-500 font-black ml-1">[Fully Occupied]</span>}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Bed</label>
                      <select
                        value={formData.hostelBed}
                        onChange={e => setFormData({ ...formData, hostelBed: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold outline-none animate-in fade-in"
                      >
                        {(() => {
                          const selRoom = roomMasters.find(r => r.id === formData.hostelRoom);
                          const rtObj = selRoom ? roomTypeMasters.find(rt => rt.id === selRoom.roomTypeId) : null;
                          const rCap = rtObj ? rtObj.capacity : (selRoom ? (selRoom.capacity || 2) : 2);
                          const beds = Array.from({ length: rCap }, (_, idx) => `BED-${idx + 1}`);

                          return beds.map(bed => {
                            const isTaken = studentHostelAssignments.some(
                              a => a.roomId === formData.hostelRoom && a.bedNo === bed && a.status === 'Active'
                            ) || (admissions.some(
                              app => app.hostelRoom === formData.hostelRoom && app.hostelBed === bed && app.status === 'Pending' && app.id !== editingApp?.id
                            ));
                            return (
                              <option key={bed} value={bed} disabled={isTaken}>
                                {bed} {isTaken ? '[Occupied]' : '[Available]'}
                              </option>
                            );
                          });
                        })()}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {/* Financial Benefits Section */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3 animate-in fade-in">
                <h5 className="font-bold text-indigo-900 dark:text-indigo-200">Financial Benefits</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Scholarship</label>
                    <select
                      value={formData.scholarshipId || ''}
                      onChange={e => setFormData({ ...formData, scholarshipId: e.target.value || undefined })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                    >
                      <option value="">None</option>
                      {scholarships.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.discountType === 'Percentage' ? `${s.percentage}%` : formatCurrency(s.fixedAmount || 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Discount</label>
                    <select
                      value={formData.discountId || ''}
                      onChange={e => setFormData({ ...formData, discountId: e.target.value || undefined })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                    >
                      <option value="">None</option>
                      {discounts.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.mode === 'Percentage' ? `${d.value}%` : formatCurrency(d.value)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormView(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
              >
                {editingApp ? 'Save Application Changes' : 'Submit Admission Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Column: Sticky Live Fee Preview Panel */}
        {(() => {
          const liveFee = calculateLiveFeePreview();
          return (
            <div className="lg:col-span-1 glass-card p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl sticky top-20 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-400" /> Instant Live Fee Preview
                  </h3>
                  <p className="text-[10px] text-slate-400">Updates live as form values change</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 font-extrabold text-[10px] border border-sky-800">
                  {formData.studentType || 'Day Scholar'}
                </span>
              </div>

              {/* Line Items */}
              <div className="space-y-2 text-xs">
                {liveFee.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between py-1.5 px-2.5 rounded-xl transition-all ${
                      item.isApplicable
                        ? 'bg-slate-800/80 border border-slate-700/60'
                        : 'bg-slate-950/40 text-slate-500 border border-slate-900'
                    }`}
                  >
                    <span className={`font-bold flex items-center gap-1.5 ${item.isApplicable ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                      {item.isApplicable ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span className="truncate max-w-[170px]">{item.name}</span>
                    </span>
                    <span className={item.isApplicable ? 'font-black text-white' : 'text-[10px] italic text-slate-500'}>
                      {item.isApplicable ? formatCurrency(item.amount) : (item.remarks || 'Not Applicable')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-800/60 space-y-1">
                <p className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">Total Estimated Payable</p>
                <h4 className="text-2xl font-black text-emerald-300">{formatCurrency(liveFee.totalPayable)}</h4>
                <p className="text-[10px] text-slate-400">Permanent Student Fee Ledger will be generated upon admission enrollment.</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

  // DEFAULT DIRECTORY TABLE VIEW
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" /> Admission Applications Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">View submitted applications table, edit or delete records, and enroll students into active database</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Submit Application
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by applicant, reg no, or father name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Branch:</span>
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Branches</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Class:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Classes</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Enrolled">Enrolled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table Format View */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Application Reg No</th>
                <th className="py-3.5 px-4">Applicant Student</th>
                <th className="py-3.5 px-4">Applied Class</th>
                <th className="py-3.5 px-4">Branch & Type</th>
                <th className="py-3.5 px-4">Father Contact</th>
                <th className="py-3.5 px-4">Blood & Caste</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions & Enrollment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500">No matching admission applications found.</td></tr>
              ) : (
                paginated.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{app.applicationNo}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={app.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} alt="" className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{app.applicantName}</p>
                          <p className="text-[10px] text-slate-400">DOB: {app.dob} • {app.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{app.appliedClass}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-700 dark:text-amber-300 block">{app.branch || 'Main Campus'}</span>
                      <span className="text-[10px] text-slate-400 block">{app.studentType}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 dark:text-slate-200">{app.parentName}</p>
                      <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">{app.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-500">{app.bloodGroup}</span>
                      <span className="block text-[10px] text-slate-400">{app.casteCategory}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={app.status === 'Approved' ? 'success' : app.status === 'Verified' ? 'info' : app.status === 'Enrolled' ? 'success' : app.status === 'Rejected' ? 'danger' : 'neutral'}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAppForView(app)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Application Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400"
                          title="Edit Application"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingApp(app)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400"
                          title="Delete Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Strict Status Options */}
                        {app.status === 'Enrolled' ? (
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Enrolled
                          </span>
                        ) : app.status === 'Rejected' ? (
                          <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Rejected
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmingApp({ app, status: 'Rejected' })}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 font-bold text-xs"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => setConfirmingApp({ app, status: 'Enrolled' })}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Enroll Student
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Showing {paginated.length} of {filteredAdmissions.length} admission applications</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-bold text-slate-900 dark:text-white">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* View Application Details Modal */}
      {selectedAppForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Application #{selectedAppForView.applicationNo}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedAppForView.applicantName} ({selectedAppForView.appliedClass})</p>
              </div>
              <button onClick={() => setSelectedAppForView(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div><span className="text-slate-400">Gender & DOB:</span> <p className="font-bold">{selectedAppForView.gender} • {selectedAppForView.dob}</p></div>
                <div><span className="text-slate-400">Blood & Caste:</span> <p className="font-bold text-rose-500">{selectedAppForView.bloodGroup} • {selectedAppForView.casteCategory}</p></div>
                <div><span className="text-slate-400">Father Name:</span> <p className="font-bold">{selectedAppForView.parentName}</p></div>
                <div><span className="text-slate-400">Father Phone:</span> <p className="font-bold text-emerald-600 font-mono">{selectedAppForView.phone}</p></div>
                <div><span className="text-slate-400">Student Type:</span> <p className="font-bold text-brand-600">{selectedAppForView.studentType}</p></div>
                <div><span className="text-slate-400">Branch:</span> <p className="font-bold text-amber-600">{selectedAppForView.branch || 'Main Campus'}</p></div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button onClick={() => setSelectedAppForView(null)} className="px-4 py-2 font-bold bg-slate-100 dark:bg-slate-800 rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Application Modal */}
      <ConfirmModal
        isOpen={!!deletingApp}
        title="Delete Admission Application"
        message={`Are you sure you want to delete application #${deletingApp?.applicationNo} for ${deletingApp?.applicantName}?`}
        confirmLabel="Delete Application"
        onConfirm={() => {
          if (deletingApp) {
            deleteAdmission(deletingApp.id);
            addToast('success', 'Application Removed', `Deleted application #${deletingApp.applicationNo}`);
            setDeletingApp(null);
          }
        }}
        onCancel={() => setDeletingApp(null)}
      />

      {/* Confirmation Modal for Enrollment & Status Updates */}
      <ConfirmModal
        isOpen={!!confirmingApp}
        title={confirmingApp?.status === 'Enrolled' ? 'Confirm Student Enrollment' : 'Confirm Application Rejection'}
        message={
          confirmingApp?.status === 'Enrolled'
            ? `Are you sure you want to enroll applicant ${confirmingApp?.app.applicantName}? This will create their student record and transfer all data into Student Management.`
            : `Are you sure you want to reject application #${confirmingApp?.app.applicationNo}?`
        }
        confirmLabel={confirmingApp?.status === 'Enrolled' ? 'Enroll Student' : 'Reject Application'}
        onConfirm={() => {
          if (confirmingApp) {
            updateAdmissionStatus(confirmingApp.app.id, confirmingApp.status);
            if (confirmingApp.status === 'Enrolled') {
              const matchedSt = students.find(s => s.admissionNo === confirmingApp.app.applicationNo || s.phone === confirmingApp.app.phone);
              if (matchedSt) {
                setFeeSummaryStudentId(matchedSt.id);
              } else {
                setFeeSummaryStudentId(students[0]?.id || 'STU-001');
              }
            }
            addToast(
              confirmingApp.status === 'Enrolled' ? 'success' : 'info',
              confirmingApp.status === 'Enrolled' ? 'Student Enrolled' : 'Application Rejected',
              confirmingApp.status === 'Enrolled' ? `Student record created for ${confirmingApp.app.applicantName}` : `Application #${confirmingApp.app.applicationNo} rejected`
            );
            setConfirmingApp(null);
          }
        }}
        onCancel={() => setConfirmingApp(null)}
      />

      {/* Post-Admission Permanent Fee Ledger Summary Modal */}
      {feeSummaryStudentId && (() => {
        const ledger = getStudentFeeLedger(feeSummaryStudentId);
        if (!ledger) return null;

        const appliedFeeItems = ledger.feeItems.filter(i => i.isApplicable && i.originalAmount > 0);
        const notApplicableItems = ledger.feeItems.filter(i => !i.isApplicable);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Admission Completed Successfully
                  </h3>
                  <p className="text-xs text-slate-500">Student Fee Ledger generated & initialized</p>
                </div>
                <button onClick={() => setFeeSummaryStudentId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {/* Student Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Student Name:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{ledger.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Admission No:</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{ledger.admissionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Class & Section:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{ledger.className} - {ledger.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Student Type:</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">{ledger.studentType}</span>
                </div>
              </div>

              {/* Applied Fees List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Fee Heads</h4>
                <div className="space-y-1.5 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-white dark:bg-slate-950">
                  {appliedFeeItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {item.headName}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{formatCurrency(item.originalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Not Applicable Fees List */}
              {notApplicableItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Applicable</h4>
                  <div className="space-y-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
                    {notApplicableItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5 text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> {item.headName}
                        </span>
                        <span className="text-[10px] italic">{item.remarks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions & Net Payable */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-2 text-xs">
                {ledger.totalScholarship > 0 && (
                  <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                    <span>Scholarship Deduction:</span>
                    <span>- {formatCurrency(ledger.totalScholarship)}</span>
                  </div>
                )}
                {ledger.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                    <span>Discount / Concession:</span>
                    <span>- {formatCurrency(ledger.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
                  <span className="text-sm font-black text-emerald-950 dark:text-emerald-100 uppercase">Total Payable</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(ledger.totalPayable)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs text-slate-700 dark:text-slate-300 text-center"
                >
                  Print Fee Summary
                </button>
                <button
                  onClick={() => {
                    const text = `STUDENT FEE SUMMARY\nName: ${ledger.studentName}\nAdm No: ${ledger.admissionNo}\nClass: ${ledger.className}-${ledger.section}\nStudent Type: ${ledger.studentType}\nTotal Payable: ${formatCurrency(ledger.totalPayable)}`;
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `FeeSummary_${ledger.admissionNo}.txt`;
                    a.click();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 font-bold text-xs text-sky-800 dark:text-sky-300 text-center"
                >
                  Download Summary
                </button>
                <button
                  onClick={() => {
                    setFeeSummaryStudentId(null);
                    addToast('info', 'Navigating to Fee Collection', `Select ${ledger.studentName} in Fee Collection to record payment.`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white text-center shadow-md shadow-emerald-500/20"
                >
                  Fee Collection
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
